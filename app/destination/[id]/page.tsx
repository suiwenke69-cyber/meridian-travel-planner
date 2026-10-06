import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDestination, getDestinationIds } from '@/lib/data';
import DestinationPlanner from '@/components/destination/DestinationPlanner';

export function generateStaticParams() {
  return getDestinationIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const destination = getDestination(id);
  if (!destination) return { title: 'Destination not found' };
  return {
    title: `${destination.name} planner`,
    description: destination.description.slice(0, 160),
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = getDestination(id);
  if (!destination) notFound();
  return <DestinationPlanner destinationId={destination.id} />;
}
