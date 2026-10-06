'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RecommendationType, SocialImport, SocialPlaceMention } from '@/lib/types';
import { getAreas, getDestinationBundle, getHotels, getPlaces } from '@/lib/data';
import { useResearchStore, bandFor } from '@/lib/research/store';
import { useImportUiStore } from '@/lib/store/import-ui';
import { useUiStore } from '@/lib/store/ui-store';
import { useT, useName, useLocale } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { detectPlatform, platformMeta } from '@/lib/research/platforms';
import { SAMPLE_GUIDE_TEXT } from '@/lib/research/extract';
import { cn } from '@/lib/utils';
import { IconAlert, IconArrowLeft, IconCheck, IconClose, IconPlus, IconSparkle } from '../ui/icons';
import { ImportMentionCard, mentionState, type ResolvedEntity } from './ImportMentionCard';

/**
 * 导入攻略 — the whole traveller-facing import flow, in the destination's own
 * side panel.
 *
 * It is a panel and not a modal on purpose. The product promise is "paste a
 * guide and its places appear on MY MAP", and a dialog covering the map would
 * break exactly the moment the promise is supposed to land. Here the map stays
 * on screen, the candidates are drawn on it as you review them, and the camera
 * moves to them when the review opens.
 *
 * The flow has four states and no fake progress bar:
 *
 *   input      → paste a link, text, or both
 *   processing → "reading" then "finding places", advanced only by real work
 *   review     → tick what you want; the map shows what you ticked
 *   done       → what was kept, and the two things you can do next
 */

const STEPS: Array<{ id: 'read' | 'identify' | 'match' | 'review'; label: MessageKey }> = [
  { id: 'read', label: 'import.step.read' },
  { id: 'identify', label: 'import.step.identify' },
  { id: 'match', label: 'import.step.match' },
  { id: 'review', label: 'import.step.review' },
];

