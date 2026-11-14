import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateQuoteDto, CreateCheckoutSessionDto } from './checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Checkout & Quotes')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('quote')
  @ApiOperation({
    summary: 'Generate an authoritative server-calculated checkout quote with shipping and serviceability verification',
    description:
      'Groups multi-vendor items, calculates delivery by vendor based on destination country/state, checks atomic inventory, and locks quote for 15 minutes.',
  })
  async generateQuote(@Body() dto: CreateQuoteDto) {
    return this.checkoutService.generateQuote(dto);
  }

  @Post('session')
  @ApiOperation({
    summary: 'Atomically reserve inventory, create parent & split vendor orders, and initiate payment',
    description:
      'Locks the quote, reserves stock in inventory_items atomically, creates parent Order and VendorOrders, and invokes Paystack to return the checkout payment URL.',
  })
  async createSession(@Body() dto: CreateCheckoutSessionDto) {
    // For guest checkout or logged in user, assign customer identity
    const defaultUserId = 'guest-customer-session';
    return this.checkoutService.createCheckoutSession(defaultUserId, dto);
  }
}
