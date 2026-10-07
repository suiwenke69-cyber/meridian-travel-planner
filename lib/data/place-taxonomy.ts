import type { ActivityKind, MealType } from '../types';

/**
 * The vocabulary a place is described in.
 *
 * Kept in one file because three consumers need to agree on it exactly: the DO
 * filter chips, the place-matching pipeline in `lib/research`, and the data
 * authors writing the Bali dataset. When these drift, a restaurant silently
 * disappears from a category, which is the kind of bug nobody reports.
 *
 * Chinese is authored first and is the label shown to users; English exists for
 * the `en` locale and for the research pipeline, which matches against the
 * English names people actually type.
 */

export interface Bilingual {
  zh: string;
  en: string;
}

export interface DiscoveryCategory {
  id: string;
  label: Bilingual;
  /** Shown under the chip row as one line of context. */
  hint?: Bilingual;
  /**
   * Categories that should stay tucked behind the more specific ones — a beach
   * club shows under Beach clubs before it shows under Nightlife.
   */
  order: number;
}

/**
 * The DO filter set.
 *
 * `highlights` is not a kind of place, it is a curated cross-section, so it is
 * first and is the default.
 */
export const DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  { id: 'highlights', label: { zh: '精选', en: 'Highlights' }, hint: { zh: '第一次来先看这些', en: 'Start here' }, order: 0 },
  { id: 'food', label: { zh: '美食', en: 'Food' }, hint: { zh: '餐厅与本地菜', en: 'Restaurants and local food' }, order: 1 },
  { id: 'coffee', label: { zh: '咖啡', en: 'Coffee' }, hint: { zh: '咖啡与烘焙', en: 'Cafés and roasters' }, order: 2 },
  { id: 'beachclub', label: { zh: 'Beach Club', en: 'Beach clubs' }, hint: { zh: '泳池、音乐、日落', en: 'Pools, music, sunset' }, order: 3 },
  { id: 'beach', label: { zh: '海滩', en: 'Beaches' }, order: 4 },
  { id: 'nature', label: { zh: '自然', en: 'Nature' }, order: 5 },
  { id: 'culture', label: { zh: '文化', en: 'Culture' }, order: 6 },
  { id: 'nightlife', label: { zh: '夜生活', en: 'Nightlife' }, order: 7 },
  { id: 'water', label: { zh: '水上活动', en: 'On the water' }, order: 8 },
  { id: 'wellness', label: { zh: 'Wellness', en: 'Wellness' }, hint: { zh: 'SPA 与瑜伽', en: 'Spa and yoga' }, order: 9 },
  { id: 'shopping', label: { zh: '购物', en: 'Shopping' }, order: 10 },
];

export const DEFAULT_DISCOVERY_CATEGORY = 'highlights';

const CATEGORY_BY_ID = new Map(DISCOVERY_CATEGORIES.map((c) => [c.id, c]));

export function getDiscoveryCategory(id: string): DiscoveryCategory | undefined {
  return CATEGORY_BY_ID.get(id);
}

/**
 * Legacy mapping.
 *
 * The 48 places authored before this iteration carry only `markerLayer` and
 * `category`. Rather than rewrite all of them at once, an explicit fallback maps
 * the old enums onto the new vocabulary. Places written from now on declare
 * `discovery` themselves and take precedence.
 */
const LAYER_FALLBACK: Record<string, string[]> = {
  beach: ['beach'],
  nature: ['nature'],
  activity: ['water'],
  food: ['food'],
  nightlife: ['nightlife'],
  transport: [],
  marriott: [],
  hilton: [],
  ihg: [],
  hyatt: [],
  gha: [],
};

/** Which DO categories a place appears under. */
export function categoriesOf(place: { discovery?: string[]; markerLayer?: string; category?: string }): string[] {
  if (place.discovery && place.discovery.length > 0) return place.discovery;
  const fromLayer = LAYER_FALLBACK[place.markerLayer ?? ''] ?? [];
  if (place.category === 'activity' && !fromLayer.includes('water')) return [...fromLayer, 'water'];
  return fromLayer;
}

