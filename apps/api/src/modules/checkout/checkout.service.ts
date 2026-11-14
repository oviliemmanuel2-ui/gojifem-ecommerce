import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { prisma, OrderStatus, VendorOrderStatus } from '@gojifem/database';
import { CurrencyCode, PaymentProviderName } from '@gojifem/types';
import { ShippingService } from '../shipping/shipping.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateQuoteDto, CreateCheckoutSessionDto } from './checkout.dto';

interface CachedQuote {
  id: string;
  expiresAt: Date;
  shippingAddress: CreateQuoteDto['shippingAddress'];
  billingCountryCode: string;
  presentmentCurrency: CurrencyCode;
  itemsSubtotalMinor: bigint;
  shippingTotalMinor: bigint;
  grandTotalMinor: bigint;
  vendorGroups: Array<{
    vendorId: string;
    vendorName: string;
    commissionRateBps: number;
    shippingFeeMinor: bigint;
    items: Array<{
      variantId: string;
      sku: string;
      title: string;
      quantity: number;
      unitPriceMinor: bigint;
      subtotalMinor: bigint;
      commissionAmountMinor: bigint;
      vendorPayableMinor: bigint;
    }>;
    vendorSubtotalMinor: bigint;
    vendorTotalMinor: bigint;
  }>;
}

@Injectable()
export class CheckoutService {
  private readonly quotesCache = new Map<string, CachedQuote>();

  constructor(
    private readonly shippingService: ShippingService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async generateQuote(dto: CreateQuoteDto) {
    // 1. Serviceability Check Gate
    const serviceability = this.shippingService.checkServiceability({
      countryCode: dto.shippingAddress.countryCode,
      stateOrRegion: dto.shippingAddress.stateOrRegion,
      city: dto.shippingAddress.city,
    });

    if (!serviceability.isServiceable) {
      throw new BadRequestException(
        serviceability.restrictionReason ||
          `GOJIFEM does not currently deliver to country ${dto.shippingAddress.countryCode}. International cards can be used to purchase items for delivery anywhere within Nigeria.`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Checkout requires at least one item');
    }

    // 2. Fetch variants & verify inventory
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: {
        product: { include: { vendor: true } },
        inventory: true,
      },
    });

    if (variants.length !== dto.items.length) {
      throw new BadRequestException('One or more selected products are invalid or inactive');
    }

    // Group items by vendor
    const vendorMap = new Map<string, CachedQuote['vendorGroups'][0]>();
    let itemsSubtotalMinor = 0n;

    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) continue;

