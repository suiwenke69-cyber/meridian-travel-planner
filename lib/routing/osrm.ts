import type { Coordinates, RouteRequest, RouteResult, RoutingProvider } from '../types';

/**
 * OSRM — the shipped default.
 *
 * Free, keyless and CORS-enabled, which matters because this app has no backend
 * for routing. Works against the public demo server in development and against
 * a self-hosted OSRM in production by changing one environment variable.
 *
 * Note what it does NOT do: model traffic. The duration it returns is a
 * free-flow estimate, and the UI says so rather than implying a live ETA.
 */

const DEFAULT_BASE_URL = 'https://router.project-osrm.org';
const TIMEOUT_MS = 7000;

export function osrmBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_OSRM_BASE_URL?.replace(/\/$/, '') ||
    process.env.OSRM_BASE_URL?.replace(/\/$/, '') ||
    DEFAULT_BASE_URL
  );
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { type: 'LineString'; coordinates: [number, number][] };
  }>;
  message?: string;
}

function profilePath(profile: RouteRequest['profile']): string {
  // The public demo server only exposes the driving profile; requesting a
  // cycling or walking path would silently return a car route, which is exactly
  // the kind of quiet lie this product avoids. Callers who need another profile
  // must configure a real routing provider.
  void profile;
  return 'driving';
}

export function createOsrmProvider(baseUrl = osrmBaseUrl()): RoutingProvider {
  return {
    id: 'osrm',
    label: 'OSRM road routing',
    serverOnly: false,
    costNote: 'Free and keyless. The public demo server is rate-limited; self-host for production.',
    isConfigured: () => Boolean(baseUrl),
    async route(request: RouteRequest): Promise<RouteResult> {
      const { origin, destination } = request;
      const coords = `${origin.lng.toFixed(6)},${origin.lat.toFixed(6)};${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`;
      const url = `${baseUrl}/route/v1/${profilePath(request.profile)}/${coords}?overview=full&geometries=geojson&steps=false`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) {
          return unavailable('osrm', 'OSRM road routing', `Routing service responded ${response.status}.`);
        }
        const data = (await response.json()) as OsrmResponse;
        if (data.code !== 'Ok' || !data.routes?.length) {
          return unavailable('osrm', 'OSRM road routing', data.message ?? 'No road route between these points.');
        }
        const route = data.routes[0];
        const geometry: Coordinates[] | null =
          route.geometry?.coordinates.map(([lng, lat]) => ({ lat, lng })) ?? null;
        return {
          providerId: 'osrm',
          providerLabel: 'OSRM road routing',
          status: 'ok',
          distanceMeters: Math.round(route.distance),
          durationSeconds: Math.round(route.duration),
          geometry,
          source: 'routing-engine',
        };
      } catch (error) {
        return unavailable(
          'osrm',
          'OSRM road routing',
          error instanceof Error && error.name === 'AbortError'
            ? 'Routing service timed out.'
            : 'Routing service unreachable.',
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function unavailable(providerId: string, providerLabel: string, note: string): RouteResult {
  return {
    providerId,
    providerLabel,
    status: 'unavailable',
    distanceMeters: null,
    durationSeconds: null,
    geometry: null,
    source: 'unavailable',
    note,
  };
}

export const osrmRoutingProvider = createOsrmProvider();
