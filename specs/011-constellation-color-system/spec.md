# Feature Specification: Constellation Star System & Color Logic

**Feature Branch**: `011-constellation-color-system`
**Created**: 2026-03-06
**Status**: Draft
**Input**: CONSTELLATIONS.md + owner-provided authoritative color table (2026-03-06)

## Canonical Constellation Configuration

This is the single source of truth for the entire constellation system. All consumers (renderer, constellation lines, panel, gauges) read from this structure. Colors are static data — they MUST NOT be interpolated, derived, or computed at runtime.

| Project ID              | System  | Hex     | Size Tier   | Scale |
| ----------------------- | ------- | ------- | ----------- | ----- |
| odd-ai-reviewers        | middle  | #9FE060 | Anchor      | 2.33  |
| odd-fintech             | group2  | #E63946 | Anchor      | 2.33  |
| coney-island            | group2  | #F68A2B | Major       | 1.44  |
| odd-map                 | group2  | #F4A62A | Major       | 1.44  |
| ado-git-repo-insights   | middle  | #38B000 | Standard    | 1.00  |
| odd-self-hosted-ci      | middle  | #2EC4B6 | Standard    | 1.00  |
| repo-standards          | group3  | #7B2CBF | Standard    | 1.00  |
| socialmedia-syndicator  | group2  | #F0E442 | Supporting  | 0.89  |
| ado-git-repo-seeder     | middle  | #3B5BDB | Supporting  | 0.89  |
| experiments-cluster     | group3  | #5A189A | Peripheral  | 0.55  |
| dead-rock-cluster       | (none)  | #6B7280 | Peripheral  | 0.55  |

### Size Ladder Reference

| Tier        | Scale Value | Visual Intent                        |
| ----------- | ----------- | ------------------------------------ |
| Anchor      | 2.33        | Flagship — largest, most prominent   |
| Major       | 1.44        | Key products — noticeably large      |
| Standard    | 1.00        | Solid projects — default presence    |
| Supporting  | 0.89        | Supporting tools — slightly smaller  |
| Peripheral  | 0.55        | Experimental/archive — smallest      |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - System-Coherent Star Colors (Priority: P1)

A portfolio visitor scrolling through the constellation sees stars grouped into visually distinct color families. Projects belonging to the same conceptual system share a recognizable palette, making organizational structure immediately apparent without reading labels.

**Why this priority**: Color coherence is the entire purpose of this feature. Without it, star colors remain arbitrary and communicate no meaning.

**Independent Test**: Load the portfolio and visually confirm that each system's stars display their assigned hex colors from the authoritative table, while paused/archived projects remain gray.

**Acceptance Scenarios**:

