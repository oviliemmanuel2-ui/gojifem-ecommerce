import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as { token?: string; newPassword?: string };
    const token = body.token?.trim() || '';
    const newPassword = body.newPassword || '';

    if (!token) {
      return NextResponse.json({ message: 'Reset token is required.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long.' },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { message: 'This password reset link is invalid or has expired.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      return NextResponse.json({ message: 'Associated account not found.' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { id: record.id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Your password has been updated. You can now sign in with your new password.',
    });
  } catch (err) {
    return handleServerError(err);
  }
}
