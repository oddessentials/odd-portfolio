# Implementation Plan: Sacred Meander Band

**Branch**: `007-sacred-meander-band` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-sacred-meander-band/spec.md`

## Summary

Redesign the top border Greek Key meander band to fix 5 visual/performance flaws: disproportionate height (24px on an 18px rail), flat gradient lighting (all vertical), performance-hostile shimmer (mix-blend-mode: screen defeating compositor), ragged tile endpoints, and decorative disconnect. All changes are CSS-only in `css/styles.css`. No new HTML elements, no JavaScript changes. The meander is reframed as sacred geometry under the New Age Renaissance narrative.

## Technical Context

**Language/Version**: CSS3 custom properties, HTML5 (no JS changes)
**Primary Dependencies**: GSAP 3.12.5 (existing reveal animation targets `.frame__greek-key` by class — selectors unchanged)
**Storage**: N/A
**Testing**: Manual visual inspection per quickstart.md (no automated tests — CSS-only visual feature)
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), tablet (768px–1199px), mobile hidden
**Project Type**: Single-page portfolio (static HTML + WebGL + CSS)
**Performance Goals**: 60fps shimmer animation on integrated GPU; zero paint events during shimmer
**Constraints**: No external images (procedural-first), no new DOM elements (FR-010), no blend modes on animated elements
**Scale/Scope**: 1 CSS file modified (~90 lines of Greek Key rules), 0 JS files changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. POC Scope Discipline | PASS | CSS-only change to existing element, no new features or scope expansion |
| II. Performance-First WebGL | PASS | Zero WebGL impact. Shimmer optimization reduces CPU load (removes mix-blend-mode). FR-003 constrains to compositor-safe properties only |
| III. Accessibility Non-Negotiable | PASS | Band is decorative (`aria-hidden` on `.frame`), respects `prefers-contrast: more` (FR-008), reduced-motion disables shimmer (FR-007) |
| IV. Text in HTML | PASS | No text involved — purely decorative pattern |
| V. Visual Hierarchy | PASS | Frame ornamentation stays on frame. No cross-boundary contamination |
| VI. Procedural-First | PASS | SVG data-URI tile is procedural/inline. No external images (FR-009) |
| VII. Graceful Degradation | PASS | Band hidden on mobile, scales on tablet, CSS-only — no JS dependency for rendering |
| VIII. Asset Readiness | PASS | No external assets required — all procedural |

**Gate result: PASS** — zero violations, no complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-sacred-meander-band/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical research decisions
├── quickstart.md        # Manual testing scenarios
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
css/
└── styles.css           # Lines 549-636: Greek Key meander band rules
                         # Lines 1306-1313: Tablet breakpoint overrides
                         # Lines 1354-1356: Mobile breakpoint (display: none)
js/                      # NO CHANGES — read-only verification
├── animations.js        # Line 31: reveal targets .frame__greek-key (opacity)
├── app.js               # Line 35: reduced-motion targets .frame__greek-key (opacity)
└── performance.js       # Lines 172, 217: tier 2/3 shimmer degradation
```

**Structure Decision**: Single file modification (`css/styles.css`). All Greek Key rules are in one contiguous block (lines 549-636) with two responsive overrides. No file additions, no directory changes.

## Integration Surface

The Greek Key band has **7 JS touch points** that must not regress (all read-only verification — no JS changes):

| Integration | File | Line | Mechanism | What it does |
|-------------|------|------|-----------|-------------|
| Reveal initial state | animations.js | 50 | `gsap.set(runeBand, { opacity: 0 })` | Hides band before reveal |
| Reveal fade-in (desktop) | animations.js | 179 | `gsap.to(runeBand, { opacity: 0.7 })` | Fades band in at t=1.0s |
| Reveal instant (mobile) | animations.js | 88 | `gsap.set(runeBand, { opacity: 0.7 })` | Shows band instantly |
| Reduced-motion | app.js | 48 | `gsap.set(runeBand, { opacity: 0.9 })` | Shows band at near-full opacity |
| Tier 2 degradation | performance.js | 172 | `setProperty('--shimmer-duration', '8s')` | Slows shimmer |
| Tier 3 degradation | performance.js | 217 | `classList.add('shimmer-disabled')` | Disables shimmer |
| CSS mobile | styles.css | 1354 | `display: none` | Hides band entirely |

**Key insight**: All JS integration uses opacity, CSS custom properties, or class toggles. None touches the SVG tile, gradient definitions, or layout properties. This means the CSS redesign (tile, gradients, height, masks) is completely independent of JS integration — zero regression risk as long as the class name `.frame__greek-key` and the custom property `--shimmer-duration` are preserved.
