# Technical Artist Brainstorm: Shader Pipeline, Textures, Visual Effects
## Victorian Techno-Mage Portfolio — Crystal Ball WebGL POC

---

## 1. Crystal Ball Shader

### Core Approach

Use a custom `THREE.ShaderMaterial` on a sphere geometry (radius ~1.0, 64x64 segments for smooth silhouette). Two concentric sphere layers:
- **Outer glass shell** — handles refraction illusion, rim glow, Fresnel edge
- **Inner content sphere** — nebula + stars, clipped to orb interior

### Glass Refraction Illusion

No real ray-traced refraction for POC. Fake it convincingly with:

1. **Environment distortion**: Sample a CubeRenderTarget (low-res, 128px) or a pre-baked equirectangular texture of the scene interior. Distort UVs using the surface normal + camera view vector.
2. **Normal perturbation**: Add subtle Perlin noise to the surface normal before computing the refraction vector, creating "handmade glass" imperfections.
3. **Index of refraction offset**: Shift the sampling UV by a small amount based on the view angle — simulates how glass bends light from behind.

```glsl
// Fragment shader: fake refraction offset
vec3 viewDir = normalize(vWorldPosition - cameraPosition);
vec3 perturbedNormal = normalize(vNormal + 0.04 * snoise(vWorldPosition * 3.0));
vec3 refractVec = refract(viewDir, perturbedNormal, 1.0 / 1.52); // ior ~1.52 for glass
vec2 screenUV = gl_FragCoord.xy / resolution;
vec2 refractOffset = refractVec.xy * 0.06;
vec4 refractSample = texture2D(tBackground, screenUV + refractOffset);
```

### Rim Glow (Fresnel)

Classic Fresnel term drives edge glow. Color the rim with a warm amber/gold for the steampunk candlelight aesthetic, plus a secondary cool blue-violet from nebula light spill.

```glsl
// Fresnel rim glow
float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(-vViewDir)), 0.0), 3.5);
vec3 rimColor = mix(vec3(0.9, 0.6, 0.2), vec3(0.4, 0.3, 0.9), uScrollProgress);
gl_FragColor.rgb += rimColor * fresnel * 1.4;
```

Scroll progress allows rim color to shift from warm candlelight amber toward cool nebula violet as user scrolls deeper.

### Internal Depth (Layered Sphere Technique)

Render 3–4 transparent sphere shells at r = 0.97, 0.90, 0.80, each with slightly different nebula sampling UV offsets to create parallax depth:

- Shell 4 (outermost glass): Fresnel + refraction distortion, additive glow
- Shell 3 (r=0.97): Faint wisps, very low opacity (~0.15), nebula edge glow
- Shell 2 (r=0.90): Main nebula color body, opacity ~0.5
- Shell 1 (r=0.80): Dense core regions, star field sprites on top

Offset each shell's nebula UV sample by a small parallax vector based on view direction:

```glsl
vec2 parallaxOffset(vec3 viewDir, float depth) {
    return viewDir.xy * depth * 0.05;
}
```

### Surface Imperfections (Handmade Glass)

Layered procedural noise at two scales:
- Large scale (frequency ~1.5): Subtle "casting bubbles" — very low opacity light blobs
- Small scale (frequency ~8.0): Microscopic surface texture, shifts specular highlight

```glsl
float bubbleNoise = snoise(vLocalPos * 1.5 + uTime * 0.02) * 0.5 + 0.5;
float microNoise = snoise(vLocalPos * 8.0) * 0.5 + 0.5;
float glassSurface = bubbleNoise * 0.03 + microNoise * 0.01;
// Add to specular highlight
float specular = pow(max(dot(reflect(-lightDir, perturbedNormal), viewDir), 0.0), 64.0);
specular += glassSurface;
```

---

## 2. Nebula Visuals

### Procedural Noise Strategy

Use **fBm (fractional Brownian motion)** layered Simplex noise as the foundation. No texture lookup needed — entirely procedural, zero texture memory cost.

