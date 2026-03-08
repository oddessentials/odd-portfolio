# Quickstart: Splash Gate Polish

**Branch**: `018-splash-gate-polish` | **Date**: 2026-03-08

## Prerequisites

- Source assets in `design-assets/`: `door-and-parchment-3.png`, `odd-wizard-desk.png`, `odd-wizard-quill.png`
- Python 3.x with Pillow (PIL) for image processing
- Local dev server (e.g., `python -m http.server`)

## Implementation Order

1. **Replace door image** (P1, lowest risk — proven pattern)
   - Resize `door-and-parchment-3.png` from 1024x1536 → 768x1152
   - Generate WebP (quality 80)
   - Overwrite `assets/chamber-door.png` and `assets/chamber-door.webp`
   - Visual validation: parchment text alignment at all breakpoints

2. **Remove signature** (P1, clean removal)
   - Delete signature DOM creation in `js/splash.js` (sigPic, sigSrc, sigImg elements + append)
   - Delete `.splash-gate__signature` CSS rule in `css/styles.css`
   - Delete `assets/odd-wizard-signature.png` and `.webp`
   - Verify parchment text layout with remaining content

3. **Add wizard desk behind door** (P2, new feature)
   - Optimize desk: resize to 768x512, generate WebP (quality 75)
   - Add desk `<picture>` element to scene in `js/splash.js` (before inner-glow in DOM order)
   - Style with `position: absolute; inset: 0; object-fit: cover; pointer-events: none`
   - Gate: skip DOM insertion when `window.innerWidth < 768`

4. **Add quill cursor** (P3, CSS-only on fine-pointer)
   - Generate 48x48 cursor PNG from source quill
   - Add CSS rule gated by `@media (hover: hover) and (pointer: fine)`
   - Apply to `.splash-gate__door-container` only, with `pointer` fallback

## Testing Checklist

- [ ] Door renders correctly at ultrawide (5120x1440), desktop (1920x1080), tablet (768px), mobile (<768px)
- [ ] Parchment text ("Welcome, Traveler" + body) is legible and contained
- [ ] No signature image in DOM or network requests
- [ ] Desk visible behind swinging door on desktop
- [ ] Desk NOT loaded on mobile (<768px)
- [ ] Quill cursor on door hover (desktop with mouse only)
- [ ] No quill cursor on touch devices
- [ ] Door swing animation unchanged
- [ ] Focus trap and keyboard nav still work
- [ ] Reduced-motion mode still works
