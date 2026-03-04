# Tasks: Alpha — Full-Bleed Starfield & Responsive

**Input**: Design documents from `/specs/002-alpha-fullbleed-responsive/`
**Prerequisites**: plan.md, spec.md from feature 002

**Organization**: Tasks modify existing POC files — grouped by the 3 critical changes + polish.

---

## Phase 1: Full-Bleed Starfield (US1)

**Goal**: Remove orb geometry, distribute stars/nebula across full viewport.

- [ ] T001 [US1] In `js/scene.js`: Remove orb group sphere meshes (outer glass IcosahedronGeometry, rim sphere, inner glow sphere). Keep OrbGroup as a container for stars and nebula but remove the spherical containment. Remove all MeshPhysicalMaterial glass references and BackSide sphere references.
- [ ] T002 [US1] In `js/scene.js`: Redistribute nebula particles across the camera frustum instead of a spherical radius. Use a rectangular volume matching the viewport aspect ratio (e.g., x: -3 to 3, y: -2 to 2, z: -2 to 1) so particles fill the screen edge-to-edge. Increase particle spread for the 3 layers (core, mid, haze) proportionally.
- [ ] T003 [US1] In `js/data.js`: Update star positions from spherical coordinates (radius 0.3-0.85) to viewport-distributed coordinates spanning the visible frustum area. Spread stars across a wider x/y range (e.g., -2.5 to 2.5 on x, -1.5 to 1.5 on y) with varied z-depths for parallax. Maintain minimum separation.
- [ ] T004 [US1] In `css/styles.css`: Make `#orb-canvas` fill the entire viewport (`position: fixed; inset: 0; width: 100%; height: 100%`). Remove any circular clipping, border-radius, or orb-specific containment styles. Ensure the canvas renders behind all frame elements via z-index.
- [ ] T005 [US1] In `js/scene.js`: Update camera and renderer to use `window.innerWidth` / `window.innerHeight` instead of viewport element dimensions for full-screen rendering. Update resize handler to match.
- [ ] T006 [US1] In `js/performance.js`: Update post-processing EffectComposer to use full window dimensions. Remove orb-centric chromatic aberration (the smoothstep orb-edge calculation no longer applies) — apply a subtle uniform vignette instead.

**Checkpoint**: Starfield fills entire browser window. No orb visible. Stars interactive across full viewport.

---

## Phase 2: Animated Logo Follow-Cursor (US2)

**Goal**: Logo stays in header band, but animates to follow the cursor when hovering over the starfield. Returns to header when cursor leaves.

- [ ] T007 [US2] In `index.html`: Keep the logo `<img>` in `.frame__header-band` but give it an id (`id="brand-logo"`). Add CSS class hooks: `.logo--following` for when it's tracking the cursor. Ensure the logo element has `pointer-events: none` so it doesn't intercept clicks. Hide default cursor on starfield with `cursor: none` on `#orb-hitzone`.
- [ ] T008 [US2] In `css/styles.css`: Style `#brand-logo` with `position: absolute` inside the header band (its "home" position), `transition: none` when following (GSAP handles movement), `z-index` above the starfield but below overlays. Add `.logo--following` class: `position: fixed`, smaller size (~40x40px), `pointer-events: none`, `filter` with slight glow/brightness boost. When NOT following, logo sits in its header band home position at normal size.
- [ ] T009 [US2] In `js/interactions.js` or new section in `js/scene.js`: Add logo-follow logic — on `mousemove` over `#orb-hitzone`/canvas: add `.logo--following` class, use `gsap.quickTo` to smoothly animate logo position to cursor coordinates (with slight lag for organic feel, e.g., duration 0.3s). On `mouseleave` from starfield: remove `.logo--following`, animate logo back to its header band home position with a smooth GSAP tween. On star hover: additionally switch cursor from `none` to `pointer` (logo still follows but pointer indicates clickability). On touch devices: logo stays in header (no follow behavior).
- [ ] T010 [US2] In `js/scene.js`: When a star is hovered, show the pointer cursor alongside the following logo. When hover exits, hide cursor again (back to `cursor: none` with logo following). Ensure the logo doesn't obscure star labels — offset the logo position slightly from the actual cursor point if needed.

**Checkpoint**: Logo sits in header band. When mouse enters starfield, logo smoothly animates to follow cursor. On star hover, pointer cursor also appears. When mouse leaves starfield, logo animates back to header. Touch devices: logo stays in header, no follow.

---

## Phase 3: Responsive & Mobile (US3, US4)

**Goal**: Full responsive layout with mobile touch support and hamburger menu.