export function placeMatchesCategory(
  place: { discovery?: string[]; markerLayer?: string; category?: string },
  categoryId: string,
): boolean {
  if (categoryId === 'highlights') return true;
  return categoriesOf(place).includes(categoryId);
}

/** Marker layer a place belongs to in a given category, so filtering never lies about the map. */
export function markerLayerForCategory(categoryId: string): string {
  switch (categoryId) {
    case 'food':
    case 'coffee':
      return 'food';
    case 'beachclub':
    case 'nightlife':
      return 'nightlife';
    case 'beach':
      return 'beach';
    case 'nature':
      return 'nature';
    case 'culture':
    case 'shopping':
    case 'wellness':
    case 'water':
    default:
      return 'activity';
  }
}

// ---------------------------------------------------------------------------
// Cuisines
// ---------------------------------------------------------------------------

export const CUISINES: Record<string, Bilingual> = {
  indonesian: { zh: '印尼菜', en: 'Indonesian' },
  balinese: { zh: '巴厘菜', en: 'Balinese' },
  'babi-guling': { zh: '烤猪饭', en: 'Babi guling' },
  warung: { zh: '本地小馆', en: 'Warung' },
  seafood: { zh: '海鲜', en: 'Seafood' },
  fine: { zh: 'Fine dining', en: 'Fine dining' },
  japanese: { zh: '日料', en: 'Japanese' },
  italian: { zh: '意大利菜', en: 'Italian' },
  mediterranean: { zh: '地中海菜', en: 'Mediterranean' },
  french: { zh: '法餐', en: 'French' },
  western: { zh: '西餐', en: 'Western' },
  'coffee-roaster': { zh: '精品咖啡', en: 'Specialty coffee' },
  brunch: { zh: '早午餐', en: 'Brunch' },
  vegan: { zh: '素食 / 纯素', en: 'Vegan / vegetarian' },
  mexican: { zh: '墨西哥菜', en: 'Mexican' },
  chinese: { zh: '中餐', en: 'Chinese' },
  indian: { zh: '印度菜', en: 'Indian' },
  peranakan: { zh: '娘惹菜', en: 'Peranakan' },
  'dessert-gelato': { zh: '甜品 / 冰淇淋', en: 'Dessert / gelato' },
  'bar-cocktail': { zh: '酒吧 / 鸡尾酒', en: 'Bar / cocktails' },
  'warung-local': { zh: '本地家常', en: 'Local home-style' },
  bakery: { zh: '烘焙', en: 'Bakery' },
  healthy: { zh: '健康轻食', en: 'Healthy bowls' },
  /*
   * Added when the other nine destinations were brought to Bali's depth.
   *
   * A cuisine id is part of the place record, so a Vietnamese restaurant had
   * nothing legal to declare itself as — the first Vietnamese records were
   * rejected by the validator for using a "vietnamese" id that did not exist.
   * These are the cuisines the dataset now actually contains.
   */
  vietnamese: { zh: '越南菜', en: 'Vietnamese' },
  'vietnamese-street': { zh: '越南街头小吃', en: 'Vietnamese street food' },
  khmer: { zh: '高棉菜', en: 'Khmer' },
  filipino: { zh: '菲律宾菜', en: 'Filipino' },
  international: { zh: '国际菜', en: 'International' },
  thai: { zh: '泰国菜', en: 'Thai' },
  vegetarian: { zh: '素食', en: 'Vegetarian' },
};

export function cuisineLabel(id: string, locale: 'zh-CN' | 'en'): string {
  const entry = CUISINES[id];
  if (!entry) return id;
  return locale === 'zh-CN' ? entry.zh : entry.en;
}

export const MEAL_TYPES: MealType[] = ['breakfast', 'brunch', 'lunch', 'dinner', 'coffee', 'drinks', 'dessert'];

// ---------------------------------------------------------------------------
// Recommended for
// ---------------------------------------------------------------------------

