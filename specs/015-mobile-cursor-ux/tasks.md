# Tasks: 015 Mobile & Cursor UX Fixes

**Input**: Design documents from `/specs/015-mobile-cursor-ux/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec. Manual testing checklist provided in quickstart.md.

**Organization**: Tasks grouped by user story (P1 modal escape, P2 touch guard, P3 logo fade). Stories can be implemented independently after foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Shared infrastructure that all three user stories depend on

- [ ] T001 Add `isCoarsePointer()` export and `coarsePointerMQL` to `js/pointer-utils.js` — new function returns `window.matchMedia('(pointer: coarse)').matches`; export the MQL for change listeners (research R-007)
- [ ] T002 Add `touch-action: pan-y` CSS rule to `#orb-hitzone` in `css/styles.css` — tells browser to allow vertical panning without blocking touch events; place near existing `#orb-hitzone` styles (research R-005)

**Checkpoint**: Pointer detection utilities and CSS touch hint ready. No visible behavior change yet.

---

## Phase 2: Foundational — Modal DOM Restructure

**Purpose**: Restructure modal HTML and CSS that US1 (modal escape) and US1's swipe-to-dismiss depend on. MUST complete before US1 implementation.

- [ ] T003 Add `.overlay__header` wrapper element in `index.html` — wrap existing `<button class="overlay__close">` (line 348) inside a new `<div class="overlay__header">` between `.overlay__frame` open tag and `.overlay__content`. Keep close button as child of header. Structure becomes: `.overlay__frame > .overlay__header > .overlay__close` + `.overlay__frame > .overlay__content > [all existing content]`
- [ ] T004 Convert `.overlay__frame` to CSS Grid layout in `css/styles.css` — change `.overlay__frame` (line 1359) to `display: grid; grid-template-rows: auto 1fr;`. Remove `overflow-y: auto` from `.overlay__frame`. Add `overflow-y: auto` to `.overlay__content`. Add `.overlay__header` styles: `position: relative; padding: var(--space-sm); display: flex; justify-content: flex-end;` (research R-002)
- [ ] T005 Update mobile overlay CSS in `css/styles.css` — in the `<768px` media query (line 1837), update `.overlay__frame` mobile overrides to work with new grid layout. Add `max-height: 100dvh` with `100vh` fallback. Add `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` to `.overlay__frame` for notched devices (FR-005). Adjust `.overlay__close` position to work within `.overlay__header`
- [ ] T006 Update `js/panel.js` header DOM reference — in `initPanel()` (around line 394), acquire `overlayHeaderEl = overlayEl.querySelector('.overlay__header')` ref. Verify `closeBtn` ref still works (should be found via `.overlay__close` selector inside header). Verify `updateFocusableElements()` still finds close button via querySelectorAll

**Checkpoint**: Modal has sticky header with always-visible close button. Scroll content independently of header. All existing keyboard nav and focus trap still works.

---

## Phase 3: User Story 1 — Modal Escape on Coarse-Pointer Devices (Priority: P1) MVP

**Goal**: Users on coarse-pointer devices can always close project modals — close button always visible, backdrop tap works, swipe-to-dismiss from header, iOS scroll lock prevents bounce.

**Independent Test**: Open any project modal on a phone or DevTools touch emulation. Scroll content to bottom — close button stays visible at top. Tap backdrop — modal closes. Swipe down from header — modal closes. No iOS rubber-band bounce behind modal.

### Implementation for User Story 1

