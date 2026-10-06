'use client';

import { useMemo, useState } from 'react';
import type { Hotel, ImportImage, Place } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useLocale } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { useUiStore } from '@/lib/store/ui-store';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip, itemFromCustom } from '@/lib/trip';
import { useResearchStore } from '@/lib/research/store';
import { ImageStrip } from './ImageStrip';
import {
  matchesSavedFilter,
  SAVED_FILTERS,
  useSavedProvenance,
  type SavedEntry,
  type SavedFilter,
} from '@/lib/research/saved';
import { categoryKey } from '@/lib/research/labels';
import { EmptyState } from '../ui/primitives';
import { IconAlert, IconCheck, IconMapPin, IconPlus, IconTrash } from '../ui/icons';
import { PlaceCard } from '../destination/cards/PlaceCard';
import { HotelCard } from '../destination/cards/HotelCard';

/**
 * 我的收藏 — the places the traveller kept, and where the import flow lands.
 *
 * Everything here is a reference to something canonical, so a card here and the
 * marker on the map can never disagree. The one exception is a place the
 * traveller created, which is shown in its own visual register, labelled
 * 待核实, and never dressed up as a verified place.
 *
 * Provenance is split by corpus rather than summed (§24, §25). "你的攻略 · 2 篇"
 * and "社区攻略 · 5 次提及" are two different claims about two different bodies of
 * text, and adding them together would make one number that means nothing.
 */

const FILTER_LABELS: Record<SavedFilter, MessageKey> = {
  all: 'saved.filterAll',
  hotel: 'saved.filterHotel',
  food: 'saved.filterFood',
  sight: 'saved.filterAttraction',
  coffee: 'saved.filterCoffee',
  nightlife: 'saved.filterNightlife',
};

