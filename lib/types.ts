/**
 * Core domain model for the Meridian travel planner.
 *
 * Design rules
 * ------------
 * 1. Nothing here knows about React, Leaflet or any UI library. The data layer
 *    is portable so a real backend (Postgres/Prisma, tRPC, REST) can replace the
 *    static modules in `lib/data` without touching components.
 * 2. Every geographic value carries a `DataConfidence` so the UI can be honest
 *    about what is verified vs. approximate vs. demo data.
 * 3. Nothing in this file contains a price. We store *tiers*, never nightly
 *    rates, because we do not have a live pricing source in V1.
 * 4. Every user-facing string is either a message key resolved through
 *    `lib/i18n`, or a proper noun. Proper nouns are stored BOTH ways — the
 *    canonical name and its Chinese rendering — because a Chinese-speaking
 *    traveller needs to read the name and then search the same place in Google
 *    Maps, Grab or a hotel app, which only knows the English one.
 */

// ---------------------------------------------------------------------------
// Locale
// ---------------------------------------------------------------------------

/** Simplified Chinese is the product's primary language. */
export type Locale = 'zh-CN' | 'en';

export const DEFAULT_LOCALE: Locale = 'zh-CN';

/**
 * Optional Chinese naming for a proper noun.
 *
 * Deliberately optional and deliberately paired: an entity with no verified
 * Chinese name simply falls back to its canonical name rather than showing a
 * machine translation the reader cannot search for.
 */
export interface LocalizedNames {
  /** Canonical, searchable name. Never translated — it is what the map apps use. */
  name: string;
  /** Chinese rendering, shown first when the locale is zh-CN. */
  nameZh?: string;
}

// ---------------------------------------------------------------------------
// Data provenance
// ---------------------------------------------------------------------------

/**
 * How much we trust a piece of data.
 * - `verified`     — checked against a real source (OSM, official site, IATA).
 * - `approximate`  — best available placement; good enough to plan with, shown
 *                    to the user with an "approximate" badge.
 * - `demo`         — placeholder used to demonstrate the architecture.
 */
export type DataConfidence = 'verified' | 'approximate' | 'demo';

/** Describes where the *content* of a destination came from. */
export type DatasetKind = 'curated-static' | 'seed-static';

