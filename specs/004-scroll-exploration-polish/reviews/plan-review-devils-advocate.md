# Devil's Advocate Plan Review: Scroll-Driven Exploration & Remaining Polish

**Plan**: `specs/004-scroll-exploration-polish/plan.md`
**Supporting docs**: `research.md`, `data-model.md`
**Reviewer**: Devil's Advocate
**Date**: 2026-03-04
**Constitution Reference**: `.specify/memory/constitution.md` v1.1.0

## Verdict: APPROVED WITH AMENDMENTS

The plan is solid. The pinless scroll architecture is the right call, the ShaderMaterial migration is well-justified, and the compressed zone ranges address my earlier concern about dead zones. The research document resolves all 8 decisions with clear rationale and rejected alternatives. The data model is clean.

However, I found 1 HIGH issue (a sequencing bug that would cause a runtime conflict), 3 MEDIUM issues, and 2 LOW issues.

---

## H-1: `initScrollInteractions()` Called Before Reveal Completes (HIGH)

**Location**: Plan Phase 2, step 4; current code `js/app.js` line 41

The plan says: "In `js/animations.js`, after `reveal-complete` event, call `initScrollZones()`."

But the current code in `app.js` (line 41) calls `initScrollInteractions()` **unconditionally** after `playRevealSequence()` returns, not after the reveal completes:

```js
// app.js lines 34-41
const masterTl = playRevealSequence();
if (masterTl) {
  initSkipIntro(masterTl);
  handleScrollDuringReveal(masterTl);
}
initScrollInteractions(); // <-- fires immediately, not after reveal-complete
```

The plan introduces `initScrollZones()` as a replacement for `initScrollInteractions()` but doesn't explicitly state that:
1. `initScrollInteractions()` must be removed from `app.js`
2. `initScrollZones()` must be wired to fire on the `reveal-complete` custom event (dispatched at `animations.js` line 30)
3. The `body.classList.add('scroll-enabled')` must also be gated behind `reveal-complete`

Additionally, `handleScrollDuringReveal()` (animations.js line 707) listens for scroll/wheel events and force-completes the reveal if the user scrolls. But if `overflow: hidden` is still on `body` during the reveal (per the plan), no scroll events can fire, making `handleScrollDuringReveal()` dead code. The plan should clarify: is `handleScrollDuringReveal()` retained, removed, or adapted?

**Proposed Resolution**: Add an explicit step to Phase 2:
- Remove `initScrollInteractions()` call from `app.js` line 41
- Add a `reveal-complete` event listener in `app.js` that calls `initScrollZones()` and adds `body.scroll-enabled`
- Decide whether `handleScrollDuringReveal()` is retained (it would need to listen for `wheel` events on the body even while `overflow: hidden`, which some browsers may or may not fire)

---

## M-1: Existing `initScrollInteractions()` Code Not Addressed (MEDIUM)

**Location**: Plan Phase 2; current code `js/animations.js` lines 498-594

The plan introduces a new `initScrollZones()` function with a pinless architecture. But the existing `initScrollInteractions()` function (70+ lines of code at lines 498-594) still exists. It uses:
- `pin: '#app-shell'` (the rejected approach)
- `scrub: 1.5` (the plan uses no scrub)
- Fantasy-themed zone messages (hardcoded at lines 545-549)
- Direct `orbGroup.rotation.y` and `camera.position.z` manipulation
- Its own `brightenZoneStars()` function

The plan doesn't explicitly say "delete `initScrollInteractions()` and replace with `initScrollZones()`." It says "in `js/animations.js`, after reveal-complete, call `initScrollZones()`" as if it's a new addition. But the old function must be removed, its export must be updated in the exports block (line 754), and `app.js` must stop importing/calling it.

Similarly, `brightenZoneStars()` (lines 600-627) tweens both scale AND opacity. The plan's Phase 4 only tweens scale (1.3x), with opacity left at 1.0 per Research Decision 4 ("Opacity stays at 1.0"). The existing function dims non-zone stars to opacity 0.4, which contradicts the plan. The plan should state whether `brightenZoneStars()` is replaced, modified, or removed.

