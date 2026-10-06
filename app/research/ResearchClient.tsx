'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { SocialGuideSource, SocialMention, SocialPlatform } from '@/lib/types';
import { getPlaces } from '@/lib/data';
import { useT, useLocale } from '@/lib/i18n/use-t';
import type { MessageKey } from '@/lib/i18n/messages';
import { PLATFORMS, detectPlatform, looksLikeUrl, platformMeta } from '@/lib/research/platforms';
import { SAMPLE_GUIDE_TEXT } from '@/lib/research/extract';
import { useResearchStore, hydrateResearchStore } from '@/lib/research/store';
import { recommendedForLabel } from '@/lib/data/place-taxonomy';
import { cn } from '@/lib/utils';
import { IconArrowRight, IconCheck, IconClose, IconPlus, IconTrash } from '@/components/ui/icons';

/**
 * The research inbox.
 *
 * An internal route, deliberately not part of the traveller's four tabs. Its job
 * is to make one decision at a time easy: here is a name as a guide wrote it,
 * here is the canonical place we think it is, yes or no.
 *
 * It is honest about what it cannot do. The panel says in words that Meridian
 * does not fetch these platforms, and asks for the text — because the
 * alternative would be a scraper that breaks the platforms' terms and breaks
 * again next month.
 */

type InboxTab = 'pending' | 'matched' | 'needs-review' | 'accepted' | 'ignored';

const TABS: { id: InboxTab; label: MessageKey }[] = [
  { id: 'pending', label: 'research.inbox' },
  { id: 'matched', label: 'research.matched' },
  { id: 'needs-review', label: 'research.needsReview' },
  { id: 'accepted', label: 'research.accepted' },
  { id: 'ignored', label: 'research.ignored' },
];

const STATUS_LABEL: Record<string, MessageKey> = {
  pending: 'research.status.pending',
  matched: 'research.status.matched',
  'needs-review': 'research.status.needs-review',
  accepted: 'research.status.accepted',
  dismissed: 'research.status.dismissed',
};

