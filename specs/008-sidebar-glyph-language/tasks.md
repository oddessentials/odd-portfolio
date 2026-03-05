# Tasks: Sidebar Glyph Language

**Input**: Design documents from `/specs/008-sidebar-glyph-language/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested. No test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US11)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Asset Pipeline & Validation)

**Purpose**: Create the tooling and infrastructure needed to generate glyph assets

- [ ] T001 Create SVG validation script at design-assets/oe-logo-pack-2/validate-glyphs.py that checks: viewBox="0 0 300 300", glyph center at (150,150), no stroke attributes (fill-only), OE ring outer diameter 260 units. Accept --generate flag to create normalized SVGs and --validate flag to check them.
- [ ] T002 Create MSDF atlas generation script at design-assets/oe-logo-pack-2/generate-atlas.sh that runs msdfgen on all 8 glyph SVGs at 128x128, composites into 512x256 atlas (4x2 grid) via ImageMagick montage, outputs to assets/glyph-atlas-msdf.png. Include a derived-glyph quality gate: render each at 33px and warn if interior distance field collapses.
- [ ] T003 Create atlas UV map reference at assets/atlas-uv-map.md documenting cell indices 0-7, grid positions (col,row), cell UV origins, and guard-padded sampling bounds per data-model.md Section 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create all glyph SVGs, MSDF atlas, and prepare the module split. MUST complete before any user story.

**CRITICAL**: No user story work can begin until this phase is complete.

### Derived Glyph SVGs

- [ ] T004 [P] Create derived glyph SVG glyph-orbit.svg at design-assets/oe-logo-pack-2/ — annular ring only (outer r=R0=130, inner r=Ri=80.3 in 300x300 viewBox), filled path with evenodd fill-rule, no strokes. Validate with msdfgen.
- [ ] T005 [P] Create derived glyph SVG glyph-axis.svg at design-assets/oe-logo-pack-2/ — vertical stem rectangle only (width=S=49.4, height=260 in 300x300 viewBox, centered at 150,150), filled rect, no strokes. Validate with msdfgen.
- [ ] T006 [P] Create derived glyph SVG glyph-spiral.svg at design-assets/oe-logo-pack-2/ — quarter-arc annular sector (90-degree arc from OE ring, top-right quadrant, outer r=130, inner r=80.3 in 300x300 viewBox), filled path, no strokes. Validate with msdfgen. If MSDF quality fails at 33px render, thicken annular width from S to 1.5*S.

### Normalized Rotation SVGs

- [ ] T007 [P] Create normalized glyph-origin-0.svg at design-assets/oe-logo-pack-2/ from logo-0-degrees-281x200.svg — convert to viewBox="0 0 300 300", center at (150,150), scale OE ring to 260 diameter, convert stroked circle to filled annular path (FR-026/FR-027). Validate with msdfgen.
- [ ] T008 [P] Create normalized glyph-guardian-90.svg at design-assets/oe-logo-pack-2/ from logo-90-degrees-200x281.svg — same normalization as T007. Validate with msdfgen.
- [ ] T009 [P] Create normalized glyph-architect-135.svg at design-assets/oe-logo-pack-2/ from logo-135-degrees-100x100.svg — same normalization as T007. Validate with msdfgen.
- [ ] T010 [P] Create normalized glyph-voyager-180.svg at design-assets/oe-logo-pack-2/ from logo-180-degrees-281x200.svg — same normalization as T007. Validate with msdfgen.
- [ ] T011 [P] Create normalized glyph-sovereign-270.svg at design-assets/oe-logo-pack-2/ from logo-270-degrees-200x281.svg — same normalization as T007. Validate with msdfgen.

### Validation Gate

- [ ] T012 Run validate-glyphs.py --validate on all 8 glyph SVGs (T004-T011). Confirm: identical viewBox, centering, scale, fill-only paths. All must pass msdfgen validation. Block atlas generation until all pass.

### MSDF Atlas Generation

- [ ] T013 Run generate-atlas.sh to produce assets/glyph-atlas-msdf.png (512x256, 4x2 grid, 128x128 cells). Visually verify: no cross-cell artifacts, derived glyphs (Orbit, Spiral) render cleanly at 33px. Verify atlas-uv-map.md matches actual layout.

### Production Logo

- [ ] T014 [P] Copy design-assets/oe-logo-pack-2/logo-135-degrees-100x100.svg to assets/logo-oe-135.svg. Ensure white fill on transparent, compact SVG (no Inkscape metadata, no xmlns cruft). Verify file size under 2KB.

### Module Split Preparation

- [ ] T015 [P] Add glyph data fields to each project in js/data.js: glyphName, glyphRotation, glyphType, glyphAtlasIndex per the mapping in data-model.md Section 1. Add GLYPH_ATLAS_CELLS constant with UV bounds for all 8 cells per data-model.md Section 2.

### Constitution Amendment

- [ ] T016 [P] Apply constitution amendment v1.3.0 to .specify/memory/constitution.md: (1) REMOVE "shimmer pass" from the frozen shader list in Principle I (replaced by event-triggered scan-line). (2) ADD to the frozen shader list: per-glyph atlas selection, atlas UV lookup, hover-driven brightness response, scroll-driven positional shift, event-triggered scan-line, Odd Bot state rotation. (3) UPDATE the data model definition in Principle I to include glyphName, glyphRotation, glyphType, glyphAtlasIndex fields (owner-approved 2026-03-05). (4) Update version to 1.3.0 and Last Amended date.

**Checkpoint**: All 8 glyph SVGs validated, MSDF atlas generated, production logo ready, data model updated, constitution amended. User story implementation can now begin.

---

## Phase 3: User Story 11 - Logo Crispness (Priority: P1) MVP

**Goal**: Replace ASCII-art logo.svg with clean vector OE mark for crisp header band and logo-follow cursor

**Independent Test**: Load page, confirm header band shows clean vector OE mark (not ASCII art text), logo-follow cursor is crisp vector at ~40x40px

- [ ] T017 [US11] Update index.html line 76: change `src="assets/logo.svg"` to `src="assets/logo-oe-135.svg"` on the #brand-logo img element
- [ ] T018 [P] [US11] Update index.html line 12: change og:image meta content from `assets/logo.svg` to `assets/logo-oe-135.svg`
- [ ] T019 [P] [US11] Update index.html line 156: change orb-fallback img src from `assets/logo.svg` to `assets/logo-oe-135.svg`
- [ ] T020 [US11] Verify logo-follow.js behavior with new SVG: confirm logoW=40 still works with the 298.5x298.5 viewBox logo, logo renders at ~40x40px in header band, logo-follow cursor tracks correctly

**Checkpoint**: Header band and cursor show clean vector OE mark. ASCII-art logo.svg can be deprecated.

---

## Phase 4: User Story 1 - Per-Project Glyph Sigils (Priority: P1)

**Goal**: Replace Unicode stars with per-project inline SVG OE glyphs in left sidebar navigation

**Independent Test**: Load page, confirm each of 7 nav buttons displays its assigned OE glyph SVG (not a star), colored in brass tones, with hover glow and keyboard focus parity

- [ ] T021 [US1] Replace all 7 `<span class="glyph" aria-hidden="true">&#9733;</span>` elements in index.html (lines 89-127) with inline SVG glyphs. Each SVG: viewBox="0 0 300 300", width="20", height="20", aria-hidden="true", class="glyph". Use fill="currentColor" on all path/circle elements. Map projects to glyphs per data-model.md: odd-ai-reviewers=Guardian(90), ado-git-repo-insights=Voyager(180), repo-standards=Axis, odd-self-hosted-ci=Orbit, odd-map=Origin(0), odd-fintech=Sovereign(270), coney-island=Architect(135). Preserve aria-hidden="true" on both wrapper span AND svg element.
- [ ] T022 [US1] Update CSS .glyph rules in css/styles.css: replace `font-size` and `color` properties with `fill: var(--color-brass-light)` for SVG. Replace `text-shadow: 0 0 6px var(--color-brass-light)` hover rule (line 788) with `filter: drop-shadow(0 0 6px var(--color-brass-light))`. Add `transition: filter var(--dur-fast) ease` to the base .glyph rule.

