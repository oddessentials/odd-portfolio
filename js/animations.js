// js/animations.js — Reveal sequence, scroll interactions, micro-interactions
import { camera, starNodes, nebulaLayers } from './scene.js';
import { setInitialFocus } from './interactions.js';
import { playTerminalScan } from './terminal.js';
import { getMaterials } from './sidebar-hieroglyphs.js';

const gsap = window.gsap;
const isMobileView = () => window.innerWidth < 768;

function playRevealSequence() {
  if (!gsap) return null;

  window.__revealActive = true;

  const mobile = isMobileView();

  const tl = gsap.timeline({
    onComplete: () => {
      window.__revealActive = false;
      document.dispatchEvent(new CustomEvent('reveal-complete'));
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

  // Frame elements — hidden and displaced (offset scales with corner size)
  const cornerOffset = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--frame-corner-size')) * 0.75 || 34;
  gsap.set(corners, { opacity: 0 });
  gsap.set('.frame__corner--tl', { x: -cornerOffset, y: -cornerOffset });
  gsap.set('.frame__corner--tr', { x: cornerOffset, y: -cornerOffset });
  gsap.set('.frame__corner--bl', { x: -cornerOffset, y: cornerOffset });
  gsap.set('.frame__corner--br', { x: cornerOffset, y: cornerOffset });
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
  // Stars/clusters hidden
  if (starNodes) {
    starNodes.forEach(node => {
      node.scale.set(0, 0, 0);
      if (node.material) {
        node.material.opacity = 0;
      } else if (node.children) {
        node.children.forEach(child => {
          if (child.material) child.material.opacity = 0;
        });
      }
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

    // Fade out the viewport map on mobile
    const viewportMapMobile = document.querySelector('.viewport-map');
    if (viewportMapMobile) {
      tl.to(viewportMapMobile, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 1.0);
    }

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

    // Stars stagger in (cluster-aware)
    if (starNodes && starNodes.length > 0) {
      const nonDead = starNodes.filter(n => n.userData.project.status !== 'paused');
      const deadNodes = starNodes.filter(n => n.userData.project.status === 'paused');
      const shuffled = gsap.utils.shuffle([...nonDead]);
      const ordered = [...shuffled, ...deadNodes];
      ordered.forEach((node, i) => {
        const t = 2.0 + i * 0.08;
        if (node.material) {
          const bs = node.userData.baseScale;
          tl.to(node.scale, { x: bs, y: bs, z: bs, duration: 0.3, ease: 'back.out(2.5)' }, t);
          tl.to(node.material, { opacity: 1, duration: 0.2, ease: 'power2.out' }, t);
        } else if (node.children) {
          const isPaused = node.userData.project.status === 'paused';
          const bs = node.userData.baseScale;
          tl.to(node.scale, { x: 1, y: 1, z: 1, duration: isPaused ? 0.3 : 0.3, ease: isPaused ? 'power2.out' : 'back.out(1.8)' }, t);
          node.children.forEach(child => {
            if (child.material && child.userData && child.userData.isSubPoint) {
              const targetOp = isPaused ? 0.20 : 1;
              tl.to(child.material, { opacity: targetOp, duration: 0.2, ease: 'power2.out' }, t);
            }
          });
        }
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
    '--needle-angle': '135deg'
  }, {
    '--needle-angle': '30deg',
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

  // Glyph reveal wipe: bottom-to-top at t=2.2, completes t=2.7 (before terminal scan)
  const sidebarMats = getMaterials();
  if (sidebarMats.leftMaterial) {
    tl.to(sidebarMats.leftMaterial.uniforms.uRevealProgress, {
      value: 1, duration: 0.5, ease: 'power2.inOut'
    }, 2.2);
  }
  if (sidebarMats.rightMaterial) {
    tl.to(sidebarMats.rightMaterial.uniforms.uRevealProgress, {
      value: 1, duration: 0.5, ease: 'power2.inOut'
    }, 2.2);
  }

  // Wire terminal scan at t=2.8 (after scan lines finish fade-in at t=2.75)
  tl.call(playTerminalScan, null, 2.8);

  // Phase 3 (3800-6500ms): Starfield ignition (no orb glass, just nebula + stars)
  // Fade out the viewport map as the starfield ignites
  const viewportMap = document.querySelector('.viewport-map');
  if (viewportMap) {
    tl.to(viewportMap, { opacity: 0, duration: 0.8, ease: 'power2.in' }, 3.8);
  }

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

  // Stars stagger in (cluster-aware, 0.10s stagger per T027a)
  if (starNodes && starNodes.length > 0) {
    const nonDead = starNodes.filter(n => n.userData.project.status !== 'paused');
    const deadNodes = starNodes.filter(n => n.userData.project.status === 'paused');
    const shuffled = gsap.utils.shuffle([...nonDead]);
    const ordered = [...shuffled, ...deadNodes];
    ordered.forEach((node, i) => {
      const t = 4.8 + i * 0.10;
      if (node.material) {
        const bs = node.userData.baseScale;
        tl.to(node.scale, { x: bs, y: bs, z: bs, duration: 0.4, ease: 'back.out(2.5)' }, t);
        tl.to(node.material, { opacity: 1, duration: 0.3, ease: 'power2.out' }, t);
      } else if (node.children) {
        const isPaused = node.userData.project.status === 'paused';
        tl.to(node.scale, { x: 1, y: 1, z: 1, duration: isPaused ? 0.3 : 0.3, ease: isPaused ? 'power2.out' : 'back.out(1.8)' }, t);
        node.children.forEach(child => {
          if (child.material && child.userData && child.userData.isSubPoint) {
            const targetOp = isPaused ? 0.20 : 1;
            tl.to(child.material, { opacity: targetOp, duration: 0.2, ease: 'power2.out' }, t);
          }
        });
      }
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

export { playRevealSequence, initSkipIntro };
