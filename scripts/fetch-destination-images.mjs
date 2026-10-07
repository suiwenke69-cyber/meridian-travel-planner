/**
 * Resolves Bali photography from openly licensed sources.
 *
 * WHY TWO SOURCES
 * ---------------
 * Wikimedia Commons is the best source for places, areas and geography, and it
 * has per-property categories for a handful of Bali hotels. Openverse adds
 * Flickr and other CC repositories, which is where real hotel photography
 * (pool, room, spa, dining) actually lives.
 *
 * THE RULE THAT MATTERS
 * ---------------------
 * A hotel card must never show a photo of somewhere else. Every candidate is
 * verified against the property by one of:
 *   - membership of that property's Commons category, or
 *   - a distinctive name token appearing in the file title / description.
 * If nothing verifies, the hotel gets NO image and the UI shows an explicit
 * "No property photography available" state. Borrowing the area's photo was the
 * previous behaviour and it was misleading.
 *
 * Licences are restricted to those that permit commercial use (CC BY, CC BY-SA,
 * CC0, public domain). Share-alike and attribution are recorded per image.
 *
 *   npm run images:resolve -- --destination phu-quoc   # resolve candidates
 *   npm run images:download -- --destination phu-quoc  # fetch, resize, emit manifest
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * WHICH DESTINATION
 * -----------------
 *   node scripts/fetch-destination-images.mjs --destination phu-quoc
 *   node scripts/fetch-destination-images.mjs --destination phu-quoc --download
 *
 * Defaults to bali, which is the destination the pipeline was built for and the
 * one whose manifest is already shipped. The subjects and their verification
 * rules live in scripts/images/subjects/<destination>.mjs; everything in this
 * file is destination-independent.
 */
const destinationIndex = process.argv.indexOf('--destination');
const DESTINATION = destinationIndex === -1 ? 'bali' : (process.argv[destinationIndex + 1] ?? 'bali');
if (!/^[a-z0-9-]+$/.test(DESTINATION)) {
  console.error(`invalid destination: ${DESTINATION}`);
  process.exit(1);
}
const SUBJECTS_PATH = `./images/subjects/${DESTINATION}.mjs`;
const subjects = await import(pathToFileURL(join(process.cwd(), 'scripts', 'images', 'subjects', `${DESTINATION}.mjs`)).href);
const {
  HOTELS,
  AREAS,
  PLACES,
  SUBJECT_RULES,
  DEPICTS_OVERRIDE,
  HOTEL_TITLE_REJECT,
  HOTEL_TITLE_RULES,
  LOCALITY_HINTS,
  LOCALITY_HINT,
  REQUIRE_LOCALITY,
  STOPWORDS,
} = subjects;

/** `the-st-regis-bali-resort` -> The St Regis Bali Resort, for log lines only. */
const DESTINATION_LABEL = DESTINATION.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
/** `phu-quoc` -> PHU_QUOC_IMAGES */
const MANIFEST_CONST = `${DESTINATION.toUpperCase().replace(/-/g, '_')}_IMAGES`;

