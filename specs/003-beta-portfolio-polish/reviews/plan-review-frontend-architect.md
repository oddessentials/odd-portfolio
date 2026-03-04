# Plan Review: Front-End Systems Architect

**Reviewer**: Front-End Systems Architect
**Artifact**: `specs/003-beta-portfolio-polish/plan.md`
**Date**: 2026-03-04

---

## Verdict: APPROVE WITH CONCERNS

The plan is well-structured and technically sound. All five review areas check out with minor issues. Two findings require attention before implementation begins — one is a genuine gap (missed constellation references), the other is a naming discrepancy between the plan and the earlier spec review.

---

## Issues Found

### Issue 1 (MEDIUM): Plan uses `#scan-line` / `.progress-track` but earlier review uses `.scan-line` / `.loading-bar`

**Location**: plan.md line 141 vs. frontend-architect.md section 2b

The plan (line 141) says:

> Replace static "scanning systems..." with `#scan-line` and `.progress-track` elements

But the earlier frontend-architect review (section 2b) proposed a different DOM structure:

- `.scan-output` container with 3 `.scan-line` paragraph elements (class, not ID)
- `.loading-bar` with `.loading-bar__fill` (not `.progress-track`)

The plan also references `#scan-line` as an ID. Using an ID for a scan line element is problematic because the review's DOM structure calls for 3 `.scan-line` elements — IDs must be unique. The plan and the review need to reconcile on consistent element naming. The review's naming (`.scan-line` class, `.loading-bar` with `role="progressbar"`) is the more thought-through version.

**Risk**: Implementors will encounter ambiguity between the two documents. Which naming convention wins?

**Recommendation**: Update plan.md line 141 to match the earlier review's DOM structure exactly. Use `.scan-line` (class, plural) and `.loading-bar` (not `.progress-track`). Remove the `#scan-line` ID reference.

---

### Issue 2 (LOW): `frame__rune-band` has 2 JS references in `animations.js` — plan doesn't list them

**Location**: plan.md line 146, `js/animations.js` lines 43 and 533

The plan says (line 146):

> Rename class from `frame__rune-band` to `frame__greek-key` (or keep class name, just update CSS)

The "(or keep class name)" hedge is insufficient. There are **4 total references** to `frame__rune-band`:

| File | Line | Reference |
|---|---|---|
| `index.html` | 73 | `<div class="frame__rune-band"></div>` |
| `css/styles.css` | 525 | `.frame__rune-band { ... }` |
| `js/animations.js` | 43 | `document.querySelector('.frame__rune-band')` |
| `js/animations.js` | 533 | `document.querySelector('.frame__rune-band')` |

The plan's change map for `js/animations.js` (line 165) does not mention updating these selectors. If the HTML class is renamed to `frame__greek-key`, both JS querySelector calls will return `null`, silently breaking the reveal animation (the rune band fade-in will be skipped).

**Risk**: The reveal animation will fail to animate the Greek key band. It won't crash — GSAP handles null targets gracefully — but the band will appear without its entrance animation.

**Recommendation**: Either (a) explicitly add the selector rename to the animations.js change map, or (b) decide to keep the class name as `frame__rune-band` in HTML/CSS and only change the visual pattern. Option (b) avoids a cross-file rename but leaves misleading naming. Option (a) is cleaner.

---

### Issue 3 (MEDIUM): Plan misses 3 additional constellation/fantasy references in `index.html`

**Location**: plan.md lines 147–151 (Brand Content section)

The plan's brand content section lists updating:
- `<title>` (line 149)
- OG meta tags (line 150)
- `.sr-only` text (line 151)

But **3 more constellation references** in `index.html` are NOT mentioned in the plan:

| Line | Current Text | Needs Update |
|---|---|---|
| 149 | `aria-label="Interactive constellation viewer. Use the constellation navigation to explore projects."` on `#orb-hitzone` | YES — change to "Interactive portfolio viewer. Use the project navigation to explore projects." |
| 151 | `alt="OddEssentials project constellation"` on `#orb-fallback` | YES — change to "OddEssentials portfolio projects" or similar |
| 10 | `og:description` content mentions "constellations" | Already flagged in plan line 150, but the plan doesn't specify the exact replacement text. The earlier review proposes: "Force multipliers for small businesses -- 7 open-source projects in an interactive starfield." |

The `#orb-hitzone` `aria-label` is particularly important because it is the primary accessible description for the entire starfield interaction area. Missing it would leave "constellation" language for screen reader users while sighted users see updated branding.

