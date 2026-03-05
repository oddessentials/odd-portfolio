# Devil's Advocate Review: 005 Arcane UX Overhaul Plan

**Date**: 2026-03-04
**Reviewer**: Devil's Advocate (automated)
**Artifacts Reviewed**: plan.md, spec.md, research.md, data-model.md, constitution.md, scene.js, animations.js, performance.js, app.js, data.js, interactions.js
**Verdict**: APPROVED WITH AMENDMENTS

---

## Critical Issues (must fix before implementation)

### C-1: Per-Layer Rotation Conflict With Parallax Position Offsets

The plan states parallax will apply `position.x` / `position.y` translations to each nebula layer. However, `scene.js` lines 706-710 already apply per-layer rotation on every tick:

```js
nebulaLayers.forEach((layer, i) => {
  const speed = 0.02 + i * 0.008;
  layer.rotation.y = elapsed * speed;
  layer.rotation.x = elapsed * speed * 0.3;
});
```

When a Three.js Object3D has both rotation and position, the position is in the parent's coordinate space -- but `position.x`/`position.y` translations are applied BEFORE the object's own rotation. This means the parallax offset direction will rotate with the layer's own drift rotation. A mouse-right parallax offset on a layer that has rotated 90 degrees will appear as a mouse-down offset. The effect will be subtle due to small rotation magnitudes (~0.02 rad/s), but over time (60+ seconds) the drift rotation accumulates and the parallax offset directions will visibly decohere from mouse position.

**Fix**: The parallax system must either (a) apply offsets to the geometry buffer positions directly (expensive), (b) wrap each layer in a parent Group and apply parallax to the parent while rotation stays on the child, or (c) compensate for current rotation when computing offset direction. This interaction is not documented anywhere in the plan, spec, or research.

### C-2: interactions.js Is 565 Lines and Not Addressed by the Refactoring Plan

The plan's Phase 1 refactoring targets scene.js (845 lines) and animations.js (821 lines), but completely ignores `interactions.js` at **565 lines**. The spec's FR-031 and the plan's Phase 1 step 8 both state "all files under 400 lines." The plan's project structure lists `interactions.js` with the comment "(EXISTING, may shrink)" but provides no extraction plan.

At 565 lines, interactions.js exceeds the 400-line limit by 41%. This is not a "may shrink" situation -- it requires active extraction of ~165+ lines.

**Fix**: Add an explicit extraction target for interactions.js in Phase 1. Candidates: hamburger menu logic (lines 276-301, ~25 lines), nav hover effects (lines 456-508, ~52 lines), tagline expand/collapse (lines 513-550, ~37 lines), or the entire panel management system (~200 lines to a `panel.js`).

### C-3: performance.js Is 428 Lines and Not Addressed by the Refactoring Plan

Similarly, `performance.js` is **428 lines** -- already exceeding the 400-line limit. The plan's project structure lists it as "(MODIFIED)" but proposes no extraction. Adding `tier-change` event dispatch (Phase 1, step 6) will increase the line count further.

**Fix**: Extract the supernova burst system (lines 118-248, ~130 lines) into a dedicated `burst.js` module, leaving performance.js focused on post-processing and auto-tier logic.

---

## High-Priority Concerns (should fix)

### H-1: Draw Call Math Is Optimistic -- Baseline Count Is Not 18

The plan claims "18 current" draw calls as baseline, projecting ~22 with sidebar planes. Let me count the actual current draw calls from the codebase:

**Rendering objects (scene.js)**:
- 3 nebula Points layers (3 draw calls)
- 7 star Sprites (7 draw calls)
- 1 dust motes Points (1 draw call)
- Total scene objects: **11 draw calls**

**Post-processing (performance.js, when composer active)**:
- RenderPass (1 full-scene render -- counted above)
- UnrealBloomPass (internally: threshold pass, 2x blur horizontal, 2x blur vertical, composite = ~5 passes)
- VignetteShader pass (1 draw call)
- OutputPass (1 draw call)
- Total post-processing: ~**7 additional** draw calls

