import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeGoogleCode,
  OAuthAuthError,
  OAuthConfigError,
  resolveRequestOrigin,
} from '../../../../../../lib/server/oauth';
import { handleServerError, requireDatabase } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  try {
    const body = (await req.json()) as { code?: string; redirectUri?: string };
    if (!body.code) {
      return NextResponse.json({ message: 'Google authorization code is required.' }, { status: 400 });
    }

    const origin = resolveRequestOrigin(req);
    const result = await exchangeGoogleCode(body.code, origin, body.redirectUri);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof OAuthConfigError) {
      return NextResponse.json({ message: err.message }, { status: 503 });
    }
    if (err instanceof OAuthAuthError) {
      return NextResponse.json({ message: err.message }, { status: 401 });
    }
    return handleServerError(err);
  }
}
