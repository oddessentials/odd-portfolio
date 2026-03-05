# Technical Artist Review: 005-arcane-ux-overhaul

**Reviewer**: Technical Artist (Shaders & Materials)
**Date**: 2026-03-04
**Spec Version**: 0.1.0
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## Summary

The spec captures the visual intent from REVIEW.md faithfully and demonstrates strong understanding of the SDF/MSDF stamping approach. The shader material recipe is well-defined, the golden ratio construction line treatment is appropriate, and the sidebar material discipline is correctly scoped. However, there are several issues related to the MSDF pipeline source material, missing spec detail on normal perturbation method, and a visual quality risk around the logo's nature as an ASCII-art SVG that must be addressed before implementation.

---

## Findings

### 1. CRITICAL -- The Logo SVG Is ASCII Art, Not Vector Geometry; MSDF Conversion Will Fail

**What the spec assumes** (FR-002, Assumptions): "The OddEssentials logo SVG is available at `design-assets/logo.svg` and can be converted to MSDF format using msdfgen or equivalent tooling."

**What the codebase reveals**: There are two distinct logo representations in the repository:

- `design-assets/logo.svg` -- An ASCII-art SVG composed of hundreds of individual `<text>` elements using mathematical symbols (pi, sqrt, infinity, +, -, etc.) positioned on a character grid. Each glyph is a separate `<text>` node with a monospace font reference. This is NOT geometric vector art.
- `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` -- A proper geometric SVG with `<circle>` and `<rect>` primitives representing the golden-ratio OE letterform (circle + stem + three horizontal bars, transformed with flip and 45-degree rotation).

**The problem**: `msdfgen` operates on vector path outlines. The ASCII-art SVG (`logo.svg`) contains no `<path>` elements -- only `<text>` nodes referencing system fonts. Running msdfgen against this file will either fail entirely (no outline data) or produce garbage. The geometric SVG (`oddessentials-logo-final.svg`) is suitable for MSDF conversion but produces a clean geometric OE monogram, not the ASCII-art texture the brand uses.

**The spec must clarify which logo is being etched.** The REVIEW.md says "etched logo hieroglyphs" and references the generator at `oe_logo_flipped_rotated.py`, which produces the geometric OE monogram. If the intent is the geometric OE, the pipeline is feasible but the spec's assumption pointing at `design-assets/logo.svg` is wrong. If the intent is the ASCII-art logo, MSDF is not the right pipeline -- a pre-rasterized SDF (render ASCII SVG to bitmap, then generate SDF from that bitmap) would be needed, which has different resolution and quality characteristics.

**Amendment required**: Update FR-002 and Assumptions to specify `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` (the geometric OE monogram) as the MSDF source, OR specify a two-step pipeline (rasterize ASCII SVG at high resolution, then generate SDF from the rasterized bitmap) if the ASCII logo is intended. Given the REVIEW.md's references to the mathematical golden-ratio construction and the four orientations (OE, crusader bot, rocket, smiling king), the geometric monogram is almost certainly the correct source.

---

### 2. HIGH -- Missing Normal Perturbation Method in FR-003

**What the spec says** (FR-003): "The sidebar fragment shader MUST sample the MSDF texture and produce: normal perturbation (carved depth), cavity darkening (ambient occlusion), and an edge highlight band with a warm brass glint color."

**What REVIEW.md specifies**: The material recipe describes three channels: (1) height/normal (primary carve), (2) roughness (etched area rougher or smoother), (3) albedo (cavity darkening). Plus the edge highlight band.

**The gap**: FR-003 lists normal perturbation, cavity darkening, and edge highlight -- but omits roughness modulation entirely. The REVIEW.md explicitly calls out roughness as the second channel and notes it creates a perceptual difference between the etched region and the surrounding surface. Roughness modulation is what makes the etching "catch light differently" in the carved vs. uncarved areas and is essential for the "Victorian astronomical instrument" feel. Without it, the etching will look like a painted decal rather than a material change.

**Amendment required**: FR-003 should read: "...MUST produce: normal perturbation (carved depth), roughness modulation (etched region has different roughness than surrounding surface), cavity darkening (ambient occlusion in carved region), and an edge highlight band with a warm brass glint color." Four channels, matching REVIEW.md.

---

### 3. MEDIUM -- Golden Ratio Construction Lines: Separate Texture vs. Second Channel

**What the spec says** (FR-004): A secondary faint construction-line layer overlays select stamps. The spec does not specify whether this is a second channel in the MSDF texture, a separate texture, or procedurally generated in the shader.

**Assessment**: The REVIEW.md recommends "a thin-line SDF texture for the phi spiral / grid" as a "second stamp layer." There are three implementation paths:

1. **Bake into MSDF alpha/extra channel** -- Packs both logo SDF and construction-line SDF into a single texture (e.g., RGB = logo MSDF, A = construction lines SDF). Saves a texture binding but makes each stamp carry construction lines, conflicting with the spec's requirement that only "select stamps" show them.
2. **Separate SDF texture** -- A second texture sampled independently. Allows selective application (per-tile masking in shader). Costs one additional texture unit (trivial).
3. **Procedural in shader** -- Phi-grid lines and spiral arc drawn analytically as SDF primitives in GLSL. Zero texture cost. Grid lines are trivial (two sets of parallel lines at phi intervals). Spiral arc is more complex but doable with a logarithmic spiral SDF.

