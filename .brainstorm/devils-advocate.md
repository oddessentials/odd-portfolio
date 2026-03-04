# Devil's Advocate Risk Assessment
## Victorian Techno-Mage Portfolio POC

**Reviewer:** Devil's Advocate
**Date:** 2026-03-04
**Scope:** Single-HTML-file POC with Three.js WebGL crystal ball + GSAP scroll + steampunk frame

---

## 1. Performance Landmines

### WebGL on Integrated GPUs
**Risk:** Intel Iris Xe and AMD Radeon 680M — the most common developer laptop GPUs — handle the planned combination of: rendered orb sphere with glass shader + nebula particle system + post-processing stack. Real-world frame budget at 1080p with DPR 1.5 leaves roughly 8ms for GPU work. The orb glass shader alone (refraction approximation + rim light + internal depth fake) can eat 4–6ms on integrated GPUs.

**Fix:** Hard-cap the nebula particle count at 500 for the POC. Use a single fullscreen post-processing pass (combine bloom + chromatic aberration in one shader) rather than chaining multiple passes. Provide a `performance.now()`-based frame time detector that downgrades particle count if the first 3 frames average >20ms.

### Shader Complexity Budget
**Risk:** A convincing glass refraction illusion typically requires: environment map lookup, Fresnel calculation, chromatic dispersion offset, and a subtle internal caustic or dust-mote effect. That's 4 texture samples + multiple math operations per fragment. On a POC timeline, this will either be undercooked (doesn't look glass-like) or overcooked (tanks performance). There's no middle path without real iteration time.

**Fix:** Use a fake glass technique instead of real refraction: a static cubemap baked from a skybox, a screenspace texture grab (if WebGL2 is available), or simply a strong rim glow + internal glow gradient that *reads* as glass without computing it. This is 80% of the visual payoff at 20% of the GPU cost.

### Particle Count Limits
**Risk:** The nebula "colorful starfield" description will tempt the implementer toward 5,000–10,000 particles. At that count, with per-particle shader logic and blending, mobile/integrated GPUs will drop to 20–30fps. Worse, if instanced geometry isn't used (just `THREE.Points`), draw calls multiply and CPU-side JS becomes the bottleneck.

**Fix:** Hard rule: 500 nebula background stars, 50 "dust cloud" quads with additive blending, 7 project stars as separate interactive meshes. Total geometry budget <600 draw objects. Use `THREE.InstancedMesh` for the starfield.

### Post-Processing Pipeline Cost
**Risk:** UnrealBloomPass in Three.js renders the scene multiple times (5+ passes for a mip chain). Combined with a chromatic aberration pass, that's 6–7 render passes on every frame. This is the single most common cause of portfolio demo frame drops. On a MacBook Pro M-series at 120Hz, this looks great. On a ThinkPad with Intel Iris, this is 15fps.

**Fix:** Replace UnrealBloomPass with a single-pass fake bloom: render to a half-res offscreen target, blur it with a two-pass separable Gaussian (only 2 render passes total), composite over the main scene. Skip chromatic aberration entirely for the POC — it adds cost with minimal perceived quality gain for a crystal ball.

### Total Page Weight
**Risk:**
- Three.js r160 minified+gzipped: ~150KB
- GSAP + ScrollTrigger minified+gzipped: ~50KB
- Noise/nebula textures (even 512x512 PNG): ~200KB each, 2–3 textures = 400–600KB
- Serif decorative font (e.g., Cinzel): ~80KB per weight, 2 weights = 160KB
- Mono terminal font (e.g., Share Tech Mono): ~40KB
- The `.gif` trailer for odd-ai-reviewers: **the file exists and is probably 2–5MB**
- Total realistic estimate: **1.5–2MB cold load**

**Fix:** Do not use the GIF in the POC. Convert it to a 480p WebM or just show a static poster frame. Use `font-display: swap`. Load Three.js from CDN only if the team can agree on a pinned version (see Technical Gotchas). Target <800KB total.

