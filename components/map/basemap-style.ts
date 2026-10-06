import type { StyleSpecification } from 'maplibre-gl';

/**
 * The Meridian basemap.
 *
 * WHY WE AUTHOR OUR OWN STYLE
 * ---------------------------
 * Raster tiles bake their labels into the pixels, so no amount of CSS can make
 * them calmer. The previous build used OpenStreetMap raster tiles and the result
 * read as a developer demo: dense place names, motorway shields, POI noise and
 * mixed-language labels all competing with our own destination markers.
 *
 * This file defines the basemap from scratch over a vector source. That gives us
 * the three things the product actually needs:
 *
 *   1. Far fewer labels. Country → state → major city → town. No villages, no
 *      suburbs, no hamlets, no road names, no house numbers, no POIs, no
 *      waterway names. Our markers are always the loudest thing on the map.
 *   2. English labels. `name_en` is preferred everywhere, falling back to `name`
 *      only when no English form exists.
 *   3. Our palette. Land, water, borders and roads all resolve to the same
 *      warm-neutral tokens the rest of the interface uses.
 *
 * We deliberately do NOT load a vendor style JSON at runtime: a remote style can
 * change or start watermarking without warning, and we would have no control
 * over label density. The tiles are the vendor's; the cartography is ours.
 *
 * Tile sources below are both free and keyless. CARTO is primary because its
 * cartography is closest to the calm "Positron" look we want; OpenFreeMap is the
 * fallback and is used automatically if CARTO's tiles start failing.
 */

export const BASEMAP_PALETTE = {
  land: '#F7F5EF',
  landUrban: '#EFEDE5',
  vegetation: '#E6EEDC',
  /*
   * The sea carries more colour than the land on purpose. A cream island on a
   * cream sea has no edge, and the whole map reads as an empty wash — which is
   * exactly what an early build of this map looked like. A cooler, slightly
   * deeper sea plus a hairline coast gives the island a silhouette without
   * adding a single label or marker.
   */
  water: '#D2E1E8',
  waterLine: '#BFD3DD',
  coast: '#B6CCD8',
  borderCountry: '#CFCAC1',
  borderRegion: '#DCD8D0',
  roadCasing: '#D9D3C6',
  roadFill: '#FFFFFF',
  rail: '#E2DED6',
  building: '#EEECE6',
  labelCountry: '#93A0A6',
  labelRegion: '#A6AEB3',
  labelCity: '#4F5C63',
  labelTown: '#727D83',
} as const;

