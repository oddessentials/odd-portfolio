# Feature Specification: Separate Coney Island into Individual Portfolio Stars

**Feature Branch**: `016-coney-star-separation`
**Created**: 2026-03-07
**Status**: Draft
**Source**: [GitHub Issue #12](https://github.com/oddessentials/odd-portfolio/issues/12)
**Input**: Replace the single `coney-island` parent cluster entry with 3 independent portfolio stars, each with their own constellation position, metrics bar, and panel. Shift odd-map color away from orange to avoid visual confusion.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Individual Coney Stars with Metrics (Priority: P1)

A portfolio visitor scrolls to the "Applications & Products" constellation zone and sees three distinct Coney Island stars — website, chatbot, and mobile app — each glowing in a unique shade of orange. Clicking any one opens a dedicated panel showing that project's synopsis, capabilities, tech stack, and a live metrics bar (commits, PRs, LOC, tests) pulled from its own repository data.

**Why this priority**: The primary goal of Issue #12. Without individual repoKeys, the parent entry renders no metrics bar — the single biggest gap in the current portfolio presentation for Coney projects.

**Independent Test**: Click each of the 3 Coney stars and verify that each panel shows project-specific content and a populated metrics bar with real data.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded, **When** the visitor scrolls to the "Applications & Products" zone, **Then** three separate Coney-themed stars are visible in a tight spatial cluster near position [1.0, -1.0, 0.4].
2. **Given** the visitor clicks the coney-website star, **When** the panel opens, **Then** it displays the restaurant website synopsis, capabilities, tech stack, and a metrics bar showing 370 commits, 56 PRs, 3703 LOC, and 0 tests.
3. **Given** the visitor clicks the yo-coney-bot star, **When** the panel opens, **Then** it displays the AI chatbot synopsis, capabilities, tech stack (including AI model: OpenAI GPT-4o-mini), and a metrics bar showing 111 commits, 31 PRs, 10468 LOC, and 8 tests.
4. **Given** the visitor clicks the yo-coney-mobile star, **When** the panel opens, **Then** it displays the mobile app synopsis, capabilities, tech stack, and a metrics bar showing 44 commits, 6 PRs, 889 LOC, and 0 tests.
5. **Given** any Coney panel is open, **When** the visitor looks at the GitHub link, **Then** it points to `https://github.com/coneyislandpottsville/<repo-name>` (the new organization URL).

---

### User Story 2 - Orange Color Family Grouping (Priority: P2)

A visitor scanning the constellation can immediately perceive the three Coney stars as a related family because they share visually similar orange-spectrum accent colors, distinct from all other projects. The color progression (reddish-orange, warm orange, amber-orange) adds visual interest while maintaining family cohesion.

**Why this priority**: Owner requirement for visual grouping. The orange family creates an at-a-glance relationship between the three stars without needing labels or explicit connections.

**Independent Test**: View the constellation at the "Applications & Products" scroll position and confirm the 3 Coney stars are visually grouped by orange tones, while odd-map (now yellow-gold) and odd-fintech (red) are clearly distinct.

**Acceptance Scenarios**:

1. **Given** the constellation is visible, **When** the visitor views the "Applications & Products" zone, **Then** three orange-toned stars are clustered together, each with a distinct but related shade.
2. **Given** the 3 Coney stars are visible alongside odd-map and odd-fintech, **When** the visitor compares colors, **Then** odd-map reads as yellow-gold (not orange), odd-fintech reads as red (not orange), and the Coney stars read as orange.
3. **Given** any Coney star is hovered, **When** the accent color is applied to the reticle and panel, **Then** the color is distinctly orange-spectrum and matches the star's assigned accent.

---

### User Story 3 - Zone Atmosphere Update (Priority: P3)

The "Applications & Products" nebula zone shifts its atmospheric tint from the old amber (odd-map dominant) to a warmer orange that reflects the Coney cluster's new visual dominance in the zone. Constellation lines flow naturally through the Coney sub-cluster.

**Why this priority**: Enhances immersion but is not functionally required. The zone tint is a polish detail that reinforces the orange family theme at the environmental level.

**Independent Test**: Scroll through the "Applications & Products" zone and verify the nebula hue feels warm-orange rather than yellow-amber, and constellation lines connect the 3 Coney stars sequentially.

**Acceptance Scenarios**:

1. **Given** the visitor scrolls into the "Applications & Products" zone, **When** the zone transition occurs, **Then** the nebula atmosphere shifts to a warm orange tone.
2. **Given** constellation lines are visible, **When** the visitor observes the line path, **Then** lines connect sequentially through coney-website, yo-coney-bot, and yo-coney-mobile before continuing to repo-standards.

---

### User Story 4 - Sidebar Navigation Update (Priority: P1)

The sidebar project list replaces the single "Coney Island Pottsville" button with three individual buttons — one for each Coney project — enabling direct keyboard and click navigation to each star.

**Why this priority**: Accessibility-critical. The sidebar is the accessible interface (screen readers, keyboard users). Without individual buttons, 2 of 3 Coney projects are unreachable via keyboard.

**Independent Test**: Tab through the sidebar navigation and verify three separate Coney buttons exist, each opening the correct project panel.

**Acceptance Scenarios**:

1. **Given** the sidebar is visible, **When** the visitor scans the project list, **Then** three separate Coney project buttons appear (Coney Website, Yo Coney Bot, Yo Coney Mobile).
2. **Given** keyboard navigation is active, **When** the visitor presses Tab to reach a Coney button and presses Enter, **Then** the corresponding star is selected and its panel opens.

---

### Edge Cases

- What happens when the visitor clicks the old `coney-island` sidebar button via a cached page? The button no longer exists; the 3 new buttons replace it. No graceful fallback needed since this is a static site with no deep linking to individual projects.
- How does the constellation handle 13 stars in the "Applications & Products" zone (up from 4 interactive)? Lines auto-generate sequentially from the projectIds array; 6 lines connect 7 stars. Visual density should be verified but is expected to be acceptable.
- What if the shared logo SVG (`coney-island-logo-1024x690.svg`) fails to load? The panel falls back to showing no logo (existing behavior for null logoUrl projects). All 3 projects share the same asset path, so a single cache fetch serves all.
- How do the 3 tightly-clustered Coney stars behave on mobile (<768px)? Mobile has reduced particles and no reticle, but stars are still visible. The 0.22+ unit separation meets the 0.18 minimum for raycasting, though mobile touch targets should be verified.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The portfolio MUST display `coney-website`, `yo-coney-bot`, and `yo-coney-mobile` as three individual interactive stars in the constellation, replacing the single `coney-island` parent entry.
- **FR-002**: Each Coney star MUST have a unique `repoKey` mapping to its entry in the metrics data, enabling its panel to render a populated metrics bar (commits, PRs, LOC, tests).
- **FR-003**: Each Coney star MUST use an orange-spectrum accent color computed via HSL math: coney-website at H=25deg (#F6802C), yo-coney-bot at H=15deg (#F15927), yo-coney-mobile at H=35deg (#F4A333).
- **FR-004**: The `odd-map` project MUST shift its accent color from #F4A62A (H=37deg) to #F4D228 (H=50deg) to avoid visual confusion with the Coney orange family.
- **FR-005**: All 3 Coney stars MUST be positioned near the original coney-island location [1.0, -1.0, 0.4], maintaining a minimum 0.18 world-unit separation between any two stars (constitutional requirement).
- **FR-006**: The "Applications & Products" constellation zone MUST list all 3 Coney project IDs in its projectIds array, replacing the single `coney-island` reference.
- **FR-007**: The sidebar project navigation MUST replace the single "Coney Island Pottsville" button with 3 individual buttons for each Coney project.
- **FR-008**: The parent `coney-island` content entry MUST be removed from the authored content data. The 3 individual content entries (already existing) MUST be preserved unchanged.
- **FR-009**: The coney-website panel MUST display the existing restaurant photo (`assets/coney-island-restaurant-and-tavern.jpg`). The yo-coney-bot and yo-coney-mobile panels MUST accept null media (screenshot placeholders for now).
- **FR-010**: All 3 Coney project panels MUST share the existing logo asset (`assets/coney-island-logo-1024x690.svg`).
- **FR-011**: All Coney project GitHub links MUST point to the new organization (`https://github.com/coneyislandpottsville/<repo>`), not the archived oddessentials org.
- **FR-012**: All 3 Coney accent colors MUST pass WCAG AA contrast (minimum 4.5:1) against the page background (#0D0B09).
- **FR-013**: The "Applications & Products" zone atmosphere SHOULD update its nebula hue, constellation line colors, and watermark tint to reflect the Coney orange family's visual dominance.
- **FR-014**: Constellation lines in the "Applications & Products" zone MUST auto-generate correctly for the updated projectIds array, connecting stars sequentially including the 3 Coney stars.
- **FR-015**: The total draw call count after adding 2 net stars MUST remain under 30 (steady-state budget).

### Key Entities

- **Project Star**: An individual portfolio project rendered as an interactive star in the 3D constellation. Key attributes: unique ID, repoKey (maps to metrics), accent color (hex), star size (tier-based), 3D position, constellation zone membership.
- **Constellation Zone**: A scroll-driven grouping of project stars with shared atmospheric properties (nebula hue, line colors). The "Applications & Products" zone gains 2 net stars from this change.
- **Metrics Data**: Per-repository statistics (commits, PRs, LOC, tests, activity score) stored in a generated JSON artifact. Each Coney star maps to its own metrics entry via repoKey.
- **Authored Content**: Project-specific prose (synopsis, capabilities, tech stack, AI models) stored separately from the project data model. The 3 Coney content entries already exist; the parent rollup entry is removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 3 Coney stars render individually in the constellation with correct tier-based sizing (standard, minor, dwarf) — verified by visual inspection.
- **SC-002**: Each Coney panel displays a populated metrics bar with project-specific data (not null, not parent rollup) — verified by opening each panel.
- **SC-003**: The 3 Coney accent colors are perceptually distinct from each other and from odd-map's new yellow-gold — verified by hue wheel spacing (minimum 10deg between Coney neighbors, 15deg from odd-map).
- **SC-004**: All 3 Coney accent colors pass WCAG AA contrast against #0D0B09 — verified by contrast ratio calculation (all >= 5.8:1).
- **SC-005**: Total visible star count increases from 11 to 13 — verified by counting interactive stars in the constellation.
- **SC-006**: Sidebar navigation lists 3 individual Coney buttons, each keyboard-accessible and opening the correct panel — verified by Tab navigation test.
- **SC-007**: Steady-state draw calls remain under 30 after the change (expected ~19) — verified by renderer info or profiler.
- **SC-008**: No downstream module requires code changes beyond data files and HTML — verified by integration analysis (all rendering, raycasting, and animation logic is data-driven).

## Assumptions

- The 3 Coney content entries in `data-content.js` are complete and accurate; no content authoring is required for this feature.
- The `repo-metrics.json` artifact already contains entries for all 3 Coney repositories with correct activity scores and tier calculations.
- The shared logo SVG (`coney-island-logo-1024x690.svg`) is appropriate for all 3 Coney projects (it's the restaurant brand, not project-specific).
- Screenshot assets for yo-coney-bot and yo-coney-mobile will be added in a future update; null media is acceptable for initial launch.
- The archived repos at oddessentials will redirect or be replaced by the coneyislandpottsville org repos; GitHub links use the new org.
- The zone atmosphere tint update (FR-013) is a recommended enhancement, not a hard requirement. Conservative approach (keep existing zone colors) is acceptable.

## Color System Reference

### Proposed Star Colors (HSL-Computed)

| Project | Hex | Hue | Saturation | Lightness | Contrast vs #0D0B09 |
|---------|-----|-----|-----------|-----------|---------------------|
| coney-website | #F6802C | 25deg | 92% | 57% | ~6.5:1 (AA) |
| yo-coney-bot | #F15927 | 15deg | 88% | 55% | ~5.8:1 (AA) |
| yo-coney-mobile | #F4A333 | 35deg | 90% | 58% | ~7.0:1 (AAA) |
| odd-map (shifted) | #F4D228 | 50deg | 91% | 56% | ~9.2:1 (AAA) |

### Full Hue Wheel (13 Projects, Sorted)

```
 15deg  yo-coney-bot        #F15927  (orange-red)
 25deg  coney-website       #F6802C  (warm orange)
 35deg  yo-coney-mobile     #F4A333  (amber-orange)
 50deg  odd-map             #F4D228  (yellow-gold) [SHIFTED]
 55deg  socialmedia-syndicator #F0E442 (yellow)
 90deg  odd-ai-reviewers    #9FE060  (lime-green)
105deg  ado-git-repo-insights #38B000 (green)
174deg  odd-self-hosted-ci  #2EC4B6  (teal)
220deg  dead-rock-cluster   #6B7280  (gray)
228deg  ado-git-repo-seeder #3B5BDB  (blue)
270deg  experiments-cluster #5A189A  (purple)
275deg  repo-standards      #7B2CBF  (violet)
355deg  odd-fintech         #E63946  (red)
```

### Proposed Star Positions

| Project | Position [x, y, z] | Star Size | Separation from coney-website |
|---------|---------------------|-----------|-------------------------------|
| coney-website | [1.0, -1.0, 0.4] | 1.0 (standard) | -- (anchor) |
| yo-coney-bot | [0.85, -0.80, 0.35] | 0.89 (minor) | 0.25 units |
| yo-coney-mobile | [1.15, -1.15, 0.50] | 0.55 (dwarf) | 0.22 units |

### Zone Atmosphere Update (Recommended)

| Property | Old Value | New Value |
|----------|-----------|-----------|
| nebulaHue | "amber" | "orange" |
| nebulaHueRgb | [0.96, 0.65, 0.16] | [0.96, 0.50, 0.17] |
| hex | "#F4A62A" | "#F6802C" |
| hexBright | "#F0E442" | "#F4A333" |
| hexWatermark | "#A89B60" | "#B87540" |

## Files Affected

### Must Change
- `js/data.js` — Remove coney-island entry, insert 3 new entries, update CONSTELLATION_ZONES projectIds, update odd-map accentColor, optionally update zone tint colors
- `js/data-content.js` — Remove parent `coney-island` content key (3 child entries already exist)
- `index.html` — Replace single coney-island sidebar button with 3 individual buttons

### No Changes Required (Verified Safe)
- `js/scene.js` — Dynamic star creation, no hard-coded counts
- `js/panel.js` — Lookup by project object, handles non-cluster entries correctly
- `js/constellation-lines.js` — Auto-generates lines from zone projectIds
- `js/scroll-zones.js` — Runtime projectIds.includes() lookup
- `js/reticle.js` — Event-driven, no count dependency
- `js/sidebar-hieroglyphs.js` — Independent of star count
- `js/animations.js` — Stagger math scales automatically
- `js/interactions.js` — Attribute-based lookup
- `js/textures.js` — Per-star texture factory
- All other modules — No coney-island references

## Performance Impact

| Metric | Before | After | Budget | Status |
|--------|--------|-------|--------|--------|
| Draw calls (steady-state) | ~13 | ~19 | <30 | Safe |
| Star textures | 11 | 13 | <1MB | Safe (+~20KB) |
| Constellation lines (Apps zone) | 3 | 6 | N/A | Lightweight SVG |
| Raycasting targets | 11 | 13 | O(N) | Negligible |
| Mobile impact | -- | -- | -- | None (particle reduction in place) |
