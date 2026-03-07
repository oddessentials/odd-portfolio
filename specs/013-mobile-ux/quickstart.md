# Quickstart: 013-mobile-ux

**Branch**: `013-mobile-ux`

## Prerequisites

- Git checkout: `git checkout 013-mobile-ux`
- Local HTTP server (e.g., `python -m http.server 8000` or VS Code Live Server)
- Mobile device or Chrome DevTools device emulation
- `pngquant` or similar PNG optimizer (for OG image compression)

## Files to Modify

| File | Changes | FR Coverage |
|------|---------|-------------|
| `js/logo-follow.js` | Gate touch handlers behind pointer capability query | FR-001, FR-002, FR-003 |
| `js/scene.js` | Add shared pointer capability utility; debounce breakpoint-crossing in onResize | FR-001, FR-004 |
| `js/interactions.js` | Refactor inline `(hover: hover) and (pointer: fine)` to use shared utility | FR-001 (single utility) |
| `css/styles.css` | Mobile gauge display, positioning, bracket clip, overlay hide rules | FR-005–FR-009 |
| `js/app.js` | Wire panel-open/panel-close events to toggle gauge visibility class | FR-008 |
| `index.html` | Social meta tags, canonical link, theme-color | FR-013–FR-022 |
| `assets/og-image.png` | Copy from design-assets/, optimize to ≤600KB | FR-019, FR-020 |

## Implementation Order

1. **OG image optimization + copy** (FR-019, FR-020) — unblocks meta tag work
2. **Social meta tags in index.html** (FR-013–FR-022) — HTML only, no JS
3. **Shared pointer capability utility** (FR-001) — unblocks logo-follow + interactions refactor
4. **Logo-follow touch gate** (FR-001–FR-003) — gate touch handlers, keep mouse handlers
5. **Resize debounce** (FR-004) — add debounce to breakpoint-crossing logic in scene.js
6. **Mobile gauge CSS** (FR-005–FR-009) — display right gauge, position, clip bracket
7. **Gauge overlay hide/show** (FR-008) — wire panel-open/close + nav state to gauge visibility
8. **Cross-device verification** — test all acceptance scenarios

## Testing Checklist

- [ ] Phone (<768px): logo does not follow touch, right gauge visible bottom-right
- [ ] Tablet (~810px): logo does not follow touch, both gauges visible (desktop position)
- [ ] Desktop (mouse): logo follows cursor, both gauges visible
- [ ] Hybrid (Surface Pro): touch = no logo follow, trackpad = logo follows
- [ ] Phone + hamburger open: gauge hidden
- [ ] Phone + project panel open: gauge hidden
- [ ] Phone + scroll zones: gauge needle animates on zone change
- [ ] Phone + prefers-reduced-motion: gauge visible, no tremor animation
- [ ] OG image: Facebook Sharing Debugger shows correct preview
- [ ] OG image: Twitter Card Validator shows correct preview
- [ ] OG image: Not loaded during normal page view (DevTools Network tab)
- [ ] Rapid rotation: no gauge flicker (debounce working)
