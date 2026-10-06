'use client';

import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';
import { useImportUiStore } from '@/lib/store/import-ui';
import { IconSparkle } from '../ui/icons';

/**
 * The way into the import flow from inside destination planning.
 *
 * It sits in PLAN rather than in DO because that is the moment the traveller is
 * already assembling a trip: a guide is a source of stops, and asking for it
 * here means the places it yields land next to the itinerary they belong to.
 * The header button is the always-available entry; this is the contextual one.
 */
export function ImportGuideCta({ className, variant = 'card' }: { className?: string; variant?: 'card' | 'row' }) {
  const t = useT();
  const openImport = useImportUiStore((s) => s.openImport);

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={() => openImport()}
        data-testid="import-guide-cta"
        className={cn(
          'flex w-full items-center gap-2 border-b border-line bg-surface-2 px-4 py-2 text-left transition-colors hover:bg-accent-soft/50',
          className,
        )}
      >
        <IconSparkle size={13} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-ink">{t('import.ctaTitle')}</span>
        </span>
        <span className="shrink-0 text-[11.5px] font-semibold text-accent">{t('import.entry')}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openImport()}
      data-testid="import-guide-cta"
      className={cn(
        'group flex w-full items-start gap-2.5 rounded-xl border border-dashed border-line-strong bg-surface-2 p-3 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40',
        className,
      )}
    >
      <span
        className="mt-[1px] flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
        aria-hidden="true"
      >
        <IconSparkle size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ink">{t('import.ctaTitle')}</span>
        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{t('import.ctaBody')}</span>
      </span>
    </button>
  );
}
