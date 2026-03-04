# Performance Specialist Review — Beta 0.1.0

**Reviewer:** Performance Optimization Specialist
**Date:** 2026-03-04
**Scope:** All Beta 0.1.0 proposed changes assessed for CPU/GPU cost, frame budget impact, memory allocation, and auto-tier degradation compatibility.

---

## 1. Per-Feature Performance Impact

### 1.1 Greek Key Pattern Replacing Rivet Strip

**Current state:** The `.frame__rune-band` uses a `repeating-linear-gradient` at 16px repeat interval (see `styles.css:532-541`). Corner rivets use `::before`/`::after` pseudo-elements with `radial-gradient` and `box-shadow` (lines 265-287).

**Beta change:** Replace the rivet pseudo-elements on corners with a Greek key pattern, plus add a shimmer animation overlay.

**Impact assessment:**

| Metric | Cost |
|--------|------|
| Initial paint | Negligible — `repeating-linear-gradient` is GPU-rasterized once |
| Shimmer animation (CSS) | **MEDIUM** — depends on implementation |
| Repaints per frame | 0 if compositor-only; **high if done wrong** |
| GPU layers created | 1 additional compositing layer for shimmer overlay |
| Memory per layer | ~width x height x 4 bytes (RGBA) for the promoted layer |

**Risk:** A shimmer using `background-position` animation on a `repeating-linear-gradient` will trigger **paint on every frame**. This is the single biggest performance risk in the Beta feature set.

**Recommendation — CRITICAL:**
- The shimmer MUST use `transform: translateX()` on a separate pseudo-element, NOT `background-position` animation.
- Implementation pattern:
  ```css
  .greek-key-pattern {
    position: relative;
    overflow: hidden;
    contain: layout style paint;
  }
  .greek-key-pattern::after {
    content: '';
    position: absolute;
    inset: -100% 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(200, 168, 75, 0.15) 45%,
      rgba(200, 168, 75, 0.3) 50%,
      rgba(200, 168, 75, 0.15) 55%,
      transparent 100%
    );
    width: 200%;
    will-change: transform;
    animation: shimmer-slide 4s linear infinite;
  }
  @keyframes shimmer-slide {
    from { transform: translateX(-50%); }
    to   { transform: translateX(50%); }
  }
  ```
- This ensures the shimmer runs entirely on the GPU compositor — zero main-thread paint cost.
- Apply `will-change: transform` ONLY to the shimmer pseudo-element, not the parent.
- Apply `contain: layout style paint` to the parent container to isolate the paint boundary.

