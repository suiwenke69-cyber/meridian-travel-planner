'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  Area,
  MatchBand,
  MentionStatus,
  Place,
  RecommendationType,
  SocialImport,
  SocialPlaceMention,
  SocialPlatform,
  SourceAccessStatus,
} from '@/lib/types';
import { getAreas, getPlaces } from '@/lib/data';
import { useLocale, useT, type Translator } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { PLATFORMS, detectPlatform, looksLikeUrl, platformMeta } from '@/lib/research/platforms';
import { SAMPLE_GUIDE_TEXT } from '@/lib/research/extract';
import { MAX_TEXT_LENGTH, type LimitViolation } from '@/lib/research/limits';
import { bandFor, hydrateResearchStore, useResearchStore, useSavedPlaces } from '@/lib/research/store';
import { cn } from '@/lib/utils';
import { IconCheck, IconClose, IconPlus, IconTrash } from '@/components/ui/icons';

/**
 * The research inbox — an INTERNAL admin/inspector view.
 *
 * Deliberately not one of the traveller's tabs. It reads the same store the
 * traveller's own import flow writes, and its job is to make one decision at a
 * time easy: here is a name as a guide wrote it, here is the canonical place we
 * think it is, yes or no.
 *
 * It is honest about what it cannot do. The panel says in words that Meridian
 * does not fetch these platforms, and asks for the text — because the
 * alternative would be a scraper that breaks the platforms' terms and breaks
 * again next month.
 *
 * HONESTY RULE: a confidence score and a band are not the same claim. The
 * extractor keeps the score for auditing; this view renders `bandFor()` as
 * words and never prints the number, a percentage or a rating.
 */

const DEFAULT_DESTINATION_ID = 'bali';

type TabId = 'pending' | MentionStatus;

const TAB_ORDER: TabId[] = ['pending', 'matched', 'possible_match', 'unmatched', 'rejected'];

const TAB_LABEL: Record<TabId, MessageKey> = {
  pending: 'research.status.pending',
  matched: 'import.match.matched',
  possible_match: 'import.match.possible',
  unmatched: 'import.match.unmatched',
  rejected: 'import.match.rejected',
};

const TYPE_LABEL: Record<RecommendationType, MessageKey> = {
  restaurant: 'research.type.restaurant',
  cafe: 'research.type.cafe',
  beachclub: 'research.type.beachclub',
  bar: 'research.type.bar',
  beach: 'research.type.beach',
  nature: 'research.type.nature',
  culture: 'research.type.culture',
  activity: 'research.type.activity',
  hotel: 'research.type.hotel',
  shopping: 'research.type.shopping',
  wellness: 'research.type.wellness',
  area: 'research.type.area',
  unknown: 'research.type.unknown',
};

