'use client';

import React from 'react';
import Link from 'next/link';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import type { TypedObject } from '@portabletext/types';
import { urlFor } from '../sanity/lib/image';
import { handleImageError } from '../lib/imageFallback';

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="text-xl sm:text-2xl font-serif font-bold text-espresso mt-8 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-serif font-bold text-espresso mt-6 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-serif font-bold text-espresso mt-5 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-sm text-espresso/85 leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gold bg-rose/25 px-5 py-3 my-5 rounded-r-2xl italic text-sm text-espresso/90">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 text-sm text-espresso/85 mb-4">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-2 text-sm text-espresso/85 mb-4">{children}</ol>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold text-espresso">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-rose/40 text-ruby px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const href = (value?.href as string) || '#';
      const isExternal = /^https?:\/\//i.test(href);
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-ruby font-semibold underline hover:text-ruby-hover"
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className="text-ruby font-semibold underline hover:text-ruby-hover">
          {children}
        </Link>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const src = urlFor(value, 1200) || value?.asset?.url;
      if (!src) return null;
      return (
        <figure className="my-6">
          <img
            src={src}
            alt={(value?.alt as string) || 'GOJIFEM article image'}
            onError={handleImageError}
            className="w-full rounded-2xl border border-rose object-cover max-h-[480px]"
          />
          {value?.caption && (
            <figcaption className="text-xs text-espresso/60 mt-2 text-center">
              {value.caption as string}
            </figcaption>
          )}
        </figure>
      );
    },
  },
};

export function PortableTextRenderer({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0) return null;
  return (
    <div className="max-w-none">
      <PortableText value={value as TypedObject[]} components={components} />
    </div>
  );
}
