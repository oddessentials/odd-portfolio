# Tasks: Gauge Enhancement — Victorian Instrument Upgrade

**Input**: Design documents from `/specs/010-gauge-enhancement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — manual visual verification tasks included in Polish phase.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add CSS custom properties and foundational styles that all user stories depend on

- [ ] T001 Add CSS custom properties for zone segment colors (--gauge-zone0: #6B40A1, --gauge-zone1: #B8870A, --gauge-zone2: #1A9E8F, --gauge-rest: #0D0B09) and glow state vars (--gauge-zone0-glow: 0, --gauge-zone1-glow: 0, --gauge-zone2-glow: 0) to .frame__gauge rule in css/styles.css (line ~573)

**Checkpoint**: Custom properties defined — user story implementation can begin

---

## Phase 2: User Story 1 - Zone-Colored Gauge Faces (Priority: P1) MVP

**Goal**: Replace the monochrome gauge faces with 4-segment zone-colored conic-gradients. Both gauges mirror each other so needles always point at the matching zone color. Active segment appears brighter.

**Independent Test**: Scroll through all zones — verify both needles point at the correct color segment (dark at rest, blue-violet for DevOps, warm-gold for Apps, green-teal for Community). Active segment should glow brighter than inactive segments.

### Implementation for User Story 1

- [ ] T002 [P] [US1] Replace left gauge ::before conic-gradient with zone-colored segments in css/styles.css (line ~541). Use `.frame__gauge--left::before` with `conic-gradient(from 0deg, var(--gauge-rest) 0deg 35deg, var(--gauge-zone0) 35deg 75deg, var(--gauge-zone1) 75deg 115deg, var(--gauge-zone2) 115deg 155deg, var(--gauge-rest) 155deg 360deg)`. Keep existing inset: 18% and border-radius: 50%. See research.md R1 for angle derivation.
- [ ] T003 [P] [US1] Replace right gauge ::before conic-gradient with mirrored zone-colored segments in css/styles.css. Use `.frame__gauge--right::before` with `conic-gradient(from 10deg, var(--gauge-rest) 0deg 240deg, var(--gauge-zone2) 240deg 280deg, var(--gauge-zone1) 280deg 320deg, var(--gauge-zone0) 320deg 360deg)`. Segment order is reversed to mirror left gauge. See research.md R1 for angle derivation.
- [ ] T004 [US1] Add active segment glow overlay as a second background layer on .frame__gauge::before in css/styles.css. Use a conic-gradient with rgba() colors modulated by the --gauge-zoneN-glow custom properties. The active zone segment should appear brighter (higher alpha) when its glow var is 1, dimmer when 0. Layer this on top of the base zone-color gradient using CSS multiple backgrounds.
- [ ] T005 [US1] Update js/scroll-zones.js handleScrollProgress() (line ~127) to set active segment glow CSS custom properties on zone change. When activeZoneIndex changes: set `--gauge-zone{activeIndex}-glow: 1` on both gauge elements, set all other zone glow vars to 0. Use gsap.to() for smooth transition or gsap.set() for instant (useInstant path). Cache gauge element references (already done: gaugeLeft, gaugeRight at lines 27-28).
- [ ] T006 [US1] Verify needle-to-color alignment across all 4 states by scrolling through each zone in browser. Confirm: rest — both needles at dark, zone0 — both at blue-violet, zone1 — both at warm-gold, zone2 — both at green-teal. Confirm active segment visually brighter than inactive segments.

**Checkpoint**: Zone-colored gauge faces functional — MVP complete. Both gauges show colored segments and needles correctly indicate active zone.

---

## Phase 3: User Story 2 - Enhanced Victorian Aesthetics (Priority: P2)

**Goal**: Add SVG tick marks at segment boundaries, enhance the brass bezel ring, and add a glass dome specular highlight — making the gauges look like real Victorian instruments.

**Independent Test**: Visual inspection — tick marks visible at segment boundaries, bezel has embossed depth, glass dome highlight visible as off-center specular reflection.

### Implementation for User Story 2

- [ ] T007 [P] [US2] Add inline SVG with tick mark lines to left gauge div in index.html (line 70). SVG should be viewBox="0 0 100 100", containing `<line>` elements at the 4 segment boundary angles (35deg, 75deg, 115deg, 155deg from center). Each tick is a short radial line from ~35% to ~48% radius (inset from bezel, just touching gauge face edge). Use brass color stroke. Add `aria-hidden="true"` to SVG.
- [ ] T008 [P] [US2] Add inline SVG with tick mark lines to right gauge div in index.html (line 71). SVG should be viewBox="0 0 100 100", containing `<line>` elements at the 4 mirrored segment boundary angles (10deg, 250deg, 290deg, 330deg from center). Same radial proportions and brass stroke as left gauge. Add `aria-hidden="true"` to SVG.
- [ ] T009 [US2] Style gauge tick SVGs with CSS in css/styles.css. Add `.frame__gauge svg` rule: position absolute, inset 0, width/height 100%, pointer-events none, z-index above ::before face but below ::after needle. Tick lines: stroke var(--color-brass-light), stroke-width 1.5-2, stroke-linecap round. Add minor graduation sub-ticks (thinner, shorter) between major ticks for Victorian instrument detail.
- [ ] T010 [US2] Enhance bezel radial-gradient in .frame__gauge rule (css/styles.css line ~532). Add more gradient stops for realism: outer highlight, mid brass, inner shadow, specular edge. Deepen inset box-shadow for more 3D depth. Add faint warm ambient glow via outer box-shadow (rgba of zone color, very subtle).
- [ ] T011 [US2] Add glass dome specular highlight overlay in css/styles.css. Layer a `radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)` as an additional background on .frame__gauge::before (on top of the conic-gradient zone segments). This creates the convex glass dome illusion.

**Checkpoint**: Gauges now look like detailed Victorian brass instruments with tick marks, embossed bezel, and glass dome effect.

---

## Phase 4: User Story 3 - Animation Refinements (Priority: P3)

**Goal**: Add needle micro-tremor at rest, glow pulse on zone transitions, optional glass parallax shift, and ensure all new animations respect reduced-motion/tier-3 fallbacks.

**Independent Test**: Watch needles at rest — subtle oscillation visible. Scroll to new zone — active segment briefly pulses brighter. Enable reduced-motion — all secondary animations suppressed instantly.

### Implementation for User Story 3

- [ ] T012 [US3] Implement needle micro-tremor as GSAP yoyo tween in js/scroll-zones.js. After init(), create two repeating GSAP tweens (one per gauge) that oscillate --needle-angle by ±1.5deg around current value with duration 2-3s, ease "sine.inOut", yoyo true, repeat -1. Store timeline refs as module state. In animateNeedles(), pause tremor before zone transition, resume (with updated center angle) after transition completes via onComplete callback. Skip tremor creation entirely if prefersReducedMotion.matches or getCurrentTier() >= 3.
- [ ] T013 [US3] Enhance zone-transition glow in js/scroll-zones.js. When a zone becomes active (in handleScrollProgress zone-change block), animate the active segment's glow custom property: gsap.fromTo() from 0 to 1.0 then settle to 0.3 (a quick flash then dim hold) over 0.5s with "power2.out" ease. On zone exit, animate glow back to 0. Use gsap.set() for instant path (useInstant). This builds on T005's basic glow toggle.
- [ ] T014 [US3] Add glass dome parallax shift tied to mouse position in js/scroll-zones.js or js/parallax.js. Listen for mousemove (reuse existing parallax handler if available) and shift the glass dome specular highlight position via CSS custom properties (--dome-x, --dome-y). Update the glass radial-gradient ellipse center from (35%, 30%) by ±5% based on normalized mouse position. Gate behind getCurrentTier() < 2 (skip on medium and low tiers). Suppress under reduced-motion.
- [ ] T015 [US3] Ensure reduced-motion and tier-3 instant fallbacks for all new gauge animations in js/scroll-zones.js. Verify: (1) micro-tremor tweens never created under reduced-motion or tier >= 3, (2) glow transitions use gsap.set() instead of gsap.to() under useInstant, (3) glass parallax shift disabled under reduced-motion. Add explicit check in app.js reduced-motion listener (line ~48) to kill any active gauge tremor tweens when user toggles reduced-motion mid-session.
- [ ] T016 [US3] Update reveal sequence in js/animations.js (lines 197-219) to incorporate new gauge face elements. Ensure SVG tick marks (if present inside gauge divs) scale correctly with parent during reveal. If glass dome custom properties are used, set initial values before reveal. Existing needle spring animation (fromTo -135deg to rest angle) should remain unchanged.

**Checkpoint**: Gauges feel alive — needles tremor at rest, segments pulse on zone change, glass dome shifts with mouse. All animations degrade gracefully.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story verification, edge cases, and performance validation

- [ ] T017 Verify mobile breakpoint behavior — resize viewport across 768px boundary while zone is active. Confirm gauges hide cleanly below 768px and restore correct zone state when returning above 768px. Check in css/styles.css mobile media query and js/scroll-zones.js.
- [ ] T018 Verify rapid scrolling through all 3 zones produces no visual artifacts, stacking glow animations, or stuck needle states. Ensure gsap.killTweensOf() properly cleans up in-flight gauge animations before starting new ones.
- [ ] T019 Performance validation via DevTools — confirm zero new draw calls (gauges are DOM-only), no layout thrash during scroll-triggered gauge updates. Check that CSS custom property animations use compositor where possible. Profile with Performance tab during full scroll-through.
- [ ] T020 Run full quickstart.md validation checklist: scroll all zones, toggle reduced-motion, check mobile, verify reveal sequence, test rapid scroll. Document any issues found and fix before completion.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Setup (T001) — BLOCKS US2 and US3 since they build on zone-colored faces
- **US2 (Phase 3)**: Depends on US1 completion (needs zone-colored face to position tick marks against)
- **US3 (Phase 4)**: Depends on US1 completion (needs glow custom properties from T004/T005). Can run in parallel with US2 (different files: JS vs HTML/CSS)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) — no other story dependencies
- **User Story 2 (P2)**: Depends on US1 (tick marks reference segment boundary positions, glass dome overlays the colored face)
- **User Story 3 (P3)**: Depends on US1 (glow animation builds on glow CSS from T004/T005). Independent of US2.

### Within Each User Story

- T002 and T003 are parallel (different CSS selectors, same file but different rules)
- T004 depends on T002/T003 (overlays the gradient they create)
- T005 depends on T004 (animates what T004 defines in CSS)
- T007 and T008 are parallel (different HTML elements)
- T009 depends on T007/T008 (styles the SVGs they create)
- T010 and T011 are parallel (different CSS rules, no overlap)
- T012, T013, T014 are partially parallel (different animation concerns in same file — coordinate carefully)
- T015 depends on T012-T014 (verifies fallbacks for all animations)
- T016 can run after T007-T011 are complete (needs to know final gauge DOM structure)

### Parallel Opportunities

```text
# After T001 (Setup):
  T002 ──┐
  T003 ──┼── parallel (left/right gauge CSS)
         │
