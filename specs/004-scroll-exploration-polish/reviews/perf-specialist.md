# Performance Specialist Review — 004-scroll-exploration-polish

**Reviewer**: Performance Optimization Specialist
**Spec Version**: 0.2.0
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## Summary

The spec is well-structured and performance-aware. The scroll-driven zone system adds minimal GPU load since zone transitions update existing uniforms and DOM text rather than creating new draw calls. The main concerns are ScrollTrigger callback frequency, scroll-to-paint latency achievability, and the auto-tier benchmark gap for scroll-specific performance issues. All are addressable without spec redesign.

---

## 1. ScrollTrigger Callback Cost (FR-034)

**Severity: LOW**

### Analysis

ScrollTrigger's `onUpdate` callback fires on every scroll event — typically 60+/sec during active scrolling (matching `requestAnimationFrame` cadence on modern browsers, more with high-frequency scroll events on trackpads at 120Hz+).

Each callback must:
1. Read `self.progress` (a float 0–1) — **~0.001ms** (single property access)
2. Determine active zone via 3 range checks against `CONSTELLATION_ZONES[].scrollStart/scrollEnd` — **~0.005ms** (3 comparisons)
3. If zone changed: update nebula uniforms (hue shift value on PointsMaterial color buffer or a uniform) — **~0.05ms** (color lerp + buffer write)
4. If zone changed: update star scales for zone's `projectIds` (3–4 sprites max per zone) — **~0.02ms** (3-4 GSAP quickTo calls or direct scale sets)
5. If zone changed: update DOM status text — **~0.1ms** (single `textContent` write)

**Per-callback cost estimate: ~0.01ms (no zone change) / ~0.2ms (zone change)**

This is negligible against the 16.67ms budget. The existing render loop already consumes roughly:
- Nebula layer rotation: ~0.05ms
- Star pulse: ~0.02ms (7 sprites)
- Dust mote Brownian drift: ~0.3ms (180 particles, tight loop)
- Raycasting: ~0.1ms (7 sprites)
- Composer render (4 passes): ~8–12ms on integrated GPU

**Total existing render cost: ~9–13ms**, leaving 3.5–7.5ms headroom. The ScrollTrigger callback at ~0.2ms peak fits comfortably.

### Recommendation

No changes needed. The callback cost is trivially small. One optimization to note: zone boundary checks should use a `currentZoneIndex` cache and only run the full zone-change logic when the index actually changes. This avoids unnecessary GSAP tween creation on every scroll tick.

---

## 2. Draw Call Budget (FR-035)

**Severity: LOW — spec is correct**

### Current Steady-State Draw Call Count

| Element | Draw Calls |
|---------|-----------|
| Nebula layer 0 (800 particles) | 1 |
| Nebula layer 1 (400 particles) | 1 |
| Nebula layer 2 (300 particles) | 1 |
| Star sprites (7) | 7 |
| Dust motes (180 particles) | 1 |
| Burst pool container (idle) | 0 |
| Scene render (RenderPass) | 1 |
| UnrealBloomPass (internal) | ~4–5 |
| VignetteShader pass | 1 |
| OutputPass | 1 |
| **Total** | **~18–19** |

Zone transitions add:
- Nebula uniform/color updates: **0 extra draw calls** (modifies existing material properties)
- Star scale changes: **0 extra draw calls** (GSAP tweens on existing sprite scales)
- Status text DOM update: **0 draw calls** (DOM operation, not WebGL)
- Nebula rotation (proportional to scroll): **0 extra draw calls** (modifies `layer.rotation.y`)

**Peak during zone transition: ~18–19 draw calls — identical to steady state.**

The spec's "under 32 peak" target is correct and conservative. There are no hidden draw call sources from zone transitions. The only scenario that could spike draw calls is if a supernova burst fires simultaneously (adds up to 31 visible sprites from the pool), but that's user-initiated (click) and transient (0.9s), not scroll-triggered.

### Recommendation

The spec could tighten the target from "under 32" to "under 20" for zone transitions specifically, since they add literally zero draw calls. However, "under 32" provides headroom for future additions, so it's defensible as-is.

---

## 3. Compositing Layers

