# Feature Specification: Arcane Console POC

**Feature Branch**: `001-arcane-console-poc`
**Created**: 2026-03-04
**Status**: Draft
**Input**: Victorian Techno-Mage single-page HTML + WebGL portfolio POC featuring a steampunk arcane console frame with a central crystal ball containing a nebula/constellation universe representing 7 projects.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Browse Projects (Priority: P1)

A visitor lands on the portfolio page and sees a Victorian steampunk instrument panel surrounding a glowing crystal ball. After a brief reveal sequence ("reveal universe"), the crystal ball illuminates with a colorful nebula containing 7 glowing star nodes. The visitor can see all 7 projects listed in a left-side constellation navigation panel. They hover over a star in the crystal ball and see the project name appear. They click the star and a project detail panel opens showing the project's name, tagline, visual asset (logo, screenshot, or video), and links to GitHub, live demos, or package registries. They close the panel and explore another project.

**Why this priority**: The entire purpose of the portfolio is to communicate the owner's projects to visitors. If a visitor cannot discover, identify, and access project information, the portfolio has failed regardless of how impressive the visuals are.

**Independent Test**: Can be fully tested by opening the page, waiting for the reveal sequence, clicking any star or constellation nav button, verifying the detail panel shows correct project data with working links, and closing the panel.

**Acceptance Scenarios**:

1. **Given** the page has loaded and the reveal sequence has completed, **When** the visitor hovers over any star node in the crystal ball, **Then** a label showing the project name appears near the star within 200ms.
2. **Given** a star is hovered, **When** the visitor clicks it, **Then** a project detail panel opens displaying the project name, tagline, at least one visual asset (if available), and link buttons for all associated URLs.
3. **Given** a project detail panel is open, **When** the visitor clicks the close button, clicks the backdrop, or presses Escape, **Then** the panel closes and focus returns to the activating element.
4. **Given** the page has loaded, **When** the visitor clicks a project name in the left constellation navigation panel, **Then** the same project detail panel opens as if the corresponding star had been clicked.
5. **Given** the page has loaded, **When** the visitor views the constellation navigation panel, **Then** all 7 projects are listed with their constellation names and are individually selectable.

---

### User Story 2 - Experience the Reveal Sequence (Priority: P2)

A visitor loads the portfolio page. They see a dark, unpowered steampunk console. The frame assembles itself — brass corners slide into place, gauges power up, and a command line at the bottom types "reveal universe." The crystal ball ignites with a flash, the nebula blooms outward from the center, and stars appear one by one. Status readouts populate on the right panel. After the sequence completes, a scanning animation teaches the visitor that the stars are interactive ("7 anomalies detected"). The visitor understands this is a living, explorable visualization — not just a static decoration.

**Why this priority**: The reveal sequence is the "wow factor" that differentiates this portfolio from a standard project listing. It establishes the brand, creates emotional engagement, and — critically — teaches the visitor that the stars are interactive through the discoverability affordance.

**Independent Test**: Can be tested by loading the page fresh and observing the full animation sequence from dark console to fully revealed universe, verifying each phase occurs in order and the discoverability prompt appears.

**Acceptance Scenarios**:

1. **Given** the page is loading for the first time, **When** the page finishes loading, **Then** the steampunk frame assembles visually (corners, edges, panels appear), gauges animate, and the command line types "reveal universe."
2. **Given** the frame has assembled, **When** the "reveal universe" command completes, **Then** the crystal ball ignites with a visible flash, the nebula blooms outward, and star nodes appear with staggered timing.
3. **Given** the reveal sequence has completed, **When** 2 seconds pass, **Then** a one-time discoverability affordance occurs (stars pulse with a scanning animation) and the command line displays a prompt indicating the stars are interactive.
4. **Given** a visitor has `prefers-reduced-motion` enabled, **When** the page loads, **Then** the frame, nebula, and stars appear immediately without animation, and the discoverability prompt is shown as static text.

---

### User Story 3 - Scroll-Driven Exploration (Priority: P3)

A visitor who has seen the initial reveal begins scrolling down the page. As they scroll, the crystal ball slowly rotates, the nebula palette shifts through different color zones, and constellation groups are highlighted in sequence (Arcane Tools, Intelligence Matrix, Outpost Network). The right-side status panel updates with contextual information about each zone. The command line updates with scanning messages. The visitor gets a guided tour of the project universe without needing to click anything.

