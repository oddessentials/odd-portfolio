<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (team review amendments)
Amendments from team review (5/6 specialists approved):
  - Principle I: expanded frozen shader feature list (Technical Artist)
  - Principle I: added "Portfolio Over Spectacle" guard (Devil's Advocate)
  - Principle II: DPR clamp 2.0 → 1.5 (Technical Artist)
  - Principle II: added particle/instance budget (Devil's Advocate)
  - Principle II: clarified GSAP ticker integration (WebGL Engineer)
  - Principle II: benchmark window moved post-reveal (WebGL Engineer)
  - Principle II: draw call budget raised to <30 (WebGL Engineer)
  - Principle II: added star separation minimum (WebGL Engineer)
  - Principle III: added GSAP reduced-motion check (Front-End Architect)
  - Principle III: added focus ring dark offset rule (Front-End Architect)
  - Principle III: added .sr-only content requirements (Front-End Architect)
  - Development Workflow: added scroll pin duration constraint (Devil's Advocate)
  - Tech Stack: added MotionPathPlugin as optional (Motion Designer)
  - Font body text: flagged for owner decision (IM Fell English vs IM Fell English)
Sign-off status:
  - Motion Designer: APPROVED
  - Devil's Advocate: APPROVED (3 additions incorporated)
  - Front-End Architect: APPROVED (3 concerns + 1 addition incorporated)
  - Technical Artist: APPROVED (2 concerns incorporated)
  - WebGL Engineer: APPROVED (4 amendments incorporated)
  - Creative Director: no response after 3 attempts (brainstorm fully incorporated)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ compatible
  - .specify/templates/spec-template.md ✅ compatible
  - .specify/templates/tasks-template.md ✅ compatible
Deferred items:
  - None (all resolved — font set to IM Fell English, Coney Island description provided)
-->

# OddEssentials Arcane Console — POC Constitution

## Core Principles

### I. POC Scope Discipline

Every addition MUST pass the question: "Does this help the POC land
the wow factor AND communicate the portfolio projects?" If not, it is
cut.

- The deliverable is a **single `index.html` file** with an optional
  `/assets` folder. No build system, no backend, no CMS.
- The project data model supports a **variable project count with
  cluster support**. Approved fields: `id, name, shortDesc, tagline,
  category, status, isCluster, clusterMembers, constellation,
  accentColor, starSize, position, logoUrl?, mediaType?, mediaUrl?,
  screenshots?, links[], repoKey?, starSizeOverride?`. No additional
  fields without explicit owner approval.
  (Amendment: 009-constellation-zone-enhancements, owner-approved 2026-03-06.
  Removed dead glyph fields: glyphName, glyphRotation, glyphType, glyphAtlasIndex.)
  (Amendment: 014-modal-enhancement, owner-approved 2026-03-07.
  Added repoKey, starSizeOverride to PROJECTS. Authored content fields
  (synopsis, capabilities, techStack, aiModels) live in separate
  data-content.js, not in the PROJECTS data model.)
- **Shader feature list is frozen** at the following effects (included
  in scope, not expandable without explicit approval):
  rim glow (Fresnel-based edge), fake refraction UV offset, procedural
  glass surface noise, internal nebula (fBm procedural, 3 parallax
  shells), dust mote particles (~180 points), supernova burst on click
  (ring + rays + sparks, particle pool), star glow sprites (core +
  halo), Gaussian pulse animation per star, post-processing (bloom +
  chromatic aberration + vignette, 4 passes max), sidebar MSDF
  hieroglyph etching with normal perturbation, roughness modulation,
  cavity darkening, edge highlight, breathing light,
  and event-triggered scan-line sweep (Amendment: 005-arcane-ux-overhaul),
  per-glyph atlas selection, atlas UV lookup, hover-driven brightness
  response, scroll-driven positional shift, and Odd Bot state rotation
  (Amendment: 008-sidebar-glyph-language, owner-approved 2026-03-05).
- **Project overlay is the primary success metric.** The project detail
  panel — not the orb animation — is what converts a visitor into a
  contact. The overlay MUST display at least one real visual asset
  (logo, screenshot, or video poster) for every project that has one,
  have exactly two prominent CTAs (primary: live demo or store link;
  secondary: GitHub), open in under 100ms from click, and contain no
  animations that delay content access.
- Star and cluster positions are **data-driven from the project
  array**. No constellation-grouping algorithm.
- **Excluded from POC scope:** audio, 2D fallback rendering system,
  responsive breakpoints below 1200px, real-time external data
  fetching, CMS integration, routing beyond a project overlay.
- Minimum viable viewport: 1200px wide. Below that, display a
  centered "This experience is best viewed on a wider screen" message.

**Rationale:** Creative portfolios die from scope creep. The POC
succeeds when it demonstrates the Victorian Techno-Mage vision with
enough polish to evaluate, not when it ships every feature.

### II. Performance-First WebGL

The crystal ball scene MUST target **60fps on desktop** with
integrated GPUs (Intel Iris-class) as the baseline, not discrete GPUs.

- **DPR MUST be clamped:** `Math.min(window.devicePixelRatio, 1.5)`
  before renderer creation. No exceptions. (1.5 balances retina
  crispness against fragment-rate cost on integrated GPUs.)
- **Draw call budget:** under 30 for the orb scene at steady state
  (3 nebula layers + variable-count project star sprites and cluster
  groups + halos + bloom passes). Hard limit: under 50.
- **Particle/instance budget:** maximum 1500 nebula background
  particles (THREE.Points), 180 dust mote instances, variable-count
  project star sprites and cluster groups with glow halos baked into
  the sprite texture (always visible, zero additional draw calls —
  Amendment:
  005-arcane-ux-overhaul). Supernova pool: 60 pre-allocated particles.
- **Texture memory:** under 1MB total (procedural-first approach).
- **Post-processing:** maximum 4 render passes. Bloom at 0.75x
  resolution. No multi-pass UnrealBloomPass chains without profiling
  on integrated GPU first.
- **Tab visibility:** the render loop MUST pause when the tab is
  hidden via the Page Visibility API.
- **Auto-tier degradation:** a 30-frame benchmark starting **5 seconds
  after the reveal sequence completes** (during idle steady-state, not
  during the high-load reveal) MUST downgrade effects if average frame
  time exceeds 20ms. Three tiers: Full (6-octave fBm + bloom +
  chromatic aberration), Medium (4-octave fBm + bloom only), Low
  (noise texture lookup, no bloom, CSS filter fallback).
- **Single animation loop:** Three.js `renderer.render()` MUST be
  called inside `gsap.ticker.add()`, not in a separate RAF loop.
  Apply `gsap.ticker.lagSmoothing(0)` to prevent catch-up frames
  after tab sleep. Never nest multiple RAF calls.
- **Star separation:** minimum 0.18 world-unit projected screen-space
  separation between any two stars to prevent raycasting collisions.

**Rationale:** A portfolio that stutters on a hiring manager's laptop
is worse than no portfolio. Performance is not polish — it is
structural.

### III. Accessibility Is Non-Negotiable

The portfolio MUST be usable — not just present — for users with
disabilities. WebGL is progressive enhancement on top of accessible
HTML.

- A **`.sr-only` project list** with real, functional links MUST exist
  in the DOM at all times. Each entry MUST contain: the project name,
  tagline, and at least the primary external link (GitHub or live
  demo). The constellation nav buttons MUST have `aria-pressed`
  managed to reflect the currently selected project. This list is the
  accessible interface; the crystal ball is the visual enhancement.
- **`prefers-reduced-motion`** MUST be explicitly designed as a named
  state, not an afterthought. In reduced-motion mode: no scroll-driven
  scene changes, no tilt, no burst particles, no idle pulses, no halo
  rings. Hover scale limited to 1.2x. Panel open/close is instant.
  The nebula is static but colorful. Content remains fully readable.
  GSAP timelines MUST check
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and
  skip or instant-complete (`.progress(1)`) any tween involving
  spatial movement, scale, or opacity sequences. Duration-zero
  CSS-class-swap is the fallback for overlay transitions.
- **`prefers-contrast: more`** MUST have an override block: white text
  on black, decorative elements hidden, simple outlines replace
  ornamental borders.
- **Keyboard navigation** MUST work: Tab through constellation
  buttons, arrow keys within the list, Enter to select, Escape to
  close overlay.
- **Focus indicators** MUST be visible and meet WCAG 2.1 (golden glow,
  3px outline + box-shadow, minimum 3:1 contrast against adjacent
  colors). When a focused element sits adjacent to or overlaps a
  brass/warm-colored surface, the focus indicator MUST include a dark
  offset ring (e.g., `box-shadow: 0 0 0 2px #1a1008, 0 0 0 5px
  #ffd700`) to maintain 3:1 contrast against both dark panels and
  brass frame elements simultaneously.
- **Focus trap** MUST be implemented in the project overlay dialog.
- **Color contrast:** all readable text MUST meet WCAG AA (4.5:1
  minimum). Brass color (`#C8A84B` and variants) is used ONLY for
  decoration — never as text on dark backgrounds (measured ~2.8:1,
  fails WCAG).
- **Canvas element** MUST have `aria-hidden="true"`. The `#orb-hitzone`
  MUST have `role="application"` with a descriptive `aria-label`.
- **WebGL context loss** MUST be handled: listen for
  `webglcontextlost`, call `preventDefault()`, restore on
  `webglcontextrestored`.

**Rationale:** Accessibility is a legal and ethical requirement, not a
feature toggle. A portfolio that excludes users reflects poorly on the
developer it represents.

### IV. Text in HTML, Never in WebGL

All human-readable text MUST be rendered as HTML elements positioned
over the WebGL canvas. No text is ever drawn inside the canvas.

- Project names, taglines, descriptions, and links are HTML.
- Star labels are HTML `<div>` elements positioned via
  `project3DtoScreen()` coordinate projection.
- HUD panels (constellation nav, status readout, command line) are
  HTML with CSS styling.
- The project detail overlay is a standard HTML `role="dialog"` with
  `aria-modal="true"`.

**Rationale:** HTML text is crisp at all DPR values, accessible to
screen readers, selectable, translatable, and styleable with CSS. WebGL
text is none of these things.

### V. Visual Hierarchy — Frame vs Universe

The steampunk frame and the cosmic orb interior are two distinct visual
worlds. They MUST NOT contaminate each other.

- **Accent colors (per-project accent colors) stay inside the orb.**
  They MUST NOT appear on the frame, HUD panels, or command line.
- **Steampunk ornamentation stays on the frame.** No gears, rivets,
  runes, or brass textures cross the glass boundary into the orb.
- **Ornamentation intensity follows the Rule of Thirds:**
  - Corners & bezels: LAVISH (gear teeth, rivets, filigree)
  - Side panels: MODERATE (functional-looking gauges, pipes)
  - Orb surround: RESTRAINED (clean brass ring only)
  - Inside the orb: ZERO CHROME (nebula + stars only)
- **The orb is the primary visual anchor** (brightest element by
  luminosity). The frame is the secondary anchor. Neither competes
  with the other.

**Rationale:** The core aesthetic tension — warm Victorian instrument
vs cold cosmic void — only works if the boundary is respected. Mixing
them produces visual noise, not a unified experience.

### VI. Procedural-First Asset Strategy

Prefer procedurally generated visuals over external asset files.
External textures and images are used only for project-specific media.

- **Nebula:** 100% procedural fBm noise in GLSL. No texture files.
- **Star glows:** radial gradient generated in fragment shader or
  canvas-drawn texture. No sprite sheets.
- **Dust motes:** procedural circle in fragment shader.
- **Frame decorations:** CSS gradients, box-shadows, pseudo-elements,
  inline SVG. No external image files for the steampunk border.
- **Missing project logos:** inline SVG placeholder icons (gear for CI,
  map pin for maps, code brackets for standards, etc.).
- **Typography:** maximum 3 font families. Currently: Cinzel (display/
  headers), JetBrains Mono (terminal), IM Fell English (body). Loaded via
  a single Google Fonts CDN call.
- **Platform icons:** inline SVG paths. No icon font CDN.

**Rationale:** Procedural assets eliminate HTTP requests, reduce page
weight, and scale to any resolution. For a POC, the total page weight
target is under 800KB (excluding project media assets).

### VII. Graceful Degradation

The portfolio MUST function at every capability level, from full WebGL2
to no JavaScript, degrading in visual richness but never in content
access.

- **WebGL2 (full experience):** glass transmission, bloom, all
  effects.
- **WebGL1 fallback:** skip bloom and transmission; use
  MeshPhongMaterial with high shininess; keep nebula and stars.
- **No WebGL fallback:** display a static PNG/SVG screenshot of the
  orb; the CSS steampunk frame still renders; the `.sr-only` project
  list provides full navigation.
- **Safari compatibility:** test shaders in Safari at least once
  before declaring done. Use `mediump` precision explicitly. Include
  `renderer.compile()` at startup with error detection.
- **Firefox context loss:** handle `webglcontextlost` and
  `webglcontextrestored` events.
- **Mobile visitors:** even though mobile is not a target, the page
  MUST NOT appear broken. At minimum: show the steampunk frame + a
  static orb image + the project list. Initialize Three.js only when
  `window.innerWidth >= 1200`.

**Rationale:** A portfolio link gets shared unpredictably. The content
must be reachable on any device or browser, even if the visual
spectacle is desktop-only.

### VIII. Asset Readiness Gate

Certain assets MUST exist before implementation begins. Missing assets
block implementation tasks that depend on them.

- **Video conversion:** `odd-fintech-video.mov` MUST be converted to
  `.mp4` (H.264) and `.webm` (VP9) before any video-related code is
  written. `.mov` is not playable in Chrome or Firefox.
  **STATUS: DONE** — converted to `assets/odd-fintech-video.mp4` and
  `assets/odd-fintech-video.webm`.
- **GIF evaluation:** `odd-ai-reviewers-trailer.gif` MUST be checked
  for file size. If >1MB, convert to looping `.webm`.
  **STATUS: DONE** — original was 32MB; converted to
  `assets/odd-ai-reviewers-trailer.webm`.
- **Project description:** `coneyislandpottsville.com` MUST have a
  description and tagline provided by the owner, or the project is
  dropped to 6 entries.
  **STATUS: DONE** — description, logo SVG, and photo provided.
- **Library versions pinned:** Three.js MUST be pinned to a specific
  semver (e.g., `0.162.0`). GSAP MUST be pinned (e.g., `3.12.5`). No
  `@latest` or `@next` CDN URLs.
- **Font selection finalized:** the specific Google Fonts URL MUST be
  confirmed before CSS implementation begins.

**Rationale:** Implementation time wasted on missing or incompatible
assets is the most common cause of POC timeline overruns. Gate the
work.

## Technical Standards & Constraints

### Technology Stack (Frozen for POC)

| Layer | Technology | Version | Source |
|---|---|---|---|
| 3D Engine | Three.js | 0.162.0 (pin) | unpkg CDN |
| Animation | GSAP + ScrollTrigger | 3.12.5 (pin) | cdnjs CDN |
| GSAP Plugins | TextPlugin, CustomEase, MotionPathPlugin (optional) | 3.12.5 | cdnjs CDN |
| Fonts | Cinzel, JetBrains Mono, IM Fell English | latest | Google Fonts |
| Markup | HTML5 semantic | N/A | N/A |
| Styling | CSS3 custom properties, Grid | N/A | N/A |
| Shaders | GLSL ES 1.0 / 3.0 | N/A | inline |

No additional libraries or frameworks without explicit approval. No
npm, no bundlers, no build steps.

### GSAP Licensing

GSAP's "No Charge" license explicitly covers personal portfolios. This
use case is compliant. If the portfolio transitions to a commercial
product (SaaS, client-facing tool), re-evaluate licensing before
deployment.

### File Structure

```
index.html              # Single-file POC (all HTML, CSS, JS)
assets/                  # Optional: project media, converted videos
  odd-fintech-video.mp4
  odd-fintech-video.webm
  odd-ai-reviewers-banner.png
  ado-git-repo-insights-logo.png
  ...
design-assets/           # Source assets (not served in production)
```

### Project Data Model

```json
{
  "id": "string",
  "name": "string",
  "tagline": "string",
  "category": "string",
  "constellation": "string",
  "accentColor": "string (hex)",
  "starSize": "number (2.33 | 1.44 | 1.00 | 0.89 | 0.55)",
  "position": "[x, y, z]",
  "logoUrl": "string | null",
  "mediaType": "'image' | 'video' | 'youtube' | 'screenshots' | null",
  "mediaUrl": "string | null",
  "screenshots": "string[] | null",
  "links": [
    { "label": "string", "url": "string", "primary": "boolean" }
  ]
}
```

7 projects. Extended schema approved during brainstorming (adds
constellation, accentColor, starSize, position, screenshots fields).
Full schema in `specs/001-arcane-console-poc/data-model.md`.
No dynamic data fetching.
(Amendment: 011-constellation-color-system, owner-approved 2026-03-06.
starSize enumeration updated from `(1.0 | 1.15 | 1.4)` to Fibonacci
size ladder `(2.33 | 1.44 | 1.00 | 0.89 | 0.55)`.)

### Performance Targets

| Metric | Target | Hard Limit |
|---|---|---|
| Desktop framerate | 60fps | 30fps minimum |
| WebGL draw calls | <30 | <50 |
| Texture memory | <1MB | <16MB |
| DPR | clamped to 1.5 | never unclamped |
| Page weight (excl. media) | <800KB | <1.5MB |
| Reveal sequence | <6500ms | <10000ms |
| Shader ALU per fragment | <120 instructions | <200 instructions |

### Color Contrast Requirements

| Text Type | Background | Minimum Ratio | Standard |
|---|---|---|---|
| Primary text (#e8d5a3) | Panel bg | 8:1 | WCAG AAA |
| Terminal text (#7fffb3) | Page bg (#0d0b09) | 10:1 | WCAG AAA |
| Secondary text (#a08858) | Panel bg | 4.6:1 | WCAG AA |
| Brass decorative (#C8A84B) | Any dark bg | ~2.8:1 | FAILS — decoration only |

## Development Workflow & Quality Gates

### Implementation Order

1. **Asset readiness gate** — all pre-requisite assets confirmed
2. **HTML shell + CSS frame** — semantic structure, grid layout,
   steampunk frame (CSS-only, no JS)
3. **Accessibility foundation** — skip link, keyboard nav, `.sr-only`
   list, ARIA roles, focus indicators
4. **WebGL scene** — renderer, camera, orb geometry, glass material
5. **Nebula + stars** — point clouds, star sprites, raycasting
6. **Interactions** — hover states, click → panel, supernova burst
7. **Reveal sequence** — GSAP intro timeline
8. **Scroll integration** — ScrollTrigger zones
9. **Post-processing** — bloom (if performance allows)
10. **Polish** — reduced-motion state, Safari test, context loss
    handler, OG meta tags

### Quality Gates

Each implementation phase MUST pass before the next begins:

- **Gate 1 (after step 3):** keyboard-only navigation works end-to-end.
  Screen reader announces all projects. Skip link functions.
- **Gate 2 (after step 5):** WebGL renders at 60fps on integrated GPU.
  DPR is clamped. Tab-pause works.
- **Gate 3 (after step 6):** star hover/click interactions work. HTML
  overlay positions correctly. Project panel opens and closes.
- **Gate 4 (after step 8):** `prefers-reduced-motion` state is
  explicitly tested. All text passes WCAG AA contrast.
- **Gate 5 (final):** tested in Chrome, Firefox, and Safari. WebGL
  context loss handled. Static fallback present. OG meta tags set.

### Discoverability Requirement

After the reveal sequence completes, the page MUST include a one-time
"scanning" affordance (sonar pulse on stars, CLI prompt "7 anomalies
detected") that teaches users the stars are interactive. Without this,
the crystal ball reads as purely decorative.

### Scroll Pin Constraint

The ScrollTrigger pinned section MUST complete its animation within
300px of scroll distance. A "skip intro" affordance (visible button OR
keyboard shortcut) MUST be present and fade after 3 seconds. Pin
duration exceeding one viewport height of scroll distance is
prohibited.

### Cross-Browser Testing (Minimum)

- Chrome (latest): primary development target
- Firefox (latest): WebGL context loss handling verified
- Safari (latest macOS): shader compilation verified, no silent
  failures
- Mobile Safari (iPhone): static fallback renders, page is not broken

## Governance

This constitution is the authoritative reference for all design and
implementation decisions in the Arcane Console POC. It supersedes
informal agreements, chat messages, and individual specialist
preferences.

### Amendment Process

1. Any team member MAY propose an amendment by documenting the change,
   its rationale, and its impact on existing work.
2. Amendments that add scope (new shader effects, new data fields, new
   responsive breakpoints) require **explicit owner approval**.
3. Amendments that reduce scope or tighten constraints may be adopted
   by team consensus.
4. All amendments MUST update the version number according to semver:
   - **MAJOR:** principle removal or redefinition that invalidates
     existing work.
   - **MINOR:** new principle added, section materially expanded, or
     scope boundary adjusted.
   - **PATCH:** wording clarification, typo fix, non-semantic
     refinement.
5. The `Last Amended` date MUST be updated on every change.

### Compliance

- All implementation work MUST reference the constitution's principles
  when making design trade-offs.
- The Devil's Advocate reviewer has standing authority to flag
  constitution violations during review.
- Unresolved violations block merging until resolved or the
  constitution is amended.

### Reference Documents

- **Brainstorming notes:** `INIT.md` (compiled), `.brainstorm/*.md`
  (per-specialist)
- **Design concept:** `concept.md`
- **Project inventory:** `portfolio-basic-list.md`
- **Design assets:** `design-assets/`

**Version**: 1.6.0 | **Ratified**: 2026-03-04 | **Last Amended**: 2026-03-07
