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
import { FlutterwaveProvider } from './flutterwave.provider';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<PaymentProviderName, PaymentProvider> = new Map();

  constructor(
    private readonly paystackProvider: PaystackProvider,
    private readonly flutterwaveProvider: FlutterwaveProvider,
    private readonly ledgerService: LedgerService,
  ) {
    this.providers.set(PaymentProviderName.PAYSTACK, this.paystackProvider);
    this.providers.set(PaymentProviderName.FLUTTERWAVE, this.flutterwaveProvider);
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

  async handleFlutterwaveWebhook(rawBody: string, signature: string) {
    const provider = this.getProvider(PaymentProviderName.FLUTTERWAVE);
    const event = provider.parseWebhookEvent(rawBody, signature);

    this.logger.log(`Received verified Flutterwave webhook event: ${event.event} [${event.id}]`);

    const data = event.data as any;
    const txRef = data.tx_ref || data.txRef || data.reference;
    if (txRef) {
      const verification = await provider.verifyPayment(txRef);
      await this.processSuccessfulPayment(txRef, verification, event.id, event.data);
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

    await prisma.$transaction(async (tx) => {
      // 1. Mark payment record SUCCEEDED
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          paidAt: verification.paidAt || new Date(),
          isInternationalCard: verification.isInternationalCard ?? false,
          cardCountry: verification.cardCountry,
          paymentMethod: verification.cardType || payment.paymentMethod || 'card',
        },
      });

      // Optional: record payment event audit
      if (eventId || rawPayload || verification.rawPayload) {
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            provider: payment.provider,
            eventType: 'payment.success',
            providerEventId: eventId || undefined,
            rawPayload: (rawPayload || verification.rawPayload || {}) as any,
          },
        });
      }

      // 2. Advance parent order state to PAID
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });

      // 3. Advance split vendor orders to ACCEPTED
      for (const vOrder of payment.order.vendorOrders) {
        await tx.vendorOrder.update({
          where: { id: vOrder.id },
          data: {
            status: VendorOrderStatus.ACCEPTED,
          },
        });
      }

      // 4. Record double-entry financial ledger journal entry for escrow collection
      const providerCode =
        payment.provider === 'FLUTTERWAVE'
          ? '1020-FLUTTERWAVE-CLEARING'
          : '1010-PAYSTACK-CLEARING';

      const totalCommission = payment.order.vendorOrders.reduce(
        (sum, vo) => sum + vo.commissionAmountMinor,
        BigInt(0),
      );
      const deliveryFee = payment.order.shippingFeeMinor;
      const vendorPayables = payment.amountMinor - totalCommission - deliveryFee;

      await this.ledgerService.recordOrderPayment({
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber,
        providerCode,
        grossAmountMinor: payment.amountMinor,
        vendorPayablesMinor: vendorPayables,
        commissionMinor: totalCommission,
        deliveryMinor: deliveryFee,
        currency: payment.currency,
      });
    });

    this.logger.log(`Payment "${reference}" processed successfully: Escrow journal created & orders marked PAID.`);
  }
}
