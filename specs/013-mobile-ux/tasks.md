# Tasks: Mobile UX Improvements

**Input**: Design documents from `specs/013-mobile-ux/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Asset preparation and shared infrastructure

- [ ] T001 Optimize `design-assets/og-image.png` from 1.43MB to ≤600KB using pngquant or equivalent lossy PNG optimizer, then copy the optimized file to `assets/og-image.png`. Verify output dimensions remain 1200x630 and file size is under 600KB. (FR-019, FR-020, Research R4)
- [ ] T002 Create shared pointer capability utility in a new file `js/pointer-utils.js` (~15 lines): export a function (e.g., `isFinePointer()`) that evaluates `matchMedia('(hover: hover) and (pointer: fine)')` and returns the current boolean state. Also export the MediaQueryList reference so consumers can listen for `change` events to handle dynamic modality switching (e.g., tablet keyboard attach/detach). This single utility must be the only source of this query in the codebase. NOTE: scene.js is already at 425 lines (over the 400-line constitution limit), so this MUST be a separate module. (FR-001, Research R1)
- [ ] T003 Refactor `js/interactions.js:209` to import and use the shared pointer capability utility from `js/pointer-utils.js` instead of the inline `matchMedia('(hover: hover) and (pointer: fine)')` call. Verify the existing nav hover gating behavior is unchanged. (FR-001 single utility requirement)

**Checkpoint**: Shared utility available, OG image ready. User story work can begin.

---

## Phase 2: User Story 2 — Social Sharing Meta Tags (Priority: P1)

**Goal**: Rich social preview cards with branded 1200x630 image, correct OG/Twitter/canonical meta tags, all absolute URLs pointing to production domain.

**Independent Test**: Paste portfolio URL into Facebook Sharing Debugger, Twitter Card Validator, and LinkedIn Post Inspector. Verify branded image, title, and description appear. Confirm no OG image request during normal browser page load via DevTools Network tab.

### Implementation for User Story 2

- [ ] T004 [P] [US2] Update `index.html` `<head>` section: replace existing `og:image` (line 12, currently `assets/logo-oe-135.svg`) with absolute production URL to `assets/og-image.png`. Add missing OG tags: `og:image:width` (1200), `og:image:height` (630), `og:image:type` (image/png), `og:url` (production domain), `og:site_name` (Odd Essentials). All image/URL values must be absolute URLs with protocol and domain. (FR-013, FR-018, FR-022)
- [ ] T005 [P] [US2] Add Twitter Card meta tags to `index.html` `<head>`: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image` (absolute URL to `assets/og-image.png`), `twitter:site` (@odd_essentials). (FR-014)
- [ ] T006 [P] [US2] Add `<link rel="canonical">` tag to `index.html` `<head>` pointing to the production domain URL. Add `<meta name="description">` tag with content matching the og:description. Add `<meta name="theme-color" content="#0d0b09">`. (FR-015, FR-016, FR-017)
- [ ] T007 [US2] Add `og:image:alt` attribute to the og:image meta tag in `index.html` with descriptive alt text (e.g., "Odd Essentials portfolio — interactive starfield with project constellations in a Victorian brass instrument frame"). (FR-021)
- [ ] T008 [US2] Verify all metadata URLs in `index.html` reference the production domain only — no staging, localhost, or relative paths may appear in og:url, canonical, og:image, or twitter:image. Confirm the production domain is defined once and referenced consistently across all tags. (FR-022)
- [ ] T008a [P] [US2] Add Google Analytics (gtag.js) to `index.html` `<head>` section, placed after the `<meta>` tags and before font preconnects. Insert the gtag.js async script tag (`https://www.googletagmanager.com/gtag/js?id=G-DWYB1Q35MD`) and the inline config snippet with measurement ID `G-DWYB1Q35MD`.

**Checkpoint**: Social sharing metadata complete. Test with Facebook Sharing Debugger, Twitter Card Validator, LinkedIn Post Inspector after deployment. Perform cache-bust re-scrape to confirm updated metadata. Verify no og-image.png request in DevTools Network during normal page load.

---

## Phase 3: User Story 1 — Disable Logo Touch Tracking (Priority: P1)

**Goal**: Logo follow activates only for fine-pointer devices with hover support. Coarse-pointer/touch input never triggers logo follow. The logo's tracking container does not capture or intercept touch events on coarse-pointer devices.

**Independent Test**: Load portfolio on (a) phone, (b) tablet, (c) desktop with mouse. Confirm logo never follows touch on (a) and (b), follows mouse on (c). Taps on (a) and (b) pass through logo region to starfield.

### Implementation for User Story 1

