import type { AreaSeed, HotelSeed, PlaceSeed } from '../../../types';

/**
 * Phu Quoc — records added after the first pass.
 *
 * Kept separate from the original seed files so the records that were already
 * coordinate-verified stay byte-identical, and so a reviewer can see exactly
 * what is new. Every record carries a `coordNote` naming the source it came from.
 *
 * PROVENANCE: coordinates sourced from OpenStreetMap element ids, Wikidata, and
 * official property pages. Nothing here is a guessed map position.
 *
 * HOW THE AREAS RELATE TO THE FIRST-PASS AREAS
 * --------------------------------------------
 * `starter.ts` already ships four deliberately broad sectors — Duong Dong,
 * Long Beach / Bai Truong, "Ong Lang, Cua Can & Ganh Dau", and "An Thoi &
 * Southern Beaches" — each of which bundles several named beaches. The nine
 * areas added here are the individual named places inside and between those
 * sectors: the beaches and villages the brief asked for, each anchored on its
 * own surveyed OSM object rather than on the centre of the sector that contains
 * it. Where an added area necessarily sits inside a broad sector (Vung Bau
 * inside the north-west sector, Bai Sao inside the An Thoi sector) that is
 * stated in its summary rather than hidden.
 *
 * HOTEL INVENTORY — WHY THIS DESTINATION HAS FOUR NEW HOTELS AND NOT NINE
 * ----------------------------------------------------------------------
 * Phu Quoc's open, loyalty-programme inventory is genuinely small, and this file
 * adds every property that exists:
 *   Marriott Bonvoy : JW Marriott Emerald Bay, Sheraton Long Beach   (already in starter.ts)
 *   Hilton Honors   : La Festa Phu Quoc, Curio Collection            (already in starter.ts)
 *   IHG One Rewards : InterContinental Long Beach, Regent Phu Quoc, Crowne Plaza Starbay
 *   World of Hyatt  : Nam Nghi Phu Quoc (The Unbound Collection by Hyatt)
 * There is no GHA DISCOVERY property on the island under any brand in the
 * whitelist (GHA's Vietnam members are Anantara Hoi An / Mui Ne / Quy Nhon,
 * Avani Quy Nhon, Capella Hanoi, Pan Pacific Hanoi and PARKROYAL Serviced
 * Suites Hanoi), and Park Hyatt Phu Quoc is not open — it is taking bookings
 * from March 2027. Conrad Phu Quoc, Hilton Phu Quoc and DoubleTree by Hilton
 * Phu Quoc were signed by Sun Group for the APEC 2027 precinct and are not
 * built. Nothing is included here that is not open today.
 */

