# Implementation Plan: Alpha — Full-Bleed Starfield & Responsive

**Branch**: `002-alpha-fullbleed-responsive` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)

## Summary

Transform the POC crystal ball into a full-bleed starfield filling the viewport, replace the static header logo with a custom cursor, and make the entire experience responsive down to 320px with touch support. Modifies the existing codebase — no new files needed.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020+ modules, GLSL ES 1.0/3.0
**Primary Dependencies**: Three.js 0.162.0, GSAP 3.12.5 + plugins (unchanged)
**Target Platform**: All devices — desktop, tablet, mobile (320px–unlimited)
**Performance Goals**: 60fps desktop (1500 particles, DPR 1.5), 60fps mobile (400 particles, DPR 1.0, no post-processing)
**Constraints**: 3 breakpoints (<768px, 768-1199px, 1200px+), no new dependencies

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Scope | PASS | Owner-approved Alpha evolution |
| II. Performance | PASS | Mobile budget: 400 particles, DPR 1.0, no post-processing |
| III. Accessibility | PASS | Maintained + hamburger menu a11y |
| IV-VIII | PASS | Unchanged or improved |

## Project Structure

### Files Modified (no new files)

```text
index.html           # Remove logo from header, add hamburger btn, remove narrow-msg, viewport meta
css/styles.css       # Responsive breakpoints, hamburger, full-bleed canvas, logo cursor, mobile overlay
js/scene.js          # Remove orb geometry, viewport-distributed stars/nebula, touch events, mobile particles
js/animations.js     # Full-viewport reveal (no orb ignition), mobile-adapted sequence
js/interactions.js   # Touch support, hamburger menu, mobile panel layout
js/performance.js    # Mobile detection, disable post-processing on mobile, DPR 1.0
js/app.js            # Mobile detection flag
js/data.js           # Star positions for viewport distribution
```

## Key Technical Decisions

1. **Full-bleed approach**: Remove OrbGroup sphere meshes (glass, rim, inner glow). Keep star sprites and nebula particles but distribute across viewport frustum instead of spherical radius. Camera sees the full scene without orb containment.

2. **Logo cursor**: Generate a 32x32 PNG/cur from logo.svg at build-free time (or use CSS `cursor: url('assets/logo-cursor.png') 16 16, auto`). SVG cursors have inconsistent browser support — a pre-rendered PNG is more reliable.

3. **Responsive layout**: CSS Grid with media queries. Desktop: 3-column (sidebar | starfield | sidebar). Tablet: narrower sidebars. Mobile: single column (starfield only) + hamburger overlay. CSS `clamp()` for fluid transitions.

4. **Touch raycasting**: Map `touchstart` to the same normalized coordinate system as `mousemove`/`click`. Use first touch point. No hover state on touch — tap directly triggers click behavior.

5. **Mobile performance**: Detect via `window.innerWidth < 768` at init. Set `isMobile` flag. Reduce nebula to 400 particles, clamp DPR to 1.0, skip EffectComposer entirely, boost nebula saturation 20%.
