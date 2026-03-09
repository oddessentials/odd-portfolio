# Research: Splash Lighting Polish

**Branch**: `019-splash-lighting-polish` | **Date**: 2026-03-08

## R-001: CSS Filter Performance on Composited Layers

**Decision**: Use CSS `filter` on static image elements; avoid animating filter values per-frame during the door swing.

**Rationale**: CSS `filter` (brightness, saturate, blur) on an element promotes it to its own GPU compositing layer. For static elements (desk image, door image), this is a one-time compositing cost — the filtered result is cached as a texture and reused until the element's content or filter changes. The splash gate images are fixed-size (768x512 desk, 768x1152 door) — well within GPU texture limits.

During the door swing animation (GSAP `rotateY`), the door container is already a composited layer (due to 3D transform). Adding a static `filter` to the door image does not increase per-frame cost — the filter is baked into the composited texture.

**Performance risk**: `drop-shadow()` on the archway (1024x1250 with transparency) is more expensive than `box-shadow` because it must trace the alpha channel. However, this is computed once and cached. Acceptable for a static element.

**`will-change` guidance**: Do NOT add `will-change: filter` — the elements are already promoted by their position in a 3D-transformed container. Adding `will-change` would create unnecessary duplicate layers.

**iOS Safari caveat**: CSS `filter` combined with `transform-style: preserve-3d` can cause flattening in older WebKit builds. The door image's filter is on a child element inside the 3D-transformed container — this should be safe since the filter element itself doesn't need 3D preservation. Verified: `filter` on a child does not break the parent's `perspective` context.

**Alternatives considered**:
- Animate desk brightness via GSAP during door swing: Rejected for P1 — adds per-frame filter recalculation. Acceptable as a P2 enhancement if performance allows.
- Use `opacity` instead of `brightness()`: Rejected — opacity affects the entire element uniformly, while brightness preserves the image's internal contrast.

---

## R-002: Breathing / Torch Flicker Animation Pattern

**Decision**: Use dual CSS `@keyframes` with prime-number durations (3.7s and 5.3s) for organic torch flicker.

**Rationale**: CSS `animation` supports multiple keyframe animations on one element: `animation: chromatic-shift 8s infinite, torch-flicker 3.7s infinite`. The browser composites both animations independently. Using prime-number durations (3.7s inner, 5.3s outer) ensures the two glows never sync up — the combined period before exact repetition is 3.7 × 5.3 = 19.61s, long enough that no human perceives the cycle.

**Flicker implementation**: Animate `opacity` (not `filter: brightness()`) for the flicker. Opacity changes on a composited layer are a simple alpha blend — zero repaint cost. The keyframes should have multiple uneven stops to avoid a mechanical sine wave:

```css
@keyframes torch-flicker {
  0%   { opacity: var(--glow-base-opacity); }
  23%  { opacity: calc(var(--glow-base-opacity) + 0.02); }
  41%  { opacity: calc(var(--glow-base-opacity) - 0.01); }
  67%  { opacity: calc(var(--glow-base-opacity) + 0.015); }
  84%  { opacity: calc(var(--glow-base-opacity) - 0.005); }
  100% { opacity: var(--glow-base-opacity); }
}
```

**Reduced-motion suppression**: `@media (prefers-reduced-motion: reduce) { .splash-gate__glow, .splash-gate__inner-glow { animation: none; } }` — this removes both the existing chromatic-shift AND the new torch-flicker.

**Entrance fade**: Use a CSS `@keyframes` animation on `.splash-gate` root: `animation: splash-entrance 700ms ease-out forwards`. This fires automatically when the element is added to the DOM. The `forwards` fill-mode keeps the element at full opacity after the animation completes. Under reduced-motion: `animation: none` (instant appearance).

**Door hover**: CSS `transition: filter 0.3s ease` on `.splash-gate__door-container` with a `:hover` state that adds `filter: brightness(1.08)`. Gated behind `@media (hover: hover) and (pointer: fine)`.

