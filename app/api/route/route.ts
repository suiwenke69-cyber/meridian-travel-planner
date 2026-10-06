import { NextResponse } from 'next/server';
import { getServerRoutingProvider } from '@/lib/routing/server-providers';
import type { RouteRequest } from '@/lib/types';

/**
 * Server-side routing proxy.
 *
 * Keyed routing providers (OpenRouteService, Mapbox, Google) are only ever
 * called from here, so credentials never reach the browser. With no key
 * configured this returns 501 and the client falls back to the keyless OSRM
 * endpoint — or reports the route as unavailable.
 */
export async function POST(request: Request) {
  const provider = getServerRoutingProvider();
  if (!provider) {
    return NextResponse.json(
      { error: 'no_server_routing_provider', message: 'No keyed routing provider is configured.' },
      { status: 501 },
    );
  }

  let body: RouteRequest;
  try {
    body = (await request.json()) as RouteRequest;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  if (!body?.origin || !body?.destination) {
    return NextResponse.json({ error: 'bad_request', message: 'origin and destination are required' }, { status: 400 });
  }

  const result = await provider.route({ ...body, profile: body.profile ?? 'driving' });
  return NextResponse.json(result);
}