export interface DataProvenance {
  kind: DatasetKind;
  /** Human readable list of sources used while compiling the dataset. */
  sources: string[];
  /** ISO date of the last manual review. */
  reviewedOn: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Geography primitives
// ---------------------------------------------------------------------------

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Geocoded extends Coordinates {
  confidence: DataConfidence;
  /** Free text: what the coordinate actually marks, or why it is approximate. */
  coordNote?: string;
}

/** Leaflet-friendly tuple, kept separate so the data layer stays library-free. */
export type LatLngTuple = [number, number];

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export type DestinationStatus = 'reference' | 'starter';

export interface Airport {
  id: string;
  /** IATA code, e.g. DPS. */
  code: string;
  name: string;
  nameZh?: string;
  city: string;
  coordinates: Geocoded;
  role: 'primary' | 'secondary';
  /**
   * @deprecated Flight metadata authored against a single origin.
   *
   * Whether a route is non-stop, how long it takes and who flies it are
   * properties of an (origin, destination-airport) PAIR — not of the
   * destination airport. Several origins now reach the same airport by
   * different routes, and a boolean called "directFromSingapore" cannot express
   * that.
   *
   * These fields are harvested exactly once, by `lib/data/connections.ts`, into
   * `OriginDestinationConnection` records. Nothing else reads them. A new origin
   * adds connections; it must not add fields here.
   */
  legacyRouteFromOrigin?: {
    originCityId: string;
    direct: boolean;
    flightMinutes?: { min: number; max: number };
    airlines?: string[];
    note?: string;
  };
  /** Minutes from the airport to each area, by road. Ranges absorb traffic. */
  transfers?: AirportTransfer[];
}

export interface AirportTransfer {
  areaId: string;
  minutesMin: number;
  minutesMax: number;
  note?: string;
  confidence: DataConfidence;
}

/** 0–5 subjective score. Documented in the UI legend. */
export interface AreaScores {
  beach: number;
  nightlife: number;
  food: number;
  luxury: number;
  nature: number;
  /** How easy it is to get around without a scooter / private driver. */
  accessibility: number;
}

export interface Area {
  id: string;
  destinationId: string;
  name: string;
  /** Chinese name, e.g. 乌布 for Ubud. */
  nameZh?: string;
  coordinates: Geocoded;
  /**
   * True when this is a place a traveller would actually base themselves.
   * Day-trip zones (Nusa Penida, Kintamani, Amed) are modelled as areas too so
   * the map can describe them honestly, but they are never suggested as bases.
   */
  isStayBase: boolean;
  /** Short label shown on the map for non-stay zones, e.g. "day trip". */
  zoneType?: 'stay' | 'day-trip' | 'island';
  /**
   * Optional approximate outline. Only supplied where a real boundary could be
   * sourced; otherwise the map draws a radius-based "influence" shape which is
   * labelled as an approximation.
   */
  boundary?: LatLngTuple[];
  boundaryConfidence?: DataConfidence;
  /** Radius used when no boundary polygon exists. */
  radiusMeters: number;
  bestFor: string[];
  weakFor: string[];
  /** Chinese for `bestFor`, positionally aligned; falls back when shorter. */
  bestForZh?: string[];
  /** Chinese for `weakFor`, positionally aligned; falls back when shorter. */
  weakForZh?: string[];
  scores: AreaScores;
  vibe: string;
  vibeZh?: string;
  /**
   * The two-or-three word line shown under the area name on the map and in the
   * area list, e.g. "Surf · Cafés". This is the fastest way a traveller
   * understands a region, so it is authored, not derived.
   */
  tagline: string;
  /** Chinese tagline, e.g. 自然 · 文化 · 瑜伽. */
  taglineZh?: string;
  summary: string;
  /** Concise Chinese summary. Authored, not translated sentence by sentence. */
  summaryZh?: string;
  idealFor: string[];
  /** Chinese for `idealFor`, positionally aligned; falls back when shorter. */
  idealForZh?: string[];
  /** Typical nightly positioning, as a tier — never a nightly price. */
  priceTier: PriceTier;
  /** Hero first, then optional supporting shots. */
  images: PlaceImage[];
}

export interface Destination {
  id: string;
  name: string;
  nameZh?: string;
  country: string;
  countryZh?: string;
  countryCode: string;
  flag: string;
  region: RegionId;
  status: DestinationStatus;
  tagline: string;
  taglineZh?: string;
  description: string;
  descriptionZh?: string;
  coordinates: Geocoded;
  /** Initial camera for the destination map. */
  mapView: { center: LatLngTuple; zoom: number };
  /** Optional tighter bounds that contain all planning content. */
  mapBounds?: [LatLngTuple, LatLngTuple];
  recommendedDays: { min: number; ideal: number; max: number };
  tags: string[];
  bestFor: string[];
  /** Chinese for `bestFor`, positionally aligned; falls back when shorter. */
  bestForZh?: string[];
  currency: string;
  timezone: string;
  language: string;
  visaNote?: string;
  /** Practical notes for a Singapore-based traveller. */
  originNotes?: string[];
  airports: Airport[];
  areas: Area[];
  provenance: DataProvenance;
}

export type RegionId = 'indonesia' | 'vietnam' | 'cambodia' | 'philippines' | 'malaysia' | 'thailand';

export interface Region {
  id: RegionId;
  name: string;
  /** Chinese name, since the interface is Chinese-first. */
  nameZh?: string;
  countryCode: string;
  flag: string;
}

// ---------------------------------------------------------------------------
// Imagery
// ---------------------------------------------------------------------------

export type ImageProviderId =
  | 'wikimedia-commons'
  | 'openverse'
  | 'curated-local'
  | 'none';

/** What a photograph actually depicts, which is not always the entity it is attached to. */
export type ImageSubject =
  /** The entity itself — this hotel, this beach. */
  | 'subject'
  /** The surrounding area. A hotel card showing its beach is honest ONLY if labelled. */
  | 'area'
  /** A generic example of the category (e.g. Balinese food for a warung). */
  | 'category'
  | 'unknown';

export type ImageRole = 'hero' | 'secondary' | 'gallery';

export interface ImageSource {
  provider: ImageProviderId;
  /** Human-verifiable page the image came from. */
  pageUrl?: string;
  /** Licence short name as published by the source. */
  license: string;
  author: string;
}

export interface PlaceImage {
  id: string;
  url: string;
  alt: string;
  role: ImageRole;
  subject: ImageSubject;
  /** When subject is not 'subject', a short phrase naming what is shown. */
  depicts?: string;
  /** Intrinsic size, when known — lets the UI reserve space and avoid layout shift. */
  width?: number;
  height?: number;
  source: ImageSource;
}

/** Anything that can carry photography. */
export interface Imaged {
  images: PlaceImage[];
}

/**
 * Seed types for the destination data files.
 *
 * The geography files carry coordinates and description only; photography and
 * the short area tagline are attached by the registry in `lib/data/index.ts`.
 * Separating the two means a destination can ship with no photography at all
 * and still typecheck, which is exactly what the fallback UI is for.
 */
/**
 * An area before decoration.
 *
 * `tagline` is optional here and required on `Area`, so a newly authored area can
 * carry its own tagline inline — the alternative was a second shared registry
 * file that ten authors would have had to edit in sequence. `AREA_TAGLINES`
 * still supplies the lines for the areas that were authored before this.
 */
export type AreaSeed = Omit<Area, 'images' | 'tagline'> & { tagline?: string };
/** A destination as authored, before areas are decorated with photography. */
export type DestinationSeed = Omit<Destination, 'areas'> & { areas: AreaSeed[] };
export type HotelSeed = Omit<Hotel, 'images'>;
export type PlaceSeed = Omit<Place, 'images'>;

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export type TransportMode =
  | 'walk'
  | 'taxi'
  | 'grab'
  | 'private-car'
  | 'scooter'
  | 'bus'
  | 'train'
  | 'ferry'
  | 'fast-boat'
  | 'flight';

/**
 * Where a leg's numbers came from. This is surfaced in the UI, because a
 * measured road distance and a great-circle guess must never look the same.
 */
export type LegSource =
  /** A routing engine returned road geometry and duration. */
  | 'routing-engine'
  /** A great-circle distance, explicitly NOT a driving distance. */
  | 'geodesic'
  /** Hand-checked travel knowledge, explicitly approximate. */
  | 'curated'
  /** No data. The UI must say so rather than invent a number. */
  | 'unavailable';

export type LegConfidence = 'measured' | 'estimated' | 'approximate' | 'unavailable';

/**
 * The transport rules, as ids.
 *
 * Recommendation logic produces an id and its numbers; the copy lives in the
 * message catalogue. That is the difference between a localized product and an
 * English product with translated labels — a rationale assembled by string
 * concatenation can never be rendered well in a second language.
 */
export type TransportRationaleKey =
  | 'water-crossing'
  | 'airport-transfer'
  | 'walkable'
  | 'short-hop'
  | 'medium-hop'
  | 'long-pickup'
  | 'cross-island';

export interface TransportLeg {
  id: string;
  fromItemId: string;
  toItemId: string;
  fromName: string;
  toName: string;
  /** The mode the traveller should actually use. */
  mode: TransportMode;
  /** Every mode that could work, best first. Drives the "or take a…" line. */
  alternatives: TransportMode[];
  /**
   * One short sentence explaining the recommendation.
   *
   * English, and kept for the `en` locale. The UI resolves `rationaleKey`
   * when one is present, so the explanation is written in the reader's language
   * rather than translated sentence-fragment by sentence-fragment.
   */
  rationale: string;
  /** Which rule produced this leg, so the UI can say it in the right language. */
  rationaleKey?: TransportRationaleKey;
  rationaleParams?: Record<string, string | number>;
  /** Road/route distance in metres, or null when unavailable. */
  distanceMeters: number | null;
  /** Travel duration in seconds, or null when unavailable. */
  durationSeconds: number | null;
  /** Straight-line distance in metres. Always available; never shown as drive time. */
  straightLineMeters: number;
  geometry: Coordinates[] | null;
  source: LegSource;
  confidence: LegConfidence;
  providerId?: string;
  /** Set when the leg crosses water and therefore needs more than one mode. */
  multimodal?: { via: string; modes: TransportMode[] };
}

// ---------------------------------------------------------------------------
// Places: hotels, activities, food, nature, beaches, transport
// ---------------------------------------------------------------------------

/** The map layer a marker belongs to. Drives icon, filtering and sync. */
export type MarkerLayer =
  | 'marriott'
  | 'hilton'
  | 'ihg'
  | 'hyatt'
  | 'gha'
  | 'activity'
  | 'nature'
  | 'beach'
  | 'food'
  | 'nightlife'
  | 'airport'
  | 'transport';

/**
 * The loyalty programmes Meridian models.
 *
 * Five, and the list is deliberately short. A programme earns its place by
 * having enough real inventory in Southeast Asia to change where somebody stays
 * — which is why Accor Live Limitless and Wyndham Rewards are absent rather than
 * half-populated. GHA is a consortium rather than a hotel company (§ see the
 * brand registry) and is modelled as its own programme because that is how its
 * members' loyalty works: one DISCOVERY account across all of them.
 */
export type HotelGroupId = 'marriott' | 'hilton' | 'ihg' | 'hyatt' | 'gha';

export interface HotelBrand {
  id: string;
  name: string;
  group: HotelGroupId;
  /** Positioning tier used to derive priceTier where no sourced tier exists. */
  positioning: 'ultra-luxury' | 'luxury' | 'upper-upscale' | 'upscale' | 'select';
  /** Reserved for future elite-tier data. Never hard-code benefits. */
  loyaltyProgramme: string;
}

export type PriceTier = '$' | '$$' | '$$$' | '$$$$';

export type PropertyType =
  | 'Luxury Resort'
  | 'Resort'
  | 'Beach Resort'
  | 'Villa Resort'
  | 'City Hotel'
  | 'Boutique Hotel';

export type BeachAccess = 'none' | 'limited' | 'good' | 'excellent';

/**
 * Trip-level travel styles (what kind of holiday the traveller wants).
 * Deliberately narrower than `HotelStyle`: a trip is not "Resort" or "City".
 */
export type TravelStyle =
  | 'Beach'
  | 'Luxury'
  | 'Food'
  | 'Nature'
  | 'Nightlife'
  | 'Diving'
  | 'Surfing'
  | 'Culture'
  | 'Couple'
  | 'Friends'
  | 'Family';

/**
 * Hotel-level style tags. Matches the filter vocabulary in the product brief:
 * Luxury, Beach, Resort, City, Couple, Family, Nightlife.
 */
export type HotelStyle = TravelStyle | 'Resort' | 'City';

export const HOTEL_STYLE_FILTERS: HotelStyle[] = [
  'Luxury',
  'Beach',
  'Resort',
  'City',
  'Couple',
  'Family',
  'Nightlife',
];

export interface Hotel {
  id: string;
  name: string;
  /**
   * Chinese name where one is in real use, e.g. 巴厘岛瑞吉度假酒店.
   * The English name is ALWAYS shown alongside it: it is what Google Maps,
   * Grab and the hotel's own app will recognise.
   */
  nameZh?: string;
  destinationId: string;
  areaId: string;
  hotelGroup: HotelGroupId;
  brand: string;
  brandId: string;
  coordinates: Geocoded;
  priceTier: PriceTier;
  /** How the tier was derived — shown in the detail card for honesty. */
  priceTierBasis: string;
  propertyType: PropertyType;
  tags: HotelStyle[];
  beachAccess: BeachAccess;
  beachAccessNote?: string;
  /** Minutes by road to the destination's primary airport. */
  airportTransfer: { toAirportId: string; minutesMin: number; minutesMax: number; confidence: DataConfidence };
  description: string;
  /** Concise Chinese copy, authored rather than translated. */
  descriptionZh?: string;
  loyaltyProgramme: string;
  roomCount?: number;
  officialUrl?: string;
  /**
   * Future extension point for loyalty data. Left empty in V1 on purpose:
   * elite benefits change constantly and must never be hard-coded.
   */
  loyaltyMeta?: HotelLoyaltyMeta;
  images: PlaceImage[];
}

export interface HotelLoyaltyMeta {
  /** e.g. Marriott category / Hilton points band, when a source is available. */
  awardCategory?: string;
  /** Free-form, data-driven notes. Never rendered as advice unless sourced. */
  notes?: string;
}

export type PlaceCategory = 'activity' | 'nature' | 'beach' | 'food' | 'nightlife' | 'transport';

/**
 * How we know a place exists and where it is.
 *
 * Separate from `DataConfidence` (which is about the coordinate) because a place
 * can be perfectly located and still be unverified as a business. A single
 * social-media post is a DISCOVERY SIGNAL, never a verified fact.
 */
export type VerificationStatus =
  /** Confirmed against an official site, a map/geographic source, or direct contact. */
  | 'verified'
  /** Exists and is located, but details (hours, menu) are unconfirmed. */
  | 'partial'
  /** Discovered but not yet confirmed — cannot be published to travellers. */
  | 'unverified';

export type PlaceSourceKind =
  /** The venue's own website or booking page. */
  | 'official'
  /** OpenStreetMap, Wikidata, a map listing. */
  | 'geographic'
  /** Guidebook, newspaper, magazine. */
  | 'editorial'
  /** A social guide the researcher imported. Discovery signal only. */
  | 'social';

export interface PlaceSource {
  kind: PlaceSourceKind;
  /** Human-readable name of the source, e.g. "OpenStreetMap way 12345". */
  label: string;
  url?: string;
  /** ISO date this source was consulted. */
  retrievedOn?: string;
}

/** Aggregated social research signal, DERIVED from the research store — never authored. */
export interface SocialSignals {
  /** How many imported guides mention this place. */
  mentionCount: number;
  platforms: SocialPlatform[];
  /** Recurring themes across mentions, e.g. "日落", "排队久". */
  themes: string[];
  /** Items repeatedly named by guides — dish names, activities. */
  frequentlyMentioned: string[];
  lastReviewedAt?: string;
}

export type MealType = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'coffee' | 'drinks' | 'dessert';

/** Restaurant-specific structure. Present only when `category === 'food'` or a dining venue. */
export interface PlaceDining {
  /** Cuisine ids resolved through `lib/data/place-taxonomy`. */
  cuisines: string[];
  mealTypes: MealType[];
  /** Positioning tier, not a price. */
  priceTier: PriceTier;
  /** Dishes the kitchen is known for. Only ever sourced, never invented. */
  signatureItems: string[];
  reservationRecommended: boolean;
  /** True when the venue is known for a view or a sunset. */
  viewOrSunset?: boolean;
}

export type ActivityKind =
  | 'surf'
  | 'dive'
  | 'snorkel'
  | 'rafting'
  | 'volcano'
  | 'atv'
  | 'yoga'
  | 'spa'
  | 'beachclub'
  | 'sunset'
  | 'temple'
  | 'waterfall'
  | 'ricefield'
  | 'cooking'
  | 'island'
  | 'shopping'
  | 'hike';

export type ActivityDifficulty = 'easy' | 'moderate' | 'hard';
export type WeatherDependency = 'none' | 'low' | 'high';

/** Activity-specific structure. */
export interface PlaceActivity {
  kind: ActivityKind;
  difficulty?: ActivityDifficulty;
  weatherDependency: WeatherDependency;
  reservationRecommended: boolean;
  /** One line on how you actually get there, e.g. "Hotel car or Grab, about 30 minutes". */
  transportContext?: string;
  /** Chinese for `transportContext`; falls back to the English string. */
  transportContextZh?: string;
  /** True when a certified operator or instructor is required. */
  operatorRequired?: boolean;
}

export interface Place {
  id: string;
  name: string;
  /** Chinese name. Shown first in zh-CN, with `name` kept visible for search. */
  nameZh?: string;
  destinationId: string;
  areaId: string;
  category: PlaceCategory;
  subcategory: string;
  coordinates: Geocoded;
  recommendedDurationMin: number;
  bestTime: string;
  /** Chinese for `bestTime`; falls back to the English string. */
  bestTimeZh?: string;
  tags: string[];
  /** Chinese for `tags`, positionally aligned. Falls back to `tags`. */
  tagsZh?: string[];
  description: string;
  /** Concise Chinese copy. Not a translation of `description` — see lib/i18n. */
  descriptionZh?: string;
  notes?: string;
  notesZh?: string;
  entryFee?: string;
  entryFeeZh?: string;
  openingHours?: string;
  /** Rendered as a distinct marker shape, independent of the category colour. */
  markerLayer: MarkerLayer;
  /**
   * Which discovery categories this place appears under in DO.
   *
   * Authored rather than inferred from `markerLayer`: a beach club is nightlife
   * *and* a beach, a warung is food *and* local cuisine, and deriving that from
   * one enum lost most of it.
   */
  discovery?: string[];
  /** Who this is actually for, as taxonomy ids. */
  recommendedFor?: string[];
  dining?: PlaceDining;
  activity?: PlaceActivity;
  sources?: PlaceSource[];
  verificationStatus?: VerificationStatus;
  images: PlaceImage[];
}

// ---------------------------------------------------------------------------
// Itinerary / trips
// ---------------------------------------------------------------------------

export type ItineraryItemKind = MarkerLayer;

export interface ItineraryItem {
  id: string;
  /** id of the Hotel / Place / Airport this item came from. */
  refId: string;
  kind: ItineraryItemKind;
  name: string;
  /**
   * Chinese name, carried on the item rather than looked up at render time.
   *
   * A trip survives in localStorage across releases, and the entity it points at
   * can be renamed or removed. Storing both names means an itinerary written in
   * one language still reads correctly after the traveller switches, and still
   * reads correctly if the place record disappears.
   */
  nameZh?: string;
  areaId?: string;
  areaName?: string;
  lat: number;
  lng: number;
  /** Used by the route-efficiency engine and the day timeline. */
  durationMin?: number;
  note?: string;
  /** Pinned items keep their position when the day is auto-sorted. */
  pinned?: boolean;
  /**
   * `HH:MM` the traveller must be there.
   *
   * A booking time, not a preference. The schedule flows around normal items and
   * reports whether it arrives early (usable waiting time) or late (a conflict) —
   * it never moves the time, because the time is the one thing here the traveller
   * cannot change.
   */
  fixedTime?: string;
  confidence: DataConfidence;
}

export interface TripDay {
  id: string;
  /** 0-based index within the trip. */
  index: number;
  /** ISO `yyyy-mm-dd`. */
  date: string;
  items: ItineraryItem[];
  /** Optional user note for the day. */
  note?: string;
  /**
   * `HH:MM` override for when this day starts.
   *
   * Absent means "use the trip default", which is not the same as storing the
   * default here — a later change to the trip default should move the days the
   * traveller never overrode.
   */
  startTime?: string;
}

/**
 * One accommodation stay.
 *
 * WHY THIS IS NOT AN ITINERARY ITEM
 * ---------------------------------
 * A hotel is not a place you visit, it is where you ARE. Modelling it as an
 * itinerary item meant adding W Bali to the timeline on the 10th, the 11th and
 * again on the 12th, and nothing in the data said those three rows were the same
 * booking. Every derived fact the itinerary needs — where the day starts, where
 * it ends, whether today is a hotel-change day, whether a night is unbooked —
 * is a property of the STAY, not of a row on a day.
 *
 * `checkOutDate` is EXCLUSIVE: a stay from the 10th to the 12th covers the nights
 * of the 10th and the 11th, which is how a hotel booking is actually read.
 */
export interface TripStay {
  id: string;
  /** Canonical `Hotel` id. Never a copy of the hotel record. */
  hotelPlaceId: string;
  /** ISO `yyyy-mm-dd`. */
  checkInDate: string;
  /** ISO `yyyy-mm-dd`, exclusive — the morning the traveller leaves. */
  checkOutDate: string;
  note?: string;
}

/** What kind of thing a day's anchor is. */
export type AnchorKind = 'hotel' | 'airport' | 'origin' | 'custom';

/**
 * Where a day starts or ends.
 *
 * DERIVED, never stored. It is computed from the trip's stays, so a stay edit or
 * a date change moves every affected day with no bookkeeping and no chance of
 * the timeline disagreeing with the accommodation list.
 *
 * The `kind` exists for the arrival/departure case: today the anchors are hotels,
 * and the same shape already carries an airport or an origin so that
 * origin → airport → first hotel can be expressed later without a second model.
 */
export interface DayAnchor {
  id: string;
  kind: AnchorKind;
  /** The canonical record this points at, when there is one. */
  refId?: string;
  name: string;
  nameZh?: string;
  lat: number;
  lng: number;
  areaId?: string;
  confidence: DataConfidence;
  /**
   * The itinerary kind this anchor behaves as for transport purposes.
   *
   * An anchor is not an item, but the transport recommender reads an item's
   * `kind` to tell an airport transfer from a cross-town drive. Carrying the
   * equivalent here keeps that reasoning intact without pretending an anchor is
   * an itinerary row.
   */
  itemKind?: MarkerLayer;
}

/** The anchors derived for one day, and what they imply. */
export interface DayAnchors {
  /** Where the traveller wakes up. Null on the first day, or when unbooked. */
  start: DayAnchor | null;
  /** Where the traveller sleeps. Null on the last day, or when unbooked. */
  end: DayAnchor | null;
  /**
   * The traveller sleeps somewhere different tonight.
   *
   * True only when BOTH anchors are hotels and they differ. An arrival day has a
   * start of null, which is not a hotel change.
   */
  isHotelChange: boolean;
  /**
   * A night with no booking.
   *
   * The interface warns; it never invents a hotel. False on the final day, whose
   * night is not spent.
   */
  missingAccommodation: boolean;
  /** The stay being left today, when the day is a change or a departure. */
  fromStayId?: string;
  /** The stay being moved into today. */
  toStayId?: string;
}

export type LoyaltyProgrammeId = 'marriott-bonvoy' | 'hilton-honors';

export interface Trip {
  id: string;
  /**
   * The city this trip departs from.
   *
   * Optional on the type because trips saved before origins existed do not have
   * it; the trip store migrates those to `singapore`, which is where every such
   * trip was in fact made from. New trips always set it.
   */
  originCityId?: string;
  name: string;
  destinationId: string;
  /** ISO `yyyy-mm-dd`. */
  arrivalDate: string;
  departureDate: string;
  travellers: number;
  styles: TravelStyle[];
  budget?: PriceTier;
  loyalty: LoyaltyProgrammeId[];
  days: TripDay[];
  /**
   * Accommodation, in chronological order.
   *
   * Optional on the type because trips saved before stays existed do not have it;
   * the store migrates those on load. New trips always set it.
   */
  stays?: TripStay[];
  /** `HH:MM`. Absent means the product default, currently 09:00. */
  defaultStartTime?: string;
  createdAt: string;
  updatedAt: string;
}

/** Everything the trip store needs to create a trip. */
export interface TripDraft {
  destinationId: string;
  /** Where the traveller is leaving from. Defaults to the selected origin. */
  originCityId?: string;
  arrivalDate: string;
  departureDate: string;
  travellers: number;
  styles?: TravelStyle[];
  budget?: PriceTier;
  loyalty?: LoyaltyProgrammeId[];
  name?: string;
}

// ---------------------------------------------------------------------------
// Route efficiency
// ---------------------------------------------------------------------------

export type EfficiencySeverity = 'info' | 'warning' | 'critical';

export interface EfficiencySuggestion {
  id: string;
  severity: EfficiencySeverity;
  title: string;
  detail: string;
  /** Itinerary item ids the suggestion is about. */
  itemIds: string[];
  /** Present when the engine can propose a concrete move. */
  action?: {
    kind: 'move-to-day';
    itemId: string;
    itemName: string;
    fromDayId: string;
    toDayId: string;
    toDayLabel: string;
    reason: string;
  };
}

export interface DayLeg {
  fromItemId: string;
  toItemId: string;
  /** Great-circle distance in km. */
  straightLineKm: number;
  /** Estimated road distance in km (provider dependent). */
  estimatedRoadKm: number;
  /** Estimated travel minutes (provider dependent). Always labelled as an estimate. */
  estimatedMinutes: number;
  /** How the numbers were produced, e.g. "geodesic-estimate". */
  method: string;
}

export interface DayAnalysis {
  dayId: string;
  dayIndex: number;
  legs: DayLeg[];
  totalStraightLineKm: number;
  totalEstimatedRoadKm: number;
  totalEstimatedMinutes: number;
  /** Diagonal of the bounding box of the day's points, in km. */
  spreadKm: number;
  areaIds: string[];
  /** Area centroid hops that are geographically incoherent. */
  crossAreaHops: number;
  suggestions: EfficiencySuggestion[];
}

// ---------------------------------------------------------------------------
// Providers (flights / routing)
// ---------------------------------------------------------------------------

export interface FlightRouteOption {
  id: string;
  originCode: string;
  destinationCode: string;
  originName: string;
  destinationName: string;
  direct: boolean;
  durationMinutes: { min: number; max: number };
  airlines: string[];
  stops: number;
  /** Where the data came from — surfaced in the UI next to every flight fact. */
  source: 'static-curated' | 'amadeus' | 'skyscanner' | 'google-flights';
  note?: string;
}

export interface FlightDataProvider {
  id: string;
  label: string;
  /** True when the provider has the credentials it needs. */
  isConfigured(): boolean;
  search(originCode: string, destinationCode: string): Promise<FlightRouteOption[]>;
}

/** Travel profile a routing engine can answer for. */
export type RoutingProfile = 'driving' | 'walking' | 'cycling';

export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
  profile: RoutingProfile;
}

