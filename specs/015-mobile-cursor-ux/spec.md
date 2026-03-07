# Feature Specification: Mobile & Cursor UX Fixes

**Feature Branch**: `015-mobile-cursor-ux`
**Created**: 2026-03-07
**Status**: Draft
**Input**: Resolves GitHub issues #10 (mobile system control), #11 (mobile modals), #14 (cursor logo follow)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Modal Escape on Coarse-Pointer Devices (Priority: P1)

A visitor on a coarse-pointer device (phone, tablet, or touchscreen) taps a star (intentionally or accidentally) and a project modal opens. The visitor can always see and reach the close button, regardless of how far they scroll within the modal, what device they use, or whether their phone has a notch or Dynamic Island. They can also dismiss the modal by tapping the backdrop or swiping down from the modal header. They are never trapped.

**Why this priority**: This is a complete usability blocker. Users who open a modal on coarse-pointer devices currently cannot close it, making the entire site unusable after one interaction. No other fix matters if users remain trapped.

**Independent Test**: Open any project modal on a coarse-pointer device. Scroll through modal content, rotate device, verify close button is always reachable and functional.

**Acceptance Scenarios**:

1. **Given** a coarse-pointer user viewing a project modal with long content, **When** they scroll to the bottom of the modal content, **Then** the close button remains visible and tappable at the top of the viewport without scrolling back up.
2. **Given** a coarse-pointer user viewing a project modal, **When** they tap the darkened backdrop area outside the modal content, **Then** the modal closes — but only if the tap target is the backdrop element itself (taps on modal content that bubble up MUST NOT trigger dismissal).
3. **Given** a coarse-pointer user viewing a project modal, **When** they swipe downward from the dedicated modal header area (minimum 80px swipe distance), **Then** the modal dismisses with a smooth animation. Swipe detection MUST be limited to the modal header hit area and MUST be cancelled once modal content scrolling begins, to prevent accidental dismissal while scrolling near the top of content.
4. **Given** a coarse-pointer user on a notched device (iPhone with Dynamic Island), **When** a project modal is open, **Then** the close button and modal content respect safe-area insets and are not obscured by hardware features.
5. **Given** a coarse-pointer user viewing a project modal, **When** they press the Escape key (external keyboard) or use browser back gesture, **Then** the modal closes.
6. **Given** a user on any device with a modal open, **When** body scroll is locked to prevent background scrolling, **Then** the scroll position of the page behind the modal MUST be preserved and restored on close, and no rubber-band or bounce artifacts MUST occur on iOS Safari.

---

### User Story 2 - Scroll Without Accidental Star Taps (Priority: P2)

A visitor on a coarse-pointer device scrolls through the star field to explore different constellation zones. Their finger touches and releases over stars during normal scrolling, but no project modal opens. Stars are still tappable when the visitor deliberately taps (short, stationary touch) a specific star.

**Why this priority**: This is the root cause that triggers Story 1 (trapped modals). Preventing accidental opens dramatically improves the touch experience and reduces the frequency of users needing to close modals they didn't intend to open.

**Independent Test**: On a coarse-pointer device, scroll up and down through the star field repeatedly. Verify no modals open during scrolling. Then deliberately tap a star and verify the modal opens.

**Acceptance Scenarios**:

1. **Given** a coarse-pointer user scrolling through the star field, **When** their finger moves more than a defined movement threshold (in device-independent pixels) between touch-start and touch-end, **Then** no star-click event fires and no modal opens.
2. **Given** a coarse-pointer user scrolling through the star field, **When** a `touchmove` event occurs with vertical delta exceeding horizontal delta (detected scroll gesture), **Then** the tap candidate MUST be immediately cancelled regardless of total distance — no star-click fires.
3. **Given** a coarse-pointer user who deliberately taps a star (finger stays within the movement threshold and touch duration is under 300ms), **When** they lift their finger, **Then** the star-click event fires and the project modal opens.
4. **Given** a coarse-pointer user who taps and holds a star for longer than 500ms without moving, **When** they lift their finger, **Then** no star-click fires (long-press is not a tap).
5. **Given** a coarse-pointer user performing a fast flick/swipe to scroll, **When** their finger passes over multiple stars, **Then** no accidental star-clicks fire during the gesture.
6. **Given** a fine-pointer user with a mouse, **When** they click a star, **Then** behavior is unchanged from current (single click opens modal immediately).

