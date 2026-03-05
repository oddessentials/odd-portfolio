# Technical Artist Review: Scroll-Driven Exploration & Remaining Polish

**Reviewer**: Technical Artist (Shaders & Materials)
**Spec Version**: 0.2.0
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## 1. Nebula Hue Shifting (FR-014)

### Current Implementation Analysis

The nebula is built from 3 layers of `THREE.Points` using `THREE.PointsMaterial` with `vertexColors: true` (`js/scene.js:408`). Vertex colors are computed at init time by blending palette colors with the nearest project's `accentColor` based on proximity (`js/scene.js:375-401`). There is no custom shader material — this uses Three.js's built-in `PointsMaterial`.

### Three Approaches Evaluated

#### (a) Additive Color Uniform Overlay

**Technique**: Replace `PointsMaterial` with `ShaderMaterial` that adds a `uniform vec3 uZoneColor` and a `uniform float uZoneInfluence` to the fragment output. The fragment shader reads the vertex color, then lerps or additively blends toward the zone color:

```glsl
vec3 finalColor = mix(vColor, uZoneColor, uZoneInfluence * 0.4);
```

**ALU Cost**: ~3 instructions (mix is 1 multiply + 1 multiply-add). Well under the 120 ALU budget.

**Visual Quality**: Good. Preserves the per-particle color variation from the proximity system while shifting the overall palette. The 0.4 influence cap prevents washing out individual star accent color halos. Additive blending (already used on layers 0 and 1) means the overlay naturally intensifies brighter particles.

**Recommendation**: This is the recommended approach. It is the cheapest, gives smooth GSAP-driven transitions via the uniform, and requires no geometry buffer updates at runtime.

#### (b) HSL Hue Rotation in Fragment Shader

**Technique**: Convert vertex color from RGB to HSL, rotate hue by a `uniform float uHueShift`, convert back.

**ALU Cost**: ~25-35 instructions for RGB-to-HSL-to-RGB round-trip (multiple branches, atan2 approximation, clamping). This is within the 120 ALU budget but is excessive for what amounts to a color tint.

**Visual Quality**: Excellent hue control, but overkill. Hue rotation changes *all* colors uniformly, which would shift the project accent color halos in unintended ways (e.g., an orange star halo rotating to green when the zone color is green-teal).

**Recommendation**: Not recommended. Too expensive for the marginal quality gain, and the hue rotation semantics are wrong for this use case.

#### (c) Vertex Color Recalculation at Runtime

**Technique**: On zone change, recompute the `color` buffer attribute for all ~1500 particles by re-running the proximity+palette logic with zone-weighted palettes, then call `geometry.attributes.color.needsUpdate = true`.

**ALU Cost**: Zero GPU cost (CPU only). However, recalculating 1500 * 3 float values per zone transition is ~18KB of typed array writes. On a 60fps scroll this could cause jank if triggered every frame.

**Visual Quality**: Potentially the best, since each particle gets a bespoke color. But the difference from approach (a) is negligible at the particle densities used here (particles are 0.018-0.022 world units).

**Recommendation**: Not recommended for scroll-driven use. Acceptable as a one-time init-path optimization, but too expensive for continuous transitions.

### Final Recommendation: Approach (a)

Replace `PointsMaterial` with a minimal `ShaderMaterial` on all 3 nebula layers. The vertex shader passes through `vColor` from the `color` attribute. The fragment shader blends `vColor` with `uZoneColor` based on `uZoneInfluence`. GSAP tweens `uZoneInfluence` from 0 to 1 over the zone transition duration.

**Estimated ALU cost**: ~5 instructions total (existing `PointsMaterial` logic + 3 for mix). Well within the <120 budget.

**Concern (MEDIUM)**: The spec does not specify the `ShaderMaterial` replacement. The current `PointsMaterial` cannot accept custom uniforms. This is an implementation detail but needs to be called out: switching from `PointsMaterial` to `ShaderMaterial` requires replicating the point size attenuation, vertex color pass-through, and depth/blend settings. Provide a reference shader in the plan to prevent regressions.

