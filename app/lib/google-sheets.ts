import { google } from 'googleapis';

export interface SheetData {
  invoiceNumber: string;
  customerName: string;
}

export const fetchFromSheets = async (spreadsheetId: string, range: string): Promise<SheetData[]> => {
  // Authentication should be handled via Service Account (JSON key file or Env Vars)
  // For now, this assumes GOOGLE_APPLICATION_CREDENTIALS is set in .env
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // Assuming Column B (Index 1) is Customer Name and Column C (Index 2) is Invoice Number
    // as per the logic in JntReconciliation file upload
    return rows.slice(1).map((row) => ({
      customerName: String(row[1] || 'Unknown').trim(),
      invoiceNumber: String(row[2] || '').trim(),
    })).filter(item => item.invoiceNumber !== '');
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw error;
  }
};
