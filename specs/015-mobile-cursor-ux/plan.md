# Implementation Plan: 015 Mobile & Cursor UX Fixes

**Branch**: `015-mobile-cursor-ux` | **Date**: 2026-03-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-mobile-cursor-ux/spec.md`

## Summary

Three GitHub issues (#10, #11, #14) addressing mobile touch UX and desktop cursor polish. Core changes: (1) Restructure project modal with sticky header and iOS-safe scroll locking so users are never trapped, (2) Add touch-distance guard to prevent accidental star-click during scroll on coarse-pointer devices, (3) Replace logo snap-back with fade out/in and stabilize rotation on desktop. Two new focused modules extracted to maintain constitution line limits.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3
**Primary Dependencies**: Three.js 0.162.0 (CDN, pinned), GSAP 3.12.5 + ScrollTrigger (CDN, pinned)
**Storage**: N/A (no backend, no persistence)
**Testing**: Manual browser testing + DevTools device emulation; real iOS device for scroll-lock validation
**Target Platform**: Desktop browsers (Chrome/Firefox/Safari latest) + mobile (iOS Safari 15+, Chrome Android)
**Project Type**: Single-page static web application
**Performance Goals**: 60fps desktop, 60fps mobile scroll with touch-guard active
**Constraints**: <400 lines per JS module (constitution), no npm, no build system, no additional libraries
**Scale/Scope**: 18 JS modules (16 existing + 2 new), ~5,400 total lines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. POC Scope | No new shader effects, no new data fields | PASS | Interaction + CSS only |
| II. Performance-First | 60fps maintained, no new draw calls | PASS | Touch guard is event logic, no render impact |
| II. Performance-First | DPR clamped 1.5 | PASS | Unchanged |
| II. Performance-First | Draw calls <30 steady state | PASS | No new objects rendered |
| III. Accessibility | Focus trap, keyboard nav, WCAG AA | PASS | Modal restructure preserves existing focus trap; 44px tap targets maintained |
| III. Accessibility | prefers-reduced-motion | PASS | All new animations (logo fade, swipe dismiss) respect reduced-motion |
| III. Accessibility | Focus indicators visible | PASS | Close button focus styling preserved |
| IV. Text in HTML | No text in WebGL | PASS | All changes are DOM/CSS |
| V. Visual Hierarchy | Frame vs universe boundary | PASS | No visual boundary changes |
| VI. Procedural-First | No new external assets | PASS | No new images, fonts, or textures |
| VII. Graceful Degradation | Works without WebGL | PASS | Modal/touch changes are DOM-level |
| VIII. Asset Readiness | No blocked assets | PASS | No new assets required |
| Tech Stack | No additional libraries | PASS | Pure JS/CSS implementation |
| Module Limit | <400 lines per module | PASS | Extraction to touch-guard.js and panel-swipe.js keeps all modules within limit |

**Post-Phase-1 Re-check**: All gates remain PASS. Two new modules (touch-guard.js ~30 lines, panel-swipe.js ~35 lines) well within limits. Existing modules stay within tolerable range via extraction.

## Project Structure

### Documentation (this feature)

```text
specs/015-mobile-cursor-ux/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output — 10 research decisions
├── data-model.md        # Phase 1 output — state objects
├── quickstart.md        # Phase 1 output — dev setup + test checklist
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (next step)
```

### Source Code (repository root)

```text
js/
├── logo-follow.js       # EDIT: fade out/in, rotation threshold, reticle debounce
├── scene.js             # EDIT: init touch-guard, minor wiring
├── panel.js             # EDIT: iOS scroll lock, header ref, init swipe
├── pointer-utils.js     # EDIT: add isCoarsePointer(), change listener
├── touch-guard.js       # NEW: touch tap vs scroll disambiguation (~30 lines)
├── panel-swipe.js       # NEW: swipe-to-dismiss gesture (~35 lines)
├── interactions.js      # UNCHANGED (already correct pointer detection)
├── scroll-zones.js      # UNCHANGED (viewport width checks stay for layout)
├── reticle.js           # UNCHANGED (viewport width check stays for layout)
└── [12 other modules]   # UNCHANGED

css/
└── styles.css           # EDIT: modal grid layout, sticky header, safe-area, touch-action

