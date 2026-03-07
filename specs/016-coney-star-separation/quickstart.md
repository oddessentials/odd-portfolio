# Quickstart: Coney Star Separation

**Feature**: 016-coney-star-separation
**Branch**: `016-coney-star-separation`
**Estimated Effort**: ~30 minutes (pure data changes, no logic)

## Prerequisites

- On branch `016-coney-star-separation`
- All source files are at HEAD of main (no merge conflicts expected)

## Implementation Steps

### Step 1: Update js/data.js — Remove Parent, Add 3 Stars

1. Delete the `coney-island` entry from the PROJECTS array (lines 275-333)
2. Insert 3 new entries in its place: `coney-website`, `yo-coney-bot`, `yo-coney-mobile` (see data-model.md for exact field values)
3. Change `odd-map` accentColor from `"#F4A62A"` to `"#F4D228"` (line 197)

### Step 2: Update js/data.js — CONSTELLATION_ZONES

1. In zone 1 ("Applications & Products"), replace `"coney-island"` with `"coney-website"`, `"yo-coney-bot"`, `"yo-coney-mobile"` in the projectIds array
2. (Recommended) Update zone 1 atmosphere: nebulaHue, nebulaHueRgb, hex, hexBright, hexWatermark to orange values (see data-model.md)

### Step 3: Update js/data-content.js — Remove Parent Content

1. Delete the `'coney-island'` key from PROJECT_CONTENT (lines 182-192)
2. Verify the 3 child entries remain unchanged (coney-website, yo-coney-bot, yo-coney-mobile)

### Step 4: Update index.html — Sidebar Buttons

1. Replace the single `<button data-project-id="coney-island">` with 3 individual buttons (see data-model.md for HTML)

### Step 5: Verify

1. Open `index.html` in browser
2. Scroll to "Applications & Products" zone — confirm 3 orange Coney stars visible
3. Click each Coney star — verify panel shows correct content + metrics bar
4. Check odd-map star color reads as yellow-gold (not orange)
5. Tab through sidebar — confirm 3 separate Coney buttons work
6. Open browser DevTools → renderer.info → verify draw calls < 30

## Files Changed

| File | Change Type | Lines Affected |
|------|------------|----------------|
| js/data.js | Remove 1 entry, add 3, update zone, shift color | ~80 lines net change |
| js/data-content.js | Remove 1 content key | ~10 lines removed |
| index.html | Replace 1 button with 3 | ~15 lines net change |

## No-Touch Files

All JS modules (scene.js, panel.js, constellation-lines.js, scroll-zones.js, reticle.js, sidebar-hieroglyphs.js, animations.js, interactions.js, textures.js, burst.js, terminal.js, gauge.js, parallax.js, logo-follow.js, app.js, glyph-compositor.js) — verified safe, no changes needed.
