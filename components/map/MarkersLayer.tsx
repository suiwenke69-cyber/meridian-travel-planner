'use client';

import { Marker as MapLibreMarker, Popup as MapLibrePopup, type Map as MapLibreMap } from 'maplibre-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MarkerLayer } from '@/lib/types';
import { clusterVisual, markerVisual, type MarkerVisual } from './marker-icons';
import { useMapInstance, useMapEffect } from './MapCanvas';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  layer: MarkerLayer;
  label: string;
  sublabel?: string;
  /** 1-based stop number inside the active day's route. */
  order?: number;
  selected?: boolean;
  emphasised?: boolean;
  dimmed?: boolean;
  groupMark?: string;
  zIndexOffset?: number;
  /** Fully custom visual (used by bespoke layers). */
  custom?: MarkerVisual;
  noTooltip?: boolean;
}

interface MarkersLayerProps {
  markers: MapMarker[];
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
  cluster?: boolean;
  clusterRadiusPx?: number;
  clusterMaxZoom?: number;
}

interface ClusterBucket {
  key: string;
  points: MapMarker[];
  lat: number;
  lng: number;
}

const TILE_SIZE = 512;
const CLUSTERABLE: MarkerLayer[] = [
  'marriott',
  'hilton',
  'activity',
  'nature',
  'beach',
  'food',
  'nightlife',
  'transport',
];

/**
 * Pan-independent world pixel coordinate at a given zoom.
 *
 * The engine's own `project()` is container-relative, which would make cluster
 * membership change as you pan. Building the bucket grid in world space keeps
 * clusters stable and readable, which is what a spatial tool needs.
 */
function worldPixel(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const phi = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * scale;
  return { x, y };
}

