# Quickstart: 015 Mobile & Cursor UX Fixes

**Branch**: `015-mobile-cursor-ux`

## Prerequisites

- Modern browser (Chrome 90+, Firefox 90+, Safari 15+)
- No build system needed (static files)
- Mobile device or browser DevTools device emulation for touch testing
- Real iOS device recommended for scroll-lock and safe-area testing

## Setup

```bash
git checkout 015-mobile-cursor-ux
# Open index.html in browser (or use any static file server)
python -m http.server 8000  # or: npx serve .
```

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `js/logo-follow.js` | Edit | Fade out/in instead of snap-back; rotation threshold; reticle debounce |
| `js/scene.js` | Edit | Init touch-guard; minor cleanup |
| `js/panel.js` | Edit | iOS scroll lock; init swipe handler; header ref |
| `js/pointer-utils.js` | Edit | Add `isCoarsePointer()` + change listener |
| `css/styles.css` | Edit | Modal grid layout; sticky header; safe-area; touch-action |
| `index.html` | Edit | Add `.overlay__header` wrapper in modal |

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `js/touch-guard.js` | ~30 | Touch tap vs scroll disambiguation for star field |
| `js/panel-swipe.js` | ~35 | Swipe-to-dismiss gesture for modal header |

## Testing Checklist

### P1: Modal Escape (coarse-pointer devices)
- [ ] Open modal on phone — close button always visible when scrolling content
- [ ] Tap backdrop — modal closes
- [ ] Swipe down from header — modal dismisses
- [ ] Rotate device with modal open — layout reflows, close button accessible
- [ ] iOS Safari: no rubber-band bounce behind modal
- [ ] Notched device: content respects safe-area insets

### P2: Touch Tap Disambiguation
- [ ] Scroll through star field on phone — no accidental modal opens
- [ ] Deliberately tap a star — modal opens
- [ ] Long-press a star (>500ms) — no modal opens
- [ ] Fast flick scroll over stars — no modal opens
- [ ] Desktop mouse click — behavior unchanged

### P3: Logo Fade & Rotation
- [ ] Mouse enters star field — logo follows cursor
- [ ] Mouse leaves star field — logo fades out at position (no snap-back)
- [ ] Mouse re-enters — logo fades in at cursor
- [ ] Move cursor slowly — no rotation jitter
- [ ] Glide cursor along constellation lines — no spinning/glitching
- [ ] Hover a star — logo fades out smoothly (debounced)
- [ ] Leave star — logo fades back in
- [ ] Rapid enter/exit hitzone — no opacity inconsistency
- [ ] Page load — logo visible in header band
- [ ] Keyboard-only navigation — logo stays in header band
- [ ] `prefers-reduced-motion` — all fades instant

## Architecture Notes

- Touch guard uses `pointer: coarse` media query, not viewport width
- `touch-action: pan-y` on `#orb-hitzone` allows browser scroll handling
- Modal uses `position: fixed` on body for iOS scroll lock (saves/restores scrollTop)
- GSAP `delayedCall` for reticle debounce (integrates with ticker, respects tab visibility)
- No new external dependencies (constitution compliance)
