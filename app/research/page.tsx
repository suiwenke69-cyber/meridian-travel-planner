import type { Metadata } from 'next';
import ResearchClient from './ResearchClient';

/**
 * The research inbox.
 *
 * An internal route rather than a fifth tab: a traveller planning a trip has no
 * business reviewing extracted mentions, and the brief was explicit that this
 * should not dominate the normal product. It is server-rendered as a shell so
 * the static export can still pre-render it.
 */
export const metadata: Metadata = {
  title: '攻略研究 · Meridian',
  description: '把攻略里提到的地方整理成可核实的地点。内部页面。',
  robots: { index: false, follow: false },
};

export default function ResearchPage() {
  return <ResearchClient />;
}
