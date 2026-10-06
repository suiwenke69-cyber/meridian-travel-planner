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
  city: string;
  coordinates: Geocoded;
  role: 'primary' | 'secondary';
  /** True when a scheduled non-stop service from Singapore exists. */
  directFromSingapore: boolean;
  /** Block-time band in minutes. Sample data, not a live schedule. */
  flightMinutes?: { min: number; max: number };
  /** Recurring carriers observed on the route. Sample data. */
  airlines?: string[];
  flightNote?: string;
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
export type AreaSeed = Omit<Area, 'images' | 'tagline'>;
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
  /** One short sentence explaining the recommendation. */
  rationale: string;
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
  | 'activity'
  | 'nature'
  | 'beach'
  | 'food'
  | 'nightlife'
  | 'airport'
  | 'transport';

export type HotelGroupId = 'marriott' | 'hilton';

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
  /** One line on how you actually get there, e.g. "酒店包车或 Grab，约 30 分钟". */
  transportContext?: string;
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
  areaId?: string;
  areaName?: string;
  lat: number;
  lng: number;
  /** Used by the route-efficiency engine and the day timeline. */
  durationMin?: number;
  note?: string;
  /** Pinned items keep their position when the day is auto-sorted. */
  pinned?: boolean;
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
}

export type LoyaltyProgrammeId = 'marriott-bonvoy' | 'hilton-honors';

export interface Trip {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

/** Everything the trip store needs to create a trip. */
export interface TripDraft {
  destinationId: string;
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

export type SocialPlatform =
  | 'xiaohongshu'
  | 'douyin'
  | 'tiktok'
  | 'instagram'
  | 'youtube'
  | 'bilibili'
  | 'blog'
  /** Text the researcher typed or pasted from a source we cannot legally fetch. */
  | 'manual'
  | 'other';

/**
 * The review state of an imported guide.
 *
 * `unprocessed` → the URL is stored, nothing extracted yet.
 * `extracted`   → mentions pulled out, awaiting matching/verification.
 * `done`        → reviewed; its mentions are either accepted or dismissed.
 */
export type SocialGuideStatus = 'unprocessed' | 'extracted' | 'done' | 'ignored';

export interface SocialGuideSource {
  id: string;
  platform: SocialPlatform;
  /** Provenance. Kept even when the text had to be pasted by hand. */
  url?: string;
  title?: string;
  author?: string;
  /** ISO timestamp. */
  importedAt: string;
  userNotes?: string;
  /**
   * Text the researcher supplied.
   *
   * V1 does not scrape. The platforms this feature targets actively prohibit it,
   * and circumventing their controls is not something this product does. Where
   * automatic retrieval is not permitted, the researcher pastes what they read —
   * and the URL stays attached as provenance.
   */
  rawText?: string;
  status: SocialGuideStatus;
  /** Set once extraction has run. */
  extractedAt?: string;
}

/** Where a mention sits in the review pipeline. */
export type MentionStatus =
  /** Extracted, not yet matched to a canonical place. */
  | 'pending'
  /** Matched to an existing canonical place. Awaiting a human yes/no. */
  | 'matched'
  /** No confident match. A human must decide: new place, or nothing. */
  | 'needs-review'
  /** Accepted. May contribute to the place's social signals. */
  | 'accepted'
  /** Rejected — not a place, wrong place, or not useful. */
  | 'dismissed';

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
  | 'unknown';

export type MentionSentiment = 'positive' | 'neutral' | 'mixed' | 'negative';

export interface SocialMention {
  id: string;
  sourceId: string;
  /** Exactly as it appeared in the guide, before any normalisation. */
  rawPlaceName: string;
  /** Cleaned for matching: lowercased, punctuation and suffixes stripped. */
  normalizedPlaceName: string;
  /** The canonical Meridian place this was matched to, if any. */
  matchedPlaceId?: string;
  /** How the match was decided, so a reviewer can audit it. */
  matchMethod?: 'exact' | 'alias' | 'fuzzy' | 'manual';
  /** 0–1. Below the confidence floor the mention is marked 需要确认. */
  matchConfidence?: number;
  recommendationType: RecommendationType;
  sentiment: MentionSentiment;
  /** Short, paraphrased note. Never a copied post. */
  extractedNotes?: string;
  /** Dishes, activities or specifics the guide named. */
  recommendedItems: string[];
  areaHint?: string;
  status: MentionStatus;
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
