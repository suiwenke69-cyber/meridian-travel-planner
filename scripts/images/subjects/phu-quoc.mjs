/**
 * Phu Quoc subjects.
 *
 * The second destination to get photography, and the first to go through the
 * pipeline without a hand-written script.
 *
 * WHAT IS DIFFERENT ABOUT A VIETNAMESE ISLAND
 * -------------------------------------------
 * Vietnamese place names arrive on Commons with and without diacritics, and
 * sometimes in a third form the uploader invented ("Bai Sao Beach", "Bãi Sao",
 * "Bai Sao Phu Quoc"). Every subject therefore carries both spellings in its
 * queries, and the locality gate accepts both.
 *
 * The other trap is brand entanglement: Vinpearl, Sun World and VinWonders all
 * operate several unrelated things on this island (a safari, a water park, a
 * cable car, a whole resort city). A query for one of them returns the others.
 * Those subjects carry `mustMatch` rules naming the specific attraction, so a
 * photograph of the Vinpearl resort can never be presented as the safari.
 *
 * Restaurants get specific-name queries only. A generic photograph of Vietnamese
 * food is not a photograph of a particular restaurant, and the pipeline's answer
 * to "we could not verify this" is an empty entry, not a stand-in.
 */

/** [id, name, mustIncludeTokens, aliasQueries] */
export const HOTELS = [
  ['jw-marriott-phu-quoc-emerald-bay', 'JW Marriott Phu Quoc Emerald Bay Resort & Spa', ['jw marriott phu quoc', 'jw marriott emerald bay'], ['JW Marriott Emerald Bay Phu Quoc', 'JW Marriott Phu Quoc', 'Emerald Bay Phu Quoc JW Marriott']],
  ['sheraton-phu-quoc-long-beach-resort', 'Sheraton Phu Quoc Long Beach Resort', ['sheraton phu quoc'], ['Sheraton Phu Quoc Long Beach', 'Sheraton Phu Quoc Resort']],
  ['la-festa-phu-quoc-curio-collection', 'La Festa Phu Quoc, Curio Collection by Hilton', ['la festa'], ['La Festa Phu Quoc', 'La Festa Phu Quoc Curio Collection']],
  ['intercontinental-phu-quoc-long-beach-resort', 'InterContinental Phu Quoc Long Beach Resort', ['intercontinental phu quoc'], ['InterContinental Phu Quoc', 'InterContinental Long Beach Phu Quoc']],
  ['regent-phu-quoc', 'Regent Phu Quoc', ['regent phu quoc'], ['Regent Phu Quoc', 'Regent Phu Quoc resort']],
  ['crowne-plaza-phu-quoc-starbay', 'Crowne Plaza Phu Quoc Starbay', ['crowne plaza phu quoc'], ['Crowne Plaza Phu Quoc Starbay', 'Crowne Plaza Phu Quoc']],
  ['nam-nghi-phu-quoc', 'Nam Nghi Phu Quoc', ['nam nghi'], ['Nam Nghi Phu Quoc', 'Nam Nghi Coral Peninsula Phu Quoc']],
];

