/**
 * Name normalisation for place matching.
 *
 * THE PROBLEM THIS SOLVES
 * -----------------------
 * A guide says "La Brisa". Another says "La Brisa Bali". A third says
 * "La Brisa Beach Club, Canggu". A naive importer treats those as three places,
 * and the map ends up with three pins on the same roof — which is exactly the
 * duplicate problem this layer exists to prevent.
 *
 * So a name is reduced to a stable key: lowercase, accents folded, punctuation
 * dropped, and *locational and categorical noise* removed. "Bali" in "La Brisa
 * Bali" is not part of the name; it is the island the reader already knows they
 * are on. Same for "Canggu" and "Beach Club" when the canonical name does not
 * contain them.
 *
 * The reduction is deliberately conservative: only whole tokens are dropped, and
 * only from a fixed list, because over-normalising collapses genuinely different
 * venues ("Ubud Coffee" and "Ubud Warung" must not become the same key).
 */

/**
 * Tokens that carry no identity.
 *
 * Two groups: the island and its regions (a guide writes them for the reader,
 * not to name the venue), and generic venue words that the canonical name may or
 * may not include.
 */
const NOISE_TOKENS = new Set([
  // island + country
  'bali', 'indonesia', 'id',
  // regions and villages — used as qualifiers far more often than as names
  'ubud', 'canggu', 'seminyak', 'kuta', 'legian', 'petitenget', 'oberoi', 'uluwatu',
  'ungasan', 'pecatu', 'jimbaran', 'sanur', 'nusadua', 'benoa', 'tanjungbenoa',
  'denpasar', 'kerobokan', 'berawa', 'batubolong', 'echo', 'amed', 'tabanan',
  'kintamani', 'penida', 'nusapenida',
  // generic venue words
  'restaurant', 'resto', 'cafe', 'coffee', 'warung', 'bar', 'beachclub', 'club',
  'bistro', 'eatery', 'kitchen', 'diner', 'grill', 'house', 'hotel', 'resort',
  'spa', 'villa', 'studio', 'shop', 'store',
]);

/** Leading articles that are part of the name's music but not its identity. */
const ARTICLES = new Set(['the', 'le', 'la', 'les', 'el', 'il', 'de', 'da', 'di']);

