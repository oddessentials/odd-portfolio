// js/scene.js — Three.js full-bleed starfield scene
import * as THREE from 'three';
import { PROJECTS } from './data.js';
import { createNebulaSystem, createStarNodes, createDustSystem } from './textures.js';
import { init as initLogoFollow, resetOnResize as logoResetOnResize, isFollowing as isLogoFollowing } from './logo-follow.js';
import { init as initReticle, tick as reticleTick, onStarEnter, onStarExit } from './reticle.js';
import { init as initParallax, tick as parallaxTick } from './parallax.js';
import { tick as sidebarHieroglyphsTick, render as sidebarHieroglyphsRender } from './sidebar-hieroglyphs.js';

// Module-level references (exported at bottom)
let scene, camera, renderer, orbGroup, starNodes, nebulaLayers;
let starGroup, dustMotes, nebulaGroup;

// Chromatic twinkle state (T017)
let lastTwinkleTime = 0;
const TWINKLE_INTERVAL = 2; // seconds between twinkles
const TWINKLE_DURATION = 0.4; // seconds a twinkle lasts
let activeTwinkle = null; // { layerIdx, idx, origR, origG, origB, startTime }
const twinkleColor = new THREE.Color(); // reused each twinkle cycle
const twinkleHSL = {};

const raycaster = new THREE.Raycaster();
raycaster.params.Sprite = { threshold: 0.15 };
const mouse = new THREE.Vector2(-9999, -9999);
let hoveredStar = null;
let isMobile = false;
let xScale = 1.0;
let yScale = 1.0;
const designAspect = 16 / 9;

// Reduced-motion query (dynamic — responds to runtime changes)
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotionQuery.matches;

// --- WebGL Support Detection ---
function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
    return !!gl;
  } catch (_) {
    return false;
  }
}

// --- Project 3D to screen coordinates ---
const _projVec = new THREE.Vector3();
function project3DtoScreen(position3D, cam, domElement) {
  _projVec.copy(position3D).project(cam);
  const halfW = domElement.clientWidth / 2;
  const halfH = domElement.clientHeight / 2;
  return {
    x: _projVec.x * halfW + halfW,
    y: -(_projVec.y * halfH) + halfH
  };
}

