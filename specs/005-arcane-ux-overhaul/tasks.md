# Tasks: Arcane UX Overhaul

**Input**: Design documents from `/specs/005-arcane-ux-overhaul/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual visual testing only (no automated tests requested).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Refactoring (US7) is placed in Phase 2 (Foundational) because all other stories depend on the extracted module structure.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Asset Pipeline & Pre-requisites)

**Purpose**: Generate required assets and prepare constitution amendments before any code changes.

- [ ] T001 Generate MSDF texture from `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` using msdfgen CLI: `msdfgen msdf -svg <input> -o assets/logo_msdf.png -size 256 256 -pxrange 4`. Validate output: 256x256 RGB PNG, under 64KB, 3-channel distance field encoding
- [ ] T002 Amend constitution Principle I frozen shader list in `.specify/memory/constitution.md` to include "sidebar MSDF hieroglyph etching with normal perturbation, roughness modulation, cavity darkening, edge highlight, breathing light, shimmer pass, and scan-line sweep"
- [ ] T003 Amend constitution Principle II particle/instance budget in `.specify/memory/constitution.md` to change halos from "hover-only" to "baked into star sprite texture, always visible" (zero draw call impact)

---

## Phase 2: Foundational - Code Refactoring & Module Extraction (US7)

**Purpose**: Extract modules from monolithic files to meet the 400-line limit and establish the dependency injection architecture that all new feature modules depend on.

**CRITICAL**: No feature work (Phases 3-8) can begin until this phase is complete. All new modules depend on the extracted architecture.

**Goal**: Every JavaScript file under 400 lines. Clean dependency graph with no cycles. Central tick orchestrator in app.js.

**Independent Test**: Run `wc -l js/*.js` and confirm no file exceeds 400 lines. Load the portfolio and confirm all existing functionality works identically.

### Extraction from scene.js

- [ ] T004 [US7] Extract `js/textures.js` from `js/scene.js`: move `createStarTexture()` (lines 50-67), `createDustTexture()` (lines 72-88), and `randomVolumePoint()` (lines 93-98) into a new module with named exports. Update scene.js to import from textures.js
- [ ] T005 [US7] Extract `js/logo-follow.js` from `js/scene.js`: move logo state variables (lines 21-28) and `logoReturnHome()`/`initLogoFollow()` (lines 156-299, ~150 lines) into a new module. Export `init({ hitzone, logoEl, gsap })` and `tick()`. Update scene.js to import and delegate
- [ ] T006 [US7] Move `project3DtoScreen()` (lines 103-112) from `js/scene.js` to a shared utility location (keep in scene.js as a named export, or move to a `js/utils.js`). This function is needed by reticle.js and constellation-lines.js
- [ ] T007 [US7] Identify `showStarLabel()`/`hideStarLabel()` (lines 118-151) and `handleStarEnter()`/`handleStarExit()` (lines 813-840) in `js/scene.js` as future reticle.js absorptions. Mark with `// TODO: move to reticle.js in Phase 5` comments. Do NOT remove yet (reticle must be functional first)

### Extraction from animations.js

- [ ] T008 [P] [US7] Extract `js/terminal.js` from `js/animations.js`: move `playTerminalScan()` and `playDiscoverabilityAffordance()` (~130 lines) into a new module. Export `init({ gsap, ...domRefs })`. Must receive ALL scene references via init() — no direct imports from scene.js
- [ ] T009 [P] [US7] Extract `js/scroll-zones.js` from `js/animations.js`: move `initScrollZones()`, `handleScrollProgress()`, and `showSkipScrollAffordance()` (~190 lines) into a new module. Export `init({ gsap, ScrollTrigger, starNodes, nebulaLayers, ...domRefs })`. Must receive ALL scene references via init() — no direct imports from scene.js

### Extraction from interactions.js and performance.js

- [ ] T010 [P] [US7] Extract `js/panel.js` from `js/interactions.js`: move the panel management system (~200 lines including openProjectPanel, closeProjectPanel, panel DOM manipulation, focus trap) into a new module. Export `init({ ...domRefs })`. Update interactions.js to import and delegate. Target: interactions.js under 400 lines
- [ ] T011 [P] [US7] Extract `js/burst.js` from `js/performance.js`: move the supernova burst pool (lines 118-248, ~130 lines including createBurstPool, fireBurst, burst sprite management) into a new module. Export `init({ scene })` and `fire(position)`. Update performance.js to import and delegate. Target: performance.js under 400 lines

### Event System & Orchestration

- [ ] T012 [US7] Add `zone-change` CustomEvent dispatch to `js/scroll-zones.js`: dispatch `new CustomEvent('zone-change', { detail: { zoneIndex, zone } })` on `document` when active zone changes. Include `detail: { zoneIndex: -1, zone: null }` when returning to default (no-zone) state at top of page
- [ ] T013 [US7] Add `tier-change` CustomEvent dispatch to `js/performance.js`: dispatch `new CustomEvent('tier-change', { detail: { tier } })` on `document` in `applyTier2()` and `applyTier3()` functions
- [ ] T014 [US7] Refactor `js/app.js` as the central tick orchestrator: import all modules, call `init()` on each with correct dependency injection parameters, define tick call order: (1) parallax, (2) scene work, (3) raycasting, (4) reticle, (5) constellation-lines, (6) sidebar-hieroglyphs, (7) render. Wire the GSAP ticker to call each module's `tick(elapsed)` in order

### Verification

- [ ] T015 [US7] Verify all files under 400 lines (`wc -l js/*.js`), no circular dependencies (review import graph), and all existing functionality preserved (manual visual test: reveal sequence, scroll zones, star hover, panel open/close, logo follow, keyboard nav, mobile layout)

**Checkpoint**: Foundation ready. All files under 400 lines. Module architecture established. All existing functionality preserved. Feature implementation can begin.

---

## Phase 3: User Story 3 - Starfield Noise Reduction (Priority: P1)

**Goal**: Desaturate nebula palettes and add rare chromatic twinkle to establish calm backdrop for project node emphasis.

**Independent Test**: Load the portfolio. Confirm nebula is predominantly muted/desaturated (no vivid saturated particles competing with project nodes). Confirm rare chromatic twinkles occur (at most one every 2 seconds).

### Implementation

- [ ] T016 [US3] Desaturate nebula palettes in `js/scene.js` (or `js/textures.js` if palette is defined there): reduce saturation of all `nebulaConfigs` color arrays to 10-20% of current values while preserving luminance variation. The nebula retains subtle color hints — NOT pure white
- [ ] T017 [US3] Implement rare chromatic twinkle system in `js/scene.js`: timer-based, max 1 twinkle per 2 seconds across entire field, brief color flash under 500ms on a single particle. Add to the ticker loop. Suppress under `prefers-reduced-motion: reduce`

**Checkpoint**: Nebula is calm and desaturated. Twinkles occur rarely. Visual hierarchy: nebula is backdrop, not competitor.

---

## Phase 4: User Story 4 - Project Node Emphasis (Priority: P1)

**Goal**: Make the 7 project stars unmistakably prominent with glow halos and improved hover feedback.

**Independent Test**: Load the portfolio. Confirm 7 project nodes are immediately visually prominent (at least 3x larger than largest nebula particle). Confirm each has a visible glow halo. Confirm hover produces clear scale increase (1.6x animated, 1.2x instant under reduced motion).

### Implementation

- [ ] T018 [US4] Enlarge star sprite canvas texture in `js/textures.js` (`createStarTexture()`): extend the radial gradient with a slower falloff to include a visible glow halo baked into the single sprite. The overall visual footprint (core + halo) must be at least 3x larger than the largest nebula particle. Zero additional draw calls
- [ ] T019 [US4] Add opacity dimming for non-highlighted nodes during zone activation in `js/scene.js` (or `js/scroll-zones.js`): when a zone activates, non-highlighted stars dim to opacity 0.5 over 300ms (`power2.out`). Highlighted stars maintain opacity 1.0. Under reduced motion or Tier 3, apply instantly via `gsap.set()`
- [ ] T020 [US4] Adjust hover scale in the star hover handler (currently in `js/scene.js`, marked for reticle.js absorption): under `prefers-reduced-motion: reduce`, limit to 1.2x via `gsap.set()` with no easing. Normal mode: 1.6x with `back.out(3)` easing (existing behavior, verify)

**Checkpoint**: Project nodes are the brightest, largest, most colorful elements. Visual hierarchy is correct.

---

## Phase 5: User Story 2 - Targeting Reticle System (Priority: P1)

**Goal**: SVG targeting reticle locks onto project stars on hover, replacing the existing label system. Logo-follow handoff works cleanly.

**Independent Test**: Hover near a project star — reticle appears, locks on, label shows. Move to another star — smooth transition. Move away — reticle fades. Logo-follow pauses during reticle activity and resumes after. Click passes through to open project panel.

### Implementation

- [ ] T021 [US2] Create `js/reticle.js` module skeleton with `init({ starNodes, camera, renderer, logoFollow })` and `tick(elapsed)` exports. Add `onStarEnter(sprite)` and `onStarExit(sprite)` exports for scene.js raycasting to call
- [ ] T022 [US2] Build the SVG reticle element in `js/reticle.js`: create SVG container with circles, tick marks, rotation ring. Insert into DOM as sibling to `#star-labels` at z-index 24 (CSS custom property `--z-reticle: 24`). Set `pointer-events: none` on SVG container. Add `aria-hidden="true"` to SVG graphic
- [ ] T023 [US2] Add reticle CSS in `css/styles.css`: define `--z-reticle: 24`, position fixed/absolute for reticle SVG overlay, pointer-events none, transition properties for fade
- [ ] T024 [US2] Implement reticle activation/tracking in `js/reticle.js`: on `onStarEnter()`, compute star screen position via `project3DtoScreen()`, position SVG, fade in within 100ms. In `tick()`, update position each frame to track star's current screen-space center
- [ ] T025 [US2] Implement star-to-star transition in `js/reticle.js`: on `onStarEnter(newStar)` while already tracking, animate from current position to new star over 200ms with `power2.inOut`. Use `gsap.killTweensOf()` if transition is interrupted by a third star. Under reduced motion: jump instantly
- [ ] T026 [US2] Implement fade-out on deactivation in `js/reticle.js`: on `onStarExit()` when no new star is targeted, fade reticle out within 200ms
- [ ] T027 [US2] Implement idle animation in `js/reticle.js`: slow rotation and/or gentle pulse while locked on. Suppress entirely under `prefers-reduced-motion: reduce`
- [ ] T028 [US2] Create accessible project name label in `js/reticle.js`: DOM element (not SVG text) with `role="tooltip"` or `aria-live="polite"`. Position beside reticle. Update text content on star change. Not `aria-hidden`
- [ ] T029 [US2] Implement logo-follow handoff in `js/reticle.js`: dispatch `reticle-activate` / `reticle-deactivate` CustomEvents on document. Update `js/logo-follow.js` to listen: on activate, call `logoReturnHome()` and set `paused` flag; on deactivate, clear `paused` flag
- [ ] T030 [US2] Absorb `handleStarEnter()`/`handleStarExit()` into `js/reticle.js`: move hover scale animation logic from scene.js into reticle's `onStarEnter`/`onStarExit`. Remove `showStarLabel()`/`hideStarLabel()` and `handleStarEnter()`/`handleStarExit()` from `js/scene.js` (dead code removal per FR-032)
- [ ] T031 [US2] Wire scene.js raycasting to call `reticle.onStarEnter(sprite)` and `reticle.onStarExit(sprite)` instead of the removed handlers. Verify click-through: clicking a star with reticle active still opens the project panel
- [ ] T032 [US2] Handle mobile (below 768px) in `js/reticle.js`: do not render reticle SVG. Star interaction uses existing touch-tap raycast
- [ ] T033 [US2] Handle resize in `js/reticle.js`: recalculate reticle position after browser resize. No offset or stale position

**Checkpoint**: Reticle system fully functional. Star labels replaced. Logo-follow handoff clean. Click-through works. Mobile degrades gracefully.

---

## Phase 6: User Story 5 - Constellation Lines (Priority: P2)

**Goal**: SVG lines connect related project nodes within active scroll zones, with draw-on animation and zone transition choreography.

**Independent Test**: Scroll through zones. In each zone, confirm thin SVG lines connect highlighted project stars. Lines animate (draw on, pulse). Lines disappear when scrolling to a different zone. No lines visible at top of page.

### Implementation

- [ ] T034 [US5] Create `js/constellation-lines.js` module skeleton with `init({ starNodes, camera, renderer })` and `tick()` exports
- [ ] T035 [US5] Create SVG container for constellation lines in `js/constellation-lines.js`: insert SVG element in DOM (sibling approach like reticle), `pointer-events: none`. Add constellation line CSS to `css/styles.css`
- [ ] T036 [US5] Listen for `zone-change` CustomEvent in `js/constellation-lines.js`: on zone activation, create SVG `<line>` elements connecting the zone's `projectIds` in chain topology (N-1 lines for N projects). Compute endpoints via `project3DtoScreen()`. Lines: 1-2px width, semi-transparent, colored to zone's `nebulaHueRgb`
- [ ] T037 [US5] Implement draw-on animation in `js/constellation-lines.js`: set `stroke-dasharray` to line length, animate `stroke-dashoffset` from length to 0 via GSAP (`power2.out`, 0.6s duration)
- [ ] T038 [US5] Implement zone transition choreography in `js/constellation-lines.js`: outgoing lines fade over 400ms (`power2.in`), new lines begin draw-in after 100ms overlap (at 300ms mark). Total ~600ms. On rapid scroll: `gsap.killTweensOf()` outgoing, 200ms fast fade, then new zone. On scroll backwards: reverse animations
- [ ] T039 [US5] Implement pulse/glow cycle on active lines in `js/constellation-lines.js`: subtle opacity/width oscillation on drawn lines
- [ ] T040 [US5] Update `tick()` in `js/constellation-lines.js`: recompute line endpoints via `project3DtoScreen()` each frame to track star positions during scroll/resize
- [ ] T041 [US5] Handle no-zone state in `js/constellation-lines.js`: on `zone-change` with `zoneIndex: -1`, fade out all active lines. No lines visible at top of page (FR-023)
- [ ] T042 [US5] Handle reduced motion in `js/constellation-lines.js`: lines appear instantly (no draw-on animation), no pulse/glow. Static visual connectors
- [ ] T043 [US5] Handle Tier 2 (suppress pulse/glow, static lines only) and Tier 3 (suppress all animation) in `js/constellation-lines.js` by listening for `tier-change` CustomEvent

**Checkpoint**: Constellation lines connect zone projects. Zone transitions animate smoothly. No lines at page top. Reduced motion and tier degradation handled.

---

## Phase 7: User Story 6 - Parallax Depth Layers (Priority: P2)

**Goal**: 3-layer mouse-driven parallax on nebula particles, composing alongside scroll-driven rotation and per-layer drift.

**Independent Test**: Move mouse across starfield. Confirm three distinct depth layers: slow background, medium mid-ground, faster foreground. Confirm parallax stops when mouse stops. Confirm scroll-driven nebula rotation still works. Confirm no drift or decoherence over time.

### Implementation

- [ ] T044 [US6] Create `js/parallax.js` module skeleton with `init({ nebulaLayers })` and `tick(elapsed)` exports
- [ ] T045 [US6] Wrap each nebula Points layer in a parent `THREE.Group` in `js/scene.js` (or during parallax init): reparent each Points object as child of a new Group, add the Group to `nebulaGroup` instead. Drift rotation (`layer.rotation.y/x`) stays on child Points. Parallax position offsets go on parent Group. This prevents directional decoherence as drift accumulates
- [ ] T046 [US6] Redistribute existing nebula particles by z-band in `js/parallax.js` or `js/scene.js`: Layer 0 (background): z [-3, -1], Layer 1 (mid): z [-1.5, 0.5], Layer 2 (foreground): z [0, 2]. Adjust particle assignment to respect depth bands
- [ ] T047 [US6] Adjust particle sizes/brightness per depth band in `js/parallax.js` or `js/textures.js`: background smallest/dimmest (size 0.015), mid medium (size 0.020), foreground largest/brightest (size 0.025)
- [ ] T048 [US6] Implement lerp-based parallax offsets in `js/parallax.js` `tick()`: compute `targetOffset` from cursor position relative to viewport center, lerp `currentOffset` toward target each frame. Per-layer factors: background=0.02, mid=0.05, foreground=0.08. Apply as `parentGroup.position.x/y`
- [ ] T049 [US6] Clamp maximum parallax offsets in `js/parallax.js`: background 0.02, mid 0.05, foreground 0.1 world units. Ensure no drift when mouse stationary (targetOffset resets to 0,0 when mouse leaves or is centered)
- [ ] T050 [US6] Verify scroll-driven nebula rotation preserved: confirm `nebulaGroup.rotation.y = progress * Math.PI * 0.5` in `js/scroll-zones.js` still works alongside parallax position offsets. The three transform systems (group rotation, child drift rotation, parent parallax position) compose independently
- [ ] T051 [US6] Handle reduced motion in `js/parallax.js`: suppress parallax movement, layers remain static at rest positions
- [ ] T052 [US6] Handle mobile (below 768px) in `js/parallax.js`: disable parallax entirely. Read mobile flag dynamically on each resize (not cached). Toggle on/off if viewport crosses 768px threshold after page load
- [ ] T053 [US6] Handle Tier 2 in `js/parallax.js`: merge background and mid layers into 2-layer system. Listen for `tier-change` CustomEvent

**Checkpoint**: Three-layer parallax creates depth illusion. Scroll rotation preserved. No decoherence over time. Mobile/reduced-motion/tier degradation handled.

---

## Phase 8: User Story 1 - Sidebar Hieroglyph Etching (Priority: P1 visual, Phase 8 due to shader complexity)

**Goal**: WebGL sidebar planes with MSDF-based etched hieroglyphs, golden ratio construction lines, and disciplined animated effects.

**Independent Test**: Load portfolio, inspect sidebars. Confirm OE monogram etched stamps in 4 orientations. Verify lighting-responsive depth (edge highlights, roughness, cavity shadows). Confirm golden ratio construction lines faintly visible. Verify only 3 intentional animated effects (breathing, shimmer, scan-line). No noise or unmotivated glow.

### Implementation

- [ ] T054 [US1] Create `js/sidebar-hieroglyphs.js` module skeleton with `init({ scene, camera, renderer })` and `tick(elapsed)` exports
- [ ] T055 [US1] Create two `THREE.PlaneGeometry` meshes in `js/sidebar-hieroglyphs.js` for left and right sidebars. Set `depthTest: false`, `depthWrite: false`, `transparent: true`, `renderOrder: -1` to render behind scene objects
- [ ] T056 [US1] Position sidebar meshes to overlay CSS sidebar columns in `js/sidebar-hieroglyphs.js`: compute world-space position from camera FOV, aspect ratio, and CSS sidebar pixel width. Add resize handler to reposition on viewport change
- [ ] T057 [US1] Load MSDF texture (`assets/logo_msdf.png`) in `js/sidebar-hieroglyphs.js`: use `THREE.TextureLoader`, set `minFilter: THREE.LinearFilter`, `magFilter: THREE.LinearFilter`, `generateMipmaps: false`. Retain source Image element in memory for WebGL context restore
- [ ] T058 [US1] Author MSDF vertex shader in `js/sidebar-hieroglyphs.js`: pass UV coordinates and any needed varyings to fragment shader
- [ ] T059 [US1] Author MSDF fragment shader in `js/sidebar-hieroglyphs.js`: implement UV tiling with rotation per tile (`rotation = (cellX + cellY) % 4` for wide sidebars, `rotation = cellY % 4` for narrow ~18px sidebars). MSDF decode using median-of-three on RGB channels. Produce 4 output channels: normal perturbation (carved depth via finite differences — 4 extra texture samples), roughness modulation, cavity darkening (AO in carved region), edge highlight band with warm brass glint color
- [ ] T060 [US1] Add golden ratio construction line layer to fragment shader in `js/sidebar-hieroglyphs.js`: procedural SDF for phi-grid lines, spiral arc aligned with logo's dominant curve, and occasional phi/1:phi/phi-squared labels near select stamps. Layer is shallower, lower opacity, different roughness than primary etching
- [ ] T061 [US1] Add animated effects to fragment shader uniforms in `js/sidebar-hieroglyphs.js`: breathing light (5s sinusoidal luminance, uniform `uTime`), shimmer pass (8s traverse of sidebar height), scan-line sweep (max once per 12s). All driven by single `uTime` uniform from GSAP ticker elapsed
- [ ] T062 [US1] Pass `uTime` uniform from `tick(elapsed)` in `js/sidebar-hieroglyphs.js`: update `material.uniforms.uTime.value = elapsed` each frame
- [ ] T063 [US1] Handle reduced motion in `js/sidebar-hieroglyphs.js`: set `uBreathingEnabled`, `uShimmerEnabled`, `uScanLineEnabled` uniforms to 0.0. Static hieroglyphs and construction lines remain visible
- [ ] T064 [US1] Handle Tier 2 (disable scan-line: `uScanLineEnabled = 0.0`) and Tier 3 (disable all: all animated uniforms = 0.0) in `js/sidebar-hieroglyphs.js` by listening for `tier-change` CustomEvent
- [ ] T065 [US1] Handle WebGL context restore in `js/sidebar-hieroglyphs.js`: on `webglcontextrestored` event, set `texture.needsUpdate = true` to re-upload MSDF from retained source Image

**Checkpoint**: Sidebar hieroglyphs render with MSDF etching, lighting response, construction lines, and disciplined animation. Resize sync works. Tier/reduced-motion degradation handled.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integration wiring, performance verification, cross-browser testing, dead code removal.

- [ ] T066 Wire all modules into `js/app.js` orchestrator with tick order: (1) parallax, (2) scene work, (3) raycasting, (4) reticle, (5) constellation-lines, (6) sidebar-hieroglyphs, (7) render. Verify each module's `init()` receives correct dependencies via injection
- [ ] T067 Verify draw call count: target ~20-22 steady state (use `renderer.info.render.calls` in console). Confirm under 30 budget. Document any supernova burst transient spikes
- [ ] T068 Verify texture memory: target ~714KB total (use `renderer.info.memory.textures` in console). Confirm under 1MB budget
- [ ] T069 Verify page weight increase under 300KB (excluding media assets)
- [ ] T070 Test auto-tier degradation end-to-end: Tier 1 (full quality) -> Tier 2 (suppress scan-line, constellation pulse, merge parallax to 2 layers) -> Tier 3 (disable parallax, suppress all animations, static states remain)
- [ ] T071 Test reduced-motion compliance across ALL features: parallax suppressed, reticle instant (no transition/pulse), constellation lines static, sidebar breathing/shimmer/scan-line suppressed, hover scale 1.2x instant, node dimming instant
- [ ] T072 Test mobile graceful degradation (below 768px): parallax disabled, reticle not rendered, constellation lines hidden, sidebar animated effects disabled. Existing touch-tap interaction preserved
- [ ] T073 Test resize behavior: sidebar plane realignment, reticle position tracking, parallax toggle at 768px threshold, logo-follow recalibration, constellation line endpoint recalculation
- [ ] T074 Test WebGL context loss/restore: sidebar hieroglyphs recover (texture re-upload), scene rebuilds correctly
- [ ] T075 Cross-browser testing: Chrome, Firefox, Safari — verify all features render correctly
- [ ] T076 Test simultaneous reticle + scroll + parallax: hover a star, scroll through zones, and move mouse concurrently. Verify no race conditions, visual artifacts, or frame drops at 60fps
- [ ] T077 Remove all dead code, unused imports, and commented-out code blocks from all JavaScript modules (FR-032)
- [ ] T078 Final line-count audit: confirm all files under 400 lines (`wc -l js/*.js`). Confirm no circular dependencies in import graph
- [ ] T079 Final manual visual review: reveal sequence, scroll exploration, star hover/click, panel open/close, logo follow, keyboard nav, mobile layout — all existing + new functionality working together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational / Refactoring (Phase 2)**: Depends on Setup — BLOCKS all feature work
- **Starfield Noise Reduction (Phase 3)**: Depends on Phase 2 completion
- **Project Node Emphasis (Phase 4)**: Depends on Phase 2 completion. Can run in parallel with Phase 3
- **Targeting Reticle (Phase 5)**: Depends on Phase 2 completion. Can run in parallel with Phases 3-4
- **Constellation Lines (Phase 6)**: Depends on Phase 2 (zone-change event). Can run in parallel with Phases 3-5
- **Parallax Depth (Phase 7)**: Depends on Phase 2 completion. Can run in parallel with Phases 3-6
- **Sidebar Hieroglyphs (Phase 8)**: Depends on Phase 1 (MSDF asset) and Phase 2. Can run in parallel with Phases 3-7
- **Polish (Phase 9)**: Depends on ALL feature phases complete

### User Story Dependencies

- **US7 (Code Cleanup)**: FOUNDATIONAL — must complete first, all other stories depend on extracted module architecture
- **US3 (Starfield Noise)**: Independent after Phase 2. No dependencies on other feature stories
- **US4 (Node Emphasis)**: Independent after Phase 2. No dependencies on other feature stories
- **US2 (Reticle)**: Independent after Phase 2. Absorbs hover handlers from scene.js (coordinates with US4 hover scale)
- **US5 (Constellation Lines)**: Independent after Phase 2. Depends on zone-change event (set up in Phase 2)
- **US6 (Parallax)**: Independent after Phase 2. Requires nebula layer Group wrapping (can be done in its own phase)
- **US1 (Sidebar Hieroglyphs)**: Independent after Phase 1 + Phase 2. Most complex, isolated from other features

### Within Each User Story

- Module skeleton before feature implementation
- Core functionality before edge cases (reduced motion, mobile, tier degradation)
- Visual correctness before animation polish
- Integration before cleanup

### Parallel Opportunities

**After Phase 2 completes, all 6 feature phases (3-8) can proceed in parallel:**

```text
Phase 2 (Foundational) ─┬─> Phase 3 (Starfield)          ─┐
                         ├─> Phase 4 (Node Emphasis)       ├─> Phase 9 (Polish)
                         ├─> Phase 5 (Reticle)             │
                         ├─> Phase 6 (Constellation Lines) │
                         ├─> Phase 7 (Parallax)            │
                         └─> Phase 8 (Sidebar Hieroglyphs) ─┘
```

---

## Parallel Example: Phase 2 (Foundational)

```text
# These extraction tasks touch DIFFERENT files and can run in parallel:
T008: Extract terminal.js from animations.js
T009: Extract scroll-zones.js from animations.js  # Same source file — run AFTER T008
T010: Extract panel.js from interactions.js        # Different file — parallel with T008
T011: Extract burst.js from performance.js         # Different file — parallel with T008, T010
```

## Parallel Example: After Phase 2

```text
# All feature phases can start in parallel (different modules, no dependencies):
Phase 3 (T016-T017): Starfield noise reduction in scene.js/textures.js
Phase 5 (T021-T033): Reticle system in reticle.js (NEW file)
Phase 6 (T034-T043): Constellation lines in constellation-lines.js (NEW file)
Phase 7 (T044-T053): Parallax in parallax.js (NEW file)
Phase 8 (T054-T065): Sidebar hieroglyphs in sidebar-hieroglyphs.js (NEW file)
```

---

## Implementation Strategy

### MVP First (Visual Hierarchy — Phases 1-5)

1. Complete Phase 1: Setup (MSDF asset, constitution amendments)
2. Complete Phase 2: Foundational refactoring (all files under 400 lines)
3. Complete Phase 3: Starfield Noise Reduction (calm backdrop)
4. Complete Phase 4: Project Node Emphasis (prominent stars)
5. Complete Phase 5: Targeting Reticle (interaction clarity)
6. **STOP and VALIDATE**: The portfolio now has correct visual hierarchy and clear interaction affordances

### Incremental Delivery

1. Setup + Foundational -> Module architecture clean
2. Add Starfield + Node Emphasis -> Visual hierarchy established (MVP visual!)
3. Add Reticle -> Interaction clarity complete (MVP interaction!)
4. Add Constellation Lines -> Relationship narrative visible
5. Add Parallax -> Depth illusion active
6. Add Sidebar Hieroglyphs -> Brand identity complete (full feature set)
7. Polish -> Production ready

### Key Risk Mitigations

- **Parallax drift decoherence**: Parent Group wrapper pattern (T045) separates drift rotation from parallax offsets
- **Reticle/label transition**: Old label system NOT removed (T007 marks as TODO) until reticle is confirmed functional (T030 does the actual removal)
- **400-line compliance**: interactions.js and performance.js extraction (T010, T011) added per Devil's Advocate review
- **Zone-change no-zone state**: Explicit `zoneIndex: -1` dispatch (T012) prevents constellation line orphans

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Phase 2
- No automated tests — manual visual testing per quickstart.md debugging tips
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 79 tasks across 9 phases
