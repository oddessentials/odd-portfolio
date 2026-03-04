# Plan Review: Devil's Advocate

**Reviewer**: Devil's Advocate
**Artifact**: `specs/003-beta-portfolio-polish/plan.md` (+ cross-artifact analysis)
**Date**: 2026-03-04
**Review Type**: Cross-cutting risk review

---

## Verdict: APPROVE WITH CONCERNS

The plan is well-structured, correctly prioritized, and demonstrates strong awareness of the existing codebase. The dependency graph is sound, the constitution amendment is justified, and the scope is appropriately bounded. However, I have identified 2 critical issues that must be resolved before implementation, 4 high-risk items that should be mitigated, and several medium/low items. The critical issues are not plan design flaws but rather implementation traps that will cause real bugs if not addressed in the task breakdown.

---

## Critical Issues (must fix before implementation)

### C-1: Star position scaling formula breaks at x=0 and produces visual discontinuity at exactly 16:9

**Location**: Plan section "Responsive Star Scaling (FR-004, FR-005, FR-006, FR-007)" in `js/scene.js`

**The problem**: The plan specifies `xScale = Math.min(1, currentAspect / designAspect)` where `designAspect = 16/9`. This formula:

1. **Returns exactly 1.0 at the design aspect ratio** (16:9), which is correct.
2. **Returns < 1.0 on narrower viewports**, which compresses star x-positions toward center.
3. **Returns 1.0 (clamped) on wider viewports** (e.g., ultrawide 21:9), which is correct.

However, the plan says to apply `sprite.position.x = userData.basePosition[0] * xScale`. This means:

- **A star at x=0 (e.g., odd-map at x=0.3)**: Position barely changes. Fine.
- **A star at x=-2.2 (e.g., odd-fintech)**: Gets compressed to x=-0.59 on mobile portrait (9:16). This is correct behavior.
- **But the plan does NOT address the y-axis at all.** On a 9:16 portrait device, the vertical FOV is constant (45 degrees) but the horizontal frustum shrinks. If you compress x-positions into a narrow band but leave y-positions unchanged, you get a **tall, thin vertical stripe of 7 stars clustered in a narrow column** -- not a "preserved relative spatial arrangement" as FR-005 requires.

The fundamental issue: **position scaling on x-axis only does NOT preserve relative spatial arrangement.** Stars that were diagonally separated will become vertically stacked. At extreme aspect ratios (e.g., 9:16 mobile), `odd-ai-reviewers` (1.8, 1.0) and `repo-standards` (2.2, -0.4) will both compress to x ~0.49 and x ~0.59 respectively, separated by only ~0.1 world units horizontally but 1.4 vertically. They will appear as a vertical column.

**SC-002 says all 7 stars must remain visible.** They will remain visible, but "relative spatial arrangement preserved" (FR-005) will be violated on narrow viewports.

**Recommendation**: The plan must acknowledge this trade-off explicitly or add a compensating y-axis compression for extreme aspect ratios (e.g., scale y by `Math.max(0.8, 1 - (1 - xScale) * 0.3)` to slightly compress the vertical spread as x compresses). Alternatively, accept the visual degradation and note it in the plan as a known limitation on portrait-mode devices. Either way, the plan should not silently claim FR-005 is satisfied when it demonstrably will not be on portrait mobile.

### C-2: Terminal scan timeline and reveal skip interaction has a timing race

**Location**: Plan section "Terminal Scan Animation (FR-021-FR-029)" in `js/animations.js`

**The problem**: The plan says:
- Terminal scan is spawned at `t=2.3` in the desktop reveal timeline via callback
- The scan is an independent timeline (not nested in master)
- Skipping the reveal "MUST still trigger the terminal animation to run at normal speed" (FR-027)

Now look at how skip works in the current code (`animations.js:352`):
```js
function doSkip() {
  masterTimeline.progress(1);  // jumps to end
  removeSkip();
}
```

