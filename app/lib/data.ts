export type ParcelStatus = 'IN_BUILDING' | 'SCHEDULED_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface Parcel {
  trackingNumber: string; // Internal Invoice Number
  jtWaybillNumber?: string; // J&T Tracking Number
  recipient: string;
  destination: string;
  status: ParcelStatus;
  batchId?: string;
  scheduledAt?: string;
  courierName?: string;
  lastSyncedAt?: string;
  syncError?: string;
}

export interface PickupManifest {
  batchId: string;
  courierName: string;
  driverName?: string;
  plateNumber?: string;
  scheduledDate: string;
  parcelCount: number;
}

export const EXPECTED_PARCELS: Parcel[] = [
  { trackingNumber: '157856', recipient: 'Juan Luna', destination: 'Manila', status: 'IN_BUILDING' },
  { trackingNumber: '156946', recipient: 'Maria Clara', destination: 'Cebu', status: 'IN_BUILDING' },
  { trackingNumber: '158231', recipient: 'Jose Rizal', destination: 'Davao', status: 'IN_BUILDING' },
  { trackingNumber: '159402', recipient: 'Gabriela Silang', destination: 'Baguio', status: 'IN_BUILDING' },
  { trackingNumber: '155118', recipient: 'Andres Bonifacio', destination: 'Iloilo', status: 'OUT_FOR_DELIVERY', courierName: 'FedEx' },
];

export const PICKUP_MANIFESTS: PickupManifest[] = [];
