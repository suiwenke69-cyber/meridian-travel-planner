'use client';

import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useMapEffect } from './MapCanvas';

export interface ArcTarget {
  id: string;
  lat: number;
  lng: number;
}

const SOURCE_ID = 'region-arc';
const LAYERS = ['region-arc-halo', 'region-arc-line'];

/**
 * The single origin → selected destination arc.
 *
 * Deliberately shows ONE connection. Drawing an arc to every destination turned
 * the region view into a spider's web and diluted the one relationship this
 * product is built on. The arc is drawn progressively on selection, and it is a
 * decorative route *indicator* — never presented as an airway.
 *
 * The origin is a parameter rather than a constant: this used to start at
 * Singapore unconditionally, which stopped being true the moment the product
 * supported leaving from anywhere else.
 */
export function RegionArcLayer({
  origin,
  target,
}: {
  origin: { lat: number; lng: number };
  target: ArcTarget | null;
}) {
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [sourceEpoch, setSourceEpoch] = useState(0);
  const rafRef = useRef<number | null>(null);

  const curve = useMemo(() => {
    if (!target) return null;
    return curvedArc({ lat: origin.lat, lng: origin.lng }, { lat: target.lat, lng: target.lng }, 96);
  }, [origin.lat, origin.lng, target]);

  useMapEffect(
    (instance) => {
      instance.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      instance.addLayer({
        id: 'region-arc-halo',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#0E5E52', 'line-width': 11, 'line-opacity': 0.1, 'line-blur': 7 },
      });
      instance.addLayer({
        id: 'region-arc-line',
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#0E5E52', 'line-width': 1.8, 'line-opacity': 0.8 },
      });
      setMap(instance);
      setSourceEpoch((n) => n + 1);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        for (const id of LAYERS) if (instance.getLayer(id)) instance.removeLayer(id);
        if (instance.getSource(SOURCE_ID)) instance.removeSource(SOURCE_ID);
        setMap(null);
      };
    },
    [],
  );

  useEffect(() => {
    const source = map?.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (!curve) {
      source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
      return;
    }

    // Progressive draw: reveal the curve over ~520 ms, ease-out.
    const start = performance.now();
    const DURATION = 520;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - t) ** 3;
      const count = Math.max(2, Math.round(curve.length * eased));
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: curve.slice(0, count) },
      });
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [curve, map, sourceEpoch]);

  return null;
}

/**
 * Quadratic Bézier between two points, bent perpendicular to the straight line.
 * The bend is subtle on purpose: enough to read as a route, not enough to imply
 * a specific flight path.
 */
function curvedArc(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  segments: number,
): [number, number][] {
  const midLat = (a.lat + b.lat) / 2;
  const midLng = (a.lng + b.lng) / 2;
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  const length = Math.hypot(dx, dy) || 1;
  const bend = Math.min(1.1, length * 0.07);
  const controlLat = midLat - (dx / length) * bend;
  const controlLng = midLng + (dy / length) * bend;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const lat = (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * controlLat + t ** 2 * b.lat;
    const lng = (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * controlLng + t ** 2 * b.lng;
    points.push([lng, lat]);
  }
  return points;
}

export default RegionArcLayer;