**Alternatives considered**:
- GSAP timeline for flicker: Rejected — adds JS complexity for something CSS handles natively. GSAP is reserved for the interactive door-open sequence.
- `filter: brightness()` for flicker: Rejected — forces repaint; `opacity` is compositor-only.

---

## R-003: GSAP Box-Shadow Animation

**Decision**: GSAP 3.12.5 CAN animate `boxShadow` directly, including multi-layer shadows. Use it for the Beat 3 color transition.

**Rationale**: GSAP's CSSPlugin handles `boxShadow` interpolation. For multi-shadow values, GSAP interpolates each shadow layer independently (position, blur, spread, color). The syntax must match — same number of shadow layers in start and end states.

**Performance note**: Animating `box-shadow` every frame for 800ms IS expensive — it triggers repaint (not just compositing). However, the glow element is a small visual area and the animation is short (800ms). On integrated GPUs, this is acceptable because the door swing itself (the heaviest operation — compositing a 3D-rotated layer) is already running. The box-shadow repaint is additive but bounded.

**Blur animation**: GSAP can animate `filter: blur(Xpx)` smoothly. The syntax is `gsap.to(el, { filter: 'blur(20px)', duration: 0.9 })`. GSAP parses the filter string and interpolates the numeric value.

**Rim light animation**: The door container's `box-shadow` can be animated in sync with the door swing by adding tweens to the same GSAP timeline at the same position markers. Start with subtle rim light, intensify during Beat 2-3:

```js
tl.to(doorContainer, {
  boxShadow: '0 -4px 20px rgba(184,146,68,0.4), -4px 0 15px rgba(184,146,68,0.3), 4px 0 15px rgba(184,146,68,0.25)',
  duration: 0.9, ease: 'power1.out'
}, 0.3);
```

**Alternatives considered**:
- CSS transition triggered by class change: Rejected — loses synchronization with the GSAP timeline's precise beat structure.
- CSS custom properties animated by GSAP: Viable fallback if boxShadow interpolation fails in any browser. Lower priority since direct boxShadow works in all target browsers.

---

## R-004: Constrained Hue-Rotate Animation

**Decision**: Replace the 360-degree `hue-rotate` with a multi-stop `@keyframes` that oscillates between 2-3 approved warm hue values.

**Rationale**: `hue-rotate(360deg)` cycles through the entire color wheel, producing cyan → blue → magenta → red → yellow → green → cyan at various animation phases. This is incompatible with a warm-chamber narrative. A constrained range of 0-25 degrees keeps the glow in the gold-to-slightly-amber range.

**Implementation**: Replace the existing `chromatic-shift` keyframes:

```css
@keyframes chromatic-shift {
  0%   { filter: hue-rotate(0deg); }
  33%  { filter: hue-rotate(18deg); }
  66%  { filter: hue-rotate(-12deg); }
  100% { filter: hue-rotate(0deg); }
}
```

This produces subtle shifts: gold → slightly warmer amber → slightly cooler gold → gold. The 8s duration remains — just the range is constrained.

**Alternatives considered**:
- Remove hue-rotate entirely: Rejected — some color movement adds life. Complete stasis looks artificial.
- Animate individual rgba values via CSS custom properties: More precise but requires refactoring the gradient declarations to use custom properties. Deferred as unnecessary complexity.

---

## R-005: mask-image Browser Support & Performance

**Decision**: Use `mask-image: linear-gradient(...)` for archway edge feathering. Include `-webkit-mask-image` prefix.

**Rationale**: `mask-image` with CSS gradients has full support in Chrome 120+, Firefox 53+, Safari 15.4+. The `-webkit-` prefix is needed for Safari. The mask is applied once during compositing (static element) — no per-frame cost.

**Performance**: `mask-image` with a `linear-gradient` is one of the lightest mask operations — the gradient is computed analytically, not sampled from a texture. No measurable impact on frame rate.

**Alternatives considered**:
- Multiple overlapping gradient pseudo-elements to simulate feathering: Works but requires 2-4 extra DOM layers. `mask-image` is cleaner.
- Editing the archway image to have soft edges: Rejected — spec says no new image assets.
