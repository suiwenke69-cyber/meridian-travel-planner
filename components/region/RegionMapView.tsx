'use client';

import { useMemo } from 'react';
import type { Destination } from '@/lib/types';
import { SINGAPORE_ORIGIN, hasDirectFromSingapore } from '@/lib/data';
import { formatMinutes } from '@/lib/geo';
import MapCanvas from '../map/MapCanvas';
import MarkersLayer, { type MapMarker } from '../map/MarkersLayer';
import RegionArcLayer from '../map/RegionArcLayer';
import DestinationLayer, { type DestinationFeature } from '../map/DestinationLayer';
import { originVisual } from '../map/marker-icons';
import { useIsDesktop } from '@/lib/hooks';

/** Vertical space the collapsed/half/full sheet takes out of the visible map. */
const SHEET_PADDING = { peek: 190, half: 470, full: 780 } as const;

/**
 * The Southeast Asia overview map.
 *
 * Destinations are rendered as native vector layers (dot + label), not DOM pins.
 * Only the Singapore origin uses a DOM marker, because it needs a bespoke star.
 * A single arc is drawn, and only for the selected destination.
 */
export default function RegionMapView({
  destinations,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onBackgroundClick,
  sheetSnap = 'peek',
}: {
  destinations: Destination[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onBackgroundClick: () => void;
  /** Mobile only: the sheet overlays the map, so the fit has to account for it. */
  sheetSnap?: 'peek' | 'half' | 'full';
}) {
  // The destination rail covers the western third of the map on desktop, so the
  // geography is fitted to the area the user can actually see.
  const isDesktop = useIsDesktop();

  /**
   * Region framing is derived from the data, never hard-coded.
   *
   * A fixed bounding box had drifted out of date and left Bali — a destination —
   * completely off-screen. Computing the extent from the origin plus every
   * destination means adding Bangkok or Mauritius later just works.
   */
  const regionBounds = useMemo<[[number, number], [number, number]]>(() => {
    const points = [SINGAPORE_ORIGIN.coordinates, ...destinations.map((d) => d.coordinates)];
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padLat = Math.max(0.9, (maxLat - minLat) * 0.09);
    const padLng = Math.max(0.9, (maxLng - minLng) * 0.06);
    return [
      [minLat - padLat, minLng - padLng],
      [maxLat + padLat, maxLng + padLng],
    ];
  }, [destinations]);

  const features = useMemo<DestinationFeature[]>(
    () =>
      destinations.map((destination) => {
        const airport = destination.airports.find((a) => a.role === 'primary') ?? destination.airports[0];
        const direct = hasDirectFromSingapore(destination);
        const duration = airport?.flightMinutes
          ? formatMinutes((airport.flightMinutes.min + airport.flightMinutes.max) / 2)
          : null;
        const meta = [duration, direct ? 'Direct' : 'Connection']
          .filter(Boolean)
          .join(' · ');
        return {
          id: destination.id,
          name: destination.name,
          country: destination.country,
          meta,
          lat: destination.coordinates.lat,
          lng: destination.coordinates.lng,
        };
      }),
    [destinations],
  );

  const originMarker = useMemo<MapMarker>(
    () => ({
      id: '__origin__',
      lat: SINGAPORE_ORIGIN.coordinates.lat,
      lng: SINGAPORE_ORIGIN.coordinates.lng,
      layer: 'airport',
      label: 'Singapore — home and origin',
      custom: originVisual(false),
      noTooltip: true,
      zIndexOffset: 1200,
    }),
    [],
  );

  const selectedTarget = useMemo(() => {
    const target = destinations.find((d) => d.id === selectedId);
    return target ? { id: target.id, lat: target.coordinates.lat, lng: target.coordinates.lng } : null;
  }, [destinations, selectedId]);

  return (
    <MapCanvas
      center={[6, 112]}
      zoom={5}
      bounds={regionBounds}
      fitBounds
      fitKey={`sea-${isDesktop ? 'desktop' : sheetSnap}`}
      /*
       * minZoom must stay below the fitted zoom for the narrowest viewport.
       * At 4 the phone fit was clamped, the region overflowed the canvas and
       * Singapore — the origin — was pushed off the left edge.
       */
      minZoom={3}
      maxZoom={12}
      fitPadding={[40, 44]}
      fitPaddingLeft={isDesktop ? 350 : 26}
      fitPaddingRight={isDesktop ? 30 : 26}
      /*
       * The bottom sheet is an overlay, so expanding it does not resize the
       * canvas. Refitting on snap change keeps the destinations in the part of
       * the map the user can actually see — the same thing a native maps app
       * does when you drag a place card up.
       */
      fitPaddingBottom={isDesktop ? 0 : SHEET_PADDING[sheetSnap]}
      fitMaxZoom={6.6}
      ariaLabel="Map of Southeast Asia showing destinations reachable from Singapore"
      zoomControlPosition="bottom-right"
      onBackgroundClick={onBackgroundClick}
    >
      <RegionArcLayer target={selectedTarget} />
      <DestinationLayer
        destinations={features}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />
      <MarkersLayer markers={[originMarker]} onSelect={() => undefined} cluster={false} />
    </MapCanvas>
  );
}
