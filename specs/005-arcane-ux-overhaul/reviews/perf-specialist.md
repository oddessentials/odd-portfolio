# Performance Specialist Review: 005-arcane-ux-overhaul

**Reviewer**: Performance Optimization Specialist
**Spec Version**: 0.1.0
**Date**: 2026-03-04
**Verdict**: APPROVED WITH AMENDMENTS

---

## Summary

The spec adds six user-facing feature sets (sidebar hieroglyphs, targeting reticle, starfield noise reduction, project node emphasis, constellation lines, parallax depth) and a code-quality initiative. The performance implications are manageable, but the spec contains several gaps and one invalid assumption that must be addressed before implementation. The draw call budget is tight but defensible if glow halos are implemented correctly. The page weight target is realistic. The auto-tier degradation path has a significant gap at Tier 2. Layout thrashing risks are low given the prescribed mitigations. Mobile detection has a known limitation.

---

## Findings

### Finding 1 -- Invalid Assumption: Sidebar Geometry in WebGL Scene
**Severity: CRITICAL**

The spec states in its Assumptions section: "Sidebar geometry already exists in the WebGL scene as Three.js mesh objects that can receive custom ShaderMaterial." This is **factually incorrect**. The existing sidebars are pure CSS elements managed by `css/styles.css` (grid layout, lines 193+, hidden on mobile at line 1312). There are no Three.js mesh objects for the sidebars anywhere in the codebase. `scene.js` contains only: orbGroup (parent), nebulaGroup (3 Points layers), starGroup (7 star sprites), and dustMotes (1 Points layer).

Implementing FR-001 through FR-006 (MSDF hieroglyph etching with normal perturbation, cavity darkening, edge highlights, breathing light, shimmer, scan-line) requires:
- Creating new Three.js PlaneGeometry meshes positioned to align with the CSS sidebar columns
- Writing a custom ShaderMaterial with MSDF sampling, PBR-lite normal perturbation, and 3 animated effect uniforms
- Synchronizing the WebGL sidebar planes with CSS grid layout on resize
- Handling DPR changes, context loss/restore for the MSDF texture state (edge case mentioned in spec)

This is a substantial implementation task that the spec treats as a trivial material swap. The draw call and GPU cost analysis below accounts for this, but the assumption itself must be corrected.

**Amendment**: Replace the assumption "Sidebar geometry already exists in the WebGL scene as Three.js mesh objects" with: "Sidebar WebGL geometry must be created as new Three.js PlaneGeometry meshes, positioned to overlay the CSS sidebar columns. The plan must include: mesh creation, viewport-synchronized positioning on resize, custom ShaderMaterial authoring, MSDF texture loading, and context loss/restore handling for the MSDF texture."

---

### Finding 2 -- Draw Call Budget Analysis
**Severity: HIGH**

**Current steady-state draw calls (counted from scene.js and performance.js):**

| Object | Draw Calls |
|---|---|
| Nebula layer 0 (Points) | 1 |
| Nebula layer 1 (Points) | 1 |
| Nebula layer 2 (Points) | 1 |
| Star sprite x7 | 7 |
| Dust motes (Points) | 1 |
| Burst pool group (idle, sprites invisible) | 0 |
| **Scene subtotal** | **11** |
| RenderPass | 1 |
| UnrealBloomPass (internal: threshold + blur H + blur V + composite) | ~4 |
| VignetteShader pass | 1 |
| OutputPass | 1 |
| **Post-processing subtotal** | **~7** |
| **Current total** | **~18** |

**New draw calls from spec features:**

| Feature | Draw Calls | Notes |
|---|---|---|
| Sidebar L mesh (MSDF ShaderMaterial) | 1 | New PlaneGeometry |
| Sidebar R mesh (MSDF ShaderMaterial) | 1 | New PlaneGeometry |
| Constellation lines (per active zone) | 2-3 | THREE.Line per connection; max 3 connections in "Developer Tools" zone |
| Glow halos for 7 project nodes (FR-009) | 0-7 | **See below** |
| Reticle (SVG overlay) | 0 | Not WebGL |
| **New subtotal** | **4-12** |
| **Projected total** | **22-30** |

