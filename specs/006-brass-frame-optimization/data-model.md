# Data Model: Brass Frame Optimization

**Feature**: 006-brass-frame-optimization
**Date**: 2026-03-05

## CSS Custom Properties (Design Tokens)

### Modified Properties

| Property | Current Value | New Value | Rationale |
|----------|--------------|-----------|-----------|
| `--frame-corner-size` | `80px` | `45px` | 2.5x border width (18px * 2.5 = 45px). Controls both corner element dimensions and edge rail insets. |

### Derived Values (computed, not stored)

| Derived Value | Formula | Desktop (18px) | Tablet (12px) | Mobile (8px) |
|---------------|---------|----------------|---------------|--------------|
| Corner arm length | `--frame-corner-size` | 45px | 30px | 20px |
| Corner arm width | `--frame-border-width` | 18px | 12px | 8px |
| Gauge diameter | `2.25 * --frame-border-width` | 40px | 27px | hidden |
| Gauge position offset | `--frame-border-width / 2 - gauge-radius` | -11px | -1.5px | N/A |
| Gauge face inset | `gauge-diameter * 0.3` | 12px → 8px | 8px → 5px | N/A |
| Gauge needle height | `gauge-diameter * 0.3` | 20px → 12px | 8px | N/A |
| Rivet size | `min(10px, arm-width * 0.55)` | 10px | 7px | 5px |
| Rivet inset | `(arm-width - rivet-size) / 2` | 4px | 2.5px | 1.5px |

### Responsive Breakpoint Values

| Breakpoint | `--frame-border-width` | `--frame-corner-size` | Gauge diameter | Gauge visible |
|------------|----------------------|----------------------|----------------|---------------|
| Desktop (1200px+) | 18px | 45px | 40px | Yes |
| Tablet (768-1199px) | 12px | 30px | 27px | Yes |
| Mobile (<768px) | 8px | 20px | N/A | No (display: none) |

## Element Inventory (Unchanged)

| Element | Count | Pseudo-elements | Notes |
|---------|-------|-----------------|-------|
| `.frame__corner` | 4 | 8 (2 rivets each) | Shape changes via clip-path; element count unchanged |
| `.frame__edge` | 4 | 4 (1 engraving each) | Extend to meet new corner size; no structural change |
| `.frame__gauge` | 2 | 4 (face + needle each) | Resize and reposition; pseudo-elements scale proportionally |
| `.frame__greek-key` | 1 | 2 (shimmer + grain) | Unchanged; extends further due to smaller corners |
| `.frame__header-band` | 1 | 0 | Unchanged |
| **Total** | **13** | **18** | **31 items (unchanged, meets SC-003)** |

## clip-path Definitions

### Corner Bracket Shapes

All four corners use the same L-bracket topology, mirrored per position. The clip-path carves away the interior square, leaving two perpendicular arms.

**TL (top-left)**:
```
polygon(0 0, 100% 0, 100% bw, bw bw, bw 100%, 0 100%)
```
Where `bw` = `var(--frame-border-width)` (the arm thickness).

**TR (top-right)**: Mirror X
```
polygon(0 0, 100% 0, 100% 100%, calc(100% - bw) 100%, calc(100% - bw) bw, 0 bw)
```

**BL (bottom-left)**: Mirror Y
```
polygon(0 0, bw 0, bw calc(100% - bw), 100% calc(100% - bw), 100% 100%, 0 100%)
```

**BR (bottom-right)**: Mirror X+Y
```
polygon(calc(100% - bw) 0, 100% 0, 100% 100%, 0 100%, 0 calc(100% - bw), calc(100% - bw) calc(100% - bw))
```
