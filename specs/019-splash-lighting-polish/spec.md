# Feature Specification: Splash Lighting Polish

**Feature Branch**: `019-splash-lighting-polish`
**Created**: 2026-03-08
**Status**: Draft
**Input**: Multi-agent specialist team review of splash gate scene lighting, shadowing, atmospheric depth, color coherence, and cinematic composition.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Warm Chamber Lighting (Priority: P1)

When a first-time visitor arrives at the splash gate, the glow emanating from behind the door reads as warm candlelit chamber light — amber and gold tones dominate the doorway, with cool tones only at the farthest periphery. The scene immediately communicates "mysterious lit room beyond a stone door" rather than "sci-fi portal."

**Why this priority**: The color temperature of the glow is the single most impactful element defining the scene's mood. A warm-dominant glow transforms the entire narrative from digital to medieval. This is the foundation all other lighting improvements build on.

**Independent Test**: Can be verified by loading the splash gate and confirming the glow behind the door is predominantly warm amber/gold, with no visible cyan or green cycling through rainbow hues. The glow should oscillate gently within a narrow warm range.

**Acceptance Scenarios**:

1. **Given** a first-time visitor loads the page, **When** the splash gate renders, **Then** the glow visible through the arch peak and around the door is warm amber/gold — not cyan, green, or any cool-dominant color.
2. **Given** the glow animation is cycling, **When** observed over a full animation period, **Then** the hue oscillates within a narrow warm range (gold to amber) — never cycling through blue, green, magenta, or other cool/unrelated hues.
3. **Given** the inner glow behind the door is visible, **When** examining the glow gradient, **Then** the center is the brightest warm tone and falloff transitions through darker amber to darkness — with no contradictory cyan band.

---

### User Story 2 - Depth & Shadow Realism (Priority: P1)

The splash scene communicates physical depth — the stone archway projects forward from the wall, the door sits recessed behind the archway frame, and the desk is deep inside a dim chamber. Shadows at architectural junctions (archway base, lintel, door jamb, threshold) reinforce that these are solid objects in a three-dimensional space.

**Why this priority**: Without depth cues, all layers appear pasted on the same flat plane regardless of how beautiful the individual assets are. Shadows are the primary mechanism the human eye uses to perceive spatial relationships.

**Independent Test**: Can be verified by examining the scene for visible shadow cues where the archway meets the wall, where the door sits within the frame, and at the door's base. The desk behind the door should appear dim and distant, not at the same brightness/sharpness as the foreground.

**Acceptance Scenarios**:

1. **Given** the splash gate is rendered, **When** examining the archway, **Then** there is a visible shadow cast by the archway onto the door surface, respecting the transparent arch opening shape.
2. **Given** the splash gate is rendered, **When** examining the door within the archway, **Then** the door edges show shadow cues suggesting it is recessed behind the stone frame.
3. **Given** the desk is visible behind the open door (desktop only), **When** comparing the desk to the foreground door and archway, **Then** the desk appears noticeably dimmer, slightly desaturated, and less sharp — as if viewed through atmospheric haze in a dim room.
4. **Given** the splash gate is rendered, **When** examining the door base, **Then** there is a visible contact shadow where the door meets the stone threshold.

---

### User Story 3 - Backdrop Lighting & Vignette (Priority: P2)

The stone wall backdrop behind the archway is lit in a way that suggests warm light spilling from the doorway — brighter near the center, falling into deep darkness at the edges. The stone tile texture is visible near the archway but nearly invisible at the periphery. A natural vignette frames the scene and draws the eye to the illuminated doorway.

**Why this priority**: The backdrop establishes the environmental context. Correct lighting logic on the wall sells the single-source-of-light narrative and masks tile repetition at wider viewports.

**Independent Test**: Can be verified by loading the splash at various viewport widths (1920px, 2560px, 3840px). The stone texture should be visible near the archway center but fade into near-black at the edges, with no obviously repeating tile seams.

**Acceptance Scenarios**:

1. **Given** the splash gate is rendered on a wide desktop viewport, **When** examining the backdrop, **Then** the stone wall is brightest near the archway center and progressively darker toward the edges.
2. **Given** the splash gate is rendered at ultrawide resolution (3840px+), **When** examining the far left/right backdrop edges, **Then** the stone tile is nearly invisible — swallowed by darkness — with no obvious tiling seam visible.
3. **Given** the scene is rendered, **When** examining the overall composition, **Then** a natural vignette (darker corners/edges) frames the archway as the focal point.

---

### User Story 4 - Cinematic Door Open Sequence (Priority: P2)

When the user clicks the door and it swings open, the lighting progression is physically correct and dramatically satisfying. The glow intensifies as more light is revealed, transitions from cool-mysterious to warm-chamber, and the desk gradually becomes visible as if the viewer's eyes are adjusting to the dim interior.

**Why this priority**: The door open is the climactic interaction — the payoff for the user's curiosity. The lighting progression during this 2-second sequence determines whether the moment feels magical or mechanical.

