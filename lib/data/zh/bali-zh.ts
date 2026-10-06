/**
 * BALI — SIMPLIFIED CHINESE OVERLAY.
 *
 * Kept out of the English data files on purpose. The geography in
 * `destinations/bali-places.ts` and `destinations/bali-hotels.ts` is
 * hand-verified and stays the single source of truth; this module only carries
 * the Chinese copy, keyed by the same ids, so the two can be reviewed and
 * changed independently.
 *
 * THE CHINESE IS WRITTEN, NOT TRANSLATED.
 * It is a different text serving the same reader: two short clauses beat one
 * long sentence, and the concrete facts — distances, road conditions, fees,
 * opening hours — survive while the scene-setting does not.
 *
 * WHAT IS DELIBERATELY ABSENT
 * `nameZh` is only set where a Chinese name is genuinely in use. A name a
 * traveller cannot search for is worse than the English one, and Google Maps,
 * Grab and the venue's own app all recognise the Latin name. So the Latin
 * brand stays for restaurants, bars and beach clubs, and the English name is
 * shown alongside every Chinese one anyway.
 *
 * POSITIONAL ALIGNMENT
 * `bestForZh` / `weakForZh` mirror the length and order of `bestFor` /
 * `weakFor`, and `tagsZh` mirrors `tags`. The renderer falls back per index.
 */

export interface AreaZh {
  nameZh?: string;
  taglineZh?: string;
  summaryZh?: string;
  vibeZh?: string;
  bestForZh?: string[];
  weakForZh?: string[];
}

export interface HotelZh {
  nameZh?: string;
  descriptionZh?: string;
}

export interface PlaceZh {
  nameZh?: string;
  descriptionZh?: string;
  bestTimeZh?: string;
  tagsZh?: string[];
}

