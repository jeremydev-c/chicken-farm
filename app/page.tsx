'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import Reveal from '@/components/Reveal';
import { 
  ShoppingBag, 
  Calendar, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Truck,
  Star,
  Quote,
  Leaf,
  Clock,
  Plus,
  Minus
} from 'lucide-react';

const STATS = [
  { value: '250,000+', label: 'Eggs Delivered' },
  { value: '1,200+', label: 'Happy Customers' },
  { value: '4.9/5', label: 'Average Rating' },
  { value: '7 Days', label: 'Fresh Every Week' },
];

const TRUSTED = [
  'Nanyuki Cafe',
  'Mountain View Hotel',
  'Cedar Mall Grocers',
  'Highland Bakery',
  'Sundowner Restaurant',
  'Equator Kitchen',
  'Town Butchery & Deli',
];

const TESTIMONIALS = [
  {
    name: 'Wanjiru Kamau',
    role: 'Home cook, Nanyuki',
    initials: 'WK',
    color: 'linear-gradient(135deg, #1b4332, #40916c)',
    quote:
      'The freshest eggs I have ever bought in Nanyuki. Golden yolks every single time and the trays always arrive clean and unbroken.',
  },
  {
    name: 'James Mwangi',
    role: 'Owner, Highland Bakery',
    initials: 'JM',
    color: 'linear-gradient(135deg, #e07a5f, #f7a072)',
    quote:
      'We bake all day and Tabby never lets us down. Reliable weekly supply and the Grade AA quality keeps our cakes consistent.',
  },
  {
    name: 'Aisha Omar',
    role: 'Head chef, Mountain View Hotel',
    initials: 'AO',
    color: 'linear-gradient(135deg, #2a9d8f, #52b788)',
    quote:
      'Booking is effortless and the live stock count means our order is never cancelled last minute. Truly dependable.',
  },
];

const FAQS = [
  {
    q: 'How fresh are the eggs?',
    a: 'Every tray is collected fresh in Nanyuki and reserved against real-time stock, so you always receive recently-laid Grade AA eggs.',
  },
  {
    q: 'How do I pick up my order?',
    a: 'Choose a pickup date at least 24 hours ahead at checkout, then collect your trays from our Nanyuki depot any day between 8:00 AM and 7:00 PM.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept secure online payments via Paystack. You can pay using M-Pesa, debit/credit cards, or bank transfers during the checkout process to secure your reservation.',
  },
  {
    q: 'Can I place a bulk or wholesale order?',
    a: 'Yes. For more than 10 trays we offer custom price breaks and delivery coordination — just reach us on WhatsApp at +254 722 237 593.',
  },
];