**Burst pool** (performance.js, when inactive): 0 (sprites hidden)

**Estimated actual baseline**: 11 + 7 = **~18 draw calls**. This matches the plan's claim.

However, the plan does not account for the burst pool becoming active during star clicks. When a supernova fires, up to 31 sprites become visible simultaneously (20 sparks + 1 ring + 10 rays). At that moment, draw calls spike to 18 + 31 = **49 draw calls** -- right at the hard limit.

Adding 2 sidebar planes pushes the burst peak to **51 draw calls**, exceeding the hard limit.

**Fix**: Acknowledge that supernova bursts already push near the hard limit. Consider converting the burst pool to an instanced approach, or document that the 50 draw call hard limit applies to "steady state + sidebar" and burst is a transient exception already tolerated.

### H-2: Scroll-Driven nebulaGroup.rotation.y Is Mentioned But Per-Layer Drift Rotation Is Not

The plan, spec, and research all correctly state that `nebulaGroup.rotation.y` (scroll-driven, animations.js line 626) is "preserved" and parallax composes "independently." However, none of these documents acknowledge the existence of the **per-layer individual rotation drift** (scene.js lines 706-710) which is an entirely separate rotation system from the group rotation.

The research document (Topic 4) says: "scroll rotates the whole nebula group, parallax offsets individual layer positions within it." This is incomplete. There are THREE simultaneous transform effects on each nebula layer:

1. `nebulaGroup.rotation.y` -- scroll-driven (animations.js)
2. `layer.rotation.y` and `layer.rotation.x` -- time-based drift (scene.js ticker)
3. `layer.position.x` and `layer.position.y` -- mouse-driven parallax (proposed)

The interaction between (2) and (3) is the root of Critical Issue C-1.

**Fix**: The research document and plan must explicitly address all three rotation/translation systems and specify how they compose. The implementation must handle system (2) to prevent the drift rotation from skewing parallax direction.

### H-3: Logo-Follow Extraction Scope Mismatch

The plan says "Extract `logo-follow.js` from `scene.js` (lines 21-299)." Lines 21-299 contain:

- Lines 21-28: Logo state variables (`logoEl`, `logoQuickToX`, etc.)
- Lines 30-33: `reducedMotionQuery` and `prefersReducedMotion` (NOT logo-specific)
- Lines 37-45: `detectWebGL()` (NOT logo-specific)
- Lines 50-67: `createStarTexture()` (NOT logo-specific)
- Lines 72-88: `createDustTexture()` (NOT logo-specific)
- Lines 93-98: `randomVolumePoint()` (NOT logo-specific)
- Lines 103-112: `project3DtoScreen()` (NOT logo-specific -- used by label system, needed by reticle)
- Lines 118-151: `showStarLabel()` / `hideStarLabel()` (NOT logo-specific)
- Lines 156-299: `logoReturnHome()` and `initLogoFollow()` (logo-specific)

The actual logo-follow code is lines 21-28 (state) + lines 156-299 (functions) = approximately **150 lines**, not "~280 lines." The intervening ~130 lines (33-151) are unrelated utilities that the plan separately says go to `textures.js` and the reticle module.

**Fix**: Correct the line count estimate. The extraction is: (a) logo state vars (8 lines), (b) `logoReturnHome` + `initLogoFollow` (143 lines). Total ~150 lines for `logo-follow.js`. The "~280 lines" claim in the plan and spec is inaccurate by ~50%.

### H-4: The handleStarEnter/handleStarExit Functions Are Not Allocated to Any Module

`scene.js` lines 813-840 contain `handleStarEnter()` and `handleStarExit()` which manage hover scale animations and call `showStarLabel()`/`hideStarLabel()`. The plan says the reticle module "absorbs" star labeling (FR-032), but does not specify where `handleStarEnter`/`handleStarExit` themselves move to.

These functions are called from the ticker's raycasting block (lines 757-780). The plan's tick order has raycasting at step 3 and reticle at step 4, implying the raycasting still happens in scene.js. If so, `handleStarEnter`/`handleStarExit` need to remain in scene.js or move to reticle.js with the raycasting system calling into the reticle module.

