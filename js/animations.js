// js/animations.js — Reveal sequence, scroll interactions, micro-interactions
import { scene, camera, renderer, orbGroup, starNodes, glassMaterial, nebulaLayers } from './scene.js';
import { PROJECTS, CONSTELLATION_ZONES } from './data.js';
import { setInitialFocus } from './interactions.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------------------------------------------------------------------------
// playRevealSequence — master GSAP timeline (~6500ms)
// ---------------------------------------------------------------------------
function playRevealSequence() {
  if (!gsap) return null;

  // Signal that reveal is active (interactions.js defers initial focus)
  window.__revealActive = true;

  const tl = gsap.timeline({
    onComplete: () => {
      window.__revealActive = false;
      // Dispatch reveal-complete event for performance.js auto-tier benchmark
      document.dispatchEvent(new CustomEvent('reveal-complete'));
      // After reveal: discoverability affordance with 2s delay
      gsap.delayedCall(2, playDiscoverabilityAffordance);
      // Set initial focus to first nav button
      setInitialFocus();
    }
  });

  // -----------------------------------------------------------------------
  // Set initial hidden states BEFORE animating
  // -----------------------------------------------------------------------
  const corners = document.querySelectorAll('.frame__corner');
  const edges = document.querySelectorAll('.frame__edge');
  const gauges = document.querySelectorAll('.frame__gauge');
  const headerBand = document.querySelector('.frame__header-band');
  const runeBand = document.querySelector('.frame__rune-band');
  const statusLines = document.querySelectorAll('.status-line');
  const cmdText = document.querySelector('.cmd-text');
  const navButtons = document.querySelectorAll('#constellation-nav button');
  const navLabel = document.querySelector('#constellation-nav .hud-label');
  const statusLabel = document.querySelector('#status-panel .hud-label');

  // Frame corners — hidden and displaced
  gsap.set(corners, { opacity: 0 });
  gsap.set('.frame__corner--tl', { x: -60, y: -60 });
  gsap.set('.frame__corner--tr', { x: 60, y: -60 });
  gsap.set('.frame__corner--bl', { x: -60, y: 60 });
  gsap.set('.frame__corner--br', { x: 60, y: 60 });

  // Frame edges — scale from 0
  gsap.set('.frame__edge--top, .frame__edge--bottom', { scaleX: 0 });
  gsap.set('.frame__edge--left, .frame__edge--right', { scaleY: 0 });

  // Frame details
  gsap.set(gauges, { scale: 0, opacity: 0 });
  gsap.set(runeBand, { opacity: 0 });
  gsap.set(headerBand, { opacity: 0, y: -10 });

  // Status and nav labels
  gsap.set(statusLines, { opacity: 0, x: 10 });
  gsap.set(navButtons, { opacity: 0, x: -10 });
  gsap.set([navLabel, statusLabel], { opacity: 0 });

  // Command line — clear text
  if (cmdText) cmdText.textContent = '';

  // 3D scene — hide materials initially
  if (glassMaterial) {
    glassMaterial.opacity = 0;
  }
  // Rim material (orbGroup child 1)
  const rimMesh = orbGroup ? orbGroup.children[1] : null;
  if (rimMesh && rimMesh.material) {
    rimMesh.material.opacity = 0;
  }
  // Nebula layers hidden
  if (nebulaLayers) {
    nebulaLayers.forEach(layer => {
      layer.material.opacity = 0;
      layer.scale.set(0.3, 0.3, 0.3);
    });
  }
  // Stars hidden
  if (starNodes) {
    starNodes.forEach(sprite => {
      sprite.scale.set(0, 0, 0);
      sprite.material.opacity = 0;
    });
  }
  // Camera starts further back
  if (camera) {
    camera.position.z = 8;
  }

  // -----------------------------------------------------------------------
  // Phase 1 (0–1600ms): Frame Assembly
  // -----------------------------------------------------------------------
  // Corners slide in with stagger
  tl.to(corners, {
    opacity: 1,
    duration: 0.5,
    stagger: 0.1,
    ease: 'expo.out'
  }, 0);

  tl.to('.frame__corner--tl', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0);
  tl.to('.frame__corner--tr', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0.1);
  tl.to('.frame__corner--bl', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0.2);
  tl.to('.frame__corner--br', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0.3);

  // Edges scale in
  tl.to('.frame__edge--top, .frame__edge--bottom', {
    scaleX: 1, duration: 0.5, ease: 'back.out(1.4)'
  }, 0.4);
  tl.to('.frame__edge--left, .frame__edge--right', {
    scaleY: 1, duration: 0.5, ease: 'back.out(1.4)'
  }, 0.5);

  // Frame details pop in (gauges, rune band, header)
  tl.to(gauges, {
    scale: 1, opacity: 1, duration: 0.4,
    ease: 'back.out(2)', stagger: 0.1
  }, 0.8);

  tl.to(runeBand, { opacity: 0.7, duration: 0.4, ease: 'power2.out' }, 1.0);
  tl.to(headerBand, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.0);

  // -----------------------------------------------------------------------
  // Phase 2 (1600–3800ms): Console powers up
  // -----------------------------------------------------------------------
  // Gauge needle animation (rotate from -135deg to resting position)
  tl.to('.frame__gauge--left::after', {
    rotation: -30, duration: 0.8, ease: 'elastic.out(1, 0.4)'
  }, 1.6);
  // We animate actual gauge pseudo-elements via a proxy approach
  // Since pseudo-elements can't be directly animated, animate the gauge itself
  tl.fromTo('.frame__gauge--left', {
    '--needle-angle': '-135deg'
  }, {
    '--needle-angle': '-30deg',
    duration: 0.8,
    ease: 'elastic.out(1, 0.4)'
  }, 1.6);
  tl.fromTo('.frame__gauge--right', {
    '--needle-angle': '-135deg'
  }, {
    '--needle-angle': '15deg',
    duration: 0.8,
    ease: 'elastic.out(1, 0.4)'
  }, 1.8);

  // Command line typewriter sequence
  const cliSequence = [
    { text: 'reveal universe', delay: 1.6 },
    { text: 'calibrating orb...', delay: 2.6 },
    { text: 'orb ignition sequence active', delay: 3.2 }
  ];

  cliSequence.forEach((cmd) => {
    tl.to(cmdText, {
      duration: cmd.text.length * 0.05,
      text: { value: cmd.text, delimiter: '' },
      ease: 'none'
    }, cmd.delay);
  });

  // Status panel text fade in with stagger
  tl.to(statusLines, {
    opacity: 1, x: 0, duration: 0.3,
    stagger: 0.15, ease: 'power2.out'
  }, 2.0);

  tl.to([navLabel, statusLabel], {
    opacity: 1, duration: 0.3, ease: 'power2.out'
  }, 2.0);

  // -----------------------------------------------------------------------
  // Phase 3 (3800–6500ms): Orb ignition
  // -----------------------------------------------------------------------
  // Glass material fade in
  if (glassMaterial) {
    tl.to(glassMaterial, {
      opacity: 0.15, duration: 0.6, ease: 'power2.out'
    }, 3.8);
  }

  // Rim material fade in
  if (rimMesh && rimMesh.material) {
    tl.to(rimMesh.material, {
      opacity: 0.12, duration: 0.6, ease: 'power2.out'
    }, 3.8);
  }

  // White flash (80ms spike)
  if (glassMaterial) {
    tl.to(glassMaterial, {
      opacity: 0.5, duration: 0.04, ease: 'power4.in'
    }, 4.0);
    tl.to(glassMaterial, {
      opacity: 0.15, duration: 0.12, ease: 'power2.out'
    }, 4.04);
  }

  // Nebula layers bloom outward
  if (nebulaLayers) {
    nebulaLayers.forEach((layer, i) => {
      tl.to(layer.material, {
        opacity: 0.7 + i * 0.03,
        duration: 0.8,
        ease: 'sine.inOut'
      }, 4.1 + i * 0.15);
      tl.to(layer.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.0,
        ease: 'power2.out'
      }, 4.1 + i * 0.15);
    });
  }

  // Stars stagger in (random order)
  if (starNodes && starNodes.length > 0) {
    const shuffledStars = gsap.utils.shuffle([...starNodes]);
    shuffledStars.forEach((sprite, i) => {
      const baseScale = sprite.userData.baseScale;
      tl.to(sprite.scale, {
        x: baseScale, y: baseScale, z: baseScale,
        duration: 0.4,
        ease: 'back.out(2.5)'
      }, 4.8 + i * 0.15);
      tl.to(sprite.material, {
        opacity: 1, duration: 0.3, ease: 'power2.out'
      }, 4.8 + i * 0.15);
    });
  }

  // Camera zoom in
  if (camera) {
    tl.to(camera.position, {
      z: 4.5, duration: 1.5, ease: 'power2.inOut'
    }, 4.2);
  }

  // Nav buttons stagger fade in
  tl.to(navButtons, {
    opacity: 1, x: 0, duration: 0.3,
    stagger: 0.08, ease: 'power2.out'
  }, 5.2);

  return tl;
}

