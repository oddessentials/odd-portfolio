# Feature Specification: Beta 0.1.0 — Portfolio Polish & Bug Fixes

**Feature Branch**: `003-beta-portfolio-polish`
**Created**: 2026-03-04
**Status**: Draft
**Version**: Beta 0.1.0
**Input**: Transform Alpha Arcane Console into production-ready portfolio with real project names, terminal loading animation, Greek key border, and two critical bug fixes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Interact with All Stars Across the Full Viewport (Priority: P1)

A visitor moves their mouse across the starfield to discover projects. They hover over stars on both the left and right sides of the screen. Every star responds with a hover label and is clickable regardless of its horizontal position on the viewport.

**Why this priority**: This is a critical bug fix. Currently users cannot interact with stars on the left side of the starfield, making 3 of 7 projects unreachable via direct star interaction. This fundamentally breaks the core interaction model.

**Independent Test**: Can be verified by hovering over all 7 stars from left to right across the viewport and confirming each one displays its hover label and responds to clicks.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded on a 1920×1080 desktop viewport, **When** the user moves their mouse over a star positioned on the left side of the screen (e.g., odd-fintech at x=-2.2), **Then** the star's hover label appears and the cursor changes to pointer.
2. **Given** the portfolio is loaded, **When** the user clicks any of the 7 stars, **Then** the project detail panel opens with the correct project content.
3. **Given** the left sidebar is visible, **When** the user moves their mouse from the sidebar area into the starfield, **Then** star hover detection works immediately without any dead zone or offset.

---

### User Story 2 — View All Stars on Any Screen Size (Priority: P1)

A visitor opens the portfolio on a tablet, phone, or narrow browser window. All 7 project stars remain visible within the starfield, maintaining their relative spatial arrangement. No stars disappear when the viewport changes from wide to narrow.

**Why this priority**: This is a critical bug fix. Currently 5 of 7 stars disappear on portrait mobile screens, making the portfolio effectively broken on mobile devices.

**Independent Test**: Can be verified by resizing the browser from 1920px wide down to 320px wide and confirming all 7 stars remain visible at every width.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded on a 390×844 mobile viewport, **When** the starfield renders, **Then** all 7 project stars are visible within the viewport.
2. **Given** the portfolio is loaded at 1920px wide, **When** the user resizes the browser to 768px wide, **Then** all 7 stars remain visible and their relative spatial arrangement is preserved (no sudden jumps, no overlaps).
3. **Given** the user rotates a tablet from landscape to portrait, **When** the viewport changes, **Then** stars smoothly reposition to remain visible.

---

### User Story 3 — Understand Projects Before Clicking (Priority: P2)

A first-time visitor sees the left sidebar navigation with real project names and brief descriptions. Before clicking, they can read a short tagline for each project to understand what it does. On desktop, descriptions appear on hover. On mobile, a first tap previews the description and a second tap opens the full project panel.

**Why this priority**: The Alpha used fantasy constellation names ("The Forge Septet") that told users nothing about the actual projects. Real names + descriptions are essential for the portfolio to serve its business purpose.

**Independent Test**: Can be verified by hovering over each sidebar button on desktop and confirming a project description appears, then clicking to open the full panel.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded on desktop, **When** the user reads the left sidebar, **Then** they see "ODD PORTFOLIO" as the header and each button shows a real project name (e.g., "odd-ai-reviewers") with a short description (e.g., "AI code review pipeline").
2. **Given** the user hovers over a sidebar button on desktop, **When** the tagline expands, **Then** it appears within 300ms with a smooth animation.
3. **Given** the portfolio is loaded on mobile, **When** the user opens the hamburger menu and taps a project button for the first time, **Then** the tagline preview expands without opening the full panel.
4. **Given** a tagline is expanded on mobile, **When** the user taps the same button again, **Then** the full project detail panel opens.
5. **Given** a tagline is expanded on mobile, **When** the user taps a different button, **Then** the previous tagline collapses and the new one expands.

---

### User Story 4 — Experience the Terminal Loading Sequence (Priority: P2)

When the portfolio loads, the right sidebar displays an animated terminal-style scanning sequence. It cycles through all 7 project names with a progress indicator, culminating in a "Portfolio Ready" state. The animation runs in the background without blocking user interaction.

**Why this priority**: The terminal loading animation transforms a static status panel into an engaging, thematic experience that reinforces the brand identity and creates anticipation during the initial load.

