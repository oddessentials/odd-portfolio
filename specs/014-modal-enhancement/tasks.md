# Tasks: 014 — Portfolio Modal Enhancement

**Input**: Design documents from `/specs/014-modal-enhancement/`
**Prerequisites**: spec.md (v4), plan.md (v2)
**Tests**: Not requested — no test tasks generated.
**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Constitution amendment and project structure verification.

- [x] T001 Verify constitution amendment in `.specify/memory/constitution.md` — confirm v1.6.0 with 014 data field additions (repoKey, starSizeOverride, data-content.js)
- [x] T002 [P] Verify `.gitignore` includes `scripts/repo-reports/`

**Checkpoint**: Constitution amended, gitignore correct.

---

## Phase 2: Foundational (Build Pipeline Fixes)

**Purpose**: Fix build-metrics.py bugs identified in team review. MUST complete before any frontend work since repo-metrics.json is consumed downstream.

- [x] T003 Fix `generated_at` timestamp format in `scripts/build-metrics.py` — replace `datetime.now(timezone.utc).isoformat()` with `.strftime('%Y-%m-%dT%H:%M:%SZ')` for Safari Date.parse compatibility (plan 1.1)
- [x] T004 Fix GraphQL null propagation in `scripts/build-metrics.py` `get_pr_and_issue_counts()` — return `(None, None)` instead of `(0, 0)` on null repository response; add None check in `collect_repo_metrics()` to fail the repo (plan 1.2)
- [x] T005 Fix `repo_lifetime_days` fallback in `scripts/build-metrics.py` `calculate_activity_score()` — replace `or` operator with explicit `None` check so 0-day lifetime is not conflated with missing data (plan 1.3)
- [x] T006 Make validation mandatory in `scripts/build-metrics.py` `main()` — add internal manifest key cross-check that always runs before the optional `--validate-keys` external check (plan 1.4)
- [x] T007 Regenerate `assets/repo-metrics.json` by running `python scripts/build-metrics.py` — verify output has corrected timestamp format, confirm all 15 repos collected successfully

**Checkpoint**: `build-metrics.py` passes all integrity checks. `repo-metrics.json` has `Z`-suffix timestamp, correct tier calculations. Pipeline is deterministic and mandatory-validated.

---

## Phase 3: US1 — Data Model Enhancement (Priority: P1)

**Goal**: Add `repoKey` and `starSizeOverride` to every project in data.js. Create `data-content.js` with all authored synopses, capabilities, techStack, and aiModels.

**Independent Test**: Import both modules in browser console; verify `PROJECTS[0].repoKey` matches a key in `PROJECT_CONTENT`; verify no project has undefined repoKey.

### Implementation for US1

- [x] T008 [P] [US1] Add `repoKey` field to every project entry in `js/data.js` — use the canonical identifier registry (spec section 2): null for clusters (experiments-cluster, dead-rock-cluster) and parent-with-children (coney-island); string matching repo-metrics.json key for all others. Note: odd-self-hosted-ci gets `repoKey: "odd-self-hosted-ci-runtime"` (differs from id)
- [x] T009 [P] [US1] Add `starSizeOverride: null` field to every project entry in `js/data.js` — all projects start with null (computed tiers take effect)
- [x] T010 [P] [US1] Add optional `repoKey` field to cluster members that have individual repos in `js/data.js` — add `repoKey: "coney-website"`, `repoKey: "yo-coney-bot"`, `repoKey: "yo-coney-mobile"` to coney-island clusterMembers; add `repoKey: "oddessentials-splash"`, `repoKey: "odd-portfolio"`, `repoKey: "oddessentials-platform"`, `repoKey: "odd-demonstration"` to experiments-cluster clusterMembers
- [x] T011 [US1] Create `js/data-content.js` with all 15 repo authored content entries — export `PROJECT_CONTENT` object keyed by repoKey; each entry has: synopsis (string), capabilities (string[]), techStack (string[]), aiModels (string[] or null). Source: spec section 3 synopses. Use canonical tokens from spec section 4.5. Estimated ~200 lines.

**Checkpoint**: `data.js` has repoKey + starSizeOverride on all 11 projects. `data-content.js` exports PROJECT_CONTENT with 15 keyed entries. Both modules load without errors.

---

## Phase 4: US2 — Enhanced Modal Content (Priority: P2)

**Goal**: Modal panels display synopsis, capabilities, tech stack, AI models, metrics bar, and badges for all projects. Metrics loaded once at init, shared via DI.

**Independent Test**: Click any project star — modal shows synopsis text, capability bullets, tech tags, and metrics bar (if fresh). Click a cluster star — no metrics bar. Resize to mobile — synopsis truncates with "read more" button. Enable `prefers-contrast: more` — all new text is white on black.

**Depends on**: US1 (data-content.js must exist), Phase 2 (repo-metrics.json must be regenerated)

### Implementation for US2

