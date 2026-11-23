import { logOperationalEvent } from './logger';

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

export type ApiErrorCategory =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'SERVER'
  | 'DATABASE'
  | 'AUTH'
  | 'CLIENT'
  | 'ABORTED';

export interface ApiErrorInit {
  message: string;
  category: ApiErrorCategory;
  statusCode?: number;
  code?: string;
  retryable: boolean;
  requestId: string;
  durationMs: number;
  attempts: number;
}

/**
 * Structured error thrown by apiFetch with failure classification, status code,
 * retryability, and correlation ID for safe UI recovery and debugging.
 */
export class ApiError extends Error {
  readonly category: ApiErrorCategory;
  readonly statusCode?: number;
  readonly code?: string;
  readonly retryable: boolean;
  readonly requestId: string;
  readonly durationMs: number;
  readonly attempts: number;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = 'ApiError';
    this.category = init.category;
    this.statusCode = init.statusCode;
    this.code = init.code;
    this.retryable = init.retryable;
    this.requestId = init.requestId;
    this.durationMs = init.durationMs;
    this.attempts = init.attempts;
  }
}

export interface RetryAttemptInfo {
  attempt: number;
  maxRetries: number;
  reason: string;
  delayMs: number;
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  idempotencyKey?: string;
  dedupeKey?: string;
  cancelPreviousKey?: string;
  onRetryAttempt?: (info: RetryAttemptInfo) => void;
  baseUrl?: string;
  silentLog?: boolean;
}

export interface ApiConnectivityEvent {
  ok: boolean;
  endpoint: string;
  category?: ApiErrorCategory;
  statusCode?: number;
  timestamp: string;
}

type ConnectivityListener = (event: ApiConnectivityEvent) => void;

const connectivityListeners = new Set<ConnectivityListener>();
const inFlightDeduped = new Map<string, Promise<unknown>>();
const cancelableControllers = new Map<string, AbortController>();

export function subscribeToApiConnectivity(listener: ConnectivityListener): () => void {
  connectivityListeners.add(listener);
  return () => {
    connectivityListeners.delete(listener);
  };
}

function notifyConnectivity(event: ApiConnectivityEvent): void {
  for (const listener of connectivityListeners) {
    try {
      listener(event);
    } catch {
      // Never allow observer errors to break callers
    }
  }
}