---

### User Story 3 - Logo Fade-Out and Smooth Rotation (Priority: P3)

A visitor with a fine pointer (mouse/trackpad) moves their cursor into the star field. The logo leaves the header band and follows the cursor (existing behavior). When the cursor leaves the star field, the logo fades out smoothly instead of snapping back to the header band. When the cursor re-enters the star field, the logo reappears and resumes following. The logo rotates smoothly to indicate direction of movement without jitter, wobble, or sudden spins — even at slow cursor speeds or when passing near stars along constellation lines. The logo is always visible in the header band on initial page load for branding, and remains there for keyboard-only users who never mouse into the star field.

**Why this priority**: This is a polish issue affecting fine-pointer aesthetics. The current snap-back is visually jarring, and the rotation glitches undermine the professional feel of the cursor interaction. Neither blocks functionality. Coarse-pointer users are unaffected (logo-follow is already disabled on coarse-pointer devices).

**Independent Test**: On a desktop browser with a mouse, move cursor in and out of the star field repeatedly. Verify logo fades out on leave (no snap-back) and fades in on re-enter. Move cursor slowly across the star field and along constellation lines — verify no unexpected spinning or rotation glitches.

**Acceptance Scenarios**:

1. **Given** a fine-pointer user whose cursor is following the logo in the star field, **When** the cursor leaves the star field (exits the hitzone), **Then** the logo fades to invisible over ~0.3 seconds at its current position (no positional animation back to header).
2. **Given** a fine-pointer user whose cursor is following the logo in the star field, **When** the cursor leaves the browser viewport entirely, **Then** the logo fades out at its last position (same as leaving the hitzone).
3. **Given** a fine-pointer user whose logo has faded out, **When** the cursor re-enters the star field, **Then** the logo fades in at the cursor position and resumes following.
4. **Given** a fine-pointer user on initial page load who has not yet moved their cursor into the star field, **When** they view the page, **Then** the logo is visible in the header band (branding preserved).
5. **Given** a keyboard-only user who never moves a mouse into the star field, **When** they navigate the site, **Then** the logo remains visible in the header band throughout their session.
6. **Given** the reticle activates (cursor hovers a star), **When** the logo-follow is paused for reticle handoff, **Then** the logo fades out (not snaps home) and reappears when the reticle deactivates. A short debounce window (~80ms) MUST be applied before toggling the logo fade state, so that passing over multiple star hitboxes in rapid succession does not produce visible flicker from repeated start/stop fade cycles.
7. **Given** a fine-pointer user moving the cursor slowly across the star field, **When** cursor movement is small and direction changes frequently (natural hand tremor), **Then** the logo rotation remains stable without jitter, wobble, or unexpected spinning. Rotation angle MUST NOT be recalculated until cursor movement exceeds a minimum distance threshold sufficient to produce a reliable direction vector.
8. **Given** a fine-pointer user gliding the cursor along a constellation line (passing near multiple stars), **When** the reticle activates and deactivates in rapid succession, **Then** the logo transitions smoothly (fade out/in) without snapping to the header band or resetting rotation abruptly.
9. **Given** a fine-pointer user rapidly moving the cursor in and out of the star field, **When** a fade-in or fade-out animation is already in progress, **Then** any new state change MUST cancel or reuse the in-progress animation — fade animations MUST NOT stack, restart from zero, or leave the logo in an inconsistent opacity state.
10. **Given** a user with reduced-motion preference enabled, **When** the logo would normally fade in or fade out, **Then** the transition MUST be immediate (instant show/hide) with no opacity animation.

---

### Edge Cases

