# 014 — Portfolio Modal Enhancement

## Feature Specification

**Status:** Draft v4 (post team review)
**Date:** 2026-03-07
**Team:** Software Systems Architect, Repository Analyst, Data Engineer, Product UX Strategist

**Constitution Amendment:** This feature adds 6 new fields to the PROJECTS data model:
`repoKey`, `synopsis`, `capabilities`, `techStack`, `aiModels`, `starSizeOverride`.
(Amendment: 014-modal-enhancement, owner-approved 2026-03-07.
Constitution v1.5.0 -> v1.6.0.)

---

## 1. Problem Statement

The current portfolio project modals display only a title, tagline, optional media, and link buttons. Visitors cannot assess project maturity, technical depth, or development activity without clicking through to GitHub. The `starSize` values driving the 3D visualization are manually assigned rather than derived from objective data.

This feature enriches modals with verified repository synopses, key capability highlights, structured technical metadata, and GitHub metrics — collected deterministically at build time and rendered from a generated artifact, never from hard-coded prose.

---

## 2. Canonical Identifier Registry

Every project, repo slug, and display label is defined exactly once. All systems (data-content.js, repo-metrics.json, manifest, modal UI) reference this table.

| repoKey | Display Name | Repo Slug | data.js id | Notes |
|---------|-------------|-----------|------------|-------|
| odd-ai-reviewers | Odd AI Reviewers | oddessentials/odd-ai-reviewers | odd-ai-reviewers | |
| ado-git-repo-insights | ADO Git Repo Insights | oddessentials/ado-git-repo-insights | ado-git-repo-insights | |
| ado-git-repo-seeder | ADO Git Repo Seeder | oddessentials/ado-git-repo-seeder | ado-git-repo-seeder | |
| repo-standards | Repository Standards | oddessentials/repo-standards | repo-standards | |
| odd-self-hosted-ci-runtime | OSCR | oddessentials/odd-self-hosted-ci-runtime | odd-self-hosted-ci | repoKey differs from id |
| odd-map | Odd Map | oddessentials/odd-map | odd-map | |
| odd-fintech | Odd Fintech | oddessentials/odd-fintech | odd-fintech | |
| socialmedia-syndicator | Social Media Syndicator | oddessentials/socialmedia-syndicator | socialmedia-syndicator | |
| oddessentials-splash | OddEssentials Splash | oddessentials/oddessentials-splash | (cluster member) | Inside experiments-cluster |
| odd-portfolio | Odd Portfolio | oddessentials/odd-portfolio | (cluster member) | Inside experiments-cluster |
| oddessentials-platform | OddEssentials Platform | oddessentials/oddessentials-platform | (cluster member) | Inside experiments-cluster |
| odd-demonstration | Distributed Task Observatory | oddessentials/odd-demonstration | (cluster member) | Inside experiments-cluster |
| coney-website | Coney Website | oddessentials/coney-website | (coney-island child) | See section 2.2 |
| yo-coney-bot | Yo Coney Bot | oddessentials/yo-coney-bot | (coney-island child) | See section 2.2 |
| yo-coney-mobile | Yo Coney Mobile | oddessentials/yo-coney-mobile | (coney-island child) | See section 2.2 |

### 2.1 Identifier Contract

- Every project in `data.js` MUST have a `repoKey` field.
- For standard projects: `repoKey` MUST exactly match a key in `repo-metrics.json`.repos AND a manifest entry in `build-metrics.py`.
- For clusters (`isCluster: true`) and parent-with-children projects (see 2.2): `repoKey` is `null`. Null repoKeys are exempt from validation.
- The build script MUST exit non-zero if orphan validation fails (see 12.3). Validation is mandatory on every run, not opt-in.
- For cluster members: each `clusterMember` MAY have a `repoKey`. If present, metrics are shown per-member in the cluster modal. If absent, that member has no metrics display.

### 2.2 Parent-With-Children Projects (`coney-island`)

The `coney-island` entry in data.js has `isCluster: false` but contains a `clusterMembers` array. This is a **parent-with-children** project — a single star in the constellation that represents multiple related repos.

- `coney-island` gets `repoKey: null` (no single repo to measure).
- Its `clusterMembers` each get an optional `repoKey` pointing to their individual repo.
- The modal renders using the standard non-cluster path with a "Related Repositories" section (existing behavior in panel.js line 283-293).
- Metrics bar is hidden on the parent (no repoKey). Individual member metrics are out of scope for v1.

This is distinct from true clusters (`isCluster: true`) which render a cluster member list instead of media.

---

## 3. Authoritative Repository Synopses

Synopses and capabilities are authored content. They describe what the project IS, verified against source code. They MUST NOT contain metrics (commit counts, PR counts, release numbers, contributor counts) — those values are rendered exclusively from `repo-metrics.json` at runtime to prevent drift.

