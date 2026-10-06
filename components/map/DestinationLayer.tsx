'use client';

import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useMemo } from 'react';
import { useMapEffect } from './MapCanvas';

export interface DestinationFeature {
  id: string;
  name: string;
  country: string;
  /** Pre-formatted, human-readable travel metadata, e.g. "2h 40m · Direct". */
  meta: string;
  lat: number;
  lng: number;
}

interface DestinationLayerProps {
  destinations: DestinationFeature[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

const SOURCE_ID = 'destinations';
const LAYERS = [
  'destination-hit',
  'destination-halo',
  'destination-dot',
  'destination-label',
  'destination-label-active',
  'destination-meta',
];

/**
 * Destinations drawn as native map layers — a small solid dot plus a label.
 *
 * WHY NOT DOM MARKERS
 * -------------------
 * Custom pins floating above the canvas are exactly what makes a map look like a
 * Leaflet demo. Rendering the points as real style layers means they sit in the
 * map's own coordinate space, collide and fade like the cartography around them,
 * and can never be mistaken for UI chrome. It also removes per-marker DOM cost.
 *
 * Three states, all restrained:
 *   idle      small neutral dot, name only
 *   hover     slightly larger, darker dot; name + travel metadata
 *   selected  accent dot with a soft halo; name + metadata, label always drawn
 */
export function DestinationLayer({
  destinations,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: DestinationLayerProps) {
  const collection = useMemo(() => {
    return {
      type: 'FeatureCollection' as const,
      features: destinations.map((destination) => {
        const state =
          destination.id === selectedId ? 'selected' : destination.id === hoveredId ? 'hover' : 'idle';
        return {
          type: 'Feature' as const,
          properties: {
            id: destination.id,
            name: destination.name,
            country: destination.country,
            meta: destination.meta,
            state,
            active: state === 'idle' ? 0 : 1,
          },
          geometry: { type: 'Point' as const, coordinates: [destination.lng, destination.lat] },
        };
      }),
    };
  }, [destinations, selectedId, hoveredId]);

  useMapEffect(
    (map: MapLibreMap) => {
      map.addSource(SOURCE_ID, { type: 'geojson', data: collection as never });

      // Generous invisible hit area — a 3.5 px dot is not a tap target.
      map.addLayer({
        id: 'destination-hit',
        type: 'circle',
        source: SOURCE_ID,
        paint: { 'circle-radius': 16, 'circle-color': '#000', 'circle-opacity': 0 },
      });

      map.addLayer({
        id: 'destination-halo',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'state'], 'selected'],
        paint: {
          'circle-radius': 15,
          'circle-color': '#0E5E52',
          'circle-opacity': 0.1,
          'circle-blur': 0.6,
        },
      });

      map.addLayer({
        id: 'destination-dot',
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': [
            'match',
            ['get', 'state'],
            'selected',
            5.6,
            'hover',
            4.8,
            3.4,
          ],
          'circle-color': ['match', ['get', 'state'], 'selected', '#0E5E52', '#2C3136'],
          'circle-opacity': ['match', ['get', 'state'], 'selected', 1, 'hover', 0.92, 0.62],
          'circle-stroke-width': ['match', ['get', 'state'], 'selected', 2, 'hover', 1.8, 1.4],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': ['match', ['get', 'state'], 'selected', 1, 'hover', 1, 0.85],
          'circle-translate': [0, 0],
        },
      });

      // Idle labels respect collision so the overview stays calm.
      map.addLayer({
        id: 'destination-label',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['==', ['get', 'state'], 'idle'],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-anchor': 'left',
          'text-offset': [0.85, 0],
          'text-max-width': 9,
          'text-padding': 6,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#3A4045',
          'text-halo-color': 'rgba(246,245,241,0.95)',
          'text-halo-width': 1.5,
        },
      });

      // Active labels always draw, so hover and selection are never swallowed
      // by the collision engine.
      map.addLayer({
        id: 'destination-label-active',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['==', ['get', 'active'], 1],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['match', ['get', 'state'], 'selected', 14, 13],
          'text-anchor': 'left',
          'text-offset': [0.95, -0.62],
          'text-max-width': 9,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': ['match', ['get', 'state'], 'selected', '#0B4C43', '#23282C'],
          'text-halo-color': 'rgba(246,245,241,0.96)',
          'text-halo-width': 1.8,
        },
      });

      map.addLayer({
        id: 'destination-meta',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['==', ['get', 'active'], 1],
        layout: {
          'text-field': ['get', 'meta'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10.5,
          'text-anchor': 'left',
          'text-offset': [1.15, 0.72],
          'text-max-width': 12,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': ['match', ['get', 'state'], 'selected', '#0E5E52', '#757C81'],
          'text-opacity': 0.95,
          'text-halo-color': 'rgba(246,245,241,0.95)',
          'text-halo-width': 1.4,
        },
      });

      const click = (event: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === 'string') onSelect(id);
      };
      const move = (event: { features?: Array<{ properties?: Record<string, unknown> }> }) => {
        const id = event.features?.[0]?.properties?.id;
        onHover(typeof id === 'string' ? id : null);
        map.getCanvas().style.cursor = id ? 'pointer' : '';
      };
      const leave = () => {
        onHover(null);
        map.getCanvas().style.cursor = '';
      };

      map.on('click', 'destination-hit', click);
      map.on('mousemove', 'destination-hit', move);
      map.on('mouseleave', 'destination-hit', leave);

      return () => {
        map.off('click', 'destination-hit', click);
        map.off('mousemove', 'destination-hit', move);
        map.off('mouseleave', 'destination-hit', leave);
        for (const id of LAYERS) if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      };
    },
    [],
  );

  // Update the data in place for hover/selection — no layer teardown.
  useMapEffect(
    (map) => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      source?.setData(collection as never);
    },
    [collection],
  );

  return null;
}

export default DestinationLayer;
