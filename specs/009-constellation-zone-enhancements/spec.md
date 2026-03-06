# Feature Specification: Constellation Line and Zone Enhancements

**Feature Branch**: `009-constellation-zone-enhancements`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Enhance the constellation line system and scroll zone data model to incorporate the full authoritative project inventory from CONSTELLATIONS.md, with premium visual upgrades to constellation lines, while preserving all existing UX interactions, animations, and verbiage."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Expanded Portfolio Starfield (Priority: P1)

A visitor scrolls through the portfolio and sees the complete project inventory represented as interactive stars and visual clusters in the starfield, organized into three thematic zones. Two designated cross-zone bridge projects (odd-ai-reviewers and repo-standards) appear in multiple zones, reinforcing thematic connections between domains.

**Why this priority**: The core value of this feature is presenting the full, authoritative project inventory. Without this, the portfolio misrepresents the scope of work. Every other enhancement builds on top of having the correct data and zone structure in place.

**Independent Test**: Can be fully tested by loading the page and verifying all individual project stars are visible, positioned with proper separation, and that each zone contains the correct members. Clicking any star opens its project panel with complete data.

**Acceptance Scenarios**:

1. **Given** the page is loaded, **When** the visitor views the starfield at rest, **Then** they see 9 individual interactive project stars, 1 experiments cluster, and 1 dead rock cluster — 11 visual elements total.
2. **Given** the visitor scrolls into Zone 0, **When** the DevOps & Engineering zone activates, **Then** exactly 5 stars highlight (odd-ai-reviewers, ado-git-repo-insights, ado-git-repo-seeder, repo-standards, odd-self-hosted-ci) and constellation lines connect them.
3. **Given** the visitor scrolls into Zone 1, **When** the Applications & Products zone activates, **Then** exactly 4 elements highlight: odd-ai-reviewers (bridge from Zone 0), odd-map, odd-fintech, and socialmedia-syndicator. Constellation lines connect them.
4. **Given** the visitor scrolls into Zone 2, **When** the Community & Web zone activates, **Then** repo-standards (bridge from Zone 0), the Coney Island cluster, and the experiments cluster highlight. The dead rock cluster remains subdued/dim even in the active zone.
5. **Given** any star is clicked or its nav button activated, **When** the project panel opens, **Then** it displays the complete project name, tagline, media (if available), and all relevant links — identical behavior to the current 7 projects.
6. **Given** the visitor is on a device with `prefers-reduced-motion: reduce`, **When** the page loads, **Then** all stars are visible at their final positions with no animation, and all panel interactions work identically.

---

### User Story 2 - Premium Constellation Lines (Priority: P2)

A visitor scrolling through zones sees visually rich constellation lines connecting the stars within each zone — glowing gradient lines when a zone is active, and faint "star map" watermark lines at all other times, creating a persistent sense of the underlying constellation structure.

**Why this priority**: The constellation line visual upgrade is the marquee enhancement that elevates the portfolio from functional to premium. It directly addresses the owner's request for "prettier" lines and persistent watermarks, and is the most visually impactful change.

**Independent Test**: Can be tested by scrolling through all three zones and verifying that (a) active zone lines show gradient + glow + energy flow animation, (b) inactive zones show faint dashed watermark lines, and (c) transitions between zones are smooth.

**Acceptance Scenarios**:

1. **Given** no zone is active (page at rest/top), **When** the visitor views the starfield after the reveal sequence, **Then** all three zone constellations are visible as faint dashed watermark lines (approximately 0.15 opacity) connecting their respective stars.
2. **Given** the visitor scrolls into Zone 0, **When** the zone activates, **Then** the Zone 0 watermark lines transform into full active lines with theme-colored gradients, a subtle glow effect, and an animated energy flow along the stroke. Zones 1 and 2 remain as watermark lines.
3. **Given** the visitor scrolls from Zone 0 to Zone 1, **When** the transition occurs, **Then** Zone 0 lines fade from active back to watermark state while Zone 1 lines simultaneously elevate from watermark to active state. The transition is smooth with no visual pop or discontinuity.
4. **Given** the visitor is on a device with `prefers-reduced-motion: reduce`, **When** a zone activates, **Then** watermark lines for the active zone become solid (no animation) at full opacity, while inactive zones show static dashed lines. No energy flow animation plays.
5. **Given** the project overlay panel is open, **When** the visitor views the screen, **Then** all constellation lines (both active and watermark) are hidden behind the overlay and reappear when the panel closes.

