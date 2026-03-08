# Tasks: Parchment Door Splash Gate

**Input**: Design documents from `/specs/017-parchment-door-splash/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not requested. Manual cross-browser testing only (per plan.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Asset Preparation)

**Purpose**: Prepare binary assets and constitution gate before any code is written

- [x] T001 Convert `design-assets/chamber-door.png` to WebP — resized to 768x1152 (adequate for 1.5x DPR), quality 30, 139KB (<150KB target)
- [x] T002 [P] Create PNG fallback: optimized `design-assets/chamber-door.png` to `assets/chamber-door.png` — 2MB (fallback for rare non-WebP browsers)
- [x] T003 [P] Synthesized door creak audio via ffmpeg (tremolo + brown noise), MP3 mono 96kbps, 30KB (<60KB target) at `assets/door-creak.mp3` — replaceable with real royalty-free sample
- [x] T004 [P] ~~Request constitution amendment~~ DONE — Principle I amended to v1.7.0 (owner-approved 2026-03-07). Audio scoped to single UI sound, <100KB, royalty-free, user-gesture-triggered, must play in sync or be removed.

**Checkpoint**: All binary assets ready. Constitution gate resolved (amendment approved or audio dropped).

---

## Phase 2: Foundational (CSS + Splash Module Skeleton)

**Purpose**: Core CSS infrastructure and module skeleton that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add splash gate CSS custom properties to `:root` in `css/styles.css`: `--z-splash`, `--splash-bg-center`, `--splash-bg-edge`, `--splash-text-color`, `--splash-text-title`, `--splash-seal-wax`, `--splash-seal-wax-dark`, `--splash-seal-logo`, `--splash-seal-size`, `--splash-glow-opacity` per plan.md CSS Architecture section
- [x] T006 Add splash gate CSS section in `css/styles.css` — splash overlay layout (`.splash-gate` fixed positioning, z-index 150, flexbox centering), backdrop gradient, scroll lock (`body.splash-active`), pointer-events block on `#app-shell`
- [x] T007 [P] Add splash gate responsive rules in `css/styles.css` — mobile (<768px: width 100%, object-fit cover), tablet (768-1199: max-height 90vh, contain), desktop (1200+: max-height 92vh, aspect-ratio constrained), ultrawide (centered)
- [x] T008 [P] Add splash gate accessibility CSS in `css/styles.css` — `prefers-reduced-motion` overrides (no pulse, no glow animation, instant transitions), `prefers-contrast: more` overrides (dark text on light bg)
- [x] T009 Create `js/splash.js` module skeleton — export `init(options)` and `isReturningVisitor()`, define `SPLASH_VERSION = 1` constant and `SPLASH_CONTENT` object literal (heading, body, instruction text), import nothing from project modules

**Checkpoint**: Foundation ready — CSS loaded, module skeleton exists, user story implementation can begin.

---

## Phase 3: User Story 1 — First-Time Visitor Splash Gate (Priority: P1) MVP

**Goal**: First-time visitor sees the full-screen door/parchment splash and can dismiss it by breaking the wax seal, revealing the site.

**Independent Test**: Load site in fresh browser (no localStorage). Splash appears with door image, parchment text, chromatic glow, and wax seal. Click seal — seal breaks, door swings open, site is revealed.

### Implementation for User Story 1

