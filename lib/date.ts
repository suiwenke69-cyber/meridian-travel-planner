/**
 * Date helpers for trip planning. Deliberately dependency-free.
 * All trip dates are handled as `yyyy-mm-dd` strings in the destination's local
 * calendar sense — never as UTC instants — to avoid off-by-one-day bugs.
 */

export type IsoDate = string;

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isValidIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = fromIsoDate(value);
  return !Number.isNaN(d.getTime()) && toIsoDate(d) === value;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = fromIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

/** Inclusive night/day count between two dates. Same day => 1. */
export function inclusiveDayCount(arrival: IsoDate, departure: IsoDate): number {
  const a = fromIsoDate(arrival).getTime();
  const b = fromIsoDate(departure).getTime();
  const diff = Math.round((b - a) / 86_400_000);
  return Math.max(1, diff + 1);
}

/** Number of nights = nights between arrival and departure (>= 0). */
export function nightCount(arrival: IsoDate, departure: IsoDate): number {
  const a = fromIsoDate(arrival).getTime();
  const b = fromIsoDate(departure).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function formatDateShort(iso: IsoDate): string {
  const d = fromIsoDate(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateLong(iso: IsoDate): string {
  const d = fromIsoDate(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatWeekday(iso: IsoDate): string {
  return fromIsoDate(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}

/** `<input type="date">` friendly default arrival: 30 days from today. */
export function defaultArrival(): IsoDate {
  return addDays(toIsoDate(new Date()), 30);
}

export function defaultDeparture(arrival: IsoDate, nights = 4): IsoDate {
  return addDays(arrival, nights);
}

/** Formats a `4D3N` style label used across the product. */
export function formatDaysNights(days: number, nights?: number): string {
  const n = nights ?? Math.max(0, days - 1);
  return `${days}D${n}N`;
}

/**
 * A human-readable "how long should I stay" label.
 *
 * Deliberately NOT the `4D3N` shorthand: travellers read "4–6 days", and the
 * shorthand reads like a database enum. The upper bound is kept close to the
 * ideal so a wide `max` (Bali goes to 10 days) does not imply an open-ended trip.
 */
export function formatStayRange(recommended: { min: number; ideal: number; max: number }): string {
  if (recommended.max - recommended.min <= 1) {
    return `${recommended.ideal} ${recommended.ideal === 1 ? 'day' : 'days'}`;
  }
  const upper = Math.min(recommended.max, Math.max(recommended.ideal + 1, recommended.min + 2));
  return `${recommended.min}–${upper} days`;
}