---

### User Story 3 - Constellation Intro Showcase (Priority: P3)

During the reveal sequence, after stars ignite, the three zone constellations rapidly cycle on screen — flashing each zone's constellation lines briefly — before fading to the rest state. This teaches visitors that the star map has an underlying structure and that scrolling will reveal it.

**Why this priority**: The intro showcase is a discoverability mechanism. While not essential for content access, it primes the visitor to understand that scrolling reveals constellations, significantly improving engagement with the scroll-driven experience.

**Independent Test**: Can be tested by loading the page fresh and observing the reveal sequence — after stars appear (~5.2s), constellation lines should flash through all three zones in rapid succession before the rest state.

**Acceptance Scenarios**:

1. **Given** the desktop reveal sequence is playing, **When** stars finish their stagger-in animation (~5.2s mark), **Then** Zone 0 constellation lines flash on for ~0.4s, then Zone 1 for ~0.4s, then Zone 2 for ~0.4s, then all fade to the watermark rest state.
2. **Given** the intro constellation showcase is playing, **When** each zone flashes, **Then** the lines use the zone's theme color at moderate opacity (not full active glow) — a "preview" intensity, not the full active treatment.
3. **Given** the visitor clicks "Skip" or presses S during the reveal, **When** the reveal skips to completion, **Then** the constellation intro is skipped and the page enters the rest state with watermark lines visible.
4. **Given** the visitor is on mobile, **When** the mobile reveal plays, **Then** the constellation intro showcase is skipped entirely (mobile reveal is already abbreviated to ~4s).
5. **Given** `prefers-reduced-motion: reduce` is active, **When** the page loads, **Then** the constellation intro showcase does not play. Watermark lines appear instantly in their rest state.

---

### User Story 4 - Cluster Representations (Priority: P2)

The starfield includes two distinct cluster types — an experiments cluster (a tight grouping of small points with a shared halo) and a dead rock cluster (dim static points) — each with appropriate visual treatment and interaction behavior.

**Why this priority**: Clusters solve the visual clutter problem of displaying 20+ repositories as individual stars. They maintain the completeness of the portfolio while respecting the draw call budget and keeping the starfield readable. This is co-priority with constellation lines because it defines the visual elements those lines connect.

**Independent Test**: Can be tested by visually confirming both clusters appear in the starfield, that the experiments cluster is interactable (nav entry + panel), and that the dead rock cluster is visible but non-interactive.

**Acceptance Scenarios**:

1. **Given** the page is loaded, **When** the visitor views the starfield, **Then** the experiments cluster appears as a tight grouping of 4 small points with a shared faint nebulous halo, visually distinct from individual project stars.
2. **Given** the experiments cluster is in Zone 2, **When** Zone 2 activates via scroll, **Then** the experiments cluster highlights along with the other Zone 2 members and constellation lines connect to it.
3. **Given** the experiments cluster has a nav entry labeled "Experiments", **When** the visitor clicks the nav entry or the cluster in the starfield, **Then** a panel opens showing a list view of all 4 experiment repositories (oddessentials-splash, odd-portfolio, oddessentials-platform, odd-demonstration) with their names, descriptions, status badges, and links.
4. **Given** the dead rock cluster is in Zone 2, **When** the visitor views the starfield, **Then** the cluster appears as 6 very dim grey points with no glow, no pulse animation, and no interactivity. It is visible but subdued.
5. **Given** the dead rock cluster has no nav entry, **When** the visitor navigates with keyboard or touch, **Then** the dead rock cluster is not focusable, not clickable, and does not appear in the navigation list.
6. **Given** the Coney Island cluster represents 3 repos (coney-website, yo-coney-bot, yo-coney-mobile), **When** the visitor opens the Coney Island panel, **Then** the panel shows all three Coney Island repositories with their respective links, using an orange color theme.

---

### User Story 5 - Social & Presence Links (Priority: P3)

The portfolio includes links to the owner's professional presence across platforms (LinkedIn, GitHub org, NPM, Docker Hub, etc.), accessible from the main interface without cluttering the primary project navigation.

**Why this priority**: Social/presence links add professional credibility and discoverability but are secondary to the core portfolio content. They round out the portfolio as a complete professional hub.

