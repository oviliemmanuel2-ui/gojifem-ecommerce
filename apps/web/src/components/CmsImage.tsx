'use client';

import React from 'react';
import { handleImageError } from '../lib/imageFallback';

interface CmsImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CmsImage({ src, alt, className = '' }: CmsImageProps) {
  return <img src={src} alt={alt} onError={handleImageError} className={className} />;
}