The glow halo implementation (FR-009) is the critical variable. If implemented as 7 persistent separate sprites (one per project node), steady-state hits 30 -- right at the budget ceiling. If implemented as shader-based bloom on the existing star sprites (widening the radial gradient in `createStarTexture` or adding a second draw in the same material), the count stays at 0 additional draw calls.

The constitution (Principle II) says "7 halo sprites (created on demand during hover, not persistent)." FR-009 now requires **persistent** glow halos ("each of the 7 project nodes has a visible glow halo"), contradicting the hover-only halo budget. This is a direct conflict.

**Amendment**: FR-009 MUST specify the glow halo implementation strategy. Recommended approach: enlarge the existing `createStarTexture` canvas texture to include the halo in a single sprite (0 additional draw calls). If a separate glow sprite per node is required, the constitution's particle/instance budget must be amended to include 7 persistent halo sprites. Do not leave this to implementor discretion -- the draw call budget depends on it.

Additionally, FR-034 states the budget is "under 30 steady state." Constellation lines add 2-3 draw calls only during active scroll zones. Clarify whether "steady state" means top-of-page (no scroll zone active, no constellation lines = ~22) or includes active-zone state (lines visible = ~25). Recommendation: define steady state as "all features rendered in their most common visible configuration" and confirm the count stays under 30 with that definition.

---

### Finding 3 -- Frame Budget Analysis (Per-Frame CPU Cost)
**Severity: MEDIUM**

**Existing per-frame work in the GSAP ticker (scene.js lines 700-788):**

| Work Item | Estimated CPU Cost |
|---|---|
| Nebula rotation (3 layers x rotation update) | ~0.01ms |
| Star idle pulse (7 sprites x sin() + opacity write) | ~0.02ms |
| Dust mote Brownian drift (180 particles x velocity + position + clamp) | ~0.1ms |
| Raycasting (setFromCamera + intersectObjects on 7 sprites) | ~0.2ms |
| Hover enter/exit logic + label positioning | ~0.05ms |
| Composer render (or direct render) | GPU-bound, not CPU |
| **Existing CPU subtotal** | **~0.38ms** |

**New per-frame work from spec:**

| Work Item | Estimated CPU Cost | Source |
|---|---|---|
| Parallax layer offsets (3 groups x lerp toward target) | ~0.03ms | FR-025/FR-026: mouse-reactive position updates, damped |
| Reticle screen-space tracking (1x Vector3.project + style writes) | ~0.05ms | FR-013: 3D-to-2D projection per frame |
| Constellation line position updates (during scroll only) | ~0.05ms | FR-019: update line geometry vertex positions as stars move |
| Sidebar shader uniform updates (time, breathing) | ~0.01ms | FR-005: uniform writes only |
| Starfield chromatic twinkle timer check | ~0.01ms | FR-008: simple timer comparison |
| **New CPU subtotal** | **~0.15ms** |
| **Projected total** | **~0.53ms** |

**Verdict**: The combined per-frame CPU work is well under 1ms, leaving over 15ms for GPU rendering within the 16.67ms budget. This is not a concern. The dominant frame cost remains GPU-side (fragment shading for nebula particles, bloom passes, and the new sidebar MSDF shader). The sidebar MSDF fragment shader (normal perturbation, cavity darkening, edge highlight, 3 animated effects) will be the most expensive new GPU work, but it operates on two small quads, not fullscreen, so fragment count is limited.

No amendment required. This is informational.

---

### Finding 4 -- Texture Memory Impact
**Severity: MEDIUM**

**Current texture memory:**

| Texture | Size (GPU) | Source |
|---|---|---|
| Star textures x7 (canvas 128x128 RGBA) | 7 x 64KB = 448KB | createStarTexture() |
| Dust texture (canvas 32x32 RGBA) | 4KB | createDustTexture() |
| **Current total** | **~452KB** |

Note: the star textures are created per-project with unique accent colors. Each 128x128 RGBA canvas texture occupies 128*128*4 = 65,536 bytes on the GPU.

**New texture from spec:**

FR-035 specifies the MSDF texture file must be under 256KB. However, the *file size* (compressed PNG) and the *GPU memory footprint* (uncompressed RGBA) are very different:

| MSDF Resolution | File Size (PNG) | GPU Memory (RGBA) |
|---|---|---|
| 512x512 | ~50-80KB | 1,048KB (1MB) |
| 1024x1024 | ~100-200KB | 4,194KB (4MB) |
| 256x256 | ~15-30KB | 262KB |

