import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CmsImage } from '../../components/CmsImage';
import { PortableTextRenderer } from '../../components/PortableTextRenderer';
import { getCmsPageBySlug } from '../../sanity/lib/fetch';
import { urlFor } from '../../sanity/lib/image';

export const revalidate = 60;

export default async function VendorAgreementPage() {
  const cmsPage = await getCmsPageBySlug('vendor-agreement');
  const heroImg = cmsPage ? urlFor(cmsPage.heroImage, 1200) || cmsPage.heroImage?.asset?.url : null;

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
            <Store className="w-4 h-4 text-gold" />
            <span>{cmsPage?.eyebrow || 'Merchant Commercial Terms'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
            {cmsPage?.title || 'Vendor Agreement'}
          </h1>

          {heroImg && (
            <div className="rounded-2xl overflow-hidden border border-rose">
              <CmsImage
                src={heroImg}
                alt={cmsPage?.heroImage?.alt || cmsPage?.title || 'Vendor Agreement'}
                className="w-full max-h-[340px] object-cover"
              />
            </div>
          )}

          {cmsPage?.content ? (
            <PortableTextRenderer value={cmsPage.content} />
          ) : (
            <>
              <p className="text-espresso/80">
                GOJIFEM onboards verified Nigerian and international businesses across fashion, electronics, groceries, home appliances, beauty, arts, automotive hardware, and books.
              </p>
              <h2 className="text-base font-serif font-bold text-espresso pt-2">1. KYC &amp; Bank Settlement</h2>
              <p className="text-espresso/80">
                Merchants must submit valid business registration (CAC certificate or verified national ID) and a verified settlement bank account before listings go live. Standard marketplace commission is 10.00% on completed item subtotals.
              </p>
              <h2 className="text-base font-serif font-bold text-espresso pt-2">2. Dispatch SLA</h2>
              <p className="text-espresso/80">
                Paid split vendor orders must be packed and handed over to the designated courier (GIGL, Kwik, or DHL) within 24–48 business hours with valid tracking details uploaded.
              </p>
            </>
          )}

          <div className="pt-4 border-t border-rose flex gap-6">
            <Link href="/auth/vendor-register" className="font-bold text-ruby hover:underline">
              Apply to Sell on GOJIFEM &rarr;
            </Link>
            <Link href="/contact" className="font-semibold text-espresso/70 hover:text-ruby">
              Contact Merchant Support
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
