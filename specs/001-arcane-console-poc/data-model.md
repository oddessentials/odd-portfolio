# Data Model: Arcane Console POC

**Phase 1 Output** | **Date**: 2026-03-04

## Entities

### Project

The central data entity. Hard-coded array of 7 objects inline in `index.html`.

| Field | Type | Required | Description |
|---|---|---|---|
| id | string | YES | Unique identifier (kebab-case, e.g., "odd-ai-reviewers") |
| name | string | YES | Display name (e.g., "odd-ai-reviewers") |
| tagline | string | YES | One-line description |
| category | string | YES | Grouping key for constellation zones (e.g., "ai-devops", "data-devops", "tooling", "infrastructure", "frontend", "fintech", "web") |
| constellation | string | YES | Thematic constellation name (e.g., "The Forge Septet") |
| accentColor | string | YES | Hex color for star glow and nebula region (e.g., "#FF6B35") |
| starSize | number | YES | Relative star size multiplier (1.0 = standard, 1.15 = substantial, 1.4 = flagship) |
| position | [x, y, z] | YES | Hand-tuned 3D position within the orb (range: -0.85 to 0.85) |
| logoUrl | string | null | NO | Path to logo image in /assets, or null |
| mediaType | string | null | NO | One of: "image", "video", "youtube", "screenshots", or null |
| mediaUrl | string | null | NO | Path or URL for media content, or null |
| screenshots | string[] | null | NO | Array of screenshot paths (for screenshot gallery variant), or null |
| links | Link[] | YES | Array of external links (minimum 1) |

### Link

A sub-entity of Project. Represents an external URL.

| Field | Type | Required | Description |
|---|---|---|---|
| label | string | YES | Display text (e.g., "GitHub", "npm", "Live Demo", "Marketplace") |
| url | string | YES | Full URL |
| primary | boolean | NO | If true, displayed as a prominent CTA button (max 2 primary per project) |

### Star Node (runtime only)

Created from Project data during Three.js initialization. Not persisted.

| Property | Source | Description |
|---|---|---|
| sprite | runtime | THREE.Sprite with canvas-drawn radial gradient texture |
| haloSprite | runtime | Companion halo sprite (created on hover, destroyed on exit) |
| position | Project.position | THREE.Vector3 in orb-local coordinates |
| color | Project.accentColor | THREE.Color for glow and nebula region |
| baseScale | Project.starSize | Base sprite scale multiplier |
| project | Project | Reference back to project data |
| state | runtime | "idle" / "hovered" / "focused" / "dimmed" |

### Constellation Zone (runtime only)

Defines scroll-driven constellation groupings. Hard-coded configuration.

| Property | Description |
|---|---|
| name | Zone display name (e.g., "Arcane Tools") |
| scrollStart | Normalized scroll start position (0.0-1.0) |
| scrollEnd | Normalized scroll end position (0.0-1.0) |
| projectIds | Array of project IDs in this zone |
| nebulaHue | Target nebula color shift for this zone |
| statusText | CLI/status panel text for this zone |

## Project Data (7 entries)

| # | id | constellation | accentColor | starSize | mediaType |
|---|---|---|---|---|---|
| 1 | odd-ai-reviewers | The Forge Septet | #FF6B35 | 1.4 | youtube |
| 2 | ado-git-repo-insights | The Scribe's Lens | #00C9D4 | 1.15 | screenshots |
| 3 | repo-standards | The Iron Codex | #F5C518 | 1.0 | null |
| 4 | odd-self-hosted-ci | The Engine Core | #4ADE80 | 1.0 | null |
| 5 | odd-map | The Navigator's Rose | #2DD4BF | 1.15 | null |
| 6 | odd-fintech | The Alchemist's Eye | #A855F7 | 1.4 | video |
| 7 | coney-island | The Hearth Star | #FB7185 | 1.0 | image |

## Constellation Zones (3 + end)

| Zone | Projects | Scroll Range | Nebula Color |
|---|---|---|---|
| Arcane Tools | odd-ai-reviewers, repo-standards, odd-self-hosted-ci | 25%-50% | Blue-violet |
| Intelligence Matrix | ado-git-repo-insights, odd-fintech | 50%-75% | Warm gold-orange |
| Outpost Network | odd-map, coney-island | 75%-90% | Green-teal |
| End Zone (full universe) | all | 90%-100% | All equal |

## Relationships

```
Project 1──* Link        (each project has 1-5 links)
Project 1──1 StarNode    (each project maps to exactly 1 star)
Project *──1 ConstellationZone  (each project belongs to exactly 1 zone)
```

## Validation Rules

- Project.id MUST be unique across all 7 entries
- Project.links MUST contain at least 1 entry
- Project.links MUST contain at most 5 entries (max 2 primary)
- Project.position components MUST be within range [-0.85, 0.85]
- Project.starSize MUST be one of: 1.0, 1.15, 1.4
- Project.accentColor MUST be a valid 6-digit hex color
- Each ConstellationZone MUST contain at least 1 project
- No project may belong to more than 1 ConstellationZone
