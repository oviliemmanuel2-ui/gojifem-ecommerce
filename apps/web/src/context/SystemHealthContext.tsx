'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { API_BASE_URL, subscribeToApiConnectivity } from '../lib/api';
import { logOperationalEvent } from '../lib/logger';

export type ServiceState = 'operational' | 'degraded' | 'outage' | 'not_configured';

export type SystemHealthStatus =
  | 'checking'
  | 'operational'
  | 'degraded'
  | 'offline'
  | 'unreachable';

export interface HealthCheckPayload {
  status: 'ok' | 'degraded';
  overallStatus?: 'operational' | 'degraded';
  service?: string;
  timestamp: string;
  latencyMs?: number;
  database?: string;
  databaseError?: string;
  services?: {
    api?: { status: ServiceState };
    database?: {
      status: ServiceState;
      configured?: boolean;
      latencyMs?: number | null;
      error?: string;
    };
    auth?: {
      status: ServiceState;
      jwtOperational?: boolean;
      databaseBacked?: boolean;
      error?: string;
    };
  };
}

/**
 * Pure health evaluation helper: NEVER marks status as 'operational'
 * unless the backend HTTP check passed AND database & auth are both operational.
 */
export function evaluateHealthResponse(
  httpOk: boolean,
  statusCode: number,
  data: Partial<HealthCheckPayload> | null,
): SystemHealthStatus {
  if (!httpOk || statusCode !== 200 || !data) {
    if (data && (data.status === 'degraded' || data.overallStatus === 'degraded')) {
      return 'degraded';
    }
    return 'unreachable';
  }

  const overallOk = data.overallStatus === 'operational' || data.status === 'ok';
  const dbOk = data.services?.database
    ? data.services.database.status === 'operational'
    : data.database === 'connected';
  const authOk = data.services?.auth
    ? data.services.auth.status === 'operational'
    : true;

  if (overallOk && dbOk && authOk) {
    return 'operational';
  }
  return 'degraded';
}

interface SystemHealthContextValue {
  status: SystemHealthStatus;
  isOnline: boolean;
  checking: boolean;
  health: HealthCheckPayload | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  checkHealth: (reason?: string) => Promise<void>;
}

const SystemHealthContext = createContext<SystemHealthContextValue>({
  status: 'checking',
  isOnline: true,
  checking: false,
  health: null,
  lastCheckedAt: null,
  lastError: null,
  checkHealth: async () => {},
});

const HEALTH_PROBE_TIMEOUT_MS = 6000;
const AUTO_RECHECK_COOLDOWN_MS = 10000;

export function SystemHealthProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<SystemHealthStatus>('checking');
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<HealthCheckPayload | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const inFlightProbeRef = useRef<Promise<void> | null>(null);
  const lastAutoCheckRef = useRef(0);

  const checkHealth = useCallback(async (reason = 'auto') => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsOnline(false);
      setStatus('offline');
      setLastError('Browser reports no active internet connection.');
      setLastCheckedAt(new Date().toISOString());
      return;
    }

    if (inFlightProbeRef.current) {
      return inFlightProbeRef.current;
    }

    const probe = (async () => {
      setChecking(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS);

      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        let payload: HealthCheckPayload | null = null;
        try {
          payload = (await res.json()) as HealthCheckPayload;
        } catch {
          payload = null;
        }

        const evaluated = evaluateHealthResponse(res.ok, res.status, payload);
        setHealth(payload);
        setStatus(evaluated);
        setLastCheckedAt(new Date().toISOString());

        if (evaluated === 'operational') {
          setLastError(null);
        } else {
          const detail =
            payload?.services?.database?.error ||
            payload?.services?.auth?.error ||
            payload?.databaseError ||
            (evaluated === 'degraded'
              ? 'Backend database or authentication dependency reported degraded availability.'
              : `Health check failed with HTTP ${res.status}.`);
          setLastError(detail);
          logOperationalEvent({
            level: 'warn',
            category: 'HEALTH',
            endpoint: '/health',
            method: 'GET',
            statusCode: res.status,
            message: detail,
            context: { reason, evaluated },
          });
        }
      } catch (err: unknown) {
        const stillOffline =
          typeof navigator !== 'undefined' && navigator.onLine === false;
        const msg = stillOffline
          ? 'Your internet connection is offline.'
          : err instanceof Error && err.name === 'AbortError'
            ? 'Backend health check timed out.'
            : 'Unable to reach GOJIFEM backend services.';
        setStatus(stillOffline ? 'offline' : 'unreachable');
        setLastError(msg);
        setLastCheckedAt(new Date().toISOString());
        logOperationalEvent({
          level: 'error',
          category: stillOffline ? 'OFFLINE' : 'HEALTH',
          endpoint: '/health',
          method: 'GET',
          message: msg,
          context: { reason },
        });
      } finally {
        clearTimeout(timer);
        setChecking(false);
        inFlightProbeRef.current = null;
      }
    })();

    inFlightProbeRef.current = probe;
    return probe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialOnline = navigator.onLine !== false;
    setIsOnline(initialOnline);
    if (initialOnline) {
      checkHealth('mount');
    } else {
      setStatus('offline');
      setLastError('Your internet connection appears to be offline.');
    }

    const handleOnline = () => {
      setIsOnline(true);
      checkHealth('browser-online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
      setLastError('Internet connection lost. Your cart items remain safely stored.');
      logOperationalEvent({
        level: 'warn',
        category: 'OFFLINE',
        message: 'Browser went offline',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeToApiConnectivity((event) => {
      if (event.ok) return;
      if (event.category === 'OFFLINE') {
        setIsOnline(false);
        setStatus('offline');
        return;
      }
      if (
        event.category === 'NETWORK' ||
        event.category === 'TIMEOUT' ||
        event.category === 'SERVER' ||
        event.category === 'DATABASE'
      ) {
        const now = Date.now();
        if (now - lastAutoCheckRef.current > AUTO_RECHECK_COOLDOWN_MS) {
          lastAutoCheckRef.current = now;
          checkHealth(`api-failure:${event.endpoint}`);
        }
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [checkHealth]);

  return (
    <SystemHealthContext.Provider
      value={{
        status,
        isOnline,
        checking,
        health,
        lastCheckedAt,
        lastError,
        checkHealth,
      }}
    >
      {children}
    </SystemHealthContext.Provider>
  );
}

export function useSystemHealth() {
  return useContext(SystemHealthContext);
}
