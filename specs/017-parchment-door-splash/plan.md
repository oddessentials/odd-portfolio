# Implementation Plan: Parchment Door Splash Gate

**Branch**: `017-parchment-door-splash` | **Date**: 2026-03-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-parchment-door-splash/spec.md`

**Team Review**: UX Specialist, UI Engineer, Graphics/Visual Designer, Architect, Devil's Advocate

## Summary

A full-screen splash gate displayed to first-time visitors, showing a chamber door image with parchment text and a wax seal dismiss button. Breaking the seal triggers a door-opening animation (left-hinge swing with chromatic glow reveal) and optional door creak audio, then hands off to the existing portfolio reveal sequence. Returning visitors bypass via localStorage check. The splash doubles as a preloader for Three.js scene assets.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3
**Primary Dependencies**: GSAP 3.12.5 + ScrollTrigger (CDN, pinned), Three.js 0.162.0 (CDN, pinned)
**Storage**: localStorage (agreement flag persistence)
**Testing**: Manual cross-browser (Chrome, Firefox, Safari, Edge) + device testing (iPhone SE, iPad, desktop)
**Target Platform**: Web (desktop 1200+, tablet 768-1199, mobile <768)
**Project Type**: Single-page portfolio (no build system, no backend)
**Performance Goals**: Splash visible <1s from page load; door animation <3s; zero flash for returning visitors
**Constraints**: <150KB WebP image; <60KB audio; splash module <400 lines; <30 lines added to app.js
**Scale/Scope**: Single new module + CSS section + 2 binary assets

## Constitution Check

*GATE: Must pass before implementation. Reviewed by Devil's Advocate.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope | PASS (amended) | Audio amendment approved (v1.7.0): single UI sound, user-gesture-triggered, <100KB, royalty-free, must play in sync with animation or be removed. Mobile breakpoints expanded by 013/015/017. |
| II. Performance-First | PASS | Splash is 100% DOM-based. Zero draw calls, zero texture memory. WebGL scene inits behind splash z-index. |
| III. Accessibility | PASS | Plan includes: `role="dialog"`, `aria-modal`, focus trap, `aria-label` on seal button, `prefers-reduced-motion` instant reveal, `<noscript>` support, WCAG AA text contrast. |
| IV. Text in HTML | PASS | All parchment text is HTML overlaid on the image. No text in canvas. |
| V. Visual Hierarchy | PASS | The splash is a separate world (medieval door) that transitions to the existing steampunk+cosmic worlds via chromatic glow bridge. |
| VI. Procedural-First | EXCEPTION | The door image is a user-provided custom design asset, not a procedural candidate. Wax seal IS procedural (CSS gradients + inline SVG). Exception justified: ephemeral asset loaded only for first-time visitors. |
| VII. Graceful Degradation | PASS | Splash DOM created by JS — no-JS users see portfolio directly. Image fallback: dark gradient + text + seal remain usable. localStorage failure: splash works but doesn't persist. |
| VIII. Asset Readiness | GATE | Door image: `design-assets/chamber-door.png` (1024x1536, 4.37MB) — must be converted to WebP (<150KB) before implementation. Audio: must be sourced (royalty-free door creak, <60KB MP3). |

### Constitution Amendment (Approved)

Principle I amended to v1.7.0 (owner-approved 2026-03-07):
1. Audio exclusion removed — scoped to: single UI sound effect, <100KB, royalty-free, user-gesture-triggered, **must play synchronously with animation or be removed** (no shipping out-of-sync audio)
2. Mobile breakpoint exclusion removed — expanded by features 013, 015, 017

Audio quality gate: if door creak has perceptible latency in production, it is cut rather than degraded.

## Architecture Design

### New Module: `js/splash.js` (~250-300 lines)

**Exports**: `init(options)`, `isReturningVisitor()`

**Imports**: None from project modules. Uses `window.gsap` global (CDN-loaded before ES modules).

**Responsibilities**:
1. Synchronous localStorage check (`isReturningVisitor()`)
2. Dynamic DOM construction (splash overlay, door image, parchment text, wax seal)
3. Chromatic glow effect (CSS gradients on door container)
4. Seal click handler (break animation, audio trigger, door animation, localStorage write)
5. Preload coordination (accepts Promise from app.js, waits if needed)
6. Cleanup (remove splash DOM after animation completes)

**Communication**: Promise-based. `init()` returns a Promise that:
- Resolves immediately if returning visitor
- Resolves after door animation completes for first-time visitors

### app.js Integration (~25-30 lines modified)

```
Current flow:
  fetch repo-metrics → initInteractions → initScene → reveal

