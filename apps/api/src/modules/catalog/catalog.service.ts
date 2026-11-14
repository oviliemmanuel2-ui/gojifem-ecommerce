import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma, ProductStatus, VendorStatus } from '@gojifem/database';
import {
  CreateProductDto,
  ModerateProductDto,
  UpdateStockDto,
  ProductSearchQueryDto,
} from './catalog.dto';

@Injectable()
export class CatalogService {
  async createProduct(vendorId: string, dto: CreateProductDto) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved vendors with verified KYC and settlement accounts can list products for sale.',
      );
    }

    // Generate unique slug
    const baseSlug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    // Resolve category by ID or slug
    let category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      category = await prisma.category.findUnique({
        where: { slug: dto.categoryId },
      });
    }
    if (!category) {
      throw new BadRequestException(`Category '${dto.categoryId}' not found`);
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          vendorId,
          categoryId: category.id,
          title: dto.title,
          slug: uniqueSlug,
          description: dto.description,
          status: ProductStatus.PENDING_REVIEW,
          media: dto.media
            ? {
                create: dto.media.map((m, index) => ({
                  url: m.url,
                  altText: m.altText || dto.title,
                  isPrimary: m.isPrimary ?? index === 0,
                  sortOrder: index,
                })),
              }
            : undefined,
        },
      });

      // Create variants & inventory
      for (const v of dto.variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku.toUpperCase(),
            title: v.title,
            priceMinor: BigInt(v.priceMinor),
            currency: 'NGN',
            compareAtPriceMinor: v.compareAtPriceMinor ? BigInt(v.compareAtPriceMinor) : null,
          },
        });

        await tx.inventoryItem.create({
          data: {
            variantId: variant.id,
            onHand: v.onHand,
            reserved: 0,
            safetyStock: v.safetyStock || 0,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: true,
          variants: { include: { inventory: true } },
          media: true,
        },
      });
    });
  }

  async getVendorProducts(vendorId: string) {
    return prisma.product.findMany({
      where: { vendorId },
      include: {
        category: true,
        variants: {
          include: { inventory: true },
        },
        media: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchPublicCatalog(query: ProductSearchQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      status: ProductStatus.ACTIVE,
      vendor: {
        status: VendorStatus.APPROVED,
      },
    };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = {
        OR: [{ id: query.category }, { slug: query.category }],
      };
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: { select: { id: true, displayName: true, slug: true, status: true } },
          category: true,
          variants: {
            where: { isActive: true },
            include: { inventory: true },
          },
          media: { orderBy: { sortOrder: 'asc' } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          priceMinor: Number(v.priceMinor),
          compareAtPriceMinor: v.compareAtPriceMinor ? Number(v.compareAtPriceMinor) : null,
          availableStock: v.inventory ? v.inventory.onHand - v.inventory.reserved : 0,
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        vendor: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            description: true,
            status: true,
          },
        },
        category: true,
        variants: {
          where: { isActive: true },
          include: { inventory: true },
        },
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException('Product not found or not active');
    }

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        priceMinor: Number(v.priceMinor),
        compareAtPriceMinor: v.compareAtPriceMinor ? Number(v.compareAtPriceMinor) : null,
        availableStock: v.inventory ? v.inventory.onHand - v.inventory.reserved : 0,
      })),
    };
  }

  async listPendingModeration() {
    const products = await prisma.product.findMany({
      where: { status: ProductStatus.PENDING_REVIEW },
      include: {
        vendor: true,
        category: true,
        variants: { include: { inventory: true } },
        media: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({
        ...v,
        priceMinor: Number(v.priceMinor),
        compareAtPriceMinor: v.compareAtPriceMinor ? Number(v.compareAtPriceMinor) : null,
      })),
    }));
  }

  async moderateProduct(adminUserId: string, dto: ModerateProductDto) {
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return prisma.product.update({
      where: { id: dto.productId },
      data: {
        status: dto.status,
      },
      include: {
        category: true,
        variants: true,
        media: true,
      },
    });
  }

  async updateInventory(vendorId: string, dto: UpdateStockDto) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: true, inventory: true },
    });

    if (!variant || variant.product.vendorId !== vendorId) {
      throw new NotFoundException('Variant not found or does not belong to vendor');
    }

    return prisma.inventoryItem.update({
      where: { variantId: dto.variantId },
      data: {
        onHand: dto.onHand,
        safetyStock: dto.safetyStock !== undefined ? dto.safetyStock : undefined,
      },
    });
  }

  async listCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: { children: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
