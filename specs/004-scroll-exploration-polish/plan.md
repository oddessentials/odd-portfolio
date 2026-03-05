# Implementation Plan: Scroll-Driven Exploration & Remaining Polish

**Branch**: `004-scroll-exploration-polish` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-scroll-exploration-polish/spec.md`

## Summary

Complete all outstanding REVIEW.md items: implement scroll-driven exploration with zone-based nebula hue shifting and star highlighting, fix logo-cursor desync on viewport exit and resize, fix star label clipping behind sidebars, add Y-axis star scaling for portrait devices, and replace fantasy-themed constellation zone text with professional brand language. Uses a pinless scroll architecture (`#app-shell` fixed + `#scroll-driver` spacer) with custom ShaderMaterial for GPU-side nebula hue overlay. All changes are in-place modifications to existing files — no new files created, no new dependencies.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3, GLSL ES 1.0/3.0
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned)
**Storage**: N/A (no backend, no persistence)
**Testing**: Manual browser testing (Chrome, Firefox, Safari). DevTools Performance panel for frame rate validation.
**Target Platform**: Desktop browsers (Chrome/Firefox/Safari latest), mobile Safari/Chrome (degraded experience)
**Project Type**: Single-page HTML + WebGL portfolio
**Performance Goals**: 60fps on integrated GPU (Intel Iris-class), <30 draw calls steady state, <1MB texture memory, DPR clamped to 1.5
**Constraints**: No build system, no npm, no additional CDN dependencies. Frozen shader feature list per constitution. Max 300px scroll distance for pinned section. Max 120 ALU/fragment in shaders.
**Scale/Scope**: 7 projects, 3 constellation zones, 6 JS files + 1 CSS file + 1 HTML file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. POC Scope Discipline | PASS | No new shader effects (hue overlay is a uniform, not a new visual feature). No new data fields beyond `nebulaHueRgb` added to existing CONSTELLATION_ZONES. No new libraries. |
| II. Performance-First WebGL | PASS | Zero additional draw calls. Hue overlay adds ~3 ALU (~11 total, well within 120 budget). DPR unchanged. GSAP ticker integration maintained. |
| III. Accessibility Non-Negotiable | PASS | Scroll-spacer has aria-hidden. SR-only list independent of scroll. Reduced motion suppresses all scroll animations. Skip-scroll affordance provided. |
| IV. Text in HTML | PASS | No new text rendered in WebGL. Zone status text is HTML DOM updates. |
| V. Visual Hierarchy | PASS | Zone colors stay inside the orb (nebula hue shift). No accent colors leak to frame. |
| VI. Procedural-First | PASS | Hue overlay is procedural (shader uniform). No new texture files. |
| VII. Graceful Degradation | PASS | Scroll-driven features degrade: no WebGL = no nebula color shift, static project list still works. Mobile = instant transitions. |
| VIII. Asset Readiness | PASS | No new assets needed. All existing assets already in place. |
| Scroll Pin Constraint | PASS | 300px scroll distance enforced. Skip-scroll affordance fades after 3s. |

**Gate Result: ALL PASS — no violations.**

## Project Structure

### Documentation (this feature)

```text
specs/004-scroll-exploration-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output — all decisions resolved
├── data-model.md        # Phase 1 output — CONSTELLATION_ZONES schema update
├── quickstart.md        # Phase 1 output — implementation quick-start guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── reviews/             # 6-specialist review files
    ├── webgl-engineer.md
    ├── technical-artist.md
    ├── motion-engineer.md
    ├── frontend-architect.md
    ├── perf-specialist.md
    └── devils-advocate.md
```

### Source Code (repository root)

```text
index.html              # DOM: add #scroll-driver, move #star-labels to body level
css/styles.css          # Styles: #scroll-driver, star-labels fixed positioning, overflow changes
js/scene.js             # Logo fix, star labels relocation, Y-axis scaling, nebula ShaderMaterial, nebula group rotation
js/data.js              # CONSTELLATION_ZONES: professional names, statusText, nebulaHueRgb field
js/animations.js        # ScrollTrigger.create() wiring, zone transition callbacks, skip-scroll affordance
js/interactions.js      # Static label anchor overrides for edge stars
js/performance.js       # Auto-tier scroll-time sample (optional safety net)
```

