// js/performance.js — Post-processing pipeline, auto-tier degradation
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ensureBurstPool, createSupernovaBurst } from './burst.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let currentTier = 1;
let composer = null;
let bloomPass = null;
let customPass = null;

function getCurrentTier() {
  return currentTier;
}

// ---------------------------------------------------------------------------
// Custom vignette shader (T006: uniform vignette, no orb-edge aberration)
// ---------------------------------------------------------------------------
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
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
    uniform float aberrationEnabled;
    varying vec2 vUv;
    void main() {
      // Subtle uniform chromatic aberration (not orb-edge based)
      float aberration = 0.0015 * aberrationEnabled;
      float r = texture2D(tDiffuse, vUv + vec2(aberration, 0.0)).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - vec2(aberration, 0.0)).b;
      // Subtle vignette from edges
      float vignette = smoothstep(0.4, 1.2, length(vUv - 0.5) * 1.6);
      vec3 color = vec3(r, g, b) * (1.0 - vignette * 0.45);
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

// ---------------------------------------------------------------------------
// initPostProcessing (T006: full window dimensions, T016: skip on mobile)
// ---------------------------------------------------------------------------
function initPostProcessing(sceneRef, cameraRef, rendererRef) {
  // T016: skip post-processing entirely on mobile
  if (window.innerWidth < 768) {
    return null;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;

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

  // Pass 3: Uniform vignette (replaces orb-edge chromatic aberration)
  customPass = new ShaderPass(VignetteShader);
  composer.addPass(customPass);

  // Pass 4: OutputPass (tone mapping + color space)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Store composer reference globally so scene.js ticker can use it
  window.__arcaneComposer = composer;
  rendererRef._composerActive = true;
  rendererRef._originalRender = rendererRef.render.bind(rendererRef);

  // Handle resize — update composer and bloom resolution (full window dims)
  const onResize = () => {
    const rw = window.innerWidth;
    const rh = window.innerHeight;
    composer.setSize(rw, rh);
    bloomPass.resolution.set(
      Math.floor(rw * 0.75),
      Math.floor(rh * 0.75)
    );
  };
  window.addEventListener('resize', onResize);

  return { composer, bloomPass, customPass, renderPass, outputPass };
}

// ---------------------------------------------------------------------------
// Auto-Tier Degradation
// ---------------------------------------------------------------------------
let benchmarkStarted = false;

function initAutoTierDegradation(composerRef, bloomPassRef, customPassRef) {
  const rendererEl = document.querySelector('#orb-canvas');

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
        setTimeout(runTier2Recheck, 2000);
      }
    }

    measure();
  }

  function applyTier2(bp, cp) {
    if (cp && cp.uniforms && cp.uniforms.aberrationEnabled) {
      cp.uniforms.aberrationEnabled.value = 0.0;
    }
    if (bp) {
      bp.strength = 0.4;
    }
    // Shimmer degradation: slow down (T019)
    document.querySelector('.frame__greek-key')?.style.setProperty('--shimmer-duration', '8s');
    document.dispatchEvent(new CustomEvent('tier-change', { detail: { tier: 2 } }));
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

    const rendererRef = composerRef.renderer;
    if (rendererRef && rendererRef._originalRender) {
      rendererRef._composerActive = false;
    }

    if (rendererEl) {
      rendererEl.style.filter = 'blur(1px) brightness(1.1)';
    }

    // Shimmer degradation: disable (T019)
    document.querySelector('.frame__greek-key')?.classList.add('shimmer-disabled');
    document.dispatchEvent(new CustomEvent('tier-change', { detail: { tier: 3 } }));
  }

  // Benchmark fires 5s after BOTH reveal-complete AND terminal-scan-complete (T015)
  let revealDone = false;
  let terminalDone = false;

  function checkBothDone() {
    if (revealDone && terminalDone) {
      setTimeout(runBenchmark, 5000);
    }
  }

  const revealHandler = () => {
    document.removeEventListener('reveal-complete', revealHandler);
    revealDone = true;
    checkBothDone();
  };

  const terminalHandler = () => {
    document.removeEventListener('terminal-scan-complete', terminalHandler);
    terminalDone = true;
    checkBothDone();
  };

  document.addEventListener('reveal-complete', revealHandler);
  document.addEventListener('terminal-scan-complete', terminalHandler);

  // Fallback timeout: 20s
  setTimeout(() => {
    document.removeEventListener('reveal-complete', revealHandler);
    document.removeEventListener('terminal-scan-complete', terminalHandler);
    runBenchmark();
  }, 20000);

  // Scroll-time safety net (T026): sample 10 frames during first scroll
  let scrollSampled = false;
  function onFirstScroll() {
    if (scrollSampled || currentTier >= 3) return;
    scrollSampled = true;
    window.removeEventListener('scroll', onFirstScroll);

    const scrollFrameTimes = [];
    let scrollFrameCount = 0;

    function measureScroll() {
      const start = performance.now();
      requestAnimationFrame(() => {
        scrollFrameTimes.push(performance.now() - start);
        scrollFrameCount++;
        if (scrollFrameCount < 10) {
          measureScroll();
        } else {
          const avg = scrollFrameTimes.reduce((a, b) => a + b, 0) / scrollFrameTimes.length;
          console.log(`[Arcane Console] Scroll benchmark avg: ${avg.toFixed(2)}ms`);
          if (avg > 20 && currentTier < 3) {
            applyTier3();
          }
        }
      });
    }

    measureScroll();
  }

  window.addEventListener('scroll', onFirstScroll, { passive: true });
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
