# Research: Coney Star Separation

**Feature**: 016-coney-star-separation
**Date**: 2026-03-07
**Status**: Complete (all unknowns resolved)

## Research Tasks & Findings

### R-001: Data Model Migration Path

**Decision**: Replace single PROJECTS entry with 3 independent entries using the existing approved schema.

**Rationale**: The current `coney-island` entry has `repoKey: null` (no metrics bar) and `isCluster: false` with non-null `clusterMembers` (unusual pattern). Each child already has a `repoKey` in `clusterMembers` and full content in `data-content.js`. Promoting them to first-class entries requires only data changes.

**Alternatives considered**:
- Keep parent with linked child panels: Rejected — adds UI complexity, doesn't solve metrics bar gap
- Add `repoKey` to parent only: Rejected — would show averaged/combined metrics, misrepresents individual repos

**Key findings**:
- `panel.js` lines 275-283 handle `!isCluster && clusterMembers` pattern (renders "Related Repositories" section). New entries with `clusterMembers: null` skip this entirely — clean separation.
- `terminal.js` line 11 filters `!p.isCluster` to count active stars — all 3 new entries will be counted correctly.
- `textures.js` lines 193-208 create Point sprites based on `isCluster` — all 3 render as individual stars.

---

### R-002: Codebase References to `coney-island`

**Decision**: Only 2 source locations + 1 HTML element need updating.

**Findings**:
| Location | Line | Type | Action |
|----------|------|------|--------|
| `js/data.js` | 275 | PROJECTS entry | Remove entire entry (lines 275-333) |
| `js/data.js` | 483 | CONSTELLATION_ZONES projectIds | Replace `"coney-island"` with 3 IDs |
| `js/data-content.js` | 182 | PROJECT_CONTENT key | Remove `'coney-island'` entry (lines 182-192) |
| `index.html` | 211 | Sidebar button | Replace 1 button with 3 buttons |

No other source files reference `coney-island` by string. All downstream modules use dynamic lookups.

---

### R-003: Orange Color Family — HSL Math

**Decision**: Space 3 Coney stars across H=15°-35° with 10° intervals.

**Rationale**: The orange spectrum (H=10°-40°) is the most recognizable "orange" range in HSL. Spacing at 10° intervals provides perceptual distinction while maintaining family cohesion. Saturation (88-92%) and lightness (55-58%) are kept tight for visual consistency.

**Color computation**:
```
yo-coney-bot:    hsl(15°, 88%, 55%) → #F15927  (orange-red)
coney-website:   hsl(25°, 92%, 57%) → #F6802C  (warm orange)
yo-coney-mobile: hsl(35°, 90%, 58%) → #F4A333  (amber-orange)
```

**WCAG Contrast verification** (all vs #0D0B09):
- #F15927: ~5.8:1 (PASS AA, 4.5:1 minimum)
- #F6802C: ~6.5:1 (PASS AA)
- #F4A333: ~7.0:1 (PASS AAA)

**Alternatives considered**:
- Single orange for all 3: Rejected — owner wants "distinct but related" shades
- Wider H spread (H=5°-45°): Rejected — H=5° too close to red (#E63946 at H=355°), H=45° too close to odd-map

---

### R-004: odd-map Color Shift

**Decision**: Shift odd-map from #F4A62A (H=37°) to #F4D228 (H=50°).

**Rationale**: H=37° overlaps the Coney orange range (H=15°-35°) at only 2° gap. Shifting to H=50° creates a 15° buffer from yo-coney-mobile (H=35°) while maintaining 5° from socialmedia-syndicator (H=55°). The 5° gap is sufficient because odd-map is yellow-gold and syndicator is pure yellow — different visual register despite close hue.

**Saturation/lightness preservation**: S=91%, L=56% match the original #F4A62A exactly, so odd-map's visual weight is unchanged. Only hue shifts.

**Alternatives considered**:
- Shift to H=60° (gold): Rejected — only 5° from syndicator and enters "green-yellow" territory
- Shift to H=345° (pink): Rejected — too close to odd-fintech at H=355°, violates owner instruction

---

### R-005: Star Position Separation

**Decision**: Distribute 3 stars around original [1.0, -1.0, 0.4] with minimum 0.22 unit separation.

**Rationale**: Constitution Principle II requires minimum 0.18 world-unit projected screen-space separation. The chosen positions form a triangle:

```
yo-coney-bot     [0.85, -0.80, 0.35]  (up-left of anchor)
coney-website    [1.00, -1.00, 0.40]  (anchor, original position)
yo-coney-mobile  [1.15, -1.15, 0.50]  (down-right of anchor)
```

**Separation matrix**:
| Pair | Distance | Min Required | Status |
|------|----------|--------------|--------|
| website ↔ bot | 0.25 | 0.18 | PASS |
| website ↔ mobile | 0.22 | 0.18 | PASS |
| bot ↔ mobile | 0.46 | 0.18 | PASS |

**Nearest non-Coney star**: experiments-cluster at [-0.2, -0.5, 0.3] — minimum 1.14 units from any Coney star. No collision risk.

---

### R-006: Constellation Lines Impact

**Decision**: Lines auto-generate correctly. No manual intervention needed.

**Rationale**: `constellation-lines.js` draws lines sequentially between zone stars in `projectIds` order (lines 60-66, 128-131). The proposed projectIds order creates a natural flow:

```
..socialmedia-syndicator → coney-website → yo-coney-bot → yo-coney-mobile → repo-standards..
```

This produces 2 intra-Coney lines (website→bot, bot→mobile) that visually bind the family, plus connections to neighboring zone stars.

**Line count impact**: "Applications & Products" zone goes from 3 to 6 lines. All SVG-based, negligible performance impact.

---

### R-007: Zone Atmosphere Tint

**Decision**: Update zone 1 atmospheric colors from amber to orange (recommended, not mandatory).

**Rationale**: With 3 Coney stars (H=15°-35°) now dominating the zone, the nebula tint should reflect their warm orange rather than the old odd-map amber. This creates environmental coherence.

**Proposed values**:
```javascript
nebulaHue: "orange",
nebulaHueRgb: [0.96, 0.50, 0.17],  // RGB of #F6802C
hex: "#F6802C",                      // coney-website (zone anchor)
hexBright: "#F4A333",                // yo-coney-mobile (brightest)
hexWatermark: "#B87540",             // desaturated orange warmth
```

**Fallback**: If owner prefers, keep existing amber tint. No functional impact either way.

---

### R-008: Downstream Module Safety

**Decision**: Zero downstream JS modules require code changes.

**Findings** (from integration analysis):

| Module | Mechanism | Safe? |
|--------|-----------|-------|
| scene.js | forEach(PROJECTS), dynamic star creation | Yes |
| panel.js | Event-driven lookup by project object | Yes |
| constellation-lines.js | getZoneStars() from projectIds | Yes |
| scroll-zones.js | projectIds.includes() runtime | Yes |
| reticle.js | Event-driven onStarEnter/Exit | Yes |
| animations.js | Stagger math: 0.2 * 7 / starNodes.length | Yes (scales) |
| interactions.js | [data-project-id] attribute lookup | Yes |
| textures.js | Per-star createStarTexture() | Yes |
| sidebar-hieroglyphs.js | Independent of star count | Yes |
| burst.js | Fixed-size pool, no per-star allocation | Yes |
| terminal.js | Counts !isCluster projects | Yes |
| gauge.js | Zone-index based, not star-count | Yes |

**Performance budget**:
- Draw calls: ~13 → ~19 (under 30 budget)
- Texture memory: +~20KB (under 1MB)
- No mobile regression
