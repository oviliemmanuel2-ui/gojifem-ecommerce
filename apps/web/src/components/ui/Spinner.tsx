import React from 'react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tone?: 'ruby' | 'ivory' | 'espresso' | 'gold';
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  xs: 'w-3.5 h-3.5 border-[2px]',
  sm: 'w-4 h-4 border-[2px]',
  md: 'w-6 h-6 border-[2.5px]',
  lg: 'w-9 h-9 border-[3px]',
};

const TONE_CLASSES: Record<NonNullable<SpinnerProps['tone']>, string> = {
  ruby: 'border-ruby/25 border-t-ruby',
  ivory: 'border-ivory/35 border-t-ivory',
  espresso: 'border-espresso/25 border-t-espresso',
  gold: 'border-gold/30 border-t-gold',
};

/**
 * Lightweight accessible circular spinner aligned with GOJIFEM brand tokens.
 */
export function Spinner({
  size = 'sm',
  tone = 'ruby',
  label = 'Loading...',
  className = '',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`block rounded-full animate-spin ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
