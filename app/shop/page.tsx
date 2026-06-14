'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Product } from '@/lib/db';
import { useCart } from '@/context/CartContext';
import { Sparkles, Star, ShieldCheck, Truck, Leaf } from 'lucide-react';

export default function ShopCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { eggStats, addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load shop products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Gathering fresh products...</p>
        <style jsx>{`
          .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1.5rem;
            color: var(--primary-color);
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--border-color-solid);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <Navbar />

      <main className="main-content">
        <section className="catalog-header-section">
          <div className="container text-center">
            <span className="badge-shop"><Sparkles size={12} /> Fresh Nanyuki Harvest</span>
            <h1>Choose Your Tray Size</h1>
            <p className="catalog-subtitle">
              Sourced directly from our eco-friendly pastures. Select standard or large trays below to reserve yours.
            </p>
            <div className="shop-trust">
              <span className="shop-trust-item"><ShieldCheck size={16} /> Grade AA Quality</span>
              <span className="shop-trust-item"><Leaf size={16} /> Farm Fresh Daily</span>
              <span className="shop-trust-item"><Truck size={16} /> Reliable Pickup</span>
              <span className="shop-trust-item"><Star size={16} /> 4.9/5 Rated</span>
            </div>
          </div>
        </section>

        <section className="catalog-section" style={{ paddingBottom: '6rem' }}>
          <div className="container">
            <div className="products-grid">
              {products.map(product => {
                const requiredEggs = product.id === 'prod_eggs_30' ? 30 : 60;
                const isOutOfStock = eggStats.available < requiredEggs;
                const availableForProduct = Math.floor(eggStats.available / requiredEggs);

                return (
                  <div key={product.id} className="product-card glass card-hover">
                    <Link href={`/shop/${product.id}`} className="product-image-container">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="product-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="product-image-placeholder">
                        🥚
                      </div>
                      {!isOutOfStock ? (
                        <span className="product-badge eggs-badge">{availableForProduct} Trays Available</span>
                      ) : (
                        <span className="product-badge sold-out-badge">Out of Stock</span>
                      )}
                    </Link>
                    
                    <div className="product-details">
                      <div className="product-title-row">
                        <Link href={`/shop/${product.id}`}>
                          <h3>{product.name}</h3>
                        </Link>
                        <span className="price-tag">KES {product.price.toLocaleString()}</span>
                      </div>
                      <div className="product-rating">
                        <span className="stars">
                          {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={14} />)}
                        </span>
                        <span className="rating-count">4.9 (320+ reviews)</span>
                      </div>
                      <p className="product-desc">{product.description}</p>
                      
                      <div className="product-card-footer">
                        {product.inStock ? (
                          isOutOfStock ? (
                            <button disabled className="btn btn-secondary btn-full">
                              Sold Out Today
                            </button>
                          ) : (
                            <button 
                              onClick={() => addToCart(product)} 
                              className="btn btn-primary btn-full"
                            >
                              Add to Cart
                            </button>
                          )
                        ) : (
                          <button disabled className="btn btn-secondary btn-full">
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bulk Order Card */}
            <div className="bulk-order-banner glass card-hover">
              <div className="bulk-text">
                <h3>Looking for Wholesale Quantities?</h3>
                <p>
                  For bookings exceeding <strong>10 trays</strong>, custom price breaks and delivery coordination are available directly via WhatsApp (+254722237593).
                </p>
              </div>
              <a 
                href="https://wa.me/254722237593?text=Hi%20Tabby%20Premium%20Eggs%2C%20I%20would%20like%20to%20request%20a%20bulk%20quote%20for%20more%20than%2010%20trays..." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
              >
                Request Bulk Quote (WhatsApp)
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .catalog-header-section {
          padding: 4rem 0 2rem 0;
        }

        .badge-shop {
          display: inline-flex;
          align-self: center;
          background: rgba(247, 160, 114, 0.15);
          color: var(--accent-dark);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          align-items: center;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .catalog-header-section h1 {
          font-size: 2.75rem;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .catalog-subtitle {
          color: var(--fg-muted);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .catalog-section {
          background-color: transparent;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2.5rem;
          margin-bottom: 4rem;
        }

        /* Product Cards */
        .product-card {
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-color);
        }

        .product-image-container {
          position: relative;
          aspect-ratio: 16 / 10;
          background-color: rgba(var(--primary-rgb), 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-slow);
        }

        .product-card:hover .product-image {
          transform: scale(1.04);
        }

        .product-image-placeholder {
          position: absolute;
          font-size: 3.5rem;
          z-index: -1;
        }

        .product-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .eggs-badge {
          background-color: var(--primary-color);
          color: var(--primary-fg);
        }

        .sold-out-badge {
          background-color: var(--error-color);
          color: white;
        }

        .product-details {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-grow: 1;
        }

        .product-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .product-title-row h3 {
          font-size: 1.35rem;
          color: var(--primary-color);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .product-title-row h3:hover {
          color: var(--primary-light);
        }

        .price-tag {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--accent-dark);
          white-space: nowrap;
        }

        .product-desc {
          font-size: 0.95rem;
          color: var(--fg-muted);
          line-height: 1.6;
          flex-grow: 1;
        }

        .product-card-footer {
          margin-top: 1rem;
        }

        /* Bulk Banner */
        .bulk-order-banner {
          padding: 2.5rem 3rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 2rem;
          border: 1px solid var(--border-color);
        }

        .bulk-text {
          flex: 1 1 500px;
        }

        .bulk-text h3 {
          color: var(--primary-color);
          font-size: 1.35rem;
          margin-bottom: 0.5rem;
        }

        .bulk-text p {
          color: var(--fg-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .shop-trust {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1.25rem 2rem;
          margin-top: 1.75rem;
        }
        .shop-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--primary-color);
        }
        .shop-trust-item svg { color: var(--accent-dark); }
        .product-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: -0.25rem;
        }
        .stars {
          display: inline-flex;
          align-items: center;
          gap: 0.1rem;
          color: var(--gold-light);
        }
        .stars :global(svg) { fill: currentColor; }
        .rating-count {
          font-size: 0.82rem;
          color: var(--fg-muted);
        }

        @media (max-width: 768px) {
          .catalog-header-section {
            padding: 3rem 0 1.5rem 0;
          }
          .catalog-header-section h1 {
            font-size: 2rem;
          }
          .catalog-subtitle {
            font-size: 0.95rem;
          }
          .bulk-order-banner {
            padding: 2rem;
            text-align: center;
            justify-content: center;
          }
          .bulk-order-banner a {
            width: 100%;
          }
          .products-grid {
            gap: 1.5rem;
          }
          .product-details {
            padding: 1.25rem;
          }
          .product-title-row {
            flex-direction: column;
            gap: 0.25rem;
          }
          .product-title-row h3 {
            font-size: 1.15rem;
          }
          .price-tag {
            font-size: 1.15rem;
          }
          .bulk-text h3 {
            font-size: 1.15rem;
          }
        }

        @media (max-width: 480px) {
          .catalog-header-section h1 {
            font-size: 1.75rem;
          }
          .product-image-container {
            aspect-ratio: 16 / 9;
          }
        }
      `}</style>
    </div>
  );
}
