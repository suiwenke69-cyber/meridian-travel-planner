import type { RouteRequest, RouteResult, RoutingProvider } from '../types';
import { unavailable } from './osrm';

/**
 * Server-only routing providers.
 *
 * These hold API keys, so they are NEVER called from the browser. The client
 * posts to `/api/route`, which picks a configured provider here. All three are
 * inert without credentials, and the UI degrades to "route unavailable" rather
 * than inventing a duration.
 *
 * They exist so that swapping the routing vendor is a configuration change —
 * the product code only ever sees `RouteResult`.
 */

const TIMEOUT_MS = 8000;

async function postJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** OpenRouteService — free tier with an API key, real road routing. */
export const openRouteServiceProvider: RoutingProvider = {
  id: 'openrouteservice',
  label: 'OpenRouteService',
  serverOnly: true,
  costNote: 'Free tier with a registered API key; rate limited.',
  isConfigured: () => Boolean(process.env.OPENROUTESERVICE_API_KEY),
  async route(request: RouteRequest): Promise<RouteResult> {
    const key = process.env.OPENROUTESERVICE_API_KEY;
    if (!key) return unavailable('openrouteservice', 'OpenRouteService', 'No API key configured.');
    const profile = request.profile === 'walking' ? 'foot-walking' : request.profile === 'cycling' ? 'cycling-regular' : 'driving-car';
    try {
      const data = (await postJson(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
        method: 'POST',
        headers: { Authorization: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: [
            [request.origin.lng, request.origin.lat],
            [request.destination.lng, request.destination.lat],
          ],
        }),
      })) as {
        features?: Array<{
          properties?: { summary?: { distance?: number; duration?: number } };
          geometry?: { coordinates?: [number, number][] };
        }>;
      };
      const feature = data.features?.[0];
      const summary = feature?.properties?.summary;
      if (!summary?.distance || !summary?.duration) {
        return unavailable('openrouteservice', 'OpenRouteService', 'No route returned.');
      }
      return {
        providerId: 'openrouteservice',
        providerLabel: 'OpenRouteService',
        status: 'ok',
        distanceMeters: Math.round(summary.distance),
        durationSeconds: Math.round(summary.duration),
        geometry: feature?.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) ?? null,
        source: 'routing-engine',
      };
    } catch (error) {
      return unavailable('openrouteservice', 'OpenRouteService', error instanceof Error ? error.message : 'Request failed.');
    }
  },
};

/** Mapbox Directions — metered, excellent geometry. */
export const mapboxDirectionsProvider: RoutingProvider = {
  id: 'mapbox',
  label: 'Mapbox Directions',
  serverOnly: true,
  costNote: 'Metered — free tier then paid.',
  isConfigured: () => Boolean(process.env.MAPBOX_DIRECTIONS_TOKEN),
  async route(request: RouteRequest): Promise<RouteResult> {
    const token = process.env.MAPBOX_DIRECTIONS_TOKEN;
    if (!token) return unavailable('mapbox', 'Mapbox Directions', 'No access token configured.');
    const profile = request.profile === 'walking' ? 'walking' : request.profile === 'cycling' ? 'cycling' : 'driving';
    const coords = `${request.origin.lng},${request.origin.lat};${request.destination.lng},${request.destination.lat}`;
    try {
      const data = (await postJson(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?geometries=geojson&overview=full&access_token=${token}`,
        { method: 'GET' },
      )) as { routes?: Array<{ distance: number; duration: number; geometry?: { coordinates: [number, number][] } }> };
      const route = data.routes?.[0];
      if (!route) return unavailable('mapbox', 'Mapbox Directions', 'No route returned.');
      return {
        providerId: 'mapbox',
        providerLabel: 'Mapbox Directions',
        status: 'ok',
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        geometry: route.geometry?.coordinates.map(([lng, lat]) => ({ lat, lng })) ?? null,
        source: 'routing-engine',
      };
    } catch (error) {
      return unavailable('mapbox', 'Mapbox Directions', error instanceof Error ? error.message : 'Request failed.');
    }
  },
};

/** Google Routes API — the most accurate traffic model, and the most expensive. */
export const googleRoutesProvider: RoutingProvider = {
  id: 'google',
  label: 'Google Routes',
  serverOnly: true,
  costNote: 'Metered per request; the most accurate traffic model of the three.',
  isConfigured: () => Boolean(process.env.GOOGLE_ROUTES_API_KEY),
  async route(request: RouteRequest): Promise<RouteResult> {
    const key = process.env.GOOGLE_ROUTES_API_KEY;
    if (!key) return unavailable('google', 'Google Routes', 'No API key configured.');
    const travelMode = request.profile === 'walking' ? 'WALK' : request.profile === 'cycling' ? 'BICYCLE' : 'DRIVE';
    try {
      const data = (await postJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: request.origin.lat, longitude: request.origin.lng } } },
          destination: { location: { latLng: { latitude: request.destination.lat, longitude: request.destination.lng } } },
          travelMode,
        }),
      })) as { routes?: Array<{ distanceMeters?: number; duration?: string }> };
      const route = data.routes?.[0];
      if (!route?.distanceMeters || !route.duration) {
        return unavailable('google', 'Google Routes', 'No route returned.');
      }
      return {
        providerId: 'google',
        providerLabel: 'Google Routes',
        status: 'ok',
        distanceMeters: route.distanceMeters,
        durationSeconds: Number.parseInt(route.duration.replace('s', ''), 10),
        // The encoded polyline is intentionally not decoded here; the map falls
        // back to a straight corridor rather than rendering a wrong line.
        geometry: null,
        source: 'routing-engine',
      };
    } catch (error) {
      return unavailable('google', 'Google Routes', error instanceof Error ? error.message : 'Request failed.');
    }
  },
};

export const SERVER_ROUTING_PROVIDERS = [
  openRouteServiceProvider,
  mapboxDirectionsProvider,
  googleRoutesProvider,
];

export function getServerRoutingProvider(): RoutingProvider | null {
  const requested = (process.env.ROUTING_PROVIDER ?? '').trim().toLowerCase();
  if (requested) {
    const match = SERVER_ROUTING_PROVIDERS.find((p) => p.id === requested);
    if (match?.isConfigured()) return match;
  }
  return SERVER_ROUTING_PROVIDERS.find((p) => p.isConfigured()) ?? null;
}
