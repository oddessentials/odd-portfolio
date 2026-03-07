# Research: 013-mobile-ux

**Date**: 2026-03-06

## R1: Pointer Capability Detection — Browser Consistency

**Decision**: Use `matchMedia('(hover: hover) and (pointer: fine)')` as the single capability gate for logo follow activation.

**Rationale**: This exact query already exists in the codebase at `interactions.js:209` for gating nav hover effects. Using the same query for logo-follow ensures consistent behavior. The `(pointer: coarse)` query at `interactions.js:92` is a separate concern (touch device detection for tagline expand behavior) and should not be conflated.

**Browser behavior verified** (web platform standard):
- Chrome/Edge: Reports primary input device. Hybrid devices (Surface Pro) report `(pointer: fine)` when keyboard attached, `(pointer: coarse)` when tablet mode. `matchMedia` change events fire on mode switch.
- Safari (macOS): Always `(hover: hover) and (pointer: fine)` — correct.
- Safari (iOS): Always `(hover: none) and (pointer: coarse)` — correct.
- Firefox: Follows spec. Hybrid device behavior matches Chrome.
- iPad + Magic Keyboard: Reports `(pointer: fine)` — logo follow would activate for trackpad, which is correct product behavior.

**Implementation approach**: Extract the query into a shared utility function (e.g., in `scene.js` or a new lightweight helper) that returns the current state and supports `addEventListener('change', ...)` for dynamic updates. Both `interactions.js:209` and `logo-follow.js` consume this utility.

**Alternatives considered**:
- `navigator.maxTouchPoints > 0`: Rejected — detects capability, not active input modality. Touchscreen laptops would always disable logo follow.
- Viewport width only (`< 768px`): Rejected — doesn't distinguish phone from narrow desktop window.
- `ontouchstart in window`: Rejected — same problem as maxTouchPoints.

---

## R2: Gauge Zone-State Signal Architecture

**Decision**: The gauge module (`gauge.js`) is called directly by `scroll-zones.js` via imported functions (`setGaugeZone`, `animateNeedles`, `animateGlow`), not via the `zone-change` custom event.

**Rationale**: The `zone-change` custom event is dispatched by `scroll-zones.js:111` AFTER calling gauge functions directly (line 108). Other modules (constellation-lines, sidebar-hieroglyphs, app.js OddBot, bronze-tool-flash) listen to `zone-change`. The gauge is a direct import dependency, not an event consumer.

**Implication for FR-010**: The mobile gauge inherently uses the same source of truth as desktop because there is only one `scroll-zones.js` that drives both gauges via direct function call. No separate mobile tracking exists. FR-010 is satisfied by the existing architecture — no unification work needed.

**Implication for FR-010 (animation driver)**: The needle update is triggered by `scroll-zones.js` ScrollTrigger callbacks, not by raw scroll event listeners. ScrollTrigger debounces internally. The zone-change is discrete (fires only when the active zone index changes), not continuous. FR-010's "no continuous scroll listener" requirement is already met.

**Alternatives considered**:
- Refactoring gauge to consume `zone-change` event instead of direct import: Rejected — unnecessary refactor, would break existing tight coupling that works correctly.

---

## R3: Gauge Display:None Animation Behavior

**Decision**: GSAP `.to()` and `.set()` targeting CSS custom properties (e.g., `--needle-angle`) work correctly even when the target element has `display: none`. GSAP tweens the property value; the browser simply doesn't render the visual result.

**Rationale**: Tested by code inspection — `gauge.js` uses `gsap.to(gaugeLeft, { '--needle-angle': ... })` and `gsap.set(gaugeLeft, { '--needle-angle': ... })`. These modify the element's inline style property, which persists regardless of `display` state. When the element is un-hidden, the correct property value is already applied.

**Implication for VT-001**: No special pause/resume logic is needed for gauge animations when the gauge is hidden by overlay events. The micro-tremor (which runs on a GSAP repeat loop) will continue tweening the CSS custom property — this is harmless since the element is not rendered. When the gauge reappears, the tremor continues from its current position seamlessly.

**Edge case**: If the element is removed from DOM (not just `display: none`), GSAP tweens would fail silently. Implementation must use CSS visibility/display toggling, not DOM removal.

---

## R4: OG Image Optimization

