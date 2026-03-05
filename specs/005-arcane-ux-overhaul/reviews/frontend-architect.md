# Front-End Systems Architect Review

**Spec**: `specs/005-arcane-ux-overhaul/spec.md` v0.1.0
**Reviewer**: Front-End Systems Architect
**Date**: 2026-03-04
**Verdict**: APPROVED WITH AMENDMENTS

---

## Summary

The spec is well-structured with comprehensive acceptance criteria, proper reduced-motion handling, and appropriate performance tier awareness. However, several architectural issues need resolution before implementation can proceed cleanly. The most significant concern is that the 400-line-per-file limit (SC-008) is already violated by three existing modules, making the cleanup mandate load-bearing for this spec rather than aspirational. Additionally, the spec under-specifies integration points for new modules into the existing GSAP ticker render loop, and the SVG reticle DOM placement needs explicit z-index coordination.

---

## Findings

### Finding 1 -- SC-008 400-line limit is already violated by 3 files (CRITICAL)

**Current line counts**:
- `js/scene.js`: 845 lines
- `js/animations.js`: 821 lines
- `js/interactions.js`: 565 lines
- `js/performance.js`: 429 lines
- `js/data.js`: 177 lines
- `js/app.js`: 59 lines

SC-008 states "no single JavaScript file exceeds 400 lines." Three files already exceed this limit before any 005 work begins. The spec's FR-031 says "existing monolithic files MUST NOT grow by more than 50% in line count," but does not mandate shrinking them to the 400-line cap.

This creates an impossible requirement: SC-008 demands all files under 400 lines, but FR-031 only prevents growth beyond 50%. Even if the new features go into new modules (reticle.js, constellation-lines.js, parallax.js, sidebar-hieroglyphs.js), scene.js at 845 lines and animations.js at 821 lines cannot meet SC-008 without active refactoring that the FRs do not explicitly mandate.

**Amendment**: Add a new FR (or amend FR-031) that explicitly mandates extracting functionality from scene.js and animations.js to bring them under 400 lines. Specific candidates:
- scene.js: Extract logo-follow logic (lines 21-299, ~280 lines) into a `logo-follow.js` module. Extract star label management (lines 117-151, ~35 lines) into the reticle module (since the reticle replaces/augments the label system). Extract texture creation helpers (lines 50-98, ~50 lines) into a shared `textures.js` utility.
- animations.js: Extract `playTerminalScan` (lines 338-427, ~90 lines) and `playDiscoverabilityAffordance` (lines 292-333, ~42 lines) into a `terminal.js` module. Extract scroll zone logic (lines 500-688, ~190 lines) into a `scroll-zones.js` module.

Without this amendment, SC-008 will fail at review time despite all new code being in new modules.

---

### Finding 2 -- Reticle SVG z-index and DOM placement unspecified (HIGH)

FR-012 states the SVG reticle is "positioned above the WebGL canvas layer" but does not specify where in the DOM it goes or what z-index it receives. The existing z-index stack is:

```
--z-canvas: 0         (canvas)
--z-frame: 10         (decorative frame)
--z-hud: 20           (nav/status panels)
--z-star-labels: 25   (star labels)
--z-logo-follow: 30   (logo cursor)
--z-hamburger: 35
--z-nav-overlay: 40
--z-overlay-backdrop: 90
--z-overlay: 100
```

The `#orb-hitzone` sits at `z-index: calc(var(--z-hud) - 1)` = 19. The `#star-labels` container sits at z-index 25. The reticle must be:
- Above the canvas (z: 0) so it renders visibly
- Below the `#orb-hitzone` (z: 19) OR use `pointer-events: none` (which FR-017 correctly mandates)
- At or near `#star-labels` z-index (25) since it visually replaces/augments the label

**Amendment**: The spec should mandate a `--z-reticle` CSS custom property value (recommend 24, between hitzone at 19 and star-labels at 25), and specify that the SVG reticle element is inserted as a sibling to `#star-labels` in the DOM, outside `#app-shell`, as a fixed-position overlay. The plan must define this DOM insertion point explicitly.

---

### Finding 3 -- New per-frame updates lack integration specification into GSAP ticker (HIGH)

The existing render loop is a single `gsap.ticker.add()` callback in scene.js (lines 700-788). This callback handles nebula drift, star pulse, dust mote physics, raycasting, star hover/exit, and rendering. The spec proposes three new per-frame systems:

1. **Reticle tracking** (FR-013): update reticle SVG position from 3D-to-screen projection every frame
2. **Parallax layers** (FR-026): update layer offsets based on mouse position every frame
3. **Constellation lines** (FR-019-022): update line positions based on star screen-space positions during zone transitions

The spec says new features go into dedicated modules (FR-031), but does not specify how these modules hook into the render loop. There are two patterns available:
- **A)** New modules export an `update()` function that scene.js calls inside the ticker (tight coupling)
- **B)** New modules register their own `gsap.ticker.add()` callbacks independently (decoupled but uncoordinated render order)

