# Feature Specification: Scroll-Driven Exploration & Remaining Polish

**Feature Branch**: `004-scroll-exploration-polish`
**Created**: 2026-03-04
**Status**: Reviewed
**Version**: 1.0.0
**Input**: Complete all outstanding items from REVIEW.md — scroll-driven exploration (P1), logo-cursor desync fix (P1), star label clipping fix, Y-axis star scaling on portrait devices, and constellation zones professional language. Defer nothing.

**Review History**:
- v0.2.0 → v1.0.0: Incorporated amendments from 6-specialist team review (all APPROVED WITH AMENDMENTS). Key changes: pinless scroll architecture, ShaderMaterial migration for nebula hue, 300px scroll distance alignment, static label anchors, logo fix scope clarification, concrete zone colors.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Logo Tracks Cursor Reliably in All Scenarios (Priority: P1)

The brand logo follows the user's cursor across the starfield viewport with no desynchronization. When the cursor exits the viewport, the logo animates smoothly back to its header-band home position. After a browser resize, the logo system recalibrates — the next cursor entry re-engages the logo at the correct position with no offset, drift, or stuck state.

**Why this priority**: The logo-cursor follow is the first interactive element visitors encounter. A desynchronized logo (offset from cursor, stuck in wrong position, failing to return home) signals broken quality immediately. This must work flawlessly in all scenarios: viewport exit/re-entry, resize, tab switch, and rapid mouse movement.

