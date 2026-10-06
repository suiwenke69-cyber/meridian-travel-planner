'use client';

import { useMemo } from 'react';
import type { Destination, OriginCity } from '@/lib/types';
import { routeSummary } from '@/lib/data';
import MapCanvas from '../map/MapCanvas';
import MarkersLayer, { type MapMarker } from '../map/MarkersLayer';
import RegionArcLayer from '../map/RegionArcLayer';
import DestinationLayer, { type DestinationFeature } from '../map/DestinationLayer';
import { originVisual } from '../map/marker-icons';
import { useIsDesktop } from '@/lib/hooks';
import { useName, useT, useLocale } from '@/lib/i18n/use-t';

/** Vertical space the collapsed/half/full sheet takes out of the visible map. */
const SHEET_PADDING = { peek: 190, half: 470, full: 780 } as const;

/**
 * The Southeast Asia overview map.
 *
 * Destinations are rendered as native vector layers (dot + label), not DOM pins.
 * Only the origin uses a DOM marker, because it needs a bespoke star — and it
 * now moves with the traveller: pick Guangzhou and the star is in Guangzhou.
 * A single arc is drawn, and only for the selected destination.
 */
export default function RegionMapView({
  destinations,
  origin,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onBackgroundClick,
  sheetSnap = 'peek',
}: {
  destinations: Destination[];
  origin: OriginCity;
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
  const t = useT();
  const name = useName();
  const locale = useLocale();

  /**
   * Region framing is derived from the data, never hard-coded.
   *
   * A fixed bounding box had drifted out of date and left Bali — a destination —
   * completely off-screen. Computing the extent from the origin plus every
   * destination means adding Bangkok or Mauritius later just works.
   */
  const regionBounds = useMemo<[[number, number], [number, number]]>(() => {
    const points = [origin.coordinates, ...destinations.map((d) => d.coordinates)];
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
  }, [destinations, origin]);

  const features = useMemo<DestinationFeature[]>(
    () =>
      destinations.map((destination) => {
        const route = routeSummary(origin.id, destination.id);
        /*
         * Three honest states, three different labels.
         *
         * `null` direct is UNKNOWN, not "no". Rendering it as 需转机 would
         * assert a connection we have no data for, which is the failure this
         * whole layer exists to avoid.
         */
        const status =
          route.direct === true
            ? t('route.direct')
            : route.direct === false
              ? t('route.connection')
              : t('route.unknown');
        const duration = route.durationMinutes
          ? `${Math.round((route.durationMinutes.min + route.durationMinutes.max) / 2)} min`
          : null;
        const meta = [duration, status].filter(Boolean).join(' · ');
        return {
          id: destination.id,
          name: name.primary(destination),
          country:
            locale === 'zh-CN' ? (destination.countryZh ?? destination.country) : destination.country,
          meta,
          lat: destination.coordinates.lat,
          lng: destination.coordinates.lng,
        };
      }),
    [destinations, origin.id, t, name, locale],
  );

  const originMarker = useMemo<MapMarker>(
    () => ({
      id: '__origin__',
      lat: origin.coordinates.lat,
      lng: origin.coordinates.lng,
      layer: 'airport',
      label: t('region.homeAndOrigin'),
      custom: originVisual(false, {
        name: locale === 'zh-CN' ? origin.cityNameZh : origin.cityNameEn,
        meta: t('origin.label'),
      }),
      noTooltip: true,
      zIndexOffset: 1200,
    }),
    [t, origin, locale],
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
      // Refit when the origin changes: the viewport must contain the star AND
      // the destinations, and that extent is different for every origin.
      fitKey={`sea-${origin.id}-${isDesktop ? 'desktop' : sheetSnap}`}
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
      ariaLabel={t('origin.mapAria', {
        origin: locale === 'zh-CN' ? origin.cityNameZh : origin.cityNameEn,
      })}
      zoomControlPosition="bottom-right"
      onBackgroundClick={onBackgroundClick}
    >
      <RegionArcLayer origin={origin.coordinates} target={selectedTarget} />
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