**Proposed Resolution**: Add to Phase 2 or Phase 4:
- Delete `initScrollInteractions()` (lines 498-594) and `brightenZoneStars()` (lines 600-627)
- Replace with `initScrollZones()` and a new zone-star handler that matches the plan's 1.3x scale / no opacity change design
- Update exports in animations.js and imports in app.js

---

## M-2: ShaderMaterial Vertex Shader Missing `vertexColors` Attribute (MEDIUM)

**Location**: Plan Phase 3, step 1

The plan's vertex shader declares:

```glsl
attribute float aSize;
varying vec3 vColor;
void main() {
  vColor = color;
  ...
}
```

The built-in `color` attribute is only available when `THREE.BufferGeometry` has a `color` attribute AND the material is told to use vertex colors. With `PointsMaterial`, this is handled by `vertexColors: true`. With `ShaderMaterial`, the implementer must:

1. Set `vertexColors: true` on the `ShaderMaterial` constructor options (this injects `#define USE_COLOR` which makes the `color` attribute available)
2. OR explicitly read from the `color` buffer attribute in the shader

The plan doesn't mention this. If the implementer creates a bare `ShaderMaterial` without `vertexColors: true`, the `color` attribute will be undefined in the vertex shader, and all nebula particles will render as black or white.

Additionally, the plan uses `attribute float aSize` but the current geometry uses `THREE.PointsMaterial.size` (a uniform), not a per-vertex size attribute. The current nebula configs define a single `size` per layer (0.022, 0.020, 0.018). This means `aSize` should be a uniform (`uniform float uPointSize`), not an attribute, unless the implementation adds per-vertex size variation.

**Proposed Resolution**: Update the Phase 3 vertex shader to:
- Use `uniform float uPointSize` instead of `attribute float aSize` (or document that a per-vertex size buffer will be created)
- Note that `vertexColors: true` must be set on the ShaderMaterial constructor
- The fragment shader should also account for the existing `transparent: true` and `depthWrite: false` settings by setting those on the ShaderMaterial

---

## M-3: Constitution Check Claims "Zero Additional Draw Calls" But ShaderMaterial Migration May Change Count (MEDIUM)

**Location**: Plan Constitution Check table, row II

The constitution check says: "Zero additional draw calls. Hue overlay adds ~3 ALU."

The current nebula uses 3 `THREE.Points` objects with `THREE.PointsMaterial`. After migration to `THREE.ShaderMaterial`, it will still be 3 `THREE.Points` objects -- so the draw call count is indeed unchanged (3 draw calls for nebula, same as before).

However, Phase 3 step 4 introduces `nebulaGroup = new THREE.Group()` as a parent for all nebula layers. A `THREE.Group` does NOT add a draw call -- it's just a scene graph node. This is fine.

But: the plan Phase 4 also discusses creating a separate `nebulaGroup.rotation.y` update. If the existing nebula layers are currently children of `orbGroup` and the plan moves them to be children of `nebulaGroup` (which is then a child of `orbGroup`?), the scene graph changes. The plan doesn't describe the parenting hierarchy. Currently:

```
scene
  └── orbGroup
        ├── nebulaLayer[0]  (Points)
        ├── nebulaLayer[1]  (Points)
        ├── nebulaLayer[2]  (Points)
        ├── starGroup
        │     └── star[0..6] (Sprite)
        └── dustMotes (Points)
```

After Phase 3:

```
scene
  └── orbGroup
        ├── nebulaGroup          ← NEW
        │     ├── nebulaLayer[0]
        │     ├── nebulaLayer[1]
        │     └── nebulaLayer[2]
        ├── starGroup
        └── dustMotes
```

