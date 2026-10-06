import type { MarkerLayer } from '@/lib/types';

/**
 * Marker visual system.
 *
 * Accessibility rule: colour is NEVER the only differentiator. Every layer gets
 *   - a distinct glyph (SVG),
 *   - a distinct head silhouette where it matters (Marriott = rounded square,
 *     Hilton = circle, airport = ringed circle),
 *   - a text label exposed through `aria-label` and a Leaflet tooltip.
 *
 * Hotel groups also carry their initial as a letter-mark so the two loyalty
 * programmes are distinguishable in greyscale and at a glance.
 */

export interface MarkerVisual {
  html: string;
  className: string;
  size: [number, number];
  anchor: [number, number];
}

export interface MarkerVisualOptions {
  layer: MarkerLayer;
  /** 1-based position inside the active day's route. Renders instead of the glyph. */
  order?: number;
  selected?: boolean;
  dimmed?: boolean;
  /** Small letter/emoji shown in the corner badge. */
  groupMark?: string;
  label?: string;
  /** Highlighted because the parent hovered the matching itinerary row. */
  emphasised?: boolean;
}

const HEAD = 26;
const HEAD_SELECTED = 32;
const TAIL = 8;

/** 24x24 viewBox glyphs. Simple, hand-verified geometry — no icon font, no deps. */
const GLYPHS: Record<string, string> = {
  // Top-down aeroplane silhouette.
  plane: '<path d="M12 2.2 13.9 9 21.6 13.1v1.9l-7.7-2v4.3l2.9 2.3v1.6L12 20.3l-4.8.9v-1.6l2.9-2.3v-4.3l-7.7 2v-1.9L10.1 9z"/>',
  // Mountain / nature.
  mountain: '<path d="M1.8 19.6 9 6.7l4.3 7.9 2.6-4.2 6.3 9.2z"/>',
  // Beach: sun over a wave.
  beach:
    '<circle cx="17.4" cy="6.2" r="3.1"/><path d="M1.6 14.4c1.8-2.3 3.6-2.3 5.4 0s3.6 2.3 5.4 0 3.6-2.3 5.4 0 3.6 2.3 5.4 0v3.4c-1.8 2.3-3.6 2.3-5.4 0s-3.6-2.3-5.4 0-3.6 2.3-5.4 0-3.6-2.3-5.4 0z"/>',
  // Food: fork and knife.
  food:
    '<path d="M6.4 2.2v6.6a2 2 0 0 0 4 0V2.2h-1.5v5h-1v-5zM8.4 11.4v10.4M17.6 2.2c-1.5 1.9-2.3 3.9-2.3 5.9 0 1.6.8 2.6 2.3 2.6s2.3-1 2.3-2.6c0-2-.8-4-2.3-5.9zM17.6 11.2v10.6"/>',
  // Nightlife: crescent moon.
  moon: '<path d="M20.5 15.2A8.6 8.6 0 0 1 8.8 3.5a8.6 8.6 0 1 0 11.7 11.7z"/>',
  // Transport: bus / shuttle.
  bus:
    '<path d="M4.6 16.8V6.4A2.4 2.4 0 0 1 7 4h10a2.4 2.4 0 0 1 2.4 2.4v10.4M4.6 16.8h14.8M4.6 16.8V19h2.6v-2.2m9.6 0V19h2.6v-2.2M4.6 10.6h14.8M8.2 13.6h.02M15.8 13.6h.02"/>',
  // Activity: four-point sparkle.
  sparkle: '<path d="M12 2.4 14.3 9 21 11.4 14.3 13.8 12 20.4 9.7 13.8 3 11.4 9.7 9z"/>',
  // Star used for the Singapore origin flag on the region map.
  star: '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"/>',
};

const LETTER_GLYPH = (letter: string) =>
  `<span class="mk__letter" aria-hidden="true">${letter}</span>`;

const ORDER_GLYPH = (order: number) =>
  `<span class="mk__order" aria-hidden="true">${order}</span>`;

function glyphFor(layer: MarkerLayer): string {
  switch (layer) {
    case 'airport':
      return GLYPHS.plane;
    case 'transport':
      return GLYPHS.bus;
    case 'nature':
      return GLYPHS.mountain;
    case 'beach':
      return GLYPHS.beach;
    case 'food':
      return GLYPHS.food;
    case 'nightlife':
      return GLYPHS.moon;
    case 'activity':
    default:
      return GLYPHS.sparkle;
  }
}

