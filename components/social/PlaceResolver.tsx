'use client';

import { useMemo, useState } from 'react';
import type { RecommendationType, SocialPlaceMention } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useName } from '@/lib/i18n/use-t';
import { useImportUiStore } from '@/lib/store/import-ui';
import { IconCheck, IconClose, IconMapPin, IconSearch } from '../ui/icons';
import { categoryKey, type ResolvedEntity } from './ImportMentionCard';

/**
 * The unmatched-place resolver.
 *
 * Two answers, and no third one. Either the place IS something Meridian already
 * holds — in which case the traveller points at it and we remember that this
 * spelling means that place — or it genuinely is not, in which case it becomes a
 * submission, which is private, pending, and never written into the shared
 * dataset (§14, §15).
 *
 * There is deliberately no "Meridian's best guess, accept it" option. A wrong
 * automatic answer here is how `La Brisa`, `La Brisa Bali` and `La Brisa Canggu`
 * end up as three canonical beach clubs.
 */

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
];

export function PlaceResolver({
  mention,
  knownPlaces,
  areaOptions,
  onResolve,
  onCreate,
  onClose,
}: {
  mention: SocialPlaceMention;
  knownPlaces: ResolvedEntity[];
  areaOptions: Array<{ id: string; label: string }>;
  onResolve: (placeId: string) => void;
  onCreate: (input: {
    name: string;
    recommendationType: RecommendationType;
    areaId?: string;
    coordinates?: { lat: number; lng: number };
    note?: string;
  }) => void;
  onClose: () => void;
}) {
  const t = useT();
  const name = useName();
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [query, setQuery] = useState(mention.rawPlaceName);
  const [category, setCategory] = useState<RecommendationType>(mention.categoryHint ?? 'restaurant');
  const [areaId, setAreaId] = useState<string>(areaOptions[0]?.id ?? '');
  const [note, setNote] = useState('');

  const picking = useImportUiStore((s) => s.picking);
  const pickedLocation = useImportUiStore((s) => s.pickedLocation);
  const setPicking = useImportUiStore((s) => s.setPicking);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = knownPlaces.filter((place) => place.areaId);
    if (!needle) return pool.slice(0, 6);
    return pool
      .map((place) => {
        const names = [place.name, place.nameZh ?? ''].map((value) => value.toLowerCase());
        const score = names.some((value) => value === needle)
          ? 3
          : names.some((value) => value.startsWith(needle))
            ? 2
            : names.some((value) => value.includes(needle))
              ? 1
              : 0;
        return { place, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
      .slice(0, 8)
      .map((entry) => entry.place);
  }, [knownPlaces, query]);

  return (
    <div
      className="mt-2 rounded-lg border border-line bg-surface-2 p-2.5"
      data-testid={`import-resolver-${mention.id}`}
    >
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
              setPicking(false);
            }}
          >
            {t('import.match.search')}
          </button>
          <button
            type="button"
            className={cn(
              'rounded-[5px] px-2 py-[3px] text-[11px] font-medium transition-colors',
              mode === 'create' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink-soft',
            )}
            onClick={() => setMode('create')}
          >
            {t('import.match.create')}
          </button>
        </div>
        <button type="button" className="btn-ghost btn-xs ml-auto text-muted" onClick={onClose} aria-label={t('import.close')}>
          <IconClose size={12} />
        </button>
      </div>

      {mode === 'search' ? (
        <>
          <p className="mb-1.5 text-[11.5px] leading-relaxed text-muted">{t('import.search.hint')}</p>
          <div className="relative">
            <IconSearch size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
            <input
              className="field pl-7 text-[12px]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('import.search.placeholder')}
              data-testid={`import-resolver-query-${mention.id}`}
              autoFocus
            />
          </div>
          {results.length === 0 ? (
            <p className="mt-2 text-[11.5px] text-muted">{t('import.search.none')}</p>
          ) : (
            <ul className="mt-2 max-h-[190px] space-y-1 overflow-y-auto">
              {results.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
                    data-testid={`import-resolver-option-${place.id}`}
                    onClick={() => onResolve(place.id)}
                  >
                    <IconMapPin size={12} className="shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{name.primary(place)}</span>
                      {/* The canonical spelling is the point of this row: it is
                          what the traveller is agreeing that the guide meant. */}
                      <span className="block truncate text-[11px] text-faint">{place.name}</span>
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
          <p className="mb-1.5 text-[11.5px] leading-relaxed text-muted">{t('import.create.note2')}</p>

          <label className="label-caps mb-1 block" htmlFor={`create-name-${mention.id}`}>
            {t('import.create.name')}
          </label>
          <input
            id={`create-name-${mention.id}`}
            className="field text-[12px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid={`import-create-name-${mention.id}`}
          />

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <label className="label-caps mb-1 block" htmlFor={`create-cat-${mention.id}`}>
                {t('import.create.category')}
              </label>
              <select
                id={`create-cat-${mention.id}`}
                className="field text-[12px]"
                value={category}
                onChange={(e) => setCategory(e.target.value as RecommendationType)}
                data-testid={`import-create-category-${mention.id}`}
              >
                {CREATE_CATEGORIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {t(categoryKey(entry))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-caps mb-1 block" htmlFor={`create-area-${mention.id}`}>
                {t('import.create.area')}
              </label>
              <select
                id={`create-area-${mention.id}`}
                className="field text-[12px]"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                {areaOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2">
            <span className="label-caps mb-1 block">{t('import.create.location')}</span>
            <button
              type="button"
              className={cn('btn-secondary btn-xs w-full justify-center', picking && 'border-accent text-accent')}
              data-testid={`import-create-pick-${mention.id}`}
              onClick={() => setPicking(!picking)}
            >
              <IconMapPin size={12} />
              {pickedLocation
                ? `${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}`
                : t('import.create.locationHint')}
            </button>
            {picking && !pickedLocation && (
              <p className="mt-1 text-[11px] text-accent">{t('import.create.locationHint')}</p>
            )}
          </div>

          <label className="label-caps mb-1 mt-2 block" htmlFor={`create-note-${mention.id}`}>
            {t('import.create.note')}
          </label>
          <input
            id={`create-note-${mention.id}`}
            className="field text-[12px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button
            type="button"
            className="btn-primary btn-xs mt-2.5 w-full justify-center"
            disabled={!query.trim()}
            data-testid={`import-create-submit-${mention.id}`}
            onClick={() => {
              setPicking(false);
              onCreate({
                name: query.trim(),
                recommendationType: category,
                areaId: areaId || undefined,
                coordinates: pickedLocation ?? undefined,
                note: note.trim() || undefined,
              });
            }}
          >
            <IconCheck size={12} />
            {t('import.create.submit')}
          </button>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">{t('import.create.note2')}</p>
        </>
      )}
    </div>
  );
}
