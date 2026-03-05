# Feature Specification: Sidebar Glyph Language

**Feature Branch**: `008-sidebar-glyph-language`
**Created**: 2026-03-05
**Status**: Draft (Owner decisions applied 2026-03-05: constitution amendment v1.3.0 approved, 8 glyphs confirmed, cursor deferred but logo-follow crispness fix added)
**Input**: User description: "Transform the left and right sidebars from generic UI panels into mathematical manuscripts etched into the interface -- the research notes of the Architect. A comprehensive glyph language system built from the OE golden-ratio logo geometry."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Per-Project Glyph Sigils in Navigation (Priority: P1)

A visitor scrolling the left sidebar navigation sees each of the 7 project entries marked with a unique OE logo glyph rotation or derived symbol instead of generic star icons. Each glyph conveys a narrative archetype (Guardian, Voyager, Sovereign, etc.) that subtly reinforces the project's character. The glyphs are rendered as inline SVGs within the nav buttons, styled in gold-brass tones consistent with the frame aesthetic.

**Why this priority**: This is the single highest-impact visual change -- it transforms the navigation from "generic project list" into "constellation logbook with meaningful sigils." It is the foundational piece that all other glyph features build upon.

**Independent Test**: Can be fully tested by loading the page and visually confirming each of the 7 nav items displays a distinct OE glyph rotation (not a star), correctly colored in brass tones, with proper sizing and alignment. The accessible name of each button remains unchanged.

**Acceptance Scenarios**:

1. **Given** the page loads on a desktop viewport (>=1200px), **When** the left sidebar is visible, **Then** each of the 7 project nav buttons displays its assigned OE glyph SVG (not a Unicode star) at approximately 20x20px, filled with the brass-light color.
2. **Given** a nav button is hovered with a mouse, **When** the glyph is visible, **Then** the inline SVG glyph gains a subtle gold drop-shadow glow matching the existing hover treatment.
3. **Given** a nav button receives keyboard focus (Tab), **When** the focus ring appears, **Then** the glyph gains the same glow treatment as mouse hover (focus-visible parity).
4. **Given** the page is viewed with a screen reader, **When** navigating the project list, **Then** each glyph SVG is hidden from the accessibility tree (aria-hidden="true") and does not interfere with the button's accessible name.
5. **Given** the page loads on mobile (<768px) with the hamburger menu, **When** the nav drawer opens, **Then** the same glyph SVGs appear at mobile-appropriate sizing within the touch-target buttons.

---

### User Story 2 - MSDF Atlas Glyph Watermarks in Sidebar Background (Priority: P2)

Behind the navigation text content, the WebGL sidebar overlay renders the 8 OE glyph variants from a multi-glyph MSDF texture atlas instead of the current single-glyph tiled pattern. Each tile in the background displays a specific glyph selected from the atlas, creating the impression of a mathematical manuscript with varied symbolic notations rather than a repetitive wallpaper.

**Why this priority**: This replaces the existing uniform tiling with a richer, more varied glyph field. It is the WebGL-side counterpart to the HTML inline SVGs and creates the "etched manuscript" depth layer.

**Independent Test**: Can be tested by loading the page and visually confirming the sidebar background shows varied OE glyph forms (different rotations and derived shapes) at 8-10% opacity rather than a uniform repeating pattern.

**Acceptance Scenarios**:

1. **Given** the page loads on desktop, **When** the sidebar overlay renders, **Then** the background glyph tiles show varied glyphs selected from the 8-glyph atlas, not a uniform single-glyph repeat.
2. **Given** the atlas replaces the current MSDF texture, **When** measuring GPU texture memory, **Then** the total texture budget remains under 1MB (net zero or minimal increase from current ~708KB).
3. **Given** the WebGL overlay renders, **When** counting draw calls, **Then** the sidebar still uses exactly 2 draw calls (one per sidebar plane) with no additional geometry.
4. **Given** tiles display varied glyphs, **When** viewed at sidebar scale (~220px wide), **Then** each glyph variant is distinguishable from others at the rendered opacity of 8-10%.

---

### User Story 3 - Enhanced Marginalia: Construction Lines and Organic Imperfection (Priority: P3)

The sidebar backgrounds gain additional procedural construction marks -- compass arcs, tangent lines, measurement ticks -- layered beneath the glyph tiles at very low opacity (3-5%). Each tile has subtle pseudo-random variations in rotation, position, and scale, creating the feeling of hand-drawn mathematical diagrams rather than mechanical repetition.

