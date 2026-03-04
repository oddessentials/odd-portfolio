# Technical Artist (Shaders & Materials) -- Beta 0.1.0 Review

## 1. Greek Key Pattern Design

### Current Implementation Analysis

The top border is `.frame__edge--top` (lines 358-371 of `styles.css`):

- **Positioning**: `top: 0`, stretches between corners via `left/right: var(--frame-corner-size)`.
- **Height**: `var(--frame-border-width)` -- **18px desktop**, 12px tablet, 8px mobile.
- **Background**: Horizontal brass gradient (`--color-brass-dark` -> `--color-brass-mid` -> `--color-brass-light` -> reverse).
- **Box-shadow**: Inset highlights top (white 15%) and bottom (black 50%), outer dark shadow.
- **Pseudo-element `::after`**: A 1px engraving line centered at 50% height with brass highlight shadow.

The `.frame__rune-band` (lines 524-546) sits directly below the top edge at `top: var(--frame-border-width)` and uses a `repeating-linear-gradient` with 16px period to create a repeating vertical-bar motif. This is the **rivet strip** referenced in the request.

### CSS-Only Greek Key Approach

A Greek key (meander) can be built entirely from CSS `background` layering of `linear-gradient` strips. The fundamental unit cell of a Greek key is a square tile that tiles horizontally. At 18px height, each tile is 18x18px, producing the recognizable right-angle spiral.

#### Technique: Multi-stop `linear-gradient` stacking

The Greek key pattern is composed of horizontal and vertical line segments within a repeating tile. We construct it as a stack of `linear-gradient` layers, each drawing one bar of the meander:

```css
.frame__rune-band {
  position: absolute;
  top: var(--frame-border-width);
  left: var(--frame-corner-size);
  right: var(--frame-corner-size);
  height: 18px;
  background:
    /* === Greek Key Unit Cell (36px period = two mirrored 18px half-cells) === */

    /* Bottom horizontal bar — runs full width of each cell */
    linear-gradient(
      to bottom,
      transparent 0px, transparent 14px,
      var(--color-brass-mid) 14px, var(--color-brass-mid) 18px
    ),

    /* Top horizontal bar — runs full width of each cell */
    linear-gradient(
      to bottom,
      var(--color-brass-mid) 0px, var(--color-brass-mid) 4px,
      transparent 4px
    ),

    /* Right vertical bar (first half-cell) */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 14px,
      var(--color-brass-mid) 14px,
      var(--color-brass-mid) 18px,
      transparent 18px,
      transparent 36px
    ),

    /* Left vertical bar (second half-cell, offset) */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 18px,
      var(--color-brass-mid) 18px,
      var(--color-brass-mid) 22px,
      transparent 22px,
      transparent 36px
    ),

    /* Inner horizontal steps */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 4px,
      var(--color-brass-dark) 4px,
      var(--color-brass-dark) 14px,
      transparent 14px,
      transparent 36px
    ),

    /* Base fill for depth */
    linear-gradient(
      to bottom,
      var(--color-brass-dark) 0%,
      rgba(74, 53, 8, 0.3) 100%
    );

  background-size: 36px 18px;
  background-repeat: repeat-x;
}
```

However, this stacking approach becomes fragile with many layers. A more robust and readable approach uses **two pseudo-elements with `border` + `outline` clipping**, but that violates CSS-only purity for complex meanders. The recommended production approach is:

#### Recommended: SVG Data URI in `background-image`

While still procedural (no external image file), an inline SVG data URI produces a crisp, scalable Greek key with full metallic gradient control:

```css
.frame__rune-band {
  position: absolute;
  top: var(--frame-border-width);
  left: var(--frame-corner-size);
  right: var(--frame-corner-size);
  height: 18px;
  overflow: hidden;

  /* Greek key via inline SVG — procedural, no external file */
  background-image: url("data:image/svg+xml,..."); /* see SVG spec below */
  background-size: 36px 18px;
  background-repeat: repeat-x;

  /* Metallic sheen overlay */
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    inset 0 -1px 2px rgba(0, 0, 0, 0.5),
    0 1px 3px rgba(0, 0, 0, 0.4);
}
```

