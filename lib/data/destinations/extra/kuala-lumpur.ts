import type { AreaSeed, DestinationSeed, HotelSeed, PlaceSeed } from '../../../types';

/**
 * KUALA LUMPUR — the federal territory plus the Klang Valley day zones.
 *
 * PROVENANCE
 * ----------
 * Every coordinate below was resolved by name against OpenStreetMap with
 * `scripts/lookup-place.mjs` (Photon/OSM first, Overpass second, Nominatim last;
 * 30 km distance gate, name gate and locality gate). Each record's `coordNote`
 * names the OSM object that answered and the locality it sits in. One record —
 * the old Kuala Lumpur Railway Station — was resolved through the Overpass API
 * directly and carries its OSM way id.
 * Nothing here is a guessed position and no record borrows a neighbour's point.
 *
 * WHAT WAS DROPPED, AND WHY
 * -------------------------
 * - Petronas Twin Towers Skybridge / observation deck: OSM carries no object for
 *   the bridge or the deck itself (only six "Petronas Towers Viewpoint" nodes
 *   scattered around the base). The skybridge and the 86th-floor deck are
 *   described inside the Petronas Twin Towers record instead of being given a
 *   fabricated second coordinate.
 * - Conrad Kuala Lumpur: the only OSM object is `Conrad Kuala Lumpur (U/C)` —
 *   tagged as a construction site, not an open hotel. Excluded under "must be
 *   currently open".
 * - Canopy by Hilton Kuala Lumpur: the only OSM object is `Hotel Block (Former
 *   Canopy by Hilton KL)` — the brand is no longer on the building.
 * - Capella Kuala Lumpur, Anantara Kuala Lumpur, Avani Kuala Lumpur, Viceroy
 *   Kuala Lumpur, Thompson Kuala Lumpur, Kempinski Kuala Lumpur, Tivoli Kuala
 *   Lumpur, Hyatt Centric Kuala Lumpur: no OSM object exists. The lookup tool
 *   returned the generic "Kuala Lumpur" transport stop for four of them, which
 *   is a false name match and was rejected by hand.
 * - voco Kuala Lumpur: same false match against the generic city stop; no
 *   property confirmed.
 * - Marco Polo Kuala Lumpur: no OSM object and no current property page found.
 * - Merdeka 118 (the tower): OSM has no object named "Merdeka 118" within 2 km;
 *   the surrounding records are the MRT "Merdeka" station and "Menara Merdeka
 *   Maybank", which are different buildings. Excluded rather than placed on a
 *   neighbour.
 * - Hilton Garden Inn Kuala Lumpur South: the Photon result for this query was
 *   the Jalan Tuanku Abdul Rahman property 8.5 km away — the two southern
 *   Garden Inn branches could not be told apart, so neither is claimed.
 * - Park Hyatt Kuala Lumpur, Moxy Kuala Lumpur, Hyatt Regency Kuala Lumpur and
 *   "Marriott Hotel Petaling Jaya": OSM carries a `tourism=hotel` object for
 *   each, but the opening status or the current brand could not be confirmed
 *   against a live property page, so they are left out under rule 1 rather than
 *   shipped on an OSM tag alone.
 *
 * BOUNDS
 * ------
 * The suggested box [[2.95, 101.55], [3.35, 101.85]] does not contain Putrajaya
 * (2.9386, 101.6924), Genting Highlands (3.4151, 101.7885), Klang (3.0431,
 * 101.4497) or Port Klang (2.9996, 101.3914), all of which the brief asks for.
 * It also does not contain Kuala Lumpur International Airport itself, which sits
 * at 2.7448, 101.7074 — about 45 km south of the city. `mapBounds` below is
 * therefore widened to [[2.70, 101.42], [3.44, 101.83]], which holds every area,
 * place, hotel and both airports with margin.
 *
 * AREAS: 14. Brickfields and KL Sentral are one zone (the brief lists them both
 * ways); Petaling Jaya and Subang Jaya/Bandar Sunway are one day zone. Ampang /
 * KLCC east and Mont Kiara / Sri Hartamas were dropped to stay inside 10–14 —
 * see the report.
 *
 * HOTELS: 14, across all five programmes. The honest ceiling is much higher:
 * 34 OSM hotel objects in Greater Kuala Lumpur were verified as trading, and the
 * 20 left out to stay near the 10–14 target are listed in the report.
 */

