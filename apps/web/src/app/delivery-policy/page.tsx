import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CmsImage } from '../../components/CmsImage';
import { PortableTextRenderer } from '../../components/PortableTextRenderer';
import { getCmsPageBySlug } from '../../sanity/lib/fetch';
import { urlFor } from '../../sanity/lib/image';

export const revalidate = 60;

export default async function DeliveryPolicyPage() {
  const cmsPage = await getCmsPageBySlug('delivery-policy');
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
            <Truck className="w-4 h-4 text-gold" />
            <span>{cmsPage?.eyebrow || 'Logistics & Fulfillment'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
            {cmsPage?.title || 'Delivery Policy'}
          </h1>

          {heroImg && (
            <div className="rounded-2xl overflow-hidden border border-rose">
              <CmsImage
                src={heroImg}
                alt={cmsPage?.heroImage?.alt || cmsPage?.title || 'Delivery Policy'}
                className="w-full max-h-[340px] object-cover"
              />
            </div>
          )}

          {cmsPage?.content ? (
            <PortableTextRenderer value={cmsPage.content} />
          ) : (
            <>
              <p className="text-espresso/80">
                GOJIFEM enforces strict delivery serviceability before checkout so every paid order can be tracked from merchant dispatch to doorstep delivery.
              </p>
              <h2 className="text-base font-serif font-bold text-espresso pt-2">1. Integrated Logistics Partners</h2>
              <ul className="list-disc pl-5 space-y-2 text-espresso/80">
                <li><strong>Kwik Delivery:</strong> On-demand same-day motorcycle and van dispatch in Lagos, Abuja, and Ibadan.</li>
                <li><strong>GIG Logistics (GIGL):</strong> Tracked nationwide doorstep delivery across all 36 Nigerian states &amp; FCT (1–4 business days).</li>
                <li><strong>DHL Express:</strong> Priority domestic corridors and worldwide exports to UK, US, Canada, Ghana, and the EU.</li>
              </ul>
              <h2 className="text-base font-serif font-bold text-espresso pt-2">2. Multi-Vendor Split Shipments</h2>
              <p className="text-espresso/80">
                Items purchased from multiple vendors in a single checkout ship directly from each merchant with dedicated tracking codes.
              </p>
            </>
          )}

          <div className="pt-4 border-t border-rose">
            <Link href="/contact" className="font-bold text-ruby hover:underline">
              Track an issue or contact dispatch support &rarr;
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
