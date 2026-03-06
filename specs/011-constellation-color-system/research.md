# Research: Constellation Star System & Color Logic

**Feature**: 011-constellation-color-system
**Date**: 2026-03-06

## Research Summary

No unknowns remain. All technical questions were resolved during the multi-agent specification phase (5 specialists: Celestial Systems Designer, Interaction Architect, Geometry Engineer, Rendering Engineer, QA). This document records the decisions made.

---

## Decision 1: Color Source — Static Data vs Runtime Interpolation

**Decision**: Static data. All 11 hex colors are hardcoded in `js/data.js` as `accentColor` values, read by the renderer at init time.

**Rationale**: Owner directive — "The color table is authoritative. Colors must not be recalculated, interpolated, or derived by code." The original CONSTELLATIONS.md proposed Fibonacci interpolation; the owner replaced it with a fixed lookup table.

**Alternatives considered**:
- Fibonacci/golden-ratio RGB lerp at init time (CONSTELLATIONS.md original) — rejected by owner
- HSL interpolation for cleaner mid-arc colors — rejected, no runtime computation allowed

---

## Decision 2: System Architecture — Layer vs Replace Zones

**Decision**: Star systems layer on top of scroll zones. Systems define color grouping; zones define scroll-driven navigation.

**Rationale**: Zones (CONSTELLATION_ZONES) are scroll-driven UI regions consumed by scroll-zones.js, constellation-lines.js, and gauge.js. Systems are conceptual groupings that only affect color. Replacing zones would break scroll navigation.

**Alternatives considered**:
- Replace zones with systems — rejected (breaks scroll behavior)
- Merge systems into zones as a single hierarchy — rejected (different responsibilities)

---

## Decision 3: Configuration Structure — Single Canonical vs Separate Arrays

**Decision**: Single canonical configuration. Project id, system id, hex color, and size tier are all expressed through the existing PROJECTS array in data.js. System membership is implicit in the PROJECTS entries (no separate STAR_SYSTEMS array needed).

**Rationale**: Owner directive — "Use a single canonical configuration." The existing PROJECTS array already has accentColor and starSize fields. Updating their values is sufficient. System membership can be documented but doesn't need a runtime data structure since colors are static.

**Alternatives considered**:
- Separate STAR_SYSTEMS array + per-project systemId field — rejected (requires constitution amendment for new field, adds complexity)
- New constellation-config.js module — rejected (adds unnecessary file)

---

## Decision 4: Zone Atmospheric Colors — Derivation Method

**Decision**: Each zone's atmospheric colors (hex, hexBright, hexWatermark, nebulaHueRgb) are derived from the dominant star system's palette. Concrete values specified in the spec.

**Rationale**: Zone atmospherics must harmonize with star colors. Using the dominant system's representative color (median of palette) ensures visual cohesion. Values are hardcoded in CONSTELLATION_ZONES, not computed.

**Alternatives considered**:
- Average all project colors in the zone — rejected (complex, muddy results)
- Dynamic per-frame interpolation — rejected (over-engineered for 3 fixed zones)
- Keep old zone colors — rejected (blue-violet nebula clashes with green stars)

---

## Decision 5: Star Positions — Freeze vs Orbit-Based

**Decision**: Freeze all positions. No changes to hand-placed Cartesian coordinates.

**Rationale**: Owner directive — "Do not modify star positions." Orbit-based positioning would require recalculating all 11 star positions, reverifying raycasting hit boxes, and checking the 0.18 world-unit separation constraint. Deferred to a potential future feature.

**Alternatives considered**:
- Logarithmic orbit spacing (CONSTELLATIONS.md original) — rejected by owner

---

## Decision 6: Twinkle Saturation Clamp

**Decision**: Add a saturation ceiling to the chromatic twinkle effect in scene.js to prevent clipping on bright colors.

**Rationale**: Current twinkle boosts saturation by +0.7. On already-saturated colors like #F0E442 (yellow) or #9FE060 (lime), this can produce washed-out white. Clamping the post-boost saturation to a maximum (e.g., 0.95) prevents visual artifacts.

**Implementation**: scene.js line 274 — change from:
```
twinkleColor.setHSL(twinkleHSL.h, Math.min(1, twinkleHSL.s + 0.7), Math.min(1, twinkleHSL.l + 0.2));
```
to:
```
twinkleColor.setHSL(twinkleHSL.h, Math.min(0.95, twinkleHSL.s + 0.5), Math.min(0.9, twinkleHSL.l + 0.15));
```
Reduced boost values (0.5 sat, 0.15 light) with lower ceilings (0.95 sat, 0.9 light) prevent clipping while preserving the twinkle visual on the new palette.

---

## Decision 7: WCAG Contrast Verification

**Decision**: Verify post-implementation. Two colors need checking against #0D0B09:

| Color | Hex | Estimated Contrast | Status |
|-------|-----|--------------------|--------|
| Deep purple | #5A189A | ~3.5:1 | AT RISK — may fail AA for normal text. Safe for large text (3:1). |
| Blue | #3B5BDB | ~5.2:1 | LIKELY PASS — above AA threshold |

**Mitigation for #5A189A**: If contrast fails, use hexBright (#9B4DDF) for panel text instead, keeping #5A189A for star sprite only (non-text, no WCAG requirement).

---

## Decision 8: Gauge Module

**Decision**: No changes to gauge.js. Gauges are zone-indexed only (needle angles, glow properties). They don't consume project colors or system colors.

**Rationale**: gauge.js uses `--gauge-zone0-glow`, `--gauge-zone1-glow`, `--gauge-zone2-glow` CSS properties and needle angles. None of these reference hex colors from CONSTELLATION_ZONES or PROJECTS. No change needed.