**Shimmer off-screen optimization:**
- Use `animation-play-state: paused` when the element is not visible (e.g., during project overlay).
- Respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .greek-key-pattern::after {
      animation: none;
    }
  }
  ```
  This is already partially handled by the blanket reduced-motion rule at `styles.css:1240-1246`, but explicitly removing the shimmer element's animation is cleaner than relying on `animation-duration: 0.01ms`.

**GPU layer budget:** The shimmer adds 1 compositing layer. Current layer count (estimated from CSS): ~8-12 layers (frame elements, panels, canvas, overlay). Adding 1 is within acceptable bounds. If the Greek key pattern is applied to ALL 4 frame edges (not just the rune band), that could add 4 layers — cap at 2 (top + bottom only, or use a single full-width pseudo-element).

### 1.2 Terminal Loading Animation

**Current state:** The reveal sequence (`animations.js:20-272`) uses GSAP `TextPlugin` to type CLI text into `.cmd-text` (a `<span>` element). The command line bar is at the bottom of the viewport (`styles.css:827-864`).

**Beta change:** Add a multi-phase terminal loading animation before the starfield reveal: text cycling with fake boot messages, a loading bar with progress animation, potential scan-line effects.

**Impact assessment:**

| Metric | Cost |
|--------|------|
| GSAP tweens (concurrent) | **3-8 additional tweens** during loading phase |
| innerHTML/textContent changes | **Layout reflow per text change** — up to 1 reflow per text cycle |
| Loading bar animation | Negligible if using `transform: scaleX()` |
| DOM reads during WebGL render | **Potential jank if text changes trigger forced sync layout** |

**Risk: Text cycling causes layout reflow during WebGL rendering.** The GSAP ticker runs the WebGL render loop at `scene.js:529-616`. If `textContent` changes on `.cmd-text` happen in the same frame as WebGL rendering, the browser may force a synchronous layout calculation, causing frame drops.

**Recommendations:**

1. **Loading bar — use `transform: scaleX()` exclusively:**
   ```css
   .terminal-loading-bar__fill {
     transform-origin: left center;
     transform: scaleX(0);
     will-change: transform;
   }
   ```
   NEVER use `width` animation — it triggers layout. `scaleX` is compositor-only.

2. **Text cycling — batch DOM writes:**
   - Use `textContent` (not `innerHTML`) to avoid HTML parsing overhead.
   - GSAP's TextPlugin already uses textContent, so this is safe.
   - Schedule text changes via `gsap.delayedCall()` or timeline positions to avoid overlapping with heavy WebGL frames.

3. **Isolate the terminal from layout recalculation:**
   ```css
   #command-line {
     contain: layout style;
   }
   ```
   `contain: layout` prevents text reflows from propagating up the layout tree. This is the single most impactful optimization for this feature.

4. **Stagger terminal tweens to avoid concurrent tween spikes:**
   - Cap concurrent GSAP tweens during the terminal phase at **5 max**.
   - Current reveal already runs ~15-20 tweens concurrently at peak (Phase 3, `animations.js:226-270`). Adding 3-8 more terminal tweens to Phase 1 is acceptable since Phase 1 currently only has frame assembly tweens.
   - The terminal animation MUST complete before Phase 3 (starfield ignition) begins, so there is no overlap concern if sequenced correctly.

5. **Memory: text string allocations are trivial.** Each `textContent` assignment allocates a new string (~50-100 bytes). At 10-15 text cycles, total allocation is <2KB — negligible for GC pressure.

### 1.3 Sidebar Hover Descriptions

**Current state:** The constellation nav buttons (`styles.css:646-691`) display project names. No description text is shown on hover.

**Beta change:** Add description text that expands/appears on hover within the sidebar nav items.

**Impact assessment:**

| Metric | Cost |
|--------|------|
| Layout shift per hover | **HIGH if using height transitions** |
| Repaints | Moderate — sidebar is a composited layer (has `backdrop-filter`) |
| Interaction responsiveness | Must respond within 100ms (RAIL model) |

**Risk: Layout thrashing if multiple items expand.** If the user rapidly hovers across nav items, multiple `height` transitions firing simultaneously will cause repeated layout recalculations. The sidebar has 7 buttons — worst case is 7 concurrent layout shifts.

**Recommendations:**

1. **NEVER animate `height` or `max-height` for expansion.** Instead, use one of:

   **Option A (Preferred) — `transform: scaleY()` + `opacity`:**
   ```css
   .nav-description {
     transform: scaleY(0);
     transform-origin: top;
     opacity: 0;
     transition: transform 200ms ease-out, opacity 150ms ease-out;
     will-change: transform, opacity;
   }
   button:hover .nav-description,
   button:focus-visible .nav-description {
     transform: scaleY(1);
     opacity: 1;
   }
   ```
   This is compositor-only — zero layout cost. Downside: content appears to "squish" rather than slide.

   **Option B — CSS `grid` + `grid-template-rows` (smoother visual):**
   ```css
   .nav-description-wrapper {
     display: grid;
     grid-template-rows: 0fr;
     transition: grid-template-rows 200ms ease-out;
   }
   button:hover .nav-description-wrapper {
     grid-template-rows: 1fr;
   }
   .nav-description {
     overflow: hidden;
   }
   ```
   This DOES trigger layout but is optimized in modern browsers for `grid-template-rows` transitions. It is measurably cheaper than `height` animation.

2. **Apply `contain: content` to each nav `<li>` element:**
   ```css
   #constellation-nav li {
     contain: content;
   }
   ```
   This isolates each item's layout from its siblings — one item's expansion won't recalculate the entire nav list.

3. **Debounce rapid hovers:** Use a 50ms CSS `transition-delay` on the description's appearance to prevent layout thrashing from rapid mouse movement across the list.

4. **Only show one description at a time.** If using JS to manage the description state, track the currently-shown description and hide the previous one before showing the new one.

### 1.4 Mouse Offset Bug Fix

**Current state:** Mouse raycasting uses `e.clientX / window.innerWidth` normalization (`scene.js:433-436`). The hitzone is `#orb-hitzone` with `position: absolute; inset: 0` inside `#main-viewport` (the center grid column). On desktop, the sidebar panels offset the viewport, so `clientX` does not align with the canvas coordinate space.

**Beta change:** Fix the offset so mouse-to-star raycasting is accurate.

**Impact assessment:**

| Metric | Cost |
|--------|------|
| `getBoundingClientRect()` per frame | **~0.01-0.05ms per call** — triggers forced layout if pending layout changes exist |
| `getBoundingClientRect()` on resize only | **Negligible** |

