# Constellation Zone Reference

## Constellation Zones (Scroll Phases)

| Zone                       | Scroll Range | Nebula Hue  | Status Text                              | Needle (L / R) |
| -------------------------- | ------------ | ----------- | ---------------------------------------- | -------------- |
| 0 — DevOps & Engineering   | 0–33%        | Blue-violet | "Tracing the DevOps pipeline..."         | -10° / 55°     |
| 1 — Applications & Products | 33–66%      | Warm-gold   | "Viewing applications & products..."     | -50° / 95°     |
| 2 — Community & Web        | 66–100%      | Green-teal  | "Exploring community & web..."           | -90° / 135°    |

## Project ↔ Zone Membership

| Project               | Type     | Status      | Color   | Size | Zone 0 (DevOps) | Zone 1 (Apps) | Zone 2 (Community) |
| --------------------- | -------- | ----------- | ------- | ---- | --------------- | ------------- | ------------------ |
| odd-ai-reviewers      | Star     | Active      | #FF6B35 | 1.4  | ●               | ●             |                    |
| ado-git-repo-insights | Star     | Active      | #00C9D4 | 1.15 | ●               |               |                    |
| ado-git-repo-seeder   | Star     | Active      | #38BDF8 | 1.0  | ●               |               |                    |
| repo-standards        | Star     | Active      | #F5C518 | 1.0  | ●               |               | ●                  |
| odd-self-hosted-ci    | Star     | Active      | #4ADE80 | 1.0  | ●               |               |                    |
| odd-map               | Star     | Active      | #2DD4BF | 1.15 |                 | ●             |                    |
| odd-fintech           | Star     | Active      | #A855F7 | 1.4  |                 | ●             |                    |
| socialmedia-syndicator | Star    | In-Progress | #F472B6 | 1.0  |                 | ●             |                    |
| coney-island          | Star     | Active      | #F97316 | 1.0  |                 |               | ●                  |
| experiments-cluster   | Cluster  | Active      | #10B981 | 0.6  |                 |               | ●                  |
| dead-rock-cluster     | Cluster  | Paused      | #6B7280 | 0.4  |                 |               | (dim, non-interactive) |

## Cross-Zone (Bridge) Stars

- **odd-ai-reviewers** — bridges DevOps ↔ Applications
- **repo-standards** — bridges DevOps ↔ Community

## Cluster Details

### Experiments Cluster (active, interactive)
- 4 sub-point sprites + 1 halo, rendered as THREE.Group
- Members: oddessentials-splash, odd-portfolio, oddessentials-platform (in-progress), odd-demonstration
- Panel shows cluster member list with links

### Dead Rock Cluster (paused, non-interactive)
- 6 dim grey sprites (opacity 0.20), no halo, no pulse
- Members: odd-hive-mind, oddessentials-mcp, odd-repo-mapper, odd-docs, odd-dep-updater, odd-consultant
- Not in nav, not clickable, no reticle, no constellation lines
- Exempt from zone highlight scaling/opacity boost

### Coney Island (star with related repos)
- Individual star (not cluster), but has clusterMembers for panel display
- Related repos: coney-website, yo-coney-bot, yo-coney-mobile
- Panel shows media + "Related Repositories" section

## Constellation Lines

### Watermark Lines (always visible)
- Faint dashed lines (opacity 0.20, dasharray "8 12") connecting all zone members
- Chain topology: N-1 lines for N members per zone
- Dead-rock-cluster excluded from all line connections
- Under reduced-motion: solid lines (no dash pattern)

### Active Lines (zone-activated)
- Gradient stroke (zone color → bright → fade), glow filter, stroke-width 2
- Draw-on animation (dashoffset reveal) followed by energy flow (dasharray "15 10 5 10", ~200px/s)
- Crossfade transition: fade out old active lines, fade in new zone lines
- Under reduced-motion: solid static lines, no glow, no energy flow

### Intro Showcase
- After reveal completes, rapidly flashes all 3 zones (~1.15s total)
- Zone 0 → Zone 1 → Zone 2 with overlapping crossfade
- Uses temporary preview lines (not watermark layer)
- Killed by scroll or skip; disabled on mobile and reduced-motion

## What Changes Per Zone

| Element             | Location              | Zone 0                           | Zone 1                               | Zone 2                            | Rest                                        |
| ------------------- | --------------------- | -------------------------------- | ------------------------------------ | --------------------------------- | ------------------------------------------- |
| Command line        | `.cmd-text`           | "Tracing the DevOps pipeline..." | "Viewing applications & products..." | "Exploring community & web..."    | "Force multipliers for small businesses..." |
| Phase indicator     | `.phase-indicator`    | "DEVOPS & ENGINEERING"           | "APPLICATIONS & PRODUCTS"            | "COMMUNITY & WEB"                 | "phi LOCKED"                                |
| Nebula hue          | WebGL                 | Blue-violet                      | Warm-gold                            | Green-teal                        | Neutral                                     |
| Star highlights     | WebGL                 | 5 stars at 1.3x                 | 4 stars at 1.3x                     | 3 stars + 1 cluster at 1.3x      | All at 1.0x                                 |
| Active lines        | SVG overlay           | Gradient+glow+energy flow        | Gradient+glow+energy flow            | Gradient+glow+energy flow         | Watermark only                              |
| Gauge needles       | Brass frame           | L: -10° / R: 55°                | L: -50° / R: 95°                    | L: -90° / R: 135°                | L: 30° / R: 15°                            |

## Social & Presence Links

11 platform links in status panel (desktop) and hamburger nav (mobile):
LinkedIn, Facebook, X, GitHub, NPM, PyPI, Docker Hub, VS Marketplace, Codecov, Medium, Gravatar