export function ImportGuidePanel({ destinationId }: { destinationId: string }) {
  const t = useT();
  const locale = useLocale();
  const name = useName();

  const step = useImportUiStore((s) => s.step);
  const importId = useImportUiStore((s) => s.importId);
  const setStep = useImportUiStore((s) => s.setStep);
  const closeImport = useImportUiStore((s) => s.closeImport);
  const setPreviewImport = useImportUiStore((s) => s.setPreviewImport);
  const setPlaceScope = useImportUiStore((s) => s.setPlaceScope);
  const setHoveredMention = useImportUiStore((s) => s.setHoveredMention);
  const flagJustSaved = useImportUiStore((s) => s.flagJustSaved);

  const imports = useResearchStore((s) => s.imports);
  const mentionsAll = useResearchStore((s) => s.mentions);
  const startImport = useResearchStore((s) => s.startImport);
  const processImport = useResearchStore((s) => s.processImport);
  const decideMention = useResearchStore((s) => s.decideMention);
  const resolveMentionToPlace = useResearchStore((s) => s.resolveMentionToPlace);
  const updateMention = useResearchStore((s) => s.updateMention);
  const submitPlace = useResearchStore((s) => s.submitPlace);
  const saveSelected = useResearchStore((s) => s.saveSelected);

  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'url' | 'text'>('url');
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const startedRef = useRef(false);

  const record: SocialImport | null = useMemo(
    () => imports.find((entry) => entry.id === importId) ?? null,
    [imports, importId],
  );
  const mentions = useMemo(
    () => mentionsAll.filter((entry) => entry.importId === importId),
    [mentionsAll, importId],
  );

  const destinationName = useMemo(
    () => getDestinationBundle(destinationId)?.destination.name ?? destinationId,
    [destinationId],
  );
  /*
   * Hotels resolve through the same card as places.
   *
   * A guide names where you slept as readily as where you ate, and the matcher
   * holds both, so leaving hotels out of the display map would produce a
   * confirmed match with no name next to it.
   */
  const knownPlaces = useMemo<ResolvedEntity[]>(() => {
    const places: ResolvedEntity[] = getPlaces(destinationId).map((place) => ({
      id: place.id,
      name: place.name,
      nameZh: place.nameZh,
      areaId: place.areaId,
    }));
    const hotels: ResolvedEntity[] = getHotels(destinationId).map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      nameZh: hotel.nameZh,
      areaId: hotel.areaId,
    }));
    return [...places, ...hotels];
  }, [destinationId]);
  const placeById = useMemo(() => new Map(knownPlaces.map((place) => [place.id, place])), [knownPlaces]);
  const areas = useMemo(() => getAreas(destinationId), [destinationId]);
  const areaOptions = useMemo(
    () => areas.map((area) => ({ id: area.id, label: locale === 'zh-CN' && area.nameZh ? area.nameZh : area.name })),
    [areas, locale],
  );
  const areaLabel = useMemo(
    () => new Map(areas.map((area) => [area.id, locale === 'zh-CN' && area.nameZh ? area.nameZh : area.name])),
    [areas, locale],
  );

  const detected = useMemo(() => detectPlatform(url), [url]);

  const selectedIds = useMemo(
    () => mentions.filter((entry) => entry.userDecision === 'save' && entry.matchedPlaceId).map((entry) => entry.id),
    [mentions],
  );
  const matchedCount = mentions.filter((entry) => entry.matchedPlaceId).length;

  /*
   * The map should follow the review, not the other way round.
   *
   * The camera is moved to the matched candidates once, when the review opens —
   * not on every render, or panning away to look at something would snap back.
   */
  const fitOnceRef = useRef<string | null>(null);
  useEffect(() => {
    if (step !== 'review' || !importId) return;
    if (fitOnceRef.current === importId) return;
    const points = mentions
      .map((entry) => (entry.matchedPlaceId ? markerPoint(entry.matchedPlaceId, destinationId) : null))
      .filter((point): point is { lat: number; lng: number } => Boolean(point));
    if (points.length === 0) return;
    fitOnceRef.current = importId;
    useUiStore.getState().requestFit(points, 12.2);
  }, [step, importId, mentions, placeById]);

  const runImport = async () => {
    setError(null);
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    if (!trimmedUrl && !trimmedText) {
      setError('empty');
      return;
    }

    const started = startImport({
      url: trimmedUrl || undefined,
      text: trimmedText || undefined,
      platform: detected ?? undefined,
      destinationId,
      userNotes: notes.trim() || undefined,
    });

    if (started.violation) {
      setError(started.violation.messageKey);
      return;
    }
    if (!started.import) {
      setError('generic');
      return;
    }

    const id = started.import.id;
    setStep('processing', id);
    setStage(0);

    // Stage one is real: the text has been read into the record.
    await new Promise((resolve) => setTimeout(resolve, 220));
    setStage(1);

    const result = await processImport(id);

    if ('error' in result) {
      setError(result.error);
      setStage(0);
      setStep('input', id);
      return;
    }

    // High-confidence matches are ticked for the traveller; §13's band decides,
    // not a number the interface would have to explain.
    const created = useResearchStore.getState().mentions.filter((entry) => entry.importId === id);
    for (const mention of created) {
      if (mention.matchedPlaceId && bandFor(mention.matchConfidence) === 'high') {
        decideMention(mention.id, 'save');
      }
    }

    setStage(3);
    setPreviewImport(id);
    setStep('review', id);
  };

  const handleSave = () => {
    if (!importId) return;
    const { saved } = saveSelected(importId);
    setSavedCount(saved);
    flagJustSaved(selectedIds.map((id) => mentions.find((m) => m.id === id)?.matchedPlaceId ?? '').filter(Boolean));
    setStep('done', importId);
  };

  const handleCreate = (
    mention: SocialPlaceMention,
    input: {
      name: string;
      recommendationType: RecommendationType;
      areaId?: string;
      coordinates?: { lat: number; lng: number };
      note?: string;
    },
  ) => {
    if (!record) return;
    const submission = submitPlace({
      destinationId,
      name: input.name,
      recommendationType: input.recommendationType,
      areaId: input.areaId,
      coordinates: input.coordinates,
      note: input.note,
      sourceImportId: record.id,
      sourceUrl: record.sourceUrl,
    });
    updateMention(mention.id, {
      submittedPlaceId: submission.id,
      verificationStatus: 'possible_match',
      matchMethod: 'manual',
      matchBand: 'medium',
      userDecision: 'save',
    });
  };

  // -------------------------------------------------------------------------
  // input
  // -------------------------------------------------------------------------
  if (step === 'input') {
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="import-panel" data-step="input">
        <PanelHeader title={t('import.title')} subtitle={t('import.subtitle')} onClose={closeImport} />

        <div className="scroll-area min-h-0 flex-1 space-y-3 p-3.5">
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50 p-2.5 text-[12px] leading-relaxed text-amber-900"
              role="alert"
              data-testid="import-error"
            >
              <IconAlert size={13} className="mt-[2px] shrink-0" />
              <span>{errorText(error, t)}</span>
            </div>
          )}

          {/* Link first: it is what people have in hand when they arrive. */}
          <div className="flex rounded-lg border border-line bg-surface-2 p-[3px]" role="tablist">
            {(
              [
                { id: 'url' as const, label: t('import.tabUrl') },
                { id: 'text' as const, label: t('import.tabText') },
              ]
            ).map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
                data-testid={`import-tab-${entry.id}`}
                className={cn(
                  'flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-semibold transition-colors duration-150',
                  tab === entry.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-soft',
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {tab === 'url' ? (
            <div>
              <label className="label-caps mb-1 block" htmlFor="import-url">
                {t('import.urlLabel')}
              </label>
              <input
                id="import-url"
                data-testid="import-url"
                className="field"
                inputMode="url"
                autoComplete="off"
                placeholder={t('import.urlPlaceholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {detected && (
                <p className="mt-1.5 text-[11.5px] text-faint">
                  {platformMeta(detected).label} · {t('import.sourceAccess.metadataOnly')}
                </p>
              )}
              {/*
                §5, in the traveller's own words. This is not a disclaimer buried
                in a policy page: it is shown exactly where they would otherwise
                expect us to fetch the link.
              */}
              <p className="mt-2 rounded-lg border border-line bg-surface-2 p-2.5 text-[11.5px] leading-relaxed text-ink-soft">
                {t('import.platformNote')}
              </p>
            </div>
          ) : null}

          <div className={cn(tab === 'text' ? '' : 'pt-1')}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label className="label-caps" htmlFor="import-text">
                {t('import.textLabel')}
              </label>
              <button
                type="button"
                className="btn-ghost btn-xs text-muted"
                data-testid="import-sample"
                onClick={() => setText(SAMPLE_GUIDE_TEXT)}
              >
                {t('research.sampleText')}
              </button>
            </div>
            <textarea
              id="import-text"
              data-testid="import-text"
              className="field min-h-[132px] resize-y font-normal leading-relaxed"
              placeholder={t('import.textPlaceholder')}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{t('import.willNotFetch')}</p>
          </div>

          <div>
            <label className="label-caps mb-1 block" htmlFor="import-notes">
              {t('import.notesLabel')}
            </label>
            <input
              id="import-notes"
              data-testid="import-notes"
              className="field"
              placeholder={t('import.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            className="btn-primary w-full justify-center"
            data-testid="import-start"
            disabled={!url.trim() && !text.trim()}
            onClick={runImport}
          >
            <IconSparkle size={14} />
            {t('import.start')}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // processing
  // -------------------------------------------------------------------------
  if (step === 'processing') {
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="import-panel" data-step="processing">
        <PanelHeader title={t('import.processing')} onClose={closeImport} />
        <div className="min-h-0 flex-1 p-4">
          <ol className="space-y-2.5">
            {STEPS.map((entry, index) => {
              const done = index < stage;
              // Stage 1 covers identification AND matching: both happen inside
              // the same awaited call, so marking only one of them "in progress"
              // would be inventing a boundary that does not exist.
              const active = index === stage || (stage === 1 && entry.id === 'match');
              return (
                <li key={entry.id} className="flex items-center gap-2.5" data-state={done ? 'done' : active ? 'active' : 'waiting'}>
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                      done
                        ? 'border-accent bg-accent text-white'
                        : active
                          ? 'border-accent/40 text-accent'
                          : 'border-line text-faint',
                    )}
                    aria-hidden="true"
                  >
                    {done ? (
                      <IconCheck size={11} />
                    ) : active ? (
                      <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className={cn('text-[13px]', done ? 'text-ink-soft' : active ? 'font-medium text-ink' : 'text-faint')}>
                    {t(entry.label)}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-[11.5px] leading-relaxed text-faint">{t('import.willNotFetch')}</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // done
  // -------------------------------------------------------------------------
  if (step === 'done') {
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="import-panel" data-step="done">
        <PanelHeader title={t('saved.title')} onClose={closeImport} />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
            <IconCheck size={20} />
          </span>
          <p className="text-[15px] font-semibold text-ink" data-testid="import-saved-count">
            {savedCount > 0
              ? t('import.savedToast', { count: savedCount, destination: destinationName })
              : t('import.savedZero')}
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              className="btn-primary btn-sm justify-center"
              data-testid="import-view-saved"
              onClick={() => {
                setPlaceScope('saved');
                useUiStore.getState().setPanelTab('do');
                useImportUiStore.setState({ open: false, step: 'input', picking: false });
              }}
            >
              {t('import.viewSaved')}
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm justify-center"
              data-testid="import-another"
              onClick={() => {
                setUrl('');
                setText('');
                setNotes('');
                setError(null);
                setStage(0);
                setPreviewImport(null);
                setStep('input', null);
              }}
            >
              <IconPlus size={13} />
              {t('import.importAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // review
  // -------------------------------------------------------------------------
  const stateCounts = mentions.reduce(
    (acc, mention) => {
      const state = mentionState(mention);
      acc[state] = (acc[state] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="import-panel" data-step="review">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <div className="flex items-start gap-2">
          <button type="button" className="btn-ghost btn-xs -ml-1.5 mt-[2px] shrink-0 text-muted" onClick={() => setStep('input', null)} data-testid="import-back">
            <IconArrowLeft size={14} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink" data-testid="import-found-count">
              {t('import.foundCount', { count: mentions.length })}
            </h2>
            {matchedCount > 0 && (
              <p className="mt-1 text-[12px] text-muted" data-testid="import-matched-count">
                {t('import.foundMatched', { count: matchedCount })}
              </p>
            )}
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{t('import.reviewHint')}</p>
          </div>
          <button type="button" className="btn-ghost btn-xs shrink-0 text-muted" onClick={closeImport} aria-label={t('import.close')}>
            <IconClose size={14} />
          </button>
        </div>

        {record?.sourceUrl && (
          <p className="mt-2 truncate text-[11px] text-faint" title={record.sourceUrl}>
            {platformMeta(record.platform).label} · {record.sourceUrl}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid="import-select-all"
            onClick={() => mentions.forEach((mention) => decideMention(mention.id, 'save'))}
          >
            {t('import.selectAll')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid="import-select-none"
            onClick={() => mentions.forEach((mention) => decideMention(mention.id, 'pending'))}
          >
            {t('import.selectNone')}
          </button>
          <span className="ml-auto flex items-center gap-2 text-[11px] tabular-nums text-faint">
            {stateCounts['confirmed'] ? <span className="text-emerald-700">✓ {stateCounts['confirmed']}</span> : null}
            {stateCounts['needs-confirm'] ? <span className="text-amber-700">? {stateCounts['needs-confirm']}</span> : null}
            {stateCounts['unmatched'] ? <span>? {stateCounts['unmatched']}</span> : null}
            {stateCounts['ignored'] ? <span>{t('import.match.rejected')} {stateCounts['ignored']}</span> : null}
          </span>
        </div>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-2 p-3">
        {mentions.map((mention) => {
          const place = mention.matchedPlaceId ? (placeById.get(mention.matchedPlaceId) ?? null) : null;
          return (
            <ImportMentionCard
              key={mention.id}
              mention={mention}
              place={place}
              areaName={place ? (areaLabel.get(place.areaId) ?? null) : null}
              knownPlaces={knownPlaces}
              areaOptions={areaOptions}
              selected={mention.userDecision === 'save'}
              highlighted={false}
              onToggle={() => decideMention(mention.id, mention.userDecision === 'save' ? 'pending' : 'save')}
              onConfirm={() => {
                updateMention(mention.id, { matchBand: 'high', matchMethod: 'manual' });
                decideMention(mention.id, 'save');
              }}
              onIgnore={() => decideMention(mention.id, 'ignore')}
              onResolve={(placeId) => {
                resolveMentionToPlace(mention.id, placeId);
                updateMention(mention.id, { matchBand: 'high', matchMethod: 'manual' });
                decideMention(mention.id, 'save');
              }}
              onCreate={(input) => handleCreate(mention, input)}
              onHover={setHoveredMention}
            />
          );
        })}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <button
          type="button"
          className="btn-primary w-full justify-center"
          data-testid="import-save"
          disabled={selectedIds.length === 0}
          onClick={handleSave}
        >
          <IconCheck size={14} />
          {t('import.saveCount', { count: selectedIds.length })}
        </button>
      </div>
    </div>
  );
}

/**
 * Where a matched candidate sits.
 *
 * Coordinates come from the canonical record rather than from the mention: the
 * guide's text has no coordinates, and the whole point of matching is that we
 * can use the verified ones.
 */
function markerPoint(id: string, destinationId: string): { lat: number; lng: number } | null {
  const place = getPlaces(destinationId).find((entry) => entry.id === id);
  if (place) return place.coordinates;
  const hotel = getHotels(destinationId).find((entry) => entry.id === id);
  if (hotel) return hotel.coordinates;
  return null;
}

/** Extractor failures carry codes, not prose; everything else carries a key. */
function errorText(code: string, t: (key: MessageKey, params?: Record<string, string | number>) => string): string {
  const known: Record<string, MessageKey> = {
    content_unavailable: 'import.error.content_unavailable',
    empty_text: 'import.error.empty_text',
    no_places_detected: 'import.error.no_places_detected',
    extraction_failed: 'import.error.extraction_failed',
    empty_input: 'import.error.empty',
  };
  const key = known[code];
  if (key) return t(key);
  if (code.startsWith('import.error.')) return t(code as MessageKey);
  return t('import.error.generic');
}

function PanelHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <header className="flex shrink-0 items-start gap-2 border-b border-line px-4 pb-3 pt-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-[12px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      <button type="button" className="btn-ghost btn-xs shrink-0 text-muted" onClick={onClose} aria-label={t('import.close')}>
        <IconClose size={14} />
      </button>
    </header>
  );
}
