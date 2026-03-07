# Feature Specification: Mobile UX Improvements

**Feature Branch**: `013-mobile-ux`
**Created**: 2026-03-06
**Revised**: 2026-03-06 (v3 — tighten detection method, logo accessibility, dynamic viewport, animation driver, OG budget, staging guard, resize debounce)
**Status**: Draft
**Input**: User description: "Mobile UX improvements: disable logo touch tracking on mobile, show one gauge during mobile experience, ensure social sharing meta data is in place"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disable Logo Touch Tracking (Priority: P1)

A visitor opens the portfolio on any touch device — phone, tablet, or touchscreen laptop — and taps or scrolls through the interactive starfield. Currently the brand logo snaps to their finger on every touch, following their finger around the screen and blocking the underlying star interactions and scroll gestures. After this fix, the logo follow behavior is governed by input capability: only fine-pointer devices with hover support (mouse, trackpad) trigger logo follow, detected via the media query `(hover: hover) and (pointer: fine)`. Coarse-pointer / touch interactions never activate logo follow regardless of screen size. On devices where logo follow is inactive, the logo's surrounding container does not intercept touch or pointer events — but the logo itself remains clickable within its visual bounds if it serves as a navigation link (e.g., home link).

**Why this priority**: This is a usability blocker. The logo touch-follow behavior actively interferes with core interactions (scrolling, tapping stars, opening project panels) on every touch device. Every touch-device visitor is affected on every session.

**Independent Test**: Can be fully tested by loading the portfolio on (a) a phone, (b) a tablet, and (c) a desktop with mouse — confirming the logo never follows touch input on (a) and (b), follows the mouse on (c), and that touch taps on (a) and (b) pass through the logo's tracking region to the starfield without interception. Additionally, if the logo is a link, verify it remains tappable within its own visual bounds on all devices.

**Acceptance Scenarios**:

1. **Given** a coarse-pointer touch device (phone or tablet), **When** the visitor touches and drags anywhere on the starfield canvas, **Then** the brand logo remains stationary in the header band and does not follow the touch point.
2. **Given** a coarse-pointer touch device, **When** the visitor taps a star node in the starfield, **Then** the tap registers as a star selection even if the tap location overlaps the logo's tracking container. The tracking container does not capture or intercept the touch event.
3. **Given** a coarse-pointer touch device, **When** the visitor scrolls vertically through the starfield zones, **Then** scrolling behaves smoothly without any logo snap-to-finger interference.
4. **Given** a fine-pointer device with hover support (mouse or trackpad), **When** the user moves the cursor over the starfield, **Then** the logo mouse-follow behavior activates as before (no regression for desktop).
5. **Given** a hybrid device with both touch and mouse input (e.g., Surface Pro, touchscreen laptop), **When** the user touches the screen, **Then** logo follow does NOT activate; **When** the same user uses the trackpad/mouse, **Then** logo follow activates normally.
6. **Given** logo follow is inactive (coarse-pointer context), **When** the visitor taps anywhere in the logo's tracking container outside the logo's own visual bounds, **Then** the tap passes through to any interactive element beneath (starfield canvas, stars, scroll surface).
7. **Given** logo follow is inactive (coarse-pointer context) and the logo is a clickable link, **When** the visitor taps directly on the logo image itself, **Then** the logo's own link/action activates normally (accessibility preserved).

---

### User Story 2 - Social Sharing Meta Tags (Priority: P1)

A visitor or the portfolio owner shares the portfolio URL on social media (LinkedIn, Facebook, X/Twitter, Discord, Slack, iMessage, etc.). Currently the social preview shows a tiny SVG logo that renders poorly or not at all on most platforms. After this fix, sharing the URL produces a rich, eye-catching preview card with the proper branded image, a clear title, and a compelling description. The metadata is hardened for crawlers: absolute URLs pointing to the production domain (never staging/preview URLs), correct MIME type, canonical link, and publicly accessible image path with appropriate caching.

**Why this priority**: Social sharing is a primary distribution channel for the portfolio. Poor previews reduce click-through rates and damage brand perception. This is a zero-interaction feature that benefits every share without requiring visitor action.

**Independent Test**: Can be fully tested by deploying to the production URL and validating with each platform's official debugger tool. A cache-bust/redeploy cycle must be performed after initial metadata changes to confirm platforms pick up the new values.

**Acceptance Scenarios**:

1. **Given** the portfolio URL is shared on any Open Graph-compatible platform (Facebook, LinkedIn, Discord, Slack), **When** the platform fetches the URL metadata, **Then** the preview card displays the branded 1200x630 image, the title "Odd Essentials | Portfolio", and the description about force-multiplying for small businesses.
2. **Given** the portfolio URL is shared on X/Twitter, **When** the platform fetches the URL metadata, **Then** a large summary card displays with the branded image, title, and description.
3. **Given** the portfolio URL is shared on iMessage or SMS with link preview, **When** the recipient's device fetches the URL metadata, **Then** the preview shows the branded image rather than a broken or missing image placeholder.
4. **Given** a search engine crawls the portfolio, **When** it indexes the page metadata, **Then** it finds a valid canonical URL, meta description, and theme color for search result display.
5. **Given** a social platform's cached preview is stale after a metadata update, **When** the owner uses the platform's cache-refresh/debugger tool, **Then** the updated metadata (new image, title, description) appears within one refresh cycle.
6. **Given** the portfolio is deployed to a staging or preview environment, **When** a crawler or debugger fetches the metadata, **Then** the `og:url`, `canonical`, and image URLs still reference the production domain — staging/preview URLs MUST NOT appear in any metadata tag.

---

### User Story 3 - Show Right Gauge on Mobile (Priority: P2)

A visitor opens the portfolio on their phone. Currently the steampunk brass frame is stripped of all decorative elements on mobile — no gauges, no corner tools — giving a bare experience that lacks the portfolio's signature Victorian techno-mage aesthetic. After this fix, the right gauge (the larger, more decorative of the two) is visible on mobile, anchored to the bottom-right corner above the command line. The gauge needle and zone glow animations are driven by the existing zone-state signal (the same custom event that drives desktop gauges), not by continuous scroll listeners, ensuring smooth performance on low-end mobile devices. The gauge is hidden when the hamburger navigation or project detail overlay is open, preventing visual conflict.

**Why this priority**: This is a visual polish feature that enhances brand identity on mobile. While not a usability blocker, the complete absence of steampunk decoration on mobile weakens the portfolio's distinctive aesthetic. The gauge serves as a signature visual element that connects the mobile experience to the desktop experience.

**Independent Test**: Can be fully tested by loading the portfolio on a mobile device (or emulator at <768px width) and confirming the right gauge is visible at the bottom-right, animates on zone scroll, and hides when the nav menu or project panel opens.

**Acceptance Scenarios**:

1. **Given** a mobile device with viewport width below 768px, **When** the portfolio loads and the reveal animation completes, **Then** the right gauge is visible, anchored to the bottom-right corner of the viewport above the command line footer, with a maximum diameter of 72px.
2. **Given** the mobile gauge is visible, **When** the visitor scrolls between starfield zones, **Then** the gauge needle rotates and the zone glow animates to reflect the active zone. The mobile gauge reads from the same zone-state source as the desktop gauges — there is one authoritative active-zone signal, not separate mobile/desktop zone tracking. The needle update is triggered by the zone-state signal, not by continuous scroll event listeners.
3. **Given** a mobile device with viewport width below 768px, **When** the visitor taps the hamburger menu and the navigation overlay opens, **Then** the gauge is hidden (not merely obscured) for the duration the overlay is open, and reappears when the overlay closes.
4. **Given** a mobile device with viewport width below 768px, **When** the visitor opens a project detail panel, **Then** the gauge is hidden for the duration the panel is open, and reappears when the panel closes.
5. **Given** a tablet or desktop device with viewport width at or above 768px, **When** the portfolio loads, **Then** both gauges remain visible in their original positions with no change to size, anchor, or behavior (no regression).
6. **Given** a mobile device with a viewport width of 320px (minimum supported), **When** the portfolio loads, **Then** the gauge fits within the viewport without overflow or clipping of the gauge face, needle, or tick marks. The mounting bracket is clipped to the gauge boundary.
7. **Given** a mobile device with safe-area insets (e.g., iPhone with home indicator) or dynamic browser chrome (address bar that appears/disappears during scroll), **When** the gauge is positioned at the bottom-right, **Then** the gauge respects `env(safe-area-inset-*)` values and reflows correctly when the visible viewport height changes due to browser chrome showing or hiding.

---

### Edge Cases

- What happens when a user rotates their phone from portrait to landscape (crossing the 768px threshold)? Gauge visibility should respond to CSS media queries on the new viewport after a short debounce (~100-150ms) to prevent rapid layout thrashing. Logo-follow capability detection is input-based and does not change on rotation.
- What happens on a hybrid device (e.g., Surface Pro) where the user switches between touch and mouse mid-session? Logo follow should activate/deactivate based on the current input modality, not a one-time detection at page load. The capability query `(hover: hover) and (pointer: fine)` must be evaluated dynamically.
- What happens if the social sharing image fails to load (404, timeout)? The og:title and og:description must still provide a meaningful text-only preview. The image URL must be validated as accessible before deployment.
- What happens with prefers-reduced-motion enabled on mobile? The gauge should still appear but with its animations respecting the reduced motion preference (instant state, no needle tremor, no glow transition).
- What happens if the portfolio is loaded in a very narrow embedded webview (e.g., in-app browser at 280px)? The gauge should either scale down gracefully or hide below a minimum viable viewport width.
- What happens if the viewport rapidly crosses the 768px breakpoint multiple times (e.g., during device rotation animation or browser chrome toggling)? State changes must be debounced to prevent flicker.

