import type { AreaSeed, HotelSeed, PlaceSeed } from '../../../types';
import * as bali from './bali';
import * as phuQuoc from './phu-quoc';
import * as daNangHoiAn from './da-nang-hoi-an';
import * as hoChiMinhCity from './ho-chi-minh-city';
import * as hanoi from './hanoi';
import * as siemReap from './siem-reap';
import * as phnomPenh from './phnom-penh';
import * as cebu from './cebu';
import * as boracay from './boracay';
import * as palawan from './palawan';
// Malaysia — added after the ten-destination pass.
import * as penang from './penang';
import * as kualaLumpur from './kuala-lumpur';

/**
 * Geography added to the dataset after the first pass.
 *
 * One module per destination, so ten authors can work without touching a shared
 * file, and so the coverage table can be read against a single directory. The
 * original seed files are untouched: a record that was already verified keeps its
 * own provenance rather than being rewritten.
 */
const MODULES = [
  bali, phuQuoc, daNangHoiAn, hoChiMinhCity, hanoi, siemReap, phnomPenh, cebu, boracay, palawan,
  penang, kualaLumpur,
];

export const extraAreas: AreaSeed[] = MODULES.flatMap((module) => module.areas);
export const extraHotels: HotelSeed[] = MODULES.flatMap((module) => module.hotels);
export const extraPlaces: PlaceSeed[] = MODULES.flatMap((module) => module.places);
