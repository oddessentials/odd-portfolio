# 014 — Portfolio Modal Enhancement: Implementation Plan

**Date:** 2026-03-07 (v2 — post team review)
**Depends on:** spec.md (this directory)

---

## Phase 1: Build-Time Data Pipeline

### 1.1 Fix `generated_at` Timestamp Format

The `generated_at` timestamp MUST be UTC, truncated to seconds, with `Z` suffix. Replace Python's `datetime.now(timezone.utc).isoformat()` (which produces microseconds and `+00:00`) with:

```python
datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
```

This ensures `Date.parse()` compatibility across all browsers including Safari.

### 1.2 Fix GraphQL Null Propagation

In `get_pr_and_issue_counts()`, if the GraphQL query returns a null repository (permission error, repo not found), the function currently silently returns `(0, 0)`. Fix: detect null response and return a sentinel (e.g., `(None, None)`) so `collect_repo_metrics()` can fail the repo.

### 1.3 Fix `repo_lifetime_days` Fallback

The `calculate_activity_score()` function uses `m.get("repo_lifetime_days", 0) or m.get("dev_duration_days", 0)`. The `or` operator treats `0` as falsy, conflating zero-day lifetime with missing data. Fix:

```python
lifetime = m.get("repo_lifetime_days")
if lifetime is None:
    lifetime = m.get("dev_duration_days", 0)
```

### 1.4 Make Validation Mandatory

Remove the opt-in `--validate-keys` flag for internal validation. The script MUST always cross-check its own manifest repoKeys against the generated output. The `--validate-keys` flag remains available for external cross-checking against data.js keys, but internal consistency is always enforced.

### 1.5 `repo-metrics.json` Lifecycle

- **Generated** by `python scripts/build-metrics.py`.
- **Committed** to `assets/repo-metrics.json` after review.
- **Deployed** as a static asset alongside `index.html`.
- Regenerated manually or on schedule, diffed, committed.
- `scripts/repo-reports/` stays gitignored (investigation artifacts only).

**Files:**
- Modify `scripts/build-metrics.py` (timestamp, GraphQL error propagation, lifetime fallback, mandatory validation)
- `assets/repo-metrics.json` — regenerate after script fixes

---

## Phase 2: Data Model Enhancement

### 2.1 Add `repoKey` and `starSizeOverride` to `data.js`

For each project in `PROJECTS`, add two fields:

```js
{
  // ... existing fields ...
  repoKey: "odd-ai-reviewers",  // REQUIRED — must match repo-metrics.json key
  starSizeOverride: null,       // number or null
}
```

Special cases:
- `experiments-cluster`: `repoKey: null` (isCluster: true)
- `dead-rock-cluster`: `repoKey: null` (isCluster: true, paused)
- `coney-island`: `repoKey: null` (parent-with-children, see spec 2.2)
- `odd-self-hosted-ci`: `repoKey: "odd-self-hosted-ci-runtime"` (repoKey differs from id)

For cluster members that have individual repos, add optional `repoKey`:

```js
clusterMembers: [
  {
    name: "coney-website",
    description: "Restaurant website",
    url: "https://github.com/coneyislandpottsville/coney-website",
    status: "active",
    repoKey: "coney-website",  // NEW — optional
  },
]
```

### 2.2 Create `js/data-content.js`

New file (~200 lines) containing authored content keyed by repoKey:

```js
// js/data-content.js — Authored modal content (synopses, capabilities, tech stacks)
// Keyed by repoKey. Source of truth: spec section 3.

export const PROJECT_CONTENT = {
  "odd-ai-reviewers": {
    synopsis: "Extensible AI code review pipeline for pull requests...",
    capabilities: [
      "Multi-pass review pipeline: static analysis then AI semantic review",
      "Pluggable agent architecture: Semgrep, Reviewdog, OpenCode, PR-Agent",
      "Four AI provider support: OpenAI, Anthropic, Azure OpenAI, Ollama",
      "Per-PR and monthly budget limits with automatic enforcement",
      "Published on npm as @oddessentials/odd-ai-reviewers",
    ],
    techStack: ["TypeScript", "Node.js", "Semgrep"],
    aiModels: ["OpenAI GPT-4o", "Anthropic Claude Sonnet"],
  },
  // ... all 15 repos ...
};
```

