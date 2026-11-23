import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Chidi' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '+2348012345678', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Phone must be in valid international/E.164 format' })
  phone?: string;
}

export class RegisterVendorDto {
  @ApiProperty({ example: 'vendor@adirelooms.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'MerchantP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Adire Cultural Looms Nigeria Ltd' })
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @ApiProperty({ example: 'Adire Cultural Looms' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: '+2348098765432' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Phone must be in valid international/E.164 format' })
  phone!: string;

  @ApiProperty({ example: 'Abeokuta, Ogun State', required: false })
  @IsOptional()
  @IsString()
  operatingLocation?: string;

  @ApiProperty({ example: 'Fashion & Apparel', required: false })
  @IsOptional()
  @IsString()
  primaryCategory?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class GoogleAuthCallbackDto {
  @ApiProperty({ example: '4/0AcvDMr...' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'http://localhost:3000/auth/callback/google', required: false })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class AppleAuthCallbackDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'eyJraWQiOi...' })
  @IsString()
  @IsNotEmpty()
  id_token!: string;

  @ApiProperty({ required: false, description: 'JSON string with name on first Apple login' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'a1b2c3d4...' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewStrongP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}

export class RequestEmailVerificationDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'a1b2c3d4...' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
