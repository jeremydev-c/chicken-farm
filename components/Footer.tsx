import React from 'react';
import { Egg, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="container footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <img src="/logo.png" alt="Tabby Premium Eggs" className="brand-image" />
            <span className="brand-title">Tabby Premium Eggs</span>
          </div>
          <p className="brand-description">
            Premium Grade AA quality eggs with a clean presentation, direct sourcing, and reliable delivery for Kenyan households, cafes, hotels, and retail kitchens. Produced fresh in Nanyuki, Kenya.
          </p>
        </div>

        <div className="footer-info">
          <h4 className="info-title">Pickup Hours</h4>
          <p className="info-text">Every day: 8:00 AM – 7:00 PM</p>
          <p className="info-note">Please schedule your reservation at least 24 hours in advance.</p>
        </div>

        <div className="footer-contact">
          <h4 className="info-title">Our Farm Location</h4>
          <p className="info-text">Nanyuki, Kenya</p>
          <p className="info-text">Phone: +254 722 237 593</p>
          <p className="info-text">Email: orders@tabbyeggs.co.ke</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-content">
          <p className="copyright">&copy; {currentYear} Tabby Premium Eggs. All rights reserved.</p>
          <p className="made-by">
            Made with <Heart size={12} className="heart-icon" /> for Mom's Chicken Farm
          </p>
        </div>
      </div>

      <style jsx>{`
        .footer-container {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--glass-border);
          padding-top: 3.5rem;
          margin-top: auto;
          color: var(--fg-color);
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1.2fr;
          gap: 3rem;
          padding-bottom: 3rem;
        }

        .footer-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-color);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
        }

        .brand-image {
          height: 36px;
          width: auto;
          object-fit: contain;
          border-radius: 4px;
        }

        .brand-description {
          color: var(--fg-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .info-title {
          font-family: var(--font-display);
          color: var(--primary-color);
          font-size: 1.05rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-text {
          font-size: 0.95rem;
          color: var(--fg-color);
          margin-bottom: 0.5rem;
        }

        .info-note {
          font-size: 0.85rem;
          color: var(--accent-dark);
          margin-top: 0.5rem;
          font-style: italic;
        }

        .footer-bottom {
          border-top: 1px solid var(--border-color);
          padding: 1.5rem 0;
          background-color: rgba(var(--primary-rgb), 0.02);
        }

        .bottom-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--fg-muted);
        }

        .heart-icon {
          fill: var(--error-color);
          color: var(--error-color);
          display: inline;
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .bottom-content {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
