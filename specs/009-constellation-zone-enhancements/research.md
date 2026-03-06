# Research: Constellation Line and Zone Enhancements

**Phase 0 Output** | **Date**: 2026-03-06

## R-001: Glyph Atlas Audit — Is GLYPH_ATLAS_CELLS in Use?

**Decision**: GLYPH_ATLAS_CELLS and per-project glyph fields are dead code. Remove during implementation.

**Rationale**:
- `GLYPH_ATLAS_CELLS` (8 cells, 4x2 grid) is defined in `data.js` and imported ONLY by `glyph-compositor.js`
- `glyph-compositor.js` contains an MSDF fragment shader that references atlas cell UVs, BUT this shader is **never applied to any material** — it is exported but never consumed
- `sidebar-hieroglyphs.js` creates its OWN simpler fragment shader (manuscript texture approach loading `.webp` files) and only calls `glyph-compositor.js` for hover/rect utility functions
- Per-project glyph fields (`glyphName`, `glyphRotation`, `glyphType`, `glyphAtlasIndex`) are defined on all 7 PROJECTS entries but are **not read by any rendering code**
- The nav buttons in `index.html` use hand-crafted inline SVG glyphs, not atlas-derived glyphs

**What to clean up**:
1. Remove `GLYPH_ATLAS_CELLS` export from `data.js`
2. Remove `import { GLYPH_ATLAS_CELLS } from './data.js'` from `glyph-compositor.js`
3. Remove the unused MSDF `fragmentShader` export from `glyph-compositor.js` (keep `init`, `setHoveredProject`, `clearHover`, `getNavRect`)
4. Remove `glyphName`, `glyphRotation`, `glyphType`, `glyphAtlasIndex` fields from all PROJECTS entries
5. Do NOT add these fields to new project entries

**Alternatives considered**:
- Keep glyph fields for future use → Rejected: constitution says "no build for hypothetical future requirements"; adding to new entries creates inconsistency
- Repurpose atlas for cluster rendering → Rejected: clusters use procedural canvas textures, not MSDF atlas

---

## R-002: SVG Filter Performance on Integrated GPUs

**Decision**: SVG filters (feGaussianBlur + feDropShadow) are safe for constellation line glow effects.

**Rationale**:
- Modern browsers hardware-accelerate SVG filters when applied to simple geometries
- Maximum line count per zone: 4 lines (Zone 0 has 5 members = 4 chain lines), 3 lines (Zones 1 & 2)
- Only ONE zone's lines are in active (filtered) state at a time; other zones show unfiltered watermark lines
- Total filtered elements at any moment: max 4 SVG `<line>` elements
- The existing codebase has NO SVG `<defs>` elements — adding filter definitions introduces zero conflict
- CSS `drop-shadow` and `blur` filters are already used elsewhere in the page (logo flash, frame tools, reticle glyph) without performance issues

**Implementation approach**:
- Define SVG `<defs>` with `<filter>` inside the constellation-lines SVG container
- Use `feGaussianBlur` (stdDeviation ~2-3px) + `feComposite` for glow
- Apply `filter="url(#zone-glow-N)"` attribute to active lines only
- Remove filter attribute when lines fade to watermark state
- Three separate filter definitions (one per zone) with zone-colored flood fills

**Alternatives considered**:
- CSS filter `drop-shadow()` on SVG lines → Rejected: less control over glow color matching zone theme
- WebGL-rendered lines → Rejected: shader feature list frozen; SVG approach is simpler and constitution-compliant

---

## R-003: Accent Color Derivation for New Stars

**Decision**: Derive new star accent colors as hue-shifted relatives of zone siblings, maintaining spectral coherence.

**Rationale**:
Zone 0 (DevOps & Engineering) existing colors:
- odd-ai-reviewers: `#FF6B35` (orange, hue ~18)
- ado-git-repo-insights: `#00C9D4` (cyan, hue ~184)
- repo-standards: `#F5C518` (yellow, hue ~48)
- odd-self-hosted-ci: `#4ADE80` (green, hue ~142)

New: `ado-git-repo-seeder` — needs a DevOps zone sibling color.
- Candidate: `#38BDF8` (sky blue, hue ~199) — sits between cyan and blue-violet, filling the spectral gap between ado-git-repo-insights and the zone's blue-violet nebula hue
- This maintains spectral order: orange → yellow → green → cyan → sky-blue

