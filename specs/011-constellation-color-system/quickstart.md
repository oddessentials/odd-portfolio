# Quickstart: Constellation Star System & Color Logic

**Feature**: 011-constellation-color-system
**Branch**: `011-constellation-color-system`

## What This Feature Does

Replaces all project star colors and sizes with an authoritative system-based palette. Updates zone atmospheric colors to harmonize. No new code, no new modules — just data value changes and a minor twinkle adjustment.

## Implementation Steps

### Step 1: Update PROJECTS accentColor values in js/data.js

Replace each project's `accentColor` with the value from the authoritative color table:

```
odd-ai-reviewers:        #9B6BD4 → #9FE060
odd-fintech:             #D4A832 → #E63946
coney-island:            #F97316 → #F68A2B
odd-map:                 #C9941F → #F4A62A
ado-git-repo-insights:   #7B8EC9 → #38B000
odd-self-hosted-ci:      #6B5BAF → #2EC4B6
repo-standards:          #3AB5A5 → #7B2CBF
socialmedia-syndicator:  #E8B85A → #F0E442
ado-git-repo-seeder:     #8E7BC8 → #3B5BDB
experiments-cluster:     #2CC4B2 → #5A189A
dead-rock-cluster:       #6B7280 → #6B7280 (unchanged)
```

### Step 2: Update PROJECTS starSize values in js/data.js

Replace each project's `starSize` with the Fibonacci tier scale:

```
odd-ai-reviewers:        1.4  → 2.33  (Anchor)
odd-fintech:             1.4  → 2.33  (Anchor)
coney-island:            1.0  → 1.44  (Major)
odd-map:                 1.15 → 1.44  (Major)
ado-git-repo-insights:   1.15 → 1.00  (Standard)
odd-self-hosted-ci:      1.0  → 1.00  (Standard)
repo-standards:          1.0  → 1.00  (Standard)
socialmedia-syndicator:  1.0  → 0.89  (Supporting)
ado-git-repo-seeder:     1.0  → 0.89  (Supporting)
experiments-cluster:     0.6  → 0.55  (Peripheral)
dead-rock-cluster:       0.4  → 0.55  (Peripheral)
```

### Step 3: Update CONSTELLATION_ZONES color fields in js/data.js

Replace the 4 color fields for each zone:

**Zone 0 (DevOps & Engineering)**:
```
hex:           #6B40A1 → #38B000
hexBright:     #9B6BD4 → #9FE060
hexWatermark:  #8B7099 → #5A8A50
nebulaHueRgb:  [0.42, 0.25, 0.63] → [0.22, 0.69, 0.00]
```

**Zone 1 (Applications & Products)**:
```
hex:           #B8870A → #F4A62A
hexBright:     #E8B73A → #F0E442
hexWatermark:  #A89B78 → #A89B60
nebulaHueRgb:  [0.72, 0.53, 0.04] → [0.96, 0.65, 0.16]
```

**Zone 2 (Community & Web)**:
```
hex:           #1A9E8F → #7B2CBF
hexBright:     #4ACEBF → #9B4DDF
hexWatermark:  #6B9B95 → #6B5A80
nebulaHueRgb:  [0.1, 0.62, 0.56] → [0.48, 0.17, 0.75]
```

### Step 4: Adjust twinkle saturation clamp in js/scene.js

In the chromatic twinkle block (~line 274), reduce the saturation/lightness boost:

**Before**: `twinkleColor.setHSL(twinkleHSL.h, Math.min(1, twinkleHSL.s + 0.7), Math.min(1, twinkleHSL.l + 0.2));`

**After**: `twinkleColor.setHSL(twinkleHSL.h, Math.min(0.95, twinkleHSL.s + 0.5), Math.min(0.9, twinkleHSL.l + 0.15));`

### Step 5: Visual Verification

1. Open index.html in Chrome
2. Verify all 10 active stars show correct colors
3. Verify dead-rock-cluster stays gray
4. Scroll through all 3 zones — check nebula tint and constellation line colors harmonize
5. Verify repo-standards highlights in all 3 zones with purple #7B2CBF
6. Click each star — verify panel accent matches star color
7. Check that Anchor-tier stars (odd-ai-reviewers, odd-fintech) are visually largest
8. Watch for twinkle effect on bright stars — confirm no white flash/washout
9. Test in Firefox and Safari

## Files Changed

| File | Lines Changed | Type |
|------|---------------|------|
| js/data.js | ~40 | Value updates only |
| js/scene.js | ~2 | Twinkle clamp adjustment |

## What NOT to Change

- Star positions (frozen)
- Scroll zone projectIds, scrollStart/scrollEnd
- Any interaction behavior
- Any other JS module
- CSS files
- index.html