**Recommendation**: Option 3 (procedural) for the grid lines and phi labels, with Option 2 (separate small SDF texture) only for the spiral arc if the analytic spiral SDF proves too expensive. Grid lines at phi intervals are ~5 lines of GLSL. This avoids texture bloat and gives perfect resolution independence. The spec should not prescribe implementation but should acknowledge that the construction lines may be procedural rather than texture-based.

**Amendment suggested**: Add a note to FR-004: "The construction-line layer MAY be implemented as a separate SDF texture, procedural SDF primitives in the fragment shader, or a combination, at the implementer's discretion. The phi-grid lines and labels are strong candidates for procedural generation."

---

### 4. LOW -- Sidebar Material Discipline: 3 Effects Is Correct

**What the spec says** (FR-005): Exactly three intentional animated effects: breathing light, shimmer pass, scan-line sweep.

**Assessment**: This is well-calibrated. The "Victorian astronomical instrument" aesthetic demands measured, mechanical motion -- not organic chaos. Three effects provide:

- **Breathing light**: Communicates "the instrument is alive/powered." Slow luminance oscillation (period 4-8s recommended).
- **Shimmer pass**: Communicates material quality (brass/metal surface). Best as a specular highlight sweep.
- **Scan-line sweep**: Communicates "this is a viewing instrument." Mechanical, periodic.

This is sufficient. Adding more would violate the discipline principle. The scan-line being "optional" (per FR-005) is also correct -- it should be the first to drop under performance tier degradation. No amendment needed.

---

### 5. HIGH -- Star Color Reduction: Spec Does Not Address the Root Cause in the Nebula System

**What the spec says** (FR-007): "Background star/nebula particles MUST render as predominantly white or near-white."

**What the codebase actually does** (`js/scene.js`, lines 408-458): The nebula system creates three particle layers with rich color palettes:

- Layer 0: `['#FF6B35', '#A855F7', '#4B2280', '#1A1060']`
- Layer 1: `['#00C9D4', '#2DD4BF', '#0A0E2A', '#1A1060']`
- Layer 2: `['#FFFFFF', '#C8B0FF', '#D4B896', '#0A0E2A']`

Each particle's color is computed by lerping a random palette color with the nearest project node's accent color (influence factor 0.6 at close range). This means the nebula particles are heavily chromatic by design -- saturated oranges, purples, teals, and project accent colors permeate the particle field.

**The problem**: FR-007 says "background star/nebula particles" should be white-dominant, but the spec does not distinguish between the three particle systems:

1. **Nebula layers** (800+400+300 = 1500 particles) -- These ARE the "background" but they serve as nebula dust, not "stars." Making them white would destroy the nebula aesthetic entirely and flatten the scene to a monochrome void.
2. **Dust motes** (180 particles) -- Already near-white (rgba 255,255,255,0.6 gradient). No change needed.
3. **Star nodes** (7 project sprites) -- These are the interactive projects. They should keep color.

The spec conflates "stars" with "nebula particles." The chromatic noise the REVIEW.md complains about likely comes from the nebula system's high-saturation palette combined with additive blending, not from explicit "star" objects. The fix should be to desaturate the nebula palettes (shift toward gray/white with hint of color) rather than making "90% of particles white" which would gut the visual atmosphere.

Additionally, there is no separate "background star" system in the codebase. The nebula layers ARE the background. If the intent is to add a distinct layer of tiny white background stars (separate from nebula dust), the spec needs to say so explicitly as a new particle system.

**Amendment required**: FR-007 should be refined to either: (a) specify desaturation of nebula palette colors (e.g., reduce saturation to 10-20% of current values while preserving luminance variation), OR (b) specify creation of a new dedicated "background stars" particle system with white/near-white coloring, distinct from the existing nebula system. The current wording "background star/nebula particles" is ambiguous and could lead to destroying the nebula atmosphere.

---

### 6. MEDIUM -- MSDF Tiling: Moire and Seam Risks on Curved Sidebar Geometry

**What the spec says**: The sidebars are WebGL meshes receiving custom ShaderMaterial with tiled MSDF stamps.

**Visual quality risk**: The current sidebars are CSS elements (`frame__edge--left`, `frame__edge--right`), not WebGL meshes. They are `<div>` elements with CSS gradients and pseudo-elements positioned via CSS Grid. The spec and REVIEW.md both state "sidebars in WebGL" and "sidebar mesh has UVs," but the codebase has no WebGL sidebar geometry.

This means the implementation must either:

(a) Create new WebGL mesh geometry for the sidebars (PlaneGeometry or similar, positioned to align with the CSS frame edges), or
(b) Render the hieroglyphs as a separate WebGL layer that composites behind/over the existing CSS sidebars.