New flow (first visit):
  splash.isReturningVisitor() → false
  splash.init({ preloadPromise }) → shows splash, returns pending Promise
  [PARALLEL] fetch repo-metrics + initScene (behind splash z-index)
  resolvePreload() → signals scene ready
  [USER CLICKS SEAL] → await preloadPromise → door animation → resolve
  app.js continues → playRevealSequence() (unchanged)

New flow (returning):
  splash.isReturningVisitor() → true
  splash.init() → resolves immediately (zero DOM work)
  [UNCHANGED] existing boot sequence
```

### localStorage Strategy

```
Key:   'oe-splash-dismissed'
Value: JSON { "v": 1, "ts": <unix-ms> }
```

- Version-aware: bump `SPLASH_VERSION` constant to re-show splash after content changes
- All access wrapped in try/catch (private browsing, quota exceeded)
- Written on seal click (before door animation completes)

### Audio Utility (inline in splash.js, ~30 lines)

- `preloadAudio()`: fetch MP3 as ArrayBuffer during splash display (non-blocking), then pre-decode via offline AudioContext so the decoded buffer is ready before user clicks
- `playDoorCreak()`: create AudioContext on user gesture (seal click), play pre-decoded buffer immediately — zero decode latency at playback time
- All errors caught silently — audio failure never blocks the door animation
- **Sync quality gate**: if audio start exceeds 50ms from animation start in production testing, remove audio entirely
- Format: MP3 only (universal browser support in 2026), mono, <60KB
- Disabled if `prefers-reduced-motion` is active (per team consensus: sound without visual context is jarring)

## Visual Design

### Door Image Optimization

| Property | Source | Target |
|----------|--------|--------|
| Format | PNG RGBA | WebP RGBA |
| Dimensions | 1024x1536 | 1024x1536 (keep for 2x DPR) |
| File size | 4.37MB | <150KB (quality 80, alpha 90) |
| Path | `design-assets/chamber-door.png` | `assets/chamber-door.webp` |
| Fallback | — | PNG via `<picture>` element |
| Loading | — | `fetchpriority="high"`, no lazy |

### Chromatic Glow (FR-019 — User Requirement)

The user arrives at the portfolio via a color spectrum. A **chromatic/rainbow glow** must leak from behind the door edges, visible from the moment the splash loads. This bridges the spectrum journey to the cosmic interior.

**Idle state (splash visible)**:
- A subtle animated chromatic gradient leaks around all four edges of the door image
- Implementation: `box-shadow` or `::before` pseudo-element on the door container
- Colors cycle through a spectrum: `hsl(0, 70%, 50%)` → `hsl(60, 70%, 50%)` → `hsl(120, 70%, 50%)` → `hsl(180, 70%, 50%)` → `hsl(240, 70%, 50%)` → `hsl(300, 70%, 50%)` → loop
- Blur radius: 20-40px, opacity 0.15-0.25 (visible but not overwhelming — the door is the focus)
- Animation: `@keyframes chromatic-shift` rotating hue over 8-10 seconds, infinite loop
- The glow appears as light leaking through the gap between the door and its stone frame
- Under `prefers-reduced-motion`: static glow at a single warm hue (no animation)

**Door opening (intensification)**:
- As the door swings open, the chromatic glow intensifies (opacity 0.25 → 0.6, blur 40px → 80px)
- The glow transitions from cycling spectrum to warm brass-gold (`rgba(200, 168, 75, 0.4)`) as the door reaches full open — bridging into the site's brass palette
- A volumetric light wedge expands from the right door edge as the gap widens

### Parchment Text

| Element | Font | Size | Color | Alignment |
|---------|------|------|-------|-----------|
| Heading | Cinzel 600, uppercase | `clamp(18px, 3.5vw, 28px)` | `#3B2A14` (burnt umber) | Center |
| Body | IM Fell English 400 | `clamp(14px, 2.8vw, 18px)` | `#4A3520` (aged ink) | Center |
| Seal instruction | Cinzel 400 | `clamp(12px, 1.8vw, 16px)` | `#5C3A1E` (muted brown) | Center |