const UA = 'MeridianTravelPlanner/1.0 (https://example.invalid; educational demo)';
const ROOT = process.cwd();
const IMAGE_DIR = join(ROOT, 'public', 'images', DESTINATION);
const CACHE_DIR = join(ROOT, 'scripts', '.cache');
const REVIEW = join(CACHE_DIR, `${DESTINATION}-image-candidates.json`);
const MANIFEST_CACHE = join(CACHE_DIR, `${DESTINATION}-image-manifest.json`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


const BLACKLIST =
  /\b(logo|coat[ _]of[ _]arms|flag|map|diagram|chart|graph|poster|banknote|stamp|sign|signage|screenshot|insect|spider|bird|cormorant|snake|lizard|frog|butterfly|portrait|selfie|modeling|fashion|puppies|puppy|dog|dogs|pipeline|pipelines|lng|turbine|construction|protest|parade|cremation|menu|receipt)\b/i;
const NON_PHOTO = /\.(svg|png|gif|tif|tiff|webm|ogv|pdf)$/i;


/*
 * DEPICTS_OVERRIDE now lives in the subject module: it records what a specific
 * photograph shows, so it belongs next to the list of properties it corrects.
 */

/**
 * What a traveller actually wants to see first. `signage` and `general` sort
 * last so they can never take the hero slot from a room, a pool or a beach.
 */
const DEPICTS_RANK = {
  pool: 0,
  beach: 1,
  room: 2,
  exterior: 3,
  grounds: 4,
  dining: 5,
  spa: 6,
  lobby: 7,
  general: 8,
  signage: 9,
};

function depictsOf(candidate) {
  return DEPICTS_OVERRIDE[candidate.title] ?? candidate.depicts;
}

/**
 * Photographs of a hotel's name on a wall are real, correctly licensed and
 * provably of the property — and they are not property photography. A traveller
 * choosing between two Nusa Dua resorts learns nothing from a dark close-up of
 * the word "WESTIN", and a card led by one is worse than a card that says
 * plainly that no property photography is available. They are excluded, and the
 * exclusion is logged so the coverage number stays honest.
 */
const isUsefulPropertyPhoto = (depicts) => depicts !== 'signage';

/** Classify a photo by what it shows, from its title. Drives gallery variety. */
function classify(title) {
  const t = title.toLowerCase();
  if (/pool|lagoon|swimming/.test(t)) return 'pool';
  if (/beach|pantai/.test(t)) return 'beach';
  if (/room|suite|villa|bedroom|interior|bathroom/.test(t)) return 'room';
  if (/spa|massage|treatment|wellness/.test(t)) return 'spa';
  if (/restaurant|bar|lounge|dining|breakfast|buffet/.test(t)) return 'dining';
  if (/lobby|entrance|reception/.test(t)) return 'lobby';
  if (/garden|grounds|landscape|temple|facade|exterior|building|resort|hotel/.test(t)) return 'exterior';
  return 'general';
}

function tokensOf(query) {
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.includes(t));
}

// --- sources ----------------------------------------------------------------

/**
 * A network that drops a connection should not throw away a twenty-minute
 * resolve run. Every HTTP helper retries; this is the shared backoff.
 */
async function withRetry(fn, attempt = 0) {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= 4) throw error;
    await sleep(2500 * (attempt + 1));
    return withRetry(fn, attempt + 1);
  }
}

async function commonsJsonOnce(url, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const text = await res.text();
  if (text.startsWith('You are making')) {
    if (attempt < 5) {
      await sleep(6000 * (attempt + 1));
      return commonsJsonOnce(url, attempt + 1);
    }
    throw new Error('Commons rate limit');
  }
  try {
    return JSON.parse(text);
  } catch {
    if (attempt < 2) {
      await sleep(1500);
      return commonsJsonOnce(url, attempt + 1);
    }
    throw new Error('Commons returned a non-JSON response');
  }
}

/** Commons, with connection-level retries on top of the rate-limit handling. */
async function commonsJson(url) {
  return withRetry(() => commonsJsonOnce(url));
}

async function commonsSearch(query, limit = 12) {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}&gsrnamespace=6&gsrlimit=${limit}` +
    `&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1600&format=json&origin=*`;
  const data = await commonsJson(url);
  return Object.values(data.query?.pages ?? {});
}

async function commonsCategoryFiles(query, mustInclude) {
  const search = await commonsJson(
    `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}` +
      `&srnamespace=14&srlimit=8&format=json`,
  );
  // A category is only trusted when its NAME names the property. Searching
  // Commons for "Ritz-Carlton Bali" happily returns Category:The Apurva
  // Kempinski Bali, and trusting that put a Kempinski photo on a Ritz-Carlton.
  const categories = (search.query?.search ?? [])
    .map((x) => x.title)
    .filter((title) => {
      const lower = title.toLowerCase();
      return mustInclude.some((needle) => lower.includes(needle));
    });
  for (const category of categories) {
    const members = await commonsJson(
      `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers` +
        `&cmtitle=${encodeURIComponent(category)}&cmtype=file&cmlimit=30&format=json`,
    );
    const titles = (members.query?.categorymembers ?? []).map((x) => x.title);
    if (titles.length > 0) {
      const info = await commonsJson(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.slice(0, 30).join('|'))}` +
          `&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1600&format=json`,
      );
      return { category, pages: Object.values(info.query?.pages ?? {}) };
    }
  }
  return { category: null, pages: [] };
}