**Risk**: Screen reader users encounter inconsistent language. The `aria-label` on `#orb-hitzone` is read when a keyboard user focuses the starfield.

**Recommendation**: Add these 3 references to the plan's Brand Content section under index.html changes.

---

### Issue 4 (INFO): `CONSTELLATION_ZONES` in `data.js` still uses fantasy language

**Location**: `js/data.js` lines 141-166

The `CONSTELLATION_ZONES` array contains:
- Zone names: "Arcane Tools", "Intelligence Matrix", "Outpost Network"
- Status text: "scanning arcane tools constellation...", "interfacing with intelligence matrix...", "triangulating outpost network..."

Neither the plan nor the spec mentions updating these. The `statusText` values are displayed in the UI during scroll-triggered zone changes (visible in the status panel as the user scrolls). This is a scope question: if the spec explicitly limits Beta's text changes, this can wait for a future pass. But it should be documented as a known gap.

**Risk**: Low — these are secondary UI text strings that most users won't focus on. But they do conflict with the "no constellation/fantasy terminology" goal in SC-010.

**Recommendation**: Flag as a known gap for Beta 0.1.1, or add to scope if timeline permits.

---

## Detailed Validation Results

### 1. Sidebar HTML Restructure

**Button count**: Confirmed **7 buttons** in `index.html` (lines 87-128), one per `<li>`.

**`data-project-id` values match `data.js`**: All 7 match exactly:

| HTML `data-project-id` | `data.js` `id` | Match |
|---|---|---|
| `odd-ai-reviewers` | `odd-ai-reviewers` | YES |
| `ado-git-repo-insights` | `ado-git-repo-insights` | YES |
| `repo-standards` | `repo-standards` | YES |
| `odd-self-hosted-ci` | `odd-self-hosted-ci` | YES |
| `odd-map` | `odd-map` | YES |
| `odd-fintech` | `odd-fintech` | YES |
| `coney-island` | `coney-island` | YES |

**Plan's proposed structure** (`.project-label > .project-name + .project-desc`) matches the earlier review's recommendation. The plan correctly specifies replacing `.constellation-name` with this new structure. `.constellation-name` is referenced in:
- `index.html` (7 instances, lines 90-126)
- `css/styles.css` (1 rule, line 687)
- `js/` — **no JS references** (confirmed via grep)

Safe to rename/replace without JS breakage.

### 2. ARIA Changes

**`aria-describedby="project-hint"` removal**: Present on all 7 buttons (lines 88-124). The `#project-hint` element at line 214 contains: "Activate a project to open its detail panel. Press Escape to close."

**Impact of removal**: Safe. The plan replaces the external description reference with an inline `.project-desc` span inside each button. Screen readers will read the button's full content (glyph + name + description) as the accessible name. The generic `#project-hint` text is supplementary, not critical.

**`#project-hint` used elsewhere**: Only referenced by the 7 `aria-describedby` attributes. No JS references. No CSS styling beyond `.sr-only`. After removing the `aria-describedby` attributes, `#project-hint` becomes orphaned but harmless. The earlier review correctly notes it can be kept for the overlay modal instructions, though currently no element references it for that purpose.

**Recommendation**: Keep `#project-hint` in the DOM — it provides useful context if a future `aria-describedby` is added to the overlay trigger. No action needed.

### 3. Status Panel Restructure

**ID conflicts**: No existing elements use `#scan-line` or `.progress-track` (confirmed via grep of all JS/HTML/CSS files). However, as noted in Issue 1, the naming between plan and earlier review is inconsistent.

**`role="progressbar"` placement**: The plan places it on the progress container (line 141). The earlier review places it on `.loading-bar`. Both are semantically correct per WAI-ARIA. The `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` is the proper pattern for a determinate progress indicator. Placement on the immediate container of the visual fill bar is correct.

**`aria-live` nesting**: The plan adds `aria-live="polite"` and `aria-relevant="additions text"` to the scan output (line 141). The earlier review correctly flags that the `<aside id="status-panel">` currently has `aria-live="polite"` (line 133). This creates nested live regions — the plan should remove `aria-live="polite"` from the `<aside>` and apply it only to `.status-readout` via `role="status"` (which implies `aria-live="polite"`). The plan doesn't explicitly mention removing the `aria-live` from the `<aside>`, but the earlier review does. This should be added to the plan.

