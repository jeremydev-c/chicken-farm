'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Order } from '@/lib/db';
import { Search, Calendar, User, Phone, Mail, Clock, CheckCircle, XCircle, AlertCircle, Truck, Store, MapPin, Download, CreditCard } from 'lucide-react';

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'id' | 'phone'>('email');
  const [results, setResults] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setResults([]);

    try {
      let url = '/api/orders?';
      if (searchType === 'email') {
        url += `email=${encodeURIComponent(searchQuery.trim())}`;
      } else if (searchType === 'phone') {
        url += `phone=${encodeURIComponent(searchQuery.trim())}`;
      } else {
        url += `id=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        if (Array.isArray(data)) {
          setResults(data);
        } else if (data && typeof data === 'object' && !data.error) {
          setResults([data]);
        } else {
          setResults([]);
        }
      } else {
        setError(data.error || 'Failed to search reservations.');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (orderId: string) => {
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (res.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || 'Failed to initialize payment.');
      }
    } catch (err) {
      alert('Network error. Failed to start payment.');
    }
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'fulfilled': return 'status-fulfilled';
      case 'canceled': return 'status-canceled';
      default: return 'status-pending';
    }
  };

  const formatStatus = (status: Order['status']) => {
    switch (status) {
      case 'fulfilled': return 'Ready for Pickup / Fulfilled';
      case 'canceled': return 'Canceled';
      default: return 'Pending Pickup';
    }
  };

  return (
    <div className="layout-wrapper">
      <Navbar />

      <main className="main-content">
        <section className="search-section">
          <div className="container search-container">
            <div className="text-center search-header">
              <h1>Track Your Farm Reservation</h1>
              <p>Enter your Email address or Reservation ID to view the status of your order.</p>
            </div>

            <form onSubmit={handleSearch} className="search-form glass">
              <div className="search-type-selector">
                <button 
                  type="button" 
                  onClick={() => setSearchType('email')} 
                  className={`type-btn ${searchType === 'email' ? 'active' : ''}`}
                >
                  Email Address
                </button>
                <button 
                  type="button" 
                  onClick={() => setSearchType('phone')} 
                  className={`type-btn ${searchType === 'phone' ? 'active' : ''}`}
                >
                  Phone
                </button>
                <button 
                  type="button" 
                  onClick={() => setSearchType('id')} 
                  className={`type-btn ${searchType === 'id' ? 'active' : ''}`}
                >
                  Reservation ID
                </button>
              </div>

              <div className="search-input-wrapper">
                <input 
                  type={searchType === 'email' ? 'email' : searchType === 'phone' ? 'tel' : 'text'} 
                  required
                  placeholder={searchType === 'email' ? 'e.g. john@example.com' : searchType === 'phone' ? 'e.g. +254712345678' : 'e.g. ord_1234567890'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  id="track-search-input"
                />
                <button type="submit" className="btn btn-primary search-submit-btn" id="track-search-btn">
                  <Search size={18} /> {loading ? 'Searching...' : 'Track'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="results-section">
          <div className="container">
            {loading && (
              <div className="text-center py-8">
                <div className="spinner"></div>
                <p className="mt-2 text-muted">Retrieving order logs...</p>
              </div>
            )}

            {error && (
              <div className="error-box glass">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            {searched && !loading && !error && results.length === 0 && (
              <div className="empty-results glass text-center">
                <AlertCircle size={40} className="empty-icon" />
                <h3>No Reservations Found</h3>
                <p>We couldn't find any orders matching "{searchQuery}" under {searchType === 'email' ? 'email' : 'ID'}.</p>
                <p className="empty-tip">Double check the spelling or make sure you used the correct email address.</p>
              </div>
            )}

            {searched && !loading && results.length > 0 && (
              <div className="results-list">
                <h2 className="results-title">Found {results.length} Reservation{results.length > 1 ? 's' : ''}</h2>
                
                {results.map(order => (
                  <div key={order.id} className="order-result-card glass">
                    
                    {/* Card Header */}
                    <div className="card-header">
                      <div className="header-info">
                        <span className="order-id-label">RESERVATION ID</span>
                        <h3 className="order-id">
                          {order.id}
                          <button
                            type="button"
                            className="copy-id-btn"
                            onClick={() => {
                              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                navigator.clipboard.writeText(order.id);
                              }
                            }}
                            aria-label="Copy reservation id"
                          >
                            Copy
                          </button>
                        </h3>
                        <span className="order-date">Placed: {new Date(order.orderDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="header-badge">
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                        {order.paymentStatus === 'paid' && (
                          <span className="status-badge payment-paid">Paid Online</span>
                        )}
                        <span className="status-badge fulfillment-badge">
                          {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Stepper */}
                    <div className="stepper-wrapper">
                      <div className="stepper">
                        <div className="step completed">
                          <div className="step-circle">✓</div>
                          <span className="step-label">Reserved</span>
                        </div>
                        
                        <div className={`step-line ${order.status === 'fulfilled' ? 'completed' : ''}`}></div>
                        
                        {order.status === 'canceled' ? (
                          <div className="step canceled">
                            <div className="step-circle">✗</div>
                            <span className="step-label">Canceled</span>
                          </div>
                        ) : (
                          <div className={`step ${order.status === 'fulfilled' ? 'completed' : ''}`}>
                            <div className="step-circle">
                              {order.status === 'fulfilled' ? '✓' : '2'}
                            </div>
                            <span className="step-label">Ready & Fulfilled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Details Body */}
                    <div className="card-body">
                      <div className="customer-info-box">
                        <h4>Pickup/Delivery Contact Details</h4>
                        <div className="info-grid">
                          <p><User size={14} className="icon" /> {order.customerName}</p>
                          <p><Phone size={14} className="icon" /> {order.customerPhone}</p>
                          <p><Mail size={14} className="icon" /> {order.customerEmail}</p>
                          <p>
                            {order.fulfillmentType === 'delivery'
                              ? <Truck size={14} className="icon" />
                              : <Store size={14} className="icon" />}
                            {order.fulfillmentType === 'delivery'
                              ? 'Delivery within Nanyuki'
                              : 'Pickup at Nanyuki depot'}
                          </p>
                          {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
                            <div>
                              <p><MapPin size={14} className="icon" /> {order.deliveryAddress}</p>
                              {typeof order.deliveryLat === 'number' && typeof order.deliveryLng === 'number' && (
                                <p><a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLat},${order.deliveryLng}`} target="_blank" rel="noreferrer">View on map</a></p>
                              )}
                            </div>
                          )}
                          <p><Calendar size={14} className="icon text-accent" /> <strong>{order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Date: {order.pickupDate}</strong></p>
                        </div>
                        {order.notes && (
                          <div className="notes-box">
                            <strong>Note:</strong> "{order.notes}"
                          </div>
                        )}
                      </div>

                      <div className="items-list-box">
                        <h4>Items Reserved</h4>
                        <div className="items-table">
                          <div className="table-header">
                            <span>Product</span>
                            <span className="text-right">Qty</span>
                            <span className="text-right">Price</span>
                            <span className="text-right">Total</span>
                          </div>
                          
                          {order.items.map((item, idx) => (
                            <div key={idx} className="table-row">
                              <span className="item-name">{item.name}</span>
                              <span className="item-qty text-right">{item.quantity}</span>
                              <span className="item-price text-right">KES {item.price.toLocaleString()}</span>
                              <span className="item-total text-right">KES {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}

                          <div className="table-total-row">
                            <span>Estimated Total:</span>
                            <span className="total-amount">KES {order.totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <span className="payment-notice">
                          {order.paymentStatus === 'paid'
                            ? '✓ Payment successfully processed via Paystack.'
                            : '⚠ Payment is pending online via Paystack.'}
                        </span>

                        <div className="invoice-download-wrapper" style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {order.paymentStatus !== 'paid' && order.status !== 'canceled' && (
                            <button
                              onClick={() => handlePayNow(order.id)}
                              className="btn btn-primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              <CreditCard size={14} /> Pay Now via Paystack
                            </button>
                          )}
                          <a 
                            href={`/api/orders/invoice?id=${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                          >
                            <Download size={14} /> Download PDF Invoice
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .search-section {
          padding: 4rem 0 2rem 0;
        }

        .search-container {
          max-width: 650px;
          margin: 0 auto;
        }

        .search-header {
          margin-bottom: 2rem;
        }

        .search-header h1 {
          font-size: 2.25rem;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .search-header p {
          color: var(--fg-muted);
        }

        .search-form {
          border-radius: var(--radius-md);
          padding: 1.5rem;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .search-type-selector {
          display: flex;
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 0.75rem;
          gap: 1.5rem;
        }

        .type-btn {
          background: transparent;
          border: none;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--fg-muted);
          cursor: pointer;
          padding: 0.25rem 0;
          position: relative;
          transition: color var(--transition-fast);
        }

        .type-btn:hover {
          color: var(--primary-color);
        }

        .type-btn.active {
          color: var(--primary-color);
        }

        .type-btn.active::after {
          content: '';
          position: absolute;
          bottom: -13px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--accent-color);
          border-radius: var(--radius-full);
        }

        .search-input-wrapper {
          display: flex;
          gap: 0.75rem;
        }

        .search-input {
          flex-grow: 1;
        }

        .search-submit-btn {
          white-space: nowrap;
        }

        /* Results section */
        .results-section {
          padding-bottom: 5rem;
        }

        .results-title {
          font-size: 1.5rem;
          color: var(--primary-color);
          margin-bottom: 1.5rem;
        }

        .results-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .order-result-card {
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        /* Card Header */
        .order-result-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background-color: rgba(var(--primary-rgb), 0.02);
        }

        .order-id-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--fg-muted);
          letter-spacing: 0.05em;
        }

        .order-id {
          font-family: monospace;
          color: var(--primary-color);
          font-size: 1.2rem;
          font-weight: 700;
        }

        .copy-id-btn {
          margin-left: 0.6rem;
          background: transparent;
          border: 1px solid rgba(0,0,0,0.06);
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--fg-muted);
        }

        .copy-id-btn:hover {
          color: var(--primary-color);
          border-color: rgba(var(--primary-rgb), 0.12);
        }

        .map-link {
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: underline;
        }

        .order-date {
          font-size: 0.8rem;
          color: var(--fg-muted);
          display: block;
          margin-top: 0.25rem;
        }

        .status-badge {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .status-pending {
          background-color: rgba(233, 196, 106, 0.15);
          color: var(--gold-light);
        }

        .status-fulfilled {
          background-color: rgba(64, 145, 108, 0.15);
          color: var(--success-color);
        }

        .payment-paid {
          background-color: rgba(64, 145, 108, 0.15);
          color: var(--success-color);
        }

        .fulfillment-badge {
          background-color: rgba(var(--primary-rgb), 0.1);
          color: var(--primary-color);
        }

        .header-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
        }

        .status-canceled {
          background-color: rgba(217, 4, 41, 0.15);
          color: var(--error-color);
        }

        /* Progress Stepper */
        .stepper-wrapper {
          padding: 1.5rem 2.5rem;
          border-bottom: 1px solid var(--border-color);
          background-color: rgba(var(--primary-rgb), 0.01);
        }

        .stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 450px;
          margin: 0 auto;
          position: relative;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          z-index: 2;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--border-color-solid);
          color: var(--fg-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          border: 2px solid var(--bg-color);
          transition: background-color var(--transition-normal), color var(--transition-normal);
        }

        .step.completed .step-circle {
          background-color: var(--primary-color);
          color: var(--primary-fg);
        }

        .step.canceled .step-circle {
          background-color: var(--error-color);
          color: #ffffff;
        }

        .step-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--fg-muted);
          font-family: var(--font-display);
        }

        .step.completed .step-label {
          color: var(--primary-color);
        }

        .step.canceled .step-label {
          color: var(--error-color);
        }

        .step-line {
          flex-grow: 1;
          height: 2px;
          background: var(--border-color-solid);
          margin: -15px 1rem 0 1rem;
          z-index: 1;
          transition: background-color var(--transition-normal);
        }

        .step-line.completed {
          background-color: var(--primary-color);
        }

        /* Card Body */
        .order-result-card .card-body {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          padding: 2rem;
          gap: 3rem;
        }

        .customer-info-box h4,
        .items-list-box h4 {
          font-family: var(--font-display);
          color: var(--primary-color);
          font-size: 1.05rem;
          margin-bottom: 1rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid var(--border-color-solid);
        }

        .customer-info-box .info-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .customer-info-box p {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .customer-info-box .icon {
          color: var(--fg-muted);
        }

        .text-accent {
          color: var(--accent-dark) !important;
        }

        .notes-box {
          margin-top: 1.5rem;
          background-color: rgba(var(--accent-rgb), 0.05);
          border-left: 3px solid var(--accent-color);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          color: var(--fg-color);
          font-style: italic;
        }

        .items-table {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 0.5fr 1fr 1fr;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color-solid);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 0.5fr 1fr 1fr;
          font-size: 0.9rem;
          color: var(--fg-color);
          align-items: center;
        }

        .item-name {
          font-weight: 600;
        }

        .item-qty {
          color: var(--fg-muted);
        }

        .text-right {
          text-align: right;
        }

        .table-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color-solid);
          font-weight: bold;
          font-family: var(--font-display);
          font-size: 1.05rem;
        }

        .table-total-row .total-amount {
          font-size: 1.25rem;
          color: var(--accent-dark);
        }

        .payment-notice {
          font-size: 0.75rem;
          color: var(--fg-muted);
          display: block;
          margin-top: 1rem;
          font-style: italic;
        }

        /* Error/Spinner/Empty states */
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color-solid);
          border-top: 4px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .error-box {
          max-width: 500px;
          margin: 0 auto;
          background-color: rgba(217, 4, 41, 0.08);
          border: 1px solid rgba(217, 4, 41, 0.2);
          border-radius: var(--radius-sm);
          padding: 1rem;
          color: var(--error-color);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
        }

        .empty-results {
          max-width: 500px;
          margin: 0 auto;
          border-radius: var(--radius-md);
          padding: 3rem 2rem;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .empty-icon {
          color: var(--fg-muted);
          opacity: 0.6;
        }

        .empty-results h3 {
          color: var(--primary-color);
          font-size: 1.25rem;
        }

        .empty-tip {
          font-size: 0.85rem;
          color: var(--fg-muted);
        }

        .py-8 {
          padding: 4rem 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .search-header h1 {
            font-size: 1.75rem;
          }
          .order-result-card .card-body {
            grid-template-columns: 1fr;
            gap: 2rem;
            padding: 1.5rem;
          }
          .order-result-card .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.25rem;
          }
          .stepper-wrapper {
            padding: 1.5rem 1rem;
          }
          .search-input-wrapper {
            flex-direction: column;
          }
          .search-submit-btn {
            width: 100%;
          }
          .table-header, .table-row {
            grid-template-columns: 2fr 0.5fr 1fr;
          }
          .table-header span:nth-child(3),
          .table-row .item-price {
            display: none;
          }
          .results-title {
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .search-header h1 {
            font-size: 1.5rem;
          }
          .search-form {
            padding: 1rem;
          }
          .search-section {
            padding: 3rem 0 1.5rem 0;
          }
          .order-result-card .card-body {
            padding: 1rem;
          }
          .order-result-card .card-header {
            padding: 1rem;
          }
          .order-id {
            font-size: 0.95rem;
          }
          .status-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}
