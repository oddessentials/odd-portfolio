# Tasks: Beta 0.1.0 — Portfolio Polish & Bug Fixes

**Input**: Design documents from `/specs/003-beta-portfolio-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not requested — manual testing only via quickstart.md checklist.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Exact file paths included in all descriptions

---

## Phase 1: User Story 1 — Fix Star Interaction Across Full Viewport (Priority: P1) 🎯 MVP

**Goal**: All 7 stars hoverable and clickable regardless of horizontal position on viewports ≥1200px.

**Independent Test**: Hover over all 7 stars left-to-right on 1920×1080 — each displays hover label and responds to click. Sidebar buttons remain clickable.

### Implementation

- [X] T001 [P] [US1] Change `#orb-hitzone` from `position: absolute` to `position: fixed; inset: 0` with `z-index: calc(var(--z-hud) - 1)` in `css/styles.css`
- [X] T002 [P] [US1] Add `raycaster.params.Sprite = { threshold: 0.15 }` after raycaster creation (~line 10) in `js/scene.js`

**Checkpoint**: Stars at all horizontal positions (including behind sidebars) respond to hover/click. Sidebar panels remain interactive above the hitzone.

---

## Phase 2: User Story 2 — View All Stars on Any Screen Size (Priority: P1)

**Goal**: All 7 stars remain visible from 320px to 2560px wide with proportional repositioning on narrow viewports.

**Independent Test**: Resize browser from 1920px → 320px — all 7 stars visible at every width. No stars jump or overlap.

### Implementation

- [X] T003 [US2] Store `userData.basePosition` as `[x, y, z]` array during star creation (lines ~360-384), add module-level `xScale` variable (default 1.0), implement `xScale = Math.min(1, currentAspect / designAspect)` formula in `onResize()` (line ~489), and apply `sprite.position.x = userData.basePosition[0] * xScale` for all 7 stars in `js/scene.js`
- [X] T004 [US2] Add nebula layer x-scaling (`nebulaLayers.forEach(layer => layer.scale.x = xScale)`) in `onResize()` and replace hard-coded `3.5` dust mote x-clamp with `3.5 * xScale` in render loop (line ~569) in `js/scene.js`

**Checkpoint**: All 7 stars visible at 390×844 (iPhone), 768×1024 (iPad portrait), 320×568 (iPhone SE). Nebula and dust scale with stars.

---

## Phase 3: User Story 3 — Sidebar Project Names & Descriptions (Priority: P2)

**Goal**: Left sidebar shows real project names with short descriptions. Hover expands tagline on desktop; first-tap previews on mobile.

**Independent Test**: Hover over each sidebar button on desktop — tagline expands smoothly within 300ms. On mobile, first tap shows tagline, second tap opens panel.

### Implementation

- [X] T005 [US3] Add `shortDesc` string field to all 7 PROJECTS entries in `js/data.js`: odd-ai-reviewers="AI code review pipeline", ado-git-repo-insights="Azure DevOps PR metrics", repo-standards="Repo quality standards", odd-self-hosted-ci="Self-hosted CI runtime", odd-map="Interactive office locator", odd-fintech="Financial intelligence dashboard", coney-island="Restaurant with AI chat"
- [X] T006 [P] [US3] Restructure left sidebar HTML in `index.html`: change header to "ODD PORTFOLIO", update `<nav aria-label>` to "Project portfolio navigation", replace each `.constellation-name` with `.project-label` containing `.project-name` + `.project-desc` spans (using shortDesc values), remove `aria-describedby="project-hint"` from all 7 buttons
- [X] T007 [P] [US3] Add CSS in `css/styles.css`: `.project-label`/`.project-name`/`.project-desc` styles (desc: font-body, text-xs, color-text-secondary, max-height:0, overflow:hidden, opacity:0 default), hover expand rule inside `@media (hover: hover) and (pointer: fine)`, mobile button min-height 52px; add responsive fixes: remove dead `grid-template-columns: 160px 1fr 160px` from `max-width: 1199px` block (~line 1113), add `@media (min-width: 768px)` reset for `#constellation-nav` (position:static, transform:none, transition:none) and `#status-panel` (display:flex)
- [X] T008 [US3] Implement `initNavHoverEffects()` in `js/interactions.js`: guard with `matchMedia('(hover: hover) and (pointer: fine)')`, attach mouseenter/mouseleave on each nav button, use `gsap.killTweensOf(desc)` then `gsap.to(desc, { maxHeight, opacity:1, duration:0.3 })` on enter, reverse on leave; scale glyph to 1.2x with `back.out(2)` easing; add `focus-visible` handler for keyboard parity; respect `prefers-reduced-motion` (instant show/hide)
- [X] T009 [US3] Implement touch guard in `js/interactions.js`: detect touch via `matchMedia('(pointer: coarse)')`, modify existing click handler (~line 349) to check `if (isTouchDevice && !btn.classList.contains('tagline-expanded')) { expandTagline(btn); return; }`, implement `expandTagline(btn)` (add class, GSAP expand) and `collapseTagline(btn)` (remove class, GSAP collapse), track `expandedBtn` state to collapse previous on new tap, add tagline collapse to existing backdrop click listener (~line 395)
- [X] T010 [US3] Add debounced (100ms) resize handler in `js/interactions.js`: on `window.resize`, if `innerWidth >= 768` and hamburger nav is open, call `closeHamburgerNav()` and collapse any expanded tagline

