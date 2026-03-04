# Plan Review: Performance Optimization Specialist

**Reviewer:** Performance Optimization Specialist
**Date:** 2026-03-04
**Artifact:** `specs/003-beta-portfolio-polish/plan.md`
**Scope:** Validate all performance-related decisions in the implementation plan against the actual codebase.

---

## Verdict: APPROVE WITH CONCERNS

The plan is solid overall and correctly incorporates almost all recommendations from my earlier spec review. However, I found **2 medium issues** and **3 low issues** that should be addressed before implementation begins.

---

## Issues Found

### ISSUE 1 — `contain: strict` on `.frame` Will Break Rendering (MEDIUM)

**Plan reference:** Line 128 — `contain: strict` to `.frame`
**Research reference:** R7 containment map — `.frame`: `contain: strict`

**Problem:** `contain: strict` is shorthand for `contain: size layout style paint`. The `size` containment means the element's size must be determined without reference to its children — the browser treats the element as having zero intrinsic size unless explicit `width` and `height` are set.

Looking at the actual CSS (`styles.css:247-252`):

```css
.frame {
  position: fixed;
  inset: 0;
  z-index: var(--z-frame);
  pointer-events: none;
}
```

The `.frame` element does NOT have explicit `width` or `height`. It relies on `position: fixed; inset: 0` to derive its dimensions from the viewport. While `inset: 0` on a fixed element does establish explicit dimensions (the browser resolves them from the containing block), this is a **browser-dependent edge case** with `contain: size`:

- **Chrome/Edge 120+**: `inset: 0` on fixed elements correctly resolves dimensions under `contain: size`. This works.
- **Firefox 121+**: Same behavior. Works.
- **Safari 17.x**: Has had intermittent bugs with `contain: size` on fixed-position elements where children (pseudo-elements, absolutely-positioned children) fail to render correctly. Safari 17.2 fixed some of these, but corner cases remain.

The `.frame` has 10 absolutely-positioned children (4 corners, 4 edges, 2 gauges, 1 rune-band, 1 header-band). Under `contain: strict`, all of these must resolve their positions relative to the `.frame` containing block. The `::before` and `::after` pseudo-elements on corners and edges (lines 265-445) use `position: absolute` with percentage-based positioning (`left: 10%`, `top: 50%`, etc.). These will continue to work because they reference their respective parents, not `.frame` directly.

**Verdict:** Likely safe in Chrome/Firefox but risky in Safari. The `.frame` already has `pointer-events: none` and `position: fixed`, meaning it causes zero layout interference with other elements anyway. The containment gain is marginal.

**Recommendation:** Downgrade to `contain: layout style paint` (drop `size`). This provides all the layout isolation benefits without the Safari risk, and `.frame` doesn't need size containment since it never participates in intrinsic sizing calculations. The `paint` containment is actually the most valuable here — it creates a new stacking context and clips paint to the element's bounds.

```css
/* Instead of: contain: strict */
.frame {
  contain: layout style paint;
}
```

### ISSUE 2 — `contain: content` on `#constellation-nav li` May Clip Hover Expansion (MEDIUM)

**Plan reference:** Line 127 — `contain: content` to `#constellation-nav li`
**Plan reference:** Lines 187-194 — Hover descriptions with GSAP maxHeight/opacity tweens

**Problem:** `contain: content` is shorthand for `contain: layout style paint` (same as `strict` minus `size`). The `paint` containment means content that overflows the element's bounds is clipped — invisible, not just hidden.

The plan describes sidebar hover descriptions that expand via GSAP `maxHeight` / `opacity` tweens (line 190). If the description expansion causes the `<li>` to grow, the `paint` containment will clip any content that extends beyond the `<li>`'s pre-expansion bounding box until the `<li>` itself finishes resizing.

The nav buttons are currently inside a flex column (`styles.css:641-644`):

```css
#constellation-nav ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
```

When the `<li>` contains a description that expands, the flex container will recompute the `<li>` height. With `contain: content`, the browser should still allow the `<li>` to grow (since `content` does not include `size` containment). However, the `paint` component means that during a single frame where the content has expanded but the `<li` hasn't yet resized (possible in asynchronous animation scenarios), there could be a visible clip.

Additionally, `contain: layout` establishes a new formatting context for the `<li>`. This prevents its layout from affecting sibling `<li>` elements — which is the desired isolation. But it also means the `<li>` becomes a containing block for absolutely-positioned descendants. If any hover effect uses absolute positioning (e.g., a tooltip-style overlay), it will be constrained to the `<li>` bounds.

**Verdict:** The `layout` + `style` containment is correct and valuable for isolating per-item reflows. The `paint` containment adds risk of visible clipping during expansion animations.

**Recommendation:** Use `contain: layout style` instead of `contain: content`. Drop the `paint` component for nav items since the sidebar description expansion could produce mid-frame clipping artifacts. The `layout` + `style` containment alone provides the key benefit — preventing one item's expansion from recalculating all 7 siblings.

