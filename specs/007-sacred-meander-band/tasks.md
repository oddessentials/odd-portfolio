# Tasks: Sacred Meander Band

**Input**: Design documents from `/specs/007-sacred-meander-band/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No automated tests — this is a CSS-only visual feature. Validation is manual visual inspection per quickstart.md.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different selectors/sections, no property conflicts)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact CSS line ranges and file paths included

---

## Phase 1: Setup (Custom Property)

**Purpose**: Update the height variable that all user stories depend on.

- [x] T001 Change `--gk-height: 24px` to `--gk-height: var(--frame-border-width)` in the `.frame__greek-key` rule in css/styles.css (line ~565) — band height now auto-cascades from border width (18px desktop, 12px tablet, 8px mobile/hidden)

**Checkpoint**: Band height now tracks border rail width. SVG tile still renders (scaled to 18px). Visual may look slightly different at new size — expected.

---

## Phase 2: User Story 1 — Proportional Border Integration (Priority: P1) MVP

**Goal**: Band height matches border rail width at every breakpoint, with proportional box-shadow and cleaned-up responsive overrides.

**Independent Test**: Load site at 1920x1080 — meander band height equals top border rail width (both 18px). Resize to tablet (1024x768) — band scales to 12px. Mobile — band hidden.

### Implementation for User Story 1

- [x] T002 [US1] Reduce box-shadow proportionally for 18px height — change `inset 0 0 2px` to `inset 0 0 1px` and `0 1px 2px` to `0 1px 1px` in `.frame__greek-key` in css/styles.css (line ~583-587)
- [x] T003 [US1] Remove the tablet `--gk-height: 16px` override from the tablet media query `.frame__greek-key` block in css/styles.css (line ~1307) — value now auto-cascades from `--frame-border-width: 12px`
- [x] T004 [US1] Remove the tablet box-shadow override from the tablet media query `.frame__greek-key` block in css/styles.css (lines ~1308-1312) — the desktop box-shadow values at 1px spread work proportionally at both 18px and 12px heights
- [x] T005 [US1] Verify mobile `display: none` on `.frame__greek-key` is preserved in the mobile media query in css/styles.css (line ~1354-1356) — read-only verification, no changes expected

**Checkpoint**: Band height = rail width at all breakpoints. Tablet override removed (auto-cascade). Mobile hidden. Box-shadow proportional.

---

## Phase 3: User Story 2 — Directional Material Lighting (Priority: P2)

**Goal**: SVG tile has per-arm directional gradients — horizontal arms top-to-bottom, vertical arms left-to-right — with shared 3-stop brass color ramp.

**Independent Test**: At desktop, zoom to 200% — horizontal arms show top-to-bottom highlight-face-shadow gradient, vertical arms show left-to-right gradient. Tile seams invisible.

### Implementation for User Story 2

- [x] T006 [US2] Redesign SVG data-URI tile gradients in `.frame__greek-key` background property in css/styles.css (line ~576-578): Replace the three identically-oriented linearGradient definitions with two directional gradients sharing the same 3-stop brass ramp — gradient "h" (id='h', x1='0' y1='0' x2='0' y2='1', stops: #E8D090 → #C8A84B → #8B6914) for horizontal arms (top rail, inner hook, lower rail rects) and gradient "v" (id='v', x1='0' y1='0' x2='1' y2='0', same stops) for vertical arms (descender, inner stem rects). Use flat shadow fill #4A3508 for bottom rail area. Update each `<rect>` fill attribute to reference the correct gradient by arm direction.
- [x] T007 [US2] Update channel edge shadow rects in SVG tile — adjust thin shadow-line `<rect>` elements to use coordinate-relative units consistent with the 24-unit viewBox system. Ensure edge lines scale cleanly at 18px and 12px render sizes in css/styles.css (within the SVG data-URI at line ~576-578)

**Checkpoint**: Meander hooks show 3D embossed brass — horizontal arms lit top-to-bottom, vertical arms lit left-to-right. Tile-to-tile seams invisible at 200% zoom.

---

## Phase 4: User Story 3 — Performant Shimmer Animation (Priority: P2)

**Goal**: Shimmer and grain overlays use only compositor-safe properties — zero blend modes, zero paint events.

**Independent Test**: DevTools Performance panel → record 5s idle → zero Paint events from shimmer. Layers panel → shimmer ::before on its own compositor layer.

### Implementation for User Story 3

- [x] T008 [P] [US3] Remove `mix-blend-mode: screen` from `.frame__greek-key::before` (shimmer sweep) in css/styles.css (line ~624) — the translateX animation and will-change: transform already provide compositor-safe layer promotion
- [x] T009 [P] [US3] Remove `mix-blend-mode: multiply` from `.frame__greek-key::after` (brushed grain overlay) and add `opacity: 0.5` to preserve the grain darkening effect without blend modes in css/styles.css (line ~602)
- [x] T010 [US3] Verify `will-change: transform` is present on `.frame__greek-key::before` in css/styles.css (line ~625) and that `@keyframes shimmer-slide` uses only `transform: translateX()` (lines ~632-635) — read-only verification, no changes expected

**Checkpoint**: Zero Paint events in DevTools performance recording. Shimmer pseudo-element on its own compositor layer. Grain overlay still visible at 300% zoom.

---

## Phase 5: User Story 4 — Clean Pattern Termination (Priority: P3)

**Goal**: Partial tiles at band endpoints fade to background color via fixed-position gradient masks.

**Independent Test**: At desktop, inspect both band endpoints — partial tiles fade smoothly instead of clipping mid-hook. Resize window continuously — no clipping artifacts.

**Depends on**: US2 (T006) must be complete — this task extends the same `background` shorthand property that contains the SVG tile.

### Implementation for User Story 4

- [x] T011 [US4] Add left and right endpoint fade masks as additional background-image layers in the `.frame__greek-key` `background` shorthand property in css/styles.css (line ~576-580) — insert two `linear-gradient` layers BEFORE the SVG tile layer: left mask `linear-gradient(90deg, var(--color-brass-dark) 0%, transparent 100%) no-repeat 0 0 / var(--gk-height) 100%` and right mask `linear-gradient(270deg, var(--color-brass-dark) 0%, transparent 100%) no-repeat right 0 / var(--gk-height) 100%`. The masks are one tile-width wide and positioned at band edges, fading partial tiles to the background color.

**Checkpoint**: Both band endpoints show smooth fade instead of mid-hook clipping. Resize window — masks track edges automatically.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-browser verification, integration regression testing, full quickstart validation.

- [x] T012 Verify all 7 JS integration points function correctly — reveal animation (opacity fade to 0.7), reduced-motion (opacity 0.9), tier 2 (--shimmer-duration: 8s), tier 3 (.shimmer-disabled), mobile (display: none) — read-only verification of js/animations.js, js/app.js, js/performance.js per plan.md integration surface table
- [x] T013 Cross-browser visual test: Chrome, Firefox, Safari — verify SVG tile renders correctly with directional gradients, shimmer animates without Paint events, endpoint masks display in all three browsers
- [x] T014 Run quickstart.md full testing checklist — all 28 items pass. Confirm `.frame` retains `aria-hidden="true"` and `pointer-events: none` (FR-007, FR-008)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 Proportions (Phase 2)**: Depends on Phase 1 — box-shadow tuned for new height
- **US2 Lighting (Phase 3)**: Depends on Phase 1 — SVG tile rendered at new size
- **US3 Shimmer (Phase 4)**: Depends on Phase 1 only — independent of US1 and US2 (different CSS selectors)
- **US4 Termination (Phase 5)**: Depends on US2 (Phase 3) — extends the same `background` shorthand property
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (Proportions)**: Can start after Phase 1. No dependency on other stories.
- **US2 (Lighting)**: Can start after Phase 1. **Independent of US1** — can run in parallel.
- **US3 (Shimmer)**: Can start after Phase 1. **Independent of US1 and US2** — touches only ::before and ::after selectors.
- **US4 (Termination)**: Depends on US2 completing — both modify the `.frame__greek-key` `background` shorthand property.

### Parallel Opportunities

- **T008, T009** (US3 blend mode removal on ::before and ::after) can run in parallel with each other
- **US1, US2, and US3** can all run in parallel after Phase 1 setup (different CSS properties/selectors)
- **T003, T004** (US1 responsive cleanup) can run in parallel (removing independent override blocks)

---

## Parallel Example: After Setup

```bash
# After Phase 1 (T001) completes, launch three stories in parallel:
US1 (T002-T005): Box-shadow + responsive cleanup in .frame__greek-key main rule
US2 (T006-T007): SVG tile gradient redesign in background: url(...) data-URI
US3 (T008-T010): Blend mode removal on ::before and ::after selectors

# Then sequentially:
US4 (T011): Endpoint masks (depends on US2's SVG tile being final)
Polish (T012-T014): Cross-browser and regression verification
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: User Story 1 — Proportions (T002-T005)
3. **STOP and VALIDATE**: Band height = rail width at all breakpoints
4. This alone fixes the most visible flaw (disproportionate 24px band on 18px rail)

### Incremental Delivery

1. Setup → Height variable cascades
2. Add US1 (Proportions) → Band reads as part of rail (MVP!)
3. Add US2 (Lighting) → 3D embossed brass appearance
4. Add US3 (Shimmer) → Zero-paint-event animation
5. Add US4 (Termination) → Clean endpoint fading
6. Polish → Cross-browser, regression verification

---

## Notes

- All changes are in `css/styles.css` — no JS files modified
- No new HTML elements — DOM element count stays unchanged (FR-010)
- No WebGL impact — all CSS-only changes
- The SVG data-URI viewBox stays at `0 0 24 24` — render size controlled by CSS `background-size`
- The `.frame__greek-key` class name and `--shimmer-duration` custom property MUST be preserved for JS integration compatibility
- The `.shimmer-disabled` class behavior MUST continue to work for tier 3 degradation
