import type {
  Airport,
  Area,
  AreaSeed,
  Destination,
  DestinationSeed,
  Hotel,
  HotelSeed,
  OriginDestinationConnection,
  Place,
  PlaceSeed,
} from '../types';
import { getConnection } from './connections';
import { getImages } from '../images';
import { AREA_TAGLINES, deriveTagline } from './area-taglines';
import { bali, baliAreas, baliHotels, baliPlaces } from './destinations/bali';
import { baliRestaurants } from './destinations/bali-restaurants';
import { baliActivities } from './destinations/bali-activities';
import {
  BALI_AREA_ZH,
  BALI_DESTINATION_BESTFOR_ZH,
  BALI_DESTINATION_ZH,
  BALI_HOTEL_ZH,
  BALI_PLACE_ZH,
  DESTINATION_ZH,
  STARTER_DESTINATION_BESTFOR_ZH,
  STARTER_DESTINATION_ZH,
} from './zh/bali-zh';
import { starterDestinations, starterHotels, starterPlaces } from './destinations/starter';

/**
 * Destination registry.
 *
 * This is the ONLY place that knows the full list of destinations. Adding a
 * destination = add a data module and one line here. No component changes.
 */

/**
 * Photography and area taglines are attached here rather than baked into the
 * destination files.
 *
 * That keeps the hand-authored and machine-verified geography files free of
 * presentation data, and means swapping the image provider (or shipping a
 * destination with no photography at all) requires no change to the data.
 */
function decorateHotel(hotel: HotelSeed): Hotel {
  const zh = BALI_HOTEL_ZH[hotel.id];
  return {
    ...hotel,
    nameZh: hotel.nameZh ?? zh?.nameZh,
    descriptionZh: hotel.descriptionZh ?? zh?.descriptionZh,
    images: getImages('hotel', hotel.id),
  };
}

function decoratePlace(place: PlaceSeed): Place {
  const zh = BALI_PLACE_ZH[place.id];
  return {
    ...place,
    nameZh: place.nameZh ?? zh?.nameZh,
    descriptionZh: place.descriptionZh ?? zh?.descriptionZh,
    bestTimeZh: place.bestTimeZh ?? zh?.bestTimeZh,
    tagsZh: place.tagsZh ?? zh?.tagsZh,
    images: getImages('place', place.id),
  };
}

function decorateArea(area: AreaSeed): Area {
  const zh = BALI_AREA_ZH[area.id];
  return {
    ...area,
    nameZh: area.nameZh ?? zh?.nameZh,
    taglineZh: area.taglineZh ?? zh?.taglineZh,
    summaryZh: area.summaryZh ?? zh?.summaryZh,
    vibeZh: area.vibeZh ?? zh?.vibeZh,
    bestForZh: area.bestForZh ?? zh?.bestForZh,
    weakForZh: area.weakForZh ?? zh?.weakForZh,
    tagline: AREA_TAGLINES[area.id] ?? deriveTagline(area),
    images: getImages('area', area.id),
  };
}

const HOTELS: Hotel[] = [...baliHotels, ...starterHotels].map(decorateHotel);
const PLACES: Place[] = [...baliPlaces, ...baliRestaurants, ...baliActivities, ...starterPlaces].map(decoratePlace);
const AREAS: Area[] = [baliAreas, ...starterDestinations.map((d) => d.areas)].flat().map((area) => decorateArea(area));

function decorateDestination(destination: DestinationSeed): Destination {
  const naming = DESTINATION_ZH[destination.id];
  const copy = destination.id === 'bali' ? BALI_DESTINATION_ZH : STARTER_DESTINATION_ZH[destination.id];
  return {
    ...destination,
    nameZh: destination.nameZh ?? naming?.nameZh,
    countryZh: destination.countryZh ?? naming?.countryZh,
    taglineZh: destination.taglineZh ?? copy?.taglineZh,
    descriptionZh: destination.descriptionZh ?? copy?.descriptionZh,
    bestForZh:
      destination.bestForZh ??
      (destination.id === 'bali'
        ? BALI_DESTINATION_BESTFOR_ZH
        : STARTER_DESTINATION_BESTFOR_ZH[destination.id]),
    areas: destination.areas.map(decorateArea),
  };
}

