# Feature Specification: Arcane UX Overhaul

**Feature Branch**: `005-arcane-ux-overhaul`
**Created**: 2026-03-04
**Status**: Reviewed
**Version**: 1.0.0
**Input**: Comprehensive UX overhaul implementing all REVIEW.md enhancements: WebGL sidebar hieroglyph etching with MSDF/SDF logo stamps in 4 orientations and golden ratio construction lines, starfield noise reduction (white-dominant stars with rare chromatic twinkle), project node emphasis (increased glow/size), animated constellation lines between related projects, SVG targeting reticle system for hover interaction, 3-layer parallax depth system, and sidebar material discipline (intentional motion, reduced visual noise). Code cleanup and modularization throughout. Defer nothing.

**Review History**:
- v0.1.0 -> v1.0.0: Incorporated amendments from 5-specialist team review (all APPROVED WITH AMENDMENTS). Key changes: corrected sidebar geometry assumption (no WebGL meshes exist - must be created), fixed MSDF source SVG (geometric OE monogram, not ASCII-art), added roughness modulation to FR-003, constrained glow halos to single-sprite approach (draw call budget), mandated SVG overlay for constellation lines, resolved reticle/logo-follow cursor conflict, added zone transition choreography timing, specified parallax lerp-in-ticker approach, defined per-frame ticker integration pattern, specified reticle z-index/DOM placement, added Tier 2 degradation path, mandated file extraction to meet 400-line limit, disambiguated star vs nebula color treatment, added constitution amendment acknowledgments.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sidebar Hieroglyph Etching (Priority: P1)

New Three.js PlaneGeometry meshes are created and positioned to overlay the CSS sidebar columns. These WebGL sidebar planes display the OddEssentials geometric OE monogram (from the logo generator) etched into their surface as repeating hieroglyph-style stamps in four orientations (0deg, 90deg, 180deg, 270deg). The etching looks carved into the material with lighting-responsive depth, roughness variation, edge highlights, and subtle cavity darkening. A faint golden ratio construction layer (phi-grid lines, spiral arc, phi labels) overlays select stamps. The sidebar material vocabulary is disciplined: no unmotivated glow or noise, only slow intentional motion (breathing light, subtle shimmer, scan pass).

**Why this priority**: The sidebars are first-class scene elements that frame the entire experience. The current sidebar material lacks the "Victorian astronomical instrument" identity. Etched hieroglyphs with golden ratio geometry directly communicate the brand's mathematical design philosophy and elevate the visual quality from decorative to meaningful.

**Independent Test**: Load the portfolio, inspect the left and right sidebars in the WebGL viewport. Confirm the OE monogram appears as tiled etched stamps in 4 orientations. Verify the etching responds to lighting (edge highlights, roughness changes, cavity shadows). Confirm golden ratio construction lines are faintly visible near select stamps. Verify no random glowing or noise artifacts exist on sidebar surfaces.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded and the reveal sequence has completed, **When** the user looks at either sidebar, **Then** the OE monogram is visible as etched stamps tiled across the sidebar surface in a repeating pattern with 4 orientations (0deg, 90deg, 180deg, 270deg) determined by tile position.
2. **Given** the sidebars are displaying etched hieroglyphs, **When** the scene lighting changes (camera movement, scroll-driven nebula hue shifts), **Then** the etching responds with visible normal perturbation (light catches etched edges differently at different angles), roughness modulation (etched region catches light differently than surrounding surface), cavity darkening within the carved region, and a warm brass glint on the edge band.
3. **Given** the sidebar material is rendered, **When** the user observes it over time, **Then** the only animated effects are intentional and slow: a breathing light cycle (5-second period sinusoidal luminance oscillation), a faint shimmer pass (8-second traverse of sidebar height), and an optional scan-line sweep (no more than once every 12 seconds). No random noise, unmotivated glow, or chaotic effects are present.
4. **Given** golden ratio construction lines exist as a faint overlay layer, **When** the user looks closely at the sidebar stamps, **Then** phi-grid lines, a spiral arc aligned with the logo's dominant curve, and occasional tiny labels (phi, 1:phi, phi-squared) are visible near select stamps (not all stamps). These construction lines are shallower, lower opacity, and have different roughness than the logo etching. The construction-line layer MAY be implemented as procedural SDF primitives in the fragment shader, a separate SDF texture, or a combination.
5. **Given** the sidebars use the MSDF/SDF pipeline, **When** the viewport is resized or the DPR changes, **Then** the etched hieroglyphs remain crisp and properly scaled at any resolution without pixelation or blurring. The WebGL sidebar planes reposition to align with the CSS sidebar columns.
6. **Given** the user has `prefers-reduced-motion: reduce` enabled, **When** the sidebars are displayed, **Then** the breathing light, shimmer, and scan-line effects are suppressed. The etched hieroglyphs and golden ratio construction lines remain visible as static elements.
7. **Given** the logo-follow cursor system is active, **When** the cursor enters a star's hover zone and the reticle appears, **Then** the logo-follow system pauses (logo returns home), the system cursor remains hidden, and the reticle becomes the sole cursor-tracking visual element. When the cursor leaves all star hover zones and the reticle fades out, the logo-follow system resumes.

