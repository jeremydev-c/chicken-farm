'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Product } from '@/lib/db';
import { useCart } from '@/context/CartContext';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Check, 
  ShieldCheck, 
  Info,
  Calendar
} from 'lucide-react';

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const { eggStats, addToCart, updateQuantity, cart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = (await res.json()) as Product[];
          const found = data.find(p => p.id === productId);
          if (found) {
            setProduct(found);
          } else {
            router.push('/shop'); // Redirect to shop if not found
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId, router]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Loading specifications...</p>
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

  if (!product) return null;

  const requiredEggs = product.id === 'prod_eggs_30' ? 30 : 60;
  const isOutOfStock = eggStats.available < requiredEggs;
  const availableTraysForProduct = Math.floor(eggStats.available / requiredEggs);

  const handleQtyChange = (delta: number) => {
    setQuantity(prev => {
      const newVal = prev + delta;
      return newVal > 0 ? newVal : 1;
    });
  };

  const handleAddToCartClick = () => {
    setAdding(true);
    // Add multiple quantities by loop or modify context addToCart to take quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setTimeout(() => {
      setAdding(false);
      setQuantity(1); // reset after add
    }, 600);
  };

  // Specs helper depending on tray size
  const specs = product.id === 'prod_eggs_30' ? {
    idealFor: 'Everyday household cooking, baking, poaching, and breakfasts.',
    weight: 'Approx. 55g - 62g per egg (Grade AA Large)',
    packaging: 'Eco-friendly cardboard tray holding 30 hand-selected eggs.',
    yolks: 'Deep golden-yellow color from natural marigold-enriched grain feed.',
    whites: 'Thick and firm albumens that hold their shape beautifully.'
  } : {
    idealFor: 'Bakeries, cafes, restaurant kitchens, hotel caterers, and large families.',
    weight: 'Approx. 58g - 65g per egg (Grade AA Extra Large)',
    packaging: 'Double stacked high-durability cardboard trays holding 60 eggs.',
    yolks: 'Uniform, rich orange yolks with robust yolk membranes.',
    whites: 'High-viscosity egg whites that whip into perfect peaks for baking.'
  };

  return (
    <div className="layout-wrapper">
      <Navbar />

      <main className="main-content" style={{ padding: '3rem 0 6rem 0' }}>
        <div className="container">
          
          {/* Back button */}
          <Link href="/shop" className="back-link">
            <ArrowLeft size={16} /> Back to Shop Catalog
          </Link>

          <div className="product-details-grid">
            
            {/* Left Image Block */}
            <div className="detail-image-block">
              <div className="detail-image-wrapper glass card-hover">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="detail-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="detail-image-fallback">
                  🥚
                </div>
              </div>
            </div>

            {/* Right Info Block */}
            <div className="detail-info-block glass">
              <div className="detail-header">
                <h1>{product.name}</h1>
                <span className="price-tag">KES {product.price.toLocaleString()}</span>
              </div>

              {/* Stock Banner */}
              <div className="stock-info-banner">
                {isOutOfStock ? (
                  <span className="stock-pill out-of-stock">Sold Out Today</span>
                ) : (
                  <span className="stock-pill in-stock">{availableTraysForProduct} Trays Available</span>
                )}
                <span className="stock-subtext">Calculated directly from our Nanyuki inventory</span>
              </div>

              <div className="divider"></div>

              <p className="detail-desc">{product.description}</p>

              {/* Cart controls */}
              <div className="purchase-controls">
                {!isOutOfStock ? (
                  <>
                    <div className="qty-control-wrapper">
                      <button 
                        onClick={() => handleQtyChange(-1)} 
                        className="qty-btn" 
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="qty-value">{quantity}</span>
                      <button 
                        onClick={() => handleQtyChange(1)} 
                        className="qty-btn" 
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={handleAddToCartClick} 
                      className="btn btn-primary detail-add-btn"
                      disabled={adding}
                    >
                      {adding ? (
                        <>
                          <Check size={18} /> Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} /> Add {quantity} Tray{quantity > 1 ? 's' : ''} to Cart
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button disabled className="btn btn-secondary btn-full">
                    Out of Stock - Restocking Soon
                  </button>
                )}
              </div>

              <div className="divider"></div>

              {/* Premium Specs */}
              <div className="specs-section">
                <h3><ShieldCheck size={18} className="icon-gold" /> Farm-Fresh Grade AA Standards</h3>
                
                <div className="specs-list">
                  <div className="spec-item">
                    <span className="spec-label">Ideal For:</span>
                    <span className="spec-val">{specs.idealFor}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Egg Size/Weight:</span>
                    <span className="spec-val">{specs.weight}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Yolk Color:</span>
                    <span className="spec-val">{specs.yolks}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Egg Whites:</span>
                    <span className="spec-val">{specs.whites}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Packaging:</span>
                    <span className="spec-val">{specs.packaging}</span>
                  </div>
                </div>
              </div>

              {/* Wholesale notification */}
              <div className="wholesale-alert glass">
                <Info size={18} className="alert-info-icon" />
                <div>
                  <p>Ordering more than 10 trays?</p>
                  <a 
                    href={`https://wa.me/254722237593?text=Hi%20Tabby%20Premium%20Eggs%2C%20I'd%20like%20to%20request%20a%20bulk%20quote%20for%20${product.name}...`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Contact us on WhatsApp for bulk wholesale rates.
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--fg-muted);
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 2rem;
          transition: color var(--transition-fast);
        }

        .back-link:hover {
          color: var(--primary-color);
        }

        .product-details-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 4rem;
          align-items: start;
        }

        /* Image Display */
        .detail-image-block {
          position: sticky;
          top: 7rem;
        }

        .detail-image-wrapper {
          border-radius: var(--radius-lg);
          overflow: hidden;
          aspect-ratio: 1;
          border: 1px solid var(--border-color);
          position: relative;
          background: var(--bg-card-solid);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 40px rgba(27, 67, 50, 0.05);
        }

        .detail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-image-fallback {
          position: absolute;
          font-size: 6rem;
          z-index: -1;
          opacity: 0.5;
        }

        /* Info Display */
        .detail-info-block {
          padding: 3rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-header h1 {
          font-size: 2.25rem;
          color: var(--primary-color);
          line-height: 1.1;
        }

        .price-tag {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent-dark);
        }

        .stock-info-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stock-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stock-pill.in-stock {
          background-color: rgba(64, 145, 108, 0.15);
          color: var(--success-color);
        }

        .stock-pill.out-of-stock {
          background-color: rgba(217, 4, 41, 0.15);
          color: var(--error-color);
        }

        .stock-subtext {
          font-size: 0.85rem;
          color: var(--fg-muted);
        }

        .divider {
          height: 1px;
          background-color: var(--border-color);
          width: 100%;
        }

        .detail-desc {
          font-size: 1.05rem;
          color: var(--fg-muted);
          line-height: 1.7;
        }

        /* Purchase Controls */
        .purchase-controls {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .qty-control-wrapper {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-color-solid);
          background-color: rgba(var(--primary-rgb), 0.03);
          border-radius: var(--radius-sm);
          padding: 0.4rem;
        }

        .qty-btn {
          background: transparent;
          border: none;
          color: var(--primary-color);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .qty-btn:hover {
          background-color: rgba(var(--primary-rgb), 0.08);
        }

        .qty-value {
          width: 40px;
          text-align: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .detail-add-btn {
          flex-grow: 1;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 1.05rem;
        }

        /* Specs section */
        .specs-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .specs-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          font-size: 1.15rem;
        }

        .icon-gold {
          color: var(--accent-dark);
        }

        .specs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .spec-item {
          display: grid;
          grid-template-columns: 140px 1fr;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .spec-label {
          font-weight: 700;
          color: var(--primary-color);
        }

        .spec-val {
          color: var(--fg-muted);
        }

        /* Wholesale notification */
        .wholesale-alert {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .alert-info-icon {
          color: var(--accent-dark);
          margin-top: 0.2rem;
          flex-shrink: 0;
        }

        .wholesale-alert p {
          font-size: 0.85rem;
          color: var(--fg-muted);
          font-weight: 600;
        }

        .wholesale-alert a {
          font-size: 0.9rem;
          color: var(--accent-dark);
          font-weight: 700;
          text-decoration: underline;
          display: block;
          margin-top: 0.25rem;
        }

        @media (max-width: 992px) {
          .product-details-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .detail-image-block {
            position: relative;
            top: 0;
          }
          .detail-info-block {
            padding: 2rem;
          }
          .purchase-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .qty-control-wrapper {
            justify-content: space-between;
          }
        }

        @media (max-width: 768px) {
          .detail-header h1 {
            font-size: 1.75rem;
          }
          .price-tag {
            font-size: 1.5rem;
          }
          .detail-info-block {
            padding: 1.5rem;
            gap: 1.25rem;
          }
          .spec-item {
            grid-template-columns: 1fr;
            gap: 0.15rem;
          }
          .spec-label {
            font-size: 0.85rem;
          }
          .spec-val {
            font-size: 0.9rem;
          }
          .stock-info-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .detail-desc {
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .detail-header h1 {
            font-size: 1.5rem;
          }
          .detail-image-wrapper {
            aspect-ratio: 4 / 3;
          }
          .back-link {
            font-size: 0.85rem;
            margin-bottom: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
