# Atlas UV Map Reference

**Atlas**: `assets/glyph-atlas-msdf.png` | **Size**: 512x256 | **Grid**: 4x2 | **Cell**: 128x128

## Cell Layout

| Index | Name | Grid (col, row) | Cell UV Origin | UV Min (padded) | UV Max (padded) |
|-------|------|-----------------|----------------|-----------------|-----------------|
| 0 | Architect (135) | (0, 0) | (0.0, 0.0) | (0.0078, 0.0156) | (0.2422, 0.4844) |
| 1 | Guardian (90) | (1, 0) | (0.25, 0.0) | (0.2578, 0.0156) | (0.4922, 0.4844) |
| 2 | Sovereign (270) | (2, 0) | (0.5, 0.0) | (0.5078, 0.0156) | (0.7422, 0.4844) |
| 3 | Voyager (180) | (3, 0) | (0.75, 0.0) | (0.7578, 0.0156) | (0.9922, 0.4844) |
| 4 | Origin (0) | (0, 1) | (0.0, 0.5) | (0.0078, 0.5156) | (0.2422, 0.9844) |
| 5 | Orbit (ring) | (1, 1) | (0.25, 0.5) | (0.2578, 0.5156) | (0.4922, 0.9844) |
| 6 | Axis (stem) | (2, 1) | (0.5, 0.5) | (0.5078, 0.5156) | (0.7422, 0.9844) |
| 7 | Spiral (arc) | (3, 1) | (0.75, 0.5) | (0.7578, 0.5156) | (0.9922, 0.9844) |

## UV Math

- Cell width in UV: 128/512 = **0.25**
- Cell height in UV: 128/256 = **0.5**
- Guard padding horizontal: 4/512 = **0.0078125**
- Guard padding vertical: 4/256 = **0.015625**
- Cell offset formula: `vec2(mod(index, 4.0), floor(index / 4.0)) * vec2(0.25, 0.5)`

## Shader Constants

- `screenPxRange` denominator: **128.0** (cell size, not atlas size)
- `uTexelSize`: **1.0 / 512.0** (atlas width for finite-difference normal sampling)
- All 4 finite-difference samples MUST clamp within cell guard-padded bounds
