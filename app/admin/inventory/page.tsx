'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clipboard, AlertTriangle, RefreshCw } from 'lucide-react';
import { InventoryEntry } from '@/lib/db';

export default function AdminInventory() {
  const [logs, setLogs] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [count, setCount] = useState<number | ''>('');
  const [type, setType] = useState<'chicken' | 'duck'>('chicken');
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'mixed'>('mixed');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInventoryLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setError('Failed to fetch inventory logs.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryLogs();
  }, []);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (count === '' || count <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, count, type, size, notes })
      });

      if (res.ok) {
        // Reset form except date
        setCount('');
        setNotes('');
        setSize('mixed');
        
        // Refresh list
        loadInventoryLogs();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to log collection.');
      }
    } catch (err) {
      alert('Network error. Failed to save collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection entry? This will adjust available egg stock.')) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        loadInventoryLogs();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete entry.');
      }
    } catch (err) {
      alert('Network error. Failed to delete entry.');
    }
  };

  // Helper: Calculate tray conversion (30 eggs per tray)
  const getTrayRepresentation = (c: number | '') => {
    if (!c || c <= 0) return '0 Trays';
    const trays = Math.floor(c / 30);
    const rem = c % 30;
    if (rem === 0) return `${trays} Tray${trays !== 1 ? 's' : ''}`;
    return `${trays} Tray${trays !== 1 ? 's' : ''} and ${rem} egg${rem !== 1 ? 's' : ''}`;
  };

  return (
    <div className="inventory-page-wrapper">
      
      <div className="inventory-grid">
        
        {/* Left Side: Log Harvest Form */}
        <div className="form-card glass">
          <div className="form-header">
            <Clipboard className="header-icon" size={20} />
            <h3>Log New Egg Harvest</h3>
          </div>

          <form onSubmit={handleAddLog} className="harvest-form">
            <div className="form-group">
              <label htmlFor="logDate">Collection Date</label>
              <input 
                type="date" 
                id="logDate"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="eggCount">Quantity Collected (Individual Eggs)</label>
              <div className="input-with-badge">
                <input 
                  type="number" 
                  id="eggCount"
                  required
                  min="1"
                  placeholder="e.g. 120"
                  value={count}
                  onChange={(e) => setCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                />
                {count !== '' && count > 0 && (
                  <span className="count-badge">
                    {getTrayRepresentation(count)}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="poultryType">Poultry Type</label>
                <select 
                  id="poultryType"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="chicken">Chicken</option>
                  <option value="duck">Duck</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="eggSize">Average Egg Size</label>
                <select 
                  id="eggSize"
                  value={size}
                  onChange={(e) => setSize(e.target.value as any)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="logNotes">Notes / Observations</label>
              <textarea 
                id="logNotes"
                placeholder="e.g. Added calcium grit, high temperature, extra clean shells..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              className="btn btn-primary btn-full submit-harvest-btn"
              id="submit-harvest-btn"
            >
              {submitting ? 'Saving to Log...' : 'Log Collection'}
            </button>
          </form>
        </div>

        {/* Right Side: Log History Table */}
        <div className="list-card glass">
          <div className="card-header-row">
            <h3>Egg Harvest Log History</h3>
            <button onClick={loadInventoryLogs} className="btn-refresh" aria-label="Refresh list">
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div className="list-loading">
              <div className="spinner"></div>
              <p>Fetching harvest logs...</p>
            </div>
          ) : error ? (
            <div className="error-box">
              <AlertTriangle size={18} />
              <p>{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-history text-center">
              <Calendar size={36} className="empty-icon" />
              <p>No egg harvests logged yet.</p>
              <p className="empty-sub">Fill out the harvest form to save your first collection entry.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Poultry</th>
                    <th className="text-right">Qty (Eggs)</th>
                    <th className="text-right">Qty (Trays)</th>
                    <th>Size</th>
                    <th>Notes</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-date">{log.date}</td>
                      <td>
                        <span className={`poultry-pill ${log.type}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="text-right font-bold">{log.count}</td>
                      <td className="text-right text-muted">{(log.count / 30).toFixed(1)} trays</td>
                      <td><span className="size-label">{log.size}</span></td>
                      <td className="log-notes" title={log.notes}>{log.notes || '—'}</td>
                      <td className="text-center">
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="delete-log-btn"
                          aria-label={`Delete harvest logged on ${log.date}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .inventory-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: flex-start;
        }

        .form-card, 
        .list-card {
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          padding: 1.5rem;
        }

        .form-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          color: var(--primary-color);
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 0.75rem;
        }

        .header-icon {
          stroke-width: 2.5;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          color: var(--primary-color);
          border-bottom: 1px solid var(--border-color-solid);
          padding-bottom: 0.75rem;
        }

        .btn-refresh {
          background: transparent;
          border: none;
          color: var(--fg-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .btn-refresh:hover {
          color: var(--primary-color);
        }

        .input-with-badge {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          position: relative;
        }

        .count-badge {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-dark);
          background-color: rgba(var(--accent-rgb), 0.08);
          align-self: flex-start;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          margin-top: 0.15rem;
        }

        .form-group select {
          padding: 0.65rem 0.85rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color-solid);
          background-color: var(--bg-card-solid);
          color: var(--fg-color);
          font-size: 0.95rem;
        }

        .form-group select:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        /* List history table */
        .list-loading {
          padding: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--primary-color);
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border-color-solid);
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-history {
          padding: 4rem 1rem;
          color: var(--fg-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .empty-icon {
          opacity: 0.5;
        }

        .empty-sub {
          font-size: 0.85rem;
        }

        .table-responsive {
          overflow-x: auto;
          max-height: 500px;
          overflow-y: auto;
        }

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .logs-table th, 
        .logs-table td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color-solid);
        }

        .logs-table th {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--primary-color);
          background-color: rgba(var(--primary-rgb), 0.01);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .logs-table tbody tr:hover {
          background-color: rgba(var(--primary-rgb), 0.02);
        }

        .log-date {
          font-family: monospace;
          font-weight: 600;
        }

        .font-bold {
          font-weight: 700;
        }

        .poultry-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .poultry-pill.chicken {
          background-color: rgba(var(--primary-rgb), 0.08);
          color: var(--primary-color);
        }

        .poultry-pill.duck {
          background-color: rgba(var(--accent-rgb), 0.12);
          color: var(--accent-dark);
        }

        .size-label {
          text-transform: capitalize;
          font-weight: 600;
        }

        .log-notes {
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--fg-muted);
        }

        .delete-log-btn {
          background: transparent;
          border: none;
          color: var(--fg-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
        }

        .delete-log-btn:hover {
          color: var(--error-color);
        }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (max-width: 1200px) {
          .inventory-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