export default function LandingPage() {
  const { eggStats, loadingStats } = useCart();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="layout-wrapper">
      <Navbar />

      {/* Main Content */}
      <main className="main-content">
        
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-text-block">
              <span className="badge-fresh">
                <Sparkles size={14} className="accent-icon" /> Premium Grade AA Eggs
              </span>
              <h1>Pure. Fresh. Nanyuki.</h1>
              <div className="hero-trust-row">
                <span className="stars" aria-label="4.9 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={16} />)}
                </span>
                <span className="hero-trust-text"><strong>4.9/5</strong> from 1,200+ Nanyuki orders</span>
              </div>
              <p className="hero-desc">
                Welcome to Tabby Premium Eggs. Located in Nanyuki, Kenya, we focus on providing Grade AA quality eggs with a clean presentation, direct sourcing, and reliable delivery for Kenyan households, cafes, hotels, and retail kitchens.
              </p>
              
              {/* Egg Stock Urgency Bar */}
              <div className="inventory-banner glass" style={{ minHeight: '68px' }}>
                <div className="inventory-info">
                  <TrendingUp className="stat-trend-icon" size={20} />
                  <div>
                    <h4 className="inventory-status">
                      {loadingStats ? (
                        'Checking Stock...'
                      ) : eggStats.availableTrays > 0 ? (
                        `${eggStats.availableTrays} Trays Available`
                      ) : (
                        'Eggs Restocking Soon'
                      )}
                    </h4>
                    <p className="inventory-sub">Collected fresh in Nanyuki & calculated in real-time to prevent overbooking.</p>
                  </div>
                </div>
                <div className="stock-pill-wrapper" style={{ display: 'flex', alignItems: 'center', minHeight: '26px' }}>
                  {loadingStats ? (
                    <span className="stock-pill shimmer" style={{ opacity: 0.35, width: '120px', height: '22px', borderRadius: '9999px', display: 'inline-block' }}></span>
                  ) : eggStats.availableTrays > 0 ? (
                    <span className="stock-pill in-stock">Ready for Reservation</span>
                  ) : (
                    <span className="stock-pill out-of-stock">Restocking Today</span>
                  )}
                </div>
              </div>

              <div className="hero-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/shop" className="btn btn-primary">
                  Order Egg Trays <ArrowRight size={16} />
                </Link>
                <a 
                  href="https://wa.me/254722237593?text=Hi%20Tabby%20Premium%20Eggs%2C%20I%20would%20like%20to%20inquire%20about%20a%20bulk%20order..." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary"
                  style={{ border: '1px solid var(--border-color)', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}
                >
                  Bulk Orders WhatsApp
                </a>
              </div>
            </div>
            
            <div className="hero-image-block">
              <div className="hero-image-wrapper card-hover">
                <img 
                  src="/images/farm-hero.jpg" 
                  alt="Beautiful free-range chickens in pasture" 
                  className="hero-image"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="hero-image-fallback">
                  <div className="fallback-art">🐓🌾☀️</div>
                  <p>Tabby Premium Eggs (Nanyuki)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust / Stats Bar */}
        <section className="stats-section">
          <div className="container">
            <Reveal>
              <div className="stats-bar glass">
                {STATS.map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <span className="stats-divider" aria-hidden="true" />}
                    <div className="stat-item">
                      <span className="stat-value">{s.value}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Trusted By Marquee */}
        <section className="trusted-section">
          <div className="container">
            <p className="trusted-eyebrow">Trusted by Nanyuki homes &amp; businesses</p>
          </div>
          <div className="marquee">
            <div className="marquee-track">
              {[...TRUSTED, ...TRUSTED].map((name, i) => (
                <span className="trusted-item" key={i}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Quality Pillars Section */}
        <section className="pillars-section">
          <div className="container">
            <div className="section-header">
              <h2>Why Choose Tabby Premium Eggs?</h2>
              <p>We pride ourselves on maintaining the highest standards from feed to delivery.</p>
            </div>

            <div className="pillars-grid">
              <div className="pillar-card glass card-hover">
                <ShieldCheck className="pillar-icon" size={40} />
                <h3>Grade AA Quality</h3>
                <p>Features clean, strong shells with firm whites and rich golden yolks, ideal for baking, boiling, and everyday home cooking.</p>
              </div>

              <div className="pillar-card glass card-hover">
                <Sparkles className="pillar-icon" size={40} />
                <h3>Direct Farm Sourcing</h3>
                <p>Straight from our farm in Nanyuki with no middlemen, ensuring maximum shelf-life and absolute freshness when they reach you.</p>
              </div>

              <div className="pillar-card glass card-hover">
                <Truck className="pillar-icon" size={40} />
                <h3>Reliable Deliveries</h3>
                <p>Dedicated supply schedules and delivery coordination for Nanyuki households, restaurants, retail shops, and cafe kitchens.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section">
          <div className="container">
            <div className="section-header">
              <span className="chip chip-accent"><Star size={12} /> 4.9 / 5 from 1,200+ orders</span>
              <h2>Loved by Kitchens Across Nanyuki</h2>
              <p>Real words from the households, cafes, and hotels we supply every week.</p>
            </div>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 90}>
                  <figure className="testimonial-card glass card-hover">
                    <Quote className="testimonial-quote" size={28} />
                    <div className="stars" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={16} />)}
                    </div>
                    <blockquote>{t.quote}</blockquote>
                    <figcaption className="testimonial-author">
                      <span className="author-avatar" style={{ background: t.color }}>{t.initials}</span>
                      <span>
                        <strong>{t.name}</strong>
                        <span className="author-role">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Reservation Process Info */}
        <section className="info-section">
          <div className="container">
            <div className="section-header">
              <h2>How Your Reservation Works</h2>
              <p>Our real-time booking coordinates harvests with active customer orders to prevent overpromising.</p>
            </div>

            <div className="info-grid">
              <div className="info-card glass">
                <span className="step-num">1</span>
                <Calendar className="info-icon" size={24} />
                <h3>Choose & Schedule</h3>
                <p>Browse our catalog and add Standard or Large trays to your cart. Select a pickup date at least 24 hours in advance.</p>
              </div>
              <div className="info-card glass">
                <span className="step-num">2</span>
                <ShoppingBag className="info-icon" size={24} />
                <h3>Live Stock Hold</h3>
                <p>Once you click submit, our database reserves your eggs directly from our collected stock, locking them in safely.</p>
              </div>
              <div className="info-card glass">
                <span className="step-num">3</span>
                <CheckCircle className="info-icon" size={24} />
                <h3>Secure Online Payment</h3>
                <p>Pay securely via Paystack using M-Pesa or card at checkout, then collect your fresh trays on your scheduled date from our Nanyuki depot.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section">
          <div className="container faq-container">
            <div className="section-header">
              <span className="chip">Questions</span>
              <h2>Everything You Need to Know</h2>
              <p>Quick answers about freshness, pickup, and payment.</p>
            </div>
            <div className="faq-list">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <Reveal key={i} delay={i * 60}>
                    <div className={`faq-item glass ${open ? 'open' : ''}`}>
                      <button
                        className="faq-question"
                        onClick={() => setOpenFaq(open ? null : i)}
                        aria-expanded={open}
                      >
                        <span>{f.q}</span>
                        {open ? <Minus size={18} /> : <Plus size={18} />}
                      </button>
                      <div className="faq-answer" style={{ maxHeight: open ? '320px' : '0' }}>
                        <p>{f.a}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call To Action Block */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-card glass card-hover">
              <div className="cta-content">
                <h2>Ready for Farm-Fresh Trays?</h2>
                <p>Select your tray quantities from our online catalog today to lock in your booking.</p>
                <div className="cta-trust">
                  <span className="chip"><ShieldCheck size={12} /> Grade AA Guarantee</span>
                  <span className="chip"><Leaf size={12} /> Farm Fresh Daily</span>
                  <span className="chip"><Clock size={12} /> 24hr Reservation</span>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <Link href="/shop" className="btn btn-primary">
                    Go to Shop Catalog <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              <div className="cta-graphics">🥚🥚🥚</div>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      <style jsx>{`
        /* Hero Styling */
        .hero-section {
          padding: 5rem 0;
          position: relative;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-text-block {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .badge-fresh {
          display: inline-flex;
          align-self: flex-start;
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
        }

        .hero-text-block h1 {
          font-size: 3.5rem;
          line-height: 1.1;
          color: var(--primary-color);
        }

        .hero-desc {
          font-size: 1.15rem;
          color: var(--fg-muted);
          line-height: 1.6;
        }

        /* Inventory alert card in hero */
        .inventory-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          gap: 1.5rem;
        }

        .inventory-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-trend-icon {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.08);
          padding: 0.4rem;
          border-radius: 50%;
          box-sizing: content-box;
        }

        .inventory-status {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .inventory-sub {
          font-size: 0.8rem;
          color: var(--fg-muted);
        }

        .stock-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          text-transform: uppercase;
        }

        .stock-pill.in-stock {
          background-color: rgba(64, 145, 108, 0.15);
          color: var(--success-color);
        }

        .stock-pill.out-of-stock {
          background-color: rgba(217, 4, 41, 0.15);
          color: var(--error-color);
        }

        .hero-actions {
          margin-top: 0.5rem;
        }

        /* Hero Image */
        .hero-image-block {
          position: relative;
        }

        .hero-image-wrapper {
          border-radius: var(--radius-lg);
          overflow: hidden;
          aspect-ratio: 4 / 3;
          border: 1px solid var(--border-color);
          background-color: var(--bg-card-solid);
          position: relative;
          box-shadow: 0 10px 40px rgba(27, 67, 50, 0.05);
        }

        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-image-fallback {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(var(--accent-rgb), 0.08));
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          z-index: -1;
        }

        .fallback-art {
          font-size: 3.5rem;
        }

        .hero-image-fallback p {
          font-family: var(--font-display);
          color: var(--primary-color);
          font-weight: 600;
        }

        /* Pillars Section */
        .pillars-section {
          padding: 5rem 0;
          background-color: transparent;
        }

        .section-header {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 3.5rem auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-header h2 {
          font-size: 2.25rem;
          color: var(--primary-color);
        }

        .section-header p {
          color: var(--fg-muted);
          font-size: 1.05rem;
        }

        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .pillar-card {
          padding: 2.5rem 2rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border: 1px solid var(--border-color);
          text-align: center;
          align-items: center;
        }

        .pillar-icon {
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.05);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          box-sizing: content-box;
        }

        .pillar-card h3 {
          font-size: 1.35rem;
          color: var(--primary-color);
        }

        .pillar-card p {
          color: var(--fg-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* How it works info cards */
        .info-section {
          padding: 5rem 0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5rem;
        }

        .info-card {
          padding: 2.25rem;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid var(--border-color);
          position: relative;
        }

        .step-num {
          position: absolute;
          top: -1.25rem;
          left: 2.25rem;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: var(--primary-color);
          color: var(--primary-fg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.1rem;
          border: 3px solid var(--bg-color);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        .info-icon {
          color: var(--accent-dark);
          margin-top: 0.5rem;
        }

        .info-card h3 {
          color: var(--primary-color);
          font-size: 1.2rem;
        }

        .info-card p {
          color: var(--fg-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* CTA Section */
        .cta-section {
          padding: 5rem 0;
        }

        .cta-card {
          padding: 4rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          display: grid;
          grid-template-columns: 2fr 1fr;
          align-items: center;
          gap: 2rem;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-bottom: 0.75rem;
        }

        .cta-content p {
          color: var(--fg-muted);
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .cta-graphics {
          font-size: 4rem;
          text-align: center;
          opacity: 0.8;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        /* Hero trust row */
        .hero-trust-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .hero-trust-text {
          font-size: 0.9rem;
          color: var(--fg-muted);
        }
        .hero-trust-text strong { color: var(--primary-color); }

        /* Stats bar */
        .stats-section { padding: 1rem 0 2rem 0; }
        .stats-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 1rem;
          padding: 1.75rem 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          flex-wrap: wrap;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1 1 120px;
        }
        .stat-value {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 2rem;
          line-height: 1.1;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-dark));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-label {
          font-size: 0.85rem;
          color: var(--fg-muted);
          margin-top: 0.35rem;
          font-weight: 600;
        }
        .stats-divider {
          width: 1px;
          align-self: stretch;
          background: var(--border-color-solid);
        }

        /* Trusted-by marquee */
        .trusted-section { padding: 2rem 0 3rem 0; }
        .trusted-eyebrow {
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--fg-muted);
          margin-bottom: 1.5rem;
          font-family: var(--font-display);
        }
        .trusted-item {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--primary-color);
          opacity: 0.55;
          white-space: nowrap;
          transition: opacity var(--transition-fast);
        }
        .trusted-item:hover { opacity: 1; }

        /* Testimonials */
        .testimonials-section { padding: 4rem 0; }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .testimonial-card {
          position: relative;
          padding: 2.25rem 2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }
        .testimonial-quote {
          color: var(--accent-color);
          opacity: 0.5;
        }
        .testimonial-card blockquote {
          color: var(--fg-color);
          font-size: 1rem;
          line-height: 1.65;
          flex-grow: 1;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-top: 0.5rem;
        }
        .author-avatar {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          flex-shrink: 0;
        }
        .testimonial-author strong {
          display: block;
          color: var(--primary-color);
          font-family: var(--font-display);
        }
        .author-role {
          font-size: 0.82rem;
          color: var(--fg-muted);
        }

        /* FAQ */
        .faq-section { padding: 4rem 0; }
        .faq-container { max-width: 760px; }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .faq-item {
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: border-color var(--transition-normal);
        }
        .faq-item.open { border-color: rgba(var(--primary-rgb), 0.25); }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--primary-color);
        }
        .faq-question svg { flex-shrink: 0; color: var(--accent-dark); }
        .faq-answer {
          overflow: hidden;
          transition: max-height var(--transition-slow);
        }
        .faq-answer p {
          padding: 0 1.5rem 1.35rem 1.5rem;
          color: var(--fg-muted);
          line-height: 1.65;
          font-size: 0.97rem;
        }

        /* CTA trust chips */
        .cta-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 1.25rem;
        }

        @media (max-width: 900px) {
          .testimonials-grid { grid-template-columns: 1fr; }
          .stats-divider { display: none; }
          .stat-item { flex: 1 1 40%; }
        }

        @media (max-width: 992px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .hero-section {
            padding: 3rem 0;
          }
          .pillars-grid, .info-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .pillars-section, .info-section, .cta-section {
            padding: 3rem 0;
          }
          .cta-card {
            grid-template-columns: 1fr;
            padding: 2.5rem;
            text-align: center;
          }
          .cta-graphics {
            display: none;
          }
          .step-num {
            top: 1.5rem;
            left: auto;
            right: 1.5rem;
          }
          .section-header {
            margin-bottom: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .hero-text-block h1 {
            font-size: 2.5rem;
          }
          .hero-desc {
            font-size: 1rem;
          }
          .inventory-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1rem;
          }
          .section-header h2 {
            font-size: 1.75rem;
          }
          .section-header p {
            font-size: 0.95rem;
          }
          .cta-content h2 {
            font-size: 1.75rem;
          }
          .cta-card {
            padding: 2rem 1.5rem;
          }
          .pillar-card {
            padding: 2rem 1.5rem;
          }
          .info-card {
            padding: 1.75rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .hero-section {
            padding: 2rem 0;
          }
          .hero-text-block h1 {
            font-size: 2rem;
          }
          .badge-fresh {
            font-size: 0.75rem;
            padding: 0.3rem 0.7rem;
          }
          .hero-text-block {
            gap: 1rem;
          }
          .pillars-section, .info-section, .cta-section {
            padding: 2.5rem 0;
          }
          .pillar-card h3 {
            font-size: 1.15rem;
          }
          .info-card h3 {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </div>
  );
}
