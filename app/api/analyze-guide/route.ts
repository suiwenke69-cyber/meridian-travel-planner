import { NextResponse } from 'next/server';

/**
 * Multimodal guide analysis: text AND images, server-side.
 *
 * This is the one place a vision credential exists. The client posts the post's
 * text plus downscaled images; this handler attaches the key and returns
 * structured findings. The browser never sees a token, and on the static GitHub
 * Pages build the route is not deployed at all — the client falls back to the
 * text-only analyzer and says so (§13, §27).
 *
 * THE PROMPT'S HARD RULES
 * -----------------------
 * The model is asked to READ, not to know. Three constraints are absolute
 * because each one, violated, produces output that looks correct and corrupts a
 * traveller's map:
 *
 *   1. NO COORDINATES. Ever. A model that has never seen Bali cannot place a
 *      beach club, and a plausible latitude is the most damaging thing this
 *      feature could emit (§10, §35).
 *   2. NO INVENTED ATTRIBUTES. No ratings, prices, hours or "best in Bali".
 *      Only what the post itself says.
 *   3. EVERY FINDING SAYS WHERE IT CAME FROM. `detectedFromText` and
 *      `detectedFromImageIds` are mandatory, because §9's provenance line is
 *      what lets a traveller judge whether to trust a card.
 *
 * The known corpus is sent along so the model is asked to RECOGNISE a name from
 * a list rather than to recall Balinese geography. Recognition is a task it is
 * good at; recall is a task it hallucinates.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImagePayload {
  id?: unknown;
  index?: unknown;
  dataUrl?: unknown;
  caption?: unknown;
}

interface AnalyzeBody {
  text?: unknown;
  destinationId?: unknown;
  knownPlaceNames?: unknown;
  imageBatches?: unknown;
  version?: unknown;
}

const MAX_TEXT_LENGTH = 20_000;
const MAX_IMAGES = 20;

const SYSTEM_PROMPT = `You read Xiaohongshu travel notes and extract the PLACES they mention, from the text AND from the images.

Return ONLY JSON:
{"findings":[{"rawName":string,"entityType":string,"detectedFromText":boolean,
"detectedFromImageIds":string[],"contextText":string,"detectedReason":string,
"extractedItems":string[],"contextThemes":string[],"positiveThemes":string[],
"warnings":string[],"bestTimeMentioned":string,"areaHint":string,"confidence":number}],
"imageAnalyses":[{"imageId":string,"detectedTexts":string[],
"candidatePlaceNames":string[],"candidateCategories":string[],
"sceneHints":string[],"areaHints":string[],"nameConfidences":{}}]}

ABSOLUTE RULES
- NEVER output coordinates, latitude, longitude, addresses or map links. You cannot know where these places are. Another system resolves positions.
- NEVER invent ratings, prices, opening hours or superlatives. Only report what the note says.
- rawName must be written EXACTLY as it appears, in its original language. Never translate or correct it.
- entityType is one of: restaurant, cafe, beachclub, bar, beach, nature, culture, activity, hotel, shopping, wellness, area, transport, unknown.
- detectedFromText is true only if the TEXT names it. detectedFromImageIds lists the image ids it was read from. A finding with neither is invalid.
- Images are evidence: shopfronts, signs, menus, branding, Chinese and English labels, maps, annotated screenshots. Read text visible in an image and treat it as a candidate name.
- If several images show the same place, emit ONE finding listing all of their ids.
- A name you read off an image but are unsure about: still emit it, with a confidence below 0.6. Another system turns low-confidence image findings into a question for the user.
- contextText is at most one short sentence from the source. Never reproduce the whole note.
- If the text names a place and an image also shows it, set detectedFromText true and include the image ids.
- imageAnalyses must contain one entry per image you were given, using the exact ids provided.
- If you find nothing, return {"findings":[],"imageAnalyses":[...]}.`;

interface ProviderConfig {
  url: string;
  key: string;
  model: string;
  /** Which request shape the vendor speaks. */
  shape: 'openai' | 'anthropic';
}

function providerConfig(): ProviderConfig | null {
  const model = process.env.VISION_MODEL;
  const base = process.env.VISION_API_BASE_URL;

  // An explicitly configured OpenAI-compatible endpoint wins: DashScope/Qwen-VL
  // and most regional providers speak this shape, and a Chinese-language guide
  // is usually better read by one of them.
  if (base && process.env.VISION_API_KEY) {
    return {
      url: `${base.replace(/\/$/, '')}/chat/completions`,
      key: process.env.VISION_API_KEY,
      model: model ?? 'qwen-vl-max',
      shape: 'openai',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      key: process.env.OPENAI_API_KEY,
      model: model ?? 'gpt-4o-mini',
      shape: 'openai',
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      key: process.env.ANTHROPIC_API_KEY,
      model: model ?? 'claude-3-5-haiku-latest',
      shape: 'anthropic',
    };
  }
  return null;
}

interface BuiltBatch {
  ids: string[];
  content: Array<Record<string, unknown>>;
}

/**
 * One request per batch of images, plus the text.
 *
 * Batching is §31's cost control and also a quality decision: four frames in one
 * call lets the model relate a storefront to the plate to the sign, which is the
 * sequence signal §6 asks for and a per-image call cannot see.
 */
function buildMessages(text: string, batch: BuiltBatch, destinationId: string, knownPlaceNames: string[]) {
  const userContent: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: [
        `Destination: ${destinationId}`,
        knownPlaceNames.length > 0
          ? `Places this product already knows (prefer these exact names when one matches): ${knownPlaceNames.join(', ')}`
          : null,
        text.trim().length > 0 ? `Note text:\n"""\n${text}\n"""` : 'The note has no body text. Read the images only.',
        `Images in this batch, in order: ${batch.ids.join(', ')}`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n\n'),
    },
    ...batch.content,
  ];
  return userContent;
}

