**Context & Goal**
The visual theme is **Victorian Techno-Mage (steampunk arcane console)**: a high-tech wizard workshop frame surrounding the viewport, with a **central crystal ball** that reveals a **nebula / constellation universe** representing my projects. This initial POC should focus primarily on **creating the imagery, animation language, and interaction feel** (not building the full content system).

**Deliverable**
Produce a self-contained, runnable **single HTML file** (plus local assets folder if needed) that demonstrates:

- The **steampunk arcane console UI frame** (brass/wood/iron, gauges, runes, candlelight vibe — but still readable and modern)
- A **WebGL crystal ball** in the center that contains a colorful **nebula + starfield** and a handful of interactive “project stars”
- Signature animations for:
  - **Reveal sequence** (“reveal universe” moment)
  - **Scroll-driven camera/scene progression** (subtle flythrough or depth shift inside the orb)
  - **Hover** (tilt + shimmer + halo)
  - **Click** (mini supernova burst + project focus)

- Placeholder content for **at least 5 projects** (name + short tagline + optional links), presented as stars/constellations in the orb plus a minimal HUD panel in the frame

**Non-goals (for this POC)**

- No backend, no CMS, no build system required
- No full responsive design polish beyond “looks good on desktop”
- No real data ingestion; use a small hard-coded JSON array for projects
- No heavy routing; a simple “focused project overlay” is enough

---

## Team Responsibilities

**Creative Director (Steampunk UI/Brand)**

- Define the Victorian Techno-Mage style guide: materials (brass, leather, dark walnut), typography pairing (serif header + mono terminal), ornamentation level, and color constraints
- Provide composition rules: frame hierarchy, where labels live, what stays subtle vs loud

**Technical Artist (Shaders/Textures)**

- Plan the crystal ball look: glass refraction illusion, rim glow, subtle distortion, dust motes
- Plan nebula visuals: texture layers vs procedural noise; blending; palette behavior per “constellation”

**WebGL/Three.js Engineer**

- Implement the orb scene in Three.js (or raw WebGL if preferred), including starfield, nebula layers, and interaction picking
- Implement performance guardrails: DPR clamp, instancing for stars, pause when tab inactive

**Motion Designer (GSAP/Scroll)**

- Implement “reveal universe” sequence and scroll-linked transitions (camera spline or depth/rotation)
- Micro-interactions: hover tilt, click burst, easing, timing standards

**Front-End Architect (HTML/CSS/Accessibility)**

- Build the steampunk frame in HTML/CSS with layered depth
- Ensure readable text contrast, keyboard focus handling for project selection, and `prefers-reduced-motion` fallback that disables intense effects

**Devil’s Advocate Reviewer**

- Identify footguns (performance, readability, motion sickness, mobile traps, asset bloat)
- Propose concrete fixes and enforce “POC scope stays POC” while still landing the wow factor

---

## POC Feature Requirements (must-have)

1. **Single-page structure**

- `index.html` loads everything; optional `/assets` folder for textures
- All code runs locally (no external build steps)

2. **Steampunk Arcane Console Frame**

- Decorative border frame: brass corners, subtle engraved patterns, gauges/runes as icons
- Minimal HUD areas: left nav (constellations), right status (“scanning systems…”), bottom command line (shows `> reveal universe`)

3. **Crystal Ball WebGL**

- Center orb with convincing glass feel (rim light + internal depth)
- Inside: colorful nebula + star nodes representing 5+ apps
- Star nodes have hover and click behaviors

4. **Animation Language**

- Intro: “reveal universe” triggers orb ignition + nebula bloom
- Scroll: gentle progression (e.g., rotate orb slightly, shift camera depth, change palette by constellation)
- Hover: star brightens + halo + tiny parallax distortion
- Click: small supernova burst + focus overlay showing project details (logo/screenshot placeholders + link buttons)

5. **Project Model**

- Hard-coded JSON of 5+ projects with fields:
  - `id`, `name`, `tagline`, `category`, `logoUrl?`, `mediaType?` (`image|video`), `mediaUrl?`, `links[]` (GitHub, App Store, Live demo)

- Each project maps to a star position and a color accent

---

## Guardrails / Quality Bar

- Target **60fps desktop**; degrade gracefully on slower GPUs
- Clamp DPR to avoid 4K meltdown
- Respect `prefers-reduced-motion`
- Keep text crisp: use HTML overlay for labels rather than drawing text in WebGL
- Keep the “steampunk” aesthetic tasteful — avoid unreadable clutter

---

## Output Expectations

Return:

1. A brief **style guide** (materials, colors, type, effects)
2. A file tree + instructions to run locally
3. The **single HTML POC** (plus any minimal JS/CSS files if absolutely necessary)
4. A short Devil’s Advocate section: top 5 risks + fixes

Make the result feel like: **a Victorian instrument panel that reveals a living cosmic project universe inside a crystal ball.**
