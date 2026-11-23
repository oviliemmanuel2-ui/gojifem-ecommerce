import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email?.toLowerCase().trim() || '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid email address.' }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err) {
    return handleServerError(err);
  }
}