When `masterTimeline.progress(1)` fires, GSAP evaluates all tweens at their end state. If the callback at `t=2.3` that spawns the terminal scan timeline is a simple `onComplete` or `call()` callback, GSAP **will** fire it during `progress(1)` -- but the **timing depends on implementation**. Specifically:

- If the callback is added via `tl.call(playTerminalScan, null, 2.3)`, GSAP fires it when the playhead crosses 2.3. When jumping to `progress(1)`, the playhead crosses 2.3, so the callback fires. Good.
- **But** the `onComplete` of the master timeline also fires, which triggers `gsap.delayedCall(2, playDiscoverabilityAffordance)`. The discoverability affordance types "Force multipliers for small businesses..." into the command line. If the terminal scan is also writing to the command line area (scan text), these two timelines may fight over the same DOM elements.

Wait -- re-reading the plan, the terminal scan writes to `#scan-line` in the status panel (right sidebar), NOT the command line. The discoverability affordance writes to `.cmd-text` in the command line (bottom bar). These are different DOM elements. **No conflict.** I retract the DOM-conflict concern.

However, the plan says the terminal scan's **final state** includes `"PORTFOLIO READY"` which should update the phase indicator (`.phase-indicator`). The discoverability affordance (`playDiscoverabilityAffordance`) ALSO updates `.phase-indicator` to "SCANNING" then "READY". When skip fires:

1. t=0 -> progress(1): all reveal tweens fire at end state
2. Callback at t=2.3 fires `playTerminalScan()` -- starts independent scan timeline
3. `onComplete` fires -> `gsap.delayedCall(2, playDiscoverabilityAffordance)`
4. 2 seconds later, discoverability affordance fires, sets `.phase-indicator` to "SCANNING"
5. Terminal scan is still running, will set phase to "PORTFOLIO READY" at ~t+6.4s
6. Discoverability affordance sets phase to "READY" at ~t+3.5s (via gsap delay)

This produces a phase indicator sequence: "SCANNING" (from discoverability) -> "READY" (from discoverability) -> "PORTFOLIO READY" (from terminal scan). The user sees the phase flicker through multiple states.

**Recommendation**: The plan must specify that the discoverability affordance's phase indicator update is removed or deferred until AFTER the terminal scan completes. Or the terminal scan should own the phase indicator exclusively. Define clear ownership of the `.phase-indicator` element.

---

## High-Risk Items (should fix or mitigate)

### H-1: Greek key CSS gradient stack complexity and cross-browser rendering

**Location**: Plan section "Greek Key Pattern (FR-030-FR-037)" in `css/styles.css`

The plan specifies a "6-layer Greek key gradient stack" in a single `background` property. This is the riskiest CSS in the entire plan because:

1. **A 6-layer `repeating-linear-gradient` stack is notoriously fragile across browsers.** Safari has historically had sub-pixel rendering differences in multi-layered repeating gradients. Firefox and Chrome also differ in how they anti-alias gradient stops at exact pixel boundaries.
2. **At 36px tile size, the meander pattern requires precise stop positions.** A 1px rounding error at any of the 6 layers will produce visible seams or broken patterns. The `--gk-line: 3px` and `--gk-cell: 36px` variables must produce a recognizable Greek key -- this is not a simple checkerboard.
3. **No fallback specified.** If the gradient stack fails to render recognizably in any browser, the element will show nothing or garbage. The plan should specify a fallback (e.g., the existing rivet-band gradient as a first layer, with the meander stacked on top).
4. **The plan does not describe the actual gradient math.** "6-layer Greek key gradient stack" is an aspiration, not an implementation specification. The implementer will need to reverse-engineer a meander pattern from gradients, which is a non-trivial exercise that could easily consume more time than expected.

**Recommendation**: Add a fallback gradient that matches the current rune-band as the base layer. If the Greek key layers fail, the fallback is a simple brass stripe (not invisible). Also, consider whether this should be an inline SVG `data:` URI instead -- the constitution says "no external image files" and "CSS gradients, box-shadows, pseudo-elements, inline SVG" are all listed as acceptable. An SVG data URI is arguably more maintainable than a 6-layer gradient stack.

