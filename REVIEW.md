# Odd Portfolio — Outstanding Review Items

Last updated: 2026-03-04

## Incomplete Feature: Scroll-Driven Exploration

**Priority**: P1 (next planned work)
**Source**: `specs/001-arcane-console-poc/spec.md` — User Story 3 (P3)

The original spec describes scroll-driven exploration where scrolling rotates the nebula and shifts color zones through constellation areas. The data layer is partially ready:

- `CONSTELLATION_ZONES` in `js/data.js` defines scroll ranges (`scrollStart`/`scrollEnd`) for 4 zones
- ScrollTrigger is imported via CDN (`index.html` line 25) but never activated
- `html, body` and `#app-shell` all have `overflow: hidden` — no scrolling is possible

**What's missing**:
1. A scroll container with artificial height to enable scrolling while the starfield stays pinned
2. ScrollTrigger wiring to drive nebula rotation/color shifts on scroll progress
3. Per-project sections presented sequentially as the user scrolls down

**Current behavior**: Users see a fixed single-screen viewport. Any perceived empty space below the fold is the `#0D0B09` background behind the locked viewport — there is no content below.

---

## Low-Priority Gaps (Deferred from Beta 0.1.0)

### 1. CONSTELLATION_ZONES Fantasy Text

**Priority**: Low (cosmetic)
**Source**: `specs/003-beta-portfolio-polish/plan.md` line 161, `tasks.md` line 113
**Target**: Beta 0.1.1

The `CONSTELLATION_ZONES` array in `js/data.js` (lines 141–166) contains fantasy-themed `statusText` values displayed during scroll-triggered zone changes:

- `"scanning arcane tools constellation..."`
- `"entering intelligence nebula..."`
- `"approaching community star cluster..."`
- `"navigating legacy systems region..."`

These should be replaced with professional brand language. Not currently visible to most users (status panel hidden on mobile; scroll zones not yet wired).

### 2. Star Label Clipping Behind Sidebars

**Priority**: Low (P3 polish)
**Source**: `specs/003-beta-portfolio-polish/plan.md` lines 98, 281

The `#star-labels` container is inside `#main-viewport` (center grid column), causing hover labels for stars positioned near the sidebar edges to clip at the sidebar boundary.

**Root cause**: Label container is confined to the center viewport column.
**Fix complexity**: High — requires moving `#star-labels` to a viewport-level overlay outside the grid, with careful z-index and pointer-events management.

### 3. Y-Axis Star Scaling on Portrait Mobile

**Priority**: Low (polish)
**Source**: `specs/003-beta-portfolio-polish/plan.md` lines 95–98

Star positions scale only on the X-axis during responsive resizing (`scene.js` `onResize`). On portrait mobile (aspect ratio < 1:1), this produces a vertically-oriented star cluster instead of maintaining spatial distribution. All 7 stars remain visible (SC-002 satisfied).

**Documented formula** (not yet implemented):
```js
yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3);
```

Trade-off was accepted for Beta 0.1.0 to minimize scope. Apply in a future polish pass if user testing reveals issues on portrait devices.