export function SavedPlacesList({
  destinationId,
  areaNameById,
  entries,
  danglingCount,
  onSelectPlace,
  onSelectHotel,
  onHover,
  selectedEntityId,
}: {
  destinationId: string;
  areaNameById: Map<string, string>;
  entries: SavedEntry[];
  danglingCount: number;
  onSelectPlace: (place: Place) => void;
  onSelectHotel: (hotel: Hotel) => void;
  onHover: (id: string | null) => void;
  selectedEntityId: string | null;
}) {
  const t = useT();
  const [filter, setFilter] = useState<SavedFilter>('all');

  const visible = useMemo(() => entries.filter((entry) => matchesSavedFilter(entry, filter)), [entries, filter]);
  const counts = useMemo(() => {
    const map = new Map<SavedFilter, number>();
    for (const id of SAVED_FILTERS) map.set(id, entries.filter((entry) => matchesSavedFilter(entry, id)).length);
    return map;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <SavedHeader count={0} />
        <div className="p-3">
          <EmptyState title={t('saved.empty')} body={t('saved.emptyHint')} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{t('saved.title')}</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">{t('saved.subtitle')}</p>

        <div className="mt-2.5 flex flex-wrap gap-1" data-testid="saved-filters">
          {SAVED_FILTERS.map((id) => {
            const active = filter === id;
            const count = counts.get(id) ?? 0;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                disabled={count === 0 && id !== 'all'}
                onClick={() => setFilter(id)}
                data-testid={`saved-filter-${id}`}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11.5px] font-medium transition-colors duration-150 disabled:opacity-40',
                  active
                    ? 'border-accent/25 bg-accent-soft text-accent'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong',
                )}
              >
                {t(FILTER_LABELS[id])}
                <span className="tabular-nums text-faint">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[11.5px] tabular-nums text-faint">{t('saved.count', { count: visible.length })}</p>
        {danglingCount > 0 && (
          <p className="mt-1 flex items-start gap-1 text-[11px] leading-relaxed text-faint">
            <IconAlert size={11} className="mt-[2px] shrink-0" />
            {t('saved.dangling', { count: danglingCount })}
          </p>
        )}
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-3 p-3" data-testid="saved-list">
        {visible.length === 0 ? (
          <EmptyState title={t('saved.emptyFilter')} body={t('saved.emptyFilterHint')} />
        ) : (
          visible.map((entry) =>
            entry.kind === 'place' ? (
              <div key={entry.id} className="relative">
                <Provenance entry={entry} />
                <PlaceCard
                  place={entry.place}
                  areaName={areaNameById.get(entry.place.areaId) ?? entry.place.areaId}
                  selected={selectedEntityId === entry.place.id}
                  inTrip={false}
                  destinationId={destinationId}
                  onSelect={() => onSelectPlace(entry.place)}
                  onHover={onHover}
                />
              </div>
            ) : entry.kind === 'hotel' ? (
              <div key={entry.id} className="relative">
                <Provenance entry={entry} />
                <HotelCard
                  hotel={entry.hotel}
                  areaName={areaNameById.get(entry.hotel.areaId) ?? entry.hotel.areaId}
                  selected={selectedEntityId === entry.hotel.id}
                  inTrip={false}
                  destinationId={destinationId}
                  onSelect={() => onSelectHotel(entry.hotel)}
                  onHover={onHover}
                />
              </div>
            ) : (
              <PendingCard key={entry.id} entry={entry} destinationId={destinationId} areaNameById={areaNameById} />
            ),
          )
        )}
      </div>
    </div>
  );
}

function SavedHeader({ count }: { count: number }) {
  const t = useT();
  return (
    <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
      <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{t('saved.title')}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{t('saved.subtitle')}</p>
      <p className="mt-2 text-[11.5px] tabular-nums text-faint">{t('saved.count', { count })}</p>
    </header>
  );
}

/**
 * "From a guide" plus the split corpus counts. Never a popularity claim.
 *
 * The two corpora are read and rendered separately rather than summed: "your
 * guides" is a fact about the traveller's own reading, "community guides" is a
 * fact about a moderated corpus, and a single total would be a number that
 * claims neither. Today the second is legitimately zero — the traveller's flow
 * only ever writes private imports — and showing the zero would be noise, so it
 * is rendered when it exists rather than hard-coded away.
 */
function Provenance({ entry }: { entry: Extract<SavedEntry, { kind: 'place' | 'hotel' }> }) {
  const t = useT();
  const provenance = useSavedProvenance();
  const mine = provenance.get(entry.id)?.mine ?? entry.saves.length;
  const community = provenance.get(entry.id)?.community ?? 0;

  /*
   * The traveller's own imported pictures, kept SEPARATE from the place's
   * canonical photography (§23).
   *
   * Placing them side by side under one heading would blur the only distinction
   * this feature has to keep clear: the photograph above is licensed and
   * attributed, the pictures below are a creator's work that this traveller
   * happens to have in their own guide. Two headings, two meanings.
   */
  const imageIds = useMemo(
    () => [...new Set(entry.saves.flatMap((save) => save.selectedImportImageIds ?? []))],
    [entry.saves],
  );
  const allImages = useResearchStore((state) => state.images);
  const images = useMemo(
    () => imageIds.map((id) => allImages.find((image) => image.id === id)).filter((image): image is ImportImage => Boolean(image)),
    [imageIds, allImages],
  );

  return (
    <div className="mb-1.5 px-0.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent-soft px-1.5 py-[1px] text-[10.5px] font-medium text-accent">
          <IconSparkleMark />
          {t('saved.fromImport')}
        </span>
        {mine > 0 && (
          <span className="text-[10.5px] text-faint" data-testid={`saved-signal-mine-${entry.id}`}>
            {t('saved.signalMineShort', { count: mine })}
          </span>
        )}
        {community > 0 && <span className="text-[10.5px] text-faint">{t('saved.signalCommunity', { count: community })}</span>}
      </div>

      {images.length > 0 && (
        <div className="mt-1.5" data-testid={`saved-images-${entry.id}`}>
          <p className="mb-1 text-[10.5px] text-faint">{t('saved.fromYourGuide')}</p>
          <ImageStrip images={images} size="sm" />
        </div>
      )}
    </div>
  );
}

function IconSparkleMark() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 0.5 7.2 4.3 11 5.5 7.2 6.7 6 10.5 4.8 6.7 1 5.5 4.8 4.3Z" fill="currentColor" />
    </svg>
  );
}

