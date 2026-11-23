import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../../lib/server/jwt';
import { deletePrivateKycObject, downloadPrivateKycObject } from '../../../../../../lib/server/kycStorage';
import { EDITABLE_APPLICATION_STATUSES } from '../../../../../../lib/server/merchant';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ message: 'Authentication required to view private KYC documents.' }, { status: 401 });
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const { id } = await context.params;
    const prisma = getPrisma();

    const [doc, caller] = await Promise.all([
      prisma.merchantKycDocument.findUnique({
        where: { id },
        include: { merchant: true },
      }),
      prisma.user.findUnique({
        where: { id: auth.sub },
        include: { userRoles: { include: { role: true } } },
      }),
    ]);

    if (!doc) {
      return NextResponse.json({ message: 'Document not found.' }, { status: 404 });
    }

    const isOwner = doc.merchant.ownerUserId === auth.sub;
    const isAdmin = Boolean(
      caller?.userRoles.some((ur) => ur.role.code === 'ADMIN' || ur.role.code === 'MODERATOR'),
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'You are not authorized to access this private document.' },
        { status: 403 },
      );
    }

    const bytes = await downloadPrivateKycObject(doc);

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.sub,
        action: 'VIEW_MERCHANT_KYC_DOCUMENT',
        entityName: 'MerchantKycDocument',
        entityId: doc.id,
        afterState: { viewerRole: isAdmin ? 'ADMIN' : 'MERCHANT' },
      },
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': `inline; filename="${doc.fileName.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return handleServerError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const { id } = await context.params;
    const prisma = getPrisma();

    const doc = await prisma.merchantKycDocument.findUnique({
      where: { id },
      include: { merchant: true, application: true },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found.' }, { status: 404 });
    }
    if (doc.merchant.ownerUserId !== auth.sub) {
      return NextResponse.json({ message: 'Forbidden: document belongs to another merchant.' }, { status: 403 });
    }
    if (!EDITABLE_APPLICATION_STATUSES.has(doc.application.status)) {
      return NextResponse.json(
        { message: 'Cannot remove documents after application submission.' },
        { status: 409 },
      );
    }

    await deletePrivateKycObject(doc);
    await prisma.$transaction([
      prisma.merchantKycDocument.delete({ where: { id: doc.id } }),
      prisma.auditLog.create({
        data: {
          actorUserId: auth.sub,
          action: 'DELETE_MERCHANT_KYC_DOCUMENT',
          entityName: 'MerchantKycDocument',
          entityId: doc.id,
          beforeState: { fileName: doc.fileName, documentType: doc.documentType },
        },
      }),
    ]);

    return NextResponse.json({ deleted: true, id: doc.id }, { status: 200 });
  } catch (err) {
    return handleServerError(err);
  }
}