A 512x512 MSDF meets the 256KB file-size requirement but pushes GPU texture memory to ~1.5MB total (452KB existing + 1MB new), which exceeds the constitution's 1MB texture memory target.

A 256x256 MSDF may be sufficient for SDF rendering (SDF is resolution-independent by design; the 256x256 provides the distance field, not the final render resolution). MSDF at 256x256 with 3-channel distance fields is standard practice for font rendering.

**Amendment**: FR-035 should specify both the file-size limit AND the GPU memory budget. Recommended: "The MSDF texture MUST be 256x256 resolution (262KB GPU memory), stored as a 3-channel (RGB) PNG under 64KB file size. If higher fidelity is required, 512x512 is permitted but the total texture memory budget (constitution: <1MB) must be verified." Also note: if glow halos use enlarged star textures (e.g., 256x256 instead of 128x128), the star texture memory doubles. The texture memory budget should be tracked as a whole-system constraint in the plan, not just for the MSDF asset.

---

### Finding 5 -- Page Weight Assessment
**Severity: LOW**

SC-009 allows a 300KB increase. Estimated new assets:

| Asset | Estimated Size |
|---|---|
| MSDF PNG (256x256, 3-channel) | ~20-40KB |
| Reticle SVG | ~2-5KB |
| New JS modules (reticle.js, constellation-lines.js, parallax.js, sidebar-hieroglyphs.js) | ~30-60KB raw, ~15-30KB minified |
| **Estimated total** | **~50-100KB** |

This is well within the 300KB budget. SC-009 is realistic and conservative.

However, note that the project has no build system (constitution: "No npm, no bundlers, no build steps"), so "minified" is not applicable unless manual minification is performed. The raw JS size is the shipped size. At ~30-60KB for 4 new modules, this is still well under 300KB.

No amendment required.

---

### Finding 6 -- Auto-Tier Integration: Tier 2 Gap
**Severity: HIGH**

FR-037 defines Tier 3 degradation behavior comprehensively: parallax disabled, constellation line animations suppressed, reticle animations suppressed, sidebar breathing/shimmer disabled. Static visual states remain.

However, the spec says **nothing about Tier 2 behavior** for the new features. The existing auto-tier system (`performance.js` lines 299-308) at Tier 2: reduces bloom strength to 0.4, disables chromatic aberration, slows shimmer to 8s. It does nothing to reduce new feature costs.

The existing tier thresholds are:
- Tier 1: avg frame time < 20ms (Full)
- Tier 2: avg frame time >= 20ms (Medium) -- reduced bloom/aberration, recheck after 2s
- Tier 3: recheck avg >= 20ms after Tier 2 (Low) -- composer disabled, CSS blur fallback

If the new features (sidebar MSDF shader, parallax, constellation lines) add GPU load that pushes frame time above 20ms, the system will go to Tier 2 but only reduce bloom -- the new features continue at full cost. The recheck 2 seconds later may still show >20ms and jump to Tier 3 (drastic). There is no intermediate degradation for new features.

**Amendment**: Add a new requirement FR-037a: "Under auto-tier Tier 2 (medium performance): parallax layer count MUST reduce from 3 to 2 (merge background and mid layers), constellation line pulse/glow animations MUST be suppressed (static lines only), sidebar scan-line sweep MUST be disabled. Reticle and glow halos remain at full quality." This provides a meaningful intermediate step that reduces GPU load without the jarring Tier 3 fallback.

Additionally, the existing `performance.js` exports `getCurrentTier()` but the new feature modules need to call this at initialization AND respond to tier changes at runtime. Currently, tier changes happen silently (no event dispatch). The plan should either (a) add a `document.dispatchEvent(new CustomEvent('tier-change'))` in `applyTier2` and `applyTier3`, or (b) have each new module poll `getCurrentTier()` in its per-frame update. Option (a) is cleaner.

---

### Finding 7 -- Layout Thrashing Risk Assessment
**Severity: LOW**

FR-036 states: "Constellation lines and reticle SVG MUST NOT cause layout thrashing. Position updates MUST use transforms or direct style property writes, not forced reflow."

