import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@gojifem/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import {
  DispatchVendorOrderDto,
  ConfirmDeliveryDto,
  CreatePayoutBatchDto,
} from './orders.dto';

@ApiTags('Orders, Fulfillment & Payouts')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ----------------------------------------------------
  // CUSTOMER ENDPOINTS
  // ----------------------------------------------------

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current customer order history and multi-vendor packages' })
  async getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getCustomerOrders(user.userId);
  }

  @Get(':orderNumber/tracking')
  @ApiOperation({ summary: 'Get real-time tracking timeline for an order and its vendor packages' })
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderTracking(orderNumber);
  }

  // ----------------------------------------------------
  // VENDOR ENDPOINTS
  // ----------------------------------------------------

  @Get('vendor/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders to be packed and fulfilled by the authenticated vendor' })
  async getVendorOrders(@CurrentUser() user: AuthenticatedUser) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.ordersService.getVendorOrders(user.vendorIds[0]);
  }

  @Post('vendor/dispatch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark vendor order package as SHIPPED with carrier tracking code' })
  async dispatchOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DispatchVendorOrderDto,
  ) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.ordersService.dispatchVendorOrder(user.vendorIds[0], dto);
  }

  // ----------------------------------------------------
  // DELIVERY & COURIER CONFIRMATION
  // ----------------------------------------------------

  @Post('delivery/confirm')
  @ApiOperation({ summary: 'Courier / Operations delivery confirmation callback' })
  async confirmDelivery(@Body() dto: ConfirmDeliveryDto) {
    return this.ordersService.confirmDelivery(dto);
  }

  // ----------------------------------------------------
  // FINANCE & PAYOUTS
  // ----------------------------------------------------

  @Get('admin/payouts/eligible')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List vendors with eligible payout balances post-delivery' })
  async listPayoutEligibleVendors() {
    return this.ordersService.listPayoutEligibleVendors();
  }

  @Post('admin/payouts/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute automated bank transfer payout to vendor via Paystack Transfers' })
  async executePayout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePayoutBatchDto,
  ) {
    return this.ordersService.executePayoutBatch(user.userId, dto);
  }
}
