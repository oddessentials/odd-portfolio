# Implementation Plan: Beta 0.1.0 — Portfolio Polish & Bug Fixes

**Branch**: `003-beta-portfolio-polish` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-beta-portfolio-polish/spec.md`

## Summary

Transform the Alpha Arcane Console into Beta 0.1.0 by fixing two critical bugs (mouse interaction offset, stars disappearing on resize), replacing fantasy terminology with real project names and brand language, adding hover/touch project descriptions, implementing a terminal scanning loading animation, and replacing the top border rivet strip with a Greek key meander pattern. All changes are DOM/CSS/JS-only — no new Three.js objects, no new libraries, no build system changes.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3, GLSL ES 1.0/3.0
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned)
**Storage**: N/A (no backend, no persistence)
**Testing**: Manual browser testing (Chrome, Firefox, Safari). DevTools Performance profiling. Accessibility audit via screen reader + keyboard.
**Target Platform**: Desktop browsers (primary), tablet/mobile (graceful degradation)
**Project Type**: Static single-page web application (portfolio)
**Performance Goals**: 60fps on integrated GPU (Intel Iris-class), <30 draw calls steady state, <16.67ms frame time
**Constraints**: No build system, no npm, single `index.html` + `/js` modules + `/css` + `/assets`. DPR clamped to 1.5. Max 12 CSS compositing layers. Auto-tier degradation within 20s of page load.
**Scale/Scope**: 7 projects, ~2750 lines JS, ~1325 lines CSS, ~220 lines HTML. 6 files modified, 0 new files created.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. POC Scope Discipline | **AMENDMENT NEEDED** | Constitution says "Minimum viable viewport: 1200px wide" and excludes responsive below 1200px. Beta explicitly fixes responsiveness at all widths. This is an intentional product evolution from POC → Beta. Owner has authorized this change via the Beta spec. The `shortDesc` field addition to the data model also requires owner approval (granted via spec). |
| II. Performance-First WebGL | **AMENDMENT NEEDED** | DPR clamping unchanged. Draw call budget unchanged (<30). All new features are DOM/CSS-only — zero additional draw calls. **Amendment**: Constitution says benchmark starts "5 seconds after the reveal sequence completes." Beta defers benchmark to 5 seconds after BOTH `reveal-complete` AND `terminal-scan-complete`, whichever is later. This preserves the principle's intent ("during idle steady-state, not during the high-load reveal") — the terminal scan IS active animation and benchmarking during it would violate the spirit of Principle II. Fallback timeout increases from 12s → 20s as safety net. |
| III. Accessibility Non-Negotiable | PASS | Beta adds ARIA live regions for terminal scan, improves sidebar accessibility with inline descriptions, and updates all screen-reader content to professional language. All new animations respect `prefers-reduced-motion`. |
| IV. Text in HTML, Never in WebGL | PASS | All new text (project names, descriptions, terminal scan, brand messaging) is HTML. No WebGL text changes. |
| V. Visual Hierarchy — Frame vs Universe | PASS | Greek key stays on the frame (top border). No accent colors leak to frame. No ornamentation enters the starfield. |
| VI. Procedural-First Asset Strategy | PASS | Greek key is pure CSS gradients — no external images. No new asset files. |
| VII. Graceful Degradation | PASS | Responsive star scaling improves degradation on narrow viewports. Terminal animation has reduced-motion fallback. Greek key hidden on mobile. |
| VIII. Asset Readiness Gate | PASS | No new assets required. All media already in `/assets`. |

**Gate Result**: PASS with 2 justified amendments (Principle I — responsive scope expansion; Principle II — benchmark trigger deferred to post-terminal-scan idle state).

## Project Structure

### Documentation (this feature)

```text
specs/003-beta-portfolio-polish/
├── plan.md              # This file
├── spec.md              # Feature specification (49 FRs, 10 SCs)
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model updates
├── quickstart.md        # Phase 1 developer quickstart
├── reviews/             # Specialist review documents
│   ├── webgl-engineer.md
│   ├── technical-artist.md
│   ├── motion-engineer.md
│   ├── frontend-architect.md
│   └── perf-specialist.md
├── checklists/
│   └── requirements.md  # Spec quality validation
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
index.html               # DOM structure changes (sidebar labels, status panel, Greek key class)
css/
└── styles.css           # Greek key pattern, sidebar descriptions, loading bar, responsive fixes
js/
├── app.js               # Init sequence updates (terminal scan trigger)
├── scene.js             # Hitzone fix, star position scaling, raycaster threshold
├── data.js              # Add shortDesc field to each project
├── animations.js        # Terminal scan timeline, discoverability text, brand messaging
├── interactions.js      # Hover/touch descriptions, resize handler, mobile nav cleanup
└── performance.js       # Auto-tier timeout update, shimmer degradation
```

**Structure Decision**: Existing modular structure preserved. No new files. All changes are modifications to the 6 existing JS files, 1 CSS file, and 1 HTML file.

## Implementation Architecture

### Change Map by File

#### `js/scene.js` (Bug Fixes — P0)

**Mouse Offset Fix (FR-001, FR-002, FR-003):**
- Move `#orb-hitzone` to `position: fixed; inset: 0` with `z-index: calc(var(--z-hud) - 1)` so it sits below sidebars but above canvas
- Mouse coordinate math (`e.clientX / window.innerWidth`) is already correct for the full-viewport canvas — no JS changes needed for normalization
- Add `raycaster.params.Sprite = { threshold: 0.15 }` after raycaster creation (line ~10) for better hover UX
- Sidebars remain interactive because they have higher z-index than the hitzone

