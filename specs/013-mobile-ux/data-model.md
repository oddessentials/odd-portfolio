# Data Model: 013-mobile-ux

**Date**: 2026-03-06

This feature does not introduce new data entities. It modifies behavior and presentation of existing DOM elements and HTML metadata. No changes to `js/data.js` or the project data model.

## State Changes

### Pointer Capability State

| Property | Type | Source | Consumers |
|----------|------|--------|-----------|
| `isFinePointer` | boolean | `matchMedia('(hover: hover) and (pointer: fine)')` | logo-follow.js, interactions.js |
| Dynamic updates | MediaQueryList `change` event | Browser | logo-follow.js re-evaluates on modality switch |

### Mobile Gauge Visibility State

| Property | Type | Source | Consumers |
|----------|------|--------|-----------|
| Gauge visible | CSS display | `@media (max-width: 767px)` + overlay state | styles.css |
| Nav overlay open | DOM class `.is-open` on `#hamburger-btn` | interactions.js | styles.css (CSS-driven hide) |
| Panel overlay open | CustomEvent `panel-open` / `panel-close` | panel.js | app.js or gauge.js (JS-driven class toggle) |

### Resize Debounce State

| Property | Type | Source | Consumers |
|----------|------|--------|-----------|
| `resizeDebounceTimer` | timeout ID | scene.js onResize | scene.js breakpoint logic |
| `isMobile` | boolean | `window.innerWidth < 768` (debounced) | logo-follow.js, scene.js |

## Meta Tags (Static HTML)

No runtime state — all values are static HTML attributes set at build/deploy time.

| Tag | Value Source |
|-----|-------------|
| `og:url` | Production domain config |
| `og:image` | `assets/og-image.png` (absolute URL) |
| `canonical` | Production domain config |
| `twitter:site` | `@odd_essentials` |
| `theme-color` | `#0d0b09` (page background) |
