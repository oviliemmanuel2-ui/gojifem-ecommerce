'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  ExternalLink,
  MapPin,
  Store
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { useMarketplace } from '../../../context/MarketplaceContext';

interface VendorOrderLine {
  id: string;
  vendorOrderNumber: string;
  customerName: string;
  deliveryCity: string;
  deliveryState: string;
  itemsSummary: string;
  subtotalMinorNGN: number;
  commissionMinorNGN: number;
  netPayableMinorNGN: number;
  status: 'ACCEPTED' | 'PACKING' | 'SHIPPED' | 'DELIVERED';
  carrier?: string;
  trackingNumber?: string;
  createdAt: string;
}

const INITIAL_VENDOR_ORDERS: VendorOrderLine[] = [
  {
    id: 'vo_1',
    vendorOrderNumber: 'GOJI-2026-849201-V1',
    customerName: 'Chidi Okafor',
    deliveryCity: 'Lekki Phase 1',
    deliveryState: 'Lagos State',
    itemsSummary: '1x Luxury Aso-Oke Agbada & Fila Set (Medium)',
    subtotalMinorNGN: 14500000,
    commissionMinorNGN: 1450000, // 10%
    netPayableMinorNGN: 13050000, // ₦130,500
    status: 'ACCEPTED',
    createdAt: 'Today, 09:15 AM',
  },
  {
    id: 'vo_2',
    vendorOrderNumber: 'GOJI-2026-849100-V1',
    customerName: 'Amaka Bello',
    deliveryCity: 'Maitama',
    deliveryState: 'Abuja FCT',
    itemsSummary: '2x Embroidered Gobi Cap with Hand-Stitched Royal Filigree',
    subtotalMinorNGN: 3700000,
    commissionMinorNGN: 370000,
    netPayableMinorNGN: 3330000, // ₦33,300
    status: 'SHIPPED',
    carrier: 'GIG Logistics',
    trackingNumber: 'GIG-NIG-773821',
    createdAt: 'Yesterday, 02:40 PM',
  },
];

export default function VendorOrdersPage() {
  const { formatPrice } = useMarketplace();
  const [orders, setOrders] = useState<VendorOrderLine[]>(INITIAL_VENDOR_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrderLine | null>(null);
  const [carrier, setCarrier] = useState('GIG Logistics');
  const [trackingCode, setTrackingCode] = useState('GIG-NIG-' + Math.floor(100000 + Math.random() * 900000));
  const [dispatching, setDispatching] = useState(false);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setDispatching(true);

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: 'SHIPPED', carrier, trackingNumber: trackingCode }
            : o,
        ),
      );
      setDispatching(false);
      setSelectedOrder(null);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ruby uppercase tracking-wider mb-1">
              <Store className="w-4 h-4 text-gold" />
              <span>Merchant Order Fulfillment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-espresso">
              Vendor Orders & Parcel Dispatch
            </h1>
            <p className="text-xs sm:text-sm text-espresso/70 mt-1">
              Pack orders, assign courier waybills, and fulfill deliveries to release escrow payouts
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-rose shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-espresso">
              <thead className="bg-rose/30 text-[11px] uppercase font-bold text-espresso/70 border-b border-rose">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Package Ref</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Your Net Payable</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-rose/20 transition">
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-espresso">
                      {order.vendorOrderNumber}
                      <span className="block text-[10px] text-espresso/50 font-sans font-normal mt-0.5">
                        {order.createdAt}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs font-medium text-espresso">
                      {order.itemsSummary}
                    </td>

                    <td className="py-4 px-4">
                      <strong className="text-espresso block font-serif">{order.customerName}</strong>
                      <span className="text-[11px] text-espresso/70">
                        {order.deliveryCity}, {order.deliveryState}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <strong className="text-espresso font-serif text-sm block">
                        {formatPrice(order.netPayableMinorNGN)}
                      </strong>
                      <span className="text-[10px] text-espresso/50 block">
                        Gross: {formatPrice(order.subtotalMinorNGN)} (-10% comm)
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {order.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/40 text-espresso border border-gold/40">
                          <Clock className="w-3 h-3 text-espresso" />
                          <span>Ready for Packing</span>
                        </span>
                      )}
                      {order.status === 'SHIPPED' && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose text-ruby border border-rose">
                            <Truck className="w-3 h-3 text-ruby" />
                            <span>In Transit</span>
                          </span>
                          <span className="block text-[10px] text-espresso/60 font-mono mt-0.5">
                            {order.carrier}: {order.trackingNumber}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 text-right">
                      {order.status === 'ACCEPTED' ? (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition shadow-sm"
                        >
                          Dispatch Parcel
                        </button>
                      ) : (
                        <span className="text-xs text-ruby font-semibold">Dispatched ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-espresso/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-rose shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose">
                <h3 className="font-serif font-bold text-espresso text-base">
                  Dispatch Package: {selectedOrder.vendorOrderNumber}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-lg hover:bg-rose/40 text-espresso/60"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-ivory rounded-2xl border border-rose text-xs space-y-1">
                <div className="text-espresso/60">Destination:</div>
                <strong className="text-espresso block font-serif">
                  {selectedOrder.customerName} • {selectedOrder.deliveryCity}, {selectedOrder.deliveryState}
                </strong>
                <div className="text-espresso/60 pt-1">Items to pack:</div>
                <div className="font-medium text-espresso">{selectedOrder.itemsSummary}</div>
              </div>

              <form onSubmit={handleDispatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">
                    Logistics / Courier Carrier
                  </label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                  >
                    <option value="GIG Logistics">GIG Logistics (GIGL)</option>
                    <option value="Kwik Delivery">Kwik Delivery</option>
                    <option value="DHL Express Nigeria">DHL Express Nigeria</option>
                    <option value="Red Star Express">Red Star Express (FedEx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">
                    Courier Waybill / Tracking Number
                  </label>
                  <input
                    type="text"
                    required
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-rose rounded-xl text-xs font-semibold text-espresso hover:bg-rose/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="px-5 py-2 bg-ruby text-white rounded-xl text-xs font-bold hover:bg-ruby-hover transition shadow-sm disabled:opacity-50"
                  >
                    <span>{dispatching ? 'Confirming...' : 'Confirm Parcel Dispatched'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
