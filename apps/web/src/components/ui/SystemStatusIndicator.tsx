'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSystemHealth } from '../../context/SystemHealthContext';
import { Spinner } from './Spinner';

/**
 * Footer system status indicator reflecting real verified API, database,
 * and authentication health checks. Never claims "Operational" unless verified.
 */
export function SystemStatusIndicator() {
  const { status, checking, health, lastCheckedAt, checkHealth } = useSystemHealth();
  const [expanded, setExpanded] = useState(false);

  const label =
    status === 'checking'
      ? 'Checking system status...'
      : status === 'operational'
        ? 'All Systems Operational'
        : status === 'degraded'
          ? 'Service Degraded (DB / Auth)'
          : status === 'offline'
            ? 'Offline Mode'
            : 'Backend Unreachable';

  const dotClass =
    status === 'operational'
      ? 'bg-emerald-600'
      : status === 'degraded'
        ? 'bg-gold'
        : 'bg-ruby';

  return (
    <div className="relative inline-flex flex-col items-start sm:items-end gap-1.5">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-rose text-[11px] font-semibold text-espresso hover:border-gold transition"
        >
          {status === 'checking' ? (
            <Spinner size="xs" tone="ruby" label="Checking system status..." />
          ) : (
            <span className={`w-2 h-2 rounded-full ${dotClass}`} aria-hidden="true" />
          )}
          <span>{label}</span>
        </button>

        <button
          type="button"
          onClick={() => checkHealth('manual-footer')}
          disabled={checking}
          aria-label="Run live health check"
          title="Re-run system health check"
          className="p-1.5 rounded-full border border-rose bg-white text-espresso/75 hover:text-ruby transition disabled:opacity-50"
        >
          {checking ? (
            <Spinner size="xs" tone="ruby" label="Checking health..." />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="text-[10px] text-espresso/75 bg-white border border-rose rounded-xl px-3 py-2 shadow-sm flex flex-wrap gap-3">
          <span>API: {health?.services?.api?.status || (status === 'unreachable' ? 'outage' : status)}</span>
          <span>Database: {health?.services?.database?.status || 'unverified'}</span>
          <span>Auth: {health?.services?.auth?.status || 'unverified'}</span>
          {typeof health?.latencyMs === 'number' && <span>Latency: {health.latencyMs}ms</span>}
          {lastCheckedAt && (
            <span>Checked: {new Date(lastCheckedAt).toLocaleTimeString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
