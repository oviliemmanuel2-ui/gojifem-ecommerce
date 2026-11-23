import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../../lib/server/jwt';
import {
  EDITABLE_APPLICATION_STATUSES,
  ensureMerchantWorkspace,
  getHydratedMerchantState,
} from '../../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Authentication required to submit your merchant application.', code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      termsAccepted?: boolean;
      accuracyConfirmed?: boolean;
    };

    const state = await ensureMerchantWorkspace(auth.sub);
    const app = state.application;
    if (!app) {
      return NextResponse.json({ message: 'Merchant application record not found.' }, { status: 404 });
    }

    if (!EDITABLE_APPLICATION_STATUSES.has(app.status)) {
      return NextResponse.json(
        {
          message: `Application ${app.referenceNumber} has already been submitted (current status: ${app.status.replace(/_/g, ' ')}). Duplicate submissions are not permitted.`,
          code: 'DUPLICATE_SUBMISSION',
          referenceNumber: app.referenceNumber,
          status: app.status,
        },
        { status: 409 },
      );
    }

    if (!body.termsAccepted || !body.accuracyConfirmed) {
      return NextResponse.json(
        { message: 'You must accept the GOJIFEM Merchant Terms and confirm accuracy before submitting.' },
        { status: 400 },
      );
    }

    // Validate Step 1 required business fields
    const bp = state.businessProfile;
    const missingFields: string[] = [];
    if (!bp?.businessName?.trim()) missingFields.push('Business/Company Name');
    if (!bp?.cacRegistrationNumber?.trim()) missingFields.push('CAC Registration Number');
    if (!bp?.hasTinOnFile) missingFields.push('Tax Identification Number (TIN)');
    if (!bp?.businessAddress?.trim()) missingFields.push('Business Address');
    if (!bp?.businessPhone?.trim()) missingFields.push('Business Phone Number');
    if (!bp?.businessEmail?.trim()) missingFields.push('Business Email Address');
    if (!bp?.ownerFullName?.trim()) missingFields.push('Business Owner Full Name');
    if (!bp?.businessDescription?.trim()) missingFields.push('Business Description');
    if (!bp?.businessCategory?.trim()) missingFields.push('Business Category');

    const docs = app.documents || [];
    if (docs.length === 0) {
      missingFields.push('At least one CAC / Business Registration document upload');
    }

    // Validate Step 2 bank fields
    const bk = state.bankAccount;
    if (!bk?.bankName?.trim() || !bk?.accountNumberMasked || !bk?.accountHolderName?.trim()) {
      missingFields.push('Commercial Bank Settlement details');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          message: `Please complete all required onboarding sections before submitting: ${missingFields.join(', ')}.`,
          missingFields,
        },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const now = new Date();
    const prevStatus = app.status;

    await prisma.$transaction(async (tx) => {
      await tx.merchantApplication.update({
        where: { id: app.id },
        data: {
          status: 'PENDING_REVIEW',
          currentStep: 3,
          termsAccepted: true,
          termsAcceptedAt: now,
          accuracyConfirmed: true,
          submittedAt: now,
          rejectionReason: null,
        },
      });

      await tx.merchantApplicationStatusHistory.createMany({
        data: [
          {
            applicationId: app.id,
            fromStatus: prevStatus,
            toStatus: 'SUBMITTED',
            changedByUserId: auth.sub,
            changedByRole: 'MERCHANT',
            notes: `Application ${app.referenceNumber} submitted with ${docs.length} KYC document(s).`,
          },
          {
            applicationId: app.id,
            fromStatus: 'SUBMITTED',
            toStatus: 'PENDING_REVIEW',
            changedByUserId: auth.sub,
            changedByRole: 'SYSTEM',
            notes: 'Queued for GOJIFEM Operations compliance & CAC review.',
          },
        ],
      });

      if (state.merchant.vendorId) {
        await tx.vendor.update({
          where: { id: state.merchant.vendorId },
          data: { status: 'SUBMITTED' },
        });
      }

      await tx.merchantNotification.createMany({
        data: [
          {
            merchantId: state.merchant.id,
            userId: auth.sub,
            applicationId: app.id,
            type: 'APPLICATION_SUBMITTED',
            title: 'Merchant Application Submitted',
            message: `Your application (${app.referenceNumber}) for ${bp!.businessName} was submitted successfully.`,
          },
          {
            merchantId: state.merchant.id,
            userId: auth.sub,
            applicationId: app.id,
            type: 'PENDING_REVIEW',
            title: 'Application Pending Compliance Review',
            message: `GOJIFEM Operations has received ${app.referenceNumber}. Verification of your CAC, TIN, and settlement bank typically completes within 24 business hours.`,
          },
        ],
      });

      await tx.auditLog.create({
        data: {
          actorUserId: auth.sub,
          action: 'SUBMIT_MERCHANT_APPLICATION',
          entityName: 'MerchantApplication',
          entityId: app.id,
          afterState: {
            referenceNumber: app.referenceNumber,
            fromStatus: prevStatus,
            toStatus: 'PENDING_REVIEW',
          },
        },
      });
    });

    const refreshed = await getHydratedMerchantState(state.merchant.id);
    return NextResponse.json(
      {
        submitted: true,
        referenceNumber: app.referenceNumber,
        ...refreshed,
      },
      { status: 200 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