**Independent Test**: Move the cursor into the starfield, verify logo follows, move cursor out of the viewport entirely, verify logo returns to header, resize the browser window, move cursor back in — logo must re-engage perfectly aligned with cursor.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded and the reveal sequence has completed, **When** the user moves their cursor into the starfield, **Then** the logo snaps to the cursor position and follows it smoothly with no offset.
2. **Given** the logo is following the cursor, **When** the user moves the cursor out of the browser viewport entirely (not just the hitzone — out of the browser window), **Then** the logo animates back to its header-band home position within 400ms.
3. **Given** the logo has returned to its home position, **When** the user moves the cursor back into the starfield, **Then** the logo re-engages at the cursor's current position with no offset or delay.
4. **Given** the logo is following the cursor, **When** the user resizes the browser window, **Then** the logo returns to its home position immediately (recalculated from the header band's new bounding rect). No stuck-in-wrong-position state.
5. **Given** the browser has been resized while the logo was at its home position, **When** the user next enters the starfield with their cursor, **Then** the logo engages at the correct cursor position — home coordinates are fresh from the current layout.
6. **Given** the logo is mid-return-animation (animating back to home), **When** the user moves the cursor back into the starfield before the animation completes, **Then** the in-progress return animation is killed and the logo immediately re-engages at the cursor position.
7. **Given** the user switches tabs and returns, **When** the cursor is inside the starfield viewport, **Then** the logo re-engages correctly without being stuck at a stale position from before the tab switch.
8. **Given** the portfolio is on a touch device, **When** the user touches and drags within the starfield, **Then** the logo follows the touch point and returns home on touch release — with no desync after device rotation.

---

### User Story 2 — Scroll Through the Starfield to Discover Projects (Priority: P1)

A visitor scrolls down the page and the starfield responds: the nebula rotates, colors shift through distinct zones, and project groups are highlighted sequentially. Each scroll zone spotlights a cluster of related projects, giving the visitor a guided tour through the portfolio. The three-panel desktop layout (left nav, center starfield, right status) remains fixed in the viewport while a scroll-spacer element behind it drives scroll progress. On mobile, the same scroll-driven experience works within the single-column layout.

**Why this priority**: This is the primary remaining feature gap. ScrollTrigger is imported but never activated, `CONSTELLATION_ZONES` data exists but is unwired, and `overflow: hidden` on `html`, `body`, and `#app-shell` prevents any scrolling at all. Without this, the portfolio is a single static screen with no scroll narrative.

**Independent Test**: Load the portfolio, scroll down, and confirm the nebula visually changes (rotation and color) as you pass through three distinct zones, with corresponding project stars brightening in each zone.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded and the reveal sequence has completed, **When** the user scrolls down, **Then** the page scrolls smoothly and the starfield scene remains fixed in the viewport while scroll progress drives visual changes.
2. **Given** the user is scrolling through the first zone (25%–50% scroll progress), **When** they reach this range, **Then** the nebula shifts toward blue-violet hues and the stars for odd-ai-reviewers, repo-standards, and odd-self-hosted-ci visually brighten via scale increase to 1.3x their base size.
3. **Given** the user is scrolling through the second zone (50%–75% scroll progress), **When** they reach this range, **Then** the nebula shifts toward warm-gold hues and the stars for ado-git-repo-insights and odd-fintech visually brighten.
4. **Given** the user is scrolling through the third zone (75%–90% scroll progress), **When** they reach this range, **Then** the nebula shifts toward green-teal hues and the stars for odd-map and coney-island visually brighten.
5. **Given** the user scrolls back up, **When** they return to a previous zone, **Then** the nebula color and star highlights revert to match that zone's state — the transitions are fully reversible.
6. **Given** the user has `prefers-reduced-motion: reduce` enabled, **When** they scroll, **Then** nebula color changes apply instantly (no animated transition), nebula rotation is suppressed, and star scale changes are suppressed — content remains fully accessible.
7. **Given** the scroll-driven scene is fixed in the viewport, **When** the total scroll distance for the scroll-spacer is measured, **Then** it does not exceed 300px (per constitution Scroll Pin Constraint).
8. **Given** the portfolio loads on a mobile device (<768px), **When** the user scrolls, **Then** zone-based color transitions occur instantly (snap, not lerp) on the starfield.

---

### User Story 3 — Hover Stars Near Sidebar Edges Without Label Clipping (Priority: P2)

A visitor hovers over a star positioned near the left or right sidebar edge. The hover label appears fully visible, not clipped by the sidebar boundary. Labels for edge-positioned stars extend over the sidebar area when needed.

**Why this priority**: Currently `#star-labels` is confined inside `#main-viewport` (center grid column), causing labels for stars at x < -1 or x > 1 to clip at the sidebar boundary. This degrades the hover experience for 3–4 of the 7 stars.

**Independent Test**: Hover over the odd-fintech star (x=-2.2, leftmost) and the repo-standards star (x=2.2, rightmost) on a 1920x1080 viewport and confirm both labels appear fully visible without clipping.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded on desktop, **When** the user hovers over a star positioned behind or near the left sidebar (e.g., odd-fintech at x=-2.2), **Then** the hover label appears fully visible, extending over the sidebar area if needed.
2. **Given** the portfolio is loaded on desktop, **When** the user hovers over a star positioned behind or near the right sidebar (e.g., repo-standards at x=2.2), **Then** the hover label appears fully visible without right-edge clipping.
3. **Given** the label container has been repositioned for full-viewport coverage, **When** the user clicks through sidebar navigation buttons, **Then** sidebar buttons remain clickable — the label overlay does not block pointer events on interactive elements.
4. **Given** the portfolio is loaded on mobile (<768px), **When** sidebars are hidden, **Then** star labels appear without any clipping (mobile layout has no sidebar obstruction).

---

### User Story 4 — View All Stars Spatially Distributed on Portrait Devices (Priority: P2)

A visitor opens the portfolio on a portrait-oriented device (phone or tablet in portrait mode). All 7 project stars remain visible and maintain a natural spatial distribution. Stars are not vertically compressed into a tight cluster — the Y-axis scales proportionally to the aspect ratio change.

**Why this priority**: Currently only the X-axis is scaled during responsive resizing. On portrait mobile (aspect ratio < 1:1), this produces a vertically-oriented star cluster where all 7 stars are visible but bunched together. The documented Y-axis scaling formula has not been implemented.

**Independent Test**: Open the portfolio at 390x844 (iPhone 14 Pro dimensions) and confirm stars are distributed across the viewport with visible vertical spacing between them.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded on a 390x844 portrait viewport, **When** the starfield renders, **Then** all 7 stars are visible and vertically distributed across at least 60% of the viewport height (not clustered into 20–30% of the vertical space).
2. **Given** the portfolio is loaded at 1920x1080, **When** the user resizes the browser to 400x800, **Then** the stars smoothly reposition — both X and Y coordinates scale proportionally without sudden jumps.
3. **Given** the user rotates a tablet from landscape to portrait, **When** the viewport changes, **Then** the Y-axis scaling adjusts and stars redistribute vertically within 1 render frame of the resize event.
4. **Given** the Y-axis scaling is active, **When** the minimum Y-scale factor is calculated, **Then** it does not go below 0.8 (clamped floor to prevent excessive vertical compression on extreme aspect ratios).

---

### User Story 5 — Read Professional Brand Language in Constellation Zones (Priority: P3)

A visitor scrolling through the portfolio sees professional brand language in all status text and zone labels. There are no fantasy-themed references like "arcane tools constellation" or "intelligence matrix." Zone names and status messages reflect the portfolio's professional identity. The `constellation` field in each project's data object is an internal identifier and is intentionally retained — it is never displayed to users.

**Why this priority**: Fantasy-themed text undermines the professional credibility of the portfolio when displayed during scroll-triggered zone changes. Once scrolling is implemented these will be visible.

**Independent Test**: Scroll through all three zones and confirm every visible status message uses professional language with no fantasy terminology.

**Acceptance Scenarios**:

1. **Given** the user scrolls into the first zone, **When** the status text updates, **Then** it displays professional language (e.g., "Browsing developer tools...") instead of "scanning arcane tools constellation..."
2. **Given** the user scrolls into the second zone, **When** the status text updates, **Then** it displays professional language (e.g., "Viewing data & analytics...") instead of "interfacing with intelligence matrix..."
3. **Given** the user scrolls into the third zone, **When** the status text updates, **Then** it displays professional language (e.g., "Exploring web & client projects...") instead of "triangulating outpost network..."
4. **Given** the CONSTELLATION_ZONES data is updated, **When** zone names are displayed anywhere in the interface, **Then** they use category-based names (e.g., "Developer Tools", "Data & Analytics", "Web & Client") instead of fantasy names (e.g., "Arcane Tools", "Intelligence Matrix", "Outpost Network").

---

### Edge Cases

- **Scroll during reveal sequence**: If the user scrolls before the reveal completes, the scroll-driven zone changes must not interfere with the reveal animation. Scroll interactions activate only after the reveal sequence finishes.
- **Rapid scroll direction reversal**: If the user rapidly scrolls up and down through zone boundaries, transitions must not stack or produce visual artifacts. Each zone state is discrete — at 300px total scroll distance with snap transitions, zone changes are near-instantaneous and reversal is clean.
- **Zero-scroll-distance viewport**: On viewports where the artificial scroll container height equals the viewport height (no scrollable distance), the scroll-driven features gracefully degrade — the default zone (no zone active) is displayed.
- **Star labels at viewport edges**: Labels for edge-positioned stars (odd-fintech at x=-2.2, repo-standards at x=2.2) use static per-star label anchors (determined at build time from the 7 hard-coded positions) to ensure labels stay within the visible viewport.
- **Y-axis scaling at extreme aspect ratios**: At aspect ratios below 0.4 (extremely tall, narrow viewports), the Y-scale clamp at 0.8 prevents excessive compression but stars may still appear close together — this is acceptable as long as all 7 remain individually distinguishable (minimum 0.18 world-unit separation maintained).
- **Accessibility with scroll zones**: Screen reader users navigating via keyboard should not be affected by scroll-driven visual changes. The `.sr-only` project list remains the primary accessible interface regardless of scroll position. The scroll-spacer element must have `aria-hidden="true"` and `role="presentation"`.
- **Overlay open during scroll**: If the project detail overlay is open when the user scrolls, scrolling must be locked (body scroll prevented) until the overlay is closed — overlay content must not fight with scroll-driven scene changes.
- **Browser back/forward with scroll position**: If the browser restores a scroll position after navigation, the zone state must re-evaluate from the restored scroll position — no stale zone state from before navigation.
- **Logo resize during follow**: If the user resizes the browser while the logo is actively following the cursor, the system fires a resize guard — the logo returns home immediately, preventing a synthetic `mouseleave` from the hitzone layout shift from causing desync.
- **Nebula rotation ownership**: The idle per-layer rotation (in the render loop) and scroll-driven group rotation operate on separate scene-graph levels — the nebula parent group rotates on scroll while individual layers continue their idle drift independently. These compound intentionally to create organic movement.

## Requirements *(mandatory)*

### Functional Requirements

**Logo-Cursor Follow Reliability**

- **FR-001**: The logo MUST follow the cursor with zero visible offset when the cursor is inside the starfield hitzone — the logo's upper-right corner (nose) must track within 2px of the cursor position after the 300ms easing settles.
- **FR-002**: When the cursor leaves the starfield hitzone, the logo MUST animate back to its header-band home position. The home position coordinates MUST be recalculated at animation start time (from `headerBand.getBoundingClientRect()` at call time) to account for layout changes since the last return.
- **FR-003**: When the browser window is resized while the logo is in its home position, the logo MUST remain visually centered in the header band — no stale inline `left`/`top` styles may persist after resize. The resize handler MUST clear any inline positioning styles.
- **FR-004**: When the browser window is resized while the logo is actively following the cursor, the logo MUST return to its home position immediately. The existing GSAP `quickTo` instances do not need recreation — they accept absolute pixel values that self-correct on the next `mousemove` event after re-engagement.
- **FR-005**: When the cursor exits the browser viewport entirely (not just the hitzone), the logo MUST return home. A `document`-level `mouseleave` listener (or `mouseout` with `relatedTarget === null`) MUST detect viewport exit independently of the hitzone's own `mouseleave`.
- **FR-006**: When the cursor re-enters the starfield after a viewport exit, the logo MUST re-engage at the cursor's current position immediately — no lingering stale position from the previous session.
- **FR-007**: When the logo is mid-return-animation and the cursor re-enters the starfield, the return animation MUST be killed immediately and the logo MUST re-engage at the cursor position.
- **FR-008**: On touch devices, the logo MUST follow the touch point during `touchmove` and return home on `touchend`, including after device rotation (resize event recalibrates home position).

**Scroll Architecture (Pinless Approach)**

- **FR-009**: The page MUST use a pinless scroll architecture: `#app-shell` remains `position: fixed` covering the full viewport, with a sibling `#scroll-driver` element providing artificial scroll height. ScrollTrigger reads scroll progress from `#scroll-driver` via `ScrollTrigger.create()` with `onUpdate` — no `pin` property is used. Total scroll-spacer height MUST NOT exceed `window.innerHeight + 300` pixels (300px of scrollable distance per constitution constraint).
- **FR-010**: The starfield scene (canvas, frame, sidebars, command line) MUST remain fixed in the viewport at all times — scroll progress drives visual changes only, the layout never moves.
- **FR-011**: The `overflow: hidden` on `html` and `body` MUST be changed to `overflow-y: auto` once the reveal sequence completes to allow scrolling. The `overflow: hidden` on `#app-shell` and `#main-viewport` MUST remain unchanged.
- **FR-012**: Scroll-driven interactions MUST NOT activate until the reveal sequence has fully completed.
- **FR-013**: A "skip scroll" affordance MUST be present that advances to the end of the scroll-spacer section, visible as a button or keyboard shortcut, fading after 3 seconds. It MUST appear after the reveal sequence completes.

**Zone-Based Nebula & Star Transitions**

- **FR-014**: The nebula hue MUST shift to match the active zone's defined color as scroll progress enters each zone's range. Zone colors are: zone 1 blue-violet (`#6B3FA0`), zone 2 warm-gold (`#B8860B`), zone 3 green-teal (`#1A9E8F`). The nebula material MUST support a custom hue uniform (requiring migration from `PointsMaterial` to a custom `ShaderMaterial` that replicates `PointsMaterial` behavior plus `uZoneColor` and `uZoneInfluence` uniforms). The hue shift MUST use an additive color overlay approach in the fragment shader (~3 ALU, within the 120 ALU/fragment budget).
- **FR-015**: Stars belonging to the active zone's `projectIds` MUST visually brighten by scaling to 1.3x their base `starSize` when their zone is active. Opacity remains locked at 1.0 to preserve additive blending. The 1.3x zone scale preserves headroom for the existing 1.6x hover scale.
- **FR-016**: Stars not in the active zone MUST return to their default visual state (1.0x base scale) when their zone is no longer active.
- **FR-017**: Zone transitions MUST be fully reversible — scrolling backward through zones restores previous visual states.
- **FR-018**: The status panel's status text MUST update to reflect the active zone's `statusText` value when a zone boundary is crossed.
- **FR-019**: The nebula MUST rotate as a group (parent container) around its vertical axis proportionally to scroll progress. Individual nebula layers continue their independent idle drift rotation. Stars MUST remain fixed in position — they do not rotate with the nebula.

**Star Label Clipping Fix**

- **FR-020**: The star label container MUST be repositioned from inside `#main-viewport` to a `position: fixed; inset: 0` element at the body level, with `z-index: 25` (above frame at 10 and HUD panels at 22, below logo-follow at 30).
- **FR-021**: The repositioned label container MUST use `pointer-events: none` so it does not block clicks on sidebar navigation buttons or other interactive elements beneath it.
- **FR-022**: Individual star labels MUST re-enable pointer events (`pointer-events: auto`) on the label element itself. When a label overlaps a sidebar button, the label takes precedence — this is an accepted trade-off since labels are transient hover elements.
- **FR-023**: Labels for the 2–3 stars positioned at viewport edges (odd-fintech at x=-2.2, repo-standards at x=2.2, and ado-git-repo-insights at x=-2.0) MUST use static per-star label anchor overrides (left-anchored instead of default right-anchored) to prevent viewport overflow. No dynamic flip logic is needed — the 7 star positions are hard-coded.

**Y-Axis Star Scaling**

- **FR-024**: Star positions MUST scale on both the X-axis and Y-axis during responsive resizing, proportional to the viewport aspect ratio change from the reference 16:9 ratio.
- **FR-025**: The Y-axis scale factor MUST be clamped to a minimum of 0.8 to prevent excessive vertical compression on extreme portrait aspect ratios.
- **FR-026**: The Y-axis scaling formula MUST be: `yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3)`.
- **FR-027**: Y-axis scaling MUST apply to all star sprites and MUST update within 1 render frame of a resize event. Nebula layers MUST continue using X-only scaling (asymmetric with stars) — this is intentional to prevent star clustering while the nebula fills the viewport horizontally.

**Professional Brand Language**

- **FR-028**: The `CONSTELLATION_ZONES` array `name` field MUST use professional category-based names: "Developer Tools" (zone 1), "Data & Analytics" (zone 2), "Web & Client" (zone 3).
- **FR-029**: The `CONSTELLATION_ZONES` array `statusText` field MUST use professional status messages: "Browsing developer tools..." (zone 1), "Viewing data & analytics..." (zone 2), "Exploring web & client projects..." (zone 3).
- **FR-030**: No visible text anywhere in the interface MUST contain fantasy-themed language when displayed to users during scroll interactions. The `constellation` field in each project's data object (e.g., "The Forge Septet") is an internal identifier never rendered to users and is intentionally retained.
- **FR-031**: Each `CONSTELLATION_ZONES` entry MUST include a `nebulaHueRgb` field containing the zone's RGB color value for direct use by the nebula shader uniform.

**Accessibility & Reduced Motion**

- **FR-032**: When `prefers-reduced-motion: reduce` is active, nebula color zone transitions MUST apply instantly (duration zero, same code path via `gsap.set()`) rather than animated.
- **FR-033**: When `prefers-reduced-motion: reduce` is active, star brightening/scaling within zones MUST be suppressed — stars remain at default visual state. Nebula scroll-driven rotation (FR-019) MUST also be suppressed under reduced motion.
- **FR-034**: Scroll-driven changes MUST NOT affect the `.sr-only` project list or keyboard navigation behavior — these remain independent of scroll position.
- **FR-035**: The scroll-spacer element MUST have `aria-hidden="true"`, `role="presentation"`, and `tabindex="-1"` to prevent screen readers from encountering it as content. The skip-scroll button MUST appear in DOM order before the spacer.

**Performance**

- **FR-036**: Scroll-driven animations MUST maintain 60fps on integrated GPUs (Intel Iris-class) — no ScrollTrigger callback may cause frame drops below 30fps.
- **FR-037**: Zone transition logic MUST add zero additional draw calls to the steady-state budget — zone changes modify existing uniform values and DOM text only. Current steady-state is ~18-19 draw calls.
- **FR-038**: The auto-tier degradation system MUST account for scroll-driven animations — if the benchmark detects frame time exceeding 20ms, zone transitions simplify to instant color swaps (same code path, zero duration via `gsap.set()`). A lightweight 10-frame scroll-time sample SHOULD be collected as a safety net for borderline systems.
- **FR-039**: On mobile devices (<768px), zone transitions MUST be instant (snap, no lerp) since there is no bloom post-processing to soften transitions.

### Key Entities

- **Scroll Driver (`#scroll-driver`)**: A sibling element to `#app-shell` with artificial height (`window.innerHeight + 300` px). Provides scroll progress to ScrollTrigger without pinning. Has `aria-hidden="true"`, `role="presentation"`, `tabindex="-1"`.
- **Constellation Zone**: A defined scroll range (scrollStart/scrollEnd as 0–1 progress values) mapped to a nebula hue RGB value (`nebulaHueRgb`), a set of project IDs, a professional status text message, and a category-based display name. Three zones exist.
- **Star Label**: An HTML `<div>` positioned via 3D-to-screen coordinate projection, displayed on hover. Positioned in a `position: fixed` viewport-level container at `z-index: 25`. Edge-positioned stars use static left-anchored overrides.
- **Nebula ShaderMaterial**: Custom shader material replacing `PointsMaterial`, replicating its behavior plus `uZoneColor` (vec3) and `uZoneInfluence` (float 0–1) uniforms for GPU-side hue overlay. Additive color approach, ~3 ALU cost.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The logo follows the cursor with less than 2px offset in all scenarios — initial entry, re-entry after viewport exit, and re-entry after browser resize — with zero stuck/desync states observable across 10 consecutive enter/exit/resize cycles.
- **SC-002**: All 3 constellation zones produce visible, distinct nebula color shifts when scrolled through — verifiable by scrolling from top to bottom and observing 3 distinct color states (blue-violet, warm-gold, green-teal).
- **SC-003**: 100% of star hover labels are fully visible without clipping on a 1920x1080 desktop viewport, including stars at the leftmost (x=-2.2) and rightmost (x=2.2) positions.
- **SC-004**: All 7 project stars maintain a minimum 0.18 world-unit projected screen-space separation on a 390x844 portrait mobile viewport with Y-axis scaling active.
- **SC-005**: Zero fantasy-themed text strings are present in any user-visible interface element during scroll-driven interactions.
- **SC-006**: Frame rate remains at or above 55fps during continuous scrolling on an integrated GPU (Intel Iris-class) — measured via DevTools Performance panel over 5 seconds of steady scroll.
- **SC-007**: The total scroll distance for the scroll-spacer section is exactly 300px (per constitution constraint).
- **SC-008**: Users with `prefers-reduced-motion: reduce` see zero animated transitions during scrolling — all zone changes are instantaneous, nebula rotation is frozen.
- **SC-009**: The scroll-driven experience is fully reversible — scrolling back up through all zones returns the starfield to its initial visual state with no residual artifacts.
- **SC-010**: Keyboard-only users can access all 7 project details without scrolling — the sidebar navigation and `.sr-only` list remain fully functional regardless of scroll position.

## Assumptions

- The existing GSAP `quickTo` mechanism for logo tracking does not require recreation on resize — it accepts absolute pixel coordinates that self-correct on the next `mousemove` event. The fix is behavioral (return home on resize, document-level exit detection), not mechanical.
- Commit `58be354` ("fix: sidebar z-index stacking + logo re-engagement after viewport exit") already addressed some logo issues. The FR-001–FR-008 requirements must be verified against the current codebase before re-implementing — avoid duplicate work.
- The `constellation` field in project data objects (e.g., "The Forge Septet") is an internal identifier used for code organization only. It is never rendered to users and is intentionally retained with its fantasy-themed values.
- The 300px scroll distance is tight for 3 zones (~75px per zone, approximately one trackpad flick each). Zone transitions must be snap/instant rather than gradual fades to feel responsive at this distance. The 0%–25% dead zone at the start of scroll progress is compressed — the first zone begins responding immediately after scroll starts.
