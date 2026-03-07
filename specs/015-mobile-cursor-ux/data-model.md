# Data Model: 015 Mobile & Cursor UX Fixes

**Date**: 2026-03-07

## Overview

This feature introduces no new data entities or project data fields. All changes are interaction behavior and CSS layout modifications. The existing PROJECTS data model is unaffected.

## State Objects (New)

### Touch Guard State (touch-guard.js)

Internal module state for touch tap vs scroll disambiguation:

- **touchStartX**: number (CSS pixels) — X coordinate at touchstart
- **touchStartY**: number (CSS pixels) — Y coordinate at touchstart
- **touchStartTime**: number (ms timestamp) — time of touchstart
- **isTapCancelled**: boolean — set true when scroll detected during touchmove
- **isVerticalScroll**: boolean — set true when vertical delta > horizontal delta on any touchmove

Lifecycle: Created on touchstart, evaluated on touchend, cleared after evaluation.

### Logo Fade State (logo-follow.js additions)

- **logoOpacityTween**: GSAP tween reference | null — current fade animation (for kill/reuse)
- **reticleDebounceTimer**: GSAP delayedCall reference | null — debounce for reticle events
- **logoHasEngaged**: boolean — tracks whether logo has ever followed cursor (for "never return to header" logic)

### Swipe Gesture State (panel-swipe.js)

- **swipeStartY**: number (CSS pixels) — Y coordinate at touchstart on header
- **swipeActive**: boolean — whether a swipe gesture is being tracked
- **contentScrolled**: boolean — flag set if content scroll event fires during swipe tracking

Lifecycle: Created on touchstart within header area, cancelled if content scrolls, evaluated on touchend.

## Existing State Affected

### pointer-utils.js

- Add `isCoarsePointer()` export — `window.matchMedia('(pointer: coarse)').matches`
- Add `coarsePointerMQL` export for change listeners

### panel.js

- Add `_savedScrollTop`: number — preserved page scroll position during modal open
- `overlayHeaderEl`: DOM element reference — new `.overlay__header` element

## No Changes To

- PROJECTS data model (js/data.js)
- CONSTELLATION_ZONES data model (js/data.js)
- Any persistent storage (none exists)
- Any external API contracts (none exist)
