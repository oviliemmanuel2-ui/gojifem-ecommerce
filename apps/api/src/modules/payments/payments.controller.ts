import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrencyCode, PaymentProviderName } from '@gojifem/types';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize checkout payment session (Paystack/Flutterwave)',
    description: 'Supports local Nigerian payment channels and international cards (Visa, Mastercard, Amex).',
  })
  async initialize(
    @Body()
    body: {
      orderId: string;
      orderNumber: string;
      customerEmail: string;
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
        amount: {
          amount: body.amountMinor,
          currency: body.currency,
        },
        currency: body.currency,
        callbackUrl: `${process.env.WEB_URL || 'http://localhost:3000'}/checkout/verify`,
      },
      body.provider,
    );
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify payment status with provider' })
  async verify(
    @Param('reference') reference: string,
    @Query('provider') provider?: PaymentProviderName,
  ) {
    return this.paymentsService.verifyPayment(reference, provider);
  }
}
