/**
 * BALI — SIMPLIFIED CHINESE OVERLAY, HOTELS ONLY.
 *
 * Scope: the ids that `getHotels('bali')` reports with no Chinese, i.e. the only
 * three Bali hotels still missing `nameZh`. Every Bali hotel already carries a
 * `descriptionZh`; the text below is the existing house copy, reproduced so this
 * map is a complete, mergeable record for each id.
 *
 * `nameZh` is set only where the brand itself publishes a Chinese property name.
 * Where it does not, the field is omitted deliberately and the reason is noted
 * on the record — a name a traveller cannot search for is worse than the Latin
 * one, and the English name is shown alongside every Chinese one anyway.
 */

export const HOTELS: Record<string, { nameZh?: string; descriptionZh: string }> = {
  'the-stones-hotel-legian-bali-autograph-collection': {
    // OMIT nameZh: Marriott publishes no Chinese property name for The Stones,
    // and third-party Chinese listings disagree with each other (勒吉安斯通 /
    // 雷吉安磐石 / 思通斯). The property trades as "The Stones" in Latin.
    descriptionZh:
      '勒吉安海滨路上的傲途格精选度假村，围绕大型环礁湖泳池建造，步行可到勒吉安海滩和水明漾餐饮街。',
  },

  'umana-bali-lxr-hotels-and-resorts': {
    // Hilton's own Chinese-language sites publish this property as
    // 巴厘岛乌马纳 LXR 酒店及度假村 (hilton.com.cn / hhonors.hilton.com.cn,
    // property code DPSOLOL), so the brand name exists and is used here.
    nameZh: '巴厘岛乌马纳 LXR 酒店及度假村',
    descriptionZh:
      'Melasti 海滩上方的全别墅悬崖度假村，2010 年以 Banyan Tree Ungasan 开业，经过两年翻新后于 2023 年 11 月更名为 Umana Bali, LXR Hotels & Resorts。',
  },

  'viceroy-bali': {
    // OMIT nameZh: Viceroy's own site and GHA's Chinese site both keep the
    // Latin brand name; 总督酒店 is only a third-party rendering (Michelin
    // Guide, Trip.com, Zanadu), not a name the brand publishes.
    descriptionZh:
      '位于乌布城外 Jalan Lanyahan、佩塔努河谷上方的全别墅度假村，别墅带私人泳池，沿谷地错落分布。它是 GHA DISCOVERY 联盟在乌布的代表，适合想安静看丛林与河谷的住客。',
  },
};
