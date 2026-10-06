import type { FlightDataProvider, FlightRouteOption } from '../../types';
import { isConfigured as amadeusConfigured, amadeusFlightProvider } from './amadeus';
import { isConfigured as skyscannerConfigured, skyscannerFlightProvider } from './skyscanner';

/**
 * Flight data provider registry.
 *
 * V1 ships with `static` (curated, offline, no prices). Amadeus and Skyscanner
 * adapters exist so the integration surface is real, but they report
 * `isConfigured() === false` without credentials and the UI degrades to
 * "Live flight data not configured" instead of failing.
 */

export const staticFlightProvider: FlightDataProvider = {
  id: 'static',
  label: 'Curated route data',
  isConfigured: () => true,
  async search() {
    // Route facts live on the destination's airport records; the static
    // provider is a lookup helper rather than a network call.
    return [];
  },
};

export function listFlightProviders(): FlightDataProvider[] {
  return [staticFlightProvider, amadeusFlightProvider, skyscannerFlightProvider];
}

export function getFlightProvider(): FlightDataProvider {
  const requested = (process.env.FLIGHT_PROVIDER ?? 'static').trim().toLowerCase();
  if (requested === 'amadeus' && amadeusConfigured()) return amadeusFlightProvider;
  if (requested === 'skyscanner' && skyscannerConfigured()) return skyscannerFlightProvider;
  return staticFlightProvider;
}

export interface LiveFlightStatus {
  providerId: string;
  providerLabel: string;
  live: boolean;
  message: string;
}

/** Drives the "sample data vs live data" badge in the transport panel. */
export function liveFlightStatus(): LiveFlightStatus {
  const provider = getFlightProvider();
  if (provider.id === 'static') {
    return {
      providerId: 'static',
      providerLabel: 'Curated route data',
      live: false,
      message:
        'Flight times and airlines are curated sample data. No live prices are shown — ticket pricing is a V2 integration.',
    };
  }
  return {
    providerId: provider.id,
    providerLabel: provider.label,
    live: true,
    message: `Live inventory via ${provider.label}.`,
  };
}

export async function searchRoutes(originCode: string, destinationCode: string): Promise<FlightRouteOption[]> {
  const provider = getFlightProvider();
  if (provider.id === 'static') return [];
  try {
    return await provider.search(originCode, destinationCode);
  } catch {
    return [];
  }
}

export { amadeusConfigured, skyscannerConfigured };
