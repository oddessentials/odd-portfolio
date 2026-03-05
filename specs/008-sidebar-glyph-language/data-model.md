# Data Model: Sidebar Glyph Language

**Feature**: 008-sidebar-glyph-language | **Date**: 2026-03-05
**Updated**: 2026-03-05 (post-review fixes: atlas 512x256, corrected UV math, tier 3 normals dropped, reveal timing, GPU detection, a11y notes)

## Entities

### 1. Project (extended)

Extends the existing `PROJECTS` array in `js/data.js` with glyph fields.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Existing -- project identifier |
| name | string | yes | Existing -- display name |
| glyphName | string | yes | NEW -- Glyph archetype name: "architect", "guardian", "voyager", "sovereign", "origin", "orbit", "axis", "spiral" |
| glyphRotation | number | yes | NEW -- Rotation in degrees: 0, 90, 135, 180, 270 (for full rotations); 0 for derived glyphs |
| glyphType | string | yes | NEW -- "full" (rotated OE logo) or "derived" (Orbit/Axis/Spiral) |
| glyphAtlasIndex | number | yes | NEW -- Cell index 0-7 in the MSDF atlas grid |

**Project-to-Glyph Mapping** (from FR-002):

| Project | glyphName | glyphRotation | glyphType | glyphAtlasIndex |
|---------|-----------|---------------|-----------|-----------------|
| odd-ai-reviewers | guardian | 90 | full | 1 |
| ado-git-repo-insights | voyager | 180 | full | 3 |
| repo-standards | axis | 0 | derived | 6 |
| odd-self-hosted-ci | orbit | 0 | derived | 5 |
| odd-map | origin | 0 | full | 4 |
| odd-fintech | sovereign | 270 | full | 2 |
| coney-island | architect | 135 | full | 0 |

### 2. Glyph Atlas Cell

Defines the UV mapping for each glyph in the 4x2 MSDF atlas.

| Field | Type | Description |
|-------|------|-------------|
| index | number (0-7) | Cell position in the atlas |
| gridCol | number (0-3) | Column in 4x2 grid |
| gridRow | number (0-1) | Row in 4x2 grid |
| uvMin | vec2 | Bottom-left UV coordinate (with guard padding, in atlas-global UV space) |
| uvMax | vec2 | Top-right UV coordinate (with guard padding, in atlas-global UV space) |

**Atlas Layout: 512x256, 4x2 grid, 128x128 square cells, 4px guard**

Cell dimensions: 128x128 px. Atlas dimensions: 512 wide x 256 tall.
- Cell width in UV: 128/512 = 0.25
- Cell height in UV: 128/256 = 0.5
- Guard padding in UV: 4/512 = 0.0078125 (horizontal), 4/256 = 0.015625 (vertical)

| Index | Name | Grid (col, row) | Cell UV Origin | UV Min (padded) | UV Max (padded) |
|-------|------|-----------------|----------------|-----------------|-----------------|
| 0 | Architect (135) | (0, 0) | (0.0, 0.0) | (0.0078, 0.0156) | (0.2422, 0.4844) |
| 1 | Guardian (90) | (1, 0) | (0.25, 0.0) | (0.2578, 0.0156) | (0.4922, 0.4844) |
| 2 | Sovereign (270) | (2, 0) | (0.5, 0.0) | (0.5078, 0.0156) | (0.7422, 0.4844) |
| 3 | Voyager (180) | (3, 0) | (0.75, 0.0) | (0.7578, 0.0156) | (0.9922, 0.4844) |
| 4 | Origin (0) | (0, 1) | (0.0, 0.5) | (0.0078, 0.5156) | (0.2422, 0.9844) |
| 5 | Orbit (ring) | (1, 1) | (0.25, 0.5) | (0.2578, 0.5156) | (0.4922, 0.9844) |
| 6 | Axis (stem) | (2, 1) | (0.5, 0.5) | (0.5078, 0.5156) | (0.7422, 0.9844) |
| 7 | Spiral (arc) | (3, 1) | (0.75, 0.5) | (0.7578, 0.5156) | (0.9922, 0.9844) |

**Coordinate space notes**:
- `cellSize = vec2(0.25, 0.5)` in atlas-global UV space (cell width = 128/512, cell height = 128/256)
- Cell offset formula: `vec2(mod(index, 4.0), floor(index / 4.0)) * cellSize`
- Guard padding prevents cross-cell bleeding during bilinear sampling
- `screenPxRange` denominator = 128.0 (cell size, NOT atlas size) since pxRange 4 was baked per-glyph at 128x128
- `uTexelSize` for finite-difference normal sampling = 1.0/512.0 (atlas-global UV space, horizontal) — NOTE: all 4 finite-difference offset samples MUST also be clamped within the cell's guard-padded bounds to prevent cross-cell normal artifacts

**MSDF quality gate for derived glyphs**: Orbit ring and Spiral arc have thin annular fill regions (~16px in 128x128 cells). After msdfgen generation, each derived glyph MUST be rendered at 33px target size and visually verified for interior distance field collapse. Fallback: reduce pxRange from 4 to 2 for problematic glyphs, or thicken stroke from S to 1.5*S.