**Fix**: Explicitly assign `handleStarEnter`/`handleStarExit` to either scene.js (remaining raycasting code) or reticle.js. Currently they are orphaned in the extraction plan.

### H-5: No Zone-Change Event for Scroll Progress 0 (Default State)

The plan's constellation lines module listens for `zone-change` CustomEvents (Phase 1, step 5). The `handleScrollProgress()` function in animations.js only transitions zones when `newZoneIndex !== activeZoneIndex`. At page load, `activeZoneIndex = -1`. When the user scrolls into zone 0, a zone-change fires. But what about the case where the user scrolls BACK to the top (progress < 0.0 or at the very top) and `newZoneIndex` returns to -1? The existing code handles this in the `else` block (lines 599-621) but the plan says scroll-zones.js will "dispatch zone-change CustomEvent." The plan does not specify that a `zoneIndex: -1` event (meaning "no zone") is dispatched when scrolling back to default. Without this, constellation lines from the first zone would never receive a deactivation signal via the event system.

**Fix**: Explicitly specify that `zone-change` dispatches with `detail: { zoneIndex: -1, zone: null }` when returning to the default (no-zone) state.

---

## Medium-Priority Observations (consider fixing)

### M-1: MSDF Texture GPU Memory Calculation Inconsistency

The data model says: "maxGpuMemory: 262KB (256x256 RGBA uncompressed)". But the spec (FR-035) says: "MSDF texture MUST be 256x256 resolution (262KB GPU memory), stored as a 3-channel RGB PNG under 64KB file size." And research Topic 1 says "256x256 resolution is standard... keeps GPU memory at 262KB."

256x256 x 4 bytes (RGBA) = 262,144 bytes = 256KB. But if it is 3-channel RGB as the spec says (FR-002), Three.js with WebGL will upload it as RGBA anyway (WebGL does not support RGB-only internal formats in most implementations). So the 262KB figure is approximately correct regardless.

However, the data model field says "channels: 3 (RGB) or 4 (RGBA)" -- this ambiguity should be resolved. If msdfgen outputs 3-channel PNG, Three.js TextureLoader will load it as RGBA with alpha=255 fill. The GPU memory is 262KB either way. This is cosmetic but creates confusion.

**Fix**: Standardize on "RGBA, 262KB GPU memory" in all documents since that is what the GPU will actually allocate.

### M-2: Sidebar Plane Z-Position Creates Depth Sorting Ambiguity

The data model says sidebar planes are at `position.z = 0` (scene origin depth). The star nodes have z-positions ranging from -0.6 to 0.5 (from data.js). Nebula particles range from z=-3 to z=2. The sidebar planes at z=0 will be depth-sorted among the nebula particles and stars.

Since sidebar planes use a custom ShaderMaterial (opaque or semi-transparent?), they may occlude stars or nebula particles near z=0. The plan does not specify the material's `depthWrite`, `depthTest`, or `transparent` properties, nor the render order.

**Fix**: Specify that sidebar planes should have `depthTest: false` and a fixed `renderOrder` value (e.g., -1) to render behind all scene objects, or document how they interact with the depth buffer. Alternatively, specify `side: THREE.DoubleSide` and `transparent: true` with appropriate blend mode.

### M-3: Reticle Z-Index Placement May Conflict With Project Panel

The spec says reticle SVG is at z-index 24 (between hitzone at 19 and star-labels at 25). The project overlay panel presumably has a very high z-index (it covers everything). However, the plan does not verify the current z-index stack. If any existing element uses z-index 24, there will be a conflict. The plan should document the complete z-index map.

### M-4: Chromatic Twinkle System Interaction With Zone Color Overlay

FR-008 specifies "a brief color flash (under 500ms) on a single particle." The nebula shader already has `uZoneColor` and `uZoneInfluence` uniforms that overlay zone colors during scroll. A chromatic twinkle occurring during a zone transition could produce a visually confusing interaction (twinkle color mixing with zone color overlay).

