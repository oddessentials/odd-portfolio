# Feature Specification: Gauge Enhancement — Victorian Instrument Upgrade

**Feature Branch**: `010-gauge-enhancement`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Enhance brass gauges with zone-colored faces, SVG detailing, Victorian instrument aesthetics, and refined needle animations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zone-Colored Gauge Faces (Priority: P1)

As a visitor scrolling through the portfolio, I see both gauges' inner faces divided into four colored segments — one dark (rest) and three matching the constellation zones. As I scroll into each zone, the needles on both gauges point at the segment whose color matches the active constellation zone. The left and right gauge faces mirror each other so that despite their needles moving in opposite directions, both always indicate the same active zone.

**Why this priority**: This is the core enhancement — transforming static dark gauge faces into dynamic, zone-aware instruments that reinforce the scroll-driven exploration narrative. Without this, the gauges are decorative only.

**Independent Test**: Can be fully tested by scrolling through all zones and verifying both needles point at the matching color segment. Delivers immediate visual feedback linking gauges to constellation navigation.

**Acceptance Scenarios**:

1. **Given** the page is loaded at rest (no scroll), **When** the visitor views either gauge, **Then** both needles point at the dark/black segment (rest position)
2. **Given** the visitor scrolls into Zone 0 (DevOps & Engineering), **When** the zone transition completes, **Then** both needles point at the blue-violet segment on their respective gauge faces
3. **Given** the visitor scrolls into Zone 1 (Applications & Products), **When** the zone transition completes, **Then** both needles point at the warm-gold segment
4. **Given** the visitor scrolls into Zone 2 (Community & Web), **When** the zone transition completes, **Then** both needles point at the green-teal segment
5. **Given** the left gauge face is viewed alongside the right gauge face, **When** compared, **Then** the segment order is mirrored (reversed) so that needle directions converge on the same zone color
6. **Given** the active zone segment is visible, **When** the zone is active, **Then** the active segment appears slightly brighter or glowing compared to inactive segments

---

### User Story 2 - Enhanced Victorian Aesthetics (Priority: P2)

As a visitor, I see the gauges rendered as detailed Victorian brass instruments with visible tick marks, graduation lines along segment boundaries, an embossed brass bezel ring, and a subtle glass dome effect — consistent with the site's techno-mage theme.

**Why this priority**: Visual fidelity elevates the entire frame from "CSS circles" to "authentic instruments," reinforcing the brand identity. This builds on P1's colored face by adding the detail layer.

**Independent Test**: Can be tested by visual inspection — gauge faces show tick marks at segment boundaries, bezel has embossed highlight/shadow, and a subtle specular highlight suggests glass curvature.

**Acceptance Scenarios**:

1. **Given** a gauge is visible, **When** the visitor inspects it, **Then** brass tick marks appear at the boundary between each zone segment
2. **Given** a gauge is visible, **When** the visitor inspects the outer ring, **Then** the bezel has a multi-tone brass gradient with inset shadow creating an embossed appearance
3. **Given** a gauge is visible, **When** the visitor inspects the face, **Then** a subtle off-center specular highlight suggests a convex glass dome over the face
4. **Given** minor graduation lines are present, **When** the visitor counts them, **Then** there are consistent sub-divisions within each segment (matching Victorian instrument conventions)

---

### User Story 3 - Animation Refinements (Priority: P3)

As a visitor watching the gauges, I see subtle micro-tremor oscillation of the needles when idle (giving a "live instrument" feel), a faint glow pulse on the active zone segment during zone transitions, and all animations gracefully degrade under reduced-motion preferences or on low-performance devices.

**Why this priority**: Animation polish adds life to the instruments but is not essential for the core zone-indication functionality. Reduced-motion compliance is a hard requirement but the animations themselves are enhancement-tier.

**Independent Test**: Can be tested by observing needle behavior at rest (micro-tremor visible), triggering a zone change (glow pulse visible), and enabling reduced-motion preference (all secondary animations suppressed).

**Acceptance Scenarios**:

1. **Given** the page is at rest with no scroll activity, **When** the visitor watches a needle, **Then** the needle exhibits a very subtle oscillation (micro-tremor) around its rest angle
2. **Given** the visitor scrolls into a new zone, **When** the zone transition occurs, **Then** the active segment briefly pulses with increased brightness before settling
3. **Given** the user has reduced-motion enabled, **When** any gauge animation would fire, **Then** the animation is replaced with an instant state change (no motion)
4. **Given** the device is classified as performance tier 3 (low-end), **When** any gauge animation would fire, **Then** all animations use instant fallbacks
5. **Given** the mouse moves across the viewport, **When** parallax is active, **Then** the glass dome specular highlight shifts subtly with mouse position (performance permitting)

---

### Edge Cases