**Reticle (FR-013)**: The reticle updates position per frame via 3D-to-screen projection. The existing `project3DtoScreen()` function (scene.js lines 103-112) reads `domElement.clientWidth/clientHeight` -- these are layout reads that can trigger reflow if preceded by style writes. However, the reticle position update writes `transform` or `left/top` style properties. As long as position writes happen AFTER the projection read (not interleaved), there is no forced synchronous layout. The spec's mitigation is sufficient.

**Constellation lines**: If implemented as WebGL THREE.Line objects (recommended), there is zero DOM layout involvement. If implemented as SVG/canvas overlay (alternative mentioned in spec), the same transform-only write rule applies.

**Star labels**: The existing `showStarLabel()` (scene.js lines 120-142) already writes `style.left` and `style.top` per frame for hovered stars. This has been running without issues. The reticle follows the same pattern.

**Risk**: Low. The spec's FR-036 mitigation is adequate. One minor note: `domElement.clientWidth` could be cached once per frame (or on resize) rather than read per projection call. This is a micro-optimization, not a required amendment.

No amendment required.

---

### Finding 8 -- Mobile Detection Approach
**Severity: MEDIUM**

The spec (FR-030, edge cases, assumptions) uses `window.innerWidth < 768` as the mobile detection threshold. The existing codebase uses the same approach (scene.js line 306, animations.js line 16, performance.js line 63).

**Concerns:**

1. **Width-only detection misses low-power desktops.** A desktop user on a 1920px display with an Intel HD 4000 GPU is not detected as mobile but may struggle with parallax + constellation lines + sidebar MSDF shader. This is partially addressed by the auto-tier system, but only after the benchmark runs (5+ seconds after reveal). During the first 5 seconds, the full feature set runs on the low-power desktop.

2. **Tablet landscape is not mobile.** An iPad Pro in landscape mode has `innerWidth > 1024` and will receive the full feature set including parallax (which the spec says should be disabled on mobile because "touch parallax is disorienting"). iPad Pro has decent GPU performance, so this may be acceptable -- but the spec should acknowledge this edge case.

3. **Dynamic resize.** The existing codebase rechecks `isMobile = w < 768` on resize (scene.js line 628), but the spec's new modules (parallax, constellation lines) need to also respond to this flag change. FR-030 says "disabled on mobile" but does not specify what happens if the viewport crosses the 768px threshold after initialization (e.g., rotating a tablet). The plan should ensure new modules listen for resize and toggle appropriately.

**Amendment**: Add a note to the edge cases section: "If the viewport crosses the 768px width threshold after page load (e.g., tablet rotation, desktop window resize), parallax and animated constellation line effects MUST toggle on/off accordingly. New feature modules MUST read the mobile flag dynamically, not cache it at initialization." Also recommend adding `navigator.hardwareConcurrency` as a secondary signal: if `hardwareConcurrency <= 2`, treat as low-power regardless of viewport width, and suppress parallax at initialization.

---

### Finding 9 -- Sidebar MSDF Shader Complexity on Integrated GPUs
**Severity: MEDIUM**

The constitution caps shader ALU at <120 instructions per fragment (target) and <200 (hard limit). The sidebar MSDF fragment shader as described requires:

1. MSDF texture sample with UV rotation (4 orientations per tile cell) -- ~5 ALU + 1 texture fetch
2. MSDF distance computation (median of 3 channels, smoothstep) -- ~8 ALU
3. Normal perturbation from distance field gradient (4 additional texture fetches for finite differences) -- ~12 ALU + 4 texture fetches
4. Cavity darkening (AO approximation from distance) -- ~3 ALU
5. Edge highlight band with brass glint -- ~5 ALU
6. Golden ratio construction layer (second SDF pass for phi-grid overlay) -- ~10 ALU + 1 texture fetch
7. Breathing light cycle (sin(time)) -- ~2 ALU
8. Shimmer pass (noise or animated UV offset) -- ~5 ALU
9. Scan-line sweep (step function on UV.y + time) -- ~3 ALU

**Estimated total**: ~53 ALU + 6 texture fetches. This is well within the 120-instruction target. The 5 dependent texture fetches for normal perturbation (center + 4 neighbors for gradient) may cause texture cache misses on tiled GPUs, but the sidebar quads are small screen-area objects, limiting total fragment count.

