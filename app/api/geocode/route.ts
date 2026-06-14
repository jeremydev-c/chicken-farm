import { NextResponse } from 'next/server';

/**
 * GET /api/geocode
 *
 * Free address lookup powered by OpenStreetMap's Nominatim service.
 * This server-side proxy keeps us compliant with Nominatim's usage policy
 * (sets a descriptive User-Agent, avoids browser CORS) and biases results
 * toward Nanyuki, Kenya.
 *
 * Modes:
 *   ?q=<text>            -> address autocomplete / search (returns array)
 *   ?lat=<n>&lon=<n>     -> reverse geocode coordinates (returns single result)
 *
 * No API key or billing is required.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Identify the app per Nominatim policy. Update the email if it changes.
const USER_AGENT = 'TabbyPremiumEggs/1.0 (orders@tabbyeggs.co.ke)';

// Bounding box focused on the greater Nanyuki area (lon/lat corners).
const NANYUKI_VIEWBOX = '36.80,-0.25,37.45,0.30';

interface NominatimPlace {
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  address?: Record<string, string>;
}

function simplify(place: NominatimPlace) {
  return {
    label: place.display_name || place.name || '',
    lat: place.lat ? parseFloat(place.lat) : undefined,
    lon: place.lon ? parseFloat(place.lon) : undefined,
  };
}

async function nominatimFetch(url: string) {
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en',
      Referer: 'https://tabbyeggs.co.ke',
    },
    cache: 'no-store',
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // Reverse geocode (from GPS coordinates)
    if (lat && lon) {
      const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}`;
      const res = await nominatimFetch(url);
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Reverse geocoding failed' },
          { status: 502 }
        );
      }
      const data = (await res.json()) as NominatimPlace;
      return NextResponse.json({ result: simplify(data) });
    }

    // Forward search / autocomplete
    if (q && q.trim().length >= 3) {
      const url =
        `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6` +
        `&countrycodes=ke&bounded=1&viewbox=${NANYUKI_VIEWBOX}` +
        `&q=${encodeURIComponent(q.trim())}`;
      const res = await nominatimFetch(url);
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Address search failed' },
          { status: 502 }
        );
      }
      const data = (await res.json()) as NominatimPlace[];
      const results = Array.isArray(data) ? data.map(simplify) : [];
      return NextResponse.json({ results });
    }

    return NextResponse.json({ results: [] });
  } catch (err) {
    return NextResponse.json(
      { error: 'Geocoding service unavailable' },
      { status: 502 }
    );
  }
}