**Why this priority**: This layer creates the "Renaissance mathematician's notebook" feel. Without it, the glyphs still read as digital tiles. With it, the sidebars feel like working manuscript margins.

**Independent Test**: Can be tested by temporarily increasing construction line opacity to confirm arcs and ticks render, then restoring target opacity to verify the ambient ghost-diagram quality.

**Acceptance Scenarios**:

1. **Given** the sidebar shader renders, **When** construction lines are enabled (Tier 1), **Then** compass arcs, tangent lines, and measurement ticks appear at 3-5% opacity behind the glyph tiles.
2. **Given** multiple glyph tiles render, **When** comparing adjacent tiles, **Then** each tile shows subtle variations: rotation jitter (up to +/-1.5 degrees), position offset (up to +/-1%), and scale variation (up to +/-3%).
3. **Given** three opacity layers exist, **When** measuring visual hierarchy, **Then** glyph watermarks render at 8-10%, equation fragments at 4-7%, and construction lines at 3-5% -- each layer visually distinct.

---

### User Story 4 - Right Sidebar Narrative Evolution (Priority: P4)

The right sidebar status panel evolves its text language from generic telemetry ("MANA", "PHASE IDLE") to phi-themed cosmic instrumentation ("phi DRIFT", "ORBITAL PHASE", "phi = 1.6180339887"). A large, faint Architect watermark (135-degree OE glyph) appears behind the telemetry readout. An Odd Bot HTML element rotates between symbolic orientations in response to meaningful system state changes.

**Why this priority**: This brings the right sidebar into narrative alignment with the glyph language. Without it, the left sidebar speaks the new language while the right sidebar still uses the old vocabulary.

**Independent Test**: Can be tested by loading the page, confirming the new text labels appear, the Architect watermark is faintly visible, and scrolling through zones triggers Odd Bot rotation.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the status panel renders, **Then** status labels read "phi DRIFT", "ORBITAL PHASE", and a "phi = 1.6180339887" constant is displayed.
2. **Given** the terminal scan completes, **When** the final status text appears, **Then** it reads "7 Constellations Active" and "GOLDEN RATIO LOCKED" (not "7 systems nominal" or "PORTFOLIO READY").
3. **Given** the right sidebar WebGL overlay renders, **When** the Architect watermark is visible, **Then** it appears as a large, faint 135-degree OE glyph behind the telemetry at 6-8% opacity.
4. **Given** the Odd Bot element exists in the right sidebar HTML, **When** a zone-change event fires for DevOps Pipeline zone, **Then** the Odd Bot rotates to 90 degrees (Guardian) with a 0.6s elastic spring transition.
5. **Given** a zone-change event fires for Products & Analytics zone, **When** the Odd Bot transitions, **Then** it rotates to 180 degrees (Voyager).
6. **Given** a zone-change event fires for Community & Web zone, **When** the Odd Bot transitions, **Then** it rotates to 270 degrees (Sovereign).
7. **Given** the scroll returns to the top (no active zone), **When** the Odd Bot transitions, **Then** it returns to 135 degrees (Architect, default).

---

### User Story 5 - Hover Brightening: DOM-to-WebGL Bridge (Priority: P5)

When a user hovers or focuses a nav button, the corresponding region of the WebGL sidebar overlay brightens subtly, creating a visual connection between the HTML navigation and the etched glyph background. The brightening uses a radial falloff centered on the hovered item's position, with keyboard focus-visible triggering the same effect.

**Why this priority**: This is the key interactive behavior that connects the two layers (HTML nav and WebGL background) into a unified experience. Without it, the nav and the background feel disconnected.

**Independent Test**: Can be tested by hovering each nav item and confirming a localized brightness increase in the WebGL overlay around the hovered item's vertical position.

**Acceptance Scenarios**:

1. **Given** a nav button is hovered, **When** the mouse enters, **Then** the WebGL overlay brightens in a radial zone centered on that button's Y-position with a 0.15s GSAP tween.
2. **Given** the mouse leaves a nav button, **When** mouseleave fires, **Then** the brightness returns to base over 0.25s.
3. **Given** a nav button receives keyboard focus, **When** focusin fires, **Then** the same brightness magnitude applies, set instantly (no tween) for keyboard responsiveness.
4. **Given** the brightness boost is active, **When** measuring the MSDF glyph in the bright zone, **Then** the glyph anti-aliasing tightens (appears sharper) in addition to the luminance increase.

