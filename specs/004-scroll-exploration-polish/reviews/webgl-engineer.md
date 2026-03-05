# WebGL/Three.js Engineer Review

**Spec**: `specs/004-scroll-exploration-polish/spec.md` (v0.2.0)
**Reviewer**: WebGL/Three.js Graphics Engineer
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## Summary

The spec is well-structured and addresses real gaps in the current implementation. The scroll-driven exploration, logo-cursor reliability fixes, star label clipping, Y-axis scaling, and brand language cleanup are all valid requirements. Most functional requirements are achievable within the existing architecture. However, several items need technical clarification or adjusted approach to avoid performance pitfalls and implementation dead-ends.

---

## 1. Scroll-Driven Nebula Rotation (FR-019)

**Severity: MEDIUM**

**Current state**: The 3-layer nebula system uses `THREE.Points` with 800/400/300 particles (1500 total desktop, 400 mobile). Each layer already rotates slowly in the GSAP ticker (`layer.rotation.y = elapsed * speed`). The particles are stored in `BufferGeometry` with vertex positions and vertex colors.

**Assessment**: Rotating the nebula via scroll progress is entirely feasible. The key question is *how* to apply scroll-driven rotation alongside the existing time-based idle drift.

**Recommendation**: Apply scroll rotation to `orbGroup` (the parent `THREE.Group` containing all nebula layers and the star group), NOT to individual layers. This avoids needing per-layer scroll math and keeps the existing per-layer idle drift intact (idle drift rotates each layer at different speeds relative to `orbGroup`). The scroll rotation becomes:

```js
orbGroup.rotation.y = baseIdleRotation + scrollProgress * Math.PI * 0.5;
```

This approach adds zero draw calls, zero CPU cost beyond a single quaternion update per frame, and zero GPU cost (the transform is applied at the group level in the scene graph). 1500 particles rotating via parent group transform is effectively free -- it is a single matrix multiplication in the vertex shader, already happening.

**Concern**: If scroll rotation is applied to `orbGroup`, it also rotates the star sprites. The spec should clarify whether stars should rotate with the nebula or remain positionally fixed. If stars must remain fixed, the nebula layers should be placed in their own sub-group (`nebulaGroup`) separate from `starGroup`, and scroll rotation applied only to `nebulaGroup`. This is a minor refactor (move the 3 `Points` objects into a new `THREE.Group`).

**Will it cause frame drops?** No. Rotating a parent group is a single matrix operation. The GPU does not re-upload any vertex data. The 1500 particles are drawn from the same `BufferGeometry` with the same draw call count. This is not a performance concern.

---

## 2. Zone Hue Shifting (FR-014)

**Severity: HIGH**

**Current state**: Nebula particle colors are computed once at init time via proximity to the nearest project star's `accentColor`, then stored in a `color` vertex attribute. The `PointsMaterial` uses `vertexColors: true`. There are no color uniforms to tween -- each particle has a baked-in RGB value.

**Assessment**: This is the most technically complex requirement in the spec. There are three viable approaches:

### Option A: Uniform Hue Shift (Recommended)

Add a custom `ShaderMaterial` (or extend via `onBeforeCompile`) that applies a uniform hue rotation to the vertex colors. A single `float uHueShift` uniform per layer allows GSAP to tween the hue without touching any vertex data. The fragment shader applies a standard HSL rotation matrix to the vertex color before output.

**Pros**: Zero CPU cost per frame, single uniform update, GSAP-tweens naturally, fully reversible.
**Cons**: Replaces `PointsMaterial` with a custom shader, which means reimplementing `sizeAttenuation` and `vertexColors` (both trivial in a custom shader). Increases code complexity by ~40 lines of GLSL.

### Option B: Vertex Color Buffer Update

On zone transition, iterate all 1500 particles and update the `color` attribute buffer with zone-shifted colors. Mark `needsUpdate = true`.

**Pros**: No shader changes needed.
**Cons**: 1500 * 3 float writes + GPU buffer re-upload on every zone transition. If the transition is animated (progressive hue shift over ~500ms), this means 30+ buffer uploads during the transition. This is the *wrong* approach -- it will cause noticeable frame hitches on integrated GPUs, especially during scroll (when the browser is already busy with compositing).

### Option C: Material Color Tint

