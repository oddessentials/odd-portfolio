// js/scene.js — Three.js full-bleed starfield scene
import * as THREE from 'three';
import { PROJECTS, CONSTELLATION_ZONES } from './data.js';

// ---------------------------------------------------------------------------
// Module-level references (exported at bottom)
// ---------------------------------------------------------------------------
let scene, camera, renderer, orbGroup, starNodes, nebulaLayers;
let starGroup, dustMotes, nebulaGroup;
const raycaster = new THREE.Raycaster();
raycaster.params.Sprite = { threshold: 0.15 };
const mouse = new THREE.Vector2(-9999, -9999);
let hoveredStar = null;
let labelContainer = null;
let isMobile = false;
let xScale = 1.0;
let yScale = 1.0;
const designAspect = 16 / 9;

// Logo follow references
let logoEl = null;
let logoQuickToX = null;
let logoQuickToY = null;
let logoQuickToRot = null;
let logoFollowing = false;
let logoReturning = false;
let logoPrevX = 0;
let logoPrevY = 0;

// Reduced-motion query (dynamic — responds to runtime changes)
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotionQuery.matches;

// ---------------------------------------------------------------------------
// WebGL Support Detection
// ---------------------------------------------------------------------------
function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
    return !!gl;
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Canvas-drawn star texture
// ---------------------------------------------------------------------------
function createStarTexture(hexColor, size) {
  size = size || 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, hexColor);
  gradient.addColorStop(0.25, hexColor);
  gradient.addColorStop(0.5, hexColor + '88');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Dust mote procedural circle texture
