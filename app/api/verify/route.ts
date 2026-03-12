import { NextResponse } from 'next/server';
import { EXPECTED_PARCELS } from '@/app/lib/data';
import { JTExpressService } from '@/app/lib/jt-integration';

export async function POST(request: Request) {
  const { trackingNumber } = await request.json(); // trackingNumber = Invoice Number here

  if (!trackingNumber) {
    return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 });
  }

  // 1. Check Internal Record (Our expected parcels)
  const internalParcel = EXPECTED_PARCELS.find((p) => p.trackingNumber === trackingNumber);

  // 2. Cross-Verify with J&T Network
  const jtResult = await JTExpressService.verifyInvoice(trackingNumber);

  if (internalParcel && jtResult.isValid) {
    return NextResponse.json({
      success: true,
      message: 'Verified by J&T Express!',
      parcel: {
        ...internalParcel,
        jtTrackingNumber: jtResult.jtTrackingNumber,
        courierStatus: jtResult.courierStatus,
        lastJTSync: jtResult.lastUpdate,
      },
    });
  } else if (!jtResult.isValid) {
    return NextResponse.json({
      success: false,
      message: 'Invoice not found in J&T Express Database!',
    }, { status: 404 });
  } else {
    return NextResponse.json({
      success: false,
      message: 'Invoice valid but not scheduled for current audit.',
    }, { status: 404 });
  }
}
