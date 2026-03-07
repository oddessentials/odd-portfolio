// js/logo-follow.js — Logo follow-cursor system (T009, T010)
import { isFinePointer, pointerMQL } from './pointer-utils.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let logoEl = null;
let logoQuickToX = null;
let logoQuickToY = null;
let logoQuickToRot = null;
let logoFollowing = false;
let logoReturning = false;
let logoPrevX = 0;
let logoPrevY = 0;

// ---------------------------------------------------------------------------
// logoReturnHome — animate logo back to header band
// ---------------------------------------------------------------------------
function logoReturnHome(gsap) {
  if (!logoFollowing) return;           // Guard: prevent double-fire
  logoFollowing = false;
  logoReturning = true;                 // Block mousemove re-engagement during return
  const headerBand = document.querySelector('.frame__header-band');
  if (headerBand) {
    const homeRect = headerBand.getBoundingClientRect();
    gsap.to(logoEl, {
      left: homeRect.left + homeRect.width / 2 - 20,
      top: homeRect.top + homeRect.height / 2 - 20,
      rotation: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        logoReturning = false;          // Return complete — allow re-engagement
        logoEl.classList.remove('logo--following');
        logoEl.style.left = '';
        logoEl.style.top = '';
        gsap.set(logoEl, { clearProps: 'transform' });
      }
    });
  } else {
    logoReturning = false;
    logoEl.classList.remove('logo--following');
    logoEl.style.left = '';
    logoEl.style.top = '';
    gsap.set(logoEl, { clearProps: 'transform' });
  }
}

// ---------------------------------------------------------------------------
// Reticle-pause flag — when true, logo ignores mousemove re-engagement
// ---------------------------------------------------------------------------
let paused = false;