**Responsive Star Scaling (FR-004, FR-005, FR-006, FR-007):**
- Store original base positions in each sprite's `userData.basePosition` as `[x, y, z]` array during star creation (line ~360-384). Store the original `project.position` array directly — no THREE.Vector3 copy.
- Store module-level `xScale` variable (default 1.0) so the render loop can reference it without recomputing
- In `onResize()` (line ~489), compute `xScale = Math.min(1, currentAspect / designAspect)` where `designAspect = 16/9`
- Apply `sprite.position.x = userData.basePosition[0] * xScale` for all 7 stars
- **Y-axis known limitation**: X-only scaling produces a vertically-oriented star cluster on portrait mobile. FR-005 ("preserved relative spatial arrangement") is partially violated at extreme portrait aspect ratios (< 1:1). This is accepted as a known trade-off — all 7 stars remain visible (SC-002 satisfied) and the spatial layout is still recognizable. A compensating y-axis compression (e.g., `yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3)`) could be added in a future polish pass if user testing reveals issues.
- **Nebula scaling**: Apply `nebulaLayers.forEach(layer => layer.scale.x = xScale)` in `onResize()` to compress the nebula point cloud proportionally. This is a one-line change — no particle regeneration required.
- **Dust mote clamping**: In the render loop (line ~569), replace hard-coded `3.5` x-clamp with `3.5 * xScale` (referencing the module-level `xScale`). Leave nebula static — it is a diffuse background effect.
- **Star label clipping**: Known limitation — `#star-labels` is inside `#main-viewport` (center grid column), so labels for stars positioned behind sidebars clip at the sidebar boundary. This is a pre-existing Alpha issue. Fixing it requires restructuring the label container to a viewport-level overlay, which is out of scope for Beta. Document as P3 follow-up.

#### `css/styles.css` (Visual — P1/P2)

**Hitzone CSS (FR-001):**
- Change `#orb-hitzone` from `position: absolute` to `position: fixed; inset: 0`

**Greek Key Pattern (FR-030–FR-037):**
- Replace `.frame__rune-band` gradient with 6-layer Greek key gradient stack
- **Fallback**: Keep existing rivet-band gradient as the base `background` layer. Greek key gradient layers stack on top. If gradient rendering fails in any browser, the fallback is a simple brass stripe (not invisible).
- Add CSS custom properties: `--gk-line: 3px`, `--gk-cell: 36px`, `--gk-color-face`, `--gk-color-shadow`, `--gk-color-highlight: var(--color-brass-light)`
- **Band height**: `height: 18px` (desktop), `height: 12px` (tablet), `display: none` (mobile <768px). Current 6px is too short for a recognizable meander at 36px tile width.
- Add `::before` pseudo-element with shimmer highlight gradient. **The pseudo-element must be oversized** (`width: 300%; left: -100%`) with `overflow: hidden` on parent, so `translateX()` sweeps the highlight across the full width.
- Shimmer animation: `transform: translateX(-100%)` to `translateX(100%)` on the `::before` pseudo-element (compositor-only, per perf specialist). Add `will-change: transform` on the pseudo-element.
- **Shimmer tier degradation via CSS custom property**: Define `--shimmer-duration: 4s` on `.frame__greek-key`. The `::before` animation references `var(--shimmer-duration)`. In `performance.js`, Tier 2 sets `--shimmer-duration: 8s` via `style.setProperty()`. Tier 3 adds `.shimmer-disabled` class which sets `animation: none` on the pseudo-element.
- Add `contain: layout style paint` to the parent
- Responsive: 24px tile at tablet, hidden at mobile (<768px)
- **Phosphor text glow**: Add `text-shadow: 0 0 4px rgba(122, 255, 178, 0.3)` to `.scan-line` (the new terminal text elements) as a terminal material enhancement (3-line CSS, zero perf cost)