Each synopsis links to its investigation report at `scripts/repo-reports/<repoKey>.json` as machine-readable verification evidence.

### 3.1 odd-ai-reviewers
**Investigation:** `scripts/repo-reports/odd-ai-reviewers.json`

Extensible AI code review pipeline for pull requests supporting GitHub and Azure DevOps. Runs multi-pass analysis: static analysis first (Semgrep, Reviewdog) then AI semantic review via pluggable agents. Supports four AI providers with per-PR and monthly cost controls, fork-PR security blocking, and configurable gating.

**Key Capabilities:**
- Multi-pass review pipeline: static analysis (free) then AI semantic review
- Pluggable agent architecture: Semgrep, Reviewdog, OpenCode, PR-Agent, local LLMs
- Four AI provider support: OpenAI, Anthropic, Azure OpenAI, Ollama
- Per-PR and monthly budget limits with automatic enforcement
- Published on npm as @oddessentials/odd-ai-reviewers

**AI Models:** OpenAI GPT-4o/GPT-4o-mini, Anthropic Claude Sonnet/Opus, Azure OpenAI, Ollama CodeLlama:7b

### 3.2 ado-git-repo-insights
**Investigation:** `scripts/repo-reports/ado-git-repo-insights.json`

Dual-stack (Python + TypeScript) tool that extracts Azure DevOps Pull Request metrics into SQLite and generates PowerBI-compatible CSV dashboards. Ships as both a PyPI package and a VS Code Marketplace extension with an interactive web dashboard for PR analytics visualization.

**Key Capabilities:**
- Python CLI extracts PR data from Azure DevOps REST API into SQLite
- TypeScript VS Code extension for in-editor dashboard access
- Interactive web dashboard with PowerBI-compatible CSV export
- Published on PyPI and VS Marketplace

### 3.3 ado-git-repo-seeder
**Investigation:** `scripts/repo-reports/ado-git-repo-seeder.json`

Node.js tool that seeds realistic, multi-user Pull Request activity in Azure DevOps for testing and demo purposes. Supports configurable user simulation, multiple seeding strategies (isolated, direct, accumulation), and idempotent multi-run patterns.

**Key Capabilities:**
- Multi-user PR activity simulation with identity resolution
- Five example configurations from solo dev to enterprise scale
- Idempotent accumulation patterns for multi-day simulation
- Security-focused: explicit "DO NOTs" for identity handling

### 3.4 repo-standards
**Investigation:** `scripts/repo-reports/repo-standards.json`

Single, authoritative JSON specification for repository quality standards across TypeScript/JS, C#/.NET, Python, Rust, and Go. Provides deterministic tooling for CI checklists and repo quality auditing. Published on npm.

**Key Capabilities:**
- Multi-stack quality standards (5 language ecosystems)
- JSON specification schema with deterministic validation
- CI checklist generation tooling
- Published on npm as @oddessentials/repo-standards

### 3.5 odd-self-hosted-ci-runtime
**Investigation:** `scripts/repo-reports/odd-self-hosted-ci-runtime.json`

Docker-first, provider-pluggable self-hosted CI runtime that runs CI pipelines at zero cloud cost on your own hardware. Ships pre-built Docker images for both GitHub Actions runners and Azure DevOps agents.

**Key Capabilities:**
- Dual-provider Docker images: GitHub Actions + Azure DevOps
- Zero cloud cost CI execution on local hardware
- Published on Docker Hub (oscr-github, oscr-azure-devops)
- Automated smoke tests and semantic releases

### 3.6 odd-map
**Investigation:** `scripts/repo-reports/odd-map.json`

White-label, mobile-friendly interactive office locator with three rendering modes (2D SVG, 3D Three.js globe, tile map via MapLibre/Apple MapKit/Google Maps). Fully static with no backend, multi-client theming via JSON configuration, and runtime lat/lon projection with d3-geo.

**Key Capabilities:**
- Three map rendering modes: 2D SVG, 3D globe, tile map
- Multi-provider maps: MapLibre GL, Apple MapKit, Google Maps with free fallback
- White-label multi-client theming via JSON config
- Runtime lat/lon projection (d3-geo), no pre-computed coordinates
- Mobile-first: pinch-to-zoom, swipe-to-dismiss, safe area insets
- Fully static deployment

### 3.7 odd-fintech
**Investigation:** `scripts/repo-reports/odd-fintech.json`

Full-stack financial intelligence dashboard with magic-link authentication, real-time market data, stock analysis, precious metals tracking, congressional trade monitoring, and celestial intelligence features. Built with TypeScript (Vite + Express), containerized with Docker.

