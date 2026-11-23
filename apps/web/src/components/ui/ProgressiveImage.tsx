'use client';

import React, { useEffect, useRef, useState } from 'react';
import { handleImageError } from '../../lib/imageFallback';

export interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Progressive image wrapper displaying a subtle GOJIFEM shimmer placeholder
 * until the browser completes loading or applies the safe SVG fallback.
 */
export function ProgressiveImage({
  src,
  alt,
  className = '',
  containerClassName = 'w-full h-full',
  priority = false,
  sizes,
}: ProgressiveImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-ivory ${containerClassName}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 gojifem-shimmer pointer-events-none"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          handleImageError(e);
          setLoaded(true);
        }}
        className={`${className} transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
