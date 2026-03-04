// js/app.js — Main entry point
import { initScene, scene, camera, renderer } from './scene.js';
import { initInteractions } from './interactions.js';
import {
  playRevealSequence,
  initScrollInteractions,
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

// Initialize interactions (panel, keyboard nav) — works even without WebGL
initInteractions();

// Initialize the 3D scene
const sceneReady = initScene();

if (sceneReady) {
  // Initialize post-processing pipeline (bloom, chromatic aberration, vignette)
  const pp = initPostProcessing(scene, camera, renderer);
  ensureBurstPool(scene);

  // Check reduced motion first — if active, skip all animations
  const isReduced = handleReducedMotion();

  if (!isReduced) {
    // Play reveal sequence
    const masterTl = playRevealSequence();

    if (masterTl) {
      // Wire skip intro
      initSkipIntro(masterTl);

      // Handle scroll during reveal (skips to end)
      handleScrollDuringReveal(masterTl);
    }

    // Set up scroll interactions (after reveal completes, ScrollTrigger activates)
    initScrollInteractions();
  }

  // Auto-tier performance degradation (benchmarks 5s after reveal)
  if (pp) {
    initAutoTierDegradation(pp.composer, pp.bloomPass, pp.customPass);
  }

  // Panel scroll lock (works in both reduced and normal modes)
  handlePanelScrollLock();

  // Hide static fallback since WebGL is active
  const fallback = document.getElementById('orb-fallback');
  if (fallback) fallback.style.display = 'none';
}
