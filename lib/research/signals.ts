import type { PlaceCandidate, SocialSignals, SocialPlatform, XiaohongshuImport } from '../types';

/**
 * Aggregating accepted mentions into the signal a traveller sees.
 *
 * TWO RULES, BOTH ABOUT NOT LYING
 * -------------------------------
 * 1. **Only accepted mentions count.** An extracted mention is a machine's guess
 *    about a name in a paste. Until a human has said "yes, that is La Brisa",
 *    counting it would let the importer inflate a venue's own numbers.
 * 2. **No popularity claims.** The product says "在 N 份已收录攻略中被提及" —
 *    a statement about *our* corpus, which is verifiable — and never "最热门"
 *    or "98% 推荐", which would require a methodology we do not have.
 *
 * `frequentlyMentioned` is a genuine frequency count across the corpus, which is
 * why the bar is two: one guide mentioning "班尼迪克蛋" is an anecdote, two is a
 * pattern worth surfacing.
 */

export interface SignalSources {
  candidates: PlaceCandidate[];
  sources: XiaohongshuImport[];
}

const MIN_FREQUENCY = 2;

/** Chinese labels for the recurring themes we can actually derive. */
const THEME_LABELS: Record<string, string> = {
  sunset: '日落',
  queue: '需要排队',
  'worth-it': '值得专程去',
  'good-value': '性价比高',
  pricey: '偏贵',
  busy: '人多',
  'good-coffee': '咖啡好',
  brunch: '适合早午餐',
  'work-friendly': '适合办公',
  'photo-spot': '适合拍照',
};

const THEME_PATTERNS: Array<{ id: string; test: RegExp }> = [
  { id: 'sunset', test: /日落|sunset/i },
  { id: 'queue', test: /排队|等位|queue|wait/i },
  { id: 'worth-it', test: /值得|必去|必吃|worth|must/i },
  { id: 'good-value', test: /性价比|便宜|实惠|cheap|value/i },
  { id: 'pricey', test: /偏贵|有点贵|价格高|pricey|expensive/i },
  { id: 'busy', test: /人多|很多|拥挤|busy|crowd/i },
  { id: 'good-coffee', test: /咖啡好|手冲|latte|coffee/i },
  { id: 'brunch', test: /早午餐|brunch/i },
  { id: 'work-friendly', test: /办公|工作|wifi|work/i },
  { id: 'photo-spot', test: /拍照|出片|photo|instagram/i },
];

function themesOf(notes: string[]): string[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    for (const rule of THEME_PATTERNS) {
      if (rule.test.test(note)) counts.set(rule.id, (counts.get(rule.id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => THEME_LABELS[id] ?? id);
}

function itemsOf(candidates: PlaceCandidate[]): string[] {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    for (const item of candidate.extractedItems) {
      const key = item.trim();
      if (key.length === 0) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_FREQUENCY)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item)
    .slice(0, 6);
}

/**
 * Builds the signal for every place that has at least one accepted mention.
 *
 * A place with no accepted mentions gets no entry — and its card renders nothing
 * rather than an empty "攻略参考" block claiming zero.
 */
export function aggregateSignals({ candidates, sources }: SignalSources): Map<string, SocialSignals> {
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const byPlace = new Map<string, PlaceCandidate[]>();

  for (const candidate of candidates) {
    /*
     * Only what the traveller ACCEPTED counts, and only against an import that
     * still exists. An extracted mention is a machine's guess about a name in a
     * paste; counting it before a human confirmed it would let the importer
     * inflate a venue's own numbers.
     */
    if (candidate.userDecision !== 'save') continue;
    if (!candidate.matchedPlaceId) continue;
    if (!sourceById.has(candidate.importId)) continue;
    const list = byPlace.get(candidate.matchedPlaceId) ?? [];
    list.push(candidate);
    byPlace.set(candidate.matchedPlaceId, list);
  }

  const out = new Map<string, SocialSignals>();
  for (const [placeId, list] of byPlace) {
    /*
     * Count GUIDES, not mentions. One guide that names a venue three times is
     * still one guide, and the UI says "in N guides".
     */
    const sourceIds = [...new Set(list.map((m) => m.importId))];
    const platforms = [
      ...new Set(
        sourceIds
          .map((id) => sourceById.get(id)?.platform)
          .filter((p): p is SocialPlatform => Boolean(p)),
      ),
    ];
    const dates = sourceIds.map((id) => sourceById.get(id)?.createdAt).filter(Boolean) as string[];

    out.set(placeId, {
      mentionCount: sourceIds.length,
      platforms,
      themes: themesOf(
        list.flatMap((m) => [m.rawName, ...m.contextThemes, ...m.positiveThemes, ...m.warnings]),
      ),
      frequentlyMentioned: itemsOf(list),
      lastReviewedAt: dates.sort().at(-1),
    });
  }
  return out;
}

/** Candidates that still need a human decision, in the order they should be worked. */
export function reviewQueue(candidates: PlaceCandidate[]): PlaceCandidate[] {
  const rank: Record<string, number> = { matched: 0, possible_match: 1, unmatched: 2 };
  return candidates
    .filter((m) => m.userDecision === 'pending')
    .sort(
      (a, b) =>
        (rank[a.verificationStatus] ?? 9) - (rank[b.verificationStatus] ?? 9) ||
        (b.matchConfidence ?? 0) - (a.matchConfidence ?? 0),
    );
}
