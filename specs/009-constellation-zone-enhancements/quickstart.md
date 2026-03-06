# Quickstart: Constellation Line and Zone Enhancements

**Phase 1 Output** | **Date**: 2026-03-06

## Prerequisites

- Modern browser (Chrome, Firefox, or Safari latest)
- Local HTTP server (e.g., `python -m http.server 8080` or VS Code Live Server)
- No build system, npm, or package manager needed

## How to Run

```bash
cd E:\projects\odd-portfolio
python -m http.server 8080
# Open http://localhost:8080 in browser
```

## Architecture Overview

```
index.html (single page)
  ├── CSS: styles.css (steampunk frame, layout, social links, badges)
  ├── JS modules (16 files, all <400 lines):
  │   ├── app.js           → orchestrator, init sequence
  │   ├── data.js          → PROJECTS[], CONSTELLATION_ZONES[], SOCIAL_LINKS[]
  │   ├── scene.js         → Three.js scene, camera, renderer, GSAP ticker
  │   ├── textures.js      → star sprites, nebula, dust, cluster visuals
  │   ├── constellation-lines.js → SVG lines (watermark + active + intro)
  │   ├── scroll-zones.js  → ScrollTrigger zones, star highlighting
  │   ├── animations.js    → reveal sequence + constellation intro showcase
  │   ├── interactions.js  → keyboard nav, hamburger, hover
  │   ├── panel.js         → project overlay (single + cluster panels)
  │   ├── reticle.js       → SVG targeting reticle
  │   ├── glyph-compositor.js → hover/rect utilities (MSDF shader removed)
  │   ├── sidebar-hieroglyphs.js → WebGL sidebar overlay
  │   ├── performance.js   → auto-tier, post-processing
  │   ├── parallax.js      → mouse parallax
  │   ├── burst.js         → supernova particle pool
  │   ├── terminal.js      → terminal scan animation
  │   └── logo-follow.js   → logo cursor follow
  └── assets/              → project media (images, videos, logos)
```

## Key Implementation Paths

### 1. Data Model Changes (data.js)
- Remove `GLYPH_ATLAS_CELLS` export and all `glyph*` fields from PROJECTS
- Add `status`, `isCluster`, `clusterMembers` fields to all entries
- Add 2 new individual stars: `ado-git-repo-seeder`, `socialmedia-syndicator`
- Add 2 cluster entries: `experiments-cluster`, `dead-rock-cluster`
- Update Coney Island with `clusterMembers` (3 repos) and new orange accent
- Update `CONSTELLATION_ZONES` names, membership, and status text
- Add `SOCIAL_LINKS` array export

### 2. Constellation Lines Overhaul (constellation-lines.js)
- Add SVG `<defs>` with filter and gradient definitions (3 per zone)
- Create watermark line layer (persistent, dashed, 0.15 opacity)
- Create active line layer (gradient, glow, energy flow animation)
- Extend `fadeSequence` guard for watermark↔active transitions
- Add `initWatermarkLines()` called after reveal completes
- Add `playIntroShowcase()` for the 3-zone flash sequence
- Track both watermark and active lines in `tick()`

### 3. Scroll Zone Updates (scroll-zones.js)
- Update zone name references in status text
- Bridge star handling: check if star belongs to active zone before dimming
- Cluster elements receive same scale/opacity treatment as stars

### 4. Cluster Rendering (textures.js + scene.js)
- `createStarNodes()` returns both individual sprites and cluster groups
- Experiments cluster: 4 tiny sprites + 1 halo sprite in a THREE.Group
- Dead rock cluster: 6 dim grey sprites, no halo, no pulse
- Both groups added to starGroup with matching userData structure

### 5. Panel Updates (panel.js)
- Detect `isCluster` or non-null `clusterMembers` → render list view
- In-progress badge for `status: "in-progress"` projects
- Coney Island panel shows 3 repos in orange-themed list

### 6. Reveal Sequence Extension (animations.js)
- After star stagger completes (~5.2s), call constellation-lines `playIntroShowcase()`
- Flash each zone's lines for ~0.4s at preview intensity
- Skippable: skip button/S key → immediate watermark rest state

### 7. Social Links (index.html + styles.css)
- Add social links section in `#status-panel` below readout
- 11 inline SVG icons in flex-wrap row
- Brass-colored, hover brightening, `rel="noopener noreferrer"`

## Testing Checklist

- [ ] All 9 stars + 2 clusters visible in starfield
- [ ] Scroll through Zone 0/1/2: correct highlights, lines, text
- [ ] Bridge stars (odd-ai-reviewers, repo-standards) stay highlighted across zones
- [ ] Watermark lines visible at rest; active lines show gradient+glow on zone activate
- [ ] Energy flow animation plays on active lines (disabled under reduced-motion)
- [ ] Intro showcase flashes 3 zones after star ignition
- [ ] Skip intro skips constellation showcase
- [ ] Click each star → correct panel content
- [ ] Click experiments cluster → list of 4 repos
- [ ] Click Coney Island → list of 3 repos in orange
- [ ] Dead rock cluster visible but non-interactive
- [ ] Keyboard nav (Tab, arrows, Enter, Escape) works for all nav entries
- [ ] Reduced motion: no animations, instant transitions
- [ ] High contrast: decorative elements hidden
- [ ] Social links all resolve correctly, open in new tab
- [ ] 60fps on integrated GPU, draw calls < 30
- [ ] Original 7 project panels unchanged
- [ ] Mobile hamburger nav works with new entries