---

### User Story 6 - Scroll-Driven Equation Shift (Priority: P6)

As the user scrolls through constellation zones, the phi-grid construction lines in the sidebar background shift subtly in the vertical direction, creating a parallax effect that makes the marginalia feel like a separate layer behind the fixed navigation. The glyph tiles themselves do not move -- they are "carved etchings."

**Why this priority**: This adds the final layer of environmental responsiveness that transforms the sidebars from static decoration into a living instrument panel.

**Independent Test**: Can be tested by scrolling slowly through zones and confirming the fine construction lines drift vertically while the glyph tiles remain stationary.

**Acceptance Scenarios**:

1. **Given** the user scrolls through constellation zones, **When** scroll progress changes from 0 to 1, **Then** the phi-grid construction lines offset by up to 0.3 UV units vertically.
2. **Given** the scroll offset applies, **When** observing the glyph tiles, **Then** the MSDF glyph positions remain fixed (no movement -- they are carved).
3. **Given** prefers-reduced-motion is active, **When** the user scrolls, **Then** the construction lines do not shift (scroll offset locked to 0).

---

### User Story 7 - Animation Cleanup: Alive Not Busy (Priority: P7)

The existing shimmer traverse animation is removed entirely. The scan-line sweep converts from a continuous 12-second cycle to an event-triggered one-shot that fires only on zone-change and terminal-scan-complete events. The breathing animation is retained as the sole continuous ambient effect.

**Why this priority**: This clears motion budget for the new interactive behaviors (hover, scroll) while enforcing the "alive, not busy" principle from the design direction.

**Independent Test**: Can be tested by observing the sidebar for 30 seconds with no user interaction -- only breathing should be visible; no shimmer band should traverse and no scan line should sweep unless a zone change occurs.

**Acceptance Scenarios**:

1. **Given** the page is idle after reveal, **When** 30 seconds pass with no interaction, **Then** only the breathing animation (5s sinusoidal luminance at 8% swing) is visible -- no shimmer, no scan line.
2. **Given** a zone-change event fires, **When** the event is dispatched, **Then** a single scan-line sweep traverses the sidebar over 0.8s with power2.inOut easing, then stops.
3. **Given** the shimmer code is removed, **When** inspecting the shader uniforms, **Then** no uShimmerEnabled uniform exists.

---

### User Story 8 - Reveal Sequence Integration (Priority: P8)

During the initial page reveal, the sidebar glyphs appear at t=2.2s (Phase 2, after sidebar content begins fading in) via a bottom-to-top wipe that creates the impression of etchings being inscribed. This completes by t=2.7s (before terminal scan at t=2.8s), well within the 6500ms reveal budget.

**Why this priority**: Without reveal integration, glyphs either pop in abruptly or appear before the sidebars are visible, breaking the narrative of "the console powering up."

**Independent Test**: Can be tested by refreshing the page and observing the glyph reveal timing relative to the sidebar content fade-in.

**Acceptance Scenarios**:

1. **Given** the page loads fresh, **When** the reveal sequence reaches t=2.2s, **Then** the sidebar glyph overlay begins a bottom-to-top wipe reveal over 0.5s.
2. **Given** the reveal wipe runs, **When** the wipe completes at ~t=3.2s, **Then** all glyph tiles are fully visible at their target opacity.
3. **Given** prefers-reduced-motion is active, **When** the page loads, **Then** the glyph overlay appears instantly at full opacity with no wipe animation.
4. **Given** the reveal budget is 6500ms, **When** measuring the glyph reveal timing, **Then** the glyph reveal starts at t=2.2s and ends by t=2.7s -- no budget violation.

---

### User Story 9 - Performance Tier Degradation (Priority: P9)

The glyph system respects the existing 3-tier performance degradation system. At Tier 1, all effects are active. At Tier 2, scroll shifts and complex construction arcs are disabled. At Tier 3, only static glyph display remains with no animations.

**Why this priority**: Without tier degradation, the expanded shader would cause frame drops on integrated GPUs, violating the constitution's performance-first mandate.

**Independent Test**: Can be tested by manually forcing each tier level and confirming the appropriate effects are disabled.

**Acceptance Scenarios**:

