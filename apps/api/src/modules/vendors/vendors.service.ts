import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, VendorStatus, VerificationStatus } from '@gojifem/database';
import { SubmitKycDto, CreateSettlementAccountDto, ReviewKycDto } from './vendors.dto';

@Injectable()
export class VendorsService {
  async getVendorDetails(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        verifications: { orderBy: { createdAt: 'desc' } },
        settlementAccounts: { orderBy: { createdAt: 'desc' } },
        memberships: { include: { user: true } },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async submitKycEvidence(vendorId: string, dto: SubmitKycDto) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const verification = await prisma.vendorVerification.create({
      data: {
        vendorId,
        evidenceType: dto.evidenceType,
        documentUrl: dto.documentUrl,
        status: VerificationStatus.PENDING,
      },
    });

    // Update vendor operational status to UNDER_REVIEW
    if (vendor.status === VendorStatus.DRAFT || vendor.status === VendorStatus.NEEDS_INFORMATION) {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { status: VendorStatus.UNDER_REVIEW },
      });
    }

    return verification;
  }

  async addSettlementAccount(vendorId: string, dto: CreateSettlementAccountDto) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Mask account number for PCI/data privacy (e.g. ******6789)
    const masked = '******' + dto.accountNumber.slice(-4);

    // In a live call, this resolves against Paystack: GET https://api.paystack.co/bank/resolve?account_number=...&bank_code=...
    // and creates a transfer recipient code: POST https://api.paystack.co/transferrecipient
    const recipientCode = `RCP_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const account = await prisma.vendorSettlementAccount.create({
      data: {
        vendorId,
        bankCode: dto.bankCode,
        bankName: dto.bankName,
        accountNumberMasked: masked,
        accountName: dto.accountName.toUpperCase(),
        recipientCode,
        isDefault: true,
        isVerified: true,
      },
    });

    return account;
  }

  async listPendingVerifications() {
    return prisma.vendorVerification.findMany({
      where: { status: VerificationStatus.PENDING },
      include: {
        vendor: {
          include: {
            owner: true,
            settlementAccounts: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewKyc(reviewerAdminId: string, dto: ReviewKycDto) {
    const verification = await prisma.vendorVerification.findUnique({
      where: { id: dto.verificationId },
      include: { vendor: { include: { settlementAccounts: true } } },
    });

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    const updatedVerification = await prisma.vendorVerification.update({
      where: { id: dto.verificationId },
      data: {
        status: dto.status,
        reviewerUserId: reviewerAdminId,
        reviewNotes: dto.reviewNotes,
        verifiedAt: new Date(),
      },
    });

    // If approved and the vendor has a verified settlement account, transition vendor to APPROVED
    if (dto.status === VerificationStatus.APPROVED) {
      const hasVerifiedBank = verification.vendor.settlementAccounts.some((a) => a.isVerified);
      if (hasVerifiedBank) {
        await prisma.vendor.update({
          where: { id: verification.vendorId },
          data: { status: VendorStatus.APPROVED },
        });
      }
    } else if (dto.status === VerificationStatus.REJECTED) {
      await prisma.vendor.update({
        where: { id: verification.vendorId },
        data: { status: VendorStatus.NEEDS_INFORMATION },
      });
    }

    return updatedVerification;
  }
}
