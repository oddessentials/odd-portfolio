// js/glyph-compositor.js — Sidebar overlay hover/rect utilities
// T029-T031: Guard-padded clamping, hover/scroll setters

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let leftMaterial = null;
let rightMaterial = null;

const gsap = window.gsap;
const _reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => _reducedMotionQuery.matches;

// ResizeObserver rect cache for hover mapping (T043)
let navRect = null;
let hoverQuickTo = null;

// ---------------------------------------------------------------------------
// init — receive material references from sidebar-hieroglyphs.js
// ---------------------------------------------------------------------------
function init({ left, right }) {
  leftMaterial = left;
  rightMaterial = right;
  initHoverCache();
}

// ---------------------------------------------------------------------------
// Hover brightening: ResizeObserver rect cache + setters (T043)
// ---------------------------------------------------------------------------
function initHoverCache() {
  const nav = document.querySelector('#constellation-nav');
  if (!nav) return;

  const updateRect = () => { navRect = nav.getBoundingClientRect(); };
  updateRect();

  const ro = new ResizeObserver(updateRect);
  ro.observe(nav);
}

function setHoveredProject(normalizedY) {
  if (!leftMaterial) return;
  if (!hoverQuickTo && gsap) {
    hoverQuickTo = gsap.quickTo(leftMaterial.uniforms.uHoverUV.value, 'y', {
      duration: 0.15, ease: 'power2.out'
    });
  }
  leftMaterial.uniforms.uHoverUV.value.x = 0.5;
  if (prefersReducedMotion()) {
    if (gsap) gsap.set(leftMaterial.uniforms.uHoverUV.value, { y: normalizedY });
  } else if (hoverQuickTo) {
    hoverQuickTo(normalizedY);
  }
}

function clearHover() {
  if (!leftMaterial) return;
  if (prefersReducedMotion()) {
    leftMaterial.uniforms.uHoverUV.value.set(-1, -1);
  } else if (gsap) {
    gsap.to(leftMaterial.uniforms.uHoverUV.value, {
      x: -1, y: -1, duration: 0.25, ease: 'power2.out',
      onComplete: () => { hoverQuickTo = null; }
    });
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
function getNavRect() { return navRect; }

export { init, setHoveredProject, clearHover, getNavRect };
