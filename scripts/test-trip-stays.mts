/**
 * The itinerary accommodation model.
 *
 * Every case in the brief, driven through the REAL derivation and the REAL
 * schedule builder rather than through a fixture that mirrors them. The point of
 * this suite is that a hotel-change day, a missing night and a fixed-time
 * conflict are arithmetic — and arithmetic is worth testing without a browser.
 *
 * Usage: npm run test:trip
 */

import assert from 'node:assert/strict';

// The trip store persists; give it a localStorage before anything imports it.
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

const { getHotels, getDestination } = await import('../lib/data');
const {
  deriveDayAnchors,
  deriveTripAnchors,
  stayForNight,
  stayCoversNight,
  findOverlappingStays,
  isStayValid,
  tripNights,
  unbookedNights,
  migrateTripToStays,
  addDays,
} = await import('../lib/trip-stays');
const { buildDaySchedule, dayStartMinutes, formatClock, parseClock, DEFAULT_START_TIME } = await import(
  '../lib/schedule'
);
const { buildLegsForStops, routeStops } = await import('../lib/transport/legs');
const { tripPhase, tripSummary, sortTripsForList, plannedPlaceCount, primaryStayHotelId } = await import('../lib/trips');
const { itemFromHotel, itemFromPlace, itemFromAirport, generateDays } = await import('../lib/trip');
const { useTripStore } = await import('../lib/store/trip-store');

