# Implementation Plan: Arcane Console POC

**Branch**: `001-arcane-console-poc` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-arcane-console-poc/spec.md`

## Summary

Build a single-page HTML + WebGL portfolio POC featuring a Victorian Techno-Mage steampunk arcane console frame with a central Three.js crystal ball containing a procedural nebula and 7 interactive project star nodes. The page delivers a cinematic reveal sequence, scroll-driven exploration, micro-interactions (hover/click), project detail overlays, and full accessibility support. All code lives in one `index.html` file loaded via CDN (Three.js + GSAP). No build system.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES2020+ modules), GLSL ES 1.0/3.0
**Primary Dependencies**: Three.js 0.162.0 (CDN), GSAP 3.12.5 + ScrollTrigger + TextPlugin + CustomEase (CDN)
**Storage**: N/A (no persistence — hard-coded JSON data inline)
**Testing**: Manual browser testing (Chrome, Firefox, Safari); no automated test framework for POC
**Target Platform**: Desktop browsers (Chrome, Firefox, Safari), minimum 1200px viewport width
**Project Type**: Single-page static website (single HTML file + assets folder)
**Performance Goals**: 60fps on integrated GPU (Intel Iris-class), <7s reveal sequence, <100ms panel open, <800KB page weight (excl. media)
**Constraints**: DPR clamped to 1.5, <30 draw calls, <1MB texture memory, 4 post-processing passes max, no build system, no npm, no backend
**Scale/Scope**: 7 projects, 1 page, 1 HTML file, desktop-only with static mobile fallback

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. POC Scope Discipline | Single index.html + /assets, frozen shader list, 7 hard-coded projects, no audio/responsive/<1200px | PASS |
| II. Performance-First WebGL | DPR 1.5 clamp, <30 draw calls, <1MB textures, GSAP ticker loop, auto-tier degradation, tab-pause | PASS |
| III. Accessibility Non-Negotiable | .sr-only list, prefers-reduced-motion, prefers-contrast, keyboard nav, focus trap, WCAG AA contrast, aria-hidden canvas | PASS |
| IV. Text in HTML Only | All text as HTML overlays, no WebGL text rendering | PASS |
| V. Visual Hierarchy | Accent colors inside orb only, Rule of Thirds ornamentation, frame/universe boundary | PASS |
| VI. Procedural-First | fBm nebula, procedural star glows, CSS-only frame, inline SVG placeholders, 3 fonts max | PASS |
| VII. Graceful Degradation | WebGL2→WebGL1→static fallback, Safari shader detection, Firefox context loss, mobile static | PASS |
| VIII. Asset Readiness | MOV→MP4/WebM DONE, GIF→WebM DONE, Coney Island description DONE, versions pinned, fonts confirmed | PASS |

All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-arcane-console-poc/
├── plan.md              # This file
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (project data schema)
├── quickstart.md        # Phase 1 output (how to run locally)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
index.html               # Single-file POC: all HTML, CSS, JS, GLSL inline
assets/                   # Project media (served)
├── odd-fintech-video.mp4
├── odd-fintech-video.webm
├── odd-ai-reviewers-trailer.webm
├── odd-ai-reviewers-banner.png
├── ado-git-repo-insights-logo.png
├── ado-git-repo-insights-screenshot-01.png
├── ado-git-repo-insights-screenshot-02.png
├── ado-git-repo-insights-screenshot-03.png
├── odd-fintech-logo.png
├── coney-island-logo-1024x690.svg
├── coney-island-restaurant-and-tavern.jpg
├── ollama-review-team-member.png
├── opencode-review-team-member.png
├── pragent-review-team-member.png
├── reviewdog-review-team-member.png
├── semgrep-review-team-member.png
└── oddessentials-review-team-leader.png
design-assets/            # Source assets (not served — originals)
```

**Structure Decision**: Single-file architecture. All HTML structure, CSS custom properties, CSS component styles, JavaScript (Three.js scene, GSAP animations, interaction handlers, project data), and GLSL shaders are inline in `index.html`. The `/assets` folder contains only project-specific media files (images, videos) that cannot be inlined. No `src/`, `tests/`, or build directories — this is a zero-build-step POC.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
