# Front-End Architect Brainstorming Notes
## Victorian Techno-Mage Portfolio — HTML/CSS/Accessibility Strategy

---

## 1. HTML Structure

### Top-Level Semantic Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>...</head>
<body>
  <!-- Skip nav for accessibility -->
  <a href="#main-viewport" class="skip-link">Skip to content</a>

  <div id="app-shell" aria-label="Victorian Techno-Mage Console">

    <!-- Z-layer 0: WebGL canvas (behind everything) -->
    <canvas id="orb-canvas" aria-hidden="true"></canvas>

    <!-- Z-layer 1: Steampunk frame overlay (decorative, non-interactive) -->
    <div class="frame" aria-hidden="true">
      <div class="frame__corner frame__corner--tl"></div>
      <div class="frame__corner frame__corner--tr"></div>
      <div class="frame__corner frame__corner--bl"></div>
      <div class="frame__corner frame__corner--br"></div>
      <div class="frame__edge frame__edge--top"></div>
      <div class="frame__edge frame__edge--bottom"></div>
      <div class="frame__edge frame__edge--left"></div>
      <div class="frame__edge frame__edge--right"></div>
      <!-- Ornamental gauges embedded in edges -->
      <div class="frame__gauge frame__gauge--top-left" aria-hidden="true"></div>
      <div class="frame__gauge frame__gauge--top-right" aria-hidden="true"></div>
      <div class="frame__rune-band" aria-hidden="true"></div>
    </div>

    <!-- Z-layer 2: HUD panels (interactive) -->
    <nav id="constellation-nav" aria-label="Project constellations">
      <header class="hud-panel__header">
        <span class="hud-panel__label">CONSTELLATIONS</span>
        <span class="hud-panel__indicator" aria-hidden="true"></span>
      </header>
      <ul role="list">
        <!-- Each project as a nav item -->
        <li>
          <button
            class="constellation-btn"
            data-project-id="odd-ai-reviewers"
            aria-pressed="false"
            aria-describedby="project-hint"
          >
            <span class="constellation-btn__glyph" aria-hidden="true">★</span>
            <span class="constellation-btn__name">odd-ai-reviewers</span>
          </button>
        </li>
        <!-- ... repeat for all 7 projects -->
      </ul>
    </nav>

    <aside id="status-panel" aria-label="System status" aria-live="polite">
      <header class="hud-panel__header">
        <span class="hud-panel__label">STATUS</span>
      </header>
      <div class="status-panel__readout">
        <p class="status-line" id="status-main">SCANNING SYSTEMS…</p>
        <p class="status-line">MANA: <meter min="0" max="100" value="87" aria-label="Mana level">87%</meter></p>
        <p class="status-line">PHASE: <span id="phase-indicator">IDLE</span></p>
      </div>
    </aside>

    <!-- Central viewport: the orb area -->
    <main id="main-viewport" aria-label="Project universe crystal ball">
      <!-- Orb is rendered in WebGL canvas behind this -->
      <!-- HTML labels for star nodes (positioned absolutely via JS) -->
      <div id="star-labels" aria-hidden="true">
        <!-- JS injects: <div class="star-label" data-project-id="...">Name</div> -->
      </div>
      <!-- Accessible fallback description -->
      <p class="sr-only" id="orb-description">
        Interactive 3D visualization of projects as stars in a cosmic nebula.
        Use the constellation navigation list on the left to select a project.
      </p>
      <div
        id="orb-hitzone"
        role="application"
        aria-label="Interactive star field — use constellation list to navigate"
        aria-describedby="orb-description project-hint"
        tabindex="0"
      ></div>
    </main>

    <!-- Bottom command line terminal -->
    <footer id="command-line" aria-label="Console command line" role="log" aria-live="polite">
      <span class="cmd-prompt" aria-hidden="true">&gt;</span>
      <span id="cmd-text" class="cmd-text">reveal universe</span>
      <span class="cmd-cursor" aria-hidden="true">█</span>
    </footer>

    <!-- Z-layer 3: Project detail overlay (hidden by default) -->
    <div
      id="project-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      aria-describedby="overlay-description"
      hidden
    >
      <div class="overlay__frame">
        <!-- Steampunk frame applied to overlay too -->
        <button class="overlay__close" aria-label="Close project details">
          <span aria-hidden="true">✕</span>
        </button>
        <div class="overlay__content">
          <header class="overlay__header">
            <div class="overlay__logo-zone">
              <!-- Logo img or code-terminal placeholder -->
            </div>
            <h2 id="overlay-title" class="overlay__title"></h2>
            <p class="overlay__tagline" id="overlay-description"></p>
          </header>
          <div class="overlay__media-zone">
            <!-- Dynamic: img gallery | video | screenshots | placeholder -->
          </div>
          <div class="overlay__description-zone">
            <!-- Full project description text -->
          </div>
          <footer class="overlay__links">
            <!-- Link buttons: GitHub, npm, PyPI, marketplace, demo, etc. -->
          </footer>
        </div>
      </div>
      <!-- Backdrop -->
      <div class="overlay__backdrop" aria-hidden="true"></div>
    </div>

    <!-- Accessible hint (sr-only, announced once) -->
    <p id="project-hint" class="sr-only">
      Activate a project to open its detail panel. Press Escape to close.
    </p>

  </div><!-- /#app-shell -->