This is fine for draw calls. But the render loop in `scene.js` (lines 613-618) sets `layer.rotation.y = elapsed * speed` on individual layers. The plan says this continues (child rotation + parent rotation are additive). But `orbGroup.rotation.y` is ALSO being set by the existing scroll timeline proxy (`animations.js` line 537). If the plan replaces the old scroll code, this is fine. If both the old and new code run, `orbGroup` gets two competing rotation writers.

This ties back to M-1 -- the old `initScrollInteractions()` must be fully removed.

**Proposed Resolution**: Add a scene graph diagram to the plan showing the before/after hierarchy. Confirm that `orbGroup.rotation.y` is no longer set by scroll code (it was in the old system), and that scroll rotation only applies to `nebulaGroup.rotation.y`.

---

## L-1: Skip-Scroll Keyboard Shortcut Conflict (LOW)

**Location**: Plan Phase 2, step 5

The plan says: "Keyboard shortcut: `S` key (same as skip-intro, repurposed after reveal)."

The skip-intro button's `S` key handler (`animations.js` lines 476-483) has a guard:

```js
const overlay = document.getElementById('project-overlay');
if (overlay && !overlay.hasAttribute('hidden')) return;
```

After the reveal completes, `removeSkip()` calls `document.removeEventListener('keydown', onKeySkip)` (line 471). So the `S` key handler is cleaned up. Good.

But the plan's skip-scroll `S` key would need its own handler, and it would need the same overlay guard. If the overlay is open, pressing `S` should not skip-scroll. The plan doesn't mention this guard.

Additionally, if a user types `S` in any future text input (none exists currently), the skip-scroll handler would fire. The existing skip-intro code checks `e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'` (line 478). The skip-scroll handler needs the same guard.

**Proposed Resolution**: Note that the skip-scroll `S` key handler must include the same guards as the existing skip-intro handler (overlay check + input element check). Minor, but worth documenting.

---

## L-2: Data Model Validation Rule Gap (LOW)

**Location**: `data-model.md`, Validation Rules

The data model says: "`projectIds` across all zones MUST collectively cover all 7 project IDs (no orphans)"

Current zones: 3 + 2 + 2 = 7 projects. This validates.

But there is no rule that `projectIds` entries must not OVERLAP (a project in two zones). If someone accidentally puts `odd-fintech` in both zone 1 and zone 2, the zone transition would scale the star up for both zones, then scale it down when leaving zone 1 while zone 2 thinks it should still be bright. This would cause a visual flicker.

**Proposed Resolution**: Add validation rule: "`projectIds` entries MUST NOT appear in more than one zone (no duplicates across zones)."

---

## Constitution Compliance Verification

| Principle | Plan Claim | My Verdict |
|---|---|---|
| I. POC Scope | "No new shader effects" | **PASS** -- hue overlay is a uniform on existing geometry, not a new visual feature. Constitution says frozen list is about specific effects (fBm, bloom, etc.), not about adding uniforms to existing materials. |
| II. Performance | "Zero additional draw calls" | **PASS with caveat** -- draw call count unchanged, but M-3 notes the scene graph needs explicit documentation |
| III. Accessibility | "SR-only list independent of scroll" | **PASS** -- plan doesn't touch `.sr-only` elements |
| IV. Text in HTML | "No new text in WebGL" | **PASS** |
| V. Visual Hierarchy | "Zone colors stay inside the orb" | **PASS** -- nebula hue shift only applies to nebula particles |
| VI. Procedural | "No new texture files" | **PASS** |
| VII. Degradation | Scroll features degrade gracefully | **PASS** -- no WebGL = no nebula shift, static list works |
| VIII. Asset Readiness | "No new assets needed" | **PASS** |
| Scroll Pin Constraint | "300px scroll distance enforced" | **PASS** -- `height: innerHeight + 300` matches constitution |

**All constitution checks pass.**

---

## Compressed Zone Ranges Assessment

The plan compresses zones from (0.25-0.50, 0.50-0.75, 0.75-0.90) to (0.0-0.33, 0.33-0.66, 0.66-1.0).

At 300px total scroll:
- Zone 1: 0px to 99px (100px)
- Zone 2: 99px to 198px (99px)
- Zone 3: 198px to 300px (102px)