### DPR 3.0 Devices (MacBook Pro Retina)
**Risk:** A MacBook Pro 14" at native resolution has a DPR of 2.0–3.0 and a viewport of ~3024×1964 CSS pixels. The WebGL canvas at full resolution renders 9+ million pixels per frame. At 120Hz ProMotion, the GPU is rendering >1 billion pixels per second just for the orb scene. Three.js's default `renderer.setPixelRatio(window.devicePixelRatio)` will do this unclamped.

**Fix:** `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — already mentioned in the concept guardrails, but it MUST be enforced. DPR 2.0 at 1440p CSS resolution = 2880×1800 physical pixels. Acceptable. DPR 3.0 = 4320×2700. Not acceptable for a POC.

### Mobile Reality Check
**Risk:** "Not a target" means nothing when someone texts a portfolio link during a job interview. Mobile Safari on iPhone 14 Pro: WebGL2 support is good, but the GPU is bandwidth-constrained. The orb will render, but if the page doesn't respond to touch or renders at desktop canvas size, it will look broken. Recruiters and hiring managers frequently check portfolio links from phones.

**Fix:** Add a single CSS media query that replaces the full canvas with a static SVG or PNG screenshot of the orb at mobile breakpoints. This takes 30 minutes and prevents a broken first impression. The Three.js scene only initializes on `window.innerWidth >= 768`.

---

## 2. UX / Interaction Risks

### Crystal Ball Discoverability
**Risk:** Stars inside a rotating nebula inside a glass orb are not obviously clickable. Users who don't hover over a star within the first 10 seconds will assume the animation is purely decorative and scroll past. There's no natural affordance — no cursor change hint (WebGL canvas ignores CSS `cursor`), no label, no pulse.

**Fix:** On page load (after the reveal sequence), trigger a one-time "scanning" animation: project stars pulse with a white ring expanding outward (like a sonar ping), and the command line at the bottom prints `> 7 anomalies detected. Investigate?`. This is thematic AND it teaches the user there's something interactive without breaking immersion.

### Scroll Hijacking
**Risk:** GSAP ScrollTrigger with `pin: true` freezes the user's normal scroll behavior while the pinned section is active. Users on trackpads or who scroll quickly will hit the pin zone, get confused by the arrested scroll, and potentially close the tab before the animation completes. This is one of the most-cited UX complaints about creative portfolios.

**Fix:** Keep pin duration short: the pinned section should complete its animation within ~300px of scroll distance (roughly one aggressive scroll gesture). Add a "skip intro" mechanism (keyboard `S` or a visible button that fades after 3 seconds). Never pin for more than one viewport height of scroll distance.

### Motion Sickness Risk
**Risk:** The plan includes: parallax depth on the frame (foreground elements move at different rates), orb rotation (continuous), nebula particle drift (slow but continuous), hover tilt (spatial shift), and scroll-driven camera movement inside the orb. Individually, these are fine. Combined, they create a vestibular overload for users with motion sensitivity. This is not a hypothetical — 30% of users experience some form of motion-induced discomfort.

**Fix:** `prefers-reduced-motion` must disable: continuous orb rotation, nebula drift, hover tilt, and parallax. What remains: static orb with glow, click interaction still works, scroll-linked opacity fades only (no positional animation). This must be tested with the macOS accessibility setting turned on before calling the POC done.

### Dark Theme Readability
**Risk:** Brass (#B5A642 or similar) on dark walnut (#3D2B1F or similar) has an approximate contrast ratio of 2.8:1 — well below WCAG AA's 4.5:1 for normal text, and below even the 3:1 threshold for large text. Steampunk UI is almost always illegible at the detail level. The concept mentions "still readable and modern" but the color palette will naturally push toward illegibility.

**Fix:** Never use brass as text on dark wood. Use brass for borders, gauges, and decorative elements only. For readable text: use off-white (#F0EDE0, parchment) for primary labels, use brass for accent/glyph elements only. HUD text should be the monospace "terminal green" (#7FBA00 or a softer mint) on near-black, which reads as both thematic and high-contrast.

### "Cool Demo" vs "Useful Portfolio"
**Risk:** A visitor who spends 90 seconds being dazzled by the orb and then closes the tab without visiting a single project link is a failed portfolio interaction. The wow factor actively competes with the actual goal: showing the work. This is the central tension of creative portfolios. The more immersive the wrapper, the harder it is to reach the content.

**Fix:** The project overlay (post-click) must be fast, legible, and have exactly two obvious CTAs: GitHub link and Live Demo link. No animation on the overlay reveal — it should feel like a quick instrument panel readout, not another show. The overlay should include a real screenshot or the available asset (logo, screenshot), not a placeholder. At least 3 of the 7 projects have usable assets right now.

### Video Autoplay
**Risk:** The `odd-fintech-video.mov` file is listed as a project asset. Even if it were converted to WebM/MP4, autoplay with sound is blocked in all major browsers unless the video is muted. Worse, `.mov` files are QuickTime format and will not play in Chrome or Firefox on Windows/Linux without a codec plugin. If the implementation tries to play this directly, it will silently fail with no error shown to the user.

**Fix:** The `.mov` must be converted to `.mp4` (H.264) and `.webm` (VP9) before use. Use `autoplay muted playsinline loop` attributes. In the POC context: just use a static poster frame from the video — this takes 5 minutes with ffmpeg and avoids the entire video pipeline problem.

### Command Line UI
**Risk:** The bottom command line (showing `> reveal universe`) is charming for developers but alienating for non-technical visitors. If the portfolio is meant to attract any non-developer audience (designers, product managers, potential clients), the command line metaphor creates an immediate "this isn't for me" moment.

**Fix:** Keep the command line as a read-only narrative device — it prints thematic status messages but the user never has to type into it. Never make the CLI interactive or imply they need to type commands. If they hover near it, show a tooltip: "the machine speaks for itself." The passive use of the CLI motif is charming; requiring interaction with it is a mistake.

---

## 3. Technical Gotchas

### Safari WebGL Shader Compilation
**Risk:** WebKit's GLSL compiler is stricter about implicit type conversions, `#extension` directives, and precision qualifiers than Chrome's ANGLE layer. A shader that compiles and runs perfectly in Chrome will silently fail to compile in Safari, often resulting in a black canvas with no console error visible to the user (only in Web Inspector). Safari also has a hard limit on uniform block sizes and texture unit counts that differ from Chrome.

