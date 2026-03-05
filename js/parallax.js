// js/parallax.js — Mouse-driven parallax depth layers for nebula particles
// Phase 7 (US6): 3-layer parallax composing with scroll rotation + per-layer drift
//
// Transform composition (scene graph):
//   nebulaGroup.rotation.y    (scroll-driven, scroll-zones.js)
//     -> parentGroup.position  (mouse-driven parallax, THIS module)
//       -> points.rotation     (time-driven drift, scene.js ticker)
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const _reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => _reducedMotionQuery.matches;

let layers = [];
// { parentGroup, points, lerpFactor, maxOffset,
//   currentOffset: {x,y}, targetOffset: {x,y} }

let mouseNormalized = { x: 0, y: 0 };
let mouseInViewport = false;
let enabled = true;
let tierLevel = 1;

// ---------------------------------------------------------------------------
// Layer configs — background (slowest) to foreground (fastest)
// ---------------------------------------------------------------------------
const LAYER_CONFIGS = [
  { lerpFactor: 0.02, maxOffset: 0.02 },   // Background
  { lerpFactor: 0.05, maxOffset: 0.05 },   // Mid-ground
  { lerpFactor: 0.08, maxOffset: 0.1 },    // Foreground
];

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------
function onMouseMove(e) {
  mouseNormalized.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNormalized.y = (e.clientY / window.innerHeight) * 2 - 1;
  mouseInViewport = true;
}

function onMouseLeave() {
  mouseInViewport = false;
}

function onResize() {
  const isMobile = window.innerWidth < 768;

  if (isMobile && enabled) {
    enabled = false;
    // Reset all parent group positions
    layers.forEach(l => {
      l.parentGroup.position.x = 0;
      l.parentGroup.position.y = 0;
      l.currentOffset.x = 0;
      l.currentOffset.y = 0;
      l.targetOffset.x = 0;
      l.targetOffset.y = 0;
    });
  } else if (!isMobile && !enabled && layers.length > 0) {
    enabled = true;
  }
}

function onTierChange(e) {
  tierLevel = e.detail.tier;
}

// ---------------------------------------------------------------------------
// init — wrap each nebula Points in a parent Group for parallax offsets
// ---------------------------------------------------------------------------
function init({ nebulaLayers, nebulaGroup }) {
  // Bail on mobile — no mouse parallax needed
  if (window.innerWidth < 768) {
    enabled = false;
    return;
  }

  nebulaLayers.forEach((points, i) => {
    const config = LAYER_CONFIGS[i] || LAYER_CONFIGS[LAYER_CONFIGS.length - 1];

    // Create parent Group wrapper
    const parentGroup = new THREE.Group();

    // Reparent: Points moves from nebulaGroup -> parentGroup -> nebulaGroup
    // This preserves the scene graph so that:
    //   nebulaGroup.rotation (scroll)  affects everything
    //   parentGroup.position (parallax) is in nebulaGroup-local space
    //   points.rotation (drift)        is in parentGroup-local space
    nebulaGroup.remove(points);
    parentGroup.add(points);
    nebulaGroup.add(parentGroup);

    layers.push({
      parentGroup,
      points,
      lerpFactor: config.lerpFactor,
      maxOffset: config.maxOffset,
      currentOffset: { x: 0, y: 0 },
      targetOffset: { x: 0, y: 0 }
    });
  });

  // Listeners
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('tier-change', onTierChange);
  window.addEventListener('resize', onResize);
}

// ---------------------------------------------------------------------------
// tick — lerp-based parallax offset applied every frame
// ---------------------------------------------------------------------------
function tick() {
  if (!enabled || prefersReducedMotion()) return;

  // Determine which layers to animate (T053: tier >= 2 skips third layer)
  const activeLayers = tierLevel >= 2 ? layers.slice(0, 2) : layers;

  // If mouse left viewport, lerp targets back to zero
  if (!mouseInViewport) {
    activeLayers.forEach(layer => {
      layer.targetOffset.x = 0;
      layer.targetOffset.y = 0;
    });
  } else {
    activeLayers.forEach(layer => {
      // Invert X so scene shifts opposite to mouse (natural parallax feel)
      layer.targetOffset.x = -mouseNormalized.x * layer.maxOffset;
      layer.targetOffset.y =  mouseNormalized.y * layer.maxOffset;
    });
  }

  // Lerp current toward target and apply
  activeLayers.forEach(layer => {
    layer.currentOffset.x +=
      (layer.targetOffset.x - layer.currentOffset.x) * layer.lerpFactor;
    layer.currentOffset.y +=
      (layer.targetOffset.y - layer.currentOffset.y) * layer.lerpFactor;

    layer.parentGroup.position.x = layer.currentOffset.x;
    layer.parentGroup.position.y = layer.currentOffset.y;
  });

  // Reset inactive layer (tier >= 2, third layer)
  if (tierLevel >= 2 && layers.length > 2) {
    const inactive = layers[2];
    inactive.currentOffset.x = 0;
    inactive.currentOffset.y = 0;
    inactive.targetOffset.x = 0;
    inactive.targetOffset.y = 0;
    inactive.parentGroup.position.x = 0;
    inactive.parentGroup.position.y = 0;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { init, tick };
