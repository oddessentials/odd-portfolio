# Quickstart: Arcane UX Overhaul

**Feature**: 005-arcane-ux-overhaul
**Branch**: `005-arcane-ux-overhaul`

## Pre-requisites

1. **MSDF Texture Generation** (one-time, before any shader work):
   ```bash
   # Install msdfgen (standalone binary)
   # On Windows: download from https://github.com/Chlumsky/msdfgen/releases

   # Generate MSDF from geometric OE monogram
   msdfgen msdf \
     -svg "design-assets/oddessentials-logo-generator/img/oddessentials-logo-final.svg" \
     -o "assets/logo_msdf.png" \
     -size 256 256 \
     -pxrange 4
   ```

2. **Verify MSDF output**:
   - File exists at `assets/logo_msdf.png`
   - File size under 64KB
   - Dimensions: 256x256
   - Channels: RGB (3-channel)

## Development Workflow

### Serving locally
```bash
# Any static file server works (no build step required)
npx serve .
# or
python -m http.server 8080
```

### File organization
- All new JavaScript modules go in `js/`
- Each module exports `init(dependencies)` and optionally `tick(elapsed)`
- `app.js` is the orchestrator that wires everything together
- No circular imports: feature modules receive references via `init()` parameters

### Implementation order

1. **Phase 1: Refactoring** — Extract modules from scene.js and animations.js first. Verify all existing functionality still works before adding new features.

2. **Phase 2: Starfield/Nodes** — Desaturate nebula, enlarge star textures with glow halos. These changes modify existing code, not new modules.

3. **Phase 3: Reticle** — New module. Test independently by hovering stars. Verify logo-follow handoff.

4. **Phase 4: Constellation Lines** — New module. Test by scrolling through zones. Verify draw-on animation and zone transitions.

5. **Phase 5: Parallax** — New module. Test by moving mouse. Verify depth separation and damping.

6. **Phase 6: Sidebar Hieroglyphs** — New module (most complex). Test by inspecting sidebars. Verify etching quality, lighting response, and animated effects.

7. **Phase 7: Integration** — Wire all modules, verify budgets, cross-browser test.

### Key testing checkpoints

After each phase, verify:
- [ ] 60fps in Chrome DevTools Performance tab
- [ ] Draw calls under 30 (check via `renderer.info.render.calls` in console)
- [ ] No console errors/warnings
- [ ] Reduced-motion mode works (`Cmd+Shift+P > Emulate prefers-reduced-motion`)
- [ ] Mobile view (resize below 768px) doesn't break

### Module template

```javascript
// js/feature-name.js — Brief description
// Dependencies injected via init(), not imported from scene.js

let _camera, _renderer; // module-level refs

function init({ camera, renderer, starNodes }) {
  _camera = camera;
  _renderer = renderer;
  // setup...
}

function tick(elapsed) {
  // per-frame updates...
}

export { init, tick };
```

### Debugging tips

- **Draw call count**: `console.log(renderer.info.render.calls)` after render
- **Texture memory**: `console.log(renderer.info.memory.textures)` for count
- **MSDF shader**: Add `gl_FragColor = vec4(dist, dist, dist, 1.0)` to visualize the distance field
- **Parallax offsets**: Log `currentOffset` values to verify damping
- **Reticle position**: Add a red dot at projected coordinates to verify 3D-to-screen mapping
- **Constellation lines**: Set stroke-width to 5px during development for visibility
