import type { OriginCity, OriginRegionId } from '../types';

/**
 * Origin cities.
 *
 * Singapore is ONE supported origin, not an assumption. Nothing in the product
 * may hard-code a departure city; everything reads from here.
 *
 * COORDINATES
 * -----------
 * Every city centre and every airport was resolved against OpenStreetMap via
 * Nominatim (see `scripts/verify-origins.mjs`), and the note on each city records
 * what the point marks. Airport coordinates are the aerodrome, not the terminal,
 * which is the right precision for a distance and a map marker.
 *
 * ONE CITY IS NOT ONE AIRPORT
 * ---------------------------
 * Shanghai has PVG and SHA, Beijing has PEK and PKX, Chengdu has CTU and TFU,
 * Bangkok has BKK and DMK. The model stores a list from the start so that adding
 * the second airport to a city is a data edit, not a schema change.
 *
 * NOT A DESTINATION CATALOGUE
 * ---------------------------
 * China is an ORIGIN market in this iteration. There are no Chinese
 * destinations here deliberately: the destination side of the product remains
 * Southeast Asia, and mixing the two would turn a focused origin upgrade into an
 * unbounded content project.
 */

const VERIFIED_ON = '2026-10-06';

/** Every airport carries the same provenance, so it is stamped once. */
function geo(lat: number, lng: number, note: string) {
  return { lat, lng, confidence: 'verified' as const, coordNote: `${note} — OpenStreetMap via Nominatim, ${VERIFIED_ON}.` };
}