1. **Given** performance is at Tier 1 (<20ms avg frame time), **When** all glyph features render, **Then** breathing, hover brightening, scroll shifts, construction arcs, and event-triggered scan-line are all active.
2. **Given** performance degrades to Tier 2, **When** the tier change fires, **Then** scroll-driven shifts and complex construction arcs are disabled; hover brightening becomes instant (no tween); breathing continues.
3. **Given** performance degrades to Tier 3, **When** the tier change fires, **Then** only static glyph display remains -- no breathing, no hover effects, no construction lines beyond basic phi-grid.
4. **Given** the shader ALU budget is <120 at Tier 2, **When** measuring fragment shader complexity, **Then** the Tier 2 shader path stays under 120 ALU instructions per fragment.

---

### User Story 10 - Compliance Fix: High Contrast Mode (Priority: P10)

When the user has prefers-contrast: more active, the WebGL sidebar overlay is completely hidden. This fixes an existing compliance gap with Constitution Principle III, independent of the glyph system feature.

**Why this priority**: This is a constitution compliance fix that should ship regardless of whether the rest of the glyph system is approved. It has no visual impact for standard users.

**Independent Test**: Can be tested by enabling high-contrast mode in OS accessibility settings and confirming the sidebar overlay disappears.

**Acceptance Scenarios**:

1. **Given** the user has prefers-contrast: more enabled, **When** the page loads, **Then** the WebGL sidebar overlay (both left and right planes) is hidden.
2. **Given** prefers-contrast: more is active, **When** the sidebars render, **Then** only the HTML nav content is visible -- no MSDF glyphs, no construction lines, no breathing animation.
3. **Given** the user toggles contrast preference at runtime, **When** the media query changes, **Then** the overlay visibility updates immediately without a page reload.

---

### User Story 11 - Logo Crispness: Replace ASCII-Art SVG with Vector Logo (Priority: P1)

The current `assets/logo.svg` used for the header band brand logo and logo-follow cursor is a massive ASCII-art SVG (~78K tokens, renders as text characters). It is replaced with the clean golden-ratio vector logo from the logo pack (`design-assets/oe-logo-pack-2/logo-135-degrees-100x100.svg`), making the branded cursor-follow experience significantly crisper and the header band logo sharp at all DPR values.

**Why this priority**: P1 because the logo is the brand's visual anchor. A crisp vector logo is a foundational improvement that benefits the entire experience, not just the glyph system. This is a quick win with high visual impact.

**Independent Test**: Can be tested by loading the page and confirming the header band logo renders as a clean vector OE mark (not ASCII art), and the logo-follow cursor displays the same crisp vector logo during mouse movement.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** the header band is visible, **Then** the brand logo displays the clean golden-ratio OE vector mark at 135 degrees, not ASCII art.
2. **Given** the user moves the mouse over the orb hitzone, **When** the logo-follow engages, **Then** the following logo is the crisp vector OE mark at approximately 40x40px.
3. **Given** the new logo SVG is in use, **When** measuring file size, **Then** the logo SVG is under 2KB (vs the current ~78K token ASCII-art version).
4. **Given** the OG meta tag references the logo, **When** the page metadata is inspected, **Then** the og:image references the new clean vector logo.

---

### Edge Cases

