# Tasks: Arcane Console POC

**Input**: Design documents from `/specs/001-arcane-console-poc/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested. Manual browser verification per quickstart.md checklist.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/sections, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Single file**: `index.html` at repository root
- **Assets**: `assets/` at repository root (media files)
- **Sections within index.html** are referenced by HTML comment markers (e.g., `<!-- === CSS: CUSTOM PROPERTIES === -->`)

---

## Phase 1: Setup

**Purpose**: Project initialization, asset migration, and base file structure

- [ ] T001 Copy required design assets from `design-assets/` to `assets/`: logo.svg, odd-ai-reviewers-banner.png, ado-git-repo-insights-logo.png, ado-git-repo-insights-screenshot-01.png, ado-git-repo-insights-screenshot-02.png, ado-git-repo-insights-screenshot-03.png, odd-fintech-logo.png, coney-island-logo-1024x690.svg, coney-island-restaurant-and-tavern.jpg, ollama-review-team-member.png, opencode-review-team-member.png, pragent-review-team-member.png, reviewdog-review-team-member.png, semgrep-review-team-member.png, oddessentials-review-team-leader.png (verify all 3 converted video/webm files already in assets/)
- [ ] T002 Create `index.html` with HTML5 doctype, `<head>` section (meta charset, viewport, title, OG meta tags, favicon, Google Fonts preconnect + link for Cinzel/JetBrains Mono/IM Fell English, GSAP CDN scripts, Three.js importmap), and empty `<body>` with `<div id="app-shell">` wrapper
- [ ] T003 [P] Add CSS custom properties block in `<style>` within `index.html`: all color tokens (brass, iron, walnut, leather, parchment, nebula, rim glow, rune glow, focus ring), spacing scale, frame geometry, animation durations, easing curves, z-index stack, typography font families and size scale per constitution and INIT.md §1.2/§4.2
- [ ] T004 [P] Add hard-coded project data as a JavaScript `const PROJECTS = [...]` array in `<script type="module">` within `index.html`, containing all 7 projects per data-model.md schema (id, name, tagline, category, constellation, accentColor, starSize, position, logoUrl, mediaType, mediaUrl, screenshots, links with primary flags) and `const CONSTELLATION_ZONES = [...]` per data-model.md

**Checkpoint**: index.html exists with head, CSS tokens, project data, and all assets in /assets. Opening the file in a browser shows a blank dark page.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: HTML shell, CSS frame, and accessibility foundation — MUST complete before any user story

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Build the semantic HTML shell inside `#app-shell` in `index.html`: skip link (`<a href="#main-viewport" class="skip-link">`), `<canvas id="orb-canvas" aria-hidden="true">`, `.frame` div (aria-hidden, pointer-events:none) with 4 corner divs + 4 edge divs + gauge placeholders + rune-band, `#constellation-nav` (`<nav>` with `<ul>` of 7 `<button>` elements with data-project-id, aria-pressed, constellation glyphs and names), `#status-panel` (`<aside>` with aria-live="polite", status readout lines), `#main-viewport` (`<main>` with `#star-labels` div and `#orb-hitzone` with role="application" and aria-label), `#command-line` (`<footer>` with role="log" aria-live="polite", prompt + cmd-text + cursor spans), `#project-overlay` (hidden dialog with aria-modal, close button, content zones for logo, title, tagline, media, description, links), `.sr-only` project list with all 7 projects (name, tagline, primary link per FR-016), `#project-hint` sr-only text
- [ ] T006 [P] Add CSS grid layout for `#app-shell` in `index.html`: `grid-template-columns: 220px 1fr 220px; grid-template-rows: 1fr 48px`, position canvas fixed inset:0 z:0, frame fixed inset:0 z:10 pointer-events:none, HUD panels z:20, star-labels z:25, overlay backdrop z:90, overlay z:100, skip-link z:9999
- [ ] T007 [P] Add CSS for steampunk frame decorations in `index.html`: brass corner ornaments (inline SVG background-image with brass gradients + rivet pseudo-elements), frame edges (linear-gradient brass with inset box-shadow engraving), CSS-only gauge circles (conic-gradient + radial-gradient + needle pseudo-element), rune-band (repeating-linear-gradient), Odd Essentials logo in header band (img with CSS filter for brass/parchment tinting, max-height ~40px)
- [ ] T008 [P] Add CSS for HUD panels in `index.html`: constellation nav panel (dark translucent bg, backdrop-filter blur, brass top-bar accent, constellation button styles with glyph + name), status panel (monospace readout lines, meter element), command line (terminal green text, blinking cursor animation), panel header label styles (small caps, parchment color)
- [ ] T009 [P] Add CSS for project overlay in `index.html`: centered modal (max-width 720px, max-height 85vh), brass border + corner ornaments (smaller frame), dark backdrop with blur, close button (brass gear/X, 44×44px min touch target), content zones (logo-zone, media-zone with scroll-snap gallery, description-zone, links footer with brass-gradient buttons), 5 layout variants via data-media-type attribute
- [ ] T010 [P] Add CSS for accessibility in `index.html`: skip-link (off-screen, visible on focus), `:focus-visible` golden glow outline with dark offset ring (`box-shadow: 0 0 0 2px #1a1008, 0 0 0 5px #ffd700`), `:focus:not(:focus-visible)` outline:none, `.sr-only` utility class, `prefers-reduced-motion` media query (disable all animations/transitions), `prefers-contrast: more` media query (white on black, hide decorative, simple outlines), below-1200px media query ("best viewed on wider screen" message visible, app-shell hidden)
- [ ] T011 Add JavaScript for keyboard navigation in `index.html`: Tab order management, arrow key navigation within constellation nav list (up/down moves focus, wraps at boundaries), Enter on constellation button triggers project panel open, Escape closes overlay, focus trap inside overlay (Tab cycles through close→media→links→close), focus return to triggering button on close, aria-pressed state management on constellation buttons

