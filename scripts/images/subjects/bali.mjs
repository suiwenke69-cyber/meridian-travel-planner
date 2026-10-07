/**
 * Bali subjects, verbatim.
 *
 * Extracted from the original single-destination script with no value changed,
 * so re-resolving Bali reproduces the manifest that shipped. The pipeline itself
 * is now destination-agnostic; only the subjects and their verification rules are
 * per-destination.
 *
 * Kept as data rather than as code: for every destination this is the file a
 * human edits, and reviewing a diff of "which photographs are allowed to
 * represent which property" should be reading a list, not a script.
 */

/** [id, name, mustIncludeTokens, aliasQueries] */
export const HOTELS = [
  ['the-st-regis-bali-resort', 'The St. Regis Bali Resort', ['st regis'], ['St. Regis Bali Resort', 'St Regis Bali']],
  ['the-ritz-carlton-bali', 'The Ritz-Carlton, Bali', ['ritz-carlton', 'ritz carlton'], ['Ritz Carlton Bali', 'Ritz-Carlton Bali']],
  ['w-bali-seminyak', 'W Bali - Seminyak', ['w retreat', 'w bali', 'w hotel bali'], ['W Retreat and Spa Bali', 'W Bali Seminyak']],
  ['the-laguna-a-luxury-collection-resort-nusa-dua-bali', 'The Laguna, a Luxury Collection Resort & Spa', ['laguna'], ['Laguna Resort Nusa Dua Bali']],
  ['the-westin-resort-nusa-dua-bali', 'The Westin Resort Nusa Dua, Bali', ['westin'], ['Westin Resort Nusa Dua Bali']],
  ['sheraton-bali-kuta-resort', 'Sheraton Bali Kuta Resort', ['sheraton'], ['Sheraton Bali Kuta']],
  ['renaissance-bali-uluwatu-resort-and-spa', 'Renaissance Bali Uluwatu Resort & Spa', ['renaissance'], ['Renaissance Bali Uluwatu']],
  ['renaissance-bali-nusa-dua-resort', 'Renaissance Bali Nusa Dua Resort', ['renaissance'], ['Renaissance Bali Nusa Dua']],
  ['le-meridien-bali-jimbaran', 'Le Méridien Bali Jimbaran', ['meridien', 'méridien'], ['Le Meridien Bali Jimbaran']],
  ['four-points-by-sheraton-bali-kuta', 'Four Points by Sheraton Bali, Kuta', ['four points'], ['Four Points Sheraton Bali Kuta']],
  ['four-points-by-sheraton-bali-ungasan', 'Four Points by Sheraton Bali, Ungasan', ['four points'], ['Four Points Sheraton Bali Ungasan']],
  ['aloft-bali-seminyak', 'Aloft Bali Seminyak', ['aloft'], ['Aloft Bali Seminyak']],
  ['aloft-bali-kuta-at-beachwalk', 'Aloft Bali Kuta at Beachwalk', ['aloft', 'beachwalk'], ['Aloft Bali Kuta Beachwalk']],
  ['the-stones-hotel-legian-bali-autograph-collection', 'The Stones Hotel - Legian Bali, Autograph Collection', ['stones'], ['Stones Hotel Legian Bali']],
  ['conrad-bali', 'Conrad Bali', ['conrad'], ['Conrad Bali']],
  ['hilton-bali-resort', 'Hilton Bali Resort', ['hilton bali'], ['Hilton Bali Resort Nusa Dua']],
  ['umana-bali-lxr-hotels-and-resorts', 'Umana Bali, LXR Hotels & Resorts', ['umana'], ['Umana Bali LXR']],
  ['hilton-garden-inn-bali-nusa-dua', 'Hilton Garden Inn Bali Nusa Dua', ['hilton garden inn'], ['Hilton Garden Inn Bali Nusa Dua']],
  ['hilton-garden-inn-bali-ngurah-rai-airport', 'Hilton Garden Inn Bali Ngurah Rai Airport', ['hilton garden inn'], ['Hilton Garden Inn Ngurah Rai']],
  ['courtyard-bali-seminyak', 'Courtyard by Marriott Bali Seminyak Resort', ['courtyard'], ['Courtyard Marriott Bali Seminyak']],
];