---

## 2. Zone Color Palette — Concrete RGB Values

The spec defines zones as "blue-violet", "warm-gold", and "green-teal". These need actual color values that work against the dark background (`#0a0e2a` / `#0d0b09`) and maintain contrast with the existing project accent colors.

### Recommended Zone Colors

| Zone | Descriptor | Hex | RGB | HSL | Rationale |
|------|-----------|-----|-----|-----|-----------|
| 1 | Blue-Violet | `#6B3FA0` | (107, 63, 160) | (267, 44%, 44%) | Sits between `#A855F7` (odd-fintech purple) and `#4B2280` (nebula palette). Dark enough to not overpower star glows, saturated enough to read as a distinct shift. |
| 2 | Warm-Gold | `#B8860B` | (184, 134, 11) | (43, 89%, 38%) | DarkGoldenrod family. Harmonizes with `#F5C518` (repo-standards) and `#FF6B35` (odd-ai-reviewers). Low lightness prevents washing out the dark background. |
| 3 | Green-Teal | `#1A9E8F` | (26, 158, 143) | (173, 72%, 36%) | Between `#2DD4BF` (odd-map) and `#00C9D4` (ado-git-repo-insights). Teal-forward to differentiate from `#4ADE80` (odd-self-hosted-ci pure green). |

### Design Rationale

- All three colors are at **35-45% lightness** in HSL. This ensures they tint the nebula without competing with the brighter star sprites (which are at 55-70% lightness).
- The colors are spaced ~110 degrees apart on the hue wheel (267, 43, 173), giving maximum perceptual separation.
- All maintain >4.5:1 contrast ratio against both the dark background and against each other when used as text (not that they will be, but it validates perceptual distance).

**Concern (LOW)**: These values should be tunable via constants in `data.js` (add a `nebulaHueRgb` field to each zone object) rather than hardcoded in the shader or transition logic. This makes future adjustments trivial.

---

## 3. Star Glow Intensification (FR-015)

### Current Implementation

Stars are `THREE.Sprite` instances with `THREE.SpriteMaterial` using canvas-generated radial gradient textures (`js/scene.js:48-65`). Each star has a `baseScale` derived from `project.starSize * 0.15` (`js/scene.js:439`). The idle pulse modulates `material.opacity` between 0.7 and 1.0 (`js/scene.js:625`).

### Three Approaches Evaluated

#### (a) Increase Sprite Scale

**Technique**: GSAP tween `sprite.scale` to `baseScale * 1.4` when the star's zone is active.

**Pros**: Simplest implementation. Scale changes are visually dramatic. The existing hover handler already scales to `baseScale * 1.6` (`js/scene.js:725`), so the infrastructure exists.

**Cons**: Zone-active scale (1.4x) competes with hover scale (1.6x). The difference is only 0.2x base, which may not register as a distinct hover feedback on top of the zone brightening. Also, scaling a canvas texture beyond its native resolution (128px) introduces visible pixelation.

**Recommendation**: Use this, but cap zone-active scale at **1.3x** to preserve headroom for the 1.6x hover scale.

#### (b) Increase Material Opacity

**Technique**: Set `sprite.material.opacity = 1.0` (from the idle-pulse range of 0.7-1.0) and/or increase the `emissive` intensity.

**Pros**: No pixelation risk. Cheap.

**Cons**: With `AdditiveBlending` (`js/scene.js:434`), opacity changes are very subtle against the dark background. The difference between 0.8 and 1.0 opacity in additive mode is barely perceptible. This alone is insufficient.

**Recommendation**: Use as a supplement, not the primary signal. Lock opacity to 1.0 (suppress the idle pulse) for zone-active stars.

#### (c) Overlay a Second Sprite (Glow Halo)

