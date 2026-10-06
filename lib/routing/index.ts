import type { Coordinates, RouteRequest, RouteResult, RoutingProvider } from '../types';
import { createOsrmProvider, osrmBaseUrl, unavailable } from './osrm';

export { createOsrmProvider, osrmBaseUrl } from './osrm';
export { SERVER_ROUTING_PROVIDERS, getServerRoutingProvider } from './server-providers';

/**
 * Routing is a swappable concern.
 *
 * The product only ever sees `RouteResult`, which cannot carry a number unless a
 * provider actually produced one. There is deliberately no "best effort"
 * estimator in this layer: an unavailable route is reported as unavailable, so
 * the itinerary shows "Route unavailable" rather than a plausible-looking
 * duration nobody measured.
 *
 * Geographic estimation lives in `lib/routing/geodesic.ts` and is used ONLY by
 * the route-efficiency heuristics, where it is labelled as a heuristic.
 */

export type RoutingProviderId = 'osrm' | 'openrouteservice' | 'mapbox' | 'google' | 'none';

/** Providers that run in the browser and need no key. */
export function getClientRoutingProvider(): RoutingProvider {
  const requested = (process.env.NEXT_PUBLIC_ROUTING_PROVIDER ?? 'osrm').trim().toLowerCase();
  if (requested === 'none') {
    return {
      id: 'none',
      label: 'No routing provider',
      serverOnly: false,
      costNote: 'Routing is disabled by configuration.',
      isConfigured: () => false,
      async route() {
        return unavailable('none', 'No routing provider', 'Routing is disabled by configuration.');
      },
    };
  }
  return createOsrmProvider(osrmBaseUrl());
}

/** True when a keyed, server-side provider is configured. Mirrors the server registry. */
export function serverRoutingConfigured(): boolean {
  return Boolean(
    process.env.OPENROUTESERVICE_API_KEY ||
      process.env.MAPBOX_DIRECTIONS_TOKEN ||
      process.env.GOOGLE_ROUTES_API_KEY,
  );
}

const cache = new Map<string, RouteResult>();
const MAX_CACHE = 240;

function cacheKey(request: RouteRequest): string {
  const { origin, destination, profile } = request;
  return `${profile}:${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
}

/**
 * Resolves a single route, preferring a configured server provider and falling
 * back to the browser-safe OSRM endpoint.
 *
 * Cached in memory per point pair, so selecting days repeatedly does not
 * re-request the same legs.
 */
export async function requestRoute(
  origin: Coordinates,
  destination: Coordinates,
  profile: RouteRequest['profile'] = 'driving',
): Promise<RouteResult> {
  const request: RouteRequest = { origin, destination, profile };
  const key = cacheKey(request);
  const cached = cache.get(key);
  if (cached) return cached;

  let result: RouteResult;

  if (serverRoutingConfigured()) {
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      result = response.ok
        ? ((await response.json()) as RouteResult)
        : unavailable('none', 'Routing provider', `Routing service responded ${response.status}.`);
    } catch {
      result = await getClientRoutingProvider().route(request);
    }
  } else {
    result = await getClientRoutingProvider().route(request);
  }

  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, result);
  return result;
}

/** Human label for where a route's numbers came from. */
export function routeSourceLabel(result: RouteResult): string {
  if (result.status === 'unavailable') return 'Route unavailable';
  return result.providerLabel;
}

/**
 * Route-efficiency heuristics still need a fast, synchronous sense of scale.
 * `estimateLeg` is exported ONLY for that purpose and is labelled as a
 * geographic heuristic wherever it surfaces.
 */
export { GEODESIC_MODEL, GEODESIC_LABEL, estimateLeg } from './geodesic';