/** Who a place actually suits. Pick from this list rather than inventing prose. */
export const RECOMMENDED_FOR: Record<string, Bilingual> = {
  'first-time': { zh: '第一次来', en: 'First-timers' },
  couples: { zh: '情侣', en: 'Couples' },
  family: { zh: '亲子', en: 'Families' },
  'family-young-kids': { zh: '带小孩', en: 'Young children' },
  friends: { zh: '朋友出行', en: 'Groups of friends' },
  solo: { zh: '独行', en: 'Solo' },
  'digital-nomad': { zh: '长住 / 远程办公', en: 'Long stays / remote work' },
  surfers: { zh: '冲浪', en: 'Surfers' },
  'food-lovers': { zh: '爱吃的人', en: 'Food lovers' },
  'coffee-people': { zh: '咖啡爱好者', en: 'Coffee people' },
  'photo-spots': { zh: '拍照', en: 'Photography' },
  sunset: { zh: '看日落', en: 'Sunset' },
  'sunrise': { zh: '看日出', en: 'Sunrise' },
  'quiet': { zh: '想安静', en: 'Quiet' },
  'party': { zh: '想热闹', en: 'Lively' },
  'luxury': { zh: '高预算', en: 'Luxury' },
  'budget': { zh: '控制预算', en: 'Budget-conscious' },
  'wellness': { zh: '养生 / 放松', en: 'Wellness' },
  'non-swimmer': { zh: '不擅长游泳', en: 'Not a confident swimmer' },
  'rainy-day': { zh: '下雨天', en: 'Rainy days' },
  'half-day': { zh: '只有半天', en: 'Half a day' },
  'full-day': { zh: '安排一整天', en: 'A full day' },
  'adventurous': { zh: '想玩刺激的', en: 'Adventurous' },
  'shopping': { zh: '想逛街', en: 'Shopping' },
  'vegetarian': { zh: '素食', en: 'Vegetarian' },
  'halal': { zh: '清真', en: 'Halal' },
  'sunset-drinks': { zh: '日落小酌', en: 'Sunset drinks' },
  'long-lunch': { zh: '慢慢吃午饭', en: 'A long lunch' },
  'special-occasion': { zh: '纪念日 / 庆祝', en: 'Special occasion' },
};

export function recommendedForLabel(id: string, locale: 'zh-CN' | 'en'): string {
  const entry = RECOMMENDED_FOR[id];
  if (!entry) return id;
  return locale === 'zh-CN' ? entry.zh : entry.en;
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export const ACTIVITY_KINDS: Record<ActivityKind, Bilingual> = {
  surf: { zh: '冲浪', en: 'Surfing' },
  dive: { zh: '潜水', en: 'Diving' },
  snorkel: { zh: '浮潜', en: 'Snorkelling' },
  rafting: { zh: '漂流', en: 'Rafting' },
  volcano: { zh: '火山徒步', en: 'Volcano hike' },
  atv: { zh: 'ATV 越野', en: 'ATV' },
  yoga: { zh: '瑜伽', en: 'Yoga' },
  spa: { zh: 'SPA', en: 'Spa' },
  beachclub: { zh: 'Beach Club', en: 'Beach club' },
  sunset: { zh: '日落', en: 'Sunset' },
  temple: { zh: '寺庙', en: 'Temple' },
  waterfall: { zh: '瀑布', en: 'Waterfall' },
  ricefield: { zh: '稻田', en: 'Rice terrace' },
  cooking: { zh: '烹饪课程', en: 'Cooking class' },
  island: { zh: '海岛一日游', en: 'Island day trip' },
  shopping: { zh: '购物', en: 'Shopping' },
  hike: { zh: '徒步', en: 'Hiking' },
};

export function activityKindLabel(kind: ActivityKind, locale: 'zh-CN' | 'en'): string {
  const entry = ACTIVITY_KINDS[kind];
  return locale === 'zh-CN' ? entry.zh : entry.en;
}

/** Which discovery category an activity kind belongs to, when nothing more specific applies. */
export const ACTIVITY_DISCOVERY: Record<ActivityKind, string> = {
  surf: 'water',
  dive: 'water',
  snorkel: 'water',
  rafting: 'water',
  volcano: 'nature',
  atv: 'activity',
  yoga: 'wellness',
  spa: 'wellness',
  beachclub: 'beachclub',
  sunset: 'beach',
  temple: 'culture',
  waterfall: 'nature',
  ricefield: 'nature',
  cooking: 'culture',
  island: 'water',
  shopping: 'shopping',
  hike: 'nature',
};
