# Implementation Plan: Sidebar Glyph Language

**Branch**: `008-sidebar-glyph-language` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-sidebar-glyph-language/spec.md`

## Summary

Transform the left and right sidebars from generic UI panels into "mathematical manuscripts etched into the interface" by building a glyph language system from the OE golden-ratio logo geometry. The implementation replaces Unicode stars with per-project inline SVG glyphs, upgrades the WebGL sidebar MSDF shader from single-glyph tiling to an 8-glyph atlas with per-tile selection, adds procedural marginalia layers, evolves right sidebar telemetry to phi-themed language with an Odd Bot rotation state machine, bridges DOM hover events to WebGL brightness uniforms, and replaces the ASCII-art brand logo with the clean vector OE mark.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, GLSL ES 1.0/3.0, HTML5, CSS3, Python 3.x (SVG generation)
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned), msdfgen CLI (build-time asset tool)
**Storage**: N/A (no backend, no persistence)
**Testing**: Manual visual verification, automated SVG validation scripts, GPU frame-time profiling
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), minimum viewport 1200px. Mobile: graceful degradation (sidebars hidden <768px)
**Project Type**: Single-page HTML + WebGL portfolio (single `index.html` + `/assets` + `/js` modules)
**Performance Goals**: 60fps on Intel Iris-class integrated GPU at DPR 1.5, draw calls <30 steady state, texture memory <1MB (using 512x256 atlas), shader ALU <120/fragment at Tier 2
**Constraints**: No build system, no npm, no bundlers. All JS modules <400 lines. Total module count <=17. Procedural-first asset strategy. Gold-brass palette only in sidebars.
**Scale/Scope**: 16 existing JS modules (303 lines max in sidebar-hieroglyphs.js), 8 glyph SVGs to create/normalize, 1 MSDF atlas, 11 user stories, 30 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | PASS (with amendment) | Shader feature list expansion APPROVED by owner 2026-03-05. Amendment to v1.3.0 adds: per-glyph atlas selection, atlas UV lookup, hover brightness, scroll shift, event-triggered scan-line, Odd Bot rotation. Data model adds glyphRotation + glyphType fields (owner-approved). |
| II. Performance-First WebGL | PASS | Draw calls +0 (atlas-based, no new geometry). Texture memory: 512x256 atlas (~384KB RGB) replaces 256x256 (~192KB), net +192KB, total ~900KB — under 1MB. Shader ALU ~145 at Tier 1, ~113 at Tier 2 (under 120 soft limit), ~60 at Tier 3 (normals dropped). Tier-stratified shader mandatory (FR-029). Integrated GPU detection via WEBGL_debug_renderer_info at init time defaults to Tier 2; post-reveal benchmark can promote to Tier 1 if <14ms avg. |
| III. Accessibility Non-Negotiable | PASS (fixes gap) | All inline SVGs aria-hidden="true" (both wrapper span AND svg element). sr-only list unchanged. Keyboard focus-visible parity for hover brightening (raw focusin, not :focus-visible gated). prefers-reduced-motion: static glyphs, no animation, instant hover/Odd Bot. prefers-contrast:more: overlay hidden via JS matchMedia listener with runtime change handler in app.js (NEW — fixes existing compliance gap). "phi" rendered as ASCII Latin text, not Unicode U+03C6, for screen reader compatibility. |
| IV. Text in HTML, Never in WebGL | PASS | All status text changes are HTML. Phi equations in marginalia are procedural GLSL decoration, not human-readable content. Odd Bot is HTML element with aria-hidden. |
| V. Visual Hierarchy — Frame vs Universe | PASS | Glyphs use gold-brass palette only (frame world). No accent colors in sidebars. Glyphs are "MODERATE" ornamentation for side panels per the Rule of Thirds. |
| VI. Procedural-First Asset Strategy | PASS | All marginalia (construction lines, compass arcs, ticks) are procedural GLSL. Only the MSDF atlas is a texture file. Logo SVGs are inline HTML, not external requests. |
| VII. Graceful Degradation | PASS | WebGL glyphs hidden <768px. Inline SVGs render on all viewports including mobile hamburger menu. sr-only list unaffected. |
| VIII. Asset Readiness Gate | PASS | 8 glyph SVGs, MSDF atlas, and Odd Bot SVG are created during implementation (no external procurement). All gate-checked before dependent tasks proceed. |

## Project Structure

### Documentation (this feature)

```text
specs/008-sidebar-glyph-language/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
design-assets/oe-logo-pack-2/
├── glyph-origin-0.svg           # Normalized 300x300, filled paths
├── glyph-guardian-90.svg         # Normalized 300x300, filled paths
├── glyph-architect-135.svg       # Normalized 300x300, filled paths
├── glyph-voyager-180.svg         # Normalized 300x300, filled paths
├── glyph-sovereign-270.svg       # Normalized 300x300, filled paths
├── glyph-orbit.svg               # Derived: ring only, filled annulus
├── glyph-axis.svg                # Derived: stem only, filled rect
├── glyph-spiral.svg              # Derived: quarter-arc, filled sector
├── validate-glyphs.py            # Validation: viewBox, centering, fill-only
└── generate-atlas.sh             # msdfgen pipeline script

assets/
├── glyph-atlas-msdf.png          # 512x256 MSDF atlas, 4x2 grid of 128x128 cells (replaces logo_msdf.png)
├── logo-oe-135.svg               # Clean vector logo (replaces logo.svg)
└── atlas-uv-map.md               # UV reference: cell indices → grid positions

js/
├── sidebar-hieroglyphs.js        # Refactored: overlay renderer (~180 lines)
├── glyph-compositor.js           # NEW: glyph logic, hover, atlas UV (~200 lines)
├── data.js                       # Updated: +glyphRotation, +glyphType per project
├── terminal.js                   # Updated: phi-themed text
├── app.js                        # Updated: prefers-contrast:more listener, reduced-motion updates
├── animations.js                 # Updated: reveal wipe uniforms at t=2.2s (0.5s duration, completes t=2.7s)
├── interactions.js               # Updated: hover/focus → glyph-hover events
└── scroll-zones.js               # Updated: dispatch scroll-progress for sidebar

index.html                        # Updated: inline SVG glyphs, Odd Bot, right sidebar text, logo swap
css/styles.css                    # Updated: .glyph SVG rules, Odd Bot positioning
```

**Structure Decision**: No new directories. New module `glyph-compositor.js` added alongside existing JS modules. New normalized glyph SVGs and atlas pipeline in existing `design-assets/oe-logo-pack-2/`. Production assets in existing `assets/`. Total module count: 16 → 17.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Shader ALU ~145 at Tier 1 (exceeds 120 soft limit) | Full marginalia + hover + scroll effects require combined fragment operations | Tier-stratified approach keeps Tier 2 under 120 ALU. Tier 1 only runs on GPUs that pass post-reveal benchmark (<14ms avg). Integrated GPUs default to Tier 2 at init via WEBGL_debug_renderer_info detection. Tier 3 drops normal perturbation entirely (~60 ALU flat shading). Note: Tier 1 effects (scroll shift, complex arcs) may be effectively discrete-GPU-only features if integrated GPUs cannot sustain them. |
| 17th JS module (glyph-compositor.js) | sidebar-hieroglyphs.js would exceed 400-line limit with atlas UV logic, hover events, and three-layer composition | Keeping it in one module would require >500 lines, violating the constitution's 400-line cap. The split is the minimal decomposition. |