- [ ] T007 [US1] Replace body scroll lock in `js/panel.js` with iOS-safe `position: fixed` pattern — in `showProjectPanel()` (line 312-317): save `window.scrollY` to module-level `_savedScrollTop`, set `document.documentElement.style.overflow = 'hidden'`, set `document.body.style.position = 'fixed'`, `document.body.style.width = '100%'`, `document.body.style.top = -_savedScrollTop + 'px'`. In `closeProjectPanel()` (line 330-348): reverse all styles, call `window.scrollTo(0, _savedScrollTop)` before re-enabling ScrollTrigger (research R-001)
- [ ] T008 [US1] Create `js/panel-swipe.js` — new module (~35 lines). Export `initSwipeGesture(headerEl, contentEl, dismissFn)`. On `touchstart` on headerEl: record `{ startY: touch.clientY, active: true, contentScrolled: false }`. Listen for `scroll` event on contentEl — if fired, set `contentScrolled = true` and cancel swipe. On `touchmove`: accumulate vertical delta, only track if `!contentScrolled`. On `touchend`: if `active && !contentScrolled && deltaY > 80`, call `dismissFn()`. Clean up state after each gesture cycle. Check `prefers-reduced-motion` — if active, skip any dismiss animation (instant close) (research R-006, FR-004)
- [ ] T009 [US1] Wire swipe-to-dismiss in `js/panel.js` — import `initSwipeGesture` from `./panel-swipe.js`. In `initPanel()`, after acquiring overlayHeaderEl (T006), call `initSwipeGesture(overlayHeaderEl, overlayContentEl, closeProjectPanel)` where `overlayContentEl = overlayEl.querySelector('.overlay__content')` (FR-004)
- [ ] T010 [US1] Verify backdrop tap target guard in `js/panel.js` — confirm existing handler at line 409 (`backdropEl.addEventListener('click', closeProjectPanel)`) only fires when backdrop itself is the target. The current implementation attaches directly to `.overlay__backdrop` which sits behind `.overlay__frame` in z-order — clicks on frame content cannot reach backdrop. Add a defensive `if (e.target !== backdropEl) return;` guard to the handler if not already present (FR-003, research R-009)

**Checkpoint**: Modal escape fully functional on coarse-pointer devices. Close button always visible (sticky header), backdrop tap closes, swipe from header dismisses, iOS scroll lock prevents bounce, safe-area insets respected.

---

## Phase 4: User Story 2 — Scroll Without Accidental Star Taps (Priority: P2)

**Goal**: Scrolling through the star field on coarse-pointer devices never accidentally opens a project modal. Deliberate taps still work.

**Independent Test**: On a phone or touch emulation, scroll up and down through the star field — no modals open. Tap a star deliberately (quick stationary touch) — modal opens.

### Implementation for User Story 2

- [ ] T011 [US2] Create `js/touch-guard.js` — new module (~30 lines). Export `initTouchGuard(hitzone, onValidTap)`. Import `isCoarsePointer` from `./pointer-utils.js`. Guard: if `!isCoarsePointer()` return early (fine-pointer devices keep existing click behavior). On `touchstart` (passive: true): record `{ x: touch.clientX, y: touch.clientY, time: Date.now(), cancelled: false }`. On `touchmove` (passive: true): compute deltaX/deltaY from start; if `Math.abs(deltaY) > Math.abs(deltaX)` (vertical-dominant scroll), set `cancelled = true` immediately (FR-008); else if `Math.sqrt(dx*dx + dy*dy) > 10`, set `cancelled = true` (FR-007). On `touchend`: if `!cancelled && (Date.now() - startTime) < 300 && (Date.now() - startTime) > 0`, call `onValidTap()`; if `cancelled` or `(Date.now() - startTime) > 500`, ignore (FR-009, FR-010). Clear state after touchend
- [ ] T012 [US2] Replace inline touch handlers in `js/scene.js` with touch-guard — remove the `touchstart` listener (lines 168-174) and `touchend` listener (lines 176-190). Import `initTouchGuard` from `./touch-guard.js`. After the existing `click` listener block (line 165), call `initTouchGuard(hitzone, () => { raycaster.setFromCamera(mouse, camera); /* same raycasting + star-click dispatch logic from removed touchend handler */ })`. Keep the mouse coordinate update inside touch-guard's touchstart (pass mouse ref or update from within callback). Ensure desktop click handler (lines 148-165) remains unchanged (FR-018)
- [ ] T013 [US2] Update mouse coordinate tracking for touch-guard in `js/scene.js` — the touch-guard needs to update the Three.js `mouse` vector on `touchstart` (same calculation as removed line 171-172: `mouse.x = (touch.clientX / window.innerWidth) * 2 - 1; mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1`). Either pass `mouse` ref to `initTouchGuard` for direct update, or update mouse in the `onValidTap` callback before raycasting. Ensure `mouse.set(-9999, -9999)` reset still happens after raycasting (from removed line 189)

**Checkpoint**: Scrolling on coarse-pointer devices never opens modals. Deliberate taps work. Desktop click behavior unchanged. Long-press does nothing.

---

## Phase 5: User Story 3 — Logo Fade-Out and Smooth Rotation (Priority: P3)

**Goal**: Desktop logo fades out smoothly when cursor leaves star field (no snap-back). Rotation is stable at all speeds. Reticle handoff is debounced. Reduced-motion respected.

**Independent Test**: On desktop with mouse — move cursor into star field (logo follows), move out (logo fades at position, no snap-back), move back in (logo fades in at cursor). Move slowly — no rotation jitter. Glide along constellation lines — no spinning. Enable `prefers-reduced-motion` — all transitions instant.

