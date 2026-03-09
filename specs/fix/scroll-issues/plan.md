# Implementation Plan: Fix iOS Black Screen & Desktop Scroll Zone Skip

**Branch**: `fix/scroll-issues` | **Date**: 2026-03-08 | **Spec**: `specs/fix/scroll-issues/spec.md`
**Input**: Research from expert agent team (git-historian, panel-expert, scroll-expert, webgl-expert, mobile-expert)

## Summary

Revert the `closeProjectPanel()` function in `js/panel.js` to synchronous
execution (pre-cdf162c baseline), preserving the CSS backdrop-filter mobile
fix, the `_isClosing` re-entrancy guard, and adding the missing
`ScrollTrigger.refresh()`. This eliminates the rAF timing gap that causes
the desktop scroll zone skip regression while relying on the confirmed CSS
fix for iOS Safari's GPU compositing issue.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, CSS3
**Primary Dependencies**: GSAP 3.12.5 + ScrollTrigger (CDN, pinned), Three.js 0.162.0 (CDN, pinned)
**Storage**: N/A (no persistence)
**Testing**: Manual browser testing (no automated test suite)
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), iOS Safari (mobile)
**Project Type**: Single-page HTML + WebGL portfolio
**Performance Goals**: 60fps desktop, <30 draw calls steady state
**Constraints**: No build system, no npm, no new libraries, bug fix only
**Scale/Scope**: Single function rewrite (~30 lines), 1 file changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | PASS | Bug fix only, no new features or scope |
| II. Performance-First WebGL | PASS | Synchronous approach eliminates rAF overhead; no rendering changes |
| III. Accessibility Non-Negotiable | PASS | Focus trap, keyboard nav, ARIA unchanged; panel still closes correctly |
| IV. Text in HTML | N/A | No text rendering changes |
| V. Visual Hierarchy | N/A | No visual changes |
| VI. Procedural-First Assets | N/A | No asset changes |
| VII. Graceful Degradation | PASS | No degradation path changes |
| VIII. Asset Readiness | N/A | No new assets |
| Single animation loop | PASS | No changes to GSAP ticker integration |
| Scroll Pin Constraint | PASS | No changes to scroll pin behavior |

**Gate result: PASS** — No violations. Bug fix restores known-good behavior.

## Project Structure

### Documentation (this feature)

```text
specs/fix/scroll-issues/
├── spec.md              # Bug description and fix strategy
├── plan.md              # This file
└── research.md          # Phase 0: git history analysis, root cause, decisions
```

### Source Code (affected files)

```text
js/panel.js              # closeProjectPanel() — REVERT to synchronous + improvements
css/styles.css           # NO CHANGE (keep backdrop-filter mobile fix at lines 1852-1858)
js/app.js                # NO CHANGE (keep duplicate listener removal at lines 376-377)
js/scroll-zones.js       # NO CHANGE (zone detection logic unchanged)
```

**Structure Decision**: No new files. Single function rewrite in existing module.

## Detailed Change Specification

### js/panel.js — `closeProjectPanel()` (lines 345-391)

**Current code (105bc84, broken):**
```javascript
function closeProjectPanel() {
  if (!overlayEl || overlayEl.hasAttribute('hidden') || _isClosing) return;
  _isClosing = true;

  // video cleanup...
  // mediaZone cleanup...

  // Synchronous: hide overlay, restore scroll while fixed
  overlayEl.setAttribute('hidden', '');
  document.documentElement.style.overflow = '';
  window.scrollTo(0, _savedScrollTop);  // ← unreliable while fixed

  // rAF: release body styles, enable ScrollTrigger
  requestAnimationFrame(() => {           // ← 16ms gap = desktop regression
    try {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach(st => st.enable());
        window.ScrollTrigger.refresh();
      }
      document.dispatchEvent(new CustomEvent('panel-close'));
      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus();
      }
      triggerElement = null;
    } finally {
      _isClosing = false;
    }
  });
}
```

**Target code (synchronous, with improvements):**
```javascript
function closeProjectPanel() {
  if (!overlayEl || overlayEl.hasAttribute('hidden') || _isClosing) return;
  _isClosing = true;

  try {
    // video cleanup...
    // mediaZone cleanup...

    // All operations synchronous — no rAF gaps, no ScrollTrigger desync
    overlayEl.setAttribute('hidden', '');
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, _savedScrollTop);

    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(st => st.enable());
      window.ScrollTrigger.refresh();  // Added: recalculate after body style change
    }

    document.dispatchEvent(new CustomEvent('panel-close'));

    if (triggerElement && typeof triggerElement.focus === 'function') {
      triggerElement.focus();
    }
    triggerElement = null;
  } finally {
    _isClosing = false;
  }
}
```

**Key differences from current:**
1. Remove `requestAnimationFrame` wrapping entirely
2. Move body style resets (position, width, top) back to synchronous
3. Move `scrollTo` after body style resets (original order)
4. Move `ScrollTrigger.enable()` + `.refresh()` to synchronous
5. Move `panel-close` dispatch to synchronous
6. Wrap entire try/finally around the function body (not just the rAF callback)

**Key differences from original (pre-cdf162c):**
1. Added `_isClosing` guard (from 03a2a61 — prevents re-entrancy)
2. Added `ScrollTrigger.refresh()` after enable (from cdf162c — ensures recalculation)
3. Added try/finally (from f859acb — guarantees `_isClosing` reset)

### css/styles.css — NO CHANGE

The mobile backdrop-filter override (lines 1852-1858) is confirmed effective
and must be preserved:

```css
/* Fix: disable backdrop-filter on mobile to prevent iOS Safari GPU
   compositing failure over WebGL canvas (causes blank screen) */
.overlay__backdrop {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(4, 5, 15, 0.92);
}
```

### js/app.js — NO CHANGE

The duplicate ScrollTrigger listener removal (lines 376-377) is confirmed
correct and must be preserved.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS black screen returns after JS revert | Low | High | CSS fix (backdrop-filter) addresses the primary GPU cause; synchronous approach was the original working state |
| Desktop scroll still skips after fix | Very Low | Medium | Synchronous approach eliminates the rAF timing gap entirely |
| ScrollTrigger.refresh() causes layout thrash | Very Low | Low | refresh() is lightweight; called once per panel close |
| Panel close feels slower on low-end devices | Very Low | Low | Synchronous is actually faster than rAF (no frame delay) |

## Verification Plan

### iOS Safari (iPhone SE, iPhone 12 Pro)
1. Load page, wait for reveal sequence to complete
2. Scroll to zone 2 (Applications & Products) or zone 3 (Prototypes)
3. Tap a star — modal should open (not black screen)
4. Close modal — page should return to correct scroll position
5. Repeat for each zone

### Desktop (Chrome, Firefox, Safari)
1. Load page, wait for reveal sequence
2. Mouse-wheel slowly through all three zones
3. Verify zone 1 (DevOps), zone 2 (Applications), zone 3 (Prototypes) each activate
4. Verify middle zone is NOT skipped
5. Open a star panel, close it, then scroll again — zones should still work correctly

### Regression Checks
- Panel open/close preserves scroll position
- Keyboard Escape closes panel
- Backdrop click closes panel
- Focus returns to trigger element after close
- `prefers-reduced-motion` still works (instant transitions)

## Complexity Tracking

No constitution violations. No complexity justifications needed.
