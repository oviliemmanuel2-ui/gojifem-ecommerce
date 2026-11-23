'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Spinner } from './Spinner';

export interface ErrorRetryBannerProps {
  title?: string;
  message: string;
  tone?: 'error' | 'warning';
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  className?: string;
}

/**
 * Accessible error or warning callout with an optional retry action.
 */
export function ErrorRetryBanner({
  title,
  message,
  tone = 'error',
  onRetry,
  retryLabel = 'Try Again',
  retrying = false,
  className = '',
}: ErrorRetryBannerProps) {
  const isWarning = tone === 'warning';

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isWarning
          ? 'bg-gold/15 border-gold text-espresso'
          : 'bg-rose/50 border-ruby/35 text-ruby'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {isWarning ? (
          <AlertTriangle className="w-4 h-4 text-espresso shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 text-ruby shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          {title && <strong className="block font-bold">{title}</strong>}
          <p className="font-semibold leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition disabled:opacity-50 ${
            isWarning
              ? 'bg-espresso text-ivory hover:bg-espresso-muted'
              : 'bg-ruby text-white hover:bg-ruby-hover'
          }`}
        >
          {retrying ? (
            <Spinner size="xs" tone="ivory" label={retryLabel} />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>{retrying ? 'Retrying...' : retryLabel}</span>
        </button>
      )}
    </div>
  );
}
