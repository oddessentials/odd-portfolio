# Devil's Advocate Review: Scroll-Driven Exploration & Remaining Polish

**Spec**: `specs/004-scroll-exploration-polish/spec.md` v0.2.0
**Reviewer**: Devil's Advocate
**Date**: 2026-03-04
**Constitution Reference**: `.specify/memory/constitution.md` v1.1.0

## Verdict: APPROVED WITH AMENDMENTS

The spec is well-structured, the user stories are clear, and the scope is defensible given the user's explicit "defer nothing" instruction. However, there are 2 HIGH concerns and 4 MEDIUM concerns that need resolution before implementation begins. No CRITICAL issues found.

---

## Concern 1: 300px Scroll Distance vs 3 Meaningful Zones

**Severity**: HIGH

The constitution's Scroll Pin Constraint states:

> The ScrollTrigger pinned section MUST complete its animation within 300px of scroll distance. [...] Pin duration exceeding one viewport height of scroll distance is prohibited.

The spec defines 3 zones at 25%-50%, 50%-75%, 75%-90% scroll progress. The current implementation in `animations.js` (line 513) creates a scroll driver with height `window.innerHeight + 300`, meaning the total scrollable distance is exactly 300px.

Let's do the math. With 300px total scroll distance:
- Zone 1 (25%-50%): 75px of scroll
- Zone 2 (50%-75%): 75px of scroll
- Zone 3 (75%-90%): 45px of scroll
- Pre-zone (0%-25%): 75px of scroll
- Post-zone (90%-100%): 30px of scroll

75px is approximately **one trackpad flick** or **one mouse wheel tick on a high-resolution scroll wheel**. Each zone transition would happen in a single gesture. The user would blow through all 3 zones in about 2-3 scroll gestures total.

This is not inherently wrong -- the constitution constraint exists to prevent scroll hijacking frustration. But the spec's acceptance scenarios describe zone transitions that "feel natural" with "nebula color shifts" and "star brightening." A 75px zone asks the user to be extremely precise with their scroll to appreciate the visual changes.

**The fundamental tension**: The constitution says "complete within 300px." The spec wants 3 visually distinct zones with transition animations. These goals are in tension, not necessarily in contradiction.

**Proposed Resolution**: Accept the 300px constraint as written. The implementation should:
1. Use `scrub: true` (not `scrub: 1.5`) for zone color transitions so there is zero latency between scroll and visual feedback
2. Make zone transitions instantaneous (snap, not fade) so 75px per zone is sufficient
3. Remove or collapse the 0%-25% "pre-zone" dead space -- if the first 75px of scroll does nothing visible, users will think scrolling is broken. Start zone 1 at 10% (30px in) instead of 25%

SC-008 in the spec already says "total scroll distance for the pinned starfield section does not exceed one viewport height" which is actually a WEAKER constraint than the constitution's 300px (one viewport height is typically 700-1080px). The spec should align SC-008 to say "does not exceed 300px" explicitly.

---

## Concern 2: FR-019 Nebula Rotation vs Frozen Shader Feature List

**Severity**: HIGH

Constitution Principle I states:

> Shader feature list is frozen at the following effects (included in scope, not expandable without explicit approval): [list]

FR-019 says:

> The nebula MUST rotate (around its vertical axis) proportionally to scroll progress, providing a continuous sense of movement through the starfield.

Looking at the current implementation (`scene.js` lines 613-618), nebula layers already rotate via `layer.rotation.y = elapsed * speed` in the GSAP ticker. FR-019 would change this to be scroll-driven instead of (or in addition to) time-driven.

This is NOT a shader change -- it is a JavaScript-level rotation of the `THREE.Points` group. The frozen shader list covers GLSL effects (fBm, bloom, etc.), not JavaScript-side object transformations. The existing `animations.js` (line 537) already does `orbGroup.rotation.y = proxy.orbRotY` as part of the scroll timeline.