**Independent Test**: Can be verified by loading the portfolio and observing the right sidebar animation runs to completion while simultaneously clicking sidebar buttons to confirm interaction is not blocked.

**Acceptance Scenarios**:

1. **Given** the portfolio is loading, **When** the reveal sequence reaches the status panel phase, **Then** the right sidebar displays "ODD ESSENTIALS" as its header and begins scanning project names one by one.
2. **Given** the terminal scan is running, **When** each project is scanned, **Then** a progress indicator updates proportionally (14%, 28%, 43%, 57%, 71%, 86%, 100%).
3. **Given** the terminal scan completes, **When** all 7 projects have been scanned, **Then** the status shows "7 systems nominal" and "PORTFOLIO READY" with a brief visual flourish.
4. **Given** the terminal scan is running, **When** the user clicks a sidebar button or star, **Then** the project panel opens normally — the scan does not block interaction.
5. **Given** the user has reduced motion preferences enabled, **When** the portfolio loads, **Then** the terminal shows the final "PORTFOLIO READY" state immediately without animation.

---

### User Story 5 — Greek Key Border Enhancement (Priority: P3)

The top border of the steampunk frame displays a Greek key (meander) pattern instead of the previous rivet strip. The pattern uses the same brass/gold material language as the rest of the frame, with a subtle shimmer animation that catches the light.

**Why this priority**: This is a visual polish enhancement that elevates the frame's classical aesthetics. It builds on the existing frame without changing functionality.

**Independent Test**: Can be verified by loading the portfolio and visually confirming the top border shows a repeating Greek key pattern in brass tones with a subtle shimmer sweep.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded on desktop, **When** the user looks at the top border, **Then** they see a repeating Greek key (meander) pattern in brass/gold tones.
2. **Given** the Greek key is visible, **When** 2 seconds pass after the reveal completes, **Then** a subtle shimmer highlight sweeps across the pattern.
3. **Given** the user has reduced motion preferences enabled, **When** the portfolio loads, **Then** the Greek key pattern is visible but the shimmer animation is disabled.
4. **Given** the portfolio is viewed on a mobile device (<768px), **When** the frame renders, **Then** the Greek key band is hidden to reduce visual clutter at small scales.

---

### User Story 6 — Updated Brand Messaging (Priority: P3)

The portfolio displays updated brand language throughout. The command line types "Force multipliers for small businesses..." instead of the previous "anomalies" message. All fantasy-themed text is replaced with professional brand language while preserving the steampunk aesthetic.

**Why this priority**: Brand messaging alignment is important but lower priority than interaction fixes and core feature additions.

**Independent Test**: Can be verified by loading the portfolio and reading all visible text to confirm brand-appropriate language throughout.

**Acceptance Scenarios**:

1. **Given** the reveal sequence completes and the discoverability affordance plays, **When** the command line types text, **Then** it displays "Force multipliers for small businesses..." (43 characters including ellipsis).
2. **Given** the portfolio is loaded, **When** the user reads the right sidebar header, **Then** it says "ODD ESSENTIALS" (not "Arcane Console").
3. **Given** a screen reader user navigates the page, **When** they reach the navigation landmark, **Then** it is labeled "Project portfolio navigation" (not "constellation navigation").

---

### Edge Cases

- What happens when the user resizes from desktop to mobile width while the terminal scan animation is still running? — The scan continues to completion in the background; on mobile the status panel is hidden so the animation has no visual impact.
- What happens when the user skips the reveal sequence (Skip button or S key) during the terminal scan? — The reveal jumps to completion; the terminal scan spawns and runs at normal speed as a pleasant background effect.
- What happens when a sidebar button is hovered while the tagline animation from a previous hover is still in progress? — The in-progress animation is killed and the new hover animation begins immediately (no stacking).
- How does the Greek key pattern render at the tablet breakpoint (768–1199px)? — The pattern scales to a smaller tile size and narrower line weight but remains visible.
- What happens on a device where mouse hover is unavailable (touch-only tablet at >768px)? — Hover effects only apply on devices with actual hover capability. Touch tablets use the first-tap/second-tap pattern.
- What happens when the user interacts with the mana meter? — The mana meter remains static and non-interactive (unchanged from Alpha). It is retained as a decorative element for now.

## Requirements *(mandatory)*

### Functional Requirements

**Bug Fixes — Interaction (P0)**

