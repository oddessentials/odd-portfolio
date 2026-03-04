# WebGL/Three.js Engineer Brainstorm Notes
# Victorian Techno-Mage Portfolio — Crystal Ball Orb Scene

---

## 1. Scene Architecture

### Camera Setup

Use **PerspectiveCamera** — orthographic would kill the depth illusion inside the orb.

```js
const camera = new THREE.PerspectiveCamera(
  45,                              // FOV: narrow enough for dramatic depth, not fishy
  canvas.clientWidth / canvas.clientHeight,
  0.1,                             // near: close enough to not clip orb center
  100                              // far: scene is compact, 100 is generous
);
camera.position.set(0, 0, 4.5);   // Slightly outside the orb (radius ~1.5)
```

**FOV reasoning:** 45 degrees feels "instrument-like" — a telescope aperture rather than a wide-angle lens. Avoid anything above 60 or the glass sphere will feel like a fishbowl.

**Camera behavior by phase:**
- **Intro:** camera starts at z=8, GSAP eases it to z=4.5 (pull-in during reveal)
- **Scroll:** camera orbits slightly (subtle Y rotation of orb group, NOT actual camera move — keeps raycasting predictable)
- **Star focus:** camera z eases to ~3.0 + slight X/Y shift toward clicked star

### Renderer Config