**Checkpoint**: Opening index.html shows the full steampunk frame (brass corners, edges, gauges, rune band, logo), all 4 HUD panels with content, constellation nav with 7 project buttons, command line with cursor, and correct keyboard navigation. Screen reader announces all projects. Skip link works. No WebGL yet.

---

## Phase 3: User Story 1 — Discover and Browse Projects (Priority: P1)

**Goal**: Visitors can discover all 7 projects via star hover/click and constellation nav, view project detail panels with correct content and working links.

**Independent Test**: Click any star or constellation nav button → detail panel opens with correct project data → links work → Escape closes.

### Implementation for User Story 1

- [ ] T012 [US1] Add Three.js scene initialization in `index.html`: WebGL support check (show static fallback if absent), PerspectiveCamera (FOV 45, near 0.1, far 100, position z=4.5), WebGLRenderer (antialias, alpha:true, powerPreference high-performance), DPR clamp `Math.min(devicePixelRatio, 1.5)`, ACESFilmicToneMapping exposure 1.2, SRGBColorSpace, resize handler with DPR re-clamp, append renderer to `#main-viewport`, viewport width guard (skip init below 1200px)
- [ ] T013 [US1] Build crystal ball orb group in `index.html`: OrbGroup (THREE.Group), outer glass sphere (IcosahedronGeometry r=1.0 detail 6, MeshPhysicalMaterial transmission 0.92 roughness 0.05 IOR 1.5), rim sphere (IcosahedronGeometry r=1.04 detail 6, MeshBasicMaterial brass-gold BackSide opacity 0.12), inner glow sphere (IcosahedronGeometry r=0.97 detail 5, MeshBasicMaterial deep violet BackSide opacity 0.85), AmbientLight (deep purple 0x1a0a2e intensity 0.3), PointLight (gold 0xffaa44 position 3,3,3 intensity 2), add all to scene
- [ ] T014 [US1] Build nebula system in `index.html`: 3 layered THREE.Points clouds — core (800 pts, r=0.75, warm→violet, additive), mid (400 pts, r=0.85, blue→teal, additive), haze (300 pts, r=0.88, white→lavender, normal) — using rejection sampling for sphere distribution, per-vertex colors lerped between project accent colors based on spatial proximity, PointsMaterial with sizeAttenuation and depthWrite:false, add all to OrbGroup
- [ ] T015 [US1] Build star node system in `index.html`: for each of 7 projects, create canvas-drawn radial gradient texture (project accent color), THREE.Sprite with SpriteMaterial (transparent, additive, depthWrite:false), set position from PROJECTS[i].position, scale from starSize × 0.12, store project reference in userData, add to StarGroup inside OrbGroup
- [ ] T016 [US1] Implement raycasting interaction in `index.html`: Raycaster against 7 star sprites, mousemove handler (canvas-relative normalized coords), per-frame raycast check in render loop, hover enter (GSAP scale 1.6x over 200ms, show HTML label via project3DtoScreen), hover exit (GSAP scale back, hide label), click handler (trigger panel open), cursor pointer/default toggle
- [ ] T017 [US1] Implement project detail panel logic in `index.html`: showProjectPanel(project) populates overlay title, tagline, media zone (switch on mediaType: logo→img, screenshots→scroll-snap gallery, youtube→thumbnail+play link, video→`<video>` with mp4/webm sources, null→terminal placeholder with category SVG icon), links (brass buttons with platform SVG icons, max 5, primary flagged), remove hidden attribute, focus close button; closeProjectPanel() hides overlay, returns focus to trigger element, scroll unlock
- [ ] T018 [US1] Connect constellation nav buttons to panel logic in `index.html`: click handler on each constellation button calls showProjectPanel with matching project data, highlights corresponding star in orb (GSAP scale + brightness), manages aria-pressed state across all buttons
- [ ] T019 [US1] Implement GSAP ticker render loop in `index.html`: `gsap.ticker.add()` with `renderer.render(scene, camera)` inside, `gsap.ticker.lagSmoothing(0)`, nebula slow drift (per-layer rotation via time), star idle pulse (`0.7 + 0.3 * sin(time * 1.2 + phaseOffset)` per star with random phases), dust mote system (180 THREE.Points with Brownian drift, soft procedural circle fragment shader, noise-based velocity perturbation, clamped to orb interior r=0.92, size 2-6px, opacity 0.08-0.25), tab visibility pause via `document.addEventListener('visibilitychange')` → `gsap.ticker.sleep()/wake()`