1. **Given** the portfolio loads with all 11 projects, **When** the visitor views the starfield, **Then** the 4 Group 2 stars display: coney-island (#F68A2B orange), odd-fintech (#E63946 red), odd-map (#F4A62A amber), socialmedia-syndicator (#F0E442 yellow).
2. **Given** the portfolio loads, **When** the visitor views the starfield, **Then** the 4 Middle System stars display: odd-ai-reviewers (#9FE060 lime), ado-git-repo-insights (#38B000 green), odd-self-hosted-ci (#2EC4B6 teal), ado-git-repo-seeder (#3B5BDB blue).
3. **Given** the portfolio loads, **When** the visitor views the starfield, **Then** the 2 Group 3 stars display: repo-standards (#7B2CBF purple) and experiments-cluster (#5A189A deep purple).
4. **Given** the portfolio loads, **When** the visitor views the dead-rock-cluster star, **Then** it remains gray (#6B7280) with no system color applied.

---

### User Story 2 - Zone-Aligned Nebula & Line Colors (Priority: P2)

As the visitor scrolls through constellation zones, the nebula background and constellation line colors harmonize with the dominant star system in that zone. Zone atmospherics complement the new palette without overriding individual star colors.

**Why this priority**: Without zone color alignment, the new system star colors will visually clash with the existing nebula and constellation line hues.

**Independent Test**: Scroll through all 3 zones and confirm the nebula tint and constellation line strokes harmonize with the dominant system's color family in each zone.

**Acceptance Scenarios**:

1. **Given** the visitor scrolls into Zone 0 (DevOps & Engineering), **When** the zone activates, **Then** the nebula tints toward the Middle System's green-teal range and constellation lines use harmonizing hex colors.
2. **Given** the visitor scrolls into Zone 1 (Applications & Products), **When** the zone activates, **Then** the nebula tints toward Group 2's warm orange-amber range and constellation lines use harmonizing hex colors.
3. **Given** the visitor scrolls into Zone 2 (Community & Web), **When** the zone activates, **Then** the nebula tints toward Group 3's purple range and constellation lines use harmonizing hex colors.
4. **Given** the visitor scrolls between zones, **When** the zone transition occurs, **Then** nebula color, constellation line gradients, and glow filters all transition smoothly (0.3s ease) without jarring color jumps.

---

### User Story 3 - Bridge Star Multi-Zone Highlighting (Priority: P2)

The repo-standards project serves as a bridge star appearing in all 3 scroll zones. When any zone highlights, repo-standards participates in the highlight animation (scale 1.3x, full opacity) while always retaining its assigned hex color (#7B2CBF).

**Why this priority**: repo-standards is intentionally cross-domain. Losing its multi-zone highlight would be a UX regression.

**Independent Test**: Scroll through all 3 zones and confirm repo-standards highlights with scale and opacity changes in each zone while always displaying its purple #7B2CBF color.

**Acceptance Scenarios**:

1. **Given** the visitor scrolls into any of the 3 zones, **When** that zone activates, **Then** repo-standards scales to 1.3x and reaches full opacity alongside the other zone stars.
2. **Given** repo-standards is assigned #7B2CBF, **When** it highlights in any zone, **Then** it retains #7B2CBF regardless of that zone's dominant system color.

---

### User Story 4 - Locked Size Hierarchy (Priority: P3)

Each project star is sized according to an explicit, locked mapping from project to Fibonacci-inspired size tier. No interpretation or runtime calculation of importance is needed — every project's size tier is defined in the canonical configuration.

**Why this priority**: Size variation adds visual hierarchy beyond color. Explicit mapping eliminates ambiguity.

**Independent Test**: Load the starfield and visually verify each project matches its assigned size tier from the canonical configuration table.

**Acceptance Scenarios**:

1. **Given** the portfolio loads, **When** the visitor views the starfield, **Then** each project's star size matches its locked tier assignment exactly.
2. **Given** the dead-rock-cluster (paused), **When** rendered, **Then** it uses the smallest size tier (Peripheral, 0.55) and, combined with its gray color and reduced opacity, remains the least visually prominent star in the field.

---

### User Story 5 - Panel Accent Color Consistency (Priority: P3)

When a visitor clicks a cluster star to open the project detail panel, the cluster member names in the panel are styled with the project's assigned hex from the authoritative color table. Non-cluster panels do not currently display accent color styling.

**Why this priority**: Inconsistency between star color and panel cluster member styling would confuse visitors.

**Independent Test**: Click each cluster project star and confirm the cluster member names in the panel use the project's hex color from the authoritative table.

**Acceptance Scenarios**:

1. **Given** the visitor clicks experiments-cluster (Group 3), **When** the panel opens, **Then** all cluster sub-member names use #5A189A (deep purple).
2. **Given** the visitor clicks coney-island (Group 2), **When** the panel opens and shows related repos, **Then** the related repo names use #F68A2B (orange).

---

### Edge Cases

- What happens when the chromatic twinkle effect fires on a bright yellow (#F0E442) or lime (#9FE060) star? Saturation boost may clip — the twinkle should clamp to avoid washed-out results on already-bright system colors.
- How does the deep purple (#5A189A) experiments-cluster render against the dark scene background? Its low luminance may make it hard to see — visual verification is required and halo opacity may need adjustment.
- How do cluster sub-member points inherit system color? The parent cluster's assigned hex applies uniformly to all sub-member points within the cluster group.
- What happens if a new project is added in the future? A new row is added to the canonical configuration with its system, hex, and size tier. No interpolation logic exists — every color is explicitly assigned.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST define a single canonical configuration structure containing, for each project: project id, system id, assigned hex color, and size tier. This is the sole source of truth for the entire constellation system.
- **FR-002**: The canonical configuration MUST include exactly the 10 active projects with their authoritative hex values as specified in the color table above. The dead-rock-cluster MUST be included with hex #6B7280 and no system assignment.
- **FR-003**: Star colors MUST be treated as static data read from the configuration. The renderer MUST NOT compute, interpolate, or derive colors at runtime — colors are looked up, never calculated.
- **FR-004**: Star positions MUST NOT be modified. The constellation layout, coordinates, and geometry MUST remain exactly as they are today. All existing hand-placed Cartesian positions in the project data are preserved.
- **FR-005**: All existing interactions MUST be preserved unchanged: scroll zones, hover states, star highlighting (scale 1.3x, opacity changes), bridge-star behavior, constellation line animations, gauge animations, reticle tracking, and panel open/close. Only colors change.
- **FR-006**: repo-standards MUST remain a bridge star appearing in all 3 scroll zone projectId lists. It MUST always retain its assigned hex color (#7B2CBF) regardless of which zone is active.
- **FR-007**: System MUST apply the Fibonacci-inspired size ladder with an explicit, locked mapping from each project to a size tier. The size tiers are: Anchor (2.33), Major (1.44), Standard (1.00), Supporting (0.89), Peripheral (0.55). Each project's tier MUST be defined in the canonical configuration — no runtime importance calculation.
- **FR-008**: Zone atmospherics (nebula tint, constellation line hex/hexBright/hexWatermark, and glow filters) MUST harmonize with the dominant system colors in each zone. Zone atmospheric colors are derived from the system palette but MUST NOT override individual star colors.
- **FR-009**: System MUST NOT introduce new draw calls, rendering layers, or animation systems. All color changes operate through existing material uniforms, SVG DOM attributes, and canvas texture regeneration. Steady-state draw calls remain under 30.
- **FR-010**: Paused or archived stars (dead-rock-cluster) MUST remain gray (#6B7280) and outside the system color model. They MUST NOT participate in system color logic.
- **FR-011**: The parent cluster's assigned hex MUST apply uniformly to all sub-member points within cluster groups rendered as multi-point sprites (experiments-cluster, dead-rock-cluster). For projects with `clusterMembers` but `isCluster: false` (e.g., coney-island), the accent color applies to cluster member names in the panel overlay only.

### Key Entities

- **Canonical Constellation Configuration**: Single authoritative data structure mapping each project to its system id, hex color, and size tier. Used by the renderer, constellation lines, panel, and all other consumers. No other color or size source exists.
- **Star System**: A conceptual grouping (Group 2, Middle, Group 3) used for zone atmospheric derivation. Defined by its member projects and their pre-assigned colors.
- **Project (updated)**: Existing accentColor and starSize fields receive values from the canonical configuration. No new fields required if system membership is expressed through the configuration structure rather than per-project fields.
- **Constellation Zone (updated)**: Retains scroll-driven behavior. Updated hex/hexBright/hexWatermark/nebulaHueRgb values harmonize with the dominant system's palette.
- **Size Ladder**: Fixed mapping of tier names (Anchor, Major, Standard, Supporting, Peripheral) to scale values (2.33, 1.44, 1.00, 0.89, 0.55).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 10 active project stars display their exact assigned hex color from the authoritative table when the portfolio loads — zero color mismatches, zero runtime color computation.
- **SC-002**: The dead-rock-cluster retains gray (#6B7280) and is visually distinguishable from all system-colored stars.
- **SC-003**: Scrolling through all 3 zones produces harmonious color environments — nebula hue, constellation line strokes, and star colors all feel cohesive within each zone.
- **SC-004**: repo-standards highlights (scale + opacity) in all 3 scroll zones without losing its purple #7B2CBF color.
- **SC-005**: Star sprite colors are exempt from text contrast requirements (they are non-text visual elements). When a system-assigned color is used as panel text (e.g., cluster member names), it MUST meet WCAG AA contrast (4.5:1 minimum) against the dark background (#0D0B09). If the project's hex fails AA, use the zone's `hexBright` value instead for text rendering.
- **SC-006**: Steady-state draw call count remains under 30 (no increase from color changes).
- **SC-007**: Each project's star size matches its explicitly assigned tier from the canonical configuration.
- **SC-008**: Zone transitions (nebula hue + constellation lines) complete within 0.3 seconds, matching existing transition timing.
- **SC-009**: The chromatic twinkle effect does not produce washed-out or clipped colors on bright system palette stars (yellow, lime).
- **SC-010**: Mobile visitors see system-assigned accent colors in the accessible project list, consistent with the desktop star colors.

## Zone Atmospheric Color Specification

Zone atmospherics (nebula tint, constellation line colors, glow filters) are derived from the dominant star system in each zone. The derivation rule is:

- **hex**: Representative color from the dominant system's palette (used for line strokes, glow filters)
- **hexBright**: Lighter/saturated variant (used for gradient highlight stops)
- **hexWatermark**: Desaturated/muted variant (used for watermark line strokes at 0.20 opacity)
- **nebulaHueRgb**: hex converted to normalized RGB [0-1] (used as GLSL uniform `uZoneColor`)

### Zone 0 — DevOps & Engineering (dominant: Middle System)

Middle System palette: #9FE060, #38B000, #2EC4B6, #3B5BDB

| Property       | Value                | Derivation                                 |
| -------------- | -------------------- | ------------------------------------------ |
| hex            | #38B000              | Middle palette median (green)              |
| hexBright      | #9FE060              | Brightest Middle member (lime)             |
| hexWatermark   | #5A8A50              | hex desaturated 40%, lightness +10%        |
| nebulaHueRgb   | [0.22, 0.69, 0.00]  | hex #38B000 as normalized RGB              |

### Zone 1 — Applications & Products (dominant: Group 2)

Group 2 palette: #F68A2B, #E63946, #F4A62A, #F0E442

| Property       | Value                | Derivation                                 |
| -------------- | -------------------- | ------------------------------------------ |
| hex            | #F4A62A              | Group 2 palette median (amber)             |
| hexBright      | #F0E442              | Brightest Group 2 member (yellow)          |
| hexWatermark   | #A89B60              | hex desaturated 40%, lightness +10%        |
| nebulaHueRgb   | [0.96, 0.65, 0.16]  | hex #F4A62A as normalized RGB              |

### Zone 2 — Community & Web (dominant: Group 3)

Group 3 palette: #7B2CBF, #5A189A

| Property       | Value                | Derivation                                 |
| -------------- | -------------------- | ------------------------------------------ |
| hex            | #7B2CBF              | Group 3 brightest member (purple)          |
| hexBright      | #9B4DDF              | hex lightened 20% (lighter purple)         |
| hexWatermark   | #6B5A80              | hex desaturated 40%, lightness +10%        |
| nebulaHueRgb   | [0.48, 0.17, 0.75]  | hex #7B2CBF as normalized RGB              |

These values replace the existing CONSTELLATION_ZONES color fields (blue-violet, warm-gold, green-teal). Zone names, scroll ranges, projectIds, and statusText remain unchanged.

## Assumptions

- **A-001**: The canonical configuration replaces the need for a separate STAR_SYSTEMS array and per-project systemId field. System membership is encoded within the configuration structure itself, avoiding any constitution amendment for new data model fields.
- **A-002**: Orbit spacing (logarithmic multipliers) is NOT part of this feature. Star positions are frozen as-is.
- **A-003**: Glow strength variation (importance-based) is deferred. Current uniform halo opacity is retained.
- **A-004**: Coney Island's orange (#F68A2B) is locked per the authoritative color table.
- **A-005**: The zone-change CustomEvent detail object may be extended with system context properties without breaking existing consumers.

## Scope Boundaries

### In Scope
- Canonical constellation configuration (project id, system id, hex, size tier)
- Static accentColor values for all 11 PROJECTS entries (from authoritative table)
- Explicit starSize values per locked Fibonacci size ladder
- Updated CONSTELLATION_ZONES nebula hue, hex, hexBright, hexWatermark to harmonize with system palettes
- Updated constellation line SVG defs (gradients, glow filters) to use new zone colors
- Chromatic twinkle saturation clamp for bright system colors

### Out of Scope
- Any runtime color interpolation or derivation (colors are static data)
- Star position changes (hand-placed positions frozen)
- Orbit-based positioning
- Importance-based glow strength variation
- New rendering layers, draw calls, or animation systems
- Changes to interaction behavior (scroll zones, hover, highlighting, gauges, reticle, panel mechanics)
- Changes to reticle, parallax, burst, terminal, or sidebar-hieroglyphs modules

## Dependencies

- **DEP-001**: Visual verification of deep purple (#5A189A) against dark scene background required post-implementation. If too dim, halo opacity for experiments-cluster may need per-project override.
- **DEP-002**: WCAG AA contrast verification for #5A189A (deep purple) against #0D0B09 required for cluster member name text. If it fails AA (it does at 1.90:1), use the zone's `hexBright` (#9B4DDF) for text rendering instead. Star sprite colors are exempt from text contrast requirements.