/**
 * Ask Commons for a live thumbnail of a file, by title or by page id.
 *
 * Openverse is an aggregator: it keeps records for Commons files that have
 * since been deleted, and the URL it hands out then 404s. When a download fails
 * we re-resolve the file against Commons itself, which is the source of truth.
 */
async function commonsThumbFor(pageUrl) {
  if (!/commons\.wikimedia\.org/.test(pageUrl)) return null;
  const fileTitle = /[?&]title=([^&]+)/.exec(pageUrl)?.[1];
  const curid = /[?&]curid=(\d+)/.exec(pageUrl)?.[1];
  if (!fileTitle && !curid) return null;
  const query = fileTitle ? `titles=${fileTitle}` : `pageids=${curid}`;
  const data = await commonsJson(
    `https://commons.wikimedia.org/w/api.php?action=query&${query}&prop=imageinfo&iiprop=url&iiurlwidth=1100&format=json`,
  );
  const pages = data?.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (info?.thumburl) return info.thumburl;
  }
  return null;
}

async function openverse(query, attempt = 0) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=12`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      if (attempt < 4) {
        await sleep(4000 * (attempt + 1));
        return openverse(query, attempt + 1);
      }
      return [];
    }
    if (!res.ok) return [];
    const text = await res.text();
    try {
      return JSON.parse(text).results ?? [];
    } catch {
      return [];
    }
  } catch {
    // A dropped connection is not "no results" — retry before giving up, or a
    // hotel silently loses its photography for this run.
    if (attempt < 4) {
      await sleep(2500 * (attempt + 1));
      return openverse(query, attempt + 1);
    }
    return [];
  }
}

// --- scoring ----------------------------------------------------------------

/**
 * A Commons file title spells "Bãi Khem" as "Bai-Khem" about as often as it
 * spells it with a space, and "JW Marriott Phu Quoc" as "Jw-marriott-phu-quoc".
 * Matching a human-written search phrase against the raw title silently dropped
 * every one of those files — including the JW Marriott's own photograph, which
 * was sitting in the results the whole time.
 */
function normalise(title) {
  return title.toLowerCase().replace(/[-_]+/g, ' ');
}

function scoreText(title, query, rules = {}) {
  const lower = normalise(title);
  if (NON_PHOTO.test(lower)) return -999;
  /*
   * A destination-level locality gate.
   *
   * Bali could get away with per-subject rules because its names are
   * distinctive: "Uluwatu", "Tanah Lot". Vietnamese names are not — "Ông Lăng",
   * "Vũng Bầu", "Dương Tơ" and "Bãi Thơm" all contain tokens that appear in
   * ordinary prose and in place names a thousand kilometres away, so a Commons
   * search for one of them returns 1946 government documents and a coal mine in
   * Poland. Subjects that export REQUIRE_LOCALITY make every candidate name this
   * destination as well as the subject; those that do not (Bali) are unchanged.
   *
   * A subject whose own name is already unique to the destination can opt out
   * with `ownName: true` — the monastery "Hộ Quốc Trúc Lâm" is on this island and
   * nowhere else, and the uploader simply did not repeat the island's name in the
   * file title. The opt-out is per subject and reviewable, like every other gate.
   */
  if (REQUIRE_LOCALITY && !rules.ownName && !REQUIRE_LOCALITY.test(lower)) return -999;
  if (rules.reject && rules.reject.test(lower)) return -999;
  if (rules.mustMatch && !rules.mustMatch.test(lower)) return -999;
  if (BLACKLIST.test(lower) && !(rules.allow && rules.allow.test(lower))) return -80;

  const wanted = tokensOf(query);
  const hits = wanted.filter((t) => lower.includes(t)).length;
  return wanted.length ? (hits / wanted.length) * 10 : 0;
}

function scoreImage(info, title, query, rules) {
  let score = scoreText(title, query, rules);
  if (score < 0) return score;
  const ar = info.width / info.height;
  if (ar >= 1.3 && ar <= 1.9) score += 6;
  else if (ar >= 1.05) score += 3;
  else score -= 4;
  if (info.width >= 2500) score += 3;
  else if (info.width >= 1600) score += 1;
  if (info.width < 1000) score -= 6;
  if (title.split(/\s+/).length > 9) score -= 2;
  return score;
}

function clean(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, '')
    // Descriptions are often truncated mid-list ("Conrad Bali & JIWA spa …"),
    // which rendered as an alt starting with a bare ampersand.
    .replace(/^[\s&\-–—,;:.]+/, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function commonsCandidate(page, query, rules, kind) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const title = page.title.replace(/^File:/, '');
  const score = scoreImage(info, title, query, rules);
  if (score <= 0) return null;
  const meta = info.extmetadata ?? {};
  return {
    title,
    score,
    width: info.width,
    height: info.height,
    thumbUrl: info.thumburl,
    pageUrl: info.descriptionurl,
    license: clean(meta.LicenseShortName?.value) || 'See source',
    author: clean(meta.Artist?.value).slice(0, 90) || 'Unknown',
    alt: tidyAlt(clean(meta.ImageDescription?.value)) || query,
    provider: 'wikimedia-commons',
    depicts: classify(title),
    kind,
  };
}




/** Title rules for a hotel; every hotel must satisfy the global reject list too. */
function hotelRules(id) {
  const own = HOTEL_TITLE_RULES[id] ?? {};
  return {
    mustMatch: own.must,
    reject: own.reject
      ? new RegExp(`${HOTEL_TITLE_REJECT.source}|${own.reject.source}`, 'i')
      : HOTEL_TITLE_REJECT,
  };
}

function openverseCandidate(result, query, rules, kind, mustInclude, areaHints = []) {
  const title = `${result.title ?? ''} ${result.description ?? ''}`.trim();
  const lower = normalise(title);
  if (!mustInclude.some((needle) => lower.includes(needle))) return null;
  if (HOTEL_TITLE_REJECT.test(lower)) return null;
  // "St Regis wine" is a real match on the name and nothing to do with the
  // property. Require a location signal too.
  if (!LOCALITY_HINT.test(lower) && !areaHints.some((h) => lower.includes(h))) return null;
  let score = scoreText(title, query, rules);
  if (score <= 0) return null;
  const w = result.width ?? 0;
  const h = result.height ?? 0;
  if (w && h) {
    const ar = w / h;
    if (ar >= 1.2 && ar <= 2.0) score += 5;
    else if (ar < 1) score -= 4;
  }
  return {
    title: clean(title).slice(0, 120),
    score: score + 2,
    width: w,
    height: h,
    thumbUrl: result.url,
    pageUrl: result.foreign_landing_url ?? result.url,
    license: `${(result.license ?? 'cc').toUpperCase()} ${result.license_version ?? ''}`.trim(),
    author: clean(result.creator ?? 'Unknown').slice(0, 90),
    alt: clean(result.title ?? query).slice(0, 180),
    provider: 'openverse',
    depicts: classify(title),
    kind,
  };
}

// --- resolution -------------------------------------------------------------


async function resolveHotel(id, name, mustInclude, queries) {
  const areaHints = LOCALITY_HINTS[id] ?? [];
  const rules = hotelRules(id);
  const pool = [];

  // 1. The property's own Commons category — membership is the verification,
  //    and the category name itself must name the property.
  const { category, pages } = await commonsCategoryFiles(name, mustInclude);
  for (const page of pages) {
    // The category is named after the property and holds its photos, so the
    // locality words are already implied. Only the reject list applies.
    const candidate = commonsCandidate(page, name, { reject: HOTEL_TITLE_REJECT }, 'hotel');
    if (candidate) pool.push({ ...candidate, score: candidate.score + 14, viaCategory: category });
  }
  await sleep(150);

  // 2. Commons keyword search, restricted to files that actually name the property.
  for (const query of queries) {
    const pages2 = await commonsSearch(query, 10);
    for (const page of pages2) {
      const title = normalise(page.title.replace(/^File:/, ''));
      if (!mustInclude.some((needle) => title.includes(needle))) continue;
      const candidate = commonsCandidate(page, query, rules, 'hotel');
      if (candidate) pool.push(candidate);
    }
    await sleep(150);
  }

  // 3. Openverse — where real pool, room and spa photography tends to live.
  for (const query of [name, `${name} pool`, `${name} room`, `${name} resort`]) {
    const results = await openverse(query);
    for (const result of results) {
      const candidate = openverseCandidate(result, query, rules, 'hotel', mustInclude, areaHints);
      if (candidate) pool.push(candidate);
    }
    await sleep(1100);
  }

  return pool;
}

async function resolveSimple(id, kind, queries) {
  const pool = [];
  const rules = SUBJECT_RULES[id] ?? {};
  for (const query of queries) {
    const pages = await commonsSearch(query, 10);
    for (const page of pages) {
      const candidate = commonsCandidate(page, query, rules, kind);
      if (candidate) pool.push(candidate);
    }
    await sleep(150);
  }
  return pool;
}

/** Deduplicate and diversify: prefer different `depicts` values for the same subject. */
/**
 * Alt text arrives from HTML descriptions, which are frequently truncated
 * mid-sentence ("Conrad Bali & JIWA spa …"). A leading punctuation mark reads
 * as garbage to a screen reader, so it is trimmed at emit time as well as at
 * resolve time — the candidate cache may predate the rule.
 */
function tidyAlt(text) {
  return String(text ?? '')
    .replace(/^[\s&\-–—,;:.]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function normaliseTitle(title) {
  return title
    .toLowerCase()
    .replace(/^file:/, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 48);
}

function pickBest(pool, max) {
  const seenTitles = new Set();
  const sorted = pool
    .filter((c) => {
      // The same photo arrives from Commons as "File:X.jpg" and from Openverse
      // as "X", which produced duplicate cards for the same Westin image.
      const key = normaliseTitle(c.title);
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score);

  const chosen = [];
  const usedDepicts = new Set();
  for (const candidate of sorted) {
    if (chosen.length >= max) break;
    if (usedDepicts.has(candidate.depicts) && sorted.length > max) continue;
    usedDepicts.add(candidate.depicts);
    chosen.push(candidate);
  }
  for (const candidate of sorted) {
    if (chosen.length >= max) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen;
}

async function main() {
  const mode = process.argv.includes('--download') ? 'download' : 'resolve';

  if (mode === 'resolve') {
    mkdirSync(CACHE_DIR, { recursive: true });
    const out = [];

    console.log(`${DESTINATION_LABEL} — subjects from scripts/images/subjects/${DESTINATION}.mjs`);
    console.log('--- hotels (property photography only) ---');
    for (const [index, [id, name, mustInclude, queries]] of HOTELS.entries()) {
      const pool = await resolveHotel(id, name, mustInclude, queries);
      const chosen = pickBest(pool, 3);
      out.push({ id, kind: 'hotel', name, chosen: chosen.map(stripInternal) });
      console.log(
        `[${String(index + 1).padStart(2)}/${HOTELS.length}] ${chosen.length ? '✓' : '✗'} ${id.padEnd(48)} ${chosen
          .map((c) => c.depicts)
          .join(', ') || 'NO PROPERTY PHOTOGRAPHY'}`,
      );
      await sleep(300);
    }

    console.log('\n--- areas ---');
    for (const [index, [id, queries]] of AREAS.entries()) {
      const pool = await resolveSimple(id, 'area', queries);
      const chosen = pickBest(pool, 3);
      out.push({ id, kind: 'area', chosen: chosen.map(stripInternal) });
      console.log(`[${String(index + 1).padStart(2)}/${AREAS.length}] ${chosen.length} ${id}`);
    }

    console.log('\n--- places ---');
    for (const [index, [id, queries]] of PLACES.entries()) {
      const pool = await resolveSimple(id, 'place', queries);
      const chosen = pickBest(pool, 2);
      out.push({ id, kind: 'place', chosen: chosen.map(stripInternal) });
      console.log(`[${String(index + 1).padStart(2)}/${PLACES.length}] ${chosen.length} ${id}`);
    }

    writeFileSync(REVIEW, JSON.stringify(out, null, 2));
    const hotelsWith = out.filter((e) => e.kind === 'hotel' && e.chosen.length > 0).length;
    console.log(`\nhotels with real property photography: ${hotelsWith}/${HOTELS.length}`);
    console.log(`total images: ${out.reduce((n, e) => n + e.chosen.length, 0)}`);
    console.log(`review file: ${REVIEW}`);
    return;
  }

  // --- download -------------------------------------------------------------
  const candidates = JSON.parse(readFileSync(REVIEW, 'utf8'));
  mkdirSync(IMAGE_DIR, { recursive: true });
  const manifest = [];
  let downloaded = 0;
  const credited = new Set();

  for (const entry of candidates) {
    // Download in candidate order so file names stay stable between runs, then
    // decide hero/gallery from what the photographs actually show.
    const usable = [];
    let excluded = 0;
    for (const [index, candidate] of entry.chosen.entries()) {
      const file = `${entry.kind}-${entry.id}-${index}.jpg`;
      const target = join(IMAGE_DIR, file);
      const depicts = depictsOf(candidate);
      // Decide before downloading: shipping a file that no manifest entry
      // references leaves an orphan on disk for no reason.
      if (!isUsefulPropertyPhoto(depicts)) {
        excluded += 1;
        continue;
      }
      if (!existsSync(target)) {
        try {
          let res = await fetch(candidate.thumbUrl, { headers: { 'User-Agent': UA } });
          if (!res.ok) {
            // Openverse keeps records for Commons files that have since been
            // deleted, and hands out a URL that 404s. Commons is the source of
            // truth, so ask it directly before giving up.
            const fallback = await commonsThumbFor(candidate.pageUrl);
            if (fallback) res = await fetch(fallback, { headers: { 'User-Agent': UA } });
          }
          if (!res.ok) {
            console.warn(
              `  ! ${file}: HTTP ${res.status} — the source file is gone; dropping it rather than shipping a broken image`,
            );
            continue;
          }
          const buf = Buffer.from(await res.arrayBuffer());
          const tmp = join('/tmp', `mm-${file}`);
          writeFileSync(tmp, buf);
          execFileSync(
            'sips',
            ['-s', 'format', 'jpeg', '-s', 'formatOptions', '68', '-Z', '1100', tmp, '--out', target],
            { stdio: 'ignore' },
          );
          downloaded += 1;
        } catch (error) {
          console.warn(`  ! ${file}: ${error.message}`);
          continue;
        }
      }
      usable.push({ candidate, file, depicts });
    }

    if (excluded > 0) {
      console.log(
        `  – ${entry.id}: ${excluded} signage photo(s) excluded — a photograph of the resort's name is not property photography`,
      );
    }

    usable.sort(
      (a, b) =>
        (DEPICTS_RANK[a.depicts] ?? 8) - (DEPICTS_RANK[b.depicts] ?? 8) ||
        (a.file < b.file ? -1 : 1),
    );

    for (const [position, item] of usable.entries()) {
      const { candidate, file, depicts } = item;
      credited.add(`${candidate.provider}|${candidate.license}`);
      manifest.push({
        id: `${entry.kind}-${entry.id}-${position}`,
        ownerKind: entry.kind,
        ownerId: entry.id,
        file,
        role: position === 0 ? 'hero' : 'gallery',
        depicts,
        alt: tidyAlt(candidate.alt),
        source: {
          provider: candidate.provider,
          pageUrl: candidate.pageUrl,
          license: candidate.license,
          author: candidate.author,
        },
      });
      console.log(`  \u2713 ${file} (${depicts})`);
    }
  }

  writeFileSync(MANIFEST_CACHE, JSON.stringify(manifest, null, 2));
  emitManifest(manifest);

  const hotelSubjects = new Set(manifest.filter((e) => e.ownerKind === 'hotel').map((e) => e.ownerId));
  const dropped = candidates
    .filter((entry) => entry.kind === 'hotel' && entry.chosen.length > 0 && !hotelSubjects.has(entry.id))
    .map((entry) => entry.id);
  if (dropped.length > 0) {
    console.log(`dropped after link check (source file no longer exists): ${dropped.join(', ')}`);
  }
  console.log(`\nnew downloads: ${downloaded}; manifest entries: ${manifest.length}`);
  console.log('licences in use:', [...credited].sort().join(', '));
}

