# Feature Spec: Fix iOS Black Screen & Desktop Scroll Zone Skip

**Type**: Bug fix (regression)
**Priority**: Critical
**Affected**: iOS Safari (all versions), Desktop (all browsers)
**Related Issues**: #19 (original report)
**Related PRs**: #23 (cdf162c), #28 (03a2a61, f859acb), commit 105bc84

## Problem Statement

Two regressions exist in the current codebase, both stemming from iterative
attempts to fix an iOS Safari blank screen bug:

### Bug 1: iOS Safari Black Screen on Star Tap

When an iPhone user scrolls through constellation zones and taps a star, they
see a black screen instead of the project modal. At least two PRs (#23, #28)
and a follow-up commit (105bc84) attempted to fix this. The bug persists.

### Bug 2: Desktop Scroll Zone Skip

When a desktop user mouse-wheels down through the three constellation zones,
the middle zone ("Applications & Products") gets skipped — zones change too
fast. This is a UX regression that did not exist before the iOS fix attempts.

## Root Cause Analysis

### iOS Black Screen — Two Compounding Causes

1. **`backdrop-filter: blur(8px)` on mobile** causes iOS Safari GPU compositing
   failure when rendered over the WebGL canvas. **Fixed in cdf162c** (CSS-only,
   confirmed effective, must be preserved).

2. **Body `position:fixed` scroll lock/unlock timing** — the various rAF-based
   approaches (single rAF in cdf162c, double rAF in 03a2a61, reordered in
   105bc84) introduced timing gaps between scroll restoration and ScrollTrigger
   state updates without reliably solving the compositing issue. The CSS fix
   (cause #1) may be sufficient; the JS timing changes may be unnecessary and
   are the source of the desktop regression.

### Desktop Zone Skip — ScrollTrigger Desynchronization

The current `closeProjectPanel()` (105bc84) calls `window.scrollTo()` synchronously
but defers body `position:fixed` release and `ScrollTrigger.refresh()` to a
`requestAnimationFrame` callback. During the ~16ms gap:
- ScrollTrigger instances are still disabled
- The GSAP ticker fires with stale scroll progress
- When ScrollTrigger re-enables in the rAF, progress values can jump across
  zone boundaries, causing zone 1 to be skipped entirely on subsequent scrolls

## Fix Strategy

**Principle: Revert JS changes, keep CSS fix, add missing refresh.**

1. Revert `closeProjectPanel()` to the original **synchronous** approach
   (pre-cdf162c), eliminating all rAF timing issues
2. Add `ScrollTrigger.refresh()` after enable (was missing in the original,
   correctly identified as needed by cdf162c)
3. Keep the `_isClosing` re-entrancy guard (defensive improvement, no downside)
4. Keep the try/finally safety pattern around the guard reset
5. **Preserve** the CSS `backdrop-filter: none` mobile override (confirmed fix)
6. **Preserve** the app.js duplicate listener removal (03a2a61, correct fix)

## Files Affected

| File | Change | Risk |
|------|--------|------|
| `js/panel.js` | Revert closeProjectPanel to synchronous + add refresh | Low — restoring known-good behavior |
| `css/styles.css` | No change (keep backdrop-filter mobile fix) | None |
| `js/app.js` | No change (keep duplicate listener removal) | None |
| `js/scroll-zones.js` | No change | None |

## Acceptance Criteria

1. iPhone user can scroll to any zone, tap a star, and see the project modal
   (not a black screen)
2. Desktop user can mouse-wheel through all three zones without any zone being
   skipped
3. Panel close restores exact scroll position on all platforms
4. ScrollTrigger state is consistent after panel open/close cycle
5. No new animations, features, or UX changes introduced

## Non-Goals

- No changes to touch-guard.js or star-click disambiguation
- No changes to the panel open path (showProjectPanel)
- No changes to scroll-zones.js zone detection logic
- No changes to WebGL rendering pipeline
- No new CSS or responsive behavior