**Severity: MEDIUM**

### Analysis

Current compositing layer count is approximately 10–12:
- `<canvas>` (WebGL, always composited)
- `#app-shell` (root grid container)
- Left sidebar (may composite due to `overflow-y: auto`)
- Right sidebar (same)
- Command line bar
- Star label container (`position: absolute`, `opacity` transitions)
- Project overlay (when open, `position: fixed` + backdrop)
- Greek key shimmer (CSS animation promotes to own layer)
- Frame header band
- Logo element (`position: fixed` during follow, GSAP transforms)

ScrollTrigger pinning adds:
- **Pin wrapper element**: ScrollTrigger wraps the pinned element in a `<div>` with `position: fixed` and `will-change: transform`. This creates **1 additional compositing layer** for the pin wrapper.
- **Pin spacer element**: A `<div>` that maintains document flow. This is typically **not** composited (just a height spacer in normal flow).

**Expected impact: +1 compositing layer**, bringing total to 11–13. This is within acceptable bounds — Chrome handles 20+ layers routinely. The concern would be if the pin wrapper promotes a large subtree (the entire `#app-shell`), which could increase GPU memory for the composited layer texture.

### Recommendation

**Amendment requested**: The spec should specify that ScrollTrigger pins a **dedicated scroll wrapper** element (not `#app-shell` directly) to minimize the composited area. Pin the inner content area rather than the root grid. This prevents the entire viewport-sized grid from being promoted to a compositing layer when only the visual content needs pinning.

Suggested implementation pattern:
```html
<div id="scroll-container"> <!-- ScrollTrigger trigger + artificial height -->
  <div id="app-shell">      <!-- Pinned element -->
    ...existing layout...
  </div>
</div>
```

This keeps the composited layer to the `#app-shell` content (which is already viewport-sized and composited for the canvas) rather than introducing a new oversized layer.

---

## 4. Scroll-to-Paint Latency (SC-007)

**Severity: MEDIUM**

### Analysis

The spec targets <50ms for scroll-to-paint latency. Let's trace the pipeline:

1. **Scroll event fires** → ScrollTrigger processes (runs synchronously in the scroll event handler) — **~0.2ms**
2. **ScrollTrigger `onUpdate` callback** → updates uniforms/scales — **~0.2ms**
3. **Wait for next GSAP ticker frame** → GSAP ticker runs at RAF cadence (~16.67ms interval). If the scroll event fires mid-frame, the worst case is waiting nearly one full frame. — **0–16.67ms**
4. **GSAP ticker executes** → render loop runs, composer.render() produces the frame — **~10ms**
5. **Browser composites and paints** — **~1–2ms**

**Theoretical pipeline:**
- **Best case**: Scroll event fires just before a ticker frame → ~12ms total
- **Worst case**: Scroll event fires just after a ticker frame → ~28ms total
- **Average case**: ~20ms

**50ms target is achievable** under normal conditions. The theoretical worst case of ~28ms is well under 50ms.

However, there is a subtlety: ScrollTrigger's `onUpdate` mutates values, but the Three.js render happens in the GSAP ticker — not synchronously in the scroll handler. This means the visual update always waits for the next ticker frame. This is correct behavior (matches the WebGL Engineer's brainstorm note: "Three.js will pick up the mutated values on the NEXT frame").

### Risk Scenario

If the system drops to 30fps (tier 2/3 degradation), the ticker interval doubles to ~33ms. Worst-case latency becomes ~33 + 10 + 2 = ~45ms — still under 50ms but tight.

### Recommendation

The 50ms target is achievable and correct for tier 1 (60fps). Add a note that at degraded tiers (30fps), latency may approach 50ms but should not exceed it. No spec change needed — the target is sound.

---

## 5. Auto-Tier Degradation (FR-036)

**Severity: MEDIUM**

### Analysis

The current benchmark runs a 30-frame measurement 5 seconds after reveal+terminal completion. This captures idle steady-state performance: nebula rotation, star pulses, dust drift, and the post-processing pipeline.

