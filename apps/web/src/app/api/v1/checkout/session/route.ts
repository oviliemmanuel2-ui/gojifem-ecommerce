import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_AUTH_MESSAGE } from '../../../../../lib/authRedirect';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import { resolveRequestOrigin } from '../../../../../lib/server/oauth';
import { getPrisma, handleServerError, requireDatabase } from '../../../../../lib/server/prisma';
import { createRequestId, logServerEvent } from '../../../../../lib/server/logger';
import {
  beginIdempotentOperation,
  buildIdempotencyScopeKey,
  completeIdempotentOperation,
  extractIdempotencyKey,
  releaseIdempotentOperation,
} from '../../../../../lib/server/idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDER_TIMEOUT_MS = 15000;

interface CheckoutSessionItemInput {
  productId?: string;
  variantId?: string;
  title?: string;
  priceMinorNGN?: number;
  quantity?: number;
  vendorId?: string;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = PROVIDER_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId();
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return NextResponse.json(
      { message: CHECKOUT_AUTH_MESSAGE, code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  const dbMissing = requireDatabase();
  if (dbMissing) return dbMissing;

  let idemCompositeKey: string | null = null;

  try {
    const body = (await req.json()) as {
      idempotencyKey?: string;
      items?: CheckoutSessionItemInput[];
      shippingAddress?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        countryCode?: string;
        stateOrRegion?: string;
        city?: string;
        streetAddress?: string;
      };
      billingCountryCode?: string;
      currency?: string;
      provider?: 'PAYSTACK' | 'FLUTTERWAVE';
    };

    const idempotencyKey = extractIdempotencyKey(req, body.idempotencyKey);
    if (idempotencyKey) {
      idemCompositeKey = buildIdempotencyScopeKey('checkout_session', authUser.sub, idempotencyKey);
      const decision = beginIdempotentOperation(idemCompositeKey);
      if (decision.state === 'IN_PROGRESS') {
        logServerEvent('warn', 'checkout/session', 'Duplicate concurrent checkout request blocked', {
          requestId,
          userId: authUser.sub,
        });
        return NextResponse.json(
          {
            code: 'IDEMPOTENCY_IN_PROGRESS',
            message: 'This payment request is already processing. Please wait a moment.',
          },
          { status: 409 },
        );
      }
      if (decision.state === 'REPLAY') {
        logServerEvent('info', 'checkout/session', 'Replaying completed idempotent checkout session', {
          requestId,
          userId: authUser.sub,
        });
        return NextResponse.json(
          { ...decision.body, idempotentReplay: true },
          { status: decision.status },
        );
      }
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: authUser.sub },
      select: { id: true, email: true, accountStatus: true },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
      return NextResponse.json(
        { message: 'Active customer account required to checkout.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
      return NextResponse.json({ message: 'Your shopping cart is empty.' }, { status: 400 });
    }

    const addr = body.shippingAddress;
    if (
      !addr?.firstName?.trim() ||
      !addr?.lastName?.trim() ||
      !addr?.phone?.trim() ||
      !addr?.countryCode?.trim() ||
      !addr?.city?.trim() ||
      !addr?.streetAddress?.trim()
    ) {
      if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
      return NextResponse.json(
        { message: 'Complete recipient shipping address and phone number are required.' },
        { status: 400 },
      );
    }

    let itemsSubtotalMinor = 0;
    const vendorIds = new Set<string>();
    for (const item of items) {
      const qty = Math.floor(Number(item.quantity || 0));
      const unitMinor = Math.round(Number(item.priceMinorNGN || 0));
      if (!item.variantId || qty < 1 || unitMinor <= 0) {
        if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
        return NextResponse.json(
          { message: 'Invalid product variant, price, or quantity in cart.' },
          { status: 400 },
        );
      }
      itemsSubtotalMinor += unitMinor * qty;
      vendorIds.add(item.vendorId || 'default-vendor');
    }

    const countryCode = addr.countryCode.toUpperCase();
    const stateOrRegion = addr.stateOrRegion || '';
    const shippingPerVendor =
      countryCode === 'NG' ? (stateOrRegion === 'Lagos' ? 250000 : 450000) : 3500000;
    const grandTotalMinor = itemsSubtotalMinor + shippingPerVendor * vendorIds.size;

    const orderNumber = `GOJI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const customerEmail = addr.email?.trim() || user.email || authUser.email;
    const customerName = `${addr.firstName.trim()} ${addr.lastName.trim()}`.trim();
    const currency = (body.currency || 'NGN').toUpperCase();
    const provider = body.provider === 'FLUTTERWAVE' ? 'FLUTTERWAVE' : 'PAYSTACK';
    const origin = resolveRequestOrigin(req);
    const callbackUrl = `${origin}/checkout/confirmation?orderNumber=${encodeURIComponent(orderNumber)}&provider=${provider}`;
    const reference = `${provider === 'FLUTTERWAVE' ? 'FLW' : 'PSK'}_${orderNumber}_${Date.now()}`;

    if (provider === 'FLUTTERWAVE') {
      const flwKey = process.env.FLUTTERWAVE_SECRET_KEY;
      if (!flwKey || flwKey.includes('xxxx')) {
        if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
        return NextResponse.json(
          {
            message:
              'Flutterwave payment gateway is not configured on this deployment yet. Please configure FLUTTERWAVE_SECRET_KEY in Environment Variables.',
          },
          { status: 503 },
        );
      }

      const res = await fetchWithTimeout('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: (grandTotalMinor / 100).toFixed(2),
          currency,
          redirect_url: callbackUrl,
          customer: { email: customerEmail, name: customerName },
          meta: { userId: user.id, orderNumber },
          customizations: {
            title: 'GOJIFEM Global Marketplace',
            description: `Authenticated checkout for ${orderNumber}`,
          },
        }),
      });

      const data = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };
      if (!res.ok || data.status !== 'success' || !data.data?.link) {
        if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
        logServerEvent('error', 'checkout/session', 'Flutterwave initialization rejected', {
          requestId,
          status: res.status,
          providerMessage: data.message,
        });
        return NextResponse.json(
          { message: data.message || 'Flutterwave payment initialization failed.' },
          { status: 502 },
        );
      }

      const payload = {
        orderNumber,
        provider: 'FLUTTERWAVE',
        reference,
        authorizationUrl: data.data.link,
      };
      if (idemCompositeKey) completeIdempotentOperation(idemCompositeKey, 200, payload);
      return NextResponse.json(payload);
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey || paystackKey.includes('xxxx')) {
      if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
      return NextResponse.json(
        {
          message:
            'Paystack payment gateway is not configured on this deployment yet. Please configure PAYSTACK_SECRET_KEY in Environment Variables.',
        },
        { status: 503 },
      );
    }

    const res = await fetchWithTimeout('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: grandTotalMinor,
        currency,
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: user.id,
          orderNumber,
          customerName,
          billingCountryCode: body.billingCountryCode || countryCode,
        },
      }),
    });

    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; access_code?: string; reference?: string };
    };
    if (!res.ok || !data.status || !data.data?.authorization_url) {
      if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
      logServerEvent('error', 'checkout/session', 'Paystack initialization rejected', {
        requestId,
        status: res.status,
        providerMessage: data.message,
      });
      return NextResponse.json(
        { message: data.message || 'Paystack payment initialization failed.' },
        { status: 502 },
      );
    }

    const payload = {
      orderNumber,
      provider: 'PAYSTACK',
      reference: data.data.reference || reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
    };
    if (idemCompositeKey) completeIdempotentOperation(idemCompositeKey, 200, payload);
    return NextResponse.json(payload);
  } catch (err) {
    if (idemCompositeKey) releaseIdempotentOperation(idemCompositeKey);
    if (err instanceof Error && err.name === 'AbortError') {
      logServerEvent('error', 'checkout/session', 'Payment provider request timed out', {
        requestId,
        timeoutMs: PROVIDER_TIMEOUT_MS,
      });
      return NextResponse.json(
        {
          message:
            'The payment provider took too long to respond. Your card was not charged. Please try again.',
          code: 'GATEWAY_TIMEOUT',
        },
        { status: 504 },
      );
    }
    logServerEvent('error', 'checkout/session', 'Checkout session failed', {
      requestId,
      error: err as Record<string, unknown>,
    });
    return handleServerError(err);
  }
}
