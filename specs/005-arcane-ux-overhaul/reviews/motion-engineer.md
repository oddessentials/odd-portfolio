# Motion/Interaction Engineer Review

**Spec**: `specs/005-arcane-ux-overhaul/spec.md` v0.1.0
**Reviewer**: Motion/Interaction Engineer
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## Summary

The spec proposes six major UX features (sidebar hieroglyphs, targeting reticle, starfield noise reduction, node emphasis, constellation lines, parallax depth) plus a code cleanup story. From a motion and interaction engineering perspective, the animation concepts are sound, the timing targets are achievable with GSAP, and the reduced-motion strategy is largely consistent. However, there are several gaps in interaction choreography, GSAP integration specifics, and conflict resolution between new and existing systems that must be addressed before implementation.

---

## Findings

### 1. CRITICAL -- Reticle/Logo-Follow Cursor Conflict Unresolved

**Location**: US2 (Targeting Reticle) vs existing `initLogoFollow()` in `js/scene.js` lines 186-299

The spec introduces an SVG reticle that appears when hovering near a project node (FR-012 through FR-018). The existing codebase already has a logo-follow system where the brand logo tracks the cursor across the `#orb-hitzone` div, hides the cursor (`cursor: none`), and returns home on mouse leave. Both systems respond to mouse position simultaneously. The spec does not address the interaction between these two systems at all.

Specific conflicts:
- When the logo is following the cursor and the user hovers a star, the existing code sets `cursor: pointer` (scene.js line 769). The logo-follow system sets `cursor: none` when following (scene.js line 232). The reticle system adds a third visual layer. The user would see: no cursor, the logo trailing the pointer, AND a reticle locked on the star. This is visually chaotic.
- The logo's `gsap.quickTo` position updates happen on `mousemove` events. The reticle's position updates would need to happen per-frame via 3D-to-screen projection (FR-013). These are two different update cadences for mouse-tracking UI elements.
- When the reticle is active and the user moves away from a star, the reticle fades out (200ms per FR-016). During this fade, the logo should resume following behavior, but the spec does not describe this handoff.

**Amendment required**: Add a new acceptance scenario to US2 specifying the interaction priority:
> "Given the logo-follow system is active and the cursor enters a star's hover zone, When the reticle appears, Then the logo-follow system pauses (logo returns home or freezes in place), the system cursor remains hidden, and the reticle becomes the sole cursor-tracking visual element. When the cursor leaves all star hover zones and the reticle fades out, Then the logo-follow system resumes."

Additionally, specify which module owns cursor state management. Currently `scene.js` directly manipulates `hitzone.style.cursor` in the ticker (lines 769, 778). The reticle module will also need cursor control. A shared cursor-state arbiter should be specified or at minimum documented as an integration contract.

---

### 2. HIGH -- Reticle 100ms Appearance Budget is Tight but Achievable; Specification Lacks Hover-Zone Geometry

**Location**: SC-002, US2 scenarios 1 and 7

SC-002 specifies the reticle must appear within 100ms of cursor entering a star's hover zone. This is achievable with GSAP (`gsap.to` with `duration: 0.1`), but the spec does not define what "near a project node" means in screen-space terms. The existing raycaster in `scene.js` uses `raycaster.params.Sprite = { threshold: 0.15 }` (line 11), which is a world-space threshold of 0.15 units. This works for hit detection but is not necessarily the right trigger radius for the reticle.

Concerns:
- The reticle is an SVG overlay. Its appearance is triggered by... what? The existing raycast hit? A separate screen-space proximity check? The spec says "hovers near" which is ambiguous.
- If the reticle trigger uses the same raycaster as click detection, the threshold is coupled. Increasing it to make the reticle appear earlier could cause false positives on click. Decreasing it for click precision could make the reticle feel sluggish.

**Amendment required**: Add a functional requirement clarifying the reticle activation trigger:
> "FR-012a: The reticle activation zone MUST use the existing raycaster intersection with `Sprite.threshold` of 0.15 world units. The reticle appears when a raycast hit is detected. If a separate, larger activation radius is desired for earlier feedback, it MUST be implemented as a second raycast pass with a larger threshold, and click events MUST only fire on the tighter threshold."

---

### 3. HIGH -- Constellation Line Zone Transition Choreography Under-Specified

**Location**: FR-021, FR-022, US5 scenario 4

FR-022 says "previous zone's lines MUST fade out before the new zone's lines draw in." This sequential constraint (fade-out THEN draw-in) has timing implications:

- If the fade-out takes 300ms and the draw-in takes 500ms, the user sees 300ms of emptiness during a zone transition. During rapid scrolling through all three zones, this dead time accumulates.
- The spec says "fully reversible on scroll-back" (US5 scenario 4) but does not specify what happens if the user scrolls back mid-transition. If Zone A lines are at 50% fade-out and Zone B lines are at 0% draw-in, scrolling back should... what? Reverse the fade-out? Instantly restore Zone A? The spec is silent.
- The existing `handleScrollProgress()` in `animations.js` (line 543) uses a simple zone-index comparison and fires tweens on zone change. Constellation line animation needs to integrate with this same trigger, but the sequential "fade then draw" constraint means the line system needs its own timeline state machine, not just a simple tween-on-change.

**Amendment required**: Add explicit timing values and mid-transition behavior:
> "FR-022a: Zone transition timing: previous zone's constellation lines fade out over 400ms (`power2.in`), new zone's lines begin draw-in after a 100ms overlap (starting at the 300ms mark of the fade-out, not waiting for full completion). Total transition: ~600ms.
> FR-022b: If the user scrolls to a third zone during an active transition, the in-progress transition MUST be killed immediately. The partially-visible lines from both zones fade out over 200ms, and the new zone's lines begin draw-in after the fast fade completes.
> FR-022c: If the user scrolls backwards during a transition, the outgoing zone's fade-out reverses (lines return to full opacity) and the incoming zone's partial draw-in reverses (lines retract). GSAP timeline `.reverse()` SHOULD be used for this behavior."

---

### 4. HIGH -- Parallax Mouse Tracking: gsap.quickTo vs Ticker Lerp Not Specified

**Location**: FR-026, US6 scenario 3

FR-026 says parallax movement must be "smooth and damped" but provides no specification for the smoothing approach. There are two standard approaches in the existing codebase:

1. **`gsap.quickTo()`** -- Already used for logo-follow (scene.js lines 237-239). Creates a persistent tween that can be updated with new target values. Duration and easing are set once. This is ideal for DOM element position tracking but less obvious for Three.js object group position offsets.

2. **Lerp in the ticker** -- The GSAP ticker already runs per-frame (scene.js line 700). A simple `currentOffset += (targetOffset - currentOffset) * 0.05` in the ticker callback would produce smooth damped motion without creating GSAP tweens.

The spec should specify the approach because:
- Using `gsap.quickTo()` for 3 parallax layers means 6 persistent quickTo instances (x and y per layer). Each creates an internal GSAP tween that runs until the target is reached. This is clean but adds overhead.
- Using lerp in the ticker is cheaper and gives direct control over the damping factor, but requires managing the target/current offset state manually.
- The constitution (Principle II) mandates the single `gsap.ticker.add()` loop. Both approaches are compatible, but the implementation strategy differs significantly.

**Amendment required**: Add to FR-026:
> "FR-026a: Parallax layer offsets MUST be computed using linear interpolation (lerp) inside the existing `gsap.ticker.add()` callback. Each layer stores a `targetOffset` (set from mouse position) and a `currentOffset` (lerped toward target each frame). The lerp factor MUST be configurable per layer (suggested: background=0.02, mid=0.05, foreground=0.08) to create differential damping that reinforces depth perception. No separate `gsap.quickTo()` instances or additional RAF loops."

---

### 5. MEDIUM -- Reticle Star-to-Star Transition Easing Not Specified

**Location**: FR-015, US2 scenario 3

FR-015 says the reticle must "smoothly animate between positions" when transitioning from star A to star B. It does not specify:
- Duration of the transition (200ms? 300ms? Should it match the 100ms appearance speed from SC-002?)
- Easing curve (linear would look mechanical; power2.out would overshoot slightly; sine.inOut would feel natural)
- Whether the transition is a direct line between screen positions or follows a curved path (MotionPathPlugin is listed as optional in the constitution)
- What happens if the user moves from star A to star B to star C in rapid succession. Each transition should be killable and replaced by the new one, not queued.

**Amendment required**: Add to FR-015:
> "FR-015a: The reticle star-to-star transition MUST have a duration of 200ms with `power2.inOut` easing. The transition is a direct linear interpolation of screen-space x/y coordinates. If a new target star is acquired during an active transition, the current transition MUST be killed (`gsap.killTweensOf`) and a new transition begins from the reticle's current interpolated position."

---

### 6. MEDIUM -- Per-Frame Reticle Position Tracking Creates Redundant Raycast

**Location**: FR-013

FR-013 says the reticle position must be "updated per frame via 3D-to-screen projection." The existing ticker already performs a raycast per frame (scene.js lines 754-780) to determine the hovered star. The reticle position update requires:
1. Identifying the targeted star (already done by the raycast).
2. Projecting the star's 3D world position to screen coordinates (using the existing `project3DtoScreen()` helper at scene.js line 103).