</body>
</html>
```

### Frame Element Hierarchy

```
#app-shell
├── #orb-canvas                     (z: 0, position: fixed/absolute fill)
├── .frame                          (z: 1, pointer-events: none)
│   ├── .frame__corner × 4         (CSS ::before/::after for brass rivet details)
│   ├── .frame__edge × 4           (CSS border-image or gradient bars)
│   ├── .frame__gauge × 2          (dial SVGs or CSS-only circles)
│   └── .frame__rune-band          (repeating rune pattern along top edge)
├── #constellation-nav              (z: 2, left HUD panel)
├── #status-panel                   (z: 2, right HUD panel)
├── #main-viewport                  (z: 2, center — transparent, orb shows through)
├── #command-line                   (z: 2, bottom HUD bar)
└── #project-overlay                (z: 100, dialog, hidden by default)
    ├── .overlay__backdrop          (z: 99, semi-transparent dark)
    └── .overlay__frame             (z: 100, the actual panel)
```

---

## 2. CSS Architecture

### Custom Properties (Design Tokens)

```css
:root {
  /* === MATERIALS === */
  --color-brass-light:      #d4a853;
  --color-brass-mid:        #b8891f;
  --color-brass-dark:       #7a5c0f;
  --color-copper:           #b87333;
  --color-iron:             #3a3a3a;
  --color-iron-light:       #5a5a5a;
  --color-dark-walnut:      #1a1008;
  --color-dark-walnut-mid:  #2a1e0e;
  --color-leather:          #3d1f0d;

  /* === ARCANE/GLOW === */
  --color-mana-blue:        #4a9eff;
  --color-mana-blue-dim:    #1a4a7a;
  --color-gold-glow:        #ffd700;
  --color-rune-amber:       #ff9500;
  --color-rune-teal:        #00d4aa;
  --color-nebula-purple:    #8b2fc9;
  --color-nebula-pink:      #e040fb;
  --color-star-white:       #f0f0ff;

  /* === UI SURFACES === */
  --color-bg:               #0d0a05;
  --color-panel-bg:         rgba(20, 13, 5, 0.88);
  --color-panel-border:     var(--color-brass-mid);
  --color-text-primary:     #e8d5a3;     /* warm parchment */
  --color-text-secondary:   #a08858;
  --color-text-mono:        #7fffb3;     /* terminal green */
  --color-text-muted:       #5a4a2a;

  /* === FOCUS (WCAG AA safe) === */
  --color-focus-ring:       #ffd700;     /* golden, 4.5:1+ on dark bg */
  --focus-ring-width:       3px;
  --focus-ring-offset:      2px;

  /* === SPACING === */
  --space-xs:    4px;
  --space-sm:    8px;
  --space-md:    16px;
  --space-lg:    24px;
  --space-xl:    40px;
  --space-2xl:   64px;

  /* === FRAME GEOMETRY === */
  --frame-border-width:     18px;
  --frame-corner-size:      80px;
  --hud-panel-width:        220px;
  --cmd-line-height:        48px;

  /* === ANIMATION DURATIONS === */
  --dur-instant:            80ms;
  --dur-fast:               200ms;
  --dur-medium:             500ms;
  --dur-slow:               1200ms;
  --dur-reveal:             3000ms;
  --ease-out-expo:          cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back:          cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === Z-INDEX STACK === */
  --z-canvas:               0;
  --z-frame:                10;
  --z-hud:                  20;
  --z-star-labels:          25;
  --z-overlay-backdrop:     90;
  --z-overlay:              100;
  --z-skip-link:            9999;
}
```

### Layout — Grid Composition

```css
#app-shell {
  display: grid;
  grid-template-columns: var(--hud-panel-width) 1fr var(--hud-panel-width);
  grid-template-rows: 1fr var(--cmd-line-height);
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg);
}

