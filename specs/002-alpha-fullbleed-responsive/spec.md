# Feature Specification: Alpha — Full-Bleed Starfield & Responsive Design

**Feature Branch**: `002-alpha-fullbleed-responsive`
**Created**: 2026-03-04
**Status**: Draft
**Input**: Alpha stage evolution — full-bleed starfield, logo cursor, responsive mobile design.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full-Bleed Starfield Experience (Priority: P1)

A visitor opens the portfolio on a desktop browser. Instead of seeing the nebula/starfield confined inside a circular crystal ball with a dark background, the entire space between the left and right sidebars is filled with the living nebula and stars — edge to edge, top to bottom. There is no orb boundary, no dark circle, no glass sphere border. The starfield IS the background of the central viewport. The steampunk frame elements (sidebars, command line, header) float over the cosmic scene. Stars are scattered across the full viewport area rather than contained within a sphere. The experience feels immersive — like looking through a window into space, not peering into a snow globe.

**Why this priority**: This is the single biggest visual transformation from POC to Alpha. The confined crystal ball was appropriate for proving the concept; the full-bleed starfield is the production-ready visual that makes the portfolio feel like a real product rather than a demo.

**Independent Test**: Open the page on a desktop browser, verify the nebula/starfield fills the entire central viewport area with no circular boundary or dark background visible.

**Acceptance Scenarios**:

1. **Given** the page has loaded, **When** the visitor views the central viewport, **Then** the nebula and starfield fill the entire space between the left and right sidebars from top to bottom with no circular boundary, dark background ring, or orb edge visible.
2. **Given** the starfield is visible, **When** the visitor looks at the edges of the starfield, **Then** the nebula colors and particles extend to the edges of the viewport area, blending seamlessly behind the sidebar panels and command line.
3. **Given** the starfield fills the viewport, **When** the visitor hovers over stars, **Then** hover interactions (scale, glow, label) still work identically to the POC — stars are interactive throughout the full viewport area.
4. **Given** the starfield fills the viewport, **When** the visitor clicks a star, **Then** the project detail panel opens correctly, overlaying the full-bleed starfield.
5. **Given** the starfield is full-bleed, **When** the visitor scrolls, **Then** scroll-driven interactions (rotation, palette shifts, zone highlighting) still function across the full viewport area.

---

### User Story 2 - Logo as Custom Cursor (Priority: P2)

A visitor moves their mouse across the page. When the cursor enters the starfield area (the central viewport between the sidebars), the standard cursor is replaced by the Odd Essentials logo — a small, tastefully-sized version of the mathematical-symbol ASCII art logo. When the cursor moves over a sidebar, command line, or project overlay, the cursor returns to normal (default arrow or pointer as appropriate). The logo cursor serves as persistent brand presence without consuming layout space.

**Why this priority**: Removing the logo from the header band frees up visual space and reduces frame clutter. The logo-as-cursor is a distinctive branding technique that keeps the brand visible without a static placement. It's a memorable interaction detail that visitors will notice and remember.

**Independent Test**: Move the mouse from a sidebar into the starfield area and observe the cursor change. Move back to a sidebar and observe it return to normal.

**Acceptance Scenarios**:

1. **Given** the page has loaded, **When** the visitor moves their cursor into the starfield area (central viewport), **Then** the cursor changes to a small version of the Odd Essentials logo.
2. **Given** the logo cursor is active, **When** the visitor moves their cursor over a sidebar panel, command line, project overlay, or any interactive button, **Then** the cursor returns to the standard browser cursor (arrow or pointer as appropriate).
3. **Given** the logo cursor is active, **When** the visitor hovers over a star node, **Then** the cursor changes from the logo to a pointer cursor to indicate the star is clickable.
4. **Given** the page has loaded, **When** the visitor views the top header band, **Then** the Odd Essentials logo is NOT displayed as a static image in the header — it has been removed from its previous position.
5. **Given** the visitor is on a touch device, **When** they interact with the starfield, **Then** no cursor-related issues occur (touch devices have no visible cursor — the logo cursor feature is naturally inactive).