---

### User Story 2 - Targeting Reticle System (Priority: P1)

When the user hovers near a project node (star), a space-game style targeting reticle locks onto the planet. The reticle is an SVG overlay above the WebGL canvas (at z-index 24, between the hitzone and star-labels layers) that visually communicates "this is interactive" and "you are targeting this project." A project name label (accessible to screen readers, not aria-hidden) appears beside the reticle. The reticle animates subtly (rotation, pulse) while locked on. The reticle system takes ownership of star labeling, replacing the existing `showStarLabel()`/`hideStarLabel()` system. The experience transforms the interface from a passive starfield into a navigation instrument.

**Why this priority**: The current hover interaction is a simple scale increase on the star sprite with an HTML label. There is no visual affordance communicating that stars are interactive targets. Visitors cannot distinguish the portfolio from a screensaver. The reticle system is the primary interaction clarifier, turning the crystal ball from decorative into functional.

**Independent Test**: Load the portfolio, move the cursor near a project star. Confirm an SVG reticle appears, locks onto the star center, and a project label appears beside it. Move to a different star and confirm the reticle transfers smoothly. Move away from all stars and confirm the reticle disappears. Confirm the logo-follow system pauses when the reticle is active and resumes when it deactivates.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded and the reveal sequence has completed, **When** the user hovers their cursor near a project node (detected via the existing raycaster with `Sprite.threshold` of 0.15 world units), **Then** an SVG reticle element appears within 100ms, animates to lock onto the node's screen-space center position, and a project name label appears beside the reticle.
2. **Given** a reticle is locked onto a star, **When** the reticle is active, **Then** it displays a subtle idle animation (slow rotation and/or gentle pulse) that communicates targeting without being distracting.
3. **Given** a reticle is locked onto star A, **When** the user moves their cursor to star B, **Then** the reticle smoothly transitions from star A's position to star B's position over 200ms with `power2.inOut` easing. If a third star is targeted during the transition, the in-progress transition is killed and a new one begins from the current interpolated position.
4. **Given** a reticle is locked onto a star, **When** the user moves their cursor away from all stars, **Then** the reticle fades out within 200ms.
5. **Given** the user scrolls through constellation zones, **When** scroll progress highlights different star groups, **Then** the reticle remains functional and correctly tracks star positions even as stars scale up/down during zone transitions.
6. **Given** the reticle is displayed as an SVG overlay, **When** the user clicks on a star that the reticle is targeting, **Then** the click event passes through to the star and opens the project panel normally. The reticle layer does not intercept or block pointer events.
7. **Given** the user has `prefers-reduced-motion: reduce` enabled, **When** they hover near a star, **Then** the reticle appears instantly (no transition animation), has no idle rotation/pulse animation, and jumps instantly between stars with no smooth transition. The label still appears.
8. **Given** the browser window is resized, **When** the user hovers a star after resize, **Then** the reticle correctly tracks the star's updated screen-space position with no offset.
9. **Given** the logo-follow system is active and the cursor enters a star's hover zone, **When** the reticle appears, **Then** the logo-follow system pauses (logo returns home or freezes), the system cursor remains hidden, and the reticle is the sole cursor-tracking visual. When the cursor leaves all star hover zones and the reticle fades out, the logo-follow system resumes.
10. **Given** the portfolio is on mobile (below 768px), **When** the user touches a star, **Then** the reticle SVG is not rendered. Star interaction relies on the existing touch-tap raycast system.

---

### User Story 3 - Starfield Noise Reduction (Priority: P1)

The existing nebula particle palettes are desaturated to create a calmer, deeper-space backdrop. The nebula retains subtle color variation and atmospheric depth but shifts from vivid saturated hues to predominantly muted, near-white tones with low saturation (10-20% of current values). Project nodes (the 7 interactive stars) carry the color identity. A rare chromatic twinkle effect adds occasional sparkle to individual particles. The nebula atmosphere is preserved — this is desaturation, not bleaching to pure white.

**Why this priority**: The current nebula has high-saturation palettes (vivid oranges, purples, teals) combined with additive blending that creates chromatic noise competing with project nodes. Desaturating the nebula while preserving luminance variation establishes the correct visual hierarchy: background is calm, foreground (projects) is vibrant. The nebula remains atmospheric, not dead.

**Independent Test**: Load the portfolio, observe the background. Confirm the nebula has subtle color variation but is predominantly muted/desaturated. Confirm no vivid saturated particles compete with the 7 project nodes. Confirm rare chromatic twinkles occur.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded, **When** the user observes the nebula particles, **Then** the nebula palette colors are desaturated to 10-20% of their current saturation values while preserving luminance variation. The nebula reads as atmospheric and deep without vivid color noise.
2. **Given** the nebula is rendering, **When** a chromatic twinkle occurs on a particle, **Then** it is a brief flash of color (under 500ms) on a single particle, occurring no more frequently than one twinkle every 2 seconds across the entire field.
3. **Given** both nebula particles and project nodes are visible, **When** the user compares them, **Then** project nodes are visually distinct through: larger size (at least 3x the largest nebula particle), project-specific accent colors, and visible glow halos.
4. **Given** the nebula particles are distributed across the viewport, **When** any individual particle renders, **Then** it does not produce persistent chromatic aberration, color glitch, or rainbow effects.