**Fix:** Test in Safari at least once before declaring the POC done. Use `mediump` precision explicitly. Avoid integer arithmetic in shaders (use floats). Include a `renderer.compile()` call at startup and catch `WebGLRenderingContext.getError()` to surface silent failures. Have a fallback static image of the orb that Safari users see if WebGL setup fails.

### Firefox WebGL Context Loss
**Risk:** Firefox is more aggressive than Chrome about reclaiming WebGL contexts when the tab is backgrounded or the system is under memory pressure. Without a `webglcontextlost` event handler, the page will show a blank canvas if the user switches tabs during the intro sequence and comes back.

**Fix:** 10 lines of code: listen for `webglcontextlost`, call `event.preventDefault()`, set a flag, listen for `webglcontextrestored`, and call `renderer.forceContextRestore()`. This is table stakes for any WebGL page.

### Three.js Version Pinning
**Risk:** Three.js has no stable API contract between minor versions. r150 vs r160 has breaking changes in the post-processing pipeline, the GLTF loader API, and the `WebGLRenderer` constructor options. If the team uses an unpinned CDN URL (`three@latest`), a Three.js release during development could break the demo. CDN-delivered Three.js also cannot be tree-shaken, so the full ~600KB bundle is loaded even if only 30% is used.

**Fix:** Pin to a specific version: `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js`. For a single-file POC, CDN is acceptable — just pin the version. Do not use `@latest` or `@next`.

### GSAP Licensing
**Risk:** GSAP's free "No Charge" license covers most use cases including portfolios, but the ScrollTrigger plugin specifically requires a GSAP Club membership (paid) for commercial use. A portfolio that is used to attract paid client work or employment arguably constitutes commercial use. The free tier allows it for "personal" and "educational" projects, but the line is blurry. Getting a DMCA takedown on a portfolio for unlicensed GSAP use would be embarrassing.