export const BALI_AREA_ZH: Record<string, AreaZh> = {
  seminyak: {
    nameZh: '水明漾',
    taglineZh: '美食 · 夜生活',
    summaryZh:
      '水明漾是巴厘岛最成熟的度假区，餐厅、水疗和精品店集中在 Jalan Kayu Aya（Oberoi）和 Jalan Petitenget 一带。沙滩离多数酒店步行可达，17:00 起日落海滩酒吧陆续坐满。比长谷贵、也更挤，但打车和一日游方便得多。',
    vibeZh: '全岛餐饮密度最高的精致海滩俱乐部带',
    bestForZh: ['海滩俱乐部', '餐饮', '夜生活', '购物', '豪华度假村'],
    weakForZh: ['穷游', '自然风光', '安静的夜晚'],
  },

  canggu: {
    nameZh: '长谷',
    taglineZh: '冲浪 · 咖啡',
    summaryZh:
      '长谷由 Berawa、Batu Bolong、Echo Beach 几个海边村落组成，稻田小路、浪点和素食咖啡馆交织在一起。年轻人和长住客居多，夜生活（Old Man\'s、Finns、Atlas）是全岛最热闹的。地图上看着近，但小路窄，4 公里傍晚要开 25 分钟。',
    vibeZh: '冲浪与咖啡馆铺开的街区，夜里也不太安静',
    bestForZh: ['冲浪', '咖啡馆', '夜生活', '数字游民', '海滩俱乐部'],
    weakForZh: ['不堵车的接送', '亲子观光', '安静的自然'],
  },

  ubud: {
    nameZh: '乌布',
    taglineZh: '自然 · 文化',
    summaryZh:
      '乌布在 Gianyar 高地，距机场 1 至 2 小时，是巴厘岛文化、瑜伽和自然线路的基地。皇宫、艺术市场和圣猴森林公园从镇中心步行可达，德格拉朗、Tegenungan、圣泉寺和阿漾河漂流段在 15 至 40 分钟车程内。没有海滩，除了少数酒吧和舞蹈演出，晚上很安静。',
    vibeZh: '被稻田环绕的内陆文化与养生中心',
    bestForZh: ['文化', '自然一日游', '养生', '梯田', '美食'],
    weakForZh: ['海滩', '夜生活', '短途机场接送'],
  },

  uluwatu: {
    nameZh: '乌鲁瓦图（武吉半岛）',
    taglineZh: '悬崖 · 日落',
    summaryZh:
      '武吉半岛是巴厘岛南部干燥的丘陵地带，70 米高的悬崖直落巴东巴东、宾金、梅拉斯蒂等白沙滩。乌鲁瓦图神庙和 Single Fin 悬崖酒吧撑起日落时段的客流，全岛大部分超豪华别墅也在这里。海滩之间要开车或骑摩托，沿海公路多是断头路。',
    vibeZh: '石灰岩悬崖、浪点和崖边度假村',
    bestForZh: ['悬崖海滩', '冲浪', '日落神庙', '豪华别墅', '海滩俱乐部'],
    weakForZh: ['公共交通', '夜生活多样性', '购物'],
  },

  'nusa-dua': {
    nameZh: '努沙杜瓦',
    taglineZh: '豪华度假村',
    summaryZh:
      '努沙杜瓦是规划出来的度假区，集中了国际酒店、修剪整齐的海滨步道和受礁石保护的平静海面，适合游泳和划艇。南部最亲子、最不混乱的一片，巴厘岛主要会展中心也在这里。出了度假区大门街上就没什么生活气息，夜生活只有酒店酒吧。',
    vibeZh: '封闭式五星级度假区，海滩平静干净',
    bestForZh: ['度假海滩', '亲子', '水上运动', '会议', '高尔夫'],
    weakForZh: ['夜生活', '本地街头小吃', '预算有限'],
  },

  sanur: {
    nameZh: '沙努尔',
    taglineZh: '平静 · 离岛渡轮',
    summaryZh:
      '沙努尔是巴厘岛东岸安静的矮层海滨小镇，5 公里长的铺装海滨步道适合散步和骑行。礁石挡浪，水面平静，适合带孩子，沙努尔港是去佩尼达岛和蓝梦岛快艇的主要出发点。除库塔外离机场最近的海滨度假区，约 30 至 55 分钟。',
    vibeZh: '朝东的老式海滨小镇，看日出、赶快艇',
    bestForZh: ['平静游泳', '亲子', '佩尼达岛一日游', '骑行', '日出'],
    weakForZh: ['夜生活', '冲浪', '奢华'],
  },

  'kuta-legian': {
    nameZh: '库塔 / 勒吉安',
    taglineZh: '机场 · 冲浪课',
    summaryZh:
      '库塔和旁边的勒吉安是巴厘岛最早的旅游区：一条缓坡冲浪海滩，背后是市场、青旅、酒吧和 Beachwalk 商场。短期停留最便宜也最方便，机场接送全岛最短。代价是堵车、拉客，以及 Jalan Legian 和 Sky Garden 一带的年轻派对人群。',
    vibeZh: '距机场 15 分钟的平价冲浪镇，人多嘈杂',
    bestForZh: ['平价住宿', '冲浪课', '靠近机场', '夜生活', '购物'],
    weakForZh: ['安静', '奢华', '自然风光'],
  },

  jimbaran: {
    nameZh: '金巴兰',
    taglineZh: '海鲜 · 日落',
    summaryZh:
      '金巴兰湾在机场南侧转弯，最有名的是黄昏时分在沙滩上用椰壳炭火烤鱼的那排海鲜大排档。海水平静可以游泳，海湾朝西，南北两端各有一批五星级度假村。离机场近，适合落地第一晚或离开前一晚。',
    vibeZh: '平静海湾，晚上在沙滩上吃炭烤海鲜',
    bestForZh: ['海鲜晚餐', '海滩日落', '度假村', '亲子'],
    weakForZh: ['夜生活', '平价餐饮', '冲浪'],
  },

  amed: {
    nameZh: '艾湄',
    taglineZh: '潜水 · 安静海岸',
    summaryZh:
      '艾湄是巴厘岛东北岸一串渔村，沿黑色火山沙海岸展开，距机场约 2.5 至 3.5 小时。全岛最好的岸潜基地，图兰奔的 USAT Liberty 沉船和 Jemeluk 湾的珊瑚墙都在附近，清晨还能回望阿贡火山。住宿以小客栈和潜水度假村为主。',
    vibeZh: '阿贡火山下的偏远黑沙潜水海岸',
    bestForZh: ['潜水', '浮潜', '安静的海滩', '日出', '远离喧嚣的住宿'],
    weakForZh: ['夜生活', '短途接送', '购物', '奢华'],
  },

  tabanan: {
    nameZh: '塔巴南',
    taglineZh: '梯田 · 神庙',
    summaryZh:
      '本规划器不把这里当作住宿基地。有 2 个已定位景点位于九个住宿区之外：贾蒂卢维梯田、海神庙。适合从主要区域出发一日游，或过夜前往。',
    vibeZh: '远足区域：贾蒂卢维、塔巴南、海神庙',
    bestForZh: ['贾蒂卢维梯田', '海神庙'],
    weakForZh: ['除非接受长途车程，否则不宜作为住宿基地'],
  },

  kintamani: {
    nameZh: '金塔马尼',
    taglineZh: '火山 · 日出',
    summaryZh:
      '本规划器不把这里当作住宿基地。有 3 个已定位景点位于九个住宿区之外：巴图尔火山、金塔马尼 Penelokan 观景台、巴图尔火山日出徒步起点。适合从主要区域出发一日游，或过夜前往。',
    vibeZh: '远足区域：金塔马尼、巴图尔火山、Penelokan、Toya Bungkah',
    bestForZh: ['巴图尔火山', '金塔马尼 Penelokan 观景台', '巴图尔火山日出徒步起点'],
    weakForZh: ['除非接受长途车程，否则不宜作为住宿基地'],
  },

  karangasem: {
    nameZh: '卡朗阿森',
    taglineZh: '阿贡火山 · 神庙',
    summaryZh:
      '本规划器不把这里当作住宿基地。有 3 个已定位景点位于九个住宿区之外：阿贡火山、百沙基庙、八丹拜港。适合从主要区域出发一日游，或过夜前往。',
    vibeZh: '远足区域：阿贡火山、卡朗阿森、百沙基、八丹拜',
    bestForZh: ['阿贡火山', '百沙基庙', '八丹拜港'],
    weakForZh: ['除非接受长途车程，否则不宜作为住宿基地'],
  },

  'nusa-penida': {
    nameZh: '佩尼达岛',
    taglineZh: '悬崖 · 一日游',
    summaryZh:
      '本规划器不把这里当作住宿基地。有 1 个已定位景点位于九个住宿区之外：佩尼达岛精灵海滩观景台。适合从主要区域出发一日游，或过夜前往。',
    vibeZh: '远足区域：佩尼达岛',
    bestForZh: ['佩尼达岛精灵海滩观景台'],
    weakForZh: ['除非接受长途车程，否则不宜作为住宿基地'],
  },

  tampaksiring: {
    nameZh: '坦帕西林',
    taglineZh: '圣泉神庙',
    summaryZh:
      '本规划器不把这里当作住宿基地。有 1 个已定位景点位于九个住宿区之外：圣泉寺。适合从主要区域出发一日游，或过夜前往。',
    vibeZh: '远足区域：坦帕西林',
    bestForZh: ['圣泉寺'],
    weakForZh: ['除非接受长途车程，否则不宜作为住宿基地'],
  },

  denpasar: {
    nameZh: '登巴萨',
    taglineZh: '城市 · 市场',
    summaryZh:
      '本规划器不把这里当作住宿基地。有 1 个已定位景点位于九个住宿区之外：Ubung 客运站。适合从主要区域出发一日游，或过夜前往。',
    vibeZh: '远足区域：登巴萨 Ubung',
    bestForZh: ['Ubung 客运站'],
    weakForZh: ['除非接受长途车程，否则不宜作为住宿基地'],
  },
};

