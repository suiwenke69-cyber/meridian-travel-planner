'use client';

import {
  AttributionControl,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LatLngTuple } from '@/lib/types';
import { BASEMAP_CHAIN, basemapLabel, buildBasemapStyle } from './basemap-style';
import { cn } from '@/lib/utils';

export type { MapLibreMap };

export interface MapView {
  zoom: number;
  center: { lat: number; lng: number };
  bounds: [[number, number], [number, number]];
}

interface MapContextValue {
  map: MapLibreMap | null;
  /**
   * Increments every time a style finishes loading. Overlays key their effects
   * on it, so they re-register their sources and layers if the basemap is ever
   * swapped (for example when the tile provider falls back).
   */
  styleEpoch: number;
}

const MapContext = createContext<MapContextValue>({ map: null, styleEpoch: 0 });

/** The live map instance, or null before it exists. */
export function useMapInstance(): MapLibreMap | null {
  return useContext(MapContext).map;
}

/** True once sources and layers can safely be added. */
export function useMapReady(): boolean {
  return useContext(MapContext).styleEpoch > 0;
}

/**
 * Runs `effect` whenever the map exists and its style is loaded, and again if
 * the style is replaced. Return a cleanup function to remove what you added.
 */
export function useMapEffect(effect: (map: MapLibreMap) => void | (() => void), deps: unknown[] = []) {
  const { map, styleEpoch } = useContext(MapContext);
  useEffect(() => {
    if (!map || styleEpoch === 0) return;
    return effect(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, styleEpoch, ...deps]);
}

export interface MapCanvasProps {
  /** `[lat, lng]` — deliberately engine-agnostic so no consumer has to care. */
  center: LatLngTuple;
  zoom: number;
  bounds?: [LatLngTuple, LatLngTuple];
  fitBounds?: boolean;
  fitPadding?: [number, number];
  /**
   * Per-edge padding overrides. The destination rail covers the western third
   * of the homepage map, so a symmetric padding would centre the geography
   * underneath the panel.
   */
  fitPaddingLeft?: number;
  fitPaddingRight?: number;
  /** Extra bottom padding for `fitBounds` (mobile bottom sheet). */
  fitPaddingBottom?: number;
  /** Ceiling for `fitBounds`, so a tight region never over-zooms. */
  fitMaxZoom?: number;
  fitKey?: string;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  ariaLabel: string;
  zoomControlPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  refitOnResize?: boolean;
  interactive?: boolean;
  onViewChange?: (view: MapView) => void;
  onBackgroundClick?: () => void;
  children?: ReactNode;
}

const toLngLat = (tuple: LatLngTuple): [number, number] => [tuple[1], tuple[0]];

/**
 * MapLibre parses vector tiles in a web worker it resolves at runtime via
 * `import.meta.url` — something a bundler cannot follow, which leaves the map
 * permanently blank. `scripts/vendor-maplibre-worker.mjs` copies the worker into
 * `public/maplibre/` before every dev run and build, so we point at it directly.
 */
let workerConfigured = false;
function configureWorker() {
  if (workerConfigured) return;
  workerConfigured = true;
  setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}

/**
 * The only component in the codebase that talks to the map engine's lifecycle.
 *
 * Basemap: our own vector style (see `basemap-style.ts`) over CARTO's keyless
 * vector tiles, with OpenFreeMap as an automatic fallback if CARTO's tiles start
 * failing — a blocked CDN degrades to a different host rather than a grey square.
 */
export function MapCanvas({
  center,
  zoom,
  bounds,
  fitBounds = false,
  fitPadding = [40, 40],
  fitPaddingLeft,
  fitPaddingRight,
  fitPaddingBottom = 0,
  fitMaxZoom,
  fitKey,
  minZoom = 3,
  maxZoom = 18,
  className,
  ariaLabel,
  zoomControlPosition = 'bottom-right',
  refitOnResize = true,
  interactive = true,
  onViewChange,
  onBackgroundClick,
  children,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [styleEpoch, setStyleEpoch] = useState(0);
  const [provider, setProvider] = useState<(typeof BASEMAP_CHAIN)[number]>(BASEMAP_CHAIN[0]);
  const [label, setLabel] = useState(() => basemapLabel(BASEMAP_CHAIN[0]));

  const providerRef = useRef(provider);
  const tileErrorsRef = useRef(0);
  const switchingRef = useRef(false);

  // --- create the map once ------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;
    configureWorker();

    const instance = new MapLibreMap({
      container: containerRef.current,
      style: buildBasemapStyle(providerRef.current) as StyleSpecification,
      center: toLngLat(center),
      zoom,
      minZoom,
      maxZoom,
      attributionControl: false,
      // A trip planner is a north-up, two-dimensional reading of geography.
      // Rotating or tilting would break the spatial mental model.
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      fadeDuration: 140,
      interactive,
    });

    instance.addControl(new AttributionControl({ compact: true }), 'bottom-right');
    instance.addControl(
      new NavigationControl({ showCompass: false, visualizePitch: false }),
      zoomControlPosition,
    );
    instance.addControl(new ScaleControl({ unit: 'metric', maxWidth: 90 }), 'bottom-left');
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.enable();

    instance.on('style.load', () => setStyleEpoch((epoch) => epoch + 1));

    // Count only tile failures; a missing glyph or sprite should never trigger
    // a provider switch. Everything else is logged in development, because a
    // silently rejected style expression is invisible otherwise — that cost real
    // debugging time once already.
    instance.on('error', (event: { error?: { message?: string }; sourceId?: string }) => {
      const message = event?.error?.message ?? '';
      const isTileFailure =
        event?.sourceId === 'basemap' || /tile|Failed to fetch|NetworkError|404/i.test(message);
      if (!isTileFailure) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[map]', message);
        }
        return;
      }
      tileErrorsRef.current += 1;
      if (tileErrorsRef.current < 10 || switchingRef.current) return;
      const next = BASEMAP_CHAIN[BASEMAP_CHAIN.indexOf(providerRef.current) + 1];
      if (!next) return;
      switchingRef.current = true;
      providerRef.current = next;
      tileErrorsRef.current = 0;
      setProvider(next);
      setLabel(basemapLabel(next));
      instance.setStyle(buildBasemapStyle(next) as StyleSpecification);
      window.setTimeout(() => {
        switchingRef.current = false;
      }, 3000);
    });

    // Dev-only handle so automated visual checks and the browser console can
    // inspect the live camera instead of guessing at it. Stripped in production.
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as Record<string, unknown>).__mmMap = instance;
    }

    setMap(instance);
    return () => {
      instance.remove();
      setMap(null);
      setStyleEpoch(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- imperative view control -------------------------------------------
  const applyFit = (mapInstance: MapLibreMap) => {
    if (!bounds) return;
    const sw: [number, number] = [bounds[0][1], bounds[0][0]];
    const ne: [number, number] = [bounds[1][1], bounds[1][0]];
    mapInstance.fitBounds([sw, ne], {
      padding: {
        top: fitPadding[1],
        bottom: fitPadding[1] + fitPaddingBottom,
        left: fitPaddingLeft ?? fitPadding[0],
        right: fitPaddingRight ?? fitPadding[0],
      },
      ...(fitMaxZoom !== undefined ? { maxZoom: fitMaxZoom } : {}),
      animate: false,
    });
  };

  useEffect(() => {
    if (!map || styleEpoch === 0) return;
    if (fitBounds && bounds) applyFit(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, styleEpoch, fitBounds, fitKey, fitPaddingBottom, fitPaddingLeft, fitPaddingRight, fitMaxZoom]);

  useEffect(() => {
    if (!map || styleEpoch === 0 || fitBounds) return;
    map.jumpTo({ center: toLngLat(center), zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, styleEpoch, center[0], center[1], zoom, fitBounds]);

  // --- view change reporting ---------------------------------------------
  useEffect(() => {
    if (!map || !onViewChange) return;
    const emit = () => {
      const b = map.getBounds();
      onViewChange({
        zoom: map.getZoom(),
        center: { lat: map.getCenter().lat, lng: map.getCenter().lng },
        bounds: [
          [b.getSouth(), b.getWest()],
          [b.getNorth(), b.getEast()],
        ],
      });
    };
    map.on('moveend', emit);
    map.on('zoomend', emit);
    emit();
    return () => {
      map.off('moveend', emit);
      map.off('zoomend', emit);
    };
  }, [map, onViewChange]);

  useEffect(() => {
    if (!map || !onBackgroundClick) return;
    const handler = () => onBackgroundClick();
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onBackgroundClick]);

  // --- keep the canvas in sync with layout changes ------------------------
  useEffect(() => {
    if (!map || !containerRef.current) return;
    const el = containerRef.current;
    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        map.resize();
        if (refitOnResize && fitBounds && bounds) applyFit(map);
      });
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, refitOnResize, fitBounds, fitKey, fitPaddingBottom, fitPaddingLeft, fitPaddingRight, fitMaxZoom]);

  const contextValue = useMemo<MapContextValue>(() => ({ map, styleEpoch }), [map, styleEpoch]);

  return (
    <MapContext.Provider value={contextValue}>
      {/*
        `isolate` is load-bearing: markers set their own z-index for ordering
        within the map, and without a stacking context here those values compete
        with page chrome — a marker would float above the mobile bottom sheet.
      */}
      <div className={cn('relative isolate h-full w-full', className)}>
        <div
          ref={containerRef}
          className="h-full w-full bg-[var(--map-land)]"
          role="application"
          aria-label={ariaLabel}
        />
        {!map && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--map-land)]">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
              Loading map…
            </div>
          </div>
        )}
        {children}
        <div className="maplibregl-basemap-badge">Basemap · {label}</div>
      </div>
    </MapContext.Provider>
  );
}

export default MapCanvas;