**Fix:** GSAP has a "No Charge" license that explicitly covers personal portfolios. Read the actual license at gsap.com/licensing — it permits this use. But: if the team is uncertain, implement scroll-driven animations using native CSS `@scroll-timeline` (Chrome 115+) or the Intersection Observer API with CSS transitions. This is less powerful but has zero licensing risk. For a POC, this is probably sufficient.

### YouTube Embed in WebGL Overlay
**Risk:** The `odd-ai-reviewers` project has a YouTube link. If the implementation tries to embed a YouTube iframe inside or near the WebGL canvas, z-index conflicts will occur: the canvas is a composited layer, iframes are also composited layers, and their stacking order behaves unpredictably across browsers. Chrome handles it best; Safari has known issues with composited layer z-ordering; Firefox sometimes renders the iframe below the canvas regardless of z-index.

**Fix:** Do not embed YouTube inline. In the project overlay, use a thumbnail image (fetchable at `https://img.youtube.com/vi/rkDQ7ZA47XQ/maxresdefault.jpg`) with a play button overlay that opens the YouTube link in a new tab. This is simpler, faster, and avoids the entire iframe compositing problem.

### Font Loading FOUT
**Risk:** A decorative serif font (e.g., Cinzel, Playfair Display, or similar Victorian-appropriate typeface) loaded via Google Fonts will trigger a Flash of Unstyled Text (FOUT) — the user will see system-default serif text in the steampunk frame for 200–500ms before the custom font loads. This breaks the immersive first impression, especially if the frame text is styled and sized for the decorative font.

**Fix:** Use `<link rel="preload" as="font">` for critical fonts. Set `font-display: block` (not `swap`) for the decorative header font — this hides text until the font loads rather than showing a system-font flash. Since the reveal sequence has a ~1–2 second intro animation, the font will have loaded before the text appears. For the monospace terminal font, `font-display: swap` is fine since monospace fallbacks look acceptable.

### MOV Video Format
**Risk:** `.mov` is a QuickTime container format. It plays natively in Safari/macOS and in Windows 10/11 with the HEVC Video Extensions installed. It does NOT play in Chrome, Firefox, or Edge on Windows without codec support. The `odd-fintech-video.mov` file in design-assets will silently fail to play on most users' browsers. There is no `<video>` fallback format listed.

**Fix:** Before implementation begins, convert `odd-fintech-video.mov` to two formats:
```
ffmpeg -i odd-fintech-video.mov -c:v libx264 -crf 23 -movflags faststart odd-fintech-video.mp4
ffmpeg -i odd-fintech-video.mov -c:v libvpx-vp9 -crf 30 -b:v 0 odd-fintech-video.webm
```
Use `<video>` with both sources. In the POC, just use the MP4 with a static poster frame from the video as fallback.

---

## 4. Asset & Content Gaps

### Projects Without Logos
The following 4 of 7 projects have **no logo asset**:
- `repo-standards` — no logo, no screenshot
- `odd-self-hosted-ci-runtime` — no logo, no screenshot
- `odd-map` — no logo, no screenshot (has a live demo URL)
- `coneyislandpottsville.com` — no logo, no screenshot, no description in portfolio-basic-list.md (the entry for item 7 is just a URL)

**Fix:** For the POC, generate placeholder glyphs in CSS/SVG that are thematic (gear icon for CI runtime, map pin for odd-map, etc.). Do not block implementation on real logos. Use the project's dominant color from its GitHub language stats as its star color.

### Projects Without Screenshots
5 of 7 projects have no screenshot:
- `odd-ai-reviewers`: has a GIF trailer and banner (usable)
- `ado-git-repo-insights`: has 3 screenshots and a logo (best-assets project)
- `repo-standards`: nothing
- `odd-self-hosted-ci-runtime`: nothing
- `odd-map`: has a live demo at maps.oddessentials.com (screenshottable)
- `odd-fintech`: has a logo and video (but video is .mov)
- `coneyislandpottsville.com`: nothing; the site exists at the URL (screenshottable)

**Fix:** Block out 30 minutes to take browser screenshots of odd-map (live demo) and coneyislandpottsville.com before implementation. These are the easiest wins. For repo-standards and OSCR, use the GitHub repo's README header if one exists; otherwise use a generated tech-stack badge composition.

