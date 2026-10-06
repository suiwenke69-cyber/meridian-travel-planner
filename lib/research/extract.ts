import type { MentionSentiment, RecommendationType } from '../types';
import { matchPlace, type MatchTarget } from './match';
import { isCjk, normalizePlaceName } from './normalize';

/**
 * Turning a pasted guide into structured mentions.
 *
 * THREE PASSES, IN ORDER OF TRUST
 * ------------------------------
 * 1. **Dictionary.** The text is scanned for names already in the dataset,
 *    longest first so "Finns Beach Club" wins over "Finns". This is the only
 *    pass that can produce a confident match, and it is why the extractor needs
 *    the canonical place list.
 * 2. **Pattern.** Explicit structures a guide actually uses: `店名：…`,
 *    `📍…`, `1. …`, `「…」`, `【…】`.
 * 3. **Heuristic.** Capitalised Latin runs and CJK runs sitting next to a
 *    category keyword ("这家咖啡…", "推荐餐厅…"). These are the long tail — they
 *    always land in 待验证, never straight into the dataset.
 *
 * What this deliberately is NOT: a scraper, and not an LLM. It is deterministic,
 * so the same pasted text always produces the same mentions, which is the only
 * way a reviewer can trust the queue they are working through.
 */

export interface ExtractPlace {
  id: string;
  name: string;
  nameZh?: string;
  aliases?: string[];
  areaId?: string;
  discovery?: string[];
  category?: string;
}

export interface ExtractArea {
  id: string;
  name: string;
  nameZh?: string;
}

export interface ExtractedMention {
  rawPlaceName: string;
  normalizedPlaceName: string;
  matchedPlaceId?: string;
  matchMethod?: 'exact' | 'alias' | 'fuzzy';
  matchConfidence?: number;
  recommendationType: RecommendationType;
  sentiment: MentionSentiment;
  extractedNotes?: string;
  recommendedItems: string[];
  areaHint?: string;
}

export interface ExtractResult {
  mentions: ExtractedMention[];
  /** Area the guide is mostly about, when one dominates. */
  dominantAreaHint?: string;
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

const TYPE_KEYWORDS: Array<{ type: RecommendationType; test: RegExp }> = [
  { type: 'beachclub', test: /beach\s?club|海滩俱乐部|沙滩俱乐部|无边泳池|泳池派对/i },
  { type: 'cafe', test: /咖啡|咖啡馆|手冲|拿铁|latte|caf[eé]|roaster|早午餐|brunch|烘焙|bakery/i },
  { type: 'restaurant', test: /餐厅|饭店|餐馆|美食|必吃|推荐菜|招牌|人均|好吃|restaurant|warung|eatery|dining|dinner|lunch/i },
  { type: 'bar', test: /酒吧|鸡尾酒|夜店|小酒馆|cocktail|bar\b|nightclub|live\s?music/i },
  { type: 'beach', test: /海滩|沙滩|beach|pantai/i },
  { type: 'nature', test: /瀑布|火山|梯田|森林|稻田|国家公园|waterfall|volcano|rice\s?terrace|jungle/i },
  { type: 'culture', test: /寺庙|神庙|皇宫|文化|博物馆|temple|palace|museum|market|集市/i },
  { type: 'wellness', test: /spa|按摩|水疗|瑜伽|yoga|massage|wellness|养生/i },
  { type: 'shopping', test: /购物|商场|买手店|market|mall|boutique/i },
  { type: 'activity', test: /冲浪|潜水|浮潜|漂流|徒步|日出|日落|atv|surf|dive|snorkel|rafting|trek|hike|sunset|sunrise|课程|class/i },
  { type: 'hotel', test: /酒店|度假村|民宿|villa|hotel|resort|住哪里/i },
];

const POSITIVE = /推荐|必去|必吃|必点|好吃|超好|最爱|喜欢|惊喜|惊艳|值得|好评|很棒|不错|强烈推荐|宝藏|不踩雷|值得排队|must\s?try|recommend|amazing|great|best|favourite|favorite|worth/i;
const NEGATIVE = /不推荐|别去|踩雷|难吃|失望|不怎么样|一般般|坑|不建议|不好吃|差|overrated|disappointing|avoid|not\s?worth/i;
const MIXED = /但是|不过|只是|唯一|缺点是|排队|人多|偏贵|有点贵|等位|however|but\s|busy|queue|pricey/i;

const ITEM_MARKERS = /(?:必点|推荐菜|招牌菜|招牌|必吃|点单|点了|点了这|推荐点|特色菜|signature|must\s?try|known\s?for)\s*[:：]?\s*([^\n。；;]{2,80})/gi;

const AREA_KEYWORD_HINTS: Record<string, RegExp> = {
  seminyak: /水明漾|塞米亚克|seminyak/i,
  canggu: /长谷|仓古|苍古|canggu/i,
  ubud: /乌布|ubud/i,
  uluwatu: /乌鲁瓦图|uluwatu|bukit|武吉/i,
  'nusa-dua': /努沙杜瓦|nusa\s?dua/i,
  sanur: /沙努尔|萨努尔|sanur/i,
  jimbaran: /金巴兰|jimbaran/i,
  amed: /艾湄湾|amed|jemeluk/i,
  'nusa-penida': /佩尼达|蓝梦岛|nusa\s?penida|lembongan/i,
  kintamani: /金塔马尼|京打马尼|kintamani|batur|巴图尔/i,
  tabanan: /塔巴南|tabanan|jatiluwih|贾蒂卢维/i,
  tampaksiring: /坦帕西林|tampaksiring|tirta\s?empul|圣泉寺/i,
  karangasem: /卡朗阿森|karangasem|besakih|百沙基/i,
  denpasar: /登巴萨|denpasar/i,
};

/** Words that look like proper nouns but are not places. */
const FALSE_POSITIVE_NAMES = new Set([
  'bali', 'indonesia', 'ubud', 'canggu', 'seminyak', 'kuta', 'uluwatu', 'sanur', 'jimbaran',
  'nusa dua', 'denpasar', 'day', 'day1', 'day2', 'day3', 'tips', 'note', 'notes', 'total',
  '交通', '门票', '时间', '地址', '推荐', '注意', '小贴士', '攻略', '行程', '价格', '人均',
  '早餐', '午餐', '晚餐', '咖啡', '海滩', '日落', '日出', '酒店', '民宿', '餐厅',
]);

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------

interface Segment {
  text: string;
  /** The wider line, used for sentiment and category context. */
  context: string;
  index: number;
}

/** Split into roughly sentence-sized units, keeping the parent line as context. */
function segment(text: string): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      const parts = trimmed.split(/(?<=[。！？!?；;])|(?<=\.\s)/);
      for (const part of parts) {
        const value = part.trim();
        if (value.length >= 2) out.push({ text: value, context: trimmed, index: cursor });
      }
    }
    cursor += line.length + 1;
  }
  return out;
}

