'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Hotel, Place, Trip, TripDay } from '@/lib/types';
import { getDestinationBundle, isLocatable } from '@/lib/data';
import { buildMapMarkers } from '@/lib/map-markers';
import { deriveTripAnchors } from '@/lib/trip-stays';
import { useDayLegs } from '@/lib/transport/use-day-legs';
import { useT } from '@/lib/i18n/use-t';
import MapCanvas from '@/components/map/MapCanvas';
import MarkersLayer from '@/components/map/MarkersLayer';
import RouteLayer from '@/components/map/RouteLayer';

/**
 * The trip, on the map.
 *
 * WHAT THIS IS NOT
 * ----------------
 * It is not a second map engine. It reuses `MapCanvas`, `MarkersLayer`,
 * `RouteLayer` and the SAME `useDayLegs` the itinerary uses, so the line drawn
 * here is the line the timeline measured — including the hotel-to-hotel leg on a
 * change day, which is the whole reason the anchors were worth modelling.
 *
 * The day filter is the only new control: it scopes stops, anchors and routes to
 * one day, or shows the whole trip at once so the geography reads as a shape.
 */
export function TripMapView({
  trip,
  days,
  destinationId,
  hotels,
  places,
  areaNameById,
}: {
  trip: Trip;
  days: TripDay[];
  destinationId: string;
  hotels: Hotel[];
  places: Place[];
  areaNameById: Map<string, string>;
}) {
  const t = useT();
  const bundle = getDestinationBundle(destinationId);
  const anchorsByDay = useMemo(() => deriveTripAnchors(trip, hotels), [trip, hotels]);

  /*
   * Only the ACTIVE day is routed, which is the same rule the planner uses: a
   * ten-day trip is a handful of requests rather than hundreds. When the filter
   * is "all", nothing is routed and the map draws the stops instead — an
   * all-trip route line would be a line the traveller never drives.
   */
  const routingDay = days.length === 1 ? days[0] : null;
  const routingAnchors = routingDay ? (anchorsByDay.get(routingDay.id) ?? null) : null;
  const { legs } = useDayLegs(routingDay, routingAnchors);

  const fitOnceRef = useRef<string>('');
  const fitKey = `${destinationId}:${days.map((day) => day.id).join(',')}`;

  const markers = useMemo(() => {
    if (!bundle) return [];
    const scoped = new Set(days.map((day) => day.id));
    const tripPlaces = places.filter((place) =>
      trip.days.some((day) => scoped.has(day.id) && day.items.some((item) => item.refId === place.id)),
    );
    const hotelIds = new Set<string>();
    for (const day of trip.days) {
      if (!scoped.has(day.id)) continue;
      const anchors = anchorsByDay.get(day.id);
      if (anchors?.start?.refId) hotelIds.add(anchors.start.refId);
      if (anchors?.end?.refId) hotelIds.add(anchors.end.refId);
      // A legacy hotel row is still a stop on the map.
      for (const item of day.items) if (isHotelKind(item.kind)) hotelIds.add(item.refId);
    }
    const tripHotels = hotels.filter((hotel) => hotelIds.has(hotel.id));

    const layers = emptyLayers();
    for (const place of tripPlaces) layers[place.markerLayer] = true;
    for (const hotel of tripHotels) layers[hotel.hotelGroup] = true;

    return buildMapMarkers({
      hotels: tripHotels,
      places: tripPlaces.filter(isLocatable),
      airports: [],
      trip: null,
      activeDay: null,
      visibleLayers: layers,
      filters: { query: '', hotelGroups: [], priceTiers: [], hotelStyles: [], placeCategories: [] },
      selectedEntityId: null,
      selectedItemId: null,
      hoveredItemId: null,
      areaNameById,
    }).markers;
  }, [bundle, days, places, hotels, anchorsByDay, areaNameById, trip.days]);

  const routePoints = useMemo(() => {
    if (!routingDay) return [];
    const stops = [
      routingAnchors?.start,
      ...routingDay.items,
      routingAnchors?.end,
    ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    return stops.map((stop, index) => ({ id: `trip-${index}`, lat: stop.lat, lng: stop.lng, layer: 'activity' as const }));
  }, [routingDay, routingAnchors]);

  // The camera frames the current filter once per selection, not on every render.
  useEffect(() => {
    if (!bundle || markers.length === 0) return;
    if (fitOnceRef.current === fitKey) return;
    fitOnceRef.current = fitKey;
    const points = markers.map((marker) => ({ lat: marker.lat, lng: marker.lng }));
    // `requestFit` inside the canvas is driven by the planner's store; here the
    // engine is reached directly so a trip map needs no UI-store state at all.
    const map = (window as unknown as { __mmMap?: { fitBounds: (b: unknown, o?: unknown) => void } }).__mmMap;
    if (!map || points.length === 0) return;
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    const pad = 0.01;
    map.fitBounds(
      [
        [Math.min(...lngs) - pad, Math.min(...lats) - pad],
        [Math.max(...lngs) + pad, Math.max(...lats) + pad],
      ],
      { padding: 60, duration: 600 },
    );
  }, [bundle, markers, fitKey]);

  if (!bundle) return <p className="text-[12.5px] text-muted">{t('trips.mapEmpty')}</p>;

  return (
    <div className="relative h-[420px] overflow-hidden rounded-card border border-line sm:h-[520px]" data-testid="trip-map">
      <MapCanvas
        center={bundle.destination.mapView.center}
        zoom={bundle.destination.mapView.zoom}
        bounds={bundle.destination.mapBounds}
        fitBounds={Boolean(bundle.destination.mapBounds)}
        fitKey={`trip-${destinationId}`}
        minZoom={8}
        maxZoom={18}
        fitPadding={[60, 60]}
        ariaLabel={`Map of ${bundle.destination.name}`}
        zoomControlPosition="bottom-right"
      >
        {routePoints.length >= 2 && <RouteLayer points={routePoints} dashed={false} />}
        <MarkersLayer markers={markers} cluster clusterMaxZoom={12} onSelect={() => {}} />
      </MapCanvas>

      {markers.length === 0 && (
        <p className="absolute inset-x-0 top-3 mx-auto w-fit rounded-full border border-line bg-surface px-3 py-1 text-[11.5px] text-muted">
          {t('trips.mapEmpty')}
        </p>
      )}
    </div>
  );
}

function emptyLayers() {
  return {
    marriott: false,
    hilton: false,
    ihg: false,
    hyatt: false,
    gha: false,
    activity: false,
    nature: false,
    beach: false,
    food: false,
    nightlife: false,
    airport: false,
    transport: false,
  };
}

function isHotelKind(kind: string): boolean {
  return kind === 'marriott' || kind === 'hilton' || kind === 'ihg' || kind === 'hyatt' || kind === 'gha';
}
