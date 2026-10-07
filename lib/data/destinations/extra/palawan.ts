import type { AreaSeed, HotelSeed, PlaceSeed } from '../../../types';

/**
 * Palawan — records added after the first pass.
 *
 * Kept separate from the original seed file so the records that were already
 * coordinate-verified stay byte-identical, and so a reviewer can see exactly
 * what is new. Every record carries a `coordNote` naming the source it came from.
 *
 * PROVENANCE: every coordinate below came from a live lookup through
 * `scripts/lookup-place.mjs` (Photon first, then Overpass, then Nominatim — all
 * three serve the same OpenStreetMap data) or, for the airport, the destination
 * record it already carries. No coordinate was copied from a neighbouring
 * record, and no coordinate was placed from an area centre.
 *
 * WHAT IS DELIBERATELY ABSENT
 * Three quarters of this province sit outside the destination's own map bounds
 * (9.6141, 118.6764)–(11.4468, 119.4799). Anything outside them is either
 * unwritable or invisible on arrival, so Iwahig (118.6604 W), Taytay town and
 * Fort Santa Isabel (119.5177 E), Sibaltan (119.5636 E) and the whole Coron /
 * Busuanga group (≈120.2 E) are omitted rather than forced in. Caalan has no
 * named OSM object for the neighbourhood or its beach, only a seagrass patch and
 * a café reception desk, so it is left inside the El Nido town area.
 */