**Independent Test**: Can be tested by verifying the social links section is visible, all links resolve correctly, and the section does not interfere with existing navigation or starfield interactions.

**Acceptance Scenarios**:

1. **Given** the page is loaded, **When** the visitor looks at the status panel area, **Then** a social/presence links section is visible below the existing status readout, styled consistently with the Victorian techno-mage aesthetic.
2. **Given** the social links section exists, **When** the visitor clicks any link, **Then** it opens the correct external URL in a new tab with `rel="noopener noreferrer"`.
3. **Given** the social links section exists, **When** the visitor navigates by keyboard, **Then** all social links are reachable via Tab and have visible focus indicators meeting WCAG 2.1 contrast requirements.
4. **Given** the page is viewed on mobile (<768px), **When** the status panel is not visible, **Then** the social links are accessible through the hamburger menu or another mobile-appropriate location.

---

### User Story 6 - Regression-Free Enhancement (Priority: P1)

All existing portfolio interactions, animations, verbiage, and accessibility features continue to function identically after the constellation and zone enhancements are implemented.

**Why this priority**: Co-P1 with the data model expansion because regressions in the existing experience would be worse than not shipping the enhancement at all. The current portfolio is loved; breaking it is unacceptable.

**Independent Test**: Can be tested by performing a complete walkthrough of all existing interactions (reveal sequence, scroll zones, star hover/click, panel open/close, keyboard nav, reduced motion, high contrast, mobile hamburger, skip intro) and comparing behavior frame-by-frame with the pre-enhancement version.

**Acceptance Scenarios**:

1. **Given** the page loads on desktop, **When** the reveal sequence plays, **Then** the frame assembly, console power-up, and starfield ignition phases play with identical timing and choreography to the pre-enhancement version, with the constellation intro showcase appended after star ignition.
2. **Given** any of the original 7 project stars is clicked, **When** the panel opens, **Then** all existing panel content (title, tagline, logo, media, links) is identical to the pre-enhancement version.
3. **Given** the visitor scrolls through zones, **When** zones activate, **Then** the nebula hue shift, star highlighting/dimming, gauge needle spring animation, command line text updates, and phase indicator updates all function identically to the pre-enhancement version (with updated zone names and membership).
4. **Given** the visitor hovers over a star, **When** the reticle appears, **Then** the targeting reticle, hover scale animation, and label display function identically.
5. **Given** `prefers-reduced-motion: reduce` is enabled, **When** the page loads, **Then** all reduced motion behaviors are preserved — no scroll-driven scene changes, instant panel transitions, static nebula, no pulse, no burst.
6. **Given** `prefers-contrast: more` is enabled, **When** the page loads, **Then** high contrast overrides are preserved — white text on black, decorative elements hidden.
7. **Given** mobile viewport (<768px), **When** the hamburger menu is used, **Then** navigation opens/closes correctly, touch guard (first tap expands tagline, second opens panel) works, and arrow key navigation within the nav list functions.

---

### Edge Cases

- What happens when the visitor scrolls extremely fast through all three zones? Constellation line transitions must not stack or produce visual artifacts. The existing `fadeSequence` race condition guard must be extended to handle watermark-to-active transitions.
- How does the starfield behave when the browser window is resized mid-scroll with constellation lines visible? SVG line endpoints must update via the existing tick function for both active and watermark lines.
- What happens when WebGL context is lost while constellation lines are displayed? SVG constellation lines are DOM elements, not WebGL — they should persist through context loss and restore.
- How does the dead rock cluster behave in the nebula color-tinted zone? It must remain desaturated grey regardless of zone hue influence — its "dead" appearance is intentional.
- What happens when an "In-Progress" project (socialmedia-syndicator, oddessentials-platform) has incomplete panel data? The panel must display whatever data is available with appropriate placeholder treatment (category icon, tagline, available links) — no empty or broken panels.
- How do bridge stars behave during zone transitions? When scrolling from Zone 0 to Zone 1, odd-ai-reviewers is highlighted in both zones — its highlight state must persist through the transition without flickering off and back on. Constellation lines in Zone 0 that connect to odd-ai-reviewers must fade to watermark while Zone 1 lines connecting to the same star simultaneously activate. The star's scale and opacity must not "double-apply" from being in two active highlight sets.
- How do clusters behave compared to individual stars across ALL interaction paths? Clusters are a second class of entity and must be handled consistently: (a) raycasting must detect cluster hit areas, (b) scroll-zone highlighting must scale/dim clusters the same way it does individual stars, (c) constellation lines must connect to a cluster's visual center point, (d) the nav must treat cluster entries identically to project entries for keyboard navigation and touch guard, (e) the reticle must track cluster center on hover, and (f) the reveal sequence star-stagger must include clusters in the stagger order.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Data Model & Zone Structure

