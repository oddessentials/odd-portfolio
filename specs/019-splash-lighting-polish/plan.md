# Implementation Plan: Splash Lighting Polish

**Branch**: `019-splash-lighting-polish` | **Date**: 2026-03-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-splash-lighting-polish/spec.md`

## Summary

Enhance the existing splash gate scene's lighting, shadowing, and atmospheric depth using CSS-only and GSAP animation parameter changes. No new image assets, no DOM structure changes. The goal is to transform the scene from "well-composed layout" to "immersive candlelit chamber portal" through: correcting color temperature hierarchy (warm-dominant glow), adding ambient occlusion shadows, atmospheric perspective on depth layers, physically correct backdrop lighting, rim lighting, scene vignette, subtle breathing animations, and edge softening.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, CSS3, HTML5
**Primary Dependencies**: GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned)
**Storage**: localStorage (splash dismissal flag only — existing, unchanged)
**Testing**: Manual cross-browser (Chrome, Firefox, Safari, mobile Safari)
**Target Platform**: Desktop primary (1200px+), mobile/tablet graceful degradation
**Project Type**: Static single-page portfolio (no build system, no backend)
**Performance Goals**: 60fps desktop, <30 draw calls steady state, <1MB texture memory
**Constraints**: No new image assets, no new JS dependencies, no DOM structure changes, zero UX regressions
**Scale/Scope**: Single splash gate module (js/splash.js ~312 lines, css/styles.css splash section ~280 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope | PASS | Visual polish for existing splash gate. No new features beyond spec. All changes enhance the existing "wow factor" gate. No new scope. |
| II. Performance-First | PASS | CSS filters on static images are composited once (cached). No new draw calls. No new textures. box-shadow animation during 800ms door swing is bounded. Research R-001 confirms acceptable GPU cost. |
| III. Accessibility | PASS | FR-020: all new animations suppressed under reduced-motion. FR-021: zero regression on focus trap, keyboard nav, screen reader labels. No text changes. |
| IV. Text in HTML | PASS | No text changes whatsoever. |
| V. Visual Hierarchy | PASS | All changes within splash gate scene. No contamination with portfolio frame or orb interior. |
| VI. Procedural-First | PASS | All improvements are CSS gradients, shadows, filters, blend modes, keyframe animations. Zero new image assets. |
| VII. Graceful Degradation | PASS | If CSS filters/mask-image unsupported, fallback is current unfiltered appearance. No functionality loss. |
| VIII. Asset Readiness | PASS | No new assets required. All changes are CSS/JS parameter modifications. |

**Gate result**: ALL PASS — proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/019-splash-lighting-polish/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── quickstart.md        # Implementation guide & testing checklist
└── checklists/
    └── requirements.md  # Spec quality validation
```

### Source Code (files modified)

```text
css/styles.css           # MODIFY: splash-gate section (~280 lines) — gradients, shadows, filters, keyframes, hover, vignette
js/splash.js             # MODIFY: playDoorOpen() animation parameters (~20 lines changed)
```

**Structure Decision**: No new files or directories. All changes are modifications to the existing splash gate module (2 source files). CSS changes are confined to the splash-gate section of styles.css. JS changes are confined to the playDoorOpen() function in splash.js.

## Complexity Tracking

No constitution violations to justify. All gates pass.

## Implementation Phases

### Phase 1: Color Temperature Fix (P1 — FR-001, FR-002, FR-003)

Highest visual impact. Foundation for all other lighting improvements.

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 1a | css/styles.css | Restructure `.splash-gate__inner-glow` gradient: warm amber center (0.50 opacity), darker amber at 25%, faint cool accent at 55%, transparent at 75% | ~4 |
| 1b | css/styles.css | Restructure `.splash-gate__glow` box-shadow: warm brass innermost (0.3), amber mid (0.2), faint cool outermost (0.15) | ~4 |
| 1c | css/styles.css | Replace `chromatic-shift` keyframes: constrain to 0→18deg→-12deg→0deg oscillation (warm range only) | ~6 |
| 1d | — | Visual validation: glow reads as candlelit chamber | Test |