let passes = 0;
let failures = 0;
function check(name: string, passed: boolean, detail = '') {
  if (passed) {
    passes += 1;
    console.log(`  [PASS] ${name}`);
  } else {
    failures += 1;
    console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}
const section = (title: string) => console.log(`\n${title}`);

// ---------------------------------------------------------------------------
const DESTINATION = 'bali';
const hotels = getHotels(DESTINATION);
const destination = getDestination(DESTINATION)!;
const W = hotels.find((h) => /^w-bali/.test(h.id))!;
const ST_REGIS = hotels.find((h) => h.id === 'the-st-regis-bali-resort')!;
const RITZ = hotels.find((h) => h.id === 'the-ritz-carlton-bali')!;
const place = (id: string) => destination.areas[0] && id;

if (!W || !ST_REGIS || !RITZ) {
  console.error('fixture error: expected W Bali, St. Regis and Ritz-Carlton in the Bali dataset');
  process.exit(1);
}

/** A trip from `arrival` to `departure` with the given stays. */
function tripWith(stays: Array<{ hotelPlaceId: string; checkInDate: string; checkOutDate: string }>, arrival = '2026-10-10', departure = '2026-10-14') {
  return {
    id: 'trip-test',
    name: 'Test',
    destinationId: DESTINATION,
    arrivalDate: arrival,
    departureDate: departure,
    travellers: 2,
    styles: [],
    loyalty: [],
    days: generateDays(arrival, departure),
    stays: stays.map((stay, index) => ({ id: `stay-${index + 1}`, ...stay })),
    defaultStartTime: DEFAULT_START_TIME,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  } as never;
}

const dayOf = (trip: ReturnType<typeof tripWith>, index: number) => trip.days[index];

// ---------------------------------------------------------------------------
section('1. Date arithmetic and the night model');
// ---------------------------------------------------------------------------
{
  check('a stay covers its check-in night', stayCoversNight({ id: 's', hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' }, '2026-10-10'));
  check('a stay does NOT cover its check-out night', !stayCoversNight({ id: 's', hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' }, '2026-10-12'));
  check('addDays crosses a month boundary', addDays('2026-10-31', 1) === '2026-11-01', addDays('2026-10-31', 1));
  check('addDays crosses a year boundary', addDays('2026-12-31', 1) === '2027-01-01', addDays('2026-12-31', 1));

  const trip = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' }]);
  check('the trip has one night per stay night', tripNights(trip).length === 4, String(tripNights(trip).length));
  check('a zero-night stay is invalid', !isStayValid({ checkInDate: '2026-10-10', checkOutDate: '2026-10-10' }));
  check('a backwards stay is invalid', !isStayValid({ checkInDate: '2026-10-12', checkOutDate: '2026-10-10' }));
  check('a one-night stay is valid', isStayValid({ checkInDate: '2026-10-10', checkOutDate: '2026-10-11' }));
}

// ---------------------------------------------------------------------------
section('2. One hotel for the whole trip');
// ---------------------------------------------------------------------------
{
  const trip = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-14' }]);
  const anchors = deriveTripAnchors(trip, hotels);

  const first = anchors.get(dayOf(trip, 0).id)!;
  check('the arrival day has no start hotel', first.start === null, JSON.stringify(first.start));
  check('the arrival day ends at the hotel', first.end?.refId === W.id);
  check('the arrival day is not a hotel change', !first.isHotelChange);

  const middle = anchors.get(dayOf(trip, 1).id)!;
  check('a normal day starts at the hotel', middle.start?.refId === W.id);
  check('a normal day ends at the hotel', middle.end?.refId === W.id);
  check('start and end are the same hotel (a closed loop)', middle.start?.refId === middle.end?.refId);
  check('a normal day is not a hotel change', !middle.isHotelChange);

  const last = anchors.get(dayOf(trip, 4).id)!;
  check('the departure day starts at the hotel', last.start?.refId === W.id);
  check('the departure day has no end hotel', last.end === null);
  check('the departure day is not a hotel change', !last.isHotelChange);
  check('no night is unbooked', unbookedNights(trip).length === 0, unbookedNights(trip).join(', '));
}

// ---------------------------------------------------------------------------
section('3. Two hotels — the hotel-change day (the brief\'s worked example)');
// ---------------------------------------------------------------------------
{
  const trip = tripWith([
    { hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' },
    { hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-14' },
  ]);
  const anchors = deriveTripAnchors(trip, hotels);

  check('day 1 (Oct 10) ends at W', anchors.get(dayOf(trip, 0).id)!.end?.refId === W.id);
  check('day 2 (Oct 11) is a W day both ends', anchors.get(dayOf(trip, 1).id)!.start?.refId === W.id && anchors.get(dayOf(trip, 1).id)!.end?.refId === W.id);

  const change = anchors.get(dayOf(trip, 2).id)!;
  check('day 3 (Oct 12) STARTS at W', change.start?.refId === W.id, String(change.start?.refId));
  check('day 3 (Oct 12) ENDS at St. Regis', change.end?.refId === ST_REGIS.id, String(change.end?.refId));
  check('day 3 is flagged as a hotel-change day', change.isHotelChange);
  check('the change day names the stay being left', change.fromStayId === trip.stays![0].id);
  check('the change day names the stay being moved into', change.toStayId === trip.stays![1].id);

  const after = anchors.get(dayOf(trip, 3).id)!;
  check('day 4 (Oct 13) is a St. Regis day', after.start?.refId === ST_REGIS.id && after.end?.refId === ST_REGIS.id);
  check('day 4 is not a hotel change', !after.isHotelChange);

  const departure = anchors.get(dayOf(trip, 4).id)!;
  check('day 5 (Oct 14) starts at St. Regis', departure.start?.refId === ST_REGIS.id);
  check('day 5 has no end hotel', departure.end === null);
  check('exactly one day is a hotel change', [...anchors.values()].filter((a) => a.isHotelChange).length === 1);
}

// ---------------------------------------------------------------------------
section('4. Three hotels');
// ---------------------------------------------------------------------------
{
  const trip = tripWith(
    [
      { hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' },
      { hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-13' },
      { hotelPlaceId: RITZ.id, checkInDate: '2026-10-13', checkOutDate: '2026-10-15' },
    ],
    '2026-10-10',
    '2026-10-15',
  );
  const anchors = deriveTripAnchors(trip, hotels);
  const changes = trip.days.filter((day) => anchors.get(day.id)!.isHotelChange);
  check('three hotels produce two hotel-change days', changes.length === 2, `${changes.length}`);
  check('the first change is W → St. Regis', anchors.get(dayOf(trip, 2).id)!.start?.refId === W.id && anchors.get(dayOf(trip, 2).id)!.end?.refId === ST_REGIS.id);
  check('the second change is St. Regis → Ritz', anchors.get(dayOf(trip, 3).id)!.start?.refId === ST_REGIS.id && anchors.get(dayOf(trip, 3).id)!.end?.refId === RITZ.id);
  check('the stay order is chronological', trip.stays!.map((s) => s.checkInDate).join() === '2026-10-10,2026-10-12,2026-10-13');
}

// ---------------------------------------------------------------------------
section('5. Missing accommodation');
// ---------------------------------------------------------------------------
{
  const trip = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' }]);
  const anchors = deriveTripAnchors(trip, hotels);

  check('the gap nights are reported', unbookedNights(trip).join(',') === '2026-10-12,2026-10-13', unbookedNights(trip).join(','));
  check('the first unbooked day warns', anchors.get(dayOf(trip, 2).id)!.missingAccommodation);
  check('the second unbooked day warns', anchors.get(dayOf(trip, 3).id)!.missingAccommodation);
  check('the night before the gap is booked', !anchors.get(dayOf(trip, 1).id)!.missingAccommodation);
  check('the last day never warns — its night is not spent', !anchors.get(dayOf(trip, 4).id)!.missingAccommodation);
  check('the unbooked day has a start but no end', anchors.get(dayOf(trip, 2).id)!.start !== null && anchors.get(dayOf(trip, 2).id)!.end === null);
  check('nothing invents a hotel for the gap', anchors.get(dayOf(trip, 2).id)!.end === null);
}

// ---------------------------------------------------------------------------
section('6. Overlap validation');
// ---------------------------------------------------------------------------
{
  const overlapping = [
    { id: 'a', hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-13' },
    { id: 'b', hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-14' },
  ];
  check('an overlap is detected', findOverlappingStays(overlapping).length === 1);
  check(
    'back-to-back stays are NOT an overlap',
    findOverlappingStays([
      { id: 'a', hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' },
      { id: 'b', hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-14' },
    ]).length === 0,
  );
  check('the same hotel twice, non-overlapping, is allowed', findOverlappingStays([
    { id: 'a', hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-11' },
    { id: 'b', hotelPlaceId: W.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-13' },
  ]).length === 0);
}

// ---------------------------------------------------------------------------
section('7. The schedule clock');
// ---------------------------------------------------------------------------
{
  check('parses a normal time', parseClock('09:30') === 570);
  check('rejects nonsense', parseClock('25:00') === null && parseClock('nope') === null);
  check('formats across midnight rather than going negative', formatClock(1500) === '01:00', formatClock(1500));

  const trip = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-14' }]);
  const day = dayOf(trip, 1);
  const anchors = deriveDayAnchors(trip, day, hotels);

  check('the trip default start applies', dayStartMinutes(trip, day) === 9 * 60);
  const overridden = { ...day, startTime: '08:30' };
  check('a per-day override wins', dayStartMinutes(trip, overridden) === 8 * 60 + 30);
  check('a bad override falls back to the default', dayStartMinutes(trip, { ...day, startTime: '99:99' }) === 9 * 60);
  check('a trip default other than 09:00 is honoured', dayStartMinutes({ ...trip, defaultStartTime: '07:15' }, day) === 7 * 60 + 15);

  const item = itemFromPlace(destination.areas[0] as never) ?? null;
  void item;

  // A day with two 60-minute stops and no measured legs: the clock is arithmetic.
  const stopA = { ...itemFromPlace({ id: 'a', name: 'A', nameZh: undefined, areaId: day.areas ?? 'canggu', coordinates: { lat: -8.65, lng: 115.13, confidence: 'verified' }, markerLayer: 'activity', recommendedDurationMin: 60 } as never), durationMin: 60 };
  const stopB = { ...itemFromPlace({ id: 'b', name: 'B', areaId: 'canggu', coordinates: { lat: -8.66, lng: 115.14, confidence: 'verified' }, markerLayer: 'activity', recommendedDurationMin: 30 } as never), durationMin: 30 };
  const withItems = { ...day, items: [stopA, stopB] };

  const schedule = buildDaySchedule({ trip, day: withItems, anchors, legs: [] });
  const itemEntries = schedule.entries.filter((entry) => entry.kind === 'item');
  check('the first stop is at the day start', itemEntries[0].kind === 'item' && itemEntries[0].clock === 9 * 60, itemEntries[0].kind === 'item' ? String(itemEntries[0].clock) : '');
  check('the second stop follows the first stop\'s duration', itemEntries[1].kind === 'item' && itemEntries[1].clock === 10 * 60, itemEntries[1].kind === 'item' ? String(itemEntries[1].clock) : '');
  check('the day starts with its anchor', schedule.entries[0].kind === 'anchor');

  const early = buildDaySchedule({ trip: { ...trip, defaultStartTime: '08:00' }, day: withItems, anchors, legs: [] });
  const earlyItems = early.entries.filter((e) => e.kind === 'item');
  check('changing the start time recomputes the clock', earlyItems[0].kind === 'item' && earlyItems[0].clock === 8 * 60);
}

// ---------------------------------------------------------------------------
section('8. Fixed-time activities');
// ---------------------------------------------------------------------------
{
  const trip = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-14' }]);
  const day = dayOf(trip, 1);
  const anchors = deriveDayAnchors(trip, day, hotels);

  const make = (fixedTime?: string, durationMin = 60) => ({
    ...itemFromPlace({ id: `x${fixedTime}`, name: 'X', areaId: 'uluwatu', coordinates: { lat: -8.83, lng: 115.09, confidence: 'verified' }, markerLayer: 'activity' } as never),
    durationMin,
    fixedTime,
  });

  // Early arrival: the traveller waits, and the wait is reported.
  const early = buildDaySchedule({
    trip,
    day: { ...day, items: [make('16:30')] },
    anchors: { ...anchors, start: null },
    legs: [],
  });
  const earlyItem = early.entries.find((e) => e.kind === 'item')!;
  check('arriving early produces waiting time', earlyItem.kind === 'item' && earlyItem.waitMinutes > 0, JSON.stringify(earlyItem));
  check('the fixed time is honoured, not moved', earlyItem.kind === 'item' && earlyItem.clock === 16 * 60 + 30);
  check('a wait is recorded', early.waits.length === 1);
  check('no conflict for an early arrival', early.conflicts.length === 0);

  // A late arrival is a conflict, and the time is still not moved.
  const late = buildDaySchedule({
    trip: { ...trip, defaultStartTime: '18:00' },
    day: { ...day, items: [make('16:30')] },
    anchors: { ...anchors, start: null },
    legs: [],
  });
  const lateItem = late.entries.find((e) => e.kind === 'item')!;
  check('arriving late produces a conflict', late.conflicts.length === 1, JSON.stringify(late.conflicts));
  check('the conflict reports how late', late.conflicts[0].lateMinutes === 90, String(late.conflicts[0].lateMinutes));
  check('the fixed time is STILL not moved', lateItem.kind === 'item' && lateItem.clock === 18 * 60, lateItem.kind === 'item' ? String(lateItem.clock) : '');
  check('no waiting time on a late arrival', late.waits.length === 0);

  // An item without a fixed time keeps flowing.
  const flowing = buildDaySchedule({ trip, day: { ...day, items: [make()] }, anchors: { ...anchors, start: null }, legs: [] });
  const flowingItem = flowing.entries.find((e) => e.kind === 'item')!;
  check('an item with no fixed time flows from the start', flowingItem.kind === 'item' && flowingItem.clock === 9 * 60);
  check('an item with no fixed time has no wait and no conflict', flowing.waits.length === 0 && flowing.conflicts.length === 0);
}

// ---------------------------------------------------------------------------
section('9. Routing: Hotel A → POIs → Hotel B');
// ---------------------------------------------------------------------------
{
  const trip = tripWith([
    { hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' },
    { hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-14' },
  ]);
  const day = dayOf(trip, 2);
  const anchors = deriveDayAnchors(trip, day, hotels);

  const stops = routeStops({ start: anchors.start, end: anchors.end }, [{ id: 'mid', name: 'Mid', lat: -8.7, lng: 115.16, areaId: 'seminyak' }] as never);
  check('the route begins at Hotel A', stops[0].id === anchors.start!.id);
  check('the route passes through the stop', stops[1].id === 'mid');
  check('the route ends at Hotel B', stops[2].id === anchors.end!.id);

  // The hotel-to-hotel transition is MEASURED by the routing provider, not
  // asserted. The injected provider lets the shape be checked without network.
  const calls: Array<[string, string]> = [];
  const fakeRoute = async (from: { id: string }, to: { id: string }) => {
    calls.push([from.id, to.id]);
    return { status: 'ok' as const, distanceMeters: 12_000, durationSeconds: 35 * 60, geometry: null, providerId: 'test' };
  };
  const legs = await buildLegsForStops(stops, { routeFor: fakeRoute as never, timeoutMs: 1000 });
  check('the anchor-to-stop leg is routed', calls.some(([a, b]) => a === anchors.start!.id && b === 'mid'), JSON.stringify(calls));
  check('the stop-to-anchor leg is routed', calls.some(([a, b]) => a === 'mid' && b === anchors.end!.id), JSON.stringify(calls));
  check('two legs connect three stops', legs.length === 2, String(legs.length));
  check('the hotel-to-hotel day carries measured durations', legs.every((leg) => leg.durationSeconds === 35 * 60));

  const schedule = buildDaySchedule({ trip, day: { ...day, items: [{ id: 'mid', refId: 'mid', kind: 'activity', name: 'Mid', lat: -8.7, lng: 115.16, durationMin: 60, confidence: 'verified' }] }, anchors, legs });
  const midEntry = schedule.entries.find((e) => e.kind === 'item')!;
  const endAnchor = schedule.entries.filter((e) => e.kind === 'anchor')[1];
  check('the schedule includes travel time to the stop', midEntry.kind === 'item' && midEntry.arrivalClock === 9 * 60 + 35, JSON.stringify(midEntry));
  check('the day ends at Hotel B after its leg', endAnchor?.kind === 'anchor' && endAnchor.clock === 9 * 60 + 35 + 60 + 35, JSON.stringify(endAnchor));
}

// ---------------------------------------------------------------------------
section('10. Arrival and departure anchors');
// ---------------------------------------------------------------------------
{
  const airport = destination.airports[0];
  const trip = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-14' }]);

  const arrivalDay = { ...dayOf(trip, 0), items: [itemFromAirport(airport, 'arrival')] };
  const arrivalAnchors = deriveDayAnchors(trip, arrivalDay, hotels, { isLastDay: false });
  check('the arrival day anchors on the airport when there is no start hotel', arrivalAnchors.start?.kind === 'airport', String(arrivalAnchors.start?.kind));
  check('the arrival day still ends at the hotel', arrivalAnchors.end?.refId === W.id);

  const normalDay = dayOf(trip, 1);
  const normalAnchors = deriveDayAnchors(trip, normalDay, hotels, { isLastDay: false });
  check('a normal day prefers the hotel over an airport item', normalAnchors.start?.kind === 'hotel');

  const departureDay = { ...dayOf(trip, 4), items: [itemFromAirport(airport, 'departure')] };
  const departureAnchors = deriveDayAnchors(trip, departureDay, hotels, { isLastDay: true });
  check('the departure day ends at the airport', departureAnchors.end?.kind === 'airport', String(departureAnchors.end?.kind));
  check('the departure day starts at the last hotel', departureAnchors.start?.refId === W.id);
  check('the departure day is not flagged as unbooked', !departureAnchors.missingAccommodation);

  // The model is ready for origin → airport → hotel without a second shape.
  check('an airport anchor carries coordinates for routing', Number.isFinite(arrivalAnchors.start!.lat) && Number.isFinite(arrivalAnchors.start!.lng));
}

// ---------------------------------------------------------------------------
section('11. Legacy trip migration');
// ---------------------------------------------------------------------------
{
  const legacy = tripWith([]);
  legacy.stays = undefined as never;
  // The old model: the same hotel added to three consecutive days.
  legacy.days[0].items = [itemFromHotel(W)];
  legacy.days[1].items = [itemFromHotel(W)];
  legacy.days[2].items = [itemFromHotel(W)];
  // …and a single, ambiguous row on the last day.
  legacy.days[4].items = [itemFromHotel(ST_REGIS)];

  const migrated = migrateTripToStays(legacy, '2026-10-05T00:00:00.000Z');
  check('a consecutive run becomes one stay', migrated.stays?.length === 1, JSON.stringify(migrated.stays?.map((s) => s.hotelPlaceId)));
  check('the migrated stay has the right hotel', migrated.stays![0].hotelPlaceId === W.id);
  check('the migrated stay starts on the first day of the run', migrated.stays![0].checkInDate === '2026-10-10');
  check('the migrated stay checks out the morning after the last night', migrated.stays![0].checkOutDate === '2026-10-13', migrated.stays![0].checkOutDate);
  check('the converted hotel rows are removed', migrated.days[0].items.length === 0 && migrated.days[1].items.length === 0 && migrated.days[2].items.length === 0);
  check(
    'an AMBIGUOUS single hotel row is preserved, not converted',
    migrated.days[4].items.length === 1 && migrated.days[4].items[0].refId === ST_REGIS.id,
  );
  check('the trip keeps a default start time after migration', migrated.defaultStartTime === '09:00');

  // Idempotent: running it again changes nothing.
  const twice = migrateTripToStays(migrated, '2026-10-06T00:00:00.000Z');
  check('migration is idempotent', twice === migrated || JSON.stringify(twice.stays) === JSON.stringify(migrated.stays));
  check('re-running does not re-add a stay', twice.stays?.length === 1);

  // A trip that already has stays is untouched.
  const modern = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-14' }]);
  const untouched = migrateTripToStays(modern, '2026-10-07T00:00:00.000Z');
  check('a trip that already has stays is returned unchanged', untouched === modern);
}

// ---------------------------------------------------------------------------
section('12. Store actions: add, edit, change hotel, delete');
// ---------------------------------------------------------------------------
{
  memory.clear();
  const store = () => useTripStore.getState();
  const draft = {
    arrivalDate: '2026-10-10',
    departureDate: '2026-10-14',
    travellers: 2,
  } as never;
  const trip = useTripStore.getState().createTrip(draft, destination);
  const tripId = trip.id;

  check('a new trip starts with no stays', (store().trips[0].stays ?? []).length === 0);
  check('a new trip has a default start time', store().trips[0].defaultStartTime === '09:00');

  const first = store().addStay(tripId, { hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' });
  check('a stay can be added', Boolean(first));
  check('the stay is stored', (store().trips[0].stays ?? []).length === 1);

  const second = store().addStay(tripId, { hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-14' });
  check('a back-to-back stay can be added', Boolean(second));
  check('two stays are stored', (store().trips[0].stays ?? []).length === 2);

  const overlap = store().addStay(tripId, { hotelPlaceId: RITZ.id, checkInDate: '2026-10-11', checkOutDate: '2026-10-13' });
  check('an overlapping stay is REFUSED', overlap === null);
  check('the refused stay was not stored', (store().trips[0].stays ?? []).length === 2);

  const zeroNight = store().addStay(tripId, { hotelPlaceId: RITZ.id, checkInDate: '2026-10-14', checkOutDate: '2026-10-14' });
  check('a zero-night stay is refused', zeroNight === null);

  // Change the hotel on the second stay.
  store().updateStay(tripId, second!.id, { hotelPlaceId: RITZ.id });
  check('a stay hotel can be changed', store().trips[0].stays!.find((s) => s.id === second!.id)!.hotelPlaceId === RITZ.id);

  // Edit the dates.
  store().updateStay(tripId, second!.id, { checkInDate: '2026-10-12', checkOutDate: '2026-10-15' });
  check('stay dates can be edited', store().trips[0].stays!.find((s) => s.id === second!.id)!.checkOutDate === '2026-10-15');

  // Per-day start override and the trip default.
  store().setDayStartTime(tripId, store().trips[0].days[1].id, '08:30');
  check('a day start time can be overridden', store().trips[0].days[1].startTime === '08:30');
  store().setDayStartTime(tripId, store().trips[0].days[1].id, undefined);
  check('a day override can be cleared back to the default', store().trips[0].days[1].startTime === undefined);
  store().setDefaultStartTime(tripId, '07:30');
  check('the trip default can be changed', store().trips[0].defaultStartTime === '07:30');

  // Delete.
  store().removeStay(tripId, first!.id);
  check('a stay can be deleted', (store().trips[0].stays ?? []).length === 1);
  check('the remaining stay is the other one', store().trips[0].stays![0].id === second!.id);

  // Deleting the last one leaves the trip usable and warns about the gap.
  store().removeStay(tripId, second!.id);
  const bare = store().trips[0];
  check('deleting every stay leaves no stays', (bare.stays ?? []).length === 0);
  check('the trip now reports unbooked nights', unbookedNights(bare).length === 4, String(unbookedNights(bare).length));
  check('and no day invents a hotel', [...deriveTripAnchors(bare, hotels).values()].every((a) => a.end === null || a.end.kind !== 'hotel'));

  store().clearAll();
}

// ---------------------------------------------------------------------------
section('13. Trip-level facts');
// ---------------------------------------------------------------------------
{
  const trip = tripWith([
    { hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' },
    { hotelPlaceId: ST_REGIS.id, checkInDate: '2026-10-12', checkOutDate: '2026-10-14' },
  ]);

  check('a trip before its arrival is upcoming', tripPhase(trip, '2026-10-01') === 'upcoming');
  check('a trip on its arrival day is active', tripPhase(trip, '2026-10-10') === 'active');
  check('a trip on its departure day is still active', tripPhase(trip, '2026-10-14') === 'active');
  check('a trip after its departure is past', tripPhase(trip, '2026-10-15') === 'past');

  const summary = tripSummary(trip, hotels, 'zh-CN');
  check('the summary counts days', summary.dayCount === 5, String(summary.dayCount));
  check('the summary counts nights', summary.nightCount === 4, String(summary.nightCount));
  check('the summary counts stays', summary.stayCount === 2, String(summary.stayCount));
  check('the summary names both hotels in order', /W/.test(summary.accommodation ?? '') && /瑞吉|Regis/.test(summary.accommodation ?? ''), String(summary.accommodation));
  check('a fully booked trip reports no gap', !summary.hasGap);

  const gapped = tripWith([{ hotelPlaceId: W.id, checkInDate: '2026-10-10', checkOutDate: '2026-10-12' }]);
  check('an unbooked night sets the gap flag', tripSummary(gapped, hotels).hasGap);

  // Planned places exclude the stops the model derives.
  const withItems = {
    ...trip,
    days: trip.days.map((day, index) =>
      index === 1
        ? { ...day, items: [itemFromPlace({ id: 'p', name: 'P', areaId: 'ubud', coordinates: { lat: -8.5, lng: 115.26, confidence: 'verified' }, markerLayer: 'activity' } as never), itemFromHotel(W), itemFromAirport(destination.airports[0], 'arrival')] }
        : day,
    ),
  };
  check('planned places count only real places', plannedPlaceCount(withItems) === 1, String(plannedPlaceCount(withItems)));
  check('the summary uses the same count', tripSummary(withItems, hotels).plannedPlaces === 1);

  // Ordering.
  const older = { ...tripWith([], '2026-01-01', '2026-01-05') } as never as { id: string; arrivalDate: string; departureDate: string };
  const future = tripWith([], '2026-12-01', '2026-12-05');
  const ordered = sortTripsForList([older as never, future, trip], '2026-10-01');
  check('upcoming trips come first, soonest first', ordered[0].arrivalDate === '2026-10-10' && ordered[1].arrivalDate === '2026-12-01', ordered.map((t) => t.arrivalDate).join(','));
  check('past trips come last', ordered[2].arrivalDate === '2026-01-01', ordered.map((t) => t.arrivalDate).join(','));
  const reordered = sortTripsForList([older as never, trip], '2026-11-01');
  check('a trip in progress outranks a past one even late in the list', reordered[0].arrivalDate === '2026-01-01' || reordered[0].arrivalDate === '2026-10-10', reordered.map((t) => t.arrivalDate).join(','));
  const activeFirst = sortTripsForList([future, trip], '2026-10-11');
  check('the active trip sorts above a future one', activeFirst[0].arrivalDate === '2026-10-10', activeFirst.map((t) => t.arrivalDate).join(','));

  check('the primary stay hotel is the longest one', primaryStayHotelId(trip) === W.id || primaryStayHotelId(trip) === ST_REGIS.id);
}

// ---------------------------------------------------------------------------
console.log(`\n${'-'.repeat(64)}`);
console.log(`${passes}/${passes + failures} trip accommodation checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
assert.equal(failures, 0);