Set `material.color` on each `PointsMaterial` to a zone tint. Since `vertexColors: true` multiplies the vertex color by `material.color`, setting `material.color` to a warm gold tint would shift all particles toward gold.

**Pros**: Trivially simple (3 uniform updates for 3 layers). No shader changes. GSAP-tweens via `gsap.to(material.color, { r, g, b })`.
**Cons**: Multiplicative blending cannot shift hues -- it can only darken or tint toward a specific color. A blue-violet particle tinted with warm-gold produces muddy brown, not a warm-gold nebula. This approach does not produce the visual result the spec describes.

**Recommendation**: **Option A** (uniform hue shift) is the correct approach. It is GPU-friendly, GSAP-compatible, and produces correct hue rotation. Option C is a viable quick fallback if Option A proves too complex, but the visual quality will be lower (color-multiply rather than true hue shift).

**Spec amendment needed**: FR-014 should specify that the hue shift is applied via a uniform on a custom shader, not via vertex buffer manipulation. The spec should also define the target hue values numerically (e.g., "blue-violet = 270 deg", "warm-gold = 45 deg", "green-teal = 160 deg") rather than by name, to avoid ambiguity during implementation.

---

## 3. Star Brightening (FR-015 / FR-016)

**Severity: LOW**

**Current state**: Stars are `THREE.Sprite` objects with `AdditiveBlending`, canvas-drawn radial gradient textures, and GSAP-animated opacity pulsing (0.7-1.0 range). Hover enlarges scale by 1.6x via GSAP.

**Assessment**: Three approaches for zone-based star brightening:

| Approach | Visual Quality | Performance | Complexity |
|---|---|---|---|
| **Scale increase** (1.0x -> 1.4x) | Good -- larger glow radius reads as "brighter" | Excellent -- single uniform update | Low |
| **Opacity boost** (0.7-1.0 -> 1.0 constant) | Moderate -- additive blending already near saturation at 1.0 | Excellent | Low |
| **Material emissive** | N/A -- `SpriteMaterial` has no emissive property | N/A | N/A |

**Recommendation**: Use **scale increase** (e.g., 1.3x of `baseScale`) combined with **opacity floor raise** (minimum opacity from 0.7 to 0.9, effectively suppressing the idle pulse dimming). This dual approach produces a visible "brightening" without adding draw calls or changing materials. Tween both via GSAP:

```js
gsap.to(sprite.scale, { x: baseScale * 1.3, y: baseScale * 1.3, duration: 0.4 });
gsap.to(sprite.material, { opacity: 0.95, duration: 0.4 });
```

For inactive stars (FR-016), tween back to `baseScale` and re-enable the idle pulse. This is fully reversible.

**No draw call impact** -- sprites are already in the draw call budget. Scale and opacity are uniform-level changes.

---

## 4. Draw Call Budget (FR-035)

**Severity: LOW**

**Current state**: The scene has:
- 3 nebula `Points` layers (3 draw calls)
- 7 star `Sprite` objects (7 draw calls)
- 1 dust mote `Points` object (1 draw call)
- Ambient light + point light (0 draw calls -- lights are uniform data)
- Post-processing: RenderPass + UnrealBloomPass (internally 3-5 passes at 0.75x res) + VignetteShaderPass + OutputPass

Steady-state scene draw calls: ~11 opaque/transparent objects. Post-processing adds pass overhead but not "scene draw calls" in the traditional sense.

**Assessment**: The spec claims "current steady-state is ~30 draws" and that zone transitions adding 2 keeps it under 32. The actual scene geometry draw calls are closer to 11. The ~30 figure likely includes post-processing pass overhead (each pass renders a full-screen quad). This is correct accounting.

**The scroll-driven changes add zero draw calls**:
- Nebula hue shift: uniform change on existing materials (0 new draws)
- Star brightening: scale/opacity on existing sprites (0 new draws)
- Nebula rotation: parent group transform (0 new draws)

FR-035's "+2 draw call" budget is conservative and achievable. The implementation will not approach the 50 hard limit.

**No amendment needed.** The budget is fine.

---

## 5. Logo-Cursor Desync (FR-001 -- FR-008)

**Severity: HIGH**

**Current state**: `initLogoFollow()` creates `gsap.quickTo` instances once at init time:

```js
logoQuickToX = gsap.quickTo(logoEl, 'left', { duration: 0.3, ease: 'power2.out' });
logoQuickToY = gsap.quickTo(logoEl, 'top', { duration: 0.3, ease: 'power2.out' });
logoQuickToRot = gsap.quickTo(logoEl, 'rotation', { duration: 0.25, ease: 'power2.out' });
```

`quickTo` internally captures the element reference and creates an optimized tween instance that reuses the same GSAP tween object on each call. The issue: `quickTo` does not inherently hold "stale state" after resize -- it targets CSS `left`/`top` properties, which are absolute pixel values. The real desync issues are:

### Issue A: Home position is recalculated at return time (correct)
`logoReturnHome()` calls `getBoundingClientRect()` on the header band each time. This is correct and resize-safe.

### Issue B: quickTo instances survive resize (correct but incomplete)
The `quickTo` functions target `left` and `top` in absolute pixels. After resize, the next `mousemove` event supplies new `e.clientX`/`e.clientY` values which are already in the new coordinate space. So the quickTo instances *do not need to be recreated* for the tracking to work.

**However**, there is a real bug: if the logo is in its home position (no inline styles, positioned by CSS), and the user resizes, the next `mouseenter` calls `engageLogo(e.clientX, e.clientY)` which sets `logoEl.style.left = (cx - logoW) + 'px'`. This is correct. But `logoPrevX`/`logoPrevY` still hold the pre-resize cursor position, causing the *first rotation calculation* after re-engagement to produce a large spurious delta. This manifests as a brief rotation snap.

### Issue C: Viewport exit detection is incomplete
FR-005 requires detecting cursor exit from the browser viewport. The current code only listens for `mouseleave` on `#orb-hitzone`. If the cursor exits the viewport directly from the hitzone (e.g., moves off the edge of the screen), `mouseleave` fires on the hitzone. But if the cursor is over the hitzone and the user Alt-Tabs, there is no `mouseleave` event. The logo stays in its last tracking position.

**Recommendation**:
1. **Do NOT recreate quickTo instances on resize.** They work correctly with absolute pixel values. Recreating them is unnecessary and wastes a GSAP tween allocation.
2. **Reset `logoPrevX`/`logoPrevY` in `engageLogo()`** -- this is already done (`logoPrevX = cx; logoPrevY = cy;`), but the rotation update fires in `mousemove` *before* `engageLogo` if `logoFollowing` is false (the fallback path calls `engageLogo` and returns). This is actually correct -- the `return` prevents rotation calc on that frame.
3. **Add `document.addEventListener('mouseleave', ...)` or `document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) logoReturnHome(); })`** to handle viewport exit as FR-005 requires.
4. **Add a `resize` handler inside `initLogoFollow()`** that calls `logoReturnHome()` if the logo is currently following, ensuring the logo returns to the (new) home position on resize. If the logo is already home, clear any stale inline styles.

**Spec amendment needed**: FR-004 says "quickTo instances MUST be refreshed." Based on analysis, they do NOT need refreshing. The spec should say "the logo system MUST recalibrate on resize by returning the logo to home position if actively following, and clearing stale inline styles if at home." Refreshing quickTo is unnecessary and the spec should not mandate a specific implementation mechanism when the underlying issue is stale positioning, not stale quickTo state.

---

## 6. Star Label Repositioning (FR-020)

**Severity: MEDIUM**

**Current state**: `#star-labels` is a child of `#main-viewport` (grid column 2) with `position: absolute; inset: 0`. The `project3DtoScreen()` function projects from world space to screen space using `renderer.domElement.clientWidth/Height`:

```js
function project3DtoScreen(position3D, cam, domElement) {
  const vec = position3D.clone();
  vec.project(cam);
  const halfW = domElement.clientWidth / 2;
  const halfH = domElement.clientHeight / 2;
  return {
    x: vec.x * halfW + halfW,
    y: -(vec.y * halfH) + halfH
  };
}
```

The canvas (`#orb-canvas`) is `position: fixed; inset: 0` -- it covers the full viewport. The projection math uses `domElement` (the canvas), which is full-viewport-sized. The resulting `x, y` values are in **viewport coordinates** (0,0 at top-left of the full viewport).

