# Feature Specification: Sacred Meander Band

**Feature Branch**: `007-sacred-meander-band`
**Created**: 2026-03-05
**Status**: Draft
**Input**: Redesign the top border meander band to fix visual/performance flaws and reframe as sacred geometry aligned with the New Age Renaissance narrative.

## Context

The meander (Greek Key) pattern running along the top border rail is one of the oldest mathematical patterns in human art — a linearized spiral, a proto-fractal that appears independently across civilizations from ancient Greece to Mesoamerica. It represents the same mathematical beauty expressed elsewhere in the portfolio: the golden ratio construction lines in the sidebar hieroglyphs, the Fibonacci-like spiral echoes in the constellation layout, and the fBm noise that models natural phenomena in the nebula.

Currently, the meander band has five visual and performance flaws that undermine this narrative:

1. **Disproportionate height** — the band is taller than the border rail it sits on, creating a clunky, bolted-on appearance instead of reading as an integral part of the frame
2. **Flat lighting** — all gradient fills use the same vertical orientation regardless of arm direction, producing lifeless turns where the meander hooks change direction
3. **Performance-hostile shimmer** — the sweep animation uses a blending mode that prevents hardware acceleration, causing continuous repainting on every frame
4. **Ragged edges** — the repeating tile clips mid-pattern at band endpoints, breaking the visual rhythm
5. **Decorative disconnect** — the pattern reads as generic filler rather than intentional sacred geometry connected to the portfolio's mathematical narrative

## User Scenarios & Testing

### User Story 1 — Proportional Border Integration (Priority: P1)

A visitor viewing the portfolio at desktop resolution sees the meander band as a seamless, integral part of the top border rail — not a separate decorative element bolted on top. The band height matches the border rail width, creating a unified brass instrument panel.

**Why this priority**: The disproportionate height is the most visible flaw. A band that overshoots its rail reads as broken, not ornamental. Fixing proportions alone transforms the band from "clunky add-on" to "precision-machined detail."

**Independent Test**: Load the site at 1920x1080 — the meander band visually integrates with the top border rail as a single continuous element. The band height equals the rail width at all breakpoints (desktop, tablet). On mobile, the band is hidden per existing behavior.

**Acceptance Scenarios**:

1. **Given** a desktop viewport (1200px+), **When** the page loads and the reveal animation completes, **Then** the meander band height matches the top border rail width and the two elements read as a single unified strip.
2. **Given** a tablet viewport (768px–1199px), **When** the page loads, **Then** the meander band scales proportionally with the border rail — maintaining the same height-to-rail ratio as desktop.
3. **Given** a mobile viewport (<768px), **When** the page loads, **Then** the meander band is hidden (existing behavior preserved, no regression).
4. **Given** the browser window is resized across breakpoints, **When** crossing a breakpoint threshold, **Then** the meander band scales smoothly without visual breakage or jarring jumps.

---

### User Story 2 — Directional Material Lighting (Priority: P2)

The meander pattern exhibits realistic brass lighting where each arm of the meander has gradients oriented along its direction of travel. A single unified gradient model ensures tile-to-tile consistency: horizontal arms use a 90-degree (top-to-bottom) gradient and vertical arms use a 0-degree (left-to-right) gradient. Both orientations share the same three-stop brass color ramp — highlight edge, face tone, shadow edge — matching the adjacent edge rail profile. This creates the illusion of a three-dimensional channel carved into a brass plate with seamless tile repetition.

**Why this priority**: Correct directional lighting is the difference between "flat sticker" and "embossed metal." A single gradient model with explicit angles and shared stops eliminates implementation ambiguity and guarantees invisible tile seams. It transforms the meander from a 2D pattern into a tactile-looking carved channel that matches the material quality of the surrounding brass frame elements.

**Independent Test**: At desktop resolution, visually inspect the meander turns — horizontal segments show a top-to-bottom highlight-face-shadow gradient, vertical segments show a left-to-right highlight-face-shadow gradient. Tile boundaries are invisible.

**Acceptance Scenarios**:

