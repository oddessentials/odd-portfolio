# Feature Specification: Brass Frame Optimization

**Feature Branch**: `006-brass-frame-optimization`
**Created**: 2026-03-05
**Status**: Draft
**Input**: Optimize brass frame border elements (corners, gauges, edges) to fix 5 visual flaws identified in design review.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corners Read as Structural Brackets (Priority: P1)

A visitor viewing the portfolio on desktop (1200px+) sees the four brass corner elements as sharp, opaque L-shaped brackets that seamlessly join the horizontal and vertical frame rails at each viewport corner. The brackets stay entirely within the frame's border zone and do not bleed into or look washed-out against the dark sidebar panels behind them.

**Why this priority**: The corners are the most visually prominent frame element and currently appear broken/ghostly at three of four positions (TL, TR, BL), directly undermining the "brass instrument housing" aesthetic that defines the brand.

**Independent Test**: Load the site at 1920x1080 and visually confirm all four corners appear as crisp, opaque L-shaped brackets with arms following the border edges. No transparent fade, no weak appearance against the dark sidebar.

**Acceptance Scenarios**:

1. **Given** a desktop viewport (1200px+), **When** the page loads and reveal animation completes, **Then** all four corners display as L-shaped brackets with arms matching the border width and extending along both adjoining edges.
2. **Given** any corner positioned adjacent to a sidebar panel, **When** viewing the corner, **Then** the corner appears fully opaque with no visible fade-to-transparent effect against the dark sidebar background.
3. **Given** the reveal animation sequence, **When** corners animate in, **Then** the existing staggered fly-in animation still works correctly with the new bracket shape.

---

### User Story 2 - Gauges Appear Mounted on Border Rails (Priority: P1)

A visitor sees the two side gauges (left and right) visually anchored to the vertical frame border rails, reading as instrument dials bolted onto or through the brass rail rather than floating disconnected in space.

**Why this priority**: The gauges are the most distinctive steampunk element (animated needle dials) and currently appear to float 10px away from the border, breaking the mechanical instrument metaphor.

**Independent Test**: Load the site at 1920x1080 and confirm both gauges appear centered on or straddling the vertical border edges. The gauge brass ring should visually overlap or connect to the border rail.

**Acceptance Scenarios**:

1. **Given** a desktop viewport, **When** viewing the left or right gauge, **Then** the gauge center aligns with or straddles the vertical border rail, with no visible gap between the gauge and the border.
2. **Given** the gauge's animated needle, **When** the reveal animation plays, **Then** the needle animation (elastic spring to position) still functions correctly at the new gauge size.
3. **Given** the reduced gauge size, **When** viewing the gauge face, **Then** the tick marks and needle remain legible and proportionally correct.

---

### User Story 3 - Extended Edge Coverage (Priority: P2)

With the reduced corner footprint, the horizontal and vertical brass edge rails extend further across the viewport perimeter, providing more continuous metallic border coverage and a more substantial frame appearance.

**Why this priority**: A secondary visual improvement that naturally follows from the corner resize. More continuous brass rail coverage strengthens the instrument housing metaphor.

**Independent Test**: Load the site and confirm edge rails extend closer to the viewport corners than before, with seamless joins to the L-shaped corner brackets.

**Acceptance Scenarios**:

1. **Given** the reduced corner size, **When** viewing any edge-to-corner junction, **Then** the edge rail meets the corner bracket arm seamlessly with matching material treatment (gradient direction, color stops).
2. **Given** the top edge, **When** viewing the Greek key meander band, **Then** the band extends further toward the corners than before, maintaining proper alignment.

---

### User Story 4 - Responsive Scaling (Priority: P2)

The optimized frame elements scale proportionally at the tablet breakpoint (768-1199px), maintaining correct proportions and visual quality. On mobile (below 768px), corners remain minimal and gauges stay hidden.

**Why this priority**: The existing responsive behavior already has breakpoints for corners and gauges; this ensures the new design scales correctly through them.

**Independent Test**: Resize the browser through tablet and mobile breakpoints and confirm corners scale proportionally and gauges resize or hide correctly.

**Acceptance Scenarios**:

1. **Given** a tablet viewport (768-1199px), **When** viewing the frame, **Then** corner brackets have arms matching the reduced border width, and gauges are proportionally smaller while remaining centered on the border rail.
2. **Given** a mobile viewport (below 768px), **When** viewing the frame, **Then** corners are minimal and gauges are hidden (existing behavior preserved).

---

### Edge Cases

