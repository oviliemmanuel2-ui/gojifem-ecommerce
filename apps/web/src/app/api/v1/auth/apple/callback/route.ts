import { NextRequest, NextResponse } from 'next/server';
import {
  OAuthAuthError,
  OAuthConfigError,
  resolveRequestOrigin,
  verifyAndProcessAppleCallback,
} from '../../../../../../lib/server/oauth';
import { handleServerError, isDatabaseConfigured } from '../../../../../../lib/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  const isFormPost = contentType.includes('application/x-www-form-urlencoded');
  const origin = resolveRequestOrigin(req);

  let idToken = '';
  let userJson: string | null = null;
  let appleError: string | null = null;

  try {
    if (isFormPost) {
      const formData = await req.formData();
      idToken = String(formData.get('id_token') || '');
      const rawUser = formData.get('user');
      userJson = rawUser ? String(rawUser) : null;
      const errField = formData.get('error');
      appleError = errField ? String(errField) : null;
    } else {
      const body = (await req.json()) as { id_token?: string; user?: string; error?: string };
      idToken = body.id_token || '';
      userJson = body.user || null;
      appleError = body.error || null;
    }

    if (appleError) {
      throw new OAuthAuthError(`Apple Sign-In declined: ${appleError}`);
    }

    if (!isDatabaseConfigured()) {
      throw new OAuthConfigError(
        'Database connection (DATABASE_URL) is not configured in Vercel Environment Variables.',
      );
    }

    if (!idToken) {
      throw new OAuthAuthError('Apple identity token is required.');
    }

    const result = await verifyAndProcessAppleCallback({ idToken, userJson });

    if (isFormPost) {
      const hashParams = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return NextResponse.redirect(`${origin}/auth/callback/apple#${hashParams.toString()}`, {
        status: 303,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Apple Sign-In failed.';
    if (isFormPost) {
      return NextResponse.redirect(
        `${origin}/auth/callback/apple?error=${encodeURIComponent(message)}`,
        { status: 303 },
      );
    }
    if (err instanceof OAuthConfigError) {
      return NextResponse.json({ message }, { status: 503 });
    }
    if (err instanceof OAuthAuthError) {
      return NextResponse.json({ message }, { status: 401 });
    }
    return handleServerError(err);
  }
}