---

### User Story 3 - Responsive Mobile Experience (Priority: P3)

A visitor opens the portfolio on a mobile phone (e.g., iPhone, Android). Instead of seeing a "best viewed on wider screen" warning, they see the full starfield filling their entire screen with all stars visible and interactive via touch. The sidebars (constellation nav and status panel) are collapsed/hidden by default, accessible via a hamburger menu or swipe gesture. The command line remains visible at the bottom as a thin bar. The visitor can tap stars to open project detail panels (which display full-width on mobile). The experience is fully functional — every project is reachable, every link works, and the visual quality is appropriate for mobile GPUs.

**Why this priority**: Mobile visitors (often 50%+ of web traffic) were previously shown a dismissive message. For a portfolio meant to attract professional opportunities, every visitor on any device must have a complete, functional experience. The mobile experience should feel intentional, not degraded.

**Independent Test**: Open the page on a mobile phone (or browser dev tools mobile emulation at 375px width). Verify the starfield is visible, stars are tappable, project panels open, and all navigation is accessible.

**Acceptance Scenarios**:

1. **Given** the visitor opens the page on a viewport narrower than 768px, **When** the page loads, **Then** the starfield fills the entire screen, both sidebars are hidden, and the "best viewed on wider screen" warning does NOT appear.
2. **Given** the visitor is on a mobile device, **When** they tap a star in the starfield, **Then** the project detail panel opens in a full-width mobile-friendly layout with all project information, visual assets, and links.
3. **Given** the sidebars are collapsed on mobile, **When** the visitor taps a menu button (hamburger icon), **Then** the constellation navigation panel slides in as an overlay from the left, listing all 7 projects. Tapping a project opens its detail panel. Tapping outside or a close button dismisses the nav overlay.
4. **Given** the visitor is on a mobile device, **When** they close the project detail panel, **Then** they return to the full-screen starfield view.
5. **Given** the visitor is on a tablet (768px–1199px), **When** they view the page, **Then** the layout adapts with narrower sidebars and a proportionally sized starfield — a middle ground between mobile and desktop layouts.
6. **Given** the visitor is on a mobile device, **When** the page loads, **Then** the 3D starfield renders at an appropriate quality level for mobile GPUs (reduced particle count, no post-processing bloom) without visible stuttering.
7. **Given** the visitor is on mobile, **When** they use pinch-to-zoom on the starfield, **Then** the browser zoom is prevented and the gesture is optionally captured for starfield zoom (or ignored gracefully).
8. **Given** the visitor rotates their device from portrait to landscape, **When** the orientation changes, **Then** the layout and starfield resize smoothly without breaking the scene or requiring a page reload.

---

### User Story 4 - Intermediate Viewport Adaptation (Priority: P4)

A visitor resizes their desktop browser window from full-width to narrower widths. As the window shrinks below certain breakpoints, the layout progressively adapts: sidebars narrow, then one sidebar collapses, then both collapse to the mobile hamburger layout. The starfield remains visible and interactive at every width. There is never a "broken" intermediate state where the layout is unusable.

**Why this priority**: Responsive design must handle every viewport width smoothly, not just "desktop" and "mobile." Browser resizing, split-screen usage, and tablet portrait/landscape all produce intermediate widths that must work.

**Independent Test**: Slowly resize the browser from 1920px to 320px width, verifying the layout adapts at each breakpoint without breaking.

**Acceptance Scenarios**:

1. **Given** the visitor's viewport is 1200px or wider, **When** they view the page, **Then** the full desktop layout is displayed: both sidebars visible, full-bleed starfield between them.
2. **Given** the viewport is between 768px and 1199px (tablet), **When** the visitor views the page, **Then** the sidebars are narrower (or one collapses) and the starfield fills the remaining space.
3. **Given** the viewport is below 768px (mobile), **When** the visitor views the page, **Then** both sidebars are hidden, a hamburger menu button is visible, and the starfield fills the entire screen.
4. **Given** the visitor resizes the browser window across a breakpoint, **When** the width crosses the threshold, **Then** the layout transitions smoothly without page reload or visual glitching.