- Ink effect: `text-shadow: 0 1px 1px rgba(59, 42, 20, 0.15)`
- Content stored as `SPLASH_CONTENT` object literal at top of `splash.js` (FR-004)
- Safe text area: 25%-80% horizontal, 18%-78% vertical of image bounds

### Wax Seal

**Construction**: Pure CSS `<button>` element with layered radial gradients:
- Primary wax: `radial-gradient(circle at 40% 38%, #C43030 0%, #8B1A1A 35%, #6B1515 65%, #4A0A0A 100%)`
- Raised rim ring: concentric gradient stop pattern
- OE logo: inline SVG from `logo-oe-135.svg`, fill `#4A0A0A` (debossed impression), 55-60% of seal diameter
- Box-shadow: convex wax depth (inner highlight + outer drop shadow)
- Size: `clamp(56px, 6vw, 72px)` — exceeds 44px WCAG minimum at all breakpoints

**Interactive states**:
- Idle: breathing pulse (scale 1.0 → 1.04, 2.5s sine loop) + warm box-shadow pulse
- Hover (desktop): scale 1.08, brass ring glow `rgba(200, 168, 75, 0.25)`
- Active/press: scale 0.95 (press-in)
- Focus-visible: `outline: 3px solid #ffd700; outline-offset: 4px`
- Reduced motion: static, no pulse

**Break animation (3 phases, ~1000ms total)**:
1. Crack formation (0-400ms): 3-4 radial crack lines from center, seal jumps -2px
2. Fragment separation (400-900ms): 4-5 clip-path fragments rotate + scatter outward + fade
3. Clean removal (900-1000ms): fragments removed from DOM

### Door Opening Animation

**Style**: Left-hinge perspective swing (matches visible iron hinges in image)
**Transform origin**: `left center` (0% 50%)
**Perspective**: `1200px` on parent container

| Beat | Time | Action | Easing |
|------|------|--------|--------|
| 1. Resistance | 0-300ms | rotateY 0° → -3° (latch releasing), chromatic glow intensifies | `power2.in` |
| 2. Slow swing | 300-1200ms | rotateY -3° → -35°, chromatic light spill widens, warm wash on door surface | `power2.inOut` |
| 3. Full open | 1200-2000ms | rotateY -35° → -85°, opacity 1→0 (last 400ms), glow transitions to brass-gold | `power3.out` |
| 4. Cleanup | 2000ms | Remove splash DOM, resolve Promise | — |

**Behind the door**: Initially `#0D0B09` (site bg). Chromatic glow visible through widening gap, transitioning to warm brass as the portal opens. The portfolio reveal sequence plays after cleanup.

### Background Behind Transparent Door

- Dark radial gradient: `radial-gradient(ellipse at 50% 50%, #1a1510 0%, #0d0b09 50%, #04050f 100%)`
- Subtle vertical grain (stone suggestion): `repeating-linear-gradient` at very low opacity
- Chromatic glow renders BETWEEN the background and the door image (appears to leak from behind)

## CSS Architecture

### New Custom Properties

```css
--z-splash: 150;
--splash-bg-center: #1a1510;
--splash-bg-edge: #0d0b09;
--splash-text-color: #4A3520;
--splash-text-title: #3B2A14;
--splash-seal-wax: #8B1A1A;
--splash-seal-wax-dark: #4A0A0A;
--splash-seal-logo: rgba(200, 168, 75, 0.6);
--splash-seal-size: clamp(56px, 6vw, 72px);
--splash-glow-opacity: 0.2;
```

### Responsive Strategy

