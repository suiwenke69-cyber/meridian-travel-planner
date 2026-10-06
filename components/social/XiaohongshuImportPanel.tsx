'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ImportImage, PlaceCandidate, RecommendationType, XiaohongshuImport } from '@/lib/types';
import { getAreas, getDestinationBundle, getHotels, getPlaces } from '@/lib/data';
import { useResearchStore, imagesForCandidate } from '@/lib/research/store';
import { useImportUiStore } from '@/lib/store/import-ui';
import { useUiStore } from '@/lib/store/ui-store';
import { useT, useName } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { detectPlatform, isXiaohongshuUrl } from '@/lib/research/platforms';
import { MAX_TEXT_LENGTH } from '@/lib/research/limits';
import { MAX_IMAGES_PER_IMPORT, formatBytes, imageBudget } from '@/lib/research/image-rules';
import { SAMPLE_GUIDE_TEXT } from '@/lib/research/extract';
import { cn } from '@/lib/utils';
import { IconAlert, IconArrowLeft, IconCheck, IconClose, IconPlus, IconSparkle } from '../ui/icons';
import { ImageStrip } from './ImageStrip';
import { ImageAssignPanel, ImageQuestionPanel, ResolvePanel } from './CandidatePanels';
import { PlaceCandidateCard } from './PlaceCandidateCard';

/**
 * 导入小红书攻略 — the whole traveller-facing flow.
 *
 * It is a PANEL, not a modal, and the map stays visible throughout. That is not
 * a layout preference: the promise is "把这篇文章直接变成一张可编辑的旅行地图",
 * and the map is where the promise is kept. A dialog would cover it at exactly
 * the moment it matters.
 *
 * Four states, and the review is the one that carries the product:
 *
 *   input      — paste a link, paste the text, add screenshots
 *   processing — reading, locating, waiting for you. No fake percentages.
 *   review     — MAP-FIRST and IMAGE-RICH: candidates on the map, pictures on
 *                the cards, and a tray for the pictures that belong to nothing
 *                yet (§14, §17)
 *   done       — what was kept, and the two things you can do next
 */

const STEPS: Array<{ id: 'read' | 'identify' | 'locate' | 'review'; label: MessageKey }> = [
  { id: 'read', label: 'import.step.read' },
  { id: 'identify', label: 'import.step.identify' },
  { id: 'locate', label: 'import.step.locate' },
  { id: 'review', label: 'import.step.review' },
];