#constellation-nav  { grid-column: 1; grid-row: 1; z-index: var(--z-hud); }
#main-viewport      { grid-column: 2; grid-row: 1; z-index: var(--z-hud); }
#status-panel       { grid-column: 3; grid-row: 1; z-index: var(--z-hud); }
#command-line       { grid-column: 1 / -1; grid-row: 2; z-index: var(--z-hud); }

/* Canvas fills entire shell behind grid */
#orb-canvas {
  position: fixed;
  inset: 0;
  z-index: var(--z-canvas);
}

/* Frame overlay also fills entire shell */
.frame {
  position: fixed;
  inset: 0;
  z-index: var(--z-frame);
  pointer-events: none;
}
```

### Z-Index Strategy

| Layer              | z-index | Notes                                    |
|--------------------|---------|------------------------------------------|
| WebGL canvas       | 0       | Fixed fill, renders orb                  |
| Frame decorations  | 10      | pointer-events: none, purely visual      |
| HUD panels/nav     | 20      | Interactive, translucent dark backgrounds|
| Star HTML labels   | 25      | Absolutely positioned, pointer-events:none |
| Overlay backdrop   | 90      | Semi-opaque dark wash                    |
| Project overlay    | 100     | Dialog panel with steampunk frame        |
| Skip link          | 9999    | Always on top when focused               |

### HUD Panel Base Styles

```css
.hud-panel {
  background: var(--color-panel-bg);
  border: 1px solid var(--color-panel-border);
  backdrop-filter: blur(4px);
  padding: var(--space-md);
  position: relative;
}

/* Inset brass top-bar accent */
.hud-panel::before {
  content: '';
  display: block;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--color-brass-dark),
    var(--color-brass-light),
    var(--color-brass-dark)
  );
  margin-bottom: var(--space-md);
}
```

### Frame Corner CSS

```css
.frame__corner {
  position: absolute;
  width: var(--frame-corner-size);
  height: var(--frame-corner-size);
  /* Use border-image or inline SVG background for brass corner ornament */
  background-image: url("data:image/svg+xml,..."); /* inline SVG corner piece */
  background-size: contain;
  background-repeat: no-repeat;
}

.frame__corner--tl { top: 0; left: 0; }
.frame__corner--tr { top: 0; right: 0; transform: scaleX(-1); }
.frame__corner--bl { bottom: 0; left: 0; transform: scaleY(-1); }
.frame__corner--br { bottom: 0; right: 0; transform: scale(-1); }

/* Rivets using pseudo-elements */
.frame__corner::before,
.frame__corner::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, var(--color-brass-light), var(--color-brass-dark));
  box-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
```

### Frame Edges

```css
.frame__edge {
  position: absolute;
  background: linear-gradient(
    to bottom,
    var(--color-brass-dark),
    var(--color-brass-mid) 30%,
    var(--color-brass-light) 50%,
    var(--color-brass-mid) 70%,
    var(--color-brass-dark)
  );
}

.frame__edge--top    { top: 0; left: var(--frame-corner-size); right: var(--frame-corner-size); height: var(--frame-border-width); }
.frame__edge--bottom { bottom: 0; left: var(--frame-corner-size); right: var(--frame-corner-size); height: var(--frame-border-width); }
.frame__edge--left   { left: 0; top: var(--frame-corner-size); bottom: var(--frame-corner-size); width: var(--frame-border-width); }
.frame__edge--right  { right: 0; top: var(--frame-corner-size); bottom: var(--frame-corner-size); width: var(--frame-border-width); }