/** [id, queries] */
export const AREAS = [
  ['canggu', ['Canggu beach Bali', 'Batu Bolong Beach Canggu', 'Berawa Beach Bali']],
  ['seminyak', ['Seminyak Beach Bali', 'Petitenget Beach Bali', 'Seminyak Bali street']],
  ['ubud', ['Ubud Bali rice terrace', 'Ubud Palace Bali', 'Tegallalang rice terrace', 'Ubud Bali market']],
  ['uluwatu', ['Uluwatu Temple', 'Pura Luhur Uluwatu', 'Uluwatu Bali cliff']],
  ['nusa-dua', ['Nusa Dua Bali beach', 'Nusa Dua Bali resort', 'Nusa Dua Bali']],
  ['sanur', ['Sanur Beach Bali', 'Sanur Bali beach', 'Sanur Bali']],
  ['kuta-legian', ['Kuta Beach Bali', 'Legian Beach Bali', 'Kuta Bali']],
  ['jimbaran', ['Jimbaran Bay Bali', 'Jimbaran Bali beach', 'Jimbaran Bali']],
  ['amed', ['Amed Bali', 'Jemeluk Bay Bali', 'Amed Bali beach']],
  ['kintamani', ['Mount Batur', 'Kintamani Bali', 'Lake Batur Bali']],
  ['nusa-penida', ['Kelingking Beach Nusa Penida', 'Nusa Penida', 'Diamond Beach Nusa Penida']],
  ['tampaksiring', ['Tirta Empul', 'Tampaksiring Bali', 'Gunung Kawi']],
  ['denpasar', ['Denpasar Bali', 'Bajra Sandhi Monument', 'Pasar Badung Bali']],
  ['tabanan', ['Jatiluwih rice terrace', 'Tabanan Bali', 'Pura Luhur Batukaru']],
  ['karangasem', ['Tirta Gangga', 'Besakih Temple', 'Karangasem Bali']],
];

/** [id, queries] */
export const PLACES = [
  ['uluwatu-temple', ['Uluwatu Temple Bali', 'Pura Luhur Uluwatu']],
  ['tanah-lot', ['Tanah Lot', 'Tanah Lot Temple']],
  ['tegallalang-rice-terrace', ['Tegallalang rice terrace', 'Tegallalang Bali']],
  ['jatiluwih-rice-terrace', ['Jatiluwih rice terrace', 'Jatiluwih Bali']],
  ['mount-batur', ['Mount Batur', 'Mount Batur sunrise', 'Batur caldera']],
  ['tegenungan-waterfall', ['Tegenungan waterfall', 'Tegenungan Bali']],
  ['campuhan-ridge-walk', ['Campuhan ridge walk', 'Campuhan Ubud']],
  ['sacred-monkey-forest', ['Ubud Monkey Forest', 'Sacred Monkey Forest Sanctuary']],
  ['tirta-empul', ['Tirta Empul', 'Tirta Empul temple']],
  ['besakih-temple', ['Besakih Temple', 'Pura Besakih']],
  ['kintamani-viewpoint', ['Kintamani Bali', 'Mount Batur caldera', 'Penelokan']],
  ['mount-agung', ['Mount Agung Bali', 'Gunung Agung Bali']],
  ['mount-batur-sunrise-trek', ['Mount Batur trekking', 'Toya Bungkah', 'Pura Jati Batur']],
  ['balinese-cooking-class', ['Balinese cooking class', 'Balinese cuisine Ubud']],
  ['bebek-bengil', ['Bebek Bengil Ubud', 'Dirty Duck Diner Bali']],
  ['warung-mak-beng', ['Warung Mak Beng Sanur', 'Sanur Bali food']],
  ['kelingking-viewpoint', ['Kelingking Beach', 'Kelingking Nusa Penida']],
  ['kuta-beach', ['Kuta Beach Bali', 'Kuta Bali beach']],
  ['seminyak-beach', ['Seminyak Beach Bali', 'Seminyak beach']],
  ['nusa-dua-beach', ['Nusa Dua Beach Bali', 'Nusa Dua beach']],
  ['pandawa-beach', ['Pandawa Beach Bali', 'Pantai Pandawa']],
  ['melasti-beach', ['Melasti Beach Bali', 'Pantai Melasti Ungasan']],
  ['padang-padang-beach', ['Padang Padang Beach', 'Padang Padang Bali']],
  ['bingin-beach', ['Bingin Beach Bali', 'Bingin Bali']],
  ['balangan-beach', ['Balangan Beach Bali', 'Balangan Bali']],
  ['sanur-beach', ['Sanur Beach Bali', 'Sanur Bali beach']],
  ['jimbaran-beach', ['Jimbaran Bay', 'Jimbaran Bali']],
  ['jemeluk-beach', ['Amed Bali', 'Jemeluk Bay Bali']],
  ['ubud-palace', ['Ubud Palace', 'Puri Saren Agung']],
  ['ubud-art-market', ['Ubud Art Market', 'Ubud market Bali']],
  ['bali-swing', ['Bali Swing Ubud', 'Ayung river Bali']],
  ['ayung-river-rafting', ['Ayung River rafting', 'Ayung River Bali']],
  ['potato-head-beach-club', ['Potato Head Beach Club Bali', 'Seminyak beach club']],
  ['finns-beach-club', ['Finns Beach Club Bali', 'Berawa Beach Bali']],
  ['atlas-beach-fest', ['Atlas Beach Fest Bali', 'Berawa Beach Bali']],
  ['ku-de-ta', ['Ku De Ta Bali', 'Seminyak beach sunset']],
  ['warung-ibu-oka', ['Babi guling', 'Balinese food']],
  ['naughty-nuris-ubud', ['Balinese food', 'Ubud restaurant']],
  ['menega-cafe', ['Jimbaran seafood', 'Jimbaran Bay seafood']],
  ['single-fin', ['Uluwatu cliff sunset', 'Suluban Beach Bali']],
  ['old-mans', ['Batu Bolong Beach Canggu', 'Canggu Bali sunset']],
  ['la-plancha', ['Double Six Beach Bali', 'Seminyak beach sunset']],
  ['sanur-harbour', ['Sanur harbour Bali', 'Sanur Bali boat']],
  ['padangbai-harbour', ['Padang Bai Bali', 'Padangbai harbour']],
];