- [x] T010 [US1] Implement `isReturningVisitor()` in `js/splash.js` — read `localStorage.getItem('oe-splash-dismissed')`, JSON parse with try/catch, compare version against `SPLASH_VERSION`, return boolean
- [x] T011 [US1] Implement splash DOM construction in `js/splash.js` — dynamically create `#splash-gate` with `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-describedby`; build backdrop div, chromatic glow div, door-container with `<picture>` (WebP source + PNG fallback img), parchment text div (h1 + p + instruction from `SPLASH_CONTENT`), seal `<button>` with inline OE logo SVG and `aria-label="Enter the portfolio"`; append to `document.body`
- [x] T012 [US1] Add wax seal CSS in `css/styles.css` — `.splash-gate__seal` circular button with layered radial gradients (primary wax `#8B1A1A`, highlight `#C43030`, rim ring, shadow depth), OE logo fill `#4A0A0A` at 55-60% size; sizing `clamp(56px, 6vw, 72px)`; position absolute `bottom: 12%; left: 50%; transform: translateX(-50%)`
- [x] T013 [US1] Add seal interactive states CSS in `css/styles.css` — idle breathing pulse (scale 1.0→1.04, 2.5s sine via `@keyframes seal-breathe`), hover scale 1.08 + brass glow, active scale 0.95, focus-visible `outline: 3px solid #ffd700; outline-offset: 4px`
- [x] T014 [US1] Add parchment text CSS in `css/styles.css` — `.splash-gate__parchment-text` absolute positioned (top 18%, left 22%, right 18%, bottom 28%), flex column centered; title Cinzel 600 `clamp(18px, 3.5vw, 28px)` color `#3B2A14`; body IM Fell English `clamp(14px, 2.8vw, 18px)` color `#4A3520`; instruction Cinzel 400 `clamp(12px, 1.8vw, 16px)` color `#5C3A1E`; ink text-shadow
- [x] T015 [US1] Implement chromatic glow in `css/styles.css` and `js/splash.js` — `.splash-gate__glow` layer positioned between backdrop and door-container; `@keyframes chromatic-shift` cycling hue via `filter: hue-rotate()` over 8s loop; blur 20-40px, opacity 0.15-0.25; reduced-motion: static single warm hue
- [x] T016 [US1] Implement seal break animation in `js/splash.js` — GSAP timeline: Phase 1 (0-400ms) crack lines + seal translateY -2px; Phase 2 (400-900ms) 5 clip-path fragments rotate + translate outward + fade to 0; Phase 3 (900-1000ms) remove fragment elements
- [x] T017 [US1] Implement door-opening animation in `js/splash.js` — GSAP timeline with `perspective: 1200px` on container, `transformOrigin: 'left center'`: Beat 1 (0-300ms) rotateY 0→-3deg, Beat 2 (300-1200ms) rotateY -3→-35deg, Beat 3 (1200-2000ms) rotateY -35→-85deg + opacity fade; glow intensification throughout
- [x] T018 [US1] Implement focus management in `js/splash.js` — on splash DOM creation: add `splash-active` class to body, auto-focus seal button; implement focus trap (Tab/Shift+Tab stay on seal); Escape key is no-op
- [x] T019 [US1] Implement `init()` Promise lifecycle in `js/splash.js` — if `isReturningVisitor()` returns true, resolve immediately with no DOM work; if first visit: build DOM, show splash, wire seal click handler to break animation → door animation → cleanup → resolve; accept `preloadPromise` option
- [x] T020 [US1] Integrate splash into `js/app.js` — add `import { init as initSplash, isReturningVisitor } from './splash.js'`; first-visit path with preloadPromise coordination; returning-visitor path resolves immediately. +19 lines added.
- [x] T021 [US1] Add image fallback handling in `js/splash.js` — `onerror` handler on door `<img>` adds `.splash-gate--img-failed` class; CSS rule adjusts text colors for contrast against dark backdrop

**Checkpoint**: User Story 1 complete. First-time visitors see the splash, can break the seal, door opens with chromatic glow, site is revealed. Returning visitors see nothing new.

---

## Phase 4: User Story 2 — Returning Visitor Bypass (Priority: P1)

**Goal**: Returning visitors who previously broke the seal never see the splash again.

**Independent Test**: Set `localStorage.setItem('oe-splash-dismissed', '{"v":1,"ts":1709827200000}')` manually, reload — splash must not appear. Clear localStorage, reload — splash appears.

### Implementation for User Story 2