**Structure Decision**: No new files. All changes are in-place modifications to existing files. This is a single-page application with 6 JS modules, 1 CSS file, and 1 HTML file.

## Implementation Phases

### Phase 1: Logo-Cursor Desync Fix (US1 — P1)

**Files**: `js/scene.js`
**FRs**: FR-001 through FR-008

Changes to `initLogoFollow()` and `logoReturnHome()` in `js/scene.js`:

1. **Resize handler addition** (FR-003, FR-004): In the existing `onResize()` function, add logic to:
   - If `logoFollowing` is true: call `logoReturnHome()` immediately (forces return to freshly-calculated home position)
   - If `logoFollowing` is false: clear any stale inline `left`/`top`/`transform` styles from the logo element
   - No need to recreate `quickTo` instances — they accept absolute pixel values

2. **Document-level viewport exit** (FR-005): Add `document.addEventListener('mouseleave', ...)` that calls `logoReturnHome()` when the cursor exits the browser window entirely. This is independent of the hitzone's own `mouseleave` and catches cases where the cursor leaves the viewport without crossing the hitzone boundary.

3. **Re-engagement hardening** (FR-006, FR-007): The existing `mousemove` fallback re-engagement (`if (!logoFollowing) engageLogo(...)`) already handles most re-entry cases. Verify `engageLogo()` calls `gsap.killTweensOf(logoEl)` first (it does — line 211).

4. **Touch rotation after device rotation** (FR-008): In `onResize()`, if the device is touch-capable, recalibrate the home position rect used by `logoReturnHome()`. Since `logoReturnHome()` already calls `getBoundingClientRect()` at invocation time, this is inherently handled — just ensure the resize handler triggers return-home on touch devices too.

**Verification**: Commit `58be354` already addressed some logo issues. Audit the current code against FR-001–FR-008 before implementing to avoid duplicate work.

### Phase 2: Scroll Architecture (US2 — P1, partial)

**Files**: `index.html`, `css/styles.css`, `js/animations.js`, `js/app.js`
**FRs**: FR-009 through FR-013

**Critical prerequisite (DA-H1)**: The existing `initScrollInteractions()` call in `js/app.js` (line 41) must be removed. It fires unconditionally before the reveal completes. The new `initScrollZones()` must be wired to the `reveal-complete` event instead. The existing `initScrollInteractions()` function (~70 lines) and `brightenZoneStars()` (~28 lines) in `js/animations.js` must be deleted — they use the old `pin: '#app-shell'` approach and opacity-based star dimming, both of which are replaced by this plan.

The existing `handleScrollDuringReveal()` function becomes dead code once `overflow: hidden` is on body during reveal — it should be removed.

1. **HTML: Add `#scroll-driver`** (FR-009, FR-035):
   - Add a `<div id="scroll-driver" aria-hidden="true" role="presentation" tabindex="-1"></div>` as a sibling AFTER `#app-shell` in `<body>`.
   - Height set dynamically via JS: `scrollDriver.style.height = (window.innerHeight + 300) + 'px'`

2. **CSS: `#app-shell` to fixed + overflow changes** (FR-010, FR-011):
   - `#app-shell` gets `position: fixed; inset: 0; z-index: 1;` (it already fills the viewport; `position: fixed` ensures it stays pinned during scroll)
   - `html, body` overflow: conditionally switch from `overflow: hidden` to `overflow-y: auto` after reveal. Implemented via a CSS class: `body.scroll-enabled { overflow-y: auto; }` added by JS after reveal completes.
   - `#app-shell` and `#main-viewport` keep `overflow: hidden` — no change.

3. **CSS: `#scroll-driver` styles**:
   ```css
   #scroll-driver {
     position: relative;
     z-index: 0; /* behind #app-shell */
     pointer-events: none;
   }
   ```

4. **JS: ScrollTrigger wiring** (FR-009, FR-012):
   - In `js/animations.js`, after `reveal-complete` event, call `initScrollZones()`:
   - `ScrollTrigger.create({ trigger: '#scroll-driver', start: 'top top', end: 'bottom bottom', onUpdate: self => handleScrollProgress(self.progress) })`
   - No `pin` property. No `scrub`. Pure progress-reading via `onUpdate`.
   - `handleScrollProgress(progress)` dispatches zone changes based on `CONSTELLATION_ZONES[i].scrollStart/scrollEnd` ranges.
   - Add `body.classList.add('scroll-enabled')` after reveal completes.