export const DESTINATIONS: Destination[] = [bali, ...starterDestinations].map(decorateDestination);

const DESTINATION_BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]));

export function getDestination(id: string): Destination | undefined {
  return DESTINATION_BY_ID.get(id);
}

export function getDestinationIds(): string[] {
  return DESTINATIONS.map((d) => d.id);
}

/** Destinations with richer data are surfaced first in lists. */
export function getDestinationsByStatus(): { reference: Destination[]; starter: Destination[] } {
  return {
    reference: DESTINATIONS.filter((d) => d.status === 'reference'),
    starter: DESTINATIONS.filter((d) => d.status === 'starter'),
  };
}

export function getHotels(destinationId: string): Hotel[] {
  return HOTELS.filter((h) => h.destinationId === destinationId);
}

export function getPlaces(destinationId: string): Place[] {
  return PLACES.filter((p) => p.destinationId === destinationId);
}

export function getAreas(destinationId: string): Area[] {
  return AREAS.filter((a) => a.destinationId === destinationId);
}

export function getStayAreas(destinationId: string): Area[] {
  return getAreas(destinationId).filter((a) => a.isStayBase);
}

export function getAirports(destinationId: string): Airport[] {
  return getDestination(destinationId)?.airports ?? [];
}

export function getPrimaryAirport(destinationId: string): Airport | undefined {
  return getAirports(destinationId).find((a) => a.role === 'primary') ?? getAirports(destinationId)[0];
}

export function getArea(destinationId: string, areaId: string): Area | undefined {
  return AREAS.find((a) => a.destinationId === destinationId && a.id === areaId);
}

export function areaName(destinationId: string, areaId: string | undefined): string | undefined {
  if (!areaId) return undefined;
  return getArea(destinationId, areaId)?.name;
}

export function getAllHotels(): Hotel[] {
  return HOTELS;
}

export function getAllPlaces(): Place[] {
  return PLACES;
}

/**
 * True when we know where a place is.
 *
 * A place whose coordinates never resolved from a map source keeps
 * `confidence: 'demo'` and sits at 0,0. It is still worth reading about, but it
 * must never reach the map — a pin in the Gulf of Guinea, or a route that
 * measures 8,000 km to dinner, is worse than an honest "location not verified".
 *
 * `demo` is the marker rather than a separate boolean because it already means
 * exactly this, and the confidence badge in the UI renders it.
 */
export function isLocatable(place: Place): boolean {
  return place.coordinates.confidence !== 'demo';
}

/** Places we can actually put on a map, which is what routing and the map need. */
export function getLocatablePlaces(destinationId?: string): Place[] {
  const list = destinationId ? getPlaces(destinationId) : PLACES;
  return list.filter(isLocatable);
}

/** All airports across the region — used by the transport overview. */
export function getAllAirports(): Airport[] {
  return DESTINATIONS.flatMap((d) => d.airports);
}

export type EntityRef =
  | { kind: 'hotel'; hotel: Hotel }
  | { kind: 'place'; place: Place }
  | { kind: 'airport'; airport: Airport };

/** Resolve any marker id back to its domain object. */
export function findEntity(destinationId: string, id: string): EntityRef | null {
  const hotel = HOTELS.find((h) => h.destinationId === destinationId && h.id === id);
  if (hotel) return { kind: 'hotel', hotel };
  const place = PLACES.find((p) => p.destinationId === destinationId && p.id === id);
  if (place) return { kind: 'place', place };
  const airport = getAirports(destinationId).find((a) => a.id === id || a.code === id);
  if (airport) return { kind: 'airport', airport };
  return null;
}

export interface DestinationStats {
  hotelCount: number;
  marriottCount: number;
  hiltonCount: number;
  placeCount: number;
  areaCount: number;
  airportCount: number;
  verifiedCount: number;
  approximateCount: number;
}

