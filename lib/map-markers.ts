import type {
  Airport,
  Hotel,
  ItineraryItem,
  MarkerLayer,
  Place,
  Trip,
  TripDay,
} from './types';
import type { MapMarker } from '@/components/map/MarkersLayer';
import { filterHotels, filterPlaces, type MapFilters } from './filters';
import { LAYER_BY_ID } from './layers';

/**
 * Turns domain data + the user's plan into the flat marker list the map renders.
 *
 * Kept out of the component so the "what is on the map right now" rule is
 * testable in isolation: layers decide visibility, filters decide membership,
 * the active day decides emphasis and ordering.
 */

export interface MarkerBuildInput {
  hotels: Hotel[];
  places: Place[];
  airports: Airport[];
  trip: Trip | null;
  /** The day currently selected in the planner, if any. */
  activeDay: TripDay | null;
  visibleLayers: Record<MarkerLayer, boolean>;
  filters: MapFilters;
  selectedEntityId: string | null;
  selectedItemId: string | null;
  hoveredItemId: string | null;
  areaNameById: Map<string, string>;
  /** Global cap so a filter that matches everything cannot stall the map. */
  limit?: number;
}

export interface BuiltMarkers {
  markers: MapMarker[];
  counts: Record<MarkerLayer, number>;
  hiddenByFilter: number;
}

