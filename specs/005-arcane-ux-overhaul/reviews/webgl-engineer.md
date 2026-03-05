# WebGL/Three.js Engineer Review: 005-arcane-ux-overhaul

**Reviewer**: WebGL/Three.js Graphics Engineer
**Spec Version**: 0.1.0
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## Current Draw Call Baseline

Before evaluating the spec's impact, I audited the existing scene. The current steady-state draw call inventory:

| Scene Element | Draw Calls |
|---|---|
| 3 nebula Points layers | 3 |
| 7 star Sprites | 7 |
| 1 dust motes Points | 1 |
| 2 lights (ambient + point) | 0 (lights are not draw calls) |
| Post-processing: RenderPass | 1 |
| Post-processing: UnrealBloomPass (internal) | ~5 |
| Post-processing: ShaderPass (vignette) | 1 |
| Post-processing: OutputPass | 1 |
| **Total steady-state** | **~19** |

Burst pool sprites are invisible at steady state (0 draw calls). Budget headroom: ~11 draw calls before hitting the 30 steady-state limit.

---

## Findings

### Finding 1 -- Sidebar Hieroglyphs: No WebGL Sidebar Geometry Exists

**Severity**: CRITICAL

The spec (FR-001 through FR-006) assumes "sidebar geometry already exists in the WebGL scene as Three.js mesh objects that can receive custom ShaderMaterial" (Assumptions section). **This assumption is false.** The sidebars are entirely CSS-based HTML elements (`#constellation-nav` and `#status-panel` positioned via CSS Grid). There are no Three.js meshes representing sidebars anywhere in the scene graph. The `scene.js` scene graph is: `scene > orbGroup > [nebulaGroup, starGroup, dustMotes]`. No sidebar meshes exist.

The spec must either:
1. Specify that new Three.js PlaneGeometry meshes must be created and positioned to align with the CSS sidebar regions (which introduces camera-space alignment complexity and 2 new draw calls), OR
2. Pivot the hieroglyph etching to a CSS/SVG/Canvas 2D approach that renders into the existing HTML sidebar panels, abandoning the MSDF/ShaderMaterial pipeline entirely.

Option 1 is the only path if MSDF shading is desired, but it introduces a significant new requirement: the WebGL sidebar planes must be kept in pixel-perfect registration with the CSS sidebar panels across all viewport sizes and resize events. This is a non-trivial integration challenge that the spec does not address.

**Amendment required**: Add a new requirement specifying either (a) creation of sidebar WebGL geometry with explicit alignment rules to CSS layout, or (b) a CSS/Canvas 2D fallback approach. The assumption that sidebar geometry exists must be corrected.

---

### Finding 2 -- Draw Call Budget Impact Assessment

**Severity**: HIGH

Projected new draw calls from the spec:

| New Element | Draw Calls | Notes |
|---|---|---|
| 2 sidebar planes (ShaderMaterial) | +2 | If WebGL approach (Finding 1) |
| 7 glow halo sprites (FR-009) | +7 | One per project node, persistent |
| Constellation lines per zone | +2 to +3 | Max 3 projects in a zone = 2-3 line segments |
| Reticle (SVG overlay) | 0 | Not WebGL |
| Parallax restructuring | 0 | Reuses existing Points objects |

Projected new steady-state total: 19 (current) + 2 (sidebars) + 7 (halos) = **28 draw calls** without constellation lines. With a zone active: 28 + 3 = **31 draw calls** -- exceeding the 30 steady-state limit.

FR-009 specifies "visible glow halo (separate glow sprite or shader-based bloom effect)." If implemented as separate Sprite objects (one per project node), the 7 additional draw calls consume nearly all remaining headroom. If all 7 halos are persistent (not on-demand like the current hover halo), this is the primary budget risk.

**Amendment required**: FR-009 must specify the implementation approach:
- **Option A (recommended)**: Implement halos as a single THREE.Points object with 7 vertices using a radial gradient canvas texture and additive blending. This costs 1 draw call instead of 7.
- **Option B**: Use the existing star sprite texture at a larger scale with a two-pass render (core + halo baked into the same sprite texture). This costs 0 additional draw calls.
- **Option C**: If separate Sprite objects are used, the 7 persistent halos must be documented as consuming 7 draw calls and the budget must be re-validated.

---

### Finding 3 -- Constellation Lines: Implementation Approach Unspecified

**Severity**: HIGH

FR-019 through FR-024 specify constellation lines but leave the implementation approach as "THREE.Line or canvas/SVG overlay, depending on rendering approach selected during planning." This must be resolved at spec time because the approaches have vastly different performance characteristics.