- **FR-001**: System MUST support a variable number of project entries (not limited to 7), each with: id, name, shortDesc, tagline, category, accentColor, starSize, position, logoUrl, mediaType, mediaUrl, screenshots, links, glyphName, glyphRotation, glyphType, glyphAtlasIndex, constellation, and new fields: `status` (active | in-progress | paused), `isCluster` (boolean), `clusterMembers` (array of member objects, each with name, description, url, and status).
- **FR-002**: System MUST define exactly 3 constellation zones with two designated cross-zone bridges: Zone 0 "DevOps & Engineering" (5 members: odd-ai-reviewers, ado-git-repo-insights, ado-git-repo-seeder, repo-standards, odd-self-hosted-ci), Zone 1 "Applications & Products" (4 members: odd-ai-reviewers as bridge, odd-map, odd-fintech, socialmedia-syndicator), Zone 2 "Community & Web" (4 members: repo-standards as bridge, Coney Island cluster, experiments cluster, dead rock cluster non-interactive).
- **FR-003**: System MUST include `ado-git-repo-seeder` as a new individual interactive star in Zone 0 with panel data: tagline "Azure DevOps activity simulator", description "Node.js tool to seed realistic, multi-user Pull Request activity in Azure DevOps", category "devops", link to oddessentials.com and GitHub, accent color derived as a hue relative to its DevOps zone siblings.
- **FR-004**: System MUST include `socialmedia-syndicator` as a new individual interactive star in Zone 1 with status "in-progress", panel data: tagline "Admin-approved social media posts", description "Facebook & X Social Media post creator with admin approval", category "application", link to oddessentials.com and GitHub, accent color derived as a hue relative to its Applications zone siblings.
- **FR-005**: System MUST maintain two cross-zone bridge projects: odd-ai-reviewers appears in BOTH Zone 0 and Zone 1, repo-standards appears in BOTH Zone 0 and Zone 2. odd-self-hosted-ci is NOT a bridge and appears ONLY in Zone 0. Bridge stars highlight in every zone they belong to and constellation lines connect to them in each zone.
- **FR-006**: System MUST update the `nebulaHueRgb` values for each zone to match the renamed zone themes while preserving the visual distinctiveness of the three-phase color shift.

#### Constellation Line Visual Enhancements

- **FR-007**: When a zone is active, constellation lines connecting zone members MUST use SVG linear gradients colored to match the zone's theme, with a subtle glow effect achieved via SVG filter (feGaussianBlur).
- **FR-008**: Active constellation lines MUST display an animated "energy flow" effect using animated stroke-dasharray, creating the visual impression of energy traveling along the line.
- **FR-009**: When a zone is NOT active, its constellation lines MUST be displayed as faint dashed "watermark" lines at approximately 0.15 opacity with a stroke-dasharray pattern, connecting all zone members persistently.
- **FR-010**: All three zones' watermark lines MUST be visible simultaneously when no zone is active (rest state after reveal completes).
- **FR-011**: Zone transitions MUST smoothly crossfade: the previously active zone's lines fade to watermark state while the newly active zone's lines elevate from watermark to active state. No visual pop or discontinuity.
- **FR-012**: The existing `fadeSequence` race condition guard MUST be extended to cover watermark-to-active and active-to-watermark transitions to prevent stale callbacks.
- **FR-013**: SVG constellation lines MUST continue to track star world positions via the per-frame tick function for both active and watermark lines.
- **FR-014**: Constellation lines (both active and watermark) MUST be hidden when the project overlay panel is open and restored when it closes.

#### Constellation Intro Showcase

- **FR-015**: During the desktop reveal sequence, after stars complete their stagger-in animation (~5.2s), system MUST play a constellation showcase: Zone 0 lines flash at preview intensity for ~0.4s, then Zone 1 for ~0.4s, then Zone 2 for ~0.4s, then all fade to watermark rest state.
- **FR-016**: The constellation intro showcase MUST be skippable — if the reveal is skipped (button or S key or scroll), the showcase is skipped and the rest state with watermark lines appears immediately.
- **FR-017**: The constellation intro showcase MUST NOT play on mobile or when `prefers-reduced-motion: reduce` is active.