export function XiaohongshuImportPanel({ destinationId }: { destinationId: string }) {
  const t = useT();
  const name = useName();

  const step = useImportUiStore((s) => s.step);
  const importId = useImportUiStore((s) => s.importId);
  const setStep = useImportUiStore((s) => s.setStep);
  const closeImport = useImportUiStore((s) => s.closeImport);
  const setPreviewImport = useImportUiStore((s) => s.setPreviewImport);
  const setPlaceScope = useImportUiStore((s) => s.setPlaceScope);
  const setHoveredCandidate = useImportUiStore((s) => s.setHoveredCandidate);
  const flagJustSaved = useImportUiStore((s) => s.flagJustSaved);
  const assigningFor = useImportUiStore((s) => s.assigningFor);
  const openAssign = useImportUiStore((s) => s.openAssign);
  const closeAssign = useImportUiStore((s) => s.closeAssign);
  const questioningImage = useImportUiStore((s) => s.questioningImage);
  const openQuestion = useImportUiStore((s) => s.openQuestion);
  const closeQuestion = useImportUiStore((s) => s.closeQuestion);
  const picking = useImportUiStore((s) => s.picking);
  const cancelPicking = useImportUiStore((s) => s.cancelPicking);

  const imports = useResearchStore((s) => s.imports);
  const candidatesAll = useResearchStore((s) => s.candidates);
  const imagesAll = useResearchStore((s) => s.images);
  const assignments = useResearchStore((s) => s.assignments);
  const startImport = useResearchStore((s) => s.startImport);
  const processImport = useResearchStore((s) => s.processImport);
  const addImages = useResearchStore((s) => s.addImages);
  const decideCandidate = useResearchStore((s) => s.decideCandidate);
  const saveSelected = useResearchStore((s) => s.saveSelected);
  const updateImport = useResearchStore((s) => s.updateImport);

  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [resolveFor, setResolveFor] = useState<string | null>(null);
  const [stagedImages, setStagedImages] = useState<ImportImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** The draft import id, created lazily so images have somewhere to live. */
  const draftRef = useRef<string | null>(null);

  const record: XiaohongshuImport | null = useMemo(
    () => imports.find((entry) => entry.id === importId) ?? null,
    [imports, importId],
  );
  const candidates = useMemo(
    () => candidatesAll.filter((entry) => entry.importId === importId),
    [candidatesAll, importId],
  );
  const images = useMemo(
    () => imagesAll.filter((entry) => entry.importId === importId).sort((a, b) => a.originalIndex - b.originalIndex),
    [imagesAll, importId],
  );

  const destinationName = useMemo(
    () => getDestinationBundle(destinationId)?.destination.name ?? destinationId,
    [destinationId],
  );
  const areaNameById = useMemo(
    () => new Map(getAreas(destinationId).map((area) => [area.id, area.nameZh ?? area.name])),
    [destinationId],
  );
  const placeById = useMemo(() => new Map(getPlaces(destinationId).map((place) => [place.id, place])), [destinationId]);
  const hotelById = useMemo(() => new Map(getHotels(destinationId).map((hotel) => [hotel.id, hotel])), [destinationId]);

  const detected = useMemo(() => detectPlatform(url), [url]);
  const urlIsForeign = url.trim().length > 0 && !isXiaohongshuUrl(url) && /^https?:/i.test(url.trim());

  const selectedIds = useMemo(
    () => candidates.filter((entry) => entry.userDecision === 'save').map((entry) => entry.id),
    [candidates],
  );
  const locatedCount = candidates.filter(
    (entry) => entry.matchedPlaceId || entry.submittedPlaceId,
  ).length;

  /** Images attached to no candidate yet (§17). */
  const unassigned = useMemo(() => {
    const placed = new Set<string>();
    for (const assignment of assignments) {
      if (assignment.importId !== importId) continue;
      if (candidatesAll.some((entry) => entry.id === assignment.candidateId)) placed.add(assignment.imageId);
    }
    return images.filter((image) => !placed.has(image.id));
  }, [assignments, images, candidatesAll, importId]);

  const budget = imageBudget({
    count: stagedImages.length,
    bytes: stagedImages.reduce((total, image) => total + (image.bytes ?? 0), 0),
  });

  /*
   * The camera follows the candidates.
   *
   * Moved once per import when the review opens — not on every render, or
   * panning away to look at something would snap back.
   */
  const fitOnceRef = useRef<string | null>(null);
  useEffect(() => {
    if (step !== 'review' || !importId) return;
    if (fitOnceRef.current === importId) return;
    const points = candidates
      .flatMap((candidate) => {
        const place = candidate.matchedPlaceId ? placeById.get(candidate.matchedPlaceId) : undefined;
        const hotel = candidate.matchedPlaceId ? hotelById.get(candidate.matchedPlaceId) : undefined;
        return place ? [place.coordinates] : hotel ? [hotel.coordinates] : [];
      });
    if (points.length === 0) return;
    fitOnceRef.current = importId;
    useUiStore.getState().requestFit(points, points.length === 1 ? 12.6 : 12.0);
  }, [step, importId, candidates, placeById, hotelById]);

  // --- images ---------------------------------------------------------------

  /**
   * Adds files to the draft import.
   *
   * The import record is created on first use rather than up front, so a
   * traveller who uploads eleven screenshots does not have to have typed
   * anything else first — and if they abandon the flow, the record is still there
   * to be deleted rather than a half-typed ghost.
   */
  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);
      let id = draftRef.current ?? record?.id ?? null;
      if (!id) {
        // Marked as one image so an images-only import is not rejected as empty.
        const started = startImport({ destinationId, imageCount: Math.max(1, files.length) });
        if (started.violation) {
          setError(started.violation.messageKey);
          return;
        }
        id = started.import!.id;
        draftRef.current = id;
        setStep('input', id);
      }

      const result = await addImages(
        id,
        files.map((file) => ({ blob: file, name: file.name, type: file.type, size: file.size })),
      );
      if (result.violations.length > 0) {
        setError(result.violations[0].messageKey);
      } else if (result.added.length > 0) {
        setError(null);
        setNotice(t('import.imagesAdded', { count: result.added.length }));
      }
      setStagedImages((previous) => [...previous, ...result.added]);
    },
    [addImages, destinationId, record?.id, setStep, startImport, t],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith('image/'));
      void addFiles(files);
    },
    [addFiles],
  );

  // A screenshot pasted straight out of the Xiaohongshu app, which is how most
  // of these actually arrive on a phone (§29).
  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const files = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'));
      if (files.length > 0) {
        event.preventDefault();
        void addFiles(files);
      }
    },
    [addFiles],
  );

  // --- run the import -------------------------------------------------------

  const runImport = async () => {
    setError(null);
    setNotice(null);
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    const draftId = draftRef.current ?? record?.id ?? null;

    if (!trimmedUrl && !trimmedText && stagedImages.length === 0 && !draftId) {
      setError('empty_input');
      return;
    }
    if (urlIsForeign) {
      setError('not_xiaohongshu');
      return;
    }

    setBusy(true);
    let id = draftId;
    try {
      if (!id) {
        const started = startImport({ url: trimmedUrl || undefined, text: trimmedText || undefined, destinationId, userNotes: notes.trim() || undefined });
        if (started.violation) {
          setError(started.violation.messageKey);
          return;
        }
        id = started.import!.id;
        draftRef.current = id;
      } else {
        updateImport(id, {
          sourceUrl: trimmedUrl || undefined,
          userProvidedText: trimmedText || undefined,
          userNotes: notes.trim() || undefined,
          destinationId,
        });
      }

      /*
       * Try to read the post, then fall back (§2, §27).
       *
       * The fallback is not an error path: whatever the traveller pasted or
       * uploaded is still analysed, and the message tells them exactly what to do
       * next. A dead end here would break the product's promise on the very
       * deployment most people use.
       */
      if (trimmedUrl && retrievalEnabled()) {
        const retrieved = await tryRetrieve(trimmedUrl);
        if (retrieved.kind === 'ok') {
          updateImport(id, {
            title: retrieved.title,
            author: retrieved.author,
            userProvidedText: retrieved.bodyText?.trim() || trimmedText || undefined,
            sourceAccessStatus: 'public_content_accessible',
            retrievalProvider: retrieved.provider,
          });
          if (retrieved.imageUrls.length > 0) {
            setNotice(t('import.retrievedImages', { count: retrieved.imageUrls.length }));
            await relayImages(id, retrieved.imageUrls);
          }
        } else if (retrieved.kind === 'not_xiaohongshu') {
          setError('not_xiaohongshu');
          return;
        } else {
          updateImport(id, {
            sourceAccessStatus: 'unavailable',
            retrievalProvider: undefined,
            retrievalNote: retrieved.reason,
          });
          setNotice(t('import.fallback'));
        }
      } else if (trimmedUrl) {
        /*
         * §2/§27: with no approved retrieval configured, the honest thing is to
         * say so immediately rather than make a request guaranteed to fail. The
         * two things that DO work are directly underneath.
         */
        updateImport(id, { sourceAccessStatus: 'unavailable', retrievalNote: 'no_retrieval_provider' });
        setNotice(t('import.fallback'));
      }

      setStep('processing', id);
      setStage(0);
      await new Promise((resolve) => setTimeout(resolve, 220));
      setStage(1);

      const result = await processImport(id);
      if (result.error) {
        setError(result.error);
        setStage(0);
        setStep('input', id);
        return;
      }

      // A high-confidence Meridian match is ticked for the traveller; §13's band
      // decides, not a number the interface would have to explain.
      const created = useResearchStore.getState().candidates.filter((entry) => entry.importId === id);
      for (const candidate of created) {
        if (candidate.resolutionStatus === 'meridian' || candidate.resolutionStatus === 'alias') {
          decideCandidate(candidate.id, 'save');
        }
      }

      setStage(3);
      setPreviewImport(id);
      setStep('review', id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message.slice(0, 60) : 'extraction_failed');
      setStage(0);
      if (id) setStep('input', id);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Whether this deployment can attempt a retrieval at all.
   *
   * OFF unless `NEXT_PUBLIC_XHS_RETRIEVAL=1`. A doomed request is a console
   * error on every import and teaches the traveller nothing; the fallback
   * message teaches them exactly what to do.
   */
  const retrievalEnabled = () => process.env.NEXT_PUBLIC_XHS_RETRIEVAL === '1';

  /**
   * The retrieval attempt, and its honest failure.
   *
   * On a static deployment this route does not exist, the fetch 404s, and the
   * traveller is told the post could not be read directly — with the two things
   * that still work offered right underneath.
   */
  const tryRetrieve = async (target: string): Promise<
    | { kind: 'ok'; provider: string; title?: string; author?: string; bodyText?: string; imageUrls: string[] }
    | { kind: 'unavailable'; reason: string }
    | { kind: 'not_xiaohongshu' }
  > => {
    try {
      const response = await fetch('/api/import/xiaohongshu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      if (!response.ok) return { kind: 'unavailable', reason: `retrieval_${response.status}` };
      const payload = (await response.json()) as {
        status?: string;
        reason?: string;
        provider?: string;
        content?: { title?: string; author?: string; bodyText?: string; imageUrls?: string[] };
      };
      if (payload.status === 'not_xiaohongshu') return { kind: 'not_xiaohongshu' };
      if (payload.status !== 'ok' || !payload.content) {
        return { kind: 'unavailable', reason: payload.reason ?? 'unavailable' };
      }
      return {
        kind: 'ok',
        provider: payload.provider ?? 'retrieval_endpoint',
        title: payload.content.title,
        author: payload.content.author,
        bodyText: payload.content.bodyText,
        imageUrls: payload.content.imageUrls ?? [],
      };
    } catch {
      // No server on this deployment. The fallback UX is the answer, not an error.
      return { kind: 'unavailable', reason: 'no_server' };
    }
  };

  /** Pulls the post's pictures through the relay and into private storage. */
  const relayImages = async (id: string, urls: string[]) => {
    const files: Array<{ blob: Blob; name: string; type: string; size: number }> = [];
    for (const [index, imageUrl] of urls.slice(0, MAX_IMAGES_PER_IMPORT).entries()) {
      try {
        const response = await fetch(`/api/import/xiaohongshu/image?url=${encodeURIComponent(imageUrl)}`);
        if (!response.ok) continue;
        const blob = await response.blob();
        files.push({ blob, name: `xiaohongshu-${index + 1}`, type: blob.type || 'image/jpeg', size: blob.size });
      } catch {
        // One image failing must not fail the import.
      }
    }
    if (files.length > 0) {
      const result = await addImages(id, files, 'xiaohongshu');
      setStagedImages((previous) => [...previous, ...result.added]);
    }
  };

  const handleSave = () => {
    if (!importId) return;
    const { saved } = saveSelected(importId);
    setSavedCount(saved);
    flagJustSaved(
      candidates
        .filter((candidate) => candidate.userDecision === 'save')
        .map((candidate) => candidate.matchedPlaceId ?? candidate.submittedPlaceId ?? '')
        .filter(Boolean),
    );
    setStep('done', importId);
  };

  const resetForAnother = () => {
    setUrl('');
    setText('');
    setNotes('');
    setError(null);
    setNotice(null);
    setStage(0);
    setStagedImages([]);
    draftRef.current = null;
    setPreviewImport(null);
    setStep('input', null);
  };

  // -------------------------------------------------------------------------
  // input
  // -------------------------------------------------------------------------
  if (step === 'input') {
    return (
      <div className="flex h-full min-h-0 flex-col" data-testid="import-panel" data-step="input">
        <PanelHeader title={t('import.entry')} subtitle={t('import.subtitle')} onClose={closeImport} />

        <div className="scroll-area min-h-0 flex-1 space-y-3 p-3.5" onPaste={onPaste}>
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
          {notice && !error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 p-2.5 text-[11.5px] leading-relaxed text-ink-soft"
              data-testid="import-notice"
            >
              <IconSparkle size={13} className="mt-[2px] shrink-0 text-accent" />
              <span>{notice}</span>
            </div>
          )}

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
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
              }}
            />
            {detected && !urlIsForeign && (
              <p className="mt-1.5 text-[11.5px] text-faint">{t('import.urlRecognised')}</p>
            )}
            {urlIsForeign && (
              <p className="mt-1.5 text-[11.5px] text-amber-700" data-testid="import-url-foreign">
                {t('import.urlForeign')}
              </p>
            )}
            {/*
              §2, in the traveller's own words, where they would otherwise expect
              us to fetch the link.
            */}
            <div className="mt-2 space-y-1.5 rounded-lg border border-line bg-surface-2 p-2.5">
              <p className="text-[11.5px] leading-relaxed text-ink-soft">{t('import.platformNote')}</p>
              <p className="text-[11px] leading-relaxed text-faint">{t('import.willNotFetch')}</p>
            </div>
          </div>

          <div>
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
              className="field min-h-[112px] resize-y font-normal leading-relaxed"
              placeholder={t('import.textPlaceholder')}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError(null);
              }}
            />
          </div>

          {/* --- images (§4, §28) ----------------------------------------- */}
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="label-caps">{t('import.imagesLabel')}</span>
              <span className="text-[10.5px] tabular-nums text-faint" data-testid="import-image-budget">
                {t('import.imageBudget', { count: stagedImages.length, max: MAX_IMAGES_PER_IMPORT })}
                {stagedImages.length > 0 ? ` · ${formatBytes(stagedImages.reduce((total, image) => total + (image.bytes ?? 0), 0))}` : ''}
              </span>
            </div>

            <div
              data-testid="import-dropzone"
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={cn(
                'rounded-xl border border-dashed p-2.5 transition-colors',
                dragActive ? 'border-accent bg-accent-soft/50' : 'border-line-strong bg-surface-2',
              )}
            >
              {stagedImages.length > 0 ? (
                <ImageStrip images={stagedImages} className="mb-2" onAdd={() => fileInputRef.current?.click()} />
              ) : null}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[12px] font-medium text-accent transition-colors hover:bg-accent-soft/50"
                data-testid="import-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconPlus size={13} />
                {t('import.uploadImages')}
              </button>
              <p className="mt-1 text-center text-[10.5px] leading-relaxed text-faint">
                {budget.overCount ? t('import.imageLimitReached') : t('import.uploadHint')}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              data-testid="import-file-input"
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = '';
                void addFiles(files);
              }}
            />
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
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-line p-3">
          <button
            type="button"
            className="btn-primary w-full justify-center"
            data-testid="import-start"
            disabled={busy || (!url.trim() && !text.trim() && stagedImages.length === 0)}
            onClick={runImport}
          >
            <IconSparkle size={14} />
            {busy ? t('import.working') : t('import.start')}
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
        <PanelHeader title={t('import.working')} onClose={closeImport} />
        <div className="min-h-0 flex-1 p-4">
          <ol className="space-y-2.5">
            {STEPS.map((entry, index) => {
              const done = index < stage;
              // Stage 1 covers reading text AND pictures: both happen inside the
              // same awaited call, so marking only one "in progress" would invent
              // a boundary that does not exist.
              const active = index === stage || (stage === 1 && entry.id === 'identify');
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
          <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
            {stagedImages.length > 0 ? t('import.processingImages', { count: stagedImages.length }) : t('import.willNotFetch')}
          </p>
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
                useImportUiStore.setState({ open: false, step: 'input', picking: null });
              }}
            >
              {t('import.viewSaved')}
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm justify-center"
              data-testid="import-another"
              onClick={resetForAnother}
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
  // review — map-first, image-rich
  // -------------------------------------------------------------------------
  const assignCandidate = candidates.find((candidate) => candidate.id === assigningFor) ?? null;
  const questionImage = images.find((image) => image.id === questioningImage) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="import-panel" data-step="review">
      <header className="shrink-0 border-b border-line px-4 pb-3 pt-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="btn-ghost btn-xs -ml-1.5 mt-[2px] shrink-0 text-muted"
            onClick={() => setStep('input', null)}
            data-testid="import-back"
          >
            <IconArrowLeft size={14} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink" data-testid="import-found-count">
              {t('import.foundCount', { count: candidates.length })}
            </h2>
            <p className="mt-1 text-[12px] text-muted" data-testid="import-located-count">
              {locatedCount > 0 ? t('import.locatedCount', { count: locatedCount }) : t('import.noneLocated')}
            </p>
            {images.length > 0 && (
              <p className="mt-0.5 text-[11.5px] text-faint">
                {t('import.readImages', { count: images.length })}
              </p>
            )}
          </div>
          <button type="button" className="btn-ghost btn-xs shrink-0 text-muted" onClick={closeImport} aria-label={t('import.close')}>
            <IconClose size={14} />
          </button>
        </div>

        {record?.sourceUrl && (
          <p className="mt-2 truncate text-[11px] text-faint" title={record.sourceUrl}>
            {t('import.sourceLabel')}：{record.sourceUrl}
          </p>
        )}
        {record?.retrievalNote === 'no_vision_provider' && (
          <p className="mt-1.5 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-[11px] leading-relaxed text-ink-soft" data-testid="import-no-vision">
            {t('import.noVision')}
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid="import-select-all"
            onClick={() => candidates.forEach((candidate) => decideCandidate(candidate.id, 'save'))}
          >
            {t('import.selectAll')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid="import-select-none"
            onClick={() => candidates.forEach((candidate) => decideCandidate(candidate.id, 'pending'))}
          >
            {t('import.selectNone')}
          </button>
          {picking && (
            <button type="button" className="btn-ghost btn-xs text-accent" onClick={cancelPicking}>
              {t('import.cancelPicking')}
            </button>
          )}
        </div>
      </header>

      <div className="scroll-area min-h-0 flex-1 space-y-2 p-3">
        {picking && (
          <p className="rounded-lg border border-accent/40 bg-accent-soft px-2.5 py-1.5 text-[11.5px] font-medium text-accent" data-testid="import-picking-banner">
            {t('import.pickingBanner')}
          </p>
        )}

        {candidates.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface-2 p-3 text-[12px] leading-relaxed text-muted">
            {t('import.noCandidates')}
          </p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="space-y-2">
                <PlaceCandidateCard
                  candidate={candidate}
                  resolution={{
                    place: candidate.matchedPlaceId ? (placeById.get(candidate.matchedPlaceId) ?? null) : null,
                    hotel: candidate.matchedPlaceId ? (hotelById.get(candidate.matchedPlaceId) ?? null) : null,
                  }}
                  assignments={imagesForCandidate(candidate.id, images, assignments)}
                  allImages={images}
                  destinationId={destinationId}
                  areaNameById={areaNameById}
                  selected={candidate.userDecision === 'save'}
                  highlighted={false}
                  onToggle={() => decideCandidate(candidate.id, candidate.userDecision === 'save' ? 'pending' : 'save')}
                  onOpenAssign={() => (assigningFor === candidate.id ? closeAssign() : openAssign(candidate.id))}
                  onOpenResolve={() => setResolveFor(resolveFor === candidate.id ? null : candidate.id)}
                  onOpenQuestion={openQuestion}
                  onHover={setHoveredCandidate}
                />
                {assigningFor === candidate.id && (
                  <ImageAssignPanel candidate={candidate} allImages={images} onClose={closeAssign} />
                )}
                {resolveFor === candidate.id && (
                  <ResolvePanel candidate={candidate} destinationId={destinationId} onClose={() => setResolveFor(null)} />
                )}
              </div>
            ))}
          </ul>
        )}

        {/* --- §17 the unassigned tray ------------------------------------- */}
        {unassigned.length > 0 && (
          <section className="rounded-xl border border-line bg-surface p-3" data-testid="import-unassigned">
            <h3 className="text-[13px] font-semibold text-ink">{t('import.unassigned.title')}</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              {t('import.unassigned.body', { count: unassigned.length })}
            </p>
            {questionImage ? (
              <div className="mt-2">
                <ImageQuestionPanel
                  image={questionImage}
                  destinationId={destinationId}
                  candidates={candidates}
                  onClose={closeQuestion}
                />
              </div>
            ) : (
              <ImageStrip
                images={unassigned}
                className="mt-2"
                onOpen={openQuestion}
              />
            )}
            {!questionImage && (
              <p className="mt-2 text-[10.5px] leading-relaxed text-faint">{t('import.unassigned.hint')}</p>
            )}
          </section>
        )}
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

function PanelHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
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

/** Failures carry codes, not prose. Each one says what to do about it (§33). */
function errorText(code: string, t: (key: MessageKey, params?: Record<string, string | number>) => string): string {
  // `import.error.tooManyImages` and friends read a parameter, so the generic
  // renderer passes one through rather than leaving a literal {limit} on screen.
  const known: Record<string, MessageKey> = {
    content_unavailable: 'import.error.content_unavailable',
    empty_text: 'import.error.empty_text',
    no_places_detected: 'import.error.no_places_detected',
    extraction_failed: 'import.error.extraction_failed',
    empty_input: 'import.error.empty',
    not_xiaohongshu: 'import.urlForeign',
    no_server: 'import.fallback',
  };
  // Errors that read a value get one; the rest ignore the extra parameter.
  const params: Record<string, string | number> = {
    limit: MAX_IMAGES_PER_IMPORT,
    detail: code,
  };
  const key = known[code];
  if (key) return t(key, params);
  if (code.startsWith('import.error.')) return t(code as MessageKey, params);
  return t('import.error.generic');
}

export { MAX_TEXT_LENGTH, formatBytes as formatBytesForImages };
export type { PlaceCandidate, RecommendationType };
