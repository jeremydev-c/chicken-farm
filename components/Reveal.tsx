'use client';

import React, { useEffect, useRef, useState } from 'react';

type RevealProps = {
  children: React.ReactNode;
  /** Animation delay in milliseconds */
  delay?: number;
  /** Direction the element travels from while revealing */
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  /** Optional className passed through to the wrapper */
  className?: string;
  /** Render as an inline-friendly element when needed */
  as?: 'div' | 'span' | 'li';
};

/**
 * Lightweight scroll-reveal wrapper using IntersectionObserver.
 * Reveals children once when they scroll into view. Respects
 * prefers-reduced-motion by rendering content immediately.
 */
export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${direction} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