### 3. Odd Bot State

The Odd Bot is a decorative HTML element (inline SVG, `aria-hidden="true"`) in the right sidebar. It is SEPARATE from the Architect watermark (which is a large faint glyph in the WebGL overlay). The Odd Bot is a ~40x40px rotatable icon; the watermark is a large background glyph at 6-8% opacity rendered by the shader.

| Field | Type | Description |
|-------|------|-------------|
| currentRotation | number | Current CSS rotation in degrees |
| targetRotation | number | Target rotation from zone-change event |
| defaultRotation | number | 135 (Architect) |

**Zone-to-Rotation Mapping**:

| Zone Index | Zone Name | Odd Bot Rotation | Glyph Name |
|------------|-----------|-----------------|------------|
| -1 | No zone (top) | 135 | Architect |
| 0 | DevOps Pipeline | 90 | Guardian |
| 1 | Products & Analytics | 180 | Voyager |
| 2 | Community & Web | 270 | Sovereign |

**HTML placement**: Insert after `.status-readout` and before the closing `</aside>` of `#status-panel`. Use `position: absolute` with `bottom` and centering so it sits behind/below the telemetry without affecting flex layout. `transform-origin: center center`.

**Priority rule**: zone-change always wins and cancels any in-progress hold-and-return via `gsap.killTweensOf()`. The terminal-scan-complete hold (2s at Sovereign before returning to Architect) is interruptible by zone-change events.

### 4. Sidebar Shader Uniforms (new/modified)

| Uniform | Type | Default | Purpose |
|---------|------|---------|---------|
| uMsdf | sampler2D | atlas texture | Replaces single-glyph texture |
| uTime | float | 0.0 | Existing -- elapsed seconds |
| uResolution | vec2 | (1, 1) | Existing -- sidebar pixel dimensions |
| uBreathingEnabled | float | 1.0 / 0.0 | Existing -- reduced motion check |
| uScanProgress | float | 0.0 | NEW -- scan-line sweep position (0..1), event-triggered. Shader MUST guard with `if (uScanProgress > 0.0 && uScanProgress < 1.0)` for zero idle cost (coherent uniform branch). |
| uHoverUV | vec2 | (-1, -1) | NEW -- hover brightening center. Use `gsap.quickTo()` for tween (0.15s enter, 0.25s leave). Reset to (-1,-1) sentinel on layout invalidation. |
| uScrollProgress | float | 0.0 | NEW -- scroll-driven marginalia offset. Feed via exported setter from glyph-compositor, called by scroll-zones.js (no CustomEvent dispatch per frame). |
| uRevealProgress | float | 0.0 | NEW -- reveal wipe progress (0..1). Tween starts at t=2.2s, 0.5s duration, completes t=2.7s (before terminal scan at t=2.8s). |
| uTexelSize | float | 1.0/512.0 | MODIFIED -- atlas-global horizontal UV space. For normal perturbation offsets. |
| uTierLevel | float | 1.0 | NEW -- performance tier for shader branching. Set to 2.0 at init on integrated GPUs via WEBGL_debug_renderer_info detection. |
| uHighContrastHide | float | 0.0 | NEW -- 1.0 when prefers-contrast:more active. |

**Removed uniforms**: `uShimmerEnabled` (shimmer animation removed entirely per FR-012), `uScanLineEnabled` (replaced by uScanProgress event-triggered approach).

### 5. Mana Meter Disposition

The `<meter class="mana-meter">` element (index.html line 146) is RETAINED with its label changed from "MANA" to "phi DRIFT". The meter's green gradient fill (`#4ADE80` in CSS) MUST be changed to a gold-brass tone (`var(--color-brass-mid)` or similar) to comply with FR-023's gold-brass-only sidebar palette. The CSS rules at styles.css lines 882-910 must be updated.

## State Transitions

### Odd Bot Rotation FSM

```
[Page Load] → Architect (135)
    │
    ├── zone-change(0) → Guardian (90)
    ├── zone-change(1) → Voyager (180)
    ├── zone-change(2) → Sovereign (270)
    ├── zone-change(-1) → Architect (135)
    │
    └── terminal-scan-complete → Sovereign (270) [hold 2s] → Architect (135)
        (interruptible: zone-change cancels via killTweensOf)
```

Transition: 0.6s `elastic.out(1, 0.5)`. Debounce: `gsap.killTweensOf()` on new event during active tween.

### Performance Tier Shader Branching

```
Tier 1 (Full):     All effects active (~145 ALU). Normal perturbation ON.
                    NOTE: May be discrete-GPU-only if integrated GPUs cannot sustain.
Tier 2 (Medium):   Drop uScrollProgress + complex arcs, instant hover (~113 ALU).
                    Normal perturbation ON. Scan-line event-guarded.
Tier 3 (Low):      Static glyphs only, flat shading (NO normal perturbation),
                    all animations disabled (~60 ALU). Edge highlight retained.
```