### H-2: Hover description interaction conflicts with existing click handler

**Location**: Plan section "Hover Descriptions (FR-012-FR-018)" in `js/interactions.js`

The plan describes adding `initNavHoverEffects()` and `initNavTouchEffects()` functions. The touch behavior is:
- First tap: expand tagline preview (call `stopImmediatePropagation`)
- Second tap: open project panel

But the current code in `interactions.js:349-358` already has click handlers on every nav button:
```js
btn.addEventListener('click', () => {
  const project = PROJECTS.find(p => p.id === projectId);
  if (project) {
    showProjectPanel(project, btn);
    updateAriaPressed(projectId);
  }
});
```

The plan says `stopImmediatePropagation` on first tap to prevent the panel from opening. This will work **only if** the new touch handler is registered BEFORE the existing click handler in the event listener chain. If `initNavTouchEffects()` runs after `initInteractions()` (which registers click handlers), the `stopImmediatePropagation` call must be on a listener added BEFORE the click handler, or on a different event (e.g., `pointerdown` vs `click`).

The plan does not specify listener ordering, event type, or how the existing click handler is modified/intercepted.

**Recommendation**: The plan should explicitly state whether:
(a) The existing click handler is wrapped with a guard check (e.g., `if (btn.classList.contains('tagline-expanded')) showProjectPanel(...); else return;`)
(b) The touch handler uses `stopImmediatePropagation` on `click` and is guaranteed to register before the existing click handler
(c) The existing click handler is replaced entirely with a unified handler that checks touch/hover state

Option (a) is simplest and least fragile. Option (b) relies on registration order, which is brittle. The plan should specify.

### H-3: Resize handler debounce interacts poorly with Three.js star scaling

**Location**: Plan section "Resize Handler (FR-047, FR-049)" in `js/interactions.js` and plan section "Responsive Star Scaling" in `js/scene.js`

The plan adds two separate resize behaviors:
1. In `scene.js`: star position scaling on resize (runs in the existing `onResize()` handler at line 489)
2. In `interactions.js`: debounced (100ms) resize listener for hamburger nav cleanup

The star position scaling in `scene.js` runs immediately on resize (no debounce). This is correct for visual responsiveness. But if the user is rapidly resizing (e.g., DevTools responsive mode drag), every frame will:
1. Call `onResize()` in scene.js -- recalculate camera, renderer size, AND now recalculate all 7 star positions + nebula volumes
2. The render loop (60fps) will raycast against star positions that may have JUST been updated

The concern: during rapid resize, star positions change every frame, the raycaster tests against moving targets, and the hover label positions (projected via `project3DtoScreen`) may jitter because the camera projection matrix and star positions are changing simultaneously.

**Recommendation**: Consider debouncing the star position scaling (not the camera/renderer resize, which must be immediate) with a ~50ms debounce, or batch the position updates with `requestAnimationFrame` to ensure they only run once per frame. This is not critical -- it is a jitter issue, not a crash -- but it should be documented as a known edge case.

### H-4: Missing `prefers-contrast: more` interaction with Greek key shimmer and terminal scan

**Location**: Spec edge cases section, constitution Principle III

The spec mentions `prefers-reduced-motion` extensively but the plan does not address the interaction between `prefers-contrast: more` and the new features:

1. **Greek key pattern under high contrast**: The current CSS has `.frame { display: none }` under `prefers-contrast: more`. This means the Greek key (which is a child of `.frame`) will be hidden. Good -- but this is not documented in the plan. The implementer may not realize the Greek key is automatically hidden by high contrast mode.
2. **Terminal scan under high contrast**: The terminal scan writes to `#status-panel` which gets `background: #000; border-color: #fff` under high contrast. The terminal text color (`--color-text-mono`) becomes `#ffffff`. This should work, but the "brass glow flash" on completion (the plan says "brass glow flash" for the PORTFOLIO READY state) would use brass colors that are ONLY decorative under the constitution. Under high contrast, brass colors may violate the high-contrast override.
3. **Combined `prefers-reduced-motion` AND `prefers-contrast: more`**: Both must apply simultaneously. The plan does not discuss this combination. Does the terminal show final state immediately (reduced motion) AND with white-on-black styling (high contrast)? It should, but it is not explicitly stated.

