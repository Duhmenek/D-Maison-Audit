import * as XLSX from 'xlsx';
import { dbService } from './db';

export interface OneDriveInvoice {
  invoiceNumber: string;
  customerName: string;
  orderDate?: string;
  amount?: number;
}

/**
 * Converts a OneDrive shared URL into a direct download link using the Microsoft Graph API method.
 * This works for "Anyone with the link" shares in 2026.
 */
export const convertToDirectDownload = (sharedUrl: string): string => {
  try {
    // 1. Base64 encode the entire URL
    const b64 = Buffer.from(sharedUrl).toString('base64');
    
    // 2. Format for u! API (No padding, replace characters)
    const encoded = b64
      .replace(/=/g, '')
      .replace(/\//g, '_')
      .replace(/\+/g, '-');
      
    return `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`;
  } catch (e) {
    console.error('Encoding error:', e);
    return sharedUrl;
  }
};

export const syncFromOneDrive = async (url: string) => {
  // Use the API method first as it's the most robust in 2026
  const directUrl = convertToDirectDownload(url);
  console.log('[SYNC] Attempting OneDrive download via API:', directUrl);
  
  try {
    let response = await fetch(directUrl);
    
    // If the API method fails, try the download=1 parameter method as a fallback
    if (!response.ok) {
      console.warn(`[SYNC] API method failed (${response.status}). Trying fallback...`);
      const fallbackUrl = url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
      response = await fetch(fallbackUrl);
    }

    if (!response.ok) {
      throw new Error(`OneDrive download failed with status ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return processBuffer(buffer);
  } catch (error: any) {
    console.error('OneDrive Sync Error:', error.message);
    throw error;
  }
};

const processBuffer = (buffer: ArrayBuffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON (header: 1 returns an array of arrays)
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData || jsonData.length < 2) {
      console.warn('[SYNC] OneDrive file is empty or has no data rows.');
      return [];
    }

    // Identify columns based on header (Optional but recommended)
    // For now, we'll use the mapping you implied: 
    // Column A (0): Invoice Number
    // Column B (1): Customer Name
    const invoices: OneDriveInvoice[] = jsonData.slice(1)
      .map((row: any[]) => ({
        invoiceNumber: String(row[0] || '').trim(),
        customerName: String(row[1] || 'Unknown').trim(),
      }))
      .filter(inv => inv.invoiceNumber !== '' && inv.invoiceNumber !== 'undefined');

    console.log(`[SYNC] Successfully parsed ${invoices.length} invoices from OneDrive.`);

    // Persistent Delta Syncing
    invoices.forEach(inv => {
      dbService.upsertInvoice({
        invoice_number: inv.invoiceNumber,
        customer_name: inv.customerName,
        status: 'PENDING'
      });
    });

    return invoices;
  } catch (err: any) {
    throw new Error(`Failed to parse Excel file: ${err.message}`);
  }
};