- What happens on hybrid devices (touchscreen laptop with trackpad)? The system uses pointer capability detection (`pointer: coarse` vs `pointer: fine`) as the primary discriminator. If a fine pointer is available, logo-follow and single-click star interaction are enabled. Touch scrolling on these devices still benefits from the scroll-vs-tap guard since touch events are handled separately from mouse/click events.
- What happens if the user rotates their device while a modal is open? The modal layout must reflow correctly, keeping the close button accessible in both portrait and landscape.
- What happens if reduced-motion preference is enabled? All animations — logo fade-in/out, modal dismiss, swipe feedback, star tap feedback — MUST be instant (no transition). This explicitly includes logo-follow opacity transitions.
- What happens when a user scrolls inside the modal on coarse-pointer devices? Only the modal content area scrolls; the page behind does not scroll. Body scroll locking MUST use a single consistent mechanism that preserves scroll position and avoids iOS Safari rubber-band bounce artifacts.
- What happens on iOS Safari where `100vh` includes the address bar? The modal should use `100dvh` (dynamic viewport height) where supported, with `100vh` fallback.
- What happens when the cursor moves very slowly (1-3 pixels per frame) across the star field? The logo rotation must remain stable — rotation angle recalculation MUST be suppressed until cursor movement exceeds a minimum distance threshold, preventing tremor-induced spinning without introducing complex smoothing logic.
- What happens when the cursor quickly passes through multiple star hitboxes along a constellation line? Each star hover triggers reticle-activate/deactivate in rapid succession. A debounce window prevents the logo from flickering. The logo must transition smoothly (fade out/in) without the rapid return-to-header/re-engage cycle that currently causes visible glitching and rotation resets.
- What happens if a user taps the modal content area and the event bubbles to the backdrop? The backdrop dismiss handler MUST verify the tap target is the backdrop element itself. Event bubbling from modal content MUST NOT trigger dismissal.
- What happens on a high-DPI device where 10 CSS pixels represent 20-30 physical pixels? The movement threshold for scroll-vs-tap disambiguation MUST be defined in device-independent (CSS) pixels, not physical pixels, to behave consistently across screen densities.

## Requirements *(mandatory)*

### Functional Requirements

**Device capability detection:**

- **FR-001**: Interaction behavior MUST be gated by pointer capability detection (`pointer: coarse` vs `pointer: fine`), NOT by viewport width. Viewport width (<768px) MUST only be used as a secondary layout hint for CSS-driven adjustments (e.g., modal sizing, element spacing), never as the primary determinant of touch vs. mouse behavior.

**Modal escape (coarse-pointer devices):**

- **FR-002**: The project modal close button MUST remain visible and tappable at all times while the modal is open, regardless of content scroll position.
- **FR-003**: The project modal MUST be dismissible by tapping the backdrop overlay area. The tap handler MUST verify `event.target` is the backdrop element itself — taps on modal content that bubble up MUST NOT trigger dismissal.
- **FR-004**: The project modal MUST be dismissible by swiping downward from a dedicated modal header hit area (minimum 80px swipe distance). Swipe detection MUST be limited to the header area and MUST be explicitly cancelled once modal content scrolling begins, to prevent accidental dismissal while scrolling near the top of content.
- **FR-005**: The project modal MUST respect device safe-area insets (notch, Dynamic Island, home indicator) so no interactive elements are obscured.
- **FR-006**: Body scroll locking while a modal is open MUST use a single consistent mechanism that preserves the page scroll position and restores it on close. The mechanism MUST NOT cause rubber-band scroll or bounce artifacts on iOS Safari.

**Touch tap disambiguation (coarse-pointer devices):**

- **FR-007**: Touch interactions in the star field MUST distinguish between scrolling gestures and deliberate taps. A touch that moves more than a defined movement threshold (expressed in device-independent/CSS pixels) from its start position MUST NOT trigger a star-click.
- **FR-008**: Any `touchmove` event where vertical delta exceeds horizontal delta (indicating a scroll gesture) MUST immediately cancel the tap candidate, regardless of whether the total distance has exceeded the movement threshold.
- **FR-009**: A deliberate star tap (stationary touch under 300ms, movement within threshold) MUST still open the project modal.
- **FR-010**: A long-press (touch held over 500ms without significant movement) MUST NOT trigger a star-click.

**Logo follow (fine-pointer devices):**