export function generateIdempotencyKey(prefix = 'idem'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createClientRequestId(): string {
  return `creq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function isTransientStatusCode(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function classifyHttpStatus(
  status: number,
  code?: string,
  message?: string,
): { category: ApiErrorCategory; retryable: boolean } {
  const upperCode = (code || '').toUpperCase();
  const lowerMsg = (message || '').toLowerCase();

  if (
    upperCode.includes('DATABASE') ||
    lowerMsg.includes('database') ||
    lowerMsg.includes('postgresql')
  ) {
    return { category: 'DATABASE', retryable: status === 503 || status === 504 };
  }
  if (status === 401 || status === 403 || upperCode.includes('AUTH')) {
    return { category: 'AUTH', retryable: false };
  }
  if (isTransientStatusCode(status)) {
    return { category: 'SERVER', retryable: true };
  }
  if (status >= 500) {
    return { category: 'SERVER', retryable: false };
  }
  return { category: 'CLIENT', retryable: false };
}

function sleepAbortable(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function executeApiFetch<T>(
  path: string,
  options: ApiFetchOptions,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const isSafeMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const isPaymentOrOrderMutation =
    method === 'POST' && /\/(checkout|payments\/initialize|orders)(\/|$)/i.test(normalizedPath);

  // Strict safety: payment / order creation requests NEVER auto-retry.
  const requestedRetries = options.maxRetries ?? (isSafeMethod ? 2 : 0);
  const maxRetries = isPaymentOrOrderMutation
    ? 0
    : isSafeMethod || options.idempotencyKey
      ? Math.max(0, Math.min(3, requestedRetries))
      : 0;

  const timeoutMs = options.timeoutMs ?? (isSafeMethod ? 12000 : 15000);
  const resolvedBase = (options.baseUrl || API_BASE_URL).replace(/\/$/, '');
  const targetUrl = `${resolvedBase}${normalizedPath}`;
  const requestId = createClientRequestId();
  const overallStarted = Date.now();

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const err = new ApiError({
      message:
        'You appear to be offline. Your cart is safely saved — please check your internet connection and try again.',
      category: 'OFFLINE',
      retryable: true,
      requestId,
      durationMs: 0,
      attempts: 0,
    });
    if (!options.silentLog) {
      logOperationalEvent({
        level: 'warn',
        requestId,
        category: 'OFFLINE',
        endpoint: normalizedPath,
        method,
        durationMs: 0,
        attempt: 0,
        message: err.message,
      });
    }
    notifyConnectivity({
      ok: false,
      endpoint: normalizedPath,
      category: 'OFFLINE',
      timestamp: new Date().toISOString(),
    });
    throw err;
  }

  let supersedeController: AbortController | null = null;
  if (options.cancelPreviousKey) {
    const prev = cancelableControllers.get(options.cancelPreviousKey);
    if (prev) {
      prev.abort();
    }
    supersedeController = new AbortController();
    cancelableControllers.set(options.cancelPreviousKey, supersedeController);
  }

  let lastError: ApiError | null = null;

  try {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      if (supersedeController?.signal.aborted || options.signal?.aborted) {
        throw new ApiError({
          message: 'A newer request superseded this operation.',
          category: 'ABORTED',
          retryable: false,
          requestId,
          durationMs: Date.now() - overallStarted,
          attempts: attempt,
        });
      }

      const headers = new Headers(options.headers || {});
      if (
        !headers.has('Content-Type') &&
        options.body &&
        !(typeof FormData !== 'undefined' && options.body instanceof FormData)
      ) {
        headers.set('Content-Type', 'application/json');
      }
      if (options.idempotencyKey && !headers.has('X-Idempotency-Key')) {
        headers.set('X-Idempotency-Key', options.idempotencyKey);
      }
      if (!options.skipAuth && typeof window !== 'undefined') {
        const session = readStoredSession();
        if (session?.accessToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${session.accessToken}`);
        }
      }

      const attemptController = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        attemptController.abort();
      }, timeoutMs);

      const abortAttempt = () => attemptController.abort();
      options.signal?.addEventListener('abort', abortAttempt, { once: true });
      supersedeController?.signal.addEventListener('abort', abortAttempt, { once: true });

      const attemptStarted = Date.now();

      try {
        const {
          skipAuth: _s,
          timeoutMs: _t,
          maxRetries: _m,
          idempotencyKey: _ik,
          dedupeKey: _dk,
          cancelPreviousKey: _ck,
          onRetryAttempt: _ora,
          baseUrl: _bu,
          silentLog: _sl,
          headers: _h,
          signal: _sig,
          ...fetchRest
        } = options;

        const response = await fetch(targetUrl, {
          ...fetchRest,
          method,
          headers,
          signal: attemptController.signal,
        });

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
          const code = typeof data?.code === 'string' ? data.code : undefined;
          const { category, retryable } = classifyHttpStatus(response.status, code, msg);

          const err = new ApiError({
            message: msg,
            category,
            statusCode: response.status,
            code,
            retryable,
            requestId,
            durationMs: Date.now() - attemptStarted,
            attempts: attempt,
          });
          lastError = err;

          const canRetry = retryable && attempt <= maxRetries;
          if (!canRetry) {
            if (!options.silentLog) {
              logOperationalEvent({
                level: 'error',
                requestId,
                category,
                endpoint: normalizedPath,
                method,
                statusCode: response.status,
                durationMs: Date.now() - overallStarted,
                attempt,
                message: msg,
                context: { code },
              });
            }
            if (category === 'SERVER' || category === 'DATABASE') {
              notifyConnectivity({
                ok: false,
                endpoint: normalizedPath,
                category,
                statusCode: response.status,
                timestamp: new Date().toISOString(),
              });
            }
            throw err;
          }

          const delayMs = Math.min(2000, 350 * 2 ** (attempt - 1));
          options.onRetryAttempt?.({
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            reason: msg,
            delayMs,
          });
          if (!options.silentLog) {
            logOperationalEvent({
              level: 'warn',
              requestId,
              category,
              endpoint: normalizedPath,
              method,
              statusCode: response.status,
              durationMs: Date.now() - attemptStarted,
              attempt,
              message: `Transient HTTP ${response.status}, retrying in ${delayMs}ms`,
            });
          }
          await sleepAbortable(
            delayMs,
            supersedeController?.signal || options.signal || undefined,
          );
          continue;
        }

        notifyConnectivity({
          ok: true,
          endpoint: normalizedPath,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        });
        return data as T;
      } catch (err) {
        if (err instanceof ApiError) {
          throw err;
        }

        const isCallerAbort =
          options.signal?.aborted || supersedeController?.signal.aborted;
        if (isCallerAbort) {
          throw new ApiError({
            message: supersedeController?.signal.aborted
              ? 'Request superseded by a newer request.'
              : 'The request was cancelled before completion.',
            category: 'ABORTED',
            retryable: false,
            requestId,
            durationMs: Date.now() - overallStarted,
            attempts: attempt,
          });
        }

        const isOffline =
          typeof navigator !== 'undefined' && navigator.onLine === false;
        const isTimeout =
          timedOut || (err instanceof Error && err.name === 'AbortError');
        const category: ApiErrorCategory = isOffline
          ? 'OFFLINE'
          : isTimeout
            ? 'TIMEOUT'
            : 'NETWORK';
        const message = isOffline
          ? 'You appear to be offline. Please check your internet connection and try again.'
          : isTimeout
            ? 'The request is taking longer than expected. Please check your connection and try again.'
            : 'Unable to reach the GOJIFEM server right now. Please check your connection or verify the API server is running.';

        const wrapped = new ApiError({
          message,
          category,
          retryable: !isOffline,
          requestId,
          durationMs: Date.now() - attemptStarted,
          attempts: attempt,
        });
        lastError = wrapped;

        const canRetry = !isOffline && attempt <= maxRetries;
        if (!canRetry) {
          if (!options.silentLog) {
            logOperationalEvent({
              level: 'error',
              requestId,
              category,
              endpoint: normalizedPath,
              method,
              durationMs: Date.now() - overallStarted,
              attempt,
              message,
            });
          }
          notifyConnectivity({
            ok: false,
            endpoint: normalizedPath,
            category,
            timestamp: new Date().toISOString(),
          });
          throw wrapped;
        }

        const delayMs = Math.min(2000, 350 * 2 ** (attempt - 1));
        options.onRetryAttempt?.({
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          reason: message,
          delayMs,
        });
        if (!options.silentLog) {
          logOperationalEvent({
            level: 'warn',
            requestId,
            category,
            endpoint: normalizedPath,
            method,
            durationMs: Date.now() - attemptStarted,
            attempt,
            message: `${category} error (${message}), retrying in ${delayMs}ms`,
          });
        }
        await sleepAbortable(
          delayMs,
          supersedeController?.signal || options.signal || undefined,
        );
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abortAttempt);
        supersedeController?.signal.removeEventListener('abort', abortAttempt);
      }
    }
  } finally {
    if (
      options.cancelPreviousKey &&
      cancelableControllers.get(options.cancelPreviousKey) === supersedeController
    ) {
      cancelableControllers.delete(options.cancelPreviousKey);
    }
  }

  throw (
    lastError ||
    new ApiError({
      message: 'Request failed unexpectedly.',
      category: 'SERVER',
      retryable: false,
      requestId,
      durationMs: Date.now() - overallStarted,
      attempts: 1,
    })
  );
}

/**
 * Resilient HTTP client with strict timeout enforcement, transient GET retries,
 * zero duplicate payment retries, request deduplication, conflict cancellation,
 * and structured error logging.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const dedupeKey =
    options.dedupeKey && (method === 'GET' || method === 'HEAD')
      ? `${method}:${options.baseUrl || API_BASE_URL}:${options.dedupeKey}`
      : null;

  if (dedupeKey) {
    const existing = inFlightDeduped.get(dedupeKey) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }
    const promise = executeApiFetch<T>(path, options).finally(() => {
      inFlightDeduped.delete(dedupeKey);
    });
    inFlightDeduped.set(dedupeKey, promise);
    return promise;
  }

  return executeApiFetch<T>(path, options);
}