- [x] T012 [US2] Add `repo-metrics.json` fetch to `js/app.js` init — insert `await fetch('assets/repo-metrics.json')` before `initScene()` call (~line 288); store result in `repoMetrics` variable; pass to `initPanel({ repoMetrics })`. On fetch failure, default to `{ repos: {} }` with `console.warn`, no retry (plan 3.1). This requires converting app.js to use top-level await. (plan 3.1, 3.2)
- [x] T013 [US2] Update `js/panel.js` `initPanel()` to accept `{ repoMetrics }` parameter — store as module-level variable; make available to `showProjectPanel()` for metrics bar rendering (plan 3.2)
- [x] T014 [P] [US2] Create `js/panel-content.js` (~150 lines) — import `PROJECT_CONTENT` from `data-content.js`; export 7 functions: `buildBadges(project)`, `buildSynopsis(project, isMobile)`, `buildCapabilities(project)`, `buildTechStack(project)`, `buildMetricsBar(metrics, staleness)`, `buildAiModels(project)`, `getMetricsStaleness(data)`. Each builder returns HTMLElement or null. Use `window.matchMedia('(max-width: 767px)').matches` for isMobile detection. Synopsis toggle uses `isClamped` variable name (not `expanded`). Content lookup: `PROJECT_CONTENT[project.repoKey] || PROJECT_CONTENT[project.id]`. (plan 4.1, 4.2, 3.3)
- [x] T015 [US2] Integrate panel-content.js builders into `js/panel.js` `showProjectPanel()` — after existing `descZone.innerHTML = ''` (line 131), insert new content following spec 10.1 visual order: buildBadges (append to descZone), then media zone (existing, position 5), then buildSynopsis, buildMetricsBar (with repoMetrics lookup and staleness check), buildCapabilities, buildTechStack, buildAiModels (all appended to descZone after media). Each builder returns null if data absent; only append non-null results. Section order: badges → media (existing, position 5) → synopsis → metrics bar → capabilities → tech stack → AI models. (plan 4.1, spec 10.1)
- [x] T016 [P] [US2] Add SVG icon sprite to `index.html` — insert hidden `<svg aria-hidden="true" style="display:none">` block with 5 symbols: icon-commit, icon-pr, icon-tag, icon-users, icon-clock. Use Octicon-style 16x16 paths. Place before closing `</body>`. (plan 4.3)
- [x] T017 [P] [US2] Add new overlay component CSS rules to `css/styles.css` section 12 (~line 1554) — badges, synopsis, synopsis-clamped, synopsis-toggle, capabilities, tech-stack, tech-tag, metrics bar, metric, metric-icon, metrics-stale, ai-models, ai-label. ALL text colors use WCAG-verified tokens (--color-text-primary for readable text, --color-text-secondary for secondary, --color-parchment for synopsis). Brass colors ONLY on decorative borders and icon fills. (plan 5.1, spec 14.1)
- [x] T018 [P] [US2] Add mobile overrides to `css/styles.css` inside `@media (max-width: 767px)` (~line 1717) — .overlay__metrics grid 3-column layout, .overlay__capabilities smaller font size (plan 5.2)
- [x] T019 [P] [US2] Add high-contrast overrides to `css/styles.css` inside `@media (prefers-contrast: more)` (~line 1849) — all new overlay classes get white text, white borders, white icon fills per spec section 14.2 (plan 5.3)

**Checkpoint**: All project modals display enhanced content. Metrics bar shows for standard projects with fresh metrics, hidden for clusters/paused. Synopsis truncates on mobile with working "read more" toggle. High-contrast mode renders correctly. No WCAG violations in new elements.

---

## Phase 5: US3 — Planet Tier Star Sizing (Priority: P3)

**Goal**: Star sizes in the 3D scene are driven by computed metrics tiers instead of manual values. Override mechanism available via `starSizeOverride`.

**Independent Test**: Compare star sizes before and after: `ado-git-repo-insights` should be the largest star (giant tier, 2.33). `odd-ai-reviewers` should be major (1.44). Clusters and paused projects retain their manual `starSize` values.

**Depends on**: US2 (repoMetrics must be fetched in app.js)

### Implementation for US3

- [x] T020 [US3] Modify `js/textures.js` `createStarNodes()` to accept `repoMetrics` as second parameter — compute effective star size per project: `project.starSizeOverride ?? repoMetrics?.repos?.[project.repoKey]?.calculated_star_size ?? project.starSize`. Replace `project.starSize` usage at ~line 206 and ~line 281 with computed value. (plan 6.1)
- [x] T021 [US3] Modify `js/scene.js` `initScene()` to pass `repoMetrics` to `createStarNodes(PROJECTS, repoMetrics)` — receive repoMetrics from app.js via the existing module init pattern. (plan 6.2)
- [x] T022 [US3] Pass `repoMetrics` from `js/app.js` to scene.js — ensure the fetched metrics data flows through `initScene()` to `createStarNodes()`. Update the `initScene` call (~line 288) to pass repoMetrics. (plan 6.2)

**Checkpoint**: Stars render at computed tier sizes. Verify against spec section 6.4 visual transition table: ado-git-repo-insights is giant (2.33), odd-ai-reviewers is major (1.44), odd-fintech is standard (1.0). Clusters retain manual sizes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility verification, final cleanup, and documentation.

