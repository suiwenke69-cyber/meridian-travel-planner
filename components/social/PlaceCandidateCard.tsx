'use client';

import { useMemo, useState } from 'react';
import type { Hotel, ImportImage, Place, PlaceCandidate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import { useUiStore } from '@/lib/store/ui-store';
import { useImportUiStore } from '@/lib/store/import-ui';
import { useTripStore } from '@/lib/store/trip-store';
import { isRefInTrip, itemFromCustom, itemFromHotel, itemFromPlace } from '@/lib/trip';
import { resolutionLabelKey } from '@/lib/research/place-resolver';
import { categoryKey } from '@/lib/research/labels';
import { imagesForCandidate, useResearchStore } from '@/lib/research/store';
import { ImageStrip } from './ImageStrip';
import { IconAlert, IconCheck, IconClose, IconMapPin, IconPlus, IconSearch } from '../ui/icons';

/**
 * One place, as the guide presented it.
 *
 * The card is built around a single question — "is this the place I think it
 * is?" — so it leads with the name EXACTLY as the post wrote it, then says what
 * Meridian believes it is, then shows WHY it believes anything at all.
 *
 * That last part is the point (§9). "识别来源：正文 + 图片 3、4" is what lets a
 * traveller judge a card without trusting it: a name read off a shopfront and a
 * name in a caption are different kinds of evidence, and a card that hid the
 * difference would be asking for blind faith.
 *
 * What the card refuses to do is equally deliberate: no confidence number, no
 * rating, no price, and no coordinate a model invented. Everything below the
 * name is either the guide's own words or a fact about Meridian's own data.
 */

export interface CandidateResolution {
  /** The canonical Meridian entity this resolved to, when it did. */
  place: Place | null;
  hotel: Hotel | null;
}

export function PlaceCandidateCard({
  candidate,
  resolution,
  assignments,
  allImages,
  destinationId,
  areaNameById,
  selected,
  highlighted,
  onToggle,
  onOpenAssign,
  onOpenResolve,
  onOpenQuestion,
  onHover,
}: {
  candidate: PlaceCandidate;
  resolution: CandidateResolution;
  /** Images attached to this candidate, with who attached them. */
  assignments: ReturnType<typeof imagesForCandidate>;
  /** Every image in the import, for the picker and for frame numbering. */
  allImages: ImportImage[];
  destinationId: string;
  areaNameById: Map<string, string>;
  selected: boolean;
  highlighted: boolean;
  onToggle: () => void;
  onOpenAssign: () => void;
  onOpenResolve: () => void;
  onOpenQuestion: (imageId: string) => void;
  onHover: (id: string | null) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const name = useName();
  const [showDetail, setShowDetail] = useState(false);

  const startPicking = useImportUiStore((s) => s.startPicking);

  const trip = useTripStore((s) => {
    const active = s.trips.find((entry) => entry.id === s.activeTripId);
    if (active && active.destinationId === destinationId) return active;
    return (
      s.trips.filter((entry) => entry.destinationId === destinationId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null
    );
  });
  const addItem = useTripStore((s) => s.addItem);
  const setActiveTrip = useTripStore((s) => s.setActiveTrip);
  const selectedDayId = useUiStore((s) => s.selectedDayId);
  const selectDay = useUiStore((s) => s.selectDay);

  const attachedImages = assignments.map((entry) => entry.image);
  const attachedIds = useMemo(() => new Set(attachedImages.map((image) => image.id)), [attachedImages]);

  const displayName = resolution.place
    ? name.primary(resolution.place)
    : resolution.hotel
      ? name.primary(resolution.hotel)
      : candidate.rawName;
  const secondaryName = resolution.place
    ? name.secondary(resolution.place)
    : resolution.hotel
      ? name.secondary(resolution.hotel)
      : null;
  const areaId = resolution.place?.areaId ?? resolution.hotel?.areaId ?? candidate.areaHint;
  const areaLabel = areaId ? (areaNameById.get(areaId) ?? areaId) : null;

  const located = Boolean(resolution.place || resolution.hotel || candidate.submittedPlaceId);
  const resolvable = Boolean(resolution.place || resolution.hotel);
  const tripRef = resolution.place?.id ?? resolution.hotel?.id ?? candidate.submittedPlaceId;
  const inTrip = Boolean(tripRef && trip && isRefInTrip(trip, tripRef));

  /**
   * §9's provenance line, built from what actually happened rather than from a
   * label: text, images, or both, with the frame numbers the traveller sees.
   */
  const provenance = useMemo(() => {
    const parts: string[] = [];
    if (candidate.detectedFromText) parts.push(t('import.source.text'));
    const frameNumbers = candidate.detectedFromImageIds
      .map((id) => allImages.find((image) => image.id === id)?.originalIndex)
      .filter((index): index is number => typeof index === 'number');
    if (frameNumbers.length > 0) {
      parts.push(t('import.source.images', { list: frameNumbers.join('、') }));
    }
    if (parts.length === 0) parts.push(t('import.source.user'));
    return parts.join(' + ');
  }, [candidate.detectedFromText, candidate.detectedFromImageIds, allImages, t]);

  const addToTrip = () => {
    if (!trip || !tripRef) return;
    const dayId = trip.days.find((day) => day.id === selectedDayId)?.id ?? trip.days[0]?.id;
    if (!dayId) return;
    const item = resolution.place
      ? itemFromPlace(resolution.place)
      : resolution.hotel
        ? itemFromHotel(resolution.hotel)
        : null;
    if (item) {
      addItem(trip.id, dayId, item);
    } else {
      const submission = useResearchStore.getState().submissions.find((s) => s.id === candidate.submittedPlaceId);
      if (!submission?.coordinates) return;
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
    }
    setActiveTrip(trip.id);
    selectDay(dayId);
  };

  const statusTone = located
    ? 'border-emerald-500/25 bg-emerald-50 text-emerald-700'
    : candidate.resolutionStatus === 'external' || candidate.resolutionStatus === 'external_multiple'
      ? 'border-amber-500/30 bg-amber-50 text-amber-800'
      : 'border-line bg-surface-2 text-muted';

  return (
    <li
      data-testid={`import-candidate-${candidate.id}`}
      data-resolution={candidate.resolutionStatus}
      onMouseEnter={() => onHover(candidate.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(candidate.id)}
      onBlur={() => onHover(null)}
      className={cn(
        'rounded-xl border bg-surface p-3 transition-colors duration-150',
        selected ? 'border-accent/40 ring-1 ring-accent/20' : 'border-line',
        highlighted && 'border-accent/60 bg-accent-soft/40',
      )}
    >
      {/* --- identity ------------------------------------------------------ */}
      <div className="flex items-start gap-2.5">
        <label className="mt-[3px] flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={selected}
            onChange={onToggle}
            data-testid={`import-candidate-toggle-${candidate.id}`}
            aria-label={candidate.rawName}
          />
          <span
            aria-hidden="true"
            className={cn(
              'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-150',
              selected ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface text-transparent',
            )}
          >
            <IconCheck size={12} />
          </span>
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* The name exactly as the post wrote it — never translated. */}
            <span className="text-[14px] font-semibold leading-snug text-ink" data-testid={`import-candidate-name-${candidate.id}`}>
              {candidate.rawName}
            </span>
            <span className="rounded-full border border-line bg-surface-2 px-1.5 py-[1px] text-[10.5px] text-muted">
              {t(categoryKey(candidate.entityType))}
            </span>
          </div>

          {(displayName !== candidate.rawName || secondaryName) && (
            <p className="mt-1 text-[12.5px] text-ink-soft">
              {displayName !== candidate.rawName && <span className="font-medium">{displayName}</span>}
              {secondaryName && <span className="ml-1.5 text-faint">{secondaryName}</span>}
            </p>
          )}

          {/* --- where it is, and how sure that is ------------------------- */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[10.5px] font-medium', statusTone)}
              data-testid={`import-candidate-status-${candidate.id}`}
            >
              {located ? <IconCheck size={10} /> : <IconMapPin size={10} />}
              {t(resolutionLabelKey(candidate.resolutionStatus))}
            </span>
            {areaLabel && <span className="text-[11px] text-faint">· {areaLabel}</span>}
          </div>

          {/* --- §9 provenance -------------------------------------------- */}
          <p className="mt-1.5 text-[11px] text-faint" data-testid={`import-candidate-source-${candidate.id}`}>
            {t('import.detectedFrom')}：{provenance}
          </p>

          {/* --- images (§7, §16, §23) ------------------------------------ */}
          <div className="mt-2">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-faint">
                {attachedImages.length > 0 ? t('import.imagesForPlace') : t('import.noImagesForPlace')}
              </span>
              {allImages.length > 0 && (
                <button
                  type="button"
                  className="btn-ghost btn-xs text-accent"
                  data-testid={`import-candidate-addimage-${candidate.id}`}
                  onClick={onOpenAssign}
                >
                  {t('import.addImages')}
                </button>
              )}
            </div>
            {attachedImages.length > 0 && (
              <ImageStrip
                images={attachedImages}
                attachedIds={attachedIds}
                size="sm"
                onOpen={onOpenQuestion}
              />
            )}
          </div>

          {/* --- the guide's own words ------------------------------------ */}
          {candidate.contextText && (
            <p className="mt-2 border-l-2 border-line pl-2.5 text-[12px] leading-relaxed text-ink-soft">
              {candidate.contextText}
            </p>
          )}

          {(candidate.positiveThemes.length > 0 || candidate.contextThemes.length > 0 || candidate.extractedItems.length > 0) && (
            <div className="mt-2 space-y-1">
              {candidate.extractedItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-faint">{t('import.items')}:</span>
                  {candidate.extractedItems.slice(0, 6).map((item) => (
                    <span key={item} className="rounded-full border border-line bg-surface-2 px-1.5 py-[1px] text-[11px] text-ink-soft">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {(candidate.positiveThemes.length > 0 || candidate.contextThemes.length > 0) && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-faint">{t('import.themes')}:</span>
                  {[...candidate.positiveThemes, ...candidate.contextThemes].slice(0, 6).map((theme) => (
                    <span key={theme} className="rounded-full bg-accent-soft px-1.5 py-[1px] text-[11px] text-accent">
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {candidate.bestTimeMentioned && (
            <p className="mt-1.5 text-[11.5px] text-ink-soft">
              <span className="text-faint">{t('import.bestTime')}:</span> {candidate.bestTimeMentioned}
            </p>
          )}

          {candidate.warnings.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {candidate.warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1 text-[11.5px] leading-relaxed text-amber-700">
                  <IconAlert size={11} className="mt-[3px] shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">{t('import.sourceNote')}</p>

          {/* --- an external hit is offered, never assumed (§10) ---------- */}
          {candidate.externalCandidates && candidate.externalCandidates.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-500/25 bg-amber-50/60 p-2">
              <p className="text-[11px] font-medium text-amber-900">{t('import.external.title')}</p>
              <ul className="mt-1 space-y-1">
                {candidate.externalCandidates.slice(0, 3).map((entry) => (
                  <li key={entry.providerPlaceId} className="flex items-start gap-1.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] text-ink">{entry.name}</span>
                      {entry.address && <span className="block truncate text-[10.5px] text-faint">{entry.address}</span>}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary btn-xs shrink-0"
                      data-testid={`import-candidate-accept-external-${candidate.id}-${entry.providerPlaceId}`}
                      onClick={() => {
                        useResearchStore.getState().acceptExternalCandidate(candidate.id, entry.providerPlaceId);
                        onToggle();
                      }}
                    >
                      {t('import.external.accept')}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-amber-800">{t('import.external.caveat')}</p>
            </div>
          )}

          {/* --- actions (§15) ------------------------------------------- */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              className={cn('btn-xs', selected ? 'btn-primary' : 'btn-secondary')}
              data-testid={`import-candidate-save-${candidate.id}`}
              onClick={onToggle}
              disabled={!located && candidate.resolutionStatus === 'unresolved'}
            >
              {selected ? <IconCheck size={11} /> : <IconPlus size={11} />}
              {selected ? t('import.saved') : t('import.savePlace')}
            </button>

            <button
              type="button"
              className="btn-secondary btn-xs"
              data-testid={`import-candidate-trip-${candidate.id}`}
              disabled={!resolvable && !candidate.submittedPlaceId}
              title={!trip ? t('addToTrip.startTrip') : undefined}
              onClick={addToTrip}
            >
              {inTrip ? <IconCheck size={11} /> : <IconPlus size={11} />}
              {inTrip ? t('saved.inTrip') : t('saved.addToTrip')}
            </button>

            <button
              type="button"
              className="btn-secondary btn-xs"
              data-testid={`import-candidate-resolve-${candidate.id}`}
              onClick={onOpenResolve}
            >
              <IconSearch size={11} />
              {t('import.changePlace')}
            </button>

            {!located && (
              <>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  data-testid={`import-candidate-pin-${candidate.id}`}
                  onClick={() => startPicking({ kind: 'candidate', candidateId: candidate.id })}
                >
                  <IconMapPin size={11} />
                  {t('import.pinOnMap')}
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-xs text-muted"
                  data-testid={`import-candidate-ignore-${candidate.id}`}
                  onClick={() => useResearchStore.getState().decideCandidate(candidate.id, 'ignore')}
                >
                  <IconClose size={11} />
                  {t('import.match.ignore')}
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-ghost btn-xs text-muted"
              onClick={() => setShowDetail((value) => !value)}
              aria-expanded={showDetail}
            >
              {showDetail ? t('import.hideDetail') : t('import.showDetail')}
            </button>
          </div>

          {showDetail && (
            <dl className="mt-2 space-y-1 rounded-lg border border-line bg-surface-2 p-2 text-[11px]">
              <DetailRow label={t('import.detail.rawName')} value={candidate.rawName} />
              <DetailRow label={t('import.detail.normalized')} value={candidate.normalizedName} />
              <DetailRow label={t('import.detail.type')} value={candidate.entityType ?? 'unknown'} />
              <DetailRow label={t('import.detail.resolution')} value={candidate.resolutionStatus} />
              <DetailRow label={t('import.detail.method')} value={candidate.matchMethod ?? '—'} />
              <DetailRow label={t('import.detail.matchId')} value={candidate.matchedPlaceId ?? candidate.submittedPlaceId ?? '—'} />
              <DetailRow
                label={t('import.detail.images')}
                value={candidate.detectedFromImageIds.length > 0 ? candidate.detectedFromImageIds.length.toString() : '0'}
              />
              <DetailRow label={t('import.detail.locale')} value={locale} />
            </dl>
          )}
        </div>
      </div>
    </li>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd className="min-w-0 flex-1 break-all text-ink-soft">{value}</dd>
    </div>
  );
}
