import { NextResponse } from 'next/server';

/**
 * The Xiaohongshu retrieval boundary.
 *
 * WHAT THIS ROUTE IS
 * ------------------
 * It exists so that "paste a link" can mean something more than "paste a link
 * and we will ignore it". When the deployment has a server and an approved
 * retrieval provider configured, this is where the post's text and images enter
 * Meridian — once, server-side, with the credential attached.
 *
 * WHAT THIS ROUTE IS NOT, AND WILL NOT BECOME
 * -------------------------------------------
 * It is not a scraper, and the refusals are deliberate and permanent (§2, §35):
 *
 *   - It does not log in to anything. There is no session, no cookie jar, and no
 *     `MEMBER_ACCESS_TOKEN`. A traveller's own Xiaohongshu session must never be
 *     used by us or stored by us.
 *   - It does not solve or bypass a CAPTCHA, a slider, a signature, or any other
 *     access control.
 *   - It does not rotate user agents, proxies or fingerprints to evade a block.
 *   - It does not touch private or followers-only content.
 *   - It does not run a headless browser pretending to be a person.
 *
 * A `403` from the platform is therefore reported as `unavailable` and NOT
 * retried. That is the correct behaviour, not a limitation to engineer around:
 * the platform said no, so we stop, and the traveller keeps working by pasting
 * text or uploading screenshots (§2, §27).
 *
 * HOW A LEGITIMATE RETRIEVAL WOULD BE PLUGGED IN
 * ----------------------------------------------
 * A licensing partner, a first-party API, or a self-hosted reader that the
 * platform permits. Any of those drops in at `fetchPublicContent` below and
 * nothing else in the product changes: the response shape is the contract, and
 * the client already handles every documented outcome.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface XiaohongshuContent {
  title?: string;
  bodyText?: string;
  author?: string;
  /** Absolute URLs of the post's images, in the post's own order. */
  imageUrls: string[];
}

type RetrievalOutcome =
  | { status: 'ok'; content: XiaohongshuContent; provider: string }
  | { status: 'unavailable'; reason: string; note: string }
  | { status: 'not_xiaohongshu'; reason: string };

/** The hosts we are willing to look at, so this cannot become an open proxy. */
const ALLOWED_HOSTS = /(^|\.)(xiaohongshu\.com|xhslink\.com)$/i;

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.test(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * The pluggable step.
 *
 * Returns `unavailable` when nothing is configured, which is the honest answer
 * on every deployment today and on GitHub Pages permanently. The traveller is
 * told exactly what to do instead, and the import continues (§27).
 */
async function fetchPublicContent(url: string): Promise<RetrievalOutcome> {
  const endpoint = process.env.XIAOHONGSHU_RETRIEVAL_ENDPOINT;
  const token = process.env.XIAOHONGSHU_RETRIEVAL_TOKEN;

  if (!endpoint) {
    return {
      status: 'unavailable',
      reason: 'no_retrieval_provider',
      note: 'No approved retrieval provider is configured on this deployment.',
    };
  }

  try {
    /*
     * A single polite request to a provider WE have an agreement with.
     *
     * No retries, no backoff storm, no parallel fan-out: if the answer is no, it
     * is no. `redirect: 'error'` matters — a redirect chain is how a "read one
     * public page" request quietly turns into something else.
     */
    const response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
    });

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      // Explicitly NOT retried and NOT worked around.
      return {
        status: 'unavailable',
        reason: `provider_refused_${response.status}`,
        note: 'The content could not be read. Paste the text or upload screenshots to continue.',
      };
    }

    if (!response.ok) {
      return { status: 'unavailable', reason: `provider_error_${response.status}`, note: 'Retrieval failed.' };
    }

    const payload = (await response.json()) as Partial<XiaohongshuContent>;
    return {
      status: 'ok',
      provider: 'retrieval_endpoint',
      content: {
        title: typeof payload.title === 'string' ? payload.title.slice(0, 300) : undefined,
        bodyText: typeof payload.bodyText === 'string' ? payload.bodyText.slice(0, 20_000) : undefined,
        author: typeof payload.author === 'string' ? payload.author.slice(0, 120) : undefined,
        imageUrls: Array.isArray(payload.imageUrls)
          ? payload.imageUrls.filter((value): value is string => typeof value === 'string').slice(0, 20)
          : [],
      },
    };
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error instanceof Error ? error.name.slice(0, 40) : 'retrieval_failed',
      note: 'Retrieval timed out or was refused.',
    };
  }
}

export async function POST(request: Request) {
  let body: { url?: unknown };
  try {
    body = (await request.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ status: 'unavailable', reason: 'invalid_json' }, { status: 400 });
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (url.length === 0) {
    return NextResponse.json({ status: 'unavailable', reason: 'empty_url' }, { status: 400 });
  }
  if (url.length > 2048) {
    return NextResponse.json({ status: 'unavailable', reason: 'url_too_long' }, { status: 413 });
  }
  if (!isAllowed(url)) {
    /*
     * 200, not 400. "This is not a Xiaohongshu link" is an outcome the client
     * renders as guidance, not an error it needs to handle specially.
     */
    return NextResponse.json({ status: 'not_xiaohongshu', reason: 'unsupported_host' });
  }

  const outcome = await fetchPublicContent(url);
  return NextResponse.json(outcome);
}

/**
 * The image relay for a legitimately retrieved post.
 *
 * WHY THIS EXISTS AT ALL
 * ----------------------
 * The post's pictures live on a Xiaohongshu CDN. A browser cannot fetch them
 * directly — CORS blocks it — and the traveller's imported images have to end up
 * in their OWN private storage, not as a hotlink to somebody else's bandwidth
 * (§4, §20). So when — and only when — a retrieval provider returned this post,
 * the client asks this handler for the bytes, and stores what it gets as
 * `private_import`.
 *
 * WHY IT IS NOT A GENERAL PROXY
 * -----------------------------
 * It fetches ONE url per request, only from a host the provider already told us
 * about, with a hard size ceiling and an image-only content type. It is not a
 * general-purpose fetcher and cannot be pointed at an arbitrary address, which is
 * the difference between a relay and an open proxy somebody else pays for.
 */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_HOSTS = /(^|\.)(xhscdn\.com|xiaohongshu\.com|xhslink\.com)$/i;

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing_url' }, { status: 400 });
  if (url.length > 2048) return NextResponse.json({ error: 'url_too_long' }, { status: 413 });

  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return NextResponse.json({ error: 'bad_scheme' }, { status: 400 });
    host = parsed.hostname;
  } catch {
    return NextResponse.json({ error: 'bad_url' }, { status: 400 });
  }
  if (!IMAGE_HOSTS.test(host)) return NextResponse.json({ error: 'host_not_allowed' }, { status: 403 });

  try {
    const response = await fetch(url, {
      headers: { accept: 'image/*' },
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return NextResponse.json({ error: `image_${response.status}` }, { status: 502 });

    const type = response.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) return NextResponse.json({ error: 'not_an_image' }, { status: 415 });

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'image_too_large' }, { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        'content-type': type,
        // Private: this response is for one traveller's import, never a shared cache.
        'cache-control': 'private, max-age=0, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'image_unreachable' }, { status: 502 });
  }
}