**Checkpoint**: Crystal ball renders with glass look, nebula is visible inside, 7 stars glow and pulse, hovering shows labels, clicking opens correct project panels with real data and working links. Constellation nav buttons also open panels. Tab-pause works.

---

## Phase 4: User Story 2 — Experience the Reveal Sequence (Priority: P2)

**Goal**: Cinematic reveal sequence plays on page load, teaching visitors that stars are interactive.

**Independent Test**: Refresh page → frame assembles → gauges power up → command line types → orb ignites → nebula blooms → stars appear → discoverability pulse fires.

### Implementation for User Story 2

- [ ] T020 [US2] Implement reveal sequence master timeline in `index.html`: GSAP timeline with 3 phases — Phase 1 (0–1600ms): frame corners slide in with expo.out stagger, side panels scaleX from edges, rivet/bolt details pop with springy scale, all frame elements start at opacity:0/displaced; Phase 2 (1600–3800ms): gauge needles sweep with CustomEase damping curve, command line bar slides up, typewriter effect types CLI copy sequence (`> reveal universe_` → `> calibrating orb...` → `> orb ignition sequence active`) using TextPlugin at 75ms/char; Phase 3 (3800–6500ms): orb rim opacity 0→1, 80ms white flash on glass, nebula layers opacity 0→0.7 with expanding scale, star sprites fade in with stagger (random order via gsap.utils.shuffle, 150ms between, back.out(2.5) scale)
- [ ] T021 [US2] Implement discoverability affordance in `index.html`: 2 seconds after reveal completes, trigger one-time scanning animation — each star pulses with expanding halo ring (sonar ping), command line types `> 7 anomalies detected. investigate?`, status panel populates with arcane readout text (coordinates, signal strength, phase indicators), left nav labels stagger fade in; set all initial states (frame hidden, orb transparent, stars invisible) before sequence begins
- [ ] T022 [US2] Implement skip-intro affordance in `index.html`: visible "Skip" button (brass-styled, positioned bottom-right, z-index above frame), fades in at t=500ms and auto-fades after 3 seconds, keyboard shortcut (S key), on trigger: masterTimeline.progress(1) to instantly complete all animations, remove skip button; prefers-reduced-motion: skip entire sequence, set all elements to final state immediately, show discoverability text statically
- [ ] T023 [US2] Handle scroll-during-reveal edge case in `index.html`: if user scrolls before reveal completes, call masterTimeline.progress(1) to skip to completion, then activate scroll-driven interactions immediately

