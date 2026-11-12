import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsEnum, Length, IsOptional } from 'class-validator';
import { VerificationStatus } from '@gojifem/database';

export class SubmitKycDto {
  @ApiProperty({ example: 'CAC_CERTIFICATE', description: 'CAC_CERTIFICATE, NATIONAL_ID, TAX_ID, UTILITY_BILL' })
  @IsString()
  @IsNotEmpty()
  evidenceType!: string;

  @ApiProperty({ example: 'https://storage.gojifem.com/kyc/cac_rc123456.pdf' })
  @IsUrl()
  documentUrl!: string;

  @ApiProperty({ example: 'RC-12345678', required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;
}

export class CreateSettlementAccountDto {
  @ApiProperty({ example: '058', description: 'NIBSS Bank Code (058 for GTBank, 011 for First Bank, 057 for Zenith)' })
  @IsString()
  @IsNotEmpty()
  bankCode!: string;

  @ApiProperty({ example: 'Guaranty Trust Bank' })
  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @ApiProperty({ example: '0123456789', description: '10-digit NUBAN Nigerian bank account number' })
  @IsString()
  @Length(10, 10, { message: 'NUBAN account number must be exactly 10 digits' })
  accountNumber!: string;

  @ApiProperty({ example: 'OMO ODUA HERITAGE LOOMS LTD' })
  @IsString()
  @IsNotEmpty()
  accountName!: string;
}

export class ReviewKycDto {
  @ApiProperty({ example: 'uuid-of-verification-record' })
  @IsString()
  @IsNotEmpty()
  verificationId!: string;

  @ApiProperty({ enum: VerificationStatus, example: VerificationStatus.APPROVED })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @ApiProperty({ example: 'CAC certificate and corporate registry status verified' })
  @IsString()
  @IsNotEmpty()
  reviewNotes!: string;
}
