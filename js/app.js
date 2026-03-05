// js/app.js — Main entry point
import { initScene, scene, camera, renderer, starNodes, nebulaLayers, nebulaGroup } from './scene.js';
import { initInteractions, setInitialFocus } from './interactions.js';
import { playTerminalScan } from './terminal.js';
import {
  playRevealSequence,
  initSkipIntro,
  handleScrollDuringReveal
} from './animations.js';
import { init as initScrollZones } from './scroll-zones.js';
import { init as initConstellationLines } from './constellation-lines.js';
import { init as initSidebarHieroglyphs } from './sidebar-hieroglyphs.js';
import {
  initPostProcessing,
  ensureBurstPool,
  initAutoTierDegradation,
  getCurrentTier
} from './performance.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------------------------------------------------------------------------
// handleReducedMotion — respect prefers-reduced-motion
// ---------------------------------------------------------------------------
function handleReducedMotion() {
  function applyReducedMotion(isReduced) {
    if (!isReduced) return;

    const corners = document.querySelectorAll('.frame__corner');
    const edges = document.querySelectorAll('.frame__edge');
    const gauges = document.querySelectorAll('.frame__gauge');
    const headerBand = document.querySelector('.frame__header-band');
    const runeBand = document.querySelector('.frame__greek-key');
    const scanLines = document.querySelectorAll('.scan-line');
    const statusLines = document.querySelectorAll('.status-line');
    const navButtons = document.querySelectorAll('#constellation-nav button');
    const navLabel = document.querySelector('#constellation-nav .hud-label');
    const statusLabel = document.querySelector('#status-panel .hud-label');
    const cmdText = document.querySelector('.cmd-text');
    const phaseIndicator = document.querySelector('.phase-indicator');

    if (gsap) {
      gsap.set(corners, { opacity: 1, x: 0, y: 0 });
      gsap.set(edges, { scaleX: 1, scaleY: 1 });
      gsap.set(gauges, { scale: 1, opacity: 1 });
      gsap.set(runeBand, { opacity: 0.9 });
      gsap.set(headerBand, { opacity: 1, y: 0 });
      gsap.set(scanLines, { opacity: 1, x: 0 });
      gsap.set(statusLines, { opacity: 1, x: 0 });
      gsap.set(navButtons, { opacity: 1, x: 0 });
      gsap.set([navLabel, statusLabel], { opacity: 1 });
    }

    if (cmdText) cmdText.textContent = 'Force multipliers for small businesses...';
    if (phaseIndicator) phaseIndicator.textContent = 'PORTFOLIO READY';

    // Show terminal scan final state under reduced motion
    playTerminalScan();

    // No orb glass to set opacity on — just nebula and stars
    if (nebulaLayers) {
      nebulaLayers.forEach(layer => {
        layer.material.uniforms.uOpacity.value = 0.7;
        layer.scale.set(1, 1, 1);
      });
    }
    if (starNodes) {
      starNodes.forEach(sprite => {
        const base = sprite.userData.baseScale;
        sprite.scale.set(base, base, base);
        sprite.material.opacity = 1;
      });
    }
    if (camera) camera.position.z = 4.5;

    if (ScrollTrigger) {
      ScrollTrigger.getAll().forEach(st => st.kill());
    }

    window.__revealActive = false;
    document.dispatchEvent(new CustomEvent('reveal-complete'));
    setInitialFocus();
  }

  if (prefersReducedMotion.matches) {
    applyReducedMotion(true);
  }

  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      applyReducedMotion(true);
    }
  });

  return prefersReducedMotion.matches;
}

// ---------------------------------------------------------------------------
// playDiscoverabilityAffordance — sonar pulse + CLI prompt
// ---------------------------------------------------------------------------
function playDiscoverabilityAffordance() {
  if (!gsap || !starNodes) return;
  if (prefersReducedMotion.matches) return;

  const cmdText = document.querySelector('.cmd-text');
  const phaseIndicator = document.querySelector('.phase-indicator');

  starNodes.forEach((sprite, i) => {
    const baseScale = sprite.userData.baseScale;
    gsap.to(sprite.scale, {
      x: baseScale * 1.5,
      y: baseScale * 1.5,
      z: baseScale * 1.5,
      duration: 0.4,
      delay: i * 0.2,
      ease: 'sine.out',
      yoyo: true,
      repeat: 1
    });
  });

  if (cmdText) {
    gsap.to(cmdText, {
      duration: 2.15,
      delay: 0.5,
      text: { value: 'Force multipliers for small businesses...', delimiter: '' },
      ease: 'none'
    });
  }

  if (phaseIndicator && phaseIndicator.textContent !== 'PORTFOLIO READY') {
    gsap.to(phaseIndicator, {
      duration: 0.01,
      delay: 0.8,
      onComplete: () => {
        if (phaseIndicator.textContent !== 'PORTFOLIO READY') {
          phaseIndicator.textContent = 'PORTFOLIO';
        }
      }
    });
  }
}

// Initialize interactions (panel, keyboard nav, hamburger) — works even without WebGL
initInteractions();

// Initialize the 3D scene
const sceneReady = initScene();

if (sceneReady) {
  // Initialize post-processing pipeline (T016: returns null on mobile)
  const pp = initPostProcessing(scene, camera, renderer);
  ensureBurstPool(scene);

  // Initialize sidebar hieroglyph etching overlays (Phase 8, US1)
  initSidebarHieroglyphs({ scene, camera, renderer });

  // Wire scroll zones to fire after reveal completes (FR-012)
  // MUST be registered BEFORE handleReducedMotion() — it dispatches
  // reveal-complete synchronously, so the listener must already exist.
  document.addEventListener('reveal-complete', () => {
    initScrollZones({ starNodes, nebulaLayers, nebulaGroup, getCurrentTier });
    initConstellationLines();
  }, { once: true });

  // Wire discoverability affordance to fire 2s after reveal completes
  document.addEventListener('reveal-complete', () => {
    if (gsap) gsap.delayedCall(2, playDiscoverabilityAffordance);
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

  // Disable scroll when panel open, re-enable on close
  document.addEventListener('panel-open', () => {
    if (ScrollTrigger) ScrollTrigger.getAll().forEach(st => st.disable());
  });
  document.addEventListener('panel-close', () => {
    if (ScrollTrigger) ScrollTrigger.getAll().forEach(st => st.enable());
  });

  // Hide static fallback since WebGL is active
  const fallback = document.getElementById('orb-fallback');
  if (fallback) fallback.style.display = 'none';
}
