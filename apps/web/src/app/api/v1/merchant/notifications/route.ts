import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      notificationId?: string;
      markAll?: boolean;
    };

    const prisma = getPrisma();
    const now = new Date();

    if (body.markAll) {
      await prisma.merchantNotification.updateMany({
        where: { userId: auth.sub, isRead: false },
        data: { isRead: true, readAt: now },
      });
    } else if (body.notificationId) {
      await prisma.merchantNotification.updateMany({
        where: { id: body.notificationId, userId: auth.sub },
        data: { isRead: true, readAt: now },
      });
    }

    return NextResponse.json({ updated: true }, { status: 200 });
  } catch (err) {
    return handleServerError(err);
  }
}