```glsl
// Simplex noise 3D (include Stefan Gustavson's implementation)
// fBm accumulator
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.1;
        amplitude *= 0.5;
    }
    return value;
}

// Domain-warped nebula for organic tendrils
float warpedNebula(vec3 p, float time) {
    vec3 q = vec3(
        fbm(p + vec3(0.0, 0.0, time * 0.05)),
        fbm(p + vec3(5.2, 1.3, time * 0.04)),
        fbm(p + vec3(9.7, 2.8, time * 0.03))
    );
    return fbm(p + 1.5 * q);
}
```

Domain warping (feeding fBm output back as input offset) creates the characteristic nebula "tendril" look.

### 7 Project Color Territories

Each project star "owns" a region of the nebula defined by proximity. The nebula color blends between project accent colors based on distance from each star's angular position on the sphere surface.

| Project | Accent Color | Nebula Territory |
|---------|-------------|-----------------|
| odd-ai-reviewers | `#FF6B35` (ember orange) | Lower-right quadrant — warm fire region |
| ado-git-repo-insights | `#00B4D8` (azure blue) | Upper-left — cool data streams |
| repo-standards | `#7B2FBE` (deep violet) | Center-top — authoritative deep space |
| odd-self-hosted-ci | `#2DC653` (terminal green) | Left mid — circuit board green |
| odd-map | `#F7B731` (brass gold) | Right mid — warm cartographic amber |
| odd-fintech | `#E63946` (crimson red) | Lower-left — financial red alert |
| Coney Island / Chat | `#48CAE4` (ocean teal) | Top-right — coastal atmosphere |

The nebula shader samples the weighted blend of these colors based on angular distance from each star:

```glsl
vec3 nebulaColor = vec3(0.0);
float totalWeight = 0.0;
for (int i = 0; i < 7; i++) {
    float dist = acos(dot(normalize(vSpherePos), uStarPositions[i]));
    float weight = exp(-dist * dist * 2.5); // Gaussian falloff
    nebulaColor += uProjectColors[i] * weight;
    totalWeight += weight;
}
nebulaColor /= max(totalWeight, 0.001);
// Modulate by fBm nebula density
float density = warpedNebula(vSpherePos * 2.0, uTime);
nebulaColor *= density * 1.8;
```

### Blending Strategy

- **Additive blending** (`THREE.AdditiveBlending`) for glow layers — stars, wispy outer tendrils, rim halos
- **Alpha blending** (`THREE.NormalBlending`) for dense nebula body with opacity falloff at edges
- Star sprites: additive, no depth write

### Volumetric Look (Multi-Layer Parallax)

Three nebula planes at different "depths" inside the orb, each sampling the same fBm function but at different frequency/offset scales. Camera parallax shifts the UV of deeper layers less — creates convincing pseudo-volume:

```
Layer 3 (far): frequency * 0.7, parallax * 0.02, opacity 0.3
Layer 2 (mid): frequency * 1.0, parallax * 0.05, opacity 0.45
Layer 1 (near): frequency * 1.4, parallax * 0.08, opacity 0.6
```

### Nebula Animation

Time-based slow drift. Two components:
1. **Global drift**: `p += uTime * vec3(0.01, 0.005, 0.008)` — slow pan through noise space
2. **Turbulence pulse**: Low-frequency (0.1 Hz) amplitude modulation — nebula "breathes"

```glsl
float drift = fbm(vSpherePos * 1.5 + uTime * 0.012);
float breathe = 0.85 + 0.15 * sin(uTime * 0.3);
float nebulaIntensity = drift * breathe;
```

---

## 3. Star Node Rendering

### Glow Effect

**Sprite-based approach** using `THREE.Sprite` with a programmatically generated circular gradient texture (radial gradient: white center → project color mid → transparent edge). This is cheaper than per-fragment glow shader on many sprites.

For the 7 project stars: two concentric sprites per star:
- **Core sprite** (small, ~8px): bright white/project-color center
- **Halo sprite** (large, ~32px): project color, additive blend, low opacity

```glsl
// Glow sprite fragment shader
float dist = length(vUv - 0.5) * 2.0; // 0 at center, 1 at edge
float glow = exp(-dist * dist * 3.0); // Gaussian glow profile
gl_FragColor = vec4(uColor * glow, glow * uOpacity);
```

