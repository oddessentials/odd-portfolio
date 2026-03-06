# Data Model: Gauge Enhancement — 010-gauge-enhancement

**Date**: 2026-03-06

## Entities

### GaugeSegment (CSS concept, not a JS object)

Represents one angular wedge of a gauge face.

| Attribute | Type | Description |
|-----------|------|-------------|
| zoneIndex | int (-1, 0, 1, 2) | -1 = rest, 0-2 = constellation zones |
| color | hex string | Segment fill color |
| startAngle | degrees | CW from 12 o'clock |
| endAngle | degrees | CW from 12 o'clock |
| width | degrees | Angular span |
| needleAngle | degrees | Where the needle points when this zone is active |
| isActive | boolean | Whether this segment is currently highlighted |

### GaugeState (runtime, managed by scroll-zones.js)

| Attribute | Type | Description |
|-----------|------|-------------|
| activeZoneIndex | int | Current active zone (-1 = rest) |
| needleAngleLeft | CSS deg | Current left needle angle |
| needleAngleRight | CSS deg | Current right needle angle |
| tremoring | boolean | Whether micro-tremor is active |
| glowPhase | float (0-1) | Active segment glow intensity |

### Existing Entity: CONSTELLATION_ZONES (read-only, from data.js)

| Attribute | Used By Gauges |
|-----------|---------------|
| name | Not displayed on gauges |
| nebulaHueRgb | Source for segment colors (converted to hex at design time) |
| scrollStart / scrollEnd | Drives zone transitions that update gauge state |

## State Transitions

```
rest (zone -1)
  ├── scroll into zone 0 → zone0 active
  ├── scroll into zone 1 → zone1 active
  └── scroll into zone 2 → zone2 active

zone0 active
  ├── scroll forward → zone1 active
  ├── scroll backward → rest
  └── scroll past all → zone2 active

zone1 active
  ├── scroll forward → zone2 active
  └── scroll backward → zone0 active

zone2 active
  ├── scroll backward → zone1 active
  └── scroll to top → rest
```

Each transition triggers:
1. Needle animation to target angle (existing behavior)
2. Active segment glow pulse (new: 0→1→0.3 over 0.5s)
3. Micro-tremor pause → resume after transition completes (new)

## Relationships

```
CONSTELLATION_ZONES (data.js)
  └── provides zone colors → GaugeSegment colors (CSS)
  └── provides zone boundaries → scroll-zones.js zone detection
       └── triggers zone-change event → GaugeState update
            └── drives needle animation (existing)
            └── drives segment glow (new)
            └── drives micro-tremor pause/resume (new)
```
