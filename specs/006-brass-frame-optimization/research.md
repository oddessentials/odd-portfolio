# Research: Brass Frame Optimization

**Feature**: 006-brass-frame-optimization
**Date**: 2026-03-05

## R1: clip-path: polygon() for L-Shaped Corners

**Decision**: Use `clip-path: polygon()` on existing `.frame__corner` elements to mask them into L-shapes.

**Rationale**: clip-path is CSS-only, requires no new HTML, preserves existing background gradients and pseudo-elements (rivets), and has broad browser support (Chrome 55+, Firefox 54+, Safari 9.1+, Edge 79+). The polygon coordinates can reference CSS custom properties via `calc()` for responsive scaling.

**Alternatives considered**:
- **Separate L-shaped divs**: Rejected — requires new HTML elements, violates SC-003 (element count cap).
- **CSS border-image**: Rejected — cannot express L-shape, cannot animate piecemeal, doesn't support pseudo-elements.
- **SVG clip-path via url()**: Rejected — requires inline SVG definition or external file, more complex than polygon().
- **Two overlapping rectangles per corner**: Rejected — doubles corner element count, pseudo-element budget exceeded.

**clip-path polygon coordinates per corner (desktop, 18px border, 45px arm)**:

| Corner | Polygon |
|--------|---------|
| TL | `polygon(0 0, 45px 0, 45px 18px, 18px 18px, 18px 45px, 0 45px)` |
| TR | `polygon(calc(100% - 45px) 0, 100% 0, 100% 45px, calc(100% - 18px) 45px, calc(100% - 18px) 18px, calc(100% - 45px) 18px)` |
| BL | `polygon(0 calc(100% - 45px), 18px calc(100% - 45px), 18px calc(100% - 18px), 45px calc(100% - 18px), 45px 100%, 0 100%)` |
| BR | `polygon(calc(100% - 45px) calc(100% - 18px), calc(100% - 18px) calc(100% - 18px), calc(100% - 18px) calc(100% - 45px), 100% calc(100% - 45px), 100% 100%, calc(100% - 45px) 100%)` |

**Note**: Using absolute pixel values (from `--frame-border-width` and computed arm length) is more reliable than percentage-based coordinates since the corner element size equals the arm length. With `--frame-corner-size` set to the arm length (45px), the element is 45x45px, and the clip-path carves out the interior 27x27px square.

**Simplified approach**: Since the corner element is exactly `--frame-corner-size` square (which equals the arm length), and the arm width equals `--frame-border-width`, the TL polygon simplifies to:
```
clip-path: polygon(
  0 0,
  100% 0,
  100% var(--frame-border-width),
  var(--frame-border-width) var(--frame-border-width),
  var(--frame-border-width) 100%,
  0 100%
);
```
The other three corners are mirrored versions of this.

## R2: Gauge Positioning on Border Rail

**Decision**: Center gauge on the border rail midline using `left: calc(var(--frame-border-width) / 2 - <gauge-radius>)`.

**Rationale**: At desktop (18px border, 40px gauge), this puts `left: calc(9px - 20px) = -11px`. The gauge extends 11px past the viewport edge (clipped naturally) and 29px into the content area. The brass ring (46%-58% of radius = ~8px ring width) visually overlaps the 18px rail on the inner side, creating a "bolted through" appearance.

**Alternatives considered**:
- **Gauge flush with inner border edge** (`left: 0`): Rejected — gauge center at 20px, too far from rail for "mounted" read.
- **Gauge fully on border** (36px gauge fitting within 18px): Rejected — too small, needle and face tick marks become illegible.
- **New mounting bracket HTML elements**: Rejected — adds DOM elements, violates SC-003.

**Viewport clipping behavior**: The `.frame` element has `position: fixed; inset: 0` with no explicit `overflow`. CSS `contain: layout style` (without `paint`) does NOT clip overflow. The gauge at `left: -11px` will extend 11px past the viewport's left edge. The viewport itself clips this — the outer crescent is invisible. This creates a natural "half-embedded in the wall" look with zero additional CSS.

## R3: Corner Gradient Redesign

**Decision**: Replace radial gradients with opaque directional linear-gradients matching the adjoining edge rails.

**Rationale**: The current radial gradients were designed for a large square ornament with a central highlight. The L-bracket shape has two thin arms — a radial gradient on a thin arm wastes most of its highlight in the clipped-away interior. A linear gradient along each arm's axis (matching the adjoining edge rail's gradient) produces a seamless material join.

