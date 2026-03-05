# Research: Sacred Meander Band

**Feature**: 007-sacred-meander-band
**Date**: 2026-03-05

## R1: Meander Tile Height — Match Border Rail via Custom Property

**Decision**: Replace the hardcoded `--gk-height: 24px` with `--gk-height: var(--frame-border-width)` so the tile height always equals the border rail width (18px desktop, 12px tablet, 8px mobile/hidden).

**Rationale**: The spec requires the band height to equal the rail width at every breakpoint (FR-001). Using the existing `--frame-border-width` custom property eliminates the need for per-breakpoint `--gk-height` overrides — the value cascades automatically. The tablet override (`--gk-height: 16px` at line 1307) can be removed entirely.

**Alternatives considered**:
- **Keep hardcoded per-breakpoint heights**: Rejected — requires manual sync when border width changes, violates the cascading principle established in feature 006.
- **Use a ratio multiplier like corners**: Rejected — the spec explicitly requires 1:1 height-to-rail-width, not a proportional multiplier.

**Impact on SVG tile**: The current 24×24px tile is a 6×6 grid of 4px cells. At 18px, the tile becomes 18×18px — a 6×6 grid of 3px cells. At 12px (tablet), the tile is 12×12px — a 6×6 grid of 2px cells. The SVG viewBox stays at a fixed coordinate system (e.g., `0 0 24 24`) and scales via `background-size: var(--gk-height) var(--gk-height)` — the browser rasterizes at the correct resolution. At 3px cells (desktop), sub-pixel rendering may soften edges slightly vs. the current 4px cells, but the smaller overall height makes this imperceptible.

## R2: Directional Gradient Model — Dual-Orientation with Shared Color Ramp

**Decision**: Use two SVG linearGradient definitions instead of three — one horizontal (id="h", x1=0 y1=0 x2=1 y2=0) for vertical arms and one vertical (id="v", x1=0 y1=0 x2=0 y2=1) for horizontal arms — plus a dark shadow fill for bottom/channel areas. Both gradients share the same three-stop brass color ramp.

**Rationale**: The spec requires a single gradient model with two explicit orientations (FR-002). The current SVG has three gradients (`#h`, `#f`, `#s`) all with identical vertical orientation `x1=0 y1=0 x2=0 y2=1` — only the color stops differ. The fix is:

1. **Gradient "h" (horizontal-arm lighting)**: `x1=0 y1=0 x2=0 y2=1` (top-to-bottom, 90deg) with stops: `#E8D090` (highlight) → `#C8A84B` (face) → `#8B6914` (shadow). Used on horizontal meander arms (top rail, inner hook, lower rail).
2. **Gradient "v" (vertical-arm lighting)**: `x1=0 y1=0 x2=1 y2=0` (left-to-right, 0deg) with stops: `#E8D090` (highlight) → `#C8A84B` (face) → `#8B6914` (shadow). Used on vertical meander arms (descender, inner stem).
3. **Shadow fill "s"**: Flat color `#4A3508` for the bottom rail and deep channel areas where no directional lighting is needed.

**Tile seam analysis**: The meander tile edges are:
- **Left edge**: Bottom rail (rows 4-5, full width) — uses shadow fill, constant color → seamless.
- **Right edge**: Top rail (row 0), descender (row 1), inner hook (row 2) — gradient `h` fills rows 0 and 2 edge-to-edge; row 1 has a 4px descender block that doesn't touch the tile edge → seamless.
- **Top/bottom edges**: Only one tile height, no vertical repetition → not applicable.

**Alternatives considered**:
- **Per-rect gradient instances**: Rejected — bloats SVG, harder to maintain, same visual result.
- **CSS gradient overlay instead of SVG gradients**: Rejected — the meander channels need per-arm gradient direction, which CSS `background-image` layering can't achieve on individual SVG rects.
- **Conic gradient for turns**: Rejected — adds complexity for minimal visual gain on 3px-wide arms.

## R3: Shimmer Animation — Transform-Only on Promoted Layer

**Decision**: Remove `mix-blend-mode: screen` from `.frame__greek-key::before`. The shimmer sweep already uses `transform: translateX()` via the `@keyframes shimmer-slide` animation and has `will-change: transform` for layer promotion. Removing the blend mode is the only change needed — the existing animation mechanism is already compositor-safe.

**Rationale**: The spec requires compositor-safe animation using only transform and opacity (FR-003). The current implementation already uses `transform: translateX()` in the keyframes and `will-change: transform` for promotion. The single performance problem is `mix-blend-mode: screen` — this forces the compositor to fall back to main-thread compositing because blend modes require pixel-level composition with the underlying layer. Removing it and relying on the shimmer gradient's own opacity stops (`rgba(232,208,144,0.4)` peak) produces a visually similar highlight sweep without blending.

**Visual impact**: Without `screen` blending, the shimmer will appear slightly less bright at its peak (the additive lightening effect is lost). However, the shimmer gradient already uses semi-transparent white-gold stops that produce a convincing highlight sweep. The visual difference is negligible at the shimmer's 4-second cycle speed.

