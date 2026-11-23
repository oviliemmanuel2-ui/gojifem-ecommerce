import React from 'react';
import { ProductDetailClient } from '../../../components/ProductDetailClient';
import { SAMPLE_PRODUCTS } from '../../../data/sampleProducts';
import { getCmsProductBySlug } from '../../../sanity/lib/fetch';

export const revalidate = 60;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cmsProduct = await getCmsProductBySlug(slug);
  const product =
    cmsProduct || SAMPLE_PRODUCTS.find((p) => p.slug === slug) || SAMPLE_PRODUCTS[0];

  return <ProductDetailClient product={product} />;
}