// ---------------------------------------------------------------------------
// playDiscoverabilityAffordance — sonar pulse + CLI prompt
// ---------------------------------------------------------------------------
function playDiscoverabilityAffordance() {
  if (!gsap || !starNodes) return;
  if (prefersReducedMotion.matches) return;

  const cmdText = document.querySelector('.cmd-text');
  const statusLines = document.querySelectorAll('.status-line');
  const phaseIndicator = document.querySelector('.phase-indicator');

  // Sonar pulse each star
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

  // Command line types discovery message
  if (cmdText) {
    gsap.to(cmdText, {
      duration: 1.5,
      delay: 0.5,
      text: { value: '7 anomalies detected. investigate?', delimiter: '' },
      ease: 'none'
    });
  }

  // Status panel arcane readout
  if (phaseIndicator) {
    gsap.to(phaseIndicator, {
      duration: 0.01,
      delay: 0.8,
      onComplete: () => { phaseIndicator.textContent = 'SCANNING'; }
    });
    gsap.to(phaseIndicator, {
      duration: 0.01,
      delay: 3.5,
      onComplete: () => { phaseIndicator.textContent = 'READY'; }
    });
  }
}

// ---------------------------------------------------------------------------
// initSkipIntro — skip button + S key shortcut
// ---------------------------------------------------------------------------
function initSkipIntro(masterTimeline) {
  if (!gsap || !masterTimeline) return;

  const skipBtn = document.createElement('button');
  skipBtn.textContent = 'Skip';
  skipBtn.className = 'skip-intro-btn';
  skipBtn.setAttribute('aria-label', 'Skip intro animation');
  skipBtn.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:200;' +
    'padding:8px 20px;font-family:var(--font-mono);font-size:13px;' +
    'color:var(--color-frame-bg,#0D0B09);cursor:pointer;border:none;border-radius:4px;' +
    'background:linear-gradient(180deg,#C8A84B 0%,#8B6914 100%);' +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 2px 6px rgba(0,0,0,0.5);' +
    'opacity:0;pointer-events:none;';

  document.body.appendChild(skipBtn);

  // Fade in at t=500ms
  gsap.to(skipBtn, {
    opacity: 1, duration: 0.3, delay: 0.5,
    onStart: () => { skipBtn.style.pointerEvents = 'auto'; }
  });

  // Auto-fade after 3 seconds
  const fadeOutTween = gsap.to(skipBtn, {
    opacity: 0, duration: 0.5, delay: 3.5,
    onComplete: removeSkip
  });

  function doSkip() {
    masterTimeline.progress(1);
    removeSkip();
  }

  function removeSkip() {
    skipBtn.style.pointerEvents = 'none';
    if (skipBtn.parentNode) {
      gsap.to(skipBtn, {
        opacity: 0, duration: 0.2,
        onComplete: () => skipBtn.remove()
      });
    }
    document.removeEventListener('keydown', onKeySkip);
  }

  skipBtn.addEventListener('click', doSkip);

  function onKeySkip(e) {
    if (e.key === 's' || e.key === 'S') {
      // Don't skip if typing in an input or overlay is open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const overlay = document.getElementById('project-overlay');
      if (overlay && !overlay.hasAttribute('hidden')) return;
      doSkip();
    }
  }
  document.addEventListener('keydown', onKeySkip);

  // Store original onComplete to chain
  const originalOnComplete = masterTimeline.eventCallback('onComplete');

  // If timeline completes naturally, remove skip button
  masterTimeline.eventCallback('onComplete', () => {
    fadeOutTween.kill();
    removeSkip();
    // Fire original onComplete
    if (typeof originalOnComplete === 'function') {
      originalOnComplete();
    }
  });
}

