'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DayAnchors, TransportLeg, TripDay } from '../types';
import { buildLegsForStops, routeStops, summariseLegs, type RouteStop } from './legs';

export interface DayLegsState {
  legs: TransportLeg[];
  loading: boolean;
  totals: ReturnType<typeof summariseLegs>;
}

/**
 * Resolves the transport legs for one day, INCLUDING its anchors.
 *
 * The anchors are the point of this hook now: a hotel-change day routes
 * `Hotel A → stops → Hotel B`, and the hotel-to-hotel drive is measured by the
 * same provider as any other leg rather than being asserted. On a normal day the
 * start and end anchors are the same hotel, which is what makes the day a closed
 * loop rather than a line beginning at the first attraction.
 *
 * Only the ACTIVE day is routed, which keeps a ten-day trip to a handful of
 * requests instead of hundreds. Routes are cached per point pair inside
 * `lib/routing`, so flipping between days does not re-request anything.
 */
export function useDayLegs(day: TripDay | null, anchors?: DayAnchors | null): DayLegsState {
  const stops = useMemo<RouteStop[]>(() => {
    if (!day) return [];
    // An anchor's `kind` is a DOMAIN kind (hotel/airport/origin), while a route
    // stop's is a marker layer. Converting explicitly keeps the router unaware
    // that anchors exist at all.
    const toStop = (anchor: DayAnchors['start']): RouteStop | null =>
      anchor
        ? {
            id: anchor.id,
            name: anchor.name,
            lat: anchor.lat,
            lng: anchor.lng,
            areaId: anchor.areaId,
            itemKind: anchor.itemKind,
          }
        : null;
    return routeStops({ start: toStop(anchors?.start ?? null), end: toStop(anchors?.end ?? null) }, day.items);
  }, [day, anchors?.start, anchors?.end]);

  /*
   * The signature covers position AND identity.
   *
   * Changing a day's start time must recompute the CLOCK, not the routes: the
   * signature below is over the geometry only, so a time edit leaves this effect
   * untouched and the already-measured legs are reused. That is the difference
   * between re-rendering a schedule and re-requesting a day's driving.
   */
  const signature = useMemo(
    () => stops.map((stop) => `${stop.id}:${stop.lat.toFixed(4)},${stop.lng.toFixed(4)}`).join('|'),
    [stops],
  );

  const [state, setState] = useState<DayLegsState>({
    legs: [],
    loading: false,
    totals: { distanceMeters: 0, durationSeconds: 0, unavailable: 0, measured: 0 },
  });

  useEffect(() => {
    if (stops.length < 2) {
      setState({ legs: [], loading: false, totals: { distanceMeters: 0, durationSeconds: 0, unavailable: 0, measured: 0 } });
      return;
    }
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));

    buildLegsForStops(stops)
      .then((legs) => {
        if (cancelled) return;
        setState({ legs, loading: false, totals: summariseLegs(legs) });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ legs: [], loading: false, totals: { distanceMeters: 0, durationSeconds: 0, unavailable: 0, measured: 0 } });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, stops]);

  return state;
}
