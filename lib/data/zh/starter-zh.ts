/**
 * Chinese for the nine non-Bali destinations.
 *
 * WHY THIS IS A SEPARATE OVERLAY FILE
 * -----------------------------------
 * Chinese was authored inline for Bali and for everything added in the expansion
 * pass, but the ORIGINAL records for the other nine destinations predate the
 * Chinese-first decision and never got it — so 河内's hotel cards read in English
 * while 巴厘岛's were Chinese.
 *
 * Writing it here rather than editing nine data files keeps the geography records
 * (which are coordinate-verified and reviewed as such) free of presentation data,
 * and it means one file can be read end to end to check the Chinese is authored
 * rather than machine-translated.
 *
 * The same shape as `bali-zh.ts`, which this deliberately mirrors.
 */

export interface StarterAreaZh {
  nameZh?: string;
  taglineZh?: string;
  summaryZh?: string;
  vibeZh?: string;
  bestForZh?: string[];
  weakForZh?: string[];
  idealForZh?: string[];
}

export interface StarterHotelZh {
  nameZh?: string;
  descriptionZh?: string;
}

export interface StarterPlaceZh {
  nameZh?: string;
  descriptionZh?: string;
  bestTimeZh?: string;
  tagsZh?: string[];
  notesZh?: string;
  entryFeeZh?: string;
}

import * as vietnam from './overlay/vietnam';
// Covers the three Vietnam cities; loaded last so its corrected names win.
import * as vietnamCities from './overlay/vietnam-cities';
import * as cambodiaPhilippines from './overlay/cambodia-philippines';
import * as baliHotels from './overlay/bali-hotels';

const MODULES = [vietnam, cambodiaPhilippines, baliHotels, vietnamCities];

/**
 * Merged in module order, so a later module can correct an earlier one.
 *
 * Modules are single-purpose: `bali-hotels` authors only the HOTELS map, so the
 * aggregation reads each map defensively rather than requiring every author to
 * export three empty objects they have nothing to say about.
 */
type Overlay = { AREAS?: Record<string, StarterAreaZh>; HOTELS?: Record<string, StarterHotelZh>; PLACES?: Record<string, StarterPlaceZh> };
const merge = <K extends keyof Overlay>(key: K): NonNullable<Overlay[K]> =>
  Object.assign({}, ...(MODULES as Overlay[]).map((module) => module[key] ?? {}));

export const STARTER_AREA_ZH = merge('AREAS');
export const STARTER_HOTEL_ZH = merge('HOTELS');
export const STARTER_PLACE_ZH = merge('PLACES');
