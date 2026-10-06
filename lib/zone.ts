import type { Coordinates } from './types';
import { haversineKm } from './geo';

/**
 * WHAT WE DO INSTEAD
 * ------------------
 * The zone is derived from where the area's own content actually is: the convex
 * hull of its mapped hotels and places, offset outward to represent the parts of
 * the area we have not mapped, then smoothed so it reads as a hand-drawn travel
 * extent rather than a surveyed one.
 *
 * A hull rather than a radius envelope, because a radial envelope around a
 * centroid degenerates into a circle the moment the content is sparse — which is
 * exactly the "crude radius circle" we were trying to get away from. A hull
 * keeps the shape of the content: Canggu stays an elongated coastal strip,
 * Uluwatu stays a cliff line, and only a genuinely point-like area comes out
 * looking round.
 *
 * It is drawn as a tinted wash with a fine dashed edge, and the UI says in
 * words that it is an approximate extent rather than an official boundary.
 */

export interface ZoneOptions {
  /** Angular resolution of the envelope. */
  bins?: number;
  /** Angular window used when sampling hull vertices for a bin, in degrees. */
  window?: number;
  /** Extra padding beyond the content, in km. */
  paddingKm?: number;
  /** Floor radius so a zone with sparse content still reads as a region. */
  minRadiusKm?: number;
  /** Ceiling so one stray day trip does not swallow the island. */
  maxRadiusKm?: number;
  /** Smoothing passes over the radius array. */
  smoothPasses?: number;
}

const DEFAULTS: Required<ZoneOptions> = {
  bins: 72,
  window: 10,
  paddingKm: 1.1,
  minRadiusKm: 2.4,
  maxRadiusKm: 9,
  smoothPasses: 2,
};

const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LNG_AT_EQUATOR = 111.32;

interface Local {
  x: number;
  y: number;
}

function kmPerDegLng(lat: number): number {
  return KM_PER_DEG_LNG_AT_EQUATOR * Math.cos((lat * Math.PI) / 180);
}

function toLocal(origin: Coordinates, point: Coordinates): Local {
  return {
    x: (point.lng - origin.lng) * kmPerDegLng(origin.lat),
    y: (point.lat - origin.lat) * KM_PER_DEG_LAT,
  };
}

function fromLocal(origin: Coordinates, point: Local): Coordinates {
  return {
    lat: origin.lat + point.y / KM_PER_DEG_LAT,
    lng: origin.lng + point.x / kmPerDegLng(origin.lat),
  };
}

/** Monotone chain convex hull. Returns counter-clockwise vertices, no repeats. */
function convexHull(points: Local[]): Local[] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Local, a: Local, b: Local) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const build = (input: Local[]) => {
    const chain: Local[] = [];
    for (const point of input) {
      while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0) chain.pop();
      chain.push(point);
    }
    chain.pop();
    return chain;
  };

  const hull = [...build(sorted), ...build([...sorted].reverse())];
  return hull.length >= 3 ? hull : points;
}

