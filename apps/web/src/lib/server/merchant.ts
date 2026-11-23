import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthJwtPayload } from './jwt';
import { getPrisma } from './prisma';
import { decryptSensitive } from './crypto';
import { ensureRole } from './oauth';

export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '50211', name: 'Kuda Microfinance Bank' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '999991', name: 'PalmPay' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '035', name: 'Wema Bank / ALAT' },
  { code: '057', name: 'Zenith Bank' },
] as const;

export const BUSINESS_CATEGORIES = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Nigerian Groceries & Foods',
  'Home, Kitchen & Living',
  'Health, Beauty & Wellness',
  'Arts, Crafts & Collectibles',
  'Automotive & Hardware',
  'Books, Media & Stationery',
] as const;

export const EDITABLE_APPLICATION_STATUSES = new Set([
  'DRAFT',
  'MORE_INFORMATION_REQUIRED',
  'REJECTED',
]);

export function generateMerchantCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MRC-${new Date().getFullYear()}-${rand}`;
}

export function generateApplicationReference(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `GOJI-MCH-${new Date().getFullYear()}-${rand}`;
}

export async function generateUniqueVendorSlug(baseName: string): Promise<string> {
  const prisma = getPrisma();
  const base =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'merchant';

  for (let i = 0; i < 6; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = i === 0 ? `${base}-${suffix}` : `${base}-${suffix}${i}`;
    const exists = await prisma.vendor.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Finds or creates an owner's Merchant + draft MerchantApplication + linked Vendor shell.
 */
export async function ensureMerchantWorkspace(userId: string) {
  const prisma = getPrisma();

  let merchant = await prisma.merchant.findFirst({
    where: { ownerUserId: userId },
    orderBy: { createdAt: 'asc' },
  });

  if (!merchant) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        customerProfile: true,
        ownedVendors: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });

    const existingVendor = user.ownedVendors[0] || null;
    const defaultDisplayName =
      existingVendor?.displayName ||
      (user.customerProfile
        ? `${user.customerProfile.firstName} ${user.customerProfile.lastName}'s Store`
        : user.email.split('@')[0]);
    const defaultLegalName = existingVendor?.legalName || defaultDisplayName;
    const ownerFullName = user.customerProfile
      ? `${user.customerProfile.firstName} ${user.customerProfile.lastName}`.trim()
      : '';

    const slug = existingVendor ? null : await generateUniqueVendorSlug(defaultDisplayName);
    const vendorRole = await ensureRole('VENDOR_OWNER', 'Merchant Owner');

    merchant = await prisma.$transaction(async (tx) => {
      const vendorRecord =
        existingVendor ||
        (await tx.vendor.create({
          data: {
            legalName: defaultLegalName,
            displayName: defaultDisplayName,
            slug: slug!,
            ownerUserId: user.id,
            status: 'DRAFT',
            commissionRateBps: 1000,
          },
        }));

      if (!existingVendor) {
        await tx.vendorMembership.create({
          data: {
            vendorId: vendorRecord.id,
            userId: user.id,
            role: 'OWNER',
          },
        });
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: vendorRole.id,
            vendorId: vendorRecord.id,
          },
        });
      }

      const createdMerchant = await tx.merchant.create({
        data: {
          ownerUserId: user.id,
          vendorId: vendorRecord.id,
          merchantCode: generateMerchantCode(),
          accountStatus: 'PENDING_ACTIVATION',
          isVerified: false,
          businessProfile: {
            create: {
              businessName: defaultLegalName,
              displayName: defaultDisplayName,
              registrationType: 'CAC_RC',
              businessEmail: user.email,
              businessPhone: user.phone || '',
              ownerFullName,
              countryCode: 'NG',
            },
          },
          applications: {
            create: {
              referenceNumber: generateApplicationReference(),
              status: 'DRAFT',
              currentStep: 1,
              statusHistory: {
                create: {
                  toStatus: 'DRAFT',
                  changedByUserId: user.id,
                  changedByRole: 'MERCHANT',
                  notes: 'Merchant onboarding application initialized.',
                },
              },
            },
          },
        },
      });

      return createdMerchant;
    });
  } else {
    // Ensure at least one MerchantApplication exists
    const appCount = await prisma.merchantApplication.count({
      where: { merchantId: merchant.id },
    });
    if (appCount === 0) {
      await prisma.merchantApplication.create({
        data: {
          merchantId: merchant.id,
          referenceNumber: generateApplicationReference(),
          status: 'DRAFT',
          currentStep: 1,
          statusHistory: {
            create: {
              toStatus: 'DRAFT',
              changedByUserId: userId,
              changedByRole: 'MERCHANT',
              notes: 'Merchant onboarding application initialized.',
            },
          },
        },
      });
    }
  }

  return getHydratedMerchantState(merchant.id);
}