**Fix**: Consider suppressing twinkle during zone transitions, or document that twinkle fires independently of zone color state.

### M-5: Reduced Motion Handling Inconsistency for Hover Scale

The spec (FR-010) says hover scale under reduced motion is 1.2x via `gsap.set()`. The current `handleStarEnter()` in scene.js (line 817) unconditionally uses `gsap.to()` with `back.out(3)` easing and 1.6x scale. Neither the plan nor the spec describes WHERE the reduced motion check is added to the hover handler. The plan's Phase 2 step 5 says "Adjust hover scale for reduced-motion compliance" but doesn't specify whether this goes in the existing handleStarEnter/Exit or in the reticle module. Since reticle replaces star labeling but the hover scale animation is separate, this needs clarification.

### M-6: Chain Topology for Constellation Lines May Look Arbitrary

The data model specifies "chain topology (not fully connected graph)" for constellation lines: N-1 lines connecting nodes in sequence. For the "Developer Tools" zone with 3 projects (`odd-ai-reviewers` at [1.8, 1.0], `repo-standards` at [2.2, -0.4], `odd-self-hosted-ci` at [-0.8, -1.2]), the chain would connect them in array order. This produces two lines:

1. odd-ai-reviewers -> repo-standards (nearby, looks intentional)
2. repo-standards -> odd-self-hosted-ci (spans nearly the entire viewport, looks like a random slash)

The visual result of array-order chaining depends heavily on the spatial arrangement of projects. An alternative like minimum spanning tree or nearest-neighbor ordering would produce more visually coherent constellations.

**Fix**: Consider using spatial proximity ordering for the chain instead of array order, or define explicit connection pairs in `CONSTELLATION_ZONES`.

### M-7: The Plan Does Not Address the Existing Import Cycle Risk

The current dependency graph has a subtle near-cycle: `animations.js` imports from `scene.js`, `performance.js`, `data.js`, and `interactions.js`. `interactions.js` imports from `data.js`. After refactoring, if `scroll-zones.js` needs to import from `scene.js` (for `nebulaGroup`, `starNodes`, etc.), AND `scene.js` needs to call scroll-zones' event dispatching, a cycle could form.

The plan says "new modules receive references via init() parameters" which avoids direct imports. But the plan does not verify that the EXISTING import from `animations.js` -> `scene.js` is eliminated after extraction. Post-extraction, `animations.js` (reveal sequence only) still needs `nebulaLayers`, `starNodes`, `camera` from `scene.js`. This import remains. The question is whether `scroll-zones.js` also imports from `scene.js` or receives everything via `init()`.

**Fix**: Explicitly confirm that `scroll-zones.js` receives ALL scene references via `init()` and does NOT import from `scene.js`. Same for `terminal.js`. The plan's dependency graph implies this but does not state it unambiguously.

---

## Low-Priority Notes (nice to have)

### L-1: Parallax Layer Z-Range Overlaps in Research Document

Research Topic 4 specifies z-ranges:
- Layer 0 (background): [-3, -1]
- Layer 1 (mid): [-1.5, 0.5]
- Layer 2 (foreground): [0, 2]

These ranges overlap: Layer 0 and Layer 1 share [-1.5, -1], and Layer 1 and Layer 2 share [0, 0.5]. The research says "non-overlapping bands" but the actual ranges overlap. This is not necessarily wrong (particles in the overlap zone would need to be reassigned to one band), but it contradicts the stated intent.

### L-2: "~22 Draw Calls" Projection Should Be "~20"

Per the draw call analysis: 3 nebula + 7 stars + 1 dust + 7 post-processing = ~18. Adding 2 sidebar planes = **20**. The plan says "~22" and the discrepancy is unexplained. The extra 2 may account for burst pool overhead or miscounting, but should be documented.

### L-3: msdfgen CLI Availability on Windows

