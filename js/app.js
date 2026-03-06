// js/app.js — Main entry point
import { initScene, scene, camera, renderer, starNodes, nebulaLayers, nebulaGroup } from './scene.js';
import { initInteractions, setInitialFocus } from './interactions.js';
import { playTerminalScan } from './terminal.js';
import {
  playRevealSequence,
  initSkipIntro
} from './animations.js';
import { init as initScrollZones } from './scroll-zones.js';
import { init as initConstellationLines, playIntroShowcase, killShowcase } from './constellation-lines.js';
import { init as initSidebarHieroglyphs, setHighContrast, getMaterials } from './sidebar-hieroglyphs.js';
import {
  initPostProcessing,
  ensureBurstPool,
  initAutoTierDegradation,
  initGPUDetection,
  getCurrentTier
} from './performance.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');

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
    if (phaseIndicator) phaseIndicator.textContent = 'GOLDEN RATIO LOCKED';

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
      starNodes.forEach(node => {
        if (node.material) {
          const base = node.userData.baseScale;
          node.scale.set(base, base, base);
          node.material.opacity = 1;
        } else if (node.children) {
          node.scale.set(1, 1, 1);
          const isPaused = node.userData.project && node.userData.project.status === 'paused';
          node.children.forEach(child => {
            if (child.material && child.userData && child.userData.isSubPoint) {
              child.material.opacity = isPaused ? 0.20 : 1;
            }
          });
        }
      });
    }
    if (camera) camera.position.z = 4.5;

    // Instant glyph reveal under reduced motion (T050)
    const mats = getMaterials();
    if (mats.leftMaterial) mats.leftMaterial.uniforms.uRevealProgress.value = 1.0;
    if (mats.rightMaterial) mats.rightMaterial.uniforms.uRevealProgress.value = 1.0;

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
// handleHighContrast — respect prefers-contrast:more (T024, FR-016)
// High contrast takes precedence: hides WebGL sidebar overlay entirely.
// ---------------------------------------------------------------------------
function handleHighContrast() {
  if (prefersHighContrast.matches) {
    setHighContrast(true);
  }

  prefersHighContrast.addEventListener('change', (e) => {
    setHighContrast(e.matches);
  });
}

// ---------------------------------------------------------------------------
// initBronzeToolFlash — pulse frame tools on zone-change / terminal-scan
// ---------------------------------------------------------------------------
function initBronzeToolFlash() {
  if (!gsap) return;
  const tools = document.querySelectorAll('.frame-tool');
  const compass = document.querySelectorAll('.nav-compass');
  const targets = [...tools, ...compass];
  if (!targets.length) return;

  function flash() {
    targets.forEach(el => {
      const baseOpacity = el.classList.contains('nav-compass') ? 0.2 : 0.12;
      gsap.killTweensOf(el, 'opacity,filter');
      if (prefersReducedMotion.matches) {
        gsap.set(el, { opacity: 0.35, filter: 'brightness(1.8) drop-shadow(0 0 12px rgba(200,168,75,0.5))' });
        gsap.delayedCall(0.1, () => gsap.set(el, { opacity: baseOpacity, filter: 'none' }));
      } else {
        gsap.fromTo(el,
          { opacity: baseOpacity, filter: 'brightness(1) drop-shadow(0 0 0 rgba(200,168,75,0))' },
          { opacity: 0.35, filter: 'brightness(1.8) drop-shadow(0 0 12px rgba(200,168,75,0.5))',
            duration: 0.4, ease: 'power2.out',
            yoyo: true, repeat: 1 });
      }
    });
  }

  document.addEventListener('zone-change', flash);
  document.addEventListener('terminal-scan-complete', flash);
}

// ---------------------------------------------------------------------------
// initOddBot — rotation state machine for the Odd Bot element (T040)
// ---------------------------------------------------------------------------
function initOddBot() {
  if (!gsap) return;
  const center = document.querySelector('.odd-bot--center');
  const left   = document.querySelector('.odd-bot--left');
  const right  = document.querySelector('.odd-bot--right');
  if (!center) return;

  const flanks = [left, right].filter(Boolean);
  const allBots = [center, ...flanks];

  const ZONE_ROTATIONS = { '-1': 135, 0: 90, 1: 180, 2: 270 };
  const reduced = () => prefersReducedMotion.matches;
  let holdReturn = null;

  function cancelHoldReturn() {
    if (holdReturn) { holdReturn.kill(); holdReturn = null; }
    allBots.forEach(el => gsap.killTweensOf(el));
  }

  const RIGHT_OFFSET = 180;

  function applyRotation(targetDeg, animate) {
    const leftDeg  = -targetDeg;
    const rightDeg = -targetDeg + RIGHT_OFFSET;
    const ease = 'elastic.out(1, 0.5)';
    if (!animate || reduced()) {
      gsap.set(center, { rotation: targetDeg });
      if (left)  gsap.set(left,  { rotation: leftDeg });
      if (right) gsap.set(right, { rotation: rightDeg });
    } else {
      gsap.to(center, { rotation: targetDeg, duration: 0.6, ease });
      if (left)  gsap.to(left,  { rotation: leftDeg, duration: 0.6, ease });
      if (right) gsap.to(right, { rotation: rightDeg, duration: 0.6, ease });
    }
  }

  document.addEventListener('zone-change', (e) => {
    const targetDeg = ZONE_ROTATIONS[e.detail.zoneIndex] ?? 135;
    cancelHoldReturn();
    applyRotation(targetDeg, true);
  });

  document.addEventListener('terminal-scan-complete', () => {
    cancelHoldReturn();
    applyRotation(270, true);
    holdReturn = gsap.delayedCall(2, () => {
      applyRotation(135, true);
      holdReturn = null;
    });
  });
}