function classifyType(context: string): RecommendationType {
  for (const rule of TYPE_KEYWORDS) {
    if (rule.test.test(context)) return rule.type;
  }
  return 'unknown';
}

function classifySentiment(context: string): MentionSentiment {
  const negative = NEGATIVE.test(context);
  const positive = POSITIVE.test(context);
  if (negative && positive) return 'mixed';
  if (negative) return 'negative';
  if (positive) return 'positive';
  if (MIXED.test(context)) return 'mixed';
  return 'neutral';
}

function extractItems(context: string): string[] {
  const items: string[] = [];
  ITEM_MARKERS.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ITEM_MARKERS.exec(context)) !== null) {
    const raw = match[1] ?? '';
    for (const piece of raw.split(/[、,，/／]|和|与|\band\b/)) {
      const item = piece.replace(/[。.!！?？:：]+$/, '').trim();
      if (item.length >= 2 && item.length <= 30) items.push(item);
    }
  }
  return [...new Set(items)].slice(0, 8);
}

/** A short, paraphrased note. We never store the guide's sentences verbatim. */
function paraphrase(context: string, sentiment: MentionSentiment, type: RecommendationType): string | undefined {
  const trimmed = context.replace(/\s+/g, ' ').trim();
  if (trimmed.length < 4) return undefined;
  // Keep the shape of the judgement, not the source's wording.
  const parts: string[] = [];
  if (sentiment === 'positive') parts.push('攻略中评价正面');
  else if (sentiment === 'negative') parts.push('攻略中评价负面');
  else if (sentiment === 'mixed') parts.push('攻略中提到优缺点');
  if (type !== 'unknown') parts.push(`类型判断为${type}`);
  if (parts.length === 0) return undefined;
  return parts.join('；');
}

