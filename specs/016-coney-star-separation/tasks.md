# Tasks: Coney Star Separation

**Input**: Design documents from `/specs/016-coney-star-separation/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: No automated tests (manual visual verification per quickstart.md)

**Organization**: Tasks are grouped by user story. US1 and US4 share P1 priority and are co-dependent (stars need sidebar buttons for accessibility). US2 colors are embedded in US1 data entries. US3 zone atmosphere is independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Data Removal)

**Purpose**: Remove the parent `coney-island` entry from all data sources before inserting replacements

**CRITICAL**: Must complete before any user story work begins — removes the entity being replaced

- [ ] T001 Remove `coney-island` PROJECTS entry (lines 275-333) from js/data.js
- [ ] T002 [P] Remove `'coney-island'` PROJECT_CONTENT key (lines 182-192) from js/data-content.js
- [ ] T003 Remove `"coney-island"` from CONSTELLATION_ZONES[1].projectIds array (line 483) in js/data.js

**Checkpoint**: The old parent entry is fully removed from data.js, data-content.js, and zone membership. The site will show 10 stars temporarily.

---

## Phase 2: User Story 1 — Individual Coney Stars with Metrics (Priority: P1) + User Story 4 — Sidebar Navigation (Priority: P1)

**Goal**: Add 3 independent Coney stars with repoKey-driven metrics bars, positioned as a tight cluster, and provide sidebar buttons for keyboard navigation to each.

**Independent Test**: Click each of the 3 Coney stars — each panel shows project-specific content and a populated metrics bar. Tab through the sidebar and verify 3 Coney buttons open the correct panels.

### Implementation

- [ ] T004 [US1] Insert `coney-website` PROJECTS entry in js/data.js with id, repoKey "coney-website", name "Coney Island Website", accentColor "#F6802C", starSize 1.0, position [1.0, -1.0, 0.4], logoUrl "assets/coney-island-logo-1024x690.svg", mediaType "image", mediaUrl "assets/coney-island-restaurant-and-tavern.jpg", links to coneyislandpottsville.com and github.com/coneyislandpottsville/coney-website — see data-model.md for full field values
- [ ] T005 [US1] Insert `yo-coney-bot` PROJECTS entry in js/data.js with id, repoKey "yo-coney-bot", name "Yo Coney Bot", accentColor "#F15927", starSize 0.89, position [0.85, -0.80, 0.35], logoUrl "assets/coney-island-logo-1024x690.svg", mediaType null, links to chat.coneyislandpottsville.com and github.com/coneyislandpottsville/yo-coney-bot — see data-model.md for full field values
- [ ] T006 [US1] Insert `yo-coney-mobile` PROJECTS entry in js/data.js with id, repoKey "yo-coney-mobile", name "Yo Coney Mobile", accentColor "#F4A333", starSize 0.55, position [1.15, -1.15, 0.50], logoUrl "assets/coney-island-logo-1024x690.svg", mediaType null, links to github.com/coneyislandpottsville/yo-coney-mobile — see data-model.md for full field values
- [ ] T007 [US1] Add "coney-website", "yo-coney-bot", "yo-coney-mobile" to CONSTELLATION_ZONES[1].projectIds array in js/data.js, inserted between "socialmedia-syndicator" and "repo-standards"
- [ ] T008 [P] [US4] Replace single `<button data-project-id="coney-island">` (line 211) in index.html with 3 buttons: data-project-id="coney-website" (name: "Coney Island Website", desc: "Restaurant website & events"), data-project-id="yo-coney-bot" (name: "Yo Coney Bot", desc: "AI restaurant chat assistant"), data-project-id="yo-coney-mobile" (name: "Yo Coney Mobile", desc: "Mobile chat companion") — see data-model.md for exact HTML

**Checkpoint**: 3 Coney stars visible in constellation, each clickable with full panel content and metrics bar. 3 sidebar buttons for keyboard navigation. Star count is 13.

---

## Phase 3: User Story 2 — Orange Color Family + odd-map Shift (Priority: P2)

**Goal**: Shift odd-map from yellow-orange to yellow-gold so Coney orange family is visually distinct from all neighbors.

**Independent Test**: View the constellation and confirm odd-map reads as yellow-gold (not orange), the 3 Coney stars read as orange shades, and odd-fintech reads as red — all visually distinct.

### Implementation

- [ ] T009 [US2] Change odd-map accentColor from "#F4A62A" to "#F4D228" in js/data.js (line 197)

**Checkpoint**: The 3 Coney orange stars (#F6802C, #F15927, #F4A333) at H=15-35deg are visually distinct from odd-map's yellow-gold (#F4D228, H=50deg) and odd-fintech's red (#E63946, H=355deg).

---

## Phase 4: User Story 3 — Zone Atmosphere Update (Priority: P3)

**Goal**: Update the "Applications & Products" zone nebula tint from amber to warm orange, reflecting the Coney cluster's visual dominance.

**Independent Test**: Scroll to the "Applications & Products" zone and verify the nebula atmosphere shifts to warm orange. Constellation lines flow through the 3 Coney stars.

### Implementation

- [ ] T010 [US3] Update CONSTELLATION_ZONES[1] atmosphere in js/data.js: change nebulaHue from "amber" to "orange", nebulaHueRgb from [0.96, 0.65, 0.16] to [0.96, 0.50, 0.17], hex from "#F4A62A" to "#F6802C", hexBright from "#F0E442" to "#F4A333", hexWatermark from "#A89B60" to "#B87540"

**Checkpoint**: Zone 1 nebula atmosphere is warm orange. Constellation lines connect sequentially through the 3 Coney stars. Zone transition feels cohesive.

---

## Phase 5: Polish & Verification

**Purpose**: Cross-story validation and performance verification

- [ ] T011 Verify all 3 Coney panels show populated metrics bars by opening each panel and checking commits, PRs, LOC, tests values match repo-metrics.json
- [ ] T012 [P] Verify star separation meets 0.18 minimum: coney-website↔yo-coney-bot (0.25), coney-website↔yo-coney-mobile (0.22), yo-coney-bot↔yo-coney-mobile (0.46)
- [ ] T013 [P] Verify WCAG AA contrast for all 3 Coney colors against #0D0B09: #F6802C (~6.5:1), #F15927 (~5.8:1), #F4A333 (~7.0:1)
- [ ] T014 [P] Verify draw call count remains under 30 steady-state via browser DevTools renderer.info
- [ ] T015 Verify keyboard navigation: Tab through sidebar, confirm all 3 Coney buttons are reachable and open correct panels
- [ ] T016 Run quickstart.md validation steps (all 6 verification items)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately. BLOCKS all user stories.
- **US1+US4 (Phase 2)**: Depends on Phase 1 (parent entry must be removed before 3 new entries are inserted)
- **US2 (Phase 3)**: Depends on Phase 2 (odd-map color shift is independent but should follow star insertion for visual validation)
- **US3 (Phase 4)**: Depends on Phase 2 (zone atmosphere should match Coney presence)
- **Polish (Phase 5)**: Depends on all phases complete

### User Story Dependencies

- **US1 + US4 (P1)**: Co-dependent — stars need sidebar buttons for accessibility. Both in Phase 2.
- **US2 (P2)**: Independent of US1 data (only touches odd-map's accentColor), but visual validation requires US1 stars present.
- **US3 (P3)**: Independent — only touches zone atmosphere properties. Can be skipped entirely if owner prefers conservative approach.

### Within Phase 2 (US1 + US4)

- T004, T005, T006 are sequential (same file section in js/data.js — insert in order)
- T007 depends on T004-T006 (projectIds reference the new entries)
- T008 is parallel [P] (different file: index.html)

### Parallel Opportunities

```
Phase 1: T001 + T002 in parallel (different files: data.js, data-content.js)
          T003 sequential after T001 (same file, same section)

