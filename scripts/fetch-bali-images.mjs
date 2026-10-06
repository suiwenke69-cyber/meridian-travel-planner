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
 *   node scripts/fetch-bali-images.mjs             # resolve candidates
 *   node scripts/fetch-bali-images.mjs --download  # fetch, resize, emit manifest
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const UA = 'MeridianTravelPlanner/1.0 (https://example.invalid; educational demo)';
const ROOT = process.cwd();
const IMAGE_DIR = join(ROOT, 'public', 'images', 'bali');
const CACHE_DIR = join(ROOT, 'scripts', '.cache');
const REVIEW = join(CACHE_DIR, 'bali-image-candidates.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- subjects ---------------------------------------------------------------

const HOTELS = [
  ['the-st-regis-bali-resort', 'The St. Regis Bali Resort', ['st regis'], ['St. Regis Bali Resort', 'St Regis Bali']],
  ['the-ritz-carlton-bali', 'The Ritz-Carlton, Bali', ['ritz-carlton', 'ritz carlton'], ['Ritz Carlton Bali', 'Ritz-Carlton Bali']],
  ['w-bali-seminyak', 'W Bali - Seminyak', ['w retreat', 'w bali', 'w hotel bali'], ['W Retreat and Spa Bali', 'W Bali Seminyak']],
  ['the-laguna-luxury-collection', 'The Laguna, a Luxury Collection Resort & Spa', ['laguna'], ['Laguna Resort Nusa Dua Bali']],
  ['the-westin-resort-nusa-dua-bali', 'The Westin Resort Nusa Dua, Bali', ['westin'], ['Westin Resort Nusa Dua Bali']],
  ['sheraton-bali-kuta-resort', 'Sheraton Bali Kuta Resort', ['sheraton'], ['Sheraton Bali Kuta']],
  ['renaissance-bali-uluwatu-resort-and-spa', 'Renaissance Bali Uluwatu Resort & Spa', ['renaissance'], ['Renaissance Bali Uluwatu']],
  ['renaissance-bali-nusa-dua-resort', 'Renaissance Bali Nusa Dua Resort', ['renaissance'], ['Renaissance Bali Nusa Dua']],
  ['le-meridien-bali-jimbaran', 'Le Méridien Bali Jimbaran', ['meridien', 'méridien'], ['Le Meridien Bali Jimbaran']],
  ['four-points-by-sheraton-bali-kuta', 'Four Points by Sheraton Bali, Kuta', ['four points'], ['Four Points Sheraton Bali Kuta']],
  ['four-points-by-sheraton-bali-ungasan', 'Four Points by Sheraton Bali, Ungasan', ['four points'], ['Four Points Sheraton Bali Ungasan']],
  ['aloft-bali-seminyak', 'Aloft Bali Seminyak', ['aloft'], ['Aloft Bali Seminyak']],
  ['aloft-bali-kuta-at-beachwalk', 'Aloft Bali Kuta at Beachwalk', ['aloft', 'beachwalk'], ['Aloft Bali Kuta Beachwalk']],
  ['the-stones-hotel-legian-bali-autograph-collection', 'The Stones Hotel - Legian Bali, Autograph Collection', ['stones'], ['Stones Hotel Legian Bali']],
  ['conrad-bali', 'Conrad Bali', ['conrad'], ['Conrad Bali']],
  ['hilton-bali-resort', 'Hilton Bali Resort', ['hilton bali'], ['Hilton Bali Resort Nusa Dua']],
  ['umana-bali-lxr-hotels-and-resorts', 'Umana Bali, LXR Hotels & Resorts', ['umana'], ['Umana Bali LXR']],
  ['hilton-garden-inn-bali-nusa-dua', 'Hilton Garden Inn Bali Nusa Dua', ['hilton garden inn'], ['Hilton Garden Inn Bali Nusa Dua']],
  ['hilton-garden-inn-bali-ngurah-rai-airport', 'Hilton Garden Inn Bali Ngurah Rai Airport', ['hilton garden inn'], ['Hilton Garden Inn Ngurah Rai']],
  ['courtyard-bali-seminyak', 'Courtyard by Marriott Bali Seminyak Resort', ['courtyard'], ['Courtyard Marriott Bali Seminyak']],
];

const AREAS = [
  ['canggu', ['Canggu beach Bali', 'Batu Bolong Beach Canggu', 'Berawa Beach Bali']],
  ['seminyak', ['Seminyak Beach Bali', 'Petitenget Beach Bali', 'Seminyak Bali street']],
  ['ubud', ['Ubud Bali rice terrace', 'Ubud Palace Bali', 'Tegallalang rice terrace', 'Ubud Bali market']],
  ['uluwatu', ['Uluwatu Temple', 'Pura Luhur Uluwatu', 'Uluwatu Bali cliff']],
  ['nusa-dua', ['Nusa Dua Bali beach', 'Nusa Dua Bali resort', 'Nusa Dua Bali']],
  ['sanur', ['Sanur Beach Bali', 'Sanur Bali beach', 'Sanur Bali']],
  ['kuta-legian', ['Kuta Beach Bali', 'Legian Beach Bali', 'Kuta Bali']],
  ['jimbaran', ['Jimbaran Bay Bali', 'Jimbaran Bali beach', 'Jimbaran Bali']],
  ['amed', ['Amed Bali', 'Jemeluk Bay Bali', 'Amed Bali beach']],
  ['kintamani', ['Mount Batur', 'Kintamani Bali', 'Lake Batur Bali']],
  ['nusa-penida', ['Kelingking Beach Nusa Penida', 'Nusa Penida', 'Diamond Beach Nusa Penida']],
  ['tampaksiring', ['Tirta Empul', 'Tampaksiring Bali', 'Gunung Kawi']],
  ['denpasar', ['Denpasar Bali', 'Bajra Sandhi Monument', 'Pasar Badung Bali']],
  ['tabanan', ['Jatiluwih rice terrace', 'Tabanan Bali', 'Pura Luhur Batukaru']],
  ['karangasem', ['Tirta Gangga', 'Besakih Temple', 'Karangasem Bali']],
];

/*
 * Places we deliberately do not search for photography.
 *
 * `sunset-road`, `ubung-bus-terminal`, `beachwalk-kuta-pickup` and
 * `seminyak-village-pickup` are logistical waypoints — a road strip, a bus
 * station and two meeting points. Any photograph we could find for them would be
 * a stand-in for "somewhere in Kuta", which is exactly the kind of borrowed
 * imagery this pipeline exists to prevent. Their cards say "no photo of this
 * place yet", which is true.
 */
const PLACES = [
  ['uluwatu-temple', ['Uluwatu Temple Bali', 'Pura Luhur Uluwatu']],
  ['tanah-lot', ['Tanah Lot', 'Tanah Lot Temple']],
  ['tegallalang-rice-terrace', ['Tegallalang rice terrace', 'Tegallalang Bali']],
  ['jatiluwih-rice-terrace', ['Jatiluwih rice terrace', 'Jatiluwih Bali']],
  ['mount-batur', ['Mount Batur', 'Mount Batur sunrise', 'Batur caldera']],
  ['tegenungan-waterfall', ['Tegenungan waterfall', 'Tegenungan Bali']],
  ['campuhan-ridge-walk', ['Campuhan ridge walk', 'Campuhan Ubud']],
  ['sacred-monkey-forest', ['Ubud Monkey Forest', 'Sacred Monkey Forest Sanctuary']],
  ['tirta-empul', ['Tirta Empul', 'Tirta Empul temple']],
  ['besakih-temple', ['Besakih Temple', 'Pura Besakih']],
  ['kintamani-viewpoint', ['Kintamani Bali', 'Mount Batur caldera', 'Penelokan']],
  ['mount-agung', ['Mount Agung Bali', 'Gunung Agung Bali']],
  ['mount-batur-sunrise-trek', ['Mount Batur trekking', 'Toya Bungkah', 'Pura Jati Batur']],
  ['balinese-cooking-class', ['Balinese cooking class', 'Balinese cuisine Ubud']],
  ['bebek-bengil', ['Bebek Bengil Ubud', 'Dirty Duck Diner Bali']],
  ['warung-mak-beng', ['Warung Mak Beng Sanur', 'Sanur Bali food']],
  ['kelingking-viewpoint', ['Kelingking Beach', 'Kelingking Nusa Penida']],
  ['kuta-beach', ['Kuta Beach Bali', 'Kuta Bali beach']],
  ['seminyak-beach', ['Seminyak Beach Bali', 'Seminyak beach']],
  ['nusa-dua-beach', ['Nusa Dua Beach Bali', 'Nusa Dua beach']],
  ['pandawa-beach', ['Pandawa Beach Bali', 'Pantai Pandawa']],
  ['melasti-beach', ['Melasti Beach Bali', 'Pantai Melasti Ungasan']],
  ['padang-padang-beach', ['Padang Padang Beach', 'Padang Padang Bali']],
  ['bingin-beach', ['Bingin Beach Bali', 'Bingin Bali']],
  ['balangan-beach', ['Balangan Beach Bali', 'Balangan Bali']],
  ['sanur-beach', ['Sanur Beach Bali', 'Sanur Bali beach']],
  ['jimbaran-beach', ['Jimbaran Bay', 'Jimbaran Bali']],
  ['jemeluk-beach', ['Amed Bali', 'Jemeluk Bay Bali']],
  ['ubud-palace', ['Ubud Palace', 'Puri Saren Agung']],
  ['ubud-art-market', ['Ubud Art Market', 'Ubud market Bali']],
  ['bali-swing', ['Bali Swing Ubud', 'Ayung river Bali']],
  ['ayung-river-rafting', ['Ayung River rafting', 'Ayung River Bali']],
  ['potato-head-beach-club', ['Potato Head Beach Club Bali', 'Seminyak beach club']],
  ['finns-beach-club', ['Finns Beach Club Bali', 'Berawa Beach Bali']],
  ['atlas-beach-fest', ['Atlas Beach Fest Bali', 'Berawa Beach Bali']],
  ['ku-de-ta', ['Ku De Ta Bali', 'Seminyak beach sunset']],
  ['warung-ibu-oka', ['Babi guling', 'Balinese food']],
  ['naughty-nuris-ubud', ['Balinese food', 'Ubud restaurant']],
  ['menega-cafe', ['Jimbaran seafood', 'Jimbaran Bay seafood']],
  ['single-fin', ['Uluwatu cliff sunset', 'Suluban Beach Bali']],
  ['old-mans', ['Batu Bolong Beach Canggu', 'Canggu Bali sunset']],
  ['la-plancha', ['Double Six Beach Bali', 'Seminyak beach sunset']],
  ['sanur-harbour', ['Sanur harbour Bali', 'Sanur Bali boat']],
  ['padangbai-harbour', ['Padang Bai Bali', 'Padangbai harbour']],
];

// --- rules ------------------------------------------------------------------

const BLACKLIST =
  /\b(logo|coat[ _]of[ _]arms|flag|map|diagram|chart|graph|poster|banknote|stamp|sign|signage|screenshot|insect|spider|bird|cormorant|snake|lizard|frog|butterfly|portrait|selfie|modeling|fashion|puppies|puppy|dog|dogs|pipeline|pipelines|lng|turbine|construction|protest|parade|cremation|menu|receipt)\b/i;
const NON_PHOTO = /\.(svg|png|gif|tif|tiff|webm|ogv|pdf)$/i;

const SUBJECT_RULES = {
  'sacred-monkey-forest': { allow: /monkey|macaque|macaca/i },
  'kintamani-viewpoint': { mustMatch: /kintamani|batur|caldera|penelokan/i },
  'ku-de-ta': { mustMatch: /seminyak|petitenget|ku de ta|kudeta/i },
  'atlas-beach-fest': { mustMatch: /atlas|berawa|canggu/i },
  'bingin-beach': { mustMatch: /bingin|pecatu|uluwatu/i },
  'ubud-art-market': { mustMatch: /market|pasar|ubud/i, reject: /palace|puri/i },
};

/**
 * Corrections applied after looking at the actual photographs.
 *
 * Title-based classification cannot tell a photograph of a resort's pool deck
 * from a photograph of the lettering above its entrance: both are titled
 * "Conrad Bali". Two of the properties we hold had a dark signage wall sitting
 * in the hero slot because the words "resort & spa" appear in the filename.
 * These are read off the images themselves, once, and recorded here.
 */
const DEPICTS_OVERRIDE = {
  'Conrad bali resort & spa (2940555041).jpg': 'signage',
  'Conrad Bali (2941410760).jpg': 'room',
  'Conrad Bali JIWA spa treatment room (2941411134).jpg': 'grounds',
  'Westin Resort Nusa Dua Bali (4540094068).jpg': 'signage',
  'W Hotel Bali (6924463930).jpg': 'pool',
  'W Hotel Bali (6924462698).jpg': 'exterior',
};

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
    .filter((t) => t.length > 2 && !['bali', 'the', 'and', 'beach'].includes(t));
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

function scoreText(title, query, rules = {}) {
  const lower = title.toLowerCase();
  if (NON_PHOTO.test(lower)) return -999;
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

/**
 * A location signal that actually means Bali.
 *
 * "File:Four Points by Sheraton Taipei Bali 01.jpg" is a hotel in New Taipei
 * City, in a district called Bali. A regex that merely looks for the letters
 * "bali" accepted it, and the same trick hides "Blanco Renaissance Museum Ubud
 * Bali" behind the word "renaissance".
 */
const BALI_HINT =
  /(nusa dua|seminyak|kuta|ubud|jimbaran|uluwatu|sanur|legian|benoa|ungasan|petitenget|berawa|canggu|tanjung|sawangan|melasti|tanah lot|ngurah rai)/i;

/** Titles that contain a property's name but are a different property or not a hotel. */
const HOTEL_TITLE_REJECT =
  /(taipei|new taipei|museum|blanco|nirwana|stepping stones|panoramio|logo|coat[ _]of[ _]arms|airport hotel|bandara)/i;

/**
 * Per-property title rules.
 *
 * A hotel photo may only be used if its own file title names BOTH the property
 * and the right part of Bali. Without this, "Le Meridien Nirwana Bali" (a
 * different resort, in Tabanan) passes for "Le Méridien Bali Jimbaran", and
 * "Hilton Garden Inn" photos pass for "Hilton Bali Resort" — both of which are
 * how a card ends up showing a hotel the traveller is not looking at.
 */
const HOTEL_TITLE_RULES = {
  'the-st-regis-bali-resort': { must: /st\.?\s?regis.{0,40}(bali|nusa dua|sawangan)/i },
  'the-ritz-carlton-bali': { must: /ritz.{0,28}carlton.{0,40}(bali|nusa dua|sawangan)/i },
  'w-bali-seminyak': { must: /\bw\b.{0,28}(bali|retreat|seminyak|petitenget)/i, reject: /w hotel taipei|washington/i },
  'the-laguna-luxury-collection': { must: /laguna.{0,40}(nusa dua|bali)/i },
  'the-westin-resort-nusa-dua-bali': { must: /westin.{0,40}(nusa dua|bali)/i },
  'sheraton-bali-kuta-resort': { must: /sheraton.{0,40}(bali|kuta)/i },
  'renaissance-bali-uluwatu-resort-and-spa': { must: /renaissance.{0,40}(bali|uluwatu|ungasan)/i },
  'renaissance-bali-nusa-dua-resort': { must: /renaissance.{0,40}(bali|nusa dua)/i },
  'le-meridien-bali-jimbaran': { must: /m[ée]ridien.{0,40}(bali\s?jimbaran|jimbaran)/i },
  'four-points-by-sheraton-bali-kuta': { must: /four points.{0,44}(bali|kuta)/i },
  'four-points-by-sheraton-bali-ungasan': { must: /four points.{0,44}(bali|ungasan)/i },
  'aloft-bali-seminyak': { must: /aloft.{0,40}(bali|seminyak|batu belig)/i },
  'aloft-bali-kuta-at-beachwalk': { must: /aloft.{0,40}(bali|kuta|beachwalk)/i },
  'the-stones-hotel-legian-bali-autograph-collection': { must: /stones.{0,28}(hotel|legian|bali)/i, reject: /pond|stepping/i },
  'conrad-bali': { must: /conrad.{0,40}(bali|benoa|nusa dua)/i },
  'hilton-bali-resort': { must: /hilton.{0,20}(bali resort|bali|nusa dua)/i, reject: /garden inn/i },
  'umana-bali-lxr-hotels-and-resorts': { must: /umana.{0,40}(bali|ungasan|uluwatu|lxr)/i },
  'hilton-garden-inn-bali-nusa-dua': { must: /hilton garden inn.{0,40}(bali|nusa dua)/i },
  'hilton-garden-inn-bali-ngurah-rai-airport': { must: /hilton garden inn.{0,40}(bali|ngurah rai|airport)/i },
  'courtyard-bali-seminyak': { must: /courtyard.{0,40}(bali|seminyak)/i },
};

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
  const lower = title.toLowerCase();
  if (!mustInclude.some((needle) => lower.includes(needle))) return null;
  if (HOTEL_TITLE_REJECT.test(lower)) return null;
  // "St Regis wine" is a real match on the name and nothing to do with the
  // property. Require a location signal too.
  if (!BALI_HINT.test(lower) && !areaHints.some((h) => lower.includes(h))) return null;
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

/** Locality words that legitimately appear in a property's photo titles. */
const LOCALITY_HINTS = {
  'the-st-regis-bali-resort': ['nusa dua', 'benoa', 'sawangan'],
  'the-ritz-carlton-bali': ['sawangan', 'nusa dua'],
  'w-bali-seminyak': ['petitenget', 'seminyak', 'kerobokan'],
  'the-laguna-luxury-collection': ['nusa dua', 'benoa'],
  'the-westin-resort-nusa-dua-bali': ['nusa dua'],
  'sheraton-bali-kuta-resort': ['kuta'],
  'renaissance-bali-uluwatu-resort-and-spa': ['uluwatu', 'ungasan', 'balangan'],
  'renaissance-bali-nusa-dua-resort': ['nusa dua', 'benoa'],
  'le-meridien-bali-jimbaran': ['jimbaran'],
  'four-points-by-sheraton-bali-kuta': ['kuta'],
  'four-points-by-sheraton-bali-ungasan': ['ungasan', 'uluwatu'],
  'aloft-bali-seminyak': ['seminyak', 'batu belig'],
  'aloft-bali-kuta-at-beachwalk': ['kuta', 'beachwalk'],
  'the-stones-hotel-legian-bali-autograph-collection': ['legian'],
  'conrad-bali': ['tanjung benoa', 'benoa', 'nusa dua'],
  'hilton-bali-resort': ['nusa dua', 'sawangan'],
  'umana-bali-lxr-hotels-and-resorts': ['ungasan', 'melasti', 'uluwatu'],
  'hilton-garden-inn-bali-nusa-dua': ['nusa dua'],
  'hilton-garden-inn-bali-ngurah-rai-airport': ['ngurah rai', 'tuban', 'kuta'],
  'courtyard-bali-seminyak': ['seminyak'],
};

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
      const title = page.title.replace(/^File:/, '').toLowerCase();
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

  writeFileSync(join(CACHE_DIR, 'bali-image-manifest.json'), JSON.stringify(manifest, null, 2));
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
  lines.push(' * BALI PHOTOGRAPHY — generated by scripts/fetch-bali-images.mjs.');
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
  lines.push(' * Regenerate: npm run images:resolve && npm run images:download');
  lines.push(' */');
  lines.push('');
  lines.push("import type { PlaceImage } from '../../types';");
  lines.push('');
  lines.push('export const BALI_IMAGES: Record<string, PlaceImage[]> = {');

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
      lines.push(`      url: '/images/bali/${entry.file}',`);
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
  writeFileSync(join(ROOT, 'lib', 'data', 'images', 'bali-images.ts'), lines.join('\n'));
  console.log('emitted → lib/data/images/bali-images.ts');
}

main();
