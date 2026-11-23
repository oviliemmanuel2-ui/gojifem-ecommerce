import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.SANITY_REVALIDATE_SECRET;
  const providedSecret =
    req.headers.get('x-sanity-secret') || req.nextUrl.searchParams.get('secret');

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return NextResponse.json(
      { ok: false, message: 'Invalid or missing revalidation secret.' },
      { status: 401 },
    );
  }

  let docType: string | undefined;
  let slug: string | undefined;
  try {
    const body = (await req.json()) as { _type?: string; slug?: { current?: string } | string };
    docType = body?._type;
    slug = typeof body?.slug === 'string' ? body.slug : body?.slug?.current;
  } catch {
    // Allow webhook triggers without JSON body
  }

  revalidateTag('sanity');
  if (docType) {
    revalidateTag(docType);
  }
  revalidatePath('/', 'layout');
  if (docType === 'post' && slug) {
    revalidatePath(`/blog/${slug}`);
  } else if (docType === 'product' && slug) {
    revalidatePath(`/products/${slug}`);
  } else if (docType === 'page' && slug) {
    revalidatePath(`/pages/${slug}`);
    revalidatePath(`/${slug}`);
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    type: docType || 'all',
    slug: slug || null,
    now: Date.now(),
  });
}