**Key Capabilities:**
- Magic-link passwordless authentication with session management
- Real-time market data via multiple providers (Finnhub, Yahoo, SEC EDGAR, Wikidata)
- Congressional trade monitoring and precious metals tracking
- Docker Compose deployment with production environment support

### 3.8 socialmedia-syndicator
**Investigation:** `scripts/repo-reports/socialmedia-syndicator.json`

Mobile-first PWA for controlled, auditable social media publishing workflows with admin approval. Full-stack TypeScript (Vite client + Express server) with PostgreSQL, Redis/BullMQ for background jobs, and Prisma ORM. Invite-only with role-based access.

**Key Capabilities:**
- Admin-approved publishing workflow with audit trail
- Mobile-first PWA with offline capability
- Background job processing via BullMQ (emails, publishing)
- PostgreSQL + Prisma ORM with Redis queue
- Docker Compose development environment

### 3.9 oddessentials-splash
**Investigation:** `scripts/repo-reports/oddessentials-splash.json`

Immersive ASCII-driven splash experience for oddessentials.com built with Three.js, custom GLSL shaders, and high-resolution ASCII SVG textures. Production pipeline includes Vite, javascript-obfuscator with domain lock, SVGO, semantic-release, and Cloudflare Pages deployment.

**Key Capabilities:**
- Custom GLSL shaders for ASCII blending, transitions, effects
- Three.js WebGL with postprocessing pipeline
- Domain-locked obfuscation for production
- Automated CI/CD: build, version, deploy to Cloudflare Pages
- Discord release notifications

### 3.10 odd-portfolio
**Investigation:** `scripts/repo-reports/odd-portfolio.json`

The portfolio itself — a single-page WebGL experience showcasing all Odd Essentials projects as an interactive star constellation. Built with Three.js, GSAP, and vanilla ES modules with no build system. Features procedural nebula generation, scroll-driven exploration, and this very modal system being enhanced.

**Key Capabilities:**
- Three.js WebGL constellation visualization with procedural nebula (fBm)
- GSAP-driven scroll exploration with 3 constellation zones
- MSDF shader sidebar glyphs, SVG reticle targeting
- Performance auto-tiering (desktop/tablet/mobile)

### 3.11 oddessentials-platform
**Investigation:** `scripts/repo-reports/oddessentials-platform.json`

AI-powered chat assistant specializing in software engineering thought leadership. Features an academic persona (OddBot) with APA citation requirements, config-driven knowledge base, matrix-green terminal aesthetic, and text-to-speech via MeloTTS. Powered by OpenAI.

**Key Capabilities:**
- OpenAI Chat Completions / Assistants + File API integration
- Academic persona with APA-formatted citations
- Config-driven extensible knowledge base
- MeloTTS text-to-speech integration
- Matrix-green retro terminal UI (React + Vite)
- PostgreSQL interaction logging

**AI Models:** OpenAI GPT-4o-mini (configurable)

### 3.12 odd-demonstration
**Investigation:** `scripts/repo-reports/odd-demonstration.json`

Self-contained distributed systems demonstration platform — a polyglot microservices cluster (TypeScript, Go, Rust, Python) orchestrated via Kubernetes with a custom cross-platform TUI dashboard and web mirror. Includes gateway, task processor, metrics engine, read model, and PTY server.

**Key Capabilities:**
- Polyglot microservices: TypeScript gateway, Go processor, Rust TUI, Python metrics
- Custom cross-platform TUI (Rust) with web mirror
- Kubernetes orchestration via Kind
- RabbitMQ message bus, Prometheus + Grafana observability
- Cross-platform releases (Windows, macOS Intel/ARM, Linux)

### 3.13 coney-website
**Investigation:** `scripts/repo-reports/coney-website.json`

Restaurant website and events management platform for Coney Island Pottsville, a 100+ year old family-owned restaurant. Features a Node.js events publisher that reads from YAML source of truth and generates JSON/iCal feeds, optionally posting to Facebook and X/Twitter.

**Key Capabilities:**
- Events publisher: YAML source of truth to JSON + iCal feeds
- Social media auto-posting (Facebook Page, X/Twitter) for events
- Python-generated alcohol menu from raw JSON
- Cloudflare Pages static hosting with proper caching headers
- JSON-LD structured data for SEO

### 3.14 yo-coney-bot
**Investigation:** `scripts/repo-reports/yo-coney-bot.json`

AI-powered chat assistant for Coney Island Pottsville restaurant. A PWA web app that answers guest questions about hours, menu, pricing, events, parking, and local history — all grounded in canonical machine-readable JSON data published by the restaurant website.

**Key Capabilities:**
- OpenAI Chat Completions / Assistants + File API integration
- Strict grounding in official JSON/HTML data sources (no hallucination)
- Configurable persona system (default, coneyLocal)
- PWA installable via vite-plugin-pwa
- Single Docker container serves React frontend + Express API