- **FR-001**: The mouse interaction hitzone MUST cover the full viewport area so that stars at any horizontal position are hoverable and clickable, regardless of sidebar placement.
- **FR-002**: The star hover detection MUST include a tolerance zone around each star center to make hover feel responsive rather than pixel-precise.
- **FR-003**: Sidebar panels MUST remain interactive (clickable, scrollable) and MUST NOT be blocked by the expanded interaction hitzone.

**Bug Fixes — Responsiveness (P0)**

- **FR-004**: All 7 star positions MUST remain within the visible camera area at all supported viewport sizes from 320px to 2560px wide.
- **FR-005**: Star positions MUST scale proportionally on narrow viewports to preserve the relative spatial arrangement of the constellation.
- **FR-006**: The background nebula volume MUST scale proportionally with star positions to maintain visual consistency.
- **FR-007**: Star positions MUST update smoothly on viewport resize with no visible jumping or teleportation.

**Left Sidebar — Content (P1)**

- **FR-008**: The left navigation header MUST read "ODD PORTFOLIO".
- **FR-009**: The navigation landmark MUST be labeled "Project portfolio navigation" for accessibility.
- **FR-010**: Each navigation button MUST display the project's canonical name (e.g., "odd-ai-reviewers", "Coney Island Pottsville") instead of fantasy constellation names.
- **FR-011**: Each navigation button MUST include a visible short description (3–6 words) below the project name, derived from the project's tagline.

**Left Sidebar — Hover & Touch Interactions (P1)**

- **FR-012**: On desktop devices with hover capability, hovering over a navigation button MUST expand a tagline description with a smooth animation (≤300ms).
- **FR-013**: On desktop, the star glyph icon MUST scale up on hover to provide visual feedback.
- **FR-014**: Keyboard focus (focus-visible) MUST trigger the same description expansion as mouse hover.
- **FR-015**: On touch devices, the first tap on a navigation button MUST expand the tagline preview without opening the project panel.
- **FR-016**: On touch devices, a second tap on the same button MUST open the project detail panel.
- **FR-017**: On touch devices, tapping a different button MUST collapse the previous tagline and expand the new one.
- **FR-018**: When reduced motion preferences are active, descriptions MUST appear and disappear instantly without animation.

**Right Sidebar — Content & Branding (P1)**

- **FR-019**: The right sidebar header MUST read "ODD ESSENTIALS".
- **FR-020**: The mana meter MUST remain visible and static (unchanged from Alpha).

**Right Sidebar — Terminal Loading Animation (P2)**

- **FR-021**: The right sidebar MUST display an animated terminal scanning sequence that cycles through all 7 project names.
- **FR-022**: Each project scan MUST display the project identifier (e.g., "Scanning odd-ai-reviewers...").
- **FR-023**: A progress indicator MUST update proportionally as each project is scanned (increments of ~14% per project, reaching 100%).
- **FR-024**: After all projects are scanned, the terminal MUST display a completion state showing "7 systems nominal" and "PORTFOLIO READY".
- **FR-025**: The terminal animation MUST be non-blocking — users MUST be able to interact with navigation buttons, stars, and scroll at any time during the animation.
- **FR-026**: The terminal animation MUST begin during the reveal sequence, concurrent with other status elements becoming visible.
- **FR-027**: Skipping the reveal sequence MUST still trigger the terminal animation to run at normal speed.
- **FR-028**: The progress indicator MUST be accessible, with appropriate semantics so assistive technology can announce scan progress.
- **FR-029**: When reduced motion preferences are active, the terminal MUST show the final "PORTFOLIO READY" state immediately without animation.

**Greek Key Border (P2)**

- **FR-030**: The top border rivet strip MUST be replaced with a repeating Greek key (meander) pattern.
- **FR-031**: The Greek key pattern MUST use the existing brass/gold color palette (brass-light, brass-mid, brass-dark tones).
- **FR-032**: The Greek key pattern MUST be rendered without external image files (procedural only — gradients or inline vector graphics).
- **FR-033**: A shimmer highlight animation MUST sweep across the Greek key pattern after the reveal sequence completes.
- **FR-034**: The shimmer animation MUST run at a slow, ambient pace (≥4 seconds per sweep) to avoid being distracting.
- **FR-035**: The shimmer animation MUST use only compositor-friendly rendering techniques (transforms, opacity) to avoid paint-triggered performance costs.
- **FR-036**: The Greek key pattern MUST scale proportionally at tablet breakpoints and MUST be hidden on mobile viewports below 768px.
- **FR-037**: When reduced motion preferences are active, the shimmer animation MUST be disabled. The pattern remains visible as a static decoration.

