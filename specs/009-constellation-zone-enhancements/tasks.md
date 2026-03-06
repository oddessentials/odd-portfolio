# Tasks: Constellation Line and Zone Enhancements

**Input**: Design documents from `/specs/009-constellation-zone-enhancements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested. No test tasks generated. Manual verification checkpoints included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Constitution & Cleanup)

**Purpose**: Governance amendment and dead code removal before any feature work begins.

- [ ] T001 Amend constitution Principle I in `.specify/memory/constitution.md`: (a) change "7 projects" to "variable project count with cluster support" in the conceptual rule, (b) change "Star positions are 7 hard-coded (x, y, z) values. No constellation-grouping algorithm." to "Star and cluster positions are data-driven from the project array.", (c) add `status`, `isCluster`, `clusterMembers` to the approved data model fields, (d) bump version to 1.4.0
- [ ] T002 [P] Remove `GLYPH_ATLAS_CELLS` export array (lines 9-74) from `js/data.js` and remove `glyphName`, `glyphRotation`, `glyphType`, `glyphAtlasIndex` fields from all 7 PROJECTS entries in `js/data.js`
- [ ] T003 [P] Remove unused MSDF `fragmentShader` export and `GLYPH_ATLAS_CELLS` import from `js/glyph-compositor.js` — keep `init()`, `setHoveredProject()`, `clearHover()`, `getNavRect()` functions intact

---

## Phase 2: Foundational (Data Model Expansion)

**Purpose**: Expand the PROJECTS array, CONSTELLATION_ZONES, and add SOCIAL_LINKS — the data layer that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Add `status: "active"`, `isCluster: false`, `clusterMembers: null` fields to all existing 7 PROJECTS entries in `js/data.js`
- [ ] T005 Add `ado-git-repo-seeder` project entry to PROJECTS in `js/data.js` with: id "ado-git-repo-seeder", name "ado-git-repo-seeder", shortDesc "Azure DevOps test data", tagline "Azure DevOps activity simulator — Node.js tool to seed realistic, multi-user Pull Request activity in Azure DevOps", category "devops", status "active", isCluster false, clusterMembers null, constellation "Git Analytics", accentColor "#38BDF8", starSize 1.0, position [-1.2, 1.2, 0.1], logoUrl null, mediaType null, mediaUrl null, screenshots null, links [{label: "GitHub", url: "https://github.com/oddessentials/ado-git-repo-seeder", primary: true}, {label: "Website", url: "https://oddessentials.com", primary: false}]
- [ ] T006 Add `socialmedia-syndicator` project entry to PROJECTS in `js/data.js` with: id "socialmedia-syndicator", name "socialmedia-syndicator", shortDesc "Social media syndication", tagline "Admin-approved social media posts — Facebook & X Social Media post creator with admin approval", category "application", status "in-progress", isCluster false, clusterMembers null, constellation "Social Media", accentColor "#F472B6", starSize 1.0, position [1.5, 0.2, -0.2], logoUrl null, mediaType null, mediaUrl null, screenshots null, links [{label: "GitHub", url: "https://github.com/oddessentials/socialmedia-syndicator", primary: true}, {label: "Website", url: "https://oddessentials.com", primary: false}]
- [ ] T007 Add `experiments-cluster` entry to PROJECTS in `js/data.js` with: id "experiments-cluster", name "Experiments", shortDesc "Experimental projects", tagline "Experimental and showcase projects exploring new ideas", category "experiments", status "active", isCluster true, constellation "Experiments", accentColor "#10B981", starSize 0.6, position [-0.2, -0.5, 0.3], clusterMembers [{name: "oddessentials-splash", description: "Main website of Odd Essentials, LLC", url: "https://github.com/oddessentials/oddessentials-splash", status: "active"}, {name: "odd-portfolio", description: "Curated portfolio of all public Odd Essentials", url: "https://github.com/oddessentials/odd-portfolio", status: "active"}, {name: "oddessentials-platform", description: "AI software expert open chat", url: "https://github.com/oddessentials/oddessentials-platform", status: "in-progress"}, {name: "odd-demonstration", description: "Polyglot microservices demonstration", url: "https://github.com/oddessentials/odd-demonstration", status: "active"}], links [{label: "GitHub Org", url: "https://github.com/oddessentials", primary: true}]
- [ ] T008 Add `dead-rock-cluster` entry to PROJECTS in `js/data.js` with: id "dead-rock-cluster", name "Reference Archive", shortDesc "Paused reference projects", tagline "Archived and paused reference repositories", category "reference", status "paused", isCluster true, constellation "Archive", accentColor "#6B7280", starSize 0.4, position [0.5, 1.3, -0.4], clusterMembers [{name: "odd-hive-mind", description: "AI Coding Swarm", url: "https://github.com/oddessentials/odd-hive-mind", status: "paused"}, {name: "oddessentials-mcp", description: "AI Tooling API", url: "https://github.com/oddessentials/oddessentials-mcp", status: "paused"}, {name: "odd-repo-mapper", description: "AI Repo Mapper", url: "https://github.com/oddessentials/odd-repo-mapper", status: "paused"}, {name: "odd-docs", description: "AI Repo Documenter", url: "https://github.com/oddessentials/odd-docs", status: "paused"}, {name: "odd-dep-updater", description: "AI Repo Update", url: "https://github.com/oddessentials/odd-dep-updater", status: "paused"}, {name: "odd-consultant", description: "AI Consultant", url: "https://github.com/oddessentials/odd-consultant", status: "paused"}], links [{label: "GitHub Org", url: "https://github.com/oddessentials", primary: true}]
- [ ] T009 Update `coney-island` entry in PROJECTS in `js/data.js`: change accentColor from "#FB7185" to "#F97316" (true orange per R-004), add clusterMembers [{name: "coney-website", description: "Restaurant website", url: "https://github.com/coneyislandpottsville/coney-website", status: "active"}, {name: "yo-coney-bot", description: "AI-powered chat agent", url: "https://github.com/coneyislandpottsville/yo-coney-bot", status: "active"}, {name: "yo-coney-mobile", description: "Mobile ordering app", url: "https://github.com/coneyislandpottsville/yo-coney-mobile", status: "active"}], update shortDesc to "Restaurant ecosystem", update tagline to include all 3 repos
- [ ] T010 Update `CONSTELLATION_ZONES` in `js/data.js`: Zone 0 name to "DevOps & Engineering" with projectIds ["odd-ai-reviewers", "ado-git-repo-insights", "ado-git-repo-seeder", "repo-standards", "odd-self-hosted-ci"]; Zone 1 name to "Applications & Products" with projectIds ["odd-ai-reviewers", "odd-map", "odd-fintech", "socialmedia-syndicator"] and statusText "Viewing applications & products..."; Zone 2 name unchanged "Community & Web" with projectIds ["repo-standards", "coney-island", "experiments-cluster", "dead-rock-cluster"]. Remove odd-self-hosted-ci from Zone 2.
- [ ] T011 Add `SOCIAL_LINKS` export array to `js/data.js` with 11 entries per data-model.md: LinkedIn, Facebook, X, GitHub, NPM, PyPI, Docker Hub, VS Marketplace, Codecov, Medium, Gravatar — each with platform name and URL

**Checkpoint**: Data model complete — all 11 project/cluster entries, 3 updated zones, and social links defined. Load page to verify no JS errors.

---

## Phase 3: User Story 1 — Expanded Portfolio Starfield (Priority: P1)

**Goal**: All 9 individual project stars visible and interactive in the starfield with correct zone membership, bridge star behavior, and complete panel data. Regression-free.

**Independent Test**: Load page → verify 9 stars visible → scroll through all 3 zones → verify correct highlight membership → click each star → verify panel content. Compare original 7 project panels frame-by-frame with pre-enhancement version.

### Implementation for User Story 1

- [ ] T012 [US1] Update `createStarNodes()` in `js/textures.js` to iterate all PROJECTS entries (not just first 7), skip entries where `isCluster === true` for now (clusters handled in US4). Ensure star sprite creation uses `project.accentColor` and `project.starSize` from each entry. Return both `starNodes` array and `starGroup`.
- [ ] T013 [US1] Update `initScene()` in `js/scene.js` to handle variable-length `starNodes` array from `createStarNodes()`. Verify the orbGroup → starGroup hierarchy handles 9+ sprites. Update any hardcoded assumptions about star count.
- [ ] T014 [US1] Update `handleScrollProgress()` in `js/scroll-zones.js` to use updated zone names/membership from CONSTELLATION_ZONES. Verify bridge star behavior: odd-ai-reviewers highlights in both Zone 0 and Zone 1, repo-standards highlights in both Zone 0 and Zone 2. Ensure `gsap.killTweensOf(sprite.scale)` does not cause flicker when bridge star transitions between two zones that both include it — the star stays highlighted, only constellation lines change. Update `cachedCmdText` fallback text if zone names changed.
- [ ] T015 [P] [US1] Add nav buttons for `ado-git-repo-seeder` and `socialmedia-syndicator` to `#constellation-nav` in `index.html`. Each button needs: `data-project` attribute matching project id, inline SVG glyph (derive rotation variant from existing glyph set), project name span, short description span. Follow exact structure of existing nav buttons.
- [ ] T016 [P] [US1] Expand the `.sr-only` project list in `index.html` to include all 9 individual stars with project name, tagline, and primary link. Ensure the list is in DOM at all times per constitution Principle III.
- [ ] T017 [US1] Update `initNavHoverEffects()` in `js/interactions.js` to handle the expanded nav button list (9 individual buttons instead of 7). Verify arrow key navigation cycles through all entries. Verify touch guard (first tap expands tagline, second opens panel) works for new entries.
- [ ] T018 [US1] Update `showProjectPanel()` in `js/panel.js` to display in-progress status badge when `project.status === "in-progress"` (applies to socialmedia-syndicator). Badge should be a small label below the tagline, styled in brass/gold to match aesthetic. Also handle `clusterMembers` on Coney Island: when clusterMembers is non-null AND isCluster is false, show a "Related Repositories" section in the panel listing each cluster member with name, description, and link.
- [ ] T019 [US1] Verify all 7 original project panels display identical content (title, tagline, logo, media, links) by loading each and comparing with current behavior. No regressions in panel.js for existing entries.

