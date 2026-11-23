import { NextRequest, NextResponse } from 'next/server';
import type { MerchantApplicationStatus, MerchantNotificationType } from '@prisma/client';
import { decryptSensitive } from '../../../../../../../lib/server/crypto';
import { requireAdminUser } from '../../../../../../../lib/server/merchant';
import { ensureRole } from '../../../../../../../lib/server/oauth';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminDecisionAction =
  | 'START_VERIFICATION'
  | 'REQUEST_MORE_INFO'
  | 'APPROVE'
  | 'REJECT'
  | 'SUSPEND';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  const body = (await req.json().catch(() => ({}))) as {
    action?: AdminDecisionAction;
    reason?: string;
    notes?: string;
  };

  const action = body.action;
  const reason = body.reason?.trim() || '';
  const notes = body.notes?.trim() || '';

  const requiredRoles =
    action === 'APPROVE' || action === 'REJECT' || action === 'SUSPEND'
      ? ['ADMIN']
      : ['ADMIN', 'MODERATOR'];

  const adminGuard = await requireAdminUser(req, requiredRoles);
  if (!adminGuard.ok) return adminGuard.response;

  if (
    !action ||
    !['START_VERIFICATION', 'REQUEST_MORE_INFO', 'APPROVE', 'REJECT', 'SUSPEND'].includes(action)
  ) {
    return NextResponse.json({ message: 'Invalid verification decision action.' }, { status: 400 });
  }

  if (
    (action === 'REQUEST_MORE_INFO' || action === 'REJECT' || action === 'SUSPEND') &&
    reason.length < 5
  ) {
    return NextResponse.json(
      { message: 'Please provide a clear compliance reason (at least 5 characters) for this decision.' },
      { status: 400 },
    );
  }

  try {
    const { applicationId } = await context.params;
    const prisma = getPrisma();

    const application = await prisma.merchantApplication.findUnique({
      where: { id: applicationId },
      include: {
        merchant: {
          include: {
            businessProfile: true,
            bankAccounts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }], take: 1 },
          },
        },
        kycDocuments: { where: { status: { not: 'REPLACED' } } },
      },
    });

    if (!application) {
      return NextResponse.json({ message: 'Merchant application not found.' }, { status: 404 });
    }

    const prevStatus = application.status;
    let nextAppStatus: MerchantApplicationStatus = prevStatus;
    const vendorRole =
      action === 'APPROVE' ? await ensureRole('VENDOR_OWNER', 'Merchant Owner') : null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const merchant = application.merchant;
      const businessName = merchant.businessProfile?.businessName || 'Your Store';
      const primaryBank = merchant.bankAccounts[0] || null;

      if (action === 'START_VERIFICATION') {
        nextAppStatus = 'UNDER_VERIFICATION';
        await tx.merchantApplication.update({
          where: { id: application.id },
          data: {
            status: 'UNDER_VERIFICATION',
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
            adminNotes: notes || application.adminNotes,
          },
        });
        await tx.merchantKycDocument.updateMany({
          where: { applicationId: application.id, status: 'UPLOADED' },
          data: { status: 'UNDER_VERIFICATION' },
        });
        if (merchant.vendorId) {
          await tx.vendor.update({
            where: { id: merchant.vendorId },
            data: { status: 'UNDER_REVIEW' },
          });
        }
        await tx.merchantVerificationRecord.create({
          data: {
            merchantId: merchant.id,
            applicationId: application.id,
            verificationType: 'ADMIN_COMPLIANCE',
            status: 'PENDING',
            provider: 'GOJIFEM_OPERATIONS',
            performedByUserId: adminGuard.auth.sub,
            summary: notes || 'Compliance officer began document & TIN inspection.',
          },
        });
        await tx.merchantNotification.create({
          data: {
            merchantId: merchant.id,
            userId: merchant.ownerUserId,
            applicationId: application.id,
            type: 'UNDER_VERIFICATION',
            title: 'Documents Under Verification',
            message: `GOJIFEM Compliance is actively verifying your CAC certificate, TIN, and settlement account for ${application.referenceNumber}.`,
          },
        });
      } else if (action === 'REQUEST_MORE_INFO') {
        nextAppStatus = 'MORE_INFORMATION_REQUIRED';
        await tx.merchantApplication.update({
          where: { id: application.id },
          data: {
            status: 'MORE_INFORMATION_REQUIRED',
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
            requestedInfoNote: reason,
            adminNotes: notes || reason,
          },
        });
        if (merchant.vendorId) {
          await tx.vendor.update({
            where: { id: merchant.vendorId },
            data: { status: 'NEEDS_INFORMATION' },
          });
        }
        await tx.merchantVerificationRecord.create({
          data: {
            merchantId: merchant.id,
            applicationId: application.id,
            verificationType: 'ADMIN_COMPLIANCE',
            status: 'INFO_REQUESTED',
            provider: 'GOJIFEM_OPERATIONS',
            performedByUserId: adminGuard.auth.sub,
            summary: reason,
          },
        });
        await tx.merchantNotification.create({
          data: {
            merchantId: merchant.id,
            userId: merchant.ownerUserId,
            applicationId: application.id,
            type: 'ADDITIONAL_DOCUMENTS_REQUESTED',
            title: 'Additional Documents Requested',
            message: `Action required on ${application.referenceNumber}: ${reason}. Upload the requested evidence and resubmit.`,
          },
        });
      } else if (action === 'APPROVE') {
        nextAppStatus = 'APPROVED';
        await tx.merchantApplication.update({
          where: { id: application.id },
          data: {
            status: 'APPROVED',
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
            rejectionReason: null,
            requestedInfoNote: null,
            adminNotes: notes || 'Verified and approved by administrator.',
          },
        });

        await tx.merchant.update({
          where: { id: merchant.id },
          data: {
            accountStatus: 'ACTIVE',
            isVerified: true,
            canListProducts: true,
            canManageInventory: true,
            canReceiveOrders: true,
            canReceiveSettlements: true,
            activatedAt: now,
            suspendedAt: null,
          },
        });

        await tx.merchantKycDocument.updateMany({
          where: { applicationId: application.id, status: { in: ['UPLOADED', 'UNDER_VERIFICATION'] } },
          data: {
            status: 'VERIFIED',
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
          },
        });

        if (merchant.vendorId) {
          await tx.vendor.update({
            where: { id: merchant.vendorId },
            data: {
              status: 'APPROVED',
              legalName: merchant.businessProfile?.businessName,
              displayName: merchant.businessProfile?.displayName,
              description: merchant.businessProfile?.businessDescription || undefined,
            },
          });

          await tx.vendorMembership.upsert({
            where: {
              vendorId_userId: { vendorId: merchant.vendorId, userId: merchant.ownerUserId },
            },
            update: { role: 'OWNER', isActive: true },
            create: { vendorId: merchant.vendorId, userId: merchant.ownerUserId, role: 'OWNER', isActive: true },
          });

          if (vendorRole) {
            const existingRole = await tx.userRole.findFirst({
              where: {
                userId: merchant.ownerUserId,
                roleId: vendorRole.id,
                vendorId: merchant.vendorId,
              },
            });
            if (!existingRole) {
              await tx.userRole.create({
                data: {
                  userId: merchant.ownerUserId,
                  roleId: vendorRole.id,
                  vendorId: merchant.vendorId,
                },
              });
            }
          }

          await tx.vendorVerification.create({
            data: {
              vendorId: merchant.vendorId,
              evidenceType: 'CAC_CERTIFICATE',
              documentUrl: `private://merchant-kyc/${merchant.id}/${application.id}`,
              status: 'APPROVED',
              reviewerUserId: adminGuard.auth.sub,
              reviewNotes: notes || reason || 'KYC verified & approved by GOJIFEM Admin.',
              verifiedAt: now,
            },
          });

          if (primaryBank) {
            await tx.vendorSettlementAccount.create({
              data: {
                vendorId: merchant.vendorId,
                bankCode: primaryBank.bankCode || 'INTL',
                bankName: primaryBank.bankName,
                accountNumberMasked: primaryBank.accountNumberMasked,
                accountName: primaryBank.verifiedAccountName || primaryBank.accountHolderName,
                isDefault: true,
                isVerified: primaryBank.verificationStatus === 'VERIFIED',
              },
            });
          }
        }

        await tx.merchantVerificationRecord.create({
          data: {
            merchantId: merchant.id,
            applicationId: application.id,
            verificationType: 'ADMIN_COMPLIANCE',
            status: 'PASSED',
            provider: 'GOJIFEM_OPERATIONS',
            performedByUserId: adminGuard.auth.sub,
            summary: notes || reason || 'Application approved; merchant account activated.',
            metadata: {
              cac: merchant.businessProfile?.cacRegistrationNumber,
              tinPresent: Boolean(decryptSensitive(merchant.businessProfile?.tinEncrypted)),
            },
          },
        });

        await tx.merchantNotification.createMany({
          data: [
            {
              merchantId: merchant.id,
              userId: merchant.ownerUserId,
              applicationId: application.id,
              type: 'APPLICATION_APPROVED',
              title: 'Merchant Application Approved',
              message: `Congratulations! Application ${application.referenceNumber} for ${businessName} has been approved.`,
            },
            {
              merchantId: merchant.id,
              userId: merchant.ownerUserId,
              applicationId: application.id,
              type: 'ACCOUNT_ACTIVATED',
              title: 'Merchant Account Activated',
              message: `Your merchant portal is now active. You can list products, manage inventory, and receive orders.`,
            },
          ],
        });
      } else if (action === 'REJECT') {
        nextAppStatus = 'REJECTED';
        await tx.merchantApplication.update({
          where: { id: application.id },
          data: {
            status: 'REJECTED',
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
            rejectionReason: reason,
            adminNotes: notes || reason,
          },
        });
        await tx.merchant.update({
          where: { id: merchant.id },
          data: {
            accountStatus: 'REJECTED',
            isVerified: false,
            canListProducts: false,
            canManageInventory: false,
            canReceiveOrders: false,
            canReceiveSettlements: false,
          },
        });
        await tx.merchantKycDocument.updateMany({
          where: { applicationId: application.id, status: { in: ['UPLOADED', 'UNDER_VERIFICATION'] } },
          data: {
            status: 'REJECTED',
            reviewNotes: reason,
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
          },
        });
        if (merchant.vendorId) {
          await tx.vendor.update({
            where: { id: merchant.vendorId },
            data: { status: 'REJECTED' },
          });
        }
        await tx.merchantVerificationRecord.create({
          data: {
            merchantId: merchant.id,
            applicationId: application.id,
            verificationType: 'ADMIN_COMPLIANCE',
            status: 'FAILED',
            provider: 'GOJIFEM_OPERATIONS',
            performedByUserId: adminGuard.auth.sub,
            summary: reason,
          },
        });
        await tx.merchantNotification.create({
          data: {
            merchantId: merchant.id,
            userId: merchant.ownerUserId,
            applicationId: application.id,
            type: 'APPLICATION_REJECTED',
            title: 'Merchant Application Rejected',
            message: `Application ${application.referenceNumber} was not approved: ${reason}.`,
          },
        });
      } else if (action === 'SUSPEND') {
        nextAppStatus = 'SUSPENDED';
        await tx.merchantApplication.update({
          where: { id: application.id },
          data: {
            status: 'SUSPENDED',
            reviewedByUserId: adminGuard.auth.sub,
            reviewedAt: now,
            rejectionReason: reason,
            adminNotes: notes || reason,
          },
        });
        await tx.merchant.update({
          where: { id: merchant.id },
          data: {
            accountStatus: 'SUSPENDED',
            isVerified: false,
            canListProducts: false,
            canManageInventory: false,
            canReceiveOrders: false,
            canReceiveSettlements: false,
            suspendedAt: now,
          },
        });
        if (merchant.vendorId) {
          await tx.vendor.update({
            where: { id: merchant.vendorId },
            data: { status: 'SUSPENDED' },
          });
        }
        await tx.merchantVerificationRecord.create({
          data: {
            merchantId: merchant.id,
            applicationId: application.id,
            verificationType: 'ADMIN_COMPLIANCE',
            status: 'FAILED',
            provider: 'GOJIFEM_OPERATIONS',
            performedByUserId: adminGuard.auth.sub,
            summary: `Account suspended: ${reason}`,
          },
        });
        await tx.merchantNotification.create({
          data: {
            merchantId: merchant.id,
            userId: merchant.ownerUserId,
            applicationId: application.id,
            type: 'ACCOUNT_SUSPENDED' as MerchantNotificationType,
            title: 'Merchant Account Suspended',
            message: `Your merchant account (${application.referenceNumber}) has been suspended: ${reason}.`,
          },
        });
      }

      await tx.merchantApplicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: prevStatus,
          toStatus: nextAppStatus,
          changedByUserId: adminGuard.auth.sub,
          changedByRole: adminGuard.role,
          reason: reason || null,
          notes: notes || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminGuard.auth.sub,
          action: `ADMIN_MERCHANT_${action}`,
          entityName: 'MerchantApplication',
          entityId: application.id,
          beforeState: { status: prevStatus },
          afterState: { status: nextAppStatus, reason: reason || null },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: application.id,
        previousStatus: prevStatus,
        status: nextAppStatus,
      },
      { status: 200 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