/**
 * The result of asking a routing engine for a route.
 *
 * `status` is part of the type on purpose: a caller cannot accidentally read a
 * distance out of a failed lookup, because on failure the numbers are null.
 * That is what stops the UI from presenting a guess as a measured drive.
 */
export interface RouteResult {
  providerId: string;
  providerLabel: string;
  status: 'ok' | 'unavailable';
  distanceMeters: number | null;
  durationSeconds: number | null;
  geometry: Coordinates[] | null;
  /** Where the numbers came from, surfaced verbatim in the UI. */
  source: 'routing-engine' | 'unavailable';
  /** Present when status is 'unavailable', explaining why. */
  note?: string;
}

export interface RoutingProvider {
  id: string;
  label: string;
  /** True when the provider has everything it needs to run. */
  isConfigured(): boolean;
  /**
   * Server-only providers must be called through `/api/route` so the API key
   * never reaches the browser.
   */
  serverOnly: boolean;
  /** Free-form cost/limits note shown in the transport panel. */
  costNote: string;
  route(request: RouteRequest): Promise<RouteResult>;
}

// ---------------------------------------------------------------------------
// Origins
// ---------------------------------------------------------------------------
//
// The origin is a first-class entity, on the same footing as a destination.
// Singapore is one supported origin, not an assumption baked into the product.