**Verdict**: FR-019 does NOT violate Principle I. The nebula rotation is a scene-graph transform, not a shader feature. However, there is a conflict: the render loop in `scene.js` (line 616) sets `layer.rotation.y = elapsed * speed` every frame, and the scroll system in `animations.js` (line 537) sets `orbGroup.rotation.y = proxy.orbRotY`. Since nebula layers are children of `orbGroup`, both rotations would compound. The spec should explicitly state: "Scroll-driven rotation applies to `orbGroup.rotation.y`; ambient drift rotation continues on individual nebula layers via the existing ticker. These are additive and intentional."

If the spec does NOT clarify this, the implementer will face a "who owns rotation.y" conflict between the render loop and ScrollTrigger.

**Proposed Resolution**: Add a technical note to FR-019 clarifying the rotation ownership model. No constitution amendment needed.

---

## Concern 3: Scope Creep from REVIEW.md Mandate

**Severity**: MEDIUM

REVIEW.md explicitly categorizes these items:

| Item | REVIEW.md Classification |
|------|--------------------------|
| Scroll-driven exploration | P1 (next planned work) |
| CONSTELLATION_ZONES fantasy text | "Low (cosmetic)" / "Beta 0.1.1" |
| Star label clipping | "Low (P3 polish)" |
| Y-axis star scaling | "Low (polish)" |

The user's instruction was "defer nothing," which overrides REVIEW.md's priority assignments. This is legitimate -- the user has authority to override deferral recommendations.

However, the spec adds items NOT mentioned in REVIEW.md at all:
- **FR-001 through FR-008** (logo-cursor reliability) -- these are bug fixes from the REVIEW.md era but were not listed in REVIEW.md as outstanding items
- **FR-013** (skip-scroll affordance) -- new UX element

FR-001 through FR-008 are justified because the logo-cursor desync was a known issue fixed in the `58be354` commit, but the spec now adds 8 FRs that amount to a comprehensive re-specification of logo behavior. If the existing fix works, this is redundant specification. If it doesn't work, this is a legitimate bug fix.

FR-013 (skip-scroll affordance) is directly mandated by the constitution's Scroll Pin Constraint: "A 'skip intro' affordance [...] MUST be present and fade after 3 seconds." The constitution says "skip intro" but the spec interprets this as "skip scroll." These are different things -- a skip-intro already exists (`animations.js` line 429). The constitution's constraint is about the scroll-pinned section specifically, so FR-013 is a valid interpretation.

**Proposed Resolution**:
- FR-001 through FR-008: Verify whether the `58be354` fix already addresses these scenarios. If yes, downgrade to "verify existing behavior" rather than "implement from scratch." If no, keep as-is.
- FR-013: Rename to match constitution language ("skip scroll" is the scroll-section analog of the existing "skip intro" for the reveal sequence). Acceptable as-is.

---

## Concern 4: FR-023 Label Flip Logic is Over-Engineered

**Severity**: MEDIUM

FR-023 says labels must "reposition (flip horizontal anchor) if they would extend beyond the visible viewport boundary."

The 7 star positions are hard-coded:

| Project | X Position | Edge Risk |
|---------|-----------|-----------|
| odd-fintech | -2.2 | LEFT edge |
| ado-git-repo-insights | -2.0 | LEFT edge |
| odd-self-hosted-ci | -0.8 | No |
| odd-map | 0.3 | No |
| coney-island | 1.0 | No |
| odd-ai-reviewers | 1.8 | Possible RIGHT edge |
| repo-standards | 2.2 | RIGHT edge |

Only 3-4 stars can possibly clip. The positions never change (hard-coded in `data.js`). A dynamic viewport-boundary check is unnecessary when you can test the 7 known positions at the reference viewport (1920x1080) and hard-code the anchor direction per star.

Dynamic flip logic adds:
- A `getBoundingClientRect()` call per label render (every frame while hovered)
- Conditional CSS class toggling
- Edge case handling for labels at corners (both X and Y flip?)

**Proposed Resolution**: Replace FR-023 with: "Labels for stars at x <= -2.0 MUST use right-anchored positioning (label extends leftward from star). Labels for stars at x >= 2.0 MUST use left-anchored positioning (label extends rightward from star). All other labels use default (right-extending) positioning." This is simpler, testable against the 7 known positions, and requires zero runtime computation.

