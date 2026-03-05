// js/constellation-lines.js — SVG constellation lines connecting related project nodes (T034-T043)
import * as THREE from 'three';
import { project3DtoScreen, camera, renderer, starNodes } from './scene.js';
import { CONSTELLATION_ZONES } from './data.js';

const gsap = window.gsap;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let svgContainer = null;
let activeLines = [];
let currentZoneIndex = -1;
let tierLevel = 1;
let fadeSequence = 0; // race condition guard for zone transitions

// Reusable vectors for per-frame tick (avoid GC pressure)
const _wPos1 = new THREE.Vector3();
const _wPos2 = new THREE.Vector3();

// ---------------------------------------------------------------------------
// T034-T035: init — create SVG container, wire event listeners
// ---------------------------------------------------------------------------
function init() {
  const ns = 'http://www.w3.org/2000/svg';
  svgContainer = document.createElementNS(ns, 'svg');
  svgContainer.setAttribute('class', 'constellation-lines');
  svgContainer.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:23;';
  svgContainer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(svgContainer);

  // Listen for zone-change (dispatched by scroll-zones.js)
  document.addEventListener('zone-change', onZoneChange);

  // Listen for tier-change (dispatched by performance.js)
  document.addEventListener('tier-change', (e) => {
    tierLevel = e.detail.tier;
  });

  // Register own GSAP ticker for position updates + pulse
  const startTime = performance.now();
  gsap.ticker.add(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    tick();
    updatePulse(elapsed);
  });
}

// ---------------------------------------------------------------------------
// T036: Zone-change handler
// ---------------------------------------------------------------------------
function onZoneChange(e) {
  const { zoneIndex, zone } = e.detail;

  if (zoneIndex === currentZoneIndex) return;

  // Increment sequence to invalidate stale fadeOut callbacks
  const seq = ++fadeSequence;

  // Fade out existing lines, then build new ones
  if (activeLines.length > 0) {
    fadeOutLines(() => {
      if (seq !== fadeSequence) return; // stale callback — newer zone change superseded
      clearLines();
      if (zoneIndex >= 0 && zone) {
        currentZoneIndex = zoneIndex;
        createZoneLines(zone);
      } else {
        currentZoneIndex = -1;
      }
    });
  } else {
    currentZoneIndex = zoneIndex;
    if (zoneIndex >= 0 && zone) {
      createZoneLines(zone);
    }
  }
}

// ---------------------------------------------------------------------------
// createZoneLines — chain topology: N-1 lines for N projects
// ---------------------------------------------------------------------------
function createZoneLines(zone) {
  if (!starNodes || !camera || !renderer) return;

  const ns = 'http://www.w3.org/2000/svg';
  const projectStars = zone.projectIds
    .map(id => starNodes.find(s => s.userData.project.id === id))
    .filter(Boolean);

  // Need at least 2 stars to draw a line
  if (projectStars.length < 2) return;

  for (let i = 0; i < projectStars.length - 1; i++) {
    const line = document.createElementNS(ns, 'line');
    const r = Math.round(zone.nebulaHueRgb[0] * 255);
    const g = Math.round(zone.nebulaHueRgb[1] * 255);
    const b = Math.round(zone.nebulaHueRgb[2] * 255);
    const color = `rgb(${r}, ${g}, ${b})`;
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-opacity', '0.5');

    const star1 = projectStars[i];
    const star2 = projectStars[i + 1];

    svgContainer.appendChild(line);
    activeLines.push({ element: line, star1, star2 });

    // T037: Draw-on animation
    animateDrawOn(line, star1, star2);
  }
}

// ---------------------------------------------------------------------------
// T037: Draw-on animation — stroke-dashoffset reveal
// ---------------------------------------------------------------------------
function animateDrawOn(line, star1, star2) {
  star1.getWorldPosition(_wPos1);
  star2.getWorldPosition(_wPos2);
  const s1 = project3DtoScreen(_wPos1, camera, renderer.domElement);
  const s2 = project3DtoScreen(_wPos2, camera, renderer.domElement);

  line.setAttribute('x1', s1.x);
  line.setAttribute('y1', s1.y);
  line.setAttribute('x2', s2.x);
  line.setAttribute('y2', s2.y);

  const dx = s2.x - s1.x;
  const dy = s2.y - s1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (prefersReducedMotion()) {
    // Show instantly — no animation
    return;
  }

  line.setAttribute('stroke-dasharray', length);
  line.setAttribute('stroke-dashoffset', length);

  gsap.to(line, {
    attr: { 'stroke-dashoffset': 0 },
    duration: 0.6,
    ease: 'power2.out'
  });
}

// ---------------------------------------------------------------------------
// T038: Zone transition choreography — fade out existing lines
// ---------------------------------------------------------------------------
function fadeOutLines(callback) {
  if (prefersReducedMotion() || activeLines.length === 0) {
    clearLines();
    if (callback) callback();
    return;
  }

  const elements = activeLines.map(l => l.element);
  gsap.to(elements, {
    attr: { 'stroke-opacity': 0 },
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      clearLines();
      if (callback) callback();
    }
  });
}

function clearLines() {
  activeLines.forEach(l => l.element.remove());
  activeLines = [];
}

// ---------------------------------------------------------------------------
// T039: Pulse/glow — subtle opacity oscillation (only when tierLevel < 2)
// ---------------------------------------------------------------------------
function updatePulse(elapsed) {
  if (prefersReducedMotion() || tierLevel >= 2) return;
  if (activeLines.length === 0) return;

  const pulse = 0.4 + 0.15 * Math.sin(elapsed * 2);
  activeLines.forEach(l => {
    l.element.setAttribute('stroke-opacity', pulse);
  });
}

// ---------------------------------------------------------------------------
// T040: Tick — update SVG line endpoints to track star world positions
// ---------------------------------------------------------------------------
function tick() {
  if (activeLines.length === 0) return;
  if (!camera || !renderer) return;

  activeLines.forEach(l => {
    l.star1.getWorldPosition(_wPos1);
    l.star2.getWorldPosition(_wPos2);
    const s1 = project3DtoScreen(_wPos1, camera, renderer.domElement);
    const s2 = project3DtoScreen(_wPos2, camera, renderer.domElement);
    l.element.setAttribute('x1', s1.x);
    l.element.setAttribute('y1', s1.y);
    l.element.setAttribute('x2', s2.x);
    l.element.setAttribute('y2', s2.y);
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { init };
