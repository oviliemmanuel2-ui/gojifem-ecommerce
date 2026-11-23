import { NextRequest, NextResponse } from 'next/server';
import { issueTokenPair, verifyRefreshJwt } from '../../../../../lib/server/jwt';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as { refreshToken?: string };
    if (!body.refreshToken) {
      return NextResponse.json({ message: 'Refresh token is required.' }, { status: 400 });
    }

    let payload;
    try {
      payload = verifyRefreshJwt(body.refreshToken);
    } catch {
      return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: { include: { role: true } },
        vendorMemberships: { where: { isActive: true } },
      },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      return NextResponse.json({ message: 'User account invalid or suspended' }, { status: 401 });
    }

    const roles = Array.from(new Set(user.userRoles.map((ur) => ur.role.code)));
    if (roles.length === 0) roles.push('CUSTOMER');
    const vendorIds = user.vendorMemberships.map((vm) => vm.vendorId);

    return NextResponse.json(issueTokenPair(user.id, user.email, roles, vendorIds));
  } catch (err) {
    return handleServerError(err);
  }
}
