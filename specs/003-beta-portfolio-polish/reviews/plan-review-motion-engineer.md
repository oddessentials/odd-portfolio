# Plan Review — Motion/Interaction Engineer

**Reviewer**: Motion/Interaction Engineer
**Date**: 2026-03-04
**Artifact**: `specs/003-beta-portfolio-polish/plan.md`
**Scope**: Animation timelines, interaction choreography, GSAP integration, event handler ordering, timing conflicts

---

## Verdict: APPROVE WITH CONCERNS

The plan is well-structured and correctly captures the animation architecture from my earlier review. The independent timeline approach for the terminal scan, the hover/touch description pattern, and the shimmer coordination are all sound. However, I have identified **3 issues** that need attention before implementation — 1 medium, 2 low.

---

## Issues Found

### Issue 1 (Medium): Terminal scan spawn at t=2.3 fires during Phase 2, not Phase 3 — status lines may not be fully visible

**What the plan says**: "Spawned at t=2.3 in reveal desktop timeline via callback" (plan.md line 178)

**What actually happens at t=2.3 in the desktop reveal**:
- Phase 2 (Console power-up) runs from t=1.6 to ~t=3.8
- Status lines fade in at t=2.0 with `stagger: 0.15` (animations.js:216-219), meaning the 4th status line finishes fading at t=2.0 + 3 * 0.15 + 0.3 = **t=2.75**
- The scan-line and progress-bar are status lines. They begin fading in at t=2.0 but are only ~30% through their fade at t=2.3

**Risk**: The `playTerminalScan()` callback fires at t=2.3, immediately starting to type text into `#scan-line`. But `#scan-line` is only ~30% through its opacity fade at that point (opacity ~0.3). The first scan text ("initializing...") will be partially invisible during its typing animation.

**Recommendation**: Push the callback to **t=2.8** (after all status lines have completed their fade-in at t=2.75). Alternatively, keep t=2.3 but add an initial 0.5s hold on the "initializing..." text before the first scan begins — this aligns with the 0.3s init phase in my earlier timeline table. The net effect is the same: visible text starts at ~t=2.8.

My earlier review specified "start at t=2.0 concurrent with status lines fading in" for the scan trigger, with a 0.3s "initializing..." hold phase. The plan collapsed this into t=2.3 with no hold, which loses the grace period. The plan should either:
- Use `t=2.8` for the callback, or
- Keep `t=2.3` and ensure the 0.3s init hold from the timeline spec is preserved

**Skip behavior is fine**: When `masterTimeline.progress(1)` fires, all callbacks execute including the one at t=2.3. The scan spawns as an independent timeline and runs at normal speed. This is correct — verified against `initSkipIntro()` at animations.js:324-388 which calls `masterTimeline.progress(1)` on skip. The callback will fire because GSAP executes position-based callbacks when seeking past them.

### Issue 2 (Low): Touch first-tap `stopImmediatePropagation` requires strict handler registration order

**What the plan says**: "first-tap preview / second-tap open pattern with `stopImmediatePropagation`" (plan.md line 193)

**Current initialization order** (app.js:19):
```js
initInteractions();  // line 19 — registers click handlers on nav buttons (interactions.js:348-358)
```

The plan's `initNavTouchEffects()` must register its click handler **before** `initInteractions()` for `stopImmediatePropagation` to prevent the panel from opening on first tap. Currently `initInteractions()` is called first in app.js.

**What happens if the user taps outside the nav after first-tap**: The existing backdrop click handler in `initInteractions()` (interactions.js:395-399) already listens for clicks outside the nav and calls `closeHamburgerNav()`. However, this does **not** collapse the expanded tagline because the touch handler's `expandedBtn` state is internal to `initNavTouchEffects()`. The plan says "Tap outside: Collapse all taglines" (from my earlier review) but the plan.md does not explicitly capture this as an implementation step.

**Recommendation**:
1. Either call `initNavTouchEffects()` before `initInteractions()` in app.js, or switch from `stopImmediatePropagation` to a shared state flag (e.g., `window.__taglineExpanded`) that the existing click handler checks.
2. Add an explicit "tap outside nav collapses taglines" handler to the plan's implementation for `initNavTouchEffects()`. This can piggyback on the existing backdrop click listener at interactions.js:395-399 by resetting `expandedBtn` state.

### Issue 3 (Low): Discoverability text 2.15s duration does not conflict, but phase indicator timing needs adjustment

**What the plan says**: "Change duration from 1.5s to 2.15s" and "Change phase indicator from 'SCANNING' to 'PORTFOLIO'" (plan.md lines 169-170)

