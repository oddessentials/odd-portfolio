# Research: Beta 0.1.0 — Portfolio Polish & Bug Fixes

**Phase 0 Output** | **Date**: 2026-03-04

## Research Tasks

### R1: Mouse Interaction Offset — Root Cause Confirmation

**Decision**: The hitzone element (`#orb-hitzone`) must be changed from `position: absolute` inside the center grid column to `position: fixed; inset: 0` covering the full viewport.

**Rationale**: The WebGL Engineer's analysis confirmed that `#orb-hitzone` with `position: absolute; inset: 0` inside `#main-viewport` (grid-column 2) only captures mouse events within the center column. Stars rendered behind the sidebar panels (at negative x-positions) receive no mouse events. The coordinate normalization math (`e.clientX / window.innerWidth`) is already correct for the full-viewport renderer — only the event capture area needs expansion.

**Alternatives considered**:
- Adjusting coordinate math to compensate for sidebar offset — Rejected: the canvas IS full-viewport, so the existing math correctly maps viewport-relative clientX to NDC. Changing the math would break the alignment.
- Moving `#orb-hitzone` out of `#main-viewport` in the HTML — Rejected: simpler to change CSS positioning than restructure the DOM.

### R2: Stars Disappearing on Resize — Scaling Strategy

**Decision**: Scale star x-positions proportionally based on viewport aspect ratio relative to the 16:9 design reference. Formula: `xScale = Math.min(1, currentAspect / designAspect)`.

**Rationale**: At 45° FOV with camera at z=4.5, the visible horizontal half-extent at z=0 is `tan(22.5°) × 4.5 × aspect`. On portrait mobile (9:16 aspect), this shrinks to ±0.86 world units — 5 of 7 stars fall outside the frustum. Position scaling keeps all stars visible while preserving their relative arrangement.

**Alternatives considered**:
- Dynamic FOV adjustment — Rejected: increasing FOV above ~70° introduces noticeable perspective distortion on stars near edges.
- Camera pullback (increase z-position) — Rejected: at 9:16 aspect, camera would need to move to z=11.56, making everything too small.
- Viewport clamping (show "best on wider screen") — Rejected: owner explicitly authorized responsive behavior below 1200px for Beta.

### R3: Greek Key Pattern — CSS Implementation Approach

**Decision**: Pure CSS `repeating-linear-gradient` stack with 6 layers constructing the meander in a 36px repeating tile. Shimmer via `::before` pseudo-element using `transform: translateX()`.

**Rationale**: The constitution's Principle VI (Procedural-First) requires no external image files. A CSS gradient stack is fully procedural, works at any resolution, and requires no additional DOM elements beyond the existing `.frame__rune-band` div. The SVG data URI approach was considered but rejected as borderline against the "no images" principle.

**Alternatives considered**:
- SVG data URI in `background-image` — Rejected: technically uses `url()` which conflicts with Principle VI's "no external image files" intent, even though it's inline.
- CSS `border-image` with gradient — Rejected: `border-image` doesn't support `repeating-linear-gradient` with sufficient complexity for a meander pattern.
- Canvas-drawn texture — Rejected: overkill for a static decorative border; adds JS complexity.

### R4: Sidebar Description UX — Tooltip vs Subtitle vs Expandable

**Decision**: Always-visible subtitle (`<span class="project-desc">`) below the project name inside each button. On desktop, the full tagline expands on hover via GSAP. On mobile, first-tap expands tagline, second-tap opens panel.

**Rationale**: The Front-End Architect recommended against pure tooltips (inaccessible on touch devices, requires ARIA wiring). An always-visible short description provides zero-interaction discovery while the hover/tap expansion gives additional context. The description is automatically part of the button's accessible name — no `aria-describedby` needed.

**Alternatives considered**:
- Native `title` tooltip — Rejected: invisible on touch devices, inconsistent styling across browsers, poor accessibility.
- `aria-describedby` pointing to hidden text — Rejected: descriptions should be visible to all users, not just screen reader users.
- Expandable accordion per button — Rejected: adds animation complexity and layout shift risk in a narrow sidebar.

### R5: Terminal Loading Animation — Architecture

**Decision**: Independent GSAP timeline spawned via callback at t=2.8 in the reveal sequence (updated from t=2.3 per plan review amendment M-6 — ensures status lines complete fade-in at t=2.75 before scan text begins). Not nested in the master timeline. Uses TextPlugin for scan text, `textContent` swap for progress bar.

**Rationale**: An independent timeline ensures the terminal scan is non-blocking — the user can interact at any time, skip-reveal doesn't kill the scan, and the reveal's `onComplete` fires independently. The Motion Engineer's design keeps the scan under 7s total with ~0.7s per project scan.

**Alternatives considered**:
- Nested timeline in master reveal — Rejected: skipping the reveal would kill the scan timeline, and the scan would block the reveal's `onComplete` event.
- CSS-only animation with `@keyframes` — Rejected: cycling through 7 project names requires dynamic text content that CSS cannot provide.
- `setInterval` for text cycling — Rejected: not synchronized with RAF/GSAP ticker, risks jank from unsynchronized DOM writes during WebGL rendering.

### R6: Shimmer Animation — Compositor-Only Constraint

**Decision**: Shimmer MUST use `transform: translateX()` on a `::before` pseudo-element, NOT `background-position` animation.

**Rationale**: The Performance Specialist identified this as the single highest performance risk in Beta. `background-position` animation triggers paint on every frame, consuming 2-5ms of the 16.67ms frame budget. `translateX()` runs entirely on the GPU compositor with zero main-thread paint cost. The parent element must have `contain: layout style paint` and the pseudo-element must have `will-change: transform`.

**Alternatives considered**:
- `background-position` animation — Rejected: triggers paint every frame, measurable performance impact on integrated GPUs.
- GSAP-driven `backgroundPosition` tween — Rejected: same paint cost as CSS, plus GSAP ticker overhead.
- `filter: brightness()` oscillation — Rejected: `filter` is partially compositor-friendly but not as reliable as `transform` across browsers.

### R7: CSS Containment Strategy

**Decision**: Apply `contain` properties to isolate layout recalculation boundaries for DOM elements that change during animation.

**Rationale**: Text cycling in the terminal scan and description expansion in the sidebar both trigger layout reflows. Without containment, these reflows propagate to the full page layout tree, potentially causing frame drops during WebGL rendering. CSS `contain` isolates the reflow to the changed element's subtree.

**Containment map** (updated per plan review amendments M-1, M-2):
- `.frame`: `contain: layout style paint` (NOT `strict` — `size` component risks Safari rendering bugs on fixed-position elements with absolutely-positioned children)
- `#command-line`: `contain: layout style` (text changes during terminal scan)
- `#constellation-nav li`: `contain: layout style` (NOT `content` — `paint` component would clip sidebar description expansion animations)
- `.frame__greek-key`: `contain: layout style paint` (shimmer animation isolated)

## Resolved Unknowns

All Technical Context items are resolved. No NEEDS CLARIFICATION markers remain.

| Unknown | Resolution |
|---|---|
| Mouse offset root cause | Hitzone clipping, not coordinate math |
| Star visibility fix approach | Aspect-ratio-based x-position scaling |
| Greek key implementation | Pure CSS gradient stack, 36px tile |
| Sidebar description pattern | Always-visible subtitle + hover/tap expansion |
| Terminal scan architecture | Independent GSAP timeline, spawned via callback |
| Shimmer performance | `transform: translateX()` on pseudo-element |
| Auto-tier timing | Fallback timeout 12s → 20s |