Zone 1 (Applications & Products) existing colors:
- odd-ai-reviewers: `#FF6B35` (bridge from Zone 0)
- odd-map: `#2DD4BF` (teal, hue ~170)
- odd-fintech: `#A855F7` (purple, hue ~271)

New: `socialmedia-syndicator` — needs an Applications zone sibling color.
- Candidate: `#F472B6` (pink, hue ~330) — sits between purple and orange on the warm side of the spectrum
- Maintains spectral flow: orange → pink → teal → purple

**Alternatives considered**:
- Algorithmically derive via HSL rotation → Rejected: manual selection ensures visual harmony with existing choices
- Use zone nebula color as base → Rejected: nebula colors are dim background tints, not suitable for star accents

---

## R-004: Coney Island Orange Refactoring & Zone 2 Spectral Order

**Decision**: Shift Coney Island from `#FB7185` (rose-pink) to `#F97316` (true orange). Reorder Zone 2 colors for spectral coherence.

**Rationale**:
Zone 2 (Community & Web) members:
- repo-standards: `#F5C518` (yellow, hue ~48) — bridge from Zone 0
- coney-island: `#F97316` (orange, hue ~25) — shifted from rose-pink
- experiments-cluster: `#10B981` (emerald, hue ~160) — mid-green, visually distinct from Zone 0's green
- dead-rock-cluster: `#6B7280` (grey) — desaturated, no spectral participation

Spectral order in Zone 2: orange → yellow → emerald → (grey dim)
This creates a warm-to-cool gradient across the zone that matches the green-teal nebula hue.

**Alternatives considered**:
- Keep `#FB7185` rose-pink → Rejected: owner explicitly requested orange for Coney Island
- Use `#FF6B35` (same orange as odd-ai-reviewers) → Rejected: too close, creates confusion between zones

---

## R-005: 3D Star Positions for New Elements

**Decision**: Compute new positions within existing world-space bounds, maintaining 0.18 unit separation.

**Rationale**:
Current positions span X:[-2.2, 2.2], Y:[-1.2, 1.0], Z:[-0.6, 0.5]. Camera at [0, 0, 4.5] with 45-degree FOV. Stars are adjusted by aspect ratio on resize.

New positions (chosen to fill gaps in the existing distribution):

| Element | Position [x, y, z] | Zone | Justification |
|---------|-------------------|------|---------------|
| ado-git-repo-seeder | [-1.2, 1.2, 0.1] | 0 | Upper-left gap between ado-git-repo-insights and odd-map; >0.18 from all neighbors |
| socialmedia-syndicator | [1.5, 0.2, -0.2] | 1 | Right-center gap between odd-ai-reviewers and repo-standards; >0.18 from all |
| experiments-cluster (center) | [-0.2, -0.5, 0.3] | 2 | Center-lower area, near but distinct from odd-self-hosted-ci; cluster points offset +/-0.08 from center |
| dead-rock-cluster (center) | [0.5, 1.3, -0.4] | 2 | Upper area, peripherally visible but not prominent |

Minimum pairwise distances (verified against existing 7 positions):
- ado-git-repo-seeder to nearest (odd-map at [0.3, 0.8, 0.5]): ~1.56 units
- socialmedia-syndicator to nearest (odd-ai-reviewers at [1.8, 1.0, -0.5]): ~0.87 units
- experiments-cluster to nearest (odd-self-hosted-ci at [-0.8, -1.2, -0.6]): ~1.08 units
- dead-rock-cluster to nearest (odd-ai-reviewers at [1.8, 1.0, -0.5]): ~1.35 units

All exceed the 0.18 minimum by large margins.

**Cluster sub-point offsets** (relative to cluster center):
- Experiments: 4 points at offsets [+0.06, +0.04], [-0.05, +0.06], [+0.04, -0.05], [-0.06, -0.03] (XY only, Z=0)
- Dead rock: 6 points at random offsets within +/-0.08 radius (XY only)

**Alternatives considered**:
- Algorithmic placement with force-directed layout → Rejected: over-engineering for 2 new stars + 2 clusters; manual selection is simpler and reviewed by eye

---

## R-006: Bridge Star Animation During Zone Transitions