export function buildMapMarkers(input: MarkerBuildInput): BuiltMarkers {
  const {
    hotels,
    places,
    airports,
    trip,
    activeDay,
    visibleLayers,
    filters,
    selectedEntityId,
    selectedItemId,
    hoveredItemId,
    areaNameById,
  } = input;

  const activeOrder = new Map<string, { order: number; item: ItineraryItem }>();
  activeDay?.items.forEach((item, index) => {
    // First occurrence wins; a place added twice should not renumber the route.
    if (!activeOrder.has(item.refId)) activeOrder.set(item.refId, { order: index + 1, item });
  });

  const otherDayRefs = new Map<string, string>();
  trip?.days.forEach((day) => {
    if (day.id === activeDay?.id) return;
    for (const item of day.items) {
      if (!otherDayRefs.has(item.refId)) otherDayRefs.set(item.refId, day.id);
    }
  });

  const markers: MapMarker[] = [];
  const counts: Record<MarkerLayer, number> = {
    marriott: 0,
    hilton: 0,
    activity: 0,
    nature: 0,
    beach: 0,
    food: 0,
    nightlife: 0,
    airport: 0,
    transport: 0,
  };

  const hotelsInScope = filterHotels(hotels, filters, areaNameById);
  const placesInScope = filterPlaces(places, filters, areaNameById);
  const hotelIdsInScope = new Set(hotelsInScope.map((h) => h.id));
  const placeIdsInScope = new Set(placesInScope.map((p) => p.id));
  const hiddenByFilter = hotels.length - hotelsInScope.length + (places.length - placesInScope.length);
  const seenRefs = new Set<string>();

  // --- hotels -------------------------------------------------------------
  // `counts` reflects what passes the FILTERS (the legend shows inventory);
  // `visibleLayers` separately controls whether the layer is drawn.
  for (const hotel of hotels) {
    const layer: MarkerLayer = hotel.hotelGroup === 'marriott' ? 'marriott' : 'hilton';
    if (!hotelIdsInScope.has(hotel.id)) continue;
    counts[layer] += 1;
    if (!visibleLayers[layer]) continue;

    const inActiveDay = activeOrder.get(hotel.id);
    markers.push({
      id: hotel.id,
      lat: hotel.coordinates.lat,
      lng: hotel.coordinates.lng,
      layer,
      label: hotel.name,
      sublabel: `${hotel.brand} · ${areaNameById.get(hotel.areaId) ?? hotel.areaId} · ${hotel.priceTier}`,
      groupMark: hotel.hotelGroup === 'marriott' ? 'M' : 'H',
      order: inActiveDay?.order,
      selected: selectedEntityId === hotel.id || selectedItemId === inActiveDay?.item.id,
      emphasised:
        hoveredItemId != null && (hoveredItemId === inActiveDay?.item.id || hoveredItemId === hotel.id),
      dimmed: !inActiveDay && otherDayRefs.has(hotel.id),
      zIndexOffset: 200,
    });
    seenRefs.add(hotel.id);
  }

  // --- places -------------------------------------------------------------
  for (const place of places) {
    if (!placeIdsInScope.has(place.id)) continue;
    counts[place.markerLayer] += 1;
    if (!visibleLayers[place.markerLayer]) continue;

    const inActiveDay = activeOrder.get(place.id);
    markers.push({
      id: place.id,
      lat: place.coordinates.lat,
      lng: place.coordinates.lng,
      layer: place.markerLayer,
      label: place.name,
      sublabel: `${LAYER_BY_ID[place.markerLayer]?.label ?? place.category} · ${
        areaNameById.get(place.areaId) ?? place.areaId
      }`,
      order: inActiveDay?.order,
      selected: selectedEntityId === place.id || selectedItemId === inActiveDay?.item.id,
      emphasised:
        hoveredItemId != null && (hoveredItemId === inActiveDay?.item.id || hoveredItemId === place.id),
      dimmed: !inActiveDay && otherDayRefs.has(place.id),
    });
    seenRefs.add(place.id);
  }

  // --- airports -----------------------------------------------------------
  for (const airport of airports) {
    counts.airport += 1;
    if (!visibleLayers.airport) continue;
    const inActiveDay = activeOrder.get(airport.id);
    markers.push({
      id: airport.id,
      lat: airport.coordinates.lat,
      lng: airport.coordinates.lng,
      layer: 'airport',
      label: `${airport.code} · ${airport.name}`,
      sublabel: `${airport.city} · ${airport.directFromSingapore ? 'non-stop from SIN' : 'connection required'}`,
      order: inActiveDay?.order,
      selected: selectedEntityId === airport.id,
      dimmed: !inActiveDay && otherDayRefs.has(airport.id),
      zIndexOffset: 400,
    });
    seenRefs.add(airport.id);
  }

  // --- user-created stops that are not in the destination dataset ----------
  trip?.days.forEach((day) => {
    for (const item of day.items) {
      if (seenRefs.has(item.refId)) continue;
      const inActiveDay = activeOrder.get(item.refId);
      markers.push({
        id: item.refId,
        lat: item.lat,
        lng: item.lng,
        layer: item.kind,
        label: item.name,
        sublabel: 'Custom stop',
        order: inActiveDay?.order,
        selected: selectedEntityId === item.refId || selectedItemId === inActiveDay?.item.id,
        emphasised:
          hoveredItemId != null && (hoveredItemId === inActiveDay?.item.id || hoveredItemId === item.refId),
        dimmed: day.id !== activeDay?.id,
      });
      seenRefs.add(item.refId);
    }
  });

  const limit = input.limit ?? 400;
  const trimmed = markers.length > limit ? markers.slice(0, limit) : markers;
  return { markers: trimmed, counts, hiddenByFilter };
}

/** Ids of the areas touched by the active day (used to tint area shapes). */
export function activeAreaIdsOf(day: TripDay | null): string[] {
  if (!day) return [];
  return Array.from(new Set(day.items.map((i) => i.areaId).filter((v): v is string => Boolean(v))));
}

/**
 * Layer inventory after filters, used by the legend and the toolbar.
 * Cheap enough to call from a render: it only walks the destination's datasets.
 */
export function countMarkersByLayer(
  hotels: Hotel[],
  places: Place[],
  airports: Airport[],
  filters: MapFilters,
  areaNameById: Map<string, string>,
): Record<MarkerLayer, number> {
  const counts: Record<MarkerLayer, number> = {
    marriott: 0,
    hilton: 0,
    activity: 0,
    nature: 0,
    beach: 0,
    food: 0,
    nightlife: 0,
    airport: 0,
    transport: 0,
  };
  for (const hotel of filterHotels(hotels, filters, areaNameById)) {
    counts[hotel.hotelGroup === 'marriott' ? 'marriott' : 'hilton'] += 1;
  }
  for (const place of filterPlaces(places, filters, areaNameById)) {
    counts[place.markerLayer] += 1;
  }
  counts.airport += airports.length;
  return counts;
}
