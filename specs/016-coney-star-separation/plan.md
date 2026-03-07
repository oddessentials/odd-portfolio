# Implementation Plan: Coney Star Separation

**Branch**: `016-coney-star-separation` | **Date**: 2026-03-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-coney-star-separation/spec.md`

## Summary

Replace the single `coney-island` parent cluster entry (no repoKey, no metrics bar) with 3 independent portfolio stars — `coney-website`, `yo-coney-bot`, `yo-coney-mobile` — each with their own constellation position, orange-spectrum accent color, repoKey-driven metrics bar, and panel. Shift odd-map's color from yellow-orange to yellow-gold to avoid visual collision. Update the "Applications & Products" zone atmosphere to reflect the Coney orange family's dominance. Pure data transformation: 3 files change, zero JS module logic changes.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger (CDN, pinned)
**Storage**: N/A (static data in js/data.js, js/data-content.js, assets/repo-metrics.json)
**Testing**: Manual visual verification (no automated test framework)
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), mobile fallback
**Project Type**: Single-page static HTML + WebGL portfolio
**Performance Goals**: 60fps desktop, <30 draw calls steady-state, <1MB texture memory
**Constraints**: No build system, no npm, no backend. DPR clamped to 1.5. Max 400 lines per module.
**Scale/Scope**: 13 projects (up from 11), 3 constellation zones, ~5300 total JS lines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | PASS | No new data fields. Approved fields only (id, repoKey, accentColor, starSize, position, etc.). Removing parent cluster, adding 3 entries with existing schema. No scope expansion. |
| II. Performance-First WebGL | PASS | Draw calls: ~13 → ~19 (under 30 budget). Texture memory: +~20KB (under 1MB). Star separation: 0.22+ units (exceeds 0.18 minimum). DPR unchanged. |
| III. Accessibility | PASS | Sidebar buttons updated: 1 → 3 (each keyboard-navigable). `.sr-only` list will reflect 3 individual entries. No ARIA changes needed. |
| IV. Text in HTML | PASS | No WebGL text changes. All project names/labels remain HTML. |
| V. Visual Hierarchy | PASS | Orange accent colors stay inside the orb (star colors). No frame contamination. Zone tint update is orb-internal. |
| VI. Procedural-First | PASS | No new external assets. Shared existing logo + photo. Star colors are hex values in data, not texture files. |
| VII. Graceful Degradation | PASS | Static fallback and `.sr-only` list unaffected. 3 new sidebar buttons work without JS. |
| VIII. Asset Readiness | PASS | All assets exist: logo SVG, restaurant photo, repo-metrics.json entries. Screenshot placeholders are acceptable (null media). |

**Gate Result**: ALL PASS. No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/016-coney-star-separation/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Integration analysis, color math, data verification
├── data-model.md        # Phase 1: PROJECTS entries, zone updates, content changes
├── quickstart.md        # Phase 1: Step-by-step implementation guide
└── checklists/
    └── requirements.md  # Spec quality checklist (all pass)
```

### Source Code (repository root)

```text
js/
├── data.js              # MODIFY: Remove coney-island, add 3 entries, update zone, shift odd-map color
├── data-content.js      # MODIFY: Remove parent 'coney-island' content key
└── [all other modules]  # NO CHANGES (verified safe by integration analysis)

index.html               # MODIFY: Replace 1 sidebar button with 3

assets/
├── coney-island-logo-1024x690.svg          # EXISTING: Shared logo for all 3 Coney stars
├── coney-island-restaurant-and-tavern.jpg  # EXISTING: Photo for coney-website panel
└── repo-metrics.json                       # EXISTING: Contains all 3 Coney repo metrics
```

**Structure Decision**: No new files or directories. This is a pure data modification within existing files. The project structure is unchanged.