5. **Skip-scroll affordance** (FR-013):
   - Reuse the existing skip-intro button pattern. After reveal completes, show a small "↓ Scroll to explore" button that fades after 3 seconds.
   - Clicking it scrolls to the bottom of `#scroll-driver` via `gsap.to(window, { scrollTo: { y: 'max' }, duration: 1 })`.
   - Keyboard shortcut: `S` key (same as skip-intro, repurposed after reveal).

### Phase 3: Nebula ShaderMaterial Migration (US2 — P1, partial)

**Files**: `js/scene.js`
**FRs**: FR-014, FR-019

**DA-M2 note**: The current nebula uses a uniform `size` per layer (not per-vertex attribute). The vertex shader must use the built-in `uniform float size` from Three.js rather than a custom `attribute float aSize`. The `ShaderMaterial` constructor must include `vertexColors: true` for the `color` attribute to be available. If layers use different point sizes, pass `size` as a uniform (already the Three.js default for points).

**DA-M3 note**: Scene graph reparenting — create `nebulaGroup` and reparent existing nebula layers into it. The old `orbGroup.rotation.y` (owned by the previous scroll code in `initScrollInteractions()`) is now replaced by `nebulaGroup.rotation.y` (owned by `handleScrollProgress()`). Stars remain children of the scene root, not `nebulaGroup`.

1. **Custom vertex shader**: Replicate `PointsMaterial` behavior:
   ```glsl
   uniform float size;
   varying vec3 vColor;
   void main() {
     vColor = color;
     vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
     gl_PointSize = size * (300.0 / -mvPosition.z);
     gl_Position = projectionMatrix * mvPosition;
   }
   ```

2. **Custom fragment shader**: Add zone color overlay:
   ```glsl
   uniform vec3 uZoneColor;
   uniform float uZoneInfluence;
   varying vec3 vColor;
   void main() {
     float dist = length(gl_PointCoord - vec2(0.5));
     if (dist > 0.5) discard;
     float alpha = smoothstep(0.5, 0.1, dist);
     vec3 finalColor = mix(vColor, vColor + uZoneColor * 0.3, uZoneInfluence);
     gl_FragColor = vec4(finalColor, alpha);
   }
   ```
   ALU cost: ~11 instructions total (~3 for zone overlay). Well within 120 budget.

3. **Material creation**: Replace `new THREE.PointsMaterial(...)` with `new THREE.ShaderMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { size: { value: layerSize }, uZoneColor: { value: new THREE.Color(0,0,0) }, uZoneInfluence: { value: 0.0 } }, vertexShader, fragmentShader })` for each nebula layer.

4. **Nebula group rotation** (FR-019): Create a `nebulaGroup = new THREE.Group()` that parents all nebula layers. In `handleScrollProgress()`, set `nebulaGroup.rotation.y = progress * Math.PI * 0.5` (90° total rotation across full scroll). Individual layer idle drift continues independently (child rotation compounds with parent).

### Phase 4: Zone Transition Logic (US2 — P1, complete)

**Files**: `js/animations.js`, `js/scene.js`
**FRs**: FR-014 through FR-019, FR-032, FR-033, FR-039

1. **`handleScrollProgress(progress)` function** in `js/animations.js`:
   - Determine active zone from `CONSTELLATION_ZONES` by comparing `progress` to `scrollStart/scrollEnd`.
   - If zone changed since last call:
     - Update nebula uniforms: `material.uniforms.uZoneColor.value.set(r, g, b)` and tween `uZoneInfluence` from 0→1 (desktop) or snap via `gsap.set()` (mobile/reduced-motion/tier-3).
     - Scale active zone stars to 1.3x base size: `gsap.to(sprite.scale, { x: 1.3 * baseScale, y: 1.3 * baseScale, duration: 0.3 })` (desktop) or `gsap.set()` (mobile/reduced-motion).
     - Reset non-active stars to 1.0x base scale.
     - Update status panel text: `document.querySelector('.scan-line').textContent = zone.statusText`.
   - Update nebula group rotation: `nebulaGroup.rotation.y = progress * Math.PI * 0.5`.

