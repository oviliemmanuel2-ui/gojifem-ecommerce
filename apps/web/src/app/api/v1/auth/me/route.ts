import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const payload = authenticateRequest(req);
  if (!payload) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        customerProfile: true,
        addresses: true,
        userRoles: { include: { role: true } },
        vendorMemberships: { include: { vendor: true } },
        oauthAccounts: { select: { provider: true, createdAt: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      profile: user.customerProfile,
      addresses: user.addresses,
      roles: user.userRoles.map((ur) => ur.role.code),
      oauthProviders: user.oauthAccounts.map((o) => o.provider),
      vendors: user.vendorMemberships.map((vm) => ({
        id: vm.vendor.id,
        name: vm.vendor.displayName,
        slug: vm.vendor.slug,
        status: vm.vendor.status,
        role: vm.role,
      })),
    });
  } catch (err) {
    return handleServerError(err);
  }
}
