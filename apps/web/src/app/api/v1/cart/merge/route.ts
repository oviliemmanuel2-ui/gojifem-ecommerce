import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_AUTH_MESSAGE } from '../../../../../lib/authRedirect';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import {
  getPrisma,
  handleServerError,
  isDatabaseConfigured,
} from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return NextResponse.json(
      { message: CHECKOUT_AUTH_MESSAGE, code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      items?: { variantId?: string; quantity?: number }[];
    };
    const items = Array.isArray(body.items) ? body.items : [];

    if (!isDatabaseConfigured() || items.length === 0) {
      return NextResponse.json({
        synced: false,
        mergedCount: items.length,
      });
    }

    const prisma = getPrisma();
    const deduped = new Map<string, number>();
    for (const item of items) {
      if (!item?.variantId) continue;
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      deduped.set(item.variantId, (deduped.get(item.variantId) || 0) + qty);
    }

    const candidateIds = Array.from(deduped.keys());
    const validVariants = await prisma.productVariant.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true },
    });

    if (validVariants.length === 0) {
      return NextResponse.json({
        synced: true,
        mergedCount: 0,
      });
    }

    let cart = await prisma.cart.findFirst({ where: { userId: authUser.sub } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: authUser.sub } });
    }

    for (const v of validVariants) {
      const desiredQty = deduped.get(v.id) || 1;
      await prisma.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId: v.id,
          },
        },
        update: { quantity: desiredQty },
        create: {
          cartId: cart.id,
          variantId: v.id,
          quantity: desiredQty,
        },
      });
    }

    return NextResponse.json({
      synced: true,
      mergedCount: validVariants.length,
    });
  } catch (err) {
    return handleServerError(err);
  }
}
