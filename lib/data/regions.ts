import type { Geocoded, Region, RegionId } from '../types';

/**
 * The origin is a first-class entity: this product is built around departures
 * from Singapore. Changi is the default; Seletar is included so the model does
 * not assume a single airport.
 */
export interface OriginAirport {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  coordinates: Geocoded;
}

export interface Origin {
  id: 'singapore';
  name: string;
  label: string;
  country: string;
  countryCode: string;
  flag: string;
  coordinates: Geocoded;
  airports: OriginAirport[];
  note: string;
}

export const SINGAPORE_ORIGIN: Origin = {
  id: 'singapore',
  name: 'Singapore',
  label: 'Home / Origin',
  country: 'Singapore',
  countryCode: 'SG',
  flag: '🇸🇬',
  // Marina Bay / civic centre — used as the "you are here" anchor on the region map.
  coordinates: { lat: 1.3521, lng: 103.8198, confidence: 'verified', coordNote: 'Singapore city centre' },
  airports: [
    {
      id: 'sin',
      code: 'SIN',
      name: 'Singapore Changi Airport',
      city: 'Singapore',
      country: 'Singapore',
      coordinates: { lat: 1.3644, lng: 103.9915, confidence: 'verified', coordNote: 'Changi Airport terminals' },
    },
    {
      id: 'xsp',
      code: 'XSP',
      name: 'Seletar Airport',
      city: 'Singapore',
      country: 'Singapore',
      coordinates: { lat: 1.4169, lng: 103.8678, confidence: 'verified', coordNote: 'Seletar Aerospace Park' },
    },
  ],
  note: 'Changi (SIN) is the default departure airport for all routes in this planner.',
};

export const REGIONS: Region[] = [
  { id: 'indonesia', name: 'Indonesia', countryCode: 'ID', flag: '🇮🇩' },
  { id: 'vietnam', name: 'Vietnam', countryCode: 'VN', flag: '🇻🇳' },
  { id: 'cambodia', name: 'Cambodia', countryCode: 'KH', flag: '🇰🇭' },
  { id: 'philippines', name: 'Philippines', countryCode: 'PH', flag: '🇵🇭' },
  { id: 'malaysia', name: 'Malaysia', countryCode: 'MY', flag: '🇲🇾' },
  { id: 'thailand', name: 'Thailand', countryCode: 'TH', flag: '🇹🇭' },
];

export function getRegion(id: RegionId): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

/** Initial camera for the Southeast Asia overview. */
export const SEA_MAP_VIEW = {
  center: [8.2, 110.5] as [number, number],
  zoom: 5,
  bounds: [
    [-1.5, 95.0],
    [23.5, 128.0],
  ] as [[number, number], [number, number]],
};
