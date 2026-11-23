import { NextRequest, NextResponse } from 'next/server';
import { requireActiveVerifiedMerchant } from '../../../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  const guard = await requireActiveVerifiedMerchant(req);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await context.params;
    const body = (await req.json()) as { carrier?: string; trackingNumber?: string };
    const carrier = body.carrier?.trim() || '';
    const trackingNumber = body.trackingNumber?.trim() || '';

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { message: 'Logistics carrier and tracking number are required to confirm dispatch.' },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const vendorOrder = await prisma.vendorOrder.findFirst({
      where: { id, vendorId: guard.merchant.vendorId },
    });
    if (!vendorOrder) {
      return NextResponse.json({ message: 'Vendor order not found.' }, { status: 404 });
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.vendorOrder.update({
        where: { id: vendorOrder.id },
        data: {
          status: 'SHIPPED',
          carrier,
          trackingNumber,
          shippedAt: now,
        },
      });

      await tx.shipment.upsert({
        where: { trackingCode: trackingNumber },
        update: { carrier, status: 'IN_TRANSIT' },
        create: {
          vendorOrderId: vendorOrder.id,
          trackingCode: trackingNumber,
          carrier,
          status: 'IN_TRANSIT',
        },
      });
    });

    return NextResponse.json(
      { id: vendorOrder.id, status: 'SHIPPED', carrier, trackingNumber },
      { status: 200 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
