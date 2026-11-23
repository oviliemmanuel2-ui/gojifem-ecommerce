import crypto from 'node:crypto';
import { redactSensitiveData } from '../logger';

export type ServerLogLevel = 'info' | 'warn' | 'error';

/**
 * Generates a short correlation ID for server API requests and error diagnostics.
 */
export function createRequestId(): string {
  return `req_${crypto.randomBytes(5).toString('hex')}`;
}

/**
 * Emits a sanitized single-line JSON log entry suitable for Vercel / server log collectors.
 */
export function logServerEvent(
  level: ServerLogLevel,
  route: string,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const errObj = meta?.error as { name?: string; code?: string; message?: string } | undefined;
  const sanitizedMeta = meta
    ? (redactSensitiveData({ ...meta, error: undefined }) as Record<string, unknown>)
    : undefined;

  const payload = {
    service: 'gojifem-web-api',
    timestamp: new Date().toISOString(),
    level,
    route,
    message,
    ...(errObj
      ? {
          errorName: errObj.name,
          errorCode: errObj.code,
          errorMessage: errObj.message,
        }
      : {}),
    ...(sanitizedMeta ? { meta: sanitizedMeta } : {}),
  };

  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}