function smallestAngleDelta(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Builds a closed ring around `center` that follows the area's mapped content.
 * Returns `[lat, lng]` pairs, ready for a GeoJSON polygon.
 */
export function contentZone(
  center: Coordinates,
  points: Coordinates[],
  options: ZoneOptions = {},
): [number, number][] {
  const opts = { ...DEFAULTS, ...options };
  const nearby = points.filter((p) => haversineKm(center, p) <= opts.maxRadiusKm * 1.6);
  const local = nearby.map((p) => toLocal(center, p));

  /*
   * An area with no mapped content at all still needs a shape. It is drawn as a
   * plain circle, which is the honest thing to draw when the only thing we know
   * is roughly where the area is.
   */
  if (local.length === 0) {
    const ring: [number, number][] = [];
    for (let i = 0; i < opts.bins; i += 1) {
      const angle = (i / opts.bins) * 360;
      const point = fromLocal(center, {
        x: opts.minRadiusKm * Math.sin((angle * Math.PI) / 180),
        y: opts.minRadiusKm * Math.cos((angle * Math.PI) / 180),
      });
      ring.push([point.lat, point.lng]);
    }
    ring.push(ring[0]);
    return ring;
  }

  const hull = convexHull(local);
  const originLocal = hull.reduce(
    (acc, p) => ({ x: acc.x + p.x / hull.length, y: acc.y + p.y / hull.length }),
    { x: 0, y: 0 },
  );

  /*
   * Sample the hull's outline by angle around its own centroid. The hull is
   * convex and the centroid is inside it, so this reproduces the hull closely
   * while giving us an evenly spaced, smoothable ring.
   */
  const radii = new Array<number>(opts.bins).fill(0);
  for (const point of hull) {
    const dx = point.x - originLocal.x;
    const dy = point.y - originLocal.y;
    const radius = Math.hypot(dx, dy);
    const angle = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    for (let i = 0; i < opts.bins; i += 1) {
      if (smallestAngleDelta(angle, (i / opts.bins) * 360) > opts.window) continue;
      radii[i] = Math.max(radii[i], radius);
    }
  }

  // A bin no hull vertex landed in borrows from its nearest measured neighbour.
  const filled = radii.map((r, i) => {
    if (r > 0) return r;
    for (let offset = 1; offset < opts.bins; offset += 1) {
      const before = radii[(i - offset + opts.bins * 2) % opts.bins];
      const after = radii[(i + offset) % opts.bins];
      const candidate = Math.max(before, after);
      if (candidate > 0) return candidate;
    }
    return 0;
  });

  // Circular moving average — turns the hull into an organic, un-surveyed outline.
  let smoothed = filled;
  for (let pass = 0; pass < opts.smoothPasses; pass += 1) {
    smoothed = smoothed.map((_, i) => {
      const prev = smoothed[(i - 1 + opts.bins) % opts.bins];
      const next = smoothed[(i + 1) % opts.bins];
      return (prev + smoothed[i] * 2 + next) / 4;
    });
  }

  let padded = smoothed.map((r) => r + opts.paddingKm);
  const maxR = Math.max(...padded);
  if (maxR <= 0.01) {
    padded = padded.map(() => opts.minRadiusKm);
  } else if (maxR < opts.minRadiusKm) {
    // Too small to read as a region: grow it, keeping the shape it had.
    const scale = opts.minRadiusKm / maxR;
    padded = padded.map((r) => r * scale);
  } else if (maxR > opts.maxRadiusKm) {
    const scale = opts.maxRadiusKm / maxR;
    padded = padded.map((r) => r * scale);
  }

  /*
   * A hull of two or three nearly-collinear points is a sliver. Give it a
   * minimum thickness so it reads as a strip rather than a line, without
   * inflating it into a circle.
   */
  const reach = Math.max(...padded);
  const minThickness = Math.min(opts.minRadiusKm, reach * 0.55) * 0.75;
  padded = padded.map((r) => Math.max(r, minThickness));

  const ring: [number, number][] = [];
  for (let i = 0; i < opts.bins; i += 1) {
    const angle = (i / opts.bins) * 360;
    const point = fromLocal(center, {
      x: originLocal.x + padded[i] * Math.sin((angle * Math.PI) / 180),
      y: originLocal.y + padded[i] * Math.cos((angle * Math.PI) / 180),
    });
    ring.push([point.lat, point.lng]);
  }
  ring.push(ring[0]);
  return ring;
}

/** Approximate area of a lat/lng ring in km², used to label zones honestly. */
export function ringAreaKm2(ring: [number, number][]): number {
  if (ring.length < 4) return 0;
  const toXY = (p: [number, number]) => ({
    x: p[1] * 111.32 * Math.cos((p[0] * Math.PI) / 180),
    y: p[0] * 110.57,
  });
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = toXY(ring[i]);
    const b = toXY(ring[i + 1]);
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}