This does not require a second raycast. However, the spec's phrasing "updated per frame" implies continuous tracking even when the cursor is stationary. Since the star positions only change during scroll zone transitions (scale changes) or window resize, continuous per-frame projection is wasteful when idle.

**Amendment (advisory, not blocking)**: Consider specifying that reticle position updates occur:
- Per frame only while a GSAP tween is active on the targeted star's scale/position (during zone transitions or hover animation).
- On the frame when the hover target changes.
- On resize events.
- Otherwise, the cached screen position is reused.

This is an optimization that the implementer can decide, but noting it avoids an unnecessary per-frame matrix multiplication.

---

### 7. MEDIUM -- Sidebar Breathing/Shimmer Timing Not Specified

**Location**: FR-005, US1 scenario 3

FR-005 lists three intentional sidebar animated effects: breathing light cycle, shimmer pass, and optional scan-line sweep. US1 scenario 3 says "slow and intentional." But no timing values are provided:
- Breathing light cycle period? (Suggested: 4-6 seconds for a full inhale/exhale)
- Shimmer pass speed and direction?
- Scan-line sweep frequency?

These are shader-driven effects (they run in the sidebar fragment shader, not as GSAP tweens). The constitution's single-animation-loop mandate applies to JS-side animations, not shader uniforms driven by elapsed time. However, the `elapsed` time value that drives these effects must come from somewhere. Currently, the ticker computes `elapsed` in scene.js (line 701). The sidebar shader would need this value passed as a uniform.

**Amendment required**: Add to FR-005:
> "FR-005a: Breathing light cycle MUST have a period of 5 seconds (0.2 Hz) with sinusoidal easing. Shimmer pass MUST traverse the sidebar height over 8 seconds. Scan-line sweep, if included, MUST occur no more than once every 12 seconds. All timing is driven by a single `uTime` uniform passed from the GSAP ticker's elapsed time, not from a separate `performance.now()` call in the shader setup."

---

### 8. MEDIUM -- Reduced-Motion Compliance Has One Gap: Hover Scale

**Location**: FR-010, Constitution Principle III

FR-010 specifies "hover MUST scale the node to at least 1.6x base size with back-easing animation." The constitution (Principle III) says "Hover scale limited to 1.2x" under reduced motion. The spec's US4 scenario 3 does not have a reduced-motion acceptance scenario, and FR-010 has no reduced-motion exception.

The existing `handleStarEnter()` in scene.js (line 813) unconditionally scales to 1.6x with `back.out(3)` easing. Under reduced motion, this should be instant-set to 1.2x per the constitution.

**Amendment required**: Add:
> "FR-010a: Under `prefers-reduced-motion: reduce`, hover scale MUST be limited to 1.2x base size, applied instantly via `gsap.set()` with no easing animation. The glow halo intensification MUST also be instant."

---

### 9. MEDIUM -- FR-011 Opacity Dimming Lacks Transition Timing

**Location**: FR-011

FR-011 says "non-highlighted project nodes MUST dim slightly (reduced opacity to approximately 0.5)." The existing `handleScrollProgress()` in animations.js (line 582-593) only manipulates scale, not opacity. Adding opacity dimming is new behavior but the spec does not specify:
- Transition duration for the dim (should match the 0.3s used for scale changes at line 591?)
- Whether dimming applies to the star sprite material opacity, the glow halo, or both.
- What the opacity is for highlighted stars (1.0 presumably, but not stated).

**Amendment required**: Add:
> "FR-011a: Non-highlighted nodes dim to opacity 0.5 over 300ms (`power2.out`). Highlighted nodes maintain opacity 1.0. Opacity applies to the star sprite material. Under reduced motion or Tier 3, opacity changes are applied instantly via `gsap.set()`."

---

### 10. LOW -- Draw-On Effect Implementation Approach Not Specified

**Location**: FR-021

FR-021 specifies a "draw-on effect (line extends from one node to the next)" but does not specify the implementation approach. The Key Entities section (line 215) acknowledges this is an open question: "Can be implemented as WebGL line geometry (THREE.Line) or canvas/SVG overlay."

From a motion perspective:
- **THREE.Line with `setDrawRange()`**: The draw-on is achieved by animating the draw range count. This is the most performant approach (no DOM, no layout) and integrates naturally with the WebGL scene. GSAP can tween a proxy object whose setter calls `geometry.setDrawRange()`.
- **SVG overlay with `stroke-dashoffset`**: The classic SVG line-draw technique. Easy to implement, well-understood easing, but requires per-frame screen-space projection of endpoints (same concern as Finding 6).
- **Canvas 2D overlay**: Maximum control but requires manual line rendering.

