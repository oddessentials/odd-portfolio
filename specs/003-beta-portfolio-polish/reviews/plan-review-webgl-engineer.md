# Plan Review: WebGL/Three.js Graphics Engineer

**Reviewer**: WebGL/Three.js Graphics Engineer
**Plan reviewed**: `specs/003-beta-portfolio-polish/plan.md`
**Date**: 2026-03-04
**Files cross-referenced**: `js/scene.js`, `css/styles.css`, `js/data.js`, `index.html`, `spec.md`, `research.md`

---

## Verdict: APPROVE WITH CONCERNS

The plan is technically sound and the CSS-only hitzone approach is correct. The xScale formula produces valid results at all tested breakpoints. However, there are two medium-severity concerns and one low-severity concern that should be addressed during implementation.

---

## Issue 1: Raycaster Threshold Risk at Mobile xScale (Medium)

### Finding

The plan specifies `raycaster.params.Sprite = { threshold: 0.15 }` and my earlier review stated the minimum star separation is ~1.4 units. This is correct at the **design reference** (16:9, xScale=1.0).

However, after applying `xScale` on narrow viewports, star separations compress significantly:

| Viewport | xScale | Closest pair | Distance |
|----------|--------|-------------|----------|
| 1920x1080 | 1.000 | ado-git-repo-insights <-> odd-fintech | 1.269 |
| 390x844 | 0.260 | ado-git-repo-insights <-> odd-map | 0.698 |
| 390x844 | 0.260 | repo-standards <-> coney-island | 0.705 |

At the mobile extreme (xScale=0.260), the closest pair separation drops to **0.698 world units**. A threshold of 0.15 means the effective hit radius per star is 0.15 units, so the combined hit zone of two adjacent stars spans 0.30 units. With 0.698 separation, there is **0.398 units of dead space** between the two closest stars. This is safe -- no false positives will occur.

**However**, the combination of compressed positions + the threshold means that at very extreme portrait aspect ratios (e.g., Galaxy Fold at 280px), separations could theoretically drop below 0.30 and cause overlap. The spec's minimum viewport of 320px produces xScale=0.317 with minimum separation of ~0.698 * (0.317/0.260) = 0.851, which remains safe.

### Verdict

**No change required.** The 0.15 threshold is safe at all spec-supported viewport widths (320px+). The concern is informational -- if the minimum viewport ever drops below 280px, this would need revisiting.

---

## Issue 2: Nebula and Dust Mote Bounds Not Scaling (Medium)

### Finding

The plan states:
> Scale nebula volume `xRange` values proportionally in each layer's config
> Update dust mote clamping bounds to match scaled ranges

This is correct directionally but the plan does not specify **how** to implement this. The current nebula is created during `initScene()` with hard-coded `xRange` values (3.5, 4.0, 4.5 at `scene.js:283-286`). These are baked into the `BufferGeometry` position arrays at creation time. The nebula particles are **not** repositioned on resize -- the plan only mentions star sprite repositioning in `onResize()`.

The dust mote clamping bounds are similarly hard-coded in the render loop (`scene.js:569`: `Math.abs(dx) > 3.5`). The dust positions are created with `randomVolumePoint(3.0, 2.0, [-2, 1])` at line 397.

**Implications:**
1. **Nebula**: On narrow viewports, stars compress inward (e.g., max x becomes 0.57 at mobile), but the nebula extends to +/-4.5. The nebula will appear to wrap far beyond the star field at narrow viewports. This is an **aesthetic** issue, not a functional bug -- the nebula provides ambient atmosphere and slight over-extension is visually acceptable.
2. **Dust motes**: Dust particles clamped to +/-3.5 will extend well beyond the star field on mobile. Same aesthetic concern.

**Options during implementation:**
- (A) Accept the aesthetic mismatch -- nebula/dust provide ambient atmosphere regardless of star positions.
- (B) Scale nebula particle positions on resize (expensive: requires iterating all ~1500 particles, updating the position BufferAttribute, and marking `needsUpdate = true`).
- (C) Scale only the dust mote clamping bounds in the render loop (cheap: just multiply the clamp limit by xScale). Nebula stays static.

### Recommendation

**Option C** is the pragmatic choice. Scale dust mote clamp bounds by `xScale` in the render loop (trivial change, line 569). Leave nebula static -- it is behind the stars and the aesthetic impact is minimal. The plan should note this as a deliberate simplification.