**Why this priority**: Scroll-driven interaction provides a passive discovery path for visitors who may not immediately click stars. It adds cinematic depth and reveals the project constellation groupings, but the core project information is already accessible through P1 (click interactions) and doesn't depend on scrolling.

**Independent Test**: Can be tested by scrolling from top to bottom, verifying the orb rotates, nebula colors shift, constellation groups highlight, and status text updates at each zone boundary.

**Acceptance Scenarios**:

1. **Given** the reveal sequence has completed and the visitor is at the top of the page, **When** the visitor scrolls downward, **Then** the crystal ball rotates gently on its Y axis and the camera perspective shifts subtly.
2. **Given** the visitor is scrolling through a constellation zone, **When** they enter a new zone boundary, **Then** the stars belonging to that constellation brighten, the nebula palette shifts toward the zone's color, and the status panel updates.
3. **Given** the visitor scrolls past all zones, **When** they reach the end zone, **Then** all stars return to equal brightness showing the "full universe view."
4. **Given** a visitor has `prefers-reduced-motion` enabled, **When** the visitor scrolls, **Then** no scroll-driven scene changes occur — the nebula remains static and all stars stay at equal brightness.

---

### User Story 4 - Keyboard and Screen Reader Navigation (Priority: P4)

A visitor using only a keyboard (no mouse) navigates the portfolio. They press Tab to move through the constellation navigation buttons, use arrow keys to move between projects in the list, and press Enter to open a project detail panel. Inside the panel, Tab cycles through the close button, media controls, and link buttons. Pressing Escape closes the panel and returns focus to the constellation nav button that opened it. A screen reader user hears all project names, taglines, and link labels announced correctly.

**Why this priority**: Accessibility is a constitutional non-negotiable (Principle III). While most portfolio visitors will use a mouse, keyboard and screen reader support ensures the portfolio is usable by all visitors and reflects well on the developer's professional standards.

**Independent Test**: Can be tested by navigating the entire portfolio using only keyboard (Tab, arrow keys, Enter, Escape) with a screen reader active, verifying all projects are reachable and all content is announced.

**Acceptance Scenarios**:

1. **Given** the page has loaded, **When** the visitor presses Tab, **Then** focus moves to the skip link, then to constellation navigation buttons in order.
2. **Given** focus is on a constellation nav button, **When** the visitor presses Enter, **Then** the project detail panel opens and focus moves to the close button inside the panel.
3. **Given** the project detail panel is open, **When** the visitor presses Tab, **Then** focus cycles through the close button, any media controls, and link buttons — never leaving the panel (focus trap).
4. **Given** the project detail panel is open, **When** the visitor presses Escape, **Then** the panel closes and focus returns to the constellation nav button that triggered it.
5. **Given** a screen reader is active, **When** the page loads, **Then** the screen reader announces the page title, the skip link, and can read a complete list of all 7 projects with their names, taglines, and links from the accessible project list in the DOM.
6. **Given** focus is on a constellation nav button, **When** the visitor presses the down arrow key, **Then** focus moves to the next constellation nav button in the list. Up arrow moves to the previous button. Focus wraps at list boundaries.
7. **Given** the reveal sequence has completed, **When** no user action has occurred, **Then** focus rests on the first constellation nav button (not trapped in the canvas).

---

### User Story 5 - Graceful Degradation (Priority: P5)

A visitor opens the portfolio on a device or browser that does not support WebGL (or has it disabled). Instead of a blank page or error, they see the steampunk CSS frame still rendered around a static image of the crystal ball. The constellation navigation panel still works, the project detail panels still open, and all project links are functional. The experience is visually simpler but content-complete.

**Why this priority**: Per Constitution Principle VII, the portfolio must function at every capability level. A visitor on an older browser or corporate-locked machine must still access the project information, even without the visual spectacle.

**Independent Test**: Can be tested by disabling WebGL in browser settings and loading the page, verifying the CSS frame renders, the static fallback image appears, and all project navigation and detail panels work.

**Acceptance Scenarios**:

1. **Given** the visitor's browser does not support WebGL, **When** they load the page, **Then** a static image of the crystal ball is displayed in the viewport area, the CSS steampunk frame renders normally, and all navigation is functional.
2. **Given** the visitor's viewport is narrower than 1200px, **When** they load the page, **Then** a centered message is displayed: "This experience is best viewed on a wider screen." The WebGL canvas and 3D renderer are NOT initialized.
3. **Given** the visitor is on a mobile device, **When** they load the page, **Then** the steampunk frame renders, a static orb image is shown, and the project list with all links is accessible.

---

### Edge Cases

- What happens when the visitor's GPU cannot maintain 30fps? The auto-tier degradation system benchmarks after the reveal sequence and drops to a lower visual tier (fewer shader effects, no bloom).
- What happens when the browser tab is hidden during the reveal sequence? The animation loop pauses via the Page Visibility API. When the tab returns, the animation resumes from where it paused.
- What happens when WebGL context is lost (e.g., GPU driver crash)? The page listens for the `webglcontextlost` event, prevents default, and attempts restoration. If restoration fails, the static fallback image replaces the canvas.
- What happens when the visitor rapidly clicks multiple stars? Only the most recent click is processed. The previous project panel (if open) closes before the new one opens.
- What happens when the visitor has both `prefers-reduced-motion` and `prefers-contrast: more` enabled? Both accommodations apply simultaneously: no animations, and the visual theme switches to high-contrast (white text on black, simple outlines, decorative elements hidden).
- What happens when the visitor scrolls during the reveal sequence (before it completes)? The reveal sequence skips to completion (all elements jump to final state) and scroll-driven interactions activate immediately.
- What happens when a project detail panel is open and the visitor scrolls? Scroll is locked while the panel is open. The background scene does not animate behind the overlay. The visitor must close the panel to resume scrolling.
- What happens when two stars are visually close on screen and the visitor clicks the boundary? The nearest-intersection (shortest raycaster distance) wins. A minimum 0.18 world-unit projected screen-space separation between stars prevents ambiguous clicks.
- What happens when Google Fonts CDN fails to load? CSS font stacks include system fallbacks (Georgia for serif, Courier New for mono, Arial for sans-serif). The page remains legible with fallback fonts; the steampunk aesthetic degrades but content is unaffected.

## Requirements *(mandatory)*

### Functional Requirements

**Core Structure**
- **FR-001**: The portfolio MUST be delivered as a single `index.html` file with an optional `/assets` folder for media. No build system, backend, or CMS.
- **FR-001a**: The Odd Essentials logo (`design-assets/logo.svg` — ASCII-art SVG, white on transparent, 532×494px) MUST be prominently displayed in the top header band of the steampunk frame as the primary brand mark. The logo's mathematical-symbol aesthetic (π, √, ∞ characters) reinforces the techno-mage identity. A brass-tinted or parchment-tinted CSS filter variant may be used to integrate with the frame palette.
- **FR-002**: The page MUST display a steampunk-themed decorative frame surrounding a central viewport, following the Rule of Thirds ornamentation levels: LAVISH at corners/bezels (gear teeth, rivets, filigree), MODERATE on side panels (functional-looking gauges, pipes), RESTRAINED around the orb surround (clean brass ring), and ZERO CHROME inside the orb (nebula + stars only, no steampunk elements).
- **FR-003**: The page MUST include exactly four HUD panels (this layout is final): left constellation navigation, right status readout, bottom command line, and top header band. No additional panels without explicit approval.

**Crystal Ball & WebGL**
- **FR-004**: The central viewport MUST contain a WebGL-rendered crystal ball with a convincing glass appearance (rim glow, internal depth, subtle surface imperfections).
- **FR-005**: The crystal ball MUST contain a procedurally generated nebula with color regions corresponding to project categories.
- **FR-006**: The crystal ball MUST contain exactly 7 interactive star nodes, one per project, at hand-tuned 3D positions with a minimum 0.18 world-unit projected screen-space separation to prevent raycasting collisions. Stars MUST have a size hierarchy: flagship projects at 1.4x base size, substantial projects at 1.15x, and standard projects at 1.0x.
- **FR-007**: Each star node MUST respond to hover (scale increase, halo glow, project name label), click (supernova burst effect, project detail panel opens), and idle state (ambient pulse animation with per-star random phase and speed).