- [x] T023 Verify keyboard-only modal navigation — tab through all new elements (badges, synopsis, "read more" button, tech tags skipped, metrics bar non-interactive, links); Escape closes; focus trap cycles correctly
- [x] T024 Verify screen reader announces metrics correctly — each metric has `<dt class="sr-only">` label; icons are `aria-hidden`; tech stack container has `aria-label="Technology stack"`
- [x] T025 Verify `prefers-reduced-motion` does not break new elements — new content sections are static (no animations added), "read more" toggle is instant
- [x] T026 Verify empty state and parent-with-children — open a modal for a project with minimal data (e.g., yo-coney-mobile with only synopsis and 1 capability); confirm no empty wrapper divs render, modal looks clean. Also open the coney-island modal; confirm Related Repositories section renders (existing behavior), metrics bar is hidden (repoKey is null), and no empty new sections appear
- [x] T027 Verify staleness behavior — temporarily edit `generated_at` in `assets/repo-metrics.json` to 8+ days ago; confirm "Metrics from {date}" caption appears; edit to 31+ days ago; confirm metrics bar is suppressed entirely
- [x] T028 [P] Verify `panel.js` line count stays under 420 lines after all changes (panel-content.js extraction should keep it under limit)
- [x] T029 [P] Verify `panel-content.js` line count stays under 200 lines
- [x] T030 [P] Verify `data-content.js` line count stays under 250 lines

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verification only (already done in this session)
- **Foundational (Phase 2)**: No dependencies — pipeline fixes are independent
- **US1 (Phase 3)**: No dependencies on Phase 2 (data.js changes are structural, not dependent on pipeline output)
- **US2 (Phase 4)**: Depends on US1 (needs data-content.js) AND Phase 2 (needs corrected repo-metrics.json)
- **US3 (Phase 5)**: Depends on US2 (needs repoMetrics fetch in app.js)
- **Polish (Phase 6)**: Depends on all prior phases

### User Story Dependencies

- **US1 (Data Model)**: Can start after Phase 1 — independent of pipeline
- **US2 (Modal Content)**: Depends on US1 + Phase 2 completion
- **US3 (Star Sizing)**: Depends on US2 (shares the app.js metrics fetch)

### Within Each User Story

- Models/data before UI rendering
- Builder functions (panel-content.js) before integration (panel.js)
- CSS in parallel with JS (different files)
- HTML sprite in parallel with JS (different files)

### Parallel Opportunities

- T008, T009, T010 can run in parallel (all edit data.js but different sections)
- T014, T016, T017, T018, T019 can run in parallel (all different files)
- T023-T030 (polish) can run in parallel (all verification, no writes)
- Phase 2 and US1 (Phase 3) can run in parallel (pipeline fixes vs data.js edits)

---

## Parallel Example: US2

```bash
# These tasks touch different files and can run in parallel:
T014: Create js/panel-content.js
T016: Add SVG sprite to index.html
T017: Add overlay CSS to css/styles.css
T018: Add mobile CSS overrides to css/styles.css  # (same file as T017, run after)
T019: Add high-contrast CSS overrides to css/styles.css  # (same file as T017, run after)

# Sequencing within css/styles.css: T017 → T018 → T019 (same file)
# T014 and T016 are fully parallel with each other and with T017
```

---

## Implementation Strategy

### MVP First (US1 + Phase 2 Only)

1. Complete Phase 1: Setup (verification)
2. Complete Phase 2: Pipeline fixes
3. Complete Phase 3: US1 — Data Model Enhancement
4. **STOP and VALIDATE**: data.js loads, data-content.js loads, repo-metrics.json is correct
5. Everything downstream depends on these being right

### Incremental Delivery

1. Pipeline fixes + Data Model (Phase 2 + US1) -> Data foundation ready
2. Add Modal Content (US2) -> Test modals independently -> Visible feature complete
3. Add Star Sizing (US3) -> Test star sizes -> Full feature complete
4. Polish pass (Phase 6) -> Accessibility verified -> Ready to merge

### Single Developer Strategy

Recommended execution order (optimized for single developer):

1. T001-T002 (setup verification)
2. T003-T007 (pipeline fixes + regenerate)
3. T008-T011 (data model — can interleave with step 2)
4. T014, T016 in parallel; then T017-T019 sequentially (CSS same file)
5. T012-T013 (app.js + panel.js DI wiring)
6. T015 (integrate builders into panel.js)
7. T020-T022 (star sizing)
8. T023-T030 (polish verification)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested in spec)
- Constitution amendment already applied in this session (T001 is verification only)
- Pipeline fixes (Phase 2) are bug fixes to existing code, not new features
- data-content.js is a new file (~200 lines) — all content sourced from spec section 3
- panel-content.js is a new file (~150 lines) — extracted from panel.js to stay under 400-line limit
- All CSS uses WCAG-verified color tokens — no brass on readable text
- High-contrast overrides are mandatory per constitution Principle III