**Integrated GPU detection** (at init, before first render):
1. Query `WEBGL_debug_renderer_info` for unmasked renderer string
2. If matches Intel Iris/UHD/HD Graphics or AMD Radeon Graphics (APU): set Tier 2 as default
3. Post-reveal benchmark can promote to Tier 1 if avg frame time <14ms (stricter than 20ms demotion threshold, providing hysteresis)
4. If debug extension unavailable: fall back to benchmark-only detection (current behavior)

### Reduced Motion State

```
prefers-reduced-motion: reduce
  → uBreathingEnabled = 0.0
  → uScanProgress frozen (no event-triggered sweeps)
  → uHoverUV: instant gsap.set() (no tween, same brightness magnitude)
  → uScrollProgress = 0.0 (locked)
  → uRevealProgress = 1.0 (instant, no wipe)
  → Odd Bot rotation: instant gsap.set() (no elastic)
  → Odd Bot terminal-scan-complete: 2s hold RETAINED (state duration, not motion); rotations instant
  → Inline SVG glyph hover scale: gsap.set(glyph, {scale: 1.2}) on enter, gsap.set(glyph, {scale: 1}) on leave (no eased transition)
```

### High Contrast State

```
prefers-contrast: more
  → Detected via matchMedia('(prefers-contrast: more)') in app.js
  → Runtime change listener registered (addEventListener('change', ...))
  → uHighContrastHide = 1.0
  → leftPlane.visible = false
  → rightPlane.visible = false
  → All WebGL sidebar overlay hidden
  → HTML nav content remains visible
  → Toggles on/off at runtime without page reload
```

### Combined Preference State

```
prefers-reduced-motion + prefers-contrast: more (both active)
  → High contrast takes precedence for WebGL overlay (planes hidden, subsumes all shader behavior)
  → Reduced motion applies to all remaining DOM animations:
    - Odd Bot rotation: instant gsap.set()
    - Inline SVG glyph scale: instant gsap.set()
    - CSS transitions: zero-duration
```

## Complete Text Change Map

All hardcoded string references that must change across the codebase:

| File | Line(s) | Current | New |
|------|---------|---------|-----|
| index.html | 145 | `MANA` | `phi DRIFT` |
| index.html | 148 | `PHASE` | `ORBITAL PHASE` |
| index.html | (new) | -- | `phi = 1.6180339887` (new status line) |
| terminal.js | 21 | `'7 systems nominal'` | `'7 Constellations Active'` |
| terminal.js | 22 | `'[##########] 100%'` | `'phi Alignment: Stable'` |
| terminal.js | 26 | `'PORTFOLIO READY'` | `'GOLDEN RATIO LOCKED'` |
| terminal.js | 52 | `'Scanning ' + project.id` | `'Charting ' + project.constellation` |
| terminal.js | 67 | `'7 systems nominal'` | `'7 Constellations Active'` |
| terminal.js | 72 | `'[##########] 100%'` | `'phi Alignment: Stable'` |
| terminal.js | 78 | `'PORTFOLIO READY'` | `'GOLDEN RATIO LOCKED'` |
| app.js | 57 | `'PORTFOLIO READY'` | `'GOLDEN RATIO LOCKED'` |
| app.js | 133 | `'PORTFOLIO READY'` (guard) | `'GOLDEN RATIO LOCKED'` |
| app.js | 138 | `'PORTFOLIO READY'` (guard) | `'GOLDEN RATIO LOCKED'` |
| app.js | 139 | `'PORTFOLIO'` (fallback) | `'phi LOCKED'` |
| scroll-zones.js | 206 | `'PORTFOLIO'` (no-zone reset) | `'phi LOCKED'` |

**Note**: The word "phi" MUST be rendered as ASCII Latin text, not Unicode U+03C6 (φ), for screen reader compatibility.

## Inline SVG Implementation Notes

- All inline SVG glyph elements MUST use `fill="currentColor"` on their path/circle elements to inherit CSS color from the `.glyph` selector
- The existing `.glyph` CSS rule's `text-shadow` MUST be replaced with `filter: drop-shadow(0 0 6px var(--color-brass-light))` (text-shadow has no effect on SVG)
- Add `transition: filter var(--dur-fast) ease` for hover animation
- Both the wrapper `<span class="glyph" aria-hidden="true">` AND the inner `<svg aria-hidden="true">` must have aria-hidden (defense-in-depth)
- On mobile, the fixed `width="20" height="20"` on SVGs is intentional; the button min-height of 52px provides adequate touch target
- The `orb-fallback` image (index.html line 156) must also be updated to the new logo path

## Scroll-Progress Bridging

The glyph-compositor.js module exports a `setScrollProgress(progress)` setter function. scroll-zones.js calls this setter directly inside `handleScrollProgress()` — no CustomEvent dispatch per frame (avoids 60 events/second overhead). This creates an import dependency: scroll-zones.js imports from glyph-compositor.js.