export function svgGlyph(name: keyof typeof GLYPHS, size = 14): string {
  return `<svg class="mk__glyph" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" focusable="false">${GLYPHS[name]}</svg>`;
}

function headContent(layer: MarkerLayer, order?: number): string {
  if (typeof order === 'number') return ORDER_GLYPH(order);
  if (layer === 'marriott') return LETTER_GLYPH('M');
  if (layer === 'hilton') return LETTER_GLYPH('H');
  if (layer === 'airport') return `<span class="mk__glyph-wrap">${svgGlyph('plane', 15)}</span>`;
  const map: Partial<Record<MarkerLayer, keyof typeof GLYPHS>> = {
    activity: 'sparkle',
    nature: 'mountain',
    beach: 'beach',
    food: 'food',
    nightlife: 'moon',
    transport: 'bus',
  };
  const key = map[layer] ?? 'sparkle';
  return `<span class="mk__glyph-wrap">${svgGlyph(key, 14)}</span>`;
}

export function markerVisual(options: MarkerVisualOptions): MarkerVisual {
  const { layer, order, selected, dimmed, label, groupMark, emphasised } = options;
  const size = selected || emphasised ? HEAD_SELECTED : HEAD;
  const totalH = size + TAIL;
  const totalW = size;
  const classes = [
    'mk',
    `mk--${layer}`,
    selected ? 'mk--selected' : '',
    emphasised ? 'mk--emphasised' : '',
    dimmed ? 'mk--dimmed' : '',
    typeof order === 'number' ? 'mk--numbered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const badge = groupMark ? `<span class="mk__badge" aria-hidden="true">${groupMark}</span>` : '';
  const aria = label ? ` aria-label="${escapeHtml(label)}"` : '';

  const html = `<div class="${classes}"${aria}>
  <div class="mk__head" style="width:${size}px;height:${size}px">${headContent(layer, order)}</div>
  <div class="mk__tail" style="border-top-width:${TAIL}px"></div>
  ${badge}
</div>`;

  return {
    html,
    className: 'mk-host',
    size: [totalW, totalH],
    anchor: [totalW / 2, totalH],
  };
}

/** Cluster bubble — shows the count and the dominant category colour. */
export function clusterVisual(count: number, dominantLayer: MarkerLayer): MarkerVisual {
  const size = count > 50 ? 46 : count > 10 ? 40 : 34;
  const html = `<div class="mk-cluster mk-cluster--${dominantLayer}" aria-label="${count} places">
  <span class="mk-cluster__count">${count}</span>
</div>`;
  return {
    html,
    className: 'mk-host',
    size: [size, size],
    anchor: [size / 2, size / 2],
  };
}

/**
 * The Singapore origin marker on the Southeast Asia overview.
 *
 * The only DOM marker on the homepage. Destinations are native map layers, but
 * the origin deserves a bespoke, unmistakable treatment: an accent star that
 * reads as "you are here" rather than as another destination pin.
 */
export function originVisual(
  selected: boolean,
  labels: { name: string; meta: string } = { name: 'Singapore', meta: 'Home · Origin' },
): MarkerVisual {
  const size = selected ? 22 : 20;
  const html = `<div class="mm-origin" aria-label="${escapeHtml(labels.name)}">
  <span class="mm-origin__star" style="width:${size}px;height:${size}px">${svgGlyph('star', Math.round(size * 0.62))}</span>
  <span class="mm-origin__text">
    <span class="mm-origin__name">${escapeHtml(labels.name)}</span>
    <span class="mm-origin__meta">${escapeHtml(labels.meta)}</span>
  </span>
</div>`;
  return {
    html,
    className: 'mm-marker',
    size: [size, size],
    anchor: [size / 2, size / 2],
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Layer → CSS variable colour, mirrored in tailwind.config.ts. */
export const LAYER_COLORS: Record<MarkerLayer, string> = {
  marriott: '#123A5C',
  hilton: '#33384A',
  activity: '#C2643A',
  nature: '#3F7D4E',
  beach: '#2A7C9E',
  food: '#9C5A2E',
  nightlife: '#5B4B8A',
  transport: '#5C6470',
  airport: '#2F3437',
};