---

### Edge Cases

- What happens when the visitor has a very wide screen (3440px ultrawide)? The starfield stretches across the full viewport. Stars remain within a reasonable central area to avoid excessive sparse edges. Sidebars remain at their fixed max-width.
- What happens when the visitor has a very narrow desktop window (e.g., 400px)? The mobile layout activates — sidebars collapse, hamburger menu appears, starfield fills the screen.
- What happens when CSS `cursor: url()` fails to load the logo SVG? The cursor falls back to the default browser cursor. No broken or missing cursor state.
- What happens on a device with both touch and mouse (e.g., Surface Pro)? Both touch and mouse interactions work. The logo cursor appears on mouse hover; touch taps work normally.
- What happens when the mobile hamburger nav is open and the visitor taps a star through the overlay? The star tap is blocked by the nav overlay. The visitor must close the nav first, then tap the star.
- What happens when the project detail panel is open on mobile and the visitor rotates the device? The panel layout adjusts to the new orientation without closing or losing content.
- What happens when the mobile visitor has `prefers-reduced-motion` enabled? The starfield is static, the reveal sequence is instant, but the mobile hamburger nav and project panels still function with instant transitions.

## Requirements *(mandatory)*

### Functional Requirements

**Full-Bleed Starfield**
- **FR-001**: The 3D starfield and nebula MUST fill the entire central viewport area between the sidebars (or the entire screen on mobile), with no circular boundary, dark background ring, orb shell, or glass sphere visible.
- **FR-002**: The crystal ball orb geometry (outer glass sphere, rim sphere, inner glow sphere) MUST be removed from the scene. Stars and nebula particles MUST be distributed across the full viewport area rather than constrained within a spherical radius.
- **FR-003**: The steampunk frame elements (sidebars, command line, header band) MUST float as overlays above the full-bleed starfield, composited via z-index layering.
- **FR-004**: All existing star interactions (hover, click, idle pulse, raycasting) MUST continue to work identically across the full viewport area.

**Logo Cursor**
- **FR-005**: The Odd Essentials logo MUST be removed from the top header band of the steampunk frame.
- **FR-006**: When the visitor's cursor enters the starfield area (central viewport / canvas), the cursor MUST change to a small version of the Odd Essentials logo SVG (approximately 32x32px to 48x48px).
- **FR-007**: When the cursor moves over any interactive element (sidebar buttons, overlay, close button) or leaves the starfield area, the cursor MUST return to the standard browser cursor.
- **FR-008**: When the cursor hovers over a star node, the cursor MUST change from the logo to a pointer cursor to indicate interactivity.
- **FR-009**: On touch-only devices, the logo cursor feature MUST be inactive (no impact on touch interactions).

**Responsive & Mobile Design**
- **FR-010**: The "This experience is best viewed on a wider screen" message MUST be removed entirely. The page MUST render a functional experience at every viewport width from 320px to unlimited.
- **FR-011**: The 3D starfield MUST render and be interactive on mobile devices. Mobile performance budget: maximum 400 nebula particles (vs 1500 desktop), no post-processing bloom/chromatic aberration/vignette, DPR clamped to 1.0 on mobile (vs 1.5 desktop). Nebula color saturation MUST be increased slightly on mobile to compensate for the absence of bloom enhancement.
- **FR-012**: On viewports below 768px (mobile), both sidebars MUST collapse and be hidden by default. A hamburger menu button MUST be visible, providing access to the constellation navigation as a slide-in overlay.
- **FR-013**: On viewports between 768px and 1199px (tablet), the layout MUST adapt with narrower sidebars or a single-sidebar layout, maintaining the starfield as the primary visual element.
- **FR-014**: On viewports below 768px, the project detail panel MUST display in a full-width, mobile-optimized layout with appropriate touch target sizes (minimum 44x44px for all interactive elements).
- **FR-015**: The 3D canvas MUST resize correctly on viewport changes (browser resize, device rotation) without requiring a page reload.
- **FR-016**: On mobile, the reveal sequence MUST still play, adapted for the full-bleed starfield: the frame assembly and command line typewriter phases remain; the "orb ignition" is replaced by a full-viewport nebula bloom (stars and nebula fade in from darkness across the entire screen). The physical anchor is the moment the entire viewport illuminates rather than a sphere igniting. If mobile performance is insufficient, the sequence is skipped and the starfield appears immediately.
- **FR-017**: The command line footer MUST remain visible on all viewports as a thin bar at the bottom of the screen.
- **FR-018**: Browser pinch-to-zoom on the starfield MUST be handled gracefully (prevented via viewport meta tag `user-scalable=no`). Pinch-to-zoom is not used for starfield navigation.
- **FR-022**: Touch interactions MUST mirror click behavior: tap on a star = click (opens project panel), no hover state on touch-only devices (hover effects are mouse-only). Touch raycasting uses `touchstart`/`touchend` events mapped to the same raycasting system as mouse clicks.
- **FR-023**: Scroll-driven effects (camera movement, nebula palette shifts, zone highlighting) apply viewport-wide — the entire starfield responds to scroll, not individual stars. This creates a cinematic "flythrough" feel across the full viewport.