The project runs on Windows 11 (per environment). The plan assumes `msdfgen` CLI is available. The msdfgen GitHub project provides source code and pre-built binaries for some platforms, but Windows availability may require manual compilation or using an alternative tool like msdf-atlas-gen. This is a Phase 0 pre-requisite risk.

### L-4: Missing Test for Simultaneous Reticle + Scroll + Parallax

The plan's Phase 7 integration testing (steps 1-12) does not include a specific test case for: "user hovers star (reticle active), scrolls (zone transition, constellation lines animate, nebulaGroup rotates), AND moves mouse (parallax offsets update) simultaneously." This is the highest-load interaction scenario and should be explicitly tested.

---

## Cross-Artifact Consistency Check

### Plan vs Spec Alignment

- **CONSISTENT**: Scroll-driven `nebulaGroup.rotation.y` preservation is stated in both (plan Phase 5 step 6, spec FR-025/FR-026 notes, spec assumptions).
- **CONSISTENT**: Draw call projections match (~22 in both).
- **CONSISTENT**: MSDF texture spec (256x256, RGB, 64KB file, 262KB GPU) matches.
- **CONSISTENT**: Reduced motion handling specified for all 6 features in both.
- **INCONSISTENT**: Plan says logo-follow extraction is "~280 lines" (Phase 1 step 1). Spec FR-031 says "~280 lines." Actual logo-specific code is ~150 lines. Both documents carry the same inaccurate estimate.
- **INCONSISTENT**: Plan does not address interactions.js (565 lines) or performance.js (428 lines) exceeding 400-line limit. Spec FR-031 says "all files under 400 lines."
- **GAP**: Spec FR-011 adds opacity dimming for non-highlighted nodes (0.5 over 300ms). Plan Phase 2 step 4 covers this. Both are consistent.

### Plan vs Research Alignment

- **CONSISTENT**: MSDF pipeline steps match.
- **CONSISTENT**: Parallax redistribution approach matches.
- **CONSISTENT**: SVG constellation line technique matches.
- **CONSISTENT**: Reticle/logo-follow handoff protocol matches.
- **INCONSISTENT**: Research Topic 4 claims "non-overlapping bands" but the z-ranges overlap (see L-1).
- **GAP**: Research does not address the per-layer drift rotation (scene.js lines 706-710) and its interaction with parallax position offsets.

### Plan vs Data Model Alignment

- **CONSISTENT**: All 6 entities defined in the data model match the plan's module structure.
- **CONSISTENT**: Cursor state arbitration model matches the reticle/logo-follow handoff.
- **CONSISTENT**: Constellation line chain topology matches.
- **GAP**: Data model does not specify render order or depth settings for sidebar planes.

### Plan vs Constitution Alignment

- **COMPLIANT**: Principle I -- plan acknowledges amendment needed for MSDF shader (tracked as pre-requisite).
- **COMPLIANT**: Principle II -- projected 22 draw calls (under 30). MSDF texture 262KB GPU + existing ~452KB = ~714KB (under 1MB). DPR clamped. Single ticker.
- **COMPLIANT**: Principle III -- reduced motion handled for all features. Reticle label accessible.
- **COMPLIANT**: Principle IV -- reticle label is DOM element. Constellation lines are SVG. No text in WebGL.
- **COMPLIANT**: Principle V -- sidebars get frame material richness. Nodes carry color. Nebula desaturated.
- **COMPLIANT**: Principle VI -- MSDF is 1 small texture. Construction lines procedural. Star textures canvas-generated.
- **COMPLIANT**: Principle VII -- tier degradation paths specified. Mobile graceful degradation.
- **COMPLIANT**: Principle VIII -- MSDF source SVG verified to exist.
- **VIOLATION**: Constitution says "all files under 400 lines" and the plan fails to address interactions.js (565 lines) and performance.js (428 lines).

### Plan vs Current Codebase Alignment

