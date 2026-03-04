# Data Model: Beta 0.1.0 — Portfolio Polish & Bug Fixes

**Phase 1 Output** | **Date**: 2026-03-04
**Base**: Extends `specs/001-arcane-console-poc/data-model.md`

## Changes from Alpha

### Project Entity — New Field

| Field | Type | Required | Description |
|---|---|---|---|
| shortDesc | string | YES | Short description (3–6 words) for sidebar display. Derived from `tagline` but editorially shortened to fit narrow sidebar width. |

All other Project fields remain unchanged from Alpha.

### Project Data (7 entries — updated)

| # | id | name | shortDesc | constellation | accentColor | starSize |
|---|---|---|---|---|---|---|
| 1 | odd-ai-reviewers | odd-ai-reviewers | AI code review pipeline | The Forge Septet | #FF6B35 | 1.4 |
| 2 | ado-git-repo-insights | ado-git-repo-insights | Azure DevOps PR metrics | The Scribe's Lens | #00C9D4 | 1.15 |
| 3 | repo-standards | repo-standards | Repo quality standards | The Iron Codex | #F5C518 | 1.0 |
| 4 | odd-self-hosted-ci | odd-self-hosted-ci | Self-hosted CI runtime | The Engine Core | #4ADE80 | 1.0 |
| 5 | odd-map | odd-map | Interactive office locator | The Navigator's Rose | #2DD4BF | 1.15 |
| 6 | odd-fintech | odd-fintech | Financial intelligence dashboard | The Alchemist's Eye | #A855F7 | 1.4 |
| 7 | coney-island | Coney Island Pottsville | Restaurant with AI chat | The Hearth Star | #FB7185 | 1.0 |

### Star Node Entity — New Runtime Property

| Property | Source | Description |
|---|---|---|
| userData.basePosition | Project.position | Original [x, y, z] from data.js, preserved for aspect-ratio scaling. Star's actual `position` is derived from `basePosition × xScale` on resize. |

### Terminal Scan Entry (new runtime entity)

Represents one step in the terminal loading animation sequence.

| Property | Type | Description |
|---|---|---|
| projectId | string | Project identifier being "scanned" |
| scanText | string | Display text: "Scanning {projectId}..." |
| progress | number | Cumulative progress percentage (14, 28, 43, 57, 71, 86, 100) |
| barString | string | ASCII progress bar: "[##........] XX%" |

Not persisted. Generated at runtime from the PROJECTS array during animation.

### Greek Key Tile (CSS entity — no data model)

The Greek key pattern is purely CSS — no data model needed. Configuration is via CSS custom properties:

| CSS Property | Desktop | Tablet | Mobile |
|---|---|---|---|
| `--gk-cell` | 36px | 24px | hidden |
| `--gk-line` | 3px | 2px | hidden |

## Validation Rules — Updates

- All Alpha validation rules remain in effect
- Project.shortDesc MUST be 3–6 words (15–45 characters)
- Project.shortDesc MUST NOT duplicate the full `tagline` verbatim
- Star positions continue to be hard-coded in data.js but are dynamically scaled at runtime based on viewport aspect ratio

## Relationships — No Changes

```
Project 1──* Link           (each project has 1–5 links)
Project 1──1 StarNode       (each project maps to exactly 1 star)
Project *──1 ConstellationZone  (each project belongs to exactly 1 zone)
```

## Position Range Update

The Alpha data model documented position range as `[-0.85, 0.85]`. The actual positions in data.js use a wider range (x: -2.2 to +2.2, y: -1.2 to +1.0, z: -0.6 to +0.5). This was an Alpha discrepancy. Beta documents the actual ranges:

| Axis | Min | Max | Notes |
|---|---|---|---|
| x | -2.2 | +2.2 | Scaled by `xScale` on narrow viewports |
| y | -1.2 | +1.0 | Not scaled (vertical FOV is constant) |
| z | -0.6 | +0.5 | Not scaled (depth position) |
