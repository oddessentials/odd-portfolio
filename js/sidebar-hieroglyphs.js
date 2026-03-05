// js/sidebar-hieroglyphs.js — WebGL sidebar hieroglyph etching overlay
// Rendered as a separate overlay pass (own scene + ortho camera) to avoid
// bloom, vignette, and tone-mapping from the main post-processing pipeline.
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let overlayScene, overlayCamera, mainRenderer;
let leftPlane, rightPlane;
let msdfTexture = null;
let leftMaterial, rightMaterial;
let tierLevel = 1;
const _reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => _reducedMotionQuery.matches;

// ---------------------------------------------------------------------------
// GLSL shaders
// ---------------------------------------------------------------------------
const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */`
  uniform sampler2D uMsdf;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uBreathingEnabled;
  uniform float uShimmerEnabled;
  uniform float uScanLineEnabled;
  uniform float uTexelSize;

  varying vec2 vUv;

  // MSDF decode: median of three channels
  float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
  }

  void main() {
    // Tiling: repeat the stamp across the sidebar
    float tileSize = 0.15;
    vec2 tileUV = fract(vUv / tileSize);
    vec2 tileIdx = floor(vUv / tileSize);

    // Rotation per tile: (cellX + cellY) % 4 -> 0, 90, 180, 270 degrees
    float rotAngle = mod(tileIdx.x + tileIdx.y, 4.0) * 1.5707963;
    float c = cos(rotAngle);
    float s = sin(rotAngle);
    vec2 centered = tileUV - 0.5;
    vec2 rotUV = vec2(c * centered.x - s * centered.y, s * centered.x + c * centered.y) + 0.5;

    // Clamp to [0,1] to prevent wrapping artifacts
    rotUV = clamp(rotUV, 0.0, 1.0);

    // MSDF sampling
    vec3 msdf = texture2D(uMsdf, rotUV).rgb;
    float sd = median(msdf.r, msdf.g, msdf.b);

    // Screen-space derivative for anti-aliasing
    float tilePx = tileSize * uResolution.y;
    float screenPxRange = 4.0 * tilePx / 256.0;
    float screenPxDistance = screenPxRange * (sd - 0.5);
    float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

    // Normal perturbation via finite differences (carved depth)
    float h = uTexelSize;
    vec3 sL = texture2D(uMsdf, rotUV + vec2(-h, 0.0)).rgb;
    float sdL = median(sL.r, sL.g, sL.b);
    vec3 sR = texture2D(uMsdf, rotUV + vec2( h, 0.0)).rgb;
    float sdR = median(sR.r, sR.g, sR.b);
    vec3 sU = texture2D(uMsdf, rotUV + vec2(0.0,  h)).rgb;
    float sdU = median(sU.r, sU.g, sU.b);
    vec3 sD = texture2D(uMsdf, rotUV + vec2(0.0, -h)).rgb;
    float sdD = median(sD.r, sD.g, sD.b);
    vec3 normal = normalize(vec3((sdL - sdR) * 5.0, (sdU - sdD) * 5.0, 0.15));

    // Cavity darkening (AO in carved region)
    float cavity = smoothstep(0.0, 0.3, sd);

    // Edge highlight (brass glint at transition)
    float edge = 1.0 - smoothstep(0.0, 0.08, abs(sd - 0.5));
    vec3 edgeColor = vec3(0.8, 0.66, 0.3) * edge * 1.0;

    // Base color: dark etching with slight warmth
    vec3 baseColor = vec3(0.12, 0.10, 0.08);
    vec3 etchColor = mix(baseColor, baseColor * 0.4, alpha) * cavity;

    // Simple directional light for normal response
    vec3 lightDir = normalize(vec3(0.3, 0.5, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0);

    // Golden ratio construction lines (procedural phi-grid)
    float phi = 1.618033988749895;
    float gridLine = 0.0;
    // Horizontal lines at phi intervals
    float phiY1 = mod(vUv.y * phi * 3.0, 1.0);
    gridLine += smoothstep(0.01, 0.0, abs(phiY1 - 0.5)) * 0.08;
    // Vertical lines
    float phiX1 = mod(vUv.x * phi * 2.0, 1.0);
    gridLine += smoothstep(0.01, 0.0, abs(phiX1 - 0.5)) * 0.06;

    vec3 gridColor = vec3(0.5, 0.4, 0.25) * gridLine;

    // Combine
    vec3 color = etchColor * (0.5 + diffuse * 0.5) + edgeColor + gridColor;
    float finalAlpha = max(alpha * 0.55, gridLine * 0.4);

    // --- Animated effects ---
    // Breathing light (5s sinusoidal luminance)
    float breathing = 1.0 + uBreathingEnabled * 0.08 * sin(uTime * 1.2566); // 2*PI/5
    color *= breathing;

    // Shimmer pass (8s traverse)
    float shimmerPos = fract(uTime / 8.0);
    float shimmer = uShimmerEnabled * smoothstep(0.0, 0.05, 1.0 - abs(vUv.y - shimmerPos)) * 0.15;
    color += vec3(0.6, 0.5, 0.3) * shimmer;

    // Scan-line sweep (once per 12s)
    float scanPos = fract(uTime / 12.0);
    float scan = uScanLineEnabled * smoothstep(0.0, 0.02, 1.0 - abs(vUv.y - scanPos)) * 0.3;
    color += vec3(0.4, 0.6, 0.3) * scan;

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

// ---------------------------------------------------------------------------
// loadMSDF — load the MSDF texture from assets/
// ---------------------------------------------------------------------------
function loadMSDF() {
  const loader = new THREE.TextureLoader();
  msdfTexture = loader.load('assets/logo_msdf.png', (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    if (leftMaterial) leftMaterial.uniforms.uMsdf.value = tex;
    if (rightMaterial) rightMaterial.uniforms.uMsdf.value = tex;
  }, undefined, (err) => {
    console.warn('[Arcane Console] Failed to load MSDF texture:', err);
  });
}

// ---------------------------------------------------------------------------
// createMaterial — factory for sidebar shader material
// ---------------------------------------------------------------------------
function createMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMsdf: { value: msdfTexture },
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBreathingEnabled: { value: prefersReducedMotion() ? 0.0 : 1.0 },
      uShimmerEnabled: { value: prefersReducedMotion() ? 0.0 : 1.0 },
      uScanLineEnabled: { value: prefersReducedMotion() ? 0.0 : 1.0 },
      uTexelSize: { value: 1.0 / 256.0 }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
}

// ---------------------------------------------------------------------------
// createPlanes — build two PlaneGeometry meshes for left + right sidebars
// ---------------------------------------------------------------------------
function createPlanes() {
  leftMaterial = createMaterial();
  rightMaterial = createMaterial();

  const geo = new THREE.PlaneGeometry(1, 1);

  leftPlane = new THREE.Mesh(geo, leftMaterial);
  overlayScene.add(leftPlane);

  rightPlane = new THREE.Mesh(geo.clone(), rightMaterial);
  overlayScene.add(rightPlane);
}

// ---------------------------------------------------------------------------
// updatePositions — sync planes to HUD panel bounding boxes (220px sidebars)
// ---------------------------------------------------------------------------
function updatePositions() {
  if (!overlayCamera || !mainRenderer) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Hide on mobile
  if (w < 768) {
    if (leftPlane) leftPlane.visible = false;
    if (rightPlane) rightPlane.visible = false;
    return;
  }

  // Update ortho camera to match viewport
  overlayCamera.right = w;
  overlayCamera.top = h;
  overlayCamera.updateProjectionMatrix();

  // Get HUD panel bounding boxes (220px sidebar panels)
  const leftPanel = document.querySelector('#constellation-nav');
  const rightPanel = document.querySelector('#status-panel');

  if (leftPlane) {
    if (leftPanel) {
      const rect = leftPanel.getBoundingClientRect();
      leftPlane.visible = true;
      leftPlane.position.x = rect.left + rect.width / 2;
      leftPlane.position.y = h - (rect.top + rect.height / 2);
      leftPlane.scale.set(rect.width, rect.height, 1);
      leftMaterial.uniforms.uResolution.value.set(rect.width, rect.height);
    } else {
      leftPlane.visible = false;
    }
  }

  if (rightPlane) {
    if (rightPanel) {
      const rect = rightPanel.getBoundingClientRect();
      rightPlane.visible = true;
      rightPlane.position.x = rect.left + rect.width / 2;
      rightPlane.position.y = h - (rect.top + rect.height / 2);
      rightPlane.scale.set(rect.width, rect.height, 1);
      rightMaterial.uniforms.uResolution.value.set(rect.width, rect.height);
    } else {
      rightPlane.visible = false;
    }
  }
}

// ---------------------------------------------------------------------------
// init — create overlay scene + ortho camera, receive main renderer
// ---------------------------------------------------------------------------
function init({ renderer }) {
  mainRenderer = renderer;

  // Skip on mobile
  if (window.innerWidth < 768) return;

  overlayScene = new THREE.Scene();
  overlayCamera = new THREE.OrthographicCamera(
    0, window.innerWidth, window.innerHeight, 0, -1, 1
  );

  loadMSDF();
  createPlanes();
  updatePositions();

  window.addEventListener('resize', updatePositions);
  document.addEventListener('tier-change', (e) => { tierLevel = e.detail.tier; });

  // WebGL context restore
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    if (msdfTexture) msdfTexture.needsUpdate = true;
  });
}

// ---------------------------------------------------------------------------
// render — overlay pass, called after main scene/composer render
// ---------------------------------------------------------------------------
function render() {
  if (!overlayScene || !overlayCamera || !mainRenderer) return;
  if (window.innerWidth < 768) return;

  mainRenderer.autoClear = false;
  mainRenderer.clearDepth();
  mainRenderer.render(overlayScene, overlayCamera);
  mainRenderer.autoClear = true;
}

// ---------------------------------------------------------------------------
// tick — called each frame from GSAP ticker with elapsed seconds
// ---------------------------------------------------------------------------
function tick(elapsed) {
  if (!leftMaterial || !rightMaterial) return;

  leftMaterial.uniforms.uTime.value = elapsed;
  rightMaterial.uniforms.uTime.value = elapsed;

  // Tier degradation
  if (tierLevel >= 2) {
    leftMaterial.uniforms.uScanLineEnabled.value = 0.0;
    rightMaterial.uniforms.uScanLineEnabled.value = 0.0;
  }
  if (tierLevel >= 3) {
    leftMaterial.uniforms.uBreathingEnabled.value = 0.0;
    rightMaterial.uniforms.uBreathingEnabled.value = 0.0;
    leftMaterial.uniforms.uShimmerEnabled.value = 0.0;
    rightMaterial.uniforms.uShimmerEnabled.value = 0.0;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { init, tick, render };
