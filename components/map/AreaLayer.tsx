'use client';

import type { Map as MapLibreMap } from 'maplibre-gl';
import { useMemo, useState } from 'react';
import type { Area, Coordinates, Hotel, Place } from '@/lib/types';
import { contentZone } from '@/lib/zone';
import { useUiStore } from '@/lib/store/ui-store';
import { useMapEffect } from './MapCanvas';

interface AreaLayerProps {
  areas: Area[];
  /** Content used to shape each travel zone, so a zone reflects where things are. */
  hotels?: Hotel[];
  places?: Place[];
  selectedAreaId?: string | null;
  activeAreaIds?: string[];
  onSelectArea?: (id: string) => void;
  visible?: boolean;
  /**
   * Which areas may draw a zone. `undefined` draws every area. The map and the
   * panel must agree on this: EXPLORE lists one scope at a time, so it draws one
   * scope at a time. Drawing all twenty-two zones at once turned the south of
   * the island into a pile of overlapping rings.
   */
  zoneIds?: string[];
  /**
   * `prominent` when areas ARE the content (the Explore tab);
   * `quiet` when they are background context behind markers.
   */
  opacity?: 'prominent' | 'quiet';
}

/**
 * Collision priority for area labels, in the order the Explore panel lists them.
 * The six headline regions come first; excursion zones come last.
 */
const STAY_PRIORITY = [
  'seminyak',
  'canggu',
  'ubud',
  'uluwatu',
  'nusa-dua',
  'sanur',
  'jimbaran',
  'kuta-legian',
  'amed',
];

const SOURCE_ID = 'areas';
const LABEL_SOURCE_ID = 'area-centres';
const LAYERS = ['area-glow', 'area-fill', 'area-edge', 'area-label', 'area-anchor'];

/**
 * Zones are inserted *below* the basemap's water fill.
 *
 * A travel zone that follows mapped content will always spill past the
 * shoreline — the content ends at the beach, the padded hull does not. Left on
 * top, the result was pale wash and dashed arcs floating out over the sea, which
 * looked like a rendering fault. The tile source carries real ocean polygons, so
 * drawing the zones beneath the water layer clips them to land for free. It is
 * the same trick a paper map uses when it prints the sea last.
 */
const WATER_LAYER_ID = 'water';

/**
 * Zone colour by state. One family, three weights — so "selected" reads as a
 * stronger version of the same thing rather than a different kind of object.
 */
const ZONE_SELECTED = '#0E5E52';
const ZONE_ACTIVE = '#2F7F73';
const ZONE_IDLE = '#5C7A72';

/**
 * Destination areas, drawn as either a real boundary polygon (where one was
 * sourced) or a radius-based influence shape.
 *
 * The distinction stays visible: polygons read as outlines, radius shapes are
 * dashed and labelled "approximate extent". Invisible boundaries are never
 * presented as official ones.
 */