export type OriginRegionId =
  | 'singapore'
  | 'greater-bay'
  | 'yangtze-delta'
  | 'china-other'
  | 'southeast-asia';

/**
 * Where an origin came from.
 *
 * V1 ships curated cities only. This exists so that "search any city" and
 * "this is my home" can be added later without changing the shape of anything.
 */
export type OriginSource = 'curated' | 'search' | 'user';

export interface OriginAirport {
  id: string;
  /** IATA code, e.g. CAN. */
  code: string;
  nameZh: string;
  nameEn: string;
  coordinates: Geocoded;
  type: 'international' | 'regional';
}

export interface OriginCity {
  id: string;
  cityNameZh: string;
  cityNameEn: string;
  /** Country name in Chinese; the canonical English sits on `countryEn`. */
  country: string;
  countryEn: string;
  countryCode: string;
  region: OriginRegionId;
  coordinates: Geocoded;
  /**
   * Every airport that could serve this city.
   *
   * Deliberately a list: Shanghai has PVG and SHA, Beijing has PEK and PKX,
   * Bangkok has BKK and DMK. One city does not mean one airport, and a model
   * that assumed it would have to be rewritten to add the second.
   */
  airports: OriginAirport[];
  timezone: string;
  /**
   * Other origins close enough to be a plausible alternative departure point.
   *
   * The architecture for 考虑附近机场. V1 does not act on it — it exists so the
   * shape does not have to change when it does.
   */
  nearbyOriginIds: string[];
  enabled: boolean;
  source: OriginSource;
  note?: string;
}