If the Y-axis scaling (FR-024-027) changes star positions significantly on portrait devices, revisit this -- but on portrait mobile, sidebars are hidden, so clipping is not an issue there.

---

## Concern 5: SC-006 and SC-007 Measurability

**Severity**: MEDIUM

**SC-006**: "Frame rate remains at or above 55fps during continuous scrolling" -- The original spec said SC-006 was about "scroll-to-paint latency <50ms." Looking at the current spec, SC-006 says 55fps and SC-007 says <50ms latency.

SC-007's 50ms target: The scroll-to-paint pipeline is: scroll event -> ScrollTrigger onUpdate callback -> GSAP proxy update -> next rAF tick -> Three.js render. With `scrub: true`, GSAP processes on the same tick as the scroll event. The uniform update happens in the onUpdate callback. The render happens on the next GSAP ticker tick (which IS the rAF tick, per constitution Principle II). So the pipeline is:

1. Scroll event fires (frame N)
2. ScrollTrigger processes in the same microtask
3. onUpdate sets proxy values
4. GSAP ticker fires on next rAF (frame N or N+1)
5. Render loop reads proxy values and renders

At 60fps, one frame is 16.7ms. If the scroll event happens early in frame N, the render happens at end of frame N (~16ms latency). If the scroll event happens late in frame N, the render happens in frame N+1 (~33ms latency). The 50ms target is achievable but only barely, and measuring it requires `performance.mark()` instrumentation that the spec doesn't describe.

SC-006's 55fps target (changed from 60fps in the constitution) is measurable via DevTools or the existing auto-tier benchmark. This is fine.

**Proposed Resolution**:
- SC-007: Rephrase to "Zone transition visual feedback begins within 2 frames (33ms at 60fps) of crossing a zone boundary, as verified by instrumenting the ScrollTrigger onUpdate callback with `performance.mark()` pairs." This is specific and measurable.
- SC-006: Keep as-is. 55fps is a reasonable floor (the constitution says 60fps target, 30fps hard limit).

---

## Concern 6: Fantasy Text in `constellation` Field Not Addressed

**Severity**: MEDIUM

FR-028 through FR-030 update `CONSTELLATION_ZONES` names and status text. But each project in `data.js` still has a `constellation` field with fantasy names:

```js
constellation: 'The Forge Septet'
constellation: "The Scribe's Lens"
constellation: 'The Iron Codex'
constellation: 'The Engine Core'
constellation: "The Navigator's Rose"
constellation: "The Alchemist's Eye"
constellation: 'The Hearth Star'
```

FR-030 says "No visible text anywhere in the interface MUST contain fantasy-themed language when displayed to users during scroll interactions."

The `constellation` field is not currently displayed in the UI during scroll interactions. It WAS used in the Alpha's sidebar (as constellation names) but the Beta replaced those with real project names. The field is now an internal grouping label with no rendering path.

However, the 003 spec Beta polish review (plan-review-devils-advocate.md, line 252-254) already flagged this:

> "The field name is fine (internal implementation detail), but the CONSTELLATION_ZONES array's name values [...] are also fantasy-themed. These names appear only in code, not in the UI, so they are low-risk -- but they should be documented as 'internal identifiers retained for backwards compatibility, not user-facing.'"

**Proposed Resolution**: Add a note to the spec: "The `constellation` field on each project object retains its fantasy name as an internal grouping identifier. It is not rendered in the UI. No change required." This prevents a future implementer from spending time on a non-issue, and explicitly documents the decision.

---

## Concern 7: Skip-Scroll vs Skip-Intro Button Coexistence

**Severity**: LOW

The existing codebase has a "skip intro" button (`animations.js` line 429) for the reveal sequence. FR-013 adds a "skip scroll" button for the scroll-pinned section. After the reveal completes, the skip-intro button is removed. Then the scroll section begins, and the skip-scroll button would appear.

Potential UX confusion: two different "skip" buttons appear at different times in the same session. The user may think they're the same button.

