import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, revealAdminSensitiveFields } from '../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  const adminGuard = await requireAdminUser(req);
  if (!adminGuard.ok) return adminGuard.response;

  try {
    const search = (req.nextUrl.searchParams.get('search') || '').trim();
    const statusFilter = (req.nextUrl.searchParams.get('status') || '').trim().toUpperCase();

    const prisma = getPrisma();
    const applications = await prisma.merchantApplication.findMany({
      where: {
        ...(statusFilter && statusFilter !== 'ALL'
          ? { status: statusFilter as never }
          : {}),
        ...(search
          ? {
              OR: [
                { referenceNumber: { contains: search, mode: 'insensitive' } },
                {
                  merchant: {
                    OR: [
                      { merchantCode: { contains: search, mode: 'insensitive' } },
                      {
                        businessProfile: {
                          OR: [
                            { businessName: { contains: search, mode: 'insensitive' } },
                            { displayName: { contains: search, mode: 'insensitive' } },
                            { cacRegistrationNumber: { contains: search, mode: 'insensitive' } },
                            { businessEmail: { contains: search, mode: 'insensitive' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        merchant: {
          include: {
            owner: { select: { id: true, email: true, phone: true } },
            businessProfile: true,
            bankAccounts: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
              take: 1,
            },
          },
        },
        kycDocuments: {
          where: { status: { not: 'REPLACED' } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            documentType: true,
            fileName: true,
            mimeType: true,
            fileSizeBytes: true,
            status: true,
            reviewNotes: true,
            storageProvider: true,
            createdAt: true,
          },
        },
        verificationRecords: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
    });

    const reviewerIds = new Set<string>();
    for (const app of applications) {
      if (app.reviewedByUserId) reviewerIds.add(app.reviewedByUserId);
      for (const h of app.statusHistory) {
        if (h.changedByUserId) reviewerIds.add(h.changedByUserId);
      }
    }

    const reviewers =
      reviewerIds.size > 0
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(reviewerIds) } },
            select: {
              id: true,
              email: true,
              customerProfile: { select: { firstName: true, lastName: true } },
            },
          })
        : [];
    const reviewerMap = new Map(
      reviewers.map((r) => [
        r.id,
        r.customerProfile
          ? `${r.customerProfile.firstName} ${r.customerProfile.lastName} (${r.email})`
          : r.email,
      ]),
    );

    return NextResponse.json({
      applications: applications.map((app) => {
        const bp = app.merchant.businessProfile;
        const bank = app.merchant.bankAccounts[0] || null;
        const unmasked = revealAdminSensitiveFields(bp || {}, bank);

        return {
          id: app.id,
          referenceNumber: app.referenceNumber,
          status: app.status,
          submittedAt: app.submittedAt,
          reviewedAt: app.reviewedAt,
          reviewedBy: app.reviewedByUserId
            ? reviewerMap.get(app.reviewedByUserId) || app.reviewedByUserId
            : null,
          rejectionReason: app.rejectionReason,
          requestedInfoNote: app.requestedInfoNote,
          adminNotes: app.adminNotes,
          merchant: {
            id: app.merchant.id,
            merchantCode: app.merchant.merchantCode,
            accountStatus: app.merchant.accountStatus,
            isVerified: app.merchant.isVerified,
            canListProducts: app.merchant.canListProducts,
            canReceiveSettlements: app.merchant.canReceiveSettlements,
            ownerEmail: app.merchant.owner.email,
            ownerPhone: app.merchant.owner.phone,
          },
          businessProfile: bp
            ? {
                businessName: bp.businessName,
                displayName: bp.displayName,
                registrationType: bp.registrationType,
                cacRegistrationNumber: bp.cacRegistrationNumber || '',
                tinNumber: unmasked.tinPlain,
                tinMasked: bp.tinMasked || '',
                businessAddress: bp.businessAddress || '',
                businessPhone: bp.businessPhone || '',
                businessEmail: bp.businessEmail || '',
                ownerFullName: bp.ownerFullName || '',
                businessDescription: bp.businessDescription || '',
                businessCategory: bp.businessCategory || '',
                countryCode: bp.countryCode,
              }
            : null,
          bankAccount: bank
            ? {
                countryCode: bank.countryCode,
                bankName: bank.bankName,
                bankCode: bank.bankCode || '',
                swiftBic: bank.swiftBic || '',
                accountNumberMasked: bank.accountNumberMasked,
                accountNumberPlain: unmasked.accountNumberPlain,
                routingOrIban: unmasked.routingOrIbanPlain,
                accountHolderName: bank.accountHolderName,
                verifiedAccountName: bank.verifiedAccountName || '',
                settlementCurrency: bank.settlementCurrency,
                accountType: bank.accountType,
                verificationStatus: bank.verificationStatus,
                verificationProvider: bank.verificationProvider || '',
                verificationMessage: bank.verificationMessage || '',
              }
            : null,
          documents: app.kycDocuments,
          verificationRecords: app.verificationRecords,
          statusHistory: app.statusHistory.map((h) => ({
            ...h,
            actorLabel: h.changedByUserId
              ? reviewerMap.get(h.changedByUserId) || h.changedByUserId
              : 'System',
          })),
        };
      }),
    });
  } catch (err) {
    return handleServerError(err);
  }
}