/* Engraved line effect using inset box-shadow */
.frame__edge--top,
.frame__edge--bottom {
  box-shadow:
    inset 0 2px 1px rgba(255,255,255,0.15),
    inset 0 -2px 1px rgba(0,0,0,0.4),
    inset 0 6px 0 rgba(0,0,0,0.1),
    inset 0 -6px 0 rgba(0,0,0,0.1);
}
```

### CSS-Only Steampunk Gauge (circular dial)

```css
.frame__gauge {
  position: absolute;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 40% 35%, var(--color-iron-light), var(--color-iron) 60%, #1a1a1a),
    conic-gradient(from 225deg, var(--color-brass-mid) 0deg, var(--color-iron) 270deg, var(--color-brass-mid) 360deg);
  border: 3px solid var(--color-brass-mid);
  box-shadow:
    0 0 0 2px var(--color-iron),
    0 0 12px rgba(180, 130, 30, 0.3),
    inset 0 0 8px rgba(0,0,0,0.8);
}

/* Needle via pseudo-element */
.frame__gauge::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 2px; height: 40%;
  background: var(--color-brass-light);
  transform-origin: bottom center;
  transform: translate(-50%, -100%) rotate(30deg);
}
```

### Rune Band

```css
.frame__rune-band {
  position: absolute;
  top: var(--frame-border-width);
  left: var(--frame-corner-size);
  right: var(--frame-corner-size);
  height: 20px;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 18px,
    var(--color-brass-dark) 18px,
    var(--color-brass-dark) 20px
  );
  opacity: 0.4;
  /* Add actual rune characters via content + letter-spacing in a span if needed */
}
```

### Focus Indicators

```css
/* Global focus — golden glow, steampunk-appropriate */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  border-radius: 2px;
  box-shadow: 0 0 0 6px rgba(255, 215, 0, 0.2), 0 0 12px rgba(255, 215, 0, 0.4);
}

/* Remove default for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Constellation nav buttons */
.constellation-btn:focus-visible {
  background: rgba(255, 215, 0, 0.1);
  border-color: var(--color-focus-ring);
}
```

---

## 3. Typography System

### Font Recommendations

| Role              | Font                    | Rationale                                         |
|-------------------|-------------------------|---------------------------------------------------|
| Display headers   | **Cinzel Decorative**   | Roman/classical, feels engraved in brass          |
| Section headers   | **Cinzel**              | Same family, less ornate for body headers         |
| Body / descriptions | **IM Fell English**   | Period-authentic, slightly old-press serif        |
| Terminal / mono   | **JetBrains Mono**      | Crisp, modern, great legibility at small sizes    |
| HUD labels        | **Rajdhani** (semi-bold)| Futuristic-meets-military-stencil feel for HUD UI |

Alternative body: **Cormorant Garamond** for a more elegant, less rustic feel.

### Google Fonts CDN Load (POC-appropriate)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600&family=IM+Fell+English:ital@0;1&family=JetBrains+Mono:wght@400;600&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet">
```

### Type Scale

```css
:root {
  --font-display:    'Cinzel Decorative', 'Georgia', serif;
  --font-header:     'Cinzel', 'Georgia', serif;
  --font-body:       'IM Fell English', 'Georgia', serif;
  --font-mono:       'JetBrains Mono', 'Courier New', monospace;
  --font-hud:        'Rajdhani', 'Arial', sans-serif;

  --text-xs:   11px;  /* HUD micro-labels */
  --text-sm:   13px;  /* Status readouts, metadata */
  --text-base: 16px;  /* Body text */
  --text-md:   20px;  /* Subheadings */
  --text-lg:   28px;  /* Section headers */
  --text-xl:   40px;  /* Overlay project title */
  --text-2xl:  60px;  /* Display / hero text */

  --leading-tight:  1.2;
  --leading-normal: 1.6;
  --leading-loose:  1.9; /* IM Fell English needs breathing room */
}
```

### Contrast Notes

