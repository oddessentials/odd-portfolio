# Quickstart: Sidebar Glyph Language

**Feature**: 008-sidebar-glyph-language | **Date**: 2026-03-05

## Prerequisites

- Python 3.x (for SVG generation/validation scripts)
- msdfgen CLI (for MSDF texture generation) — install via package manager or build from source: https://github.com/Chlumsky/msdfgen
- ImageMagick (for atlas composition via `montage`) — or Python PIL as alternative
- Modern browser (Chrome latest for development)

## Setup

```bash
# Already on the feature branch
git checkout 008-sidebar-glyph-language

# Verify msdfgen is available
msdfgen --help

# Verify design asset sources exist
ls design-assets/oe-logo-pack-2/logo-*-degrees-*.svg
ls design-assets/oe-logo-pack-2/oe_logo_flipped_rotated.py
```

## Asset Pipeline (run in order)

### Step 1: Generate normalized glyph SVGs

```bash
# From repo root
cd design-assets/oe-logo-pack-2/

# Generate 5 normalized rotation SVGs + 3 derived glyphs
# (Implementation creates validate-glyphs.py during task execution)
python validate-glyphs.py --generate
python validate-glyphs.py --validate  # Checks viewBox, centering, fill-only
```

### Step 2: Generate MSDF atlas

```bash
# Generate individual MSDF PNGs (256x256 each)
for svg in glyph-architect-135.svg glyph-guardian-90.svg glyph-sovereign-270.svg glyph-voyager-180.svg glyph-origin-0.svg glyph-orbit.svg glyph-axis.svg glyph-spiral.svg; do
  name="${svg%.svg}"
  msdfgen -svg "$svg" -o "${name}-msdf.png" -size 128 128 -pxrange 4 -autoframe
done

# Composite into 4x2 atlas (512x256)
montage *-msdf.png -tile 4x2 -geometry 128x128+0+0 ../../assets/glyph-atlas-msdf.png

# Verify atlas dimensions
identify ../../assets/glyph-atlas-msdf.png  # Should show 512x256
```

### Step 3: Copy production logo

```bash
cp logo-135-degrees-100x100.svg ../../assets/logo-oe-135.svg
```

## Development

```bash
# Serve locally (any static server)
python -m http.server 8080
# Open http://localhost:8080 in Chrome
```

## Key Files to Edit

| File | Changes |
|------|---------|
| `js/data.js` | Add glyphName, glyphRotation, glyphType, glyphAtlasIndex per project |
| `js/sidebar-hieroglyphs.js` | Refactor to overlay renderer; new atlas texture, new uniforms |
| `js/glyph-compositor.js` | NEW — atlas UV logic, hover events, three-layer composition |
| `js/terminal.js` | Phi-themed text: "7 Constellations Active", "GOLDEN RATIO LOCKED" |
| `js/interactions.js` | Dispatch glyph-hover CustomEvent on mouseenter/focusin |
| `js/animations.js` | Add uRevealProgress tween at t=2.2s (0.5s duration) in reveal timeline |
| `js/scroll-zones.js` | Dispatch scroll-progress or export setter for sidebar |
| `js/app.js` | Import glyph-compositor, add prefers-contrast:more, update reduced-motion |
| `index.html` | Inline SVG glyphs, Odd Bot element, right sidebar text, logo swap |
| `css/styles.css` | .glyph SVG styling, Odd Bot positioning, drop-shadow hover |

## Verification

```bash
# Visual checks (manual)
1. Each nav button shows unique OE glyph (not star)
2. Sidebar background has varied glyph tiles (not uniform)
3. Hover nav item → localized brightness in WebGL overlay
4. Scroll → construction lines drift, glyphs stay fixed
5. Right sidebar shows phi-themed text + Odd Bot rotates on zone change
6. prefers-reduced-motion → static glyphs, no animation
7. prefers-contrast:more → no WebGL overlay visible
8. Header logo is clean vector OE mark (not ASCII art)
```

## Performance Verification

Test on Intel Iris-class integrated GPU:
1. Open Chrome DevTools → Performance tab
2. Record 10 seconds of idle after reveal
3. Verify average frame time < 16.7ms (60fps)
4. If failing, confirm auto-tier degrades to Tier 2
