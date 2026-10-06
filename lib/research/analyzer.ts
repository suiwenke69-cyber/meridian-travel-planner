'use client';

import type { ImageAnalysis, ImageAnalysisStatus, RecommendationType } from '../types';
import { extractMentions, type ExtractArea, type ExtractPlace } from './extract';
import { ANALYSIS_BATCH_SIZE, batchItems } from './image-rules';

/**
 * Reading a guide, from its text AND its pictures.
 *
 * WHY THIS IS AN INTERFACE
 * ------------------------
 * The previous iteration treated images as decoration and read only pasted text,
 * which is the wrong shape for Xiaohongshu twice over: the platform's guides are
 * image-first, and a name on a shopfront is as good a piece of evidence as a name
 * in a sentence. §5 and §6 make both modalities the point.
 *
 * Vision is also the one part of this feature that genuinely costs money per
 * call, cannot run offline, and changes vendor every year. So it sits behind
 * `GuideAnalyzer`, exactly as text extraction sits behind `GuideExtractor`:
 *
 *   `heuristic`  — text only, no network, no key. The default, and the reason
 *                  the feature still works on a static deployment.
 *   `multimodal` — posts text and downscaled images to `/api/analyze-guide`,
 *                  which is the only place a vision key exists.
 *
 * Both return the SAME shape, so the review screen, the merge step and the
 * resolution pipeline cannot tell which one produced their input. A deployment
 * that gains a key gains image understanding without any other code changing.
 *
 * WHAT IS NEVER DONE HERE
 * -----------------------
 * No coordinates. §10 and §35 are explicit: a model reads names, and the map
 * position comes from Meridian's data, an external place provider, or the
 * traveller pointing at the map. A model that has never seen this island cannot
 * know where a beach club is, and a plausible-looking latitude is the most
 * damaging thing this feature could produce.
 */

/** What the analyzer is given for one image. */
export interface AnalyzerImage {
  id: string;
  /** 1-based, as the traveller counts them in the post. */
  index: number;
  width?: number;
  height?: number;
  /** Downscaled data URL. Absent for the heuristic analyzer, which cannot read it. */
  dataUrl?: string;
  /** The traveller's own note about the image, when they wrote one. */
  caption?: string;
}

/** One place a guide appears to name, before merging and resolution. */
export interface AnalyzerFinding {
  rawName: string;
  entityType?: RecommendationType;
  /** The post's own words named it. */
  detectedFromText: boolean;
  /** Which images it was read out of. */
  detectedFromImageIds: string[];
  contextText?: string;
  detectedReason?: string;
  extractedItems?: string[];
  contextThemes?: string[];
  positiveThemes?: string[];
  warnings?: string[];
  bestTimeMentioned?: string;
  areaHint?: string;
  /**
   * How sure the reader was, 0–1.
   *
   * For text findings this is structural (an exact dictionary hit is 1, a
   * heuristic guess is lower). For image findings it is the model's own
   * confidence, which is why §26 exists: below the proposal threshold the
   * candidate is shown as a QUESTION rather than as a finding.
   */
  confidence: number;
}

export interface GuideAnalysisInput {
  text: string;
  images: AnalyzerImage[];
  destinationId: string;
  knownPlaces: ExtractPlace[];
  knownAreas: ExtractArea[];
}

export interface GuideAnalysisResult {
  findings: AnalyzerFinding[];
  /** One record per image that was actually looked at. */
  imageAnalyses: ImageAnalysis[];
  /** Per-image status, so the UI can say which frames nobody could read. */
  imageStatus: Map<string, ImageAnalysisStatus>;
  providerId: string;
  version: string;
  /** True when a provider existed but declined or failed. */
  degraded?: boolean;
  /** Why, in one short line, for the reviewer — never rendered to a traveller. */
  degradedReason?: string;
}

export interface GuideAnalyzer {
  id: string;
  label: string;
  requiresServer: boolean;
  /** Whether this analyzer can run in the current environment. */
  available: () => boolean;
  analyze: (input: GuideAnalysisInput) => Promise<GuideAnalysisResult>;
}

export const ANALYSIS_VERSION = 'v1';

