import type { SocialPlatform } from '../types';

/**
 * Xiaohongshu URL recognition.
 *
 * This file used to be a nine-platform table. Narrowing it is a product decision
 * rather than a cleanup: V1 reads exactly one source, and keeping the other eight
 * around made every downstream component hedge for sources nobody had tested
 * (§1, §35).
 *
 * The module still exists, and still does only one job, because provenance is
 * the point: Meridian stores the link so a traveller can click through and so
 * every derived place can be traced to the post it came from. What it does NOT
 * do is fetch. `canRetrieve` says whether an attempt is even worth making, and
 * the answer is a property of the deployment, not of the URL.
 */

export interface PlatformMeta {
  id: SocialPlatform;
  label: string;
  /** Where the traveller is likely to have found this. */
  hint: string;
  /** Hosts that unambiguously mean this platform. */
  hosts: RegExp;
}

export const XIAOHONGSHU: PlatformMeta = {
  id: 'xiaohongshu',
  label: '小红书',
  hint: '图文攻略、探店笔记',
  // `xhslink.com` is the share shortener the app produces when you copy a link,
  // which is the form most travellers actually paste.
  hosts: /xiaohongshu\.com|xhslink\.com/i,
};

export const PLATFORMS: PlatformMeta[] = [XIAOHONGSHU];

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function platformMeta(id: SocialPlatform): PlatformMeta {
  return PLATFORM_BY_ID.get(id) ?? XIAOHONGSHU;
}

/** True when this URL is a Xiaohongshu post we should try to read. */
export function isXiaohongshuUrl(url: string | undefined): boolean {
  if (!url) return false;
  return XIAOHONGSHU.hosts.test(url.trim());
}

/**
 * Whether a URL is recognisably a Xiaohongshu link.
 *
 * Returns the platform or `null`. The single-value union makes this look
 * redundant, and it is kept because the caller's real question is "is this a
 * link I understand?" — a YouTube URL must come back `null` so the UI can say so
 * rather than silently treating it as a Xiaohongshu post and failing later.
 */
export function detectPlatform(url: string | undefined): SocialPlatform | null {
  if (!url || url.trim().length === 0) return null;
  return XIAOHONGSHU.hosts.test(url.trim()) ? 'xiaohongshu' : null;
}

/** Loose validation — enough to keep obviously wrong input out of provenance. */
export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value.trim());
}

/** Extracts the note id from the common URL shapes, for diagnostic messages. */
export function xiaohongshuNoteId(url: string | undefined): string | null {
  if (!url) return null;
  const match = /(?:explore|discovery\/item|item)\/([0-9a-fA-F]{8,32})/.exec(url.trim());
  return match ? match[1] : null;
}