---

### User Story 4 - Project Node Emphasis (Priority: P1)

The 7 project stars are the unmistakable visual anchors of the starfield. They are larger, brighter, and more distinctly glowing than any background element. A visitor immediately understands that these luminous nodes are "the things to interact with." The glow halo is achieved by enlarging the existing star sprite canvas texture to include the halo in a single sprite (no additional draw calls).

**Why this priority**: This is directly tied to portfolio conversion. If a hiring manager cannot immediately distinguish the interactive project stars from decorative background elements, they will not hover, not click, and not see any project details. Node emphasis is the difference between a portfolio and a screensaver.

**Independent Test**: Load the portfolio, confirm the 7 project nodes are immediately visually prominent against the background. Confirm each node has a visible glow halo baked into its sprite. Confirm hovering a node produces a clear size increase.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded and the reveal sequence has completed, **When** the user views the starfield, **Then** each of the 7 project nodes has a visible glow halo that extends beyond the core sprite, making them clearly distinguishable from nebula particles.
2. **Given** the project nodes are displayed, **When** compared to the desaturated nebula, **Then** each node's overall visual footprint (core + halo + glow) is at least 3x larger than the largest nebula particle.
3. **Given** the user hovers a project node, **When** the hover state activates, **Then** the node scales up to at least 1.6x its base size with back-easing animation and its glow halo intensifies. Under `prefers-reduced-motion: reduce`, hover scale is limited to 1.2x applied instantly via `gsap.set()` with no easing animation.
4. **Given** the nebula colors shift during scroll zones, **When** the active zone highlights specific stars, **Then** the highlighted stars brighten and scale to 1.3x while non-highlighted stars dim to opacity 0.5 over 300ms (`power2.out`) to reinforce the active zone's emphasis. Under reduced motion or Tier 3, opacity changes are applied instantly.

---

### User Story 5 - Constellation Lines (Priority: P2)

Thin animated lines connect related project nodes within the same constellation zone, creating visible relationship structures. The lines are implemented as SVG overlay elements sharing the reticle's coordinate projection system (zero WebGL draw call cost). The lines reinforce the "ecosystem narrative" — showing visitors that projects are connected, not isolated. The lines appear/disappear with scroll zones and animate subtly.

**Why this priority**: Without constellation lines, the 7 project stars float in isolation. The portfolio's narrative is about an ecosystem of tools. Constellation lines visually communicate relationships between projects and give the starfield structural meaning. This is important but secondary to the core hierarchy fixes (P1).

**Independent Test**: Scroll through the portfolio zones. In each zone, confirm that thin SVG lines connect the highlighted project stars for that zone. Confirm lines animate (draw on, fade, pulse). Confirm lines disappear or dim when scrolling to a different zone.

**Acceptance Scenarios**:

1. **Given** the user scrolls into a constellation zone, **When** the zone activates, **Then** thin SVG lines draw between the project nodes belonging to that zone (e.g., in the "Developer Tools" zone, lines connect odd-ai-reviewers, repo-standards, and odd-self-hosted-ci). Line endpoints are computed via `project3DtoScreen()` each frame and rendered as SVG `<line>` or `<path>` elements with `pointer-events: none`.
2. **Given** constellation lines are displayed for a zone, **When** the user observes them, **Then** the lines are thin (1-2px visual width), semi-transparent, and colored to match the zone's nebula hue. They do not overpower the project nodes or background.
3. **Given** constellation lines are active, **When** they animate, **Then** the animation is a subtle draw-on effect (SVG `stroke-dashoffset` animated via GSAP) followed by a gentle pulse/glow cycle. The animation is slow and intentional, not frantic.
4. **Given** the user scrolls from Zone A to Zone B, **When** the zone transition occurs, **Then** Zone A's constellation lines fade out over 400ms (`power2.in`), and Zone B's lines begin draw-in after a 100ms overlap (starting at the 300ms mark, not waiting for full completion). Total transition: ~600ms. If the user scrolls to a third zone mid-transition, in-progress transitions are killed immediately, partially-visible lines fade out over 200ms, and the new zone's lines begin after the fast fade. If the user scrolls backwards during a transition, the outgoing lines reverse their fade-out and the incoming lines retract. `gsap.killTweensOf()` MUST be used on outgoing line elements before starting incoming animations.
5. **Given** the starfield is in its default state (no active scroll zone or at the top of the page), **When** the user views the starfield, **Then** no constellation lines are visible. Lines only appear during active zone navigation.
6. **Given** the user has `prefers-reduced-motion: reduce` enabled, **When** a scroll zone activates, **Then** constellation lines appear instantly (no draw-on animation) and have no pulse/glow animation. They remain as static visual connectors.
7. **Given** a `zone-change` CustomEvent is dispatched from the scroll progress handler, **When** the constellation lines module receives it, **Then** the module transitions lines for the new zone without depending on internal state from animations.js.