/**
 * Below this, an image-only finding is a question rather than a proposal (§26).
 *
 * Deliberately higher than the text matcher's floor. A sentence naming a place
 * is evidence about the world; a model squinting at a blurry sign is evidence
 * about a photograph, and the two should not be trusted equally.
 */
export const IMAGE_PROPOSAL_FLOOR = 0.6;

// ---------------------------------------------------------------------------
// Provider 1 — text only
// ---------------------------------------------------------------------------

/**
 * The offline analyzer.
 *
 * It reads text properly and is honest that it cannot see. It does NOT
 * approximate vision by guessing from filenames or captions — that would
 * manufacture findings the traveller never wrote, which is precisely the failure
 * mode the rest of this pipeline is built to avoid.
 *
 * Images it cannot read are marked `unsupported`, not `failed`. Nothing is
 * broken; this deployment has no eyes, and the UI says so while leaving the
 * traveller fully able to assign images to places by hand (§16).
 */
export const heuristicAnalyzer: GuideAnalyzer = {
  id: 'heuristic',
  label: '内置规则（仅正文）',
  requiresServer: false,
  available: () => true,
  async analyze(input) {
    const result = extractMentions(input.text, input.knownPlaces, input.knownAreas);

    const findings: AnalyzerFinding[] = result.mentions.map((mention) => ({
      rawName: mention.rawPlaceName,
      entityType: mention.recommendationType,
      detectedFromText: true,
      detectedFromImageIds: [],
      contextText: mention.rawText,
      detectedReason: mention.extractedReason,
      extractedItems: mention.recommendedItems,
      contextThemes: mention.contextThemes,
      positiveThemes: mention.positiveThemes,
      warnings: mention.warnings,
      bestTimeMentioned: mention.bestTimeMentioned,
      areaHint: mention.areaHint,
      /*
       * How much this detection is worth, as a READER's confidence rather than a
       * matcher's: a name found in the canonical dictionary was read
       * unambiguously, while a heuristic capture is a guess about where a name
       * starts and ends. Keeping the two separate matters because the image
       * proposal floor is compared against this number, and a fuzzy text match
       * must not drag a clear text finding below it.
       */
      confidence: mention.matchedPlaceId ? 1 : 0.72,
    }));

    const imageStatus = new Map<string, ImageAnalysisStatus>();
    for (const image of input.images) imageStatus.set(image.id, 'unsupported');

    return {
      findings,
      imageAnalyses: [],
      imageStatus,
      providerId: 'heuristic',
      version: ANALYSIS_VERSION,
      degraded: input.images.length > 0,
      degradedReason: input.images.length > 0 ? 'no_vision_provider' : undefined,
    };
  },
};

// ---------------------------------------------------------------------------
// Provider 2 — multimodal, behind the server boundary
// ---------------------------------------------------------------------------

interface RemoteAnalyzerResponse {
  findings?: Array<Partial<AnalyzerFinding> & { rawName?: string }>;
  imageAnalyses?: Array<Partial<ImageAnalysis> & { imageId?: string }>;
  provider?: string;
  model?: string;
}

/**
 * Posts the guide — text and pictures together — to our own server route.
 *
 * The client holds no credential and calls no vendor. On a static deployment the
 * route does not exist, this throws, and `analyzeGuide` falls back to the
 * heuristic analyzer rather than failing the import (§27).
 */
