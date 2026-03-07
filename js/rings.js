// js/rings.js — Saturn-type procedural rings for featured stars
import * as THREE from 'three';

const RING_STAR_IDS = ['ado-git-repo-insights', 'socialmedia-syndicator'];
// Each ring band: [innerScale, outerScale] relative to star baseScale
const RING_BANDS = [
  [0.65, 0.67],
  [0.72, 0.74],
  [0.81, 0.84],
];
const BASE_OPACITY = 0.4;
const ROTATION_SPEED = 0.002; // ~6 deg/sec

const rings = [];
let reducedMotion = false;

const ringVertexShader = /* glsl */`
  varying vec2 vUv;
  varying float vRadial;
  void main() {
    vUv = uv;
    // RingGeometry UV.x maps 0..1 from inner to outer radius
    vRadial = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform vec3 uZoneColor;
  uniform float uZoneInfluence;
  uniform float uOpacity;

  varying vec2 vUv;
  varying float vRadial;

  void main() {
    // Subtle radial variation — gentle luminance ripple, not dark gaps
    float band = 0.8 + 0.2 * sin(vRadial * 18.85);

    // Soft edge fade — tight ramp for thin bands
    float edgeInner = smoothstep(0.0, 0.1, vRadial);
    float edgeOuter = smoothstep(1.0, 0.9, vRadial);
    float edge = edgeInner * edgeOuter;

    // Time-based shimmer
    float shimmer = 0.9 + 0.1 * sin(uTime * 2.0 + vRadial * 6.283);

    // Zone color influence
    vec3 color = mix(uBaseColor, uBaseColor + uZoneColor * 0.4, uZoneInfluence);

    float alpha = band * edge * shimmer * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

function init({ starNodes, starGroup }) {
  if (window.innerWidth < 768) return;

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
    reducedMotion = e.matches;
  });

  starNodes.forEach(node => {
    const project = node.userData.project;
    if (!project || !RING_STAR_IDS.includes(project.id)) return;

    const baseScale = node.userData.baseScale;
    const tiltRad = (25 + Math.random() * 10) * Math.PI / 180;

    RING_BANDS.forEach(([innerMul, outerMul]) => {
      const geo = new THREE.RingGeometry(baseScale * innerMul, baseScale * outerMul, 64, 1);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: new THREE.Color(project.accentColor) },
          uZoneColor: { value: new THREE.Color(0, 0, 0) },
          uZoneInfluence: { value: 0 },
          uOpacity: { value: 0 }
        },
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(node.position);
      mesh.rotation.x = tiltRad;

      mesh.userData = {
        parentStar: node,
        parentProject: project,
        isRing: true,
        _targetOpacity: 0
      };

      starGroup.add(mesh);
      rings.push(mesh);
    });
  });

  // Event listeners
  document.addEventListener('zone-change', onZoneChange);
  document.addEventListener('tier-change', onTierChange);
  document.addEventListener('panel-open', () => setVisible(false));
  document.addEventListener('panel-close', () => setVisible(true));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const hidden = window.innerWidth < 768;
      rings.forEach(r => { r.visible = !hidden; });
    }, 150);
  });
}

function tick(elapsed) {
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    if (!ring.visible) continue;

    const parent = ring.userData.parentStar;

    // Sync position with parent star (handles scroll-zone scale shifts)
    ring.position.copy(parent.position);

    // Slow Z-axis rotation (skip if reduced motion)
    if (!reducedMotion) {
      ring.rotation.z += ROTATION_SPEED;
    }

    // Update time uniform for shimmer
    ring.material.uniforms.uTime.value = reducedMotion ? 0 : elapsed;

    // Pulse opacity synced with parent star pulse phase
    if (!reducedMotion && parent.userData.phaseOffset !== undefined) {
      const pulse = 0.85 + 0.15 * Math.sin(elapsed * 1.2 + parent.userData.phaseOffset);
      ring.material.uniforms.uOpacity.value = ring.userData._targetOpacity * pulse;
    }
  }
}

function onZoneChange(e) {
  const gsap = window.gsap;
  if (!gsap) return;
  const zone = e.detail.zone;
  const rgb = zone ? zone.nebulaHueRgb : [0, 0, 0];
  const influence = zone ? 1.0 : 0.0;

  rings.forEach(ring => {
    gsap.to(ring.material.uniforms.uZoneColor.value, {
      r: rgb[0], g: rgb[1], b: rgb[2], duration: 0.6, ease: 'power2.out'
    });
    gsap.to(ring.material.uniforms.uZoneInfluence, {
      value: influence, duration: 0.6, ease: 'power2.out'
    });
  });
}

function onTierChange(e) {
  const tier = e.detail?.tier ?? 1;
  rings.forEach(ring => {
    if (tier >= 3) {
      ring.visible = false;
    } else {
      ring.visible = true;
      const opacity = tier >= 2 ? BASE_OPACITY * 0.5 : BASE_OPACITY;
      ring.userData._targetOpacity = opacity;
      ring.material.uniforms.uOpacity.value = opacity;
    }
  });
}

function setVisible(show) {
  rings.forEach(r => { r.visible = show; });
}

function getRings() {
  return rings;
}

export { init, tick, getRings };