const areasList: AreaSeed[] = [
  {
    id: "klcc",
    destinationId: "kuala-lumpur",
    name: "KLCC (Kuala Lumpur City Centre)",
    nameZh: "双子塔城中城（KLCC）",
    coordinates: {
      lat: 3.1573751,
      lng: 101.7123797,
      confidence: "verified",
      coordNote:
        "OSM mall \"Suria KLCC\" — Persiaran Petronas, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The mall sits on the podium of the Petronas Twin Towers and is the retail heart of the zone.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 1200,
    bestFor: [
      "The Petronas Twin Towers, the Skybridge and the 86th-floor observation deck",
      "KLCC Park, the Lake Symphony fountain shows and the children's pool",
      "Luxury and full-service hotel inventory (Mandarin Oriental, Grand Hyatt, W, InterContinental, Four Seasons)",
      "Air-conditioned shopping at Suria KLCC and the Avenue K / Pavilion walkway",
      "First-time visitors who want the postcard view from the doorstep",
      "Convention and business travel at the Kuala Lumpur Convention Centre",
    ],
    weakFor: [
      "Street food and cheap local eating (the area is mall food courts and hotel restaurants)",
      "Old-city atmosphere and colonial architecture",
      "Late-night clubbing (Bukit Bintang and TREC are a taxi ride away)",
      "Budget guesthouses and hostels",
    ],
    bestForZh: [
      "双子塔、空中桥梁与 86 层观景台",
      "城中城公园、音乐喷泉与儿童戏水池",
      "豪华与全服务酒店（文华东方、君悦、W、洲际、四季）",
      "阳光广场与 Avenue K／柏威年连廊的空调购物",
      "第一次来、想一起床就拍到明信片的旅客",
      "吉隆坡会议中心的会展与商务出行",
    ],
    weakForZh: [
      "街头小吃与平价本地饮食（这里多是商场美食广场和酒店餐厅）",
      "老城氛围与殖民建筑",
      "深夜蹦迪（要打车去武吉免登或 TREC）",
      "青旅与廉价住宿",
    ],
    scores: { beach: 0, nightlife: 3, food: 3, luxury: 5, nature: 3, accessibility: 5 },
    vibe: "Glass towers, a 50-acre park and the city's densest luxury-hotel cluster, all walkable and air-conditioned",
    vibeZh: "玻璃塔楼、50 英亩公园与全城最密的豪华酒店群，步行可达且到处有空调",
    tagline: "Twin Towers · Luxury",
    taglineZh: "双子塔 · 豪华住宿",
    summary:
      "KLCC is the purpose-built city centre on the old Selangor Turf Club site, anchored by the 452-metre Petronas Twin Towers and the 20-hectare KLCC Park that Cesar Pelli laid out in front of them. It is the most polished and most walkable part of Kuala Lumpur: Suria KLCC and Avenue K for shopping, Aquaria and the Kuala Lumpur Convention Centre on the south side, and the widest concentration of five-star rooms in Malaysia. The trade-off is that KLCC eats like a shopping mall — the good street food is in Kampung Baru, 15 minutes' walk across the Saloma Link, or a short ride south to Bukit Bintang and Jalan Alor.",
    summaryZh:
      "KLCC 建在旧雪兰莪赛马场用地上，是规划出来的新市中心：452 米的双子塔，以及西萨·佩里设计的 20 公顷城中城公园。这里是吉隆坡最精致、最好步行的区域——阳光广场与 Avenue K 购物，南侧有水族馆和吉隆坡会议中心，也是全马五星级客房最密集的地方。代价是 KLCC 的餐饮基本等于商场餐饮：真正好吃的街头小吃在步行 15 分钟、穿过 Saloma 行人桥的甘榜峇鲁，或往南到武吉免登与亚罗街。",
    idealFor: ["First-time visitors", "Luxury travellers", "Couples", "Business and convention travellers", "Families"],
    idealForZh: ["第一次来", "高预算旅客", "情侣", "商务与参展旅客", "家庭"],
    priceTier: "$$$$",
  },
  {
    id: "bukit-bintang",
    destinationId: "kuala-lumpur",
    name: "Bukit Bintang",
    nameZh: "武吉免登",
    coordinates: {
      lat: 3.149154,
      lng: 101.7129531,
      confidence: "verified",
      coordNote:
        "OSM mall \"Pavilion Kuala Lumpur\" — Jalan Bukit Bintang, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). Pavilion is the retail anchor at the northern end of the Jalan Bukit Bintang strip.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 900,
    bestFor: [
      "Shopping: Pavilion, Fahrenheit88, Lot 10, Starhill Gallery and Sungai Wang",
      "Street food at Jalan Alor and the hawker courts inside Lot 10",
      "Mid-range to upper-upscale hotels on the doorstep of everything",
      "Nightlife — bars, clubs and live-music rooms on Changkat Bukit Bintang",
      "Walkability: KLCC, Chinatown and the monorail are all reachable on foot",
    ],
    weakFor: [
      "Quiet evenings and residential calm",
      "Cultural sightseeing (the historic sights are one stop away)",
      "Green space and nature",
      "Traffic — Jalan Bukit Bintang is permanently congested",
    ],
    bestForZh: [
      "购物：柏威年、Fahrenheit88、十号胡同商场、升禧艺廊与金河广场",
      "亚罗街与十号胡同熟食中心的街头小吃",
      "中档到中高端酒店就在门口",
      "夜生活——章卡武吉免登的酒吧、夜店与现场音乐",
      "步行友好：双子塔、茨厂街与单轨都能走到",
    ],
    weakForZh: [
      "安静的夜晚与住宅区氛围",
      "文化古迹（历史景点要坐一站）",
      "绿地与自然",
      "堵车——武吉免登路几乎永远在塞",
    ],
    scores: { beach: 0, nightlife: 5, food: 5, luxury: 4, nature: 1, accessibility: 5 },
    vibe: "Neon shopping canyon by day, hawker smoke and rooftop bars by night — the most walkable bang for the buck in KL",
    vibeZh: "白天是霓虹购物峡谷，晚上是大排档烟火与天台酒吧——全吉隆坡性价比最高的步行区",
    tagline: "Shopping · Street food",
    taglineZh: "购物 · 街头小吃",
    summary:
      "Bukit Bintang is the commercial and entertainment spine of central Kuala Lumpur, a kilometre of malls, hotels, hawker stalls and bars strung along Jalan Bukit Bintang and its cross streets. Pavilion KL and Starhill Gallery anchor the north, Lot 10 and Sungai Wang the middle, and Jalan Alor — the city's most famous open-air food street — runs parallel one block west. Changkat Bukit Bintang, a block of restored shophouses, is where the bars and clubs are. Almost everything a short-break visitor wants is inside a 15-minute walk, which is why the hotels here fill first.",
    summaryZh:
      "武吉免登是吉隆坡市中心的商业与娱乐主轴：武吉免登路及其横街串起一公里的商场、酒店、大排档与酒吧。北端是柏威年与升禧艺廊，中段是十号胡同商场与金河广场，西侧隔一条街就是全城最著名的露天食街亚罗街；再往北一个街区，修复骑楼组成的章卡武吉免登则是酒吧与夜店所在。短期旅客想要的东西几乎都在步行 15 分钟内，这也是这里酒店最先订满的原因。",
    idealFor: ["First-time visitors", "Shoppers", "Food lovers", "Groups of friends", "Nightlife seekers"],
    idealForZh: ["第一次来", "购物族", "爱吃的人", "朋友出行", "夜生活爱好者"],
    priceTier: "$$$",
  },
  {
    id: "chinatown-petaling-street",
    destinationId: "kuala-lumpur",
    name: "Chinatown / Petaling Street",
    nameZh: "茨厂街（唐人街）",
    coordinates: {
      lat: 3.1434549,
      lng: 101.6977498,
      confidence: "verified",
      coordNote:
        "OSM pedestrian way \"Petaling Street\" — Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). Point is mid-street, under the covered market canopy.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 900,
    bestFor: [
      "The Petaling Street market and its covered evening bazaar",
      "Old-school Chinese-Malaysian food: Hokkien mee, wantan mee, air mata kucing, bak kut teh",
      "Temples and clan houses — Sri Mahamariamman, Sin Sze Si Ya, Guan Di",
      "Budget and boutique hotels in restored shophouses",
      "Street photography: Kwai Chai Hong murals and the Jalan Panggung lanes",
    ],
    weakFor: [
      "Luxury resorts and resort facilities",
      "Quiet, low-key evenings",
      "Beach or green space",
      "Shopping other than the market and Central Market",
    ],
    bestForZh: [
      "茨厂街市场与有顶棚的夜市",
      "老派华人风味：福建面、云吞面、罗汉果龙眼水、肉骨茶",
      "庙宇与会馆——马里安曼印度庙、仙四师爷庙、关帝庙",
      "骑楼改造的平价与精品酒店",
      "街头摄影：鬼仔巷壁画与戏院巷一带",
    ],
    weakForZh: ["豪华度假设施", "安静的夜晚", "海滩或绿地", "除市场和中央艺术坊之外的购物"],
    scores: { beach: 0, nightlife: 3, food: 5, luxury: 2, nature: 1, accessibility: 4 },
    vibe: "Covered market lanes, red lanterns and incense smoke a few minutes' walk from the glass towers",
    vibeZh: "有顶棚的市场巷道、红灯笼与香火，离玻璃塔楼只有几分钟路",
    tagline: "Market lanes · Old KL",
    taglineZh: "市场巷弄 · 老吉隆坡",
    summary:
      "Chinatown grew up around the tin trade on the west bank of the Klang River and is still the densest concentration of pre-war shophouses in the city. Petaling Street, roofed over in 2003, is the market everyone comes for — counterfeit bags, T-shirts and cheap souvenirs by day, and a hawker strip that runs late into the night. Around it are the temples, clan associations and coffee shops that give the district its character, plus the Kwai Chai Hong mural lane behind Jalan Panggung. Hotels here are small, characterful and remarkably cheap for the location.",
    summaryZh:
      "唐人街围绕巴生河西岸的锡矿贸易发展起来，至今仍是全城战前骑楼最密集的地方。2003 年加盖顶棚的茨厂街是所有人都会来的市场：白天卖仿牌包、T 恤与便宜手信，入夜后大排档一直开到凌晨。周边还有庙宇、会馆与老咖啡店，戏院巷后方则是壁画巷鬼仔巷。这里的酒店小巧有味道，以这个位置来说便宜得出奇。",
    idealFor: ["Food lovers", "Budget-conscious travellers", "Photographers", "Culture-focused visitors", "Solo travellers"],
    idealForZh: ["爱吃的人", "控制预算的旅客", "摄影爱好者", "以文化为主的旅客", "独行旅客"],
    priceTier: "$$",
  },
  {
    id: "merdeka-colonial-core",
    destinationId: "kuala-lumpur",
    name: "Merdeka Square & the colonial core",
    nameZh: "独立广场与殖民核心区",
    coordinates: {
      lat: 3.1487691,
      lng: 101.6936377,
      confidence: "verified",
      coordNote:
        "OSM square \"Dataran Merdeka\" — Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The point is the centre of the square, in front of the Sultan Abdul Samad Building.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 900,
    bestFor: [
      "The Sultan Abdul Samad Building, the Royal Selangor Club and St Mary's Cathedral",
      "Museums: Islamic Arts Museum, National Museum, Textile Museum",
      "The Lake Gardens, the Butterfly Park and the Kuala Lumpur Bird Park",
      "Mosque architecture at Masjid Jamek and the National Mosque",
      "Quiet, low-rise evenings close to the river",
    ],
    weakFor: [
      "Nightlife and late-night dining",
      "Shopping malls",
      "Modern hotel inventory (very little has been built here since the 1980s)",
      "Street-food density — Chinatown next door is better",
    ],
    bestForZh: [
      "苏丹阿都沙末大厦、皇家雪兰莪俱乐部与圣玛丽教堂",
      "博物馆：伊斯兰艺术博物馆、国家博物馆、纺织博物馆",
      "湖滨公园、蝴蝶公园与吉隆坡飞禽公园",
      "占美清真寺与国家清真寺的建筑",
      "沿河低矮安静的夜晚",
    ],
    weakForZh: ["夜生活与深夜餐饮", "购物商场", "现代酒店供给（1980 年代后基本没再建）", "街头小吃密度不如隔壁茨厂街"],
    scores: { beach: 0, nightlife: 2, food: 3, luxury: 3, nature: 4, accessibility: 5 },
    vibe: "Moorish domes, a vast cricket-green square and the city's museum quarter, best seen early before the heat",
    vibeZh: "摩尔式圆顶、大片草坪广场与博物馆区，最好趁清早凉爽时走",
    tagline: "Merdeka Square · Museums",
    taglineZh: "独立广场 · 博物馆区",
    summary:
      "This is the administrative Kuala Lumpur the British built: the padang that became Dataran Merdeka, the Sultan Abdul Samad Building with its copper onion domes, the Royal Selangor Club, St Mary's Cathedral and the old railway station. South of it lie the National Mosque, the Islamic Arts Museum and the Lake Gardens — Perdana Botanical Gardens, the Bird Park and the Butterfly Park — so the district reads as one long heritage-and-green corridor. It is quiet at night and thin on restaurants, but it holds more of the city's history per square kilometre than anywhere else.",
    summaryZh:
      "这里是英国人留下的行政吉隆坡：由板球场变成的独立广场、铜色洋葱圆顶的苏丹阿都沙末大厦、皇家雪兰莪俱乐部、圣玛丽教堂与老火车站。往南是国家清真寺、伊斯兰艺术博物馆与湖滨公园一带——佩尔达纳植物园、飞禽公园与蝴蝶公园——整片区域像一条遗产与绿地长廊。夜里安静、餐厅稀少，但每平方公里的历史信息量是全城最高的。",
    idealFor: ["History and architecture lovers", "Museum-goers", "Photographers", "Couples", "Families"],
    idealForZh: ["历史与建筑爱好者", "爱逛博物馆的人", "摄影爱好者", "情侣", "家庭"],
    priceTier: "$$$",
  },
  {
    id: "chow-kit",
    destinationId: "kuala-lumpur",
    name: "Chow Kit & Jalan Tuanku Abdul Rahman",
    nameZh: "秋杰与端姑阿都拉曼路",
    coordinates: {
      lat: 3.1643853,
      lng: 101.6994536,
      confidence: "verified",
      coordNote:
        "OSM marketplace \"Chow Kit Market\" — Jalan Raja Alang, Kampung Baru, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 1200,
    bestFor: [
      "Wet-market mornings at Chow Kit and the Jalan Raja Alang food lanes",
      "Value and mid-market hotels with easy transport",
      "Malay, Indonesian and South Asian food at local prices",
      "Titiwangsa Lake Park and the Royal Selangor pewter visitor centre",
      "Seeing a working district rather than a tourist one",
    ],
    weakFor: [
      "Polished shopping and luxury retail",
      "Sightseeing on foot — the historic core is a ride away",
      "Quiet, sanitised streets",
      "Nightlife",
    ],
    bestForZh: [
      "秋杰巴刹的早市与拉惹阿郎路食街",
      "性价比与中端酒店，交通方便",
      "马来、印尼与南亚饮食，本地价格",
      "蒂蒂旺沙湖滨公园与皇家雪兰莪锡镴访客中心",
      "看一个真正在运转的街区，而不是观光区",
    ],
    weakForZh: ["精致购物与奢侈品零售", "步行观光——历史核心要坐车", "安静整洁的街道", "夜生活"],
    scores: { beach: 0, nightlife: 2, food: 5, luxury: 2, nature: 3, accessibility: 4 },
    vibe: "Wet market, textile shops and spice stalls — the KL that locals actually use, with Titiwangsa's lake at its north end",
    vibeZh: "湿巴刹、布匹店与香料摊——本地人真正在用的吉隆坡，北端就是蒂蒂旺沙湖",
    tagline: "Wet market · Local KL",
    taglineZh: "巴刹 · 本地吉隆坡",
    summary:
      "Chow Kit sits north of the historic core around the junction of Jalan Tuanku Abdul Rahman and Jalan Raja Alang. Its market is the city's largest fresh-produce and wet market, and the lanes around it fill with Malay, Indonesian and South Asian food stalls from early morning. Jalan Tuanku Abdul Rahman and Jalan Masjid India run south as a long, unfashionable but genuine shopping street of textiles, gold and electronics. It is not a pretty district — it is a working one, and the hotels are correspondingly cheap for the location.",
    summaryZh:
      "秋杰位于历史核心以北，围绕端姑阿都拉曼路与拉惹阿郎路交叉口展开。这里的巴刹是全城最大的生鲜湿货市场，周边巷弄从清晨起就摆满马来、印尼与南亚小吃摊。端姑阿都拉曼路与印度清真寺路往南延伸，是一条不时髦但很真实的购物街：布匹、金饰与电器。它不是漂亮的街区，而是正在运转的街区，因此酒店相对位置来说相当便宜。",
    idealFor: ["Budget travellers", "Food-focused travellers", "Repeat visitors", "Solo travellers", "Photographers"],
    idealForZh: ["预算型旅客", "以吃为主的旅客", "回头客", "独行旅客", "摄影爱好者"],
    priceTier: "$$",
  },
  {
    id: "kampung-baru",
    destinationId: "kuala-lumpur",
    name: "Kampung Baru",
    nameZh: "甘榜峇鲁",
    coordinates: {
      lat: 3.1613264,
      lng: 101.7065974,
      confidence: "verified",
      coordNote:
        "OSM station \"Kampung Baru\" — Jalan Sungai Baru, Kampung Baru, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The LRT station sits at the centre of the village.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 700,
    bestFor: [
      "Nasi lemak, soto and nasi campur at village prices",
      "Malay kampung houses surviving in the shadow of the towers",
      "Walking to KLCC across the Saloma Link in about 15 minutes",
      "Sunday night market on Jalan Raja Muda Musa",
      "An honest alternative to the mall-and-hotel belt next door",
    ],
    weakFor: [
      "Hotel inventory — almost none, and nothing luxury",
      "Shopping and nightlife",
      "Late-night options",
      "Green space and open views",
    ],
    bestForZh: [
      "椰浆饭、索多汤与杂饭，村落价格",
      "双子塔阴影下保留至今的马来高脚屋",
      "步行约 15 分钟经 Saloma 桥到双子塔",
      "拉惹慕沙路的周日夜市",
      "隔壁商场酒店带之外更真实的替代选择",
    ],
    weakForZh: ["酒店供给——几乎没有，也没有豪华酒店", "购物与夜生活", "深夜选择", "绿地与开阔视野"],
    scores: { beach: 0, nightlife: 3, food: 5, luxury: 1, nature: 2, accessibility: 4 },
    vibe: "A Malay village of timber houses and food stalls sitting one LRT stop from the Petronas Towers",
    vibeZh: "木屋与小吃摊组成的马来村落，离双子塔只有一站轻快铁",
    tagline: "Kampung food · Nasi lemak",
    taglineZh: "甘榜小吃 · 椰浆饭",
    summary:
      "Kampung Baru is the last large piece of traditional Malay settlement left in central Kuala Lumpur: a grid of single- and two-storey houses, mosques and food stalls on land reserved for Malay ownership since 1900, ringed on all sides by towers. It is a food district above all — Nasi Lemak Wanjo and the stalls along Jalan Raja Muda Musa and Jalan Raja Alang serve from early morning — and the Saloma Link pedestrian bridge now drops you into KLCC in a quarter of an hour. There is effectively nowhere to sleep here; the point is to eat and walk it.",
    summaryZh:
      "甘榜峇鲁是吉隆坡市中心最后一片成规模的传统马来聚落：一、两层高的住屋、清真寺与小吃摊排成网格，土地自 1900 年起保留给马来人持有，四周已被高楼包围。它首先是个吃的街区——旺姐椰浆饭以及拉惹慕沙路、拉惹阿郎路沿线的摊位从清早就开档；Saloma 行人桥让你 15 分钟就走回双子塔。这里基本上没有住宿，重点是来吃和走。",
    idealFor: ["Food lovers", "Budget-conscious travellers", "Culture-focused visitors", "Solo travellers", "Half-day visitors"],
    idealForZh: ["爱吃的人", "控制预算的旅客", "以文化为主的旅客", "独行旅客", "半天行程的旅客"],
    priceTier: "$",
  },
  {
    id: "brickfields-kl-sentral",
    destinationId: "kuala-lumpur",
    name: "Brickfields & KL Sentral",
    nameZh: "十五碑与吉隆坡中央车站",
    coordinates: {
      lat: 3.1341106,
      lng: 101.6865153,
      confidence: "verified",
      coordNote:
        "OSM station \"KL Sentral\" — Jalan Stesen Sentral, Seputeh, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). KL Sentral is the interchange for the KLIA Ekspres, KTM, LRT and monorail.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 1000,
    bestFor: [
      "Arriving and departing: KLIA Ekspres, KTM, LRT, monorail and the airport bus all meet here",
      "Little India's banana-leaf restaurants, sweet shops and 24-hour saree stores",
      "Business and transit-stop hotels at every price point",
      "The Buddhist temple at Brickfields and the Sri Kandaswamy Kovil",
      "Quick access to the museums and Lake Gardens on the KL Sentral–Muzium Negara axis",
    ],
    weakFor: [
      "Sightseeing on foot beyond Little India",
      "Green space and views",
      "Nightlife and evening buzz",
      "Leisure atmosphere — this is a transport district",
    ],
    bestForZh: [
      "进出城：机场快线、KTM、轻快铁、单轨与机场巴士都在此交汇",
      "小印度的香蕉叶饭、甜品店与 24 小时纱丽店",
      "商务与过境酒店，各价位都有",
      "十五碑的佛寺与斯里坎达斯瓦米兴都庙",
      "快速到国家博物馆与湖滨公园一带",
    ],
    weakForZh: ["小印度以外的步行观光", "绿地与景观", "夜生活与夜晚热闹程度", "休闲氛围——这里是交通区"],
    scores: { beach: 0, nightlife: 2, food: 4, luxury: 3, nature: 2, accessibility: 5 },
    vibe: "The city's front door: an interchange concourse wrapped in Little India's spice shops and banana-leaf canteens",
    vibeZh: "城市的玄关：交通枢纽大厅外就是小印度的香料店与香蕉叶饭馆",
    tagline: "Transport hub · Little India",
    taglineZh: "交通枢纽 · 小印度",
    summary:
      "Brickfields is the neighbourhood south of the Klang River that grew up around the railway workshops, and since 2001 it has also held KL Sentral, the station complex that replaced the old colonial terminus as the city's rail hub. The KLIA Ekspres reaches the airport non-stop from here, and the KTM Komuter, Kelana Jaya and Sri Petaling LRT lines plus the monorail all converge. Jalan Tun Sambanthan, the spine of Little India, is lined with banana-leaf restaurants and sweet shops. Because everything connects here, it is the most practical base for a short stay or an early flight.",
    summaryZh:
      "十五碑是巴生河以南、围绕铁路工场发展起来的街区；2001 年起，取代老火车站的吉隆坡中央车站也落户于此，成为全城铁路枢纽。机场快线从这里直达机场，KTM 通勤线、格拉那再也线与大城堡轻快铁、以及单轨都在此交汇。小印度主街敦善班丹路两侧是香蕉叶饭馆与甜品店。因为一切都在这里换乘，短期停留或赶早班机住这里最实际。",
    idealFor: ["Transit and short-stay travellers", "Business travellers", "Budget and mid-range travellers", "Food lovers", "Families"],
    idealForZh: ["过境与短期停留旅客", "商务旅客", "预算与中端旅客", "爱吃的人", "家庭"],
    priceTier: "$$$",
  },
  {
    id: "bangsar",
    destinationId: "kuala-lumpur",
    name: "Bangsar",
    nameZh: "孟沙",
    coordinates: {
      lat: 3.1276122,
      lng: 101.6790987,
      confidence: "verified",
      coordNote:
        "OSM station \"Bangsar\" — Jalan Bangsar, Bangsar, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The Kelana Jaya line station marks the eastern edge of the district.",
    },
    isStayBase: true,
    zoneType: "stay",
    radiusMeters: 1200,
    bestFor: [
      "Cafés, brunch and independent restaurants on Jalan Telawi",
      "Bars and a grown-up nightlife scene rather than clubs",
      "An expat-and-local residential feel minutes from KL Sentral",
      "Luxury and boutique stays away from the tourist core",
      "Sunday markets and the Bangsar Shopping Centre / Bangsar Village malls",
    ],
    weakFor: [
      "Walking to the historic sights — you need a Grab",
      "Street-food markets and wet markets",
      "Beach or park space",
      "First-time sightseeing convenience",
    ],
    bestForZh: [
      "特拉威路的咖啡馆、早午餐与独立餐厅",
      "酒吧与成熟向的夜生活，而不是夜店",
      "外籍与本地人混居的社区感，离中央车站几分钟",
      "离开观光核心的豪华与精品住宿",
      "周日市集与孟沙购物中心／孟沙村商场",
    ],
    weakForZh: ["步行到历史景点——需要打车", "街头小吃市场与湿巴刹", "海滩或公园", "第一次来观光的便利度"],
    scores: { beach: 0, nightlife: 4, food: 5, luxury: 4, nature: 2, accessibility: 3 },
    vibe: "Leafy residential streets with the city's best café-and-bar strip on Jalan Telawi",
    vibeZh: "绿荫住宅街，配全城最好的咖啡馆与酒吧一条街特拉威路",
    tagline: "Cafés · Bars",
    taglineZh: "咖啡馆 · 酒吧",
    summary:
      "Bangsar is the affluent residential district west of KL Sentral, built on the hills either side of Jalan Bangsar and Jalan Maarof. Its centre of gravity for visitors is Jalan Telawi, three parallel streets of cafés, brunch places, independent restaurants and bars that stay busy from morning to late. It is close enough to the centre to be convenient — ten minutes to KL Sentral, fifteen to Bukit Bintang by car — but far enough to be quiet at night. Hotel inventory is small and mostly upscale.",
    summaryZh:
      "孟沙是中央车站以西的高档住宅区，分布在孟沙路与马洛夫路两侧的坡地上。对旅客来说重心是特拉威路：三条平行的街道上全是咖啡馆、早午餐店、独立餐厅与酒吧，从早到晚都有人。它离市中心够近——到中央车站十分钟、到武吉免登车程十五分钟——又安静得下来。酒店不多，以中高端为主。",
    idealFor: ["Repeat visitors", "Couples", "Food and coffee lovers", "Long-stay travellers", "Travellers who want quiet nights"],
    idealForZh: ["回头客", "情侣", "美食与咖啡爱好者", "长住旅客", "想夜里安静的人"],
    priceTier: "$$$",
  },
  {
    id: "batu-caves-gombak",
    destinationId: "kuala-lumpur",
    name: "Batu Caves & Gombak",
    nameZh: "黑风洞与鹅唛",
    coordinates: {
      lat: 3.237449,
      lng: 101.6836621,
      confidence: "verified",
      coordNote:
        "OSM place_of_worship \"Sri Subramaniar Swamy Temple\" — To Dark Caves, Kampung Indian Settlement Batu Caves, Selayang, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM, locality \"Batu Caves\"). This is the temple at the foot of the 272 steps.",
    },
    isStayBase: false,
    zoneType: "day-trip",
    radiusMeters: 2000,
    bestFor: [
      "The 272-step climb to the Temple Cave and the 42.7 m Murugan statue",
      "Thaipusam, when the site draws over a million pilgrims",
      "A half-day trip that costs almost nothing and is 30 minutes from KL Sentral",
      "Rock climbing on the surrounding limestone crags",
    ],
    weakFor: [
      "Sleeping — there is no hotel inventory of interest",
      "Evening activity; the site is a morning trip",
      "Cool temperatures and shade — the steps are fully exposed",
      "Anyone who cannot manage steep stairs",
    ],
    bestForZh: [
      "登上 272 级台阶到神庙洞，看 42.7 米高的穆鲁干神像",
      "大宝森节，逾百万信徒聚集于此",
      "几乎不花钱、离中央车站 30 分钟的半天行程",
      "周边石灰岩岩壁的攀岩",
    ],
    weakForZh: ["住宿——没有值得住的酒店", "傍晚活动；这里是早上的行程", "凉爽与遮荫——台阶完全暴晒", "爬不了陡梯的人"],
    scores: { beach: 0, nightlife: 1, food: 2, luxury: 1, nature: 4, accessibility: 3 },
    vibe: "A limestone cave temple at the top of 272 painted steps, with macaques, pigeons and pilgrims",
    vibeZh: "272 级彩绘台阶之上的石灰岩洞庙，猴群、鸽子与朝圣者",
    tagline: "Cave temple · Day trip",
    taglineZh: "洞窟庙宇 · 一日游",
    summary:
      "Batu Caves is a limestone hill about 13 km north of central Kuala Lumpur whose largest cavern has been a Hindu shrine since around 1890, when K. Thamboosamy Pillai placed a Murugan shrine inside it. The climb is 272 steps past a 42.7-metre gilded statue of Lord Muruga, and the Temple Cave at the top is a cathedral-sized chamber open to the sky. It is a working place of worship, not a theme park: expect crowds, monkeys that will take food from your hand, and a strict no-short-shorts etiquette at the entrance to the steps.",
    summaryZh:
      "黑风洞是吉隆坡市中心以北约 13 公里的一座石灰岩山丘，最大的洞窟自 1890 年前后由 K. Thamboosamy Pillai 安置穆鲁干神龛起就是兴都教圣地。登顶要走过 272 级台阶，途中经过 42.7 米高的贴金穆鲁干神像；山顶的神庙洞是一座向天开口、教堂般大小的洞厅。这里是仍在运作的宗教场所，不是主题乐园：人多、猴子会抢食物，台阶入口对着装（不可穿超短裤）有严格要求。",
    idealFor: ["First-time visitors", "Photographers", "Culture-focused visitors", "Half-day visitors", "Families with older children"],
    idealForZh: ["第一次来", "摄影爱好者", "以文化为主的旅客", "半天行程的旅客", "孩子较大的家庭"],
    priceTier: "$",
  },
  {
    id: "bukit-jalil-cheras",
    destinationId: "kuala-lumpur",
    name: "Bukit Jalil & Cheras",
    nameZh: "武吉加里尔与蕉赖",
    coordinates: {
      lat: 3.0581312,
      lng: 101.6922194,
      confidence: "verified",
      coordNote:
        "OSM station \"Bukit Jalil\" — Jalan Merah Caga, Sri Petaling, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The LRT station is the practical anchor for the stadium and Bukit Jalil National Sports Complex.",
    },
    isStayBase: false,
    zoneType: "day-trip",
    radiusMeters: 2500,
    bestFor: [
      "Events at Bukit Jalil National Stadium and Axiata Arena",
      "Pavilion Bukit Jalil, one of the largest malls in the Klang Valley",
      "Terminal Bersepadu Selatan (TBS), the southern long-distance bus terminal",
      "Cheaper, newer hotels with easy LRT and KTM access",
    ],
    weakFor: [
      "Sightseeing — there is nothing historic here",
      "Nightlife and street food",
      "Walking anywhere interesting from a hotel",
      "First-time visitors who want the classic KL experience",
    ],
    bestForZh: [
      "武吉加里尔国家体育场与 Axiata 体育馆的活动",
      "柏威年武吉加里尔，巴生谷最大的商场之一",
      "南湖镇综合交通终站（TBS），南向长途巴士枢纽",
      "更新更便宜的酒店，轻快铁与 KTM 都方便",
    ],
    weakForZh: ["观光——这里没有历史景点", "夜生活与街头小吃", "从酒店步行去任何有趣的地方", "想体验经典吉隆坡的第一次来"],
    scores: { beach: 0, nightlife: 2, food: 3, luxury: 2, nature: 2, accessibility: 4 },
    vibe: "Stadium, megamall and bus terminal on the southern LRT line — functional, cheap and event-driven",
    vibeZh: "南线轻快铁上的体育场、巨型商场与长途车站——功能性、便宜、看活动而定",
    tagline: "Stadium · TBS",
    taglineZh: "体育场 · 南湖镇车站",
    summary:
      "The southern arc of Kuala Lumpur, spread across Bukit Jalil, Sri Petaling and Cheras, is where the city put its big-footprint infrastructure: the 87,000-seat National Stadium and the Bukit Jalil National Sports Complex, Pavilion Bukit Jalil, and Terminal Bersepadu Selatan, the modern terminal from which almost every long-distance bus leaves. It is not a sightseeing district, but it is a real one, with the Sri Petaling LRT line running straight through and hotel rates well below the centre — which makes it workable for a concert, a match or a 06:00 bus.",
    summaryZh:
      "吉隆坡南侧、横跨武吉加里尔、大城堡与蕉赖的这一片，是城市放大尺度基建的地方：8.7 万座的国家体育场与武吉加里尔国家体育中心、柏威年武吉加里尔，以及几乎所有长途巴士始发的南湖镇综合交通终站。这里不是观光区，但很真实：大城堡轻快铁线直穿其中，酒店价格明显低于市中心，看演唱会、看球赛或赶清晨六点的巴士都很实用。",
    idealFor: ["Event-goers", "Transit travellers", "Budget-conscious travellers", "Families", "Football and concert crowds"],
    idealForZh: ["看活动的人", "过境旅客", "控制预算的旅客", "家庭", "看球赛与演唱会的人"],
    priceTier: "$$",
  },
  {
    id: "petaling-jaya-subang-jaya",
    destinationId: "kuala-lumpur",
    name: "Petaling Jaya & Subang Jaya (Bandar Sunway)",
    nameZh: "八打灵再也与梳邦再也（双威城）",
    coordinates: {
      lat: 3.1050473,
      lng: 101.6471091,
      confidence: "verified",
      coordNote:
        "OSM retail \"Amcorp Mall\" — Persiaran Barat, Section 52, Petaling Jaya, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM). Amcorp Mall is beside the Taman Jaya LRT station, in the middle of the PJ State commercial core.",
    },
    isStayBase: false,
    zoneType: "day-trip",
    radiusMeters: 4000,
    bestFor: [
      "Sunway Lagoon water park and Sunway Pyramid's indoor ice rink and mall",
      "Nasi lemak at Village Park and the SS15 café and bubble-tea strip",
      "Business travel to PJ's office towers — a genuinely large corporate market",
      "Cheaper, newer hotels with direct LRT and KTM links to KL",
    ],
    weakFor: [
      "Sightseeing — PJ is offices and housing estates",
      "Historic or cultural attractions",
      "Walkability between the different sections",
      "Tourist nightlife",
    ],
    bestForZh: [
      "双威水上乐园与双威金字塔商场、室内溜冰场",
      "Village Park 的椰浆饭与 SS15 的咖啡馆、奶茶街",
      "到八打灵再也写字楼的商务出行——这里是很大的企业市场",
      "更新更便宜的酒店，轻快铁与 KTM 直达吉隆坡",
    ],
    weakForZh: ["观光——八打灵再也是写字楼与住宅区", "历史或文化景点", "各区之间不好步行", "游客向的夜生活"],
    scores: { beach: 0, nightlife: 3, food: 4, luxury: 3, nature: 2, accessibility: 4 },
    vibe: "The Klang Valley's original satellite city: office towers, planned sections and the theme-park resort at Bandar Sunway",
    vibeZh: "巴生谷最早的卫星城：写字楼、规划整齐的分区，以及双威城的主题乐园度假区",
    tagline: "Suburbs · Sunway Lagoon",
    taglineZh: "卫星城 · 双威水上乐园",
    summary:
      "Petaling Jaya was Malaysia's first planned satellite town, laid out in the 1950s to take pressure off Kuala Lumpur, and it has since merged with Subang Jaya and Bandar Sunway into a continuous urban belt along the Federal Highway. For travellers it means three things: the Sunway Lagoon water park and its attached resort hotels at Bandar Sunway, the PJ State commercial core around Amcorp Mall and Jalan Barat with its business hotels, and a dense residential food scene — Village Park's nasi lemak in Damansara Utama and the SS15 café strip are the best known. It is 20–40 minutes from central KL by LRT or road.",
    summaryZh:
      "八打灵再也是马来西亚第一个规划卫星城，1950 年代为疏解吉隆坡压力而建，如今已与梳邦再也、双威城连成沿联邦大道的连续城区。对旅客来说有三件事：双威城的水上乐园与配套度假酒店；以 Amcorp Mall、巴勒路一带为中心、聚集商务酒店的 PJ State 商业核心；以及密集的住宅区餐饮——白沙罗乌达马的 Village Park 椰浆饭与 SS15 咖啡馆街最有名。搭轻快铁或开车到吉隆坡市中心约 20–40 分钟。",
    idealFor: ["Families with children", "Business travellers", "Budget-conscious travellers", "Theme-park visitors", "Food lovers"],
    idealForZh: ["带小孩的家庭", "商务旅客", "控制预算的旅客", "主题乐园游客", "爱吃的人"],
    priceTier: "$$$",
  },
  {
    id: "putrajaya",
    destinationId: "kuala-lumpur",
    name: "Putrajaya",
    nameZh: "布城（布特拉再也）",
    coordinates: {
      lat: 2.9386157,
      lng: 101.6924205,
      confidence: "verified",
      coordNote:
        "OSM government building \"Perdana Putra\" — Laluan Laman Putra 1, Precinct 1, Putrajaya, Federal Territory of Putrajaya, resolved with scripts/lookup-place.mjs (Photon/OSM). Perdana Putra is the Prime Minister's Office on the main axis of the administrative core.",
    },
    isStayBase: false,
    zoneType: "day-trip",
    radiusMeters: 3000,
    bestFor: [
      "The pink Putra Mosque and the Perdana Putra axis",
      "The Seri Wawasan, Seri Saujana and Seri Gemilang bridges",
      "Putrajaya Lake cruises and the lakeside cycle path",
      "Photography — the whole city is a designed composition",
      "A half-day escape from KL's traffic, 30 minutes out",
    ],
    weakFor: [
      "Nightlife and evening buzz — the city empties after office hours",
      "Street food and markets",
      "Walkability in the heat; the precincts are far apart",
      "Anyone wanting old-city texture",
    ],
    bestForZh: [
      "粉红清真寺（布特拉清真寺）与首相署轴线",
      "斯里瓦瓦桑桥、斯里绍嘉娜桥与斯里格米朗桥",
      "布城湖游船与环湖自行车道",
      "摄影——整座城市就是一件规划作品",
      "离吉隆坡 30 分钟、躲开堵车的半天行程",
    ],
    weakForZh: ["夜生活与夜晚热闹——下班后城市就空了", "街头小吃与市场", "炎热天气下步行；各区相距很远", "想要老城肌理的人"],
    scores: { beach: 0, nightlife: 1, food: 2, luxury: 3, nature: 4, accessibility: 3 },
    vibe: "A planned garden capital of boulevards, bridges and monumental domes, built around an artificial lake",
    vibeZh: "围绕人工湖规划的园林首都：大道、桥梁与纪念性圆顶",
    tagline: "Pink mosque · Planned city",
    taglineZh: "粉红清真寺 · 规划之城",
    summary:
      "Putrajaya is Malaysia's federal administrative capital, carved out of the jungle south of Kuala Lumpur from 1995 and named after the first prime minister, Tunku Abdul Rahman Putra. It is a garden city in the literal sense: 38% of its area is green space, built on an axis running from Perdana Putra down to the pink Putra Mosque and out across Putrajaya Lake on a series of deliberately designed bridges. Almost nothing here is old, and almost nothing is aimed at tourists, which is exactly its appeal — the scale, the emptiness and the symmetry. The KLIA Transit and MRT Putrajaya Line both reach it.",
    summaryZh:
      "布城是马来西亚的联邦行政首都，1995 年起从吉隆坡南面的丛林里规划建起，以第一任首相东姑阿都拉曼·布特拉命名。它是字面意义上的花园城市：38% 的用地是绿地，城市沿一条轴线从首相署延伸到粉红色的布特拉清真寺，再通过一系列刻意设计的桥梁跨过布城湖。这里几乎没有老建筑，也几乎不为游客而建，而这正是它的看点——尺度、空旷与对称。机场支线（KLIA Transit）与捷运布城线都能到。",
    idealFor: ["Photographers", "Couples", "Architecture lovers", "Families", "Half-day visitors"],
    idealForZh: ["摄影爱好者", "情侣", "建筑爱好者", "家庭", "半天行程的旅客"],
    priceTier: "$$$",
  },
  {
    id: "genting-highlands",
    destinationId: "kuala-lumpur",
    name: "Genting Highlands",
    nameZh: "云顶高原",
    coordinates: {
      lat: 3.4150834,
      lng: 101.7885199,
      confidence: "verified",
      coordNote:
        "OSM gondola \"Awana Skyway\" — Genting Grand, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM, locality \"Selangor\"). The upper Awana Skyway station stands in the resort complex itself, so it anchors the zone better than the lower Gohtong Jaya station.",
    },
    isStayBase: false,
    zoneType: "day-trip",
    radiusMeters: 2000,
    bestFor: [
      "The Awana SkyWay and Genting SkyWay cable cars over the rainforest",
      "Genting SkyWorlds theme park and the indoor Skytropolis funfair",
      "Cool hill air — 1,700 m up, 10–15°C below Kuala Lumpur",
      "Casino, shows and the First World Plaza mall complex",
      "A day trip that feels like a different country, one hour from KL",
    ],
    weakFor: [
      "Quiet, authentic Malaysia — this is a purpose-built resort",
      "Value eating and local food",
      "Anyone prone to motion sickness on winding roads or cable cars",
      "Clear views — the summit is in cloud for much of the year",
    ],
    bestForZh: [
      "穿越雨林上山的阿娃娜缆车与云顶缆车",
      "云顶天城世界主题乐园与室内 Skytropolis 游乐园",
      "山上凉空气——海拔 1,700 米，比吉隆坡低 10–15°C",
      "赌场、演出与第一世界广场商业群",
      "离吉隆坡一小时、感觉像出国的行程",
    ],
    weakForZh: ["安静真实的马来西亚——这里是专为度假而建", "平价餐饮与本地小吃", "容易晕车晕缆车的人", "清晰的视野——山顶一年中大半时间在云里"],
    scores: { beach: 0, nightlife: 3, food: 3, luxury: 3, nature: 4, accessibility: 3 },
    vibe: "A resort city in the clouds: cable cars, theme park, casino and rainforest all at 1,700 m",
    vibeZh: "云上的度假城：缆车、主题乐园、赌场与雨林，全在 1,700 米高处",
    tagline: "Cable car · Theme park",
    taglineZh: "缆车 · 主题乐园",
    summary:
      "Genting Highlands is a 1,700-metre resort complex on the Titiwangsa range about 35 km north-east of Kuala Lumpur, built from 1965 by the Lim family's Genting Group. Two cable car systems climb to it — the older Genting SkyWay from Gohtong Jaya and the newer Awana SkyWay from the Awana transport hub — and both run over primary rainforest with views back down the valley. At the top is a dense cluster of hotels, the Genting SkyWorlds theme park, the indoor Skytropolis funfair, a casino and the First World Plaza malls. It is Singapore's and KL's default family hill break, and it is entirely artificial — which is either the point or the problem, depending on the traveller.",
    summaryZh:
      "云顶高原是蒂蒂旺沙山脉上海拔 1,700 米的度假综合体，位于吉隆坡东北约 35 公里，1965 年起由林氏家族的云顶集团开发。两条缆车线可上山——较旧的云顶缆车从梧桐再也出发，较新的阿娃娜缆车从阿娃娜交通枢纽出发——都跨越原始雨林，可回望山谷。山顶是密集的酒店群、云顶天城世界主题乐园、室内 Skytropolis 游乐园、赌场与第一世界广场商业群。它是新加坡与吉隆坡家庭度假的默认选择，也完全是人造的——这一点既可能是卖点，也可能是问题。",
    idealFor: ["Families with children", "Theme-park visitors", "Couples", "Groups of friends", "Anyone escaping the heat"],
    idealForZh: ["带小孩的家庭", "主题乐园游客", "情侣", "朋友出行", "想避暑的人"],
    priceTier: "$$",
  },
  {
    id: "port-klang-klang",
    destinationId: "kuala-lumpur",
    name: "Klang & Port Klang",
    nameZh: "巴生与巴生港",
    coordinates: {
      lat: 3.0430935,
      lng: 101.4496718,
      confidence: "verified",
      coordNote:
        "OSM station \"Klang\" — Jalan Stesen, Kampung Atap, Klang, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM). The KTM Komuter station is the anchor for the old town centre.",
    },
    isStayBase: false,
    zoneType: "day-trip",
    radiusMeters: 3000,
    bestFor: [
      "Bak kut teh — Klang is where the dish comes from, and the shophouses on Jalan Besar serve it from breakfast",
      "Little India on Jalan Tengku Kelana, one of the largest in Malaysia",
      "The royal town's colonial shophouses and the Sultan Sulaiman Royal Mosque",
      "Port Klang, the country's busiest port terminal, with ferries to Pulau Ketam and Indonesia",
    ],
    weakFor: [
      "Sightseeing beyond the food and the old town",
      "Hotels — there is nothing here worth basing in",
      "Evening activity; the bak kut teh trade is a morning one",
      "Anyone without a car or patience for KTM timings",
    ],
    bestForZh: [
      "肉骨茶——巴生是这道菜的发源地，大马路的老店从早餐就开始卖",
      "东姑格拉纳路的小印度，全马最大的小印度之一",
      "皇城的殖民骑楼与苏丹苏莱曼皇家清真寺",
      "巴生港——全国最繁忙的港口，有往吉胆岛与印尼的渡轮",
    ],
    weakForZh: ["美食与老城之外的观光", "酒店——没有值得作为基地的选择", "傍晚活动；肉骨茶是早上的生意", "没有车、又不耐烦等 KTM 的人"],
    scores: { beach: 1, nightlife: 2, food: 5, luxury: 1, nature: 2, accessibility: 3 },
    vibe: "A working port and royal town where bak kut teh is breakfast and the shophouses have not been prettified",
    vibeZh: "还在运转的港口与皇城：肉骨茶是早餐，骑楼没有被美化",
    tagline: "Bak kut teh · Port town",
    taglineZh: "肉骨茶 · 港口老城",
    summary:
      "Klang is the royal town and former capital of Selangor, 32 km west of Kuala Lumpur at the mouth of the Klang River, and Port Klang at its seaward end is the busiest container port in Malaysia. The town is famous for two things: bak kut teh — the peppery pork-rib broth invented here for Hokkien labourers, still served from 07:00 in the Jalan Besar shophouses — and Little India on Jalan Tengku Kelana, a kilometre of saree shops and banana-leaf restaurants. Between them are the colonial buildings of the old royal capital. It is a half-day food trip, not a resort destination.",
    summaryZh:
      "巴生是雪兰莪的皇城与旧首府，位于吉隆坡以西 32 公里的巴生河口，出海口一带的巴生港是马来西亚最繁忙的集装箱港。让这座城出名的是两件事：肉骨茶——当年为福建劳工发明、胡椒味浓的排骨汤，至今大马路的老店早上七点就开卖；以及东姑格拉纳路的小印度，一公里长的纱丽店与香蕉叶饭馆。两者之间散落着旧皇城的殖民建筑。这是一趟半天的觅食之旅，不是度假地。",
    idealFor: ["Food lovers", "Repeat visitors", "Photographers", "Half-day visitors", "Travellers with a car"],
    idealForZh: ["爱吃的人", "回头客", "摄影爱好者", "半天行程的旅客", "自驾的旅客"],
    priceTier: "$",
  },
];

/** The 14 areas, exported for the registry and attached to the destination seed. */
export const areas: AreaSeed[] = areasList;

export const destination: DestinationSeed = {
  id: "kuala-lumpur",
  name: "Kuala Lumpur",
  nameZh: "吉隆坡",
  country: "Malaysia",
  countryZh: "马来西亚",
  countryCode: "MY",
  flag: "🇲🇾",
  region: "malaysia",
  status: "reference",
  tagline: "Twin towers, street food and the Klang Valley",
  taglineZh: "双子塔、街头小吃与巴生谷",
  description:
    "Malaysia's federal capital and the core of the Klang Valley conurbation, spread across a basin between the Titiwangsa range and the Strait of Malacca. Kuala Lumpur compresses the Petronas Twin Towers and the KLCC park, the colonial core around Merdeka Square, the shophouse grid of Chinatown and the Malay enclave of Kampung Baru into a centre that the LRT, MRT and monorail make genuinely navigable without a car. Beyond the city limits, a single day reaches the Hindu cave temple at Batu Caves, the garden city of Putrajaya, the cable cars, theme park and casino of Genting Highlands, and the port and bak kut teh shophouses of Klang. It is also Malaysia's deepest hotel market: every major loyalty programme trades here, often several times over.",
  descriptionZh:
    "马来西亚联邦首都，也是巴生谷都会圈的核心，坐落在蒂蒂旺沙山脉与马六甲海峡之间的盆地。吉隆坡把双子塔与城中城公园、独立广场一带的殖民核心、茨厂街的骑楼街区与马来村落甘榜峇鲁压缩在一个紧凑的市中心里，轻快铁、捷运与单轨让不开车也能玩得顺。出了市区，一天之内还能到黑风洞的印度教洞窟庙宇、花园城市布城、云顶高原的缆车、主题乐园与赌场，以及巴生港与巴生的肉骨茶老店。这里也是马来西亚酒店市场最深的一座城市：五大常客计划全都有物业，而且往往不止一家。",
  coordinates: {
    lat: 3.139,
    lng: 101.6869,
    confidence: "approximate",
    coordNote:
      "Kuala Lumpur city-centre reference point used for the destination card and the initial map camera, between Merdeka Square and KLCC. Not a surveyed OSM object — the areas, places and hotels each carry their own verified coordinate.",
  },
  mapView: { center: [3.139, 101.6869], zoom: 11 },
  // Widened twice from the suggested [[2.95, 101.55], [3.35, 101.85]]. The box
  // has to hold (a) the day zones the brief asks for — Putrajaya (2.9386),
  // Genting Highlands (3.4151, 101.7885), Klang (3.0431, 101.4497) and Port
  // Klang — and (b) Kuala Lumpur International Airport itself, which sits at
  // 2.7448, 101.7074, about 45 km south of the city. Anything tighter leaves an
  // airport or a day zone outside the destination.
  mapBounds: [
    [2.7, 101.42],
    [3.44, 101.83],
  ],
  recommendedDays: { min: 3, ideal: 4, max: 6 },
  tags: ["City", "Food", "Culture", "Shopping", "Nightlife", "Day trips"],
  bestFor: ["Street food", "City sightseeing", "Shopping", "Culture", "Day trips", "Nightlife"],
  bestForZh: ["街头小吃", "城市观光", "购物", "文化", "一日游", "夜生活"],
  currency: "MYR",
  timezone: "Asia/Kuala_Lumpur",
  language: "Malay (Bahasa Malaysia); English is widely spoken, and Cantonese and Mandarin in the Chinese districts",
  visaNote:
    "Singapore passport holders enter Malaysia visa-free as ASEAN nationals and are normally granted a 30-day social visit pass on arrival, with a passport valid for at least six months. Rules and permitted lengths change — confirm with the Malaysian Immigration Department before travelling.",
  originNotes: [
    "Singapore–Kuala Lumpur is one of the busiest air routes in the world. Non-stop Changi–KUL flights take roughly 60–75 minutes and run through the day on Scoot, AirAsia, Malaysia Airlines, Batik Air and Jetstar Asia.",
    "Subang SkyPark (IATA SZB, OSM aerodrome 3.1322924, 101.550697) is Kuala Lumpur's second airport, on the city's western edge about 25–35 minutes from KL Sentral by road. It handles a limited set of turboprop and regional services rather than the main Singapore shuttle, so check which airport a booking actually uses before leaving.",
    "From KUL, the KLIA Ekspres train runs non-stop to KL Sentral in about 28 minutes; a Grab or taxi into the centre takes 45–75 minutes depending on traffic. The train is almost always the faster choice at peak hours.",
    "Inside the city the LRT, MRT, monorail and KTM Komuter are cheap and reach KLCC, Bukit Bintang, Chinatown, Merdeka Square and KL Sentral. Touch 'n Go cards work across all of them, and Grab is widely available for cross-town hops.",
    "Malaysia is a Muslim-majority country: dress modestly at mosques and temples (robes are lent at the National Mosque and Putra Mosque), and most Malay-run restaurants are halal. Alcohol is served openly in bars and non-halal restaurants in the city centre.",
    "The Klang Valley has its own wet seasons rather than one — afternoon thunderstorms are common year-round, and the heaviest rain usually falls between March–April and September–November. Plan outdoor sights for the morning.",
  ],
  airports: [
    {
      id: "kuala-lumpur-international-airport",
      code: "KUL",
      name: "Kuala Lumpur International Airport (Lapangan Terbang Antarabangsa Kuala Lumpur)",
      nameZh: "吉隆坡国际机场",
      city: "Sepang, Selangor, Malaysia",
      coordinates: {
        lat: 2.7448046,
        lng: 101.707448,
        confidence: "verified",
        coordNote:
          "OSM aerodrome \"Kuala Lumpur International Airport\" (KLIA Departure, Sepang, Selangor), resolved with scripts/lookup-place.mjs — Photon/OSM. Matches the published aerodrome reference point for KUL.",
      },
      role: "primary",
      legacyRouteFromOrigin: {
        originCityId: "singapore",
        direct: true,
        flightMinutes: { min: 60, max: 75 },
        airlines: ["Scoot", "AirAsia", "Malaysia Airlines", "Batik Air", "Jetstar Asia"],
        note: "Direct SIN–KUL service is operated by several carriers on a shuttle-like frequency; the scheduled block is about 60–75 minutes. Ground time from KUL to the city is the bigger variable — the KLIA Ekspres takes about 28 minutes to KL Sentral, while road transfers run 45–75 minutes in traffic.",
      },
    },
    {
      id: "subang-skypark-airport",
      code: "SZB",
      name: "Sultan Abdul Aziz Shah Airport (Subang SkyPark)",
      nameZh: "苏丹阿都阿兹沙机场（梳邦机场）",
      city: "Subang, Selangor, Malaysia",
      coordinates: {
        lat: 3.1322924,
        lng: 101.550697,
        confidence: "verified",
        coordNote:
          "OSM aerodrome \"Sultan Abdul Aziz Shah Airport\", Terminal 3, Section U3, Shah Alam, Selangor, resolved with scripts/lookup-place.mjs — Photon/OSM.",
      },
      role: "secondary",
    },
  ],
  areas: areasList,
  provenance: {
    kind: "seed-static" as const,
    sources: [
      "City and airport coordinates: OpenStreetMap aerodrome objects for Kuala Lumpur International Airport (KUL) and Sultan Abdul Aziz Shah Airport (SZB), resolved with scripts/lookup-place.mjs (Photon/OSM).",
      "Area, hotel and place coordinates: OpenStreetMap objects resolved by name with scripts/lookup-place.mjs (Photon/OSM first, Overpass second, Nominatim last; 30 km distance gate, name gate and locality gate). One record, the old Kuala Lumpur Railway Station, was resolved through the Overpass API directly and carries its OSM way id.",
      "Each record keeps its individual source in its coordNote field.",
    ],
    reviewedOn: "2026-01-01",
    notes:
      "Kuala Lumpur federal territory plus the Klang Valley day zones (Petaling Jaya/Subang Jaya, Putrajaya, Genting Highlands, Klang/Port Klang). 14 areas, 14 hotels and 40 places. Every hotel was checked against an OSM object tagged as a trading hotel; Conrad Kuala Lumpur and Canopy by Hilton Kuala Lumpur were rejected because the only OSM objects carry construction or former-branding tags.",
  },
};


export const hotels: HotelSeed[] = [
  {
    id: "st-regis-kuala-lumpur",
    name: "The St. Regis Kuala Lumpur",
    nameZh: "吉隆坡瑞吉酒店",
    destinationId: "kuala-lumpur",
    areaId: "brickfields-kl-sentral",
    hotelGroup: "marriott",
    brand: "St. Regis",
    brandId: "st-regis",
    coordinates: {
      lat: 3.1366351,
      lng: 101.6887576,
      confidence: "verified",
      coordNote:
        "OSM hotel \"The St. Regis Kuala Lumpur\" — Jalan Stesen Sentral 2, KL Sentral, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$$",
    priceTierBasis:
      "Ultra-luxury positioning (St. Regis brand tier, in the KL Sentral integrated development) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Couple", "Family"],
    beachAccess: "none",
    beachAccessNote: "City hotel inside the KL Sentral development; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 45, minutesMax: 75, confidence: "approximate" },
    description:
      "Marriott's ultra-luxury flag in Kuala Lumpur, part of the KL Sentral integrated development and the only St. Regis in Malaysia. It opened in 2016 with 208 rooms and suites, a butler service on every floor, an art collection that includes works by Fernando Botero, and direct covered access to KL Sentral — which makes it the fastest luxury hotel to reach from the airport by KLIA Ekspres.",
    descriptionZh:
      "万豪在吉隆坡的超豪华招牌，位于吉隆坡中央车站综合发展区内，也是全马唯一的瑞吉。2016 年开业，208 间客房与套房，每层配管家服务，公共空间收藏包括费尔南多·博特罗在内的艺术品；有连廊直通中央车站，是搭机场快线抵达最快的豪华酒店。",
    loyaltyProgramme: "Marriott Bonvoy",
    roomCount: 208,
    officialUrl: "https://www.marriott.com/en-us/hotels/kulxr-the-st-regis-kuala-lumpur/overview/",
  },
  {
    id: "ritz-carlton-kuala-lumpur",
    name: "The Ritz-Carlton, Kuala Lumpur",
    nameZh: "吉隆坡丽思卡尔顿酒店",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    hotelGroup: "marriott",
    brand: "Ritz-Carlton",
    brandId: "ritz-carlton",
    coordinates: {
      lat: 3.1469728,
      lng: 101.7153426,
      confidence: "verified",
      coordNote:
        "OSM hotel \"The Ritz-Carlton, Kuala Lumpur\" — Jalan Imbi, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$$",
    priceTierBasis:
      "Ultra-luxury positioning (Ritz-Carlton brand tier, Jalan Imbi/Bukit Bintang) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Couple", "Family"],
    beachAccess: "none",
    beachAccessNote: "City hotel beside Starhill Gallery in Bukit Bintang; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "The Ritz-Carlton occupies a tower on Jalan Imbi at the northern edge of Bukit Bintang, connected to Starhill Gallery and a short walk from Pavilion KL. It is the brand's Malaysian flagship, with 365 rooms and suites, a large spa and the Library restaurant. Its position is the selling point: you are inside the shopping and dining district rather than a taxi ride from it.",
    descriptionZh:
      "丽思卡尔顿位于武吉免登北缘的燕美路，与升禧艺廊相连，步行可到柏威年广场，是品牌在马来西亚的旗舰，有 365 间客房与套房、大型水疗与 Library 餐厅。它的最大卖点就是位置：你人已经在购物与餐饮区里，而不用打车过去。",
    loyaltyProgramme: "Marriott Bonvoy",
    roomCount: 365,
    officialUrl: "https://www.marriott.com/en-us/hotels/kulrz-the-ritz-carlton-kuala-lumpur/overview/",
  },
  {
    id: "w-kuala-lumpur",
    name: "W Kuala Lumpur",
    nameZh: "吉隆坡 W 酒店",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    hotelGroup: "marriott",
    brand: "W Hotels",
    brandId: "w-hotels",
    coordinates: {
      lat: 3.1585832,
      lng: 101.7093619,
      confidence: "verified",
      coordNote:
        "OSM hotel \"W Kuala Lumpur\" — Jalan Ampang, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$$",
    priceTierBasis:
      "Ultra-luxury positioning (W brand tier, Jalan Ampang facing the Petronas Towers) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Nightlife", "Couple", "Friends"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Ampang beside the KLCC park; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "W Kuala Lumpur opened in 2018 on Jalan Ampang directly opposite the Petronas Twin Towers, with 150 rooms and suites and the brand's usual heavy design signature. Its Wet Deck pool and WooBar look straight at the towers, which makes it the most photogenic of the KLCC hotels. It is the obvious pick for travellers who want the nightlife side of Marriott with the postcard view.",
    descriptionZh:
      "吉隆坡 W 酒店 2018 年开业，位于安邦路，正对双子塔，150 间客房与套房，设计语汇一如品牌惯有的强烈。Wet Deck 泳池与 WooBar 直视双子塔，是 KLCC 一带最适合拍照的酒店。想在万豪体系里同时要夜生活感和明信片景观的旅客，选它最直接。",
    loyaltyProgramme: "Marriott Bonvoy",
    roomCount: 150,
    officialUrl: "https://www.marriott.com/en-us/hotels/kulwh-w-kuala-lumpur/overview/",
  },
  {
    id: "jw-marriott-hotel-kuala-lumpur",
    name: "JW Marriott Hotel Kuala Lumpur",
    nameZh: "吉隆坡 JW 万豪酒店",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    hotelGroup: "marriott",
    brand: "JW Marriott",
    brandId: "jw-marriott",
    coordinates: {
      lat: 3.1479713,
      lng: 101.7138511,
      confidence: "verified",
      coordNote:
        "OSM hotel \"JW Marriott Hotel Kuala Lumpur\" — Jalan Bukit Bintang, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$$",
    priceTierBasis:
      "Luxury positioning (JW Marriott brand tier, Jalan Bukit Bintang) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Couple", "Family", "Food"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Bukit Bintang, above the Pavilion retail podium; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "The JW Marriott sits on Jalan Bukit Bintang next to Pavilion KL and is physically joined to the mall's retail podium, which is why it is the default address for shopping-led stays. 738 rooms over 26 floors, an outdoor pool deck facing the Bukit Bintang skyline, and five restaurants. Rooms on the upper floors of the north wing look toward the Petronas Towers.",
    descriptionZh:
      "JW 万豪就在武吉免登路柏威年广场旁，并与商场裙楼相连，因此是购物型住宿的默认选择。26 层共 738 间客房，室外泳池平台朝向武吉免登天际线，另有五家餐厅。北翼高楼层可望见双子塔。",
    loyaltyProgramme: "Marriott Bonvoy",
    roomCount: 738,
    officialUrl: "https://www.marriott.com/en-us/hotels/kuldt-jw-marriott-hotel-kuala-lumpur/overview/",
  },
  {
    id: "hilton-kuala-lumpur",
    name: "Hilton Kuala Lumpur",
    nameZh: "吉隆坡希尔顿酒店",
    destinationId: "kuala-lumpur",
    areaId: "brickfields-kl-sentral",
    hotelGroup: "hilton",
    brand: "Hilton",
    brandId: "hilton",
    coordinates: {
      lat: 3.1352656,
      lng: 101.6857595,
      confidence: "verified",
      coordNote:
        "OSM hotel \"Hilton Kuala Lumpur\" — Jalan Stesen Sentral, Bangsar, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The address suburb tag reads Bangsar but the tower is in the KL Sentral complex.",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Upper-upscale positioning (Hilton brand tier, KL Sentral integrated development) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["City", "Luxury", "Family", "Couple"],
    beachAccess: "none",
    beachAccessNote: "City hotel in the KL Sentral development; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 45, minutesMax: 75, confidence: "approximate" },
    description:
      "Hilton Kuala Lumpur has stood in the KL Sentral complex since 2004 and remains the programme's flagship in the city: 510 rooms over 34 floors, a large outdoor pool and one of the biggest executive-lounge footprints in Malaysia. It shares the block with Le Méridien and is a two-minute covered walk from the KLIA Ekspres platform, which is the practical reason to stay here.",
    descriptionZh:
      "吉隆坡希尔顿 2004 年进驻中央车站综合体，至今仍是希尔顿在本市的旗舰：34 层共 510 间客房、大型室外泳池，以及全马面积数一数二的行政酒廊。它与艾美同属一个街区，有连廊两分钟到机场快线月台——这是住这里最实际的理由。",
    loyaltyProgramme: "Hilton Honors",
    roomCount: 510,
    officialUrl: "https://www.hilton.com/en/hotels/kulklhi-hilton-kuala-lumpur/",
  },
  {
    id: "doubletree-by-hilton-kuala-lumpur",
    name: "DoubleTree by Hilton Hotel Kuala Lumpur",
    nameZh: "吉隆坡希尔顿逸林酒店",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    hotelGroup: "hilton",
    brand: "DoubleTree by Hilton",
    brandId: "doubletree",
    coordinates: {
      lat: 3.1617227,
      lng: 101.719828,
      confidence: "verified",
      coordNote:
        "OSM hotel \"DoubleTree by Hilton Hotel Kuala Lumpur\" — Jalan Tun Razak, Kampung Datuk Keramat, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Upscale positioning (DoubleTree brand tier, Jalan Tun Razak on the edge of the city centre) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["City", "Family", "Couple", "Food"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Tun Razak, north-east of KLCC; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 55, minutesMax: 90, confidence: "approximate" },
    description:
      "The DoubleTree is on Jalan Tun Razak at the north-eastern corner of the city centre, a ten-minute drive from KLCC and within walking distance of the embassies and hospitals along the same road. It is a full-service Hilton-family hotel with 250-odd rooms, a pool and the Makan Kitchen all-day restaurant, and it usually prices below the KLCC five-stars while still being inside the centre.",
    descriptionZh:
      "逸林位于市中心东北角的敦拉萨路，到双子塔车程约十分钟，步行范围内是同一路段的大使馆与医院。酒店约 250 间客房，配泳池与 Makan Kitchen 全日餐厅，价格通常低于 KLCC 的五星，位置仍在市中心内。",
    loyaltyProgramme: "Hilton Honors",
    officialUrl: "https://www.hilton.com/en/hotels/kulmddi-doubletree-kuala-lumpur/",
  },
  {
    id: "hilton-garden-inn-kuala-lumpur-jalan-tar",
    name: "Hilton Garden Inn Kuala Lumpur Jalan Tuanku Abdul Rahman",
    nameZh: "吉隆坡端姑阿都拉曼路希尔顿花园酒店",
    destinationId: "kuala-lumpur",
    areaId: "chow-kit",
    hotelGroup: "hilton",
    brand: "Hilton Garden Inn",
    brandId: "hilton-garden-inn",
    coordinates: {
      lat: 3.1639571,
      lng: 101.6984396,
      confidence: "verified",
      coordNote:
        "OSM hotel \"Hilton Garden Inn Kuala Lumpur\" — Jalan Tuanku Abdul Rahman, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). This is the north Jalan TAR branch, beside the Chow Kit market district.",
    },
    priceTier: "$$",
    priceTierBasis:
      "Select-service positioning (Hilton Garden Inn brand tier, Jalan Tuanku Abdul Rahman) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["City", "Family", "Couple"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Tuanku Abdul Rahman in Chow Kit; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 55, minutesMax: 90, confidence: "approximate" },
    description:
      "A select-service Hilton Garden Inn on the Chow Kit stretch of Jalan Tuanku Abdul Rahman, a few minutes' walk from the wet market and the Jalan Raja Alang food lanes. It is the cheapest way to earn Hilton Honors inside the city centre, with compact modern rooms, a small pool and a 24-hour pantry. Expect a working neighbourhood rather than a polished one.",
    descriptionZh:
      "位于秋杰段端姑阿都拉曼路的希尔顿花园酒店，步行几分钟到湿巴刹与拉惹阿郎路食街。这是在市中心刷希尔顿荣誉客会最便宜的方式：客房紧凑现代，有小泳池与 24 小时自助商店。周边是正在运转的街区，而不是精致街区。",
    loyaltyProgramme: "Hilton Honors",
    officialUrl: "https://www.hilton.com/en/hotels/kulcigi-hilton-garden-inn-kuala-lumpur-jalan-tuanku-abdul-rahman/",
  },
  {
    id: "intercontinental-kuala-lumpur",
    name: "InterContinental Kuala Lumpur",
    nameZh: "吉隆坡洲际酒店",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    hotelGroup: "ihg",
    brand: "InterContinental",
    brandId: "intercontinental",
    coordinates: {
      lat: 3.1594561,
      lng: 101.7179652,
      confidence: "verified",
      coordNote:
        "OSM hotel \"InterContinental Kuala Lumpur\" — Jalan Ampang, Kampung Datuk Keramat, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$$",
    priceTierBasis:
      "Luxury positioning (InterContinental brand tier, Jalan Ampang beside KLCC) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Couple", "Family", "Food"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Ampang, a short walk from KLCC park; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "IHG's luxury flagship in Malaysia, on Jalan Ampang where the old embassy row meets the KLCC district. 473 rooms and suites across 23 floors, a large free-form pool and the Serena Brasserie and Tao Chinese restaurant. It is a ten-minute walk to the Petronas Towers and the same to the Ampang Park LRT, which makes it the most central InterContinental in the city.",
    descriptionZh:
      "IHG 在马来西亚的豪华旗舰，位于旧使馆区与 KLCC 交汇的安邦路。23 层共 473 间客房与套房、大型自由形态泳池，以及 Serena 自助餐厅与 Tao 中餐厅。步行十分钟到双子塔，同样十分钟到安邦公园轻快铁站，是全市位置最中心的洲际。",
    loyaltyProgramme: "IHG One Rewards",
    roomCount: 473,
    officialUrl: "https://www.ihg.com/intercontinental/hotels/us/en/kuala-lumpur/kulha/hoteldetail",
  },
  {
    id: "hotel-indigo-kuala-lumpur-on-the-park",
    name: "Hotel Indigo Kuala Lumpur on the Park",
    nameZh: "吉隆坡英迪格酒店（公园旁）",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    hotelGroup: "ihg",
    brand: "Hotel Indigo",
    brandId: "hotel-indigo",
    coordinates: {
      lat: 3.1527748,
      lng: 101.7059243,
      confidence: "verified",
      coordNote:
        "OSM hotel \"Hotel Indigo by IHG\" — Jalan Puncak, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). Jalan Puncak is the road up to the Kuala Lumpur Tower, above the KL Forest Eco Park.",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Upper-upscale positioning (Hotel Indigo brand tier, Jalan Puncak beside the KL Forest Eco Park) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["City", "Luxury", "Couple", "Food"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Puncak below the KL Tower; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "Hotel Indigo's Kuala Lumpur property sits on Jalan Puncak, the lane that climbs Bukit Nanas past the KL Forest Eco Park to the Kuala Lumpur Tower. The neighbourhood-story design draws on the surrounding rainforest and the tower, and the rooftop bar looks across the Eco Park canopy toward the Petronas Towers. It is a smaller, more design-led alternative to the big KLCC boxes, ten minutes' walk from both KLCC and Bukit Bintang.",
    descriptionZh:
      "吉隆坡英迪格位于 Jalan Puncak——从咖啡山穿过吉隆坡森林生态公园通往吉隆坡塔的那条坡道。设计取材于周边雨林与塔楼，天台酒吧越过生态公园树冠望向双子塔。相比 KLCC 的大体量酒店，它更小、更设计导向，步行十分钟同时到双子塔与武吉免登。",
    loyaltyProgramme: "IHG One Rewards",
    officialUrl: "https://www.ihg.com/hotelindigo/hotels/us/en/kuala-lumpur/kulpa/hoteldetail",
  },
  {
    id: "crowne-plaza-kuala-lumpur-city-centre",
    name: "Crowne Plaza Kuala Lumpur City Centre",
    nameZh: "吉隆坡城中城皇冠假日酒店",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    hotelGroup: "ihg",
    brand: "Crowne Plaza",
    brandId: "crowne-plaza",
    coordinates: {
      lat: 3.1632357,
      lng: 101.7140594,
      confidence: "verified",
      coordNote:
        "OSM hotel \"Crowne Plaza Kuala Lumpur City Centre\" — Lorong Yap Kwan Seng, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Upper-upscale positioning (Crowne Plaza brand tier, Lorong Yap Kwan Seng beside KLCC) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["City", "Luxury", "Family", "Couple"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Lorong Yap Kwan Seng, north-east of KLCC; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "IHG opened this Crowne Plaza on Lorong Yap Kwan Seng in 2023, a block north-east of the KLCC park and within walking distance of Suria KLCC and the convention centre. It is a full-service business hotel with an outdoor pool, a club lounge and a large ballroom, and it typically undercuts the neighbouring five-stars while offering the same walk to the towers.",
    descriptionZh:
      "IHG 于 2023 年在雅坤盛巷开出这家皇冠假日，位于城中城公园东北一个街区，步行可到阳光广场与会议中心。属于全服务商务酒店，有室外泳池、行政酒廊与大型宴会厅；价格通常低于周边五星，但走到双子塔的距离是一样的。",
    loyaltyProgramme: "IHG One Rewards",
    officialUrl: "https://www.ihg.com/crowneplaza/hotels/us/en/kuala-lumpur/kulcp/hoteldetail",
  },
  {
    id: "grand-hyatt-kuala-lumpur",
    name: "Grand Hyatt Kuala Lumpur",
    nameZh: "吉隆坡君悦酒店",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    hotelGroup: "hyatt",
    brand: "Grand Hyatt",
    brandId: "grand-hyatt",
    coordinates: {
      lat: 3.1536113,
      lng: 101.7121373,
      confidence: "verified",
      coordNote:
        "OSM hotel \"Grand Hyatt\" — Jalan Pinang, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$$",
    priceTierBasis:
      "Luxury positioning (Grand Hyatt brand tier, Jalan Pinang opposite the KLCC park) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Couple", "Family", "Food"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Pinang, facing the KLCC park; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "The Grand Hyatt opened in 2012 on Jalan Pinang, directly across the road from the KLCC park and a five-minute walk from Suria KLCC. 412 rooms and suites, a 38th-floor restaurant with a head-on view of the Petronas Towers, and one of the largest hotel pools in the city centre. It is Hyatt's luxury anchor in Kuala Lumpur and the most convenient of the KLCC five-stars for the park itself.",
    descriptionZh:
      "吉隆坡君悦 2012 年开业，位于槟榔路，正对城中城公园，步行五分钟到阳光广场。412 间客房与套房，38 楼餐厅正对双子塔，泳池是市中心酒店中最大的之一。它是凯悦在吉隆坡的豪华支点，也是 KLCC 五星中离公园最近的一家。",
    loyaltyProgramme: "World of Hyatt",
    roomCount: 412,
    officialUrl: "https://www.hyatt.com/grand-hyatt/en-US/kulgh-grand-hyatt-kuala-lumpur",
  },
  {
    id: "alila-bangsar-kuala-lumpur",
    name: "Alila Bangsar Kuala Lumpur",
    nameZh: "吉隆坡孟沙阿丽拉酒店",
    destinationId: "kuala-lumpur",
    areaId: "bangsar",
    hotelGroup: "hyatt",
    brand: "Alila",
    brandId: "alila",
    coordinates: {
      lat: 3.1277831,
      lng: 101.6802883,
      confidence: "verified",
      coordNote:
        "OSM hotel \"Alila Bangsar Kuala Lumpur\" — Jalan Ang Seng, Brickfields, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The OSM address suburb reads Brickfields; the tower sits on the Bangsar side of Jalan Bangsar and is branded Bangsar.",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Ultra-luxury brand (Alila) in an upper-upscale urban setting — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["Luxury", "City", "Couple", "Food"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Ang Seng between Bangsar and Brickfields; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 45, minutesMax: 75, confidence: "approximate" },
    description:
      "Alila Bangsar is Hyatt's design-led property on Jalan Ang Seng, between the Bangsar LRT station and KL Sentral — one stop from each. The building is a converted office tower with a small, quiet room count, a rooftop infinity pool looking over the Bangsar rooftops, and the Entier French dining room. It is the choice for travellers who want the café-and-bar district of Bangsar rather than the KLCC mall belt.",
    descriptionZh:
      "阿丽拉孟沙是凯悦旗下设计导向的酒店，位于安成路，介于孟沙轻快铁站与中央车站之间，各一站可达。由写字楼改造，客房数少而安静，天台无边际泳池越过孟沙屋顶，餐厅 Entier 主打法餐。想住孟沙的咖啡馆与酒吧区、而不是 KLCC 商场带的旅客适合这里。",
    loyaltyProgramme: "World of Hyatt",
    officialUrl: "https://www.hyatt.com/alila/en-US/kulab-alila-bangsar-kuala-lumpur",
  },
  {
    id: "parkroyal-collection-kuala-lumpur",
    name: "PARKROYAL COLLECTION Kuala Lumpur",
    nameZh: "吉隆坡宾乐雅臻选酒店",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    hotelGroup: "gha",
    brand: "PARKROYAL",
    brandId: "parkroyal",
    coordinates: {
      lat: 3.1443335,
      lng: 101.7121987,
      confidence: "verified",
      coordNote:
        "OSM hotel \"PARKROYAL COLLECTION Kuala Lumpur\" — Jalan Sultan Ismail, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Upper-upscale positioning (PARKROYAL COLLECTION brand tier, Jalan Sultan Ismail) — derived from brand positioning, not a live rate.",
    propertyType: "City Hotel",
    tags: ["City", "Luxury", "Couple", "Food", "Family"],
    beachAccess: "none",
    beachAccessNote: "City hotel on Jalan Sultan Ismail in Bukit Bintang; no beach.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 50, minutesMax: 85, confidence: "approximate" },
    description:
      "The former PARKROYAL Kuala Lumpur was rebranded PARKROYAL COLLECTION after a full renovation, and on GHA DISCOVERY it is the most centrally located member in the city — on Jalan Sultan Ismail, walking distance from both Pavilion KL and Jalan Alor. The redesign is greenery-led, with a landscaped pool deck on the podium, and the collection tier brings a stronger food and beverage programme than the old PARKROYAL offered.",
    descriptionZh:
      "前身是吉隆坡宾乐雅，全面翻新后升级为宾乐雅臻选；在 GHA DISCOVERY 体系内它是本市位置最中心的一家——位于苏丹依斯迈路，步行可到柏威年广场与亚罗街。翻新以绿意为主题，裙楼有园林泳池平台，臻选层级也比旧宾乐雅在餐饮上投入更多。",
    loyaltyProgramme: "GHA DISCOVERY",
    officialUrl: "https://www.parkroyalhotels.com/en/hotels-resorts/malaysia/kuala-lumpur/parkroyal-collection-kuala-lumpur.html",
  },
  {
    id: "sunway-resort-hotel-spa",
    name: "Sunway Resort Hotel & Spa",
    nameZh: "双威度假酒店",
    destinationId: "kuala-lumpur",
    areaId: "petaling-jaya-subang-jaya",
    hotelGroup: "gha",
    brand: "Sunway Hotels & Resorts",
    brandId: "sunway",
    coordinates: {
      lat: 3.0710456,
      lng: 101.6087239,
      confidence: "verified",
      coordNote:
        "OSM resort \"Sunway Resort Hotel & Spa\" — Persiaran Lagoon, Sunway City, Subang Jaya City Council, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    priceTier: "$$$",
    priceTierBasis:
      "Upper-upscale positioning (Sunway Hotels & Resorts flagship, Bandar Sunway integrated resort) — derived from brand positioning, not a live rate.",
    propertyType: "Resort",
    tags: ["Resort", "Family", "City", "Couple"],
    beachAccess: "none",
    beachAccessNote:
      "No sea beach — the hotel overlooks Sunway Lagoon, a man-made water park with an artificial surf beach, not the coast.",
    airportTransfer: { toAirportId: "kuala-lumpur-international-airport", minutesMin: 40, minutesMax: 65, confidence: "approximate" },
    description:
      "Sunway Resort Hotel & Spa is the flagship of Malaysia's Sunway group and the GHA DISCOVERY anchor for the Klang Valley's western suburbs. It sits inside the Sunway City integrated resort at Bandar Sunway, directly above Sunway Lagoon water park, and is connected by covered walkway to Sunway Pyramid mall. That combination — resort pool, theme park and megamall in one complex — makes it the most family-oriented loyalty property in Greater Kuala Lumpur, and it is closer to the airport than anything in the city centre.",
    descriptionZh:
      "双威度假酒店是马来西亚双威集团的旗舰，也是 GHA DISCOVERY 在巴生谷西郊的支点。它位于双威城综合度假区内，正对双威水上乐园，并有连廊直通双威金字塔商场。度假泳池、主题乐园与巨型商场集中在同一个综合体，使它成为大吉隆坡最适合家庭的常客计划酒店，而且比市中心的任何酒店都更靠近机场。",
    loyaltyProgramme: "GHA DISCOVERY",
    officialUrl: "https://www.sunwayhotels.com/sunway-resort-hotel-spa",
  },
];

export const places: PlaceSeed[] = [
  {
    id: "petronas-twin-towers",
    name: "Petronas Twin Towers",
    nameZh: "双子塔",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    category: "activity",
    subcategory: "landmark",
    coordinates: {
      lat: 3.1579679,
      lng: 101.7112048,
      confidence: "verified",
      coordNote:
        "OSM office \"Petronas Towers\" — Lorong Kuda, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). Point is the tower footprint on Lorong Kuda, between the two shafts.",
    },
    recommendedDurationMin: 120,
    bestTime: "Late afternoon for the park and the fountains, then the 20:00 or 21:00 Lake Symphony show; go up the tower in the morning for the clearest views",
    bestTimeZh: "傍晚先逛公园与喷泉，再看 20:00 或 21:00 的音乐喷泉；想上塔看景就选早上，能见度最好",
    tags: ["Landmark", "Architecture", "Observation deck", "Photography", "Iconic"],
    tagsZh: ["地标", "建筑", "观景台", "拍照", "必看"],
    description:
      "The 452-metre Petronas Twin Towers, designed by Cesar Pelli and completed in 1998, were the tallest buildings in the world until 2003 and remain the tallest twin towers ever built. They are connected at the 41st and 42nd floors by a double-decker skybridge — the world's highest two-storey bridge — and the 86th floor of Tower 2 holds the observation deck. The towers are the head office of Petronas and also contain the Kuala Lumpur Convention Centre, Suria KLCC and the Malaysian Philharmonic Orchestra's concert hall.",
    descriptionZh:
      "452 米的双子塔由西萨·佩里设计、1998 年落成，直到 2003 年都是世界最高建筑，至今仍是史上最高的双塔。两塔在第 41、42 层之间由双层空中桥梁相连——世界最高的两层桥；二号塔 86 层是观景台。塔内是马来西亚国家石油公司的总部，也包含吉隆坡会议中心、阳光广场与马来西亚爱乐音乐厅。",
    notes:
      "The Skybridge and the 86th-floor observation deck are visitable only on a timed ticket and are closed on Mondays; buy in advance online because daily slots sell out. Photography on the bridge is restricted to the designated areas. The free Lake Symphony fountain shows run in the evening in the park below, which is the best place to photograph the whole complex.",
    notesZh:
      "空中桥梁与 86 层观景台只能凭分时段门票进入，周一关闭；每日名额常售罄，建议提前网上购票。桥上拍照只限指定区域。傍晚在楼下公园有免费的音乐喷泉表演，是拍整组建筑最好的位置。",
    entryFee: "Free to view from outside and from KLCC Park; Skybridge and observation deck by timed ticket (book online)",
    entryFeeZh: "外观与城中城公园免费；空中桥梁与观景台需分时段门票（建议网上预订）",
    openingHours: "Skybridge and observation deck roughly 09:00–21:00, closed Mondays; the park and fountains are open daily",
    markerLayer: "activity",
    discovery: ["highlights", "culture"],
    recommendedFor: ["first-time", "photo-spots", "couples", "family", "half-day"],
    activity: {
      kind: "shopping",
      difficulty: "easy",
      weatherDependency: "low",
      reservationRecommended: true,
      transportContext: "KLCC LRT station is inside the Suria KLCC podium; the park entrance is a five-minute walk from the station.",
      transportContextZh: "轻快铁 KLCC 站就在阳光广场裙楼内；从站里步行五分钟到公园入口。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Petronas Towers, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "klcc-park",
    name: "KLCC Park",
    nameZh: "城中城公园",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    category: "nature",
    subcategory: "park",
    coordinates: {
      lat: 3.1555803,
      lng: 101.7147801,
      confidence: "verified",
      coordNote:
        "OSM park \"KLCC Park\" — Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "Early morning for the running track and shade, or 19:30–22:00 for the illuminated towers and the fountain shows",
    bestTimeZh: "清晨跑步与遮荫最好，或 19:30–22:00 看亮灯的双子塔与喷泉表演",
    tags: ["Park", "Fountains", "Running", "Family", "Photography"],
    tagsZh: ["公园", "喷泉", "跑步", "家庭", "拍照"],
    description:
      "KLCC Park is the 20-hectare public garden Cesar Pelli laid out in front of the twin towers, designed by Roberto Burle Marx with more than 1,900 native trees and a 1.3 km jogging track. Its centrepiece is the Lake Symphony, a programmable fountain whose water jets are choreographed to music in evening shows, and the park has a children's pool and playground that make it the most-used family space in the city centre. It is also the only place that gives you the classic full-height view of both towers.",
    descriptionZh:
      "城中城公园是西萨·佩里在双子塔前规划的 20 公顷公园，由罗伯托·布尔·马克思设计，种有 1,900 多棵本土树木，并有一条 1.3 公里慢跑道。核心是 Lake Symphony 音乐喷泉，晚间按编排的水舞表演；园内还有儿童戏水池与游乐场，是市中心使用率最高的亲子空间。这里也是唯一能拍到双塔完整高度的经典机位。",
    notes:
      "The park is free and open from early morning until late; the fountain shows run several times each evening and are announced on site. The shallow children's pool is a genuine swimming pool, so bring a change of clothes if you have kids. Mosquito repellent is worth carrying after rain.",
    notesZh:
      "公园免费，从清早开放到深夜；喷泉表演每晚数场，具体时间现场公告。儿童戏水池是真的可以下水的泳池，带孩子记得备换洗衣物。雨后建议带防蚊液。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Roughly 06:00–22:00 daily; fountain shows in the evening",
    markerLayer: "nature",
    discovery: ["nature", "highlights"],
    recommendedFor: ["family", "family-young-kids", "photo-spots", "couples", "sunset"],
    activity: {
      kind: "sunset",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "Suria KLCC and the KLCC LRT station open directly onto the park.",
      transportContextZh: "阳光广场与轻快铁 KLCC 站直接连通公园。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — KLCC Park, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "suria-klcc",
    name: "Suria KLCC",
    nameZh: "阳光广场",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    category: "activity",
    subcategory: "shopping",
    coordinates: {
      lat: 3.1573751,
      lng: 101.7123797,
      confidence: "verified",
      coordNote:
        "OSM mall \"Suria KLCC\" — Persiaran Petronas, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 120,
    bestTime: "10:00–13:00 on a weekday; weekends and public holidays are very busy",
    bestTimeZh: "工作日 10:00–13:00；周末与公共假期非常挤",
    tags: ["Shopping", "Mall", "Family", "Rainy day", "Food court"],
    tagsZh: ["购物", "商场", "家庭", "雨天", "美食广场"],
    description:
      "Suria KLCC occupies the podium at the base of the Petronas Twin Towers and is the most visited shopping centre in Malaysia, with six levels, a concert hall, an aquarium and a science discovery centre inside the same complex. The anchor tenants are Isetan and Parkson, the top floors hold the KLCC food court and a branch of the Malaysian Philharmonic's home, and the ground-floor entrances open straight into KLCC Park.",
    descriptionZh:
      "阳光广场位于双子塔底部裙楼，是马来西亚客流量最大的购物中心，六层空间，同一综合体内还有音乐厅、水族馆与科学探索中心。主力店是伊势丹与百盛，顶层是美食广场，马来西亚爱乐乐团的主场也在其中，底层出口直接通向城中城公园。",
    notes:
      "The KLCC LRT station is inside the building, and there is a covered, air-conditioned pedestrian walkway to Pavilion KL via the KLCC–Bukit Bintang link, which is the best way to move between the two districts in the heat or rain.",
    notesZh:
      "轻快铁 KLCC 站就在楼内；经 KLCC–武吉免登连廊可全程有顶棚、有空调地步行到柏威年广场，是炎热或下雨时在两个商圈之间移动的最佳方式。",
    entryFee: "Free entry",
    entryFeeZh: "免费进入",
    openingHours: "10:00–22:00 daily",
    markerLayer: "activity",
    discovery: ["shopping", "highlights"],
    recommendedFor: ["shopping", "family", "rainy-day", "first-time"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Suria KLCC, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "aquaria-klcc",
    name: "Aquaria KLCC",
    nameZh: "城中城水族馆",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    category: "activity",
    subcategory: "aquarium",
    coordinates: {
      lat: 3.1533436,
      lng: 101.7130586,
      confidence: "verified",
      coordNote:
        "OSM object \"Aquaria KLCC\" — KLCC–Bukit Bintang Pedestrian Walkway, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 120,
    bestTime: "Open 10:00 onwards; the 90-metre tunnel is quietest right after opening and after 17:00",
    bestTimeZh: "10:00 开门后；90 米海底隧道在刚开门和 17:00 后人最少",
    tags: ["Aquarium", "Family", "Rainy day", "Children", "Indoor"],
    tagsZh: ["水族馆", "家庭", "雨天", "儿童", "室内"],
    description:
      "Aquaria KLCC is a 5,000-square-metre aquarium on the concourse level of the Kuala Lumpur Convention Centre, entered from the KLCC park side. It runs to more than 5,000 marine and freshwater animals across themed zones — a 90-metre walk-through tunnel under a large tank, a touch pool, a rainforest section and a sand tiger shark display — and is the standard rainy-afternoon or hot-midday option in the KLCC district.",
    descriptionZh:
      "城中城水族馆位于吉隆坡会议中心大厅层，入口在城中城公园一侧，面积约 5,000 平方米，饲养超过 5,000 只海洋与淡水生物，分为多个主题区：90 米穿行式海底隧道、触摸池、雨林区与沙虎鲨展缸。是 KLCC 一带雨天或正午高温时的标准备选。",
    notes:
      "Timed tickets are sold at the counter and online; feeding sessions run through the day and are posted at the entrance. The venue is fully indoor and air-conditioned, which is the point on a 33°C afternoon.",
    notesZh:
      "分时段门票在柜台与网上出售；园内全天有喂食表演，时间表贴在入口。场馆全室内、有空调——33 度的午后这就是它的价值。",
    entryFee: "Ticketed; rates vary by nationality and time slot — check the official site before visiting",
    entryFeeZh: "需购票；价格因国籍与时段而异，出发前请查官网",
    openingHours: "Roughly 10:00–20:00 daily, last entry about an hour before closing",
    markerLayer: "activity",
    discovery: ["nature", "highlights"],
    recommendedFor: ["family", "family-young-kids", "rainy-day", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Aquaria KLCC, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "kuala-lumpur-tower",
    name: "Kuala Lumpur Tower (Menara KL)",
    nameZh: "吉隆坡塔",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    category: "activity",
    subcategory: "tower",
    coordinates: {
      lat: 3.15286,
      lng: 101.70376,
      confidence: "verified",
      coordNote:
        "OSM tower \"Kuala Lumpur Tower\" — Jalan Puncak, Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM, query \"Menara Kuala Lumpur\").",
    },
    recommendedDurationMin: 90,
    bestTime: "Late afternoon to catch daylight and then sunset from the deck; clear mornings are better for photographs",
    bestTimeZh: "傍晚上去，先看白天再等日落；想拍照就选通透的清晨",
    tags: ["Viewpoint", "Observation deck", "Photography", "Sunset", "Landmark"],
    tagsZh: ["观景", "观景台", "拍照", "日落", "地标"],
    description:
      "The Kuala Lumpur Tower is a 421-metre telecommunications and observation tower on Bukit Nanas, completed in 1996 and still the tallest tower in Malaysia. Its observation deck at 276 metres sits higher than the Petronas Towers' 86th floor, so it gives the classic view down onto the twin towers rather than up at them, and the revolving restaurant sits just below. The base station is inside the KL Forest Eco Park, which means you can combine the tower with a rainforest walk.",
    descriptionZh:
      "吉隆坡塔是咖啡山上 421 米的通信与观光塔，1996 年落成，至今仍是全马最高的塔。276 米的观景台比双子塔 86 层还高，因此这里最经典的画面是俯看双塔而不是仰望；旋转餐厅就在下方。塔基位于吉隆坡森林生态公园内，可以顺路走一段雨林步道。",
    notes:
      "Tickets are sold by slot and the outdoor Sky Deck is weather-dependent — it closes in thunderstorms, which are common in the afternoons. The tower is a 10–15 minute walk uphill from Dang Wangi or Bukit Nanas stations, or a short Grab ride up Jalan Puncak.",
    notesZh:
      "门票分时段出售，室外 Sky Deck 视天气开放——午后雷暴时关闭。从 Dang Wangi 或咖啡山站步行上坡约 10–15 分钟，也可以直接打车沿 Jalan Puncak 上来。",
    entryFee: "Ticketed; Sky Deck and Sky Box are separate add-ons",
    entryFeeZh: "需购票；Sky Deck 与 Sky Box 为另购项目",
    openingHours: "Roughly 09:00–22:00 daily; last admission in the evening",
    markerLayer: "activity",
    discovery: ["highlights", "culture"],
    recommendedFor: ["first-time", "photo-spots", "sunset", "couples", "half-day"],
    activity: {
      kind: "sunset",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: true,
      transportContext: "Grab up Jalan Puncak is easiest; otherwise walk 10–15 minutes uphill from Dang Wangi LRT or Bukit Nanas monorail.",
      transportContextZh: "最方便是打车沿 Jalan Puncak 上来；否则从 Dang Wangi 轻快铁或咖啡山单轨站步行上坡 10–15 分钟。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Kuala Lumpur Tower, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "kl-forest-eco-park",
    name: "KL Forest Eco Park",
    nameZh: "吉隆坡森林生态公园（咖啡山）",
    destinationId: "kuala-lumpur",
    areaId: "klcc",
    category: "nature",
    subcategory: "forest",
    coordinates: {
      lat: 3.1529313,
      lng: 101.7026923,
      confidence: "verified",
      coordNote:
        "OSM forest \"KL Forest Eco-Park\" — Kampung Cendana, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "07:30–10:30, before the heat and the afternoon storms; the canopy walk is closed in high wind",
    bestTimeZh: "07:30–10:30，避开高温与午后雷雨；大风时树冠步道会关闭",
    tags: ["Rainforest", "Canopy walk", "Nature", "Free", "Wildlife"],
    tagsZh: ["雨林", "树冠步道", "自然", "免费", "野生动物"],
    description:
      "The KL Forest Eco Park is a remnant of the lowland dipterocarp forest that once covered Bukit Nanas, preserved as a 9-hectare reserve in the middle of the city and formally gazetted as a forest reserve. Its draw is a 200-metre canopy walkway suspended in the treetops — the only one in Kuala Lumpur — plus a series of forest trails and a 100-year-old Merawan tree. Macaques, squirrels, hornbills and monitor lizards live here, and the KL Tower base station stands inside the reserve.",
    descriptionZh:
      "吉隆坡森林生态公园是咖啡山上残存的低地龙脑香林，9 公顷，是正式划定的森林保护区，就嵌在市中心。最大看点是 200 米长、架在树冠层的步道——全吉隆坡唯一一条——以及数条森林步道与一棵百年梅拉旺树。这里有猕猴、松鼠、犀鸟与巨蜥，吉隆坡塔的塔基就在保护区内。",
    notes:
      "Entry is free and the gates keep roughly office hours; the canopy walkway is the first thing to close in bad weather. Bring water, expect mosquitoes after rain, and do not feed the macaques — they are habituated and will take bags.",
    notesZh:
      "免费进入，开放时间大致是白天办公时段；天气不好时最先关闭的就是树冠步道。带水，雨后防蚊，不要喂猴子——它们已被投喂惯了，会抢包。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Roughly 08:00–17:30 daily (canopy walkway closes in bad weather)",
    markerLayer: "nature",
    discovery: ["nature", "highlights"],
    recommendedFor: ["quiet", "family", "half-day", "adventurous", "photo-spots"],
    activity: {
      kind: "hike",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "Walk up Jalan Puncak from Dang Wangi LRT, or take a Grab to the KL Tower entrance — the reserve gate is beside it.",
      transportContextZh: "从 Dang Wangi 轻快铁站步行上 Jalan Puncak，或打车到吉隆坡塔入口——保护区大门就在旁边。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — KL Forest Eco-Park, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "pavilion-kuala-lumpur",
    name: "Pavilion Kuala Lumpur",
    nameZh: "柏威年广场",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    category: "activity",
    subcategory: "shopping",
    coordinates: {
      lat: 3.149154,
      lng: 101.7129531,
      confidence: "verified",
      coordNote:
        "OSM mall \"Pavilion Kuala Lumpur\" — Jalan Bukit Bintang, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 150,
    bestTime: "Weekday afternoons; the Tokyo Street and Connection floors are busiest at weekends",
    bestTimeZh: "工作日下午；Tokyo Street 与 Connection 楼层周末最挤",
    tags: ["Shopping", "Mall", "Luxury", "Food", "Rainy day"],
    tagsZh: ["购物", "商场", "奢侈品", "餐饮", "雨天"],
    description:
      "Pavilion KL is the anchor of the Bukit Bintang shopping district, seven levels of retail split into a luxury Couture Pavilion, the youth-oriented Connection wing and the Japanese-themed Tokyo Street on level 6. It holds the largest concentration of luxury boutiques in Malaysia and a food court and restaurant floors that keep it busy from opening to closing. The JW Marriott and Ritz-Carlton are attached or adjacent, and a covered walkway links it to KLCC.",
    descriptionZh:
      "柏威年广场是武吉免登购物区的核心，七层零售空间分为奢侈品区 Couture Pavilion、年轻向的 Connection 翼，以及 6 楼日式主题的 Tokyo Street。这里集中了全马最多的奢侈品牌，加上美食广场与餐厅楼层，从开门到关门都有人。JW 万豪与丽思卡尔顿与之相连或相邻，还有连廊通往 KLCC。",
    notes:
      "The KLCC–Bukit Bintang covered pedestrian walkway starts near Pavilion and runs air-conditioned all the way to Suria KLCC — about 15 minutes on foot and by far the best way to move between the two districts in the heat.",
    notesZh:
      "KLCC–武吉免登有顶棚连廊从柏威年附近起步，全程有空调直通阳光广场，步行约 15 分钟，是炎热天气在两个商圈间移动最好的方式。",
    entryFee: "Free entry",
    entryFeeZh: "免费进入",
    openingHours: "10:00–22:00 daily",
    markerLayer: "activity",
    discovery: ["shopping", "highlights"],
    recommendedFor: ["shopping", "family", "rainy-day", "couples"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Pavilion Kuala Lumpur, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "jalan-alor-food-street",
    name: "Jalan Alor Food Street",
    nameZh: "亚罗街",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    category: "food",
    subcategory: "street-food",
    coordinates: {
      lat: 3.1445741,
      lng: 101.7078319,
      confidence: "verified",
      coordNote:
        "OSM way \"Jalan Alor\" — Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). Point is mid-street, inside the night-market stretch.",
    },
    recommendedDurationMin: 90,
    bestTime: "18:30–23:00, when the road closes to traffic and the stalls are all lit; peak buzz after 20:00",
    bestTimeZh: "18:30–23:00，封路、摊档全亮；20:00 后最热闹",
    tags: ["Street food", "Night market", "Seafood", "Cheap eats", "Open late"],
    tagsZh: ["街头小吃", "夜市", "海鲜", "平价美食", "营业到深夜"],
    description:
      "Jalan Alor is the best-known open-air food street in Kuala Lumpur, a single road behind Bukit Bintang that fills with tables and charcoal grills every evening. The offering runs from Cantonese-style grilled seafood and chicken wings to satay, Hokkien mee, oyster omelette, durian stalls and Taiwanese and Thai snacks, with the Chinese seafood restaurants at the northern end being the most established. It is a spectacle as much as a meal.",
    descriptionZh:
      "亚罗街是吉隆坡最有名的露天食街，就在武吉免登后方，每晚摆满桌椅与炭炉。从粤式烧烤海鲜与鸡翼，到沙爹、福建面、蚝煎、榴莲摊，再到台式与泰式小吃都有；北端的老牌海鲜饭店资历最深。它既是一顿饭，也是一场景观。",
    notes:
      "Prices are quoted per dish and are negotiable at the seafood places — agree the price and the weight before ordering. Cash still dominates; some stalls take e-wallets. The street is closed to traffic in the evening, and it is a five-minute walk from both Bukit Bintang MRT and Imbi monorail.",
    notesZh:
      "价格按菜计，海鲜店可以议价——下单前先确认价钱与重量。现金仍是主流，部分摊档收电子钱包。晚上封路，从武吉免登捷运站与燕美单轨站步行都是五分钟。",
    entryFee: "Free to walk; pay per dish",
    entryFeeZh: "逛免费；按菜付费",
    openingHours: "Stalls set up from about 17:00 and run until midnight or later; busiest 19:00–23:00",
    markerLayer: "food",
    discovery: ["food", "nightlife", "highlights"],
    recommendedFor: ["food-lovers", "first-time", "friends", "budget", "party"],
    dining: {
      cuisines: ["chinese", "seafood", "thai"],
      mealTypes: ["dinner", "drinks"],
      priceTier: "$$",
      signatureItems: ["Grilled chicken wings", "Satay", "Hokkien mee", "Oyster omelette", "Grilled seafood"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Jalan Alor, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "lot-10-hutong",
    name: "Lot 10 Hutong",
    nameZh: "十号胡同",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    category: "food",
    subcategory: "food-court",
    coordinates: {
      lat: 3.1469293,
      lng: 101.7118546,
      confidence: "verified",
      coordNote:
        "OSM food_court \"Lot 10 Hutong\" — Jalan Bukit Bintang, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "Lunch (11:30–14:00) or early dinner; it is air-conditioned, so it works in any weather",
    bestTimeZh: "午餐（11:30–14:00）或早点吃晚饭；全场有空调，什么天气都能来",
    tags: ["Food court", "Hawker", "Air-conditioned", "Local food", "Family"],
    tagsZh: ["美食广场", "大排档", "有空调", "本地菜", "家庭"],
    description:
      "Lot 10 Hutong is a basement food court in the Lot 10 mall that gathers around thirty of Kuala Lumpur's best-known hawker stalls under one air-conditioned roof — several of them multi-generation family businesses relocated from streets and markets elsewhere in the city. It is the easiest way to eat a cross-section of Malaysian hawker food in one sitting without hunting down individual stalls, and it is directly connected to the Bukit Bintang MRT station.",
    descriptionZh:
      "十号胡同是十号胡同商场地下层的美食广场，把吉隆坡约三十家最有名的档口集中在一个有空调的屋檐下——其中不少是从城里其他街道与市场迁来的老字号。想一口气吃遍马来西亚大排档的横截面、又不想一个个去找摊子，这里最省事；而且与武吉免登捷运站直接连通。",
    notes:
      "Ordering is at individual stalls with a shared seating area; most stalls are cash or e-wallet only and some close when they sell out. It sits directly above the Bukit Bintang MRT entrance, which makes it the natural lunch stop on a wet day.",
    notesZh:
      "在各档口点餐、共用座位区；多数档口只收现金或电子钱包，部分卖完就收。它就在武吉免登捷运站入口上方，下雨天来这里吃午饭最顺。",
    entryFee: "Free entry",
    entryFeeZh: "免费进入",
    openingHours: "Roughly 10:00–22:00 daily",
    markerLayer: "food",
    discovery: ["food", "highlights"],
    recommendedFor: ["food-lovers", "family", "rainy-day", "budget", "first-time"],
    dining: {
      cuisines: ["chinese", "peranakan", "indian", "seafood"],
      mealTypes: ["lunch", "dinner"],
      priceTier: "$$",
      signatureItems: ["Hokkien mee", "Wan tan mee", "Bak kut teh", "Char kway teow", "Curry mee"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Lot 10 Hutong, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "vcr-cafe",
    name: "VCR",
    nameZh: "VCR 咖啡馆",
    destinationId: "kuala-lumpur",
    areaId: "bukit-bintang",
    category: "food",
    subcategory: "cafe",
    coordinates: {
      lat: 3.1432531,
      lng: 101.7054476,
      confidence: "verified",
      coordNote:
        "OSM cafe \"VCR\" — Jalan Galloway, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "Morning to early afternoon for coffee and brunch; it fills at weekends",
    bestTimeZh: "早上到午后喝咖啡吃早午餐最好；周末要排队",
    tags: ["Coffee", "Brunch", "Specialty coffee", "Cafe", "Western"],
    tagsZh: ["咖啡", "早午餐", "精品咖啡", "咖啡馆", "西餐"],
    description:
      "VCR is one of the cafés that started Kuala Lumpur's specialty-coffee wave, set in a restored colonial-era shophouse on Jalan Galloway just south of Bukit Bintang. It roasts and serves single-origin espresso and filter coffee alongside a short brunch menu, and the courtyard and upstairs rooms make it a place to sit rather than grab and go. It is the reference point for the city's third-wave coffee scene.",
    descriptionZh:
      "VCR 是带动吉隆坡精品咖啡浪潮的咖啡馆之一，开在武吉免登以南加洛威路一栋修复过的殖民时期骑楼里。自家烘焙的单品浓缩与手冲，配一份简短的早午餐菜单；庭院与楼上空间适合坐下来而不是带走。它是这座城市第三波咖啡的参照点。",
    notes:
      "No reservations — expect a wait at weekend brunch. It is a ten-minute walk from Bukit Bintang MRT, down Jalan Galloway off Jalan Pudu.",
    notesZh:
      "不接受订位，周末早午餐要等位。从武吉免登捷运站步行十分钟，从半山芭路拐进加洛威路即到。",
    entryFee: "Free entry; pay per item",
    entryFeeZh: "免费进入；按消费付费",
    openingHours: "Roughly 08:00–23:00 daily (kitchen hours shorter)",
    markerLayer: "food",
    discovery: ["coffee", "food"],
    recommendedFor: ["coffee-people", "long-lunch", "couples", "digital-nomad"],
    dining: {
      cuisines: ["coffee-roaster", "brunch", "western"],
      mealTypes: ["breakfast", "brunch", "coffee"],
      priceTier: "$$",
      signatureItems: ["Single-origin filter coffee", "Flat white", "Big breakfast"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — VCR cafe, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "petaling-street-market",
    name: "Petaling Street Market",
    nameZh: "茨厂街市场",
    destinationId: "kuala-lumpur",
    areaId: "chinatown-petaling-street",
    category: "food",
    subcategory: "market",
    coordinates: {
      lat: 3.1434549,
      lng: 101.6977498,
      confidence: "verified",
      coordNote:
        "OSM pedestrian way \"Petaling Street\" — Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The covered market runs the length of this street.",
    },
    recommendedDurationMin: 90,
    bestTime: "16:00–22:00, when the stalls are fully set up and the street is at its liveliest; mornings are quiet",
    bestTimeZh: "16:00–22:00，摊档全开、最热闹；早上很冷清",
    tags: ["Market", "Street food", "Souvenirs", "Bargaining", "Night market"],
    tagsZh: ["市场", "街头小吃", "手信", "讲价", "夜市"],
    description:
      "Petaling Street is the covered market at the heart of Kuala Lumpur's Chinatown, running east–west between Jalan Sultan and Jalan Tun H S Lee under a green canopy erected in 2003. By day it sells clothing, watches, phone accessories and souvenir copies; by evening the food stalls take over, with air mata kucing (longan and winter melon drink), Hokkien mee, grilled dried squid and tofu fa among the standards. The Chinese archway at each end marks the entrance.",
    descriptionZh:
      "茨厂街是吉隆坡唐人街核心的有顶棚市场，东西向连接苏丹街与敦李孝式路，2003 年加建绿色顶棚。白天卖成衣、手表、手机配件与仿牌手信；入夜后小吃摊接管，标准配置有罗汉果龙眼水、福建面、烤鱿鱼与豆花。两端的中国式牌坊就是入口标志。",
    notes:
      "Prices at the souvenir stalls are negotiable, usually by a third or more; food stall prices are fixed. Watch bags and phones in the crowd, and note that the counterfeit-branded goods here are openly sold but may be confiscated at customs elsewhere.",
    notesZh:
      "手信摊可以讲价，通常能砍掉三分之一以上；小吃摊价格固定。人多注意随身包与手机；这里公开售卖仿牌商品，但带到其他地方可能被海关没收。",
    entryFee: "Free entry",
    entryFeeZh: "免费进入",
    openingHours: "Stalls roughly 10:00–22:00; best from late afternoon",
    markerLayer: "food",
    discovery: ["food", "shopping", "highlights"],
    recommendedFor: ["food-lovers", "budget", "first-time", "shopping", "photo-spots"],
    dining: {
      cuisines: ["chinese", "dessert-gelato"],
      mealTypes: ["lunch", "dinner", "dessert"],
      priceTier: "$",
      signatureItems: ["Air mata kucing", "Hokkien mee", "Tofu fa", "Grilled dried squid"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Petaling Street, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "central-market",
    name: "Central Market",
    nameZh: "中央艺术坊",
    destinationId: "kuala-lumpur",
    areaId: "chinatown-petaling-street",
    category: "activity",
    subcategory: "market",
    coordinates: {
      lat: 3.1458402,
      lng: 101.6955062,
      confidence: "verified",
      coordNote:
        "OSM mall \"Central Market\" — Jalan Hang Kasturi, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "10:00–18:00; the upstairs craft and heritage sections are quietest on weekday mornings",
    bestTimeZh: "10:00–18:00；楼上手工艺与文史区在工作日早上最清静",
    tags: ["Craft", "Souvenirs", "Heritage", "Air-conditioned", "Family"],
    tagsZh: ["手工艺", "手信", "文史", "有空调", "家庭"],
    description:
      "Central Market is a 1888 wet market converted in the 1980s into a craft, art and souvenir arcade on the west bank of the Klang River, a short walk from both Petaling Street and Masjid Jamek. The stalls sell batik, pewter, woodcarving and Malaysian craft rather than the copy goods of Chinatown next door, and the building holds a small heritage gallery and a food court. It is the city's most convenient one-stop for genuinely local souvenirs.",
    descriptionZh:
      "中央艺术坊是 1888 年的湿货市场，1980 年代改造成巴生河西岸的手工艺、艺术与手信商场，步行可到茨厂街与占美清真寺。这里的摊位卖峇迪、锡镴、木雕等马来西亚手工艺，而不是隔壁唐人街的仿牌货；楼内还有小型文史馆与美食广场。想一次买齐真正本地的手信，这里最方便。",
    notes:
      "The stage outside hosts cultural performances on some evenings; check the schedule at the entrance. The Klang River walk in front connects to Masjid Jamek and the Merdeka Square area, which makes a natural half-day route with Chinatown.",
    notesZh:
      "门外舞台部分傍晚有文化表演，时间表贴在入口。门前的巴生河步道连接占美清真寺与独立广场一带，与茨厂街串成半天的顺路行程。",
    entryFee: "Free entry",
    entryFeeZh: "免费进入",
    openingHours: "Roughly 10:00–21:30 daily",
    markerLayer: "activity",
    discovery: ["shopping", "culture"],
    recommendedFor: ["shopping", "family", "rainy-day", "first-time", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Central Market, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "sri-mahamariamman-temple",
    name: "Sri Maha Mariamman Temple",
    nameZh: "马里安曼印度庙",
    destinationId: "kuala-lumpur",
    areaId: "chinatown-petaling-street",
    category: "activity",
    subcategory: "temple",
    coordinates: {
      lat: 3.1434383,
      lng: 101.6962607,
      confidence: "verified",
      coordNote:
        "OSM place_of_worship \"Sri Mahamariamman Temple\" — Jalan Tun H.S. Lee, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 30,
    bestTime: "Early morning or around 18:00 for the evening puja; avoid the midday heat",
    bestTimeZh: "清晨或傍晚 18:00 前后的晚祷；避开正午高温",
    tags: ["Temple", "Hindu", "Architecture", "Heritage", "Free"],
    tagsZh: ["庙宇", "兴都教", "建筑", "文史", "免费"],
    description:
      "Sri Maha Mariamman is the oldest Hindu temple in Kuala Lumpur, founded in 1873 on land at the edge of what became Chinatown and rebuilt in its present form in the 1960s. Its gopuram — the sculpted tower over the entrance — carries more than 200 figures, and the interior is a working temple with daily pujas rather than a museum. It is a five-minute walk from Petaling Street and sits directly beside the Chinatown entrance arch.",
    descriptionZh:
      "马里安曼印度庙是吉隆坡最古老的兴都教庙宇，1873 年建在后来成为唐人街边缘的土地上，1960 年代重建成现貌。入口上方的塔门雕有 200 多尊神像，内部是每日举行法会的运作中庙宇，而不是博物馆。离茨厂街步行五分钟，紧邻唐人街入口牌坊。",
    notes:
      "Shoes must be removed at the entrance; visitors should dress modestly and non-Hindus generally may not enter the inner sanctum. Photography inside is restricted — ask before using a camera.",
    notesZh:
      "入庙须脱鞋；着装应保守，非兴都教徒一般不得进入内殿。内部拍照有限制，使用相机前先询问。",
    entryFee: "Free (donations welcome)",
    entryFeeZh: "免费（可自愿捐献）",
    openingHours: "Roughly 06:00–20:00 daily, with pujas through the day",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "half-day", "couples"],
    activity: {
      kind: "temple",
      difficulty: "easy",
      weatherDependency: "low",
      reservationRecommended: false,
      transportContext: "Five minutes on foot from Petaling Street and Pasar Seni LRT/MRT station.",
      transportContextZh: "从茨厂街与中央艺术坊轻快铁／捷运站步行五分钟。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Sri Mahamariamman Temple, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "kwai-chai-hong",
    name: "Kwai Chai Hong",
    nameZh: "鬼仔巷",
    destinationId: "kuala-lumpur",
    areaId: "chinatown-petaling-street",
    category: "activity",
    subcategory: "street-art",
    coordinates: {
      lat: 3.1416091,
      lng: 101.6977314,
      confidence: "verified",
      coordNote:
        "OSM attraction \"Kwai Chai Hong\" — Lorong Panggung, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 30,
    bestTime: "08:00–11:00 for photographs without crowds; the lanterns are lit in the evening",
    bestTimeZh: "08:00–11:00 人少好拍照；傍晚会点灯",
    tags: ["Street art", "Murals", "Photography", "Heritage", "Free"],
    tagsZh: ["街头艺术", "壁画", "拍照", "文史", "免费"],
    description:
      "Kwai Chai Hong is a restored back-alley between Lorong Panggung and Jalan Panggung, reopened in 2019 with a series of murals by local artists depicting the Chinatown of the 1960s — barbers, kopitiam scenes, rickshaw pullers and children at play. It is small and takes half an hour, but it has become the most photographed spot in old Kuala Lumpur and is free to walk through. The surrounding lanes hold coffee shops and bars in restored shophouses.",
    descriptionZh:
      "鬼仔巷是戏院巷与邦贡巷之间一条修复过的后巷，2019 年重开，由本地艺术家绘制一系列描绘 1960 年代唐人街的壁画：理发店、咖啡店场景、人力车夫与玩耍的孩子。地方不大，半小时足够，却已成老吉隆坡最热门拍照点，免费通行。周边巷弄里是骑楼改造的咖啡店与酒吧。",
    notes:
      "It is a narrow residential back lane with residents living above, so keep noise down and do not block doorways. The best light is early morning; by midday the walls are in shadow and the alley is crowded.",
    notesZh:
      "这是仍有住户的狭窄后巷，请放低音量、不要堵住门口。清晨光线最好；正午墙面在阴影里而且人最多。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Open daily; lanterns lit in the evening",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["photo-spots", "first-time", "couples", "half-day", "solo"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Kwai Chai Hong, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "dataran-merdeka",
    name: "Dataran Merdeka (Merdeka Square)",
    nameZh: "独立广场",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "activity",
    subcategory: "square",
    coordinates: {
      lat: 3.1487691,
      lng: 101.6936377,
      confidence: "verified",
      coordNote:
        "OSM square \"Dataran Merdeka\" — Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 45,
    bestTime: "07:00–09:30 or after 17:00; the padang is fully exposed at midday",
    bestTimeZh: "07:00–09:30 或 17:00 之后；正午广场完全暴晒",
    tags: ["History", "Independence", "Photography", "Free", "Architecture"],
    tagsZh: ["历史", "独立", "拍照", "免费", "建筑"],
    description:
      "Dataran Merdeka is the former Selangor Club padang where the Union Jack was lowered and the Malayan flag raised at midnight on 31 August 1957, and it remains the symbolic centre of independent Malaysia. The 95-metre flagpole at its southern end was for years the tallest in the world, and the square is ringed by the Sultan Abdul Samad Building, the Royal Selangor Club, St Mary's Anglican Cathedral and the National History Museum. It is also the start and finish of the annual Merdeka Day parade.",
    descriptionZh:
      "独立广场原是雪兰莪俱乐部板球场，1957 年 8 月 31 日午夜英国旗在此降下、马来亚旗升起，至今仍是马来西亚独立的象征中心。南端 95 米高的旗杆曾长期是世界最高；广场四周是苏丹阿都沙末大厦、皇家雪兰莪俱乐部、圣玛丽圣公会教堂与国史博物馆。每年国庆日游行也在此起终点。",
    notes:
      "The square is free and always open, but the underground car park and the surrounding buildings keep office hours. The Dataran Merdeka and Masjid Jamek LRT stations are both within a five-minute walk, which makes this the natural start of a walking route through the colonial core.",
    notesZh:
      "广场免费且全天开放，但地下停车场与周边建筑按办公时间开放。轻快铁独立广场站与占美清真寺站都在步行五分钟内，是殖民核心步行路线的天然起点。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Open at all hours",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "family", "half-day", "couples"],
    activity: {
      kind: "temple",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "Masjid Jamek LRT and Dataran Merdeka LRT stations are both a five-minute walk away.",
      transportContextZh: "占美清真寺轻快铁站与独立广场轻快铁站都在步行五分钟内。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Dataran Merdeka, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "sultan-abdul-samad-building",
    name: "Sultan Abdul Samad Building",
    nameZh: "苏丹阿都沙末大厦",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "activity",
    subcategory: "landmark",
    coordinates: {
      lat: 3.148231,
      lng: 101.6948581,
      confidence: "verified",
      coordNote:
        "OSM public building \"Sultan Abdul Samad Building\" — Jalan Raja, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 30,
    bestTime: "Late afternoon for the façade in warm light; it is floodlit after dark",
    bestTimeZh: "傍晚立面光线最好；入夜后有泛光照明",
    tags: ["Colonial", "Moorish", "Architecture", "Landmark", "Photography"],
    tagsZh: ["殖民建筑", "摩尔式", "建筑", "地标", "拍照"],
    description:
      "The Sultan Abdul Samad Building was completed in 1897 as the offices of the British colonial administration, designed by A. C. Norman in a Moorish or Indo-Saracenic style with a 41-metre clock tower, copper onion domes and a 137-metre colonnaded arcade. It housed the Malaysian judiciary until the courts moved to Putrajaya, and today it holds the Ministry of Tourism, Arts and Culture. It is the backdrop of every Merdeka Day photograph.",
    descriptionZh:
      "苏丹阿都沙末大厦 1897 年落成，原为英国殖民政府办公地，由 A. C. Norman 以摩尔／印度-撒拉逊风格设计：41 米钟楼、铜制洋葱圆顶与 137 米长柱廊。司法机构迁往布城前这里曾是法院，现为旅游、艺术及文化部所在。它是每一张国庆日照片的背景。",
    notes:
      "The building is a working ministry and is not generally open to the public; it is admired from Dataran Merdeka and Jalan Raja. The clock tower chimes on the hour, and the whole façade is floodlit from around 19:30.",
    notesZh:
      "大楼是运作中的政府部门，一般不对外开放；观赏位置在独立广场与拉者路。钟楼整点报时，约 19:30 起整面立面打泛光灯。",
    entryFee: "Free to view from outside",
    entryFeeZh: "外观免费",
    openingHours: "Exterior visible at all hours; interior not open to the public",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "couples", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Sultan Abdul Samad Building, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "masjid-jamek",
    name: "Masjid Jamek (Jamek Mosque)",
    nameZh: "占美清真寺",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "activity",
    subcategory: "mosque",
    coordinates: {
      lat: 3.1494076,
      lng: 101.696461,
      confidence: "verified",
      coordNote:
        "OSM station \"Masjid Jamek\" — Jalan Tun Perak, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The lookup returned the LRT interchange named after the mosque, which sits immediately beside it at the confluence of the Klang and Gombak rivers; the point is the mosque's location, not a surveyed mosque footprint.",
    },
    recommendedDurationMin: 30,
    bestTime: "Morning or late afternoon; non-Muslim visitors are asked to avoid prayer times",
    bestTimeZh: "早上或傍晚；非穆斯林请避开礼拜时间",
    tags: ["Mosque", "Heritage", "Architecture", "Free", "River confluence"],
    tagsZh: ["清真寺", "文史", "建筑", "免费", "两河交汇"],
    description:
      "Masjid Jamek is the oldest mosque in Kuala Lumpur, built in 1909 by A. B. Hubback on the spit of land where the Klang and Gombak rivers meet — the point at which the city was founded. Its design is North Indian Indo-Saracenic, with three white onion domes and a palm-fringed prayer hall, and it served as the city's principal mosque until the National Mosque opened in 1965. It is the visual anchor of the river confluence that gives Kuala Lumpur its name, meaning 'muddy confluence'.",
    descriptionZh:
      "占美清真寺是吉隆坡最古老的清真寺，1909 年由 A. B. Hubback 设计，建在巴生河与鹅麦河交汇的沙嘴上，也就是这座城市起源之处。建筑为北印度印度-撒拉逊风格，三座白色洋葱圆顶，祈祷厅被棕榈环绕；1965 年国家清真寺落成前，它一直是全市主清真寺。它就是“吉隆坡”（意为泥泞的河口）得名的那个河口地标。",
    notes:
      "Non-Muslim visitors may enter outside prayer times if dressed modestly; robes are usually available. The River of Life waterfront project in front of the mosque runs nightly light-and-mist shows at the confluence, which is when the area looks best.",
    notesZh:
      "非穆斯林在礼拜时间之外、着装保守可以进入，一般提供长袍。清真寺前的“生命之河”项目每晚在河口有灯光与水雾表演，是这一带最好看的时候。",
    entryFee: "Free",
    entryFeeZh: "免费",
    openingHours: "Open daily outside the five daily prayer times",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "half-day", "couples"],
    activity: {
      kind: "temple",
      difficulty: "easy",
      weatherDependency: "low",
      reservationRecommended: false,
      transportContext: "Masjid Jamek LRT station is directly beside the mosque.",
      transportContextZh: "占美清真寺轻快铁站就在清真寺旁。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Masjid Jamek, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "national-mosque-of-malaysia",
    name: "National Mosque of Malaysia (Masjid Negara)",
    nameZh: "国家清真寺",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "activity",
    subcategory: "mosque",
    coordinates: {
      lat: 3.1419189,
      lng: 101.6920986,
      confidence: "verified",
      coordNote:
        "OSM attraction \"National Mosque of Malaysia\" — Jalan Kinabalu, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 45,
    bestTime: "09:00–11:30 or 15:00–17:00; closed to visitors during the five daily prayers, especially Friday midday",
    bestTimeZh: "09:00–11:30 或 15:00–17:00；五次礼拜期间不接待访客，周五中午尤其如此",
    tags: ["Mosque", "Architecture", "Free", "Heritage", "Landmark"],
    tagsZh: ["清真寺", "建筑", "免费", "文史", "地标"],
    description:
      "The National Mosque was completed in 1965 to mark Malaysia's independence, a Modernist design by Howard Ashley, Hisham Albakri and Baharuddin Kassim whose most distinctive feature is the 73-metre folded-plate concrete roof, folded like an open umbrella or a star. It holds around 15,000 worshippers across the main hall and galleries, and the complex includes the National Mosque Cemetery and the Islamic Arts Museum next door. Non-Muslim visitors are welcomed outside prayer times and are lent robes at the entrance.",
    descriptionZh:
      "国家清真寺 1965 年落成，为纪念马来西亚独立而建，由 Howard Ashley、Hisham Albakri 与 Baharuddin Kassim 设计，最醒目的是 73 米高、如张开雨伞或星形的折板混凝土屋顶。主殿与回廊可容纳约 15,000 名礼拜者，区内还有国家清真寺墓园，隔壁就是伊斯兰艺术博物馆。非穆斯林在礼拜时间之外可入内，入口处提供长袍。",
    notes:
      "Dress code is enforced: shoulders and knees covered, shoes off, and women are given a robe and headscarf at the entrance. Guided visits are sometimes available — ask at the counter. It is a five-minute walk from the Islamic Arts Museum and the Lake Gardens.",
    notesZh:
      "着装规定会执行：需遮肩遮膝、脱鞋，女性在入口处领取长袍与头巾。有时有导览，可在柜台询问。步行五分钟到伊斯兰艺术博物馆与湖滨公园。",
    entryFee: "Free (robes provided)",
    entryFeeZh: "免费（提供长袍）",
    openingHours: "Open to visitors outside prayer times, roughly 09:00–12:00 and 15:00–17:00 daily; Friday hours are shorter",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "family", "half-day", "photo-spots", "couples"],
    activity: {
      kind: "temple",
      difficulty: "easy",
      weatherDependency: "low",
      reservationRecommended: false,
      transportContext: "Ten minutes on foot from Masjid Jamek LRT; also walkable from KL Sentral via the museum axis.",
      transportContextZh: "从占美清真寺轻快铁站步行十分钟；也可沿博物馆轴线从中央车站走过来。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — National Mosque of Malaysia, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "islamic-arts-museum-malaysia",
    name: "Islamic Arts Museum Malaysia",
    nameZh: "伊斯兰艺术博物馆",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "activity",
    subcategory: "museum",
    coordinates: {
      lat: 3.1414525,
      lng: 101.6898711,
      confidence: "verified",
      coordNote:
        "OSM museum \"Islamic Arts Museum Malaysia\" — Jalan Lembah, Bukit Bintang, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 120,
    bestTime: "10:00–13:00 on a weekday; the buildings galleries are quietest then",
    bestTimeZh: "工作日 10:00–13:00；此时建筑展区人最少",
    tags: ["Museum", "Islamic art", "Air-conditioned", "Culture", "Rainy day"],
    tagsZh: ["博物馆", "伊斯兰艺术", "有空调", "文化", "雨天"],
    description:
      "The Islamic Arts Museum Malaysia, opened in 1998, holds one of the largest collections of Islamic decorative art in Southeast Asia — more than 7,000 artefacts across jewellery, textiles, metalwork, ceramics, Qur'an manuscripts and a set of scale models of major Islamic monuments including the Prophet's Mosque in Medina and the Taj Mahal. The building itself, with its turquoise domes and marble interiors, is part of the exhibit. It sits beside the National Mosque on the edge of the Lake Gardens.",
    descriptionZh:
      "马来西亚伊斯兰艺术博物馆 1998 年开馆，收藏东南亚规模最大的伊斯兰装饰艺术之一：逾 7,000 件文物，涵盖珠宝、织物、金属器、陶瓷、古兰经手稿，以及包括麦地那先知清真寺与泰姬陵在内的一系列伊斯兰重要建筑的等比模型。建筑本身——蓝绿色圆顶与大理石内部——也是展品的一部分。位于国家清真寺旁、湖滨公园边缘。",
    notes:
      "There is a fee for foreign visitors and a much smaller one for Malaysians; the on-site restaurant and the museum shop are both good. It combines naturally with the National Mosque, the Bird Park and Perdana Botanical Gardens in one unhurried half-day.",
    notesZh:
      "外国访客需购票，马来西亚公民票价低得多；馆内餐厅与商店都不错。与国家清真寺、飞禽公园、佩尔达纳植物园串成一个从容的半天最合适。",
    entryFee: "Ticketed (lower rate for Malaysian citizens); children under a certain age free",
    entryFeeZh: "需购票（马来西亚公民票价较低）；一定年龄以下儿童免费",
    openingHours: "Roughly 10:00–18:00 daily",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "rainy-day", "family", "half-day", "couples"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Islamic Arts Museum Malaysia, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "perdana-botanical-gardens",
    name: "Perdana Botanical Gardens",
    nameZh: "佩尔达纳植物园（湖滨公园）",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "nature",
    subcategory: "garden",
    coordinates: {
      lat: 3.1437954,
      lng: 101.6848169,
      confidence: "verified",
      coordNote:
        "OSM park \"Perdana Botanical Gardens\" — Bangsar, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 90,
    bestTime: "07:00–10:00 for shade and birds; the gardens are unshaded in the middle of the day",
    bestTimeZh: "07:00–10:00 有树荫、鸟也多；正午基本没有遮荫",
    tags: ["Garden", "Park", "Orchids", "Family", "Free"],
    tagsZh: ["植物园", "公园", "兰花", "家庭", "免费"],
    description:
      "Perdana Botanical Gardens is the former Lake Gardens, laid out in 1888 around an artificial lake and reorganised in 2011 into a set of themed gardens — a 1-hectare sunken orchid garden, a hibiscus garden, a herbarium and a deer enclosure. It is the green lung of central Kuala Lumpur, linked by footpaths to the National Museum, the National Mosque, the Islamic Arts Museum and the Bird Park, so the whole museum-and-garden quarter can be walked in one go.",
    descriptionZh:
      "佩尔达纳植物园即旧称湖滨公园，1888 年围绕人工湖辟建，2011 年重整为多个主题园区：1 公顷的下沉式兰花园、木槿园、植物标本馆与鹿园。它是吉隆坡市中心的绿肺，步道连接国家博物馆、国家清真寺、伊斯兰艺术博物馆与飞禽公园，整个博物馆加公园区可以一次走完。",
    notes:
      "Entry to the gardens is free; the Bird Park, Butterfly Park and Hibiscus Garden inside the greater complex charge separately. The lake has pedal boats, and the paths are shaded enough for a stroller but not for a wheelchair in all sections.",
    notesZh:
      "植物园免费；大园区内的飞禽公园、蝴蝶公园与木槿园分别收费。湖上有脚踏船；步道树荫够推婴儿车，但并非所有路段都适合轮椅。",
    entryFee: "Free (individual attractions within the complex charge separately)",
    entryFeeZh: "免费（园内各单独景点另行收费）",
    openingHours: "Roughly 07:00–20:00 daily",
    markerLayer: "nature",
    discovery: ["nature", "highlights"],
    recommendedFor: ["family", "adventurous", "quiet", "half-day", "photo-spots"],
    activity: {
      kind: "hike",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "Walkable from Muzium Negara MRT and KL Sentral; the gardens link on foot to the National Mosque and Bird Park.",
      transportContextZh: "从国家博物馆捷运站与中央车站可步行抵达；园内步道连接国家清真寺与飞禽公园。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Perdana Botanical Gardens, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "kuala-lumpur-bird-park",
    name: "Kuala Lumpur Bird Park",
    nameZh: "吉隆坡飞禽公园",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "nature",
    subcategory: "zoo",
    coordinates: {
      lat: 3.1436519,
      lng: 101.6889297,
      confidence: "verified",
      coordNote:
        "OSM zoo \"Kuala Lumpur Bird Park\" — Jalan Cenderawasih, Bangsar, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 90,
    bestTime: "09:00–11:30 while the birds are active and the walk-in aviary is cool",
    bestTimeZh: "09:00–11:30，鸟最活跃、步入式鸟园还凉",
    tags: ["Birds", "Family", "Children", "Wildlife", "Free-flight aviary"],
    tagsZh: ["鸟类", "家庭", "儿童", "野生动物", "自由飞鸟园"],
    description:
      "The Kuala Lumpur Bird Park opened in 1991 inside the Lake Gardens and describes itself as the world's largest free-flight walk-in aviary, with some 3,000 birds across more than 20 hectares of netted valley. The first zone allows visitors to walk among free-flying birds; later zones hold hornbills, flamingos, eagles, ostriches and a flightless-bird area. It is the single best attraction in Kuala Lumpur for young children, and it sits next to the Butterfly Park and the Hibiscus Garden.",
    descriptionZh:
      "吉隆坡飞禽公园 1991 年在湖滨公园内开放，自称世界最大的自由飞行步入式鸟园：约 3,000 只鸟，分布在 20 多公顷的网罩山谷中。第一区可以走进自由飞鸟群中；后几区有犀鸟、火烈鸟、鹰、鸵鸟与不会飞的鸟类区。它是吉隆坡最适合幼童的单一景点，旁边就是蝴蝶公园与木槿园。",
    notes:
      "Ticketed, with higher rates for foreign visitors; the bird shows run at set times and are posted at the entrance. Bring water and a hat — much of the walk is exposed — and do not feed the birds outside the supervised sessions.",
    notesZh:
      "需购票，外国访客票价较高；鸟类表演有固定时间，入口处有公告。带水与帽子——大部分步道没有遮荫；除有工作人员主持的环节外不要喂鸟。",
    entryFee: "Ticketed (higher rate for foreign visitors); children discounted",
    entryFeeZh: "需购票（外国访客票价较高）；儿童有优惠",
    openingHours: "Roughly 09:00–17:30 daily",
    markerLayer: "nature",
    discovery: ["nature", "highlights"],
    recommendedFor: ["family", "family-young-kids", "photo-spots", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Kuala Lumpur Bird Park, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "kuala-lumpur-railway-station",
    name: "Kuala Lumpur Railway Station (old KTM station)",
    nameZh: "吉隆坡火车站",
    destinationId: "kuala-lumpur",
    areaId: "merdeka-colonial-core",
    category: "activity",
    subcategory: "heritage-building",
    coordinates: {
      lat: 3.1407861,
      lng: 101.6937672,
      confidence: "verified",
      coordNote:
        "OpenStreetMap way 1161395359 (railway=station, \"KA02 Kuala Lumpur\", name:zh 吉隆坡) on Jalan Sultan Hishamuddin — resolved through the Overpass API directly after the Photon geocoder returned only fuzzy neighbours. https://www.openstreetmap.org/way/1161395359",
    },
    recommendedDurationMin: 30,
    bestTime: "Morning, then walk north to the National Mosque and Merdeka Square; the façade is floodlit at night",
    bestTimeZh: "上午来，再往北走到国家清真寺与独立广场；夜间立面有泛光照明",
    tags: ["Colonial", "Architecture", "Heritage", "Train station", "Photography"],
    tagsZh: ["殖民建筑", "建筑", "文史", "火车站", "拍照"],
    description:
      "The old Kuala Lumpur Railway Station was completed in 1910 to a design by A. B. Hubback, who gave it the same Indo-Saracenic vocabulary as Masjid Jamek — pavilions, horseshoe arches, chhatri domes and minaret-like turrets. It was the city's main rail terminus until KL Sentral opened in 2001, and it still functions as the KA02 Kuala Lumpur station on the KTM Komuter Port Klang and Seremban lines, so it is a working station rather than a museum piece. The Railway Administration Building opposite is now the KTM headquarters.",
    descriptionZh:
      "老吉隆坡火车站 1910 年落成，由 A. B. Hubback 设计，与占美清真寺共用一套印度-撒拉逊语汇：亭阁、马蹄拱、伞状圆顶与尖塔。2001 年中央车站启用前，这里是全市主要铁路终点站；如今仍是 KTM 通勤线巴生港线与芙蓉线的 KA02 吉隆坡站，仍在运作，而不是博物馆。对面的铁道局大楼现为 KTM 总部。",
    notes:
      "The building is free to enter as a station, but only ticketed passengers can go onto the platforms. The best photographs are from the forecourt on Jalan Sultan Hishamuddin, and the walk north to the National Mosque takes about ten minutes.",
    notesZh:
      "作为车站可免费进入，但只有持票乘客才能上月台。最好的拍摄位置是苏丹希沙慕丁路前的广场，往北步行约十分钟到国家清真寺。",
    entryFee: "Free to enter the station",
    entryFeeZh: "进入车站免费",
    openingHours: "Station open from early morning until late; trains run on the KTM Komuter timetable",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "couples", "half-day"],
    verificationStatus: "verified",
    sources: [
      {
        kind: "geographic",
        label: "OpenStreetMap way 1161395359 (KA02 Kuala Lumpur railway station)",
        url: "https://www.openstreetmap.org/way/1161395359",
      },
    ],
  },
  {
    id: "titiwangsa-lake-park",
    name: "Titiwangsa Lake Park",
    nameZh: "蒂蒂旺沙湖滨公园",
    destinationId: "kuala-lumpur",
    areaId: "chow-kit",
    category: "nature",
    subcategory: "park",
    coordinates: {
      lat: 3.1778255,
      lng: 101.7069202,
      confidence: "verified",
      coordNote:
        "OSM park \"Titiwangsa Lake Park\" — Semarak, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "Early morning for the jogging track and the mist on the water, or late afternoon for the skyline at sunset",
    bestTimeZh: "清晨跑步与湖面薄雾最好，或傍晚看日落时的天际线",
    tags: ["Park", "Lake", "Skyline view", "Running", "Family"],
    tagsZh: ["公园", "湖泊", "天际线", "跑步", "家庭"],
    description:
      "Titiwangsa Lake Park is a 95-hectare park and lake north of the city centre, laid out in the 1970s and rebuilt around 2019 with a lakeside promenade, a jogging and cycling track and a large playground. Its main draw for visitors is the view: because it sits north of the centre, the whole Kuala Lumpur skyline — including the Petronas Towers and the Exchange 106 and Merdeka 118 towers — lines up across the water at sunset. There is also a small water-sports centre with pedal boats and kayaks.",
    descriptionZh:
      "蒂蒂旺沙湖滨公园位于市中心以北，占地约 95 公顷，1970 年代辟建，2019 年前后重整，新增湖畔步道、跑步与自行车道及大型游乐场。对旅客最大的看点是视野：因为位于市中心以北，日落时整条吉隆坡天际线——包括双子塔、106 交易塔与默迪卡 118——会在湖面上一字排开。园内还有小型水上活动中心，提供脚踏船与皮划艇。",
    notes:
      "Free and open long hours; the lakeside is almost fully exposed, so go early or late. It is a short Grab ride from Chow Kit and about ten minutes' walk from Titiwangsa MRT and monorail stations.",
    notesZh:
      "免费、开放时间长；湖畔几乎没有遮荫，宜早或傍晚去。从秋杰打车很短，从蒂蒂旺沙捷运与单轨站步行约十分钟。",
    entryFee: "Free (water-sports centre charges separately)",
    entryFeeZh: "免费（水上活动中心另行收费）",
    openingHours: "Roughly 06:00–22:00 daily",
    markerLayer: "nature",
    discovery: ["nature", "highlights"],
    recommendedFor: ["family", "sunset", "photo-spots", "quiet", "family-young-kids"],
    activity: {
      kind: "sunset",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "Ten minutes on foot from Titiwangsa MRT/monorail, or a short Grab ride north from Chow Kit.",
      transportContextZh: "从蒂蒂旺沙捷运／单轨站步行十分钟，或从秋杰打车往北一小段。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Titiwangsa Lake Park, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "royal-selangor-visitor-centre",
    name: "Royal Selangor Visitor Centre",
    nameZh: "皇家雪兰莪锡镴访客中心",
    destinationId: "kuala-lumpur",
    areaId: "chow-kit",
    category: "activity",
    subcategory: "factory-tour",
    coordinates: {
      lat: 3.195917,
      lng: 101.7246161,
      confidence: "verified",
      coordNote:
        "OSM retail \"Royal Selangor Visitor Centre\" — Jalan Usahawan 6, Setapak, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). Setapak is north-east of Chow Kit; the centre is grouped with the Chow Kit/north KL zone here.",
    },
    recommendedDurationMin: 90,
    bestTime: "10:00–15:00 on a weekday; the free guided tours run several times a day",
    bestTimeZh: "工作日 10:00–15:00；免费导览每天数场",
    tags: ["Pewter", "Craft", "Factory tour", "Shopping", "Family"],
    tagsZh: ["锡镴", "手工艺", "工厂参观", "购物", "家庭"],
    description:
      "Royal Selangor is the world's largest pewter manufacturer, founded in 1885 as Selangor Pewter by a young Chinese tinsmith named Yong Koon, and its visitor centre in Setapak runs free guided tours through the working factory. You watch casting, filing, polishing and the hand-hammering of the signature satin finish, then can try a pewter-smithing workshop and buy from the factory shop. It is one of the few genuinely industrial visits in Kuala Lumpur and it is well suited to a wet afternoon.",
    descriptionZh:
      "皇家雪兰莪是全球最大的锡镴制造商，1885 年由华人锡匠杨堃创立，位于文良港（Setapak）的访客中心提供免费工厂导览。可以看到铸造、锉修、抛光与标志性缎面手工锤打的全过程，之后可参加锡镴手作工作坊并在工厂店选购。这是吉隆坡少见的真正工业参观，也很适合下雨的下午。",
    notes:
      "The guided tour is free and includes a short history gallery; the pewter-smithing workshop is a paid add-on and needs booking at busy times. It is a 10–15 minute Grab ride from Chow Kit or Titiwangsa — not walkable.",
    notesZh:
      "导览免费，含一段历史展厅；锡镴手作工作坊另行收费，繁忙时段需预约。从秋杰或蒂蒂旺沙打车 10–15 分钟，不适合步行。",
    entryFee: "Free guided tour; the pewter-smithing workshop is a paid add-on",
    entryFeeZh: "导览免费；锡镴手作工作坊另行收费",
    openingHours: "Roughly 09:00–17:00 daily",
    markerLayer: "activity",
    discovery: ["culture", "shopping"],
    recommendedFor: ["family", "rainy-day", "shopping", "half-day", "couples"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Royal Selangor Visitor Centre, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "chow-kit-market",
    name: "Chow Kit Market",
    nameZh: "秋杰巴刹",
    destinationId: "kuala-lumpur",
    areaId: "chow-kit",
    category: "food",
    subcategory: "market",
    coordinates: {
      lat: 3.1643853,
      lng: 101.6994536,
      confidence: "verified",
      coordNote:
        "OSM marketplace \"Chow Kit Market\" — Jalan Raja Alang, Kampung Baru, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "07:00–11:00 — the wet market is a morning trade; the surrounding food stalls peak at breakfast",
    bestTimeZh: "07:00–11:00——湿巴刹做的是早市；周边小吃摊早餐时段最旺",
    tags: ["Wet market", "Local", "Street food", "Breakfast", "Photography"],
    tagsZh: ["湿巴刹", "本地", "街头小吃", "早餐", "拍照"],
    description:
      "Chow Kit Market is the largest fresh-produce and wet market in Kuala Lumpur, split between a covered hall on Jalan Raja Bot and an open-air section along Jalan Raja Alang. It sells vegetables, fish, meat, spices and Malay ingredients to a mostly local crowd, and the lanes around it are lined with warungs and stalls serving nasi lemak, laksa, roti canai and Indonesian dishes from early morning. It is a working market, not a tourist one, and that is the reason to come.",
    descriptionZh:
      "秋杰巴刹是吉隆坡最大的生鲜湿货市场，分为拉惹波路的有盖大厅与拉惹阿郎路的露天部分，向本地客群售卖蔬菜、鱼、肉、香料与马来食材；周边巷弄从清晨起就摆满卖椰浆饭、叻沙、印度煎饼与印尼菜的小店与摊档。它是正在运转的市场，不是观光市场，这也正是值得来的理由。",
    notes:
      "Go early, wear closed shoes — the floors are wet — and keep bags zipped. The market is a two-minute walk from Chow Kit monorail station and about ten minutes from the HGI and Tune hotels on Jalan TAR.",
    notesZh:
      "要早去，穿不露脚的鞋（地面湿滑），包要拉好。市场离秋杰单轨站步行两分钟，从端姑阿都拉曼路的酒店走过来约十分钟。",
    entryFee: "Free entry",
    entryFeeZh: "免费进入",
    openingHours: "Roughly 06:00–17:00 daily; the wet market is busiest before 11:00",
    markerLayer: "food",
    discovery: ["food", "culture"],
    recommendedFor: ["food-lovers", "budget", "photo-spots", "solo", "adventurous"],
    dining: {
      cuisines: ["international", "indian"],
      mealTypes: ["breakfast", "lunch"],
      priceTier: "$",
      signatureItems: ["Nasi lemak", "Laksa", "Roti canai", "Nasi campur"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Chow Kit Market, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "nasi-lemak-wanjo",
    name: "Nasi Lemak Wanjo",
    nameZh: "旺姐椰浆饭",
    destinationId: "kuala-lumpur",
    areaId: "kampung-baru",
    category: "food",
    subcategory: "hawker",
    coordinates: {
      lat: 3.1624468,
      lng: 101.7044457,
      confidence: "verified",
      coordNote:
        "OSM restaurant \"Nasi Lemak Wanjo\" — Jalan Raja Muda Musa, Kampung Baru, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 45,
    bestTime: "07:00–11:00 for breakfast and the full spread; it sells out and closes by mid-afternoon",
    bestTimeZh: "07:00–11:00 吃早餐、菜色最全；通常下午前卖完就收",
    tags: ["Nasi lemak", "Malay", "Breakfast", "Cheap eats", "Local favourite"],
    tagsZh: ["椰浆饭", "马来菜", "早餐", "平价", "本地最爱"],
    description:
      "Nasi Lemak Wanjo is the best-known nasi lemak shop in Kampung Baru and probably in Kuala Lumpur: a corner eating house on Jalan Raja Muda Musa serving coconut rice with sambal, fried chicken, beef rendang, sotong, fried egg and cucumber from early morning. It is counter-service and unfussy — you point at what you want and pay by the item — and the queue is part of the experience. The whole street around it is a Malay food strip that is worth walking after eating.",
    descriptionZh:
      "旺姐椰浆饭是甘榜峇鲁、也大概是全吉隆坡最有名的椰浆饭小店，位于拉惹慕沙路转角，从清早开始供应椰浆饭配参巴、炸鸡、仁当牛肉、苏东、煎蛋与黄瓜。柜台式服务、不讲排场——指哪样拿哪样、按件计价，排队本身就是体验的一部分。吃完可以沿着这条街继续走，整条都是马来食街。",
    notes:
      "Cash and e-wallets; peak queue is 08:00–10:00 on weekends. Non-halal items are not served — this is a Malay, halal kitchen. It is a ten-minute walk from Kampung Baru LRT and about 15 minutes from KLCC across the Saloma Link.",
    notesZh:
      "收现金与电子钱包；周末 08:00–10:00 排队最长。这里不卖非清真食品，是马来清真厨房。从甘榜峇鲁轻快铁站步行十分钟，经 Saloma 桥到双子塔约 15 分钟。",
    entryFee: "Free entry; pay per item",
    entryFeeZh: "免费进入；按件付费",
    openingHours: "Roughly 07:00 until sold out (usually early to mid afternoon)",
    markerLayer: "food",
    discovery: ["food", "highlights"],
    recommendedFor: ["food-lovers", "budget", "halal", "first-time", "family"],
    dining: {
      cuisines: ["international"],
      mealTypes: ["breakfast", "brunch", "lunch"],
      priceTier: "$",
      signatureItems: ["Nasi lemak with sambal", "Fried chicken", "Beef rendang", "Sotong sambal"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Nasi Lemak Wanjo, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "little-india-brickfields",
    name: "Little India Brickfields",
    nameZh: "十五碑小印度",
    destinationId: "kuala-lumpur",
    areaId: "brickfields-kl-sentral",
    category: "activity",
    subcategory: "district",
    coordinates: {
      lat: 3.1290537,
      lng: 101.6840403,
      confidence: "verified",
      coordNote:
        "OSM attraction \"Little India\" — Jalan Tun Sambanthan, Brickfields, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "Morning for the markets and temples, or dinner for the banana-leaf restaurants",
    bestTimeZh: "早上逛市场与庙宇，或晚饭时间来吃香蕉叶饭",
    tags: ["Indian", "Food", "Saree shops", "Temples", "Street life"],
    tagsZh: ["印度", "美食", "纱丽店", "庙宇", "街头生活"],
    description:
      "Little India runs along Jalan Tun Sambanthan in Brickfields, the neighbourhood built around the railway workshops that drew a large Tamil workforce from the late 19th century. It is a kilometre of banana-leaf restaurants, sweet shops, gold jewellers and 24-hour saree and textile stores, with the Sri Kandaswamy Kovil and the Buddhist Maha Vihara among its places of worship. It is one of the largest Little Indias in Malaysia and it is a five-minute walk from KL Sentral.",
    descriptionZh:
      "小印度沿十五碑的敦善班丹路展开。十九世纪末铁路工场吸引了大批泰米尔劳工，这一带因此成形。一公里长的街上全是香蕉叶饭店、甜品店、金饰店与 24 小时纱丽布匹店，其间有斯里坎达斯瓦米兴都庙与佛教大寺。它是全马最大的小印度之一，离中央车站步行五分钟。",
    notes:
      "The Deepavali season (October–November) is when the street is at its most decorated and most crowded. Most restaurants are vegetarian or serve both; many are banana-leaf style, where you eat with your right hand and pay a fixed price for unlimited rice and sides.",
    notesZh:
      "屠妖节前后（10–11 月）是这条街装饰最盛、人也最多的时候。多数餐厅为素食或荤素兼营，不少是香蕉叶饭形式：用右手进食，米饭与配菜可无限续，按固定价收费。",
    entryFee: "Free to walk",
    entryFeeZh: "逛街免费",
    openingHours: "Shops roughly 09:00–21:00; restaurants run from breakfast until late",
    markerLayer: "activity",
    discovery: ["culture", "food"],
    recommendedFor: ["food-lovers", "photo-spots", "vegetarian", "budget", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Little India, Brickfields, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "kl-sentral",
    name: "KL Sentral",
    nameZh: "吉隆坡中央车站",
    destinationId: "kuala-lumpur",
    areaId: "brickfields-kl-sentral",
    category: "transport",
    subcategory: "station",
    coordinates: {
      lat: 3.1341106,
      lng: 101.6865153,
      confidence: "verified",
      coordNote:
        "OSM station \"KL Sentral\" — Jalan Stesen Sentral, Seputeh, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 30,
    bestTime: "Any time; allow 20 minutes before a KLIA Ekspres departure in peak hours",
    bestTimeZh: "任何时间；高峰时段赶机场快线请预留 20 分钟",
    tags: ["Transport", "Train", "Airport transfer", "LRT", "Monorail"],
    tagsZh: ["交通", "火车", "机场交通", "轻快铁", "单轨"],
    description:
      "KL Sentral is the transport hub of Kuala Lumpur and the busiest railway station in Southeast Asia by passenger numbers: the terminus of the KLIA Ekspres and KLIA Transit airport trains, the Kelana Jaya and Sri Petaling LRT lines, the KTM Komuter network, the monorail link and a large bus interchange, all under one roof. Above it is the Nu Sentral mall, and around it is the hotel cluster of Brickfields. For almost every trip in the Klang Valley, this is where the connections are.",
    descriptionZh:
      "吉隆坡中央车站是全城的交通枢纽，按客流量算是东南亚最繁忙的火车站：机场快线与机场支线的终点，格拉那再也线与大城堡线轻快铁、KTM 通勤铁路网、单轨连接线与大型巴士换乘站全在同一屋檐下。楼上是 Nu Sentral 商场，周边是十五碑的酒店群。在巴生谷几乎任何一趟行程，换乘都在这里。",
    notes:
      "The KLIA Ekspres takes about 28 minutes non-stop to KUL; buy at the counter or online. Trains to different lines use different levels, and the monorail is reached by a covered walkway from the Nu Sentral side — allow extra time the first visit. Left-luggage lockers are available in the concourse.",
    notesZh:
      "机场快线直达吉隆坡国际机场约 28 分钟，柜台或网上购票。不同线路在不同楼层，单轨要从 Nu Sentral 一侧经连廊前往，第一次来请多留时间。大厅有投币寄存柜。",
    entryFee: "Free to enter; travel requires a ticket or Touch 'n Go card",
    entryFeeZh: "进站免费；乘车需车票或 Touch 'n Go 卡",
    openingHours: "Station open around the clock; KLIA Ekspres roughly 05:00–01:00",
    markerLayer: "transport",
    discovery: ["highlights"],
    recommendedFor: ["first-time", "solo", "family", "budget"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — KL Sentral, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "thean-hou-temple",
    name: "Thean Hou Temple",
    nameZh: "天后宫",
    destinationId: "kuala-lumpur",
    areaId: "brickfields-kl-sentral",
    category: "activity",
    subcategory: "temple",
    coordinates: {
      lat: 3.1218431,
      lng: 101.6876446,
      confidence: "verified",
      coordNote:
        "OSM place_of_worship \"Thean Hou Temple\" — Persiaran Endah, Seputeh, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "08:00–10:30 or after 17:00; the lanterns are lit in the evening and during Chinese New Year",
    bestTimeZh: "08:00–10:30 或 17:00 之后；傍晚与农历新年期间会点灯笼",
    tags: ["Temple", "Chinese", "Viewpoint", "Photography", "Free"],
    tagsZh: ["庙宇", "华人", "观景", "拍照", "免费"],
    description:
      "Thean Hou Temple is a six-tiered Chinese temple on Robson Hill in Seputeh, completed in 1987 and dedicated to the sea goddess Mazu, with separate halls to Guan Yin and Shui Wei Sheng Niang. Built by the Hainanese community, it is one of the largest Chinese temples in Southeast Asia and combines Buddhist, Taoist and Confucian elements, with a marriage registration office and a wishing well on site. Its terrace gives a wide view south over the city, which is why it is a favourite at Chinese New Year and for wedding photographs.",
    descriptionZh:
      "天后宫是位于十五碑罗布森山的六层华人庙宇，1987 年落成，主祀妈祖，另设观音与水尾圣娘殿，由海南社群兴建，是东南亚最大的华人庙宇之一，融合佛、道、儒元素，庙内还设有婚姻注册处与许愿井。平台上可向南俯瞰市区，因此农历新年与拍婚纱照时特别热门。",
    notes:
      "Free to enter, with a small charge for the car park; the temple is a steep walk up from the road, so most visitors take a Grab. Chinese New Year and the ninth day of the lunar new year (Ti Kong) are the busiest nights of the year.",
    notesZh:
      "免费进入，停车场另收小额费用；从路边上庙是一段陡坡，多数人打车上来。农历新年与初九天公诞是一年中最热闹的夜晚。",
    entryFee: "Free (small parking charge)",
    entryFeeZh: "免费（停车另收小额费用）",
    openingHours: "Roughly 08:00–22:00 daily",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "special-occasion", "couples", "family"],
    activity: {
      kind: "temple",
      difficulty: "easy",
      weatherDependency: "low",
      reservationRecommended: false,
      transportContext: "Grab is the practical way up Robson Hill; about ten minutes from KL Sentral or Bangsar.",
      transportContextZh: "上罗布森山最方便是打车；从中央车站或孟沙约十分钟。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Thean Hou Temple, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "national-museum",
    name: "National Museum (Muzium Negara)",
    nameZh: "国家博物馆",
    destinationId: "kuala-lumpur",
    areaId: "brickfields-kl-sentral",
    category: "activity",
    subcategory: "museum",
    coordinates: {
      lat: 3.1371006,
      lng: 101.6873833,
      confidence: "verified",
      coordNote:
        "OSM station \"National Museum\" — Jalan Damansara, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM). The lookup returned the MRT station named after the museum, which stands immediately beside it; the point is the museum's location rather than a surveyed museum footprint.",
    },
    recommendedDurationMin: 90,
    bestTime: "10:00–13:00; the building is air-conditioned, so it also works as a rain plan",
    bestTimeZh: "10:00–13:00；馆内有空调，也可当作雨天备案",
    tags: ["Museum", "History", "Culture", "Air-conditioned", "Rainy day"],
    tagsZh: ["博物馆", "历史", "文化", "有空调", "雨天"],
    description:
      "The National Museum of Malaysia opened in 1963 in a building whose façade carries two large murals of Malaysian history and culture, and it lays out the country's story in four galleries running from prehistory through the Hindu-Buddhist kingdoms and the Malay sultanates to the colonial period and independence. Outside are a traditional Malay house, a colonial-era train and other outdoor exhibits. It is the standard orientation stop before visiting the surrounding heritage buildings and the Lake Gardens.",
    descriptionZh:
      "马来西亚国家博物馆 1963 年开馆，正立面有两幅大型历史文化壁画，四个展厅按时间顺序铺开：史前、印度-佛教王国与马来苏丹王朝、殖民时期，到独立。室外有传统马来高脚屋、殖民时期火车头与其他户外展品。在逛周边古迹与湖滨公园之前，这里是最标准的入门一站。",
    notes:
      "Ticketed, with a low rate for Malaysian citizens and a higher one for foreign visitors; closed on the first Monday of the month in some years — check before setting out. The Muzium Negara MRT station is directly outside the gate.",
    notesZh:
      "需购票，马来西亚公民票价低、外国访客较高；部分年份每月第一个周一闭馆，出发前请确认。捷运国家博物馆站就在大门外。",
    entryFee: "Ticketed (lower rate for Malaysian citizens)",
    entryFeeZh: "需购票（马来西亚公民票价较低）",
    openingHours: "Roughly 09:00–17:00 daily; check for monthly closures",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["quiet", "first-time", "family", "rainy-day", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — National Museum, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "terminal-bersepadu-selatan",
    name: "Terminal Bersepadu Selatan (TBS)",
    nameZh: "南湖镇综合交通终站（TBS）",
    destinationId: "kuala-lumpur",
    areaId: "bukit-jalil-cheras",
    category: "transport",
    subcategory: "bus-terminal",
    coordinates: {
      lat: 3.0780334,
      lng: 101.7110959,
      confidence: "verified",
      coordNote:
        "OSM bus_station \"Terminal Bersepadu Selatan (TBS)\" — Jalan Terminal Selatan, Salak South, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 30,
    bestTime: "Arrive 45 minutes before a departure; the terminal is busiest on Friday evenings and before public holidays",
    bestTimeZh: "发车前 45 分钟到；周五晚上与公共假期前最挤",
    tags: ["Transport", "Bus terminal", "Long-distance", "Airport-style"],
    tagsZh: ["交通", "巴士总站", "长途", "机场式"],
    description:
      "Terminal Bersepadu Selatan is Kuala Lumpur's main long-distance bus terminal, opened in 2011 at Bandar Tasik Selatan and built to airport-terminal standards: a single concourse with ticketing, departure gates, luggage handling and direct integration with the Sri Petaling LRT, KTM Komuter and KLIA Transit. Almost every southbound coach — to Johor Bahru, Singapore, Melaka, the KLIA terminals and the southern states — leaves from here, and the Singapore services in particular are frequent and heavily used.",
    descriptionZh:
      "南湖镇综合交通终站是吉隆坡主要的长途巴士总站，2011 年在南湖镇启用，按机场航站楼标准建造：单一楼层大厅，售票、登车口、行李处理，并与大城堡轻快铁、KTM 通勤线与机场支线直接连通。几乎所有南向班车——往新山、新加坡、马六甲、机场航站楼与南部各州——都在这里发车，其中往新加坡的班次尤其密集。",
    notes:
      "Buy through the terminal's official online portal or at the counter; third-party agents often add a fee. The station is directly connected to Bandar Tasik Selatan interchange by a covered link, so the LRT and KLIA Transit reach it without going outside.",
    notesZh:
      "建议通过总站官方网上平台或柜台购票，第三方代理常加收费用。车站与南湖镇换乘站有连廊直连，轻快铁与机场支线都无需出站即可到达。",
    entryFee: "Free to enter; travel requires a ticket",
    entryFeeZh: "进站免费；乘车需购票",
    openingHours: "Open around the clock; ticket counters roughly 06:00–24:00",
    markerLayer: "transport",
    discovery: ["highlights"],
    recommendedFor: ["solo", "budget", "first-time", "adventurous"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Terminal Bersepadu Selatan, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "bukit-jalil-national-stadium",
    name: "Bukit Jalil National Stadium",
    nameZh: "武吉加里尔国家体育场",
    destinationId: "kuala-lumpur",
    areaId: "bukit-jalil-cheras",
    category: "activity",
    subcategory: "stadium",
    coordinates: {
      lat: 3.0546755,
      lng: 101.691369,
      confidence: "verified",
      coordNote:
        "OSM stadium \"Bukit Jalil National Stadium\" — Persiaran KL Sports City, Bukit Jalil, Kuala Lumpur, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 120,
    bestTime: "Only on event days; gates usually open two to three hours before kick-off",
    bestTimeZh: "仅在有活动的日子；一般开场前两三小时开门",
    tags: ["Stadium", "Football", "Concerts", "Sport", "Events"],
    tagsZh: ["体育场", "足球", "演唱会", "体育", "活动"],
    description:
      "The National Stadium at Bukit Jalil opened in 1998 for the Commonwealth Games and seats around 87,000, making it the largest stadium in Malaysia and the venue for the national football team, major concerts and the 2017 SEA Games. Its retractable roof and the surrounding KL Sports City complex — Axiata Arena, the National Aquatic Centre and the hockey stadium — form the country's main sports precinct, 20 minutes south of the centre on the Sri Petaling LRT line. Outside event days there is little to see.",
    descriptionZh:
      "武吉加里尔国家体育场 1998 年为共和联邦运动会启用，可容纳约 8.7 万人，是全马最大的体育场，也是国家足球队、大型演唱会与 2017 年东南亚运动会的主场。可开合屋顶与周边的吉隆坡体育城——Axiata 体育馆、国家游泳中心与曲棍球场——构成全国主要体育区，搭大城堡轻快铁线到市中心约 20 分钟。没有活动的日子基本没什么可看。",
    notes:
      "Entry is only possible with an event ticket; on match and concert nights the LRT to Bukit Jalil is extremely crowded and the roads around the stadium close. Plan to arrive early and leave late, or book a hotel within walking distance.",
    notesZh:
      "只有持活动门票才能进场；比赛与演唱会当晚，开往武吉加里尔的轻快铁极其拥挤，体育场周边道路封闭。要么早到迟走，要么订步行范围内的酒店。",
    entryFee: "Event ticket required",
    entryFeeZh: "需持活动门票",
    openingHours: "Event days only; the surrounding sports city is publicly accessible",
    markerLayer: "activity",
    discovery: ["highlights"],
    recommendedFor: ["friends", "family", "party"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Bukit Jalil National Stadium, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "batu-caves",
    name: "Batu Caves",
    nameZh: "黑风洞",
    destinationId: "kuala-lumpur",
    areaId: "batu-caves-gombak",
    category: "activity",
    subcategory: "cave-temple",
    coordinates: {
      lat: 3.237449,
      lng: 101.6836621,
      confidence: "verified",
      coordNote:
        "OSM place_of_worship \"Sri Subramaniar Swamy Temple\" — To Dark Caves, Kampung Indian Settlement Batu Caves, Selayang, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM, locality \"Batu Caves\"). This is the temple at the foot of the 272 steps; the Temple Cave is directly above it.",
    },
    recommendedDurationMin: 150,
    bestTime: "07:00–10:00 before the heat and the tour buses; Thaipusam (January/February) is spectacular but extremely crowded",
    bestTimeZh: "07:00–10:00，避开高温与旅行团；大宝森节（1–2 月）场面壮观但极其拥挤",
    tags: ["Temple", "Cave", "Hindu", "Landmark", "Day trip"],
    tagsZh: ["庙宇", "洞穴", "兴都教", "地标", "一日游"],
    description:
      "Batu Caves is a limestone hill 13 km north of central Kuala Lumpur whose Cathedral Cave has housed a Hindu shrine since about 1890, when K. Thamboosamy Pillai installed a Murugan shrine inside it. Visitors climb 272 concrete steps past a 42.7-metre gilded statue of Lord Muruga into the Temple Cave, a 100-metre-high chamber open to the sky at the top, and the complex also includes the Dark Cave — a protected 2 km cave system with endemic wildlife that is visited separately by guided tour. It is the focal point of Thaipusam, when over a million pilgrims attend.",
    descriptionZh:
      "黑风洞是吉隆坡市中心以北 13 公里的一座石灰岩山丘，最大的神庙洞自 1890 年前后由 K. Thamboosamy Pillai 安置穆鲁干神龛起就是兴都教圣地。游客沿 272 级混凝土台阶，经过 42.7 米高的贴金穆鲁干神像，进入高约 100 米、顶部向天开口的神庙洞。区内另有黑洞——一条 2 公里、有特有种生物的保护区洞穴系统，需另行参加导览。大宝森节时这里聚集逾百万信徒。",
    notes:
      "The steps are free to climb and open long hours; the Dark Cave and the museum charge separately and the Dark Cave is often closed for conservation. Dress code at the steps: no short shorts or sleeveless tops unless you hire a sarong at the base. The monkeys will grab food and loose bags — do not carry food up. KTM Komuter from KL Sentral reaches Batu Caves station in about 30 minutes.",
    notesZh:
      "台阶免费、开放时间长；黑洞与博物馆另行收费，黑洞常因保护原因关闭。台阶入口对着装有要求：不可穿超短裤或无袖上衣，可在下方租纱笼。猴子会抢食物与没拉好的包——不要把食物带上去。从中央车站搭 KTM 通勤线约 30 分钟到黑风洞站。",
    entryFee: "Free to climb the steps and enter the Temple Cave; Dark Cave and the museum charge separately",
    entryFeeZh: "登台阶与进入神庙洞免费；黑洞与博物馆另行收费",
    openingHours: "Roughly 06:00–21:00 daily; Dark Cave by guided tour only",
    markerLayer: "activity",
    discovery: ["culture", "nature", "highlights"],
    recommendedFor: ["first-time", "adventurous", "photo-spots", "family", "half-day"],
    activity: {
      kind: "temple",
      difficulty: "moderate",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "KTM Komuter from KL Sentral to Batu Caves station takes about 30 minutes; the steps start a short walk from the station.",
      transportContextZh: "从中央车站搭 KTM 通勤线到黑风洞站约 30 分钟，出站步行一小段就是台阶起点。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Sri Subramaniar Swamy Temple, Batu Caves, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "village-park-restaurant",
    name: "Village Park Restaurant",
    nameZh: "乡村公园餐厅（Village Park）",
    destinationId: "kuala-lumpur",
    areaId: "petaling-jaya-subang-jaya",
    category: "food",
    subcategory: "restaurant",
    coordinates: {
      lat: 3.1377593,
      lng: 101.6233892,
      confidence: "verified",
      coordNote:
        "OSM restaurant \"Village Park Restaurant\" — Jalan SS 21/37, Damansara Utama, Petaling Jaya, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 45,
    bestTime: "07:00–10:30 for breakfast; the queue is longest on weekend mornings",
    bestTimeZh: "07:00–10:30 吃早餐；周末早上排队最长",
    tags: ["Nasi lemak", "Breakfast", "Local favourite", "Cheap eats", "Malay"],
    tagsZh: ["椰浆饭", "早餐", "本地最爱", "平价", "马来菜"],
    description:
      "Village Park Restaurant in Damansara Utama is routinely named the best nasi lemak in the Klang Valley: coconut rice with a crisp-fried chicken thigh, sambal, peanuts, anchovies and cucumber, served from early morning. It is a plain air-conditioned shop-lot restaurant with a permanent queue, and the nasi lemak is the reason people drive across Petaling Jaya for it. There is a second branch in Petaling Jaya, but the Damansara Utama original is the one that earned the reputation.",
    descriptionZh:
      "白沙罗乌达马的 Village Park 常年被评为巴生谷最好的椰浆饭：椰香米饭配炸鸡腿、参巴、花生、江鱼仔与黄瓜，从清早开始供应。它是一家普通的空调店铺餐厅，永远在排队，而人们愿意为此专程开车穿过八打灵再也。八打灵再也有分店，但让这家店成名的还是乌达马这家本店。",
    notes:
      "Cash and e-wallets; go before 09:00 to avoid the worst of the queue. It is a 10–15 minute Grab ride from the Bandar Utama and TTDI areas, and not near any LRT station — plan for a car or taxi.",
    notesZh:
      "收现金与电子钱包；09:00 前到可以少排一会儿。从万达镇、敦依斯迈医生花园一带打车 10–15 分钟，附近没有轻快铁站——请安排车或打车。",
    entryFee: "Free entry; pay per item",
    entryFeeZh: "免费进入；按件付费",
    openingHours: "Roughly 07:00–19:30 daily (closes earlier when sold out)",
    markerLayer: "food",
    discovery: ["food", "highlights"],
    recommendedFor: ["food-lovers", "halal", "family", "budget", "first-time"],
    dining: {
      cuisines: ["international"],
      mealTypes: ["breakfast", "brunch", "lunch"],
      priceTier: "$",
      signatureItems: ["Nasi lemak with fried chicken", "Sambal", "Rendang"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Village Park Restaurant, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "sunway-lagoon",
    name: "Sunway Lagoon",
    nameZh: "双威水上乐园",
    destinationId: "kuala-lumpur",
    areaId: "petaling-jaya-subang-jaya",
    category: "activity",
    subcategory: "water-park",
    coordinates: {
      lat: 3.0706506,
      lng: 101.6107862,
      confidence: "verified",
      coordNote:
        "OSM bus_station \"Sunway Lagoon\" — Sunway City, Subang Jaya City Council, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM). The point is the park's own transport stop inside the Sunway City complex.",
    },
    recommendedDurationMin: 300,
    bestTime: "Arrive at opening (usually 10:00) on a weekday; weekends and school holidays are very busy",
    bestTimeZh: "工作日开园（一般 10:00）就到；周末与学校假期非常挤",
    tags: ["Water park", "Theme park", "Family", "Children", "Full day"],
    tagsZh: ["水上乐园", "主题乐园", "家庭", "儿童", "一整天"],
    description:
      "Sunway Lagoon is a 36-hectare theme park built in a former tin mine at Bandar Sunway, combining a water park, amusement park, wildlife park, extreme sports area and the Nickelodeon-themed zone on one ticket. It is the largest theme park in the Klang Valley and the reason many families base themselves at the Sunway hotels: the park sits directly below Sunway Pyramid mall and the resort complex. A full day is needed to cover it, and the artificial surf beach is the signature attraction.",
    descriptionZh:
      "双威水上乐园建在双威城一座旧锡矿湖上，占地约 36 公顷，一张门票包含水上乐园、游乐园、野生动物园、极限运动区与尼克儿童频道主题区。它是巴生谷最大的主题乐园，也是许多家庭选择住双威系酒店的原因：乐园就在双威金字塔商场与度假综合体正下方。玩遍需要一整天，人工冲浪海滩是它的招牌。",
    notes:
      "Ticketed with separate rates for Malaysians and foreign visitors, and different prices for the water park only versus the full multi-park pass. Lockers and towel hire are available; outside food is restricted. It is reached by the BRT Sunway Line from USJ7 or Setia Jaya KTM station.",
    notesZh:
      "需购票，马来西亚公民与外国访客票价不同，只玩水上乐园与全场通票价格也不同。园内有寄存柜与毛巾租赁，对外带食物有限制。可搭 BRT 双威线从 USJ7 或 Setia Jaya KTM 站抵达。",
    entryFee: "Ticketed (lower rates for Malaysian citizens); multi-park passes cost more",
    entryFeeZh: "需购票（马来西亚公民票价较低）；全场通票价格更高",
    openingHours: "Roughly 10:00–18:00 daily; check the calendar for closed days and school-holiday extensions",
    markerLayer: "activity",
    discovery: ["highlights", "water"],
    recommendedFor: ["family", "family-young-kids", "friends", "full-day"],
    activity: {
      kind: "beachclub",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: true,
      transportContext: "BRT Sunway Line from USJ7 LRT or Setia Jaya KTM station; about 30–40 minutes by road from central KL.",
      transportContextZh: "搭 BRT 双威线从 USJ7 轻快铁或 Setia Jaya KTM 站前往；从吉隆坡市中心开车约 30–40 分钟。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Sunway Lagoon, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "putra-mosque",
    name: "Putra Mosque (Masjid Putra)",
    nameZh: "布特拉清真寺（粉红清真寺）",
    destinationId: "kuala-lumpur",
    areaId: "putrajaya",
    category: "activity",
    subcategory: "mosque",
    coordinates: {
      lat: 2.9360782,
      lng: 101.6886832,
      confidence: "verified",
      coordNote:
        "OSM place_of_worship \"Putra Mosque\" — Persiaran Perdana, Precinct 1, Putrajaya, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "08:00–10:00 or 16:00–18:00; avoid Friday midday prayers and the midday heat on the open plaza",
    bestTimeZh: "08:00–10:00 或 16:00–18:00；避开周五中午礼拜与正午暴晒的广场",
    tags: ["Mosque", "Pink", "Architecture", "Photography", "Free"],
    tagsZh: ["清真寺", "粉红", "建筑", "拍照", "免费"],
    description:
      "The Putra Mosque is the landmark of Putrajaya, built between 1997 and 1999 on the shore of Putrajaya Lake beside Perdana Putra and faced in rose-tinted granite — the reason it is universally called the Pink Mosque. Its main dome is 50 metres high and the minaret 116 metres, modelled on the Sheikh Omar Ali Saifuddin Mosque in Brunei and the Kairouan Mosque in Tunisia, and the prayer hall holds around 15,000 people. It is the single most photographed building in the administrative capital.",
    descriptionZh:
      "布特拉清真寺是布城的标志，1997 至 1999 年建在布城湖畔、首相署旁，外墙用玫瑰色花岗岩包覆，因此被普遍叫作粉红清真寺。主圆顶高 50 米，宣礼塔 116 米，造型参照文莱苏丹奥马阿里赛夫丁清真寺与突尼斯的凯鲁万清真寺，祈祷厅可容纳约 15,000 人。它是这座行政首都上镜率最高的建筑。",
    notes:
      "Non-Muslim visitors may enter outside prayer times and are lent a robe at the entrance; the interior is closed to visitors on Friday mornings. The lakeside plaza in front is free and open, and the Putrajaya Lake cruise jetty is a short walk away.",
    notesZh:
      "非穆斯林在礼拜时间之外可入内，入口处提供长袍；周五上午内部不对访客开放。门前湖畔广场免费开放，布城湖游船码头步行可达。",
    entryFee: "Free (robes provided)",
    entryFeeZh: "免费（提供长袍）",
    openingHours: "Open to visitors outside prayer times; Saturday–Thursday roughly 09:00–17:00, closed Friday morning",
    markerLayer: "activity",
    discovery: ["culture", "highlights"],
    recommendedFor: ["first-time", "photo-spots", "couples", "family", "half-day"],
    activity: {
      kind: "temple",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: false,
      transportContext: "KLIA Transit to Putrajaya Sentral, then a Grab; about 40–60 minutes from central KL by road.",
      transportContextZh: "搭机场支线到布城中央站再打车；从吉隆坡市中心开车约 40–60 分钟。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Putra Mosque, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "awana-skyway",
    name: "Awana SkyWay (Genting cable car)",
    nameZh: "阿娃娜缆车（云顶缆车）",
    destinationId: "kuala-lumpur",
    areaId: "genting-highlands",
    category: "transport",
    subcategory: "cable-car",
    coordinates: {
      lat: 3.4150834,
      lng: 101.7885199,
      confidence: "verified",
      coordNote:
        "OSM gondola \"Awana Skyway\" — Genting Grand, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM, locality \"Selangor\"). This is the upper station inside the Genting resort complex.",
    },
    recommendedDurationMin: 60,
    bestTime: "Morning for the clearest views down the valley; the ride is often in cloud after about 14:00",
    bestTimeZh: "上午视野最清；约 14:00 之后缆车常进入云雾",
    tags: ["Cable car", "Viewpoint", "Rainforest", "Family", "Transport"],
    tagsZh: ["缆车", "观景", "雨林", "家庭", "交通"],
    description:
      "The Awana SkyWay is the newer of the two cable car systems serving Genting Highlands, running 2.8 km from the Awana transport hub at the foot of the mountain up to the resort at 1,700 metres. It crosses primary rainforest, passes over the Chin Swee Caves Temple — where you can get out and visit — and offers views back down the valley toward Kuala Lumpur on a clear day. It is the most pleasant way up the mountain and avoids the winding road, and the older Genting SkyWay from Gohtong Jaya remains in service as an alternative.",
    descriptionZh:
      "阿娃娜缆车是服务云顶高原的两条缆车系统中较新的一条，从山脚的阿娃娜交通枢纽上到 1,700 米的度假区，全长 2.8 公里。它跨越原始雨林，经过清水岩庙（可中途下车参拜），天气好时可回望山谷与远处的吉隆坡。这是上山最舒服的方式，也避开了盘山路；从梧桐再也出发的旧云顶缆车仍作为替代线路运营。",
    notes:
      "Ticketed by direction or return, with a higher fare for the glass-floor gondolas; queues are long on weekends and public holidays. Standard gondolas stop at the Chin Swee temple mid-station, which is worth the stop. The service can be suspended in high wind or lightning.",
    notesZh:
      "按单程或往返售票，玻璃地板车厢票价更高；周末与公共假期排队很长。普通车厢会在清水岩庙中途站停靠，值得下车。大风或雷电时可能停运。",
    entryFee: "Ticketed per direction or return; premium glass-floor gondolas cost more",
    entryFeeZh: "按单程或往返购票；玻璃地板车厢价格更高",
    openingHours: "Roughly 07:00–23:00 daily, subject to weather",
    markerLayer: "transport",
    discovery: ["highlights", "nature"],
    recommendedFor: ["family", "family-young-kids", "photo-spots", "first-time", "couples"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Awana Skyway, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "genting-skyworlds",
    name: "Genting SkyWorlds Theme Park",
    nameZh: "云顶天城世界主题乐园",
    destinationId: "kuala-lumpur",
    areaId: "genting-highlands",
    category: "activity",
    subcategory: "theme-park",
    coordinates: {
      lat: 3.4222433,
      lng: 101.7952845,
      confidence: "verified",
      coordNote:
        "OSM theme_park \"Genting SkyWorlds Theme Park\" — Jalan Tan Sri Lim Goh Tong, Genting Highlands, Pahang, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 300,
    bestTime: "Arrive at opening on a weekday; the park is in cloud and rain most afternoons",
    bestTimeZh: "工作日开园就到；午后大多在云雾与雨里",
    tags: ["Theme park", "Family", "Children", "Rides", "Full day"],
    tagsZh: ["主题乐园", "家庭", "儿童", "游乐设施", "一整天"],
    description:
      "Genting SkyWorlds opened in 2022 on the site of the old Genting Outdoor Theme Park, a 26-acre park organised into nine themed worlds — Eagle Mountain, Central Park, Liberty Lane, Epic, Rio, Andromeda Base, Ice Age, Robots Rivet Town and Studio Plaza — with around 26 rides and attractions anchored by a few large-format film-IP rides. It sits at 1,700 metres in the middle of the resort complex, so the queues are cool rather than hot, and the trade-off is frequent afternoon cloud and rain closures on the outdoor rides.",
    descriptionZh:
      "云顶天城世界 2022 年在旧云顶户外主题乐园原址开放，占地约 26 英亩，分为九个主题世界——鹰山、中央公园、自由大道、Epic、里约、仙女座基地、冰河世纪、机器人铆钉镇与影城广场——约 26 项游乐设施，其中几项大型电影 IP 骑乘是招牌。园区位于 1,700 米的度假区核心，排队时凉爽不闷热，代价是午后常有云雾与降雨，户外设施会临时关闭。",
    notes:
      "Ticketed, with separate rates for Malaysians and foreign visitors and dated tickets that are cheaper online in advance. Some attractions have height and health restrictions; the park publishes a daily ride-closure board because of weather.",
    notesZh:
      "需购票，马来西亚公民与外国访客价格不同；指定日期票提前网上买更便宜。部分设施有身高与健康限制；因天气原因，园区每日会公布设施关闭看板。",
    entryFee: "Ticketed (lower rates for Malaysian citizens); dated tickets cheaper online",
    entryFeeZh: "需购票（马来西亚公民票价较低）；指定日期票网上更便宜",
    openingHours: "Roughly 10:00–18:00 daily; hours vary with the season and weather",
    markerLayer: "activity",
    discovery: ["highlights"],
    recommendedFor: ["family", "family-young-kids", "friends", "full-day"],
    activity: {
      kind: "shopping",
      difficulty: "easy",
      weatherDependency: "high",
      reservationRecommended: true,
      transportContext: "Awana SkyWay cable car or the resort's road link from the Awana transport hub; about an hour from central KL.",
      transportContextZh: "搭阿娃娜缆车，或从阿娃娜交通枢纽走公路接驳；从吉隆坡市中心约一小时。",
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Genting SkyWorlds Theme Park, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "seng-huat-bak-kut-teh",
    name: "Seng Huat Bak Kut Teh",
    nameZh: "巴生盛发肉骨茶",
    destinationId: "kuala-lumpur",
    areaId: "port-klang-klang",
    category: "food",
    subcategory: "restaurant",
    coordinates: {
      lat: 3.0434981,
      lng: 101.4482538,
      confidence: "verified",
      coordNote:
        "OSM restaurant \"Seng Huat Bak Kut Teh Restaurant\" — Jalan Besar, Kampung Atap, Klang, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "07:00–11:00 — bak kut teh is a Klang breakfast, and the good cuts run out by late morning",
    bestTimeZh: "07:00–11:00——肉骨茶在巴生是早餐，好的部位到上午晚些就没了",
    tags: ["Bak kut teh", "Breakfast", "Local institution", "Pork", "Cheap eats"],
    tagsZh: ["肉骨茶", "早餐", "本地老字号", "猪肉", "平价"],
    description:
      "Seng Huat is one of the shophouse restaurants on Jalan Besar in Klang that claim the invention of bak kut teh, the peppery pork-rib broth that Hokkien labourers were fed in the tin mines and ports here in the early 20th century. It serves the Teochew-style clear, white-pepper broth rather than the darker herbal Hokkien version, with pork ribs, innards, tofu and yau char kwai to dip, and customers order by cut. It is an unpretentious, communal, early-morning institution and the reason many Kuala Lumpur residents drive to Klang.",
    descriptionZh:
      "盛发是巴生大马路上几家自称肉骨茶发源地的骑楼老店之一。肉骨茶是二十世纪初巴生锡矿与港口的福建劳工吃的胡椒排骨汤。这里做的是潮州式清汤白胡椒版本，而不是颜色更深、药材味的福建版；排骨、内脏、豆腐与油条蘸汤吃，客人按部位点单。它朴素、热闹、只做早市，也是许多吉隆坡人专程开车来巴生的理由。",
    notes:
      "Non-halal — the broth is pork-based, so this restaurant is not suitable for Muslim or vegetarian travellers. Go early, expect a shared table, and be ready to order specific cuts; most shops close by mid-afternoon. It is a 10-minute walk from Klang KTM station.",
    notesZh:
      "非清真——汤底为猪肉，穆斯林与素食旅客不适用。要早去，一般要拼桌，点单时直接指定部位；多数店家下午就收。离巴生 KTM 站步行十分钟。",
    entryFee: "Free entry; pay per dish",
    entryFeeZh: "免费进入；按菜付费",
    openingHours: "Roughly 07:00–15:00 daily; best before 11:00",
    markerLayer: "food",
    discovery: ["food", "highlights"],
    recommendedFor: ["food-lovers", "first-time", "budget", "half-day"],
    dining: {
      cuisines: ["chinese"],
      mealTypes: ["breakfast", "brunch", "lunch"],
      priceTier: "$",
      signatureItems: ["Bak kut teh (pork ribs in white pepper broth)", "Pork innards", "Yau char kwai"],
      reservationRecommended: false,
    },
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Seng Huat Bak Kut Teh Restaurant, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
  {
    id: "little-india-klang",
    name: "Little India Klang (Jalan Tengku Kelana)",
    nameZh: "巴生小印度（东姑格拉纳路）",
    destinationId: "kuala-lumpur",
    areaId: "port-klang-klang",
    category: "activity",
    subcategory: "district",
    coordinates: {
      lat: 3.040365,
      lng: 101.4470032,
      confidence: "verified",
      coordNote:
        "OSM attraction \"Little India\" — Jalan Tengku Kelana, Kampung Atap, Klang, Selangor, resolved with scripts/lookup-place.mjs (Photon/OSM).",
    },
    recommendedDurationMin: 60,
    bestTime: "Morning to early evening; Deepavali season (October–November) is the most colourful and the most crowded",
    bestTimeZh: "早上到傍晚；屠妖节前后（10–11 月）最热闹也最挤",
    tags: ["Indian", "Shopping", "Sarees", "Street life", "Food"],
    tagsZh: ["印度", "购物", "纱丽", "街头生活", "美食"],
    description:
      "Jalan Tengku Kelana in Klang is one of the largest Little Indias in Malaysia — a kilometre of textile and saree shops, gold jewellers, spice and provision stores, banana-leaf restaurants and flower stalls serving the Klang Valley's large Indian community. It is less polished and less visited than Brickfields in Kuala Lumpur, and it is correspondingly cheaper for sarees and Indian groceries. The Sri Nagara Thendayuthapani temple sits within the strip.",
    descriptionZh:
      "巴生的东姑格拉纳路是全马最大的小印度之一：一公里长的布匹与纱丽店、金饰店、香料杂货、香蕉叶饭店与花摊，服务巴生谷庞大的印度社群。相比吉隆坡的十五碑，这里更朴素、游客更少，纱丽与印度杂货也相应地便宜。斯里纳加拉登地育塔帕尼庙就在这条街上。",
    notes:
      "Shops close on Sundays in some cases and observe Hindu festival days; many accept cash only. It is a five-minute walk from Klang KTM station, which makes it easy to combine with the Jalan Besar bak kut teh shops.",
    notesZh:
      "部分店铺周日休息，也会在印度教节日停业；不少只收现金。离巴生 KTM 站步行五分钟，可以和大马路的肉骨茶老店串在一起。",
    entryFee: "Free to walk",
    entryFeeZh: "逛街免费",
    openingHours: "Shops roughly 09:00–20:00; some closed on Sundays",
    markerLayer: "activity",
    discovery: ["culture", "food", "shopping"],
    recommendedFor: ["photo-spots", "shopping", "food-lovers", "half-day"],
    verificationStatus: "verified",
    sources: [{ kind: "geographic", label: "OpenStreetMap — Little India, Klang, via scripts/lookup-place.mjs (Photon/OSM)" }],
  },
];
