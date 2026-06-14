'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Egg, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const { getCartCount, setIsCartOpen } = useCart();
  const cartCount = getCartCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className="navbar-container">
      <div className="navbar-content glass">
        <Link href="/" className="logo">
          <Egg className="logo-icon" />
          <span className="logo-text">Tabby Premium <span className="logo-subtext">Eggs</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="nav-links desktop-nav">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link href="/shop" className={`nav-link ${pathname === '/shop' ? 'active' : ''}`}>
            Shop
          </Link>
          <Link href="/track" className={`nav-link ${pathname === '/track' ? 'active' : ''}`}>
            Track Order
          </Link>
        </nav>

        <div className="navbar-actions">
          {!isAdmin && (
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="cart-button" 
              aria-label="Open cart"
              id="nav-cart-btn"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          )}
          <button 
            className="hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}>
          <nav className="mobile-nav glass" onClick={(e) => e.stopPropagation()}>
            <Link href="/" className={`mobile-link ${pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <Link href="/shop" className={`mobile-link ${pathname === '/shop' ? 'active' : ''}`}>
              Shop
            </Link>
            <Link href="/track" className={`mobile-link ${pathname === '/track' ? 'active' : ''}`}>
              Track Order
            </Link>
          </nav>
        </div>
      )}

      <style jsx>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
          padding: 1rem 1.5rem 0.5rem 1.5rem;
        }

        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
          transition: transform var(--transition-fast);
        }

        .logo:hover {
          transform: scale(1.02);
        }

        .logo-icon {
          stroke-width: 2.5;
        }

        .logo-subtext {
          font-weight: 400;
          color: var(--accent-dark);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-link {
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--fg-muted);
          position: relative;
          padding: 0.25rem 0;
          transition: color var(--transition-fast);
        }

        .nav-link:hover, .nav-link.active {
          color: var(--primary-color);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--accent-color);
          border-radius: var(--radius-full);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cart-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-color);
          color: var(--primary-fg);
          border: none;
          padding: 0.6rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: transform var(--transition-fast), background-color var(--transition-fast);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.15);
        }

        .cart-button:hover {
          background: var(--primary-light);
          transform: translateY(-1px);
        }

        .cart-button:active {
          transform: translateY(1px);
        }

        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--accent-color);
          color: var(--accent-fg);
          font-size: 0.75rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-color);
        }

        /* Hamburger - hidden on desktop */
        .hamburger-btn {
          display: none;
          background: transparent;
          border: 1px solid var(--border-color-solid);
          color: var(--fg-color);
          padding: 0.45rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          align-items: center;
          justify-content: center;
        }

        .hamburger-btn:hover {
          background-color: rgba(var(--primary-rgb), 0.06);
          border-color: rgba(var(--primary-rgb), 0.2);
        }

        /* Mobile Nav Overlay */
        .mobile-nav-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .navbar-container {
            padding: 0.75rem 1rem 0.35rem 1rem;
          }

          .navbar-content {
            padding: 0.6rem 1rem;
          }

          .desktop-nav {
            display: none !important;
          }

          .hamburger-btn {
            display: flex;
          }

          .mobile-nav-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(4px);
            z-index: 150;
            animation: fadeIn 0.2s ease;
          }

          .mobile-nav {
            position: absolute;
            top: 0;
            right: 0;
            width: min(280px, 80vw);
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 5rem 2rem 2rem 2rem;
            gap: 0.5rem;
            background: var(--bg-color);
            border-left: 1px solid var(--border-color);
            animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -8px 0 30px rgba(0, 0, 0, 0.12);
          }

          .mobile-link {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 1.1rem;
            color: var(--fg-muted);
            padding: 0.85rem 1rem;
            border-radius: var(--radius-sm);
            transition: all var(--transition-fast);
          }

          .mobile-link:hover,
          .mobile-link.active {
            color: var(--primary-color);
            background: rgba(var(--primary-rgb), 0.06);
          }

          .mobile-link.active {
            border-left: 3px solid var(--accent-color);
          }
        }

        @media (max-width: 400px) {
          .logo-text {
            font-size: 1.05rem;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </header>
  );
}