**Current `playDiscoverabilityAffordance()` timing** (animations.js:277-319):
- Sonar pulse: starts immediately, 7 stars * 0.2s stagger = 1.4s sweep
- CLI typing: starts at 0.5s delay, runs for 1.5s (current), ends at t=2.0
- Phase indicator: flips to 'SCANNING' at 0.8s, flips to 'READY' at 3.5s

**With the planned changes**:
- CLI typing: starts at 0.5s delay, runs for 2.15s (new), ends at t=2.65
- Phase indicator: flips to 'PORTFOLIO' at 0.8s — this is fine
- But the plan says the phase indicator should **not** flip to 'READY' (since the terminal scan handles that). The plan.md does not explicitly say to **remove** the second phase flip at 3.5s.

**Risk**: If the existing `delay: 3.5` flip to 'READY' is not removed, it will overwrite whatever the terminal scan has set. The terminal scan may still be running at t=3.5 post-affordance (total t=8.5 + 3.5 = t=12.0 from reveal start) and showing a scan phase — then the affordance's delayed 'READY' would stomp it.

Actually, wait — the discoverability affordance fires 2s after reveal completion (~t=8.5 total). The terminal scan started at t=2.3 and runs for ~6.4s, ending at ~t=8.7. So they overlap: the affordance's phase flip to 'READY' at t=8.5+3.5=t=12.0 would fire after the scan is complete. This is fine timing-wise, but the plan says the terminal scan's final state sets "PORTFOLIO READY" — and then 3.5s later the affordance overwrites the phase indicator to 'READY'. This is a cosmetic conflict, not a functional one, since both say 'READY'. But to be clean, the plan should explicitly note: **remove the second `gsap.to(phaseIndicator, { delay: 3.5 })` call** from the updated `playDiscoverabilityAffordance()`.

**Recommendation**: The plan's "Brand Messaging Updates" section (line 183-185) should explicitly list removing the 'READY' phase flip at 3.5s from `playDiscoverabilityAffordance()`, since the terminal scan now owns the phase indicator's terminal state.

---

## Verified Items (No Issues)

### Hover animation kill/restart
The plan says "kill in-progress animation" on hover. `gsap.killTweensOf(tagline)` followed by a new `gsap.to(tagline, { maxHeight, opacity })` is the correct pattern. `killTweensOf` accepts DOM elements and kills all active tweens targeting that element's properties. Since both `maxHeight` and `opacity` are targeted in both enter and leave tweens, calling `killTweensOf(tagline)` before starting the new tween correctly prevents stacking. Verified this works with GSAP 3.12.5.

### Shimmer timing coordination
The plan captures the shimmer as synced with the discoverability affordance (plan.md line 233: "Greek key shimmer depends on Greek key CSS"). My earlier review specified the shimmer triggers at the same time as the discoverability affordance (2s post-reveal). The plan's dependency graph correctly places shimmer in Phase 4 after Greek key CSS, and my review's FR-BETA-MOTION-06 specifies the exact timing. The plan does not contradict this — it defers timing to the animation implementation, which is correct.

### CLI message updates ("reveal universe" to "initializing portfolio...")
The plan says "Update reveal sequence CLI messages to non-fantasy language" (line 185). The desktop reveal currently types three CLI messages: "reveal universe" (t=1.6), "calibrating starfield..." (t=2.6), "ignition sequence active" (t=3.2). The mobile reveal types two: "reveal universe" (t=0), "starfield ignition active" (t=0.8). The plan correctly identifies these need updating under "Brand messaging" but does not specify the replacement text. This is acceptable — the specific replacement strings are a content decision, not an animation architecture decision. No timing changes are needed since character counts will be similar.

---

## Risk Assessment

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Scan text typing while status line still fading in | Medium | High | Visual glitch — text appears to materialize from nothing |
| Touch handler registration order wrong | Low | Medium | First tap opens panel immediately, skipping preview |
| Phase indicator stomped by stale affordance timer | Low | Low | Cosmetic — 'READY' overwrites 'READY', no visible effect |
| Skip reveal + scan race condition | None | — | Verified correct — callback fires on `progress(1)` |
| Hover kill/restart stacking | None | — | `killTweensOf` correctly prevents accumulation |

---

## Recommendations

1. **Adjust terminal scan spawn to t=2.8** (or preserve the 0.3s init hold) to ensure status lines are fully visible before scan text begins typing.
2. **Document handler registration order** for touch effects in the plan — `initNavTouchEffects()` must run before `initInteractions()` in app.js.
3. **Add "tap outside collapses taglines"** to the touch interaction implementation steps.
4. **Explicitly remove the second phase indicator flip** (delay: 3.5 to 'READY') from `playDiscoverabilityAffordance()` in the Brand Messaging section.
5. All other animation decisions are sound and ready for implementation.
