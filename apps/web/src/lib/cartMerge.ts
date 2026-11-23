export interface CartMergeItem {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  variantTitle?: string;
  priceMinorNGN: number;
  quantity: number;
  imageUrl: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

/**
 * Safely merges customer saved cart items with incoming guest cart items,
 * summing quantities for matching product + variant keys without creating duplicates.
 */
export function mergeCartItems<T extends CartMergeItem>(
  existing: T[],
  incoming: T[],
): T[] {
  const merged = new Map<string, T>();

  const makeKey = (item: T) =>
    `${item.productId || 'prod'}::${item.variantId || item.id}`;

  for (const item of existing) {
    if (!item || !item.variantId) continue;
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    merged.set(makeKey(item), { ...item, quantity: qty });
  }

  for (const item of incoming) {
    if (!item || !item.variantId) continue;
    const key = makeKey(item);
    const incomingQty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const current = merged.get(key);
    if (current) {
      merged.set(key, {
        ...current,
        ...item,
        quantity: current.quantity + incomingQty,
      });
    } else {
      merged.set(key, { ...item, quantity: incomingQty });
    }
  }

  return Array.from(merged.values());
}
