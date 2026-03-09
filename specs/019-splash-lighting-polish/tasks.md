# Tasks: Splash Lighting Polish

**Input**: Design documents from `/specs/019-splash-lighting-polish/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story (6 stories from spec.md, P1→P2→P3 priority order). All changes confined to `css/styles.css` (splash-gate section) and `js/splash.js` (playDoorOpen function).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or independent selectors)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Include exact file paths and CSS selectors in descriptions

---

## Phase 1: Setup

**Purpose**: No new files or dependencies — verify baseline and document current state.

- [X] T001 Replace stone-wall-tile with higher-detail brick tile (design-assets/brick-background-00.png → assets/stone-wall-tile.webp + .png): convert to optimized WebP (389KB), update backdrop background-size from 512px 768px to 1024px 1024px in css/styles.css (line 2279). Larger tile reduces repetition seams at wide viewports (SC-002)
- [X] T002 Read current splash-gate CSS section (lines 2233–2508) in css/styles.css and js/splash.js playDoorOpen function (lines 177–205) to confirm baseline selectors match plan expectations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared infrastructure needed — all changes are property modifications on existing elements. Phase skipped.

**Checkpoint**: Proceed directly to user story implementation.

---

## Phase 3: User Story 1 — Warm Chamber Lighting (Priority: P1) 🎯 MVP

**Goal**: Transform the glow from "sci-fi portal" (cyan-dominant, rainbow cycling) to "candlelit chamber" (warm amber/gold dominant, constrained warm oscillation).

**Independent Test**: Load splash gate, confirm glow is warm amber/gold at rest. Watch for 8+ seconds — hue should oscillate within gold-to-amber range only, never showing cyan/green/magenta.

**FR Coverage**: FR-001, FR-002, FR-003

### Implementation for User Story 1

- [X] T003 [US1] Restructure `.splash-gate__inner-glow` radial-gradient in css/styles.css (line 2347): replace current gradient with warm amber center (rgba(184,146,68,0.50) at 0%), darker amber (rgba(140,100,40,0.25) at 25%), faint cool accent (rgba(94,180,220,0.08) at 55%), transparent at 75%
- [X] T004 [US1] Restructure `.splash-gate__glow` box-shadow in css/styles.css (line 2297): reorder to warm brass innermost (rgba(200,168,75,0.3) 60px 15px), amber mid (rgba(184,146,68,0.2) 90px 30px), faint cool outermost (rgba(94,207,255,0.15) 120px 50px)
- [X] T005 [US1] Replace `@keyframes chromatic-shift` in css/styles.css (line 2304): change from 0deg→360deg linear to multi-stop warm oscillation: 0% at 0deg, 33% at 18deg, 66% at -12deg, 100% at 0deg (per R-004)

**Checkpoint**: Glow reads as candlelit chamber. No cyan dominance. Hue stays within warm range.

---

## Phase 4: User Story 2 — Depth & Shadow Realism (Priority: P1)

**Goal**: Add ambient occlusion shadows at architectural junctions and atmospheric perspective on depth layers so the scene communicates physical 3D space.

**Independent Test**: Archway projects forward (visible shadow on door). Door appears recessed (edge + threshold shadows). Desk appears dim/blurry/desaturated compared to foreground.

**FR Coverage**: FR-004, FR-005, FR-006, FR-007, FR-008

### Implementation for User Story 2

- [X] T006 [P] [US2] Add `filter: drop-shadow(2px 4px 8px rgba(0,0,0,0.5))` and `transform: translateZ(0)` (iOS Safari fix per R-001) on `.splash-gate__archway` in css/styles.css (line 2393)
- [X] T007 [P] [US2] Add inset box-shadow on `.splash-gate__door-container` in css/styles.css (line 2361): `box-shadow: inset 3px 0 8px rgba(0,0,0,0.4), inset -3px 0 8px rgba(0,0,0,0.4), inset 0 -4px 6px rgba(0,0,0,0.5)` for recess shadow on edges and contact shadow at base
- [X] T008 [P] [US2] Add inset box-shadow on `.splash-gate__scene` in css/styles.css (line 2310): `box-shadow: inset 0 0 40px 10px rgba(0,0,0,0.4)` for archway-meets-wall depth vignette
- [X] T009 [P] [US2] Add `filter: blur(1.5px) saturate(0.7) brightness(0.55)` on `.splash-gate__desk-img` in css/styles.css (line 2330) for atmospheric perspective on desk (desktop only — desk already hidden on mobile). TUNING NOTE: if 0.55 is too dark on dimmer displays, increase to 0.65
- [X] T010 [US2] Add `filter: brightness(0.88) saturate(0.9)` on `.splash-gate__door-img` in css/styles.css (line 2384) to match door to ambient stone light level

**Checkpoint**: Archway casts shadow, door is recessed, desk looks deep/dim. Door doesn't appear self-illuminated.

---

## Phase 5: User Story 3 — Backdrop Lighting & Vignette (Priority: P2)

**Goal**: Fix backdrop lighting logic (lighter center, darker edges) to simulate warm light spilling from doorway, and add scene vignette to frame the archway as focal point.

**Independent Test**: Stone texture visible near center, nearly invisible at edges. No tile seams at 3840px. Natural vignette frames archway.

**FR Coverage**: FR-009, FR-010, FR-014

### Implementation for User Story 3

- [X] T011 [US3] Invert `.splash-gate__backdrop` radial-gradient in css/styles.css (line 2266): change to lighter center (rgba(26,21,16,0.4) at 0%), darker mid (rgba(13,11,9,0.7) at 50%), near-opaque edges (rgba(4,5,15,0.9) at 100%) — center lighter, edges darker
- [X] T012 [US3] Add warm light-spill `::after` pseudo-element on `.splash-gate__backdrop` in css/styles.css: position absolute, inset 0, radial-gradient ellipse at 50% 50% from rgba(184,146,68,0.08) at center to transparent at 60%, pointer-events none
- [X] T013 [US3] Add scene vignette `::after` pseudo-element on `.splash-gate__scene` in css/styles.css: position absolute, inset 0, z-index 3, radial-gradient ellipse from transparent at 50% to rgba(0,0,0,0.6) at 100%, pointer-events none

**Checkpoint**: Backdrop lit from center, dark at edges. Vignette frames archway. No tile seams at wide viewports.

---

## Phase 6: User Story 4 — Cinematic Door Open Sequence (Priority: P2)

**Goal**: Make the door open lighting progression physically correct — glow holds/increases during Beat 1, transitions to warm brass by Beat 3, rim light intensifies, desk brightness ramps.

**Independent Test**: Click door. Beat 1: glow does NOT dim. Beat 3: glow is warm brass. Rim light brightens during swing. Desk reveals gradually.

**FR Coverage**: FR-011, FR-012, FR-013, FR-019

### Implementation for User Story 4

- [X] T014 [US4] Add warm rim-light box-shadow on `.splash-gate__door-container` in css/styles.css: `box-shadow: 0 -2px 10px rgba(184,146,68,0.15), -2px 0 8px rgba(184,146,68,0.1), 2px 0 8px rgba(184,146,68,0.1)` (initial subtle state; combine with recess shadows from T007 into single box-shadow declaration)
- [X] T015 [US4] Fix Beat 1 glow in js/splash.js playDoorOpen (line 189): change `opacity: 0.35` to `opacity: 0.58` so glow holds steady/slightly increases during initial pull (FR-012)
- [X] T016 [US4] Fix Beat 2 glow blur ramp in js/splash.js playDoorOpen (line 193): change `filter: 'blur(20px)'` to `filter: 'blur(12px)'` for gradual progression (4px initial → 12px mid-swing)
- [X] T017 [US4] Add Beat 3 warm color transition in js/splash.js playDoorOpen (line 197): add `boxShadow: '0 0 80px 25px rgba(200,168,75,0.35), 0 0 120px 50px rgba(184,146,68,0.25)'` to the existing Beat 3 tween on glowEl for warm brass glow peak
- [X] T018 [US4] Add rim light intensification tween to GSAP timeline in js/splash.js playDoorOpen: add `tl.to(doorContainer, { boxShadow: '0 -4px 20px rgba(184,146,68,0.4), -4px 0 15px rgba(184,146,68,0.3), 4px 0 15px rgba(184,146,68,0.25)', duration: 0.9, ease: 'power1.out' }, 0.3)` during Beat 2-3 (FR-019)
- [X] T019 [US4] Add Beat 3 blur completion in js/splash.js playDoorOpen: add `filter: 'blur(20px)'` to the existing Beat 3 glowEl tween (line 197) for smooth 12px→20px ramp
- [X] T020 [US4] Add dynamic desk brightening tween to GSAP timeline in js/splash.js playDoorOpen: query `.splash-gate__desk-img` inside root, add `tl.to(deskImg, { filter: 'blur(0.5px) saturate(0.8) brightness(0.75)', duration: 1.5, ease: 'power1.out' }, 0.3)` to ramp desk from dim to visible during Beat 2-3 (spec US4 acceptance scenario 4). Gate behind `if (deskImg)` since desk is hidden on mobile

**Checkpoint**: Door open feels physically correct. Glow never dips. Warm brass peak at full swing. Rim light intensifies. Desk brightens gradually during reveal.

---

## Phase 7: User Story 5 — Scene Atmosphere & Life (Priority: P3)

**Goal**: Add subtle torch flicker, entrance fade-from-black, door hover feedback, and ensure all new animations respect reduced-motion.

**Independent Test**: Observe 5+ seconds idle — subtle flicker visible. Reload — scene fades up from black. Hover door on desktop — brightness shifts. Enable reduced-motion — all new animations suppressed.

**FR Coverage**: FR-015, FR-016, FR-017, FR-020

### Implementation for User Story 5

- [X] T021 [P] [US5] Add `@keyframes torch-flicker` in css/styles.css after chromatic-shift keyframes: multi-stop opacity oscillation (0%: var base, 23%: +0.02, 41%: -0.01, 67%: +0.015, 84%: -0.005, 100%: base) per R-002. Use CSS custom property `--glow-base-opacity` on `.splash-gate` root
- [X] T022 [US5] Apply torch-flicker as secondary animation on `.splash-gate__glow` (3.7s ease-in-out infinite) and `.splash-gate__inner-glow` (5.3s ease-in-out infinite) in css/styles.css — append to existing `animation` property alongside chromatic-shift (R-002: use `opacity` not `filter` for flicker)
- [X] T023 [P] [US5] Add `@keyframes splash-entrance` in css/styles.css: from opacity 0 to opacity 1, 700ms ease-out. Apply to `.splash-gate` with `animation: splash-entrance 700ms ease-out forwards`
- [X] T024 [P] [US5] Add door hover state in css/styles.css: inside existing `@media (hover: hover) and (pointer: fine)` block (line 2373), add `.splash-gate__door-container:hover { filter: brightness(1.08); }` with `transition: filter 0.3s ease` on the base `.splash-gate__door-container` rule
- [X] T025 [US5] Update `@media (prefers-reduced-motion: reduce)` block in css/styles.css (line 2492): add `.splash-gate__inner-glow { animation: none !important; }` (PRE-EXISTING BUG FIX: inner-glow was missing from reduced-motion suppression), `.splash-gate { animation: none !important; }`, and `.splash-gate__door-container { transition: none !important; }` to suppress torch-flicker, entrance fade, and hover transition (FR-020)

**Checkpoint**: Scene breathes subtly. Entrance fades from black. Hover responds on desktop. Reduced-motion suppresses all.

---

## Phase 8: User Story 6 — Edge Softening & Material Integration (Priority: P3)

**Goal**: Eliminate hard pixel boundaries and compositing seams between scene layers for a continuous environment feel.

**Independent Test**: Examine archway edges — smooth fade, no hard pixels. Scene side panels — no compositing seam between scene background and backdrop. Door brightness matches ambient stone.

**FR Coverage**: FR-018

### Implementation for User Story 6

- [X] T026 [P] [US6] Add `-webkit-mask-image` and `mask-image` edge feathering on `.splash-gate__archway-img` in css/styles.css (line 2400): `mask-image: linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)` with `-webkit-` prefix (R-005)
- [X] T027 [P] [US6] Change `.splash-gate__scene` background edge-fade from fixed `100px` to responsive `8%` in css/styles.css (line 2316): update `linear-gradient(to right, transparent 0px, #1a1510 8%, #1a1510 92%, transparent 100%)`

**DEFERRED** (per reviewer consensus): T_DEFERRED — warm unifying color wash `::before` with `mix-blend-mode: overlay` on `.splash-gate__scene`. Risk: overlay blend mode inside a `perspective: 1200px` container may flatten the 3D transform context and break the door swing animation. Revisit only if scene still looks fragmented after all other phases complete.

**Checkpoint**: No hard pixel boundaries. Smooth scene-to-backdrop transitions.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories, performance check, and regression testing.

- [X] T028 Verify all 6 user stories work together in css/styles.css and js/splash.js — no property conflicts between phases (especially box-shadow declarations on door-container from T007+T014, and verify `--splash-glow-opacity` starting value matches Beat 1 expectations)
- [ ] T029 [P] Verify 60fps during door swing on desktop — open Chrome DevTools Performance tab, record door open sequence, confirm no dropped frames from added filters/shadows. FALLBACK: if box-shadow animation (T018) drops frames, replace with opacity tween on a pre-styled pseudo-element
- [ ] T030 [P] Verify no regressions: focus trap (Tab trapped in splash, Enter/Space opens door), keyboard navigation to portfolio nav after splash, parchment text legible, loading state works, audio plays
- [ ] T031 [P] Verify mobile (<768px): scene benefits from static fixes (glow color, shadows, backdrop), no JS errors, no hover effects on touch, desk filters don't apply (desk hidden)
- [ ] T032 [P] Cross-browser check: Chrome, Firefox, Safari — no visual breakage from filters, drop-shadow, mask-image
- [ ] T033 Run quickstart.md testing checklist (27 items) in specs/019-splash-lighting-polish/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — read current code
- **Foundational (Phase 2)**: Skipped — no shared infrastructure needed
- **US1 (Phase 3)**: No dependencies on other stories — can start immediately. Foundation for all other visual changes.
- **US2 (Phase 4)**: Independent of US1 (different selectors) but benefits from US1's warm glow being in place for visual coherence
- **US3 (Phase 5)**: Independent. Backdrop and vignette don't interact with glow or shadow selectors
- **US4 (Phase 6)**: Depends on US1 (glow colors) and US2 (rim light base). Must run after Phases 3–4
- **US5 (Phase 7)**: Depends on US1 (glow animation property is modified). Must run after Phase 3
- **US6 (Phase 8)**: Independent of all other stories
- **Polish (Phase 9)**: Depends on all user stories being complete

### Recommended Execution Order

```
Phase 3 (US1: Color Temp) ──→ Phase 4 (US2: Shadows) ──→ Phase 6 (US4: Door Open)
                           ──→ Phase 5 (US3: Backdrop)     ↗
                           ──→ Phase 7 (US5: Atmosphere)
Phase 8 (US6: Edges) can run anytime
                                                        ──→ Phase 9 (Polish)
```

### Within Each User Story

- CSS property additions before JS animation changes
- Static properties before animated properties
- Base states before pseudo-elements/keyframes

### Parallel Opportunities

- **Phase 4**: T006, T007, T008, T009 all target different selectors — can run in parallel
- **Phase 7**: T021, T023, T024 target different selectors/blocks — can run in parallel
- **Phase 8**: T026, T027 target different selectors — can run in parallel
- **Phase 9**: T029, T030, T031, T032 are independent validation checks — can run in parallel

---

## Parallel Example: User Story 2

```text
# Launch all shadow additions together (different selectors):
T006: Add drop-shadow on .splash-gate__archway in css/styles.css
T007: Add inset box-shadow on .splash-gate__door-container in css/styles.css
T008: Add inset box-shadow on .splash-gate__scene in css/styles.css
T009: Add filter on .splash-gate__desk-img in css/styles.css
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (read baseline)
2. Complete Phase 3: US1 — Warm Chamber Lighting
3. **STOP and VALIDATE**: Glow reads as candlelit chamber, not sci-fi portal
4. This single change has the highest visual impact of any phase

### Incremental Delivery

1. US1 (Color Temp) → Validate warm glow → Foundation set
2. US2 (Shadows) → Validate depth → Scene has 3D presence
3. US3 (Backdrop) → Validate environment → Stone wall correctly lit
4. US4 (Door Open) → Validate animation → Climactic interaction polished
5. US5 (Atmosphere) → Validate life → Scene breathes
6. US6 (Edges) → Validate softening → No compositing seams
7. Each story adds visual fidelity without breaking previous stories

---

## Notes

- All changes confined to 2 files: `css/styles.css` (splash-gate section, lines 2233–2508) and `js/splash.js` (playDoorOpen, lines 177–205)
- No new DOM elements, no new image assets, no new JS dependencies
- Net impact: ~+75 CSS lines, ~+15 JS lines (increased from ~12 due to desk brightening tween)
- GSAP only interpolates single-layer box-shadow (R-003) — multi-layer transitions use property merging, not animated crossfade
- **Reviewer feedback incorporated**: deferred mix-blend-mode wash (3D flattening risk), added desk brightening tween (spec gap), fixed inner-glow reduced-motion bug, added performance fallback notes, tuning guidance for desk brightness
- CSS `filter` and `animation` on same element: use `opacity` for torch-flicker since `chromatic-shift` already animates `filter: hue-rotate()` (R-002)
- iOS Safari: `translateZ(0)` on archway prevents filter+3D flattening (R-001)
- box-shadow declarations on `.splash-gate__door-container` from T007 (recess) and T014 (rim light) must be combined into a single declaration
- Brick tile replaced in T001: 1024x1024 (was 512x768) — fewer repetitions at wide viewports