---

### User Story 6 - Parallax Depth Layers (Priority: P2)

The existing 3 nebula particle layers are redistributed into 3 depth-separated groups (by z-band) with parallax offsets applied per group. No new Points objects are added (zero additional draw calls). Background particles move slowly, mid-layer particles move at medium speed, and foreground particles move faster in response to mouse movement. This creates an immediate sense of three-dimensional space.

**Why this priority**: The current starfield feels flat — all particles exist at roughly the same perceptual depth. Parallax is a high-impact, zero-draw-call-cost way to add dimensionality. It transforms the experience from "stars on a screen" into "looking through an instrument into a universe." Important but secondary to interaction clarity (P1).

**Independent Test**: Load the portfolio, move the mouse across the starfield. Confirm three distinct depth layers are visible: slow background, medium mid-ground, and faster foreground. Confirm the parallax effect is subtle (not nauseating) and stops when the mouse stops.

**Acceptance Scenarios**:

1. **Given** the portfolio is loaded, **When** the user moves their mouse across the starfield viewport, **Then** background nebula particles shift position slowly, mid-layer particles shift at medium speed, and foreground particles shift faster, creating a visible parallax depth effect.
2. **Given** the parallax system is active, **When** the mouse is stationary, **Then** all layers are stationary (no drift or creep). Parallax is purely reactive to mouse position relative to viewport center.
3. **Given** the user moves their mouse rapidly, **When** the parallax responds, **Then** movement is smooth and damped using linear interpolation (lerp) inside the existing `gsap.ticker.add()` callback with configurable per-layer damping factors (background=0.02, mid=0.05, foreground=0.08). Maximum parallax offsets are clamped (background: 0.02 world units, mid: 0.05, foreground: 0.1).
4. **Given** the 3 parallax layers contain redistributed nebula particles, **When** compared visually, **Then** background particles are the smallest and dimmest, mid-layer particles are medium, and foreground particles are the largest and brightest (complementing the depth illusion with scale).
5. **Given** the user has `prefers-reduced-motion: reduce` enabled, **When** the mouse moves, **Then** parallax movement is suppressed. Layers remain static but visible at their rest positions.
6. **Given** the browser is resized, **When** the parallax system updates, **Then** layer positions recalibrate to the new viewport dimensions with no stuck offsets or position jumps.
7. **Given** the viewport crosses the 768px width threshold after page load (e.g., tablet rotation), **When** the parallax module checks the mobile flag, **Then** parallax toggles on/off dynamically. The mobile flag is read on each resize, not cached at initialization.

---

### User Story 7 - Code Cleanup and Modularization (Priority: P2)

All new features are implemented with clean, modular code. Dead code is removed. Existing files are actively refactored to meet the 400-line limit: scene.js (currently 845 lines) has logo-follow (~150 lines), label/hover management, and texture helpers extracted into dedicated modules; animations.js (currently 821 lines) has terminal scan, discoverability, and scroll zone logic extracted; interactions.js (currently 565 lines) has panel management extracted to `panel.js`; performance.js (currently 428 lines) has supernova burst pool extracted to `burst.js`. New functionality is organized into focused modules. The codebase follows boyscout principles: leave it cleaner than you found it. New modules use dependency injection (receiving scene references via `init()` parameters) rather than importing directly from scene.js, preventing circular dependencies.

**Why this priority**: Technical debt compounds. Each feature iteration adds complexity. If the codebase is not cleaned during this iteration, the next feature cycle becomes significantly harder. This is a systemic quality concern that must be addressed alongside the UX features, not deferred.

**Independent Test**: Review the codebase after all features are implemented. Confirm no file exceeds 400 lines. Confirm no dead code remains. Confirm new modules have single responsibilities. Confirm no circular dependencies.

**Acceptance Scenarios**:

1. **Given** all new features are implemented, **When** the codebase is reviewed, **Then** no dead code, unused imports, or commented-out code blocks remain in any JavaScript module.
2. **Given** new functionality is added (constellation lines, reticle system, parallax, sidebar hieroglyphs), **When** the module structure is reviewed, **Then** each major feature has its own dedicated module rather than being appended to existing monolithic files.
3. **Given** existing modules (scene.js, interactions.js, animations.js, performance.js, data.js), **When** the refactoring is complete, **Then** no JavaScript file exceeds 400 lines. Specifically: scene.js has logo-follow logic (~150 lines) extracted to `logo-follow.js`, texture creation helpers extracted to `textures.js`, and star hover/label management absorbed by `reticle.js`. Animations.js has terminal scan logic extracted to `terminal.js`, scroll zone logic extracted to `scroll-zones.js`. Interactions.js (565 lines) has panel management extracted to `panel.js`. Performance.js (428 lines) has supernova burst pool extracted to `burst.js`.
4. **Given** the complete module dependency graph, **When** analyzed, **Then** there are no circular dependencies. New modules receive scene references (starNodes, camera, renderer, etc.) via `init()` function parameters (dependency injection) rather than importing directly from scene.js.
5. **Given** the per-frame ticker in scene.js, **When** new modules need per-frame updates, **Then** each module exports a `tick(elapsed)` function called by a central orchestrator (app.js or a dedicated tick-manager.js) in a defined order: (1) parallax offsets, (2) star/nebula updates, (3) raycasting, (4) reticle position, (5) constellation lines, (6) render.

