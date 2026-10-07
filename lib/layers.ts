import type { MarkerLayer } from './types';

/**
 * Single source of truth for map layers.
 *
 * The legend, the filter UI and the marker renderer all read from this list, so
 * adding a layer is a data change. `defaultOn` reflects the "does this help a
 * traveller decide where to stay?" test: hotels and airports yes, nightlife no.
 */
export interface LayerMeta {
  id: MarkerLayer;
  label: string;
  description: string;
  color: string;
  group: 'hotel' | 'place' | 'logistics';
  defaultOn: boolean;
  /** Short glyph hint used in the legend (mirrors the map marker). */
  legend: string;
}

export const LAYERS: LayerMeta[] = [
  {
    id: 'marriott',
    label: 'Marriott Bonvoy',
    description: 'Every Marriott property in the dataset. Square markers marked “M”.',
    color: '#123A5C',
    group: 'hotel',
    defaultOn: true,
    legend: 'M',
  },
  {
    id: 'hilton',
    label: 'Hilton Honors',
    description: 'Every Hilton property in the dataset. Round markers marked “H”.',
    color: '#33384A',
    group: 'hotel',
    defaultOn: true,
    legend: 'H',
  },
  {
    id: 'ihg',
    label: 'IHG One Rewards',
    description: 'InterContinental, Kimpton, Hotel Indigo, Crowne Plaza, Holiday Inn and Six Senses. Hexagonal markers marked “I”.',
    color: '#8E1B33',
    group: 'hotel',
    defaultOn: true,
    legend: 'I',
  },
  {
    id: 'hyatt',
    label: 'World of Hyatt',
    description: 'Park Hyatt, Andaz, Alila, Grand Hyatt, Hyatt Regency and Thompson. Diamond markers marked “Y”.',
    color: '#1B6E6A',
    group: 'hotel',
    defaultOn: true,
    legend: 'Y',
  },
  {
    id: 'gha',
    label: 'GHA DISCOVERY',
    description: 'An alliance, not a hotel company. Anantara, Kempinski, Pan Pacific, Capella, The Fullerton and other members. Bronze markers marked “G”.',
    color: '#8A6D2F',
    group: 'hotel',
    defaultOn: true,
    legend: 'G',
  },
  {
    id: 'activity',
    label: 'Activities',
    description: 'Temples, treks, classes, day trips and beach clubs.',
    color: '#C2643A',
    group: 'place',
    defaultOn: true,
    legend: '✦',
  },
  {
    id: 'nature',
    label: 'Nature',
    description: 'Waterfalls, rice terraces, volcanoes and viewpoints.',
    color: '#3F7D4E',
    group: 'place',
    defaultOn: true,
    legend: '▲',
  },
  {
    id: 'beach',
    label: 'Beaches',
    description: 'Swimmable beaches and surf breaks.',
    color: '#2A7C9E',
    group: 'place',
    defaultOn: true,
    legend: '≈',
  },
  {
    id: 'food',
    label: 'Food',
    description: 'Warungs, beach grills and destination restaurants.',
    color: '#9C5A2E',
    group: 'place',
    defaultOn: true,
    legend: '🍴',
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    description: 'Bars, beach clubs after dark and live music.',
    color: '#5B4B8A',
    group: 'place',
    defaultOn: false,
    legend: '☾',
  },
  {
    id: 'airport',
    label: 'Airport',
    description: 'Arrival and departure airports with transfer times.',
    color: '#2F3437',
    group: 'logistics',
    defaultOn: true,
    legend: '✈',
  },
  {
    id: 'transport',
    label: 'Transport',
    description: 'Harbours, ferry terminals and long-distance departure points.',
    color: '#5C6470',
    group: 'logistics',
    defaultOn: true,
    legend: '⛟',
  },
];

export const LAYER_BY_ID: Record<MarkerLayer, LayerMeta> = LAYERS.reduce(
  (acc, layer) => {
    acc[layer.id] = layer;
    return acc;
  },
  {} as Record<MarkerLayer, LayerMeta>,
);

export function defaultLayerVisibility(): Record<MarkerLayer, boolean> {
  return LAYERS.reduce(
    (acc, layer) => {
      acc[layer.id] = layer.defaultOn;
      return acc;
    },
    {} as Record<MarkerLayer, boolean>,
  );
}

export const HOTEL_LAYERS: MarkerLayer[] = ['marriott', 'hilton', 'ihg', 'hyatt', 'gha'];
export const PLACE_LAYERS: MarkerLayer[] = ['activity', 'nature', 'beach', 'food', 'nightlife'];
export const LOGISTICS_LAYERS: MarkerLayer[] = ['airport', 'transport'];

export function layerLabel(layer: MarkerLayer): string {
  return LAYER_BY_ID[layer]?.label ?? layer;
}

export function layerColor(layer: MarkerLayer): string {
  return LAYER_BY_ID[layer]?.color ?? '#5C6470';
}

/**
 * A record keyed by every layer, filled with one value.
 *
 * The counts object and the visibility map used to be written out by hand in
 * three files, which meant adding a sixth loyalty programme produced a type
 * error in each of them — better than silently dropping a layer, but still three
 * places to remember. Deriving them from LAYERS makes the list the only place
 * that knows how many layers exist.
 */
export function layerRecord<T>(value: T): Record<MarkerLayer, T> {
  return LAYERS.reduce(
    (acc, layer) => {
      acc[layer.id] = value;
      return acc;
    },
    {} as Record<MarkerLayer, T>,
  );
}

/** Zeroed counts, for the marker and legend tallies. */
export function zeroLayerCounts(): Record<MarkerLayer, number> {
  return layerRecord(0);
}

/** Only the loyalty layers switched on — the STAY tab's default scope. */
export function hotelLayerVisibility(): Record<MarkerLayer, boolean> {
  const record = layerRecord(false);
  for (const layer of HOTEL_LAYERS) record[layer] = true;
  return record;
}