export const BALI_HOTEL_ZH: Record<string, HotelZh> = {
  'the-st-regis-bali-resort': {
    nameZh: '巴厘岛瑞吉度假酒店',
    descriptionZh:
      '2008 年开业，坐落在 ITDC 努沙杜瓦园区内，占地 9 公顷，只有套房和别墅，配管家服务。',
  },

  'the-ritz-carlton-bali': {
    nameZh: '巴厘岛丽思卡尔顿酒店',
    descriptionZh:
      '2014 年开业的纯套房与别墅度假村，占地 12.7 公顷，从悬崖一直延伸到崖下海滩，两端用玻璃电梯连接。',
  },

  'w-bali-seminyak': {
    nameZh: '巴厘岛 W 度假酒店',
    descriptionZh:
      'Jalan Petitenget 上的海滨设计酒店，有客房、套房和带私人泳池的别墅，还有 Woobar 海滩俱乐部和 AWAY 水疗。',
  },

  'the-laguna-a-luxury-collection-resort-nusa-dua-bali': {
    nameZh: '巴厘岛努沙杜瓦拉古娜豪华精选度假酒店',
    descriptionZh:
      '1991 年以 Sheraton Lagoon Nusa Dua Beach Hotel 之名开业，2006 年换成豪华精选品牌，2022 年整体翻新。与隔壁的努沙杜瓦威斯汀度假酒店内部连通。',
  },

  'the-westin-resort-nusa-dua-bali': {
    nameZh: '巴厘岛努沙杜瓦威斯汀度假酒店',
    descriptionZh:
      '1991 年开业，2003 年换牌威斯汀，与巴厘岛国际会议中心直接相连，并与隔壁的 The Laguna 共用设施。',
  },

  'sheraton-bali-kuta-resort': {
    nameZh: '巴厘岛库塔喜来登度假酒店',
    descriptionZh:
      '位于 Jalan Pantai Kuta 的全服务海滨度假村，与 Beachwalk 购物餐饮综合体连为一体。',
  },

  'renaissance-bali-uluwatu-resort-and-spa': {
    nameZh: '巴厘岛乌鲁瓦图万丽度假酒店',
    descriptionZh:
      '武吉半岛 Balangan 上方的山坡度假村，是万豪在乌鲁瓦图一带的物业，有无边泳池和水疗。',
  },

  'renaissance-bali-nusa-dua-resort': {
    nameZh: '巴厘岛努沙杜瓦万丽度假酒店',
    descriptionZh:
      '2021 年开业，紧邻努沙杜瓦旅游园区，有大型环礁湖泳池和万豪偏家庭的设施。',
  },

  'le-meridien-bali-jimbaran': {
    nameZh: '巴厘岛金巴兰艾美酒店',
    descriptionZh:
      '金巴兰的艾美度假村，有大型海水环礁湖泳池和屋顶酒吧，离金巴兰湾的海鲜沙滩街很近。',
  },

  'four-points-by-sheraton-bali-kuta': {
    nameZh: '巴厘岛库塔福朋喜来登酒店',
    descriptionZh:
      '库塔中心的精选服务酒店，步行可到库塔海滩和勒吉安街区。',
  },

  'four-points-by-sheraton-bali-ungasan': {
    nameZh: '巴厘岛乌干沙福朋喜来登酒店',
    descriptionZh:
      '武吉半岛 Jalan Raya Uluwatu 沿线的精选服务度假村，是乌鲁瓦图一带价位较低的住宿选择。',
  },

  'aloft-bali-seminyak': {
    nameZh: '巴厘岛水明漾雅乐轩酒店',
    descriptionZh:
      '水明漾与长谷之间 Jalan Batu Belig 上的设计型精选酒店，有屋顶泳池和酒吧。',
  },

  'aloft-bali-kuta-at-beachwalk': {
    nameZh: '巴厘岛库塔雅乐轩酒店',
    descriptionZh: '库塔中心 Beachwalk 购物中心内的酒店，正对库塔海滩。',
  },

  'the-stones-hotel-legian-bali-autograph-collection': {
    // No Chinese name is in real use: the property trades as "The Stones" and
    // the brand keeps its Latin name in Chinese, so nothing is invented here.
    descriptionZh:
      '勒吉安海滨路上的傲途格精选度假村，围绕大型环礁湖泳池建造，步行可到勒吉安海滩和水明漾餐饮街。',
  },

  'conrad-bali': {
    nameZh: '巴厘岛康莱德酒店',
    descriptionZh:
      '2004 年开业，位于丹戎贝诺阿，占地 7 公顷，2016 年起分批翻新，设 Conrad Suites 翼楼和五家餐厅。',
  },

  'hilton-bali-resort': {
    nameZh: '巴厘岛希尔顿度假酒店',
    descriptionZh:
      '1996 年以 Hotel Nikko Bali 之名开业，2016 年 12 月换牌希尔顿。14 层的 Cliff Tower 依崖而建，外面只看得到约五层。',
  },

  'umana-bali-lxr-hotels-and-resorts': {
    // Umana is a coined property name and LXR has no Chinese form in use.
    descriptionZh:
      'Melasti 海滩上方的全别墅悬崖度假村，2010 年以 Banyan Tree Ungasan 开业，经过两年翻新后于 2023 年 11 月更名为 Umana Bali, LXR Hotels & Resorts。',
  },

  'hilton-garden-inn-bali-nusa-dua': {
    nameZh: '巴厘岛努沙杜瓦希尔顿花园酒店',
    descriptionZh:
      '努沙杜瓦／丹戎贝诺阿 Jalan Pratama 上的希尔顿花园酒店，在希尔顿的巴厘岛页面上被列为度假村。',
  },

  'hilton-garden-inn-bali-ngurah-rai-airport': {
    nameZh: '巴厘岛伍拉·赖机场希尔顿花园酒店',
    descriptionZh:
      '图班的机场酒店，就在伍拉·赖国际机场外，是巴厘岛价格最低的希尔顿荣誉客会选择。',
  },

  'courtyard-bali-seminyak': {
    nameZh: '巴厘岛水明漾万怡酒店',
    descriptionZh:
      '偏家庭的水明漾度假村，有大泳池和儿童设施，位置在海滩与 Jalan Kayu Aya 餐饮街之间。',
  },
};

