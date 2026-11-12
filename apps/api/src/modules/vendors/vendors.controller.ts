import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@gojifem/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { VendorsService } from './vendors.service';
import { SubmitKycDto, CreateSettlementAccountDto, ReviewKycDto } from './vendors.dto';

@ApiTags('Vendors & KYC Verification')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get('me')
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiOperation({ summary: "Get current merchant's store details, KYC status, and settlement accounts" })
  async getMyStore(@CurrentUser() user: AuthenticatedUser) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.vendorsService.getVendorDetails(user.vendorIds[0]);
  }

  @Post('me/kyc')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiOperation({ summary: 'Submit CAC registration certificate or identity evidence for verification' })
  async submitKyc(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitKycDto,
  ) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.vendorsService.submitKycEvidence(user.vendorIds[0], dto);
  }

  @Post('me/settlement-account')
  @Roles(UserRole.VENDOR_OWNER)
  @ApiOperation({ summary: 'Add verified Nigerian commercial bank account for escrow payouts' })
  async addSettlementAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSettlementAccountDto,
  ) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.vendorsService.addSettlementAccount(user.vendorIds[0], dto);
  }

  @Get('admin/verifications')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List pending vendor verification applications for staff review' })
  async listPendingVerifications() {
    return this.vendorsService.listPendingVerifications();
  }

  @Post('admin/review')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Approve, reject, or request additional information for a vendor KYC application' })
  async reviewVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewKycDto,
  ) {
    return this.vendorsService.reviewKyc(user.userId, dto);
  }
}