**Checkpoint**: Full reveal sequence plays on fresh page load. Skip button works. Discoverability sonar pulse and CLI prompt appear. Reduced-motion shows everything instantly.

---

## Phase 5: User Story 3 — Scroll-Driven Exploration (Priority: P3)

**Goal**: Scrolling provides a passive guided tour through constellation zones with visual feedback.

**Independent Test**: Scroll down → orb rotates → nebula colors shift → constellation groups highlight → status text updates → end zone shows all stars equal.

### Implementation for User Story 3

- [ ] T024 [US3] Add scroll container HTML in `index.html`: `<div id="scroll-driver">` with height ~400vh, positioned to provide scroll room while `#scene-viewport` is pinned
- [ ] T025 [US3] Implement ScrollTrigger integration in `index.html`: register ScrollTrigger plugin, create main scroll timeline with trigger `#scroll-driver`, start "top top", end "bottom bottom", scrub 1.5, pin `#scene-viewport`, anticipatePin 1; use proxy object pattern — `const scrollProxy = { orbRotY: 0, cameraZ: 4.5, paletteShift: 0 }`, animate proxy values in timeline, apply to Three.js objects in onUpdate callback; OrbGroup.rotation.y driven by scroll (0 → 0.44 rad), camera.position.z (4.5 → 3.7)
- [ ] T026 [US3] Implement constellation zone triggers in `index.html`: 3 zone sub-triggers (Arcane Tools 25-50%, Intelligence Matrix 50-75%, Outpost Network 75-90%) with onEnter/onLeaveBack callbacks — on enter: brighten zone's stars (GSAP scale 1.3x, brightness increase), shift nebula layer colors toward zone accent, update status panel text and command line with zone-specific messages; on leave: revert; End Zone (90-100%): all stars return to equal brightness
- [ ] T027 [US3] Implement scroll-lock when panel is open in `index.html`: when project overlay is visible, disable ScrollTrigger (ScrollTrigger.getAll().forEach(st => st.disable())), re-enable on panel close; prevent background scene animation while panel is open
- [ ] T028 [US3] Add prefers-reduced-motion scroll handling in `index.html`: if reduced motion, disable all ScrollTrigger instances, keep scene static, all stars at equal brightness regardless of scroll position

**Checkpoint**: Scrolling rotates orb, shifts nebula colors per zone, highlights constellation groups, updates status text. Panel open locks scroll. Reduced-motion: no scroll effects.

---

## Phase 6: User Story 4 — Keyboard and Screen Reader Navigation (Priority: P4)

**Goal**: Full keyboard and screen reader accessibility for all portfolio interactions.

**Independent Test**: Navigate entire portfolio with keyboard only (Tab, arrows, Enter, Escape) + screen reader verifies all content announced.

### Implementation for User Story 4

- [ ] T029 [US4] Verify and refine keyboard navigation in `index.html`: test Tab order (skip link → constellation nav buttons → orb-hitzone → status panel), verify arrow key nav in constellation list (up/down, wrapping), verify Enter opens panel, verify Escape closes and returns focus, verify focus trap cycling in overlay (close→media→links→close), fix any focus management gaps discovered during testing
- [ ] T030 [US4] Set initial focus after reveal in `index.html`: after reveal sequence (or immediately if prefers-reduced-motion), programmatically set focus to the first constellation nav button; ensure focus is never trapped in the canvas area
- [ ] T031 [US4] Verify screen reader accessibility in `index.html`: ensure .sr-only project list is complete (7 entries with name, tagline, primary link), verify aria-live regions (status panel, command line) announce updates, verify overlay dialog announces title on open, verify canvas is fully hidden from assistive technology, verify all buttons have descriptive aria-labels

**Checkpoint**: Keyboard-only navigation reaches all 7 projects. Screen reader announces all content. Focus management is correct in all states.

