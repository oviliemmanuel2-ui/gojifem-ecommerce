import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateQuoteDto, CreateCheckoutSessionDto } from './checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Checkout & Quotes')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('quote')
  @ApiOperation({
    summary: 'Generate an authoritative server-calculated checkout quote with shipping and serviceability verification',
    description:
      'Requires customer authentication. Groups multi-vendor items, calculates delivery by vendor, checks atomic inventory, and locks quote for 15 minutes.',
  })
  async generateQuote(@Body() dto: CreateQuoteDto) {
    return this.checkoutService.generateQuote(dto);
  }

  @Post('session')
  @ApiOperation({
    summary: 'Atomically reserve inventory, create parent & split vendor orders, and initiate payment',
    description:
      'Requires customer authentication. Locks the quote, reserves stock atomically, creates Order and VendorOrders under the authenticated user, and returns the payment URL.',
  })
  async createSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.checkoutService.createCheckoutSession(user.userId, dto);
  }
}
