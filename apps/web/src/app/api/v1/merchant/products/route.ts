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
    const products = await prisma.product.findMany({
      where: { vendorId: guard.merchant.vendorId },
      include: {
        category: true,
        variants: {
          include: { inventory: true },
          take: 1,
        },
        media: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      merchantStatus: guard.merchant.accountStatus,
      products: products.map((p) => {
        const primaryVariant = p.variants[0];
        return {
          id: p.id,
          variantId: primaryVariant?.id || null,
          sku: primaryVariant?.sku || 'N/A',
          title: p.title,
          slug: p.slug,
          category: p.category.name,
          priceMinorNGN: Number(primaryVariant?.priceMinor || 0n),
          stockCount: primaryVariant?.inventory?.onHand || 0,
          status: p.status,
          imageUrl:
            p.media[0]?.url ||
            'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
        };
      }),
    });
  } catch (err) {
    return handleServerError(err);
  }
}

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  const guard = await requireActiveVerifiedMerchant(req);
  if (!guard.ok) return guard.response;

  try {
    const body = (await req.json()) as {
      title?: string;
      category?: string;
      description?: string;
      priceNGN?: number;
      sku?: string;
      stock?: number;
      imageUrl?: string;
    };

    const title = body.title?.trim() || '';
    const categoryName = body.category?.trim() || 'Fashion & Apparel';
    const description = body.description?.trim() || '';
    const priceNGN = Number(body.priceNGN || 0);
    const sku = body.sku?.trim().toUpperCase() || '';
    const stock = Math.max(0, Math.floor(Number(body.stock || 0)));
    const imageUrl = body.imageUrl?.trim() || '';

    if (!title || !description || !sku || priceNGN <= 0 || stock < 1) {
      return NextResponse.json(
        { message: 'Product title, description, SKU, positive NGN price, and initial stock (>= 1) are required.' },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const catSlug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const productSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${Math.random().toString(36).slice(2, 6)}`;

    const created = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.upsert({
        where: { slug: catSlug },
        update: {},
        create: {
          name: categoryName,
          slug: catSlug,
        },
      });

      const product = await tx.product.create({
        data: {
          vendorId: guard.merchant.vendorId,
          categoryId: cat.id,
          title,
          slug: productSlug,
          description,
          status: 'PENDING_REVIEW',
          variants: {
            create: {
              sku,
              title: 'Standard',
              priceMinor: BigInt(Math.round(priceNGN * 100)),
              currency: 'NGN',
              inventory: {
                create: {
                  onHand: stock,
                  reserved: 0,
                  safetyStock: 1,
                },
              },
            },
          },
          ...(imageUrl
            ? {
                media: {
                  create: {
                    url: imageUrl,
                    altText: title,
                    isPrimary: true,
                    sortOrder: 0,
                  },
                },
              }
            : {}),
        },
        include: {
          variants: { include: { inventory: true } },
          category: true,
          media: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: guard.auth.sub,
          action: 'CREATE_MERCHANT_PRODUCT',
          entityName: 'Product',
          entityId: product.id,
          afterState: { title, sku, stock },
        },
      });

      return product;
    });

    return NextResponse.json(
      {
        product: {
          id: created.id,
          title: created.title,
          slug: created.slug,
          sku: created.variants[0]?.sku,
          priceMinorNGN: Number(created.variants[0]?.priceMinor || 0n),
          stockCount: created.variants[0]?.inventory?.onHand || stock,
          status: created.status,
          category: created.category.name,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
