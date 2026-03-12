import { NextResponse } from 'next/server';
import { SyncService } from '@/app/lib/sync-service';

/**
 * POST /api/sync
 * Body (Optional): { "invoiceNo": "157856" }
 * 
 * If invoiceNo is provided, it syncs only that parcel.
 * If no body is provided, it triggers a batch sync for all pending parcels.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { invoiceNo } = body;

    if (invoiceNo) {
      console.log(`[API] Manually triggering sync for Invoice: ${invoiceNo}`);
      const updatedParcel = await SyncService.syncParcel(invoiceNo);
      
      if (!updatedParcel) {
        return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
      }

      return NextResponse.json({
        message: 'Sync completed for single parcel',
        parcel: updatedParcel
      });
    }

    // Batch sync
    console.log('[API] Manually triggering batch sync for all pending parcels');
    await SyncService.syncAllPending();

    return NextResponse.json({
      message: 'Batch sync process initiated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API SYNC ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
