import type { MessageKey } from '../i18n/messages';
import type { RecommendationType } from '../types';

/**
 * The Chinese word for a place type.
 *
 * Internal types stay English enums (§8) and the interface is Chinese, so every
 * surface that names a category — the review card, the saved list, the tray —
 * has to agree on the mapping. One function rather than three inline lookups,
 * because a card that said "餐厅" while the filter said "美食" would read as a
 * bug in the data rather than a wording slip.
 */
export function categoryKey(category: RecommendationType | undefined): MessageKey {
  return `research.type.${category ?? 'unknown'}` as MessageKey;
}