// ---------------------------------------------------------------------------
// initScrollInteractions — ScrollTrigger-driven exploration
// ---------------------------------------------------------------------------
function initScrollInteractions() {
  if (!gsap || !ScrollTrigger) return;
  if (!orbGroup || !camera) return;

  gsap.registerPlugin(ScrollTrigger);

  // Allow body to scroll
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';

  // Create scroll driver element
  let scrollDriver = document.getElementById('scroll-driver');
  if (!scrollDriver) {
    scrollDriver = document.createElement('div');
    scrollDriver.id = 'scroll-driver';
    scrollDriver.style.cssText = `height:${window.innerHeight + 300}px;width:100%;position:relative;pointer-events:none;`;
    scrollDriver.setAttribute('aria-hidden', 'true');
    document.body.appendChild(scrollDriver);
  }

  // Proxy object for scrubbed values
  const proxy = { orbRotY: 0, cameraZ: 4.5, paletteShift: 0 };

  // Main scroll timeline
  const scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollDriver,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      pin: '#app-shell',
      anticipatePin: 1
    }
  });

  // Drive orb rotation and camera zoom
  scrollTl.to(proxy, {
    orbRotY: 0.44,
    cameraZ: 3.7,
    duration: 1,
    ease: 'none',
    onUpdate: () => {
      if (orbGroup) orbGroup.rotation.y = proxy.orbRotY;
      if (camera) camera.position.z = proxy.cameraZ;
    }
  });

  // Constellation zone sub-triggers
  const cmdText = document.querySelector('.cmd-text');
  const phaseIndicator = document.querySelector('.phase-indicator');

  const zoneMessages = [
    { cmd: 'scanning arcane tools constellation...', phase: 'ZONE 1' },
    { cmd: 'interfacing with intelligence matrix...', phase: 'ZONE 2' },
    { cmd: 'triangulating outpost network...', phase: 'ZONE 3' }
  ];

  CONSTELLATION_ZONES.forEach((zone, i) => {
    ScrollTrigger.create({
      trigger: scrollDriver,
      start: () => (zone.scrollStart * 100) + '% top',
      end: () => (zone.scrollEnd * 100) + '% top',
      onEnter: () => {
        brightenZoneStars(zone.projectIds, true);
        if (cmdText) cmdText.textContent = zoneMessages[i].cmd;
        if (phaseIndicator) phaseIndicator.textContent = zoneMessages[i].phase;
      },
      onLeaveBack: () => {
        brightenZoneStars(zone.projectIds, false);
        if (i === 0) {
          if (cmdText) cmdText.textContent = 'select a constellation to begin';
          if (phaseIndicator) phaseIndicator.textContent = 'READY';
        } else {
          if (cmdText) cmdText.textContent = zoneMessages[i - 1].cmd;
          if (phaseIndicator) phaseIndicator.textContent = zoneMessages[i - 1].phase;
        }
      }
    });
  });

  // End zone (90-100%): all stars equal brightness
  ScrollTrigger.create({
    trigger: scrollDriver,
    start: '90% top',
    end: '100% top',
    onEnter: () => {
      // All stars equal brightness
      if (starNodes) {
        starNodes.forEach(sprite => {
          const base = sprite.userData.baseScale;
          gsap.to(sprite.scale, { x: base, y: base, z: base, duration: 0.4, ease: 'power2.out' });
        });
      }
      if (cmdText) cmdText.textContent = 'universe revealed. select a constellation to begin';
      if (phaseIndicator) phaseIndicator.textContent = 'COMPLETE';
    },
    onLeaveBack: () => {
      // Revert to Zone 3
      const lastZone = CONSTELLATION_ZONES[CONSTELLATION_ZONES.length - 1];
      brightenZoneStars(lastZone.projectIds, true);
      if (cmdText) cmdText.textContent = zoneMessages[zoneMessages.length - 1].cmd;
      if (phaseIndicator) phaseIndicator.textContent = zoneMessages[zoneMessages.length - 1].phase;
    }
  });
}

