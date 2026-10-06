'use client';

import { useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useMapInstance, useMapReady } from './MapCanvas';

/** Current map zoom, re-rendering the caller on every zoom change. */
export function useMapZoom(): number {
  const map = useMapInstance();
  const [zoom, setZoom] = useState(-1);
  useEffect(() => {
    if (!map) return;
    const update = () => setZoom(map.getZoom());
    update();
    map.on('zoomend', update);
    return () => {
      map.off('zoomend', update);
    };
  }, [map]);
  return zoom;
}

/** Smoothly fly the map to a point. */
export function useMapFocus() {
  const map = useMapInstance();
  return (lat: number, lng: number, zoom?: number) => {
    if (!map) return;
    map.flyTo({ center: [lng, lat], zoom: zoom ?? Math.max(map.getZoom(), 13), duration: 700, essential: true });
  };
}

/** Fit the map to a set of points. */
export function useFitPoints() {
  const map = useMapInstance();
  return (points: Array<{ lat: number; lng: number }>, maxZoom = 15) => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.flyTo({ center: [points[0].lng, points[0].lat], zoom: Math.max(map.getZoom(), 13), duration: 700 });
      return;
    }
    const bounds: [number, number, number, number] = points.reduce(
      (acc: [number, number, number, number], p) =>
        [
          Math.min(acc[0], p.lng),
          Math.min(acc[1], p.lat),
          Math.max(acc[2], p.lng),
          Math.max(acc[3], p.lat),
        ] as [number, number, number, number],
      [Infinity, Infinity, -Infinity, -Infinity],
    );
    map.fitBounds(bounds, { padding: 90, maxZoom, duration: 700 });
  };
}

/** Removes a GeoJSON source and its layers if they exist. */
export function removeSourceAndLayers(map: MapLibreMap, sourceId: string, layerIds: string[]) {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

export { useMapInstance, useMapReady };