// ---------------------------------------------------------------------------
// handleScrollDuringReveal — skip reveal if user scrolls (moved from animations.js)
// ---------------------------------------------------------------------------
function handleScrollDuringReveal(masterTimeline) {
  if (!masterTimeline) return;
  function onWheel() {
    if (masterTimeline.isActive()) masterTimeline.progress(1);
    killShowcase();
    window.removeEventListener('wheel', onWheel);
  }
  window.addEventListener('wheel', onWheel, { passive: true });
  const prevOnComplete = masterTimeline.eventCallback('onComplete');
  masterTimeline.eventCallback('onComplete', () => {
    window.removeEventListener('wheel', onWheel);
    if (typeof prevOnComplete === 'function') prevOnComplete();
  });
}

// ---------------------------------------------------------------------------
// playDiscoverabilityAffordance — sonar pulse + CLI prompt
// ---------------------------------------------------------------------------
function playDiscoverabilityAffordance() {
  if (!gsap || !starNodes) return;
  if (prefersReducedMotion.matches) return;

  const cmdText = document.querySelector('.cmd-text');
  const phaseIndicator = document.querySelector('.phase-indicator');
  const staggerDelay = 0.2 * 7 / starNodes.length; // Scale delay for constant total duration

  starNodes.forEach((node, i) => {
    if (node.userData.project && node.userData.project.status === 'paused') return;
    if (node.material) {
      const baseScale = node.userData.baseScale;
      gsap.to(node.scale, {
        x: baseScale * 1.5, y: baseScale * 1.5, z: baseScale * 1.5,
        duration: 0.4, delay: i * staggerDelay, ease: 'sine.out', yoyo: true, repeat: 1
      });
    } else if (node.children) {
      // Cluster group — pulse the group scale
      gsap.to(node.scale, {
        x: 1.3, y: 1.3, z: 1.3,
        duration: 0.4, delay: i * staggerDelay, ease: 'sine.out', yoyo: true, repeat: 1
      });
    }
  });

  if (cmdText) {
    gsap.to(cmdText, {
      duration: 2.15,
      delay: 0.5,
      text: { value: 'Force multipliers for small businesses...', delimiter: '' },
      ease: 'none'
    });
  }

  if (phaseIndicator && phaseIndicator.textContent !== 'GOLDEN RATIO LOCKED') {
    gsap.to(phaseIndicator, {
      duration: 0.01,
      delay: 0.8,
      onComplete: () => {
        if (phaseIndicator.textContent !== 'GOLDEN RATIO LOCKED') {
          phaseIndicator.textContent = 'phi LOCKED';
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
  // T051: Detect integrated GPU and default to Tier 2 if found
  initGPUDetection(renderer);

  // Initialize post-processing pipeline (T016: returns null on mobile)
  const pp = initPostProcessing(scene, camera, renderer);
  ensureBurstPool(scene);

  // Initialize sidebar hieroglyph etching overlays (separate overlay pass)
  initSidebarHieroglyphs({ renderer });

  // High contrast: hide WebGL sidebar overlay when prefers-contrast:more (T024)
  handleHighContrast();

  // Initialize Odd Bot rotation state machine (T040)
  initOddBot();

  // Bronze tool flash on zone change / terminal scan
  initBronzeToolFlash();

  // Wire scroll zones to fire after reveal completes (FR-012)
  // MUST be registered BEFORE handleReducedMotion() — it dispatches
  // reveal-complete synchronously, so the listener must already exist.
  document.addEventListener('reveal-complete', () => {
    initScrollZones({ starNodes, nebulaLayers, nebulaGroup, getCurrentTier });
    initConstellationLines();
    // T037-T040: Intro showcase — flash zone constellations after reveal
    const scTl = playIntroShowcase();
    if (scTl) {
      // Kill showcase if user scrolls or zone-change fires (T039)
      document.addEventListener('zone-change', () => killShowcase(), { once: true });
    }
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