/** Per-subject gates, applied above the generic title scoring. */
export const SUBJECT_RULES = {
  'sacred-monkey-forest': { allow: /monkey|macaque|macaca/i },
  'kintamani-viewpoint': { mustMatch: /kintamani|batur|caldera|penelokan/i },
  'ku-de-ta': { mustMatch: /seminyak|petitenget|ku de ta|kudeta/i },
  'atlas-beach-fest': { mustMatch: /atlas|berawa|canggu/i },
  'bingin-beach': { mustMatch: /bingin|pecatu|uluwatu/i },
  'ubud-art-market': { mustMatch: /market|pasar|ubud/i, reject: /palace|puri/i },
};

/** Corrections read off the photographs themselves, once. */
export const DEPICTS_OVERRIDE = {
  'Conrad bali resort & spa (2940555041).jpg': 'signage',
  'Conrad Bali (2941410760).jpg': 'room',
  'Conrad Bali JIWA spa treatment room (2941411134).jpg': 'grounds',
  'Westin Resort Nusa Dua Bali (4540094068).jpg': 'signage',
  'W Hotel Bali (6924463930).jpg': 'pool',
  'W Hotel Bali (6924462698).jpg': 'exterior',
};

/** Titles that contain a property's name but are a different property entirely. */
const HOTEL_TITLE_REJECT =
  /(taipei|new taipei|museum|blanco|nirwana|stepping stones|panoramio|logo|coat[ _]of[ _]arms|airport hotel|bandara)/i;