- [ ] T011 [US3] In `index.html`: Add `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` to head. Remove `<div id="narrow-viewport-msg">` entirely. Add a hamburger menu button: `<button id="hamburger-btn" class="hamburger-btn" aria-label="Open navigation" aria-expanded="false" aria-controls="constellation-nav">` with 3-line SVG/CSS icon, positioned top-left, visible only on mobile (<768px).
- [ ] T012 [US3] In `css/styles.css`: Add responsive breakpoints — `@media (max-width: 1199px)` for tablet (narrower sidebars ~160px), `@media (max-width: 767px)` for mobile (hide sidebars, show hamburger, full-bleed starfield, command line thinner). Remove the old `@media (max-width: 1199px)` that hid the app-shell. Mobile overlay styles for constellation nav (slide-in from left, full height, dark backdrop).
- [ ] T013 [US3] In `css/styles.css`: Mobile project overlay styles — full-width panel, larger touch targets (min 44x44px on all buttons/links), simplified brass frame (thinner borders), larger font sizes for readability. Scroll-snap gallery adapts to full-width images.
- [ ] T014 [US3] In `js/interactions.js`: Add hamburger menu logic — toggle button click opens/closes constellation nav overlay, manage `aria-expanded`, body scroll lock when nav is open, close on Escape key, close on backdrop tap, close on nav item selection. Add touch event listeners for star interaction: `touchstart`/`touchend` mapped to raycaster coordinates using first touch point.
- [ ] T015 [US3] In `js/scene.js`: Add mobile detection (`const isMobile = window.innerWidth < 768`). If mobile: reduce nebula particle count to 400 (proportionally across 3 layers: ~210 core, ~120 mid, ~70 haze), clamp DPR to 1.0, boost nebula color saturation by 20% (`PointsMaterial.color` multiplication). Add touch event listeners on canvas/hitzone for raycasting (same normalized coordinate calculation as mouse).
- [ ] T016 [US3] In `js/performance.js`: If mobile, skip `initPostProcessing()` entirely (return null). The GSAP ticker renders directly via `renderer.render(scene, camera)` without EffectComposer. This eliminates bloom, chromatic aberration, and vignette on mobile.
- [ ] T017 [US3] In `js/animations.js`: Adapt reveal sequence for mobile — keep command line typewriter and nebula bloom phases, simplify/remove frame assembly phase (no sidebars to animate on mobile), skip gauge animations. Shorter total duration on mobile (~4s vs ~6.5s desktop). If mobile performance benchmark fails, skip reveal entirely and show starfield immediately.
- [ ] T018 [US4] In `css/styles.css`: Ensure smooth transitions at breakpoint boundaries using CSS `clamp()` for sidebar widths and fluid typography. Test that resizing the browser across 768px and 1200px thresholds doesn't produce layout jumps.

**Checkpoint**: Mobile shows full-screen starfield with touch interaction. Hamburger opens nav. Panels are full-width. Tablet shows narrower sidebars. No "wider screen" warning anywhere.

---

## Phase 4: Polish & Cross-Cutting

**Purpose**: Final refinements across all viewports.

- [ ] T019 In `js/scene.js`: Handle device orientation changes — listen for `resize` events (covers orientation change), recalculate camera aspect, renderer size, and star label positions. Ensure no visual glitch during rotation.
- [ ] T020 [P] In `css/styles.css`: Hamburger button styling — 3-line icon using CSS (3 spans with transitions for open/close animation), brass-tinted, positioned top-left with z-index above starfield, 44x44px touch target. Transforms to X when nav is open.
- [ ] T021 [P] In `index.html`: Update OG meta tags for alpha (description, title reflecting "portfolio" not "POC"). Ensure favicon still works.
- [ ] T022 Cross-viewport testing: verify desktop (1920px), tablet (1024px, 768px), mobile (375px, 320px), landscape mobile, portrait tablet. Verify all 7 projects reachable on every viewport. Verify touch and mouse both work.
- [ ] T023 Accessibility audit: verify hamburger menu keyboard accessible (Enter open, Escape close, Tab through items), focus management on mobile nav open/close, screen reader announces hamburger state, `prefers-reduced-motion` works on all viewports, `prefers-contrast: more` works on mobile layout.

---

## Dependencies & Execution Order

- **Phase 1** (full-bleed): Can start immediately — core visual change
- **Phase 2** (logo cursor): Can run in parallel with Phase 1 (different files/concerns)
- **Phase 3** (responsive): Depends on Phase 1 (needs full-bleed starfield before adding breakpoints)
- **Phase 4** (polish): Depends on all phases complete

### Parallel Opportunities
- T001-T006 (full-bleed scene changes) and T007-T010 (logo cursor) are independent
- T020, T021 can run in parallel with T022, T023

---

## Implementation Strategy

### MVP: Phase 1 + 2
Full-bleed starfield + logo cursor on desktop. Validates the visual transformation.

### Complete: + Phase 3
Add responsive layout. Validates mobile experience.

### Ship: + Phase 4
Polish, testing, accessibility audit. Ready for production.

Total: 23 tasks across 4 phases.
