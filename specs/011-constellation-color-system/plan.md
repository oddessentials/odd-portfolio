# Implementation Plan: Constellation Star System & Color Logic

**Branch**: `011-constellation-color-system` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-constellation-color-system/spec.md`

## Summary

Replace all per-project accentColor and starSize values in `js/data.js` with the authoritative color table and Fibonacci size ladder from the spec. Update CONSTELLATION_ZONES color fields (hex, hexBright, hexWatermark, nebulaHueRgb) to harmonize with the new system palettes. Add a minor saturation clamp to the chromatic twinkle effect for bright colors. No new modules, no new draw calls, no position changes, no interaction changes.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, GLSL ES 1.0/3.0
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger (CDN, pinned)
**Storage**: N/A (no persistence, static data in js/data.js)
**Testing**: Visual verification in Chrome, Firefox, Safari (no automated test framework)
**Target Platform**: Desktop browsers (Chrome latest, Firefox latest, Safari latest), mobile fallback
**Project Type**: Single-page WebGL portfolio (single index.html + /assets)
**Performance Goals**: 60fps desktop, <30 draw calls steady state
**Constraints**: DPR <= 1.5, <1MB textures, <30 draw calls, no build system, no npm
**Scale/Scope**: 11 projects, 3 scroll zones, 16 JS modules (~3.4KB total change)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. POC Scope | No new shader effects | PASS | No shader changes (twinkle clamp is a value adjustment, not a new effect) |
| I. POC Scope | No new data fields | PASS | Updating existing accentColor + starSize VALUES. No new fields added to PROJECTS. |
| II. Performance | Draw calls <30 | PASS | Zero new draw calls — all changes are data value updates |
| II. Performance | DPR clamped 1.5 | PASS | No DPR changes |
| II. Performance | Texture memory <1MB | PASS | Same number of canvas textures, just different colors |
| III. Accessibility | WCAG AA text contrast | VERIFY | #5A189A (deep purple) and #3B5BDB (blue) need contrast verification against #0D0B09 |
| IV. Text in HTML | No text in WebGL | PASS | No text changes |
| V. Visual Hierarchy | Accent colors inside orb | PASS | System colors stay inside the orb; frame untouched |
| VI. Procedural-First | No external assets | PASS | No new assets — colors are data values |
| VII. Graceful Degradation | Fallback preserved | PASS | No degradation pathway changes |
| VIII. Asset Readiness | No new asset deps | PASS | No new assets required |

**Gate Result**: PASS (1 item requires post-implementation verification)

## Project Structure

### Documentation (this feature)

```text
specs/011-constellation-color-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
js/
├── data.js              # PRIMARY: Update accentColor, starSize, zone colors
└── scene.js             # MINOR: Twinkle saturation clamp adjustment
```

**Structure Decision**: No new files. This feature is a data-layer change to `js/data.js` (11 accentColor values, 11 starSize values, 3 zones × 4 color fields) plus a 2-line twinkle clamp in `js/scene.js`. All downstream consumers (textures.js, constellation-lines.js, scroll-zones.js, panel.js) automatically pick up new values through existing data flow.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

## Change Impact Analysis

### Files Modified (2 files, ~50 lines changed)

| File | Change | Lines | Risk |
|------|--------|-------|------|
| `js/data.js` | Update 11 accentColor values, 11 starSize values, 3×4 zone color fields | ~40 | Low — value-only changes, no logic |
| `js/scene.js` | Clamp twinkle saturation boost for bright colors | ~2 | Low — guard clause addition |

### Files NOT Modified (confirmed no-change)

| File | Why No Change |
|------|---------------|
| `js/textures.js` | Reads `project.accentColor` at init — automatically uses new values |
| `js/constellation-lines.js` | Derives ZONE_HEX from `CONSTELLATION_ZONES` at module load — automatic |
| `js/scroll-zones.js` | Reads `zone.nebulaHueRgb` for uniforms — automatic |
| `js/gauge.js` | Zone-indexed glow only, no color data |
| `js/panel.js` | Reads `project.accentColor` — automatic |
| `js/reticle.js` | Geometric tracking only, no color |
| `js/parallax.js` | Depth offset only, no color |
| `js/burst.js` | Supernova pool, no color dependency |
| `js/terminal.js` | Scan animation, no color dependency |
| `js/sidebar-hieroglyphs.js` | MSDF shader, independent color system |
| `js/interactions.js` | Event wiring, no color logic |
| `js/app.js` | Orchestrator, no color logic |
| `js/performance.js` | Tier system, no color logic |
| `js/logo-follow.js` | Cursor follow, no color logic |

### Data Flow Verification

```
data.js:PROJECTS[].accentColor
  ├─→ textures.js:createStarTexture(hexColor)     → star sprite canvas gradient
  ├─→ textures.js:createHaloTexture(hexColor)      → cluster halo canvas gradient
  ├─→ textures.js:createNebulaSystem() line 100    → nebula particle color influence
  └─→ panel.js:showProjectPanel()                  → panel accent styling

data.js:PROJECTS[].starSize
  └─→ textures.js:createStarNodes() line 206,281   → sprite scale = starSize * 0.25

data.js:CONSTELLATION_ZONES[].hex/hexBright/hexWatermark
  └─→ constellation-lines.js lines 26-28           → ZONE_HEX/BRIGHT/WATERMARK constants

data.js:CONSTELLATION_ZONES[].nebulaHueRgb
  └─→ scroll-zones.js line 124                     → uZoneColor uniform
```

All downstream consumers read from data.js at init time. Changing data values propagates automatically — no wiring changes needed.