- **ACCURATE**: scene.js is 845 lines (plan says 845).
- **ACCURATE**: animations.js is 821 lines (plan says 821, spec says 821).
- **ACCURATE**: data.js is 177 lines (plan says 177).
- **NOT ADDRESSED**: interactions.js is 565 lines.
- **NOT ADDRESSED**: performance.js is 428 lines.
- **INACCURATE**: Plan claims logo-follow is "lines 21-299" (~280 lines) but lines 33-151 are unrelated utilities.
- **ACCURATE**: MSDF source SVG exists at `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg`.
- **ACCURATE**: `CONSTELLATION_ZONES` data structure exists in data.js and provides zone-to-project mappings.
- **ACCURATE**: `nebulaGroup.rotation.y` scroll behavior exists in animations.js line 626.

---

## Risk Assessment

### Risk 1: Parallax + Per-Layer Drift Rotation Interaction (HIGH)

**Risk**: The parallax system applies position translations to layers that are simultaneously being rotated by the drift system. As drift rotation accumulates, parallax offset directions decohere from mouse position. After 60 seconds, a layer rotating at 0.036 rad/s will have rotated ~2.16 radians (~124 degrees), making parallax offsets appear to move in roughly the opposite direction from the mouse.

**Impact**: Visually disorienting parallax behavior that worsens over time. Users who leave the page open will see degraded parallax quality.

**Mitigation**: Wrap each nebula layer in a parent Group. Apply drift rotation to the child Points object and parallax position offset to the parent Group. This separates the two transform systems cleanly. Alternatively, apply parallax offsets to geometry buffer positions (more expensive but decoupled from object transforms).

### Risk 2: File Size Compliance Failure (MEDIUM)

**Risk**: The plan does not account for interactions.js (565 lines) and performance.js (428 lines). After adding tier-change event dispatch and the new feature modules, there is no extraction plan for these files. The final line-count audit (Phase 7 step 12) will fail.

**Impact**: Fails the 400-line constitution requirement. Requires unplanned refactoring during the integration phase, which is the worst time to introduce structural changes.

**Mitigation**: Add extraction targets for interactions.js and performance.js to Phase 1. Suggested: extract panel management to `panel.js`, extract burst system to `burst.js`.

### Risk 3: Phase 2-3 Ordering May Break Hover Labels (MEDIUM)

**Risk**: Phase 3 step 9 says "Remove existing `showStarLabel()`/`hideStarLabel()` from scene.js (absorbed by reticle)." But Phase 2 (starfield hierarchy) is implemented before Phase 3 (reticle). During Phase 2 development, hover still uses the old label system. If Phase 2 is tested independently before Phase 3 is complete, everything works. But if someone partially implements Phase 3 (removing old labels) before the reticle system is fully wired, hover feedback disappears entirely.

**Impact**: Temporary loss of hover feedback during implementation. Could cause confusion during testing.

**Mitigation**: Ensure the old label system is NOT removed until the reticle system is confirmed functional. Add a gate check: "reticle tracks at least one star correctly" before removing showStarLabel/hideStarLabel.

---

## Sign-Off

**Verdict**: APPROVED WITH AMENDMENTS

The plan is well-structured, thorough, and demonstrates careful analysis of the existing codebase. The draw call projections, texture memory budget, and SVG overlay approach are sound. The module dependency graph is clean and acyclic. The scroll rotation preservation is correctly documented.

However, three amendments are required before implementation begins:

1. **[Critical]** Address the per-layer drift rotation / parallax position interaction (C-1). The implementation must specify how these two systems compose without directional decoherence. A parent-Group wrapper approach is recommended.

2. **[Critical]** Add extraction plans for interactions.js and performance.js (C-2, C-3) to achieve the 400-line-per-file constitution requirement.

3. **[High]** Correct the logo-follow extraction line count from "~280 lines" to "~150 lines" (H-3) and explicitly assign handleStarEnter/handleStarExit to a module (H-4).

Additionally, strongly recommended:
- Specify zone-change dispatch for `zoneIndex: -1` (H-5).
- Add explicit depth/render-order configuration for sidebar planes (M-2).
- Add integration test for simultaneous reticle + scroll + parallax (L-4).

With these amendments applied, the plan is ready for implementation.
