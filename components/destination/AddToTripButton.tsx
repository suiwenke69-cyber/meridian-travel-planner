'use client';

import { useMemo } from 'react';
import type { Trip } from '@/lib/types';
import { findEntity } from '@/lib/data';
import { isRefInTrip, itemFromAirport, itemFromHotel, itemFromPlace } from '@/lib/trip';
import { useTripStore } from '@/lib/store/trip-store';
import { useUiStore } from '@/lib/store/ui-store';
import { cn } from '@/lib/utils';
import { Popover } from '../ui/Popover';
import { IconArrowRight, IconCheck, IconPlus } from '../ui/icons';

/**
 * Add-to-trip control.
 *
 * If there is no trip yet this cannot silently fail: it sends the user to the
 * PLAN tab and says why. If a trip exists it offers every day plus a one-click
 * "add to the selected day".
 *
 * It deliberately does NOT switch tabs on success — adding three stops while
 * browsing should not yank the user out of the list. The button flips to
 * "Added to Day N" and the map gains a numbered marker instead.
 */
export function AddToTripButton({
  destinationId,
  refId,
  size = 'md',
  className,
}: {
  destinationId: string;
  refId: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const trips = useTripStore((s) => s.trips);
  const activeTripId = useTripStore((s) => s.activeTripId);
  const addItem = useTripStore((s) => s.addItem);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const selectDay = useUiStore((s) => s.selectDay);
  const setPanelTab = useUiStore((s) => s.setPanelTab);
  const selectedDayId = useUiStore((s) => s.selectedDayId);

  const trip: Trip | null = useMemo(() => {
    const active = trips.find((t) => t.id === activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      trips.filter((t) => t.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  }, [trips, activeTripId, destinationId]);

  const inTrip = isRefInTrip(trip, refId);

  const addTo = (targetDayId: string) => {
    if (!trip) return;
    const item = buildItem(destinationId, refId);
    if (!item) return;
    addItem(trip.id, targetDayId, item);
    selectDay(targetDayId);
    setActiveTrip(trip.id);
  };

  if (inTrip) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent">
        <IconCheck size={13} />
        {dayLabel(trip, inTrip.dayId)}
      </span>
    );
  }

  if (!trip) {
    return (
      <button
        type="button"
        className={cn('btn-primary', size === 'sm' && 'btn-xs', className)}
        onClick={() => {
          setPanelTab('plan');
          selectDay(null);
        }}
        data-testid="add-to-trip-needs-trip"
      >
        <IconPlus size={size === 'sm' ? 13 : 15} />
        Start a trip to save this
      </button>
    );
  }

  const preferredDayId = selectedDayId ?? trip.days[0]?.id;

  return (
    <div className={cn('flex items-stretch', className)}>
      <button
        type="button"
        className={cn('btn-primary rounded-r-none', size === 'sm' && 'btn-xs')}
        onClick={() => preferredDayId && addTo(preferredDayId)}
        data-testid="add-to-trip"
      >
        <IconPlus size={size === 'sm' ? 13 : 15} />
        Add to {dayLabel(trip, preferredDayId)}
      </button>
      <Popover
        ariaLabel="Choose a day"
        align="end"
        side="top"
        trigger={({ toggle }) => (
          <button
            type="button"
            aria-label="Choose which day to add to"
            onClick={toggle}
            className={cn('btn-primary rounded-l-none border-l border-white/25 px-1.5', size === 'sm' && 'py-1')}
          >
            <IconArrowRight size={13} className="rotate-90" />
          </button>
        )}
      >
        {({ close }) => (
          <ul className="max-h-64 overflow-y-auto scroll-area">
            {trip.days.map((day) => (
              <li key={day.id}>
                <button
                  type="button"
                  data-testid={`move-to-day-${day.index + 1}`}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-xs hover:bg-black/[0.04]"
                  onClick={() => {
                    addTo(day.id);
                    close();
                  }}
                >
                  <span className="font-medium">Day {day.index + 1}</span>
                  <span className="text-2xs text-muted">{day.items.length} stops</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </div>
  );
}

function dayLabel(trip: Trip | null, dayId: string | undefined): string {
  if (!trip || !dayId) return 'trip';
  const day = trip.days.find((d) => d.id === dayId);
  return day ? `Day ${day.index + 1}` : 'trip';
}

function buildItem(destinationId: string, refId: string) {
  const entity = findEntity(destinationId, refId);
  if (!entity) return null;
  if (entity.kind === 'hotel') return itemFromHotel(entity.hotel);
  if (entity.kind === 'place') return itemFromPlace(entity.place);
  return itemFromAirport(entity.airport, 'arrival');
}

export { dayLabel };
