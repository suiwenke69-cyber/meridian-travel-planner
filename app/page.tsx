import type { Metadata } from 'next';
import RegionExplorer from '@/components/region/RegionExplorer';

/*
 * Metadata is server-rendered and the locale is client-side (the site is
 * statically exported and must not read request state), so this is authored in
 * the product's primary language with the English phrase alongside it. A search
 * result in Chinese still shows the English name of the product.
 */
export const metadata: Metadata = {
  title: 'Meridian — 先选出发地，在地图上决定下一趟去哪',
  description:
    '在新加坡出发的东南亚地图上选下一个目的地。比较飞行时间、住哪里、以及谁离谁真的近——在地图上看清楚再订票。Map-first Southeast Asia trip planner.',
};

export default function HomePage() {
  return (
    <main className="h-[100dvh] w-full">
      <RegionExplorer />
    </main>
  );
}