/** The type a known place implies, used when the guide text gives no signal. */
function typeOfPlace(place: ExtractPlace): RecommendationType {
  const discovery = place.discovery ?? [];
  if (discovery.includes('beachclub')) return 'beachclub';
  if (discovery.includes('coffee')) return 'cafe';
  if (discovery.includes('nightlife')) return 'bar';
  if (discovery.includes('food')) return 'restaurant';
  if (discovery.includes('beach')) return 'beach';
  if (discovery.includes('nature')) return 'nature';
  if (discovery.includes('culture')) return 'culture';
  if (discovery.includes('wellness')) return 'wellness';
  if (discovery.includes('shopping')) return 'shopping';
  if (discovery.includes('water')) return 'activity';
  switch (place.category) {
    case 'food':
      return 'restaurant';
    case 'beach':
      return 'beach';
    case 'nature':
      return 'nature';
    case 'nightlife':
      return 'bar';
    case 'activity':
      return 'activity';
    default:
      return 'unknown';
  }
}

export function detectAreaHints(text: string, areas: ExtractArea[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const area of areas) {
    const own = AREA_KEYWORD_HINTS[area.id];
    const patterns = [own, area.name ? new RegExp(area.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined];
    if (area.nameZh) patterns.push(new RegExp(area.nameZh, 'i'));
    let count = 0;
    for (const pattern of patterns) {
      if (!pattern) continue;
      const matches = text.match(new RegExp(pattern.source, 'gi'));
      if (matches) count += matches.length;
    }
    if (count > 0) counts.set(area.id, count);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Pass 1 — dictionary
// ---------------------------------------------------------------------------

interface Candidate {
  rawPlaceName: string;
  segment: Segment;
  /** Set when this came from a known name, which makes it far more trustworthy. */
  dictionaryHitFor?: ExtractPlace;
}

/**
 * Longest-first scan for names already in the dataset.
 *
 * Longest first matters: a text containing "Finns Beach Club" must match that
 * place, not "Finns", and a text containing "Ubud Coffee Roastery" must not be
 * split into "Ubud" plus a stray hit.
 */
function dictionaryCandidates(text: string, places: ExtractPlace[], segments: Segment[]): Candidate[] {
  const entries: { needle: string; place: ExtractPlace }[] = [];
  for (const place of places) {
    for (const value of [place.nameZh, place.name, ...(place.aliases ?? [])]) {
      if (value && value.trim().length >= 3) entries.push({ needle: value.trim(), place });
    }
  }
  entries.sort((a, b) => b.needle.length - a.needle.length);

  const found: Candidate[] = [];
  const consumed = new Array<boolean>(text.length).fill(false);

  for (const { needle, place } of entries) {
    const pattern = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      // Skip a hit that sits inside a longer name we already claimed.
      let overlaps = false;
      for (let i = start; i < end; i += 1) if (consumed[i]) overlaps = true;
      if (overlaps) continue;
      for (let i = start; i < end; i += 1) consumed[i] = true;

      const seg = segments.find((s) => start >= s.index && start < s.index + s.context.length) ?? {
        text: match[0],
        context: match[0],
        index: start,
      };
      found.push({ rawPlaceName: match[0].trim(), segment: seg, dictionaryHitFor: place });
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Pass 2 — explicit patterns
// ---------------------------------------------------------------------------

const PATTERN_RULES: RegExp[] = [
  /(?:店名|餐厅名|名字|名称|打卡|去的是|吃的是|住的是)\s*[:：]\s*([^\n，,。；;]{2,40})/g,
  /[📍📌⭐️✨]\s*([^\n，,。；;]{2,40})/g,
  /[「【《]([^」】》]{2,30})[」】》]/g,
  /^\s*\d{1,2}[.、)．]\s*([^\n，,。；;]{2,40})/gm,
];

function patternCandidates(segments: Segment[]): Candidate[] {
  const out: Candidate[] = [];
  for (const seg of segments) {
    for (const rule of PATTERN_RULES) {
      rule.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = rule.exec(seg.text)) !== null) {
        const value = (match[1] ?? '').trim();
        if (value.length >= 2) out.push({ rawPlaceName: value, segment: seg });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pass 3 — heuristic
// ---------------------------------------------------------------------------

/**
 * Latin runs of capitalised words, connectors included, e.g. "La Brisa",
 * "Milk & Madu", "Warung Babi Guling Ibu Oka".
 *
 * The connector group has to be inside the repeated unit: the first version put
 * it outside, so "Milk & Madu" was captured as "Milk &".
 */
const LATIN_NAME =
  /\b([A-Z][\p{Letter}'’.-]+(?:(?:\s+(?:&|and|of|de|di|du|the)\s+)|\s+)[A-Z][\p{Letter}'’.-]+(?:\s+[A-Z][\p{Letter}'’.-]+){0,3})/gu;

/**
 * A Chinese venue name, captured only where it is immediately followed by the
 * noun that makes it a venue: 乌布皇宫, 金巴兰海滩, 库塔咖啡.
 */
const CJK_NAME =
  /([\u3400-\u9fff]{2,8})(?=餐厅|饭店|餐馆|咖啡馆|咖啡店|咖啡|酒吧|海滩俱乐部|沙滩俱乐部|度假村|酒店|民宿|水疗|按摩|海滩|沙滩|寺庙|神庙|皇宫|瀑布|梯田|市场|商场)/g;

/** Chinese function words and verbs: a run containing these is a sentence, not a name. */
const CJK_STOPWORDS = /[了的是很都有去在和会要可以没不我你他她它们这那个吗呢吧啊把被给对从到就还也很太更最]/;
/** Generic English words that look like proper nouns but are not venues. */
const LATIN_STOPWORDS = new Set([
  'fine', 'dining', 'lunch', 'dinner', 'breakfast', 'brunch', 'coffee', 'cafe', 'bar', 'beach',
  'club', 'spa', 'hotel', 'resort', 'villa', 'day', 'trip', 'tips', 'note', 'notes', 'bali',
  'indonesia', 'ubud', 'canggu', 'seminyak', 'kuta', 'uluwatu', 'sanur', 'jimbaran', 'nusa',
  'dua', 'denpasar', 'day1', 'day2', 'day3', 'am', 'pm', 'ok', 'good', 'nice', 'best', 'great',
]);

function heuristicCandidates(segments: Segment[]): Candidate[] {
  const out: Candidate[] = [];
  for (const seg of segments) {
    const type = classifyType(seg.context);
    // Only hunt for unknown names in sentences that are talking about a place.
    if (type === 'unknown') continue;

    LATIN_NAME.lastIndex = 0;
    let latin: RegExpExecArray | null;
    while ((latin = LATIN_NAME.exec(seg.text)) !== null) {
      const value = latin[1].trim();
      const words = value.split(/\s+/);
      // Multi-word runs only: a single capitalised word is usually the start of
      // a sentence ("Breakfast was..."), not a venue.
      if (words.length < 2) continue;
      if (words.every((w) => LATIN_STOPWORDS.has(w.toLowerCase()))) continue;
      out.push({ rawPlaceName: value, segment: seg });
    }

    if (!/[餐厅|咖啡|酒吧|海滩|酒店|店|馆|寺|瀑布|梯田]/.test(seg.context)) continue;
    CJK_NAME.lastIndex = 0;
    let cjk: RegExpExecArray | null;
    while ((cjk = CJK_NAME.exec(seg.text)) !== null) {
      const value = cjk[1];
      if (value.length < 2 || value.length > 8) continue;
      if (CJK_STOPWORDS.test(value)) continue;
      out.push({ rawPlaceName: value, segment: seg });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function isFalsePositive(name: string): boolean {
  const key = name.toLowerCase().trim();
  if (FALSE_POSITIVE_NAMES.has(key)) return true;
  if (normalizePlaceName(name).length < 2) return true;
  // A bare region or a bare category word is not a place.
  if (/^(day|tips?|note|人均|交通|门票|地址|时间|价格)\b/i.test(name)) return true;
  return false;
}

export function extractMentions(
  text: string,
  places: ExtractPlace[],
  areas: ExtractArea[],
): ExtractResult {
  if (!text || text.trim().length === 0) return { mentions: [] };

  const segments = segment(text);
  const areaCounts = detectAreaHints(text, areas);
  const dominantAreaHint = [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const dictionary = dictionaryCandidates(text, places, segments);
  const patterned = patternCandidates(segments);
  const heuristic = heuristicCandidates(segments);

  const targets: MatchTarget[] = places.map((p) => ({
    id: p.id,
    name: p.name,
    nameZh: p.nameZh,
    aliases: p.aliases,
    areaId: p.areaId,
    discovery: p.discovery,
    category: p.category,
  }));

  // Keyed by normalised name so "La Brisa" and "La Brisa Bali" collapse.
  const byKey = new Map<string, { candidate: Candidate; fromDictionary: boolean }>();
  const consider = (candidate: Candidate, fromDictionary: boolean) => {
    const name = candidate.rawPlaceName.trim();
    if (isFalsePositive(name)) return;
    const key = normalizePlaceName(name);
    if (key.length < 2) return;
    const existing = byKey.get(key);
    // A dictionary hit always outranks a guess for the same key.
    if (!existing || (fromDictionary && !existing.fromDictionary)) byKey.set(key, { candidate, fromDictionary });
  };

  for (const c of dictionary) consider(c, true);
  for (const c of patterned) consider(c, false);
  for (const c of heuristic) consider(c, false);

  /*
   * Drop fragments. "Warung Babi Guling Ibu Oka" is a dictionary hit; the
   * heuristic pass also finds "Warung Babi Guling Ibu" inside it, and the two
   * normalise to different keys so the dedupe above cannot see they are the same
   * venue. Anything that is a substring of a dictionary hit goes.
   */
  const dictionaryNames = dictionary.map((c) => c.rawPlaceName.toLowerCase());
  for (const [key, entry] of [...byKey.entries()]) {
    if (entry.fromDictionary) continue;
    const lower = entry.candidate.rawPlaceName.toLowerCase();
    if (dictionaryNames.some((name) => name.includes(lower) && name !== lower)) byKey.delete(key);
  }

  const mentions: ExtractedMention[] = [];
  for (const { candidate, fromDictionary } of byKey.values()) {
    const context = candidate.segment.context;
    let recommendationType = classifyType(context);
    /*
     * A guide line like "晚上 Old Man's，啤酒便宜" carries no category keyword, but
     * we already know what the place is. Not using that produced bars filed as
     * "不确定".
     */
    if (recommendationType === 'unknown' && candidate.dictionaryHitFor) {
      recommendationType = typeOfPlace(candidate.dictionaryHitFor);
    }
    const sentiment = classifySentiment(context);
    const areaHint =
      candidate.dictionaryHitFor?.areaId ??
      [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    let match = matchPlace(candidate.rawPlaceName, targets, { areaHint, recommendationType });

    /*
     * A dictionary hit is a name we already hold, so the matcher should agree.
     * When it does not — an alias we did not index, say — trust the dictionary
     * and record which place it was.
     */
    if (!match.placeId && candidate.dictionaryHitFor && fromDictionary) {
      match = { placeId: candidate.dictionaryHitFor.id, method: 'alias', confidence: 0.9 };
    }

    mentions.push({
      rawPlaceName: candidate.rawPlaceName,
      normalizedPlaceName: normalizePlaceName(candidate.rawPlaceName),
      matchedPlaceId: match.placeId ?? undefined,
      matchMethod: match.method ?? undefined,
      matchConfidence: match.confidence > 0 ? Number(match.confidence.toFixed(2)) : undefined,
      recommendationType,
      sentiment,
      extractedNotes: paraphrase(context, sentiment, recommendationType),
      recommendedItems: extractItems(context),
      areaHint,
    });
  }

  mentions.sort((a, b) => (b.matchConfidence ?? 0) - (a.matchConfidence ?? 0));
  return { mentions, dominantAreaHint };
}

/**
 * Sample text used by the 载入示例文本 button.
 *
 * Written for this product rather than copied from anywhere: it exercises the
 * extractor with known places, an unknown place, a negative mention and a dish
 * list, so a reviewer can see every branch of the flow in one paste.
 */
export const SAMPLE_GUIDE_TEXT = `巴厘岛 5 天 4 晚，我踩过的店和坑

Day 1 长谷
早餐去了 Crate Cafe，人很多但出餐快，必点：牛油果吐司、冰拿铁。
下午在 Milk & Madu 坐了一下午，早午餐一般，但是环境适合办公。
日落去 La Brisa，海滩俱乐部，泳池和日落都好看，人多要提前订位。
晚上 Old Man's，啤酒便宜，适合朋友一起。

Day 2 水明漾
午餐 Sisterfields，推荐菜：松露薯条、班尼迪克蛋。
下午逛 Seminyak Village，买手店不少。
晚餐 Kaum Bali，印尼菜，人均偏高但值得。

Day 3 乌布
早上 Campuhan Ridge Walk，很晒要早去。
午餐 Warung Babi Guling Ibu Oka，烤猪饭，排队 20 分钟，值得。
下午 Sacred Monkey Forest，猴子会抢东西。
晚餐 Locavore，Fine dining，强烈推荐，需要提前一个月订。
咖啡去了 Seniman Coffee，手冲不错。

Day 4 乌鲁瓦图
Single Fin 看日落，人非常多，不推荐周末去。
晚餐 Uluwatu Seafood，海鲜一般般。

Day 5 金巴兰
Menega Cafe 海鲜烧烤，沙滩上吃，价格偏贵。
`;
