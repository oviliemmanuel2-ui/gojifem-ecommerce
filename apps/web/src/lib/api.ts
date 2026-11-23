export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/$/, '');

export interface StoredUserVendor {
  id: string;
  name?: string;
  displayName?: string;
  slug?: string;
  status?: string;
  role?: string;
}

export interface StoredUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  roles: string[];
  vendors?: StoredUserVendor[];
}

export interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: StoredUser;
}

export const SESSION_STORAGE_KEY = 'gojifem_session';

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.accessToken || !parsed.user) return null;
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore storage errors
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders || {});
  if (!headers.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && typeof window !== 'undefined') {
    const session = readStoredSession();
    if (session?.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...rest,
      headers,
    });
  } catch {
    throw new Error(
      'Unable to reach the GOJIFEM server right now. Please check your connection or verify the API server is running.',
    );
  }

  let data: Record<string, unknown> | null = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const rawMessage = data?.message;
    const msg = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : `Request failed with status ${response.status}`;
    throw new Error(msg);
  }

  return data as T;
}
