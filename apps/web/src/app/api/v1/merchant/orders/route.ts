import { NextRequest, NextResponse } from 'next/server';
import { requireActiveVerifiedMerchant } from '../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  const guard = await requireActiveVerifiedMerchant(req);
  if (!guard.ok) return guard.response;

  try {
    const prisma = getPrisma();
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: { vendorId: guard.merchant.vendorId },
      include: {
        order: true,
        items: true,
        shipments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      orders: vendorOrders.map((vo) => {
        const snap = (vo.order.shippingAddressSnapshot || {}) as Record<string, unknown>;
        return {
          id: vo.id,
          vendorOrderNumber: vo.vendorOrderNumber,
          customerName: `${String(snap.firstName || '')} ${String(snap.lastName || '')}`.trim() || 'Customer',
          deliveryCity: String(snap.city || ''),
          deliveryState: String(snap.stateOrRegion || ''),
          itemsSummary: vo.items.map((i) => `${i.quantity}x ${i.title}`).join(', '),
          subtotalMinorNGN: Number(vo.subtotalMinor),
          commissionMinorNGN: Number(vo.commissionAmountMinor),
          netPayableMinorNGN: Number(vo.vendorPayableMinor),
          status: vo.status,
          carrier: vo.carrier || vo.shipments[0]?.carrier || null,
          trackingNumber: vo.trackingNumber || vo.shipments[0]?.trackingCode || null,
          createdAt: vo.createdAt.toISOString(),
        };
      }),
    });
  } catch (err) {
    return handleServerError(err);
  }
}