**THREE.Line approach**: Each `THREE.Line` object with a separate `BufferGeometry` is 1 draw call. A zone with 3 projects has 2-3 lines = 2-3 draw calls. The draw-on animation (FR-021) requires per-frame `BufferGeometry` position updates via `setDrawRange()` or vertex manipulation, which triggers GPU buffer re-uploads. This is manageable for 3 lines but must be explicitly called out.

**SVG/Canvas overlay approach**: Zero WebGL draw calls. However, position tracking requires per-frame `project3DtoScreen()` calls (already used for labels). The draw-on animation is trivial with SVG `stroke-dashoffset` or Canvas path interpolation. This approach avoids draw call budget pressure entirely.

**Amendment required**: The spec should mandate one of:
- **SVG overlay (recommended)**: Zero draw call cost, simpler animation via CSS/GSAP, consistent with the reticle's SVG overlay approach. Specify that line endpoints are computed via `project3DtoScreen()` each frame and rendered as SVG `<line>` or `<path>` elements with `pointer-events: none`.
- **THREE.LineSegments**: If WebGL lines are chosen, use a single `THREE.LineSegments` object with all zone lines in one BufferGeometry (1 draw call per active zone). Use `setDrawRange()` for draw-on animation. Specify `THREE.LineBasicMaterial` with `transparent: true` and `depthWrite: false`.

---

### Finding 4 -- MSDF Texture Size: 256KB is Realistic but Needs Format Specification

**Severity**: MEDIUM

FR-035 says the MSDF texture must be under 256KB. An MSDF texture for a single logo glyph is typically 64x64 to 256x256 pixels in a 3- or 4-channel PNG. At 256x256 RGBA PNG, uncompressed GPU memory is 256KB, and the file size is typically 20-80KB depending on complexity. This is well within budget.

However, the spec does not specify:
1. The texture format (PNG, basis/KTX2, raw RGBA).
2. The GPU texture dimensions (power-of-two required for mipmapping).
3. Whether mipmapping is enabled (MSDF textures typically use `THREE.LinearFilter` with no mipmaps).
4. The texture filtering mode (MSDF requires `minFilter: LinearFilter, magFilter: LinearFilter` -- no nearest-neighbor, no mipmaps).

The constitution's 1MB total texture budget (Principle II) must account for this MSDF texture alongside existing textures. Current texture usage: 7 canvas-drawn star textures (128x128 each, ~64KB GPU memory each = ~448KB) + 1 dust texture (32x32, negligible) = ~450KB. Adding a 256x256 MSDF texture adds ~256KB, totaling ~706KB. Within budget.

**Amendment required**: FR-035 should specify: "MSDF texture MUST be PNG format, power-of-two dimensions (recommended 128x128 or 256x256), using `THREE.LinearFilter` for both minFilter and magFilter with `generateMipmaps: false`. The MSDF must be 3-channel (RGB) or 4-channel (RGBA) with the distance field encoded in the RGB channels per msdfgen conventions."

---

### Finding 5 -- Sidebar Shader ALU Complexity Risk

**Severity**: MEDIUM

The spec describes the sidebar fragment shader as performing:
1. MSDF texture sampling with UV rotation (4 orientations via tile position)
2. Median-of-three distance extraction (standard MSDF decode)
3. Normal perturbation from the SDF (gradient computation = 4 additional texture samples for finite differences)
4. Cavity darkening (AO from distance field)
5. Edge highlight band with brass glint (smoothstep on distance range)
6. Construction line overlay (secondary SDF layer with different thresholds)
7. Breathing light cycle (time-based luminance oscillation)
8. Shimmer pass (additional time-based effect)
9. Scan-line sweep (optional, time-based)

Rough ALU instruction estimate:
- UV rotation (sin/cos per fragment): ~8 instructions
- MSDF sample + median: ~6 instructions (3 component swizzles + median)
- Normal gradient (4 extra tex samples + finite diff): ~20 instructions (texture-bound, not ALU, but increases texture fetch pressure)
- Cavity AO: ~4 instructions
- Edge highlight: ~8 instructions (smoothstep pair + color lerp)
- Construction lines: ~12 instructions (secondary threshold + phi grid logic)
- Breathing light: ~4 instructions
- Shimmer: ~6 instructions
- Scan-line: ~4 instructions

**Estimated total: ~72 ALU instructions + 5 texture fetches.** This is under the 120-instruction ALU limit, but the 5 texture fetches per fragment on the same MSDF texture may cause texture cache thrashing on integrated GPUs if the sidebar covers a large screen area. The 4 extra samples for normal gradient computation are the main concern.