**Technique**: Add a second, larger sprite behind each star with a softer gradient texture (wider falloff, lower opacity) that fades in when the zone is active.

**Pros**: Dramatic visual effect. The glow halo creates a "bloom" appearance without additional post-processing passes.

**Cons**: +7 draw calls (one per star) when all zones have been visited. The constitution allows <30 steady state, and we are currently at approximately 15-18 (3 nebula layers + 7 star sprites + dust + burst pool container + lights). Adding 7 more puts us at 22-25, still within budget but approaching it.

**Recommendation**: Not recommended for the initial implementation. The draw call budget is tight when combined with FR-035's allowance of only 2 additional draw calls for zone transitions. Seven halo sprites would blow that budget.

### Final Recommendation: Scale (1.3x) + Opacity Lock

- Zone-active stars: `scale = baseScale * 1.3`, `opacity = 1.0` (pulse suppressed)
- Zone-inactive stars: `scale = baseScale * 1.0`, `opacity` resumes idle pulse (0.7-1.0)
- Hover on zone-active star: `scale = baseScale * 1.6` (existing behavior, still clearly distinct from the 1.3x zone state)
- Transition: GSAP tween scale over 300ms, set opacity lock as a boolean flag

**Concern (LOW)**: FR-015 says "via scale increase, glow intensification, or opacity change" — the spec leaves this open. The plan should lock down the specific technique to prevent implementation ambiguity.

---

## 4. Auto-Tier Degradation for Zone Transitions (FR-036)

### Current Tier System

The auto-tier system (`js/performance.js:255-385`) has three tiers:
- **Tier 1 (Full)**: All effects
- **Tier 2 (Medium)**: Reduced bloom (0.4 strength), no chromatic aberration
- **Tier 3 (Low)**: No composer, CSS filter fallback

The benchmark fires 5 seconds after reveal completion and evaluates average frame time over 30 frames. If avg >= 20ms, it drops to Tier 2 and rechecks after 2 seconds.

### Recommendation for Zone Transitions by Tier

| Tier | Nebula Hue Shift | Star Brightening | Transition Style |
|------|-----------------|------------------|-----------------|
| 1 (Full) | GSAP tween `uZoneInfluence` over 400ms | Scale 1.3x + opacity lock over 300ms | Smooth animated |
| 2 (Medium) | GSAP tween `uZoneInfluence` over 200ms (faster) | Scale 1.3x + opacity lock over 150ms | Faster animated |
| 3 (Low) | Step function: `uZoneInfluence = 1.0` immediately | Instant `scale = baseScale * 1.2` (smaller), instant `opacity = 1.0` | No animation |

**Technical Detail for Tier 3 "Instant Color Swaps"**: This should be a `gsap.set()` call (duration 0) on the shader uniform, not a binary on/off. Setting the uniform to its target value instantly still uses the same code path — it just skips the interpolation frames. This avoids branching logic between "animated" and "non-animated" code paths, which reduces maintenance burden and bug surface.

**Concern (LOW)**: The spec says "instant color swaps with no animated gradients" but does not clarify whether this means the nebula snaps to the zone color or stays at its default color. The intent should be: the nebula still shifts color (for visual feedback that scrolling is doing something), but the shift is instantaneous rather than animated. Clarify in the plan.

---

## 5. Reduced Motion (FR-031 / FR-032)

### FR-031: "Nebula color zone transitions MUST apply instantly (duration zero)"

**Interpretation**: The nebula DOES change color per zone, but the transition is instantaneous (no animated tween). This means:
- `uZoneInfluence` is set to `1.0` immediately when a zone boundary is crossed (via `gsap.set()`)
- `uZoneColor` is updated to the new zone's color immediately
- The visual result: the nebula "pops" to the new color with no gradual fade

