// js/reticle.js — Targeting reticle system (US2: T021–T033)
import { project3DtoScreen, camera, renderer } from './scene.js';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let svgEl = null;
let labelEl = null;
let ringEl = null;
let currentStar = null;
let isMobileFlag = false;
let reticlePos = { x: 0, y: 0 };
let transitioning = false;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const _worldPos = new THREE.Vector3(); // reused per frame

// ---------------------------------------------------------------------------
// T021-T022: Create SVG reticle programmatically
// ---------------------------------------------------------------------------
function createReticleSVG() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'reticle');
  svg.setAttribute('width', '80');
  svg.setAttribute('height', '80');
  svg.setAttribute('viewBox', '-40 -40 80 80');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText =
    'position:fixed;pointer-events:none;z-index:24;opacity:0;transition:opacity 0.1s;';

  // Outer circle
  const outer = document.createElementNS(ns, 'circle');
  outer.setAttribute('r', '32');
  outer.setAttribute('fill', 'none');
  outer.setAttribute('stroke', 'rgba(200,168,75,0.6)');
  outer.setAttribute('stroke-width', '1');
  svg.appendChild(outer);

  // Inner circle
  const inner = document.createElementNS(ns, 'circle');
  inner.setAttribute('r', '16');
  inner.setAttribute('fill', 'none');
  inner.setAttribute('stroke', 'rgba(200,168,75,0.4)');
  inner.setAttribute('stroke-width', '0.5');
  svg.appendChild(inner);

  // Cross tick marks (4 cardinal directions)
  [0, 90, 180, 270].forEach(angle => {
    const line = document.createElementNS(ns, 'line');
    const rad = (angle * Math.PI) / 180;
    const r1 = 24;
    const r2 = 32;
    line.setAttribute('x1', String(Math.cos(rad) * r1));
    line.setAttribute('y1', String(Math.sin(rad) * r1));
    line.setAttribute('x2', String(Math.cos(rad) * r2));
    line.setAttribute('y2', String(Math.sin(rad) * r2));
    line.setAttribute('stroke', 'rgba(200,168,75,0.8)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  });

  // Rotation ring (animated)
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('class', 'reticle__ring');
  ring.setAttribute('r', '28');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', 'rgba(200,168,75,0.3)');
  ring.setAttribute('stroke-width', '0.5');
  ring.setAttribute('stroke-dasharray', '4 8');
  svg.appendChild(ring);

  return { svg, ring };
}

// ---------------------------------------------------------------------------
// T028: Accessible label (DOM element, not SVG text)
// ---------------------------------------------------------------------------
function createLabel() {
  const label = document.createElement('div');
  label.className = 'reticle-label';
  label.setAttribute('role', 'tooltip');
  label.setAttribute('aria-live', 'polite');
  document.body.appendChild(label);
  return label;
}

// ---------------------------------------------------------------------------
// Helper: get star screen position
// ---------------------------------------------------------------------------
function getStarScreen(sprite) {
  sprite.getWorldPosition(_worldPos);
  return project3DtoScreen(_worldPos, camera, renderer.domElement);
}

// ---------------------------------------------------------------------------
// Position the reticle + label at reticlePos
// ---------------------------------------------------------------------------
function applyPosition() {
  if (!svgEl) return;
  svgEl.style.left = reticlePos.x - 40 + 'px';
  svgEl.style.top = reticlePos.y - 40 + 'px';

  if (labelEl) {
    labelEl.style.left = reticlePos.x + 'px';
    labelEl.style.top = reticlePos.y + 48 + 'px';
  }
}

// ---------------------------------------------------------------------------
// T024: onStarEnter — activate reticle on star hover
// ---------------------------------------------------------------------------
function onStarEnter(sprite) {
  if (isMobileFlag || !svgEl) return;

  const gsap = window.gsap;
  const newScreen = getStarScreen(sprite);

  // T025: Star-to-star transition
  if (currentStar && currentStar !== sprite) {
    if (gsap) {
      gsap.killTweensOf(reticlePos);
      if (prefersReducedMotion()) {
        reticlePos.x = newScreen.x;
        reticlePos.y = newScreen.y;
        applyPosition();
      } else {
        transitioning = true;
        gsap.to(reticlePos, {
          x: newScreen.x,
          y: newScreen.y,
          duration: 0.2,
          ease: 'power2.inOut',
          onUpdate: applyPosition,
          onComplete: () => {
            transitioning = false;
          }
        });
      }
    } else {
      reticlePos.x = newScreen.x;
      reticlePos.y = newScreen.y;
      applyPosition();
    }
  } else if (!currentStar) {
    // First star engagement — snap into position
    reticlePos.x = newScreen.x;
    reticlePos.y = newScreen.y;
    applyPosition();
  }

  currentStar = sprite;

  // Fade in reticle
  svgEl.style.opacity = '1';

  // Update label text
  if (labelEl && sprite.userData.project) {
    labelEl.textContent = sprite.userData.project.name;
    labelEl.style.opacity = '1';
  }

  // T030 + T020: Hover scale animation with reduced-motion check
  if (gsap) {
    const ud = sprite.userData;
    gsap.killTweensOf(sprite.scale);
    ud.hoverLock = true;
    if (prefersReducedMotion()) {
      const targetScale = ud.baseScale * 1.2;
      gsap.set(sprite.scale, { x: targetScale, y: targetScale, z: targetScale });
    } else {
      const targetScale = ud.baseScale * 1.6;
      gsap.to(sprite.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.2,
        ease: 'back.out(3)'
      });
    }
  }

  // T029: Dispatch reticle-activate for logo-follow handoff
  document.dispatchEvent(new CustomEvent('reticle-activate'));
}

// ---------------------------------------------------------------------------
// T026: onStarExit — deactivate reticle on star leave
// ---------------------------------------------------------------------------
function onStarExit(sprite) {
  if (isMobileFlag || !svgEl) return;

  const gsap = window.gsap;

  // T030: Hover scale reset (absorbed from scene.js handleStarExit)
  if (gsap && sprite) {
    const ud = sprite.userData;
    gsap.killTweensOf(sprite.scale);
    ud.hoverLock = false;
    gsap.to(sprite.scale, {
      x: ud.baseScale,
      y: ud.baseScale,
      z: ud.baseScale,
      duration: 0.2,
      ease: 'power2.out'
    });
  }

  // Only fade out if this is the current tracked star and no transition is happening
  if (sprite === currentStar && !transitioning) {
    // Fade out reticle
    svgEl.style.opacity = '0';

    if (labelEl) {
      labelEl.style.opacity = '0';
    }

    currentStar = null;

    // T029: Dispatch reticle-deactivate for logo-follow handoff
    document.dispatchEvent(new CustomEvent('reticle-deactivate'));
  }
}

// ---------------------------------------------------------------------------
// T025 + T027: tick — per-frame tracking + idle ring animation
// ---------------------------------------------------------------------------
function tick(elapsed) {
  if (isMobileFlag || !svgEl || !currentStar) return;

  // Update reticle position by projecting star world position to screen
  if (!transitioning) {
    const screen = getStarScreen(currentStar);
    reticlePos.x = screen.x;
    reticlePos.y = screen.y;
    applyPosition();
  }

  // T027: Idle animation — rotate the dashed ring
  if (ringEl && !prefersReducedMotion()) {
    ringEl.style.transform = `rotate(${elapsed * 30}deg)`;
  }
}

// ---------------------------------------------------------------------------
// T032: Mobile handling
// T033: Resize handling
// ---------------------------------------------------------------------------
function init() {
  isMobileFlag = window.innerWidth < 768;

  // T032: On mobile, return no-op tick — don't create SVG
  if (isMobileFlag) return;

  const { svg, ring } = createReticleSVG();
  svgEl = svg;
  ringEl = ring;
  document.body.appendChild(svgEl);

  labelEl = createLabel();

  // T033: On resize, recalculate reticle position if tracking
  window.addEventListener('resize', () => {
    isMobileFlag = window.innerWidth < 768;

    if (isMobileFlag && svgEl) {
      svgEl.style.opacity = '0';
      if (labelEl) labelEl.style.opacity = '0';
      currentStar = null;
      return;
    }

    if (currentStar && svgEl) {
      const screen = getStarScreen(currentStar);
      reticlePos.x = screen.x;
      reticlePos.y = screen.y;
      applyPosition();
    }
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { init, tick, onStarEnter, onStarExit };
