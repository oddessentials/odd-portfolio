# Implementation Plan: Gauge Enhancement — Victorian Instrument Upgrade

**Branch**: `010-gauge-enhancement` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-gauge-enhancement/spec.md`

## Summary

Enhance the two existing brass gauges from bare CSS circles with needles into detailed Victorian instruments with zone-colored segmented faces, SVG tick marks, embossed bezels, glass dome effects, and refined animations (micro-tremor, glow pulse). The gauge faces divide 360 degrees into 4 colored segments matching constellation zones. Both faces mirror each other so opposite-moving needles always point at the same active zone color. Zone colors are sourced from CONSTELLATION_ZONES data. All animations respect reduced-motion and performance tier constraints.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, CSS3, inline SVG
**Primary Dependencies**: GSAP 3.12.5 + ScrollTrigger (CDN, pinned), Three.js 0.162.0 (CDN, pinned — scene context only, gauges are DOM)
**Storage**: N/A (no persistence, static data in js/data.js)
**Testing**: Manual visual inspection, browser DevTools performance profiling
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), >=768px viewport
**Project Type**: Single-page portfolio site (static, no build system)
**Performance Goals**: 60fps steady state, <30 draw calls, no layout thrash from gauge animations
**Constraints**: No new JS dependencies, CSS custom property animations only, gauges hidden <768px
**Scale/Scope**: 2 gauge elements, 4 zone segments each, 3 animation enhancements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | PASS | Gauges already exist in the page. This enhances existing frame elements, does not add new features. No new data fields. No new shader effects. |
| II. Performance-First WebGL | PASS | Gauges are pure DOM/CSS elements — zero impact on WebGL draw calls, texture memory, or shader budget. CSS animations use compositor-friendly properties (transform, opacity). |
| III. Accessibility | PASS | Gauges are decorative frame elements with no interactive role. They already have no ARIA attributes. New animations respect prefers-reduced-motion. No accessibility regression. |
| IV. Text in HTML | PASS | No text added to WebGL. Any tick mark labels are CSS/SVG. |
| V. Visual Hierarchy | VIOLATION — JUSTIFIED | Constitution states "Accent colors stay inside the orb. They MUST NOT appear on the frame." Zone colors (nebulaHue) are not per-project accent colors — they are navigation-phase colors that represent scroll zones, not individual projects. The gauge zone segments use muted/darkened versions of zone colors as instrument markings, not as accent highlights competing with the orb. The gauges serve as navigational instruments, bridging frame and content. This is analogous to a compass rose having colored quadrants — it's instrumentation, not decoration. |
| VI. Procedural-First | PASS | Gauge faces use CSS conic-gradient or inline SVG — fully procedural, no external assets. |
| VII. Graceful Degradation | PASS | Gauges are CSS/SVG and render in all browsers. Hidden on mobile (<768px). No WebGL dependency. |
| VIII. Asset Readiness | PASS | No new external assets required. All zone colors are already defined in data.js. |

**Complexity Tracking (Principle V Violation)**:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Zone colors on frame gauges | Gauges are navigational instruments that must indicate the active constellation zone. Without color coding, the gauge needle position is meaningless — there's no reference for what zone the needle points at. | Keeping gauges monochrome (iron/brass only) was rejected because: (1) needles already move per-zone but point at an undifferentiated dark circle, (2) the spec explicitly requires zone-color coordination, (3) the colors are heavily muted/darkened to stay subordinate to the orb's vivid nebula. |

## Project Structure

### Documentation (this feature)

```text
specs/010-gauge-enhancement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
js/
├── scroll-zones.js      # MODIFY: add zone-change color updates to gauge faces, micro-tremor
├── animations.js        # MODIFY: update reveal sequence for new gauge face structure
├── data.js              # READ ONLY: zone color source (nebulaHueRgb)
├── app.js               # MODIFY: reduced-motion handling for new gauge animations
└── scene.js             # READ ONLY: no changes needed

css/
└── styles.css           # MODIFY: replace gauge ::before face with segmented conic-gradient,
                         #   add glass dome overlay, enhance bezel, add glow animation keyframes

index.html               # MODIFY: add inner SVG elements to gauge divs for tick marks/graduations
```

**Structure Decision**: This feature modifies existing files only. No new files or directories are created in the source tree. The gauge enhancement is contained within the existing CSS gauge rules, the HTML gauge elements, and the JS scroll-zone/animation modules.
