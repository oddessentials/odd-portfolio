# Implementation Plan: Constellation Line and Zone Enhancements

**Branch**: `009-constellation-zone-enhancements` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-constellation-zone-enhancements/spec.md`

## Summary

Expand the portfolio starfield from 7 hard-coded projects to a data-driven model supporting 9 individual stars + 2 clusters (experiments, dead rock), restructure 3 scroll zones without cross-zone bridges except two designated bridge stars (odd-ai-reviewers, repo-standards), upgrade SVG constellation lines with gradient/glow active state + persistent dashed watermark lines, add constellation intro showcase during reveal, add social/presence links, and clean up unused glyph atlas cruft — all while preserving every existing interaction and animation.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, GLSL ES 1.0/3.0, HTML5, CSS3
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned)
**Storage**: N/A (no backend, no persistence, static data in js/data.js)
**Testing**: Manual testing — visual regression, keyboard walkthrough, reduced-motion, high-contrast, cross-browser (Chrome/Firefox/Safari)
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), minimum 1200px viewport. Mobile: static fallback + hamburger nav
**Project Type**: Single-page WebGL portfolio (single index.html + /assets, no build system)
**Performance Goals**: 60fps on Intel Iris integrated GPU, <30 draw calls steady state, <1MB textures, panel open <100ms
**Constraints**: No build system, no npm, CDN-only dependencies, DPR clamped to 1.5, max 400 lines per JS module, shader feature list frozen (all line enhancements are SVG-based)
**Scale/Scope**: 11 visual elements (9 stars + 2 clusters), 3 scroll zones, ~16 JS modules, 10 social link icons

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | VIOLATION (APPROVED AMENDMENT) | "7 projects" and "7 hard-coded positions" must become data-driven. Owner approved amendment. New fields: `status`, `isCluster`, `clusterMembers`. Shader list stays frozen. |
| II. Performance-First WebGL | PASS | Draw calls: 11 visual elements (9 sprites + 2 cluster groups) ≈ 15 steady-state (within <30 budget). SVG lines are DOM, not draw calls. 0.18 unit separation maintained for new positions. DPR clamp unchanged. |
| III. Accessibility | PASS | SR-only list expanded for all new projects + cluster members. New nav entries get ARIA attributes, keyboard nav, focus indicators. Dead rock cluster exempt from focus (non-interactive). |
| IV. Text in HTML | PASS | All new text (project names, taglines, cluster panels, social labels) is HTML. No canvas text. |
| V. Visual Hierarchy | PASS | New accent colors stay inside the orb. Social links use brass aesthetic consistent with frame. No accent color bleeds to frame. |
| VI. Procedural-First | PASS | Clusters use canvas-drawn textures. Social icons are inline SVG paths (<500 bytes each). No new external asset files for visual elements. |
| VII. Graceful Degradation | PASS | SVG constellation lines persist through WebGL context loss. New project data accessible via SR-only HTML list. Mobile: content via hamburger nav. |
| VIII. Asset Readiness | PASS | All panel data resolved (ado-git-repo-seeder, socialmedia-syndicator descriptions provided). No new video/image assets needed. |

**Pre-Phase 0 Gate Result: PASS** (with approved Principle I amendment)

### Post-Phase 1 Re-Check

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. POC Scope | PASS (amended) | Data model fully defined in data-model.md. Fields: status, isCluster, clusterMembers added. Glyph fields removed (dead code cleanup reduces scope). Shader list untouched. |
| II. Performance | PASS | Draw call estimate refined: 9 star sprites + ~11 cluster sprites + 3 nebula + 1 dust + 2 sidebar = ~26 steady-state. Under 30 budget. SVG lines add 0 draw calls. New positions verified >0.18 separation (R-005). |
| III. Accessibility | PASS | SR-only list expands from 7 to 13 entries (9 stars + 4 experiment members). Dead rock cluster in SR-only with "paused" label but no interactive link. Social links get aria-labels. |
| IV. Text in HTML | PASS | No new canvas text introduced. All cluster member names, social link labels, in-progress badges are HTML. |
| V. Visual Hierarchy | PASS | New accent colors (#38BDF8 sky-blue, #F472B6 pink, #10B981 emerald, #F97316 orange, #6B7280 grey) all stay inside the orb. Social links use brass color on frame. |
| VI. Procedural-First | PASS | No new external texture files. Cluster halos are canvas-drawn. Social icons are inline SVG paths (~4KB total). |
| VII. Graceful Degradation | PASS | SVG watermark lines visible even during WebGL context loss. Mobile hamburger nav expanded for all new entries. |
| VIII. Asset Readiness | PASS | All data provided. No blocking assets. |

**Post-Design Gate Result: PASS**

## Project Structure

### Documentation (this feature)

```text
specs/009-constellation-zone-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
js/
├── data.js              # MODIFY: Expanded PROJECTS array, new cluster entries, updated CONSTELLATION_ZONES, remove GLYPH_ATLAS_CELLS
├── constellation-lines.js # MODIFY: Watermark lines, SVG defs/filters/gradients, energy flow animation, intro showcase, bridge handling
├── scroll-zones.js      # MODIFY: Updated zone names, bridge star highlight logic (no flicker)
├── scene.js             # MODIFY: Cluster sprite creation, starNodes expanded
├── textures.js          # MODIFY: createStarNodes handles clusters (tiny points + halo), dead rock (dim grey)
├── interactions.js      # MODIFY: Nav expansion, touch guard for new entries, cluster nav behavior
├── panel.js             # MODIFY: Cluster panel list view, Coney Island multi-repo panel, in-progress badge
├── animations.js        # MODIFY: Constellation intro showcase appended after star ignition (~5.2s)
├── app.js               # MODIFY: Updated init order, new social links init
├── reticle.js           # MODIFY: Cluster center tracking for interactive clusters
├── glyph-compositor.js  # MODIFY: Remove MSDF fragment shader (unused), keep hover/rect utilities
├── sidebar-hieroglyphs.js # NO CHANGE (manuscript texture approach unaffected)
├── performance.js       # NO CHANGE (draw call budget still met)
├── parallax.js          # NO CHANGE
├── burst.js             # NO CHANGE
├── terminal.js          # NO CHANGE
└── logo-follow.js       # NO CHANGE

index.html               # MODIFY: New nav buttons, SR-only list expansion, social links section, updated meta
css/styles.css           # MODIFY: Social links styles, in-progress badge, cluster panel list view

.specify/memory/constitution.md  # MODIFY: Principle I amendment (v1.4.0)
```

**Structure Decision**: No new files needed. All changes fit within existing module boundaries. The constellation-lines.js module will grow the most (~100 lines for watermark + filters + intro) but will remain well under the 400-line constitution limit.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle I: "7 projects" → variable count | Full portfolio inventory requires 9 individual stars + 2 clusters (11 visual elements) | Keeping only 7 projects misrepresents portfolio scope; owner explicitly requires complete inventory |
| Principle I: "7 hard-coded positions" → data-driven | New stars and clusters need computed positions | Cannot hard-code — variable project count requires data-driven positioning |
| Principle I: New data model fields (status, isCluster, clusterMembers) | Cluster abstraction requires entity differentiation | Without cluster support, 20+ repos would each need individual stars, exceeding draw call budget |
