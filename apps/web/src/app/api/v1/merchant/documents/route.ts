import crypto from 'node:crypto';
import type { MerchantKycDocumentType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import { uploadPrivateKycObject, validateKycFile } from '../../../../../lib/server/kycStorage';
import {
  EDITABLE_APPLICATION_STATUSES,
  ensureMerchantWorkspace,
  getHydratedMerchantState,
} from '../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_DOC_TYPES = new Set<MerchantKycDocumentType>([
  'CAC_CERTIFICATE',
  'BUSINESS_REGISTRATION',
  'TIN_CERTIFICATE',
  'GOVERNMENT_ID',
  'UTILITY_BILL',
  'ADDITIONAL_REQUESTED',
  'OTHER',
]);

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Authentication required to upload KYC documents.', code: 'AUTH_REQUIRED' },
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
          message: `Documents cannot be modified while application status is ${app?.status?.replace(/_/g, ' ') || 'locked'}.`,
          code: 'APPLICATION_LOCKED',
        },
        { status: 409 },
      );
    }

    const formData = await req.formData();
    const fileField = formData.get('file');
    const docTypeRaw = String(formData.get('documentType') || 'CAC_CERTIFICATE').toUpperCase() as MerchantKycDocumentType;
    const replaceDocumentId = String(formData.get('replaceDocumentId') || '').trim() || null;

    if (!fileField || typeof fileField === 'string' || typeof (fileField as File).arrayBuffer !== 'function') {
      return NextResponse.json(
        { message: 'Please attach a PDF, JPG, JPEG, or PNG document file.' },
        { status: 400 },
      );
    }

    const fileObj = fileField as File;
    const rawBuffer = Buffer.from(await fileObj.arrayBuffer());

    let validated;
    try {
      validated = validateKycFile(fileObj.name || 'document.pdf', fileObj.type || '', rawBuffer);
    } catch (validationErr: unknown) {
      return NextResponse.json(
        {
          message:
            validationErr instanceof Error ? validationErr.message : 'Invalid KYC document.',
        },
        { status: 400 },
      );
    }

    const documentType = VALID_DOC_TYPES.has(docTypeRaw) ? docTypeRaw : 'CAC_CERTIFICATE';
    const storageKey = `${state.merchant.id}/${app.id}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${validated.safeFileName}`;

    const stored = await uploadPrivateKycObject(
      storageKey,
      validated.buffer,
      validated.normalizedMimeType,
    );

    const prisma = getPrisma();
    const createdDoc = await prisma.$transaction(async (tx) => {
      if (replaceDocumentId) {
        await tx.merchantKycDocument.updateMany({
          where: {
            id: replaceDocumentId,
            merchantId: state.merchant.id,
            applicationId: app.id,
          },
          data: { status: 'REPLACED' },
        });
      }

      const doc = await tx.merchantKycDocument.create({
        data: {
          merchantId: state.merchant.id,
          applicationId: app.id,
          documentType,
          fileName: validated.safeFileName,
          mimeType: validated.normalizedMimeType,
          fileSizeBytes: validated.fileSizeBytes,
          sha256Checksum: validated.sha256Checksum,
          storageProvider: stored.storageProvider,
          storageBucket: stored.storageBucket,
          storageKey: stored.storageKey,
          encryptedPayload: stored.encryptedPayload
            ? Uint8Array.from(stored.encryptedPayload)
            : null,
          status: 'UPLOADED',
          uploadedByUserId: auth.sub,
        },
        select: {
          id: true,
          documentType: true,
          fileName: true,
          mimeType: true,
          fileSizeBytes: true,
          status: true,
          storageProvider: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: auth.sub,
          action: 'UPLOAD_MERCHANT_KYC_DOCUMENT',
          entityName: 'MerchantKycDocument',
          entityId: doc.id,
          afterState: {
            documentType,
            fileName: validated.safeFileName,
            fileSizeBytes: validated.fileSizeBytes,
            storageProvider: stored.storageProvider,
          },
        },
      });

      return doc;
    });

    const refreshed = await getHydratedMerchantState(state.merchant.id);
    return NextResponse.json(
      {
        document: createdDoc,
        application: refreshed.application,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