**The problem**: These viewport-space coordinates are then applied as `label.style.left` and `label.style.top` inside a container (`#star-labels`) that is positioned within `#main-viewport` (grid column 2). The container's coordinate origin is the top-left of the center column, NOT the top-left of the viewport. This means labels are already mispositioned by the sidebar width. They happen to look approximately correct because the sidebars are narrow (~180px) and the stars near the center produce similar viewport-x and column-x values.

**If `#star-labels` is moved to viewport level** (e.g., as a direct child of `#app-shell` or `body`, with `position: fixed; inset: 0`), the coordinate projection becomes correct -- the label container and the canvas share the same coordinate origin (viewport top-left). This actually **fixes** a subtle existing positioning error.

**Z-index implications**: The label container needs `z-index` above the frame decorative elements and sidebars but below the project overlay. Current `--z-star-labels: 25` and sidebars at `--z-hud: 20`. If the container is at viewport level with `z-index: 25`, it sits above sidebars. With `pointer-events: none` on the container and `pointer-events: auto` on individual labels (per FR-021/FR-022), sidebar buttons remain clickable.

**Recommendation**: Move `#star-labels` to be a direct child of `body` (or `#app-shell`) with `position: fixed; inset: 0; z-index: var(--z-star-labels); pointer-events: none`. No changes needed to `project3DtoScreen()` -- the math is already producing viewport-space coordinates. This is a clean fix that also corrects the existing subtle offset bug.

**One caution**: The existing label code sets `label.style.pointerEvents = 'none'` unconditionally. Per FR-022, individual labels should have `pointer-events: auto`. The current code should be updated to reflect this, though labels are currently non-interactive (no click handlers), so this is a forward-looking concern.

---

## 7. Y-Axis Scaling (FR-024 -- FR-027)

**Severity: LOW**

**Current state**: The resize handler scales only the X-axis:

```js
xScale = Math.min(1, currentAspect / designAspect);
starNodes.forEach(sprite => {
  sprite.position.x = sprite.userData.basePosition[0] * xScale;
});
```

**Formula validation** for `yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3)`:

| Viewport | Aspect | xScale | (1-xScale) | *0.3 | 1 - result | yScale (clamped) |
|---|---|---|---|---|---|---|
| 1920x1080 | 1.78 | 1.0 | 0.0 | 0.0 | 1.0 | **1.0** |
| 1280x1024 | 1.25 | 0.703 | 0.297 | 0.089 | 0.911 | **0.911** |
| 390x844 | 0.462 | 0.260 | 0.740 | 0.222 | 0.778 | **0.8** (clamped) |
| 768x1024 | 0.75 | 0.422 | 0.578 | 0.173 | 0.827 | **0.827** |
| 414x896 | 0.462 | 0.260 | 0.740 | 0.222 | 0.778 | **0.8** (clamped) |

**Star position validation at 390x844 (xScale=0.260, yScale=0.8)**:

| Star | Base X | Base Y | Scaled X | Scaled Y |
|---|---|---|---|---|
| odd-ai-reviewers | 1.8 | 1.0 | 0.468 | 0.800 |
| ado-git-repo-insights | -2.0 | 0.5 | -0.520 | 0.400 |
| repo-standards | 2.2 | -0.4 | 0.572 | -0.320 |
| odd-self-hosted-ci | -0.8 | -1.2 | -0.208 | -0.960 |
| odd-map | 0.3 | 0.8 | 0.078 | 0.640 |
| odd-fintech | -2.2 | -0.6 | -0.572 | -0.480 |
| coney-island | 1.0 | -1.0 | 0.260 | -0.800 |

**Minimum separation check** (closest pairs in scaled space):

- odd-map (0.078, 0.640) to odd-ai-reviewers (0.468, 0.800): distance = sqrt(0.39^2 + 0.16^2) = 0.422 -- passes (>0.18)
- coney-island (0.260, -0.800) to odd-self-hosted-ci (-0.208, -0.960): distance = sqrt(0.468^2 + 0.16^2) = 0.495 -- passes
- odd-fintech (-0.572, -0.480) to ado-git-repo-insights (-0.520, 0.400): distance = sqrt(0.052^2 + 0.88^2) = 0.882 -- passes
- repo-standards (0.572, -0.320) to coney-island (0.260, -0.800): distance = sqrt(0.312^2 + 0.48^2) = 0.572 -- passes