**Independent Test**: Can be verified by clicking the door and observing the glow progression. The glow should never dim when the door starts opening, should transition to warm tones as the chamber is revealed, and the desk should brighten gradually (not appear at full brightness instantly).

**Acceptance Scenarios**:

1. **Given** the user clicks the door, **When** the door begins its initial inward pull (first 300ms), **Then** the glow holds steady or slightly increases — it does not dim.
2. **Given** the door is swinging open, **When** the door reaches mid-swing (~45 degrees), **Then** the glow has transitioned from its initial chromatic state toward a warmer brass/gold tone.
3. **Given** the door has swung fully open, **When** the glow reaches peak intensity, **Then** the entire glow is warm-dominant (brass/amber) — any cool tones from the initial state have been replaced.
4. **Given** the desk is visible during door swing (desktop), **When** the door moves past 30 degrees, **Then** the desk brightness increases gradually as if the room is being progressively revealed — it does not appear at full brightness instantly.

---

### User Story 5 - Scene Atmosphere & Life (Priority: P3)

Before the user interacts, the splash scene feels alive — not a static photograph. Subtle, barely perceptible animations suggest torchlight instability. On desktop devices with a mouse, hovering the door provides visual feedback beyond the cursor change. The scene fades up from black on initial load rather than appearing fully formed.

**Why this priority**: These are polish elements that elevate the scene from "well-composed layout" to "immersive portal." They are additive — the scene works without them, but with them it feels inhabited.

**Independent Test**: Can be verified by loading the splash and observing the scene for 5 seconds without interacting. Subtle light movement should be perceptible. On desktop, hovering the door should produce a visible response.

**Acceptance Scenarios**:

1. **Given** the splash gate loads for a first-time visitor, **When** the scene first appears, **Then** it fades up from black over approximately 600-800ms rather than appearing instantly at full brightness.
2. **Given** the splash gate is idle (no user interaction), **When** observing the glow for 5+ seconds, **Then** a subtle, barely perceptible flicker/breathing animation is visible — simulating torch instability.
3. **Given** a desktop user with a mouse hovers over the door area, **When** the cursor enters the door container, **Then** there is a visible but subtle visual response (brightness shift, gentle glow pulse, or similar feedback).
4. **Given** the inner glow and outer glow are both animating, **When** comparing their timing, **Then** they are not synchronized — they breathe at slightly different rates, creating organic rather than mechanical movement.

---

### User Story 6 - Edge Softening & Material Integration (Priority: P3)

The transitions between scene layers are smooth and natural — no visible compositing seams, hard pixel boundaries, or flat color bands that break the illusion of a continuous stone chamber environment. The door brightness/saturation is consistent with the surrounding stone's ambient light level.

**Why this priority**: Hard edges and brightness mismatches are the most common immersion breakers in composited scenes. This polish pass addresses the "last 10%" that separates a clever layout from a convincing environment.

**Independent Test**: Can be verified by examining the archway edges, the scene side panels, and the door brightness relative to the stone. No hard pixel boundaries or obvious compositing seams should be visible.

**Acceptance Scenarios**:

1. **Given** the splash gate is rendered, **When** examining the left/right edges of the archway image, **Then** the stone fades smoothly into the surrounding darkness — no hard pixel boundary is visible.
2. **Given** the splash gate is rendered, **When** examining the scene side panels (between archway and backdrop), **Then** the transition from scene background to backdrop is smooth — no visible color band or compositing seam.
3. **Given** the door and archway are visible, **When** comparing brightness and saturation, **Then** the door does not appear self-illuminated or significantly warmer than the surrounding stone — it appears to exist under the same ambient light.

---

### Edge Cases

