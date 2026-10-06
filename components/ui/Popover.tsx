'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useEscapeKey } from '@/lib/hooks';

/**
 * Minimal anchored popover. Deliberately dependency-free and accessible:
 * Escape closes, clicking outside closes, and the trigger keeps focus.
 */
export function Popover({
  trigger,
  children,
  align = 'start',
  side = 'bottom',
  className,
  panelClassName,
  ariaLabel,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode | ((props: { close: () => void }) => ReactNode);
  align?: 'start' | 'end';
  side?: 'bottom' | 'top';
  className?: string;
  panelClassName?: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className={cn(
            'absolute z-[700] min-w-[220px] rounded-panel border border-line bg-surface p-1 shadow-float',
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            align === 'start' ? 'left-0' : 'right-0',
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