// --- initScene — main entry point ---
function initScene() {
  isMobile = window.innerWidth < 768;

  if (!detectWebGL()) {
    return false;
  }

  // Scene + Camera + Renderer
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 4.5);

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

  // OrbGroup — container for stars/nebula
  orbGroup = new THREE.Group();
  scene.add(orbGroup);

  // Lights
  const ambient = new THREE.AmbientLight(0x1a0a2e, 0.3);
  scene.add(ambient);
  const pointLight = new THREE.PointLight(0xffaa44, 2);
  pointLight.position.set(3, 3, 3);
  scene.add(pointLight);

  // --- Create 3D objects via textures.js factories ---
  nebulaGroup = new THREE.Group();
  orbGroup.add(nebulaGroup);
  nebulaLayers = createNebulaSystem(nebulaGroup, isMobile, dpr, PROJECTS);

  const starResult = createStarNodes(PROJECTS);
  starNodes = starResult.starNodes;
  starGroup = starResult.starGroup;
  orbGroup.add(starGroup);

  dustMotes = createDustSystem(isMobile, xScale);
  orbGroup.add(dustMotes);

  // --- Raycasting — mouse event listeners on #orb-hitzone ---
  const hitzone = document.getElementById('orb-hitzone');

  hitzone.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  hitzone.addEventListener('mouseleave', () => {
    mouse.set(-9999, -9999);
  });

  hitzone.addEventListener('click', (e) => {
    const clickMouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(clickMouse, camera);
    const hits = raycaster.intersectObjects(starNodes, true);
    const target = hits.length > 0 ? hits[0].object : null;
    if (target && target.userData.project && target.userData.project.status !== 'paused') {
      document.dispatchEvent(new CustomEvent('star-click', {
        detail: target.userData.project,
        bubbles: true
      }));
    }
  });

  // Touch event listeners for mobile raycasting
  hitzone.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }
  }, { passive: true });

  hitzone.addEventListener('touchend', (e) => {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(starNodes, true);
    for (let i = 0; i < hits.length; i++) {
      const obj = hits[i].object;
      if (obj.userData && obj.userData.project && obj.userData.project.status !== 'paused') {
        document.dispatchEvent(new CustomEvent('star-click', {
          detail: obj.userData.project,
          bubbles: true
        }));
        break;
      }
    }
    mouse.set(-9999, -9999);
  });

  // --- Resize handler ---
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    isMobile = w < 768;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const newDpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(newDpr);
    renderer.setSize(w, h);

    const currentAspect = w / h;
    xScale = Math.min(1, currentAspect / designAspect);
    yScale = Math.max(0.8, 1 - (1 - xScale) * 0.3);
    starNodes.forEach(node => {
      node.position.x = node.userData.basePosition[0] * xScale;
      node.position.y = node.userData.basePosition[1] * yScale;
    });
    const newScale = h * newDpr * 0.5;
    nebulaLayers.forEach(layer => {
      layer.scale.x = xScale;
      layer.material.uniforms.scale.value = newScale;
    });

    logoResetOnResize();
  }
  window.addEventListener('resize', onResize);

  // --- WebGL context loss/restore ---
  const domEl = renderer.domElement;
  domEl.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[Arcane Console] WebGL context lost');
  });
  domEl.addEventListener('webglcontextrestored', () => {
    console.log('[Arcane Console] WebGL context restored');
    onResize();
  });

  // --- Render loop via GSAP ticker ---
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

    // Nebula slow drift
    if (!prefersReducedMotion()) {
      nebulaLayers.forEach((layer, i) => {
        const speed = 0.02 + i * 0.008;
        layer.rotation.y = elapsed * speed;
        layer.rotation.x = elapsed * speed * 0.3;
      });
    }

    // Star idle pulse (skip clusters that lack .material, skip paused)
    starNodes.forEach((node) => {
      const ud = node.userData;
      if (prefersReducedMotion()) return;
      if (ud.project && ud.project.status === 'paused') return;
      if (node.material) {
        // Individual star sprite
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 1.2 + ud.phaseOffset);
        node.material.opacity = pulse;
      } else if (node.isGroup || node.children) {
        // Cluster group — pulse sub-point children (not halo, not hit-area)
        const pulse = 0.7 + 0.3 * Math.sin(elapsed * 1.2 + ud.phaseOffset);
        node.children.forEach(child => {
          if (child.userData && child.userData.isSubPoint && child.material) {
            child.material.opacity = pulse;
          }
        });
      }
    });


    // Chromatic twinkle — rare vivid flash on a nebula particle (T017)
    if (!prefersReducedMotion() && elapsed - lastTwinkleTime > TWINKLE_INTERVAL) {
      lastTwinkleTime = elapsed;
      const layerIdx = Math.floor(Math.random() * nebulaLayers.length);
      const layer = nebulaLayers[layerIdx];
      const colors = layer.geometry.attributes.color;
      const count = colors.count;
      const idx = Math.floor(Math.random() * count);
      // Store original color
      const origR = colors.getX(idx);
      const origG = colors.getY(idx);
      const origB = colors.getZ(idx);
      // Boost saturation for vivid flash
      twinkleColor.setRGB(origR, origG, origB);
      twinkleColor.getHSL(twinkleHSL);
      twinkleColor.setHSL(twinkleHSL.h, Math.min(1, twinkleHSL.s + 0.7), Math.min(1, twinkleHSL.l + 0.2));
      colors.setXYZ(idx, twinkleColor.r, twinkleColor.g, twinkleColor.b);
      colors.needsUpdate = true;
      activeTwinkle = { layerIdx, idx, origR, origG, origB, startTime: elapsed };
    }
    // Fade twinkle back after duration
    if (activeTwinkle && elapsed - activeTwinkle.startTime > TWINKLE_DURATION) {
      const layer = nebulaLayers[activeTwinkle.layerIdx];
      const colors = layer.geometry.attributes.color;
      colors.setXYZ(activeTwinkle.idx, activeTwinkle.origR, activeTwinkle.origG, activeTwinkle.origB);
      colors.needsUpdate = true;
      activeTwinkle = null;
    }

    // Dust mote Brownian drift
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

    // Raycasting — per frame (recursive to catch cluster hit-area sprites)
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(starNodes, true);
    // Find first hit with a project reference
    let hitObj = null;
    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      if (obj.userData && obj.userData.project) {
        hitObj = obj;
        break;
      }
    }

    if (hitObj && hitObj.userData.project.status !== 'paused') {
      // For cluster children (hit-area or sub-point sprites), use the parent group
      const hoverTarget = (hitObj.userData.isHitArea || hitObj.userData.isSubPoint) ? hitObj.parent : hitObj;
      if (hoveredStar !== hoverTarget) {
        if (hoveredStar) onStarExit(hoveredStar);
        hoveredStar = hoverTarget;
        onStarEnter(hoverTarget);
      }
      hitzone.style.cursor = 'pointer';
    } else {
      if (hoveredStar) {
        onStarExit(hoveredStar);
        hoveredStar = null;
      }
      hitzone.style.cursor = isLogoFollowing() ? 'none' : 'crosshair';
    }

    // Reticle per-frame tracking
    reticleTick(elapsed);
    // Parallax mouse-driven depth offset
    parallaxTick();

    // Sidebar hieroglyph shader animation
    sidebarHieroglyphsTick(elapsed);

    // Use EffectComposer if available, otherwise direct render
    if (window.__arcaneComposer && renderer._composerActive) {
      window.__arcaneComposer.render();
    } else {
      renderer.render(scene, camera);
    }

    // Sidebar hieroglyph overlay (separate pass — avoids bloom/vignette)
    sidebarHieroglyphsRender();
  });

  // Tab visibility: pause/wake ticker
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gsap.ticker.sleep();
    } else {
      gsap.ticker.wake();
    }
  });

  // Initialize logo follow after scene is ready
  initLogoFollow({ isMobile });

  // Initialize parallax depth layers (Phase 7)
  initParallax({ nebulaLayers, nebulaGroup });

  // Initialize targeting reticle
  initReticle();

  // Compute initial xScale for non-16:9 viewports
  onResize();

  return true;
}

// --- Exports ---
export { initScene, scene, camera, renderer, starNodes, nebulaLayers, nebulaGroup, project3DtoScreen };