**Checkpoint**: Sidebar shows 7 real project names with descriptions. Hover/touch interactions work. Resize from mobile→desktop closes hamburger nav.

---

## Phase 4: User Story 4 — Terminal Loading Sequence (Priority: P2)

**Goal**: Right sidebar shows animated terminal scan cycling through 7 projects with progress bar, culminating in "PORTFOLIO READY".

**Independent Test**: Load portfolio — right sidebar scans 7 project names with progress bar, completes within 8s, doesn't block clicking sidebar buttons.

### Implementation

- [X] T011 [P] [US4] Restructure right sidebar HTML in `index.html`: change header to "ODD ESSENTIALS", replace static status lines with `.scan-output` container (`role="status"`) holding 3 `.scan-line` elements + `.loading-bar` div (`role="progressbar"`, `aria-valuenow="0"`, `aria-valuemin="0"`, `aria-valuemax="100"`) with `.loading-bar__fill` child; remove `aria-live="polite"` from `<aside id="status-panel">`; add `aria-hidden="true"` to mana `<meter>` element
- [X] T012 [P] [US4] Add CSS in `css/styles.css`: `.scan-line` styles (monospace, text-xs), `.loading-bar` (height, background, border), `.loading-bar__fill` (transform-origin: left center, scaleX(0), background: brass gradient, transition for non-animated updates), phosphor text glow `text-shadow: 0 0 4px rgba(122, 255, 178, 0.3)` on `.scan-line`
- [X] T013 [US4] Implement `playTerminalScan()` function in `js/animations.js`: create independent GSAP timeline; cycle 7 PROJECTS with TextPlugin at 30 chars/sec ("Scanning {id}..."); update ASCII bar `[##........] XX%` using hard-coded percentages `[14, 28, 43, 57, 71, 86, 100]`; update `aria-valuenow` on `.loading-bar`; final state "7 systems nominal" + phase indicator "PORTFOLIO READY" with brass glow flash (suppress to white flash under `prefers-contrast: more`); return timeline reference; dispatch `terminal-scan-complete` custom event on completion; `prefers-reduced-motion`: set final state immediately, return null
- [X] T014 [US4] Wire `playTerminalScan()` into reveal timeline in `js/animations.js`: add `tl.call(playTerminalScan, null, 2.8)` for desktop reveal (~line 216); add equivalent at t=0.5 for mobile reveal; verify `masterTimeline.progress(1)` (skip) fires the callback correctly; **update existing `.status-line` selectors** (lines 44, 534) to target restructured DOM elements (`.scan-line`, `.loading-bar`) so the reveal fade-in animation targets the correct elements after HTML restructure
- [X] T015 [US4] Update auto-tier benchmark in `js/performance.js`: change fallback timeout from `12000` to `20000` (~line 359); add `terminal-scan-complete` event listener alongside existing `reveal-complete` listener; benchmark fires 5s after BOTH events have fired, or on 20s fallback — whichever comes first

**Checkpoint**: Terminal scan runs during reveal, completes with "PORTFOLIO READY", doesn't block interaction. Skip reveal still triggers scan. Benchmark fires after scan completes.

---

## Phase 5: User Story 5 — Greek Key Border Enhancement (Priority: P3)

**Goal**: Top border shows brass Greek key meander pattern with shimmer animation, degradable via auto-tier.

**Independent Test**: Load portfolio — top border shows repeating Greek key in brass tones. After reveal, shimmer highlight sweeps across. Pattern scales at tablet, hidden on mobile.

