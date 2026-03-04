# INIT.md — Victorian Techno-Mage Portfolio POC
## Multi-Specialist Brainstorming Compilation
**Date:** 2026-03-04 | **Project:** OddEssentials Arcane Console

---

## Table of Contents
1. [Creative Director — Style Guide & Brand Vision](#1-creative-director--style-guide--brand-vision)
2. [WebGL/Three.js Engineer — Scene Architecture](#2-webglthreejs-engineer--scene-architecture)
3. [Motion Designer — Animation Language & Scroll](#3-motion-designer--animation-language--scroll)
4. [Front-End Architect — HTML/CSS/Accessibility](#4-front-end-architect--htmlcssaccessibility)
5. [Technical Artist — Shaders/Textures/VFX](#5-technical-artist--shaderstexturesvfx)
6. [Devil's Advocate — Risk Assessment](#6-devils-advocate--risk-assessment)
7. [Cross-Cutting Consensus & Decisions](#7-cross-cutting-consensus--decisions)

---

## 1. Creative Director — Style Guide & Brand Vision

### 1.1 Materials Palette
| Material | Role | Visual Notes |
|---|---|---|
| **Brass** | Primary structural metal — corners, bezels, gauges | Warm amber-gold, brushed/patinated (not mirror polish) |
| **Dark Walnut** | Backing panels, inlay borders | Deep chocolate-brown with grain lines |
| **Iron / Blackened Steel** | Secondary structure, screws, hinges | Near-black with cool blue undertones, matte |
| **Leather** | Panel inserts, label backing | Burnt sienna / oxblood, worn and tooled |
| **Crystal / Smoked Glass** | The orb itself | Deep teal-black with inner luminosity |

All frame materials achievable via CSS gradients, box-shadows, and border-image. No texture files needed for the frame.

### 1.2 Color System

**Frame Palette:**
```
--color-brass-light:    #C8A84B
--color-brass-mid:      #8B6914
--color-brass-dark:     #4A3508
--color-iron:           #1C1F24
--color-walnut:         #2C1A0E
--color-leather:        #6B2D1A
--color-parchment:      #D4B896
--color-frame-bg:       #0D0B09
```

**Nebula Palette (inside orb):**
```
--color-nebula-void:    #04050F
--color-nebula-deep:    #0A0E2A
--color-nebula-mid:     #1A1060
--color-nebula-glow:    #4B2280
--color-rim-glow:       #5ECFFF   (icy blue rim — contrasts warm frame)
--color-rune-glow:      #7AFFB2   (green-teal for terminal cursor)
```

**7 Project Accent Colors:**
| # | Project | Constellation Name | Color | Hex |
|---|---|---|---|---|
| 1 | odd-ai-reviewers | The Forge Septet | Fire Orange | `#FF6B35` |
| 2 | ado-git-repo-insights | The Scribe's Lens | Data Cyan | `#00C9D4` |
| 3 | repo-standards | The Iron Codex | Law Gold | `#F5C518` |
| 4 | odd-self-hosted-ci | The Engine Core | Systems Green | `#4ADE80` |
| 5 | odd-map | The Navigator's Rose | Navigator Teal | `#2DD4BF` |
| 6 | odd-fintech | The Alchemist's Eye | Wealth Violet | `#A855F7` |
| 7 | Coney Island | The Hearth Star | Hearth Rose | `#FB7185` |

### 1.3 Typography
- **Display/Headers:** Cinzel (serif) — "engraved on brass" feel. Weight 600-700, ALL CAPS, letter-spacing 0.15em
- **Terminal/UI:** JetBrains Mono — machine output. Weight 400-500
- **Body/Overlay:** EB Garamond — elegant old-style serif for descriptions
- **Hard ceiling: 3 fonts maximum**

### 1.4 Ornamentation Philosophy — Rule of Thirds
- **Corners & Bezels:** LAVISH — gear teeth, rivets, engraved curlicues
- **Side Panels:** MODERATE — functional-looking gauges, pipe fittings, runes
- **Central Orb Surround:** RESTRAINED — clean brass ring, minimal filigree
- **Inside the Orb:** ZERO CHROME — nebula + stars only, no steampunk ornaments

### 1.5 Frame Composition
```
┌─────────────────────────────────────────────────────────────┐
│  [BRASS CORNER]  ═══ TOP HEADER BAND ═══  [BRASS CORNER]   │
├──────────┬──────────────────────────────┬───────────────────┤
│  LEFT    │         ORB VIEWPORT         │   RIGHT STATUS    │
│  NAV     │       (WebGL canvas)         │   PANEL           │
│  PANEL   │    [Crystal Ball centered]   │                   │
│  16%     │         60%                  │     24%           │
├──────────┴──────────────────────────────┴───────────────────┤
│  ══ COMMAND LINE ═══════════════════════════════════════════ │
└─────────────────────────────────────────────────────────────┘
```

### 1.6 Brand Voice
**Tone:** "A Victorian scientific instrument that has achieved sentience and is delighted to assist you."
- Formal but not stuffy; scientific-mystical crossover vocabulary
- Never sarcastic; plays it completely straight
- Status panel shows arcane coordinates, system readouts, signal strength bars
- Command line: `> reveal universe_` → `> calibrating orb...` → `> universe revealed.`

### 1.7 Design Assets Inventory
**Available:** AI reviewers banner/GIF + 6 team PNGs, ADO logo + 3 screenshots, FinTech logo + video (.mov)
**Missing:** repo-standards logo, self-hosted CI logo, odd-map screenshot, Coney Island thumbnail — all achievable as inline SVG placeholders

---

## 2. WebGL/Three.js Engineer — Scene Architecture

### 2.1 Camera & Renderer
- **PerspectiveCamera** — FOV 45, near 0.1, far 100, positioned at z=4.5
- **WebGLRenderer** — antialias: true, alpha: true (transparent for CSS compositing), powerPreference: 'high-performance'
- **DPR clamped:** `Math.min(window.devicePixelRatio, 2)`
- **Tone mapping:** ACESFilmicToneMapping, exposure 1.2
- No shadow maps (zero benefit inside a glowing orb)

### 2.2 Scene Graph
```
Scene
├── AmbientLight (deep purple, intensity 0.3)
├── RimLight (gold PointLight, intensity 2)
├── OrbGroup (THREE.Group — rotates as unit for GSAP control)
│   ├── OuterSphere (glass shell — MeshPhysicalMaterial)
│   ├── InnerGlowSphere (BackSide, deep violet, opacity 0.85)
│   ├── NebulaSystem (3 layers of THREE.Points, ~1500 total)
│   ├── StarGroup (7 × THREE.Sprite with raycasting)
│   └── DustMotes (optional: 180 slow-drifting particles)
└── PostProcessing (EffectComposer: RenderPass → BloomPass → CustomPass → Output)
```

### 2.3 Crystal Ball
- **Geometry:** IcosahedronGeometry(1.0, detail 6) — ~5120 triangles, no polar pinching
- **Glass:** MeshPhysicalMaterial with transmission 0.92, roughness 0.05, IOR 1.5
- **Fallback:** MeshPhysicalMaterial without transmission if perf is an issue
- **Rim:** BackSide sphere (r=1.04) with warm brass-gold, opacity 0.12 (quick); upgrade to custom Fresnel ShaderMaterial if time allows
- **Depth illusion:** InnerGlowSphere (r=0.97, BackSide, deep violet) + depth-sorted nebula layers

### 2.4 Star Node System
- **7 individual THREE.Sprite objects** — per-star raycasting for free
- **Canvas-drawn radial gradient textures** — soft glow disc per project color
- **Companion halo sprite** per star (ring texture, initially invisible, shown on hover)
- **Hand-tuned 3D positions** at varying Z depths (0.3–0.85 from center) for parallax

### 2.5 Nebula: 3 Layered Point Clouds
| Layer | Count | Purpose | Blend |
|---|---|---|---|
| Core | 800 pts | Dense colorful gas | Additive |
| Mid cloud | 400 pts | Dispersed wisps | Additive |
| Ambient haze | 300 pts | Fine background | Normal |

Color regions loosely correspond to project categories. Slow drift via per-layer rotation.

### 2.6 Interaction System
- **Raycaster** against 7 sprite objects each frame
- **Hover:** scale 1.6x, halo fade-in, orb tilt toward star (max 8°), glass shimmer, HTML label via project3DtoScreen()
- **Click:** supernova burst (20 radial sprite ring), camera ease to z=3.2, show HTML project panel
- **Event bus:** OrbEvents { onStarHover, onStarExit, onStarClick, onPanelClose }

### 2.7 Performance Guardrails
- Tab visibility pause (stop RAF when hidden)
- Single RAF loop (no nesting)
- Dispose strategy for cleanup
- WebGL1 fallback: skip bloom + transmission, use MeshPhongMaterial
- `prefers-reduced-motion`: skip intro, disable drift/auto-rotation, keep interactions

### 2.8 GSAP Integration
- GSAP animates Three.js properties directly (camera.position, orbGroup.rotation, material opacity)
- **Handoff rule:** GSAP owns transitions + scroll. RAF owns continuous drift + raycasting. Never fight on same property axis.
- ScrollTrigger drives orbGroup.rotation.y and camera.position.z via scrub

### 2.9 CDN Dependencies
```html
<script type="importmap">
{ "imports": { "three": "https://unpkg.com/three@0.162.0/build/three.module.js", ... } }
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

---

## 3. Motion Designer — Animation Language & Scroll

### 3.1 Reveal Universe Intro Sequence (6500ms total)

```
t=0ms    t=800ms  t=1600ms  t=2800ms  t=3800ms  t=5200ms  t=6500ms
  |---------|---------|---------|---------|---------|---------|
  [FRAME]   [GAUGES]  [CMD]     [TYPE]    [IGNITE]  [BLOOM]   [STARS]
  assemble  power-up  appears   "reveal   orb flash nebula    stagger
                               universe" ignition  bloom      in
```

**Phase 1 (0–1600ms):** Frame assembly — brass corners slide in with expo.out, panels scaleX from edges, rivets pop with springy bounce
**Phase 2 (1600–3800ms):** Console powers up — gauge needles sweep with custom damping curve, command line types "reveal universe" at 75ms/char
**Phase 3 (3800–6500ms):** Orb ignition flash (80ms white spike), nebula blooms outward, stars stagger in at 150ms intervals (random order)

### 3.2 Scroll Architecture (400vh equivalent)
| Zone | Range | Effect |
|---|---|---|
| Pre-scroll | 0–50vh | Idle state, no scroll effect |
| Zone 1 — Orientation | 50–120vh | Gentle orb Y rotation (0→15°), subtle parallax |
| Zone 2 — Arcane Tools | 120–200vh | DevOps stars brighten, nebula shifts blue-violet |
| Zone 3 — Intelligence | 200–280vh | Data/fintech stars brighten, warm gold-orange |
| Zone 4 — Outpost Network | 280–360vh | Map/community stars, green-teal |
| End Zone | 360–400vh | Full universe view, all stars equal |

**Scrub values:** 1.5 for camera (heavy gyroscope feel), 0.5 for UI labels (snappy), 3 for nebula hue (cinematic)

### 3.3 Micro-Interactions

**Hover:** Star scale 1.0→1.6 (200ms, back.out(3)), halo ring expands and fades, label tooltip slides up
**Click:** Star implode (80ms) → burst (200ms, 8-12 particle rays) → panel iris aperture opens (500ms, expo.out) → content staggers in
**Idle:** Each star pulses at random speed (1.8–3.2s) with different phase offsets; cosmic twinkle flare every 8–15s

### 3.4 Easing Standards
- **Mechanical** (frame, gauges, buttons): `expo.out`, `back.out(1.7)`, `power4.out`
- **Cosmic/organic** (nebula, stars, glows): `sine.inOut`, `elastic.out(1, 0.4)`, `power2.inOut`
- **Custom gauge needle:** damping curve with overshoot + 2 oscillations + settle

### 3.5 Panel Transitions
- **Open:** Iris aperture clip-path from star coordinates → full rect (500ms, expo.out)
- **Close:** Reverse iris (400ms, expo.in), content fades first (150ms), star re-absorb pulse
- **Principle:** Open = expand from star, Close = collapse to star → spatial memory

### 3.6 prefers-reduced-motion
Eliminated: scroll-driven scene changes, tilt, burst particles, idle pulses, halo rings
Reduced: hover scale (1.0→1.2 max instead of 1.6)
Kept: click panel open/close (instant, no animation), static nebula, visible stars

### 3.7 GSAP Plugins Required
gsap core, ScrollTrigger, TextPlugin, CustomEase, optional MotionPathPlugin

---

## 4. Front-End Architect — HTML/CSS/Accessibility

### 4.1 Semantic HTML Structure
```
#app-shell (CSS Grid: 3 cols × 2 rows)
├── #orb-canvas (z:0, position:fixed, aria-hidden)
├── .frame (z:10, pointer-events:none, aria-hidden)
│   ├── 4 × .frame__corner (inline SVG brass ornaments)
│   ├── 4 × .frame__edge (CSS gradient bars with engraved shadow)
│   ├── .frame__gauge (CSS-only circular dials)
│   └── .frame__rune-band (repeating rune pattern)
├── #constellation-nav (z:20, nav with button list)
├── #status-panel (z:20, aside with aria-live="polite")
├── #main-viewport (z:20, main, contains orb-hitzone + star-labels)
├── #command-line (z:20, footer, role="log", aria-live="polite")
└── #project-overlay (z:100, role="dialog", aria-modal, hidden)
    ├── .overlay__backdrop (z:99)
    └── .overlay__frame with close button, content, media, links
```

### 4.2 CSS Architecture
- **Custom properties** for all colors, spacing, typography, animation durations, z-indices
- **Grid layout:** `grid-template-columns: 220px 1fr 220px; grid-template-rows: 1fr 48px`
- **Z-index stack:** canvas(0) → frame(10) → HUD(20) → star-labels(25) → backdrop(90) → overlay(100) → skip-link(9999)
- **Steampunk effects:** CSS-only brass gradients, inset box-shadow engravings, conic-gradient gauges, rivet pseudo-elements, repeating-gradient rune bands

### 4.3 Typography System
| Role | Font | Fallback |
|---|---|---|
| Display | Cinzel Decorative 700 | Georgia |
| Headers | Cinzel 400/600 | Georgia |
| Body | IM Fell English | Georgia |
| Terminal | JetBrains Mono 400/600 | Courier New |
| HUD labels | Rajdhani 400/600 | Arial |

Single Google Fonts CDN call for all 5 families. `font-display: block` for decorative, `swap` for mono.

**Contrast verified:**
- Primary text (#e8d5a3) on panel bg: ~8:1 (AAA pass)
- Terminal text (#7fffb3) on bg: ~10:1 (AAA pass)
- Muted text (#5a4a2a): ~2.8:1 (FAIL — decorative only, aria-hidden)

### 4.4 Accessibility
- **Skip link** to main viewport
- **Keyboard navigation:** Tab through constellation buttons, arrow keys within list, Enter to select, Escape to close overlay
- **Focus indicators:** golden glow (3px outline + box-shadow), steampunk-themed
- **Focus trap** in project overlay dialog
- **ARIA:** nav, main, dialog, aria-modal, aria-live regions for status/command line
- **Screen reader:** `.sr-only` project list with real links always in DOM; canvas is aria-hidden
- **Alt text strategy:** functional for logos, descriptive for screenshots, hidden for decorative

### 4.5 Media Handling (5 variants)
| Content Type | Approach |
|---|---|
| Logo only | `<img>` in overlay, max 80px height |
| Screenshots | CSS scroll-snap horizontal gallery |
| YouTube video | Thumbnail + play button → new tab (avoid iframe z-index wars) |
| Native video | `<video>` with .mp4 source (.mov needs conversion) |
| No assets | Terminal-aesthetic placeholder with category SVG icon |
| Links | Styled brass-gradient buttons with inline SVG platform icons |

### 4.6 prefers-reduced-motion CSS
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
JS detection signals WebGL/GSAP layer to disable motion effects.

---

## 5. Technical Artist — Shaders/Textures/VFX

### 5.1 Crystal Ball Shader
- **Custom ShaderMaterial** on IcosahedronGeometry (64×64 segments)
- **Fake refraction:** UV offset via normal perturbation + view direction (no ray tracing)
- **Fresnel rim glow:** `pow(1.0 - dot(N, V), 3.5)` — color shifts warm amber → cool violet on scroll
- **Depth illusion:** 3-4 concentric transparent shells (r=0.97, 0.90, 0.80) with parallax UV offset
- **Surface imperfections:** Layered Perlin noise at two scales (casting bubbles + micro-texture)

### 5.2 Nebula — 100% Procedural
- **fBm with domain warping** in GLSL — no texture files needed
- **7 color territories:** Gaussian-weighted blend based on angular distance from each star position
- **Volumetric look:** 3 nebula planes at different depths, each with frequency/parallax offset
- **Animation:** slow drift via time uniform + breathing pulse (0.1 Hz amplitude modulation)
- Code: `warpedNebula(p, time)` using 6-octave fBm with domain warping for organic tendril shapes

### 5.3 Star Rendering
- **Two sprites per star:** core (bright, 8px) + halo (large, 32px, additive)
- **Gaussian glow profile** in fragment shader: `exp(-dist² * 3.0)`
- **Pulse:** `0.7 + 0.3 * sin(time * 1.2 + phaseOffset)` — per-star random phase
- **HSL color states:** Default (S=0.7, L=0.55), Hover (S=0.9, L=0.75), Focused (S=1.0, L=0.85 + white corona), Dimmed (S=0.3, L=0.3)
- **Size hierarchy:** Flagship projects 1.4x, substantial 1.15x, standard 1.0x

### 5.4 Supernova Burst
- **3 components:** expanding ring torus + 8-12 radial ray quads + 20-30 spark sprites
- **Duration:** 900ms total (ring 600ms, rays 300ms out + 300ms fade, sparks staggered to 900ms)
- **Performance:** Pre-allocated pool of 60 particles — no GC during animation

### 5.5 Dust Motes
- 180 particles, THREE.Points with custom ShaderMaterial (soft procedural circle)
- Brownian drift with noise-based velocity perturbation, clamped to orb interior (r=0.92)
- Size 2-6px, opacity 0.08-0.25 — very subtle ambient life

### 5.6 Post-Processing Pipeline
```
RenderPass → UnrealBloomPass (str 0.8, radius 0.4, threshold 0.85)
           → CustomShaderPass (chromatic aberration + vignette combined)
           → OutputPass
```
4 passes total. Bloom at 0.75x resolution. Chromatic aberration only at orb edges (0.003 UV max).

### 5.7 Performance Budget
| Metric | Target |
|---|---|
| Draw calls | Under 15 |
| Texture memory | Under 1MB (procedural-first) |
| DPR clamp | 1.5 maximum |
| Fragment shader ALU | ≤120 instructions for main glass shader |
| fBm octaves | 6 (reduce to 4 if needed on integrated GPU) |
| Frame budget | ~10ms for WebGL (leave headroom for JS/layout) |

**Auto-tier degradation:** 30-frame benchmark during reveal → drop tier if avg frame >20ms
- Tier 1: All effects, 6-octave fBm, bloom + chromatic aberration
- Tier 2: 4-octave fBm, bloom only
- Tier 3: Noise texture lookup, no bloom (CSS filter fallback)

---

## 6. Devil's Advocate — Risk Assessment

### 6.1 Top 10 Risks (Ranked)
| Rank | Risk | Fix |
|---|---|---|
| 1 | Post-processing destroys framerate on integrated GPUs | Single-pass fake bloom; remove chromatic aberration |
| 2 | MOV video format fails silently in Chrome/Firefox | Convert to MP4+WebM before implementation |
| 3 | Crystal ball interactivity not discoverable | "Anomaly detected" sonar pulse + CLI prompt |
| 4 | Scroll hijacking frustrates users | Limit pin to <300px scroll; add skip-intro |
| 5 | DPR 3.0 renders 9M+ pixels, kills GPU | Enforce Math.min(devicePixelRatio, 2) |
| 6 | coneyislandpottsville.com has no description | Owner must provide tagline or drop to 6 projects |
| 7 | Safari WebGL shader compilation fails silently | Test in Safari; add error detection + static fallback |
| 8 | prefers-reduced-motion not actually implemented | Design the reduced-motion state explicitly |
| 9 | Scope creep from shader additions | Freeze shader feature list; require approval |
| 10 | Text contrast fails (brass on wood ~2.8:1) | Brass only for decoration; parchment/mint for text |

### 6.2 Pre-Requisite Assets (MUST exist before implementation)
- [ ] `odd-fintech-video.mov` → `.mp4` + `.webm` conversion
- [ ] Description/tagline for coneyislandpottsville.com (or drop to 6 projects)
- [ ] Three.js version pinned (specific semver)
- [ ] Font selection confirmed (Google Fonts URL finalized)
- [ ] GIF trailer size evaluation (>1MB → convert to WebM)

### 6.3 Scope Freeze Rules
- Shader features frozen at: rim glow + internal glow + Fresnel transparency
- Star positions: 7 hard-coded values, no constellation grouping algorithm
- No audio, no 2D fallback system, no responsive below 1200px
- Project data model: exactly `id, name, tagline, category, logoUrl, mediaType, mediaUrl, links[]`

### 6.4 Accessibility Minimums (Non-Negotiable)
- `.sr-only` project list with real links always in DOM
- `prefers-reduced-motion` explicitly designed (not just noted)
- Brass color ONLY for decoration — never as readable text
- `prefers-contrast: more` override block
- WebGL context loss/restore handler (10 lines)

---

## 7. Cross-Cutting Consensus & Decisions

### Unanimous Agreements
1. **Single HTML file** with CDN imports (Three.js + GSAP pinned versions), optional `/assets` folder
2. **Text always in HTML**, never rendered in WebGL canvas
3. **Accent colors stay inside the orb**, never on the frame — preserves frame/universe dichotomy
4. **3 font maximum** across the entire project
5. **No audio** in the POC
6. **No responsive design below 1200px** — show "widen browser" message
7. **prefers-reduced-motion** is a hard requirement, not a nice-to-have
8. **CSS-only frame** — no external texture files for the steampunk border
9. **Procedural nebula** — no texture files needed for the nebula effect

### Key Technical Decisions
- **Glass approach:** MeshPhysicalMaterial with transmission (fast path); custom Fresnel ShaderMaterial as upgrade
- **Stars:** Individual THREE.Sprite objects (not Points) for free raycasting
- **Nebula:** 3 layered THREE.Points clouds (~1500 particles), additive blending
- **GSAP/Three.js bridge:** GSAP ticker replaces standalone RAF loop; proxy object pattern for scrubbed values
- **Overlay reveal:** Iris aperture via clip-path animation (CSS, not Three.js)
- **YouTube embeds:** Thumbnail + external link only (no iframe z-index wars)
- **Video format:** MOV must be converted to MP4 before implementation begins

### Open Questions for Owner
1. **Coney Island Pottsville:** Need description/tagline, or confirm dropping to 6 projects
2. **Video conversion:** Can `ffmpeg` be run on `odd-fintech-video.mov` and the AI reviewers GIF?
3. **Font preference:** Team recommends Cinzel + JetBrains Mono + EB Garamond — approve?

---

*Compiled from specialist brainstorming sessions by 6 agents: Creative Director, WebGL Engineer, Motion Designer, Front-End Architect, Technical Artist, Devil's Advocate. Full individual notes available in `.brainstorm/` directory.*