```js
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('orb-canvas'),
  antialias: true,
  alpha: true,       // transparent background so CSS frame shows through
  powerPreference: 'high-performance'
});

// DPR clamp — critical for 4K screens
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.offsetWidth, container.offsetHeight);

// Tone mapping for the cosmic/glow aesthetic
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

**Why alpha:true?** The orb sits inside a CSS-styled steampunk frame. The renderer needs to composite onto the dark walnut/brass background without a WebGL background color blocking it.

**No shadow maps** — adds GPU cost for zero visible benefit inside a glowing orb.

### Scene Graph Hierarchy

```
Scene
├── AmbientLight (very dim, deep purple: 0x1a0a2e, intensity 0.3)
├── RimLight (PointLight, gold: 0xffaa44, pos: 3,3,3, intensity 2)
├── OrbGroup (THREE.Group — rotates as a unit)
│   ├── OuterSphere (glass shell — MeshPhysicalMaterial or ShaderMaterial)
│   ├── InnerGlowSphere (slightly smaller, additive blend, animated opacity)
│   ├── NebulaSystem (THREE.Points or sprite cloud)
│   │   ├── NebulaLayer_A (warm region — reds/oranges for AI/DevOps projects)
│   │   ├── NebulaLayer_B (cool region — blues/teals for data/fintech projects)
│   │   └── NebulaLayer_C (neutral ambient haze — whites/grays)
│   ├── StarGroup (THREE.Group)
│   │   └── StarMesh[0..6] (7 instanced or individual star nodes)
│   └── DustMoteSystem (optional: tiny slow-drifting particles)
└── PostProcessing (EffectComposer — bloom only)
```

**Why group the orb?** GSAP can rotate the entire `OrbGroup` on Y for scroll-driven parallax without needing to update every child's world position. Raycasting against children still works fine.

### Coordinate System for Star Positions

Stars live inside a sphere of radius ~0.85 (inside the glass shell at ~1.0). Distribute them in 3D — NOT on the surface, at varying depths to reinforce the depth illusion.

Map concept: think of the orb as a hollow snow globe. Stars sit at different Z depths, giving a genuine volumetric feel when the orb slowly rotates.

```js
// Star positions — hand-tuned to feel natural (not grid-like)
// In orb-local space, radius bounds: 0.3 to 0.85
const STAR_POSITIONS = [
  new THREE.Vector3( 0.42,  0.55, -0.20),  // upper left, mid depth
  new THREE.Vector3(-0.50,  0.20,  0.35),  // left, near
  new THREE.Vector3( 0.60, -0.15,  0.10),  // right, mid
  new THREE.Vector3(-0.20, -0.50, -0.40),  // lower left, far
  new THREE.Vector3( 0.10,  0.35,  0.60),  // center-upper, very near
  new THREE.Vector3(-0.55, -0.20, -0.15),  // left-lower, mid
  new THREE.Vector3( 0.30, -0.45,  0.30),  // lower right, near-mid
];
```

---

## 2. Crystal Ball Implementation

### Geometry Choice

**Use `IcosahedronGeometry` with detail level 6** for the outer glass sphere.

```js
const orbGeo = new THREE.IcosahedronGeometry(1.0, 6);
// ~5120 triangles — smooth enough, not excessive
```

**Why Icosahedron over Sphere?** `SphereGeometry` has polar pinching which shows up under lighting. Icosahedron subdivisions distribute vertices evenly, giving smoother specular highlights — critical for convincing glass.

**Geometry sizes:**
- Outer glass shell: radius 1.0
- Inner glow sphere: radius 0.96
- Nebula point cloud: contained within radius 0.88
- Stars: point radius 0.3–0.85 from center

### Glass Material Approach

**Primary recommendation: `MeshPhysicalMaterial`** for the POC. It handles transmission, roughness, and IOR natively without custom GLSL. Custom `ShaderMaterial` is more powerful but costs dev time in a POC context.

```js
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.05,        // near-perfect glass
  transmission: 0.92,     // high transmission = see-through
  thickness: 0.8,         // affects how much it bends light
  ior: 1.5,              // glass IOR
  transparent: true,
  opacity: 0.15,          // subtle surface opacity on top of transmission
  envMapIntensity: 1.5,
  side: THREE.FrontSide,  // render front only; back faces handled by inner spheres
});
```

**Caveat:** `transmission` requires `renderer.localClippingEnabled` to be false and adds render cost. If perf is an issue, fall back to:

```js
// Fallback glass — no transmission, just visual tricks
const glassLiteMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x88aacc,
  metalness: 0.1,
  roughness: 0.08,
  transparent: true,
  opacity: 0.18,
  side: THREE.DoubleSide,
  envMapIntensity: 2.0,
});
```

### Rim Light / Fresnel Effect

The Fresnel rim is the single most important visual element for selling the glass look. Two approaches:

**Option A — Built-in with MeshPhysicalMaterial:**
Add a subtle emissive rim via a second transparent sphere slightly larger than the outer shell:

```js
const rimMesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.04, 6),
  new THREE.MeshBasicMaterial({
    color: 0xffcc66,       // warm brass-gold
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,  // renders inside-out, creating a halo
  })
);
orbGroup.add(rimMesh);
```

**Option B — Custom Fresnel in ShaderMaterial (recommended for quality):**

```glsl
// vertex shader snippet
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-worldPos.xyz);
  gl_Position = projectionMatrix * worldPos;
}

// fragment shader snippet
varying vec3 vNormal;
varying vec3 vViewDir;

uniform vec3 rimColor;
uniform float rimPower;

void main() {
  float fresnel = pow(1.0 - dot(vNormal, vViewDir), rimPower);
  vec3 rim = rimColor * fresnel;
  gl_FragColor = vec4(rim, fresnel * 0.8);
}
```

```js
const fresnelMat = new THREE.ShaderMaterial({
  uniforms: {
    rimColor: { value: new THREE.Color(0xffcc66) },
    rimPower: { value: 3.5 },
  },
  vertexShader: fresnelVert,
  fragmentShader: fresnelFrag,
  transparent: true,
  side: THREE.FrontSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
```

**For the POC: use Option A for speed, upgrade to Option B if time allows.**

### Internal Depth Illusion

Key techniques (layered):

1. **InnerGlowSphere** — slightly smaller sphere with `MeshBasicMaterial`, emissive deep purple/teal, `side: BackSide`. This creates the sense of a glowing interior void.

2. **Depth-sorted nebula layers** — point clouds at different Z depths. As the orb rotates, near stars pass in front of far stars, selling parallax depth.

3. **Fake environment map** — bake a simple equirectangular gradient texture (purple-to-black) and apply as `envMap` on the glass material. This gives reflections that look like cosmic ambiance.

4. **No actual refraction in POC** — true transmission refraction is expensive. The `transmission` parameter on `MeshPhysicalMaterial` is a good enough approximation.

```js
// Inner glow sphere
const innerGlow = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.97, 5),
  new THREE.MeshBasicMaterial({
    color: 0x1a0a3a,     // deep violet interior
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.85,
  })
);
orbGroup.add(innerGlow);
```

---

## 3. Star Node System

### Geometry: Billboard Sprites vs Points vs Instanced Mesh

**Recommendation: Individual `THREE.Sprite` objects per star, with a custom canvas-drawn texture.**

Why not `THREE.Points`? Points can't be individually raycasted easily — you'd need a threshold calculation. Individual Sprite objects give per-star raycasting for free with the built-in `Raycaster`.

Why not instanced mesh? Adds complexity for 7 objects. Overkill.

```js
// Star texture: canvas-drawn soft glow disc
function createStarTexture(color, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, color);               // bright core
  gradient.addColorStop(0.3, color + 'aa');      // mid glow
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, center, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

