// js/performance.js — Post-processing pipeline, supernova burst, auto-tier degradation
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let currentTier = 1;
let composer = null;
let bloomPass = null;
let customPass = null;
let burstPool = [];
let burstPoolReady = false;

function getCurrentTier() {
  return currentTier;
}

// ---------------------------------------------------------------------------
// Custom chromatic aberration + vignette shader
// ---------------------------------------------------------------------------
const ChromaVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    aberrationEnabled: { value: 1.0 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float aberrationEnabled;
    varying vec2 vUv;
    void main() {
      float orbEdge = smoothstep(0.35, 0.5, length(vUv - 0.5));
      float aberration = 0.003 * orbEdge * aberrationEnabled;
      float r = texture2D(tDiffuse, vUv + vec2(aberration, 0.0)).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - vec2(aberration, 0.0)).b;
      float vignette = smoothstep(0.5, 1.0, length(vUv - 0.5) * 1.8);
      vec3 color = vec3(r, g, b) * (1.0 - vignette * 0.6);
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// ---------------------------------------------------------------------------
// initPostProcessing — set up 4-pass pipeline, monkey-patch renderer.render
// ---------------------------------------------------------------------------
function initPostProcessing(sceneRef, cameraRef, rendererRef) {
  const viewport = rendererRef.domElement.parentElement;
  if (!viewport) return null;

  const w = viewport.clientWidth;
  const h = viewport.clientHeight;

  // Create composer
  composer = new EffectComposer(rendererRef);

  // Pass 1: RenderPass
  const renderPass = new RenderPass(sceneRef, cameraRef);
  composer.addPass(renderPass);

  // Pass 2: UnrealBloomPass at 0.75x resolution
  const bloomRes = new THREE.Vector2(
    Math.floor(w * 0.75),
    Math.floor(h * 0.75)
  );
  bloomPass = new UnrealBloomPass(bloomRes, 0.8, 0.4, 0.85);
  composer.addPass(bloomPass);

  // Pass 3: Custom chromatic aberration + vignette
  customPass = new ShaderPass(ChromaVignetteShader);
  customPass.uniforms.resolution.value.set(w, h);
  composer.addPass(customPass);

  // Pass 4: OutputPass (tone mapping + color space)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Monkey-patch renderer.render so the existing GSAP ticker in scene.js
  // routes through the composer instead of direct rendering.
  const originalRender = rendererRef.render.bind(rendererRef);
  rendererRef._originalRender = originalRender;
  rendererRef._composerActive = true;

  rendererRef.render = function (s, c) {
    if (rendererRef._composerActive && composer) {
      composer.render();
    } else {
      originalRender(s, c);
    }
  };

  // Handle resize — update composer and bloom resolution
  const onResize = () => {
    if (!viewport) return;
    const rw = viewport.clientWidth;
    const rh = viewport.clientHeight;
    composer.setSize(rw, rh);
    bloomPass.resolution.set(
      Math.floor(rw * 0.75),
      Math.floor(rh * 0.75)
    );
    customPass.uniforms.resolution.value.set(rw, rh);
  };
  window.addEventListener('resize', onResize);

  return { composer, bloomPass, customPass, renderPass, outputPass };
}

// ---------------------------------------------------------------------------
// Supernova Burst — pre-allocated particle pool
// ---------------------------------------------------------------------------
let burstContainer = null;

function ensureBurstPool(sceneRef) {
  if (burstPoolReady) return;

  burstContainer = new THREE.Group();
  burstContainer.name = 'burstPool';
  sceneRef.add(burstContainer);

  // Create 60 sprites (pool)
  for (let i = 0; i < 60; i++) {
    const mat = new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0, 0, 0);
    sprite.visible = false;
    sprite.userData.poolIndex = i;
    burstContainer.add(sprite);
    burstPool.push(sprite);
  }

  burstPoolReady = true;
}