---

### Edge Cases

- What happens when WebGL context is lost while sidebar hieroglyphs are rendering? The MSDF texture's source Image element MUST be retained in JavaScript memory (not disposed after upload). On `webglcontextrestored`, `texture.needsUpdate = true` triggers re-upload. A brief visual discontinuity during restoration is acceptable.
- What happens when the reticle is targeting a star and the star is near the viewport edge? The reticle and label must not clip outside the visible area.
- What happens when the user scrolls rapidly through all 3 zones? `gsap.killTweensOf()` MUST be called on outgoing zone line elements before starting incoming zone animations, preventing overlap.
- What happens when parallax layers shift and a project node approaches the edge of the viewport? The node must remain fully visible and clickable. Parallax offsets are clamped to prevent gaps.
- What happens on mobile (below 768px)? Parallax is disabled, constellation lines are hidden, reticle is not rendered (touch-tap raycast used instead), sidebar hieroglyphs render but without animated effects.
- What happens when auto-tier degrades to Tier 2? Parallax reduces from 3 to 2 layers (merge background and mid), constellation line pulse/glow animations are suppressed (static lines only), sidebar scan-line sweep is disabled. Reticle and glow halos remain at full quality.
- What happens when auto-tier degrades to Tier 3 (low performance)? Parallax is disabled, constellation line animations are suppressed, reticle animations are suppressed, sidebar shimmer/breathing effects are disabled. Static versions of all visual elements remain.
- What happens if the viewport crosses the 768px width threshold after page load? New feature modules read the mobile flag dynamically on resize, toggling features on/off accordingly.
- What happens with `navigator.hardwareConcurrency <= 2`? Consider treating as low-power regardless of viewport width, suppressing parallax at initialization as an additional signal alongside the auto-tier benchmark.

## Requirements *(mandatory)*

### Functional Requirements

**Sidebar Hieroglyphs**

- **FR-001**: New Three.js PlaneGeometry meshes MUST be created for the left and right sidebars, positioned to overlay the CSS sidebar columns. The meshes MUST synchronize position with CSS grid layout on viewport resize. The sidebar mesh width should extend to cover the visible sidebar region. If the sidebar mesh is narrow (matching the ~18px CSS frame edge width), the tiling rotation formula MUST account for single-column tiling using row index: `rotation = cellY % 4`. For wider sidebar geometry, the standard formula `rotation = (cellX + cellY) % 4` applies.
- **FR-002**: The etched hieroglyphs MUST use an MSDF (Multi-channel Signed Distance Field) texture generated from the geometric OE monogram SVG at `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` (NOT the ASCII-art `design-assets/logo.svg`). The MSDF texture MUST be PNG format, 256x256 resolution (262KB GPU memory), using `THREE.LinearFilter` for both minFilter and magFilter with `generateMipmaps: false`. The MSDF MUST be 3-channel (RGB) or 4-channel (RGBA) with the distance field encoded in the RGB channels per msdfgen conventions. The MSDF texture's source Image element MUST be retained in JavaScript memory for WebGL context restore re-upload.
- **FR-003**: The sidebar fragment shader MUST sample the MSDF texture and produce four output channels: normal perturbation (carved depth), roughness modulation (etched region roughness differs from surrounding surface for differential light catch), cavity darkening (ambient occlusion in carved region), and an edge highlight band with a warm brass glint color.
- **FR-004**: A secondary faint construction-line layer MUST overlay select stamps, rendering phi-grid lines, a spiral arc, and phi labels. This layer MUST be shallower, lower opacity, and have different roughness than the primary etching. The construction-line layer MAY be implemented as procedural SDF primitives in the fragment shader (recommended for phi-grid lines), a separate SDF texture, or a combination, at the implementer's discretion.
- **FR-005**: The sidebar material MUST have exactly three intentional animated effects: a breathing light cycle (5-second period sinusoidal luminance oscillation), a subtle shimmer pass (8-second traverse of sidebar height), and an optional scan-line sweep (no more than once every 12 seconds). All timing is driven by a single `uTime` uniform passed from the GSAP ticker's elapsed time. All other visual noise (unmotivated glow, random noise) MUST be removed. The scan-line sweep is the first effect to drop under performance tier degradation.
- **FR-006**: Sidebar animated effects MUST be suppressed under `prefers-reduced-motion: reduce`. Static hieroglyphs and construction lines remain visible.
- **FR-006a**: The sidebar MSDF ShaderMaterial constitutes a new shader effect not on the constitution's frozen shader list (Principle I). This MUST be acknowledged as a constitution amendment adding "sidebar MSDF hieroglyph etching with normal perturbation, roughness modulation, cavity darkening, edge highlight, breathing light, shimmer pass, and scan-line sweep" to the frozen shader feature list.