export function AreaLayer({
  areas,
  hotels = [],
  places = [],
  selectedAreaId,
  activeAreaIds = [],
  onSelectArea,
  visible = true,
  zoneIds,
  opacity = 'prominent',
}: AreaLayerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Map labels follow the product language, like everything else on the page.
  const locale = useUiStore((s) => s.locale);

  const scopedAreas = useMemo(() => {
    if (!zoneIds) return areas;
    const allowed = new Set(zoneIds);
    // A selected or trip-active area is never hidden, whatever the scope says —
    // losing the highlight you just asked for is a worse bug than one extra ring.
    return areas.filter(
      (a) => allowed.has(a.id) || a.id === selectedAreaId || activeAreaIds.includes(a.id),
    );
  }, [areas, zoneIds, selectedAreaId, activeAreaIds]);

  /**
   * Each zone is shaped by where that area's own hotels and places actually are,
   * then padded. A circle would ignore that entirely — Canggu's content runs
   * along the coast, and a circle around its centroid would cover rice fields
   * inland while missing the beach strip.
   */
  const featureCollection = useMemo(() => {
    const contentByArea = new Map<string, Coordinates[]>();
    for (const hotel of hotels) {
      const list = contentByArea.get(hotel.areaId) ?? [];
      list.push(hotel.coordinates);
      contentByArea.set(hotel.areaId, list);
    }
    for (const place of places) {
      const list = contentByArea.get(place.areaId) ?? [];
      list.push(place.coordinates);
      contentByArea.set(place.areaId, list);
    }

    const features = scopedAreas.map((area) => {
      const selected = area.id === selectedAreaId;
      const active = activeAreaIds.includes(area.id);
      const content = contentByArea.get(area.id) ?? [];
      const isIsland = area.zoneType === 'island';
      const ring = contentZone(area.coordinates, content, {
        paddingKm: area.isStayBase ? 1.2 : 2.2,
        minRadiusKm: area.isStayBase ? 2.4 : 4,
        maxRadiusKm: isIsland ? 7 : area.isStayBase ? 8 : 9,
      });
      return {
        type: 'Feature' as const,
        properties: {
          id: area.id,
          name: locale === 'zh-CN' && area.nameZh ? area.nameZh : area.name,
          state: selected ? 'selected' : active ? 'active' : 'idle',
          contentCount: content.length,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [ring.map(([lat, lng]) => [lng, lat])],
        },
      };
    });
    return { type: 'FeatureCollection' as const, features };
  }, [scopedAreas, hotels, places, selectedAreaId, activeAreaIds]);

  const labelCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: scopedAreas.map((area) => ({
        type: 'Feature' as const,
        properties: {
          id: area.id,
          name: locale === 'zh-CN' && area.nameZh ? area.nameZh : area.name,
          tagline: locale === 'zh-CN' && area.taglineZh ? area.taglineZh : area.tagline,
          isStayBase: area.isStayBase ? 1 : 0,
          // Lower rank wins a collision, so the regions a first-time traveller
          // needs to see are placed before the excursion zones.
          rank: STAY_PRIORITY.indexOf(area.id) === -1 ? 50 : STAY_PRIORITY.indexOf(area.id),
          state: area.id === selectedAreaId ? 'selected' : 'idle',
        },
        geometry: { type: 'Point' as const, coordinates: [area.coordinates.lng, area.coordinates.lat] },
      })),
    }),
    [scopedAreas, selectedAreaId, locale],
  );

  const signature = useMemo(
    () =>
      areas.map((a) => `${a.id}:${a.radiusMeters}:${a.boundary ? 1 : 0}`).join('|') +
      String(selectedAreaId) +
      activeAreaIds.join(',') +
      // The scope changes which zones exist, so the sources must be rebuilt.
      (zoneIds ? `#${[...zoneIds].sort().join(',')}` : '#all') +
      // The label text is baked into the source, so a locale change must rebuild it.
      `@${locale}`,
    [areas, selectedAreaId, activeAreaIds, zoneIds, locale],
  );

  useMapEffect(
    (map: MapLibreMap) => {
      if (!visible) return;
      map.addSource(SOURCE_ID, { type: 'geojson', data: featureCollection as never });

      /*
       * How a travel zone is drawn.
       *
       * An earlier build drew each zone as a wide, heavily blurred stroke. It
       * was meant to read as "somewhere around here" but it actually read as a
       * grey smudge: twenty overlapping halos turned the south of the island
       * into one dirty cloud and buried the coastline underneath it.
       *
       * The zone is now built from three honest parts instead:
       *   1. a faint tinted WASH — the zone as a field of interest;
       *   2. a fine DASHED EDGE — a dashed line is the conventional cartographic
       *      signal for "approximate", so the boundary never claims to be an
       *      administrative one;
       *   3. a soft halo that exists ONLY for selected and active zones, so
       *      emphasis is something you earn by interacting, not the default.
       */
      const belowWater = map.getLayer(WATER_LAYER_ID) ? WATER_LAYER_ID : undefined;

      map.addLayer({
        id: 'area-glow',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['match', ['get', 'state'], 'selected', ZONE_SELECTED, ZONE_ACTIVE],
          'line-width': ['match', ['get', 'state'], 'selected', 30, 22],
          'line-blur': 18,
          // Idle zones contribute nothing here; their definition is the edge.
          'line-opacity': [
            'match',
            ['get', 'state'],
            'selected',
            opacity === 'prominent' ? 0.34 : 0.2,
            'active',
            opacity === 'prominent' ? 0.2 : 0.12,
            opacity === 'prominent' ? 0.15 : 0,
          ],
        },
      }, belowWater);

      map.addLayer({
        id: 'area-fill',
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': ['match', ['get', 'state'], 'selected', ZONE_SELECTED, 'active', ZONE_ACTIVE, ZONE_IDLE],
          'fill-opacity': [
            'match',
            ['get', 'state'],
            'selected',
            opacity === 'prominent' ? 0.17 : 0.1,
            'active',
            opacity === 'prominent' ? 0.13 : 0.08,
            opacity === 'prominent' ? 0.095 : 0.03,
          ],
        },
      }, belowWater);

      map.addLayer({
        id: 'area-edge',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'butt', 'line-join': 'round' },
        paint: {
          'line-color': ['match', ['get', 'state'], 'selected', ZONE_SELECTED, 'active', ZONE_ACTIVE, ZONE_IDLE],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            ['match', ['get', 'state'], 'selected', 1.8, 1],
            13,
            ['match', ['get', 'state'], 'selected', 2.6, 1.5],
          ],
          'line-dasharray': [2.2, 2.2],
          'line-opacity': [
            'match',
            ['get', 'state'],
            'selected',
            opacity === 'prominent' ? 0.85 : 0.5,
            'active',
            opacity === 'prominent' ? 0.6 : 0.34,
            opacity === 'prominent' ? 0.5 : 0.16,
          ],
        },
      }, belowWater);

      /*
       * Labels are placed from the polygon anchor points, NOT from the polygons.
       * A radius shape is large enough that the placement engine finds several
       * valid label positions inside it and the area name repeats four or five
       * times across the map — which reads as a rendering fault.
       */
      map.addSource(LABEL_SOURCE_ID, { type: 'geojson', data: labelCollection as never });

      /*
       * Area names carry their tagline, because "ULUWATU / Cliffs · Sunsets" is
       * the single fastest way to teach a traveller what a region is. The name
       * is upper-cased via the string expression; the tagline stays sentence
       * case so the two lines read as heading and subtitle.
       */
      map.addLayer({
        id: 'area-label',
        type: 'symbol',
        source: LABEL_SOURCE_ID,
        minzoom: 8,
        layout: {
          'text-field': [
            'format',
            ['upcase', ['get', 'name']],
            { 'font-scale': 1 },
            '\n',
            {},
            ['get', 'tagline'],
            { 'font-scale': 0.85, 'text-color': '#0E5E52' },
          ],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10.5, 11, 11.5, 13, 12],
          'text-line-height': 1.25,
          'text-max-width': 11,
          /*
           * Variable anchor is what makes the dense south work. South Bali has
           * six named regions within ~30 km, and a fixed label anchor meant
           * Canggu, Nusa Dua and Sanur were dropped by the collision engine at
           * exactly the zoom where they matter most. Letting each label choose
           * top/bottom/left/right of its dot lets all six coexist.
           */
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 1.1,
          'text-justify': 'auto',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-padding': 6,
          'symbol-sort-key': ['get', 'rank'],
        },
        paint: {
          'text-color': ['match', ['get', 'state'], 'selected', '#0B4C43', '#5F686D'],
          'text-opacity': [
            'match',
            ['get', 'state'],
            'selected',
            1,
            opacity === 'prominent' ? 0.92 : 0.42,
          ],
          'text-halo-color': 'rgba(246,245,241,0.92)',
          'text-halo-width': 1.6,
        },
      });

      /*
       * A small anchor dot under each label. Without it the labels float and it
       * is unclear which patch of coast they belong to.
       */
      map.addLayer({
        id: 'area-anchor',
        type: 'circle',
        source: LABEL_SOURCE_ID,
        minzoom: 8,
        paint: {
          'circle-radius': ['match', ['get', 'state'], 'selected', 5.5, 'idle', 3.5],
          'circle-color': ['match', ['get', 'state'], 'selected', ZONE_SELECTED, '#7C8A8E'],
          'circle-opacity': [
            'match',
            ['get', 'state'],
            'selected',
            1,
            opacity === 'prominent' ? 0.8 : 0.3,
          ],
          'circle-stroke-width': 1.8,
          'circle-stroke-color': '#FFFFFF',
          'circle-translate': [0, 0],
        },
      });

      const leaveHandler = () => {
        setHoveredId(null);
        map.getCanvas().style.cursor = '';
      };
      const clickHandler = (event: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === 'string') onSelectArea?.(id);
      };
      const moveHandler = (event: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const id = event.features?.[0]?.properties?.id;
        setHoveredId(typeof id === 'string' ? id : null);
        map.getCanvas().style.cursor = id ? 'pointer' : '';
      };
      const labelClick = (event: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === 'string') onSelectArea?.(id);
      };
      const labelMove = (event: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const id = event.features?.[0]?.properties?.id;
        setHoveredId(typeof id === 'string' ? id : null);
        map.getCanvas().style.cursor = id ? 'pointer' : '';
      };

      map.on('click', 'area-fill', clickHandler);
      map.on('mousemove', 'area-fill', moveHandler);
      map.on('mouseleave', 'area-fill', leaveHandler);
      map.on('click', 'area-label', labelClick);
      map.on('mousemove', 'area-label', labelMove);
      map.on('mouseleave', 'area-label', leaveHandler);

      return () => {
        map.off('click', 'area-fill', clickHandler);
        map.off('mousemove', 'area-fill', moveHandler);
        map.off('mouseleave', 'area-fill', leaveHandler);
        map.off('click', 'area-label', labelClick);
        map.off('mousemove', 'area-label', labelMove);
        map.off('mouseleave', 'area-label', leaveHandler);
        for (const id of LAYERS) if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        if (map.getSource(LABEL_SOURCE_ID)) map.removeSource(LABEL_SOURCE_ID);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, visible, opacity, Boolean(onSelectArea)],
  );

  // Keep the data fresh without rebuilding the layers (hover/selection changes).
  useMapEffect(
    (map) => {
      (map.getSource(SOURCE_ID) as { setData?: (data: unknown) => void } | undefined)?.setData?.(featureCollection);
      (map.getSource(LABEL_SOURCE_ID) as { setData?: (data: unknown) => void } | undefined)?.setData?.(
        labelCollection,
      );
    },
    [featureCollection, labelCollection],
  );

  void hoveredId;
  return null;
}

export default AreaLayer;