### Implementation

- [X] T016 [US5] Rename `frame__rune-band` to `frame__greek-key` across all 4 references: `index.html` (line 73 class attribute), `css/styles.css` (line 525 selector), `js/animations.js` (line 43 querySelector), `js/animations.js` (line 533 querySelector)
- [X] T017 [US5] Implement Greek key pattern in `css/styles.css`: replace existing `.frame__greek-key` (formerly rune-band) gradient with 6-layer `repeating-linear-gradient` stack; keep existing brass stripe as fallback base layer; add custom properties `--gk-line: 3px`, `--gk-cell: 36px`, `--gk-color-face: var(--color-brass-mid)`, `--gk-color-shadow: var(--color-brass-dark)`, `--gk-color-highlight: var(--color-brass-light)`; change height from 6px to 18px desktop; add `overflow: hidden`; add responsive: 24px tile + 12px height at tablet (`--gk-cell: 24px`, `--gk-line: 2px`), `display: none` at mobile (<768px)
- [X] T018 [US5] Add shimmer animation in `css/styles.css`: create `::before` pseudo-element on `.frame__greek-key` with `width: 300%; left: -100%`; add highlight gradient (semi-transparent brass-light); add `--shimmer-duration: 4s` custom property; keyframes `shimmer-slide` from `translateX(-100%)` to `translateX(100%)`; `animation: shimmer-slide var(--shimmer-duration) ease-in-out infinite`; `will-change: transform`; add `prefers-reduced-motion` rule: `animation: none`; add `.shimmer-disabled::before { animation: none }` rule
- [X] T019 [US5] Add shimmer tier degradation in `js/performance.js`: in `applyTier2()` add `document.querySelector('.frame__greek-key')?.style.setProperty('--shimmer-duration', '8s')`; in `applyTier3()` add `document.querySelector('.frame__greek-key')?.classList.add('shimmer-disabled')`

**Checkpoint**: Greek key meander visible on top border in brass tones. Shimmer sweeps across. Pattern scales at tablet, hidden on mobile. Auto-tier correctly slows/disables shimmer.

---

## Phase 6: User Story 6 — Updated Brand Messaging (Priority: P3)

**Goal**: All visible text uses professional brand language with no fantasy/constellation terminology.

**Independent Test**: Load portfolio — read all visible text. Command line types "Force multipliers for small businesses...", title reads "Odd Essentials | Portfolio", no "constellation" references anywhere.

### Implementation

- [X] T020 [P] [US6] Update brand content in `index.html`: change `<title>` to "Odd Essentials | Portfolio"; update `og:description` to "Force multipliers for small businesses — 7 open-source projects in an interactive starfield."; update `.sr-only` paragraph (line 152) to remove constellation language; update `#orb-hitzone` `aria-label` (line 149) to "Interactive portfolio viewer. Use the project navigation to explore projects."; update `#orb-fallback` `alt` (line 151) to "OddEssentials portfolio projects"
- [X] T021 [P] [US6] Update animations in `js/animations.js`: change `playDiscoverabilityAffordance()` text to "Force multipliers for small businesses..." with duration 2.15s (20 chars/sec); change phase indicator text from "SCANNING" to "PORTFOLIO"; remove the stale `gsap.to(phaseIndicator, { delay: 3.5, ... })` "READY" flip; update desktop reveal CLI messages ("reveal universe"→professional, "calibrating starfield..."→professional, "ignition sequence active"→professional); update mobile reveal CLI messages similarly

**Checkpoint**: Page title correct. OG meta updated. Screen reader content professional. Command line types updated brand text. No "constellation" in any visible or accessible text (except known gap: CONSTELLATION_ZONES statusText — documented for 0.1.1).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Performance containment, accessibility verification, cross-browser testing.