**Recommendation**: Add a note in the plan that:
- Greek key is automatically hidden by existing high-contrast CSS (`.frame { display: none }`)
- Terminal scan's "brass glow flash" must be suppressed or converted to a plain white flash under `prefers-contrast: more`
- The dual-preference case (reduced motion + high contrast) results in instant final state with high-contrast styling

---

## Medium-Risk Items (nice to fix)

### M-1: `shortDesc` validation is specified but enforcement mechanism is absent

The data model says `shortDesc` must be "3-6 words (15-45 characters)" and must not duplicate the full `tagline`. But there is no build system, no linter, and no runtime validation. This constraint exists only as documentation.

Looking at the proposed values:
- "AI code review pipeline" = 4 words, 25 chars -- PASS
- "Azure DevOps PR metrics" = 4 words, 23 chars -- PASS
- "Repo quality standards" = 3 words, 22 chars -- PASS
- "Self-hosted CI runtime" = 3 words (or 4 with hyphenated) -- PASS
- "Interactive office locator" = 3 words, 27 chars -- PASS
- "Financial intelligence dashboard" = 3 words, 33 chars -- PASS
- "Restaurant with AI chat" = 4 words, 23 chars -- PASS

All values pass. But future edits have no guard. **Low real risk** since the dataset is 7 entries managed by hand, but worth noting.

### M-2: Terminal scan progress percentages don't divide evenly

The spec says progress increments of "~14% per project" and lists specific values: 14, 28, 43, 57, 71, 86, 100. These are computed as `round(i/7 * 100)`:
- 1/7 = 14.28 -> 14
- 2/7 = 28.57 -> 29 (spec says 28)
- 3/7 = 42.86 -> 43
- 4/7 = 57.14 -> 57
- 5/7 = 71.43 -> 71
- 6/7 = 85.71 -> 86
- 7/7 = 100

The spec says 28 but `round(2/7 * 100)` = 29. This is a trivial inconsistency but the ASCII progress bar `[##........] XX%` will show "28%" or "29%" -- the implementer needs to know which. Use `Math.round(((i+1)/7)*100)` and accept rounding (14, 29, 43, 57, 71, 86, 100) or hard-code the spec values (14, 28, 43, 57, 71, 86, 100).

**Recommendation**: Hard-code the array `[14, 28, 43, 57, 71, 86, 100]` to match the spec exactly. Do not compute.

### M-3: Plan claims "0 new files created" but quickstart implies possible new CSS classes

The plan and quickstart both say "No new files." This is correct -- all changes are to existing files. However, the quickstart file map says `js/app.js` changes include "Terminal scan trigger." This means `app.js` must import or call `playTerminalScan` from `animations.js`. The plan's dependency graph shows the terminal scan is spawned via callback at `t=2.3` in the reveal timeline, meaning the call originates in `animations.js`, not `app.js`. So `app.js` changes may be minimal or zero for the terminal scan.

But the plan section for `app.js` says "Init sequence updates (terminal scan trigger)" without specifying what changes. If the terminal scan is truly spawned by a callback within the reveal timeline (inside `animations.js`), then `app.js` needs zero changes for this feature. The plan should clarify.

### M-4: Nebula volume scaling not fully specified

The plan says "Scale nebula volume `xRange` values proportionally in each layer's config" but does not specify the formula. The nebula configs are:
- Layer 0: xRange 3.5, yRange 2.5
- Layer 1: xRange 4.0, yRange 3.0
- Layer 2: xRange 4.5, yRange 3.2

Should `xRange` be scaled by the same `xScale` factor? If so, on a 9:16 device, `xScale = 0.5625 / 1.778 = 0.316`, giving xRange values of 1.1, 1.27, 1.42. This dramatically compresses the nebula, which is correct to keep particles near the now-compressed stars.

