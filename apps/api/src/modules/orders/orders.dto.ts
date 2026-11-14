import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class DispatchVendorOrderDto {
  @ApiProperty({ example: 'uuid-of-vendor-order' })
  @IsString()
  @IsNotEmpty()
  vendorOrderId!: string;

  @ApiProperty({ example: 'GIGL' })
  @IsString()
  @IsNotEmpty()
  carrier!: string;

  @ApiProperty({ example: 'NIG-GIG-884920' })
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryDays?: number;
}

export class ConfirmDeliveryDto {
  @ApiProperty({ example: 'uuid-of-vendor-order' })
  @IsString()
  @IsNotEmpty()
  vendorOrderId!: string;

  @ApiPropertyOptional({ example: 'SIGNED_BY_RECIPIENT_CHIDI_OKAFOR' })
  @IsOptional()
  @IsString()
  proofReference?: string;
}

export class CreatePayoutBatchDto {
  @ApiProperty({ example: 'uuid-of-vendor' })
  @IsString()
  @IsNotEmpty()
  vendorId!: string;

  @ApiProperty({ example: 13050000, description: 'Payout amount in minor units (kobo) - e.g. ₦130,500' })
  @IsNumber()
  @Min(100)
  amountMinor!: number;
}
