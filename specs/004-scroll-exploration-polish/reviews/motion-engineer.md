# Motion/Interaction Engineer Review

**Spec**: `specs/004-scroll-exploration-polish/spec.md` v0.2.0
**Reviewer**: Motion/Interaction Engineer
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## 1. ScrollTrigger Pin Mechanics (FR-009 / FR-010)

### Current Approach

The existing `initScrollInteractions()` in `animations.js:519-529` creates a timeline with `pin: '#app-shell'` on a `#scroll-driver` div appended to `<body>`. This is the right general idea, but there are significant risks with the current CSS layout.

### Risks with Pinning `#app-shell` Directly

**Severity: HIGH**

ScrollTrigger's `pin` option wraps the pinned element in a `<div class="pin-spacer">` and sets `position: fixed` on the element during the pinned range. This creates several problems with the existing layout:

1. **CSS Grid disruption**: `#app-shell` is the top-level grid container (`display: grid; width: 100vw; height: 100vh`). When ScrollTrigger wraps it in a `pin-spacer` div and toggles `position: fixed`, the grid dimensions may collapse or miscalculate because the pin-spacer inherits no explicit sizing from the grid.

2. **Fixed-position children conflict**: `#orb-canvas`, `.frame`, `.hamburger-btn`, and `#brand-logo.logo--following` are all `position: fixed`. When their ancestor (`#app-shell`) gets `position: fixed` by ScrollTrigger, this creates a stacking context change. Fixed-position children of a fixed-position parent still reference the viewport, so this is technically safe -- but the pin-spacer wrapper div can introduce unexpected height calculations.

3. **`overflow: hidden` on `#app-shell`** (line 183 of styles.css): ScrollTrigger needs the pinned element's overflow to not clip the spacer. The existing `overflow: hidden` on `html`, `body`, AND `#app-shell` (lines 90, 183) will fight with the scroll container.

### Recommendation

Do NOT use ScrollTrigger's built-in `pin` option on `#app-shell`. Instead:

1. **Keep `#app-shell` as `position: fixed` permanently** (it already behaves like a fixed viewport). Add `position: fixed; inset: 0;` to `#app-shell` in CSS after the reveal completes.
2. **Use the `#scroll-driver` div as a purely spatial scroll container** -- it provides the scrollable height, and ScrollTrigger reads its scroll progress, but nothing gets wrapped or repositioned.
3. **Use `ScrollTrigger.create()` with `trigger` and `start/end` but WITHOUT `pin`** -- just read progress values and drive animations via `onUpdate` or `scrub`.

This avoids all pin-spacer side effects. The visual layout stays fixed while the invisible scroll container drives progress. This is the standard pattern for "fixed scene + scroll-driven animation" and is what GSAP themselves recommend for full-viewport experiences.

**Amended approach for FR-009/FR-010:**

```js
// No pin needed -- #app-shell is already fixed/fullscreen
ScrollTrigger.create({
  trigger: scrollDriver,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 1.5,
  // NO pin property
  onUpdate: (self) => {
    const progress = self.progress;
    // Drive proxy values from progress
    proxy.orbRotY = progress * 0.44;
    proxy.cameraZ = 4.5 - progress * 0.8;
    if (orbGroup) orbGroup.rotation.y = proxy.orbRotY;
    if (camera) camera.position.z = proxy.cameraZ;
  }
});
```

---

## 2. 300px Scroll Distance Constraint (FR-009, SC-008)

### The Math Problem

**Severity: HIGH**

The constitution states: "max 300px scroll distance" and "Pin duration exceeding one viewport height of scroll distance is prohibited."

These are two constraints, and they potentially conflict:

- **300px absolute**: On a 1080p monitor, 300px is ~28% of viewport height. On a 4K display at 100% scaling, it is ~14%.
- **1 viewport height (1vh)**: On 1080p this is 1080px. On a phone (844px) this is 844px.

The spec says `window.innerHeight + 300` for the scroll-driver height (line 513 of animations.js). This means the total scrollable distance is 300px (the extra height beyond the viewport). Three zones occupy scroll progress 0.25-0.90, which maps to:

