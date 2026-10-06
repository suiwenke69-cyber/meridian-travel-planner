'use client';

import { useMemo } from 'react';
import type { Locale, LocalizedNames } from '../types';
import { useUiStore } from '../store/ui-store';
import { translate, type MessageKey, type MessageParams } from './index';
import { en, zhCN } from './messages';

/**
 * React bindings for the catalogue.
 *
 * The locale is read straight from the persisted UI store rather than through a
 * provider. There is one app, one locale, and a context that only ever wraps the
 * whole tree would be ceremony — a hook keeps every call site the same length as
 * the string it replaces.
 */

const CATALOGUES: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': zhCN,
  en,
};

export function useLocale(): Locale {
  return useUiStore((s) => s.locale);
}

export interface Translator {
  (key: MessageKey, params?: MessageParams): string;
  locale: Locale;
}

export function useT(): Translator {
  const locale = useLocale();
  return useMemo(() => {
    const fn = ((key: MessageKey, params?: MessageParams) =>
      translate(locale, CATALOGUES[locale][key] ?? CATALOGUES['zh-CN'][key] ?? key, params)) as Translator;
    fn.locale = locale;
    return fn;
  }, [locale]);
}

/** Non-hook lookup, for code that runs outside React (validators, tests). */
export function message(locale: Locale, key: MessageKey, params?: MessageParams): string {
  return translate(locale, CATALOGUES[locale][key] ?? key, params);
}

export interface NameFormatter {
  /** What to show first in this locale. */
  primary: (entity: LocalizedNames) => string;
  /**
   * The other name, when it differs.
   *
   * Hotels and restaurants keep their canonical English name visible on purpose:
   * it is the string that Google Maps, Grab and the venue's own booking page
   * recognise, and a traveller who cannot search for what they are reading has
   * been given a translation instead of a name.
   */
  secondary: (entity: LocalizedNames) => string | null;
}

export function useName(): NameFormatter {
  const locale = useLocale();
  return useMemo(
    () => ({
      primary: (entity) => (locale === 'zh-CN' && entity.nameZh ? entity.nameZh : entity.name),
      secondary: (entity) => (locale === 'zh-CN' && entity.nameZh ? entity.name : null),
    }),
    [locale],
  );
}
