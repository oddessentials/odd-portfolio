// js/sidebar-hieroglyphs.js — WebGL sidebar overlay renderer
// Manuscript texture approach: one full-page texture per sidebar.
// Separate overlay pass (own scene + ortho camera) bypasses post-processing.
import * as THREE from 'three';
import { init as initCompositor } from './glyph-compositor.js';

let overlayScene, overlayCamera, mainRenderer;
let leftPlane, rightPlane;
let leftTexture = null, rightTexture = null;
let leftMaterial, rightMaterial;
let tierLevel = 1;
let highContrastActive = false;
const _reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const _highContrastQuery = window.matchMedia('(prefers-contrast: more)');
const prefersReducedMotion = () => _reducedMotionQuery.matches;
const gsap = window.gsap;

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Simple manuscript shader — no MSDF decode, just texture with effects
const fragmentShader = /* glsl */`
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uBreathingEnabled;
  uniform float uScanProgress;
  uniform vec2 uHoverUV;
  uniform float uRevealProgress;
  uniform float uScrollProgress;
  uniform float uTierLevel;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // Offset texture ~15% from top, fill remaining space
    vec2 uv = vUv;
    uv.y = (uv.y - 0.15) / 0.85;

    // Out of bounds = transparent
    if (uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Scroll parallax on the texture (subtle shift)
    float scrollOffset = (uTierLevel < 2.0) ? uScrollProgress * 0.03 : 0.0;
    uv.y += scrollOffset;
    uv = clamp(uv, 0.0, 1.0);

    // Sample manuscript texture
    vec4 texColor = texture2D(uTexture, uv);

    // Convert to luminance for brass tinting
    float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

    // Brass tint the manuscript
    vec3 brassColor = vec3(0.7, 0.55, 0.3) * lum;

    // Edge glow on bright areas
    float edge = smoothstep(0.3, 0.6, lum);
    vec3 edgeGlow = vec3(0.8, 0.66, 0.3) * edge * 0.3;

    vec3 color = brassColor + edgeGlow;
    float alpha = lum * uOpacity;

    // --- Animated effects (preserved from original) ---

    // Breathing light (5s sinusoidal luminance)
    if (uTierLevel < 3.0) {
      float breathing = 1.0 + uBreathingEnabled * 0.08 * sin(uTime * 1.2566);
      color *= breathing;
    }

    // Hover brightening (radial falloff from uHoverUV)
    float hoverDist = distance(vUv, uHoverUV);
    float hoverBright = 1.0 + 0.3 * smoothstep(0.15, 0.0, hoverDist);
    color *= hoverBright;
    alpha *= hoverBright;

    // Event-triggered scan-line sweep
    if (uScanProgress > 0.0 && uScanProgress < 1.0) {
      float scan = smoothstep(0.0, 0.02, 1.0 - abs(vUv.y - uScanProgress)) * 0.3;
      color += vec3(0.4, 0.6, 0.3) * scan;
    }

    // Reveal wipe: bottom-to-top
    float revealMask = smoothstep(0.0, 0.05, uRevealProgress - (1.0 - vUv.y));
    alpha *= revealMask;

    gl_FragColor = vec4(color, alpha);
  }
`;

function loadTextures() {
  const loader = new THREE.TextureLoader();
  loader.load('assets/sidebar-glyphs-left.png', (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    leftTexture = tex;
    if (leftMaterial) leftMaterial.uniforms.uTexture.value = tex;
    updatePositions();
  }, undefined, (err) => {
    console.warn('[Arcane Console] Failed to load left sidebar texture:', err);
  });
  loader.load('assets/sidebar-glyphs-right.png', (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    rightTexture = tex;
    if (rightMaterial) rightMaterial.uniforms.uTexture.value = tex;
    updatePositions();
  }, undefined, (err) => {
    console.warn('[Arcane Console] Failed to load right sidebar texture:', err);
  });
}

function createMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBreathingEnabled: { value: prefersReducedMotion() ? 0.0 : 1.0 },
      uScanProgress: { value: 0.0 },
      uHoverUV: { value: new THREE.Vector2(-1, -1) },
      uRevealProgress: { value: 0.0 },
      uScrollProgress: { value: 0.0 },
      uTierLevel: { value: 1.0 },
      uOpacity: { value: 0.55 }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
}

function createPlanes() {
  leftMaterial = createMaterial();
  rightMaterial = createMaterial();
  const geo = new THREE.PlaneGeometry(1, 1);
  leftPlane = new THREE.Mesh(geo, leftMaterial);
  overlayScene.add(leftPlane);
  rightPlane = new THREE.Mesh(geo.clone(), rightMaterial);
  overlayScene.add(rightPlane);
}

