export const CHECKOUT_AUTH_MESSAGE =
  'Please sign in or create an account to continue with checkout.';

export const POST_AUTH_REDIRECT_KEY = 'gojifem_post_auth_redirect';

export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('/auth/')) return false;
  return true;
}

export function savePostAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  if (!isSafeInternalPath(path)) return;
  try {
    localStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {
    // Ignore storage errors
  }
}

export function peekPostAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(POST_AUTH_REDIRECT_KEY);
    return isSafeInternalPath(val) ? val : null;
  } catch {
    return null;
  }
}

export function consumePostAuthRedirect(
  queryRedirect?: string | null,
  fallback: string = '/account',
): string {
  let stored: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      stored = localStorage.getItem(POST_AUTH_REDIRECT_KEY);
      localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  if (isSafeInternalPath(queryRedirect)) {
    return queryRedirect;
  }
  if (isSafeInternalPath(stored)) {
    return stored;
  }
  return fallback;
}
