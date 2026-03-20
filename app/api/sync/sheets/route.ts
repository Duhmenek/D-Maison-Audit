import { NextResponse } from 'next/server';
import { fetchFromSheets } from '@/app/lib/google-sheets';
import { dbService } from '@/app/lib/db';

export async function GET() {
  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
  const RANGE = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:C';

  if (!SPREADSHEET_ID) {
    return NextResponse.json({ error: 'Google Sheets ID not configured' }, { status: 400 });
  }

  try {
    const sheetData = await fetchFromSheets(SPREADSHEET_ID, RANGE);

    // Sync to SQLite
    sheetData.forEach((item) => {
      dbService.upsertInvoice({
        invoice_number: item.invoiceNumber,
        customer_name: item.customerName,
        status: 'PENDING',
      });
    });

    const allInvoices = dbService.getAllInvoices();
    return NextResponse.json({ 
      success: true, 
      count: sheetData.length,
      data: allInvoices
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { invoiceNumber, status, scanTime } = await req.json();
    if (!invoiceNumber || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    dbService.updateScanStatus(invoiceNumber, status, scanTime);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