## Requirements *(mandatory)*

### Functional Requirements

**Logo Follow — Input Capability Gating**

- **FR-001**: Logo follow MUST be activated only on devices that report fine-pointer capability with hover support, detected via the media query `(hover: hover) and (pointer: fine)`. This detection MUST be performed by a single shared utility used everywhere in the codebase that evaluates pointer capability, so that behavior cannot diverge between modules. On devices that do not match this query (coarse-pointer, touch-primary), logo follow MUST NOT activate regardless of viewport width.
- **FR-002**: On devices where logo follow is inactive, the logo's tracking container (the hitzone region used for mouse-follow on desktop) MUST NOT capture or intercept touch or pointer events — events in that region MUST pass through to underlying interactive elements (starfield canvas, stars, scroll surface). However, the logo image itself MUST remain interactive within its own visual bounds if it serves as a clickable element (e.g., home navigation link), preserving accessibility.
- **FR-003**: On hybrid devices supporting both fine-pointer (mouse/trackpad) and coarse-pointer (touch) input, logo follow MUST respond to the active input modality: follow activates for mouse/trackpad movement, follow does NOT activate for touch input. The capability query MUST be evaluated dynamically (not only at page load) so that changes in input modality (e.g., detaching a keyboard, switching from touch to trackpad) take effect without a page reload.
- **FR-004**: Viewport resize events that cross the 768px breakpoint (e.g., device rotation, browser chrome changes) MUST be debounced by 100-150ms before recalculating mobile/desktop feature state, to prevent rapid layout thrashing and visual flicker during transient width changes.

**Mobile Gauge — Right Gauge Display**

- **FR-005**: On mobile viewports (below 768px), exactly one gauge MUST be displayed: the right gauge (the larger gauge positioned on the right side of the frame on desktop).
- **FR-006**: The left gauge MUST remain hidden on mobile viewports (below 768px).
- **FR-007**: The mobile right gauge MUST be anchored to the bottom-right corner of the viewport, positioned above the command line footer, with a maximum diameter of 72px. The gauge MUST respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-right)` on devices that report them. The gauge MUST reflow correctly when the visible viewport height changes due to mobile browser chrome showing or hiding (address bar, toolbar).
- **FR-008**: The mobile gauge MUST be hidden (display removed, not merely obscured or sent behind a z-index) when either the hamburger navigation overlay or the project detail panel is open. The gauge MUST reappear when the overlay or panel closes.
- **FR-009**: The mounting bracket sub-element MUST be clipped to the gauge boundary on mobile to prevent overflow beyond the gauge's bounding box.
- **FR-010**: The mobile gauge and desktop gauges MUST read from one shared zone-state signal to determine active zone. There MUST NOT be separate mobile and desktop zone-tracking logic. Needle rotation and zone glow on mobile MUST match desktop behavior because they consume the same source of truth. The needle update MUST be triggered by the discrete zone-state signal (zone-change event), NOT by continuous scroll event listeners, to prevent scroll-driven jank on low-end mobile devices.
- **FR-011**: The mobile gauge MUST respect the prefers-reduced-motion preference, displaying in its static state (no needle tremor, no glow transitions, needle set to active zone position instantly) when reduced motion is active.
- **FR-012**: Both gauges MUST remain visible and functional on tablet (768px-1199px) and desktop (1200px+) viewports with no change to size, position, anchor, or behavior (no regression).

**Social Sharing Metadata**

- **FR-013**: The portfolio MUST include Open Graph meta tags: `og:title`, `og:description`, `og:type`, `og:image`, `og:image:width`, `og:image:height`, `og:image:type` (MIME), `og:url`, and `og:site_name`.
- **FR-014**: The portfolio MUST include Twitter Card meta tags: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`, and `twitter:site`.
- **FR-015**: The portfolio MUST include a `<link rel="canonical">` tag pointing to the production URL.
- **FR-016**: The portfolio MUST include a `<meta name="description">` tag for search engine display.
- **FR-017**: The portfolio MUST include a `<meta name="theme-color">` tag consistent with the portfolio's visual design.
- **FR-018**: All image URLs in meta tags (`og:image`, `twitter:image`) MUST be absolute URLs (including protocol and domain), not relative paths.
- **FR-019**: The social sharing image MUST be served from a publicly accessible path that requires no authentication. The image MUST NOT reside in a source/design-assets folder that is not deployed.
- **FR-020**: The social sharing image file MUST NOT exceed 600KB. If the source image exceeds this budget, it must be optimized before deployment. This is a soft budget — if platform-specific testing reveals quality degradation below 600KB, the budget may be raised with documented justification.
- **FR-021**: The social sharing image MUST include descriptive `og:image:alt` text for accessibility.
- **FR-022**: The `og:url`, `<link rel="canonical">`, and all absolute image URLs in metadata MUST always reference the production domain. Staging, preview, or local development URLs MUST NOT appear in any metadata tag, even when deployed to non-production environments. The production domain MUST be defined in a single configuration source so it cannot diverge between tags.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of touch interactions on coarse-pointer devices pass through to the starfield canvas without logo interference — verified by touch-scrolling and star-tapping on 3 representative devices or emulators: a phone (viewport ~375px), a tablet (viewport ~810px), and a hybrid in touch mode. The logo tracking container does not appear in the event target chain for any touch event. The logo image itself remains tappable if it is a link.
- **SC-002**: The right gauge is visible at the bottom-right corner on all tested mobile viewports (320px to 767px) with: no overflow beyond viewport bounds, no overlap with the command line or hamburger button, the mounting bracket clipped to the gauge boundary, and correct safe-area inset handling on notched/home-indicator devices.
- **SC-003**: The mobile gauge needle and zone glow animate correctly when scrolling through all three starfield zones, with the mobile gauge and desktop gauges provably consuming the same zone-state signal (verified by confirming a single zone-change dispatch drives both). No continuous scroll event listener is attached for gauge updates — only the discrete zone-change signal triggers needle movement.
- **SC-004**: Social sharing preview cards display the branded image, correct title, and description — verified on each platform's official debugger: Facebook Sharing Debugger, Twitter/X Card Validator, and LinkedIn Post Inspector. After initial deployment, a cache-bust cycle (re-scrape via each debugger) MUST confirm the updated metadata is picked up. opengraph.xyz may be used for quick iteration during development but does not replace platform-specific validation.
- **SC-005**: No visual or behavioral regression on tablet (768px+) and desktop (1200px+) viewports — both gauges visible in original positions, logo mouse-follow functional on fine-pointer devices, all existing meta tags preserved or superseded by improved versions.
- **SC-006**: The social sharing image is NOT requested during normal browser page load (verified via browser DevTools Network tab — no request to the OG image URL during a standard page visit). The served OG image file is under 600KB. The image URL returns HTTP 200 with correct `Content-Type` image header when fetched by a crawler user-agent.
- **SC-007**: The mobile gauge hides within one animation frame when the navigation overlay or project panel opens, and reappears within one animation frame when they close — verified by toggling each overlay on a mobile device and confirming no visual flash or z-index bleed-through.
- **SC-008**: Rapidly crossing the 768px breakpoint (e.g., rotating device back and forth within 1 second) does not cause visual flicker — gauge visibility and feature state changes are debounced and settle to the correct final state within 150ms of the last resize event.

