import { createImageUrlBuilder } from '@sanity/image-url';
import { dataset, isSanityConfigured, projectId } from '../env';

const builder = isSanityConfigured
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function urlFor(
  source: unknown,
  width: number = 1200,
): string | null {
  if (!source || typeof source !== 'object') return null;

  const maybeObj = source as {
    asset?: { _ref?: string; _id?: string; url?: string };
  };

  if (builder && maybeObj.asset && (maybeObj.asset._ref || maybeObj.asset._id)) {
    try {
      return builder.image(source as Parameters<typeof builder.image>[0]).width(width).auto('format').url();
    } catch {
      return maybeObj.asset.url || null;
    }
  }

  if (maybeObj.asset?.url) {
    return maybeObj.asset.url;
  }

  return null;
}
