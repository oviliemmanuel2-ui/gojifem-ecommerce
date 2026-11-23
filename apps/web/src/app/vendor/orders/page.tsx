'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Package,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useMarketplace } from '../../../context/MarketplaceContext';
import { ApiError, apiFetch } from '../../../lib/api';
import { Spinner } from '../../../components/ui/Spinner';
import { ErrorRetryBanner } from '../../../components/ui/ErrorRetryBanner';

interface VendorOrderRow {
  id: string;
  vendorOrderNumber: string;
  customerName: string;
  deliveryCity: string;
  deliveryState: string;
  itemsSummary: string;
  subtotalMinorNGN: number;
  commissionMinorNGN: number;
  netPayableMinorNGN: number;
  status: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
}

export default function VendorOrdersPage() {
  const { session, sessionReady, formatPrice, showToast } = useMarketplace();
  const [orders, setOrders] = useState<VendorOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationLockMessage, setVerificationLockMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('DHL Express');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setVerificationLockMessage(null);
    try {
      const res = await apiFetch<{ orders: VendorOrderRow[] }>('/merchant/orders', {
        method: 'GET',
        timeoutMs: 12000,
      });
      setOrders(res.orders);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 403) {
        setVerificationLockMessage(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to load merchant orders.');
      }
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (!sessionReady) return;
    if (session?.accessToken) {
      void fetchOrders();
    } else {
      setLoading(false);
    }
  }, [sessionReady, session?.accessToken, fetchOrders]);

  const handleDispatch = async (orderId: string) => {
    if (!trackingCode.trim()) {
      showToast('Enter a courier tracking number first.', 'warning');
      return;
    }
    setSubmittingDispatch(true);
    try {
      const res = await apiFetch<{
        id: string;
        status: string;
        carrier: string;
        trackingNumber: string;
      }>(`/merchant/orders/${orderId}/dispatch`, {
        method: 'PATCH',
        body: JSON.stringify({
          carrier,
          trackingNumber: trackingCode.trim(),
        }),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: res.status,
                carrier: res.carrier,
                trackingNumber: res.trackingNumber,
              }
            : o,
        ),
      );
      setDispatchingId(null);
      setTrackingCode('');
      showToast(`Order marked dispatched via ${res.carrier}.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update dispatch.', 'error');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  if (!sessionReady || (loading && session?.accessToken && !verificationLockMessage)) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-rose p-10 flex flex-col items-center gap-3">
          <Spinner size="lg" tone="ruby" label="Loading fulfillment orders" />
          <p className="text-sm font-semibold text-espresso-muted">Loading Vendor Orders...</p>
        </div>
      </div>
    );
  }

  if (!session?.accessToken) {
    return (
      <div className="bg-ivory min-h-screen py-16 px-4 text-center">
        <div className="max-w-lg mx-auto bg-white rounded-3xl border border-rose p-8 space-y-4">
          <h1 className="font-serif text-2xl font-bold text-espresso">Sign In Required</h1>
          <Link
            href="/auth/login?redirect=/vendor/orders"
            className="inline-block px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold"
          >
            Sign In to View Orders
          </Link>
        </div>
      </div>
    );
  }

  if (verificationLockMessage) {
    return (
      <div className="bg-ivory min-h-screen py-14 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-rose p-8 sm:p-10 text-center space-y-5 shadow-sm">
          <Lock className="w-10 h-10 text-ruby mx-auto" />
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Order Fulfillment Locked Until Verification
          </h1>
          <p className="text-sm text-espresso-muted">{verificationLockMessage}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/vendor/apply"
              className="px-6 py-3 rounded-full bg-ruby text-white text-xs font-bold"
            >
              Manage Merchant Application
            </Link>
            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-rose text-xs font-bold text-espresso"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-ruby bg-rose px-3 py-1 rounded-full mb-2">
              Vendor Fulfillment
            </span>
            <h1 className="font-serif text-3xl font-bold text-espresso">Order Dispatch Queue</h1>
          </div>
          <Link
            href="/vendor/products"
            className="px-5 py-2.5 rounded-full border border-espresso/20 text-espresso font-bold text-xs hover:border-ruby hover:text-ruby transition flex items-center gap-2 self-start"
          >
            <Package className="w-4 h-4" /> My Product Catalog
          </Link>
        </div>

        {error && <ErrorRetryBanner title="Error loading orders" message={error} onRetry={fetchOrders} />}

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-rose p-12 text-center space-y-3">
              <AlertCircle className="w-9 h-9 text-ruby/40 mx-auto" />
              <h2 className="font-serif text-xl font-bold text-espresso">No Customer Orders Yet</h2>
              <p className="text-xs text-espresso-muted max-w-md mx-auto">
                Paid customer orders containing items from your verified merchant catalog will appear here for courier dispatch.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-rose p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-espresso">
                        {order.vendorOrderNumber}
                      </span>
                      <span className="text-xs text-espresso-muted">
                        · {new Date(order.createdAt).toLocaleString('en-NG')}
                      </span>
                    </div>
                    <p className="text-xs text-espresso-muted mt-0.5">
                      Buyer: <strong className="text-espresso">{order.customerName}</strong> (
                      {[order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') ||
                        'Address on file'}
                      )
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        order.status === 'PENDING_DISPATCH' || order.status === 'PAID'
                          ? 'bg-gold/25 text-espresso'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.status === 'PENDING_DISPATCH' || order.status === 'PAID' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-espresso mb-1">{order.itemsSummary}</p>
                    <p className="text-xs text-espresso-muted">
                      Gross Subtotal: {formatPrice(order.subtotalMinorNGN)} | Commission: -
                      {formatPrice(order.commissionMinorNGN)}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase tracking-wider text-espresso-muted block">
                      Net Settlement Payable
                    </span>
                    <span className="font-serif text-lg font-bold text-ruby">
                      {formatPrice(order.netPayableMinorNGN)}
                    </span>
                  </div>
                </div>

                {order.status === 'PENDING_DISPATCH' || order.status === 'PAID' ? (
                  <div className="pt-2 border-t border-rose/50 flex flex-wrap gap-3 items-center justify-between">
                    {dispatchingId === order.id ? (
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                        <select
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="px-3 py-2 rounded-xl border border-rose text-xs bg-white outline-none"
                        >
                          <option value="DHL Express">DHL Express</option>
                          <option value="FedEx">FedEx International</option>
                          <option value="GIG Logistics">GIG Logistics (Nigeria)</option>
                          <option value="Kwik Delivery">Kwik Delivery</option>
                        </select>
                        <input
                          type="text"
                          value={trackingCode}
                          onChange={(e) => setTrackingCode(e.target.value)}
                          placeholder="Tracking ID (e.g. DHL-998124)"
                          className="px-3 py-2 rounded-xl border border-rose text-xs font-mono outline-none focus:border-ruby"
                        />
                        <button
                          type="button"
                          disabled={submittingDispatch}
                          onClick={() => void handleDispatch(order.id)}
                          className="px-4 py-2 rounded-xl bg-ruby text-white font-bold text-xs hover:bg-ruby-hover transition"
                        >
                          {submittingDispatch ? 'Saving...' : 'Confirm Shipment'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDispatchingId(null)}
                          className="px-3 py-2 text-xs text-espresso-muted hover:text-espresso"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDispatchingId(order.id)}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-espresso text-ivory font-bold text-xs hover:bg-espresso-muted transition"
                      >
                        <Truck className="w-3.5 h-3.5" /> Enter Tracking &amp; Dispatch
                      </button>
                    )}
                  </div>
                ) : (
                  order.trackingNumber && (
                    <div className="pt-2 border-t border-rose/50 text-xs text-espresso-muted flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Dispatched via <strong>{order.carrier}</strong> | Tracking:{' '}
                        <span className="font-mono text-espresso">{order.trackingNumber}</span>
                      </span>
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