**Checkpoint**: All 7 nav items display unique OE glyph SVGs with brass color and hover glow. Screen reader announces only project names.

---

## Phase 5: User Story 10 - High Contrast Compliance Fix (Priority: P10, ships independently)

**Goal**: Hide WebGL sidebar overlay when prefers-contrast:more is active, fixing existing constitution compliance gap

**Independent Test**: Enable high-contrast mode in OS settings, confirm sidebar overlay disappears. Toggle at runtime, confirm immediate response.

- [ ] T023 [US10] Add prefers-contrast:more detection to js/sidebar-hieroglyphs.js: create a matchMedia('(prefers-contrast: more)') query, check on init to set leftPlane.visible/rightPlane.visible to false if active. Register addEventListener('change', ...) for runtime toggle. Set the new uHighContrastHide uniform to 1.0 when active. Follow the pattern established by prefersReducedMotion at line 14-15.
- [ ] T024 [US10] Add prefers-contrast:more listener in js/app.js following the pattern at lines 87-95 (prefersReducedMotion listener): store query object, register change handler that calls sidebar-hieroglyphs module to toggle overlay visibility. Ensure combined state with prefers-reduced-motion is handled (high contrast takes precedence for overlay hiding).

**Checkpoint**: WebGL sidebar overlay hidden when high-contrast mode active. Toggles at runtime. HTML nav content still visible.

