# Research: Scroll-Driven Exploration & Remaining Polish

**Feature**: `004-scroll-exploration-polish` | **Date**: 2026-03-04

All unknowns resolved via 6-specialist team review. No NEEDS CLARIFICATION items remain.

## Decision 1: Scroll Architecture — Pinless Fixed Layout

**Decision**: Use `position: fixed` on `#app-shell` with a sibling `#scroll-driver` spacer element. ScrollTrigger reads progress via `ScrollTrigger.create({ onUpdate })` with no `pin` property.

**Rationale**: ScrollTrigger's `pin` option applies `transform: translate3d()` to the pinned element, creating a CSS containing block that breaks all `position: fixed` descendants (canvas, frame, hitzone, hamburger, logo-follow). This is the exact same bug class as the logo-cursor desync from commit `8a24a13`. Three specialists (Motion Engineer, WebGL Engineer, Frontend Architect) independently identified this risk and unanimously rejected `pin`.

**Alternatives Considered**:
- ScrollTrigger `pin` on `#app-shell`: REJECTED — containing block violation breaks fixed children
- ScrollTrigger `pin` on a wrapper div: REJECTED — same issue, just one level up
- Manual `position: fixed` + scroll spacer: SELECTED — no containing block, no wrapper divs, clean separation

## Decision 2: Nebula Hue Shifting — Custom ShaderMaterial with Additive Overlay

**Decision**: Migrate nebula `PointsMaterial` to custom `ShaderMaterial` with `uZoneColor` (vec3) and `uZoneInfluence` (float) uniforms. Apply hue shift as additive color overlay in fragment shader.

**Rationale**: `PointsMaterial` cannot accept custom uniforms — it's a fixed-function material. The only alternative is rewriting vertex colors per frame (1500 * 3 floats = 18KB buffer upload per frame), which would cause frame hitches on integrated GPUs. GPU-side uniform update is effectively zero cost. Technical Artist and WebGL Engineer independently recommended this approach.

**Alternatives Considered**:
- Vertex color recalculation per frame: REJECTED — buffer upload cost too high for integrated GPUs
- HSL hue rotation in shader: REJECTED — ~8 ALU for HSL conversion, unnecessary complexity
- Additive color uniform overlay: SELECTED — ~3 ALU, simple, tunable via uniform

## Decision 3: Scroll Distance — 300px with Compressed Zone Ranges

**Decision**: Total scroll distance is 300px. Zone ranges compressed from (0.25–0.90) to (0.0–1.0) to eliminate dead zones and maximize usable scroll.

**Rationale**: Constitution mandates max 300px scroll distance. At 300px with 3 zones, each zone gets ~100px of scroll. This is approximately one mouse wheel tick, so zone transitions must be snap/instant rather than gradual fades. Devil's Advocate confirmed 300px is achievable with snap transitions.

**Alternatives Considered**:
- 1 viewport height (~1080px): REJECTED — exceeds constitution constraint (300px max, not 1vh)
- 600px: REJECTED — exceeds constitution constraint
- 300px with original dead zones: REJECTED — wastes 25% of scroll distance on nothing

## Decision 4: Star Brightening — 1.3x Scale with Opacity Lock

**Decision**: Active-zone stars scale to 1.3x their base `starSize`. Opacity stays at 1.0. No additional sprites.

**Rationale**: Stars use additive blending — changing opacity would dim the star against the dark background (counterintuitive). Scale increase is visually clear and preserves the existing 1.6x hover scale headroom. Technical Artist recommended this approach.

**Alternatives Considered**:
- Opacity change: REJECTED — additive blending makes opacity reduction counterintuitive
- Second halo sprite overlay: REJECTED — adds 7 draw calls during zone activation
- Scale 1.3x: SELECTED — zero additional draw calls, clear visual hierarchy (1.0 default < 1.3 zone < 1.6 hover)

## Decision 5: Star Label Container — Static Per-Star Anchors

**Decision**: Move `#star-labels` to `position: fixed; inset: 0` at body level with `z-index: 25`. Use static per-star anchor overrides for the 3 edge-positioned stars rather than dynamic flip logic.

**Rationale**: The 7 star positions are hard-coded constants. Dynamic viewport-boundary detection would add runtime complexity for a problem that can be solved at build time by knowing which stars are at x < -1.5 or x > 1.5. Devil's Advocate correctly identified dynamic flip as over-engineering.

**Alternatives Considered**:
- Dynamic label flip (check viewport bounds at render time): REJECTED — over-engineered for 7 fixed positions
- Static per-star anchor overrides: SELECTED — simple, zero runtime cost, deterministic

## Decision 6: Logo Fix Scope — Behavioral, Not Mechanical

**Decision**: Fix logo desync via behavioral changes (return-home-on-resize, document-level exit detection, style cleanup). Do NOT recreate GSAP `quickTo` instances.

**Rationale**: WebGL Engineer analysis showed `quickTo` instances accept absolute pixel values that self-correct on the next `mousemove` event. The root causes are: (1) no resize handler for logo state, (2) no document-level viewport exit detection, (3) stale inline styles after resize. These are all behavioral fixes, not quickTo mechanism issues.

**Alternatives Considered**:
- Recreate quickTo on resize: REJECTED — unnecessary, quickTo self-corrects with new coordinates
- Replace quickTo with manual gsap.set per frame: REJECTED — higher CPU cost, worse easing
- Behavioral fixes only: SELECTED — minimal code change, addresses root causes

## Decision 7: Zone Colors — Concrete RGB Values

**Decision**: Zone 1 blue-violet `#6B3FA0` (0.42, 0.25, 0.63), Zone 2 warm-gold `#B8860B` (0.72, 0.53, 0.04), Zone 3 green-teal `#1A9E8F` (0.10, 0.62, 0.56).

**Rationale**: Technical Artist recommended these specific values for their contrast against the existing dark background (#0D0B09) and compatibility with the nebula's existing vertex color palette. All three maintain sufficient luminance difference to be distinguishable.

## Decision 8: Reduced Motion Behavior

**Decision**: Under `prefers-reduced-motion: reduce`, nebula color changes apply instantly (`gsap.set()`), star scaling is suppressed entirely, nebula rotation is suppressed entirely. The scroll still functions — zones change colors, but without animation.

**Rationale**: FR-033 explicitly requires rotation suppression under reduced motion (Technical Artist amendment). Color changes are informational (not motion), so they apply instantly. Star scale changes are motion, so they're suppressed.
