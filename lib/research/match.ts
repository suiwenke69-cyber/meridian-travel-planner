import type { RecommendationType } from '../types';
import { nameSimilarity, normalizePlaceName } from './normalize';

/**
 * Matching a name written in a guide to a canonical Meridian place.
 *
 * The rule that matters: **a weak match is not a match.** If the score is under
 * the floor the mention is marked 需要确认 and a human decides. A wrong match is
 * worse than no match, because a wrong match silently writes a real place's name
 * onto the wrong venue and then inflates its mention count.
 */

export interface MatchTarget {
  id: string;
  name: string;
  nameZh?: string;
  /** Other spellings that genuinely refer to this place. */
  aliases?: string[];
  areaId?: string;
  /** Discovery category ids, used as a weak compatibility signal. */
  discovery?: string[];
  category?: string;
}

export interface MatchResult {
  placeId: string | null;
  method: 'exact' | 'alias' | 'fuzzy' | null;
  /** 0–1. */
  confidence: number;
  /** The next best candidate, so the UI can offer "did you mean". */
  runnerUp?: { placeId: string; confidence: number };
}

/**
 * Below this, the mention is 需要确认 rather than matched.
 *
 * 0.55 was chosen against the actual failure mode: "Old Man's" and "Old Man"
 * score ~0.9, while "La Brisa" and "La Favela" score ~0.55 — close enough that a
 * lower floor started pairing them. At 0.55 the pair sits on the boundary and
 * is deliberately pushed to human review.
 */
export const MATCH_CONFIDENCE_FLOOR = 0.55;

const TYPE_COMPATIBILITY: Partial<Record<RecommendationType, string[]>> = {
  restaurant: ['food'],
  cafe: ['coffee', 'food'],
  beachclub: ['beachclub', 'nightlife'],
  bar: ['nightlife'],
  beach: ['beach'],
  nature: ['nature'],
  culture: ['culture'],
  wellness: ['wellness'],
  shopping: ['shopping'],
  activity: ['water', 'beach', 'nature', 'culture'],
};

function keysOf(target: MatchTarget): { key: string; value: string; method: 'exact' | 'alias' }[] {
  const keys: { key: string; value: string; method: 'exact' | 'alias' }[] = [];
  const push = (value: string | undefined, method: 'exact' | 'alias') => {
    if (!value) return;
    const key = normalizePlaceName(value);
    // The ORIGINAL string is carried alongside the key: fuzzy scoring works on
    // tokens, and a normalised key has already had its spaces removed.
    if (key.length > 0) keys.push({ key, value, method });
  };
  push(target.name, 'exact');
  // A Chinese name is a different spelling of the same place, not a fuzzy guess.
  push(target.nameZh, 'alias');
  for (const alias of target.aliases ?? []) push(alias, 'alias');
  return keys;
}

export function scoreMatch(
  rawName: string,
  target: MatchTarget,
  context: { areaHint?: string; recommendationType?: RecommendationType } = {},
): { confidence: number; method: 'exact' | 'alias' | 'fuzzy' } {
  const candidateKey = normalizePlaceName(rawName);
  if (candidateKey.length === 0) return { confidence: 0, method: 'fuzzy' };

  let best = 0;
  let method: 'exact' | 'alias' | 'fuzzy' = 'fuzzy';

  for (const { key, value, method: keyMethod } of keysOf(target)) {
    if (key === candidateKey) {
      const score = keyMethod === 'exact' ? 1 : 0.96;
      if (score > best) {
        best = score;
        method = keyMethod;
      }
      continue;
    }
    const similarity = nameSimilarity(rawName, value);
    if (similarity > best) {
      best = similarity;
      method = 'fuzzy';
    }
  }

  if (best === 0) return { confidence: 0, method: 'fuzzy' };
  if (method !== 'fuzzy') return { confidence: best, method };

  /*
   * Weak contextual nudges. Deliberately small: they break ties between two
   * similarly-named venues, they never rescue a bad name match.
   */
  let adjusted = best * 0.9;
  const areaKey = context.areaHint ? normalizePlaceName(context.areaHint) : '';
  const targetAreaKey = target.areaId ? normalizePlaceName(target.areaId) : '';
  if (areaKey && targetAreaKey && (areaKey === targetAreaKey || areaKey.includes(targetAreaKey) || targetAreaKey.includes(areaKey))) {
    adjusted += 0.07;
  }
  const compatible = context.recommendationType ? TYPE_COMPATIBILITY[context.recommendationType] : undefined;
  if (compatible && target.discovery && target.discovery.some((d) => compatible.includes(d))) {
    adjusted += 0.05;
  }

  return { confidence: Math.max(0, Math.min(1, adjusted)), method: 'fuzzy' };
}

export interface MatchAllOptions {
  areaHint?: string;
  recommendationType?: RecommendationType;
  /** Override for tests and for a stricter review pass. */
  floor?: number;
}

export function matchPlace(
  rawName: string,
  targets: MatchTarget[],
  options: MatchAllOptions = {},
): MatchResult {
  const floor = options.floor ?? MATCH_CONFIDENCE_FLOOR;
  const context = { areaHint: options.areaHint, recommendationType: options.recommendationType };

  let best: { id: string; confidence: number; method: 'exact' | 'alias' | 'fuzzy' } | null = null;
  let second: { id: string; confidence: number } | null = null;

  for (const target of targets) {
    const { confidence, method } = scoreMatch(rawName, target, context);
    if (confidence <= 0) continue;
    if (!best || confidence > best.confidence) {
      if (best) second = { id: best.id, confidence: best.confidence };
      best = { id: target.id, confidence, method };
    } else if (!second || confidence > second.confidence) {
      second = { id: target.id, confidence };
    }
  }

  if (!best) return { placeId: null, method: null, confidence: 0 };

  /*
   * An exact hit on one target and a near-identical fuzzy hit on another is a
   * genuine ambiguity, not a match. Two venues one letter apart is exactly the
   * case a human should settle.
   */
  const ambiguous = second != null && best.confidence - second.confidence < 0.05 && best.method === 'fuzzy';

  if (best.confidence < floor || ambiguous) {
    return {
      placeId: null,
      method: null,
      confidence: best.confidence,
      runnerUp: { placeId: best.id, confidence: best.confidence },
    };
  }

  return {
    placeId: best.id,
    method: best.method,
    confidence: best.confidence,
    runnerUp: second ? { placeId: second.id, confidence: second.confidence } : undefined,
  };
}
