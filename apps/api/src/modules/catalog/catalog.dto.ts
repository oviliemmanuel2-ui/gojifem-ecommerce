import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsUrl,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@gojifem/database';

export class CreateVariantDto {
  @ApiProperty({ example: 'ASO-OKE-ROYAL-M' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 'Medium (Chest 40-42")' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 14500000, description: 'Price in minor units (Kobo) - e.g. 14,500,000 = ₦145,000' })
  @IsNumber()
  @Min(100)
  priceMinor!: number;

  @ApiPropertyOptional({ example: 18000000 })
  @IsOptional()
  @IsNumber()
  compareAtPriceMinor?: number;

  @ApiProperty({ example: 25, description: 'Initial on-hand inventory count' })
  @IsNumber()
  @Min(0)
  onHand!: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStock?: number;
}

export class CreateProductMediaDto {
  @ApiProperty({ example: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 'Handwoven Aso-Oke Agbada front view' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Handcrafted Luxury Aso-Oke Agbada & Fila Set' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Woven from the finest threads by master artisans in Western Nigeria.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'uuid-or-slug-of-category' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ type: [CreateVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];

  @ApiPropertyOptional({ type: [CreateProductMediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductMediaDto)
  media?: CreateProductMediaDto[];
}

export class ModerateProductDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @ApiProperty({ example: 'Approved for public marketplace listing' })
  @IsString()
  @IsNotEmpty()
  moderationNotes!: string;
}

export class UpdateStockDto {
  @ApiProperty({ example: 'uuid-of-variant' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 50, description: 'Updated on-hand stock count' })
  @IsNumber()
  @Min(0)
  onHand!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStock?: number;
}

export class ProductSearchQueryDto {
  @ApiPropertyOptional({ example: 'aso-oke' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'fashion-apparel' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'uuid-of-vendor' })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 20000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