function bucketMarkers(markers: MapMarker[], zoom: number, radiusPx: number): ClusterBucket[] {
  const buckets = new Map<string, ClusterBucket>();
  for (const marker of markers) {
    const p = worldPixel(marker.lat, marker.lng, zoom);
    const key = `${Math.round(p.x / radiusPx)}:${Math.round(p.y / radiusPx)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.points.push(marker);
      existing.lat += marker.lat;
      existing.lng += marker.lng;
    } else {
      buckets.set(key, { key, points: [marker], lat: marker.lat, lng: marker.lng });
    }
  }
  return Array.from(buckets.values()).map((bucket) => ({
    ...bucket,
    lat: bucket.lat / bucket.points.length,
    lng: bucket.lng / bucket.points.length,
  }));
}

function dominantLayer(points: MapMarker[]): MarkerLayer {
  const counts = new Map<MarkerLayer, number>();
  for (const p of points) counts.set(p.layer, (counts.get(p.layer) ?? 0) + 1);
  let best: MarkerLayer = points[0]?.layer ?? 'activity';
  let bestWeight = -1;
  for (const [layer, count] of counts) {
    const weight = layer === 'marriott' || layer === 'hilton' ? count * 1.4 : count;
    if (weight > bestWeight) {
      bestWeight = weight;
      best = layer;
    }
  }
  return best;
}

function escape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function useZoomTick(map: MapLibreMap | null): number {
  const [zoom, setZoom] = useState(-1);
  useEffect(() => {
    if (!map) return;
    const handler = () => setZoom(map.getZoom());
    handler();
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map]);
  return zoom;
}

export function MarkersLayer({
  markers,
  onSelect,
  onHover,
  cluster = true,
  clusterRadiusPx = 58,
  clusterMaxZoom = 12,
}: MarkersLayerProps) {
  const map = useMapInstance();
  const markersRef = useRef<MapLibreMarker[]>([]);
  const popupRef = useRef<MapLibrePopup | null>(null);
  const zoomTick = useZoomTick(map);

  const handlers = useRef({ onSelect, onHover });
  handlers.current = { onSelect, onHover };

  useEffect(() => {
    if (!map) return;
    popupRef.current = new MapLibrePopup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      className: 'mm-tooltip-popup',
      maxWidth: '260px',
    });
    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, [map]);

  const signature = useMemo(
    () =>
      markers
        .map(
          (m) =>
            `${m.id}|${m.layer}|${m.lat.toFixed(4)}|${m.lng.toFixed(4)}|${m.order ?? ''}|${
              m.selected ? 1 : 0
            }|${m.emphasised ? 1 : 0}|${m.dimmed ? 1 : 0}|${m.groupMark ?? ''}`,
        )
        .join(';'),
    [markers],
  );

  useMapEffect(
    (instance) => {
      const created: MapLibreMarker[] = [];

      const shouldCluster = cluster && instance.getZoom() <= clusterMaxZoom;
      const pinned = markers.filter(
        (m) => Boolean(m.custom) || m.selected || m.emphasised || m.order !== undefined || !CLUSTERABLE.includes(m.layer),
      );
      const clusterable = shouldCluster ? markers.filter((m) => !pinned.includes(m)) : [];
      const always = shouldCluster ? [...pinned] : [...markers];

      const attach = (element: HTMLElement, lat: number, lng: number, visual: MarkerVisual) => {
        const marker = new MapLibreMarker({
          element,
          anchor: 'top-left',
          offset: [-visual.anchor[0], -visual.anchor[1]],
        })
          .setLngLat([lng, lat])
          .addTo(instance);
        created.push(marker);
        return marker;
      };

      if (shouldCluster) {
        for (const bucket of bucketMarkers(clusterable, instance.getZoom(), clusterRadiusPx)) {
          if (bucket.points.length === 1) {
            always.push(bucket.points[0]);
            continue;
          }
          const visual = clusterVisual(bucket.points.length, dominantLayer(bucket.points));
          const element = document.createElement('div');
          element.innerHTML = visual.html;
          element.className = 'mm-marker mm-marker--cluster';
          element.setAttribute('role', 'button');
          element.setAttribute('tabindex', '0');
          element.setAttribute('aria-label', `${bucket.points.length} places — activate to zoom in`);
          element.title = `${bucket.points.length} places — click to zoom in`;
          const zoomIn = () => {
            instance.easeTo({
              center: [bucket.lng, bucket.lat],
              zoom: Math.min(16, instance.getZoom() + 2.5),
              duration: 550,
            });
          };
          element.addEventListener('click', (event) => {
            event.stopPropagation();
            zoomIn();
          });
          element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              zoomIn();
            }
          });
          attach(element, bucket.lat, bucket.lng, visual);
        }
      }

      for (const marker of always) {
        const visual =
          marker.custom ??
          markerVisual({
            layer: marker.layer,
            order: marker.order,
            selected: marker.selected,
            dimmed: marker.dimmed,
            emphasised: marker.emphasised,
            groupMark: marker.groupMark,
            label: `${marker.label}${marker.sublabel ? `, ${marker.sublabel}` : ''}`,
          });

        const element = document.createElement('div');
        element.innerHTML = visual.html;
        element.className = 'mm-marker';
        element.style.zIndex = String(
          (marker.zIndexOffset ?? 0) + (marker.selected ? 900 : marker.emphasised ? 700 : 400),
        );
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', marker.label);
        element.title = marker.label;

        const activate = () => handlers.current.onSelect(marker.id);
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          activate();
        });
        element.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activate();
          }
        });
        element.addEventListener('mouseenter', () => {
          handlers.current.onHover?.(marker.id);
          if (marker.noTooltip || !popupRef.current) return;
          popupRef.current
            .setLngLat([marker.lng, marker.lat])
            .setHTML(
              `<span class="mm-tip__title">${
                marker.order !== undefined ? `<span class="mm-tip__order">${marker.order}</span>` : ''
              }${escape(marker.label)}</span>${
                marker.sublabel ? `<span class="mm-tip__sub">${escape(marker.sublabel)}</span>` : ''
              }`,
            )
            .addTo(instance);
        });
        element.addEventListener('mouseleave', () => {
          handlers.current.onHover?.(null);
          popupRef.current?.remove();
        });
        element.addEventListener('focus', () => handlers.current.onHover?.(marker.id));
        element.addEventListener('blur', () => handlers.current.onHover?.(null));

        attach(element, marker.lat, marker.lng, visual);
      }

      markersRef.current = created;
      return () => {
        popupRef.current?.remove();
        for (const marker of created) marker.remove();
        markersRef.current = [];
      };
    },
    [signature, cluster, clusterRadiusPx, clusterMaxZoom, zoomTick],
  );

  return null;
}

export default MarkersLayer;