### Phase 2: Ambient Occlusion & Shadows (P1 — FR-004, FR-005, FR-006)

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 2a | css/styles.css | Add `filter: drop-shadow(2px 4px 8px rgba(0,0,0,0.5))` on `.splash-gate__archway` | +1 |
| 2b | css/styles.css | Add inset box-shadow on `.splash-gate__door-container` (recess shadow + threshold contact shadow) | +3 |
| 2c | css/styles.css | Add inset box-shadow on `.splash-gate__scene` (archway-meets-wall depth vignette) | +3 |
| 2d | — | Visual validation: archway projects forward, door recessed, base grounded | Test |

### Phase 3: Atmospheric Perspective (P1 — FR-007, FR-008)

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 3a | css/styles.css | Add `filter: blur(1.5px) saturate(0.7) brightness(0.55)` on `.splash-gate__desk-img` | +1 |
| 3b | css/styles.css | Add `filter: brightness(0.88) saturate(0.9)` on `.splash-gate__door-img` | +1 |
| 3c | — | Visual validation: desk looks deep/dim, door matches ambient stone light | Test |

### Phase 4: Backdrop Lighting & Vignette (P2 — FR-009, FR-010, FR-014)

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 4a | css/styles.css | Invert `.splash-gate__backdrop` radial gradient: lighter center (0.4), darker edges (0.9) | ~4 |
| 4b | css/styles.css | Add warm light-spill `::after` pseudo-element on `.splash-gate__backdrop` | +8 |
| 4c | css/styles.css | Add scene vignette `::after` pseudo-element on `.splash-gate__scene` | +8 |
| 4d | — | Visual validation: stone visible near center, dark at edges, no tile seams at 3840px | Test |

### Phase 5: Rim Lighting & Door Open Fix (P2 — FR-011, FR-012, FR-013, FR-019)

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 5a | css/styles.css | Add warm rim-light box-shadow on `.splash-gate__door-container` (top, left, right edges) | +3 |
| 5b | js/splash.js | Beat 1: change glow opacity from 0.55→0.35 to 0.55→0.58 (hold/slight increase) | ~1 |
| 5c | js/splash.js | Beat 3: animate boxShadow colors to warm brass palette in concert with backgroundColor | +5 |
| 5d | js/splash.js | Add rim light intensification tween during Beat 2-3 on door container | +4 |
| 5e | js/splash.js | Add gradual blur ramp: 4px→12px (Beat 2) then 12px→20px (Beat 3) | ~2 |
| 5f | — | Visual validation: door open feels physically correct, glow never dips | Test |

### Phase 6: Scene Atmosphere & Life (P3 — FR-015, FR-016, FR-017, FR-020)

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 6a | css/styles.css | Add `@keyframes torch-flicker` with multi-stop opacity oscillation | +8 |
| 6b | css/styles.css | Apply torch-flicker to `.splash-gate__glow` (3.7s) and `.splash-gate__inner-glow` (5.3s) as secondary animation | ~2 |
| 6c | css/styles.css | Add `@keyframes splash-entrance` (opacity 0→1 over 700ms) on `.splash-gate` | +6 |
| 6d | css/styles.css | Add door hover state: `filter: brightness(1.08)` with 0.3s transition, gated to fine-pointer | +5 |
| 6e | css/styles.css | Add reduced-motion suppression: `animation: none` on all animated splash elements | +4 |
| 6f | — | Visual validation: torch flicker perceptible, entrance fades, hover responds, reduced-motion suppressed | Test |

### Phase 7: Edge Softening (P3 — FR-018)

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 7a | css/styles.css | Add `-webkit-mask-image` / `mask-image` on `.splash-gate__archway-img` for edge feathering | +4 |
| 7b | css/styles.css | Change scene edge-fade from fixed 100px to responsive 8% | ~2 |
| 7c | css/styles.css | Add warm unifying color wash `::before` pseudo-element with `mix-blend-mode: overlay` on `.splash-gate__scene` | +8 |
| 7d | — | Visual validation: no hard pixel boundaries, smooth transitions | Test |

### Net Impact

- **css/styles.css**: ~+75 lines (new rules, pseudo-elements, keyframes, media queries)
- **js/splash.js**: ~+12 lines (animation parameter changes, new beat tweens)
- **Assets**: Zero changes
- **Payload**: Zero additional — CSS text only
- **Performance**: Compositing cost of CSS filters (static, cached) + 800ms box-shadow animation during door swing. Within 60fps budget per R-001.