export const ORIGIN_CITIES: OriginCity[] = [
  // --- Singapore -----------------------------------------------------------
  {
    id: 'singapore',
    cityNameZh: '新加坡',
    cityNameEn: 'Singapore',
    country: '新加坡',
    countryEn: 'Singapore',
    countryCode: 'SG',
    region: 'singapore',
    coordinates: geo(1.3521, 103.8198, 'Singapore city centre (Marina Bay)'),
    timezone: 'GMT+8 (SGT)',
    nearbyOriginIds: ['kuala-lumpur', 'jakarta'],
    enabled: true,
    source: 'curated',
    note: 'Changi is one of the best-connected airports in the region, which is why so many routes here are non-stop.',
    airports: [
      {
        id: 'sin',
        code: 'SIN',
        nameZh: '新加坡樟宜机场',
        nameEn: 'Singapore Changi Airport',
        coordinates: geo(1.3511, 103.995, 'Changi Airport aerodrome'),
        type: 'international',
      },
      {
        id: 'xsp',
        code: 'XSP',
        nameZh: '实里达机场',
        nameEn: 'Seletar Airport',
        coordinates: geo(1.4175, 103.8683, 'Seletar Airport aerodrome'),
        type: 'regional',
      },
    ],
  },

  // --- 粤港澳大湾区 ---------------------------------------------------------
  {
    id: 'guangzhou',
    cityNameZh: '广州',
    cityNameEn: 'Guangzhou',
    country: '中国',
    countryEn: 'China',
    countryCode: 'CN',
    region: 'greater-bay',
    coordinates: geo(23.1291, 113.2644, 'Guangzhou city centre (Tianhe)'),
    timezone: 'GMT+8 (CST)',
    nearbyOriginIds: ['shenzhen', 'hong-kong'],
    enabled: true,
    source: 'curated',
    note: 'China Southern\'s hub, which is why Southeast Asia coverage from here is broad.',
    airports: [
      {
        id: 'can',
        code: 'CAN',
        nameZh: '广州白云国际机场',
        nameEn: 'Guangzhou Baiyun International Airport',
        coordinates: geo(23.3863, 113.3023, 'Baiyun Airport aerodrome'),
        type: 'international',
      },
    ],
  },
  {
    id: 'shenzhen',
    cityNameZh: '深圳',
    cityNameEn: 'Shenzhen',
    country: '中国',
    countryEn: 'China',
    countryCode: 'CN',
    region: 'greater-bay',
    coordinates: geo(22.5431, 114.0579, 'Shenzhen city centre (Futian)'),
    timezone: 'GMT+8 (CST)',
    nearbyOriginIds: ['hong-kong', 'guangzhou'],
    enabled: true,
    source: 'curated',
    note: 'Close enough to Hong Kong that both airports are worth checking.',
    airports: [
      {
        id: 'szx',
        code: 'SZX',
        nameZh: '深圳宝安国际机场',
        nameEn: 'Shenzhen Bao\'an International Airport',
        coordinates: geo(22.6404, 113.8031, 'Bao\'an Airport aerodrome'),
        type: 'international',
      },
    ],
  },
  {
    id: 'hong-kong',
    cityNameZh: '香港',
    cityNameEn: 'Hong Kong',
    country: '中国',
    countryEn: 'China',
    countryCode: 'HK',
    region: 'greater-bay',
    coordinates: geo(22.3193, 114.1694, 'Hong Kong city centre (Central)'),
    timezone: 'GMT+8 (HKT)',
    nearbyOriginIds: ['shenzhen', 'guangzhou'],
    enabled: true,
    source: 'curated',
    note: 'A major regional hub in its own right, with its own visa and border arrangements.',
    airports: [
      {
        id: 'hkg',
        code: 'HKG',
        nameZh: '香港国际机场',
        nameEn: 'Hong Kong International Airport',
        coordinates: geo(22.3126, 113.9173, 'Hong Kong International Airport aerodrome'),
        type: 'international',
      },
    ],
  },

  // --- 长三角 ---------------------------------------------------------------
  {
    id: 'shanghai',
    cityNameZh: '上海',
    cityNameEn: 'Shanghai',
    country: '中国',
    countryEn: 'China',
    countryCode: 'CN',
    region: 'yangtze-delta',
    coordinates: geo(31.2304, 121.4737, 'Shanghai city centre (People\'s Square)'),
    timezone: 'GMT+8 (CST)',
    nearbyOriginIds: ['hangzhou'],
    enabled: true,
    source: 'curated',
    note: 'Two airports: Pudong for long-haul and most international, Hongqiao for domestic and some regional.',
    airports: [
      {
        id: 'pvg',
        code: 'PVG',
        nameZh: '上海浦东国际机场',
        nameEn: 'Shanghai Pudong International Airport',
        coordinates: geo(31.1427, 121.8041, 'Pudong Airport aerodrome'),
        type: 'international',
      },
      {
        id: 'sha',
        code: 'SHA',
        nameZh: '上海虹桥国际机场',
        nameEn: 'Shanghai Hongqiao International Airport',
        coordinates: geo(31.1977, 121.3345, 'Hongqiao Airport aerodrome'),
        type: 'international',
      },
    ],
  },
  {
    id: 'hangzhou',
    cityNameZh: '杭州',
    cityNameEn: 'Hangzhou',
    country: '中国',
    countryEn: 'China',
    countryCode: 'CN',
    region: 'yangtze-delta',
    coordinates: geo(30.2741, 120.1551, 'Hangzhou city centre (Wulin Square)'),
    timezone: 'GMT+8 (CST)',
    nearbyOriginIds: ['shanghai'],
    enabled: true,
    source: 'curated',
    note: 'About an hour from Shanghai by high-speed rail, so Shanghai\'s airports are a real alternative for long-haul.',
    airports: [
      {
        id: 'hgh',
        code: 'HGH',
        nameZh: '杭州萧山国际机场',
        nameEn: 'Hangzhou Xiaoshan International Airport',
        coordinates: geo(30.2369, 120.4291, 'Xiaoshan Airport aerodrome'),
        type: 'international',
      },
    ],
  },

  // --- 中国其他 -------------------------------------------------------------
  {
    id: 'beijing',
    cityNameZh: '北京',
    cityNameEn: 'Beijing',
    country: '中国',
    countryEn: 'China',
    countryCode: 'CN',
    region: 'china-other',
    coordinates: geo(39.9042, 116.4074, 'Beijing city centre (Tiananmen)'),
    timezone: 'GMT+8 (CST)',
    nearbyOriginIds: [],
    enabled: true,
    source: 'curated',
    note: 'Two airports: Capital (PEK) and Daxing (PKX). Which one you use depends on the airline.',
    airports: [
      {
        id: 'pek',
        code: 'PEK',
        nameZh: '北京首都国际机场',
        nameEn: 'Beijing Capital International Airport',
        coordinates: geo(40.0802, 116.5939, 'Capital Airport aerodrome'),
        type: 'international',
      },
      {
        id: 'pkx',
        code: 'PKX',
        nameZh: '北京大兴国际机场',
        nameEn: 'Beijing Daxing International Airport',
        coordinates: geo(39.4973, 116.4123, 'Daxing Airport aerodrome'),
        type: 'international',
      },
    ],
  },
  {
    id: 'chengdu',
    cityNameZh: '成都',
    cityNameEn: 'Chengdu',
    country: '中国',
    countryEn: 'China',
    countryCode: 'CN',
    region: 'china-other',
    coordinates: geo(30.5728, 104.0668, 'Chengdu city centre (Tianfu Square)'),
    timezone: 'GMT+8 (CST)',
    nearbyOriginIds: [],
    enabled: true,
    source: 'curated',
    note: 'Two airports: Shuangliu (CTU) is closer to the city, Tianfu (TFU) handles most international.',
    airports: [
      {
        id: 'ctu',
        code: 'CTU',
        nameZh: '成都双流国际机场',
        nameEn: 'Chengdu Shuangliu International Airport',
        coordinates: geo(30.5548, 103.9479, 'Shuangliu Airport aerodrome'),
        type: 'international',
      },
      {
        id: 'tfu',
        code: 'TFU',
        nameZh: '成都天府国际机场',
        nameEn: 'Chengdu Tianfu International Airport',
        coordinates: geo(30.3036, 104.4457, 'Tianfu Airport aerodrome'),
        type: 'international',
      },
    ],
  },

  // --- 东南亚 ---------------------------------------------------------------
  {
    id: 'bangkok',
    cityNameZh: '曼谷',
    cityNameEn: 'Bangkok',
    country: '泰国',
    countryEn: 'Thailand',
    countryCode: 'TH',
    region: 'southeast-asia',
    coordinates: geo(13.7563, 100.5018, 'Bangkok city centre (Siam)'),
    timezone: 'GMT+7 (ICT)',
    nearbyOriginIds: ['kuala-lumpur'],
    enabled: true,
    source: 'curated',
    note: 'Two airports: Suvarnabhumi (BKK) for full-service and long-haul, Don Mueang (DMK) for low-cost.',
    airports: [
      {
        id: 'bkk',
        code: 'BKK',
        nameZh: '素万那普机场',
        nameEn: 'Suvarnabhumi Airport',
        coordinates: geo(13.6819, 100.7486, 'Suvarnabhumi Airport aerodrome'),
        type: 'international',
      },
      {
        id: 'dmk',
        code: 'DMK',
        nameZh: '廊曼国际机场',
        nameEn: 'Don Mueang International Airport',
        coordinates: geo(13.9122, 100.6035, 'Don Mueang Airport aerodrome'),
        type: 'international',
      },
    ],
  },
  {
    id: 'kuala-lumpur',
    cityNameZh: '吉隆坡',
    cityNameEn: 'Kuala Lumpur',
    country: '马来西亚',
    countryEn: 'Malaysia',
    countryCode: 'MY',
    region: 'southeast-asia',
    coordinates: geo(3.139, 101.6869, 'Kuala Lumpur city centre (KLCC)'),
    timezone: 'GMT+8 (MYT)',
    nearbyOriginIds: ['singapore', 'bangkok'],
    enabled: true,
    source: 'curated',
    note: 'AirAsia\'s home base, so low-cost coverage across Southeast Asia from here is the widest of any origin in this list.',
    airports: [
      {
        id: 'kul',
        code: 'KUL',
        nameZh: '吉隆坡国际机场',
        nameEn: 'Kuala Lumpur International Airport',
        coordinates: geo(2.7448, 101.7074, 'KLIA aerodrome'),
        type: 'international',
      },
    ],
  },
  {
    id: 'jakarta',
    cityNameZh: '雅加达',
    cityNameEn: 'Jakarta',
    country: '印度尼西亚',
    countryEn: 'Indonesia',
    countryCode: 'ID',
    region: 'southeast-asia',
    coordinates: geo(-6.2088, 106.8456, 'Jakarta city centre (Monas)'),
    timezone: 'GMT+7 (WIB)',
    nearbyOriginIds: ['singapore'],
    enabled: true,
    source: 'curated',
    note: 'Domestic gateway to the rest of Indonesia, so Bali is a short domestic hop rather than an international flight.',
    airports: [
      {
        id: 'cgk',
        code: 'CGK',
        nameZh: '苏加诺-哈达国际机场',
        nameEn: 'Soekarno-Hatta International Airport',
        coordinates: geo(-6.1239, 106.6429, 'Soekarno-Hatta Airport aerodrome'),
        type: 'international',
      },
    ],
  },
];

