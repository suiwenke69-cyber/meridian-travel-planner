import { Suspense } from 'react';
import TripDetailClient from './TripDetailClient';

/**
 * The trip detail route.
 *
 * A server component wrapping the client one for exactly one reason: the page
 * reads `?id=`, and `useSearchParams` has to sit inside a Suspense boundary or
 * the static export refuses to prerender it. The boundary is real rather than
 * decorative — without it the build fails, which is how this was found.
 */
export default function TripDetailPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-paper" />}>
      <TripDetailClient />
    </Suspense>
  );
}
