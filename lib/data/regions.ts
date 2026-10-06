import type { Region, RegionId } from '../types';

/*
 * The origin model used to live here as a single hard-coded Singapore record.
 * It now lives in `lib/data/origins.ts` as an eleven-city dataset, because
 * Singapore stopped being the only place a traveller can leave from.
 */

/**
 * Destination regions.
 *
 * These group DESTINATIONS on the map. They are deliberately separate from
 * `ORIGIN_REGIONS` in `lib/data/origins.ts`: 长三角 is a group of departure
 * cities and Indonesia is a group of destinations, and treating them as one kind
 * of thing would make both wrong.
 */
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