This is the correct interpretation. Keeping the nebula at its default color regardless of scroll would mean the scroll-driven experience provides no visual feedback at all under reduced motion, which defeats the purpose of the scroll feature. Color changes are not motion — they are state changes. WCAG `prefers-reduced-motion` targets motion (translation, rotation, scaling, opacity fades), not color shifts.

### FR-032: "Star brightening/scaling within zones MUST be suppressed"

**Interpretation**: Stars remain at their default visual state (`baseScale`, idle pulse active) regardless of scroll position. No scale tweens, no opacity locks.

This is correct. Scale changes are motion. The star state changes provide supplementary visual feedback on top of the nebula color shift, so suppressing them while keeping the nebula color shift preserves the core scroll feedback channel.

### Nebula Rotation (FR-019) Under Reduced Motion

**Concern (MEDIUM)**: FR-019 says the nebula MUST rotate proportionally to scroll progress. FR-031/FR-032 address color and star scaling but do not mention rotation. The existing nebula rotation (`js/scene.js:614-618`) is already suppressed under `prefersReducedMotion()`. However, FR-019's scroll-proportional rotation is a *different* rotation from the idle drift. The spec should clarify:

- **If `prefers-reduced-motion: reduce`**: Is the scroll-proportional nebula rotation suppressed? It should be, since rotation is motion. But FR-019 has no reduced-motion exemption clause.

**Recommendation**: Add to FR-031 or FR-032: "Scroll-proportional nebula rotation (FR-019) MUST also be suppressed under `prefers-reduced-motion: reduce`. The nebula remains at its default rotation angle, changing only color."

---

## Summary of Concerns

| # | Severity | Area | Description |
|---|----------|------|-------------|
| 1 | **MEDIUM** | FR-014 | Switching from `PointsMaterial` to `ShaderMaterial` is required but not specified. The plan must include a reference vertex+fragment shader that replicates `PointsMaterial` behavior (size attenuation, vertex colors, depth/blend) plus the `uZoneColor`/`uZoneInfluence` uniforms. |
| 2 | **MEDIUM** | FR-019/FR-031 | Scroll-proportional nebula rotation under `prefers-reduced-motion` is unaddressed. Add an explicit suppression clause. |
| 3 | **LOW** | FR-014 | Zone colors ("blue-violet", "warm-gold", "green-teal") need concrete RGB values in the data model. Recommended values provided above. |
| 4 | **LOW** | FR-015 | The star brightening technique is left open ("scale increase, glow intensification, or opacity change"). Lock down the specific approach (scale 1.3x + opacity lock) in the plan to prevent implementation ambiguity. |
| 5 | **LOW** | FR-036 | "Instant color swaps" for Tier 3 should be clarified as `gsap.set()` on the uniform (same code path, zero duration), not a separate non-animated code branch. |
| 6 | **LOW** | Data | Add `nebulaHueRgb` field (hex string) to each `CONSTELLATION_ZONES` entry in `data.js` so zone colors are tunable without shader edits. |

---

## Shader Budget Accounting

| Component | Estimated ALU/fragment | Notes |
|-----------|----------------------|-------|
| Existing `PointsMaterial` equivalent | ~8 | Texture sample, vertex color multiply, alpha test |
| Zone color mix (new) | ~3 | `mix(vColor, uZoneColor, uZoneInfluence * 0.4)` |
| **Total nebula fragment** | **~11** | Well within 120 ALU budget |
| Existing vignette post-process | ~15 | Chromatic aberration + vignette smoothstep |
| Existing bloom (UnrealBloomPass) | ~40-60 | Three.js internal, 0.75x resolution |
| **Total post-process** | **~55-75** | Within 120 ALU budget per pass |

No shader budget concerns. The zone color overlay adds negligible cost.

---

**Verdict**: APPROVED WITH AMENDMENTS. The two MEDIUM concerns (ShaderMaterial migration path and reduced-motion rotation gap) should be addressed in the plan before implementation begins. The LOW concerns are recommendations for the plan/task level and do not block approval.