### Implementation for User Story 3

- [ ] T014 [P] [US3] Add logo opacity fade helpers in `js/logo-follow.js` — add module-level `let logoOpacityTween = null;` and `let logoHasEngaged = false;`. Create `function fadeLogoOut(gsap)`: kill existing tween via `if (logoOpacityTween) logoOpacityTween.kill()`, check `prefers-reduced-motion` — if active set `logoEl.style.opacity = '0'` directly, else create `logoOpacityTween = gsap.to(logoEl, { opacity: 0, duration: 0.2, ease: 'power2.out' })`. Create `function fadeLogoIn(gsap)`: same pattern but target opacity 1, duration 0.15. Both functions handle non-stacking per FR-016 (research R-003)
- [ ] T015 [P] [US3] Add reticle debounce in `js/logo-follow.js` — add module-level `let reticleDebounceTimer = null;`. Replace `reticle-activate` listener (lines 68-71): on event, if timer exists call `reticleDebounceTimer.revert()`; set `reticleDebounceTimer = gsap.delayedCall(0.08, () => { fadeLogoOut(gsap); paused = true; })`. Replace `reticle-deactivate` listener (lines 72-74): if timer exists, call `reticleDebounceTimer.revert()` + set to null (activate was pending, cancel it); else set `paused = false` + `fadeLogoIn(gsap)` (research R-004, FR-015)
- [ ] T016 [US3] Replace `logoReturnHome()` with fade-out in `js/logo-follow.js` — in `onMouseLeave()` (line 133-137): replace `logoReturnHome(gsap)` call with `fadeLogoOut(gsap); logoFollowing = false;`. Remove the `hitzone.style.cursor = 'crosshair'` line (cursor resets when logo is not following). In `onDocMouseLeave()` (line 139-143): same replacement. In `onTouchEnd()` (line 181-183): same replacement. The `logoReturnHome()` function body can be simplified to just the fade-out or removed entirely if no longer called. Remove `logoReturning` flag usage since there's no return animation (FR-011)
- [ ] T017 [US3] Update `engageLogo()` for fade-in in `js/logo-follow.js` — in `engageLogo()` (line 103-113): after setting position and adding `.logo--following` class, call `fadeLogoIn(gsap)`. Set `logoHasEngaged = true`. Kill any in-progress fade-out before engaging. The `onMouseEnter()` and `onMouseMove()` fallback paths that call `engageLogo()` will now trigger fade-in automatically (FR-009, FR-012)
- [ ] T018 [US3] Increase rotation `minDelta` threshold in `js/logo-follow.js` — change `const minDelta = 2;` (line 85) to `const minDelta = 6;`. This prevents rotation recalculation on sub-6-pixel movements, eliminating tremor-induced jitter while keeping rotation responsive during normal cursor movement (FR-014, research R-003)
- [ ] T019 [US3] Update `resetOnResize()` in `js/logo-follow.js` — the current `resetOnResize()` (lines 240-258) calls code paths that reference `logoReturning` and return-home logic. Update to: kill any opacity tween, set opacity to empty string (CSS default), reset `logoFollowing = false`, `logoHasEngaged = false`, clear transform and position. Ensure logo returns to header band visually on resize (FR-013)
- [ ] T020 [US3] Verify `isFollowing()` export and cursor logic in `js/scene.js` — scene.js line 386 uses `isLogoFollowing()` for cursor style. After T016 changes, `logoFollowing` is set to false on fade-out (not on return-home completion). Verify the cursor still switches between `'none'` (when following) and `'crosshair'` (when not) correctly. The timing should be the same since `logoFollowing` is set false immediately in both old and new code

**Checkpoint**: Logo fades smoothly on desktop. No snap-back to header. Rotation stable at all speeds. Reticle handoff debounced — no flicker near stars. Reduced-motion produces instant state changes. Page load shows logo in header band.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories and edge cases