export const BALI_PLACE_ZH: Record<string, PlaceZh> = {
  'tegallalang-rice-terrace': {
    nameZh: '德格拉朗梯田',
    descriptionZh:
      '德格拉朗是巴厘岛最典型的梯田山谷，苏巴克（Subak）灌溉系统把阶梯稻田嵌进乌布以北的公路沿线山坡。主要 Ceking 段有观景台、秋千和俯瞰山谷的咖啡馆。',
    bestTimeZh: '清晨 07:00-09:00，或傍晚',
    tagsZh: ['梯田', '摄影', '秋千', '日出'],
  },

  'jatiluwih-rice-terrace': {
    nameZh: '贾蒂卢维梯田',
    descriptionZh:
      '贾蒂卢维是巴厘岛面积最大的梯田景观，属列入世界遗产的苏巴克文化景观，铺展在巴图卡鲁火山下的丘陵上。田间有 1 至 5 公里的步道和骑行道。',
    bestTimeZh: '上午云少，或傍晚',
    tagsZh: ['世界遗产', '梯田', '骑行', '徒步'],
  },

  'tegenungan-waterfall': {
    nameZh: '特格努甘瀑布',
    descriptionZh:
      '特格努甘是乌布附近最容易到达的大瀑布，Blangsinga 河上一道 15 米宽的水幕，下面有大水潭和下行观景台阶。距乌布中心约 20 至 30 分钟车程。',
    bestTimeZh: '上午 08:00-10:00，赶在人潮前',
    tagsZh: ['瀑布', '游泳', '轻松到达'],
  },

  'mount-batur': {
    nameZh: '巴图尔火山',
    descriptionZh:
      '巴图尔火山海拔 1,717 米，是金塔马尼高地上巨大火山口里的一座活火山，山脚就是巴图尔湖。天亮前登顶看日出是巴厘岛的招牌项目之一。',
    bestTimeZh: '日出（06:00 前登顶）',
    tagsZh: ['火山', '日出', '徒步', '火山口'],
  },

  'mount-agung': {
    nameZh: '阿贡火山',
    descriptionZh:
      '阿贡火山海拔 3,031 米，是巴厘岛最高、最神圣的山峰，主宰东部天际线，山坡上有百沙基庙群。它是活火山，1963 年和 2017 至 2019 年的喷发塑造了周边地貌。',
    bestTimeZh: '凌晨出发，赶在日出时登顶',
    tagsZh: ['火山', '徒步', '日出', '进阶'],
  },

  'campuhan-ridge-walk': {
    nameZh: '坎普罕山脊步道',
    descriptionZh:
      '坎普罕山脊步道是乌布中心以西一条免费铺装小路，沿两条河谷之间的窄草脊延伸。想步行看稻田和丛林，这是从镇上出发最省力的方式。',
    bestTimeZh: '清晨 06:30-08:30，或傍晚',
    tagsZh: ['步行', '免费', '日出', '摄影'],
  },

  'sacred-monkey-forest': {
    nameZh: '圣猴森林公园',
    descriptionZh:
      '圣猴森林公园是乌布南部 12.5 公顷的圣林，里面有三座神庙、气根盘结的丛林和约一千只自由活动的长尾猕猴。它既是 Padangtegal 村的神庙群，也是保护与科研基地。',
    bestTimeZh: '上午 09:00-11:00，或 15:00 之后',
    tagsZh: ['野生动物', '神庙', '亲子', '森林'],
  },

  'kintamani-viewpoint': {
    // A viewpoint named for its village road; no Chinese form is in use.
    descriptionZh:
      'Penelokan 山脊公路正对巴图尔火山口，火山锥、黑色熔岩地和巴图尔湖一次看全。是金塔马尼环线上标准的早餐和拍照停靠点。',
    bestTimeZh: '上午，火山口看得最清楚',
    tagsZh: ['观景台', '火山口', '湖景', '早餐停靠'],
  },

  'kelingking-viewpoint': {
    nameZh: '精灵海滩观景台',
    descriptionZh:
      '精灵海滩是佩尼达岛西岸一块霸王龙形状的石灰岩海岬，沿崖壁 400 级台阶下到白沙滩。观景台离停车场只有几步路，是全岛被拍得最多的地方。',
    bestTimeZh: '上午 10:00 前，或日落',
    tagsZh: ['观景台', '悬崖', '佩尼达岛', '标志性'],
  },

  'kuta-beach': {
    nameZh: '库塔海滩',
    descriptionZh:
      '库塔海滩是一条平缓的灰金色长滩，也是让巴厘岛出名的那片沙滩，浪小且稳定，适合第一次上冲浪课。海滨步道向北通往勒吉安和水明漾。',
    bestTimeZh: '傍晚看日落；上午冲浪',
    tagsZh: ['冲浪', '日落', '适合新手', '救生员'],
  },

  'seminyak-beach': {
    nameZh: '水明漾海滩',
    descriptionZh:
      '水明漾海滩是勒吉安以北库塔沙滩的延续，背后是海滩俱乐部和度假村花园，而不是公路。Double Six 和 Petitenget 两段是经典的日落去处。',
    bestTimeZh: '日落 17:30-19:00',
    tagsZh: ['日落', '海滩俱乐部', '冲浪', '散步'],
  },

  'nusa-dua-beach': {
    nameZh: '努沙杜瓦海滩',
    descriptionZh:
      '努沙杜瓦海滩是干净的礁石保护型白沙滩，铺装步道串起各家度假村花园。外海礁石把水面压平，是南巴厘最安全的游泳海滩。',
    bestTimeZh: '上午到下午早些时候，水面平静',
    tagsZh: ['亲子', '游泳', '水上运动', '海滨步道'],
  },

  'pandawa-beach': {
    nameZh: '潘达瓦海滩',
    descriptionZh:
      '潘达瓦是武吉石灰岩悬崖中开出的一片宽阔白沙滩湾，进湾公路直接从岩壁里穿过，路边立着五尊潘达瓦雕像。水浅而平静，很受家庭和本地游客欢迎。',
    bestTimeZh: '上午到下午早些时候',
    tagsZh: ['游泳', '皮划艇', '亲子', '悬崖公路'],
  },

  'melasti-beach': {
    nameZh: '梅拉斯蒂海滩',
    descriptionZh:
      '梅拉斯蒂是武吉南端高耸石灰岩崖下的白沙滩，靠一条穿岩而过的盘山路进入。海湾宽阔、海水清澈，北端现在开了几家海滩俱乐部。',
    bestTimeZh: '上午到下午早些时候；日落适合拍照',
    tagsZh: ['白沙滩', '悬崖公路', '海滩俱乐部', '游泳'],
  },

  'padang-padang-beach': {
    nameZh: '巴东巴东海滩',
    descriptionZh:
      '巴东巴东是一处要从岩缝台阶走下去的小海湾，因为电影《美食、祈祷和恋爱》出名。北端有避风的游泳区，外侧是世界级的礁石浪点。',
    bestTimeZh: '上午游泳；下午冲浪',
    tagsZh: ['冲浪点', '游泳', '标志性', '小海湾'],
  },

  'bingin-beach': {
    nameZh: '宾金海滩',
    descriptionZh:
      '宾金是 Pecatu 崖下一片小白沙滩湾，要走一段长台阶下去，北端以又快又浅的礁石浪点出名。崖顶的客栈和咖啡馆直接俯瞰浪区。',
    bestTimeZh: '退潮时（涨潮时几乎没有沙滩）',
    tagsZh: ['冲浪点', '崖壁台阶', '日落', '精品住宿'],
  },

  'balangan-beach': {
    nameZh: '巴兰甘海滩',
    descriptionZh:
      '巴兰甘是武吉西侧矮崖下的一条白沙滩长滩，以著名的左手礁石浪点出名，沙后是一排简易大排档和冲浪棚屋。比巴东巴东安静，适合消磨一个下午。',
    bestTimeZh: '上午到日落',
    tagsZh: ['冲浪点', '日落', '大排档', '长滩'],
  },

  'sanur-beach': {
    nameZh: '沙努尔海滩',
    descriptionZh:
      '沙努尔海滩隔着礁石潟湖朝东，是日出海滩而不是日落海滩，水面一直平静，适合游泳和立式桨板。铺装海滨步道贯穿整条海岸，经过酒店、咖啡馆和港口。',
    bestTimeZh: '日出 05:45-07:30',
    tagsZh: ['日出', '平静海面', '骑行', '亲子'],
  },

  'jemeluk-beach': {
    // Jemeluk is a village bay name; Chinese usage keeps the Latin form.
    descriptionZh:
      'Jemeluk 湾是艾湄潜水海岸的核心，一弯黑沙滩，离岸游一小段就是珊瑚墙，水下还有一座小神庙雕像。传统 jukung 渔船至今每天早上从沙滩下水。',
    bestTimeZh: '日出和清晨，水面最平静',
    tagsZh: ['潜水', '浮潜', '黑沙滩', '日出'],
  },

  'jimbaran-beach': {
    nameZh: '金巴兰海滩',
    descriptionZh:
      '金巴兰湾是一弯细沙长滩，水浅而平静，背后是日落时分在沙滩上烤鱼的海鲜大排档。北端 Kedonganan 一段更安静，还有鱼市。',
    bestTimeZh: '傍晚到日落，配合海鲜烧烤',
    tagsZh: ['日落', '海鲜', '平静海面', '亲子'],
  },

  'uluwatu-temple': {
    nameZh: '乌鲁瓦图神庙',
    descriptionZh:
      '乌鲁瓦图神庙建在武吉西南端 70 米高的悬崖上，是守护全岛的六座方位神庙之一。崖顶步道和每晚日落时分的 Kecak 火舞是主要看点。',
    bestTimeZh: '傍晚，留下来看日落 18:00-19:00',
    tagsZh: ['文化', '日落', '悬崖', 'Kecak 火舞'],
  },

  'tanah-lot': {
    nameZh: '海神庙',
    descriptionZh:
      '海神庙建在塔巴南海岸外一块受潮汐影响的礁岩上，是巴厘岛被拍得最多的日落地标之一。神庙属巴厘印度教，至今仍有信徒前来做 melukat 净化仪式。',
    bestTimeZh: '日落 17:30-19:00；退潮时才能走到岩下',
    tagsZh: ['文化', '日落', '海神庙', '摄影'],
  },

  'ubud-palace': {
    nameZh: '乌布皇宫',
    descriptionZh:
      '乌布皇宫是乌布王室的在用王宫，位于 Jalan Raya Ubud 与 Jalan Suweta 交汇处。没有仪式时，雕刻门楼和庭院对游客开放。',
    bestTimeZh: '上午，或 19:30 看舞蹈演出',
    tagsZh: ['文化', '建筑', '舞蹈', '免费入场'],
  },

  'ubud-art-market': {
    nameZh: '乌布艺术市场',
    descriptionZh:
      '乌布艺术市场是皇宫对面两层楼高的摊位迷宫，卖蜡染、藤编包、纱笼、木雕和首饰。楼上人少一些，货色和楼下差不多。',
    bestTimeZh: '上午 08:00-11:00，避开高温和人潮',
    tagsZh: ['购物', '纪念品', '砍价', '纺织品'],
  },

  'tirta-empul': {
    nameZh: '圣泉寺',
    descriptionZh:
      '圣泉寺是坦帕西林一座建于 10 世纪的水神庙，围绕圣泉而建，巴厘印度教徒在两排出水口下的长池里做 melukat 净化。全岛最重要的水神庙之一。',
    bestTimeZh: '清晨 08:00-09:30',
    tagsZh: ['文化', '圣泉', '水神庙', '净化仪式'],
  },

  'besakih-temple': {
    nameZh: '百沙基庙',
    descriptionZh:
      '百沙基庙是巴厘岛最大、最神圣的庙群，20 多座神庙沿阿贡火山西南坡层层而上。几个世纪以来一直是巴厘印度教徒的主要祭拜地。',
    bestTimeZh: '上午 07:00-10:00，能看清阿贡火山',
    tagsZh: ['文化', '世界遗产候选', '山景', '朝圣'],
  },

  'bali-swing': {
    // "Bali Swing" is a brand; Chinese copy keeps the Latin name.
    descriptionZh:
      'Bali Swing 是 Bongkasa 一带最早的丛林秋千园，一排秋千和鸟巢平台悬在阿漾河谷上方。主要产品是配现场摄影师的拍照套餐。',
    bestTimeZh: '上午 08:00-10:00，排队短、光线好',
    tagsZh: ['秋千', '摄影', '刺激', '丛林'],
  },

  'mount-batur-sunrise-trek': {
    // A trailhead, not a named place: no Chinese form exists to borrow.
    descriptionZh:
      '这是巴图尔火山日出徒步的常规起点，在巴图尔湖畔的 Toya Bungkah，向导会在天亮前先在这里登记登山者。路线穿过森林和火山碎石坡，一直到火山口边缘。',
    bestTimeZh: '03:30-04:00 出发，赶日出登顶',
    tagsZh: ['徒步', '日出', '火山', '需向导'],
  },

  'ayung-river-rafting': {
    nameZh: '阿勇河漂流',
    descriptionZh:
      '阿漾河是巴厘岛主要的漂流河，乌布以北的二至三级河道穿过丛林峡谷、梯田和瀑布。多数运营商含酒店接送、装备、向导和自助午餐。',
    bestTimeZh: '上午出发 08:00-10:00',
    tagsZh: ['漂流', '探险', '亲子', '丛林'],
  },

  'balinese-cooking-class': {
    // A generic activity plus a small school; no settled Chinese name.
    descriptionZh:
      '乌布的烹饪学校教巴厘菜的基本功：基础香料酱（bumbu）、沙嗲、lawar 和椰奶菜，通常从逛传统市场开始。Peliatan 的 Paon Bali 是其中资历最老的一家，村落环境、小班上课。',
    bestTimeZh: '上午班（约 08:00 开始，含市场导览），或下午班',
    tagsZh: ['烹饪', '文化', '市场导览', '亲子'],
  },

  'potato-head-beach-club': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Potato Head 是水明漾的招牌海滩俱乐部，弧形柚木百叶立面、无边泳池和 Petitenget 海滩上的日落 DJ 场次都是它的标志。更大的 Desa Potato Head 园区里还有餐厅、画廊和酒店。',
    bestTimeZh: '下午到日落；躺椅建议提前订',
    tagsZh: ['海滩俱乐部', '日落', '设计', '无边泳池'],
  },

  'finns-beach-club': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Finns 是 Berawa 海滩上多层的大型海滩俱乐部，有多个泳池、酒吧和餐厅，日落人群会一直待到深夜。和 Atlas 一起构成长谷海滩俱乐部带的核心。',
    bestTimeZh: '下午到日落',
    tagsZh: ['海滩俱乐部', '日落', '泳池', '派对'],
  },

  'atlas-beach-fest': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Atlas Beach Fest 是 Berawa 海滩上超大型的海滨俱乐部综合体，把海滩俱乐部、超级夜店和康体、板式网球设施放在一起。它自称全球最大的海滩俱乐部之一，会办国际 DJ 活动。',
    bestTimeZh: '下午之后',
    tagsZh: ['海滩俱乐部', '超级夜店', '夜生活', '大型场地'],
  },

  'la-plancha': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'La Plancha 是 Double Six 海滩上彩色豆袋和遮阳伞的海滩酒吧，以便宜啤酒、小食和沙滩第一排的日落座位出名。水明漾最早的一批日落酒吧之一。',
    bestTimeZh: '日落 17:30-19:30',
    tagsZh: ['海滩酒吧', '日落', '豆袋椅', '随意'],
  },

  'old-mans': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Old Man\'s 是离 Batu Bolong 海滩一分钟的老牌啤酒花园和现场音乐酒吧，长谷夜生活的传统中心。白天是随意的冲浪人群，晚上换成本地乐队和 DJ。',
    bestTimeZh: '晚上；周三和周六最热闹',
    tagsZh: ['酒吧', '现场音乐', '冲浪人群', '啤酒花园'],
  },

  'single-fin': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Single Fin 建在 Suluban 海滩上方的悬崖上，正对乌鲁瓦图的浪线，是半岛上最有名的日落酒吧。有客座 DJ 的周日场是巴厘岛的保留节目。',
    bestTimeZh: '周日日落场 16:00-21:00',
    tagsZh: ['悬崖酒吧', '日落', '冲浪人群', '周日场'],
  },

  'ku-de-ta': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'KU DE TA 是巴厘岛最早的海滨餐饮与日落去处之一，就在 Jalan Kayu Aya 尽头的沙滩上。餐厅和鸡尾酒吧之外，还有日落时坐满人的草坪和海滩平台。',
    bestTimeZh: '日落和晚餐时段',
    tagsZh: ['海滩俱乐部', '日落', '精致餐饮', 'DJ'],
  },

  'sunset-road': {
    nameZh: '日落大道',
    descriptionZh:
      'Jalan Sunset Road 是连接库塔、勒吉安和水明漾的宽阔外环路，两旁是大型夜店、卡拉OK、水疗、健身房和大餐厅。巴厘岛更大、更晚的场所和巨型夜店都在这条路上。',
    bestTimeZh: '深夜 22:00-02:00',
    tagsZh: ['夜生活', '夜店', '卡拉OK', '水疗'],
  },

  'naughty-nuris-ubud': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Naughty Nuri\'s 是让巴厘式烤猪肋排出名的乌布大排档，在 Jalan Raya Sanggingan 路边用炭火烤。菜单很短：肋排、沙嗲、马天尼，差不多就这些。',
    bestTimeZh: '午餐，或早些吃晚餐（18:30 后要排队）',
    tagsZh: ['烤肋排', '大排档', '老字号', '现金方便'],
  },

  'warung-ibu-oka': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Ibu Oka 是巴厘岛最有名的烤乳猪（babi guling）大排档，离乌布皇宫步行几分钟。套餐里有烤猪肉、脆皮、lawar、米饭和汤。',
    bestTimeZh: '午餐 11:00-14:00；卖完就提前关门',
    tagsZh: ['烤乳猪', '本地老店', '只做午市', '便宜'],
  },

  'bebek-bengil': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Bebek Bengil 是乌布把巴厘脆皮鸭做出名的餐厅，茅草亭子散在 Jalan Hanoman 后面的大花园和稻田里。1990 年营业至今。',
    bestTimeZh: '午餐或晚餐',
    tagsZh: ['脆皮鸭', '花园环境', '老字号', '亲子'],
  },

  'menega-cafe': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Menega Cafe 是金巴兰海滩最有名的海鲜烧烤之一，桌子摆在沙上，鱼、虾、鱿鱼和贝类用椰壳炭火烤。来这里吃的不只是味道，还有日落的场面。',
    bestTimeZh: '日落晚餐，17:30 到占海滩位',
    tagsZh: ['海鲜', '海滩烧烤', '日落', '适合聚餐'],
  },

  'warung-mak-beng': {
    // Restaurant / bar brand: Chinese usage keeps the Latin name.
    descriptionZh:
      'Warung Mak Beng 是沙努尔的老店，1941 年以来基本只卖一套饭：炸鱼配参巴、鱼头汤和米饭。就在沙努尔海滩和港口路的拐角处。',
    bestTimeZh: '午餐（约 08:00 开门，12:00-14:00 最挤）',
    tagsZh: ['鱼汤', '本地老店', '便宜', '上菜快'],
  },

  'sanur-harbour': {
    nameZh: '沙努尔港',
    descriptionZh:
      '沙努尔港是去佩尼达岛和蓝梦岛快艇的主要出发点，多家运营商在海滨办公室卖票。航程约 30 至 45 分钟，视海况和目的地而定。',
    bestTimeZh: '上午出发 07:00-09:30，航程最平稳',
    tagsZh: ['渡轮', '佩尼达岛', '蓝梦岛', '一日游'],
  },

  'padangbai-harbour': {
    nameZh: '八丹拜港',
    descriptionZh:
      '八丹拜是巴厘岛东部的主要渡轮港，位于一个避风海湾，距机场约 1.5 至 2 小时。这里有开往龙目岛 Lembar 的滚装渡轮，也有去吉利群岛和佩尼达岛的快艇。',
    bestTimeZh: '上午出发',
    tagsZh: ['渡轮', '吉利群岛', '龙目岛', '快艇'],
  },

  'ubung-bus-terminal': {
    // A terminal named after its Denpasar village; Chinese keeps "Ubung".
    descriptionZh:
      '登巴萨北部的 Ubung 客运站是巴厘岛主要的长途汽车站，有开往爪哇（经 Gilimanuk 渡轮）和北部 Singaraja 的城际、省际线路。也是本地 bemo 和小巴 angkot 的枢纽。',
    bestTimeZh: '长途班次多在一早',
    tagsZh: ['巴士', '长途', '爪哇', '本地交通'],
  },

  'beachwalk-kuta-pickup': {
    // A mall acting as a pickup pin; the mall brand stays Latin.
    descriptionZh:
      'Beachwalk 是库塔海滨路上的购物中心，也是库塔私人接送、一日游和班车集合的标准地点。位置好找，有带顶的等候区，离库塔海滩步行几分钟。',
    bestTimeZh: '任何时段；堵车时预留 15 分钟',
    tagsZh: ['接送', '商场', '集合点', '库塔'],
  },

  'seminyak-village-pickup': {
    // A mall acting as a pickup pin; the mall brand stays Latin.
    descriptionZh:
      'Seminyak Village 是 Jalan Kayu Jati 上带空调的小型商场，是水明漾一日游和接送的集中上车点。走到 Jalan Kayu Aya（Oberoi）和街尾海滩只要几分钟。',
    bestTimeZh: '任何时段；傍晚堵车时预留 20 分钟',
    tagsZh: ['接送', '商场', '集合点', '水明漾'],
  },
};