**Accessibility (Maintained)**
- **FR-019**: All accessibility features from the POC MUST be maintained: keyboard navigation, screen reader support, focus trap, `prefers-reduced-motion`, `prefers-contrast: more`, WCAG AA contrast compliance.
- **FR-020**: The mobile hamburger menu MUST be keyboard-accessible (Enter to open, Escape to close, Tab through items).
- **FR-021**: The hamburger menu button MUST have an appropriate `aria-label` ("Open navigation" / "Close navigation") and `aria-expanded` state management.

### Assumptions

- The existing project data model (7 projects, constellation names, accent colors) is unchanged.
- The steampunk aesthetic (brass, iron, walnut materials, terminal text, gauges) is maintained on all viewports — mobile does not switch to a "flat" design.
- Mobile star positions are recalculated for the wider aspect ratio (no longer spherical constraint) but the same 7 projects are shown.
- The hamburger menu icon uses a simple SVG or CSS-only implementation (no icon library dependency).
- Touch interaction for stars uses `touchstart`/`touchend` events mapped to the same raycasting system as mouse events.
- The reveal sequence on mobile uses the same phases but with simplified animations (fewer frame assembly effects, shorter duration) to accommodate mobile performance.
- Post-processing (bloom, chromatic aberration) is disabled on mobile to maintain 60fps; the nebula colors are adjusted to remain vibrant without bloom enhancement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The starfield fills 100% of the viewport area between sidebars (desktop) or 100% of the screen (mobile) with no visible circular boundary or dark background.
- **SC-002**: The logo cursor appears within 100ms of the mouse entering the starfield area on desktop, and reverts within 100ms of leaving it.
- **SC-003**: On a mobile device (375px width), a visitor can tap any of the 7 stars, open the project detail panel, access all links, and close the panel — completing the full interaction loop in under 60 seconds.
- **SC-004**: The page maintains smooth visual performance (60fps) on mid-range mobile devices (e.g., iPhone 12 / Samsung Galaxy S21 class) during normal interaction.
- **SC-005**: The layout adapts correctly at 3 breakpoints (mobile <768px, tablet 768-1199px, desktop 1200px+) without any intermediate state where content is unreachable or layout is broken.
- **SC-006**: A keyboard-only user on desktop can still navigate all 7 projects, open panels, and access all links — responsive changes do not remove keyboard accessibility.
- **SC-007**: On mobile, the hamburger menu opens in under 300ms and provides access to all 7 project constellation buttons.
- **SC-008**: Device rotation (portrait ↔ landscape) on mobile/tablet resizes the starfield and layout smoothly without page reload, visual glitch, or content loss.
- **SC-009**: The total page weight delivered to mobile devices does not exceed the desktop page weight plus 20% (accounting for responsive CSS and touch interaction code; no mobile-specific heavy assets added).