### 2.3 Paused Projects

The `dead-rock-cluster` keeps `repoKey: null` and no metrics. Star size uses the existing `starSize` value.

**Files:**
- Modify `js/data.js` (~22 lines added: repoKey + starSizeOverride per project)
- Create `js/data-content.js` (~200 lines: all synopses, capabilities, techStack, aiModels)

---

## Phase 3: Frontend Metrics Loading

### 3.1 Fetch in app.js Init

Fetch `repo-metrics.json` once during `app.js` init, before scene star creation:

```js
let repoMetrics = { repos: {} };
try {
  const res = await fetch('assets/repo-metrics.json');
  if (res.ok) repoMetrics = await res.json();
} catch (e) {
  console.warn('Failed to load repo-metrics.json:', e);
}
```

This requires converting `app.js` to use top-level await. Since `app.js` is the entry module (loaded via `<script type="module">`), no other module imports from it, so there is no module-graph blocking concern.

The fetch is inserted before `initScene()` (currently line 288). The reveal sequence is not delayed because:
- The fetch targets a local committed asset (same-origin, cached by browser after first load).
- On cold load, the fetch adds ~10-50ms (local file, no API call).

### 3.2 Pass via Dependency Injection

Pass `repoMetrics` to modules that need it:

```js
// In app.js init:
initPanel({ repoMetrics });  // panel uses it for metrics bar

// In initScene() or createStarNodes():
// repoMetrics passed for star sizing (see Phase 6)
```

### 3.3 Staleness Check

```js
function getMetricsStaleness(data) {
  if (!data || !data.generated_at) return 'suppress';
  const days = (Date.now() - Date.parse(data.generated_at)) / 86400000;
  if (days > 30) return 'suppress';
  if (days > 7) return 'stale';
  return 'fresh';
}
```

- `'fresh'` — render metrics bar normally.
- `'stale'` — render metrics bar + date caption below.
- `'suppress'` — hide metrics bar entirely.

### 3.4 Merge at Render Time

```js
const repoKey = project.repoKey;
const metricsData = repoKey ? repoMetrics?.repos?.[repoKey] : null;
const staleness = getMetricsStaleness(repoMetrics);
// Render metrics bar only if metricsData exists AND staleness !== 'suppress'
```

**Files:**
- Modify `js/app.js` (add fetch + DI passing, ~10 lines)
- Modify `js/panel.js` (receive repoMetrics via init, ~5 lines)

---

## Phase 4: Modal UI Enhancement

### 4.1 Extract `panel-content.js`

`panel.js` is 419 lines. Extract new rendering into a new module:

**`js/panel-content.js`** (~150 lines) exports:
- `buildBadges(project)` -> HTMLElement | null
- `buildSynopsis(project, isMobile)` -> HTMLElement | null
- `buildCapabilities(project)` -> HTMLElement | null
- `buildTechStack(project)` -> HTMLElement | null
- `buildMetricsBar(metrics, staleness)` -> HTMLElement | null
- `buildAiModels(project)` -> HTMLElement | null
- `getMetricsStaleness(data)` -> 'fresh' | 'stale' | 'suppress'

Each function returns `null` if the data is absent. `panel.js` calls them and appends non-null results to `.overlay__description-zone`.

`panel-content.js` imports `PROJECT_CONTENT` from `data-content.js` and looks up authored content by `project.repoKey` (or `project.id` as fallback for projects without a repoKey).

### 4.2 Synopsis Truncation (Mobile)

Mobile detection uses `window.matchMedia('(max-width: 767px)').matches`:

```js
function buildSynopsis(project, isMobile) {
  const content = PROJECT_CONTENT[project.repoKey] || PROJECT_CONTENT[project.id];
  if (!content?.synopsis) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'overlay__synopsis-wrapper';

  const p = document.createElement('p');
  p.className = 'overlay__synopsis';
  p.textContent = content.synopsis;
  wrapper.appendChild(p);

  if (isMobile) {
    p.classList.add('overlay__synopsis--clamped');
    const btn = document.createElement('button');
    btn.className = 'overlay__synopsis-toggle';
    btn.textContent = 'read more';
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const isClamped = p.classList.toggle('overlay__synopsis--clamped');
      btn.textContent = isClamped ? 'read more' : 'read less';
      btn.setAttribute('aria-expanded', String(!isClamped));
    });
    wrapper.appendChild(btn);
  }
  return wrapper;
}
```

Content is rebuilt on each `showProjectPanel` call (descZone.innerHTML = '' at line 131), so expanded state resets naturally on next open.

### 4.3 SVG Icon Sprite

Add a hidden SVG sprite to `index.html`:

```html
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <symbol id="icon-commit" viewBox="0 0 16 16"><!-- git commit --></symbol>
  <symbol id="icon-pr" viewBox="0 0 16 16"><!-- git pull request --></symbol>
  <symbol id="icon-tag" viewBox="0 0 16 16"><!-- tag --></symbol>
  <symbol id="icon-users" viewBox="0 0 16 16"><!-- people --></symbol>
  <symbol id="icon-clock" viewBox="0 0 16 16"><!-- clock --></symbol>
</svg>
```

Each icon: `aria-hidden="true"`, `focusable="false"`. ~1KB total.

**Files:**
- Create `js/panel-content.js` (~150 lines)
- Modify `js/panel.js` (import panel-content, call builders, ~15 lines net change)
- Modify `index.html` (SVG sprite, ~15 lines)

---

## Phase 5: CSS Styling

### 5.1 New CSS Rules

Add to `css/styles.css` section 12 (overlay), after existing rules (~line 1554).

**IMPORTANT:** All text colors use WCAG-verified tokens from `:root`. No brass colors on readable text.

```css
/* Badges */
.overlay__badges { display: flex; gap: 8px; margin-bottom: var(--space-sm); flex-wrap: wrap; }
.overlay__badge {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  padding: 2px 10px;
  border: 1px solid var(--color-brass-mid);
  border-radius: 3px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Synopsis */
.overlay__synopsis {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--color-parchment);
  margin-bottom: var(--space-md);
}
.overlay__synopsis--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.overlay__synopsis-toggle {
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  cursor: pointer;
  padding: 4px 0;
  min-height: 44px;
  min-width: 44px;
  text-decoration: underline;
}

/* Capabilities */
.overlay__capabilities {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-md);
}
.overlay__capabilities li {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text-primary);
  padding-left: 16px;
  position: relative;
  margin-bottom: 4px;
}
.overlay__capabilities li::before {
  content: '\25C6';
  position: absolute;
  left: 0;
  color: var(--color-brass-mid);
  font-size: 8px;
  top: 5px;
}

/* Tech Stack Tags */
.overlay__tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--space-md);
}
.overlay__tech-tag {
  display: inline-block;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  border: 1px solid var(--color-brass-mid);
  border-radius: 3px;
  color: var(--color-text-primary);
  background: transparent;
}

/* Metrics Bar */
.overlay__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: var(--space-md);
  padding: var(--space-sm) 0;
  border-top: 1px solid var(--color-brass-mid);
  border-bottom: 1px solid var(--color-brass-mid);
}
.overlay__metric { display: flex; align-items: center; gap: 4px; }
.overlay__metric dd {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.overlay__metric-icon {
  width: 14px;
  height: 14px;
  fill: var(--color-brass-light);
}
.overlay__metrics-stale {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: 4px;
  font-style: italic;
}

/* AI Models */
.overlay__ai-models {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}
.overlay__ai-label {
  color: var(--color-text-primary);
  font-weight: 600;
}
```

### 5.2 Mobile Overrides

Inside `@media (max-width: 767px)` (~line 1717):

```css
.overlay__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.overlay__capabilities li { font-size: var(--text-xs); }
```