export async function getHydratedMerchantState(merchantId: string) {
  const prisma = getPrisma();
  const merchant = await prisma.merchant.findUniqueOrThrow({
    where: { id: merchantId },
    include: {
      vendor: true,
      businessProfile: true,
      bankAccounts: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        take: 1,
      },
      applications: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
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
            take: 15,
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 25,
          },
        },
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  const primaryBank = merchant.bankAccounts[0] || null;
  const currentApp = merchant.applications[0] || null;

  return {
    merchant: {
      id: merchant.id,
      merchantCode: merchant.merchantCode,
      vendorId: merchant.vendorId,
      vendorSlug: merchant.vendor?.slug || null,
      accountStatus: merchant.accountStatus,
      isVerified: merchant.isVerified,
      canListProducts: merchant.canListProducts,
      canManageInventory: merchant.canManageInventory,
      canReceiveOrders: merchant.canReceiveOrders,
      canReceiveSettlements: merchant.canReceiveSettlements,
      commissionRateBps: merchant.commissionRateBps,
      activatedAt: merchant.activatedAt,
    },
    businessProfile: merchant.businessProfile
      ? {
          id: merchant.businessProfile.id,
          businessName: merchant.businessProfile.businessName,
          displayName: merchant.businessProfile.displayName,
          registrationType: merchant.businessProfile.registrationType,
          cacRegistrationNumber: merchant.businessProfile.cacRegistrationNumber || '',
          tinMasked: merchant.businessProfile.tinMasked || '',
          hasTinOnFile: Boolean(merchant.businessProfile.tinEncrypted),
          businessAddress: merchant.businessProfile.businessAddress || '',
          businessPhone: merchant.businessProfile.businessPhone || '',
          businessEmail: merchant.businessProfile.businessEmail || '',
          ownerFullName: merchant.businessProfile.ownerFullName || '',
          businessDescription: merchant.businessProfile.businessDescription || '',
          businessCategory: merchant.businessProfile.businessCategory || '',
          countryCode: merchant.businessProfile.countryCode,
        }
      : null,
    bankAccount: primaryBank
      ? {
          id: primaryBank.id,
          countryCode: primaryBank.countryCode,
          bankName: primaryBank.bankName,
          bankCode: primaryBank.bankCode || '',
          swiftBic: primaryBank.swiftBic || '',
          accountNumberMasked: primaryBank.accountNumberMasked,
          accountLast4: primaryBank.accountLast4,
          accountHolderName: primaryBank.accountHolderName,
          verifiedAccountName: primaryBank.verifiedAccountName || '',
          settlementCurrency: primaryBank.settlementCurrency,
          accountType: primaryBank.accountType,
          verificationStatus: primaryBank.verificationStatus,
          verificationProvider: primaryBank.verificationProvider || '',
          verificationMessage: primaryBank.verificationMessage || '',
          verifiedAt: primaryBank.verifiedAt,
        }
      : null,
    application: currentApp
      ? {
          id: currentApp.id,
          referenceNumber: currentApp.referenceNumber,
          status: currentApp.status,
          currentStep: currentApp.currentStep,
          termsAccepted: currentApp.termsAccepted,
          termsAcceptedAt: currentApp.termsAcceptedAt,
          accuracyConfirmed: currentApp.accuracyConfirmed,
          submittedAt: currentApp.submittedAt,
          reviewedAt: currentApp.reviewedAt,
          rejectionReason: currentApp.rejectionReason,
          requestedInfoNote: currentApp.requestedInfoNote,
          documents: currentApp.kycDocuments,
          verificationRecords: currentApp.verificationRecords,
          statusHistory: currentApp.statusHistory,
        }
      : null,
    notifications: merchant.notifications,
  };
}

