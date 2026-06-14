'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, Loader2, Copy, Check, Download } from 'lucide-react';

type VerifyState = 'loading' | 'success' | 'failed' | 'error';

interface VerifiedOrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface VerifiedOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items?: VerifiedOrderItem[];
  totalPrice: number;
  orderDate?: string;
  pickupDate: string;
  paymentReference?: string;
  paidAt?: string;
  fulfillmentType?: 'delivery' | 'pickup';
  deliveryAddress?: string;
}

export default function PaymentVerifyPage() {
  const [state, setState] = useState<VerifyState>('loading');
  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const copyReservationId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; fail silently.
    }
  };

  const downloadReceipt = () => {
    window.print();
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference =
      params.get('reference') || params.get('trxref') || '';

    if (!reference) {
      setState('error');
      setMessage('No payment reference was found in the URL.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/payments/verify?reference=${encodeURIComponent(reference)}`
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState('error');
          setMessage(data.error || 'We could not verify your payment.');
          return;
        }

        setOrder(data.order || null);
        setState(data.status === 'success' ? 'success' : 'failed');
      } catch {
        if (!cancelled) {
          setState('error');
          setMessage('A network error occurred while verifying your payment.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="layout-wrapper">
      <Navbar />
      <main className="main-content" style={{ padding: '4rem 0' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="verify-card glass text-center no-print">
            {state === 'loading' && (
              <>
                <Loader2 className="verify-icon spin" size={64} />
                <h2>Verifying your payment…</h2>
                <p className="verify-text">
                  Please wait while we confirm your transaction with Paystack.
                </p>
              </>
            )}

            {state === 'success' && (
              <>
                <CheckCircle className="verify-icon success" size={72} />
                <h2>Payment Successful!</h2>
                <p className="verify-text">
                  Thank you{order ? `, ${order.customerName}` : ''}. Your
                  payment has been confirmed and your trays are reserved.
                </p>

                {order && (
                  <>
                    <div className="save-id-callout">
                      <span className="save-id-label">Save your Reservation ID</span>
                      <div className="save-id-row">
                        <span className="save-id-value">{order.id}</span>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={copyReservationId}
                          aria-label="Copy reservation ID"
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="save-id-hint">
                        Keep this ID safe. Use it (or your email) on the{' '}
                        <strong>Track Order</strong> page to check your reservation anytime.
                      </p>
                    </div>

                    <div className="verify-details">
                      <p>
                        <strong>Amount Paid:</strong> KES{' '}
                        {order.totalPrice.toLocaleString()}
                      </p>
                      <p>
                        <strong>Method:</strong>{' '}
                        {order.fulfillmentType === 'delivery'
                          ? 'Delivery within Nanyuki'
                          : 'Pickup at Nanyuki depot'}
                      </p>
                      {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
                        <p>
                          <strong>Delivery Address:</strong> {order.deliveryAddress}
                        </p>
                      )}
                      <p>
                        <strong>
                          {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Date:
                        </strong>{' '}
                        {order.pickupDate}
                      </p>
                      {order.paymentReference && (
                        <p>
                          <strong>Payment Ref:</strong>{' '}
                          <span className="mono">{order.paymentReference}</span>
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="verify-actions">
                  <button type="button" className="btn btn-primary" onClick={downloadReceipt}>
                    <Download size={16} /> Download Receipt
                  </button>
                  <Link href="/track" className="btn btn-secondary">
                    Track Reservation
                  </Link>
                </div>
                <Link href="/shop" className="continue-link">
                  Continue shopping
                </Link>
              </>
            )}

            {(state === 'failed' || state === 'error') && (
              <>
                <XCircle className="verify-icon failed" size={72} />
                <h2>
                  {state === 'failed'
                    ? 'Payment Not Completed'
                    : 'Verification Problem'}
                </h2>
                <p className="verify-text">
                  {state === 'failed'
                    ? 'Your payment was not successful. Your order is still reserved — you can try paying again or pay on pickup.'
                    : message}
                </p>
                <div className="verify-actions">
                  <Link href="/checkout" className="btn btn-primary">
                    Back to Checkout
                  </Link>
                  <Link href="/track" className="btn btn-secondary">
                    Track Reservation
                  </Link>
                </div>
              </>
            )}
          </div>

          {state === 'success' && order && (
            <div className="receipt-sheet print-only">
              <div className="receipt-head">
                <div>
                  <h1 className="receipt-brand">Tabby Premium Eggs</h1>
                  <p className="receipt-sub">
                    Nanyuki, Kenya &middot; +254 722 237 593 &middot; orders@tabbyeggs.co.ke
                  </p>
                </div>
                <div className="receipt-paid-stamp">PAID</div>
              </div>

              <h2 className="receipt-title">Payment Receipt</h2>

              <div className="receipt-meta">
                <div>
                  <span className="rk">Reservation ID</span>
                  <span className="rv">{order.id}</span>
                </div>
                <div>
                  <span className="rk">Payment Reference</span>
                  <span className="rv">{order.paymentReference || '—'}</span>
                </div>
                <div>
                  <span className="rk">Paid On</span>
                  <span className="rv">{formatDateTime(order.paidAt)}</span>
                </div>
                <div>
                  <span className="rk">
                    {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Date
                  </span>
                  <span className="rv">{order.pickupDate}</span>
                </div>
                <div>
                  <span className="rk">Fulfillment</span>
                  <span className="rv">
                    {order.fulfillmentType === 'delivery'
                      ? 'Delivery (within Nanyuki)'
                      : 'Pickup at depot'}
                  </span>
                </div>
                {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
                  <div>
                    <span className="rk">Delivery Address</span>
                    <span className="rv">{order.deliveryAddress}</span>
                  </div>
                )}
              </div>

              <div className="receipt-customer">
                <span className="rk">Billed To</span>
                <span className="rv">{order.customerName}</span>
                <span className="rv">{order.customerEmail}</span>
                {order.customerPhone && <span className="rv">{order.customerPhone}</span>}
              </div>

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="ta-r">Qty</th>
                    <th className="ta-r">Unit Price</th>
                    <th className="ta-r">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}</td>
                      <td className="ta-r">{it.quantity}</td>
                      <td className="ta-r">KES {it.price.toLocaleString()}</td>
                      <td className="ta-r">
                        KES {(it.price * it.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="ta-r">
                      <strong>Total Paid</strong>
                    </td>
                    <td className="ta-r">
                      <strong>KES {order.totalPrice.toLocaleString()}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>

              <p className="receipt-note">
                Thank you for your order. Present this receipt or your Reservation ID
                ({order.id}) when collecting your trays at our Nanyuki depot (open daily
                8:00 AM – 7:00 PM). Track your order anytime at tabbyeggs.co.ke/track.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .verify-card {
          padding: 3rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .verify-icon.success {
          color: var(--success-color);
        }
        .verify-icon.failed {
          color: var(--error-color);
        }
        .verify-icon.spin {
          color: var(--primary-color);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .verify-text {
          color: var(--fg-muted);
          line-height: 1.6;
        }

        /* Save-your-ID callout */
        .save-id-callout {
          width: 100%;
          text-align: center;
          background: rgba(var(--accent-rgb), 0.1);
          border: 1px dashed var(--accent-dark);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .save-id-label {
          font-family: var(--font-display);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.78rem;
          color: var(--accent-dark);
        }
        .save-id-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .save-id-value {
          font-family: monospace;
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--primary-color);
          background: var(--bg-card-solid);
          border: 1px solid var(--border-color);
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-sm);
        }
        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--primary-fg);
          background: var(--primary-color);
          border: none;
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .copy-btn:hover {
          background: var(--primary-light);
        }
        .save-id-hint {
          font-size: 0.82rem;
          color: var(--fg-muted);
          line-height: 1.5;
        }
        .continue-link {
          font-size: 0.9rem;
          color: var(--fg-muted);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .continue-link:hover {
          color: var(--primary-color);
        }
        .verify-details {
          background-color: rgba(var(--primary-rgb), 0.05);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1.5rem;
          width: 100%;
          text-align: left;
          font-size: 0.95rem;
          line-height: 1.8;
        }
        .mono {
          font-family: monospace;
          background-color: rgba(255, 255, 255, 0.5);
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          color: var(--primary-color);
          font-weight: 700;
        }
        .verify-actions {
          display: flex;
          gap: 1rem;
          width: 100%;
        }
        .verify-actions :global(.btn) {
          flex: 1;
        }
        @media (max-width: 576px) {
          .verify-card {
            padding: 2rem 1.5rem;
          }
          .verify-actions {
            flex-direction: column;
          }
        }

        /* ---- Printable receipt sheet (hidden on screen) ---- */
        .receipt-sheet {
          color: #111;
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.5;
        }
        .receipt-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #111;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .receipt-brand {
          font-size: 22px;
          font-weight: 800;
          color: #1b4332;
          margin: 0;
        }
        .receipt-sub {
          font-size: 11px;
          color: #555;
          margin-top: 4px;
        }
        .receipt-paid-stamp {
          border: 2px solid #2d6a4f;
          color: #2d6a4f;
          font-weight: 800;
          letter-spacing: 0.15em;
          padding: 6px 14px;
          border-radius: 6px;
          transform: rotate(-6deg);
          font-size: 16px;
        }
        .receipt-title {
          font-size: 16px;
          margin: 0 0 14px;
          color: #111;
        }
        .receipt-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 24px;
          margin-bottom: 18px;
        }
        .receipt-meta .rk,
        .receipt-customer .rk {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #777;
        }
        .receipt-meta .rv,
        .receipt-customer .rv {
          display: block;
          font-weight: 600;
          color: #111;
        }
        .receipt-customer {
          margin-bottom: 18px;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        .receipt-table th,
        .receipt-table td {
          padding: 8px 6px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        .receipt-table thead th {
          border-bottom: 2px solid #111;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .receipt-table tfoot td {
          border-bottom: none;
          border-top: 2px solid #111;
          font-size: 14px;
        }
        .ta-r {
          text-align: right !important;
        }
        .receipt-note {
          font-size: 11px;
          color: #555;
          border-top: 1px dashed #bbb;
          padding-top: 12px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
