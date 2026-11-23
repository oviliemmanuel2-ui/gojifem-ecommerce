'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Subtle top viewport progress bar for App Router page transitions.
 * Never adds artificial navigation delays; clears immediately when navigation settles.
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUrl = `${pathname || ''}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  useEffect(() => {
    setNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [currentUrl]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href') || '';
      if (!rawHref.startsWith('/') || rawHref.startsWith('//')) return;

      const nextPath = `${anchor.pathname}${anchor.search}`;
      if (nextPath === currentUrl) return;

      setNavigating(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setNavigating(false);
      }, 8000);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentUrl]);

  if (!navigating) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[70] h-[3px] overflow-hidden bg-rose/40 pointer-events-none"
    >
      <div className="h-full w-2/5 bg-gradient-to-r from-ruby via-gold to-ruby animate-route-bar" />
    </div>
  );
}
