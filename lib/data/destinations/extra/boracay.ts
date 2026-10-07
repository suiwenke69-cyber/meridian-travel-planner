import type { AreaSeed, HotelSeed, PlaceSeed } from '../../../types';

/**
 * Boracay — records added after the first pass: four areas and fourteen places.
 *
 * WHY THERE ARE NO HOTELS IN THIS MODULE
 * --------------------------------------
 * Boracay was closed to tourists for six months in 2018 and re-opened under a
 * hotel-construction moratorium, so the island's upscale inventory is small and
 * almost entirely domestic-brand or independent: Shangri-La Boracay, Crimson
 * Resort & Spa (Filinvest), Mövenpick (Accor), Henann's seven properties,
 * Fairways & Bluewater, Megaworld's Savoy / Belmont / Chancellor at Boracay
 * Newcoast, Discovery Shores, The Lind, Two Seasons, Astoria and Hue. None of
 * those map to a brandId in the five programmes this dataset covers.
 *
 * Four Points by Sheraton Boracay (Marriott Bonvoy) is already in
 * `starter.ts` and is Marriott's own first hotel on the island — its 2024 grand
 * launch was reported as "the arrival of Marriott's first hotel in Boracay".
 * Hilton's own Philippines directory returns zero hotels for Boracay/Malay, and
 * SLH (Hilton Honors' partner brand) lists only Anya Resort Tagaytay and Manami
 * Resort Sipalay in the Philippines. A full-island OpenStreetMap sweep through
 * the Photon API for every brand name in the five programmes — including the
 * soft brands Tribute Portfolio, Autograph Collection, Curio Collection,
 * Tapestry Collection, Canopy, Vignette-type names and all GHA members —
 * returned nothing on Boracay. Rather than invent two properties to reach a
 * target of three, this module adds none. Boracay's total is one loyalty hotel.
 *
 * PROVENANCE
 * ----------
 * Every coordinate below is an OpenStreetMap object read through the OSM search
 * APIs (Photon's `bbox` search restricted to a Boracay bounding box, plus the
 * repository's `scripts/lookup-place.mjs`, which queries Photon, two Overpass
 * mirrors and Nominatim). Each record names its OSM element type, id and tags in
 * `coordNote`. Nothing here is a guessed map position, no coordinate is borrowed
 * from a neighbour, and no two records of the same kind share a point.
 *
 * Places with no verifiable coordinate are NOT given a demo placeholder here —
 * they are simply absent, and are listed in the author's report instead. The one
 * record the OSM data supports only weakly (the Mangrove Boardwalk) is marked
 * `verificationStatus: 'partial'` rather than asserted.
 */

