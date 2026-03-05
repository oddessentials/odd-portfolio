# Implementation Plan: Arcane UX Overhaul

**Branch**: `005-arcane-ux-overhaul` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-arcane-ux-overhaul/spec.md`

## Summary

Comprehensive UX overhaul of the Arcane Console portfolio implementing 7 feature sets: (1) WebGL sidebar hieroglyph etching using MSDF texture with custom ShaderMaterial on new PlaneGeometry meshes, (2) SVG targeting reticle system replacing existing star labels, (3) nebula palette desaturation with rare chromatic twinkle, (4) project node glow halo emphasis via enlarged sprite textures, (5) SVG constellation lines between zone project nodes, (6) 3-layer parallax depth via nebula redistribution with lerp-based mouse tracking, (7) codebase modularization bringing all files under 400 lines. Zero additional draw calls for parallax, constellation lines, and reticle (SVG overlay approach). 2 new draw calls for sidebar planes. Total projected: ~22 steady-state draw calls (under 30 budget).

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, GLSL ES 1.0/3.0
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned)
**Storage**: N/A (no backend, no persistence)
**Testing**: Manual visual testing, browser DevTools performance profiling
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari); mobile graceful degradation
**Project Type**: Single-page WebGL portfolio (single `index.html` + `/js/` modules + `/assets/`)
**Performance Goals**: 60fps on integrated GPU (Intel Iris-class), <30 draw calls steady state, <1MB texture memory
**Constraints**: No build system, no npm, no bundlers. DPR clamped to 1.5. Page weight <800KB excluding media.
**Scale/Scope**: 7 projects, 1 page, desktop-first with mobile fallback at 768px

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. POC Scope Discipline | AMENDMENT REQUIRED | Sidebar MSDF shader is a new shader effect not on the frozen list. FR-006a acknowledges this. Amendment adds sidebar MSDF effects to frozen list. |
| II. Performance-First WebGL | PASS | Projected 22 draw calls (under 30). MSDF texture 262KB GPU (total ~714KB, under 1MB). DPR clamped. Single ticker loop. Parallax zero new draw calls. |
| III. Accessibility Non-Negotiable | PASS | Reticle label accessible (not aria-hidden). Reduced motion handled for all 6 features. Hover scale 1.2x under reduced motion. |
| IV. Text in HTML, Never in WebGL | PASS | Reticle label is DOM element. Constellation lines are SVG. Star labels remain HTML. |
| V. Visual Hierarchy - Frame vs Universe | PASS | Sidebars get material richness (frame). Project nodes carry color (universe). Nebula desaturated. Hierarchy reinforced. |
| VI. Procedural-First Asset Strategy | PASS | MSDF is 1 small texture (64KB file). Construction lines recommended procedural. Star textures remain canvas-generated. |
| VII. Graceful Degradation | PASS | Tier 2/3 degradation paths specified. Mobile disables parallax/reticle/animations. WebGL context restore handled. |
| VIII. Asset Readiness Gate | PASS | MSDF source SVG exists at `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg`. msdfgen conversion required as pre-step. |

**Constitution Amendment Required**: Principle I frozen shader list must be extended to include sidebar MSDF hieroglyph etching effects. This is tracked as a prerequisite task.

**Particle/Instance Budget Amendment**: FR-009 changes halos from "hover-only" to "baked into star sprite texture, always visible" — zero additional sprites, zero draw call impact. This amends Principle II wording but not the actual budget.

## Project Structure

### Documentation (this feature)

```text
specs/005-arcane-ux-overhaul/
├── spec.md              # Feature specification (v1.0.0, reviewed)
├── plan.md              # This file
├── research.md          # Phase 0: MSDF pipeline, sidebar alignment, parallax approach
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Implementation quickstart
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── reviews/
    ├── webgl-engineer.md
    ├── technical-artist.md
    ├── motion-engineer.md
    ├── frontend-architect.md
    └── perf-specialist.md
