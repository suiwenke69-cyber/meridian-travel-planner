'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconChevronDown, IconChevronUp } from './icons';

export type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_ORDER: SheetSnap[] = ['peek', 'half', 'full'];

function snapHeights(viewportHeight: number, peekHeight: number): Record<SheetSnap, number> {
  return {
    peek: peekHeight,
    half: Math.round(viewportHeight * 0.52),
    full: Math.round(viewportHeight * 0.9),
  };
}

/**
 * Mobile bottom sheet with three snap points.
 *
 * The map stays visible and interactive above the sheet, which is the whole
 * point of a map-first planner. Drag is pointer-based (mouse + touch) and the
 * handle is also a real button that cycles snap points, so it works with a
 * keyboard and screen reader.
 */
export function BottomSheet({
  snap,
  onSnapChange,
  header,
  children,
  className,
  ariaLabel,
  peekHeight = 116,
}: {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  header: ReactNode;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
  /** Height of the collapsed state. Tuned per screen. */
  peekHeight?: number;
}) {
  const [viewportHeight, setViewportHeight] = useState(800);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const heights = useMemo(() => snapHeights(viewportHeight, peekHeight), [viewportHeight, peekHeight]);
  const height = Math.max(72, heights[snap] - dragOffset);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
      dragState.current = { startY: event.clientY, startHeight: heights[snap] };
      setDragging(true);
    },
    [heights, snap],
  );

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const delta = event.clientY - dragState.current.startY;
    setDragOffset(delta);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragState.current) return;
    const finalHeight = dragState.current.startHeight - dragOffset;
    dragState.current = null;
    setDragging(false);
    setDragOffset(0);
    const candidates = SNAP_ORDER.map((key) => ({ key, distance: Math.abs(heights[key] - finalHeight) }));
    candidates.sort((a, b) => a.distance - b.distance);
    const next = candidates[0]?.key ?? snap;
    if (next !== snap) onSnapChange(next);
  }, [dragOffset, heights, onSnapChange, snap]);

  const cycle = useCallback(() => {
    const index = SNAP_ORDER.indexOf(snap);
    onSnapChange(SNAP_ORDER[(index + 1) % SNAP_ORDER.length]);
  }, [onSnapChange, snap]);

  return (
    <section
      data-testid="mobile-sheet"
      ref={sheetRef}
      aria-label={ariaLabel}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[600] flex flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[0_-8px_40px_-16px_rgba(20,22,26,0.35)] lg:hidden',
        className,
      )}
      style={{
        height,
        transition: dragging ? 'none' : 'height 260ms cubic-bezier(0.22,0.61,0.36,1)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-1.5 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="h-1 w-10 rounded-full bg-line-strong" />
        <button
          type="button"
          onClick={cycle}
          className="mt-1 flex w-full items-center justify-between gap-3 px-3 pb-1.5 pt-0.5 text-left"
          aria-label={ariaLabel}
        >
          <span className="min-w-0 flex-1">{header}</span>
          <span className="shrink-0 text-muted">
            {snap === 'full' ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
          </span>
        </button>
      </div>
      <div className="scroll-area min-h-0 flex-1 border-t border-line">{children}</div>
    </section>
  );
}
