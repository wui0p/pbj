/**
 * Bring something that just opened (the SNN demo, a teaching job's details) to the top of the screen, right
 * under the top bar, so it's obvious the click worked (v16: "make the top of the pop up hit the top").
 * The top bar is told to stay visible while this scroll runs (it normally slides away when scrolling down).
 */
export function scrollUnderBar(el: HTMLElement, gap = 12) {
  dispatchEvent(new CustomEvent('sitebar:hold'));
  const bar = document.querySelector<HTMLElement>('.sitebar');
  const barH = bar ? bar.offsetHeight : 0;
  const top = el.getBoundingClientRect().top + scrollY - barH - gap;
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'instant' });
}