export function destinationStats(destinationId: string): DestinationStats {
  const hotels = getHotels(destinationId);
  const places = getPlaces(destinationId);
  const all = [...hotels.map((h) => h.coordinates), ...places.map((p) => p.coordinates)];
  return {
    hotelCount: hotels.length,
    marriottCount: hotels.filter((h) => h.hotelGroup === 'marriott').length,
    hiltonCount: hotels.filter((h) => h.hotelGroup === 'hilton').length,
    placeCount: places.length,
    areaCount: getAreas(destinationId).length,
    airportCount: getAirports(destinationId).length,
    verifiedCount: all.filter((c) => c.confidence === 'verified').length,
    approximateCount: all.filter((c) => c.confidence !== 'verified').length,
  };
}

export interface DestinationBundle {
  destination: Destination;
  hotels: Hotel[];
  places: Place[];
  areas: Area[];
  airports: Airport[];
}

export function getDestinationBundle(id: string): DestinationBundle | null {
  const destination = getDestination(id);
  if (!destination) return null;
  return {
    destination,
    hotels: getHotels(id),
    places: getPlaces(id),
    areas: getAreas(id),
    airports: getAirports(id),
  };
}

/**
 * Route facts for a destination AS SEEN FROM AN ORIGIN.
 *
 * These used to read `airport.directFromSingapore` and `airport.flightMinutes`,
 * which made Singapore the only origin the product could describe. The data now
 * comes from an `OriginDestinationConnection`, so the same destination answers
 * differently depending on where the traveller is leaving from.
 *
 * `direct` is `boolean | null`, and `null` means we do not know — the caller
 * must render 航班信息待确认 rather than assuming either answer.
 */
export function routeFor(
  originCityId: string,
  destinationId: string,
): { connection: OriginDestinationConnection; destinationAirport?: Airport } {
  return {
    connection: getConnection(originCityId, destinationId),
    destinationAirport: getPrimaryAirport(destinationId),
  };
}

/** Destinations reachable non-stop from this origin, among those we know about. */
export function hasKnownDirect(originCityId: string, destinationId: string): boolean {
  return getConnection(originCityId, destinationId).directAvailable === true;
}

/**
 * The honest one-liner for a destination card.
 *
 * Returns structured parts rather than a formatted string, because "2h45m
 * non-stop" and "航班信息待确认" are not the same kind of statement and the card
 * needs to style them differently.
 */
export interface RouteSummary {
  /** `null` when unknown. Never inferred. */
  direct: boolean | null;
  durationMinutes: { min: number; max: number } | null;
  confidence: OriginDestinationConnection['confidence'];
  weekendSuitability: OriginDestinationConnection['weekendSuitability'];
  destinationAirports: string[];
  originAirports: string[];
  source: string;
  verifiedAt: string;
}

export function routeSummary(originCityId: string, destinationId: string): RouteSummary {
  const c = getConnection(originCityId, destinationId);
  return {
    direct: c.directAvailable,
    durationMinutes: c.approximateFlightDuration,
    confidence: c.confidence,
    weekendSuitability: c.weekendSuitability,
    destinationAirports: c.destinationAirports,
    originAirports: c.originAirports,
    source: c.source,
    verifiedAt: c.verifiedAt,
  };
}

export function formatMinutesRange(min: number, max: number): string {
  const fmt = (m: number) => {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
  };
  return `${fmt(min)}–${fmt(max)}`;
}

export { SEA_MAP_VIEW, REGIONS, getRegion } from './regions';
export {
  ORIGIN_CITIES,
  ORIGIN_REGIONS,
  DEFAULT_ORIGIN_CITY_ID,
  getOriginCity,
  getOriginCities,
  getOriginCityByAirportCode,
  airportCodesFor,
  originMatchesQuery,
} from './origins';
export { getConnection, getConnectionsForOrigin, connectionCoverage } from './connections';
export { HOTEL_BRANDS, HOTEL_GROUPS, getHotelBrand, inferPriceTier, getHotelGroup } from './hotel-brands';