export const multimodalAnalyzer: GuideAnalyzer = {
  id: 'multimodal',
  label: '多模态识别（正文 + 图片）',
  requiresServer: true,
  available: () => true,
  async analyze(input) {
    const response = await fetch('/api/analyze-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input.text,
        destinationId: input.destinationId,
        // The known corpus goes along so the model is asked to RECOGNISE rather
        // than to recall: "is it one of these?" is a much safer question than
        // "what places are in Bali?".
        knownPlaceNames: input.knownPlaces.slice(0, 400).map((place) => place.name),
        imageBatches: batchItems(input.images, ANALYSIS_BATCH_SIZE).map((batch) =>
          batch.map((image) => ({ id: image.id, index: image.index, dataUrl: image.dataUrl, caption: image.caption })),
        ),
        version: ANALYSIS_VERSION,
      }),
    });

    if (!response.ok) {
      const detail = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(detail.error ?? `analyze_failed_${response.status}`);
    }

    const payload = (await response.json()) as RemoteAnalyzerResponse;

    const findings: AnalyzerFinding[] = (payload.findings ?? [])
      .filter((entry): entry is AnalyzerFinding & { rawName: string } => Boolean(entry.rawName))
      .map((entry) => ({
        rawName: entry.rawName,
        entityType: entry.entityType,
        detectedFromText: entry.detectedFromText ?? false,
        detectedFromImageIds: entry.detectedFromImageIds ?? [],
        contextText: entry.contextText,
        detectedReason: entry.detectedReason,
        extractedItems: entry.extractedItems ?? [],
        contextThemes: entry.contextThemes ?? [],
        positiveThemes: entry.positiveThemes ?? [],
        warnings: entry.warnings ?? [],
        bestTimeMentioned: entry.bestTimeMentioned,
        areaHint: entry.areaHint,
        confidence: typeof entry.confidence === 'number' ? entry.confidence : 0.6,
      }));

    const imageAnalyses: ImageAnalysis[] = (payload.imageAnalyses ?? [])
      .filter((entry): entry is ImageAnalysis => Boolean(entry.imageId))
      .map((entry) => ({
        id: entry.id ?? `an-${entry.imageId}`,
        imageId: entry.imageId as string,
        importId: entry.importId ?? '',
        detectedTexts: entry.detectedTexts ?? [],
        candidatePlaceNames: entry.candidatePlaceNames ?? [],
        candidateCategories: entry.candidateCategories ?? [],
        sceneHints: entry.sceneHints ?? [],
        areaHints: entry.areaHints ?? [],
        nameConfidences: entry.nameConfidences,
        analysisProvider: entry.analysisProvider ?? payload.provider ?? 'multimodal',
        analysisVersion: entry.analysisVersion ?? ANALYSIS_VERSION,
        createdAt: entry.createdAt ?? new Date().toISOString(),
      }));

    const imageStatus = new Map<string, ImageAnalysisStatus>();
    for (const image of input.images) {
      imageStatus.set(image.id, imageAnalyses.some((entry) => entry.imageId === image.id) ? 'analyzed' : 'failed');
    }

    return {
      findings,
      imageAnalyses,
      imageStatus,
      providerId: payload.provider ?? 'multimodal',
      version: ANALYSIS_VERSION,
    };
  },
};

// ---------------------------------------------------------------------------
// Registry and orchestration
// ---------------------------------------------------------------------------

const ANALYZERS: Record<string, GuideAnalyzer> = {
  heuristic: heuristicAnalyzer,
  multimodal: multimodalAnalyzer,
};

/**
 * Which analyzer to use.
 *
 * `NEXT_PUBLIC_GUIDE_ANALYZER` selects one. Unset — the static build — means
 * text-only, which is the safe default: it always works, costs nothing and
 * cannot fail halfway through somebody's holiday planning.
 */
export function getAnalyzer(): GuideAnalyzer {
  const requested = process.env.NEXT_PUBLIC_GUIDE_ANALYZER;
  if (requested === 'multimodal') return multimodalAnalyzer;
  if (requested && ANALYZERS[requested]?.available()) return ANALYZERS[requested];
  return heuristicAnalyzer;
}

/**
 * Runs the strongest analyzer available and degrades honestly.
 *
 * §27's requirement is that a failure here must not dead-end the traveller. If
 * the multimodal provider is unreachable, they still get full text extraction
 * and a clear line saying images were not read — plus the manual assignment flow,
 * which needs no model at all.
 */
export async function analyzeGuide(input: GuideAnalysisInput): Promise<GuideAnalysisResult> {
  const analyzer = getAnalyzer();
  if (analyzer.id === 'heuristic') return heuristicAnalyzer.analyze(input);
  try {
    return await analyzer.analyze(input);
  } catch (error) {
    const fallback = await heuristicAnalyzer.analyze(input);
    return {
      ...fallback,
      degraded: true,
      degradedReason: error instanceof Error ? error.message.slice(0, 60) : 'analyzer_unavailable',
    };
  }
}

