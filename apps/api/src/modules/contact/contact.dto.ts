import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Chidi Okafor' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'chidi.okafor@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Order Delivery Question' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Hello GOJIFEM support, I would like an update on my shipment.' })
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  message!: string;
}
