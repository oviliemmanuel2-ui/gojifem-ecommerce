import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  Min,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCode, PaymentProviderName } from '@gojifem/types';

export class CheckoutItemDto {
  @ApiProperty({ example: 'uuid-of-variant' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CheckoutAddressDto {
  @ApiProperty({ example: 'Chidi' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'NG', description: 'ISO 2-letter country code' })
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  stateOrRegion!: string;

  @ApiProperty({ example: 'Lekki Phase 1' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: '15 Admiralty Way' })
  @IsString()
  @IsNotEmpty()
  streetAddress!: string;

  @ApiPropertyOptional({ example: 'Apartment 4B' })
  @IsOptional()
  @IsString()
  apartmentSuite?: string;

  @ApiPropertyOptional({ example: 'Near Filmhouse Cinema' })
  @IsOptional()
  @IsString()
  landmark?: string;
}

export class CreateQuoteDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiProperty({ type: CheckoutAddressDto })
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress!: CheckoutAddressDto;

  @ApiProperty({ example: 'US', description: 'Billing country of the customer cardholder' })
  @IsString()
  @IsNotEmpty()
  billingCountryCode!: string;

  @ApiPropertyOptional({ enum: CurrencyCode, example: CurrencyCode.NGN })
  @IsOptional()
  @IsEnum(CurrencyCode)
  presentmentCurrency?: CurrencyCode;
}

export class CreateCheckoutSessionDto {
  @ApiProperty({ example: 'quote-uuid-or-id' })
  @IsString()
  @IsNotEmpty()
  quoteId!: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  customerEmail!: string;

  @ApiPropertyOptional({ enum: PaymentProviderName, example: PaymentProviderName.PAYSTACK })
  @IsOptional()
  @IsEnum(PaymentProviderName)
  preferredProvider?: PaymentProviderName;
}
