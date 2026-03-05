// js/app.js — Main entry point
import { initScene, scene, camera, renderer } from './scene.js';
import { initInteractions } from './interactions.js';
import {
  playRevealSequence,
  initScrollZones,
  handleReducedMotion,
  initSkipIntro,
  handleScrollDuringReveal,
  handlePanelScrollLock
} from './animations.js';
import {
  initPostProcessing,
  ensureBurstPool,
  initAutoTierDegradation
} from './performance.js';

// Initialize interactions (panel, keyboard nav, hamburger) — works even without WebGL
initInteractions();

// Initialize the 3D scene
const sceneReady = initScene();

if (sceneReady) {
  // Initialize post-processing pipeline (T016: returns null on mobile)
  const pp = initPostProcessing(scene, camera, renderer);
  ensureBurstPool(scene);

  // Wire scroll zones to fire after reveal completes (FR-012)
  // MUST be registered BEFORE handleReducedMotion() — it dispatches
  // reveal-complete synchronously, so the listener must already exist.
  document.addEventListener('reveal-complete', () => {
    initScrollZones();
  }, { once: true });

  // Check reduced motion first — if active, skip all animations
  const isReduced = handleReducedMotion();

  if (!isReduced) {
    // Play reveal sequence
    const masterTl = playRevealSequence();

    if (masterTl) {
      initSkipIntro(masterTl);
      handleScrollDuringReveal(masterTl);
    }
  }

  // Auto-tier performance degradation (benchmarks 5s after reveal) — desktop only
  if (pp) {
    initAutoTierDegradation(pp.composer, pp.bloomPass, pp.customPass);
  }

  handlePanelScrollLock();

  // Hide static fallback since WebGL is active
  const fallback = document.getElementById('orb-fallback');
  if (fallback) fallback.style.display = 'none';
}
