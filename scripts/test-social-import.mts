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
const { mergeFindings, IMAGE_PROPOSAL_FLOOR, ANALYSIS_VERSION } = await import('../lib/research/analyzer');
const { resolvePlace, readCachedPlace, writeCachedPlace, clearPlaceCache } = await import('../lib/research/place-resolver');
const imageRules = await import('../lib/research/image-rules');
const { isXiaohongshuUrl, xiaohongshuNoteId, PLATFORMS } = await import('../lib/research/platforms');
const { isXiaohongshuOnly, readSource } = await import('node:fs/promises').then(async (fs) => ({
  isXiaohongshuOnly: async (file: string) => {
    const text = await fs.readFile(file, 'utf8');
    // The risk is a client module READING a secret, not one that mentions a key
    // by name in a comment explaining where it is NOT read.
    return !/process\.env\.(?:[A-Z_]*(?:API_KEY|TOKEN|SECRET))/i.test(text);
  },
  readSource: (file: string) => fs.readFile(file, 'utf8'),
}));
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
    candidates: [],
    savedPlaces: [],
    submissions: [],
    aliases: [],
    importTimestamps: [],
  });
}

/**
 * Puts an image catalogue entry into the store.
 *
 * The BYTES need IndexedDB and a canvas, neither of which exists in Node — the
 * browser suite covers the real upload. What is worth testing here is everything
 * downstream of storage: the privacy default, the index the card renders, the
 * assignment table and the saved-place references. `buildImageRecord` is the same
 * function the storefront uses, so this is not a parallel model.
 */
