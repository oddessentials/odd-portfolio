# Implementation Plan: Mobile UX Improvements

**Branch**: `013-mobile-ux` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/013-mobile-ux/spec.md`

## Summary

Three targeted improvements to the mobile portfolio experience: (1) disable logo touch-follow on coarse-pointer devices using `(hover: hover) and (pointer: fine)` capability detection, (2) display the right gauge on mobile viewports (<768px) anchored bottom-right with overlay hide/show rules, and (3) harden social sharing metadata with proper OG image, Twitter Card, canonical URL, and crawler-accessible absolute URLs. All changes are scoped to 3 existing files (logo-follow.js, styles.css, index.html) plus one asset copy, with no new modules, no new dependencies, and no impact on WebGL draw calls or performance budgets.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned)
**Storage**: N/A (no backend, no persistence, static data in js/data.js)
**Testing**: Manual cross-device testing (no automated test framework in project)
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari, Edge) + mobile browsers (iOS Safari, Chrome Android)
**Project Type**: Single-page HTML + WebGL portfolio (single index.html + /assets)
**Performance Goals**: 60fps desktop, no regression on mobile; OG image not loaded during normal page view
**Constraints**: 400-line module limit, <30 draw calls steady state, <1MB texture memory, <800KB page weight (excl. media), no build system, no npm
**Scale/Scope**: Single page, 11 projects + 2 clusters, 16 JS modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | PASS | No new modules, no new data fields, no shader changes. 3 files modified + 1 asset copied. |
| II. Performance-First WebGL | PASS | Gauges are DOM elements (zero draw call impact). No new particles, textures, or render passes. OG image not loaded in viewport. |
| III. Accessibility Non-Negotiable | PASS | FR-002 preserves logo clickability within visual bounds. FR-011 respects prefers-reduced-motion. FR-021 adds og:image:alt. |
| IV. Text in HTML | PASS | No text changes in WebGL. All meta tags are HTML. |
| V. Visual Hierarchy | PASS | Gauge stays on the frame (steampunk domain). No accent colors cross into frame. |
| VI. Procedural-First Assets | PASS | OG image is the one exception (project media category). Gauge is already CSS procedural. |
| VII. Graceful Degradation | PASS | Mobile gauge enhances existing mobile fallback. Meta tags work without JS. Logo change improves touch fallback. |
| VIII. Asset Readiness Gate | PASS | og-image.png exists at design-assets/og-image.png (1200x630, confirmed). Must optimize if >600KB. |

**No violations. No complexity tracking needed.**

## Project Structure

### Documentation (this feature)

```text
specs/013-mobile-ux/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)

specs/013-mobile-ux/
├── spec.md              # Feature specification (v3)
├── checklists/
│   └── requirements.md  # Quality checklist
```

### Source Code (files modified by this feature)

```text
js/
├── logo-follow.js       # FR-001–FR-004: capability-gated logo follow
├── scene.js             # Resize debounce (FR-004), capability utility
└── app.js               # Wire overlay events for gauge hide/show

css/
└── styles.css           # FR-005–FR-009: mobile gauge display, positioning, bracket clip

index.html               # FR-013–FR-022: social metadata, canonical, OG image

assets/
└── og-image.png         # Copied from design-assets/, optimized to ≤600KB
```

**Structure Decision**: No new files or directories beyond the asset copy. All changes fit within existing module boundaries and the 400-line limit.