### Pulse Animation

Per-star time offset prevents all stars pulsing in sync (uncanny effect). Each star gets a random phase `uPhaseOffset`:

```glsl
float pulse = 0.7 + 0.3 * sin(uTime * 1.2 + uPhaseOffset);
float haloScale = mix(1.0, 1.35, pulse);
```

Amplitude: 30% size variation. Frequency: ~1.2 rad/s (~0.19 Hz) — slow, breathing feel.

### Color Accent System (HSL)

Store project colors as HSL. State variants:
- **Default**: H=accent, S=0.7, L=0.55
- **Hover**: S=0.9, L=0.75 (saturate + brighten)
- **Active/Focused**: S=1.0, L=0.85, + white corona
- **Dimmed (other stars when one focused)**: S=0.3, L=0.3

Pass as `uHSL` uniform and convert in shader to avoid CPU recalculation:

```glsl
vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x, s = hsl.y, l = hsl.z;
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c / 2.0;
    // ... full conversion
}
```

### Hover State

On hover (`raycaster` hit on star hitbox sphere, r=0.05):
1. Scale halo sprite to 2.5x over 200ms (GSAP)
2. Increase halo opacity from 0.3 to 0.7
3. Add a subtle lens flare: 2–3 small anamorphic streak sprites along the horizontal axis, project color, additive blend
4. Shift HSL to hover variant via uniform lerp

### Size Hierarchy

Stars can vary in base size to imply project "weight":
- Featured / most complex projects: base halo radius 1.4x
- Standard projects: base radius 1.0x
- Smaller/utility projects: base radius 0.75x

For this portfolio of 7 projects, suggested hierarchy:
- odd-ai-reviewers, odd-fintech: 1.4x (flagship)
- odd-map, ado-git-repo-insights: 1.15x (substantial)
- repo-standards, odd-self-hosted-ci, Coney Island: 1.0x (standard)

---

## 4. Supernova Burst Effect

### Particle Emission Design

On star click, emit a burst from the star's world position:

**Component 1 — Expanding Ring**
- Thin torus geometry, scale from 0 → 2.0 in 600ms, opacity 1 → 0
- Color: project accent, additive blend
- Implemented as a thin `THREE.TorusGeometry` animated via GSAP scale

**Component 2 — Radial Rays**
- 8–12 line segments (or elongated sprite quads) shooting outward
- Random angular spread ±15° around perfect radial
- Scale from 0 → random(0.3–0.8) in 300ms, then fade
- Color: project accent + white core

**Component 3 — Spark Particles**
- 20–30 small point sprites, physics: initial radial velocity + gravity (slight downward drift)
- Fade over 800ms
- Color: project accent, white, and one complementary hue

### Duration and Fade Curve

```
Total duration: 900ms
Ring:  0ms → 600ms (ease-out scale, ease-in opacity fade after 400ms)
Rays:  0ms → 300ms scale out, 200ms → 500ms fade
Sparks: 50ms → 900ms (staggered emission, ease-out velocity, linear fade)
```

Easing: `power2.out` for expansion, `power2.in` for fade — feels like a natural explosion dissipating.

### Performance: Particle Pool

**Pre-allocate a pool of 60 particles** (20 rings max 1 active, 40 spark sprites). On burst, activate subset from pool, reset their uniforms. No garbage collection during animation.

```javascript
class SupernovaPool {
    constructor() {
        this.rings = []; // 1 ring geometry, reused
        this.sparks = new THREE.InstancedMesh(sparkGeo, sparkMat, 40);
        this.activeCount = 0;
    }
    burst(position, color) {
        // Activate ring, set uniforms, trigger GSAP timeline
    }
}
```

---

## 5. Dust Motes & Ambient Particles

### "Living Crystal" Effect

~150–200 particles floating inside the orb give it an organic, inhabited feel — like dust suspended in a wizard's crystal.

### Implementation

`THREE.Points` geometry with a custom `ShaderMaterial`. Each point is a soft circular glow:

```glsl
// Dust mote fragment shader
void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.2, 0.5, d)) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
}
```