**Brand Messaging (P2)**

- **FR-038**: The discoverability affordance text MUST read "Force multipliers for small businesses..." (43 characters including trailing ellipsis).
- **FR-039**: The typing speed for the discoverability text MUST be approximately 20 characters per second (slower and more deliberate than the Alpha's scanner-style typing).
- **FR-040**: All screen-reader-only content MUST be updated to remove constellation/fantasy terminology and use portfolio-appropriate language.
- **FR-041**: The page title MUST be "Odd Essentials | Portfolio".

**Performance & Accessibility (P1)**

- **FR-042**: All text changes during animations MUST be contained so they do not trigger full-page layout recalculations.
- **FR-043**: The loading bar progress animation MUST use only compositor-friendly properties (transforms, not width changes).
- **FR-044**: The auto-tier performance benchmark timeout MUST account for the longer terminal animation sequence to avoid benchmarking during active animations.
- **FR-045**: The total number of compositing layers MUST NOT exceed 12 in steady state.
- **FR-046**: All new animations MUST respect `prefers-reduced-motion: reduce` by showing final states instantly with no animated transitions.

**Responsive Layout Fixes (P1)**

- **FR-047**: The navigation panel MUST reset to its grid-positioned state when the viewport resizes above the mobile breakpoint, clearing any mobile-specific positioning or transitions.
- **FR-048**: The status panel MUST be explicitly visible at desktop/tablet breakpoints, even if it was hidden by mobile styles or inline scripts.
- **FR-049**: The hamburger navigation MUST close automatically when the viewport resizes above the mobile breakpoint.

### Key Entities

- **Project**: A portfolio entry with an identifier, canonical name, short description, tagline, category, accent color, star position (x, y, z in world space), media references, and external links. 7 projects exist in the current dataset.
- **Star Node**: A visual representation of a project in the starfield. Has a 3D position, size hierarchy (standard, substantial, flagship), hover state, click state, and associated hover label.
- **Greek Key Tile**: A repeating decorative pattern unit consisting of right-angle spiral motifs. Tiles seamlessly in the horizontal direction at configurable widths per breakpoint.
- **Terminal Scan Entry**: A status line in the right sidebar representing one project being "scanned" during the loading animation. Contains the project identifier and a corresponding progress value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can hover over and click all 7 stars regardless of their horizontal position on viewports 1200px and wider — 100% of stars reachable.
- **SC-002**: All 7 stars remain visible on viewports from 320px to 2560px wide, with no stars disappearing at any intermediate size during resize.
- **SC-003**: A first-time visitor can read a project name and short description for every sidebar entry and understand what each project does before clicking — within 30 seconds of viewing the sidebar.
- **SC-004**: The terminal loading animation completes within 8 seconds and does not block user interaction at any point during playback.
- **SC-005**: The Greek key pattern is visually recognizable as a meander motif and uses brass/gold tones consistent with the rest of the frame.
- **SC-006**: The portfolio maintains smooth visual performance (60 frames per second on integrated graphics hardware) with all Beta features active.
- **SC-007**: All interactive elements remain fully navigable via keyboard alone (Tab, Arrow keys, Enter, Escape).
- **SC-008**: All content is accessible to screen readers with appropriate labels, live regions for dynamic content, and no orphaned or missing announcements.
- **SC-009**: When reduced motion preferences are enabled, no animated transitions occur — all content appears in its final state immediately.
- **SC-010**: The page title reads "Odd Essentials | Portfolio" and all visible text uses professional brand language (no constellation/fantasy terminology).

### Assumptions

- The project dataset remains at 7 projects for Beta 0.1.0 — no new projects are added.
- The existing Three.js (0.162.0) and GSAP (3.12.5) CDN versions remain unchanged.
- The single-file HTML + modules architecture is preserved — no build system is introduced.
- The mana meter is retained as a static decorative element per the user's explicit instruction.
- The design-reference viewport is 16:9 (1920×1080) for star position layout.
- Mobile breakpoint remains at 768px; tablet breakpoint remains at 1199px.
- The Greek key pattern is applied only to the top border (rune band area), not to all four frame edges.
- The reveal sequence timing (6.5s desktop, 4s mobile) may extend slightly to accommodate the terminal animation but must not exceed 10s total.
