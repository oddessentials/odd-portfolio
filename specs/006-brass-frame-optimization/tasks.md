# Tasks: Brass Frame Optimization

**Input**: Design documents from `/specs/006-brass-frame-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests — this is a CSS-only visual feature. Validation is manual visual inspection per quickstart.md.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/sections, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact CSS line ranges and file paths included

---

## Phase 1: Setup (CSS Custom Properties)

**Purpose**: Update design tokens and add new custom properties that all stories depend on.

- [ ] T001 Add `--frame-bracket-ratio: 2.5` and `--frame-gauge-size: calc(var(--frame-border-width) * 2.25)` custom properties to `:root` in css/styles.css (line ~39)
- [ ] T002 Change `--frame-corner-size` from `80px` to `calc(var(--frame-border-width) * var(--frame-bracket-ratio))` in `:root` in css/styles.css (line ~41)
- [ ] T003 Add CSS comment documenting that `.frame`'s `contain: layout style` (without `paint`) is required for gauge negative positioning — if `paint` is ever added, gauges will be clipped — in css/styles.css (line ~1448)

**Checkpoint**: Custom properties updated — corner and edge sizing cascades correctly.

---

## Phase 2: Foundational (Shared Corner Infrastructure)

**Purpose**: Base clip-path and gradient changes that apply to all four corners before individual positioning.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Remove shared `border-radius: 8px` from base `.frame__corner` rule in css/styles.css (line ~282) — clip-path makes it dead code
- [ ] T005 Replace shared `.frame__corner` `radial-gradient` background with a simple opaque fallback gradient (linear-gradient with brass tones, no transparent stops) in css/styles.css (line ~280-281)
- [ ] T006 Reduce shared corner `box-shadow` outer glow from `0 0 20px` spread to `0 0 8px` to minimize hard clip-path edge artifacts in css/styles.css (line ~316-320)

**Checkpoint**: Foundation ready — all corners have opaque backgrounds and reduced shadows.

---

## Phase 3: User Story 1 — Corners Read as Structural Brackets (Priority: P1) MVP

**Goal**: All four corners display as opaque L-shaped brackets that seamlessly join the frame rails.

**Independent Test**: Load site at 1920x1080 — all four corners appear as crisp L-brackets with no transparent fade against dark sidebars.

### Implementation for User Story 1

- [ ] T007 [US1] Add `clip-path: polygon()` and `-webkit-clip-path: polygon()` to `.frame__corner--tl` creating the TL L-bracket shape in css/styles.css (line ~322-330)
- [ ] T008 [P] [US1] Add `clip-path: polygon()` and `-webkit-clip-path: polygon()` to `.frame__corner--tr` creating the TR L-bracket shape (mirrored X) in css/styles.css (line ~332-340)
- [ ] T009 [P] [US1] Add `clip-path: polygon()` and `-webkit-clip-path: polygon()` to `.frame__corner--bl` creating the BL L-bracket shape (mirrored Y) in css/styles.css (line ~342-350)
- [ ] T010 [P] [US1] Add `clip-path: polygon()` and `-webkit-clip-path: polygon()` to `.frame__corner--br` creating the BR L-bracket shape (mirrored XY) in css/styles.css (line ~352-360)
- [ ] T011 [US1] Replace per-corner `radial-gradient` + `linear-gradient` backgrounds with opaque 3-stop linear-gradients (dark edge, highlight band, dark edge) matching adjoining edge rail profiles — update all four `--tl/--tr/--bl/--br` rules in css/styles.css (lines ~326-360)
- [ ] T012 [US1] Remove dead `border-bottom-right-radius`, `border-bottom-left-radius`, `border-top-right-radius`, `border-top-left-radius` declarations from all four corner variants in css/styles.css (lines ~325, 335, 345, 355)
- [ ] T013 [US1] Add 1px interior bevel — `box-shadow: inset` with dark offset on inner elbow edges of each corner variant (FR-014) in css/styles.css (lines ~322-360)
- [ ] T014 [US1] Reposition rivet `::before` from `top:10px; left:10px` to horizontal arm center and `::after` from `bottom:10px; right:10px` to vertical arm center — update shared rivet positions in css/styles.css (lines ~300-308)
- [ ] T015 [US1] Reduce rivet size from `12px` to `10px` to fit proportionally on 18px-wide bracket arms in css/styles.css (lines ~290-291)

**Checkpoint**: All four corners render as opaque L-brackets with rivets on arms and interior bevel. Visual test at desktop.

---

## Phase 4: User Story 2 — Gauges Mounted on Border Rails (Priority: P1)

**Goal**: Both side gauges visually anchored to the vertical border rails with no floating gap.

**Independent Test**: Load site at 1920x1080 — both gauges centered on border rails, brass ring overlaps rail, needle animation works.

### Implementation for User Story 2

- [ ] T016 [US2] Change `.frame__gauge` width and height from `64px` to `var(--frame-gauge-size)` in css/styles.css (line ~471-472) — auto-cascades at all breakpoints
- [ ] T017 [US2] Update `.frame__gauge` background `radial-gradient` stop percentages to maintain the same ring proportions at the new diameter in css/styles.css (line ~474-476)
- [ ] T018 [US2] Scale `.frame__gauge::before` (gauge face) inset from `12px` to `8px` and adjust `conic-gradient` tick marks for new diameter in css/styles.css (lines ~483-512)
- [ ] T019 [US2] Scale `.frame__gauge::after` (needle) height from `20px` to `14px` minimum and widen base by 1px for tapered silhouette in css/styles.css (lines ~519-531)
- [ ] T020 [US2] Reposition `.frame__gauge--left` from `left: 28px` to `left: calc(var(--frame-border-width) / 2 - var(--frame-gauge-size) / 2)` (centers on rail, auto-cascades) in css/styles.css (line ~533-534)
- [ ] T021 [P] [US2] Reposition `.frame__gauge--right` from `right: 28px` to `right: calc(var(--frame-border-width) / 2 - var(--frame-gauge-size) / 2)` (centers on rail, auto-cascades) in css/styles.css (line ~539-540)

**Checkpoint**: Both gauges centered on border rails. Needle animation plays correctly at new size.

---

## Phase 5: User Story 3 — Extended Edge Coverage (Priority: P2)

**Goal**: Edge rails extend further to meet new smaller corner brackets, with seamless material joins.

**Independent Test**: Load site — edge rails extend closer to viewport corners. Greek key band extends further. No gaps between corners and edges.

### Implementation for User Story 3

- [ ] T022 [US3] Verify edge rail `left`/`right`/`top`/`bottom` positioning uses `var(--frame-corner-size)` and automatically adjusts with the new value — inspect all four `.frame__edge--*` rules in css/styles.css (lines ~379-429)
- [ ] T023 [US3] Verify `.frame__greek-key` `left`/`right` positioning uses `var(--frame-corner-size)` and automatically extends with new corner size in css/styles.css (lines ~563-564)
- [ ] T024 [US3] Verify Greek key `background-size` tile alignment still works cleanly at the new wider band (no mid-tile clipping at edges) in css/styles.css (line ~574)

**Checkpoint**: Edges extend seamlessly to new corners. Greek key band fills wider area correctly.

---

## Phase 6: User Story 4 — Responsive Scaling (Priority: P2)

**Goal**: Frame elements scale proportionally at tablet and mobile breakpoints.

**Independent Test**: Resize browser through 1199px, 767px breakpoints — corners scale, gauges resize/hide, no visual breakage.

### Implementation for User Story 4

- [ ] T025 [US4] Remove explicit `--frame-corner-size: 60px` override from tablet breakpoint — the `calc()` auto-resolves to `30px` when `--frame-border-width: 12px` in css/styles.css (line ~1295)
- [ ] T026 [US4] Remove explicit `.frame__gauge` width/height override from tablet breakpoint — `var(--frame-gauge-size)` auto-resolves to `27px` when `--frame-border-width: 12px`. Remove gauge position overrides too (calc auto-cascades) in css/styles.css (lines ~1309-1320)
- [ ] T027 [US4] Enforce minimum rivet size of `8px` at tablet breakpoint in css/styles.css (within tablet media query ~1292)
- [ ] T028 [US4] Remove explicit `--frame-corner-size: 40px` override from mobile breakpoint — auto-resolves to `20px` when `--frame-border-width: 8px` in css/styles.css (line ~1327)
- [ ] T029 [US4] Simplify mobile corners — remove clip-path at mobile breakpoint (8x20px arms are indistinguishable from simple stubs) in css/styles.css (within mobile media query ~1324)

**Checkpoint**: Frame scales correctly at all three breakpoints.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Animation verification, cross-browser testing, cleanup.

- [ ] T030 Update reveal animation fly-in offsets in js/animations.js (lines 41-44) — change hardcoded `60` to a computed value: `const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--frame-corner-size')) * 0.75` so offsets scale proportionally with corner size at any breakpoint
- [ ] T031 Verify reveal animation in js/animations.js — confirm gauge `scale: 0 → 1` and `--needle-angle` elastic animation work at new gauge size. No changes expected.
- [ ] T032 Cross-browser visual test: Chrome, Firefox, Safari — verify clip-path renders correctly on all four corners, gauge positioning clips cleanly at viewport edge.
- [ ] T033 Run quickstart.md testing checklist — all 9 items pass. Include verification that `aria-hidden="true"` and `pointer-events: none` remain on `.frame` (FR-011).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — shared corner base changes
- **US1 Corners (Phase 3)**: Depends on Phase 2 — clip-path and gradient work
- **US2 Gauges (Phase 4)**: Depends on Phase 1 only — independent of corner work
- **US3 Edges (Phase 5)**: Depends on Phase 1 — verification of cascading values
- **US4 Responsive (Phase 6)**: Depends on Phases 3 + 4 — responsive mirrors desktop values
- **Polish (Phase 7)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (Corners)**: Can start after Phase 2. No dependency on other stories.
- **US2 (Gauges)**: Can start after Phase 1. **Independent of US1** — can run in parallel.
- **US3 (Edges)**: Can start after Phase 1. Verification only — mostly automatic cascade.
- **US4 (Responsive)**: Depends on US1 + US2 completing (mirrors their values).