```

### Source Code (repository root)

```text
index.html                    # Single HTML file (existing, modified for reticle/constellation SVG containers)
css/
└── styles.css                # Existing CSS (add --z-reticle, reticle/constellation styles)

js/
├── app.js                    # Orchestrator: init + tick order (REFACTORED, under 400 lines)
├── scene.js                  # Core scene: renderer, camera, lights, resize (REFACTORED, under 400 lines)
├── data.js                   # Project data + constellation zones (EXISTING, 177 lines)
├── interactions.js           # Keyboard nav, hamburger, nav hover (REFACTORED, under 400 lines)
├── panel.js                  # Panel management system (~200 lines from interactions.js)
├── performance.js            # Post-processing, auto-tier + tier-change event (REFACTORED, under 400 lines)
├── burst.js                  # Supernova burst pool (~130 lines from performance.js)
├── animations.js             # Reveal sequence only (REFACTORED, under 400 lines)
│
│   # Extracted from scene.js
├── logo-follow.js            # Logo cursor-follow system (~150 lines from scene.js)
├── textures.js               # Canvas texture creation helpers (~50 lines from scene.js)
│
│   # Extracted from animations.js
├── terminal.js               # Terminal scan + discoverability affordance (~130 lines)
├── scroll-zones.js           # Scroll-driven exploration + zone-change event (~190 lines)
│
│   # New feature modules
├── sidebar-hieroglyphs.js    # PlaneGeometry creation, MSDF ShaderMaterial, resize sync
├── reticle.js                # SVG reticle targeting, label management, logo-follow handoff
├── constellation-lines.js    # SVG line rendering, zone-change listener, draw-on animation
└── parallax.js               # Nebula layer redistribution, lerp-based mouse parallax

assets/
├── logo_msdf.png             # NEW: 256x256 MSDF texture (generated from OE monogram SVG)
└── [existing media assets]

design-assets/
└── oddessentials-logo-generator/
    └── img/
        └── oddessentials-logo-final.svg  # MSDF source (geometric OE monogram)