// ---------------------------------------------------------------------------
// initLogoFollow — internal setup
// ---------------------------------------------------------------------------
function initLogoFollow() {
  const gsap = window.gsap;
  if (!gsap) return;

  logoEl = document.getElementById('brand-logo');
  if (!logoEl) return;

  const hitzone = document.getElementById('orb-hitzone');
  if (!hitzone) return;

  // T029: Reticle handoff — pause logo-follow when reticle is active
  document.addEventListener('reticle-activate', () => {
    logoReturnHome(gsap);
    paused = true;
  });
  document.addEventListener('reticle-deactivate', () => {
    paused = false;
  });

  // Logo's upper-right corner tracks the pointer (rocket-ship effect).
  // 40px logo: left = pointerX - 40, top = pointerY
  const logoW = 40;
  // Neutral angle: logo body extends down-left from the nose (upper-right).
  // That direction is 225° from positive-x, so the nose points at -45° (upper-right).
  // Rotation = movementAngle - neutralAngle.
  const neutralDeg = -45;
  const RAD2DEG = 180 / Math.PI;
  // Minimum movement distance to update rotation (avoids jitter from tiny deltas)
  const minDelta = 2;

  // Shared rotation helper — computes angle from movement delta
  function updateRotation(cx, cy) {
    const dx = cx - logoPrevX;
    const dy = cy - logoPrevY;
    logoPrevX = cx;
    logoPrevY = cy;
    if (dx * dx + dy * dy < minDelta * minDelta) return;
    const deg = Math.atan2(dy, dx) * RAD2DEG - neutralDeg;
    if (logoQuickToRot) {
      logoQuickToRot(deg);
    } else {
      gsap.set(logoEl, { rotation: deg });
    }
  }

  // Shared engage helper — used by mouseenter and mousemove fallback
  function engageLogo(cx, cy) {
    gsap.killTweensOf(logoEl);
    logoReturning = false;              // Cancel any in-progress return
    logoFollowing = true;
    logoPrevX = cx;
    logoPrevY = cy;
    logoEl.style.left = (cx - logoW) + 'px';
    logoEl.style.top = cy + 'px';
    logoEl.classList.add('logo--following');
    hitzone.style.cursor = 'none';
  }

  // --- Named mouse handlers (for add/removeEventListener) ---
  function onMouseEnter(e) {
    if (logoReturning || paused) return;
    engageLogo(e.clientX, e.clientY);
  }

  function onMouseMove(e) {
    if (!logoFollowing) {
      if (logoReturning || paused) return;
      engageLogo(e.clientX, e.clientY);
      return;
    }
    if (!logoQuickToX || !logoQuickToY) return;
    logoQuickToX(e.clientX - logoW);
    logoQuickToY(e.clientY);
    updateRotation(e.clientX, e.clientY);
  }

  function onMouseLeave() {
    if (!logoFollowing) return;
    hitzone.style.cursor = 'crosshair';
    logoReturnHome(gsap);
  }

  function onDocMouseLeave() {
    if (!logoFollowing) return;
    hitzone.style.cursor = 'crosshair';
    logoReturnHome(gsap);
  }

  function initQuickTo() {
    logoQuickToX = gsap.quickTo(logoEl, 'left', { duration: 0.3, ease: 'power2.out' });
    logoQuickToY = gsap.quickTo(logoEl, 'top', { duration: 0.3, ease: 'power2.out' });
    logoQuickToRot = gsap.quickTo(logoEl, 'rotation', { duration: 0.25, ease: 'power2.out' });
  }

  // --- Desktop: mouse events (fine pointer only) ---
  if (isFinePointer()) {
    initQuickTo();
    hitzone.addEventListener('mouseenter', onMouseEnter);
    hitzone.addEventListener('mousemove', onMouseMove);
    hitzone.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseleave', onDocMouseLeave);
  }

  // --- Named touch handlers (for add/removeEventListener) ---
  function onTouchStart(e) {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    gsap.killTweensOf(logoEl);
    logoFollowing = true;
    logoPrevX = t.clientX;
    logoPrevY = t.clientY;
    logoEl.style.left = (t.clientX - logoW) + 'px';
    logoEl.style.top = t.clientY + 'px';
    logoEl.classList.add('logo--following');
  }

  function onTouchMove(e) {
    if (!logoFollowing || e.touches.length === 0) return;
    const t = e.touches[0];
    logoEl.style.left = (t.clientX - logoW) + 'px';
    logoEl.style.top = t.clientY + 'px';
    updateRotation(t.clientX, t.clientY);
  }

  function onTouchEnd() {
    if (!logoFollowing) return;
    logoReturnHome(gsap);
  }

  // --- Touch: disabled on coarse-pointer devices ---
  if (isFinePointer()) {
    hitzone.addEventListener('touchstart', onTouchStart, { passive: true });
    hitzone.addEventListener('touchmove', onTouchMove, { passive: true });
    hitzone.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  // --- Dynamic pointer capability change ---
  pointerMQL.addEventListener('change', (e) => {
    if (!e.matches) {
      // Switched to coarse — disable logo follow
      logoReturnHome(gsap);
      hitzone.removeEventListener('mouseenter', onMouseEnter);
      hitzone.removeEventListener('mousemove', onMouseMove);
      hitzone.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseleave', onDocMouseLeave);
      hitzone.removeEventListener('touchstart', onTouchStart);
      hitzone.removeEventListener('touchmove', onTouchMove);
      hitzone.removeEventListener('touchend', onTouchEnd);
    } else {
      // Switched to fine — enable logo follow
      initQuickTo();
      hitzone.addEventListener('mouseenter', onMouseEnter);
      hitzone.addEventListener('mousemove', onMouseMove);
      hitzone.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('mouseleave', onDocMouseLeave);
      hitzone.addEventListener('touchstart', onTouchStart, { passive: true });
      hitzone.addEventListener('touchmove', onTouchMove, { passive: true });
      hitzone.addEventListener('touchend', onTouchEnd, { passive: true });
    }
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize logo follow system.
 */
export function init() {
  initLogoFollow();
}

/**
 * Returns whether the logo is currently following the cursor.
 */
export function isFollowing() {
  return logoFollowing;
}

/**
 * Reset logo state on resize: snap home instantly + refresh quickTo caches.
 */
export function resetOnResize() {
  if (!logoEl) return;
  const g = window.gsap;
  if (g) g.killTweensOf(logoEl);
  logoFollowing = false;
  logoReturning = false;
  logoEl.classList.remove('logo--following');
  logoEl.style.left = '';
  logoEl.style.top = '';
  if (g) g.set(logoEl, { clearProps: 'transform' });
  // Recreate quickTo instances to purge stale internal start-value caches
  if (g && logoQuickToX) {
    logoQuickToX = g.quickTo(logoEl, 'left', { duration: 0.3, ease: 'power2.out' });
    logoQuickToY = g.quickTo(logoEl, 'top', { duration: 0.3, ease: 'power2.out' });
    logoQuickToRot = g.quickTo(logoEl, 'rotation', { duration: 0.25, ease: 'power2.out' });
  }
  const hz = document.getElementById('orb-hitzone');
  if (hz) hz.style.cursor = 'crosshair';
}
