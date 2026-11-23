import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import { ensureMerchantWorkspace } from '../../../../../lib/server/merchant';
import { handleServerError, requireDatabase } from '../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) {
    return NextResponse.json(
      { message: 'Please sign in to access Sell on GOJIFEM merchant onboarding.', code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const state = await ensureMerchantWorkspace(auth.sub);
    return NextResponse.json(state, { status: 200 });
  } catch (err) {
    return handleServerError(err);
  }
}
