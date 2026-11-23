export type OperationalLogLevel = 'info' | 'warn' | 'error';

export type OperationalCategory =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'SERVER'
  | 'DATABASE'
  | 'AUTH'
  | 'CLIENT'
  | 'ABORTED'
  | 'HEALTH'
  | 'CART'
  | 'PAYMENT';

export interface OperationalLogEntry {
  timestamp: string;
  level: OperationalLogLevel;
  requestId?: string;
  category: OperationalCategory | string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  attempt?: number;
  message: string;
  context?: Record<string, unknown>;
}

const MAX_LOG_BUFFER = 50;
const logRingBuffer: OperationalLogEntry[] = [];

const SENSITIVE_KEY_PATTERN =
  /^(authorization|password|pass|token|accessToken|refreshToken|secret|card|cardNumber|cvv|cvc|pin|cookie|set-cookie|apiKey)$/i;

/**
 * Recursively redacts credentials, bearer tokens, and payment secrets before logging.
 */
export function redactSensitiveData(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[TRUNCATED]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.startsWith('Bearer ') && value.length > 16) {
      return 'Bearer [REDACTED]';
    }
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactSensitiveData(item, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(k) || /secret|token|password|auth/i.test(k)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = redactSensitiveData(v, depth + 1);
    }
  }
  return out;
}

/**
 * Records a sanitized operational event in memory and writes structured console diagnostics.
 */
export function logOperationalEvent(
  entry: Omit<OperationalLogEntry, 'timestamp'>,
): OperationalLogEntry {
  const sanitizedContext = entry.context
    ? (redactSensitiveData(entry.context) as Record<string, unknown>)
    : undefined;

  const fullEntry: OperationalLogEntry = {
    timestamp: new Date().toISOString(),
    level: entry.level,
    requestId: entry.requestId,
    category: entry.category,
    endpoint: entry.endpoint,
    method: entry.method,
    statusCode: entry.statusCode,
    durationMs: entry.durationMs,
    attempt: entry.attempt,
    message: entry.message,
    ...(sanitizedContext ? { context: sanitizedContext } : {}),
  };

  logRingBuffer.push(fullEntry);
  if (logRingBuffer.length > MAX_LOG_BUFFER) {
    logRingBuffer.shift();
  }

  const tag = `[GOJIFEM:${fullEntry.category}]`;
  if (fullEntry.level === 'error') {
    console.error(tag, fullEntry);
  } else if (fullEntry.level === 'warn') {
    console.warn(tag, fullEntry);
  } else if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.info(tag, fullEntry);
  }

  return fullEntry;
}

export function getRecentOperationalLogs(): OperationalLogEntry[] {
  return [...logRingBuffer];
}

export function clearOperationalLogs(): void {
  logRingBuffer.length = 0;
}