**Starfield & Node Hierarchy**

- **FR-007**: The existing nebula particle palettes in `nebulaConfigs` MUST be desaturated to 10-20% of their current saturation values while preserving luminance variation. The nebula retains subtle color hints and atmospheric depth but shifts from vivid saturated hues to predominantly muted tones. The colored nebula particles are NOT replaced with pure white — the desaturation preserves the nebula character at lower chromatic intensity. This addresses the chromatic noise identified in REVIEW.md without destroying the nebula atmosphere.
- **FR-008**: A rare chromatic twinkle effect MUST occur on individual nebula particles: a brief color flash (under 500ms), no more than one twinkle across the entire field every 2 seconds.
- **FR-009**: The 7 project nodes MUST have a visible glow halo achieved by enlarging the existing `createStarTexture()` canvas texture to include the halo in a single sprite (extended radial gradient with slower falloff). This adds zero additional draw calls. The glow halo extends beyond the core sprite, making each node at least 3x larger in visual footprint than the largest nebula particle. This amends the constitution's particle/instance budget (Principle II) from "7 halo sprites created on demand during hover" to "glow halos baked into the star sprite texture, always visible."
- **FR-010**: Project node hover MUST scale the node to at least 1.6x base size with `back.out(3)` easing animation and intensify the glow halo. Under `prefers-reduced-motion: reduce`, hover scale MUST be limited to 1.2x applied instantly via `gsap.set()` with no easing animation. The glow halo intensification is also instant under reduced motion.
- **FR-011**: During scroll-driven zone activation, non-highlighted project nodes MUST dim to opacity 0.5 over 300ms (`power2.out`). Highlighted nodes maintain opacity 1.0. Under reduced motion or Tier 3, opacity changes are applied instantly via `gsap.set()`. This is new behavior complementing the existing scale-only zone activation.

**Targeting Reticle**

- **FR-012**: An SVG-based targeting reticle MUST appear when the user hovers near a project node, triggered by the existing raycaster intersection with `Sprite.threshold` of 0.15 world units. The reticle MUST be rendered as an SVG overlay element positioned above the WebGL canvas at CSS custom property `--z-reticle: 24` (between hitzone at 19 and star-labels at 25). The SVG element is inserted as a sibling to `#star-labels` in the DOM, as a fixed-position overlay. The reticle module takes ownership of star labeling, replacing the existing `showStarLabel()`/`hideStarLabel()` system (which is removed as dead code per FR-032). On mobile (below 768px), the reticle SVG is not rendered; star interaction uses the existing touch-tap raycast.
- **FR-013**: The reticle MUST lock onto the targeted star's screen-space center position, updated per frame via 3D-to-screen projection within the orchestrated ticker call order.
- **FR-014**: The reticle MUST display a subtle idle animation (slow rotation or gentle pulse) while locked on, suppressed under reduced motion.
- **FR-015**: When the user transitions hover from one star to another, the reticle MUST smoothly animate between positions over 200ms with `power2.inOut` easing (direct linear interpolation of screen-space x/y). If a new target star is acquired during an active transition, the current transition MUST be killed (`gsap.killTweensOf`) and a new transition begins from the reticle's current interpolated position. Under reduced motion, the reticle jumps instantly to the new star's position with no transition animation.
- **FR-016**: When the user moves away from all stars, the reticle MUST fade out within 200ms.
- **FR-017**: The reticle SVG overlay MUST have `pointer-events: none` so that clicks pass through to the underlying WebGL hitzone and star interaction handlers.
- **FR-018**: The reticle MUST remain functional and correctly positioned after browser resize.
- **FR-018a**: The reticle's project name label MUST be accessible to assistive technology (not `aria-hidden`). The SVG targeting graphic itself is `aria-hidden="true"`. The label SHOULD be a DOM element (not SVG `<text>`) with `role="tooltip"` or `aria-live="polite"` so screen readers announce the targeted project name on hover.
- **FR-018b**: When the reticle appears (star hover detected), the logo-follow system MUST pause: the logo returns home, the system cursor remains hidden, and the reticle is the sole cursor-tracking visual element. When the reticle fades out (cursor leaves all star hover zones), the logo-follow system resumes. A shared cursor-state module or explicit handoff protocol MUST coordinate cursor visibility between the logo-follow system and the reticle system.

**Constellation Lines**

