import { NextRequest, NextResponse } from 'next/server';
import {
  buildAppleAuthUrl,
  OAuthConfigError,
  resolveRequestOrigin,
} from '../../../../../../lib/server/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const intent = req.nextUrl.searchParams.get('intent') || 'login';
    const origin = resolveRequestOrigin(req);
    const url = buildAppleAuthUrl(origin, intent);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    if (err instanceof OAuthConfigError) {
      return NextResponse.json({ message: err.message, code: 'APPLE_OAUTH_NOT_CONFIGURED' }, { status: 503 });
    }
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Unable to start Apple Sign-In.' },
      { status: 500 },
    );
  }
}
