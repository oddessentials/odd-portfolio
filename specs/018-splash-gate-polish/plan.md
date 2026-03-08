# Implementation Plan: Splash Gate Polish

**Branch**: `018-splash-gate-polish` | **Date**: 2026-03-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/018-splash-gate-polish/spec.md`

## Summary

Enhance the existing splash gate with four changes: replace the door image (proven asset-swap pattern), remove the wizard signature from the parchment, add a wizard desk image behind the door visible during the swing animation, and add a quill cursor on the door area for fine-pointer devices. All changes maintain existing animations, accessibility, and mobile behavior.

## Technical Context

**Language/Version**: JavaScript ES2020+ modules, HTML5, CSS3
**Primary Dependencies**: GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN, pinned), Three.js 0.162.0 (CDN, pinned)
**Storage**: localStorage (splash dismissal flag only — existing, unchanged)
**Testing**: Manual cross-browser (Chrome, Firefox, Safari, mobile Safari)
**Target Platform**: Desktop primary (1200px+), mobile/tablet graceful degradation
**Project Type**: Static single-page portfolio (no build system, no backend)
**Performance Goals**: 60fps desktop, <30 draw calls steady state, <1MB texture memory
**Constraints**: <150KB additional image payload (desktop, excluding desk on mobile), no new JS dependencies, no build tools
**Scale/Scope**: Single splash gate module (js/splash.js ~310 lines, css/styles.css splash section ~200 lines)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope | PASS | Visual polish for existing splash gate. No new features beyond spec. Door swap, signature removal, desk reveal, and cursor all serve the "wow factor" gate. Audio approved in 017 amendment. |
| II. Performance-First | PASS | Net payload: +~380KB desktop WebP (door ~300KB + desk ~100KB - signature 43KB + cursor 3KB). Desk hidden on mobile. Draw calls unchanged (desk is a static image, not a Three.js object). |
| III. Accessibility | PASS | Focus trap preserved. Quill cursor gated to fine-pointer only. Keyboard activation unchanged. Reduced-motion behavior unchanged. `aria-modal` dialog intact. |
| IV. Text in HTML | PASS | No text changes. Parchment text remains HTML positioned over door image. |
| V. Visual Hierarchy | PASS | Desk is behind the door (deepest layer in scene). Quill cursor is a subtle enhancement, not competing with the portal visual. |
| VI. Procedural-First | NOTED | Adding 3 image assets (desk, door, cursor) — justified as project-specific media, not decorative chrome. Signature removal offsets partially. |
| VII. Graceful Degradation | PASS | Desk: hidden on mobile, inner glow fallback on load failure. Cursor: pointer fallback. Door: existing fallback CSS preserved. |
| VIII. Asset Readiness | PASS | All source assets exist in `design-assets/`: `door-and-parchment-3.png`, `odd-wizard-desk.png`, `odd-wizard-quill.png`. |

**Gate result**: ALL PASS — proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/018-splash-gate-polish/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Asset inventory and modifications
├── quickstart.md        # Implementation guide
└── checklists/
    └── requirements.md  # Spec quality validation
```

### Source Code (files modified)

```text
js/splash.js             # MODIFY: remove signature DOM, add desk image, gate desk on mobile
css/styles.css           # MODIFY: remove .splash-gate__signature, add desk styling, add quill cursor
assets/
├── chamber-door.png     # REPLACE: new door at 768x1152
├── chamber-door.webp    # REPLACE: regenerated WebP
├── wizard-desk.png      # ADD: optimized 768x512
├── wizard-desk.webp     # ADD: WebP variant
├── quill-cursor.png     # ADD: 48x48 cursor image
├── odd-wizard-signature.png   # DELETE: orphaned
└── odd-wizard-signature.webp  # DELETE: orphaned
```

**Structure Decision**: No new files or directories beyond assets. All changes are modifications to the existing splash gate module (2 source files + asset folder).

## Complexity Tracking

No constitution violations to justify. All gates pass.

## Implementation Phases

### Phase 1: Door Replacement & Signature Removal (P1)

Low-risk, proven pattern. Do first to establish the visual baseline.

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 1a | assets/chamber-door.png | Resize door-and-parchment-3.png to 768x1152, overwrite | Asset |
| 1b | assets/chamber-door.webp | Regenerate WebP at quality 80 | Asset |
| 1c | js/splash.js | Remove sigPic/sigSrc/sigImg DOM creation (~7 lines) | -7 |
| 1d | js/splash.js | Remove signature from textBlock.append() call | ~1 |
| 1e | css/styles.css | Remove .splash-gate__signature rule (~6 lines) | -6 |
| 1f | assets/odd-wizard-signature.* | Delete both files | Asset |
| 1g | — | Visual validation: parchment text alignment at all breakpoints | Test |

### Phase 2: Wizard Desk Reveal (P2)

New feature. Desk image behind door, visible during swing animation.

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 2a | assets/wizard-desk.png | Resize odd-wizard-desk.png to 768x512, optimize | Asset |
| 2b | assets/wizard-desk.webp | Generate WebP at quality 75 | Asset |
| 2c | js/splash.js | Add desk <picture> element to scene (before innerGlow in DOM) | +15 |
| 2d | js/splash.js | Gate desk insertion: skip when window.innerWidth < 768 | +3 |
| 2e | css/styles.css | Add .splash-gate__desk styling (absolute, inset, cover, pointer-events:none) | +8 |
| 2f | — | Visual validation: desk visible during door swing, hidden on mobile | Test |

### Phase 3: Quill Cursor (P3)

CSS-only change, gated to fine-pointer devices.

| Step | File | Action | Est. Lines |
|------|------|--------|------------|
| 3a | assets/quill-cursor.png | Generate 48x48 PNG from source quill | Asset |
| 3b | css/styles.css | Add @media (hover:hover) and (pointer:fine) cursor rule on .splash-gate__door-container | +5 |
| 3c | — | Visual validation: cursor on desktop, no cursor on touch | Test |

### Net Impact

- **js/splash.js**: ~+11 lines (remove 8, add 18)
- **css/styles.css**: ~+7 lines (remove 6, add 13)
- **Assets**: +3 files (desk PNG/WebP, cursor PNG), -2 files (signature PNG/WebP), 2 replaced (door PNG/WebP)
- **Payload**: ~+340KB desktop WebP, ~+260KB mobile WebP (no desk)
