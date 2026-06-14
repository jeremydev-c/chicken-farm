'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Loader2, Search } from 'lucide-react';

interface SelectPayload {
  address: string;
  lat?: number;
  lng?: number;
}

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSelect?: (data: SelectPayload) => void;
}

interface Suggestion {
  label: string;
  lat?: number;
  lon?: number;
}

/**
 * Free address autocomplete for Nanyuki delivery customers, powered by
 * OpenStreetMap via our /api/geocode proxy. Includes a "Use my location"
 * button that reverse-geocodes the device's GPS position.
 * No API key or billing required.
 */
export default function AddressAutocomplete({
  id,
  value,
  required,
  placeholder,
  onChange,
  onSelect,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const skipNextSearch = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search as the user types
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const term = value.trim();
    if (term.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (!cancelled) {
          setSuggestions(Array.isArray(data.results) ? data.results : []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 450); // respect Nominatim rate limits

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  const handlePick = (s: Suggestion) => {
    skipNextSearch.current = true;
    onChange(s.label);
    onSelect?.({ address: s.label, lat: s.lat, lng: s.lon });
    setSuggestions([]);
    setOpen(false);
    setStatusMsg('');
  };

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      setStatusMsg('Location is not supported on this device.');
      return;
    }
    setGeoLoading(true);
    setStatusMsg('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const label = data?.result?.label as string | undefined;
          skipNextSearch.current = true;
          if (label) {
            onChange(label);
            onSelect?.({ address: label, lat: latitude, lng: longitude });
            setStatusMsg('Location found. Edit the address if needed.');
          } else {
            // Fall back to raw coordinates if no address was resolved
            const coordText = `Near ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            onChange(coordText);
            onSelect?.({ address: coordText, lat: latitude, lng: longitude });
            setStatusMsg('Pinned your coordinates. Please add a landmark.');
          }
          setOpen(false);
        } catch {
          setStatusMsg('Could not look up your address. Please type it in.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setStatusMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please type your address.'
            : 'Could not get your location. Please type your address.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="addr-wrap" ref={containerRef}>
      <div className="addr-input-row">
        <Search size={16} className="addr-search-icon" />
        <input
          type="text"
          id={id}
          required={required}
          autoComplete="off"
          value={value}
          placeholder={placeholder || 'Start typing your area, street or landmark…'}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          className="addr-input"
        />
        {loading && <Loader2 size={16} className="addr-spin" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="addr-suggestions">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => handlePick(s)}>
                <MapPin size={14} />
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="use-location-btn"
        onClick={handleUseLocation}
        disabled={geoLoading}
      >
        {geoLoading ? <Loader2 size={15} className="addr-spin" /> : <LocateFixed size={15} />}
        {geoLoading ? 'Locating…' : 'Use my current location'}
      </button>

      {statusMsg && <span className="addr-status">{statusMsg}</span>}

      <style jsx>{`
        .addr-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .addr-input-row {
          position: relative;
          display: flex;
          align-items: center;
        }
        .addr-search-icon {
          position: absolute;
          left: 0.85rem;
          color: var(--fg-muted);
          pointer-events: none;
        }
        .addr-input {
          width: 100%;
          padding-left: 2.4rem !important;
        }
        .addr-spin {
          position: absolute;
          right: 0.85rem;
          color: var(--primary-color);
          animation: addr-spin 1s linear infinite;
        }
        @keyframes addr-spin {
          to { transform: rotate(360deg); }
        }
        .addr-suggestions {
          position: absolute;
          top: calc(100% + 0.35rem);
          left: 0;
          right: 0;
          z-index: 40;
          list-style: none;
          margin: 0;
          padding: 0.35rem;
          background: var(--bg-card-solid);
          border: 1px solid var(--border-color-solid);
          border-radius: var(--radius-sm);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
          max-height: 260px;
          overflow-y: auto;
        }
        .addr-suggestions li button {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 0.6rem 0.65rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.88rem;
          color: var(--fg-color);
          line-height: 1.35;
          transition: background-color var(--transition-fast);
        }
        .addr-suggestions li button:hover {
          background-color: rgba(var(--primary-rgb), 0.08);
        }
        .addr-suggestions li button :global(svg) {
          color: var(--accent-dark);
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .use-location-btn {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.07);
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .use-location-btn:hover:not(:disabled) {
          background: rgba(var(--primary-rgb), 0.14);
        }
        .use-location-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .addr-status {
          font-size: 0.78rem;
          color: var(--fg-muted);
        }
      `}</style>
    </div>
  );
}