- Zone 1 (25%-50%): 75px of scroll
- Zone 2 (50%-75%): 75px of scroll
- Zone 3 (75%-90%): 45px of scroll

**75px per zone transition is too little.** At normal scroll wheel velocity (100px per tick on most mice), each zone transition would happen in a single scroll tick. This creates a binary snap rather than a smooth, explorable transition. Users with trackpads (continuous scroll) would have a slightly better experience, but 75px is still less than one finger-swipe on most trackpads.

### Recommendation

**Increase the scroll distance to 1vh (one viewport height) -- the maximum the constitution allows.** This gives:

- On 1080p: 1080px total scroll = ~270px per zone = comfortable exploration
- On 844px mobile: 844px total = ~211px per zone = still explorable

The constitution says "max 300px scroll distance" but ALSO says "Pin duration exceeding one viewport height of scroll distance is prohibited." The 1vh constraint is the governing one (the 300px figure was written for a pinned section context where the animation was a reveal intro, not an exploration journey). I recommend formally clarifying this in the spec: **the scroll distance for the exploration section should be exactly 1vh**, which satisfies the "one viewport height" constraint and provides enough distance for 3 meaningful zone transitions.

If 1vh is not acceptable, the absolute minimum for usable zone transitions is 600px (200px per zone). Below that, scroll-wheel users cannot distinguish zone boundaries.

**Amendment needed in FR-009**: Change `height: ${window.innerHeight + 300}px` to `height: ${window.innerHeight * 2}px` (1vh of scrollable distance = driver height is 2x viewport).

---

## 3. Logo-Cursor Follow Fixes (FR-001 -- FR-008)

### Issue 1: `logoReturnHome()` uses stale `getBoundingClientRect()` (FR-002, FR-003)

**Severity: MEDIUM**

At `scene.js:149-151`, `logoReturnHome()` calls `headerBand.getBoundingClientRect()` to compute the home position. This is actually correct behavior -- it reads the rect at call time, so post-resize values ARE current.

However, the problem is in the `onComplete` callback (lines 158-163): it clears `left`/`top` styles and clears the GSAP transform. After resize, the logo's CSS home position (inherited from `.frame__header-band` flex centering) should be correct -- but if `logoReturnHome()` is called during resize (e.g., the mouseleave fires due to hitzone layout change), the getBoundingClientRect may return intermediate values during the resize reflow.

**Fix**: Debounce `logoReturnHome()` during resize. In the resize handler, if `logoFollowing` is true, immediately snap the logo home (kill tweens, set state) rather than letting the mouseleave animation play with potentially-intermediate coordinates:

```js
function onResize() {
  // ... existing resize code ...

  // Recalibrate logo system
  if (logoFollowing) {
    // Snap home immediately -- no animation during resize
    gsap.killTweensOf(logoEl);
    logoFollowing = false;
    logoEl.classList.remove('logo--following');
    logoEl.style.left = '';
    logoEl.style.top = '';
    gsap.set(logoEl, { clearProps: 'transform' });
  }

  // Refresh quickTo instances (they cache internal start values)
  if (logoQuickToX) logoQuickToX = gsap.quickTo(logoEl, 'left', { duration: 0.3, ease: 'power2.out' });
  if (logoQuickToY) logoQuickToY = gsap.quickTo(logoEl, 'top', { duration: 0.3, ease: 'power2.out' });
  if (logoQuickToRot) logoQuickToRot = gsap.quickTo(logoEl, 'rotation', { duration: 0.25, ease: 'power2.out' });
}
```

### Issue 2: `logoQuickToX/Y/Rot` hold stale internal state after resize (FR-004)

**Severity: MEDIUM**

GSAP's `quickTo()` creates a specialized tween that caches its target element and starting values internally. After resize, these cached values may be stale. The current code creates them once at init (`scene.js:223-225`) and never refreshes them.

**Fix**: Re-create the `quickTo` instances in the resize handler (see code above). This is the officially recommended approach per GSAP documentation -- `quickTo` instances are cheap to create and there's no `refresh()` method on them.

### Issue 3: `mouseleave` on `#orb-hitzone` fires during resize (FR-004)