**However**, the constitution's procedural-first principle says "No images." A data URI SVG is borderline -- it is procedural (generated in code, no file) but technically uses `url()`. The purest CSS-only approach is the multi-gradient stack above. I recommend clarifying this with the team lead.

#### Pure CSS Recommended Implementation

The cleanest CSS-only Greek key uses `repeating-linear-gradient` for the structure and a positioned `::before` for the metallic shimmer:

```css
.frame__rune-band {
  position: absolute;
  top: var(--frame-border-width);
  left: var(--frame-corner-size);
  right: var(--frame-corner-size);
  height: 18px;
  overflow: hidden;

  /*
   * Greek key via CSS gradients.
   * Unit cell: 36px wide x 18px tall (two mirrored 18px halves).
   * Line weight: 3px (scales proportionally at smaller breakpoints).
   *
   * Visual structure per 36px tile:
   *   ___________
   *  |  _     _  |
   *  | | |   | | |
   *  | |_|   |_| |
   *  |___________|
   *
   * Built from 6 gradient layers:
   *   1. Top bar (full width, 3px)
   *   2. Bottom bar (full width, 3px)
   *   3. Left descender per half-cell
   *   4. Right descender per half-cell
   *   5. Inner bottom bar (connecting descenders)
   *   6. Inner top bar (connecting descenders, offset half-cell)
   */

  --gk-line: 3px;
  --gk-color-face: var(--color-brass-mid);
  --gk-color-shadow: var(--color-brass-dark);
  --gk-color-highlight: var(--color-brass-light);
  --gk-cell: 36px;

  background:
    /* Layer 1 — Top horizontal bar */
    repeating-linear-gradient(
      to bottom,
      var(--gk-color-face) 0px,
      var(--gk-color-face) var(--gk-line),
      transparent var(--gk-line),
      transparent 18px
    ),

    /* Layer 2 — Bottom horizontal bar */
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 15px,
      var(--gk-color-face) 15px,
      var(--gk-color-face) 18px
    ),

    /* Layer 3 — Right-side vertical segments (first half-cell) */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 15px,
      var(--gk-color-face) 15px,
      var(--gk-color-face) 18px,
      transparent 18px,
      transparent var(--gk-cell)
    ),

    /* Layer 4 — Left-side vertical segments (second half-cell) */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 18px,
      var(--gk-color-face) 18px,
      var(--gk-color-face) 21px,
      transparent 21px,
      transparent var(--gk-cell)
    ),

    /* Layer 5 — Inner horizontal connectors (step bottoms) */
    repeating-linear-gradient(
      to right,
      transparent 0px,
      transparent 3px,
      var(--gk-color-shadow) 3px,
      var(--gk-color-shadow) 15px,
      transparent 15px,
      transparent var(--gk-cell)
    ),

    /* Base: dark iron background for engraved channel illusion */
    var(--color-iron);

  background-size: var(--gk-cell) 18px;
  background-repeat: repeat-x;

  /* Engraved depth shadow */
  box-shadow:
    inset 0 1px 1px rgba(200, 168, 75, 0.25),
    inset 0 -1px 2px rgba(0, 0, 0, 0.6),
    0 1px 3px rgba(0, 0, 0, 0.5),
    0 0 6px rgba(122, 255, 178, 0.06);
}
```

### Shimmer Animation

A translucent highlight gradient slides across the Greek key band, simulating light catching the brass engravings:

```css
.frame__rune-band::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    transparent 35%,
    rgba(232, 208, 144, 0.15) 45%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(232, 208, 144, 0.15) 55%,
    transparent 65%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: greek-key-shimmer 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes greek-key-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- **Duration**: 8s (slow, ambient -- not distracting).
- **Easing**: `ease-in-out` for natural acceleration at edges.
- **Colors**: `rgba(232, 208, 144, 0.15)` matches the brass highlight tone from `.frame__corner--tl`'s radial gradient.
- **Angle**: 105deg gives a diagonal sweep that reads as directional light.
- **`prefers-reduced-motion`**: Already handled by the global `animation-duration: 0.01ms !important` rule at line 1242.

### Responsive Scaling

At tablet (`--frame-border-width: 12px`) and mobile (`8px`), the rune band height should scale proportionally:

```css
@media (max-width: 1199px) {
  .frame__rune-band {
    height: 12px;
    --gk-line: 2px;
    --gk-cell: 24px;
  }
}

@media (max-width: 767px) {
  .frame__rune-band {
    height: 8px;
    --gk-line: 2px;
    --gk-cell: 16px;
  }
}
```

At 8px mobile height, the meander becomes quite small. Consider hiding it entirely below 480px if it loses legibility:

```css
@media (max-width: 480px) {
  .frame__rune-band {
    display: none;
  }
}
```

---

## 2. Terminal Visual Enhancement

### Current State

The right sidebar (`#status-panel`) contains static `<p class="status-line">` elements with JetBrains Mono text in `--color-text-mono` (#7fffb3). The "scanning systems..." text is plain uppercase monospace with no animation or visual enhancement.

### CRT Scanline Effect

Apply a repeating horizontal line pattern over the status panel to simulate CRT monitor scanlines:

```css
#status-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  pointer-events: none;
  z-index: 1;
}
```

**Note**: This uses the existing `::before` for the brass accent bar (line 711-726), so the scanlines must go on `::after`.

### Phosphor Text Glow

The `.status-line` text should have a subtle green phosphor glow matching the `--color-text-mono` tone:

```css
.status-line {
  text-shadow:
    0 0 4px rgba(127, 255, 179, 0.4),
    0 0 8px rgba(127, 255, 179, 0.15);
}
```

### Terminal Loading Animation

The "scanning systems..." line should be animated with a typing effect. Since GSAP TextPlugin is already loaded, this is best handled in JavaScript:

```js
// In app.js init sequence
const scanLine = document.querySelector('.status-line:nth-child(2)');
if (scanLine) {
  gsap.fromTo(scanLine,
    { text: '' },
    { text: 'scanning systems...', duration: 1.2, ease: 'none', delay: 0.5 }
  );
}
```

Additionally, a blinking cursor pseudo-element on the active line:

```css
.status-line--active::after {
  content: '\2588'; /* full block character */
  color: var(--color-text-mono);
  animation: blink-cursor 1s step-end infinite;
  margin-left: 2px;
}
```

This reuses the existing `blink-cursor` keyframe (line 861).

### Flicker Effect on Panel Load

A brief CRT power-on flicker when the page loads, simulating a monitor warming up:

```css
@keyframes crt-flicker {
  0%   { opacity: 0; }
  5%   { opacity: 0.8; }
  10%  { opacity: 0.2; }
  15%  { opacity: 0.9; }
  20%  { opacity: 0.4; }
  30%  { opacity: 1; }
  100% { opacity: 1; }
}

#status-panel .status-readout {
  animation: crt-flicker 1.5s ease-out forwards;
}
```

### Mana Meter Enhancement

The mana meter bar (lines 743-771) could pulse subtly to suggest it is "live":

```css
@keyframes mana-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.7; }
}

.mana-meter::-webkit-meter-optimum-value {
  animation: mana-pulse 3s ease-in-out infinite;
}
```

---

## 3. Spec Recommendations