**Decision**: Use "persistent highlight" pattern — bridge stars maintain highlight state continuously, only constellation lines transition.

**Rationale**:
Current `handleScrollProgress()` in scroll-zones.js sets star scale/opacity based on zone membership. Bridge stars (odd-ai-reviewers in Z0+Z1, repo-standards in Z0+Z2) are in multiple `projectIds` arrays.

The risk: when transitioning from Zone 0 to Zone 1, the current code would:
1. Set all Zone 0 stars to dimmed (including odd-ai-reviewers)
2. Then set all Zone 1 stars to highlighted (including odd-ai-reviewers again)
3. This creates a brief flicker as the star dims then re-highlights

**Fix approach**:
- Before applying zone highlights, compute the **union** of all zone memberships for each star
- A star is highlighted if it belongs to ANY currently active zone
- During zone transitions, check if the star is a member of the NEW zone before dimming it
- Specifically: in `handleScrollProgress()`, when setting `isInZone`, check ALL zones the star belongs to, not just the current zone:
  ```
  const isInZone = zone.projectIds.includes(sprite.userData.project.id);
  const isInAnyActiveZone = CONSTELLATION_ZONES.some((z, i) =>
    i === activeZoneIndex && z.projectIds.includes(sprite.userData.project.id)
  );
  ```
- Since only one zone is active at a time, this simplifies to checking if the star is in the active zone — which is what the current code already does
- The real fix is ensuring `gsap.killTweensOf(sprite.scale)` doesn't interrupt an in-progress scale-up by immediately starting a scale-down. Since zone transitions are discrete (not overlapping), the bridge star will go: highlighted in Z0 → highlighted in Z1 with no gap

**Validation (UPDATED per team review)**: The current code does NOT cause a full flicker for bridge stars — `isInZone` is true for both zones so the target values are identical. However, `gsap.killTweensOf(sprite.scale)` will kill any in-progress tween and start a new one to the same target, causing a brief tween restart stutter. Fix: add a guard that skips the kill+re-tween when the bridge star is already at (or near) the highlighted state: `if (isInZone && sprite.material.opacity >= 0.95) return;`. Alternatively, use `gsap.to` with `overwrite: 'auto'`.

**Additional safeguard**: Add a `bridgeZones` computed property to bridge star userData so the scroll handler can quickly check bridge membership without iterating all zones.

---

## R-007: Cluster Rendering Approach

**Decision**: Render clusters as THREE.Group containing multiple tiny THREE.Sprite children, managed alongside individual star sprites.

**Rationale**:
- **Experiments cluster**: 4 tiny sprites (starSize 0.4, about 1/3 of smallest individual star) in a tight grouping, plus a shared halo sprite (additive blend, large radius, low opacity) for the nebulous effect
- **Dead rock cluster**: 6 tiny sprites (starSize 0.3), grey color (`#6B7280`), no halo, opacity 0.15, no pulse animation
- Both cluster groups are added to the existing `starGroup` in scene.js
- Each cluster group has a `userData` object matching the project data model (id, isCluster, position, etc.) for consistent handling in raycasting, scroll-zones, and constellation-lines
- For raycasting: the cluster group's bounding sphere (computed from children) serves as the hit area
- For constellation lines: lines connect to the cluster group's center position (same as individual stars)
- For reveal sequence: cluster groups stagger in with individual stars

**Draw call impact** (CORRECTED per team review):
- Three.js does NOT batch Sprites with unique SpriteMaterials — each unique material is a separate draw call
- WITHOUT shared materials: 2 new individual stars + 4 experiment sprites + 1 halo + 6 dead rock sprites = +13 draw calls → ~26 total (under 30 but tight)
- WITH shared materials (RECOMMENDED): share one SpriteMaterial across 4 experiment sub-points (1 draw call), share one across 6 dead rock sub-points (1 draw call), halo is separate (1 draw call) → +5 draw calls → ~18 total (comfortable headroom)
- Implementation: `createStarNodes()` must create ONE shared texture+material per cluster type, reused by all sub-point sprites

**Alternatives considered**:
- Single sprite with custom cluster texture → Rejected: loses the "grouping of points" visual; harder to animate individual sub-points
- Points geometry (THREE.Points) per cluster → Rejected: raycasting threshold would need separate handling; Sprite approach is consistent with existing stars
- Instanced mesh → Rejected: over-engineering for 10 sprites total

