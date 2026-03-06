// js/constellation-lines.js — SVG constellation lines (US2: T028-T040)
import * as THREE from 'three';
import { project3DtoScreen, camera, renderer, starNodes } from './scene.js';
import { CONSTELLATION_ZONES } from './data.js';

const gsap = window.gsap;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let svgContainer = null;
let watermarkGroup = null;
let activeGroup = null;
let watermarkLines = [];
let activeLines = [];
let allTrackedLines = []; // Merged for single tick() iteration
let currentZoneIndex = -1;
let fadeSequence = 0;
let showcaseTl = null; // Intro showcase timeline reference (T037)

const _wPos1 = new THREE.Vector3();
const _wPos2 = new THREE.Vector3();

// Zone visual constants (derived from CONSTELLATION_ZONES)
const ZONE_HEX = CONSTELLATION_ZONES.map(z => z.hex);
const ZONE_HEX_BRIGHT = CONSTELLATION_ZONES.map(z => z.hexBright);
const ZONE_HEX_WATERMARK = CONSTELLATION_ZONES.map(z => z.hexWatermark);

// createSVGDefs — filters + gradients per zone (T028)
function createSVGDefs() {
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');
  const el = (tag, attrs) => {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };
  for (let z = 0; z < ZONE_HEX.length; z++) {
    const filter = el('filter', { id: `zone-glow-${z}`, 'color-interpolation-filters': 'sRGB',
      x: '-50%', y: '-50%', width: '200%', height: '200%' });
    filter.appendChild(el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '3', result: 'blur' }));
    filter.appendChild(el('feFlood', { 'flood-color': ZONE_HEX[z], 'flood-opacity': '0.6', result: 'color' }));
    filter.appendChild(el('feComposite', { in: 'color', in2: 'blur', operator: 'in', result: 'coloredGlow' }));
    const merge = el('feMerge', {});
    merge.appendChild(el('feMergeNode', { in: 'coloredGlow' }));
    merge.appendChild(el('feMergeNode', { in: 'SourceGraphic' }));
    filter.appendChild(merge);
    defs.appendChild(filter);

    const grad = el('linearGradient', { id: `zone-grad-${z}`, gradientUnits: 'objectBoundingBox' });
    [[0, ZONE_HEX[z], 1], [50, ZONE_HEX_BRIGHT[z], 1], [100, ZONE_HEX[z], 0.4]].forEach(([off, col, op]) => {
      grad.appendChild(el('stop', { offset: off + '%', 'stop-color': col, 'stop-opacity': String(op) }));
    });
    defs.appendChild(grad);
  }
  svgContainer.appendChild(defs);
}

// getZoneStars — resolve zone projectIds to starNodes, excluding dead-rock
function getZoneStars(zone) {
  if (!starNodes) return [];
  return zone.projectIds
    .map(id => starNodes.find(n => n.userData.project.id === id))
    .filter(n => n && n.userData.project.status !== 'paused');
}

// initWatermarkLines — persistent dashed lines for all zones (T029)
function initWatermarkLines() {
  if (!starNodes || !svgContainer) return;
  const ns = 'http://www.w3.org/2000/svg';
  const reduced = prefersReducedMotion();

  watermarkGroup = document.createElementNS(ns, 'g');
  watermarkGroup.setAttribute('class', 'watermark-lines');
  svgContainer.appendChild(watermarkGroup);

  CONSTELLATION_ZONES.forEach((zone, zIdx) => {
    const stars = getZoneStars(zone);
    for (let i = 0; i < stars.length - 1; i++) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('stroke', ZONE_HEX_WATERMARK[zIdx]);
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-opacity', '0.20');
      if (!reduced) line.setAttribute('stroke-dasharray', '8 12');
      watermarkGroup.appendChild(line);
      watermarkLines.push({ element: line, star1: stars[i], star2: stars[i + 1], zoneIndex: zIdx });
    }
  });

  rebuildTrackedLines();
}