1. **Given** a desktop viewport, **When** viewing the meander band, **Then** horizontal arms display a 90-degree gradient (highlight top, face middle, shadow bottom) and vertical arms display a 0-degree gradient (highlight left, face middle, shadow right).
2. **Given** the meander tile gradient model, **When** the tile repeats across the full band width, **Then** adjacent tiles share identical edge colors at their boundaries — no visible seams, color shifts, or discontinuities between tiles.
3. **Given** the meander pattern, **When** a hook turns from horizontal to vertical, **Then** the gradient transition reads as a natural material bend — the shared color ramp ensures the face tone is continuous through the turn.

---

### User Story 3 — Performant Shimmer Animation (Priority: P2)

The subtle shimmer sweep across the meander band runs smoothly at 60fps without causing main-thread repaints. The shimmer MUST be implemented as a transform-based translation (translateX) on a compositor-promoted layer — the sweep element moves across the band using only transform and opacity properties, which are the only two properties guaranteed to be handled entirely by the GPU compositor without triggering layout or paint. No blend modes that force main-thread compositing are permitted.

**Why this priority**: The current shimmer uses a blending mode that defeats hardware acceleration, causing every frame of the animation to trigger a full repaint. Simply stating "no paint events" as a goal is insufficient — the implementation mechanism must be constrained to compositor-safe properties (transform, opacity) to guarantee GPU-only compositing. This eliminates ambiguity about which animation techniques are acceptable.

**Independent Test**: Open browser DevTools performance panel, record 5 seconds of idle page time — the shimmer animation produces zero paint events (only composite events). Verify in the Layers panel that the shimmer pseudo-element is on its own compositor layer.

**Acceptance Scenarios**:

1. **Given** a desktop viewport with the page fully loaded, **When** the shimmer animation plays, **Then** the animation uses only transform (translateX) to move the shimmer sweep — no paint events are generated, only compositor-layer composites.
2. **Given** the shimmer pseudo-element, **When** inspected in browser DevTools Layers panel, **Then** it is promoted to its own compositor layer and animates independently of the main thread.
3. **Given** reduced-motion preferences enabled, **When** the page loads, **Then** the shimmer animation does not play (existing reduced-motion behavior preserved).
4. **Given** the performance auto-tier system degrades to tier 2 or 3, **When** the tier change occurs, **Then** the shimmer animation is disabled (existing tier behavior preserved).

---

### User Story 4 — Clean Pattern Termination (Priority: P3)

The meander pattern terminates cleanly at both ends of the band using fixed-position endpoint masks that fade partial tiles to the background color. The masks are positioned using the same corner-size variable (`--frame-corner-size`) that positions the band itself, ensuring they track automatically when corners resize at breakpoints or in future features. This approach avoids dynamic tile-count calculations or viewport-dependent clipping that could introduce edge artifacts during live resizing.

**Why this priority**: Mid-tile clipping is a subtle but noticeable quality issue. A pattern that starts and stops at natural boundaries reads as intentionally designed; one that clips mid-hook reads as carelessly implemented. Tying masks to the existing corner-size variable ensures termination stays clean regardless of viewport width without any layout complexity.

**Independent Test**: At desktop resolution, inspect both left and right endpoints of the meander band — partial tiles fade smoothly into the background rather than cutting off mid-hook. Resize the window continuously — no clipping artifacts appear at any width.

**Acceptance Scenarios**:

1. **Given** a desktop viewport, **When** viewing the left edge of the meander band, **Then** any partial tile at the left boundary fades to the background color via a fixed-position mask aligned to the corner-size variable.
2. **Given** a desktop viewport, **When** viewing the right edge of the meander band, **Then** any partial tile at the right boundary fades to the background color via a fixed-position mask aligned to the corner-size variable.
3. **Given** the browser window is resized continuously (dragging), **When** the band width changes in real time, **Then** no mid-hook clipping or edge artifacts appear — the masks track the corner boundaries automatically.
4. **Given** a future feature changes the corner size, **When** the corner-size variable updates, **Then** the endpoint masks reposition automatically without any changes to the meander band code.

---

### Edge Cases

- What happens when the viewport is exactly at a breakpoint boundary (e.g., 1199px or 767px)? The band must not flicker or show half-states.
- How does the band render during the reveal animation? The existing opacity fade-in must work identically — no flash of unstyled content.
- What happens if the corner elements are resized by a future feature? The band endpoints must adapt automatically via the existing corner-size variable.
- How does the band look with high-contrast mode enabled? Per the constitution, decorative elements are hidden — the band must respect this.

