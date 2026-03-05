# Implementation Plan: Brass Frame Optimization

**Branch**: `006-brass-frame-optimization` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-brass-frame-optimization/spec.md`

## Summary

Redesign the brass frame's corner ornaments from 80x80px fading radial-gradient squares to L-shaped brackets via `clip-path: polygon()`, reposition and resize the side gauges to sit centered on the border rail, and extend edge rails to meet the new smaller corner footprint. All changes are CSS-only with no new HTML elements, no external images, and no WebGL impact.

## Technical Context

**Language/Version**: CSS3 custom properties, HTML5 (no JS changes for frame CSS; minor JS review for reveal animation compatibility)
**Primary Dependencies**: GSAP 3.12.5 (reveal animation targets `.frame__corner` and `.frame__gauge` elements by class — must verify selectors still match)
**Storage**: N/A
**Testing**: Manual visual inspection at desktop (1920x1080), tablet (1024x768), and mobile (375x667) viewports. Browser matrix: Chrome, Firefox, Safari.
**Target Platform**: Desktop browsers (1200px+), tablet (768-1199px), mobile graceful degradation (<768px)
**Project Type**: Single-page HTML + CSS + WebGL portfolio
**Performance Goals**: Zero WebGL draw call impact. Corner clip-path promotes 4 elements to compositor layers (~100KB VRAM at 1x DPR). All elements static after reveal.
**Constraints**: No external image files (Constitution Principle VI). No new DOM elements (SC-003). No pointer-events changes (frame remains inert).
**Scale/Scope**: 5 CSS rule changes (4 corners + shared), 2 gauge repositions, 3 responsive breakpoint updates, 1 CSS custom property change.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. POC Scope | Does this add scope? | PASS — fixes existing elements, no new features |
| II. Performance-First | Draw call impact? | PASS — zero WebGL impact, CSS-only |
| III. Accessibility | aria-hidden / pointer-events preserved? | PASS — frame remains `aria-hidden="true"`, `pointer-events: none` |
| IV. Text in HTML | Any text moved to canvas? | N/A — no text involved |
| V. Visual Hierarchy | Ornamentation stays on frame? | PASS — all changes within frame bezel |
| V. Rule of Thirds | Corners LAVISH, side panels MODERATE? | PASS — corners remain LAVISH (L-brackets with rivets, bevel), gauges MODERATE |
| VI. Procedural-First | Any external images? | PASS — all CSS gradients, box-shadows, clip-paths |
| VII. Graceful Degradation | clip-path fallback? | PASS — without clip-path, corners render as small squares (acceptable fallback) |
| VIII. Asset Gate | Assets needed? | PASS — no new assets required |

**Result: All gates PASS. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/006-brass-frame-optimization/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: clip-path techniques, gauge positioning
├── data-model.md        # Phase 1: CSS custom property map
├── quickstart.md        # Phase 1: implementation guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
css/
└── styles.css           # All frame CSS changes (lines 265-544, 1290-1420)

js/
└── animations.js        # Verify reveal animation compatibility (read-only unless tweaks needed)
```

**Structure Decision**: All changes are in a single CSS file (`css/styles.css`) targeting the frame section (section 6). The JS file `animations.js` needs review for reveal animation compatibility but likely requires no changes since it targets elements by class name which remain unchanged.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
