# Tasks: Scroll-Driven Exploration & Remaining Polish

**Input**: Design documents from `/specs/004-scroll-exploration-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Manual verification per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Data & Configuration)

**Purpose**: Update project data and configuration that all user stories depend on

- [X] T001 Update CONSTELLATION_ZONES professional names, statusText, nebulaHueRgb, and compressed scroll ranges (0.0–0.33, 0.33–0.66, 0.66–1.0) in js/data.js

---

## Phase 2: Foundational (DOM & CSS Infrastructure)

**Purpose**: HTML structure changes and CSS additions that MUST be complete before user story implementation

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Add `#scroll-driver` div (aria-hidden="true", role="presentation", tabindex="-1") as sibling after `#app-shell` in index.html
- [X] T003 [P] Move `#star-labels` div from inside `#main-viewport` to body level (after `#app-shell`, before `#scroll-driver`) in index.html
- [X] T004 [P] Add CSS for `#scroll-driver` (position: relative, z-index: 0, pointer-events: none) in css/styles.css
- [X] T005 [P] Add CSS for `#app-shell` position: fixed with inset: 0 and z-index: 1 in css/styles.css
- [X] T006 [P] Add CSS for `body.scroll-enabled` (overflow-y: auto) to conditionally enable scrolling after reveal in css/styles.css
- [X] T007 [P] Add CSS for `#star-labels` as position: fixed, inset: 0, z-index: 25, pointer-events: none, overflow: visible in css/styles.css. Add `#star-labels .star-label { pointer-events: auto; }` rule
- [X] T008 Remove `initScrollInteractions()` call from js/app.js (line ~41) — this call fires before reveal completes and uses the old pin-based approach

**Checkpoint**: DOM restructured, CSS infrastructure ready — user story implementation can begin

---

## Phase 3: User Story 1 — Logo Tracks Cursor Reliably (Priority: P1)

**Goal**: Fix logo-cursor desync in all scenarios: viewport exit/re-entry, resize, tab switch, device rotation

**Independent Test**: Move cursor into starfield → logo follows → move cursor out of browser window → logo returns to header → resize browser → move cursor back in → logo re-engages at correct position. Repeat 10 cycles with zero stuck states.

### Implementation for User Story 1

- [X] T009 [US1] Add resize handler for logo state in js/scene.js onResize(): if logoFollowing, call logoReturnHome(); if not, clear stale inline left/top/transform styles from logoEl
- [X] T010 [US1] Add document-level mouseleave listener in js/scene.js initLogoFollow() that calls logoReturnHome() when cursor exits the browser viewport entirely (not just the hitzone)
- [X] T011 [US1] Verify engageLogo() in js/scene.js calls gsap.killTweensOf(logoEl) before re-engaging (handles mid-return-animation re-entry, FR-007). Audit against commit 58be354 to avoid duplicate work

**Checkpoint**: Logo tracks cursor reliably in all scenarios — enter/exit/resize/tab-switch cycles produce zero desync

---

## Phase 4: User Story 2 — Scroll-Driven Exploration (Priority: P1)

**Goal**: Enable scroll-driven starfield exploration with zone-based nebula hue shifting, star highlighting, and nebula rotation

**Independent Test**: After reveal completes, scroll down through 300px — observe 3 distinct nebula color states (blue-violet → warm-gold → green-teal), corresponding stars brighten per zone, status text updates, nebula rotates. Scroll back up — all states revert cleanly.

**Depends on**: Phase 2 (DOM/CSS infrastructure)

### Implementation for User Story 2