- `--color-text-primary` (#e8d5a3) on `--color-panel-bg` (rgba(20,13,5,0.88)): **~8:1** — passes WCAG AAA
- `--color-text-mono` (#7fffb3) on `--color-bg` (#0d0a05): **~10:1** — passes WCAG AAA
- `--color-text-secondary` (#a08858) on panel-bg: **~4.6:1** — passes WCAG AA (borderline, check)
- `--color-text-muted` (#5a4a2a): **~2.8:1** — FAILS — restrict to aria-hidden decorative text only

---

## 4. Accessibility Strategy

### Keyboard Navigation Flow

```
Tab order:
1. Skip link (`:focus-visible` only)
2. #constellation-nav buttons (↑↓ arrow keys within list for efficiency)
3. #orb-hitzone (Enter = focus current selected project)
4. #status-panel (read-only, but may have interactive elements later)
5. [when overlay open]: overlay close button → media controls → links → back to close
6. Escape key: close overlay, return focus to activating constellation-btn
```

Arrow key enhancement for nav list:
```js
// Allow arrow key nav within constellation list
constellationNav.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    // move focus to next/prev button in list
  }
});
```

### ARIA Roles Summary

| Element              | Role / Attribute                              |
|----------------------|-----------------------------------------------|
| `#constellation-nav` | `role="navigation"`, `aria-label="Project constellations"` |
| `#main-viewport`     | `role="main"`, `aria-label="Project universe crystal ball"` |
| `#orb-hitzone`       | `role="application"`, `aria-label="Interactive star field"` |
| `#status-panel`      | `role="complementary"`, `aria-live="polite"`  |
| `#command-line`      | `role="log"`, `aria-live="polite"`            |
| `#project-overlay`   | `role="dialog"`, `aria-modal="true"`, `aria-labelledby="overlay-title"` |
| `.overlay__backdrop` | `aria-hidden="true"`                          |
| Frame elements       | `aria-hidden="true"` (all purely decorative)  |
| Star labels (HTML)   | `aria-hidden="true"` (visual reinforcement only) |
| Canvas               | `aria-hidden="true"`                          |

### Focus Trap in Overlay

```js
// When overlay opens:
// 1. Save reference to triggering element (constellation button)
// 2. Focus first focusable element in overlay (close button)
// 3. Trap Tab/Shift+Tab within overlay
// 4. On Escape or close button: hide overlay, return focus to saved element
```

### Skip Link Implementation

```css
.skip-link {
  position: absolute;
  top: -9999px;
  left: var(--space-md);
  z-index: var(--z-skip-link);
  background: var(--color-gold-glow);
  color: var(--color-bg);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-hud);
  font-weight: 600;
  border-radius: 0 0 4px 4px;
}

.skip-link:focus {
  top: 0;
}
```

### Alt Text Strategy

| Asset                                | Alt text approach                                   |
|--------------------------------------|-----------------------------------------------------|
| Project logos (img)                  | `alt="[Project Name] logo"` (brief, functional)     |
| Screenshots                          | `alt="Screenshot of [feature description]"`         |
| AI reviewers team member PNGs        | `alt="[Name] — AI code review agent"`               |
| Trailer GIF                          | `alt=""` + adjacent text description, or full alt   |
| Decorative frame elements            | `aria-hidden="true"` on wrapper, no alt needed      |
| Gauge/rune decorations               | `aria-hidden="true"`                                |

### Color Contrast Audit

Run `axe-core` or `Colour Contrast Analyser` on:
- Text in HUD panels against panel background
- Link buttons against their background (especially in overlay)
- Focus ring gold against surrounding dark context
- Terminal green text on near-black background

---

## 5. prefers-reduced-motion Strategy

```css
/* Full motion (default) */
.orb-container {
  /* CSS transitions that complement GSAP */
  transition: transform var(--dur-medium) var(--ease-out-expo);
}

.constellation-btn__glyph {
  animation: pulse-star 2s ease-in-out infinite;
}

@keyframes pulse-star {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.15); }
}

.cmd-cursor {
  animation: blink 1s step-end infinite;
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {

  /* 1. Disable all CSS animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* 2. Keep cursor blink — it's a readability aid, not decorative */
  .cmd-cursor {
    animation: none;
    opacity: 1; /* static visible cursor */
  }

  /* 3. Static star glyphs */
  .constellation-btn__glyph {
    animation: none;
    opacity: 1;
  }

  /* 4. Skip link visible static state OK */
}
```

### Signal to WebGL/GSAP Layer

```js
// Detect in JS, pass to Three.js / GSAP
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reducedMotion) {
  // GSAP: set durations to near-zero or skip tweens
  // Three.js: disable auto-rotation, skip nebula bloom animation
  // Reveal sequence: show orb immediately without animation
  gsap.globalTimeline.timeScale(reducedMotion ? 1000 : 1); // or use conditionals per tween
}

// Also listen for runtime changes
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  // Pause/resume animations dynamically
});
```

### Which Animations to Disable vs Reduce

| Animation                          | Reduced motion behavior                              |
|------------------------------------|------------------------------------------------------|
| Reveal sequence orb bloom          | Instant show — no bloom transition                   |
| Nebula particle drift (WebGL)      | Freeze / very slow drift (0.05x speed)               |
| Auto-rotation of starfield         | Disable entirely                                     |
| Scroll-driven camera flythrough    | Disable — snap to positions instead                  |
| Hover: tilt + shimmer              | Remove tilt; keep subtle brightness change only      |
| Click: supernova burst             | Skip burst particles; instant overlay open           |
| CSS pulse animations on stars      | Static bright star, no pulse                         |
| Terminal cursor blink              | Keep (readability) or replace with static underscore |
| Overlay open/close fade            | Instant show/hide (display toggle)                   |

---

## 6. Media Handling Strategy

### Projects with Logos
- Display in `overlay__logo-zone` as `<img>` with appropriate alt text
- Max-height: ~80px, max-width: 180px
- Filter: `brightness(1.1) saturate(1.2)` for consistency on dark background
- If SVG logo available: inline for color control

### Projects with Screenshots (ado-git-repo-insights: 3 screenshots)
- Simple CSS scroll-snap horizontal gallery inside overlay media zone
- No JS carousel needed for POC — native scroll with `scroll-snap-type: x mandatory`
- Thumbnail strip below main image (CSS only)
- `<figure>` + `<figcaption>` for each

```css
.screenshot-gallery {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: var(--space-sm);
  scrollbar-color: var(--color-brass-mid) var(--color-iron);
}

.screenshot-gallery img {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: 100%;
  max-height: 240px;
  object-fit: contain;
}
```

### Projects with Video

**odd-ai-reviewers** (YouTube: `https://youtu.be/rkDQ7ZA47XQ`):
- YouTube iframe embed: `<iframe src="https://www.youtube-nocookie.com/embed/rkDQ7ZA47XQ" title="odd-ai-reviewers demo video" ...>`
- Use `youtube-nocookie.com` for privacy
- Lazy-load: only inject iframe when overlay opens (avoids pre-load cost)

**odd-fintech** (`design-assets/odd-fintech-video.mov`):
- Native `<video>` element with `controls`, `preload="none"`, `poster` attribute
- `.mov` format: Chrome/Firefox may not support — convert to `.mp4` (H.264) for POC, or use `<source>` with multiple formats
- **Recommendation**: Re-encode to `.mp4` for compatibility

```html
<video controls preload="none" aria-label="odd-fintech demo video">
  <source src="design-assets/odd-fintech-video.mp4" type="video/mp4">
  <source src="design-assets/odd-fintech-video.mov" type="video/quicktime">
  <p>Your browser doesn't support video. <a href="...">Download it instead.</a></p>
</video>
```

### Projects with No Assets (repo-standards, odd-self-hosted-ci-runtime, odd-map, coneyislandpottsville)
- Code/terminal aesthetic placeholder:
  - Dark panel with simulated terminal output styled in `font-mono`
  - Animated typing effect of key tagline (disabled under `prefers-reduced-motion`)
  - ASCII-art decorative border
  - Category-appropriate icon (SVG inline — gear for CI, map marker for odd-map, code brackets for standards)

```css
.placeholder-terminal {
  background: #050e05;
  border: 1px solid var(--color-iron-light);
  padding: var(--space-md);
  font-family: var(--font-mono);
  color: var(--color-text-mono);
  font-size: var(--text-sm);
  min-height: 120px;
  position: relative;
}

.placeholder-terminal::before {
  content: '$ ';
  color: var(--color-brass-light);
}
```

### Projects with App-Store/Marketplace Links
- Styled link buttons (not actual store badges — avoids trademark/asset issues)
- Icon: inline SVG appropriate to platform
- Platforms to handle: GitHub, npm, PyPI, VS Marketplace, Docker Hub, Live Demo

```css
.link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(135deg, var(--color-brass-dark), var(--color-brass-mid));
  border: 1px solid var(--color-brass-light);
  color: var(--color-dark-walnut);
  font-family: var(--font-hud);
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: filter var(--dur-fast), transform var(--dur-fast);
}

.link-btn:hover {
  filter: brightness(1.2);
  transform: translateY(-1px);
}

.link-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,0,0,0.2);
}
```

---

## 7. Project Detail Panel Design

### Layout Variants by Content Type

**Variant A: Logo + Description + Links** (repo-standards, odd-self-hosted-ci-runtime)
```
┌─────────────────────────────────────┐
│ [LOGO/ICON placeholder]  PROJECT NAME│
│                          tagline     │
├─────────────────────────────────────┤
│ [terminal placeholder or logo]       │
├─────────────────────────────────────┤
│ Description text (2-3 paragraphs)   │
├─────────────────────────────────────┤
│ [GitHub] [npm/PyPI] [Demo]          │
└─────────────────────────────────────┘
```

**Variant B: Logo + Screenshots + Description + Links** (ado-git-repo-insights)
```
┌─────────────────────────────────────┐
│ [LOGO]           PROJECT NAME       │
├─────────────────────────────────────┤
│ [Screenshot gallery — scroll-snap]  │
│ ←  screenshot 1 of 3  →             │
├─────────────────────────────────────┤
│ Description text                    │
├─────────────────────────────────────┤
│ [GitHub] [PyPI] [Marketplace] [Demo]│
└─────────────────────────────────────┘
```

**Variant C: YouTube Video + Description + Links** (odd-ai-reviewers)
```
┌─────────────────────────────────────┐
│ [BANNER image, clipped]  NAME       │
├─────────────────────────────────────┤
│ [YouTube iframe embed 16:9]         │
├─────────────────────────────────────┤
│ Team member avatars (6 × small PNG) │
├─────────────────────────────────────┤
│ Description text                    │
├─────────────────────────────────────┤
│ [GitHub] [npm] [YouTube]            │
└─────────────────────────────────────┘
```

**Variant D: Native Video + Logo + Description + Links** (odd-fintech)
```
┌─────────────────────────────────────┐
│ [LOGO]           PROJECT NAME       │
├─────────────────────────────────────┤
│ [<video> element with controls]     │
├─────────────────────────────────────┤
│ Description text                    │
├─────────────────────────────────────┤
│ [GitHub]                            │
└─────────────────────────────────────┘
```

**Variant E: External Website** (coneyislandpottsville)
```
┌─────────────────────────────────────┐
│ [Placeholder icon]   PROJECT NAME   │
├─────────────────────────────────────┤
│ [terminal placeholder with domain]  │
├─────────────────────────────────────┤
│ Description text                    │
├─────────────────────────────────────┤
│ [Visit Site] [Chat Site]            │
└─────────────────────────────────────┘
```

### Overlay Structure Notes

- Overlay max-width: 720px, max-height: 85vh, centered with flexbox
- Inner scroll: `overflow-y: auto` on `.overlay__content` if content is tall
- Steampunk frame treatment: brass border, corner ornaments (smaller version of page frame), subtle inner shadow
- Backdrop: `rgba(5, 3, 1, 0.85)` with `backdrop-filter: blur(6px)`
- Close button: top-right corner, styled as a brass gear/X, large touch target (44×44px min)

### Close Mechanism
- Visible ✕ button (top-right of overlay)
- Click backdrop closes overlay
- Escape key closes overlay
- All three return focus to the activating constellation nav button

### Link Button Types
```
[GitHub]       → icon: github mark SVG
[npm]          → icon: npm hexagon SVG
[PyPI]         → icon: python logo SVG (simplified)
[Marketplace]  → icon: shopping bag or VS Code icon SVG
[Docker Hub]   → icon: whale SVG (simplified)
[Live Demo]    → icon: external link arrow SVG
[YouTube]      → icon: play triangle SVG
[Chat]         → icon: speech bubble SVG
```

---

## 8. Asset Pre-requisites

### Available (in design-assets/)
- `odd-ai-reviewers-banner.png` — splash/header image for overlay
- `odd-ai-reviewers-trailer.gif` — can show in overlay media zone (heavy: 32MB — consider lazy loading)
- `*-review-team-*.png` (6 files) — team member avatars for overlay
- `ado-git-repo-insights-logo.png` — project logo
- `ado-git-repo-insights-screenshot-*.png` (3 files) — screenshot gallery
- `odd-fintech-logo.png` — project logo
- `odd-fintech-video.mov` — native video (needs transcoding to .mp4)

### Missing Assets (need creation or workaround)

| Asset                           | Approach                                                  |
|---------------------------------|-----------------------------------------------------------|
| Frame corner SVG ornaments      | Create inline CSS + SVG — no file needed                 |
| Gauge dial decorations          | Pure CSS (see section 2) — no file needed                |
| Rune/glyph textures             | Unicode characters + CSS font trick (ᚠ ᚢ ᚦ ᚨ etc.)      |
| repo-standards logo/icon        | CSS: code bracket `</>` icon in SVG inline               |
| odd-self-hosted-ci logo/icon    | CSS: gear/docker SVG inline                              |
| odd-map logo/icon               | CSS: map pin SVG inline                                  |
| coneyislandpottsville icon      | CSS: globe/domain SVG inline                             |
| odd-ai-reviewers team member 7th? | Only 6 PNGs present + 1 leader = 7 total (check names) |
| Platform icons (GitHub, npm...) | Inline SVG — use Simple Icons paths (no external CDN)    |

### Inline SVG corner ornament concept
```svg
<!-- Brass corner ornament — top-left -->
<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Main corner bracket -->
  <path d="M0,0 L80,0 L80,12 L12,12 L12,80 L0,80 Z"
        fill="url(#brass-gradient)"/>
  <!-- Decorative scroll -->
  <path d="M15,15 Q25,25 20,35 Q15,45 25,50"
        stroke="#d4a853" stroke-width="1.5" fill="none"/>
  <!-- Rivet circles -->
  <circle cx="20" cy="6" r="4" fill="url(#rivet-gradient)"/>
  <circle cx="6" cy="20" r="4" fill="url(#rivet-gradient)"/>
  <defs>
    <radialGradient id="brass-gradient">
      <stop offset="0%" stop-color="#d4a853"/>
      <stop offset="100%" stop-color="#7a5c0f"/>
    </radialGradient>
    <radialGradient id="rivet-gradient">
      <stop offset="0%" stop-color="#e0b860"/>
      <stop offset="100%" stop-color="#5a3e0a"/>
    </radialGradient>
  </defs>
</svg>
```

### Font / Icon Dependencies

| Dependency        | Load strategy                        | Fallback                        |
|-------------------|--------------------------------------|---------------------------------|
| Cinzel Decorative | Google Fonts CDN                     | Georgia serif                   |
| Cinzel            | Google Fonts CDN (same request)      | Georgia serif                   |
| IM Fell English   | Google Fonts CDN (same request)      | Georgia serif                   |
| JetBrains Mono    | Google Fonts CDN (same request)      | Courier New monospace           |
| Rajdhani          | Google Fonts CDN (same request)      | Arial sans-serif                |
| Platform icons    | Inline SVG (no CDN)                  | Unicode fallback characters     |
| Runic symbols     | Unicode in CSS `content`             | ASCII approximation             |

**Note**: Combining all 5 font families in one Google Fonts request keeps it to 1 extra HTTP call.

---

## Implementation Order Recommendation

1. **Base HTML shell** — app-shell, grid layout, canvas placeholder, semantic regions
2. **CSS custom properties** — full token set before writing any component CSS
3. **Frame decorations** — corners, edges, gauges (purely visual, no JS needed)
4. **HUD panels** — nav list, status panel, command line — static content first
5. **Overlay structure** — hidden by default, keyboard-navigable, focus trap
6. **Typography** — apply font stack across all components
7. **Focus indicators** — verify with keyboard-only navigation before adding JS
8. **prefers-reduced-motion** — bake in from the start, not as an afterthought
9. **Media zones** — per-project content variants
10. **Integration points** — expose CSS classes / custom properties for WebGL/GSAP layer to hook into (e.g., `.orb-revealed`, `.project-focused`, data attributes for star label positions)

---

## Key Integration Points with Other Specialists

### For WebGL/Three.js Engineer
- `#orb-canvas` is `position: fixed; inset: 0; z-index: 0` — canvas fills behind all HTML
- Star label positions: JS injects `<div class="star-label">` into `#star-labels` (z:25, aria-hidden)
- State class on `#app-shell`: `.state-revealing`, `.state-idle`, `.state-project-focused` for CSS to react to

### For GSAP/Motion Designer
- All CSS transitions use `--dur-*` custom properties — GSAP should match these values
- Overlay open/close will need GSAP clip-path or transform for the steampunk "iris open" effect
- The frame edge elements can be targets for GSAP scrub on scroll (subtle parallax movement)

### For Creative Director
- Color token system is ready to receive final palette adjustments in `:root` — one place to change all
- Typography choices (Cinzel + IM Fell English) should be validated against brand direction
- Frame ornament SVGs should be reviewed for ornamentation density

---
*Generated by: Front-End Architect agent — Victorian Techno-Mage Portfolio POC*
