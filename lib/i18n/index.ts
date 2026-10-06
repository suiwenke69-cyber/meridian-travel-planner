/**
 * Localization.
 *
 * WHY A HAND-WRITTEN CATALOGUE RATHER THAN A LIBRARY
 * -------------------------------------------------
 * The product ships five runtime dependencies and this iteration was not going
 * to make it seven. More importantly, the strings here are not translations of
 * each other: the Chinese copy is written as Chinese, shorter and more direct
 * than the English, because a literal rendering of an English product sentence
 * reads like a manual. A catalogue keyed by intent lets the two be different
 * lengths and different shapes.
 *
 * HOW IT STAYS HONEST
 * -------------------
 * `en` is typed as a total map of the Chinese catalogue's keys, so a missing or
 * misspelled key is a compile error rather than a raw key rendered into the UI.
 *
 * WHY THE LOCALE IS CLIENT-SIDE
 * -----------------------------
 * The site is statically exported to GitHub Pages, so no route may read a cookie
 * or a request header. The locale therefore lives in the persisted UI store.
 * Server and first client render both use `DEFAULT_LOCALE`; a stored preference
 * is applied after hydration. Because rehydration happens in an effect, the
 * first client render matches the server exactly and there is no mismatch.
 */

import type { Locale } from '../types';

export type { Locale };

export interface LocaleMeta {
  id: Locale;
  /** Shown in the language switcher, in the language itself. */
  label: string;
  short: string;
}

export const LOCALES: LocaleMeta[] = [
  { id: 'zh-CN', label: '简体中文', short: '中' },
  { id: 'en', label: 'English', short: 'EN' },
];

export const LOCALE_IDS = LOCALES.map((l) => l.id);

/** `{name}` placeholders are substituted by `translate`. */
export type MessageParams = Record<string, string | number>;

export function translate(locale: Locale, message: string, params?: MessageParams): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

/**
 * Picks the right member of a bilingual pair.
 *
 * The Chinese field is optional everywhere, and falls back to the canonical
 * value rather than to a machine translation — showing a Chinese name the
 * traveller cannot search for is worse than showing the English one.
 */
export function pick(zh: string | undefined, en: string, locale: Locale): string {
  return locale === 'zh-CN' ? (zh && zh.length > 0 ? zh : en) : en;
}

/** Positional fallback for arrays that may be shorter in one language. */
export function pickList(zh: string[] | undefined, en: string[], locale: Locale): string[] {
  if (locale !== 'zh-CN' || !zh || zh.length === 0) return en;
  return en.map((value, index) => zh[index] ?? value);
}

export { zhCN, en } from './messages';
export type { MessageKey } from './messages';

import { zhCN as ZH, en as EN } from './messages';
import type { MessageKey as Key } from './messages';

const CATALOGUES: Record<Locale, Record<Key, string>> = { 'zh-CN': ZH, en: EN };

/**
 * Non-hook lookup.
 *
 * Lives here rather than beside the React bindings because server components
 * (the root layout's metadata, route metadata) need it, and a module marked
 * `'use client'` cannot export a function a server component may call.
 */
export function message(locale: Locale, key: Key, params?: MessageParams): string {
  return translate(locale, CATALOGUES[locale]?.[key] ?? CATALOGUES['zh-CN'][key] ?? key, params);
}
