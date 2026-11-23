import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '../../../../../../lib/server/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProviderName = 'PAYSTACK' | 'FLUTTERWAVE';

function resolveProvider(
  explicitProvider: string | null,
  reference: string,
): ProviderName {
  if (explicitProvider?.toUpperCase() === 'FLUTTERWAVE') return 'FLUTTERWAVE';
  if (explicitProvider?.toUpperCase() === 'PAYSTACK') return 'PAYSTACK';
  if (reference.toUpperCase().startsWith('FLW')) return 'FLUTTERWAVE';
  return 'PAYSTACK';
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ reference: string }> },
) {
  const authUser = authenticateRequest(req);
  if (!authUser) {
    return NextResponse.json(
      {
        verified: false,
        status: 'UNAUTHORIZED',
        message: 'Authentication required to verify payment.',
      },
      { status: 401 },
    );
  }

  const { reference: rawReference } = await context.params;
  const reference = decodeURIComponent(rawReference || '').trim();
  if (!reference) {
    return NextResponse.json(
      {
        verified: false,
        status: 'INVALID_REFERENCE',
        message: 'Payment reference is required.',
      },
      { status: 400 },
    );
  }

  const provider = resolveProvider(req.nextUrl.searchParams.get('provider'), reference);

  try {
    if (provider === 'FLUTTERWAVE') {
      const flwKey = process.env.FLUTTERWAVE_SECRET_KEY;
      if (!flwKey || flwKey.includes('xxxx')) {
        return NextResponse.json(
          {
            verified: false,
            status: 'UNCONFIGURED',
            provider,
            reference,
            message:
              'Flutterwave payment gateway is not configured on this deployment. Cannot verify payment.',
          },
          { status: 503 },
        );
      }

      const res = await fetch(
        `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${flwKey}`,
          },
          cache: 'no-store',
        },
      );

      const data = (await res.json()) as {
        status?: string;
        message?: string;
        data?: {
          status?: string;
          amount?: number;
          currency?: string;
          tx_ref?: string;
          meta?: { orderNumber?: string };
        };
      };

      const txStatus = (data?.data?.status || '').toLowerCase();
      if (res.ok && data.status === 'success' && txStatus === 'successful') {
        return NextResponse.json({
          verified: true,
          status: 'SUCCEEDED',
          provider,
          reference: data.data?.tx_ref || reference,
          orderNumber: data.data?.meta?.orderNumber || null,
          amountMinor:
            typeof data.data?.amount === 'number'
              ? Math.round(data.data.amount * 100)
              : null,
          currency: data.data?.currency || 'NGN',
        });
      }

      const normalizedStatus =
        txStatus === 'pending' || txStatus === 'queued' ? 'PENDING' : 'FAILED';
      return NextResponse.json(
        {
          verified: false,
          status: normalizedStatus,
          provider,
          reference,
          message:
            data.message ||
            `Payment has not succeeded (status: ${txStatus || 'unknown'}).`,
        },
        { status: 200 },
      );
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey || paystackKey.includes('xxxx')) {
      return NextResponse.json(
        {
          verified: false,
          status: 'UNCONFIGURED',
          provider,
          reference,
          message:
            'Paystack payment gateway is not configured on this deployment. Cannot verify payment.',
        },
        { status: 503 },
      );
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
        cache: 'no-store',
      },
    );

    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
        reference?: string;
        metadata?: { orderNumber?: string };
      };
    };

    const txStatus = (data?.data?.status || '').toLowerCase();
    if (res.ok && data.status === true && txStatus === 'success') {
      return NextResponse.json({
        verified: true,
        status: 'SUCCEEDED',
        provider,
        reference: data.data?.reference || reference,
        orderNumber: data.data?.metadata?.orderNumber || null,
        amountMinor: typeof data.data?.amount === 'number' ? data.data.amount : null,
        currency: data.data?.currency || 'NGN',
      });
    }

    const normalizedStatus =
      txStatus === 'pending' || txStatus === 'ongoing' || txStatus === 'queued'
        ? 'PENDING'
        : 'FAILED';

    return NextResponse.json(
      {
        verified: false,
        status: normalizedStatus,
        provider,
        reference,
        message:
          data.message ||
          `Payment has not been confirmed by Paystack (status: ${txStatus || 'unknown'}).`,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        verified: false,
        status: 'ERROR',
        provider,
        reference,
        message:
          err instanceof Error
            ? err.message
            : 'Unable to reach payment gateway for verification.',
      },
      { status: 502 },
    );
  }
}
