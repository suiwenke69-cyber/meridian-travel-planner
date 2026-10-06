import type { Coordinates, Geocoded, LatLngTuple } from './types';

const EARTH_RADIUS_KM = 6371.0088;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total path length in kilometres. */
export function pathLengthKm(points: Coordinates[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += haversineKm(points[i - 1], points[i]);
  return total;
}

/** Arithmetic mean of a set of coordinates. */
export function centroid(points: Coordinates[]): Coordinates | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** Bounding box of a set of points. */
export function bbox(points: Coordinates[]): [LatLngTuple, LatLngTuple] | null {
  if (points.length === 0) return null;
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/** Diagonal of the bounding box in km — a cheap "how spread out is this?" metric. */
export function spreadKm(points: Coordinates[]): number {
  const box = bbox(points);
  if (!box) return 0;
  return haversineKm(
    { lat: box[0][0], lng: box[0][1] },
    { lat: box[1][0], lng: box[1][1] },
  );
}

/**
 * Detour ratio: how much further B is when travelled via C compared to going
 * straight from A to B. 1.0 means C is exactly on the way; 2.0 means C doubles
 * the distance. Used to spot backtracking.
 */
export function detourRatio(a: Coordinates, b: Coordinates, c: Coordinates): number {
  const direct = haversineKm(a, b);
  if (direct < 0.2) return 1;
  return (haversineKm(a, c) + haversineKm(c, b)) / direct;
}

export function toLatLng(point: Coordinates): LatLngTuple {
  return [point.lat, point.lng];
}

/** Weighted centre of a set of geocoded items (used for "where is my trip clustered?"). */
export function weightedCentre(points: Array<Coordinates & { weight?: number }>): Coordinates | null {
  if (points.length === 0) return null;
  let wSum = 0;
  let lat = 0;
  let lng = 0;
  for (const p of points) {
    const w = p.weight ?? 1;
    wSum += w;
    lat += p.lat * w;
    lng += p.lng * w;
  }
  if (wSum === 0) return null;
  return { lat: lat / wSum, lng: lng / wSum };
}

export function isGeocoded(value: unknown): value is Geocoded {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.lat === 'number' && typeof v.lng === 'number' && typeof v.confidence === 'string';
}

/** Formats a distance for display without implying false precision. */
export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Formats an estimated drive time. Always used with an "estimate" label. */
export function formatMinutes(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} h` : `${h} h ${rem} m`;
}
