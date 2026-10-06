'use client';

import { useMemo, useState } from 'react';
import type { RecommendationType, SocialPlaceMention } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT, useName } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { IconAlert, IconCheck, IconClose, IconMapPin, IconPlus, IconSearch, IconSparkle } from '../ui/icons';
import { PlaceResolver } from './PlaceResolver';

/**
 * One place, as a guide wrote it.
 *
 * The card is built around a single question — "is this the place I think it
 * is?" — so it leads with the name exactly as the guide spelled it, then says
 * what Meridian believes it is. Those two are never merged into one string:
 * `La Brisa` and `La Brisa Bali` are the same beach club, and silently showing
 * only the canonical name would hide the fact that we guessed.
 *
 * Everything below the fold is what the guide actually said, labelled as the
 * guide's words. It is never presented as a verified attribute of the place —
 * that distinction is the whole reason a traveller can trust the rest of the
 * dataset.
 */

export type MentionState = 'confirmed' | 'needs-confirm' | 'unmatched' | 'ignored';

/**
 * What the traveller should see, derived from the match band rather than from a
 * number.
 *
 * `matchBand` is the interface's vocabulary (`high` preselects, `medium` asks,
 * `low` never guesses — §13). The raw confidence stays in the store for the
 * admin route and is deliberately not rendered here.
 */
export function mentionState(mention: SocialPlaceMention): MentionState {
  if (mention.userDecision === 'ignore') return 'ignored';
  if (!mention.matchedPlaceId) return 'unmatched';
  if (mention.matchBand === 'high') return 'confirmed';
  return 'needs-confirm';
}

export function categoryKey(category: RecommendationType | undefined): MessageKey {
  return `research.type.${category ?? 'unknown'}` as MessageKey;
}

/**
 * The minimum a resolved candidate has to expose.
 *
 * Structural rather than `Place`, because a guide names hotels as often as it
 * names restaurants and both must resolve through the same card. Matching and
 * display agree that a name is a name.
 */
export interface ResolvedEntity {
  id: string;
  name: string;
  nameZh?: string;
  areaId: string;
}

