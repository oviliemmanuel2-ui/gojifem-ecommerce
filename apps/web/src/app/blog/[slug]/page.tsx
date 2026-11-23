import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { CmsImage } from '../../../components/CmsImage';
import { PortableTextRenderer } from '../../../components/PortableTextRenderer';
import { getBlogPostBySlug } from '../../../sanity/lib/fetch';
import { urlFor } from '../../../sanity/lib/image';

export const revalidate = 60;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const coverUrl = urlFor(post.mainImage, 1400) || post.mainImage?.asset?.url;

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Journal Articles</span>
          </Link>
        </div>

        <article className="bg-white border border-rose rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.categories.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-rose/40 text-ruby text-[11px] font-bold uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-espresso leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-espresso/75 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-espresso/70 pb-4 border-b border-rose">
            <span className="inline-flex items-center gap-1.5 font-semibold text-espresso">
              <User className="w-3.5 h-3.5 text-ruby" />
              <span>{post.authorName || 'GOJIFEM Editorial'}</span>
              {post.authorRole && (
                <span className="text-espresso/60 font-normal">• {post.authorRole}</span>
              )}
            </span>
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              </span>
            )}
          </div>

          {coverUrl && (
            <div className="rounded-2xl overflow-hidden border border-rose">
              <CmsImage
                src={coverUrl}
                alt={post.mainImage?.alt || post.title}
                className="w-full max-h-[460px] object-cover"
              />
            </div>
          )}

          <div className="pt-2">
            <PortableTextRenderer value={post.body} />
          </div>
        </article>
      </main>
    </div>
  );
}
