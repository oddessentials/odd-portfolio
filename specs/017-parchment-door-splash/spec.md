# Feature Specification: Parchment Door Splash Gate

**Feature Branch**: `017-parchment-door-splash`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User description: "Full-screen parchment-on-door splash gate with wax seal dismiss, door-opening animation, preloader, door creak audio, localStorage persistence, and mobile-friendly layout."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time Visitor Splash Gate (Priority: P1)

A first-time visitor arrives at the site and sees a full-screen splash instead of the portfolio. The splash displays a heavy wooden door with an aged parchment notice nailed to it. The parchment contains brief instructional text explaining what the site is. At the bottom of the parchment is a wax seal bearing the Odd Essentials logo. The visitor breaks the seal to dismiss the splash, triggering a door-opening animation with an audible door creak, revealing the portfolio underneath.

**Why this priority**: This is the entire feature — without it, nothing else matters. It gates all site content behind a thematic, immersive entry experience.

**Independent Test**: Can be fully tested by loading the site in a fresh browser (no localStorage). The splash appears, text is readable, the wax seal is tappable/clickable, and breaking it triggers the door animation and reveals the site.

**Acceptance Scenarios**:

1. **Given** a first-time visitor with no localStorage entry, **When** the page loads, **Then** a full-screen splash covers the viewport showing the door/parchment image with overlaid instructional text and a wax seal button.
2. **Given** the splash is visible, **When** the visitor clicks/taps the wax seal, **Then** the seal plays a break animation, the door animates open, and the portfolio is revealed underneath. (Audio, if enabled, plays simultaneously — see User Story 5.)
3. **Given** the splash is visible, **When** the visitor has not yet clicked the seal, **Then** no site content is visible or interactive behind the splash.

---

### User Story 2 - Returning Visitor Bypass (Priority: P1)

A returning visitor who has previously agreed (broken the seal) arrives at the site. The splash does not appear. The portfolio loads directly with its normal intro sequence.

**Why this priority**: Equal to P1 — without persistence, the splash becomes an annoying barrier on every visit, destroying the user experience.

**Independent Test**: Can be tested by setting the localStorage flag manually and reloading the page. The splash must not appear.

**Acceptance Scenarios**:

1. **Given** a returning visitor with the localStorage agreement flag set, **When** the page loads, **Then** the splash is skipped entirely and the portfolio reveal sequence begins normally.
2. **Given** a returning visitor, **When** they clear their browser data and revisit, **Then** the splash appears again as if they are a first-time visitor.

---

### User Story 3 - Asset Preloading During Splash (Priority: P2)

While the visitor reads the splash text, the site's assets (textures, fonts, scene resources) preload in the background. The splash serves double duty as both a gate and a loading screen. If assets finish loading before the user clicks the seal, the reveal is instant. If the user clicks before assets are ready, a subtle loading indicator appears until preloading completes, then the door opens.

**Why this priority**: This turns the splash from a pure gate into a performance optimization. Without it the feature still works — assets just load after the door opens, causing a less polished reveal.

**Independent Test**: Can be tested by throttling the network to slow speeds, clicking the seal immediately, and verifying a loading state appears before the door animation fires.

**Acceptance Scenarios**:

1. **Given** the splash is displayed and assets are still loading, **When** the visitor breaks the seal, **Then** a subtle loading indicator appears (e.g., the seal fragments pulse or a progress hint) and the door animation fires only after assets are ready.
2. **Given** the splash is displayed and assets have finished loading, **When** the visitor breaks the seal, **Then** the door animation fires immediately with no delay.
3. **Given** slow network conditions, **When** the splash is displayed, **Then** assets preload silently in the background without any visible jank or blocking of the splash UI.

---

### User Story 4 - Mobile-Friendly Splash (Priority: P2)

On mobile devices (< 768px viewport), the splash scales proportionally to fill the screen. The parchment text remains legible, and the wax seal meets the 44px minimum tap target. The door animation performs smoothly on mobile hardware.

**Why this priority**: A significant portion of visitors will be on mobile. The splash must not break or become unusable on small screens.

**Independent Test**: Can be tested on an iPhone SE (375px) and a tablet (768px). The splash image scales, text is readable without zooming, and the seal is easily tappable.

**Acceptance Scenarios**:

1. **Given** a mobile viewport (< 768px), **When** the splash loads, **Then** the door/parchment image scales to fill the viewport while maintaining aspect ratio, and the text remains legible.
2. **Given** a mobile viewport, **When** the visitor taps the wax seal, **Then** the seal is at least 44px in tap target size and the door animation plays smoothly.
3. **Given** any viewport size, **When** the splash is displayed, **Then** no horizontal scrolling is introduced.

---

### User Story 5 - Door Creak Audio (Priority: P3)

When the visitor breaks the wax seal, a short door-creak sound effect plays. This is the project's first audio. The audio respects browser autoplay restrictions by using the seal-click user gesture as the audio unlock event. The sound file is a royalty-free effect sourced and placed in `/assets/`.

**Why this priority**: Audio is an enhancement that deepens immersion. The feature works fully without it — it's a polish layer.

**Independent Test**: Can be tested by clicking the seal and verifying audio plays. On browsers with strict autoplay policies, the click gesture unlocks audio playback.

**Acceptance Scenarios**:

1. **Given** the visitor clicks/taps the wax seal, **When** the door animation begins, **Then** a door creak sound effect plays simultaneously.
2. **Given** a browser with strict autoplay policies, **When** the visitor clicks the seal (a user gesture), **Then** audio playback is permitted and the sound plays without errors.
3. **Given** the user has their device muted or volume at zero, **When** the seal is clicked, **Then** the door animation proceeds normally regardless of audio state (audio does not block the UX).

---

### Edge Cases

- What happens if the visitor has JavaScript disabled? The site should degrade gracefully — show content directly via a `<noscript>` fallback or CSS-only unhide.
- What happens if the provided splash image fails to load? A fallback background color/gradient should be shown so the text and seal remain usable.
- What happens on extremely wide viewports (ultrawide monitors)? The door image should be centered and contained, not stretched.
- What happens if localStorage is unavailable (private browsing in some browsers)? The splash should still appear and function; it just won't persist the agreement (visitor sees it again next visit).
- What happens if the user navigates away mid-animation and returns? The localStorage flag should only be set after the seal is broken, so the splash reappears if they left before clicking.
- What happens with `prefers-reduced-motion`? The door animation should be simplified or skipped (instant reveal), and the door creak should be skipped (sound without visual context is jarring).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a full-screen splash overlay on first visit, completely covering and blocking the portfolio content.
- **FR-002**: System MUST render user-provided door/parchment image as the splash background, scaled proportionally to the viewport.
- **FR-003**: System MUST overlay legible instructional text on the parchment area of the image, using the project's display font (Cinzel).
- **FR-004**: The instructional text content MUST be stored in a single, easily editable location so it can be updated without touching layout or animation code.
- **FR-005**: System MUST display a wax seal bearing the Odd Essentials logo as the dismiss/agree element, positioned at the bottom of the parchment area.
- **FR-006**: System MUST animate the wax seal breaking when clicked/tapped.
- **FR-007**: System MUST animate the door opening to reveal the site after the seal is broken.
- **FR-008**: System MUST play a door creak sound effect triggered by the seal-break user gesture, compliant with browser autoplay restrictions. Audio MUST play synchronously with the door-opening animation — if latency causes audible delay in production, audio MUST be removed rather than shipped out of sync.
- **FR-009**: System MUST persist the user's agreement in localStorage so the splash is not shown on subsequent visits.
- **FR-010**: System MUST skip the splash entirely for returning visitors with the localStorage flag set, proceeding directly to the portfolio reveal sequence.
- **FR-011**: System MUST preload site assets (textures, fonts, scene resources) in the background while the splash is displayed.
- **FR-012**: System MUST wait for asset preloading to complete before firing the door-opening animation if the user clicks the seal before loading finishes.
- **FR-013**: System MUST be fully responsive, scaling the splash proportionally across all viewport sizes from mobile (320px) to ultrawide.
- **FR-014**: The wax seal tap target MUST meet the 44px minimum size on mobile viewports.
- **FR-015**: System MUST handle `prefers-reduced-motion` by simplifying or skipping the door animation (instant reveal).
- **FR-016**: System MUST degrade gracefully when localStorage is unavailable (splash functions but does not persist).
- **FR-017**: System MUST provide a fallback visual if the splash image fails to load.
- **FR-018**: The door creak audio file MUST be a royalty-free sound effect, included in the project's `/assets/` directory.
- **FR-019**: System MUST display a chromatic/spectrum glow leaking from behind the door edges, visible on the splash load state, since the user arrives via a color spectrum. The glow intensifies as the door opens.

### Key Entities

- **Splash Overlay**: The full-screen blocking layer containing the door image, parchment text, and wax seal. Appears once per unique visitor.
- **Parchment Text Content**: The instructional message displayed on the parchment. Stored as a simple, editable text block separate from layout code.
- **Wax Seal**: The interactive dismiss element bearing the OE logo. Acts as the agree/enter button and audio gesture unlock.
- **Agreement Flag**: A localStorage key-value pair indicating the visitor has previously dismissed the splash.
- **Asset Preload Queue**: The set of site resources loaded in the background while the splash is displayed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First-time visitors see the splash within 1 second of page load (splash image and text rendered).
- **SC-002**: The door-opening animation completes within 3 seconds from seal click (when assets are preloaded).
- **SC-003**: Returning visitors see zero splash — the portfolio begins loading immediately with no flash of splash content.
- **SC-004**: The splash displays correctly across viewports from 320px to 2560px wide without horizontal scroll or text overflow.
- **SC-005**: The wax seal tap target is at least 44x44px on all viewports.
- **SC-006**: Asset preloading during the splash reduces perceived load time — the portfolio reveal begins within 1 second of the door animation completing.
- **SC-007**: Audio plays successfully on the seal-click gesture in Chrome, Firefox, Safari, and Edge (current versions).
- **SC-008**: The splash respects `prefers-reduced-motion` by providing an instant or simplified reveal.

## Assumptions

- The user will provide the door/parchment PNG image (approximately 1080x1400px, transparent background). The image includes the door, parchment, and nail heads — no text or interactive elements.
- The wax seal will be created as a separate visual element (CSS/SVG/small image) overlaid on the splash, not baked into the door image, to enable the break animation.
- The Cinzel font is already loaded by the portfolio and available for parchment text rendering.
- The existing orchestrator and animation pipeline can be extended to support the splash gate without major restructuring.
- The door creak audio will be a short file (< 100KB) sourced from a royalty-free provider.
- The text content on the parchment is brief (1-2 short paragraphs) — not a terms-of-service or legal agreement.