Pattern B risks the reticle position lagging one frame behind the star positions (the star raycast happens in scene.js's ticker, but the reticle update would be in a separate ticker callback with undefined execution order).

**Amendment**: The spec or plan should mandate Pattern A: each new per-frame module exports a `tick(elapsed)` or `update(elapsed)` function, and scene.js (or a new orchestrator module) calls them in a defined order within the single ticker callback. The call order should be: (1) parallax layer offsets, (2) star/nebula updates, (3) raycasting, (4) reticle position update, (5) constellation line position update, (6) render. This ensures the reticle always reflects the current frame's star positions.

---

### Finding 4 -- Reticle interaction with existing star label system (MEDIUM)

The spec defines the reticle as showing "a project name label beside the reticle" (US2 acceptance scenario 1). The existing codebase already has a label system: `showStarLabel()` / `hideStarLabel()` in scene.js (lines 120-151) that creates `<div>` elements in the `#star-labels` container, positioned via `project3DtoScreen()`.

The spec does not clarify whether:
- The reticle label replaces the existing star label system entirely
- The reticle label coexists alongside the existing labels
- The existing label system is removed as dead code per FR-032

If both systems run simultaneously, the user will see two overlapping labels per star.

**Amendment**: Add explicit language to FR-012 or a new FR stating that the reticle module takes ownership of star labeling. The existing `showStarLabel()` / `hideStarLabel()` functions in scene.js should be removed or delegated to the reticle module. The `#star-labels` container may be repurposed for the reticle label or removed if the reticle embeds its own label element.

---

### Finding 5 -- Constellation lines implementation approach needs constraining (MEDIUM)

FR-019-024 define constellation line behavior but the "Key Entities" section says: "Can be implemented as WebGL line geometry (THREE.Line) or canvas/SVG overlay, depending on rendering approach selected during planning."

This open-ended approach has significant architectural implications:
- **THREE.Line in WebGL**: Requires adding geometry to the scene, incrementing draw call count (FR-034 budget). Line positions are in world space and move with camera. Lines need screen-space pixel width, which THREE.Line does not natively support (requires `THREE.Line2` from addons for fat lines, adding another CDN dependency).
- **SVG/Canvas overlay**: Requires per-frame 3D-to-screen projection for each node pair (like the reticle). Needs its own z-index layer. Lines render at display resolution without aliasing concerns. No draw call cost.

Given the draw call budget (FR-034: <30 steady state) and the fact that the reticle is already an SVG overlay, consistency argues for SVG. But 3 zones with up to 3 node pairs each means up to 9 simultaneous SVG `<line>` elements requiring per-frame transform updates.

**Amendment**: The spec should constrain this decision or state explicit criteria for the plan to resolve it. Recommend adding: "Constellation lines SHOULD be implemented as SVG overlay elements sharing the reticle's coordinate projection system, to avoid draw call budget impact and maintain rendering consistency with the reticle." This reduces architectural ambiguity for the planner.

---

### Finding 6 -- Parallax requires restructuring the existing particle system (MEDIUM)

FR-025-028 mandate 3 parallax depth layers with distinct size/brightness gradients. The existing codebase already has 3 nebula layers in `nebulaConfigs` (scene.js lines 408-412), but these are organized by color palette and opacity, not by depth. Their z-ranges overlap (`[-2, 1]`, `[-2.5, 1.5]`, `[-3, 2]`), and all three layers have similar particle sizes (0.022, 0.020, 0.018).

The spec says parallax layers respond to mouse movement with position offsets (FR-026), meaning the existing `nebulaGroup` rotation system in animations.js (line 625-627: `nebulaGroup.rotation.y = progress * Math.PI * 0.5`) would conflict with per-layer parallax offsets.

Restructuring the nebula layers from palette-based to depth-based is a significant change to scene.js's initialization logic. The spec's assumption "Sidebar geometry already exists in the WebGL scene" is correct, but the assumption that particles can be trivially reorganized into depth layers is implicit and non-trivial.

**Amendment**: Add an assumption or note acknowledging that the existing 3 nebula layers must be restructured from palette-based to depth-based organization. The plan must account for this refactoring in scene.js. The existing `nebulaGroup.rotation.y` scroll-driven rotation must be replaced by per-layer parallax offsets, and FR-026 should note this is a breaking change to the current scroll-driven nebula behavior.

---

### Finding 7 -- CSS architecture: styles.css is already 1522 lines (LOW)

The project uses an external CSS file (`css/styles.css`), not inline CSS as noted in the review prompt. This file is already 1522 lines. New features (reticle, constellation lines, parallax) will add CSS for:
- Reticle SVG positioning, opacity transitions, idle animations
- Constellation line SVG stroke animations
- New z-index custom properties

SC-008's 400-line limit applies only to JavaScript files, but the CSS file could benefit from similar modularity. This is not a blocking concern since CSS in a single file without a build system is a reasonable architecture, but worth noting for future iterations.

**No amendment required** -- informational only.

---

### Finding 8 -- Circular dependency risk assessment: low but needs monitoring (LOW)

Current dependency graph (arrows = imports from):
```
app.js --> scene.js --> data.js
app.js --> interactions.js --> data.js
app.js --> animations.js --> scene.js, performance.js, data.js, interactions.js
app.js --> performance.js --> (three.js only)
```

The existing graph has one cross-edge worth noting: `animations.js` imports `setInitialFocus` from `interactions.js`, while `interactions.js` does not import from `animations.js`. This is a one-way dependency, not circular.

Proposed new modules:
- `reticle.js`: needs `starNodes`, `camera`, `renderer` from scene.js, and hover state
- `constellation-lines.js`: needs `starNodes`, `camera`, `renderer` from scene.js, and zone data from data.js
- `parallax.js`: needs nebula layer references from scene.js, and mouse position
- `sidebar-hieroglyphs.js`: needs sidebar mesh references from scene.js

All four new modules depend on scene.js exports, which is appropriate (scene.js is the shared state owner). The risk would arise if scene.js needed to import from any new module (creating a cycle). Since the proposed tick/update pattern (Finding 3) has scene.js calling into new modules, scene.js would need to import their update functions.

**Amendment (minor)**: If scene.js imports `update()` from reticle.js, and reticle.js imports `starNodes` from scene.js, this is a circular dependency. Resolve by having `app.js` (the orchestrator) wire the connections: app.js imports from both scene.js and reticle.js, then passes scene references to reticle.js's `init()` function rather than having reticle.js import from scene.js directly. Alternatively, introduce a thin `tick-manager.js` orchestrator that imports all update functions and scene state, keeping the graph acyclic. The spec should add a note in FR-033 recommending the dependency injection pattern for new modules.

---

### Finding 9 -- Accessibility: decorative classification is correct but incomplete (LOW)

The spec correctly identifies the reticle as needing `pointer-events: none` (FR-017) and all visual additions as decorative. However:

1. The reticle label (project name beside the reticle) serves a functional purpose -- it communicates which project the user is about to interact with. If this label replaces the existing star label (Finding 4), it must NOT be `aria-hidden`. The SVG reticle graphic itself should be `aria-hidden="true"`, but the text label should remain accessible.

2. The constellation lines have semantic meaning (showing project relationships). While they are visually decorative, their information content (which projects are related) is already conveyed by the zone structure in the navigation. The `aria-hidden="true"` classification is acceptable.

3. The sidebar hieroglyphs are purely decorative. The `aria-hidden="true"` classification is correct.

**Amendment**: Add a note to FR-012 that the reticle's project name label must be accessible to assistive technology (not `aria-hidden`), even though the SVG targeting graphic is decorative. Recommend the label be a DOM element (not SVG `<text>`) with `role="tooltip"` or `aria-live="polite"` so screen readers announce the targeted project name on hover.

---

### Finding 10 -- Event system extension needed for zone-change (LOW)

The existing CustomEvent system dispatches: `star-click`, `panel-open`, `panel-close`, `reveal-complete`, `terminal-scan-complete`. The constellation lines feature (FR-019-024) needs to know when a zone activates/deactivates. Currently, zone changes are handled internally in `animations.js` `handleScrollProgress()` (line 565: `if (newZoneIndex !== activeZoneIndex)`).

If constellation-lines.js is a separate module (per FR-031), it needs a way to learn about zone transitions. Options:
- **A)** Export `activeZoneIndex` from animations.js and poll it (anti-pattern)
- **B)** Dispatch a new `zone-change` CustomEvent from `handleScrollProgress()`
- **C)** Have the orchestrator (app.js or tick-manager.js) call constellation-lines.js directly during zone transitions