// ---------------------------------------------------------------------------
function createDustTexture(size) {
  size = size || 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(0.5, 'rgba(200,200,220,0.2)');
  gradient.addColorStop(1, 'rgba(200,200,220,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Random point in rectangular volume (replaces spherical sampling)
// ---------------------------------------------------------------------------
function randomVolumePoint(xRange, yRange, zRange) {
  const x = (Math.random() * 2 - 1) * xRange;
  const y = (Math.random() * 2 - 1) * yRange;
  const z = zRange[0] + Math.random() * (zRange[1] - zRange[0]);
  return [x, y, z];
}

// ---------------------------------------------------------------------------
// Project 3D to screen coordinates
// ---------------------------------------------------------------------------
function project3DtoScreen(position3D, cam, domElement) {
  const vec = position3D.clone();
  vec.project(cam);
  const halfW = domElement.clientWidth / 2;
  const halfH = domElement.clientHeight / 2;
  return {
    x: vec.x * halfW + halfW,
    y: -(vec.y * halfH) + halfH
  };
}

// ---------------------------------------------------------------------------
// Star label management
// ---------------------------------------------------------------------------
// Stars with x < -1.5 get left-anchored labels (label appears to right of star)
const LEFT_ANCHOR_STARS = ['odd-fintech', 'ado-git-repo-insights'];

function showStarLabel(starSprite) {
  if (!labelContainer) return;
  const project = starSprite.userData.project;
  let label = labelContainer.querySelector(`[data-star-label="${project.id}"]`);
  if (!label) {
    label = document.createElement('div');
    label.className = 'star-label';
    label.setAttribute('data-star-label', project.id);
    label.textContent = project.name;
    // Static anchor override for edge-positioned stars (US3)
    if (LEFT_ANCHOR_STARS.includes(project.id)) {
      label.style.transform = 'translateX(0)';
    }
    labelContainer.appendChild(label);
  }
  const worldPos = new THREE.Vector3();
  starSprite.getWorldPosition(worldPos);
  const screen = project3DtoScreen(worldPos, camera, renderer.domElement);
  label.style.left = screen.x + 'px';
  label.style.top = (screen.y - 30) + 'px';
  label.style.opacity = '1';
  label.style.pointerEvents = 'none';
}

function hideStarLabel(starSprite) {
  if (!labelContainer) return;
  const project = starSprite.userData.project;
  const label = labelContainer.querySelector(`[data-star-label="${project.id}"]`);
  if (label) {
    label.style.opacity = '0';
  }
}

// ---------------------------------------------------------------------------
// Logo follow-cursor setup (T009, T010)
// ---------------------------------------------------------------------------
function logoReturnHome(gsap) {
  if (!logoFollowing) return;           // Guard: prevent double-fire
  logoFollowing = false;
  logoReturning = true;                 // Block mousemove re-engagement during return
  const headerBand = document.querySelector('.frame__header-band');
  if (headerBand) {
    const homeRect = headerBand.getBoundingClientRect();
    gsap.to(logoEl, {
      left: homeRect.left + homeRect.width / 2 - 20,
      top: homeRect.top + homeRect.height / 2 - 20,
      rotation: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        logoReturning = false;          // Return complete — allow re-engagement
        logoEl.classList.remove('logo--following');
        logoEl.style.left = '';
        logoEl.style.top = '';
        gsap.set(logoEl, { clearProps: 'transform' });
      }
    });
  } else {
    logoReturning = false;
    logoEl.classList.remove('logo--following');
    logoEl.style.left = '';
    logoEl.style.top = '';
    gsap.set(logoEl, { clearProps: 'transform' });
  }
}

function initLogoFollow() {
  const gsap = window.gsap;
  if (!gsap) return;

  logoEl = document.getElementById('brand-logo');
  if (!logoEl) return;

  const hitzone = document.getElementById('orb-hitzone');
  if (!hitzone) return;

  // Logo's upper-right corner tracks the pointer (rocket-ship effect).
  // 40px logo: left = pointerX - 40, top = pointerY
  const logoW = 40;
  // Neutral angle: logo body extends down-left from the nose (upper-right).
  // That direction is 225° from positive-x, so the nose points at -45° (upper-right).
  // Rotation = movementAngle - neutralAngle.
  const neutralDeg = -45;
  const RAD2DEG = 180 / Math.PI;
  // Minimum movement distance to update rotation (avoids jitter from tiny deltas)
  const minDelta = 2;

  // Shared rotation helper — computes angle from movement delta
  function updateRotation(cx, cy) {
    const dx = cx - logoPrevX;
    const dy = cy - logoPrevY;
    logoPrevX = cx;
    logoPrevY = cy;
    if (dx * dx + dy * dy < minDelta * minDelta) return;
    const deg = Math.atan2(dy, dx) * RAD2DEG - neutralDeg;
    if (logoQuickToRot) {
      logoQuickToRot(deg);
    } else {
      gsap.set(logoEl, { rotation: deg });
    }
  }

  // Shared engage helper — used by mouseenter and mousemove fallback
  function engageLogo(cx, cy) {
    gsap.killTweensOf(logoEl);
    logoReturning = false;              // Cancel any in-progress return
    logoFollowing = true;
    logoPrevX = cx;
    logoPrevY = cy;
    logoEl.style.left = (cx - logoW) + 'px';
    logoEl.style.top = cy + 'px';
    logoEl.classList.add('logo--following');
    hitzone.style.cursor = 'none';
  }

  // --- Desktop: mouse events ---
  if (!isMobile) {
    logoQuickToX = gsap.quickTo(logoEl, 'left', { duration: 0.3, ease: 'power2.out' });
    logoQuickToY = gsap.quickTo(logoEl, 'top', { duration: 0.3, ease: 'power2.out' });
    logoQuickToRot = gsap.quickTo(logoEl, 'rotation', { duration: 0.25, ease: 'power2.out' });

    hitzone.addEventListener('mouseenter', (e) => {
      if (logoReturning) return;          // Don't re-engage during return animation
      engageLogo(e.clientX, e.clientY);
    });

    hitzone.addEventListener('mousemove', (e) => {
      // Fallback re-engagement: mouseenter may not fire reliably
      // after mouse exits and re-enters the browser viewport.
      if (!logoFollowing) {
        if (logoReturning) return;      // Don't re-engage during return animation
        engageLogo(e.clientX, e.clientY);
        return;
      }
      if (!logoQuickToX || !logoQuickToY) return;
      logoQuickToX(e.clientX - logoW);
      logoQuickToY(e.clientY);
      updateRotation(e.clientX, e.clientY);
    });

    hitzone.addEventListener('mouseleave', () => {
      if (!logoFollowing) return;
      hitzone.style.cursor = 'crosshair';
      logoReturnHome(gsap);
    });

    // Document-level viewport exit detection (US1 FR-005)
    document.addEventListener('mouseleave', () => {
      if (!logoFollowing) return;
      hitzone.style.cursor = 'crosshair';
      logoReturnHome(gsap);
    });
  }

  // --- Touch: snap logo to touch point, return on release ---
  hitzone.addEventListener('touchstart', (e) => {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    gsap.killTweensOf(logoEl);
    logoFollowing = true;
    logoPrevX = t.clientX;
    logoPrevY = t.clientY;
    logoEl.style.left = (t.clientX - logoW) + 'px';
    logoEl.style.top = t.clientY + 'px';
    logoEl.classList.add('logo--following');
  }, { passive: true });

  hitzone.addEventListener('touchmove', (e) => {
    if (!logoFollowing || e.touches.length === 0) return;
    const t = e.touches[0];
    logoEl.style.left = (t.clientX - logoW) + 'px';
    logoEl.style.top = t.clientY + 'px';
    updateRotation(t.clientX, t.clientY);
  }, { passive: true });

  hitzone.addEventListener('touchend', () => {
    if (!logoFollowing) return;
    logoReturnHome(gsap);
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// initScene — main entry point
// ---------------------------------------------------------------------------
function initScene() {
  // Mobile detection (T015)
  isMobile = window.innerWidth < 768;

  // WebGL support check
  if (!detectWebGL()) {
    return false;
  }

  labelContainer = document.getElementById('star-labels');

  // -----------------------------------------------------------------------
  // Scene + Camera + Renderer (T005: use window dimensions)
  // -----------------------------------------------------------------------
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 4.5);

  // T015: clamp DPR to 1.0 on mobile
  const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
  const existingCanvas = document.getElementById('orb-canvas');
  renderer = new THREE.WebGLRenderer({
    canvas: existingCanvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Safari shader compile check
  try {
    renderer.compile(scene, camera);
  } catch (_) {
    return false;
  }

  // -----------------------------------------------------------------------
  // OrbGroup — container for stars/nebula (T001: no sphere meshes)
  // -----------------------------------------------------------------------
  orbGroup = new THREE.Group();
  scene.add(orbGroup);

  // -----------------------------------------------------------------------
  // Lights
  // -----------------------------------------------------------------------
  const ambient = new THREE.AmbientLight(0x1a0a2e, 0.3);
  scene.add(ambient);

  const pointLight = new THREE.PointLight(0xffaa44, 2);
  pointLight.position.set(3, 3, 3);
  scene.add(pointLight);

  // T001: Orb sphere meshes REMOVED (glass, rim, inner glow all gone)

  // -----------------------------------------------------------------------
  // Nebula System — 3 layered Points clouds (T002: viewport-distributed)
  // Custom ShaderMaterial with zone color overlay uniforms (US2)
  // -----------------------------------------------------------------------
  nebulaLayers = [];
  nebulaGroup = new THREE.Group();
  orbGroup.add(nebulaGroup);

  // Nebula vertex shader — replicates PointsMaterial sizeAttenuation behavior
  // Three.js formula: gl_PointSize = size * ( scale / -mvPosition.z )
  // where scale = rendererHeight * pixelRatio * 0.5
  const nebulaVertexShader = /* glsl */`
    uniform float size;
    uniform float scale;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = min(size * (scale / -mvPosition.z), 200.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  // Nebula fragment shader — zone color additive overlay
  const nebulaFragmentShader = /* glsl */`
    uniform vec3 uZoneColor;
    uniform float uZoneInfluence;
    uniform float uOpacity;
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.1, dist) * uOpacity;
      vec3 finalColor = mix(vColor, vColor + uZoneColor * 0.3, uZoneInfluence);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // T015: reduced counts on mobile
  const mobileFactor = isMobile ? 0.5 : 1;
  const nebulaConfigs = [
    { count: Math.round((isMobile ? 210 : 800) * 1), xRange: 3.5, yRange: 2.5, zRange: [-2, 1], size: 0.022, blend: THREE.AdditiveBlending, palette: ['#FF6B35', '#A855F7', '#4B2280', '#1A1060'] },
    { count: Math.round((isMobile ? 120 : 400) * 1), xRange: 4.0, yRange: 3.0, zRange: [-2.5, 1.5], size: 0.020, blend: THREE.AdditiveBlending, palette: ['#00C9D4', '#2DD4BF', '#0A0E2A', '#1A1060'] },
    { count: Math.round((isMobile ? 70 : 300) * 1), xRange: 4.5, yRange: 3.2, zRange: [-3, 2], size: 0.018, blend: THREE.NormalBlending, palette: ['#FFFFFF', '#C8B0FF', '#D4B896', '#0A0E2A'] }
  ];

  // Precompute project positions and colors for proximity coloring
  const projectPositions = PROJECTS.map(p => new THREE.Vector3(p.position[0], p.position[1], p.position[2]));
  const projectColors = PROJECTS.map(p => new THREE.Color(p.accentColor));

  nebulaConfigs.forEach((cfg) => {
    const positions = new Float32Array(cfg.count * 3);
    const colors = new Float32Array(cfg.count * 3);
    const paletteColors = cfg.palette.map(c => new THREE.Color(c));
    const tmpVec = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < cfg.count; i++) {
      const [x, y, z] = randomVolumePoint(cfg.xRange, cfg.yRange, cfg.zRange);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color: lerp from nearest project accent colors based on proximity
      tmpVec.set(x, y, z);
      let minDist = Infinity;
      let nearestIdx = 0;
      for (let p = 0; p < projectPositions.length; p++) {
        const d = tmpVec.distanceTo(projectPositions[p]);
        if (d < minDist) {
          minDist = d;
          nearestIdx = p;
        }
      }
      // Blend nearest project color with a random palette color
      const palIdx = Math.floor(Math.random() * paletteColors.length);
      const influence = Math.max(0, 1 - minDist * 0.5);
      tmpColor.copy(paletteColors[palIdx]).lerp(projectColors[nearestIdx], influence * 0.6);

      // T015: boost saturation 20% on mobile
      if (isMobile) {
        const hsl = {};
        tmpColor.getHSL(hsl);
        hsl.s = Math.min(1, hsl.s * 1.2);
        tmpColor.setHSL(hsl.h, hsl.s, hsl.l);
      }

      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // scale matches Three.js PointsMaterial sizeAttenuation: height * dpr * 0.5
    const nebulaScale = window.innerHeight * dpr * 0.5;

    const mat = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      blending: cfg.blend,
      depthWrite: false,
      uniforms: {
        size: { value: cfg.size },
        scale: { value: nebulaScale },
        uZoneColor: { value: new THREE.Color(0, 0, 0) },
        uZoneInfluence: { value: 0.0 },
        uOpacity: { value: 0.8 }
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader
    });

    const points = new THREE.Points(geo, mat);
    nebulaGroup.add(points);
    nebulaLayers.push(points);
  });

  // -----------------------------------------------------------------------
  // Star Node System — 7 sprites with canvas textures
  // -----------------------------------------------------------------------
  starNodes = [];
  starGroup = new THREE.Group();

  PROJECTS.forEach((project, idx) => {
    const tex = createStarTexture(project.accentColor, 128);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    const scale = project.starSize * 0.15;
    sprite.scale.set(scale, scale, scale);
    sprite.position.set(
      project.position[0],
      project.position[1],
      project.position[2]
    );
    sprite.userData = {
      project: project,
      basePosition: project.position.slice(),
      baseScale: scale,
      phaseOffset: Math.random() * Math.PI * 2,
      index: idx
    };
    starGroup.add(sprite);
    starNodes.push(sprite);
  });

  orbGroup.add(starGroup);

  // -----------------------------------------------------------------------
  // Dust Motes — particles with Brownian drift (distributed across viewport)
  // -----------------------------------------------------------------------
  const dustCount = isMobile ? 80 : 180;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = new Float32Array(dustCount * 3);
  const dustOpacities = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    const [x, y, z] = randomVolumePoint(3.0, 2.0, [-2, 1]);
    dustPositions[i * 3] = x;
    dustPositions[i * 3 + 1] = y;
    dustPositions[i * 3 + 2] = z;
    dustVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
    dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    dustOpacities[i] = 0.08 + Math.random() * 0.17;
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

  const dustTex = createDustTexture(32);
  const dustMat = new THREE.PointsMaterial({
    size: 0.008,
    sizeAttenuation: true,
    map: dustTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.15
  });

  dustMotes = new THREE.Points(dustGeo, dustMat);
  orbGroup.add(dustMotes);

  // Store velocities on the dustMotes object for render loop access
  dustMotes.userData.velocities = dustVelocities;
  dustMotes.userData.count = dustCount;

  // -----------------------------------------------------------------------
  // Raycasting — mouse event listeners on #orb-hitzone
  // -----------------------------------------------------------------------
  const hitzone = document.getElementById('orb-hitzone');

  hitzone.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  hitzone.addEventListener('mouseleave', () => {
    mouse.set(-9999, -9999);
  });

  hitzone.addEventListener('click', (e) => {
    // Synchronous raycast at exact click position — don't rely on async
    // hoveredStar from previous ticker frame (race condition fix)
    const clickMouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(clickMouse, camera);
    const hits = raycaster.intersectObjects(starNodes);
    const target = hits.length > 0 ? hits[0].object : null;
    if (target && target.userData.project) {
      document.dispatchEvent(new CustomEvent('star-click', {
        detail: target.userData.project,
        bubbles: true
      }));
    }
  });

  // T015: Touch event listeners for mobile raycasting
  hitzone.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  hitzone.addEventListener('touchend', (e) => {
    // Perform immediate raycast (don't wait for async ticker)
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(starNodes.map(n => n.sprite || n));
    if (hits.length > 0) {
      const hitStar = hits[0].object;
      const project = hitStar.userData.project;
      if (project) {
        document.dispatchEvent(new CustomEvent('star-click', {
          detail: project,
          bubbles: true
        }));
      }
    }
    mouse.set(-9999, -9999);
  });

  // -----------------------------------------------------------------------
  // Resize handler (T005, T019: full window dimensions, orientation change)
  // -----------------------------------------------------------------------
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Update mobile flag BEFORE using it for DPR
    isMobile = w < 768;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const newDpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(newDpr);
    renderer.setSize(w, h);

    // Responsive star scaling (T003)
    const currentAspect = w / h;
    xScale = Math.min(1, currentAspect / designAspect);
    // Y-axis scaling for portrait devices (US4)
    yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3);
    starNodes.forEach(sprite => {
      sprite.position.x = sprite.userData.basePosition[0] * xScale;
      sprite.position.y = sprite.userData.basePosition[1] * yScale;
    });
    // Nebula x-scaling only (intentional asymmetry) + update shader scale uniform
    const newScale = h * newDpr * 0.5;
    nebulaLayers.forEach(layer => {
      layer.scale.x = xScale;
      layer.material.uniforms.scale.value = newScale;
    });

    // Logo state on resize: snap home instantly + refresh quickTo caches
    if (logoEl) {
      const g = window.gsap;
      if (g) g.killTweensOf(logoEl);
      logoFollowing = false;
      logoReturning = false;
      logoEl.classList.remove('logo--following');
      logoEl.style.left = '';
      logoEl.style.top = '';
      if (g) g.set(logoEl, { clearProps: 'transform' });
      // Recreate quickTo instances to purge stale internal start-value caches
      if (g && logoQuickToX) {
        logoQuickToX = g.quickTo(logoEl, 'left', { duration: 0.3, ease: 'power2.out' });
        logoQuickToY = g.quickTo(logoEl, 'top', { duration: 0.3, ease: 'power2.out' });
        logoQuickToRot = g.quickTo(logoEl, 'rotation', { duration: 0.25, ease: 'power2.out' });
      }
      const hz = document.getElementById('orb-hitzone');
      if (hz) hz.style.cursor = 'crosshair';
    }
  }
  window.addEventListener('resize', onResize);

  // -----------------------------------------------------------------------
  // WebGL context loss/restore
  // -----------------------------------------------------------------------
  const domEl = renderer.domElement;
  domEl.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[Arcane Console] WebGL context lost');
  });

  domEl.addEventListener('webglcontextrestored', () => {
    console.log('[Arcane Console] WebGL context restored');
    onResize();
  });

  // -----------------------------------------------------------------------
  // Render loop via GSAP ticker
  // -----------------------------------------------------------------------
  const gsap = window.gsap;
  if (!gsap) {
    console.error('[Arcane Console] GSAP not found');
    return false;
  }

  gsap.ticker.lagSmoothing(0);

  const startTime = performance.now();

  gsap.ticker.add(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const dustCount = dustMotes.userData.count;

    // Nebula slow drift (skip in reduced motion)
    if (!prefersReducedMotion()) {
      nebulaLayers.forEach((layer, i) => {
        const speed = 0.02 + i * 0.008;
        layer.rotation.y = elapsed * speed;
        layer.rotation.x = elapsed * speed * 0.3;
      });
    }

    // Star idle pulse
    starNodes.forEach((sprite) => {
      const ud = sprite.userData;
      if (!prefersReducedMotion()) {
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 1.2 + ud.phaseOffset);
        sprite.material.opacity = pulse;
      }
    });

    // Dust mote Brownian drift (skip in reduced motion)
    if (!prefersReducedMotion()) {
      const posArr = dustMotes.geometry.attributes.position.array;
      const velArr = dustMotes.userData.velocities;
      for (let i = 0; i < dustCount; i++) {
        const i3 = i * 3;
        velArr[i3] += (Math.random() - 0.5) * 0.00008;
        velArr[i3 + 1] += (Math.random() - 0.5) * 0.00008;
        velArr[i3 + 2] += (Math.random() - 0.5) * 0.00008;

        posArr[i3] += velArr[i3];
        posArr[i3 + 1] += velArr[i3 + 1];
        posArr[i3 + 2] += velArr[i3 + 2];

        // Clamp to volume bounds
        const dx = posArr[i3];
        const dy = posArr[i3 + 1];
        const dz = posArr[i3 + 2];
        const xClamp = 3.5 * xScale;
        if (Math.abs(dx) > xClamp || Math.abs(dy) > 2.5 || dz < -2.5 || dz > 1.5) {
          velArr[i3] *= -0.5;
          velArr[i3 + 1] *= -0.5;
          velArr[i3 + 2] *= -0.5;
          posArr[i3] = Math.max(-xClamp, Math.min(xClamp, dx));
          posArr[i3 + 1] = Math.max(-2.5, Math.min(2.5, dy));
          posArr[i3 + 2] = Math.max(-2.5, Math.min(1.5, dz));
        }
      }
      dustMotes.geometry.attributes.position.needsUpdate = true;
    }

    // Raycasting — per frame
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(starNodes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hoveredStar !== hit) {
        if (hoveredStar) {
          handleStarExit(hoveredStar);
        }
        hoveredStar = hit;
        handleStarEnter(hit);
      }
      showStarLabel(hit);
      // T010: show pointer cursor on star hover even when logo follows
      const hitzone = document.getElementById('orb-hitzone');
      if (hitzone) hitzone.style.cursor = 'pointer';
    } else {
      if (hoveredStar) {
        handleStarExit(hoveredStar);
        hoveredStar = null;
      }
      // T010: hide cursor when logo following, show crosshair otherwise
      const hitzone = document.getElementById('orb-hitzone');
      if (hitzone) {
        hitzone.style.cursor = logoFollowing ? 'none' : 'crosshair';
      }
    }

    // Use EffectComposer if available, otherwise direct render
    if (window.__arcaneComposer && renderer._composerActive) {
      window.__arcaneComposer.render();
    } else {
      renderer.render(scene, camera);
    }
  });

  // -----------------------------------------------------------------------
  // Tab visibility: pause/wake ticker
  // -----------------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gsap.ticker.sleep();
    } else {
      gsap.ticker.wake();
    }
  });

  // Initialize logo follow after scene is ready
  initLogoFollow();

  // Compute initial xScale for non-16:9 viewports (e.g. mobile first-load)
  onResize();

  return true;
}

// ---------------------------------------------------------------------------
// Hover enter/exit handlers
// ---------------------------------------------------------------------------
function handleStarEnter(sprite) {
  const gsap = window.gsap;
  if (!gsap) return;
  const ud = sprite.userData;
  const targetScale = ud.baseScale * 1.6;
  gsap.to(sprite.scale, {
    x: targetScale,
    y: targetScale,
    z: targetScale,
    duration: 0.2,
    ease: 'back.out(3)'
  });
  showStarLabel(sprite);
}

function handleStarExit(sprite) {
  const gsap = window.gsap;
  if (!gsap) return;
  const ud = sprite.userData;
  gsap.to(sprite.scale, {
    x: ud.baseScale,
    y: ud.baseScale,
    z: ud.baseScale,
    duration: 0.2,
    ease: 'power2.out'
  });
  hideStarLabel(sprite);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { initScene, scene, camera, renderer, orbGroup, starNodes, nebulaLayers, nebulaGroup, isMobile };
