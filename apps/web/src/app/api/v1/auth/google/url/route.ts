import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthUrl,
  OAuthConfigError,
  resolveRequestOrigin,
} from '../../../../../../lib/server/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const intent = req.nextUrl.searchParams.get('intent') || 'login';
    const explicitRedirectUri = req.nextUrl.searchParams.get('redirectUri') || undefined;
    const origin = resolveRequestOrigin(req);
    const url = buildGoogleAuthUrl(origin, intent, explicitRedirectUri);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    if (err instanceof OAuthConfigError) {
      return NextResponse.json({ message: err.message, code: 'GOOGLE_OAUTH_NOT_CONFIGURED' }, { status: 503 });
    }
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Unable to start Google Sign-In.' },
      { status: 500 },
    );
  }
}
