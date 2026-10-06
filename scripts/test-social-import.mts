/**
 * Social guide import — the behaviour this iteration is actually about.
 *
 * Every case runs against CONTROLLED sample text, never a live platform. That is
 * not a shortcut: the product's contract is that Meridian never fetches these
 * platforms (§5, §40), so a test that scraped one would be testing something the
 * product does not do. What is worth proving is what happens to text once the
 * traveller has pasted it.
 *
 * Usage: npm run test:social
 */

import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// A localStorage shim, installed BEFORE the store is imported.
//
// The store persists to localStorage. Node has none, and a test that silently
// ran against a store which could not persist would not be testing the real
// object.
// ---------------------------------------------------------------------------
const memory = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (index: number) => [...memory.keys()][index] ?? null,
  get length() {
    return memory.size;
  },
} as Storage;

const { getAreas, getHotels, getPlaces } = await import('../lib/data');
const { extractMentions } = await import('../lib/research/extract');
const { matchPlace, MATCH_CONFIDENCE_FLOOR } = await import('../lib/research/match');
const { useResearchStore, bandFor, getProfileId } = await import('../lib/research/store');
const { checkImportInput, checkImportRate, capMentions, MAX_TEXT_LENGTH } = await import(
  '../lib/research/limits'
);
const { matchesSavedFilter, SAVED_FILTERS } = await import('../lib/research/saved');
const { detectPlatform } = await import('../lib/research/platforms');
const { getPlaces: places, getAreas: areas, getHotels: hotels } = await import('../lib/data');

let failures = 0;
let passes = 0;