All pairs exceed the 0.18 minimum. The formula produces good spatial distribution even at extreme portrait ratios.

**Implementation note**: The Y-scale should also apply to nebula layers (either via `layer.scale.y = yScale` or by scaling the parent group). Without nebula Y-scaling, stars would move vertically relative to the nebula backdrop, breaking the visual cohesion. The spec does not mention nebula Y-scaling explicitly.

**Recommendation**: Add to FR-024 or create a new FR: "Nebula layers MUST also scale on the Y-axis using the same yScale factor to maintain visual alignment between stars and nebula backdrop."

---

## Consolidated Concerns

| # | Area | Severity | Description |
|---|---|---|---|
| 1 | FR-019 (Nebula Rotation) | MEDIUM | Spec should clarify whether stars rotate with nebula or remain fixed. Recommend separate nebulaGroup for independent rotation. |
| 2 | FR-014 (Zone Hue Shifting) | HIGH | Must use uniform-based hue shift (custom ShaderMaterial), NOT vertex buffer updates. Define hue targets numerically. |
| 3 | FR-004 (Logo quickTo Refresh) | HIGH | quickTo instances do NOT need refreshing. The spec should describe the desired behavior (recalibrate on resize) not the mechanism (refresh quickTo). |
| 4 | FR-005 (Viewport Exit) | MEDIUM | Current code lacks `document`-level mouseleave listener. Must add `mouseout` with `relatedTarget === null` check. |
| 5 | FR-020 (Star Label Container) | MEDIUM | Move to viewport-level `position: fixed`. The existing projection math already outputs viewport coordinates -- this is actually a bug fix. |
| 6 | FR-024 (Y-Axis Scaling) | LOW | Nebula layers need matching Y-scale. Add explicit FR for nebula Y-axis scaling. |
| 7 | FR-009 (Scroll Distance) | LOW | Constitution says max 300px scroll distance. Spec says "one viewport height." These conflict for viewports >300px tall (all of them). Clarify: is the constraint 300px or 1vh? |

---

## Specific Recommendations

1. **Create a `nebulaGroup`**: Refactor the 3 nebula `Points` layers into a dedicated `THREE.Group`. This enables scroll rotation on the nebula independently of star positions. Minimal refactor (~5 lines changed in `initScene()`).

2. **Custom ShaderMaterial for nebula hue**: Replace the 3 `PointsMaterial` instances with a custom `ShaderMaterial` that supports a `uHueShift` float uniform. The shader is straightforward:
   ```glsl
   // In fragment shader:
   vec3 rgb = vColor;
   // Apply hue rotation via rotation matrix
   float angle = uHueShift;
   float s = sin(angle);
   float c = cos(angle);
   mat3 hueRot = mat3(
     0.299+0.701*c+0.168*s, 0.587-0.587*c+0.330*s, 0.114-0.114*c-0.497*s,
     0.299-0.299*c-0.328*s, 0.587+0.413*c+0.035*s, 0.114-0.114*c+0.292*s,
     0.299-0.300*c+1.250*s, 0.587-0.588*c-1.050*s, 0.114+0.886*c-0.203*s
   );
   rgb = hueRot * rgb;
   ```

3. **Scroll container strategy**: For the pinned starfield with 300px (or 1vh) scroll distance, use `ScrollTrigger.create({ pin: '#app-shell', end: '+=300' })` or equivalent. The `overflow: hidden` on `html`/`body` must be removed *after* reveal completes (FR-011). Consider using a wrapper element around `#app-shell` as the scroll container rather than modifying `html`/`body` overflow, which could have side effects on other fixed-position elements.

4. **Auto-tier integration (FR-036)**: When the benchmark detects frame time >20ms, zone transitions should fall back to instant `material.color` tint (Option C from hue shifting analysis) instead of the animated hue-shift shader. This is simpler, cheaper, and acceptable at tier 2/3 where visual quality is already degraded.

---

## Verdict

**APPROVED WITH AMENDMENTS**

The spec correctly identifies the gaps and the requirements are achievable. The amendments above address implementation feasibility concerns (especially around hue shifting and logo quickTo) that, if not addressed, would lead to suboptimal implementations or wasted effort. None of the concerns are blocking -- they are clarifications and technique recommendations that strengthen the spec.