**Amendment (advisory, not blocking)**: Consider using a pre-computed normal map baked alongside the MSDF (packed into the alpha channel or a second small texture) instead of computing normals via finite differences in the fragment shader. This reduces texture fetches from 5 to 2 per fragment. If finite differences are retained, specify a `texelSize` uniform to control the sample offset rather than hardcoding a pixel offset.

---

### Finding 6 -- Parallax Depth Layers: Scene Graph Restructuring Required

**Severity**: MEDIUM

FR-025 through FR-030 specify 3 parallax depth layers. The current scene has 3 nebula Points layers in `nebulaGroup`, but these are not depth-separated -- they overlap in z-range and have overlapping spatial distributions (z ranges: [-2,1], [-2.5,1.5], [-3,2]). The parallax spec requires layers with distinct movement multipliers responding to mouse input.

Two implementation approaches:

**Approach A -- Restructure existing nebula layers**: Assign each existing nebula layer a parallax speed multiplier. On mouse move, apply position offsets to each layer's group transform. This is zero additional draw calls but changes the visual character of the nebula (layers would visibly separate on mouse movement, which may look wrong since the particles were not designed for depth separation).

**Approach B -- Create 3 new star layers for parallax**: Add 3 new Points objects (small/dim background, medium mid-ground, large/bright foreground) specifically for parallax, independent of the nebula. This adds 3 draw calls (total would be ~22 before halos/sidebars). The nebula layers continue to drift as currently implemented.

The spec does not clarify whether parallax applies to the existing nebula particles, new dedicated star particles, or both. FR-028 says "background stars are smallest and dimmest, mid-layer stars are medium, foreground particles are largest and brightest" -- this implies dedicated parallax star layers distinct from the nebula.

**Amendment required**: Clarify whether parallax layers are:
- (a) The existing 3 nebula layers repurposed with parallax offsets (0 new draw calls, but changes nebula behavior), or
- (b) 3 new dedicated star Points layers added alongside the nebula (3 new draw calls), or
- (c) A redistribution of existing nebula particles into 3 depth-separated groups with parallax offsets (0 new draw calls, requires particle position reassignment).

Option (c) is recommended: redistribute existing particles into 3 z-bands and apply per-group parallax offsets without adding new draw calls.

---

### Finding 7 -- Glow Halo Sprites: Constitution Particle Budget Conflict

**Severity**: MEDIUM

The constitution (Principle II) specifies: "7 project star sprites + 7 halo sprites (created on demand during hover, not persistent)." The current implementation creates 7 star sprites with no halos -- the hover effect is a scale increase via GSAP, not a separate halo sprite.

FR-009 specifies persistent glow halos (always visible, not hover-only). This directly contradicts the constitution's "created on demand during hover, not persistent" constraint. The spec should explicitly acknowledge this is a constitution amendment and reference the amendment process (Principle VIII, Governance section).

**Amendment required**: Add a note that FR-009 amends the constitution's particle/instance budget by making halos persistent rather than hover-only. Recommend implementing halos as a single Points object (see Finding 2) to minimize draw call impact.

---

### Finding 8 -- WebGL Context Loss: MSDF Texture Restoration

**Severity**: MEDIUM

The edge case section mentions "MSDF texture state must survive context restore." The current context loss handler in `scene.js` (lines 676-685) calls `onResize()` on restore but does not re-upload textures. After a WebGL context loss, all GPU resources (textures, buffers, programs) are destroyed. Three.js automatically handles texture re-upload for textures that retain their `image` or `source` data, but only if the texture's `.image` property is still populated.

For canvas-generated textures (current star textures), the canvas element remains in memory, so Three.js can re-upload. For the MSDF texture loaded via `THREE.TextureLoader`, the `image` property (an `HTMLImageElement`) persists as long as the Image object is not garbage collected, so Three.js should auto-restore it.

However, the sidebar `ShaderMaterial` program (compiled GLSL) will be lost and must be recompiled. Three.js handles this automatically but there may be a visible flash. The spec should mention this is acceptable behavior.

**Amendment (advisory)**: FR-002 should note that on WebGL context restore, the MSDF texture will be re-uploaded automatically by Three.js (the loaded Image element is retained in memory). The ShaderMaterial program will be recompiled automatically. A brief visual discontinuity during restoration is acceptable.

---

### Finding 9 -- Starfield Noise Reduction: Missing Shader Change Specification

**Severity**: LOW

FR-007 says background star/nebula particles must render as predominantly white. The current implementation assigns nebula particle colors by blending a random palette color with the nearest project's accent color (scene.js lines 443-445). This means nebula particles currently carry significant chromatic content.

