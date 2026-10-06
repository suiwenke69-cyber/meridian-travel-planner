'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TransportLeg, TripDay } from '../types';
import { buildLegsForDay, summariseLegs } from './legs';

export interface DayLegsState {
  legs: TransportLeg[];
  loading: boolean;
  totals: ReturnType<typeof summariseLegs>;
}

/**
 * Resolves the transport legs for one day.
 *
 * Only the ACTIVE day is routed, which keeps a ten-day trip to a handful of
 * requests instead of hundreds. Routes are cached per point pair inside
 * `lib/routing`, so flipping between days does not re-request anything.
 */
export function useDayLegs(day: TripDay | null): DayLegsState {
  const signature = useMemo(
    () => (day ? day.items.map((i) => `${i.id}:${i.lat.toFixed(4)},${i.lng.toFixed(4)}`).join('|') : ''),
    [day],
  );

  const [state, setState] = useState<DayLegsState>({
    legs: [],
    loading: false,
    totals: { distanceMeters: 0, durationSeconds: 0, unavailable: 0, measured: 0 },
  });

  useEffect(() => {
    if (!day || day.items.length < 2) {
      setState({ legs: [], loading: false, totals: { distanceMeters: 0, durationSeconds: 0, unavailable: 0, measured: 0 } });
      return;
    }
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));

    buildLegsForDay(day)
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
  }, [signature]);

  return state;
}
