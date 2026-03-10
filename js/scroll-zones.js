// js/scroll-zones.js — Scroll-driven exploration (extracted from animations.js)
import { CONSTELLATION_ZONES } from './data.js';
import { init as gaugeInit, setActiveZoneIndex as setGaugeZone, animateNeedles, animateGlow } from './gauge.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)');

// Mobile detection
const isMobileView = () => window.innerWidth < 768;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let activeZoneIndex = -1;
let scrollEnabled = false;
let cachedCmdText = null;
let cachedPhaseIndicator = null;

// Scene references injected via init()
let starNodes = null;
let nebulaLayers = null;
let nebulaGroup = null;
let getCurrentTier = null;

// ---------------------------------------------------------------------------
// init — store scene references and bootstrap scroll zones
// ---------------------------------------------------------------------------
function init({ starNodes: sn, nebulaLayers: nl, nebulaGroup: ng, getCurrentTier: gt }) {
  starNodes = sn;
  nebulaLayers = nl;
  nebulaGroup = ng;
  getCurrentTier = gt;
  gaugeInit(gt);           // T012-T015: gauge animations, dome parallax, reduced-motion
  if (isMobileView()) {
    // Mobile: no scroll zones, tap stars directly. Lazy-init on resize to desktop.
    window.addEventListener('resize', onResizeDesktop);
    return;
  }
  initScrollZones();
}

// Lazy-init scroll zones when viewport grows past mobile width (e.g. rotation)
function onResizeDesktop() {
  if (isMobileView() || scrollEnabled) return;
  window.removeEventListener('resize', onResizeDesktop);
  initScrollZones();
}

// ---------------------------------------------------------------------------
// initScrollZones — create ScrollTrigger and skip-scroll affordance
// ---------------------------------------------------------------------------
function initScrollZones() {
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const scrollDriver = document.getElementById('scroll-driver');
  if (!scrollDriver) return;

  // Set scroll-driver height dynamically
  scrollDriver.style.height = (window.innerHeight + 2200) + 'px';

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
    scrollDriver.style.height = (window.innerHeight + 2200) + 'px';
    ScrollTrigger.refresh();
  });

  // Skip-scroll affordance (T020)
  showSkipScrollAffordance();
}