### Missing Favicon, OG Image, Meta Tags
**Risk:** When the portfolio is shared on LinkedIn, Slack, or iMessage, the link preview will show a blank white square and the page title as the description. This is a missed branding opportunity every time someone shares the link.

**Fix:** Create a minimal OG image (1200×630) using the steampunk orb as a static illustration — this can be a CSS/canvas screenshot or a hand-exported image. Add `<meta property="og:image">`, `<meta name="description">`, and a `<link rel="icon">` pointing to a small brass-gear SVG. This is 20 minutes of work and has outsized impact.

### No Description for coneyislandpottsville.com
**Risk:** Item 7 in portfolio-basic-list.md is literally just two URLs with no description, no tagline, no asset reference. The implementer has zero context for what this project is or how to present it.

**Fix:** The owner must provide a one-sentence description and tagline before this project can be included. If that doesn't happen before POC implementation, drop it to 6 projects and note the gap. Including it as a placeholder with a made-up description is worse than omitting it.

---

## 5. Scope Creep Warnings

### "Just One More Shader Effect" Syndrome
**Risk:** The orb shader is inherently a rabbit hole. Once the glass refraction is working, the temptation to add caustics, volumetric light rays, internal dust motes, and animated rune patterns on the frame is overwhelming. Each addition seems small but collectively they double the implementation time.

**Fix:** The shader feature list is frozen at: rim glow, internal nebula glow, subtle Fresnel-based transparency at edges. Nothing else. Any additional shader effect requires explicit approval from the team lead and must be tracked as a separate task. No "while I'm in here" additions.

### Constellation Grouping Logic Overcomplication
**Risk:** The concept mentions "constellation regions" and "palette by constellation." This implies a spatial clustering algorithm for star positions, region boundary detection, and per-region color/palette management. For 7 stars, this is over-engineered. The implementer will be tempted to build a generalized constellation system that works for N projects.

**Fix:** Hard-code 7 star positions as (theta, phi) values on the sphere surface. Hard-code their colors. There is no constellation grouping system in the POC. That's a v2 feature.

### Responsive Design Creep
**Risk:** Once the desktop layout is working, the team will notice it looks broken on 1280px wide windows (a common developer screen width). Then someone will "just fix the tablet layout" which requires restructuring the frame CSS. Then mobile comes up again.

**Fix:** Design target is 1440px wide desktop. Set a minimum width on the body of 1200px. Below that, show a centered message: "This experience is best viewed on a wider screen." This takes 5 lines of CSS and prevents a week of responsive work.

### Sound Design Temptation
**Risk:** "It would be cool if clicking a star made a subtle chime sound" will come up. Audio on the web is a minefield: AudioContext requires user gesture to initialize, different browsers have different autoplay policies, the sound design itself requires iteration time, and it adds another creative dimension that's out of scope for a visual POC.

**Fix:** No audio in the POC. Period. Document this decision explicitly so it doesn't come up again mid-implementation.

### Multiple Rendering Modes
**Risk:** "We should add a 2D fallback for when WebGL isn't available" will be proposed. This is a second, complete implementation of the portfolio's visual design in CSS/SVG. It's a reasonable accessibility consideration but it's not a POC task.

**Fix:** The WebGL fallback is a static PNG screenshot of the orb with the steampunk frame as pure CSS. The frame CSS renders without WebGL. The orb area shows the static image. This is the fallback. It's not a full 2D animation system.

### Over-Engineering the Project Data Model
**Risk:** The concept specifies a JSON array with 7 fixed fields. Someone will propose adding: categories, tags, tech stacks, collaborators, publication dates, star count badges from GitHub API, and dynamic data fetching. This is a data modeling exercise that adds zero visual value to the POC.

**Fix:** The data model is exactly what the concept spec says: `id, name, tagline, category, logoUrl, mediaType, mediaUrl, links[]`. No additional fields until v1 ships.

---

## 6. Accessibility Gaps

### Screen Readers and WebGL
**Risk:** The crystal ball scene is entirely invisible to screen readers. If the project stars, their names, and the interaction are inside the WebGL canvas, a screen reader user will hear nothing meaningful. This violates WCAG 2.1 Success Criterion 1.1.1 (Non-text Content).

