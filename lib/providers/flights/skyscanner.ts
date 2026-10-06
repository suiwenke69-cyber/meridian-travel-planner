import type { FlightDataProvider, FlightRouteOption } from '../../types';

/** Skyscanner-compatible partner API adapter (scaffold). Server-only. */
export function isConfigured(): boolean {
  return Boolean(process.env.SKYSCANNER_API_KEY);
}

export const skyscannerFlightProvider: FlightDataProvider = {
  id: 'skyscanner',
  label: 'Skyscanner partner API',
  isConfigured,
  async search(originCode: string, destinationCode: string): Promise<FlightRouteOption[]> {
    if (!isConfigured()) throw new Error('Skyscanner API key is not configured');
    throw new Error(
      `Skyscanner live search for ${originCode}→${destinationCode} is not implemented in V1. ` +
        'See ROADMAP.md (V2 — live flight prices).',
    );
  },
};