**AI Models:** OpenAI GPT-4o-mini (configurable)

### 3.15 yo-coney-mobile
**Investigation:** `scripts/repo-reports/yo-coney-mobile.json`

Mobile ordering app for Coney Island Pottsville. TypeScript-based, early-stage development.

**Key Capabilities:**
- TypeScript mobile app foundation

---

## 4. Portfolio Modal Data Model

### 4.1 Current Schema (data.js PROJECTS)

```js
{
  id, name, shortDesc, tagline, category, status,
  isCluster, clusterMembers, constellation, accentColor,
  starSize, position, logoUrl, mediaType, mediaUrl,
  screenshots, links
}
```

### 4.2 Enhanced Schema (new fields)

```js
{
  // ... existing fields unchanged ...

  // NEW: Required — maps to repo-metrics.json key and manifest entry
  // null for clusters and parent-with-children (coney-island)
  repoKey: "odd-ai-reviewers",  // or null

  // NEW: Optional — overrides metrics-calculated star size
  starSizeOverride: null,  // number or null
}
```

Authored content fields (`synopsis`, `capabilities`, `techStack`, `aiModels`) are stored in a separate `js/data-content.js` module to keep `data.js` under its current size. See section 4.6.

### 4.3 Merge Precedence Rules

| Field Type | Source of Truth | Override |
|-----------|----------------|----------|
| Authored text (synopsis, capabilities, techStack, aiModels) | `data-content.js` only | Never overwritten by metrics |
| Computed metrics (commit_count, pr_count, etc.) | `repo-metrics.json` only | Never stored in data.js |
| Star size | `repo-metrics.json` calculated_star_size | `data.js` starSizeOverride wins if non-null |
| Star size fallback | `data.js` starSize (legacy) | Used only if metrics AND override are both absent |

The build pipeline MUST NEVER mutate `data.js` or `data-content.js`. Computed `starSize` values live only in `repo-metrics.json`.

### 4.4 `repo-metrics.json` — Committed Build Artifact

**Lifecycle:** Generated by `python scripts/build-metrics.py`, committed to the repository, deployed as a static asset. This is the single source of truth for all environments (local dev, CI, production). There is no runtime API fetching.

**Why committed:** The portfolio has no build system and no CI. The metrics file is regenerated manually or via a scheduled script, reviewed, and committed. This ensures deterministic, auditable deploys.

**File location:** `assets/repo-metrics.json`

**Timestamp format:** `generated_at` MUST be UTC, truncated to seconds, with `Z` suffix (e.g. `2026-03-07T05:03:36Z`). No microseconds, no `+00:00` offset — this ensures `Date.parse()` compatibility across all browsers including Safari.

**Schema:**

```json
{
  "generated_at": "2026-03-07T05:03:36Z",
  "repo_count": 15,
  "repos": {
    "<repoKey>": {
      "commit_count": 471,
      "pr_count": 133,
      "issue_count": 28,
      "contributor_count": 3,
      "release_count": 13,
      "created_at": "2026-01-19T01:53:26Z",
      "pushed_at": "2026-03-02T15:15:19Z",
      "first_commit_date": "2026-01-19T...",
      "latest_commit_date": "2026-03-02T...",
      "repo_lifetime_days": 42,
      "primary_language": "TypeScript",
      "disk_usage_kb": 50521,
      "stars": 0,
      "forks": 0,
      "license": "MIT License",
      "visibility": "PUBLIC",
      "latest_release": "v1.7.4",
      "dev_duration_days": 47,
      "activity_score": 894.0,
      "calculated_star_size": 1.44,
      "tier_label": "major"
    }
  }
}
```

### 4.5 Canonical Token Schema

#### techStack tokens
Allowed values use exact casing. Duplicates within a project are rejected at review time.

```
TypeScript, JavaScript, Python, Rust, Go, C#, HTML, CSS, GLSL,
Node.js, Express, React, Vite, Docker, Kubernetes,
Three.js, GSAP, Prisma, PostgreSQL, Redis, RabbitMQ,
Semgrep, Reviewdog, MapLibre, Cloudflare Pages,
SQLite, PowerBI, BullMQ
```

New tokens may be added to this list. Variants like "node", "Node", "nodejs" are forbidden — use the canonical form.

#### aiModels tokens
```
OpenAI GPT-4o, OpenAI GPT-4o-mini, Anthropic Claude Sonnet,
Anthropic Claude Opus, Azure OpenAI, Ollama CodeLlama:7b
```

Projects with no AI integration set `aiModels: null` (not `[]`).

### 4.6 Data File Extraction

`data.js` is currently 493 lines. Adding `synopsis`, `capabilities`, `techStack`, and `aiModels` for all projects would add ~130 lines, pushing it to ~625 lines.

