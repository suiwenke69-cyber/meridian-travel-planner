import { NextResponse } from 'next/server';

/**
 * External place resolution, step 3 of the pipeline (§10, §11).
 *
 * WHY THIS IS A ROUTE AND NOT A CLIENT CALL
 * -----------------------------------------
 * `GOOGLE_PLACES_API_KEY` cannot ship to a browser. The published site is a
 * static export on GitHub Pages, so this handler is not deployed there at all —
 * the client falls back to Meridian's own dataset, the alias table and the manual
 * pin, which is a complete workflow without ever contacting Google (§13).
 *
 * WHY THE FIELD MASK IS THE WHOLE COST STORY (§12)
 * ------------------------------------------------
 * Google bills by SKU, and the cheapest useful SKU is the one that returns an id,
 * a name and a location. So that is all this route ever asks for:
 *
 *   places.id, places.displayName, places.formattedAddress,
 *   places.location, places.primaryType
 *
 * Notably absent, and deliberately so: `places.rating`, `places.photos`,
 * `places.openingHours`, `places.internationalPhoneNumber`, `places.priceLevel`,
 * `places.reviews`. Every one of those is a more expensive SKU, and — more to the
 * point — every one of them is a claim Meridian would then be showing a traveller
 * without having verified it, which the rest of this product does not do.
 *
 * WHY IT IS ONLY EVER CALLED AFTER MERIDIAN FAILS
 * ----------------------------------------------
 * The client runs its own matcher first and only reaches this route for a name
 * nothing local recognises. Combined with the 90-day client cache and the alias
 * learned when a traveller confirms a hit, the steady state is zero calls: the
 * first import of a guide costs a handful of lookups, and every later import of
 * the same guide costs none.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResolveBody {
  query?: unknown;
  destinationId?: unknown;
  areaHint?: unknown;
  entityType?: unknown;
  localityHint?: unknown;
}

/**
 * A rectangle around each destination, so a place search cannot return a
 * same-named venue on another island.
 *
 * Cheap to check, and it catches the single most common failure of a text place
 * search: "La Brisa" exists in Canggu and in at least three other countries.
 */
const DESTINATION_BOUNDS: Record<string, { low: { lat: number; lng: number }; high: { lat: number; lng: number } }> = {
  bali: { low: { lat: -8.95, lng: 114.4 }, high: { lat: -8.05, lng: 115.75 } },
  'phu-quoc': { low: { lat: 9.85, lng: 103.8 }, high: { lat: 10.45, lng: 104.15 } },
  'da-nang-hoi-an': { low: { lat: 15.75, lng: 107.9 }, high: { lat: 16.2, lng: 108.45 } },
  'ho-chi-minh-city': { low: { lat: 10.6, lng: 106.5 }, high: { lat: 10.95, lng: 106.85 } },
  hanoi: { low: { lat: 20.85, lng: 105.65 }, high: { lat: 21.2, lng: 106.0 } },
  'siem-reap': { low: { lat: 13.2, lng: 103.7 }, high: { lat: 13.55, lng: 104.05 } },
  'phnom-penh': { low: { lat: 11.4, lng: 104.75 }, high: { lat: 11.7, lng: 105.0 } },
  cebu: { low: { lat: 10.15, lng: 123.75 }, high: { lat: 10.5, lng: 124.1 } },
  boracay: { low: { lat: 11.9, lng: 121.85 }, high: { lat: 12.05, lng: 122.05 } },
  palawan: { low: { lat: 9.6, lng: 118.3 }, high: { lat: 10.3, lng: 119.0 } },
};

/**
 * Categories we deliberately do NOT ask Google about.
 *
 * An `area` is a neighbourhood, not a business, and a place search for 长谷
 * returns a scatter of unrelated venues that happen to carry the word. Areas
 * belong to Meridian's own dataset, where they are authored. `transport` is
 * included because a guide's meeting point genuinely needs a real coordinate.
 */
const SEARCHABLE_TYPES = new Set([
  'restaurant',
  'cafe',
  'beachclub',
  'bar',
  'beach',
  'nature',
  'culture',
  'activity',
  'hotel',
  'shopping',
  'wellness',
  'transport',
  'unknown',
]);

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
}

export async function POST(request: Request) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    /*
     * 200 with `configured: false`, deliberately.
     *
     * A non-2xx here would be logged by every browser as a console error, and
     * this is not an error: it is the documented state of every deployment that
     * has not configured a Places key. The client reads the flag and goes
     * straight to the manual pin, which is a supported end state.
     */
    return NextResponse.json({ candidates: [], configured: false });
  }

  let body: ResolveBody;
  try {
    body = (await request.json()) as ResolveBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json', candidates: [] }, { status: 400 });
  }

  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 160) : '';
  const destinationId = typeof body.destinationId === 'string' ? body.destinationId : 'bali';
  const areaHint = typeof body.areaHint === 'string' ? body.areaHint : undefined;
  const entityType = typeof body.entityType === 'string' ? body.entityType : 'unknown';

  if (query.length < 2) return NextResponse.json({ candidates: [] });
  if (!SEARCHABLE_TYPES.has(entityType)) return NextResponse.json({ candidates: [], skipped: 'not_searchable' });

  const bounds = DESTINATION_BOUNDS[destinationId];
  if (!bounds) return NextResponse.json({ candidates: [], skipped: 'unknown_destination' });

  const requestBody: Record<string, unknown> = {
    // §12: the cheapest useful SKU, and nothing more.
    textQuery: query,
    languageCode: 'zh-CN',
    regionCode: 'ID',
    maxResultCount: 5,
    locationRestriction: { rectangle: bounds },
  };

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': key,
        // The mask is where the cost is decided, so it is a literal here and
        // never comes from the client.
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      // A 429 is reported, not retried — a retry storm is how a small bill
      // becomes a large one, and the traveller can still pin the place by hand.
      return NextResponse.json({ candidates: [], error: `places_${response.status}` });
    }

    const payload = (await response.json()) as { places?: GooglePlace[] };
    const candidates = (payload.places ?? [])
      .filter(
        (place): place is GooglePlace & { id: string; location: { latitude: number; longitude: number } } =>
          typeof place.id === 'string' &&
          typeof place.location?.latitude === 'number' &&
          typeof place.location?.longitude === 'number',
      )
      .map((place) => ({
        providerId: 'google_places' as const,
        providerPlaceId: place.id,
        name: place.displayName?.text ?? query,
        address: place.formattedAddress,
        lat: place.location.latitude,
        lng: place.location.longitude,
        category: place.primaryType,
      }));

    return NextResponse.json({ candidates, areaHint });
  } catch {
    return NextResponse.json({ candidates: [], error: 'places_unreachable' });
  }
}