export const areas: AreaSeed[] = [
  {
    id: 'ppc-baywalk-rizal',
    destinationId: 'palawan',
    name: 'Puerto Princesa Baywalk & Rizal Avenue',
    nameZh: '公主港海滨大道与黎刹大道',
    coordinates: {
      lat: 9.7441515,
      lng: 118.7320158,
      confidence: 'verified',
      coordNote:
        'OSM footway "Puerto Princesa City Baywalk", San Miguel, Puerto Princesa (via the Photon/OSM lookup, 522 m north-west of the city-centre area point and effectively on top of the separate "Puerto Princesa City Baywalk" place record — the area centre and its signature feature are the same stretch of promenade).',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 900,
    bestFor: [
      'Waterfront hotels',
      'Sunset walks',
      'Seafood grills and street food',
      'Walkable dinners',
      'A first or last night in the city',
    ],
    weakFor: ['Swimming (this is a working bay, not a beach)', 'Beach days', 'Late-night bars', 'Shopping malls'],
    bestForZh: ['海滨酒店', '傍晚散步', '海鲜烧烤与街头小吃', '步行可达的晚餐', '进城第一晚或最后一晚'],
    weakForZh: ['游泳（这里是作业港湾，不是沙滩）', '海滩度假', '深夜酒吧', '大型商场'],
    scores: { beach: 2, nightlife: 3, food: 5, luxury: 3, nature: 2, accessibility: 5 },
    vibe: 'Seafront promenade of seafood grills, joggers and sunset walkers',
    vibeZh: '海鲜烧烤、慢跑的人和看日落的人——全城最热闹的一段海岸',
    tagline: 'Baywalk · Seafood sunsets',
    taglineZh: '海滨大道 · 日落海鲜',
    summary:
      'The Baywalk is the paved seafront promenade along Rizal Avenue on the western edge of the city centre, running past Plaza Cuartel, the Immaculate Conception Cathedral and Mendoza Park. In the evening it becomes the city dining room: stalls and grills set up along the water selling seafood, barbecue and shakes, with the sunset straight ahead over the bay. Most of the city mid-range hotels and its better restaurants sit within a few minutes walk, which makes this the most convenient base if you are only in Puerto Princesa for a night either side of the Underground River.',
    summaryZh:
      '海滨大道是市中心西侧沿黎刹大道铺开的海堤步道，经过库阿特尔广场、圣母无原罪主教座堂与门多萨公园。傍晚这里就是公主港的食堂：摊档与烧烤炉沿海排开，卖海鲜、烤肉和冰饮，正前方就是海湾的日落。城里大部分中档酒店与口碑餐厅都在步行几分钟内，如果只是为地下河行程在公主港各住一晚，这里最省事。',
    idealFor: ['Couples', 'Food-led travellers', 'Families', 'Travellers with an early flight out'],
    idealForZh: ['情侣', '以吃为主的旅客', '家庭', '隔天要赶早班机的旅客'],
    priceTier: '$$',
  },
  {
    id: 'honda-bay',
    destinationId: 'palawan',
    name: 'Honda Bay',
    nameZh: '本田湾',
    coordinates: {
      lat: 9.8903802,
      lng: 118.8087954,
      confidence: 'verified',
      coordNote:
        'OSM natural feature "Honda Bay" (bay), Puerto Princesa, Mimaropa — the bay centroid, 8.6 km north-east of the Santa Lourdes wharf used by the island-hopping boats.',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 9000,
    bestFor: [
      'Island-hopping by bangka',
      'Snorkelling and shallow reefs',
      'Sandbars and picnic islands',
      'Family boat days',
      'A half-day or full-day trip from the city',
    ],
    weakFor: ['Overnight stays', 'Nightlife', 'Fine dining', 'Boat days in the wet season (trips are cancelled)'],
    bestForZh: ['乘螃蟹船跳岛', '浮潜与浅礁', '沙洲与野餐小岛', '亲子出海', '从市区出发的半日或一日游'],
    weakForZh: ['过夜住宿', '夜生活', '精致餐饮', '雨季出海（常因风浪取消）'],
    scores: { beach: 4, nightlife: 1, food: 2, luxury: 2, nature: 4, accessibility: 2 },
    vibe: 'Flat green bay of low islets, sandbars and snorkel reefs',
    vibeZh: '平静的绿色海湾：低矮小岛、沙洲与浮潜礁盘',
    tagline: 'Island hopping · Shallow reefs',
    taglineZh: '跳岛 · 浅礁浮潜',
    summary:
      'Honda Bay opens off Puerto Princesa eastern coast, roughly 20 to 30 minutes by tricycle or van from the city centre to the Santa Lourdes wharf. It is the city standard day on the water: a string of low islets and sandbars — Cowrie, Luli, Starfish — plus the Pambato Reef sanctuary, with lunch usually cooked on board. The water is shallow and sheltered for most of the year, which makes it the easy family option; the trade-off is that it is a shared, scheduled experience rather than a wilderness one, and boats are hired whole or joined by the seat.',
    summaryZh:
      '本田湾在公主港东岸，从市中心坐三轮车或面包车约 20–30 分钟到圣卢尔德斯码头。这是公主港最标准的一日出海：考里岛、露莉岛、海星岛等一连串低矮小岛与沙洲，外加潘巴托珊瑚保护区，午餐通常在船上现做。全年大部分时间水浅且有遮蔽，是亲子最省力的选择；代价是它更像一条成熟的团队线路，而非荒野，船按整艘包或按位拼团。',
    idealFor: ['Families with children', 'First-time visitors', 'Snorkellers', 'Groups sharing a boat'],
    idealForZh: ['带小孩的家庭', '第一次来公主港的人', '浮潜爱好者', '一起包船的团体'],
    priceTier: '$$',
  },
  {
    id: 'corong-corong',
    destinationId: 'palawan',
    name: 'Corong-Corong',
    coordinates: {
      lat: 11.1651494,
      lng: 119.3984896,
      confidence: 'verified',
      coordNote:
        'OSM place "Corong-corong" (quarter), Bulbulungan, El Nido, Palawan — the mapped quarter centroid, 1.7 km south-west of the El Nido town area point.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1200,
    bestFor: [
      'Sunset over Bacuit Bay',
      'Beachfront restaurants',
      'Mid-range and boutique hotels',
      'Quieter nights than El Nido town',
      'Walking distance to the El Nido public market',
    ],
    weakFor: [
      'A wide swimming beach (the shore narrows at high tide)',
      'Heavy nightlife',
      'Dorm beds and backpacker prices',
      'Island-tour departures, which leave from El Nido town',
    ],
    bestForZh: ['看巴奎特湾日落', '海边餐厅', '中档与精品酒店', '比爱妮岛镇上安静的夜晚', '步行到爱妮岛公共市场'],
    weakForZh: ['宽阔的游泳沙滩（涨潮时岸线很窄）', '热闹的夜生活', '青旅床位与背包客价位', '跳岛行程集合点（在爱妮岛镇上）'],
    scores: { beach: 3, nightlife: 3, food: 4, luxury: 4, nature: 3, accessibility: 3 },
    vibe: 'Sunset-facing shore of bars and small hotels just south of town',
    vibeZh: '镇南正对日落的海岸：小酒吧与家庭式酒店一字排开',
    tagline: 'Sunset strip · Beachfront dining',
    taglineZh: '日落海岸 · 海边餐厅',
    summary:
      'Corong-Corong is the strip immediately south-west of El Nido town, on the far side of the headland from the Bacuit Bay boat departure beach. It faces west, so it gets the sunset that the town beach does not, and the shore is lined with bars, grills and small hotels rather than dive shops. It is a 15 to 25 minute walk or a short tricycle ride from the town centre, which keeps it quieter while leaving the restaurants, market and tour offices within reach.',
    summaryZh:
      '科隆科隆在爱妮岛镇西南侧，与出发跳岛的镇海滩隔着一个岬角。它正对西面，因此能看到镇海滩看不到的日落；岸线上一排小酒吧、烧烤店与家庭式旅馆，而不是潜水店。步行 15–25 分钟或坐一小段三轮车就到镇中心，比镇里安静，餐厅、市场与行程代理仍在可及范围内。',
    idealFor: ['Couples', 'Sunset chasers', 'Mid-range travellers', 'Travellers who want quiet but not isolation'],
    idealForZh: ['情侣', '追日落的人', '中档预算旅客', '想要安静但不想与世隔绝的旅客'],
    priceTier: '$$$',
  },
  {
    id: 'las-cabanas',
    destinationId: 'palawan',
    name: 'Las Cabañas & Marimegmeg',
    coordinates: {
      lat: 11.1468908,
      lng: 119.3969635,
      confidence: 'verified',
      coordNote:
        'OSM attraction "Marimegmeg Beach", Puerto Princesa North Road, Bulbulungan, El Nido — the Marimegmeg / Las Cabañas beach strip 3.8 km south of the El Nido town area point. The OSM attraction "Las Cabañas Beach" (11.1445065, 119.3937261) is the same strip and is used for the separate Las Cabañas Beach place record.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1200,
    bestFor: [
      'Sunset beach bars',
      'The 750 m zipline across to Depeldet Island',
      'Beach clubs and sundowners',
      'Quieter upscale resorts',
      'Swimming at the southern end of the strip',
    ],
    weakFor: ['Budget rooms', 'Nightlife after about 22:00', 'Walking to El Nido town (4 km, no footpath)', 'Shopping'],
    bestForZh: ['日落海滩酒吧', '飞越到德佩尔德特岛的 750 米滑索', '海滩俱乐部与黄昏小酌', '安静的高端度假村', '在沙滩南段游泳'],
    weakForZh: ['低价住宿', '晚上 10 点以后的夜生活', '步行回爱妮岛镇（4 公里，没有人行道）', '购物'],
    scores: { beach: 4, nightlife: 3, food: 4, luxury: 5, nature: 3, accessibility: 3 },
    vibe: 'Sunset beach of day-beds, cocktails and a zipline overhead',
    vibeZh: '日落海滩：躺椅、鸡尾酒，头顶不时有人滑索飞过',
    tagline: 'Beach clubs · Zipline',
    taglineZh: '海滩俱乐部 · 滑索',
    summary:
      'Las Cabañas — also called Marimegmeg — is the beach strip on the headland about 4 km south of El Nido town, reached by tricycle along the Puerto Princesa North Road. It has the best combination in the El Nido area of a swimmable shore, a west-facing sunset and a cluster of beach bars, and it is where the 750 m zipline crosses the water to Depeldet Island. Resorts here are quieter and generally more expensive than in town, and there is no footpath, so you rely on tricycles in the evening.',
    summaryZh:
      '拉斯卡巴纳斯（也叫马里梅格梅格）是爱妮岛镇以南约 4 公里岬角上的海滩带，沿北公主港公路坐三轮车可达。在爱妮岛一带，它把可游泳的海岸、朝西的日落和一群海滩酒吧结合得最好，750 米滑索也从这里跨海飞向德佩尔德特岛。此处度假村比镇上安静、价位通常更高；沿线没有人行道，晚上出入要靠三轮车。',
    idealFor: ['Couples', 'Honeymooners', 'Sunset and beach-club seekers', 'Travellers with a bigger budget'],
    idealForZh: ['情侣', '蜜月旅客', '追日落与海滩俱乐部的人', '预算较宽的旅客'],
    priceTier: '$$$',
  },
  {
    id: 'bacuit-bay-islands',
    destinationId: 'palawan',
    name: 'Bacuit Bay Islands',
    nameZh: '巴奎特湾群岛',
    coordinates: {
      lat: 11.1282597,
      lng: 119.3667409,
      confidence: 'verified',
      coordNote:
        'OSM natural feature "Bacuit Bay" (bay), El Nido, Palawan — the mapped bay centroid, about 6 km south-west of the El Nido town waterfront.',
    },
    isStayBase: false,
    zoneType: 'island',
    radiusMeters: 7000,
    bestFor: [
      'Island-hopping tours A to D',
      'The Big and Small Lagoons on Miniloc',
      'Limestone karst scenery',
      'Snorkelling, kayaking and hidden beaches',
      'Seven Commandos, Shimizu and Matinloc stops',
    ],
    weakFor: [
      'Overnight stays — only a handful of island resorts',
      'Boat days in bad weather',
      'Travelling independently without a hired boat',
      'Mobile signal and any kind of convenience',
    ],
    bestForZh: ['A–D 四条跳岛线路', '米尼洛克岛的大小潟湖', '石灰岩喀斯特地貌', '浮潜、皮划艇与隐秘海滩', '七勇士、清水岛、马丁洛克等停靠点'],
    weakForZh: ['过夜住宿（岛上只有少数度假村）', '天气不好时的出海', '不包船就想自由行动', '手机信号与任何便利设施'],
    scores: { beach: 5, nightlife: 1, food: 1, luxury: 4, nature: 5, accessibility: 1 },
    vibe: 'A drowned karst landscape of cliffs, lagoons and hidden coves',
    vibeZh: '被海水淹没的喀斯特地貌：悬崖、潟湖与隐秘海湾',
    tagline: 'Karst islands · Lagoons',
    taglineZh: '喀斯特群岛 · 潟湖',
    summary:
      'Bacuit Bay is the archipelago of limestone islands and islets that makes El Nido famous — Miniloc with the Big and Small Lagoons, Matinloc with its shrine and cliff climb, Shimizu, Cadlao, Dilumacad and the rest. Almost all of it is visited on the four standard boat tours that leave from the El Nido town beach each morning, with a municipal Eco-Tourism Development Fee plus separate lagoon user fees collected at the stops. Nothing here is walkable and nothing is bookable at the pier on the day without joining a boat, so treat it as a zone rather than a base.',
    summaryZh:
      '巴奎特湾就是让爱妮岛出名的石灰岩群岛：拥有大小潟湖的米尼洛克岛、有神龛与登崖路线的马丁洛克岛，还有清水岛、卡德劳岛、迪卢马卡德岛等。几乎全部靠每天上午从爱妮岛镇海滩出发的四条标准跳岛线路游览，上岛时另收市级生态旅游发展费和潟湖使用费。这里没有一处可以步行抵达，也不存在当天在码头临时买票就走，所以把它当作一个区域，而不是落脚点。',
    idealFor: ['Island-hopping travellers', 'Photographers', 'Couples', 'Snorkellers and kayakers'],
    idealForZh: ['跳岛旅客', '摄影爱好者', '情侣', '浮潜与皮划艇玩家'],
    priceTier: '$$$$',
  },
  {
    id: 'san-vicente-long-beach',
    destinationId: 'palawan',
    name: 'San Vicente & Long Beach',
    nameZh: '圣维森特与长滩',
    coordinates: {
      lat: 10.5270058,
      lng: 119.2562819,
      confidence: 'verified',
      coordNote:
        'OSM place "San Vicente" (town), Palawan, Mimaropa — the municipal centre, about 25 km north of Port Barton along the Port Barton–Kemdeng road.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 6000,
    bestFor: [
      'A 14 km beach almost to yourself',
      'Long empty walks at any hour',
      'Kite-surfing and open-water swimming',
      'Cheap, spread-out beach resorts',
      'A quiet alternative to El Nido',
    ],
    weakFor: ['Restaurant choice', 'Nightlife', 'Town-centre atmosphere', 'Getting around without a scooter'],
    bestForZh: ['14 公里几乎无人的海滩', '任何时间去都能空无一人的长走', '风筝冲浪与开阔水域游泳', '便宜而分散的海边度假村', '爱妮岛之外的安静选择'],
    weakForZh: ['餐厅选择少', '夜生活', '城镇中心氛围', '没有摩托车就不方便'],
    scores: { beach: 5, nightlife: 1, food: 2, luxury: 3, nature: 4, accessibility: 2 },
    vibe: 'Fourteen kilometres of sand with almost nothing built behind it',
    vibeZh: '十四公里沙滩，身后几乎还没有建起任何东西',
    tagline: 'Long Beach · Empty sand',
    taglineZh: '圣维森特长滩 · 空旷沙滩',
    summary:
      'San Vicente is the municipality between Port Barton and Roxas, and its Long Beach — usually described as the longest white-sand beach in the Philippines at roughly 14 km — runs along the coast in front of the town. Development is thin: a scatter of small resorts, a few sari-sari stores and the airstrip inland at Kemdeng, roughly 25 km up the road, which is being developed as San Vicente Airport (SWL). Come here for space and quiet rather than for restaurants or nightlife, and expect to need a scooter or a hired tricycle.',
    summaryZh:
      '圣维森特是巴顿港与罗哈斯之间的市镇，它的长滩常被称为全菲律宾最长的白沙滩，约 14 公里，就铺在镇前的海岸上。开发程度很低：零星几家小度假村、几间杂货店，以及在内陆肯登方向约 25 公里处正被建设为圣维森特机场（SWL）的跑道。来这里是为了空旷与安静，而不是餐厅和夜生活；出行基本要靠摩托车或包三轮车。',
    idealFor: ['Beach purists', 'Long-stay and remote-work travellers', 'Kite-surfers', 'Travellers avoiding crowds'],
    idealForZh: ['纯粹为海滩而来的人', '长住与远程办公的旅客', '风筝冲浪玩家', '想避开人潮的旅客'],
    priceTier: '$$',
  },
  {
    id: 'port-barton',
    destinationId: 'palawan',
    name: 'Port Barton',
    nameZh: '巴顿港',
    coordinates: {
      lat: 10.4091064,
      lng: 119.17792,
      confidence: 'verified',
      coordNote:
        'OSM bus_station "Port Barton Terminal", Quezon Street, Pagkakaisa, San Vicente, Palawan — the van terminal that is the physical centre of the village, 255 m from the OSM village node "Port Barton" (10.4114, 119.1779622) used for the Port Barton place record.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 1500,
    bestFor: [
      'Small-village beach life',
      'Island-hopping and turtle snorkelling',
      'Beachfront guesthouses at low prices',
      'Escaping El Nido and Puerto Princesa crowds',
      'Sunset on a village shore',
    ],
    weakFor: ['Nightlife', 'Reliable power, Wi-Fi and mobile data', 'ATMs and banking', 'Luxury resorts and fine dining'],
    bestForZh: ['小村庄式的海边生活', '跳岛与看海龟浮潜', '低价的海边民宿', '避开爱妮岛与公主港的人潮', '在村口海滩看日落'],
    weakForZh: ['夜生活', '稳定的电、Wi-Fi 与手机信号', 'ATM 与银行', '奢华度假村与精致餐饮'],
    scores: { beach: 4, nightlife: 2, food: 3, luxury: 2, nature: 4, accessibility: 2 },
    vibe: 'One sandy street, fishing boats and guesthouses under the palms',
    vibeZh: '一条沙土街、几条渔船，棕榈树下的民宿',
    tagline: 'Village beach · Turtle snorkelling',
    taglineZh: '渔村海滩 · 海龟浮潜',
    summary:
      'Port Barton is a fishing village in San Vicente municipality, about 3 to 3.5 hours by van from Puerto Princesa over the mountain road, and for years the alternative to El Nido for travellers who wanted the same water without the town. The beach is the main street: guesthouses, dive shops and a handful of restaurants sit directly on the sand, and the standard boat trip goes out to German Island, Exotic Island and the turtle and coral snorkelling spots in the bay. Bring cash — there is no ATM — and expect power and internet to be less reliable than on the east coast.',
    summaryZh:
      '巴顿港是圣维森特市镇里的一个渔村，从公主港走山路约 3 到 3.5 小时面包车。多年来它一直是爱妮岛的替代选择：想要同样的海水，却不想要镇上的喧嚣。海滩就是主街——民宿、潜水店和几家餐厅直接建在沙上；标准出海线路去德国岛、异域岛以及湾内的海龟与珊瑚浮潜点。记得带现金（村里没有 ATM），电力和网络也比东海岸更不稳定。',
    idealFor: ['Backpackers', 'Couples on a budget', 'Snorkellers', 'Travellers who have already done El Nido'],
    idealForZh: ['背包客', '预算有限的情侣', '浮潜爱好者', '已经去过爱妮岛的人'],
    priceTier: '$$',
  },
];

/**
 * HOTELS — no additions.
 *
 * Palawan is a thin loyalty market and the check was made property by property,
 * not assumed. Sources consulted: hilton.com's own Philippines location list
 * (four hotels — Conrad Manila, Hilton Manila Newport World Resorts, Anya
 * Resort Tagaytay an SLH Hotel and Hilton Clark Sun Valley Resort — none in
 * Palawan); Marriott's Palawan property pages, which return only the Four
 * Points by Sheraton Palawan Puerto Princesa that is already in
 * `starter.ts` (Marriott's own 2023 expansion briefing confirms it as the
 * rebranded Sheridan Beach Resort and Spa in Sabang, and describes the only
 * other Palawan project as a Sheraton "still in infancy", i.e. not open);
 * OSM brand-name lookups around both Puerto Princesa and El Nido, which return
 * no Sheraton, Marriott, Hilton, Holiday Inn, Hyatt or Anantara object; and
 * country-level searches for IHG, Hyatt and GHA DISCOVERY, which surfaced no
 * Palawan member. Two near-misses were rejected deliberately: Discovery Coron
 * (the former Club Paradise Palawan) is brand "Discovery", which is not in the
 * allowed brand list, and sits in Busuanga, outside these bounds; and Banwa
 * Private Island is in Palawan but is sold through Anantara Vacation Club's
 * points programme rather than as an Anantara hotel bookable with GHA DISCOVERY.
 *
 * So the destination's eligible inventory is one property, and it already
 * exists. Writing more would mean inventing it.
 */
export const hotels: HotelSeed[] = [];

export const places: PlaceSeed[] = [
  /* ---------------------------------------------------------------- Puerto Princesa */
  {
    id: 'plaza-cuartel',
    name: 'Plaza Cuartel',
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'activity',
    subcategory: 'memorial',
    coordinates: {
      lat: 9.7396761,
      lng: 118.7295409,
      confidence: 'verified',
      coordNote: 'OSM leisure=park "Plaza Cuartel", San Miguel, Puerto Princesa, Mimaropa (Photon/OSM lookup).',
    },
    recommendedDurationMin: 30,
    bestTime: 'Late afternoon, roughly 16:00-18:00, before the baywalk food stalls open',
    bestTimeZh: '傍晚 16:00–18:00，正好在海滨大道摊档开张之前',
    tags: ['Second-world-war', 'Memorial', 'Park', 'Rizal-avenue', 'Free'],
    tagsZh: ['二战', '纪念地', '公园', '黎刹大道', '免费'],
    description:
      'A small waterfront park on Rizal Avenue, next to the Immaculate Conception Cathedral, built over the ruins of a Spanish-era garrison. In December 1944 occupying Japanese forces forced around 150 American prisoners of war into an air-raid shelter here and burned them alive; a memorial and interpretive panels now mark the spot. It is a five-minute stop on the way along the baywalk, and the shade and sea wall make it a natural place to sit at sunset.',
    descriptionZh:
      '黎刹大道上的海滨小公园，紧挨圣母无原罪主教座堂，建在西班牙时期兵营遗址上。1944 年 12 月，占领的日军把约 150 名美军战俘赶进这里的防空洞纵火，如今立有纪念碑与说明牌。它是海滨大道散步途中五分钟的停留点，树荫与海堤也让它成为看日落的天然座位。',
    notes:
      'Free and open all day; there is no gate and no ticket office. The memorial is a place of remembrance rather than an attraction, so keep voices down and do not climb on the structures. Pair it with the cathedral next door and the baywalk.',
    notesZh:
      '免费，全天开放，没有大门也没有售票处。这里是纪念地而非景点，请放低声音，不要攀爬纪念构筑物。可与旁边的教堂和海滨大道一并安排。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    openingHours: 'Open access at all hours',
    markerLayer: 'activity',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'half-day', 'family', 'photo-spots'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — leisure=park "Plaza Cuartel", Rizal Avenue, San Miguel, Puerto Princesa' }],
  },
  {
    id: 'immaculate-conception-cathedral',
    name: 'Immaculate Conception Cathedral',
    nameZh: '公主港圣母无原罪主教座堂',
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'activity',
    subcategory: 'church',
    coordinates: {
      lat: 9.7403872,
      lng: 118.7301896,
      confidence: 'verified',
      coordNote: 'OSM amenity=place_of_worship "Immaculate Conception Cathedral", Rizal Avenue, San Miguel, Puerto Princesa (Photon/OSM lookup).',
    },
    recommendedDurationMin: 30,
    bestTime: 'Early morning for mass, or late afternoon when the light on the façade is best',
    bestTimeZh: '清晨参加弥撒，或傍晚看立面的光线',
    tags: ['Church', 'Catholic', 'Rizal-avenue', 'Architecture', 'Active-parish'],
    tagsZh: ['教堂', '天主教', '黎刹大道', '建筑', '在用教堂'],
    description:
      'The cathedral of the Diocese of Puerto Princesa, standing on Rizal Avenue a short walk from Plaza Cuartel and Mendoza Park. It is the city principal Catholic church and the anchor of the older civic core: masses run daily and the surrounding streets hold the market, the plazas and most of the downtown grid. Visitors are welcome between services.',
    descriptionZh:
      '公主港教区的主教座堂，位于黎刹大道，离库阿特尔广场与门多萨公园都是几分钟步行。它是全城最主要的天主教堂，也是旧城核心的中心：每日有弥撒，周边街巷集中了市场、广场与市中心大部分街区。非弥撒时间欢迎参观。',
    notes:
      'Free to enter. Sunday masses are busy and the surrounding streets close to traffic around them. Dress modestly, keep quiet during services and do not photograph worshippers.',
    notesZh:
      '免费入内。主日弥撒时人多，周边街道会临时管制。请穿着得体，弥撒期间保持安静，不要拍摄正在祈祷的人。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    openingHours: 'Open daily around mass times; the forecourt is accessible at all hours',
    markerLayer: 'activity',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'half-day', 'family', 'budget'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — amenity=place_of_worship "Immaculate Conception Cathedral", Rizal Avenue, Puerto Princesa' }],
  },
  {
    id: 'palawan-heritage-center',
    name: 'Palawan Heritage Center',
    nameZh: '巴拉望文化遗产中心',
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'activity',
    subcategory: 'museum',
    coordinates: {
      lat: 9.738703,
      lng: 118.7437142,
      confidence: 'verified',
      coordNote: 'OSM tourism=museum "Palawan Heritage Center", Fernandez Street, San Miguel, Puerto Princesa (Photon/OSM lookup).',
    },
    recommendedDurationMin: 60,
    bestTime: 'Mid-morning to early afternoon on a weekday, when it is quiet and staff have time to talk',
    bestTimeZh: '工作日上午到下午早些时候，人少，工作人员也有空讲解',
    tags: ['Museum', 'Provincial-history', 'Archaeology', 'Ethnology', 'Air-conditioned'],
    tagsZh: ['博物馆', '地方史', '考古', '民族学', '有空调'],
    description:
      'A provincial museum and exhibit space in the city centre, on Fernandez Street a few minutes from the cathedral, with displays on Palawan archaeology, the indigenous groups of the province and its terrestrial and marine biodiversity. It is the practical indoor option on a wet afternoon and the quickest way to make sense of what you are looking at on the Underground River and Honda Bay trips.',
    descriptionZh:
      '位于市中心的省级博物馆与展览空间，在费尔南德斯街，离主教座堂几分钟路程，展览涵盖巴拉望的考古、原住民族群以及陆地与海洋生物多样性。下雨天它是最实用的室内去处，也是理解地下河与本田湾行程中你所看到的东西最快的途径。',
    notes:
      'There is a small entrance fee and the museum keeps office hours rather than tourist hours, so check the current schedule before making a special trip. Air-conditioned, which matters in the middle of the day.',
    notesZh:
      '收取少量门票，开放时间更接近政府办公时间而非景区时间，专程前往前先确认当天是否开放。馆内有空调，正午时分尤其受用。',
    entryFee: 'Small per-person entrance fee (confirm the current amount on site)',
    entryFeeZh: '少量门票（具体金额请现场确认）',
    openingHours: 'Weekday office hours; closed on public holidays',
    markerLayer: 'activity',
    discovery: ['culture', 'highlights'],
    recommendedFor: ['first-time', 'rainy-day', 'family', 'half-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — tourism=museum "Palawan Heritage Center", Fernandez Street, Puerto Princesa' }],
  },
  {
    id: 'bakers-hill',
    name: "Baker's Hill",
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'activity',
    subcategory: 'park',
    coordinates: {
      lat: 9.8076929,
      lng: 118.7342145,
      confidence: 'verified',
      coordNote: 'OSM shop=bakery "Baker\'s Hill", Mitra Road, Tagburos, Puerto Princesa (Photon/OSM lookup); the neighbouring garden-centre node (9.8074745, 118.7355273) is the same estate.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Morning, roughly 08:00-11:00, before the city-tour vans arrive',
    bestTimeZh: '上午 08:00–11:00，赶在城市游面包车之前',
    tags: ['Bakery', 'Gardens', 'Souvenirs', 'Family-friendly', 'North-of-the-city'],
    tagsZh: ['烘焙', '花园', '伴手礼', '适合亲子', '城北'],
    description:
      'A hillside estate about 7 km north of the city centre on Mitra Road, combining a bakery known for hopia and other Filipino pastries with landscaped gardens, a small pond and a cluster of souvenir and snack stalls. It is a standard stop on the Puerto Princesa city tour and works well with children; the view from the upper terraces looks back over the coastal plain.',
    descriptionZh:
      '位于城北米特拉路约 7 公里处的山坡园区，一边是以菲律宾传统糕饼（hopia 等）出名的烘焙坊，一边是造景花园、小池塘和一片伴手礼与小吃摊。它是公主港市区游的标准一站，很适合带小孩；上层平台可以回望沿海平原。',
    notes:
      'Entry to the grounds is free; you pay only for what you buy. Come early — the coach and van groups arrive from mid-morning and the bakery queue moves slowly. Cash is easiest at the stalls.',
    notesZh:
      '入园免费，只需为购买的东西付费。尽量早到——上午中段起旅行团陆续抵达，烘焙坊排队会变慢。摊位上现金最方便。',
    entryFee: 'Free entry (pay for food and souvenirs)',
    entryFeeZh: '免门票（餐饮与伴手礼另付）',
    openingHours: 'Daily, roughly 07:00-19:00',
    markerLayer: 'food',
    discovery: ['food', 'shopping', 'highlights'],
    recommendedFor: ['family', 'family-young-kids', 'half-day', 'food-lovers', 'shopping'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — shop=bakery "Baker\'s Hill", Mitra Road, Tagburos, Puerto Princesa' }],
  },
  {
    id: 'mitras-ranch',
    name: "Mitra's Ranch",
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'activity',
    subcategory: 'viewpoint',
    coordinates: {
      lat: 9.8116492,
      lng: 118.7353929,
      confidence: 'verified',
      coordNote: 'OSM tourism=attraction "Mitra Ranch", Mitra Road, Tagburos, Puerto Princesa (Photon/OSM lookup).',
    },
    recommendedDurationMin: 30,
    bestTime: 'Late afternoon for the clearest view over Honda Bay, or first thing before the haze builds',
    bestTimeZh: '傍晚看本田湾最清楚，或一早趁雾气未起',
    tags: ['Viewpoint', 'Hilltop', 'Honda-bay-views', 'City-tour', 'Free'],
    tagsZh: ['观景台', '山顶', '望本田湾', '市区游', '免费'],
    description:
      'A hilltop rest house and viewing deck about 8 km north of the city on the same road as Baker\'s Hill, on land associated with the family of the late politician Ramon Mitra. The terrace looks east and north over the coastal plain towards Honda Bay and the islands, and it is the best short drive out of the city for a wide view. Usually combined with Baker\'s Hill on the same half-day loop.',
    descriptionZh:
      '位于城北同一条米特拉路上约 8 公里的山顶休憩所与观景平台，土地与已故政治人物拉蒙·米特拉家族有关。平台朝东、朝北俯瞰沿海平原，远望本田湾与群岛，是离城最近、最省力的一片开阔视野。通常与贝克山排进同一个半日环线。',
    notes:
      'No ticket office; a small parking or maintenance contribution is sometimes collected at the gate, so carry change. The road up is steep and narrow — tricycles and vans handle it, but it is slow. Combine with Baker\'s Hill 500 m back down the road.',
    notesZh:
      '没有售票处；门口偶尔会收少量停车或维护费，备些零钱。上山路陡且窄，三轮车和面包车都能上，但速度慢。可与回程 500 米外的贝克山一起安排。',
    entryFee: 'Free (an occasional small parking contribution may be collected)',
    entryFeeZh: '免费（偶尔会收少量停车费）',
    openingHours: 'Daylight hours',
    markerLayer: 'activity',
    discovery: ['highlights'],
    recommendedFor: ['first-time', 'half-day', 'family', 'photo-spots'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — tourism=attraction "Mitra Ranch", Mitra Road, Tagburos, Puerto Princesa' }],
  },
  {
    id: 'palawan-wildlife-rescue-and-conservation-center',
    name: 'Palawan Wildlife Rescue and Conservation Center',
    nameZh: '巴拉望野生动物救援与保护中心',
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'nature',
    subcategory: 'wildlife',
    coordinates: {
      lat: 9.7990093,
      lng: 118.6957192,
      confidence: 'verified',
      coordNote: 'OSM boundary=nature_reserve "Palawan Wildlife Rescue and Conservation Center", Irawan, Puerto Princesa (Photon/OSM lookup); the zoo node inside the reserve is mapped at 9.7993204, 118.6938049.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Morning, roughly 08:30-11:00, when the animals are active and the heat is bearable',
    bestTimeZh: '上午 08:30–11:00，动物活跃、气温也还能忍受',
    tags: ['Wildlife', 'Crocodiles', 'Rescue-centre', 'Conservation', 'Family-friendly'],
    tagsZh: ['野生动物', '鳄鱼', '救护中心', '保育', '适合亲子'],
    description:
      'A government wildlife facility in Irawan, about 12 km north-west of the city centre, best known as the base of the Philippines\' captive-breeding programme for the freshwater crocodile (Crocodylus mindorensis), which is critically endangered. Alongside the crocodile pens there are rescued and confiscated animals, a small nature trail and an exhibit area. It is the standard wildlife stop on the Puerto Princesa city tour and the most accessible place to understand what the province is trying to protect.',
    descriptionZh:
      '位于伊拉万、离市中心西北约 12 公里的政府野生动物设施，最出名的是菲律宾淡水鳄（Crocodylus mindorensis，极危）人工繁育计划的基地。鳄鱼池之外还有被救助与没收的动物、一小段自然步道和展览区。它是公主港市区游的固定一站，也是了解这个省在保护什么最方便的地方。',
    notes:
      'There is a per-person entrance fee that has changed over the years, so confirm it at the gate rather than budgeting from an old figure; the crocodile feeding and the guided talk run at set times. Bring water and mosquito repellent, and treat it as a conservation facility rather than a zoo.',
    notesZh:
      '按人头收门票，金额历年有调整，请以门口标示为准，不要按旧数字做预算；鳄鱼喂食与讲解有固定场次。带水和驱蚊液，把它当作保育设施而不是动物园来对待。',
    entryFee: 'Per-person entrance fee (confirm the current amount at the gate)',
    entryFeeZh: '按人头收门票（以门口标示为准）',
    openingHours: 'Daily, roughly 08:00-17:00',
    markerLayer: 'nature',
    discovery: ['nature', 'highlights'],
    recommendedFor: ['family', 'family-young-kids', 'first-time', 'half-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — boundary=nature_reserve "Palawan Wildlife Rescue and Conservation Center", Irawan, Puerto Princesa' }],
  },
  {
    id: 'puerto-princesa-airport',
    name: 'Puerto Princesa International Airport (PPS)',
    nameZh: '公主港国际机场',
    destinationId: 'palawan',
    areaId: 'ppc-city-centre',
    category: 'transport',
    subcategory: 'airport',
    coordinates: {
      lat: 9.7423851,
      lng: 118.7583514,
      confidence: 'verified',
      coordNote: 'OSM aeroway=aerodrome "Puerto Princesa International Airport", Airport Access Road, Bancao-Bancao, Puerto Princesa (Photon/OSM lookup); matches the airport record already carried by the destination.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Allow two hours before a domestic departure — the terminal is small but the check-in queue is not',
    bestTimeZh: '国内航班建议提前两小时到——航站楼不大，但值机排队不短',
    tags: ['Airport', 'PPS', 'Transport', 'Arrival', 'Departure'],
    tagsZh: ['机场', 'PPS', '交通', '到达', '离开'],
    description:
      'Puerto Princesa International Airport (IATA PPS) is Palawan\'s main gateway, on Airport Access Road in Bancao-Bancao about 2.5 km east of the downtown grid — roughly a 10 to 15 minute tricycle ride. In practice almost every arrival connects through Manila or Cebu on a narrow-body jet; the "international" designation covers a small number of charter and seasonal services rather than scheduled long-haul routes. Vans to El Nido and to Sabang for the Underground River leave from terminals in the city, not from the airport itself.',
    descriptionZh:
      '公主港国际机场（IATA：PPS）是巴拉望的主要门户，位于班考班考区的机场联络道，离市中心约 2.5 公里，坐三轮车约 10–15 分钟。实际上几乎所有航班都是经马尼拉或宿务转机的窄体机；"国际"二字目前对应少量包机与季节性航班，而非定期长航线。开往爱妮岛、以及去萨邦地下河的面包车都在市区车站发车，不在机场。',
    notes:
      'Tricycles wait outside arrivals and are the cheapest way into town, but drivers quote per trip rather than by meter — agree the fare first. There is no railway and no ride-hailing coverage worth relying on, so if you land late, arrange the transfer with your hotel.',
    notesZh:
      '到达口外有三轮车排队，是进城最便宜的方式，但司机按趟报价而非打表，务必先谈好价。这里没有铁路，网约车覆盖也不可靠，若深夜抵达，最好让酒店安排接机。',
    openingHours: 'Terminal open daily, roughly 04:00-21:00 according to the flight schedule',
    markerLayer: 'airport',
    recommendedFor: ['first-time'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — aeroway=aerodrome "Puerto Princesa International Airport", Bancao-Bancao, Puerto Princesa' }],
  },

  /* ------------------------------------------------------------------------ Honda Bay */
  {
    id: 'starfish-island',
    name: 'Starfish Island',
    destinationId: 'palawan',
    areaId: 'honda-bay',
    category: 'beach',
    subcategory: 'island',
    coordinates: {
      lat: 9.902007,
      lng: 118.796891,
      confidence: 'verified',
      coordNote: 'OSM place=islet "Starfish Island", Puerto Princesa, Mimaropa (Photon/OSM lookup, relation 20994159).',
    },
    recommendedDurationMin: 90,
    bestTime: 'Mid-morning at low to mid tide, when the sandbar and the shallows are exposed',
    bestTimeZh: '上午中段、中低潮时，沙洲与浅滩露出来',
    tags: ['Island', 'Snorkelling', 'Sandbar', 'Honda-bay-tour', 'Shallow-water'],
    tagsZh: ['小岛', '浮潜', '沙洲', '本田湾线路', '浅水'],
    description:
      'One of the standard stops on the Honda Bay island-hopping route, a low, mostly sand and scrub islet with a shallow seagrass-and-coral shelf on its western side. The name comes from the starfish that were once common in the shallows — they are far fewer now, and the guides ask visitors not to lift them out of the water. Because the shelf is shallow and protected it is the easiest of the Honda Bay stops for weak swimmers and children.',
    descriptionZh:
      '本田湾跳岛线路的标准停靠点之一，一座低平、以沙与灌木为主的小岛，西侧是浅水的海草与珊瑚平台。名字来自过去浅滩上常见的海星——如今数量少得多，船家会请大家不要把海星拿出水面。因为平台浅且有遮蔽，这里是本田湾几站中最适合不会游泳的人和小孩的一站。',
    notes:
      'There is usually no separate island entrance fee beyond the Honda Bay terminal and environmental fees already collected at Santa Lourdes wharf, but operators change what they include — confirm what your boat price covers before leaving. Bring reef-safe sunscreen and water shoes; there is almost no shade.',
    notesZh:
      '除圣卢尔德斯码头已收的码头费与环保费外，上岛一般不再另外收费，但各家包含内容会变，出发前先确认船费涵盖哪些项目。带珊瑚友好型防晒和涉水鞋；岛上几乎没有遮阳。',
    markerLayer: 'beach',
    discovery: ['beach', 'water'],
    recommendedFor: ['family', 'family-young-kids', 'non-swimmer', 'half-day', 'full-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — place=islet "Starfish Island", Honda Bay, Puerto Princesa' }],
  },
  {
    id: 'cowrie-island',
    name: 'Cowrie Island',
    destinationId: 'palawan',
    areaId: 'honda-bay',
    category: 'beach',
    subcategory: 'island',
    coordinates: {
      lat: 9.838286,
      lng: 118.7735223,
      confidence: 'verified',
      coordNote: 'OSM place=island "Cowrie Island", Puerto Princesa, Mimaropa (Photon/OSM lookup).',
    },
    recommendedDurationMin: 150,
    bestTime: 'Late morning to early afternoon — it is the usual lunch stop, so the boat arrives around midday',
    bestTimeZh: '上午后段到下午初段——这里是常规午餐停靠点，船大约中午到',
    tags: ['Island', 'Lunch-stop', 'Facilities', 'Family-friendly', 'Honda-bay-tour'],
    tagsZh: ['小岛', '午餐停靠点', '有设施', '适合亲子', '本田湾线路'],
    description:
      'The most developed of the Honda Bay stops and the one most boats use for lunch: a flat, sandy island with palm shade, picnic huts, a food and drinks counter and basic changing and shower facilities. It is the closest thing on the Honda Bay circuit to a beach club, which makes it the comfortable choice with children and the least wild one for anybody hoping for emptiness.',
    descriptionZh:
      '本田湾几站中开发最完善的一座，也是多数船只安排午餐的地方：平坦的沙岛，有棕榈树荫、野餐凉亭、餐饮柜台，以及简单的更衣与冲淋设施。它是本田湾线路上最接近海滩俱乐部的一站，带小孩最舒服，对想找空旷感的人来说则最不"野"的一站。',
    notes:
      'The island is reached only as part of a boat trip; there is no public ferry. Lunch is often included in the package price, but island fees and the environmental fee are typically collected separately on the day, in cash and in small notes.',
    notesZh:
      '只能随船前往，没有公共渡轮。午餐常包含在套餐价里，但上岛费与环保费通常当天另收，且只收现金，请备小面额纸币。',
    markerLayer: 'beach',
    discovery: ['beach', 'water', 'food'],
    recommendedFor: ['family', 'family-young-kids', 'non-swimmer', 'full-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — place=island "Cowrie Island", Honda Bay, Puerto Princesa' }],
  },

  /* -------------------------------------------------------------------------- El Nido */
  {
    id: 'seven-commandos-beach',
    name: 'Seven Commandos Beach',
    nameZh: '七勇士海滩',
    destinationId: 'palawan',
    areaId: 'el-nido-town',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 11.1736898,
      lng: 119.3793563,
      confidence: 'verified',
      coordNote: 'OSM natural=beach "Seven Commandos Beach", Buena Suerte, El Nido, Palawan (Photon/OSM lookup).',
    },
    recommendedDurationMin: 90,
    bestTime: 'As the first stop of the morning, before the afternoon wind and the later boats',
    bestTimeZh: '作为上午第一站最好，避开午后风与后来的船',
    tags: ['Beach', 'Tour-a', 'Tour-c', 'Coconut-palms', 'Day-trip'],
    tagsZh: ['海滩', 'A 线', 'C 线', '椰林', '一日游'],
    description:
      'A curving white-sand beach on the mainland at the southern mouth of Bacuit Bay, ten minutes by boat from the El Nido town beach and a regular first or last stop on Tours A and C. Coconut palms run along the top of the sand and a small bar operates under them; local accounts say the name comes from a group of seven commandos billeted here during the Second World War. There is decent snorkelling off the northern rocks.',
    descriptionZh:
      '位于巴奎特湾南口大陆一侧的弧形白沙滩，从爱妮岛镇海滩坐船约十分钟，是 A 线与 C 线常见的首站或末站。椰林沿着沙滩上沿生长，树下有一间小酒吧；当地说法认为名字来自二战期间驻扎在此的七名突击队员。北侧礁石一带浮潜尚可。',
    notes:
      'No entrance fee of its own — it is covered by the boat tour and the municipal Eco-Tourism Development Fee. The beach has no shade beyond the palms and no freshwater after the bar closes, so take what you need from town.',
    notesZh:
      '不单独收费，已包含在船费与市级生态旅游发展费内。除椰林外几乎没有遮荫，酒吧打烊后也没有淡水，所需物品请从镇上带齐。',
    markerLayer: 'beach',
    discovery: ['beach', 'highlights'],
    recommendedFor: ['first-time', 'couples', 'photo-spots', 'half-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=beach "Seven Commandos Beach", Buena Suerte, El Nido' }],
  },
  {
    id: 'taraw-cliff',
    name: 'Taraw Cliff (Taraw Peak)',
    nameZh: '塔拉悬崖',
    destinationId: 'palawan',
    areaId: 'el-nido-town',
    category: 'activity',
    subcategory: 'viewpoint',
    coordinates: {
      lat: 11.1776413,
      lng: 119.3886515,
      confidence: 'verified',
      coordNote: 'OSM natural=peak "Taraw Peak", El Nido, Palawan (Photon/OSM lookup) — the summit directly behind the El Nido poblacion, 160 m from the town beach.',
    },
    recommendedDurationMin: 180,
    bestTime: 'First light, roughly 05:30-07:00, before the rock heats up and the haze closes the view',
    bestTimeZh: '天刚亮 05:30–07:00，岩石还没被晒烫、雾气也未起来',
    tags: ['Hike', 'Karst', 'Viewpoint', 'Via-ferrata', 'Guide-required'],
    tagsZh: ['徒步', '喀斯特', '观景', '铁索栈道', '必须请向导'],
    description:
      'The limestone cliff that rises immediately behind El Nido town; its summit looks straight down the Bacuit Bay archipelago and is the defining view of the place. The rock is sharp, loose and extremely exposed, and the freehand scramble has injured and killed people, so the sanctioned route is the via ferrata canopy walk run by a licensed operator, which fixes cables and a short bridge across the worst sections. The OSM node marks Taraw Peak itself, which is the objective.',
    descriptionZh:
      '紧贴在爱妮岛镇背后的石灰岩悬崖，山顶正对巴奎特湾群岛，是这里最标志性的视角。岩面锋利、松动且极度暴露，徒手攀爬曾造成伤亡，因此现行合规路线是由持牌运营商经营的铁索栈道，在最险的几段固定钢缆并架设短桥。OSM 节点标注的塔拉峰就是终点本身。',
    notes:
      'Go with a guide and go early; the climb is short but technically hard, with rope sections and serious exposure, and the descent is harder than the ascent. Closed shoes and free hands are essential — no bags, no flip-flops, no drones on the rock. Do not attempt it in rain.',
    notesZh:
      '务必请向导并趁早出发；路线不长但技术难度高，有绳降段且暴露感强，下山比上山更难。必须穿包脚的鞋、双手空出来——不要带包、不要穿人字拖、不要在岩壁上放无人机。下雨天不要尝试。',
    entryFee: 'Guided via ferrata and guide fee per person (varies by operator — confirm before booking)',
    entryFeeZh: '铁索栈道与向导按人头收费（各家不同，预订前确认）',
    openingHours: 'Operators run morning slots from first light; the last descents are well before dark',
    markerLayer: 'activity',
    discovery: ['nature', 'highlights'],
    recommendedFor: ['adventurous', 'photo-spots', 'solo', 'friends'],
    activity: {
      kind: 'hike',
      difficulty: 'hard',
      weatherDependency: 'high',
      reservationRecommended: true,
      operatorRequired: true,
      transportContext: 'The trailhead is a short walk from the El Nido town beach, behind the poblacion; tricycles drop at the market.',
      transportContextZh: '登山口就在爱妮岛镇海滩后方的小巷里，步行可达；三轮车会停在市场。',
    },
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=peak "Taraw Peak", El Nido, Palawan' }],
  },
  {
    id: 'nagkalit-kalit-falls',
    name: 'Nagkalit-Kalit Falls',
    destinationId: 'palawan',
    areaId: 'el-nido-town',
    category: 'nature',
    subcategory: 'waterfall',
    coordinates: {
      lat: 11.2516695,
      lng: 119.445701,
      confidence: 'verified',
      coordNote: 'OSM waterway=waterfall "Nagkalit-Kalit Waterfalls", Pasadeña, El Nido, Palawan (Photon/OSM lookup) — about 10 km north-east of the El Nido town area point.',
    },
    recommendedDurationMin: 180,
    bestTime: 'The morning of a day when you are not diving, and in or just after the wet season when the fall actually runs',
    bestTimeZh: '不潜水的上午；雨季或刚过雨季时水量才像样',
    tags: ['Waterfall', 'Jungle-walk', 'River-crossing', 'Guide-required', 'Ricefields'],
    tagsZh: ['瀑布', '丛林徒步', '涉溪', '需要向导', '稻田'],
    description:
      'A small waterfall in Barangay Pasadeña, about 30 to 40 minutes by tricycle from El Nido town and then a 30 to 45 minute walk through rice fields and secondary forest with two or three river crossings. The fall itself is modest — a shallow pool below a rock face — and it can be little more than a trickle in the dry season, so the walk rather than the waterfall is the reason to come. Local guides meet arrivals at the trailhead.',
    descriptionZh:
      '位于帕萨德尼亚区的小瀑布，从爱妮岛镇坐三轮车约 30–40 分钟，之后穿过稻田与次生林步行 30–45 分钟，途中要涉溪两三次。瀑布本身不大，是岩面下的浅潭，旱季甚至只剩细流，所以来这里更多是为了这段徒步而非瀑布。当地向导在步道口接客。',
    notes:
      'A guide and entrance fee are collected at the trailhead; the amount is set locally rather than published, so agree it before setting off and take cash. Wear shoes you can get wet, and skip it after heavy rain, when the crossings become dangerous.',
    notesZh:
      '步道口收向导费与进山费，金额由当地自定而非公开，出发前先谈好并备现金。穿可以湿水的鞋；大雨之后不要前往，涉溪点会变得危险。',
    entryFee: 'Local guide and entrance fee per person (agree the amount at the trailhead)',
    entryFeeZh: '当地向导费与进山费按人头（在步道口谈好金额）',
    openingHours: 'Daylight hours; the last groups start back by about 16:30',
    markerLayer: 'nature',
    discovery: ['nature', 'water'],
    recommendedFor: ['adventurous', 'half-day', 'family-young-kids', 'budget'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — waterway=waterfall "Nagkalit-Kalit Waterfalls", Pasadeña, El Nido' }],
  },
  {
    id: 'makinit-hot-springs',
    name: 'Makinit Hot Springs',
    destinationId: 'palawan',
    areaId: 'el-nido-town',
    category: 'nature',
    subcategory: 'hot-spring',
    coordinates: {
      lat: 11.2899337,
      lng: 119.44678,
      confidence: 'verified',
      coordNote: 'OSM natural=spring "Makinit Hot Springs", El Nido - New Ibajay Road, Barotuan, El Nido, Palawan (Photon/OSM lookup).',
    },
    recommendedDurationMin: 120,
    bestTime: 'Late afternoon into early evening, when the air cools and the pools feel hot by contrast',
    bestTimeZh: '傍晚到入夜，气温降下来后泡池才有热感',
    tags: ['Hot-spring', 'Wellness', 'Barotuan', 'Sulphur', 'Off-the-beach'],
    tagsZh: ['温泉', '养生', '巴罗图安', '硫磺', '海滩之外的行程'],
    description:
      'Warm sulphur springs at Barotuan, about 14 km south-east of El Nido town along the New Ibajay road, in flat farmland a short way inland from the coast. Local operators have built small pools around the outlets where the water comes up warm through the sand, and the site is used by residents as much as by visitors. It is the natural half-day counterweight to a boat trip: inland, calm and almost never crowded.',
    descriptionZh:
      '位于巴罗图安的温硫磺泉，沿新伊巴哈伊公路距爱妮岛镇约 14 公里，在离海岸不远处平坦的农田间。当地经营者在泉水从沙中涌出的地方砌了几口小池；来泡的不只是游客，也有很多本地居民。它是出海行程最好的半日对照：在内陆、安静，而且几乎从不拥挤。',
    notes:
      'A per-person entrance fee is charged at the site; the amount is set locally and changes, so confirm on arrival. The spring is developed rather than wild — expect concrete pools, basic changing space and a sari-sari store, not a resort spa.',
    notesZh:
      '现场按人头收门票，金额由当地自定且有调整，到场确认即可。这里是开发过的泉眼而非野泉：水泥泡池、简易更衣处和一间小卖部，不要期待度假村级别的 SPA。',
    entryFee: 'Per-person entrance fee (confirm the current amount on site)',
    entryFeeZh: '按人头收门票（以现场标示为准）',
    openingHours: 'Daily, roughly 07:00-20:00',
    markerLayer: 'nature',
    discovery: ['wellness', 'nature'],
    recommendedFor: ['couples', 'wellness', 'half-day', 'quiet'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=spring "Makinit Hot Springs", New Ibajay Road, Barotuan, El Nido' }],
  },
  {
    id: 'el-nido-lio-airport',
    name: 'El Nido Airport (Lio Airport, ENI)',
    nameZh: '爱妮岛机场（利奥机场）',
    destinationId: 'palawan',
    areaId: 'el-nido-town',
    category: 'transport',
    subcategory: 'airport',
    coordinates: {
      lat: 11.2015389,
      lng: 119.4174191,
      confidence: 'verified',
      coordNote: 'OSM aeroway=aerodrome "El Nido Airport", Kalye Landingan, Villa Libertad, El Nido, Palawan (Photon/OSM lookup); matches the Lio airport record already carried by the destination. The terminal node "Lio Airport" is mapped separately at 11.20149, 119.41838.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Daylight departures only — the strip has no night operations',
    bestTimeZh: '只有白天航班——跑道不具备夜航条件',
    tags: ['Airport', 'ENI', 'Turboprop', 'Transport', 'Lio'],
    tagsZh: ['机场', 'ENI', '螺旋桨飞机', '交通', '利奥'],
    description:
      'El Nido Airport, also called Lio Airport (IATA ENI), is a short airstrip at Lio in Barangay Villa Libertad about 4 km north of El Nido town, on the road to Nacpan. The runway is around 1,000 m, which is why only turboprops use it — currently Cebgo ATR aircraft, with AirSWIFT having served the strip historically — and why luggage and seat limits are tighter than on a jet. It is the fast way into northern Palawan; the alternative is the 5 to 6 hour van from Puerto Princesa.',
    descriptionZh:
      '爱妮岛机场又称利奥机场（IATA：ENI），是位于利奥、维拉利伯塔德区的一条短跑道，距爱妮岛镇约 4 公里，在通往纳克潘的路上。跑道长约 1,000 米，因此只有螺旋桨飞机能用——目前是宿务太平洋旗下 Cebgo 的 ATR 机型，AirSWIFT 历史上曾执飞——行李与座位限制也比喷气机更紧。它是进入北巴拉望最快的方式；替代方案是从公主港坐 5–6 小时面包车。',
    notes:
      'Transfers to El Nido town take about 15 to 20 minutes by tricycle or hotel van. Because only turboprops operate, weight and baggage allowances are enforced strictly and flights are more weather-sensitive than at a jet airport — build slack into the end of a trip that depends on it.',
    notesZh:
      '到爱妮岛镇约 15–20 分钟三轮车或酒店接送车程。由于只有螺旋桨飞机，重量与行李额度执行得比喷气机严格，航班受天气影响也更大——如果回程依赖它，行程末尾要多留缓冲。',
    openingHours: 'Open for scheduled daylight departures and arrivals',
    markerLayer: 'airport',
    recommendedFor: ['first-time'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — aeroway=aerodrome "El Nido Airport", Villa Libertad, El Nido' }],
  },
  {
    id: 'las-cabanas-beach',
    name: 'Las Cabañas Beach',
    destinationId: 'palawan',
    areaId: 'las-cabanas',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 11.1445065,
      lng: 119.3937261,
      confidence: 'verified',
      coordNote: 'OSM tourism=attraction "Las Cabañas Beach", Puerto Princesa North Road, Bulbulungan, El Nido, Palawan (Photon/OSM lookup, node 12506425904).',
    },
    recommendedDurationMin: 150,
    bestTime: 'From about 16:00 through sunset, which is what this beach is for',
    bestTimeZh: '16:00 之后一直到日落——这片海滩就是为日落存在的',
    tags: ['Beach', 'Sunset', 'Beach-bars', 'Swimming', 'South-of-town'],
    tagsZh: ['海滩', '日落', '海滩酒吧', '游泳', '镇南'],
    description:
      'The beach on the Marimegmeg headland about 4 km south of El Nido town, facing west across Bacuit Bay towards Cadlao and the sunset. The sand is coarser than at Nacpan but the water is sheltered enough to swim, and the strip behind it holds the heaviest concentration of beach bars and day-bed clubs in the El Nido area. The zipline across to Depeldet Island leaves from the northern end of the same beach.',
    descriptionZh:
      '位于爱妮岛镇以南约 4 公里马里梅格梅格岬角上的海滩，正对西面，隔着巴奎特湾眺望卡德劳岛与日落。沙质比纳克潘粗，但水面有遮蔽、可以游泳；沙滩后方是爱妮岛一带海滩酒吧与躺椅俱乐部最密集的一段。飞往德佩尔德特岛的滑索从同一片海滩的北端出发。',
    notes:
      'Free and open; there is no gate and no entrance fee. Tricycles from El Nido town take 15 to 20 minutes and charge per trip — agree the fare, and arrange a pick-up time if you are staying for sunset, because tricycles thin out after dark.',
    notesZh:
      '免费开放，没有大门也不收门票。从爱妮岛镇坐三轮车约 15–20 分钟，按趟计价，先谈好价；如果留下看日落，最好约定回程时间，天黑后路上三轮车会变少。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    openingHours: 'Open access at all hours; bars close around 22:00',
    markerLayer: 'beach',
    discovery: ['beach', 'beachclub', 'highlights'],
    recommendedFor: ['couples', 'sunset', 'photo-spots', 'sunset-drinks'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — tourism=attraction "Las Cabañas Beach", Bulbulungan, El Nido' }],
  },
  {
    id: 'vanilla-beach',
    name: 'Vanilla Beach',
    destinationId: 'palawan',
    areaId: 'las-cabanas',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 11.1456551,
      lng: 119.3958072,
      confidence: 'verified',
      coordNote: 'OSM natural=beach "Vanilla Beach", Bulbulungan, El Nido, Palawan (Photon/OSM lookup, way 9254618).',
    },
    recommendedDurationMin: 120,
    bestTime: 'Late afternoon, when the beach clubs open their day-beds and the sun drops towards Cadlao',
    bestTimeZh: '傍晚，海滩俱乐部摆出躺椅、太阳落向卡德劳岛的时候',
    tags: ['Beach', 'Beach-club', 'Sunset', 'Cocktails', 'Day-beds'],
    tagsZh: ['海滩', '海滩俱乐部', '日落', '鸡尾酒', '躺椅'],
    description:
      'The stretch of the Marimegmeg shoreline that El Nido beach clubs and bars use, mapped in OpenStreetMap as the beach named Vanilla Beach. It sits between Las Cabañas Beach and the zipline launch, so a day here is sand, a day-bed and a bar tab rather than a boat trip, with the same west-facing sunset as the rest of the strip.',
    descriptionZh:
      '马里梅格梅格海岸上被爱妮岛各家海滩俱乐部与酒吧使用的一段，在 OpenStreetMap 中登记为名为 Vanilla Beach 的海滩。它夹在拉斯卡巴纳斯海滩与滑索起点之间，所以在这里的一天是沙滩、躺椅和酒水账单，而不是出海；日落朝向与整条海岸相同，都朝西。',
    notes:
      'The beach itself is free; what you pay for is the day-bed, food and drinks at whichever club you settle into, and minimum spends are common at weekends and in high season. Walk the strip before committing — the clubs differ a lot in price and music.',
    notesZh:
      '海滩本身免费，花钱的是你选中的俱乐部的躺椅、餐饮——周末与旺季常有最低消费。先沿着沙滩走一圈再决定，各家的价位与音乐差别很大。',
    entryFee: 'Free beach; day-beds and food are charged by each beach club',
    entryFeeZh: '海滩免费；躺椅与餐饮由各海滩俱乐部另计',
    openingHours: 'Clubs generally open from late morning until about 22:00',
    markerLayer: 'beach',
    discovery: ['beachclub', 'beach', 'nightlife'],
    recommendedFor: ['couples', 'friends', 'sunset-drinks', 'party'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=beach "Vanilla Beach", Bulbulungan, El Nido' }],
  },
  {
    id: 'el-nido-zipline',
    name: 'El Nido Zipline (Las Cabañas to Depeldet Island)',
    nameZh: '爱妮岛滑索',
    destinationId: 'palawan',
    areaId: 'las-cabanas',
    category: 'activity',
    subcategory: 'zipline',
    coordinates: {
      lat: 11.1443321,
      lng: 119.3968083,
      confidence: 'verified',
      coordNote: 'OSM tourism=attraction "El Nido Zipline westbound", Puerto Princesa North Road, Bulbulungan, El Nido, Palawan (Photon/OSM lookup, node 11808962796). The eastbound landing platform is mapped separately at 11.14576, 119.39043.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Late afternoon, so you cross towards the sunset and land with time to swim before the boat back',
    bestTimeZh: '傍晚时段，可以朝着日落滑过去，落地后还有时间游一会儿再坐船回来',
    tags: ['Zipline', 'Activity', 'Views', 'Depeldet-island', 'Short'],
    tagsZh: ['滑索', '活动', '景观', '德佩尔德特岛', '时间短'],
    description:
      'A roughly 750 m zipline that crosses the channel from the Marimegmeg headland to tiny Depeldet Island, about 4 km south of El Nido town. It is a short, low-commitment activity — a few minutes in the air with the whole Bacuit Bay coastline laid out below — and the landing island has a small beach and snorkelling. Sold as a one-way ride with a boat pick-up from the island, or as a return crossing.',
    descriptionZh:
      '一条约 750 米的滑索，从马里梅格梅格岬角横跨水道飞向小小的德佩尔德特岛，位置在爱妮岛镇以南约 4 公里。它是一项门槛很低的短活动——在空中几分钟，脚下是整条巴奎特湾海岸线——落地的岛上有一小片沙滩可以浮潜。可买单程（岛上坐船回来）或往返。',
    notes:
      'Buy at the platform, not in town; the tariff for a one-way ride and for a return is posted at the counter, and payment is cash. Weight limits apply and the ride is weather-dependent, so it can stop at short notice in high wind.',
    notesZh:
      '在平台现场购票，不要在镇上买；单程与往返的价格都贴在柜台，只收现金。有体重限制，且受天气影响，大风时会临时停运。',
    entryFee: 'Per-person fee for a one-way ride; a discounted return crossing is sold separately (posted at the counter)',
    entryFeeZh: '按人头收单程费用，往返另有优惠价（柜台明码标价）',
    openingHours: 'Daily, roughly 09:00-17:30, weather permitting',
    markerLayer: 'activity',
    discovery: ['highlights', 'water'],
    recommendedFor: ['adventurous', 'family', 'photo-spots', 'half-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — tourism=attraction "El Nido Zipline westbound", Bulbulungan, El Nido' }],
  },
  {
    id: 'corong-corong-sunset-strip',
    name: 'Corong-Corong Sunset Strip (Corong Beach)',
    destinationId: 'palawan',
    areaId: 'corong-corong',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 11.1693053,
      lng: 119.3946814,
      confidence: 'verified',
      coordNote: 'OSM natural=beach "Corong Beach", Bulbulungan, El Nido, Palawan (Photon/OSM lookup, relation 10609669).',
    },
    recommendedDurationMin: 90,
    bestTime: 'Arrive by about 17:00 to get a table on the sand before the sun goes down',
    bestTimeZh: '大约 17:00 前到，才能抢到沙滩上的位子看日落',
    tags: ['Sunset', 'Beach', 'Bars', 'Dinner', 'Walk-from-town'],
    tagsZh: ['日落', '海滩', '酒吧', '晚餐', '可步行抵达'],
    description:
      'The beach along Corong-Corong, on the south-western side of the El Nido headland, is the town sunset spot: a narrow strip of sand with restaurant tables and beanbags set out on it, facing west across Bacuit Bay. The sun drops behind the bay islands here rather than behind the town, which is why the bars along this shore fill up from about 17:00. It is a 15 to 25 minute walk from the town centre.',
    descriptionZh:
      '科隆科隆的海滩在爱妮岛岬角西南侧，是镇上的日落据点：一条窄沙滩，上面摆着餐桌与懒人沙发，正对西面的巴奎特湾。太阳在这里是落到湾中群岛之后，而不是落到镇子后面，所以沿岸酒吧从 17:00 起就坐满。从镇中心步行 15–25 分钟。',
    notes:
      'No entrance fee and no gate. The shore narrows or disappears at high tide, so table positions change with the tide and the best seats go early. Most places take cash only; some ask for a minimum spend for a sunset table.',
    notesZh:
      '不收门票，没有大门。涨潮时岸线变窄甚至消失，桌位会随潮位移动，好位置去晚了就没有。多数店只收现金，部分对日落时段的好位子有最低消费。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    openingHours: 'Open all day; bars and grills run from about 16:00 to 22:00',
    markerLayer: 'beach',
    discovery: ['beach', 'nightlife', 'highlights'],
    recommendedFor: ['couples', 'sunset', 'sunset-drinks', 'photo-spots'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=beach "Corong Beach", Corong-Corong, El Nido' }],
  },
  {
    id: 'el-nido-public-market',
    name: 'El Nido Public Market',
    nameZh: '爱妮岛公共市场',
    destinationId: 'palawan',
    areaId: 'corong-corong',
    category: 'food',
    subcategory: 'market',
    coordinates: {
      lat: 11.1712594,
      lng: 119.3943864,
      confidence: 'verified',
      coordNote: 'OSM amenity=marketplace "El Nido Public Market", Puerto Princesa North Road, Bulbulungan, El Nido, Palawan (Photon/OSM lookup).',
    },
    recommendedDurationMin: 45,
    bestTime: 'Early morning for the fish and produce, or around 17:00 when the grill stalls fire up',
    bestTimeZh: '清早看鱼货与蔬果，或傍晚 17:00 左右烧烤摊开火时',
    tags: ['Market', 'Local-food', 'Fish', 'Cheap-eats', 'Cash-only'],
    tagsZh: ['市场', '本地饮食', '海鲜', '平价小吃', '只收现金'],
    description:
      'The municipal market on the northern edge of El Nido town, on the road towards Corong-Corong, with wet and dry sections: reef fish, squid and shellfish landed locally, plus fruit, vegetables, rice and dry goods. It is where guesthouses and dive-shop crews shop, and the cheapest place in town to eat if you stick to the cooked-food stalls and the grill stands that set up in the evening.',
    descriptionZh:
      '位于爱妮岛镇北缘、通往科隆科隆路上的市政市场，分湿货与干货两区：本地卸货的礁鱼、鱿鱼与贝类，以及水果、蔬菜、米粮与干货。民宿和潜水店都在这里采购；如果只吃熟食摊和傍晚摆出来的烧烤摊，这里是全城最便宜的吃饭处。',
    notes:
      'No entry fee. Bring small notes and a bag; stalls price in cash and rarely have change for large bills. Go early in the day for the best fish, and be aware that the wet section is genuinely wet — this is a working market, not a tourist one.',
    notesZh:
      '不收门票。带小面额现金和购物袋；摊主只收现金，大钞常常找不开。想买好鱼要趁早；湿货区地面真的湿——这里是给本地人用的市场，不是观光市场。',
    entryFee: 'Free to enter',
    entryFeeZh: '免费进入',
    openingHours: 'Daily from about 05:00; the evening grill stalls run until about 21:00',
    markerLayer: 'food',
    discovery: ['food', 'shopping'],
    recommendedFor: ['budget', 'food-lovers', 'family', 'half-day'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — amenity=marketplace "El Nido Public Market", Bulbulungan, El Nido' }],
  },

  /* ----------------------------------------------------------------------- Nacpan area */
  {
    id: 'calitang-beach',
    name: 'Calitang Beach (Twin Beach)',
    destinationId: 'palawan',
    areaId: 'nacpan-beach',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 11.3083429,
      lng: 119.418554,
      confidence: 'verified',
      coordNote: 'OSM natural=beach "Calitang Beach", Calitang, El Nido, Palawan (Photon/OSM lookup) — the bay immediately south of Nacpan, separated from it by a low headland.',
    },
    recommendedDurationMin: 120,
    bestTime: 'Mid-morning before the heat, then stay for the sunset from the headland between the two bays',
    bestTimeZh: '上午中段避开暑气，傍晚再回到两湾之间的岬角看日落',
    tags: ['Beach', 'Twin-beach', 'Viewpoint', 'Quiet', 'Day-trip-from-el-nido'],
    tagsZh: ['海滩', '双生海滩', '观景', '安静', '从爱妮岛出发的一日游'],
    description:
      'The second half of the Nacpan twins: Calitang Beach lies in the next bay south, reached by walking over the narrow neck of land that separates the two. The viewpoint on that neck — a low hill of sand and scrub — is the classic photograph of both bays at once, and because almost everybody stops at Nacpan, the Calitang side stays noticeably emptier.',
    descriptionZh:
      '纳克潘"双生海滩"的另一半：卡利唐海滩在紧邻的南侧海湾，跨过分隔两湾的狭窄沙颈即可到达。沙颈上的小丘是同时拍到两个海湾的经典机位；因为绝大多数人只停在纳克潘，卡利唐这一侧明显更空。',
    notes:
      'Same unsealed access road as Nacpan, with no ATM and no reliable mobile data; the checkpoint conservation fee, when it is collected, covers the Nacpan area rather than each beach separately. There are a handful of shacks and one small resort, and very little shade on the sand.',
    notesZh:
      '与纳克潘共用同一条土路，附近没有 ATM，手机信号也不稳；检查站收的保育费（若在收）覆盖整个纳克潘片区，而不是每片海滩各收一次。沙滩上只有几间棚屋和一家小度假村，遮荫很少。',
    entryFee: 'Free; a barangay conservation fee of about PHP 50 has been reported at the access checkpoint (amount not consistently documented — confirm on arrival)',
    entryFeeZh: '免费；有报道称入口检查站收约 50 比索的村级保育费（金额无一致记录，到场确认）',
    openingHours: 'Open access at all hours; no lifeguards and no night lighting',
    markerLayer: 'beach',
    discovery: ['beach', 'highlights'],
    recommendedFor: ['couples', 'sunset', 'photo-spots', 'quiet'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=beach "Calitang Beach", Calitang, El Nido' }],
  },

  /* ------------------------------------------------------- San Vicente and Port Barton */
  {
    id: 'long-beach-san-vicente',
    name: 'Long Beach, San Vicente',
    destinationId: 'palawan',
    areaId: 'san-vicente-long-beach',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.537896,
      lng: 119.2546895,
      confidence: 'verified',
      coordNote: 'OSM natural=beach "Long Beach", Poblacion, San Vicente, Palawan (Photon/OSM lookup) — about 1.2 km north-east of the San Vicente town point.',
    },
    recommendedDurationMin: 180,
    bestTime: 'Late afternoon for walking and the sunset; the middle of the day is brutally exposed',
    bestTimeZh: '傍晚散步与看日落最好；正午几乎没有遮荫，非常晒',
    tags: ['Beach', 'Long-walk', 'Undeveloped', 'Sunset', 'Quiet'],
    tagsZh: ['海滩', '长距离漫步', '未开发', '日落', '安静'],
    description:
      'The beach in front of San Vicente town, usually described as the longest white-sand beach in the Philippines at roughly 14 km of unbroken sand. Development is minimal — a few small resorts and sari-sari stores set back among the palms — so it is possible to walk for an hour and pass almost nobody. The far ends shade into Poblacion and the road towards Port Barton and Kemdeng.',
    descriptionZh:
      '圣维森特镇前的海滩，常被称为菲律宾最长的白沙滩，约 14 公里连续不断的沙岸。开发程度极低——只有几家小度假村和杂货店退在椰林后面——因此走上一个小时也遇不到几个人。两端分别接上镇区以及通往巴顿港与肯登的公路。',
    notes:
      'No entrance fee and no facilities to speak of: bring water, shade and everything else you need, and take your rubbish back. Swimming is open-ocean with no lifeguards, and the surf picks up in the wet season. A scooter or hired tricycle is effectively required to reach either end.',
    notesZh:
      '不收门票，也基本没有设施：水、遮阳和所需物品全部自带，垃圾也请带走。这里是开阔外海，没有救生员，雨季浪会明显变大。想走到任何一端，实际都需要摩托车或包三轮车。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    openingHours: 'Open access at all hours; no lifeguards',
    markerLayer: 'beach',
    discovery: ['beach', 'highlights'],
    recommendedFor: ['quiet', 'couples', 'budget', 'photo-spots'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — natural=beach "Long Beach", Poblacion, San Vicente, Palawan' }],
  },
  {
    id: 'port-barton-beach-and-village',
    name: 'Port Barton (village and beach)',
    nameZh: '巴顿港',
    destinationId: 'palawan',
    areaId: 'port-barton',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.4114,
      lng: 119.1779622,
      confidence: 'verified',
      coordNote: 'OSM place=village "Port Barton", Palawan, Mimaropa (Photon/OSM lookup, node 589734328) — the village node on the beachfront.',
    },
    recommendedDurationMin: 240,
    bestTime: 'Late afternoon for the village beach; mornings for the island-hopping boats',
    bestTimeZh: '傍晚在村前海滩，上午出海跳岛',
    tags: ['Beach', 'Village', 'Island-hopping', 'Turtle-snorkelling', 'Backpacker'],
    tagsZh: ['海滩', '渔村', '跳岛', '看海龟浮潜', '背包客'],
    description:
      'Port Barton is a fishing village on the west coast of San Vicente municipality where the beach is the main street: guesthouses, dive shops and a handful of restaurants sit directly on the sand, and the boat trips go out to German Island, Exotic Island and the turtle and coral snorkelling spots in the bay. Getting there from Puerto Princesa takes about 3 to 3.5 hours by van over the mountain road, which is exactly why it has stayed small.',
    descriptionZh:
      '巴顿港是圣维森特市镇西海岸的渔村，海滩就是主街：民宿、潜水店和几家餐厅直接建在沙上，出海线路去德国岛、异域岛以及湾内的海龟与珊瑚浮潜点。从公主港走山路面包车约 3 到 3.5 小时——也正因如此，它一直没被开发大。',
    notes:
      'There is no ATM in the village, so arrive with cash for the whole stay. Power and internet are less reliable than on the east coast, and mobile data can drop out entirely. The village beach is shallow and calm for most of the year but has no lifeguards.',
    notesZh:
      '村里没有 ATM，请按整段停留带足现金。电力与网络不如东海岸稳定，手机数据有时完全断掉。村前海滩大部分时间水浅平静，但没有救生员。',
    entryFee: 'Free (island-hopping trips are charged per boat or per seat)',
    entryFeeZh: '免费（跳岛按整船或按位收费）',
    openingHours: 'Open access; boats leave in the morning and are back by late afternoon',
    markerLayer: 'beach',
    discovery: ['beach', 'highlights', 'water'],
    recommendedFor: ['budget', 'solo', 'couples', 'sunset'],
    verificationStatus: 'verified',
    sources: [{ kind: 'geographic', label: 'OpenStreetMap — place=village "Port Barton", San Vicente, Palawan' }],
  },
];
