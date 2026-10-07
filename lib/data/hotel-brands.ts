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

  // --- IHG One Rewards ------------------------------------------------------
  { id: 'six-senses', name: 'Six Senses', group: 'ihg', positioning: 'ultra-luxury', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'regent', name: 'Regent', group: 'ihg', positioning: 'ultra-luxury', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'intercontinental', name: 'InterContinental', group: 'ihg', positioning: 'luxury', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'kimpton', name: 'Kimpton', group: 'ihg', positioning: 'luxury', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'voco', name: 'voco', group: 'ihg', positioning: 'upper-upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'hotel-indigo', name: 'Hotel Indigo', group: 'ihg', positioning: 'upper-upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'crowne-plaza', name: 'Crowne Plaza', group: 'ihg', positioning: 'upper-upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'even-hotels', name: 'EVEN Hotels', group: 'ihg', positioning: 'upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'holiday-inn', name: 'Holiday Inn', group: 'ihg', positioning: 'upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'holiday-inn-resort', name: 'Holiday Inn Resort', group: 'ihg', positioning: 'upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'staybridge', name: 'Staybridge Suites', group: 'ihg', positioning: 'upscale', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'holiday-inn-express', name: 'Holiday Inn Express', group: 'ihg', positioning: 'select', loyaltyProgramme: 'IHG One Rewards' },
  { id: 'vignette-collection', name: 'Vignette Collection', group: 'ihg', positioning: 'luxury', loyaltyProgramme: 'IHG One Rewards' },

  // --- World of Hyatt -------------------------------------------------------
  { id: 'park-hyatt', name: 'Park Hyatt', group: 'hyatt', positioning: 'ultra-luxury', loyaltyProgramme: 'World of Hyatt' },
  { id: 'alila', name: 'Alila', group: 'hyatt', positioning: 'ultra-luxury', loyaltyProgramme: 'World of Hyatt' },
  { id: 'andaz', name: 'Andaz', group: 'hyatt', positioning: 'luxury', loyaltyProgramme: 'World of Hyatt' },
  { id: 'thompson', name: 'Thompson Hotels', group: 'hyatt', positioning: 'luxury', loyaltyProgramme: 'World of Hyatt' },
  { id: 'grand-hyatt', name: 'Grand Hyatt', group: 'hyatt', positioning: 'luxury', loyaltyProgramme: 'World of Hyatt' },
  { id: 'hyatt-regency', name: 'Hyatt Regency', group: 'hyatt', positioning: 'upper-upscale', loyaltyProgramme: 'World of Hyatt' },
  { id: 'hyatt-centric', name: 'Hyatt Centric', group: 'hyatt', positioning: 'upper-upscale', loyaltyProgramme: 'World of Hyatt' },
  { id: 'caption', name: 'Caption by Hyatt', group: 'hyatt', positioning: 'upscale', loyaltyProgramme: 'World of Hyatt' },
  { id: 'hyatt-place', name: 'Hyatt Place', group: 'hyatt', positioning: 'select', loyaltyProgramme: 'World of Hyatt' },
  { id: 'hyatt-house', name: 'Hyatt House', group: 'hyatt', positioning: 'select', loyaltyProgramme: 'World of Hyatt' },
  /**
   * Hyatt's soft brands.
   *
   * Added after an author found Nam Nghi Phu Quoc — the only Hyatt-affiliated
   * OPEN property on that island — and correctly refused to write it, because
   * there was no brandId for the collection it belongs to. A registry that is
   * missing a real brand does not make the hotel disappear; it makes the author
   * either drop a real property or file it under the wrong brand. Both are worse
   * than one more line here.
   */
  { id: 'unbound-collection', name: 'The Unbound Collection by Hyatt', group: 'hyatt', positioning: 'luxury', loyaltyProgramme: 'World of Hyatt' },
  { id: 'destination-by-hyatt', name: 'Destination by Hyatt', group: 'hyatt', positioning: 'upper-upscale', loyaltyProgramme: 'World of Hyatt' },
  { id: 'jdv-by-hyatt', name: 'JdV by Hyatt', group: 'hyatt', positioning: 'upscale', loyaltyProgramme: 'World of Hyatt' },

  // --- GHA DISCOVERY --------------------------------------------------------
  /**
   * GHA is a CONSORTIUM, not a hotel company.
   *
   * Its members are independently owned or independently managed brands that
   * share one loyalty programme and one cross-brand recognition scheme. Modelled
   * as its own programme because that is how a traveller actually experiences it
   * — one GHA DISCOVERY account across Anantara, Kempinski and Pan Pacific — and
   * the UI says "alliance" rather than implying a parent company that does not
   * exist. Same honesty as the SLH entry above.
   */
  { id: 'anantara', name: 'Anantara', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'kempinski', name: 'Kempinski', group: 'gha', positioning: 'ultra-luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'avani', name: 'Avani', group: 'gha', positioning: 'upper-upscale', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'capella', name: 'Capella', group: 'gha', positioning: 'ultra-luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'fullerton', name: 'The Fullerton', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'pan-pacific', name: 'Pan Pacific', group: 'gha', positioning: 'upper-upscale', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'parkroyal', name: 'PARKROYAL', group: 'gha', positioning: 'upper-upscale', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'oasia', name: 'Oasia', group: 'gha', positioning: 'upscale', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'niccolo', name: 'Niccolo', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'marcopolo', name: 'Marco Polo', group: 'gha', positioning: 'upper-upscale', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'tivoli', name: 'Tivoli', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'viceroy', name: 'Viceroy', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'sunway', name: 'Sunway Hotels & Resorts', group: 'gha', positioning: 'upper-upscale', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'kata-rocks', name: 'Kata Rocks', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
  { id: 'sinae', name: 'Sinae', group: 'gha', positioning: 'luxury', loyaltyProgramme: 'GHA DISCOVERY' },
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

/**
 * The five programmes, in the order the STAY filter and the legend show them.
 *
 * `alliance` is true only for GHA: its "brands" are independent companies that
 * share a loyalty scheme, and the UI labels it accordingly rather than implying
 * a parent group.
 */
export const HOTEL_GROUPS = [
  { id: 'marriott' as const, name: 'Marriott Bonvoy', short: 'Marriott', programme: 'Marriott Bonvoy', color: '#123A5C', alliance: false },
  { id: 'hilton' as const, name: 'Hilton Honors', short: 'Hilton', programme: 'Hilton Honors', color: '#33384A', alliance: false },
  { id: 'ihg' as const, name: 'IHG One Rewards', short: 'IHG', programme: 'IHG One Rewards', color: '#8E1B33', alliance: false },
  { id: 'hyatt' as const, name: 'World of Hyatt', short: 'Hyatt', programme: 'World of Hyatt', color: '#1B6E6A', alliance: false },
  { id: 'gha' as const, name: 'GHA DISCOVERY', short: 'GHA', programme: 'GHA DISCOVERY', color: '#8A6D2F', alliance: true },
];

export function getHotelGroup(id: string) {
  return HOTEL_GROUPS.find((g) => g.id === id);
}
