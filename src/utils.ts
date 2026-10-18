import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, SECTIONS, type CategorySlug } from './consts';

export type Post = CollectionEntry<'blog'>;

/** Prefix an internal path with the configured base (needed for GitHub project pages). */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}

/** A post's page: its trip board (/trip/<trip>/) when it has one, otherwise /blog/<id>/. */
export const postUrl = (post: Post) => (post.data.trip ? url(`/trip/${post.data.trip}/`) : url(`/blog/${post.id}/`));
export const categoryUrl = (slug: CategorySlug) => url(`/category/${slug}/`);
export const categoryLabel = (slug: CategorySlug) => CATEGORIES[slug].label;

/** A post that would have its own page (not an outside link, a button block or a pop-up job). */
const isPageKind = (post: Post) => !post.data.link && !post.data.buttons && !post.data.popup;

/** Items that get their own page on this site; placeholders don't (they can't be opened yet). */
export const hasPage = (post: Post) => isPageKind(post) && !post.data.placeholder;

/** Shown beside anything that's still a placeholder; the block itself can't be clicked. */
export const UNDER_CONSTRUCTION = 'This blog is under construction. Please come back later.';

/**
 * What a block's link opens, shown before its description (v16): "PDF" for a Google Drive file,
 * "Folder" for a Google Drive folder, "GitHub" for a GitHub page (2026-10-18). (Buttons don't get this,
 * only whole blocks.)
 */
export function linkKind(post: Post): 'PDF' | 'Folder' | 'GitHub' | undefined {
  const link = post.data.link ?? '';
  if (/drive\.google\.com\/file\//.test(link) || /docs\.google\.com\/.*\/d\//.test(link)) return 'PDF';
  if (/drive\.google\.com\/drive\/folders\//.test(link)) return 'Folder';
  if (/^https:\/\/github\.com\//.test(link)) return 'GitHub';
  return undefined;
}

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

/**
 * A category's posts in the order its page shows them: section by section (as in SECTIONS), pinned first,
 * then newest; anything without a known section last. The category page, the post side bar and the
 * Previous / Next links at the bottom of a post all use this, so a new post slots in everywhere by itself.
 */
export function categoryOrder(category: CategorySlug, posts: Post[]): Post[] {
  const mine = posts.filter((p) => p.data.category === category);
  const ids = SECTIONS[category].map((s) => s.id);
  const rank = (p: Post) => {
    const i = ids.indexOf(p.data.section ?? '');
    return i === -1 ? ids.length : i;
  };
  return [...mine].sort((a, b) => rank(a) - rank(b) || bySectionOrder(a, b));
}

/** The posts a reader steps through with Previous / Next: everything that has (or will have) its own page. */
export const readingOrder = (category: CategorySlug, posts: Post[]) =>
  categoryOrder(category, posts).filter(isPageKind);

/**
 * What the post side bar lists: the same posts as Previous / Next, plus outside-link blocks marked
 * `sidebar: true` (e.g. the IC contest on GitHub), which open their link. Previous / Next never show those.
 */
export const sidebarOrder = (category: CategorySlug, posts: Post[]) =>
  categoryOrder(category, posts).filter((p) => isPageKind(p) || (p.data.sidebar && p.data.link));

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
