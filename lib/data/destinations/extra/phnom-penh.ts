/**
 * PHNOM PENH EXPANSION — areas, hotels and places.
 *
 * Author: Meridian destination-expansion pass (Phnom Penh).
 *
 * Every coordinate in this file comes from a lookup that was actually run:
 *   - `scripts/lookup-place.mjs` (Photon → Overpass → Nominatim, all serving OSM)
 *   - OpenStreetMap directly, via Photon's bbox + osm_tag endpoints
 *   - for Crowne Plaza Phnom Penh only, the coordinate IHG publishes on the
 *     hotel's own property and driving-directions pages (no OSM object exists yet)
 * The source is named in every `coordNote`.
 *
 * EXCLUDED, with reasons:
 *   - Hilton Phnom Penh / DoubleTree: no Hilton-family hotel trades anywhere in
 *     Cambodia. hilton.com/en/locations/cambodia/ lists exactly one property,
 *     Angkor Village Hotel (SLH), in Siem Reap. OSM's only "Hilton" object in
 *     Phnom Penh is a brownfield construction site.
 *   - InterContinental Phnom Penh: closed. The building traded on as The Great
 *     Duke and shut; IHG's own November 2025 release describes Six Senses Krabey
 *     Island as its only open hotel in Cambodia.
 *   - Vignette Collection Phnom Penh Odom: a 2027 pipeline signing, not open.
 *   - Oudong (11.7947, 104.7685) and Tonle Bati (11.3431, 104.8472): both are
 *     genuine Phnom Penh day trips but both fall outside the destination's own
 *     mapBounds for the map to be readable. Documented in the pass report
 *     rather than shipped as unreachable pins.
 *   - Techo International Airport (KTI): real and open, but the OSM aerodrome
 *     centroid (11.3562614, 104.9317325) is ~0.9 km south of the padded west/south
 *     edge of the destination box, so a place record would fail the BOUNDS check.
 *     It remains the destination's airport (see `airportTransfer`).
 *   - Romdeng: OSM still carries the restaurant on Street 55, but the Friends
 *     International training restaurant has not traded there for years and I
 *     could not confirm it is open, so it is not shipped.
 */

import type { AreaSeed, HotelSeed, PlaceSeed } from '../../../types';

