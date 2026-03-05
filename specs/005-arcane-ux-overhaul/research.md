# Research: Arcane UX Overhaul

**Feature**: 005-arcane-ux-overhaul
**Date**: 2026-03-04
**Status**: Complete

## Research Topic 1: MSDF Pipeline — SVG to Texture

**Decision**: Use msdfgen CLI to convert `oddessentials-logo-final.svg` to a 256x256 MSDF PNG.

**Rationale**: The geometric OE monogram SVG contains proper vector path outlines (circles, rectangles) suitable for msdfgen processing. MSDF (multi-channel SDF) provides sharper edge rendering than single-channel SDF, especially at small sizes and with complex geometry. 256x256 resolution is standard for single-glyph MSDF (font-grade quality) and keeps GPU memory at 262KB (well within 1MB budget).

**Alternatives Considered**:
- **Single-channel SDF**: Simpler but produces corner artifacts on the OE monogram's right-angle intersections. MSDF solves this with multi-channel distance encoding.
- **Pre-rasterized bitmap SDF**: Required if the ASCII-art logo were used, but the geometric monogram has clean vector paths. Not needed.
- **512x512 resolution**: Provides no visible quality improvement for SDF rendering (resolution independence is the point) but costs 4x GPU memory. Rejected.

**Pipeline Steps**:
1. Install msdfgen CLI (standalone binary, no npm required)
2. Run: `msdfgen msdf -svg oddessentials-logo-final.svg -o logo_msdf.png -size 256 256 -pxrange 4`
3. Verify output: 3-channel RGB PNG, ~20-40KB file size
4. Copy to `assets/logo_msdf.png`

---

## Research Topic 2: Sidebar WebGL Geometry Alignment with CSS Layout

**Decision**: Create Two Three.js PlaneGeometry meshes positioned in camera space to visually overlay the CSS sidebar columns. Use `camera.fov`, `camera.aspect`, and viewport dimensions to compute world-space positions matching CSS pixel coordinates.

**Rationale**: The CSS sidebars are positioned via CSS Grid. The WebGL sidebar planes must appear at the same screen locations. The approach is to compute the visible area at the camera's near plane, then position planes at the left and right edges matching the CSS sidebar pixel widths.

**Alternatives Considered**:
- **CSS/Canvas 2D etching**: Abandons the shader pipeline entirely. Cannot produce lighting-responsive normal perturbation or material-quality depth. Rejected per REVIEW.md guidance.
- **Render-to-texture on CSS elements**: Overly complex, involves DOM-to-canvas capture. Not suitable for real-time effects.

**Implementation Approach**:
```javascript
// Calculate visible width at z=0 for 45deg FOV camera at z=4.5
const vFov = camera.fov * Math.PI / 180;
const visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
const visibleWidth = visibleHeight * camera.aspect;

// CSS sidebar width in pixels (read from computed style)
const sidebarPx = parseFloat(getComputedStyle(sidebarEl).width);
const sidebarWorldWidth = (sidebarPx / window.innerWidth) * visibleWidth;

// Position left sidebar plane at left edge
leftPlane.position.x = -visibleWidth / 2 + sidebarWorldWidth / 2;
```

**Resize Sync**: Recompute on every resize event (already debounced in scene.js). The sidebar plane positions and scales must update to match the new CSS layout.

---

## Research Topic 3: MSDF Fragment Shader Architecture

**Decision**: Single fragment shader with MSDF decode, normal perturbation via finite differences (4 extra texture samples), roughness modulation, cavity AO, edge highlight, procedural phi-grid, and 3 animated effects controlled by uniforms.

**Rationale**: Estimated ~72 ALU instructions + 5 texture fetches per fragment. Well within the 120-instruction constitutional limit. The sidebar planes are small screen-area objects, limiting total fragment count. On integrated GPUs, the bottleneck is the existing bloom passes, not the sidebar shader.

**Alternatives Considered**:
- **Pre-baked normal map**: Reduces texture fetches from 5 to 2 but requires an additional texture asset and doesn't adapt to dynamic MSDF scaling. Rejected in favor of runtime finite-difference computation.
- **Separate roughness/AO textures**: Unnecessary complexity. All four output channels can be derived from the single MSDF distance value.

**Shader Uniform Contract**:
```glsl
uniform sampler2D uMsdf;        // MSDF texture
uniform float uTime;             // Elapsed time from ticker
uniform vec2 uResolution;        // Sidebar plane dimensions
uniform float uBreathingEnabled; // 1.0 or 0.0 (reduced motion)
uniform float uShimmerEnabled;   // 1.0 or 0.0
uniform float uScanLineEnabled;  // 1.0 or 0.0
uniform float uTexelSize;        // 1.0 / msdf_resolution for finite diff
```

---

## Research Topic 4: Parallax — Nebula Redistribution vs New Layers

**Decision**: Redistribute existing 3 nebula Points layers by z-band. No new Points objects. Zero additional draw calls.

**Rationale**: The existing 3 nebula layers already have overlapping z-ranges that can be separated into distinct depth bands. Reassigning each layer's z-range to non-overlapping bands and adjusting particle sizes per band creates the parallax foundation without any GPU cost increase.