**Advisory (not blocking)**: The plan phase should select the approach. For consistency with the reticle (SVG overlay) and to keep WebGL draw calls within budget, SVG overlay with `stroke-dashoffset` animated via GSAP is the recommended approach. However, if the line count is high (e.g., 3 zones x 3 connections = 9 lines), THREE.Line with `setDrawRange` avoids DOM overhead.

---

### 11. LOW -- Node Emphasis Glow Halo (FR-009) Implementation Unspecified

**Location**: FR-009

FR-009 says project nodes need "a visible glow halo (separate glow sprite or shader-based bloom effect) extending beyond their core sprite." The current implementation uses a single sprite per star (scene.js line 502) with additive blending that provides some natural glow. The spec does not clarify whether the existing additive-blended sprite constitutes the "halo" or whether a second, larger sprite is required.

Adding 7 additional halo sprites would add 7 draw calls to the steady-state count. The constitution budget is <30 steady state. Current count is approximately: 3 nebula layers + 7 star sprites + 1 dust motes + 4 post-processing passes = 15. Adding 7 halos brings it to 22, which is within budget but should be noted.

**Advisory**: Clarify in the plan whether the glow halo is achieved by increasing the existing star sprite size + adjusting the gradient falloff, or by adding a separate halo sprite per node.

---

### 12. LOW -- Mobile Reticle Replacement Unspecified

**Location**: Edge Cases (line 146)

The edge cases section mentions "reticle is replaced by touch-first interaction" on mobile but provides no specification of what that touch-first interaction looks like. Since mobile is explicitly out of primary scope (constitution Principle I: "Excluded from POC scope"), this is not blocking, but the implementer should know whether to simply hide the reticle on mobile or provide an alternative.

**Advisory**: Add a note to FR-012: "On mobile (below 768px), the reticle SVG element is not rendered. Star interaction relies on the existing touch-tap raycast system in scene.js."

---

## GSAP Ticker Integration Assessment

The constitution mandates a single `gsap.ticker.add()` loop (Principle II). The existing ticker callback in scene.js (lines 700-788) already handles:
- Nebula rotation
- Star idle pulse
- Dust mote Brownian drift
- Raycasting
- Rendering

The new features add per-frame work:
- Reticle screen-position projection (lightweight: one `Vector3.project()` + DOM style write)
- Parallax layer offset lerp (lightweight: 6 lerp operations + 3 group position writes)
- Constellation line endpoint projection (if SVG approach: 2 projections per visible line)
- Sidebar shader time uniform update (one uniform write)

All of these can and should be integrated into the existing ticker callback. The spec's modularization story (US7, FR-031) suggests dedicated modules for each feature. The implementation pattern should be: each module exports an `update(elapsed, deltaTime)` function, and the central ticker calls each module's update function. This is compatible with the single-loop mandate.

**No amendment needed** for this concern -- it is well-handled by the combination of FR-031 (modularization) and the constitution's single-loop mandate. But the plan should explicitly describe the `update()` function pattern.

---

## Reduced-Motion Compliance Summary

| Feature | Spec Coverage | Gap? |
|---------|--------------|------|
| Sidebar breathing/shimmer/scan | FR-006: suppressed | No |
| Reticle idle animation (rotation/pulse) | FR-014: suppressed | No |
| Reticle appearance transition | US2.7: appears instantly | No |
| Constellation line draw-on | FR-024: static lines | No |
| Constellation line pulse/glow | FR-024: suppressed | No |
| Parallax mouse tracking | FR-029: suppressed | No |
| Node hover scale | Not addressed | **YES (Finding 8)** |
| Node opacity dimming transition | Not addressed | **YES (Finding 9)** |
| Star-to-star reticle transition | Not addressed | **Minor gap** |

The star-to-star reticle transition (FR-015) under reduced motion should be instant (no smooth animation between positions). The spec's US2.7 only covers the initial appearance, not transitions. Add: "Under reduced motion, the reticle jumps instantly to the new star's position with no transition animation."

---

## Final Verdict

The spec is well-structured and the motion concepts are achievable with the existing GSAP + Three.js stack. The critical issue is the logo-follow/reticle conflict (Finding 1), which will cause visible user-facing bugs if not resolved before implementation. The high-severity findings (2, 3, 4) address specification gaps that would force the implementer to make design decisions that should be made at the spec level. The medium findings (5, 6, 7, 8, 9) are important for quality but can be resolved during planning.

**Approve with the condition that Findings 1-4 are incorporated as amendments before the spec is finalized.**
