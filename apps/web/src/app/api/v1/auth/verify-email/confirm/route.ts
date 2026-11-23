import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as { token?: string };
    const token = body.token?.trim() || '';
    if (!token) {
      return NextResponse.json({ message: 'Verification token is required.' }, { status: 400 });
    }

    const prisma = getPrisma();
    const record = await prisma.emailVerificationToken.findUnique({ where: { token } });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { message: 'This verification link is invalid or has expired.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Your email address has been verified successfully.',
    });
  } catch (err) {
    return handleServerError(err);
  }
}
