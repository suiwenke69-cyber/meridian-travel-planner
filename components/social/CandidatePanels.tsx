'use client';

import { useMemo, useState } from 'react';
import type { ImportImage, PlaceCandidate, RecommendationType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useName } from '@/lib/i18n/use-t';
import { getAreas, getHotels, getPlaces } from '@/lib/data';
import { useImportUiStore } from '@/lib/store/import-ui';
import { imagesForCandidate, useResearchStore } from '@/lib/research/store';
import { categoryKey } from '@/lib/research/labels';
import { ImageStrip } from './ImageStrip';
import { IconCheck, IconClose, IconMapPin, IconSearch } from '../ui/icons';

/**
 * The three things a traveller can do to a candidate besides tick it.
 *
 * All three are INLINE expansions rather than modals, and that is a product
 * decision rather than a space-saving one: the map must stay visible, because
 * every one of these actions is about geography. A modal would cover the thing
 * the traveller is trying to look at.
 */

// ---------------------------------------------------------------------------
// §16 — manual image assignment (the core requirement)
// ---------------------------------------------------------------------------

/**
 * Attaching pictures to a place by hand.
 *
 * §16 calls this a CORE requirement and it is worth being explicit about why:
 * image analysis will never be right every time, and a traveller who cannot fix
 * a wrong attribution has no way to trust any of it. This panel is the correction
 * mechanism, and it works with no model at all — which is also what keeps the
 * feature usable on a deployment with no vision provider.
 *
 * One image can end up on one place. Choosing it here MOVES it rather than
 * copying it, because "this photo also belongs to that other place" is almost
 * never what somebody means, and a photo attached to two cards makes the
 * unassigned count lie.
 */