/**
 * What we actually know about getting from one origin to one destination.
 *
 * THE HONESTY RULE
 * ----------------
 * `directAvailable` is `boolean | null`, and `null` means UNKNOWN. It does not
 * mean "no". A destination with no connection record, or a record whose
 * confidence is `unknown`, renders as 航班信息待确认 — never as a guessed
 * duration and never as a claim of non-stop service.
 */
export interface OriginDestinationConnection {
  originCityId: string;
  destinationId: string;
  /** `null` when we do not know. Never inferred from distance. */
  directAvailable: boolean | null;
  /** Block-time band in minutes, or `null` when unavailable. Not a live schedule. */
  approximateFlightDuration: { min: number; max: number } | null;
  /** Airport codes on the origin side that serve this pair. */
  originAirports: string[];
  /** Airport codes on the destination side. */
  destinationAirports: string[];
  typicalTransportMode: 'flight' | 'flight-connection' | 'unknown';
  /**
   * Whether this is a realistic weekend trip FROM THIS ORIGIN.
   *
   * Origin-dependent by nature: Singapore → Phuket is a weekend; Shanghai →
   * Bali is not. Never derived from distance alone — only populated where the
   * judgement is defensible, and `unknown` otherwise.
   */
  weekendSuitability: 'good' | 'possible' | 'not-ideal' | 'unknown';
  /** Where this came from, in words a reviewer can check. */
  source: string;
  /** ISO date. Connection data must not become timeless hard-coded truth. */
  verifiedAt: string;
  confidence: DataConfidence | 'unknown';
  note?: string;
}

