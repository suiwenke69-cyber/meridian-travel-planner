'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type {
  ExternalPlaceCandidate,
  ImageAnalysis,
  ImportImage,
  Locale,
  MatchBand,
  MentionStatus,
  PlaceCandidate,
  SocialPlatform,
  SourceAccessStatus,
  SubmissionStatus,
  XiaohongshuImport,
} from '@/lib/types';
import { getHotels, getPlaces } from '@/lib/data';
import { useLocale, useT, type Translator } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { categoryKey } from '@/lib/research/labels';
import { SAMPLE_GUIDE_TEXT } from '@/lib/research/extract';
import { MAX_TEXT_LENGTH, type LimitViolation } from '@/lib/research/limits';
import { formatBytes, MAX_IMAGES_PER_IMPORT } from '@/lib/research/image-rules';
import { getImageBlob } from '@/lib/research/image-store';
import { PLATFORMS, detectPlatform, isXiaohongshuUrl, looksLikeUrl, platformMeta } from '@/lib/research/platforms';
import { ANALYSIS_VERSION, IMAGE_PROPOSAL_FLOOR, listAnalyzers } from '@/lib/research/analyzer';
import { needsUserDecision, resolutionLabelKey } from '@/lib/research/place-resolver';
import {
  bandFor,
  hydrateResearchStore,
  imagesForCandidate,
  useImport,
  useResearchStore,
  useSavedPlaceIds,
  useSavedPlaces,
  useSignalSets,
  useUnassignedImages,
} from '@/lib/research/store';
import { cn } from '@/lib/utils';
import { IconCameraOff, IconCheck, IconClose, IconPlus, IconRefresh, IconTrash } from '@/components/ui/icons';

/**
 * The research inbox — an INTERNAL admin/inspector view.
 *
 * Deliberately not one of the traveller's four tabs. It reads the same store the
 * traveller's own Xiaohongshu import flow writes, and its job is to make the
 * machine's claims auditable one record at a time: here is a name as a guide
 * wrote it, here is the picture it was read out of, here is who attached the two,
 * and here is the canonical place we think it is.
 *
 * V1 reads exactly ONE source. The panel says so rather than offering a platform
 * picker for platforms nothing downstream has been tested against.
 *
 * HONESTY RULE: a confidence score and a band are not the same claim. The model
 * keeps `matchConfidence` for auditing; this view renders `bandFor()` as WORDS
 * and never prints the number, a percentage, a rating or a per-candidate score.
 */

const DEFAULT_DESTINATION_ID = 'bali';

type TabId = 'all' | MentionStatus;

const TAB_ORDER: TabId[] = ['all', 'matched', 'possible_match', 'unmatched', 'rejected'];

const TAB_LABEL: Record<TabId, MessageKey> = {
  all: 'app.all',
  matched: 'import.match.matched',
  possible_match: 'import.match.possible',
  unmatched: 'import.match.unmatched',
  rejected: 'import.match.rejected',
};

const DECISION_LABEL: Record<'save' | 'ignore' | 'pending', MessageKey> = {
  save: 'import.savePlace',
  ignore: 'import.match.ignore',
  pending: 'research.status.pending',
};

const PLATFORM_LABEL: Record<SocialPlatform, MessageKey> = {
  // One value, on purpose. See `SocialPlatform` in lib/types.ts.
  xiaohongshu: 'research.platform.xiaohongshu',
};

const BAND_LABEL: Record<MatchBand, MessageKey> = {
  high: 'research.band.high',
  medium: 'research.band.medium',
  low: 'research.band.low',
};

const BAND_CLASS: Record<MatchBand, string> = {
  high: 'bg-ocean/10 text-ocean',
  medium: 'bg-warn/[0.14] text-warn',
  low: 'bg-black/[0.05] text-faint',
};

const STATUS_CLASS: Record<MentionStatus, string> = {
  matched: 'bg-ocean/10 text-ocean',
  possible_match: 'bg-warn/[0.14] text-warn',
  unmatched: 'bg-black/[0.05] text-faint',
  rejected: 'bg-black/[0.05] text-faint',
};

const SUBMISSION_LABEL: Record<SubmissionStatus, MessageKey> = {
  pending_verification: 'saved.pendingVerification',
  accepted: 'research.accepted',
  rejected: 'research.rejected',
};

/**
 * Where the import's content came from.
 *
 * Three of the four values have copy. `public_content_accessible` does not, and
 * this is an admin view, so the raw value is printed rather than invented.
 */
const SOURCE_ACCESS_LABEL: Partial<Record<SourceAccessStatus, MessageKey>> = {
  user_text: 'import.sourceAccess.userText',
  metadata_only: 'import.sourceAccess.metadataOnly',
  unavailable: 'import.sourceAccess.unavailable',
};

/** Extraction failures the store can return, mapped to real message keys. */
const IMPORT_ERROR_LABEL: Record<string, MessageKey> = {
  import_not_found: 'import.error.generic',
  content_unavailable: 'import.error.content_unavailable',
  empty_text: 'import.error.empty_text',
  no_places_detected: 'import.error.no_places_detected',
  extraction_failed: 'import.error.extraction_failed',
};

interface PanelResult {
  kind: 'done' | 'error';
  message: string;
}

interface NameEntry {
  id: string;
  name: string;
  nameZh?: string;
}

function importErrorMessage(code: string, t: Translator): string {
  return t(IMPORT_ERROR_LABEL[code] ?? 'import.error.generic');
}

function violationMessage(violation: LimitViolation, t: Translator): string {
  // The catalogue's {limit} is the configured ceiling, not the pasted length.
  if (violation.code === 'text_too_long') return t('import.error.textTooLong', { limit: MAX_TEXT_LENGTH });
  return t(violation.messageKey);
}

function extractionResultMessage(
  result: { places: number; located: number; imagesAnalyzed: number; degradedReason?: string },
  t: Translator,
): string {
  const base = [
    t('import.foundCount', { count: result.places }),
    t('import.locatedCount', { count: result.located }),
    t('import.readImages', { count: result.imagesAnalyzed }),
  ].join(' · ');
  return result.degradedReason ? `${base} · ${result.degradedReason}` : base;
}