index.html               # EDIT: add .overlay__header wrapper in modal
```

**Structure Decision**: No new directories. Two small focused modules extracted from existing oversized files to maintain constitution compliance. All changes within existing file tree.

## Implementation Phases

### Phase A: Pointer Detection Foundation (FR-001)

**Files**: `js/pointer-utils.js`

1. Add `isCoarsePointer()` export — `window.matchMedia('(pointer: coarse)').matches`
2. Export `coarsePointerMQL` for change listeners
3. Existing `isFinePointer()` and `pointerMQL` unchanged

**Line impact**: 4 → ~8 lines (well within limits)

### Phase B: Modal Restructure — Sticky Header (FR-002, FR-005, FR-006, FR-020)

**Files**: `index.html`, `css/styles.css`, `js/panel.js`

1. **HTML**: Wrap close button in `<div class="overlay__header">` inside `.overlay__frame`
2. **CSS**: Change `.overlay__frame` to `display: grid; grid-template-rows: auto 1fr`. Move `overflow-y: auto` from frame to `.overlay__content`. Add `safe-area-inset` padding for notched devices. Add `100dvh` with `100vh` fallback.
3. **JS (panel.js)**: Replace `document.body.style.overflow = 'hidden'` with `position: fixed` + scrollTop save/restore pattern. Acquire `.overlay__header` DOM ref.

**Line impact**: panel.js 418 → ~408 (scroll lock code replaces, doesn't add). styles.css +25 lines.

### Phase C: Backdrop & Swipe Dismiss (FR-003, FR-004)

**Files**: `js/panel-swipe.js` (new), `js/panel.js`

1. **panel-swipe.js** (new, ~35 lines): Export `initSwipeGesture(headerEl, contentEl, dismissFn)`. Track touchstart on header, check touchmove delta > 80px downward, listen for scroll events on content to cancel swipe, fire dismiss on qualified touchend.
2. **panel.js**: Import and call `initSwipeGesture()` with header ref and `closeProjectPanel`. Backdrop click handler already exists (panel.js:409) and already only fires on backdrop target — no changes needed (research R-009 confirmed).

**Line impact**: panel.js +3 lines (import + init call). New module ~35 lines.

### Phase D: Touch Tap Disambiguation (FR-007, FR-008, FR-009, FR-010)

**Files**: `js/touch-guard.js` (new), `js/scene.js`, `css/styles.css`

1. **touch-guard.js** (new, ~30 lines): Export `initTouchGuard(hitzone, onValidTap)`. Track touchstart coords/time, cancel on vertical-dominant touchmove, validate on touchend (distance < 10 CSS px, duration < 300ms, not long-press > 500ms). Call `onValidTap(mouse)` only for valid taps.
2. **scene.js**: Import touch-guard. Replace inline touchstart/touchend handlers (lines 168-190) with touch-guard init call, passing raycasting callback. Guard activation gated by `isCoarsePointer()`.
3. **CSS**: Add `touch-action: pan-y` to `#orb-hitzone`.

**Line impact**: scene.js ~433 → ~420 (inline handlers replaced by init call). New module ~30 lines.

### Phase E: Logo Fade & Rotation Stabilization (FR-011–FR-017)

**Files**: `js/logo-follow.js`

1. **Fade out**: Replace `logoReturnHome(gsap)` calls in `onMouseLeave()`, `onDocMouseLeave()`, and `reticle-activate` listener with opacity fade to 0 (stored tween reference pattern). No positional animation. No rotation reset.
2. **Fade in**: On `onMouseEnter()` / `engageLogo()`, fade opacity to 1. Cancel any in-progress fade-out first.
3. **Reticle debounce**: Replace direct `reticle-activate`/`reticle-deactivate` handlers with `gsap.delayedCall(0.08, ...)` + `.revert()` cancellation pattern.
4. **Rotation threshold**: Increase `minDelta` from 2 to a higher value (e.g., 5-8 CSS pixels) to prevent tremor-induced jitter.
5. **Reduced-motion**: Check `prefers-reduced-motion` before any opacity animation — use instant `style.opacity` set instead.
6. **Animation non-stacking (FR-016)**: Store `logoOpacityTween` reference. Kill before starting new fade. Quick enter/exit cycles produce deterministic opacity states.
7. **`logoReturnHome()` removal**: Function body replaced with fade-out logic. Position/rotation return animation eliminated entirely.

**Line impact**: logo-follow.js 259 → ~295 lines (well within 400 limit).

### Phase F: Integration Testing

Manual testing across devices per quickstart.md checklist:
- iOS Safari (iPhone SE, iPhone 12+): scroll lock, safe-area, touch guard
- Chrome Android (Pixel): touch guard, modal layout
- Desktop Chrome/Firefox/Safari: logo fade, rotation, keyboard nav
- `prefers-reduced-motion`: all animations instant
- Hybrid device (Surface Pro if available): pointer capability switching

## Implementation Order & Dependencies

```
Phase A (pointer-utils) ──┐
                          ├── Phase B (modal restructure) ── Phase C (swipe dismiss)
                          │
                          └── Phase D (touch guard)

Phase E (logo fade) ── independent, no dependency on A-D

Phase F (integration testing) ── after all phases complete
```

**Recommended sequence**: A → B → C → D → E → F
- A is foundation (tiny, unblocks B and D)
- B is highest priority (P1 modal escape)
- C depends on B (needs header element)
- D is second priority (P2 touch guard)
- E is independent (P3 logo polish, can run in parallel with B-D)
- F is final validation

## Complexity Tracking

No constitution violations requiring justification. All modules stay within 400-line limit via extraction strategy.
