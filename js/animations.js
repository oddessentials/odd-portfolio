// js/animations.js — Reveal sequence, scroll interactions, micro-interactions
import { scene, camera, renderer, orbGroup, starNodes, nebulaLayers, nebulaGroup } from './scene.js';
import { getCurrentTier } from './performance.js';
import { PROJECTS, CONSTELLATION_ZONES } from './data.js';
import { setInitialFocus } from './interactions.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)');

// Mobile detection
const isMobileView = () => window.innerWidth < 768;

// ---------------------------------------------------------------------------
// playRevealSequence — master GSAP timeline (T017: shorter on mobile)
// ---------------------------------------------------------------------------
function playRevealSequence() {
  if (!gsap) return null;

  window.__revealActive = true;

  const mobile = isMobileView();

  const tl = gsap.timeline({
    onComplete: () => {
      window.__revealActive = false;
      document.dispatchEvent(new CustomEvent('reveal-complete'));
      gsap.delayedCall(2, playDiscoverabilityAffordance);
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
  const runeBand = document.querySelector('.frame__greek-key');
  const scanLines = document.querySelectorAll('.scan-line');
  const statusLines = document.querySelectorAll('.status-line');
  const cmdText = document.querySelector('.cmd-text');
  const navButtons = document.querySelectorAll('#constellation-nav button');
  const navLabel = document.querySelector('#constellation-nav .hud-label');
  const statusLabel = document.querySelector('#status-panel .hud-label');

  // Frame elements — hidden and displaced
  gsap.set(corners, { opacity: 0 });
  gsap.set('.frame__corner--tl', { x: -60, y: -60 });
  gsap.set('.frame__corner--tr', { x: 60, y: -60 });
  gsap.set('.frame__corner--bl', { x: -60, y: 60 });
  gsap.set('.frame__corner--br', { x: 60, y: 60 });
  gsap.set('.frame__edge--top, .frame__edge--bottom', { scaleX: 0 });
  gsap.set('.frame__edge--left, .frame__edge--right', { scaleY: 0 });
  gsap.set(gauges, { scale: 0, opacity: 0 });
  gsap.set(runeBand, { opacity: 0 });
  gsap.set(headerBand, { opacity: 0, y: -10 });
  gsap.set(scanLines, { opacity: 0, x: 10 });
  gsap.set(statusLines, { opacity: 0, x: 10 });
  gsap.set(navButtons, { opacity: 0, x: -10 });
  gsap.set([navLabel, statusLabel], { opacity: 0 });

  if (cmdText) cmdText.textContent = '';

  // Nebula layers hidden
  if (nebulaLayers) {
    nebulaLayers.forEach(layer => {
      layer.material.uniforms.uOpacity.value = 0;
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
  // T017: Mobile reveal — simplified, shorter (~4s vs ~6.5s)
  // -----------------------------------------------------------------------
  if (mobile) {
    // Skip frame assembly on mobile (no sidebars visible)
    // Just show frame elements at final state
    gsap.set(corners, { opacity: 1, x: 0, y: 0 });
    gsap.set('.frame__edge--top, .frame__edge--bottom', { scaleX: 1 });
    gsap.set('.frame__edge--left, .frame__edge--right', { scaleY: 1 });
    gsap.set(gauges, { scale: 1, opacity: 1 });
    gsap.set(runeBand, { opacity: 0.7 });
    gsap.set(headerBand, { opacity: 1, y: 0 });
    gsap.set([navLabel, statusLabel], { opacity: 1 });
    gsap.set(scanLines, { opacity: 1, x: 0 });
    gsap.set(statusLines, { opacity: 1, x: 0 });
    gsap.set(navButtons, { opacity: 1, x: 0 });

    // Command line typewriter
    const cliSequence = [
      { text: 'initializing portfolio...', delay: 0 },
      { text: 'starfield online', delay: 0.8 }
    ];

    // Wire terminal scan for mobile at t=0.5
    tl.call(playTerminalScan, null, 0.5);
    cliSequence.forEach((cmd) => {
      tl.to(cmdText, {
        duration: cmd.text.length * 0.04,
        text: { value: cmd.text, delimiter: '' },
        ease: 'none'
      }, cmd.delay);
    });

    // Nebula bloom
    if (nebulaLayers) {
      nebulaLayers.forEach((layer, i) => {
        tl.to(layer.material.uniforms.uOpacity, {
          value: 0.7 + i * 0.03,
          duration: 0.6,
          ease: 'sine.inOut'
        }, 1.0 + i * 0.1);
        tl.to(layer.scale, {
          x: 1, y: 1, z: 1,
          duration: 0.8,
          ease: 'power2.out'
        }, 1.0 + i * 0.1);
      });
    }

    // Stars stagger in
    if (starNodes && starNodes.length > 0) {
      const shuffledStars = gsap.utils.shuffle([...starNodes]);
      shuffledStars.forEach((sprite, i) => {
        const baseScale = sprite.userData.baseScale;
        tl.to(sprite.scale, {
          x: baseScale, y: baseScale, z: baseScale,
          duration: 0.3,
          ease: 'back.out(2.5)'
        }, 2.0 + i * 0.1);
        tl.to(sprite.material, {
          opacity: 1, duration: 0.2, ease: 'power2.out'
        }, 2.0 + i * 0.1);
      });
    }

    // Camera zoom
    if (camera) {
      tl.to(camera.position, {
        z: 4.5, duration: 1.2, ease: 'power2.inOut'
      }, 1.5);
    }

    return tl;
  }

  // -----------------------------------------------------------------------
  // Desktop reveal — full sequence
  // -----------------------------------------------------------------------

  // Phase 1 (0-1600ms): Frame Assembly
  tl.to(corners, {
    opacity: 1, duration: 0.5, stagger: 0.1, ease: 'expo.out'
  }, 0);

  tl.to('.frame__corner--tl', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0);
  tl.to('.frame__corner--tr', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0.1);
  tl.to('.frame__corner--bl', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0.2);
  tl.to('.frame__corner--br', { x: 0, y: 0, duration: 0.6, ease: 'expo.out' }, 0.3);

  tl.to('.frame__edge--top, .frame__edge--bottom', {
    scaleX: 1, duration: 0.5, ease: 'back.out(1.4)'
  }, 0.4);
  tl.to('.frame__edge--left, .frame__edge--right', {
    scaleY: 1, duration: 0.5, ease: 'back.out(1.4)'
  }, 0.5);

  tl.to(gauges, {
    scale: 1, opacity: 1, duration: 0.4,
    ease: 'back.out(2)', stagger: 0.1
  }, 0.8);

  tl.to(runeBand, { opacity: 0.7, duration: 0.4, ease: 'power2.out' }, 1.0);
  tl.to(headerBand, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.0);

  // Phase 2 (1600-3800ms): Console powers up
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

  const cliSequence = [
    { text: 'initializing portfolio...', delay: 1.6 },
    { text: 'loading projects...', delay: 2.6 },
    { text: 'starfield online', delay: 3.2 }
  ];

  cliSequence.forEach((cmd) => {
    tl.to(cmdText, {
      duration: cmd.text.length * 0.05,
      text: { value: cmd.text, delimiter: '' },
      ease: 'none'
    }, cmd.delay);
  });

  tl.to(scanLines, {
    opacity: 1, x: 0, duration: 0.3,
    stagger: 0.15, ease: 'power2.out'
  }, 2.0);

  tl.to(statusLines, {
    opacity: 1, x: 0, duration: 0.3,
    stagger: 0.15, ease: 'power2.out'
  }, 2.0);

  tl.to([navLabel, statusLabel], {
    opacity: 1, duration: 0.3, ease: 'power2.out'
  }, 2.0);

  // Wire terminal scan at t=2.8 (after scan lines finish fade-in at t=2.75)
  tl.call(playTerminalScan, null, 2.8);

  // Phase 3 (3800-6500ms): Starfield ignition (no orb glass, just nebula + stars)
  // Nebula layers bloom outward
  if (nebulaLayers) {
    nebulaLayers.forEach((layer, i) => {
      tl.to(layer.material.uniforms.uOpacity, {
        value: 0.7 + i * 0.03,
        duration: 0.8,
        ease: 'sine.inOut'
      }, 3.8 + i * 0.15);
      tl.to(layer.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.0,
        ease: 'power2.out'
      }, 3.8 + i * 0.15);
    });
  }

  // Stars stagger in
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

// ---------------------------------------------------------------------------
// playTerminalScan — independent terminal loading animation (T013)
// ---------------------------------------------------------------------------
function playTerminalScan() {
  if (!gsap) return null;

  // Reduced motion: show final state immediately
  if (prefersReducedMotion.matches) {
    const scanLines = document.querySelectorAll('.scan-line');
    const loadingBarFill = document.querySelector('.loading-bar__fill');
    const loadingBar = document.querySelector('.loading-bar');
    const phaseIndicator = document.querySelector('.phase-indicator');

    if (scanLines[0]) scanLines[0].textContent = '7 systems nominal';
    if (scanLines[1]) scanLines[1].textContent = '[##########] 100%';
    if (scanLines[2]) scanLines[2].textContent = '';
    if (loadingBarFill) loadingBarFill.style.transform = 'scaleX(1)';
    if (loadingBar) loadingBar.setAttribute('aria-valuenow', '100');
    if (phaseIndicator) phaseIndicator.textContent = 'PORTFOLIO READY';

    document.dispatchEvent(new CustomEvent('terminal-scan-complete'));
    return null;
  }

  const scanLines = document.querySelectorAll('.scan-line');
  const loadingBarFill = document.querySelector('.loading-bar__fill');
  const loadingBar = document.querySelector('.loading-bar');
  const phaseIndicator = document.querySelector('.phase-indicator');
  const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

  const tl = gsap.timeline({
    onComplete: () => {
      document.dispatchEvent(new CustomEvent('terminal-scan-complete'));
    }
  });

  const percentages = [14, 28, 43, 57, 71, 86, 100];

  PROJECTS.forEach((project, i) => {
    const pct = percentages[i];
    const barStr = '[' + '#'.repeat(Math.round(pct / 10)) + '.'.repeat(10 - Math.round(pct / 10)) + '] ' + pct + '%';

    tl.to(scanLines[0] || {}, {
      duration: project.id.length * 0.033,
      text: { value: 'Scanning ' + project.id + '...', delimiter: '' },
      ease: 'none'
    }, i * 0.7);

    tl.call(() => {
      if (scanLines[1]) scanLines[1].textContent = barStr;
      if (loadingBarFill) loadingBarFill.style.transform = 'scaleX(' + (pct / 100) + ')';
      if (loadingBar) loadingBar.setAttribute('aria-valuenow', String(pct));
    }, null, i * 0.7 + 0.3);
  });

  // Final state
  const finalTime = PROJECTS.length * 0.7 + 0.5;
  tl.to(scanLines[0] || {}, {
    duration: 0.5,
    text: { value: '7 systems nominal', delimiter: '' },
    ease: 'none'
  }, finalTime);

  tl.call(() => {
    if (scanLines[1]) scanLines[1].textContent = '[##########] 100%';
  }, null, finalTime);

  // Phase indicator: PORTFOLIO READY + glow flash
  tl.call(() => {
    if (phaseIndicator) {
      phaseIndicator.textContent = 'PORTFOLIO READY';
      if (!prefersHighContrast) {
        gsap.fromTo(phaseIndicator, {
          textShadow: '0 0 12px rgba(200, 168, 75, 0.8)'
        }, {
          textShadow: '0 0 0px rgba(200, 168, 75, 0)',
          duration: 1.2,
          ease: 'power2.out'
        });
      } else {
        gsap.fromTo(phaseIndicator, {
          color: '#ffffff'
        }, {
          color: 'var(--color-text-mono)',
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    }
  }, null, finalTime + 0.3);

  return tl;
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

  gsap.to(skipBtn, {
    opacity: 1, duration: 0.3, delay: 0.5,
    onStart: () => { skipBtn.style.pointerEvents = 'auto'; }
  });

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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const overlay = document.getElementById('project-overlay');
      if (overlay && !overlay.hasAttribute('hidden')) return;
      doSkip();
    }
  }
  document.addEventListener('keydown', onKeySkip);

  const originalOnComplete = masterTimeline.eventCallback('onComplete');

  masterTimeline.eventCallback('onComplete', () => {
    fadeOutTween.kill();
    removeSkip();
    if (typeof originalOnComplete === 'function') {
      originalOnComplete();
    }
  });
}

// ---------------------------------------------------------------------------
// Scroll-driven exploration — new pinless architecture (US2)
// ---------------------------------------------------------------------------
let activeZoneIndex = -1;
let scrollEnabled = false;
let cachedCmdText = null;
let cachedPhaseIndicator = null;

function initScrollZones() {
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const scrollDriver = document.getElementById('scroll-driver');
  if (!scrollDriver) return;

  // Set scroll-driver height dynamically
  scrollDriver.style.height = (window.innerHeight + 300) + 'px';

  // Enable scrolling
  document.body.classList.add('scroll-enabled');
  scrollEnabled = true;

  // Cache DOM elements for per-frame handleScrollProgress
  cachedCmdText = document.querySelector('.cmd-text');
  cachedPhaseIndicator = document.querySelector('.phase-indicator');

  // ScrollTrigger reads progress — no pin, no scrub
  ScrollTrigger.create({
    trigger: scrollDriver,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => handleScrollProgress(self.progress)
  });

  // Update scroll-driver height on resize (T028)
  window.addEventListener('resize', () => {
    scrollDriver.style.height = (window.innerHeight + 300) + 'px';
    ScrollTrigger.refresh();
  });

  // Skip-scroll affordance (T020)
  showSkipScrollAffordance();
}

function handleScrollProgress(progress) {
  if (!starNodes || !nebulaLayers) return;

  const reduced = prefersReducedMotion.matches;
  const mobile = isMobileView();
  const tier3 = getCurrentTier() >= 3;
  const useInstant = reduced || mobile || tier3;

  // Determine active zone
  let newZoneIndex = -1;
  for (let i = 0; i < CONSTELLATION_ZONES.length; i++) {
    const zone = CONSTELLATION_ZONES[i];
    if (progress >= zone.scrollStart && progress < zone.scrollEnd) {
      newZoneIndex = i;
      break;
    }
  }
  // Edge case: progress === 1.0 belongs to last zone
  if (progress >= 1.0 && CONSTELLATION_ZONES.length > 0) {
    newZoneIndex = CONSTELLATION_ZONES.length - 1;
  }

  if (newZoneIndex !== activeZoneIndex) {
    activeZoneIndex = newZoneIndex;

    if (activeZoneIndex >= 0) {
      const zone = CONSTELLATION_ZONES[activeZoneIndex];

      // Update nebula uniforms
      nebulaLayers.forEach(layer => {
        const uniforms = layer.material.uniforms;
        uniforms.uZoneColor.value.set(zone.nebulaHueRgb[0], zone.nebulaHueRgb[1], zone.nebulaHueRgb[2]);
        if (useInstant) {
          uniforms.uZoneInfluence.value = 1.0;
        } else {
          gsap.to(uniforms.uZoneInfluence, { value: 1.0, duration: 0.3, ease: 'power2.out' });
        }
      });

      // Scale active zone stars to 1.3x, reset others to 1.0x
      if (!reduced) {
        starNodes.forEach(sprite => {
          const base = sprite.userData.baseScale;
          const isInZone = zone.projectIds.includes(sprite.userData.project.id);
          const targetScale = isInZone ? base * 1.3 : base;
          if (useInstant) {
            gsap.set(sprite.scale, { x: targetScale, y: targetScale, z: targetScale });
          } else {
            gsap.to(sprite.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 0.3, ease: 'power2.out' });
          }
        });
      }

      // Update status text
      if (cachedCmdText) cachedCmdText.textContent = zone.statusText;
      if (cachedPhaseIndicator) cachedPhaseIndicator.textContent = zone.name.toUpperCase();
    } else {
      // No active zone — reset everything
      nebulaLayers.forEach(layer => {
        const uniforms = layer.material.uniforms;
        if (useInstant) {
          uniforms.uZoneInfluence.value = 0.0;
        } else {
          gsap.to(uniforms.uZoneInfluence, { value: 0.0, duration: 0.3, ease: 'power2.out' });
        }
      });

      starNodes.forEach(sprite => {
        const base = sprite.userData.baseScale;
        if (useInstant) {
          gsap.set(sprite.scale, { x: base, y: base, z: base });
        } else {
          gsap.to(sprite.scale, { x: base, y: base, z: base, duration: 0.3, ease: 'power2.out' });
        }
      });

      if (cachedCmdText) cachedCmdText.textContent = 'Force multipliers for small businesses...';
      if (cachedPhaseIndicator) cachedPhaseIndicator.textContent = 'PORTFOLIO';
    }
  }

  // Nebula group rotation (suppressed under reduced motion)
  if (nebulaGroup && !reduced) {
    nebulaGroup.rotation.y = progress * Math.PI * 0.5;
  }
}

// ---------------------------------------------------------------------------
// Skip-scroll affordance (T020)
// ---------------------------------------------------------------------------
function showSkipScrollAffordance() {
  if (!gsap) return;

  const btn = document.createElement('button');
  btn.textContent = '\u2193 Scroll to explore';
  btn.className = 'skip-scroll-btn';
  btn.setAttribute('aria-label', 'Scroll to explore projects');
  btn.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:200;' +
    'padding:8px 20px;font-family:var(--font-mono);font-size:13px;' +
    'color:var(--color-frame-bg,#0D0B09);cursor:pointer;border:none;border-radius:4px;' +
    'background:linear-gradient(180deg,#C8A84B 0%,#8B6914 100%);' +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.2),0 2px 6px rgba(0,0,0,0.5);' +
    'opacity:0;pointer-events:none;';

  document.body.appendChild(btn);

  gsap.to(btn, {
    opacity: 1, duration: 0.3, delay: 0.5,
    onStart: () => { btn.style.pointerEvents = 'auto'; }
  });

  function removeBtn() {
    btn.style.pointerEvents = 'none';
    if (btn.parentNode) {
      gsap.to(btn, { opacity: 0, duration: 0.3, onComplete: () => btn.remove() });
    }
    document.removeEventListener('keydown', onKeyScroll);
  }

  // Auto-fade after 3 seconds
  gsap.to(btn, { opacity: 0, duration: 0.5, delay: 3.5, onComplete: removeBtn });

  btn.addEventListener('click', () => {
    const scrollDriver = document.getElementById('scroll-driver');
    if (scrollDriver) {
      window.scrollTo({ top: scrollDriver.offsetHeight - window.innerHeight, behavior: 'smooth' });
    }
    removeBtn();
  });

  function onKeyScroll(e) {
    if (e.key === 's' || e.key === 'S') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const overlay = document.getElementById('project-overlay');
      if (overlay && !overlay.hasAttribute('hidden')) return;
      if (window.__revealActive) return;
      const scrollDriver = document.getElementById('scroll-driver');
      if (scrollDriver) {
        window.scrollTo({ top: scrollDriver.offsetHeight - window.innerHeight, behavior: 'smooth' });
      }
      removeBtn();
    }
  }
  document.addEventListener('keydown', onKeyScroll);
}

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
// handleScrollDuringReveal — skip reveal if user scrolls (retained for app.js compat)
// Body overflow is hidden during reveal so scroll events won't fire,
// but wheel events can still skip the reveal animation.
// ---------------------------------------------------------------------------
function handleScrollDuringReveal(masterTimeline) {
  if (!masterTimeline) return;

  function onWheel() {
    if (masterTimeline.isActive()) {
      masterTimeline.progress(1);
    }
    window.removeEventListener('wheel', onWheel);
  }

  window.addEventListener('wheel', onWheel, { passive: true });

  const prevOnComplete = masterTimeline.eventCallback('onComplete');
  masterTimeline.eventCallback('onComplete', () => {
    window.removeEventListener('wheel', onWheel);
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
  playTerminalScan,
  initScrollZones,
  handleReducedMotion,
  initSkipIntro,
  handleScrollDuringReveal,
  handlePanelScrollLock
};
