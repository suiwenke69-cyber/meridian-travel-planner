import type { Metadata, Viewport } from 'next';
import { message } from '@/lib/i18n/use-t';
import './globals.css';

/**
 * Metadata is server-rendered, so it is authored in the product's primary
 * language rather than read from the client locale store. The English tagline
 * stays as a secondary phrase, which is the one thing a search result written
 * in Chinese most needs alongside it.
 */
const taglineEn = 'Map-first Southeast Asia trip planner from Singapore';
const appName = message('zh-CN', 'app.name');

export const metadata: Metadata = {
  title: {
    default: `${message('zh-CN', 'app.tagline')} · ${appName}`,
    template: `%s · ${appName}`,
  },
  description: message('zh-CN', 'app.description'),
  applicationName: appName,
  keywords: [
    '东南亚旅行规划',
    '新加坡出发',
    '巴厘岛行程地图',
    '万豪巴厘岛酒店',
    '希尔顿巴厘岛酒店',
    'Map-first Southeast Asia trip planner',
  ],
  openGraph: {
    title: `${message('zh-CN', 'app.tagline')} · ${appName}`,
    description: `${message('zh-CN', 'region.subtitle')} ${taglineEn}.`,
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF9F6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
