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
  { id: 'indonesia', name: 'Indonesia', nameZh: '印度尼西亚', countryCode: 'ID', flag: '🇮🇩' },
  { id: 'vietnam', name: 'Vietnam', nameZh: '越南', countryCode: 'VN', flag: '🇻🇳' },
  { id: 'cambodia', name: 'Cambodia', nameZh: '柬埔寨', countryCode: 'KH', flag: '🇰🇭' },
  { id: 'philippines', name: 'Philippines', nameZh: '菲律宾', countryCode: 'PH', flag: '🇵🇭' },
  { id: 'malaysia', name: 'Malaysia', nameZh: '马来西亚', countryCode: 'MY', flag: '🇲🇾' },
  { id: 'thailand', name: 'Thailand', nameZh: '泰国', countryCode: 'TH', flag: '🇹🇭' },
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