// One sprite per project
function createStarNode(project, position) {
  const map = createStarTexture(project.color);
  const mat = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.copy(position);
  sprite.scale.set(0.12, 0.12, 1);   // base size
  sprite.userData = { project, baseScale: 0.12 };
  return sprite;
}
```

### Project Data Mapping

```js
const PROJECTS = [
  {
    id: 'odd-ai-reviewers',
    name: 'odd-ai-reviewers',
    tagline: 'Extensible AI code review pipeline with multi-agent analysis',
    category: 'ai-devops',
    color: '#ff6b35',    // warm orange — AI/agent theme
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-ai-reviewers' },
      { label: 'npm', url: 'https://www.npmjs.com/package/@oddessentials/odd-ai-reviewers' },
      { label: 'Demo', url: 'https://youtu.be/rkDQ7ZA47XQ' }
    ]
  },
  {
    id: 'ado-git-repo-insights',
    name: 'ADO Git Repo Insights',
    tagline: 'Azure DevOps PR metrics to SQLite + PowerBI-ready CSVs',
    category: 'data-devops',
    color: '#4fc3f7',    // blue — data/analytics theme
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/ado-git-repo-insights' },
      { label: 'Marketplace', url: 'https://marketplace.visualstudio.com/items?itemName=OddEssentials.ado-git-repo-insights' }
    ]
  },
  {
    id: 'repo-standards',
    name: 'repo-standards',
    tagline: 'Single authoritative JSON spec for multi-stack repo quality',
    category: 'tooling',
    color: '#b39ddb',    // purple — standards/spec theme
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/repo-standards' },
      { label: 'npm', url: 'https://www.npmjs.com/package/@oddessentials/repo-standards' }
    ]
  },
  {
    id: 'odd-self-hosted-ci',
    name: 'OSCR — Self-Hosted CI',
    tagline: 'Docker-first CI runtime on your own hardware at zero cloud cost',
    category: 'infrastructure',
    color: '#ef9a9a',    // red — infrastructure/ops theme
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-self-hosted-ci-runtime' },
      { label: 'DockerHub', url: 'https://hub.docker.com/r/oddessentials/oscr-github' }
    ]
  },
  {
    id: 'odd-map',
    name: 'odd-map',
    tagline: 'White-label interactive office locator, fully static, multi-theme',
    category: 'frontend',
    color: '#80cbc4',    // teal — frontend/geo theme
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-map' },
      { label: 'Demo', url: 'https://maps.oddessentials.com/' }
    ]
  },
  {
    id: 'odd-fintech',
    name: 'odd-fintech',
    tagline: 'Financial intelligence dashboard: markets, metals, congressional trades',
    category: 'fintech',
    color: '#ffd54f',    // gold — finance theme
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-fintech' }
    ]
  },
  {
    id: 'coney-island',
    name: 'Coney Island Pottsville',
    tagline: 'Local restaurant web presence with integrated chat',
    category: 'web',
    color: '#a5d6a7',    // green — local/community theme
    links: [
      { label: 'Website', url: 'https://coneyislandpottsville.com/' },
      { label: 'Chat', url: 'https://chat.coneyislandpottsville.com/' }
    ]
  }
];
```

### Star Positions — Natural Distribution

The 7 positions above (in the coordinate section) are intentionally non-symmetric:
- Vary depth (Z) across -0.4 to +0.6 to maximize parallax spread
- No two stars share the same XY quadrant + Z depth bracket
- Group by category affinity: AI/DevOps stars in upper-warm region, Data stars in mid-cool, Frontend/Web in lower-near region

### LOD for Hover/Focus States

No LOD geometry swap needed (7 sprites are trivial). Instead, use **material state transitions**:

```js
// Hover state
function onStarHover(star) {
  // GSAP animates scale and opacity
  gsap.to(star.scale, { x: 0.22, y: 0.22, duration: 0.3, ease: 'power2.out' });
  gsap.to(star.material, { opacity: 1.0, duration: 0.2 });
  // Add/show halo ring (pre-created, initially opacity 0)
  gsap.to(star.userData.halo.material, { opacity: 0.6, duration: 0.3 });
}

