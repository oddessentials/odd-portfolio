# Plan Review: Technical Artist (Shaders & Materials)

**Reviewer**: Technical Artist | **Date**: 2026-03-04 | **Artifact**: `plan.md` (Beta 0.1.0)

---

## Verdict: APPROVE WITH CONCERNS

The plan is solid and correctly captures the core Greek key approach, shimmer strategy, and brass palette usage from my earlier review. Two issues need attention before implementation: (1) a shimmer technique inconsistency between the plan and the research doc, and (2) CRT terminal effects from my review that were silently dropped.

---

## Issues Found

### Issue 1: Shimmer Technique Inconsistency — `transform: translateX()` vs `background-position` (Medium)

**The plan states** (line 106):
> Shimmer animation: `transform: translateX()` on the pseudo-element (compositor-only, per perf specialist)

**The research doc** (R6) also confirms `transform: translateX()`.

**But my earlier review** proposed the shimmer as a `background-position` animation on the `::before` pseudo-element:
```css
background-size: 200% 100%;
animation: greek-key-shimmer 8s ease-in-out infinite;
/* keyframes move background-position from 200% to -200% */
```

These are two fundamentally different techniques:

- **`transform: translateX()`**: Moves the entire pseudo-element physically across the parent. The shimmer gradient is sized to the element and the whole element slides. This IS compositor-only and zero-paint.
- **`background-position` animation**: The pseudo-element stays fixed; the gradient slides inside it via `background-position`. This triggers paint on every frame (the perf specialist correctly flagged this).

**The plan is correct to choose `translateX()`**, and I agree with the perf specialist's reasoning. However, the implementation needs care:

- The `::before` must be wider than the parent (e.g., `width: 200%` or `300%`) so the highlight gradient can sweep across.
- The parent `.frame__rune-band` must have `overflow: hidden` to clip the oversized pseudo-element.
- The `will-change: transform` on the pseudo-element is appropriate here.

**Recommendation**: Clarify in the plan that the `::before` must be oversized (e.g., `width: 300%; left: -100%`) and translated from `-100%` to `+100%` to achieve the sweep effect. This is not the same as just `translateX(someValue)` on a normally-sized element.

### Issue 2: No Pseudo-Element Conflict on `.frame__rune-band` (Non-Issue — Confirmed)

**The plan asks**: Will there be a pseudo-element conflict with `.frame__rune-band`?

**Answer: No.** I checked the current CSS (`styles.css` lines 524-546) and there are NO pseudo-elements (`::before` or `::after`) currently defined on `.frame__rune-band`. The `::after` engraving lines are on `.frame__edge--top` (line 411), not on the rune band. The shimmer can safely use `::before` on `.frame__rune-band` without conflict. Both `::before` and `::after` remain available.

### Issue 3: CRT/Terminal Effects Dropped Without Comment (Low-Medium)

My earlier review (`technical-artist.md`) recommended four terminal visual enhancements:

| Effect | My Review FR | Plan Status |
|--------|-------------|-------------|
| CRT scanlines on `#status-panel::after` | FR-B007 | **Not in plan** |
| Phosphor text glow on `.status-line` | FR-B008 | **Not in plan** |
| CRT power-on flicker on `.status-readout` | FR-B010 | **Not in plan** |
| Mana meter pulse | FR-B012 | **Not in plan** |

The plan includes the terminal loading bar animation (FR-023, FR-043) and the GSAP TextPlugin scan sequence (FR-021-029), but none of the CSS visual effects that would make the terminal feel like an actual CRT monitor.

**Assessment**: These were P2/P3 recommendations in my review, and the spec itself (FR-021 through FR-029) doesn't explicitly require CRT visual treatment — it focuses on the scanning animation behavior. The effects are enhancements, not requirements. However, the absence is notable because:

- The phosphor text glow (`text-shadow`) is a 3-line CSS addition that dramatically improves the terminal aesthetic
- The CRT scanlines are a 10-line CSS addition with no performance cost
- Without them, the "terminal" is just monospace text in a panel — it lacks the material quality that the rest of the frame achieves

