'use client';

import React from 'react';
import Link from 'next/link';
import { NextStudio } from 'next-sanity/studio';
import { ShieldCheck, ArrowLeft, Settings } from 'lucide-react';
import config from '../../../../sanity.config';
import { isSanityConfigured } from '../../../sanity/env';

export function StudioClient() {
  if (!isSanityConfigured) {
    return (
      <div className="min-h-screen bg-ivory text-espresso flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-rose rounded-3xl p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-ruby text-white flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-espresso">
                Sanity CMS Studio Setup Required
              </h1>
              <p className="text-xs text-espresso/70">
                Connect your Sanity Project ID to activate the embedded admin dashboard
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose/30 border border-gold/40 text-xs space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-ruby">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Required Environment Variables</span>
            </div>
            <p className="text-espresso/85">
              Set the following variables in <code className="bg-white px-1.5 py-0.5 rounded border border-rose">apps/web/.env.local</code> (for local development) and in <strong>Vercel Project Settings → Environment Variables</strong> (for production):
            </p>
            <pre className="bg-espresso text-ivory p-3 rounded-xl overflow-x-auto text-[11px] font-mono">
{`NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01`}
            </pre>
            <p className="text-espresso/80 pt-1">
              Also add your site origin (e.g. <code className="bg-white px-1 rounded">http://localhost:3000</code> and your Vercel URL) in <strong>Sanity Manage → API → CORS Origins</strong> with <em>Allow credentials</em> checked.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </Link>
            <a
              href="https://www.sanity.io/manage"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
            >
              Open Sanity Manage &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ height: '100vh' }}>
      <NextStudio config={config} />
    </div>
  );
}
