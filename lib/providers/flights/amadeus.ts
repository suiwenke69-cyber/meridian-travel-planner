import type { FlightDataProvider, FlightRouteOption } from '../../types';

/**
 * Amadeus Self-Service adapter (scaffold).
 *
 * Deliberately server-only: credentials must never reach the browser. Wire this
 * up by adding a route handler at `app/api/flights/route.ts` that calls
 * `search()` — the client already talks to `lib/providers/flights` through a
 * provider-neutral interface.
 */
export function isConfigured(): boolean {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

export const amadeusFlightProvider: FlightDataProvider = {
  id: 'amadeus',
  label: 'Amadeus Self-Service',
  isConfigured,
  async search(originCode: string, destinationCode: string): Promise<FlightRouteOption[]> {
    if (!isConfigured()) throw new Error('Amadeus credentials are not configured');
    // Intentionally not implemented in V1: no live fare data is shown anywhere
    // in the product until a full, tested integration exists.
    throw new Error(
      `Amadeus live search for ${originCode}→${destinationCode} is not implemented in V1. ` +
        'See ROADMAP.md (V2 — live flight prices).',
    );
  },
};