---

## Phase 7: User Story 5 — Graceful Degradation (Priority: P5)

**Goal**: Portfolio functions at all capability levels — WebGL2, WebGL1, no WebGL, narrow viewport, mobile.

**Independent Test**: Disable WebGL → CSS frame renders → static fallback image shows → project list/nav works. Narrow viewport → "wider screen" message.

### Implementation for User Story 5

- [ ] T032 [US5] Implement WebGL capability detection in `index.html`: check for WebGL2/WebGL1 support before scene init, if no WebGL: skip all Three.js code, show static orb fallback image in viewport, CSS frame still renders, constellation nav and project overlay still work; if WebGL1 only: skip bloom/transmission, use MeshPhongMaterial with high shininess
- [ ] T033 [US5] Implement Safari shader compilation detection in `index.html`: after renderer creation, call `renderer.compile(scene, camera)`, check for WebGL errors via `gl.getError()`, if compilation fails: dispose renderer, show static fallback image, log error to console
- [ ] T034 [US5] Implement WebGL context loss handling in `index.html`: listen for `webglcontextlost` event on canvas, call `event.preventDefault()`, set flag, listen for `webglcontextrestored`, attempt `renderer.forceContextRestore()`; if restoration fails after timeout: replace canvas with static fallback image
- [ ] T035 [US5] Add viewport width guard in `index.html`: CSS media query `@media (max-width: 1199px)` shows centered "best viewed on wider screen" message, hides `#app-shell`; JS guard: only initialize Three.js when `window.innerWidth >= 1200`

**Checkpoint**: No-WebGL shows static fallback with working nav. Safari shader failure detected and handled. Context loss recovery works. Narrow viewport shows message.

---

## Phase 8: Post-Processing & Performance

**Purpose**: Visual polish layer that depends on core functionality being complete

- [ ] T036 [P] Implement EffectComposer post-processing in `index.html`: import EffectComposer, RenderPass, UnrealBloomPass from Three.js addons, set up 4-pass pipeline (RenderPass → UnrealBloomPass strength 0.8 threshold 0.85 radius 0.4 at 0.75x resolution → custom ShaderPass combining chromatic aberration at orb edges 0.003 UV max + vignette → OutputPass), replace direct renderer.render() call with composer.render() in GSAP ticker
- [ ] T037 [P] Implement supernova burst effect in `index.html`: pre-allocate particle pool (60 sprites), on star click: spawn 20 radial sprites at star world position, GSAP animate outward expansion (0.4 radius, 600ms power2.out) with opacity fade (0→1→0), expanding ring torus (scale 0→2, 600ms), 8-12 radial ray quads; total burst duration 900ms; cleanup: return particles to pool
- [ ] T038 Implement auto-tier performance degradation in `index.html`: 5 seconds after reveal completes, run 30-frame benchmark (measure frame times via performance.now()), calculate average; if >20ms: drop from Tier 1 (full) to Tier 2 (reduce fBm to 4 octaves, disable chromatic aberration), if still >20ms: drop to Tier 3 (disable bloom entirely, use CSS filter fallback); log active tier to console; apply tier changes by toggling EffectComposer passes and updating shader uniforms

**Checkpoint**: Stars bloom with glow bleed. Click triggers visible supernova burst. Auto-tier benchmarks and logs tier to console. Performance remains smooth.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements affecting multiple user stories

