import { NextResponse } from 'next/server';

/**
 * The server-side extraction boundary.
 *
 * This route exists so the LLM step CAN be real without the API key ever
 * reaching the browser. It is the one and only place a provider key is read.
 *
 * WHY IT IS NOT USED BY DEFAULT
 *
 * The published site is a static export on GitHub Pages, where there is no
 * server and this handler is not deployed at all. The traveller's flow
 * therefore runs the deterministic extractor in the browser (see
 * `lib/research/extractor.ts`), which is honest about what it is: pattern
 * matching over text the traveller pasted, no model, no key, no cost.
 *
 * To turn the model on, deploy this app somewhere that runs Node and set:
 *
 *   GUIDE_EXTRACTOR=llm
 *   NEXT_PUBLIC_GUIDE_EXTRACTOR=llm   # tells the client to call this route
 *   DEEPSEEK_API_KEY=...              # or OPENAI_API_KEY
 *   GUIDE_EXTRACTOR_MODEL=...         # optional override
 *
 * Setting only the server-side variable changes nothing for the static build,
 * which is the point: a key present in the environment must never silently
 * become a key shipped in a JavaScript bundle.
 *
 * WHAT IT REFUSES TO DO
 *
 * It does not fetch the source URL. No scraper, no login, no CAPTCHA solving,
 * no anti-bot evasion (§5, §40). The URL is accepted as provenance metadata
 * only, and the text is what the traveller pasted.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExtractRequestBody {
  text?: unknown;
  platform?: unknown;
  sourceUrl?: unknown;
  destinationId?: unknown;
}

const MAX_TEXT_LENGTH = 20_000;

/** The instructions the model is given. Kept here so the contract is auditable. */
const SYSTEM_PROMPT = `You extract named places from travel guides.

Return ONLY JSON of the shape {"places":[...]}. Each place:
{"rawPlaceName":string,"categoryHint":string,"areaHint":string|undefined,
 "extractedReason":string,"extractedItems":string[],"contextThemes":string[],
 "positiveThemes":string[],"warnings":string[],"bestTimeMentioned":string|undefined,
 "rawText":string}

Rules:
- rawPlaceName must be written EXACTLY as it appears in the guide, never translated or corrected.
- Only named, visitable places: venues, hotels, beaches, temples, trails. Never a whole city, island or generic noun ("the beach", "a cafe").
- extractedItems are specifics the guide named: dishes, activities, rooms.
- contextThemes/positiveThemes/warnings are what the guide says, never facts you believe.
- No ratings, no prices, no opening hours. If the guide did not state it, omit it.
- If nothing qualifies, return {"places":[]}.`;

function providerConfig(): { url: string; key: string; model: string } | null {
  const deepseek = process.env.DEEPSEEK_API_KEY;
  if (deepseek) {
    return {
      url: 'https://api.deepseek.com/chat/completions',
      key: deepseek,
      model: process.env.GUIDE_EXTRACTOR_MODEL ?? 'deepseek-chat',
    };
  }
  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      key: openai,
      model: process.env.GUIDE_EXTRACTOR_MODEL ?? 'gpt-4o-mini',
    };
  }
  return null;
}

export async function POST(request: Request) {
  const config = providerConfig();
  if (!config) {
    // 501, not 500: nothing is broken, the deployment simply has no provider.
    return NextResponse.json(
      { error: 'extractor_not_configured', message: 'No extraction provider key is configured on the server.' },
      { status: 501 },
    );
  }

  let body: ExtractRequestBody;
  try {
    body = (await request.json()) as ExtractRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length === 0) {
    return NextResponse.json({ error: 'empty_text' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'text_too_long' }, { status: 413 });
  }

  const destinationId = typeof body.destinationId === 'string' ? body.destinationId : 'bali';
  const platform = typeof body.platform === 'string' ? body.platform : 'other';
  // Provenance only. It is never fetched.
  const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.slice(0, 2048) : undefined;

  const userPrompt = [
    `Destination: ${destinationId}`,
    sourceUrl ? `Source (metadata only, do not fetch): ${sourceUrl}` : null,
    `Platform: ${platform}`,
    '',
    'Guide text:',
    '"""',
    text,
    '"""',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      // The provider's own message can echo the key's project details, so only
      // the status crosses back to the client.
      return NextResponse.json({ error: 'extraction_failed', status: response.status }, { status: 502 });
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as { places?: unknown };

    return NextResponse.json({
      places: Array.isArray(parsed.places) ? parsed.places : [],
      providerId: `api:${config.model}`,
    });
  } catch {
    return NextResponse.json({ error: 'extraction_failed' }, { status: 502 });
  }
}