/**
 * The destination record itself.
 *
 * Areas, hotels and places were covered by the first overlay pass; this is the
 * one entity that was not, and it is the first copy a traveller reads on
 * EXPLORE. Kept in the same overlay file so all Chinese copy has one home.
 */
export const BALI_DESTINATION_ZH = {
  nameZh: '巴厘岛',
  countryZh: '印度尼西亚',
  taglineZh: '一座岛，四种玩法',
  descriptionZh:
    '巴厘岛把海滩小镇、冲浪海岸、文化高地和度假区塞进了一座一天就能横穿的岛——所以行程排得好不好，本质上是地理问题。住在哪里，决定了你有多少时间花在路上。',
};

/**
 * Destination names and countries for the other nine.
 *
 * Only naming is provided: they are starter-scope destinations, and writing
 * long-form Chinese copy for a destination we do not hold real data for would
 * be inventing a guide rather than translating one.
 */
export const DESTINATION_ZH: Record<string, { nameZh: string; countryZh: string }> = {
  bali: { nameZh: '巴厘岛', countryZh: '印度尼西亚' },
  'phu-quoc': { nameZh: '富国岛', countryZh: '越南' },
  'da-nang-hoi-an': { nameZh: '岘港 · 会安', countryZh: '越南' },
  'ho-chi-minh-city': { nameZh: '胡志明市', countryZh: '越南' },
  hanoi: { nameZh: '河内', countryZh: '越南' },
  'siem-reap': { nameZh: '暹粒', countryZh: '柬埔寨' },
  'phnom-penh': { nameZh: '金边', countryZh: '柬埔寨' },
  cebu: { nameZh: '宿务', countryZh: '菲律宾' },
  boracay: { nameZh: '长滩岛', countryZh: '菲律宾' },
  palawan: { nameZh: '巴拉望', countryZh: '菲律宾' },
};

