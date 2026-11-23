import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { issueTokenPair } from '../../../../../lib/server/jwt';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.toLowerCase().trim() || '';
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email address and password are required.' },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        userRoles: { include: { role: true } },
        vendorMemberships: {
          where: { isActive: true },
          include: { vendor: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return NextResponse.json(
        { message: `Account is ${user.accountStatus.toLowerCase()}` },
        { status: 401 },
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          message:
            'This account was created with Google or Apple Sign-In. Please sign in with that provider or use Forgot Password to set a password.',
        },
        { status: 401 },
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
    if (roles.length === 0) roles.push('CUSTOMER');
    const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

    const tokens = issueTokenPair(user.id, user.email, roles, vendorIds);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.customerProfile?.firstName,
          lastName: user.customerProfile?.lastName,
          avatarUrl: user.customerProfile?.avatarUrl,
          emailVerified: user.emailVerified,
          roles,
          vendors: user.vendorMemberships.map((vm) => ({
            id: vm.vendor.id,
            name: vm.vendor.displayName,
            slug: vm.vendor.slug,
            status: vm.vendor.status,
            role: vm.role,
          })),
        },
        ...tokens,
      },
      { status: 200 },
    );
  } catch (err) {
    return handleServerError(err);
  }
}