// ---------------------------------------------------------------------------
// brightenZoneStars — scale up zone stars, dim others
// ---------------------------------------------------------------------------
function brightenZoneStars(projectIds, brighten) {
  if (!starNodes || !gsap) return;

  starNodes.forEach(sprite => {
    const base = sprite.userData.baseScale;
    const isInZone = projectIds.includes(sprite.userData.project.id);

    if (brighten) {
      const targetScale = isInZone ? base * 1.3 : base * 0.7;
      const targetOpacity = isInZone ? 1 : 0.4;
      gsap.to(sprite.scale, {
        x: targetScale, y: targetScale, z: targetScale,
        duration: 0.4, ease: 'power2.out'
      });
      gsap.to(sprite.material, {
        opacity: targetOpacity, duration: 0.4, ease: 'power2.out'
      });
    } else {
      // Reset to base
      gsap.to(sprite.scale, {
        x: base, y: base, z: base,
        duration: 0.4, ease: 'power2.out'
      });
      gsap.to(sprite.material, {
        opacity: 1, duration: 0.4, ease: 'power2.out'
      });
    }
  });
}

// ---------------------------------------------------------------------------
// handleReducedMotion — respect prefers-reduced-motion
// ---------------------------------------------------------------------------
function handleReducedMotion() {
  function applyReducedMotion(isReduced) {
    if (!isReduced) return;

    // Skip reveal: set everything to final state immediately
    const corners = document.querySelectorAll('.frame__corner');
    const edges = document.querySelectorAll('.frame__edge');
    const gauges = document.querySelectorAll('.frame__gauge');
    const headerBand = document.querySelector('.frame__header-band');
    const runeBand = document.querySelector('.frame__rune-band');
    const statusLines = document.querySelectorAll('.status-line');
    const navButtons = document.querySelectorAll('#constellation-nav button');
    const navLabel = document.querySelector('#constellation-nav .hud-label');
    const statusLabel = document.querySelector('#status-panel .hud-label');
    const cmdText = document.querySelector('.cmd-text');
    const phaseIndicator = document.querySelector('.phase-indicator');

    // All frame elements visible at final positions
    if (gsap) {
      gsap.set(corners, { opacity: 1, x: 0, y: 0 });
      gsap.set(edges, { scaleX: 1, scaleY: 1 });
      gsap.set(gauges, { scale: 1, opacity: 1 });
      gsap.set(runeBand, { opacity: 0.7 });
      gsap.set(headerBand, { opacity: 1, y: 0 });
      gsap.set(statusLines, { opacity: 1, x: 0 });
      gsap.set(navButtons, { opacity: 1, x: 0 });
      gsap.set([navLabel, statusLabel], { opacity: 1 });
    }

    // Command line shows final text
    if (cmdText) cmdText.textContent = 'select a constellation to begin';
    if (phaseIndicator) phaseIndicator.textContent = 'READY';

    // 3D scene: set final state
    if (glassMaterial) glassMaterial.opacity = 0.15;
    if (orbGroup && orbGroup.children[1] && orbGroup.children[1].material) {
      orbGroup.children[1].material.opacity = 0.12;
    }
    if (nebulaLayers) {
      nebulaLayers.forEach(layer => {
        layer.material.opacity = 0.7;
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

    // Disable all ScrollTrigger instances
    if (ScrollTrigger) {
      ScrollTrigger.getAll().forEach(st => st.kill());
    }

    // Mark reveal as done
    window.__revealActive = false;
    setInitialFocus();
  }

  // Apply immediately if already set
  if (prefersReducedMotion.matches) {
    applyReducedMotion(true);
  }

  // Listen for runtime changes
  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      applyReducedMotion(true);
    }
  });

  return prefersReducedMotion.matches;
}