No amendment required. This is informational -- the shader is feasible within the constitutional ALU budget.

---

### Finding 10 -- Constitution Conflict: Frozen Shader Feature List
**Severity: MEDIUM**

Constitution Principle I states: "Shader feature list is frozen at the following effects (included in scope, not expandable without explicit approval)." The sidebar MSDF hieroglyph shader is an entirely new shader effect not on the frozen list. The parallax system modifies how existing particles are grouped and moved (not a shader change). The constellation lines use basic THREE.Line rendering (no custom shader).

The sidebar MSDF shader is the only item that clearly exceeds the frozen shader scope. This requires explicit owner approval per the constitution's amendment process.

**Amendment**: The spec should acknowledge that the sidebar MSDF ShaderMaterial constitutes a new shader effect requiring a constitution amendment to Principle I (add "sidebar MSDF hieroglyph etching with normal perturbation, cavity darkening, edge highlight, breathing light, shimmer pass, and scan-line sweep" to the frozen list). This amendment should be tracked as a prerequisite in the plan.

---

### Finding 11 -- Constellation Lines: Cleanup Race Condition
**Severity: LOW**

The edge case section mentions: "What happens when the user scrolls rapidly through all 3 zones? Constellation lines for the previous zone must be fully cleaned up before the next zone's lines draw." The spec correctly identifies this but provides no specific mitigation.

The existing `handleScrollProgress()` in animations.js (line 543) already handles zone transitions -- it checks `newZoneIndex !== activeZoneIndex` and transitions. For constellation lines, the implementor should use the same gating: kill any in-progress draw-on GSAP tweens for the previous zone before starting the next zone's tweens. This is standard GSAP practice (`gsap.killTweensOf()`).

**Amendment**: FR-022 should add: "The implementation MUST use `gsap.killTweensOf()` on outgoing zone line elements before starting incoming zone line animations, to prevent animation overlap during rapid scrolling."

---

### Finding 12 -- WebGL Context Loss for MSDF Texture
**Severity: LOW**

The edge case mentions MSDF texture state surviving context restore. The existing codebase handles context loss/restore (scene.js lines 677-685) by calling `onResize()`, which recreates renderer state. However, custom textures loaded from external files (the MSDF PNG) need explicit re-upload after context restore. Three.js does not automatically re-upload disposed textures.

**Amendment**: The sidebar hieroglyphs module must retain the original Image/HTMLImageElement reference used to create the MSDF texture, and on `webglcontextrestored`, call `texture.needsUpdate = true` to trigger re-upload. This should be noted as an implementation requirement in the plan, not necessarily in the spec.

No spec amendment required -- this is a plan-level concern. Informational.

---

## Amendment Summary

| # | Severity | Finding | Required Action |
|---|---|---|---|
| 1 | CRITICAL | Sidebar geometry does not exist in WebGL scene | Correct assumption; add mesh creation to scope |
| 2 | HIGH | Glow halo draw call strategy unspecified; budget at ceiling | FR-009 must specify implementation approach; recommend single-sprite halos |
| 6 | HIGH | No Tier 2 degradation for new features | Add FR-037a defining Tier 2 behavior; add tier-change event dispatch |
| 4 | MEDIUM | MSDF texture GPU memory not bounded | FR-035 must specify resolution and GPU memory, not just file size |
| 8 | MEDIUM | Mobile detection misses low-power desktops; no dynamic toggle spec | Add dynamic toggle requirement; consider hardwareConcurrency signal |
| 9 | MEDIUM | (Informational) Sidebar shader is feasible within ALU budget | None |
| 10 | MEDIUM | Sidebar MSDF shader violates frozen shader list | Acknowledge constitution amendment required |
| 3 | MEDIUM | (Informational) Per-frame CPU cost is within budget | None |
| 7 | LOW | Layout thrashing risk is low with prescribed mitigations | None |
| 5 | LOW | Page weight is well within 300KB budget | None |
| 11 | LOW | Constellation line cleanup race condition | Add gsap.killTweensOf() requirement to FR-022 |
| 12 | LOW | (Informational) MSDF texture context restore | Plan-level concern |

**Required amendments before implementation**: Findings 1, 2, 6 are blocking. Findings 4, 8, 10 are strongly recommended. Findings 11 is a minor spec improvement.