**Gradient approach per corner**:
- The base background uses a conic-gradient or two-stop linear gradient that transitions from the horizontal arm's direction to the vertical arm's direction at the elbow.
- A simpler approach: a single `linear-gradient` at the corner's characteristic angle (135deg for TL, 225deg for TR, 45deg for BL, 315deg for BR) — the same angles already used on the current corners. This maintains the per-corner lighting model.
- Key change: eliminate all `transparent` stops. Every stop resolves to an opaque brass tone.

## R4: Rivet Repositioning

**Decision**: Move rivet pseudo-elements from diagonal positions to bracket arm centers.

**Rationale**: Current rivets sit at `top: 10px; left: 10px` (::before) and `bottom: 10px; right: 10px` (::after). On the L-bracket, the ::after position (bottom-right) falls in the clipped-away interior and becomes invisible. Both rivets must be repositioned to visible arm locations.

**New positions (TL corner example)**:
- `::before` — horizontal arm: `top: 3px; left: 28px` (centered on the horizontal arm, 3px from top)
- `::after` — vertical arm: `top: 28px; left: 3px` (centered on the vertical arm, 3px from left)

At the new corner size (45px arms, 18px width), a 10px rivet with 3px inset fits comfortably on each arm.

## R5: Reveal Animation Compatibility

**Decision**: JS review required — fly-in offsets likely need proportional adjustment.

**Research**: The reveal animation in `animations.js` targets corners and gauges by class name (`.frame__corner--tl` etc.) with `gsap.fromTo()` applying `x`/`y` transforms and `scale`. The clip-path is not animated — it is a static mask. The `fromTo` transform translates the entire element (including its clip-path) from an offset position to `x: 0, y: 0`.

**Amendment (Devil's Advocate review)**: The current fly-in offset is ~60px. With corners shrinking from 80px to 45px, a 60px offset is 133% of element size (was 75%). This will look disproportionately exaggerated. The fly-in offset should scale to approximately `0.75 * --frame-corner-size` (i.e., ~34px for desktop). Add a verification/tuning task.

**Gauge animations**: The gauge reveal uses `scale: 0 → 1` and then animates `--needle-angle`. The reduced gauge size (64px → 40px) means the scale animation starts from a smaller base. The needle height (`::after { height: 20px }`) needs to scale down to **14px minimum** (Creative Director review) to maintain the tapered-pointer silhouette. Widen needle base by 1px.

## R6: Review Amendments (Post-Review)

**Safari clip-path prefix**: Add `-webkit-clip-path` alongside unprefixed `clip-path` on all four corners for Safari 9.1-13 compatibility (Front-End Architect).

**Dead border-radius removal**: `clip-path` takes precedence over `border-radius`. Remove per-corner `border-radius` declarations (currently `border-bottom-right-radius: 20px` etc.) — they become invisible dead code (Front-End Architect).

**Box-shadow clipping**: `clip-path` also clips `box-shadow`. The current outer glow (`0 0 20px rgba(200,168,75,0.15)`) will be hard-cut at polygon edges. Accept the hard edge and reduce the glow spread to 8px to minimize the visual impact (Front-End Architect + Technical Artist).

**Arm ratio as CSS variable**: Expose the bracket arm-length multiplier as `--frame-bracket-ratio: 2.5` so it can be visually tuned without recalculating polygon math. Then `--frame-corner-size: calc(var(--frame-border-width) * var(--frame-bracket-ratio))` (Devil's Advocate).

**Explicit overflow clipping on .frame**: Add `clip-path: inset(0)` on `.frame` itself to guarantee clean gauge clipping at the viewport edge rather than relying on implicit viewport clipping which varies by browser compositor (Devil's Advocate). **BUT**: this would clip ALL frame children, including the gauge. The gauge needs to extend past the frame boundary. Alternative: the gauge is already clipped naturally by the viewport on `position: fixed` elements. Document this as a known behavior and test cross-browser.

**3-stop gradient minimum**: Each bracket arm gradient must have at least 3 stops (dark edge → highlight band → dark edge) matching the adjoining edge rail profile for seamless material continuity (Technical Artist).

**Document contain dependency**: Add CSS comment noting that `.frame`'s `contain: layout style` (without `paint`) is required for gauge negative positioning to work. If `paint` is ever added, gauges will be clipped (WebGL Engineer).

**Minimum rivet 8px at tablet**: Even at the 12px arm width, rivets should be at least 8px to maintain the "over-engineered Victorian hardware" read (Creative Director).