To prevent this, authored content is extracted into a new **`js/data-content.js`** module:

```js
// js/data-content.js — Authored content for modal enhancement
// Keyed by repoKey (or data.js id for projects without a repoKey)
export const PROJECT_CONTENT = {
  "odd-ai-reviewers": {
    synopsis: "...",
    capabilities: [...],
    techStack: [...],
    aiModels: [...],
  },
  // ...
};
```

`data.js` gains only `repoKey` and `starSizeOverride` per project (~2 lines each, ~22 lines total). `panel-content.js` imports from `data-content.js` to render the new sections. `data.js` stays under 520 lines.

---

## 5. GitHub Metrics Collection Strategy

### 5.1 Metric Definitions

Every metric has an unambiguous definition:

| Metric | Definition | API Source | Includes |
|--------|-----------|------------|----------|
| `commit_count` | Total commits on default branch, all time | REST `repos/{r}/commits?per_page=1` Link header last-page trick | All authors, merge commits |
| `pr_count` | Total pull requests (open + closed + merged) | GraphQL `repository.pullRequests.totalCount` | All states; does NOT include issues |
| `issue_count` | Total issues (open + closed), excluding PRs | GraphQL `repository.issues.totalCount` | All states; GitHub API separates issues from PRs in GraphQL |
| `contributor_count` | Unique contributors with at least 1 commit | REST `repos/{r}/contributors` array length | All-time, includes bots |
| `release_count` | Published GitHub releases | REST `repos/{r}/releases` array length | Only published releases, not draft |
| `repo_lifetime_days` | Days from first commit date to most recent commit date | REST commits API (first page = newest, last page = oldest) | 0 if single commit |
| `dev_duration_days` | Days from repo creation to now | GraphQL `createdAt` | Calendar days, not active days |
| `first_commit_date` | ISO date of the oldest commit on default branch | REST commits API last page | May predate repo creation if force-pushed |
| `latest_commit_date` | ISO date of the newest commit on default branch | REST commits API first page | |

### 5.2 Counting Reliability

The `gh pr list --jq length` and `gh issue list --jq length` commands are unreliable beyond `--limit` (default 30, max 1000). Replace with GraphQL `totalCount` queries:

```graphql
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    pullRequests { totalCount }
    issues { totalCount }
  }
}
```

This returns exact totals regardless of pagination. The build script MUST use this method.

If the GraphQL query returns a null `repository` (e.g. permission error, repo not found), the build script MUST treat this as a repo-level failure and exit non-zero — not silently default to zeros.

For `commit_count`: the Link-header last-page trick on `repos/{r}/commits?per_page=1` returns the total page count, which equals total commits. This is reliable up to GitHub's 40,000-commit traversal limit. If a repo exceeds this, the count is capped and the script logs a warning.

### 5.3 Rate Limiting

GitHub API rate limit: 5,000 requests/hour (authenticated).
Per repo: ~6 API calls (metadata, commits, contributors, releases, GraphQL counts, tree).
15 repos = ~90 calls. Well within limits.
Script MUST check `rate_limit` before starting and abort if remaining < 100.

### 5.4 Private and Archived Repos

- Private repos are collected identically to public repos (authenticated `gh` CLI has access).
- Archived repos (status: "paused" in data.js) are excluded from the manifest. They have no metrics entry and the modal hides the metrics bar.
- If a manifest repo is unreachable, the build script MUST fail (non-zero exit), not silently skip.

---

## 6. Planet Tier Classification Logic

### 6.1 Composite Activity Score

```
score = (
    commit_count * 1.0 +
    pr_count * 2.0 +
    issue_count * 1.5 +
    release_count * 5.0 +
    contributor_count * 10.0 +
    min(repo_lifetime_days * 0.67, 20)
)
```

`repo_lifetime_days` is used (first commit to latest commit), not `dev_duration_days` (creation to now). Falls back to `dev_duration_days` only if `repo_lifetime_days` is `None`/missing (not when it is 0 — a 0-day lifetime is a valid value for single-day repos).

### 6.2 Fixed Threshold Tiers

Tiers use **fixed score boundaries**, not percentile normalization. A repo's tier changes only when its own score crosses a boundary — never because another repo changed.

| Tier | Score Range | Star Size | Visual |
|------|-----------|-----------|--------|
| Dwarf | 0 – 199 | 0.55 | Smallest star |
| Minor | 200 – 399 | 0.89 | Small star |
| Standard | 400 – 699 | 1.00 | Medium star |
| Major | 700 – 999 | 1.44 | Large star |
| Giant | 1000+ | 2.33 | Largest star |

Boundaries are inclusive on the lower bound, exclusive on the upper (e.g., a score of exactly 200 is "Minor", not "Dwarf").