- What happens when the viewport is extremely narrow (768-900px) and the sidebar width approaches the corner size?
- How do the L-shaped brackets render if the browser does not support `clip-path: polygon()`? (Graceful fallback to simple square corners.)
- What happens to the gauge face tick marks and needle at the smallest gauge size (32px at tablet)?
- How does the corner bracket appear during the reveal animation mid-flight (while partially translated)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Corner elements MUST display as L-shaped brackets with arm thickness equal to `--frame-border-width`.
- **FR-002**: Corner bracket arm length MUST equal exactly 2.5x `--frame-border-width` along each adjoining edge (e.g., 45px at desktop's 18px border, 30px at tablet's 12px border).
- **FR-003**: All corner brackets MUST use fully opaque background gradients with no transparent fade at any edge.
- **FR-004**: Corner brackets MUST have a hard material edge (1px border or shadow) on their interior edges where they meet the frame rail.
- **FR-005**: Corner rivet ornaments MUST be repositioned to sit on the bracket arms rather than at diagonal positions.
- **FR-006**: Gauge elements MUST be repositioned with their centerline at 0px offset from the border rail centerline (centered on the rail). The gauge rim MUST overlap 40-50% of the rail width on each side, so the rail appears to pass behind the gauge housing.
- **FR-007**: Gauge diameter MUST equal exactly 2.25x `--frame-border-width` (e.g., 40px at desktop's 18px border, 27px at tablet's 12px border).
- **FR-008**: Gauge face elements (tick marks, needle) MUST scale proportionally with the reduced gauge diameter.
- **FR-009**: Edge rails MUST extend to meet the new corner bracket boundaries, providing continuous brass coverage.
- **FR-010**: The existing reveal animation (corner fly-in, gauge scale-up, needle spring) MUST continue to function correctly with the new geometry.
- **FR-011**: All frame elements MUST remain purely decorative (aria-hidden, pointer-events: none) with no interactive behavior.
- **FR-012**: All frame materials MUST be procedurally generated (CSS gradients, box-shadows) with no external image files.
- **FR-013**: Responsive breakpoints MUST scale corner and gauge proportions appropriately (tablet: proportional reduction; mobile: minimal corners, gauges hidden).
- **FR-014**: Corner brackets MUST include a 1px interior shadow or bevel line along the inner edges where the bracket meets the adjoining edge rail, visually separating the bracket joint from the continuous rail surface.

### Key Entities

- **Corner Bracket**: L-shaped brass bracket element at each viewport corner, joining two perpendicular frame edge rails. Arm thickness = `--frame-border-width`, arm length = 2.5x `--frame-border-width`. Interior bevel separates bracket from rail.
- **Gauge Assembly**: Circular instrument dial mounted on a vertical frame edge rail. Diameter = 2.25x `--frame-border-width`, centerline at rail center (0px offset), rim overlaps 40-50% of rail. Rail passes behind gauge housing.
- **Edge Rail**: Linear brass bar connecting corner brackets along each viewport side. Defined by width (border-width variable) and material gradient.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four corner brackets are fully visible and visually distinct against any background (sidebar or starfield) at all supported viewports (768px+).
- **SC-002**: Both side gauges appear visually connected to the border rail with no perceptible gap between the gauge and the rail at desktop (1200px+) and tablet (768-1199px) viewports.
- **SC-003**: The frame's total rendering element count remains at or below the current count (13 DOM elements + 18 pseudo-elements = 31 items), ensuring no HTML bloat.
- **SC-004**: The reveal animation sequence (corner fly-in, gauge scale, needle spring) completes without visual glitches at the new element sizes and positions.
- **SC-005**: All frame elements pass visual inspection for material consistency: matching gradient directions between corners and adjoining edges, consistent lighting model, opaque surfaces throughout.
- **SC-006**: The Greek key meander band and header logo band maintain correct positioning and alignment with the extended edge coverage.
- **SC-007**: No external image files are introduced; all visual treatments remain CSS-procedural (gradients, shadows, clip-paths).

## Assumptions

- The existing HTML structure (4 corners, 4 edges, 2 gauges, 1 Greek key, 1 header band inside `.frame`) is sufficient; no new DOM elements are required for corners.
- The `clip-path: polygon()` CSS property is supported in all target browsers (Chrome 55+, Firefox 54+, Safari 9.1+, Edge 79+).
- The existing per-corner lighting model (specular highlight facing the exterior) is intentional and should be preserved rather than switching to a global light direction.
- Gauge pseudo-elements (`::before` for face, `::after` for needle) will be reused at the new size; no new pseudo-elements are needed for gauge mounting.
- The `--frame-corner-size` CSS custom property controls both the corner element dimensions and the edge rail inset positions; changes to it will cascade correctly through both.

## Scope Boundaries

### In Scope
- Corner element shape, size, gradient, and clip-path redesign
- Gauge repositioning, resizing, and proportional scaling of face/needle
- Edge rail extension to meet new corner boundaries
- Responsive scaling at tablet (768-1199px) and mobile (below 768px) breakpoints
- Reveal animation compatibility verification

### Out of Scope
- Sidebar visual design or opacity changes
- Z-index stack modifications (already addressed in prior work)
- Greek key meander band redesign (already optimized)
- Frame edge engraving or shimmer animation changes
- New interactive behaviors on frame elements
- Logo or header band modifications