| Viewport | Door Sizing | Image Fit | Seal | Notes |
|----------|-------------|-----------|------|-------|
| Mobile (<768px) | `width: 100%; max-height: 100dvh` | `object-fit: cover` (slight crop of transparent edges) | 56px | Thumb-reach placement at ~70-75% from top |
| Tablet (768-1199px) | `max-height: 90vh; aspect-ratio: 1024/1536` | `object-fit: contain` | 64px | Centered with dark backdrop fill |
| Desktop (1200+) | `max-height: 92vh; max-width: calc(100vh * 0.667)` | `object-fit: contain` | 72px | Centered, dark backdrop flanks |
| Ultrawide (2560+) | Same as desktop | Centered | 80px | Radial gradient IS the letterbox |

### Z-Index Integration

- `--z-splash: 150` — above overlay (100), frame (23), all HUD elements
- Below skip-link (9999) — skip link remains accessible
- `pointer-events: none` on `#app-shell` while splash active
- `body.splash-active { overflow: hidden }` — scroll lock

## HTML Structure

Splash DOM is **created dynamically by JavaScript** (not in static HTML). This eliminates:
- Flash of splash content for returning visitors (bfcache issue)
- Need for `<noscript>` style to hide it — no JS means no splash DOM exists

```html
<div id="splash-gate" class="splash-gate" role="dialog" aria-modal="true"
     aria-label="Welcome to Odd Essentials" aria-describedby="splash-text">
  <div class="splash-gate__backdrop"></div>
  <div class="splash-gate__glow"></div> <!-- chromatic glow layer -->
  <div class="splash-gate__door-container">
    <picture>
      <source srcset="assets/chamber-door.webp" type="image/webp">
      <img src="assets/chamber-door.png" alt="" class="splash-gate__door-img"
           aria-hidden="true" fetchpriority="high" width="1024" height="1536">
    </picture>
    <div id="splash-text" class="splash-gate__parchment-text">
      <h1 class="splash-gate__title"><!-- heading --></h1>
      <p class="splash-gate__body"><!-- body text --></p>
      <p class="splash-gate__instruction"><!-- "Break the seal to enter" --></p>
    </div>
    <button class="splash-gate__seal" aria-label="Enter the portfolio" type="button">
      <svg class="splash-gate__seal-logo" aria-hidden="true"><!-- OE logo --></svg>
    </button>
  </div>
</div>
```

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Dialog semantics | `role="dialog"`, `aria-modal="true"`, `aria-label`, `aria-describedby` |
| Keyboard dismiss | `<button>` element — Enter/Space natively fires click |
| Focus management | Auto-focus seal button on splash load |
| Focus trap | Single interactive element (seal button); Tab/Shift+Tab stays on it |
| Escape key | No-op (splash is a gate, not a dismissible dialog) |
| Screen reader | Dialog label + parchment text + "Enter the portfolio" button label |
| Reduced motion | Instant fade-out (200ms), no door swing, no seal pulse, no audio |
| High contrast | Dark text on light parchment bg, seal maintains contrast |
| No-JS | Splash never created → portfolio shows directly |

## Signal Flow

```
PAGE LOAD ─→ app.js executes
  │
  ├─ isReturningVisitor() ─→ true ─→ splash.init() resolves immediately
  │                                    │
  │                                    └─→ [UNCHANGED existing flow]
  │
  └─ isReturningVisitor() ─→ false
     │
     ├─ splash.init({ preloadPromise }) ─→ creates DOM, shows splash
     │   └─ Returns pending Promise
     │
     ├─ [PARALLEL] fetch repo-metrics.json
     ├─ [PARALLEL] initInteractions()
     ├─ [PARALLEL] initScene() (behind splash z-index: 150)
     │   └─ WebGL context, shaders, procedural textures all init hidden
     │
     ├─ resolvePreload() ─→ signals scene ready
     │
     └─ [USER CLICKS SEAL]
         ├─ setDismissed() ─→ localStorage written
         ├─ await preloadPromise (instant if already resolved)
         ├─ playDoorCreak() (if audio enabled)
         ├─ Seal break animation (1000ms)
         ├─ Door swing animation (2000ms) with chromatic glow intensification
         ├─ Remove splash DOM
         └─ Resolve splash Promise
              │
              └─→ app.js continues ─→ playRevealSequence() (unchanged)
```

