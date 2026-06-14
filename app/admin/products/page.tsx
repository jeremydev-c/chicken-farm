'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ToggleLeft, ToggleRight, Edit, Check, X, AlertTriangle } from 'lucide-react';
import { Product } from '@/lib/db';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editInStock, setEditInStock] = useState<boolean>(true);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setError('Failed to fetch product catalog.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setEditPrice(product.price);
    setEditInStock(product.inStock);
    setEditDescription(product.description);
    setEditName(product.name);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editName,
          price: editPrice,
          inStock: editInStock,
          description: editDescription
        })
      });

      if (res.ok) {
        setEditingProduct(null);
        loadProducts(); // Reload catalog
      } else {
        alert('Failed to update product catalog.');
      }
    } catch (err) {
      alert('Network error. Failed to save product details.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          inStock: !product.inStock
        })
      });

      if (res.ok) {
        loadProducts();
      } else {
        alert('Failed to toggle stock status.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  return (
    <div className="products-page-wrapper">
      
      {loading ? (
        <div className="list-loading glass text-center">
          <div className="spinner"></div>
          <p className="mt-2 text-muted">Retrieving product catalog...</p>
        </div>
      ) : error ? (
        <div className="error-box">
          <AlertTriangle size={18} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-admin-card glass">
              <div className="card-media">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="product-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="product-icon-fallback">
                  {product.id === 'prod_eggs' ? '🥚' : product.id === 'prod_chickens' ? '🐔' : '🪱'}
                </div>
                
                {/* Stock toggle overlay badge */}
                <button 
                  onClick={() => handleToggleStock(product)} 
                  className={`stock-badge-btn ${product.inStock ? 'in-stock' : 'out-of-stock'}`}
                  title={product.inStock ? "Click to set Out of Stock" : "Click to set In Stock"}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>

              <div className="card-info">
                <div className="info-header">
                  <h3>{product.name}</h3>
                  <span className="price-label">
                    KES {product.price.toLocaleString()} <span className="unit-text">/ {product.unit}</span>
                  </span>
                </div>
                
                <p className="product-desc">{product.description}</p>
                
                <div className="card-footer">
                  <button 
                    onClick={() => handleStartEdit(product)} 
                    className="btn btn-secondary btn-edit"
                  >
                    <Edit size={14} /> Edit Catalog Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingProduct && (
        <div className="edit-modal-overlay" onClick={handleCancelEdit}>
          <div className="edit-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <Settings className="modal-icon" size={20} />
              <h3>Edit Catalog Item</h3>
              <button onClick={handleCancelEdit} className="close-btn" aria-label="Cancel editing">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="edit-product-form">
              <div className="form-group">
                <label htmlFor="editProductName">Product Name</label>
                <input 
                  type="text" 
                  id="editProductName"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editProductPrice">Price (USD) *</label>
                  <input 
                    type="number" 
                    id="editProductPrice"
                    required
                    min="0.01"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label>Catalog Availability</label>
                  <div className="toggle-wrapper" onClick={() => setEditInStock(!editInStock)}>
                    {editInStock ? (
                      <ToggleRight size={38} className="toggle-icon active" />
                    ) : (
                      <ToggleLeft size={38} className="toggle-icon text-muted" />
                    )}
                    <span className="toggle-label">
                      {editInStock ? 'In Stock (Visible & Purchasable)' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editProductDesc">Storefront Description</label>
                <textarea 
                  id="editProductDesc"
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .products-page-wrapper {
          width: 100%;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
          gap: 2rem;
        }

        .product-admin-card {
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .card-media {
          aspect-ratio: 16 / 10;
          background-color: rgba(var(--primary-rgb), 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-icon-fallback {
          position: absolute;
          font-size: 3.5rem;
          z-index: -1;
        }

        .stock-badge-btn {
          position: absolute;
          top: 1rem;
          left: 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: transform var(--transition-fast), opacity var(--transition-fast);
        }

        .stock-badge-btn:hover {
          transform: scale(1.05);
        }

        .stock-badge-btn.in-stock {
          background-color: var(--success-color);
          color: #ffffff;
        }

        .stock-badge-btn.out-of-stock {
          background-color: var(--error-color);
          color: #ffffff;
        }

        .card-info {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-grow: 1;
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .info-header h3 {
          font-size: 1.2rem;
          color: var(--primary-color);
        }

        .price-label {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--accent-dark);
          white-space: nowrap;
        }

        .unit-text {
          font-size: 0.8rem;
          font-weight: 400;
          color: var(--fg-muted);
        }

        .product-desc {
          font-size: 0.85rem;
          color: var(--fg-muted);
          line-height: 1.5;
          flex-grow: 1;
        }

        .card-footer {
          margin-top: 0.75rem;
        }

        .btn-edit {
          width: 100%;
          justify-content: center;
        }

        /* Modal styling */
        .edit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .edit-modal {
          max-width: 550px;
          width: 100%;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 0.5rem;
          position: relative;
        }

        .modal-header h3 {
          font-size: 1.2rem;
        }

        .modal-header .close-btn {
          position: absolute;
          right: 0;
          top: 0;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--fg-muted);
        }

        .modal-header .close-btn:hover {
          color: var(--error-color);
        }

        .edit-product-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .toggle-icon {
          color: var(--fg-muted);
        }

        .toggle-icon.active {
          color: var(--success-color);
        }

        .toggle-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-color);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
          border-top: 1px solid var(--border-color-solid);
          padding-top: 1.25rem;
        }

        /* Loading / Error states */
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

        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (max-width: 576px) {
          .edit-modal {
            padding: 1.25rem 1rem;
            gap: 1rem;
          }
          .products-grid {
            gap: 1rem;
          }
          .card-info {
            padding: 1rem;
          }
          .modal-actions {
            margin-top: 0.5rem;
            padding-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