**Recommendation**: At minimum, add the phosphor text glow to `.status-line` as a "while we're there" enhancement — it's zero-risk, zero-performance-cost, and reinforces the terminal material language. The scanlines and flicker can be deferred to a future polish pass if scope is a concern.

### Issue 4: Greek Key Height Mismatch (Low)

The current `.frame__rune-band` is `height: 6px` (line 530). My earlier review proposed 18px (matching `--frame-border-width`). The plan references the 36px tile and mentions responsive scaling to 24px tile at tablet, but does not explicitly state the band HEIGHT at each breakpoint.

The spec (FR-036) says "scale proportionally at tablet breakpoints and hidden on mobile below 768px." The plan (line 108) says "24px tile at tablet, hidden at mobile (<768px)" which matches.

**But**: At the current 6px height, a 36px-wide tile would produce a 6:1 aspect ratio that cannot render a recognizable meander. The band height MUST increase. My review recommended matching `--frame-border-width` (18px desktop, 12px tablet, 8px mobile). The plan should explicitly state this height change.

**Recommendation**: Add explicit height values to the plan's Greek key section: `height: 18px` (desktop), `height: 12px` (tablet), `display: none` (mobile <768px).

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Shimmer `translateX()` implementation requires oversized pseudo-element | Medium | High (will be hit during implementation) | Document the oversized-element + overflow-hidden pattern in the plan |
| Greek key gradient stack rendering inconsistently across browsers | Low | Medium | Test in Chrome, Firefox, Safari. Gradient stacking is well-supported. |
| 6-layer gradient stack performance on low-end devices | Low | Low | CSS gradients are rasterized once, not per-frame. `contain: layout style paint` isolates repaints. |
| Missing CRT effects reduce terminal visual quality | Low | Certain (by design) | Acceptable if scope is the concern; phosphor glow is a trivial add |

---

## Recommendations

1. **Clarify shimmer translateX() implementation detail**: The pseudo-element must be oversized (width: 200-300%) with `overflow: hidden` on the parent. Add a brief note to the plan so the implementer doesn't create a `translateX()` that just slides a viewport-width element off-screen.

2. **Add explicit Greek key band heights**: State `height: 18px` (desktop), `12px` (tablet), `hidden` (mobile) in the plan to match the tile aspect ratios.

3. **Consider adding phosphor text glow**: A single `text-shadow` rule on `.status-line` costs nothing and significantly enhances the terminal material. This is a 3-line change.

4. **Color palette verification**: The plan references `--gk-color-face`, `--gk-color-shadow`, and `--gk-color-highlight` as new custom properties mapped to existing variables. Confirmed correct against `styles.css`:
   - `--gk-color-face: var(--color-brass-mid)` = `#8B6914` — correct
   - `--gk-color-shadow: var(--color-brass-dark)` = `#4A3508` — correct
   - `--gk-color-highlight: var(--color-brass-light)` = `#C8A84B` — correct (referenced in my review but not in the plan's custom property list; add it)
   - Base background `--color-iron` = `#1C1F24` — correct

5. **Add `--gk-color-highlight` to plan**: The plan lists `--gk-color-face` and `--gk-color-shadow` (line 104) but omits `--gk-color-highlight`. My review's implementation uses all three. Add `--gk-color-highlight: var(--color-brass-light)` to the custom property list for completeness.

---

## Color Accuracy Verification

| Plan Reference | CSS Variable | Hex Value | Status |
|---|---|---|---|
| Brass mid (pattern face) | `--color-brass-mid` | `#8B6914` | Correct |
| Brass dark (shadow/depth) | `--color-brass-dark` | `#4A3508` | Correct |
| Brass light (highlight) | `--color-brass-light` | `#C8A84B` | Correct |
| Iron (channel background) | `--color-iron` | `#1C1F24` | Correct |
| Shimmer highlight tone | `rgba(232, 208, 144, 0.15)` | Matches corner radial gradient | Correct |
| Green glow accent | `rgba(122, 255, 178, 0.06)` | Matches `--color-rune-glow` tone | Correct |

All brass palette references in the plan are accurate against the actual CSS custom properties in `styles.css`.
