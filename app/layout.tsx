import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Meridian — Map-first Southeast Asia trip planner',
    template: '%s · Meridian',
  },
  description:
    'Plan trips from Singapore across Southeast Asia on a map. Compare Marriott Bonvoy and Hilton Honors hotels, see where the attractions actually are, and build a geographically sensible itinerary.',
  applicationName: 'Meridian',
  keywords: [
    'Southeast Asia travel planner',
    'Bali itinerary map',
    'Singapore traveller',
    'Marriott Bonvoy Bali',
    'Hilton Honors Bali',
  ],
  openGraph: {
    title: 'Meridian — Map-first Southeast Asia trip planner',
    description:
      'Where to go, where to stay and how to arrange it — decided on a map, from Singapore.',
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
