// js/burst.js — Supernova burst pool system (extracted from performance.js)
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let burstContainer = null;
let burstPool = [];
let burstPoolReady = false;

// ---------------------------------------------------------------------------
// Supernova Burst — pre-allocated particle pool
// ---------------------------------------------------------------------------
function ensureBurstPool(sceneRef) {
  if (burstPoolReady) return;

  burstContainer = new THREE.Group();
  burstContainer.name = 'burstPool';
  sceneRef.add(burstContainer);

  for (let i = 0; i < 60; i++) {
    const mat = new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0, 0, 0);
    sprite.visible = false;
    sprite.userData.poolIndex = i;
    burstContainer.add(sprite);
    burstPool.push(sprite);
  }

  burstPoolReady = true;
}

function createSupernovaBurst(starWorldPosition, accentColor) {
  const gsap = window.gsap;
  if (!gsap) return;
  if (!burstPoolReady) return;

  const color = new THREE.Color(accentColor);
  let poolIdx = 0;

  function acquireSprite() {
    if (poolIdx >= burstPool.length) return null;
    const s = burstPool[poolIdx++];
    s.visible = true;
    s.material.opacity = 1;
    s.material.color.copy(color);
    s.position.copy(starWorldPosition);
    s.scale.set(0.01, 0.01, 0.01);
    return s;
  }

  function releaseAll() {
    for (let i = 0; i < poolIdx; i++) {
      const s = burstPool[i];
      s.visible = false;
      s.material.opacity = 0;
      s.scale.set(0, 0, 0);
      s.position.set(0, 0, 0);
    }
  }

  // 20 spark sprites (radial outward)
  for (let i = 0; i < 20; i++) {
    const sprite = acquireSprite();
    if (!sprite) break;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 0.4;
    const dx = radius * Math.sin(phi) * Math.cos(theta);
    const dy = radius * Math.sin(phi) * Math.sin(theta);
    const dz = radius * Math.cos(phi);

    const startSize = 0.02 + Math.random() * 0.02;
    sprite.scale.set(startSize, startSize, startSize);

    gsap.to(sprite.position, {
      x: starWorldPosition.x + dx,
      y: starWorldPosition.y + dy,
      z: starWorldPosition.z + dz,
      duration: 0.6,
      ease: 'power2.out'
    });
    gsap.to(sprite.material, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in'
    });
  }

  // 1 expanding ring sprite
  const ring = acquireSprite();
  if (ring) {
    ring.material.color.set(0xffffff);
    ring.scale.set(0.01, 0.01, 0.01);
    ring.material.opacity = 0.8;
    gsap.to(ring.scale, {
      x: 0.5, y: 0.5, z: 0.5,
      duration: 0.6, ease: 'power2.out'
    });
    gsap.to(ring.material, {
      opacity: 0, duration: 0.6, ease: 'power2.in'
    });
  }

  // 10 radial ray sprites
  for (let i = 0; i < 10; i++) {
    const sprite = acquireSprite();
    if (!sprite) break;

    const angle = (i / 10) * Math.PI * 2;
    const rayLen = 0.3 + Math.random() * 0.2;
    const dx = rayLen * Math.cos(angle);
    const dy = rayLen * Math.sin(angle);

    sprite.scale.set(0.005, 0.04, 0.005);
    sprite.material.opacity = 0.9;

    gsap.to(sprite.position, {
      x: starWorldPosition.x + dx,
      y: starWorldPosition.y + dy,
      z: starWorldPosition.z,
      duration: 0.45, ease: 'power2.out'
    });
    gsap.to(sprite.scale, {
      x: 0.002, y: 0.06, z: 0.002,
      duration: 0.45, ease: 'power2.out'
    });
    gsap.to(sprite.material, {
      opacity: 0, duration: 0.5, delay: 0.15, ease: 'power2.in'
    });
  }

  gsap.delayedCall(0.9, releaseAll);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { ensureBurstPool, createSupernovaBurst };