// Active/focused state (after click)
function onStarFocus(star) {
  gsap.to(star.scale, { x: 0.30, y: 0.30, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
}
```

Each star gets a companion **halo Sprite** (larger, ring texture, initially invisible) added to StarGroup at creation time. The halo auto-orients since it's a sprite.

---

## 4. Nebula & Particle System

### Approach: Layered Point Clouds

**Three layers of `THREE.Points`** — performance-friendly, easy to color-shift:

| Layer | Count | Purpose | Blend |
|-------|-------|---------|-------|
| Core nebula | 800 pts | Dense colorful gas cloud center | AdditiveBlending |
| Mid cloud | 400 pts | Dispersed wispy tendrils | AdditiveBlending |
| Ambient haze | 300 pts | Fine background stars/dust | NormalBlending |

Total: ~1500 particles. Well within mobile GPU budgets (10k–50k is typical limit before throttle).

```js
function createNebulaLayer(count, radiusMax, colorA, colorB) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorObjA = new THREE.Color(colorA);
  const colorObjB = new THREE.Color(colorB);

  for (let i = 0; i < count; i++) {
    // Random point inside sphere (rejection sampling)
    let x, y, z, len;
    do {
      x = (Math.random() - 0.5) * 2 * radiusMax;
      y = (Math.random() - 0.5) * 2 * radiusMax;
      z = (Math.random() - 0.5) * 2 * radiusMax;
      len = Math.sqrt(x*x + y*y + z*z);
    } while (len > radiusMax);

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Lerp color based on normalized position
    const t = len / radiusMax;
    const col = colorObjA.clone().lerp(colorObjB, t);
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.015,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

// Three region layers
const nebulaCoreLayer  = createNebulaLayer(800, 0.75, '#ff4400', '#aa00ff'); // fire to violet
const nebulaMidLayer   = createNebulaLayer(400, 0.85, '#0044ff', '#00ffcc'); // blue to teal
const nebulaHazeLayer  = createNebulaLayer(300, 0.88, '#ffffff', '#8888cc'); // white to lavender
```

### Category Color Regions

Soft spatial mapping (not hard zones, just tendencies):

| Category | Region | Colors |
|----------|--------|--------|
| ai-devops | Upper-left cluster | Orange (#ff6b35) → Amber |
| data-devops | Right-center | Blue (#4fc3f7) → Cyan |
| tooling | Upper-right | Purple (#b39ddb) → Violet |
| infrastructure | Lower-left | Red (#ef9a9a) → Coral |
| frontend | Center-lower | Teal (#80cbc4) → Mint |
| fintech | Upper-center | Gold (#ffd54f) → Yellow |
| web | Lower-right | Green (#a5d6a7) → Lime |

This is atmospheric — the nebula colors bleed together. Project stars sit in their region's color zone, appearing to "emerge from" that nebula color.

### Slow Drift Animation

```js
// In the render loop, drift nebula layers slowly
function animateNebula(time) {
  nebulaCoreLayer.rotation.y  = Math.sin(time * 0.00008) * 0.15;
  nebulaCoreLayer.rotation.x  = Math.cos(time * 0.00006) * 0.08;
  nebulaMidLayer.rotation.y   = Math.sin(time * 0.00005) * 0.20;
  nebulaHazeLayer.rotation.z  = Math.sin(time * 0.00003) * 0.10;
}
```

---

## 5. Interaction System

### Raycasting Setup

```js
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredStar = null;
let focusedStar = null;

// Capture canvas-relative mouse position
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  handleStarClick();
});

// In render loop
function checkRaycast() {
  raycaster.setFromCamera(mouse, camera);
  const starMeshes = starNodes.map(n => n.sprite);  // just the 7 sprites
  const hits = raycaster.intersectObjects(starMeshes);

  if (hits.length > 0) {
    const hit = hits[0].object;
    if (hit !== hoveredStar) {
      if (hoveredStar) exitHoverState(hoveredStar);
      hoveredStar = hit;
      enterHoverState(hit);
      canvas.style.cursor = 'pointer';
    }
  } else {
    if (hoveredStar) exitHoverState(hoveredStar);
    hoveredStar = null;
    canvas.style.cursor = 'default';
  }
}
```

**Important:** Sprites in Three.js are automatically sized in screen space and are raycastable by default. The raycaster hits the sprite's bounding box. Set a generous `sprite.scale` for an easy click target (don't make stars sub-pixel).

### Hover Feedback — 3D Scene Changes

When a star is hovered:
1. **Scale pulse** — star sprite scales up 1.6x over 0.3s (GSAP)
2. **Halo ring** — companion sprite (ring texture) fades in at 0.6 opacity
3. **Orb tilt** — subtle `OrbGroup` rotation toward hovered star (max 8 degrees, GSAP)
4. **Shimmer** — a brief opacity flicker on the glass shell (animate `glassMaterial.opacity` 0.15 → 0.22 → 0.15 in 0.5s)
5. **CSS label** — HTML overlay label for the star name fades in (CSS class toggle, positioned via `project3DtoScreen()`)

```js
// Convert 3D star position to screen coordinates for label
function project3DtoScreen(position3D) {
  const pos = position3D.clone();
  pos.applyMatrix4(orbGroup.matrixWorld);  // account for orb group rotation
  pos.project(camera);
  return {
    x: (pos.x + 1) / 2 * canvas.clientWidth,
    y: (-pos.y + 1) / 2 * canvas.clientHeight,
  };
}
```

### Click Handling — Supernova Burst + Focus

```js
function handleStarClick() {
  if (!hoveredStar) return;
  const star = hoveredStar;
  const project = star.userData.project;

  // 1. Supernova burst: spawn ephemeral ring particles at star position
  triggerSupernovaBurst(star.position.clone().applyMatrix4(orbGroup.matrixWorld));

  // 2. GSAP: pulse the star scale out then settle
  gsap.timeline()
    .to(star.scale, { x: 0.5, y: 0.5, duration: 0.15, ease: 'power4.out' })
    .to(star.scale, { x: 0.25, y: 0.25, duration: 0.4, ease: 'elastic.out(1, 0.4)' });

  // 3. Camera ease in toward star
  const screenPos = project3DtoScreen(star.position);
  gsap.to(camera.position, {
    z: 3.2,
    duration: 0.8,
    ease: 'power2.inOut'
  });

  // 4. Show HTML project overlay
  showProjectPanel(project);
  focusedStar = star;
}
```

### Supernova Burst Effect

A quick particle ring expansion — spawn ~20 tiny sprites at the star's world position, animate them outward radially, fade out, then remove:

```js
function triggerSupernovaBurst(worldPos) {
  const burstGroup = new THREE.Group();
  burstGroup.position.copy(worldPos);
  scene.add(burstGroup);

  const count = 20;
  const mats = [];
  const tl = gsap.timeline({ onComplete: () => scene.remove(burstGroup) });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const mat = new THREE.SpriteMaterial({
      map: burstParticleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    mats.push(mat);
    const s = new THREE.Sprite(mat);
    s.scale.set(0.04, 0.04, 1);
    burstGroup.add(s);

    const radius = 0.4;
    tl.to(s.position, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      duration: 0.6,
      ease: 'power2.out'
    }, 0);
    tl.to(mat, { opacity: 0, duration: 0.4 }, 0.2);
  }
}
```

### Integration with HTML Overlay

The project detail panel is pure HTML/CSS, absolutely positioned over the canvas. The 3D layer and HTML layer communicate via:

```js
// Event bus (simple global object)
const OrbEvents = {
  onStarHover: null,    // (project) => void — triggers CSS label show
  onStarExit:  null,    // () => void — hides label
  onStarClick: null,    // (project) => void — triggers panel open
  onPanelClose: null,   // () => void — resets camera, dims focus
};
```

No framework needed — just direct function calls. The HTML layer has a `<div id="project-panel">` that the click handler populates and shows.

---

## 6. Performance Guardrails

### DPR Clamping

```js
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Also re-clamp on resize
window.addEventListener('resize', () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
});
```

### Tab Visibility — Pause Render Loop

```js
let isTabVisible = true;
let animFrameId = null;