/**
 * Origin regions, for the selector's grouping.
 *
 * These group ORIGINS. They are deliberately unrelated to the destination
 * regions on the map — a Chinese province group and a destination region are
 * different kinds of thing, and conflating them would make both wrong.
 */
export const ORIGIN_REGIONS: Array<{ id: OriginRegionId; labelZh: string; labelEn: string }> = [
  { id: 'singapore', labelZh: '新加坡', labelEn: 'Singapore' },
  { id: 'greater-bay', labelZh: '粤港澳大湾区', labelEn: 'Greater Bay Area' },
  { id: 'yangtze-delta', labelZh: '长三角', labelEn: 'Yangtze River Delta' },
  { id: 'china-other', labelZh: '中国其他', labelEn: 'Elsewhere in China' },
  { id: 'southeast-asia', labelZh: '东南亚', labelEn: 'Southeast Asia' },
];

/** Singapore, because it is the market the product was built in. */
export const DEFAULT_ORIGIN_CITY_ID = 'singapore';

const BY_ID = new Map(ORIGIN_CITIES.map((c) => [c.id, c]));

export function getOriginCity(id: string | undefined | null): OriginCity | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function getOriginCities(includeDisabled = false): OriginCity[] {
  return ORIGIN_CITIES.filter((c) => includeDisabled || c.enabled);
}

export function getOriginCityByAirportCode(code: string): OriginCity | undefined {
  const needle = code.trim().toUpperCase();
  return ORIGIN_CITIES.find((c) => c.airports.some((a) => a.code === needle));
}

/** `CAN` or `PVG · SHA` — the compact form used beside a city name. */
export function airportCodesFor(city: OriginCity): string {
  return city.airports.map((a) => a.code).join(' · ');
}

/**
 * Matches a city against a search query.
 *
 * Chinese name, English name and every airport code all resolve, because the
 * three are what people actually type: 广州, Guangzhou, CAN.
 */
export function originMatchesQuery(city: OriginCity, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (query.length === 0) return true;
  return (
    city.cityNameZh.includes(rawQuery.trim()) ||
    city.cityNameEn.toLowerCase().includes(query) ||
    city.country.toLowerCase().includes(query) ||
    city.countryEn.toLowerCase().includes(query) ||
    city.airports.some(
      (a) => a.code.toLowerCase().startsWith(query) || a.nameEn.toLowerCase().includes(query) || a.nameZh.includes(rawQuery.trim()),
    )
  );
}