export const areas: AreaSeed[] = [
  {
    id: 'wat-phnom-french-quarter',
    destinationId: 'phnom-penh',
    name: 'Wat Phnom & the Old French Quarter',
    nameZh: '塔仔山与老法式街区',
    coordinates: {
      lat: 11.5747464,
      lng: 104.9235581,
      confidence: 'verified',
      coordNote:
        'OSM place=village node "Sangkat Wat Phnom", Khan Daun Penh (11.5747464, 104.9235581) — the sangkat that contains Wat Phnom, the Central Post Office and the Streets 92-130 shophouse grid.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1600,
    bestFor: [
      'Wat Phnom hill and the city\'s founding legend',
      'French-colonial Post Office and shophouse streets',
      'Central Market (Phsar Thmei) shopping',
      'Quieter boutique hotels than the Riverside',
      'Walking to the Riverside, Night Market and Royal Palace',
      'Rooftop bars and old-quarter cafes',
    ],
    bestForZh: [
      '塔仔山与金边建城传说',
      '法属时期邮政总局与骑楼老街',
      '中央市场（新街市）购物',
      '比河畔更安静的精品酒店',
      '步行可达河畔、夜市与王宫',
      '天台酒吧与老城咖啡馆',
    ],
    weakFor: [
      'Beach or resort-style pools',
      'Backpacker party streets',
      'Modern malls and cinemas',
      'Late-night food after midnight',
    ],
    weakForZh: ['海滩或度假式泳池', '背包客狂欢街区', '现代商场与影院', '午夜之后的夜宵'],
    scores: { beach: 1, nightlife: 3, food: 4, luxury: 3, nature: 2, accessibility: 5 },
    vibe: 'Colonial shophouses and temple drums around the hill that gave the city its name',
    vibeZh: '法式骑楼与寺庙鼓声，环绕着为这座城市命名的山丘',
    tagline: 'Temple · Old quarter',
    taglineZh: '塔仔山 · 老城',
    summary:
      'Wat Phnom is where Phnom Penh begins — the 14th-century legend of Lady Penh and the four bronze Buddhas she recovered from the Mekong — and the grid below it is the old French quarter: the colonial Central Post Office, the shophouse blocks of Streets 92 to 130, the National Library, the Central Market (Phsar Thmei) and the Sunway and Raffles-era hotels. It is quieter at night than the Riverside but only a 15-20 minute walk away, which makes it the closest base to both the temple and the river.',
    summaryZh:
      '塔仔山是金边的起点——14 世纪奔夫人从湄公河捞起四尊铜佛的传说就发生在这里。山下的街区就是老法式城区：殖民时期的中央邮政局、92 至 130 街的骑楼、国家图书馆、中央市场（新街市），以及双威等老牌酒店。夜里比河畔安静，步行到河边只要 15 至 20 分钟，是同时靠近塔仔山与河岸的住宿区。',
    idealFor: ['First-time visitors', 'Culture seekers', 'Couples', 'Business travellers'],
    idealForZh: ['第一次来金边', '文化爱好者', '情侣', '商务出行'],
    priceTier: '$$',
  },
  {
    id: 'boeng-keng-kang-bkk2-bkk3',
    destinationId: 'phnom-penh',
    name: 'Boeng Keng Kang (BKK2–BKK3)',
    nameZh: '万景岗二、三区（BKK2–BKK3）',
    coordinates: {
      lat: 11.5529917,
      lng: 104.9184799,
      confidence: 'verified',
      coordNote:
        'OSM place=village node "Sangkat Boeng Keng Kang Ti Pir" (BKK2), Khan Boeng Keng Kang (11.5529917, 104.9184799).',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1100,
    bestFor: [
      'Serviced apartments and long stays',
      'Brunch, coffee and bakeries',
      'Embassies, clinics and international schools',
      'Quiet residential streets',
      'Easy access to Tuol Sleng and the Russian Market',
      'Grab and tuk-tuk coverage to the centre',
    ],
    bestForZh: [
      '酒店式公寓与长住',
      '早午餐、咖啡与面包房',
      '使馆、诊所与国际学校',
      '安静的住宅街道',
      '去 S-21 与俄罗斯市场方便',
      '打车与嘟嘟车覆盖良好',
    ],
    weakFor: [
      'River views and waterfront sunsets',
      'Headline monuments within walking distance',
      'Backpacker party scene',
      'Beach or open nature',
    ],
    weakForZh: ['河景与河畔日落', '步行可达的地标景点', '背包客狂欢氛围', '海滩或开阔自然'],
    scores: { beach: 1, nightlife: 3, food: 5, luxury: 4, nature: 1, accessibility: 4 },
    vibe: 'Leafy expat apartment blocks, cafe courtyards and international schools south of Sihanouk Boulevard',
    vibeZh: '西哈努克大道以南，绿树、公寓楼与咖啡馆院子组成的外籍生活区',
    tagline: 'Apartments · Cafes',
    taglineZh: '公寓 · 咖啡馆',
    summary:
      'The southern half of the Boeng Keng Kang district — BKK2 and BKK3 — is where Phnom Penh\'s long-stay residents actually live: low-rise apartment blocks and serviced residences around Streets 302, 310, 380 and 432, a dense ring of cafes, bakeries, clinics and international schools, and the Wat Langka and Street 51 nightlife edges a short ride away. It is the same khan as the separately modelled BKK1 area, but a distinct, greener and slightly cheaper pocket 10-15 minutes by tuk-tuk from the Riverside.',
    summaryZh:
      '万景岗二、三区（BKK2、BKK3）是金边长住居民真正生活的地方：302、310、380、432 街一带的低层公寓与酒店式住宅，密集的咖啡馆、面包房、诊所和国际学校，稍走几步就是 Wat Langka 与 51 街的夜生活边缘。它与数据集中单独建模的 BKK1 片区同属一个区，但更绿、更便宜，坐嘟嘟车 10 至 15 分钟可到河畔。',
    idealFor: ['Digital nomads', 'Families', 'Long-stay travellers', 'Food lovers'],
    idealForZh: ['数字游民', '家庭出行', '长住旅客', '爱吃的人'],
    priceTier: '$$$',
  },
  {
    id: 'tuol-tom-poung-russian-market',
    destinationId: 'phnom-penh',
    name: 'Tuol Tom Poung & the Russian Market',
    nameZh: '俄罗斯市场（吐斯廉）片区',
    coordinates: {
      lat: 11.5402098,
      lng: 104.9171345,
      confidence: 'verified',
      coordNote:
        'OSM place=village node "Sangkat Tuol Tumpung Ti Muoy", Khan Chamkar Mon (11.5402098, 104.9171345). The Russian Market itself (OSM way 377360535) sits 400 m north-west and is already a place record in the starter inventory.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1300,
    bestFor: [
      'Bargain shopping and souvenirs',
      'Cheap, excellent street food',
      'Budget and mid-range guesthouses',
      'Coffee roasters and bakeries',
      'Tuol Sleng and Choeung Ek history days',
      'Local, non-touristy city life',
    ],
    bestForZh: [
      '淘便宜货与纪念品',
      '便宜又好吃的街头小吃',
      '经济型与中档旅馆',
      '咖啡烘焙店与面包房',
      'S-21 与钟屋杀人场的历史行程',
      '本地人日常的城市生活',
    ],
    weakFor: ['River views', 'Quiet, polished streets', 'Luxury hotels', 'Nightlife beyond beer gardens'],
    weakForZh: ['河景', '安静整洁的街道', '豪华酒店', '啤酒花园以外的夜生活'],
    scores: { beach: 1, nightlife: 2, food: 5, luxury: 2, nature: 1, accessibility: 3 },
    vibe: 'Corrugated-roof market bustle, factory-outlet bargains and street-food smoke',
    vibeZh: '铁皮屋顶市场的喧闹、工厂尾单的便宜货与街头小吃的烟火气',
    tagline: 'Market · Street food',
    taglineZh: '市场 · 街头小吃',
    summary:
      'Tuol Tom Poung is the district around Phsar Tuol Tom Pong — the Russian Market — where Phnom Penh shops for discounted factory clothing, souvenirs and hardware, and eats some of the city\'s best cheap food. The surrounding streets hold small guesthouses and apartments, coffee roasters, Khmer noodle shops and a growing number of international restaurants, with Tuol Sleng (S-21) about 15 minutes north and Choeung Ek a 20-30 minute ride south. It is a practical, local-flavoured base rather than a pretty one.',
    summaryZh:
      '吐斯廉片区的核心是吐斯廉市场（Phsar Tuol Tom Pong），也就是俄罗斯市场——金边人买折扣工厂服装、纪念品和五金，以及吃便宜街头小吃的地方。周边街道上有小旅馆和公寓、咖啡烘焙店、柬式粿条铺和越来越多的国际餐厅；往北 15 分钟是 S-21 监狱博物馆，往南 20 至 30 分钟是钟屋杀人场。这里实用、生活气息重，但不算漂亮。',
    idealFor: ['Budget travellers', 'Food lovers', 'Shoppers', 'Repeat visitors'],
    idealForZh: ['预算有限的旅客', '爱吃的人', '购物爱好者', '重游金边的人'],
    priceTier: '$$',
  },
  {
    id: 'tonle-bassac-koh-pich',
    destinationId: 'phnom-penh',
    name: 'Tonle Bassac & Koh Pich (Diamond Island)',
    nameZh: '钻石岛与巴萨河畔',
    coordinates: {
      lat: 11.5474134,
      lng: 104.9400211,
      confidence: 'verified',
      coordNote:
        'OSM place=suburb node "Koh Pich" (Diamond Island), Khan Chamkar Mon (11.5474134, 104.9400211) — the district centre; the 1.9 km radius also spans the Tonle Bassac mainland with NagaWorld and AEON Mall 1.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1900,
    bestFor: [
      'Modern city hotels and condos',
      'Casino and entertainment evenings',
      'AEON Mall 1 shopping and cinema',
      'Conventions and exhibitions',
      'Riverside walks without the backpacker strip',
      'Short transfers to the Royal Palace',
    ],
    bestForZh: [
      '现代城市酒店与公寓',
      '赌场与夜间娱乐',
      '永旺梦乐城1 购物与影院',
      '会展与展览',
      '没有背包客街的河畔散步',
      '到王宫的短途车程',
    ],
    weakFor: ['Old-colonial charm', 'Cheap street food', 'Quiet residential streets', 'Independent local shops'],
    weakForZh: ['老殖民风情', '便宜的街头小吃', '安静的住宅街道', '独立小店'],
    scores: { beach: 1, nightlife: 4, food: 3, luxury: 4, nature: 2, accessibility: 4 },
    vibe: 'Casino lights, glass towers and new-build waterfront promenades on the Mekong',
    vibeZh: '赌场灯火、玻璃塔楼与湄公河畔新建的滨水步道',
    tagline: 'Casino · New city',
    taglineZh: '赌场 · 新城',
    summary:
      'Sangkat Tonle Bassac and the reclaimed island of Koh Pich (Diamond Island) form the city\'s fast-changing south-east corner: NagaWorld\'s casino complex, AEON Mall 1, the Sofitel and a wall of new condominium towers, tied to the mainland by the Koh Pich bridges. The island\'s waterfront promenades, exhibition centre and evening lights pull in local families at weekends, and the whole district is about ten minutes from the Riverside and the Royal Palace.',
    summaryZh:
      '巴萨河分区与人工岛钻石岛（Koh Pich）是金边变化最快的东南角：金界娱乐城、永旺梦乐城1、索菲特酒店和一排排新公寓塔楼，通过钻石岛大桥与市区相连。岛上的滨水步道、会展中心和夜间灯光吸引本地家庭周末前来，到河畔和王宫约十分钟车程。',
    idealFor: ['Business travellers', 'Couples', 'Convention visitors', 'Shoppers'],
    idealForZh: ['商务出行', '情侣', '参展参会的人', '购物爱好者'],
    priceTier: '$$$',
  },
  {
    id: 'sen-sok-por-sen-chey',
    destinationId: 'phnom-penh',
    name: 'Russian Boulevard & Sen Sok (western corridor)',
    nameZh: '俄罗斯大道与森速片区',
    coordinates: {
      lat: 11.5785557,
      lng: 104.8692475,
      confidence: 'verified',
      coordNote:
        'OSM place=town node "Khan Sen Sok", Phnom Penh Municipality (11.5785557, 104.8692475). The 5 km radius deliberately reaches back east along Russian Federation Boulevard to the Chip Mong Tower (Fairfield by Marriott) and west to Por Sen Chey (Crowne Plaza).',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 5000,
    bestFor: [
      'Airport-side and business hotels with parking',
      'Long-stay condos and serviced apartments',
      'AEON Mall 2 and big-box shopping',
      'Cheap local markets and Khmer food',
      'Road access to the airport and the PPSEZ',
      'Self-driving and free parking',
    ],
    bestForZh: [
      '带停车位的机场侧与商务酒店',
      '长住公寓与酒店式住宅',
      '永旺梦乐城2 与大型商场',
      '便宜的本地市场与高棉菜',
      '通往机场和经济特区的公路交通',
      '自驾方便、停车免费',
    ],
    weakFor: [
      'Sightseeing on foot',
      'River views and promenades',
      'Walkable cafes, bars and restaurants',
      'Public transport',
    ],
    weakForZh: ['步行观光', '河景与滨水步道', '步行可达的咖啡馆、酒吧与餐厅', '公共交通'],
    scores: { beach: 1, nightlife: 1, food: 3, luxury: 3, nature: 2, accessibility: 2 },
    vibe: 'Wide boulevards, gated suburbs and factory gates on the road out of the city',
    vibeZh: '宽阔大道、封闭式住宅区，以及出城路上的工厂大门',
    tagline: 'Business · Airport road',
    taglineZh: '商务 · 机场路',
    summary:
      'This is the western corridor along Russian Federation Boulevard (Russia Avenue, National Road 4): from the Chip Mong Tower at the city edge, out past Sen Sok\'s gated communities and AEON Mall 2, to Por Sen Chey — the industrial belt that holds the Phnom Penh Special Economic Zone and the former Pochentong airport. Travellers come here for business hotels with parking and easy road access, long-stay condos and big-box shopping rather than for sightseeing, and the ride into the centre is 20-40 minutes depending on traffic.',
    summaryZh:
      '这是沿俄罗斯大道（4 号国道）向西的走廊：从市区的 Chip Mong Tower 往外，经过森速区的封闭式住宅区和永旺梦乐城2，一直到普森芷区——金边经济特区所在的工业带和波成东旧机场所在地。旅客来这里主要是为了带停车位、公路交通方便的商务酒店、长住公寓和大型商场，而不是观光；进市区视堵车情况约 20 至 40 分钟。',
    idealFor: ['Business travellers', 'Long stays', 'Drivers', 'Return visitors'],
    idealForZh: ['商务出行', '长住旅客', '自驾旅客', '重游金边的人'],
    priceTier: '$$',
  },
  {
    id: 'chroy-changvar-east-bank',
    destinationId: 'phnom-penh',
    name: 'Chroy Changvar (east bank)',
    coordinates: {
      lat: 11.5895042,
      lng: 104.9350085,
      confidence: 'verified',
      coordNote:
        'OSM place=village node "Sangkat Chroy Changvar", Khan Chroy Changvar (11.5895042, 104.9350085) — the older, low-rise part of the peninsula on the east bank of the Tonle Sap/Mekong.',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 4000,
    bestFor: [
      'The national stadium and big events',
      'Riverside pagodas and rural lanes',
      'Ferry crossings to Silk Island',
      'Cycling and motorbike day loops',
      'Cheap local food away from the tourist strip',
    ],
    bestForZh: [
      '国家体育场与大型活动',
      '河畔寺庙与乡间小路',
      '坐渡船去丝绸岛',
      '骑行与摩托一日环线',
      '远离游客区的便宜本地小吃',
    ],
    weakFor: [
      'Hotel choice for a first visit',
      'Nightlife',
      'Walking to the city\'s monuments',
      'Public transport',
    ],
    weakForZh: ['首次到访的住宿选择', '夜生活', '步行前往市区景点', '公共交通'],
    scores: { beach: 2, nightlife: 1, food: 2, luxury: 2, nature: 4, accessibility: 2 },
    vibe: 'Riverside pagodas, fishing hamlets and a satellite city taking shape across the bridge',
    vibeZh: '过桥之后的河畔寺庙、渔村与正在成形的新城',
    tagline: 'East bank · Day trip',
    taglineZh: '东岸 · 半日游',
    summary:
      'Chroy Changvar is the peninsula on the far side of the Chroy Changvar bridge, between the Mekong and the Tonle Sap: low-rise, still half-rural, with pagodas, fishing hamlets, the new satellite city, the China-aided Morodok Techo National Stadium at its northern edge and the jetty roads that lead to the Silk Island ferries. It is a half-day excursion rather than a base, and pairs naturally with a Koh Dach trip.',
    summaryZh:
      '铁桥头（Chroy Changvar）是过了大桥之后的半岛，夹在湄公河与洞里萨河之间：低层建筑、仍带乡村气息，有寺庙、渔村、新建的卫星城，北端是中国援建的柬埔寨国家体育场，还有通往丝绸岛渡口的道路。这里适合半日游而非住宿基地，通常与丝绸岛行程合并。',
    idealFor: ['Half-day trips', 'Families', 'Cyclists', 'Return visitors'],
    idealForZh: ['半日游', '家庭出行', '骑行爱好者', '重游金边的人'],
    priceTier: '$$',
  },
  {
    id: 'mekong-islands-koh-dach',
    destinationId: 'phnom-penh',
    name: 'Mekong Islands (Koh Dach & Koh Oknha Tey)',
    nameZh: '湄公河岛屿（丝绸岛一带）',
    coordinates: {
      lat: 11.6681453,
      lng: 104.9372085,
      confidence: 'verified',
      coordNote:
        'OSM place=island node "Koh Dach", Khan Chroy Changvar (11.6681453, 104.9372085) — the larger of the two silk-weaving islands; the 6 km radius also covers Koh Oknha Tey (OSM island "Koh Ohkna Tei", 11.63087, 104.94019).',
    },
    isStayBase: false,
    zoneType: 'island',
    radiusMeters: 6000,
    bestFor: [
      'Silk weaving workshops and wooden looms',
      'Cycling and walking on flat island lanes',
      'Riverbank pagodas and picnic spots',
      'Half-day escapes from the city',
      'Fruit orchards and rice fields',
    ],
    bestForZh: [
      '丝绸织造作坊与木织机',
      '在平坦的岛上小路骑车散步',
      '河畔寺庙与野餐点',
      '半日逃离城市',
      '果园与稻田',
    ],
    weakFor: [
      'Hotels and nightlife',
      'Public transport',
      'Wet-season tracks and mud',
      'Sightseeing in the midday heat',
    ],
    weakForZh: ['酒店与夜生活', '公共交通', '雨季的泥泞小路', '正午高温下观光'],
    scores: { beach: 2, nightlife: 1, food: 2, luxury: 1, nature: 5, accessibility: 2 },
    vibe: 'Loom houses, orchards and empty island lanes a ferry ride from the capital',
    vibeZh: '渡船之外，织机人家、果园与空旷的岛上小路',
    tagline: 'Silk · Island day trip',
    taglineZh: '丝绸 · 岛屿半日游',
    summary:
      'The Mekong north of Phnom Penh divides around two silk-weaving islands: Koh Dach, the larger one, and Koh Oknha Tey, the smaller and quieter one. Both are reached by vehicle ferry or chartered boat from the Chroy Changvar bank and explored by bicycle or tuk-tuk past wooden looms, dye yards, fruit orchards, rice fields and riverbank pagodas. This is the closest genuine countryside to the city — a half-day trip, with nowhere on either island worth recommending as a hotel.',
    summaryZh:
      '金边以北的湄公河分叉出两座织绸岛：较大的丝绸岛（Koh Dach）和更小更安静的奥克纳泰岛（Koh Oknha Tey）。从铁桥头一侧坐汽车渡轮或包船过去，再骑自行车或坐嘟嘟车穿过木织机、染坊、果园、稻田和河畔寺庙。这是离金边最近的真正乡村，适合半日游，岛上没有值得推荐的住宿。',
    idealFor: ['Half-day trips', 'Families', 'Cyclists', 'Culture seekers'],
    idealForZh: ['半日游', '家庭出行', '骑行爱好者', '文化爱好者'],
    priceTier: '$',
  },
  {
    id: 'olympic-veal-vong',
    destinationId: 'phnom-penh',
    name: 'Olympic Stadium & Veal Vong (7 Makara)',
    nameZh: '奥林匹克体育场一带（玛卡拉区）',
    coordinates: {
      lat: 11.5624743,
      lng: 104.9094089,
      confidence: 'verified',
      coordNote:
        'OSM place=village node "Sangkat Veal Vong", Khan Prampi Makara (11.5624743, 104.9094089); the Olympic Stadium (OSM leisure=stadium) sits 550 m south-east.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1500,
    bestFor: [
      'Mid-range city hotels',
      'Local markets and Khmer street food',
      'Running and evening aerobics at the stadium',
      'Walking distance to BKK1 and Monivong Boulevard',
      'Cheap local coffee and noodle shops',
    ],
    bestForZh: [
      '中档城市酒店',
      '本地市场与高棉街头小吃',
      '在体育场跑步和跳晚间健身操',
      '步行可达 BKK1 与莫尼旺大道',
      '便宜的本地咖啡与粿条铺',
    ],
    weakFor: [
      'River views',
      'Colonial architecture',
      'International dining density',
      'Nightlife beyond beer gardens',
    ],
    weakForZh: ['河景', '殖民时期建筑', '密集的国际餐厅', '啤酒花园以外的夜生活'],
    scores: { beach: 1, nightlife: 2, food: 4, luxury: 1, nature: 2, accessibility: 4 },
    vibe: 'Markets and mid-range hotels around a 1960s stadium that doubles as the city\'s running track',
    vibeZh: '1960 年代体育场周边，市场与中档酒店，体育场同时也是全城的跑道',
    tagline: 'Stadium · Local city',
    taglineZh: '体育场 · 本地生活',
    summary:
      'Veal Vong and the streets around the Olympic Stadium make up Khan Prampir Meakkakra, the small district wedged between Monivong Boulevard and Toul Kork. The stadium is a Khmer-modernist landmark built for the 1963 Southeast Asian Peninsular Games, and its track, steps and forecourt fill with walkers and aerobics classes at dawn and dusk. Around it are wet markets, mid-range hotels, gyms and cheap noodle shops — ordinary Phnom Penh daily life, ten minutes from BKK1.',
    summaryZh:
      '威旺分区和奥林匹克体育场周边构成了玛卡拉区——夹在莫尼旺大道与都昆区之间的小片区。体育场是为 1963 年东南亚半岛运动会而建的高棉现代主义地标，清晨和傍晚跑道、看台与前广场上满是散步和跳健身操的人。周边是菜市场、中档酒店、健身房和便宜的粿条铺，是再日常不过的金边生活，到 BKK1 只要十分钟。',
    idealFor: ['Budget and mid-range travellers', 'Runners', 'Repeat visitors', 'Local-food seekers'],
    idealForZh: ['经济与中档旅客', '跑步爱好者', '重游金边的人', '想吃本地菜的人'],
    priceTier: '$$',
  },
];

export const hotels: HotelSeed[] = [
  {
    id: 'fairfield-by-marriott-phnom-penh',
    name: 'Fairfield by Marriott Phnom Penh',
    nameZh: '金边万枫酒店',
    destinationId: 'phnom-penh',
    areaId: 'sen-sok-por-sen-chey',
    hotelGroup: 'marriott',
    brand: 'Fairfield by Marriott',
    brandId: 'fairfield',
    coordinates: {
      lat: 11.5705149,
      lng: 104.9027178,
      confidence: 'verified',
      coordNote:
        'OSM tourism=hotel "Fairfield by Marriott Phnom Penh", Chip Mong Tower, Russian Federation Boulevard (Street 110), Sangkat Phsar Thmey Ti Pir, Khan Daun Penh — 11.5705149, 104.9027178.',
    },
    priceTier: '$$',
    priceTierBasis:
      'Select-service positioning inside the Marriott Bonvoy portfolio — the tier follows the brand segment, not a live rate.',
    propertyType: 'City Hotel',
    tags: ['City', 'Family'],
    beachAccess: 'none',
    beachAccessNote:
      'Inland capital city; there is no beach in Phnom Penh (the nearest coast is Sihanoukville, four to six hours away).',
    airportTransfer: {
      toAirportId: 'techo-international-airport',
      minutesMin: 45,
      minutesMax: 70,
      confidence: 'approximate',
    },
    description:
      'Marriott\'s select-service Fairfield occupies the Chip Mong Tower on Russian Federation Boulevard, on the western approach to the city and about 8 km from the former Pochentong airport. All 300 rooms have work desks and ergonomic chairs, the infinity pool and rooftop bar sit on the 28th floor, and the Riverside and Royal Palace are a 20-30 minute tuk-tuk ride away. It is the most affordable way to earn Marriott Bonvoy points in Phnom Penh.',
    descriptionZh:
      '万枫是万豪旗下的精选服务品牌，酒店位于俄罗斯大道上的 Chip Mong Tower，在城市西侧入口处、距波成东旧机场约 8 公里。300 间客房都配办公桌和人体工学椅，28 层有无边泳池和天台酒吧，坐嘟嘟车到河畔与王宫约 20 至 30 分钟。这是在金边累积万豪旅享家积分最经济的选择。',
    loyaltyProgramme: 'Marriott Bonvoy',
    roomCount: 300,
  },
  {
    id: 'hyatt-regency-phnom-penh',
    name: 'Hyatt Regency Phnom Penh',
    nameZh: '金边凯悦酒店',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    hotelGroup: 'hyatt',
    brand: 'Hyatt Regency',
    brandId: 'hyatt-regency',
    coordinates: {
      lat: 11.5663783,
      lng: 104.9280954,
      confidence: 'verified',
      coordNote:
        'OSM tourism=hotel "Hyatt Regency", Preah Ang Makhak Vann (Street 178), Sangkat Phsar Kandal Ti Pir, Khan Daun Penh — 11.5663783, 104.9280954.',
    },
    priceTier: '$$$',
    priceTierBasis:
      'Upper-upscale full-service positioning within World of Hyatt — derived from the brand segment, not a live rate.',
    propertyType: 'City Hotel',
    tags: ['City', 'Luxury', 'Couple'],
    beachAccess: 'none',
    beachAccessNote:
      'Inland capital city; no beach. The hotel has a courtyard pool, not a shoreline.',
    airportTransfer: {
      toAirportId: 'techo-international-airport',
      minutesMin: 50,
      minutesMax: 75,
      confidence: 'approximate',
    },
    description:
      'Hyatt\'s first hotel in Cambodia sits on Street 178 in the old French quarter, a few minutes\' walk from the National Museum, the Royal Palace and the Riverside. The 247 rooms and suites wrap around a courtyard pool, with a rooftop bar and a Khmer restaurant on site. It is the largest international-brand hotel in the historic centre and the most comfortable full-service base for a first sightseeing trip.',
    descriptionZh:
      '金边凯悦是凯悦在柬埔寨的第一家酒店，位于老法式街区的 178 街，步行几分钟可到国家博物馆、王宫和河畔。247 间客房与套房围绕中庭泳池分布，设有天台酒吧和高棉餐厅。它是历史城区里体量最大的国际品牌酒店，也是首次观光最舒适的全服务基地。',
    loyaltyProgramme: 'World of Hyatt',
    roomCount: 247,
    officialUrl: 'https://www.hyatt.com/en-US/hotel/cambodia/hyatt-regency-phnom-penh/pnhrp',
  },
  {
    id: 'crowne-plaza-phnom-penh',
    name: 'Crowne Plaza Phnom Penh',
    nameZh: '金边皇冠假日酒店',
    destinationId: 'phnom-penh',
    areaId: 'sen-sok-por-sen-chey',
    hotelGroup: 'ihg',
    brand: 'Crowne Plaza',
    brandId: 'crowne-plaza',
    coordinates: {
      lat: 11.558751,
      lng: 104.84866,
      confidence: 'verified',
      coordNote:
        'Position published by IHG on the hotel\'s own Crowne Plaza Phnom Penh property and driving-directions pages (11.558751, 104.848660), matching its published address No. 1679 Russian Federation Blvd., Por Sen Chey, Phnom Penh 120912. No OSM object exists for this hotel yet.',
    },
    priceTier: '$$$',
    priceTierBasis:
      'Upper-upscale business positioning inside IHG One Rewards, converted from the independent VM Hotel — brand segment, not a live rate.',
    propertyType: 'City Hotel',
    tags: ['City', 'Family'],
    beachAccess: 'none',
    beachAccessNote:
      'Inland capital city on the Russian Boulevard industrial corridor; no beach.',
    airportTransfer: {
      toAirportId: 'techo-international-airport',
      minutesMin: 45,
      minutesMax: 70,
      confidence: 'approximate',
    },
    description:
      'IHG\'s Crowne Plaza opened at the end of 2025 in a phased conversion of the former VM Hotel, inside the CG Fortune Center development at No. 1679 Russian Federation Boulevard in Por Sen Chey. It stands on the industrial corridor beside the Phnom Penh Special Economic Zone and the disused Pochentong airport, so it is a business, conference and airport-side hotel rather than a sightseeing base. The first 137 refurbished rooms opened first, with a further 139 due by 2027.',
    descriptionZh:
      '金边皇冠假日酒店于 2025 年底分阶段开业，由原 VM Hotel 改造，位于普森芷区俄罗斯大道 1679 号的 CG Fortune Center 综合体内。酒店在金边经济特区与已停用的波成东机场旁的工业走廊上，是商务、会议与机场侧的住宿，而不是观光基地。先开放 137 间翻新客房，另有 139 间预计 2027 年完成。',
    loyaltyProgramme: 'IHG One Rewards',
    roomCount: 276,
    officialUrl: 'https://www.ihg.com/crowneplaza/hotels/us/en/phnom-penh/pnhra/hoteldetail',
  },
  {
    id: 'sunway-hotel-phnom-penh',
    name: 'Sunway Hotel Phnom Penh',
    nameZh: '金边双威酒店',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    hotelGroup: 'gha',
    brand: 'Sunway Hotels & Resorts',
    brandId: 'sunway',
    coordinates: {
      lat: 11.5765221,
      lng: 104.9214504,
      confidence: 'verified',
      coordNote:
        'OSM tourism=hotel "Sunway Hotel", Wat Phnom Roundabout, Boeung Kak Community, Khan Daun Penh — 11.5765221, 104.9214504.',
    },
    priceTier: '$$',
    priceTierBasis:
      'Upper-upscale regional brand (Sunway Hotels & Resorts of Malaysia) inside the GHA DISCOVERY alliance — brand positioning, not a live rate.',
    propertyType: 'City Hotel',
    tags: ['City', 'Family'],
    beachAccess: 'none',
    beachAccessNote: 'Inland capital city; the hotel has a pool, not a beach.',
    airportTransfer: {
      toAirportId: 'techo-international-airport',
      minutesMin: 50,
      minutesMax: 75,
      confidence: 'approximate',
    },
    description:
      'The Malaysian Sunway group\'s city hotel stands on Monivong Boulevard at the Wat Phnom roundabout, a few minutes\' walk from Wat Phnom and about fifteen minutes from the Riverside and the Central Market. It is a mid-sized full-service hotel with a pool, all-day dining and meeting space, and it is Phnom Penh\'s GHA DISCOVERY member — the one property in the city where that programme earns.',
    descriptionZh:
      '金边双威酒店是马来西亚双威集团的城市酒店，位于莫尼旺大道塔仔山圆环旁，步行几分钟到塔仔山，到河畔和中央市场约十五分钟。酒店规模适中、全服务，设有泳池、全日餐厅和会议场地，也是金边加入 GHA DISCOVERY 的成员酒店，是全市唯一能累积该计划积分的物业。',
    loyaltyProgramme: 'GHA DISCOVERY',
    officialUrl: 'https://www.sunwayhotels.com/sunway-phnompenh',
  },
];

export const places: PlaceSeed[] = [
  {
    id: 'national-museum-of-cambodia',
    name: 'National Museum of Cambodia',
    nameZh: '柬埔寨国家博物馆',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'activity',
    subcategory: 'museum',
    coordinates: {
      lat: 11.5654592,
      lng: 104.929295,
      confidence: 'verified',
      coordNote:
        'OSM tourism=museum "National Museum of Cambodia", Preah Ang Eng (Street 13), Sangkat Chey Chumneah, Khan Daun Penh — 11.5654592, 104.929295.',
    },
    recommendedDurationMin: 75,
    bestTime: 'Opening hour or the last two hours; the open courtyards are at their hottest from about 11:00 to 14:00',
    bestTimeZh: '刚开门或闭馆前两小时；约 11 点至 14 点露天庭院最晒',
    tags: ['Museum', 'Khmer-art', 'Sculpture', 'Architecture', 'Culture'],
    tagsZh: ['博物馆', '高棉艺术', '雕塑', '建筑', '文化'],
    description:
      'Cambodia\'s national museum, founded in 1920 under French rule, holds the finest collection of Khmer sculpture anywhere: pre-Angkorian bronzes, sandstone gods from the Angkor period, Jayavarman VII portrait heads from the Bayon, and the lintels and pediments carried out of jungle temples. The building itself is a terracotta-coloured courtyard in the Khmer style, built around lotus ponds and four covered galleries, which makes it as much an architectural visit as a museum one.',
    descriptionZh:
      '柬埔寨国家博物馆建于 1920 年法属时期，收藏着世界上最完整的高棉雕塑：前吴哥时期的青铜器、吴哥时期的砂岩神像、巴戎寺的阇耶跋摩七世头像，以及从丛林寺庙运出的门楣与山花。建筑本身是赭红色的高棉式回廊，围绕荷花池与四面展廊展开，因此这里既看文物也看建筑。',
    notes:
      'The museum faces the Royal Palace across Street 13, so the two fit into one morning; tickets are sold at the gate, some galleries restrict photography, and the central courtyard is the coolest place to pause.',
    notesZh:
      '博物馆与王宫隔着 13 街相对，适合安排在同一上午；门票在门口购买，部分展厅限制拍照，中央庭院是歇脚最凉快的地方。',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'half-day', 'rainy-day'],
    markerLayer: 'activity',
  },
  {
    id: 'wat-ounalom',
    name: 'Wat Ounalom (Ounalom Pagoda)',
    nameZh: '乌那隆寺',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 11.5679438,
      lng: 104.9296391,
      confidence: 'verified',
      coordNote:
        'OSM place_of_worship "Ounalom Pagoda", Dekcho Damdin (Street 154), Sangkat Phsar Kandal Ti Muoy, Khan Daun Penh — 11.5679438, 104.9296391 (OSM name is "Ounalom Pagoda"; the temple is known as Wat Ounalom).',
    },
    recommendedDurationMin: 30,
    bestTime: 'Early morning, when monks are chanting and the courtyards are in shade',
    bestTimeZh: '清晨，僧人诵经、庭院有阴影的时候',
    tags: ['Temple', 'Buddhist', 'Culture', 'Riverside', 'Quiet'],
    tagsZh: ['寺庙', '佛教', '文化', '河畔', '安静'],
    description:
      'Wat Ounalom is the headquarters of the Cambodian Buddhist sangha and, by tradition, the country\'s most important pagoda: it is said to hold an eyebrow hair of the Buddha, and it was badly damaged under the Khmer Rouge before being restored. The complex runs from Street 154 back to the Sisowath Quay waterfront and holds a central stupa, several gilded halls and a courtyard of stupas and bodhi trees.',
    descriptionZh:
      '乌那隆寺是柬埔寨佛教僧伽的总部，传统上被视为全国最重要的寺庙：据说供奉着佛陀的一根眉毛舍利，红色高棉时期遭到严重破坏后重建。寺院从 154 街一直延伸到西索瓦码头河畔，中轴有一座大塔、数座金碧辉煌的大殿，以及布满佛塔与菩提树的庭院。',
    notes:
      'It is an active monastic compound rather than a museum: dress with shoulders and knees covered, keep voices down, and step out of the way of chanting; entry is free and donations are welcome.',
    notesZh:
      '这里是仍在运作的僧院而不是博物馆：请遮住肩膝、放低音量，遇到诵经时让出通道；免费进入，欢迎随喜供养。',
    entryFee: 'Free (donations welcome)',
    entryFeeZh: '免费（欢迎随喜供养）',
    discovery: ['culture'],
    recommendedFor: ['first-time', 'quiet', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'wat-botum',
    name: 'Wat Botum Vathey',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 11.5595606,
      lng: 104.9309724,
      confidence: 'verified',
      coordNote:
        'OSM place_of_worship "Wat Botum", Street 244, Sangkat Chaktomuk, Khan Daun Penh — 11.5595606, 104.9309724.',
    },
    recommendedDurationMin: 30,
    bestTime: 'Morning or late afternoon; combine with the park next door at sunset',
    bestTimeZh: '上午或傍晚；可与旁边公园的日落一起安排',
    tags: ['Temple', 'Buddhist', 'Culture', 'Park', 'Quiet'],
    tagsZh: ['寺庙', '佛教', '文化', '公园', '安静'],
    description:
      'Wat Botum, just south of the Royal Palace, is one of the city\'s five original founding pagodas and is known for its painted main hall, its school of Buddhist studies and the stupas of several senior monks. The compound opens directly onto Wat Botum Park, so the two are visited together — temple first, then the lawns that run up to Sothearos Boulevard.',
    descriptionZh:
      '塔子山以南的 Wat Botum（波东寺）是金边最初五座寺庙之一，以彩绘大殿、佛学院和多位高僧的佛塔著称。寺院直接与 Wat Botum 公园相连，通常一起参观——先看寺庙，再走到通往苏塔罗大道的草坪。',
    notes:
      'The temple is an active monastery and a school, so avoid the study hours and dress respectfully; the park outside is where the city flies kites and plays football in the late afternoon.',
    notesZh:
      '这里是仍在使用的僧院与学校，请避开上课时间并注意着装；外面公园的傍晚是本地人放风筝、踢足球的地方。',
    entryFee: 'Free (donations welcome)',
    entryFeeZh: '免费（欢迎随喜供养）',
    discovery: ['culture'],
    recommendedFor: ['first-time', 'quiet', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'wat-botum-park',
    name: 'Wat Botum Park',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'nature',
    subcategory: 'park',
    coordinates: {
      lat: 11.5592337,
      lng: 104.9326341,
      confidence: 'verified',
      coordNote:
        'OSM place=square "Wat Botum Park", Sangkat Chaktomuk, Khan Daun Penh — 11.5592337, 104.9326341.',
    },
    recommendedDurationMin: 40,
    bestTime: 'From about 16:30, when the heat drops and the lawns fill with families and football games',
    bestTimeZh: '约 16:30 之后，暑气退去，草坪上满是家庭和踢球的人',
    tags: ['Park', 'Green-space', 'Sunset', 'Local-life', 'Free'],
    tagsZh: ['公园', '绿地', '日落', '本地生活', '免费'],
    description:
      'The long strip of grass and paving between Wat Botum and Sothearos Boulevard is the closest thing central Phnom Penh has to a village green: aerobics groups at dawn, kite-flyers and football in the late afternoon, food carts along the southern edge and a clear view of the illuminated Independence Monument after dark. It is also the natural breathing space between the Royal Palace, the temple and the river.',
    descriptionZh:
      '从 Wat Botum 到苏塔罗大道之间这条狭长的草地与铺装带，是金边市中心最接近「村口大草坪」的地方：清晨有健身操队伍，傍晚有人放风筝、踢足球，南侧一排小吃车，天黑后还能看到亮灯的独立纪念碑。它也是王宫、寺庙与河岸之间天然的缓冲绿地。',
    notes:
      'There is little shade at midday and no seating beyond low kerbs; drink vendors and public toilets are at the Sothearos Boulevard end.',
    notesZh: '正午几乎没有遮阴，坐的地方只有矮路缘；饮料摊和公共厕所在苏塔罗大道一侧。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    discovery: ['nature'],
    recommendedFor: ['family', 'quiet', 'sunset', 'budget'],
    markerLayer: 'nature',
  },
  {
    id: 'cambodia-vietnam-friendship-monument',
    name: 'Cambodia–Vietnam Friendship Monument',
    nameZh: '柬越友谊纪念碑',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5586996,
      lng: 104.9327718,
      confidence: 'verified',
      coordNote:
        'OSM tourism=attraction "Cambodia-Vietnam Friendship Monument", Samdech Sothearos Boulevard (Street 3), Sangkat Chey Chumneah, Khan Daun Penh — 11.5586996, 104.9327718.',
    },
    recommendedDurationMin: 15,
    bestTime: 'Late afternoon or after dark, when the monument is floodlit',
    bestTimeZh: '傍晚或天黑后，纪念碑有灯光照明',
    tags: ['Landmark', 'Monument', 'Sculpture', 'History', 'Photo-stop'],
    tagsZh: ['地标', '纪念碑', '雕塑', '历史', '拍照点'],
    description:
      'The circular concrete monument on Sothearos Boulevard, sculpted in 1979 in the socialist-realist style of the period, shows a Cambodian and a Vietnamese fighter standing shoulder to shoulder and was erected to mark Vietnam\'s role in ending the Khmer Rouge regime. It is a two-minute stop on the walk between the Royal Palace and Wat Botum Park, and it is one of the most photographed pieces of monument sculpture left in the city.',
    descriptionZh:
      '这座位于苏塔罗大道上的环形混凝土纪念碑建于 1979 年，是当时社会主义现实主义风格的雕塑，一名柬埔寨战士与一名越南战士并肩而立，用以纪念越南在结束红色高棉政权中的作用。它是王宫与 Wat Botum 公园之间步行路线上的两分钟停留点，也是金边留存最常被拍摄的纪念雕塑之一。',
    notes:
      'It stands on a traffic roundabout, so approach from the park side rather than trying to cross mid-flow; the monument is viewed from outside and there is nothing to enter.',
    notesZh:
      '纪念碑位于道路环岛上，请从公园一侧靠近，不要横穿车流；只能在外围观看，没有可进入的部分。',
    entryFee: 'Free to view from the roundabout',
    entryFeeZh: '在环岛外免费观看',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'photo-spots', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'chaktomouk-conference-hall',
    name: 'Chaktomouk Conference Hall',
    nameZh: '四臂湾会议厅',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5626785,
      lng: 104.9348903,
      confidence: 'verified',
      coordNote:
        'OSM amenity=theatre "Chaktomouk Conference Hall", Preah Sisowath Quay (Street 1), Sangkat Phsar Kandal Ti Muoy, Khan Daun Penh — 11.5626785, 104.9348903.',
    },
    recommendedDurationMin: 20,
    bestTime: 'Daylight, from the riverside path; evenings when a performance is on',
    bestTimeZh: '白天从河畔步道看建筑；有演出的晚上',
    tags: ['Architecture', 'Landmark', 'Modernist', 'Riverside', 'Photo-stop'],
    tagsZh: ['建筑', '地标', '现代主义', '河畔', '拍照点'],
    description:
      'The Chaktomouk Conference Hall is the best surviving piece of Cambodian modernist architecture on the riverfront: a 1961 building by Vann Molyvann whose upswept concrete roof was designed to echo the four arms of the Mekong at the Chaktomuk confluence. It is a working conference and performance venue rather than a sight, but the exterior and its position on the promenade justify a stop on any riverside walk.',
    descriptionZh:
      '四臂湾会议厅是河畔留存最好的柬埔寨现代主义建筑：1961 年由旺莫利万设计，上扬的混凝土屋面意在呼应四臂湾（Chaktomuk）湄公河分流的四条水道。它至今仍是会议与演出场地而非景点，但建筑外观与它在滨水步道上的位置，值得在河畔散步时停下来看。',
    notes:
      'You can only go inside for a ticketed event; the best view is from the Sisowath Quay promenade on the city side, where the roof line is visible against the river.',
    notesZh:
      '只有购票活动才能入内；最佳观察点是市区一侧的西索瓦码头滨水步道，可以看到屋脊线与河面同框。',
    discovery: ['culture'],
    recommendedFor: ['photo-spots', 'first-time'],
    markerLayer: 'activity',
  },
  {
    id: 'royal-university-of-fine-arts',
    name: 'Royal University of Fine Arts',
    nameZh: '皇家艺术大学',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5651012,
      lng: 104.9281734,
      confidence: 'verified',
      coordNote:
        'OSM amenity=university "Royal University of Fine Arts", Preah Ang Yukanthor (Street 19), Sangkat Phsar Kandal Ti Pir, Khan Daun Penh — 11.5651012, 104.9281734.',
    },
    recommendedDurationMin: 30,
    bestTime: 'Weekday mornings during term, when the practice rooms and courtyards are in use',
    bestTimeZh: '学期内的工作日上午，练功房与庭院都有人在使用',
    tags: ['Culture', 'Music', 'Dance', 'Architecture', 'Campus'],
    tagsZh: ['文化', '音乐', '舞蹈', '建筑', '校园'],
    description:
      'The Royal University of Fine Arts, next door to the National Museum, is where Cambodia\'s classical dance, music, circus and plastic arts are taught — the same institution that kept the classical repertoire alive after the Khmer Rouge period. Its campus of ochre colonial buildings and open courtyards sits behind the museum, and students can often be heard rehearsing pinpeat music and classical dance.',
    descriptionZh:
      '皇家艺术大学紧邻国家博物馆，是柬埔寨古典舞蹈、音乐、杂技与造型艺术的最高学府，也是在红色高棉之后让古典剧目得以延续的机构。赭色殖民风格建筑与开阔庭院位于博物馆后方，常能听到学生排练 pinpeat 乐器与古典舞。',
    notes:
      'It is a working university: ask at the gate before walking in, avoid exam periods, and never photograph students without permission; some public performances are advertised at the entrance.',
    notesZh:
      '这里是正常上课的大学：进入前先在校门口询问，避开考试周，未经允许不要拍摄学生；门口会张贴一些公开演出信息。',
    entryFee: 'Free to view the campus exterior; ask at the gate',
    entryFeeZh: '参观校园外观免费，请先在校门口询问',
    discovery: ['culture'],
    recommendedFor: ['quiet', 'photo-spots', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'friends-the-restaurant',
    name: 'Friends the Restaurant',
    destinationId: 'phnom-penh',
    areaId: 'riverside-sisowath-quay',
    category: 'food',
    subcategory: 'restaurant',
    coordinates: {
      lat: 11.566908,
      lng: 104.9290579,
      confidence: 'verified',
      coordNote:
        'OSM amenity=restaurant "Friends the Restaurant", Preah Ang Eng (Street 13), Sangkat Phsar Kandal Ti Muoy, Khan Daun Penh — 11.566908, 104.9290579.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Lunch or an early dinner; the small dining room fills quickly at peak hours',
    bestTimeZh: '午餐或早些的晚餐；高峰时段小餐厅很快坐满',
    tags: ['Food', 'Tapas', 'Training-restaurant', 'NGO', 'Vegetarian-friendly'],
    tagsZh: ['美食', '小食', '培训餐厅', '公益机构', '素食友好'],
    description:
      'Friends the Restaurant is the training restaurant of Friends-International, the Phnom Penh NGO that has worked with street children since 1994: the young staff in the kitchen and on the floor are in vocational training, and the menu runs from Khmer dishes to Western and Asian tapas. It sits on Street 13 a short walk from the National Museum and the Royal Palace, which makes it a convenient and worthwhile lunch stop between the two.',
    descriptionZh:
      'Friends the Restaurant 是金边公益机构 Friends-International 的培训餐厅——该机构自 1994 年起服务街头儿童，厨房与前台服务的年轻人都在接受职业培训，菜单从高棉菜到西式与亚洲小食都有。餐厅位于 13 街，距国家博物馆和王宫几步路，是两处之间方便又有意义的午餐点。',
    notes:
      'Opening hours and training cycles change, so check ahead; the connected shop sells crafts made by the same training programmes.',
    notesZh:
      '营业时间与培训周期会有变化，建议先确认；相连的商店出售同一批培训项目制作的手工艺品。',
    dining: {
      cuisines: ['western', 'healthy'],
      mealTypes: ['lunch', 'dinner', 'dessert'],
      priceTier: '$$',
      signatureItems: [],
      reservationRecommended: false,
    },
    discovery: ['food'],
    recommendedFor: ['food-lovers', 'family', 'vegetarian'],
    markerLayer: 'food',
  },
  {
    id: 'wat-phnom',
    name: 'Wat Phnom',
    nameZh: '塔仔山',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 11.5761015,
      lng: 104.9232122,
      confidence: 'verified',
      coordNote:
        'OSM place_of_worship "Wat Phnom Pagoda", Wat Phnom Roundabout, Sangkat Wat Phnom, Khan Daun Penh — 11.5761015, 104.9232122.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Early morning or after 16:00, before the tour coaches and the worst heat',
    bestTimeZh: '清晨或 16 点之后，避开旅行团大巴和高温',
    tags: ['Temple', 'Landmark', 'Buddhist', 'City-symbol', 'Hilltop'],
    tagsZh: ['寺庙', '地标', '佛教', '城市象征', '山丘'],
    description:
      'Wat Phnom is the temple that gave Phnom Penh its name: in 1372, the legend runs, a widow named Penh found four bronze Buddha statues floating in the Mekong and raised a hill (phnom) over them to house them. The 27-metre hill is the only high ground in the city centre, reached by a staircase of naga balustrades and crowned by a painted hall with a bronze seated Buddha and a mural of the founding story.',
    descriptionZh:
      '塔仔山就是金边得名的寺庙：传说 1372 年一位名叫奔（Penh）的寡妇在湄公河上捡到四尊铜佛，于是堆起一座山（phnom）供奉。这座 27 米高的小山是市中心唯一的制高点，沿那伽（蛇神）栏杆的台阶上去，山顶是彩绘大殿，内有铜坐佛与讲述建城故事的壁画。',
    notes:
      'Foreign visitors pay a small entry fee at the foot of the stairs and the temple is an active place of worship, so shoulders and knees should be covered; the surrounding park is popular with families and the roundabout is busy all day.',
    notesZh:
      '外国游客需在台阶下购买小额门票；这里是活跃的宗教场所，请遮住肩膝。山下的公园常有家庭休闲，环岛全天车流繁忙。',
    entryFee: 'Small fee for foreign visitors (verify at the gate)',
    entryFeeZh: '外国游客需支付小额门票（请在门口确认）',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'half-day', 'family', 'photo-spots'],
    markerLayer: 'activity',
  },
  {
    id: 'central-market-phsar-thmei',
    name: 'Central Market (Phsar Thmei)',
    nameZh: '中央市场（新街市）',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    category: 'food',
    subcategory: 'market',
    coordinates: {
      lat: 11.569584,
      lng: 104.9210814,
      confidence: 'verified',
      coordNote:
        'OSM amenity=marketplace "Central Market", Prey Nokor (Street 126), Sangkat Phsar Thmey Ti Muoy, Khan Daun Penh — 11.569584, 104.9210814.',
    },
    recommendedDurationMin: 45,
    bestTime: '06:30-10:00 for the food and flower halls; before 15:00 for the covered stalls',
    bestTimeZh: '06:30 至 10:00 看生鲜与花市；15 点前逛室内摊位',
    tags: ['Market', 'Shopping', 'Street-food', 'Art-deco', 'Local'],
    tagsZh: ['市场', '购物', '街头小吃', '装饰艺术', '本地'],
    description:
      'Phsar Thmei — the Central Market — is a 1937 art-deco landmark built by French architects in reinforced concrete as a four-winged hall under a 26-metre central dome, and it is still the city\'s great everyday market: gold and jewellery under the dome, flowers, fresh food, dried fish, household goods and clothing in the wings, with food stalls around the outside. The building was restored in the 2010s and is the most striking market structure in Cambodia.',
    descriptionZh:
      '中央市场（Phsar Thmei）是 1937 年的装饰艺术地标，由法国建筑师以钢筋混凝土建成，十字形大厅上方是 26 米高的中央穹顶，至今仍是金边最重要的日常市场：穹顶下是金饰，四翼是鲜花、生鲜、干货、日用品和服装，外围一圈小吃摊。建筑在 2010 年代经过修复，是柬埔寨最醒目的市场建筑。',
    notes:
      'Prices are not fixed in the clothing and souvenir sections, so bargaining is normal; the dome is hottest around midday, cash is essential, and pickpocketing is a real risk in the crowded food aisles.',
    notesZh:
      '服装与纪念品区不讲价不成，还价是常态；正午穹顶下最闷热，务必带现金，生鲜通道拥挤时要防扒手。',
    entryFee: 'Free entry to the market',
    entryFeeZh: '进入市场免费',
    openingHours: 'Roughly 06:00-17:00 daily, with the food halls busiest in the early morning',
    discovery: ['shopping', 'food'],
    recommendedFor: ['first-time', 'shopping', 'food-lovers', 'budget'],
    markerLayer: 'food',
  },
  {
    id: 'phsar-reatrey-night-market',
    name: 'Phsar Reatrey Night Market',
    nameZh: '金边夜市',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    category: 'food',
    subcategory: 'market',
    coordinates: {
      lat: 11.5740516,
      lng: 104.9272302,
      confidence: 'verified',
      coordNote:
        'OSM amenity=marketplace "Phsar Reatrey Night Market", Preah Sisowath Quay (Street 1), Sangkat Phsar Chas, Khan Daun Penh — 11.5740516, 104.9272302.',
    },
    recommendedDurationMin: 60,
    bestTime: 'From about 17:00 to 22:00, when the food grills and mats are out',
    bestTimeZh: '约 17:00 至 22:00，烤炉和席地而坐的摊位都开张',
    tags: ['Night-market', 'Street-food', 'Shopping', 'Local-life', 'Evening'],
    tagsZh: ['夜市', '街头小吃', '购物', '本地生活', '傍晚'],
    description:
      'The night market on the Riverside at the northern end of Sisowath Quay is a genuinely local evening out: a covered grid of food stalls and mats where families eat grilled skewers, noodles and desserts, plus rows of cheap clothing, phone accessories and souvenirs. It is smaller and far less pushy than the Siem Reap night markets, and it makes an easy pairing with a sunset walk along the quay.',
    descriptionZh:
      '位于西索瓦码头北端河畔的夜市，是本地人真正会去的晚间去处：带顶棚的小吃摊与席地而坐的坐垫区，家庭在这里吃烤肉串、粉面和甜品，旁边是一排便宜衣服、手机配件和纪念品。规模比暹粒的夜市小得多，也不那么拉客，很适合与码头日落散步连在一起。',
    notes:
      'Cash only, and the seating is shared mats so you may be sitting with strangers; food hygiene varies between stalls, and the market can close or thin out in heavy rain.',
    notesZh:
      '只收现金，座位是共用坐垫，可能会和陌生人拼坐；各摊卫生条件不一，大雨天可能提前收摊。',
    entryFee: 'Free entry to the market',
    entryFeeZh: '进入夜市免费',
    openingHours: 'Approximately 17:00-22:00 daily (busiest after 18:00)',
    discovery: ['food', 'nightlife', 'shopping'],
    recommendedFor: ['budget', 'food-lovers', 'family', 'first-time'],
    markerLayer: 'food',
  },
  {
    id: 'phnom-penh-central-post-office',
    name: 'Central Post Office',
    nameZh: '中央邮政局',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5752072,
      lng: 104.9256437,
      confidence: 'verified',
      coordNote:
        'OSM amenity=post_office "Central Post Office", Preah Ang Eng (Street 13), Sangkat Wat Phnom, Khan Daun Penh — 11.5752072, 104.9256437.',
    },
    recommendedDurationMin: 20,
    bestTime: 'Weekday opening hours, when the counters are staffed and the building is open',
    bestTimeZh: '工作日的营业时间，柜台开放、建筑可入内',
    tags: ['Architecture', 'Colonial', 'Landmark', 'Postcards', 'Photo-stop'],
    tagsZh: ['建筑', '殖民时期', '地标', '明信片', '拍照点'],
    description:
      'The Central Post Office, on Street 13 opposite Wat Phnom, is one of the last French colonial civic buildings still doing its original job in Phnom Penh: high ceilings, shutters, tiled floors and a working public counter where you can still buy stamps and send postcards. The square in front of it, with the old clock and the temple hill behind, is the classic photograph of the old quarter.',
    descriptionZh:
      '中央邮政局位于 13 街、塔仔山对面，是金边少数仍在履行原用途的法属时期公共建筑：高天花板、百叶窗、花砖地面，柜台仍在营业，可以买邮票、寄明信片。门前的广场配上老钟与背后的塔仔山，是老城区最经典的取景角度。',
    notes:
      'Bring your own pen and allow extra time for international post, which is slow; the building is a functioning office, so avoid blocking the counters for photographs.',
    notesZh:
      '自备笔，国际邮件很慢请预留时间；这里是正常办公场所，拍照时不要堵住柜台。',
    entryFee: 'Free to enter; postcards and stamps sold inside',
    entryFeeZh: '免费进入，明信片与邮票在内部出售',
    discovery: ['culture'],
    recommendedFor: ['first-time', 'photo-spots', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'national-library-of-cambodia',
    name: 'National Library of Cambodia',
    nameZh: '柬埔寨国家图书馆',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5765805,
      lng: 104.919556,
      confidence: 'verified',
      coordNote:
        'OSM amenity=library "National Library", Oknha Hing Penn Street (Street 61), Boeung Kak Community, Khan Daun Penh — 11.5765805, 104.919556.',
    },
    recommendedDurationMin: 30,
    bestTime: 'Weekday mornings; the reading rooms are quietest then and the building is cool',
    bestTimeZh: '工作日上午，阅览室最安静，建筑里也凉快',
    tags: ['Library', 'Architecture', 'Colonial', 'Quiet', 'History'],
    tagsZh: ['图书馆', '建筑', '殖民时期', '安静', '历史'],
    description:
      'The National Library, founded in 1924 and housed in a yellow colonial building behind Wat Phnom, holds Cambodia\'s legal deposit collection, old French-era newspapers and a Khmer manuscripts room, and it is one of the few quiet, airy public interiors left in the centre. Its collections were dispersed under the Khmer Rouge and partly rebuilt with foreign help, and the reading rooms are still used by students every day.',
    descriptionZh:
      '柬埔寨国家图书馆建于 1924 年，位于塔仔山后方的黄色殖民风格建筑里，收藏法定呈缴本、法属时期旧报纸以及一间高棉文手稿室，也是市中心少数安静、通透的公共室内空间。馆藏在红色高棉时期散失，之后靠外国援助部分重建，阅览室至今每天都有学生使用。',
    notes:
      'It is a working library rather than a tourist site: sign in, keep quiet, and ask before photographing; opening hours are limited and can change without notice.',
    notesZh:
      '这里是正在使用的图书馆而非景点：请登记入内、保持安静，拍照前先询问；开放时间有限且可能临时变动。',
    entryFee: 'Free entry',
    entryFeeZh: '免费进入',
    discovery: ['culture'],
    recommendedFor: ['quiet', 'rainy-day', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'brown-coffee-street-169',
    name: 'Brown Coffee (Street 169)',
    destinationId: 'phnom-penh',
    areaId: 'wat-phnom-french-quarter',
    category: 'food',
    subcategory: 'cafe',
    coordinates: {
      lat: 11.5763727,
      lng: 104.9105061,
      confidence: 'verified',
      coordNote:
        'OSM amenity=cafe "Brown Coffee", City Center Boulevard (Street 169), Boeung Kak Community, Khan Daun Penh — 11.5763727, 104.9105061. Brown Coffee is a Phnom Penh roaster with many branches; this is the branch OSM maps.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Morning for coffee and pastries; mid-afternoon for air-conditioning and a laptop stop',
    bestTimeZh: '早上喝咖啡配可颂；下午最热时进来吹空调、用电脑',
    tags: ['Coffee', 'Cafe', 'Roaster', 'Air-conditioned', 'Wi-fi'],
    tagsZh: ['咖啡', '咖啡馆', '烘焙', '有空调', '无线网络'],
    description:
      'Brown Coffee is the Phnom Penh roaster that made specialty coffee normal in Cambodia, and its branches are the default meeting place for the city\'s students, office workers and remote workers. This one, on Street 169 north of the old quarter, is a full café with espresso, filter and cold brew, pastries and full meals, air-conditioning and reliable wi-fi — a useful stop between Wat Phnom and Toul Kork.',
    descriptionZh:
      'Brown Coffee 是让精品咖啡在金边普及起来的本地烘焙品牌，各分店是学生、上班族和远程工作者默认的碰面地点。这家位于老城区以北 169 街的门店供应意式、手冲与冷萃咖啡，还有烘焙点心和正餐，有空调与稳定无线网络，适合安排为塔仔山与都昆区之间的一站。',
    notes:
      'Branches, hours and menus change as the chain grows, so treat the mapped branch as a guide and check the nearest one; cards and QR payments are widely accepted here.',
    notesZh:
      '连锁扩张较快，分店、营业时间与菜单会变，请以就近门店为准；这里普遍接受刷卡与扫码支付。',
    dining: {
      cuisines: ['coffee-roaster', 'bakery', 'brunch'],
      mealTypes: ['breakfast', 'brunch', 'coffee'],
      priceTier: '$$',
      signatureItems: [],
      reservationRecommended: false,
    },
    discovery: ['coffee', 'food'],
    recommendedFor: ['coffee-people', 'digital-nomad', 'rainy-day'],
    markerLayer: 'food',
  },
  {
    id: 'independence-monument',
    name: 'Independence Monument',
    nameZh: '独立纪念碑',
    destinationId: 'phnom-penh',
    areaId: 'bkk1-chamkarmon',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5564351,
      lng: 104.9281898,
      confidence: 'verified',
      coordNote:
        'OSM tourism=attraction "Independence Monument", Independence Monument Roundabout, Sangkat Boeng Keng Kang Ti Muoy, Khan Boeng Keng Kang — 11.5564351, 104.9281898.',
    },
    recommendedDurationMin: 20,
    bestTime: 'After dark, when the monument is floodlit; or early morning for the cleanest photographs',
    bestTimeZh: '天黑后有灯光照明；清晨拍照人最少',
    tags: ['Landmark', 'Monument', 'Modernist', 'History', 'Photo-stop'],
    tagsZh: ['地标', '纪念碑', '现代主义', '历史', '拍照点'],
    description:
      'The Independence Monument, built in 1958 by Vann Molyvann to mark Cambodia\'s independence from France, is styled as a lotus-shaped stupa and stands at the centre of the roundabout where Norodom and Sihanouk Boulevards meet. It is the anchor of the city\'s ceremonial axis — the King Father\'s statue sits just north of it, and it is here that wreaths are laid on national holidays.',
    descriptionZh:
      '独立纪念碑建于 1958 年，由旺莫利万设计，以莲花形佛塔为造型，用以纪念柬埔寨脱离法国独立，位于诺罗敦大道与西哈努克大道交汇的环岛中央。它是全城礼仪轴线的中心——国父铜像就在其北侧，国庆日在此敬献花圈。',
    notes:
      'It sits in a traffic roundabout, so it is viewed from the surrounding pavements; NagaWorld, the Riverside and BKK1 are all within a 15-20 minute walk.',
    notesZh:
      '纪念碑位于道路环岛中，只能从四周人行道观看；步行 15 至 20 分钟可达金界娱乐城、河畔和 BKK1。',
    entryFee: 'Free to view from the roundabout',
    entryFeeZh: '在环岛外免费观看',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'photo-spots', 'half-day'],
    markerLayer: 'activity',
  },
  {
    id: 'olympic-stadium',
    name: 'Olympic Stadium',
    nameZh: '奥林匹克体育场',
    destinationId: 'phnom-penh',
    areaId: 'olympic-veal-vong',
    category: 'activity',
    subcategory: 'stadium',
    coordinates: {
      lat: 11.5583867,
      lng: 104.912172,
      confidence: 'verified',
      coordNote:
        'OSM leisure=stadium "Olympic Stadium", The Plaza Street, Sangkat Veal Vong, Khan Prampi Makara — 11.5583867, 104.912172. OSM also carries a second stadium object 125 m west named "National Olympic Stadium" (11.55847, 104.91086).',
    },
    recommendedDurationMin: 40,
    bestTime: 'Before 07:00 or after 16:30, when locals run and join aerobics classes on the concourse',
    bestTimeZh: '早上 7 点前或 16:30 之后，本地人在跑道上跑步、跳健身操',
    tags: ['Sport', 'Modernist', 'Local-life', 'Running', 'Free'],
    tagsZh: ['体育', '现代主义', '本地生活', '跑步', '免费'],
    description:
      'The Olympic Stadium was built in the early 1960s by Vann Molyvann for the Southeast Asian Peninsular Games, and its sweeping concrete grandstand and moat are among the best surviving examples of Khmer modernist architecture. The games never happened as planned, but the stadium is now the city\'s public exercise ground: joggers and walkers on the track, aerobics and dance classes on the forecourt, and volleyball on the courts alongside.',
    descriptionZh:
      '奥林匹克体育场由旺莫利万在 1960 年代初为东南亚半岛运动会设计建造，弧线形混凝土看台与环场水面是留存最好的高棉现代主义建筑之一。运动会最终未能按计划举办，但体育场如今是全城的公共运动场：跑道上有人跑步走路，前广场是健身操和舞蹈课，旁边球场有人在打排球。',
    notes:
      'Access rules change around events and maintenance, and the surrounding district is ordinary residential Phnom Penh rather than a tourist area, so come for the architecture and the local scene rather than for a visitor experience.',
    notesZh:
      '有赛事或维修时开放规定会变；周边是普通的金边居民区而非旅游区，适合为建筑与本地生活而来，而不是期望观光体验。',
    discovery: ['culture'],
    recommendedFor: ['budget', 'family', 'quiet'],
    markerLayer: 'activity',
  },
  {
    id: 'koh-pich-diamond-island',
    name: 'Koh Pich (Diamond Island)',
    nameZh: '钻石岛',
    destinationId: 'phnom-penh',
    areaId: 'tonle-bassac-koh-pich',
    category: 'activity',
    subcategory: 'landmark',
    coordinates: {
      lat: 11.5416487,
      lng: 104.9330971,
      confidence: 'verified',
      coordNote:
        'OSM highway=pedestrian "Tonle Bassac Promenade", Koh Pich, Khan Chamkar Mon — 11.5416487, 104.9330971, the island\'s walkable waterfront. The OSM place=suburb node "Koh Pich" (11.5474134, 104.9400211) sits about 0.9 km north-east and is used as the district centre.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Late afternoon into evening, when the waterfront fills with families and the towers light up',
    bestTimeZh: '傍晚到夜间，滨水步道满是家庭，塔楼亮灯',
    tags: ['Island', 'Waterfront', 'Modern', 'Evening', 'Walks'],
    tagsZh: ['岛屿', '滨水', '现代', '夜晚', '散步'],
    description:
      'Koh Pich — Diamond Island — is a sandbank between the Mekong and the Tonle Bassac that was reclaimed in the 2000s into a planned district of exhibition halls, condominium towers, hotels and a casino, joined to the mainland by two bridges. Its draw for visitors is the flat, traffic-free waterfront promenade, the evening light displays and the view back at the city skyline; local families come at weekends for the open space and the food stalls.',
    descriptionZh:
      '钻石岛（Koh Pich）原是湄公河与巴萨河之间的一片沙洲，2000 年代填河造地成为规划新区：会展中心、公寓塔楼、酒店与赌场，由两座桥连接市区。对游客的吸引力在于平坦、没有车流的滨水步道、夜间灯光，以及回望市区天际线的景观；周末本地家庭会来这里散步、吃小吃。',
    notes:
      'The island is still half construction site, so expect hoardings and unfinished roads; the promenade is exposed with almost no shade, and the bridges are the only walking connections back to the mainland.',
    notesZh:
      '岛上仍有一半是工地，会有围挡和未完工道路；步道几乎没有遮阴，回市区的步行通道只有两座桥。',
    entryFee: 'Free (public promenade)',
    entryFeeZh: '免费（公共步道）',
    discovery: ['culture', 'nightlife'],
    recommendedFor: ['family', 'sunset', 'photo-spots'],
    markerLayer: 'activity',
  },
  {
    id: 'nagaworld',
    name: 'NagaWorld (Naga 1 & 2 casino complex)',
    nameZh: '金界娱乐城',
    destinationId: 'phnom-penh',
    areaId: 'tonle-bassac-koh-pich',
    category: 'nightlife',
    subcategory: 'casino',
    coordinates: {
      lat: 11.5558333,
      lng: 104.9343509,
      confidence: 'verified',
      coordNote:
        'OSM amenity=casino "NagaWorld 2", Samdech Preah Sihanouk Boulevard (Street 274), Koh Pich, Khan Chamkar Mon — 11.5558333, 104.9343509. Naga 1 (OSM amenity=casino "NagaWorld") is about 250 m east at 11.55563, 104.93723.',
    },
    recommendedDurationMin: 120,
    bestTime: 'Evening; the gaming floors, shows and restaurants run late into the night',
    bestTimeZh: '晚间；赌场、演出与餐厅都营业到深夜',
    tags: ['Casino', 'Nightlife', 'Shows', 'Restaurants', 'Hotel'],
    tagsZh: ['赌场', '夜生活', '演出', '餐厅', '酒店'],
    description:
      'NagaWorld is the largest hotel-casino complex in Cambodia, a two-part development — Naga 1 and Naga 2 — linked across Samdech Sihanouk Boulevard beside the Tonle Bassac, with gaming halls, dozens of restaurants, a theatre, spa and thousands of rooms. It is a self-contained evening economy rather than a sight, and the skyline of gold-lit towers is part of how central Phnom Penh looks after dark.',
    descriptionZh:
      '金界娱乐城是柬埔寨规模最大的酒店赌场综合体，由金界一期与二期组成，隔着西哈努克大道相连、紧邻巴萨河，内有赌场大厅、数十家餐厅、剧院、水疗和数千间客房。它不是景点，而是一整套自成体系的夜间消费场所，灯火通明的塔楼也成了金边夜景的一部分。',
    notes:
      'Entry to the gaming floors requires ID and a dress code, some venues are members-only or 18+, and casino gaming is restricted for Cambodian nationals; the complex is a short walk from the Independence Monument.',
    notesZh:
      '进入赌场区域需出示证件并遵守着装要求，部分场所仅限会员或 18 岁以上；柬埔寨本国人参与博彩受限制。综合体距独立纪念碑步行不远。',
    discovery: ['nightlife'],
    recommendedFor: ['party', 'luxury', 'special-occasion'],
    markerLayer: 'nightlife',
  },
  {
    id: 'aeon-mall-1',
    name: 'AEON Mall 1',
    nameZh: '金边永旺梦乐城1',
    destinationId: 'phnom-penh',
    areaId: 'tonle-bassac-koh-pich',
    category: 'activity',
    subcategory: 'mall',
    coordinates: {
      lat: 11.54808,
      lng: 104.9325859,
      confidence: 'verified',
      coordNote:
        'OSM shop=mall "AEON Mall 1", Samdech Sothearos Boulevard (Street 3), Koh Pich, Khan Chamkar Mon — 11.54808, 104.9325859.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Any time; late afternoon and evening are busiest, weekday mornings quietest',
    bestTimeZh: '任意时段；傍晚与晚间最热闹，工作日早上最清静',
    tags: ['Mall', 'Shopping', 'Air-conditioned', 'Cinema', 'Food-court'],
    tagsZh: ['商场', '购物', '有空调', '影院', '美食广场'],
    description:
      'AEON Mall 1, opened in 2014 as Cambodia\'s first Japanese-style shopping centre, is the air-conditioned default for a hot afternoon: a supermarket and food hall on the ground floor, Japanese and international fashion above, a cinema, and a large food court and restaurant floor where Phnom Penh\'s middle class eats. It sits beside Koh Pich on Sothearos Boulevard, walkable from the Independence Monument.',
    descriptionZh:
      '永旺梦乐城1 于 2014 年开业，是柬埔寨第一座日式购物中心，也是炎热午后最实用的空调去处：底层是超市与食品馆，上层是日系与国际服饰，还有影院，以及金边中产常去的大型美食广场与餐厅层。它位于苏塔罗大道、钻石岛旁，从独立纪念碑步行可达。',
    notes:
      'Tuk-tuk and moto drivers wait at the Sothearos Boulevard entrance and the car park fills at weekends; the supermarket is a good place to stock up on water and snacks before a day trip.',
    notesZh:
      '嘟嘟车与摩托司机会在苏塔罗大道入口等客，周末停车场会满；出发一日游前，这里的超市适合采购饮用水和零食。',
    discovery: ['shopping', 'food'],
    recommendedFor: ['family', 'shopping', 'rainy-day'],
    markerLayer: 'activity',
  },
  {
    id: 'aeon-mall-2',
    name: 'AEON Mall 2 (Sen Sok)',
    nameZh: '金边永旺梦乐城2（森速）',
    destinationId: 'phnom-penh',
    areaId: 'sen-sok-por-sen-chey',
    category: 'activity',
    subcategory: 'mall',
    coordinates: {
      lat: 11.6002156,
      lng: 104.885368,
      confidence: 'verified',
      coordNote:
        'OSM shop=mall "AEON Mall 2", Street 1003, Phum Bayab, Khan Sen Sok — 11.6002156, 104.885368.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Afternoon and early evening; weekends are very busy with families',
    bestTimeZh: '下午到傍晚；周末家庭客流很大',
    tags: ['Mall', 'Shopping', 'Air-conditioned', 'Cinema', 'Ice-rink'],
    tagsZh: ['商场', '购物', '有空调', '影院', '溜冰场'],
    description:
      'AEON Mall 2 is the largest shopping centre in Phnom Penh, built in the northern suburb of Sen Sok with a supermarket, hundreds of shops, a cinema, a large food hall and an ice rink. It is not a sight in itself, but it is the anchor of the Sen Sok side of the city and the reason many long-stay visitors and families base themselves in the northern suburbs rather than the centre.',
    descriptionZh:
      '永旺梦乐城2 是金边最大的购物中心，位于北部森速区，内有超市、数百家店铺、影院、大型美食广场和溜冰场。它本身不算景点，却是森速一侧的生活中心，也是不少长住旅客与家庭选择住北郊而非市中心的原因。',
    notes:
      'It is about 8 km north-west of the Riverside and there is little of interest within walking distance, so plan on coming by car or tuk-tuk; the ice rink and cinema need booking at busy times.',
    notesZh:
      '距河畔约 8 公里，步行范围内没有其他看点，建议开车或坐嘟嘟车前往；高峰时段溜冰场与影院需要提前预约。',
    discovery: ['shopping', 'food'],
    recommendedFor: ['family', 'shopping', 'rainy-day'],
    markerLayer: 'activity',
  },
  {
    id: 'chroy-changvar-bridge',
    name: 'Chroy Changvar Bridge',
    destinationId: 'phnom-penh',
    areaId: 'chroy-changvar-east-bank',
    category: 'transport',
    subcategory: 'bridge',
    coordinates: {
      lat: 11.587416,
      lng: 104.9215339,
      confidence: 'verified',
      coordNote:
        'OSM highway=trunk "Chroy Changvar Bridge", Boeung Kak Community, Khan Daun Penh — 11.587416, 104.9215339.',
    },
    recommendedDurationMin: 15,
    bestTime: 'Early morning or after 19:00, when the traffic is lighter and the river is lit',
    bestTimeZh: '清晨或 19 点后，车流较少、河面有灯光',
    tags: ['Bridge', 'Transport', 'Riverside', 'Views', 'Landmark'],
    tagsZh: ['桥梁', '交通', '河畔', '景观', '地标'],
    description:
      'The Chroy Changvar Bridge — the Cambodia–Japan Friendship Bridge — carries Monivong Boulevard across the Tonle Sap to the eastern peninsula, and it is the gateway for every trip to Silk Island, the national stadium or the east bank. The original 1960s span was destroyed in the civil war and rebuilt with Japanese funding, and from the middle of the bridge you get the widest view of the two rivers meeting at Chaktomuk.',
    descriptionZh:
      '铁桥头大桥（柬日友谊大桥）让莫尼旺大道跨过洞里萨河连接东岸半岛，是前往丝绸岛、国家体育场和东岸所有行程的必经通道。原桥建于 1960 年代、在内战中被毁，后由日本援建重建；站在桥中央可以看到四臂湾两河交汇最开阔的景色。',
    notes:
      'It is a busy road bridge with fast traffic and no real pedestrian walkway, so cross by vehicle rather than on foot; motorbike traffic is heavy at rush hour.',
    notesZh:
      '这是车流快速的公路桥，没有真正的人行通道，建议坐车过桥而不要步行；高峰时段摩托车极多。',
    discovery: ['culture'],
    recommendedFor: ['half-day', 'photo-spots'],
    markerLayer: 'transport',
  },
  {
    id: 'morodok-techo-national-stadium',
    name: 'Morodok Techo National Stadium',
    nameZh: '柬埔寨国家体育场',
    destinationId: 'phnom-penh',
    areaId: 'chroy-changvar-east-bank',
    category: 'activity',
    subcategory: 'stadium',
    coordinates: {
      lat: 11.6829772,
      lng: 104.8763078,
      confidence: 'verified',
      coordNote:
        'OSM leisure=stadium "Morodok Techo National Stadium", Win Win Boulevard, Khan Chroy Changvar — 11.6829772, 104.8763078.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Match days and event evenings; on ordinary days it is a drive-past rather than a visit',
    bestTimeZh: '比赛日与活动当晚；平日多为路过参观而非专门游览',
    tags: ['Stadium', 'Sport', 'Architecture', 'Events', 'Modern'],
    tagsZh: ['体育场', '体育', '建筑', '活动', '现代'],
    description:
      'The Morodok Techo National Stadium, built with Chinese funding and opened in 2021, is shaped as a sailing ship with the Khmer-style roof folds of a traditional vessel, and it seats around 60,000 — it hosted the opening of the 2023 Southeast Asian Games. It stands on the northern edge of the Chroy Changvar peninsula, about 11 km from the city centre, and is only worth the trip for a match, a concert or an interest in contemporary stadium architecture.',
    descriptionZh:
      '柬埔寨国家体育场由中国援建，2021 年启用，外形如一艘帆船，屋顶折线取自传统高棉船型，可容纳约 6 万名观众，2023 年东南亚运动会的开幕式就在这里举行。体育场位于铁桥头半岛北端，距市中心约 11 公里，只有看比赛、听演唱会或对当代体育建筑感兴趣时才值得专程前往。',
    notes:
      'There is no public transport to the door and little around it, so arrange a return ride; access is restricted outside event days.',
    notesZh:
      '门口没有公共交通，周边也几乎没有配套，建议安排好往返车辆；非活动日通常不对外开放。',
    discovery: ['culture'],
    recommendedFor: ['family', 'adventurous'],
    markerLayer: 'activity',
  },
  {
    id: 'koh-oknha-tey',
    name: 'Koh Oknha Tey',
    destinationId: 'phnom-penh',
    areaId: 'mekong-islands-koh-dach',
    category: 'nature',
    subcategory: 'island',
    coordinates: {
      lat: 11.629877,
      lng: 104.9401377,
      confidence: 'verified',
      coordNote:
        'OSM place=village "Khum Koh Oknha Tey", Khsach Kandal, Kandal — 11.629877, 104.9401377; the OSM place=island object "Koh Ohkna Tei" sits 105 m north-east at 11.63087, 104.94019.',
    },
    recommendedDurationMin: 180,
    bestTime: 'Morning start; return before the late-afternoon heat and the ferry queues',
    bestTimeZh: '早上出发，赶在午后高温与渡船排队之前返回',
    tags: ['Island', 'Silk', 'Mekong', 'Village', 'Day-trip'],
    tagsZh: ['岛屿', '丝绸', '湄公河', '村庄', '一日游'],
    description:
      'Koh Oknha Tey is the smaller and quieter of the two silk-weaving islands in the Mekong north of Phnom Penh, a village island of wooden loom houses, dye yards, vegetable plots and a couple of pagodas, reached by ferry from the Chroy Changvar bank. Most visitors see it by bicycle or tuk-tuk on the way to or from Koh Dach, stopping at a family workshop to watch silk being reeled, dyed and woven.',
    descriptionZh:
      '奥克纳泰岛是金边以北湄公河上两座织绸岛中较小、较安静的一座，岛上是木制织机人家、染坊、菜地和几座寺庙组成的村落，从铁桥头一侧坐渡船抵达。多数游客在往返丝绸岛的路上骑自行车或坐嘟嘟车经过这里，会在一家家庭作坊停留，看抽丝、染色与织造的过程。',
    notes:
      'Workshops are family businesses rather than attractions, so buy something or ask before photographing and filming; ferries run irregularly and stop earlier than you expect, so agree a return time with your driver.',
    notesZh:
      '作坊是家庭生意而非景点，拍照录像前请先询问或买些东西；渡船班次不固定、收班比想象中早，请与司机约定返程时间。',
    discovery: ['nature', 'culture'],
    recommendedFor: ['family', 'half-day', 'photo-spots'],
    markerLayer: 'nature',
  },
  {
    id: 'tk-avenue-mall',
    name: 'TK Avenue Mall',
    destinationId: 'phnom-penh',
    areaId: 'toul-kork',
    category: 'activity',
    subcategory: 'mall',
    coordinates: {
      lat: 11.583444,
      lng: 104.8989938,
      confidence: 'verified',
      coordNote:
        'OSM shop=mall "TK Avenue Mall", Street 315, Sangkat Boeung Kak Ti Muoy, Khan Toul Kork — 11.583444, 104.8989938. OSM also maps "Legend Cinema - TK Avenue" in the same block.',
    },
    recommendedDurationMin: 75,
    bestTime: 'Late afternoon and evening, when the restaurants and cinema fill up',
    bestTimeZh: '傍晚与晚间，餐厅与影院开始热闹',
    tags: ['Mall', 'Shopping', 'Cinema', 'Food-court', 'Local'],
    tagsZh: ['商场', '购物', '影院', '美食广场', '本地'],
    description:
      'TK Avenue is the open-air shopping street that anchors Toul Kork: a low-rise strip of international coffee chains, pharmacies, bakeries, casual restaurants and a Legend cinema, with a supermarket at one end. It is where this northern residential district shops and eats, and it is the most useful stop in Toul Kork for a traveller who is staying in the area rather than passing through.',
    descriptionZh:
      'TK Avenue 是都昆区的商业核心：低层开放式商业街，聚集国际连锁咖啡、药房、面包房、休闲餐厅和一家 Legend 影院，一端还有超市。这一带北部居民购物吃饭都在这里，对住在都昆区而不是路过的旅客来说，是这一区最实用的一站。',
    notes:
      'It is a local neighbourhood mall without the scale of the AEON centres, roughly 3 km north-west of the Riverside, and it is best reached by tuk-tuk or car.',
    notesZh:
      '这是社区型商场，规模不及永旺系；距河畔约 3 公里，最好坐嘟嘟车或开车前往。',
    discovery: ['shopping', 'food'],
    recommendedFor: ['family', 'shopping', 'rainy-day'],
    markerLayer: 'activity',
  },
];
