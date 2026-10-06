import type { DestinationSeed } from '../../types';
import { baliAirports, baliAreas } from './bali-places';

/**
 * BALI — the reference destination.
 *
 * This module holds only the destination-level narrative. The geography lives in
 * `./bali-places` and the hotel inventory in `./bali-hotels`; both were produced
 * by coordinate-verification passes, so they are kept separate from hand-written
 * copy and can be regenerated without touching the prose.
 *
 * Data rules that apply to the whole Bali dataset:
 *   - No prices anywhere. Hotel cost is a tier derived from brand positioning.
 *   - Every coordinate carries a confidence value and, where it is not
 *     survey-grade, an explicit note saying what the point actually marks.
 *   - Flight times and carriers are curated sample data, not live schedules.
 */

export { baliAreas, baliAirports, baliPlaces } from './bali-places';
export { baliHotels } from './bali-hotels';

export const bali: DestinationSeed = {
  id: 'bali',
  name: 'Bali',
  country: 'Indonesia',
  countryCode: 'ID',
  flag: '🇮🇩',
  region: 'indonesia',
  status: 'reference',
  tagline: 'One island, several entirely different holidays',
  description:
    'Bali packs a beach town, a surf coast, a cultural highland and a resort enclave into an island you can cross in a day — which is exactly why planning it well is a spatial problem. Where you base yourself decides how much of your trip you spend in traffic.',
  coordinates: { lat: -8.4095, lng: 115.1889, confidence: 'verified', coordNote: 'Island centre' },
  mapView: { center: [-8.62, 115.19], zoom: 10 },
  mapBounds: [
    [-8.92, 114.95],
    [-8.05, 115.78],
  ],
  recommendedDays: { min: 4, ideal: 6, max: 10 },
  tags: ['Beach', 'Surf', 'Culture', 'Nature', 'Nightlife', 'Luxury'],
  bestFor: ['Beaches', 'Surf', 'Nightlife', 'Luxury resorts', 'Culture', 'Couples', 'Wellness'],
  currency: 'IDR',
  timezone: 'GMT+8 (WITA)',
  language: 'Indonesian, Balinese',
  visaNote:
    'Singapore passport holders get a visa on arrival for Indonesia (fee applies) covering 30 days, extendable once. Verify the current rules before travel — they change.',
  originNotes: [
    'SIN → DPS is one of the busiest short-haul routes in the region, with non-stop flights from several carriers.',
    'Bali runs on WITA (GMT+8) — the same time zone as Singapore, so there is no jet lag.',
    'The island is small but slow: allow 45–90 minutes for any cross-island drive, more at peak hours.',
    'The Bukit peninsula (Uluwatu) and Ubud are effectively separate trips from a Nusa Dua base.',
  ],
  airports: baliAirports,
  areas: baliAreas,
  provenance: {
    kind: 'curated-static',
    sources: [
      'Areas, airport, temples, beaches and landmarks: a bulk Wikidata bounding-box query, the Wikipedia coordinates API, and OpenStreetMap (Nominatim element ids plus the OSM map API).',
      'Hotel locations: OpenStreetMap property geometries cross-checked against brand-published map links and sourced infobox coordinates.',
      'Airport transfer ranges: road-time estimates that absorb Bali traffic variance. Not live traffic.',
    ],
    reviewedOn: '2025-01-01',
    notes:
      'Curated static data. No prices, no live availability and no live flight data. Hotel cost is a brand-positioning tier. 44 of the 48 mapped places resolved to a specific point; the other 4 are drawn with an "approximate" badge.',
  },
};