const PLATFORM_LABEL: Record<SocialPlatform, MessageKey> = {
  xiaohongshu: 'research.platform.xiaohongshu',
  douyin: 'research.platform.douyin',
  tiktok: 'research.platform.tiktok',
  instagram: 'research.platform.instagram',
  youtube: 'research.platform.youtube',
  bilibili: 'research.platform.bilibili',
  blog: 'research.platform.blog',
  manual: 'research.platform.manual',
  other: 'research.platform.other',
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

function importErrorMessage(code: string, t: Translator): string {
  const key = IMPORT_ERROR_LABEL[code];
  return t(key ?? 'import.error.generic');
}

function violationMessage(violation: LimitViolation, t: Translator): string {
  // The catalogue's {limit} is the configured ceiling, not the pasted length.
  if (violation.code === 'text_too_long') return t('import.error.textTooLong', { limit: MAX_TEXT_LENGTH });
  return t(violation.messageKey);
}

function extractionResultMessage(places: number, matched: number, t: Translator): string {
  return `${t('import.foundCount', { count: places })} · ${t('import.foundMatched', { count: matched })}`;
}

function sourceAccessLabel(status: SourceAccessStatus, t: Translator): string {
  const key = SOURCE_ACCESS_LABEL[status];
  return key ? t(key) : status;
}

function placeLabel(place: Place, locale: string): string {
  return locale === 'zh-CN' && place.nameZh ? `${place.nameZh} · ${place.name}` : place.name;
}

export default function ResearchClient() {
  const t = useT();
  const locale = useLocale();

  const hydrated = useResearchStore((s) => s.hydrated);
  const setHydrated = useResearchStore((s) => s.setHydrated);
  const imports = useResearchStore((s) => s.imports);
  const mentions = useResearchStore((s) => s.mentions);
  const submissions = useResearchStore((s) => s.submissions);
  const startImport = useResearchStore((s) => s.startImport);
  const processImport = useResearchStore((s) => s.processImport);
  const deleteImport = useResearchStore((s) => s.deleteImport);
  const decideMention = useResearchStore((s) => s.decideMention);
  const resolveMentionToPlace = useResearchStore((s) => s.resolveMentionToPlace);
  const setSubmissionStatus = useResearchStore((s) => s.setSubmissionStatus);
  const unsavePlace = useResearchStore((s) => s.unsavePlace);
  const savedPlaces = useSavedPlaces();

  const [tab, setTab] = useState<TabId>('pending');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform | 'auto'>('auto');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PanelResult | null>(null);

  useEffect(() => {
    hydrateResearchStore().finally(() => setHydrated(true));
  }, [setHydrated]);

  const detected = useMemo(() => detectPlatform(url), [url]);

  const importById = useMemo(() => new Map(imports.map((record) => [record.id, record])), [imports]);

  const mentionCountByImport = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mention of mentions) counts.set(mention.importId, (counts.get(mention.importId) ?? 0) + 1);
    return counts;
  }, [mentions]);

  /*
   * Place and area lookups are built from every destination the store actually
   * references, plus Bali — the default the extractor falls back to. A mention
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

  const { placeById, optionsByDestination, areaNameById } = useMemo(() => {
    const places = new Map<string, Place>();
    const options = new Map<string, { id: string; label: string }[]>();
    const areas = new Map<string, Area>();
    for (const destinationId of destinationIds) {
      const destinationPlaces = getPlaces(destinationId);
      for (const place of destinationPlaces) places.set(place.id, place);
      options.set(
        destinationId,
        destinationPlaces
          .map((place) => ({ id: place.id, label: placeLabel(place, locale) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
      // areaHint is an AREA ID, so an admin needs the name it stands for.
      for (const area of getAreas(destinationId)) areas.set(`${destinationId}:${area.id}`, area);
    }
    return { placeById: places, optionsByDestination: options, areaNameById: areas };
  }, [destinationIds, locale]);

  const counts = useMemo(() => {
    const byStatus = (status: MentionStatus) =>
      mentions.filter((mention) => mention.verificationStatus === status).length;
    return {
      pending: mentions.filter((mention) => mention.userDecision === 'pending').length,
      matched: byStatus('matched'),
      possible_match: byStatus('possible_match'),
      unmatched: byStatus('unmatched'),
      rejected: byStatus('rejected'),
    } as Record<TabId, number>;
  }, [mentions]);

  const visibleMentions = useMemo(() => {
    const filtered = mentions.filter((mention) =>
      tab === 'pending' ? mention.userDecision === 'pending' : mention.verificationStatus === tab,
    );
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [mentions, tab]);

  const submit = async () => {
    const trimmedUrl = url.trim();
    const trimmedText = text.trim();
    if (!trimmedUrl && !trimmedText) return;

    setResult(null);
    setBusy(true);

    const outcome = startImport({
      url: trimmedUrl || undefined,
      text: trimmedText || undefined,
      platform: platform === 'auto' ? undefined : platform,
      destinationId: DEFAULT_DESTINATION_ID,
      userNotes: notes.trim() || undefined,
    });

    if (outcome.violation) {
      setResult({ kind: 'error', message: violationMessage(outcome.violation, t) });
      setBusy(false);
      return;
    }

    const record = outcome.import;
    if (!record) {
      setResult({ kind: 'error', message: t('import.error.generic') });
      setBusy(false);
      return;
    }

    setUrl('');
    setText('');
    setNotes('');
    setPlatform('auto');
    setExpanded(record.id);

    const processed = await processImport(record.id);
    if ('error' in processed) {
      setResult({ kind: 'error', message: importErrorMessage(processed.error, t) });
    } else {
      setResult({
        kind: 'done',
        message: extractionResultMessage(processed.places, processed.matched, t),
      });
    }
    setBusy(false);
  };

  const canSubmit = url.trim().length > 0 || text.trim().length > 0;

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
      </header>

      {/* --- add a guide ---------------------------------------------------- */}
      <section className="panel mb-6 p-4">
        <h2 className="text-[15px] font-semibold text-ink">{t('research.addSource')}</h2>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <label className="label-caps mb-1 block" htmlFor="research-url">
              {t('research.url')}
            </label>
            <input
              id="research-url"
              data-testid="research-url"
              className="field"
              placeholder={t('research.urlPlaceholder')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="mt-1.5 text-[11.5px] text-faint">
              {detected
                ? t('research.detectedPlatform', { platform: t(PLATFORM_LABEL[detected]) })
                : url.trim().length > 0 && !looksLikeUrl(url)
                  ? t('research.urlPlaceholder')
                  : ''}
            </p>
          </div>

          <div>
            <label className="label-caps mb-1 block" htmlFor="research-platform">
              {t('research.platform')}
            </label>
            <select
              id="research-platform"
              data-testid="research-platform"
              className="field"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialPlatform | 'auto')}
            >
              <option value="auto">{t('app.all')}</option>
              {PLATFORMS.map((entry) => (
                <option key={entry.id} value={entry.id} title={entry.hint}>
                  {t(PLATFORM_LABEL[entry.id])}
                </option>
              ))}
            </select>
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
            onChange={(e) => setText(e.target.value)}
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
            onChange={(e) => setNotes(e.target.value)}
          />
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

      {/* --- imported guides ------------------------------------------------ */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">
          {t('research.sources')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">
            {t('research.sourceCount', { count: imports.length })}
          </span>
        </h2>

        {!hydrated ? (
          <p className="text-[12.5px] text-muted">{t('app.loading')}</p>
        ) : imports.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] font-semibold text-ink">{t('research.noSources')}</p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[12px] leading-relaxed text-muted">
              {t('research.noSourcesHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-source-list">
            {imports.map((record) => (
              <SourceRow
                key={record.id}
                record={record}
                mentionCount={mentionCountByImport.get(record.id) ?? 0}
                mentions={mentions.filter((mention) => mention.importId === record.id)}
                placeById={placeById}
                open={expanded === record.id}
                onToggle={() => setExpanded(expanded === record.id ? null : record.id)}
                onReprocess={() => processImport(record.id)}
                onDelete={() => deleteImport(record.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* --- review queue --------------------------------------------------- */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">
          {t('research.reviewQueue', { count: counts.pending })}
        </h2>

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

        {visibleMentions.length === 0 ? (
          <div className="panel px-4 py-8 text-center">
            <p className="text-[13px] text-muted">{t('empty.nothingHere')}</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-mention-list">
            {visibleMentions.map((mention) => {
              const record = importById.get(mention.importId);
              const destinationId = record?.destinationId ?? DEFAULT_DESTINATION_ID;
              return (
                <MentionCard
                  key={mention.id}
                  mention={mention}
                  record={record}
                  destinationId={destinationId}
                  matchedPlace={mention.matchedPlaceId ? placeById.get(mention.matchedPlaceId) : undefined}
                  areaName={
                    mention.areaHint
                      ? (areaNameById.get(`${destinationId}:${mention.areaHint}`)?.name ?? mention.areaHint)
                      : undefined
                  }
                  placeOptions={optionsByDestination.get(destinationId) ?? []}
                />
              );
            })}
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
              const place = placeById.get(saved.placeId);
              return (
                <li key={saved.id} className="panel flex items-start gap-3 p-3" data-testid={`research-saved-${saved.placeId}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">
                      {place ? placeLabel(place, locale) : saved.placeId}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-faint">
                      {saved.placeId} · {saved.destinationId} · {saved.savedAt.slice(0, 10)}
                      {saved.sourceImportId ? ` · ${saved.sourceImportId}` : ''}
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
                        {t(TYPE_LABEL[submission.recommendationType])}
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
                    {submission.status}
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
      </footer>
    </main>
  );
}

// ---------------------------------------------------------------------------

function SourceRow({
  record,
  mentionCount,
  mentions,
  placeById,
  open,
  onToggle,
  onReprocess,
  onDelete,
}: {
  record: SocialImport;
  mentionCount: number;
  mentions: SocialPlaceMention[];
  placeById: Map<string, Place>;
  open: boolean;
  onToggle: () => void;
  onReprocess: () => Promise<{ places: number; matched: number } | { error: string }>;
  onDelete: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setMessage(null);
    const processed = await onReprocess();
    setMessage(
      'error' in processed
        ? importErrorMessage(processed.error, t)
        : extractionResultMessage(processed.places, processed.matched, t),
    );
    setBusy(false);
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
              {record.title ?? record.sourceUrl ?? t('research.pastedText')}
            </span>
          </span>
          {record.sourceUrl && <span className="mt-1 block truncate text-[11.5px] text-muted">{record.sourceUrl}</span>}
          <span className="mt-1 block text-[11px] text-faint">
            {t('research.importedAt', { date: record.createdAt.slice(0, 10) })} ·{' '}
            {t('research.mentionCount', { count: mentionCount })} · {record.status} ·{' '}
            {sourceAccessLabel(record.sourceAccessStatus, t)}
          </span>
          {record.userNotes && <span className="mt-1 block text-[11.5px] text-muted">{record.userNotes}</span>}
          {record.failureReason && (
            <span className="mt-1 block text-[11.5px] text-danger">{record.failureReason}</span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1">
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
            {busy ? t('research.processing') : mentionCount > 0 ? t('research.reExtract') : t('research.extract')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted hover:text-danger"
            aria-label={t('research.deleteSource')}
            data-testid={`research-delete-${record.id}`}
            onClick={onDelete}
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {message && (
        <p className="border-t border-line bg-paper px-3 py-2 text-[11.5px] text-ink-soft">{message}</p>
      )}

      {open && (
        <div className="border-t border-line bg-paper px-3 py-2.5">
          {mentions.length === 0 ? (
            <p className="text-[11.5px] text-muted">{t('research.noMentions')}</p>
          ) : (
            <ul className="space-y-1.5">
              {mentions.map((mention) => {
                const band = bandFor(mention.matchConfidence);
                const matched = mention.matchedPlaceId ? placeById.get(mention.matchedPlaceId) : undefined;
                return (
                  <li
                    key={mention.id}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11.5px]"
                    data-testid={`research-source-mention-${mention.id}`}
                  >
                    <span className="font-medium text-ink">{mention.rawPlaceName}</span>
                    <span className={cn('rounded-full px-1.5 py-[1px] text-[10.5px] font-medium', STATUS_CLASS[mention.verificationStatus])}>
                      {t(TAB_LABEL[mention.verificationStatus])}
                    </span>
                    <span className={cn('rounded-full px-1.5 py-[1px] text-[10.5px] font-medium', BAND_CLASS[band])}>
                      {t(BAND_LABEL[band])}
                    </span>
                    <span className="text-muted">
                      {matched ? placeLabel(matched, locale) : t('research.noMatch')}
                    </span>
                    <span className="text-faint">{mention.userDecision}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {record.userProvidedText && (
            <p className="mt-2 max-h-52 overflow-y-auto scroll-area whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted">
              {record.userProvidedText.slice(0, 2000)}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------

/** Wraps the name as the guide wrote it inside the sentence it appeared in. */
function Highlighted({ text, needle }: { text: string; needle: string }) {
  const index = needle.trim().length > 0 ? text.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[3px] bg-warn/[0.16] px-0.5 text-ink">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

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

function MentionCard({
  mention,
  record,
  destinationId,
  matchedPlace,
  areaName,
  placeOptions,
}: {
  mention: SocialPlaceMention;
  record?: SocialImport;
  destinationId: string;
  matchedPlace?: Place;
  areaName?: string;
  placeOptions: { id: string; label: string }[];
}) {
  const t = useT();
  const locale = useLocale();
  const decideMention = useResearchStore((s) => s.decideMention);
  const resolveMentionToPlace = useResearchStore((s) => s.resolveMentionToPlace);

  // The band is the interface's word for the score; the score itself stays in the data.
  const band = bandFor(mention.matchConfidence);
  const status = mention.verificationStatus;

  return (
    <li className="panel p-3" data-testid={`research-mention-${mention.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-snug text-ink">{mention.rawPlaceName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
            <span className="rounded-full border border-line px-1.5 py-[1px]">
              {t('label.category')}: {t(TYPE_LABEL[mention.categoryHint ?? 'unknown'])}
            </span>
            {record && (
              <span title={platformMeta(record.platform).hint}>{t(PLATFORM_LABEL[record.platform])}</span>
            )}
            {areaName && <span>{areaName}</span>}
            <span className="tabular-nums text-faint">{mention.createdAt.slice(0, 10)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <span className={cn('rounded-full px-2 py-[2px] text-[10.5px] font-medium', STATUS_CLASS[status])}>
            {t(TAB_LABEL[status])}
          </span>
          <span className={cn('rounded-full px-2 py-[2px] text-[10.5px] font-medium', BAND_CLASS[band])}>
            {t(BAND_LABEL[band])}
          </span>
        </div>
      </div>

      {mention.rawText && (
        <p className="mt-2 border-l-2 border-line pl-2 text-[11.5px] leading-relaxed text-muted">
          <span className="text-faint">{t('import.fromGuide')}: </span>
          <Highlighted text={mention.rawText} needle={mention.rawPlaceName} />
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
        <span className="text-ink-soft">
          {t('research.matchedTo')}:{' '}
          {matchedPlace ? (
            <span className="font-medium text-ink">{placeLabel(matchedPlace, locale)}</span>
          ) : (
            <span className="text-warn">{t('research.pendingReview')}</span>
          )}
        </span>
        {mention.matchMethod && <span className="text-faint">{mention.matchMethod}</span>}
        <span className="text-faint">{destinationId}</span>
        <span className="text-faint">{mention.userDecision}</span>
      </div>

      <DetailLine label={t('import.match.reason')} value={mention.extractedReason} />
      <DetailList label={t('import.items')} values={mention.extractedItems} />
      <DetailList label={t('import.themes')} values={mention.contextThemes} />
      <DetailList label={t('social.themes')} values={mention.positiveThemes} />
      <DetailList label={t('import.warnings')} values={mention.warnings} />
      <DetailLine label={t('import.bestTime')} value={mention.bestTimeMentioned} />

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary btn-xs"
          data-testid={`research-confirm-${mention.id}`}
          disabled={!mention.matchedPlaceId}
          onClick={() => {
            if (mention.matchedPlaceId) resolveMentionToPlace(mention.id, mention.matchedPlaceId);
          }}
        >
          <IconCheck size={13} />
          {t('import.match.confirm')}
        </button>
        <button
          type="button"
          className="btn-primary btn-xs"
          data-testid={`research-save-${mention.id}`}
          onClick={() => decideMention(mention.id, 'save')}
        >
          {t('app.save')}
        </button>
        <button
          type="button"
          className="btn-secondary btn-xs"
          data-testid={`research-ignore-${mention.id}`}
          onClick={() => decideMention(mention.id, 'ignore')}
        >
          <IconClose size={12} />
          {t('import.match.ignore')}
        </button>

        <label className="flex items-center gap-1.5 text-[11.5px] text-muted">
          {t('import.match.search')}
          <select
            className="field h-7 w-auto max-w-[260px] py-0 text-[11.5px]"
            value={mention.matchedPlaceId ?? ''}
            data-testid={`research-place-${mention.id}`}
            onChange={(e) => {
              if (e.target.value) resolveMentionToPlace(mention.id, e.target.value);
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