But the nebula particles are generated once at startup in `initScene()`. They are not repositioned on resize. The star scaling formula runs in `onResize()`, but the nebula particle positions are fixed in the buffer geometry. **You cannot scale nebula xRange on resize without regenerating or transforming all 1500 nebula particles.**

Options:
(a) Regenerate nebula particles on resize (expensive, GC pressure)
(b) Scale the entire `orbGroup` x-axis (affects stars too -- double-scaling)
(c) Accept that nebula doesn't scale and only scale stars
(d) Multiply nebula layer `scale.x` by `xScale` in the resize handler

Option (d) is the simplest: `nebulaLayers.forEach(l => l.scale.x = xScale)`. This uniformly compresses the point cloud in x without regenerating geometry. **The plan should specify this.**

### M-5: `#orb-hitzone` z-index layering after the fix may block star labels

The plan moves `#orb-hitzone` to `position: fixed; inset: 0` with `z-index: calc(var(--z-hud) - 1)` (= 19). Star labels are at `z-index: var(--z-star-labels)` (= 25) with `pointer-events: none`. Sidebars are at `z-index: var(--z-hud)` (= 20).

This stacking:
- Canvas: 0
- Frame: 10
- Hitzone: 19
- Sidebars/HUD: 20
- Star labels: 25

Star labels have `pointer-events: none`, so they don't block mouse events. The hitzone at z=19 receives mouse events across the full viewport. Sidebars at z=20 sit above the hitzone and receive their own events. This should work.

But wait -- currently `#orb-hitzone` is `position: absolute` inside `#main-viewport` which is `position: relative`. Changing it to `position: fixed` removes it from the grid layout flow. The `#main-viewport` content (star labels, fallback image) remains in the grid. The hitzone is now a separate stacking context at the viewport level.

**Concern**: The `#star-labels` container is inside `#main-viewport` (grid column 2), so star labels are positioned relative to the center column, not the full viewport. But stars can be at x=-2.2 (behind the left sidebar). The label for `odd-fintech` will be projected to a screen position behind the sidebar, but the `#star-labels` container only covers the center column. **The label will be clipped by `#main-viewport { overflow: hidden }`.**

This is an existing bug in Alpha (labels for left-side stars clip at the sidebar boundary), but the plan does not fix it. The plan expands the hitzone but does not expand the label container. Labels for stars behind sidebars will remain invisible.

**Recommendation**: Note this as a known limitation, or move `#star-labels` to be a fixed overlay at the viewport level (alongside the hitzone) rather than inside `#main-viewport`.

---

## Low-Risk Items (document and accept)

### L-1: Scroll zone status text still uses fantasy language

The plan's brand messaging updates section says "Update scroll zone status text" but the current `animations.js:438-441` has:
```js
const zoneMessages = [
  { cmd: 'scanning arcane tools constellation...', phase: 'ZONE 1' },
  { cmd: 'interfacing with intelligence matrix...', phase: 'ZONE 2' },
  { cmd: 'triangulating outpost network...', phase: 'ZONE 3' }
];
```

The plan lists this as a change but doesn't specify the replacement text. The implementer needs exact strings. This is P3 (brand messaging) so not blocking, but the task breakdown should include the replacement text.

### L-2: `constellation` field remains in data model

The data model still includes the `constellation` field ("The Forge Septet", etc.) even though the Beta replaces fantasy names with real names in the UI. The `constellation` field is used by `CONSTELLATION_ZONES` for scroll-driven zone grouping. The field name is fine (internal implementation detail), but the `CONSTELLATION_ZONES` array's `name` values ("Arcane Tools", "Intelligence Matrix", "Outpost Network") are also fantasy-themed. These names appear only in code, not in the UI, so they are low-risk -- but they should be documented as "internal identifiers retained for backwards compatibility, not user-facing."

### L-3: Auto-tier fallback timeout change from 12s to 20s may be too conservative

The plan changes the fallback timeout from 12000ms to 20000ms. The current code (`performance.js:356-359`) fires `runBenchmark()` after 12s as a fallback if `reveal-complete` never fires. With the terminal scan adding ~6.4s of animation AFTER the reveal, the 20s timeout is generous.