const TYPE_LABEL: Record<string, MessageKey> = {
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

function platformLabelKey(id: SocialPlatform): MessageKey {
  const key = `research.platform.${id}` as MessageKey;
  return key;
}

export default function ResearchPage() {
  const t = useT();
  const locale = useLocale();
  const hydrated = useResearchStore((s) => s.hydrated);
  const setHydrated = useResearchStore((s) => s.setHydrated);
  const sources = useResearchStore((s) => s.sources);
  const mentions = useResearchStore((s) => s.mentions);
  const addSource = useResearchStore((s) => s.addSource);
  const deleteSource = useResearchStore((s) => s.deleteSource);
  const extractSource = useResearchStore((s) => s.extractSource);

  const [tab, setTab] = useState<InboxTab>('pending');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform | 'auto'>('auto');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    hydrateResearchStore().finally(() => setHydrated(true));
  }, [setHydrated]);

  const detected = useMemo(() => detectPlatform(url), [url]);

  /*
   * Tab counts are MENTIONS, not sources.
   *
   * The first version counted unprocessed sources on 待处理 while filtering that
   * tab by mention status `pending` — a status extraction never assigns. The
   * default tab was therefore always empty, which is the worst possible place
   * for an off-by-one: the reviewer opens the inbox and sees nothing to do.
   */
  const counts = useMemo(() => {
    const by = (status: string) => mentions.filter((m) => m.status === status).length;
    return {
      pending: by('matched') + by('needs-review') + by('pending'),
      matched: by('matched'),
      'needs-review': by('needs-review') + by('pending'),
      accepted: by('accepted'),
      ignored: by('dismissed'),
    } as Record<InboxTab, number>;
  }, [mentions]);

  const visibleMentions = useMemo(() => {
    const map: Record<InboxTab, string[]> = {
      // 待处理 is the whole review queue: everything a human still has to decide.
      pending: ['matched', 'needs-review', 'pending'],
      matched: ['matched'],
      'needs-review': ['needs-review', 'pending'],
      accepted: ['accepted'],
      ignored: ['dismissed'],
    };
    const allowed = map[tab];
    return mentions
      .filter((m) => allowed.includes(m.status))
      .sort((a, b) => (b.matchConfidence ?? 0) - (a.matchConfidence ?? 0));
  }, [mentions, tab]);

  const sourceById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const placeById = useMemo(() => new Map(getPlaces('bali').map((p) => [p.id, p])), []);
  const placeOptions = useMemo(
    () =>
      getPlaces('bali')
        .map((p) => ({ id: p.id, label: locale === 'zh-CN' && p.nameZh ? `${p.nameZh} · ${p.name}` : p.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [locale],
  );

  const submit = () => {
    if (!url.trim() && !text.trim()) return;
    const source = addSource({
      url: url.trim(),
      platform: platform === 'auto' ? undefined : platform,
      userNotes: notes,
      rawText: text,
    });
    setUrl('');
    setText('');
    setNotes('');
    setPlatform('auto');
    setExpanded(source.id);
    if (text.trim()) extractSource(source.id);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1180px] px-5 py-8">
      <header className="mb-6">
        <Link href="/" className="btn-ghost btn-xs -ml-2 mb-3 text-muted">
          ← {t('app.back')}
        </Link>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">{t('research.title')}</h1>
        <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-soft">{t('research.subtitle')}</p>
        <p className="mt-2 text-[12px] text-faint">{t('research.internalNote')}</p>
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
                ? t('research.detectedPlatform', { platform: t(platformLabelKey(detected)) })
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
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(platformLabelKey(p.id))}
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

        <button
          type="button"
          className="btn-primary mt-3"
          data-testid="research-add"
          disabled={!url.trim() && !text.trim()}
          onClick={submit}
        >
          <IconPlus size={14} />
          {t('research.add')}
        </button>
      </section>

      {/* --- imported guides ------------------------------------------------ */}
      <section className="mb-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">
          {t('research.sources')}{' '}
          <span className="ml-1 text-[12px] font-normal tabular-nums text-faint">
            {t('research.sourceCount', { count: sources.length })}
          </span>
        </h2>

        {!hydrated ? (
          <p className="text-[12.5px] text-muted">{t('app.loading')}</p>
        ) : sources.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-[13px] font-semibold text-ink">{t('research.noSources')}</p>
            <p className="mx-auto mt-1.5 max-w-[46ch] text-[12px] leading-relaxed text-muted">
              {t('research.noSourcesHint')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-source-list">
            {sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                mentionCount={mentions.filter((m) => m.sourceId === source.id).length}
                open={expanded === source.id}
                onToggle={() => setExpanded(expanded === source.id ? null : source.id)}
                onExtract={() => extractSource(source.id)}
                onDelete={() => deleteSource(source.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* --- review queue --------------------------------------------------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-1.5" data-testid="research-tabs">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              data-testid={`research-tab-${entry.id}`}
              onClick={() => setTab(entry.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors',
                tab === entry.id
                  ? 'border-accent/40 bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              )}
            >
              {t(entry.label)}
              <span className="ml-1.5 tabular-nums text-faint">{counts[entry.id]}</span>
            </button>
          ))}
        </div>

        {visibleMentions.length === 0 ? (
          <div className="panel px-4 py-8 text-center">
            <p className="text-[13px] text-muted">{t('empty.nothingHere')}</p>
          </div>
        ) : (
          <ul className="space-y-2" data-testid="research-mention-list">
            {visibleMentions.map((mention) => (
              <MentionRow
                key={mention.id}
                mention={mention}
                source={sourceById.get(mention.sourceId)}
                matchedName={mention.matchedPlaceId ? placeById.get(mention.matchedPlaceId)?.name : undefined}
                matchedNameZh={mention.matchedPlaceId ? placeById.get(mention.matchedPlaceId)?.nameZh : undefined}
                placeOptions={placeOptions}
              />
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
  source,
  mentionCount,
  open,
  onToggle,
  onExtract,
  onDelete,
}: {
  source: SocialGuideSource;
  mentionCount: number;
  open: boolean;
  onToggle: () => void;
  onExtract: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <li className="panel overflow-hidden" data-testid={`research-source-${source.id}`}>
      <div className="flex items-start gap-3 p-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggle}>
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line bg-paper px-2 py-[1px] text-[10.5px] font-medium text-ink-soft">
              {t(platformLabelKey(source.platform))}
            </span>
            <span className="text-[12.5px] font-semibold text-ink">{source.title ?? source.url ?? '—'}</span>
          </span>
          <span className="mt-1 block truncate text-[11.5px] text-muted">
            {source.url ?? t(platformLabelKey('manual'))}
          </span>
          <span className="mt-1 block text-[11px] text-faint">
            {t('research.importedAt', { date: source.importedAt.slice(0, 10) })} ·{' '}
            {t('research.mentionCount', { count: mentionCount })}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="btn-secondary btn-xs" data-testid={`research-extract-${source.id}`} onClick={onExtract}>
            {mentionCount > 0 ? t('research.reExtract') : t('research.extract')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted hover:text-danger"
            aria-label={t('research.deleteSource')}
            onClick={onDelete}
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {open && source.rawText && (
        <div className="border-t border-line bg-paper px-3 py-2.5">
          {source.userNotes && <p className="mb-2 text-[12px] text-ink-soft">{source.userNotes}</p>}
          <p className="max-h-52 overflow-y-auto scroll-area whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted">
            {source.rawText.slice(0, 2000)}
          </p>
        </div>
      )}
    </li>
  );
}

function MentionRow({
  mention,
  source,
  matchedName,
  matchedNameZh,
  placeOptions,
}: {
  mention: SocialMention;
  source?: SocialGuideSource;
  matchedName?: string;
  matchedNameZh?: string;
  placeOptions: { id: string; label: string }[];
}) {
  const t = useT();
  const locale = useLocale();
  const setMentionStatus = useResearchStore((s) => s.setMentionStatus);
  const setMentionMatch = useResearchStore((s) => s.setMentionMatch);
  const [choosing, setChoosing] = useState(false);

  const decided = mention.status === 'accepted' || mention.status === 'dismissed';

  return (
    <li className="panel p-3" data-testid={`research-mention-${mention.normalizedPlaceName}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-snug text-ink">{mention.rawPlaceName}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
            <span className="rounded-full border border-line px-1.5 py-[1px]">
              {t(TYPE_LABEL[mention.recommendationType] ?? 'research.type.unknown')}
            </span>
            {source && <span>{t(platformLabelKey(source.platform))}</span>}
            {mention.areaHint && <span>{mention.areaHint}</span>}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-[2px] text-[10.5px] font-medium',
            mention.status === 'accepted'
              ? 'bg-accent-soft text-accent'
              : mention.status === 'dismissed'
                ? 'bg-black/[0.05] text-faint'
                : mention.matchedPlaceId
                  ? 'bg-ocean/10 text-ocean'
                  : 'bg-warn/[0.12] text-warn',
          )}
        >
          {t(STATUS_LABEL[mention.status] ?? 'research.status.pending')}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
        {matchedName ? (
          <span className="text-ink-soft">
            {t('research.matchedTo')}:{' '}
            <span className="font-medium text-ink">
              {locale === 'zh-CN' && matchedNameZh ? `${matchedNameZh} · ${matchedName}` : matchedName}
            </span>
          </span>
        ) : (
          <span className="text-warn">{t('research.pendingReview')}</span>
        )}
        {mention.matchConfidence != null && (
          <span className="tabular-nums text-faint">
            {t('research.matchConfidence', { value: Math.round(mention.matchConfidence * 100) })}
          </span>
        )}
      </div>

      {mention.recommendedItems.length > 0 && (
        <p className="mt-1.5 text-[11.5px] text-muted">
          {t('social.frequentlyMentioned')}: {mention.recommendedItems.join('、')}
        </p>
      )}
      {mention.extractedNotes && <p className="mt-1 text-[11.5px] text-faint">{mention.extractedNotes}</p>}

      {!decided && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="btn-primary btn-xs"
            data-testid={`research-accept-${mention.normalizedPlaceName}`}
            onClick={() => setMentionStatus(mention.id, 'accepted')}
          >
            <IconCheck size={13} />
            {t('research.accept')}
          </button>
          <button
            type="button"
            className="btn-secondary btn-xs"
            data-testid={`research-dismiss-${mention.normalizedPlaceName}`}
            onClick={() => setMentionStatus(mention.id, 'dismissed')}
          >
            {t('research.dismiss')}
          </button>
          <button
            type="button"
            className="btn-ghost btn-xs text-muted"
            data-testid={`research-rematch-${mention.normalizedPlaceName}`}
            onClick={() => setChoosing((v) => !v)}
          >
            {t('research.matchedTo')} <IconArrowRight size={12} className="rotate-90" />
          </button>

          {choosing && (
            <select
              className="field h-7 w-auto py-0 text-[11.5px]"
              defaultValue={mention.matchedPlaceId ?? ''}
              onChange={(e) => {
                setMentionMatch(mention.id, e.target.value || null);
                setChoosing(false);
              }}
            >
              <option value="">{t('research.noMatch')}</option>
              {placeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {decided && (
        <button
          type="button"
          className="btn-ghost btn-xs mt-2 text-muted"
          onClick={() => setMentionStatus(mention.id, mention.matchedPlaceId ? 'matched' : 'needs-review')}
        >
          <IconClose size={12} />
          {t('app.edit')}
        </button>
      )}
      <span className="sr-only">{recommendedForLabel('first-time', locale)}</span>
    </li>
  );
}