- **WebGL context loss during glyph rendering**: The existing context-restore handler must update the new MSDF atlas texture (set `needsUpdate = true`), not just the old single-glyph texture.
- **Sidebar resize during hover**: If the browser window resizes while a hover brightening is active, the hover UV position must be recalculated on the next frame (or cleared to base state).
- **Rapid zone changes during Odd Bot rotation**: If multiple zone-change events fire rapidly (fast scrolling), the Odd Bot rotation must cancel the current tween and start from the current interpolated angle (no queueing).
- **Derived glyph MSDF quality**: Thin open curves (Orbit ring, Spiral arc) may produce MSDF artifacts at small tile sizes. FR-026 mandates stroke-to-fill conversion and msdfgen validation to catch this before atlas composition.
- **Atlas UV cross-cell bleeding**: FR-028 mandates 4px guard padding and UV clamping per cell to prevent bilinear sampling from leaking adjacent glyph data into the current cell.
- **Hover UV invalidation on layout change**: Window resize, hamburger menu toggle, or CSS animation on the sidebar can shift the nav button positions mid-hover. FR-030 mandates ResizeObserver-based rect cache updates and sentinel reset on invalidation.
- **Integrated GPU Tier 1 failure**: If the baseline Intel Iris GPU cannot sustain Tier 1 at 60fps, FR-029 mandates automatic Tier 2 default for integrated GPUs rather than relying solely on the runtime benchmark (which may not catch all edge cases).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display 7 distinct OE glyph variants as inline SVGs in the left sidebar navigation, one per project, replacing the current Unicode star characters.
- **FR-002**: Each glyph SVG MUST be assigned per the narrative mapping: odd-ai-reviewers=Guardian(90 degrees), ado-git-repo-insights=Voyager(180 degrees), repo-standards=Axis(derived), odd-self-hosted-ci=Orbit(derived), odd-map=Origin(0 degrees), odd-fintech=Sovereign(270 degrees), coney-island=Architect(135 degrees).
- **FR-003**: System MUST replace the current single-glyph MSDF texture with an 8-glyph atlas containing 5 rotation variants and 3 derived glyphs (Orbit, Axis, Spiral).
- **FR-004**: The sidebar WebGL shader MUST select individual glyphs from the atlas via UV offset lookup, not uniform tiling of a single glyph.
- **FR-005**: System MUST render three distinct opacity layers in the sidebar shader: glyph watermarks at 8-10%, equation/annotation fragments at 4-7%, and construction lines at 3-5%.
- **FR-006**: Each glyph tile MUST display pseudo-random organic imperfection: rotation jitter (up to +/-1.5 degrees), position offset (up to +/-1%), scale variation (up to +/-3%), and opacity heterogeneity (60-100% of target).
- **FR-007**: The right sidebar status text MUST use phi-themed language: "phi DRIFT" (replaces "MANA"), "ORBITAL PHASE" (replaces "PHASE"), and display "phi = 1.6180339887" as a fundamental constant.
- **FR-008**: The right sidebar MUST display a large, faint Architect watermark (135-degree OE glyph) at 6-8% opacity behind the telemetry readout.
- **FR-009**: System MUST add an Odd Bot HTML element (inline SVG, aria-hidden) to the right sidebar that rotates to 90 degrees on DevOps zone, 180 degrees on Products zone, 270 degrees on Community zone, and 135 degrees on default/top, using a 0.6s elastic.out GSAP transition.
- **FR-010**: Hovering or focusing a nav button MUST trigger a localized brightness increase in the WebGL sidebar overlay via a uHoverUV uniform with radial falloff, using a 0.15s GSAP tween for mouse and instant for keyboard.
- **FR-011**: Scrolling through constellation zones MUST drive a 0.3 UV vertical offset on the phi-grid construction lines only; glyph tiles MUST remain stationary.
- **FR-012**: The shimmer traverse animation MUST be removed entirely from the sidebar shader.
- **FR-013**: The scan-line sweep MUST be converted from a continuous 12s cycle to an event-triggered one-shot (zone-change and terminal-scan-complete events, 0.8s duration, power2.inOut easing).
- **FR-014**: Sidebar glyphs MUST be revealed during the initial sequence at t=2.2s via a bottom-to-top wipe (uRevealProgress uniform, 0.5s duration), completing by t=2.7s (before terminal scan at t=2.8s).
- **FR-015**: System MUST implement 3-tier shader degradation: Tier 1 = all effects (~145 ALU); Tier 2 = drop scroll shifts + complex arcs, instant hover (~113 ALU); Tier 3 = static glyphs only, no normal perturbation (~60 ALU flat shading with edge highlight).
- **FR-016**: System MUST hide the WebGL sidebar overlay when prefers-contrast: more is active (compliance fix for Constitution Principle III).
- **FR-017**: System MUST display static glyphs at base opacity with no animations when prefers-reduced-motion is active. Hover brightening becomes instant (duration zero). Scroll shift is disabled. Reveal wipe is skipped.
- **FR-018**: The sidebar-hieroglyphs.js module MUST be split into a renderer module (~180 lines) and a glyph-compositor module (~200 lines) to stay within the 400-line constitution limit.
- **FR-019**: All glyph SVGs MUST use a normalized square viewBox (300x300 with centered geometry) for consistent sizing in the 20x20px nav button glyph slot.
- **FR-020**: All inline SVG glyphs in nav buttons MUST have aria-hidden="true" and MUST NOT interfere with the button's accessible name.
- **FR-021**: All marginalia (construction lines, compass arcs, measurement ticks) MUST be generated procedurally in GLSL, not via additional texture files (per Constitution Principle VI: Procedural-First Asset Strategy).
- **FR-022**: The terminal scan text MUST change from "7 systems nominal" to "7 Constellations Active", "PORTFOLIO READY" to "GOLDEN RATIO LOCKED", and per-project scans MUST use constellation names instead of project IDs.
- **FR-023**: The glyph color palette MUST use gold-brass tones exclusively (matching existing edge highlight vec3(0.8, 0.66, 0.3) and grid color vec3(0.5, 0.4, 0.25)). No cyan, no project accent colors in sidebars.
- **FR-025**: The header band logo (`#brand-logo`, `assets/logo.svg`) MUST be replaced with a production copy of the clean vector OE logo at 135 degrees (from `design-assets/oe-logo-pack-2/logo-135-degrees-100x100.svg`). The logo-follow cursor, header display, and OG meta image MUST all use this new crisp vector asset.
- **FR-024**: The custom CSS cursor feature is DEFERRED. The existing logo-follow.js physics-based branded cursor is the superior implementation. However, the logo-follow element (`#brand-logo`, currently `assets/logo.svg` -- a massive ASCII-art SVG) MUST be replaced with the clean golden-ratio vector logo from `design-assets/oe-logo-pack-2/logo-135-degrees-100x100.svg` (or a production copy at `assets/logo-oe-135.svg`) to make the existing cursor experience crisper. The header band logo and OG image reference must also be updated.