// ---------------------------------------------------------------------------
// Social guide research
// ---------------------------------------------------------------------------
//
// A SEPARATE data layer, deliberately.
//
// Production POI data is curated and verifiable. Social guides are a discovery
// signal: someone said something about somewhere. Merging the two would let an
// unverified mention become a published place, which is exactly the failure this
// separation exists to prevent. Nothing here reaches a traveller until a
// researcher moves it through review.

/**
 * V1 supports exactly one source.
 *
 * This was a nine-value union of every platform a travel guide might live on.
 * That breadth made the product worse, not better: extraction, retrieval,
 * layout and copy all had to hedge for sources nobody had tested, and the
 * Xiaohongshu workflow — where most of this product's actual users are — stayed
 * a paste box.
 *
 * A one-value union looks odd and is deliberate. Adding a second platform should
 * be a change to this line, a provider, and a copy pass, rather than something
 * that happens by accident because a union already permitted it (§1, §35).
 */
export type SocialPlatform = 'xiaohongshu';

/**
 * Where an import's content came from.
 *
 * `unavailable` is a first-class outcome, not an error: most of these platforms
 * cannot be read automatically, and the product says so rather than pretending
 * the import worked.
 */
export type SourceAccessStatus =
  /** The traveller pasted the text themselves. The normal case. */
  | 'user_text'
  /** A public page we could read without circumventing anything. */
  | 'public_content_accessible'
  /** We have the link and whatever the platform itself publishes, nothing more. */
  | 'metadata_only'
  /** Nothing could be retrieved. The URL is still stored as provenance. */
  | 'unavailable';

/** The lifecycle of one import, as the traveller experiences it. */
export type SocialImportStatus =
  | 'draft'
  | 'processing'
  | 'review_required'
  | 'completed'
  | 'failed';

/**
 * One imported Xiaohongshu guide.
 *
 * Was `SocialGuideSource`, authored for an internal researcher, then a generic
 * "social import". It is now specifically a Xiaohongshu post — link, body text
 * and images — because that is the only source V1 reads and the only one whose
 * workflow is designed.
 */
export interface XiaohongshuImport {
  id: string;
  /**
   * Who this belongs to.
   *
   * There are no accounts yet, so this is a stable local profile id. It exists
   * now because §27 of the brief is a privacy requirement, not a later concern:
   * an import reflects private travel interests and must not silently become
   * part of a shared corpus.
   */
  ownerProfileId: string;
  /**
   * `private` is the default and the only value the traveller's own flow writes.
   * `community` is what a reviewed, aggregated contribution would become.
   */
  visibility: 'private' | 'community';

  /** Set when the import was made while planning a destination. */
  destinationId?: string;
  tripId?: string;

  platform: SocialPlatform;
  /** Provenance. Kept even when the text had to be pasted by hand. */
  sourceUrl?: string;
  title?: string;
  author?: string;

  createdAt: string;
  processedAt?: string;

  status: SocialImportStatus;
  sourceAccessStatus: SourceAccessStatus;

  /** Bumped when the extractor changes, so old results can be re-derived. */
  extractionVersion: string;
  /**
   * SHA-256 of the normalised input.
   *
   * Extraction costs money and the same guide is often pasted twice. A matching
   * hash reuses the stored result instead of paying for it again.
   */
  contentHash?: string;

  userNotes?: string;

  // --- images (§3, §4) ----------------------------------------------------
  /**
   * Ids of the `ImportImage` records that came with this post.
   *
   * Ids rather than embedded records: an import can hold twenty images and the
   * review screen re-renders constantly. Images are read from the image store,
   * and deleting the import deletes them.
   */
  imageIds: string[];
  /** Which images were read out of the post itself rather than uploaded. */
  retrievedImageCount?: number;
  /**
   * What produced the text, when something did.
   *
   * `null`/absent means the traveller pasted it — which stays the normal case on
   * a deployment with no server, and is stated in the UI rather than hidden.
   */
  retrievalProvider?: string;
  /** Human-readable note about a partial retrieval, e.g. text yes, images no. */
  retrievalNote?: string;