export function ImageAssignPanel({
  candidate,
  allImages,
  onClose,
}: {
  candidate: PlaceCandidate;
  allImages: ImportImage[];
  onClose: () => void;
}) {
  const t = useT();
  const assignImage = useResearchStore((s) => s.assignImage);
  const unassignImage = useResearchStore((s) => s.unassignImage);
  const assignments = useResearchStore((s) => s.assignments);

  const attached = useMemo(
    () => new Set(imagesForCandidate(candidate.id, allImages, assignments).map((entry) => entry.image.id)),
    [candidate.id, allImages, assignments],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set(attached));

  const toggle = (imageId: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  };

  const apply = () => {
    for (const image of allImages) {
      const wasAttached = attached.has(image.id);
      const nowSelected = selected.has(image.id);
      if (nowSelected && !wasAttached) assignImage(candidate.id, image.id, 'user');
      if (!nowSelected && wasAttached) unassignImage(candidate.id, image.id);
    }
    onClose();
  };

  return (
    <div className="mt-2 rounded-lg border border-line bg-surface-2 p-2.5" data-testid={`import-assign-${candidate.id}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="min-w-0 flex-1 text-[12px] font-medium text-ink">
          {t('import.assign.title', { name: candidate.rawName })}
        </span>
        <button type="button" className="btn-ghost btn-xs text-muted" onClick={onClose} aria-label={t('import.close')}>
          <IconClose size={12} />
        </button>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-muted">{t('import.assign.hint')}</p>

      {allImages.length === 0 ? (
        <p className="text-[11.5px] text-muted">{t('import.assign.noImages')}</p>
      ) : (
        <ImageStrip
          images={allImages}
          selectable
          selectedIds={selected}
          attachedIds={attached}
          onToggle={toggle}
        />
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          className="btn-primary btn-xs"
          data-testid={`import-assign-apply-${candidate.id}`}
          onClick={apply}
        >
          <IconCheck size={11} />
          {t('import.assign.apply', { count: selected.size })}
        </button>
        <button
          type="button"
          className="btn-ghost btn-xs text-muted"
          onClick={() => setSelected(new Set())}
        >
          {t('import.selectNone')}
        </button>
        <span className="ml-auto text-[10.5px] tabular-nums text-faint">
          {t('import.assign.selected', { count: selected.size })}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// §10 steps 4–5 — correcting a resolution
// ---------------------------------------------------------------------------

const CREATE_CATEGORIES: RecommendationType[] = [
  'restaurant',
  'cafe',
  'beachclub',
  'bar',
  'beach',
  'nature',
  'culture',
  'activity',
  'hotel',
  'shopping',
  'wellness',
  'transport',
];

/**
 * Search Meridian, or pin the place by hand.
 *
 * Deliberately two options and not three. There is no "let Meridian guess"
 * button: a wrong automatic answer is how `La Brisa`, `La Brisa Bali` and
 * `La Brisa Canggu` become three canonical beach clubs, and the traveller is
 * the only one who can say which of those the post meant (§14).
 */
export function ResolvePanel({
  candidate,
  destinationId,
  onClose,
}: {
  candidate: PlaceCandidate;
  destinationId: string;
  onClose: () => void;
}) {
  const t = useT();
  const name = useName();
  const locale = useName();
  void locale;
  const [mode, setMode] = useState<'search' | 'pin'>('search');
  const [query, setQuery] = useState(candidate.rawName);
  const [category, setCategory] = useState<RecommendationType>(candidate.entityType ?? 'restaurant');
  const [areaId, setAreaId] = useState<string>('');

  const resolveCandidateToPlace = useResearchStore((s) => s.resolveCandidateToPlace);
  const pinCandidate = useResearchStore((s) => s.pinCandidate);
  const picking = useImportUiStore((s) => s.picking);
  const pickedLocation = useImportUiStore((s) => s.pickedLocation);
  const startPicking = useImportUiStore((s) => s.startPicking);
  const cancelPicking = useImportUiStore((s) => s.cancelPicking);

  const areas = useMemo(() => getAreas(destinationId), [destinationId]);

  /**
   * Meridian's own places and hotels, searched by both names.
   *
   * Hotels are included because a guide names where you slept as often as where
   * you ate, and the previous resolver could not see them at all.
   */
  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool: Array<{ id: string; name: string; nameZh?: string; areaId: string; kind: 'place' | 'hotel' }> = [
      ...getPlaces(destinationId).map((place) => ({
        id: place.id,
        name: place.name,
        nameZh: place.nameZh,
        areaId: place.areaId,
        kind: 'place' as const,
      })),
      ...getHotels(destinationId).map((hotel) => ({
        id: hotel.id,
        name: hotel.name,
        nameZh: hotel.nameZh,
        areaId: hotel.areaId,
        kind: 'hotel' as const,
      })),
    ];
    if (!needle) return pool.slice(0, 8);
    return pool
      .map((entry) => {
        const names = [entry.name, entry.nameZh ?? ''].map((value) => value.toLowerCase());
        const score = names.some((value) => value === needle)
          ? 3
          : names.some((value) => value.startsWith(needle))
            ? 2
            : names.some((value) => value.includes(needle))
              ? 1
              : 0;
        return { entry, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
      .slice(0, 8)
      .map((row) => row.entry);
  }, [destinationId, query]);

  return (
    <div className="mt-2 rounded-lg border border-line bg-surface-2 p-2.5" data-testid={`import-resolve-${candidate.id}`}>
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex rounded-md border border-line bg-surface p-[2px]">
          <button
            type="button"
            className={cn(
              'rounded-[5px] px-2 py-[3px] text-[11px] font-medium transition-colors',
              mode === 'search' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink-soft',
            )}
            onClick={() => {
              setMode('search');
              cancelPicking();
            }}
          >
            {t('import.match.search')}
          </button>
          <button
            type="button"
            className={cn(
              'rounded-[5px] px-2 py-[3px] text-[11px] font-medium transition-colors',
              mode === 'pin' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink-soft',
            )}
            onClick={() => setMode('pin')}
          >
            {t('import.pinOnMap')}
          </button>
        </div>
        <button type="button" className="btn-ghost btn-xs ml-auto text-muted" onClick={onClose} aria-label={t('import.close')}>
          <IconClose size={12} />
        </button>
      </div>

      {mode === 'search' ? (
        <>
          <p className="mb-1.5 text-[11px] leading-relaxed text-muted">{t('import.search.hint')}</p>
          <div className="relative">
            <IconSearch size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
            <input
              className="field pl-7 text-[12px]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('import.search.placeholder')}
              data-testid={`import-resolve-query-${candidate.id}`}
              autoFocus
            />
          </div>
          {options.length === 0 ? (
            <p className="mt-2 text-[11.5px] text-muted">{t('import.search.none')}</p>
          ) : (
            <ul className="mt-2 max-h-[190px] space-y-1 overflow-y-auto">
              {options.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
                    data-testid={`import-resolve-option-${entry.id}`}
                    onClick={() => {
                      resolveCandidateToPlace(candidate.id, entry.id);
                      onClose();
                    }}
                  >
                    <IconMapPin size={12} className="shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{name.primary(entry)}</span>
                      <span className="block truncate text-[11px] text-faint">
                        {entry.name}
                        {entry.kind === 'hotel' ? ` · ${t('import.kind.hotel')}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-accent">{t('import.search.confirm')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="mb-1.5 text-[11px] leading-relaxed text-muted">{t('import.pin.hint')}</p>

          <label className="label-caps mb-1 block" htmlFor={`pin-name-${candidate.id}`}>
            {t('import.create.name')}
          </label>
          <input
            id={`pin-name-${candidate.id}`}
            className="field text-[12px]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            data-testid={`import-pin-name-${candidate.id}`}
          />

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label className="label-caps mb-1 block" htmlFor={`pin-cat-${candidate.id}`}>
                {t('import.create.category')}
              </label>
              <select
                id={`pin-cat-${candidate.id}`}
                className="field text-[12px]"
                value={category}
                onChange={(event) => setCategory(event.target.value as RecommendationType)}
              >
                {CREATE_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {t(categoryKey(entry))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-caps mb-1 block" htmlFor={`pin-area-${candidate.id}`}>
                {t('import.create.area')}
              </label>
              <select
                id={`pin-area-${candidate.id}`}
                className="field text-[12px]"
                value={areaId}
                onChange={(event) => setAreaId(event.target.value)}
              >
                <option value="">{t('import.create.areaNone')}</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nameZh ?? area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            className={cn(
              'btn-secondary btn-xs mt-2 w-full justify-center',
              picking?.kind === 'candidate' && picking.candidateId === candidate.id && 'border-accent text-accent',
            )}
            data-testid={`import-pin-pick-${candidate.id}`}
            onClick={() => startPicking({ kind: 'candidate', candidateId: candidate.id })}
          >
            <IconMapPin size={12} />
            {pickedLocation ? `${pickedLocation.lat.toFixed(5)}, ${pickedLocation.lng.toFixed(5)}` : t('import.create.locationHint')}
          </button>

          <button
            type="button"
            className="btn-primary btn-xs mt-2.5 w-full justify-center"
            disabled={!query.trim()}
            data-testid={`import-pin-save-${candidate.id}`}
            onClick={() => {
              const location = useImportUiStore.getState().pickedLocation;
              pinCandidate(candidate.id, {
                coordinates: location ?? { lat: 0, lng: 0 },
                name: query.trim(),
                entityType: category,
                areaId: areaId || undefined,
              });
              cancelPicking();
              onClose();
            }}
          >
            <IconCheck size={12} />
            {t('import.create.submit')}
          </button>

          {/*
            §19, and §35's "never let AI invent coordinates", stated where the
            traveller is about to provide the coordinate themselves.
          */}
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">{t('import.pin.caveat')}</p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// §18 — "what is this picture?"
// ---------------------------------------------------------------------------

/**
 * Asking about an image nothing could attribute.
 *
 * §18's flow, in the traveller's words: 这张图是什么地方？ The three answers are
 * search Meridian, attach to a place already found in this post, or create a new
 * place from the picture. Creating asks for a coordinate — pointed at on the map,
 * never inferred from the image (§18, §35).
 */
export function ImageQuestionPanel({
  image,
  destinationId,
  candidates,
  onClose,
}: {
  image: ImportImage;
  destinationId: string;
  candidates: PlaceCandidate[];
  onClose: () => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecommendationType>('restaurant');
  const [areaId, setAreaId] = useState('');

  const assignImage = useResearchStore((s) => s.assignImage);
  const createPlaceFromImage = useResearchStore((s) => s.createPlaceFromImage);
  const picking = useImportUiStore((s) => s.picking);
  const pickedLocation = useImportUiStore((s) => s.pickedLocation);
  const startPicking = useImportUiStore((s) => s.startPicking);
  const cancelPicking = useImportUiStore((s) => s.cancelPicking);
  const assignable = candidates.filter((candidate) => candidate.userDecision !== 'ignore');
  const areas = useMemo(() => getAreas(destinationId), [destinationId]);

  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft/40 p-2.5" data-testid={`import-question-${image.id}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="min-w-0 flex-1 text-[12px] font-medium text-ink">
          {t('import.question.title', { n: image.originalIndex })}
        </span>
        <button type="button" className="btn-ghost btn-xs text-muted" onClick={onClose} aria-label={t('import.close')}>
          <IconClose size={12} />
        </button>
      </div>

      <div className="flex gap-2.5">
        <ImageStrip images={[image]} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          {mode === 'choose' ? (
            <>
              <p className="text-[11px] leading-relaxed text-muted">{t('import.question.hint')}</p>
              {assignable.length > 0 && (
                <>
                  <p className="label-caps mb-1 mt-2">{t('import.question.attachTo')}</p>
                  <ul className="space-y-1">
                    {assignable.slice(0, 8).map((candidate) => (
                      <li key={candidate.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-left text-[12px] transition-colors hover:border-accent/40"
                          data-testid={`import-question-attach-${candidate.id}`}
                          onClick={() => {
                            assignImage(candidate.id, image.id, 'user');
                            onClose();
                          }}
                        >
                          <IconMapPin size={11} className="shrink-0 text-faint" />
                          <span className="min-w-0 flex-1 truncate">{candidate.rawName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  data-testid={`import-question-create-${image.id}`}
                  onClick={() => setMode('create')}
                >
                  {t('import.match.create')}
                </button>
                <button type="button" className="btn-ghost btn-xs text-muted" onClick={onClose}>
                  {t('import.question.later')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] leading-relaxed text-muted">{t('import.create.note2')}</p>
              <input
                className="field mt-1.5 text-[12px]"
                placeholder={t('import.create.name')}
                value={name}
                onChange={(event) => setName(event.target.value)}
                data-testid={`import-question-name-${image.id}`}
              />
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <select
                  className="field text-[12px]"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as RecommendationType)}
                >
                  {CREATE_CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {t(categoryKey(entry))}
                    </option>
                  ))}
                </select>
                <select className="field text-[12px]" value={areaId} onChange={(event) => setAreaId(event.target.value)}>
                  <option value="">{t('import.create.areaNone')}</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nameZh ?? area.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={cn(
                  'btn-secondary btn-xs mt-1.5 w-full justify-center',
                  picking?.kind === 'image' && picking.imageId === image.id && 'border-accent text-accent',
                )}
                data-testid={`import-question-pick-${image.id}`}
                onClick={() => startPicking({ kind: 'image', imageId: image.id })}
              >
                <IconMapPin size={12} />
                {pickedLocation ? `${pickedLocation.lat.toFixed(5)}, ${pickedLocation.lng.toFixed(5)}` : t('import.create.locationHint')}
              </button>
              <button
                type="button"
                className="btn-primary btn-xs mt-1.5 w-full justify-center"
                disabled={!name.trim()}
                data-testid={`import-question-save-${image.id}`}
                onClick={() => {
                  createPlaceFromImage(image.id, {
                    name: name.trim(),
                    recommendationType: category,
                    areaId: areaId || undefined,
                    coordinates: useImportUiStore.getState().pickedLocation ?? undefined,
                  });
                  cancelPicking();
                  onClose();
                }}
              >
                <IconCheck size={12} />
                {t('import.create.submit')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