/** [id, queries] */
export const AREAS = [
  ['duong-dong', ['Duong Dong Phu Quoc', 'Dương Đông Phú Quốc', 'Duong Dong town Phu Quoc', 'Phu Quoc night market Dinh Cau']],
  ['long-beach-bai-truong', ['Long Beach Phu Quoc', 'Bãi Trường Phú Quốc', 'Bai Truong Phu Quoc', 'Truong Beach Phu Quoc sunset']],
  ['ong-lang-cua-can-ganh-dau', ['Ong Lang beach Phu Quoc', 'Bãi Ông Lăng Phú Quốc', 'Cua Can Phu Quoc', 'Ganh Dau Phu Quoc']],
  ['an-thoi-south', ['An Thoi Phu Quoc', 'Sunset Town Phu Quoc', 'An Thoi islands Phu Quoc', 'Phu Quoc southern islands']],
  ['duong-to', ['Dương Tơ Phú Quốc', 'Duong To Phu Quoc', 'Bai Truong Duong To Phu Quoc']],
  ['bai-sao', ['Bãi Sao Phú Quốc', 'Sao Beach Phu Quoc', 'Bai Sao Phu Quoc beach']],
  ['vung-bau', ['Bãi Dài Phú Quốc', 'Vung Bau Phu Quoc', 'Bai Dai Phu Quoc beach']],
  ['bai-thom', ['Bãi Thơm Phú Quốc', 'Bai Thom Phu Quoc', 'Thom Beach Phu Quoc']],
  ['rach-vem', ['Rạch Vẹm Phú Quốc', 'Rach Vem Phu Quoc', 'Rach Vem fishing village']],
  ['cay-sao', ['Cây Sao Phú Quốc', 'Cay Sao Phu Quoc', 'Phu Quoc east coast beach']],
  ['ham-ninh', ['Hàm Ninh Phú Quốc', 'Ham Ninh Phu Quoc', 'Ham Ninh fishing village Phu Quoc']],
  ['national-park-interior', ['Phu Quoc National Park', 'Vườn quốc gia Phú Quốc', 'Suoi Tranh Phu Quoc', 'Phu Quoc forest']],
  ['an-thoi-archipelago', ['An Thoi Islands Phu Quoc', 'Hon Thom Phu Quoc', 'Hòn Thơm Phú Quốc', 'Quần đảo An Thới']],
];

