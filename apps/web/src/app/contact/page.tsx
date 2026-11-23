'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { apiFetch } from '../../lib/api';
import { useMarketplace } from '../../context/MarketplaceContext';

export default function ContactPage() {
  const { session, showToast, siteSettings } = useMarketplace();
  const [name, setName] = useState(
    session?.user?.firstName
      ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
      : '',
  );
  const [email, setEmail] = useState(session?.user?.email || '');
  const [phone, setPhone] = useState(session?.user?.phone || '');
  const [subject, setSubject] = useState('Order & Delivery Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 10) {
      setError('Please enter a message of at least 10 characters so our team can assist you.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; id: string; message: string }>('/contact', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      setSubmittedId(res.id || 'RECEIVED');
      setMessage('');
      showToast('Your message has been delivered to GOJIFEM Support.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to send your message right now.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-espresso">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso/70 hover:text-ruby transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Support Info */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ruby">24/7 Marketplace Support</span>
              <h1 className="text-3xl font-serif font-bold text-espresso mt-1">Contact GOJIFEM</h1>
              <p className="text-xs sm:text-sm text-espresso/80 mt-2 leading-relaxed">
                Have a question about an escrow order, international card payment, vendor verification, or parcel tracking? Send a direct inquiry to our operations desk.
              </p>
            </div>

            <div className="bg-white border border-rose rounded-3xl p-6 space-y-4 text-xs shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose text-ruby shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-espresso">Customer &amp; Vendor Support</strong>
                  <span className="text-espresso/75">{siteSettings?.supportEmail || 'support@gojifem.com'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose text-ruby shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-espresso">Operations Dispatch Line</strong>
                  <span className="text-espresso/75">{siteSettings?.supportPhone || '+234 (0) 800 GOJIFEM'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-gold/30 text-espresso shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-espresso">Regional Hub</strong>
                  <span className="text-espresso/75">{siteSettings?.regionalHub || 'Victoria Island, Lagos, Nigeria (Worldwide Fulfillment)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="lg:col-span-7 bg-white border border-rose rounded-3xl p-6 sm:p-8 shadow-sm">
            {submittedId ? (
              <div className="p-6 rounded-2xl bg-rose/30 border border-gold/40 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-ruby font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Message Delivered Successfully</span>
                </div>
                <p className="text-espresso/80 leading-relaxed">
                  Reference ID: <strong>{submittedId}</strong>. Our customer support team has received your inquiry and will reply to <strong>{email}</strong> promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedId(null)}
                  className="px-5 py-2 bg-ruby text-white rounded-xl font-bold hover:bg-ruby-hover transition"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-serif font-bold text-espresso mb-2">Send Us a Message</h2>

                {error && (
                  <div className="p-3 rounded-xl bg-rose/50 border border-ruby/30 text-xs text-ruby font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1.5">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+2348012345678"
                      className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1.5">Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                    >
                      <option value="Order & Delivery Inquiry">Order &amp; Delivery Inquiry</option>
                      <option value="Payment & Escrow Question">Payment &amp; Escrow Question</option>
                      <option value="Vendor KYC & Onboarding">Vendor KYC &amp; Onboarding</option>
                      <option value="Account & Authentication Help">Account &amp; Authentication Help</option>
                      <option value="General Partnership">General Partnership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    minLength={10}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how our team can help you..."
                    className="w-full text-xs border border-rose rounded-xl px-3.5 py-2.5 bg-ivory text-espresso focus:bg-white focus:outline-none focus:ring-2 focus:ring-ruby"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-ruby text-white rounded-xl font-bold text-xs hover:bg-ruby-hover transition flex items-center justify-center gap-2 shadow-md shadow-ruby/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Inquiry...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
