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
    const body = (await req.json()) as { delta?: number; onHand?: number };
    const prisma = getPrisma();

    const product = await prisma.product.findFirst({
      where: { id, vendorId: guard.merchant.vendorId },
      include: { variants: { include: { inventory: true }, take: 1 } },
    });

    if (!product || !product.variants[0]) {
      return NextResponse.json({ message: 'Product listing not found for your store.' }, { status: 404 });
    }

    const variant = product.variants[0];
    const currentOnHand = variant.inventory?.onHand || 0;
    const nextOnHand =
      typeof body.onHand === 'number'
        ? Math.max(0, Math.floor(body.onHand))
        : Math.max(0, currentOnHand + Math.trunc(Number(body.delta || 0)));

    await prisma.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: { onHand: nextOnHand },
      create: { variantId: variant.id, onHand: nextOnHand, reserved: 0, safetyStock: 1 },
    });

    return NextResponse.json({ id: product.id, stockCount: nextOnHand }, { status: 200 });
  } catch (err) {
    return handleServerError(err);
  }
}