**Amendment**: Recommend extending the event system with a `zone-change` CustomEvent dispatched from `handleScrollProgress()` with `detail: { zoneIndex, zone }`. This is the cleanest decoupling pattern consistent with the existing architecture. Add this as a new FR or note under FR-019.

---

## Amendments Summary

| # | Severity | Amendment |
|---|----------|-----------|
| 1 | CRITICAL | Add FR mandating extraction of scene.js and animations.js below 400 lines with specific refactoring targets |
| 2 | HIGH | Specify reticle SVG z-index (`--z-reticle: 24`) and DOM insertion point (sibling to `#star-labels`, outside `#app-shell`) |
| 3 | HIGH | Mandate single-ticker integration pattern with defined call order for all per-frame modules |
| 4 | MEDIUM | Clarify reticle label vs. existing star label system -- one must own labeling, not both |
| 5 | MEDIUM | Constrain constellation lines to SVG overlay approach for draw call budget and reticle consistency |
| 6 | MEDIUM | Acknowledge existing nebula layers must be restructured from palette-based to depth-based for parallax |
| 8 | LOW | Recommend dependency injection pattern for new modules to prevent circular imports |
| 9 | LOW | Ensure reticle project name label is accessible (not `aria-hidden`), recommend `role="tooltip"` |
| 10 | LOW | Add `zone-change` CustomEvent to decouple constellation-lines.js from animations.js internals |
