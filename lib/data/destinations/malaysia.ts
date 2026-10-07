import type { DestinationSeed } from '../../types';
import { destination as penangDestination } from './extra/penang';
import { destination as kualaLumpurDestination } from './extra/kuala-lumpur';

/**
 * Malaysia.
 *
 * The areas arrive through the extra-geography aggregator, which is also where
 * these destinations' hotels and places live, so the seed's own `areas` array is
 * emptied here. Carrying both put every Penang area in the dataset twice, which
 * the validator caught as a duplicate id — the same class of mistake as adding a
 * record to two registries "to be safe".
 *
 * `starters.ts` holds the nine destinations from the previous pass; naming is
 * historical rather than meaningful.
 */
export const malaysiaDestinations: DestinationSeed[] = [
  { ...penangDestination, areas: [] },
  { ...kualaLumpurDestination, areas: [] },
];
