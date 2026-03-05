// js/scroll-zones.js — Scroll-driven exploration (extracted from animations.js)
import { CONSTELLATION_ZONES } from './data.js';

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

// Gauge needle elements (cached in init)
let gaugeLeft = null;
let gaugeRight = null;

// Needle angle stops per zone (clockwise sweep across 3 zones)
const NEEDLE_ANGLES = {
  rest:  { left: '-30deg',  right: '15deg' },
  0:     { left: '10deg',   right: '55deg' },
  1:     { left: '50deg',   right: '95deg' },
  2:     { left: '90deg',   right: '135deg' }
};

// ---------------------------------------------------------------------------
// init — store scene references and bootstrap scroll zones
// ---------------------------------------------------------------------------
function init({ starNodes: sn, nebulaLayers: nl, nebulaGroup: ng, getCurrentTier: gt }) {
  starNodes = sn;
  nebulaLayers = nl;
  nebulaGroup = ng;
  getCurrentTier = gt;
  gaugeLeft = document.querySelector('.frame__gauge--left');
  gaugeRight = document.querySelector('.frame__gauge--right');
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
      starNodes.forEach(sprite => {
        const base = sprite.userData.baseScale;
        const isInZone = zone.projectIds.includes(sprite.userData.project.id);
        const targetScale = isInZone ? base * 1.3 : base;
        const targetOpacity = isInZone ? 1.0 : 0.5;
        // Skip scale animation if reticle has hover lock
        if (sprite.userData.hoverLock) {
          // Only animate opacity, not scale
        } else if (!reduced) {
          gsap.killTweensOf(sprite.scale);
          if (useInstant) {
            gsap.set(sprite.scale, { x: targetScale, y: targetScale, z: targetScale });
          } else {
            gsap.to(sprite.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 0.3, ease: 'power2.out' });
          }
        }
        gsap.killTweensOf(sprite.material);
        if (useInstant) {
          sprite.material.opacity = targetOpacity;
        } else {
          gsap.to(sprite.material, { opacity: targetOpacity, duration: 0.3, ease: 'power2.out' });
        }
      });

      // Update status text
      if (cachedCmdText) cachedCmdText.textContent = zone.statusText;
      if (cachedPhaseIndicator) cachedPhaseIndicator.textContent = zone.name.toUpperCase();

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

      starNodes.forEach(sprite => {
        const base = sprite.userData.baseScale;
        if (!sprite.userData.hoverLock) {
          gsap.killTweensOf(sprite.scale);
          if (useInstant) {
            gsap.set(sprite.scale, { x: base, y: base, z: base });
          } else {
            gsap.to(sprite.scale, { x: base, y: base, z: base, duration: 0.3, ease: 'power2.out' });
          }
        }
        // T019: Restore full opacity when no zone active
        gsap.killTweensOf(sprite.material);
        if (useInstant) {
          sprite.material.opacity = 1.0;
        } else {
          gsap.to(sprite.material, { opacity: 1.0, duration: 0.3, ease: 'power2.out' });
        }
      });

      if (cachedCmdText) cachedCmdText.textContent = 'Force multipliers for small businesses...';
      if (cachedPhaseIndicator) cachedPhaseIndicator.textContent = 'PORTFOLIO';

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
// animateNeedles — spring gauge needles to zone-specific angles
// ---------------------------------------------------------------------------
function animateNeedles(zoneIndex, instant) {
  if (!gaugeLeft || !gaugeRight) return;
  const angles = zoneIndex >= 0 ? NEEDLE_ANGLES[zoneIndex] : NEEDLE_ANGLES.rest;
  if (!angles) return;

  if (instant) {
    gsap.set(gaugeLeft, { '--needle-angle': angles.left });
    gsap.set(gaugeRight, { '--needle-angle': angles.right });
  } else {
    gsap.killTweensOf(gaugeLeft, '--needle-angle');
    gsap.killTweensOf(gaugeRight, '--needle-angle');
    gsap.to(gaugeLeft, { '--needle-angle': angles.left, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    gsap.to(gaugeRight, { '--needle-angle': angles.right, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
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