These thresholds are tuned from the current dataset and published in the build script. They may be adjusted by explicit amendment, but the mechanism is always fixed thresholds, never relative normalization.

### 6.3 Override Mechanism

`data.js` supports an optional `starSizeOverride` field per project. Precedence:

1. `starSizeOverride` (if non-null) — always wins
2. `calculated_star_size` from `repo-metrics.json` — used if override is null
3. `starSize` in `data.js` — legacy fallback if metrics are absent

The build script MUST NEVER write to `data.js`.

### 6.4 Visual Transition Plan

Switching from manual `starSize` to computed `calculated_star_size` changes the visual appearance of several stars:

| Project | Current starSize | Computed tier | Change |
|---------|-----------------|--------------|--------|
| odd-ai-reviewers | 2.33 (giant) | 1.44 (major) | shrinks |
| ado-git-repo-insights | 1.0 (standard) | 2.33 (giant) | grows |
| odd-fintech | 2.33 (giant) | 1.0 (standard) | shrinks |
| odd-map | 1.44 (major) | 0.89 (minor) | shrinks |

To preserve current visuals during the transition, set `starSizeOverride` to the current `starSize` value for any project where the visual change is unacceptable. Remove overrides later as the computed tiers are accepted.

---

## 7. Stale-Data Policy

### 7.1 Freshness Threshold

`repo-metrics.json` has a `generated_at` ISO timestamp (always UTC, `Z` suffix, no microseconds).

| Age | Action |
|-----|--------|
| < 7 days | Normal operation |
| 7-30 days | Modal displays a subtle "metrics from {date}" caption below the metrics bar |
| > 30 days | Metrics bar is suppressed entirely; modal renders authored content only |

### 7.2 Frontend Staleness Check

On `repo-metrics.json` load, compute `daysSinceGenerated = (Date.now() - Date.parse(generated_at)) / 86400000`. Apply the rules above. Never show partial or mixed states — either all metrics render or none do.

---

## 8. Data Loading Contract

### 8.1 Single Fetch, Shared via DI

`repo-metrics.json` is fetched **once** during `app.js` init, before scene star creation. The fetched data is passed to both:
- `textures.js` `createStarNodes()` for star sizing (at init)
- `panel.js` via `initPanel({ repoMetrics })` for metrics bar rendering (on panel-open)

This follows the project's existing dependency injection pattern (modules receive refs via init(), not direct imports). There is no separate lazy fetch in panel.js.

### 8.2 Caching

The `app.js` init-time fetch result is the single cache. Panel receives it via DI and holds a local reference.

### 8.3 Failure Handling

If `fetch()` fails (network error, 404, parse error):
- `repoMetrics` defaults to `{ repos: {} }` (empty).
- Star sizes fall back to legacy `starSize` values.
- The modal renders without a metrics bar. No error shown to the user.
- A `console.warn` is logged for developer diagnosis.
- No retry.

### 8.4 Merge at Render Time

The `repoKey` on the project record is used to look up `repoMetrics.repos[repoKey]`. If no entry exists (or repoKey is null), the metrics bar is hidden for that project. This is the expected state for clusters, parent-with-children, and paused projects.

---

## 9. Modal Rendering Contract by Project Type

### 9.1 Standard Project (isCluster: false, status: "active", no clusterMembers)

All sections render: badges, synopsis, media, capabilities, tech stack, AI models, metrics bar, links.

### 9.2 In-Progress Project (status: "in-progress")

Same as standard, plus status badge. Metrics bar still renders (the project has a repo and activity).

### 9.3 Cluster Project (isCluster: true, status: "active")

- Title, tagline, badges render.
- Synopsis and capabilities render if present on the cluster record.
- Media zone renders cluster member list (existing behavior).
- Metrics bar is hidden on the cluster itself (repoKey is null).
- Each cluster member with a `repoKey` may render inline metrics in the member list (future enhancement, not in scope for v1).
- Tech stack and AI models render if present on the cluster record.
- Links render.

### 9.4 Parent-With-Children Project (coney-island)

- Renders as a standard project (title, tagline, badges, synopsis, media, capabilities, etc.).
- Additionally renders a "Related Repositories" section in the media zone (existing behavior, panel.js line 283-293).
- Metrics bar is hidden (repoKey is null).

### 9.5 Paused/Archived Project (status: "paused")

- Title, tagline, status badge ("Archived") render.
- Synopsis renders if present.
- Metrics bar is hidden (no manifest entry, no metrics record).
- Tech stack, capabilities, and links render if present.
- Star size uses `starSize` from data.js (legacy value, no computed tier).

### 9.6 Missing Metrics (repoKey present but no metrics entry)

Metrics bar is hidden. All authored content renders. No "N/A" or "TBD" in production content.

### 9.7 Minimum Viable Modal (Empty State)

