'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Check, X, Calendar, User, Phone, Mail, FileText, AlertTriangle, Truck, Store, MapPin, Download } from 'lucide-react';
import { Order, Product } from '@/lib/db';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered' | 'canceled'>('all');
  const [filterFulfillment, setFilterFulfillment] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const todayStr = new Date().toLocaleDateString('en-CA');

  const toTel = (phone: string) => `tel:${(phone || '').replace(/\s+/g, '')}`;
  const toWaLink = (phone: string) => {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '254' + digits.slice(1);
    else if (digits.length === 9 && digits.startsWith('7')) digits = '254' + digits;
    return `https://wa.me/${digits}`;
  };
  const mapsLink = (order: Order) => {
    if (typeof order.deliveryLat === 'number' && typeof order.deliveryLng === 'number') {
      return `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || 'Nanyuki, Kenya')}`;
  };

  // Manual Reservation Form State
  const [showManualForm, setShowManualForm] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('prod_eggs');
  const [quantity, setQuantity] = useState<number>(1);
  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');
  const [manualFulfillment, setManualFulfillment] = useState<'delivery' | 'pickup'>('pickup');
  const [manualAddress, setManualAddress] = useState('');
  const [adminBypass, setAdminBypass] = useState(true); // Default to true for admin logs
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordRes = await fetch('/api/orders');
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
      } else {
        setError('Failed to fetch reservations.');
      }

      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      setError('Network error loading reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: Order['status']) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update order status.');
      }
    } catch (err) {
      alert('Network error. Failed to update status.');
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      setFormError('Select a valid product.');
      setSubmitting(false);
      return;
    }

    const orderItems = [{
      productId: product.id,
      name: product.name,
      quantity: quantity,
      price: product.price
    }];

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: custName,
          customerEmail: custEmail || `${custName.toLowerCase().replace(/\s+/g, '')}@manual.farm`, // Auto email if blank
          customerPhone: custPhone,
          items: orderItems,
          pickupDate,
          notes: notes ? `${notes} (Manual Log)` : 'Manual Logged Order',
          fulfillmentType: manualFulfillment,
          deliveryAddress: manualAddress,
          adminBypass
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Reset form
        setCustName('');
        setCustEmail('');
        setCustPhone('');
        setQuantity(1);
        setPickupDate('');
        setNotes('');
        setManualAddress('');
        setManualFulfillment('pickup');
        setShowManualForm(false);
        
        // Refresh orders
        loadData();
      } else {
        setFormError(data.error || 'Failed to create reservation.');
      }
    } catch (err) {
      setFormError('Network error. Failed to save reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinPickupDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Filter and Search logic
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesFulfillment = filterFulfillment === 'all' || order.fulfillmentType === filterFulfillment;
    
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch = !term || 
      order.customerName.toLowerCase().includes(term) ||
      order.customerPhone.includes(term) ||
      order.customerEmail.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term);

    const matchesToday = !dueTodayOnly || order.pickupDate === todayStr;

    return matchesStatus && matchesFulfillment && matchesSearch && matchesToday;
  });

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No reservations found to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Customer Name',
      'Email',
      'Phone',
      'Fulfillment Type',
      'Fulfillment Date',
      'Delivery Address',
      'Items',
      'Total Price (KES)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status',
      'Date Placed'
    ];

    const rows = filteredOrders.map(order => [
      order.id,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.fulfillmentType || 'pickup',
      order.pickupDate,
      (order.deliveryAddress || '').replace(/"/g, '""'),
      order.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
      order.totalPrice,
      order.paymentMethod || 'on_pickup',
      order.paymentStatus || 'unpaid',
      order.status,
      order.orderDate
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val === null || val === undefined ? '' : val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tabby_eggs_reservations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'status-delivered';
      case 'canceled': return 'status-canceled';
      default: return 'status-pending';
    }
  };

  return (
    <div className="orders-page-wrapper">
      
      {/* Header controls row */}
      <div className="controls-row">
        <div className="search-filters glass">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by Name, Phone, Email, ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar"
              id="admin-order-search"
            />
          </div>

          <div className="status-selector">
            {(['all', 'pending', 'delivered', 'canceled'] as const).map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`status-filter-btn ${filterStatus === status ? 'active' : ''}`}
              >
                {status}
              </button>
            ))}
            <button
              onClick={() => setDueTodayOnly(v => !v)}
              className={`status-filter-btn today-toggle ${dueTodayOnly ? 'active' : ''}`}
            >
              Due Today
            </button>
          </div>

          <div className="status-selector" style={{ borderLeft: '1px solid var(--border-color-solid)', paddingLeft: '0.75rem' }}>
            {(['all', 'delivery', 'pickup'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setFilterFulfillment(type)}
                className={`status-filter-btn ${filterFulfillment === type ? 'active' : ''}`}
              >
                {type === 'all' ? 'All Types' : type === 'delivery' ? '🚚 Deliveries' : '🏢 Depot Pickups'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleExportCSV} 
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={() => setShowManualForm(!showManualForm)} 
            className="btn btn-primary add-reservation-btn"
            id="add-manual-order-btn"
          >
            <Plus size={16} /> Log Manual Reservation
          </button>
        </div>
      </div>

      {/* Manual order form card */}
      {showManualForm && (
        <div className="manual-form-card glass">
          <div className="card-header">
            <h3>Log Phone / Text Reservation</h3>
            <button onClick={() => setShowManualForm(false)} className="close-btn" aria-label="Close form">✕</button>
          </div>

          {formError && (
            <div className="error-alert">
              <AlertTriangle size={16} />
              <p>{formError}</p>
            </div>
          )}

          <form onSubmit={handleCreateManualOrder} className="manual-order-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manualCustName">Customer Name *</label>
                <input 
                  type="text" 
                  id="manualCustName"
                  required
                  placeholder="e.g. Grandma Jenkins"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="manualCustPhone">Phone Number *</label>
                <input 
                  type="tel" 
                  id="manualCustPhone"
                  required
                  placeholder="e.g. 555-0200"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manualCustEmail">Email Address (Optional)</label>
                <input 
                  type="email" 
                  id="manualCustEmail"
                  placeholder="e.g. name@example.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="manualPickupDate">Pickup Date *</label>
                <input 
                  type="date" 
                  id="manualPickupDate"
                  required
                  min={getMinPickupDate()}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manualProduct">Select Product</label>
                <select 
                  id="manualProduct"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setQuantity(1); // Reset qty
                  }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (KES {p.price.toLocaleString()} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="manualQty">Quantity Ordered</label>
                <input 
                  type="number" 
                  id="manualQty"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="manualFulfillment">Fulfillment</label>
                <select
                  id="manualFulfillment"
                  value={manualFulfillment}
                  onChange={(e) => setManualFulfillment(e.target.value as 'delivery' | 'pickup')}
                >
                  <option value="pickup">Pickup at depot</option>
                  <option value="delivery">Delivery (within Nanyuki)</option>
                </select>
              </div>
              {manualFulfillment === 'delivery' && (
                <div className="form-group">
                  <label htmlFor="manualAddress">Delivery Address *</label>
                  <input
                    type="text"
                    id="manualAddress"
                    required={manualFulfillment === 'delivery'}
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="e.g. Estate, house number or landmark"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="manualNotes">Notes</label>
              <textarea 
                id="manualNotes"
                placeholder="e.g. Ordered over phone. Prefers large eggs. Wants to pick up in afternoon."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-row items-center mt-2">
              <div className="bypass-checkbox">
                <input 
                  type="checkbox" 
                  id="adminBypass"
                  checked={adminBypass}
                  onChange={(e) => setAdminBypass(e.target.checked)}
                />
                <label htmlFor="adminBypass">
                  Override stock limitations (Force bypass warning)
                </label>
              </div>
              
              <div className="form-actions-right">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Registering...' : 'Save Reservation'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Result count */}
      {!loading && !error && (
        <p className="result-count">
          {filteredOrders.length} reservation{filteredOrders.length === 1 ? '' : 's'}
          {dueTodayOnly ? ' due today' : ''}
          {filterStatus !== 'all' ? ` · ${filterStatus}` : ''}
        </p>
      )}

      {/* Reservations list */}
      {loading ? (
        <div className="list-loading glass text-center">
          <div className="spinner"></div>
          <p className="mt-2 text-muted">Retrieving commitments...</p>
        </div>
      ) : error ? (
        <div className="error-box">
          <AlertTriangle size={18} />
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-orders glass text-center">
          <ShoppingBag size={40} className="empty-icon" />
          <h3>No Reservations Found</h3>
          <p>No commitments match your current search/filter combination.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className={`order-item-card glass ${order.pickupDate === todayStr && order.status === 'pending' ? 'due-today' : ''}`}>
              
              {/* Order Card Header */}
              <div className="order-header">
                <div className="left-info">
                  <span className="order-date">Date: {new Date(order.orderDate).toLocaleDateString()}</span>
                  <h4 className="order-id">{order.id}</h4>
                </div>

                <div className="right-badge">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status === 'delivered' 
                      ? (order.fulfillmentType === 'pickup' ? 'collected' : 'delivered') 
                      : order.status}
                  </span>
                  <span className={`status-badge fulfillment-tag ${order.fulfillmentType === 'delivery' ? 'is-delivery' : 'is-pickup'}`}>
                    {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                  </span>
                  {order.paymentStatus === 'paid' && (
                    <span className="status-badge paid-tag">Paid</span>
                  )}
                  {order.pickupDate === todayStr && order.status === 'pending' && (
                    <span className="status-badge today-tag">Due Today</span>
                  )}
                </div>
              </div>

              {/* Order Card Body */}
              <div className="order-body">
                <div className="customer-info-box">
                  <h5>Customer Contact</h5>
                  <p><User size={14} className="icon" /> {order.customerName}</p>
                  <p className="contact-line">
                    <Phone size={14} className="icon" /> {order.customerPhone}
                    <a href={toTel(order.customerPhone)} className="mini-contact" title="Call">Call</a>
                    <a href={toWaLink(order.customerPhone)} target="_blank" rel="noopener noreferrer" className="mini-contact wa" title="WhatsApp">WhatsApp</a>
                  </p>
                  <p><Mail size={14} className="icon" /> {order.customerEmail}</p>
                  <p>
                    {order.fulfillmentType === 'delivery'
                      ? <Truck size={14} className="icon" />
                      : <Store size={14} className="icon" />}
                    {order.fulfillmentType === 'delivery' ? 'Delivery within Nanyuki' : 'Pickup at depot'}
                  </p>
                  {order.fulfillmentType === 'delivery' && (
                    <p className="contact-line">
                      <MapPin size={14} className="icon" />{' '}
                      <a href={mapsLink(order)} target="_blank" rel="noopener noreferrer" className="address-link" title="Open directions in Google Maps">
                        {order.deliveryAddress || 'No address provided'}
                      </a>
                      <a href={mapsLink(order)} target="_blank" rel="noopener noreferrer" className="mini-contact maps" title="Open directions in Google Maps">Directions</a>
                    </p>
                  )}
                  <p className="pickup-date-text"><Calendar size={14} className="icon text-accent" /> <strong>{order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Date: {order.pickupDate}</strong></p>
                  {order.notes && (
                    <div className="notes-box">
                      <FileText size={14} className="notes-icon" />
                      <span>"{order.notes}"</span>
                    </div>
                  )}
                </div>

                <div className="items-price-box">
                  <h5>Reserved Items</h5>
                  <div className="items-table">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="table-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">Qty: {item.quantity}</span>
                        <span className="item-total">KES {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="table-total-row">
                      <span>Total Price:</span>
                      <span className="total-amount">KES {order.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="card-actions">
                    <a
                      href={`/api/orders/invoice?id=${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-action invoice"
                      style={{ textDecoration: 'none' }}
                    >
                      <Download size={14} /> Download Invoice
                    </a>

                    {order.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="btn btn-action fulfill"
                          style={{ marginLeft: 'auto' }}
                        >
                          <Check size={14} /> {order.fulfillmentType === 'pickup' ? 'Collect & Paid' : 'Deliver & Paid'}
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'canceled')}
                          className="btn btn-action cancel"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .orders-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .search-filters {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          flex-grow: 1;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background-color: var(--bg-card-solid);
          border: 1px solid var(--border-color-solid);
          border-radius: 4px;
          padding: 0.4rem 0.75rem;
          flex-grow: 1;
          gap: 0.5rem;
        }

        .search-icon {
          color: var(--fg-muted);
        }

        .search-bar {
          border: none;
          background: transparent;
          width: 100%;
          color: var(--fg-color);
          font-size: 0.9rem;
        }

        .search-bar:focus {
          outline: none;
        }

        .status-selector {
          display: flex;
          gap: 0.5rem;
        }

        .status-filter-btn {
          background: transparent;
          border: none;
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 4px;
          text-transform: uppercase;
          color: var(--fg-muted);
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .status-filter-btn:hover {
          color: var(--primary-color);
        }

        .status-filter-btn.active {
          background-color: rgba(var(--primary-rgb), 0.08);
          color: var(--primary-color);
        }

        /* Manual Form styling */
        .manual-form-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          animation: slideDown 0.25s ease-out;
        }

        .manual-form-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
          color: var(--primary-color);
        }

        .close-btn {
          background: transparent;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--fg-muted);
        }

        .close-btn:hover {
          color: var(--error-color);
        }

        .manual-order-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .bypass-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--fg-muted);
          font-weight: 600;
        }

        .bypass-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .items-center {
          align-items: center;
        }

        /* Error/Alert box */
        .error-alert {
          display: flex;
          gap: 0.5rem;
          background-color: rgba(217, 4, 41, 0.08);
          border: 1px solid rgba(217, 4, 41, 0.2);
          border-radius: 4px;
          padding: 0.5rem 1rem;
          color: var(--error-color);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        /* Orders listings */
        .list-loading {
          padding: 4rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-color-solid);
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .empty-orders {
          padding: 4rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          color: var(--fg-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .empty-icon {
          opacity: 0.5;
        }

        .empty-orders h3 {
          color: var(--primary-color);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .order-item-card {
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          overflow: hidden;
        }

        .order-item-card .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background-color: rgba(var(--primary-rgb), 0.01);
          border-bottom: 1px solid var(--border-color);
        }

        .order-date {
          font-size: 0.75rem;
          color: var(--fg-muted);
          font-weight: 500;
        }

        .order-header .order-id {
          font-family: monospace;
          color: var(--primary-color);
          font-size: 1.05rem;
          font-weight: 700;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .status-pending {
          background-color: rgba(233, 196, 106, 0.15);
          color: var(--gold-light);
        }

        .status-delivered {
          background-color: rgba(64, 145, 108, 0.15);
          color: var(--success-color);
        }

        .status-canceled {
          background-color: rgba(217, 4, 41, 0.15);
          color: var(--error-color);
        }

        .order-body {
          padding: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 2rem;
        }

        .customer-info-box h5,
        .items-price-box h5 {
          font-family: var(--font-display);
          color: var(--primary-color);
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 0.25rem;
        }

        .customer-info-box p {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .customer-info-box .icon {
          color: var(--fg-muted);
        }

        .pickup-date-text {
          font-weight: 600;
        }

        .text-accent {
          color: var(--accent-dark) !important;
        }

        .notes-box {
          margin-top: 1rem;
          background-color: rgba(var(--accent-rgb), 0.04);
          border-left: 2px solid var(--accent-color);
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          color: var(--fg-color);
        }

        .notes-icon {
          color: var(--accent-dark);
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .items-table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .items-table .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          font-size: 0.85rem;
          color: var(--fg-color);
        }

        .item-name {
          font-weight: 600;
        }

        .item-qty {
          color: var(--fg-muted);
          text-align: right;
          padding-right: 1rem;
        }

        .item-total {
          text-align: right;
          font-weight: 600;
        }

        .items-table .table-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color-solid);
          font-weight: bold;
          font-size: 0.95rem;
        }

        .items-table .total-amount {
          color: var(--accent-dark);
          font-size: 1.1rem;
        }

        .card-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          border-top: 1px solid var(--border-color-solid);
          padding-top: 1rem;
        }

        .btn-action {
          padding: 0.45rem 1rem;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 4px;
          font-family: var(--font-display);
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .btn-action.fulfill {
          background-color: var(--success-color);
          color: #ffffff;
        }

        .btn-action.fulfill:hover {
          background-color: var(--primary-light);
        }

        .btn-action.cancel {
          background-color: var(--border-color-solid);
          color: var(--fg-muted);
          border: 1px solid var(--border-color);
        }

        .btn-action.cancel:hover {
          background-color: var(--error-color);
          color: #ffffff;
          border-color: var(--error-color);
        }

        .btn-action.invoice {
          background-color: var(--bg-card-solid);
          color: var(--fg-color);
          border: 1px solid var(--border-color);
        }

        .btn-action.invoice:hover {
          background-color: rgba(var(--primary-rgb), 0.08);
          border-color: var(--primary-color);
        }

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .right-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
        }
        .fulfillment-tag.is-delivery { background-color: rgba(var(--accent-rgb), 0.15); color: var(--accent-dark); }
        .fulfillment-tag.is-pickup { background-color: rgba(var(--primary-rgb), 0.1); color: var(--primary-color); }
        .paid-tag { background-color: rgba(64,145,108,0.15); color: var(--success-color); }
        .today-tag { background-color: var(--accent-dark); color: #fff; }
        .due-today { border-color: var(--accent-dark); box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2); }
        .today-toggle.active { background-color: var(--accent-dark); color: #fff; }
        .result-count {
          font-size: 0.85rem;
          color: var(--fg-muted);
          font-weight: 600;
          margin-top: -0.5rem;
        }
        .contact-line {
          flex-wrap: wrap;
        }
        .mini-contact {
          font-size: 0.72rem;
          font-weight: 700;
          font-family: var(--font-display);
          padding: 0.1rem 0.5rem;
          border-radius: var(--radius-full);
          background: rgba(var(--primary-rgb), 0.08);
          color: var(--primary-color);
          margin-left: 0.25rem;
        }
        .mini-contact:hover { background: var(--primary-color); color: #fff; }
        .mini-contact.wa { background: rgba(37,211,102,0.14); color: #1aa44e; }
        .mini-contact.wa:hover { background: #25d366; color: #fff; }
        .mini-contact.maps { background: rgba(var(--accent-rgb),0.14); color: var(--accent-dark); }
        .mini-contact.maps:hover { background: var(--accent-dark); color: #fff; }
        .address-link {
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: underline;
          text-decoration-color: rgba(var(--primary-rgb), 0.35);
          text-underline-offset: 2px;
          cursor: pointer;
        }
        .address-link:hover { color: var(--accent-dark); text-decoration-color: var(--accent-dark); }

        @media (max-width: 768px) {
          .order-body {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .controls-row {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .search-filters {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            padding: 0.75rem;
          }
          .status-selector {
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 0.35rem;
          }
          .status-filter-btn {
            flex-grow: 1;
            text-align: center;
            padding: 0.45rem 0.5rem;
            font-size: 0.75rem;
          }
          .add-reservation-btn {
            width: 100%;
          }
        }

        @media (max-width: 576px) {
          .order-item-card .order-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1rem;
          }
          .right-badge {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            align-self: stretch;
            justify-content: flex-start;
            gap: 0.35rem;
          }
          .order-body {
            padding: 1rem;
          }
          .manual-form-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
