# Research: Sidebar Glyph Language

**Feature**: 008-sidebar-glyph-language | **Date**: 2026-03-05

## R1: MSDF Atlas Pipeline for Multi-Glyph Texture

**Decision**: Use msdfgen CLI to generate individual 128x128 MSDF PNGs per glyph, then composite into a **512x256** atlas (4x2 grid, 128x128 square cells) using ImageMagick montage or Python PIL.

**Rationale**: msdfgen operates on individual SVGs. Multi-glyph atlases require post-composition. The 512x256 target provides 128x128 per cell -- ample for the existing `screenPxRange = 4.0` anti-aliasing at sidebar tile sizes (~33px). At ~33px rendered, `screenPxRange = 4.0 * 33 / 128 = 1.03`, clearing the minimum ~1.0 threshold. The current single-glyph 256x256 texture is ~192KB uncompressed (RGB). The new 512x256 RGB atlas is ~384KB, bringing total texture memory to ~900KB -- under the 1MB soft limit. NOTE: `screenPxRange` denominator in the shader MUST use 128.0 (cell size), not 512.0 (atlas width). `uTexelSize` for finite-difference normal sampling uses 1.0/512.0 (atlas-global UV space). All 4 finite-difference offset samples MUST be clamped within cell guard-padded bounds.

**Derived glyph quality gate**: Orbit ring and Spiral arc produce thin annular fill regions (~16px in 128x128 cells). Distance field ramps from opposite edges may overlap. After msdfgen, render each derived glyph at 33px target size and visually verify no interior collapse. Fallback: reduce pxRange from 4 to 2, or thicken from S to 1.5*S.

**Alternatives considered**:
- msdf-atlas-gen (auto-packs multiple glyphs): More complex tooling, not needed for only 8 glyphs with known layout
- 256x256 atlas (64x64 per cell): Risk of insufficient MSDF quality for the Spiral derived glyph (thin open curve). Rejected as primary; kept as fallback.
- Procedural SDF in shader (no texture): Would require ~80 lines of GLSL for 8 shape unions plus analytic normals. The existing carved-brass effect relies on texture-sampled finite differences for normal perturbation. Rejected due to shader complexity and loss of visual quality.

## R2: Stroke-to-Fill SVG Conversion for msdfgen Compatibility

**Decision**: Convert all stroked SVG elements to filled paths using the annular path technique: outer arc at R0, inner arc at Ri, closed with evenodd fill-rule. The Python generator script (`oe_logo_flipped_rotated.py`) will be extended with a `--filled` flag, or conversion will be done via manual SVG editing.

**Rationale**: msdfgen requires closed filled outlines. The existing logo SVGs use `<circle stroke-width="38.1966">` which msdfgen interprets as a zero-width hairline. The conversion preserves exact geometry: outer_r = ring_center + S/2 = R0, inner_r = ring_center - S/2 = Ri. This is mathematically guaranteed by the golden ratio assertion in the generator script.

**Alternatives considered**:
- Inkscape "Stroke to Path" batch conversion: Adds Inkscape as a dependency, may introduce path approximation errors. Rejected.
- SVG `paint-order: stroke` trick: Not supported by msdfgen. Rejected.

## R3: Shader Atlas UV Lookup Strategy

**Decision**: Add a `uniform float uGlyphIndex` (or encode selection into per-tile hash) and compute UV offset as: `vec2 cellOffset = vec2(mod(index, 4.0), floor(index / 4.0)) * cellSize`. The `cellSize` is `vec2(0.25, 0.5)` for a 4x2 grid. Guard-padded sampling bounds are: `cellUV = clamp(tileUV, guardMin, guardMax)` where guard = 4px / 128px = 0.03125 per cell edge.

**Rationale**: The existing shader already computes per-tile rotation from `tileIdx`. Replacing the rotation math with atlas cell selection is a like-for-like substitution. The per-tile hash (`fract(sin(dot(tileIdx, ...)))`) determines which glyph appears at each tile, creating the varied manuscript feel. UV clamping prevents cross-cell bleeding during bilinear sampling.

**Alternatives considered**:
- Separate texture per glyph (8 textures): Adds 8 texture binds. Rejected.
- Array texture (WebGL2 TEXTURE_2D_ARRAY): Not all target browsers support this reliably. Rejected.