- [X] T022 [P] Add CSS containment rules in `css/styles.css`: `contain: layout style` on `#command-line`, `contain: layout style` on `#constellation-nav li`, `contain: layout style paint` on `.frame`, `contain: layout style paint` on `.frame__greek-key`
- [X] T023 [P] Add `prefers-contrast: more` handling: verify Greek key auto-hidden by existing `.frame { display: none }` rule; suppress brass glow flash to plain white in terminal completion state (`js/animations.js`); verify dual-preference case (reduced-motion + high-contrast) shows instant final state with high-contrast styling
- [X] T024 Accessibility audit: keyboard navigation (Tab through all buttons, Arrow keys in nav, Enter to open panel, Escape to close), screen reader testing (project names readable, live regions announce scan progress, progress bar updates, no orphaned announcements), `prefers-reduced-motion` verification (all animations show final state)
- [X] T025 Performance profiling via Chrome DevTools: Layers panel (≤12 compositing layers steady state), Rendering > Paint flashing (shimmer shows NO green paint flash), Performance timeline (all frames <16.67ms at steady state, draw calls <30)
- [X] T026 Cross-browser validation: Chrome, Firefox, Safari — verify Greek key gradient rendering, shimmer animation, hover descriptions, terminal scan, hitzone fix, responsive star scaling
- [X] T027 Run `specs/003-beta-portfolio-polish/quickstart.md` testing checklist end-to-end, documenting pass/fail for each item

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies — can start immediately. **MVP milestone.**
- **US2 (Phase 2)**: No dependencies — can start immediately, parallel with US1.
- **US3 (Phase 3)**: T005 (data.js) must complete before T006 (HTML) and T008 (JS hover).
- **US4 (Phase 4)**: T011 (HTML) and T012 (CSS) must complete before T013 (JS animation).
- **US5 (Phase 5)**: T016 (class rename) must complete before T017 (CSS pattern). T017 before T018 (shimmer). T018 before T019 (degradation).
- **US6 (Phase 6)**: No internal dependencies. T020 and T021 are independent (different files).
- **Polish (Phase 7)**: Depends on all user stories being complete.

### User Story Independence

- **US1 + US2**: Fully independent, can run in parallel (US1 = styles.css + scene.js raycaster; US2 = scene.js positions — different sections)
- **US3 + US4**: Both modify `index.html` but in different sections (left sidebar vs right sidebar). Can run in parallel with merge coordination.
- **US5 + US6**: Fully independent. US5 is CSS/performance.js; US6 is index.html/animations.js.
- **US4 + US6**: Both modify `js/animations.js` — recommend sequential (US4 before US6) to avoid merge conflicts.

### Within Each User Story

1. Data/model changes first (T005 for US3)
2. HTML structure before CSS styles
3. CSS styles before JS interactions/animations
4. Core implementation before wiring/integration
5. Checkpoint validation after last task

### Parallel Opportunities

**Cross-story parallelism** (after no foundational blockers):
```
Agent A: US1 (T001-T002) → US3 (T005-T010) → US6 (T020-T021)
Agent B: US2 (T003-T004) → US4 (T011-T015) → US5 (T016-T019)
Then: Polish (T022-T027) after both agents complete
```

**Within-story parallelism**:
- US1: T001 ‖ T002 (styles.css ‖ scene.js)
- US3: T006 ‖ T007 (index.html ‖ styles.css) — after T005 completes
- US4: T011 ‖ T012 (index.html ‖ styles.css) — then T013→T014→T015
- US6: T020 ‖ T021 (index.html ‖ animations.js)
- Polish: T022 ‖ T023 (styles.css ‖ animations.js)

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete US1 (T001-T002) — 2 tasks, parallel
2. **STOP and VALIDATE**: Hover all 7 stars, click each, confirm sidebar still works
3. This fixes the most critical bug — portfolio interaction is fundamentally broken without it

### Incremental Delivery

1. US1 (hitzone fix) → validate → **deploy-ready**
2. US2 (responsive stars) → validate → **deploy-ready** (both P0 bugs fixed)
3. US3 (sidebar content) → validate → **deploy-ready** (content refreshed)
4. US4 (terminal scan) → validate → **deploy-ready** (loading experience)
5. US5 (Greek key) → validate → **deploy-ready** (visual polish)
6. US6 (brand messaging) → validate → **deploy-ready** (brand alignment)
7. Polish (T022-T027) → validate → **Beta 0.1.0 complete**

### Single Developer Strategy

Execute phases sequentially: US1 → US2 → US3 → US4 → US5 → US6 → Polish. Each story is independently testable at its checkpoint.

---

## Notes

- **27 total tasks** across 7 phases (6 user stories + 1 polish)
- No new files created — all changes in existing 8 files
- No build system — edit and refresh
- T005 (data.js shortDesc) is the only data model change
- T016 (class rename) is the only cross-file rename (4 references)
- Commit after each phase checkpoint for clean rollback points
- Known gaps documented: CONSTELLATION_ZONES fantasy text (0.1.1), star label clipping (P3 follow-up), y-axis scaling (future polish)