**Project Data & Overlay**
- **FR-008**: The page MUST include hard-coded data for exactly 7 projects, each with: id, name, tagline, category, optional logo URL, optional media type and URL, and an array of links.
- **FR-009**: The project detail panel MUST display the project name, tagline, available visual asset (logo, screenshot gallery, video, or terminal-style placeholder), and link buttons for all associated URLs.
- **FR-010**: Each project detail panel MUST have exactly two prominent call-to-action buttons (primary: live demo or store link; secondary: GitHub) plus up to 3 additional secondary links (maximum 5 link buttons total per project).
- **FR-011**: The project detail panel MUST function as a modal dialog with focus trap, close button, backdrop click dismiss, and Escape key dismiss.

**Animation & Interaction**
- **FR-012**: The page MUST play a reveal sequence on load (total duration under 7 seconds): frame assembly, gauge power-up, command line typewriter, orb ignition, nebula bloom, and staggered star appearance. These 6 phases are final; no additional phases without explicit approval.
- **FR-013**: After the reveal sequence, the page MUST display a one-time discoverability affordance (scanning animation + command line prompt) to teach visitors that stars are interactive.
- **FR-014**: The page MUST support scroll-driven interactions across 3-4 constellation zones: orb rotation, nebula palette shifts, constellation zone highlighting, and status panel text updates. The scroll-pinned section MUST complete within 300px of scroll distance.
- **FR-015**: The page MUST include a "skip intro" affordance (visible button or keyboard shortcut) that allows visitors to bypass the reveal sequence. The affordance MUST be visible for at least 3 seconds then fade.

