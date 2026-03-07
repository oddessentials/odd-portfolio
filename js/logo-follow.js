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
let logoPrevX = 0;
let logoPrevY = 0;
let logoOpacityTween = null;
let logoHasEngaged = false;
let reticleDebounceTimer = null;

// ---------------------------------------------------------------------------
// Opacity fade helpers
// ---------------------------------------------------------------------------
function fadeLogoOut(gsap) {
  if (logoOpacityTween) logoOpacityTween.kill();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    logoEl.style.opacity = '0';
    return;
  }
  logoOpacityTween = gsap.to(logoEl, { opacity: 0, duration: 0.2, ease: 'power2.out' });
}

function fadeLogoIn(gsap) {
  if (logoOpacityTween) logoOpacityTween.kill();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    logoEl.style.opacity = '1';
    return;
  }
  logoOpacityTween = gsap.to(logoEl, { opacity: 1, duration: 0.15, ease: 'power2.out' });
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

  // Reticle handoff — pause logo-follow when reticle is active (debounced)
  document.addEventListener('reticle-activate', () => {
    if (!logoFollowing) return;           // Only fade if logo is actively following
    if (reticleDebounceTimer) reticleDebounceTimer.revert();
    reticleDebounceTimer = gsap.delayedCall(0.08, () => {
      reticleDebounceTimer = null;        // consumed — so deactivate knows it fired
      fadeLogoOut(gsap);
      paused = true;
    });
  });
  document.addEventListener('reticle-deactivate', () => {
    if (!logoHasEngaged) return;          // Ignore if logo was never engaged
    if (reticleDebounceTimer) {
      reticleDebounceTimer.revert();
      reticleDebounceTimer = null;
    } else {
      paused = false;
      fadeLogoIn(gsap);
    }
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
  const minDelta = 6;

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
    if (logoOpacityTween) { logoOpacityTween.kill(); logoOpacityTween = null; }
    logoFollowing = true;
    logoPrevX = cx;
    logoPrevY = cy;
    logoEl.style.left = (cx - logoW) + 'px';
    logoEl.style.top = cy + 'px';
    logoEl.classList.add('logo--following');
    fadeLogoIn(gsap);
    logoHasEngaged = true;
    hitzone.style.cursor = 'none';
  }

  // --- Named mouse handlers (for add/removeEventListener) ---
  function onMouseEnter(e) {
    if (paused) return;
    engageLogo(e.clientX, e.clientY);
  }

  function onMouseMove(e) {
    if (!logoFollowing) {
      if (paused) return;
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
    fadeLogoOut(gsap);
    logoFollowing = false;
  }

  function onDocMouseLeave() {
    if (!logoFollowing) return;
    fadeLogoOut(gsap);
    logoFollowing = false;
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
    fadeLogoOut(gsap);
    logoFollowing = false;
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
      fadeLogoOut(gsap);
      logoFollowing = false;
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
  if (logoOpacityTween) logoOpacityTween.kill();
  logoOpacityTween = null;
  logoFollowing = false;
  logoHasEngaged = false;
  logoEl.classList.remove('logo--following');
  logoEl.style.left = '';
  logoEl.style.top = '';
  logoEl.style.opacity = '';
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
