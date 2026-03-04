# Research: Arcane Console POC

**Phase 0 Output** | **Date**: 2026-03-04

## Technology Decisions

### 1. Three.js Version & Loading Strategy

**Decision**: Three.js 0.162.0 via unpkg CDN with ES module importmap
**Rationale**: Version 0.162.0 supports MeshPhysicalMaterial with transmission, EffectComposer post-processing, and Sprite raycasting. Pinning avoids breaking changes from Three.js's unstable inter-version API. ES module importmap allows `import * as THREE from 'three'` without a bundler.
**Alternatives considered**: Raw WebGL (too much boilerplate for POC), r169+ (untested with current shader plan), local bundle (adds build step, violates Constitution I).

```html
<script type="importmap">
{ "imports": {
    "three": "https://unpkg.com/three@0.162.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.162.0/examples/jsm/"
}}
</script>
```

### 2. GSAP Version & Plugin Strategy

**Decision**: GSAP 3.12.5 core + ScrollTrigger + TextPlugin + CustomEase via cdnjs CDN (non-module scripts)
**Rationale**: GSAP's "No Charge" license explicitly covers personal portfolios. ScrollTrigger handles scroll-pinning and scrub. TextPlugin handles typewriter effects. CustomEase handles gauge needle damping. MotionPathPlugin is optional (supernova burst can use simple gsap.to x/y).
**Alternatives considered**: CSS @scroll-timeline (insufficient browser support), Intersection Observer + CSS transitions (insufficient control for cinematic sequences), Lenis smooth scroll (adds dependency for minimal gain).

### 3. Glass Material Approach

**Decision**: Start with MeshPhysicalMaterial (transmission: 0.92, roughness: 0.05, IOR: 1.5) as fast path. Add custom Fresnel ShaderMaterial rim sphere on BackSide for the rim glow.
**Rationale**: MeshPhysicalMaterial handles transmission, metalness, and IOR natively without custom GLSL. The BackSide rim sphere is cheap and provides immediate glass feel. Full custom ShaderMaterial is the upgrade path if needed.
**Alternatives considered**: Full custom ShaderMaterial (more control but higher dev cost for POC), MeshPhongMaterial (insufficient glass quality), CSS filter approximation (not convincing).

### 4. Nebula Implementation

**Decision**: 3 layered THREE.Points clouds (~1500 total particles) with additive blending. Color regions via per-particle vertex colors lerped between project accent colors.
**Rationale**: Points-based approach is 1 draw call per layer (3 total), handles 1500 particles trivially, and supports additive blending for glow. Procedural-first (no texture files). Slow drift via per-layer rotation in the render loop.
**Alternatives considered**: Full procedural fBm shader on sphere shells (more beautiful but shader-heavy on integrated GPU — reserved as Tier 1 upgrade), volumetric raymarching (too expensive for POC), texture-based nebula sprites (adds texture files, violates procedural-first).

### 5. Star Node Architecture

**Decision**: 7 individual THREE.Sprite objects with canvas-drawn radial gradient textures. One companion halo sprite per star (created on demand during hover).
**Rationale**: Sprites give per-object raycasting for free (no custom picking math). Canvas-drawn textures avoid external files. Individual objects allow GSAP to animate each star independently. 7 objects is trivial for any GPU.
**Alternatives considered**: THREE.Points (can't individually raycast without threshold hacks), InstancedMesh (overkill for 7 objects), billboarded quads (more setup, same result).

### 6. Post-Processing Pipeline

**Decision**: EffectComposer with 4 passes: RenderPass → UnrealBloomPass (strength 0.8, threshold 0.85, 0.75x resolution) → custom ShaderPass (chromatic aberration + vignette combined) → OutputPass.
**Rationale**: Bloom is essential for the glowing-stars-in-dark-space look. Combining chromatic aberration and vignette into one custom pass keeps the total at 4. Bloom at 0.75x resolution reduces fragment cost without visible quality loss.
**Alternatives considered**: No post-processing (stars look flat), separate passes for each effect (6+ passes, too expensive), CSS filter: blur() overlay (cheap but imprecise).

### 7. Font Loading Strategy

**Decision**: Google Fonts CDN with `font-display: block` for Cinzel (display), `font-display: swap` for JetBrains Mono and IM Fell English. Single `<link>` tag loading all 3 families. CSS fallback stack: Georgia (serif), Courier New (mono).
**Rationale**: `font-display: block` on Cinzel prevents FOUT on the steampunk frame headers during the reveal sequence (font loads during the ~1-2s intro animation). `swap` is fine for mono and body since their fallbacks are visually acceptable.
**Alternatives considered**: Self-hosted fonts (adds complexity, violates single-file spirit), system fonts only (loses Victorian aesthetic), font-display: optional (may never show custom font on slow connections).

### 8. Scroll Architecture

**Decision**: Single ScrollTrigger with `pin: "#scene-viewport"`, `scrub: 1.5`, and a tall invisible `#scroll-driver` div (~400vh). Three constellation zone sub-triggers with `onEnter`/`onLeaveBack` callbacks. GSAP proxy object pattern for Three.js property updates.
**Rationale**: Pinning the viewport while the invisible scroll-driver provides scroll room is the standard GSAP pattern for WebGL scroll integration. Proxy objects avoid direct Three.js object animation in scrubbed timelines (prevents GSAP/render-loop conflicts). 300px max pin completion per Constitution.
**Alternatives considered**: Multiple pinned sections (more complex, harder to coordinate), native scroll with Intersection Observer (insufficient for smooth scrub-linked animation), no scroll interaction (loses the passive discovery path).

## No Unresolved Items

All technology decisions are resolved. No NEEDS CLARIFICATION items remain. The brainstorming phase (INIT.md) and constitution resolved all ambiguities prior to this phase.
