import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, OrderStatus, VendorOrderStatus, PayoutStatus } from '@gojifem/database';
import { DispatchVendorOrderDto, ConfirmDeliveryDto, CreatePayoutBatchDto } from './orders.dto';

@Injectable()
export class OrdersService {
  async getCustomerOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { customerUserId: userId },
      include: {
        vendorOrders: {
          include: {
            vendor: true,
            items: { include: { variant: true } },
            shipments: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      ...o,
      subtotalMinor: Number(o.subtotalMinor),
      shippingFeeMinor: Number(o.shippingFeeMinor),
      discountMinor: Number(o.discountMinor),
      totalMinor: Number(o.totalMinor),
      vendorOrders: o.vendorOrders.map((vo) => ({
        ...vo,
        subtotalMinor: Number(vo.subtotalMinor),
        shippingFeeMinor: Number(vo.shippingFeeMinor),
        commissionAmountMinor: Number(vo.commissionAmountMinor),
        vendorPayableMinor: Number(vo.vendorPayableMinor),
        items: vo.items.map((i) => ({
          ...i,
          unitPriceMinor: Number(i.unitPriceMinor),
          subtotalMinor: Number(i.subtotalMinor),
          commissionAmountMinor: Number(i.commissionAmountMinor),
        })),
      })),
    }));
  }

  async getOrderTracking(orderNumber: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        vendorOrders: {
          include: {
            vendor: true,
            items: true,
            shipments: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddressSnapshot,
      packages: order.vendorOrders.map((vo) => ({
        vendorOrderId: vo.id,
        vendorOrderNumber: vo.vendorOrderNumber,
        vendorName: vo.vendor.displayName,
        status: vo.status,
        carrier: vo.carrier || 'Pending Dispatch',
        trackingNumber: vo.trackingNumber,
        shippedAt: vo.shippedAt,
        deliveredAt: vo.deliveredAt,
        shipments: vo.shipments,
      })),
    };
  }

  async getVendorOrders(vendorId: string) {
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: { vendorId },
      include: {
        order: {
          include: { customer: { include: { customerProfile: true } } },
        },
        items: true,
        shipments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return vendorOrders.map((vo) => ({
      ...vo,
      subtotalMinor: Number(vo.subtotalMinor),
      shippingFeeMinor: Number(vo.shippingFeeMinor),
      commissionAmountMinor: Number(vo.commissionAmountMinor),
      vendorPayableMinor: Number(vo.vendorPayableMinor),
      items: vo.items.map((i) => ({
        ...i,
        unitPriceMinor: Number(i.unitPriceMinor),
        subtotalMinor: Number(i.subtotalMinor),
        commissionAmountMinor: Number(i.commissionAmountMinor),
      })),
    }));
  }

  async dispatchVendorOrder(vendorId: string, dto: DispatchVendorOrderDto) {
    const vendorOrder = await prisma.vendorOrder.findUnique({
      where: { id: dto.vendorOrderId },
    });

    if (!vendorOrder || vendorOrder.vendorId !== vendorId) {
      throw new NotFoundException('Vendor order not found or does not belong to your store');
    }

    const shippedAt = new Date();
    const estimatedDeliveryAt = dto.estimatedDeliveryDays
      ? new Date(Date.now() + dto.estimatedDeliveryDays * 24 * 60 * 60 * 1000)
      : null;

    return prisma.$transaction(async (tx) => {
      // 1. Update VendorOrder
      const updated = await tx.vendorOrder.update({
        where: { id: dto.vendorOrderId },
        data: {
          status: VendorOrderStatus.SHIPPED,
          carrier: dto.carrier,
          trackingNumber: dto.trackingNumber,
          shippedAt,
        },
      });

      // 2. Create Shipment Record
      await tx.shipment.create({
        data: {
          vendorOrderId: dto.vendorOrderId,
          trackingCode: dto.trackingNumber,
          carrier: dto.carrier,
          status: 'IN_TRANSIT',
          estimatedDeliveryAt,
        },
      });

      // 3. If all vendor orders for this parent order are shipped, update parent order status
      const siblingOrders = await tx.vendorOrder.findMany({
        where: { orderId: vendorOrder.orderId },
      });

      const allShipped = siblingOrders.every(
        (so) => so.status === VendorOrderStatus.SHIPPED || so.status === VendorOrderStatus.DELIVERED,
      );

      if (allShipped) {
        await tx.order.update({
          where: { id: vendorOrder.orderId },
          data: { status: OrderStatus.SHIPPED },
        });
      } else {
        await tx.order.update({
          where: { id: vendorOrder.orderId },
          data: { status: OrderStatus.PARTIALLY_SHIPPED },
        });
      }

      return updated;
    });
  }

  async confirmDelivery(dto: ConfirmDeliveryDto) {
    const vendorOrder = await prisma.vendorOrder.findUnique({
      where: { id: dto.vendorOrderId },
    });

    if (!vendorOrder) {
      throw new NotFoundException('Vendor order not found');
    }

    const deliveredAt = new Date();

    return prisma.$transaction(async (tx) => {
      // 1. Mark VendorOrder as DELIVERED
      const updated = await tx.vendorOrder.update({
        where: { id: dto.vendorOrderId },
        data: {
          status: VendorOrderStatus.DELIVERED,
          deliveredAt,
        },
      });

      // 2. Update Shipment
      await tx.shipment.updateMany({
        where: { vendorOrderId: dto.vendorOrderId },
        data: {
          status: 'DELIVERED',
          actualDeliveryAt: deliveredAt,
        },
      });

      // 3. Check if all sibling vendor orders are delivered
      const siblingOrders = await tx.vendorOrder.findMany({
        where: { orderId: vendorOrder.orderId },
      });

      const allDelivered = siblingOrders.every((so) => so.status === VendorOrderStatus.DELIVERED);
      if (allDelivered) {
        await tx.order.update({
          where: { id: vendorOrder.orderId },
          data: { status: OrderStatus.DELIVERED },
        });
      }

      return updated;
    });
  }

  async listPayoutEligibleVendors() {
    // Orders delivered where inspection window (e.g. 72 hours) has elapsed
    const deliveredVendorOrders = await prisma.vendorOrder.findMany({
      where: {
        status: VendorOrderStatus.DELIVERED,
        deliveredAt: {
          lte: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72 hours post-delivery
        },
      },
      include: {
        vendor: {
          include: {
            settlementAccounts: { where: { isDefault: true, isVerified: true } },
          },
        },
      },
    });

    // Aggregate eligible amounts by vendor
    const eligibleMap = new Map<string, any>();
    for (const vo of deliveredVendorOrders) {
      if (!eligibleMap.has(vo.vendorId)) {
        eligibleMap.set(vo.vendorId, {
          vendorId: vo.vendorId,
          vendorName: vo.vendor.displayName,
          settlementAccount: vo.vendor.settlementAccounts[0] || null,
          eligibleOrdersCount: 0,
          eligibleBalanceMinor: 0n,
        });
      }
      const entry = eligibleMap.get(vo.vendorId);
      entry.eligibleOrdersCount += 1;
      entry.eligibleBalanceMinor += vo.vendorPayableMinor;
    }

    return Array.from(eligibleMap.values()).map((e) => ({
      ...e,
      eligibleBalanceMinor: Number(e.eligibleBalanceMinor),
    }));
  }

  async executePayoutBatch(adminUserId: string, dto: CreatePayoutBatchDto) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      include: {
        settlementAccounts: { where: { isDefault: true, isVerified: true } },
      },
    });

    if (!vendor || !vendor.settlementAccounts[0]) {
      throw new BadRequestException('Vendor has no verified commercial settlement account');
    }

    const settlementAcc = vendor.settlementAccounts[0];
    const batchReference = `PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create Payout record
      const payout = await tx.payout.create({
        data: {
          vendorId: dto.vendorId,
          settlementAccountId: settlementAcc.id,
          batchReference,
          amountMinor: BigInt(dto.amountMinor),
          currency: 'NGN',
          status: PayoutStatus.PROCESSING,
          initiatedAt: new Date(),
        },
      });

      // 2. In live production, calls Paystack Transfers: POST https://api.paystack.co/transfer
      // with amount in kobo, recipient: settlementAcc.recipientCode, reference: batchReference
      const mockProviderTransferId = `TRF_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.SUCCESS,
          providerTransferId: mockProviderTransferId,
          completedAt: new Date(),
        },
      });

      return {
        payoutId: payout.id,
        batchReference,
        vendorName: vendor.displayName,
        bankName: settlementAcc.bankName,
        accountNumberMasked: settlementAcc.accountNumberMasked,
        amountMinor: dto.amountMinor,
        status: PayoutStatus.SUCCESS,
      };
    });
  }
}