document.addEventListener('visibilitychange', () => {
  isTabVisible = !document.hidden;
  if (isTabVisible && !animFrameId) {
    animFrameId = requestAnimationFrame(renderLoop);
  }
});

function renderLoop(time) {
  if (!isTabVisible) {
    animFrameId = null;
    return;  // stop the loop while hidden
  }
  animFrameId = requestAnimationFrame(renderLoop);
  update(time);
  renderer.render(scene, camera);
}
```

### RequestAnimationFrame Management

- Single RAF loop at the top level — never nest multiple `requestAnimationFrame` calls
- Pass `time` from RAF directly to GSAP ticker (GSAP manages its own timing internally, no need to manually tick it in the RAF)
- Three.js clock not needed since RAF provides time natively

### Dispose Strategy

For this POC, dispose is needed on navigation away (single page) or when destroying the canvas:

```js
function disposeScene() {
  // Cancel animation loop
  cancelAnimationFrame(animFrameId);

  // Traverse scene and dispose all geometries and materials
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });

  renderer.dispose();
  renderer.forceContextLoss();
}
```

### Fallback for WebGL1-Only Browsers

```js
function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    // Show static fallback image
    document.getElementById('orb-container').innerHTML = `
      <div class="orb-fallback">
        <img src="assets/orb-fallback.png" alt="Project constellation map" />
      </div>`;
    return false;
  }
  return true;
}
```

**WebGL1 compatibility notes:**
- `MeshPhysicalMaterial` with `transmission` requires WebGL2. Fallback to `MeshPhongMaterial` with high shininess.
- `THREE.Points` works in WebGL1.
- EffectComposer/bloom requires WebGL2 float textures — skip bloom in WebGL1 fallback.

### `prefers-reduced-motion` Handling

```js
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducedMotion) {
  // Skip intro animation, go directly to final state
  // Disable nebula drift
  // Disable orb auto-rotation
  // Keep hover/click interactions but no burst effect
}
```

---

## 7. GSAP Integration Points

### Three.js Properties Animated by GSAP

GSAP can animate any numeric property on Three.js objects directly:

```js
// Camera zoom
gsap.to(camera.position, { z: 3.2, duration: 1.2, ease: 'power2.inOut' });