// ---------------------------------------------------------------------------
// handleScrollProgress — zone detection, nebula/star updates, rotation
// ---------------------------------------------------------------------------
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

    // Sync gauge module with current zone index
    setGaugeZone(activeZoneIndex);

    // Dispatch zone-change event (T012)
    document.dispatchEvent(new CustomEvent('zone-change', {
      detail: {
        zoneIndex: activeZoneIndex,
        zone: activeZoneIndex >= 0 ? CONSTELLATION_ZONES[activeZoneIndex] : null
      }
    }));

    if (activeZoneIndex >= 0) {
      const zone = CONSTELLATION_ZONES[activeZoneIndex];

      // Update nebula uniforms
      nebulaLayers.forEach(layer => {
        const uniforms = layer.material.uniforms;
        uniforms.uZoneColor.value.set(zone.nebulaHueRgb[0], zone.nebulaHueRgb[1], zone.nebulaHueRgb[2]);
        if (useInstant) {
          uniforms.uZoneInfluence.value = 1.0;
        } else {
          gsap.killTweensOf(uniforms.uZoneInfluence);
          gsap.to(uniforms.uZoneInfluence, { value: 1.0, duration: 0.3, ease: 'power2.out' });
        }
      });

      // Scale active zone stars to 1.3x, reset others to 1.0x
      // T019: Dim non-highlighted stars to 0.5 opacity
      starNodes.forEach(node => {
        const project = node.userData.project;
        const base = node.userData.baseScale;
        const isInZone = zone.projectIds.includes(project.id);

        // Dead rock cluster: always dim, never highlight
        if (project.status === 'paused') return;

        const targetScale = isInZone ? base * 1.3 : base;
        const targetOpacity = isInZone ? 1.0 : 0.5;

        // Bridge star guard: skip tween restart if already at highlighted state
        if (node.material) {
          // Individual star sprite
          if (isInZone && node.material.opacity >= 0.95 && !node.userData.hoverLock) {
            // Already highlighted — skip kill+re-tween to prevent stutter
          } else if (node.userData.hoverLock) {
            // Reticle has hover lock — only animate opacity
          } else if (!reduced) {
            gsap.killTweensOf(node.scale);
            if (useInstant) {
              gsap.set(node.scale, { x: targetScale, y: targetScale, z: targetScale });
            } else {
              gsap.to(node.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
            }
          }
          gsap.killTweensOf(node.material);
          if (useInstant) {
            node.material.opacity = targetOpacity;
          } else {
            gsap.to(node.material, { opacity: targetOpacity, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
          }
        } else if (node.children) {
          // Cluster group — animate children's opacity and group scale
          if (!node.userData.hoverLock && !reduced) {
            gsap.killTweensOf(node.scale);
            if (useInstant) {
              gsap.set(node.scale, { x: targetScale / base, y: targetScale / base, z: targetScale / base });
            } else {
              gsap.to(node.scale, { x: targetScale / base, y: targetScale / base, z: targetScale / base, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
            }
          }
          node.children.forEach(child => {
            if (child.material && child.userData && child.userData.isSubPoint) {
              if (useInstant) {
                child.material.opacity = targetOpacity;
              } else {
                gsap.to(child.material, { opacity: targetOpacity, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
              }
            }
          });
        }
      });

      // Update status text
      if (cachedCmdText) cachedCmdText.textContent = zone.statusText;
      if (cachedPhaseIndicator) cachedPhaseIndicator.textContent = zone.name.toUpperCase();

      // T005 + T013: Animate zone glow custom properties
      animateGlow(activeZoneIndex, useInstant);

      // Spring gauge needles to zone angle
      animateNeedles(activeZoneIndex, useInstant);
    } else {
      // No active zone — reset everything
      nebulaLayers.forEach(layer => {
        const uniforms = layer.material.uniforms;
        gsap.killTweensOf(uniforms.uZoneInfluence);
        if (useInstant) {
          uniforms.uZoneInfluence.value = 0.0;
        } else {
          gsap.to(uniforms.uZoneInfluence, { value: 0.0, duration: 0.3, ease: 'power2.out' });
        }
      });

      starNodes.forEach(node => {
        if (node.userData.project && node.userData.project.status === 'paused') return;
        const base = node.userData.baseScale;
        if (node.material) {
          // Individual star
          if (!node.userData.hoverLock) {
            gsap.killTweensOf(node.scale);
            if (useInstant) {
              gsap.set(node.scale, { x: base, y: base, z: base });
            } else {
              gsap.to(node.scale, { x: base, y: base, z: base, duration: 0.3, ease: 'power2.out' });
            }
          }
          gsap.killTweensOf(node.material);
          if (useInstant) {
            node.material.opacity = 1.0;
          } else {
            gsap.to(node.material, { opacity: 1.0, duration: 0.3, ease: 'power2.out' });
          }
        } else if (node.children) {
          // Cluster group — reset
          if (!node.userData.hoverLock) {
            gsap.killTweensOf(node.scale);
            if (useInstant) {
              gsap.set(node.scale, { x: 1, y: 1, z: 1 });
            } else {
              gsap.to(node.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' });
            }
          }
          node.children.forEach(child => {
            if (child.material && child.userData && child.userData.isSubPoint) {
              if (useInstant) {
                child.material.opacity = 1.0;
              } else {
                gsap.to(child.material, { opacity: 1.0, duration: 0.3, ease: 'power2.out' });
              }
            }
          });
        }
      });

      if (cachedCmdText) cachedCmdText.textContent = 'Force multipliers for small businesses...';
      if (cachedPhaseIndicator) cachedPhaseIndicator.textContent = 'phi LOCKED';

      // T005: Reset all glow properties on zone exit
      animateGlow(-1, useInstant);

      // Spring gauge needles back to rest
      animateNeedles(-1, useInstant);
    }
  }

  // Nebula group rotation (suppressed under reduced motion)
  if (nebulaGroup && !reduced) {
    nebulaGroup.rotation.y = progress * Math.PI * 0.5;
  }

}

// ---------------------------------------------------------------------------
// showSkipScrollAffordance (T020)
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

export { init };