---

## Issue 3: Logo Follow-Cursor Interaction with Fixed Hitzone (Low)

### Finding

The plan changes `#orb-hitzone` to `position: fixed; inset: 0`. Currently, the logo follow-cursor feature (`initLogoFollow()` at `scene.js:142-207`) listens for `mouseenter`, `mousemove`, and `mouseleave` events on `#orb-hitzone`.

With `position: fixed; inset: 0`, the hitzone covers the entire viewport. This means:
1. **`mouseenter`** fires when the mouse enters the viewport (from the browser chrome or from outside the window). Currently it fires when the mouse enters the center grid column. The logo follow behavior would start from the edge of the viewport rather than from the center column.
2. **`mouseleave`** fires only when the mouse leaves the browser viewport entirely. Currently it fires when the mouse moves into the sidebar area, triggering the logo-return-to-home animation.

**Impact**: With the fixed hitzone, the logo will follow the cursor even when the mouse is over the sidebar areas. The logo-return animation only triggers when the mouse leaves the entire viewport. This changes the behavior noticeably -- the logo would track over the sidebar panels, which have higher z-index, creating a visual layer where the logo (z-index: 30) floats above the sidebars (z-index: 20).

**Wait** -- checking z-index values:
- `--z-hud: 20` (sidebars)
- `--z-logo-follow: 30` (logo in following state)
- The hitzone will be at `calc(var(--z-hud) - 1)` = 19

The sidebar panels at z-index 20 will sit **above** the hitzone at z-index 19. This means mouse events over the sidebar areas will be captured by the sidebar, not by the hitzone. The `mouseleave` event WILL fire on the hitzone when the mouse enters a sidebar panel, because the sidebar's higher z-index means it intercepts pointer events.

**Revised assessment**: The z-index stacking actually preserves the current behavioral pattern. When the mouse enters a sidebar, the sidebar captures events, the hitzone gets a `mouseleave`, and the logo returns home. This is correct behavior.

However, there is one subtle issue: when the mouse is over the **frame decoration** (`.frame`, z-index: 10, `pointer-events: none`), the hitzone at z-index 19 will still capture events. The frame area (corners, edges, gauges) overlaps the viewport edges. Since the frame has `pointer-events: none`, mouse events pass through it to the hitzone. This means the logo will follow the cursor in the frame corner areas, which it did not do before (the hitzone was limited to the center column). This is a minor behavioral expansion that is actually **desirable** -- it eliminates dead zones in the corner areas.

### Verdict

**No change required.** The z-index stacking correctly preserves sidebar interaction priority. The logo follow expansion into frame-corner areas is a minor improvement, not a regression.

---

## Issue 4: Hitzone Z-Index Stack Validation (Verified Correct)

### Analysis

The plan specifies: `z-index: calc(var(--z-hud) - 1)` for the fixed hitzone.

Current z-index stack from `styles.css:52-61`:
```
--z-canvas: 0        (canvas -- pointer-events: none)
--z-frame: 10        (decorative frame -- pointer-events: none)
--z-hud: 20          (sidebars, command line, main viewport, hitzone currently)
--z-star-labels: 25  (star labels -- pointer-events: none)
--z-logo-follow: 30  (logo in following state -- pointer-events: none)
--z-hamburger: 35    (hamburger button)
--z-nav-overlay: 40  (mobile nav when open)
```

Proposed hitzone z-index: `calc(var(--z-hud) - 1)` = **19**.

Stacking order at z=19:
- Below: canvas (0), frame (10)
- At: hitzone (19)
- Above: sidebars (20), star labels (25), logo (30), hamburger (35), nav overlay (40)

**Verification**:
- Sidebars at z=20 sit above hitzone at z=19. Sidebar buttons remain clickable. **Correct.**
- Star labels at z=25 with `pointer-events: none` pass through to hitzone. **Correct.**
- Logo at z=30 with `pointer-events: none` passes through to hitzone. **Correct.**
- Canvas at z=0 with `pointer-events: none` is below everything. **Correct.**
- Frame at z=10 with `pointer-events: none` passes through to hitzone. **Correct.**
- Hamburger at z=35 sits above everything on mobile. **Correct.**
- Mobile nav overlay at z=40 sits above hitzone. **Correct.**