However, the benchmark runs "5 seconds after reveal-complete." If the reveal is 6.5s + terminal scan is 6.4s, the terminal scan finishes at ~12.9s. The benchmark fires at reveal-complete + 5s = ~11.5s. This means **the benchmark fires BEFORE the terminal scan finishes**, which means it benchmarks during active animation (text updates to DOM). This contradicts the constitution's requirement that the benchmark runs "during idle steady-state, not during the high-load reveal."

**Recommendation**: The benchmark should fire 5 seconds after BOTH reveal-complete AND terminal-scan-complete, whichever is later. The plan should add a `terminal-scan-complete` custom event and defer the benchmark trigger.

### L-4: Mana meter accessibility

The plan says "mana meter remains static and non-interactive (unchanged from Alpha)." The current HTML uses `<meter>` with `aria-label="Mana level"`. In Beta, with real brand language, "Mana level" is fantasy terminology that contradicts FR-040 ("remove constellation/fantasy terminology"). The meter itself is decorative, so the simplest fix is `aria-hidden="true"` on the meter. This is a tiny omission but should be in the task list.

### L-5: OG meta tag `og:image` still points to `assets/logo.svg`

The plan says "Update OG meta tags" but SVG is not widely supported as an OG image format (Facebook and Twitter/X prefer PNG/JPG at 1200x630). This is a pre-existing issue, not introduced by Beta. Document and accept.

---

## Recommendations

1. **Resolve C-1 and C-2 before generating tasks.** C-1 needs either a y-axis compensation formula or an explicit "known limitation" statement. C-2 needs clear ownership of the `.phase-indicator` element between terminal scan and discoverability affordance.

2. **Add Greek key fallback (H-1).** Even if it is just `background: var(--existing-rivet-band-gradient)` as the first layer, it prevents a blank strip if the meander gradients fail.

3. **Specify touch handler strategy (H-2).** Pick option (a) -- guard the existing click handler -- and document it in the plan.

4. **Specify nebula scaling method (M-4).** Use `nebulaLayers.forEach(l => l.scale.x = xScale)` in the resize handler. One line of code, solves the problem.

5. **Document the star label clipping limitation (M-5)** as a known issue for a future fix. Do not try to fix it in Beta -- it requires restructuring the label container, which is out of scope.

6. **Hard-code progress percentages (M-2)** to `[14, 28, 43, 57, 71, 86, 100]`.

7. **Defer benchmark until terminal scan completes (L-3).** Add a `terminal-scan-complete` event.

8. **Add `aria-hidden="true"` to mana meter (L-4)** to suppress fantasy-themed screen reader announcement.

---

## Cross-Artifact Consistency Check

| Check | Result | Notes |
|---|---|---|
| All 49 FRs addressed in plan? | PASS | All FR-001 through FR-049 are mapped to specific file changes |
| Data model matches plan? | PASS | `shortDesc` field addition is consistent |
| Quickstart matches plan? | PASS with note | `app.js` changes may be zero for terminal scan (M-3) |
| Plan contradicts spec? | MINOR | Progress percentages (M-2), phase indicator ownership (C-2) |
| Plan contradicts constitution? | PASS | Amendment justified, all other principles checked |
| Plan contradicts research? | PASS | All R1-R7 decisions are faithfully carried into plan |
| Dependency graph has circular deps? | NO | Linear phase ordering, no cycles detected |
| Phase ordering is correct? | PASS | P0 before P1 before P2, each phase's deps are satisfied |

---

**Bottom line**: This is a good plan. The architecture is sound, the scope is disciplined, and the constitution compliance is genuine. The two critical issues are implementation details that will cause real bugs if unaddressed, but they are fixable with small plan amendments. The high-risk items are mitigation opportunities, not blockers. I recommend addressing C-1, C-2, and H-2 before generating tasks, and documenting H-1, H-3, H-4, M-4, M-5, and L-3 as implementation notes in the task breakdown.
