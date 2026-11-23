import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { CmsImage } from '../../../components/CmsImage';
import { PortableTextRenderer } from '../../../components/PortableTextRenderer';
import { getCmsPageBySlug } from '../../../sanity/lib/fetch';
import { urlFor } from '../../../sanity/lib/image';

export const revalidate = 60;

export default async function CustomCmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getCmsPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const heroImg = urlFor(page.heroImage, 1200) || page.heroImage?.asset?.url;

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>

        <article className="bg-white border border-rose rounded-3xl p-6 sm:p-10 shadow-sm space-y-5 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center gap-2 text-ruby font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>{page.eyebrow || 'GOJIFEM Global Marketplace Ltd.'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">{page.title}</h1>
          {page.summary && <p className="text-espresso/75">{page.summary}</p>}
          {heroImg && (
            <div className="rounded-2xl overflow-hidden border border-rose">
              <CmsImage
                src={heroImg}
                alt={page.heroImage?.alt || page.title}
                className="w-full max-h-[360px] object-cover"
              />
            </div>
          )}
          <PortableTextRenderer value={page.content} />
          <div className="pt-4 border-t border-rose">
            <Link href="/contact" className="font-bold text-ruby hover:underline">
              Questions? Contact Support &rarr;
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
