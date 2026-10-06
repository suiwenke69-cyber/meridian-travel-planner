'use client';

import { useUiStore } from '@/lib/store/ui-store';
import { LOCALES } from '@/lib/i18n';
import { useT } from '@/lib/i18n/use-t';
import { cn } from '@/lib/utils';

/**
 * Language switcher.
 *
 * Two locales, so a segmented control rather than a dropdown — the current
 * language is then visible without opening anything, which matters when a
 * traveller lands on a page in a language they do not read.
 *
 * The label is written in the language itself ("简体中文", "English"), which is
 * the one case where showing a language in its own script is more useful than
 * translating it.
 */
export function LanguageSwitcher({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useT();
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);

  return (
    <div
      className={cn('inline-flex items-center rounded-full border border-line bg-surface p-0.5', className)}
      role="group"
      aria-label={t('app.switchLanguage')}
      data-testid="language-switcher"
    >
      {LOCALES.map((entry) => {
        const active = entry.id === locale;
        return (
          <button
            key={entry.id}
            type="button"
            data-testid={`locale-${entry.id}`}
            aria-pressed={active}
            title={entry.label}
            onClick={() => setLocale(entry.id)}
            className={cn(
              'rounded-full px-2.5 py-[3px] text-[11.5px] font-medium transition-colors',
              active ? 'bg-accent text-white' : 'text-muted hover:text-ink',
            )}
          >
            {compact ? entry.short : entry.label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
