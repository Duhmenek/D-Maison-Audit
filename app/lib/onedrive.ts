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
    let urlToEncode = sharedUrl;
    
    // For 1drv.ms short links, we need to encode the full URL
    // For live.com long links with redeem, we can extract the base
    if (sharedUrl.includes('redeem=')) {
      const urlObj = new URL(sharedUrl);
      const redeem = urlObj.searchParams.get('redeem');
      if (redeem) {
        // Use the base64 redeem URL directly as our source
        urlToEncode = Buffer.from(redeem, 'base64').toString();
        if (urlToEncode.includes('?')) {
          urlToEncode = urlToEncode.split('?')[0];
        }
      }
    }

    // Standard Microsoft Graph API method for creating a direct link
    const b64 = Buffer.from(urlToEncode).toString('base64');
    const encoded = b64
      .replace(/=/g, '')
      .replace(/\//g, '_')
      .replace(/\+/g, '-');
      
    return `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`;
  } catch (e) {
    return sharedUrl;
  }
};

export const syncFromOneDrive = async (url: string) => {
  // Method 1: The official API Direct Link
  const directUrl = convertToDirectDownload(url);
  console.log('[SYNC] Trying Method 1 (u! API):', directUrl);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/octet-stream, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  try {
    let response = await fetch(directUrl, { headers });
    
    // Method 2: Fallback to download=1 on the share link
    if (!response.ok) {
      console.warn(`[SYNC] Method 1 failed (${response.status}). Trying Method 2 (download=1)...`);
      const downloadUrl = url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
      response = await fetch(downloadUrl, { headers });
    }
    
    // Method 3: If it's a 1drv.ms link, try to follow it manually
    if (!response.ok && url.includes('1drv.ms')) {
       console.warn(`[SYNC] Method 2 failed. Trying Method 3 (direct short link mapping)...`);
       // Some 1drv.ms links work by replacing 'x' with 'u' and adding download=1
       const modUrl = url.replace('/x/', '/u/').split('?')[0] + '?download=1';
       response = await fetch(modUrl, { headers });
    }

    if (!response.ok) {
      throw new Error(`OneDrive download failed (Status ${response.status})`);
    }

    const buffer = await response.arrayBuffer();
    
    // Detect HTML response early
    const firstBytes = new Uint8Array(buffer.slice(0, 10));
    const headerText = new TextDecoder().decode(firstBytes).toLowerCase();
    if (headerText.includes('<!doc') || headerText.includes('<html')) {
       throw new Error('OneDrive returned a login/preview page instead of the file. Ensure the file is shared with "Anyone with the link".');
    }

    return await processBuffer(buffer);
  } catch (error: any) {
    console.error('OneDrive Sync Error:', error.message);
    throw error;
  }
};

const processBuffer = async (buffer: ArrayBuffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Look for 'monitoring sheet' specifically
    let worksheet = workbook.Sheets['monitoring sheet'];
    if (!worksheet) {
      console.warn("[SYNC] 'monitoring sheet' not found, using first sheet available.");
      const firstSheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[firstSheetName];
    }
    
    // Convert to JSON (header: 1 returns an array of arrays)
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData || jsonData.length < 2) {
      console.warn('[SYNC] OneDrive file is empty or has no data rows.');
      return [];
    }

    // Mapping based on user request: monitoring sheet B:C
    // Column B (1): Customer Name
    // Column C (2): Invoice Number
    const invoices: OneDriveInvoice[] = jsonData.slice(1)
      .map((row: any[]) => ({
        invoiceNumber: String(row[2] || '').trim(),
        customerName: String(row[1] || 'Unknown').trim(),
      }))
      .filter(inv => inv.invoiceNumber !== '' && inv.invoiceNumber !== 'undefined');

    console.log(`[SYNC] Successfully parsed ${invoices.length} invoices from OneDrive.`);

    // Persistent Delta Syncing
    for (const inv of invoices) {
      await dbService.upsertInvoice({
        invoice_number: inv.invoiceNumber,
        customer_name: inv.customerName,
        status: 'PENDING'
      });
    }

    return invoices;
  } catch (err: any) {
    throw new Error(`Failed to parse Excel file: ${err.message}`);
  }
};
