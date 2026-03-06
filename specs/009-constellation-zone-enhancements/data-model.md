# Data Model: Constellation Line and Zone Enhancements

**Phase 1 Output** | **Date**: 2026-03-06

## Entity Definitions

### Project (Individual Star)

Represents a single interactive repository star in the starfield.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique identifier (kebab-case repo name) |
| name | string | yes | Display name |
| shortDesc | string | yes | One-line description for nav tooltip |
| tagline | string | yes | Extended tagline for panel header |
| category | string | yes | Domain category: "devops", "application", "infrastructure", "tooling", "fintech", "web" |
| status | string | yes | "active" \| "in-progress" \| "paused" |
| isCluster | boolean | yes | false for individual stars |
| clusterMembers | null | yes | null for individual stars |
| constellation | string | yes | Constellation group name (display only) |
| accentColor | string | yes | Hex color for star glow and line theming |
| starSize | number | yes | Base size multiplier (0.3 - 1.4) |
| position | [x, y, z] | yes | World-space 3D position |
| logoUrl | string \| null | no | Path to logo asset |
| mediaType | string \| null | no | "image" \| "video" \| "youtube" \| "screenshots" \| null |
| mediaUrl | string \| null | no | Path/URL to primary media |
| screenshots | string[] \| null | no | Array of screenshot paths |
| links | Link[] | yes | External links (min 1) |

### Cluster

Represents a visual grouping of related repositories as a single starfield element.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique identifier (e.g., "experiments-cluster") |
| name | string | yes | Display name (e.g., "Experiments") |
| shortDesc | string | yes | One-line description for nav |
| tagline | string | yes | Extended tagline for cluster panel |
| category | string | yes | Domain category |
| status | string | yes | "active" \| "in-progress" \| "paused" |
| isCluster | boolean | yes | true |
| clusterMembers | ClusterMember[] | yes | Array of member repositories |
| constellation | string | yes | Constellation group name |
| accentColor | string | yes | Hex color for cluster halo |
| starSize | number | yes | Base size for cluster center (smaller than individual stars) |
| position | [x, y, z] | yes | World-space 3D position (cluster center) |
| logoUrl | null | - | Always null for clusters |
| mediaType | null | - | Always null for clusters |
| mediaUrl | null | - | Always null for clusters |
| screenshots | null | - | Always null for clusters |
| links | Link[] | yes | Primary links (org page, etc.) |

### ClusterMember

A repository within a cluster. Not individually represented in the starfield.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Repository display name |
| description | string | yes | One-line description |
| url | string | yes | Primary URL (GitHub) |
| status | string | yes | "active" \| "in-progress" \| "paused" |

### Link

External resource link for a project or cluster.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| label | string | yes | Display text (e.g., "GitHub", "npm") |
| url | string | yes | Full URL |
| primary | boolean | yes | true = prominent CTA, false = secondary |

### ConstellationZone

Scroll-driven grouping of projects/clusters.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Zone display name |
| scrollStart | number | yes | Scroll progress start (0.0 - 1.0) |
| scrollEnd | number | yes | Scroll progress end (0.0 - 1.0) |
| projectIds | string[] | yes | IDs of member projects/clusters |
| nebulaHue | string | yes | Descriptive hue name |
| nebulaHueRgb | [r, g, b] | yes | RGB values (0-1 range) for shader uniform |
| statusText | string | yes | Command line text when zone is active |

### SocialLink

External platform presence link.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| platform | string | yes | Platform name (e.g., "LinkedIn") |
| url | string | yes | Full URL |
| icon | string | yes | Inline SVG path data |

---

## Concrete Data (New PROJECTS Array)

### Individual Stars (9)

```javascript
// Zone 0 — DevOps & Engineering
{ id: "odd-ai-reviewers",      status: "active",      isCluster: false, starSize: 1.4,  accentColor: "#FF6B35", position: [1.8, 1.0, -0.5]  }
{ id: "ado-git-repo-insights",  status: "active",      isCluster: false, starSize: 1.15, accentColor: "#00C9D4", position: [-2.0, 0.5, 0.3]  }
{ id: "ado-git-repo-seeder",    status: "active",      isCluster: false, starSize: 1.0,  accentColor: "#38BDF8", position: [-1.2, 1.2, 0.1]  }
{ id: "repo-standards",         status: "active",      isCluster: false, starSize: 1.0,  accentColor: "#F5C518", position: [2.2, -0.4, 0.2]  }
{ id: "odd-self-hosted-ci",     status: "active",      isCluster: false, starSize: 1.0,  accentColor: "#4ADE80", position: [-0.8, -1.2, -0.6] }

// Zone 1 — Applications & Products
{ id: "odd-map",                status: "active",      isCluster: false, starSize: 1.15, accentColor: "#2DD4BF", position: [0.3, 0.8, 0.5]   }
{ id: "odd-fintech",            status: "active",      isCluster: false, starSize: 1.4,  accentColor: "#A855F7", position: [-2.2, -0.6, -0.3] }
{ id: "socialmedia-syndicator", status: "in-progress", isCluster: false, starSize: 1.0,  accentColor: "#F472B6", position: [1.5, 0.2, -0.2]  }

// Zone 2 — Community & Web
{ id: "coney-island",           status: "active",      isCluster: false, starSize: 1.0,  accentColor: "#F97316", position: [1.0, -1.0, 0.4]  }
```