### Functional Requirements -- Greek Key Pattern

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-B001 | Replace `.frame__rune-band` repeating-linear-gradient rivet pattern with a CSS-only Greek key (meander) pattern using stacked `linear-gradient` / `repeating-linear-gradient` layers. No external image files or SVG data URIs. | P0 |
| FR-B002 | Greek key must use existing brass palette variables (`--color-brass-light`, `--color-brass-mid`, `--color-brass-dark`) for the pattern face, with `--color-iron` as the engraved channel background. | P0 |
| FR-B003 | Greek key pattern tile must repeat seamlessly at 36px period (desktop), 24px (tablet), 16px (mobile). Line weight scales: 3px desktop, 2px tablet/mobile. | P1 |
| FR-B004 | Shimmer overlay animation on `.frame__rune-band::before` -- translucent brass highlight sweeps left-to-right over 8 seconds, `ease-in-out`, infinite loop. Respects `prefers-reduced-motion`. | P1 |
| FR-B005 | Greek key band height matches `--frame-border-width` at each breakpoint (18px, 12px, 8px). Hidden below 480px viewport width if legibility is insufficient. | P1 |
| FR-B006 | Engraved depth effect via `box-shadow`: inset top highlight (brass, 0.25 opacity), inset bottom shadow (black, 0.6), outer shadow for depth. | P2 |

### Functional Requirements -- Terminal Visual Enhancement

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-B007 | CRT scanline overlay on `#status-panel` via `::after` pseudo-element. 4px period repeating horizontal lines at 8% black opacity. `pointer-events: none`. | P2 |
| FR-B008 | Phosphor text glow on `.status-line` elements. `text-shadow` with two layers of `rgba(127, 255, 179)` at 0.4 and 0.15 opacity, 4px and 8px blur respectively. | P2 |
| FR-B009 | "scanning systems..." line animated via GSAP TextPlugin typing effect. Duration 1.2s, delay 0.5s after page load. Respects `prefers-reduced-motion` (instant if reduced). | P1 |
| FR-B010 | CRT power-on flicker animation on `.status-readout` container. 1.5s `ease-out`, opacity keyframes simulating monitor warm-up. Runs once on load. | P2 |
| FR-B011 | Blinking block cursor (`\2588`) appended via `::after` pseudo-element on the actively-typing status line. Reuses existing `blink-cursor` keyframe. | P2 |
| FR-B012 | Mana meter optimum-value bar pulses opacity between 1.0 and 0.7 on a 3s cycle. CSS-only animation. | P3 |

### Non-Functional / Constraints

| ID | Constraint |
|----|------------|
| NF-B001 | All visual effects must be CSS-only or use existing GSAP infrastructure. No new JS libraries. |
| NF-B002 | Greek key pattern must not add any DOM elements beyond existing `.frame__rune-band` and its pseudo-elements. |
| NF-B003 | All animations respect `prefers-reduced-motion: reduce` (global rule at line 1240 handles CSS; JS animations must check `window.matchMedia`). |
| NF-B004 | Terminal effects must not increase the draw call budget or WebGL resource usage. All terminal effects are CSS/DOM only. |
| NF-B005 | Shimmer animation `will-change: background-position` should be applied only during animation to avoid unnecessary GPU layer creation. |

### Implementation Notes

1. **No HTML changes needed** for the Greek key. The existing `.frame__rune-band` div is already in `index.html` (line 73). Only CSS changes in `styles.css`.

2. **Terminal enhancement** requires minimal JS: one GSAP TextPlugin call for the typing animation (in `app.js` init). All other effects are pure CSS additions to `styles.css`.

3. **Performance impact**: Zero. All effects are CSS-only (composited by GPU). No shader changes, no Three.js modifications, no additional draw calls.

4. **Post-processing pipeline** (`performance.js`): No changes needed. The Greek key and terminal effects are entirely in the DOM/CSS layer, orthogonal to the WebGL pipeline.

5. **Scene shaders** (`scene.js`): No changes needed. The VignetteShader, bloom pass, and nebula materials are unaffected.