---

## Phase 6: User Story 7 - Animation Cleanup: Alive Not Busy (Priority: P7)

**Goal**: Remove shimmer, convert scan-line to event-triggered, clear motion budget for hover/scroll

**Independent Test**: Observe sidebar for 30 seconds idle — only breathing visible. Trigger zone-change — single scan-line sweep fires then stops.

- [ ] T025 [US7] Remove shimmer animation from js/sidebar-hieroglyphs.js fragment shader: delete the shimmer pass block (lines 119-121 of current shader), remove uShimmerEnabled uniform from createMaterial() and tick(). Remove all shimmer references.
- [ ] T026 [US7] Convert scan-line from continuous to event-triggered in js/sidebar-hieroglyphs.js: replace `fract(uTime / 12.0)` with new uScanProgress uniform (default 0.0). Wrap scan-line shader block in coherent uniform branch: `if (uScanProgress > 0.0 && uScanProgress < 1.0) { ... }` for zero idle ALU cost. Remove uScanLineEnabled uniform. Export a triggerScanLine() function that runs `gsap.fromTo(material.uniforms.uScanProgress, {value:0}, {value:1, duration:0.8, ease:'power2.inOut'})`.
- [ ] T027 [US7] Wire scan-line trigger to events: listen for zone-change and terminal-scan-complete CustomEvents in sidebar-hieroglyphs.js init(). On each, call triggerScanLine() (skip if prefersReducedMotion or Tier >= 2).

**Checkpoint**: Sidebar breathes only when idle. Scan-line fires once on zone-change/terminal-scan-complete then stops. No shimmer.

---

## Phase 7: User Story 2 - MSDF Atlas Glyph Watermarks (Priority: P2)

**Goal**: Replace uniform single-glyph tiling with varied 8-glyph atlas watermarks in sidebar background

**Independent Test**: Load page, confirm sidebar background shows varied glyph forms at 8-10% opacity (not uniform repeat)

- [ ] T028 [US2] Refactor js/sidebar-hieroglyphs.js into overlay renderer (~180 lines): keep overlay scene/camera, plane creation, updatePositions(), init({renderer}), render(), tick(elapsed), resize handler, context restore handler. Remove glyph-specific composition logic. Export leftMaterial and rightMaterial references (or return from init). Update loadMSDF() to load assets/glyph-atlas-msdf.png instead of assets/logo_msdf.png. Update uTexelSize to 1.0/512.0.
- [ ] T029 [US2] Create new js/glyph-compositor.js (~200 lines): import GLYPH_ATLAS_CELLS from data.js. Export init({leftMaterial, rightMaterial}) and setScrollProgress(progress). Implement atlas UV selection: replace the mod-4 rotation logic with per-tile glyph index selection via hash of tileIdx, computing cell UV offset from GLYPH_ATLAS_CELLS. Apply guard-padded UV clamping per FR-028. Update screenPxRange denominator from 256.0 to 128.0 (cell size). Clamp all 4 finite-difference normal perturbation samples within cell guard bounds.
- [ ] T030 [US2] Update fragment shader for atlas sampling: replace single-texture tiling with atlas cell lookup. Use `vec2 cellOffset = vec2(mod(glyphIndex, 4.0), floor(glyphIndex / 4.0)) * vec2(0.25, 0.5)` for cell origin. Apply tileUV within the cell with guard clamping. Keep normal perturbation, cavity darkening, edge highlight, phi-grid, breathing.
- [ ] T031 [US2] Wire glyph-compositor into sidebar-hieroglyphs.js init(): after creating materials, call glyphCompositor.init({leftMaterial, rightMaterial}). The compositor is an internal dependency of the renderer, NOT directly imported by app.js.
- [ ] T032 [US2] Update js/app.js reduced-motion handler (line 27-98): set uRevealProgress=1.0 on both sidebar materials when reduced motion is active (for the reveal wipe added later).