// ---------------------------------------------------------------------------
// handleScrollDuringReveal — skip reveal if user scrolls
// ---------------------------------------------------------------------------
function handleScrollDuringReveal(masterTimeline) {
  if (!masterTimeline) return;

  function onScroll() {
    if (masterTimeline.isActive()) {
      masterTimeline.progress(1);
    }
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('wheel', onScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onScroll, { passive: true });

  // Clean up when timeline finishes naturally — chain with existing callback
  const prevOnComplete = masterTimeline.eventCallback('onComplete');
  masterTimeline.eventCallback('onComplete', () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('wheel', onScroll);
    if (typeof prevOnComplete === 'function') {
      prevOnComplete();
    }
  });
}

// ---------------------------------------------------------------------------
// handlePanelScrollLock — disable scroll when panel open
// ---------------------------------------------------------------------------
function handlePanelScrollLock() {
  document.addEventListener('panel-open', () => {
    if (ScrollTrigger) {
      ScrollTrigger.getAll().forEach(st => st.disable());
    }
  });

  document.addEventListener('panel-close', () => {
    if (ScrollTrigger) {
      ScrollTrigger.getAll().forEach(st => st.enable());
    }
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export {
  playRevealSequence,
  initScrollInteractions,
  handleReducedMotion,
  initSkipIntro,
  handleScrollDuringReveal,
  handlePanelScrollLock
};