**Checkpoint**: 9 individual stars visible, correct zone highlights, bridge stars stable, all panels work, in-progress badge on socialmedia-syndicator, Coney Island shows 3 repos. Keyboard nav, reduced-motion, high-contrast unchanged.

---

## Phase 4: User Story 4 — Cluster Representations (Priority: P2)

**Goal**: Experiments cluster (4 tiny points + halo, interactive with panel) and dead rock cluster (6 dim grey points, non-interactive) render in the starfield as first-class zone members.

**Independent Test**: Load page → verify experiments cluster and dead rock cluster visible → scroll to Zone 2 → verify both highlight correctly (dead rock stays dim) → click experiments cluster → verify panel shows 4 repos → verify dead rock cluster is not clickable/focusable.

**Depends on**: Phase 3 (US1 must be complete — starNodes infrastructure handles variable count)

### Implementation for User Story 4

- [ ] T020 [US4] Extend `createStarNodes()` in `js/textures.js` to handle `isCluster === true` entries. For experiments cluster: create a THREE.Group containing 4 tiny sprites (starSize 0.4, using cluster accentColor "#10B981") at sub-point offsets [+0.06,+0.04], [-0.05,+0.06], [+0.04,-0.05], [-0.06,-0.03] relative to cluster center, plus 1 halo sprite (large radius ~0.3, additive blending, opacity 0.08, same color). For dead rock cluster: create a THREE.Group containing 6 tiny sprites (starSize 0.3, grey "#6B7280", opacity 0.15) at random offsets within +/-0.08 radius, no halo, no pulse. Both groups get userData matching the project data model (id, isCluster, project ref, baseScale, basePosition).
- [ ] T021 [US4] Update `initScene()` in `js/scene.js` to include cluster groups in starNodes array alongside individual sprites. Ensure raycasting (Raycaster with threshold 0.15) detects cluster groups — set the cluster group's children as raycast targets, or add a transparent hit-area sprite at the cluster center for interactive clusters only. Dead rock cluster must NOT be raycastable.
- [ ] T022 [US4] Update `handleScrollProgress()` in `js/scroll-zones.js` to handle cluster groups in zone highlighting. Experiments cluster: scale up children and boost opacity when Zone 2 active. Dead rock cluster: exempt from scale/opacity boost per FR-021 — stays dim even when Zone 2 is active. Check `project.status === "paused"` or `project.id === "dead-rock-cluster"` to skip highlighting.
- [ ] T023 [P] [US4] Add "Experiments" nav button to `#constellation-nav` in `index.html` with data-project="experiments-cluster", inline SVG glyph, name "Experiments", short description "Experimental projects". Do NOT add a nav entry for dead-rock-cluster.
- [ ] T024 [P] [US4] Add experiments cluster member repos to the `.sr-only` project list in `index.html`: oddessentials-splash, odd-portfolio, oddessentials-platform, odd-demonstration — each with name, description, and GitHub link. Add dead-rock cluster members as well with "paused" label but no interactive link.
- [ ] T025 [US4] Implement cluster panel view in `showProjectPanel()` in `js/panel.js`. When `project.isCluster === true`, render a list view showing each clusterMember with: name as heading, description, status badge (if in-progress), and primary link. Use the cluster's accentColor for theming. Ensure focus trap works in cluster panel.
- [ ] T026 [US4] Update `js/reticle.js` to track cluster center position on hover for interactive clusters (experiments-cluster). The reticle should lock onto the cluster group's center position (same as individual stars use sprite.getWorldPosition). Dead rock cluster must not trigger reticle.
- [ ] T027 [US4] Update `js/interactions.js` touch guard and keyboard nav to handle cluster nav entry. Touch guard behavior: first tap expands "Experiments" tagline, second tap opens cluster panel. Arrow keys include experiments-cluster in the nav cycle. Dead rock cluster is never in the nav cycle.

