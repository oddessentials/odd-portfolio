# Quickstart: Splash Lighting Polish

**Branch**: `019-splash-lighting-polish` | **Date**: 2026-03-08

## Prerequisites

- Local dev server (e.g., `python -m http.server`)
- Clear localStorage (`oe-splash-dismissed` key) to trigger splash on each reload
- Chrome DevTools for fps monitoring (Performance tab or fps meter overlay)

## Implementation Order

1. **Fix color temperature** (P1, highest visual impact — everything else builds on this)
   - Restructure inner glow gradient: warm amber center, darker amber falloff, no cyan
   - Restructure outer glow box-shadows: warm brass innermost, cool outermost
   - Constrain `chromatic-shift` keyframes to ~30-degree warm oscillation
   - Visual validation: glow should read as "candlelit chamber" at rest

2. **Add ambient occlusion & shadows** (P1, establishes depth)
   - Add `drop-shadow` on archway (respects transparent opening)
   - Add inset shadow on door container (recess + threshold)
   - Add scene inset shadow (archway-meets-wall depth)
   - Visual validation: archway should feel like it projects forward from the wall

3. **Atmospheric perspective on desk** (P1, completes depth story)
   - Add CSS filter on desk image: blur + desaturate + dim
   - Slight dim/desaturate on door image
   - Visual validation: desk should look "deep inside a dim room"

4. **Fix backdrop lighting** (P2, environment context)
   - Invert radial gradient: lighter center, darker edges
   - Increase outer opacity to 0.85-0.9
   - Add warm light-spill overlay via pseudo-element
   - Visual validation: stone visible near center, vanishes at edges

5. **Add rim lighting & vignette** (P2, polish)
   - Warm box-shadow on door container edges
   - Scene vignette via ::after pseudo-element
   - Visual validation: door edges glow with backlight, scene is framed

6. **Fix door open animation** (P2, climactic interaction)
   - Beat 1: hold glow steady (not dim)
   - Beat 3: animate box-shadow colors to warm brass
   - Add rim light intensification during swing
   - Add desk brightness ramp during reveal (if P2 performance allows)
   - Visual validation: door open feels physically correct

7. **Add scene life** (P3, atmosphere)
   - Torch flicker keyframes on both glows at different rates
   - Entrance fade-from-black animation
   - Door hover feedback (fine-pointer only)
   - Reduced-motion suppression for all new animations
   - Visual validation: scene breathes subtly, hover responds

8. **Soften edges** (P3, final polish)
   - mask-image feathering on archway edges
   - Scene edge-fade responsive percentage
   - Edge softening on scene-to-backdrop transition
   - Visual validation: no hard pixel boundaries anywhere

## Testing Checklist

- [ ] Glow reads as warm amber/gold at rest (no cyan dominance)
- [ ] Hue animation stays within warm range (no rainbow cycling)
- [ ] Archway casts visible shadow onto door
- [ ] Door shows recess shadow at edges and base
- [ ] Desk appears dim, desaturated, slightly blurred (desktop only)
- [ ] Door appears slightly dimmed to match ambient stone
- [ ] Backdrop: stone visible near center, dark at edges
- [ ] No visible tile seams at 3840px viewport width
- [ ] Vignette frames the archway as focal point
- [ ] Door rim light visible (warm edge glow)
- [ ] Door open Beat 1: glow does NOT dim
- [ ] Door open Beat 3: glow transitions to warm brass
- [ ] Rim light intensifies during door swing
- [ ] Subtle torch flicker visible during 5s idle observation
- [ ] Inner and outer glow flicker at different rates
- [ ] Scene fades up from black on first load
- [ ] Door hover produces subtle visual feedback (desktop mouse only)
- [ ] No hover effect on touch devices
- [ ] Reduced-motion: all new animations suppressed
- [ ] 60fps maintained during door swing on integrated GPU
- [ ] Focus trap still works (Tab trapped, Enter/Space opens)
- [ ] Keyboard navigation to portfolio nav works after splash
- [ ] Parchment text fully legible
- [ ] Mobile (<768px): scene benefits from static fixes, no JS errors
- [ ] Chrome, Firefox, Safari: no visual breakage
- [ ] No archway hard pixel boundaries visible
- [ ] No scene-to-backdrop compositing seam visible
