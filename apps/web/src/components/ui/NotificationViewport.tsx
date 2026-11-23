'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Info,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  WifiOff,
  X,
} from 'lucide-react';
import type {
  NotificationCategory,
  NotificationItem,
  NotificationTone,
} from '../../lib/notificationQueue';

interface NotificationViewportProps {
  notifications: NotificationItem[];
  onDismiss: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onAction: (item: NotificationItem) => void;
}

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  general: 'Notice',
  auth: 'Account',
  cart: 'Shopping Bag',
  checkout: 'Checkout',
  payment: 'Payment',
  merchant: 'Merchant',
  order: 'Order Update',
  system: 'System Status',
};

function renderNotificationIcon(type: NotificationTone, category: NotificationCategory) {
  const baseClass = 'w-4 h-4 shrink-0 mt-0.5';
  const toneColor =
    type === 'error'
      ? 'text-white'
      : type === 'warning'
        ? 'text-espresso'
        : type === 'success'
          ? 'text-gold'
          : 'text-ruby';

  if (category === 'cart') return <ShoppingBag className={`${baseClass} ${toneColor}`} />;
  if (category === 'checkout' || category === 'payment') {
    return type === 'error' ? (
      <AlertCircle className={`${baseClass} ${toneColor}`} />
    ) : (
      <CreditCard className={`${baseClass} ${toneColor}`} />
    );
  }
  if (category === 'auth') return <ShieldCheck className={`${baseClass} ${toneColor}`} />;
  if (category === 'merchant') return <Store className={`${baseClass} ${toneColor}`} />;
  if (category === 'order') return <PackageCheck className={`${baseClass} ${toneColor}`} />;
  if (category === 'system') {
    return type === 'error' ? (
      <WifiOff className={`${baseClass} ${toneColor}`} />
    ) : (
      <AlertTriangle className={`${baseClass} ${toneColor}`} />
    );
  }

  if (type === 'success') return <CheckCircle2 className={`${baseClass} ${toneColor}`} />;
  if (type === 'error') return <AlertCircle className={`${baseClass} ${toneColor}`} />;
  if (type === 'warning') return <AlertTriangle className={`${baseClass} ${toneColor}`} />;
  return <Info className={`${baseClass} ${toneColor}`} />;
}

export function NotificationViewport({
  notifications,
  onDismiss,
  onPause,
  onResume,
  onAction,
}: NotificationViewportProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined' || notifications.length === 0) {
    return null;
  }

  return createPortal(
    <div
      id="gojifem-global-notifications"
      role="region"
      aria-label="Site notifications"
      aria-live="polite"
      aria-relevant="additions removals"
      className="gojifem-toast-viewport"
    >
      {notifications.map((item) => {
        const toneClass =
          item.type === 'error'
            ? 'bg-ruby text-white border-ruby-dark shadow-xl'
            : item.type === 'warning'
              ? 'bg-gold-light text-espresso border-gold-dark/60 shadow-lg'
              : item.type === 'success'
                ? 'bg-espresso text-ivory border-gold/70 shadow-xl'
                : 'bg-white text-espresso border-rose-dark shadow-lg';

        const labelBadgeClass =
          item.type === 'error'
            ? 'bg-white/15 text-white'
            : item.type === 'warning'
              ? 'bg-espresso/10 text-espresso'
              : item.type === 'success'
                ? 'bg-gold/20 text-gold-light'
                : 'bg-rose text-ruby';

        const dismissBtnClass =
          item.type === 'error'
            ? 'text-white/85 hover:text-white hover:bg-white/15 focus-visible:ring-white'
            : item.type === 'success'
              ? 'text-ivory/80 hover:text-ivory hover:bg-white/10 focus-visible:ring-gold'
              : 'text-espresso/75 hover:text-espresso hover:bg-rose/50 focus-visible:ring-ruby';

        return (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            aria-live={item.type === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            data-notification-id={item.id}
            data-notification-category={item.category}
            data-notification-type={item.type}
            data-notification-persistent={item.persistent ? 'true' : 'false'}
            onMouseEnter={() => onPause(item.id)}
            onMouseLeave={() => onResume(item.id)}
            onFocusCapture={() => onPause(item.id)}
            onBlurCapture={() => onResume(item.id)}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-xs transition-opacity ${
              item.exiting ? 'animate-toast-out' : 'animate-toast-in'
            } ${toneClass}`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {renderNotificationIcon(item.type, item.category)}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${labelBadgeClass}`}
                    >
                      {item.title || CATEGORY_LABEL[item.category]}
                    </span>
                    {item.repeatCount > 1 && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${labelBadgeClass}`}
                        aria-label={`Repeated ${item.repeatCount} times`}
                      >
                        x{item.repeatCount}
                      </span>
                    )}
                    {item.persistent && (
                      <span className="text-[10px] font-semibold opacity-80">
                        Action required
                      </span>
                    )}
                  </div>

                  <p className="font-semibold leading-snug break-words [overflow-wrap:anywhere]">
                    {item.message}
                  </p>

                  {item.actionLabel && item.onAction && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onAction(item)}
                        className="underline font-extrabold text-[11px] hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded"
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                aria-label="Dismiss notification"
                className={`p-1 rounded-lg transition focus:outline-none focus-visible:ring-2 shrink-0 ${dismissBtnClass}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
