/**
 * Import limits.
 *
 * The brief's §34, and the reasoning is narrow: extraction may eventually cost
 * money per call, and a paste box is an unbounded input. This is not billing and
 * not rate-limiting infrastructure — it is a set of bounds that stop a
 * mis-paste, a loop, or a shared link from turning into a bill.
 *
 * The numbers are chosen to be generous for a real traveller and useless for
 * anything else: nobody pastes 20,000 characters of a travel guide by hand, and
 * nobody legitimately imports forty guides in ten minutes.
 */

export const MAX_TEXT_LENGTH = 20_000;
export const MAX_URL_LENGTH = 2_048;
export const MAX_IMPORTS_PER_WINDOW = 20;
export const IMPORT_WINDOW_MS = 10 * 60 * 1000;
export const MAX_MENTIONS_PER_IMPORT = 60;

export type LimitCode =
  | 'text_too_long'
  | 'url_too_long'
  | 'too_many_imports'
  | 'too_many_candidates'
  | 'empty_input';

export interface LimitViolation {
  code: LimitCode;
  /** Message key the UI renders. */
  messageKey:
    | 'import.error.textTooLong'
    | 'import.error.urlTooLong'
    | 'import.error.tooManyImports'
    | 'import.error.tooManyCandidates'
    | 'import.error.empty';
  detail?: string;
}

/**
 * Content worth sending to an extractor.
 *
 * Boilerplate removal, before any paid call: share-sheet chrome, "read more"
 * fragments, repeated blank lines and social furniture carry no place names and
 * cost tokens. This is a cheap pre-filter, not a parser — if it removed nothing,
 * nothing is lost.
 */
const BOILERPLATE = [
  /^\\s*(follow|关注|点赞|收藏|转发|分享|subscribe|like and subscribe)[^\\n]*$/gim,
  /^\\s*(展开|收起|read more|show more|see more)\\s*$/gim,
  /^\\s*#\\S+(\\s+#\\S+)*\\s*$/gm,
  /^\\s*[\\p{Emoji_Presentation}\\p{Extended_Pictographic}\\s]+$/gmu,
];

export function stripBoilerplate(text: string): string {
  let out = text;
  for (const pattern of BOILERPLATE) out = out.replace(pattern, '');
  return out
    .replace(/\\r\\n/g, '\\n')
    .replace(/\\n{3,}/g, '\\n\\n')
    .replace(/[ \\t]{2,}/g, ' ')
    .trim();
}

export function checkImportInput(input: { url?: string; text?: string }): LimitViolation | null {
  const url = (input.url ?? '').trim();
  const text = (input.text ?? '').trim();
  if (url.length === 0 && text.length === 0) return { code: 'empty_input', messageKey: 'import.error.empty' };
  if (url.length > MAX_URL_LENGTH) return { code: 'url_too_long', messageKey: 'import.error.urlTooLong' };
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      code: 'text_too_long',
      messageKey: 'import.error.textTooLong',
      detail: String(text.length),
    };
  }
  return null;
}

/** Rolling-window check over the timestamps of recent imports. */
export function checkImportRate(recentTimestamps: number[], now = Date.now()): LimitViolation | null {
  const inWindow = recentTimestamps.filter((t) => now - t < IMPORT_WINDOW_MS);
  if (inWindow.length >= MAX_IMPORTS_PER_WINDOW) {
    return { code: 'too_many_imports', messageKey: 'import.error.tooManyImports' };
  }
  return null;
}

/** Truncates an oversized candidate list rather than failing the whole import. */
export function capMentions<T>(mentions: T[]): { kept: T[]; dropped: number } {
  if (mentions.length <= MAX_MENTIONS_PER_IMPORT) return { kept: mentions, dropped: 0 };
  return { kept: mentions.slice(0, MAX_MENTIONS_PER_IMPORT), dropped: mentions.length - MAX_MENTIONS_PER_IMPORT };
}