If option (a): UV parameterization must be carefully set up. The sidebars are tall and narrow (18px wide CSS, but visually they span the full viewport height). Tiling a square MSDF texture across this aspect ratio will produce extreme UV stretching unless the tile size is explicitly controlled. The formula `rotation = (cellX + cellY) % 4` from FR-001 implies a 2D grid of cells, but a narrow sidebar may only have 1 cell across its width (cellX always 0), which would cycle only through 2 orientations (0 and 2 for even rows, 1 and 3 for odd), not all 4 in a visually balanced way.

If the WebGL sidebar meshes are wider than the CSS frame edges (extending behind the HUD panels), this is less of a concern. But the spec should clarify the intended sidebar geometry dimensions.

**Amendment suggested**: Add a note clarifying whether the sidebar WebGL geometry matches the narrow CSS frame edge width (~18px visual) or extends wider behind the HUD panels. If narrow, the tiling formula should be adjusted to use row index alone for rotation: `rotation = cellY % 4`.

---

### 7. LOW -- MSDF Texture Budget Is Reasonable

**What the spec says** (FR-035): MSDF texture under 256KB.

**Assessment**: The geometric OE monogram is simple geometry (a circle, a vertical bar, three horizontal bars). An MSDF at 256x256 or 512x512 resolution would be more than adequate for this level of detail and would compress to well under 256KB as PNG (likely 20-50KB for 512x512 MSDF). The 256KB budget is generous and achievable. No concern.

---

### 8. LOW -- Edge Highlight Band: Recommend Explicit Smoothstep Parameters

**What REVIEW.md specifies**: `edge = smoothstep(a,b,sdf) - smoothstep(c,d,sdf)` for a narrow band. It notes parameters a,b,c,d but does not specify values.

**Assessment**: The spec correctly captures the edge band concept in FR-003 but does not specify band width in SDF units. During implementation, the band width should be approximately 1-3 texels in the MSDF space (at 512x512, this is roughly 0.002-0.006 in normalized UV). Too wide and it looks like a glow; too narrow and it disappears at lower resolutions. This is an implementation detail, not a spec concern, but worth noting for the plan phase. No amendment needed.

---

### 9. MEDIUM -- WebGL Context Loss Recovery for MSDF Texture

**What the spec says** (Edge Cases): "The sidebar MSDF texture state must survive context restore."

**Assessment**: The current context restore handler in `scene.js` (line 682) simply calls `onResize()`. This does NOT re-upload textures. When WebGL context is lost, ALL GPU resources (textures, buffers, programs) are destroyed. On restore, Three.js will attempt to re-upload textures that have their `source` data retained, but custom ShaderMaterial uniforms with texture references need explicit handling.

The spec correctly identifies this as an edge case but does not elevate it to a functional requirement. Given that the MSDF texture is a new shader uniform texture (not managed by Three.js's built-in material system), context restore handling should be an explicit FR or at minimum called out in the implementation plan.

**Amendment suggested**: Add to FR-002 or create a new FR: "The MSDF texture uniform MUST be re-uploaded on WebGL context restore. The texture source image data MUST be retained in JavaScript memory (not disposed after initial upload)."

---

### 10. LOW -- SC-005 Resolution Independence Claim Needs DPR 3.0 Validation

**What the spec says** (SC-005): "No pixelation or blurring is visible at any DPR value up to 3.0."

**Assessment**: MSDF rendering is resolution-independent by design -- the distance field is evaluated analytically in the fragment shader, producing sharp edges at any resolution. This claim is valid for the logo etching. However, the construction lines (FR-004) may not share this property if they are texture-based rather than procedural. Procedural SDF construction lines would also be resolution-independent. This reinforces the recommendation in Finding 3 to prefer procedural generation for construction lines. No spec amendment needed, but the plan should ensure construction lines are also resolution-independent.

---

## Consolidated Amendments

1. **(CRITICAL)** FR-002 and Assumptions: Change the MSDF source from `design-assets/logo.svg` to `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` (the geometric OE monogram). The ASCII-art SVG is not compatible with msdfgen.

2. **(HIGH)** FR-003: Add roughness modulation as the fourth output channel: "...MUST produce: normal perturbation (carved depth), **roughness modulation (etched region roughness differs from surrounding surface)**, cavity darkening (ambient occlusion in carved region), and an edge highlight band with a warm brass glint color."

3. **(HIGH)** FR-007: Disambiguate "background star/nebula particles." Specify whether the fix is (a) desaturating existing nebula palettes, or (b) adding a new white-star particle layer separate from the nebula system. The current nebula system has no "stars" per se -- it is all colored dust. Making 90% of it white will destroy the nebula effect.

4. **(MEDIUM)** FR-004: Add implementation guidance noting that construction lines MAY be procedural SDF primitives rather than texture-based.

5. **(MEDIUM)** FR-002 or new FR: Add explicit WebGL context restore handling for the MSDF texture uniform.

6. **(MEDIUM)** FR-001: Clarify sidebar WebGL geometry dimensions. If the sidebar mesh is narrow (matching the ~18px CSS frame edge), the tiling rotation formula should account for single-column tiling.
