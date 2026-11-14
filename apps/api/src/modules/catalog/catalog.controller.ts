import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@gojifem/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import {
  CreateProductDto,
  ModerateProductDto,
  UpdateStockDto,
  ProductSearchQueryDto,
} from './catalog.dto';

@ApiTags('Catalog & Inventory')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ----------------------------------------------------
  // PUBLIC ENDPOINTS
  // ----------------------------------------------------

  @Get('categories')
  @ApiOperation({ summary: 'List all active marketplace categories' })
  async getCategories() {
    return this.catalogService.listCategories();
  }

  @Get('products')
  @ApiOperation({ summary: 'Search and filter active products in the public marketplace' })
  async searchProducts(@Query() query: ProductSearchQueryDto) {
    return this.catalogService.searchPublicCatalog(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Get active product details by unique slug' })
  async getProduct(@Param('slug') slug: string) {
    return this.catalogService.getProductBySlug(slug);
  }

  // ----------------------------------------------------
  // VENDOR ENDPOINTS
  // ----------------------------------------------------

  @Post('vendor/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product listing (submitted as PENDING_REVIEW)' })
  async createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.catalogService.createProduct(user.vendorIds[0], dto);
  }

  @Get('vendor/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products and stock owned by the authenticated vendor' })
  async getMyProducts(@CurrentUser() user: AuthenticatedUser) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.catalogService.getVendorProducts(user.vendorIds[0]);
  }

  @Put('vendor/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.VENDOR_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update on-hand stock and safety stock for a product variant' })
  async updateStock(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStockDto,
  ) {
    if (!user.vendorIds || user.vendorIds.length === 0) {
      throw new BadRequestException('No vendor store associated with this user');
    }
    return this.catalogService.updateInventory(user.vendorIds[0], dto);
  }

  // ----------------------------------------------------
  // STAFF & MODERATOR ENDPOINTS
  // ----------------------------------------------------

  @Get('admin/moderation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all pending product listings awaiting staff moderation' })
  async listPendingModeration() {
    return this.catalogService.listPendingModeration();
  }

  @Post('admin/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve, reject, or pause a product listing' })
  async moderateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ModerateProductDto,
  ) {
    return this.catalogService.moderateProduct(user.userId, dto);
  }
}