### 4. Responsive CSS Fixes

**Redundant grid rule**: Confirmed. Two rules apply at 768-1199px:

- Line 1113-1115: `@media (max-width: 1199px)` sets `grid-template-columns: 160px 1fr 160px`
- Lines 1229-1233: `@media (min-width: 768px) and (max-width: 1199px)` sets `grid-template-columns: clamp(140px, 15vw, 180px) 1fr clamp(140px, 15vw, 180px)`

Due to cascade order, the clamp rule (later in file) wins at 768-1199px. The `160px` rule at line 1113 only affects 0-767px, where it's overridden by the mobile `1fr` rule at line 1140. So the line 1113 rule is truly dead code — it never applies at any viewport width.

**Removing line 1113 `grid-template-columns`**: Safe. It is shadowed at every applicable width. Removing it from the `max-width: 1199px` block will not break tablet layout. The `clamp()` rule at 1229-1233 handles tablet, and the `1fr` rule at 1140 handles mobile.

**Note**: Other rules in the `max-width: 1199px` block (lines 1107-1129: `--hud-panel-width`, `--frame-corner-size`, `--frame-border-width`, gauge sizing) must remain — only the `grid-template-columns` line should be removed.

### 5. CSS Class Rename (`frame__rune-band` to `frame__greek-key`)

All references found:

| File | Line | Type |
|---|---|---|
| `index.html` | 73 | HTML class |
| `css/styles.css` | 525 | CSS selector |
| `js/animations.js` | 43 | JS querySelector |
| `js/animations.js` | 533 | JS querySelector |

The plan's change map for `js/animations.js` (line 165) only mentions: "Terminal scan timeline, discoverability text, brand messaging." It does **not** mention updating the `.frame__rune-band` selectors. This is the gap documented in Issue 2 above.

### 6. Screen Reader Content — Constellation/Fantasy Terminology Audit

Full audit of all `.sr-only` and accessibility-facing text in `index.html`:

| Line | Element | Text | Contains Fantasy? | Plan Addresses? |
|---|---|---|---|---|
| 10 | `og:description` | "...visualized as constellations..." | YES | YES (line 150) |
| 84 | `aria-label` on nav | "Project constellations" | YES | YES (line 134) |
| 85 | `.hud-label` | "CONSTELLATION INDEX" | YES | YES (line 133) |
| 149 | `aria-label` on `#orb-hitzone` | "Interactive constellation viewer. Use the constellation navigation..." | YES | **NO** |
| 151 | `alt` on `#orb-fallback` | "OddEssentials project constellation" | YES | **NO** |
| 152 | `.sr-only` paragraph | "...Use the constellation navigation..." | YES | YES (line 151) |
| 180 | `.sr-only` heading | "Portfolio Projects" | NO | N/A |

Two references are missed by the plan (documented in Issue 3).

Additionally, `CONSTELLATION_ZONES` in `data.js` contains fantasy text in `statusText` fields that are displayed in the UI (documented in Issue 4).

---

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Naming inconsistency between plan and review (scan-line/progress-track vs. scan-line/loading-bar) | Medium | Reconcile before implementation; use review's naming |
| JS querySelector breakage if class renamed without updating animations.js | Medium | Add animations.js selector updates to plan's change map |
| Missed constellation references in aria-labels | Medium | Add to plan's Brand Content section |
| CONSTELLATION_ZONES fantasy text in data.js | Low | Document as known gap, address in 0.1.1 |
| Nested aria-live regions (aside + status readout) | Low | Remove aria-live from aside per earlier review |

---

## Recommendations

1. **Reconcile DOM naming** between plan.md and the earlier frontend-architect review. The review's naming (`.scan-line` class, `.loading-bar`, `.loading-bar__fill`) is more considered — adopt it and update plan.md accordingly.

2. **Add `js/animations.js` selector updates** to the plan's change map. Either rename `.frame__rune-band` to `.frame__greek-key` in both querySelector calls (lines 43 and 533), or decide to keep the original class name and only change the CSS visual.

3. **Add missed `aria-label` updates** to the plan: `#orb-hitzone` aria-label (line 149), `#orb-fallback` alt text (line 151).

4. **Explicitly state** in the plan that `aria-live="polite"` should be removed from the `<aside id="status-panel">` to avoid nested live region double-announcements.

5. **Document** `CONSTELLATION_ZONES.statusText` as a known Beta 0.1.0 gap in the plan's Complexity Tracking table.