### Clusters (2)

```javascript
// Zone 2 — Community & Web
{
  id: "experiments-cluster",
  name: "Experiments",
  shortDesc: "Experimental projects",
  tagline: "Experimental and showcase projects exploring new ideas",
  category: "experiments",
  status: "active",
  isCluster: true,
  starSize: 0.6,
  accentColor: "#10B981",
  position: [-0.2, -0.5, 0.3],
  clusterMembers: [
    { name: "oddessentials-splash",    description: "Main website of Odd Essentials, LLC",              url: "https://github.com/oddessentials/oddessentials-splash", status: "active" },
    { name: "odd-portfolio",           description: "Curated portfolio of all public Odd Essentials",    url: "https://github.com/oddessentials/odd-portfolio",         status: "active" },
    { name: "oddessentials-platform",  description: "AI software expert open chat",                      url: "https://github.com/oddessentials/oddessentials-platform", status: "in-progress" },
    { name: "odd-demonstration",       description: "Polyglot microservices demonstration",              url: "https://github.com/oddessentials/odd-demonstration",     status: "active" }
  ],
  links: [
    { label: "GitHub Org", url: "https://github.com/oddessentials", primary: true }
  ]
}

// Zone 2 — Community & Web (non-interactive)
{
  id: "dead-rock-cluster",
  name: "Reference Archive",
  shortDesc: "Paused reference projects",
  tagline: "Archived and paused reference repositories",
  category: "reference",
  status: "paused",
  isCluster: true,
  starSize: 0.4,
  accentColor: "#6B7280",
  position: [0.5, 1.3, -0.4],
  clusterMembers: [
    { name: "odd-hive-mind",       description: "AI Coding Swarm",        url: "https://github.com/oddessentials/odd-hive-mind",       status: "paused" },
    { name: "oddessentials-mcp",   description: "AI Tooling API",         url: "https://github.com/oddessentials/oddessentials-mcp",   status: "paused" },
    { name: "odd-repo-mapper",     description: "AI Repo Mapper",         url: "https://github.com/oddessentials/odd-repo-mapper",     status: "paused" },
    { name: "odd-docs",            description: "AI Repo Documenter",     url: "https://github.com/oddessentials/odd-docs",            status: "paused" },
    { name: "odd-dep-updater",     description: "AI Repo Update",         url: "https://github.com/oddessentials/odd-dep-updater",     status: "paused" },
    { name: "odd-consultant",      description: "AI Consultant",          url: "https://github.com/oddessentials/odd-consultant",      status: "paused" }
  ],
  links: [
    { label: "GitHub Org", url: "https://github.com/oddessentials", primary: true }
  ]
}
```

### Coney Island (Multi-Repo Star)

```javascript
{
  id: "coney-island",
  name: "Coney Island Pottsville",
  shortDesc: "Restaurant ecosystem",
  tagline: "A 100+ year old family-owned restaurant with website, AI chat bot, and mobile app",
  category: "web",
  status: "active",
  isCluster: false,           // single star, NOT a visual cluster
  clusterMembers: [           // but panel shows multiple repos
    { name: "coney-website",     description: "Restaurant website",          url: "https://github.com/coneyislandpottsville/coney-website",     status: "active" },
    { name: "yo-coney-bot",      description: "AI-powered chat agent",       url: "https://github.com/coneyislandpottsville/yo-coney-bot",      status: "active" },
    { name: "yo-coney-mobile",   description: "Mobile ordering app",         url: "https://github.com/coneyislandpottsville/yo-coney-mobile",   status: "active" }
  ],
  accentColor: "#F97316",
  starSize: 1.0,
  position: [1.0, -1.0, 0.4],
  // ... existing logo, media, links preserved
}
```

Note: Coney Island is `isCluster: false` (renders as a single star) but has `clusterMembers` populated (panel shows multi-repo list). This is a special case: a star with cluster panel behavior.

