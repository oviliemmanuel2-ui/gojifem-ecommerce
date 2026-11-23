import { NextRequest, NextResponse } from 'next/server';
import { encryptSensitive, maskAccountNumber } from '../../../../../../lib/server/crypto';
import { authenticateRequest } from '../../../../../../lib/server/jwt';
import {
  EDITABLE_APPLICATION_STATUSES,
  ensureMerchantWorkspace,
  verifyBankAccountWithProvider,
} from '../../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Authentication required to verify settlement bank account.', code: 'AUTH_REQUIRED' },
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
        { message: 'Settlement account cannot be modified while application is locked.' },
        { status: 409 },
      );
    }

    const body = (await req.json()) as {
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

    const countryCode = (body.countryCode || 'NG').toUpperCase();
    const bankName = body.bankName?.trim() || '';
    const bankCode = body.bankCode?.trim() || '';
    const rawAccountNumber = body.accountNumber?.replace(/\s+/g, '').trim() || '';

    if (!bankName) {
      return NextResponse.json({ message: 'Please select or enter your bank name.' }, { status: 400 });
    }

    const verification = await verifyBankAccountWithProvider({
      countryCode,
      bankCode,
      accountNumber: rawAccountNumber,
      swiftBic: body.swiftBic,
    });

    if (verification.verificationStatus === 'FAILED') {
      return NextResponse.json(
        {
          verified: false,
          verificationStatus: 'FAILED',
          provider: verification.provider,
          message: verification.message,
        },
        { status: 422 },
      );
    }

    const prisma = getPrisma();
    const existingBank = await prisma.merchantBankAccount.findFirst({
      where: { merchantId: state.merchant.id, isPrimary: true },
    });

    const holderName =
      verification.accountName ||
      body.accountHolderName?.trim() ||
      existingBank?.accountHolderName ||
      '';
    const masked = maskAccountNumber(rawAccountNumber);
    const last4 = rawAccountNumber.slice(-4);

    const savedBank = await prisma.$transaction(async (tx) => {
      const data = {
        countryCode,
        bankName,
        bankCode: bankCode || null,
        swiftBic: body.swiftBic?.trim().toUpperCase() || null,
        routingOrIbanEncrypted: body.routingOrIban
          ? encryptSensitive(body.routingOrIban.trim())
          : existingBank?.routingOrIbanEncrypted || null,
        accountNumberEncrypted: encryptSensitive(rawAccountNumber),
        accountNumberMasked: masked,
        accountLast4: last4,
        accountHolderName: holderName,
        verifiedAccountName: verification.verified ? verification.accountName : null,
        settlementCurrency: (body.settlementCurrency || (countryCode === 'NG' ? 'NGN' : 'USD')).toUpperCase(),
        accountType: (body.accountType || 'BUSINESS').toUpperCase(),
        verificationStatus: verification.verificationStatus,
        verificationProvider: verification.provider,
        verificationMessage: verification.message,
        verifiedAt: verification.verified ? new Date() : null,
      };

      const record = existingBank
        ? await tx.merchantBankAccount.update({
            where: { id: existingBank.id },
            data,
          })
        : await tx.merchantBankAccount.create({
            data: {
              merchantId: state.merchant.id,
              isPrimary: true,
              ...data,
            },
          });

      await tx.merchantVerificationRecord.create({
        data: {
          merchantId: state.merchant.id,
          applicationId: app.id,
          verificationType: 'BANK_ACCOUNT',
          status: verification.verified ? 'PASSED' : 'PENDING',
          provider: verification.provider,
          performedByUserId: auth.sub,
          summary: verification.message,
          metadata: {
            bankName,
            bankCode: bankCode || null,
            accountNumberMasked: masked,
          },
        },
      });

      return record;
    });

    return NextResponse.json(
      {
        verified: verification.verified,
        verificationStatus: savedBank.verificationStatus,
        provider: savedBank.verificationProvider,
        accountName: savedBank.verifiedAccountName || savedBank.accountHolderName,
        accountNumberMasked: savedBank.accountNumberMasked,
        message: verification.message,
      },
      { status: 200 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
