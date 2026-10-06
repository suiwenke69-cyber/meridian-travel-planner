import type { Metadata } from 'next';
import RegionExplorer from '@/components/region/RegionExplorer';

export const metadata: Metadata = {
  title: 'Meridian — Where to go next, decided on a map',
  description:
    'Pick your next Southeast Asia trip from Singapore on an interactive map. Compare flight time, where to stay and what is actually near what — before you book anything.',
};

export default function HomePage() {
  return (
    <main className="h-[100dvh] w-full">
      <RegionExplorer />
    </main>
  );
}