## Door Creak Audio Spec

| Property | Value |
|----------|-------|
| Character | Heavy medieval oak door, slow creak, iron hinge groan |
| Duration | 2.0-2.5 seconds (matches door swing + reverb tail) |
| Format | MP3, mono, 96-128kbps |
| Size target | <60KB |
| Volume | 0.35-0.45 (noticeable but not startling) |
| Source | Royalty-free (CC0, freesound.org/pixabay) |
| Path | `assets/door-creak.mp3` |
| Gate | Constitution amended (v1.7.0). **Quality gate**: audio must play within 50ms of animation start — if latency exceeds this in production testing, remove audio entirely. |

## Risk Mitigation (Devil's Advocate Review)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Audio excluded by constitution | BLOCKER | Amendment required. Audio is P3 — feature works without it. Code behind `AUDIO_ENABLED` flag. |
| Splash image blocking first paint (3G) | MEDIUM | Aggressive WebP compression (<150KB). `<link rel="preload">` in `<head>` (dynamic, only for first-time visitors). CSS fallback gradient visible immediately. |
| GPU shader compilation jank during splash | MEDIUM | Scene init runs after splash DOM is stable. CSS animations (seal pulse, chromatic glow) are compositor-friendly (transform/opacity only). |
| Splash = UX anti-pattern (bounce risk) | HIGH | Owner-accepted risk. Mitigated by: immersive theming (not a generic interstitial), localStorage bypass for return visits, fast dismiss (<3s animation). |
| No `<noscript>` fallback | RESOLVED | Splash created by JS — no-JS users never see it. Portfolio renders directly. |
| bfcache flash for returning visitors | RESOLVED | Splash DOM is dynamic, not in static HTML. Returning visitors: zero DOM work. |
| Page weight budget | MEDIUM | Pre-existing overshoot from 008 (sidebar glyphs ~996KB). Splash adds ~210KB ephemeral (first visit only). Steady-state weight unchanged. |
| Procedural-first violation | ACCEPTED | Exception documented. User-provided custom asset. Wax seal is procedural (CSS+SVG). |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| External image (Principle VI) | User-provided door/parchment design cannot be procedural | CSS-only door would not match the photographic quality the owner wants |
| Audio (Principle I) | Immersive door creak deepens the threshold experience | Silence on a door-opening feels incomplete; gated behind amendment approval |

## Project Structure

### Documentation (this feature)

```text
specs/017-parchment-door-splash/
├── spec.md              # Feature specification
├── plan.md              # This file
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (next step)
```

### Source Code Changes

```text
js/
├── splash.js            # NEW — splash gate module (~250-300 lines)
└── app.js               # MODIFY — add splash gate + preload coordination (~25-30 lines)

css/
└── styles.css           # MODIFY — add splash gate section (~80-100 lines)

assets/
├── chamber-door.webp    # NEW — optimized door image (<150KB)
├── chamber-door.png     # NEW — PNG fallback (<350KB)
└── door-creak.mp3       # NEW — audio (gated on amendment, <60KB)
```

**Structure Decision**: Single new JS module (`splash.js`) following the existing flat module pattern. No new directories. CSS added as a new section in the existing `styles.css`. Binary assets in existing `assets/` directory.

## New/Modified Files Summary

| File | Action | Est. Lines | Notes |
|------|--------|-----------|-------|
| `js/splash.js` | NEW | ~250-300 | Splash lifecycle, DOM, animation, audio |
| `js/app.js` | MODIFY | +25-30 | Splash gate + preload coordination |
| `css/styles.css` | MODIFY | +80-100 | Splash section (layout, seal, glow, responsive, a11y) |
| `index.html` | MODIFY | +2-3 | Optional `<link rel="preload">` for door image |
| `assets/chamber-door.webp` | NEW | binary | Optimized door image |
| `assets/chamber-door.png` | NEW | binary | PNG fallback |
| `assets/door-creak.mp3` | NEW | binary | Audio (gated on constitution amendment) |