**Checkpoint**: Both clusters visible in starfield. Experiments cluster has nav entry, opens panel with 4 repos, responds to hover/reticle. Dead rock cluster is dim, static, non-interactive. Zone 2 scroll highlights experiments + Coney, dead rock stays dim.

---

## Phase 5: User Story 2 — Premium Constellation Lines (Priority: P2)

**Goal**: Active zone constellation lines show gradient coloring + glow filter + energy flow animation. All three zones show persistent dashed watermark lines at rest. Transitions crossfade smoothly.

**Independent Test**: Load page → verify watermark lines for all 3 zones visible at rest → scroll into Zone 0 → verify gradient+glow+energy flow on Zone 0 lines, watermarks on Zones 1+2 → scroll through all zones → verify smooth crossfade transitions → open panel → verify all lines hidden → close panel → verify lines restored.

**Depends on**: Phase 4 (US4 must be complete — clusters need to exist as line endpoints)

### Implementation for User Story 2

- [ ] T028 [US2] Refactor `js/constellation-lines.js` init() to create SVG `<defs>` element inside svgContainer with: 3 `<filter>` elements (id="zone-glow-0", "zone-glow-1", "zone-glow-2") each containing feGaussianBlur (stdDeviation 2-3) + feComposite for zone-colored glow; 3 `<linearGradient>` elements (id="zone-grad-0", "zone-grad-1", "zone-grad-2") using each zone's nebulaHueRgb converted to hex for gradient stops.
- [ ] T029 [US2] Add `initWatermarkLines()` function to `js/constellation-lines.js`. Called once after reveal completes (via 'reveal-complete' event or explicit call from app.js). Creates a `<g class="watermark-lines">` group containing faint dashed lines (stroke-dasharray "8 12", stroke-opacity 0.15, zone-colored but desaturated) connecting all members of all 3 zones using chain topology (N-1 lines for N members). Store watermark line references in a `watermarkLines` array (separate from `activeLines`). Each watermark line entry: {element, star1, star2, zoneIndex}.
- [ ] T030 [US2] Update `tick()` in `js/constellation-lines.js` to update positions of BOTH watermarkLines and activeLines per frame. Both arrays iterate the same way: get star world positions via getWorldPosition + project3DtoScreen, update SVG line x1/y1/x2/y2 attributes.
- [ ] T031 [US2] Refactor `createZoneLines()` in `js/constellation-lines.js` to create "active" lines with premium visual treatment: each line gets `stroke="url(#zone-grad-N)"`, `filter="url(#zone-glow-N)"`, `stroke-width: 2`, `stroke-linecap: round`, `stroke-opacity: 0.7`. Active lines are created in a `<g class="active-lines">` group overlaid on the watermark layer.
- [ ] T032 [US2] Add energy flow animation to active lines in `js/constellation-lines.js`. After draw-on animation completes, apply a repeating GSAP tween: `gsap.to(line, { attr: { 'stroke-dashoffset': -totalLength }, duration: 2, repeat: -1, ease: 'none' })` with stroke-dasharray set to create a flowing pattern (e.g., "20 30"). Skip under `prefers-reduced-motion` — show solid lines instead.
- [ ] T033 [US2] Refactor `onZoneChange()` in `js/constellation-lines.js` to handle watermark↔active transitions. When a zone activates: create active lines for that zone (overlaying the watermark). When a zone deactivates: fade out and remove active lines (watermark remains). The `fadeSequence` guard must cover both active line creation and removal to prevent stale callbacks during rapid scrolling.
- [ ] T034 [US2] Update panel-open/panel-close handlers in `js/constellation-lines.js` to hide BOTH svgContainer layers (watermark + active) on panel-open, restore on panel-close. Since both layers are children of the same svgContainer, setting `svgContainer.style.display = 'none'` already handles this — verify it does.
- [ ] T035 [US2] Add reduced-motion fallback in `js/constellation-lines.js`: when `prefers-reduced-motion` is true, watermark lines show as solid (no dash animation), active lines show as solid at full opacity (no energy flow, no glow filter, no draw-on animation). Zone transitions are instant (no crossfade).
- [ ] T036 [US2] Verify constellation lines track correctly on window resize — `tick()` uses `project3DtoScreen()` which reads camera and renderer dimensions, so SVG endpoints should auto-update. Verify watermark lines also update. Test by resizing browser window while lines are visible.