2. **Reduced motion handling** (FR-032, FR-033):
   - Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
   - If true: all zone transitions use `gsap.set()` (zero duration). Star scaling suppressed. Nebula rotation suppressed (`nebulaGroup.rotation.y` stays at 0).

3. **Mobile handling** (FR-039):
   - If `isMobile`: all zone transitions use `gsap.set()` (instant snap, no lerp). No bloom to soften.

4. **Tier-3 degradation** (FR-038):
   - If tier === 3: zone transitions use `gsap.set()` (same code path as reduced-motion).

### Phase 5: Star Label Clipping Fix (US3 — P2)

**Files**: `index.html`, `css/styles.css`, `js/scene.js`, `js/interactions.js`
**FRs**: FR-020 through FR-023

1. **HTML**: Move `<div id="star-labels"></div>` from inside `#main-viewport` to directly inside `<body>`, after `#app-shell` and before `#scroll-driver`.

2. **CSS**: Add styles for the relocated container:
   ```css
   #star-labels {
     position: fixed;
     inset: 0;
     z-index: 25; /* above frame (10), HUD panels (22), below logo-follow (30) */
     pointer-events: none;
     overflow: visible;
   }
   #star-labels .star-label {
     pointer-events: auto;
   }
   ```

3. **JS label positioning** (FR-023): In `js/scene.js` or `js/interactions.js`, when creating/positioning star labels, apply static anchor overrides for edge stars:
   - `odd-fintech` (x=-2.2): left-anchored label (label appears to the right of the star)
   - `ado-git-repo-insights` (x=-2.0): left-anchored label
   - `repo-standards` (x=2.2): right-anchored (default, but verify it doesn't clip right edge)
   - All others: default anchor (right-anchored, label appears to the left of the star)

4. **Coordinate projection**: The existing `project3DtoScreen()` function outputs viewport coordinates — no changes needed since `#star-labels` is now viewport-level.

### Phase 6: Y-Axis Star Scaling (US4 — P2)

**Files**: `js/scene.js`
**FRs**: FR-024 through FR-027

1. **In `onResize()` function** (currently at line 559):
   - After computing `xScale = Math.min(1, currentAspect / designAspect)`:
   - Add: `yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3)`
   - Update star loop:
     ```js
     starNodes.forEach(sprite => {
       sprite.position.x = sprite.userData.basePosition[0] * xScale;
       sprite.position.y = sprite.userData.basePosition[1] * yScale;
     });
     ```
   - Nebula layers: keep X-only scaling (`layer.scale.x = xScale`). Do NOT add Y-scaling to nebula — intentional asymmetry.

2. **Module-level variable**: Add `let yScale = 1;` alongside existing `let xScale = 1;`.

### Phase 7: Professional Brand Language (US5 — P3)

**Files**: `js/data.js`
**FRs**: FR-028 through FR-031

1. **Update `CONSTELLATION_ZONES` array**:
   ```js
   export const CONSTELLATION_ZONES = [
     {
       name: 'Developer Tools',
       scrollStart: 0.0,   // compressed: start immediately
       scrollEnd: 0.33,
       projectIds: ['odd-ai-reviewers', 'repo-standards', 'odd-self-hosted-ci'],
       nebulaHue: 'blue-violet',
       nebulaHueRgb: [0.42, 0.25, 0.63],  // #6B3FA0
       statusText: 'Browsing developer tools...'
     },
     {
       name: 'Data & Analytics',
       scrollStart: 0.33,
       scrollEnd: 0.66,
       projectIds: ['ado-git-repo-insights', 'odd-fintech'],
       nebulaHue: 'warm-gold',
       nebulaHueRgb: [0.72, 0.53, 0.04],  // #B8860B
       statusText: 'Viewing data & analytics...'
     },
     {
       name: 'Web & Client',
       scrollStart: 0.66,
       scrollEnd: 1.0,
       projectIds: ['odd-map', 'coney-island'],
       nebulaHue: 'green-teal',
       nebulaHueRgb: [0.10, 0.62, 0.56],  // #1A9E8F
       statusText: 'Exploring web & client projects...'
     }
   ];
   ```

2. **Zone range compression**: The original ranges (0.25–0.50, 0.50–0.75, 0.75–0.90) had a dead zone at 0–25% and unused 90–100%. Compress to 0.0–0.33, 0.33–0.66, 0.66–1.0 so all 300px of scroll distance is zone-active. This maximizes the usable scroll range.

### Phase 8: Auto-Tier Scroll Safety Net (optional)

**Files**: `js/performance.js`
**FRs**: FR-038

1. **Optional**: After the existing idle benchmark completes, add a lightweight 10-frame scroll-time sample. If the user scrolls within the first 15 seconds after benchmark, measure 10 consecutive frame times. If average exceeds 20ms, downgrade to tier 3 (same as existing degradation path).

2. This is a safety net for borderline systems that pass the idle benchmark but struggle during scroll compositing. Low implementation risk — uses existing tier infrastructure.

## File Change Summary

| File | Changes | Lines (est.) |
|---|---|---|
| `index.html` | Move `#star-labels` to body level, add `#scroll-driver` | ~10 |
| `css/styles.css` | `#scroll-driver` styles, `#star-labels` fixed positioning, `body.scroll-enabled` | ~20 |
| `js/app.js` | Remove `initScrollInteractions()` call, wire `initScrollZones()` to `reveal-complete` event | ~5 |
| `js/scene.js` | Logo resize handler, document mouseleave, nebula ShaderMaterial, nebulaGroup, Y-axis scaling, label anchor overrides | ~80 |
| `js/data.js` | CONSTELLATION_ZONES professional text, nebulaHueRgb field, compressed ranges | ~15 |
| `js/animations.js` | Delete old scroll code (~100 lines), add `initScrollZones()`, `handleScrollProgress()`, skip-scroll affordance, reduced-motion/mobile/tier handling | ~60 net (+60 new, -100 old) |
| `js/interactions.js` | Static label anchor map for edge stars | ~10 |
| `js/performance.js` | Optional scroll-time safety net | ~15 |
| **Total** | | **~210 lines changed** |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 300px scroll distance feels too short for 3 zones | Medium | Medium | Compress zone ranges to 0–1 (no dead zones), use instant transitions. Test with trackpad and mouse wheel. |
| ShaderMaterial migration breaks existing nebula visual | Low | High | Fragment shader must exactly replicate PointsMaterial's point rendering (gl_PointCoord distance check, alpha smoothstep). Test on Chrome, Firefox, Safari. |
| Logo fix duplicates work from commit 58be354 | Medium | Low | Audit current code against FR-001–FR-008 first. Only implement missing pieces. |
| ScrollTrigger conflicts with existing reveal timeline | Low | Medium | ScrollTrigger.create() called AFTER reveal-complete event. ScrollTrigger disabled during reveal via `enabled: false`. |
| CSS `position: fixed` on `#app-shell` breaks existing layout | Low | High | `#app-shell` already fills viewport with `overflow: hidden`. Fixed positioning is a minimal change. Test all grid children maintain correct positions. |
| Dead code from old scroll system (`initScrollInteractions`, `brightenZoneStars`, `handleScrollDuringReveal`) left in codebase | Medium | Low | Explicitly delete all old scroll code in Phase 2. Task checklist includes removal verification. |

## Dependencies Between Phases

```
Phase 1 (Logo Fix)          → independent, can start immediately
Phase 2 (Scroll Architecture) → independent, can start immediately
Phase 3 (Nebula ShaderMaterial) → depends on Phase 2 (needs scroll progress to test hue shifts)
Phase 4 (Zone Transitions)  → depends on Phase 2 + Phase 3 (needs scroll + shader)
Phase 5 (Label Clipping)    → independent, can start immediately
Phase 6 (Y-Axis Scaling)    → independent, can start immediately
Phase 7 (Brand Language)    → independent, can start immediately (data-only)
Phase 8 (Auto-Tier)         → depends on Phase 4 (needs scroll transitions to sample)
```

**Parallelizable**: Phases 1, 2, 5, 6, 7 can all proceed simultaneously.
**Sequential**: Phase 3 → Phase 4 → Phase 8 (the scroll+shader pipeline).