- [ ] T021 [P] Verify reduced-motion handling across all three stories — enable `prefers-reduced-motion: reduce` in browser DevTools. Test: (1) logo fade is instant show/hide, (2) swipe-to-dismiss closes instantly, (3) modal open/close is instant. All three must honor the preference per FR-017 and constitution Principle III
- [ ] T022 [P] Verify keyboard navigation and focus trap — test on desktop: Tab cycles through modal focusable elements, Shift+Tab reverses, Escape closes modal. Verify close button is first focusable element in the new `.overlay__header` structure. Verify `updateFocusableElements()` in panel.js still finds all elements after DOM restructure (FR-019)
- [ ] T023 [P] Verify safe-area rendering on notched devices — test on iPhone 12+ (or DevTools simulation with safe-area insets): modal header and close button are not obscured by notch/Dynamic Island. Content respects bottom safe-area (home indicator) (FR-005)
- [ ] T024 Cross-story integration test — on a coarse-pointer device: scroll through star field (no accidental taps per US2), deliberately tap a star (modal opens per US2), scroll modal content (close button stays visible per US1), tap backdrop (modal closes per US1), verify scroll position preserved (no jump). On desktop: click star (modal opens, logo state unaffected per US3), close modal, verify logo resumes following
- [ ] T025 Verify scroll position preservation — open modal, note background scroll position, close modal. Verify page returns to exact same scroll position. Test on iOS Safari specifically for rubber-band bounce. Test with ScrollTrigger re-enable after close (FR-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T002 (CSS) and T003 (HTML) — BLOCKS US1
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 1 (T001 pointer-utils) only — can run in PARALLEL with Phase 2 and Phase 3
- **Phase 5 (US3)**: NO dependencies on Phase 1-4 — can run in PARALLEL with all other phases
- **Phase 6 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Modal Escape)**: Requires Phase 2 foundational DOM restructure. Cannot start without `.overlay__header`.
- **US2 (Touch Guard)**: Requires T001 (`isCoarsePointer()`). Independent of US1 modal changes.
- **US3 (Logo Fade)**: Fully independent. Touches only `js/logo-follow.js` + minor scene.js verification. Can start immediately.

### Within Each User Story

- US1: T007 (scroll lock) and T008 (swipe module) can run in parallel → T009 (wire swipe) depends on T008 → T010 (verify backdrop) is independent
- US2: T011 (touch-guard module) → T012 (wire in scene.js) depends on T011 → T013 (mouse coords) depends on T012
- US3: T014 (fade helpers) and T015 (debounce) can run in parallel → T016 (replace return-home) depends on T014 → T017 (engage fade-in) depends on T014 → T018 (rotation threshold) is independent → T019 (resize) depends on T016 → T020 (verify cursor) depends on T016

### Parallel Opportunities

- **Across stories**: US2 and US3 can run in parallel from the start. US1 starts after Phase 2.
- **Within Phase 1**: T001 and T002 can run in parallel (different files)
- **Within US1**: T007 and T008 can run in parallel (different files)
- **Within US3**: T014, T015, and T018 can all run in parallel (same file but independent sections)
- **Within Phase 6**: T021, T022, T023 can run in parallel (different test scenarios)

---

## Parallel Example: User Story 3

```
# Launch independent tasks together:
Task T014: "Add logo opacity fade helpers in js/logo-follow.js"
Task T015: "Add reticle debounce in js/logo-follow.js"
Task T018: "Increase rotation minDelta threshold in js/logo-follow.js"

# Then sequential tasks:
Task T016: "Replace logoReturnHome() with fade-out" (depends on T014)
Task T017: "Update engageLogo() for fade-in" (depends on T014)
Task T019: "Update resetOnResize()" (depends on T016)
Task T020: "Verify isFollowing() export" (depends on T016)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational DOM restructure (T003-T006)
3. Complete Phase 3: US1 Modal Escape (T007-T010)
4. **STOP and VALIDATE**: Test modal on coarse-pointer device — can you always close it?
5. This alone solves the critical usability blocker (users trapped in modals)

### Incremental Delivery

1. Setup + Foundational → Modal structure ready
2. Add US1 (Modal Escape) → Test independently → Critical blocker resolved
3. Add US2 (Touch Guard) → Test independently → No more accidental opens
4. Add US3 (Logo Fade) → Test independently → Desktop polish complete
5. Polish phase → Cross-story integration validated

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 Setup together
2. Once Setup is done:
   - Developer A: Phase 2 (Foundational) → US1 (Modal Escape)
   - Developer B: US2 (Touch Guard) — can start immediately after T001
   - Developer C: US3 (Logo Fade) — can start immediately, no dependencies
3. Phase 6 (Polish) after all stories merge

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- US3 is fully independent — can be implemented and merged separately if desired
- US2 has minimal dependency (only T001 from Setup)
- US1 has the heaviest dependency chain (needs DOM restructure first)
- No test tasks generated (not explicitly requested; quickstart.md provides manual testing checklist)
- Module line counts verified: all stay within 400-line constitution limit with extraction strategy