/** [id, queries] */
export const PLACES = [
  ['sao-beach', ['Bãi Sao Phú Quốc', 'Sao Beach Phu Quoc', 'Bai Sao Phu Quoc']],
  ['kem-beach', ['Bãi Khem Phú Quốc', 'Kem Beach Phu Quoc', 'Bai Khem Phu Quoc']],
  ['phu-quoc-national-park', ['Phu Quoc National Park', 'Vườn quốc gia Phú Quốc', 'Phu Quoc national park forest']],
  ['vinwonders-phu-quoc', ['VinWonders Phu Quoc', 'Vinpearl Land Phu Quoc', 'VinWonders Phú Quốc']],
  ['phu-quoc-night-market', ['Phu Quoc night market', 'Chợ đêm Phú Quốc', 'Dinh Cau night market Phu Quoc']],
  ['ocsen-beach-bar-club', ['Ocsen Beach Bar Phu Quoc', 'Oc Sen beach club Phu Quoc', 'Ong Lang beach bar Phu Quoc']],
  ['hon-thom-cable-car', ['Hon Thom cable car', 'Cáp treo Hòn Thơm', 'Sun World Hon Thom cable car']],
  ['phu-quoc-prison', ['Phu Quoc Prison', 'Nhà tù Phú Quốc', 'Coconut Tree Prison Phu Quoc']],
  ['bai-dai-north-west', ['Bãi Dài Phú Quốc', 'Bai Dai Phu Quoc', 'Bai Dai beach Phu Quoc']],
  ['bai-ong-lang', ['Bãi Ông Lăng Phú Quốc', 'Ong Lang beach Phu Quoc', 'Bai Ong Lang']],
  ['bai-ganh-dau', ['Bãi Gành Dầu Phú Quốc', 'Ganh Dau beach Phu Quoc', 'Bai Ganh Dau']],
  ['bai-vung-bau', ['Bãi Vũng Bầu Phú Quốc', 'Vung Bau beach Phu Quoc', 'Bai Vung Bau']],
  ['bai-rach-vem', ['Bãi Rạch Vẹm Phú Quốc', 'Rach Vem beach Phu Quoc', 'Bai Rach Vem']],
  ['thom-beach', ['Bãi Thơm Phú Quốc', 'Thom beach Phu Quoc', 'Bai Thom Phu Quoc']],
  ['suoi-tranh', ['Suối Tranh Phú Quốc', 'Suoi Tranh waterfall Phu Quoc', 'Suoi Tranh Phu Quoc']],
  ['tien-son-dinh', ['Tiên Sơn Đỉnh Phú Quốc', 'Tien Son Dinh Phu Quoc', 'Tien Son Dinh mountain']],
  ['dinh-cau', ['Dinh Cậu Phú Quốc', 'Dinh Cau Phu Quoc', 'Dinh Cau temple Phu Quoc']],
  ['sung-hung-pagoda', ['Sùng Hưng Cổ Tự Phú Quốc', 'Sung Hung pagoda Phu Quoc', 'Chùa Sùng Hưng Phú Quốc']],
  ['su-muon-pagoda', ['Chùa Sư Muôn Phú Quốc', 'Su Muon pagoda Phu Quoc', 'Su Muon Phu Quoc']],
  ['truc-lam-ho-quoc-zen-monastery', ['Trúc Lâm Hộ Quốc Phú Quốc', 'Truc Lam Ho Quoc monastery', 'Thiền viện Trúc Lâm Phú Quốc']],
  ['gia-long-temple', ['Đền thờ vua Gia Long Phú Quốc', 'Gia Long temple Phu Quoc', 'Den thờ Gia Long']],
  ['duong-dong-market', ['Chợ Dương Đông Phú Quốc', 'Duong Dong market Phu Quoc', 'Cho Duong Dong']],
  ['an-thoi-market', ['Chợ An Thới Phú Quốc', 'An Thoi market Phu Quoc', 'Cho An Thoi']],
  ['ham-ninh-pier-and-seafood-market', ['Hàm Ninh pier Phú Quốc', 'Ham Ninh fishing village Phu Quoc', 'Ham Ninh Phu Quoc seafood']],
  ['khai-hoan-fish-sauce', ['Nước mắm Phú Quốc', 'Phu Quoc fish sauce', 'Khai Hoan fish sauce Phu Quoc']],
  ['ngoc-ha-pepper-farm', ['Hồ tiêu Phú Quốc', 'Phu Quoc pepper farm', 'Vuon tieu Ngoc Ha Phu Quoc']],
  ['ngoc-hien-pearl-farm', ['Ngọc trai Phú Quốc', 'Phu Quoc pearl farm', 'Ngoc Hien pearl farm Phu Quoc']],
  ['bai-vong-ferry-terminal', ['Bãi Vòng Phú Quốc', 'Bai Vong ferry Phu Quoc', 'Bai Vong Phu Quoc port']],
  ['an-thoi-port', ['Cảng An Thới Phú Quốc', 'An Thoi port Phu Quoc', 'Cang An Thoi']],
  ['an-thoi-lighthouse', ['Hải đăng An Thới Phú Quốc', 'An Thoi lighthouse Phu Quoc', 'An Thoi lighthouse']],
  ['vinpearl-safari-phu-quoc', ['Vinpearl Safari Phu Quoc', 'Vườn thú Vinpearl Phú Quốc', 'Vinpearl Safari Phú Quốc']],
  ['grand-world-phu-quoc', ['Grand World Phu Quoc', 'Vinpearl Grand World Phú Quốc', 'Grand World Phú Quốc']],
  ['aquatopia-water-park', ['Aquatopia Phu Quoc', 'Sun World Hon Thom water park', 'Aquatopia water park Phu Quoc']],
  ['ong-lang-snorkelling-reef', ['Snorkelling Phu Quoc', 'Lặn biển Phú Quốc', 'Phu Quoc coral reef']],
  ['bun-quay-thanh-hung', ['Bún quậy Phú Quốc', 'Bun quay Phu Quoc', 'Bun quay Thanh Hung']],
  ['chuon-chuon-bistro-and-sky-bar', ['Chuồn Chuồn Bistro Phú Quốc', 'Chuon Chuon sky bar Phu Quoc', 'Chuon Chuon Phu Quoc']],
  ['ganesh-indian-restaurant', ['Ganesh Indian restaurant Phu Quoc', 'Ganesh Phu Quoc', 'Indian restaurant Phu Quoc']],
];

/**
 * Per-subject gates, applied above the generic title scoring.
 *
 * Only subjects whose name is genuinely ambiguous need one. "Bãi Sao" is two
 * ordinary Vietnamese words, and there are night markets and pearl farms all
 * over the country; a `mustMatch` naming Phu Quoc is what stops the pipeline
 * attaching a photograph of somewhere else.
 */