function rebuildTrackedLines() {
  allTrackedLines = [...watermarkLines, ...activeLines];
}

// tick — update all tracked SVG line endpoints per frame (T030)
function tick() {
  if (allTrackedLines.length === 0) return;
  if (!camera || !renderer) return;

  allTrackedLines.forEach(l => {
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

// createActiveLines — premium lines for the active zone (T031)
function createActiveLines(zone, zoneIndex) {
  if (!starNodes || !svgContainer) return;
  const ns = 'http://www.w3.org/2000/svg';
  const reduced = prefersReducedMotion();

  if (!activeGroup) {
    activeGroup = document.createElementNS(ns, 'g');
    activeGroup.setAttribute('class', 'active-lines');
    svgContainer.appendChild(activeGroup);
  }

  const stars = getZoneStars(zone);
  if (stars.length < 2) return;

  for (let i = 0; i < stars.length - 1; i++) {
    const line = document.createElementNS(ns, 'line');
    if (reduced) {
      line.setAttribute('stroke', ZONE_HEX[zoneIndex]);
    } else {
      line.setAttribute('stroke', `url(#zone-grad-${zoneIndex})`);
      line.setAttribute('filter', `url(#zone-glow-${zoneIndex})`);
    }
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-opacity', '0.7');
    activeGroup.appendChild(line);

    const entry = { element: line, star1: stars[i], star2: stars[i + 1], zoneIndex };
    activeLines.push(entry);
    animateDrawOn(line, stars[i], stars[i + 1], reduced);
  }

  rebuildTrackedLines();
}

// animateDrawOn — stroke-dashoffset reveal, then energy flow (T031-T032)
function animateDrawOn(line, star1, star2, reduced) {
  star1.getWorldPosition(_wPos1);
  star2.getWorldPosition(_wPos2);
  const s1 = project3DtoScreen(_wPos1, camera, renderer.domElement);
  const s2 = project3DtoScreen(_wPos2, camera, renderer.domElement);
  line.setAttribute('x1', s1.x);
  line.setAttribute('y1', s1.y);
  line.setAttribute('x2', s2.x);
  line.setAttribute('y2', s2.y);

  if (reduced) return;

  const dx = s2.x - s1.x;
  const dy = s2.y - s1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  line.setAttribute('stroke-dasharray', String(length));
  line.setAttribute('stroke-dashoffset', String(length));

  gsap.to(line, {
    attr: { 'stroke-dashoffset': 0 },
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => startEnergyFlow(line, length)
  });
}

// startEnergyFlow — repeating dash animation (~200px/s) (T032)
function startEnergyFlow(line, totalLength) {
  if (prefersReducedMotion()) return;
  const cycleLength = 40; // 15 + 10 + 5 + 10
  line.setAttribute('stroke-dasharray', '15 10 5 10');
  line.setAttribute('stroke-dashoffset', '0');
  gsap.to(line, {
    attr: { 'stroke-dashoffset': -cycleLength },
    duration: Math.max(0.5, totalLength / 200),
    repeat: -1,
    ease: 'none'
  });
}

// onZoneChange — watermark↔active transitions (T033)
function onZoneChange(e) {
  const { zoneIndex, zone } = e.detail;
  if (zoneIndex === currentZoneIndex) return;

  const seq = ++fadeSequence;

  if (activeLines.length > 0) {
    fadeOutActiveLines(() => {
      if (seq !== fadeSequence) return;
      clearActiveLines();
      currentZoneIndex = zoneIndex;
      if (zoneIndex >= 0 && zone) createActiveLines(zone, zoneIndex);
    });
  } else {
    currentZoneIndex = zoneIndex;
    if (zoneIndex >= 0 && zone) createActiveLines(zone, zoneIndex);
  }
}

function fadeOutActiveLines(callback) {
  if (prefersReducedMotion() || activeLines.length === 0) {
    clearActiveLines();
    if (callback) callback();
    return;
  }
  const elements = activeLines.map(l => l.element);
  gsap.to(elements, {
    attr: { 'stroke-opacity': 0 },
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      clearActiveLines();
      if (callback) callback();
    }
  });
}

function clearActiveLines() {
  activeLines.forEach(l => {
    gsap.killTweensOf(l.element);
    l.element.remove();
  });
  activeLines = [];
  rebuildTrackedLines();
}

// playIntroShowcase — rapid zone flash during reveal (T037)
function playIntroShowcase() {
  if (!gsap || !starNodes || !svgContainer) return null;
  if (prefersReducedMotion() || window.innerWidth < 768) return null;

  const ns = 'http://www.w3.org/2000/svg';
  const tempGroup = document.createElementNS(ns, 'g');
  tempGroup.setAttribute('class', 'showcase-lines');
  svgContainer.appendChild(tempGroup);

  // Build temporary preview lines for all zones
  const zoneSets = CONSTELLATION_ZONES.map((zone, zIdx) => {
    const stars = getZoneStars(zone);
    const lines = [];
    for (let i = 0; i < stars.length - 1; i++) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('stroke', ZONE_HEX[zIdx]);
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-opacity', '0');
      // Set initial positions
      stars[i].getWorldPosition(_wPos1);
      stars[i + 1].getWorldPosition(_wPos2);
      const s1 = project3DtoScreen(_wPos1, camera, renderer.domElement);
      const s2 = project3DtoScreen(_wPos2, camera, renderer.domElement);
      line.setAttribute('x1', s1.x);
      line.setAttribute('y1', s1.y);
      line.setAttribute('x2', s2.x);
      line.setAttribute('y2', s2.y);
      tempGroup.appendChild(line);
      lines.push(line);
    }
    return lines;
  });

  showcaseTl = gsap.timeline({
    onComplete: () => {
      tempGroup.remove();
      showcaseTl = null;
    }
  });

  // Flash each zone with overlapping crossfade (~1.15s total)
  zoneSets.forEach((lines, i) => {
    if (lines.length === 0) return;
    const t = i * 0.3; // 0.1s overlap between zones
    showcaseTl.to(lines, {
      attr: { 'stroke-opacity': 0.5 },
      duration: 0.15,
      ease: 'power2.out'
    }, t);
    showcaseTl.to(lines, {
      attr: { 'stroke-opacity': 0 },
      duration: 0.2,
      ease: 'power2.in'
    }, t + 0.2);
  });

  return showcaseTl;
}

// killShowcase — clean kill for skip handling (T039)
function killShowcase() {
  if (!showcaseTl) return;
  showcaseTl.kill();
  showcaseTl = null;
  const tempGroup = svgContainer && svgContainer.querySelector('.showcase-lines');
  if (tempGroup) {
    if (gsap) {
      const lines = tempGroup.querySelectorAll('line');
      gsap.to(lines, {
        attr: { 'stroke-opacity': 0 },
        duration: 0.1,
        onComplete: () => tempGroup.remove()
      });
    } else {
      tempGroup.remove();
    }
  }
}

// init — SVG container, defs, watermark, wire events (T028-T035)
function init() {
  const ns = 'http://www.w3.org/2000/svg';
  svgContainer = document.createElementNS(ns, 'svg');
  svgContainer.setAttribute('class', 'constellation-lines');
  svgContainer.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:24;';
  svgContainer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(svgContainer);

  createSVGDefs();
  initWatermarkLines();

  document.addEventListener('zone-change', onZoneChange);

  // Hide behind project overlay (T034)
  document.addEventListener('panel-open', () => { svgContainer.style.display = 'none'; });
  document.addEventListener('panel-close', () => { svgContainer.style.display = ''; });

  gsap.ticker.add(tick);
}

export { init, playIntroShowcase, killShowcase };