To achieve 90% white/desaturated particles, the color assignment logic in `scene.js` must be changed. The spec states the requirement but does not specify whether this applies to:
1. Only the dust motes (currently white already via `createDustTexture()`), or
2. All nebula particles across the 3 layers, or
3. Only a subset of particles that are designated as "background stars" separate from the nebula.

If all 1500 nebula particles are desaturated to white, the nebula will lose its colorful character entirely, which would conflict with the constitution's "nebula is static but colorful" (Principle III, reduced motion state).

**Amendment required**: Clarify that FR-007 applies to a specific particle subset (e.g., "the top-layer nebula particles, or new dedicated star particles") while preserving the colored nebula particles. Alternatively, specify that the nebula retains color and only a new "star" particle layer (see parallax layers, Finding 6) is predominantly white.

---

### Finding 10 -- Missing Specification: Reticle Screen-Space Projection Frequency

**Severity**: LOW

FR-013 says the reticle must track star screen-space position "updated per frame via 3D-to-screen projection." The existing `project3DtoScreen()` function in `scene.js` (lines 103-112) performs a `Vector3.project()` call. This is a matrix multiplication -- cheap for a single star but the spec should confirm that the reticle tracks only the single currently-targeted star, not all 7 stars simultaneously. Projecting all 7 every frame is still trivial, but unnecessarily wasteful.

**No amendment required** -- this is informational. The implementation should project only the targeted star's position, not all 7.

---

### Finding 11 -- Missing Specification: Parallax Mouse Input Coordinate Space

**Severity**: LOW

FR-026 specifies parallax offset from mouse movement but does not define the coordinate mapping. Key questions:
1. Is the offset proportional to mouse position relative to viewport center (positional parallax), or proportional to mouse velocity (momentum-based)?
2. What are the maximum offset magnitudes per layer? Without clamping, aggressive mouse movement could shift layers enough to reveal gaps in the particle distribution.
3. Does scrolling also contribute to parallax offset (FR-025 mentions "mouse movement or camera parallax" in the User Story)?

**Amendment required**: Add a requirement specifying: "Parallax offsets MUST be proportional to cursor position relative to viewport center. Maximum offset per layer: background 0.02 world units, mid-ground 0.05, foreground 0.1. Offsets MUST be smoothly damped (GSAP quickTo or lerp) with a response time of 200-300ms."

---

### Finding 12 -- Revised Draw Call Budget Summary

**Severity**: HIGH (summary of Findings 2, 3, 6)

With all amendments applied (recommended implementations), the projected budget:

| Element | Draw Calls |
|---|---|
| Current baseline | 19 |
| 2 sidebar planes | +2 |
| 1 halo Points object (7 vertices) | +1 |
| Constellation lines (SVG overlay) | +0 |
| Parallax (redistribute existing particles) | +0 |
| **Projected total** | **22** |

This leaves 8 draw calls of headroom below the 30 steady-state limit. If the non-recommended approaches are used (7 individual halo sprites + 3 THREE.Line objects + 3 new parallax Points layers), the total would be 19 + 2 + 7 + 3 + 3 = **34**, exceeding the budget.

**The spec MUST mandate the efficient implementations to stay within budget**, or explicitly request a constitution amendment to raise the draw call limit.

---

## Summary of Required Amendments

| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | CRITICAL | No WebGL sidebar geometry exists | Correct assumption; specify geometry creation or pivot approach |
| 2 | HIGH | Glow halos risk +7 draw calls | Mandate single Points object implementation |
| 3 | HIGH | Constellation lines approach unspecified | Mandate SVG overlay or single LineSegments |
| 6 | MEDIUM | Parallax layer approach ambiguous | Specify redistribution of existing particles |
| 7 | MEDIUM | Persistent halos contradict constitution | Acknowledge constitution amendment |
| 12 | HIGH | Combined budget at risk with naive implementations | Mandate efficient implementations |
| 4 | MEDIUM | MSDF texture format/filtering unspecified | Add format and filter mode requirements |
| 9 | LOW | White-star scope unclear vs colored nebula | Clarify which particles are desaturated |
| 11 | LOW | Parallax coordinate mapping undefined | Add offset ranges and damping parameters |

Advisory (non-blocking): Findings 5, 8, 10.

---

**Recommendation**: Approve after the CRITICAL and HIGH findings are addressed. The spec's visual goals are achievable within the performance budget, but only if the implementation approaches are explicitly constrained to the efficient options identified above. Leaving implementation details to planning risks a naive approach that exceeds the draw call budget by 40%.