**Checkpoint**: Watermark lines visible at rest for all 3 zones. Active zone shows gradient+glow+energy flow. Transitions crossfade smoothly. Lines hidden behind panel. Reduced-motion shows static solid lines. No visual pop on rapid scroll.

---

## Phase 6: User Story 3 — Constellation Intro Showcase (Priority: P3)

**Goal**: During reveal sequence, after stars ignite, rapidly cycle through all 3 zone constellations to teach visitors that constellations exist.

**Independent Test**: Load page fresh → watch reveal → after stars appear (~5.2s), Zone 0 lines flash (0.4s) → Zone 1 (0.4s) → Zone 2 (0.4s) → fade to watermark rest. Click skip → verify showcase skipped. Enable reduced-motion → verify no showcase.

**Depends on**: Phase 5 (US2 must be complete — watermark lines and active line infrastructure must exist)

### Implementation for User Story 3

- [ ] T037 [US3] Add `playIntroShowcase()` function to `js/constellation-lines.js`. Creates a GSAP timeline that: (1) flashes Zone 0 lines at "preview intensity" (0.5 opacity, zone color, no glow filter) for 0.4s, (2) fades Zone 0, flashes Zone 1 for 0.4s, (3) fades Zone 1, flashes Zone 2 for 0.4s, (4) fades all to watermark rest state. Total duration ~1.5s. Uses temporary SVG lines (not the watermark layer — those should already be visible). Export this function.
- [ ] T038 [US3] Wire `playIntroShowcase()` into reveal sequence in `js/animations.js`. After the star stagger-in animation completes (~5.2s mark on desktop), call `constellation-lines.playIntroShowcase()`. Ensure watermark lines are initialized BEFORE the showcase starts (T029 initWatermarkLines must have been called). Add the showcase call after the existing nav button fade-in at ~5.2s.
- [ ] T039 [US3] Handle skip for constellation showcase. In `js/animations.js`, the existing skip-intro button and S key handler call a skip function that `.progress(1)` completes the reveal timeline. Extend this to also kill the intro showcase timeline and immediately show watermark rest state. If the user scrolls during the showcase, the scroll-zone handler should take over and the showcase timeline should be killed.
- [ ] T040 [US3] Disable constellation intro showcase on mobile (<768px) and when `prefers-reduced-motion: reduce` is active. In `playIntroShowcase()`, check both conditions and return immediately if either is true — watermark lines will already be in rest state.

