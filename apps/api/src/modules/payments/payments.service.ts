import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  CurrencyCode,
  InitializePaymentRequest,
  InitializePaymentResponse,
  PaymentProvider,
  PaymentProviderName,
  VerifyPaymentResponse,
} from '@gojifem/types';
import { prisma, OrderStatus, PaymentStatus, VendorOrderStatus } from '@gojifem/database';
import { PaystackProvider } from './paystack.provider';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<PaymentProviderName, PaymentProvider> = new Map();

  constructor(
    private readonly paystackProvider: PaystackProvider,
    private readonly ledgerService: LedgerService,
  ) {
    this.providers.set(PaymentProviderName.PAYSTACK, this.paystackProvider);
  }

  getProvider(name: PaymentProviderName = PaymentProviderName.PAYSTACK): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Payment provider ${name} is not registered`);
    }
    return provider;
  }

  async initializePayment(
    request: InitializePaymentRequest,
    preferredProvider: PaymentProviderName = PaymentProviderName.PAYSTACK,
  ): Promise<InitializePaymentResponse> {
    const provider = this.getProvider(preferredProvider);
    return provider.initializePayment(request);
  }

  async verifyPayment(
    reference: string,
    providerName: PaymentProviderName = PaymentProviderName.PAYSTACK,
  ): Promise<VerifyPaymentResponse> {
    const provider = this.getProvider(providerName);
    const verification = await provider.verifyPayment(reference);

    // If payment succeeded, handle idempotent order and ledger settlement
    if (verification.status === PaymentStatus.SUCCEEDED) {
      await this.processSuccessfulPayment(reference, verification);
    }

    return verification;
  }

  async handlePaystackWebhook(rawBody: string, signature: string) {
    const provider = this.getProvider(PaymentProviderName.PAYSTACK);
    const event = provider.parseWebhookEvent(rawBody, signature);

    this.logger.log(`Received verified Paystack webhook event: ${event.event} [${event.id}]`);

    if (event.event === 'charge.success') {
      const data = event.data as any;
      const reference = data.reference;
      const verification = await provider.verifyPayment(reference);
      await this.processSuccessfulPayment(reference, verification, event.id, event.data);
    }

    return { status: 'acknowledged' };
  }

  private async processSuccessfulPayment(
    reference: string,
    verification: VerifyPaymentResponse,
    eventId?: string,
    rawPayload?: Record<string, unknown>,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { paymentReference: reference },
      include: {
        order: {
          include: {
            vendorOrders: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment reference "${reference}" not found in database.`);
      return;
    }

    // Idempotency: skip if already marked SUCCEEDED
    if (payment.status === PaymentStatus.SUCCEEDED) {
      this.logger.log(`Payment "${reference}" was already processed. Skipping.`);
      return;
    }

    const order = payment.order;

    await prisma.$transaction(async (tx) => {
      // 1. Update Payment Record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          paidAt: verification.paidAt || new Date(),
          paymentMethod: verification.channel || 'card',
          isInternationalCard: verification.isInternationalCard,
          cardCountry: verification.cardCountry,
        },
      });

      // 2. Record Event in payment_events
      if (eventId || rawPayload) {
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            provider: payment.provider,
            eventType: 'charge.success',
            providerEventId: eventId || `pevt_${Date.now()}`,
            rawPayload: (rawPayload || verification.rawPayload) as any,
          },
        });
      }

      // 3. Mark Parent Order as PAID
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });

      // 4. Update all child VendorOrders to ACCEPTED
      for (const vo of order.vendorOrders) {
        await tx.vendorOrder.update({
          where: { id: vo.id },
          data: { status: VendorOrderStatus.ACCEPTED },
        });
      }

      // 5. Commit atomic stock reservation
      for (const vo of order.vendorOrders) {
        const orderItems = await tx.orderItem.findMany({
          where: { vendorOrderId: vo.id },
        });

        for (const item of orderItems) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: {
              onHand: { decrement: item.quantity },
              reserved: { decrement: item.quantity },
            },
          });
        }
      }
    });

    // 6. Record balanced double-entry ledger transaction
    const totalVendorPayables = order.vendorOrders.reduce(
      (acc, vo) => acc + vo.vendorPayableMinor,
      0n,
    );
    const totalCommissions = order.vendorOrders.reduce(
      (acc, vo) => acc + vo.commissionAmountMinor,
      0n,
    );

    await this.ledgerService.recordOrderPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      providerCode: '1010-PAYSTACK-CLEARING',
      grossAmountMinor: order.totalMinor,
      vendorPayablesMinor: totalVendorPayables,
      commissionMinor: totalCommissions,
      deliveryMinor: order.shippingFeeMinor,
      currency: 'NGN',
    });

    this.logger.log(`Order ${order.orderNumber} successfully paid and settled to ledger.`);
  }
}