      const availableStock = variant.inventory
        ? variant.inventory.onHand - variant.inventory.reserved
        : 0;

      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${variant.title}". Available: ${availableStock}, Requested: ${item.quantity}`,
        );
      }

      const vendor = variant.product.vendor;
      const unitPriceMinor = variant.priceMinor;
      const itemSubtotalMinor = unitPriceMinor * BigInt(item.quantity);
      itemsSubtotalMinor += itemSubtotalMinor;

      // Platform commission: e.g. 1000 bps = 10%
      const commissionRateBps = vendor.commissionRateBps || 1000;
      const commissionAmountMinor = (itemSubtotalMinor * BigInt(commissionRateBps)) / 10000n;
      const vendorPayableMinor = itemSubtotalMinor - commissionAmountMinor;

      if (!vendorMap.has(vendor.id)) {
        // Calculate per-vendor shipping fee based on delivery zone
        const shippingFeeMinor = this.calculateVendorShippingFee(
          dto.shippingAddress.countryCode,
          dto.shippingAddress.stateOrRegion,
        );

        vendorMap.set(vendor.id, {
          vendorId: vendor.id,
          vendorName: vendor.displayName,
          commissionRateBps,
          shippingFeeMinor,
          items: [],
          vendorSubtotalMinor: 0n,
          vendorTotalMinor: 0n,
        });
      }

      const group = vendorMap.get(vendor.id)!;
      group.items.push({
        variantId: variant.id,
        sku: variant.sku,
        title: `${variant.product.title} - ${variant.title}`,
        quantity: item.quantity,
        unitPriceMinor,
        subtotalMinor: itemSubtotalMinor,
        commissionAmountMinor,
        vendorPayableMinor,
      });
      group.vendorSubtotalMinor += itemSubtotalMinor;
      group.vendorTotalMinor = group.vendorSubtotalMinor + group.shippingFeeMinor;
    }

    const vendorGroups = Array.from(vendorMap.values());
    const shippingTotalMinor = vendorGroups.reduce((acc, g) => acc + g.shippingFeeMinor, 0n);
    const grandTotalMinor = itemsSubtotalMinor + shippingTotalMinor;

    const quoteId = `QUOTE_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const cachedQuote: CachedQuote = {
      id: quoteId,
      expiresAt,
      shippingAddress: dto.shippingAddress,
      billingCountryCode: dto.billingCountryCode,
      presentmentCurrency: dto.presentmentCurrency || CurrencyCode.NGN,
      itemsSubtotalMinor,
      shippingTotalMinor,
      grandTotalMinor,
      vendorGroups,
    };

    this.quotesCache.set(quoteId, cachedQuote);

    return {
      quoteId,
      expiresAt,
      serviceable: true,
      presentmentCurrency: cachedQuote.presentmentCurrency,
      transactionCurrency: CurrencyCode.NGN,
      itemsSubtotalMinor: Number(itemsSubtotalMinor),
      shippingTotalMinor: Number(shippingTotalMinor),
      grandTotalMinor: Number(grandTotalMinor),
      vendorGroups: vendorGroups.map((g) => ({
        vendorId: g.vendorId,
        vendorName: g.vendorName,
        shippingFeeMinor: Number(g.shippingFeeMinor),
        subtotalMinor: Number(g.vendorSubtotalMinor),
        totalMinor: Number(g.vendorTotalMinor),
        items: g.items.map((i) => ({
          ...i,
          unitPriceMinor: Number(i.unitPriceMinor),
          subtotalMinor: Number(i.subtotalMinor),
          commissionAmountMinor: Number(i.commissionAmountMinor),
          vendorPayableMinor: Number(i.vendorPayableMinor),
        })),
      })),
    };
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutSessionDto) {
    const quote = this.quotesCache.get(dto.quoteId);
    if (!quote) {
      throw new NotFoundException('Checkout quote expired or not found. Please refresh your quote.');
    }

    if (new Date() > quote.expiresAt) {
      this.quotesCache.delete(dto.quoteId);
      throw new BadRequestException('Checkout quote has expired. Please re-calculate your checkout.');
    }

    const orderNumber = `GOJI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    return prisma.$transaction(async (tx) => {
      // 1. Atomically lock and reserve inventory items
      for (const group of quote.vendorGroups) {
        for (const item of group.items) {
          const inv = await tx.inventoryItem.findUnique({
            where: { variantId: item.variantId },
          });

          if (!inv || inv.onHand - inv.reserved < item.quantity) {
            throw new BadRequestException(`Stock changed for "${item.title}". Please re-check cart.`);
          }

          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: { reserved: { increment: item.quantity } },
          });
        }
      }

      // 2. Create Parent Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerUserId: userId,
          status: OrderStatus.PENDING_PAYMENT,
          presentmentCurrency: quote.presentmentCurrency,
          settlementCurrency: 'NGN',
          billingCountryCode: quote.billingCountryCode,
          shippingAddressSnapshot: quote.shippingAddress as any,
          subtotalMinor: quote.itemsSubtotalMinor,
          shippingFeeMinor: quote.shippingTotalMinor,
          discountMinor: 0n,
          totalMinor: quote.grandTotalMinor,
        },
      });

      // 3. Create Split VendorOrders and OrderItems
      for (let idx = 0; idx < quote.vendorGroups.length; idx++) {
        const group = quote.vendorGroups[idx];
        const vendorOrderNumber = `${orderNumber}-V${idx + 1}`;

        const vendorSubtotal = group.vendorSubtotalMinor;
        const totalCommission = group.items.reduce((sum, i) => sum + i.commissionAmountMinor, 0n);
        const totalVendorPayable = group.items.reduce((sum, i) => sum + i.vendorPayableMinor, 0n);

        const vendorOrder = await tx.vendorOrder.create({
          data: {
            orderId: order.id,
            vendorId: group.vendorId,
            vendorOrderNumber,
            status: VendorOrderStatus.AWAITING_VENDOR,
            subtotalMinor: vendorSubtotal,
            shippingFeeMinor: group.shippingFeeMinor,
            commissionBps: group.commissionRateBps,
            commissionAmountMinor: totalCommission,
            vendorPayableMinor: totalVendorPayable,
          },
        });

        for (const item of group.items) {
          await tx.orderItem.create({
            data: {
              vendorOrderId: vendorOrder.id,
              variantId: item.variantId,
              sku: item.sku,
              title: item.title,
              variantSnapshot: { sku: item.sku, title: item.title } as any,
              unitPriceMinor: item.unitPriceMinor,
              quantity: item.quantity,
              subtotalMinor: item.subtotalMinor,
              commissionAmountMinor: item.commissionAmountMinor,
            },
          });
        }
      }

      // 4. Initialize Payment with Paystack
      const paymentInit = await this.paymentsService.initializePayment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: dto.customerEmail,
          amount: {
            amount: quote.grandTotalMinor,
            currency: CurrencyCode.NGN,
          },
          currency: CurrencyCode.NGN,
          callbackUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/checkout/confirmation?orderNumber=${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            billingCountry: quote.billingCountryCode,
            shippingCountry: quote.shippingAddress.countryCode,
          },
        },
        dto.preferredProvider || PaymentProviderName.PAYSTACK,
      );

      // Record draft payment attempt
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentReference: paymentInit.reference,
          provider: paymentInit.provider as any,
          amountMinor: quote.grandTotalMinor,
          currency: 'NGN',
        },
      });

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentReference: paymentInit.reference,
        checkoutUrl: paymentInit.checkoutUrl,
        authorizationUrl: paymentInit.authorizationUrl,
        totalMinor: Number(quote.grandTotalMinor),
      };
    });
  }

  private calculateVendorShippingFee(countryCode: string, stateOrRegion?: string): bigint {
    const code = countryCode.toUpperCase();
    if (code === 'NG') {
      const state = (stateOrRegion || '').toLowerCase();
      if (state.includes('lagos')) {
        return 250000n; // ₦2,500
      }
      return 450000n; // ₦4,500
    }
    if (code === 'GH') return 1800000n; // ₦18,000
    if (code === 'GB') return 3500000n; // ₦35,000
    if (code === 'US') return 4500000n; // ₦45,000
    return 5000000n; // ₦50,000 default international corridor
  }
}