- [ ] T009 [US1] In `js/logo-follow.js`, import the shared pointer capability utility from `js/pointer-utils.js`. Replace the `if (!_isMobile)` guard (line 118) that gates mouse event registration with a check against the pointer capability utility: only register mouseenter/mousemove/mouseleave handlers when the device reports fine-pointer with hover. (FR-001, FR-003)
- [ ] T010 [US1] In `js/logo-follow.js`, wrap the three touch event listeners (touchstart line 157, touchmove line 169, touchend line 177) inside the same fine-pointer capability check so they are NOT registered on coarse-pointer devices. Touch-follow must be completely disabled on phones, tablets, and touch-primary hybrid devices. (FR-001, FR-002)
- [ ] T011 [US1] In `js/logo-follow.js`, add a `change` event listener on the pointer capability MediaQueryList so that if the device modality switches mid-session (e.g., tablet keyboard detach), logo-follow behavior updates without page reload. When switching from fine to coarse: call `logoReturnHome()` and unbind mouse handlers. When switching from coarse to fine: bind mouse handlers and set up quickTo instances. (FR-003, FR-004)
- [ ] T012 [US1] In `js/scene.js` `onResize()` handler (line 177), add a 150ms debounce around the breakpoint-crossing logic (the `isMobile` flag update and its downstream effects like `resetOnResize()`). The renderer.setSize() and camera.aspect updates must remain immediate (no debounce). Only the `isMobile` toggle and dependent state changes are debounced. (FR-004, Research R5)
- [ ] T013 [US1] Verify that the logo element (`#brand-logo`) retains `pointer-events: none` (already set inline on index.html:124) so it does not intercept taps regardless of device. Confirm the `#orb-hitzone` touch handlers for star raycasting (scene.js lines 152-174) continue to function normally after logo-follow touch handlers are removed on coarse-pointer devices. (FR-002, Research R7)

**Checkpoint**: Logo follow disabled on all touch devices. Desktop mouse follow unchanged. Star tapping and scrolling work cleanly on phones and tablets. Rapid viewport resize does not cause flicker.

---

## Phase 4: User Story 3 — Show Right Gauge on Mobile (Priority: P2)

**Goal**: Right gauge visible on mobile (<768px) at bottom-right, 72px max, hidden during overlays, driven by shared zone-state signal.

**Independent Test**: Load portfolio on mobile emulator at <768px. Confirm right gauge visible bottom-right above command line, animates on zone scroll, hides when hamburger or project panel opens.

### Implementation for User Story 3

- [ ] T014 [P] [US3] In `css/styles.css`, modify the `@media (max-width: 767px)` rule (line ~1680) that sets `.frame__gauge { display: none }`. Change to hide only `.frame__gauge--left` (display: none). The `.frame__gauge--right` must remain visible. (FR-005, FR-006)
- [ ] T015 [US3] In `css/styles.css`, add mobile-specific positioning rules for `.frame__gauge--right` within the `@media (max-width: 767px)` block: position fixed, bottom-right corner, above the command line footer (bottom: calc(var(--cmd-line-height) + 8px)), right: 8px, max width/height: 72px, z-index: 40 (above canvas z-index:1 but below nav overlay ~100 and panel ~200). Add `env(safe-area-inset-bottom)` and `env(safe-area-inset-right)` to the position offsets for notched/home-indicator devices. (FR-007)
- [ ] T016 [US3] In `css/styles.css`, add a mobile rule for `.frame__gauge--right .gauge__bracket` to clip the bracket to the gauge boundary: `overflow: hidden` on the gauge container, or `display: none` on the bracket on mobile. (FR-009)
- [ ] T017 [US3] In `css/styles.css`, add a CSS rule to hide the mobile gauge when the hamburger nav is open using the `:has()` selector: `#app-shell:has(#hamburger-btn.is-open) .frame__gauge--right { display: none }`. This works because both elements share `#app-shell` as a common ancestor. The `:has()` selector has 93%+ browser support. This is CSS-driven, no JS needed for the nav case. (FR-008, Research R6)
- [ ] T018 [US3] In `js/app.js`, add `panel-open` and `panel-close` event listeners that toggle a CSS class (e.g., `.gauge--panel-hidden`) on the `.frame__gauge--right` element. In `css/styles.css`, add a rule: `.frame__gauge--right.gauge--panel-hidden { display: none }`. This hides the gauge when the project detail panel is open and shows it when the panel closes. (FR-008, Research R6)
- [ ] T019 [US3] Verify that gauge animations (needle, glow, micro-tremor) from `js/gauge.js` continue to function correctly when the right gauge transitions between visible and hidden states on mobile. Confirm GSAP tweens targeting `--needle-angle` and `--gauge-zoneN-glow` custom properties persist through display:none toggling per Research R3. (FR-010, VT-001)
- [ ] T020 [US3] Verify the mobile gauge reads from the same zone-state signal as desktop: confirm `scroll-zones.js` calls `setGaugeZone()` + `animateNeedles()` + `animateGlow()` directly for both gauges, and no separate mobile zone tracking exists. Confirm needle updates are triggered by the discrete zone-change signal (ScrollTrigger callback), not by continuous scroll listeners. (FR-010, VT-002)
- [ ] T021 [US3] Test the mobile gauge on a 320px-wide viewport to confirm it fits without overflow. Test with prefers-reduced-motion enabled to confirm the gauge appears but with no tremor animation (instant needle position, no glow transitions). (FR-011, spec edge case)

**Checkpoint**: Right gauge visible on mobile, properly positioned, animates on zone change, hides during overlays, no overflow on small screens. Both desktop gauges unchanged.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories

- [ ] T022 [P] Run quickstart.md testing checklist: phone (<768px), tablet (~810px), desktop (mouse), hybrid (Surface Pro) — verify all acceptance scenarios from spec.md US1, US2, US3
- [ ] T023 [P] Verify no visual or behavioral regression on tablet (768px+) and desktop (1200px+): both gauges visible in original positions, logo mouse-follow functional on fine-pointer devices, all original meta tags preserved or superseded (SC-005)
- [ ] T024 Confirm line counts for all modified JS modules remain under 400-line constitution limit: logo-follow.js (currently 225), scene.js (currently 425 — already over, must not increase), pointer-utils.js (new, ~15 lines), app.js (currently 359), interactions.js (currently 304)
- [ ] T025 Test rapid viewport resize (rotate device back and forth within 1 second) to confirm no gauge flicker and debounce settles to correct state within 150ms (SC-008)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
  - T001 (OG image) unblocks T004-T008 (meta tags)
  - T002 (pointer utility in js/pointer-utils.js) unblocks T003, T009-T011 (interactions refactor, logo follow)
  - T003 (interactions refactor) can run in parallel with T001
- **User Story 2 (Phase 2)**: Depends on T001 (OG image ready)
- **User Story 1 (Phase 3)**: Depends on T002, T003 (pointer utility + interactions refactor)
- **User Story 3 (Phase 4)**: No dependencies on other stories — can run in parallel with Phase 2 and Phase 3
- **Polish (Phase 5)**: Depends on all story phases complete

### User Story Dependencies

- **User Story 2 (P1 — Social Meta)**: Blocked by T001 only. Can start as soon as OG image is optimized.
- **User Story 1 (P1 — Logo Touch)**: Blocked by T002, T003. Can start as soon as pointer utility exists.
- **User Story 3 (P2 — Mobile Gauge)**: No cross-story dependencies. CSS work (T014-T017) can start immediately in parallel with everything. JS work (T018) depends on understanding panel events (already researched).

### Within Each User Story

- US2: T004, T005, T006 can run in parallel (different meta tag groups). T007, T008 are sequential after.
- US1: T009, T010 are sequential (same file, related logic). T011 after T009/T010. T012 independent (different file). T013 is verification.
- US3: T014 first (enables gauge display). T015 after T014 (positioning). T016, T017 can parallel after T014. T018 after T017 (JS overlay wiring). T019-T021 are verification.

### Parallel Opportunities

- T001 + T002 + T003: All different files, can run in parallel
- T004 + T005 + T006: All different meta tag groups in same file, but can be combined into one edit session
- T014 + T009: Different files (styles.css vs logo-follow.js), can run in parallel
- US2 (Phase 2) + US3 (Phase 4): Entirely independent, can run in parallel
- T022 + T023: Independent verification tasks, can run in parallel

---

## Parallel Example: All Stories in Parallel

```text
# After Phase 1 Setup completes (T001-T003):

# Stream A — US2 (Social Meta):
T004: Update OG meta tags in index.html
T005: Add Twitter Card tags in index.html
T006: Add canonical, description, theme-color in index.html
T007: Add og:image:alt in index.html
T008: Verify production URLs in index.html

# Stream B — US1 (Logo Touch):
T009: Gate mouse handlers behind pointer capability in js/logo-follow.js
T010: Gate touch handlers behind pointer capability in js/logo-follow.js
T011: Add modality change listener in js/logo-follow.js
T012: Add resize debounce in js/scene.js
T013: Verify logo pointer-events and star raycasting

# Stream C — US3 (Mobile Gauge):
T014: Show right gauge on mobile in css/styles.css
T015: Position gauge bottom-right in css/styles.css
T016: Clip bracket on mobile in css/styles.css
T017: Hide gauge on nav open in css/styles.css
T018: Wire panel events for gauge hide in js/app.js
T019-T021: Verification tasks
```

---

## Implementation Strategy

### MVP First (User Story 2 — Social Meta Tags)

1. Complete Phase 1: T001 (OG image optimization)
2. Complete Phase 2: T004-T008 (meta tags in index.html)
3. **STOP and VALIDATE**: Deploy, test with Facebook/Twitter/LinkedIn debuggers
4. This is the lowest-risk, highest-impact change — immediately improves every social share

### Incremental Delivery

1. T001-T003 (Setup) → Shared infrastructure ready
2. T004-T008 (US2: Social Meta) → Test with platform debuggers → Deploy
3. T009-T013 (US1: Logo Touch) → Test on phone/tablet/desktop → Deploy
4. T014-T021 (US3: Mobile Gauge) → Test on mobile emulators → Deploy
5. T022-T025 (Polish) → Full cross-device verification → Final deploy

---

## Notes

- No automated tests — this project uses manual cross-device testing only
- All JS modifications must keep modules under the 400-line constitution limit
- The gauge is DOM-only (no WebGL impact) — zero draw call budget change
- OG image is not rendered in the viewport — it only exists for crawler meta tags
- Commit after each task or logical group for clean git history