  /**
   * Text the traveller supplied.
   *
   * V1 does not scrape. These platforms actively prohibit it, and circumventing
   * their controls is not something this product does. Where automatic retrieval
   * is not permitted, the traveller pastes what they read — and the URL stays
   * attached as provenance.
   *
   * Held privately to this import (§26) and deletable with it.
   */
  userProvidedText?: string;
  /** Short, non-copyrightable reason the import failed, when it did. */
  failureReason?: string;
}

/**
 * Who a stored image belongs to, and therefore where it may be shown.
 *
 * THE BOUNDARY THIS TYPE EXISTS TO HOLD (§20)
 *
 * Meridian's canonical photography is licensed, attributed, and provably of the
 * subject it illustrates. An image lifted from somebody's Xiaohongshu post is
 * none of those things: it is a creator's work, it may show a place only
 * incidentally, and it was never offered to us.
 *
 * So an imported image is `private_import` by DEFAULT and there is no code path
 * that promotes it to canonical photography. `user_contributed` exists for a
 * different, future thing entirely — a traveller offering their OWN photograph
 * with explicit consent (§21) — and is deliberately not reachable from any
 * import flow. The two must never be confused.
 */
export type ImageVisibility = 'private_import' | 'user_contributed';

/** Whether anything has been read out of an image yet. */
export type ImageAnalysisStatus =
  /** Queued or waiting: images are analysed in a batch after upload. */
  | 'pending'
  /** A provider read the image and returned findings. */
  | 'analyzed'
  /** No vision provider is available in this deployment. Honest, not an error. */
  | 'unsupported'
  /** The provider was available and failed. */
  | 'failed';

/**
 * One image that arrived with an import.
 *
 * Never the bytes: this record is the catalogue entry, and the blob lives in
 * IndexedDB behind `storageReference` (§30). Keeping them apart means the
 * review screen can list fifty images without decoding fifty full-size bitmaps,
 * and it means the image store can be evicted or re-backed without touching the
 * import.
 */
export interface ImportImage {
  id: string;
  importId: string;
  ownerProfileId: string;

  /** Key into the local image store. Opaque on purpose. */
  storageReference: string;
  /** Key for the downscaled preview actually rendered in lists. */
  thumbnailReference: string;

  /** What the image is, when the traveller said. Never guessed. */
  caption?: string;

  /** `xiaohongshu` when fetched, `user_upload` when the traveller supplied it. */
  originalSource: 'xiaohongshu' | 'user_upload';
  /** Position in the post, so "图片 3" means what the traveller saw. */
  originalIndex: number;

  width?: number;
  height?: number;
  /** Bytes after downscaling. Drives the storage budget, not the quota. */
  bytes?: number;
  /** SHA-256 of the stored bytes. Identical uploads are stored once (§30). */
  contentHash?: string;

  analysisStatus: ImageAnalysisStatus;
  visibility: ImageVisibility;

  createdAt: string;
}

/**
 * What a vision provider read out of one image.
 *
 * An INTERMEDIATE INFERENCE RECORD, not a fact about the world (§32). It is
 * kept so a reviewer can see why a candidate exists, and so a later analysis run
 * with a better model can be compared against what the old one claimed. Nothing
 * here ever reaches a traveller as an assertion about a place.
 */
export interface ImageAnalysis {
  id: string;
  imageId: string;
  importId: string;

  /** Literal text visible in the image. The most defensible output. */
  detectedTexts: string[];
  candidatePlaceNames: string[];
  candidateCategories: RecommendationType[];
  /** What the scene appears to be: a beach, a menu board, a hotel lobby. */
  sceneHints: string[];
  areaHints: string[];

  /**
   * How sure the provider was, 0–1, per candidate name.
   *
   * Never rendered. It decides whether a candidate is offered as a proposal or
   * as a question (§26).
   */
  nameConfidences?: Record<string, number>;

  analysisProvider: string;
  analysisVersion: string;
  createdAt: string;
}

/**
 * A place candidate. Renamed from `SocialPlaceMention` because "mention" was
 * the wrong noun: this is a place the import believes it found, and it may have
 * been found in a picture rather than in a sentence (§9).
 */
export interface PlaceCandidate {
  id: string;
  importId: string;

  /** Exactly as the guide wrote it — text or image — before any normalisation. */
  rawName: string;
  normalizedName: string;
  /** The wider phrase it was found in. Short, and never the whole post. */
  contextText?: string;

  /** What kind of place this is. Internal English enum; the UI is Chinese. */
  entityType?: RecommendationType;

  // --- provenance: WHY this candidate exists (§9) -------------------------
  /** The post's own words named it. */
  detectedFromText: boolean;
  /** Which images it was read out of. Empty when it came from text alone. */
  detectedFromImageIds: string[];
  /**
   * Images the traveller attached by hand, or confirmed from a suggestion.
   *
   * Kept separate from `detectedFromImageIds` so a later analysis run cannot
   * overwrite a human decision (§33).
   */
  assignedImageIds: string[];
  /** One short line on why we believed this was a place. */
  detectedReason?: string;

  /** Dishes, activities or specifics the guide named. */
  extractedItems: string[];
  /** Source-derived insight. NOT a verified attribute of the place. */
  contextThemes: string[];
  positiveThemes: string[];
  warnings: string[];
  bestTimeMentioned?: string;

  areaHint?: string;
  destinationHint?: string;

  // --- resolution (§10) ---------------------------------------------------
  resolutionStatus: PlaceResolutionStatus;
  /** The Meridian place this resolved to, when it did. */
  matchedPlaceId?: string;
  matchMethod?: 'exact' | 'alias' | 'fuzzy' | 'manual' | 'external' | 'created';
  /** 0–1, for auditing. The UI speaks in bands and status words. */
  matchConfidence?: number;
  matchBand: MatchBand;
  /**
   * Candidates an external provider returned, when Meridian held nothing.
   *
   * They are OFFERED, never auto-accepted: an external hit means we found a
   * plausible place on a map, not that the guide meant it (§10, §11).
   */
  externalCandidates?: ExternalPlaceCandidate[];
  /** Set when the traveller resolved this to a place they pinned or created. */
  submittedPlaceId?: string;

  verificationStatus: MentionStatus;
  userDecision: UserDecision;