/**
 * Strictly verifies in PostgreSQL that the caller is an active ADMIN or MODERATOR.
 */
export async function requireAdminUser(
  req: NextRequest,
  allowedRoles: string[] = ['ADMIN', 'MODERATOR'],
): Promise<
  | { ok: true; auth: AuthJwtPayload; role: string }
  | { ok: false; response: NextResponse }
> {
  const auth = authenticateRequest(req);
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Authentication required for administrator access.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      ),
    };
  }

  const user = await getPrisma().user.findUnique({
    where: { id: auth.sub },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user || user.accountStatus !== 'ACTIVE') {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Active administrator account required.' }, { status: 401 }),
    };
  }

  const matchedRole = user.userRoles
    .map((ur) => ur.role.code)
    .find((code) => allowedRoles.includes(code));

  if (!matchedRole) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Administrator permission required to perform this action.', code: 'FORBIDDEN' },
        { status: 403 },
      ),
    };
  }

  return { ok: true, auth, role: matchedRole };
}

/**
 * Strictly verifies in PostgreSQL that the caller owns an ACTIVE, VERIFIED merchant account.
 */
export async function requireActiveVerifiedMerchant(req: NextRequest): Promise<
  | {
      ok: true;
      auth: AuthJwtPayload;
      merchant: { id: string; vendorId: string; accountStatus: string };
    }
  | { ok: false; response: NextResponse }
> {
  const auth = authenticateRequest(req);
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Please sign in to access your merchant portal.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      ),
    };
  }

  const merchant = await getPrisma().merchant.findFirst({
    where: { ownerUserId: auth.sub },
    include: {
      applications: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!merchant || !merchant.vendorId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: 'Complete merchant onboarding on Sell on GOJIFEM before managing listings or orders.',
          code: 'MERCHANT_ONBOARDING_REQUIRED',
        },
        { status: 403 },
      ),
    };
  }

  if (merchant.accountStatus !== 'ACTIVE' || !merchant.isVerified || !merchant.canListProducts) {
    const appStatus = merchant.applications[0]?.status || 'DRAFT';
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: `Your merchant account is currently ${merchant.accountStatus.toLowerCase().replace(/_/g, ' ')} (application status: ${appStatus.replace(/_/g, ' ')}). Verification approval is required before selling.`,
          code: 'MERCHANT_NOT_VERIFIED',
          accountStatus: merchant.accountStatus,
          applicationStatus: appStatus,
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    auth,
    merchant: {
      id: merchant.id,
      vendorId: merchant.vendorId,
      accountStatus: merchant.accountStatus,
    },
  };
}

export interface BankVerificationResult {
  verified: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING_VERIFICATION' | 'FAILED';
  provider: string;
  accountName: string | null;
  message: string;
}

/**
 * Verifies a bank account through live Paystack or Flutterwave banking APIs.
 * Never fabricates a verified account holder name when provider keys are unavailable.
 */
