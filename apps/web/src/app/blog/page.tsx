import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, User } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { CmsImage } from '../../components/CmsImage';
import { getBlogPosts } from '../../sanity/lib/fetch';
import { urlFor } from '../../sanity/lib/image';

export const revalidate = 60;

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span>GOJIFEM Editorial &amp; Seller Spotlights</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-espresso">
            The GOJIFEM Journal
          </h1>
          <p className="text-sm text-espresso/75 mt-2">
            Marketplace guides, merchant spotlights, shipping tips, and stories from verified artisans and businesses across Nigeria and worldwide.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const imgUrl = urlFor(post.mainImage, 800) || post.mainImage?.asset?.url;
              return (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="bg-white border border-rose rounded-3xl overflow-hidden hover:shadow-md hover:border-ruby/40 transition flex flex-col group"
                >
                  {imgUrl && (
                    <div className="aspect-[16/10] overflow-hidden bg-rose/20">
                      <CmsImage
                        src={imgUrl}
                        alt={post.mainImage?.alt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {post.categories.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-full bg-rose/40 text-ruby text-[10px] font-bold uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="font-serif font-bold text-lg text-espresso group-hover:text-ruby transition leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-xs text-espresso/75 mt-2 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-rose/60 flex items-center justify-between text-[11px] text-espresso/70">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-ruby" />
                        <span>{post.authorName || 'GOJIFEM Editorial'}</span>
                      </span>
                      {post.publishedAt && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gold" />
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                        </span>
                      )}
                      <span className="font-bold text-ruby inline-flex items-center gap-0.5">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-rose rounded-3xl p-10 text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-serif font-bold text-espresso">
              No journal articles published yet
            </h2>
            <p className="text-xs text-espresso/75 leading-relaxed">
              Once you connect your Sanity project and publish an article under{' '}
              <strong>Blog Posts &amp; Articles</strong> in Sanity Studio, it will automatically appear here.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/studio"
                className="px-5 py-2.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition"
              >
                Open CMS Studio
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 border border-rose text-espresso rounded-xl text-xs font-bold hover:bg-rose/30 transition"
              >
                Browse Storefront
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