/** Chinese copy for the nine starter destinations, where naming is not enough. */
export const STARTER_DESTINATION_ZH: Record<string, { taglineZh: string; descriptionZh: string }> = {
  'phu-quoc': {
    taglineZh: '免签海岛，直飞一小时五十分',
    descriptionZh: '越南唯一免签的海岛，从新加坡直飞不到两小时。北部是度假区和国家公园，南部是日落海滩和夜市。适合三四天的短假。',
  },
  'da-nang-hoi-an': {
    taglineZh: '海滩加古城，一趟两种',
    descriptionZh: '岘港是海滨城市，往南半小时就是会安古城。可以早上在海边，傍晚在灯笼街。适合五天左右。',
  },
  'ho-chi-minh-city': {
    taglineZh: '城市短假，吃和逛为主',
    descriptionZh: '越南最大的城市，法式建筑、咖啡馆和街头小吃密度很高。没有海滩，两天到四天比较合适。',
  },
  hanoi: {
    taglineZh: '老城、咖啡、下龙湾门户',
    descriptionZh: '越南首都，老城区适合步行乱逛，咖啡馆和街头小吃是重点。也可以作为去下龙湾的起点。',
  },
  'siem-reap': {
    taglineZh: '吴哥窟所在',
    descriptionZh: '吴哥遗址的门户城市，看寺庙群至少需要两整天。新机场 SAI 已启用，从新加坡直飞约两小时二十分。',
  },
  'phnom-penh': {
    taglineZh: '中转站，不是度假地',
    descriptionZh: '柬埔寨首都，多数人只是路过。皇宫和河边可以看半天，本身不是度假目的地。',
  },
  cebu: {
    taglineZh: '潜水与跳岛起点',
    descriptionZh: '菲律宾中部枢纽，往南是鲸鲨和沙丁鱼风暴，往东是薄荷岛。城市本身一般，重点在周边海岛。',
  },
  boracay: {
    taglineZh: '白沙长滩，商业化程度高',
    descriptionZh: '以四公里白沙滩出名，日落帆船是招牌。旺季人多、商业气息重，但沙质确实是这一带最好的。',
  },
  palawan: {
    taglineZh: '地下河与泻湖',
    descriptionZh: '菲律宾西南的长条岛，普林塞萨港是门户。地下河和爱妮岛的泻湖是主要理由，交通需要多留时间。',
  },
};