### Parallel Opportunities

- **T007, T008, T009, T010** (clip-paths on 4 corners) can all run in parallel
- **T020, T021** (gauge left/right positioning) can run in parallel
- **US1 and US2** can run in parallel after their respective prerequisites
- **T025-T031** (responsive tasks) are sequential within the breakpoint but T027/T028 can parallel

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch all four clip-paths in parallel:
T007: "clip-path on .frame__corner--tl in css/styles.css"
T008: "clip-path on .frame__corner--tr in css/styles.css"
T009: "clip-path on .frame__corner--bl in css/styles.css"
T010: "clip-path on .frame__corner--br in css/styles.css"

# Then sequentially: gradients (T011), remove dead radius (T012), bevel (T013), rivets (T014-T015)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 — Corners (T007-T015)
4. **STOP and VALIDATE**: All four corners render as L-brackets
5. This alone fixes the 3 most visible flaws (obstructed TL/TR/BL corners)

### Incremental Delivery

1. Setup + Foundational -> Custom properties ready
2. Add US1 (Corners) -> 3 of 5 flaws fixed (MVP!)
3. Add US2 (Gauges) -> 5 of 5 flaws fixed
4. Add US3 (Edges) -> Visual polish (seamless joins)
5. Add US4 (Responsive) -> All breakpoints working
6. Polish -> Animation tuning, cross-browser verification

---

## Notes

- All changes are in `css/styles.css` except animation verification (read-only review of `js/animations.js`)
- No new HTML elements — DOM element count stays at 31 (SC-003)
- No WebGL impact — all CSS-only changes
- clip-path promotes corners to compositor layers (~100KB VRAM) — acceptable
- The `--frame-bracket-ratio` CSS var enables visual tuning without polygon recalculation
