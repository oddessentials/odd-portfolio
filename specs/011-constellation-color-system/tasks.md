# Tasks: Constellation Star System & Color Logic

**Input**: Design documents from `/specs/011-constellation-color-system/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: No automated test framework — visual verification only (per plan.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Branch verification and pre-implementation snapshot

- [x] T001 Verify branch `011-constellation-color-system` is checked out and clean with `git status`
- [x] T002 Read current values in `js/data.js` to confirm all 11 PROJECTS entries and 3 CONSTELLATION_ZONES entries exist with accentColor, starSize, hex, hexBright, hexWatermark, and nebulaHueRgb fields

**Checkpoint**: Branch ready, current data structure confirmed

---

## Phase 2: User Story 1 — System-Coherent Star Colors (Priority: P1) MVP

**Goal**: Replace all 11 project accentColor values with the authoritative color table hex values

**Independent Test**: Load `index.html` in Chrome and visually confirm each star displays its assigned hex color. Dead-rock-cluster stays gray.

### Implementation for User Story 1

- [x] T003 [P] [US1] Update `odd-ai-reviewers` accentColor from `#9B6BD4` to `#9FE060` in `js/data.js`
- [x] T004 [US1] Update `odd-fintech` accentColor from `#D4A832` to `#E63946` in `js/data.js`
- [x] T005 [US1] Update `coney-island` accentColor from `#F97316` to `#F68A2B` in `js/data.js`
- [x] T006 [US1] Update `odd-map` accentColor from `#C9941F` to `#F4A62A` in `js/data.js`
- [x] T007 [US1] Update `ado-git-repo-insights` accentColor from `#7B8EC9` to `#38B000` in `js/data.js`
- [x] T008 [US1] Update `odd-self-hosted-ci` accentColor from `#6B5BAF` to `#2EC4B6` in `js/data.js`
- [x] T009 [US1] Update `repo-standards` accentColor from `#3AB5A5` to `#7B2CBF` in `js/data.js`
- [x] T010 [US1] Update `socialmedia-syndicator` accentColor from `#E8B85A` to `#F0E442` in `js/data.js`
- [x] T011 [US1] Update `ado-git-repo-seeder` accentColor from `#8E7BC8` to `#3B5BDB` in `js/data.js`
- [x] T012 [US1] Update `experiments-cluster` accentColor from `#2CC4B2` to `#5A189A` in `js/data.js`
- [x] T013 [US1] Verify `dead-rock-cluster` accentColor remains `#6B7280` (unchanged) in `js/data.js`

**Checkpoint**: All 11 stars show correct system colors. Dead-rock stays gray. Panel accents auto-propagate (US5 satisfied).

---

## Phase 3: User Story 2 — Zone-Aligned Nebula & Line Colors (Priority: P2)

**Goal**: Update CONSTELLATION_ZONES color fields to harmonize with new system palettes

**Independent Test**: Scroll through all 3 zones and confirm nebula tint and constellation line colors match the dominant system palette for each zone.

### Implementation for User Story 2

- [x] T014 [P] [US2] Update Zone 0 (DevOps & Engineering) hex from `#6B40A1` to `#38B000` in `js/data.js` CONSTELLATION_ZONES
- [x] T015 [US2] Update Zone 0 hexBright from `#9B6BD4` to `#9FE060` in `js/data.js` CONSTELLATION_ZONES
- [x] T016 [US2] Update Zone 0 hexWatermark from `#8B7099` to `#5A8A50` in `js/data.js` CONSTELLATION_ZONES
- [x] T017 [US2] Update Zone 0 nebulaHueRgb from `[0.42, 0.25, 0.63]` to `[0.22, 0.69, 0.00]` in `js/data.js` CONSTELLATION_ZONES
- [x] T018 [US2] Update Zone 1 (Applications & Products) hex from `#B8870A` to `#F4A62A` in `js/data.js` CONSTELLATION_ZONES
- [x] T019 [US2] Update Zone 1 hexBright from `#E8B73A` to `#F0E442` in `js/data.js` CONSTELLATION_ZONES
- [x] T020 [US2] Update Zone 1 hexWatermark from `#A89B78` to `#A89B60` in `js/data.js` CONSTELLATION_ZONES
- [x] T021 [US2] Update Zone 1 nebulaHueRgb from `[0.72, 0.53, 0.04]` to `[0.96, 0.65, 0.16]` in `js/data.js` CONSTELLATION_ZONES
- [x] T022 [US2] Update Zone 2 (Community & Web) hex from `#1A9E8F` to `#7B2CBF` in `js/data.js` CONSTELLATION_ZONES
- [x] T023 [US2] Update Zone 2 hexBright from `#4ACEBF` to `#9B4DDF` in `js/data.js` CONSTELLATION_ZONES
- [x] T024 [US2] Update Zone 2 hexWatermark from `#6B9B95` to `#6B5A80` in `js/data.js` CONSTELLATION_ZONES
- [x] T025 [US2] Update Zone 2 nebulaHueRgb from `[0.1, 0.62, 0.56]` to `[0.48, 0.17, 0.75]` in `js/data.js` CONSTELLATION_ZONES

