# Research: 015 Mobile & Cursor UX Fixes

**Date**: 2026-03-07
**Researchers**: 5-agent expert panel (UI Engineer, Cursor & Animation Specialist, Mobile UX Specialist, UI Architect, Devil's Advocate)

---

## R-001: iOS Safari Body Scroll Locking

**Decision**: Use `position: fixed` on body with scrollTop save/restore.

**Rationale**: Current approach (`document.body.style.overflow = 'hidden'` at panel.js:317) is insufficient for iOS Safari — rubber-band bounce still occurs because iOS momentum scrolling bypasses overflow:hidden on body. The `position: fixed` pattern removes body from document flow entirely, preventing all scroll bounce. Negative `top` offset preserves visual scroll position. `window.scrollTo()` on restore maintains user context.

**Alternatives considered**:
- `overflow: hidden` on both html + body — still bounces on older iOS
- `touch-action: none` on body — overly aggressive, blocks all touch
- `overscroll-behavior: none` — not supported on older iOS Safari

**Compatibility with GSAP ScrollTrigger**: Safe. ScrollTrigger is already disabled at panel.js:314-315 before scroll lock applies. Re-enable on close after scroll position restore. No scroll position jump observed.

---

## R-002: Modal Close Button Persistent Visibility

**Decision**: Restructure `.overlay__frame` with CSS Grid. Add `.overlay__header` wrapper around close button. Move `overflow-y: auto` from frame to `.overlay__content`.

**Rationale**: Current `.overlay__close` is `position: absolute` inside `.overlay__frame` which has `overflow-y: auto` (styles.css:1365). On mobile, when content overflows, close button can scroll out of reachable area. CSS Grid with `grid-template-rows: auto 1fr` keeps header non-scrolling while content scrolls independently.

**Alternatives considered**:
- `position: sticky` on close button — unreliable inside flex/grid parents on iOS Safari
- `position: fixed` on close button — coordinates become viewport-relative, complex to position
- Virtual header zone (no HTML change) — fragile, doesn't solve the scroll-out-of-view issue

**HTML change required**: Wrap close button in `<div class="overlay__header">` inside `.overlay__frame`. Minimal DOM restructure.

---

## R-003: GSAP Fade Animation Non-Stacking

**Decision**: Stored tween reference pattern. Kill existing opacity tween before starting new one.

**Rationale**: GSAP auto-kills conflicting tweens on the same property, but during rapid state changes (cursor enter/exit cycles), race conditions can leave opacity in inconsistent states. Explicit `tween.kill()` before starting a new fade is deterministic. Aligns with existing `gsap.quickTo()` pattern in logo-follow.js:146-148.

**Alternatives considered**:
- GSAP auto-overwrite (default) — works for simple cases but inconsistent during rapid cycling
- Single timeline toggle — more complex, no benefit over stored reference
- `gsap.quickTo(el, 'opacity')` — doesn't support `onComplete` callbacks needed for state cleanup

**Reduced-motion**: Bypass GSAP entirely. Set `logoEl.style.opacity` directly for instant state changes.

---

## R-004: Reticle Debounce Window

**Decision**: Use `gsap.delayedCall(0.08, callback)` with `.revert()` cancellation. Apply to both activate and deactivate events.

**Rationale**: GSAP `delayedCall` integrates with the existing ticker (respects tab visibility pause/wake), unlike `setTimeout` which fires regardless of tab state. 80ms debounce is imperceptible to users (1.33 frames at 60fps) but absorbs rapid hover cycling when cursor passes near star edges or along constellation lines.

**Alternatives considered**:
- `setTimeout`/`clearTimeout` — doesn't integrate with GSAP ticker, fires during tab sleep
- Flag-based frame counting — more complex, same effect
- Debounce on activate only — asymmetric handling causes edge cases when deactivate fires before debounced activate

---

## R-005: Touch Tap vs Scroll Disambiguation

**Decision**: Track touchstart coordinates + timestamp. Reject on touchmove if vertical-dominant. Validate on touchend: distance < threshold (CSS pixels) AND duration < 300ms AND not long-press (> 500ms).

**Rationale**: Current touchend handler (scene.js:176-190) fires raycasting unconditionally on every touch release. No `preventDefault()` is needed — just coordinate tracking and conditional raycasting. The passive listener on touchstart can remain `{ passive: true }`.

**CSS addition**: `touch-action: pan-y` on `#orb-hitzone` — tells browser vertical scroll is expected, prevents default pinch/zoom. Three.js raycasting is unaffected (polls mouse state, not browser defaults).

**Movement threshold**: 10 CSS pixels starting value. CSS pixels are device-independent by definition — `clientX`/`clientY` from touch events are already in CSS pixels. No DPI conversion needed.

**Alternatives considered**:
- Double-tap pattern — unambiguous but adds 300ms latency to intentional taps, non-standard
- `touch-action: none` + manual scroll — overrides browser scroll, complex, bad UX
- Disable star tapping entirely on coarse pointer — removes 50% of exploration experience

---

## R-006: Swipe-to-Dismiss with Scroll Conflict Prevention

**Decision**: Track swipe on the new `.overlay__header` element only. Cancel if `.overlay__content` scrollTop changes during gesture.

**Rationale**: With the CSS Grid restructure (R-002), the header is a separate non-scrolling element. Swipe detection limited to this area naturally avoids conflict with content scrolling — header never scrolls. Track touchstart Y on header, check touchmove delta > 80px downward, fire dismiss on touchend if qualified.

**Scroll conflict guard**: Listen for `scroll` event on `.overlay__content`. If fired between swipe touchstart and touchend, cancel the swipe candidate.

**Alternatives considered**:
- Virtual header zone (top 60px) without HTML change — fragile, hard to maintain across breakpoints
- Full-frame swipe detection with scrollTop comparison — complex, error-prone near scroll boundaries
- Gesture library (Hammer.js) — adds external dependency, violates constitution (no additional libraries)

---

## R-007: Pointer Capability Detection Strategy

**Decision**: Add `isCoarsePointer()` to pointer-utils.js. Use pointer capability for interaction behavior, viewport width for CSS layout only. Add media query change listener for hybrid device mid-session changes.

**Rationale**: The spec requires `pointer: coarse`/`pointer: fine` as primary discriminator, not viewport width. Current `isFinePointer()` is correct for logo-follow and interaction guards. New `isCoarsePointer()` needed for touch disambiguation in scene.js. Viewport width checks in scene.js, scroll-zones.js, reticle.js, gauge.js are correct as-is — they control CSS layout and renderer DPR, not interaction behavior.

**Hybrid device risk (HIGH)**: `(pointer: fine)` matches if ANY fine-pointer device exists. Surface Pro with both stylus and touch returns true. Current `pointerMQL.addEventListener('change', ...)` in logo-follow.js:194-216 already handles mid-session pointer capability changes.

**Alternatives considered**:
- `PointerEvent.pointerType` per-event detection — too granular for media-query-based feature gating
- `(any-pointer: coarse)` — broader match, would misclassify desktops with touchscreens
- User-agent sniffing — unreliable, maintenance burden

---

## R-008: Module Size Budget

**Decision**: Extract touch disambiguation to `js/touch-guard.js` (~30 lines). Extract swipe gesture handler to `js/panel-swipe.js` (~35 lines). Keeps scene.js and panel.js within tolerable range.

**Rationale**: scene.js (433 lines) and panel.js (418 lines) already exceed the 400-line constitution limit. Adding 015 features directly would push them to ~445 and ~450 respectively. Extracting focused modules keeps the core files stable and creates clear separation of concerns.

**Line count projections**:
| Module | Current | After 015 | Strategy |
|--------|---------|-----------|----------|
| logo-follow.js | 259 | ~295 | Direct add (safe) |
| scene.js | 433 | ~420 | Extract touch-guard.js, add init call |
| panel.js | 418 | ~400 | Extract panel-swipe.js, add init call |
| touch-guard.js | new | ~30 | Touch disambiguation logic |
| panel-swipe.js | new | ~35 | Swipe-to-dismiss gesture |
| pointer-utils.js | 4 | ~8 | Add isCoarsePointer() + listener |
| styles.css | N/A | +30 | Modal mobile overrides (no JS limit) |

**Alternatives considered**:
- Accept overages and amend constitution — sets bad precedent
- Major scene.js refactor — too risky, destabilizes core renderer
- Inline everything — exceeds limits, harder to test

---

## R-009: Backdrop Click Propagation

**Decision**: No changes needed. Current architecture is correct.

**Rationale**: `.overlay__backdrop` sits behind `.overlay__frame` in z-order. Clicks inside the frame hit frame children, not backdrop. The existing handler (panel.js:409) `backdropEl.addEventListener('click', closeProjectPanel)` only fires when backdrop itself is clicked. Event bubbling from frame content cannot reach backdrop due to z-order stacking context.

**Spec requirement satisfied**: FR-003 says "tap handler MUST verify event.target is the backdrop element itself." Current implementation achieves this by attaching the handler directly to the backdrop element, which only receives events when it is the actual click target. No additional guard needed.

---

## R-010: Passive Event Listener Safety

**Decision**: Keep `{ passive: true }` on touchstart. No `preventDefault()` needed for touch disambiguation.

**Rationale**: Touch disambiguation only tracks coordinates and timestamps — no need to prevent default browser behavior. The `touch-action: pan-y` CSS property handles scroll optimization at the browser level. Chrome's intervention warning only fires if `preventDefault()` is actually called inside a passive listener, which we don't do.