**Proposed Resolution**: The skip-scroll button should have distinct visual treatment and labeling. Suggest: the skip-intro button says "Skip" (or uses the S key); the skip-scroll affordance should say "Jump to projects" or use a down-arrow icon rather than "Skip." The spec should specify the label text.

---

## Concern 8: Scroll Container Layout Impact

**Severity**: LOW

FR-009 requires an "artificial height" scroll container. The current implementation (`animations.js` line 513) creates a `#scroll-driver` div appended to `document.body` with `height: innerHeight + 300`. FR-011 removes `overflow: hidden` from `html`, `body`, and `#app-shell`.

The existing CSS has `overflow: hidden` on:
- `html, body` (styles.css line 90)
- `#app-shell` (styles.css line 119)
- `.frame__viewport` (styles.css line 146)
- `.frame__main-area` (styles.css line 183)

Removing overflow from the first three but not the last two means the scroll container and the CSS grid layout must coexist. The `#app-shell` is pinned via ScrollTrigger (`pin: '#app-shell'`), which adds `position: fixed` and `transform` properties. This works, but:

1. `position: fixed` elements with `transform` create a new containing block, which can break `position: fixed` children. If any child of `#app-shell` uses `position: fixed` (e.g., the project overlay), it will be positioned relative to `#app-shell` instead of the viewport.
2. The project overlay (`role="dialog"`) likely uses `position: fixed` to center on screen. If ScrollTrigger pins `#app-shell` with a transform, the overlay will be mispositioned.

**Proposed Resolution**: The spec should add an edge case or technical note: "When the project overlay is open during the scroll-pinned state, the overlay MUST position correctly relative to the viewport, not relative to the pinned scroll container. Implementation must account for ScrollTrigger's pin mechanism creating a new containing block."

This was already partially covered in the edge case "Overlay open during scroll" but that only addresses scroll-locking, not positioning.

---

## Concern 9: Reduced Motion vs Zone Color Changes

**Severity**: LOW

FR-031 says: "When `prefers-reduced-motion: reduce` is active, nebula color zone transitions MUST apply instantly (duration zero) rather than animated."

FR-032 says: "When `prefers-reduced-motion: reduce` is active, star brightening/scaling within zones MUST be suppressed -- stars remain at default visual state."

These two requirements are asymmetric. Color changes still happen (instantly) but star scaling is suppressed entirely. This means reduced-motion users can see the nebula shift colors but cannot see which stars belong to which zone. The zone-to-project association is only communicated through the status text (FR-018).

This is acceptable accessibility behavior -- the status text provides the information. But it should be explicitly documented that "In reduced-motion mode, the status text is the primary mechanism for communicating zone changes. Star visual differentiation is not available."

**Proposed Resolution**: Add this note to the accessibility section or to FR-032's description.

---

## Summary Table

| # | Concern | Severity | Status |
|---|---------|----------|--------|
| 1 | 300px scroll vs 3 zones feasibility | HIGH | Requires spec amendment (zone ranges, SC-008 wording) |
| 2 | FR-019 nebula rotation ownership conflict | HIGH | Requires technical note (not a constitution violation) |
| 3 | Scope creep from REVIEW.md mandate | MEDIUM | Acceptable given user instruction; verify logo fix |
| 4 | FR-023 label flip over-engineering | MEDIUM | Replace with static per-star anchor assignment |
| 5 | SC-006/SC-007 measurability | MEDIUM | Rephrase SC-007 with concrete measurement method |
| 6 | `constellation` field fantasy text | MEDIUM | Document as intentionally retained internal identifier |
| 7 | Skip-scroll vs skip-intro UX | LOW | Specify distinct label text for skip-scroll |
| 8 | Scroll container layout impact | LOW | Add technical note about containing block |
| 9 | Reduced motion asymmetry | LOW | Document status text as primary reduced-motion signal |

**Total**: 0 CRITICAL, 2 HIGH, 4 MEDIUM, 3 LOW

The spec is approved with amendments. The HIGH items (Concern 1 and 2) should be resolved before the plan is written. The MEDIUM items should be addressed in the plan or task breakdown. The LOW items can be addressed during implementation.
