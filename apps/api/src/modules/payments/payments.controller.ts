import { Controller, Post, Get, Body, Param, Query, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrencyCode, PaymentProviderName } from '@gojifem/types';
import { PaymentsService } from './payments.service';

@ApiTags('Payments & Gateways')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize checkout payment session (Paystack/Flutterwave)',
    description: 'Supports local Nigerian channels and international cards (Visa, Mastercard, Amex).',
  })
  async initialize(
    @Body()
    body: {
      orderId: string;
      orderNumber: string;
      customerEmail: string;
      customerName?: string;
      amountMinor: number;
      currency: CurrencyCode;
      provider?: PaymentProviderName;
    },
  ) {
    return this.paymentsService.initializePayment(
      {
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        amount: {
          amount: BigInt(body.amountMinor) as any,
          currency: body.currency,
        },
        currency: body.currency,
        callbackUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/checkout/confirmation?orderNumber=${body.orderNumber}`,
      },
      body.provider,
    );
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify payment status with provider and settle to ledger' })
  async verify(
    @Param('reference') reference: string,
    @Query('provider') provider?: PaymentProviderName,
  ) {
    return this.paymentsService.verifyPayment(reference, provider);
  }

  @Post('webhooks/paystack')
  @ApiOperation({ summary: 'Signed webhook listener for Paystack payment notifications' })
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    const rawBody = JSON.stringify(payload);
    return this.paymentsService.handlePaystackWebhook(rawBody, signature);
  }

  @Post('webhooks/flutterwave')
  @ApiOperation({ summary: 'Signed webhook listener for Flutterwave payment notifications' })
  async flutterwaveWebhook(
    @Headers('verif-hash') signature: string,
    @Body() payload: any,
  ) {
    const rawBody = JSON.stringify(payload);
    return this.paymentsService.handleFlutterwaveWebhook(rawBody, signature);
  }
}
