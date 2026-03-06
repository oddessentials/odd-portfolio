# Quickstart: Gauge Enhancement — 010-gauge-enhancement

**Date**: 2026-03-06

## Prerequisites

- Git checkout: `010-gauge-enhancement` branch
- Dev server running: `npx http-server -p 8080` from project root
- Browser: Chrome or Firefox with DevTools open
- Files to modify: `css/styles.css`, `index.html`, `js/scroll-zones.js`, `js/animations.js`

## Implementation Order

### Step 1: Zone-Colored Gauge Faces (CSS)

Replace the existing `::before` conic-gradient gauge face with zone-colored segments.

**File**: `css/styles.css` (lines 541-570)

Replace the single `.frame__gauge::before` rule with separate left/right rules using the segment angles from research.md:

- Left gauge: dark(0-35), blue-violet(35-75), warm-gold(75-115), green-teal(115-155), dark(155-360)
- Right gauge: dark(10-250 via `from 10deg`), green-teal(240-280), warm-gold(280-320), blue-violet(320-360)

Keep the existing `inset: 18%` and `border-radius: 50%`.

### Step 2: SVG Tick Marks (HTML)

Add inner SVG elements to the gauge divs in `index.html` (lines 70-71) for tick marks at segment boundaries.

Each gauge gets an inline SVG with tick lines at the boundary angles. The SVG is absolutely positioned to fill the gauge face area.

### Step 3: Glass Dome Overlay (CSS)

Add a radial-gradient highlight layer on top of the gauge face to simulate glass curvature.

This can be an additional background layer on `::before` or a new element inside the gauge div.

### Step 4: Enhanced Bezel (CSS)

Refine the existing radial-gradient bezel with more gradient stops and deeper inset shadows for a more convincing brass instrument look.

### Step 5: Active Segment Glow (JS + CSS)

Add CSS custom properties for segment glow state. Update `scroll-zones.js` to animate these properties on zone change via the existing zone-change event system.

### Step 6: Needle Micro-Tremor (JS)

Add a subtle GSAP yoyo tween on `--needle-angle` with ±1.5deg amplitude. Pause during zone transitions, suppress under reduced-motion/tier 3.

### Step 7: Reveal Sequence Update (JS)

Update `animations.js` to ensure the new gauge face elements animate correctly during the intro sequence.

### Step 8: QA Verification

- Scroll through all zones: verify needle-to-color alignment
- Toggle reduced-motion: verify instant fallbacks
- Check mobile (<768px): gauges hidden
- DevTools Performance: verify no layout thrash
- Rapid scroll: verify no stuck animations

## Key Files Reference

| File | Lines | What to Change |
|------|-------|---------------|
| css/styles.css | 529-605 | Gauge face, bezel, needle, positioning |
| index.html | 70-71 | Add SVG tick marks inside gauge divs |
| js/scroll-zones.js | 275-289 | Add glow animation + micro-tremor |
| js/animations.js | 197-219 | Update reveal for new gauge structure |

## Zone Color Reference

| Zone | Name | nebulaHueRgb | Hex |
|------|------|-------------|-----|
| -1 | Rest | N/A | #0D0B09 |
| 0 | DevOps & Engineering | [0.42, 0.25, 0.63] | #6B40A1 |
| 1 | Applications & Products | [0.72, 0.53, 0.04] | #B8870A |
| 2 | Community & Web | [0.1, 0.62, 0.56] | #1A9E8F |