If a project has no synopsis, no capabilities, no techStack, no aiModels, and no media, the modal renders: title, tagline, category placeholder icon (existing default case in panel.js), and links footer. No empty wrapper divs are rendered for absent sections. The builder functions return null when data is absent; panel.js only appends non-null results.

---

## 10. Enhanced Modal UI Design

### 10.1 Section Order

1. **Title** — existing, now with `accentColor` applied to top border accent
2. **Tagline** — existing
3. **Category + Constellation Badges** — new pill badges below tagline
4. **Status Badge** — existing (if in-progress/paused)
5. **Media Zone** — existing (screenshots, video, YouTube, image) — moved UP for immediate visual impact
6. **Synopsis** — new paragraph block
7. **Metrics Bar** — new compact stats row, subject to staleness rules (section 7) — placed after synopsis as quantitative evidence
8. **Capabilities** — new bullet list
9. **Tech Stack Tags** — new horizontal tag row
10. **AI Models Badge** — new, only if `aiModels` is non-null
11. **Links Footer** — existing

**Rationale for reorder:** Constitution Principle I says "The project overlay MUST display at least one real visual asset." Media is the highest-impact content for portfolio evaluation. Placing it at position 5 (immediately after badges) ensures it is visible without scrolling, especially on mobile. Metrics follow the synopsis to provide quantitative evidence that validates the qualitative description.

### 10.2 Metrics Bar Design

Compact horizontal row using `<dl>` with icon + number pairs:

```
[commit-icon] 471  [pr-icon] 133  [tag-icon] 13  [users-icon] 3  [clock-icon] 42d
```