- What happens when the viewport is resized across the 768px mobile breakpoint while a zone is active? Gauges should hide cleanly and restore state when crossing back above 768px.
- How do gauges behave during the initial reveal animation sequence? They must integrate with the existing reveal timeline (scale from 0, fade in, needle sweep from -135deg to rest).
- What happens if the user scrolls rapidly through all three zones? Zone transitions should not stack or produce visual artifacts — only the final zone state should render.
- What happens if the page loads with scroll position already mid-zone (e.g., browser restore)? The gauges should immediately show the correct zone color and needle position without animation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each gauge face MUST be divided into exactly 4 angular segments spanning the full 360 degrees, corresponding to: rest/dark (#0D0B09), blue-violet (#6B40A1), warm-gold (#B8870A), and green-teal (#1A9E8F)
- **FR-002**: The left gauge face segments MUST be arranged so that the needle at its rest angle (15deg) points at the dark segment, at 55deg points at blue-violet, at 95deg points at warm-gold, and at 135deg points at green-teal
- **FR-003**: The right gauge face segments MUST mirror the left gauge so that despite opposite needle direction (rest 30deg, zone0 -10deg, zone1 -50deg, zone2 -90deg), both needles always indicate the same active zone color
- **FR-004**: The active zone segment MUST appear visually distinct from inactive segments — slightly brighter, with a subtle glow effect
- **FR-005**: Segment boundaries MUST have visible brass tick marks consistent with Victorian instrument aesthetics
- **FR-006**: The gauge bezel MUST have a multi-tone brass gradient with inset shadows creating an embossed, three-dimensional appearance
- **FR-007**: A glass dome effect MUST be rendered as a subtle off-center specular highlight overlay on the gauge face
- **FR-008**: Needles MUST exhibit a subtle micro-tremor oscillation when idle (amplitude small enough to stay within the current segment)
- **FR-009**: Zone transitions MUST trigger a brief brightness pulse on the newly active segment
- **FR-010**: All secondary animations (micro-tremor, glow pulse, glass shift) MUST be suppressed when reduced-motion preference is active or device is performance tier 3
- **FR-011**: Gauges MUST remain in their current positions (left at 35% top, right at 80% top) and MUST be hidden below 768px viewport width
- **FR-012**: The existing needle animation behavior MUST be preserved: elastic.out(1, 0.4) easing, 0.8s duration, CSS custom property --needle-angle driven by GSAP
- **FR-013**: The existing reveal sequence integration MUST be preserved: gauges scale from 0 with needle sweep during the intro animation
- **FR-014**: Zone color data MUST be sourced from CONSTELLATION_ZONES in data.js (nebulaHueRgb arrays), not hardcoded
- **FR-015**: No new JavaScript dependencies MUST be introduced — implementation uses existing GSAP + CSS custom properties only

### Key Entities

- **Gauge Face**: The circular inner area of each gauge, divided into 4 colored angular segments. Each segment corresponds to a navigation phase (rest + 3 constellation zones)
- **Segment**: A wedge-shaped area within the gauge face, defined by start/end angles and a zone color. Has active/inactive visual states
- **Needle**: The existing animated pointer element (CSS ::after pseudo-element) driven by --needle-angle custom property. Points at the active segment
- **Bezel**: The outer ring of the gauge providing the brass instrument frame. Enhanced with multi-tone gradient and embossed shadows
- **Glass Dome**: A visual overlay effect suggesting a convex glass cover over the gauge face, rendered as a specular highlight

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both gauge faces display 4 distinct colored segments visible at default viewport size, and both needles correctly indicate the active zone color across all 4 states (rest + 3 zones)
- **SC-002**: Gauge enhancements introduce zero additional draw calls (gauges remain pure DOM elements) and cause no measurable increase in layout thrash during scroll
- **SC-003**: All gauge animations (micro-tremor, glow pulse, glass shift) are fully suppressed under reduced-motion preference, with instant state fallbacks
- **SC-004**: The existing reveal animation sequence continues to work without modification to its timeline structure — gauges appear and needles sweep as before
- **SC-005**: Rapid scrolling through all 3 zones produces no visual artifacts, stacking animations, or stuck states — only the final zone state renders
- **SC-006**: Visual inspection confirms Victorian instrument aesthetic: brass tick marks, embossed bezel, glass dome highlight all visible and consistent with site theme
- **SC-007**: Gauges hide cleanly at viewport widths below 768px and restore correct state when returning above 768px

## Assumptions

- The 4 segments divide 360 degrees into variable widths: 40 degrees each for the 3 zone-color segments (centered on their needle angles) and 240 degrees for the dark rest segment. Equal 90-degree segments are mathematically impossible given the 40-degree spacing between needle angles (see research.md R1 for proof).
- Zone colors are derived from the existing nebulaHueRgb values in data.js, converted to hex for CSS usage. The rest/dark segment uses --color-frame-bg (#0D0B09).
- "Mirrored" gauge faces means the segment angular order is reversed between left and right gauges, not that the visual content is literally flipped.
- Glass dome effect is purely decorative (CSS gradient overlay), not an actual 3D rendering or canvas element.
- Micro-tremor amplitude is approximately 1-2 degrees — perceptible but not distracting.
- The glow pulse on zone change is a brief (0.3-0.5s) brightness increase on the active segment, not a persistent pulsing animation.
- Performance tier and reduced-motion checks use the existing infrastructure (getCurrentTier(), prefersReducedMotion media query) — no new detection mechanisms needed.