export function foldAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Lowercase, fold accents, drop punctuation, collapse whitespace. */
export function basicNormalize(value: string): string {
  return foldAccents(value)
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * CJK handling.
 *
 * Chinese names have no spaces, so token-based tricks do nothing. They are
 * normalised by stripping punctuation and the Chinese words for the same noise
 * ("巴厘岛", "餐厅", "海滩俱乐部"), and matching then uses character n-grams.
 */
const CJK_NOISE = [
  '巴厘岛', '巴厘', '印度尼西亚', '印尼',
  '乌布', '长谷', '水明漾', '库塔', '雷吉安', '乌鲁瓦图', '金巴兰', '沙努尔', '努沙杜瓦', '登巴萨',
  '餐厅', '饭店', '咖啡', '咖啡馆', '酒吧', '海滩俱乐部', '酒店', '度假村', '水疗',
];

export function isCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

export function normalizeCjk(value: string): string {
  let out = value.replace(/[^\p{Letter}\p{Number}]+/gu, '');
  for (const noise of CJK_NOISE) out = out.split(noise).join('');
  return out;
}

/**
 * Loose key — the name with locational and categorical noise stripped.
 *
 * `La Brisa Beach Club, Canggu` and `La Brisa Bali` both reduce to `brisa`.
 */
export function normalizePlaceName(value: string): string {
  const raw = (value ?? '').trim();
  if (raw.length === 0) return '';
  if (isCjk(raw) && !/[a-z]/i.test(raw)) return normalizeCjk(raw);

  const tokens = basicNormalize(raw).split(' ').filter(Boolean);
  const kept = tokens.filter((t) => !NOISE_TOKENS.has(t));
  // Never reduce to nothing: "The Bali" is a silly name but it is still a name.
  const meaningful = kept.length > 0 ? kept : tokens;
  const withoutArticles = meaningful.filter((t) => !ARTICLES.has(t));
  const finalTokens = withoutArticles.length > 0 ? withoutArticles : meaningful;
  return finalTokens.join('');
}

/**
 * Strict key — punctuation and accents folded, nothing else.
 *
 * Needed because noise stripping is destructive on names that legitimately
 * CONTAIN a region word. "Uluwatu Temple" is the name of a temple, and reducing
 * it to "temple" made it unmatchable against its own canonical record. Strict
 * equality and strict token containment catch those; the loose key catches
 * guide-speak.
 */
export function strictKey(value: string): string {
  const raw = (value ?? '').trim();
  if (raw.length === 0) return '';
  if (isCjk(raw) && !/[a-z]/i.test(raw)) return normalizeCjk(raw);
  return basicNormalize(raw).split(' ').filter(Boolean).join('');
}

/** Strict tokens, articles and punctuation removed but region words kept. */
export function strictTokens(value: string): string[] {
  const raw = (value ?? '').trim();
  if (isCjk(raw) && !/[a-z]/i.test(raw)) return [...normalizeCjk(raw)];
  return basicNormalize(raw)
    .split(' ')
    .filter((t) => t.length > 0 && !ARTICLES.has(t));
}

/** Token set used for fuzzy scoring. Cheap, and good enough for venue names. */
export function nameTokens(value: string): string[] {
  const raw = (value ?? '').trim();
  if (isCjk(raw) && !/[a-z]/i.test(raw)) {
    return [...normalizeCjk(raw)];
  }
  return basicNormalize(raw)
    .split(' ')
    .filter((t) => t.length > 0 && !ARTICLES.has(t));
}

/** Levenshtein distance, iterative with two rows so long strings stay cheap. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length];
}

/** 0–1 similarity from edit distance, normalised by the longer string. */
export function editSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - editDistance(a, b) / longest;
}

/** Jaccard overlap of token sets — robust to word order and extra qualifiers. */
export function tokenSimilarity(a: string, b: string): number {
  const ta = new Set(nameTokens(a));
  const tb = new Set(nameTokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const token of ta) if (tb.has(token)) shared += 1;
  return shared / (ta.size + tb.size - shared);
}

/**
 * Combined similarity used by the matcher.
 *
 * Order matters. Exactness first, then containment of whole tokens, then only
 * edit distance — because edit distance on venue names is the weakest signal
 * ("La Brisa" and "La Favela" are one edit apart per token and have nothing to
 * do with each other), while token containment is the strongest short of
 * equality ("Finns" inside "Finns Beach Club" is correct; "Uluwatu Temple"
 * inside "Uluwatu Temple (Pura Luhur Uluwatu)" is correct).
 */
export function nameSimilarity(a: string, b: string): number {
  const la = normalizePlaceName(a);
  const lb = normalizePlaceName(b);
  if (la.length === 0 || lb.length === 0) return 0;
  if (strictKey(a) === strictKey(b)) return 1;
  if (la === lb) return 0.97;

  // Whole-token containment on the strict form.
  const ta = strictTokens(a);
  const tb = strictTokens(b);
  if (ta.length > 0 && tb.length > 0) {
    const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
    if (small.every((t) => large.includes(t))) {
      return 0.86 + 0.12 * (small.length / large.length);
    }
  }

  const tokenScore = tokenSimilarity(a, b);
  const looseEdit = editSimilarity(la, lb);
  const strictEdit = editSimilarity(strictKey(a), strictKey(b));
  const containment =
    la.includes(lb) || lb.includes(la) ? Math.min(la.length, lb.length) / Math.max(la.length, lb.length) : 0;

  return Math.max(looseEdit * 0.85 + tokenScore * 0.15, strictEdit * 0.9, containment * 0.8);
}
