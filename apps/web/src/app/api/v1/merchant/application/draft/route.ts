import { NextRequest, NextResponse } from 'next/server';
import type { MerchantRegistrationType } from '@prisma/client';
import { encryptSensitive, maskAccountNumber, maskTin } from '../../../../../../lib/server/crypto';
import { authenticateRequest } from '../../../../../../lib/server/jwt';
import {
  EDITABLE_APPLICATION_STATUSES,
  ensureMerchantWorkspace,
  getHydratedMerchantState,
} from '../../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_REG_TYPES = new Set<MerchantRegistrationType>([
  'CAC_RC',
  'CAC_BN',
  'SOLE_PROPRIETOR',
  'OTHER',
]);

export async function PUT(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Authentication required to save onboarding draft.', code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const state = await ensureMerchantWorkspace(auth.sub);
    const app = state.application;
    if (!app || !EDITABLE_APPLICATION_STATUSES.has(app.status)) {
      return NextResponse.json(
        {
          message: `Application is currently ${app?.status?.replace(/_/g, ' ') || 'locked'} and cannot be modified while under review or approved.`,
          code: 'APPLICATION_LOCKED',
        },
        { status: 409 },
      );
    }

    const body = (await req.json()) as {
      currentStep?: number;
      business?: {
        businessName?: string;
        displayName?: string;
        registrationType?: string;
        cacRegistrationNumber?: string;
        tinNumber?: string;
        businessAddress?: string;
        businessPhone?: string;
        businessEmail?: string;
        ownerFullName?: string;
        businessDescription?: string;
        businessCategory?: string;
        countryCode?: string;
      };
      bank?: {
        countryCode?: string;
        bankName?: string;
        bankCode?: string;
        swiftBic?: string;
        routingOrIban?: string;
        accountNumber?: string;
        accountHolderName?: string;
        settlementCurrency?: string;
        accountType?: string;
      };
    };

    const prisma = getPrisma();
    const merchantId = state.merchant.id;

    await prisma.$transaction(async (tx) => {
      if (body.business) {
        const b = body.business;
        const regTypeRaw = (b.registrationType || 'CAC_RC') as MerchantRegistrationType;
        const regType = ALLOWED_REG_TYPES.has(regTypeRaw) ? regTypeRaw : 'CAC_RC';
        const cacNorm = b.cacRegistrationNumber?.trim().toUpperCase() || null;
        const rawTin = b.tinNumber?.trim() || '';

        const updateData: Record<string, unknown> = {
          businessName: b.businessName?.trim() || state.businessProfile?.businessName || 'Unnamed Business',
          displayName:
            b.displayName?.trim() ||
            b.businessName?.trim() ||
            state.businessProfile?.displayName ||
            'Merchant Store',
          registrationType: regType,
          cacRegistrationNumber: cacNorm,
          businessAddress: b.businessAddress?.trim() || null,
          businessPhone: b.businessPhone?.trim() || null,
          businessEmail: b.businessEmail?.trim().toLowerCase() || null,
          ownerFullName: b.ownerFullName?.trim() || null,
          businessDescription: b.businessDescription?.trim() || null,
          businessCategory: b.businessCategory?.trim() || null,
          countryCode: (b.countryCode || 'NG').toUpperCase(),
        };

        if (rawTin && !rawTin.includes('*')) {
          updateData.tinEncrypted = encryptSensitive(rawTin);
          updateData.tinMasked = maskTin(rawTin);
        }

        await tx.merchantBusinessProfile.upsert({
          where: { merchantId },
          update: updateData,
          create: {
            merchantId,
            businessName: String(updateData.businessName),
            displayName: String(updateData.displayName),
            registrationType: regType,
            cacRegistrationNumber: cacNorm,
            tinEncrypted: (updateData.tinEncrypted as string | undefined) || null,
            tinMasked: (updateData.tinMasked as string | undefined) || null,
            businessAddress: updateData.businessAddress as string | null,
            businessPhone: updateData.businessPhone as string | null,
            businessEmail: updateData.businessEmail as string | null,
            ownerFullName: updateData.ownerFullName as string | null,
            businessDescription: updateData.businessDescription as string | null,
            businessCategory: updateData.businessCategory as string | null,
            countryCode: String(updateData.countryCode),
          },
        });

        if (state.merchant.vendorId) {
          await tx.vendor.update({
            where: { id: state.merchant.vendorId },
            data: {
              legalName: String(updateData.businessName),
              displayName: String(updateData.displayName),
              description: (updateData.businessDescription as string | null) || undefined,
            },
          });
        }
      }

      if (body.bank) {
        const bk = body.bank;
        const cleanAcct = bk.accountNumber?.replace(/\s+/g, '').trim() || '';
        const existingBank = await tx.merchantBankAccount.findFirst({
          where: { merchantId, isPrimary: true },
        });

        if (cleanAcct || existingBank) {
          const isNewAcctProvided = Boolean(cleanAcct) && !cleanAcct.includes('*');
          const masked = isNewAcctProvided
            ? maskAccountNumber(cleanAcct)
            : existingBank?.accountNumberMasked || '';
          const last4 = isNewAcctProvided
            ? cleanAcct.slice(-4)
            : existingBank?.accountLast4 || '';
          const acctChanged =
            isNewAcctProvided &&
            (masked !== existingBank?.accountNumberMasked ||
              (bk.bankCode || '') !== (existingBank?.bankCode || ''));

          const bankPayload = {
            countryCode: (bk.countryCode || 'NG').toUpperCase(),
            bankName: bk.bankName?.trim() || existingBank?.bankName || '',
            bankCode: bk.bankCode?.trim() || null,
            swiftBic: bk.swiftBic?.trim().toUpperCase() || null,
            accountHolderName: bk.accountHolderName?.trim() || existingBank?.accountHolderName || '',
            settlementCurrency: (bk.settlementCurrency || 'NGN').toUpperCase(),
            accountType: (bk.accountType || 'BUSINESS').toUpperCase(),
            ...(isNewAcctProvided
              ? {
                  accountNumberEncrypted: encryptSensitive(cleanAcct),
                  accountNumberMasked: masked,
                  accountLast4: last4,
                }
              : {}),
            ...(bk.routingOrIban && !bk.routingOrIban.includes('*')
              ? { routingOrIbanEncrypted: encryptSensitive(bk.routingOrIban.trim()) }
              : {}),
            ...(acctChanged
              ? {
                  verificationStatus: 'UNVERIFIED' as const,
                  verifiedAccountName: null,
                  verifiedAt: null,
                  verificationProvider: null,
                  verificationMessage: 'Account updated — verify account name to confirm.',
                }
              : {}),
          };

          if (existingBank) {
            await tx.merchantBankAccount.update({
              where: { id: existingBank.id },
              data: bankPayload,
            });
          } else if (isNewAcctProvided) {
            await tx.merchantBankAccount.create({
              data: {
                merchantId,
                countryCode: bankPayload.countryCode,
                bankName: bankPayload.bankName,
                bankCode: bankPayload.bankCode,
                swiftBic: bankPayload.swiftBic,
                accountNumberEncrypted: encryptSensitive(cleanAcct),
                accountNumberMasked: masked,
                accountLast4: last4,
                routingOrIbanEncrypted: bk.routingOrIban
                  ? encryptSensitive(bk.routingOrIban.trim())
                  : null,
                accountHolderName: bankPayload.accountHolderName,
                settlementCurrency: bankPayload.settlementCurrency,
                accountType: bankPayload.accountType,
                isPrimary: true,
              },
            });
          }
        }
      }

      if (body.currentStep && body.currentStep >= 1 && body.currentStep <= 3) {
        await tx.merchantApplication.update({
          where: { id: app.id },
          data: { currentStep: body.currentStep },
        });
      }
    });

    const refreshed = await getHydratedMerchantState(merchantId);
    return NextResponse.json(refreshed, { status: 200 });
  } catch (err) {
    return handleServerError(err);
  }
}