**Sidebar Description Styles (FR-011, FR-012):**
- Add `.project-label`, `.project-name`, `.project-desc` classes
- Description: `font-family: var(--font-body)`, `font-size: var(--text-xs)`, `color: var(--color-text-secondary)`
- Hover expand uses `@media (hover: hover) and (pointer: fine)` for desktop-only
- Mobile: increase button `min-height` to 52px for two-line layout

**Terminal Loading Bar (FR-023, FR-043):**
- Add `.scan-line` (class, not ID — multiple scan line elements), `.loading-bar`, `.loading-bar__fill` styles
- Loading bar fill uses `transform: scaleX()` with `transform-origin: left center` (compositor-only)

**Responsive Fixes (FR-047, FR-048, FR-049):**
- Remove redundant `grid-template-columns: 160px 1fr 160px` from `max-width: 1199px` block
- Add `@media (min-width: 768px)` reset block for `#constellation-nav` (`position: static; transform: none; transition: none`)
- Add `@media (min-width: 768px)` explicit `#status-panel { display: flex }` reset

**Performance Containment (FR-042, FR-045):**
- Add `contain: layout style` to `#command-line`
- Add `contain: layout style` to `#constellation-nav li` (NOT `contain: content` — the `paint` component would clip sidebar description expansion animations)
- Add `contain: layout style paint` to `.frame` (NOT `contain: strict` — the `size` component risks Safari rendering bugs on fixed-position elements with absolutely-positioned children; `.frame` doesn't need size containment since it never participates in intrinsic sizing)

#### `index.html` (Content — P1)

**Left Sidebar (FR-008, FR-009, FR-010, FR-011):**
- Change `<span class="hud-label">CONSTELLATION INDEX</span>` → `ODD PORTFOLIO`
- Change `<nav aria-label="Project constellations">` → `aria-label="Project portfolio navigation"`
- Replace each button's `.constellation-name` with `.project-label` containing `.project-name` + `.project-desc`
- Remove `aria-describedby="project-hint"` from individual buttons (description is now inline)

**Right Sidebar (FR-019, FR-020, FR-028):**
- Change HUD label to `ODD ESSENTIALS`
- Replace static "scanning systems..." with `.scan-output` container holding `.scan-line` elements (class, not ID) + `.loading-bar` with `.loading-bar__fill` child
- Add `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` to `.loading-bar`
- Add `role="status"` to `.scan-output` (implies `aria-live="polite"`). **Remove existing `aria-live="polite"` from `<aside id="status-panel">`** to prevent nested live region double-announcements.
- Keep mana meter unchanged (static) — add `aria-hidden="true"` to suppress "Mana level" screen reader announcement (fantasy terminology per FR-040)

**Greek Key (FR-030):**
- Rename class from `frame__rune-band` to `frame__greek-key` in HTML, CSS, and **both JS querySelector calls** in `js/animations.js` (lines 43 and 533). All 4 references must be updated together.

**Brand Content (FR-040, FR-041):**
- Update `<title>` to "Odd Essentials | Portfolio"
- Update OG meta tags (specify replacement: "Force multipliers for small businesses — 7 open-source projects in an interactive starfield.")
- Update `.sr-only` text to remove constellation/fantasy terminology
- **Update `#orb-hitzone` `aria-label`** (line 149): "Interactive constellation viewer. Use the constellation navigation..." → "Interactive portfolio viewer. Use the project navigation to explore projects."
- **Update `#orb-fallback` `alt` text** (line 151): "OddEssentials project constellation" → "OddEssentials portfolio projects"
- **Known gap**: `CONSTELLATION_ZONES` in `data.js` (lines 141-166) contains fantasy-themed `statusText` values ("scanning arcane tools constellation...", etc.). These are displayed during scroll-triggered zone changes. Documented as P3 follow-up for Beta 0.1.1 — internal zone identifiers retained for backwards compatibility.

#### `js/data.js` (Data — P1)

**Add shortDesc field (FR-011):**
- Add `shortDesc` string to each of the 7 PROJECTS entries:
  - `odd-ai-reviewers`: "AI code review pipeline"
  - `ado-git-repo-insights`: "Azure DevOps PR metrics"
  - `repo-standards`: "Repo quality standards"
  - `odd-self-hosted-ci`: "Self-hosted CI runtime"
  - `odd-map`: "Interactive office locator"
  - `odd-fintech`: "Financial intelligence dashboard"
  - `coney-island`: "Restaurant with AI chat"

#### `js/animations.js` (Motion — P2)

**Discoverability Text (FR-038, FR-039):**
- In `playDiscoverabilityAffordance()`: change text to "Force multipliers for small businesses..."
- Change duration from 1.5s to 2.15s (20 chars/sec)
- Change phase indicator from "SCANNING" → "PORTFOLIO"
- **Remove the second phase indicator flip** (`gsap.to(phaseIndicator, { delay: 3.5 })` → 'READY'). The terminal scan now owns the phase indicator's final state exclusively. The discoverability affordance only sets "PORTFOLIO" at 0.8s; it does NOT set "READY" at 3.5s.

**Terminal Scan Animation (FR-021–FR-029):**
- New function `playTerminalScan()` creating independent GSAP timeline
- Cycles through 7 project IDs: "Scanning {id}..." with TextPlugin at 30 chars/sec
- ASCII progress bar: `[##........] XX%` with hard-coded percentages `[14, 28, 43, 57, 71, 86, 100]` (matching spec exactly — do not compute)
- Each scan phase: ~0.7s apart (total ~6.4s)
- Final state: "7 systems nominal" + "PORTFOLIO READY" with brass glow flash. **Under `prefers-contrast: more`**, suppress brass glow and use plain white flash instead.
- **Spawned at t=2.8** in reveal desktop timeline (t=0.5 on mobile) via `tl.call(playTerminalScan, null, 2.8)`. This ensures all status lines have completed their opacity fade-in (which finishes at t=2.75) before scan text starts typing.
- Independent timeline — not nested in master, non-blocking
- `prefers-reduced-motion`: show final state immediately, return null
- **Combined `prefers-reduced-motion` + `prefers-contrast: more`**: instant final state with high-contrast styling (white-on-black, no brass glow)
- Update `aria-valuenow` on `.loading-bar` element for accessibility
- **Phase indicator ownership**: Terminal scan owns `.phase-indicator` exclusively after t=2.8. Discoverability affordance sets "PORTFOLIO" at its t+0.8s but does NOT set any later value. Terminal scan sets "PORTFOLIO READY" on completion. This prevents the phase flicker race condition.
- `playTerminalScan()` returns the GSAP timeline reference. On completion, dispatch a `terminal-scan-complete` custom event.
- **Reveal animation selector update**: The existing reveal desktop timeline fades in `.status-line` elements (animations.js:44, 534). After HTML restructure replaces status lines with `.scan-line` + `.loading-bar`, update these selectors to target the new DOM structure. Both `querySelectorAll('.status-line')` calls must be updated to match the restructured status panel.

**Brand Messaging Updates:**
- Update reveal sequence CLI messages to non-fantasy language
- Update scroll zone status text (replacement strings to be specified during implementation — content decision, not architecture)

**Benchmark Timing (FR-044):**
- The benchmark (`runBenchmark()`) should fire 5 seconds after BOTH `reveal-complete` AND `terminal-scan-complete`, whichever is later. Add listener for `terminal-scan-complete` event in the benchmark setup. The 20s fallback timeout remains as a safety net.

#### `js/interactions.js` (Interaction — P1)

**Hover Descriptions (FR-012–FR-018):**
- `initNavHoverEffects()`: GSAP tweens for tagline maxHeight/opacity on mouseenter/mouseleave. Use `gsap.killTweensOf(tagline)` before starting new tween to prevent accumulation.
- Glyph scale to 1.2x with `back.out(2)` easing on enter
- `@media (hover: hover)` check via `matchMedia` before attaching
- **Touch handler strategy (option A — guard approach)**: Modify the existing click handler in `initInteractions()` (interactions.js:349-358) to check a guard: `if (isTouchDevice && !btn.classList.contains('tagline-expanded')) { expandTagline(btn); return; }`. This avoids `stopImmediatePropagation` and listener-ordering fragility. `initNavTouchEffects()` sets up the `isTouchDevice` flag and the `expandTagline`/`collapseTagline` functions.
- Track `expandedBtn` state, collapse previous on new tap
- **Tap outside collapses taglines**: Piggyback on the existing backdrop click listener (interactions.js:395-399) — when backdrop click fires, also reset `expandedBtn` state and collapse any expanded tagline.

**Resize Handler (FR-047, FR-049):**
- Debounced (100ms) `resize` listener that calls `closeHamburgerNav()` when `innerWidth >= 768` and nav is open

#### `js/app.js` (Init — P1)

**Init sequence**: No changes needed for terminal scan (it spawns via `tl.call()` callback within the reveal timeline in `animations.js`, not from `app.js`). The `initNavTouchEffects()` function is called from within the existing `initInteractions()` flow — no separate init call needed since the guard approach modifies the existing handler.

#### `js/performance.js` (Performance — P1)

**Auto-Tier Timeout (FR-044):**
- Change fallback timeout from 12000 to 20000ms
- Add `terminal-scan-complete` event listener alongside existing `reveal-complete` listener. Benchmark fires 5s after both events have fired, or on 20s fallback.

**Shimmer Tier Degradation (FR-035, FR-037):**
- Tier 2: `document.querySelector('.frame__greek-key')?.style.setProperty('--shimmer-duration', '8s')`
- Tier 3: `document.querySelector('.frame__greek-key')?.classList.add('shimmer-disabled')` — CSS rule `.frame__greek-key.shimmer-disabled::before { animation: none; }`

### Dependency Graph

```
[Phase 1: P0 Bug Fixes]
  ├── Hitzone CSS fix (styles.css) ──── no deps
  ├── Raycaster threshold (scene.js) ── no deps
  └── Star position scaling (scene.js) ── no deps

[Phase 2: P1 Content & Structure]
  ├── data.js shortDesc field ──── no deps
  ├── HTML sidebar restructure ──── depends on data.js shortDesc
  ├── CSS sidebar styles ──── depends on HTML structure
  ├── Responsive CSS fixes ──── no deps (independent of sidebar)
  └── CSS containment ──── no deps

[Phase 3: P1 Interactions]
  ├── Hover descriptions (interactions.js) ──── depends on HTML + CSS sidebar
  ├── Touch descriptions (interactions.js) ──── depends on hover descriptions
  └── Resize handler (interactions.js) ──── depends on responsive CSS fixes

[Phase 4: P2 Animations & Visual]
  ├── Terminal scan (animations.js) ──── depends on HTML status panel
  ├── Greek key CSS ──── no deps (independent)
  ├── Greek key shimmer ──── depends on Greek key CSS
  ├── Discoverability text ──── no deps
  └── Brand messaging ──── no deps

[Phase 5: P1 Performance]
  ├── Auto-tier timeout (performance.js) ──── depends on terminal scan
  └── Shimmer degradation (performance.js) ──── depends on Greek key shimmer

[Phase 6: Polish & Validation]
  ├── Screen reader content updates ──── depends on all HTML changes
  ├── Cross-browser testing ──── depends on all changes
  └── Performance profiling ──── depends on all changes
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Responsive below 1200px (Principle I) | Beta product evolution requires mobile visibility of all 7 stars | "Best viewed on wider screen" message fails users who receive shared portfolio links on mobile — content must be reachable |
| shortDesc data field (Principle I) | Sidebar descriptions require a short form of the tagline that fits the narrow sidebar width | Using the full `tagline` field would overflow the sidebar and require CSS truncation guesswork; a dedicated short description gives editorial control |

## Known Limitations (Accepted)

| Limitation | Severity | Rationale |
|---|---|---|
| Y-axis star positions not scaled on portrait mobile | Low | X-only scaling produces a vertical cluster, but all 7 stars remain visible. Y-compensation can be added in a future pass if user testing reveals issues. |
| Star label clipping behind sidebars | Low (pre-existing) | Labels for edge stars clip at `#main-viewport` bounds. Fix requires container restructuring — out of scope for Beta. |
| `CONSTELLATION_ZONES` retains fantasy `statusText` | Low | Scroll zone messages ("scanning arcane tools constellation...") are secondary UI text. Documented for Beta 0.1.1. |
| Greek key hidden under `prefers-contrast: more` | Info | Existing `.frame { display: none }` under high contrast auto-hides the Greek key. This is correct behavior — not a bug. |
| Resize jitter on star hover labels | Info | During rapid resize (e.g., DevTools drag), star positions and camera update simultaneously, causing brief label jitter. Not a crash — cosmetic only. |

## Plan Review Amendments

*Applied 2026-03-04 based on consolidated review by 5 specialists + Devil's Advocate. All 6 reviewers approved with concerns; all concerns addressed below.*

### Critical Fixes Applied

| ID | Source | Issue | Resolution |
|---|---|---|---|
| C-1 | Devil's Advocate | Star x-only scaling violates FR-005 on portrait mobile | Acknowledged as known limitation with documented y-compensation formula for future use. SC-002 (visibility) is still satisfied. |
| C-2 | Devil's Advocate + Motion Engineer | Phase indicator ownership race between terminal scan and discoverability affordance | Terminal scan owns `.phase-indicator` exclusively after t=2.8. Discoverability affordance sets "PORTFOLIO" at t+0.8s only — removed the stale "READY" flip at t+3.5s. |

### Medium Fixes Applied

| ID | Source | Issue | Resolution |
|---|---|---|---|
| M-1 | Performance Specialist | `contain: strict` on `.frame` risks Safari rendering | Downgraded to `contain: layout style paint` (drops `size`) |
| M-2 | Performance Specialist | `contain: content` on nav `li` clips expansion animations | Downgraded to `contain: layout style` (drops `paint`) |
| M-3 | Performance Specialist | Shimmer degradation has no JS-to-pseudo-element path | Specified CSS custom property `--shimmer-duration` + `.shimmer-disabled` class approach |
| M-4 | Technical Artist | Shimmer `translateX` needs oversized pseudo-element | Added `width: 300%; left: -100%` + `overflow: hidden` on parent to plan |
| M-5 | Technical Artist | Greek key band height not specified | Added explicit heights: 18px desktop, 12px tablet, hidden mobile |
| M-6 | Motion Engineer | Terminal scan spawn at t=2.3 before status lines visible | Changed to t=2.8 (status lines finish fade at t=2.75) |
| M-7 | Motion Engineer | Touch handler registration order fragile | Switched from `stopImmediatePropagation` to guard-based approach (option A) |
| M-8 | Frontend Architect | DOM naming inconsistency (scan-line/progress-track) | Reconciled to `.scan-line` (class), `.loading-bar`, `.loading-bar__fill` per review |
| M-9 | Frontend Architect | animations.js querySelector refs not in change map | Added explicit note: rename `.frame__rune-band` in both querySelector calls (lines 43, 533) |
| M-10 | Frontend Architect | Missed aria-label updates for #orb-hitzone and #orb-fallback | Added both to Brand Content section |
| M-11 | Frontend Architect | Nested aria-live double-announcements | Remove `aria-live` from `<aside>`, use `role="status"` on `.scan-output` only |

### Low Fixes Applied

| ID | Source | Issue | Resolution |
|---|---|---|---|
| L-1 | Devil's Advocate | Progress percentages inconsistent | Hard-coded `[14, 28, 43, 57, 71, 86, 100]` per spec |
| L-2 | Devil's Advocate | Benchmark fires before terminal scan completes | Added `terminal-scan-complete` event; benchmark defers until both events fire |
| L-3 | Devil's Advocate | Mana meter "Mana level" aria-label is fantasy text | Added `aria-hidden="true"` to mana meter |
| L-4 | Devil's Advocate | Nebula scaling not specified | Specified `nebulaLayers.forEach(l => l.scale.x = xScale)` — one-line change |
| L-5 | Devil's Advocate | `prefers-contrast: more` interaction undocumented | Added notes for Greek key (auto-hidden), terminal brass glow (suppress under high contrast), dual-preference case |
| L-6 | Technical Artist | Missing `--gk-color-highlight` custom property | Added to Greek key custom property list |
| L-7 | Technical Artist | Phosphor text glow enhances terminal material | Added `text-shadow` on `.scan-line` to Greek key section |
| L-8 | Devil's Advocate | Greek key has no fallback if gradients fail | Added existing rivet-band gradient as base layer fallback |
| L-9 | WebGL Engineer | Dust mote clamping not scaled | Specified `3.5 * xScale` in render loop |
| L-10 | Devil's Advocate | app.js changes unclear | Clarified: no app.js changes needed for terminal scan or touch handler |
