# Data Model: Coney Star Separation

**Feature**: 016-coney-star-separation
**Date**: 2026-03-07

## Entity Changes

### 1. PROJECTS Array (js/data.js)

#### REMOVE: `coney-island` Parent Entry

```javascript
// DELETE this entire entry (current lines 275-333)
{
  id: "coney-island",
  repoKey: null,
  // ... all fields ...
}
```

#### ADD: 3 Individual Coney Entries

**Entry 1: coney-website** (standard tier, starSize 1.0)
```javascript
{
  id: "coney-website",
  repoKey: "coney-website",
  starSizeOverride: null,
  name: "Coney Island Website",
  shortDesc: "Restaurant website & events",
  tagline: "Restaurant website with events publishing and social media syndication for a 100+ year old family-owned establishment",
  category: "web",
  status: "active",
  isCluster: false,
  clusterMembers: null,
  constellation: "Hospitality",
  accentColor: "#F6802C",
  starSize: 1.0,
  position: [1.0, -1.0, 0.4],
  logoUrl: "assets/coney-island-logo-1024x690.svg",
  mediaType: "image",
  mediaUrl: "assets/coney-island-restaurant-and-tavern.jpg",
  screenshots: null,
  links: [
    { label: "Website", url: "https://coneyislandpottsville.com/", primary: true },
    { label: "GitHub", url: "https://github.com/coneyislandpottsville/coney-website", primary: true },
  ],
}
```

**Entry 2: yo-coney-bot** (minor tier, starSize 0.89)
```javascript
{
  id: "yo-coney-bot",
  repoKey: "yo-coney-bot",
  starSizeOverride: null,
  name: "Yo Coney Bot",
  shortDesc: "AI restaurant chat assistant",
  tagline: "AI-powered chat assistant grounded in official restaurant data — answers questions about hours, menu, events, and local history",
  category: "ai",
  status: "active",
  isCluster: false,
  clusterMembers: null,
  constellation: "Hospitality",
  accentColor: "#F15927",
  starSize: 0.89,
  position: [0.85, -0.80, 0.35],
  logoUrl: "assets/coney-island-logo-1024x690.svg",
  mediaType: null,
  mediaUrl: null,
  screenshots: null,
  links: [
    { label: "AI Chat", url: "https://chat.coneyislandpottsville.com/", primary: true },
    { label: "GitHub", url: "https://github.com/coneyislandpottsville/yo-coney-bot", primary: true },
  ],
}
```

**Entry 3: yo-coney-mobile** (dwarf tier, starSize 0.55)
```javascript
{
  id: "yo-coney-mobile",
  repoKey: "yo-coney-mobile",
  starSizeOverride: null,
  name: "Yo Coney Mobile",
  shortDesc: "Mobile chat companion",
  tagline: "Expo/React Native mobile chat companion with voice input, suggest chips, and persistent chat history",
  category: "mobile",
  status: "active",
  isCluster: false,
  clusterMembers: null,
  constellation: "Hospitality",
  accentColor: "#F4A333",
  starSize: 0.55,
  position: [1.15, -1.15, 0.50],
  logoUrl: "assets/coney-island-logo-1024x690.svg",
  mediaType: null,
  mediaUrl: null,
  screenshots: null,
  links: [
    { label: "GitHub", url: "https://github.com/coneyislandpottsville/yo-coney-mobile", primary: true },
  ],
}
```

#### MODIFY: `odd-map` accentColor

```javascript
// Change from:
accentColor: "#F4A62A",
// Change to:
accentColor: "#F4D228",
```

### 2. CONSTELLATION_ZONES (js/data.js)

#### MODIFY: Zone 1 "Applications & Products" projectIds

```javascript
// FROM:
projectIds: [
  "odd-map",
  "odd-fintech",
  "socialmedia-syndicator",
  "coney-island",
  "repo-standards",
],

// TO:
projectIds: [
  "odd-map",
  "odd-fintech",
  "socialmedia-syndicator",
  "coney-website",
  "yo-coney-bot",
  "yo-coney-mobile",
  "repo-standards",
],
```

#### MODIFY: Zone 1 Atmosphere (Recommended)

```javascript
// FROM:
nebulaHue: "amber",
nebulaHueRgb: [0.96, 0.65, 0.16],
hex: "#F4A62A",
hexBright: "#F0E442",
hexWatermark: "#A89B60",

// TO:
nebulaHue: "orange",
nebulaHueRgb: [0.96, 0.50, 0.17],
hex: "#F6802C",
hexBright: "#F4A333",
hexWatermark: "#B87540",
```

### 3. PROJECT_CONTENT (js/data-content.js)

#### REMOVE: Parent `coney-island` Key

```javascript
// DELETE this entry (current lines 182-192)
'coney-island': {
  synopsis: 'A 100+ year old family-owned...',
  capabilities: [...],
  techStack: [...],
  aiModels: [...],
},
```

#### KEEP (No Changes): 3 Individual Content Entries

- `'coney-website'` (lines 147-158) — already complete
- `'yo-coney-bot'` (lines 159-170) — already complete
- `'yo-coney-mobile'` (lines 171-181) — already complete

### 4. HTML Sidebar (index.html)

#### REPLACE: Single Button → 3 Buttons

```html
<!-- REMOVE (current line 211): -->
<button data-project-id="coney-island">
  <span class="project-label">
    <span class="project-name">Coney Island Pottsville</span>
    <span class="project-desc">Restaurant ecosystem</span>
  </span>
</button>

<!-- INSERT 3 buttons: -->
<button data-project-id="coney-website">
  <span class="project-label">
    <span class="project-name">Coney Island Website</span>
    <span class="project-desc">Restaurant website & events</span>
  </span>
</button>
<button data-project-id="yo-coney-bot">
  <span class="project-label">
    <span class="project-name">Yo Coney Bot</span>
    <span class="project-desc">AI restaurant chat assistant</span>
  </span>
</button>
<button data-project-id="yo-coney-mobile">
  <span class="project-label">
    <span class="project-name">Yo Coney Mobile</span>
    <span class="project-desc">Mobile chat companion</span>
  </span>
</button>
```

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| Every PROJECTS entry must have a unique `id` | No duplicate IDs in array |
| Every `repoKey` must match an entry in `repo-metrics.json` | coney-website, yo-coney-bot, yo-coney-mobile all present |
| Every `id` in CONSTELLATION_ZONES.projectIds must exist in PROJECTS | All 3 new IDs added to zone 1 |
| Every sidebar `data-project-id` must match a PROJECTS `id` | 3 new buttons match 3 new entries |
| Every `id` in PROJECT_CONTENT must match a PROJECTS `id` or `repoKey` | Parent 'coney-island' removed; 3 children match |
| Star separation >= 0.18 world units | Verified: 0.22, 0.25, 0.46 |
| Accent color contrast >= 4.5:1 vs #0D0B09 | Verified: 5.8:1, 6.5:1, 7.0:1 |

## Metrics Data Reference (assets/repo-metrics.json)

| repoKey | Score | Tier | Star Size | Commits | PRs | LOC | Tests |
|---------|-------|------|-----------|---------|-----|-----|-------|
| coney-website | 585.5 | standard | 1.0 | 370 | 56 | 3,703 | 0 |
| yo-coney-bot | 288.3 | minor | 0.89 | 111 | 31 | 10,468 | 8 |
| yo-coney-mobile | 122.2 | dwarf | 0.55 | 44 | 6 | 889 | 0 |