**Checkpoint**: Sidebar background displays varied glyph tiles from 8-glyph atlas. 2 draw calls maintained. Texture memory under 1MB.

---

## Phase 8: User Story 3 - Enhanced Marginalia (Priority: P3)

**Goal**: Add procedural construction marks and organic tile imperfection for "Renaissance notebook" feel

**Independent Test**: Temporarily boost construction line opacity to 50% to confirm arcs/ticks render. Restore to 3-5%. Compare adjacent tiles for visible variation.

- [ ] T033 [US3] Add procedural construction line types to fragment shader in js/glyph-compositor.js (or sidebar-hieroglyphs.js shader): concentric compass arcs at R0/Ri radii (~5 lines GLSL), diagonal construction lines at 45 degrees (~3 lines GLSL), grid tick marks at phi subdivisions (~5 lines GLSL). All at 3-5% opacity. All procedural, no textures (FR-021).
- [ ] T034 [US3] Implement three-layer opacity system in fragment shader: glyph watermarks at 8-10%, annotation fragments at 4-7%, construction lines at 3-5%. Use separate float constants for each layer, combined in finalAlpha computation.
- [ ] T035 [US3] Add per-tile organic imperfection to fragment shader: seed pseudo-random hash from tileIdx via `fract(sin(dot(tileIdx, vec2(127.1, 311.7))) * 43758.5453)`. Apply rotation jitter +/-1.5deg, position offset +/-1%, scale variation +/-3%, opacity heterogeneity 60-100% of target. Vary MSDF threshold by +/-0.02 per tile for stroke weight variation.

**Checkpoint**: Three distinct opacity layers visible. Adjacent tiles show organic variation. Construction marks feel hand-drafted.

---

## Phase 9: User Story 4 - Right Sidebar Narrative Evolution (Priority: P4)

**Goal**: Evolve right sidebar to phi-themed language with Architect watermark and Odd Bot rotation

**Independent Test**: Load page, confirm new text labels. Scroll through zones, confirm Odd Bot rotates.

