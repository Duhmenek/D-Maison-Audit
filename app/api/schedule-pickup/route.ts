import { NextResponse } from 'next/server';
import { EXPECTED_PARCELS, ParcelStatus } from '@/app/lib/data';

export async function POST(request: Request) {
  try {
    const { invoiceNumbers, courierName, scheduledDate } = await request.json();

    if (!invoiceNumbers || !Array.isArray(invoiceNumbers) || invoiceNumbers.length === 0) {
      return NextResponse.json({ error: "No parcels selected" }, { status: 400 });
    }

    const batchId = `MNF-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Logic: In a real DB, we would run:
    // db.parcel.updateMany({ where: { trackingNumber: { in: invoiceNumbers } }, data: { status: 'SCHEDULED_FOR_PICKUP', batchId, scheduledAt: timestamp } })
    
    // For this prototype, we'll return the confirmation and the manifest details
    return NextResponse.json({
      success: true,
      message: `Manifest ${batchId} created successfully.`,
      manifest: {
        batchId,
        courierName,
        scheduledDate,
        parcelCount: invoiceNumbers.length,
        timestamp
      },
      updatedInvoices: invoiceNumbers
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
