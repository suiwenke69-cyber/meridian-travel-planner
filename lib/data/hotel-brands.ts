import type { HotelBrand } from '../types';

/**
 * Brand registry. Adding a brand is a one-line data change — no UI edits.
 * `positioning` is the *only* input to price-tier inference so that tiers stay
 * consistent and explainable.
 */
export const HOTEL_BRANDS: HotelBrand[] = [
  // --- Marriott Bonvoy ------------------------------------------------------
  { id: 'st-regis', name: 'St. Regis', group: 'marriott', positioning: 'ultra-luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'ritz-carlton', name: 'Ritz-Carlton', group: 'marriott', positioning: 'ultra-luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'w-hotels', name: 'W Hotels', group: 'marriott', positioning: 'ultra-luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'edition', name: 'EDITION', group: 'marriott', positioning: 'ultra-luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'luxury-collection', name: 'The Luxury Collection', group: 'marriott', positioning: 'ultra-luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'jw-marriott', name: 'JW Marriott', group: 'marriott', positioning: 'luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'westin', name: 'Westin', group: 'marriott', positioning: 'luxury', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'sheraton', name: 'Sheraton', group: 'marriott', positioning: 'upper-upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'marriott', name: 'Marriott', group: 'marriott', positioning: 'upper-upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'le-meridien', name: 'Le Méridien', group: 'marriott', positioning: 'upper-upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'renaissance', name: 'Renaissance', group: 'marriott', positioning: 'upper-upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'autograph-collection', name: 'Autograph Collection', group: 'marriott', positioning: 'upper-upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'tribute-portfolio', name: 'Tribute Portfolio', group: 'marriott', positioning: 'upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'courtyard', name: 'Courtyard', group: 'marriott', positioning: 'upscale', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'four-points', name: 'Four Points by Sheraton', group: 'marriott', positioning: 'select', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'aloft', name: 'Aloft', group: 'marriott', positioning: 'select', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'moxy', name: 'Moxy', group: 'marriott', positioning: 'select', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'fairfield', name: 'Fairfield by Marriott', group: 'marriott', positioning: 'select', loyaltyProgramme: 'Marriott Bonvoy' },
  { id: 'element', name: 'Element by Westin', group: 'marriott', positioning: 'upscale', loyaltyProgramme: 'Marriott Bonvoy' },

  // --- Hilton Honors --------------------------------------------------------
  { id: 'waldorf-astoria', name: 'Waldorf Astoria', group: 'hilton', positioning: 'ultra-luxury', loyaltyProgramme: 'Hilton Honors' },
  { id: 'lxr', name: 'LXR Hotels & Resorts', group: 'hilton', positioning: 'ultra-luxury', loyaltyProgramme: 'Hilton Honors' },
  { id: 'conrad', name: 'Conrad', group: 'hilton', positioning: 'luxury', loyaltyProgramme: 'Hilton Honors' },
  { id: 'signia', name: 'Signia by Hilton', group: 'hilton', positioning: 'luxury', loyaltyProgramme: 'Hilton Honors' },
  { id: 'hilton', name: 'Hilton', group: 'hilton', positioning: 'upper-upscale', loyaltyProgramme: 'Hilton Honors' },
  { id: 'curio-collection', name: 'Curio Collection', group: 'hilton', positioning: 'upper-upscale', loyaltyProgramme: 'Hilton Honors' },
  { id: 'canopy', name: 'Canopy by Hilton', group: 'hilton', positioning: 'upscale', loyaltyProgramme: 'Hilton Honors' },
  { id: 'doubletree', name: 'DoubleTree by Hilton', group: 'hilton', positioning: 'upscale', loyaltyProgramme: 'Hilton Honors' },
  { id: 'tapestry-collection', name: 'Tapestry Collection', group: 'hilton', positioning: 'upscale', loyaltyProgramme: 'Hilton Honors' },
  { id: 'hilton-garden-inn', name: 'Hilton Garden Inn', group: 'hilton', positioning: 'select', loyaltyProgramme: 'Hilton Honors' },
  { id: 'hampton', name: 'Hampton by Hilton', group: 'hilton', positioning: 'select', loyaltyProgramme: 'Hilton Honors' },
  { id: 'tru', name: 'Tru by Hilton', group: 'hilton', positioning: 'select', loyaltyProgramme: 'Hilton Honors' },
  /**
   * Small Luxury Hotels of the World is a Hilton Honors *partner*, not a Hilton
   * brand. It is in the registry so partner properties can be modelled honestly
   * rather than silently dropped or mislabelled as "Hilton".
   */
  {
    id: 'slh',
    name: 'Small Luxury Hotels of the World (Hilton Honors partner)',
    group: 'hilton',
    positioning: 'luxury',
    loyaltyProgramme: 'Hilton Honors',
  },
];

const BY_ID = new Map(HOTEL_BRANDS.map((b) => [b.id, b]));

export function getHotelBrand(id: string): HotelBrand | undefined {
  return BY_ID.get(id);
}

const POSITIONING_TIER: Record<HotelBrand['positioning'], number> = {
  'ultra-luxury': 4,
  luxury: 4,
  'upper-upscale': 3,
  upscale: 2,
  select: 1,
};

/**
 * Derives a price TIER (never a price) from brand positioning.
 * The UI always shows `priceTierBasis` next to the tier so the user knows this
 * is positioning-based, not live pricing.
 */
export function inferPriceTier(brandId: string): { tier: '$' | '$$' | '$$$' | '$$$$'; basis: string } {
  const brand = BY_ID.get(brandId);
  if (!brand) return { tier: '$$$', basis: 'Unknown brand — defaulted to mid tier' };
  const score = POSITIONING_TIER[brand.positioning];
  const tier = (['$', '$$', '$$$', '$$$$'] as const)[Math.min(3, Math.max(0, score - 1))];
  return {
    tier,
    basis: `${brand.name} is positioned as ${brand.positioning.replace('-', ' ')} within ${brand.loyaltyProgramme}`,
  };
}

export const HOTEL_GROUPS = [
  { id: 'marriott' as const, name: 'Marriott Bonvoy', short: 'Marriott', programme: 'Marriott Bonvoy', color: '#123A5C' },
  { id: 'hilton' as const, name: 'Hilton Honors', short: 'Hilton', programme: 'Hilton Honors', color: '#33384A' },
];

export function getHotelGroup(id: string) {
  return HOTEL_GROUPS.find((g) => g.id === id);
}