- [ ] T036 [P] [US4] Update right sidebar text in index.html: change "MANA" to "phi DRIFT" (line 145), "PHASE" to "ORBITAL PHASE" (line 148). Add new status line `<p class="status-line">phi <span class="phi-constant">1.6180339887</span></p>` after line 148. Update mana-meter CSS in css/styles.css (lines 882-910): change green gradient #4ADE80 to gold-brass var(--color-brass-mid) per FR-023.
- [ ] T037 [P] [US4] Update all terminal text strings per data-model.md Complete Text Change Map: terminal.js lines 21,22,26,52,67,72,78; app.js lines 57,133,138,139; scroll-zones.js line 206. Change "7 systems nominal" → "7 Constellations Active", "PORTFOLIO READY" → "GOLDEN RATIO LOCKED", "Scanning project.id" → "Charting project.constellation", "PORTFOLIO" → "phi LOCKED". Use ASCII "phi" not Unicode U+03C6.
- [ ] T038 [US4] Add Odd Bot HTML element to index.html: insert a `<div class="odd-bot" aria-hidden="true">` containing inline SVG of OE logo at 135 degrees (from assets/logo-oe-135.svg path data) after `.status-readout` and before closing `</aside>` of #status-panel. Size ~40x40px.
- [ ] T039 [US4] Style Odd Bot in css/styles.css: position:absolute within #status-panel, bottom-center, transform-origin:center center, opacity:0.3, z-index below telemetry content. Add transition for transform.
- [ ] T040 [US4] Implement Odd Bot rotation state machine: listen for zone-change and terminal-scan-complete events. On zone-change: map zone index to rotation (0→90, 1→180, 2→270, -1→135) via gsap.to with 0.6s elastic.out(1,0.5) easing. On terminal-scan-complete: rotate to 270, gsap.delayedCall 2s then return to 135. Priority: zone-change cancels hold-and-return via gsap.killTweensOf(). Reduced motion: use gsap.set() (instant, no elastic). Retain 2s hold duration under reduced motion (it's a state duration, not motion). Place logic in glyph-compositor.js or a dedicated section of app.js.
- [ ] T041 [US4] Add large faint Architect watermark to right sidebar shader: in the right-plane material configuration within glyph-compositor.js, render atlas cell 0 (Architect 135) as a single large glyph at 6-8% opacity, centered in the right sidebar. This is separate from the Odd Bot HTML element.

**Checkpoint**: Right sidebar shows phi-themed text, Odd Bot rotates through zones, Architect watermark faintly visible behind telemetry.

---

## Phase 10: User Story 5 - Hover Brightening (Priority: P5)

**Goal**: Bridge DOM nav hover/focus to WebGL brightness uniform for connected experience

**Independent Test**: Hover each nav item — localized brightness increase in WebGL overlay. Tab through buttons — same effect.

- [ ] T042 [US5] Add uHoverUV uniform to sidebar shader materials in js/sidebar-hieroglyphs.js: default vec2(-1,-1). In fragment shader, add radial brightening: `float hoverBright = 1.0 + 0.3 * smoothstep(0.15, 0.0, distance(vUv, uHoverUV))`. Apply as multiplier on color and finalAlpha. Increase screenPxRange from 4.0 to 6.0 within hover radius for sharpening effect. (~5 ALU addition)
- [ ] T043 [US5] Add ResizeObserver-based rect cache to js/glyph-compositor.js: observe #constellation-nav, cache its bounding rect. On resize, invalidate and recache. Export setHoveredProject(normalizedY) and clearHover() functions that set leftMaterial.uniforms.uHoverUV.
- [ ] T044 [US5] Dispatch glyph-hover events from js/interactions.js: on mouseenter/focusin of #constellation-nav buttons, compute button center Y relative to #constellation-nav rect, normalize to 0..1, call glyph-compositor setHoveredProject(). On mouseleave/focusout, call clearHover(). Use gsap.quickTo() for uHoverUV.y with 0.15s enter duration. Override to 0.25s on leave. Use raw focusin (NOT :focus-visible gated) so programmatic .focus() from arrow keys triggers brightness. Reset to sentinel (-1,-1) when nav is off-canvas or layout invalidated (FR-030).
- [ ] T045 [US5] Add reduced-motion guard for hover: if prefersReducedMotion, use gsap.set() (instant, same brightness magnitude). Add reduced-motion guard for inline SVG glyph scale tween in interactions.js: use gsap.set(glyph, {scale:1.2}) on enter, gsap.set(glyph, {scale:1}) on leave under reduced motion.

**Checkpoint**: Hovering/focusing nav button produces visible localized brightness in WebGL overlay. Keyboard parity confirmed.

---

## Phase 11: User Story 6 - Scroll-Driven Equation Shift (Priority: P6)

**Goal**: Parallax drift of construction lines on scroll while glyph tiles stay fixed

**Independent Test**: Scroll slowly through zones — construction lines drift vertically, glyph tiles remain stationary.

- [ ] T046 [US6] Add uScrollProgress uniform to sidebar shader: default 0.0. In fragment shader, apply as vertical UV offset to phi-grid construction lines ONLY: `float scrollOffset = uScrollProgress * 0.3; float phiY1 = mod((vUv.y + scrollOffset) * phi * 3.0, 1.0)`. Do NOT apply to MSDF glyph UV sampling (glyphs stay fixed — they are "carved etchings").
- [ ] T047 [US6] Wire scroll progress to sidebar: in js/scroll-zones.js handleScrollProgress(), call the exported glyph-compositor setScrollProgress(progress) setter directly (no CustomEvent per frame). Import setScrollProgress from glyph-compositor.js. Under reduced motion, lock uScrollProgress to 0.0.

**Checkpoint**: Construction lines drift with scroll. Glyph tiles anchored. Reduced motion: no drift.

---

## Phase 12: User Story 8 - Reveal Sequence Integration (Priority: P8)

**Goal**: Glyphs inscribed during reveal at t=2.2s via bottom-to-top wipe

**Independent Test**: Refresh page, observe glyphs appear with a wipe starting ~2.2s into the reveal, completing by ~2.7s.

- [ ] T048 [US8] Add uRevealProgress uniform to sidebar shader: default 0.0. In fragment shader, multiply finalAlpha by reveal mask: `float revealMask = smoothstep(0.0, 0.05, uRevealProgress - (1.0 - vUv.y))`. When uRevealProgress=0, nothing visible. When uRevealProgress=1, all visible. (~2 ALU)
- [ ] T049 [US8] Add reveal wipe tween to js/animations.js reveal timeline: at t=2.2s, tween both leftMaterial.uniforms.uRevealProgress and rightMaterial.uniforms.uRevealProgress from 0 to 1, duration 0.5s, ease power2.inOut. Completes at t=2.7s (before terminal scan at t=2.8s). Pass material references via the sidebar-hieroglyphs module export.
- [ ] T050 [US8] Update reduced-motion handler in js/app.js: set uRevealProgress=1.0 instantly on both sidebar materials (skip wipe animation).

**Checkpoint**: Reveal sequence includes glyph wipe at t=2.2s, completing t=2.7s. Reduced motion: instant appearance.

---

## Phase 13: User Story 9 - Performance Tier Degradation (Priority: P9)

**Goal**: 3-tier shader stratification with integrated GPU detection

**Independent Test**: Force each tier level manually; confirm effects disable progressively. Test on Intel Iris if available.

- [ ] T051 [US9] Add integrated GPU detection to js/performance.js or js/sidebar-hieroglyphs.js init: query WEBGL_debug_renderer_info extension for unmasked renderer string. If matches Intel Iris/UHD/HD Graphics or AMD Radeon Graphics (APU patterns), set initial tier to 2 via tier-change event dispatch. If extension unavailable, fall back to benchmark-only detection (existing behavior).
- [ ] T052 [US9] Implement tier-stratified shader branching in fragment shader: add uTierLevel uniform (float). Tier 1 (<2.0): all effects active (~145 ALU). Tier 2 (>=2.0, <3.0): disable uScrollProgress offset and complex construction arcs (compass, diagonal), make hover instant (still brighten, just no shader cost for arc details), ~113 ALU. Tier 3 (>=3.0): disable normal perturbation (drop 4-tap finite-difference block, ~38 ALU saved), disable breathing, disable all construction lines except basic phi-grid, ~60 ALU flat shading with edge highlight only.
- [ ] T053 [US9] Update tier-change handling in js/sidebar-hieroglyphs.js tick(): extend existing tier check block (lines 288-297) to set uTierLevel uniform. At Tier 2: disable scroll shift, simplify hover to instant. At Tier 3: disable breathing, disable all time-varying uniforms. Update Odd Bot tier degradation in its managing module: Tier 2 → linear snap 0.3s power2.out, Tier 3 → instant gsap.set().
- [ ] T054 [US9] Add post-reveal Tier 1 promotion for capable integrated GPUs: in performance.js auto-tier benchmark, if initial tier was set to 2 via GPU detection AND measured avg frame time is <14ms (stricter than 20ms demotion threshold for hysteresis), promote to Tier 1 by dispatching tier-change with tier 1.

**Checkpoint**: Tier 1 runs all effects. Tier 2 drops scroll/arcs. Tier 3 drops normals for flat shading. Integrated GPUs default to Tier 2, can promote to Tier 1 if capable.

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Verification, cleanup, and documentation

- [ ] T055 Verify WebGL context restore handler in js/sidebar-hieroglyphs.js: ensure webglcontextrestored listener sets needsUpdate=true on the NEW glyph-atlas-msdf.png texture (not the old logo_msdf.png reference).
- [ ] T056 Verify draw call count: open Chrome DevTools, confirm sidebar still uses exactly 2 draw calls (left + right plane) with no additional geometry. Total steady state should remain under 30.
- [ ] T057 Verify texture memory: confirm total GPU texture memory is under 1MB. Atlas at 512x256 RGB = ~384KB. Total with stars + dust + atlas should be ~900KB.
- [ ] T058 Verify module line counts: confirm sidebar-hieroglyphs.js <= 180 lines, glyph-compositor.js <= 250 lines, all modules under 400-line constitution limit. Total module count = 17.
- [ ] T059 [P] Run quickstart.md visual verification checklist: all 8 items (glyph SVGs, varied tiles, hover brightness, scroll drift, right sidebar text, reduced motion, high contrast, logo crispness).
- [ ] T060 [P] Cross-browser smoke test: Chrome (primary), Firefox (context loss), Safari (shader compilation). Verify no silent shader failures on each.
- [ ] T061 Update CLAUDE.md recent changes section if needed per agent context script output.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 scripts. BLOCKS all user stories
- **US11 Logo (Phase 3)**: Depends on T014 only — can start as soon as logo asset is copied
- **US1 Glyphs (Phase 4)**: Depends on T007-T011 (normalized SVGs)
- **US10 High Contrast (Phase 5)**: Depends on Phase 2 completion — independent of other stories
- **US7 Animation Cleanup (Phase 6)**: Depends on Phase 2 — SHOULD precede US5/US6 (clears motion budget)
- **US2 Atlas Watermarks (Phase 7)**: Depends on T013 (atlas) + Phase 2. Core shader refactor.
- **US3 Marginalia (Phase 8)**: Depends on US2 (needs atlas shader in place)
- **US4 Right Sidebar (Phase 9)**: Depends on Phase 2 only for text changes; T041 depends on US2
- **US5 Hover (Phase 10)**: Depends on US2 (needs glyph-compositor module)
- **US6 Scroll Shift (Phase 11)**: Depends on US2 (needs shader uniforms)
- **US8 Reveal (Phase 12)**: Depends on US2 (needs shader uniforms + material exports)
- **US9 Tier Degradation (Phase 13)**: Depends on US2, US3, US5, US6 (needs all shader features to stratify)
- **Polish (Phase 14)**: Depends on all stories complete

### User Story Independence

- **US11, US1, US10**: Fully independent of each other and other stories
- **US7**: Independent, but should precede US5/US6 for clean motion budget
- **US4** (text changes T036-T037): Independent. T041 (watermark) depends on US2
- **US2**: Foundation for US3, US5, US6, US8, US9
- **US3, US5, US6, US8**: Each depends on US2 but independent of each other
- **US9**: Depends on all shader features (US2+US3+US5+US6)

### Parallel Opportunities

**Phase 2**: T004-T011 all run in parallel (different SVG files), T014-T016 in parallel
**Phase 3+4**: US11 and US1 run in parallel (different files)
**Phase 5+6**: US10 and US7 run in parallel (different concerns)
**Phase 9**: T036 and T037 run in parallel (different files)

---

## Parallel Example: Phase 2 (Foundational)

```
# All derived + normalized SVGs in parallel:
T004: glyph-orbit.svg
T005: glyph-axis.svg
T006: glyph-spiral.svg
T007: glyph-origin-0.svg
T008: glyph-guardian-90.svg
T009: glyph-architect-135.svg
T010: glyph-voyager-180.svg
T011: glyph-sovereign-270.svg

# After all pass validation (T012):
T013: Generate atlas
T014: Copy production logo (parallel with T013)
T015: Update data.js (parallel with T013)
T016: Constitution amendment (parallel with T013)
```

---

## Implementation Strategy

### MVP First (US11 + US1)

1. Complete Phase 1: Setup (scripts)
2. Complete Phase 2: Foundational (SVGs, atlas, data model)
3. Complete Phase 3: US11 (logo crispness — quick win)
4. Complete Phase 4: US1 (inline SVG glyphs — highest visual impact)
5. **STOP and VALIDATE**: 7 unique glyph sigils visible, logo crisp

### Incremental Delivery

1. Setup + Foundational → assets ready
2. US11 + US1 → sigils + crisp logo (MVP!)
3. US10 + US7 → compliance fix + animation cleanup
4. US2 → atlas watermarks (core shader upgrade)
5. US3 → marginalia (manuscript feel)
6. US4 → right sidebar narrative
7. US5 + US6 → interactive behaviors
8. US8 → reveal integration
9. US9 → tier degradation (final safety net)
10. Polish → verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each phase independently testable at its checkpoint
- Total tasks: 61
- Commit after each phase or logical group
- The word "phi" MUST be ASCII Latin text, not Unicode U+03C6
- All inline SVGs must use fill="currentColor" for CSS color inheritance
- Preserve aria-hidden="true" on both .glyph wrapper span AND inner svg element