## Validation Tasks

The following must be confirmed during implementation before relying on them as shortcuts:

- **VT-001**: Confirm whether gauge animations (needle, glow, micro-tremor) fire when the gauge element has `display: none`. If they do not fire or produce errors, the implementation must ensure animations are paused/resumed when the gauge is hidden/shown on mobile.
- **VT-002**: Confirm the zone-change custom event is the single source of truth for active zone, and that both desktop gauge updates and the mobile gauge update path consume this same event. If separate code paths exist, they must be unified.
- **VT-003**: Confirm whether the `isMobile` flag or CSS media queries are the correct mechanism for gauge visibility, or whether a combination is needed (CSS for layout, JS for animation lifecycle).
- **VT-004**: Confirm the `design-assets/og-image.png` file dimensions (expected: 1200x630) and file size. If over 600KB, optimize before copying to the served assets path.
- **VT-005**: Confirm that `matchMedia('(hover: hover) and (pointer: fine)')` behaves consistently across target browsers (Chrome, Safari, Firefox, Edge) on phones, tablets, and hybrid devices. Document any browser-specific quirks and mitigations.
- **VT-006**: Confirm that the existing codebase resize handler supports debouncing, or identify where debounce logic must be added for the 768px breakpoint crossing.

## Assumptions

- The deployment infrastructure serves files from the `assets/` directory but not `design-assets/`. The OG image must be copied to `assets/` for public access.
- The canonical URL for the portfolio is the production domain where it is deployed. The `og:url` and `<link rel="canonical">` values must always use the production URL as an absolute URL, even in non-production deployments.
- The X/Twitter handle for the portfolio is `@odd_essentials` based on the social link already present in the navigation.
- The right gauge (the larger, more decorative gauge) is the designated gauge to show on mobile per this specification.
- Input capability detection via the media query `(hover: hover) and (pointer: fine)` is the web platform standard for distinguishing fine-pointer (mouse/trackpad) from coarse-pointer (touch) devices. The 768px breakpoint alone is not sufficient for this purpose.