**Fix:** Add an `aria-label` to the canvas: `"Interactive 3D visualization of projects. Use the project list below to navigate."` Then include a visually-hidden (`.sr-only`) ordered list of all 7 projects with their names, taglines, and links. This list is always present in the DOM — the WebGL is progressive enhancement on top of accessible HTML. This also solves the JS-disabled case.

### Keyboard Focus in 3D Space
**Risk:** Keyboard users cannot navigate to stars inside the WebGL canvas. Tab order stops at the canvas element. There's no way to press Enter to "click" a star without a separate keyboard interaction system.

**Fix:** The `.sr-only` project list serves as the keyboard navigation interface. Each list item has a focusable `<a>` tag or `<button>`. Focusing one highlights the corresponding star in the orb (via a JS event). This requires a focus→star mapping but uses standard HTML focus management, not WebGL raycasting for keyboard users.

### Color-Only Differentiation in Nebula Regions
**Risk:** If the only way to distinguish constellation regions is by nebula color (red region = fintech, blue region = tools, etc.), colorblind users lose the spatial meaning of the visualization. Protanopia and deuteranopia affect ~8% of males.

**Fix:** Add thematic icon glyphs or shapes near the star clusters (visible as HTML overlays, not WebGL geometry) that use shape, not just color, to differentiate regions. This doubles as discoverability affordance.

### prefers-reduced-motion
**Risk:** The `prefers-reduced-motion` media query is mentioned in the concept guardrails but "ensuring content is still compelling without animation" is hard. If all motion stops, the page becomes a static dark background with a sphere — potentially less legible than a normal portfolio page.

**Fix:** In reduced-motion mode: the orb is static but still visible, the nebula is static but colorful, star interactions work via click (no hover tilt), the reveal sequence is instant (no animation), and the frame appears immediately styled. The content should be fully readable. This state must be explicitly designed, not left as an afterthought.

### prefers-contrast in Dark Ornamental Theme
**Risk:** `prefers-contrast: more` (Windows High Contrast mode, or the macOS Increase Contrast accessibility setting) will override custom CSS colors. Brass borders may disappear; the ornamental frame may collapse to a white box. Dark backgrounds may flip to white. The thematic design is incompatible with high-contrast mode by default.

**Fix:** Add a `@media (prefers-contrast: more)` block that: sets text to white on black, replaces decorative borders with simple white outlines, hides purely ornamental elements (gauges, rune overlays), and ensures the project list and links are fully legible. This is override CSS, not a redesign.

---

## 7. Pre-Requisite Assets Checklist

### MUST exist before implementation begins
- [ ] `odd-fintech-video.mov` converted to `odd-fintech-video.mp4` and `odd-fintech-video.webm`
- [ ] Description and tagline for `coneyislandpottsville.com` (from the owner)
- [ ] Decision on which 5–7 projects are in scope (if coneyisland is dropped, confirm 6)
- [ ] Font selection confirmed (specific Google Fonts URL pinned, not open-ended)
- [ ] Three.js version pinned (specific semver, e.g., `0.169.0`)

### Team CAN generate with code
- [x] SVG placeholder logos for projects without logo assets (CSS/SVG glyph icons)
- [x] Star positions (hard-coded theta/phi values for 7 stars on a sphere)
- [x] Nebula texture (procedural noise in GLSL — no external texture file needed)
- [x] Steampunk frame decorations (CSS gradients + box-shadow + pseudo-elements)
- [x] Brass/gear favicon (inline SVG data URI)
- [x] OG image (canvas-rendered or manually assembled in a browser screenshot)
- [x] Accessibility shadow DOM (`.sr-only` list, ARIA labels)

### Needs human design input or external sourcing
- [ ] Color palette — must be finalized before CSS is written (hex values, not just descriptions)
- [ ] Typography pairing confirmed — specific font names and weights
- [ ] Ornamentation level approved — exactly which frame elements (gauges count? rune count? gear positions?)
- [ ] Screenshots of `odd-map` and `coneyislandpottsville.com` (browser screenshot, 1–2 minutes each)
- [ ] Logo or representative image for `repo-standards` and `odd-self-hosted-ci-runtime`