**Also remove**: `mix-blend-mode: multiply` from `.frame__greek-key::after` (brushed grain overlay). While this pseudo-element is not animated, the blend mode still defeats compositor promotion of the parent element's paint layer. Replace with `opacity: 0.5` on the grain overlay — the repeating-linear-gradient already uses near-transparent stops (`rgba(0,0,0,0.04)`) so the visual difference is minimal, and the grain darkening effect is preserved via the gradient's own color values.

**Alternatives considered**:
- **mask-image animation**: Rejected — `mask-position` animation is not compositor-safe in all browsers (Chrome promotes, Firefox/Safari may not).
- **backdrop-filter approach**: Rejected — not widely supported, requires paint containment that may conflict with the band's `overflow: hidden`.
- **Separate shimmer element (not pseudo)**: Rejected — adds DOM element, violates FR-010.

## R4: Endpoint Masks — Gradient Fade via Background Layering

**Decision**: Add left and right fade-out gradient masks as additional `background-image` layers on the `.frame__greek-key` element itself, using `background-position` and `background-size` tied to the existing layout. No new elements or pseudo-elements.

**Rationale**: The spec requires fixed-position endpoint masks that fade partial tiles to the background color, tied to `--frame-corner-size` (FR-004). The band element already has two pseudo-elements in use (::before for shimmer, ::after for grain). Adding mask layers as additional CSS background images avoids the element count constraint.

**Implementation approach**:
```
background:
  /* Left fade mask — 1 tile-width gradient from background color to transparent */
  linear-gradient(90deg, var(--color-brass-dark) 0%, transparent 100%)
    no-repeat 0 0 / var(--gk-height) 100%,
  /* Right fade mask — mirror of left */
  linear-gradient(270deg, var(--color-brass-dark) 0%, transparent 100%)
    no-repeat right 0 / var(--gk-height) 100%,
  /* Meander tile — repeating */
  url("data:image/svg+xml,...") repeat-x 0 0 / var(--gk-height) var(--gk-height),
  /* Channel fill fallback */
  var(--color-brass-dark);
```

The fade masks are `var(--gk-height)` wide (one tile width), positioned at left:0 and right:0. Since the band itself is positioned at `left: var(--frame-corner-size); right: var(--frame-corner-size)`, the masks automatically track the corners. When the viewport resizes, the band width changes but the masks stay pinned to the edges — partial tiles at either end fade smoothly into the background.

**Alternatives considered**:
- **CSS mask-image**: Rejected — requires `-webkit-` prefix for Safari, adds complexity, and `mask-composite` behavior differs across browsers.
- **Clip-path on band**: Rejected — would also clip the shimmer and grain overlays.
- **JavaScript tile count calculation**: Rejected — spec explicitly prohibits dynamic tile-count calculations and JS changes.
- **Using ::before/::after for masks**: Rejected — both pseudo-elements are already in use (shimmer + grain).

## R5: SVG Tile Redesign — Meander Grid at 24-Unit Coordinate System

**Decision**: Keep the SVG viewBox at `0 0 24 24` (6×6 grid of 4-unit cells) for authoring clarity, but render at `var(--gk-height) × var(--gk-height)` via CSS `background-size`. The meander pattern topology (which cells are brass, which are channel) remains identical.

**Rationale**: Using a fixed coordinate system decouples the pattern design from the render size. The SVG scales cleanly because it uses only `<rect>` elements with integer coordinates. At 18px render (desktop), each 4-unit cell maps to 3 device pixels. At 12px render (tablet), each 4-unit cell maps to 2 device pixels. Both produce clean integer-pixel edges.

**Channel edge lines**: The current SVG includes 3 thin `<rect>` elements for carved-channel edge shadows (1px wide, low opacity). These must be updated to use SVG coordinate units (e.g., `height="1"` in a 24-unit viewBox scales to 0.75px at 18px render). At sub-pixel widths, these will appear as antialiased hairlines — visually correct for carved channels. If they disappear at tablet size (0.5px), that's acceptable since the channels are already less visible at 12px height.

**Alternatives considered**:
- **Resize SVG viewBox to match render size**: Rejected — requires different SVGs per breakpoint, breaks the custom-property cascade.
- **Use CSS gradients instead of SVG**: Rejected — CSS gradients cannot express the L-shaped meander hooks with per-arm directional lighting.

## R6: Box-Shadow Adjustment

**Decision**: Reduce box-shadow spread and intensity proportionally to the smaller band height. At 18px (down from 24px), the current `0 0 2px` inner shadow is disproportionately large.

**Rationale**: The current desktop box-shadow:
```
inset 0 1px 1px rgba(200,168,75,0.3),  /* top highlight */
inset 0 -1px 1px rgba(0,0,0,0.4),      /* bottom shadow */
inset 0 0 2px rgba(0,0,0,0.25),         /* general darkening */
0 1px 2px rgba(0,0,0,0.5)              /* drop shadow */
```
...was tuned for a 24px element. At 18px, the 2px inner spread covers 11% of the height (was 8%). Reduce to `1px` spread on the inner shadow and `1px` on the drop shadow to maintain proportional depth.

The tablet override (lines 1308-1312) can be simplified — if box-shadow values work proportionally at 18px, they'll work at 12px without a separate override.