**Alternatives Considered**:
- **3 new dedicated star Points layers**: Adds 3 draw calls (budget: 22 → 25). Wasteful when existing layers can be repurposed.
- **Single Points with vertex attribute for depth**: Requires per-vertex position manipulation in the ticker (1500 vertices). More complex than per-group offset.

**Three Transform Systems**: Each nebula layer is subject to three independent transform systems that must compose without interference:

1. **Group rotation** (scroll-driven): `nebulaGroup.rotation.y = progress * Math.PI * 0.5` in scroll-zones.js — rotates the entire nebula group. Preserved as-is.
2. **Per-layer drift rotation** (time-driven): `layer.rotation.y = elapsed * speed` in scene.js ticker — slow continuous drift per-layer. Preserved as-is.
3. **Parallax position offset** (mouse-driven): `parentGroup.position.x/y` lerped toward mouse target — new.

**Critical interaction**: If parallax position offsets were applied directly to the Points object (which also has drift rotation), the offset direction would rotate with the drift. After ~60 seconds at 0.036 rad/s, a layer drifts ~124 degrees — a mouse-right parallax would appear as mouse-down. **Solution**: Wrap each Points layer in a parent THREE.Group. Drift rotation stays on the child Points. Parallax position offsets go on the parent Group. The parent Group's position is in nebulaGroup's coordinate space (affected by scroll rotation), but NOT affected by the child's drift rotation. This cleanly separates all three systems.

**Redistribution Plan**:
- Layer 0 (800 particles): Background band. z: [-3, -1]. Size: 0.015. Lerp factor: 0.02.
- Layer 1 (400 particles): Mid-ground band. z: [-1.5, 0.5]. Size: 0.020. Lerp factor: 0.05.
- Layer 2 (300 particles): Foreground band. z: [0, 2]. Size: 0.025. Lerp factor: 0.08.

---

## Research Topic 5: SVG Constellation Lines — Draw-On Animation

**Decision**: Use SVG `<line>` elements with `stroke-dasharray` and `stroke-dashoffset` animated via GSAP for the draw-on effect.

**Rationale**: This is the standard SVG line-draw technique. GSAP can tween `stroke-dashoffset` with any easing curve. The technique is well-supported across all target browsers and produces smooth, resolution-independent lines. Zero WebGL draw calls.

**Alternatives Considered**:
- **THREE.Line with setDrawRange()**: WebGL-native but costs 2-3 draw calls per zone. Budget-unfriendly.
- **Canvas 2D overlay**: More manual work, no advantage over SVG for this use case.

**Implementation Pattern**:
```javascript
// Set initial dash to hide line
const lineLength = Math.sqrt(dx*dx + dy*dy);
lineEl.setAttribute('stroke-dasharray', lineLength);
lineEl.setAttribute('stroke-dashoffset', lineLength);

// Animate draw-on
gsap.to(lineEl, {
  attr: { 'stroke-dashoffset': 0 },
  duration: 0.6,
  ease: 'power2.out'
});
```

---

## Research Topic 6: Reticle/Logo-Follow Cursor Conflict Resolution

**Decision**: Implement a shared cursor-state protocol. The reticle module signals "reticle-active" and "reticle-inactive" states. The logo-follow module listens and pauses/resumes accordingly.

**Rationale**: Both systems respond to mouse position on the same `#orb-hitzone` element. Without coordination, the user sees both the trailing logo and the targeting reticle simultaneously — visually chaotic. The reticle takes priority because it provides actionable information (which project is targeted).

**Implementation**:
- `reticle.js` dispatches `reticle-activate` and `reticle-deactivate` CustomEvents on the document.
- `logo-follow.js` listens for these events. On `reticle-activate`: calls `logoReturnHome()` and sets a `paused` flag. On `reticle-deactivate`: clears the `paused` flag, allowing `mousemove` to re-engage.
- Cursor visibility: hitzone cursor stays `none` during reticle (the reticle IS the visual cursor). On deactivate, cursor returns to `none` (logo re-engages) or `crosshair` (if logo not following).

---

## Research Topic 7: Auto-Tier Degradation — Tier 2 Path for New Features

**Decision**: Add Tier 2 degradation rules: parallax merges to 2 layers, constellation line pulse suppressed, sidebar scan-line disabled. Dispatch `tier-change` CustomEvent from performance.js.

**Rationale**: The existing Tier 2 only reduces bloom strength and disables chromatic aberration — nothing for new features. Without Tier 2 degradation, the system jumps from full quality to aggressive Tier 3 (composer disabled, CSS blur). Intermediate degradation provides a smoother performance ramp.

**Implementation**:
- `performance.js` dispatches `document.dispatchEvent(new CustomEvent('tier-change', { detail: { tier } }))` in `applyTier2()` and `applyTier3()`.
- Each feature module listens for `tier-change` and adjusts behavior based on `event.detail.tier`.
- Degradation priorities (first to drop at Tier 2): sidebar scan-line, constellation pulse, parallax third layer.
