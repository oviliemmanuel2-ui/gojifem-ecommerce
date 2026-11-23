'use client';

import React from 'react';
import { WifiOff, ServerCrash, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSystemHealth } from '../../context/SystemHealthContext';
import { Spinner } from './Spinner';

/**
 * Operational connectivity banner displayed only when the browser is offline,
 * the backend is unreachable, or database/auth health checks report degraded status.
 */
export function SystemStatusBanner() {
  const { status, checking, health, lastError, checkHealth } = useSystemHealth();

  if (status === 'checking' || status === 'operational') {
    return null;
  }

  const isOffline = status === 'offline';
  const isUnreachable = status === 'unreachable';

  const title = isOffline
    ? 'You are currently offline'
    : isUnreachable
      ? 'Unable to reach GOJIFEM backend services'
      : 'Limited service availability detected';

  const dbStatus = health?.services?.database?.status;
  const authStatus = health?.services?.auth?.status;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`border-b px-4 py-2.5 text-xs ${
        isOffline || isUnreachable
          ? 'bg-ruby text-white border-ruby-dark'
          : 'bg-gold/25 text-espresso border-gold'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5">
          {isOffline ? (
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
          ) : isUnreachable ? (
            <ServerCrash className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-ruby shrink-0 mt-0.5 sm:mt-0" />
          )}

          <div>
            <strong className="font-bold">{title}:</strong>{' '}
            <span>
              {lastError ||
                'Your shopping cart stays safely saved on this device while connectivity recovers.'}
            </span>
            {status === 'degraded' && (dbStatus || authStatus) && (
              <span className="ml-2 inline-flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="px-1.5 py-0.5 rounded bg-white/70 border border-espresso/15">
                  DB: {dbStatus || 'unknown'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/70 border border-espresso/15">
                  Auth: {authStatus || 'unknown'}
                </span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => checkHealth('manual-banner')}
          disabled={checking}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition disabled:opacity-60 ${
            isOffline || isUnreachable
              ? 'bg-white text-ruby hover:bg-ivory'
              : 'bg-espresso text-ivory hover:bg-espresso-muted'
          }`}
        >
          {checking ? (
            <Spinner
              size="xs"
              tone={isOffline || isUnreachable ? 'ruby' : 'ivory'}
              label="Checking system health..."
            />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>{checking ? 'Checking...' : 'Check Again'}</span>
        </button>
      </div>
    </div>
  );
}
