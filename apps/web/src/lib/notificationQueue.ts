export type NotificationTone = 'success' | 'error' | 'warning' | 'info';

export type NotificationCategory =
  | 'general'
  | 'auth'
  | 'cart'
  | 'checkout'
  | 'payment'
  | 'merchant'
  | 'order'
  | 'system';

export interface NotificationOptions {
  title?: string;
  category?: NotificationCategory;
  durationMs?: number;
  persistent?: boolean;
  critical?: boolean;
  dedupeKey?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface NotificationItem {
  id: number;
  dedupeKey: string;
  title?: string;
  message: string;
  type: NotificationTone;
  category: NotificationCategory;
  persistent: boolean;
  durationMs: number;
  remainingMs: number;
  createdAt: number;
  exiting: boolean;
  paused: boolean;
  repeatCount: number;
  actionLabel?: string;
  onAction?: () => void;
}

export const MAX_VISIBLE_NOTIFICATIONS = 4;

export function resolveNotificationPersistence(
  type: NotificationTone,
  options?: NotificationOptions,
): boolean {
  if (options?.persistent === true || options?.critical === true) {
    return true;
  }
  const category = options?.category || 'general';
  if (
    type === 'error' &&
    (category === 'payment' || category === 'checkout' || category === 'system')
  ) {
    return true;
  }
  return false;
}

export function resolveDefaultDuration(
  type: NotificationTone,
  options?: NotificationOptions,
): number {
  if (typeof options?.durationMs === 'number' && options.durationMs > 0) {
    return options.durationMs;
  }
  if (type === 'error') return 6500;
  if (type === 'warning') return 5500;
  return 4200;
}

export function computeDedupeKey(
  message: string,
  type: NotificationTone,
  options?: NotificationOptions,
): string {
  if (options?.dedupeKey && options.dedupeKey.trim()) {
    return options.dedupeKey.trim();
  }
  const category = options?.category || 'general';
  const normalizedMessage = message.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${type}:${category}:${normalizedMessage}`;
}

export interface EnqueueResult {
  visible: NotificationItem[];
  queued: NotificationItem[];
  targetId: number;
  isNew: boolean;
  durationMs: number;
  persistent: boolean;
}

export function enqueueNotificationItem(
  visible: NotificationItem[],
  queued: NotificationItem[],
  newItem: NotificationItem,
  maxVisible = MAX_VISIBLE_NOTIFICATIONS,
): EnqueueResult {
  const activeIdx = visible.findIndex(
    (item) => !item.exiting && item.dedupeKey === newItem.dedupeKey,
  );
  if (activeIdx >= 0) {
    const existing = visible[activeIdx];
    const nextItem: NotificationItem = {
      ...existing,
      title: newItem.title ?? existing.title,
      message: newItem.message,
      type: newItem.type,
      category: newItem.category,
      persistent: newItem.persistent,
      durationMs: newItem.durationMs,
      remainingMs: newItem.durationMs,
      actionLabel: newItem.actionLabel ?? existing.actionLabel,
      onAction: newItem.onAction ?? existing.onAction,
      repeatCount: existing.repeatCount + 1,
      paused: false,
      exiting: false,
    };
    const nextVisible = [...visible];
    nextVisible[activeIdx] = nextItem;
    return {
      visible: nextVisible,
      queued,
      targetId: existing.id,
      isNew: false,
      durationMs: nextItem.durationMs,
      persistent: nextItem.persistent,
    };
  }

  const queuedIdx = queued.findIndex((item) => item.dedupeKey === newItem.dedupeKey);
  if (queuedIdx >= 0) {
    const existing = queued[queuedIdx];
    const nextItem: NotificationItem = {
      ...existing,
      title: newItem.title ?? existing.title,
      message: newItem.message,
      type: newItem.type,
      category: newItem.category,
      persistent: newItem.persistent,
      durationMs: newItem.durationMs,
      remainingMs: newItem.durationMs,
      actionLabel: newItem.actionLabel ?? existing.actionLabel,
      onAction: newItem.onAction ?? existing.onAction,
      repeatCount: existing.repeatCount + 1,
    };
    const nextQueued = [...queued];
    nextQueued[queuedIdx] = nextItem;
    return {
      visible,
      queued: nextQueued,
      targetId: existing.id,
      isNew: false,
      durationMs: nextItem.durationMs,
      persistent: nextItem.persistent,
    };
  }

  const activeVisibleCount = visible.filter((item) => !item.exiting).length;
  if (activeVisibleCount < maxVisible) {
    return {
      visible: [newItem, ...visible],
      queued,
      targetId: newItem.id,
      isNew: true,
      durationMs: newItem.durationMs,
      persistent: newItem.persistent,
    };
  }

  return {
    visible,
    queued: [...queued, newItem],
    targetId: newItem.id,
    isNew: true,
    durationMs: newItem.durationMs,
    persistent: newItem.persistent,
  };
}
