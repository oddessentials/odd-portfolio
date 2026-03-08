# Tasks: Splash Gate Polish

**Input**: Design documents from `/specs/018-splash-gate-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Static single-page site**: `js/`, `css/`, `assets/` at repository root
- **Design assets**: `design-assets/` (source art, not served)
- **Image processing**: Python 3.x + Pillow (PIL)

---

## Phase 1: Setup (Asset Processing)

**Purpose**: Generate all optimized web assets from design sources before any code changes

- [ ] T001 [P] Resize `design-assets/door-and-parchment-3.png` (1024x1536) to 768x1152 and save to `assets/chamber-door.png`
- [ ] T002 [P] Resize `design-assets/odd-wizard-desk.png` (1536x1024) to 768x512 and save to `assets/wizard-desk.png`
- [ ] T003 [P] Resize `design-assets/odd-wizard-quill.png` (1024x1536) to 48x48 RGBA with LANCZOS and save to `assets/quill-cursor.png`
- [ ] T004 Generate WebP variant of `assets/chamber-door.png` at quality 80 → `assets/chamber-door.webp`
- [ ] T005 [P] Generate WebP variant of `assets/wizard-desk.png` at quality 75 → `assets/wizard-desk.webp`

**Checkpoint**: All 5 optimized assets ready in `assets/`. Verify dimensions and file sizes match research targets (door ~300KB WebP, desk ~80-100KB WebP, cursor ~2-3KB PNG).

---

## Phase 2: User Story 1 + 2 — Door Replacement & Signature Removal (Priority: P1) MVP

**Goal**: Replace the door image with the updated version and remove the wizard signature. The door is the centerpiece — get this right first. Signature removal is a prerequisite (new door design doesn't include a signature area).

**Independent Test**: Load the splash gate and verify: (1) new door renders at correct size/position, (2) parchment text is legible and contained, (3) no signature image in DOM or network requests.

### Implementation

- [ ] T006 [P] [US2] Remove signature `<picture>` DOM creation (sigPic, sigSrc, sigImg variables and textBlock.append reference) in `js/splash.js`
- [ ] T007 [P] [US2] Remove `.splash-gate__signature` CSS rule (~6 lines) in `css/styles.css`
- [ ] T008 [US2] Delete orphaned asset files `assets/odd-wizard-signature.png` and `assets/odd-wizard-signature.webp`
- [ ] T009 [US1] Verify new door image in `assets/chamber-door.png` (768x1152 RGBA, generated in T001) renders correctly — check `img.width = 768; img.height = 1152` attributes still match in `js/splash.js`
- [ ] T010 [US1] Visual validation: parchment text ("Welcome, Traveler" + body) is contained within parchment area at ultrawide (5120x1440), desktop (1920x1080), tablet (768px), and mobile (<768px). Adjust `top/left/right/bottom` percentages on `.splash-gate__parchment-text` in `css/styles.css` only if text overflows the parchment area on the new door.

**Checkpoint**: Door replaced, signature removed, parchment text legible at all viewports. New door is the visual baseline for all subsequent changes.

---

## Phase 3: User Story 3 — Wizard Desk Reveal (Priority: P2)

**Goal**: Show the wizard's desk behind the door during the swing animation, adding narrative atmosphere ("entering the wizard's workshop").

**Independent Test**: Click the door on desktop — the desk image should be visible through the archway opening for ~1-2 seconds during the swing. On mobile (<768px), the desk should NOT load or appear.

### Implementation

- [ ] T011 [US3] Add wizard desk `<picture>` element to the scene in `buildSplashDOM()` in `js/splash.js`. Insert before `innerGlow` in DOM order so desk is the deepest layer. Use `<source srcset="assets/wizard-desk.webp" type="image/webp">` with `<img src="assets/wizard-desk.png">` fallback. Set `aria-hidden="true"`, `class="splash-gate__desk"`, and `pointer-events: none` via attribute.
- [ ] T012 [US3] Gate desk DOM insertion: wrap the desk `<picture>` creation in `if (window.innerWidth >= 768)` check in `js/splash.js` so mobile devices skip the image entirely (no download, no DOM node).
- [ ] T013 [US3] Add `.splash-gate__desk` and `.splash-gate__desk-img` CSS rules in `css/styles.css`: position absolute, inset 0, z-index 0 (same as inner-glow — DOM order puts desk behind), object-fit cover (crops landscape desk to portrait opening), pointer-events none, display block.
- [ ] T014 [US3] Visual validation: (1) desk visible through archway opening during door swing on desktop, (2) desk NOT present in DOM on mobile (<768px), (3) inner glow still overlays the desk with warm atmospheric light, (4) reduced-motion mode skips desk reveal (existing behavior — splash fades without swing).

**Checkpoint**: Desk reveals behind door on desktop. Mobile unaffected. Fallback graceful (inner glow shows if desk fails to load).

---

## Phase 4: User Story 4 — Quill Cursor (Priority: P3)

**Goal**: Replace the default pointer cursor with a quill pen when hovering over the door on fine-pointer (mouse/trackpad) devices.

**Independent Test**: On desktop with mouse, hover over the door — cursor changes to quill with nib as click point. On touch device, no cursor change. On archway/backdrop areas, default cursor.

### Implementation

- [ ] T015 [US4] Add `@media (hover: hover) and (pointer: fine)` rule in `css/styles.css` that sets `cursor: url('../assets/quill-cursor.png') 2 47, pointer` on `.splash-gate__door-container`. This overrides the existing `cursor: pointer` for fine-pointer devices only.
- [ ] T016 [US4] Visual validation: (1) quill cursor appears on door hover with mouse, (2) nib hotspot aligns with click point (bottom-left of cursor image), (3) cursor reverts to default outside door container, (4) no cursor change on touch devices, (5) if cursor image fails to load, `pointer` fallback is shown.

**Checkpoint**: Quill cursor works on desktop mouse, absent on touch, fallback to pointer on failure.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories combined

- [ ] T017 Cross-viewport regression test: load splash gate at ultrawide (5120x1440), standard desktop (1920x1080), tablet landscape (1024px), tablet portrait (768px), mobile (375px). Verify door, text, desk, cursor all behave correctly at each breakpoint.
- [ ] T018 Accessibility validation: (1) focus trap still routes Tab to door container, (2) Enter/Space activate door click, (3) `aria-modal="true"` and `aria-describedby="splash-text"` present, (4) `prefers-reduced-motion: reduce` skips all animations and fades splash immediately, (5) screen reader announces "Welcome, Traveler" dialog content.
- [ ] T019 Performance check: verify no additional draw calls introduced (desk is a DOM image, not Three.js), confirm total splash image payload matches research targets (door ~300KB + desk ~100KB + cursor ~3KB WebP/PNG desktop; door ~300KB only on mobile).
- [ ] T020 Clean up any orphaned CSS rules: verify `.splash-gate__instruction` rule in `css/styles.css` is still needed (instruction text was removed in a prior commit). Remove if orphaned.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1+US2 (Phase 2)**: Depends on T001 (door asset) and T004 (door WebP) from Setup
- **US3 (Phase 3)**: Depends on T002 (desk asset) and T005 (desk WebP) from Setup. Can start in parallel with Phase 2 if desired, but recommended after Phase 2 to validate the door baseline first.
- **US4 (Phase 4)**: Depends on T003 (cursor asset) from Setup. Independent of all other stories — can run in parallel with Phase 2 or 3.
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 + US2 (P1)**: Combined as one phase — signature removal is a prerequisite for door replacement. No dependencies on US3 or US4.
- **US3 (P2)**: Recommended after US1+US2 (door baseline) but technically independent.
- **US4 (P3)**: Fully independent — can run in parallel with any other story.

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can all run in parallel (different source files, different output files). T004 depends on T001; T005 depends on T002.
- **Phase 2**: T006 and T007 can run in parallel (different files: js vs css). T008 depends on T006+T007.
- **Phase 3 and Phase 4**: Can run in parallel with each other (different files, no shared dependencies).

---

## Parallel Example: Phase 1 Setup

```text
# Launch all asset resizes in parallel:
Task T001: "Resize door to 768x1152 → assets/chamber-door.png"
Task T002: "Resize desk to 768x512 → assets/wizard-desk.png"
Task T003: "Resize quill to 48x48 → assets/quill-cursor.png"