export function ImportMentionCard({
  mention,
  place,
  areaName,
  selected,
  highlighted,
  knownPlaces,
  areaOptions,
  onToggle,
  onConfirm,
  onIgnore,
  onResolve,
  onCreate,
  onHover,
}: {
  mention: SocialPlaceMention;
  /** The canonical place or hotel this resolves to, when there is one. */
  place: ResolvedEntity | null;
  areaName: string | null;
  selected: boolean;
  highlighted: boolean;
  knownPlaces: ResolvedEntity[];
  areaOptions: Array<{ id: string; label: string }>;
  onToggle: () => void;
  onConfirm: () => void;
  onIgnore: () => void;
  onResolve: (placeId: string) => void;
  onCreate: (input: {
    name: string;
    recommendationType: RecommendationType;
    areaId?: string;
    coordinates?: { lat: number; lng: number };
    note?: string;
  }) => void;
  onHover: (id: string | null) => void;
}) {
  const t = useT();
  const name = useName();
  const [resolverOpen, setResolverOpen] = useState(false);

  const state = mentionState(mention);
  const matchedName = place ? name.primary(place) : null;

  /*
   * Highlight the matched name inside the guide's sentence.
   *
   * Only when it appears literally: a fuzzy match means the guide wrote
   * something else, and underlining a word that is not there would be a lie
   * about what we read.
   */
  const rawText = mention.rawText ?? '';
  const highlight = useMemo(() => {
    const needle = mention.rawPlaceName;
    if (!rawText || !needle) return null;
    const index = rawText.toLowerCase().indexOf(needle.toLowerCase());
    if (index < 0) return null;
    return {
      before: rawText.slice(0, index),
      match: rawText.slice(index, index + needle.length),
      after: rawText.slice(index + needle.length),
    };
  }, [rawText, mention.rawPlaceName]);

  const badge = {
    confirmed: {
      label: t('import.match.matched'),
      className: 'border-emerald-500/25 bg-emerald-50 text-emerald-700',
    },
    'needs-confirm': {
      label: t('import.match.possible'),
      className: 'border-amber-500/30 bg-amber-50 text-amber-700',
    },
    unmatched: {
      label: t('import.match.unmatched'),
      className: 'border-line bg-surface-2 text-muted',
    },
    ignored: { label: t('import.match.rejected'), className: 'border-line bg-surface-2 text-faint' },
  }[state];

  return (
    <li
      data-testid={`import-mention-${mention.id}`}
      data-state={state}
      onMouseEnter={() => onHover(mention.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(mention.id)}
      onBlur={() => onHover(null)}
      className={cn(
        'rounded-xl border bg-surface p-3 transition-colors duration-150',
        selected ? 'border-accent/40 ring-1 ring-accent/20' : 'border-line',
        highlighted && 'border-accent/60 bg-accent-soft/40',
        state === 'ignored' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        <label className="mt-[3px] flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={selected}
            disabled={state === 'ignored'}
            onChange={onToggle}
            data-testid={`import-mention-toggle-${mention.id}`}
            aria-label={mention.rawPlaceName}
          />
          <span
            aria-hidden="true"
            className={cn(
              'flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors duration-150',
              selected ? 'border-accent bg-accent text-white' : 'border-line-strong bg-surface text-transparent',
              state === 'ignored' && 'border-line bg-surface-2',
            )}
          >
            <IconCheck size={12} />
          </span>
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {/* The name exactly as the guide wrote it — never translated. */}
            <span className="text-[14px] font-semibold leading-snug text-ink">{mention.rawPlaceName}</span>
            <span className="rounded-full border border-line bg-surface-2 px-1.5 py-[1px] text-[10.5px] text-muted">
              {t(categoryKey(mention.categoryHint))}
            </span>
            <span className={cn('rounded-full border px-1.5 py-[1px] text-[10.5px] font-medium', badge.className)}>
              {badge.label}
            </span>
          </div>

          {/* What Meridian thinks it is */}
          {matchedName && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px]">
              <span className="inline-flex items-center gap-1 text-faint">
                <IconMapPin size={11} />
                {t('import.match.confirm')}:
              </span>
              <span className="font-medium text-ink-soft">{matchedName}</span>
              {areaName && <span className="text-[11.5px] text-faint">· {areaName}</span>}
              {state === 'needs-confirm' && (
                <button
                  type="button"
                  className="btn-secondary btn-xs ml-1"
                  data-testid={`import-mention-confirm-${mention.id}`}
                  onClick={onConfirm}
                >
                  <IconCheck size={11} />
                  {t('import.match.confirm')}
                </button>
              )}
            </div>
          )}

          {/* Why we believed it was a place */}
          {mention.extractedReason && (
            <p className="mt-1.5 flex items-start gap-1 text-[11.5px] leading-relaxed text-faint">
              <IconSparkle size={11} className="mt-[2px] shrink-0" />
              {mention.extractedReason}
            </p>
          )}

          {/* The guide's own sentence, with the name marked */}
          {rawText && (
            <p className="mt-2 border-l-2 border-line pl-2.5 text-[12px] leading-relaxed text-ink-soft">
              {highlight ? (
                <>
                  {highlight.before}
                  <mark className="rounded-[3px] bg-accent-soft px-0.5 font-medium text-accent">{highlight.match}</mark>
                  {highlight.after}
                </>
              ) : (
                rawText
              )}
            </p>
          )}

          {/* What the guide named specifically */}
          {mention.extractedItems.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-faint">{t('import.items')}:</span>
              {mention.extractedItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line bg-surface-2 px-1.5 py-[1px] text-[11px] text-ink-soft"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {(mention.contextThemes.length > 0 || mention.positiveThemes.length > 0) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-faint">{t('import.themes')}:</span>
              {[...mention.positiveThemes, ...mention.contextThemes].slice(0, 6).map((theme) => (
                <span key={theme} className="rounded-full bg-accent-soft px-1.5 py-[1px] text-[11px] text-accent">
                  {theme}
                </span>
              ))}
            </div>
          )}

          {mention.bestTimeMentioned && (
            <p className="mt-1.5 text-[11.5px] text-ink-soft">
              <span className="text-faint">{t('import.bestTime')}:</span> {mention.bestTimeMentioned}
            </p>
          )}

          {mention.warnings.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {mention.warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1 text-[11.5px] leading-relaxed text-amber-700">
                  <IconAlert size={11} className="mt-[3px] shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">{t('import.sourceNote')}</p>

          {/* Unmatched: the traveller decides, we do not guess */}
          {state === 'unmatched' && !resolverOpen && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                className="btn-secondary btn-xs"
                data-testid={`import-mention-search-${mention.id}`}
                onClick={() => setResolverOpen(true)}
              >
                <IconSearch size={11} />
                {t('import.match.search')}
              </button>
              <button
                type="button"
                className="btn-secondary btn-xs"
                data-testid={`import-mention-create-${mention.id}`}
                onClick={() => setResolverOpen(true)}
              >
                <IconPlus size={11} />
                {t('import.match.create')}
              </button>
              <button type="button" className="btn-ghost btn-xs text-muted" onClick={onIgnore}>
                <IconClose size={11} />
                {t('import.match.ignore')}
              </button>
            </div>
          )}

          {resolverOpen && (
            <PlaceResolver
              mention={mention}
              knownPlaces={knownPlaces}
              areaOptions={areaOptions}
              onResolve={(placeId) => {
                onResolve(placeId);
                setResolverOpen(false);
              }}
              onCreate={(input) => {
                onCreate(input);
                setResolverOpen(false);
              }}
              onClose={() => setResolverOpen(false)}
            />
          )}

          {state === 'confirmed' && (
            <button type="button" className="btn-ghost btn-xs mt-2 text-muted" onClick={onIgnore}>
              {t('import.match.ignore')}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