- [X] T012 [US2] Delete old scroll code in js/animations.js: remove `initScrollInteractions()` (~70 lines), `brightenZoneStars()` (~28 lines), and `handleScrollDuringReveal()` functions
- [X] T013 [US2] Create custom nebula ShaderMaterial in js/scene.js: vertex shader (using uniform float size, varying vColor from vertex colors) + fragment shader (gl_PointCoord distance check, alpha smoothstep, uZoneColor/uZoneInfluence additive overlay). Replace PointsMaterial with ShaderMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }) for each nebula layer
- [X] T014 [US2] Create nebulaGroup (THREE.Group) in js/scene.js and reparent all nebula layers into it. Stars remain children of scene root, not nebulaGroup. Export nebulaGroup and nebula material references for use by animations.js
- [X] T015 [US2] Implement initScrollZones() in js/animations.js: set #scroll-driver height to (window.innerHeight + 300)px, create ScrollTrigger.create({ trigger: '#scroll-driver', start: 'top top', end: 'bottom bottom', onUpdate: self => handleScrollProgress(self.progress) }) with no pin property. Add body.classList.add('scroll-enabled')
- [X] T016 [US2] Wire initScrollZones() to fire on the reveal-complete custom event in js/app.js (replacing the removed initScrollInteractions() call). Ensure ScrollTrigger is not created before reveal completes (FR-012)
- [X] T017 [US2] Implement handleScrollProgress(progress) in js/animations.js: determine activeZoneIndex from CONSTELLATION_ZONES scrollStart/scrollEnd ranges, update nebula uniforms (uZoneColor from zone.nebulaHueRgb, tween uZoneInfluence 0→1), scale active zone stars to 1.3x base (gsap.to), reset non-active stars to 1.0x, update status panel text, set nebulaGroup.rotation.y = progress * Math.PI * 0.5
- [X] T018 [US2] Add reduced-motion handling in handleScrollProgress(): check prefers-reduced-motion, if active use gsap.set() for all transitions (zero duration), suppress star scaling entirely, suppress nebulaGroup rotation (keep at 0)
- [X] T019 [US2] Add mobile handling in handleScrollProgress(): if isMobile, use gsap.set() for all zone transitions (instant snap, no lerp)
- [X] T020 [US2] Implement skip-scroll affordance in js/animations.js: after reveal completes, show "↓ Scroll to explore" button that scrolls to bottom of #scroll-driver on click, fades after 3 seconds. Repurpose S key shortcut after reveal

**Checkpoint**: Scroll-driven exploration fully functional — 3 zones, reversible transitions, reduced-motion/mobile handling, skip affordance

---

## Phase 5: User Story 3 — Star Label Clipping Fix (Priority: P2)

**Goal**: Star hover labels appear fully visible on all 7 stars, including edge-positioned stars near sidebars

**Independent Test**: Hover odd-fintech (leftmost, x=-2.2) and repo-standards (rightmost, x=2.2) on 1920x1080 — both labels fully visible without clipping. Click sidebar buttons — still clickable.

### Implementation for User Story 3

- [X] T021 [US3] Add static per-star label anchor overrides in js/scene.js or js/interactions.js: odd-fintech (x=-2.2), ado-git-repo-insights (x=-2.0), and repo-standards (x=2.2) use left-anchored labels; all others use default right-anchored. Apply via CSS class or inline style when creating label elements
- [X] T022 [US3] Verify project3DtoScreen() coordinate projection still outputs correct viewport coordinates now that #star-labels is position:fixed at body level (no coordinate system changes expected — existing function already outputs viewport coords)

**Checkpoint**: All 7 star labels fully visible without clipping on desktop — sidebar buttons remain clickable

---

## Phase 6: User Story 4 — Y-Axis Star Scaling (Priority: P2)

**Goal**: Stars distribute vertically on portrait devices using yScale formula

**Independent Test**: Resize browser to 390x844 — all 7 stars visible and vertically distributed across 60%+ of viewport height

### Implementation for User Story 4

- [X] T023 [P] [US4] Add module-level `let yScale = 1;` variable in js/scene.js alongside existing xScale
- [X] T024 [US4] Update onResize() in js/scene.js: after computing xScale, add `yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3)`. Update star loop to apply both axes: `sprite.position.x = basePosition[0] * xScale; sprite.position.y = basePosition[1] * yScale;`. Keep nebula layers X-only scaling (intentional asymmetry)

**Checkpoint**: Stars distributed vertically on portrait viewports — yScale clamped at 0.8 minimum

---

## Phase 7: User Story 5 — Professional Brand Language (Priority: P3)

**Goal**: Zero fantasy-themed text visible during scroll interactions

**Independent Test**: Scroll through all 3 zones — status text shows "Browsing developer tools...", "Viewing data & analytics...", "Exploring web & client projects..."

**Note**: Most of this work is done in Phase 1 (T001 updates data.js). This phase verifies no other fantasy text surfaces during scroll.

### Implementation for User Story 5

- [X] T025 [US5] Audit all visible text in index.html, js/animations.js, and js/interactions.js for remaining fantasy-themed language during scroll interactions. Verify the `constellation` field in PROJECTS data is never rendered to users (internal identifier, intentionally retained)