# Then generate WebP variants (depend on resize outputs):
Task T004: "Generate WebP for door"
Task T005: "Generate WebP for desk"
```

## Parallel Example: Phase 2 US1+US2

```text
# Launch signature removal in parallel (different files):
Task T006: "Remove signature DOM in js/splash.js"
Task T007: "Remove signature CSS in css/styles.css"

# Then cleanup and validation (depends on above):
Task T008: "Delete signature asset files"
Task T009: "Verify door image attributes"
Task T010: "Visual validation at all breakpoints"
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (asset processing)
2. Complete Phase 2: US1+US2 (door replacement + signature removal)
3. **STOP and VALIDATE**: Splash gate works with new door, no signature, text legible
4. This is a complete, shippable increment

### Incremental Delivery

1. Phase 1 (Setup) → All assets ready
2. Phase 2 (US1+US2) → New door + signature removed → **MVP shippable**
3. Phase 3 (US3) → Desk reveal added → Deploy/Demo
4. Phase 4 (US4) → Quill cursor added → Deploy/Demo
5. Phase 5 (Polish) → Final validation → Feature complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Asset processing (Phase 1) must complete before any code changes
- US1+US2 are combined into one phase because signature removal is a prerequisite for door replacement
- Commit after each phase completion
- The new door has baked-in text/logo in the lower parchment area — T010 must validate that the dynamic text overlay clears this region
