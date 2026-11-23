-- Non-destructive migration for complete merchant onboarding, private KYC document vault,
-- encrypted TIN/bank settlement records, application status history, and notifications.

-- 1. Enums (guarded cleanly)
DO $$ BEGIN CREATE TYPE "MerchantAccountStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MerchantRegistrationType" AS ENUM ('CAC_RC', 'CAC_BN', 'SOLE_PROPRIETOR', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MerchantApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED', 'MORE_INFORMATION_REQUIRED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MerchantKycDocumentType" AS ENUM ('CAC_CERTIFICATE', 'BUSINESS_REGISTRATION', 'TIN_CERTIFICATE', 'GOVERNMENT_ID', 'UTILITY_BILL', 'ADDITIONAL_REQUESTED', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MerchantKycDocumentStatus" AS ENUM ('UPLOADED', 'UNDER_VERIFICATION', 'VERIFIED', 'REJECTED', 'REPLACED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "BankVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MerchantNotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'PENDING_REVIEW', 'UNDER_VERIFICATION', 'ADDITIONAL_DOCUMENTS_REQUESTED', 'APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'ACCOUNT_ACTIVATED', 'ACCOUNT_SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. merchants
CREATE TABLE IF NOT EXISTS "merchants" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "vendorId" TEXT,
    "merchantCode" TEXT NOT NULL,
    "accountStatus" "MerchantAccountStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "canListProducts" BOOLEAN NOT NULL DEFAULT false,
    "canManageInventory" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveOrders" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveSettlements" BOOLEAN NOT NULL DEFAULT false,
    "commissionRateBps" INTEGER NOT NULL DEFAULT 1000,
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "merchants_vendorId_key" ON "merchants"("vendorId");
CREATE UNIQUE INDEX IF NOT EXISTS "merchants_merchantCode_key" ON "merchants"("merchantCode");
CREATE INDEX IF NOT EXISTS "merchants_ownerUserId_idx" ON "merchants"("ownerUserId");
CREATE INDEX IF NOT EXISTS "merchants_accountStatus_idx" ON "merchants"("accountStatus");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_ownerUserId_fkey') THEN
        ALTER TABLE "merchants" ADD CONSTRAINT "merchants_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchants_vendorId_fkey') THEN
        ALTER TABLE "merchants" ADD CONSTRAINT "merchants_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. merchant_business_profiles
CREATE TABLE IF NOT EXISTS "merchant_business_profiles" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "registrationType" "MerchantRegistrationType" NOT NULL DEFAULT 'CAC_RC',
    "cacRegistrationNumber" TEXT,
    "tinEncrypted" TEXT,
    "tinMasked" TEXT,
    "businessAddress" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "ownerFullName" TEXT,
    "businessDescription" TEXT,
    "businessCategory" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_business_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "merchant_business_profiles_merchantId_key" ON "merchant_business_profiles"("merchantId");
CREATE UNIQUE INDEX IF NOT EXISTS "merchant_business_profiles_cacRegistrationNumber_key" ON "merchant_business_profiles"("cacRegistrationNumber");
CREATE INDEX IF NOT EXISTS "merchant_business_profiles_businessName_idx" ON "merchant_business_profiles"("businessName");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_business_profiles_merchantId_fkey') THEN
        ALTER TABLE "merchant_business_profiles" ADD CONSTRAINT "merchant_business_profiles_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. merchant_applications
CREATE TABLE IF NOT EXISTS "merchant_applications" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "status" "MerchantApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "accuracyConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "rejectionReason" TEXT,
    "requestedInfoNote" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "merchant_applications_referenceNumber_key" ON "merchant_applications"("referenceNumber");
CREATE INDEX IF NOT EXISTS "merchant_applications_status_submittedAt_idx" ON "merchant_applications"("status", "submittedAt");
CREATE INDEX IF NOT EXISTS "merchant_applications_merchantId_idx" ON "merchant_applications"("merchantId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_applications_merchantId_fkey') THEN
        ALTER TABLE "merchant_applications" ADD CONSTRAINT "merchant_applications_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. merchant_kyc_documents
CREATE TABLE IF NOT EXISTS "merchant_kyc_documents" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "MerchantKycDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "sha256Checksum" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'SUPABASE_PRIVATE',
    "storageBucket" TEXT,
    "storageKey" TEXT NOT NULL,
    "encryptedPayload" BYTEA,
    "status" "MerchantKycDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "reviewNotes" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_kyc_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "merchant_kyc_documents_storageKey_key" ON "merchant_kyc_documents"("storageKey");
CREATE INDEX IF NOT EXISTS "merchant_kyc_documents_merchantId_status_idx" ON "merchant_kyc_documents"("merchantId", "status");
CREATE INDEX IF NOT EXISTS "merchant_kyc_documents_applicationId_idx" ON "merchant_kyc_documents"("applicationId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_kyc_documents_merchantId_fkey') THEN
        ALTER TABLE "merchant_kyc_documents" ADD CONSTRAINT "merchant_kyc_documents_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_kyc_documents_applicationId_fkey') THEN
        ALTER TABLE "merchant_kyc_documents" ADD CONSTRAINT "merchant_kyc_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. merchant_bank_accounts
CREATE TABLE IF NOT EXISTS "merchant_bank_accounts" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "swiftBic" TEXT,
    "routingOrIbanEncrypted" TEXT,
    "accountNumberEncrypted" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "accountLast4" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "verifiedAccountName" TEXT,
    "settlementCurrency" TEXT NOT NULL DEFAULT 'NGN',
    "accountType" TEXT NOT NULL DEFAULT 'BUSINESS',
    "verificationStatus" "BankVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationProvider" TEXT,
    "verificationMessage" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "merchant_bank_accounts_merchantId_isPrimary_idx" ON "merchant_bank_accounts"("merchantId", "isPrimary");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_bank_accounts_merchantId_fkey') THEN
        ALTER TABLE "merchant_bank_accounts" ADD CONSTRAINT "merchant_bank_accounts_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 7. merchant_verification_records
CREATE TABLE IF NOT EXISTS "merchant_verification_records" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "verificationType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "performedByUserId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_verification_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "merchant_verification_records_applicationId_createdAt_idx" ON "merchant_verification_records"("applicationId", "createdAt");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_verification_records_merchantId_fkey') THEN
        ALTER TABLE "merchant_verification_records" ADD CONSTRAINT "merchant_verification_records_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_verification_records_applicationId_fkey') THEN
        ALTER TABLE "merchant_verification_records" ADD CONSTRAINT "merchant_verification_records_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 8. merchant_application_status_history
CREATE TABLE IF NOT EXISTS "merchant_application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "MerchantApplicationStatus",
    "toStatus" "MerchantApplicationStatus" NOT NULL,
    "changedByUserId" TEXT,
    "changedByRole" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_application_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "merchant_application_status_history_applicationId_createdAt_idx" ON "merchant_application_status_history"("applicationId", "createdAt");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_application_status_history_applicationId_fkey') THEN
        ALTER TABLE "merchant_application_status_history" ADD CONSTRAINT "merchant_application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "merchant_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 9. merchant_notifications
CREATE TABLE IF NOT EXISTS "merchant_notifications" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" "MerchantNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "merchant_notifications_userId_isRead_createdAt_idx" ON "merchant_notifications"("userId", "isRead", "createdAt");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_notifications_merchantId_fkey') THEN
        ALTER TABLE "merchant_notifications" ADD CONSTRAINT "merchant_notifications_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_notifications_userId_fkey') THEN
        ALTER TABLE "merchant_notifications" ADD CONSTRAINT "merchant_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_notifications_applicationId_fkey') THEN
        ALTER TABLE "merchant_notifications" ADD CONSTRAINT "merchant_notifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "merchant_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