function sourceAccessLabel(status: SourceAccessStatus, t: Translator): string {
  const key = SOURCE_ACCESS_LABEL[status];
  return key ? t(key) : status;
}

function placeLabel(entry: NameEntry | undefined, locale: Locale): string | null {
  if (!entry) return null;
  return locale === 'zh-CN' && entry.nameZh ? `${entry.nameZh} · ${entry.name}` : entry.name;
}

/** An image-only finding the reader was not sure about is a QUESTION, not a fact. */
function isImageOnlyQuestion(candidate: PlaceCandidate): boolean {
  return (
    !candidate.detectedFromText &&
    candidate.detectedFromImageIds.length > 0 &&
    (candidate.matchConfidence ?? 0) < IMAGE_PROPOSAL_FLOOR
  );
}

export default function ResearchClient() {
  const t = useT();
  const locale = useLocale();

  const hydrated = useResearchStore((s) => s.hydrated);
  const setHydrated = useResearchStore((s) => s.setHydrated);
  const imports = useResearchStore((s) => s.imports);
  const candidates = useResearchStore((s) => s.candidates);
  const images = useResearchStore((s) => s.images);
  const analyses = useResearchStore((s) => s.analyses);
  const assignments = useResearchStore((s) => s.assignments);
  const submissions = useResearchStore((s) => s.submissions);

  const startImport = useResearchStore((s) => s.startImport);
  const processImport = useResearchStore((s) => s.processImport);
  const addImages = useResearchStore((s) => s.addImages);
  const updateImport = useResearchStore((s) => s.updateImport);
  const unassignImage = useResearchStore((s) => s.unassignImage);
  const acceptExternalCandidate = useResearchStore((s) => s.acceptExternalCandidate);
  const unsavePlace = useResearchStore((s) => s.unsavePlace);
  const setSubmissionStatus = useResearchStore((s) => s.setSubmissionStatus);
  const saveSelected = useResearchStore((s) => s.saveSelected);

  const savedPlaces = useSavedPlaces();
  const savedPlaceIds = useSavedPlaceIds();
  const signals = useSignalSets();

  const [tab, setTab] = useState<TabId>('all');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [draftImportId, setDraftImportId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [openImportId, setOpenImportId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PanelResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    hydrateResearchStore().finally(() => setHydrated(true));
  }, [setHydrated]);

  const detected = useMemo(() => detectPlatform(url), [url]);
  const platformMatch = useMemo(() => isXiaohongshuUrl(url), [url]);
  const analyzers = useMemo(() => listAnalyzers(), []);

  /*
   * Place and hotel lookups are built from every destination the store actually
   * references, plus Bali — the default the pipeline falls back to. A candidate
   * resolves against ITS import's destination, so a second destination does not
   * silently match against Bali's places.
   */
  const destinationIds = useMemo(() => {
    const ids = new Set<string>([DEFAULT_DESTINATION_ID]);
    for (const record of imports) if (record.destinationId) ids.add(record.destinationId);
    for (const saved of savedPlaces) if (saved.destinationId) ids.add(saved.destinationId);
    for (const submission of submissions) if (submission.destinationId) ids.add(submission.destinationId);
    return [...ids];
  }, [imports, savedPlaces, submissions]);

  const { nameById, optionsByDestination } = useMemo(() => {
    const names = new Map<string, NameEntry>();
    const options = new Map<string, { id: string; label: string }[]>();
    for (const destinationId of destinationIds) {
      // Hotels are in the same list as places because a guide names them
      // constantly and `resolveCandidateToPlace` accepts either id.
      const entries: NameEntry[] = [...getPlaces(destinationId), ...getHotels(destinationId)].map((entry) => ({
        id: entry.id,
        name: entry.name,
        nameZh: entry.nameZh,
      }));
      for (const entry of entries) names.set(entry.id, entry);
      options.set(
        destinationId,
        entries
          .map((entry) => ({ id: entry.id, label: placeLabel(entry, locale) ?? entry.id }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
    }
    return { nameById: names, optionsByDestination: options };
  }, [destinationIds, locale]);

  const importById = useMemo(() => new Map(imports.map((record) => [record.id, record])), [imports]);
  const imageById = useMemo(() => new Map(images.map((image) => [image.id, image])), [images]);
  const imageIndexById = useMemo(
    () => new Map(images.map((image) => [image.id, image.originalIndex])),
    [images],
  );
  const candidateById = useMemo(() => new Map(candidates.map((candidate) => [candidate.id, candidate])), [candidates]);

  const counts = useMemo(() => {
    const byStatus = (status: MentionStatus) =>
      candidates.filter((candidate) => candidate.verificationStatus === status).length;
    return {
      all: candidates.length,
      matched: byStatus('matched'),
      possible_match: byStatus('possible_match'),
      unmatched: byStatus('unmatched'),
      rejected: byStatus('rejected'),
    } as Record<TabId, number>;
  }, [candidates]);

  const visibleCandidates = useMemo(() => {
    const filtered = candidates.filter((candidate) =>
      tab === 'all' ? true : candidate.verificationStatus === tab,
    );
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [candidates, tab]);

  const canSubmit = url.trim().length > 0 || text.trim().length > 0;

  /** What the import being composed already holds, for the budget line. */
  const draftImageCount = draftImportId
    ? images.filter((image) => image.importId === draftImportId).length
    : pendingFiles.length;

  /** Creates the draft import the image picker attaches to, if there is none yet. */
  const ensureDraftImport = (): string | null => {
    if (draftImportId && imports.some((record) => record.id === draftImportId)) return draftImportId;
    const outcome = startImport({
      url: url.trim() || undefined,
      text: text.trim() || undefined,
      userNotes: notes.trim() || undefined,
      destinationId: DEFAULT_DESTINATION_ID,
    });
    if (outcome.violation) {
      setResult({ kind: 'error', message: violationMessage(outcome.violation, t) });
      return null;
    }
    if (!outcome.import) {
      setResult({ kind: 'error', message: t('import.error.generic') });
      return null;
    }
    setDraftImportId(outcome.import.id);
    return outcome.import.id;
  };

  const toEntries = (files: File[]) =>
    files.map((file) => ({ blob: file as Blob, name: file.name, type: file.type, size: file.size }));

  const onPickImages = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    const files = Array.from(picked);
    const importId = ensureDraftImport();
    if (!importId) {
      // No import to attach to yet: hold the files and let submit carry them in
      // once a link or some text exists.
      setPendingFiles((previous) => [...previous, ...files]);
      return;
    }
    const { added, violations } = await addImages(importId, toEntries(files));
    setOpenImportId(importId);
    if (added.length > 0) setResult({ kind: 'done', message: t('import.imagesAdded', { count: added.length }) });
    if (violations.length > 0) setResult({ kind: 'error', message: t(violations[0].messageKey) });
  };

  const submit = async () => {
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    if (!trimmedUrl && !trimmedText) return;

    setResult(null);
    setBusy(true);
    try {
      let importId = draftImportId && imports.some((record) => record.id === draftImportId) ? draftImportId : null;

      if (importId) {
        // The import already exists because images were attached to it; fill in
        // the fields the traveller typed after that.
        updateImport(importId, {
          sourceUrl: trimmedUrl || undefined,
          userProvidedText: trimmedText || undefined,
          userNotes: notes.trim() || undefined,
          sourceAccessStatus: trimmedUrl ? 'metadata_only' : 'user_text',
        });
      } else {
        const outcome = startImport({
          url: trimmedUrl || undefined,
          text: trimmedText || undefined,
          userNotes: notes.trim() || undefined,
          destinationId: DEFAULT_DESTINATION_ID,
        });
        if (outcome.violation) {
          setResult({ kind: 'error', message: violationMessage(outcome.violation, t) });
          return;
        }
        if (!outcome.import) {
          setResult({ kind: 'error', message: t('import.error.generic') });
          return;
        }
        importId = outcome.import.id;
        setDraftImportId(importId);
      }

      if (pendingFiles.length > 0) {
        const { added, violations } = await addImages(importId, toEntries(pendingFiles));
        setPendingFiles([]);
        if (violations.length > 0 && added.length === 0) {
          setResult({ kind: 'error', message: t(violations[0].messageKey) });
          return;
        }
      }

      setOpenImportId(importId);
      const processed = await processImport(importId);
      if (processed.error) {
        setResult({ kind: 'error', message: importErrorMessage(processed.error, t) });
        return;
      }
      setResult({ kind: 'done', message: extractionResultMessage(processed, t) });
      setUrl('');
      setText('');
      setNotes('');
      setDraftImportId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setBusy(false);
    }
  };

  const discardDraft = () => {
    setUrl('');
    setText('');
    setNotes('');
    setDraftImportId(null);
    setPendingFiles([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1180px] px-5 py-8">
      <header className="mb-6">
        <Link href="/" className="btn-ghost btn-xs -ml-2 mb-3 text-muted">
          ← {t('app.back')}
        </Link>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">{t('research.title')}</h1>
        <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-soft">{t('research.subtitle')}</p>
        {/* Internal-only notice, promoted from a faint footnote to a bordered line. */}
        <p
          role="note"
          data-testid="research-internal-note"
          className="mt-3 inline-block rounded-[6px] border border-warn/40 bg-warn/[0.08] px-2.5 py-1 text-[12px] font-medium text-warn"
        >
          {t('research.internalNote')}
        </p>
        <p data-testid="research-platform-scope" className="mt-2 text-[12px] text-muted">
          {t('research.platformScope')}{' '}
          <span className="text-faint">{PLATFORMS.map((entry) => entry.label).join(' · ')}</span>
        </p>
      </header>

      {/* --- add a guide ---------------------------------------------------- */}
      <section className="panel mb-6 p-4" data-testid="research-guide">
        <h2 className="text-[15px] font-semibold text-ink">{t('research.addSource')}</h2>
        <p className="mt-1 text-[11.5px] leading-relaxed text-faint">{t('import.willNotFetch')}</p>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <label className="label-caps mb-1 block" htmlFor="research-url">
              {t('research.url')}
            </label>
            <input
              id="research-url"
              data-testid="research-url"
              className="field"
              placeholder={t('import.urlPlaceholder')}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">
              {url.trim().length === 0
                ? t('research.urlPlaceholder')
                : detected && platformMatch
                  ? t('import.urlRecognised')
                  : looksLikeUrl(url)
                    ? t('import.urlForeign')
                    : t('research.urlPlaceholder')}
            </p>
          </div>

          <div>
            <span className="label-caps mb-1 block">{t('research.platform')}</span>
            <p className="flex h-[34px] items-center gap-2 rounded-lg border border-line bg-paper px-2.5 text-[12.5px] text-ink-soft">
              <span
                className="rounded-full border border-line bg-surface px-2 py-[1px] text-[10.5px] font-medium"
                title={platformMeta('xiaohongshu').hint}
              >
                {t(PLATFORM_LABEL.xiaohongshu)}
              </span>
              <span className="text-faint">{platformMeta('xiaohongshu').hint}</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
              {t('research.extract')}: {analyzers.map((analyzer) => analyzer.label).join(' · ')} · {ANALYSIS_VERSION}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <label className="label-caps" htmlFor="research-text">
              {t('research.pastedText')}
            </label>
            <button
              type="button"
              className="btn-ghost btn-xs text-muted"
              data-testid="research-sample"
              onClick={() => setText(SAMPLE_GUIDE_TEXT)}
            >
              {t('research.sampleText')}
            </button>
          </div>
          <textarea
            id="research-text"
            data-testid="research-text"
            className="field min-h-[120px] resize-y font-normal leading-relaxed"
            placeholder={t('research.pastedTextPlaceholder')}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">{t('research.pastedTextHint')}</p>
        </div>

        <div className="mt-3">
          <label className="label-caps mb-1 block" htmlFor="research-notes">
            {t('research.notes')}
          </label>
          <input
            id="research-notes"
            data-testid="research-notes"
            className="field"
            placeholder={t('research.notesPlaceholder')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="mt-3">
          <label className="label-caps mb-1 block" htmlFor="research-images">
            {t('import.uploadImages')}
          </label>
          <input
            id="research-images"
            data-testid="research-images"
            ref={fileInputRef}
            className="field file:mr-2 file:rounded-md file:border file:border-line file:bg-paper file:px-2 file:py-1 file:text-[11.5px] file:text-ink-soft"
            type="file"
            multiple
            accept="image/*"
            onChange={(event) => {
              void onPickImages(event.target.files);
            }}
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">
            {t('import.uploadHint')} ·{' '}
            {t('import.imageBudget', { count: draftImageCount, max: MAX_IMAGES_PER_IMPORT })}
          </p>
          {pendingFiles.length > 0 && (
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-warn" data-testid="research-images-pending">
              {t('import.imagesAdded', { count: pendingFiles.length })}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            data-testid="research-add"
            disabled={busy || !canSubmit}
            onClick={() => {
              void submit();
            }}
          >
            <IconPlus size={14} />
            {busy ? t('research.processing') : t('research.add')}
          </button>

          {(url.trim().length > 0 || text.trim().length > 0 || pendingFiles.length > 0) && !busy && (
            <button type="button" className="btn-ghost btn-xs text-muted" onClick={discardDraft}>
              {t('import.cancel')}
            </button>
          )}

          {result && (
            <p
              data-testid="research-add-result"
              className={cn('text-[12px]', result.kind === 'done' ? 'text-ink-soft' : 'text-danger')}
            >
              {result.message}
            </p>
          )}
        </div>
      </section>

      {/* --- my guides ------------------------------------------------------ */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">
          {t('import.myImports')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">
            {t('research.sourceCount', { count: imports.length })}
          </span>
        </h2>

        {!hydrated ? (
          <p className="text-[12.5px] text-muted">{t('app.loading')}</p>
        ) : imports.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] font-semibold text-ink">{t('import.noImports')}</p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[12px] leading-relaxed text-muted">
              {t('import.noImportsHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-source-list">
            {imports.map((record) => (
              <SourceRow
                key={record.id}
                record={record}
                open={openImportId === record.id}
                onToggle={() => setOpenImportId(openImportId === record.id ? null : record.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* --- review queue --------------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">{t('research.reviewQueue', { count: counts.all })}</h2>

        <div className="mb-3 flex flex-wrap items-center gap-1.5" data-testid="research-tabs">
          {TAB_ORDER.map((entry) => (
            <button
              key={entry}
              type="button"
              data-testid={`research-tab-${entry}`}
              onClick={() => setTab(entry)}
              className={cn(
                'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                tab === entry
                  ? 'border-accent/40 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              )}
            >
              {t(TAB_LABEL[entry])}
              <span className="ml-1.5 tabular-nums text-faint">{counts[entry]}</span>
            </button>
          ))}
        </div>

        <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{t('import.sourceNote')}</p>

        {visibleCandidates.length === 0 ? (
          <div className="panel px-4 py-8 text-center">
            <p className="text-[13px] text-muted">{t('import.noCandidates')}</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-candidate-list">
            {visibleCandidates.map((candidate) => {
              const record = importById.get(candidate.importId);
              const destinationId = record?.destinationId ?? DEFAULT_DESTINATION_ID;
              return (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  destinationId={destinationId}
                  importLabel={
                    record?.title ?? record?.sourceUrl ?? t('research.pastedText')
                  }
                  nameById={nameById}
                  placeOptions={optionsByDestination.get(destinationId) ?? []}
                  savedPlaceIds={savedPlaceIds}
                  imageIndexById={imageIndexById}
                  signals={signals.mine}
                  onAcceptExternal={acceptExternalCandidate}
                />
              );
            })}
          </ul>
        )}
      </section>

      {/* --- image assignments audit ---------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-1 text-[15px] font-semibold text-ink">
          {t('research.imageAssignments')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">{assignments.length}</span>
        </h2>
        <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{t('import.assign.hint')}</p>

        {assignments.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] text-muted">{t('empty.nothingHere')}</p>
          </div>
        ) : (
          <ul className="panel divide-y divide-line" data-testid="research-assignment-list">
            {assignments.map((assignment) => {
              const imageIndex = imageIndexById.get(assignment.imageId);
              const candidate = candidateById.get(assignment.candidateId);
              const isUser = assignment.source === 'user';
              return (
                <li
                  key={assignment.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[11.5px]"
                  data-testid={`research-assignment-${assignment.id}`}
                >
                  <span className="font-medium text-ink">
                    {t('import.imageLabel')} {imageIndex ?? '—'}
                  </span>
                  <span className="text-faint">→</span>
                  <span className="min-w-0 truncate text-ink-soft" title={candidate?.rawName ?? assignment.candidateId}>
                    {candidate?.rawName ?? assignment.candidateId}
                  </span>
                  {/* `source` is the point of this type: who decided, the machine or a person. */}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-[1px] text-[10.5px] font-medium',
                      isUser ? 'bg-ocean/10 text-ocean' : 'bg-black/[0.05] text-faint',
                    )}
                  >
                    {isUser ? t('import.source.user') : t('import.detectedFrom')}
                  </span>
                  <span className="tabular-nums text-faint">{assignment.createdAt.slice(0, 19).replace('T', ' ')}</span>
                  <button
                    type="button"
                    className="btn-ghost btn-xs ml-auto text-muted hover:text-danger"
                    data-testid={`research-unassign-${assignment.id}`}
                    onClick={() => unassignImage(assignment.candidateId, assignment.imageId)}
                  >
                    <IconClose size={12} />
                    {t('saved.remove')}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --- image analyses ------------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-1 text-[15px] font-semibold text-ink">
          {t('research.imageAnalyses')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">{analyses.length}</span>
        </h2>
        <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{t('import.noVision')}</p>

        {analyses.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] text-muted">{t('empty.nothingHere')}</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-analysis-list">
            {analyses.map((analysis) => (
              <AnalysisRow key={analysis.id} analysis={analysis} imageIndex={imageIndexById.get(analysis.imageId)} />
            ))}
          </ul>
        )}
      </section>

      {/* --- saved places --------------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">
          {t('saved.title')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">
            {t('saved.count', { count: savedPlaces.length })}
          </span>
        </h2>

        {savedPlaces.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] text-muted">{t('saved.empty')}</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-saved-list">
            {savedPlaces.map((saved) => {
              const entry = nameById.get(saved.placeId);
              const selected = saved.selectedImportImageIds?.length ?? 0;
              const mine = signals.mine.get(saved.placeId);
              const community = signals.community.get(saved.placeId);
              return (
                <li
                  key={saved.id}
                  className="panel flex items-start gap-3 p-3"
                  data-testid={`research-saved-${saved.placeId}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">
                      {placeLabel(entry, locale) ?? saved.placeId}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
                      <span>{saved.placeId}</span>
                      <span>{saved.destinationId}</span>
                      <span className="tabular-nums">{saved.savedAt.slice(0, 10)}</span>
                      {saved.sourceImportId && <span>{saved.sourceImportId}</span>}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                      <span className="rounded-full border border-line px-1.5 py-[1px]">
                        {t('import.assign.selected', { count: selected })}
                      </span>
                      {mine && mine.mentionCount > 0 && (
                        <span>{t('saved.signalMineShort', { count: mine.mentionCount })}</span>
                      )}
                      {community && community.mentionCount > 0 && (
                        <span>{t('saved.signalCommunity', { count: community.mentionCount })}</span>
                      )}
                    </p>
                    {saved.note && <p className="mt-1 text-[11.5px] text-muted">{saved.note}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-xs shrink-0 text-muted hover:text-danger"
                    data-testid={`research-unsave-${saved.placeId}`}
                    onClick={() => unsavePlace(saved.placeId)}
                  >
                    <IconTrash size={13} />
                    {t('saved.unsave')}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --- user submissions ----------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">
          {t('research.submissions')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">{submissions.length}</span>
        </h2>

        {submissions.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] text-muted">{t('empty.nothingHere')}</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-submission-list">
            {submissions.map((submission) => (
              <li key={submission.id} className="panel p-3" data-testid={`research-submission-${submission.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">
                      {submission.nameZh ? `${submission.nameZh} · ${submission.name}` : submission.name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                      <span className="rounded-full border border-line px-1.5 py-[1px]">
                        {t(categoryKey(submission.recommendationType))}
                      </span>
                      <span>{submission.destinationId}</span>
                      {submission.areaId && <span>{submission.areaId}</span>}
                      <span className="tabular-nums text-faint">{submission.createdAt.slice(0, 10)}</span>
                    </p>
                    {submission.note && <p className="mt-1 text-[11.5px] text-muted">{submission.note}</p>}
                    {submission.sourceUrl && (
                      <a
                        href={submission.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 block truncate text-[11.5px] text-accent underline-offset-2 hover:underline"
                      >
                        {submission.sourceUrl}
                      </a>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-black/[0.05] px-2 py-[2px] text-[10.5px] font-medium text-faint">
                    {t(SUBMISSION_LABEL[submission.status])}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-primary btn-xs"
                    data-testid={`research-submission-accept-${submission.id}`}
                    onClick={() => setSubmissionStatus(submission.id, 'accepted')}
                  >
                    <IconCheck size={13} />
                    {t('research.accept')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-xs"
                    data-testid={`research-submission-reject-${submission.id}`}
                    onClick={() => setSubmissionStatus(submission.id, 'rejected')}
                  >
                    <IconClose size={12} />
                    {t('research.dismiss')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 border-t border-line pt-4 text-[11.5px] leading-relaxed text-faint">
        <p>{t('research.acceptedHint')}</p>
        <p className="mt-1">{t('research.notPublished')}</p>
        <p className="mt-1">{t('import.create.note2')}</p>
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------
// One imported guide
// ---------------------------------------------------------------------------

function SourceRow({
  record,
  open,
  onToggle,
}: {
  record: XiaohongshuImport;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const { candidates, images } = useImport(record.id);
  const unassigned = useUnassignedImages(record.id);

  const processImport = useResearchStore((s) => s.processImport);
  const deleteImport = useResearchStore((s) => s.deleteImport);
  const updateImport = useResearchStore((s) => s.updateImport);
  const assignImage = useResearchStore((s) => s.assignImage);
  const saveSelected = useResearchStore((s) => s.saveSelected);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    const processed = await processImport(record.id);
    setMessage(
      processed.error ? importErrorMessage(processed.error, t) : extractionResultMessage(processed, t),
    );
    setBusy(false);
  };

  const onSaveSelected = () => {
    const { saved } = saveSelected(record.id);
    setMessage(
      saved > 0
        ? t('import.savedToast', { count: saved, destination: record.destinationId ?? DEFAULT_DESTINATION_ID })
        : t('import.savedZero'),
    );
  };

  return (
    <li className="panel overflow-hidden" data-testid={`research-source-${record.id}`}>
      <div className="flex items-start gap-3 p-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggle}>
          <span className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border border-line bg-paper px-2 py-[1px] text-[10.5px] font-medium text-ink-soft"
              title={platformMeta(record.platform).hint}
            >
              {t(PLATFORM_LABEL[record.platform])}
            </span>
            <span className="text-[12.5px] font-semibold text-ink">
              {record.title ?? record.sourceUrl ?? record.userProvidedText?.slice(0, 60) ?? t('research.pastedText')}
            </span>
          </span>
          {record.sourceUrl && <span className="mt-1 block truncate text-[11.5px] text-muted">{record.sourceUrl}</span>}
          <span className="mt-1 block text-[11px] text-faint">
            {t('research.importedAt', { date: record.createdAt.slice(0, 10) })} · {record.status} ·{' '}
            {record.sourceAccessStatus ? sourceAccessLabel(record.sourceAccessStatus, t) : '—'} ·{' '}
            {t('import.detail.images')} {images.length} · {t('import.mentionsCount', { count: candidates.length })}
          </span>
          {(record.retrievalProvider || record.retrievalNote) && (
            <span className="mt-1 block text-[11px] text-faint">
              {record.retrievalProvider ?? '—'}
              {record.retrievalNote ? ` · ${record.retrievalNote}` : ''}
            </span>
          )}
          {record.userNotes && <span className="mt-1 block text-[11.5px] text-muted">{record.userNotes}</span>}
          {record.failureReason && (
            <span className="mt-1 block text-[11.5px] text-danger">{record.failureReason}</span>
          )}
        </button>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {record.sourceUrl && (
            <a
              href={record.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-ghost btn-xs text-muted"
            >
              {t('research.url')}
            </a>
          )}
          <button
            type="button"
            className="btn-secondary btn-xs"
            data-testid={`research-reprocess-${record.id}`}
            disabled={busy}
            onClick={() => {
              void run();
            }}
          >
            <IconRefresh size={12} />
            {busy ? t('research.processing') : t('research.reExtract')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid={`research-save-selected-${record.id}`}
            onClick={onSaveSelected}
          >
            <IconCheck size={12} />
            {t('import.savePlace')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid={`research-complete-${record.id}`}
            onClick={() => updateImport(record.id, { status: 'completed' })}
          >
            {t('import.step.done')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted hover:text-danger"
            aria-label={t('research.deleteSource')}
            data-testid={`research-delete-${record.id}`}
            onClick={() => {
              void deleteImport(record.id);
            }}
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {message && <p className="border-t border-line bg-paper px-3 py-2 text-[11.5px] text-ink-soft">{message}</p>}

      {open && (
        <div className="space-y-3 border-t border-line bg-paper px-3 py-2.5">
          {/* --- images ----------------------------------------------------- */}
          <div>
            <p className="label-caps mb-1.5">
              {t('import.imagesLabel')}{' '}
              <span className="ml-1 tabular-nums text-faint">
                {t('import.imageBudget', { count: images.length, max: MAX_IMAGES_PER_IMPORT })}
              </span>
            </p>
            {images.length === 0 ? (
              <p className="text-[11.5px] text-muted">{t('import.assign.noImages')}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <ImageRow key={image.id} image={image} />
                ))}
              </ul>
            )}
          </div>

          {/* --- unassigned tray -------------------------------------------- */}
          {unassigned.length > 0 && (
            <div>
              <p className="label-caps mb-1.5">
                {t('import.unassigned.title')}{' '}
                <span className="ml-1 tabular-nums text-faint">
                  {t('import.unassigned.body', { count: unassigned.length })}
                </span>
              </p>
              <ul className="space-y-1.5">
                {unassigned.map((image) => (
                  <li key={image.id} className="flex flex-wrap items-center gap-2 text-[11.5px]">
                    <ImageThumb imageId={image.id} alt={image.caption ?? t('import.imageLabel')} className="h-10 w-10" />
                    <span className="text-ink-soft">
                      {t('import.imageLabel')} {image.originalIndex}
                    </span>
                    <label className="flex items-center gap-1.5 text-muted">
                      {t('import.question.attachTo')}
                      <select
                        className="field h-7 w-auto max-w-[240px] py-0 text-[11.5px]"
                        data-testid={`research-attach-${image.id}`}
                        value=""
                        onChange={(event) => {
                          if (event.target.value) assignImage(event.target.value, image.id, 'user');
                        }}
                      >
                        <option value="">{t('import.question.later')}</option>
                        {candidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.rawName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* --- pasted text ------------------------------------------------ */}
          {record.userProvidedText && (
            <div>
              <p className="label-caps mb-1.5">{t('research.pastedText')}</p>
              <p className="scroll-area max-h-52 overflow-y-auto whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted">
                {record.userProvidedText.slice(0, 2000)}
              </p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// One image in the guide's own list
// ---------------------------------------------------------------------------

function ImageThumb({ imageId, alt, className }: { imageId: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  /*
   * Thumbnails are read out of IndexedDB and turned into object URLs here, one
   * effect per image. The cleanup revokes the URL it created — including when the
   * effect is torn down before the blob resolves, which is why `cancelled` is
   * checked before `createObjectURL` is ever called. Without that pair a list
   * that re-renders on every keystroke leaks a blob per render.
   */
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    void getImageBlob(imageId, 'thumb').then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (!url) {
    return (
      <span
        data-testid={`research-thumb-${imageId}`}
        title={alt}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-faint',
          className,
        )}
      >
        <IconCameraOff size={13} />
      </span>
    );
  }

  return (
    // Imported images are private to this profile and never published, so an
    // <img> over a local object URL is the only renderer they get.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-testid={`research-thumb-${imageId}`}
      src={url}
      alt={alt}
      className={cn('shrink-0 rounded-[6px] border border-line object-cover', className)}
    />
  );
}

function ImageRow({ image }: { image: ImportImage }) {
  const t = useT();
  const removeImage = useResearchStore((s) => s.removeImage);
  const setImageCaption = useResearchStore((s) => s.setImageCaption);

  return (
    <li className="flex items-start gap-2 rounded-lg border border-line bg-surface p-2" data-testid={`research-image-${image.id}`}>
      <ImageThumb imageId={image.id} alt={image.caption ?? t('import.imageLabel')} className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
          <span className="font-medium text-ink-soft">
            {t('import.imageLabel')} {image.originalIndex}
          </span>
          <span className="rounded-full bg-black/[0.05] px-1.5 py-[1px]">{image.analysisStatus}</span>
          <span>{image.originalSource}</span>
          {typeof image.bytes === 'number' && <span className="tabular-nums">{formatBytes(image.bytes)}</span>}
          <span title={t('import.imagePrivateHint')}>{t('import.imagePrivate')}</span>
        </p>
        <input
          className="field mt-1.5 py-1 text-[11.5px]"
          placeholder={t('import.notesPlaceholder')}
          value={image.caption ?? ''}
          data-testid={`research-caption-${image.id}`}
          onChange={(event) => setImageCaption(image.id, event.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn-ghost btn-xs shrink-0 text-muted hover:text-danger"
        aria-label={t('saved.remove')}
        data-testid={`research-remove-image-${image.id}`}
        onClick={() => {
          void removeImage(image.id);
        }}
      >
        <IconTrash size={13} />
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// One place candidate
// ---------------------------------------------------------------------------

function CandidateCard({
  candidate,
  destinationId,
  importLabel,
  nameById,
  placeOptions,
  savedPlaceIds,
  imageIndexById,
  signals,
  onAcceptExternal,
}: {
  candidate: PlaceCandidate;
  destinationId: string;
  importLabel: string;
  nameById: Map<string, NameEntry>;
  placeOptions: { id: string; label: string }[];
  savedPlaceIds: Set<string>;
  imageIndexById: Map<string, number>;
  signals: Map<string, { mentionCount: number }>;
  onAcceptExternal: (id: string, providerPlaceId: string) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const images = useResearchStore((s) => s.images);
  const assignments = useResearchStore((s) => s.assignments);
  const decideCandidate = useResearchStore((s) => s.decideCandidate);
  const resolveCandidateToPlace = useResearchStore((s) => s.resolveCandidateToPlace);
  const assignImage = useResearchStore((s) => s.assignImage);
  const unassignImage = useResearchStore((s) => s.unassignImage);

  // The band is the interface's word for the score; the score itself stays in the data.
  const band = bandFor(candidate.matchConfidence);
  const status = candidate.verificationStatus;
  const matched = candidate.matchedPlaceId ? nameById.get(candidate.matchedPlaceId) : undefined;
  const attached = imagesForCandidate(candidate.id, images, assignments);
  const attachedIds = new Set(attached.map((entry) => entry.image.id));
  const detectedOnly = candidate.detectedFromImageIds.filter((imageId) => !attachedIds.has(imageId));
  const saved = candidate.matchedPlaceId ? savedPlaceIds.has(candidate.matchedPlaceId) : false;
  const question = isImageOnlyQuestion(candidate);
  const mentionCount = candidate.matchedPlaceId ? (signals.get(candidate.matchedPlaceId)?.mentionCount ?? 0) : 0;

  return (
    <li className="panel p-3" data-testid={`research-candidate-${candidate.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {/* The name exactly as the guide wrote it, before any normalisation. */}
          <p className="text-[14px] font-semibold leading-snug text-ink">{candidate.rawName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
            <span className="rounded-full border border-line px-1.5 py-[1px]">
              {t('import.detail.type')}: {t(categoryKey(candidate.entityType))}
            </span>
            <span className="rounded-full border border-line px-1.5 py-[1px]" title={candidate.normalizedName}>
              {t('import.detail.normalized')}: {candidate.normalizedName}
            </span>
            <span className="truncate text-faint" title={importLabel}>
              {importLabel}
            </span>
            <span className="text-faint">{destinationId}</span>
            <span className="tabular-nums text-faint">{candidate.createdAt.slice(0, 10)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <span className={cn('rounded-full px-2 py-[2px] text-[10.5px] font-medium', STATUS_CLASS[status])}>
            {t(TAB_LABEL[status])}
          </span>
          {/* A band is words. The number behind it is never rendered. */}
          <span className={cn('rounded-full px-2 py-[2px] text-[10.5px] font-medium', BAND_CLASS[band])}>
            {t(BAND_LABEL[band])}
          </span>
          <span className="rounded-full bg-black/[0.05] px-2 py-[2px] text-[10.5px] font-medium text-faint">
            {candidate.userDecision}
          </span>
          {(needsUserDecision(candidate.resolutionStatus) || question) && (
            <span className="rounded-full bg-warn/[0.14] px-2 py-[2px] text-[10.5px] font-medium text-warn">
              {t('research.pendingReview')}
            </span>
          )}
          {saved && (
            <span className="rounded-full bg-ocean/10 px-2 py-[2px] text-[10.5px] font-medium text-ocean">
              {t('import.saved')}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
        <span className="text-ink-soft">
          {t('research.matchedTo')}:{' '}
          {matched ? (
            <span className="font-medium text-ink">{placeLabel(matched, locale)}</span>
          ) : (
            <span className="text-warn">{t('research.noMatch')}</span>
          )}
        </span>
        <span className="text-faint">
          {t('import.detail.resolution')}: {t(resolutionLabelKey(candidate.resolutionStatus))}
        </span>
        {candidate.matchMethod && <span className="text-faint">{t('import.detail.method')}: {candidate.matchMethod}</span>}
        {candidate.matchedPlaceId && <span className="truncate text-faint">{candidate.matchedPlaceId}</span>}
        {mentionCount > 0 && <span className="text-faint">{t('social.mentionCount', { count: mentionCount })}</span>}
      </div>

      <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
        <span className="text-faint">{t('import.detectedFrom')}: </span>
        {candidate.detectedFromText ? t('import.source.text') : ''}
        {candidate.detectedFromText && candidate.detectedFromImageIds.length > 0 ? ' · ' : ''}
        {candidate.detectedFromImageIds.length > 0
          ? t('import.source.images', {
              list: candidate.detectedFromImageIds
                .map((imageId) => imageIndexById.get(imageId) ?? imageId)
                .join(', '),
            })
          : ''}
        {!candidate.detectedFromText && candidate.detectedFromImageIds.length === 0 ? '—' : ''}
      </p>

      {candidate.detectedReason && (
        <DetailLine label={t('import.match.reason')} value={candidate.detectedReason} />
      )}
      {candidate.contextText && (
        <p className="mt-1 border-l-2 border-line pl-2 text-[11.5px] leading-relaxed text-muted">
          <span className="text-faint">{t('import.fromGuide')}: </span>
          {candidate.contextText}
        </p>
      )}
      <DetailList label={t('import.items')} values={candidate.extractedItems} />
      <DetailList label={t('import.themes')} values={candidate.contextThemes} />
      <DetailList label={t('social.themes')} values={candidate.positiveThemes} />
      <DetailList label={t('import.warnings')} values={candidate.warnings} />
      <DetailLine label={t('import.bestTime')} value={candidate.bestTimeMentioned} />

      {/* --- who attached which picture ---------------------------------- */}
      {(attached.length > 0 || detectedOnly.length > 0) && (
        <div className="mt-2">
          <p className="label-caps mb-1.5">{t('import.imagesForPlace')}</p>
          <ul className="flex flex-wrap gap-2">
            {attached.map((entry) => (
              <li
                key={`${entry.image.id}-${entry.source}`}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-paper p-1.5"
                data-testid={`research-candidate-image-${candidate.id}-${entry.image.id}`}
              >
                <ImageThumb
                  imageId={entry.image.id}
                  alt={entry.image.caption ?? t('import.imageLabel')}
                  className="h-10 w-10"
                />
                <span className="text-[10.5px] text-faint">
                  {t('import.imageLabel')} {entry.image.originalIndex}
                  <br />
                  {entry.source === 'user' ? t('import.source.user') : t('import.detectedFrom')}
                </span>
                <button
                  type="button"
                  className="btn-ghost btn-xs text-muted hover:text-danger"
                  aria-label={t('saved.remove')}
                  onClick={() => unassignImage(candidate.id, entry.image.id)}
                >
                  <IconClose size={11} />
                </button>
              </li>
            ))}
            {detectedOnly.map((imageId) => (
              <li
                key={imageId}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-line bg-paper p-1.5"
                data-testid={`research-candidate-detected-${candidate.id}-${imageId}`}
              >
                <ImageThumb imageId={imageId} alt={t('import.imageLabel')} className="h-10 w-10" />
                <span className="text-[10.5px] text-faint">
                  {t('import.detectedFrom')} {imageIndexById.get(imageId) ?? imageId}
                </span>
                <button
                  type="button"
                  className="btn-ghost btn-xs text-muted"
                  data-testid={`research-attach-here-${candidate.id}-${imageId}`}
                  onClick={() => assignImage(candidate.id, imageId, 'user')}
                >
                  <IconCheck size={11} />
                  {t('import.question.attachTo')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- external hits are OFFERED, never auto-accepted ---------------- */}
      {candidate.externalCandidates && candidate.externalCandidates.length > 0 && (
        <div className="mt-2 rounded-lg border border-line bg-paper p-2">
          <p className="label-caps mb-1">{t('import.external.title')}</p>
          <ul className="space-y-1.5">
            {candidate.externalCandidates.map((external: ExternalPlaceCandidate) => (
              <li
                key={external.providerPlaceId}
                className="flex flex-wrap items-center gap-2 text-[11.5px]"
                data-testid={`research-external-${candidate.id}-${external.providerPlaceId}`}
              >
                <span className="font-medium text-ink">{external.name}</span>
                {external.address && <span className="truncate text-muted">{external.address}</span>}
                {external.category && (
                  <span className="rounded-full border border-line px-1.5 py-[1px] text-[10.5px] text-muted">
                    {external.category}
                  </span>
                )}
                <span className="text-faint">{external.providerId}</span>
                <button
                  type="button"
                  className="btn-secondary btn-xs"
                  data-testid={`research-external-accept-${candidate.id}-${external.providerPlaceId}`}
                  onClick={() => onAcceptExternal(candidate.id, external.providerPlaceId)}
                >
                  <IconCheck size={12} />
                  {t('import.external.accept')}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{t('import.external.caveat')}</p>
        </div>
      )}

      {/* --- decisions ---------------------------------------------------- */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {(['save', 'ignore', 'pending'] as const).map((decision) => (
          <button
            key={decision}
            type="button"
            className={cn('btn-xs', candidate.userDecision === decision ? 'btn-primary' : 'btn-secondary')}
            data-testid={`research-decide-${decision}-${candidate.id}`}
            onClick={() => decideCandidate(candidate.id, decision)}
          >
            {decision === 'ignore' ? <IconClose size={12} /> : decision === 'save' ? <IconCheck size={12} /> : null}
            {t(DECISION_LABEL[decision])}
          </button>
        ))}

        <label className="flex items-center gap-1.5 text-[11.5px] text-muted">
          {t('import.match.search')}
          <select
            className="field h-7 w-auto max-w-[260px] py-0 text-[11.5px]"
            value={candidate.matchedPlaceId ?? ''}
            data-testid={`research-place-${candidate.id}`}
            onChange={(event) => {
              if (event.target.value) resolveCandidateToPlace(candidate.id, event.target.value);
            }}
          >
            <option value="">{t('research.noMatch')}</option>
            {placeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// One image-analysis record
// ---------------------------------------------------------------------------

function AnalysisRow({ analysis, imageIndex }: { analysis: ImageAnalysis; imageIndex?: number }) {
  const t = useT();
  return (
    <li className="panel p-3" data-testid={`research-analysis-${analysis.id}`}>
      <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
        <ImageThumb imageId={analysis.imageId} alt={t('import.imageLabel')} className="h-10 w-10" />
        <span className="font-semibold text-ink">
          {t('import.imageLabel')} {imageIndex ?? '—'}
        </span>
        <span className="text-faint">{analysis.imageId}</span>
        <span className="text-faint">{analysis.importId}</span>
        <span className="ml-auto text-faint">
          {analysis.analysisProvider} · {analysis.analysisVersion}
        </span>
      </div>
      <DetailList label={t('research.analysisTexts')} values={analysis.detectedTexts} />
      <DetailList label={t('research.analysisNames')} values={analysis.candidatePlaceNames} />
      <DetailList label={t('research.analysisScenes')} values={[...analysis.sceneHints, ...analysis.areaHints]} />
      <p className="mt-1 text-[11.5px] leading-relaxed text-faint">
        {t('import.detail.type')}:{' '}
        {analysis.candidateCategories.length > 0
          ? analysis.candidateCategories.map((category) => t(categoryKey(category))).join('、')
          : '—'}
      </p>
    </li>
  );
}

// ---------------------------------------------------------------------------

function DetailLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
      <span className="text-faint">{label}: </span>
      {value}
    </p>
  );
}

function DetailList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
      <span className="text-faint">{label}: </span>
      {values.join('、')}
    </p>
  );
}
