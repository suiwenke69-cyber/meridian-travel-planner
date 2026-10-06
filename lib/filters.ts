import type { Hotel, HotelGroupId, HotelStyle, Place, PlaceCategory, PriceTier } from './types';

/**
 * Map filter model.
 *
 * Filters are pure data + pure functions so the same logic drives the desktop
 * sidebar, the mobile filter sheet and the marker counts in the legend.
 * Empty arrays mean "no restriction", which keeps the default state obvious.
 */

export interface MapFilters {
  query: string;
  /** Empty = both loyalty programmes. */
  hotelGroups: HotelGroupId[];
  /** Empty = all price tiers. */
  priceTiers: PriceTier[];
  /** Empty = all styles. */
  hotelStyles: HotelStyle[];
  /** Empty = all categories. */
  placeCategories: PlaceCategory[];
}

export const DEFAULT_FILTERS: MapFilters = {
  query: '',
  hotelGroups: [],
  priceTiers: [],
  hotelStyles: [],
  placeCategories: [],
};

export const PRICE_TIERS: PriceTier[] = ['$', '$$', '$$$', '$$$$'];

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  $: 'Budget / select',
  $$: 'Mid-range',
  $$$: 'Upscale',
  $$$$: 'Luxury',
};

export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function matchesQuery(haystack: string[], query: string): boolean {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return haystack.some((value) => value.toLowerCase().includes(needle));
}

export function filterHotels(hotels: Hotel[], filters: MapFilters, areaNameById?: Map<string, string>): Hotel[] {
  return hotels.filter((hotel) => {
    if (filters.hotelGroups.length > 0 && !filters.hotelGroups.includes(hotel.hotelGroup)) return false;
    if (filters.priceTiers.length > 0 && !filters.priceTiers.includes(hotel.priceTier)) return false;
    if (filters.hotelStyles.length > 0 && !filters.hotelStyles.some((style) => hotel.tags.includes(style))) return false;
    if (
      !matchesQuery(
        [
          hotel.name,
          hotel.brand,
          hotel.description,
          hotel.propertyType,
          hotel.loyaltyProgramme,
          areaNameById?.get(hotel.areaId) ?? hotel.areaId,
          ...hotel.tags,
        ],
        filters.query,
      )
    ) {
      return false;
    }
    return true;
  });
}

export function filterPlaces(places: Place[], filters: MapFilters, areaNameById?: Map<string, string>): Place[] {
  return places.filter((place) => {
    if (filters.placeCategories.length > 0 && !filters.placeCategories.includes(place.category)) return false;
    if (
      !matchesQuery(
        [
          place.name,
          place.subcategory,
          place.description,
          place.bestTime,
          areaNameById?.get(place.areaId) ?? place.areaId,
          ...place.tags,
        ],
        filters.query,
      )
    ) {
      return false;
    }
    return true;
  });
}

export function activeFilterCount(filters: MapFilters): number {
  return (
    filters.hotelGroups.length +
    filters.priceTiers.length +
    filters.hotelStyles.length +
    filters.placeCategories.length +
    (filters.query.trim() ? 1 : 0)
  );
}

export function hasActiveFilters(filters: MapFilters): boolean {
  return activeFilterCount(filters) > 0;
}

/**
 * Travel-style profiles. Used by the trip setup step to pre-select sensible
 * filters, and by the destination page to suggest an itinerary shape.
 */
export interface StyleProfile {
  id: string;
  label: string;
  /** Hotel style tags this profile leans on. Empty = no hotel preference. */
  hotelStyles: HotelStyle[];
  /** Place categories this profile leans on. Empty = no place preference. */
  placeCategories: PlaceCategory[];
  blurb: string;
}

export const STYLE_PROFILES: StyleProfile[] = [
  {
    id: 'Beach',
    label: 'Beach',
    hotelStyles: ['Beach', 'Resort'],
    placeCategories: ['beach'],
    blurb: 'Sand, calm water and beachfront properties.',
  },
  {
    id: 'Luxury',
    label: 'Luxury',
    hotelStyles: ['Luxury'],
    placeCategories: ['activity', 'food'],
    blurb: 'Ultra-luxury and luxury brands, with a slower daily pace.',
  },
  {
    id: 'Couple',
    label: 'Couples',
    hotelStyles: ['Couple', 'Luxury'],
    placeCategories: ['activity', 'food', 'beach'],
    blurb: 'Sunset spots, quiet resorts and good restaurants.',
  },
  {
    id: 'Family',
    label: 'Family',
    hotelStyles: ['Family', 'Resort'],
    placeCategories: ['beach', 'nature', 'activity'],
    blurb: 'Calm swimming, short transfers and easy days.',
  },
  {
    id: 'Nightlife',
    label: 'Nightlife',
    hotelStyles: ['Nightlife', 'City'],
    placeCategories: ['nightlife', 'food'],
    blurb: 'Beach clubs, bars and later starts.',
  },
  {
    id: 'Nature',
    label: 'Nature',
    hotelStyles: ['Resort'],
    placeCategories: ['nature'],
    blurb: 'Waterfalls, rice terraces, volcanoes and viewpoints.',
  },
  {
    id: 'Surfing',
    label: 'Surfing',
    hotelStyles: ['Beach', 'Nightlife'],
    placeCategories: ['beach'],
    blurb: 'Breaks, board hire and the surf towns around them.',
  },
  {
    id: 'Diving',
    label: 'Diving',
    hotelStyles: ['Resort'],
    placeCategories: ['nature', 'transport'],
    blurb: 'Reef and wreck sites, plus the boats that reach them.',
  },
  {
    id: 'Culture',
    label: 'Culture',
    hotelStyles: ['City', 'Luxury'],
    placeCategories: ['activity', 'food'],
    blurb: 'Temples, markets and heritage sites.',
  },
];

export function styleProfile(id: string): StyleProfile | undefined {
  return STYLE_PROFILES.find((p) => p.id === id);
}