**Checkpoint**: All 3 zones show harmonized nebula tint and constellation line colors matching their dominant system palette.

---

## Phase 4: User Story 3 — Bridge Star Multi-Zone Highlighting (Priority: P2)

**Goal**: Confirm repo-standards remains in all 3 zone projectId lists and retains #7B2CBF

**Independent Test**: Scroll through all 3 zones and confirm repo-standards highlights (scale 1.3x, full opacity) in each zone while retaining purple #7B2CBF.

### Implementation for User Story 3

- [x] T026 [P] [US3] Verify `repo-standards` appears in all 3 CONSTELLATION_ZONES[].projectIds arrays in `js/data.js` (no code change — confirm existing bridge membership is preserved)

**Checkpoint**: repo-standards highlights in all 3 zones with correct purple color.

---

## Phase 5: User Story 4 — Locked Size Hierarchy (Priority: P3)

**Goal**: Replace all 11 project starSize values with Fibonacci tier scale values

**Independent Test**: Load the starfield and visually verify Anchor-tier stars are largest, Peripheral-tier are smallest.

### Implementation for User Story 4

- [x] T027 [P] [US4] Update `odd-ai-reviewers` starSize from `1.4` to `2.33` in `js/data.js`
- [x] T028 [US4] Update `odd-fintech` starSize from `1.4` to `2.33` in `js/data.js`
- [x] T029 [US4] Update `coney-island` starSize from `1.0` to `1.44` in `js/data.js`
- [x] T030 [US4] Update `odd-map` starSize from `1.15` to `1.44` in `js/data.js`
- [x] T031 [US4] Update `ado-git-repo-insights` starSize from `1.15` to `1.00` in `js/data.js`
- [x] T032 [US4] Update `odd-self-hosted-ci` starSize from `1.0` to `1.00` in `js/data.js`
- [x] T033 [US4] Update `repo-standards` starSize from `1.0` to `1.00` in `js/data.js`
- [x] T034 [US4] Update `socialmedia-syndicator` starSize from `1.0` to `0.89` in `js/data.js`
- [x] T035 [US4] Update `ado-git-repo-seeder` starSize from `1.0` to `0.89` in `js/data.js`
- [x] T036 [US4] Update `experiments-cluster` starSize from `0.6` to `0.55` in `js/data.js`
- [x] T037 [US4] Update `dead-rock-cluster` starSize from `0.4` to `0.55` in `js/data.js`

**Checkpoint**: Star sizes visually match the 5-tier Fibonacci hierarchy. Anchor stars are clearly the largest.

---

## Phase 6: User Story 5 — Panel Cluster Member Color Consistency (Priority: P3)

**Goal**: Confirm cluster member name colors in panel auto-propagate from updated accentColor values

**Independent Test**: Click each cluster star and confirm panel cluster member names use the project's hex color.

### Implementation for User Story 5

- [x] T038 [US5] Verify panel.js `renderClusterMemberList` (line 40) reads `project.accentColor` for cluster member name styling in `js/panel.js` (no code change — confirm existing data flow). Verify experiments-cluster sub-member names use #5A189A and coney-island related repo names use #F68A2B.

**Checkpoint**: All cluster member names in panels match their parent star's accent color.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Twinkle clamp, visual verification, accessibility checks

