// js/panel-swipe.js — Swipe-to-dismiss gesture for modal header

/**
 * Attach a downward-swipe gesture on headerEl that calls dismissFn
 * when the user drags > 80px downward on the header (not scrolled content).
 */
export function initSwipeGesture(headerEl, contentEl, dismissFn) {
  if (!headerEl || !contentEl) return;

  let startY = 0;
  let active = false;
  let contentScrolled = false;

  const onContentScroll = () => { contentScrolled = true; };

  headerEl.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    active = true;
    contentScrolled = false;
    contentEl.addEventListener('scroll', onContentScroll, { once: true, passive: true });
  }, { passive: true });

  headerEl.addEventListener('touchmove', () => {
    // tracking handled on touchend via delta
  }, { passive: true });

  headerEl.addEventListener('touchend', (e) => {
    if (!active) return;
    active = false;
    contentEl.removeEventListener('scroll', onContentScroll);

    if (contentScrolled) return;

    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;

    if (deltaY > 80) {
      dismissFn();
    }
  }, { passive: true });
}