/**
 * A place the traveller created.
 *
 * Visually distinct on purpose. It has no photograph, no verified coordinates
 * claim and no canonical name — showing it with the same card as a dataset place
 * would launder an unverified submission into something that looks verified.
 */
function PendingCard({
  entry,
  destinationId,
  areaNameById,
}: {
  entry: Extract<SavedEntry, { kind: 'pending' }>;
  destinationId: string;
  areaNameById: Map<string, string>;
}) {
  const t = useT();
  const locale = useLocale();
  const unsavePlace = useResearchStore((s) => s.unsavePlace);
  const addItem = useTripStore((s) => s.addItem);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const selectedDayId = useUiStore((s) => s.selectedDayId);
  const selectDay = useUiStore((s) => s.selectDay);
  const setPanelTab = useUiStore((s) => s.setPanelTab);
  const submission = entry.submission;

  const trip = useTripStore((s) => {
    const active = s.trips.find((entryTrip) => entryTrip.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips
        .filter((entryTrip) => entryTrip.destinationId === destinationId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    );
  });

  const areaLabel = submission.areaId ? (areaNameById.get(submission.areaId) ?? submission.areaId) : null;
  const displayName = locale === 'zh-CN' && submission.nameZh ? submission.nameZh : submission.name;
  const inTrip = Boolean(isRefInTrip(trip, submission.id));

  return (
    <article
      className="rounded-card border border-dashed border-line-strong bg-surface-2 p-3"
      data-testid={`saved-pending-${submission.id}`}
    >
      <div className="flex items-start gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500/40 text-amber-700" aria-hidden="true">
          <IconMapPin size={11} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13.5px] font-semibold text-ink">{displayName}</span>
            <span className="rounded-full border border-amber-500/30 bg-amber-50 px-1.5 py-[1px] text-[10.5px] font-medium text-amber-800">
              {t('saved.pendingVerification')}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] text-muted">
            {t(categoryKey(submission.recommendationType))}
            {areaLabel ? ` · ${areaLabel}` : ''}
          </p>
          {!submission.coordinates && (
            <p className="mt-1 text-[11px] leading-relaxed text-amber-700">{t('saved.needsLocation')}</p>
          )}
          {submission.note && <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{submission.note}</p>}
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">{t('saved.pendingNote')}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn-secondary btn-xs"
              disabled={!submission.coordinates || inTrip}
              title={!submission.coordinates ? t('saved.needsLocation') : undefined}
              data-testid={`saved-add-to-trip-${submission.id}`}
              onClick={() => {
                if (!submission.coordinates || !trip) return;
                const dayId = trip.days.find((day) => day.id === selectedDayId)?.id ?? trip.days[0]?.id;
                if (!dayId) return;
                addItem(
                  trip.id,
                  dayId,
                  itemFromCustom({
                    name: submission.name,
                    lat: submission.coordinates.lat,
                    lng: submission.coordinates.lng,
                    kind: 'activity',
                    areaId: submission.areaId,
                    note: submission.note,
                  }),
                );
                setActiveTrip(trip.id);
                selectDay(dayId);
                setPanelTab('plan');
              }}
            >
              <IconPlus size={11} />
              {inTrip ? t('saved.inTrip') : t('saved.addToTrip')}
            </button>
            <button
              type="button"
              className="btn-ghost btn-xs text-muted"
              data-testid={`saved-remove-${submission.id}`}
              onClick={() => unsavePlace(submission.id)}
            >
              <IconTrash size={11} />
              {t('saved.remove')}
            </button>
          </div>
          {trip && inTrip && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-accent">
              <IconCheck size={11} />
              {t('saved.inTrip')}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