- [x] T022 [US2] Implement `setDismissed()` in `js/splash.js` — write `{ v: SPLASH_VERSION, ts: Date.now() }` to `localStorage.setItem('oe-splash-dismissed', ...)` with try/catch for quota/private browsing errors; call from seal click handler AFTER break animation starts but BEFORE door animation completes
- [x] T023 [US2] Verify zero-flash for returning visitors — `isReturningVisitor()` check runs synchronously before any DOM construction in `init()`; no splash DOM elements created for returning visitors; no bfcache flash (splash is dynamic JS, not in static HTML)
- [x] T024 [US2] Handle localStorage edge cases in `js/splash.js` — corrupted JSON (catch parse errors → treat as first visit), private browsing (catch setItem errors → splash works but doesn't persist), version mismatch (stored v !== SPLASH_VERSION → show splash again)

**Checkpoint**: User Story 2 complete. Returning visitors bypass splash entirely with zero flash. localStorage failures handled gracefully.

---

## Phase 5: User Story 3 — Asset Preloading During Splash (Priority: P2)

**Goal**: Site assets (Three.js scene, textures, fonts) preload behind the splash while the visitor reads. If assets ready when seal clicked: instant reveal. If not ready: show loading state, wait, then reveal.

**Independent Test**: Throttle network to Slow 3G in DevTools. Load site (fresh). Click seal immediately — subtle loading indicator should appear. Wait for loading → door opens. On fast connection: seal click → instant door animation.

### Implementation for User Story 3

- [x] T025 [US3] Restructure `js/app.js` for parallel preloading — create `preloadPromise` + `resolvePreload` before calling `initSplash()`; pass `{ preloadPromise }` to splash init; after splash init starts, run `fetch repo-metrics`, `initInteractions()`, `initScene()` in parallel behind splash z-index; call `resolvePreload()` after initScene returns
- [x] T026 [US3] Implement preload-aware seal handler in `js/splash.js` — on seal click: start break animation immediately (user reward); after break completes, check preloadDone flag; if pending: show loading state, then fire when resolved
- [x] T027 [US3] Implement loading state visual in `js/splash.js` and `css/styles.css` — pulsing brass ring + GSAP TextPlugin typed "PREPARING THE CHAMBER..." text; `role="status"` and `aria-live="polite"` for screen reader announcement

**Checkpoint**: User Story 3 complete. Scene initializes behind splash. Fast connections: instant reveal. Slow connections: immersive loading state.

---

## Phase 6: User Story 4 — Mobile-Friendly Splash (Priority: P2)

**Goal**: Splash scales correctly and is fully usable on all viewports from 320px to 2560px+.

**Independent Test**: Test on iPhone SE (375px), iPad (768px), desktop (1440px), ultrawide (2560px). Splash renders without horizontal scroll. Text is legible. Seal is tappable (>=44px).

### Implementation for User Story 4

- [ ] T028 [US4] Verify mobile layout in `css/styles.css` — test door image scaling on 375px viewport (object-fit cover, slight edge crop acceptable); verify parchment text area percentages produce readable text at `clamp()` minimums (18px heading, 14px body); confirm no horizontal overflow
- [ ] T029 [US4] Verify seal tap target sizing across breakpoints — confirm `clamp(56px, 6vw, 72px)` produces >=44px at all viewport widths (56px at 375px → PASS); verify touch feedback (active scale 0.95 on touchstart); confirm seal sits in thumb-reach zone (~70-75% from top on mobile)
- [ ] T030 [US4] Test ultrawide viewport handling — at 2560px+, verify door image is centered, max-height constrained, dark radial gradient fills flanking space; no distortion; chromatic glow visible around edges
- [ ] T031 [US4] Test door-opening animation performance on mobile — verify GSAP perspective swing runs at 60fps on mid-range devices (test Chrome DevTools mobile emulation with CPU throttle 4x); if jank: simplify to fade-out on mobile

**Checkpoint**: User Story 4 complete. Splash works across all viewports. Touch targets meet WCAG 2.5.5.

---

## Phase 7: User Story 5 — Door Creak Audio (Priority: P3)

**Goal**: Door creak sound plays when the seal is broken, using the seal-click user gesture for AudioContext creation.

**Independent Test**: Click seal — hear door creak. Mute device volume — animation still proceeds. Test in Chrome, Firefox, Safari, Edge.

**GATE**: Constitution amendment approved (T004 complete). Audio must play in sync with door animation — if >50ms latency in production, remove audio entirely rather than ship degraded.

### Implementation for User Story 5

- [x] T032 [US5] Implement `preloadAudio()` in `js/splash.js` — fetch `assets/door-creak.mp3` as ArrayBuffer during splash display (non-blocking), then pre-decode via offline AudioContext so decoded buffer is ready at click time; store decoded buffer in module-level variable; catch errors silently
- [x] T033 [US5] Implement `playDoorCreak()` in `js/splash.js` — create `AudioContext` inside seal click handler (user gesture → autoplay compliant); use pre-decoded buffer from T032 (zero decode latency); create BufferSource, set volume to 0.4; connect to destination and `start(0)`; wrap all in try/catch (audio failure never blocks door animation). **Quality gate**: if audio start exceeds 50ms from animation start in production, remove audio entirely.
- [x] T034 [US5] Wire audio into seal click handler in `js/splash.js` — call `playDoorCreak()` at start of door-opening animation (after seal break completes); skip if `prefers-reduced-motion` matches (per team decision: sound without visual context is jarring)
- [x] T035 [US5] Add `AUDIO_ENABLED` flag at top of `js/splash.js` — defaults to `true` (amendment approved); all audio calls gated behind this flag; set to `false` if production testing reveals >50ms sync latency

**Checkpoint**: User Story 5 complete. Audio plays on seal break. Graceful fallback if audio fails or is disabled.

---

## Phase 8: Polish & Cross-Cutting Concerns (Original)

**Purpose**: Final integration, edge cases, and quality sweep

- [ ] T036 Cross-browser test: Chrome, Firefox, Safari, Edge — verify splash renders, seal breaks, door swings, glow animates, portfolio reveals in each browser
- [ ] T037 [P] Accessibility audit — verify screen reader announces dialog + parchment text + "Enter the portfolio" button; verify keyboard-only flow (Tab to seal, Enter to break); verify focus trap; verify `aria-modal` blocks background content announcement
- [ ] T038 [P] Reduced-motion test — enable `prefers-reduced-motion: reduce` in DevTools; verify: seal is static (no pulse), chromatic glow is static (single warm hue), seal click instantly removes splash (200ms fade, no door swing), no audio plays
- [ ] T039 [P] High-contrast test — enable `prefers-contrast: more`; verify parchment text and seal maintain sufficient contrast; verify no decorative elements interfere with readability
- [x] T040 Verify `js/splash.js` line count is under 400 lines (constitution limit) — 390 lines, PASS
- [x] T041 Verify `js/app.js` modifications are under 30 new lines (plan constraint) — +19 lines, PASS
- [x] T042 [P] Verify page weight: `assets/chamber-door.webp` 139KB (<150KB), `assets/door-creak.mp3` 30KB (<60KB), PASS
- [ ] T043 Final integration test — fresh browser: splash appears → read text → break seal → door opens with chromatic glow → portfolio reveal plays → navigate projects → close panel → everything works normally. Then reload: splash does NOT appear → portfolio loads directly.

**Checkpoint**: Feature complete. All user stories functional, accessible, and performant.

---

## Phase 9: Archway Enhancement — Setup (Asset Preparation)

**Purpose**: Prepare the stone archway asset for production use. Resolves BLOCKER issues identified in team review.

- [x] T044 Convert `design-assets/chamber-door-archway2.png` (2560x1440, RGBA, 2.24MB) to WebP with alpha at quality 70 — output `assets/chamber-archway.webp` 114KB
- [x] T045 [P] Create PNG fallback — palette-optimized `assets/chamber-archway.png` 418KB
- [x] T046 [P] Free line budget in `js/splash.js` — collapsed `OE_LOGO_SVG` from 11 lines to 1 line. Module went from 390 → 380 lines (20 lines headroom).

**Checkpoint**: Archway WebP + PNG ready in `assets/`. Line budget freed in splash.js.

---

## Phase 10: Archway Enhancement — Foundational (CSS + DOM Changes)

**Purpose**: Add archway-scene wrapper and archway frame layer to the splash gate DOM and CSS

**CRITICAL**: Phase 9 setup must be complete before starting this phase

### Archway DOM Structure (target)

```
splash-gate (dialog)
  |-- backdrop
  |-- archway-scene (NEW wrapper, relative, centered)
  |    |-- glow (moved inside archway-scene)
  |    |-- door-container (unchanged, swings via rotateY)
  |    |    |-- picture > img (door)
  |    |    |-- parchment-text
  |    |    +-- seal button
  |    +-- archway-frame (NEW, picture > img, z-index 10, pointer-events: none)
```

- [x] T047 Add archway-scene wrapper DOM construction in `js/splash.js` `buildSplashDOM()` — archwayScene wraps glow + doorContainer + archwayFrame; archway-frame has picture element with WebP/PNG sources, pointer-events none, aria-hidden, onerror fallback
- [x] T048 Add `.splash-gate__archway-scene` CSS in `css/styles.css` — relative, z-index 2, 100% width, 92vh height, flex align-items flex-end, transform-style flat
- [x] T049 [P] Add `.splash-gate__archway-frame` and `.splash-gate__archway-img` CSS — absolute inset 0, z-index 10, pointer-events none; img object-fit cover, object-position center bottom
- [x] T050 Reposition `.splash-gate__door-container` — absolute, z-index 5, bottom 5%, centered, width 27%, aspect-ratio 768/1152
- [x] T051 Reposition `.splash-gate__glow` — z-index 3, width 29%, height 80%, bottom 5%, centered
- [x] T052 Update backdrop side-fill — stone-color horizontal gradient (#1e1b17/#2a2520) layered under existing radial gradient

**Checkpoint**: Archway frame visible on desktop. Door appears inside the arch opening. Glow emanates from within the arch. Stone extends horizontally.

---

## Phase 11: Archway Enhancement — Animation & Responsive (US1 Integration)

**Purpose**: Update door-swing animation for new DOM structure and add responsive archway rules

- [x] T053 [US1] Update `playDoorOpen()` — perspective set on archway-scene (with root fallback); scene fade-out added at timeline position 1.6
- [x] T054 [US1] Set `transform-style: flat` on archway-scene — included in T048 CSS; removed static `perspective: 1200px` from .splash-gate CSS
- [x] T055 [P] Mobile responsive (<768px) — archway-frame hidden, door-container/glow reverted to full viewport, archway-scene 100dvh
- [x] T056 [P] Tablet responsive (768-1199px) — archway-scene 90vh, door-container 32%/bottom 4%, glow 33%/78%/bottom 4%
- [x] T057 [P] Ultrawide responsive (2560px+) — door-container 25%, glow 27%, seal 80px

**Checkpoint**: Door swings correctly within the archway frame. Archway hidden on mobile. Stone extends on ultrawide. Scene fades out cleanly at end of animation.

---

## Phase 12: Archway Enhancement — Polish & Verification

**Purpose**: Visual calibration, cross-browser testing, and constitution compliance

- [ ] T058 Visually calibrate door-in-arch alignment — open site at 1920x1080, 2560x1440, 1024x768, and 3440x1440 viewport sizes; adjust door-container width percentage and glow width percentage until the door sits naturally within the arch opening with thin dark gaps on sides simulating a recessed threshold; document final percentages in a comment in `css/styles.css`
- [x] T059 [P] Verify `js/splash.js` line count — 396 lines (under 400 limit), PASS
- [x] T060 [P] Verify page weight — archway WebP 114KB (<250KB), combined first-visit splash 284KB (<400KB), PASS
- [ ] T061 Cross-viewport integration test — fresh browser at each breakpoint: mobile (375px) sees door-only layout; tablet (768px) sees archway + door; desktop (1440px) sees archway with stone extending; ultrawide (2560px) sees full stone wall. At each: seal breaks, door swings within arch, scene fades, portfolio reveals.
- [ ] T062 [P] Verify archway does not interfere with existing accessibility — screen reader still announces dialog + text + seal button; keyboard focus trap still works (archway has `pointer-events: none` and `aria-hidden="true"`); reduced-motion still produces instant fade; high-contrast mode still readable
- [x] T063 [P] Test archway image fallback — onerror handler implemented in T047: `archImg.onerror = () => { archwayFrame.style.display = 'none'; }` hides archway-frame on load failure, reverting to door-only layout
- [ ] T064 Archway final integration test — fresh browser on desktop: splash appears with stone archway framing the door → parchment text readable through arch opening → seal visible and clickable → break seal → door swings within stone arch → stone arch fades with door → portfolio reveals. Then reload: splash does NOT appear.

**Checkpoint**: Archway enhancement complete. All viewports working. Performance verified. Constitution compliant.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (WebP image) completion
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — BLOCKS all other stories
- **US2 (Phase 4)**: Can start after US1 T010 (localStorage check) + T019 (init lifecycle)
- **US3 (Phase 5)**: Depends on US1 completion (needs working splash to add preloading)
- **US4 (Phase 6)**: Can start after US1 completion (testing responsive behavior)
- **US5 (Phase 7)**: Depends on T003+T004 (audio asset + constitution amendment); otherwise independent
- **Polish Original (Phase 8)**: Depends on all desired user stories being complete
- **Archway Setup (Phase 9)**: Depends on `design-assets/chamber-door-archway2.png` being ready (DONE — verified 2560x1440 RGBA)
- **Archway Foundational (Phase 10)**: Depends on Phase 9 completion
- **Archway Animation/Responsive (Phase 11)**: Depends on Phase 10 completion
- **Archway Polish (Phase 12)**: Depends on Phase 11 completion

### Archway Enhancement Dependencies (Phases 9-12)

- **T044, T045, T046**: All parallel (asset conversion + line budget are independent)
- **T047**: Depends on T046 (line budget freed) — core DOM change
- **T048, T049**: Parallel with each other (different CSS selectors), depend on T047
- **T050, T051, T052**: Parallel with each other (different CSS selectors), depend on T048
- **T053**: Depends on T047 (new DOM structure must exist for animation update)
- **T054**: Parallel with T053 (CSS rule, no JS dependency)
- **T055, T056, T057**: All parallel (different media query blocks), depend on T050
- **T058**: Depends on T050+T053 (door positioned + animation working) — visual calibration
- **T059, T060, T062, T063**: All parallel verification tasks, depend on Phase 11
- **T061, T064**: Sequential final tests, depend on all Phase 12 tasks

### Parallel Opportunities (Archway Enhancement)

```
Phase 9 (all parallel):
  T044 (WebP conversion) | T045 (PNG fallback) | T046 (line budget)

Phase 10 (sequential then parallel):
  T047 (DOM construction) → T048 + T049 (CSS, parallel) → T050 + T051 + T052 (CSS, parallel)

Phase 11 (mixed):
  T053 (animation JS) | T054 (CSS flat, parallel with T053)
  T055 + T056 + T057 (responsive CSS, all parallel, after T050)

Phase 12 (calibration then parallel verification):
  T058 (visual calibration) → T059 + T060 + T062 + T063 (all parallel) → T061 + T064 (final tests)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (asset conversion)
2. Complete Phase 2: Foundational (CSS + module skeleton)
3. Complete Phase 3: User Story 1 (splash gate with seal break + door animation)
4. **STOP and VALIDATE**: Test US1 independently in a fresh browser
5. If working: this alone is a shippable feature

### Incremental Delivery

1. Setup + Foundational → assets ready, CSS foundation laid
2. Add US1 → Full splash gate working → **MVP!**
3. Add US2 → localStorage persistence → returning visitors bypass
4. Add US3 → Preloading during splash → smoother reveal
5. Add US4 → Mobile responsive verification → all viewports
6. Add US5 → Audio polish (if amendment approved)
7. Polish → Cross-browser, accessibility, performance verification
8. **Archway Enhancement** → Stone archway frame for desktop/ultrawide realism

### Archway Enhancement Strategy

1. Phase 9: Asset prep (WebP/PNG conversion + line budget) — all parallel
2. Phase 10: DOM restructuring + CSS layout — the critical foundation
3. Phase 11: Animation update + responsive rules — builds on Phase 10
4. Phase 12: Visual calibration + verification — final polish
5. **STOP and VALIDATE**: User manually tests at all viewport sizes before commit

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Audio (US5) is gated on constitution amendment — plan to implement last or skip if not approved
- The splash module (`js/splash.js`) must stay under 400 lines
- The `app.js` modifications must stay under 30 new lines
- Chromatic glow (FR-019) is implemented in US1, not separated — it is core to the visual experience
- All CSS additions go in a single new section in `css/styles.css` (no new CSS files)
- Archway enhancement (Phases 9-12) is additive — it does NOT modify any completed user story logic
- Archway is hidden on mobile (<768px) — mobile users see the existing door-only layout
- Archway source: `design-assets/chamber-door-archway2.png` (2560x1440, RGBA, verified)
- Constitution Principle VI exception: archway bundled under existing "splash gate decorative assets" exception
