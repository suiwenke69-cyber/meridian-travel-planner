import type { SocialPlatform } from '../types';

/**
 * Platform recognition.
 *
 * This exists for provenance and labelling only. Meridian does not fetch these
 * platforms: they prohibit automated collection, and working around those
 * controls is not something this product does. The URL is stored so a reviewer
 * can click through and so every derived insight can be traced back — the text
 * itself is supplied by the researcher.
 */

export interface PlatformMeta {
  id: SocialPlatform;
  label: string;
  /** Where the researcher is likely to have found this. */
  hint: string;
}

export const PLATFORMS: PlatformMeta[] = [
  { id: 'xiaohongshu', label: '小红书', hint: '图文攻略、探店笔记' },
  { id: 'douyin', label: '抖音', hint: '短视频' },
  { id: 'bilibili', label: '哔哩哔哩', hint: '长视频、旅行 vlog' },
  { id: 'youtube', label: 'YouTube', hint: '长视频' },
  { id: 'instagram', label: 'Instagram', hint: '图片、Reels' },
  { id: 'tiktok', label: 'TikTok', hint: '短视频' },
  { id: 'blog', label: '博客 / 网站', hint: '图文攻略' },
  { id: 'manual', label: '手动输入', hint: '没有链接，只有文字' },
  { id: 'other', label: '其他', hint: '' },
];

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function platformMeta(id: SocialPlatform): PlatformMeta {
  return PLATFORM_BY_ID.get(id) ?? { id, label: id, hint: '' };
}

const HOST_RULES: Array<{ platform: SocialPlatform; test: RegExp }> = [
  { platform: 'xiaohongshu', test: /xiaohongshu\.com|xhslink\.com/i },
  { platform: 'douyin', test: /douyin\.com|iesdouyin\.com/i },
  { platform: 'bilibili', test: /bilibili\.com|b23\.tv/i },
  { platform: 'youtube', test: /youtube\.com|youtu\.be/i },
  { platform: 'instagram', test: /instagram\.com|instagr\.am/i },
  { platform: 'tiktok', test: /tiktok\.com/i },
  { platform: 'blog', test: /medium\.com|substack\.com|wordpress\.com|blogspot\.|zhihu\.com|mafengwo\.cn|ctrip\.com|trip\.com|qyer\.com/i },
];

/**
 * Best guess at the platform behind a URL.
 *
 * Returns `null` rather than `'other'` when the URL is not recognised, so the
 * caller can decide whether to default or ask.
 */
export function detectPlatform(url: string | undefined): SocialPlatform | null {
  if (!url || url.trim().length === 0) return null;
  const value = url.trim();
  for (const rule of HOST_RULES) {
    if (rule.test.test(value)) return rule.platform;
  }
  return null;
}

/** Loose validation — enough to keep obviously wrong input out of provenance. */
export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(value.trim());
}
