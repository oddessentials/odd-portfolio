# Quickstart: Scroll-Driven Exploration & Remaining Polish

**Feature**: `004-scroll-exploration-polish` | **Date**: 2026-03-04

## Prerequisites

- Git branch `004-scroll-exploration-polish` checked out
- Local HTTP server (e.g., `npx serve .` or VS Code Live Server)
- Chrome DevTools for performance profiling
- No build system — all changes are direct file edits

## Implementation Order

```
1. js/data.js          — Update CONSTELLATION_ZONES (5 min, data-only, no dependencies)
2. index.html          — Add #scroll-driver, move #star-labels (5 min)
3. css/styles.css      — #scroll-driver styles, star-labels fixed, scroll-enabled class (10 min)
4. js/scene.js         — Logo fix, Y-axis scaling, nebula ShaderMaterial, nebulaGroup (45 min)
5. js/animations.js    — ScrollTrigger wiring, zone transitions, skip-scroll (30 min)
6. js/interactions.js  — Static label anchor overrides (5 min)
7. js/performance.js   — Optional scroll-time safety net (10 min)
```

## Verification Checklist

### P1: Logo-Cursor Follow
- [ ] Move cursor into starfield → logo follows, no offset
- [ ] Move cursor out of browser window → logo returns to header band
- [ ] Move cursor back in → logo re-engages at cursor position
- [ ] Resize browser while logo follows → logo returns to (new) home position
- [ ] Resize browser, then enter starfield → logo engages correctly
- [ ] Rapidly enter/exit 10 times → zero stuck states

### P1: Scroll-Driven Exploration
- [ ] After reveal completes, page becomes scrollable
- [ ] Scroll down → nebula shifts blue-violet → warm-gold → green-teal
- [ ] Stars in active zone brighten (1.3x scale), others return to default
- [ ] Status panel text updates per zone
- [ ] Scroll back up → all states revert cleanly
- [ ] Total scroll distance is exactly 300px
- [ ] Skip-scroll button appears, fades after 3 seconds

### P2: Star Label Clipping
- [ ] Hover odd-fintech (leftmost) → label fully visible, not clipped by sidebar
- [ ] Hover repo-standards (rightmost) → label fully visible
- [ ] Click sidebar buttons → still clickable (pointer-events pass through)

### P2: Y-Axis Star Scaling
- [ ] Resize to 390x844 → all 7 stars visible, vertically distributed
- [ ] Resize from 1920x1080 to 400x800 → smooth repositioning
- [ ] Check minimum star separation maintained

### P3: Professional Language
- [ ] Scroll through zones → status text shows "Browsing developer tools...", "Viewing data & analytics...", "Exploring web & client projects..."
- [ ] No fantasy text visible anywhere during scroll

### Accessibility
- [ ] `prefers-reduced-motion: reduce` → instant color changes, no rotation, no star scaling
- [ ] Keyboard navigation works regardless of scroll position
- [ ] Screen reader: scroll-spacer is not announced, project list accessible

### Performance
- [ ] DevTools Performance: all frames <16.67ms during scroll
- [ ] DevTools Layers: ≤12 compositing layers
- [ ] No visible frame drops during continuous scrolling