### Video file conversion requirements
The `odd-fintech-video.mov` file must be converted before it can be used in any browser context.

**Required outputs:**
```
ffmpeg -i design-assets/odd-fintech-video.mov \
  -c:v libx264 -crf 23 -preset slow -movflags +faststart \
  -vf "scale=1280:-2" \
  design-assets/odd-fintech-video.mp4

ffmpeg -i design-assets/odd-fintech-video.mov \
  -c:v libvpx-vp9 -crf 30 -b:v 0 \
  -vf "scale=1280:-2" \
  design-assets/odd-fintech-video.webm
```

The GIF trailer (`odd-ai-reviewers-trailer.gif`) should also be evaluated — GIFs are notoriously large. If it's >1MB, convert to a looping WebM:
```
ffmpeg -i design-assets/odd-ai-reviewers-trailer.gif \
  -c:v libvpx-vp9 -b:v 0 -crf 30 -loop 0 \
  design-assets/odd-ai-reviewers-trailer.webm
```

---

## 8. Top 10 Risks (Ranked by Likelihood × Impact)

| Rank | Risk | Likelihood | Impact | Score | Fix |
|------|------|-----------|--------|-------|-----|
| 1 | **Post-processing destroys framerate on integrated GPUs** | High | High | 9 | Replace multi-pass bloom with single-pass fake bloom; remove chromatic aberration |
| 2 | **MOV video format fails silently in Chrome/Firefox** | Certain | High | 9 | Convert to MP4+WebM before any implementation touches the video asset |
| 3 | **Crystal ball interactivity is not discoverable — users miss it** | High | High | 9 | Add one-time "anomaly detected" sonar pulse animation + bottom CLI prompt |
| 4 | **Scroll hijacking frustrates users before they see projects** | High | High | 8 | Limit pin to <300px scroll distance; add skip-intro button |
| 5 | **DPR 3.0 renders 9M+ pixels per frame, kills GPU** | Medium | High | 8 | Enforce `Math.min(window.devicePixelRatio, 2)` before renderer creation |
| 6 | **coneyislandpottsville.com has no description or assets** | Certain | Medium | 7 | Owner must provide tagline or project is dropped from POC |
| 7 | **Safari WebGL shader compilation silent failure** | Medium | High | 7 | Test in Safari before declaring done; add WebGL error detection + static fallback |
| 8 | **prefers-reduced-motion not actually implemented** | High | Medium | 7 | Design the reduced-motion state explicitly; it must be a named requirement, not a note |
| 9 | **Scope creep from shader/effect additions doubles timeline** | High | Medium | 7 | Freeze shader feature list; require explicit approval for any addition |
| 10 | **Text contrast fails: brass on dark wood is ~2.8:1** | Certain | Medium | 6 | Use brass only for decoration; use parchment/mint for all readable text |

### Honorable Mentions (just outside top 10)
- **Font FOUT breaks immersive reveal sequence** — Fix: `font-display: block` on decorative fonts
- **WebGL context loss on Firefox tab switch** — Fix: 10-line context loss/restore handler
- **YouTube iframe z-index conflicts with canvas** — Fix: Thumbnail + external link only; no inline embed
- **motion sickness from compounded parallax/rotation/drift** — Fix: `prefers-reduced-motion` (see rank 8) and keeping individual motion effects subtle

---

## Summary Verdict

The POC plan is achievable and the creative vision is strong. The core risks fall into two categories:

**Execution risks (things that will definitely happen without guardrails):**
- Post-processing performance collapse
- MOV video format failure
- Interactivity discoverability failure
- Scroll hijacking frustration

**Neglect risks (things that get skipped under time pressure):**
- `prefers-reduced-motion` implementation
- Safari/Firefox cross-browser testing
- Contrast ratios on dark theme
- Accessibility shadow DOM for screen readers

The POC will land the wow factor. The question is whether it also functions as an actual portfolio that communicates the work. If the stars are not discoverable and the project overlays don't load their media, the orb is just a screensaver. Enforce the fix for discovery (rank 3) and overlay content (use real assets for at least 3 projects) as hard requirements, not nice-to-haves.