With scroll-driven animations added, the scroll-active state introduces:
- ScrollTrigger callback processing (~0.2ms peak — negligible)
- Zone transition GSAP tweens (star scale animations, color lerps — minimal)
- Slightly increased browser compositing work (scroll reflow + pinning)

**The scroll-driven additions are so lightweight (~0.2ms) that they would not meaningfully change benchmark results.** A system that runs at 18ms idle will still run at ~18.2ms during scroll. The existing benchmark adequately predicts scroll performance.

### However

The spec's FR-036 language — "if the benchmark detects frame time exceeding 20ms, zone transitions simplify to instant color swaps with no animated gradients" — implies the existing benchmark's threshold is reused. This is correct. But there's a gap:

The benchmark runs **once** (5s post-reveal). If the user's system is borderline (19ms idle, tier 1), then during scroll the additional compositing work from the pinned element could push it over 20ms. The benchmark wouldn't catch this because it ran before scrolling started.

### Recommendation

**Amendment requested**: Add a lightweight scroll-time performance check. Not a full 30-frame benchmark, but a simple heuristic:

```js
// During the first scroll interaction, sample 10 frames
// If average exceeds 20ms, apply tier 2 simplifications to zone transitions
```

This is a one-time check, not continuous monitoring. It catches the edge case where scroll compositing tips a borderline system over the threshold. The implementation cost is ~15 lines of code.

Alternatively, the spec could state that the existing benchmark is sufficient and scroll-specific degradation is out of scope, given that scroll adds <0.5ms of work. This is defensible — the risk is low.

---

## 6. Y-Axis Scaling Cost (FR-024–FR-027)

**Severity: LOW — negligible cost, one interaction question**

### Computation Cost

```js
yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3)
```

Applied to 7 star sprites on resize. Cost: ~0.01ms. Completely negligible — resize events fire at most once per frame (debounced by the browser), and 7 multiplications are trivial.

### Interaction with Nebula Layer Scaling

The current resize handler applies X-axis scaling to nebula layers:

```js
// scene.js line 577
nebulaLayers.forEach(layer => { layer.scale.x = xScale; });
```

The nebula layers only scale on X. The Y-axis star scaling formula uses `xScale` as input but produces a **different** value for Y:

- At 16:9 (reference): `xScale = 1.0`, `yScale = 1.0` — no change
- At 4:3 (1024x768): `xScale = 0.75`, `yScale = max(0.8, 1 - 0.25 * 0.3) = max(0.8, 0.925) = 0.925`
- At 9:16 portrait (450x800): `xScale = 0.316`, `yScale = max(0.8, 1 - 0.684 * 0.3) = max(0.8, 0.795) = 0.8`

**The nebula scales X only. Stars scale both X and Y.** This means on portrait viewports:
- Nebula compresses horizontally but keeps full vertical extent
- Stars compress horizontally AND slightly vertically

This is actually **correct behavior** — the nebula is a background cloud that should fill the viewport, while stars need to maintain readable separation. The asymmetric scaling prevents stars from clustering while the nebula remains immersive.

### Recommendation

No changes needed. The formulas are independent and produce the correct visual result. No performance concern.

---

## 7. Mobile Performance

**Severity: MEDIUM**

### Analysis

On mobile (<768px):
- Post-processing is **disabled** (`initPostProcessing` returns null for `window.innerWidth < 768`)
- DPR is clamped to **1.0** (vs 1.5 on desktop)
- Particle counts are reduced: 800→210, 400→120, 300→70 (total: 1500→400 nebula particles)
- Dust motes reduced: 180→80
- Antialias disabled

The render loop on mobile is significantly lighter: no composer, no bloom, no vignette shader, no output pass. Just a direct `renderer.render(scene, camera)` call.

**Mobile draw call count:**

| Element | Draw Calls |
|---------|-----------|
| Nebula layer 0 (210 particles) | 1 |
| Nebula layer 1 (120 particles) | 1 |
| Nebula layer 2 (70 particles) | 1 |
| Star sprites (7) | 7 |
| Dust motes (80 particles) | 1 |
| Scene render (direct, no composer) | 0 (implicit) |
| **Total** | **~11** |

