'use client';

import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n/use-t';
import { cn } from '@/lib/utils';
import type { DataConfidence } from '@/lib/types';
import { IconAlert, IconCheck, IconInfo } from './icons';

export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'muted';
  className?: string;
}) {
  const tones = {
    neutral: 'border-line bg-paper text-ink-soft',
    accent: 'border-accent/20 bg-accent-soft text-accent',
    warn: 'border-warn/25 bg-warn/[0.08] text-warn',
    danger: 'border-danger/25 bg-danger/[0.07] text-danger',
    muted: 'border-transparent bg-black/[0.04] text-muted',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-2xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Honesty badge. Every coordinate in the product is labelled, because a planner
 * that quietly mixes surveyed and guessed positions is worse than no planner.
 */
export function ConfidenceBadge({ confidence, compact = false }: { confidence: DataConfidence; compact?: boolean }) {
  const t = useT();
  if (confidence === 'verified') {
    return (
      <span
        className="inline-flex items-center gap-1 text-2xs font-medium text-nature"
        title={t('confidence.verifiedHint')}
      >
        <IconCheck size={11} />
        {!compact && t('label.verifiedLocation')}
      </span>
    );
  }
  if (confidence === 'approximate') {
    return (
      <span
        className="inline-flex items-center gap-1 text-2xs font-medium text-warn"
        title={t('confidence.approximateHint')}
      >
        <IconInfo size={11} />
        {!compact && t('label.approximateLocation')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-2xs font-medium text-muted" title={t('confidence.demoHint')}>
      <IconInfo size={11} />
      {!compact && t('label.demoLocation')}
    </span>
  );
}

export function DataSourceNote({
  kind,
  children,
  className,
}: {
  kind?: 'sample' | 'live' | 'estimate';
  children: ReactNode;
  className?: string;
}) {
  const icon = kind === 'live' ? <IconCheck size={12} /> : kind === 'estimate' ? <IconAlert size={12} /> : <IconInfo size={12} />;
  return (
    <p
      className={cn(
        'flex items-start gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-2xs leading-relaxed text-muted',
        className,
      )}
    >
      <span className="mt-[1px] shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <h3 className="label-caps">{children}</h3>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="label-caps truncate">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-semibold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-2xs text-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-8 text-center', className)}>
      {icon && <div className="mb-0.5 text-muted/70">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="max-w-[34ch] text-xs leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="h-px flex-1 bg-line" />
        <span className="label-caps">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }
  return <div className={cn('h-px w-full bg-line', className)} />;
}

/** Shows a 0–5 score as a compact bar — used for area comparisons. */
export function ScoreBar({
  label,
  score,
  max = 5,
  tone = 'accent',
}: {
  label: string;
  score: number;
  max?: number;
  tone?: 'accent' | 'warn' | 'muted';
}) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const bar = tone === 'warn' ? 'bg-warn' : tone === 'muted' ? 'bg-line-strong' : 'bg-accent';
  return (
    <div className="flex items-center gap-2">
      <span className="w-[86px] shrink-0 truncate text-2xs font-medium text-ink-soft">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
        <span className={cn('block h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-4 shrink-0 text-right text-2xs font-semibold tabular-nums text-muted">{score}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}