## R4: DOM-to-WebGL Hover Bridge Architecture

**Decision**: Use a CustomEvent (`glyph-hover`) dispatched from `interactions.js` on mouseenter/mouseleave and focusin/focusout of nav buttons. The event detail carries `{ normalizedY: float }` computed from the button's `getBoundingClientRect().y` relative to `#constellation-nav`'s rect, normalized to 0..1. `sidebar-hieroglyphs.js` listens and sets `leftMaterial.uniforms.uHoverUV.value`. A ResizeObserver on `#constellation-nav` invalidates the rect cache on layout changes.

**Rationale**: CustomEvents are the established inter-module communication pattern in this codebase (zone-change, tier-change, reticle-activate, etc.). The normalized Y approach costs one `distance()` call per fragment in the shader — cheaper than passing 7 boolean uniforms. GSAP tweens the uniform for smooth enter (0.15s) and leave (0.25s) transitions.

**Alternatives considered**:
- Raycasting from mouse position to overlay plane: Overkill for a 1D coordinate. Rejected.
- CSS-only hover with mix-blend-mode: Cannot control WebGL shader uniforms. Rejected.
- Per-button boolean uniforms (7 flags): Fragile, wasteful, requires shader changes if project count changes. Rejected.

## R5: Odd Bot Implementation Strategy

**Decision**: Implement as an HTML `<div>` containing an inline SVG of the OE logo at 135 degrees, positioned in the right sidebar via CSS. GSAP animates `transform: rotate()` with `elastic.out(1, 0.5)` easing on zone-change events. The element has `aria-hidden="true"` since it is decorative.

**Rationale**: An HTML element allows CSS transform animation (cheap, compositor-friendly), GSAP tween control with killTweensOf for debouncing, and potential future aria-label updates if the bot gains semantic meaning. A WebGL implementation would add shader complexity for a single element and could not be trivially accessible.

**Alternatives considered**:
- WebGL uniform driving a rotation in the right sidebar shader: Adds complexity, no accessibility path. Rejected.
- CSS `@keyframes` only: Cannot do elastic easing or debounce mid-animation. Rejected.

## R6: Scan-Line Event-Triggered Architecture

**Decision**: Replace the continuous `fract(uTime / 12.0)` scan-line with a `uniform float uScanProgress` driven by a GSAP tween. On zone-change or terminal-scan-complete, fire `gsap.fromTo(material.uniforms.uScanProgress, { value: 0 }, { value: 1, duration: 0.8, ease: 'power2.inOut' })`. The shader reads `uScanProgress` instead of computing from time.

**Rationale**: Event-triggered animation means zero per-frame cost when idle, aligning with "alive, not busy." The GSAP tween integrates with the existing ticker without additional RAF loops. The `uScanProgress` uniform approach matches the existing `uRevealProgress` pattern proposed for the reveal wipe.

**Alternatives considered**:
- Keep continuous scan-line at longer period (30s): Still "busy" per the design direction. Rejected.
- CSS pseudo-element scan line: Cannot match the WebGL brass aesthetic. Rejected.

## R7: Logo Replacement Impact Analysis

**Decision**: Replace `assets/logo.svg` (ASCII-art, ~78K tokens, 532x494 viewBox) with a production copy of `design-assets/oe-logo-pack-2/logo-135-degrees-100x100.svg` (clean vector, ~1.4KB, 298.5x298.5 viewBox) saved as `assets/logo-oe-135.svg`. Update three references: `index.html` line 76 (header band img src), line 12 (og:image meta), and line 156 (orb-fallback img src).

**Rationale**: The ASCII-art SVG renders as text characters via `<text>` elements — it was a placeholder. The vector logo uses proper `<circle>`, `<rect>`, and `<g transform>` elements that render crisply at any DPR. The logo-follow.js module targets `#brand-logo` by ID, so the img src swap is transparent to the JS.

**Alternatives considered**:
- Inline the SVG directly in HTML: Would complicate the `<img>` tag and logo-follow.js which operates on the `<img>` element. Rejected for now.
- Keep ASCII art and add vector as separate element: Unnecessary complexity. Rejected.
