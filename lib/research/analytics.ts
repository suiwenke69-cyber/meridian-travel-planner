/**
 * Product analytics.
 *
 * Privacy-conscious by construction, not by policy: the event shape has no field
 * that could carry pasted content, a URL, a place name or a user id. §35 of the
 * brief asks for the events; the way to guarantee the rule is to make the shape
 * incapable of breaking it.
 *
 * Nothing is sent anywhere today — there is no endpoint and no third party. The
 * calls are here so that the funnel can be measured the moment one exists, and
 * so the decision about what to measure was made before the data was available.
 */

export type AnalyticsEvent =
  /** The traveller opened the import flow. */
  | 'social_import_started'
  /** An extractor returned at least one candidate. */
  | 'social_import_processed'
  | 'social_import_failed'
  /** A human confirmed a medium-confidence match. */
  | 'place_match_confirmed'
  /** A place was created from an import. */
  | 'place_created_from_import'
  | 'import_place_saved'
  | 'import_place_added_to_trip';

/** Only countable, non-identifying values. No free text, ever. */
export interface AnalyticsProperties {
  platform?: string;
  destinationId?: string;
  /** How many places the extractor found. */
  candidateCount?: number;
  /** How many were matched to a canonical place. */
  matchedCount?: number;
  /** How many the traveller chose to keep. */
  savedCount?: number;
  providerId?: string;
  /** Machine-readable reason, never a message or a stack trace. */
  failureCode?: string;
  /** Which path the match came from: exact, alias, fuzzy, manual. */
  matchMethod?: string;
}

type Sink = (event: AnalyticsEvent, properties: AnalyticsProperties) => void;

const buffer: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; at: string }> = [];

/**
 * The default sink keeps a bounded in-memory ring.
 *
 * Useful for local development and for an honest answer to "what would you
 * send?"; bounded so a long session cannot grow the heap.
 */
const defaultSink: Sink = (event, properties) => {
  buffer.push({ event, properties, at: new Date().toISOString() });
  if (buffer.length > 200) buffer.shift();
};

let sink: Sink = defaultSink;

export function setAnalyticsSink(next: Sink) {
  sink = next;
}

export function track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  try {
    sink(event, properties);
  } catch {
    // Analytics must never break the product.
  }
}

export function recentEvents() {
  return [...buffer];
}

/** Funnel the brief's §36 metrics are computed from. */
export const FUNNEL_STEPS: AnalyticsEvent[] = [
  'social_import_started',
  'social_import_processed',
  'import_place_saved',
  'import_place_added_to_trip',
];
