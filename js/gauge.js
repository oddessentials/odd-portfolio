// js/gauge.js — Gauge animation functions (extracted from scroll-zones.js)

const gsap = window.gsap;
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)');

// Mobile detection
const isMobileView = () => window.innerWidth < 768;

// Gauge needle elements (cached in init)
let gaugeLeft = null;
let gaugeRight = null;

// Needle angle stops per zone — 90° quadrants (left CW, right CCW)
const NEEDLE_ANGLES = {
  rest:  { left: '0deg',    right: '0deg' },
  0:     { left: '90deg',   right: '-90deg' },
  1:     { left: '180deg',  right: '-180deg' },
  2:     { left: '270deg',  right: '-270deg' }
};

// Micro-tremor state (T012)
let tremorTweenLeft = null;
let tremorTweenRight = null;

// Glass dome parallax state (T014)
let domeParallaxBound = false;

// getCurrentTier function reference (injected via init)
let getCurrentTier = null;

// Active zone index reference (updated by scroll-zones.js)
let activeZoneIndex = -1;

// ---------------------------------------------------------------------------
// init — cache gauge elements and bootstrap dome parallax + reduced-motion
// ---------------------------------------------------------------------------
function init(getTier) {
  getCurrentTier = getTier;
  gaugeLeft = document.querySelector('.frame__gauge--left');
  gaugeRight = document.querySelector('.frame__gauge--right');
  initDomeParallax();
  initReducedMotionWatch();
}

// ---------------------------------------------------------------------------
// setActiveZoneIndex — called by scroll-zones.js on zone change
// ---------------------------------------------------------------------------
function setActiveZoneIndex(idx) {
  activeZoneIndex = idx;
}

// ---------------------------------------------------------------------------
// animateNeedles — spring gauge needles to zone-specific angles
// ---------------------------------------------------------------------------
function animateNeedles(zoneIndex, instant) {
  if (!gaugeLeft || !gaugeRight) return;
  const angles = zoneIndex >= 0 ? NEEDLE_ANGLES[zoneIndex] : NEEDLE_ANGLES.rest;
  if (!angles) return;

  // T012: Pause micro-tremor during transition
  stopMicroTremor();

  if (instant) {
    gsap.set(gaugeLeft, { '--needle-angle': angles.left });
    gsap.set(gaugeRight, { '--needle-angle': angles.right });
    // T012: Restart tremor immediately for instant transitions
    startMicroTremor(angles);
  } else {
    gsap.killTweensOf(gaugeLeft, '--needle-angle');
    gsap.killTweensOf(gaugeRight, '--needle-angle');
    gsap.to(gaugeLeft, { '--needle-angle': angles.left, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    gsap.to(gaugeRight, {
      '--needle-angle': angles.right, duration: 0.8, ease: 'elastic.out(1, 0.4)',
      onComplete: () => startMicroTremor(angles)
    });
  }
}

// T005 + T013: animateGlow — zone glow custom properties (0-indexed) with flash
function animateGlow(zoneIndex, instant) {
  if (!gaugeLeft || !gaugeRight) return;
  const gauges = [gaugeLeft, gaugeRight];

  for (let z = 0; z < 3; z++) {
    const prop = `--gauge-zone${z}-glow`;
    const isActive = z === zoneIndex;

    gauges.forEach(gauge => {
      gsap.killTweensOf(gauge, prop);
      if (instant) {
        gauge.style.setProperty(prop, isActive ? '0.2' : '0');
      } else if (isActive) {
        // T013: Flash from 0 → 0.6, then settle to 0.2
        gsap.fromTo(gauge, { [prop]: 0 }, {
          [prop]: 0.6, duration: 0.15, ease: 'power2.out',
          onComplete: () => {
            gsap.to(gauge, { [prop]: 0.2, duration: 0.4, ease: 'power2.inOut' });
          }
        });
      } else {
        // T013: Fade inactive zones to 0
        gsap.to(gauge, { [prop]: 0, duration: 0.3, ease: 'power2.out' });
      }
    });
  }
}

// T012: Micro-tremor — ±1.5deg idle oscillation, sine.inOut yoyo
function startMicroTremor(angles) {
  if (!gaugeLeft || !gaugeRight || !gsap) return;
  if (prefersReducedMotion.matches) return;
  if (getCurrentTier() >= 3) return;

  // Parse base angles (e.g. '15deg' → 15)
  const baseLeft = parseFloat(angles.left);
  const baseRight = parseFloat(angles.right);
  if (isNaN(baseLeft) || isNaN(baseRight)) return;

  const tremor = 1.5; // degrees

  tremorTweenLeft = gsap.to(gaugeLeft, {
    '--needle-angle': (baseLeft + tremor) + 'deg',
    duration: 2.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    yoyoEase: 'sine.inOut'
  });

  tremorTweenRight = gsap.to(gaugeRight, {
    '--needle-angle': (baseRight - tremor) + 'deg',
    duration: 2.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    yoyoEase: 'sine.inOut',
    delay: 0.4
  });
}

function stopMicroTremor() {
  if (tremorTweenLeft) { tremorTweenLeft.kill(); tremorTweenLeft = null; }
  if (tremorTweenRight) { tremorTweenRight.kill(); tremorTweenRight = null; }
}

// T014: Glass dome parallax — --dome-x/--dome-y on mousemove (tier < 2 only)
function initDomeParallax() {
  if (!gsap || domeParallaxBound || isMobileView()) return;
  domeParallaxBound = true;
  document.addEventListener('mousemove', (e) => {
    if (!gaugeLeft || !gaugeRight || getCurrentTier() >= 2 || prefersReducedMotion.matches) return;
    const dx = (((e.clientX / window.innerWidth) * 2 - 1) * 5).toFixed(1);
    const dy = (((e.clientY / window.innerHeight) * 2 - 1) * 5).toFixed(1);
    [gaugeLeft, gaugeRight].forEach(g => {
      g.style.setProperty('--dome-x', dx);
      g.style.setProperty('--dome-y', dy);
    });
  });
}

// T015: Reduced-motion watch — kill tremor + reset dome + reset glow on mid-session toggle
function initReducedMotionWatch() {
  prefersReducedMotion.addEventListener('change', () => {
    if (prefersReducedMotion.matches) {
      stopMicroTremor();
      // Reset glow vars on reduced-motion toggle
      animateGlow(-1, true);
      [gaugeLeft, gaugeRight].forEach(g => {
        if (g) { g.style.setProperty('--dome-x', '0'); g.style.setProperty('--dome-y', '0'); }
      });
    } else {
      // Re-enable tremor at current angle if in a zone
      const angles = activeZoneIndex >= 0 ? NEEDLE_ANGLES[activeZoneIndex] : NEEDLE_ANGLES.rest;
      if (angles && getCurrentTier() < 3) {
        startMicroTremor(angles);
      }
    }
  });
}

export { init, setActiveZoneIndex, animateNeedles, animateGlow, NEEDLE_ANGLES };