- **FR-019**: When a scroll zone activates (signaled via a `zone-change` CustomEvent dispatched from the scroll progress handler with `detail: { zoneIndex, zone }`), thin animated SVG lines MUST draw between the project nodes belonging to that zone's `projectIds` array. Line endpoints are computed via `project3DtoScreen()` each frame and rendered as SVG `<line>` or `<path>` elements with `pointer-events: none`. This approach adds zero WebGL draw calls.
- **FR-020**: Constellation lines MUST be thin (1-2px visual width), semi-transparent, and colored to match the zone's nebula hue.
- **FR-021**: The line animation MUST be a draw-on effect (SVG `stroke-dashoffset` animated via GSAP) followed by a subtle pulse/glow cycle.
- **FR-022**: Zone transition timing: previous zone's constellation lines fade out over 400ms (`power2.in`), new zone's lines begin draw-in after a 100ms overlap (starting at the 300ms mark, not waiting for full completion). Total transition: ~600ms. If the user scrolls to a third zone mid-transition, in-progress transitions are killed immediately (`gsap.killTweensOf()`), partially-visible lines fade out over 200ms, and the new zone's lines begin after the fast fade. If the user scrolls backwards during a transition, the outgoing lines reverse their fade-out and incoming lines retract.
- **FR-023**: No constellation lines MUST be visible in the default state (top of page, no active scroll zone).
- **FR-024**: Constellation lines MUST be suppressed or shown as static lines under `prefers-reduced-motion: reduce`.

**Parallax Depth**

- **FR-025**: The existing 3 nebula particle layers MUST be redistributed into 3 depth-separated groups by z-band. No new Points objects are added (zero additional draw calls). The redistribution assigns particles to background, mid-ground, and foreground bands based on their z-coordinates.
- **FR-026**: Parallax layer offsets MUST be computed using linear interpolation (lerp) inside the existing `gsap.ticker.add()` callback. Each layer stores a `targetOffset` (proportional to cursor position relative to viewport center) and a `currentOffset` (lerped toward target each frame). Per-layer lerp factors: background=0.02, mid=0.05, foreground=0.08. Maximum offsets: background 0.02 world units, mid 0.05, foreground 0.1. No separate `gsap.quickTo()` instances or additional RAF loops.
- **FR-027**: When the mouse is stationary, all parallax layers MUST be stationary (no drift or creep).
- **FR-028**: Background particles MUST be smallest and dimmest. Mid-layer particles MUST be medium. Foreground particles MUST be largest and brightest. Size and brightness gradient reinforces depth.
- **FR-029**: Parallax MUST be suppressed under `prefers-reduced-motion: reduce`. Layers remain visible at rest positions.
- **FR-030**: Parallax MUST be disabled on mobile (below 768px width). The mobile flag MUST be read dynamically on each resize, not cached at initialization. If the viewport crosses the 768px threshold after page load, parallax toggles accordingly.

**Code Quality**

- **FR-031**: New features MUST be implemented in dedicated JavaScript modules. Existing monolithic files MUST be actively refactored to bring all files under 400 lines. Specific extraction targets: scene.js: logo-follow logic (~150 lines) to `logo-follow.js`, texture helpers to `textures.js`; animations.js: terminal scan to `terminal.js`, scroll zone logic to `scroll-zones.js`; interactions.js (565 lines): panel management to `panel.js`; performance.js (428 lines): supernova burst pool to `burst.js`. The existing `showStarLabel()`/`hideStarLabel()` and `handleStarEnter()`/`handleStarExit()` functions are absorbed by the reticle module and removed from scene.js.
- **FR-032**: All dead code, unused imports, and commented-out code blocks MUST be removed from all JavaScript modules.
- **FR-033**: The module dependency graph MUST have no circular dependencies. New modules MUST use dependency injection (receiving scene references via `init()` function parameters) rather than importing directly from scene.js. App.js (or a dedicated tick-manager.js) serves as the orchestrator, importing from both scene.js and feature modules, wiring connections via `init()` calls.

**Performance**

- **FR-034**: All new features combined MUST NOT increase the steady-state draw call count beyond the existing budget (under 30 steady state, under 50 hard limit). "Steady state" is defined as all features rendered in their most common visible configuration (sidebar planes visible, one scroll zone active with constellation lines, reticle potentially active). Projected budget: ~22 draw calls (18 current + 2 sidebar planes + 1 glow halos baked into existing sprites + 0 SVG constellation lines + 0 SVG reticle + 0 parallax redistribution).
- **FR-035**: The MSDF texture MUST be 256x256 resolution (262KB GPU memory), stored as a 3-channel RGB PNG under 64KB file size. Total texture memory budget must remain under 1MB (constitution Principle II): current ~452KB + MSDF ~262KB = ~714KB.
- **FR-036**: Constellation lines and reticle SVG MUST NOT cause layout thrashing. Position updates MUST use transforms or direct style property writes, not forced reflow.
- **FR-037**: Under auto-tier Tier 3 (low performance): parallax is disabled, constellation line animations are suppressed, reticle animations are suppressed, sidebar breathing/shimmer effects are disabled. Static visual states remain.
- **FR-037a**: Under auto-tier Tier 2 (medium performance): parallax layer count MUST reduce from 3 to 2 (merge background and mid layers), constellation line pulse/glow animations MUST be suppressed (static lines only), sidebar scan-line sweep MUST be disabled. Reticle and glow halos remain at full quality. The performance module MUST dispatch a `tier-change` CustomEvent when tier transitions occur, allowing feature modules to respond without polling.

