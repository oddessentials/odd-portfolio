# Feature Specification: Splash Gate Polish

**Feature Branch**: `018-splash-gate-polish`
**Created**: 2026-03-08
**Status**: Draft
**Input**: User description: "Enhance existing splash gate with wizard desk reveal, quill cursor, signature removal, and updated door image"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Updated Door Appearance (Priority: P1)

A first-time visitor arrives at the portfolio and sees the splash gate with a refreshed door image. The door retains the same dimensions and positioning as before, with parchment text ("Welcome, Traveler" greeting and body text) remaining legible and correctly aligned within the parchment area of the new door design.

**Why this priority**: The door is the centerpiece of the splash gate. If the replacement breaks text alignment, parchment readability, or door positioning, the entire splash experience is compromised. This is the foundation all other changes depend on.

**Independent Test**: Replace the door asset, load the splash gate, and verify the parchment text falls within the parchment area at desktop (5120x1440 ultrawide), standard (1920x1080), tablet (768px), and mobile (<768px) viewports.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on any viewport, **When** the splash gate loads, **Then** the new door image displays at the same size and position as the previous door with no visible distortion or layout shift.
2. **Given** the new door image is loaded, **When** the visitor reads the parchment text, **Then** the greeting and body text are fully contained within the parchment area with sufficient contrast for readability.
3. **Given** the new door image fails to load, **When** the fallback styling activates, **Then** the text colors adjust for readability against the dark background (existing fallback behavior preserved).

---

### User Story 2 - Signature Removal & Parchment Cleanup (Priority: P1)

The wizard signature image is removed from the parchment overlay. All related code, styling, and orphaned image assets are cleaned up. The remaining parchment content (greeting + body text) is visually balanced within the parchment area.

**Why this priority**: This is a prerequisite for the door replacement (Story 1) since the new door design no longer includes a signature area. Leaving orphaned code and assets creates technical debt.

**Independent Test**: Load the splash gate and verify the parchment displays only the greeting and body text with no empty gaps, orphaned layout artifacts, or console errors.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** the splash gate loads, **Then** no signature image appears on the parchment and no network request is made for signature assets.
2. **Given** the signature is removed, **When** inspecting the codebase, **Then** no signature-related elements, styling rules, or image assets remain.
3. **Given** the remaining parchment content (greeting + one sentence), **When** viewed at any viewport size, **Then** the text is visually balanced within the parchment area without excessive empty space.

---

### User Story 3 - Wizard Desk Reveal Behind Door (Priority: P2)

When a first-time visitor clicks (or taps) the door, the door swings open to reveal a fleeting glimpse of the wizard's desk behind it. The desk image is visible through the archway opening during the door swing animation, then the entire splash fades out to reveal the portfolio. The desk adds atmosphere and narrative — the visitor is entering the wizard's workshop.

**Why this priority**: This is a visual enhancement that adds delight but is not required for the splash gate to function. The door open animation works without it — users just see the inner glow instead.

**Independent Test**: Click the door and observe whether the desk image appears behind the swinging door within the archway opening for approximately 1-2 seconds before the splash fades.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on a desktop viewport, **When** the door swings open, **Then** the wizard desk image is visible through the archway opening behind the door, layered beneath the inner glow effect.
2. **Given** a first-time visitor on a mobile device (<768px), **When** the door swings open, **Then** the desk image is either hidden or gracefully degraded to save bandwidth, with the inner glow providing the reveal visual instead.
3. **Given** the desk image fails to load, **When** the door swings open, **Then** the existing inner glow gradient shows through the archway opening as a graceful fallback — no blank space or broken image indicators.
4. **Given** a visitor with `prefers-reduced-motion: reduce`, **When** the door is activated, **Then** the splash fades out without any desk reveal animation (existing reduced-motion behavior preserved).

---

### User Story 4 - Quill Cursor on Splash Scene (Priority: P3)

On desktop devices with a mouse, the cursor transforms into a quill pen when hovering over the door/parchment area of the splash gate. This reinforces the wizard/scribe narrative. The quill cursor is only active on the splash scene and only for pointer devices — it must not appear on touch devices or interfere with tap targets.

**Why this priority**: This is a purely aesthetic enhancement. The splash gate works perfectly with the default pointer cursor. The quill adds thematic polish but carries implementation risks (cursor quality at small sizes, browser compatibility).

**Independent Test**: On a desktop browser with a mouse, hover over the splash door and verify the cursor changes to a quill. On a touch device, verify no cursor change occurs and tap targets remain functional.

**Acceptance Scenarios**:

1. **Given** a desktop visitor with a mouse (fine pointer), **When** hovering over the door container, **Then** the cursor displays as a quill with the click point at the quill nib.
2. **Given** a touch device visitor, **When** interacting with the splash gate, **Then** no custom cursor is applied and tap behavior is unaffected.
3. **Given** the quill cursor image fails to load, **When** hovering over the door, **Then** the cursor falls back to `pointer` (hand icon), preserving the clickability affordance.
4. **Given** the visitor hovers over non-interactive areas (stone archway, backdrop), **When** the cursor is outside the door container, **Then** the default cursor is shown — the quill only appears on the clickable door area.

