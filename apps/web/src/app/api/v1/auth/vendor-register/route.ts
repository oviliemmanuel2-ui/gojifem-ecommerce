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
      legalName?: string;
      displayName?: string;
      phone?: string;
      operatingLocation?: string;
    };

    const email = body.email?.toLowerCase().trim() || '';
    const password = body.password || '';
    const legalName = body.legalName?.trim() || '';
    const displayName = body.displayName?.trim() || '';
    const phone = body.phone?.replace(/[\s\-()]/g, '').trim() || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Please provide a valid merchant email.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long.' },
        { status: 400 },
      );
    }
    if (!legalName || !displayName) {
      return NextResponse.json(
        { message: 'Legal business name and store display name are required.' },
        { status: 400 },
      );
    }
    if (!phone || !/^\+?[1-9]\d{6,14}$/.test(phone)) {
      return NextResponse.json(
        { message: 'Merchant phone must be in valid international E.164 format.' },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'An account with this email or phone number already exists.' },
        { status: 409 },
      );
    }

    const slugBase = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        accountStatus: 'ACTIVE',
        emailVerified: false,
        ownedVendors: {
          create: {
            legalName,
            displayName,
            slug: uniqueSlug,
            status: 'DRAFT',
            commissionRateBps: 1000,
            description: body.operatingLocation ? `Located in ${body.operatingLocation}` : undefined,
          },
        },
      },
      include: {
        ownedVendors: true,
      },
    });

    const vendor = user.ownedVendors[0];

    await prisma.vendorMembership.create({
      data: {
        vendorId: vendor.id,
        userId: user.id,
        role: 'OWNER',
      },
    });

    const vendorRole = await ensureRole('VENDOR_OWNER', 'Merchant Owner');
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: vendorRole.id,
        vendorId: vendor.id,
      },
    });

    await prisma.emailVerificationToken.deleteMany({ where: { email } });
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await prisma.emailVerificationToken.create({
      data: {
        email,
        token: verifyToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const tokens = issueTokenPair(user.id, user.email, ['VENDOR_OWNER'], [vendor.id]);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          emailVerified: false,
          roles: ['VENDOR_OWNER'],
        },
        vendor: {
          id: vendor.id,
          displayName: vendor.displayName,
          slug: vendor.slug,
          status: vendor.status,
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