/**
 * Per-subject gates. Every subject has one, and every one names the subject.
 *
 * This is stricter than the Bali file, on purpose. Bali's names carry their own
 * signal ("Uluwatu", "Tanah Lot"); Phu Quoc's do not. A search for "Ông Lăng"
 * returns a photograph of a temple statue in the Mekong Delta, and "Vũng Bầu"
 * returns three 1946 government documents and a coal mine in Poland — all of
 * them matching on one ordinary Vietnamese word. Requiring the subject's own
 * name, in either spelling, is what makes the difference between photography of
 * a place and photography that merely shares a syllable with it.
 *
 * Beaches and nature subjects also reject resort titles: a photograph of the JW
 * Marriott at Bãi Khem is real, correctly licensed and not a photograph of Bãi
 * Khem.
 */
export const SUBJECT_RULES = {
  'duong-dong': { mustMatch: /duong dong|dương đông/ },
  'long-beach-bai-truong': { mustMatch: /bai truong|bãi trường|long beach/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'ong-lang-cua-can-ganh-dau': {
    // "Cửa Cạn" on its own is matched by a 1946 proclamation ("Sắc lệnh của Can
    // Long"), so that branch has to name the island too.
    mustMatch: /(ong lang|ông lăng|ganh dau|gành dầu)|((cua can|cửa cạn)[\s\S]{0,24}(phú quốc|phu quoc))/i,
    reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i,
  },
  'an-thoi-south': { mustMatch: /an thoi|an thới/, reject: /apollo|night market/ },
  'duong-to': { mustMatch: /duong to|dương tơ/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'bai-sao': { mustMatch: /bai sao|bãi sao|sao beach|star beach/, reject: /night market|chợ/ },
  'vung-bau': { mustMatch: /vung bau|vũng bầu/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'bai-thom': { mustMatch: /bai thom|bãi thơm|thom beach/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'rach-vem': { mustMatch: /rach vem|rạch vẹm/ },
  'cay-sao': { mustMatch: /cay sao|cây sao/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'ham-ninh': { mustMatch: /ham ninh|hàm ninh/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'national-park-interior': {
    // Suối Tranh is its own subject a few lines down; the park interior is not
    // the same place, and three waterfall photographs were standing in for it.
    mustMatch: /(phú quốc|phu quoc)[\s\S]{0,30}(national park|vườn quốc gia)|(national park|vườn quốc gia)[\s\S]{0,30}(phú quốc|phu quoc)/i,
    reject: /suoi tranh|suối tranh|(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i,
  },
  'an-thoi-archipelago': { mustMatch: /an thoi|an thới|hon thom|hòn thơm|quần đảo|island/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'sao-beach': { mustMatch: /bai sao|bãi sao|sao beach|star beach/ },
  'kem-beach': { mustMatch: /bai khem|bãi khem|kem beach/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'phu-quoc-national-park': { mustMatch: /national park|vườn quốc gia/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'vinwonders-phu-quoc': { mustMatch: /vinwonders|vinpearl land/, reject: /safari|grand world/ },
  'phu-quoc-night-market': { mustMatch: /night market|chợ đêm|cho dem/ },
  'ocsen-beach-bar-club': { mustMatch: /ocsen|oc sen/ },
  'hon-thom-cable-car': { mustMatch: /cable car|cáp treo|hon thom|hòn thơm/, reject: /aquatopia|water park/ },
  'phu-quoc-prison': { mustMatch: /prison|nhà tù|nha tu/ },
  'bai-dai-north-west': { mustMatch: /bai dai|bãi dài/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'bai-ong-lang': { mustMatch: /ong lang|ông lăng/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'bai-ganh-dau': { mustMatch: /ganh dau|gành dầu/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'bai-vung-bau': { mustMatch: /vung bau|vũng bầu/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'bai-rach-vem': { mustMatch: /rach vem|rạch vẹm/ },
  'thom-beach': { mustMatch: /bai thom|bãi thơm|thom beach/, reject: /(resort|hotel|marriott|sheraton|intercontinental|regent|vinpearl|premier village|new world|nam nghi|crowne|la festa|homestay|guesthouse)/i },
  'suoi-tranh': { mustMatch: /suoi tranh|suối tranh/ },
  'tien-son-dinh': { mustMatch: /tien son dinh|tiên sơn đỉnh/, ownName: true },
  'dinh-cau': { mustMatch: /dinh cau|dinh cậu/, reject: /night market|chợ/ },
  'sung-hung-pagoda': { mustMatch: /sung hung|sùng hưng/ },
  'su-muon-pagoda': { mustMatch: /su muon|sư muôn/, ownName: true },
  'truc-lam-ho-quoc-zen-monastery': {
    // "Trúc Lâm" alone is a whole Zen sect with monasteries across Vietnam, so
    // the two halves of this one's name are required together.
    mustMatch: /(trúc lâm|truc lam)[\s\S]{0,30}(hộ quốc|ho quoc)|(hộ quốc|ho quoc)[\s\S]{0,30}(trúc lâm|truc lam)/i,
    ownName: true,
  },
  /*
   * Gia Long's temple gets NO image, and this is why.
   *
   * The one Commons file whose title matches — "Cổng miếu Gia Long.jpg" — is
   * categorised `Dong Thap`, a thousand kilometres away in the Mekong Delta, and
   * the uploader's own series is titled after a different Gia Long shrine. An
   * `ownName` exemption let it through on the first pass; the category check is
   * what caught it. There is no verified photograph of the island's temple, so
   * there is no entry, and the card says so rather than showing the Delta.
   */
  'gia-long-temple': {
    mustMatch: /(miếu|mieu|đền thờ|den tho|cổng miếu)[\s\S]{0,24}(gia long)/i,
    reject: /bản vẽ|ban ve|thành đồ bàn|map|plan|lăng|đồng tháp|dong thap/i,
  },
  'duong-dong-market': { mustMatch: /duong dong|dương đông/, reject: /cao lanh|dong thap|đồng tháp/ },
  'an-thoi-market': { mustMatch: /an thoi|an thới/, reject: /my thoi|mỹ thới|cầu sấu|cau sau/ },
  'ham-ninh-pier-and-seafood-market': { mustMatch: /ham ninh|hàm ninh/ },
  'khai-hoan-fish-sauce': { mustMatch: /khai hoan|khải hoàn/ },
  'ngoc-ha-pepper-farm': { mustMatch: /ngoc ha|ngọc hà/ },
  'ngoc-hien-pearl-farm': { mustMatch: /ngoc hien|ngọc hiền/ },
  'bai-vong-ferry-terminal': { mustMatch: /bai vong|bãi vòng/ },
  'an-thoi-port': { mustMatch: /an thoi|an thới/, reject: /my thoi|mỹ thới/ },
  'an-thoi-lighthouse': {
    mustMatch: /(hải đăng|hai dang|lighthouse)[\s\S]{0,24}(an thới|an thoi)|(an thới|an thoi)[\s\S]{0,24}(hải đăng|hai dang|lighthouse)/i,
    ownName: true,
  },
  'vinpearl-safari-phu-quoc': { mustMatch: /safari|vườn thú/, reject: /vinwonders|grand world/ },
  'grand-world-phu-quoc': { mustMatch: /grand world/, reject: /safari|vinwonders/ },
  'aquatopia-water-park': { mustMatch: /aquatopia/, ownName: true },
  'ong-lang-snorkelling-reef': { mustMatch: /snorkel|lặn biển|coral|san hô|rạn/ },
  'bun-quay-thanh-hung': { mustMatch: /bun quay|bún quậy/ },
  'chuon-chuon-bistro-and-sky-bar': { mustMatch: /chuon chuon|chuồn chuồn/ },
  'ganesh-indian-restaurant': { mustMatch: /ganesh/ },
};

/**
 * Corrections applied after looking at the actual photographs.
 *
 * The same trap as Bali: a beach photograph titled "Phu Quoc" is not a
 * photograph of a named beach, and a hotel's signage is not its pool. Anything
 * corrected here was seen, not guessed.
 */
export const DEPICTS_OVERRIDE = {};

/** Titles that contain a property's name but are a different property entirely. */
export const HOTEL_TITLE_REJECT =
  /(nha trang|da nang|đà nẵng|hoi an|hội an|hanoi|hà nội|saigon|sài gòn|ho chi minh|da lat|đà lạt|taipei|museum|logo|coat[ _]of[ _]arms|signage|airport hotel|bandara|con dao|côn đảo|phu quoc ridgeback|dog show)/i;

/**
 * Per-property title rules.
 *
 * A hotel photo may only be used if its own file title names BOTH the property
 * and somewhere on this island. Without this, "Vinpearl Resort & Spa Nha Trang"
 * and every other Vietnamese beach resort passes for a Phu Quoc property.
 */
export const HOTEL_TITLE_RULES = {
  'jw-marriott-phu-quoc-emerald-bay': { must: /jw marriott.{0,44}(phu quoc|emerald bay|khem|kem)/i, reject: /nha trang|hanoi|saigon/i },
  'sheraton-phu-quoc-long-beach-resort': { must: /sheraton.{0,44}(phu quoc|long beach|bai truong|duong to)/i, reject: /nha trang|hanoi|saigon/i },
  'la-festa-phu-quoc-curio-collection': { must: /la festa.{0,44}(phu quoc|sunset town|an thoi)/i, reject: /nha trang|hanoi|saigon/i },
  'intercontinental-phu-quoc-long-beach-resort': { must: /intercontinental.{0,44}(phu quoc|long beach|bai truong)/i, reject: /nha trang|hanoi|saigon/i },
  'regent-phu-quoc': { must: /regent.{0,44}(phu quoc|bai truong|long beach)/i, reject: /nha trang|hanoi|saigon|singapore/i },
  'crowne-plaza-phu-quoc-starbay': { must: /crowne plaza.{0,44}(phu quoc|starbay|bai dai|ganh dau)/i, reject: /nha trang|hanoi|saigon/i },
  'nam-nghi-phu-quoc': { must: /nam nghi.{0,44}(phu quoc|coral peninsula|vung bau|bai dai)/i, reject: /nha trang|hanoi|saigon/i },
};

/** Locality words that legitimately appear in a property's own photo titles. */
export const LOCALITY_HINTS = {
  'jw-marriott-phu-quoc-emerald-bay': ['emerald bay', 'khem', 'kem beach', 'an thoi', 'phu quoc'],
  'sheraton-phu-quoc-long-beach-resort': ['long beach', 'bai truong', 'duong to', 'phu quoc'],
  'la-festa-phu-quoc-curio-collection': ['sunset town', 'an thoi', 'phu quoc'],
  'intercontinental-phu-quoc-long-beach-resort': ['long beach', 'bai truong', 'phu quoc'],
  'regent-phu-quoc': ['bai truong', 'long beach', 'phu quoc'],
  'crowne-plaza-phu-quoc-starbay': ['starbay', 'bai dai', 'ganh dau', 'phu quoc'],
  'nam-nghi-phu-quoc': ['coral peninsula', 'vung bau', 'bai dai', 'phu quoc'],
};

/**
 * A location signal that actually means Phu Quoc.
 *
 * Without it, "Sao Beach" resolves to São Paulo and "Long Beach" to California.
 * Both spellings of every name are accepted, because Commons holds both.
 */
export const LOCALITY_HINT =
  /(phu quoc|phú quốc|phu-quoc|duong dong|dương đông|an thoi|an thới|ong lang|ông lăng|bai truong|bãi trường|long beach|emerald bay|bai khem|bãi khem|kem beach|bai sao|bãi sao|sao beach|ganh dau|gành dầu|vung bau|vũng bầu|rach vem|rạch vẹm|ham ninh|hàm ninh|cua can|cửa cạn|bai thom|bãi thơm|cay sao|cây sao|vinpearl|hon thom|hòn thơm|grand world|sunset town|kien giang|kiên giang|bai vong|bãi vòng|dinh cau|dinh cậu)/i;

/**
 * The destination-level gate, applied to every Commons candidate as well as
 * every Openverse one. Without it, "Bãi Thơm" resolves to a commune office in
 * Thái Bình and "Bãi Dài" to a 1946 declaration of independence.
 */
export const REQUIRE_LOCALITY = LOCALITY_HINT;

/** Words that carry no signal for this destination. */
export const STOPWORDS = ['the', 'and', 'beach', 'island', 'vietnam'];