```css
/* Instead of: contain: content */
#constellation-nav li {
  contain: layout style;
}
```

### ISSUE 3 — Auto-Tier Timeout: 20s Is Correct But Could Miss Edge Case (LOW)

**Plan reference:** Line 202 — Change fallback timeout from 12000 to 20000ms
**Code reference:** `performance.js:356-359`

**Verification:** The actual code at `performance.js:356-359`:

```javascript
setTimeout(() => {
    document.removeEventListener('reveal-complete', handler);
    runBenchmark();
}, 12000);
```

The 12s value is confirmed at line 359. The plan correctly identifies this needs to increase.

**Analysis of 20s:**
- Terminal scan animation: ~6.4s (7 projects x ~0.7s + overhead, per plan line 176)
- Terminal scan spawns at t=2.3 in reveal (plan line 178), so terminal completes at ~8.7s
- Reveal desktop total: ~6.5s (per spec assumption), completing at ~6.5s
- `reveal-complete` fires at ~6.5s, then +5s delay = benchmark at ~11.5s
- Fallback at 20s provides 8.5s buffer over the normal reveal-complete path

The 20s value is **correct and safe** for the normal flow. However, consider this edge case: if the terminal scan is spawned at t=2.3 but the reveal itself is delayed (e.g., slow font loading blocks GSAP timeline), the terminal could still be actively animating text when the fallback fires. The plan's `reveal-complete` event path handles this correctly (benchmark fires 5s after reveal), but the fallback path has no awareness of whether the terminal is still running.

**Recommendation:** 20s is acceptable. However, the implementation should add a safety check: if `playTerminalScan()` returns a timeline reference, the benchmark should verify `timeline.isActive() === false` before proceeding, or wait for it. This is a minor edge case and does not block approval.

### ISSUE 4 — `position: fixed` on `#orb-hitzone` Creates Additional Compositing Layer (LOW)

**Plan reference:** Line 85-86 — Move `#orb-hitzone` to `position: fixed; inset: 0`
**Current code:** `styles.css:813-818` — `position: absolute; inset: 0`

**Analysis:** Changing from `position: absolute` to `position: fixed` will promote `#orb-hitzone` to its own compositing layer. Currently, `#orb-hitzone` is a child of `#main-viewport` (a grid item) and does not create a separate compositing layer.

With `position: fixed`, the browser creates a new compositing layer because fixed-position elements are composited relative to the viewport, not their parent.

**Layer count impact:**
From my earlier review (Section 2.4), the steady-state count was estimated at 6-7 layers:

| Layer | Purpose |
|-------|---------|
| Canvas | WebGL | 1 |
| Panels (nav, status) | `backdrop-filter` promotes | 2 |
| Frame overlay | Fixed positioning | 1 |
| Command line | Grid item, no promotion trigger | 0 (not promoted currently) |
| Hitzone (after fix) | `position: fixed` | +1 NEW |
| Shimmer pseudo-element(s) | `will-change: transform` | 1-2 |

Revised steady-state: **7-8 layers**. Still within the 12-layer budget.

**However**, `#orb-hitzone` is a transparent element with `cursor: crosshair`. Its compositing layer will be a full-viewport RGBA texture: `1920 * 1080 * 4 = ~8.3MB` at 1x DPR, or `~18.7MB` at 1.5x DPR. This is a significant memory cost for a transparent event-capture element.

