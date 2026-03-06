# Data Model: Constellation Star System & Color Logic

**Feature**: 011-constellation-color-system
**Date**: 2026-03-06

## Entity: PROJECTS (updated values)

The PROJECTS array in `js/data.js` is the canonical source. Two fields are updated per project:

| Field | Type | Change |
|-------|------|--------|
| `accentColor` | string (hex) | Value updated to system-derived color from authoritative table |
| `starSize` | number | Value updated to Fibonacci size ladder tier scale |

All other fields (id, name, shortDesc, tagline, category, status, isCluster, clusterMembers, constellation, position, logoUrl, mediaType, mediaUrl, screenshots, links) remain unchanged.

### Updated Values

| Project ID              | accentColor (old → new) | starSize (old → new) |
| ----------------------- | ----------------------- | -------------------- |
| odd-ai-reviewers        | #9B6BD4 → #9FE060      | 1.4 → 2.33           |
| odd-fintech             | #D4A832 → #E63946      | 1.4 → 2.33           |
| coney-island            | #F97316 → #F68A2B      | 1.0 → 1.44           |
| odd-map                 | #C9941F → #F4A62A      | 1.15 → 1.44          |
| ado-git-repo-insights   | #7B8EC9 → #38B000      | 1.15 → 1.00          |
| odd-self-hosted-ci      | #6B5BAF → #2EC4B6      | 1.0 → 1.00           |
| repo-standards          | #3AB5A5 → #7B2CBF      | 1.0 → 1.00           |
| socialmedia-syndicator  | #E8B85A → #F0E442      | 1.0 → 0.89           |
| ado-git-repo-seeder     | #8E7BC8 → #3B5BDB      | 1.0 → 0.89           |
| experiments-cluster     | #2CC4B2 → #5A189A      | 0.6 → 0.55           |
| dead-rock-cluster       | #6B7280 → #6B7280      | 0.4 → 0.55           |

### Validation Rules

- accentColor MUST be a valid 7-character hex string (#RRGGBB)
- starSize MUST be one of: 2.33, 1.44, 1.00, 0.89, 0.55
- Position arrays MUST NOT be modified
- All other fields MUST NOT be modified

---

## Entity: CONSTELLATION_ZONES (updated values)

The CONSTELLATION_ZONES array in `js/data.js` has 4 color fields updated per zone:

| Field | Type | Change |
|-------|------|--------|
| `hex` | string (hex) | Updated to dominant system representative color |
| `hexBright` | string (hex) | Updated to brightest system member |
| `hexWatermark` | string (hex) | Updated to desaturated muted variant |
| `nebulaHueRgb` | number[3] | Updated to hex as normalized RGB [0-1] |

Zone names, scrollStart, scrollEnd, projectIds, nebulaHue, and statusText remain unchanged.

### Updated Values

| Zone | Field | Old Value | New Value |
|------|-------|-----------|-----------|
| Zone 0 (DevOps) | hex | #6B40A1 | #38B000 |
| Zone 0 (DevOps) | hexBright | #9B6BD4 | #9FE060 |
| Zone 0 (DevOps) | hexWatermark | #8B7099 | #5A8A50 |
| Zone 0 (DevOps) | nebulaHueRgb | [0.42, 0.25, 0.63] | [0.22, 0.69, 0.00] |
| Zone 1 (Apps) | hex | #B8870A | #F4A62A |
| Zone 1 (Apps) | hexBright | #E8B73A | #F0E442 |
| Zone 1 (Apps) | hexWatermark | #A89B78 | #A89B60 |
| Zone 1 (Apps) | nebulaHueRgb | [0.72, 0.53, 0.04] | [0.96, 0.65, 0.16] |
| Zone 2 (Community) | hex | #1A9E8F | #7B2CBF |
| Zone 2 (Community) | hexBright | #4ACEBF | #9B4DDF |
| Zone 2 (Community) | hexWatermark | #6B9B95 | #6B5A80 |
| Zone 2 (Community) | nebulaHueRgb | [0.1, 0.62, 0.56] | [0.48, 0.17, 0.75] |

### Validation Rules

- hex, hexBright, hexWatermark MUST be valid 7-character hex strings
- nebulaHueRgb MUST be an array of 3 numbers in range [0, 1]
- projectIds arrays MUST NOT be modified
- scrollStart/scrollEnd MUST NOT be modified
- statusText MUST NOT be modified

---

## Entity: Chromatic Twinkle (scene.js adjustment)

| Parameter | Old Value | New Value | Reason |
|-----------|-----------|-----------|--------|
| Saturation boost | +0.7 | +0.5 | Prevent clipping on bright yellows/limes |
| Saturation ceiling | 1.0 | 0.95 | Allow headroom before full white |
| Lightness boost | +0.2 | +0.15 | Reduced to prevent washout |
| Lightness ceiling | 1.0 | 0.9 | Prevent full white flash |

---

## Relationships

```
PROJECTS[].accentColor ──reads──→ textures.createStarTexture()
                        ──reads──→ textures.createHaloTexture()
                        ──reads──→ textures.createNebulaSystem() (color influence)
                        ──reads──→ panel.showProjectPanel() (accent styling)

PROJECTS[].starSize    ──reads──→ textures.createStarNodes() (sprite scale)

CONSTELLATION_ZONES[].hex/hexBright/hexWatermark
                        ──reads──→ constellation-lines.js (SVG line colors)

CONSTELLATION_ZONES[].nebulaHueRgb
                        ──reads──→ scroll-zones.js (GLSL uniform uZoneColor)
```

No new relationships introduced. All data flows are existing read paths.