// Orb group rotation (scroll-driven)
gsap.to(orbGroup.rotation, { y: Math.PI * 0.5, duration: 2, ease: 'none' });

// Glass opacity shimmer
gsap.to(glassMaterial, { opacity: 0.22, duration: 0.2, yoyo: true, repeat: 1 });

// Star scale on hover
gsap.to(star.scale, { x: 0.22, y: 0.22, duration: 0.3, ease: 'power2.out' });

// Material color tween (requires updating uniforms or using MeshStandardMaterial)
gsap.to(nebulaCoreLayer.material.color, {
  r: 0.8, g: 0.2, b: 1.0,
  duration: 2,
  ease: 'power1.inOut'
});
```

**Note:** GSAP does NOT call `needsUpdate` for you. For uniforms or attributes, set `material.needsUpdate = true` in the onUpdate callback if needed. For most standard material properties (color, opacity, emissiveIntensity), Three.js picks them up automatically each frame.

### ScrollTrigger Data Flow

```js
// ScrollTrigger drives OrbGroup rotation + camera depth
ScrollTrigger.create({
  trigger: '#scroll-container',
  start: 'top top',
  end: 'bottom bottom',
  scrub: 1.5,   // lag for cinematic feel
  onUpdate: (self) => {
    const progress = self.progress;  // 0.0 to 1.0

    // Slowly rotate orb on Y axis as user scrolls
    orbGroup.rotation.y = progress * Math.PI * 1.2;

    // Subtle camera Z push (slight zoom in on scroll)
    camera.position.z = 4.5 - progress * 0.8;  // 4.5 → 3.7

    // Nebula haze drift speed boost at mid-scroll
    nebulaHazeLayer.material.opacity = 0.5 + progress * 0.4;
  }
});
```

**Important:** ScrollTrigger's `onUpdate` runs outside the RAF loop. Three.js will pick up the mutated values on the NEXT frame. This is fine — the render loop sees the latest values when it runs. No manual sync needed.

**Alternative: GSAP-controlled scroll timeline:**

```js
const scrollTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroll-container',
    scrub: 2,
    start: 'top top',
    end: '+=2000',
  }
});