**Severity: MEDIUM**

When the browser resizes, the `#orb-hitzone` element's bounding box changes. If the cursor is near the edge of the hitzone, the browser may fire a synthetic `mouseleave` event as the hitzone boundary moves past the cursor. This causes a premature `logoReturnHome()`.

**Fix**: Add a resize guard flag:

```js
let resizing = false;

hitzone.addEventListener('mouseleave', () => {
  if (!logoFollowing || resizing) return;
  hitzone.style.cursor = 'crosshair';
  logoReturnHome(gsap);
});

function onResize() {
  resizing = true;
  // ... resize logic + logo snap-home ...
  requestAnimationFrame(() => { resizing = false; });
}
```

### Issue 4: No resize handler resets `logoFollowing` state (FR-003, FR-005)

**Severity: MEDIUM**

The resize handler in `scene.js:559-578` handles camera, renderer, and star positions but does NOT touch the logo system at all. If the logo is mid-follow and a resize occurs, the logo stays in its last GSAP-driven position with stale `left`/`top` values.

**Fix**: Add logo recalibration to the existing `onResize()` function in `scene.js` (see combined fix above in Issue 1). The logo module state (`logoFollowing`, `logoQuickToX`, etc.) is module-scoped in `scene.js`, so the resize handler at line 559 already has access.

### Issue 5: Viewport exit detection (FR-005)

**Severity: LOW**

The spec requires detecting cursor exit from the browser viewport (FR-005), not just the hitzone. Currently, the `mouseleave` listener is only on `#orb-hitzone` (line 244). If the user moves the cursor from the hitzone directly over a sidebar (which is NOT the hitzone), the `mouseleave` fires and the logo returns home. But if the user's cursor leaves the browser window entirely while over the sidebar, there's no listener to handle that -- the logo is already home, so this is a non-issue for the hitzone-only exit path.

However, FR-005 specifically mentions "mouseleave on document or mouseout with relatedTarget === null." Adding a `document.addEventListener('mouseleave')` listener would cover the edge case where the cursor teleports out of the viewport (e.g., alt-tab, multi-monitor cursor jump):

```js
document.addEventListener('mouseleave', () => {
  if (logoFollowing) {
    hitzone.style.cursor = 'crosshair';
    logoReturnHome(gsap);
  }
});
```

---

## 4. Skip-Scroll Affordance (FR-013)

### When Should It Appear?

The constitution says the skip affordance must "fade after 3 seconds." FR-013 says it must be "visible as a button or keyboard shortcut."

**Recommendation**: The skip-scroll affordance should appear when the scroll-driven section activates (i.e., after `reveal-complete` fires and `initScrollInteractions()` runs). It should NOT appear during the reveal sequence (which already has its own skip button via `initSkipIntro()`).

Timeline:
1. Reveal sequence completes -> `reveal-complete` event fires
2. `initScrollInteractions()` is called, overflow is unlocked, scroll driver is created
3. Skip-scroll affordance fades in (200ms delay after scroll activation)
4. After 3 seconds, it fades out (matching the existing `initSkipIntro()` pattern at `animations.js:453-456`)
5. If the user scrolls to 90%+ progress, the affordance is removed permanently

### Visual Design Recommendation

**A keyboard hint, not a button.** The portfolio already has a skip button for the reveal sequence. Using a second button creates visual clutter and potential confusion ("skip what?").

Instead, use a subtle bottom-center hint:

```
[Scroll to explore  |  End to skip]
```

- Font: JetBrains Mono, `var(--text-xs)`, `var(--color-text-mono)` at 60% opacity
- Position: fixed bottom-center, 24px above the command line
- Fade: 300ms in, 3s hold, 500ms out
- Keyboard: `End` key jumps to 100% scroll progress (standard browser behavior with scroll container)

This reuses the existing skip pattern but is visually distinct from the reveal skip button.

---

## 5. Reduced Motion for Scroll (FR-031 / FR-032)

### Current Approach Assessment

FR-031 says zone transitions apply instantly (duration zero). FR-032 says star brightening is suppressed. The existing `handleReducedMotion()` in `animations.js:632-702` kills ALL ScrollTrigger instances when reduced motion is active (line 683-685).