### Movement (Brownian Drift)

Update particle positions on CPU each frame (cheap for 200 particles). Each particle has a velocity vector that receives a small noise-based perturbation each frame:

```javascript
// Per-particle update (CPU)
const noise3D = createNoise3D();
particles.forEach((p, i) => {
    const n = noise3D(p.x * 0.5, p.y * 0.5, time * 0.1 + i * 0.37);
    p.velocity.addScaledVector(noiseGradient(p, time), 0.001);
    p.velocity.multiplyScalar(0.98); // drag
    p.position.add(p.velocity);
    // Clamp to sphere interior
    if (p.position.length() > 0.92) {
        p.position.normalize().multiplyScalar(0.92);
        p.velocity.reflect(p.position.clone().normalize());
    }
});
positions.needsUpdate = true;
```

### Density and Size

- Count: 180 particles (comfortably under GPU point sprite budget)
- Size range: 2–6px (screenspace), randomized per particle
- Opacity range: 0.08–0.25 (very subtle — supporting cast, not stars)
- Color: near-white with slight warm tint `rgb(220, 210, 200)` + faint project color tint near each star

### Performance Budget

- 180 points geometry: ~1 draw call, trivial vertex count
- CPU update: 180 * 3 floats * lerp = negligible
- No texture needed (procedural circle in fragment shader)

---

## 6. Post-Processing Considerations

### UnrealBloomPass

**Yes, include it.** Bloom is essential for the "glowing stars in dark space" feel and for the supernova burst impact. Configuration:

```javascript
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8,  // strength — keep modest to avoid washing out
    0.4,  // radius
    0.85  // threshold — only bright elements bloom
);
```

- Render star nodes and nebula glow layers to a separate bloom layer
- Use `THREE.Layers` to exclude UI and frame elements from bloom
- Keep strength ≤ 0.8 to avoid "vaseline smear" look

### Chromatic Aberration

Subtle only at orb edges (outside of Fresnel threshold ~0.7). Implemented as a post-process custom shader pass:

```glsl
// Chromatic aberration at orb edge
float orbEdge = smoothstep(0.6, 1.0, length(vUv - 0.5) * 2.0);
float aberration = 0.003 * orbEdge;
float r = texture2D(tDiffuse, uv + vec2(aberration, 0.0)).r;
float g = texture2D(tDiffuse, uv).g;
float b = texture2D(tDiffuse, uv - vec2(aberration, 0.0)).b;
gl_FragColor = vec4(r, g, b, 1.0);
```

Effect intensity: very low (0.003 UV offset max). Should be "noticed subconsciously, not consciously."

### Vignette

Darken orb edges to enhance spherical depth illusion. Applied as a post-process or as an overlay quad inside the orb render:

```glsl
float vignette = smoothstep(0.5, 1.0, length(vUv - 0.5) * 1.8);
gl_FragColor.rgb *= 1.0 - vignette * 0.6;
```

### EffectComposer: Is It Worth It for POC?

**Yes, with discipline.** The bloom alone justifies it — without bloom, the nebula looks flat and the stars look like colored dots. Keep the pass stack lean:

```
RenderPass → UnrealBloomPass → CustomPass (chroma + vignette combined) → OutputPass
```

4 passes total. Profile on first integration; if bloom tanks mobile, add a `lowPerf` flag that disables UnrealBloomPass and substitutes a cheap CSS `filter: blur()` overlay.

---

## 7. Color Palette

### 7 Project Accent Colors