- [x] T039 [P] Reduce chromatic twinkle saturation/lightness boost in `js/scene.js` (~line 274): change `Math.min(1, twinkleHSL.s + 0.7)` to `Math.min(0.95, twinkleHSL.s + 0.5)` and `Math.min(1, twinkleHSL.l + 0.2)` to `Math.min(0.9, twinkleHSL.l + 0.15)`
- [ ] T040 Visual verification: load `index.html` in Chrome, verify all 10 active stars show correct colors per quickstart.md Step 5. Also verify nebula particle tinting looks correct around stars with large color changes (odd-ai-reviewers, experiments-cluster). Check `renderer.info.render.calls` in console — confirm draw calls remain under 30.
- [ ] T041 Visual verification: scroll through all 3 zones, confirm nebula tint and constellation line colors harmonize per quickstart.md Step 5
- [ ] T042 Visual verification: confirm repo-standards highlights in all 3 zones with purple #7B2CBF
- [ ] T043 Visual verification: click each star, confirm panel accent matches star color
- [ ] T044 Visual verification: confirm Anchor-tier stars (odd-ai-reviewers, odd-fintech) are visually largest
- [ ] T045 Visual verification: watch twinkle effect on bright stars (#F0E442, #9FE060), confirm no white flash/washout
- [ ] T046 WCAG contrast check: star sprite colors are exempt from text contrast. For cluster member name text, verify #5A189A fails AA (1.90:1) — if used as text in `js/panel.js`, substitute zone hexBright (#9B4DDF) for text rendering. Verify #F68A2B (coney-island cluster text) passes AA.
- [ ] T047 Run quickstart.md full validation checklist (Steps 1-5)
- [ ] T048 Interaction regression check: verify scroll-zone star highlighting (scale 1.3x, opacity dim), hover states, keyboard nav (ArrowUp/Down), panel open/close with Escape, reticle tracking, and gauge needle animation all function unchanged
- [ ] T049 Cluster sub-member verification: open `index.html`, confirm experiments-cluster sub-member points all display #5A189A and dead-rock-cluster sub-members all display #6B7280 in `js/textures.js` rendering
- [ ] T050 Cross-browser verification: repeat T040-T042 visual checks in Firefox and Safari per constitution Section VII
- [ ] T051 Mobile verification: open `index.html` at mobile viewport (<768px), confirm accessible project list shows correct accent colors per SC-010

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Setup — update accentColor values
- **US2 (Phase 3)**: Depends on Setup — update zone color fields (independent of US1)
- **US3 (Phase 4)**: Depends on Setup — verification only (independent of US1/US2)
- **US4 (Phase 5)**: Depends on Setup — update starSize values (independent of US1/US2/US3)
- **US5 (Phase 6)**: Depends on US1 — panel accents read from accentColor (auto-propagated)
- **Polish (Phase 7)**: Depends on US1 + US2 + US4 completion — visual verification, twinkle clamp, interaction regression, cluster sub-member check, cross-browser, and mobile

### User Story Dependencies

- **US1 (P1)**: Can start after Setup — no dependencies on other stories
- **US2 (P2)**: Can start after Setup — independent of US1 (different data section in same file)
- **US3 (P2)**: Can start after Setup — verification only, no code change
- **US4 (P3)**: Can start after Setup — independent of US1/US2 (different data field in same file)
- **US5 (P3)**: Depends on US1 completion — panel reads accentColor values set by US1

### Within Each User Story

All tasks within a story are sequential (same file `js/data.js`), but stories themselves can run in parallel since they modify different fields/sections.

### Parallel Opportunities

- US1 (accentColor), US2 (zone colors), US3 (verification), and US4 (starSize) can all run in parallel since they modify different fields in `js/data.js` — first task of each story is marked [P]
- T039 (scene.js twinkle clamp) is marked [P] — independent of all data.js tasks

---

## Parallel Example: All User Stories

```bash
# All 4 implementation stories can launch in parallel (different fields/sections):
Task: "US1 - Update all 11 accentColor values in js/data.js"
Task: "US2 - Update all 12 zone color fields in js/data.js CONSTELLATION_ZONES"
Task: "US3 - Verify repo-standards bridge membership in js/data.js"
Task: "US4 - Update all 11 starSize values in js/data.js"

# Twinkle clamp is independent (different file):
Task: "T039 - Reduce twinkle saturation/lightness in js/scene.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: US1 — accentColor updates
3. **STOP and VALIDATE**: Load index.html, verify all stars show correct colors
4. All downstream consumers (textures, panel, nebula) auto-propagate

### Incremental Delivery

1. Complete Setup → Branch ready
2. Add US1 (accentColor) → Stars show system colors → Validate (MVP!)
3. Add US4 (starSize) → Stars show correct hierarchy → Validate
4. Add US2 (zone colors) → Nebula/lines harmonize → Validate
5. Add US3 (bridge verification) → repo-standards confirmed → Validate
6. Add US5 (panel verification) → Panel accents confirmed → Validate
7. Polish: Twinkle clamp + full visual verification + WCAG check

### Single Developer Strategy

Since all changes are data values in 2 files:
1. Update all accentColor + starSize + zone colors in one pass through `js/data.js`
2. Apply twinkle clamp in `js/scene.js`
3. Run full visual verification checklist

---

## Notes

- All tasks in Phases 2-6 modify `js/data.js` — value changes only, no logic changes
- T039 is the only task modifying `js/scene.js` — a 2-line twinkle clamp adjustment
- No new files created, no modules added
- All downstream consumers (textures.js, constellation-lines.js, scroll-zones.js, panel.js) auto-propagate from data.js
- Total estimated change: ~42 lines across 2 files
- Total tasks: 51 (47 original + 4 added by analyze review: T048-T051)