## Requirements

### Functional Requirements

- **FR-001**: The meander band height MUST equal the top border rail width at every responsive breakpoint, scaling proportionally when the border width changes.
- **FR-002**: The meander tile MUST use a single gradient model with two explicit orientations — 90-degree (top-to-bottom) for horizontal arms and 0-degree (left-to-right) for vertical arms — sharing the same three-stop brass color ramp (highlight edge, face tone, shadow edge) to guarantee invisible tile seams.
- **FR-003**: The shimmer animation MUST use only compositor-safe properties (transform: translateX and opacity) on a promoted layer. No blend modes that force main-thread compositing are permitted. The animation MUST produce zero paint events.
- **FR-004**: The meander pattern MUST terminate at both band endpoints using fixed-position gradient masks tied to the corner-size variable, fading partial tiles to the background color. Masks MUST reposition automatically when the corner-size variable changes at any breakpoint.
- **FR-005**: The meander tile gradients MUST use the same brass color palette as the adjacent edge rail elements for seamless material continuity.
- **FR-006**: The brushed-grain overlay texture MUST remain functional and MUST NOT trigger main-thread paint events.
- **FR-007**: All existing integration points MUST be preserved without regression: reveal animation (opacity fade-in), reduced-motion (static/no shimmer), performance tier 2/3 (band hidden), tablet scaling, and mobile hiding.
- **FR-008**: The meander band MUST respect `prefers-contrast: more` by being hidden, per the existing constitution accessibility requirements.
- **FR-009**: The band MUST continue to use procedurally-generated visuals (inline pattern tiles, gradients) — no external image files.
- **FR-010**: The meander element count MUST remain unchanged — no new elements added to the page structure.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The meander band height equals the border rail width at desktop (18px), tablet (12px), and is hidden at mobile — verified by visual inspection at each breakpoint.
- **SC-002**: Zero paint events generated by the shimmer animation during a 10-second idle recording in browser performance tools.
- **SC-003**: The meander pattern shows no mid-tile clipping at either endpoint when viewed at 1920x1080, 1440x900, and 1200x800 resolutions.
- **SC-004**: All 6 existing integration points (reveal animation, reduced-motion, tier 2 disable, tier 3 disable, tablet scale, mobile hide) continue to function identically — verified by manual testing checklist.
- **SC-005**: The page element count does not increase — the meander band uses the same single element with two pseudo-elements as the current implementation.
- **SC-006**: Frame rate remains at 60fps during shimmer animation on integrated GPU hardware (Intel Iris-class), as measured by browser performance tools.

## Assumptions

- The brass color palette (`#E8D090` highlight, `#C8A84B` face, `#B09028` mid, `#8B6914` dark, `#705010` shadow, `#4A3508` deep shadow) is stable and will not change during this feature.
- The border rail width custom property will continue to cascade through responsive breakpoints as established in feature 006.
- The corner size custom property will continue to define band endpoint positioning.
- The reveal animation targets the meander band by its existing class name — no selector changes are needed.
- The performance tier system disables the band via opacity/display changes — no new tier integration is required.
- The "New Age Renaissance" narrative reframing is captured in this spec's context section and will inform future documentation updates, but does not require any constitution amendment for this CSS-only feature.

## Scope Boundaries

**In scope**:
- Top border meander band visual redesign (proportions, lighting, tile quality)
- Shimmer animation performance optimization
- Tile termination at band edges
- Responsive scaling verification
- Brushed-grain overlay optimization

**Out of scope**:
- Bottom border or side border meander bands (none exist currently)
- Sidebar hieroglyphs (separate feature)
- Corner, edge, or gauge frame elements (completed in feature 006)
- Constitution text amendments (separate governance process)
- Theme narrative documentation updates beyond this spec's context section
- Any new page elements or JavaScript changes

## Dependencies

- **Feature 006** (Brass Frame Optimization): MUST be merged before this feature begins — it establishes the custom property cascade (`--frame-border-width`, `--frame-corner-size`) that the meander band depends on.
- **Constitution v1.2.0**: This feature is fully compliant with all 8 principles. No amendments required.