#### Cluster Visual Representations

- **FR-018**: The experiments cluster MUST render as a tight grouping of 4 small points (one per experiment repo) with a shared faint nebulous halo, visually distinct from individual project stars (smaller point size, lower individual opacity, shared glow).
- **FR-019**: The experiments cluster MUST have a single nav entry labeled "Experiments" that, when clicked, opens a cluster panel showing a list view of all member repositories with name, description, status badge, and links.
- **FR-020**: The dead rock cluster MUST render as 6 very dim grey points with no glow, no pulse animation, completely static. It MUST NOT have a nav entry and MUST NOT be interactive (no click, no hover, no keyboard focus).
- **FR-021**: The dead rock cluster MUST remain visually subdued even when its parent zone (Zone 2) is active — no scale increase, no opacity boost beyond a minimal bump, maintaining its "dead" appearance.
- **FR-022**: The Coney Island star MUST remain a single interactive star (not a visual cluster), but its panel MUST display all 3 Coney Island repositories (website, chat bot, mobile app) in a list format with their respective links.
- **FR-023**: The Coney Island cluster MUST use a true orange color spectrum accent (shifting from the current rose-pink `#FB7185` to orange). All project accent colors within the Community & Web zone (Zone 2) MUST be refactored to demonstrate natural spectral order — colors adjacent on the spectrum should be assigned to visually adjacent stars/clusters.

#### Navigation & Panel Updates

- **FR-024**: The `#constellation-nav` MUST expand to include nav buttons for all individual interactive stars (9 total) plus the experiments cluster (1 entry) — 10 nav entries total. Dead rock cluster has no nav entry.
- **FR-025**: Each new nav button MUST include a glyph SVG, project name, and short description, consistent with existing nav button structure.
- **FR-026**: Projects with status "in-progress" MUST display a visible status indicator (badge or label) in both the nav entry and the project panel.
- **FR-027**: The cluster panel (for experiments cluster) MUST display a list of member repositories, each with: name, short description, status badge (if in-progress), and primary link.
- **FR-028**: The SR-only project list MUST expand to include all interactive projects and cluster members with name, tagline, and primary link.

#### Social & Presence Links

- **FR-029**: System MUST display a social/presence links section in the status panel, below the existing status readout, containing inline SVG icon links to: LinkedIn, Facebook, X/Twitter, GitHub organization, NPM, PyPI, Docker Hub, VS Marketplace, Codecov, Medium.
- **FR-030**: Each social link MUST open in a new tab with `rel="noopener noreferrer"` and MUST have an accessible label (aria-label with platform name).
- **FR-031**: Social links MUST be reachable via keyboard navigation and MUST have focus indicators meeting WCAG 2.1 requirements.
- **FR-032**: On mobile, social links MUST be accessible through the hamburger navigation or an equivalent mobile-appropriate location.

#### Accessibility & Regression Prevention

- **FR-033**: All existing keyboard navigation patterns MUST be preserved: Tab through nav buttons, arrow keys within nav list, Enter to select, Escape to close panel/hamburger.
- **FR-034**: All existing `prefers-reduced-motion` behaviors MUST be preserved and extended to cover new animations (energy flow, constellation intro, cluster pulse).
- **FR-035**: All existing `prefers-contrast: more` behaviors MUST be preserved.
- **FR-036**: The reveal sequence timing and choreography MUST be preserved for all existing phases (frame assembly, console power-up, starfield ignition). The constellation intro showcase is appended after star ignition, not inserted into existing phases.
- **FR-037**: All existing project panel content for the original 7 projects MUST remain identical — same titles, taglines, logos, media, links.
- **FR-038**: The existing star idle pulse, nebula hue shift, gauge needle animation, command line text, phase indicator, reticle hover, bronze tool flash, Odd Bot rotation, and scroll-to-explore affordance MUST all continue to function identically (with updated zone membership data).
- **FR-039**: Existing touch guard behavior on mobile (first tap expands tagline, second tap opens panel) MUST be preserved for all nav entries including new ones.

#### Constitution Amendment

#### Bridge & Cluster Consistency

