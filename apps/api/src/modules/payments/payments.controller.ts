import { Controller, Post, Get, Body, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CurrencyCode, PaymentProviderName } from '@gojifem/types';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class InitializePaymentDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  orderNumber!: string;

  @ApiProperty()
  @IsEmail()
  customerEmail!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty()
  @IsNumber()
  amountMinor!: number;

  @ApiProperty({ enum: ['NGN', 'USD', 'GBP', 'EUR'] })
  @IsString()
  currency!: CurrencyCode;

  @ApiProperty({ enum: PaymentProviderName, required: false })
  @IsOptional()
  @IsEnum(PaymentProviderName)
  provider?: PaymentProviderName;
}

@ApiTags('Payments & Gateways')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initialize checkout payment session (Paystack/Flutterwave)',
    description: 'Requires authentication. Supports local Nigerian channels and international cards.',
  })
  async initialize(@Body() body: InitializePaymentDto) {
    const webUrl = (process.env.WEB_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');
    return this.paymentsService.initializePayment(
      {
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        amount: {
          amount: BigInt(Math.round(body.amountMinor)) as any,
          currency: body.currency,
        },
        currency: body.currency,
        callbackUrl: `${webUrl}/checkout/confirmation?orderNumber=${body.orderNumber}`,
      },
      body.provider,
    );
  }

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