export const areas: AreaSeed[] = [
  {
    id: 'duong-to',
    destinationId: 'phu-quoc',
    name: 'Dương Tơ & Southern Bãi Trường (Long Beach south)',
    nameZh: '阳东与长滩南段',
    coordinates: {
      lat: 10.11458,
      lng: 103.98088,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 6968353589 "Bãi Trường Beach" (tourism=attraction, name:en "Bai Truong Beach") at 10.1145774, 103.9808766, retrieved from OSM via the Overpass API — the southern half of Long Beach in Dương Tơ commune.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 3500,
    bestFor: [
      'Resort stays on the quiet southern half of Long Beach',
      'The shortest airport transfer on the island (10–20 minutes)',
      'Large beachfront hotels — InterContinental and Regent are both here',
      'Waterfalls and forest edge at Suối Tranh',
      'Pepper farms, pearl showrooms and fish-sauce works along Đường 30 Tháng 4',
    ],
    bestForZh: [
      '长滩南段安静的度假住宿',
      '全岛最短的机场接驳（10–20分钟）',
      '大型海滨酒店——洲际与丽晶都在这里',
      '陈溪（Suối Tranh）的瀑布与森林边缘',
      '30·4路沿线的胡椒园、珍珠展厅与鱼露作坊',
    ],
    weakFor: [
      'Street-food variety and a nightlife strip — Dương Đông is 15–20 minutes north',
      'Walkable town conveniences; almost everything needs a taxi or scooter',
      'A sense of local village life — this stretch is resort-led',
    ],
    weakForZh: [
      '街头小吃与夜生活街区——需往北15–20分钟到阳东镇',
      '步行可达的城镇便利；出行基本靠出租车或摩托',
      '本地村落生活气息——这一带以度假村为主',
    ],
    scores: { beach: 4, nightlife: 2, food: 3, luxury: 5, nature: 3, accessibility: 5 },
    vibe: 'The airport-adjacent luxury strip on the quiet southern half of Long Beach',
    vibeZh: '紧邻机场的长滩南段高端度假带，安静、离机场最近',
    tagline: 'Resorts · Airport · Waterfalls',
    taglineZh: '度假村 · 机场 · 瀑布',
    summary:
      'Dương Tơ is the commune that owns the southern half of Bãi Trường — Long Beach — the west-facing sand that runs from Phu Quoc International Airport south towards An Thoi. It is the island\'s most convenient upmarket base: the terminal is 10–20 minutes away, the beach looks straight at the sunset, and the big beachfront hotels (InterContinental, Regent and the Accor cluster) sit here rather than in Dương Đông town. Inland, Đường 30 Tháng 4 leads to pepper farms, pearl showrooms and the Suối Tranh stream park.',
    summaryZh:
      '阳东（Dương Tơ）乡拥有长滩（Bãi Trường）南段——从富国国际机场一路向南延伸到安泰的西向沙滩。这里是全岛最便利的高端住宿区：机场10–20分钟车程，沙滩正对日落，洲际、丽晶等大型海滨酒店都在这一带，而不是在阳东镇上。内陆的30·4路通往胡椒园、珍珠展厅与陈溪溪流公园。',
    idealFor: [
      'Luxury and resort travellers',
      'Couples',
      'Families',
      'Short-stay and business travellers',
      'Anyone who wants the airport 15 minutes away',
    ],
    idealForZh: ['奢华与度假型旅客', '情侣', '家庭', '短途与商务旅客', '希望15分钟到机场的旅客'],
    priceTier: '$$$$',
  },
  {
    id: 'bai-sao',
    destinationId: 'phu-quoc',
    name: 'Bãi Sao & the South-East Peninsula',
    nameZh: '白沙滩与东南半岛',
    coordinates: {
      lat: 10.05294,
      lng: 104.03741,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 152287771 "Bãi Sao" (natural=beach, name:en "Sao Beach") centre 10.0529425, 104.0374073, retrieved from OSM via the Overpass API. The first-pass sector "An Thoi & Southern Beaches" contains this bay; this area is the beach and its peninsula on its own.',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 2500,
    bestFor: [
      'The island\'s signature white-sand bay',
      'Day trips out of An Thoi or Dương Tơ',
      'Photography, drone shots and swimming in calm water',
      'Seafood shacks and coconut stalls right on the sand',
      'The Emperor Gia Long temple, on the same peninsula',
    ],
    bestForZh: [
      '全岛最有名的白沙滩海湾',
      '从安泰或阳东出发的一日游',
      '拍照、航拍与平静水域游泳',
      '沙滩上的海鲜小馆与椰子摊',
      '同一半岛上的嘉隆王庙',
    ],
    weakFor: [
      'A wide choice of places to stay — the few hotels here are low-rise and limited',
      'Evening entertainment; everything closes early',
      'Quiet — it is the most-visited beach on the island and is busy from about 10:00 to 16:00',
    ],
    weakForZh: [
      '住宿选择有限——这里只有几家低层酒店',
      '夜间娱乐；天黑后基本收摊',
      '清静——这是全岛游客最多的海滩，约10:00–16:00很拥挤',
    ],
    scores: { beach: 5, nightlife: 1, food: 3, luxury: 2, nature: 3, accessibility: 3 },
    vibe: 'Postcard white-sand bay that fills with day-trippers by mid-morning',
    vibeZh: '明信片级别的白沙滩海湾，上午十点后挤满一日游游客',
    tagline: 'White sand · Day trip · Photography',
    taglineZh: '白沙滩 · 一日游 · 拍照',
    summary:
      'Bãi Sao — Sao Beach — is the crescent of fine white sand on the island\'s south-east coast that every Phu Quoc itinerary names first. The bay is shallow and sheltered, backed by coconut palms and a row of seafood shacks, and the sand at its southern end is quieter than the restaurant strip at the northern end. There are only a handful of low-rise places to sleep here, so it works best as a day trip from An Thoi or Dương Tơ, combined with Kem Beach and the Emperor Gia Long temple on the same peninsula.',
    summaryZh:
      '白沙滩（Bãi Sao）位于富国岛东南海岸，是每个富国岛行程都会提到的细白新月形沙滩。海湾浅而避风，背后是椰林和一排海鲜小馆；南端比北端的餐厅街清静。这里可住宿的低层酒店很少，所以最适合从安泰或阳东过来一日游，与肯沙滩（Bãi Khem）和同半岛的嘉隆王庙一起安排。',
    idealFor: ['Beach lovers', 'Photographers', 'Families with children', 'Day-trippers based in An Thoi or Dương Tơ'],
    idealForZh: ['海滩爱好者', '摄影爱好者', '带小孩的家庭', '以安泰或阳东为据点的游客'],
    priceTier: '$$',
  },
  {
    id: 'vung-bau',
    destinationId: 'phu-quoc',
    name: 'Bãi Dài, Vũng Bầu & the North-West Coast',
    nameZh: '北部长滩、翁保与西北海岸',
    coordinates: {
      lat: 10.30067,
      lng: 103.87781,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 32003768 "Bãi Vũng Bầu" (natural=beach, name:en "Vung Bau Beach") centre 10.3006683, 103.8778109, retrieved from OSM via the Overpass API.',
    },
    isStayBase: true,
    zoneType: 'stay',
    radiusMeters: 4000,
    bestFor: [
      'Quiet beach resorts with long sand and few people',
      'Bãi Dài, the north-western beach the island also calls Long Beach',
      'Sunset dinners and beach bars away from the crowds',
      'Vinpearl Safari, Grand World and VinWonders, 10–20 minutes away',
      'Motorbike exploring of the Cửa Cạn and Gành Dầu road',
    ],
    bestForZh: [
      '人少沙长的安静海滨度假村',
      '北部长滩（Bãi Dài）——当地人同样称它为Long Beach',
      '远离人群的日落晚餐与沙滩酒吧',
      '10–20分钟可达珍珠野生动物园、大世界与珍珠乐园',
      '骑摩托沿弓干（Cửa Cạn）与甘道（Gành Dầu）公路探索',
    ],
    weakFor: [
      'Street food, cafés and supermarkets within walking distance',
      'Public transport; a scooter or a hotel shuttle is effectively required',
      'A swimming beach everywhere — parts of this coast are rocky or shallow at low tide',
    ],
    weakForZh: [
      '步行范围内的街头小吃、咖啡馆与超市',
      '公共交通；基本必须自驾摩托或依靠酒店班车',
      '并非处处适合游泳——这段海岸部分区域多礁石或退潮时很浅',
    ],
    scores: { beach: 4, nightlife: 2, food: 3, luxury: 4, nature: 4, accessibility: 2 },
    vibe: 'Wide, half-empty north-west beaches backed by resorts and pepper farms',
    vibeZh: '西北向的宽阔半空沙滩，背后是度假村与胡椒园',
    tagline: 'Long beach · Resorts · Quiet',
    taglineZh: '长滩 · 度假村 · 清静',
    summary:
      'The north-west coast between Cửa Cạn and Gành Dầu holds the island\'s second long beach — confusingly also called Bãi Dài, or Long Beach — together with the smaller cove at Vũng Bầu. Sand quality is high and density is low: a handful of mid-range and upmarket resorts (Fusion, Nam Nghi, Crowne Plaza Starbay) sit between stretches of empty beach, and the land behind them is pepper farms and forest edge. It is the island\'s best value-for-space base, at the cost of needing your own transport for everything.',
    summaryZh:
      '弓干（Cửa Cạn）到甘道（Gành Dầu）之间的西北海岸拥有全岛第二条长滩——当地也叫Long Beach——以及更小的翁保（Vũng Bầu）海湾。沙质好、密度低：Fusion、Nam Nghi、Crowne Plaza Starbay 等中高端度假村之间夹着大片空沙滩，背后是胡椒园与森林边缘。这里是全岛"人均空间"最划算的住宿区，代价是出行必须有车。',
    idealFor: ['Couples', 'Families with a car or scooter', 'Resort lovers who want quiet', 'Nature and theme-park visitors'],
    idealForZh: ['情侣', '有车或摩托的家庭', '想要清静的度假客', '自然与主题公园游客'],
    priceTier: '$$$',
  },
  {
    id: 'bai-thom',
    destinationId: 'phu-quoc',
    name: 'Bãi Thơm & the North-East Coast',
    nameZh: '白森与东北海岸',
    coordinates: {
      lat: 10.4120064,
      lng: 104.031491,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 13305912482 "Bãi Thơm" (place=quarter) at 10.4120064, 104.031491, retrieved from OSM via the Overpass API and confirmed through scripts/lookup-place.mjs (Photon, OSM-derived) — the Bãi Thơm peninsula at the island\'s northern tip.',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 3000,
    bestFor: [
      'The emptiest beaches on the island',
      'Riding the northern coastal road from Rạch Vẹm to the tip',
      'Views across the strait to Cambodia\'s islands',
      'Cheap, simple seafood at the handful of local quán',
      'Getting away from every other Phu Quoc visitor',
    ],
    bestForZh: [
      '全岛最空旷的海滩',
      '从拉咸（Rạch Vẹm）骑到岛最北端的海岸公路',
      '隔海眺望柬埔寨的岛屿',
      '几家本地小馆的便宜海鲜',
      '完全避开其他游客',
    ],
    weakFor: [
      'Anywhere to stay beyond one small retreat',
      'Restaurants, shops, ATMs or fuel after dark',
      'Public transport and reliable Grab coverage',
    ],
    weakForZh: ['除了一家小型度假村外几乎没有住宿', '天黑后的餐厅、商店、取款机与加油站', '公共交通与稳定的网约车覆盖'],
    scores: { beach: 4, nightlife: 1, food: 2, luxury: 2, nature: 4, accessibility: 1 },
    vibe: 'The island thins out to fishing hamlets and empty sand at its northern tip',
    vibeZh: '岛屿向北收窄成渔村与空沙滩，人迹最少',
    tagline: 'Empty beaches · Coastal road',
    taglineZh: '空沙滩 · 海岸公路',
    summary:
      'Bãi Thơm is the peninsula at Phu Quoc\'s northern tip, where the national park runs down to the water and the settlements are fishing hamlets rather than resorts. The beach that carries the name is long, uncommercial and often almost empty, and the coastal road up from Rạch Vẹm is one of the best short rides on the island. Come for a half-day, not for a base: there is one small retreat here and very little else.',
    summaryZh:
      '白森（Bãi Thơm）是富国岛最北端的半岛，国家公园一路延伸到海边，聚落是渔村而不是度假村。同名的沙滩很长、没有商业化，常常几乎没人；从拉咸（Rạch Vẹm）上来的海岸公路是全岛最舒服的短途骑行之一。适合半日游，不适合作为据点：这里只有一家小型度假村，其余几乎什么都没有。',
    idealFor: ['Scooter riders', 'Travellers who want solitude', 'Photographers', 'Return visitors who have seen the south'],
    idealForZh: ['骑摩托的旅行者', '想图清静的旅行者', '摄影爱好者', '已经玩过南部、再访富国岛的游客'],
    priceTier: '$',
  },
  {
    id: 'rach-vem',
    destinationId: 'phu-quoc',
    name: 'Rạch Vẹm fishing village',
    nameZh: '拉咸渔村',
    coordinates: {
      lat: 10.3648689,
      lng: 103.9336789,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 13305912479 "Rạch Vẹm Gành Dầu" (place=quarter) at 10.3648689, 103.9336789, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 2000,
    bestFor: [
      'The floating seafood restaurants out on the rafts',
      'Starfish Beach, at the northern end of the same bay',
      'A half-day loop with Ganh Dau and Bãi Thơm',
      'Seeing how the island still makes a living from the sea',
      'Cheap, very fresh seafood sold by weight',
    ],
    bestForZh: [
      '建在筏排上的水上海鲜餐厅',
      '同一海湾北端的海星沙滩',
      '与甘道、白森串成半日环线',
      '看到岛上仍以打鱼为生的那一面',
      '按重量计价、便宜又新鲜的海鲜',
    ],
    weakFor: [
      'Overnight stays — only homestays, and few of them',
      'Beach quality; the bay is shallow, muddy at low tide and better for starfish than swimming',
      'Anything open after sunset',
    ],
    weakForZh: ['过夜住宿——只有少数民宿', '沙滩质量；海湾浅、退潮时泥泞，更适合看海星而非游泳', '日落后基本没有营业的店'],
    scores: { beach: 3, nightlife: 1, food: 4, luxury: 1, nature: 4, accessibility: 2 },
    vibe: 'Raft restaurants, starfish and stilt houses where the island still fishes',
    vibeZh: '筏排餐厅、海星与吊脚屋——岛上仍在打鱼的地方',
    tagline: 'Fishing village · Starfish · Seafood',
    taglineZh: '渔村 · 海星 · 海鲜',
    summary:
      'Rạch Vẹm is a working fishing village on the sheltered north coast, strung along a shallow bay where the boats moor and the seafood restaurants are built out over the water on rafts. Its northern end is Starfish Beach, where red starfish are visible in the shallows at low tide — a genuine sight, though the bay is not a swimming beach. It is one of the few places on Phu Quoc where tourism has not replaced the fishing economy, which is exactly why it is worth the drive.',
    summaryZh:
      '拉咸（Rạch Vẹm）是北岸避风海湾里的作业渔村，渔船停靠，海鲜餐厅直接建在水面的筏排上。海湾北端是海星沙滩，退潮时浅水里能看到红色海星——景是真的，但这个海湾不适合游泳。这里是富国岛少数旅游业还没有取代渔业的地方，也正因如此值得专程开一趟。',
    idealFor: ['Seafood eaters', 'Families with children', 'Photographers', 'Travellers with their own transport'],
    idealForZh: ['爱吃海鲜的人', '带小孩的家庭', '摄影爱好者', '自驾的旅行者'],
    priceTier: '$$',
  },
  {
    id: 'cay-sao',
    destinationId: 'phu-quoc',
    name: 'Cây Sao & the East Coast',
    nameZh: '椰星与东海岸',
    coordinates: {
      lat: 10.2629782,
      lng: 104.0772839,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 13305912484 "Cây Sao Hàm Ninh" (place=quarter) at 10.2629782, 104.0772839, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 3000,
    bestFor: [
      'The east coast as it actually is — mangroves, fish traps and mudflats',
      'Riding the quiet Hàm Ninh–Bãi Thơm road',
      'Birdlife and estuary scenery at low tide',
      'A practical half-day add-on to Hàm Ninh',
    ],
    bestForZh: [
      '东海岸真实的样子——红树林、鱼栅与滩涂',
      '骑行安静的涵宁—白森公路',
      '退潮时的水鸟与河口景观',
      '与涵宁搭配的半日行程',
    ],
    weakFor: [
      'Swimming — the east coast is shallow, tidal and not a beach destination',
      'Hotels and restaurants; there are essentially none',
      'Anything to do after heavy rain',
    ],
    weakForZh: ['游泳——东海岸水浅、潮差大，不是海滨目的地', '酒店与餐厅；基本上没有', '大雨之后几乎无事可做'],
    scores: { beach: 1, nightlife: 1, food: 2, luxury: 1, nature: 4, accessibility: 2 },
    vibe: 'Mangrove and fish-trap coast — the island\'s working east side',
    vibeZh: '红树林与鱼栅海岸——岛屿东侧真实的生活面',
    tagline: 'Mangroves · Estuary · Local',
    taglineZh: '红树林 · 河口 · 本地',
    summary:
      'Cây Sao is a coastal hamlet in Hàm Ninh commune on Phu Quoc\'s east side, facing the shallow, tidal water between the island and the mainland. This is not beach country: the shoreline is mangrove, mudflat and fish trap, and the interest is in watching an estuary work — boats, nets and birds — rather than in lying on sand. It makes a good, quiet half-day when paired with Hàm Ninh\'s seafood pier a few kilometres south.',
    summaryZh:
      '椰星（Cây Sao）是富国岛东侧涵宁乡的海边村落，面向岛屿与大陆之间水浅、潮差大的海面。这里不是海滨度假地：岸线是红树林、滩涂和鱼栅，看点是河口的日常——渔船、渔网与水鸟——而不是躺在沙滩上。与南边几公里外的涵宁海鲜码头搭配，是安静舒适的半日行程。',
    idealFor: ['Scooter riders', 'Birdwatchers', 'Photographers', 'Return visitors'],
    idealForZh: ['骑摩托的旅行者', '观鸟爱好者', '摄影爱好者', '再访富国岛的游客'],
    priceTier: '$',
  },
  {
    id: 'ham-ninh',
    destinationId: 'phu-quoc',
    name: 'Hàm Ninh fishing village',
    nameZh: '涵宁渔村',
    coordinates: {
      lat: 10.1804179,
      lng: 104.047472,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 468359782 "Ham Ninh Market" (amenity=supermarket) centre 10.1804179, 104.047472, verified through scripts/lookup-place.mjs — the village market at the centre of Hàm Ninh, on the east coast.',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 2500,
    bestFor: [
      'The seafood pier and market — the reason to come',
      'Steamed crab, sea snails and pearl oysters at local prices',
      'Bãi Vòng ferry terminal, for boats to the mainland',
      'A half-day on the east coast with Cây Sao',
      'Seeing a fishing village that still works for a living',
    ],
    bestForZh: [
      '海鲜码头与市场——来的理由',
      '本地价格的水煮蟹、海螺与珍珠贝',
      '拜翁（Bãi Vòng）渡轮码头，往来大陆',
      '与椰星搭配的东海岸半日行程',
      '看一个仍在靠海为生的渔村',
    ],
    weakFor: [
      'Swimming and sunbathing; the shore is mudflat and shallow',
      'Accommodation and evening life — there is very little of either',
      'Convenience for the rest of the island; it is 30–40 minutes from Duong Dong',
    ],
    weakForZh: [
      '游泳与日光浴；岸边是滩涂且水很浅',
      '住宿与夜生活——两者都很少',
      '去岛内其他地方的便利性；离阳东镇约30–40分钟',
    ],
    scores: { beach: 2, nightlife: 1, food: 5, luxury: 1, nature: 3, accessibility: 2 },
    vibe: 'Working seafood village — a long pier, stacked traps and lunch on the water',
    vibeZh: '还在作业的渔村——长码头、成堆渔具与水上午餐',
    tagline: 'Seafood · Fishing pier · Local',
    taglineZh: '海鲜 · 渔港码头 · 本地',
    summary:
      'Hàm Ninh is the fishing village on Phu Quoc\'s east coast that locals still send you to for seafood. Its pier and market sell crab, sea snails, scallops and pearl oysters landed the same morning, and the row of simple restaurants along the water cooks them to order for a fraction of what the resort strip charges. The shore is mudflat rather than beach, and the village is a working one, so come for lunch and leave before the light goes.',
    summaryZh:
      '涵宁（Hàm Ninh）是富国岛东海岸的渔村，本地人至今仍推荐来这里吃海鲜。码头和市场卖当天早上上岸的螃蟹、海螺、扇贝与珍珠贝，沿岸一排简朴的餐厅现点现做，价格只有度假区的一小部分。岸边是滩涂而不是沙滩，村子仍在作业，所以适合来吃午饭，天黑前离开。',
    idealFor: ['Seafood eaters', 'Budget travellers', 'Travellers heading to the mainland by ferry', 'Photographers'],
    idealForZh: ['爱吃海鲜的人', '预算型旅行者', '要坐船去大陆的旅客', '摄影爱好者'],
    priceTier: '$',
  },
  {
    id: 'national-park-interior',
    destinationId: 'phu-quoc',
    name: 'Phu Quoc National Park interior',
    nameZh: '富国国家公园腹地',
    coordinates: {
      lat: 10.3282981,
      lng: 104.0246367,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap relation 15835921 "Phu Quoc National Park" (boundary=national_park, leisure=nature_reserve) at 10.3282981, 104.0246367, verified through scripts/lookup-place.mjs (Photon, OSM-derived). The first-pass place record "Phu Quoc National Park" carries the park\'s Wikipedia point; this area is the forest interior itself.',
    },
    isStayBase: false,
    zoneType: 'day-trip',
    radiusMeters: 6000,
    bestFor: [
      'Forest trekking — the Tiên Sơn Đỉnh ridge trail',
      'Birdlife, butterflies and lowland evergreen forest',
      'Escape from the heat and the crowds of the coast',
      'Views over the island from the ridge',
    ],
    bestForZh: [
      '森林徒步——仙山岭（Tiên Sơn Đỉnh）山脊步道',
      '鸟类、蝴蝶与低地常绿林',
      '躲开海岸的炎热与人潮',
      '从山脊俯瞰全岛',
    ],
    weakFor: [
      'Independent hiking without a guide — trails are not signposted to international standards',
      'Wet-season visits; the red-earth tracks are slippery and leeches are a real nuisance',
      'Anyone without their own transport: there is no public access to the trailheads',
    ],
    weakForZh: [
      '无向导的独立徒步——步道标识未达国际标准',
      '雨季前往；红土路湿滑，蚂蟥确实恼人',
      '没有自驾的人：登山口没有任何公共交通',
    ],
    scores: { beach: 1, nightlife: 1, food: 1, luxury: 1, nature: 5, accessibility: 1 },
    vibe: 'Dense lowland rainforest over the island\'s spine, reached on foot only',
    vibeZh: '覆盖岛屿脊背的茂密低地雨林，只能靠双脚进入',
    tagline: 'Rainforest · Trekking · Wildlife',
    taglineZh: '雨林 · 徒步 · 野生动物',
    summary:
      'Phu Quoc National Park protects roughly 70% of the island and the largest remaining tract of lowland evergreen forest in southern Vietnam; it forms the core of the Kiên Giang Biosphere Reserve and shelters the ridge that runs north from Duong Dong to the island\'s tip. The interior is walked, not driven: the main objective is the Tiên Sơn Đỉnh trail, a steep half-day climb through bamboo and broadleaf forest to a ridge-top viewpoint. Trails are rough and unsigned, so most visitors go with a guide or join a trek.',
    summaryZh:
      '富国国家公园保护着全岛约70%的面积，也是越南南部现存最大的低地常绿林，构成坚江生物圈保护区的核心，并覆盖从阳东镇向北延伸到岛最北端的山脊。腹地只能徒步：主要目标是仙山岭（Tiên Sơn Đỉnh）步道，穿越竹林与阔叶林，陡峭攀爬到山脊观景点，约需半天。路径原始且缺乏标识，多数游客会请向导或参加徒步团。',
    idealFor: ['Hikers', 'Nature lovers', 'Birdwatchers', 'Fit travellers with their own transport'],
    idealForZh: ['徒步爱好者', '自然爱好者', '观鸟爱好者', '体力好且有自驾的旅行者'],
    priceTier: '$',
  },
  {
    id: 'an-thoi-archipelago',
    destinationId: 'phu-quoc',
    name: 'An Thoi Archipelago & the Southern Islands',
    nameZh: '安泰群岛与南部小岛',
    coordinates: {
      lat: 9.95432,
      lng: 104.01784,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 10703551 "Hòn Thơm | Pineapple Island" (place=island) centre 9.95432, 104.01784, retrieved from OSM via the Overpass API — Hòn Thơm, the largest island of the An Thoi group.',
    },
    isStayBase: false,
    zoneType: 'island',
    radiusMeters: 5000,
    bestFor: [
      'The Hon Thom cable car and Sun World Hon Thom / Aquatopia',
      'Island-hopping boat trips through the An Thoi group',
      'Snorkelling and diving over the reefs south of the main island',
      'Beaches at Bãi Trào and the Hon Thom shoreline',
      'Boat days out of An Thoi port',
    ],
    bestForZh: [
      '香岛（Hòn Thơm）缆车与太阳世界香岛／Aquatopia水上乐园',
      '穿越安泰群岛的跳岛船游',
      '主岛以南礁石区的浮潜与潜水',
      'Bãi Trào 与香岛岸边的沙滩',
      '从安泰港出发的出海一日',
    ],
    weakFor: [
      'Overnight stays — there is no hotel inventory of any kind on these islands',
      'Independent travel; you go by cable car, by tour boat or not at all',
      'Anything to do in bad weather — the crossings are suspended',
    ],
    weakForZh: ['过夜住宿——这些小岛上完全没有酒店', '独立出行；只能坐缆车、跟船，否则去不了', '天气差时无事可做——渡运会停航'],
    scores: { beach: 4, nightlife: 1, food: 2, luxury: 2, nature: 5, accessibility: 2 },
    vibe: 'A scatter of pine-covered islands, reefs and one very long cable car',
    vibeZh: '松林小岛、礁石与一条极长缆车组成的群岛',
    tagline: 'Island hopping · Snorkelling · Cable car',
    taglineZh: '跳岛 · 浮潜 · 缆车',
    summary:
      'The An Thoi archipelago is the chain of small islands running south from An Thoi town — Hòn Thơm, Hòn Rỏi, Hòn Dừa, Hòn Dăm and a dozen more — reached either by the record-length Hon Thom cable car or by tour boat from An Thoi port. The draw is the water: shallow reefs for snorkelling, clear bays for swimming, and the Aquatopia water park and Sun World complex on Hòn Thơm itself. Nothing here is residential, so it is a day-out rather than a place to stay.',
    summaryZh:
      '安泰群岛是从安泰镇向南延伸的一串小岛——香岛（Hòn Thơm）、Hòn Rỏi、Hòn Dừa、Hòn Dăm 等十余座——可以乘坐创纪录的香岛跨海缆车，或从安泰港跟团船前往。核心是水：适合浮潜的浅礁、适合游泳的清湾，以及香岛上的 Aquatopia 水上乐园与太阳世界园区。岛上没有常住居民，所以这是一日游而不是住宿地。',
    idealFor: ['Families with children', 'Snorkellers and divers', 'Cable-car riders', 'Day-trippers from An Thoi'],
    idealForZh: ['带小孩的家庭', '浮潜与潜水爱好者', '想坐缆车的人', '从安泰出发的一日游游客'],
    priceTier: '$$$',
  },
];

export const hotels: HotelSeed[] = [
  {
    id: 'intercontinental-phu-quoc-long-beach-resort',
    name: 'InterContinental Phu Quoc Long Beach Resort',
    nameZh: '富国岛长滩洲际度假酒店',
    destinationId: 'phu-quoc',
    areaId: 'duong-to',
    hotelGroup: 'ihg',
    brand: 'InterContinental',
    brandId: 'intercontinental',
    coordinates: {
      lat: 10.1126352,
      lng: 103.983524,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap relation 20369635 "InterContinental Phu Quoc Long Beach Resort" (tourism=hotel, brand=InterContinental), Đường tỉnh 975, at 10.1126352, 103.983524, retrieved from OSM via the Overpass API and confirmed through scripts/lookup-place.mjs.',
    },
    priceTier: '$$$$',
    priceTierBasis:
      'Luxury positioning — InterContinental is IHG\'s luxury tier and this is a beachfront flagship on Long Beach. Derived from brand positioning, not a live rate.',
    propertyType: 'Luxury Resort',
    tags: ['Luxury', 'Beach', 'Resort', 'Family', 'Couple'],
    beachAccess: 'excellent',
    beachAccessNote: 'Beachfront on the southern half of Long Beach (Bãi Trường) at Dương Tơ, with direct sand access from the resort.',
    airportTransfer: { toAirportId: 'phu-quoc-international-airport', minutesMin: 10, minutesMax: 20, confidence: 'approximate' },
    description:
      'The InterContinental is the anchor luxury property on Long Beach, set on the west-facing sand at Dương Tơ about 15 minutes from the airport. It is a full-service resort — multiple restaurants and bars, a large pool deck, a spa and extensive family facilities — and its position on the southern half of the beach means sunsets over the Gulf of Thailand are unobstructed.',
    descriptionZh:
      '富国岛长滩洲际度假酒店是长滩一带的旗舰奢华物业，坐落在阳东面向西边的沙滩上，距机场约15分钟。它是全服务型度假村：多间餐厅与酒吧、大型泳池区、水疗中心以及完善的亲子设施；位于长滩南段，正对泰国湾，日落毫无遮挡。',
    loyaltyProgramme: 'IHG One Rewards',
    officialUrl: 'https://www.ihg.com/intercontinental/hotels/us/en/phu-quoc/pqccp/hoteldetail',
  },
  {
    id: 'regent-phu-quoc',
    name: 'Regent Phu Quoc',
    nameZh: '富国岛丽晶酒店',
    destinationId: 'phu-quoc',
    areaId: 'duong-to',
    hotelGroup: 'ihg',
    brand: 'Regent',
    brandId: 'regent',
    coordinates: {
      lat: 10.10989,
      lng: 103.982844,
      confidence: 'verified',
      coordNote:
        'Wikidata Q117326320 "Regent Phu Quoc" (hotel in Phu Quoc City, Vietnam), property P625 = 10.10989, 103.982844 — https://www.wikidata.org/wiki/Q117326320 . There is no OpenStreetMap object for this property, so the Wikidata coordinate is the source of record.',
    },
    priceTier: '$$$$',
    priceTierBasis:
      'Ultra-luxury positioning — Regent is IHG\'s ultra-luxury tier and this is its Vietnam beach resort. Derived from brand positioning, not a live rate.',
    propertyType: 'Luxury Resort',
    tags: ['Luxury', 'Beach', 'Resort', 'Couple', 'Family'],
    beachAccess: 'excellent',
    beachAccessNote: 'Beachfront on Long Beach (Bãi Trường) at Dương Tơ, immediately north of the InterContinental.',
    airportTransfer: { toAirportId: 'phu-quoc-international-airport', minutesMin: 10, minutesMax: 20, confidence: 'approximate' },
    description:
      'Regent Phu Quoc brought IHG\'s ultra-luxury Regent brand to Vietnam when it opened on Long Beach at Dương Tơ. The resort is built around suites and pool villas with a strong garden-and-water design, and it sits on the same west-facing sand as the InterContinental — close enough to the airport for a short transfer, far enough from Duong Dong to be quiet.',
    descriptionZh:
      '富国岛丽晶酒店把洲际集团旗下超奢品牌丽晶带到越南，坐落于阳东的长滩。度假村以套房与泳池别墅为主，强调庭院与水的设计，与洲际共享同一段西向沙滩；离机场很近，接驳时间短，同时远离阳东镇的喧闹。',
    loyaltyProgramme: 'IHG One Rewards',
    officialUrl: 'https://phuquoc.regenthotels.com/',
  },
  {
    id: 'crowne-plaza-phu-quoc-starbay',
    name: 'Crowne Plaza Phu Quoc Starbay',
    nameZh: '富国岛星湾皇冠假日酒店',
    destinationId: 'phu-quoc',
    areaId: 'vung-bau',
    hotelGroup: 'ihg',
    brand: 'Crowne Plaza',
    brandId: 'crowne-plaza',
    coordinates: {
      lat: 10.3170258,
      lng: 103.8578219,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 13666733201 (tourism=hotel, name "Crowne Plaza", addr:street "Địa Trung Hải 3", Grand World Phú Quốc) at 10.3170258, 103.8578219, verified through scripts/lookup-place.mjs. Wikidata Q117326321 "Crowne Plaza Phu Quoc Starbay" gives 10.317195, 103.857118 for the same property.',
    },
    priceTier: '$$$',
    priceTierBasis:
      'Upper-upscale positioning — Crowne Plaza is IHG\'s upper-upscale full-service tier. Derived from brand positioning, not a live rate.',
    propertyType: 'Beach Resort',
    tags: ['Beach', 'Resort', 'Family', 'Couple'],
    beachAccess: 'excellent',
    beachAccessNote: 'Beachfront on the north-western Long Beach (Bãi Dài) beside the Grand World complex at Gành Dầu.',
    airportTransfer: { toAirportId: 'phu-quoc-international-airport', minutesMin: 45, minutesMax: 60, confidence: 'approximate' },
    description:
      'Crowne Plaza Phu Quoc Starbay sits on the long north-western beach at Gành Dầu, next to the Grand World and VinWonders complex. It is the island\'s most practical full-service choice for families who want theme parks and a beach in the same trip: large rooms, a big pool, and a quieter, less developed shoreline than Long Beach proper.',
    descriptionZh:
      '富国岛星湾皇冠假日酒店位于甘道（Gành Dầu）的西北长滩（Bãi Dài）上，紧邻大世界与珍珠乐园建筑群。对想在同一趟行程里兼顾主题公园与海滩的家庭来说，这是全岛最实用的全服务选择：客房面积大、泳池宽阔，海岸线比正长滩更安静、开发更少。',
    loyaltyProgramme: 'IHG One Rewards',
    officialUrl: 'https://phuquoc.crowneplaza.com/',
  },
  {
    id: 'nam-nghi-phu-quoc',
    name: 'Nam Nghi Phu Quoc',
    nameZh: '富国岛南义度假村',
    destinationId: 'phu-quoc',
    areaId: 'vung-bau',
    hotelGroup: 'hyatt',
    brand: 'The Unbound Collection by Hyatt',
    brandId: 'unbound-collection',
    coordinates: {
      lat: 10.3039378,
      lng: 103.8609159,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 7350403781 "Nam Nghi Phu Quoc" (tourism=resort), Cua Can Commune, at 10.3039378, 103.8609159, verified through scripts/lookup-place.mjs. Wikidata Q117325981 "Nam Nghi Resort" gives 10.3032, 103.861 for the same property.',
    },
    priceTier: '$$$$',
    priceTierBasis:
      'Luxury positioning — The Unbound Collection by Hyatt is World of Hyatt\'s luxury soft-brand tier. Derived from brand positioning, not a live rate.',
    propertyType: 'Luxury Resort',
    tags: ['Luxury', 'Beach', 'Resort', 'Couple', 'Nature'],
    beachAccess: 'good',
    beachAccessNote: 'Private cove beach on the Cửa Cạn / Vũng Bầu coast, reached by a short walk or buggy from the villas; parts of the shoreline are rocky.',
    airportTransfer: { toAirportId: 'phu-quoc-international-airport', minutesMin: 45, minutesMax: 60, confidence: 'approximate' },
    description:
      'Nam Nghi Phu Quoc occupies its own cove on the quiet north-west coast between Cửa Cạn and Vũng Bầu, and joined The Unbound Collection by Hyatt — the group\'s soft brand for individually designed hotels — making it the island\'s only World of Hyatt property. It is a low-rise, villa-led resort with a private beach and a reputation for seclusion rather than scene.',
    descriptionZh:
      '富国岛南义度假村独占弓干（Cửa Cạn）与翁保（Vũng Bầu）之间西北海岸的一个海湾，并加入凯悦"臻选酒店"（The Unbound Collection by Hyatt）——集团为独立设计酒店设立的软品牌——因此是富国岛唯一的凯悦天地成员酒店。以低层别墅为主，拥有私家沙滩，主打清静而非热闹。',
    loyaltyProgramme: 'World of Hyatt',
  },
];

export const places: PlaceSeed[] = [
  // -------------------------------------------------------------------------
  // Beaches
  // -------------------------------------------------------------------------
  {
    id: 'bai-dai-north-west',
    name: 'Bãi Dài (North-West Long Beach)',
    destinationId: 'phu-quoc',
    areaId: 'vung-bau',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.33447,
      lng: 103.84897,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 451452488 "Bãi Dài | Dai Beach" (natural=beach) centre 10.3344687, 103.8489704, retrieved from OSM via the Overpass API.',
    },
    recommendedDurationMin: 120,
    bestTime: 'Late morning to sunset; the beach faces west, so the light and the sunset are the point',
    bestTimeZh: '上午后段到日落；沙滩朝西，光线与日落才是重点',
    tags: ['Beach', 'Swimming', 'Sunset', 'Family friendly', 'Quiet'],
    tagsZh: ['海滩', '游泳', '日落', '适合家庭', '清静'],
    description:
      'Bãi Dài is the north-western beach on the Gành Dầu / Cửa Cạn coast — the island\'s second "Long Beach" and the one most travellers never reach. It is long, west-facing and lightly developed, with the Grand World resort cluster at its northern end and empty sand in between.',
    descriptionZh:
      'Bãi Dài 是甘道（Gành Dầu）／弓干（Cửa Cạn）海岸上的西北向沙滩——岛上的第二条"长滩"，也是多数游客不会到的那一条。沙滩很长、朝西、开发程度低，北端是大世界度假建筑群，中间则是空沙滩。',
    notes:
      'Public beach with free access. The sand is at its best in the dry season (November–April); in the wet season the north-west swell moves sand around and the water gets murky.',
    notesZh: '公共海滩，免费进入。旱季（11月至次年4月）沙质最佳；雨季西北向涌浪会搬动沙子，水也变浑。',
    entryFee: 'Free (public beach)',
    entryFeeZh: '免费（公共海滩）',
    markerLayer: 'beach',
    discovery: ['beach', 'highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 451452488 (natural=beach)', url: 'https://www.openstreetmap.org/way/451452488', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'bai-ong-lang',
    name: 'Bãi Ông Lăng (Ong Lang Beach)',
    destinationId: 'phu-quoc',
    areaId: 'ong-lang-cua-can-ganh-dau',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.25739,
      lng: 103.93671,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 451452489 "Bãi Ông Lăng | Ong Lang Beach" (natural=beach) centre 10.2573867, 103.9367056, retrieved from OSM via the Overpass API. The first-pass area "Ong Lang, Cua Can & Ganh Dau" is anchored on this same beach.',
    },
    recommendedDurationMin: 120,
    bestTime: 'All day in the dry season; late afternoon for the sunset and the beach bars',
    bestTimeZh: '旱季全天皆可；傍晚看日落与沙滩酒吧最合适',
    tags: ['Beach', 'Swimming', 'Sunset', 'Snorkelling', 'Resorts', 'Mid-range'],
    tagsZh: ['海滩', '游泳', '日落', '浮潜', '度假村', '中端'],
    description:
      'Ong Lang is the relaxed cove between Duong Dong and the north-west coast, and the island\'s traditional mid-range beach: sand, a scatter of bungalow resorts and beach bars, and far less traffic than Long Beach. The water is calm for most of the year and the reef just offshore is one of the island\'s accessible snorkelling spots.',
    descriptionZh:
      '翁朗（Ông Lăng）是阳东镇与西北海岸之间的悠闲海湾，也是岛上传统的中端海滩：沙滩、成片的平房度假村与沙滩酒吧，人流远少于长滩。全年大部分时间海面平静，近岸礁石是岛上方便的浮潜点之一。',
    notes:
      'Free public access. The beach is not continuous — small rocks and resort boundaries break it up, so walk in from the lane closest to where you are staying.',
    notesZh: '免费开放。沙滩并不连续，礁石与度假村边界会把沙滩切断，从离住处最近的小路走下去即可。',
    entryFee: 'Free (public beach)',
    entryFeeZh: '免费（公共海滩）',
    markerLayer: 'beach',
    discovery: ['beach', 'water'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 451452489 (natural=beach)', url: 'https://www.openstreetmap.org/way/451452489', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'bai-ganh-dau',
    name: 'Bãi Gành Dầu (Ganh Dau Beach)',
    destinationId: 'phu-quoc',
    areaId: 'ong-lang-cua-can-ganh-dau',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.37605,
      lng: 103.85569,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 404529508 "Bãi Gành Dầu | Ganh Dau Beach" (natural=beach) centre 10.3760541, 103.8556872, retrieved from OSM via the Overpass API.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Late afternoon for the sunset; the cape looks west across the Gulf of Thailand',
    bestTimeZh: '傍晚看日落；海角正对西面的泰国湾',
    tags: ['Beach', 'Sunset', 'Village', 'Seafood', 'Quiet'],
    tagsZh: ['海滩', '日落', '渔村', '海鲜', '清静'],
    description:
      'Ganh Dau is the beach at the island\'s north-western cape, next to the fishing village and market of the same name. Development here is recent and clustered — the Grand World complex sits inland — but the sand itself is still a village beach, with boats, nets and a handful of seafood restaurants looking west towards Cambodia.',
    descriptionZh:
      '甘道（Gành Dầu）沙滩位于岛西北海角，紧邻同名渔村与市场。这一带开发较新且集中——大世界建筑群在内陆——但沙滩本身仍是村民的海滩：渔船、渔网，以及几家面向西边、可望见柬埔寨的海鲜餐厅。',
    notes:
      'The village market and the seafood market are a few hundred metres inland; buy there and some of the restaurants will cook it for you. Sunsets over the water are the main draw.',
    notesZh: '村市场与海鲜市场在向内陆几百米处；在那里买好海鲜，部分餐厅可以代加工。水上日落是主要看点。',
    entryFee: 'Free (public beach)',
    entryFeeZh: '免费（公共海滩）',
    markerLayer: 'beach',
    discovery: ['beach', 'food'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 404529508 (natural=beach)', url: 'https://www.openstreetmap.org/way/404529508', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'bai-vung-bau',
    name: 'Bãi Vũng Bầu (Vung Bau Beach)',
    destinationId: 'phu-quoc',
    areaId: 'vung-bau',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.30067,
      lng: 103.87781,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 32003768 "Bãi Vũng Bầu | Vung Bau Beach" (natural=beach) centre 10.3006683, 103.8778109, retrieved from OSM via the Overpass API.',
    },
    recommendedDurationMin: 120,
    bestTime: 'Dry season (November–April), from late morning through sunset',
    bestTimeZh: '旱季（11月至次年4月），上午后段到日落',
    tags: ['Beach', 'Sunset', 'Snorkelling', 'Resorts', 'Quiet'],
    tagsZh: ['海滩', '日落', '浮潜', '度假村', '清静'],
    description:
      'Vũng Bầu is the small, well-shaped bay on the north-west coast between Cửa Cạn and Gành Dầu, a few minutes north of Ong Lang. It is one of the island\'s prettier low-key beaches — fringed with palms, fronted by a handful of resorts including Fusion and Nam Nghi, and rarely busy because it is a 40-minute drive from Duong Dong.',
    descriptionZh:
      '翁保（Vũng Bầu）是西北海岸弓干与甘道之间的小型优良海湾，在翁朗以北几分钟车程。它是岛上清静而漂亮的沙滩之一：椰林环绕，前面是 Fusion、Nam Nghi 等几家度假村；因为距阳东镇约40分钟车程，游客一直不多。',
    notes:
      'Public access via the lanes between the resorts. Some stretches in front of resorts are reserved for guests; ask before settling on a lounger.',
    notesZh: '从度假村之间的小路可进入公共沙滩。部分度假村正前方的沙滩留给住客，坐躺椅前先询问。',
    entryFee: 'Free (public beach; resort-front sections are for guests)',
    entryFeeZh: '免费（公共海滩；度假村前方区域归住客使用）',
    markerLayer: 'beach',
    discovery: ['beach', 'water'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 32003768 (natural=beach)', url: 'https://www.openstreetmap.org/way/32003768', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'bai-rach-vem',
    name: 'Bãi Rạch Vẹm (Rach Vem Beach)',
    destinationId: 'phu-quoc',
    areaId: 'rach-vem',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.38602,
      lng: 103.94166,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 451772442 "Bãi Rạch Vẹm | Rach Vem Beach" (natural=beach) centre 10.3860167, 103.9416585, retrieved from OSM via the Overpass API.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Low tide, when the starfish are visible in the shallows; morning is best for the crossing from Ganh Dau',
    bestTimeZh: '退潮时浅水可见海星；从甘道过来上午最好',
    tags: ['Beach', 'Starfish', 'Fishing village', 'Seafood', 'Quiet'],
    tagsZh: ['海滩', '海星', '渔村', '海鲜', '清静'],
    description:
      'Bãi Rạch Vẹm is the shallow bay on Phu Quoc\'s north coast at the mouth of the Rạch Vẹm river, and it is best known for the red starfish that show up in the shallows at low tide. The village behind it still fishes, and the raft restaurants over the water are the reason most people make the drive.',
    descriptionZh:
      'Bãi Rạch Vẹm 是富国岛北岸、拉咸河口处的浅水海湾，最有名的是退潮时浅水中的红色海星。背后的村子仍在打鱼，建在水上的筏排餐厅是多数人专程开车过来的原因。',
    notes:
      'Do not lift starfish out of the water — they are alive, and handling them is the main threat to the population. The bay is not a swimming beach: it is shallow and muddy underfoot at low tide.',
    notesZh: '不要将海星捞出水面——它们是活物，触摸是这一种群最大的威胁。这里不适合游泳：水浅，退潮时脚下是泥。',
    entryFee: 'Free (public beach)',
    entryFeeZh: '免费（公共海滩）',
    markerLayer: 'beach',
    discovery: ['beach', 'nature'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 451772442 (natural=beach)', url: 'https://www.openstreetmap.org/way/451772442', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'thom-beach',
    name: 'Bãi Thơm (Thom Beach)',
    destinationId: 'phu-quoc',
    areaId: 'bai-thom',
    category: 'beach',
    subcategory: 'beach',
    coordinates: {
      lat: 10.40845,
      lng: 104.04834,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 153999648 "Thom Beach" (natural=beach) centre 10.4084523, 104.0483427, retrieved from OSM via the Overpass API; confirmed through scripts/lookup-place.mjs at 10.4093160, 104.0460141 (Photon, OSM-derived).',
    },
    recommendedDurationMin: 120,
    bestTime: 'Morning to early afternoon; the bay faces east, so it loses the sun early',
    bestTimeZh: '上午到下午初段；海湾朝东，太阳落得早',
    tags: ['Beach', 'Swimming', 'Quiet', 'Fishing village', 'Off the beaten track'],
    tagsZh: ['海滩', '游泳', '清静', '渔村', '冷门'],
    description:
      'Thom Beach is the long, largely empty beach on the Bãi Thơm peninsula at Phu Quoc\'s northern tip, where the national park forest meets the water. There is almost no development — a couple of local seafood places and one retreat — and on a weekday you may have the sand to yourself.',
    descriptionZh:
      '白森沙滩（Thom Beach）位于富国岛最北端的白森半岛，是一条很长、基本空置的沙滩，国家公园的森林一直延伸到海边。这里几乎没有开发——只有几家本地海鲜店和一家度假村——平日沙滩上可能只有你自己。',
    notes:
      'Getting here means the northern coastal road from Rạch Vẹm; the last stretch is narrow and unlit, so do not plan to ride back after dark. Bring water — there are no shops.',
    notesZh: '前往需要走从拉咸（Rạch Vẹm）上来的北部海岸公路；最后一段路窄且无路灯，不要计划天黑后骑回去。自带饮水——沿途没有商店。',
    entryFee: 'Free (public beach)',
    entryFeeZh: '免费（公共海滩）',
    markerLayer: 'beach',
    discovery: ['beach', 'nature'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 153999648 (natural=beach)', url: 'https://www.openstreetmap.org/way/153999648', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Nature
  // -------------------------------------------------------------------------
  {
    id: 'suoi-tranh',
    name: 'Suối Tranh (Suoi Tranh Stream & Waterfall Park)',
    destinationId: 'phu-quoc',
    areaId: 'duong-to',
    category: 'nature',
    subcategory: 'waterfall',
    coordinates: {
      lat: 10.17669,
      lng: 104.01272,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 7111494204 "Khu du lịch Suối Tranh" (tourism=attraction) at 10.1766943, 104.0127229, retrieved from OSM via the Overpass API.',
    },
    recommendedDurationMin: 120,
    bestTime: 'Wet season and just after rain (May–October) for real water; the dry-season trickle is disappointing',
    bestTimeZh: '雨季及雨后（5–10月）水量才好；旱季只剩细流，容易失望',
    tags: ['Waterfall', 'Stream', 'Forest', 'Family friendly', 'Picnic'],
    tagsZh: ['瀑布', '溪流', '森林', '适合家庭', '野餐'],
    description:
      'Suối Tranh is the stream and small waterfall park in the forested interior at Dương Tơ, about 15 minutes inland from the Long Beach resort strip. A shaded path follows the water up through rocks and boulders to a modest cascade; the site is run as a low-key attraction with a picnic area rather than as a major waterfall.',
    descriptionZh:
      '陈溪（Suối Tranh）是阳东内陆森林中的溪流与小瀑布景区，距长滩度假带约15分钟车程。一条有树荫的步道溯溪而上，穿过岩石与巨石到达一处不大的瀑布；这里以低强度景区的方式运营，有野餐区，而不是大瀑布。',
    notes:
      'Small admission and motorbike parking charge collected at the gate. Wear shoes with grip — the rocks are slippery — and expect mosquitoes.',
    notesZh: '入口收取少量门票与摩托停车费。穿防滑鞋——石头很滑——并注意防蚊。',
    entryFee: 'Small admission charge (paid at the gate)',
    entryFeeZh: '少量门票（现场购票）',
    openingHours: 'Daylight hours, roughly 07:00–17:00',
    markerLayer: 'nature',
    discovery: ['nature', 'water'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 7111494204 (tourism=attraction)', url: 'https://www.openstreetmap.org/node/7111494204', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'tien-son-dinh',
    name: 'Tiên Sơn Đỉnh (Tien Son Dinh summit)',
    destinationId: 'phu-quoc',
    areaId: 'national-park-interior',
    category: 'nature',
    subcategory: 'viewpoint',
    coordinates: {
      lat: 10.1817,
      lng: 104.02561,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 7148312785 "Tiên Sơn Đỉnh | Tiên Sơn Đỉnh - good viewpoint" (tourism=viewpoint) at 10.1816975, 104.0256142, retrieved from OSM via the Overpass API.',
    },
    recommendedDurationMin: 240,
    bestTime: 'Start at first light (05:30–06:30) to climb before the heat; dry season November–April',
    bestTimeZh: '天刚亮就出发（05:30–06:30）以避开高温；宜在旱季11月至次年4月',
    tags: ['Hiking', 'Viewpoint', 'Forest', 'Sunrise', 'National park'],
    tagsZh: ['徒步', '观景点', '森林', '日出', '国家公园'],
    description:
      'Tiên Sơn Đỉnh is the walkable summit of the national park ridge above Hàm Ninh, reached on a steep forest trail that begins off the eastern approach road. The reward is a clearing on the ridge with a wide view back over the island and the sea — the best hiking objective on Phu Quoc, and the reason most guided treks exist.',
    descriptionZh:
      '仙山岭（Tiên Sơn Đỉnh）是涵宁上方国家公园山脊上可以徒步到达的山顶，从东侧上山公路旁的陡峭森林步道进入。回报是山脊上的一片开阔地，可俯瞰全岛与大海——富国岛最好的徒步目标，也是多数向导徒步团存在的原因。',
    notes:
      'Roughly 2–3 hours up and down, steep and humid, with no signage and no water on the way. Go with a guide or a local if you are not confident navigating; mobile coverage is patchy in the forest.',
    notesZh: '上下山约2–3小时，坡陡湿闷，沿途无标识也无补水点。若没有把握认路，请请向导或本地人同行；森林中手机信号不稳。',
    entryFee: 'Free (a guide, if hired, is the only cost)',
    entryFeeZh: '免费（若请向导，向导费是唯一支出）',
    markerLayer: 'nature',
    activity: {
      kind: 'hike',
      difficulty: 'hard',
      weatherDependency: 'high',
      reservationRecommended: false,
      transportContext: 'Ride to the trailhead off the Hàm Ninh approach road, about 30 minutes from Duong Dong; the last section is unsurfaced.',
      transportContextZh: '骑到涵宁上山公路旁的登山口，距阳东镇约30分钟；最后一段是土路。',
    },
    discovery: ['nature', 'highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 7148312785 (tourism=viewpoint)', url: 'https://www.openstreetmap.org/node/7148312785', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Temples and pagodas
  // -------------------------------------------------------------------------
  {
    id: 'dinh-cau',
    name: 'Dinh Cậu (Dinh Cau Temple)',
    nameZh: '舅庙（Dinh Cậu）',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 10.21722,
      lng: 103.95642,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1491082316 "Dinh Cậu | Dinh Cau Temple" (amenity=place_of_worship) centre 10.2172184, 103.9564185, retrieved from OSM via the Overpass API; confirmed through scripts/lookup-place.mjs at 10.21722, 103.95643.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Sunset (17:30–18:30); the shrine sits on the rocks at the harbour mouth and faces west',
    bestTimeZh: '日落时分（17:30–18:30）；庙建在港口出口的礁石上，正对西面',
    tags: ['Temple', 'Sunset', 'Harbour', 'Culture', 'Free'],
    tagsZh: ['庙宇', '日落', '港口', '文化', '免费'],
    description:
      'Dinh Cậu is the small temple on the rock promontory at the mouth of the Duong Dong river, guarding the fishing harbour and the town behind it. It is Phu Quoc\'s best-known religious site and its most photographed sunset spot: a lighthouse-like shrine on a bare rock, reached by a short flight of steps from the harbour side.',
    descriptionZh:
      '舅庙（Dinh Cậu）建在阳东河口出海口的礁石岬角上，守护着渔港与身后的市镇。它是富国岛最有名的宗教场所，也是被拍得最多的日落点：形似灯塔的小庙立在光秃的岩石上，从港口一侧走一小段台阶即到。',
    notes:
      'Free to enter; shoulders and knees covered. Several local fishermen\'s shrines share the rock, so keep noise down and do not photograph people praying.',
    notesZh: '免费进入；需遮肩盖膝。礁石上还有几座渔民的小祠，请保持安静，不要拍摄正在祭拜的人。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    openingHours: 'Open during daylight; the surrounding pier area is accessible at night',
    markerLayer: 'activity',
    discovery: ['culture', 'highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1491082316 (amenity=place_of_worship)', url: 'https://www.openstreetmap.org/way/1491082316', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'sung-hung-pagoda',
    name: 'Sùng Hưng Cổ Tự (Sung Hung Pagoda)',
    nameZh: '崇兴古寺',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 10.21454,
      lng: 103.95987,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1272195372 "Sùng Hưng Cổ Tự | Sung Hung Pagoda" (amenity=place_of_worship) centre 10.2145373, 103.9598702, retrieved from OSM via the Overpass API; the same point was confirmed through scripts/lookup-place.mjs at 10.2149248, 103.9596873.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Early morning (06:00–08:00) when locals come to pray, or late afternoon',
    bestTimeZh: '清晨（06:00–08:00）本地人来上香时，或傍晚',
    tags: ['Pagoda', 'Culture', 'Buddhist', 'Town', 'Free'],
    tagsZh: ['寺庙', '文化', '佛教', '市区', '免费'],
    description:
      'Sùng Hưng Cổ Tự is the oldest pagoda on Phu Quoc, an active Buddhist temple in the middle of Duong Dong about 300 years old by local tradition. It is a working place of worship rather than a monument — incense, chanting, and a courtyard that fills on festival days — and it is a five-minute walk from the night market.',
    descriptionZh:
      '崇兴古寺是富国岛最古老的寺庙，位于阳东镇中心，按当地说法已有约300年历史，是一座仍在使用的佛教道场。它不是陈列式的古迹：香火、诵经，节庆日庭院里挤满人；距夜市步行约五分钟。',
    notes:
      'Free entry; modest dress (shoulders and knees covered) and shoes off inside the halls. Do not photograph the monks without asking.',
    notesZh: '免费进入；着装端庄（遮肩盖膝），进殿脱鞋。拍摄僧人前请先询问。',
    entryFee: 'Free (donations accepted)',
    entryFeeZh: '免费（可随喜）',
    markerLayer: 'activity',
    discovery: ['culture'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1272195372 (amenity=place_of_worship)', url: 'https://www.openstreetmap.org/way/1272195372', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'su-muon-pagoda',
    name: 'Su Muon Pagoda',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 10.2003073,
      lng: 103.9854768,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 8251035918 "Su Muon Pagoda" (amenity=place_of_worship) at 10.2003073, 103.9854768, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 45,
    bestTime: 'Morning or late afternoon; the hillside setting is shaded and cool at either end of the day',
    bestTimeZh: '上午或傍晚；山腰位置在一天两端都有树荫、较凉爽',
    tags: ['Pagoda', 'Culture', 'Hillside', 'Viewpoint', 'Buddhist'],
    tagsZh: ['寺庙', '文化', '山腰', '观景', '佛教'],
    description:
      'Su Muon Pagoda sits on the hillside just north-east of Duong Dong, overlooking the town and the sea beyond it. It is a newer, larger temple than Sùng Hưng, with a wide terrace and a garden of statues, and it is the quietest of the town\'s religious sites because most visitors never leave the night-market strip.',
    descriptionZh:
      '苏门寺（Su Muon Pagoda）位于阳东镇东北的山腰上，可俯瞰市镇与远处的海。它比崇兴古寺更新、规模更大，有宽阔的平台与雕像园；因为多数游客不会离开夜市一带，这里是镇上最清静的宗教场所。',
    notes:
      'Free entry. The road up is steep and unlit at night; go by taxi or scooter in daylight. Shoulders and knees covered.',
    notesZh: '免费进入。上山道路陡且夜间无路灯；白天打车或骑摩托前往。需遮肩盖膝。',
    entryFee: 'Free (donations accepted)',
    entryFeeZh: '免费（可随喜）',
    markerLayer: 'activity',
    discovery: ['culture'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 8251035918 (amenity=place_of_worship)', url: 'https://www.openstreetmap.org/node/8251035918', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'truc-lam-ho-quoc-zen-monastery',
    name: 'Trúc Lâm Hộ Quốc Zen Monastery',
    nameZh: '护国竹林禅院',
    destinationId: 'phu-quoc',
    areaId: 'duong-to',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 10.109177,
      lng: 104.0274983,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 3482735052 "Trúc Lâm Hộ Quốc Zen Monastery" (tourism=attraction) at 10.1091770, 104.0274983, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 60,
    bestTime: 'Early morning for the chanting and the cool air; the site faces east over the sea',
    bestTimeZh: '清晨可听诵经、空气凉爽；寺院朝东面海',
    tags: ['Monastery', 'Zen', 'Culture', 'Sea view', 'Architecture'],
    tagsZh: ['禅院', '禅宗', '文化', '海景', '建筑'],
    description:
      'Trúc Lâm Hộ Quốc is a large Zen monastery of the Trúc Lâm school on the hillside above the south-east coast, looking out over the sea towards the An Thoi islands. It is a working monastery with a formal, terraced layout and a big bronze Buddha, and it is far grander — and far quieter — than the town temples.',
    descriptionZh:
      '护国竹林禅院是竹林禅宗派的大型禅院，建在东南海岸上方的山腰，面向大海，可望见安泰群岛。这是仍在运作的修道场所：层层平台布局规整，立有一尊大铜佛；规模远比镇上的寺庙宏大，也清静得多。',
    notes:
      'Free entry; modest dress and no shoes inside the halls. Silence is expected — this is a monastery, not a photo studio, and some areas are closed to visitors.',
    notesZh: '免费进入；着装端庄，进殿脱鞋。请保持安静——这是禅院而不是摄影棚，部分区域不对访客开放。',
    entryFee: 'Free (donations accepted)',
    entryFeeZh: '免费（可随喜）',
    openingHours: 'Daylight hours',
    markerLayer: 'activity',
    discovery: ['culture'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 3482735052 (tourism=attraction)', url: 'https://www.openstreetmap.org/node/3482735052', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'gia-long-temple',
    name: "Đền thờ vua Gia Long (Emperor Gia Long's Temple)",
    nameZh: '嘉隆王庙',
    destinationId: 'phu-quoc',
    areaId: 'bai-sao',
    category: 'activity',
    subcategory: 'temple',
    coordinates: {
      lat: 10.06622,
      lng: 104.02869,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1338558470 "Đền thờ vua Gia Long | Emperor Gia Long\'s Temple" (amenity=place_of_worship) centre 10.0662205, 104.0286921, retrieved from OSM via the Overpass API; confirmed through scripts/lookup-place.mjs at 10.06622, 104.02869.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Morning, combined with Sao Beach on the same peninsula',
    bestTimeZh: '上午，与同一半岛的白沙滩一起安排',
    tags: ['Temple', 'History', 'Culture', 'Well', 'Free'],
    tagsZh: ['庙宇', '历史', '文化', '古井', '免费'],
    description:
      'This small temple on the Sao Beach peninsula marks the site where, according to local tradition, the future Emperor Gia Long took refuge and drew water while fleeing the Tây Sơn rebellion in the late 18th century. The well beside it is the actual relic; the shrine around it is modest and still visited by local families.',
    descriptionZh:
      '白沙滩半岛上的这座小庙，据当地传说标记了18世纪末未来嘉隆帝在躲避西山起义时避难取水的地点。旁边的古井才是真正的遗迹，围绕它的小祠规模不大，至今仍有本地家庭前来祭拜。',
    notes:
      'Free entry, a few hundred metres off the An Thoi–Sao Beach road with parking on the shoulder. Combine with Sao Beach and Kem Beach on the same southern loop.',
    notesZh: '免费进入，位于安泰—白沙滩公路旁几百米处，路边可停车。可与白沙滩、肯沙滩串成南部环线。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    markerLayer: 'activity',
    discovery: ['culture'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1338558470 (amenity=place_of_worship)', url: 'https://www.openstreetmap.org/way/1338558470', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Markets, farms and local produce
  // -------------------------------------------------------------------------
  {
    id: 'duong-dong-market',
    name: 'Chợ Dương Đông (Duong Dong Market)',
    nameZh: '阳东市场',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'food',
    subcategory: 'market',
    coordinates: {
      lat: 10.22063,
      lng: 103.95919,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 477604691 "Chợ Dương Đông | Duong Dong Market" (amenity=marketplace) at 10.2206288, 103.9591937, retrieved from OSM via the Overpass API; a second OSM way 1328291798 for the same market centre sits at 10.22054, 103.95980.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Early morning (06:00–09:00) for the fish, fruit and vegetables — this is a working market, not the night market',
    bestTimeZh: '清晨（06:00–09:00）买鱼、水果与蔬菜——这是本地菜市场，不是夜市',
    tags: ['Market', 'Seafood', 'Local life', 'Fruit', 'Pepper', 'Fish sauce'],
    tagsZh: ['市场', '海鲜', '本地生活', '水果', '胡椒', '鱼露'],
    description:
      'Chợ Dương Đông is the town\'s real market, a few blocks back from the harbour: wet-fish stalls, tropical fruit, peppercorns, fish sauce and household goods, all at local prices. It is the counterweight to the tourist night market on the waterfront — cheaper, earlier and entirely for residents.',
    descriptionZh:
      '阳东市场是镇上真正的菜市场，离港口几个街区：鲜鱼摊、热带水果、胡椒、鱼露与日用杂货，都是本地价格。它是海滨游客夜市的对立面——更便宜、更早开市，完全是本地人来的地方。',
    notes:
      'Go before 09:00 for the fish. Cash only, and prices are not marked — the market is not set up for bargaining with tourists, so pay what locals pay.',
    notesZh: '买鱼请在09:00前。只收现金，价格不标出——这里不是给游客砍价的市场，按本地人价格付钱即可。',
    entryFee: 'Free entry',
    entryFeeZh: '免费进入',
    openingHours: 'Early morning to early evening, roughly 05:30–18:00',
    markerLayer: 'food',
    discovery: ['food', 'shopping'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 477604691 (amenity=marketplace)', url: 'https://www.openstreetmap.org/node/477604691', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'an-thoi-market',
    name: 'Chợ An Thới (An Thoi Market)',
    nameZh: '安泰市场',
    destinationId: 'phu-quoc',
    areaId: 'an-thoi-south',
    category: 'food',
    subcategory: 'market',
    coordinates: {
      lat: 10.0176177,
      lng: 104.0137681,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 7629278439 "Chợ An Thới" (amenity=marketplace) at 10.0176177, 104.0137681, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 45,
    bestTime: 'Early morning (06:00–09:00); by lunchtime most of the fish has gone',
    bestTimeZh: '清晨（06:00–09:00）；到中午鱼基本卖完',
    tags: ['Market', 'Seafood', 'Local life', 'Budget', 'Town'],
    tagsZh: ['市场', '海鲜', '本地生活', '便宜', '市区'],
    description:
      'An Thoi\'s market is the south of the island\'s everyday food market, serving the town and the boats that work out of the port. It is small, cheap and genuinely local — the place to buy fruit and grilled snacks before a boat trip, or to see what the An Thoi fleet actually landed.',
    descriptionZh:
      '安泰市场是全岛南部的日常菜市场，服务镇上居民和从港口出海的渔船。规模不大、价格便宜、非常本地化——出海前买水果和烧烤小吃，或看看安泰船队当天到底捕了什么，都可以来这里。',
    notes:
      'A short walk from An Thoi port, so it pairs naturally with the Hon Thom cable car or an island-hopping departure. Cash only.',
    notesZh: '距安泰港步行可达，适合与香岛缆车或跳岛出发搭配。只收现金。',
    entryFee: 'Free entry',
    entryFeeZh: '免费进入',
    openingHours: 'Early morning to midday',
    markerLayer: 'food',
    discovery: ['food', 'shopping'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 7629278439 (amenity=marketplace)', url: 'https://www.openstreetmap.org/node/7629278439', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'ham-ninh-pier-and-seafood-market',
    name: 'Hàm Ninh pier & seafood market',
    nameZh: '涵宁渔港码头与海鲜市场',
    destinationId: 'phu-quoc',
    areaId: 'ham-ninh',
    category: 'food',
    subcategory: 'market',
    coordinates: {
      lat: 10.1817423,
      lng: 104.0528129,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1490334123 "Cầu tàu Hàm Ninh" (man_made=pier) centre 10.1817423, 104.0528129, verified through scripts/lookup-place.mjs — the pier at Hàm Ninh on the east coast.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Late morning to lunchtime, when the boats are in and the restaurants along the pier are cooking',
    bestTimeZh: '上午后段到午饭时间，渔船回港、码头边的餐厅正在开火',
    tags: ['Seafood', 'Pier', 'Market', 'Local', 'Budget', 'Crab'],
    tagsZh: ['海鲜', '码头', '市场', '本地', '便宜', '螃蟹'],
    description:
      'The long pier at Hàm Ninh is where the village\'s boats land and where the seafood market and its row of simple restaurants sit right over the water. Steamed crab, sea snails, scallops and pearl oysters are sold by weight and cooked to order — this is the cheapest good seafood on the island and the reason locals still drive out here.',
    descriptionZh:
      '涵宁的长码头是村里渔船靠岸的地方，海鲜市场与一排简朴餐厅就建在水面上。水煮蟹、海螺、扇贝与珍珠贝按重量出售、现点现做——这是全岛最便宜的好海鲜，也是本地人仍愿意开车过来的原因。',
    notes:
      'Agree the price and cooking method before ordering, and check the tank. Bring cash; there are no card machines. Half-day trip from Duong Dong, 30–40 minutes by road.',
    notesZh: '点菜前先谈好价格与做法，并查看水箱。带现金，这里没有刷卡机。距阳东镇车程30–40分钟，适合半日游。',
    entryFee: 'Free entry (pay for food)',
    entryFeeZh: '免费进入（餐费用餐另计）',
    markerLayer: 'food',
    discovery: ['food', 'highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1490334123 (man_made=pier)', url: 'https://www.openstreetmap.org/way/1490334123', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'khai-hoan-fish-sauce',
    name: 'Nước Mắm Khải Hoàn (Khai Hoan fish sauce works)',
    nameZh: '凯华鱼露作坊',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'activity',
    subcategory: 'factory visit',
    coordinates: {
      lat: 10.21995,
      lng: 103.9715,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 1954274168 "Nước Mắm Khải Hoàn | Khai Hoan Fish Sauce" (tourism=attraction), Hùng Vương, Dương Đông, at 10.2199514, 103.9714975, retrieved from OSM via the Overpass API; confirmed through scripts/lookup-place.mjs at the same point.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Morning, before the midday heat — the barrel halls are unshaded and hot',
    bestTimeZh: '上午，避开正午高温——木桶车间没有遮阳，很热',
    tags: ['Fish sauce', 'Local industry', 'Tasting', 'Shopping', 'Culture'],
    tagsZh: ['鱼露', '本地产业', '试吃', '购物', '文化'],
    description:
      'Phu Quoc fish sauce is a protected Vietnamese designation, and Khải Hoàn is one of the island\'s long-established producers, with rows of giant wooden fermentation barrels and a shop selling the finished product. A visit is short but genuinely informative: this is the island\'s oldest industry, and the smell is part of the experience.',
    descriptionZh:
      '富国鱼露是受保护的越南原产地名称，凯华是岛上历史较久的生产商之一，有成排的巨大木制发酵桶和售卖成品的门店。参观时间不长但很有信息量：这是岛上最古老的产业，那股气味本身就是体验的一部分。',
    notes:
      'Free or token entry, with tastings and bottles on sale. Photography of the barrel halls is usually allowed; ask before filming staff.',
    notesZh: '免票或象征性收费，可试吃并购买瓶装产品。桶区一般允许拍照，拍摄工作人员前先询问。',
    entryFee: 'Free entry (tastings and bottles on sale)',
    entryFeeZh: '免费进入（可试吃并购买瓶装）',
    openingHours: 'Business hours, roughly 08:00–17:00',
    markerLayer: 'activity',
    discovery: ['culture', 'shopping', 'food'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 1954274168 (tourism=attraction)', url: 'https://www.openstreetmap.org/node/1954274168', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'ngoc-ha-pepper-farm',
    name: 'Vườn Tiêu Ngọc Hà (Ngoc Ha pepper farm)',
    nameZh: '玉河胡椒园',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'activity',
    subcategory: 'farm visit',
    coordinates: {
      lat: 10.21133,
      lng: 103.98348,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 1954274170 "Vườn Tiêu Ngọc Hà | Ngoc Ha Pepper Farm" (tourism=attraction), Đường 30 Tháng 4, at 10.2113317, 103.9834751, retrieved from OSM via the Overpass API and confirmed through scripts/lookup-place.mjs.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Harvest season (February–April) when the vines are being picked; any dry-season morning otherwise',
    bestTimeZh: '收获季（2–4月）藤上正在采摘时最好；其余时间选旱季上午',
    tags: ['Pepper', 'Farm', 'Local produce', 'Family friendly', 'Shopping'],
    tagsZh: ['胡椒', '农场', '本地物产', '适合家庭', '购物'],
    description:
      'Pepper is Phu Quoc\'s second signature crop after fish sauce, and Ngọc Hà is one of the pepper farms on Đường 30 Tháng 4 that takes visitors. You walk the rows of vines, see how black, white and red pepper come from the same plant, and buy direct from the farm at prices well below the souvenir shops.',
    descriptionZh:
      '胡椒是富国岛仅次于鱼露的标志性物产，玉河是30·4路上接待访客的胡椒园之一。可以走进藤架之间，了解黑胡椒、白胡椒与红胡椒其实来自同一种植物，并在园内直接购买，价格远低于纪念品店。',
    notes:
      'Small or free entry with produce on sale. Combine with the other pepper farms and the fish-sauce works on the same road — they are within a few kilometres of each other.',
    notesZh: '免票或低门票，园内可购买产品。可与同一条路上的其他胡椒园和鱼露作坊一起安排——彼此相距仅几公里。',
    entryFee: 'Free or token entry (produce on sale)',
    entryFeeZh: '免费或象征性门票（产品另售）',
    openingHours: 'Daylight hours',
    markerLayer: 'activity',
    discovery: ['culture', 'shopping'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 1954274170 (tourism=attraction)', url: 'https://www.openstreetmap.org/node/1954274170', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'ngoc-hien-pearl-farm',
    name: 'Ngọc Hiền Pearl Farm',
    nameZh: '玉贤珍珠养殖场',
    destinationId: 'phu-quoc',
    areaId: 'duong-to',
    category: 'activity',
    subcategory: 'pearl farm',
    coordinates: {
      lat: 10.17009,
      lng: 103.97024,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1266672527 "Cửa Hàng Ngọc Trai Ngọc Hiền", tagged shop=jewelry and displaying name "Ngoc Hien Pearl farm", centre 10.1700900, 103.9702400 on Trần Hưng Đạo, Dương Tơ; verified through scripts/lookup-place.mjs at 10.17009, 103.97024.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Any dry-season day; morning is cooler and quieter',
    bestTimeZh: '旱季任何一天皆可；上午更凉快也更清静',
    tags: ['Pearl', 'Farm', 'Craft', 'Shopping', 'Family friendly'],
    tagsZh: ['珍珠', '养殖场', '手工艺', '购物', '适合家庭'],
    description:
      'Pearl cultivation is one of Phu Quoc\'s real industries, and Ngọc Hiền is a working pearl farm and showroom on Trần Hưng Đạo south of Duong Dong. Staff walk visitors through how an oyster is seeded and harvested and how the pearls are graded, then show the finished pieces — with no obligation to buy.',
    descriptionZh:
      '珍珠养殖是富国岛真实的产业之一，玉贤是阳东镇以南陈兴道路上仍在运作的珍珠养殖场兼展厅。工作人员会讲解如何插核、采收，以及珍珠如何分级，然后展示成品——不强制消费。',
    notes:
      'Free entry with a short guided explanation. Prices are for real cultured pearls, not souvenirs; if a price looks like a souvenir price, ask what the pearl actually is.',
    notesZh: '免费进入，有简短讲解。这里卖的是真正的养殖珍珠而非纪念品；若价格像纪念品，先问清珍珠的品类。',
    entryFee: 'Free entry (guided explanation included)',
    entryFeeZh: '免费进入（含讲解）',
    openingHours: 'Business hours, roughly 08:00–17:30',
    markerLayer: 'activity',
    discovery: ['culture', 'shopping'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1266672527 (shop=jewelry)', url: 'https://www.openstreetmap.org/way/1266672527', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Transport
  // -------------------------------------------------------------------------
  {
    id: 'bai-vong-ferry-terminal',
    name: 'Bến phà Bãi Vòng (Bai Vong ferry terminal)',
    nameZh: '拜翁渡轮码头',
    destinationId: 'phu-quoc',
    areaId: 'ham-ninh',
    category: 'transport',
    subcategory: 'ferry terminal',
    coordinates: {
      lat: 10.1464,
      lng: 104.03458,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 9590132153 "Bến phà Bình An Phú Quốc | Binh An Phu Quoc ferry terminal" (amenity=ferry_terminal) at 10.1464000, 104.0345800, verified through scripts/lookup-place.mjs at the same point; the adjacent OSM node 1166233138 "Bai Vong Passanger Ferry" sits 400 m south-east.',
    },
    recommendedDurationMin: 60,
    bestTime: 'Arrive 45–60 minutes before departure; morning sailings are less likely to be affected by afternoon weather',
    bestTimeZh: '开车前45–60分钟到达；上午班次受午后天气影响较小',
    tags: ['Ferry', 'Mainland connection', 'Transport hub', 'Rach Gia', 'Ha Tien'],
    tagsZh: ['渡轮', '大陆连接', '交通枢纽', '迪石', '河仙'],
    description:
      'Bãi Vòng is Phu Quoc\'s main passenger ferry port, on the south-east coast about 30 minutes from Duong Dong, with fast boats to Rạch Giá and Hà Tiên on the mainland. If you are not flying, this is how you arrive and leave the island — and the terminal is also the practical starting point for anyone heading on to Hàm Ninh or Cây Sao.',
    descriptionZh:
      '拜翁（Bãi Vòng）是富国岛主要的客运渡轮港，位于东南海岸、距阳东镇约30分钟车程，有开往大陆迪石（Rạch Giá）与河仙（Hà Tiên）的快艇。如果不坐飞机，进出岛都从这里；对要继续前往涵宁或椰星的旅客来说，这里也是实用的起点。',
    notes:
      'Several operators sell at the same terminal; buy through your hotel or an agent, and confirm which pier your sailing uses. Bring your passport — passenger manifests are checked.',
    notesZh: '多家船公司在同一码头售票；通过酒店或代理购票，并确认你的班次使用哪个泊位。随身带护照——会核对乘客名单。',
    entryFee: 'Free to enter (ticket required to sail)',
    entryFeeZh: '进入免费（乘船需购票）',
    openingHours: 'First sailings early morning; last departures late afternoon',
    markerLayer: 'transport',
    discovery: ['highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 9590132153 (amenity=ferry_terminal)', url: 'https://www.openstreetmap.org/node/9590132153', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'an-thoi-port',
    name: 'Cảng An Thới (An Thoi port)',
    nameZh: '安泰港',
    destinationId: 'phu-quoc',
    areaId: 'an-thoi-south',
    category: 'transport',
    subcategory: 'harbour',
    coordinates: {
      lat: 10.0125823,
      lng: 104.0147958,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 1594339282 "Cảng An Thới" (amenity=ferry_terminal) at 10.0125823, 104.0147958, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 45,
    bestTime: 'Early morning for island-hopping departures; boats generally return by late afternoon',
    bestTimeZh: '跳岛船一般清晨出发，下午后段回港',
    tags: ['Harbour', 'Island hopping', 'Boats', 'Transport', 'Diving'],
    tagsZh: ['港口', '跳岛', '船只', '交通', '潜水'],
    description:
      'An Thoi port is the working harbour at the southern tip of the island, where the fishing fleet, the island-hopping tour boats and the dive and snorkelling operators all base. Almost every boat trip in the An Thoi archipelago starts here, and it is a five-minute drive from the Sunset Town development and the Hon Thom cable-car station.',
    descriptionZh:
      '安泰港是岛最南端的作业港口，渔船、跳岛游船以及潜水与浮潜运营商都以此为基地。安泰群岛几乎所有的出海行程都从这里出发，距日落小镇与香岛缆车站约五分钟车程。',
    notes:
      'Confirm your operator and boat name before boarding — several companies use the same quay and touts work the entrance. Seas can be rough in the wet season and trips are sometimes cancelled.',
    notesZh: '上船前确认运营商与船名——多家公司共用同一码头，入口也有拉客的人。雨季海况较差，行程有时会取消。',
    entryFee: 'Free to enter (tour or crossing ticket required to sail)',
    entryFeeZh: '进入免费（出海需购票）',
    markerLayer: 'transport',
    discovery: ['highlights', 'water'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 1594339282 (amenity=ferry_terminal)', url: 'https://www.openstreetmap.org/node/1594339282', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'an-thoi-lighthouse',
    name: 'Hải đăng An Thới (An Thoi Lighthouse)',
    nameZh: '安泰灯塔',
    destinationId: 'phu-quoc',
    areaId: 'an-thoi-south',
    category: 'activity',
    subcategory: 'viewpoint',
    coordinates: {
      lat: 10.01184,
      lng: 104.01204,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1273113082 "Hải đăng An Thới | An Thoi Lighthouse" (man_made=lighthouse) centre 10.0118400, 104.0120400, on Nguyễn Trường Tộ, An Thới; confirmed through scripts/lookup-place.mjs at the same point.',
    },
    recommendedDurationMin: 45,
    bestTime: 'Late afternoon for the light and the view over the harbour; sunset from the hill is the draw',
    bestTimeZh: '傍晚光线与港口景观最好；山上的日落是重点',
    tags: ['Lighthouse', 'Viewpoint', 'Harbour', 'Photography', 'Sunset'],
    tagsZh: ['灯塔', '观景点', '港口', '摄影', '日落'],
    description:
      'An Thoi\'s lighthouse stands on the hill above the port at the island\'s southern tip, and the road up to it gives the best overview of the harbour, the fishing fleet and the An Thoi islands beyond. It is a working navigation light rather than a visitor attraction, so the pleasure is the view rather than the building.',
    descriptionZh:
      '安泰灯塔建在岛最南端港口上方的山丘上，上山的路可以俯瞰港口、渔船队以及更远处的安泰群岛，是全岛南部最好的全景位置。它是仍在使用的航标而不是观光建筑，所以看点是视野而非灯塔本身。',
    notes:
      'The access road is steep and partly unsurfaced; go by scooter or taxi, not on foot in the heat. Do not climb the tower structure itself.',
    notesZh: '上山道路陡且部分未铺装；骑摩托或打车前往，不要在高温下步行。不要攀爬塔身结构。',
    entryFee: 'Free',
    entryFeeZh: '免费',
    markerLayer: 'activity',
    discovery: ['highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1273113082 (man_made=lighthouse)', url: 'https://www.openstreetmap.org/way/1273113082', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Attractions and activities
  // -------------------------------------------------------------------------
  {
    id: 'vinpearl-safari-phu-quoc',
    name: 'Vinpearl Safari Phu Quoc',
    nameZh: '富国岛珍珠野生动物园',
    destinationId: 'phu-quoc',
    areaId: 'ong-lang-cua-can-ganh-dau',
    category: 'activity',
    subcategory: 'zoo',
    coordinates: {
      lat: 10.3393964,
      lng: 103.8950113,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 753491820 "Vinpearl Safari" (tourism=zoo) centre 10.3393964, 103.8950113, retrieved from OSM via the Overpass API and verified through scripts/lookup-place.mjs at the same point.',
    },
    recommendedDurationMin: 240,
    bestTime: 'Arrive at opening (09:00); the safari bus and the animals are most active before the midday heat',
    bestTimeZh: '开园（09:00）即到；中午高温前观光车与动物最有活力',
    tags: ['Zoo', 'Wildlife', 'Family', 'Safari bus', 'Half day'],
    tagsZh: ['动物园', '野生动物', '家庭', '观光车', '半日'],
    description:
      'Vinpearl Safari is a large open-range zoo in the north-west of the island, part of the same Vinpearl complex as VinWonders and Grand World. Visitors ride a covered safari bus through the free-roaming sections and walk the rest; it is the island\'s main non-beach attraction for families with younger children.',
    descriptionZh:
      '珍珠野生动物园是岛西北部的大型放养式动物园，与大世界和珍珠乐园同属一个建筑群。游客乘坐有顶观光车穿过散养区，其余区域步行参观；对带小孩的家庭来说，这是岛上最主要的非海滩类景点。',
    notes:
      'Timed entry and separate ticketing from VinWonders; combo tickets covering both are sold. Bring sun protection — much of the walking route is unshaded.',
    notesZh: '分时段入场，与珍珠乐园分开售票；也有两者联票。注意防晒——步行路线大部分没有遮荫。',
    entryFee: 'Ticketed (adult and child rates; combo tickets with VinWonders available)',
    entryFeeZh: '需购票（分成人票与儿童票；有与珍珠乐园的联票）',
    openingHours: '09:00–16:00 daily (approximately; check the operator before travelling)',
    markerLayer: 'activity',
    activity: {
      kind: 'shopping',
      weatherDependency: 'low',
      reservationRecommended: true,
      transportContext: 'About 30–40 minutes by road from Duong Dong; VinBus shuttles connect the Vinpearl complex with much of the island.',
      transportContextZh: '距阳东镇车程约30–40分钟；VinBus 班车连接珍珠建筑群与岛内多处。',
    },
    discovery: ['highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 753491820 (tourism=zoo)', url: 'https://www.openstreetmap.org/way/753491820', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'grand-world-phu-quoc',
    name: 'Grand World Phu Quoc',
    nameZh: '富国岛大世界',
    destinationId: 'phu-quoc',
    areaId: 'ong-lang-cua-can-ganh-dau',
    category: 'activity',
    subcategory: 'entertainment complex',
    coordinates: {
      lat: 10.32494,
      lng: 103.8581376,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 936712302 "Grand World Phú Quốc" centre 10.3249400, 103.8581376, retrieved from OSM via the Overpass API and verified through scripts/lookup-place.mjs at the same point.',
    },
    recommendedDurationMin: 180,
    bestTime: 'Late afternoon into the evening (17:00–22:00), when the canals are lit and the shows run',
    bestTimeZh: '傍晚到夜间（17:00–22:00），运河亮灯、演出开演',
    tags: ['Shopping', 'Nightlife', 'Family', 'Shows', 'Canals', 'Free entry'],
    description:
      'Grand World is the "sleepless city" entertainment quarter inside the Vinpearl complex at Gành Dầu — a canal-and-bridge development of shops, restaurants, a night market, a large public square and nightly light and water shows. Entry to the complex is free and it is where the island\'s north-west goes in the evening.',
    descriptionZh:
      '大世界是甘道珍珠建筑群内的"不夜城"娱乐区：运河与桥梁组成的商业街、餐厅、夜市、大型公共广场，以及每晚的灯光与水舞表演。进入园区免费，是岛西北部夜间的去处。',
    notes:
      'Free to walk in; individual attractions, the teddy bear museum and the shows are separately ticketed. It is 30–40 minutes from Duong Dong — arrange your return transport before the last shuttles stop.',
    notesZh: '免费入园；园内个别景点、泰迪熊博物馆与演出另行购票。距阳东镇30–40分钟，末班班车停运前先安排好回程。',
    entryFee: 'Free entry to the complex (individual attractions ticketed)',
    entryFeeZh: '园区免费进入（个别景点另行购票）',
    openingHours: 'Shops and restaurants from late afternoon until around 22:00',
    markerLayer: 'activity',
    discovery: ['highlights', 'nightlife', 'shopping'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 936712302', url: 'https://www.openstreetmap.org/way/936712302', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'aquatopia-water-park',
    name: 'Aquatopia Water Park (Sun World Hon Thom)',
    nameZh: '阿夸托皮亚水上乐园（香岛太阳世界）',
    destinationId: 'phu-quoc',
    areaId: 'an-thoi-archipelago',
    category: 'activity',
    subcategory: 'water park',
    coordinates: {
      lat: 9.9564109,
      lng: 104.0158605,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap way 1092523953 "Công viên nước Aquatopia | Aquatopia Water Park" (tourism=theme_park) centre 9.9564109, 104.0158605, retrieved from OSM via the Overpass API and verified through scripts/lookup-place.mjs at the same point.',
    },
    recommendedDurationMin: 240,
    bestTime: 'Midday to mid-afternoon, and outside the cable-car arrival peaks (09:30–11:30 and 13:30–14:00)',
    bestTimeZh: '中午到下午中段，避开缆车到岛高峰（09:30–11:30、13:30–14:00）',
    tags: ['Water park', 'Family', 'Slides', 'Island', 'Cable car'],
    tagsZh: ['水上乐园', '家庭', '滑道', '海岛', '缆车'],
    description:
      'Aquatopia is the water park on Hòn Thơm island, included in the Hon Thom cable-car ticket and the main reason to spend a full day at the far end of the line. It has a large slide complex and a beach-side pool area built into the island\'s shoreline, with the An Thoi archipelago as the backdrop.',
    descriptionZh:
      '阿夸托皮亚是香岛上的水上乐园，含在香岛缆车票内，也是在这条线路终点待上一整天的理由。园区有大型滑道组合，以及沿海岸线建的泳池区，背景就是安泰群岛。',
    notes:
      'Included in the Hon Thom cable-car round-trip ticket; check the day\'s cable-car sailing windows (four per day) and be back at the station before the last one. Swimwear required; lockers and towel hire on site.',
    notesZh: '含在香岛缆车往返票内；请确认当天缆车运行时段（每日四班），并在末班前回到车站。需穿泳装；园内有储物柜与毛巾租赁。',
    entryFee: 'Included in the Hon Thom cable-car round-trip ticket',
    entryFeeZh: '含在香岛缆车往返票内',
    openingHours: 'Aligned with the cable-car operating windows',
    markerLayer: 'activity',
    activity: {
      kind: 'island',
      difficulty: 'easy',
      weatherDependency: 'high',
      reservationRecommended: true,
      transportContext: 'Reached only by the Hon Thom cable car from An Thoi, or by tour boat from An Thoi port.',
      transportContextZh: '只能从安泰乘坐香岛缆车，或从安泰港跟团船前往。',
    },
    discovery: ['highlights', 'water'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap way 1092523953 (tourism=theme_park)', url: 'https://www.openstreetmap.org/way/1092523953', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'ong-lang-snorkelling-reef',
    name: 'Ong Lang snorkelling reef',
    nameZh: '翁朗浮潜礁',
    destinationId: 'phu-quoc',
    areaId: 'ong-lang-cua-can-ganh-dau',
    category: 'nature',
    subcategory: 'snorkelling site',
    coordinates: {
      lat: 10.2568503,
      lng: 103.9362179,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 7005393785 "Snorkeling spot" (tourism=viewpoint) at 10.2568503, 103.9362179, verified through scripts/lookup-place.mjs (Photon, OSM-derived). The OSM object carries only the generic name; it marks the reef just off Ong Lang beach.',
    },
    recommendedDurationMin: 90,
    bestTime: 'Calm mornings in the dry season (November–April), at or near high tide',
    bestTimeZh: '旱季（11月至次年4月）上午水静时，涨潮前后',
    tags: ['Snorkelling', 'Reef', 'Beach', 'Water', 'Family friendly'],
    tagsZh: ['浮潜', '礁石', '海滩', '水上活动', '适合家庭'],
    description:
      'The reef immediately off Ong Lang beach is the most accessible shore snorkelling on Phu Quoc: the coral starts in shallow water a short swim from the sand, so no boat is needed. Visibility is modest by regional standards but the site is calm, close to the beach and usable on a whim between other plans.',
    descriptionZh:
      '翁朗沙滩外不远处的礁石是富国岛最容易到达的岸潜点：珊瑚就在离沙滩很近的浅水中，不需要坐船。能见度以区域标准看一般，但这里水静、离岸近，可以临时起意下水。',
    notes:
      'No operator or facility — bring your own mask and fins and watch for boat traffic. Visibility drops sharply in the wet season, and the reef is shallow enough to be damaged by standing on it.',
    notesZh: '没有运营商或设施——自带面镜与脚蹼，注意来往船只。雨季能见度会大幅下降；礁石很浅，踩踏会造成破坏。',
    entryFee: 'Free (bring your own equipment)',
    entryFeeZh: '免费（自备装备）',
    markerLayer: 'nature',
    activity: {
      kind: 'snorkel',
      difficulty: 'easy',
      weatherDependency: 'high',
      reservationRecommended: false,
      transportContext: 'Walk in from Ong Lang beach; most Ong Lang resorts are within a few minutes of this point.',
      transportContextZh: '从翁朗沙滩步行进入；翁朗多数度假村距此只有几分钟。',
    },
    discovery: ['water', 'nature'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 7005393785 (tourism=viewpoint)', url: 'https://www.openstreetmap.org/node/7005393785', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },

  // -------------------------------------------------------------------------
  // Food and drink
  // -------------------------------------------------------------------------
  {
    id: 'bun-quay-thanh-hung',
    name: 'Bún quậy Thanh Hùng',
    destinationId: 'phu-quoc',
    areaId: 'duong-dong',
    category: 'food',
    subcategory: 'restaurant',
    coordinates: {
      lat: 10.2144423,
      lng: 103.9630332,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 9503740617 "Bún quậy Thanh Hùng" (amenity=restaurant) at 10.2144423, 103.9630332, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 45,
    bestTime: 'Breakfast and lunch (06:30–14:00); bún quậy is a morning dish and the good batches run out',
    bestTimeZh: '早餐与午餐时段（06:30–14:00）；这款米粉是早上的食物，好的批次会卖完',
    tags: ['Local food', 'Noodles', 'Breakfast', 'Budget', 'Seafood'],
    tagsZh: ['本地小吃', '米粉', '早餐', '便宜', '海鲜'],
    description:
      'Bún quậy is Phu Quoc\'s own dish — a firm rice-flour noodle served with a raw fish and squid paste that you stir into the hot broth yourself, seasoned at the table with salt, pepper and lime. Thanh Hùng is the best-known of the bún quậy houses in Duong Dong, and it is the one local speciality that has nothing to do with the resort strip.',
    descriptionZh:
      'Bún quậy（"搅拌米粉"）是富国岛独有的小吃：米浆做的弹牙米粉配生鱼肉与墨鱼浆，上桌后自己搅进滚烫汤里，再在桌上用盐、胡椒和青柠调味。清雄（Thanh Hùng）是阳东镇最有名的搅拌米粉店，也是与度假区完全无关的本地特色。',
    notes:
      'Very cheap, very busy at breakfast, and there is often a queue — tables are shared. No English menu; point at what the next table has.',
    notesZh: '非常便宜，早餐时段很挤，常常要排队，需要拼桌。没有英文菜单；指一下邻桌的即可。',
    entryFee: 'Pay per bowl',
    entryFeeZh: '按碗计价',
    openingHours: 'Morning to early afternoon',
    markerLayer: 'food',
    dining: {
      cuisines: ['vietnamese'],
      mealTypes: ['breakfast', 'lunch'],
      priceTier: '$',
      signatureItems: ['Bún quậy', 'Bún quậy with squid'],
      reservationRecommended: false,
    },
    discovery: ['food', 'highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 9503740617 (amenity=restaurant)', url: 'https://www.openstreetmap.org/node/9503740617', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'chuon-chuon-bistro-and-sky-bar',
    name: 'Chuồn Chuồn Bistro & Sky Bar',
    destinationId: 'phu-quoc',
    areaId: 'long-beach-bai-truong',
    category: 'food',
    subcategory: 'restaurant',
    coordinates: {
      lat: 10.2088622,
      lng: 103.9657591,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 4792974669 "Chuồn Chuồn Bistro & Sky Bar" (amenity=restaurant) at 10.2088622, 103.9657591, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 90,
    bestTime: 'Book for sunset (17:30–19:00) — the upper terrace is the point of the place',
    bestTimeZh: '预订日落时段（17:30–19:00）——高层露台正是它的卖点',
    tags: ['Restaurant', 'Sky bar', 'Sunset', 'Vietnamese', 'International', 'Views'],
    tagsZh: ['餐厅', '空中酒吧', '日落', '越南菜', '国际菜', '景观'],
    description:
      'Chuồn Chuồn — "dragonfly" — is a multi-level restaurant and sky bar on the ridge behind Long Beach, and its top terrace looks straight out over the sea and the sunset. The kitchen runs Vietnamese dishes and international standards together, which makes it an easy choice for a group with mixed appetites.',
    descriptionZh:
      'Chuồn Chuồn（意为"蜻蜓"）是长滩背后山脊上的多层餐厅与空中酒吧，顶层露台正对大海与日落。厨房同时做越南菜与国际菜，适合口味不一致的一群人。',
    notes:
      'Reserve for the sunset sitting in high season; the terraces are open-air and the walk up between levels is steep. Prices are mid-to-upper for the island because of the view.',
    notesZh: '旺季的日落时段需订位；露台为露天，层与层之间的步道较陡。因为景观，价格在岛上属中上水平。',
    entryFee: 'Pay per dish',
    entryFeeZh: '按菜品计价',
    openingHours: 'Late morning until late evening',
    markerLayer: 'food',
    dining: {
      cuisines: ['vietnamese', 'international'],
      mealTypes: ['lunch', 'dinner', 'drinks'],
      priceTier: '$$$',
      signatureItems: [],
      reservationRecommended: true,
      viewOrSunset: true,
    },
    discovery: ['food', 'nightlife', 'highlights'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 4792974669 (amenity=restaurant)', url: 'https://www.openstreetmap.org/node/4792974669', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
  {
    id: 'ganesh-indian-restaurant',
    name: 'Ganesh Indian Restaurant',
    destinationId: 'phu-quoc',
    areaId: 'long-beach-bai-truong',
    category: 'food',
    subcategory: 'restaurant',
    coordinates: {
      lat: 10.208007,
      lng: 103.9625157,
      confidence: 'verified',
      coordNote:
        'OpenStreetMap node 3318170432 "Ganesh Indian Restaurant" (amenity=restaurant, cuisine=indian) at 10.2080070, 103.9625157, verified through scripts/lookup-place.mjs (Photon, OSM-derived).',
    },
    recommendedDurationMin: 75,
    bestTime: 'Dinner (18:00–21:30); it is a small room and fills early in high season',
    bestTimeZh: '晚餐（18:00–21:30）；店面不大，旺季早早就坐满',
    tags: ['Restaurant', 'Indian', 'Vegetarian friendly', 'Curry', 'Tandoor'],
    tagsZh: ['餐厅', '印度菜', '适合素食者', '咖喱', '泥炉烤肉'],
    description:
      'Ganesh is the long-standing Indian restaurant on the Long Beach strip south of Duong Dong, and it has survived on the island for years on the strength of its tandoor and its vegetarian range. It is a useful counterweight to a week of seafood and Vietnamese food, and the kitchen will adjust heat on request.',
    descriptionZh:
      'Ganesh 是长滩一带（阳东镇以南）经营多年的印度餐厅，靠泥炉烤肉与丰富的素食菜单在岛上站住脚。吃腻了一周的海鲜与越南菜之后很有用，辣度可以按需调整。',
    notes:
      'Vegetarian, vegan and Jain options are marked on the menu. Air-conditioned inside, a few tables on the street; no view.',
    notesZh: '菜单上标有素食、纯素与耆那教可选。室内有空调，街边另有几桌；没有景观。',
    entryFee: 'Pay per dish',
    entryFeeZh: '按菜品计价',
    openingHours: 'Lunch and dinner',
    markerLayer: 'food',
    dining: {
      cuisines: ['indian'],
      mealTypes: ['lunch', 'dinner'],
      priceTier: '$$',
      signatureItems: [],
      reservationRecommended: false,
    },
    discovery: ['food'],
    sources: [
      { kind: 'geographic', label: 'OpenStreetMap node 3318170432 (amenity=restaurant)', url: 'https://www.openstreetmap.org/node/3318170432', retrievedOn: '2026-10-07' },
    ],
    verificationStatus: 'verified',
  },
];