**One concern**: The `#main-viewport` currently has `z-index: var(--z-hud)` (20) at `styles.css:785`. The hitzone is currently a child of `#main-viewport`. When the hitzone becomes `position: fixed`, it escapes its parent's stacking context. But `#main-viewport` at z=20 establishes a stacking context, and elements inside it (like `#star-labels` at z=25) are positioned relative to the viewport's context. Since the hitzone becomes `position: fixed` and gets its own z-index of 19, it exits the main-viewport's stacking context entirely and participates in the root stacking context. This is the correct behavior -- it is now a viewport-level overlay.

**Verified: The z-index approach is correct.**

---

## Issue 5: Star Position Scaling Formula Validation (Verified Correct)

### Analysis

Formula: `xScale = Math.min(1, currentAspect / designAspect)` where `designAspect = 16/9`.

Computed results at key breakpoints:

| Viewport | Aspect | xScale | Max star x (2.2 * xScale) | Frustum hHalf | Fits? |
|----------|--------|--------|--------------------------|---------------|-------|
| 1920x1080 (16:9) | 1.778 | 1.000 | 2.200 | 3.314 | Yes |
| 1440x900 | 1.600 | 0.900 | 1.980 | 2.982 | Yes |
| 1024x768 (4:3) | 1.333 | 0.750 | 1.650 | 2.485 | Yes |
| 768x1024 (portrait) | 0.750 | 0.422 | 0.928 | 1.398 | Yes |
| 390x844 (iPhone) | 0.462 | 0.260 | 0.572 | 0.861 | Yes |
| 320x568 (SE) | 0.563 | 0.317 | 0.697 | 1.050 | Yes |
| 2560x1440 | 1.778 | 1.000 | 2.200 | 3.314 | Yes |

At every tested breakpoint, the maximum scaled star x-position is well within the visible frustum half-extent. The margin ranges from 34% (at 390x844) to 34% (at 1920x1080), providing consistent breathing room.

**One note**: The formula clamps to `Math.min(1, ...)` so on ultra-wide monitors (21:9), stars keep their original positions. This is correct -- the original positions were designed for 16:9 and have adequate spacing at wider aspects.

**Verified: The xScale formula is correct and safe at all supported viewports.**

---

## Issue 6: WebGL Context Loss (No Additional Risk)

The plan does not introduce any new WebGL resources (no new textures, geometries, or materials). The existing context loss handler (`scene.js:505-514`) calls `onResize()` on restore, which re-configures the renderer. Since the plan only adds star position recalculation to `onResize()`, context restoration will automatically re-apply the correct star positions. No additional context loss handling is needed.

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Raycaster false positives at extreme mobile xScale | Low | Very Low | Safe at 320px+; only theoretical risk below 280px viewport |
| Nebula aesthetic mismatch on mobile | Low | Medium | Accept or clamp dust bounds only; nebula over-extension is ambient |
| Logo follow behavioral change at viewport edges | Low | Low | Z-index stacking naturally preserves correct behavior |
| Star label offset (existing issue) | Low | Medium | Plan acknowledges as P2 follow-up (FR-BETA-WEBGL-04 from my earlier review) -- not in scope for this plan but noted |

---

## Recommendations

1. **During implementation of star scaling**: Store `basePosition` as an array `[x, y, z]` in `userData` (the plan says this). Also store the module-level `xScale` variable so the render loop's dust mote clamping can reference it without re-computing each frame.

2. **Dust mote clamp scaling**: In the render loop (line 569), replace the hard-coded `3.5` x-clamp with `3.5 * xScale` (where xScale is the module-level variable updated in `onResize()`). This is a one-line change that prevents dust from appearing far outside the compressed star field on mobile.

3. **Leave nebula particle positions static**: Re-computing 1500 particle positions on every resize is not worth the cost. The nebula is a diffuse background effect and slight over-extension on narrow viewports is visually acceptable.

4. **Consider adding `basePosition` during star creation (line 360-384)**: The plan already specifies this. Ensure the stored base position is the original `project.position` array, not a THREE.Vector3 copy, to avoid unnecessary object allocation.

5. **Test the logo follow-cursor on the full-viewport hitzone**: Verify that `mouseleave` fires correctly when the cursor enters the sidebar panels. This should work due to z-index stacking, but should be manually verified during implementation since pointer event propagation with overlapping fixed-position elements can be browser-specific.