export async function POST(request: Request) {
  const config = providerConfig();
  if (!config) {
    /*
     * 501 and not 500: nothing is broken, the deployment simply has no vision
     * provider. The client treats this as "analyse text only" and continues.
     */
    return NextResponse.json(
      { error: 'vision_not_configured', message: 'No vision provider is configured on this server.' },
      { status: 501 },
    );
  }

  let body: AnalyzeBody;
  try {
    body = (await request.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT_LENGTH) : '';
  const destinationId = typeof body.destinationId === 'string' ? body.destinationId : 'bali';
  const knownPlaceNames = Array.isArray(body.knownPlaceNames)
    ? body.knownPlaceNames.filter((n): n is string => typeof n === 'string').slice(0, 400)
    : [];

  // Only keep data URLs; anything else would be a URL fetch we have not agreed to.
  const batches = (Array.isArray(body.imageBatches) ? body.imageBatches : [])
    .slice(0, MAX_IMAGES)
    .map((batch) =>
      (Array.isArray(batch) ? batch : [])
        .map((entry) => entry as ImagePayload)
        .filter(
          (entry): entry is { id: string; index: number; dataUrl: string; caption?: string } =>
            typeof entry.id === 'string' && typeof entry.dataUrl === 'string' && entry.dataUrl.startsWith('data:image/'),
        ),
    )
    .filter((batch) => batch.length > 0);

  if (text.trim().length === 0 && batches.length === 0) {
    return NextResponse.json({ error: 'empty_input' }, { status: 400 });
  }

  const findings: unknown[] = [];
  const imageAnalyses: unknown[] = [];
  let modelUsed = config.model;

  try {
    for (const batch of batches) {
      const built: BuiltBatch = {
        ids: batch.map((entry) => entry.id),
        content: batch.flatMap((entry) => {
          const parts: Array<Record<string, unknown>> = [
            { type: 'text', text: `Image id ${entry.id} (position ${entry.index})${entry.caption ? ` — user note: ${entry.caption}` : ''}` },
          ];
          if (config.shape === 'anthropic') {
            const match = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(entry.dataUrl);
            if (match) {
              parts.push({ type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } });
            }
          } else {
            parts.push({ type: 'image_url', image_url: { url: entry.dataUrl, detail: 'low' } });
          }
          return parts;
        }),
      };

      const response =
        config.shape === 'anthropic'
          ? await fetch(config.url, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-api-key': config.key,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: config.model,
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: buildMessages(text, built, destinationId, knownPlaceNames) }],
              }),
              signal: AbortSignal.timeout(90_000),
            })
          : await fetch(config.url, {
              method: 'POST',
              headers: { 'content-type': 'application/json', authorization: `Bearer ${config.key}` },
              body: JSON.stringify({
                model: config.model,
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: buildMessages(text, built, destinationId, knownPlaceNames) },
                ],
              }),
              signal: AbortSignal.timeout(90_000),
            });

      if (!response.ok) {
        // The vendor's message can echo project details, so only the status crosses back.
        return NextResponse.json({ error: 'analyze_failed', status: response.status }, { status: 502 });
      }

      const payload = (await response.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        content?: Array<{ type?: string; text?: string }>;
      };
      modelUsed = payload.model ?? modelUsed;

      const content =
        config.shape === 'anthropic'
          ? (payload.content ?? []).map((part) => part.text ?? '').join('')
          : (payload.choices?.[0]?.message?.content ?? '');

      const parsed = JSON.parse(content) as { findings?: unknown[]; imageAnalyses?: unknown[] };
      if (Array.isArray(parsed.findings)) findings.push(...parsed.findings);
      if (Array.isArray(parsed.imageAnalyses)) imageAnalyses.push(...parsed.imageAnalyses);
    }

    /*
     * Text-only analysis still goes to the model when no images arrived.
     *
     * The deterministic extractor handles the common case for free, so this path
     * exists for the guide whose place names a rule set cannot see — a note that
     * is entirely emoji and proper nouns, say.
     */
    if (batches.length === 0 && text.trim().length > 0) {
      const response = await fetch(config.url, {
        method: 'POST',
        headers:
          config.shape === 'anthropic'
            ? { 'content-type': 'application/json', 'x-api-key': config.key, 'anthropic-version': '2023-06-01' }
            : { 'content-type': 'application/json', authorization: `Bearer ${config.key}` },
        body: JSON.stringify(
          config.shape === 'anthropic'
            ? {
                model: config.model,
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: buildMessages(text, { ids: [], content: [] }, destinationId, knownPlaceNames) }],
              }
            : {
                model: config.model,
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: buildMessages(text, { ids: [], content: [] }, destinationId, knownPlaceNames) },
                ],
              },
        ),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: 'analyze_failed', status: response.status }, { status: 502 });
      }
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        content?: Array<{ type?: string; text?: string }>;
      };
      const content =
        config.shape === 'anthropic'
          ? (payload.content ?? []).map((part) => part.text ?? '').join('')
          : (payload.choices?.[0]?.message?.content ?? '');
      const parsed = JSON.parse(content) as { findings?: unknown[] };
      if (Array.isArray(parsed.findings)) findings.push(...parsed.findings);
    }

    return NextResponse.json({
      findings,
      imageAnalyses,
      provider: `api:${config.shape}`,
      model: modelUsed,
      version: typeof body.version === 'string' ? body.version : 'v1',
    });
  } catch {
    return NextResponse.json({ error: 'analyze_failed' }, { status: 502 });
  }
}