---

### Edge Cases

- What happens if the new door image has a differently-positioned parchment area? Text overlay percentages must be validated against the new composition.
- What if the desk image is larger than expected and causes a memory spike during the door swing transition (both splash assets and the 3D scene are in memory simultaneously)?
- What if a returning visitor has the old door cached? The browser may display the old door image until the cache expires. Consider whether `SPLASH_VERSION` should be bumped to force re-display.
- What if the quill cursor at 32x32 pixels is too small to be recognizable as a quill? The source image (1024x1536) downscaled 32:1 may lose all meaningful detail.
- How does the desk image's landscape orientation (3:2) display within the portrait archway opening? Cropping strategy must be defined.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the door image asset with the updated version at identical dimensions (768x1152) to preserve all existing positioning, text overlay alignment, and animation behavior.
- **FR-002**: System MUST generate web-optimized image variants with appropriate fallbacks for the replacement door image.
- **FR-003**: System MUST remove the wizard signature image from the parchment text overlay, including all related code, styling, and image asset files.
- **FR-004**: System MUST display a wizard desk image behind the door during the door swing animation, visible through the archway opening, layered beneath the inner glow effect.
- **FR-005**: System MUST NOT display the desk image on mobile devices (<768px viewport) to conserve bandwidth.
- **FR-006**: System MUST provide a graceful fallback when the desk image fails to load (inner glow gradient remains visible, no broken image indicators).
- **FR-007**: System MUST display a custom quill cursor on the door container area, limited to devices with fine pointer capability (mouse/trackpad, not touch).
- **FR-008**: System MUST specify the quill cursor hotspot at the nib position, with a hand/pointer icon as the fallback.
- **FR-009**: System MUST NOT apply the quill cursor to non-interactive areas outside the door container.
- **FR-010**: System MUST preserve all existing accessibility features: focus trap, keyboard activation (Enter/Space), `aria-modal` dialog, `prefers-reduced-motion` support.
- **FR-011**: System MUST preserve the existing door swing animation timing and behavior (3-beat rotation sequence over 2.4 seconds).
- **FR-012**: System MUST ensure the desk image is available before the user can trigger the door open animation to prevent blank space during the reveal.
- **FR-013**: System MUST clean up all orphaned styling rules and assets after signature removal to prevent dead code.

### Key Entities

- **Door Image**: The central visual asset of the splash gate (768x1152), displayed with web-optimized format and fallback. Carries the parchment text overlay.
- **Wizard Desk Image**: A landscape scene (optimized from 1536x1024 source) visible behind the door during the swing animation. Positioned at the deepest layer within the scene.
- **Quill Cursor**: A small (32x32) cursor image derived from the source quill artwork. Applied only to the door area on mouse/trackpad devices.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The replacement door image renders identically in size and position to the previous door at all tested viewport widths (mobile, tablet, desktop, ultrawide) with no visible layout shift.
- **SC-002**: Parchment text (greeting + body) remains fully contained within the parchment area of the new door with WCAG AA contrast ratio (4.5:1 minimum) maintained.
- **SC-003**: The wizard desk is visible through the archway opening for at least 1 second during the door swing animation on desktop viewports.
- **SC-004**: No additional image assets are loaded on mobile devices (<768px) beyond the current splash gate assets.
- **SC-005**: The quill cursor appears only on fine-pointer devices and only over the door container — never on touch devices, never on non-interactive areas.
- **SC-006**: Total splash gate image payload does not increase by more than 150KB compared to the current baseline (excluding the desk image on mobile where it is not loaded).
- **SC-007**: All orphaned signature-related code and assets are removed — zero references remain in the codebase or assets directory.
- **SC-008**: Existing accessibility features (focus trap, keyboard nav, screen reader descriptions, reduced-motion support) continue to function without regression.

## Assumptions

- The new door image (`door-and-parchment-3.png` at 1024x1536) has the same 2:3 aspect ratio as the current door and can be resized to 768x1152 without distortion.
- The parchment area on the new door is in approximately the same position as the current door, allowing existing percentage-based text positioning to work. If the parchment has moved, text overlay positions will need manual adjustment.
- The wizard desk image will be cropped to fill the portrait archway opening from its landscape source, accepting that the left and right edges of the desk composition will be trimmed.
- The quill source image contains enough structural detail to be recognizable at 32x32 pixels. If downscaling produces an unrecognizable result, a hand-designed cursor at native resolution may be needed.
- `SPLASH_VERSION` does not need to be bumped for these changes since they are visual refinements, not behavioral changes. Returning visitors who already dismissed the splash will not see the updated door.
