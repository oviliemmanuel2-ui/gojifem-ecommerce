'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  computeDedupeKey,
  enqueueNotificationItem,
  MAX_VISIBLE_NOTIFICATIONS,
  type NotificationItem,
  type NotificationOptions,
  type NotificationTone,
  resolveDefaultDuration,
  resolveNotificationPersistence,
} from '../lib/notificationQueue';
import { NotificationViewport } from '../components/ui/NotificationViewport';

interface TimerEntry {
  timeoutId: ReturnType<typeof setTimeout>;
  startedAt: number;
  durationMs: number;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  notify: (
    message: string,
    type?: NotificationTone,
    options?: NotificationOptions,
  ) => number;
  dismiss: (id: number) => void;
  dismissByKey: (dedupeKey: string) => void;
  clearAll: () => void;
}

const EXIT_ANIMATION_MS = 180;

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState<NotificationItem[]>([]);
  const visibleRef = useRef<NotificationItem[]>([]);
  const queuedRef = useRef<NotificationItem[]>([]);
  const timersRef = useRef<Map<number, TimerEntry>>(new Map());
  const exitTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const idSeqRef = useRef(1);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const clearTimer = useCallback((id: number) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing.timeoutId);
      timersRef.current.delete(id);
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    for (const entry of timersRef.current.values()) {
      clearTimeout(entry.timeoutId);
    }
    timersRef.current.clear();

    for (const timeoutId of exitTimersRef.current.values()) {
      clearTimeout(timeoutId);
    }
    exitTimersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const scheduleDismissRef = useRef<(id: number, delayMs: number) => void>(() => {});

  const finalizeRemoval = useCallback(
    (id: number) => {
      exitTimersRef.current.delete(id);
      setVisible((prev) => {
        const remaining = prev.filter((item) => item.id !== id);
        if (
          remaining.filter((item) => !item.exiting).length < MAX_VISIBLE_NOTIFICATIONS &&
          queuedRef.current.length > 0
        ) {
          const [nextUp, ...rest] = queuedRef.current;
          queuedRef.current = rest;
          if (!nextUp.persistent) {
            setTimeout(() => {
              scheduleDismissRef.current(nextUp.id, nextUp.remainingMs || nextUp.durationMs);
            }, 0);
          }
          return [nextUp, ...remaining];
        }
        return remaining;
      });
    },
    [],
  );

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id);

      const inQueue = queuedRef.current.some((item) => item.id === id);
      if (inQueue) {
        queuedRef.current = queuedRef.current.filter((item) => item.id !== id);
        return;
      }

      if (exitTimersRef.current.has(id)) {
        return;
      }

      if (prefersReducedMotion()) {
        finalizeRemoval(id);
        return;
      }

      setVisible((prev) =>
        prev.map((item) => (item.id === id ? { ...item, exiting: true } : item)),
      );
      const exitTimer = setTimeout(() => {
        finalizeRemoval(id);
      }, EXIT_ANIMATION_MS);
      exitTimersRef.current.set(id, exitTimer);
    },
    [clearTimer, finalizeRemoval],
  );

  scheduleDismissRef.current = (id: number, delayMs: number) => {
    clearTimer(id);
    if (delayMs <= 0) return;
    const timeoutId = setTimeout(() => {
      timersRef.current.delete(id);
      dismiss(id);
    }, delayMs);
    timersRef.current.set(id, {
      timeoutId,
      startedAt: Date.now(),
      durationMs: delayMs,
    });
  };

  const pauseNotification = useCallback(
    (id: number) => {
      const entry = timersRef.current.get(id);
      if (!entry) return;
      clearTimeout(entry.timeoutId);
      timersRef.current.delete(id);
      const elapsed = Date.now() - entry.startedAt;
      const remaining = Math.max(800, entry.durationMs - elapsed);
      setVisible((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, paused: true, remainingMs: remaining } : item,
        ),
      );
    },
    [],
  );

  const resumeNotification = useCallback((id: number) => {
    const target = visibleRef.current.find((item) => item.id === id);
    if (!target || target.persistent || target.exiting || !target.paused) {
      return;
    }
    const nextDelay = target.remainingMs || target.durationMs;
    setVisible((prev) =>
      prev.map((item) => (item.id === id ? { ...item, paused: false } : item)),
    );
    scheduleDismissRef.current(id, nextDelay);
  }, []);

  const notify = useCallback(
    (
      message: string,
      type: NotificationTone = 'info',
      options?: NotificationOptions,
    ): number => {
      const cleanMessage = (message || '').trim();
      if (!cleanMessage) return -1;

      const persistent = resolveNotificationPersistence(type, options);
      const durationMs = resolveDefaultDuration(type, options);
      const dedupeKey = computeDedupeKey(cleanMessage, type, options);
      const id = Date.now() * 1000 + (idSeqRef.current++ % 1000);

      const newItem: NotificationItem = {
        id,
        dedupeKey,
        title: options?.title,
        message: cleanMessage,
        type,
        category: options?.category || 'general',
        persistent,
        durationMs,
        remainingMs: durationMs,
        createdAt: Date.now(),
        exiting: false,
        paused: false,
        repeatCount: 1,
        actionLabel: options?.actionLabel,
        onAction: options?.onAction,
      };

      const result = enqueueNotificationItem(
        visibleRef.current,
        queuedRef.current,
        newItem,
        MAX_VISIBLE_NOTIFICATIONS,
      );

      queuedRef.current = result.queued;
      visibleRef.current = result.visible;
      setVisible(result.visible);

      const isCurrentlyVisible = result.visible.some((item) => item.id === result.targetId);
      if (isCurrentlyVisible) {
        if (result.persistent) {
          clearTimer(result.targetId);
        } else {
          scheduleDismissRef.current(result.targetId, result.durationMs);
        }
      }

      return result.targetId;
    },
    [clearTimer],
  );

  const dismissByKey = useCallback(
    (dedupeKey: string) => {
      queuedRef.current = queuedRef.current.filter((item) => item.dedupeKey !== dedupeKey);
      const matches = visibleRef.current.filter((item) => item.dedupeKey === dedupeKey);
      for (const item of matches) {
        dismiss(item.id);
      }
    },
    [dismiss],
  );

  const clearAll = useCallback(() => {
    clearAllTimers();
    queuedRef.current = [];
    setVisible([]);
  }, [clearAllTimers]);

  const handleAction = useCallback(
    (item: NotificationItem) => {
      item.onAction?.();
      if (!item.persistent || item.category !== 'system') {
        dismiss(item.id);
      }
    },
    [dismiss],
  );

  useEffect(() => {
    if (visible.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const modalOpen = Boolean(
        document.querySelector('[role="dialog"][aria-modal="true"]'),
      );
      if (modalOpen) return;
      const latest = visibleRef.current.find((item) => !item.exiting);
      if (latest) {
        dismiss(latest.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible.length, dismiss]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: visible,
        notify,
        dismiss,
        dismissByKey,
        clearAll,
      }}
    >
      {children}
      <NotificationViewport
        notifications={visible}
        onDismiss={dismiss}
        onPause={pauseNotification}
        onResume={resumeNotification}
        onAction={handleAction}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