### Is This the Right UX?

**Partially.** Killing all ScrollTrigger instances means reduced-motion users see NO scroll-driven changes at all. This is overly aggressive. The spec's approach (FR-031: instant transitions, FR-032: suppress star scaling) is better:

- **Zone color changes SHOULD still occur** -- they are informational, not decorative motion. A user scrolling through the portfolio should still see the nebula change color to indicate different project groups. The change should just be instantaneous (GSAP duration: 0).
- **Star scale changes SHOULD be suppressed** -- scaling is motion. Stars stay at default size.
- **Nebula rotation SHOULD be suppressed** -- continuous rotation is motion. The nebula stays static.
- **Status text updates SHOULD still occur** -- text changes are informational.

**Amendment needed**: Replace the current "kill all ScrollTriggers" approach in `handleReducedMotion()` with a per-effect check:

```js
// In brightenZoneStars():
const duration = prefersReducedMotion.matches ? 0 : 0.4;
if (prefersReducedMotion.matches && !isInZone) return; // Skip dimming for reduced motion

// In zone transition nebula hue change:
const hueDuration = prefersReducedMotion.matches ? 0 : 0.6;
```

The ScrollTrigger instances themselves should remain active -- they just drive instant state changes instead of animated transitions.

---

## 6. Overlay vs Scroll Conflict (Edge Case)

### Current Implementation

`handlePanelScrollLock()` in `animations.js:734-746` listens for `panel-open` and `panel-close` custom events. On open, it disables all ScrollTrigger instances. On close, it re-enables them.

Additionally, `showProjectPanel()` in `interactions.js:185-188` directly disables ScrollTrigger instances AND sets `body.style.overflow = 'hidden'`. And `closeProjectPanel()` in `interactions.js:216-219` re-enables them and clears overflow.

### Is This Sufficient?

**Severity: LOW -- mostly sufficient, but has a duplication/race concern.**

There are TWO independent scroll-lock mechanisms doing the same thing:
1. `handlePanelScrollLock()` reacting to `panel-open`/`panel-close` events
2. Direct ScrollTrigger disable/enable calls inside `showProjectPanel()`/`closeProjectPanel()`

This means ScrollTrigger instances get disabled TWICE on panel open and re-enabled TWICE on panel close. GSAP handles this gracefully (double-disable is a no-op, double-enable works fine), but it's redundant.

**Recommendation**: Choose one mechanism. Since the panel functions already handle it directly, remove `handlePanelScrollLock()` and keep the inline approach. Or, remove the inline calls from `interactions.js` and keep the event-driven approach in `animations.js`. Don't do both.

For the new scroll container structure (with `#scroll-driver` and no `pin`), the existing approach works: disabling ScrollTrigger instances prevents scroll progress from driving visual changes, and `body.style.overflow = 'hidden'` prevents the scroll container from scrolling. No changes needed beyond deduplication.

---

## Summary of Required Amendments

| # | Issue | Severity | Section |
|---|-------|----------|---------|
| 1 | Do not use ScrollTrigger `pin` on `#app-shell` -- use pinless progress-driven approach | HIGH | FR-009, FR-010 |
| 2 | 300px scroll distance is too short for 3 zone transitions -- increase to 1vh | HIGH | FR-009, SC-008 |
| 3 | Add logo recalibration to resize handler: snap home, recreate quickTo instances, resize guard | MEDIUM | FR-003, FR-004 |
| 4 | Add `document.addEventListener('mouseleave')` for viewport exit detection | LOW | FR-005 |
| 5 | Skip-scroll should be a keyboard hint (not a button), appearing after scroll activation | LOW | FR-013 |
| 6 | Reduced motion should keep ScrollTrigger active with instant transitions, not kill all instances | MEDIUM | FR-031, FR-032 |
| 7 | Deduplicate scroll-lock between `handlePanelScrollLock()` and inline `showProjectPanel()` calls | LOW | Edge case |

Items 1 and 2 are architectural decisions that must be resolved before implementation begins. Items 3-7 are implementation-level fixes that can be addressed during task execution.