export function listAnalyzers(): GuideAnalyzer[] {
  return Object.values(ANALYZERS);
}

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

export interface MergeableCandidate {
  rawName: string;
  entityType?: RecommendationType;
  detectedFromText: boolean;
  detectedFromImageIds: string[];
  detectedReason?: string;
  contextText?: string;
  extractedItems: string[];
  contextThemes: string[];
  positiveThemes: string[];
  warnings: string[];
  bestTimeMentioned?: string;
  areaHint?: string;
  confidence: number;
}

/**
 * Collapses findings that are the same place (§24).
 *
 * The example in the brief is the common case, not an edge case: a post says
 * "La Brisa" in the caption, shows the entrance in image 3 and the sunset in
 * image 4. Three detections, ONE place — three cards would make the traveller
 * do the merging by hand, and saving all three would create three saved entries
 * for one beach club.
 *
 * The key is the normalised name, deliberately conservative: only genuinely
 * identical names collapse here. `La Brisa` and `La Brisa Bali` are left as two
 * findings because deciding they are one place is the matcher's job — it has the
 * canonical corpus and the alias table, and this function has neither. Merging
 * on a fuzzy key here would silently hide a duplicate that the matcher's
 * ambiguity rule exists to surface.
 *
 * When findings do merge, the result keeps the union: text evidence OR image
 * evidence, all images, and the richest context. Confidence is the maximum,
 * because two independent readers agreeing is stronger than either alone.
 */
export function mergeFindings(findings: AnalyzerFinding[], normalize: (name: string) => string): MergeableCandidate[] {
  const byKey = new Map<string, MergeableCandidate>();

  for (const finding of findings) {
    const key = normalize(finding.rawName);
    if (key.length < 2) continue;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, {
        rawName: finding.rawName,
        entityType: finding.entityType,
        detectedFromText: finding.detectedFromText,
        detectedFromImageIds: [...finding.detectedFromImageIds],
        detectedReason: finding.detectedReason,
        contextText: finding.contextText,
        extractedItems: [...(finding.extractedItems ?? [])],
        contextThemes: [...(finding.contextThemes ?? [])],
        positiveThemes: [...(finding.positiveThemes ?? [])],
        warnings: [...(finding.warnings ?? [])],
        bestTimeMentioned: finding.bestTimeMentioned,
        areaHint: finding.areaHint,
        confidence: finding.confidence,
      });
      continue;
    }

    // Captured before the flag is updated, because "the written name wins" is a
    // statement about which finding arrived first, not about the merged result.
    const hadTextEvidence = existing.detectedFromText;
    existing.detectedFromText = existing.detectedFromText || finding.detectedFromText;
    for (const imageId of finding.detectedFromImageIds) {
      if (!existing.detectedFromImageIds.includes(imageId)) existing.detectedFromImageIds.push(imageId);
    }
    existing.confidence = Math.max(existing.confidence, finding.confidence);
    existing.extractedItems = unique([...existing.extractedItems, ...(finding.extractedItems ?? [])]);
    existing.contextThemes = unique([...existing.contextThemes, ...(finding.contextThemes ?? [])]);
    existing.positiveThemes = unique([...existing.positiveThemes, ...(finding.positiveThemes ?? [])]);
    existing.warnings = unique([...existing.warnings, ...(finding.warnings ?? [])]);
    // Structure beats prose: prefer an entity type over `unknown`, and a
    // specific area hint over none.
    if (!existing.entityType && finding.entityType) existing.entityType = finding.entityType;
    if (!existing.areaHint && finding.areaHint) existing.areaHint = finding.areaHint;
    if (!existing.contextText && finding.contextText) existing.contextText = finding.contextText;
    if (!existing.detectedReason && finding.detectedReason) existing.detectedReason = finding.detectedReason;
    if (!existing.bestTimeMentioned && finding.bestTimeMentioned) existing.bestTimeMentioned = finding.bestTimeMentioned;
    // The written name wins over the one read off a sign: a sign is often a
    // brand fragment ("BRISA"), and the caption is what the creator called it.
    if (finding.detectedFromText && !hadTextEvidence) existing.rawName = finding.rawName;
  }

  return [...byKey.values()];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