**Checkpoint**: Zero fantasy text visible to users during scroll-driven interactions

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance safety net, auto-tier integration, final validation

- [X] T026 [P] Add auto-tier scroll-time safety net in js/performance.js: after existing idle benchmark, collect 10-frame scroll-time sample during first user scroll. If average exceeds 20ms, downgrade to tier 3 (instant zone transitions via gsap.set)
- [X] T027 [P] Add tier-3 handling in handleScrollProgress() in js/animations.js: if current tier is 3, use gsap.set() for all zone transitions (same as reduced-motion code path)
- [X] T028 Verify #scroll-driver height updates on window resize in js/animations.js (recalculate window.innerHeight + 300 on resize)
- [X] T029 Run quickstart.md verification checklist: test all scenarios (logo 10-cycle, scroll zones, label clipping, Y-axis scaling, professional text, reduced-motion, keyboard nav, performance)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: No dependencies — can start in parallel with Phase 1
- **Phase 3 (US1 Logo)**: Depends on Phase 2 (needs CSS/DOM infrastructure)
- **Phase 4 (US2 Scroll)**: Depends on Phase 1 (needs data.js updates) AND Phase 2 (needs DOM/CSS)
- **Phase 5 (US3 Labels)**: Depends on Phase 2 (needs #star-labels moved)
- **Phase 6 (US4 Y-Scaling)**: No dependencies — can start immediately (js/scene.js only)
- **Phase 7 (US5 Language)**: Depends on Phase 1 (needs data.js updates) AND Phase 4 (needs scroll working to verify)
- **Phase 8 (Polish)**: Depends on Phase 4 (needs scroll transitions to sample and test)

### User Story Dependencies

- **US1 (Logo)**: Independent — can start after Phase 2
- **US2 (Scroll)**: Depends on Phase 1 + Phase 2
- **US3 (Labels)**: Independent — can start after Phase 2
- **US4 (Y-Scaling)**: Fully independent — can start immediately
- **US5 (Language)**: Depends on US2 (needs scroll working to verify text)

### Parallel Opportunities

- **Phase 1 + Phase 2**: Can run in parallel (different files)
- **Within Phase 2**: T003, T004, T005, T006, T007 all touch different sections and can run in parallel
- **US1 + US3 + US4**: Can all run in parallel after Phase 2 (different code areas)
- **US4 (T023)**: Can start before any other phase (standalone js/scene.js change)
- **Phase 8**: T026 and T027 can run in parallel (different files)

---

## Parallel Example: After Phase 2

```
# Three independent user stories can proceed simultaneously:

Agent A (js/scene.js — logo section):
  T009 [US1] Resize handler for logo
  T010 [US1] Document mouseleave listener
  T011 [US1] Verify engageLogo kill behavior

Agent B (js/animations.js — scroll system):
  T012 [US2] Delete old scroll code
  T013 [US2] Nebula ShaderMaterial (js/scene.js)
  T014 [US2] NebulaGroup reparenting (js/scene.js)
  T015 [US2] initScrollZones()
  ...

Agent C (js/scene.js — scaling section):
  T023 [US4] Add yScale variable
  T024 [US4] Update onResize() for Y-axis
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Data updates (T001)
2. Complete Phase 2: DOM/CSS infrastructure (T002–T008)
3. Complete Phase 3: Logo fix (T009–T011)
4. Complete Phase 4: Scroll exploration (T012–T020)
5. **STOP and VALIDATE**: Test logo + scroll independently
6. This delivers the core new feature (scroll) + the critical bug fix (logo)

### Incremental Delivery

1. Phase 1 + 2 → Infrastructure ready
2. US1 (Logo) → Standalone fix, testable immediately
3. US2 (Scroll) → Core new feature, testable independently
4. US3 (Labels) → Polish fix, testable independently
5. US4 (Y-Scaling) → Polish fix, testable independently
6. US5 (Language) → Data verification, testable after scroll works
7. Phase 8 → Final polish and validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Total tasks: **29** (T001–T029)
- Tasks per story: US1=3, US2=9, US3=2, US4=2, US5=1, Setup=1, Foundation=7, Polish=4
- No new files created — all changes are in-place modifications
- No new CDN dependencies — uses existing Three.js 0.162.0 + GSAP 3.12.5
- Commit after each phase completion for clean git history
