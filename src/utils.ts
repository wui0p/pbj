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

/** Items that get their own page on this site (not external links, not button blocks). */
export const hasPage = (post: Post) => !post.data.link && !post.data.buttons;

/** Where an item's block goes: its post page, an outside link, or (button blocks) its spot on the category page. */
export function itemHref(post: Post): { href: string; external: boolean } {
  if (post.data.link) return { href: post.data.link, external: true };
  if (post.data.buttons) return { href: `${categoryUrl(post.data.category)}#${post.id}`, external: false };
  return { href: postUrl(post), external: false };
}

/** Newest first; undated items (lists) after the dated ones, by `order`. */
export function byNewest(a: Post, b: Post): number {
  const da = a.data.date?.valueOf();
  const db = b.data.date?.valueOf();
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

/** The small grey line on a block: its label ("5 books") or its month and year. */
export const metaText = (post: Post) =>
  post.data.label ?? (post.data.date ? formatDate(post.data.date) : undefined);

/** Posts written in Traditional Chinese get lang="zh-Hant" so the Noto TC fonts and line breaking apply. */
export const langOf = (text: string) => (/[㐀-鿿]/.test(text) ? 'zh-Hant' : undefined);
