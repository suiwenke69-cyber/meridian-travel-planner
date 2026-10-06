'use client';

import { useEffect, useRef } from 'react';
import { useUiStore } from '@/lib/store/ui-store';
import { useMapEffect } from './MapCanvas';

/**
 * The detail card is a 368 px overlay pinned to the left of the map. Anything
 * the map centres without accounting for it lands underneath it — which is how
 * a hotel you just clicked could end up hidden behind its own card.
 */
function cameraPadding() {
  const cardOpen = Boolean(useUiStore.getState().selectedEntityId);
  const wide = typeof window !== 'undefined' && window.innerWidth >= 1024;
  return cardOpen && wide
    ? { left: 400, right: 70, top: 70, bottom: 70 }
    : { left: 80, right: 80, top: 70, bottom: 70 };
}

/** Applies imperative camera requests from the UI store.
 *
 * Kept as a subscriber rather than a prop so that any component anywhere
 * (itinerary row, detail card, efficiency suggestion) can move the map with
 * `requestFocus` / `requestFit` — no prop drilling, no map ref.
 */
export function MapFocusController() {
  const focusRequest = useUiStore((s) => s.focusRequest);
  const fitRequest = useUiStore((s) => s.fitRequest);
  const lastFocus = useRef(-1);
  const lastFit = useRef(-1);
  const ready = useRef(false);

  useMapEffect(
    (map) => {
      const timer = setTimeout(() => {
        ready.current = true;
      }, 400);

      const padding = cameraPadding();

      if (focusRequest && focusRequest.key !== lastFocus.current && ready.current) {
        lastFocus.current = focusRequest.key;
        map.flyTo({
          center: [focusRequest.lng, focusRequest.lat],
          zoom: Math.max(focusRequest.zoom ?? map.getZoom(), 13),
          // Shift the target right, out from behind the detail card.
          offset: [(padding.left - padding.right) / 2, 0],
          duration: 700,
          essential: true,
        });
      }

      if (fitRequest && fitRequest.key !== lastFit.current && ready.current) {
        lastFit.current = fitRequest.key;
        const points = fitRequest.points;
        if (points.length === 1) {
          // Honour the caller's ceiling. Focusing a whole AREA must not drop
          // the map to street level, which is what forcing >= 14 did.
          map.flyTo({
            center: [points[0].lng, points[0].lat],
            zoom: fitRequest.maxZoom ?? Math.max(map.getZoom(), 14),
            offset: [(padding.left - padding.right) / 2, 0],
            duration: 700,
          });
        } else if (points.length > 1) {
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
          map.fitBounds(bounds, { padding, maxZoom: fitRequest.maxZoom ?? 14, duration: 700 });
        }
      }

      return () => clearTimeout(timer);
    },
    [focusRequest, fitRequest],
  );

  return null;
}

export default MapFocusController;
