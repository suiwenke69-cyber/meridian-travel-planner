'use client';

import { Marker as MapLibreMarker } from 'maplibre-gl';
import { useMemo, useRef } from 'react';
import { LAYER_COLORS } from './marker-icons';
import { useMapEffect } from './MapCanvas';

export interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
  layer: keyof typeof LAYER_COLORS;
  label?: string;
}

interface RouteLayerProps {
  points: RoutePoint[];
  dashed?: boolean;
  /** Draw a soft corridor under the line to signal that the path is approximate. */
  showCorridor?: boolean;
}

const SOURCE_ID = 'route';
const LAYERS = ['route-corridor', 'route-casing', 'route-line'];

function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/**
 * Draws the active day's route.
 *
 * With OSRM configured this follows real roads. Without it, the geometry is a
 * straight-line corridor and the line is dashed — the UI says which, and never
 * presents a straight line as a driving route.
 */
export function RouteLayer({ points, dashed = false, showCorridor = true }: RouteLayerProps) {
  const arrowsRef = useRef<MapLibreMarker[]>([]);

  const geojson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: points.map((p) => [p.lng, p.lat]),
      },
    }),
    [points],
  );

  const signature = useMemo(() => points.map((p) => p.id).join('|'), [points]);

  useMapEffect(
    (map) => {
      if (points.length < 2) return;

      map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

      if (showCorridor) {
        map.addLayer({
          id: 'route-corridor',
          type: 'line',
          source: SOURCE_ID,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#0E5E52', 'line-width': 14, 'line-opacity': 0.09, 'line-blur': 4 },
        });
      }
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#FFFFFF', 'line-width': 7, 'line-opacity': 0.92 },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#0E5E52',
          'line-width': 3,
          'line-opacity': 1,
          ...(dashed ? { 'line-dasharray': [2, 2] } : {}),
        },
      });

      // Direction arrows at the midpoint of each leg, as DOM markers so they
      // rotate cleanly without needing an SDF icon set.
      const arrows: MapLibreMarker[] = [];
      for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1];
        const b = points[i];
        const element = document.createElement('div');
        element.className = 'mm-route-arrow';
        element.style.transform = `rotate(${bearing(a, b)}deg)`;
        element.innerHTML =
          '<svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true"><path d="M6 1.4 10.6 10 6 7.8 1.4 10z" fill="#0E5E52"/></svg>';
        arrows.push(
          new MapLibreMarker({ element, anchor: 'center' })
            .setLngLat([(a.lng + b.lng) / 2, (a.lat + b.lat) / 2])
            .addTo(map),
        );
      }
      arrowsRef.current = arrows;

      return () => {
        for (const arrow of arrows) arrow.remove();
        arrowsRef.current = [];
        for (const id of LAYERS) if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      };
    },
    [signature, dashed, showCorridor, geojson],
  );

  return null;
}

export default RouteLayer;
