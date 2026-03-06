# Research: Gauge Enhancement — 010-gauge-enhancement

**Date**: 2026-03-06

## R1: Gauge Segment Angular Layout

### Decision
Use **variable-width segments** — 40-degree segments for each of the 3 zone colors, centered on their needle angles, and a 240-degree dark rest segment filling the remainder.

### Rationale
Equal 90-degree segments are mathematically impossible with the existing needle angles. The left needle angles (15, 55, 95, 135) are spaced 40 degrees apart. With 4 points only 40 degrees apart, no rotation of four equal 90-degree quadrants can place all four needle positions in four distinct segments. Proof: for two points 40 degrees apart to be in different 90-degree bins, a boundary must fall between them. Two consecutive boundaries are always 90 degrees apart, but three consecutive points (15, 55, 95) span only 80 degrees — there's no room for two boundaries 90 degrees apart within that 80-degree arc.

### Alternatives Considered
1. **Equal 90-degree segments** — rejected: mathematically impossible (proven above)
2. **Unequal segments (60-degree zones)** — rejected: segments overlap when centered on 40-degree-spaced needle positions
3. **Non-consecutive segment ordering** — rejected: still impossible for same mathematical reason
4. **Changing needle angles** — rejected: would break existing scroll-zone behavior

### Segment Specifications

#### Left Gauge (needle sweeps CW: 15 → 55 → 95 → 135)

| Segment | Color | Hex | Start | End | Width | Needle |
|---------|-------|-----|-------|-----|-------|--------|
| rest (dark) | frame-bg | #0D0B09 | 155deg | 35deg | 240deg | 15deg |
| zone0 (blue-violet) | DevOps | #6B40A1 | 35deg | 75deg | 40deg | 55deg |
| zone1 (warm-gold) | Apps | #B8870A | 75deg | 115deg | 40deg | 95deg |
| zone2 (green-teal) | Community | #1A9E8F | 115deg | 155deg | 40deg | 135deg |

CSS:
```css
conic-gradient(
  from 0deg,
  #0D0B09 0deg 35deg,
  #6B40A1 35deg 75deg,
  #B8870A 75deg 115deg,
  #1A9E8F 115deg 155deg,
  #0D0B09 155deg 360deg
)
```

#### Right Gauge (needle sweeps CCW: 30 → -10 → -50 → -90)

| Segment | Color | Hex | Start | End | Width | Needle |
|---------|-------|-----|-------|-----|-------|--------|
| rest (dark) | frame-bg | #0D0B09 | 10deg | 250deg | 240deg | 30deg |
| zone2 (green-teal) | Community | #1A9E8F | 250deg | 290deg | 40deg | 270deg |
| zone1 (warm-gold) | Apps | #B8870A | 290deg | 330deg | 40deg | 310deg |
| zone0 (blue-violet) | DevOps | #6B40A1 | 330deg | 10deg | 40deg | 350deg |

CSS:
```css
conic-gradient(
  from 10deg,
  #0D0B09 0deg 240deg,
  #1A9E8F 240deg 280deg,
  #B8870A 280deg 320deg,
  #6B40A1 320deg 360deg
)
```

### Verification

All 4 states verified — both needles always point at the same zone color:

| State | Left Needle → Color | Right Needle → Color | Match |
|-------|--------------------|--------------------|-------|
| rest | 15deg → dark | 30deg → dark | YES |
| zone0 | 55deg → blue-violet | 350deg → blue-violet | YES |
| zone1 | 95deg → warm-gold | 310deg → warm-gold | YES |
| zone2 | 135deg → green-teal | 270deg → green-teal | YES |

### Visual Mirroring
- Left gauge: colored segments at 35-155deg (1 o'clock to 5 o'clock) — faces inward
- Right gauge: colored segments at 250-10deg (8 o'clock to 12 o'clock) — faces inward
- Both gauges' active arcs face toward the center of the viewport

## R2: Active Segment Highlighting Approach

### Decision
Use CSS custom properties to control per-segment opacity/brightness, animated via GSAP on zone-change events.

### Rationale
The gauge face is a CSS conic-gradient on a ::before pseudo-element. To highlight the active segment:
1. Add a second overlay element (or use a CSS mask/additional gradient layer) that brightens only the active segment
2. Drive via CSS custom properties: `--zone0-glow`, `--zone1-glow`, `--zone2-glow` (0 or 1)
3. GSAP animates these properties on zone change
4. The glow effect is a radial-gradient overlay positioned at the segment's angular center

### Alternatives Considered
1. **Swap entire conic-gradient on zone change** — rejected: can't animate conic-gradient smoothly
2. **JavaScript canvas rendering** — rejected: over-engineered, adds complexity
3. **SVG with animatable fill** — considered viable but CSS custom properties are simpler

## R3: Glass Dome Effect

### Decision
CSS radial-gradient overlay with off-center specular highlight, applied as an additional background layer or separate pseudo-element.

### Rationale
A convex glass dome creates a specular highlight that's off-center (typically upper-left for a light source above). This can be achieved with:
```css
radial-gradient(
  ellipse at 35% 30%,
  rgba(255,255,255,0.15) 0%,
  rgba(255,255,255,0.05) 30%,
  transparent 60%
)
```
Layered on top of the gauge face. No additional DOM elements needed if using multiple backgrounds on the gauge face element.

### Alternatives Considered
1. **SVG filter (feSpecularLighting)** — rejected: heavy repaint cost, browser inconsistencies
2. **Separate div overlay** — viable fallback if multiple backgrounds on ::before are insufficient
3. **Canvas 2D** — rejected: over-engineered for a static highlight

## R4: Micro-Tremor Implementation

### Decision
GSAP timeline with yoyo repeat on --needle-angle, amplitude ±1.5 degrees, paused during zone transitions.

### Rationale
A subtle tremor gives a "live instrument" feel. The needle already animates via --needle-angle CSS custom property. A looping GSAP tween with small amplitude (+/-1.5deg from current rest angle) and slow duration (2-3s per cycle) creates the effect. The tremor timeline must:
- Pause when a zone transition fires (to avoid fighting the zone animation)
- Resume after the zone animation completes
- Be killed entirely under reduced-motion or tier 3

### Alternatives Considered
1. **CSS @keyframes animation** — rejected: can't easily coordinate with GSAP zone animations
2. **requestAnimationFrame with Math.sin** — rejected: adds a separate animation loop, constitution requires single GSAP ticker
3. **GSAP CustomEase with wobble** — considered but overkill; simple yoyo tween suffices

## R5: Zone Color Source Strategy

### Decision
Hardcode hex values in CSS derived from data.js nebulaHueRgb, rather than injecting at runtime.

### Rationale
The zone colors in data.js are static constants that never change at runtime. Converting them to hex at build-time and embedding in CSS is simpler and more performant than:
1. Reading nebulaHueRgb from JS
2. Converting to hex
3. Injecting as CSS custom properties
4. Rebuilding the conic-gradient

The hex values are:
- Zone 0: rgb(0.42, 0.25, 0.63) → rgb(107, 64, 161) → #6B40A1
- Zone 1: rgb(0.72, 0.53, 0.04) → rgb(184, 135, 10) → #B8870A
- Zone 2: rgb(0.1, 0.62, 0.56) → rgb(26, 158, 143) → #1A9E8F

If zone colors ever become dynamic, a JS-driven approach would be needed. For now, static CSS is correct.

### Alternatives Considered
1. **Runtime JS injection** — rejected: unnecessary complexity for static data
2. **CSS custom properties from data.js** — viable for future-proofing but over-engineered now