```

**Structure Decision**: No new directories beyond js/ modules. All new JavaScript goes into dedicated single-responsibility modules in `js/`. The MSDF texture is the only new asset file. SVG reticle and constellation line elements are created dynamically in the DOM (not static files).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New sidebar MSDF shader (Principle I frozen list) | The etched hieroglyph effect is the primary visual identity upgrade for the sidebars. It communicates the brand's mathematical design philosophy through material richness. | CSS-only etching cannot produce lighting-responsive normal perturbation, roughness modulation, or material-quality depth. A CSS background-image approach was considered but lacks the "carved into material" illusion that requires shader-based height/normal mapping. |
| Persistent glow halos (Principle II hover-only halos) | Persistent halos make project nodes immediately distinguishable from the desaturated nebula at all times, not just on hover. This is critical for the visual hierarchy fix (visitors must identify interactive nodes within 3 seconds). | Hover-only halos require the user to discover interactivity first — a chicken-and-egg problem. The baked-into-sprite approach has zero draw call cost, making the budget impact identical to the current hover-only approach. |

## Implementation Phases

### Phase 0: Asset Pipeline & Pre-requisites

1. Generate MSDF texture from `oddessentials-logo-final.svg` using msdfgen CLI
2. Validate MSDF output: 256x256 RGB PNG, under 64KB, correct distance field encoding
3. Store as `assets/logo_msdf.png`
4. Amend constitution Principle I frozen shader list (documentation update)

### Phase 1: Code Refactoring & Module Extraction

1. Extract `logo-follow.js` from `scene.js` (logo state vars lines 21-28 + logoReturnHome/initLogoFollow lines 156-299, ~150 lines)
2. Extract `textures.js` from `scene.js` (createStarTexture, createDustTexture, randomVolumePoint, ~50 lines)
3. Extract `terminal.js` from `animations.js` (playTerminalScan, playDiscoverabilityAffordance, ~130 lines)
4. Extract `scroll-zones.js` from `animations.js` (initScrollZones, handleScrollProgress, showSkipScrollAffordance, ~190 lines). Must receive ALL scene references via `init()` — no direct imports from `scene.js`
5. Add `zone-change` CustomEvent dispatch to scroll-zones.js, including `detail: { zoneIndex: -1, zone: null }` when returning to default (no-zone) state
6. Add `tier-change` CustomEvent dispatch to performance.js
7. Extract `panel.js` from `interactions.js` (panel management system, ~200 lines) to bring interactions.js under 400 lines
8. Extract `burst.js` from `performance.js` (supernova burst pool, lines 118-248, ~130 lines) to bring performance.js under 400 lines
9. Refactor `app.js` as the tick orchestrator with defined call order
10. Assign `handleStarEnter`/`handleStarExit` to `reticle.js` (reticle absorbs all hover feedback; scene.js raycasting calls into reticle module)
11. Verify: all files under 400 lines, no circular dependencies, all existing functionality preserved

### Phase 2: Starfield & Node Visual Hierarchy (P1)

1. Desaturate nebula palettes in scene.js nebulaConfigs (10-20% of current saturation)
2. Enlarge star sprite textures in `textures.js` to include glow halo (wider gradient falloff)
3. Add rare chromatic twinkle system (timer-based, max 1 per 2 seconds)
4. Add opacity dimming for non-highlighted nodes during zone activation (FR-011)
5. Adjust hover scale for reduced-motion compliance (1.2x instant vs 1.6x animated)

### Phase 3: Targeting Reticle System (P1)

1. Create `reticle.js` module with `init()` and `tick()` exports
2. Build SVG reticle element (circles, tick marks, rotation ring), insert at z-index 24
3. Wire reticle activation to existing raycaster hover detection
4. Implement reticle position tracking via `project3DtoScreen()` in tick
5. Implement star-to-star transition (200ms, power2.inOut, killable)
6. Implement fade-out on deactivation (200ms)
7. Implement idle animation (rotation/pulse), suppressed under reduced motion
8. Create accessible project name label (DOM element, role="tooltip")
9. Remove existing `showStarLabel()`/`hideStarLabel()` from scene.js (absorbed by reticle)
10. Implement logo-follow handoff (pause on reticle activate, resume on deactivate)

### Phase 4: Constellation Lines (P2)

1. Create `constellation-lines.js` module with `init()` and `tick()` exports
2. Create SVG container for lines (same overlay approach as reticle)
3. Listen for `zone-change` CustomEvent
4. Implement line endpoint projection via `project3DtoScreen()` per frame
5. Implement draw-on animation (stroke-dashoffset via GSAP)
6. Implement zone transition choreography (400ms fade-out, 100ms overlap, kill on rapid scroll)
7. Implement pulse/glow cycle on active lines
8. Handle reduced motion (instant static lines)
9. Handle Tier 2 (suppress pulse/glow) and Tier 3 (suppress all animation)

### Phase 5: Parallax Depth System (P2)

1. Create `parallax.js` module with `init()` and `tick()` exports
2. Wrap each nebula Points layer in a parent THREE.Group to separate parallax transforms from drift rotation (drift rotation stays on child Points, parallax position offsets on parent Group — prevents directional decoherence as drift accumulates)
3. Redistribute existing nebula particles by z-band (background, mid, foreground)
4. Adjust particle sizes/brightness per depth band (FR-028)
5. Implement lerp-based parallax offsets on parent Groups (per-layer damping factors)
6. Clamp maximum offsets (0.02, 0.05, 0.1 world units)
7. Add mouse-driven parallax offsets alongside existing scroll-driven nebula rotation (`nebulaGroup.rotation.y` is preserved; per-layer drift rotation `layer.rotation.y/x` is preserved on child Points; parallax applies position translations to parent Groups — three transform systems compose independently)
8. Handle reduced motion (static positions), mobile (disabled), Tier 2 (merge to 2 layers)
9. Handle dynamic resize threshold (768px toggle)

### Phase 6: Sidebar Hieroglyph Etching (P1 visual, Phase 6 due to shader complexity)

1. Create `sidebar-hieroglyphs.js` module with `init()` and `tick()` exports
2. Create PlaneGeometry meshes for left and right sidebars
3. Position meshes to overlay CSS sidebar columns; sync on resize
4. Load MSDF texture with correct filtering (LinearFilter, no mipmaps)
5. Author MSDF fragment shader: UV rotation per tile, MSDF decode (median-of-three), normal perturbation, roughness modulation, cavity darkening, edge highlight band
6. Add golden ratio construction lines (procedural phi-grid + spiral arc SDF)
7. Add breathing light (5s sin), shimmer pass (8s traverse), scan-line sweep (12s interval)
8. Pass `uTime` uniform from ticker elapsed time
9. Handle reduced motion (suppress animated effects)
10. Handle Tier 2 (disable scan-line), Tier 3 (disable all animated effects)
11. Handle WebGL context restore (texture.needsUpdate = true)

### Phase 7: Integration & Polish

1. Wire all modules into app.js orchestrator with tick order
2. Verify draw call count (target: ~22 steady state)
3. Verify texture memory (target: ~714KB, under 1MB)
4. Verify page weight increase (target: under 300KB)
5. Test auto-tier degradation: Tier 1 → Tier 2 → Tier 3 for all features
6. Test reduced-motion compliance across all features
7. Test mobile graceful degradation (below 768px)
8. Test resize behavior: sidebar alignment, reticle tracking, parallax toggle, logo-follow recalibration
9. Test WebGL context loss/restore
10. Cross-browser: Chrome, Firefox, Safari
11. Test simultaneous reticle + scroll + parallax: hover a star, scroll through zones, and move mouse concurrently — verify no race conditions, visual artifacts, or frame drops
12. Remove all dead code, verify no circular dependencies
13. Final line-count audit (all files under 400 lines)

## Module Dependency Graph

```text
app.js (orchestrator)
├── scene.js (core: renderer, camera, lights, resize, raycasting → calls reticle.onStarEnter/Exit)
│   └── textures.js (canvas texture helpers)
├── data.js (PROJECTS, CONSTELLATION_ZONES)
├── interactions.js (keyboard nav, hamburger, nav hover — REFACTORED)
│   └── panel.js (panel management system)
├── animations.js (reveal sequence only)
├── performance.js (post-processing, auto-tier, tier-change event — REFACTORED)
│   └── burst.js (supernova burst pool)
├── logo-follow.js (init receives: hitzone, logoEl, gsap)
├── terminal.js (init receives: gsap, DOM refs — no direct scene.js imports)
├── scroll-zones.js (init receives: gsap, ScrollTrigger, starNodes, nebulaLayers, DOM refs — no direct scene.js imports)
│   └── dispatches: zone-change CustomEvent (including zoneIndex: -1 for no-zone state)
├── sidebar-hieroglyphs.js (init receives: scene, camera, renderer; planes use depthTest:false, renderOrder:-1)
├── reticle.js (init receives: starNodes, camera, renderer, logoFollow ref; absorbs handleStarEnter/Exit)
├── constellation-lines.js (init receives: starNodes, camera, renderer)
│   └── listens: zone-change CustomEvent
└── parallax.js (init receives: nebulaLayers as parent Groups wrapping Points children)

No circular dependencies. All feature modules receive references via init() parameters.
scroll-zones.js and terminal.js receive all scene refs via init() — no direct imports from scene.js.
app.js is the sole module that imports from multiple sources.
```

## Tick Order (per frame)

```text
1. parallax.tick(elapsed)      — update layer offsets from mouse position
2. scene tick work              — nebula drift, star pulse, dust motes
3. raycasting                   — determine hovered star
4. reticle.tick(elapsed)        — update SVG position from hovered star
5. constellation-lines.tick()   — update SVG line endpoints
6. sidebar-hieroglyphs.tick(elapsed) — update uTime uniform
7. render (composer or direct)
```