export async function verifyBankAccountWithProvider(input: {
  countryCode: string;
  bankCode?: string;
  accountNumber: string;
  swiftBic?: string;
}): Promise<BankVerificationResult> {
  const country = (input.countryCode || 'NG').toUpperCase();
  const cleanNumber = input.accountNumber.replace(/\s+/g, '').trim();

  if (country === 'NG') {
    if (!/^\d{10}$/.test(cleanNumber)) {
      return {
        verified: false,
        verificationStatus: 'FAILED',
        provider: 'VALIDATION',
        accountName: null,
        message: 'Nigerian NUBAN account numbers must be exactly 10 digits.',
      };
    }
    if (!input.bankCode) {
      return {
        verified: false,
        verificationStatus: 'FAILED',
        provider: 'VALIDATION',
        accountName: null,
        message: 'Please select a Nigerian commercial bank.',
      };
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (paystackKey && !paystackKey.includes('xxxx')) {
      try {
        const res = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(cleanNumber)}&bank_code=${encodeURIComponent(input.bankCode)}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${paystackKey}` },
            cache: 'no-store',
          },
        );
        const data = (await res.json()) as {
          status?: boolean;
          message?: string;
          data?: { account_name?: string };
        };
        if (res.ok && data.status && data.data?.account_name) {
          return {
            verified: true,
            verificationStatus: 'VERIFIED',
            provider: 'PAYSTACK_NIBSS',
            accountName: data.data.account_name.trim(),
            message: `Account holder verified via Paystack NIBSS: ${data.data.account_name.trim()}`,
          };
        }
        return {
          verified: false,
          verificationStatus: 'FAILED',
          provider: 'PAYSTACK_NIBSS',
          accountName: null,
          message:
            data.message ||
            'Bank could not verify this NUBAN account number. Please double-check the bank and account number.',
        };
      } catch (err: unknown) {
        return {
          verified: false,
          verificationStatus: 'PENDING_VERIFICATION',
          provider: 'PAYSTACK_NIBSS',
          accountName: null,
          message:
            err instanceof Error
              ? `Temporary error reaching banking verification service: ${err.message}`
              : 'Temporary error reaching banking verification service.',
        };
      }
    }

    const flwKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (flwKey && !flwKey.includes('xxxx')) {
      try {
        const res = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flwKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_number: cleanNumber,
            account_bank: input.bankCode,
          }),
        });
        const data = (await res.json()) as {
          status?: string;
          message?: string;
          data?: { account_name?: string };
        };
        if (res.ok && data.status === 'success' && data.data?.account_name) {
          return {
            verified: true,
            verificationStatus: 'VERIFIED',
            provider: 'FLUTTERWAVE_NIBSS',
            accountName: data.data.account_name.trim(),
            message: `Account holder verified via Flutterwave: ${data.data.account_name.trim()}`,
          };
        }
        return {
          verified: false,
          verificationStatus: 'FAILED',
          provider: 'FLUTTERWAVE_NIBSS',
          accountName: null,
          message:
            data.message ||
            'Unable to resolve NUBAN account with Flutterwave. Please confirm the bank and account number.',
        };
      } catch (err: unknown) {
        return {
          verified: false,
          verificationStatus: 'PENDING_VERIFICATION',
          provider: 'FLUTTERWAVE_NIBSS',
          accountName: null,
          message:
            err instanceof Error
              ? `Temporary error reaching banking verification service: ${err.message}`
              : 'Temporary error reaching banking verification service.',
        };
      }
    }

    return {
      verified: false,
      verificationStatus: 'PENDING_VERIFICATION',
      provider: 'UNCONFIGURED',
      accountName: null,
      message:
        'Automated NIBSS lookup is unavailable until PAYSTACK_SECRET_KEY or FLUTTERWAVE_SECRET_KEY is configured. Your 10-digit NUBAN format is valid and will be verified during staff review.',
    };
  }

  if (cleanNumber.length < 6 || cleanNumber.length > 34) {
    return {
      verified: false,
      verificationStatus: 'FAILED',
      provider: 'VALIDATION',
      accountName: null,
      message: 'Please provide a valid IBAN or international account number (6–34 characters).',
    };
  }

  return {
    verified: false,
    verificationStatus: 'PENDING_VERIFICATION',
    provider: 'INTERNATIONAL_MANUAL',
    accountName: null,
    message:
      'International settlement account details recorded and queued for manual compliance verification.',
  };
}

export function revealAdminSensitiveFields(profile: {
  tinEncrypted?: string | null;
  tinMasked?: string | null;
}, bank?: {
  accountNumberEncrypted?: string | null;
  accountNumberMasked?: string | null;
  routingOrIbanEncrypted?: string | null;
} | null) {
  return {
    tinPlain: decryptSensitive(profile.tinEncrypted) || profile.tinMasked || '',
    accountNumberPlain: bank
      ? decryptSensitive(bank.accountNumberEncrypted) || bank.accountNumberMasked || ''
      : '',
    routingOrIbanPlain: bank
      ? decryptSensitive(bank.routingOrIbanEncrypted) || ''
      : '',
  };
}