**Recommendation:** After changing to `position: fixed`, also add `pointer-events: auto` (already implied since it doesn't have `pointer-events: none`) and consider adding `will-change: auto` or `contain: strict` to signal to the browser that this layer is static and need not be retained in GPU memory when not being composited. Alternatively, the plan could use `position: absolute` on a wrapper that IS full-viewport, avoiding the fixed-position promotion.

Actually, re-reading the research decision (R1), the recommended fix is `position: fixed; inset: 0` which is the simplest approach. The `#orb-hitzone` is just an event-capture surface — it has no visual content. Most browsers optimize empty fixed elements to NOT create full RGBA textures. The 8.3MB concern applies only if the element has visual content or `background`. Since `#orb-hitzone` has no background and no visual content, the GPU memory cost should be minimal (the browser may composite it as a hit-test region without allocating a texture).

**Verdict:** Acceptable. The layer budget increase is within bounds and the memory cost is likely optimized away by the browser for empty elements.

### ISSUE 5 — Shimmer Tier Degradation: No Existing Hook for CSS Animation Changes (LOW)

**Plan reference:** Lines 204-206 — Tier 2 slows shimmer to 8s, Tier 3 disables
**Code reference:** `performance.js:299-346`

**Analysis:** The current auto-tier system modifies:
- **Tier 2** (`applyTier2`, line 299): Adjusts `bloomPass.strength` and `customPass.uniforms.aberrationEnabled` — these are Three.js post-processing uniforms, not CSS.
- **Tier 3** (`applyTier3`, line 335): Disables composer entirely (`rendererRef._composerActive = false`) and applies a CSS filter fallback (`rendererEl.style.filter`, line 345).

The Tier 3 code at line 344-346 **does** touch CSS:
```javascript
if (rendererEl) {
    rendererEl.style.filter = 'blur(1px) brightness(1.1)';
}
```

So there is precedent for the auto-tier system modifying CSS. However, there is **no existing mechanism** to:
1. Query the Greek key element from `performance.js`
2. Modify CSS animation properties on a pseudo-element (`::before` or `::after`)

**The problem:** You cannot directly modify `animation-duration` on a pseudo-element from JavaScript. CSS pseudo-elements are not part of the DOM and have no `.style` property. The plan says "Tier 2: slow shimmer to 8s cycle" — but you can't do `element.querySelector('::before').style.animationDuration = '8s'`.

**Solutions (in order of preference):**

1. **CSS custom property approach (preferred):** Define the shimmer duration as a CSS custom property and toggle it from JS:
   ```css
   .frame__greek-key {
     --shimmer-duration: 4s;
   }
   .frame__greek-key::before {
     animation: shimmer-slide var(--shimmer-duration) linear infinite;
   }
   ```
   Then in `performance.js`:
   ```javascript
   // Tier 2
   document.querySelector('.frame__greek-key')?.style.setProperty('--shimmer-duration', '8s');
   // Tier 3
   document.querySelector('.frame__greek-key')?.classList.add('shimmer-disabled');
   ```
   With CSS:
   ```css
   .frame__greek-key.shimmer-disabled::before { animation: none; }
   ```

2. **Class toggle approach:** Add `.tier-2` / `.tier-3` classes to `<body>` or `.frame` and write CSS rules:
   ```css
   .tier-2 .frame__greek-key::before { animation-duration: 8s; }
   .tier-3 .frame__greek-key::before { animation: none; }
   ```

**Recommendation:** The plan must specify which approach will be used. Option 1 (CSS custom properties) is the cleanest and aligns with the existing custom property architecture. The implementation should add this to the `applyTier2()` and `applyTier3()` functions.

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `contain: strict` breaks Safari rendering of frame children | Medium | Low-Medium | Downgrade to `contain: layout style paint` |
| `contain: content` clips sidebar description during expansion | Medium | Medium | Downgrade to `contain: layout style` |
| Shimmer tier degradation has no JS-to-pseudo-element path | Low | Certain | Use CSS custom property for duration |
| Hitzone fixed-position adds compositing layer | Low | Certain | Within 12-layer budget; browser optimizes empty layers |
| 20s fallback could still fire during active terminal scan | Low | Very Low | Add `timeline.isActive()` check in implementation |

---

## Recommendations

1. **Change `.frame` containment** from `contain: strict` to `contain: layout style paint`. This eliminates the Safari `size` containment risk while retaining all meaningful isolation benefits.

2. **Change `#constellation-nav li` containment** from `contain: content` to `contain: layout style`. This prevents paint clipping of expanding descriptions while retaining the per-item layout isolation.

3. **Specify shimmer degradation mechanism** in the plan: use CSS custom property `--shimmer-duration` on `.frame__greek-key`, read from the `::before` pseudo-element's animation. JS toggles the property in `applyTier2()` and adds a `.shimmer-disabled` class in `applyTier3()`.

4. **Verify compositing layer count** post-implementation using Chrome DevTools Layers panel. The hitzone promotion adds 1 layer, putting steady-state at 7-8. Confirm the shimmer pseudo-element doesn't unexpectedly promote additional layers.

5. **20s timeout is approved.** Optionally add a terminal timeline completion guard for the fallback path.

---

## What the Plan Gets Right

- Shimmer uses `transform: translateX()` on pseudo-element — correct, compositor-only. This was the #1 risk in my spec review and the plan addresses it perfectly.
- Loading bar uses `transform: scaleX()` — correct, no layout triggering.
- `contain: layout style` on `#command-line` — correct, isolates terminal text cycling.
- `contain: layout style paint` on `.frame__greek-key` — correct, isolates shimmer paint.
- Independent GSAP timeline for terminal scan — correct, non-blocking.
- CSS-only new features (Greek key, descriptions) — zero additional draw calls to WebGL budget.
- Responsive Greek key hidden at mobile (<768px) — correct, saves a GPU layer on mobile.
- `prefers-reduced-motion` fallbacks specified for all new animations — correct.
- The 12-layer compositing budget is achievable with careful implementation.

---

## Summary

The plan demonstrates strong performance awareness and correctly incorporates the critical recommendations from my earlier spec review (shimmer compositor-only, scaleX loading bar, CSS containment, auto-tier timing). The two medium issues (containment strictness levels) are easily resolved by downgrading containment types. The shimmer degradation mechanism needs explicit specification but has a clear solution path. No blocking issues found.

**Verdict: APPROVE WITH CONCERNS** — address the 2 medium containment issues and specify the shimmer degradation mechanism before implementation begins.
