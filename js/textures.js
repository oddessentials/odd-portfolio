// js/textures.js — Procedural canvas textures + 3D object factories
import * as THREE from 'three';

// Canvas-drawn star texture
function createStarTexture(hexColor, size) {
  size = size || 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, hexColor);
  gradient.addColorStop(0.15, hexColor);
  gradient.addColorStop(0.3, hexColor + 'AA');
  gradient.addColorStop(0.55, hexColor + '44');
  gradient.addColorStop(0.8, hexColor + '11');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Dust mote procedural circle texture
function createDustTexture(size) {
  size = size || 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(0.5, 'rgba(200,200,220,0.2)');
  gradient.addColorStop(1, 'rgba(200,200,220,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Random point in rectangular volume (replaces spherical sampling)
function randomVolumePoint(xRange, yRange, zRange) {
  const x = (Math.random() * 2 - 1) * xRange;
  const y = (Math.random() * 2 - 1) * yRange;
  const z = zRange[0] + Math.random() * (zRange[1] - zRange[0]);
  return [x, y, z];
}

// --- Nebula vertex shader ---
const nebulaVertexShader = /* glsl */`
  uniform float size;
  uniform float scale;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(size * (scale / -mvPosition.z), 200.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// --- Nebula fragment shader ---
const nebulaFragmentShader = /* glsl */`
  uniform vec3 uZoneColor;
  uniform float uZoneInfluence;
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * uOpacity;
    vec3 finalColor = mix(vColor, vColor + uZoneColor * 0.3, uZoneInfluence);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * Create the 3-layer nebula Points system.
 * @param {THREE.Group} nebulaGroup — group to add layers into
 * @param {boolean} isMobile
 * @param {number} dpr — device pixel ratio
 * @param {Array} PROJECTS — project data array
 * @returns {THREE.Points[]} nebulaLayers
 */
export function createNebulaSystem(nebulaGroup, isMobile, dpr, PROJECTS) {
  const nebulaLayers = [];

  // Z-bands overlap slightly for smooth parallax depth transitions (Phase 7 / T046-T047)
  const nebulaConfigs = [
    { count: isMobile ? 210 : 800, xRange: 3.5, yRange: 2.5, zRange: [-3, -1], size: 0.015, blend: THREE.AdditiveBlending, palette: ['#A9938B', '#A69AB2', '#504A58', '#33323E'] },
    { count: isMobile ? 120 : 400, xRange: 4.0, yRange: 3.0, zRange: [-1.5, 0.5], size: 0.020, blend: THREE.AdditiveBlending, palette: ['#5A787A', '#748D8A', '#18181C', '#33323E'] },
    { count: isMobile ? 70 : 300, xRange: 4.5, yRange: 3.2, zRange: [0, 2], size: 0.025, blend: THREE.NormalBlending, palette: ['#F0EDE8', '#D5D2DD', '#BAB5B0', '#18181C'] }
  ];

  const projectPositions = PROJECTS.map(p => new THREE.Vector3(p.position[0], p.position[1], p.position[2]));
  const projectColors = PROJECTS.map(p => new THREE.Color(p.accentColor));

  nebulaConfigs.forEach((cfg) => {
    const positions = new Float32Array(cfg.count * 3);
    const colors = new Float32Array(cfg.count * 3);
    const paletteColors = cfg.palette.map(c => new THREE.Color(c));
    const tmpVec = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < cfg.count; i++) {
      const [x, y, z] = randomVolumePoint(cfg.xRange, cfg.yRange, cfg.zRange);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      tmpVec.set(x, y, z);
      let minDist = Infinity;
      let nearestIdx = 0;
      for (let p = 0; p < projectPositions.length; p++) {
        const d = tmpVec.distanceTo(projectPositions[p]);
        if (d < minDist) {
          minDist = d;
          nearestIdx = p;
        }
      }
      const palIdx = Math.floor(Math.random() * paletteColors.length);
      const influence = Math.max(0, 1 - minDist * 0.5);
      tmpColor.copy(paletteColors[palIdx]).lerp(projectColors[nearestIdx], influence * 0.6);

      if (isMobile) {
        const hsl = {};
        tmpColor.getHSL(hsl);
        hsl.s = Math.min(1, hsl.s * 1.2);
        tmpColor.setHSL(hsl.h, hsl.s, hsl.l);
      }

      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const nebulaScale = window.innerHeight * dpr * 0.5;

    const mat = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      blending: cfg.blend,
      depthWrite: false,
      uniforms: {
        size: { value: cfg.size },
        scale: { value: nebulaScale },
        uZoneColor: { value: new THREE.Color(0, 0, 0) },
        uZoneInfluence: { value: 0.0 },
        uOpacity: { value: 0.8 }
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader
    });

    const points = new THREE.Points(geo, mat);
    nebulaGroup.add(points);
    nebulaLayers.push(points);
  });

  return nebulaLayers;
}

// Cluster halo texture — soft glow with no bright center
function createHaloTexture(hexColor, size) {
  size = size || 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, hexColor + '40');
  gradient.addColorStop(0.3, hexColor + '20');
  gradient.addColorStop(0.6, hexColor + '10');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Create the star node sprites for each project.
 * Clusters (isCluster === true) are created as THREE.Group with sub-point sprites.
 * @param {Array} PROJECTS — project data array
 * @returns {{ starNodes: (THREE.Sprite|THREE.Group)[], starGroup: THREE.Group }}
 */
export function createStarNodes(PROJECTS) {
  const starNodes = [];
  const starGroup = new THREE.Group();

  PROJECTS.forEach((project, idx) => {
    if (project.isCluster) {
      // --- Cluster rendering ---
      const group = new THREE.Group();
      group.position.set(project.position[0], project.position[1], project.position[2]);
      const scale = project.starSize * 0.25;

      if (project.status === 'paused') {
        // Dead rock cluster: 6 dim grey sub-points, no halo, no pulse
        const sharedTex = createStarTexture(project.accentColor, 64);
        const sharedMat = new THREE.SpriteMaterial({
          map: sharedTex, transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false, opacity: 0.20
        });
        const offsets = [
          [0.05, 0.03], [-0.04, 0.06], [0.06, -0.02],
          [-0.06, -0.04], [0.02, -0.06], [-0.03, 0.05]
        ];
        offsets.forEach(([ox, oy]) => {
          const sp = new THREE.Sprite(sharedMat);
          sp.scale.set(scale, scale, scale);
          sp.position.set(ox, oy, 0);
          sp.userData = { project, isSubPoint: true };
          group.add(sp);
        });
      } else {
        // Experiments cluster: 4 sub-points + 1 halo
        const sharedTex = createStarTexture(project.accentColor, 64);
        const sharedMat = new THREE.SpriteMaterial({
          map: sharedTex, transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const offsets = [[0.06, 0.04], [-0.05, 0.06], [0.04, -0.05], [-0.06, -0.03]];
        offsets.forEach(([ox, oy]) => {
          const sp = new THREE.Sprite(sharedMat);
          sp.scale.set(scale, scale, scale);
          sp.position.set(ox, oy, 0);
          sp.userData = { project, isSubPoint: true };
          group.add(sp);
        });
        // Halo sprite
        const haloTex = createHaloTexture(project.accentColor, 128);
        const haloMat = new THREE.SpriteMaterial({
          map: haloTex, transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false, opacity: 0.08
        });
        const halo = new THREE.Sprite(haloMat);
        const haloScale = 0.3;
        halo.scale.set(haloScale, haloScale, haloScale);
        halo.userData = { isHalo: true };
        group.add(halo);
      }

      group.userData = {
        project,
        basePosition: project.position.slice(),
        baseScale: scale,
        phaseOffset: Math.random() * Math.PI * 2,
        index: idx
      };

      // Hit-area sprite for raycasting (transparent, at cluster center)
      if (project.status !== 'paused') {
        const hitTex = createStarTexture('#000000', 32);
        const hitMat = new THREE.SpriteMaterial({
          map: hitTex, transparent: true, opacity: 0.001, depthWrite: false
        });
        const hitSprite = new THREE.Sprite(hitMat);
        hitSprite.scale.set(0.15, 0.15, 0.15);
        hitSprite.userData = { project, isHitArea: true };
        group.add(hitSprite);
      }

      starGroup.add(group);
      starNodes.push(group);
    } else {
      // --- Individual star ---
      const tex = createStarTexture(project.accentColor, 128);
      const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      const scale = project.starSize * 0.25;
      sprite.scale.set(scale, scale, scale);
      sprite.position.set(project.position[0], project.position[1], project.position[2]);
      sprite.userData = {
        project,
        basePosition: project.position.slice(),
        baseScale: scale,
        phaseOffset: Math.random() * Math.PI * 2,
        index: idx
      };
      starGroup.add(sprite);
      starNodes.push(sprite);
    }
  });

  return { starNodes, starGroup };
}

/**
 * Create the dust motes particle system.
 * @param {boolean} isMobile
 * @param {number} xScale
 * @returns {THREE.Points} dustMotes with userData.velocities and userData.count
 */
export function createDustSystem(isMobile, xScale) {
  const dustCount = isMobile ? 80 : 180;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustVelocities = new Float32Array(dustCount * 3);

  for (let i = 0; i < dustCount; i++) {
    const [x, y, z] = randomVolumePoint(3.0, 2.0, [-2, 1]);
    dustPositions[i * 3] = x;
    dustPositions[i * 3 + 1] = y;
    dustPositions[i * 3 + 2] = z;
    dustVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
    dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }

  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

  const dustTex = createDustTexture(32);
  const dustMat = new THREE.PointsMaterial({
    size: 0.008,
    sizeAttenuation: true,
    map: dustTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.15
  });

  const dustMotes = new THREE.Points(dustGeo, dustMat);
  dustMotes.userData.velocities = dustVelocities;
  dustMotes.userData.count = dustCount;

  return dustMotes;
}