**Checkpoint**: Intro showcase plays after star ignition, flashes 3 zones in rapid succession, fades to watermark rest. Skip works. Mobile/reduced-motion: no showcase.

---

## Phase 7: User Story 5 — Social & Presence Links (Priority: P3)

**Goal**: Social/presence links section visible in the status panel with 11 platform icons, accessible via keyboard, working on mobile.

**Independent Test**: Load page → verify social links visible below status readout → click each link → verify correct URL opens in new tab → Tab through links → verify focus indicators → check mobile hamburger → verify social links accessible.

**Depends on**: Phase 2 only (SOCIAL_LINKS data). Can be implemented in parallel with Phases 3-6.

### Implementation for User Story 5

- [ ] T041 [P] [US5] Add social links HTML section to `#status-panel` in `index.html`, below the existing `.status-readout` div. Create a `<div class="social-links">` containing 11 `<a>` elements, each with: `href` from SOCIAL_LINKS data, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="[Platform name]"`, and an inline SVG icon (`<svg viewBox="0 0 24 24" width="18" height="18"><path d="..." fill="currentColor"/></svg>`). SVG path data: use simplified brand icons for each platform (LinkedIn, Facebook, X, GitHub, NPM, PyPI, Docker Hub, VS Marketplace, Codecov, Medium, Gravatar). Each icon under 500 bytes.
- [ ] T042 [P] [US5] Style social links section in `css/styles.css`. Rules: `.social-links` flex-wrap row with gap 8px, padding-top 12px, border-top 1px solid var(--color-brass-dark). Links: `color: var(--color-brass-light, #C8A84B)`, hover: `color: #ffd700`, transition 0.2s. Focus indicator: golden glow outline per constitution Principle III (3px outline + box-shadow with dark offset ring). Hide on mobile `@media (max-width: 767px) { .social-links { display: none; } }`.
- [ ] T043 [US5] Add social links to mobile hamburger menu in `js/interactions.js` or `index.html`. On mobile (<768px), social links should appear at the bottom of the hamburger nav panel as a row of icon links. Ensure they are keyboard-reachable when hamburger is open.
- [ ] T044 [US5] Verify all 11 social link URLs resolve correctly by checking each `href` against the SOCIAL_LINKS data in `js/data.js`. Verify `rel="noopener noreferrer"` on all links. Verify `aria-label` includes platform name for screen readers.

**Checkpoint**: Social links visible on desktop status panel. All 11 links work. Keyboard-navigable with focus indicators. Accessible on mobile via hamburger. No interference with existing UI.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all user stories, performance validation, accessibility audit.

- [ ] T045 Verify complete reduced-motion compliance across ALL new features: energy flow animation disabled, constellation intro showcase skipped, cluster pulse disabled, zone transitions instant, watermark lines static solid. Test by enabling `prefers-reduced-motion: reduce` in browser devtools and walking through all interactions in `js/constellation-lines.js`, `js/scroll-zones.js`, `js/textures.js`, `js/animations.js`.
- [ ] T046 Verify high-contrast mode (`prefers-contrast: more`) across all new features: decorative elements (watermark lines, cluster halos, social link icons) either hidden or have sufficient contrast. Test in browser devtools in `css/styles.css` and `js/sidebar-hieroglyphs.js`.
- [ ] T047 Cross-browser testing: load page in Chrome, Firefox, and Safari. Verify (a) SVG filters render correctly (feGaussianBlur glow), (b) constellation lines track star positions accurately, (c) energy flow animation runs smoothly, (d) all panels open correctly, (e) social link icons display. Document any browser-specific issues.
- [ ] T048 Performance verification: use browser DevTools to confirm (a) draw calls < 30 steady state (Performance tab → GPU → Draw calls), (b) 60fps maintained with all watermark lines visible on Intel Iris-class GPU, (c) page weight increase < 15KB from new data + SVG icons, (d) no memory leaks from constellation line creation/destruction during repeated zone scrolling.
- [ ] T049 Run complete quickstart.md testing checklist in `specs/009-constellation-zone-enhancements/quickstart.md` — verify all 24 items pass.
- [ ] T050 Update `CONSTELLATIONS.md` in project root to reflect the new state: update zone membership table, project list, constellation line behavior description, and mark "NEW DATA" section as incorporated.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────────────────┐
     │                                                                    │
     v                                                                    │
Phase 2 (Foundational) ──────────────────────────────────────────────────┤
     │                                                                    │
     ├───> Phase 3 (US1: Expanded Starfield, P1)                         │
     │          │                                                         │
     │          v                                                         │
     │     Phase 4 (US4: Clusters, P2)                                   │
     │          │                                                         │
     │          v                                                         │
     │     Phase 5 (US2: Premium Lines, P2)                              │
     │          │                                                         │
     │          v                                                         │
     │     Phase 6 (US3: Intro Showcase, P3)                              │
     │                                                                    │
     ├───> Phase 7 (US5: Social Links, P3) ◄── can run parallel with 3-6 │
     │                                                                    │
     v                                                                    v
Phase 8 (Polish) ◄── depends on all desired user stories being complete
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (data model). No dependency on other stories.
- **US4 (P2)**: Depends on US1 (star infrastructure must handle variable count + clusters need starNodes).
- **US2 (P2)**: Depends on US4 (constellation lines connect to cluster endpoints).
- **US3 (P3)**: Depends on US2 (intro showcase uses constellation line infrastructure).
- **US5 (P3)**: Depends on Phase 2 only (SOCIAL_LINKS data). Fully independent of US1-US4.
- **US6 (P1)**: Regression prevention is woven into every phase as verification steps (T019, T045, T046, T049).

### Within Each User Story

- Data model changes (Phase 2) before rendering changes
- Rendering (textures/scene) before interaction (scroll-zones/interactions)
- Core implementation before panel/nav integration
- Implementation before verification checkpoints

### Parallel Opportunities

**Phase 1**: T002 and T003 can run in parallel (different files)

**Phase 2**: T005, T006, T007, T008 touch the same file (data.js) — must be sequential. T011 (SOCIAL_LINKS) can run after zone updates.

**Phase 3 (US1)**: T015 and T016 can run in parallel with each other (both index.html but different sections). T012 and T014 are in different files but T014 depends on T012.

**Phase 4 (US4)**: T023 and T024 can run in parallel (index.html sections). T020 must complete before T021 (scene.js depends on textures.js cluster creation).

**Phase 5 (US2)**: Mostly sequential within constellation-lines.js. T028 → T029 → T030 → T031 → T032 → T033 chain.

**Phase 7 (US5)**: T041 and T042 can run in parallel (index.html vs css/styles.css). Entire phase can run in parallel with Phases 3-6.

---

## Parallel Example: Multi-Story Execution

```
# After Phase 2 completes, launch US1 and US5 in parallel:

Agent A (US1 track):
  T012 → T013 → T014 → T015+T016 → T017 → T018 → T019

Agent B (US5 track):
  T041+T042 → T043 → T044

# After US1 completes, Agent A continues with US4:
  T020 → T021 → T022 → T023+T024 → T025 → T026 → T027

# After US4 completes, Agent A continues with US2:
  T028 → T029 → T030 → T031 → T032 → T033 → T034 → T035 → T036

# After US2 completes, Agent A continues with US3:
  T037 → T038 → T039 → T040

# Both agents converge for Polish:
  T045 → T046 → T047 → T048 → T049 → T050
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (constitution amendment, glyph cleanup)
2. Complete Phase 2: Foundational (data model expansion)
3. Complete Phase 3: User Story 1 (expanded starfield)
4. **STOP and VALIDATE**: 9 stars visible, zones work, bridge stars stable, panels correct
5. This delivers the core value: complete project inventory in the starfield

### Incremental Delivery

1. Setup + Foundational → Data ready
2. Add US1 (expanded starfield) → Core value delivered (MVP)
3. Add US4 (clusters) → Full visual inventory complete
4. Add US2 (premium lines) → Visual upgrade delivered
5. Add US3 (intro showcase) → Discoverability enhanced
6. Add US5 (social links) → Professional presence complete (can be done anytime after step 1)
7. Polish → Cross-cutting verification

### Single-Agent Strategy (Recommended)

Follow phases sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. This is the safest order because each phase builds on the previous. US5 can be moved earlier if desired (it's independent after Phase 2).

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps task to specific user story for traceability
- US6 (Regression-Free Enhancement) is not a separate phase — it's verified via checkpoints in every phase (T019, T045, T046, T049)
- Dead rock cluster is explicitly exempt from interactivity per FR-045 — skip it in raycasting, nav, reticle, and panel code
- Bridge stars (odd-ai-reviewers, repo-standards) are the trickiest interaction — test zone transitions carefully in T014
- constellation-lines.js will grow from 218 to ~350 lines — still under 400-line constitution limit
- No new JS files needed — all changes fit existing modules
- Commit after each phase completion for clean rollback points