export const areas: AreaSeed[] = [
  {
    id: "balabag-centre",
    destinationId: "boracay",
    name: "Balabag & the Island Centre",
    nameZh: "巴拉巴格与岛中心",
    coordinates: {
      lat: 11.9684026,
      lng: 121.9200345,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap relation 1552493 (place=suburb, name 'Balabag'), centroid 11.968403, 121.920035, read through the Photon OSM search API restricted to a Boracay bounding box (121.89,11.92,121.96,12.005). The barangay's civic centre sits on the same spot: Balabag Barangay Hall (OSM way 31929061, 11.9684677, 121.9200306) and Balabag Plaza (OSM node 14090962249, 11.9682638, 121.9201352).",
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1000,
    bestFor: [
      "A base where both beaches are walkable",
      "D'Mall dining, bars and shopping",
      "Errands: ATMs, money changers, pharmacies, clinics",
      "Mid-range resorts, boutique hotels and hostels",
      "First-time visitors who want everything on foot",
    ],
    bestForZh: [
      "两侧海滩都能步行到达的住宿位置",
      "D'Mall 的餐饮、酒吧与购物",
      "日常事务：ATM、换汇、药房、诊所",
      "中档度假村、精品酒店与青年旅舍",
      "第一次来、希望一切都在步行范围内的人",
    ],
    weakFor: [
      "A sea view from your own room",
      "Quiet evenings — the main road is the island's only traffic artery",
      "Resort-scale pools and grounds",
    ],
    weakForZh: [
      "在房间里看海",
      "安静的夜晚——主路是全岛唯一的交通干道",
      "度假村规模的大型泳池与园区",
    ],
    scores: { beach: 2, nightlife: 4, food: 5, luxury: 3, nature: 3, accessibility: 5 },
    vibe:
      "The island's crossroads — the main road, the market lanes, and the five-minute walk-through between White Beach and Bulabog",
    vibeZh: "全岛的十字路口——主路、市场小巷，以及白沙滩与布拉波海滩之间五分钟的穿行通道",
    tagline: "Market · Main road · Walk-through",
    taglineZh: "市集 · 主路 · 穿行通道",
    summary:
      "Balabag is Boracay's central barangay and the island's administrative and commercial core. The Boracay Main Road runs through it, D'Mall and its surrounding lanes funnel shoppers and diners between White Beach Station 2 and Bulabog Beach, and the barangay hall, the plaza and Holy Rosary church sit together at the northern end near Station 1. The island is only about a kilometre wide here, so the sand on either side is a five-to-ten-minute walk from the main road — which is what makes this the most practical base on Boracay.",
    summaryZh:
      "巴拉巴格是长滩岛中部的行政区，也是全岛的行政与商业核心。长滩岛主路从这里穿过，D'Mall 及其周边小巷把白沙滩 2 号站与布拉波海滩的人流串在一起；北端靠近 1 号站一带则是区政府、广场与玫瑰圣母教堂。这一段岛宽仅约一公里，从主路走到两侧沙滩都只要五到十分钟——这也是它成为全岛最实用落脚点的原因。",
    idealFor: [
      "Travellers who want food, transport and both beaches within a walk",
      "Mid-range and boutique stays rather than resort estates",
      "Return visitors who no longer need to sleep on the sand",
      "Anyone relying on e-trikes and the main road instead of a private car",
    ],
    idealForZh: [
      "希望餐饮、交通和两侧海滩都在步行范围内的旅客",
      "选择中档或精品住宿、而非大型度假村的人",
      "不再执着于住在沙滩边的回头客",
      "依赖电动三轮车与主路出行、不自驾的人",
    ],
    priceTier: "$$",
  },
  {
    id: "yapak-puka",
    destinationId: "boracay",
    name: "Yapak & Puka Beach (North Boracay)",
    nameZh: "亚帕克与普卡海滩（岛北）",
    coordinates: {
      lat: 11.9921986,
      lng: 121.9162565,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap relation 1552494 (place=suburb, name 'Yapak'), centroid 11.992199, 121.916257, read through the Photon OSM search API restricted to a Boracay bounding box (121.89,11.92,121.96,12.005).",
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1600,
    bestFor: [
      "Quiet, low-rise beaches with room to yourself",
      "Big resort and golf estates (Fairways & Bluewater, Boracay Newcoast)",
      "Puka Beach and Ilig-Iligan Beach",
      "Sunset and photography without a crowd",
      "Tricycle or scooter touring of the island",
    ],
    bestForZh: [
      "安静、低密度、人少的海滩",
      "大型度假村与高尔夫园区（Fairways & Bluewater、Boracay Newcoast）",
      "普卡海滩与伊利伊利甘海滩",
      "不用挤人群的日落与拍照",
      "坐三轮车或骑摩托环岛",
    ],
    weakFor: [
      "Nightlife and late-night dining",
      "Walking to White Beach — the north end is three to five kilometres away",
      "Cheap street food and corner stores",
      "Travellers with no transport of their own",
    ],
    weakForZh: [
      "夜生活与深夜餐饮",
      "步行去白沙滩——北端距离三到五公里",
      "便宜的街头小吃与便利店",
      "自己没有交通工具的旅客",
    ],
    scores: { beach: 5, nightlife: 1, food: 2, luxury: 5, nature: 5, accessibility: 2 },
    vibe: "Boracay's green, breezy north — wide empty sand, walled resort estates and the island's widest sky",
    vibeZh: "长滩岛翠绿多风的北部——开阔空旷的沙滩、围墙里的度假村，以及全岛最辽阔的天空",
    tagline: "Puka sand · Resorts · Empty coast",
    taglineZh: "普卡白沙 · 度假村 · 空旷海岸",
    summary:
      "Yapak is the northernmost of Boracay's three barangays, covering everything above Diniwid and Mount Luho: Puka Beach and Ilig-Iligan Beach on the north coast, the small coves of Balinghai, Hagdan and Punta Bunga, the Fairways & Bluewater golf estate and the Boracay Newcoast township. It is the least built-up and least crowded part of the island, holding most of Boracay's remaining forest, its biggest landholdings and the northern beaches that stay empty even in peak season. It is also the only part of Boracay where a resort can be genuinely secluded.",
    summaryZh:
      "亚帕克是长滩岛三个行政区中最北的一个，覆盖迪尼维德与卢霍山以北的全部区域：北岸的普卡海滩与伊利伊利甘海滩，巴林海、哈格丹、蓬塔邦加几个小海湾，Fairways & Bluewater 高尔夫园区，以及 Boracay Newcoast 新城。这里是全岛开发最少、人最少的一段，长滩岛仅存的森林、最大的成片土地和旺季也依然空旷的北部海滩都在这里。想在长滩岛真正住得僻静，也只有这一段做得到。",
    idealFor: [
      "Couples and families who want space and quiet",
      "Golfers and resort-estate guests",
      "Travellers with a scooter or a tricycle habit",
      "Photographers chasing an empty beach at sunset",
    ],
    idealForZh: [
      "想要空间与安静的伴侣和家庭",
      "打高尔夫或住在度假村园区里的旅客",
      "习惯骑摩托或坐三轮车出行的人",
      "想在日落时拍到空沙滩的摄影者",
    ],
    priceTier: "$$$",
  },
  {
    id: "manoc-manoc",
    destinationId: "boracay",
    name: "Manoc-Manoc & Station 3 (South Boracay)",
    nameZh: "马诺克马诺克与 3 号站（岛南）",
    coordinates: {
      lat: 11.9412504,
      lng: 121.9428278,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap relation 1552492 (place=suburb, name 'Manoc-Manoc'), centroid 11.941250, 121.942828, read through the Photon OSM search API restricted to a Boracay bounding box (121.89,11.92,121.96,12.005).",
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1500,
    bestFor: [
      "Budget and mid-range beach stays",
      "Longer stays and self-catering",
      "Local food and the D'Talipapa wet market",
      "The quiet southern end of White Beach (Station 3)",
      "Quick tricycle access to Cagban port",
    ],
    bestForZh: [
      "平价与中档的海边住宿",
      "长住与自炊",
      "本地餐饮与 D'Talipapa 海鲜市场",
      "白沙滩南端（3 号站）的安静一段",
      "坐三轮车快速到卡格班码头",
    ],
    weakFor: [
      "Luxury resort facilities",
      "Being in the middle of the nightlife",
      "Walkability to D'Mall — it is two to three kilometres north",
    ],
    weakForZh: [
      "豪华度假村设施",
      "身处夜生活中心",
      "步行去 D'Mall——在北面两到三公里",
    ],
    scores: { beach: 4, nightlife: 3, food: 4, luxury: 2, nature: 3, accessibility: 3 },
    vibe: "The island's residential south — village lanes, a working wet market and the quietest stretch of White Beach",
    vibeZh: "全岛的居住区南段——村落小巷、仍在营业的海鲜市场，以及白沙滩最安静的一段",
    tagline: "Local life · Wet market · Station 3",
    taglineZh: "本地生活 · 海鲜市场 · 3 号站",
    summary:
      "Manoc-Manoc is Boracay's southern barangay, taking in White Beach Station 3 and the Angol and Tulubhan shore, the D'Talipapa wet market and its cook-your-catch alleys, the barangay's schools and fire station, and the hillside lanes that lead down to Cagban and Tambisaan. Most Boracay residents live here, and because the beach at Station 3 is the narrowest and the least developed, the accommodation is cheaper and more local in character than on Stations 1 and 2. It is also the closest barangay to the airport crossing.",
    summaryZh:
      "马诺克马诺克是长滩岛南部的行政区，范围包括白沙滩 3 号站与安戈尔、图卢班一带海岸，D'Talipapa 海鲜市场及其“买海鲜代客料理”的小巷，本区的学校与消防站，以及通往卡格班和坦比萨安的山坡小路。长滩岛大部分居民住在这里；由于 3 号站沙滩最窄、开发最少，住宿比 1、2 号站便宜，也更接近本地生活。这里也是离机场渡口最近的一个区。",
    idealFor: [
      "Budget and long-stay travellers",
      "Travellers who want to cook, or to eat where locals eat",
      "Divers and kiteboarders riding out the habagat season",
      "Anyone who wants the quiet end of White Beach",
    ],
    idealForZh: [
      "预算有限或长住的旅客",
      "想自己做饭、或跟着本地人吃饭的人",
      "雨季（habagat）前来潜水与玩风筝冲浪的人",
      "想要白沙滩安静那一段的人",
    ],
    priceTier: "$$",
  },
  {
    id: "tambisaan-cagban",
    destinationId: "boracay",
    name: "Tambisaan & Cagban (South-East Ports)",
    nameZh: "坦比萨安与卡格班（东南港口区）",
    coordinates: {
      lat: 11.9495917,
      lng: 121.9471165,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 24043634 (natural=beach, name 'Tambisaan Beach'), centroid 11.949592, 121.947117, read through the Photon OSM search API. The zone's other fixed nodes are Tambisaan Jetty Port (OSM node 298305717, 11.9492349, 121.9473812) and Cagban Jetty Port (OSM node 2258399347, 11.9387145, 121.9393873), both amenity=ferry_terminal.",
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 900,
    bestFor: [
      "Arriving on and leaving the island",
      "Getting to Caticlan airport quickly",
      "Island-hopping and snorkelling boats",
      "Watching the banca traffic in the strait",
      "Cagban and Tambisaan beaches, which are quiet by default",
    ],
    bestForZh: [
      "上岛与离岛",
      "快速前往卡蒂克兰机场",
      "跳岛与浮潜船班",
      "看海峡里的螃蟹船往来",
      "卡格班与坦比萨安海滩——平时都很安静",
    ],
    weakFor: [
      "A beach holiday — this is a working port coast, not a swimming beach",
      "Nightlife and dining",
      "Scenic, self-contained accommodation",
    ],
    weakForZh: [
      "海滩度假——这里是作业港口海岸，不是游泳海滩",
      "夜生活与餐饮",
      "风景好、自成一体的住宿",
    ],
    scores: { beach: 2, nightlife: 1, food: 2, luxury: 1, nature: 4, accessibility: 4 },
    vibe: "Boracay's working doorway — jetties, bancas and the fifteen-minute crossing to the mainland",
    vibeZh: "长滩岛的作业门户——突堤码头、螃蟹船，以及十五分钟横渡到对岸",
    tagline: "Ports · Island hopping · Gateway",
    taglineZh: "码头 · 跳岛 · 门户",
    summary:
      "Boracay's south-east corner holds the island's two passenger jetties. Cagban Jetty Port is the main arrival point for the bancas from Caticlan; Tambisaan Jetty Port takes over when swell makes Cagban unusable, which is why travellers occasionally land at the “wrong” port. Tambisaan Beach and the islets of Crocodile Island and Crystal Cove lie just off this coast, so most island-hopping and snorkelling boats clear this corner first. This zone also anchors the far side of the crossing: the Caticlan terminal on the Panay mainland, about two kilometres across the strait and a few minutes from Caticlan airport.",
    summaryZh:
      "长滩岛东南角集中了全岛两座客运码头。卡格班码头是卡蒂克兰螃蟹船的主要抵达点；当涌浪让卡格班无法使用时，就改由坦比萨安码头靠岸——所以旅客偶尔会从“另一个”码头上岛。坦比萨安海滩以及鳄鱼岛、水晶湾两座小岛都在这段海岸外，跳岛与浮潜船多半都先绕这一角。这一区同时也是渡口对岸的锚点：位于班乃岛本岛的卡蒂克兰码头，距长滩岛约两公里水路，离卡蒂克兰机场只有几分钟车程。",
    idealFor: [
      "Arrival and departure days",
      "Island-hopping and snorkelling trips",
      "Travellers connecting straight on to Caticlan or Kalibo",
    ],
    idealForZh: [
      "抵达日与离开日",
      "跳岛与浮潜行程",
      "直接转往卡蒂克兰或卡利博的旅客",
    ],
    priceTier: "$",
  },
];

export const hotels: HotelSeed[] = [];

export const places: PlaceSeed[] = [
  // -------------------------------------------------------------------------
  // North coast beaches
  // -------------------------------------------------------------------------
  {
    id: "puka-beach",
    name: "Puka Beach (Bai Puka)",
    nameZh: "普卡海滩",
    destinationId: "boracay",
    areaId: "yapak-puka",
    category: "beach",
    subcategory: "beach",
    coordinates: {
      lat: 11.9970694,
      lng: 121.9196468,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 4279206 (natural=beach, name 'Puka Beach'), centroid 11.9970694, 121.9196468, read through the Photon OSM search API restricted to a Boracay bounding box; the adjacent OSM way 4279207 carries the same name further west along the same north-coast beach. Confirmed by scripts/lookup-place.mjs.",
    },
    recommendedDurationMin: 120,
    bestTime: "07:00-10:00 for the emptiest sand and the calmest water; 16:00-18:00 for softer light",
    bestTimeZh: "07:00-10:00 人最少、海面最平；16:00-18:00 光线更柔",
    tags: ["Beach", "Swimming", "Snorkelling", "Sea shells", "Quiet", "Sunset"],
    tagsZh: ["海滩", "游泳", "浮潜", "贝壳", "安静", "日落"],
    description:
      "Puka Beach, also called Bai Puka, is the long white-sand beach on Boracay's northern tip, named for the puka shells once gathered here for jewellery. It sits outside the resort strip, so there is no promenade, no loungers and very little shade — just sand, a handful of beachfront kitchens and the open Sibuyan Sea. The shelf drops away faster than at White Beach and the water is noticeably rougher during the amihan (northeast monsoon) season.",
    descriptionZh:
      "普卡海滩（当地称 Bai Puka）在长滩岛最北端，因过去盛产用来做首饰的 puka 贝壳而得名。它不在度假区里，因此没有海滨步道、没有躺椅、树荫也少——只有沙滩、几家海边小馆和开阔的锡布延海。这里海底坡度比白沙滩陡，东北季风（amihan）期间浪明显更大。",
    notes:
      "No entrance fee, but you need a tricycle or scooter from the White Beach strip — roughly 15-20 minutes — and drivers usually wait for the return fare, so agree the price before setting off. The island's rehabilitation rules prohibit collecting live shells, and you should not buy souvenirs made from freshly harvested puka. Bring drinking water: vendors are few and dearer than in D'Mall.",
    notesZh:
      "不收门票，但从白沙滩一带需要坐三轮车或摩托车约 15-20 分钟，司机通常会在原地等返程，出发前先谈好价钱。按岛上整顿规定，禁止捡拾活体贝壳，也不要购买用新采贝壳制成的纪念品。请自备饮用水：摊贩很少，价格也比 D'Mall 贵。",
    entryFee: "Free (no beach entrance fee)",
    entryFeeZh: "免费（不收入滩费）",
    openingHours: "Open 24 hours; swim in daylight and expect no lifeguard",
    markerLayer: "beach",
    discovery: ["beach", "nature"],
    recommendedFor: ["quiet", "photo-spots", "sunset", "couples", "half-day"],
    verificationStatus: 'verified',
  },
  {
    id: "ilig-iligan-beach",
    name: "Ilig-Iligan Beach",
    nameZh: "伊利伊利甘海滩",
    destinationId: "boracay",
    areaId: "yapak-puka",
    category: "beach",
    subcategory: "beach",
    coordinates: {
      lat: 11.9943399,
      lng: 121.9251634,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 24043698 (natural=beach, name 'Ilig Iligan Beach'), centroid 11.994340, 121.925163, read through the Photon OSM search API restricted to a Boracay bounding box. The surrounding settlement is OSM place=neighbourhood 'Ilig-Iligan' (11.994832, 121.924417). Confirmed by scripts/lookup-place.mjs (11.99434, 121.92516).",
    },
    recommendedDurationMin: 90,
    bestTime: "08:00-12:00 when the bay is glassy; there is almost no shade at midday",
    bestTimeZh: "08:00-12:00 湾内水面最平静；正午几乎没有遮荫",
    tags: ["Beach", "Snorkelling", "Cliffs", "Quiet", "Swimming", "Photography"],
    tagsZh: ["海滩", "浮潜", "崖壁", "安静", "游泳", "拍照"],
    description:
      "Ilig-Iligan is a small, sheltered cove on Boracay's north-east coast, one bay around the headland from Puka Beach. It is short — a few hundred metres of sand between rock ledges and low cliffs — with a shallow sandy bottom that makes it the easiest of the northern beaches to swim from. Because there is no road along the coast, it is reached by a rough track from the Yapak interior or by boat, which keeps it quiet even in season.",
    descriptionZh:
      "伊利伊利甘是长滩岛东北岸的一个小海湾，绕过岬角就是普卡海滩。沙滩不长，只有几百米，夹在岩礁与矮崖之间；海底是浅沙，是北部几个海滩里最适合下水的一个。因为海岸线不通公路，只能从亚帕克内陆走一段颠簸小路或坐船抵达，所以旺季也依然安静。",
    notes:
      "There are no facilities, no lifeguard and little shade; bring water and take everything out with you. The track in from the Yapak interior is unsealed and steep in places, so a tricycle or habal-habal is easier than walking. Do not climb the cliffs, and check with a local boatman before swimming far out, as the current picks up past the headland.",
    notesZh:
      "没有任何设施、没有救生员、遮荫也少，请自备饮水并把垃圾带走。从亚帕克内陆进来的小路是土路，部分路段很陡，坐三轮车或摩托比走路轻松。不要攀爬崖壁；想在远离岸边处游泳，先问一下当地船夫——绕过岬角后水流会变强。",
    openingHours: "Open 24 hours; no lifeguard and no facilities",
    markerLayer: "beach",
    discovery: ["beach", "nature"],
    recommendedFor: ["quiet", "photo-spots", "couples", "half-day"],
    verificationStatus: 'verified',
  },
  {
    id: "diniwid-beach",
    name: "Diniwid Beach",
    nameZh: "迪尼维德海滩",
    destinationId: "boracay",
    areaId: "diniwid-beach",
    category: "beach",
    subcategory: "beach",
    coordinates: {
      lat: 11.976334,
      lng: 121.9118014,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 24043654 (natural=beach, name 'Diniwid Beach'), centroid 11.976334, 121.911801, read through the Photon OSM search API. This is the same OSM object the existing `diniwid-beach` AREA record cites, so the area and this place deliberately share a spot. Confirmed by scripts/lookup-place.mjs as OSM beach 'Diniwid Beach'.",
    },
    recommendedDurationMin: 90,
    bestTime: "16:00-18:30 for the sunset; the headland shades the cove early in the morning",
    bestTimeZh: "16:00-18:30 看日落；上午岬角会把海湾遮在阴影里",
    tags: ["Beach", "Snorkelling", "Sunset", "Quiet", "Cliff path", "Boutique stays"],
    tagsZh: ["海滩", "浮潜", "日落", "安静", "崖边小路", "精品住宿"],
    description:
      "Diniwid is a pocket-sized cove immediately north of White Beach Station 1, cut off from the main strip by a headland. The sand is short and the bay is sheltered, with rocks at both ends that make it a better snorkelling spot than White Beach. A concrete cliffside footpath — the Diniwid Cliff Steps — links it to Station 1 in about ten minutes on foot, which is how most people arrive.",
    descriptionZh:
      "迪尼维德是白沙滩 1 号站正北方的一个小海湾，被岬角与主沙滩带隔开。沙滩不长，湾内避风，两端都有礁石，浮潜条件比白沙滩好。一条沿岸的水泥崖边步道（Diniwid Cliff Steps）把它与 1 号站连起来，步行约十分钟，多数人就是从那里走过来的。",
    notes:
      "Walking in via the cliff path is free and quicker than going round by road, but it is stepped and unlit after dark — take the tricycle road at night. The cove has one beachfront resort and a couple of small bars, no public loungers and no lifeguard. At high tide with a strong westerly swell the sand largely disappears.",
    notesZh:
      "走崖边小路进去不用花钱，也比绕公路快，但台阶多、天黑后没有照明——晚上请改走公路坐三轮车。湾内有一家海边度假村和几间小酒吧，没有公共躺椅，也没有救生员。涨潮加上强西涌时，沙滩会基本被淹没。",
    openingHours: "Open 24 hours; no lifeguard",
    markerLayer: "beach",
    discovery: ["beach", "nature"],
    recommendedFor: ["couples", "quiet", "sunset", "photo-spots"],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Wetlands and the island interior
  // -------------------------------------------------------------------------
  {
    id: "balabag-wetland-park",
    name: "Wetland No. 4 — Balabag Wetland Park",
    nameZh: "四号湿地——巴拉巴格湿地公园",
    destinationId: "boracay",
    areaId: "balabag-centre",
    category: "nature",
    subcategory: "wetland",
    coordinates: {
      lat: 11.9635673,
      lng: 121.926632,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 1050937200 (leisure=park, name 'Balabag Wetland Park', Boracay Main Road), centroid 11.9635673, 121.926632, read through the Photon OSM search API. The same lagoon is mapped separately as OSM way 4279178 (natural=water, water=pond, name 'Wetland № 4') at 11.9635014, 121.9267313, about 9 m away. Confirmed by scripts/lookup-place.mjs.",
    },
    recommendedDurationMin: 30,
    bestTime: "06:30-08:30 or 16:30-18:00; there is little shade at midday and mosquitoes at dusk",
    bestTimeZh: "06:30-08:30 或 16:30-18:00；正午遮荫少，黄昏蚊虫多",
    tags: ["Wetland", "Mangroves", "Birdlife", "Conservation", "Free", "Walk-through"],
    tagsZh: ["湿地", "红树林", "鸟类", "保育", "免费", "穿行"],
    description:
      "Wetland No. 4 is the one-hectare lagoon in the middle of Barangay Balabag, in the narrow waist of the island between White Beach and Bulabog. It was a dumping ground before the 2018 rehabilitation; the Aboitiz Group, DENR, the Tourism Infrastructure and Enterprise Zone Authority and the Malay local government rebuilt it as a linear urban park and formally handed it over on 16 June 2022. It is now the most accessible piece of Boracay wetland — open water, mangroves and the birds that use both, sitting directly off the Boracay Main Road.",
    descriptionZh:
      "四号湿地位于巴拉巴格中部、白沙滩与布拉波海滩之间最窄的岛腰上，水面约一公顷。2018 年整顿之前这里是垃圾堆填地；Aboitiz 集团、菲律宾环境与自然资源部（DENR）、旅游基础设施与企业区管理局以及马莱镇政府把它改建为带状城市公园，并于 2022 年 6 月 16 日正式移交。它现在是长滩岛最容易到达的一片湿地——开阔水面、红树林，以及依赖两者生存的鸟类，就在长滩岛主路旁边。",
    notes:
      "Free to walk through and open year-round; it is a conservation area, so stay on the path and carry your rubbish out. Mosquito repellent is worth having at dusk. OSM holds this lagoon twice — once as the park and once as the numbered wetland polygon — so the two records describe a single place, not two.",
    notesZh:
      "免费开放、全年可走；这里是保育区，请沿步道行走并把垃圾带走。黄昏最好带上防蚊液。OSM 上这个潟湖有两条记录（公园与编号湿地各一），它们是同一个地方，不是两处。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Accessible in daylight hours; no gate published",
    markerLayer: "nature",
    discovery: ["nature"],
    recommendedFor: ["quiet", "half-day", "photo-spots"],
    sources: [
      {
        kind: 'editorial',
        label: "Philstar — 'Aboitiz turns over Boracay wetland park to DENR, LGU' (22 June 2022), naming Wetland No. 4 as the Balabag Wetland Park and describing the 16 June 2022 turnover",
        url: "https://www.philstar.com/nation/2022/06/22/2190000/aboitiz-turns-over-boracay-wetland-park-denr-lgu",
      },
      { kind: 'geographic', label: "OpenStreetMap way 1050937200 and way 4279178 via Photon" },
    ],
    verificationStatus: 'verified',
  },
  {
    id: "mangrove-boardwalk",
    name: "Mangrove Boardwalk (Roots for Boracay)",
    nameZh: "红树林栈道（Roots for Boracay）",
    destinationId: "boracay",
    areaId: "manoc-manoc",
    category: "nature",
    subcategory: "mangrove",
    coordinates: {
      lat: 11.9563859,
      lng: 121.9345129,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap node 13518302721 (tourism=attraction, name 'Mangrove Boardwalk'), 11.9563859, 121.9345129, sitting on the OSM footway named 'Roots Boardwalk' in Manoc-Manoc, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs.",
    },
    recommendedDurationMin: 45,
    bestTime: "Early morning or late afternoon, ideally around low tide when the roots are exposed",
    bestTimeZh: "清晨或傍晚，最好选退潮时——那时红树林的根会露出来",
    tags: ["Mangrove", "Boardwalk", "Nature", "Birdlife", "Ecology", "Free"],
    tagsZh: ["红树林", "栈道", "自然", "鸟类", "生态", "免费"],
    description:
      "A mangrove boardwalk on Boracay's sheltered east coast at Manoc-Manoc, laid over one of the island's surviving mangrove stands on the Ambulong side of the island. The walkway itself is mapped in OpenStreetMap as the 'Roots Boardwalk' footway, with the 'Mangrove Boardwalk' attraction node on it. It is a small, low-key stop — the point is the mangrove root system and the birds and crabs that live in it, not a spectacle.",
    descriptionZh:
      "红树林栈道在长滩岛东岸马诺克马诺克避风的一侧，架在岛上仅存的红树林之一上，靠安布隆（Ambulong）那一头。栈道本身在 OpenStreetMap 里被标为 'Roots Boardwalk' 步道，上面有一个 'Mangrove Boardwalk' 景点节点。这是一个低调的小景点——看点是红树林的根系，以及栖息其中的鸟和蟹，而不是什么大场面。",
    notes:
      "This is the one record here I would call only partly confirmed: OpenStreetMap maps the boardwalk and a local 'Roots for Boracay' ecological park appears in Google-derived listings, but there is no official page publishing opening hours or an entrance fee. Access is from the Ambulong / Roots Boardwalk footpath, the walkway is timber and can be slick after rain, and mosquito repellent is essential. Do not enter the mud flats off the boardwalk — the roots are fragile.",
    notesZh:
      "这是本文里我唯一只能算“部分确认”的一条：OpenStreetMap 有栈道，本地“Roots for Boracay”生态公园也出现在以谷歌资料为基础的本地商家目录里，但没有任何官方页面公布开放时间或门票。入口在安布隆／Roots Boardwalk 步道一侧；栈道是木结构，雨后很滑，务必带防蚊液。不要离开栈道走进滩涂——红树林的根系很脆弱。",
    openingHours: "No published hours — verify locally before going",
    markerLayer: "nature",
    discovery: ["nature"],
    recommendedFor: ["quiet", "family", "half-day"],
    sources: [
      { kind: 'geographic', label: "OpenStreetMap node 13518302721 and the 'Roots Boardwalk' footway via Photon" },
      { kind: 'editorial', label: "Google-derived local listing for 'Roots For Boracay', ecological park, Malay, Aklan" },
    ],
    verificationStatus: 'partial',
  },

  // -------------------------------------------------------------------------
  // Culture and local life
  // -------------------------------------------------------------------------
  {
    id: "balabag-plaza",
    name: "Balabag Plaza",
    nameZh: "巴拉巴格广场",
    destinationId: "boracay",
    areaId: "balabag-centre",
    category: "activity",
    subcategory: "square",
    coordinates: {
      lat: 11.9682638,
      lng: 121.9201352,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap node 14090962249 (place=square, name 'Balabag Plaza'), 11.9682638, 121.9201352, read through the Photon OSM search API restricted to a Boracay bounding box. Confirmed by scripts/lookup-place.mjs as OSM square 'Balabag Plaza' (11.96826, 121.92014).",
    },
    recommendedDurationMin: 20,
    bestTime: "Late afternoon, or during a fiesta or procession, when the square is actually in use",
    bestTimeZh: "傍晚，或节庆与游行的时候——那时广场才真正有人用",
    tags: ["Plaza", "Civic", "Local life", "Free", "Village centre", "Evening"],
    tagsZh: ["广场", "公共空间", "本地生活", "免费", "村落中心", "傍晚"],
    description:
      "Balabag Plaza is the small public square at the northern end of the barangay, in front of the barangay hall and beside Holy Rosary church. This is Boracay's civic space rather than a tourist sight: fiestas, processions, school events and the occasional market fill it, and for the rest of the time it is a paved, shaded place to sit where residents actually are. It is also the best single point from which to understand that Boracay is a working municipality of three barangays, not only a resort strip.",
    descriptionZh:
      "巴拉巴格广场在区北端，位于区政府前、紧邻玫瑰圣母教堂。这里是长滩岛的公共空间，而非旅游景点：节庆、游行、学校活动与偶尔的市集都在此举行；其余时候，它就是个有铺装、有树荫、能坐下来看本地人日常的地方。它也是最能让人意识到“长滩岛是下辖三个行政区的正常市镇、而不只是一条度假带”的一个点。",
    notes:
      "Free and always open. There is no seating to speak of and almost nothing commercial on the square itself — D'Mall and the beach are both a short walk away. If a Mass or a procession is on, keep out of the way rather than photographing through it.",
    notesZh:
      "免费、全天开放。广场本身几乎没有座椅，也没有什么商业设施——D'Mall 和海滩都在步行几分钟内。若碰上弥撒或游行，请让开通道，不要穿过队伍拍照。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Open 24 hours",
    markerLayer: "activity",
    discovery: ["culture"],
    recommendedFor: ["photo-spots", "half-day", "budget"],
    verificationStatus: 'verified',
  },
  {
    id: "holy-rosary-parish-church",
    name: "Holy Rosary Parish Church (Balabag Church)",
    nameZh: "玫瑰圣母教堂（巴拉巴格教堂）",
    destinationId: "boracay",
    areaId: "balabag-centre",
    category: "activity",
    subcategory: "church",
    coordinates: {
      lat: 11.9684875,
      lng: 121.9204138,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 31929059 (amenity=place_of_worship, name 'Holy Rosary Parish Church', Santo Rosario Street, Balabag), centroid 11.9684875, 121.9204138, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs as OSM place_of_worship 'Holy Rosary Parish Church'.",
    },
    recommendedDurationMin: 20,
    bestTime: "Outside Mass times; Sunday morning if you want to attend a service",
    bestTimeZh: "避开弥撒时间；想参加礼仪就选周日上午",
    tags: ["Church", "Catholic", "Local life", "Free", "Village centre"],
    tagsZh: ["教堂", "天主教", "本地生活", "免费", "村落中心"],
    description:
      "Holy Rosary Parish Church is the Catholic parish church of Balabag, on Santo Rosario Street immediately beside Balabag Plaza. It is the island's main place of worship and the anchor of the northern village — a modest white-and-blue church that fills for Sunday Mass and for the barangay's fiesta, when the image of the Virgin is carried through the streets. For visitors it is a reminder that the island's population lives here year-round.",
    descriptionZh:
      "玫瑰圣母教堂是巴拉巴格的天主教本堂，位于圣罗萨里奥街，紧邻巴拉巴格广场。它是全岛主要的宗教场所，也是北部村落的中心——一座朴素的白蓝相间教堂，主日弥撒和本区节庆时都会坐满人，圣母像会被抬着游街。对游客而言，它提醒着人们：岛上的居民是全年住在这里的。",
    notes:
      "Free to enter outside services; dress modestly and keep quiet, and do not walk into the sanctuary during Mass. Sunday Masses are the busiest and photography is inappropriate then. The church is a two-minute walk from the northern end of White Beach Station 1 and about five minutes from D'Mall by e-trike.",
    notesZh:
      "非礼仪时间免费入内；请穿着得体、保持安静，弥撒进行中不要走到祭台区。主日弥撒人最多，那时不适合拍照。教堂距白沙滩 1 号站北端步行约两分钟，坐电动三轮车到 D'Mall 约五分钟。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Generally open in daylight; closed to visitors during Mass",
    markerLayer: "activity",
    discovery: ["culture"],
    recommendedFor: ["photo-spots", "half-day", "budget"],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Markets and food
  // -------------------------------------------------------------------------
  {
    id: "d-talipapa-wet-market",
    name: "D'Talipapa Wet Market",
    nameZh: "塔利帕帕海鲜市场",
    destinationId: "boracay",
    areaId: "manoc-manoc",
    category: "food",
    subcategory: "market",
    coordinates: {
      lat: 11.9579611,
      lng: 121.9286112,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap relation 19233093 (amenity=marketplace, name 'D'Talipapa', D' Talipapa Alley, Manoc-Manoc), centroid 11.9579611, 121.9286112, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs; the neighbouring 'Talipapa Bukid' marketplace (OSM way 316240419, 11.9564936, 121.9318073) is a separate market.",
    },
    recommendedDurationMin: 60,
    bestTime: "07:00-18:00 for the wet market itself; the surrounding kitchens grill into the evening",
    bestTimeZh: "07:00-18:00 逛市场；周边代客料理的小店会一直烤到晚上",
    tags: ["Market", "Seafood", "Filipino food", "Cook your catch", "Budget", "Cash only"],
    tagsZh: ["市场", "海鲜", "菲律宾菜", "买海鲜代客料理", "平价", "只收现金"],
    description:
      "D'Talipapa is Boracay's everyday wet market, set back from the main road in Manoc-Manoc along the alley that carries its name. You buy fish, prawns, squid, shellfish and vegetables by weight from the stalls, then hand your bag to one of the surrounding kitchens, which grill or stew it for a cooking charge while you sit down. It is where island residents shop, and the cheapest good seafood meal on Boracay if you are willing to do the buying yourself.",
    descriptionZh:
      "D'Talipapa 是长滩岛日常的湿货市场，位于马诺克马诺克，从主路拐进与它同名的小巷就到。摊位上按重量买鱼、虾、鱿鱼、贝类和蔬菜，然后把袋子交给周边的小店，付一笔料理费，他们就替你烤或煮，你只管坐下吃。这里是岛上居民买菜的地方；只要你愿意自己动手挑，它也是长滩岛最便宜的一顿好海鲜。",
    notes:
      "The market itself is free to walk through; budget for the seafood plus a per-kilo or per-dish cooking charge, and agree both the weight and the cooking price before handing anything over. Prices are negotiable, especially late in the day, and everything is cash. The floor is wet and the alleys are narrow — wear shoes you do not mind getting dirty.",
    notesZh:
      "市场免费进出；预算要算上海鲜本身加一笔按重量或按菜计的料理费，交接前先把重量和加工价都讲清楚。价格可以谈，越晚越好谈，且一律现金。地面湿滑、巷子很窄，请穿不怕脏的鞋。",
    entryFee: "Free to enter (pay for the seafood and the cooking charge)",
    entryFeeZh: "免费进入（海鲜与料理费另付）",
    openingHours: "Roughly 06:00-19:00 for the stalls; the kitchens run later",
    dining: {
      cuisines: ["seafood", "filipino"],
      mealTypes: ["lunch", "dinner"],
      priceTier: "$",
      signatureItems: [],
      reservationRecommended: false,
    },
    markerLayer: "food",
    discovery: ["food", "shopping"],
    recommendedFor: ["food-lovers", "budget", "first-time", "friends"],
    verificationStatus: 'verified',
  },
  {
    id: "aria-cucina-italiana",
    name: "Aria Cucina Italiana",
    destinationId: "boracay",
    areaId: "white-beach",
    category: "food",
    subcategory: "restaurant",
    coordinates: {
      lat: 11.9616411,
      lng: 121.9246725,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap node 14041027858 (amenity=restaurant, name 'Aria', D'mall Avenue, Balabag), 11.9616411, 121.9246725, read through the Photon OSM search API restricted to a Boracay bounding box. OSM records the venue under the short name 'Aria'; the adjacent OSM node 11006752273 is 'Aria Gelato'. No Chinese name is in real use, so nameZh is omitted.",
    },
    recommendedDurationMin: 75,
    bestTime: "Lunch 12:00-14:00, or dinner 18:00-19:00 before the D'Mall rush",
    bestTimeZh: "午餐 12:00-14:00；晚餐赶在 18:00-19:00，避开 D'Mall 的人潮",
    tags: ["Italian", "Pizza", "Pasta", "D'Mall", "Dinner", "Family"],
    tagsZh: ["意大利菜", "披萨", "意面", "D'Mall", "晚餐", "家庭"],
    description:
      "Aria is the long-established Italian restaurant in the D'Mall lanes, with a wood-fired oven, hand-made pasta and a menu that has outlasted most of Boracay's restaurant turnover. It is one of the island's reliable family and group tables: the D'Mall branch sits in the middle of the shopping lanes, a couple of minutes from the White Beach path at Station 2, so it works for dinner before or after a beach evening.",
    descriptionZh:
      "Aria 是 D'Mall 巷子里经营多年的意大利餐厅，有柴火烤炉和手工意面，菜单熬过了长滩岛餐厅的大部分换手周期。它是岛上家庭与朋友聚会比较稳的选择：D'Mall 这家就在购物小巷中间，离白沙滩 2 号站的海滨步道只要两三分钟，很适合海滩傍晚前后的晚餐。",
    notes:
      "OSM maps the venue simply as 'Aria' on D'mall Avenue. The room fills between 19:00 and 21:00 in season, so book or arrive early; walk-ins are easier at lunch. Cards are accepted, unlike at the wet market. Check the day's catch board if you want seafood rather than pasta.",
    notesZh:
      "OSM 上这家店的名字只写作 D'mall Avenue 上的 'Aria'。旺季 19:00-21:00 满座，最好订位或早点到；中午不订位也比较容易有位。与海鲜市场不同，这里可以刷卡。想吃海鲜而不是意面的话，看看当天的鲜货黑板。",
    openingHours: "Roughly 11:00-22:00 daily; hours shift with the season",
    dining: {
      cuisines: ["italian"],
      mealTypes: ["lunch", "dinner"],
      priceTier: "$$",
      signatureItems: [],
      reservationRecommended: true,
    },
    markerLayer: "food",
    discovery: ["food"],
    recommendedFor: ["food-lovers", "family", "couples", "friends"],
    verificationStatus: 'verified',
  },
  {
    id: "dos-mestizos",
    name: "Dos Mestizos",
    destinationId: "boracay",
    areaId: "white-beach",
    category: "food",
    subcategory: "restaurant",
    coordinates: {
      lat: 11.9558131,
      lng: 121.928596,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 31999319 (amenity=restaurant, name 'Dos Mestizos Restaurant', Calle Remedios, Manoc-Manoc), centroid 11.9558131, 121.928596, read through the Photon OSM search API restricted to a Boracay bounding box. No Chinese name is in real use, so nameZh is omitted.",
    },
    recommendedDurationMin: 90,
    bestTime: "Dinner 18:30-21:00; the room is quieter and cooler after sunset",
    bestTimeZh: "晚餐 18:30-21:00；日落后更安静也更凉快",
    tags: ["Spanish-Filipino", "Paella", "Tapas", "Dinner", "Station 3", "Sangria"],
    tagsZh: ["西班牙–菲律宾菜", "海鲜饭", "小食", "晚餐", "3 号站", "桑格利亚"],
    description:
      "Dos Mestizos is the Spanish-Filipino restaurant at the Station 3 end of White Beach, on Calle Remedios, and one of the island's longest-running serious kitchens. The menu is built around paella, tapas and Spanish-Filipino dishes that borrow from both sides of the colonial table, served in a converted house away from the beach path. It is somewhere to sit for a long dinner rather than to eat quickly between beach hours.",
    descriptionZh:
      "Dos Mestizos 在白沙滩 3 号站一端的卡列雷梅迪奥斯街，是岛上经营最久的正经餐厅之一，做西班牙与菲律宾融合菜。菜单围绕海鲜饭、小食，以及同时取自殖民时期两端的西菲菜式展开，开在一栋改造过的房子里，离海滨步道有些距离。适合坐下来慢慢吃一顿长晚餐，而不是在两段海滩时间之间匆匆解决。",
    notes:
      "Reserve for dinner in high season — the dining room is small. It is a tricycle ride from Stations 1 and 2 rather than a walk, and the last stretch of Calle Remedios is dark, so arrange your ride back. OSM records it as 'Dos Mestizos Restaurant'.",
    notesZh:
      "旺季晚餐建议订位——餐厅不大。从 1、2 号站过来要坐三轮车，不适合步行；卡列雷梅迪奥斯街最后一段路灯很暗，回程请先叫好车。OSM 上的名称是 'Dos Mestizos Restaurant'。",
    openingHours: "Roughly 11:00-14:00 and 17:30-22:00; confirm seasonally",
    dining: {
      cuisines: ["filipino", "international"],
      mealTypes: ["lunch", "dinner", "drinks"],
      priceTier: "$$$",
      signatureItems: [],
      reservationRecommended: true,
    },
    markerLayer: "food",
    discovery: ["food"],
    recommendedFor: ["food-lovers", "couples", "special-occasion", "long-lunch"],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Transport nodes
  // -------------------------------------------------------------------------
  {
    id: "tambisaan-jetty-port",
    name: "Tambisaan Jetty Port",
    nameZh: "坦比萨安码头",
    destinationId: "boracay",
    areaId: "tambisaan-cagban",
    category: "transport",
    subcategory: "ferry port",
    coordinates: {
      lat: 11.9492349,
      lng: 121.9473812,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap node 298305717 (amenity=ferry_terminal, name 'Tambisaan Jetty Port', Tambisaan Road, Manoc-Manoc), 11.9492349, 121.9473812, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs.",
    },
    recommendedDurationMin: 20,
    bestTime: "Daylight crossings; the port is a weather fallback, not a scheduled one",
    bestTimeZh: "白天渡运；这个码头是天气不佳时的备用港口，没有固定班表",
    tags: ["Transport", "Ferry", "Port", "Fallback", "Weather dependent"],
    tagsZh: ["交通", "渡船", "码头", "备用", "看天气"],
    description:
      "Tambisaan Jetty Port is Boracay's second passenger jetty, on the island's south-east coast. It exists because Cagban, the main port, faces the wrong way when the habagat (southwest monsoon) or a strong easterly swell is running: on those days the bancas from Caticlan are rerouted here instead. It is also the closest jetty to the island-hopping islets of Crocodile Island and Crystal Cove, and to Tambisaan Beach itself.",
    descriptionZh:
      "坦比萨安码头是长滩岛的第二座客运码头，在岛的东南岸。它存在的理由是：西南季风（habagat）或强东风涌起来时，主码头卡格班正对风浪无法使用，从卡蒂克兰来的螃蟹船就改靠这里。它也是离跳岛小岛鳄鱼岛、水晶湾以及坦比萨安海滩最近的一座码头。",
    notes:
      "There is no published timetable — the port is used when Cagban is closed, so on a normal day you will not pass through it at all. If your transfer is rerouted here, expect the same terminal, environmental and boat fees as at Cagban, collected through the island's unified ticketing system. Confirm with your hotel or the port the morning you travel; the decision is made on the day, on the swell.",
    notesZh:
      "没有公布的班表——它只在卡格班关闭时启用，所以平日你根本不会经过这里。如果转到这里上下岛，码头费、环境费和船费与卡格班相同，通过全岛统一售票系统收取。出行当天早上向酒店或码头确认；是否改港要当天看涌浪临时决定。",
    openingHours: "Used when Cagban is closed for weather; no fixed hours",
    markerLayer: "transport",
    verificationStatus: 'verified',
  },
  {
    id: "caticlan-jetty-port",
    name: "Caticlan Jetty Port (mainland terminal)",
    nameZh: "卡蒂克兰码头（本岛对岸）",
    destinationId: "boracay",
    areaId: "tambisaan-cagban",
    category: "transport",
    subcategory: "ferry port",
    coordinates: {
      lat: 11.9278324,
      lng: 121.9492596,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 1423699147 (man_made=pier, name 'Caticlan Jetty', Aklan West Road, Potol, Malay), centroid 11.9278324, 121.9492596, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs as OSM pier 'Caticlan Jetty'. The functional terminal nodes on the same complex are OSM node 8655089544 (amenity=ferry_terminal, Aklan West Road, 11.9281703, 121.9501741) and OSM node 4691702104 (amenity=ferry_terminal, 11.9277394, 121.9486676); the Caticlan Passenger Terminal Building is at 11.927753, 121.950411.",
    },
    recommendedDurationMin: 45,
    bestTime: "Daylight; boats to Cagban run frequently from early morning to early evening",
    bestTimeZh: "白天；往返卡格班的船从清晨到傍晚班次密集",
    tags: ["Transport", "Ferry", "Mainland", "Airport link", "Entry fees", "Gateway"],
    tagsZh: ["交通", "渡船", "本岛", "接驳机场", "入岛费用", "门户"],
    description:
      "Caticlan Jetty Port is the mainland half of the Boracay crossing, on the Panay shore of the 2 km strait. Bancas leave here for Cagban Jetty Port roughly every few minutes through the day and take about 15 minutes; in bad weather the crossing shifts to Tambisaan. The port is a few minutes by tricycle from Godofredo P. Ramos (Caticlan) airport, so almost every visitor passes through it in both directions. It is recorded here under the Tambisaan/Cagban port zone because it is the other end of exactly that crossing.",
    descriptionZh:
      "卡蒂克兰码头是长滩岛渡运的本岛一侧，位于班乃岛岸边，与长滩岛隔着约两公里的海峡。螃蟹船白天大致每隔几分钟开往卡格班码头，航程约十五分钟；天气不好时改靠坦比萨安。码头距戈多弗雷多·拉莫斯（卡蒂克兰）机场坐三轮车只要几分钟，所以几乎所有旅客往返都要经过这里。它之所以归入坦比萨安／卡格班港口区，是因为它正是这条渡运航线的另一端。",
    notes:
      "Fees are collected on the Boracay side through the island's unified ticketing system ('LezzGo Boracay', launched 5 August 2025): terminal, environmental and boat fees, plus a convenience fee added from 1 September 2025. Rates change — check the current schedule before you travel rather than budgeting from an old figure. Keep your ticket, as it is checked at Cagban. The last boats leave in the early evening, so a late arrival at Caticlan airport can mean an overnight on the mainland.",
    notesZh:
      "各项费用在长滩岛一侧通过全岛统一售票系统（2025 年 8 月 5 日启用的 “LezzGo Boracay”）收取：码头费、环境费、船费，另自 2025 年 9 月 1 日起加收一笔便利费。费率会调整——出发前查当期标准，不要照旧价估算。船票要留好，卡格班那边会查。末班船傍晚就收，晚班机到卡蒂克兰有可能得在本岛过夜。",
    entryFee: "Terminal fee + environmental fee + boat fee, collected via the Boracay unified ticketing system; rates change",
    entryFeeZh: "码头费＋环境费＋船费，通过长滩岛统一售票系统收取；费率会调整",
    openingHours: "Roughly 05:00-21:00 daily, weather permitting",
    markerLayer: "transport",
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Island-hopping islets
  // -------------------------------------------------------------------------
  {
    id: "crocodile-island",
    name: "Crocodile Island",
    nameZh: "鳄鱼岛",
    destinationId: "boracay",
    areaId: "tambisaan-cagban",
    category: "nature",
    subcategory: "islet",
    coordinates: {
      lat: 11.9498987,
      lng: 121.9513438,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap way 920990377 (place=islet, name 'Crocodile Island'), centroid 11.9498987, 121.9513438, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs as OSM islet 'Crocodile Island', Manoc-Manoc, Malay, Aklan.",
    },
    recommendedDurationMin: 60,
    bestTime: "Morning, when the water is calmest and the reef is clearest; check the tide and the swell forecast",
    bestTimeZh: "上午水最平静、礁区最清；出发前看潮汐与涌浪预报",
    tags: ["Island", "Snorkelling", "Reef", "Boat trip", "No facilities"],
    tagsZh: ["小岛", "浮潜", "礁区", "乘船", "无设施"],
    description:
      "Crocodile Island is a small, low, rocky islet about a kilometre off Boracay's south-east coast, named for its shape from the air. It has no beach, no jetty and no shade, and boats generally moor alongside rather than land: the reason to come is the shallow reef around it, which is one of the standard snorkelling stops on the Boracay island-hopping circuit and is also dived. Because it sits in open water it is exposed, and the operators skip it when the swell is up.",
    descriptionZh:
      "鳄鱼岛是长滩岛东南岸外约一公里的一座低矮小岩岛，因空中俯瞰形似鳄鱼而得名。岛上没有沙滩、没有码头、没有遮荫，船只通常只是靠边停泊而不靠岸：来这里是为了周边水浅的礁区——它是长滩岛跳岛行程里的标准浮潜点之一，也有人来潜水。因为位于开阔水域、毫无遮挡，涌浪大时船家会直接跳过它。",
    notes:
      "Reachable only by boat, usually as one stop on a shared island-hopping trip from White Beach or Bulabog; there is no public ferry and no facility of any kind. Use a licensed boat operator, wear a life vest, and stay with the boat if the current is running — this is open water, not a lagoon. Nothing is sold on the island, so take your own water.",
    notesZh:
      "只能乘船前往，通常是白沙滩或布拉波海滩出发的拼船跳岛行程中的一站；没有公共渡船，岛上也没有任何设施。请找有资质的船家、全程穿救生衣；水流强时留在船边——这里是开阔海域，不是潟湖。岛上买不到东西，水请自备。",
    openingHours: "Daylight only; boat operators run roughly 08:00-16:00",
    markerLayer: "nature",
    discovery: ["nature", "water"],
    recommendedFor: ["adventurous", "friends", "half-day", "photo-spots"],
    activity: {
      kind: "snorkel",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: true,
      operatorRequired: true,
      transportContext: "Boat from White Beach or Bulabog Beach, about 20-30 minutes",
      transportContextZh: "从白沙滩或布拉波海滩乘船，约 20-30 分钟",
    },
    verificationStatus: 'verified',
  },
  {
    id: "crystal-cove-island",
    name: "Crystal Cove Island",
    nameZh: "水晶湾岛",
    destinationId: "boracay",
    areaId: "tambisaan-cagban",
    category: "nature",
    subcategory: "island",
    coordinates: {
      lat: 11.942169,
      lng: 121.9569887,
      confidence: 'verified',
      coordNote:
        "OpenStreetMap node 4681232494 (tourism=attraction, name 'Crystal Cove'), 11.942169, 121.9569887, read through the Photon OSM search API. Confirmed by scripts/lookup-place.mjs as OSM attraction 'Crystal Cove'. OSM files it under the Aklan West Road / Nabas address; the feature is the island in the strait between Boracay and the Panay mainland.",
    },
    recommendedDurationMin: 90,
    bestTime: "Morning to early afternoon, at low tide when the cave pools are calmest and safest to enter",
    bestTimeZh: "上午到下午早些时候；退潮时岩洞水潭最平静、也最安全",
    tags: ["Island", "Caves", "Snorkelling", "Boat trip", "Landing fee"],
    tagsZh: ["小岛", "岩洞", "浮潜", "乘船", "登岛费"],
    description:
      "Crystal Cove is the small island in the strait between Boracay and the Panay mainland, and the other fixed stop on the classic Boracay island-hopping route. Its draw is a pair of cave pools cut into the rock — one reached by a short flight of steps, one by wading — plus a snorkelling shelf off the shore. The island is administered separately from Boracay, so a landing fee applies on top of whatever you pay your boatman.",
    descriptionZh:
      "水晶湾岛在长滩岛与班乃本岛之间的海峡里，是长滩岛经典跳岛行程中另一个固定站点。看点是岩壁上凿出的两处洞穴水潭——一处走一小段台阶下去，一处需要涉水——以及岸边可以浮潜的浅礁台。小岛不由长滩岛管理，所以除了付给船家的钱，登岛还要另交一笔费用。",
    notes:
      "There is a landing fee collected on the island; the amount changes and is set locally, so confirm it with your boat operator before you set out rather than assuming a figure. The cave steps and the wet sections are slippery — wear grip and keep both hands free. There is no jetty, so landing is by small boat or by wading; trips are cancelled when the swell is up.",
    notesZh:
      "岛上收取登岛费，金额由当地调整，出发前向船家问清楚，不要自己估一个数。洞穴台阶和涉水路段很滑——请穿防滑鞋、双手空出来。岛上没有码头，靠小船或涉水登岸；涌浪大时行程会取消。",
    entryFee: "A locally set landing fee is collected on the island in addition to the boat fare; amount changes",
    entryFeeZh: "除船费外，岛上另收由当地设定的登岛费；金额会调整",
    openingHours: "Daylight only; roughly 08:00-16:00 with boat trips",
    markerLayer: "nature",
    discovery: ["nature", "water"],
    recommendedFor: ["adventurous", "family", "friends", "half-day"],
    activity: {
      kind: "snorkel",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: true,
      operatorRequired: true,
      transportContext: "Boat from White Beach or Bulabog Beach, about 25-35 minutes",
      transportContextZh: "从白沙滩或布拉波海滩乘船，约 25-35 分钟",
    },
    verificationStatus: 'verified',
  },
];
