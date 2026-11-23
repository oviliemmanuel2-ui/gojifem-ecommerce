import type { NextRequest } from 'next/server';

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_STORE_ENTRIES = 500;

interface IdempotencyRecord {
  status: 'IN_PROGRESS' | 'COMPLETED';
  httpStatus?: number;
  body?: Record<string, unknown>;
  expiresAt: number;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var gojifemIdempotencyStore: Map<string, IdempotencyRecord> | undefined;
}

function getStore(): Map<string, IdempotencyRecord> {
  if (!globalThis.gojifemIdempotencyStore) {
    globalThis.gojifemIdempotencyStore = new Map<string, IdempotencyRecord>();
  }
  return globalThis.gojifemIdempotencyStore;
}

function pruneStore(store: Map<string, IdempotencyRecord>, now: number): void {
  for (const [k, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(k);
    }
  }
  while (store.size >= MAX_STORE_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) break;
    store.delete(oldestKey);
  }
}

/**
 * Extracts and validates an idempotency key from header or request body.
 */
export function extractIdempotencyKey(
  req: Pick<NextRequest, 'headers'>,
  bodyKey?: unknown,
): string | null {
  const headerVal = req.headers.get('x-idempotency-key') || '';
  const candidate = (headerVal || (typeof bodyKey === 'string' ? bodyKey : '')).trim();
  if (candidate.length < 8 || candidate.length > 128) {
    return null;
  }
  return candidate;
}

export function buildIdempotencyScopeKey(
  scope: string,
  userId: string,
  idempotencyKey: string,
): string {
  return `${scope}:${userId}:${idempotencyKey}`;
}

export type IdempotencyBeginResult =
  | { state: 'PROCEED' }
  | { state: 'IN_PROGRESS' }
  | { state: 'REPLAY'; status: number; body: Record<string, unknown> };

/**
 * Begins or replays an idempotent operation for checkout and payment initialization.
 */
export function beginIdempotentOperation(
  compositeKey: string,
  ttlMs: number = DEFAULT_TTL_MS,
): IdempotencyBeginResult {
  const store = getStore();
  const now = Date.now();
  const existing = store.get(compositeKey);

  if (existing && existing.expiresAt > now) {
    if (existing.status === 'IN_PROGRESS') {
      return { state: 'IN_PROGRESS' };
    }
    if (existing.status === 'COMPLETED' && existing.body) {
      return {
        state: 'REPLAY',
        status: existing.httpStatus || 200,
        body: existing.body,
      };
    }
  }

  pruneStore(store, now);
  store.set(compositeKey, {
    status: 'IN_PROGRESS',
    createdAt: now,
    expiresAt: now + ttlMs,
  });

  return { state: 'PROCEED' };
}

/**
 * Caches successful (2xx) idempotent results for safe replay if a client retries after a dropped connection.
 */
export function completeIdempotentOperation(
  compositeKey: string,
  httpStatus: number,
  body: Record<string, unknown>,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  const store = getStore();
  if (httpStatus < 200 || httpStatus >= 300) {
    store.delete(compositeKey);
    return;
  }
  const now = Date.now();
  pruneStore(store, now);
  store.set(compositeKey, {
    status: 'COMPLETED',
    httpStatus,
    body,
    createdAt: now,
    expiresAt: now + ttlMs,
  });
}

/**
 * Releases an in-progress idempotency lock when an operation fails so the customer can retry cleanly.
 */
export function releaseIdempotentOperation(compositeKey: string): void {
  getStore().delete(compositeKey);
}
