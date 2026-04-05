import { NextResponse } from 'next/server';
import { syncFromOneDrive } from '@/app/lib/onedrive';
import { dbService } from '@/app/lib/db';

export async function GET() {
  const ONEDRIVE_URL = process.env.ONEDRIVE_URL;
  if (!ONEDRIVE_URL) {
    return NextResponse.json({ error: 'OneDrive URL not configured' }, { status: 400 });
  }

  try {
    const syncedData = await syncFromOneDrive(ONEDRIVE_URL);
    const allInvoices = await dbService.getAllInvoices();

    return NextResponse.json({
      success: true,
      newCount: syncedData.length,
      totalCount: allInvoices.length,
      data: allInvoices
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'OneDrive sync failed' }, { status: 500 });
  }
}