**Accessibility**
- **FR-016**: The page MUST include a visually hidden (`.sr-only`) project list containing all 7 projects with names, taglines, and at least the primary external link (GitHub or live demo) per project, always present in the DOM. Constellation nav buttons MUST have `aria-pressed` managed to reflect the currently selected project.
- **FR-017**: The page MUST support full keyboard navigation: Tab through constellation buttons, arrow keys within the list, Enter to select, Escape to close panels.
- **FR-018**: The page MUST respect `prefers-reduced-motion` by disabling all non-essential animations and showing content in a static but complete state.
- **FR-019**: The page MUST respect `prefers-contrast: more` by switching to a high-contrast visual mode (white on black, simple outlines, hidden decorative elements).
- **FR-020**: All readable text MUST meet WCAG AA color contrast requirements (minimum 4.5:1 ratio). Brass color (#C8A84B and variants) MUST NOT be used for readable text — decoration only (~2.8:1, fails WCAG).
- **FR-021**: The WebGL canvas MUST have `aria-hidden="true"` and all interactive elements MUST have appropriate ARIA labels and roles. Focus indicators MUST include a dark offset ring when adjacent to brass/warm-colored surfaces to maintain 3:1 contrast against both dark panels and brass frame elements. Star nodes are NOT keyboard-focusable; the constellation nav is the exclusive keyboard access path to projects.

**Performance & Degradation**
- **FR-022**: The WebGL scene MUST maintain 60fps on integrated desktop GPUs (Intel Iris-class) as baseline.
- **FR-023**: The page MUST include auto-tier degradation that benchmarks performance starting 5 seconds after the reveal sequence completes (during idle steady-state, not during the high-load reveal) and reduces visual effects if frame times exceed 20ms average. The active tier MUST be logged to the console for verification.
- **FR-024**: The page MUST pause the WebGL render loop when the browser tab is hidden.
- **FR-025**: The page MUST display a static fallback (CSS frame + static orb image + project list) when WebGL is not available.
- **FR-026**: The page MUST display a "best viewed on wider screen" message when viewport width is below 1200px. The WebGL canvas and 3D renderer MUST NOT be initialized at viewports below 1200px.
- **FR-030**: The page MUST detect Safari WebGL shader compilation failures at startup via `renderer.compile()` with error detection and fall back to the static orb image if shader compilation fails.

**Media Handling**
- **FR-027**: Projects with video assets MUST use web-compatible formats (.mp4 and .webm), not .mov.
- **FR-028**: Projects with YouTube links MUST display a thumbnail with play button that opens YouTube in a new tab (no inline iframe embed).
- **FR-029**: Projects without visual assets MUST display a terminal-aesthetic placeholder with a category-appropriate SVG icon.

### Key Entities

- **Project**: A portfolio entry with identity (id, name, tagline, category), optional media (logoUrl, mediaType, mediaUrl), and external links (array of label+URL pairs). Each project maps to one star node and one constellation nav entry. 7 total.
- **Star Node**: A visual representation of a project inside the crystal ball. Has a 3D position, project accent color, hover state, click state, and companion halo sprite. 7 total.
- **Constellation Zone**: A scroll-driven grouping of related projects. Has a name, scroll range, nebula color shift, and associated star brightening behavior. 3-4 zones.
- **Project Detail Panel**: A modal overlay showing a single project's full information. Has 5 layout variants depending on available media: logo-only, screenshots, YouTube, native video, and external site.

### Brand Data Reference

The following brand-specific data is authoritative. Full details in INIT.md sections 1.2 and 1.6.

**Project-to-Constellation Mapping:**

| # | Project | Constellation Name | Accent Color |
|---|---|---|---|
| 1 | odd-ai-reviewers | The Forge Septet | Fire Orange `#FF6B35` |
| 2 | ado-git-repo-insights | The Scribe's Lens | Data Cyan `#00C9D4` |
| 3 | repo-standards | The Iron Codex | Law Gold `#F5C518` |
| 4 | odd-self-hosted-ci | The Engine Core | Systems Green `#4ADE80` |
| 5 | odd-map | The Navigator's Rose | Navigator Teal `#2DD4BF` |
| 6 | odd-fintech | The Alchemist's Eye | Wealth Violet `#A855F7` |
| 7 | Coney Island Pottsville | The Hearth Star | Hearth Rose `#FB7185` |

**Primary Brand Logo:** `design-assets/logo.svg` — ASCII-art SVG composed of mathematical symbols (π, √, ∞), white foreground on transparent background, 532×494px. Displayed in the top header band.

**Crystal Ball Rim Glow:** `#5ECFFF` (icy blue — contrasts warm brass frame)

**Typography (3 fonts, final):** Cinzel (display/headers), JetBrains Mono (terminal/UI), IM Fell English (body/overlay)

**Required CLI Copy Sequence:** `> reveal universe_` → `> calibrating orb...` → `> orb ignition sequence active` → `> universe revealed.` → `> select a constellation to begin`

### Assumptions

- The portfolio is a desktop-first experience; mobile receives a graceful degradation (static fallback) rather than a responsive layout.
- The reveal sequence plays automatically on page load without requiring user interaction to trigger.
- Scroll-driven interactions use artificial page height (scroll container) to create scroll room while the viewport remains pinned.
- All project data is hard-coded in the HTML file; no external API calls or dynamic data loading.
- Font families are loaded from Google Fonts CDN; this is acceptable for a POC (no self-hosting requirement).
- The 7 projects and their data are as specified in `portfolio-basic-list.md` with the converted assets in the `/assets` folder.
- The steampunk frame is achieved entirely through CSS (gradients, shadows, pseudo-elements, inline SVG) without external image files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can identify all 7 projects and access at least one external link within 90 seconds of page load.
- **SC-002**: The reveal sequence completes in under 7 seconds from page load.
- **SC-002a**: The discoverability affordance (scanning pulse + CLI prompt) is visible for a minimum of 3 seconds after the reveal sequence completes, and the prompt text explicitly describes star interactivity.
- **SC-003**: Project detail panels open within 100ms of a star click and display correct project-specific content (name, tagline, asset, links).
- **SC-004**: The page maintains smooth visual performance (60fps) on a laptop with an integrated GPU without visible stuttering or frame drops during normal interaction.
- **SC-005**: A keyboard-only user can navigate to any project, open its detail panel, access all links, and close the panel using only Tab, arrow keys, Enter, and Escape.
- **SC-006**: A screen reader user can access all project names, taglines, and links without interacting with the WebGL canvas.
- **SC-007**: When `prefers-reduced-motion` is enabled, the page loads with all content visible and accessible, no animations play, and all interactions still function.
- **SC-008**: When WebGL is unavailable, the visitor can still see all 7 project names, taglines, and access all external links through the HTML navigation and project list.
- **SC-009**: The page loads and becomes interactive (first click on a star triggers the detail panel) within 5 seconds on a standard broadband connection (10 Mbps).
- **SC-010**: The steampunk frame includes at minimum: brass corner ornamentation with visible gear/rivet detail, at least 2 functional-looking gauge elements, a command line input row with blinking cursor, an engraved/rune header band, and the crystal ball as the central visual anchor.
