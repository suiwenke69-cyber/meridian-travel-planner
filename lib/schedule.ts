import type { DayAnchor, DayAnchors, ItineraryItem, TransportLeg, Trip, TripDay } from './types';

/**
 * The day's clock.
 *
 * WHY THIS IS PURE AND SEPARATE
 * -----------------------------
 * Three rules meet here and each one is easy to get subtly wrong:
 *
 *   1. **The start time is a setting, not a constant.** It used to be the literal
 *      `9 * 60` inside the timeline, so "we leave at 08:30" was unrepresentable.
 *   2. **A fixed time is a booking, not a preference.** When the schedule reaches
 *      a fixed-time item early, the traveller has usable waiting time; when it
 *      reaches it late, that is a conflict to report. The time is never moved,
 *      because it is the one thing the traveller cannot change.
 *   3. **Travel time between the anchors counts.** A hotel-change day ends 35
 *      minutes later than a same-hotel day would, and the schedule has to say so.
 *
 * Keeping it out of the component is what makes all three testable without a
 * browser, which matters because every one of them is arithmetic.
 */

/** `HH:MM` → minutes past midnight. Tolerates `9:5` and rejects nonsense to null. */
export function parseClock(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minutes past midnight → `HH:MM`, wrapping past midnight rather than going negative. */
export function formatClock(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60) % 24;
  const mins = rounded % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export const DEFAULT_START_TIME = '09:00';

/** The time a day begins: its own override, else the trip default, else 09:00. */
export function dayStartMinutes(trip: Trip, day: TripDay): number {
  return (
    parseClock(day.startTime) ??
    parseClock(trip.defaultStartTime) ??
    parseClock(DEFAULT_START_TIME)!
  );
}

export interface ScheduleWait {
  itemId: string;
  minutes: number;
}

export interface ScheduleConflict {
  itemId: string;
  fixedTime: string;
  lateMinutes: number;
}

export type ScheduleEntry =
  | { kind: 'anchor'; id: string; role: 'start' | 'end'; anchor: DayAnchor; clock: number; clockLabel: string }
  | { kind: 'leg'; id: string; leg: TransportLeg | null; clock: number; clockLabel: string; toId: string }
  | {
      kind: 'item';
      id: string;
      item: ItineraryItem;
      clock: number;
      clockLabel: string;
      /** Arrival time before any fixed-time adjustment. */
      arrivalClock: number;
      waitMinutes: number;
      lateMinutes: number;
    };

export interface DaySchedule {
  entries: ScheduleEntry[];
  startMinutes: number;
  waits: ScheduleWait[];
  conflicts: ScheduleConflict[];
  /** Minutes past midnight when the day's last stop is reached. */
  endMinutes: number;
}

/**
 * Builds one day's clock.
 *
 * `legs` are keyed by the pair they connect, so the caller can pass the legs for
 * the anchor-inclusive stop list and this function does not have to know how they
 * were fetched.
 */
export function buildDaySchedule(input: {
  trip: Trip;
  day: TripDay;
  anchors: DayAnchors;
  legs: TransportLeg[];
}): DaySchedule {
  const { trip, day, anchors, legs } = input;
  const legByPair = new Map(legs.map((leg) => [`${leg.fromItemId}->${leg.toItemId}`, leg]));
  const legMinutes = (fromId: string, toId: string): number => {
    const leg = legByPair.get(`${fromId}->${toId}`);
    return leg?.durationSeconds != null ? Math.round(leg.durationSeconds / 60) : 0;
  };

  const startMinutes = dayStartMinutes(trip, day);
  const entries: ScheduleEntry[] = [];
  const waits: ScheduleWait[] = [];
  const conflicts: ScheduleConflict[] = [];

  let clock = startMinutes;
  let previousId: string | null = null;

  if (anchors.start) {
    entries.push({
      kind: 'anchor',
      id: anchors.start.id,
      role: 'start',
      anchor: anchors.start,
      clock,
      clockLabel: formatClock(clock),
    });
    previousId = anchors.start.id;
  }

  for (const item of day.items) {
    const travel = previousId ? legMinutes(previousId, item.id) : 0;
    // Reached at `arrival`; a fixed time then decides whether that is early or late.
    const arrival = clock + travel;
    const fixed = parseClock(item.fixedTime);

    let waitMinutes = 0;
    let lateMinutes = 0;
    let start = arrival;

    if (fixed != null) {
      if (arrival <= fixed) {
        waitMinutes = fixed - arrival;
        start = fixed;
        if (waitMinutes > 0) waits.push({ itemId: item.id, minutes: waitMinutes });
      } else {
        lateMinutes = arrival - fixed;
        conflicts.push({ itemId: item.id, fixedTime: item.fixedTime!, lateMinutes });
      }
    }

    // A leg is only meaningful between two points. With no start anchor the
    // first item is where the day begins, not something the traveller travels to.
    if (previousId) {
      entries.push({
        kind: 'leg',
        id: `leg-entry:${item.id}`,
        leg: legByPair.get(`${previousId}->${item.id}`) ?? null,
        clock: arrival,
        clockLabel: formatClock(arrival),
        toId: item.id,
      });
    }

    entries.push({
      kind: 'item',
      id: item.id,
      item,
      clock: start,
      clockLabel: formatClock(start),
      arrivalClock: arrival,
      waitMinutes,
      lateMinutes,
    });

    clock = start + (item.durationMin ?? 0);
    previousId = item.id;
  }

  if (anchors.end) {
    const travel = previousId ? legMinutes(previousId, anchors.end.id) : 0;
    clock += travel;
    entries.push({
      kind: 'leg',
      id: `leg-entry:${anchors.end.id}`,
      leg: previousId ? (legByPair.get(`${previousId}->${anchors.end.id}`) ?? null) : null,
      clock,
      clockLabel: formatClock(clock),
      toId: anchors.end.id,
    });
    entries.push({
      kind: 'anchor',
      id: anchors.end.id,
      role: 'end',
      anchor: anchors.end,
      clock,
      clockLabel: formatClock(clock),
    });
  }

  return { entries, startMinutes, waits, conflicts, endMinutes: clock };
}

/** Every fixed-time conflict across the trip's days, for a trip-level summary. */
export function collectConflicts(schedules: Array<{ dayId: string; schedule: DaySchedule }>): Array<{
  dayId: string;
  itemId: string;
  fixedTime: string;
  lateMinutes: number;
}> {
  return schedules.flatMap(({ dayId, schedule }) =>
    schedule.conflicts.map((conflict) => ({ dayId, ...conflict })),
  );
}