function updatePositions() {
  if (!overlayCamera || !mainRenderer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (w < 768 || highContrastActive) {
    if (leftPlane) leftPlane.visible = false;
    if (rightPlane) rightPlane.visible = false;
    return;
  }

  overlayCamera.right = w;
  overlayCamera.top = h;
  overlayCamera.updateProjectionMatrix();

  const leftPanel = document.querySelector('#constellation-nav');
  const rightPanel = document.querySelector('#status-panel');

  if (leftPlane) {
    if (leftPanel) {
      const rect = leftPanel.getBoundingClientRect();
      const texW = leftTexture ? leftTexture.image.width : rect.width;
      const texH = leftTexture ? leftTexture.image.height : rect.height;
      leftPlane.visible = true;
      leftPlane.position.x = rect.left + rect.width / 2;
      leftPlane.position.y = h - (rect.top + texH * 0.9 / 2);
      leftPlane.scale.set(texW * 0.9, texH * 0.9, 1);
      leftMaterial.uniforms.uResolution.value.set(texW * 0.9, texH * 0.9);
    } else {
      leftPlane.visible = false;
    }
  }
  if (rightPlane) {
    if (rightPanel) {
      const rect = rightPanel.getBoundingClientRect();
      const texW = rightTexture ? rightTexture.image.width : rect.width;
      const texH = rightTexture ? rightTexture.image.height : rect.height;
      rightPlane.visible = true;
      rightPlane.position.x = rect.left + rect.width / 2;
      rightPlane.position.y = h - (rect.top + texH * 0.9 / 2);
      rightPlane.scale.set(texW * 0.9, texH * 0.9, 1);
      rightMaterial.uniforms.uResolution.value.set(texW * 0.9, texH * 0.9);
    } else {
      rightPlane.visible = false;
    }
  }
}

function triggerScanLine() {
  if (!gsap || !leftMaterial || !rightMaterial) return;
  if (prefersReducedMotion() || tierLevel >= 2) return;
  gsap.fromTo(leftMaterial.uniforms.uScanProgress,
    { value: 0 }, { value: 1, duration: 0.8, ease: 'power2.inOut' });
  gsap.fromTo(rightMaterial.uniforms.uScanProgress,
    { value: 0 }, { value: 1, duration: 0.8, ease: 'power2.inOut' });
}

function setHighContrast(active) {
  highContrastActive = active;
  if (leftPlane) leftPlane.visible = !active;
  if (rightPlane) rightPlane.visible = !active;
  if (!active) updatePositions();
}

function init({ renderer }) {
  mainRenderer = renderer;
  if (window.innerWidth < 768) return;

  overlayScene = new THREE.Scene();
  overlayCamera = new THREE.OrthographicCamera(
    0, window.innerWidth, window.innerHeight, 0, -1, 1
  );

  loadTextures();
  createPlanes();
  // Force reveal visible for testing
  leftMaterial.uniforms.uRevealProgress.value = 1.0;
  rightMaterial.uniforms.uRevealProgress.value = 1.0;
  initCompositor({ left: leftMaterial, right: rightMaterial });

  highContrastActive = _highContrastQuery.matches;
  updatePositions();

  window.addEventListener('resize', updatePositions);
  document.addEventListener('tier-change', (e) => {
    tierLevel = e.detail.tier;
    if (leftMaterial) leftMaterial.uniforms.uTierLevel.value = tierLevel;
    if (rightMaterial) rightMaterial.uniforms.uTierLevel.value = tierLevel;
  });
  document.addEventListener('zone-change', triggerScanLine);
  document.addEventListener('terminal-scan-complete', triggerScanLine);

  renderer.domElement.addEventListener('webglcontextrestored', () => {
    if (leftTexture) leftTexture.needsUpdate = true;
    if (rightTexture) rightTexture.needsUpdate = true;
  });
}

function render() {
  if (!overlayScene || !overlayCamera || !mainRenderer) return;
  if (window.innerWidth < 768) return;
  const h = window.innerHeight;
  const dpr = mainRenderer.getPixelRatio();
  mainRenderer.autoClear = false;
  mainRenderer.clearDepth();

  // Scissor each plane to its panel rect to clip overflow
  const panels = [
    { plane: leftPlane, el: document.querySelector('#constellation-nav') },
    { plane: rightPlane, el: document.querySelector('#status-panel') }
  ];
  mainRenderer.setScissorTest(true);
  for (const { plane, el } of panels) {
    if (!plane || !plane.visible || !el) continue;
    const rect = el.getBoundingClientRect();
    mainRenderer.setScissor(
      rect.left * dpr,
      (h - rect.bottom) * dpr,
      rect.width * dpr,
      rect.height * dpr
    );
    mainRenderer.render(overlayScene, overlayCamera);
  }
  mainRenderer.setScissorTest(false);
  mainRenderer.autoClear = true;
}

function tick(elapsed) {
  if (!leftMaterial || !rightMaterial) return;

  if (tierLevel >= 3) {
    leftMaterial.uniforms.uBreathingEnabled.value = 0.0;
    rightMaterial.uniforms.uBreathingEnabled.value = 0.0;
    return;
  }

  leftMaterial.uniforms.uTime.value = elapsed;
  rightMaterial.uniforms.uTime.value = elapsed;
}

function getMaterials() { return { leftMaterial, rightMaterial }; }

export { init, tick, render, triggerScanLine, setHighContrast, getMaterials };
