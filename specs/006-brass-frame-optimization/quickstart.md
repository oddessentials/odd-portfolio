# Quickstart: Brass Frame Optimization

**Feature**: 006-brass-frame-optimization
**Branch**: `006-brass-frame-optimization`

## Overview

This feature fixes 5 visual flaws in the brass frame border: 3 weak/obstructed corners and 2 disconnected gauges. All changes are CSS-only in `css/styles.css` with a verification pass on `js/animations.js`.

## Implementation Order

1. **Update `--frame-corner-size`** from 80px to 45px in `:root`
2. **Add `clip-path: polygon()`** to each `.frame__corner--*` variant
3. **Replace corner gradients** — swap radial-gradient to opaque linear-gradient
4. **Reposition rivets** — move `::before`/`::after` from diagonal to arm centers
5. **Add interior bevel** — 1px inset shadow on corner inner edges (FR-014)
6. **Resize gauges** — reduce from 64px to 40px, scale face inset and needle height
7. **Reposition gauges** — change `left/right: 28px` to `left/right: -11px` (centered on rail)
8. **Update tablet breakpoint** — scale corners to 30px, gauges to 27px
9. **Update mobile breakpoint** — corners to 20px (gauges already hidden)
10. **Verify reveal animation** — load site and confirm corner fly-in + gauge scale + needle spring work correctly

## Key Files

| File | Lines | Change |
|------|-------|--------|
| `css/styles.css` | 39-41 | `--frame-corner-size: 45px` |
| `css/styles.css` | 276-360 | Corner clip-path, gradients, rivets, bevel |
| `css/styles.css` | 469-543 | Gauge size, position, face, needle |
| `css/styles.css` | 1292-1320 | Tablet breakpoint updates |
| `css/styles.css` | 1324-1420 | Mobile breakpoint updates |
| `js/animations.js` | ~156-194 | Review only — verify GSAP targets still match |

## Testing Checklist

- [ ] Desktop (1920x1080): All 4 corners appear as opaque L-brackets
- [ ] Desktop: Both gauges centered on border rails, no floating gap
- [ ] Desktop: Edge rails extend to meet corner brackets seamlessly
- [ ] Desktop: Greek key band extends further toward corners
- [ ] Desktop: Reveal animation plays correctly (corners fly in, gauges scale, needles spring)
- [ ] Tablet (1024x768): Corners scale to 30px arms, gauges to 27px
- [ ] Mobile (375x667): Corners minimal (20px), gauges hidden
- [ ] Chrome, Firefox, Safari: clip-path renders correctly
- [ ] No new DOM elements added (element count = 31)

## Design Tokens Reference

```
Desktop:  --frame-border-width: 18px  --frame-corner-size: 45px  gauge: 40px
Tablet:   --frame-border-width: 12px  --frame-corner-size: 30px  gauge: 27px
Mobile:   --frame-border-width: 8px   --frame-corner-size: 20px  gauge: hidden
```