# After T002+T003:
  T004 → T005 → T006 (sequential within US1)

# After US1 checkpoint:
  US2 (T007-T011) ──┐
  US3 (T012-T016) ──┼── parallel (CSS/HTML vs JS, different files)
                     │
# Within US2:
  T007 ──┐
  T008 ──┼── parallel (left/right HTML)
         │
  T009 (after T007+T008)
  T010 ──┐
  T011 ──┼── parallel (different CSS rules)

# Within US3:
  T012 ──┐
  T013 ──┼── partially parallel (different animation systems, same file)
  T014 ──┘
  T015 (after T012-T014)
  T016 (after US2 complete)
```

---

## Team Assignment Mapping

| Specialist | Primary Tasks | Secondary |
|------------|--------------|-----------|
| SVG Illustrator | T007, T008 (inline SVG tick marks) | T009 (SVG styling coordination) |
| CSS/Visual Specialist | T001, T002, T003, T004, T009, T010, T011 | T017 (mobile breakpoint) |
| Animation Engineer | T005, T012, T013, T014, T015, T016 | T018 (rapid scroll) |
| Integration/QA | T006, T017, T018, T019, T020 | All verification |

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: US1 — Zone-Colored Gauge Faces (T002-T006)
3. **STOP and VALIDATE**: Scroll all zones, verify needle-to-color alignment
4. This alone delivers the primary enhancement — gauges now indicate active zone

### Incremental Delivery

1. Setup (T001) → foundation ready
2. US1 (T002-T006) → zone-colored faces functional (MVP!)
3. US2 (T007-T011) → Victorian instrument detailing added
4. US3 (T012-T016) → animations bring gauges to life
5. Polish (T017-T020) → edge cases verified, performance confirmed

### Parallel Team Strategy

With 4 specialists:

1. **CSS Specialist** starts T001, then T002+T003 in parallel
2. After T002+T003: **CSS Specialist** does T004, **Animation Engineer** starts T005
3. After US1 checkpoint:
   - **SVG Illustrator**: T007+T008 (parallel), then coordinates T009 with CSS Specialist
   - **CSS Specialist**: T010+T011 (parallel), then T009
   - **Animation Engineer**: T012+T013+T014 (partially parallel), then T015, T016
   - **Integration/QA**: T006 first, then T017-T020 as stories complete

---

## Notes

- [P] tasks = different files or non-overlapping rules, safe to parallelize
- [Story] label maps each task to its user story for traceability
- Zone color hex values: #6B40A1 (blue-violet), #B8870A (warm-gold), #1A9E8F (green-teal), #0D0B09 (dark rest)
- Segment angles from research.md R1 — see that document for mathematical proof
- All CSS changes in css/styles.css lines 529-605 (gauge section)
- All JS animation changes in js/scroll-zones.js lines 275-350
- Commit after each user story checkpoint
