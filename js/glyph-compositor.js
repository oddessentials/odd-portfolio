// js/glyph-compositor.js — Glyph atlas composition logic for sidebar overlay
// T029-T031: Atlas UV selection, guard-padded clamping, hover/scroll setters
import { GLYPH_ATLAS_CELLS } from './data.js';

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
// Fragment shader — atlas-based glyph composition
// ---------------------------------------------------------------------------
export const fragmentShader = /* glsl */`
  uniform sampler2D uMsdf;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uBreathingEnabled;
  uniform float uScanProgress;
  uniform float uTexelSize;
  uniform vec2 uHoverUV;
  uniform float uRevealProgress;
  uniform float uTierLevel;
  uniform float uIsRightPanel;

  varying vec2 vUv;

  // MSDF decode: median of three channels
  float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
  }

  // Pseudo-random hash for per-tile glyph selection
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Atlas cell constants
    vec2 cellSize = vec2(0.25, 0.5);
    float guardH = 0.0078125;  // 4/512
    float guardV = 0.015625;   // 4/256

    // Tiling and glyph selection
    float tileSize;
    vec2 tileUV, tileIdx;
    float glyphIndex;

    // Per-tile organic imperfection values (T035)
    float opacityVar = 1.0;
    float thresholdVar = 0.0;

    if (uIsRightPanel > 0.5) {
      // T041: Right panel — single large Architect watermark (cell 0)
      // Same square-in-screen-space correction as left panel
      float aspect = uResolution.x / uResolution.y;
      tileSize = 0.7;
      vec2 tileScale = vec2(tileSize, tileSize * aspect);
      vec2 centered = vUv - 0.5;
      tileUV = centered / tileScale + 0.5;
      tileUV = clamp(tileUV, 0.0, 1.0);
      tileIdx = vec2(0.0);
      glyphIndex = 0.0;  // Architect (135)
    } else {
      // Left panel — varied tiled glyphs from 8-glyph atlas
      // Make tiles square in screen space (sidebar is tall and narrow)
      float aspect = uResolution.x / uResolution.y;
      tileSize = 0.45;
      vec2 tileScale = vec2(tileSize, tileSize * aspect);  // compress Y by aspect ratio
      tileUV = fract(vUv / tileScale);
      tileIdx = floor(vUv / tileScale);
      glyphIndex = floor(hash21(tileIdx) * 8.0);
      glyphIndex = clamp(glyphIndex, 0.0, 7.0);

      // --- Per-tile organic imperfection (T035) ---
      float tileHash  = hash21(tileIdx);
      float tileHash2 = hash21(tileIdx + vec2(73.7, 19.3));
      float tileHash3 = hash21(tileIdx + vec2(41.1, 97.5));
      float tileHash4 = hash21(tileIdx + vec2(13.9, 67.2));

      // Rotation jitter: +/-1.5 degrees (0.02618 rad)
      float jitterAngle = (tileHash2 - 0.5) * 0.05236;
      float cj = cos(jitterAngle);
      float sj = sin(jitterAngle);
      vec2 centered = tileUV - 0.5;
      tileUV = vec2(cj * centered.x - sj * centered.y,
                    sj * centered.x + cj * centered.y) + 0.5;

      // Position offset: +/-1%
      tileUV += (vec2(tileHash3, tileHash4) - 0.5) * 0.02;
      tileUV = clamp(tileUV, 0.0, 1.0);

      // Scale variation: +/-3%
      float scaleVar = 1.0 + (tileHash - 0.5) * 0.06;
      tileUV = (tileUV - 0.5) * scaleVar + 0.5;
      tileUV = clamp(tileUV, 0.0, 1.0);

      // Opacity heterogeneity: 60-100% of target
      opacityVar = 0.6 + tileHash2 * 0.4;

      // MSDF threshold variation: +/-0.02 per tile
      thresholdVar = (tileHash3 - 0.5) * 0.04;
    }

    // Atlas cell offset: 4 columns x 2 rows
    vec2 cellOffset = vec2(mod(glyphIndex, 4.0), floor(glyphIndex / 4.0)) * cellSize;

    // Guard-padded bounds
    vec2 guardMin = cellOffset + vec2(guardH, guardV);
    vec2 guardMax = cellOffset + cellSize - vec2(guardH, guardV);

    // Map tile UV [0,1] to atlas UV within guard-padded cell bounds
    vec2 atlasUV = mix(guardMin, guardMax, tileUV);
    atlasUV = clamp(atlasUV, guardMin, guardMax);

    // MSDF sampling
    vec3 msdf = texture2D(uMsdf, atlasUV).rgb;
    float sd = median(msdf.r, msdf.g, msdf.b);

    // Apply per-tile MSDF threshold variation (T035)
    sd += thresholdVar;

    // Screen-space derivative for anti-aliasing
    // screenPxRange denominator = 128.0 (cell size, NOT atlas size)
    float tilePx = tileSize * uResolution.y;
    float hoverProximity = smoothstep(0.15, 0.0, distance(vUv, uHoverUV));
    float screenPxRange = mix(4.0, 6.0, hoverProximity) * tilePx / 128.0;
    float screenPxDistance = screenPxRange * (sd - 0.5);
    float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

    // Normal perturbation via finite differences (carved depth)
    // All 4 samples clamped within cell guard-padded bounds (FR-028)
    float h = uTexelSize;
    vec2 sampleL = clamp(atlasUV + vec2(-h, 0.0), guardMin, guardMax);
    vec2 sampleR = clamp(atlasUV + vec2( h, 0.0), guardMin, guardMax);
    vec2 sampleU = clamp(atlasUV + vec2(0.0,  h), guardMin, guardMax);
    vec2 sampleD = clamp(atlasUV + vec2(0.0, -h), guardMin, guardMax);

    vec3 normal;
    if (uTierLevel < 3.0) {
      // Tier 1 & 2: normal perturbation active
      vec3 sL = texture2D(uMsdf, sampleL).rgb;
      float sdL = median(sL.r, sL.g, sL.b);
      vec3 sR = texture2D(uMsdf, sampleR).rgb;
      float sdR = median(sR.r, sR.g, sR.b);
      vec3 sU = texture2D(uMsdf, sampleU).rgb;
      float sdU = median(sU.r, sU.g, sU.b);
      vec3 sD = texture2D(uMsdf, sampleD).rgb;
      float sdD = median(sD.r, sD.g, sD.b);
      normal = normalize(vec3((sdL - sdR) * 5.0, (sdU - sdD) * 5.0, 0.15));
    } else {
      // Tier 3: flat shading (drop 4-tap finite-difference)
      normal = vec3(0.0, 0.0, 1.0);
    }

    // Cavity darkening (AO in carved region)
    float cavity = smoothstep(0.0, 0.3, sd);

    // Edge highlight (brass glint at transition)
    float edge = 1.0 - smoothstep(0.0, 0.08, abs(sd - 0.5));
    vec3 edgeColor = vec3(0.9, 0.75, 0.4) * edge * 1.5;

    // Base color: warm brass etching — bright enough to read on dark background
    vec3 baseColor = vec3(0.7, 0.55, 0.3);
    vec3 etchColor = baseColor * (0.3 + alpha * 0.7) * cavity;

    // Simple directional light for normal response
    vec3 lightDir = normalize(vec3(0.3, 0.5, 1.0));
    float diffuse = max(dot(normal, lightDir), 0.0);

    // --- Three-layer opacity constants (T034) ---
    float glyphOpacity = 0.45;        // Layer 1: glyph watermarks — visible etching
    float annotationOpacity = 0.25;   // Layer 2: annotation fragments
    float constructionOpacity = 0.08; // Layer 3: construction lines

    // --- Procedural construction lines (T033, FR-021) ---
    float phi = 1.618033988749895;

    // Phi-grid: horizontal + vertical lines
    float gridLine = 0.0;
    float phiY1 = mod(vUv.y * phi * 3.0, 1.0);
    gridLine += smoothstep(0.01, 0.0, abs(phiY1 - 0.5));
    float phiX1 = mod(vUv.x * phi * 2.0, 1.0);
    gridLine += smoothstep(0.01, 0.0, abs(phiX1 - 0.5));

    // Compass arcs at R0/Ri radii — concentric circles per tile (Tier 1 only)
    float arcLine = 0.0;
    if (uTierLevel < 2.0) {
      vec2 tileCtr = tileUV - 0.5;
      float dist = length(tileCtr);
      float r0 = 0.433; // R0 scaled to tile: 130/300
      float ri = 0.268; // Ri scaled to tile: 80.3/300
      arcLine += smoothstep(0.008, 0.0, abs(dist - r0));
      arcLine += smoothstep(0.008, 0.0, abs(dist - ri));
      arcLine += smoothstep(0.008, 0.0, abs(dist - r0 / phi));
    }

    // Diagonal construction lines at 45 degrees (Tier 1 only)
    float diagLine = 0.0;
    if (uTierLevel < 2.0) {
      float diag1 = mod((vUv.x + vUv.y) * 5.0, 1.0);
      diagLine += smoothstep(0.008, 0.0, abs(diag1 - 0.5));
      float diag2 = mod((vUv.x - vUv.y) * 5.0, 1.0);
      diagLine += smoothstep(0.008, 0.0, abs(diag2 - 0.5));
    }

    // Grid tick marks at phi subdivisions (Tier 1 & 2 only)
    float tickLine = 0.0;
    if (uTierLevel < 3.0) {
      float phiY2 = mod(vUv.y * phi * phi * 5.0, 1.0);
      float phiX2 = mod(vUv.x * phi * phi * 5.0, 1.0);
      float nearVertGrid = smoothstep(0.03, 0.0, abs(phiX1 - 0.5));
      tickLine += smoothstep(0.006, 0.0, abs(phiY2 - 0.5)) * nearVertGrid;
      float nearHorzGrid = smoothstep(0.03, 0.0, abs(phiY1 - 0.5));
      tickLine += smoothstep(0.006, 0.0, abs(phiX2 - 0.5)) * nearHorzGrid;
    }

    // Construction line color (gold-brass, FR-023)
    float totalConstruction = gridLine + arcLine + diagLine + tickLine;
    vec3 gridColor = vec3(0.5, 0.4, 0.25) * totalConstruction * constructionOpacity;

    // --- Three-layer combine (T034) ---
    // Layer 1: glyph watermarks at 8-10% with per-tile opacity variation
    vec3 glyphColor = etchColor * (0.5 + diffuse * 0.5) + edgeColor;
    float glyphAlpha = alpha * glyphOpacity * opacityVar;

    // Layer 2: annotation fragments (edge detail) at 4-7%
    float annotAlpha = edge * annotationOpacity * opacityVar;

    // Layer 3: construction lines at 3-5%
    float constructAlpha = totalConstruction * constructionOpacity;

    // Final composite
    vec3 color = glyphColor + gridColor;
    float finalAlpha = max(max(glyphAlpha, annotAlpha), constructAlpha);

    // T041: Right panel Architect watermark at 6-8% opacity (override layers)
    if (uIsRightPanel > 0.5) {
      finalAlpha = alpha * 0.35;
    }

    // --- Animated effects ---
    // Breathing light (5s sinusoidal luminance) — disabled at Tier 3
    float breathing = 1.0;
    if (uTierLevel < 3.0) {
      breathing = 1.0 + uBreathingEnabled * 0.08 * sin(uTime * 1.2566);
    }
    color *= breathing;

    // Hover brightening (radial falloff from uHoverUV)
    float hoverBright = 1.0 + 0.3 * hoverProximity;
    color *= hoverBright;
    finalAlpha *= hoverBright;

    // Event-triggered scan-line sweep (zero idle cost via coherent uniform branch)
    if (uScanProgress > 0.0 && uScanProgress < 1.0) {
      float scan = smoothstep(0.0, 0.02, 1.0 - abs(vUv.y - uScanProgress)) * 0.3;
      color += vec3(0.4, 0.6, 0.3) * scan;
    }

    // Reveal wipe: bottom-to-top mask (~2 ALU)
    float revealMask = smoothstep(0.0, 0.05, uRevealProgress - (1.0 - vUv.y));
    finalAlpha *= revealMask;

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

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