**Decision**: Optimize `design-assets/og-image.png` from 1.43MB to ≤600KB before copying to `assets/`.

**Rationale**: Current file is 1,462,155 bytes (1.43MB), exceeding the 600KB soft budget from FR-020. PNG is lossless; converting to optimized PNG or lossy-optimized format will reduce size.

**Optimization approach**:
1. Use `pngquant` or similar lossy PNG optimizer (256-color palette for photographic content is usually sufficient for social card preview at 1200x630)
2. Alternatively, convert to JPEG at quality 85 — most OG crawlers accept JPEG, and the file size would drop to ~100-200KB
3. Keep PNG format if brass/gold detail quality is important to the owner — optimize with `optipng` + `pngquant`

**Alternatives considered**:
- WebP: Rejected — not universally supported by all social crawlers (LinkedIn, older Facebook crawlers)
- AVIF: Rejected — even less crawler support than WebP
- Keeping 1.43MB PNG: Rejected — exceeds budget, slow crawler retrieval

---

## R5: Resize Debounce

**Decision**: Add 150ms debounce to the existing `onResize()` handler in `scene.js` for breakpoint-crossing state changes.

**Rationale**: Current `scene.js:177` `onResize()` fires immediately on every `resize` event with no debounce. This is fine for renderer/camera updates but would cause flicker for mobile/desktop feature toggling (gauge visibility, logo-follow state). The 150ms debounce applies only to the breakpoint-crossing logic, not to the renderer resize (which should remain immediate for visual smoothness).

**Implementation approach**: Add a `clearTimeout`/`setTimeout` wrapper around the breakpoint-dependent state changes within `onResize()`. The `renderer.setSize()` and `camera.aspect` updates remain immediate (no debounce). Only the `isMobile` flag update and its downstream effects (logo-follow reset, gauge visibility class toggle) are debounced.

**Alternatives considered**:
- Debouncing the entire resize handler: Rejected — would cause visible stretching/distortion during resize as renderer doesn't update.
- Using `ResizeObserver` instead of `resize` event: Rejected — unnecessary complexity, and ResizeObserver doesn't solve the debounce need.

---

## R6: Nav Overlay Events for Gauge Hide/Show

**Decision**: The hamburger nav open/close does not currently dispatch custom events. `panel-open` and `panel-close` events exist for the project detail panel. The gauge hide/show logic needs both.

**Rationale**: `interactions.js` manages hamburger state directly (lines 21-44) without dispatching events. Other modules that react to panel state (constellation-lines, reticle) listen to `panel-open`/`panel-close`. For the gauge to hide on nav open, either:
1. Add `nav-open`/`nav-close` custom events dispatched from `interactions.js`, or
2. Have the gauge CSS react to an existing DOM state (e.g., `hamburgerBtn.classList.contains('is-open')` or `navEl` having an open class)

**Implementation approach**: Option 2 (CSS-driven) is preferred. The hamburger button already gets `.is-open` class (line 25). A CSS rule can hide the gauge when a parent/sibling has `.is-open`. For `panel-open`/`panel-close`, listen to the existing custom events in the gauge module or in app.js and toggle a class on the gauge element.

**Alternatives considered**:
- Adding new `nav-open`/`nav-close` events: Viable but adds to event surface area. CSS approach is simpler for a display toggle.

---

## R7: Logo Accessibility — Clickable Logo Element

**Decision**: The logo (`#brand-logo`) currently has `pointer-events: none` set inline (`style="pointer-events: none;"` on index.html:124) and is an `<img>` tag, not a link. There is no home navigation link on the logo.

**Rationale**: The logo is purely decorative during desktop logo-follow mode (the cursor is hidden, the logo tracks the mouse). On mobile where logo-follow is disabled, the logo just sits in the header band as a static brand mark. Since it is not a link and already has `pointer-events: none`, FR-002's accessibility clause ("logo itself remains clickable within its visual bounds if it serves as a clickable element") is satisfied trivially — the logo is not clickable, so nothing to preserve.

**Implication**: The tracking container (`#orb-hitzone`) is the element that needs `pointer-events: none` on mobile for the pass-through behavior. The logo already has it. Implementation: on coarse-pointer devices, do not register touch handlers on `#orb-hitzone` for logo-follow, and ensure the hitzone's existing touch handlers for star raycasting continue to work.