scrollTl
  .to(orbGroup.rotation, { y: Math.PI, duration: 1 }, 0)
  .to(camera.position,   { z: 3.7, duration: 1 }, 0)
  .to(rimLight,          { intensity: 4, duration: 0.5 }, 0.3)
  .to(glassMaterial,     { opacity: 0.2, duration: 0.5 }, 0.5);
```

### Animation Handoff Protocol: GSAP Timeline vs Render Loop

The render loop handles:
- Nebula drift (small rotation deltas per frame via `time` argument)
- Raycasting (runs every frame)
- Dust mote drift (if implemented)
- Any physics-like continuous movement

GSAP handles:
- All user interaction responses (hover, click, focus)
- Intro/reveal sequence
- Scroll-driven progression
- Any transition with an easing curve

**The handoff rule:** GSAP "writes" to Three.js object properties. The render loop "reads" them. Never have the render loop fight GSAP by also setting the same property (e.g., don't manually rotate `orbGroup.rotation.y` in the loop while ScrollTrigger is also animating it — use `orbGroup.rotation.x` and `orbGroup.rotation.z` for the ambient drift, reserve Y for GSAP scroll).

### Reveal Sequence ("Ignite the Universe")

```js
function playRevealSequence() {
  const tl = gsap.timeline({ delay: 0.5 });

  // Phase 1: Orb materializes (0-1.5s)
  tl.fromTo(glassMaterial, { opacity: 0 }, { opacity: 0.15, duration: 1.0 }, 0)
    .fromTo(innerGlow.material, { opacity: 0 }, { opacity: 0.85, duration: 1.2 }, 0.2)
    .fromTo(camera.position,   { z: 8 }, { z: 4.5, duration: 1.5, ease: 'power3.out' }, 0);

  // Phase 2: Nebula blooms (1.0-2.5s)
  tl.fromTo(nebulaCoreLayer.material, { opacity: 0 }, { opacity: 0.7, duration: 1.0 }, 1.0)
    .fromTo(nebulaMidLayer.material,  { opacity: 0 }, { opacity: 0.6, duration: 1.2 }, 1.2)
    .fromTo(nebulaHazeLayer.material, { opacity: 0 }, { opacity: 0.5, duration: 1.5 }, 1.4);

  // Phase 3: Stars appear one by one (2.0-3.5s)
  starNodes.forEach((node, i) => {
    tl.fromTo(node.sprite.material, { opacity: 0 }, {
      opacity: 0.85,
      duration: 0.4,
      ease: 'power2.out'
    }, 2.0 + i * 0.2);
    tl.fromTo(node.sprite.scale,    { x: 0, y: 0 }, {
      x: 0.12, y: 0.12,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)'
    }, 2.0 + i * 0.2);
  });

  // Phase 4: Console text types in (3.0s+)
  tl.call(() => {
    document.querySelector('.hud-status').textContent = '> universe revealed';
  }, [], 3.0);
}
```

---

## 8. Single-File POC Architecture Notes

Since this is a single HTML file, organize Three.js setup into clearly separated sections:

```
<script>
  // === CONFIG ===
  const PROJECTS = [...];
  const STAR_POSITIONS = [...];
  const CONFIG = { dpr: 2, fov: 45, ... };

  // === SCENE SETUP ===
  function initScene() { ... }
  function initCamera() { ... }
  function initRenderer() { ... }
  function initLights() { ... }

  // === ORB CONSTRUCTION ===
  function buildOrb() { ... }
  function buildNebula() { ... }
  function buildStars() { ... }

  // === INTERACTION ===
  function setupRaycasting() { ... }
  function enterHoverState(star) { ... }
  function exitHoverState(star) { ... }
  function handleStarClick() { ... }
  function triggerSupernovaBurst(pos) { ... }

  // === ANIMATIONS ===
  function playRevealSequence() { ... }
  function setupScrollTrigger() { ... }

  // === RENDER LOOP ===
  function renderLoop(time) { ... }

  // === INIT ===
  document.addEventListener('DOMContentLoaded', () => {
    if (!checkWebGLSupport()) return;
    initScene();
    initCamera();
    initRenderer();
    initLights();
    buildOrb();
    buildNebula();
    buildStars();
    setupRaycasting();
    setupScrollTrigger();
    requestAnimationFrame(renderLoop);
    playRevealSequence();
  });