function createSupernovaBurst(starWorldPosition, accentColor) {
  const gsap = window.gsap;
  if (!gsap) return;
  if (!burstPoolReady) return;

  const color = new THREE.Color(accentColor);
  let poolIdx = 0;

  function acquireSprite() {
    if (poolIdx >= burstPool.length) return null;
    const s = burstPool[poolIdx++];
    s.visible = true;
    s.material.opacity = 1;
    s.material.color.copy(color);
    s.position.copy(starWorldPosition);
    s.scale.set(0.01, 0.01, 0.01);
    return s;
  }

  function releaseAll() {
    for (let i = 0; i < poolIdx; i++) {
      const s = burstPool[i];
      s.visible = false;
      s.material.opacity = 0;
      s.scale.set(0, 0, 0);
      s.position.set(0, 0, 0);
    }
  }

  // --- 20 spark sprites (radial outward) ---
  for (let i = 0; i < 20; i++) {
    const sprite = acquireSprite();
    if (!sprite) break;

    // Random radial direction on a sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 0.4;
    const dx = radius * Math.sin(phi) * Math.cos(theta);
    const dy = radius * Math.sin(phi) * Math.sin(theta);
    const dz = radius * Math.cos(phi);

    const startSize = 0.02 + Math.random() * 0.02;
    sprite.scale.set(startSize, startSize, startSize);

    gsap.to(sprite.position, {
      x: starWorldPosition.x + dx,
      y: starWorldPosition.y + dy,
      z: starWorldPosition.z + dz,
      duration: 0.6,
      ease: 'power2.out'
    });
    gsap.to(sprite.material, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in'
    });
  }

  // --- 1 expanding ring sprite ---
  const ring = acquireSprite();
  if (ring) {
    ring.material.color.set(0xffffff);
    ring.scale.set(0.01, 0.01, 0.01);
    ring.material.opacity = 0.8;
    gsap.to(ring.scale, {
      x: 0.5,
      y: 0.5,
      z: 0.5,
      duration: 0.6,
      ease: 'power2.out'
    });
    gsap.to(ring.material, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in'
    });
  }

  // --- 10 radial ray sprites (elongated, shooting outward) ---
  for (let i = 0; i < 10; i++) {
    const sprite = acquireSprite();
    if (!sprite) break;

    const angle = (i / 10) * Math.PI * 2;
    const rayLen = 0.3 + Math.random() * 0.2;
    const dx = rayLen * Math.cos(angle);
    const dy = rayLen * Math.sin(angle);

    // Elongated scale along one axis
    sprite.scale.set(0.005, 0.04, 0.005);
    sprite.material.opacity = 0.9;

    gsap.to(sprite.position, {
      x: starWorldPosition.x + dx,
      y: starWorldPosition.y + dy,
      z: starWorldPosition.z,
      duration: 0.45,
      ease: 'power2.out'
    });
    gsap.to(sprite.scale, {
      x: 0.002,
      y: 0.06,
      z: 0.002,
      duration: 0.45,
      ease: 'power2.out'
    });
    gsap.to(sprite.material, {
      opacity: 0,
      duration: 0.5,
      delay: 0.15,
      ease: 'power2.in'
    });
  }

  // Release all sprites back to pool after total burst duration
  gsap.delayedCall(0.9, releaseAll);
}

// ---------------------------------------------------------------------------
// Auto-Tier Degradation
// ---------------------------------------------------------------------------
let benchmarkStarted = false;

function initAutoTierDegradation(composerRef, bloomPassRef, customPassRef) {
  const rendererEl = document.querySelector('#main-viewport canvas');

  function runBenchmark() {
    if (benchmarkStarted) return;
    benchmarkStarted = true;

    const frameTimes = [];
    let frameCount = 0;

    function measure() {
      const start = performance.now();

      requestAnimationFrame(() => {
        const elapsed = performance.now() - start;
        frameTimes.push(elapsed);
        frameCount++;

        if (frameCount < 30) {
          measure();
        } else {
          evaluateTier();
        }
      });
    }

    function evaluateTier() {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      console.log(`[Arcane Console] Benchmark avg frame time: ${avg.toFixed(2)}ms`);

      if (avg < 20) {
        currentTier = 1;
        console.log('[Arcane Console] Performance tier: 1 (Full)');
      } else {
        applyTier2(bloomPassRef, customPassRef);
        currentTier = 2;
        console.log('[Arcane Console] Performance tier: 2 (Medium)');

        // Re-benchmark after Tier 2 to check if sufficient
        setTimeout(runTier2Recheck, 2000);
      }
    }

    measure();
  }

  function applyTier2(bp, cp) {
    // Disable chromatic aberration
    if (cp && cp.uniforms && cp.uniforms.aberrationEnabled) {
      cp.uniforms.aberrationEnabled.value = 0.0;
    }
    // Reduce bloom strength
    if (bp) {
      bp.strength = 0.4;
    }
  }

  function runTier2Recheck() {
    const frameTimes = [];
    let frameCount = 0;

    function measure() {
      const start = performance.now();
      requestAnimationFrame(() => {
        const elapsed = performance.now() - start;
        frameTimes.push(elapsed);
        frameCount++;

        if (frameCount < 30) {
          measure();
        } else {
          const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          console.log(`[Arcane Console] Tier 2 recheck avg: ${avg.toFixed(2)}ms`);

          if (avg >= 20) {
            applyTier3();
          }
        }
      });
    }

    measure();
  }

  function applyTier3() {
    currentTier = 3;
    console.log('[Arcane Console] Performance tier: 3 (Low)');

    // Disable EffectComposer — revert to direct renderer.render
    const rendererRef = composerRef.renderer;
    if (rendererRef && rendererRef._originalRender) {
      rendererRef._composerActive = false;
    }

    // Add CSS filter as cheap bloom substitute
    if (rendererEl) {
      rendererEl.style.filter = 'blur(1px) brightness(1.1)';
    }
  }

  // Wait for reveal-complete event, then wait 5 more seconds, then benchmark
  const handler = () => {
    document.removeEventListener('reveal-complete', handler);
    setTimeout(runBenchmark, 5000);
  };

  document.addEventListener('reveal-complete', handler);

  // Fallback: if reveal-complete never fires (e.g. reduced motion skips it),
  // start benchmark 12 seconds after page load
  setTimeout(() => {
    document.removeEventListener('reveal-complete', handler);
    runBenchmark();
  }, 12000);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export {
  initPostProcessing,
  createSupernovaBurst,
  initAutoTierDegradation,
  getCurrentTier,
  ensureBurstPool
};