interface TileSource {
  id: 'carto' | 'openfreemap';
  label: string;
  tiles: string[];
  maxzoom: number;
  attribution: string;
}

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const CARTO_ATTRIBUTION = `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

export const BASEMAP_SOURCES: Record<TileSource['id'], TileSource> = {
  carto: {
    id: 'carto',
    label: 'CARTO Positron',
    tiles: [
      'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt',
      'https://tiles-b.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt',
      'https://tiles-c.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt',
      'https://tiles-d.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt',
    ],
    maxzoom: 14,
    attribution: CARTO_ATTRIBUTION,
  },
  openfreemap: {
    id: 'openfreemap',
    label: 'OpenFreeMap',
    // OpenFreeMap serves its planet tiles under a dated release path.
    tiles: ['https://tiles.openfreemap.org/planet/20250701/{z}/{x}/{y}.pbf'],
    maxzoom: 14,
    attribution: OSM_ATTRIBUTION,
  },
};

const GLYPHS: Record<TileSource['id'], string> = {
  // Both hosts serve Noto Sans Regular; using a single family also keeps the
  // map to one weight, which is calmer than mixing regular/medium/bold.
  carto: 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
  openfreemap: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
};

const MAP_FONT = ['Noto Sans Regular'];

/** English first, falling back only when no Latin form exists. */
const englishName = [
  'coalesce',
  ['get', 'name_en'],
  ['get', 'name:en'],
  ['get', 'name:latin'],
  ['get', 'name'],
] as const;

function sourcesFor(provider: TileSource['id']) {
  return {
    basemap: {
      type: 'vector' as const,
      tiles: BASEMAP_SOURCES[provider].tiles,
      maxzoom: BASEMAP_SOURCES[provider].maxzoom,
      attribution: BASEMAP_SOURCES[provider].attribution,
    },
  };
}

/**
 * Builds the style. `provider` selects the tile host; everything else — colours,
 * label set, language — is ours and identical across hosts.
 */
export function buildBasemapStyle(provider: TileSource['id'] = 'carto'): StyleSpecification {
  return {
    version: 8,
    name: 'Meridian',
    glyphs: GLYPHS[provider],
    sources: sourcesFor(provider),
    layers: [
      // --- ground -----------------------------------------------------------
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': BASEMAP_PALETTE.land },
      },
      {
        id: 'landcover',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'landcover',
        filter: ['any', ['==', ['get', 'class'], 'wood'], ['==', ['get', 'class'], 'grass']],
        paint: { 'fill-color': BASEMAP_PALETTE.vegetation, 'fill-opacity': 0.75 },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'park',
        paint: { 'fill-color': BASEMAP_PALETTE.vegetation, 'fill-opacity': 0.8 },
      },
      {
        id: 'residential',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'landuse',
        filter: ['==', ['get', 'class'], 'residential'],
        minzoom: 6,
        paint: {
          'fill-color': BASEMAP_PALETTE.landUrban,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.3, 10, 0.5, 14, 0.62],
        },
      },
      {
        id: 'industrial',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'landuse',
        filter: ['==', ['get', 'class'], 'industrial'],
        minzoom: 8,
        paint: { 'fill-color': BASEMAP_PALETTE.landUrban, 'fill-opacity': 0.6 },
      },

      // --- water ------------------------------------------------------------
      {
        id: 'water',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'water',
        paint: { 'fill-color': BASEMAP_PALETTE.water },
      },
      {
        /*
         * The coastline.
         *
         * Neither tile host ships a dedicated coastline layer, so we stroke the
         * outline of the water polygons. It draws lake and river edges too,
         * which is fine — at planning zoom those are useful. The value is the
         * coast: without this line the land/sea boundary was a 20-value colour
         * difference and the island had no readable silhouette.
         */
        id: 'water-outline',
        type: 'line',
        source: 'basemap',
        'source-layer': 'water',
        paint: {
          'line-color': BASEMAP_PALETTE.coast,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 9, 0.9, 13, 1.4],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 8, 0.85],
        },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'basemap',
        'source-layer': 'waterway',
        minzoom: 9,
        paint: {
          'line-color': BASEMAP_PALETTE.waterLine,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 14, 1.8],
        },
      },

      // --- boundaries (muted, never pink) -----------------------------------
      {
        id: 'boundary-region',
        type: 'line',
        source: 'basemap',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 4], ['==', ['get', 'maritime'], 0]],
        minzoom: 5,
        paint: {
          'line-color': BASEMAP_PALETTE.borderRegion,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 10, 1],
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'boundary-country',
        type: 'line',
        source: 'basemap',
        'source-layer': 'boundary',
        filter: ['all', ['==', ['get', 'admin_level'], 2], ['==', ['get', 'maritime'], 0]],
        paint: {
          'line-color': BASEMAP_PALETTE.borderCountry,
          'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.8, 6, 1.3, 12, 2],
        },
      },

      // --- roads: motorway, trunk and primary only, and only when you are
      //     close enough for them to mean something -------------------------
      {
        id: 'road-casing',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: [
          'all',
          ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
          ['!=', ['get', 'brunnel'], 'tunnel'],
        ],
        minzoom: 6,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': BASEMAP_PALETTE.roadCasing,
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 2, 9, 3, 12, 4.5, 16, 10],
        },
      },
      {
        id: 'road',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: [
          'all',
          ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
          ['!=', ['get', 'brunnel'], 'tunnel'],
        ],
        minzoom: 6,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': BASEMAP_PALETTE.roadFill,
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.1, 9, 1.9, 12, 3.1, 16, 7.5],
        },
      },
      {
        id: 'road-secondary-casing',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['all', ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
        minzoom: 9.5,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': BASEMAP_PALETTE.roadCasing,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9.5, 1.6, 13, 3.6, 17, 8],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 9.5, 0.35, 11, 1],
        },
      },
      {
        id: 'road-secondary',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['all', ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false], ['!=', ['get', 'brunnel'], 'tunnel']],
        minzoom: 9.5,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': BASEMAP_PALETTE.roadFill,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9.5, 0.9, 13, 2.4, 17, 6.5],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 9.5, 0.35, 11, 1],
        },
      },
      {
        /* Local roads. Without these the destination map reads as an empty
           wash: at planning zoom the streets ARE the useful context — they are
           what tells you whether two stops are realistically walkable. */
        id: 'road-minor',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: [
          'all',
          ['match', ['get', 'class'], ['minor', 'service'], true, false],
          ['!=', ['get', 'brunnel'], 'tunnel'],
        ],
        minzoom: 12.5,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': BASEMAP_PALETTE.roadCasing,
          'line-width': ['interpolate', ['linear'], ['zoom'], 12.5, 1.8, 15, 4.2, 18, 9],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 12.5, 0, 13.5, 1],
        },
      },
      {
        id: 'road-minor-fill',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: [
          'all',
          ['match', ['get', 'class'], ['minor', 'service'], true, false],
          ['!=', ['get', 'brunnel'], 'tunnel'],
        ],
        minzoom: 12.5,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': BASEMAP_PALETTE.roadFill,
          'line-width': ['interpolate', ['linear'], ['zoom'], 12.5, 1.1, 15, 3, 18, 7],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 12.5, 0, 13.5, 1],
        },
      },
      {
        id: 'rail',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'rail'],
        minzoom: 9,
        paint: {
          'line-color': BASEMAP_PALETTE.rail,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 14, 1.6],
          'line-dasharray': [3, 3],
        },
      },

      // --- buildings, only at street zoom ----------------------------------
      {
        id: 'building',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-color': BASEMAP_PALETTE.building,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 16, 0.85],
        },
      },

      // --- labels: the whole point of authoring the style -------------------
      {
        id: 'label-country',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'place',
        /*
         * Singapore is excluded because the origin marker labels it, in the
         * product's own voice ("Singapore / Home · Origin"). Two labels for the
         * same city-state just looks like a rendering mistake.
         */
        filter: [
          'all',
          ['==', ['get', 'class'], 'country'],
          ['!=', ['coalesce', ['get', 'name_en'], ['get', 'name']], 'Singapore'],
        ],
        maxzoom: 8,
        layout: {
          'text-field': englishName as unknown as string,
          'text-font': MAP_FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 5, 12, 8, 14],
          'text-letter-spacing': 0.16,
          'text-transform': 'uppercase',
          'text-max-width': 7,
          'text-padding': 12,
        },
        paint: {
          'text-color': BASEMAP_PALETTE.labelCountry,
          'text-halo-color': BASEMAP_PALETTE.land,
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'label-region',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'state'],
        minzoom: 5,
        maxzoom: 11,
        layout: {
          'text-field': englishName as unknown as string,
          'text-font': MAP_FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 8, 10.5],
          'text-letter-spacing': 0.1,
          'text-transform': 'uppercase',
          'text-max-width': 8,
          'text-padding': 10,
        },
        paint: {
          'text-color': BASEMAP_PALETTE.labelRegion,
          'text-halo-color': BASEMAP_PALETTE.land,
          'text-halo-width': 1,
        },
      },
      {
        /*
         * Base-map city labels start at zoom 6, not 4.
         *
         * Below zoom 6 this map is showing a whole region, and the destination
         * markers ARE the city labels. Leaving the basemap's own city names in
         * produced two problems: a rim of Chinese and Indian cities that have
         * nothing to do with planning a trip from Singapore, and direct
         * collisions with our own labels (the basemap's "Cebu City" landing on
         * top of our "Cebu"). Country and sea names carry the geography at that
         * scale; our ten destination labels carry the product.
         */
        id: 'label-city-major',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'place',
        filter: [
          'all',
          ['==', ['get', 'class'], 'city'],
          ['<=', ['get', 'rank'], ['case', ['<', ['zoom'], 9], 4, 6]],
        ],
        minzoom: 6,
        maxzoom: 15,
        layout: {
          'text-field': englishName as unknown as string,
          'text-font': MAP_FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 12, 12, 14],
          'text-letter-spacing': 0.04,
          'text-max-width': 8,
          'text-padding': 14,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': BASEMAP_PALETTE.labelCity,
          'text-halo-color': BASEMAP_PALETTE.land,
          'text-halo-width': 1.3,
        },
      },
      {
        id: 'label-town',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'town'],
        minzoom: 10,
        maxzoom: 15,
        layout: {
          'text-field': englishName as unknown as string,
          'text-font': MAP_FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 12, 12, 15, 13],
          'text-letter-spacing': 0.02,
          'text-max-width': 8,
          'text-padding': 16,
        },
        paint: {
          'text-color': BASEMAP_PALETTE.labelTown,
          'text-halo-color': BASEMAP_PALETTE.land,
          'text-halo-width': 1.2,
        },
      },
      {
        // Sea and ocean names only — no lake, river or strait labels.
        id: 'label-water',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'water_name',
        filter: ['match', ['get', 'class'], ['ocean', 'sea'], true, false],
        maxzoom: 7,
        layout: {
          'text-field': englishName as unknown as string,
          'text-font': MAP_FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 6, 11],
          'text-letter-spacing': 0.22,
          'text-transform': 'uppercase',
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#A9B8BF',
          'text-halo-color': BASEMAP_PALETTE.water,
          'text-halo-width': 1,
        },
      },
    ],
  };
}

/** Ordered fallback chain — first entry wins unless its tiles start failing. */
export const BASEMAP_CHAIN: Array<TileSource['id']> = ['carto', 'openfreemap'];

export function basemapLabel(provider: TileSource['id']): string {
  return BASEMAP_SOURCES[provider].label;
}