### 5.3 High Contrast Overrides

Inside `@media (prefers-contrast: more)` (~line 1849):

```css
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
```

**Files:**
- Modify `css/styles.css` (new rules + mobile overrides + high contrast overrides)

---

## Phase 6: Planet Tier Integration

### 6.1 Dynamic Star Sizing

Star sizes are consumed in `textures.js` `createStarNodes()` at line 206 (`project.starSize * 0.25`). The effective star size is computed there, NOT in scene.js:

```js
// In textures.js createStarNodes(), receive repoMetrics as parameter:
const metricsEntry = repoMetrics?.repos?.[project.repoKey];
const effectiveStarSize = project.starSizeOverride
  ?? metricsEntry?.calculated_star_size
  ?? project.starSize;
const scale = effectiveStarSize * 0.25;
```

### 6.2 Passing repoMetrics to textures.js

`app.js` fetches `repoMetrics` at init (Phase 3). It passes the data to `initScene()`, which passes it to `createStarNodes(PROJECTS, repoMetrics)`. The `createStarNodes` function signature gains a second parameter.

**Files:**
- Modify `js/textures.js` (add repoMetrics parameter, compute effective star size, ~5 lines changed)
- Modify `js/scene.js` (pass repoMetrics through to createStarNodes, ~2 lines changed)

---

## Implementation Order

| Step | Phase | Files Modified | Change |
|------|-------|---------------|--------|
| 1 | Pipeline | `scripts/build-metrics.py` | Timestamp format, GraphQL error propagation, lifetime fallback, mandatory validation |
| 2 | Pipeline | `assets/repo-metrics.json` | Regenerate after script fixes |
| 3 | Data | `js/data.js` | Add repoKey + starSizeOverride per project (~22 lines) |
| 4 | Data | `js/data-content.js` (new) | All synopses, capabilities, techStack, aiModels |
| 5 | Frontend | `js/panel-content.js` (new) | Builder functions for new modal sections + staleness check |
| 6 | Frontend | `js/panel.js` | Import panel-content, call builders, receive repoMetrics via DI |
| 7 | Frontend | `js/app.js` | Fetch repo-metrics.json at init, pass via DI |
| 8 | Scene | `js/textures.js` | Accept repoMetrics, compute effective star size |
| 9 | Scene | `js/scene.js` | Pass repoMetrics through to createStarNodes |
| 10 | CSS | `css/styles.css` | New overlay styles + mobile overrides + high contrast overrides |
| 11 | HTML | `index.html` | SVG icon sprite |
| 12 | Constitution | `.specify/memory/constitution.md` | v1.6.0 amendment for new data fields |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitHub API error on any repo | Build fails | Script exits non-zero; operator fixes before committing |
| Rate limit exhaustion | Build fails | Pre-flight check; abort if < 100 remaining |
| PR/issue count exceeds gh list limit | Undercounted metrics | GraphQL totalCount (no pagination needed) |
| Stale committed metrics | Misleading display | Staleness rules suppress after 30 days |
| panel.js over 400 lines | Constitution violation | panel-content.js + staleness extraction keeps panel.js under limit |
| data.js over 500 lines | File bloat | data-content.js extraction; data.js gains only ~22 lines |
| Repo slug migration (Coney) | Manifest out of date | repoKey decoupled from slug; only manifest changes |
| Star sizes shift unexpectedly | Visual regression | Fixed thresholds; starSizeOverride for manual control; transition plan in spec 6.4 |
| techStack/aiModels free-text drift | Inconsistent display | Canonical token schema in spec; review-time enforcement |
| `generated_at` format breaks Date.parse | Staleness check fails | Truncated seconds, Z suffix, tested cross-browser |
| CSS brass on readable text | WCAG violation | All text uses verified --color-text-* tokens; brass only on decorative borders/icons |
| Missing high-contrast overrides | Constitution violation | Explicit prefers-contrast rules for every new class |
| app.js top-level await delays reveal | Slow startup | Local asset fetch adds ~10-50ms; no external API call |
