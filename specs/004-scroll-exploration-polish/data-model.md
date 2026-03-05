# Data Model: Scroll-Driven Exploration & Remaining Polish

**Feature**: `004-scroll-exploration-polish` | **Date**: 2026-03-04

## Entity Changes

### CONSTELLATION_ZONES (modified)

**Location**: `js/data.js`
**Change type**: Field additions + value updates (no schema-breaking changes)

| Field | Type | Status | Description |
|---|---|---|---|
| `name` | string | UPDATED | Professional category name: "Developer Tools", "Data & Analytics", "Web & Client" |
| `scrollStart` | number (0–1) | UPDATED | Compressed from (0.25, 0.50, 0.75) to (0.0, 0.33, 0.66) |
| `scrollEnd` | number (0–1) | UPDATED | Compressed from (0.50, 0.75, 0.90) to (0.33, 0.66, 1.0) |
| `projectIds` | string[] | NO CHANGE | Same project groupings |
| `nebulaHue` | string | NO CHANGE | Retained for human readability ("blue-violet", "warm-gold", "green-teal") |
| `nebulaHueRgb` | number[3] | **NEW** | RGB triplet (0–1 range) for shader uniform. Zone 1: [0.42, 0.25, 0.63], Zone 2: [0.72, 0.53, 0.04], Zone 3: [0.10, 0.62, 0.56] |
| `statusText` | string | UPDATED | Professional messages: "Browsing developer tools...", "Viewing data & analytics...", "Exploring web & client projects..." |

### PROJECTS (no changes)

The `constellation` field in each project object (e.g., "The Forge Septet") is an internal identifier. It is never rendered to users and is intentionally retained with its fantasy-themed values.

### New Runtime State (not persisted)

| Variable | Type | Location | Description |
|---|---|---|---|
| `activeZoneIndex` | number (-1 to 2) | `js/animations.js` | Currently active zone. -1 = no zone active (scroll at 0 or before reveal). |
| `nebulaGroup` | THREE.Group | `js/scene.js` | Parent group for all nebula layers. Rotated by scroll progress. |
| `yScale` | number (0.8–1.0) | `js/scene.js` | Y-axis scaling factor for star sprites, clamped at min 0.8. |
| `scrollEnabled` | boolean | `js/animations.js` | Whether scroll interactions are active (false until reveal completes). |

## Validation Rules

- `nebulaHueRgb` values MUST be in 0–1 range (not 0–255)
- `scrollStart` MUST be < `scrollEnd` for each zone
- `scrollEnd` of zone N MUST equal `scrollStart` of zone N+1 (no gaps)
- `projectIds` across all zones MUST collectively cover all 7 project IDs (no orphans)
- `activeZoneIndex` MUST be -1 when scroll progress is before zone 1's `scrollStart`

## State Transitions

```
Page load → Reveal sequence → reveal-complete event
  → scrollEnabled = true
  → body.classList.add('scroll-enabled')
  → ScrollTrigger.create() activated
  → activeZoneIndex = -1 (no zone)

Scroll progress enters zone range:
  → activeZoneIndex = zoneIndex
  → nebulaGroup.rotation.y = progress * π/2
  → nebula uniforms: uZoneColor = zone.nebulaHueRgb, uZoneInfluence → 1.0
  → zone stars: scale → 1.3x base
  → non-zone stars: scale → 1.0x base
  → status text → zone.statusText

Scroll progress exits all zones (scroll to 0):
  → activeZoneIndex = -1
  → nebulaGroup.rotation.y = 0
  → nebula uniforms: uZoneInfluence → 0.0
  → all stars: scale → 1.0x base
  → status text → default

Reduced motion:
  → All transitions use gsap.set() (zero duration)
  → Star scaling suppressed (remain at 1.0x)
  → Nebula rotation suppressed (stays at 0)
  → Color changes still apply (instant)
```