#### Engineering Guardrails

- **FR-026 (MSDF Compatibility Enforcement)**: All glyph SVGs (rotations and derived) MUST be preprocessed into **single closed filled outlines with no strokes** before MSDF atlas generation. Stroked circles MUST be converted to annular filled paths (outer arc at R0, inner arc at Ri, closed with evenodd fill-rule). Stroked arcs (Spiral) MUST be converted to filled annular sectors. The preprocessing step MUST validate each SVG against msdfgen before atlas composition -- any SVG that fails msdfgen validation MUST be rejected and fixed before proceeding.
- **FR-027 (Deterministic Glyph Normalization)**: All glyph SVGs MUST conform to a canonical geometry rule: `viewBox="0 0 300 300"`, glyph visual center at `(150, 150)`, OE ring outer diameter fixed at 260 units (R0 scaled to 130). This ensures consistent alignment when rendered at 20x20px in nav buttons and at tile scale in the WebGL overlay. A validation check MUST confirm that all 8 glyph SVGs share identical viewBox, centering, and scale before atlas generation -- any drift MUST be corrected before proceeding.
- **FR-028 (Atlas Layout Specification)**: The MSDF atlas MUST use a **4x2 grid with square cells**. Each cell MUST include a guard padding of at least 4px around the glyph content to prevent cross-cell texture bleeding during bilinear sampling. The fragment shader MUST clamp UV coordinates within each cell's padded bounds (i.e., `clamp(cellUV, guardMin, guardMax)`) before sampling the atlas texture. The cell layout order MUST be defined explicitly and documented in a UV map reference (cell indices 0-7 mapped to grid positions).
- **FR-029 (Performance Guardrails)**: A mandatory performance verification step MUST be run on an Intel Iris-class integrated GPU (or equivalent) after shader implementation. If Tier 1 effects exceed the 20ms frame-time budget during the post-reveal benchmark window, the system MUST default to Tier 2 on integrated GPUs -- disabling scroll-driven equation shift and complex construction arcs automatically. This verification gates the feature as shipped: if Tier 1 cannot sustain 60fps on the baseline GPU, Tier 2 becomes the effective default for integrated GPUs without requiring a runtime benchmark regression.
- **FR-030 (Stable DOM-to-WebGL Hover Mapping)**: The hover UV coordinate pipeline MUST be deterministic: compute the hovered nav button's center Y-position from its `getBoundingClientRect()` relative to the sidebar overlay plane's bounding rect, normalize to 0..1 UV space. A `ResizeObserver` on `#constellation-nav` MUST update the sidebar plane rect cache on layout changes. The hover brightness uniform (`uHoverUV`) MUST be reset to the offscreen sentinel `vec2(-1.0, -1.0)` whenever: (a) the nav is off-canvas (mobile hamburger closed, or sidebar scrolled out of view), (b) a layout change invalidates the cached rect before the next recalculation completes, or (c) no button has hover/focus. This prevents stale UV coordinates from producing brightness artifacts at incorrect positions.

### Key Entities

