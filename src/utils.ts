import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type CategorySlug } from './consts';

export type Post = CollectionEntry<'blog'>;

/** Prefix an internal path with the configured base (needed for GitHub project pages). */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

export const postUrl = (post: Post) => url(`/blog/${post.id}/`);
export const categoryUrl = (slug: CategorySlug) => url(`/category/${slug}/`);
export const categoryLabel = (slug: CategorySlug) => CATEGORIES[slug].label;

/** Items that get their own page on this site (not external links, button blocks or pop-up jobs). */
export const hasPage = (post: Post) => !post.data.link && !post.data.buttons && !post.data.popup;

/**
 * Where an item's block goes: its post page, an outside link, or its spot on the category page
 * (button blocks; pop-up jobs, which open when the page is reached at their #id).
 */
export function itemHref(post: Post): { href: string; external: boolean } {
  if (post.data.link) return { href: post.data.link, external: true };
  if (post.data.buttons || post.data.popup) return { href: `${categoryUrl(post.data.category)}#${post.id}`, external: false };
  return { href: postUrl(post), external: false };
}

/** The date things are sorted by: when it ended (for ranges), otherwise when it was. */
const sortDate = (p: Post) => (p.data.until ?? p.data.date)?.valueOf();

/** Newest first; undated items (lists) after the dated ones, by `order`. */
export function byNewest(a: Post, b: Post): number {
  const da = sortDate(a);
  const db = sortDate(b);
  if (da !== undefined && db !== undefined) return db - da;
  if (da !== undefined) return -1;
  if (db !== undefined) return 1;
  return a.data.order - b.data.order;
}

/** The order inside a category page's section: pinned first, then newest first. */
export const bySectionOrder = (a: Post, b: Post) =>
  Number(b.data.pinned) - Number(a.data.pinned) || byNewest(a, b);

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog');
  return posts.sort(byNewest);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Oct 2026" — only month and year are shown on the site */
export function formatDate(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "2026-10" for <time datetime> */
export const isoDate = (date: Date) => date.toISOString().slice(0, 7);

/** "Oct 2026", or a range: "Jan – Jun 2026" (same year) / "Dec 2025 – Feb 2026". */
export function dateText(post: Post): string | undefined {
  const { date, until } = post.data;
  if (!date) return undefined;
  if (!until || isoDate(until) === isoDate(date)) return formatDate(date);
  if (until.getUTCFullYear() === date.getUTCFullYear())
    return `${MONTHS[date.getUTCMonth()]} – ${formatDate(until)}`;
  return `${formatDate(date)} – ${formatDate(until)}`;
}

/** The small grey line on a block: its label ("5 books") or its date. */
export const metaText = (post: Post) => post.data.label ?? dateText(post);

/** Posts written in Traditional Chinese get lang="zh-Hant" so the Noto TC fonts and line breaking apply. */
export const langOf = (text: string) => (/[㐀-鿿]/.test(text) ? 'zh-Hant' : undefined);