Each zone gets ~100px. That's roughly 2-3 mouse wheel ticks or one moderate trackpad swipe. With snap transitions (per Research Decision 3), this is sufficient. The elimination of the dead zone at 0-25% is the right call -- previously, the first 75px of scroll did nothing visible, which would feel broken.

**Verdict: Zone ranges are sound.**

---

## Phase Dependency Verification

```
Phase 1 (Logo)      → independent ✓ (only touches initLogoFollow/logoReturnHome)
Phase 2 (Scroll)    → independent ✓ (adds scroll infrastructure)
Phase 3 (Shader)    → depends on Phase 2 ✓ (needs scroll progress to test)
Phase 4 (Zones)     → depends on 2+3 ✓ (needs scroll + shader)
Phase 5 (Labels)    → independent ✓ (DOM + CSS only)
Phase 6 (Y-Axis)    → independent ✓ (only touches onResize)
Phase 7 (Brand)     → independent ✓ (data.js only)
Phase 8 (Auto-Tier) → depends on 4 ✓ (needs scroll to sample)
```

Phases 1, 2, 5, 6, 7 are correctly identified as parallelizable. The sequential chain 2→3→4→8 is correct.

One subtlety: Phase 7 (Brand Language) updates `CONSTELLATION_ZONES` scroll ranges. Phase 2 reads those ranges in `initScrollZones()`. If Phase 7 lands before Phase 2, the ranges are already compressed. If Phase 2 lands first, it reads the old ranges and must be updated. This is a merge-order dependency.

**Proposed Resolution**: Phase 7 should be explicitly ordered before Phase 2 or done as part of Phase 2 step 4 (since the plan already shows the compressed ranges in Phase 7). Alternatively, mark that Phase 7 should land in the same commit as Phase 2. This is low-risk since they're in-place edits to different files, but worth noting.

---

## Risk Register Assessment

| Plan Risk | My Assessment |
|---|---|
| 300px feels too short | **Agree** -- mitigated by compressed ranges + snap transitions. Acceptable. |
| ShaderMaterial migration breaks nebula | **Agree** -- mitigated by exact replication of PointsMaterial behavior. M-2 notes a specific gotcha. |
| Logo fix duplicates 58be354 | **Agree** -- low impact. Plan correctly says "audit first." |
| ScrollTrigger conflicts with reveal | **Agree** -- but H-1 shows the current wiring is wrong (scroll init happens before reveal completes). |
| CSS fixed breaks layout | **Agree** -- low risk since #app-shell already fills viewport. |

**Missing risk**: The plan doesn't mention the existing `handleScrollDuringReveal()` function or how it interacts with the new scroll architecture. If `overflow: hidden` is on body during reveal, wheel events may not fire, making that function dead code. This should be in the risk register.

---

## Summary Table

| # | Concern | Severity | Action Required |
|---|---------|----------|-----------------|
| H-1 | initScrollInteractions called before reveal-complete | HIGH | Fix wiring: gate new initScrollZones behind reveal-complete event, update app.js |
| M-1 | Old initScrollInteractions + brightenZoneStars not explicitly removed | MEDIUM | Add explicit deletion/replacement steps to plan |
| M-2 | ShaderMaterial missing vertexColors + wrong aSize attribute type | MEDIUM | Fix vertex shader, add vertexColors:true note |
| M-3 | Scene graph hierarchy undocumented, orbGroup.rotation.y ownership unclear | MEDIUM | Add scene graph diagram, clarify rotation ownership |
| L-1 | Skip-scroll S key needs overlay + input guards | LOW | Note in plan |
| L-2 | No projectIds overlap validation rule | LOW | Add validation rule to data-model.md |

**Total: 0 CRITICAL, 1 HIGH, 3 MEDIUM, 2 LOW**

The plan is approved for implementation after H-1 is resolved. The MEDIUM items should be addressed in the task breakdown. The LOW items can be handled during implementation.
