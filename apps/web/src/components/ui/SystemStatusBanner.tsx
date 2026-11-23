'use client';

import { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useSystemHealth } from '../../context/SystemHealthContext';

const SYSTEM_STATUS_DEDUPE_KEY = 'gojifem-system-connectivity';

/**
 * Connects system health monitoring into the fixed global notification portal
 * so connectivity/backend alerts remain visible regardless of scroll position.
 */
export function SystemStatusBanner() {
  const { status, health, lastError, checkHealth } = useSystemHealth();
  const { notify, dismissByKey } = useNotifications();

  useEffect(() => {
    if (status === 'checking' || status === 'operational') {
      dismissByKey(SYSTEM_STATUS_DEDUPE_KEY);
      return;
    }

    const isOffline = status === 'offline';
    const isUnreachable = status === 'unreachable';

    const title = isOffline
      ? 'You are currently offline'
      : isUnreachable
        ? 'Backend services unreachable'
        : 'Limited service availability';

    const dbStatus = health?.services?.database?.status;
    const authStatus = health?.services?.auth?.status;
    const serviceDetail =
      status === 'degraded' && (dbStatus || authStatus)
        ? ` (DB: ${dbStatus || 'unknown'}, Auth: ${authStatus || 'unknown'})`
        : '';

    const message =
      (lastError ||
        'Your shopping cart stays safely saved on this device while connectivity recovers.') +
      serviceDetail;

    notify(message, isOffline || isUnreachable ? 'error' : 'warning', {
      title,
      category: 'system',
      persistent: true,
      critical: true,
      dedupeKey: SYSTEM_STATUS_DEDUPE_KEY,
      actionLabel: 'Check Again',
      onAction: () => {
        void checkHealth('manual-banner');
      },
    });
  }, [status, health, lastError, checkHealth, notify, dismissByKey]);

  return null;
}