- Uses JetBrains Mono font, inline SVG icons (~14px).
- **Text color:** `var(--color-text-primary)` (#e8d5a3, 8:1 contrast) for metric values. NOT brass — constitution prohibits brass for readable text.
- **Icon fill:** `var(--color-brass-light)` (decorative, `aria-hidden`).
- **Border color:** `var(--color-brass-mid)` (decorative rule lines).
- Each `<dt>` has `class="sr-only"` with the metric label for screen readers.
- Each `<dd>` shows the icon + formatted value.
- Icon SVGs use `aria-hidden="true"` and `focusable="false"`.
- The metrics bar `<dl>` contains NO interactive elements, links, or buttons. It does not participate in the focus trap.
- If staleness is 7-30 days, a `<span class="overlay__metrics-stale">` caption renders below: "Metrics from {formatted date}".

### 10.3 Tech Stack Tags

Horizontal flex-wrap row of small pill tags.
- **Text color:** `var(--color-text-primary)` (readable, not brass).
- **Border color:** `var(--color-brass-mid)` (decorative).
- Container has `role="list"` with `aria-label="Technology stack"`.
- Individual tags have no role, no interaction, no focus.

### 10.4 Badge Pills

- **Text color:** `var(--color-text-secondary)` (#a08858, 4.6:1 WCAG AA).
- **Border color:** `var(--color-brass-mid)` (decorative).
- Badges are decorative context — container has no ARIA role.

### 10.5 Mobile Synopsis Truncation

On viewports < 768px, synopsis text is truncated to 3 lines via CSS `-webkit-line-clamp`. A "read more" `<button>` expands it. Mobile detection uses `window.matchMedia('(max-width: 767px)').matches` (consistent with CSS breakpoints; avoids a third independent `innerWidth` check).

**Behavioral contract:**
- "Read more" toggles `aria-expanded` on itself and removes the clamp class.
- Expanded text grows the modal in place; scroll position is preserved.
- Button text changes to "read less" when expanded.
- Button meets 44x44px minimum touch target.
- On next modal open, expanded state resets (content is rebuilt in `showProjectPanel`, which clears `descZone.innerHTML` at the start of each open).
- Keyboard accessible: focusable, activates on Enter/Space.
- Screen reader announces: "read more, collapsed" / "read less, expanded".

### 10.6 Mobile Metrics Bar

On viewports < 768px, the metrics bar switches to a 3-column grid (2 rows). Same content, no truncation.

### 10.7 DOM Insertion Strategy

New sections (badges, synopsis, capabilities, tech stack, metrics bar, AI models) are dynamically created by builder functions in `panel-content.js` and inserted into the existing `.overlay__description-zone` container in order. This is consistent with the current pattern where `showProjectPanel` clears `descZone.innerHTML = ''` at the start of each open, then appends content.

No new static HTML containers are needed in `index.html`. The builder functions create elements and return them (or null). `panel.js` appends non-null results to `descZone` in the defined section order.

---

## 11. Accessibility Acceptance Criteria

Each criterion is testable in a keyboard-only + screen-reader pass:

| Criterion | Test |
|-----------|------|
| Every metric icon has `aria-hidden="true"` | Verify icons not announced by screen reader |
| Every metric value has a `<dt class="sr-only">` label | Screen reader announces "Commits: 471" not just "471" |
| Tech stack tags container has `aria-label="Technology stack"` | Screen reader announces context |
| Tech stack tags themselves are not focusable | Tab skips over them |
| "Read more" button has `aria-expanded` state | Screen reader announces collapsed/expanded |
| "Read more" activates on Enter and Space | Keyboard test |
| AI models section is informational, not interactive | No focus targets |
| Badge pills are decorative | Not announced individually; container has no role |
| Full modal keyboard-only pass works after enhancement | Tab through all new + existing elements; Escape closes |
| No new elements break existing focus trap | Focus cycles within modal boundary |
| All informational text meets WCAG AA (4.5:1 minimum) | Verify metric values, tech tags, badge text use verified text colors |
| `prefers-contrast: more` overrides exist for all new elements | High-contrast mode renders white text, white borders, no brass |

---

## 12. Verification Requirements

### 12.1 Synopsis Verification

Each synopsis was verified against README content, file tree structure, and key source files during the investigation phase. The machine-readable evidence is the per-repo investigation report at `scripts/repo-reports/<repoKey>.json`.

**Ongoing requirement:** When a synopsis is added or changed, the author MUST regenerate the investigation report (`python scripts/investigate-repo.py <owner/repo>`) and confirm the new text matches the report's README and file tree.

### 12.2 Metrics Verification

Metrics are machine-collected. The build script is the verification — if it succeeds, the numbers are what the GitHub API returned. The `generated_at` timestamp provides auditability.

### 12.3 Build Integrity Check

The build script MUST exit non-zero if:
1. Any manifest repo is unreachable or returns an API/GraphQL error (including null GraphQL responses).
2. Orphan validation fails. Validation is **mandatory on every run** — the script cross-checks its own manifest repoKeys against the generated output. The `--validate-keys` flag accepts an additional external key list for cross-checking against data.js, but the internal manifest check always runs.
3. Rate limit remaining < 100 at start.

---

## 13. Coney Island Data

### 13.1 Current State (Transitional)

The three Coney Island repos currently live under `oddessentials/` as archived originals with full git history. The build manifests in both `investigate-repo.py` and `build-metrics.py` point to:
- `oddessentials/coney-website`
- `oddessentials/yo-coney-bot`
- `oddessentials/yo-coney-mobile`

The `data.js` link URLs already point to `coneyislandpottsville/` (the target organization). These repos are being migrated and will start collecting new history under `coneyislandpottsville/` within the next couple weeks.

### 13.2 Migration Plan

When the repos are active under `coneyislandpottsville/`, update the manifest `repo` field in `build-metrics.py` and `investigate-repo.py`. The `repoKey` stays the same (it is decoupled from the GitHub slug). No changes to data.js or data-content.js are needed.

---

## 14. CSS Color Contract

All new modal elements MUST use WCAG-verified text colors from the existing `:root` palette. The plan's CSS MUST NOT reference nonexistent custom properties.

### 14.1 Color Mapping

| Element | Text Color | Border/Decorative Color |
|---------|-----------|------------------------|
| Badge pills | `--color-text-secondary` (#a08858, 4.6:1) | `--color-brass-mid` |
| Synopsis text | `--color-parchment` (#D4B896) | n/a |
| Capabilities list | `--color-text-primary` (#e8d5a3, 8:1) | `--color-brass-mid` (bullet) |
| Tech stack tags | `--color-text-primary` (#e8d5a3) | `--color-brass-mid` |
| Metric values | `--color-text-primary` (#e8d5a3) | n/a |
| Metric icons | n/a (decorative) | fill: `--color-brass-light` |
| Metrics bar borders | n/a | `--color-brass-mid` |
| AI models label | `--color-text-primary` (#e8d5a3) | n/a |
| AI models values | `--color-text-secondary` (#a08858) | n/a |
| Staleness caption | `--color-text-secondary` (#a08858) | n/a |

### 14.2 High Contrast Overrides

All new CSS classes MUST have `prefers-contrast: more` overrides:

```css
@media (prefers-contrast: more) {
  .overlay__badge,
  .overlay__tech-tag { border-color: #fff; color: #fff; }
  .overlay__synopsis { color: #fff; }
  .overlay__capabilities li { color: #fff; }
  .overlay__capabilities li::before { color: #fff; }
  .overlay__metric dd { color: #fff; }
  .overlay__metric-icon { fill: #fff; }
  .overlay__metrics { border-color: #fff; }
  .overlay__ai-models { color: #fff; }
  .overlay__ai-label { color: #fff; }
  .overlay__metrics-stale { color: #ccc; }
  .overlay__synopsis-toggle { color: #fff; }
}
```