- What happens when the user has `prefers-reduced-motion: reduce` enabled? All new animations (breathing, entrance fade, hover feedback) must be suppressed — only the instant fade dismissal behavior is shown.
- What happens on mobile devices (<768px)? No hover feedback, no desk atmospheric treatment (desk is already hidden), no cursor changes. The scene should still benefit from the static lighting fixes (glow color, shadows, vignette, backdrop).
- What happens if the user clicks the door during the entrance fade animation? The door click should still be captured and processed — the entrance animation should not delay interactivity.
- What happens on very wide viewports (4K, ultrawide 5120px)? The vignette and backdrop darkening should mask tile repetition effectively at any width.
- What happens on low-power devices? Image filters (blur, brightness, saturate) may impact compositing performance. These must not cause dropped frames on integrated GPUs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The inner glow gradient MUST use warm amber/gold as the dominant center color, with any cool tones pushed to faint outer accents only.
- **FR-002**: The outer chromatic glow MUST have warm brass as the innermost/strongest layer and cool tones as outermost/weakest — the current inverted order must be corrected.
- **FR-003**: The glow hue animation MUST be constrained to a narrow warm range (approximately 30-40 degree oscillation within the gold-to-amber spectrum) — not a full 360-degree rainbow cycle.
- **FR-004**: The archway MUST cast a visible shadow onto the door surface, using a shadow technique that respects the transparent arch opening (shadow only from opaque stone regions).
- **FR-005**: The door container MUST show shadow cues indicating it is recessed within the stone archway frame (recess shadow on edges and contact shadow at the base).
- **FR-006**: The scene MUST include an inset shadow or vignette where the archway frame meets the surrounding wall, simulating depth at the architectural junction.
- **FR-007**: The wizard desk image (desktop only) MUST appear dimmer, slightly desaturated, and subtly blurred compared to the foreground — simulating atmospheric perspective in a dim room.
- **FR-008**: The door image MUST be slightly dimmed and desaturated to match the ambient light level of the surrounding stone — it should not appear self-illuminated.
- **FR-009**: The backdrop radial gradient MUST be lighter at the center (near the archway) and darker at the edges — the opposite of the current treatment — to simulate light spilling from the doorway onto the surrounding wall.
- **FR-010**: The backdrop outer gradient stops MUST be opaque enough (approximately 85-90%) that the stone tile texture is nearly invisible at the periphery, creating a strong vignette.
- **FR-011**: The door container MUST have a warm rim-light effect (subtle warm glow on edges) simulating backlight from the chamber behind it.
- **FR-012**: During the door open animation Beat 1 (initial inward pull), the glow MUST NOT decrease in intensity — it must hold steady or slightly increase.
- **FR-013**: During the door open animation Beat 3 (full swing), the glow color MUST transition entirely to warm brass/amber — all cool chromatic tones from the initial state must be replaced.
- **FR-014**: A dark radial-gradient vignette MUST overlay the scene to frame the archway as the focal point and help mask tile repetition.
- **FR-015**: A subtle glow breathing animation MUST simulate torch flicker (approximately 2-3% opacity oscillation at an irregular period), with inner and outer glows animating at different rates.
- **FR-016**: On desktop devices with fine pointer, hovering the door MUST produce a subtle visual response (brightness boost, glow pulse, or similar) beyond the existing cursor change.
- **FR-017**: The splash scene MUST fade up from black on initial load (approximately 600-800ms) rather than appearing at full brightness instantly.
- **FR-018**: The scene edge-fade transitions MUST be smooth and responsive — no hard pixel boundaries on archway edges, no visible compositing seams between scene and backdrop layers.
- **FR-019**: The rim light on the door MUST intensify during the door open animation as more chamber light is revealed.
- **FR-020**: All new animations (FR-015, FR-016, FR-017) MUST be suppressed when `prefers-reduced-motion: reduce` is active — only existing reduced-motion behavior (instant fade) is shown.
- **FR-021**: All existing functionality MUST be preserved with zero regressions — focus trap, keyboard navigation, door click interaction, parchment text display, loading state, audio playback, localStorage dismissal, and mobile behavior must work identically to the current implementation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 5 out of 5 specialist reviewers (or equivalent independent observers) rate the scene's lighting as "warm chamber" rather than "sci-fi portal" when shown the updated splash gate.
- **SC-002**: No visible tile repetition seams at desktop viewport widths up to 3840px — stone texture fades into darkness at the periphery.
- **SC-003**: The door open sequence maintains 60fps on desktop with integrated GPU — no dropped frames from additional shadow or filter properties.
- **SC-004**: All existing accessibility features (focus trap, keyboard navigation, reduced-motion support, screen reader labels) pass identical manual testing as before this change.
- **SC-005**: The scene renders correctly across Chrome, Firefox, Safari (desktop), and mobile Safari/Chrome — no visual breakage from new properties (filters, drop-shadow, mask-image, mix-blend-mode).
- **SC-006**: First-time visitors experience a smooth fade-from-black entrance rather than an instant fully-formed scene appearance.
- **SC-007**: The splash gate dismissal flow (click door, door swings, splash fades, portfolio reveals) completes in the same total time as before (approximately 2.4 seconds) — no added delay from new animations.

## Assumptions

- The existing splash gate DOM structure remains unchanged — all enhancements are property additions/modifications and animation parameter changes to the existing elements.
- No new image assets are needed — all improvements are achievable with gradients, shadows, filters, blend modes, and animation parameter tuning.
- The existing animation timeline structure (4-beat door open) is preserved — only the property values within each beat are adjusted.
- Filter, drop-shadow, mix-blend-mode, and mask-image have sufficient browser support for the project's target browsers (modern Chrome, Firefox, Safari).
- The breathing/flicker animation requires no additional logic — it can be achieved with keyframe animations on existing elements.
- Mobile devices (<768px) already skip the desk and cursor — they benefit from the static lighting fixes (glow color, shadows, backdrop) but not from hover or desk atmospheric effects.

## Scope Boundaries

**In scope**:
- Style property additions/modifications in the splash-gate section of the stylesheet
- Animation parameter changes in the door-open animation function
- New keyframe animations for breathing/flicker effects
- New pseudo-elements for vignette, warm wash overlay, and entrance fade
- Door hover state (transition, fine-pointer gated)

**Out of scope**:
- New image assets or asset modifications
- Changes to the splash gate DOM structure
- New dependencies
- Changes to any non-splash-gate styles or logic
- Changes to the portfolio content behind the splash
- Audio changes
- Mobile-specific layout changes
