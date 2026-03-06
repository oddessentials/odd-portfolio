# Current State

## Constellation Zones (Scroll Phases)

| Zone                     | Scroll Range | Nebula Hue  | Status Text                       | Needle (L / R) |
| ------------------------ | ------------ | ----------- | --------------------------------- | -------------- |
| 0 — DevOps Pipeline      | 0–33%        | Blue-violet | "Tracing the DevOps pipeline..."  | -10° / 55°     |
| 1 — Products & Analytics | 33–66%       | Warm-gold   | "Viewing products & analytics..." | -50° / 95°     |
| 2 — Community & Web      | 66–100%      | Green-teal  | "Exploring community & web..."    | -90° / 135°    |

### Project ↔ Zone Membership

| Project               | Constellation         | Color   | Size | Zone 0 (DevOps) | Zone 1 (Products) | Zone 2 (Community) |
| --------------------- | --------------------- | ------- | ---- | --------------- | ----------------- | ------------------ |
| odd-ai-reviewers      | AI Reviewers          | #FF6B35 | 1.4  | ●               | ●                 |                    |
| ado-git-repo-insights | Analytics & Metrics   | #00C9D4 | 1.15 | ●               |                   |                    |
| repo-standards        | Repo Standards        | #F5C518 | 1.0  | ●               |                   | ●                  |
| odd-self-hosted-ci    | Self-Hosted Pipelines | #4ADE80 | 1.0  | ●               |                   | ●                  |
| odd-map               | Logistics             | #2DD4BF | 1.15 |                 | ●                 |                    |
| odd-fintech           | Market Data           | #A855F7 | 1.4  |                 | ●                 |                    |
| coney-island          | Hospitality           | #FB7185 | 1.0  |                 |                   | ●                  |

### Constellation Lines (drawn between zone members)

When a zone activates on scroll, SVG lines connect all projects in that zone's projectIds array. The highlighted stars scale to 1.3x and full opacity; non-zone stars dim to 0.5 opacity.

**Cross-zone projects** (appear in multiple zones):

- odd-ai-reviewers — bridges DevOps ↔ Products
- repo-standards — bridges DevOps ↔ Community
- odd-self-hosted-ci — bridges DevOps ↔ Community

**Zone-exclusive projects:**

- ado-git-repo-insights — DevOps only
- odd-map — Products only
- odd-fintech — Products only
- coney-island — Community only

### What changes per zone

| Element             | Location                      | Zone 0 (DevOps)                  | Zone 1 (Products)                 | Zone 2 (Community)                 | Rest (no scroll)                            |
| ------------------- | ----------------------------- | -------------------------------- | --------------------------------- | ---------------------------------- | ------------------------------------------- |
| Command line text   | Bottom bar `.cmd-text`        | "Tracing the DevOps pipeline..." | "Viewing products & analytics..." | "Exploring community & web..."     | "Force multipliers for small businesses..." |
| Phase indicator     | Bottom bar `.phase-indicator` | "DEVOPS PIPELINE"                | "PRODUCTS & ANALYTICS"            | "COMMUNITY & WEB"                  | "phi LOCKED"                                |
| Nebula hue          | WebGL background              | Blue-violet                      | Warm-gold                         | Green-teal                         | Neutral                                     |
| Star highlights     | WebGL stars                   | 4 stars at 1.3x / 1.0 opacity    | 3 stars at 1.3x / 1.0 opacity     | 3 stars at 1.3x / 1.0 opacity      | All at 1.0x / 1.0 opacity                   |
| Dimmed stars        | WebGL stars                   | 3 dimmed to 0.5                  | 4 dimmed to 0.5                   | 4 dimmed to 0.5                    | None dimmed                                 |
| Constellation lines | SVG overlay                   | Lines between 4 DevOps projects  | Lines between 3 Products projects | Lines between 3 Community projects | No lines                                    |
| Nebula rotation     | WebGL group                   | 0° → 30°                         | 30° → 60°                         | 60° → 90°                          | 0°                                          |
| Gauge needles       | Brass frame                   | L: -10° / R: 55°                 | L: -50° / R: 95°                  | L: -90° / R: 135°                  | L: 30° / R: 15°                             |

