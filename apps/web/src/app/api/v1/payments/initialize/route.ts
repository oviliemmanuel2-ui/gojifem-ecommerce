import { NextRequest, NextResponse } from 'next/server';
import { CHECKOUT_AUTH_MESSAGE } from '../../../../../lib/authRedirect';
import { authenticateRequest } from '../../../../../lib/server/jwt';
import { resolveRequestOrigin } from '../../../../../lib/server/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return NextResponse.json(
      { message: CHECKOUT_AUTH_MESSAGE, code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      orderId?: string;
      orderNumber?: string;
      customerEmail?: string;
      customerName?: string;
      amountMinor?: number;
      currency?: string;
      provider?: 'PAYSTACK' | 'FLUTTERWAVE';
    };

    const orderNumber = body.orderNumber || `GOJI-${Date.now()}`;
    const customerEmail = body.customerEmail?.trim() || authUser.email;
    const amountMinor = Math.round(Number(body.amountMinor || 0));
    const currency = (body.currency || 'NGN').toUpperCase();
    const provider = body.provider === 'FLUTTERWAVE' ? 'FLUTTERWAVE' : 'PAYSTACK';
    const origin = resolveRequestOrigin(req);
    const callbackUrl = `${origin}/checkout/confirmation?orderNumber=${encodeURIComponent(orderNumber)}`;

    if (!customerEmail || amountMinor <= 0) {
      return NextResponse.json(
        { message: 'Valid customer email and positive order amount are required.' },
        { status: 400 },
      );
    }

    const reference = `${provider === 'FLUTTERWAVE' ? 'FLW' : 'PSK'}_${orderNumber}_${Date.now()}`;

    if (provider === 'FLUTTERWAVE') {
      const flwKey = process.env.FLUTTERWAVE_SECRET_KEY;
      if (!flwKey || flwKey.includes('xxxx')) {
        return NextResponse.json(
          {
            message:
              'Flutterwave payment gateway is not configured on this deployment yet. Please configure FLUTTERWAVE_SECRET_KEY in Environment Variables.',
          },
          { status: 503 },
        );
      }

      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: (amountMinor / 100).toFixed(2),
          currency,
          redirect_url: callbackUrl,
          customer: {
            email: customerEmail,
            name: body.customerName || customerEmail,
          },
          meta: {
            userId: authUser.sub,
            orderNumber,
          },
          customizations: {
            title: 'GOJIFEM Global Marketplace',
            description: `Payment for order ${orderNumber}`,
          },
        }),
      });

      const data = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };
      if (!res.ok || data.status !== 'success' || !data.data?.link) {
        return NextResponse.json(
          { message: data.message || 'Flutterwave payment initialization failed.' },
          { status: 502 },
        );
      }

      return NextResponse.json({
        provider: 'FLUTTERWAVE',
        reference,
        authorizationUrl: data.data.link,
      });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey || paystackKey.includes('xxxx')) {
      return NextResponse.json(
        {
          message:
            'Paystack payment gateway is not configured on this deployment yet. Please configure PAYSTACK_SECRET_KEY in Environment Variables.',
        },
        { status: 503 },
      );
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: amountMinor,
        currency,
        reference,
        callback_url: callbackUrl,
        metadata: {
          userId: authUser.sub,
          orderId: body.orderId,
          orderNumber,
          customerName: body.customerName,
        },
      }),
    });

    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; access_code?: string; reference?: string };
    };
    if (!res.ok || !data.status || !data.data?.authorization_url) {
      return NextResponse.json(
        { message: data.message || 'Paystack payment initialization failed.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      provider: 'PAYSTACK',
      reference: data.data.reference || reference,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Unable to initialize payment gateway.' },
      { status: 500 },
    );
  }
}