---

## Updated CONSTELLATION_ZONES

```javascript
[
  {
    name: "DevOps & Engineering",
    scrollStart: 0.0,
    scrollEnd: 0.33,
    projectIds: ["odd-ai-reviewers", "ado-git-repo-insights", "ado-git-repo-seeder", "repo-standards", "odd-self-hosted-ci"],
    nebulaHue: "blue-violet",
    nebulaHueRgb: [0.42, 0.25, 0.63],
    statusText: "Tracing the DevOps pipeline..."
  },
  {
    name: "Applications & Products",
    scrollStart: 0.33,
    scrollEnd: 0.66,
    projectIds: ["odd-ai-reviewers", "odd-map", "odd-fintech", "socialmedia-syndicator"],
    nebulaHue: "warm-gold",
    nebulaHueRgb: [0.72, 0.53, 0.04],
    statusText: "Viewing applications & products..."
  },
  {
    name: "Community & Web",
    scrollStart: 0.66,
    scrollEnd: 1.0,
    projectIds: ["repo-standards", "coney-island", "experiments-cluster", "dead-rock-cluster"],
    nebulaHue: "green-teal",
    nebulaHueRgb: [0.1, 0.62, 0.56],
    statusText: "Exploring community & web..."
  }
]
```

Bridge membership:
- `odd-ai-reviewers`: Zone 0 + Zone 1
- `repo-standards`: Zone 0 + Zone 2

---

## Social Links Data

```javascript
const SOCIAL_LINKS = [
  { platform: "LinkedIn",       url: "https://www.linkedin.com/in/petepalles/" },
  { platform: "Facebook",       url: "https://www.facebook.com/oddessentials" },
  { platform: "X",              url: "https://x.com/odd_essentials" },
  { platform: "GitHub",         url: "https://github.com/oddessentials" },
  { platform: "NPM",            url: "https://www.npmjs.com/search?q=@oddessentials" },
  { platform: "PyPI",           url: "https://pypi.org/user/oddessentials/" },
  { platform: "Docker Hub",     url: "https://hub.docker.com/u/oddessentials" },
  { platform: "VS Marketplace", url: "https://marketplace.visualstudio.com/publishers/OddEssentials" },
  { platform: "Codecov",        url: "https://app.codecov.io/github/oddessentials" },
  { platform: "Medium",         url: "https://medium.com/@pete.palles" },
  { platform: "Gravatar",       url: "https://gravatar.com/really3675c8a1ca" }
];
```

---

## State Transitions

### Zone Activation State Machine

```
REST (no zone) ──scroll──> ZONE_0_ACTIVE ──scroll──> ZONE_1_ACTIVE ──scroll──> ZONE_2_ACTIVE
     ^                         |                         |                         |
     └─────────────────────────┴─────────────────────────┴────── scroll back ──────┘
```

### Constellation Line States (per zone)

```
HIDDEN (pre-reveal) ──reveal complete──> WATERMARK (dashed, 0.15 opacity)
                                              |
                                         zone activates
                                              |
                                              v
                                        ACTIVE (gradient + glow + energy flow)
                                              |
                                         zone deactivates
                                              |
                                              v
                                        WATERMARK (returns to dashed)
```

### Intro Showcase Sequence (appended to reveal)

```
Stars stagger in (~5.2s) ──> Flash Zone 0 lines (0.4s) ──> Flash Zone 1 lines (0.4s) ──> Flash Zone 2 lines (0.4s) ──> Fade to watermark rest
```

Skippable: Skip button / S key / scroll causes immediate jump to watermark rest state.

---

## Validation Rules

1. Every project in PROJECTS must have a unique `id`
2. Every `id` referenced in `CONSTELLATION_ZONES[].projectIds` must exist in PROJECTS
3. Bridge stars must appear in exactly 2 zones (no more, no less)
4. Dead rock cluster (`status: "paused"`) must NOT appear in any nav list
5. All positions must have minimum 0.18 world-unit separation from every other position
6. Cluster members must each have name, description, url, and status
7. `isCluster: true` entries must have non-empty `clusterMembers` array
8. `isCluster: false` entries may optionally have `clusterMembers` (Coney Island case)

---

## Fields Removed (Glyph Atlas Cleanup)

The following fields are removed from the data model per R-001:
- `glyphName` — not consumed by any rendering code
- `glyphRotation` — not consumed by any rendering code
- `glyphType` — not consumed by any rendering code
- `glyphAtlasIndex` — not consumed by any rendering code
- `GLYPH_ATLAS_CELLS` export — entire array removed from data.js
