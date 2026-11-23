import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { issueTokenPair } from '../../../../../lib/server/jwt';
import { ensureRole } from '../../../../../lib/server/oauth';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    const email = body.email?.toLowerCase().trim() || '';
    const password = body.password || '';
    const firstName = body.firstName?.trim() || '';
    const lastName = body.lastName?.trim() || '';
    const phone = body.phone?.replace(/[\s\-()]/g, '').trim() || undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long.' },
        { status: 400 },
      );
    }
    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: 'First name and last name are required.' },
        { status: 400 },
      );
    }
    if (phone && !/^\+?[1-9]\d{6,14}$/.test(phone)) {
      return NextResponse.json(
        { message: 'Phone number must be in valid international E.164 format.' },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'An account with this email or phone number already exists.' },
        { status: 409 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const customerRole = await ensureRole('CUSTOMER', 'Customer Buyer');
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash,
          accountStatus: 'ACTIVE',
          emailVerified: false,
          customerProfile: {
            create: {
              firstName,
              lastName,
            },
          },
        },
      });

      await tx.userRole.create({
        data: {
          userId: created.id,
          roleId: customerRole.id,
        },
      });

      await tx.emailVerificationToken.deleteMany({ where: { email } });
      await tx.emailVerificationToken.create({
        data: {
          email,
          token: verifyToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return created;
    });

    const tokens = issueTokenPair(user.id, user.email, ['CUSTOMER'], []);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName,
          lastName,
          emailVerified: false,
          roles: ['CUSTOMER'],
        },
        emailVerificationRequired: true,
        ...tokens,
      },
      { status: 201 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