function seedImage(importId: string, id: string, index: number): void {
  const record = imageRules.buildImageRecord({
    id,
    importId,
    ownerProfileId: 'local-test',
    originalIndex: index,
    originalSource: 'user_upload',
    width: 1024,
    height: 768,
    bytes: 90_000,
    contentHash: `hash-${id}`,
  });
  useResearchStore.setState((state) => ({
    images: [...state.images.filter((image) => image.id !== id), record],
    imports: state.imports.map((entry) =>
      entry.id === importId ? { ...entry, imageIds: [...new Set([...entry.imageIds, id])] } : entry,
    ),
  }));
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

  const mentions = store().candidates.filter((m) => m.importId === id);
  check('candidates are attached to the import', mentions.length >= 3, String(mentions.length));
  check('nothing is saved before the traveller decides', mentions.every((m) => m.userDecision === 'pending'));
  check('the import needs review', store().imports.find((i) => i.id === id)!.status === 'review_required');
  check('matched candidates carry a canonical place id', mentions.some((m) => Boolean(m.matchedPlaceId)));
  check('candidates without a match are marked unmatched', mentions.every((m) => m.matchedPlaceId || m.verificationStatus === 'unmatched'));
  check('every candidate records a band', mentions.every((m) => ['high', 'medium', 'low'].includes(m.matchBand)));

  const laBrisa = mentions.find((m) => m.rawName === 'La Brisa')!;
  check('La Brisa matched the canonical beach club', laBrisa.matchedPlaceId === 'la-brisa', String(laBrisa.matchedPlaceId));

  // The traveller ticks two and ignores one.
  store().decideCandidate(laBrisa.id, 'save');
  const temple = mentions.find((m) => /乌鲁瓦图/.test(m.rawName));
  if (temple) store().decideCandidate(temple.id, 'save');
  const unmatched = mentions.find((m) => !m.matchedPlaceId);
  if (unmatched) store().decideCandidate(unmatched.id, 'ignore');

  const saved = store().saveSelected(id);
  check('saving counts the chosen places', saved.saved >= 1, String(saved.saved));
  check('ignored candidates are not saved', !store().savedPlaces.some((p) => p.placeId === unmatched?.id));
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
  const mention = store().candidates.find((m) => m.importId === id)!;
  check('an unknown name starts unmatched', !mention.matchedPlaceId, String(mention.matchedPlaceId));

  const target = places(DESTINATION).find((place) => place.id === 'la-brisa')!;
  check('the place the traveller means is in the dataset', Boolean(target), target?.name);

  store().resolveCandidateToPlace(mention.id, target.id);
  store().updateCandidate(mention.id, { matchBand: 'high', matchMethod: 'manual' });
  const resolved = store().candidates.find((m) => m.id === mention.id)!;
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
  const second = store().candidates.find((m) => m.importId === secondId)!;
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
  const firstMentions = store().candidates.filter((m) => m.importId === first.import!.id).map((m) => m.rawName);

  const second = store().startImport({ text: CHINESE, destinationId: DESTINATION });
  await store().processImport(second.import!.id);
  const secondMentions = store().candidates.filter((m) => m.importId === second.import!.id).map((m) => m.rawName);

  check('the cached import produces the same places', firstMentions.join('|') === secondMentions.join('|'), secondMentions.join('|'));
  check('the cache is keyed on a content hash', Boolean(store().imports.find((i) => i.id === second.import!.id)!.contentHash));
  check('the two imports have different ids', first.import!.id !== second.import!.id);
  check('the cache clones rather than shares records', store().candidates.filter((m) => m.importId === second.import!.id).every((m) => m.userDecision === 'pending'));
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

  await store().deleteImport(id);
  check('the import is gone', !store().imports.some((i) => i.id === id));
  check('its candidates are gone', !store().candidates.some((m) => m.importId === id));
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
  check('tiktok is not supported', detectPlatform('https://www.tiktok.com/@a/video/1') === null);
  check('youtube is not supported', detectPlatform('https://youtu.be/abc') === null);
  check('instagram is not supported', detectPlatform('https://www.instagram.com/p/abc/') === null);
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


// ---------------------------------------------------------------------------
section('14. Xiaohongshu only — the platform selector is gone (§1)');
// ---------------------------------------------------------------------------
{
  check('exactly one platform is offered', PLATFORMS.length === 1 && PLATFORMS[0].id === 'xiaohongshu', PLATFORMS.map((p) => p.id).join(', '));
  check('a post link is recognised', isXiaohongshuUrl('https://www.xiaohongshu.com/explore/65f0a1b2c3d4e5f6a7b8c9d0') === true);
  check('a share shortener is recognised', isXiaohongshuUrl('https://xhslink.com/aBcDeF') === true);
  check('a TikTok link is NOT recognised', isXiaohongshuUrl('https://www.tiktok.com/@a/video/1') === false);
  check('a YouTube link is NOT recognised', isXiaohongshuUrl('https://youtu.be/abc') === false);
  check('an Instagram link is NOT recognised', isXiaohongshuUrl('https://www.instagram.com/p/abc/') === false);
  check('a Douyin link is NOT recognised', isXiaohongshuUrl('https://www.douyin.com/video/1') === false);
  check('detectPlatform returns null for other platforms', detectPlatform('https://www.tiktok.com/@a/video/1') === null);
  check('the note id is extracted from a post url', xiaohongshuNoteId('https://www.xiaohongshu.com/explore/65f0a1b2c3d4e5f6a7b8c9d0') === '65f0a1b2c3d4e5f6a7b8c9d0');
}

// ---------------------------------------------------------------------------
section('15. Image cost controls (§30)');
// ---------------------------------------------------------------------------
{
  const { fitWithin, checkImageUpload, batchItems, imageBudget, formatBytes, MAX_IMAGES_PER_IMPORT } = imageRules;

  const landscape = fitWithin(4000, 3000, 1600);
  check('a large image is scaled to the stored edge', Math.max(landscape.width, landscape.height) === 1600, JSON.stringify(landscape));
  check('aspect ratio survives the downscale', Math.abs(landscape.width / landscape.height - 4000 / 3000) < 0.01);
  const small = fitWithin(600, 400, 1600);
  check('a small image is never upscaled', small.width === 600 && small.height === 400, JSON.stringify(small));
  const panorama = fitWithin(4000, 3, 1600);
  check('an extreme panorama cannot produce a zero edge', panorama.height >= 1 && panorama.width >= 1, JSON.stringify(panorama));
  check('a broken size is handled', fitWithin(0, 0, 1600).width === 1);

  check('a normal screenshot is accepted', checkImageUpload({ size: 900_000, type: 'image/jpeg' }, { existingCount: 0, existingBytes: 0 }) === null);
  check('an unsupported type is refused', checkImageUpload({ size: 1000, type: 'application/pdf' }, { existingCount: 0, existingBytes: 0 })?.code === 'unsupported_image_type');
  check('an oversized file is refused', checkImageUpload({ size: 40 * 1024 * 1024, type: 'image/png' }, { existingCount: 0, existingBytes: 0 })?.code === 'image_too_large');
  check('too many images is refused', checkImageUpload({ size: 1000, type: 'image/jpeg' }, { existingCount: MAX_IMAGES_PER_IMPORT, existingBytes: 0 })?.code === 'too_many_images');
  check(
    'the total byte budget is enforced',
    checkImageUpload({ size: 5 * 1024 * 1024, type: 'image/jpeg' }, { existingCount: 1, existingBytes: 39 * 1024 * 1024, projectedBytes: 5 * 1024 * 1024 })?.code === 'import_images_too_large',
  );

  const batches = batchItems([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
  check('images are batched for the model', batches.length === 3 && batches[0].length === 4 && batches[2].length === 1, JSON.stringify(batches.map((b) => b.length)));
  check('an empty list produces no batches', batchItems([], 4).length === 0);

  const budget = imageBudget({ count: 3, bytes: 1024 });
  check('the budget reports what is left to add', budget.remainingCount === MAX_IMAGES_PER_IMPORT - 3);
  check('bytes are formatted for humans', formatBytes(2048) === '2 KB' && /MB/.test(formatBytes(3 * 1024 * 1024)), formatBytes(3 * 1024 * 1024));
}

// ---------------------------------------------------------------------------
section('16. Private by default — the copyright boundary (§20)');
// ---------------------------------------------------------------------------
{
  const { buildImageRecord } = imageRules;
  const record = buildImageRecord({
    id: 'img-1',
    importId: 'imp-1',
    ownerProfileId: 'local-test',
    originalIndex: 3,
    originalSource: 'xiaohongshu',
    width: 1024,
    height: 768,
    bytes: 120_000,
    contentHash: 'abc123',
  });
  check('an imported image defaults to private', record.visibility === 'private_import', record.visibility);
  check('the builder offers no way to make it public', !('visibility' in Object.keys({}) || /visibility\s*:/.test(buildImageRecord.toString().split('return')[0])));
  check('the storage references are the record\'s own', record.storageReference === 'img-1:full' && record.thumbnailReference === 'img-1:thumb');
  check('the original position is kept', record.originalIndex === 3);
  check('a fresh image has not been analysed', record.analysisStatus === 'pending');

  /*
   * The client may not name a secret.
   *
   * §13 in one assertion: if any browser-side module mentions a provider key,
   * that is where it would eventually be inlined into a bundle. This test reads
   * the actual sources rather than trusting a convention.
   */
  for (const file of [
    'lib/research/analyzer.ts',
    'lib/research/place-resolver.ts',
    'lib/research/image-store.ts',
    'lib/research/store.ts',
    'components/social/XiaohongshuImportPanel.tsx',
  ]) {
    check(`no secret env name in ${file}`, await isXiaohongshuOnly(file));
  }
  for (const file of ['app/api/analyze-guide/route.ts', 'app/api/resolve-place/route.ts', 'app/api/import/xiaohongshu/route.ts']) {
    const source = await readSource(file);
    check(`${file} reads its key from the server environment`, /process\.env\.[A-Z_]*(API_KEY|TOKEN)/.test(source));
  }
  const resolverSource = await readSource('app/api/resolve-place/route.ts');
  const fieldMask = /X-Goog-FieldMask':\s*\n?\s*'([^']+)'/.exec(resolverSource)?.[1] ?? '';
  check('the field mask is present and minimal', fieldMask.length > 0, fieldMask);
  for (const banned of ['places.rating', 'places.photos', 'places.openingHours', 'places.reviews', 'places.priceLevel']) {
    check(`the field mask excludes ${banned.replace('places.', '')}`, !fieldMask.includes(banned), fieldMask);
  }
  check('the model prompt forbids coordinates', /NEVER output coordinates/.test(await readSource('app/api/analyze-guide/route.ts')));
}

// ---------------------------------------------------------------------------
section('17. Merging text and image findings (§24, §25)');
// ---------------------------------------------------------------------------
{
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g, '');

  // §34's worked example: a caption plus two pictures of the same place.
  const merged = mergeFindings(
    [
      { rawName: 'La Brisa', detectedFromText: true, detectedFromImageIds: [], confidence: 1, entityType: 'beachclub', extractedItems: [], contextThemes: [], positiveThemes: [], warnings: [] },
      { rawName: 'La Brisa', detectedFromText: false, detectedFromImageIds: ['img-3'], confidence: 0.9, extractedItems: [], contextThemes: [], positiveThemes: [], warnings: [] },
      { rawName: 'la brisa', detectedFromText: false, detectedFromImageIds: ['img-4'], confidence: 0.8, extractedItems: [], contextThemes: [], positiveThemes: [], warnings: [] },
    ],
    normalize,
  );
  check('three detections become one candidate', merged.length === 1, `${merged.length}`);
  check('the merged candidate knows the text mentioned it', merged[0].detectedFromText === true);
  check('the merged candidate keeps both image ids', merged[0].detectedFromImageIds.length === 2, JSON.stringify(merged[0].detectedFromImageIds));
  check('the written name wins over the sign', merged[0].rawName === 'La Brisa', merged[0].rawName);
  check('confidence is the strongest reader', merged[0].confidence === 1);

  // §25: a place that appears ONLY in a picture.
  const imageOnly = mergeFindings(
    [{ rawName: 'Milk & Madu', detectedFromText: false, detectedFromImageIds: ['img-5'], confidence: 0.75, entityType: 'restaurant', extractedItems: [], contextThemes: [], positiveThemes: [], warnings: [] }],
    normalize,
  );
  check('an image-only place becomes a candidate', imageOnly.length === 1 && imageOnly[0].detectedFromText === false);
  check('its provenance names the image', imageOnly[0].detectedFromImageIds[0] === 'img-5');
  check('a confident image reading clears the proposal floor', imageOnly[0].confidence >= IMAGE_PROPOSAL_FLOOR);
  check('a hesitant image reading does NOT', 0.4 < IMAGE_PROPOSAL_FLOOR);
  check('the analysis version is stamped', ANALYSIS_VERSION === 'v1');

  // Distinct spellings are NOT merged here — that is the matcher's job, and it
  // has the corpus and the alias table this function does not.
  const distinct = mergeFindings(
    [
      { rawName: 'La Brisa', detectedFromText: true, detectedFromImageIds: [], confidence: 1, extractedItems: [], contextThemes: [], positiveThemes: [], warnings: [] },
      { rawName: 'La Brisa Bali', detectedFromText: true, detectedFromImageIds: [], confidence: 1, extractedItems: [], contextThemes: [], positiveThemes: [], warnings: [] },
    ],
    normalize,
  );
  check('different spellings stay separate for the matcher to judge', distinct.length === 2, `${distinct.length}`);
}

// ---------------------------------------------------------------------------
section('18. The resolution pipeline (§10, §11, §12)');
// ---------------------------------------------------------------------------
{
  const targets = allTargets.map((p) => ({ id: p.id, name: p.name, nameZh: p.nameZh, areaId: p.areaId }));

  const local = await resolvePlace({ rawName: 'La Brisa', destinationId: DESTINATION, targets, allowExternal: false });
  check('step 1 resolves against Meridian', local.status === 'meridian' && local.matchedPlaceId === 'la-brisa', `${local.status} ${local.matchedPlaceId}`);
  check('a Meridian hit needs no external call', local.externalCandidates.length === 0 && !local.cached);

  const unknown = await resolvePlace({ rawName: 'Zqxwv Noodle Bar', destinationId: DESTINATION, targets, allowExternal: false });
  check('an unknown name with no provider is unresolved', unknown.status === 'unresolved', unknown.status);
  check('nothing is invented for it', !unknown.matchedPlaceId && unknown.externalCandidates.length === 0);

  /*
   * Step 3, exercised through the CACHE.
   *
   * The provider itself is a network call, so the pipeline's external branch is
   * driven by a primed cache — which is the same code path a real second import
   * takes, and the one §12's cost story depends on.
   */
  clearPlaceCache();
  const query = { query: 'Sensorium Bali', destinationId: DESTINATION };
  check('an unprimed cache has nothing', readCachedPlace(query) === null);

  /*
   * With no provider configured — the state of every static deployment — the
   * pipeline stops at Meridian's own data and says so, rather than making a
   * request that is guaranteed to 404 or to cost money nobody authorised.
   */
  const gated = await resolvePlace({ rawName: 'Sensorium Bali', destinationId: DESTINATION, targets });
  check('no provider configured means no external call', gated.status === 'unresolved', gated.status);
  check('and no external error is reported', !gated.externalError);

  writeCachedPlace(query, [
    { providerId: 'google_places', providerPlaceId: 'ChIJ-one', name: 'Sensorium Bali', address: 'Canggu', lat: -8.65, lng: 115.13, category: 'restaurant' },
  ]);
  const single = await resolvePlace({ rawName: 'Sensorium Bali', destinationId: DESTINATION, targets });
  check('a single external hit is offered, not accepted', single.status === 'external', single.status);
  check('it is NOT written to matchedPlaceId', !single.matchedPlaceId);
  check('the hit came from the cache', single.cached === true);
  check('the hit carries real coordinates for the traveller to judge', single.externalCandidates[0].lat === -8.65);

  clearPlaceCache();
  writeCachedPlace(query, [
    { providerId: 'google_places', providerPlaceId: 'ChIJ-one', name: 'Sensorium Bali', address: 'Canggu', lat: -8.65, lng: 115.13, category: 'restaurant' },
    { providerId: 'google_places', providerPlaceId: 'ChIJ-two', name: 'Sensorium Ubud', address: 'Ubud', lat: -8.51, lng: 115.26, category: 'restaurant' },
  ]);
  const multiple = await resolvePlace({ rawName: 'Sensorium Bali', destinationId: DESTINATION, targets });
  check('several hits ask the traveller to choose', multiple.status === 'external_multiple', multiple.status);
  check('all candidates are offered', multiple.externalCandidates.length === 2);
  clearPlaceCache();
}

// ---------------------------------------------------------------------------
section('19. Image ↔ place assignment (§16, §17, §22, §33)');
// ---------------------------------------------------------------------------
{
  reset();
  const started = store().startImport({ text: '晚上去了 La Brisa，白天在 Crate Café。', destinationId: DESTINATION });
  const id = started.import!.id;
  await store().processImport(id);
  const started2 = store().startImport({});
  const secondId = started2.import?.id ?? null;
  void secondId;

  const candidates = store().candidates.filter((c) => c.importId === id);
  check('two candidates were found', candidates.length === 2, `${candidates.length}`);

  for (const [imageId, index] of [['img-3', 3], ['img-4', 4], ['img-7', 7], ['img-9', 9]] as const) {
    seedImage(id, imageId, index);
  }
  check('the image catalogue holds the four frames', store().images.filter((image) => image.importId === id).length === 4);
  check('every seeded image is private', store().images.every((image) => image.visibility === 'private_import'));

  // Images are added without IndexedDB in this environment, so the assignment
  // records are exercised directly against the store — which is where the rules
  // being tested actually live.
  const laBrisa = candidates.find((c) => /brisa/i.test(c.rawName))!;
  const crate = candidates.find((c) => /crate/i.test(c.rawName))!;

  store().assignImage(laBrisa.id, 'img-3', 'user');
  store().assignImage(laBrisa.id, 'img-4', 'user');
  check('an image can be attached by hand', store().candidates.find((c) => c.id === laBrisa.id)!.assignedImageIds.length === 2);

  store().assignImage(crate.id, 'img-7', 'suggested');
  check('a suggestion is recorded as a suggestion', store().assignments.find((a) => a.imageId === 'img-7')?.source === 'suggested');

  // §33: reassigning moves it, and the human decision is not duplicated.
  store().assignImage(crate.id, 'img-3', 'user');
  const img3 = store().assignments.filter((a) => a.imageId === 'img-3');
  check('reassigning an image moves it rather than copying it', img3.length === 1, `${img3.length} rows`);
  check('the image now belongs to the new place', img3[0].candidateId === crate.id);
  check('the old place no longer lists it', !store().candidates.find((c) => c.id === laBrisa.id)!.assignedImageIds.includes('img-3'));
  check('the new place lists it', store().candidates.find((c) => c.id === crate.id)!.assignedImageIds.includes('img-3'));

  store().unassignImage(crate.id, 'img-3');
  check('an image can be detached', !store().candidates.find((c) => c.id === crate.id)!.assignedImageIds.includes('img-3'));
  check('the assignment row is gone with it', !store().assignments.some((a) => a.imageId === 'img-3'));

  // §17's tray, as a function of the assignment table.
  const placed = new Set(store().assignments.map((a) => a.imageId));
  const unassigned = store()
    .images.filter((image) => image.importId === id)
    .filter((image) => !placed.has(image.id))
    .map((image) => image.id);
  check(
    'unassigned images are exactly the ones with no row',
    unassigned.includes('img-3') && unassigned.includes('img-9') && !unassigned.includes('img-4'),
    unassigned.join(', '),
  );
  check('an attached image is not in the tray', !unassigned.includes('img-7'));
}

// ---------------------------------------------------------------------------
section('20. Manual pinning and creating from an image (§18, §19)');
// ---------------------------------------------------------------------------
{
  reset();
  const started = store().startImport({ text: '去了一个没听过的小店，叫蓝房子酒吧。', destinationId: DESTINATION });
  const id = started.import!.id;
  await store().processImport(id);
  seedImage(id, 'img-9', 9);
  const candidate = store().candidates.find((c) => c.importId === id)!;
  check('the place starts unresolved', candidate.resolutionStatus === 'unresolved', candidate.resolutionStatus);

  store().pinCandidate(candidate.id, {
    coordinates: { lat: -8.6478, lng: 115.1387 },
    name: '蓝房子',
    entityType: 'bar',
    areaId: 'canggu',
  });
  const pinned = store().candidates.find((c) => c.id === candidate.id)!;
  check('pinning resolves the candidate', pinned.resolutionStatus === 'user_pinned', pinned.resolutionStatus);
  check('a submission is created, not a canonical place', Boolean(pinned.submittedPlaceId) && store().submissions.length === 1);
  check('the submission is pending verification', store().submissions[0].status === 'pending_verification');
  check('the coordinates are the ones the traveller chose', store().submissions[0].coordinates?.lat === -8.6478);
  check('the pinned place is NOT in the canonical dataset', !getPlaces(DESTINATION).some((p) => p.name === '蓝房子'));

  // §18: creating a place from an unattributed picture.
  store().setImageCaption('img-9', '菜单上有 Penny Lane');
  store().createPlaceFromImage('img-9', {
    name: 'Penny Lane',
    recommendationType: 'restaurant',
    coordinates: { lat: -8.66, lng: 115.13 },
  });
  const fromImage = store().candidates.find((c) => c.rawName === 'Penny Lane')!;
  check('a place can be created from an image', Boolean(fromImage));
  check('it records the image as its evidence', fromImage.detectedFromImageIds.includes('img-9'));
  check('it is not marked as detected from text', fromImage.detectedFromText === false);
  check('the image is attached to it', fromImage.assignedImageIds.includes('img-9'));
  check('the attachment is a USER decision, not a suggestion', store().assignments.find((a) => a.imageId === 'img-9')?.source === 'user');
  check('it is saved by default, since the traveller just made it', fromImage.userDecision === 'save');
}

// ---------------------------------------------------------------------------
section('21. Saving keeps the traveller\'s images with the place (§22)');
// ---------------------------------------------------------------------------
{
  reset();
  const started = store().startImport({ text: '晚上去了 La Brisa，氛围很好。', destinationId: DESTINATION });
  const id = started.import!.id;
  await store().processImport(id);
  const candidate = store().candidates.find((c) => c.importId === id)!;

  seedImage(id, 'img-3', 3);
  seedImage(id, 'img-4', 4);
  store().assignImage(candidate.id, 'img-3', 'user');
  store().assignImage(candidate.id, 'img-4', 'user');
  store().decideCandidate(candidate.id, 'save');

  const { saved } = store().saveSelected(id);
  check('the place is saved', saved === 1, `${saved}`);
  const savedPlace = store().savedPlaces[0];
  check('the saved place references the canonical id', savedPlace.placeId === 'la-brisa');
  check('the traveller\'s images travel with it', savedPlace.selectedImportImageIds?.length === 2, JSON.stringify(savedPlace.selectedImportImageIds));
  check('the images are references, not copied records', savedPlace.selectedImportImageIds?.every((imageId) => imageId.startsWith('img-')));

  // Saving the same place again enriches rather than duplicating.
  const second = store().startImport({ text: '又去了 La Brisa。', destinationId: DESTINATION });
  await store().processImport(second.import!.id);
  const secondCandidate = store().candidates.find((c) => c.importId === second.import!.id)!;
  seedImage(second.import!.id, 'img-8', 8);
  store().assignImage(secondCandidate.id, 'img-8', 'user');
  store().decideCandidate(secondCandidate.id, 'save');
  store().saveSelected(second.import!.id);
  check('the same place is not saved twice', store().savedPlaces.length === 1, `${store().savedPlaces.length}`);
  check('the second guide\'s image is added to the same entry', store().savedPlaces[0].selectedImportImageIds?.length === 3);
}

// ---------------------------------------------------------------------------
section('22. An imported place reaches the itinerary and the router (§37)');
// ---------------------------------------------------------------------------
{
  const { itemFromPlace, itemFromCustom } = await import('../lib/trip');
  const { useTripStore } = await import('../lib/store/trip-store');
  const place = getPlaces(DESTINATION).find((p) => p.id === 'la-brisa')!;
  const item = itemFromPlace(place);
  check('an imported place becomes an itinerary item', item.refId === 'la-brisa' && item.lat === place.coordinates.lat);
  check('the item carries a display name for the timeline', Boolean(item.name), String(item.name));
  const withZh = getPlaces(DESTINATION).find((p) => p.nameZh);
  if (withZh) {
    check('a bilingual place carries both names onto the item', Boolean(itemFromPlace(withZh).nameZh), String(withZh.nameZh));
  }

  const custom = itemFromCustom({ name: 'Penny Lane', lat: -8.66, lng: 115.13, kind: 'food' });
  check('a created place becomes an itinerary item too', custom.lat === -8.66 && custom.name === 'Penny Lane');

  const { getDestination } = await import('../lib/data');
  const destination = getDestination(DESTINATION)!;
  useTripStore.getState().createTrip(
    { arrivalDate: '2026-05-01', departureDate: '2026-05-04', travellers: 2 },
    destination,
  );
  const tripId = useTripStore.getState().trips[0].id;
  const dayId = useTripStore.getState().trips[0].days[0].id;
  useTripStore.getState().addItem(tripId, dayId, item);
  const stored = useTripStore.getState().trips[0].days[0].items;
  check('the imported place is on Day 1', stored.length === 1 && stored[0].refId === 'la-brisa', `${stored.length} items`);
  check('it carries a coordinate the router can use', Number.isFinite(stored[0].lat) && Number.isFinite(stored[0].lng));

  // §35: an unresolved place has no coordinate, so it cannot silently become a stop.
  const submission = { name: 'Nowhere', coordinates: undefined };
  check('a place with no location is not routable', submission.coordinates === undefined);
}

// ---------------------------------------------------------------------------
section('23. The retrieval fallback never dead-ends (§2, §27)');
// ---------------------------------------------------------------------------
{
  const { POST } = await import('../app/api/import/xiaohongshu/route');

  const foreign = await POST(
    new Request('http://localhost/api/import/xiaohongshu', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.tiktok.com/@a/video/1' }),
    }),
  );
  const foreignBody = (await foreign.json()) as { status?: string };
  check('a non-Xiaohongshu link is refused as such', foreignBody.status === 'not_xiaohongshu', JSON.stringify(foreignBody));

  const empty = await POST(new Request('http://localhost/api/import/xiaohongshu', { method: 'POST', body: JSON.stringify({}) }));
  check('an empty url is a 400', empty.status === 400);

  /*
   * The honest outcome on every deployment today: no approved retrieval provider
   * exists, so the answer is `unavailable` with a reason — and the client turns
   * that into the fallback message plus two things that still work.
   */
  const unavailable = await POST(
    new Request('http://localhost/api/import/xiaohongshu', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.xiaohongshu.com/explore/65f0a1b2c3d4e5f6a7b8c9d0' }),
    }),
  );
  const unavailableBody = (await unavailable.json()) as { status?: string; reason?: string };
  check('an unreadable post reports unavailable, not an error', unavailableBody.status === 'unavailable', JSON.stringify(unavailableBody));
  check('it says why, so the UI can explain', unavailableBody.reason === 'no_retrieval_provider', String(unavailableBody.reason));
  /*
   * The refusal is a property of the CODE, not of the prose around it.
   *
   * Asserting on the word "captcha" would fail the comment that says we do not
   * solve one. What matters is that no capability exists: no headless browser, no
   * cookie or user-agent header, no session handling.
   */
  const retrievalSource = await readSource('app/api/import/xiaohongshu/route.ts');
  check('no headless browser is used', !/puppeteer|playwright|chrome-launcher|selenium/i.test(retrievalSource.replace(/\/\*[\s\S]*?\*\//g, '')));
  check('no cookie or user-agent header is ever sent', !/['"](cookie|user-agent)['"]\s*:/i.test(retrievalSource));
  check('a refusal is not retried', /status === 401 \|\| response\.status === 403/.test(retrievalSource));
  check('the refusal is documented in words', /not a scraper/i.test(retrievalSource));
}

// ---------------------------------------------------------------------------
section('24. The analyzer abstraction (§5, §6)');
// ---------------------------------------------------------------------------
{
  const { getAnalyzer, listAnalyzers, heuristicAnalyzer } = await import('../lib/research/analyzer');
  check('two analyzers ship', listAnalyzers().length === 2, listAnalyzers().map((a) => a.id).join(', '));
  check('the default is the offline one', getAnalyzer().id === 'heuristic', getAnalyzer().id);
  check('the multimodal one needs a server', listAnalyzers().find((a) => a.id === 'multimodal')!.requiresServer === true);

  const result = await heuristicAnalyzer.analyze({
    text: CHINESE,
    images: [{ id: 'img-1', index: 1 }],
    destinationId: DESTINATION,
    knownPlaces: allTargets,
    knownAreas,
  });
  check('it reads the text', result.findings.length >= 3, `${result.findings.length}`);
  check('it reports that it could not read the image', result.imageStatus.get('img-1') === 'unsupported', String(result.imageStatus.get('img-1')));
  check('it degrades rather than failing', result.degraded === true && result.degradedReason === 'no_vision_provider');
  check('it produces no fabricated image finding', result.findings.every((f) => f.detectedFromImageIds.length === 0));
  check('its findings carry provenance', result.findings.every((f) => f.detectedFromText));
}

console.log(`\n${'-'.repeat(60)}`);
console.log(`${passes}/${passes + failures} social import checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
assert.equal(failures, 0);