- **FR-011**: The logo MUST fade out at its current position when the cursor leaves the star field, instead of animating back to the header band.
- **FR-012**: The logo MUST fade back in at the cursor position when the cursor re-enters the star field after a fade-out.
- **FR-013**: On initial page load, the logo MUST be visible in the header band regardless of device type. Logo-follow behavior only activates after the first mouse entry into the star field.
- **FR-014**: The logo rotation MUST remain smooth and stable during cursor movement. Rotation angle MUST NOT be recalculated until cursor movement exceeds a minimum distance threshold sufficient to produce a reliable direction vector. This prevents tremor-induced jitter without requiring complex smoothing logic.
- **FR-015**: When the reticle activates (cursor hovers a star), the logo MUST fade out in place rather than animating position and rotation back to the header band. A debounce window (~80ms) MUST be applied before toggling the logo fade state, so that rapid reticle activation/deactivation (passing over multiple star hitboxes) does not produce visible flicker from repeated start/stop fade cycles.
- **FR-016**: Logo fade animations MUST NOT stack or restart mid-transition. Any new state change (fade-in or fade-out) MUST cancel or reuse any in-progress opacity animation. Quick cursor entry/exit cycles MUST NOT produce inconsistent opacity states.
- **FR-017**: When `prefers-reduced-motion` is active, all logo-follow opacity transitions MUST be immediate (instant show/hide) with no animation.

**Preservation:**

- **FR-018**: Fine-pointer star-click behavior (single click) MUST remain unchanged.
- **FR-019**: All existing keyboard navigation (Escape to close modal, Tab focus trap) MUST continue to work on all devices.
- **FR-020**: The modal close button MUST maintain a minimum 44x44 pixel tap target on all viewports (WCAG SC 2.5.5).
- **FR-021**: The logo-follow system MUST NOT degrade the star field, constellation lines, reticle, or any other visual feature. All existing hover effects, star scaling, and constellation line animations MUST continue to function normally.

### Assumptions

- The movement threshold for scroll-vs-tap disambiguation is expressed in CSS pixels (device-independent) and may need tuning based on device testing. A starting value of ~10 CSS pixels is reasonable but should be validated on high-DPI devices.
- Swipe-to-dismiss uses a simple touch-distance calculation on the modal header hit area, not a physics-based gesture library. Swipe detection is explicitly cancelled when modal content scrolling begins.
- The `prefers-reduced-motion` media query is already respected globally; new animations (logo fade, modal dismiss) will honor it. Logo-follow fade transitions are explicitly included.
- The 300ms tap duration and 500ms long-press thresholds are standard mobile interaction timings.
- Pointer capability is detected via `pointer: coarse`/`pointer: fine` media queries, matching the existing pattern used by logo-follow and interactions modules. Viewport width is only used for CSS layout hints.
- Body scroll locking uses a single mechanism (e.g., `overflow: hidden` on body with scroll position preservation). No dual techniques that could cause iOS Safari bounce bugs.
- The ~80ms reticle debounce window is short enough to feel responsive but long enough to absorb rapid hover cycling when gliding across stars.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of coarse-pointer users can close a project modal within 2 seconds of deciding to dismiss it (close button always visible, backdrop tap, or swipe-to-dismiss from header).
- **SC-002**: No modal opens during a detected scroll gesture — any touch where movement exceeds the threshold or vertical delta dominates is classified as scroll and produces no star-click.
- **SC-003**: Deliberate star taps on coarse-pointer devices still open modals successfully (tap recognition rate remains above 95% for stationary taps).
- **SC-004**: Desktop logo transitions (fade-out on leave, fade-in on re-enter) complete smoothly with no visible positional snap-back to the header band and no inconsistent opacity from stacked animations.
- **SC-005**: All modal interactions pass WCAG 2.1 Level AA: close button meets 44px minimum tap target, focus trap works, Escape key dismisses modal.
- **SC-006**: No performance regression: star field scrolling on coarse-pointer devices maintains 60fps with touch-guard logic active.
- **SC-007**: Modal renders correctly on notched devices (iPhone 12+, Pixel 6+) with no content obscured by hardware features.
- **SC-008**: Logo rotation remains stable during slow cursor movement — no visible jitter or unexpected spinning at any cursor speed.
- **SC-009**: Cursor passing along constellation lines (near multiple stars) produces smooth logo fade transitions with no flicker from rapid reticle cycling.
- **SC-010**: Body scroll position is preserved and restored after modal close — no scroll jump or iOS Safari rubber-band artifacts.