- **Glyph**: A symbolic visual derived from the OE golden-ratio geometry. Has a name (Architect, Guardian, Voyager, Sovereign, Origin, Orbit, Axis, Spiral), a type (full rotation or derived), a rotation angle (0, 90, 135, 180, 270 degrees for rotations; N/A for derived), and an atlas cell index (0-7).
- **Glyph Atlas**: A 512x256 MSDF texture in a 4x2 grid of 128x128 square cells with 4px guard padding per cell. Contains 8 glyph entries (5 rotation variants + 3 derived). ~384KB RGB uncompressed, total texture budget ~900KB (under 1MB). Replaces the current single-glyph logo_msdf.png. UV layout explicitly defined in atlas-uv-map.md.
- **Odd Bot**: An HTML inline SVG element in the right sidebar that displays the OE logo and rotates between symbolic orientations (Guardian 90 degrees, Voyager 180 degrees, Sovereign 270 degrees, Architect 135 degrees) in response to zone-change events.
- **Project-Glyph Mapping**: A data association (stored in data.js) linking each of the 7 projects to a specific glyph via glyphRotation and glyphType fields.

### Assumptions

- The 3 derived glyph SVGs (Orbit, Axis, Spiral) can be produced during implementation by modifying the existing Python logo generator script or by manually editing the existing SVG sources. No external designer is required.
- The msdfgen CLI tool is available or can be installed in the development environment for MSDF atlas generation.
- A 512x256 atlas with 4x2 grid of 128x128 square cells and 4px guard padding provides sufficient MSDF quality for sidebar rendering at ~33px per glyph tile. ~384KB RGB, total texture budget ~900KB (under 1MB).
- The constitution amendment to expand the frozen shader feature list (Principle I) has been approved by the owner (2026-03-05). Amendment to v1.3.0 will be applied during implementation.
- The Odd Bot rotation state machine responds only to zone-change and terminal-scan-complete events, not to per-project hover or click events.
- "Gold ink drafting" is the chosen aesthetic direction (not "cyan terminal phosphor"), as confirmed by the existing brass color palette.
- The current `assets/logo.svg` (ASCII-art SVG, 78K+ tokens) will be replaced with the clean vector OE logo from `design-assets/oe-logo-pack-2/logo-135-degrees-100x100.svg` for the header band logo, logo-follow cursor, and OG image. This makes the existing branded cursor experience crisper without adding a CSS custom cursor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 7 nav buttons display unique OE glyph SVGs instead of Unicode stars, each matching the assigned narrative archetype.
- **SC-002**: The sidebar WebGL overlay uses an 8-glyph MSDF atlas with per-tile glyph selection, producing visually varied glyph backgrounds (not uniform repetition).
- **SC-003**: Three distinct opacity layers (8-10%, 4-7%, 3-5%) are visually distinguishable when temporarily increased to 50% for verification, then correctly subtle at target opacities.
- **SC-004**: Per-tile organic imperfection is perceptible: no two adjacent tiles are rotationally or positionally identical.
- **SC-005**: Right sidebar displays phi-themed telemetry language and the Odd Bot element rotates correctly through all zone states.
- **SC-006**: Hovering/focusing a nav button produces a visible localized brightness increase in the WebGL overlay within 0.3s.
- **SC-007**: Scrolling through zones produces visible parallax drift in construction lines while glyph tiles remain fixed.
- **SC-008**: No shimmer animation is visible. Scan-line fires only on state-change events.
- **SC-009**: The reveal sequence includes a bottom-to-top glyph wipe starting at t=2.2s, completing by t=2.7s (before terminal scan trigger at t=2.8s).
- **SC-010**: Framerate remains at 60fps on Intel Iris-class integrated GPU at Tier 1, with automatic degradation to Tier 2/3 maintaining 30fps+ minimum.
- **SC-011**: Total draw calls remain under 30 steady state. Total texture memory remains under 1MB.
- **SC-012**: prefers-reduced-motion shows static glyphs with no animation. prefers-contrast:more hides the overlay entirely.
- **SC-013**: All modules remain under 400 lines. Total JS module count does not exceed 17.
- **SC-014**: No accessibility regressions: screen reader announces all projects correctly, keyboard navigation works end-to-end, focus indicators remain visible.
- **SC-015**: The header band logo and logo-follow cursor display the clean vector OE mark (under 2KB SVG), not the ASCII-art version.
- **SC-016**: All 8 glyph SVGs pass msdfgen validation with zero errors (no stroked paths, all closed filled outlines).
- **SC-017**: All 8 glyph SVGs share identical viewBox="0 0 300 300" with centered geometry -- verified by automated check before atlas generation.
- **SC-018**: No visible cross-cell bleeding artifacts in the MSDF atlas at any tile size or opacity level. UV clamping within guard-padded cell bounds is verifiable in shader source.
- **SC-019**: On Intel Iris-class integrated GPU, the sidebar shader sustains 60fps at Tier 1 during steady-state idle, or automatically falls back to Tier 2 with no user intervention.
- **SC-020**: Hover brightness correctly tracks the focused/hovered nav button's vertical position after window resize, hamburger menu toggle, and sidebar scroll -- no stale-coordinate artifacts.