function stripInternal(candidate) {
  const { score, viaCategory, ...rest } = candidate;
  void score;
  void viaCategory;
  return rest;
}

function emitManifest(manifest) {
  const lines = [];
  lines.push('/**');
  lines.push(` * ${DESTINATION.toUpperCase()} PHOTOGRAPHY — generated by scripts/fetch-destination-images.mjs.`);
  lines.push(' *');
  lines.push(' * Sources: Wikimedia Commons (places, areas, a few properties) and Openverse');
  lines.push(' * (Flickr and other CC repositories, which is where hotel interior photography');
  lines.push(' * tends to live). Every image carries its licence, author and source page, and');
  lines.push(' * the UI renders that credit. Licences are restricted to those permitting');
  lines.push(' * commercial use — no NC or ND.');
  lines.push(' *');
  lines.push(' * HOTELS: a hotel only has images if they were verified to be THAT property —');
  lines.push(' * either by membership of its Commons category (whose name must itself name the');
  lines.push(' * property) or by the property name appearing in the file title together with a');
  lines.push(' * Bali locality. A hotel with no verified photography has no entry here and the');
  lines.push(' * card says "No property photography available". It never borrows its area photo,');
  lines.push(' * because that would imply a beach is the hotel.');
  lines.push(' *');
  lines.push(' * `depicts` records what a photo shows — pool, room, beach, dining, exterior — and');
  lines.push(' * drives gallery variety so two images of one hotel are not two of the same thing.');
  lines.push(' *');
  lines.push(` * Subjects and their verification rules: scripts/images/subjects/${DESTINATION}.mjs`);
  lines.push(` * Regenerate: npm run images:resolve -- --destination ${DESTINATION} && npm run images:download -- --destination ${DESTINATION}`);
  lines.push(' */');
  lines.push('');
  lines.push("import type { PlaceImage } from '../../types';");
  lines.push('');
  lines.push(`export const ${MANIFEST_CONST}: Record<string, PlaceImage[]> = {`);

  const grouped = new Map();
  for (const entry of manifest) {
    const key = `${entry.ownerKind}:${entry.ownerId}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  }

  for (const [key, entries] of grouped) {
    lines.push(`  '${key}': [`);
    for (const entry of entries) {
      lines.push('    {');
      lines.push(`      id: '${entry.id}',`);
      lines.push(`      url: '/images/${DESTINATION}/${entry.file}',`);
      lines.push(`      alt: ${JSON.stringify(entry.alt)},`);
      lines.push(`      role: '${entry.role}',`);
      lines.push("      subject: 'subject',");
      lines.push(`      depicts: ${JSON.stringify(entry.depicts)},`);
      lines.push('      source: {');
      lines.push(`        provider: ${JSON.stringify(entry.source.provider)},`);
      if (entry.source.pageUrl) lines.push(`        pageUrl: ${JSON.stringify(entry.source.pageUrl)},`);
      lines.push(`        license: ${JSON.stringify(entry.source.license)},`);
      lines.push(`        author: ${JSON.stringify(entry.source.author)},`);
      lines.push('      },');
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');
  mkdirSync(join(ROOT, 'lib', 'data', 'images'), { recursive: true });
  const target = join(ROOT, 'lib', 'data', 'images', `${DESTINATION}-images.ts`);
  writeFileSync(target, lines.join('\n'));
  console.log(`emitted → lib/data/images/${DESTINATION}-images.ts`);
}

main();