**Zone transitions on mobile add:**
- Nebula hue changes: modifying `vertexColors` on the Points material or adjusting a global hue offset. With no bloom, the color change is less dramatic but still visible.
- Star scale changes: same 0 draw calls.
- Status text: same DOM update.

### Feasibility Assessment

The scroll-driven zone experience is **feasible on mobile**. The bottleneck on mobile is not GPU draw calls (11 is trivial) but rather:

1. **JavaScript execution on mobile CPUs**: The GSAP ticker + dust mote Brownian loop + raycasting runs on every frame. On a mid-range phone (iPhone 12, Pixel 6), this is ~5–8ms — well within budget with no post-processing.

2. **Scroll jank from ScrollTrigger + Three.js**: On mobile, scroll events and requestAnimationFrame compete for the main thread. ScrollTrigger's pin behavior on mobile can cause scroll jank if the browser's scroll compositor is fighting with JS-driven scroll handling.

3. **Battery drain**: Continuous rendering during scroll on mobile drains battery. The existing tab-pause mitigates this when the user switches away, but active scrolling keeps the GPU busy.

### Recommendation

**Amendment requested**: The spec should address mobile scroll smoothness explicitly:

1. On mobile, consider using `ScrollTrigger.config({ ignoreMobileResize: true })` to prevent resize recalculations during iOS address bar show/hide (a known jank source).
2. The scroll container height on mobile should be tested to ensure the iOS rubber-band overscroll doesn't interfere with ScrollTrigger's progress calculation.
3. Zone transitions on mobile should be **instant** (no animated gradient lerp) since there's no bloom to smooth the visual transition. An immediate hue swap looks cleaner on mobile than a slow lerp with no post-processing softening.

---

## Amendments Requested

### A1: Pin Target Specificity (Compositing Layers)
**Section**: FR-010
**Request**: Specify that ScrollTrigger pins a dedicated scroll wrapper or the `#app-shell` element directly — not a parent container that would create an unnecessarily large compositing layer. Add: "The pin target MUST be the `#app-shell` element or a dedicated inner wrapper. The scroll container providing artificial height MUST be a sibling or ancestor wrapper, not the pinned element itself."

### A2: Scroll-Time Performance Sampling (Auto-Tier)
**Section**: FR-036
**Request**: Add optional scroll-time performance check: "During the first user scroll interaction, the system SHOULD sample 10 render frames. If the average frame time exceeds 20ms, zone transitions MUST simplify to instant color swaps (duration: 0) for the remainder of the session." This catches borderline systems that pass the idle benchmark but struggle with scroll compositing overhead.

### A3: Mobile Zone Transition Behavior
**Section**: FR-014 or a new FR
**Request**: Add: "On mobile viewports (<768px), zone color transitions MUST apply instantly (duration: 0) rather than animated, since post-processing bloom is disabled and gradual color lerps appear harsh without softening." This aligns with the existing reduced-motion pattern (FR-031) but applies it as a mobile-specific optimization rather than accessibility.

---

## Approved Items (No Concerns)

| Item | Assessment |
|------|-----------|
| FR-034 (60fps during scroll) | ScrollTrigger callbacks add <0.2ms. Achievable. |
| FR-035 (draw call budget) | Zone transitions add 0 draw calls. "Under 32" is conservative and correct. |
| SC-006 (55fps during scroll) | Realistic target given existing 3.5–7.5ms headroom. |
| SC-007 (50ms scroll-to-paint) | Achievable at 60fps. Tight but valid at 30fps degraded tier. |
| FR-024–FR-027 (Y-axis scaling) | Negligible cost. Formula is correct and independent of nebula scaling. |
| FR-031–FR-032 (reduced motion) | Instant zone transitions for reduced-motion users is correct. |
| Constitution compliance | Scroll Pin Constraint (300px / 1vh max) is referenced in FR-009 and SC-008. |

---

## Final Verdict

**APPROVED WITH AMENDMENTS** — The three amendments (A1, A2, A3) are quality-of-life improvements, not blockers. The spec's core performance assumptions are sound. Zone transitions add essentially zero GPU cost, the draw call budget is safe, and the 50ms scroll-to-paint target is achievable. Implementation can proceed in parallel with the amendments being incorporated.