# NEW DATA THAT MUST BE WEAVED IN

## Authoritative Data (NEW)

Applications

1. https://github.com/oddessentials/odd-map
1. https://github.com/oddessentials/odd-fintech
1. https://github.com/oddessentials/socialmedia-syndicator (In-Progress)

Experiments

1. https://github.com/oddessentials/oddessentials-splash
1. https://github.com/oddessentials/odd-portfolio
1. https://github.com/oddessentials/oddessentials-platform (In-Progress)
1. https://github.com/oddessentials/odd-demonstration

DevOps & Engineering

1. AI Review Team - https://github.com/oddessentials/odd-ai-reviwers
1. Git Analytics - https://github.com/oddessentials/ado-git-repo-insights
1. Git Analytics testing - https://github.com/oddessentials/ado-git-repo-seeder
1. Code Standards - https://github.com/oddessentials/repo-standards
1. Self-hosted Pipelines - https://github.com/oddessentials/odd-self-hosted-ci-runtime

Reference Only

1. AI Coding Swarm - https://github.com/oddessentials/odd-hive-mind (Paused)
1. AI Tooling API - https://github.com/oddessentials/oddessentials-mcp (Paused)
1. AI Repo Mapper - https://github.com/oddessentials/odd-repo-mapper (Paused)
1. AI Repo Documenter - https://github.com/oddessentials/odd-docs (Paused)
1. AI Repo Updadate - https://github.com/oddessentials/odd-dep-updater (Paused)
1. AI Consultant - https://github.com/oddessentials/odd-consultant (Paused)

Coney Island

1. Website - https://github.com/coneyislandpottsville/coney-website
1. Chat - https://github.com/coneyislandpottsville/yo-coney-bot
1. Mobile App - https://github.com/coneyislandpottsville/yo-coney-mobile

Social Media:
LinkinIn - https://www.linkedin.com/in/petepalles/
Facebook - https://www.facebook.com/oddessentials
X.com - https://x.com/odd_essentials
Gravatar - https://gravatar.com/really3675c8a1ca
GitHub - https://github.com/oddessentials
Pipy - https://pypi.org/user/oddessentials/
NPM - https://www.npmjs.com/search?q=@oddessentials
DockerHub - https://hub.docker.com/u/oddessentials
VS Marketplace - https://marketplace.visualstudio.com/publishers/OddEssentials
Codecov - https://app.codecov.io/github/oddessentials
Medium - https://medium.com/@pete.palles

## Additional Requirements

1. Constellation line coloring when selected: keep the constellation lines theme-colored when selected, but make them prettier (maybe an animation, or a gradient, shadow, lighting, or something)
2. Constellation line watermmark when not selected: when a line isn't in focus, show a faint dashed line that get replaced when in focus or something similar
3. Constellation lines on intro animation: flash/rotate through the constellation lines

## Creative Direction (Strongly Encouraged):

- Maintain **three primary scroll zones** (DevOps & Engineering, Applications & Products, Community & Web) unless expansion becomes necessary.
- Continue using **zone-based color relationships** so projects in related domains share visually coherent color families.
- Represent **paused/reference repositories as a subdued “dead rock” cluster**, visible but dim and non-prominent.
- Represent **experimental repositories as a single cluster**, rather than individual stars, to reduce visual clutter.
- Represent **Coney Island projects as their own cluster**, using an **orange color spectrum** to visually group that ecosystem.
- Keep **core engineering systems (DevOps tools)** as individual stars within the DevOps zone.
- Include **Git Repo Seeder as a visible project**, since it is an active supporting application.
- Avoid relying on **cross-zone bridge behavior** for now to simplify constellation logic.
- Preserve the existing **three-phase scroll interaction model** (zone activation, star highlighting, constellation lines, nebula hue shifts).
- Maintain **professional, descriptive naming** for projects and groupings; avoid overly whimsical constellation terminology.
- Plan for future enhancement where **star size may scale based on repository metrics** such as lines of code.
