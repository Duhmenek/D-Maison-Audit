import { JTExpressService, JTVerificationResult } from './jt-integration';
import { Parcel, ParcelStatus, EXPECTED_PARCELS } from './data';

export class SyncService {
  /**
   * Syncs a single parcel by its internal invoice number
   */
  static async syncParcel(invoiceNo: string): Promise<Parcel | null> {
    const parcelIdx = EXPECTED_PARCELS.findIndex(p => p.trackingNumber === invoiceNo);
    if (parcelIdx === -1) return null;

    const parcel = EXPECTED_PARCELS[parcelIdx];

    try {
      // 1. Fetch data from J&T System
      const jtResult = await JTExpressService.verifyInvoice(invoiceNo);

      if (!jtResult.isValid) {
        parcel.syncError = 'NOT_FOUND_IN_JT_PORTAL';
        parcel.lastSyncedAt = new Date().toISOString();
        return parcel;
      }

      // 2. Map J&T Data to our Internal Database
      parcel.jtWaybillNumber = jtResult.jtTrackingNumber || undefined;
      parcel.lastSyncedAt = jtResult.lastUpdate;
      parcel.syncError = undefined;

      // 3. Automatic Status Update: "Picked up" -> "OUT_FOR_DELIVERY"
      if (jtResult.courierStatus === 'PICKED_UP' && parcel.status === 'IN_BUILDING') {
        parcel.status = 'OUT_FOR_DELIVERY';
        console.log(`[SYNC] Parcel ${invoiceNo} updated to OUT_FOR_DELIVERY. Waybill: ${parcel.jtWaybillNumber}`);
      } else if (jtResult.courierStatus === 'IN_TRANSIT') {
        parcel.status = 'OUT_FOR_DELIVERY';
      }

      return parcel;
    } catch (error) {
      console.error(`[SYNC ERROR] Failed for ${invoiceNo}:`, error);
      parcel.syncError = 'SYNC_FAILED_NETWORK_ERROR';
      parcel.lastSyncedAt = new Date().toISOString();
      return parcel;
    }
  }

  /**
   * Background process to sync all pending parcels
   */
  static async syncAllPending(): Promise<void> {
    const pendingParcels = EXPECTED_PARCELS.filter(p => p.status !== 'DELIVERED');
    
    console.log(`[SYNC] Starting batch sync for ${pendingParcels.length} parcels...`);
    
    for (const parcel of pendingParcels) {
      await this.syncParcel(parcel.trackingNumber);
    }
    
    console.log('[SYNC] Batch sync completed.');
  }
}
