# Quickstart: Beta 0.1.0 — Portfolio Polish & Bug Fixes

**Branch**: `003-beta-portfolio-polish`

## Prerequisites

- Modern browser (Chrome/Firefox/Safari latest)
- Local HTTP server (e.g., `npx serve`, `python -m http.server`, VS Code Live Server)
- No npm install, no build step

## Running Locally

```bash
# Clone and checkout
git checkout 003-beta-portfolio-polish

# Serve from repo root (any static server works)
npx serve .
# or
python -m http.server 8080
```

Open `http://localhost:8080` (or whatever port your server uses).

## File Map

| File | Purpose | Beta Changes |
|---|---|---|
| `index.html` | DOM structure | Sidebar labels, status panel, metadata, sr-only text |
| `css/styles.css` | All styling | Greek key, descriptions, loading bar, responsive fixes, containment |
| `js/app.js` | Init orchestration | No changes needed (terminal scan wired via animations.js callback) |
| `js/scene.js` | Three.js core | Hitzone fix, star scaling, raycaster threshold |
| `js/data.js` | Project data | Add `shortDesc` field |
| `js/animations.js` | GSAP timelines | Terminal scan, discoverability text, brand messaging |
| `js/interactions.js` | Panel + nav | Hover/touch descriptions, resize handler |
| `js/performance.js` | Post-processing | Auto-tier timeout, shimmer degradation |

## Testing Checklist

### P0 Bug Fixes
- [ ] Hover all 7 stars left-to-right on 1920×1080 — all respond
- [ ] Resize browser from 1920px → 320px — all 7 stars remain visible
- [ ] Click stars near sidebar edges — panels open correctly

### P1 Content & Interactions
- [ ] Left sidebar shows "ODD PORTFOLIO" header
- [ ] All 7 buttons show real project names + short descriptions
- [ ] Hover over buttons on desktop — taglines expand smoothly
- [ ] On mobile: first tap shows tagline, second tap opens panel
- [ ] Right sidebar shows "ODD ESSENTIALS" header
- [ ] Tab through all buttons, use Arrow keys, Enter, Escape
- [ ] Screen reader announces project names and descriptions

### P2 Animations & Visual
- [ ] Terminal scan cycles through 7 project names with progress bar
- [ ] Terminal completes with "PORTFOLIO READY" and brass glow
- [ ] Click a button during terminal scan — panel opens (non-blocking)
- [ ] Greek key pattern visible on top border in brass tones
- [ ] Shimmer sweeps across Greek key after reveal
- [ ] Command line types "Force multipliers for small businesses..."
- [ ] Page title reads "Odd Essentials | Portfolio"

### Accessibility
- [ ] Enable `prefers-reduced-motion` — no animations, final states shown
- [ ] Enable `prefers-contrast: more` — decorations hidden, high contrast text
- [ ] Keyboard-only navigation works end-to-end
- [ ] Screen reader: all projects accessible, live regions announce scan progress

### Performance
- [ ] Chrome DevTools Performance: all frames < 16.67ms at steady state
- [ ] Chrome DevTools Layers: ≤ 12 compositing layers
- [ ] Chrome DevTools Rendering > Paint flashing: shimmer shows NO green paint
- [ ] Auto-tier benchmark fires AFTER reveal + terminal scan complete

## Key Constraints

- **No build system** — edit files directly, refresh browser
- **CDN pinned** — Three.js 0.162.0, GSAP 3.12.5 (do not update)
- **No new files** — all changes in existing 8 files
- **No new libraries** — everything uses existing Three.js + GSAP
- **DPR ≤ 1.5** — never unclamped
- **Draw calls < 30** — Beta adds zero new Three.js objects
