import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

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

    if (user && !user.emailVerified) {
      await prisma.emailVerificationToken.deleteMany({ where: { email } });
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.emailVerificationToken.create({
        data: {
          email,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({
      message: 'If your account requires email verification, a verification link has been sent.',
    });
  } catch (err) {
    return handleServerError(err);
  }
}