## Pre-requisite Assets *(blocking)*

The following assets MUST be created before their dependent implementation tasks can begin. These can be produced during the implementation phase (no external procurement needed), but they gate specific tasks.

### 1. Derived Glyph SVGs (gates: atlas generation, inline SVG insertion)

Three new SVG files derived from the OE golden-ratio geometry:

| Glyph | Construction | Source |
| ----- | ------------ | ------ |
| Orbit | Ring only (outer r=R0, inner r=Ri, stroke S) -- remove stem and E-bars from master geometry | Modify oe_logo_flipped_rotated.py or manually edit existing SVG |
| Axis | Vertical stem only (width=S=38.197, height=2*R0=200) -- remove ring and E-bars | Extract rect element from existing SVG |
| Spiral | Quarter-arc sector from the O ring (90-degree annular arc in top-right quadrant) | New path element using R0 and Ri radii |

All must use **single closed filled outlines with no strokes** for msdfgen compatibility (FR-026). Stroked circles must be converted to annular filled paths. Each SVG must pass `msdfgen` validation before proceeding. Output to `design-assets/oe-logo-pack-2/`.

### 2. Normalized Rotation SVGs (gates: inline SVG insertion in HTML, atlas generation)

The 5 existing rotation SVGs have inconsistent viewBox dimensions:
- 0 deg: 281x200, 90 deg: 200x281, 135 deg: 298.5x298.5, 180 deg: 281x200, 270 deg: 200x281

All must be normalized per FR-027: `viewBox="0 0 300 300"`, glyph center at `(150, 150)`, OE ring outer diameter at 260 units (R0 scaled to 130). Stroked circles must be converted to closed filled annular paths (FR-026). Each normalized SVG must pass msdfgen validation. Output as new files in `design-assets/oe-logo-pack-2/`.

**Validation gate**: An automated check MUST confirm all 8 SVGs (5 normalized rotations + 3 derived) share identical viewBox, centering, scale, and fill-only paths before atlas generation proceeds.

### 3. MSDF Texture Atlas (gates: shader atlas UV implementation)

An 8-glyph MSDF atlas PNG replacing `assets/logo_msdf.png`. Generated via msdfgen CLI from the 8 validated glyph SVGs.

Layout per FR-028: **4x2 grid with square cells**, minimum 4px guard padding around each glyph within its cell. Target size: **512x256** (128x128 per cell, 4 columns x 2 rows). This keeps total texture memory under 1MB (~384KB RGB atlas, ~900KB total). An explicit UV map reference document MUST be produced alongside the atlas, defining cell index to grid position mapping and the padded sampling bounds for each cell.

Dependency: Requires validated assets from pre-req 1 (derived glyph SVGs) and pre-req 2 (normalized rotation SVGs). All SVGs must have passed msdfgen validation before atlas composition.

### 4. Odd Bot Inline SVG (gates: right sidebar HTML changes)

A clean, lightweight inline SVG of the OE logo at 135-degree orientation, styled for HTML embedding (white fill, no xmlns cruft, compact path data). Approximately 40x40px rendered size. Must include a wrapping element suitable for CSS transform: rotate() animation.

### 5. Constitution Amendment v1.3.0 (gates: all shader implementation) -- APPROVED

Owner approval granted (2026-03-05) to expand the frozen shader feature list in Principle I to include: per-glyph atlas selection, atlas UV lookup, hover-driven brightness response, scroll-driven positional shift, event-triggered scan-line mode, and Odd Bot state rotation. Amendment to be applied to `.specify/memory/constitution.md` as a v1.3.0 update during implementation.

### 6. Opacity/Contrast Verification (gates: final opacity tuning)

A static visual verification (screenshot or live prototype) confirming:
- Glyphs are perceptible at 8% opacity over the actual sidebar background (#0d0b09 to #1a1008)
- Nav text (#e8d5a3) maintains >= 4.5:1 contrast ratio when overlaid on glyph regions
- Minimum visible opacity is established (if 6% is imperceptible, raise the floor)
