'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { OrderItem } from '@/lib/db';
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Wallet,
  Truck,
  Store
} from 'lucide-react';

export default function CheckoutPage() {
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    clearCart, 
    eggStats, 
    refreshEggStats 
  } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'on_pickup' | 'paystack'>('on_pickup');
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Action States
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Set default minimum pickup date (tomorrow)
  const getMinPickupDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setOrderError(null);

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          items: orderItems,
          pickupDate,
          notes,
          paymentMethod,
          fulfillmentType,
          deliveryAddress,
          deliveryLat: deliveryCoords?.lat,
          deliveryLng: deliveryCoords?.lng,
          adminBypass: false
        })
      });

      const data = await res.json();

      if (res.ok) {
        // For online payment, initialize Paystack and redirect to the
        // secure hosted checkout. The order is already reserved at this point.
        if (paymentMethod === 'paystack') {
          const payRes = await fetch('/api/payments/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.id })
          });
          const payData = await payRes.json();

          if (payRes.ok && payData.authorizationUrl) {
            clearCart();
            window.location.href = payData.authorizationUrl;
            return;
          }

          setOrderError(
            (payData.error || 'Could not start online payment.') +
              ' Your order has been reserved — you can pay on pickup instead.'
          );
          await refreshEggStats();
          setSubmitting(false);
          return;
        }

        setSuccessOrder(data);
        clearCart(); // Clear global context cart
        
        // Reset form
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setPickupDate('');
        setNotes('');
        setDeliveryAddress('');
        setDeliveryCoords(null);
        setFulfillmentType('pickup');

        // Refresh egg stats
        await refreshEggStats();
      } else {
        setOrderError(data.error || 'Failed to place reservation. Please check stock limits.');
      }
    } catch (err) {
      setOrderError('Network error. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="layout-wrapper">
        <Navbar />
        <main className="main-content" style={{ padding: '4rem 0' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <div className="success-card glass text-center">
              <CheckCircle className="success-icon" size={72} />
              <h2>Reservation Confirmed!</h2>
              <p className="order-intro">Thank you, {successOrder.customerName}. Your order is reserved!</p>
              
              <div className="order-details-box">
                <p><strong>Reservation ID:</strong> <span className="order-id">{successOrder.id}</span></p>
                <p><strong>Method:</strong> {successOrder.fulfillmentType === 'delivery' ? 'Delivery within Nanyuki' : 'Pickup at Nanyuki depot'}</p>
                {successOrder.fulfillmentType === 'delivery' && successOrder.deliveryAddress && (
                  <p><strong>Delivery Address:</strong> {successOrder.deliveryAddress}</p>
                )}
                <p><strong>{successOrder.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Date:</strong> {successOrder.pickupDate}</p>
                <p><strong>Estimated Total:</strong> KES {successOrder.totalPrice.toLocaleString()} (Pay on delivery/pickup)</p>
              </div>

              <p className="order-disclaimer">
                We've sent a confirmation details link to <strong>{successOrder.customerEmail}</strong>. You can use your email or Reservation ID to track your order status anytime.
              </p>

              <div className="success-actions">
                <Link href="/shop" className="btn btn-primary">
                  Continue Shopping
                </Link>
                <Link href="/track" className="btn btn-secondary">
                  Track Reservation
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <style jsx>{`
          .success-card {
            padding: 3rem;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .success-icon {
            color: var(--success-color);
          }
          .order-intro {
            font-size: 1.15rem;
            color: var(--fg-color);
          }
          .order-details-box {
            background-color: rgba(var(--primary-rgb), 0.05);
            border-radius: var(--radius-sm);
            padding: 1.5rem;
            width: 100%;
            text-align: left;
            font-size: 0.95rem;
            line-height: 1.7;
            border: 1px solid var(--border-color);
          }
          .order-id {
            font-family: monospace;
            background-color: rgba(255, 255, 255, 0.5);
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            color: var(--primary-color);
            font-weight: bold;
          }
          .order-disclaimer {
            font-size: 0.85rem;
            color: var(--fg-muted);
            line-height: 1.6;
          }
          .success-actions {
            display: flex;
            gap: 1rem;
            width: 100%;
          }
          .success-actions :global(.btn) {
            flex: 1;
          }
          @media (max-width: 576px) {
            .success-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <Navbar />

      <main className="main-content" style={{ padding: '3rem 0 6rem 0' }}>
        <div className="container">
          
          <div className="checkout-title-block">
            <h1>Finalize Your Reservation</h1>
            <p>Fill in your pick up details below. Pay securely online with Paystack (card or M-Pesa) now, or pay with M-Pesa / Cash on pickup.</p>
          </div>

          {cart.length === 0 ? (
            <div className="empty-checkout glass text-center">
              <ShoppingBag size={64} className="empty-icon" />
              <h2>Your cart is empty</h2>
              <p>You need to add products from our catalog before proceeding to checkout.</p>
              <div style={{ marginTop: '1.5rem' }}>
                <Link href="/shop" className="btn btn-primary">
                  Browse Shop Catalog <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="checkout-grid">
              
              {/* Left Column: Form */}
              <div className="checkout-form-container glass">
                <h3>1. Pickup & Contact Details</h3>
                <div className="divider"></div>

                {orderError && (
                  <div className="error-alert">
                    <AlertTriangle size={20} className="alert-err-icon" />
                    <div className="error-text">
                      <strong>Stock Check Failed:</strong> {orderError}
                    </div>
                  </div>
                )}

                <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                  <div className="form-group">
                    <label htmlFor="customerName">Your Full Name</label>
                    <input 
                      type="text" 
                      id="customerName"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="customerEmail">Email Address</label>
                      <input 
                        type="email" 
                        id="customerEmail"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. john@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="customerPhone">Phone Number</label>
                      <input 
                        type="tel" 
                        id="customerPhone"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 0722 222 222"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>How would you like to receive your eggs?</label>
                    <div className="pay-methods">
                      <button
                        type="button"
                        className={`pay-option ${fulfillmentType === 'delivery' ? 'active' : ''}`}
                        onClick={() => setFulfillmentType('delivery')}
                        aria-pressed={fulfillmentType === 'delivery'}
                      >
                        <Truck size={20} />
                        <span className="pay-option-text">
                          <strong>Delivery</strong>
                          <span>Within Nanyuki town</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`pay-option ${fulfillmentType === 'pickup' ? 'active' : ''}`}
                        onClick={() => setFulfillmentType('pickup')}
                        aria-pressed={fulfillmentType === 'pickup'}
                      >
                        <Store size={20} />
                        <span className="pay-option-text">
                          <strong>Pickup</strong>
                          <span>Collect at our Nanyuki depot</span>
                        </span>
                      </button>
                    </div>
                    <span className="input-tip">
                      We deliver within Nanyuki town. If you are outside Nanyuki, please choose pickup at our depot.
                    </span>
                  </div>

                  {fulfillmentType === 'delivery' && (
                    <div className="form-group">
                      <label htmlFor="deliveryAddress">Delivery Address (within Nanyuki) *</label>
                      <AddressAutocomplete
                        id="deliveryAddress"
                        required
                        value={deliveryAddress}
                        onChange={(val) => {
                          setDeliveryAddress(val);
                          setDeliveryCoords(null);
                        }}
                        onSelect={({ address, lat, lng }) => {
                          setDeliveryAddress(address);
                          if (typeof lat === 'number' && typeof lng === 'number') {
                            setDeliveryCoords({ lat, lng });
                          }
                        }}
                      />
                      <span className="input-tip">
                        Search your area or tap &quot;Use my current location&quot;. You can fine-tune the address after.
                      </span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="pickupDate">
                      Preferred {fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Date
                    </label>
                    <input 
                      type="date" 
                      id="pickupDate"
                      required
                      min={getMinPickupDate()}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                    />
                    <span className="input-tip">All reservations require at least 24 hours advance scheduling.</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Special Notes / Delivery Details</label>
                    <textarea 
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Address coordinates, specific collection times, or egg shell requirements..."
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method</label>
                    <div className="pay-methods">
                      <button
                        type="button"
                        className={`pay-option ${paymentMethod === 'on_pickup' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('on_pickup')}
                        aria-pressed={paymentMethod === 'on_pickup'}
                      >
                        <Wallet size={20} />
                        <span className="pay-option-text">
                          <strong>Pay on Pickup</strong>
                          <span>M-Pesa or Cash on collection</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`pay-option ${paymentMethod === 'paystack' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('paystack')}
                        aria-pressed={paymentMethod === 'paystack'}
                      >
                        <CreditCard size={20} />
                        <span className="pay-option-text">
                          <strong>Pay Now</strong>
                          <span>Card or M-Pesa via Paystack</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="btn btn-primary btn-full submit-booking-btn"
                    id="submit-booking-btn"
                  >
                    {submitting
                      ? paymentMethod === 'paystack'
                        ? 'Reserving & redirecting to payment...'
                        : 'Checking Stock & Booking...'
                      : paymentMethod === 'paystack'
                        ? 'Reserve & Pay Securely'
                        : 'Submit Reservation'}
                  </button>
                </form>
              </div>

              {/* Right Column: Invoice/Cart Summary */}
              <div className="checkout-summary-container">
                <div className="summary-box glass">
                  <h3>2. Order Summary</h3>
                  <div className="divider"></div>

                  <div className="summary-items">
                    {cart.map(item => (
                      <div key={item.product.id} className="summary-item">
                        <div className="item-main">
                          <span className="item-name">{item.product.name}</span>
                          <span className="item-desc">KES {item.product.price.toLocaleString()} per unit</span>
                        </div>
                        <div className="item-quantity-actions">
                          <div className="qty-selectors">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="qty-btn" aria-label="Decrease quantity">
                              <Minus size={12} />
                            </button>
                            <span className="qty-val">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="qty-btn" aria-label="Increase quantity">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} className="qty-delete" aria-label="Remove item">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="item-price">KES {(item.product.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="divider" style={{ margin: '1rem 0' }}></div>

                  <div className="cart-total-box glass">
                    <span>Estimated Total:</span>
                    <span className="total-amount">KES {getCartTotal().toLocaleString()}</span>
                  </div>

                  <p className="summary-disclaimer">
                    Prices are based on direct Nanyuki sourcing. Pay securely on pickup/delivery using M-Pesa or Cash.
                  </p>
                </div>

                {/* Stock Widget */}
                <div className="stock-widget-box glass">
                  <div className="stock-widget-header">
                    <TrendingUp className="stat-trend-icon" size={16} />
                    <h4>Nanyuki Farm Stock Availability</h4>
                  </div>
                  <p>Our real-time stock tracks daily harvests against reservations. Total eggs remaining for bookings today:</p>
                  <div className="stock-count">
                    <strong>{eggStats.available} Eggs</strong> ({eggStats.availableTrays} standard trays)
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />

      <style jsx>{`
        .checkout-title-block {
          margin-bottom: 3rem;
        }

        .checkout-title-block h1 {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .checkout-title-block p {
          color: var(--fg-muted);
          font-size: 1.05rem;
        }

        .empty-checkout {
          padding: 4rem 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-icon {
          color: var(--fg-muted);
          opacity: 0.5;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        /* Form styling */
        .checkout-form-container {
          padding: 2.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .checkout-form-container h3 {
          color: var(--primary-color);
          font-size: 1.35rem;
        }

        .divider {
          height: 1px;
          background-color: var(--border-color);
          width: 100%;
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .submit-booking-btn {
          height: 48px;
          font-size: 1.05rem;
        }

        /* Error alert */
        .error-alert {
          background-color: rgba(217, 4, 41, 0.08);
          border: 1px solid rgba(217, 4, 41, 0.15);
          border-radius: var(--radius-sm);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--error-color);
        }

        .alert-err-icon {
          flex-shrink: 0;
        }

        .error-text {
          font-size: 0.9rem;
          line-height: 1.4;
        }

        /* Summary Panel */
        .summary-box {
          padding: 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .summary-box h3 {
          color: var(--primary-color);
          font-size: 1.25rem;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .summary-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          align-items: center;
          gap: 1rem;
          font-size: 0.95rem;
        }

        .item-name {
          font-weight: 700;
          color: var(--primary-color);
          display: block;
        }

        .item-desc {
          font-size: 0.8rem;
          color: var(--fg-muted);
        }

        .item-price {
          font-weight: 700;
          color: var(--fg-color);
          text-align: right;
        }

        .item-quantity-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .qty-selectors {
          display: flex;
          align-items: center;
          background-color: rgba(var(--primary-rgb), 0.05);
          border-radius: var(--radius-sm);
          padding: 0.15rem;
        }

        .qty-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .qty-val {
          width: 20px;
          text-align: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .qty-delete {
          background: transparent;
          border: none;
          color: var(--fg-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color var(--transition-fast);
        }

        .qty-delete:hover {
          color: var(--error-color);
        }

        .cart-total-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        .total-amount {
          font-size: 1.35rem;
          color: var(--accent-dark);
          font-family: var(--font-display);
          font-weight: 800;
        }

        .summary-disclaimer {
          font-size: 0.8rem;
          color: var(--fg-muted);
          line-height: 1.4;
          font-style: italic;
        }

        /* Stock Widget */
        .stock-widget-box {
          padding: 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .stock-widget-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
        }

        .stock-widget-header h4 {
          font-family: var(--font-display);
          font-weight: 700;
        }

        .stat-trend-icon {
          color: var(--primary-color);
        }

        .stock-count {
          font-size: 1.1rem;
          color: var(--primary-color);
          background-color: rgba(var(--primary-rgb), 0.05);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }

        .pay-methods {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .pay-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
          padding: 0.9rem 1rem;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--border-color-solid);
          background: var(--glass-bg);
          color: var(--fg-color);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .pay-option:hover {
          border-color: rgba(var(--primary-rgb), 0.4);
        }
        .pay-option.active {
          border-color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.06);
          box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12);
        }
        .pay-option :global(svg) {
          color: var(--primary-color);
          flex-shrink: 0;
        }
        .pay-option-text {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }
        .pay-option-text strong {
          font-family: var(--font-display);
          color: var(--primary-color);
          font-size: 0.95rem;
        }
        .pay-option-text span {
          font-size: 0.78rem;
          color: var(--fg-muted);
        }

        @media (max-width: 992px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .checkout-form-container {
            padding: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .checkout-title-block h1 {
            font-size: 2rem;
          }
          .checkout-title-block {
            margin-bottom: 2rem;
          }
          .summary-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }
          .item-price {
            text-align: left;
          }
          .summary-box {
            padding: 1.5rem;
          }
          .stock-widget-box {
            padding: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .pay-methods { grid-template-columns: 1fr; }
          .checkout-title-block h1 {
            font-size: 1.6rem;
          }
          .checkout-form-container {
            padding: 1.25rem;
          }
          .checkout-form-container h3 {
            font-size: 1.15rem;
          }
          .summary-box h3 {
            font-size: 1.1rem;
          }
          .total-amount {
            font-size: 1.15rem;
          }
        }
      `}</style>
    </div>
  );
}