  createdAt: string;
}

/** Kept as an alias so the internal research view keeps compiling. */
export type SocialPlaceMention = PlaceCandidate;
export type SocialMention = PlaceCandidate;

/**
 * A place an external search provider knows about.
 *
 * Deliberately a small, flat record: §12 makes cost a first-class concern, so
 * the shape only carries the fields the resolution step actually uses. There is
 * no room in here for opening hours, ratings or photography, which is how a
 * cheap field-masked request stays cheap.
 */
export interface ExternalPlaceCandidate {
  providerId: 'google_places';
  /** The provider's own id, cached so the same place is never looked up twice. */
  providerPlaceId: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  /** The provider's category, verbatim, for the reviewer to interpret. */
  category?: string;
}

/**
 * Where a candidate's map position came from.
 *
 * The order is the pipeline (§10) and the value is rendered in the UI, because
 * "we know this place" and "a map search found something similar" are different
 * claims and a traveller deciding what to save deserves to see which one they
 * are getting.
 */
export type PlaceResolutionStatus =
  /** Matched against Meridian's own canonical dataset. */
  | 'meridian'
  /** Resolved through a name this profile already confirmed. */
  | 'alias'
  /** One plausible hit from an external provider. Needs the traveller's yes. */
  | 'external'
  /** Several external hits. The traveller picks, or none. */
  | 'external_multiple'
  /** Nothing anywhere. A manual pin is the only honest answer. */
  | 'unresolved'
  /** The traveller pointed at the map. */
  | 'user_pinned'
  /** The traveller created it. */
  | 'user_created';

/** The generic name, kept so older call sites and the research view compile. */
export type SocialImport = XiaohongshuImport;

/**
 * What we currently believe about a mention's relationship to a place.
 *
 * The brief's vocabulary (§8). Deliberately separate from `UserDecision`: the
 * system says whether it found a place, the traveller says whether they want it.
 * Collapsing the two made "we could not identify this" and "I do not want this"
 * the same state, which they are not.
 */
export type MentionStatus =
  /** Confidently matched to a canonical place. */
  | 'matched'
  /** Probably this place, but not confidently enough to decide alone. */
  | 'possible_match'
  /** No candidate cleared the confidence floor. */
  | 'unmatched'
  /** The traveller said this is not a place, or not this place. */
  | 'rejected';

export type RecommendationType =
  | 'restaurant'
  | 'cafe'
  | 'beachclub'
  | 'bar'
  | 'beach'
  | 'nature'
  | 'culture'
  | 'activity'
  | 'hotel'
  | 'shopping'
  | 'wellness'
  | 'area'
  /** Airports, harbours and ferry terminals a guide names as meeting points. */
  | 'transport'
  | 'unknown';

export type MentionSentiment = 'positive' | 'neutral' | 'mixed' | 'negative';

/** What the traveller decided about one extracted place. */
export type UserDecision = 'save' | 'ignore' | 'pending';

/**
 * The confidence bands the interface speaks in.
 *
 * The brief's §13, and they map onto real behaviour: HIGH is preselected, MEDIUM
 * asks, LOW does not guess. The numeric score stays for auditing; the UI never
 * shows it.
 */
export type MatchBand = 'high' | 'medium' | 'low';


/**
 * A canonical place the traveller has kept.
 *
 * Deliberately a REFERENCE, not a copy. The canonical `Place` stays the single
 * source of truth for name, coordinates and photography; saving is a pointer
 * plus provenance. Copying the record would create a second version of every
 * saved place that drifts the moment the canonical one is corrected.
 */
export interface UserSavedPlace {
  id: string;
  ownerProfileId: string;
  placeId: string;
  destinationId: string;
  /** Which import it came from, when it came from one. */
  sourceImportId?: string;
  /**
   * The images the traveller chose to carry with this saved place (§22).
   *
   * References into their own import, never copies, and never promoted to the
   * public gallery. This is what makes "the two photos I liked from that post"
   * survive into the trip without Meridian republishing anybody's work.
   */
  selectedImportImageIds?: string[];
  savedAt: string;
  /** The traveller's own note. Private to them. */
  note?: string;
}

/**
 * An image attached to a place, and who decided that.
 *
 * A separate record rather than a field on the candidate, because §33 asks for
 * something specific: a human correction must outlive a later analysis run. The
 * `source` field is what makes that possible — `user` rows are never rewritten
 * by the machine, and a re-analysis only ever replaces `suggested` rows.
 */
export interface ImagePlaceAssignment {
  id: string;
  importId: string;
  imageId: string;
  candidateId: string;
  source: 'suggested' | 'user';
  createdAt: string;
}

export type SubmissionStatus = 'pending_verification' | 'accepted' | 'rejected';

/**
 * A place a traveller says exists but Meridian does not hold.
 *
 * It is NEVER written into the canonical dataset. It lives here, pending review,
 * so a wrong or duplicate submission cannot degrade the place data every other
 * traveller sees.
 */
export interface UserPlaceSubmission {
  id: string;
  ownerProfileId: string;
  destinationId: string;
  name: string;
  nameZh?: string;
  recommendationType: RecommendationType;
  areaId?: string;
  coordinates?: Coordinates;
  /** Where the traveller heard about it. */
  sourceImportId?: string;
  sourceUrl?: string;
  note?: string;
  status: SubmissionStatus;
  createdAt: string;
}

/**
 * A name a guide used that we now know means a particular place.
 *
 * The learning loop from §31. "La Brisa Bali" resolving to La Brisa is knowledge
 * worth keeping: it turns a medium-confidence guess into an exact hit next time,
 * for this traveller and — once reviewed — for everyone.
 */
export interface PlaceAlias {
  id: string;
  alias: string;
  normalizedAlias: string;
  placeId: string;
  source: 'user_confirmed' | 'reviewed' | 'imported';
  /** 0–1. A user's own confirmation is 1. */
  confidence: number;
  /** Null when the alias came from a reviewed contribution. */
  ownerProfileId?: string;
  createdAt: string;
}

/** A place discovered through research that has not earned canonical status yet. */
export interface CandidatePlace {
  id: string;
  name: string;
  nameZh?: string;
  city: string;
  areaId?: string;
  areaHint?: string;
  recommendationType: RecommendationType;
  suggestedBy: string[];
  coordinates?: Coordinates;
  /** A short paraphrase written by the reviewer. Never copied text. */
  notes?: string;
  status: MentionStatus;
  createdAt: string;
}