function check(name: string, passed: boolean, detail = '') {
  if (passed) {
    passes += 1;
    console.log(`  [PASS] ${name}`);
  } else {
    failures += 1;
    console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

function store() {
  return useResearchStore.getState();
}

/** Reset between cases so one import cannot leak into the next. */
function reset() {
  useResearchStore.setState({
    imports: [],
    mentions: [],
    savedPlaces: [],
    submissions: [],
    aliases: [],
    importTimestamps: [],
  });
}

const DESTINATION = 'bali';
const knownPlaces = places(DESTINATION).map((place) => ({
  id: place.id,
  name: place.name,
  nameZh: place.nameZh,
  areaId: place.areaId,
  discovery: place.discovery,
  category: place.category,
}));
const knownHotels = hotels(DESTINATION).map((hotel) => ({
  id: hotel.id,
  name: hotel.name,
  nameZh: hotel.nameZh,
  areaId: hotel.areaId,
  discovery: ['hotel'],
  category: 'hotel',
}));
const allTargets = [...knownPlaces, ...knownHotels];
const knownAreas = areas(DESTINATION).map((area) => ({ id: area.id, name: area.name, nameZh: area.nameZh }));

const CHINESE = `巴厘岛第三天我们去了乌鲁瓦图神庙，建议下午四点多到，然后去附近看日落。第二天在长谷吃了 Milk & Madu，早餐很好。晚上去了 La Brisa，氛围很好但周末人特别多，必点：烤章鱼。`;
const ENGLISH = `Day 3 we went to Uluwatu Temple around 4pm for sunset. Breakfast at Crate Cafe in Canggu was good but packed on weekends. Dinner at La Brisa, must try the octopus.`;
const MIXED = `第一天住 Alila Villas Uluwatu。第二天去 Uluwatu Temple 看日落，晚上 La Brisa。`;

// ---------------------------------------------------------------------------
section('1. Chinese extraction');
// ---------------------------------------------------------------------------
{
  const result = extractMentions(CHINESE, allTargets, knownAreas);
  const names = result.mentions.map((m) => m.rawPlaceName);
  check('extracts three places from Chinese prose', result.mentions.length === 3, names.join(' | '));
  check('keeps the name exactly as written', names.includes('La Brisa'), names.join(' | '));
  check('keeps a Chinese name exactly as written', names.includes('乌鲁瓦图神庙'), names.join(' | '));
  check('finds the English name embedded in Chinese text', names.includes('Milk & Madu'), names.join(' | '));

  const brisa = result.mentions.find((m) => m.rawPlaceName === 'La Brisa');
  check('classifies a beach club as a beach club', brisa?.recommendationType === 'beachclub', String(brisa?.recommendationType));
  // The segment-level fix: 日落 belongs to the temple's sentence, not this one.
  check(
    'does not inherit themes from a neighbouring sentence',
    !brisa?.contextThemes.includes('日落') && !brisa?.positiveThemes.includes('日落'),
    JSON.stringify({ context: brisa?.contextThemes, positive: brisa?.positiveThemes }),
  );
  check('keeps the praise from its own sentence', Boolean(brisa?.positiveThemes.includes('氛围好')), JSON.stringify(brisa?.positiveThemes));
  check('records the crowding warning', Boolean(brisa?.warnings.some((w) => w.includes('周末'))), JSON.stringify(brisa?.warnings));
  check('extracts the named dish', Boolean(brisa?.recommendedItems.includes('烤章鱼')), JSON.stringify(brisa?.recommendedItems));

  const temple = result.mentions.find((m) => m.rawPlaceName === '乌鲁瓦图神庙');
  check('keeps the sunset theme on the temple', Boolean(temple?.contextThemes.includes('日落')), JSON.stringify(temple?.contextThemes));
  check('records the time the guide mentions', Boolean(temple?.bestTimeMentioned), String(temple?.bestTimeMentioned));
  check('every mention carries a reason', result.mentions.every((m) => Boolean(m.extractedReason)));
  check('never carries the whole line as rawText', result.mentions.every((m) => (m.rawText ?? '').length < CHINESE.length));
}

// ---------------------------------------------------------------------------
section('2. English extraction');
// ---------------------------------------------------------------------------
{
  const result = extractMentions(ENGLISH, allTargets, knownAreas);
  const names = result.mentions.map((m) => m.rawPlaceName);
  check('extracts three places from English prose', result.mentions.length === 3, names.join(' | '));
  check('finds the temple', names.some((n) => /uluwatu/i.test(n)), names.join(' | '));
  check('finds the cafe', names.some((n) => /crate/i.test(n)), names.join(' | '));
  check('finds the beach club', names.some((n) => /la brisa/i.test(n)), names.join(' | '));
}

// ---------------------------------------------------------------------------
section('3. Mixed Chinese and English');
// ---------------------------------------------------------------------------
{
  const result = extractMentions(MIXED, allTargets, knownAreas);
  const names = result.mentions.map((m) => m.rawPlaceName);
  check('handles a mixed-language guide', result.mentions.length >= 3, names.join(' | '));
  check('extracts the English temple inside Chinese text', names.some((n) => /uluwatu temple/i.test(n)), names.join(' | '));
  check('extracts the hotel', names.some((n) => /alila/i.test(n)), names.join(' | '));
}

// ---------------------------------------------------------------------------
section('4. Duplicate names collapse to one canonical place');
// ---------------------------------------------------------------------------
{
  const targets = knownPlaces.map((p) => ({ id: p.id, name: p.name, nameZh: p.nameZh, areaId: p.areaId }));
  const a = matchPlace('La Brisa', targets, {});
  const b = matchPlace('La Brisa Bali', targets, {});
  const c = matchPlace('La Brisa Canggu', targets, {});
  check('La Brisa matches a canonical place', Boolean(a.placeId), `confidence ${a.confidence}`);
  check('La Brisa Bali matches THE SAME place', b.placeId === a.placeId, `${a.placeId} vs ${b.placeId}`);
  check('La Brisa Canggu matches THE SAME place', c.placeId === a.placeId, `${a.placeId} vs ${c.placeId}`);

  const canonical = places(DESTINATION).filter((p) => /la brisa/i.test(p.name));
  check('the dataset holds exactly one La Brisa', canonical.length === 1, canonical.map((p) => p.id).join(', '));

  // The same guide mentioning the same place twice is one place, not two.
  const twice = extractMentions('晚上去了 La Brisa。第二天又去了 La Brisa Bali。', allTargets, knownAreas);
  const matchedIds = new Set(twice.mentions.map((m) => matchPlace(m.rawPlaceName, targets, {}).placeId).filter(Boolean));
  check('a repeated place yields one canonical target', matchedIds.size <= 1, [...matchedIds].join(', '));
}

// ---------------------------------------------------------------------------
section('5. Ambiguity and unknown names never guess');
// ---------------------------------------------------------------------------
{
  const targets = knownPlaces.map((p) => ({ id: p.id, name: p.name, nameZh: p.nameZh, areaId: p.areaId }));
  const nonsense = matchPlace('Zqxwv Noodle Bar', targets, {});
  check('an unknown name produces no match', !nonsense.placeId, `got ${nonsense.placeId}`);

  const weak = matchPlace('Brisa', targets, {});
  check(
    'a partial name either matches above the floor or not at all',
    !weak.placeId || weak.confidence >= MATCH_CONFIDENCE_FLOOR,
    `confidence ${weak.confidence}`,
  );

  check('high band preselects', bandFor(0.95) === 'high', bandFor(0.95));
  check('medium band asks', bandFor(0.6) === 'medium', bandFor(0.6));
  check('low band never guesses', bandFor(undefined) === 'low' && bandFor(0.2) === 'low');
}

// ---------------------------------------------------------------------------
section('6. Full import: paste → process → review → save');
// ---------------------------------------------------------------------------
{
  reset();
  const started = store().startImport({
    url: 'https://www.xiaohongshu.com/explore/abc123',
    text: CHINESE,
    destinationId: DESTINATION,
  });
  check('startImport returns a record', Boolean(started.import));
  check('no limit violation for a normal paste', !started.violation);

  const id = started.import!.id;
  const record = store().imports.find((entry) => entry.id === id)!;
  check('the URL is kept as provenance', record.sourceUrl === 'https://www.xiaohongshu.com/explore/abc123');
  check('the platform is detected from the URL', record.platform === 'xiaohongshu', record.platform);
  check('the import starts private', record.visibility === 'private', record.visibility);
  check('the import knows the destination', record.destinationId === DESTINATION);
  check('the pasted text is stored on the record', Boolean(record.userProvidedText));
  check('the import belongs to a local profile', record.ownerProfileId === getProfileId());

  const result = await store().processImport(id);
  check('processImport reports the candidate count', !('error' in result) && result.places >= 3, JSON.stringify(result));

  const mentions = store().mentions.filter((m) => m.importId === id);
  check('mentions are attached to the import', mentions.length >= 3, String(mentions.length));
  check('nothing is saved before the traveller decides', mentions.every((m) => m.userDecision === 'pending'));
  check('the import needs review', store().imports.find((i) => i.id === id)!.status === 'review_required');
  check('matched mentions carry a canonical place id', mentions.some((m) => Boolean(m.matchedPlaceId)));
  check('mentions without a match are marked unmatched', mentions.every((m) => m.matchedPlaceId || m.verificationStatus === 'unmatched'));
  check('every mention records a band', mentions.every((m) => ['high', 'medium', 'low'].includes(m.matchBand)));

  const laBrisa = mentions.find((m) => m.rawPlaceName === 'La Brisa')!;
  check('La Brisa matched the canonical beach club', laBrisa.matchedPlaceId === 'la-brisa', String(laBrisa.matchedPlaceId));

  // The traveller ticks two and ignores one.
  store().decideMention(laBrisa.id, 'save');
  const temple = mentions.find((m) => /乌鲁瓦图/.test(m.rawPlaceName));
  if (temple) store().decideMention(temple.id, 'save');
  const unmatched = mentions.find((m) => !m.matchedPlaceId);
  if (unmatched) store().decideMention(unmatched.id, 'ignore');

  const saved = store().saveSelected(id);
  check('saving counts the chosen places', saved.saved >= 1, String(saved.saved));
  check('ignored mentions are not saved', !store().savedPlaces.some((p) => p.placeId === unmatched?.id));
  check('saved places reference canonical ids', store().savedPlaces.every((p) => Boolean(places(DESTINATION).find((pl) => pl.id === p.placeId))));
  check('saved places remember the import they came from', store().savedPlaces.every((p) => p.sourceImportId === id));

  // Idempotence: saving twice does not duplicate.
  const before = store().savedPlaces.length;
  store().saveSelected(id);
  check('saving twice does not duplicate a place', store().savedPlaces.length === before, `${before} → ${store().savedPlaces.length}`);

  // The saved place resolves, which is what puts it on the map.
  const brisaSaved = store().savedPlaces.find((p) => p.placeId === 'la-brisa');
  check('a saved place resolves to a locatable canonical record', Boolean(brisaSaved));
  const brisaPlace = places(DESTINATION).find((p) => p.id === 'la-brisa')!;
  check('the resolved record has coordinates for the map', Number.isFinite(brisaPlace.coordinates.lat));
  check('the resolved record has an area for the area filter', Boolean(brisaPlace.areaId));

  // Filters used by 我的收藏.
  const entry = { kind: 'place' as const, id: 'la-brisa', place: brisaPlace, saves: store().savedPlaces };
  check('a beach club appears under the nightlife filter', matchesSavedFilter(entry, 'nightlife'));
  check('a beach club does not appear under hotels', !matchesSavedFilter(entry, 'hotel'));
  check('every saved entry appears under 全部', SAVED_FILTERS.filter((f) => matchesSavedFilter(entry, f)).length > 0);

  // Unsaving.
  store().unsavePlace('la-brisa');
  check('unsaving removes the reference', !store().savedPlaces.some((p) => p.placeId === 'la-brisa'));
}

// ---------------------------------------------------------------------------
section('7. Manual confirmation and learned aliases');
// ---------------------------------------------------------------------------
{
  reset();
  /*
   * A controlled nickname, on purpose.
   *
   * The dataset already carries Chinese aliases, so using one would test the
   * shipped data rather than the learning mechanism. 蓝房子 matches nothing;
   * the point is that after one human confirmation it matches automatically.
   */
  const NICKNAME = '晚上去了蓝房子酒吧，氛围不错，周末人多。';
  const started = store().startImport({ text: NICKNAME, destinationId: DESTINATION });
  const id = started.import!.id;
  await store().processImport(id);
  const mention = store().mentions.find((m) => m.importId === id)!;
  check('an unknown name starts unmatched', !mention.matchedPlaceId, String(mention.matchedPlaceId));

  const target = places(DESTINATION).find((place) => place.id === 'la-brisa')!;
  check('the place the traveller means is in the dataset', Boolean(target), target?.name);

  store().resolveMentionToPlace(mention.id, target.id);
  store().updateMention(mention.id, { matchBand: 'high', matchMethod: 'manual' });
  const resolved = store().mentions.find((m) => m.id === mention.id)!;
  check('the manual resolution is recorded', resolved.matchedPlaceId === target.id);
  check('the match method records that a human did it', resolved.matchMethod === 'manual');
  check('a confirmed match is high band', resolved.matchBand === 'high');

  const alias = store().aliases.find((a) => a.placeId === target.id);
  check('confirming learns an alias', Boolean(alias), alias?.alias);
  check('the alias is owned by the profile that made it', alias?.ownerProfileId === getProfileId());

  // The next import matches instantly, with no human step.
  const again = store().startImport({ text: NICKNAME, destinationId: DESTINATION });
  const secondId = again.import!.id;
  await store().processImport(secondId);
  const second = store().mentions.find((m) => m.importId === secondId)!;
  check('the learned alias matches next time', second.matchedPlaceId === target.id, String(second.matchedPlaceId));
  check('the alias match is recorded as an alias match', second.matchMethod === 'alias', String(second.matchMethod));
}

// ---------------------------------------------------------------------------
section('8. Creating a place never touches the canonical dataset');
// ---------------------------------------------------------------------------
{
  reset();
  const before = places(DESTINATION).length;
  const submission = store().submitPlace({
    destinationId: DESTINATION,
    name: 'Warung Sari Bunga',
    recommendationType: 'restaurant',
    areaId: 'canggu',
    coordinates: { lat: -8.65, lng: 115.13 },
    note: '朋友推荐',
  });
  check('a submission is created', Boolean(submission.id));
  check('a submission starts pending verification', submission.status === 'pending_verification', submission.status);
  check('a submission is owned by the local profile', submission.ownerProfileId === getProfileId());
  check('the canonical dataset is untouched', places(DESTINATION).length === before);
  check('the created place is not in the canonical dataset', !places(DESTINATION).some((p) => p.id === submission.id));

  store().setSubmissionStatus(submission.id, 'accepted');
  check('review can accept a submission', store().submissions[0].status === 'accepted');
  store().setSubmissionStatus(submission.id, 'rejected');
  check('review can reject a submission', store().submissions[0].status === 'rejected');
}

// ---------------------------------------------------------------------------
section('9. Re-pasting the same guide does not pay twice');
// ---------------------------------------------------------------------------
{
  reset();
  const first = store().startImport({ text: CHINESE, destinationId: DESTINATION });
  await store().processImport(first.import!.id);
  const firstMentions = store().mentions.filter((m) => m.importId === first.import!.id).map((m) => m.rawPlaceName);

  const second = store().startImport({ text: CHINESE, destinationId: DESTINATION });
  await store().processImport(second.import!.id);
  const secondMentions = store().mentions.filter((m) => m.importId === second.import!.id).map((m) => m.rawPlaceName);

  check('the cached import produces the same places', firstMentions.join('|') === secondMentions.join('|'), secondMentions.join('|'));
  check('the cache is keyed on a content hash', Boolean(store().imports.find((i) => i.id === second.import!.id)!.contentHash));
  check('the two imports have different ids', first.import!.id !== second.import!.id);
  check('the cache clones rather than shares records', store().mentions.filter((m) => m.importId === second.import!.id).every((m) => m.userDecision === 'pending'));
}

// ---------------------------------------------------------------------------
section('10. Deleting an import deletes the text it held');
// ---------------------------------------------------------------------------
{
  reset();
  const started = store().startImport({ text: CHINESE, destinationId: DESTINATION });
  const id = started.import!.id;
  await store().processImport(id);
  check('the text is on the record before deletion', Boolean(store().imports.find((i) => i.id === id)!.userProvidedText));

  store().deleteImport(id);
  check('the import is gone', !store().imports.some((i) => i.id === id));
  check('its mentions are gone', !store().mentions.some((m) => m.importId === id));
  check('the held text is gone with it', !store().imports.some((i) => i.id === id && i.userProvidedText));
}

// ---------------------------------------------------------------------------
section('11. Failure states are specific, not generic');
// ---------------------------------------------------------------------------
{
  check('an empty submission is rejected', checkImportInput({})?.code === 'empty_input');
  check('an over-long URL is rejected', checkImportInput({ url: 'x'.repeat(3000) })?.code === 'url_too_long');
  check('over-long text is rejected', checkImportInput({ text: 'x'.repeat(MAX_TEXT_LENGTH + 1) })?.code === 'text_too_long');
  check('a normal paste passes', checkImportInput({ text: 'hello' }) === null);

  const now = Date.now();
  const flood = Array.from({ length: 21 }, () => now);
  check('a flood of imports is rate limited', checkImportRate(flood, now)?.code === 'too_many_imports');
  check('an old burst does not rate limit', checkImportRate(Array.from({ length: 21 }, () => now - 20 * 60 * 1000), now) === null);

  const many = Array.from({ length: 80 }, (_, i) => i);
  const capped = capMentions(many);
  check('candidate count is capped', capped.kept.length === 60 && capped.dropped === 20, JSON.stringify({ kept: capped.kept.length, dropped: capped.dropped }));

  reset();
  const empty = store().startImport({ url: 'https://www.xiaohongshu.com/explore/abc', destinationId: DESTINATION });
  const emptyResult = await store().processImport(empty.import!.id);
  check('a link with no text fails as unreadable', 'error' in emptyResult && emptyResult.error === 'content_unavailable', JSON.stringify(emptyResult));
  check('the failure is recorded on the import', store().imports.find((i) => i.id === empty.import!.id)!.status === 'failed');
  check('the failure reason is specific', store().imports.find((i) => i.id === empty.import!.id)!.failureReason === 'content_unavailable');

  const nothing = store().startImport({ text: '今天天气不错，随便走走。', destinationId: DESTINATION });
  const nothingResult = await store().processImport(nothing.import!.id);
  check('prose with no named place reports no places', 'error' in nothingResult && nothingResult.error === 'no_places_detected', JSON.stringify(nothingResult));

  const missing = await store().processImport('does-not-exist');
  check('processing an unknown import is an error, not a crash', 'error' in missing);
}

// ---------------------------------------------------------------------------
section('12. Platform detection and provenance');
// ---------------------------------------------------------------------------
{
  check('xiaohongshu is detected', detectPlatform('https://www.xiaohongshu.com/explore/x') === 'xiaohongshu');
  check('tiktok is detected', detectPlatform('https://www.tiktok.com/@a/video/1') === 'tiktok');
  check('youtube is detected', detectPlatform('https://youtu.be/abc') === 'youtube');
  check('instagram is detected', detectPlatform('https://www.instagram.com/p/abc/') === 'instagram');
  check('an unknown host is not guessed', detectPlatform('https://example.com/x') === null);
  check('no URL is not guessed', detectPlatform(undefined) === null);

  reset();
  const started = store().startImport({ text: CHINESE, destinationId: DESTINATION });
  const record = store().imports.find((i) => i.id === started.import!.id)!;
  check('pasted text with no link is recorded as user text', record.sourceAccessStatus === 'user_text', record.sourceAccessStatus);
  check('the record carries an extraction version', record.extractionVersion === 'v1', record.extractionVersion);
}

// ---------------------------------------------------------------------------
section('13. Hotels are matchable, because guides name them');
// ---------------------------------------------------------------------------
{
  const targets = allTargets.map((p) => ({ id: p.id, name: p.name, nameZh: p.nameZh, areaId: p.areaId }));
  const hotel = hotels(DESTINATION)[0];
  const result = matchPlace(hotel.name, targets, {});
  check(`a hotel name matches (${hotel.name})`, result.placeId === hotel.id, `${result.placeId} @ ${result.confidence}`);
}

console.log(`\n${'-'.repeat(60)}`);
console.log(`${passes}/${passes + failures} social import checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
assert.equal(failures, 0);
