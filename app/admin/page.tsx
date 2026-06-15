'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Egg, 
  ShoppingBag, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Check, 
  X, 
  ChevronRight, 
  Clock 
} from 'lucide-react';
import { Truck, Store, Phone, MessageCircle, MapPin, CalendarCheck } from 'lucide-react';
import { Order } from '@/lib/db';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState<number>(5);

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 0;
    setAlertThreshold(val);
    localStorage.setItem('low_stock_threshold', val.toString());
  };

  const handleResetDatabase = async (clearProducts: boolean) => {
    const confirmMsg = clearProducts
      ? "WARNING: This will delete ALL orders, inventory logs, AND all catalog products (catalog will be completely empty). Are you absolutely sure?"
      : "Are you sure you want to clean the entire database? This will clear all orders and inventory logs, resetting the admin dashboard stats to 0, but preserving the default egg tray catalog items.";
    
    if (!confirm(confirmMsg)) return;

    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearProducts })
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Database clean completed! Local: success. MongoDB: ${result.mongoReset}`);
        loadDashboardData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to reset database: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Network error. Failed to execute database reset.');
    } finally {
      setResetting(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to fetch dashboard data.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const savedThreshold = localStorage.getItem('low_stock_threshold');
    if (savedThreshold) {
      setAlertThreshold(parseInt(savedThreshold, 10));
    }
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status })
      });
      if (res.ok) {
        // Refresh dashboard data
        loadDashboardData();
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard metrics...</p>
        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            color: var(--primary-color);
            gap: 1rem;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color-solid);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="error-card glass">
        <AlertTriangle size={24} />
        <p>{error || 'An unexpected error occurred.'}</p>
        <button onClick={loadDashboardData} className="btn btn-primary">Retry</button>
      </div>
    );
  }

  const {
    eggStock,
    pendingOrdersCount,
    totalPendingRevenue,
    totalDeliveredRevenue,
    recentOrders,
    collectionTrend,
    scheduleToday = [],
    deliveriesTodayCount = 0,
    pickupsTodayCount = 0,
    lowStock = false,
  } = stats;

  const showLowStockAlert = eggStock && !eggStock.isOverbooked && eggStock.availableTrays <= alertThreshold;

  // Max value for bar chart calculation
  const maxCollectionCount = collectionTrend.length > 0 
    ? Math.max(...collectionTrend.map((t: any) => t.count), 100) 
    : 100;

  return (
    <div className="dashboard-wrapper">
      
      {/* Stock Overbooked Alert */}
      {eggStock.isOverbooked && (
        <div className="alert-card glass animate-pulse">
          <div className="alert-header">
            <AlertTriangle className="alert-icon" size={24} />
            <div>
              <h3>Overbooked Warning</h3>
              <p>
                You have promised <strong>{eggStock.totalPromisedTrays} Trays</strong>, but only have <strong>{eggStock.totalCollectedTrays} Trays</strong> in stock!
              </p>
            </div>
          </div>
          <div className="alert-body">
            <p>
              Net stock balance is <strong>{eggStock.availableTrays} Trays</strong> ({eggStock.available} eggs). Please log egg collections or contact pending customers scheduled for upcoming dates.
            </p>
            <div className="alert-actions">
              <Link href="/admin/inventory" className="btn-alert-action">Log Collection</Link>
              <Link href="/admin/orders" className="btn-alert-action secondary">Manage Reservations</Link>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warning */}
      {showLowStockAlert && (
        <div className="alert-card warn glass">
          <div className="alert-header">
            <AlertTriangle className="alert-icon warn-icon" size={24} />
            <div>
              <h3>Running Low on Eggs</h3>
              <p>
                Only <strong>{eggStock.availableTrays} trays</strong> ({eggStock.available} eggs) remain for new bookings. Consider logging a fresh collection soon.
              </p>
            </div>
          </div>
          <div className="alert-actions">
            <Link href="/admin/inventory" className="btn-alert-action warn-btn">Log Collection</Link>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {/* Main Egg stock card */}
        <div className={`stat-card glass ${eggStock.isOverbooked ? 'card-danger' : 'card-success'}`}>
          <div className="card-top">
            <div>
              <span className="stat-label">Net Available Eggs</span>
              <h2 className="stat-value">{eggStock.availableTrays} Trays</h2>
              <span className="stat-sub">{eggStock.available} individual eggs</span>

              <div className="threshold-ctrl" onClick={(e) => e.stopPropagation()}>
                <label htmlFor="threshold-input">Alert under:</label>
                <input 
                  id="threshold-input"
                  type="number" 
                  min="0"
                  max="100"
                  value={alertThreshold} 
                  onChange={handleThresholdChange}
                  className="threshold-field"
                />
                <span>trays</span>
              </div>
            </div>
            <div className="stat-icon-wrapper">
              <Egg size={24} />
            </div>
          </div>
          <div className="card-bottom-info">
            <span>Collected: {eggStock.totalCollectedTrays} trays</span>
            <span className="divider-dot">•</span>
            <span>Promised: {eggStock.totalPromisedTrays} trays</span>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="stat-card glass">
          <div className="card-top">
            <div>
              <span className="stat-label">Active Promises</span>
              <h2 className="stat-value">{pendingOrdersCount} Order{pendingOrdersCount !== 1 ? 's' : ''}</h2>
              <span className="stat-sub">Awaiting pickup</span>
            </div>
            <div className="stat-icon-wrapper icon-accent">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="card-bottom-info">
            <Link href="/admin/orders" className="card-link">
              View promises list <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Projected Revenue Card */}
        <div className="stat-card glass">
          <div className="card-top">
            <div>
              <span className="stat-label">Projected Earnings</span>
              <h2 className="stat-value">KES {totalPendingRevenue.toLocaleString()}</h2>
              <span className="stat-sub">From active reservations</span>
            </div>
            <div className="stat-icon-wrapper icon-gold">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="card-bottom-info">
            <span>Completed Earnings: KES {totalDeliveredRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="grid-card glass today-card">
        <div className="card-header-row">
          <div>
            <h3><CalendarCheck size={18} className="inline-icon" />Today&apos;s Schedule</h3>
            <span className="card-header-sub">
              {scheduleToday.length === 0
                ? 'Nothing scheduled for today'
                : `${deliveriesTodayCount} deliver${deliveriesTodayCount === 1 ? 'y' : 'ies'} \u00b7 ${pickupsTodayCount} pickup${pickupsTodayCount === 1 ? '' : 's'} due today`}
            </span>
          </div>
          <Link href="/admin/orders" className="header-link">All Orders</Link>
        </div>

        {scheduleToday.length === 0 ? (
          <p className="empty-list-text">No deliveries or pickups are scheduled for today. Enjoy the calm.</p>
        ) : (
          <div className="schedule-list">
            {scheduleToday.map((order: Order) => (
              <div key={order.id} className="schedule-row">
                <div className="sched-left">
                  <span className={`type-chip ${order.fulfillmentType === 'delivery' ? 'is-delivery' : 'is-pickup'}`}>
                    {order.fulfillmentType === 'delivery'
                      ? <><Truck size={13} /> Deliver</>
                      : <><Store size={13} /> Pickup</>}
                  </span>
                  <div className="sched-info">
                    <strong>{order.customerName}</strong>
                    <span className="sched-items">
                      {order.items.map(i => `${i.quantity} x ${i.name}`).join(', ')}
                    </span>
                    {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
                      <a href={mapsLink(order)} target="_blank" rel="noopener noreferrer" className="sched-address" title="Open directions in Google Maps">
                        <MapPin size={12} /> {order.deliveryAddress}
                      </a>
                    )}
                    <span>
                      {order.paymentStatus === 'paid'
                        ? <span className="pay-tag paid">Paid online</span>
                        : <span className="pay-tag unpaid">Collect payment</span>}
                    </span>
                  </div>
                </div>
                <div className="sched-actions">
                  <a href={toTel(order.customerPhone)} className="contact-btn call" title={`Call ${order.customerPhone}`} aria-label="Call customer"><Phone size={14} /></a>
                  <a href={toWaLink(order.customerPhone)} target="_blank" rel="noopener noreferrer" className="contact-btn wa" title="WhatsApp customer" aria-label="WhatsApp customer"><MessageCircle size={14} /></a>
                  {order.fulfillmentType === 'delivery' && (
                    <a href={mapsLink(order)} target="_blank" rel="noopener noreferrer" className="contact-btn maps" title="Open in Google Maps" aria-label="Directions"><MapPin size={14} /></a>
                  )}
                  <button 
                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')} 
                    className="action-btn fulfill-btn" 
                    title={order.fulfillmentType === 'pickup' ? "Mark as Collected" : "Mark as Delivered"}
                  >
                    <Check size={14} /> {order.fulfillmentType === 'pickup' ? "Collect" : "Deliver"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Trends & Lists */}
      <div className="dashboard-grid">
        
        {/* Chart Column */}
        <div className="grid-card glass">
          <div className="card-header">
            <h3>7-Day Egg Collection Trend</h3>
            <span className="card-header-sub">Daily individual egg harvest</span>
          </div>
          
          {collectionTrend.length === 0 ? (
            <div className="empty-chart-box">
              <p>No historical inventory logs recorded in the last 7 days.</p>
              <Link href="/admin/inventory" className="btn btn-secondary mt-2">Log Collection</Link>
            </div>
          ) : (
            <div className="chart-container" style={{ marginBottom: '1rem' }}>
              <div className="chart-y-axis">
                <span>{maxCollectionCount}</span>
                <span>{Math.floor(maxCollectionCount / 2)}</span>
                <span>0</span>
              </div>
              <div className="chart-bars">
                {collectionTrend.map((t: any, idx: number) => {
                  const percent = (t.count / maxCollectionCount) * 100;
                  const dateStr = new Date(t.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
                  return (
                    <div key={idx} className="chart-bar-column">
                      <div className="chart-bar-wrapper">
                        <div 
                          className="chart-bar-fill" 
                          style={{ height: `${percent}%` }}
                          title={`${t.count} eggs collected`}
                        >
                          <span className="bar-tooltip">{t.count}</span>
                        </div>
                      </div>
                      <span className="chart-bar-label">{dateStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fulfillment Share Analytics */}
          <div className="fulfillment-share-card-section">
            <div className="sub-header" style={{ marginBottom: '0.85rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-color)' }}>Fulfillment Method Share</h4>
              <span className="card-header-sub" style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>Distribution across active orders</span>
            </div>
            {(!stats.totalDeliveries && !stats.totalPickups) ? (
              <p className="empty-sub-text">No active fulfillment data yet.</p>
            ) : (() => {
              const activeCount = (stats.totalDeliveries || 0) + (stats.totalPickups || 0);
              if (activeCount === 0) return <p className="empty-sub-text">No active fulfillment data yet.</p>;
              const delPercent = Math.round(((stats.totalDeliveries || 0) / activeCount) * 100);
              const pickPercent = 100 - delPercent;
              return (
                <div className="fulfillment-share-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="progress-bar-container" style={{ display: 'flex', height: '22px', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--border-color-solid)' }}>
                    {delPercent > 0 && (
                      <div 
                        className="progress-fill delivery-fill" 
                        style={{ width: `${delPercent}%`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' }}
                        title={`Delivery: ${stats.totalDeliveries} orders (${delPercent}%)`}
                      >
                        {delPercent >= 15 && <span className="fill-label">{delPercent}%</span>}
                      </div>
                    )}
                    {pickPercent > 0 && (
                      <div 
                        className="progress-fill pickup-fill" 
                        style={{ width: `${pickPercent}%`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' }}
                        title={`Pickup: ${stats.totalPickups} orders (${pickPercent}%)`}
                      >
                        {pickPercent >= 15 && <span className="fill-label">{pickPercent}%</span>}
                      </div>
                    )}
                  </div>
                  <div className="share-legend" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <span className="legend-dot delivery-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                      <span>Delivery (Nanyuki): <strong>{stats.totalDeliveries || 0}</strong> ({delPercent}%)</span>
                    </div>
                    <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <span className="legend-dot pickup-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                      <span>Pickup (Depot): <strong>{stats.totalPickups || 0}</strong> ({pickPercent}%)</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Actionable Orders Column */}
        <div className="grid-card glass">
          <div className="card-header-row">
            <div>
              <h3>Recent Reservation Actions</h3>
              <span className="card-header-sub">Manage client pickup commitments</span>
            </div>
            <Link href="/admin/orders" className="header-link">View All</Link>
          </div>

          <div className="recent-orders-list">
            {recentOrders.length === 0 ? (
              <p className="empty-list-text">No reservations registered yet.</p>
            ) : (
              recentOrders.map((order: Order) => (
                <div key={order.id} className="recent-order-row">
                  <div className="row-main">
                    <div className="order-profile-badge">
                      {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="order-details">
                      <strong>{order.customerName}</strong>
                      <span className="order-summary">
                        {order.items.map(i => `${i.quantity} x ${i.name.includes('Tray') ? (i.name.includes('30') ? '30-egg tray' : '60-egg tray') : i.name}`).join(', ')}
                      </span>
                      <span className="row-badges">
                        <span className={`mini-badge ${order.fulfillmentType === 'delivery' ? 'mb-delivery' : 'mb-pickup'}`}>
                          {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                        </span>
                        {order.paymentStatus === 'paid' && <span className="mini-badge mb-paid">Paid</span>}
                      </span>
                      <span className="pickup-date">
                        <Clock size={12} /> Pickup: {order.pickupDate}
                      </span>
                    </div>
                  </div>

                  <div className="row-actions">
                    {order.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="action-btn fulfill-btn" 
                          title={order.fulfillmentType === 'pickup' ? "Mark as Collected & Paid" : "Mark as Delivered & Paid"}
                        >
                          <Check size={14} /> {order.fulfillmentType === 'pickup' ? "Collect" : "Deliver"}
                        </button>
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'canceled')}
                          className="action-btn cancel-btn" 
                          title="Cancel Reservation"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <span className={`status-pill ${order.status}`}>
                        {order.status === 'delivered' 
                          ? (order.fulfillmentType === 'pickup' ? 'collected' : 'delivered') 
                          : order.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="grid-card glass danger-zone-card">
        <div className="card-header-row danger-header-row">
          <div>
            <h3 className="danger-title"><AlertTriangle size={18} className="inline-icon" /> Danger Zone</h3>
            <span className="card-header-sub">Administrative system reset tools</span>
          </div>
        </div>
        <div className="danger-actions">
          <div className="danger-action-item">
            <div className="danger-action-info">
              <strong>Clean Orders & Inventory (Default Products Preserved)</strong>
              <p>Clears all order records, active commitments, and inventory collection logs back to 0. Keeps default products in the shop catalog.</p>
            </div>
            <button 
              onClick={() => handleResetDatabase(false)} 
              disabled={resetting} 
              className="btn btn-danger"
            >
              {resetting ? 'Cleaning...' : 'Clean Database'}
            </button>
          </div>
          <div className="danger-action-item border-top-danger">
            <div className="danger-action-info">
              <strong>Clean Entire Database (Absolute Zero)</strong>
              <p>Wipes out all collections completely: orders, inventory logs, AND all catalog products. The dashboard and shop will read absolute 0.</p>
            </div>
            <button 
              onClick={() => handleResetDatabase(true)} 
              disabled={resetting} 
              className="btn btn-danger-heavy"
            >
              {resetting ? 'Wiping...' : 'Wipe Everything'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Alert Warning Box */
        .alert-card {
          border: 1px solid rgba(217, 4, 41, 0.2);
          border-left: 5px solid var(--error-color);
          background-color: rgba(217, 4, 41, 0.04);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .alert-icon {
          color: var(--error-color);
        }

        .alert-header h3 {
          color: var(--error-color);
          font-size: 1.15rem;
        }

        .alert-header p {
          font-size: 0.95rem;
          color: var(--fg-color);
          margin-top: 0.15rem;
        }

        .alert-body {
          font-size: 0.9rem;
          color: var(--fg-muted);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .alert-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-alert-action {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          font-family: var(--font-display);
          background-color: var(--error-color);
          color: #ffffff;
          border: none;
          cursor: pointer;
        }

        .btn-alert-action.secondary {
          background-color: var(--border-color-solid);
          color: var(--fg-color);
          border: 1px solid var(--border-color);
        }

        .animate-pulse {
          animation: pulse 2.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(217, 4, 41, 0.1); }
          50% { box-shadow: 0 0 16px 4px rgba(217, 4, 41, 0.15); }
          100% { box-shadow: 0 0 0 0 rgba(217, 4, 41, 0.1); }
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 150px;
          height: auto;
        }

        /* Threshold Alert config styling */
        .threshold-ctrl {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.65rem;
          font-size: 0.75rem;
          color: var(--fg-muted);
          font-weight: 600;
        }
        .threshold-field {
          width: 48px;
          padding: 0.15rem 0.3rem;
          font-size: 0.75rem;
          font-weight: 700;
          text-align: center;
          background: var(--bg-card-solid);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          color: var(--fg-color);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .threshold-field:focus {
          border-color: var(--primary-color);
        }

        /* Fulfillment Share styling */
        .fulfillment-share-card-section {
          margin-top: 2rem;
          border-top: 1px solid var(--border-color-solid);
          padding-top: 1.5rem;
        }
        .empty-sub-text {
          font-size: 0.85rem;
          color: var(--fg-muted);
          text-align: center;
          padding: 1rem 0;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stat-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--fg-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.85rem;
          color: var(--primary-color);
          margin-top: 0.25rem;
          line-height: 1.1;
        }

        .stat-sub {
          font-size: 0.75rem;
          color: var(--fg-muted);
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(var(--primary-rgb), 0.08);
          color: var(--primary-color);
        }

        .stat-icon-wrapper.icon-accent {
          background-color: rgba(var(--accent-rgb), 0.1);
          color: var(--accent-dark);
        }

        .stat-icon-wrapper.icon-gold {
          background-color: rgba(233, 196, 106, 0.1);
          color: var(--gold-light);
        }

        .card-bottom-info {
          font-size: 0.8rem;
          color: var(--fg-muted);
          border-top: 1px solid var(--border-color);
          padding-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .divider-dot {
          color: var(--border-color-solid);
        }

        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary-color);
          font-weight: bold;
        }

        .card-link:hover {
          color: var(--primary-light);
        }

        .card-success {
          border-left: 4px solid var(--success-color);
        }

        .card-danger {
          border-left: 4px solid var(--error-color);
        }

        /* Main Dashboard Grid layout */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
        }

        .grid-card {
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }

        .card-header {
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .card-header h3,
        .card-header-row h3 {
          font-size: 1.2rem;
          color: var(--primary-color);
        }

        .card-header-sub {
          font-size: 0.8rem;
          color: var(--fg-muted);
        }

        .header-link {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .header-link:hover {
          color: var(--primary-light);
        }

        /* Trend Chart Styling */
        .empty-chart-box {
          height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--fg-muted);
          font-size: 0.9rem;
          text-align: center;
        }

        .chart-container {
          height: 250px;
          display: flex;
          gap: 1.5rem;
          position: relative;
          padding-top: 1rem;
        }

        .chart-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--fg-muted);
          width: 25px;
          text-align: right;
          border-right: 1px solid var(--border-color-solid);
          padding-right: 0.5rem;
          height: 84%;
        }

        .chart-bars {
          display: flex;
          justify-content: space-between;
          flex-grow: 1;
          height: 100%;
        }

        .chart-bar-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-grow: 1;
          height: 100%;
          gap: 0.5rem;
        }

        .chart-bar-wrapper {
          height: 84%;
          width: 28px;
          background-color: rgba(var(--primary-rgb), 0.03);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          position: relative;
          display: flex;
          align-items: flex-end;
          overflow: visible;
        }

        .chart-bar-fill {
          width: 100%;
          background: linear-gradient(to top, var(--primary-color), var(--primary-light));
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          transition: height 0.5s ease-out;
          position: relative;
          cursor: pointer;
        }

        .chart-bar-fill:hover {
          background: var(--accent-dark);
        }

        .bar-tooltip {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--primary-color);
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
          opacity: 0;
          transition: opacity var(--transition-fast);
          pointer-events: none;
          white-space: nowrap;
        }

        .chart-bar-fill:hover .bar-tooltip {
          opacity: 1;
        }

        .chart-bar-label {
          font-size: 0.7rem;
          color: var(--fg-muted);
          text-align: center;
          white-space: nowrap;
        }

        /* Recent order items */
        .recent-orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-list-text {
          color: var(--fg-muted);
          font-size: 0.9rem;
          text-align: center;
          padding: 2rem 0;
        }

        .recent-order-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background-color: var(--bg-card-solid);
          gap: 1rem;
        }

        .row-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-grow: 1;
        }

        .order-profile-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: rgba(var(--accent-rgb), 0.12);
          color: var(--accent-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: bold;
          font-size: 1rem;
        }

        .order-details {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }

        .order-details strong {
          font-size: 0.9rem;
          color: var(--fg-color);
        }

        .order-summary {
          font-size: 0.8rem;
          color: var(--fg-muted);
        }

        .pickup-date {
          font-size: 0.75rem;
          color: var(--accent-dark);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.1rem;
        }

        .row-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          border: none;
          padding: 0.35rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--font-display);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .fulfill-btn {
          background-color: var(--success-color);
          color: #ffffff;
        }
        
        .fulfill-btn:hover {
          background-color: var(--primary-light);
        }

        .cancel-btn {
          background-color: var(--border-color-solid);
          color: var(--fg-muted);
        }

        .cancel-btn:hover {
          background-color: var(--error-color);
          color: #ffffff;
        }

        .status-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .status-pill.delivered {
          background-color: rgba(64, 145, 108, 0.15);
          color: var(--success-color);
        }

        .status-pill.canceled {
          background-color: rgba(217, 4, 41, 0.15);
          color: var(--error-color);
        }

        .status-pill.pending {
          background-color: rgba(233, 196, 106, 0.15);
          color: var(--gold-light);
        }

        /* Low-stock / warn alert variant */
        .alert-card.warn {
          border: 1px solid rgba(244, 162, 97, 0.3);
          border-left: 5px solid var(--warning-color);
          background-color: rgba(244, 162, 97, 0.06);
        }
        .warn-icon { color: var(--warning-color); }
        .alert-card.warn h3 { color: var(--accent-dark); }
        .warn-btn { background-color: var(--warning-color); color: #1a2420; }

        /* Today's schedule */
        .inline-icon { vertical-align: -3px; margin-right: 0.35rem; color: var(--accent-dark); }
        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .schedule-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background-color: var(--bg-card-solid);
          flex-wrap: wrap;
        }
        .sched-left {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          flex: 1 1 280px;
        }
        .type-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.35rem 0.6rem;
          border-radius: var(--radius-full);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .type-chip.is-delivery { background: rgba(var(--accent-rgb), 0.15); color: var(--accent-dark); }
        .type-chip.is-pickup { background: rgba(var(--primary-rgb), 0.1); color: var(--primary-color); }
        .sched-info { display: flex; flex-direction: column; gap: 0.15rem; line-height: 1.35; }
        .sched-info strong { color: var(--fg-color); font-size: 0.95rem; }
        .sched-items { font-size: 0.82rem; color: var(--fg-muted); }
        .sched-address {
          font-size: 0.78rem; color: var(--accent-dark);
          display: inline-flex; align-items: center; gap: 0.25rem;
          text-decoration: underline;
          text-decoration-color: rgba(var(--accent-rgb), 0.4);
          text-underline-offset: 2px;
          width: fit-content;
        }
        .sched-address:hover { text-decoration-color: var(--accent-dark); }
        .pay-tag {
          display: inline-block;
          font-size: 0.7rem; font-weight: 700;
          padding: 0.1rem 0.45rem; border-radius: var(--radius-full);
          margin-top: 0.15rem;
        }
        .pay-tag.paid { background: rgba(64,145,108,0.15); color: var(--success-color); }
        .pay-tag.unpaid { background: rgba(233,196,106,0.18); color: var(--gold-light); }
        .sched-actions { display: flex; align-items: center; gap: 0.5rem; }
        .contact-btn {
          width: 34px; height: 34px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-color); cursor: pointer;
          transition: all var(--transition-fast);
        }
        .contact-btn.call { background: rgba(var(--primary-rgb),0.08); color: var(--primary-color); }
        .contact-btn.call:hover { background: var(--primary-color); color: #fff; }
        .contact-btn.wa { background: rgba(37,211,102,0.12); color: #1aa44e; }
        .contact-btn.wa:hover { background: #25d366; color: #fff; }
        .contact-btn.maps { background: rgba(var(--accent-rgb),0.14); color: var(--accent-dark); }
        .contact-btn.maps:hover { background: var(--accent-dark); color: #fff; }

        /* Recent order mini badges */
        .row-badges { display: flex; gap: 0.35rem; margin-top: 0.2rem; }
        .mini-badge {
          font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.03em; padding: 0.1rem 0.4rem; border-radius: var(--radius-full);
        }
        .mb-delivery { background: rgba(var(--accent-rgb),0.15); color: var(--accent-dark); }
        .mb-pickup { background: rgba(var(--primary-rgb),0.1); color: var(--primary-color); }
        .mb-paid { background: rgba(64,145,108,0.15); color: var(--success-color); }

        .danger-zone-card {
          border: 1px solid rgba(217, 4, 41, 0.2);
          background-color: rgba(217, 4, 41, 0.02);
          margin-top: 1rem;
        }
        .danger-header-row {
          border-bottom: 1px solid rgba(217, 4, 41, 0.15);
          margin-bottom: 1.5rem;
        }
        .danger-title {
          color: var(--error-color) !important;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .danger-actions {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .danger-action-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .border-top-danger {
          border-top: 1px solid rgba(217, 4, 41, 0.15);
          padding-top: 1.5rem;
        }
        .danger-action-info {
          flex: 1 1 300px;
        }
        .danger-action-info strong {
          display: block;
          font-size: 0.95rem;
          color: var(--fg-color);
          margin-bottom: 0.25rem;
        }
        .danger-action-info p {
          font-size: 0.82rem;
          color: var(--fg-muted);
          line-height: 1.4;
        }
        .btn-danger {
          background-color: transparent;
          color: var(--error-color);
          border: 1px solid var(--error-color);
          padding: 0.6rem 1.25rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-danger:hover:not(:disabled) {
          background-color: var(--error-color);
          color: #ffffff;
        }
        .btn-danger-heavy {
          background-color: var(--error-color);
          color: #ffffff;
          border: 1px solid var(--error-color);
          padding: 0.6rem 1.25rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-danger-heavy:hover:not(:disabled) {
          background-color: #bd0320;
          border-color: #bd0320;
        }
        .btn-danger:disabled, .btn-danger-heavy:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .chart-container {
            gap: 0.75rem;
          }
          .chart-bar-wrapper {
            width: 20px;
          }
          .recent-order-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .row-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