- **FR-042**: Bridge stars (odd-ai-reviewers, repo-standards) MUST maintain a stable highlight state during zone transitions — when transitioning between two zones that share a bridge star, the star's scale and opacity MUST NOT flicker, reset, or double-apply. The bridge star stays highlighted while its constellation lines smoothly swap between the outgoing zone's watermark and the incoming zone's active state.
- **FR-043**: Bridge stars MUST be excluded from the "dim to 0.5 opacity" behavior when they belong to the currently active zone, even if they also belong to another zone that is not active. A bridge star is highlighted whenever ANY of its zones is active.
- **FR-044**: Clusters MUST be treated as first-class entities across ALL interaction systems: (a) raycasting/click detection, (b) scroll-zone highlighting (scale + opacity), (c) constellation line endpoint targeting (lines connect to cluster center), (d) nav keyboard navigation and touch guard, (e) reticle tracking on hover (for interactive clusters), (f) reveal sequence star-stagger ordering, and (g) panel open/close with focus trap. Any interaction path that works for individual stars MUST work equivalently for interactive clusters.
- **FR-045**: The dead rock cluster is explicitly EXEMPT from FR-044 — it is not interactive, not navigable, and not focusable. It is a purely visual element that follows only the rendering and zone-dimming behaviors.

#### Constitution Amendment

- **FR-040**: The project constitution (Principle I) MUST be amended in TWO places: (a) the conceptual rule expanding "7 projects" to "variable project count with cluster support", and (b) the technical contract expanding "star positions are 7 hard-coded (x, y, z) values" to "star and cluster positions are data-driven from the project array." New data model fields: `status` (active | in-progress | paused), `isCluster` (boolean), `clusterMembers` (array). The shader feature list remains frozen — all constellation line enhancements are SVG-based.
- **FR-041**: During implementation, any legacy glyph atlas infrastructure (GLYPH_ATLAS_CELLS in data.js, sidebar-hieroglyphs.js atlas references) MUST be audited. If the atlas system is not actively in use or has been simplified, unused atlas cruft MUST be cleaned up rather than extended.

### Key Entities

- **Project**: An individual repository represented as an interactive star in the starfield. Has complete panel data, a nav entry, and belongs to exactly one zone. Attributes: id, name, tagline, category, status, accent color, star size, 3D position, media, links.
- **Cluster**: A visual grouping of related repositories represented as a single visual element in the starfield. May or may not be interactive. Attributes: id, name, isCluster flag, cluster members array, accent color, 3D position, zone membership.
- **Cluster Member**: A repository within a cluster. Has: name, description, status, primary URL. Not individually represented as a star.
- **Constellation Zone**: A scroll-driven grouping of projects/clusters that activates together. Has: name, scroll range, member IDs, nebula hue, status text. Exactly 3 zones. Two designated bridge projects (odd-ai-reviewers, repo-standards) appear in multiple zones.
- **Constellation Line**: An SVG line connecting two zone members. Has two states: active (gradient + glow + energy flow) and watermark (faint dashed). Tracks star world positions per frame.
- **Social Link**: An external platform presence link. Has: platform name, URL, inline SVG icon.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 9 individual project stars and 2 clusters are visible in the starfield, with each belonging to exactly one of the three zones — verified by scrolling through all zones and confirming correct highlight membership.
- **SC-002**: Active constellation lines display gradient coloring, glow effect, and energy flow animation that is visually distinguishable from the watermark state at normal viewing distance.
- **SC-003**: Watermark constellation lines for all three zones are simultaneously visible when no zone is active, creating a persistent "star map" effect.
- **SC-004**: Zone transitions complete smoothly within 0.6 seconds, with no visual pop, flicker, or stale line artifacts during rapid scrolling.
- **SC-005**: The constellation intro showcase completes within 1.5 seconds (3 zones x ~0.4s + fade-out) and does not delay access to the scroll interaction.
- **SC-006**: Clicking any interactive star or nav entry opens a complete project panel within 100ms, matching the existing panel open performance.
- **SC-007**: The experiments cluster panel displays all 4 member repositories with names, descriptions, and links in a readable list format.
- **SC-008**: Desktop framerate remains at 60fps steady state with all watermark lines visible, on an integrated GPU (Intel Iris-class). Draw calls remain under 30 steady state.
- **SC-009**: All existing interactions from the pre-enhancement version (reveal sequence, panel behavior, keyboard nav, reticle, reduced motion, high contrast) pass a side-by-side comparison test with no observable regressions.
- **SC-010**: Social/presence links section displays all platform links with working URLs, accessible labels, and keyboard navigability.
- **SC-011**: The complete enhancement works correctly in Chrome, Firefox, and Safari on desktop, and the mobile view (<768px) shows all content accessibly through the hamburger navigation.
- **SC-012**: The page weight increase from new project data, SVG filters, and social link icons does not exceed 15KB total (well within the 800KB budget).

