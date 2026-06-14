'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Minus, Plus, Trash2, X } from 'lucide-react';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    getCartCount, 
    getCartTotal 
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer glass" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Your Reservation Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="close-btn" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={48} className="empty-cart-icon" />
            <p>Your cart is empty.</p>
            <p className="empty-sub">Explore our farm shop and select tray sizes to begin.</p>
            <Link 
              href="/shop" 
              onClick={() => setIsCartOpen(false)} 
              className="btn btn-primary mt-4"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {cart.map(item => (
                <div key={item.product.id} className="cart-item glass">
                  <div className="cart-item-info">
                    <h4>{item.product.name}</h4>
                    <p className="cart-item-price">KES {item.product.price.toLocaleString()} / {item.product.unit}</p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-selectors">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="qty-btn" aria-label="Decrease quantity">
                        <Minus size={14} />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="qty-btn" aria-label="Increase quantity">
                        <Plus size={14} />
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(item.product.id)} className="delete-btn" aria-label="Delete item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-footer-checkout">
              <div className="cart-total-box glass">
                <span>Estimated Total:</span>
                <span className="total-amount">KES {getCartTotal().toLocaleString()}</span>
              </div>
              
              <Link 
                href="/checkout" 
                onClick={() => setIsCartOpen(false)} 
                className="btn btn-primary btn-full mt-4 submit-booking-btn"
                id="drawer-checkout-btn"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .cart-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          justify-content: flex-end;
        }

        .cart-drawer {
          width: 100%;
          max-width: 450px;
          height: 100%;
          background: var(--bg-color);
          border-left: 1px solid var(--border-color);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          animation: slideLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .drawer-header h2 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--primary-color);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--fg-color);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .close-btn:hover {
          background-color: var(--border-color);
        }

        .empty-cart {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.5rem;
          padding: 2rem;
        }

        .empty-cart-icon {
          color: var(--fg-muted);
          opacity: 0.6;
          margin-bottom: 1rem;
        }

        .empty-sub {
          font-size: 0.9rem;
          color: var(--fg-muted);
        }

        .drawer-items {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .cart-item {
          padding: 1.25rem;
          border-radius: var(--radius-sm);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid var(--border-color);
        }

        .cart-item-info h4 {
          font-size: 1.05rem;
          color: var(--primary-color);
          margin-bottom: 0.25rem;
        }

        .cart-item-price {
          font-size: 0.85rem;
          color: var(--fg-muted);
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .qty-selectors {
          display: flex;
          align-items: center;
          background-color: rgba(var(--primary-rgb), 0.05);
          border-radius: var(--radius-sm);
          padding: 0.25rem;
        }

        .qty-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .qty-btn:hover {
          background-color: rgba(var(--primary-rgb), 0.1);
        }

        .qty-val {
          width: 30px;
          text-align: center;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: var(--error-color);
          cursor: pointer;
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast);
        }

        .delete-btn:hover {
          background-color: rgba(217, 4, 41, 0.08);
        }

        .drawer-footer-checkout {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .cart-total-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        .total-amount {
          font-size: 1.35rem;
          color: var(--accent-dark);
          font-family: var(--font-display);
          font-weight: 800;
        }

        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @media (max-width: 576px) {
          .cart-drawer {
            max-width: 100%;
            padding: 1.5rem 1rem;
          }
          .drawer-header {
            margin-bottom: 1.5rem;
          }
          .drawer-header h2 {
            font-size: 1.25rem;
          }
          .cart-item {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .cart-item-actions {
            width: 100%;
            justify-content: space-between;
          }
          .total-amount {
            font-size: 1.15rem;
          }
        }
      `}</style>
    </div>
  );
}