/** Per-property title rules: the file must name the property AND the right place. */
export const HOTEL_TITLE_RULES = {
  'the-st-regis-bali-resort': { must: /st\.?\s?regis.{0,40}(bali|nusa dua|sawangan)/i },
  'the-ritz-carlton-bali': { must: /ritz.{0,28}carlton.{0,40}(bali|nusa dua|sawangan)/i },
  'w-bali-seminyak': { must: /\bw\b.{0,28}(bali|retreat|seminyak|petitenget)/i, reject: /w hotel taipei|washington/i },
  'the-laguna-a-luxury-collection-resort-nusa-dua-bali': { must: /laguna.{0,40}(nusa dua|bali)/i },
  'the-westin-resort-nusa-dua-bali': { must: /westin.{0,40}(nusa dua|bali)/i },
  'sheraton-bali-kuta-resort': { must: /sheraton.{0,40}(bali|kuta)/i },
  'renaissance-bali-uluwatu-resort-and-spa': { must: /renaissance.{0,40}(bali|uluwatu|ungasan)/i },
  'renaissance-bali-nusa-dua-resort': { must: /renaissance.{0,40}(bali|nusa dua)/i },
  'le-meridien-bali-jimbaran': { must: /m[ée]ridien.{0,40}(bali\s?jimbaran|jimbaran)/i },
  'four-points-by-sheraton-bali-kuta': { must: /four points.{0,44}(bali|kuta)/i },
  'four-points-by-sheraton-bali-ungasan': { must: /four points.{0,44}(bali|ungasan)/i },
  'aloft-bali-seminyak': { must: /aloft.{0,40}(bali|seminyak|batu belig)/i },
  'aloft-bali-kuta-at-beachwalk': { must: /aloft.{0,40}(bali|kuta|beachwalk)/i },
  'the-stones-hotel-legian-bali-autograph-collection': { must: /stones.{0,28}(hotel|legian|bali)/i, reject: /pond|stepping/i },
  'conrad-bali': { must: /conrad.{0,40}(bali|benoa|nusa dua)/i },
  'hilton-bali-resort': { must: /hilton.{0,20}(bali resort|bali|nusa dua)/i, reject: /garden inn/i },
  'umana-bali-lxr-hotels-and-resorts': { must: /umana.{0,40}(bali|ungasan|uluwatu|lxr)/i },
  'hilton-garden-inn-bali-nusa-dua': { must: /hilton garden inn.{0,40}(bali|nusa dua)/i },
  'hilton-garden-inn-bali-ngurah-rai-airport': { must: /hilton garden inn.{0,40}(bali|ngurah rai|airport)/i },
  'courtyard-bali-seminyak': { must: /courtyard.{0,40}(bali|seminyak)/i },
};

/** Locality words that legitimately appear in a property's own photo titles. */
export const LOCALITY_HINTS = {
  'the-st-regis-bali-resort': ['nusa dua', 'benoa', 'sawangan'],
  'the-ritz-carlton-bali': ['sawangan', 'nusa dua'],
  'w-bali-seminyak': ['petitenget', 'seminyak', 'kerobokan'],
  'the-laguna-a-luxury-collection-resort-nusa-dua-bali': ['nusa dua', 'benoa'],
  'the-westin-resort-nusa-dua-bali': ['nusa dua'],
  'sheraton-bali-kuta-resort': ['kuta'],
  'renaissance-bali-uluwatu-resort-and-spa': ['uluwatu', 'ungasan', 'balangan'],
  'renaissance-bali-nusa-dua-resort': ['nusa dua', 'benoa'],
  'le-meridien-bali-jimbaran': ['jimbaran'],
  'four-points-by-sheraton-bali-kuta': ['kuta'],
  'four-points-by-sheraton-bali-ungasan': ['ungasan', 'uluwatu'],
  'aloft-bali-seminyak': ['seminyak', 'batu belig'],
  'aloft-bali-kuta-at-beachwalk': ['kuta', 'beachwalk'],
  'the-stones-hotel-legian-bali-autograph-collection': ['legian'],
  'conrad-bali': ['tanjung benoa', 'benoa', 'nusa dua'],
  'hilton-bali-resort': ['nusa dua', 'sawangan'],
  'umana-bali-lxr-hotels-and-resorts': ['ungasan', 'melasti', 'uluwatu'],
  'hilton-garden-inn-bali-nusa-dua': ['nusa dua'],
  'hilton-garden-inn-bali-ngurah-rai-airport': ['ngurah rai', 'tuban', 'kuta'],
  'courtyard-bali-seminyak': ['seminyak'],
};

/**
 * The locality check.
 *
 * A regex that merely looks for the letters "bali" accepted "Four Points by
 * Sheraton Taipei Bali" — a hotel in New Taipei City, in a district called Bali —
 * and the same trick hides "Blanco Renaissance Museum Ubud Bali" behind the word
 * "renaissance".
 */
export const LOCALITY_HINT =
  /(nusa dua|seminyak|kuta|ubud|jimbaran|uluwatu|sanur|legian|benoa|ungasan|petitenget|berawa|canggu|tanjung|sawangan|melasti|tanah lot|ngurah rai)/i;

/** Words that carry no signal for this destination. */
export const STOPWORDS = ['bali', 'the', 'and', 'beach'];