---

## Assumptions

1. **Zone names will be updated**: "DevOps Pipeline" becomes "DevOps & Engineering", "Products & Analytics" becomes "Applications & Products", "Community & Web" remains. Command line text and phase indicators update to match.
2. **Existing star positions preserved**: The 7 original project stars retain their exact 3D positions. Only new stars (ado-git-repo-seeder, socialmedia-syndicator) and clusters need new positions.
3. **Glyph atlas audit required**: The existing GLYPH_ATLAS_CELLS system (4x2 atlas, 8 cells) may contain unused cruft. Audit before extending — if simplified or unused, clean up rather than expand.
4. **Coney Island shifts to orange**: Owner approved. The accent color shifts from `#FB7185` (rose-pink) to a true orange. Adjacent colors in Zone 2 are refactored for spectral coherence.
5. **Cross-zone bridges are intentional**: odd-ai-reviewers bridges Zone 0 and Zone 1. repo-standards bridges Zone 0 and Zone 2. These are deliberate connections that reinforce the portfolio narrative. odd-self-hosted-ci is NOT a bridge (Zone 0 only).
6. **Accent colors derived from zone families**: New stars (ado-git-repo-seeder, socialmedia-syndicator) get accent colors that are hue-relatives of their zone siblings, maintaining spectral coherence within each zone.
7. **SVG filters are GPU-accelerated**: Modern browsers hardware-accelerate SVG filters (feGaussianBlur, feDropShadow). Performance impact on integrated GPUs is negligible for the small number of lines (max ~5 lines per zone).
8. **No new external assets required for clusters**: Clusters use procedural visuals (canvas-drawn textures, CSS styling) consistent with the procedural-first asset strategy.
9. **Social link icons are inline SVG**: Following the constitution's "no icon font CDN" rule, all social platform icons are hand-crafted inline SVG paths, each under 500 bytes.
10. **Experiment repo descriptions provided**: oddessentials-splash ("Main website of Odd Essentials, LLC"), odd-portfolio ("Curated portfolio of all public Odd Essentials"), oddessentials-platform ("AI software expert open chat"), odd-demonstration ("Polyglot microservices demonstration").

---

## Prerequisites & Blocking Items

All previously-blocking items have been resolved by owner input. Remaining work is implementation-derivable.

| Item | Category | Status | Blocking? |
| ---- | -------- | ------ | --------- |
| Panel data for ado-git-repo-seeder | Content | RESOLVED — tagline, description, links provided | NO |
| Panel data for socialmedia-syndicator | Content | RESOLVED — tagline, description, links provided | NO |
| Accent colors for new stars | Design Decision | RESOLVED — derive as hue-relatives of zone siblings | NO |
| Coney Island accent color | Design Decision | RESOLVED — shift to true orange, refactor adjacent colors | NO |
| Constitution amendment (Principle I + technical contract) | Governance | APPROVED — update both conceptual rule and position constraint | NO |
| Experiment repo descriptions | Content | RESOLVED — all 4 descriptions provided | NO |
| Cross-zone bridge decision | Design Decision | RESOLVED — odd-ai-reviewers (Z0+Z1), repo-standards (Z0+Z2) | NO |
| Glyph atlas audit | Technical | Audit during implementation — clean up cruft if unused | NO |
| 3D positions for new stars + clusters | Design Decision | Compute during implementation (0.18 unit separation) | NO |
| Zone nebulaHueRgb values | Design Decision | Default to existing, adjust if needed for renamed zones | NO |
| Glyph designs for new nav entries | Asset | Derive from existing rotation variants | NO |
| Social media inline SVG icons (11 platforms) | Asset | Create during implementation | NO |
| Paused repo descriptions | Content | NOT NEEDED — dead rock cluster is non-interactive | NO |
