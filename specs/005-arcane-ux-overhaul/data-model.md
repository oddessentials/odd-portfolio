# Data Model: Arcane UX Overhaul

**Feature**: 005-arcane-ux-overhaul
**Date**: 2026-03-04

## Entities

### 1. MSDF Texture Asset

| Field | Type | Description |
|---|---|---|
| source | string | Path to source SVG: `design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg` |
| output | string | Path to generated MSDF: `assets/logo_msdf.png` |
| resolution | number | 256 (pixels, square) |
| channels | number | 3 (RGB PNG on disk; uploaded as RGBA by WebGL — GPU always allocates 4 channels) |
| pxRange | number | 4 (MSDF pixel range parameter) |
| format | string | PNG |
| maxFileSize | number | 64KB |
| maxGpuMemory | number | 262KB (256x256 RGBA uncompressed) |
| filtering | string | THREE.LinearFilter (min and mag), no mipmaps |

### 2. Sidebar Plane (WebGL Mesh)

| Field | Type | Description |
|---|---|---|
| geometry | PlaneGeometry | Sized to overlay CSS sidebar column |
| material | ShaderMaterial | Custom MSDF hieroglyph shader, `transparent: true`, `depthTest: false`, `depthWrite: false` |
| position.x | number | Computed from camera FOV + CSS sidebar pixel position |
| position.y | number | 0 (centered vertically) |
| position.z | number | 0 (at scene origin depth) |
| scale | Vector3 | Computed to match CSS sidebar dimensions in world units |
| side | string | "left" or "right" |
| renderOrder | number | -1 (renders behind all scene objects to avoid occluding stars/nebula) |

**Resize behavior**: Recompute position and scale on every resize event to maintain alignment with CSS grid.

### 3. Reticle State

| Field | Type | Description |
|---|---|---|
| active | boolean | Whether a star is currently targeted |
| targetStar | Sprite or null | Reference to the targeted star sprite |
| screenPosition | {x, y} | Current screen-space position of reticle center |
| transitioning | boolean | Whether a star-to-star transition is in progress |
| svgElement | SVGElement | The reticle SVG graphic container |
| labelElement | HTMLElement | The project name label (accessible DOM element) |

**State transitions**:
- IDLE (no target) → ACTIVE (star hovered, reticle appears)
- ACTIVE (star A) → TRANSITIONING (moving to star B)
- TRANSITIONING → ACTIVE (arrived at star B)
- ACTIVE/TRANSITIONING → FADE_OUT (cursor left all stars)
- FADE_OUT → IDLE (fade complete)

### 4. Constellation Line Set

| Field | Type | Description |
|---|---|---|
| zoneIndex | number | Index into CONSTELLATION_ZONES array |
| lines | SVGLineElement[] | Array of SVG line elements for this zone |
| active | boolean | Whether this zone's lines are currently displayed |
| animating | boolean | Whether draw-on or fade-out animation is in progress |
| endpoints | {star1Id, star2Id}[] | Pairs of project IDs connected by lines |

**Line generation**: For a zone with N projects, create N-1 lines connecting them in sequence (chain topology, not fully connected graph). This limits line count to 2 max per zone.

### 5. Parallax Layer Config

| Field | Type | Description |
|---|---|---|
| layerIndex | number | 0 (background), 1 (mid), 2 (foreground) |
| zRange | [number, number] | Depth band: [min, max] |
| particleSize | number | Base size for particles in this band |
| lerpFactor | number | Damping factor for parallax offset (0.02, 0.05, 0.08) |
| maxOffset | number | Maximum parallax displacement in world units |
| currentOffset | {x, y} | Current interpolated offset |
| targetOffset | {x, y} | Target offset from mouse position |
| pointsObject | THREE.Points | Reference to the nebula Points layer |

### 6. Cursor State (Shared)

| Field | Type | Description |
|---|---|---|
| owner | string | "logo-follow", "reticle", or "default" |
| visible | boolean | Whether the system cursor is visible |
| style | string | CSS cursor value ("none", "crosshair", "pointer") |

**Arbitration**: Reticle takes priority over logo-follow. Logo-follow takes priority over default. When owner changes, the new owner controls cursor style.

## Existing Entities (Modified)

### PROJECTS (data.js) — No changes to schema

The project data model is unchanged. The `position`, `accentColor`, and `starSize` fields are consumed by the new modules (reticle for label content, constellation-lines for endpoint lookup, parallax for star exclusion from parallax offset).

### CONSTELLATION_ZONES (data.js) — No changes to schema

The `projectIds`, `nebulaHueRgb`, and `statusText` fields are consumed by `constellation-lines.js` for line coloring and endpoint selection.

### Star Sprite userData — Extended

| Field | Type | Description |
|---|---|---|
| project | object | Existing: project data reference |
| basePosition | number[] | Existing: original [x, y, z] |
| baseScale | number | Existing: base sprite scale |
| phaseOffset | number | Existing: animation phase offset |
| index | number | Existing: project index |
| glowHaloScale | number | NEW: halo-inclusive scale factor for the enlarged texture |
