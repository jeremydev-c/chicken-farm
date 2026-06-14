'use client';

import React, { useState } from 'react';
import { Feather, Lock, LogIn, AlertTriangle } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        const params = new URLSearchParams(window.location.search);
        const from = params.get('from');
        const target = from && from.startsWith('/admin') ? from : '/admin';
        window.location.assign(target);
      } else {
        setError(data.error || 'Login failed.');
        setSubmitting(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card glass">
        <div className="login-brand">
          <Feather className="brand-icon" size={26} />
          <div>
            <h1>Tabby Premium</h1>
            <span>NANYUKI ADMIN</span>
          </div>
        </div>

        <p className="login-sub">Please sign in to manage orders, stock and products.</p>

        {error && (
          <div className="login-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="admin-password">Admin Password</label>
            <div className="pw-wrap">
              <Lock size={16} className="pw-icon" />
              <input
                id="admin-password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary btn-full">
            {submitting ? 'Signing in…' : (<><LogIn size={16} /> Sign In</>)}
          </button>
        </form>

        <a href="/" className="back-store">← Back to storefront</a>
      </div>

      <style jsx>{`
        .login-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background-image:
            radial-gradient(at 0% 0%, rgba(var(--accent-rgb), 0.06) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(var(--primary-rgb), 0.06) 0px, transparent 50%);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .login-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--primary-color);
        }
        .brand-icon { color: var(--primary-color); stroke-width: 2.5; }
        .login-brand h1 {
          font-size: 1.25rem;
          line-height: 1;
          margin-bottom: 0.2rem;
        }
        .login-brand span {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent-dark);
          text-transform: uppercase;
        }
        .login-sub {
          font-size: 0.9rem;
          color: var(--fg-muted);
          line-height: 1.5;
        }
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: rgba(217, 4, 41, 0.08);
          border: 1px solid rgba(217, 4, 41, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.85rem;
          color: var(--error-color);
          font-size: 0.85rem;
        }
        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .pw-wrap { position: relative; display: flex; align-items: center; }
        .pw-icon { position: absolute; left: 0.85rem; color: var(--fg-muted); }
        .pw-wrap input { width: 100%; padding-left: 2.4rem; }
        .back-store {
          text-align: center;
          font-size: 0.82rem;
          color: var(--fg-muted);
          text-decoration: none;
        }
        .back-store:hover { color: var(--primary-color); }

        @media (max-width: 420px) {
          .login-screen {
            padding: 1rem;
          }
          .login-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