**Recommendation — Cache the rect, update on resize only:**
```javascript
let cachedHitzoneRect = null;

function updateHitzoneRect() {
  const hitzone = document.getElementById('orb-hitzone');
  if (hitzone) cachedHitzoneRect = hitzone.getBoundingClientRect();
}

// Call once at init + on resize
window.addEventListener('resize', updateHitzoneRect);
updateHitzoneRect();

// In mousemove handler:
hitzone.addEventListener('mousemove', (e) => {
  if (!cachedHitzoneRect) return;
  mouse.x = ((e.clientX - cachedHitzoneRect.left) / cachedHitzoneRect.width) * 2 - 1;
  mouse.y = -((e.clientY - cachedHitzoneRect.top) / cachedHitzoneRect.height) * 2 + 1;
});
```

**NEVER call `getBoundingClientRect()` inside the GSAP ticker callback** (`scene.js:529`). This is called every frame (~60Hz) and if any layout is dirty, the browser will perform a forced synchronous layout to return the current rect. Cost: 0.5-2ms per forced layout, which eats into the 16.67ms frame budget.

The cached-on-resize approach has **zero per-frame cost** and is accurate for all cases except mid-animation layout shifts (which don't occur in this project since the grid is fixed).

### 1.5 Responsive Star Visibility Fix

**Current state:** Star positions are defined in `data.js` as static 3D coordinates (7 projects). The camera is at z=4.5 with FOV 45deg. On narrow viewports, some stars may fall outside the visible frustum.

**Beta change:** Adjust star positions or camera FOV on resize so all 7 stars remain visible.

**Impact assessment:**

| Metric | Cost |
|--------|------|
| Recalculating 7 positions on resize | **< 0.1ms** — trivial |
| Updating camera FOV | **< 0.01ms** — one uniform update |
| `updateProjectionMatrix()` | Already called in resize handler (`scene.js:495`) |

**Verdict: Negligible performance impact.** 7 vector3 position updates + 1 matrix recalculation is well under 1ms. No optimization needed.

**Recommendation:** If remapping positions, do it inside the existing `onResize()` handler (`scene.js:489-499`) alongside the existing `camera.updateProjectionMatrix()` call. Do NOT create a separate resize listener — consolidate to avoid double-layout-read.

### 1.6 Shimmer Animation on Greek Key (Continuous CSS Animation)

This is covered in Section 1.1 above. Summary:

- Use `transform: translateX()` on a pseudo-element — compositor-only, zero paint cost.
- Apply `will-change: transform` only to the shimmer element.
- Apply `contain: layout style paint` to the parent.
- Pause when off-screen or overlay is open.
- Respect `prefers-reduced-motion: reduce`.

**GPU memory for shimmer layer:** For a frame edge of ~1920x18px, the compositing layer is ~1920 * 18 * 4 = ~138KB. Even with 4 edges, total is ~550KB — acceptable.

---

## 2. Performance Budget Updates

### 2.1 Frame Time Budget

| Metric | Alpha Target | Beta Target | Notes |
|--------|-------------|-------------|-------|
| Steady-state frame time | <16.67ms (60fps) | <16.67ms (60fps) | **No change** |
| Tier 1 threshold | <20ms avg | <20ms avg | No change |
| Tier 2 threshold | 20-33ms avg | 20-33ms avg | No change |
| Terminal animation phase | N/A | <16.67ms | New constraint: terminal tweens + WebGL must stay under budget |

### 2.2 Draw Call Budget

| Metric | Alpha | Beta | Notes |
|--------|-------|------|-------|
| Steady-state draw calls | <30 | <30 | **No change** — Beta features are CSS-only, no new Three.js objects |
| Peak draw calls | <50 | <50 | Supernova burst unchanged |
| New Three.js objects | 0 | 0 | Greek key, terminal, descriptions are all DOM/CSS |

### 2.3 GSAP Tween Budget (New for Beta)

| Phase | Max Concurrent Tweens | Notes |
|-------|----------------------|-------|
| Terminal loading | 5 | Text cycling + loading bar + 1-2 decorative |
| Frame assembly | 12 | Unchanged from Alpha |
| Starfield ignition | 20 | Unchanged from Alpha |
| Post-reveal steady state | 3 | Star pulse + nebula drift + dust (via ticker, not individual tweens) |

### 2.4 CSS Layer Budget (New for Beta)

| Layer | Purpose | Count |
|-------|---------|-------|
| Canvas | WebGL | 1 |
| Panels (nav, status) | `backdrop-filter` promotes | 2 |
| Frame overlay | Fixed positioning | 1 |
| Command line | Fixed positioning | 1 |
| Shimmer pseudo-element(s) | `will-change: transform` | 1-2 |
| Project overlay (when open) | `backdrop-filter` promotes | 2 |
| **Total steady state** | | **6-7** |
| **Total with overlay** | | **8-9** |

Cap: **12 compositing layers max.** Beyond this, GPU memory and compositing overhead become measurable on integrated GPUs.

---

## 3. Optimization Recommendations

### 3.1 Add `contain` Properties to Key Elements

These are the highest-impact, lowest-effort optimizations for Beta:

```css
/* Isolate command line from triggering full-page layout */
#command-line {
  contain: layout style;
}

/* Isolate each nav item from siblings */
#constellation-nav li {
  contain: content;
}

/* Isolate frame decorations from layout tree */
.frame {
  contain: strict;  /* already has pointer-events: none, fully decorative */
}

/* Isolate Greek key pattern paint */
.greek-key-pattern {
  contain: layout style paint;
}
```

**Rationale:** CSS containment (`contain`) is the most effective way to prevent Beta's DOM changes (text cycling, description expansion) from triggering full-page layout recalculations. The `.frame` element is already `pointer-events: none` and purely decorative — `contain: strict` is safe here.

### 3.2 Compositor-Only Animation Properties

For all Beta CSS animations, restrict to these properties ONLY:

| Property | Compositor? | Use for |
|----------|-------------|---------|
| `transform` | Yes | Shimmer slide, loading bar scale, description expand |
| `opacity` | Yes | Fade in/out, description reveal |
| `filter` | Partial (GPU) | Tier 3 fallback blur (already used) |
| `clip-path` | No (paint) | **AVOID** for animations |
| `width` / `height` | No (layout) | **NEVER animate** |
| `background-position` | No (paint) | **NEVER animate** for shimmer |

### 3.3 Debounce and Throttle Patterns

- **Resize handler:** Already exists at `scene.js:489`. Consolidate all Beta resize logic into this single handler. Do NOT add new `resize` listeners — add to the existing one.
- **Hover descriptions:** 50ms CSS `transition-delay` on show, 0ms on hide. This prevents rapid layout thrashing without feeling sluggish.
- **Text cycling:** Use GSAP timeline sequencing (not `setInterval`) — GSAP's ticker is already synchronized with RAF.

### 3.4 Mobile-Specific Optimizations

Current mobile handling (`scene.js:213-214`, `performance.js:63`):
- DPR clamped to 1.0
- Post-processing skipped entirely
- Particle counts halved (nebula: 400 total, dust: 80)

**Beta additions for mobile:**
- Greek key shimmer: Disable entirely on mobile (`<768px`). The frame edges are already thinner (8px) and the shimmer would be imperceptible at that scale. Save the GPU layer.
- Terminal loading animation: Simplify to 2-3 text messages max (Alpha mobile reveal already shortens from ~6.5s to ~4s per `animations.js:89`).
- Sidebar descriptions: Not applicable on mobile — the sidebar is hidden behind a hamburger menu. No performance concern.

---

## 4. Auto-Tier Degradation Updates

### 4.1 Current Timing

The auto-tier benchmark currently fires at:
1. 5 seconds after `reveal-complete` event (`performance.js:352`), OR
2. 12 seconds after page load as a fallback (`performance.js:356-359`).

**Beta concern:** The terminal loading animation extends the pre-reveal phase. If the terminal takes 3-5 seconds before the starfield reveal begins, and the reveal itself is 4-6.5 seconds, `reveal-complete` won't fire until 7-11.5 seconds into the page load. Adding the 5-second post-reveal delay means the benchmark runs at 12-16.5 seconds.

The 12-second fallback (`performance.js:356`) would fire DURING the reveal sequence on slower scenarios, which is incorrect — it would benchmark during heavy animation, producing artificially bad scores.

### 4.2 Recommended Changes

1. **Increase the fallback timeout from 12s to 20s:**
   ```javascript
   setTimeout(() => {
     document.removeEventListener('reveal-complete', handler);
     runBenchmark();
   }, 20000); // was 12000
   ```
   This accounts for the longest possible terminal + reveal sequence.

2. **Keep the 5s post-reveal delay** — the terminal animation has no overlap with the post-reveal period, so this remains valid.

3. **Add shimmer animation to tier degradation:**
   - **Tier 2:** Reduce shimmer animation speed from 4s to 8s (halve GPU compositing frequency).
   - **Tier 3:** Disable shimmer entirely (`animation: none`). Apply the same treatment as the existing CSS filter fallback (`performance.js:344-346`).

4. **Terminal animation is not affected by tier degradation** — it completes before the benchmark runs. No changes needed.

### 4.3 Updated Tier Behavior Table

| Feature | Tier 1 (Full) | Tier 2 (Medium) | Tier 3 (Low) |
|---------|--------------|-----------------|--------------|
| Post-processing | Full bloom + vignette | Reduced bloom (0.4), no aberration | Disabled; CSS filter fallback |
| Shimmer animation | 4s cycle | 8s cycle | Disabled |
| Dust motes | 180 particles | 180 particles | 180 particles (low cost, keep) |
| Nebula opacity | 0.7-0.76 | 0.7-0.76 | 0.7-0.76 |
| Star pulse | Active | Active | Disabled (static opacity 1.0) |
| Sidebar descriptions | Animated expand | Instant show (no transition) | Instant show |

---

## 5. Spec Recommendations — Performance-Related Functional Requirements

### FR-PERF-01: Shimmer Animation Must Be Compositor-Only
The Greek key shimmer animation MUST use `transform: translateX()` on a pseudo-element overlay. It MUST NOT animate `background-position`, `background-size`, or any paint-triggering property. The shimmer pseudo-element MUST have `will-change: transform` applied.

### FR-PERF-02: Terminal Text Changes Must Not Trigger Full Layout
The `#command-line` element MUST have `contain: layout style` applied in CSS. All text changes during the terminal loading animation MUST use `textContent` (not `innerHTML`). Maximum concurrent GSAP tweens during the terminal phase: **5**.

### FR-PERF-03: Loading Bar Must Use scaleX Transform
The terminal loading bar progress animation MUST use `transform: scaleX()` with `transform-origin: left center`. Width-based animation is prohibited.

### FR-PERF-04: Sidebar Description Expansion Must Avoid Layout Thrashing
Each `#constellation-nav li` element MUST have `contain: content` applied. Description expansion MUST use either `transform: scaleY() + opacity` (preferred) or `grid-template-rows` transition. Height/max-height animation is prohibited. A 50ms `transition-delay` SHOULD be applied to the expand animation to debounce rapid hovers.

### FR-PERF-05: Mouse Offset Fix Must Cache Rect
The mouse-to-raycast coordinate fix MUST cache the hitzone `getBoundingClientRect()` result and update it only on `resize` events. Per-frame `getBoundingClientRect()` calls are prohibited.

### FR-PERF-06: Auto-Tier Fallback Timeout Must Account for Terminal Animation
The fallback benchmark timeout MUST be increased to 20 seconds (from 12 seconds) to prevent benchmarking during the terminal + reveal animation sequence.

### FR-PERF-07: Shimmer Must Respect Reduced Motion and Tier Degradation
The shimmer animation MUST be disabled when `prefers-reduced-motion: reduce` is active. The shimmer MUST be slowed to 8s cycle on Tier 2 and disabled entirely on Tier 3. The shimmer MUST be disabled on viewports below 768px.

### FR-PERF-08: CSS Containment Strategy
The `.frame` element MUST have `contain: strict` applied. The `#command-line` element MUST have `contain: layout style`. Each `#constellation-nav li` MUST have `contain: content`. The Greek key pattern parent MUST have `contain: layout style paint`.

### FR-PERF-09: Compositing Layer Budget
Total CSS compositing layers MUST NOT exceed 12 in steady state. The shimmer animation MUST be limited to 2 promoted layers maximum (top + bottom edges, or a single shared element).

---

## Appendix: Profiling Checklist for Implementation

Before Beta 0.1.0 ships, run these checks:

1. **Chrome DevTools > Performance > Record 5s** at steady state:
   - Frame time: all frames < 16.67ms
   - No "Long Task" markers
   - No forced reflow warnings in the "Layout" track

2. **Chrome DevTools > Layers panel:**
   - Count compositing layers: must be <= 12
   - No unexpected layer promotions from `backdrop-filter` or `will-change` leaks

3. **Chrome DevTools > Rendering > Paint flashing:**
   - Shimmer must NOT show green paint flashing (proves compositor-only)
   - Text cycling in terminal should flash ONLY within the `#command-line` bounds (proves containment)

4. **Mobile throttling (4x CPU, Fast 3G):**
   - Reveal sequence completes without dropped frames
   - Auto-tier benchmark fires AFTER reveal, not during

5. **`prefers-reduced-motion: reduce` emulation:**
   - Shimmer disabled
   - Terminal shows final state immediately
   - No animation artifacts
