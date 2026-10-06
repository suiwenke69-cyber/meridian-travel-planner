import type { AreaSeed } from '../types';

/**
 * The two-or-three word line that sits under an area name.
 *
 * Authored rather than generated, because this is the single fastest piece of
 * information in the product: it is what a traveller reads on the map to decide
 * whether a region is for them. A derived string ("Beach · Surf · Nightlife ·
 * Luxury resorts") is longer, flatter and useless at marker scale.
 */
export const AREA_TAGLINES: Record<string, string> = {
  canggu: 'Surf · Cafés',
  seminyak: 'Food · Nightlife',
  ubud: 'Nature · Culture',
  uluwatu: 'Cliffs · Sunsets',
  'nusa-dua': 'Luxury resorts',
  sanur: 'Calm · Island ferries',
  'kuta-legian': 'Airport · Surf lessons',
  jimbaran: 'Seafood · Sunsets',
  amed: 'Diving · Quiet coast',
  'nusa-penida': 'Cliffs · Day trip',
  kintamani: 'Volcano · Sunrise',
  tabanan: 'Rice terraces · Temple',
  karangasem: 'Mount Agung · Temples',
  tampaksiring: 'Water temple',
  denpasar: 'City · Markets',
  'west-bali': 'Sunset temple',
  'north-bali': 'Highlands · Lakes',
  'east-bali': 'Diving · Heritage',
};

/** Fallback for destinations without an authored tagline. */
export function deriveTagline(area: AreaSeed): string {
  return area.bestFor.slice(0, 2).join(' · ');
}

/**
 * Display order for stay areas.
 *
 * Sorting by "amount of stuff" put the resort enclave first, which is a
 * reasonable metric and the wrong editorial choice: the regions that define a
 * first trip to Bali should be met in the order travellers actually consider
 * them. Anything not listed follows, ordered by substance.
 */
export const AREA_ORDER: string[] = [
  'seminyak',
  'canggu',
  'ubud',
  'uluwatu',
  'nusa-dua',
  'sanur',
  'jimbaran',
  'kuta-legian',
  'amed',
];

export const ZONE_ORDER: string[] = [
  'nusa-penida',
  'north-bali',
  'east-bali',
  'tampaksiring',
  'tabanan',
  'denpasar',
];

export function areaRank(id: string, order: string[]): number {
  const index = order.indexOf(id);
  return index === -1 ? order.length : index;
}
