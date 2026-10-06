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

export const HOTEL_LAYERS: MarkerLayer[] = ['marriott', 'hilton'];
export const PLACE_LAYERS: MarkerLayer[] = ['activity', 'nature', 'beach', 'food', 'nightlife'];
export const LOGISTICS_LAYERS: MarkerLayer[] = ['airport', 'transport'];

export function layerLabel(layer: MarkerLayer): string {
  return LAYER_BY_ID[layer]?.label ?? layer;
}

export function layerColor(layer: MarkerLayer): string {
  return LAYER_BY_ID[layer]?.color ?? '#5C6470';
}