- [ ] T039a Capture a static screenshot of the completed crystal ball orb (after Phase 3 checkpoint) and save as `assets/orb-fallback.png` for use as the no-WebGL static fallback image (referenced by FR-025, T032)
- [ ] T039 Add OG meta tags and favicon in `index.html` `<head>`: `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">` (static screenshot of completed orb), `<link rel="icon">` pointing to a small brass-gear SVG data URI
- [ ] T040 [P] Add CSS hover effects for frame elements in `index.html`: gauge needle micro-wobble on interaction state, command line text color shift on state changes (terminal-green → arcane-gold on reveal), rune glow pulse on hover near orb, subtle brass highlight transitions on HUD panel borders
- [ ] T041 [P] Verify all media handling variants in `index.html`: test odd-ai-reviewers (YouTube thumbnail → new tab), ado-git-repo-insights (screenshot scroll-snap gallery), odd-fintech (native video mp4/webm with controls), repo-standards (terminal placeholder with code bracket SVG), odd-self-hosted-ci (terminal placeholder with gear SVG), odd-map (terminal placeholder with map pin SVG), coney-island (photo image display); verify link buttons render correctly for each project
- [ ] T042 Cross-browser testing: verify in Chrome (latest), Firefox (latest — WebGL context loss handling), Safari (latest macOS — shader compilation), Mobile Safari (static fallback renders); fix any rendering discrepancies
- [ ] T043 Final accessibility audit: keyboard-only full navigation test, screen reader test (NVDA or VoiceOver), prefers-reduced-motion verification (macOS: System Preferences → Accessibility → Reduce Motion), prefers-contrast verification, color contrast spot-check on all text elements, verify brass is never used for readable text
- [ ] T044 Performance verification: test on integrated GPU laptop, verify 60fps steady state, verify auto-tier logs correct tier, verify tab-pause stops rendering, verify DPR clamp at 1.5, check page weight (target <800KB excl. media)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — the core experience
- **User Story 2 (Phase 4)**: Depends on US1 (reveal sequence animates elements created in US1)
- **User Story 3 (Phase 5)**: Depends on US1 (scroll drives scene created in US1)
- **User Story 4 (Phase 6)**: Depends on US1 (keyboard nav interacts with elements from US1)
- **User Story 5 (Phase 7)**: Depends on US1 (fallback replaces WebGL from US1)
- **Post-Processing (Phase 8)**: Depends on US1 (adds visual polish to existing scene)
- **Polish (Phase 9)**: Depends on all user stories being functional

### User Story Dependencies

- **US1 (P1)**: After Foundational (Phase 2) — no dependencies on other stories
- **US2 (P2)**: After US1 — animates elements that US1 creates
- **US3 (P3)**: After US1 — scroll drives the scene US1 builds. Can parallel with US2.
- **US4 (P4)**: After US1 — tests accessibility of US1 elements. Can parallel with US2/US3.
- **US5 (P5)**: After US1 — creates fallbacks for US1. Can parallel with US2/US3/US4.
- **Post-Processing (Phase 8)**: After US1 — adds visual polish. Can parallel with US2-US5.

### Within Each User Story

- Models/data before services/logic
- Scene setup before interactions
- Core implementation before integration

### Parallel Opportunities

- T003, T004 can run in parallel (CSS tokens and project data are independent)
- T006, T007, T008, T009, T010 can run in parallel (different CSS sections)
- US3, US4, US5, and Phase 8 can all begin after US1 completes (if team capacity allows)
- T036, T037 can run in parallel (different WebGL subsystems)
- T040, T041 can run in parallel (CSS polish and media verification are independent)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: User Story 1 (T012-T019)
4. **STOP and VALIDATE**: Crystal ball renders, stars interactive, panels show correct data
5. This is a demonstrable POC at this point

### Incremental Delivery

1. Setup + Foundational → Frame and accessibility foundation ready
2. Add US1 → Interactive crystal ball with project browsing (MVP!)
3. Add US2 → Cinematic reveal sequence (wow factor)
4. Add US3 → Scroll-driven exploration (passive discovery)
5. Add US4 → Accessibility verification pass
6. Add US5 → Graceful degradation for all browsers
7. Add Phase 8 → Post-processing visual polish
8. Add Phase 9 → Cross-browser testing, final polish, OG tags

### Sequential Implementation (Single Developer)

Recommended order: Phase 1 → 2 → 3 → 4 → 8 → 5 → 7 → 6 → 9
(Post-processing added right after reveal for maximum visual impact during testing)

---

## Notes

- All tasks target a single `index.html` file — section markers (`<!-- === SECTION === -->`) prevent merge conflicts
- [P] tasks = different code sections within index.html, no dependencies
- No automated tests — manual verification per quickstart.md checklist at each checkpoint
- Constitution is authoritative for all design parameters (colors, sizes, performance budgets)
- INIT.md brainstorm notes provide implementation detail beyond what the spec/plan specify
- Total: 44 tasks across 9 phases
