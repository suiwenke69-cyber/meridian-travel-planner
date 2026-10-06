import type { RecommendationType, SocialPlatform } from '../types';
import { extractMentions, type ExtractArea, type ExtractPlace } from './extract';

/**
 * Guide extraction, behind a provider interface.
 *
 * WHY THIS IS AN INTERFACE AND NOT A FETCH CALL
 * ---------------------------------------------
 * The obvious implementation — "send the text to GPT and ask for JSON" — welds
 * the product to one vendor, one price and one failure mode. Extraction is
 * entity recognition, classification and one-line summarisation; that is a task
 * a small cheap model does well, and it is also a task a deterministic
 * rule-based extractor does *adequately*. Which one runs should be a deployment
 * decision, not an architectural one.
 *
 * Two providers ship:
 *
 *  1. `deterministic` — the rule-based extractor in `./extract`. No network, no
 *     key, no cost, reproducible. It is the DEFAULT, because the product must
 *     work offline and must not spend money to be demonstrable.
 *  2. `llm` — POSTs to `/api/extract`, which is the server boundary. It is only
 *     `available()` when that endpoint answers, so a static deployment degrades
 *     to the deterministic extractor instead of breaking.
 *
 * The API key never reaches the browser: the client calls our own route, and the
 * route reads `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` from the server environment.
 */

export interface ExtractedPlace {
  rawPlaceName: string;
  /** The sentence it was found in. Short, and never the whole post. */
  rawText: string;
  categoryHint?: RecommendationType;
  areaHint?: string;
  /** One short line on why the extractor believed this was a place. */
  extractedReason?: string;
  extractedItems: string[];
  /** Source-derived insight. Never presented as a verified place attribute. */
  contextThemes: string[];
  positiveThemes: string[];
  warnings: string[];
  bestTimeMentioned?: string;
}

export interface GuideExtractionInput {
  text: string;
  platform: SocialPlatform;
  sourceUrl?: string;
  destinationId: string;
  /** Canonical places to match names against, so the LLM path can reuse them. */
  knownPlaces: ExtractPlace[];
  knownAreas: ExtractArea[];
}

export interface GuideExtractionResult {
  places: ExtractedPlace[];
  /** A short paraphrase. Never a reproduction of the source. */
  summary?: string;
  providerId: string;
  model?: string;
  /** True when the result came from cache rather than a fresh extraction. */
  cached?: boolean;
}

export interface GuideExtractor {
  id: string;
  label: string;
  /** True when this extractor needs a server round-trip. */
  requiresServer: boolean;
  /** Whether this extractor can run in the current environment. */
  available: () => boolean;
  extract: (input: GuideExtractionInput) => Promise<GuideExtractionResult>;
}

export const EXTRACTION_VERSION = 'v1';

// ---------------------------------------------------------------------------
// Provider 1 — deterministic
// ---------------------------------------------------------------------------

/**
 * The rule-based extractor.
 *
 * Honest about its ceiling: it finds names it recognises and names sitting next
 * to a category keyword. It does not resolve pronouns, follow a map link, or
 * read a screenshot — which is the format most of these guides actually arrive
 * in. It is the default because it always works, costs nothing and gives the
 * same answer twice.
 */
export const deterministicExtractor: GuideExtractor = {
  id: 'deterministic',
  label: '内置规则',
  requiresServer: false,
  available: () => true,
  async extract(input) {
    const result = extractMentions(input.text, input.knownPlaces, input.knownAreas);
    return {
      providerId: 'deterministic',
      places: result.mentions.map((mention) => ({
        rawPlaceName: mention.rawPlaceName,
        rawText: mention.rawText,
        categoryHint: mention.recommendationType,
        areaHint: mention.areaHint,
        extractedReason: mention.extractedReason,
        extractedItems: mention.recommendedItems,
        contextThemes: mention.contextThemes,
        positiveThemes: mention.positiveThemes,
        warnings: mention.warnings,
        bestTimeMentioned: mention.bestTimeMentioned,
      })),
    };
  },
};

// ---------------------------------------------------------------------------
// Provider 2 — a structured-output LLM, behind the server boundary
// ---------------------------------------------------------------------------

/**
 * The LLM extractor.
 *
 * It does NOT hold a key and does NOT call a vendor directly. It calls
 * `/api/extract`, which is the only place a secret exists. On a static
 * deployment that route does not exist, `available()` returns false, and the
 * deterministic extractor is used instead — the feature degrades rather than
 * breaking, and no key is ever shipped to the browser.
 */
export const llmExtractor: GuideExtractor = {
  id: 'llm',
  label: 'AI 整理',
  requiresServer: true,
  available: () => true, // The route itself reports unavailability at call time.
  async extract(input) {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        platform: input.platform,
        sourceUrl: input.sourceUrl,
        destinationId: input.destinationId,
      }),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({}) as { message?: string });
      throw new Error(detail.message ?? `extract_failed_${response.status}`);
    }

    const payload = (await response.json()) as {
      places?: ExtractedPlace[];
      summary?: string;
      model?: string;
    };
    return {
      providerId: 'llm',
      model: payload.model,
      summary: payload.summary,
      places: (payload.places ?? []).map((place) => ({
        rawPlaceName: place.rawPlaceName,
        rawText: place.rawText ?? '',
        categoryHint: place.categoryHint,
        areaHint: place.areaHint,
        extractedReason: place.extractedReason,
        extractedItems: place.extractedItems ?? [],
        contextThemes: place.contextThemes ?? [],
        positiveThemes: place.positiveThemes ?? [],
        warnings: place.warnings ?? [],
        bestTimeMentioned: place.bestTimeMentioned,
      })),
    };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, GuideExtractor> = {
  deterministic: deterministicExtractor,
  llm: llmExtractor,
};

/**
 * Which extractor to use.
 *
 * `NEXT_PUBLIC_GUIDE_EXTRACTOR` selects one explicitly; unset means
 * deterministic, which is the safe default for a static build. The name is
 * public-safe by design — it selects a provider, it does not carry a secret.
 */
export function getExtractor(): GuideExtractor {
  const requested = process.env.NEXT_PUBLIC_GUIDE_EXTRACTOR;
  if (requested && PROVIDERS[requested]?.available()) return PROVIDERS[requested];
  return deterministicExtractor;
}

export function listExtractors(): GuideExtractor[] {
  return Object.values(PROVIDERS);
}