---

## R-008: Constellation Line Watermark + Active State Architecture

**Decision**: Maintain two SVG line sets per zone — watermark lines (always present) and active lines (overlaid on watermark when zone active).

**Rationale**:
- **Watermark lines**: Created once after reveal completes, persist for the lifetime of the page. Faint dashed (`stroke-dasharray: 8 12`, `stroke-opacity: 0.15`), zone-colored but desaturated.
- **Active lines**: Created when a zone activates, overlaid on the watermark. Full zone color, gradient stroke, glow filter, energy flow animation. Removed when zone deactivates.
- This two-layer approach avoids having to transition a single set of lines between states (which would require complex GSAP timeline management for dasharray + opacity + filter simultaneously).
- Watermark lines share the same per-frame `tick()` position tracking as active lines.
- The `fadeSequence` guard extends naturally: active lines fade in/out while watermarks remain static.

**SVG structure**:
```xml
<svg class="constellation-lines" ...>
  <defs>
    <filter id="zone-glow-0">...</filter>
    <filter id="zone-glow-1">...</filter>
    <filter id="zone-glow-2">...</filter>
    <linearGradient id="zone-grad-0">...</linearGradient>
    <linearGradient id="zone-grad-1">...</linearGradient>
    <linearGradient id="zone-grad-2">...</linearGradient>
  </defs>
  <!-- Watermark layer (always visible) -->
  <g class="watermark-lines" opacity="0.15">
    <line class="wm-z0" ... stroke-dasharray="8 12" />
    ...
  </g>
  <!-- Active layer (zone-specific, created/destroyed on zone change) -->
  <g class="active-lines">
    <line ... filter="url(#zone-glow-0)" stroke="url(#zone-grad-0)" />
    ...
  </g>
</svg>
```

**Energy flow animation**: Animated `stroke-dashoffset` on active lines. A repeating GSAP tween moves the dash offset to create the "traveling energy" effect. Paused under `prefers-reduced-motion`.

**Alternatives considered**:
- Single line set with state transitions → Rejected: too many simultaneous property changes (dasharray, opacity, filter, gradient) create complex GSAP sequencing
- CSS animations instead of GSAP for energy flow → Rejected: GSAP already manages all other animations; consistency simplifies reduced-motion handling

---

## R-009: Social Link Inline SVG Icons

**Decision**: Hand-craft 11 inline SVG icons (one per platform), each under 500 bytes, styled in brass/gold to match the Victorian aesthetic.

**Rationale**:
The constitution prohibits icon font CDNs (Principle VI). Social platform icons must be inline SVG paths.

Platforms (11 total): LinkedIn, Facebook, X/Twitter, GitHub, NPM, PyPI, Docker Hub, VS Marketplace, Codecov, Medium, Gravatar

Each icon is a simplified `<svg viewBox="0 0 24 24">` with a single `<path>` element. Color: `var(--color-brass-light, #C8A84B)` with hover brightening to `#ffd700`. Estimated total SVG data: ~4KB (well under the 15KB page weight increase budget from SC-012).

**Placement**: Below existing status readout in `#status-panel`, in a flex-wrap row. On mobile (<768px), accessible via hamburger menu.

---

## R-010: Zone Name and Verbiage Updates

**Decision**: Update zone names and status text to match spec; preserve the existing command line text pattern.

**Current → New**:
| Zone | Old Name | New Name | Old Status Text | New Status Text |
|------|----------|----------|-----------------|-----------------|
| 0 | "DevOps Pipeline" | "DevOps & Engineering" | "Tracing the DevOps pipeline..." | "Tracing the DevOps pipeline..." (unchanged — familiar verbiage) |
| 1 | "Products & Analytics" | "Applications & Products" | "Viewing products & analytics..." | "Viewing applications & products..." |
| 2 | "Community & Web" | "Community & Web" | "Exploring community & web..." | "Exploring community & web..." (unchanged) |

**Phase indicator** (shown in `.phase-indicator`): Uses `zone.name.toUpperCase()` — automatically reflects the new zone names.

**Alternatives considered**:
- Rewrite all status text → Rejected: spec says "preserve existing verbiage pattern"; only Zone 1 changes because its name changed
