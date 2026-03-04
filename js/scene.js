// js/scene.js — Three.js crystal ball scene
import * as THREE from 'three';
import { PROJECTS, CONSTELLATION_ZONES } from './data.js';

// ---------------------------------------------------------------------------
// Module-level references (exported at bottom)
// ---------------------------------------------------------------------------
let scene, camera, renderer, orbGroup, starNodes, glassMaterial, nebulaLayers;
let starGroup, dustMotes;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999);
let hoveredStar = null;
let labelContainer = null;

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
// Uniform sphere rejection sampling
// ---------------------------------------------------------------------------
function randomSpherePoint(radius) {
  while (true) {
    const x = (Math.random() * 2 - 1) * radius;
    const y = (Math.random() * 2 - 1) * radius;
    const z = (Math.random() * 2 - 1) * radius;
    if (x * x + y * y + z * z <= radius * radius) {
      return [x, y, z];
    }
  }
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
function showStarLabel(starSprite) {
  if (!labelContainer) return;
  const project = starSprite.userData.project;
  let label = labelContainer.querySelector(`[data-star-label="${project.id}"]`);
  if (!label) {
    label = document.createElement('div');
    label.className = 'star-label';
    label.setAttribute('data-star-label', project.id);
    label.textContent = project.name;
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
// initScene — main entry point
// ---------------------------------------------------------------------------
function initScene() {
  // Viewport width guard
  if (window.innerWidth < 1200) {
    return false;
  }

  // WebGL support check
  if (!detectWebGL()) {
    return false;
  }

  const viewport = document.getElementById('main-viewport');
  if (!viewport) return false;

  labelContainer = document.getElementById('star-labels');

  // -----------------------------------------------------------------------
  // Scene + Camera + Renderer
  // -----------------------------------------------------------------------
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    viewport.clientWidth / viewport.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 4.5);

  const dpr = Math.min(window.devicePixelRatio, 1.5);
  const existingCanvas = document.getElementById('orb-canvas');
  renderer = new THREE.WebGLRenderer({
    canvas: existingCanvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Safari shader compile check
  try {
    renderer.compile(scene, camera);
  } catch (_) {
    // Shader compilation failed — caller can detect and show fallback
    return false;
  }

  // -----------------------------------------------------------------------
  // OrbGroup — rotates as unit
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

  // -----------------------------------------------------------------------
  // Crystal Ball — Outer glass
  // -----------------------------------------------------------------------
  const glassGeo = new THREE.IcosahedronGeometry(1.0, 6);
  glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 0.92,
    roughness: 0.05,
    ior: 1.5,
    transparent: true,
    opacity: 0.15,
    side: THREE.FrontSide,
    depthWrite: false
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
  orbGroup.add(glassMesh);

  // -----------------------------------------------------------------------
  // Crystal Ball — Rim sphere (BackSide glow)
  // -----------------------------------------------------------------------
  const rimGeo = new THREE.IcosahedronGeometry(1.04, 6);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xffcc66,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.12
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  orbGroup.add(rimMesh);

  // -----------------------------------------------------------------------
  // Crystal Ball — Inner glow sphere
  // -----------------------------------------------------------------------
  const innerGeo = new THREE.IcosahedronGeometry(0.97, 5);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x1a0a3a,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.85
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  orbGroup.add(innerMesh);

  // -----------------------------------------------------------------------
  // Nebula System — 3 layered Points clouds
  // -----------------------------------------------------------------------
  nebulaLayers = [];
  const nebulaConfigs = [
    { count: 800, radius: 0.75, size: 0.018, blend: THREE.AdditiveBlending, palette: ['#FF6B35', '#A855F7', '#4B2280', '#1A1060'] },
    { count: 400, radius: 0.85, size: 0.016, blend: THREE.AdditiveBlending, palette: ['#00C9D4', '#2DD4BF', '#0A0E2A', '#1A1060'] },
    { count: 300, radius: 0.88, size: 0.015, blend: THREE.NormalBlending, palette: ['#FFFFFF', '#C8B0FF', '#D4B896', '#0A0E2A'] }
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
      const [x, y, z] = randomSpherePoint(cfg.radius);
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
      const influence = Math.max(0, 1 - minDist * 1.5);
      tmpColor.copy(paletteColors[palIdx]).lerp(projectColors[nearestIdx], influence * 0.6);
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: cfg.size,
      sizeAttenuation: true,
      vertexColors: true,
      blending: cfg.blend,
      transparent: true,
      depthWrite: false,
      opacity: 0.8
    });

    const points = new THREE.Points(geo, mat);
    orbGroup.add(points);
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
    const scale = project.starSize * 0.12;
    sprite.scale.set(scale, scale, scale);
    sprite.position.set(
      project.position[0],
      project.position[1],
      project.position[2]
    );
    sprite.userData = {
      project: project,
      baseScale: scale,
      phaseOffset: Math.random() * Math.PI * 2,
      index: idx
    };
    starGroup.add(sprite);
    starNodes.push(sprite);
  });

  orbGroup.add(starGroup);

  // -----------------------------------------------------------------------
  // Dust Motes — 180 particles with Brownian drift
  // -----------------------------------------------------------------------
  const dustCount = 180;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = new Float32Array(dustCount * 3); // stored separately
  const dustOpacities = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    const [x, y, z] = randomSpherePoint(0.90);
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

  // -----------------------------------------------------------------------
  // Raycasting — mouse event listeners on #orb-hitzone (sits above canvas)
  // -----------------------------------------------------------------------
  const hitzone = document.getElementById('orb-hitzone');
  const domEl = renderer.domElement;

  hitzone.addEventListener('mousemove', (e) => {
    const rect = domEl.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  hitzone.addEventListener('mouseleave', () => {
    mouse.set(-9999, -9999);
  });

  hitzone.addEventListener('click', () => {
    if (hoveredStar) {
      const project = hoveredStar.userData.project;
      document.dispatchEvent(new CustomEvent('star-click', {
        detail: project,
        bubbles: true
      }));
    }
  });

  // -----------------------------------------------------------------------
  // Resize handler
  // -----------------------------------------------------------------------
  function onResize() {
    if (!viewport) return;
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const newDpr = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(newDpr);
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // -----------------------------------------------------------------------
  // WebGL context loss/restore
  // -----------------------------------------------------------------------
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
        // Add small random perturbation (Brownian motion)
        velArr[i3] += (Math.random() - 0.5) * 0.00008;
        velArr[i3 + 1] += (Math.random() - 0.5) * 0.00008;
        velArr[i3 + 2] += (Math.random() - 0.5) * 0.00008;

        posArr[i3] += velArr[i3];
        posArr[i3 + 1] += velArr[i3 + 1];
        posArr[i3 + 2] += velArr[i3 + 2];

        // Clamp to orb interior (r=0.92)
        const dx = posArr[i3];
        const dy = posArr[i3 + 1];
        const dz = posArr[i3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.92) {
          const scale = 0.92 / dist;
          posArr[i3] *= scale;
          posArr[i3 + 1] *= scale;
          posArr[i3 + 2] *= scale;
          // Reverse velocity component pointing outward
          velArr[i3] *= -0.5;
          velArr[i3 + 1] *= -0.5;
          velArr[i3 + 2] *= -0.5;
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
        // Exit previous
        if (hoveredStar) {
          handleStarExit(hoveredStar);
        }
        // Enter new
        hoveredStar = hit;
        handleStarEnter(hit);
      }
      // Update label position each frame
      showStarLabel(hit);
      hitzone.style.cursor = 'pointer';
    } else {
      if (hoveredStar) {
        handleStarExit(hoveredStar);
        hoveredStar = null;
      }
      hitzone.style.cursor = 'default';
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
export { initScene, scene, camera, renderer, orbGroup, starNodes, glassMaterial, nebulaLayers };
