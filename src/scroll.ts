/**
 * Bring something to the top of the screen, right under the top bar: something that just opened (the SNN demo,
 * a teaching job's details), and The Menu (Skip to the Menu, "← MAIN PAGE"). The top bar is told to stay visible while this scroll runs (it normally slides away when
 * scrolling down).
 */
export function scrollUnderBar(el: HTMLElement, gap = 12, behavior: ScrollBehavior = 'smooth') {
  dispatchEvent(new CustomEvent('sitebar:hold'));
  const bar = document.querySelector<HTMLElement>('.sitebar');
  const barH = bar ? bar.offsetHeight : 0;
  const top = el.getBoundingClientRect().top + scrollY - barH - gap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollTo({ top: Math.max(0, top), behavior: reduce ? 'instant' : behavior });
}

/**
 * A jump from the main page: bring `el` a third of the way down the screen (`--jump-at` in
 * global.css), not to the very top, so a bit of what's above still shows and the eye can follow.
 */
export function jumpTo(el: HTMLElement, behavior: ScrollBehavior = 'smooth') {
  dispatchEvent(new CustomEvent('sitebar:hold'));
  const top = el.getBoundingClientRect().top + scrollY - innerHeight / 3;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollTo({ top: Math.max(0, top), behavior: reduce ? 'instant' : behavior });
}