</script>
```

**CDN imports (no build system):**

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.162.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.162.0/examples/jsm/"
  }
}
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script type="module">
  import * as THREE from 'three';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
  // ... rest of code
</script>
```

**Bloom pass config:**
```js
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,   // strength — keep subtle or stars turn into blobs
  0.4,   // radius
  0.85   // threshold — only brightest pixels bloom
);
```

---

## 9. Key Risk Items for Devil's Advocate

1. **MeshPhysicalMaterial + transmission** is expensive on integrated GPUs. Fallback path needed.
2. **Sprite raycasting** can have a generous hit box — stars near each other may be hard to distinguish. Mitigate by ensuring minimum 0.18 screen-space separation between any two stars.
3. **ScrollTrigger + Three.js** need the scroll container to have explicit height. The orb section must be tall enough (e.g., `min-height: 300vh`) for scroll scrubbing to feel good.
4. **EffectComposer bloom** doubles render cost (two passes). Disable on mobile user agents or when `devicePixelRatio < 1`.
5. **Single-file `<script type="module">` + importmap** may not work in some older browsers. Add a `<noscript>` or feature-detection note.

---

## Summary: Implementation Priority Order

For the POC, implement in this order (most-to-least impact per time cost):

1. **Renderer + Camera + OrbGroup** — get the canvas running
2. **Glass orb geometry + basic MeshPhysicalMaterial** — the visual anchor
3. **Nebula point clouds** — sells the "cosmic interior" immediately
4. **7 star sprites with raycasting** — enables interaction demo
5. **Fresnel rim halo sphere** — polish the glass look
6. **Hover/click interactions + HTML overlay** — complete the UX
7. **Reveal sequence GSAP timeline** — the wow moment
8. **ScrollTrigger integration** — scroll-driven feel
9. **Bloom post-processing** — optional final polish
10. **Performance guards + dispose** — cleanup pass