Selected to be: visually distinct, high contrast on dark backgrounds (#0a0a12 base), evocative of each project's character, colorblind-safe (tested against deuteranopia simulation).

| # | Project | Hex | RGB | Feel |
|---|---------|-----|-----|------|
| 1 | odd-ai-reviewers | `#FF6B35` | 255, 107, 53 | Ember / combustion / review fire |
| 2 | ado-git-repo-insights | `#00B4D8` | 0, 180, 216 | Data stream cyan / azure |
| 3 | repo-standards | `#7B2FBE` | 123, 47, 190 | Authority violet / deep protocol |
| 4 | odd-self-hosted-ci | `#2DC653` | 45, 198, 83 | Terminal green / self-reliant |
| 5 | odd-map | `#F7B731` | 247, 183, 49 | Brass gold / cartographic warmth |
| 6 | odd-fintech | `#E63946` | 230, 57, 70 | Financial red / alert urgency |
| 7 | Coney Island / Chat | `#48CAE4` | 72, 202, 228 | Ocean teal / coastal / approachable |

**Colorblind safety notes:**
- Colors 1 (orange) and 6 (red) are adjacent on spectrum — rely on shape/position difference for distinguishing, not color alone.
- Colors 2 (cyan) and 7 (teal) are similar — use brightness offset: cyan is L=0.55, teal is L=0.45.
- Colors 3 (violet) and 4 (green) are maximally distinct for deuteranopes.

### Nebula Base Colors

The dark-space background inside the orb uses a palette of:
- Deep space base: `#050510` (near black, blue-black)
- Nebula dark region: `#0d0b2b` (deep indigo)
- Nebula mid region: `#1a0e3d` (violet-navy)
- Dust cloud base: `#0f1a2e` (dark cosmic blue)
- Hot core highlight: `#2d1b5e` (purple-indigo)

These base colors mix multiplicatively with the project accent territory colors.

### Scroll/Focus Color Shifts

- **Scroll down**: Nebula base palette shifts toward warmer tones (deep crimson undertones replace blue-black) — as if the orb reveals hotter, denser regions deeper in
- **Project focused**: All non-focused star territories dim (desaturate to 30% saturation), focused territory brightens to 110% lightness, nebula colors in that region saturate +20%
- **Reveal sequence**: Colors bloom from monochrome (grayscale) → full color over 1.2s

### SCSS/JS Color Variables

```javascript
const PALETTE = {
    background: '#050510',
    nebula: {
        base: '#0d0b2b',
        mid: '#1a0e3d',
        hot: '#2d1b5e'
    },
    projects: [
        { id: 'odd-ai-reviewers',    accent: '#FF6B35', h: 17,  s: 1.0, l: 0.60 },
        { id: 'ado-git-insights',    accent: '#00B4D8', h: 193, s: 1.0, l: 0.42 },
        { id: 'repo-standards',      accent: '#7B2FBE', h: 278, s: 0.60, l: 0.46 },
        { id: 'odd-self-hosted-ci',  accent: '#2DC653', h: 136, s: 0.63, l: 0.48 },
        { id: 'odd-map',             accent: '#F7B731', h: 42,  s: 0.92, l: 0.60 },
        { id: 'odd-fintech',         accent: '#E63946', h: 356, s: 0.76, l: 0.56 },
        { id: 'coney-island',        accent: '#48CAE4', h: 193, s: 0.73, l: 0.60 }
    ]
};
```

---

## 8. Texture Strategy

### What's Procedural (No Texture Files)

- Nebula color field: 100% procedural fBm noise in GLSL — no texture
- Star glow halos: radial gradient generated in fragment shader — no texture
- Dust motes: procedural circle in fragment shader — no texture
- Glass surface imperfections: procedural noise — no texture
- Supernova ring/rays: procedural geometry + animated uniforms — no texture

### What Might Need a Texture

**Pre-computed noise texture (optional optimization):**
If the fBm function proves too expensive on integrated GPUs (>0.5ms per frame), bake a 256x256 RGBA noise texture where R, G, B, A each store a different noise octave. This converts expensive procedural math to a simple texture lookup.

- Format: PNG or raw Float16 (via `THREE.DataTexture`)
- Resolution: 256x256 — 256KB uncompressed, negligible
- Only generate this if profiling shows shader ALU is bottleneck

**Project logo textures (if used):**
- Format: PNG with alpha, or WebP
- Resolution: 64x64 per logo (shown small in star label or focus overlay)
- 7 logos × 64×64 × 4 bytes = ~112KB total

**No other textures required.**

### Total Texture Memory Budget

| Asset | Size | Notes |
|-------|------|-------|
| Noise LUT (optional) | 256KB | Only if needed for perf |
| Project logos (7x) | ~112KB | 64px PNGs |
| CubeRenderTarget (128px) | ~384KB | For glass refraction |
| **Total** | **~750KB** | Well under 16MB budget |

Procedural-first approach keeps us at <1MB texture memory — leaves ample headroom.

---

## 9. Performance Budget

### Shader Complexity

**Fragment shader limits for 60fps on Intel Iris-class GPU:**
- Target: ≤ 120 ALU instructions per fragment for the main orb glass shader
- fBm with 6 octaves = ~80 ALU instructions — acceptable
- With domain warping: ~140 instructions — risky; reduce to 4 octaves if needed (still looks great)
- Use `mediump` precision in fragment shader where safe (color math, not position)

**Optimization levers (in order of aggressiveness):**
1. Reduce fBm octaves: 6 → 4 (barely visible quality drop at orb scale)
2. Replace domain-warped fBm with simple fBm + one warp pass
3. Replace procedural noise with noise texture lookup (fastest)
4. Reduce orb sphere geometry: 64x64 → 32x32 segments

### Draw Call Budget

| Scene Element | Draw Calls |
|--------------|-----------|
| Outer glass sphere | 1 |
| Inner nebula spheres (3 layers) | 3 |
| Star sprites (7 projects × 2 sprites) | 2 (instanced) |
| Star hitbox spheres (invisible) | 1 (instanced) |
| Dust motes | 1 (THREE.Points) |
| Supernova pool (when active) | 2–3 |
| Steampunk frame elements (CSS) | 0 (no WebGL) |
| **Total** | **~11–14** |

Far below the 50 draw call budget. Instancing on sprites is key — don't create 14 separate Mesh objects.

### Texture Memory

Per above: ~750KB active — well under 16MB limit.

### Render Resolution

- Clamp DPR to 1.5 maximum: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))`
- For EffectComposer bloom: render at 0.75x resolution (standard technique — bloom smooths over downscaling artifacts)
- Total render budget: ~1080p equivalent at DPR 1.5 on typical desktop

### 60fps Strategy

- **Frame budget**: 16.7ms total; target ~10ms for WebGL (leave headroom for JS/layout)
- **Shader hotspot**: orb glass shader. Profile with `EXT_disjoint_timer_query` if available
- **Tab visibility**: `document.addEventListener('visibilitychange')` → pause render loop when hidden
- **Reduced motion**: `prefers-reduced-motion: reduce` → disable fBm animation (static snapshot), disable supernova, disable dust motes motion

### Degradation Levels

```
Tier 1 (Full): All effects, 6-octave fBm, bloom, chromatic aberration
Tier 2 (Medium): 4-octave fBm, bloom only (no chromatic aberration)
Tier 3 (Low): Noise texture instead of fBm, no bloom (CSS filter fallback)
```

Auto-detect tier by running a 30-frame benchmark during the orb reveal sequence and dropping down if average frame time exceeds 20ms.

---

## Summary: Shader Architecture

```
Orb Scene Render Pipeline:
┌─────────────────────────────────────────────┐
│  WebGLRenderTarget (main scene)             │
│  ├── Shell 1 (inner): nebula sphere          │
│  │    ShaderMaterial: fBm domain-warp        │
│  │    + project color territory blend        │
│  ├── Shell 2-3: nebula depth layers          │
│  │    Parallax offset, additive blend        │
│  ├── Star sprites (InstancedMesh)            │
│  │    Pulse, HSL color, Gaussian glow        │
│  ├── Dust motes (THREE.Points)              │
│  │    Soft circle, Brownian motion           │
│  └── Outer glass shell:                      │
│       Fresnel rim, refraction offset,        │
│       noise imperfections, vignette          │
└─────────────────────────────────────────────┘
       ↓ EffectComposer
  UnrealBloomPass (strength 0.8)
       ↓
  CustomShaderPass (chroma aberration + vignette)
       ↓
  OutputPass → Canvas
```

This pipeline achieves the full Victorian Techno-Mage crystal ball aesthetic within the POC constraints: under 15 draw calls, under 1MB textures, targeting 60fps on integrated GPU.