Phase 2: T004 → T005 → T006 → T007 sequential (same file section)
          T008 in parallel with T004-T007 (different file)

Phase 3: T009 can run in parallel with Phase 2 T008 (different file section)

Phase 4: T010 sequential after T009 (same file section)

Phase 5: T011, T012, T013, T014 all parallel (verification tasks, read-only)
          T015 sequential (keyboard nav test)
          T016 sequential (full validation)
```

---

## Implementation Strategy

### MVP First (US1 + US4 Only)

1. Complete Phase 1: Remove parent `coney-island` (3 tasks)
2. Complete Phase 2: Add 3 stars + sidebar buttons (5 tasks)
3. **STOP and VALIDATE**: Open each panel, check metrics, test keyboard nav
4. Deploy if ready — Coney projects are now individually discoverable

### Incremental Delivery

1. Phase 1 + Phase 2 → 3 individual Coney stars with metrics + keyboard nav (MVP)
2. Phase 3 → odd-map color shift for visual clarity
3. Phase 4 → Zone atmosphere polish
4. Phase 5 → Full verification pass

### Single Developer Strategy (Recommended)

All tasks are in 3 files. A single developer can complete the entire feature in one session:
1. Edit js/data.js (T001, T003, T004-T007, T009, T010) — ~80 lines changed
2. Edit js/data-content.js (T002) — ~10 lines removed
3. Edit index.html (T008) — ~15 lines changed
4. Visual verification (T011-T016) — ~15 minutes

---

## Notes

- All 16 tasks modify only 3 files: `js/data.js`, `js/data-content.js`, `index.html`
- Zero JS module logic changes — pure data transformation
- The 3 individual content entries already exist in `data-content.js` — no content authoring needed
- All `repo-metrics.json` entries already exist — no metrics pipeline work needed
- Screenshot placeholders (null media) for yo-coney-bot and yo-coney-mobile are acceptable for initial launch
- GitHub links use new org: `github.com/coneyislandpottsville/<repo>`