### Key Entities

- **MSDF Texture**: A multi-channel signed distance field image generated from the geometric OE monogram SVG (`design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg`). 256x256 RGB PNG, stored in `/assets`. Used as a shader input for sidebar hieroglyph rendering.
- **Sidebar Planes**: Two Three.js PlaneGeometry meshes with custom ShaderMaterial, positioned to overlay the CSS sidebar columns. Synchronized with CSS layout on resize. 2 draw calls.
- **Reticle**: An SVG element containing the targeting graphic (circles, tick marks, rotation ring). Positioned at z-index 24, sibling to `#star-labels`. `pointer-events: none`. Project name label is a DOM element (accessible, not aria-hidden).
- **Constellation Line**: SVG `<line>` or `<path>` elements with `pointer-events: none`, endpoints computed via `project3DtoScreen()`. Animated via SVG `stroke-dashoffset` (GSAP). Zero WebGL draw calls.
- **Parallax Layer**: The existing 3 nebula Points layers redistributed by z-band with per-layer lerp-based parallax offsets. Zero additional draw calls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first-time visitors can identify the 7 interactive project nodes within 3 seconds of the reveal sequence completing, as measured by visual hierarchy testing (nodes are the brightest, largest, most colorful elements against the desaturated nebula).
- **SC-002**: The targeting reticle appears within 100ms of the cursor entering a project node's hover zone, providing immediate interaction feedback.
- **SC-003**: The starfield conveys visible depth — users perceive at least 2 distinct depth planes when moving their mouse, as validated by the parallax movement differential between layers.
- **SC-004**: Constellation lines are visible during zone navigation, connecting 100% of the projects belonging to each active zone, reinforcing the portfolio's ecosystem narrative.
- **SC-005**: The sidebar hieroglyphs are resolution-independent — no pixelation or blurring is visible at any DPR value up to 3.0, as validated by visual inspection at 200% browser zoom.
- **SC-006**: All new features maintain 60fps on desktop with integrated GPU (Intel Iris-class) as measured by the existing auto-tier benchmark. No tier downgrade caused by the new features alone. Projected steady-state draw calls: ~22 (under the 30 budget).
- **SC-007**: The complete experience respects `prefers-reduced-motion: reduce` — all animated effects (parallax, constellation line draw-on, reticle pulse/transition, sidebar breathing, node hover scale beyond 1.2x) are suppressed, while static visual content (hieroglyphs, construction lines, reticle position, constellation line positions) remains visible and functional.
- **SC-008**: The codebase is modular — no single JavaScript file exceeds 400 lines, and the total module count reflects single-responsibility organization with zero circular dependencies.
- **SC-009**: Page weight increase from new features (MSDF texture, SVG reticle, additional JavaScript modules) is under 300KB total, keeping the portfolio within the 800KB page weight target (excluding project media).

## Assumptions

- The geometric OE monogram SVG is available at `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` and is suitable for MSDF conversion using msdfgen (it contains vector path outlines: circles and rectangles). The ASCII-art SVG at `design-assets/logo.svg` is NOT suitable for MSDF conversion (it contains `<text>` elements with no path data).
- The logo generator at `design-assets/oddessentials-logo-generator/generators/oe_logo_flipped_rotated.py` can produce logo orientations for reference, but the MSDF approach uses UV rotation in the shader rather than 4 separate texture assets.
- The existing `CONSTELLATION_ZONES` data structure in `data.js` provides all necessary zone-to-project mappings for constellation lines.
- **No WebGL sidebar geometry currently exists.** The sidebars are CSS-only elements (`#constellation-nav`, `#status-panel`, `.frame__edge--left`, `.frame__edge--right`). New Three.js PlaneGeometry meshes must be created, positioned to overlay the CSS sidebar columns, and kept in viewport-synchronized alignment on resize. This is a new implementation task, not a material swap.
- The existing scroll-driven zone system (ScrollTrigger-based) provides the activation triggers for constellation lines via a new `zone-change` CustomEvent.
- The existing 3 nebula particle layers can be redistributed into depth-separated z-bands for parallax without adding new Points objects. The existing scroll-driven `nebulaGroup.rotation.y` behavior is preserved. Mouse-driven parallax applies per-layer position translations that compose independently alongside the scroll rotation — parallax is additive, not a replacement.
- Mobile devices (below 768px) receive a gracefully degraded experience: no parallax, no animated constellation lines, no reticle SVG (touch-tap used instead), and no sidebar animated effects.
- The golden ratio construction lines (phi, spiral, etc.) are a subtle "reward for looking closely" detail, not a primary visual element. They must never compete with the logo etching for visual attention.
