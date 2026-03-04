# Front-End Architect Review --- Beta 0.1.0

**Reviewer**: Front-End Systems Architect
**Scope**: HTML structure, CSS layout, accessibility, responsive design, DOM architecture
**Date**: 2026-03-04

---

## 1. Left Sidebar Restructure

### Current State (Alpha)

The left sidebar (`#constellation-nav`) uses fantasy constellation names ("The Forge Septet", "The Scribe's Lens", etc.) as button labels. Users have no way to understand what each project actually is before clicking. The header reads "CONSTELLATION INDEX".

**Current HTML (index.html:84-130)**:
```html
<nav id="constellation-nav" aria-label="Project constellations">
  <span class="hud-label">CONSTELLATION INDEX</span>
  <ul>
    <li>
      <button data-project-id="odd-ai-reviewers" aria-pressed="false" aria-describedby="project-hint">
        <span class="glyph" aria-hidden="true">&#9733;</span>
        <span class="constellation-name">The Forge Septet</span>
      </button>
    </li>
    ...
  </ul>
</nav>
```

### Proposed Changes

#### 1a. Header Text Change

Replace "CONSTELLATION INDEX" with "ODD PORTFOLIO":

```html
<span class="hud-label">ODD PORTFOLIO</span>
```

Update `aria-label` on the `<nav>` to match:

```html
<nav id="constellation-nav" aria-label="Project portfolio navigation">
```

#### 1b. Button Labels --- Use Real Project Names

Replace each `.constellation-name` with the actual project name from `data.js`. The `data.js` `PROJECTS` array provides:

| data-project-id | Current Label | New Label |
|---|---|---|
| odd-ai-reviewers | The Forge Septet | odd-ai-reviewers |
| ado-git-repo-insights | The Scribe's Lens | ado-git-repo-insights |
| repo-standards | The Iron Codex | repo-standards |
| odd-self-hosted-ci | The Engine Core | odd-self-hosted-ci |
| odd-map | The Navigator's Rose | odd-map |
| odd-fintech | The Alchemist's Eye | odd-fintech |
| coney-island | The Hearth Star | Coney Island Pottsville |

#### 1c. Hover/Touch Description --- Subtitle Pattern

**Recommended approach**: A persistent subtitle `<span>` below the project name rather than a tooltip. Rationale:
- Tooltips are not accessible on touch devices (no hover)
- Tooltips require extra ARIA wiring and timing management
- Expandable descriptions add complexity and animation jank risk in a sidebar that already has limited width
- A subtitle is always visible, always announced, zero interaction cost

**Proposed button structure**:

```html
<li>
  <button data-project-id="odd-ai-reviewers" aria-pressed="false">
    <span class="glyph" aria-hidden="true">&#9733;</span>
    <span class="project-label">
      <span class="project-name">odd-ai-reviewers</span>
      <span class="project-desc">AI code review pipeline</span>
    </span>
  </button>
</li>
```

The `.project-desc` text should be a short (3-6 word) description derived from each project's `tagline` in `data.js`. Proposed short descriptions:

| Project | Short Description |
|---|---|
| odd-ai-reviewers | AI code review pipeline |
| ado-git-repo-insights | Azure DevOps PR metrics |
| repo-standards | Repo quality standards |
| odd-self-hosted-ci | Self-hosted CI runtime |
| odd-map | Interactive office locator |
| odd-fintech | Financial intelligence dashboard |
| Coney Island Pottsville | Restaurant with AI chat |

**Accessibility**: Because the description is a visible child of the `<button>`, it is automatically read by screen readers as part of the button's accessible name. No `aria-describedby` is needed. The existing `aria-describedby="project-hint"` pointing to the generic hint `<p id="project-hint">` can be removed from individual buttons since the per-project description is now inline. Keep `#project-hint` in the DOM for the overlay modal instructions.

**CSS additions**:

```css
.project-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;           /* allow text-overflow to work in flex child */
}

.project-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.project-desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.3;
}
```

The existing `.constellation-name` class can be removed.

#### 1d. Mobile Touch Behavior

On mobile (`<768px`), the nav slides in from the left with 280px / 85vw width (styles.css:1146-1158). The subtitle pattern works here without modification --- the description is always visible and the 280px width is sufficient. The existing `min-height: 44px` touch target (styles.css:1167) may need to increase to ~52px to accommodate the two-line button content. Verify with testing.

**Recommendation**: Increase mobile button `min-height` to 52px:

```css
@media (max-width: 767px) {
  #constellation-nav button {
    min-height: 52px;
  }
}
```

---

## 2. Right Sidebar Restructure

### Current State (Alpha)

The right sidebar (`#status-panel`, index.html:132-144) shows:
- Header: "STATUS"
- "ARCANE CONSOLE v4.2.1"
- "scanning systems..."
- MANA meter
- PHASE indicator

### Proposed Changes

#### 2a. Header Change

Replace the first `.status-line` content from "ARCANE CONSOLE v4.2.1" to "Odd Essentials". Change the `<span class="hud-label">` from "STATUS" to "ODD ESSENTIALS" to make it the primary brand presence on the right side.

Alternatively, keep "STATUS" as the HUD label and change only the first status line:

```html
<p class="status-line brand-line">ODD ESSENTIALS</p>
```

**Recommendation**: Use the HUD label for branding since it has the Cinzel display font styling:

```html
<span class="hud-label">ODD ESSENTIALS</span>
```

And keep the status lines for the terminal loading animation.

#### 2b. Terminal Loading Animation DOM

Add DOM elements for the loading sequence. The loading animation needs:

1. **A text cycling area** --- lines of "scanning" text that cycle during reveal
2. **A loading bar element** --- a visual progress indicator

**Proposed HTML** (replaces current `.status-readout` contents):

```html
<aside id="status-panel" aria-label="System status">
  <span class="hud-label">ODD ESSENTIALS</span>

  <div class="status-readout" role="status" aria-live="polite" aria-atomic="false">
    <!-- Terminal scan lines (cycled by JS during loading animation) -->
    <div class="scan-output" aria-relevant="additions text">
      <p class="scan-line"></p>
      <p class="scan-line"></p>
      <p class="scan-line"></p>
    </div>

    <!-- Loading progress bar -->
    <div class="loading-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Loading progress">
      <div class="loading-bar__fill"></div>
      <span class="loading-bar__text">0%</span>
    </div>

    <!-- Post-load status (hidden until loading completes) -->
    <div class="status-ready" hidden>
      <p class="status-line">SYSTEMS NOMINAL</p>
      <p class="status-line">PHASE <span class="phase-indicator">READY</span></p>
    </div>
  </div>
</aside>
```

**Key accessibility decisions**:

- `role="status"` on `.status-readout` creates an implicit `aria-live="polite"` region. Remove the `aria-live="polite"` from the `<aside>` itself (index.html:133) to avoid double announcements.
- `aria-atomic="false"` ensures only changed content is announced, not the entire readout on every scan line change.
- `aria-relevant="additions text"` on `.scan-output` tells screen readers to announce new lines and text changes but not removals (when old scan lines are cycled out).
- The `role="progressbar"` on `.loading-bar` provides proper semantics. JS must update `aria-valuenow` and the visual fill as loading progresses.
- The MANA meter (current Alpha) should be removed --- it has no real data behind it and is a holdover from the fantasy theme.

#### 2c. Loading Bar CSS

```css
.loading-bar {
  position: relative;
  width: 100%;
  height: 8px;
  background: var(--color-iron);
  border: 1px solid rgba(139, 105, 20, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: var(--space-sm) 0;
}

.loading-bar__fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(to right, #4ADE80, #7AFFB2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-bar__text {
  position: absolute;
  right: 0;
  top: -18px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-mono);
}

.scan-output {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 60px;
}

.scan-line {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-mono);
  line-height: 1.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

#### 2d. Scan Line Content

The Motion/Animation Engineer will drive the actual text cycling via GSAP. The DOM structure above provides 3 `.scan-line` elements that JS can populate in sequence. Suggested scan text content (for the Motion Engineer):

```
initializing odd systems...
loading portfolio modules...
scanning project repositories...
calibrating starfield engine...
indexing 7 project nodes...
mapping constellation links...
systems nominal
```

---

## 3. Greek Key Border Structure

### Current State (Alpha)

The top edge uses a rivet strip (`.frame__rune-band`, styles.css:524-546) --- a `repeating-linear-gradient` that creates a small dot/dash pattern. This sits below the frame edge at `top: var(--frame-border-width)`.

### Proposed Approach: CSS-Only Greek Key

The Greek key (meander) pattern can be achieved with a CSS `repeating-linear-gradient` stack or an inline SVG background. CSS-only is preferred per project constitution (procedural-first).

**Option A: CSS gradient stack** (simpler, good enough for thin band):

```css
.frame__greek-key {
  position: absolute;
  top: var(--frame-border-width);
  left: var(--frame-corner-size);
  right: var(--frame-corner-size);
  height: 8px;
  background:
    repeating-linear-gradient(
      90deg,
      var(--color-brass-light) 0px,
      var(--color-brass-light) 4px,
      transparent 4px,
      transparent 8px,
      var(--color-brass-light) 8px,
      var(--color-brass-light) 12px,
      transparent 12px,
      transparent 16px
    ),
    repeating-linear-gradient(
      0deg,
      var(--color-brass-light) 0px,
      var(--color-brass-light) 2px,
      transparent 2px,
      transparent 6px,
      var(--color-brass-light) 6px,
      var(--color-brass-light) 8px
    );
  opacity: 0.6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
```

**Option B: Inline SVG data URI** (more accurate Greek key geometry):

```css
.frame__greek-key {
  position: absolute;
  top: var(--frame-border-width);
  left: var(--frame-corner-size);
  right: var(--frame-corner-size);
  height: 10px;
  background-image: url("data:image/svg+xml,..."); /* Greek key SVG tile */
  background-repeat: repeat-x;
  background-size: 20px 10px;
  opacity: 0.6;
  filter: sepia(0.4) saturate(2) brightness(0.9);
}
```

**Recommendation**: Option B (SVG data URI) for a recognizable Greek key pattern. Option A looks more like a generic stepped border. The Technical Artist should provide the SVG tile.

**HTML change**: Rename `.frame__rune-band` to `.frame__greek-key` in both HTML and CSS, or replace the class in HTML:

```html
<div class="frame__greek-key" aria-hidden="true"></div>
```

**Responsive behavior**:
- Desktop: Full width between corners
- Tablet (1199px): Corners shrink to 60px, pattern still spans full width between them
- Mobile (767px): Corners at 40px, pattern visible but at reduced height (6px). Could also hide entirely since the frame is minimal on mobile.

**Recommendation**: Hide the Greek key on mobile to reduce visual clutter:

```css
@media (max-width: 767px) {
  .frame__greek-key { display: none; }
}
```

---

## 4. Responsive Bug Analysis

### Bug: "Responsiveness broken on resize (large to small screen)"

#### Root Cause Analysis

After reviewing the CSS, I identified **three contributing factors**:

#### 4a. CSS Grid Column Conflict at 768-1199px

**File**: styles.css:1229-1233

```css
@media (min-width: 768px) and (max-width: 1199px) {
  #app-shell {
    grid-template-columns: clamp(140px, 15vw, 180px) 1fr clamp(140px, 15vw, 180px);
  }
}
```

And styles.css:1113-1115:

```css
@media (max-width: 1199px) {
  #app-shell {
    grid-template-columns: 160px 1fr 160px;
  }
}
```

**Problem**: Both media queries apply at 768-1199px. The `max-width: 1199px` rule sets `160px` fixed columns, while the `768px-1199px` range rule sets `clamp(140px, 15vw, 180px)`. Due to cascade order (the `min-width: 768px` rule appears later), the `clamp()` values win. But going from large to small viewport, the `clamp(140px, 15vw, 180px)` at 15vw evaluates to:
- At 1100px: `165px` (fine)
- At 900px: `135px` (below the 140px clamp minimum, so clamped to 140px)
- At 768px: `115.2px` (clamped to 140px)

This is technically correct due to `clamp()` floors, but the transition is discontinuous. At 767px, the grid jumps to single-column mobile layout. The sidebars don't collapse gracefully.

**Fix**: Remove the redundant `max-width: 1199px` grid override. Keep only the `768-1199px` range query with `clamp()`. This eliminates the cascade conflict:

```css
/* Remove this redundant rule from the max-width: 1199px block */
/* #app-shell { grid-template-columns: 160px 1fr 160px; } */
```

#### 4b. Fixed-Position Nav Not Returning to Grid on Resize

**File**: styles.css:1145-1158

When the viewport is `<768px`, `#constellation-nav` gets `position: fixed` with `transform: translateX(-100%)`. When the user resizes back above 768px, these styles are removed by the media query, BUT any inline styles set by JavaScript (the hamburger menu's `nav--open` class and transitions) may persist.

**Root cause**: If the hamburger menu was opened then closed at mobile width, the nav element retains its CSS transition property. When resizing above 768px, the browser re-applies grid positioning, but the element may flash or misposition.

**Fix**: Add an explicit reset at the tablet/desktop breakpoint:

```css
@media (min-width: 768px) {
  #constellation-nav {
    position: static;
    transform: none;
    transition: none;
    width: auto;
    max-width: none;
  }
}
```

Also add a resize handler in `interactions.js` to clean up mobile nav state:

```javascript
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768 && navOpen) {
    closeHamburgerNav();
  }
});
```

Use a debounced version (100ms) to avoid excessive calls.

#### 4c. Status Panel `display: none` Not Toggling Back

**File**: styles.css:1172-1174

```css
@media (max-width: 767px) {
  #status-panel { display: none; }
}
```

This correctly hides the status panel on mobile. However, there is no explicit `display: flex` reset for desktop. The panel relies on the base styles at styles.css:706 (`display: flex`). If any JavaScript sets `display` as an inline style on `#status-panel`, it will override the CSS and the panel won't reappear on resize.

**Fix**: Add explicit desktop reset:

```css
@media (min-width: 768px) {
  #status-panel {
    display: flex;
  }
}
```

#### 4d. Hamburger Button Z-Index Conflict

Currently `.hamburger-btn` has `z-index: var(--z-hamburger)` (35) and shows only on mobile. No issue found here, but verify it doesn't overlap with the frame decorations at the 768px boundary.

---

## 5. Content Updates

### 5a. Command Line Text

**Current** (animations.js:302): After reveal, the discoverability affordance types:
```
7 anomalies detected. investigate?
```

**Beta change**: Replace with:
```
Force multipliers for small businesses. Select a project.
```

Update in `animations.js`, function `playDiscoverabilityAffordance()`:

```javascript
gsap.to(cmdText, {
  duration: 2.0,
  delay: 0.5,
  text: { value: 'force multipliers for small businesses. select a project.', delimiter: '' },
  ease: 'none'
});
```

Also update the reveal sequence CLI messages (animations.js:202-206):

| Current | Beta |
|---|---|
| `reveal universe` | `initializing portfolio...` |
| `calibrating starfield...` | `loading project data...` |
| `ignition sequence active` | `systems online` |

And the scroll-end message (animations.js:478):
```
Current: "universe revealed. select a constellation to begin"
Beta:    "all projects loaded. select a project."
```

### 5b. Screen-Reader-Only Content

**File**: index.html:152

Current:
```html
<p class="sr-only">An interactive starfield with 7 glowing star nodes, each representing a portfolio project. Use the constellation navigation to select a project, or click a star directly.</p>
```

Update to remove constellation language:

```html
<p class="sr-only">An interactive starfield with 7 glowing nodes, each representing a portfolio project by Odd Essentials. Use the project navigation to select a project, or click a star directly.</p>
```

**File**: index.html:214

Current:
```html
<p id="project-hint" class="sr-only">Activate a project to open its detail panel. Press Escape to close.</p>
```

No change needed --- this is already project-focused.

**File**: index.html:178-211 (sr-only project list)

Update heading from "Portfolio Projects" to "Odd Essentials Portfolio" for consistency:

```html
<h2>Odd Essentials Portfolio</h2>
```

### 5c. Page Title and Meta

**File**: index.html:6
```html
<title>Odd Essentials | Portfolio</title>
```

**File**: index.html:9-10
```html
<meta property="og:title" content="Odd Essentials | Portfolio">
<meta property="og:description" content="Force multipliers for small businesses -- 7 open-source projects in an interactive starfield.">
```

---

## 6. Spec Recommendations (Functional Requirements)

### FR-B001: Left Sidebar Header

The left navigation header label SHALL read "ODD PORTFOLIO". The `<nav>` element SHALL have `aria-label="Project portfolio navigation"`.

### FR-B002: Left Sidebar Project Names

Each navigation button SHALL display the project's canonical name (from `data.js` `name` field) instead of constellation names. The star glyph prefix SHALL be retained.

### FR-B003: Left Sidebar Project Descriptions

Each navigation button SHALL include a subtitle element displaying a short (3-6 word) project description. The subtitle SHALL be a visible `<span>` child of the button, not a tooltip.

### FR-B004: Left Sidebar Accessibility

Navigation buttons SHALL NOT use `aria-describedby` for descriptions (descriptions are inline visible text). Screen readers SHALL announce the full button content (project name + description) as the accessible name.

### FR-B005: Right Sidebar Branding

The right sidebar HUD label SHALL read "ODD ESSENTIALS". The first status line ("ARCANE CONSOLE v4.2.1") SHALL be removed.

### FR-B006: Right Sidebar Loading Animation DOM

The right sidebar SHALL contain:
- A `.scan-output` container with 3 `.scan-line` paragraph elements for text cycling
- A `.loading-bar` element with `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="Loading progress"`
- A `.loading-bar__fill` child for the visual fill
- A `.status-ready` container (initially `hidden`) with post-load status text

### FR-B007: Right Sidebar ARIA Live Region

The `.status-readout` container SHALL have `role="status"` (implicit `aria-live="polite"`). The `<aside>` SHALL NOT have its own `aria-live` attribute to prevent double announcements. The `.scan-output` SHALL have `aria-relevant="additions text"`.

### FR-B008: MANA Meter Removal

The MANA `<meter>` element SHALL be removed from the right sidebar. It has no backing data and is a vestige of the fantasy theme.

### FR-B009: Greek Key Top Border

The `.frame__rune-band` SHALL be replaced with a `.frame__greek-key` element using a repeating Greek key (meander) pattern. The pattern SHALL use SVG data URI or CSS gradients in brass tones. The element SHALL be hidden on viewports below 768px.

### FR-B010: Command Line Text --- Post-Reveal

After the reveal sequence completes, the command line SHALL type: "Force multipliers for small businesses. Select a project."

### FR-B011: Command Line Text --- Reveal Sequence

The reveal sequence CLI messages SHALL be updated to non-fantasy language (e.g., "initializing portfolio...", "loading project data...", "systems online").

### FR-B012: Responsive Grid Fix

The redundant `grid-template-columns: 160px 1fr 160px` in the `max-width: 1199px` media query SHALL be removed. Only the `clamp()`-based rule in the 768-1199px range SHALL define tablet sidebar widths.

### FR-B013: Responsive Nav Reset

A `min-width: 768px` media query SHALL reset `#constellation-nav` to `position: static; transform: none; transition: none;` to prevent mobile slide-out styles from persisting after resize.

### FR-B014: Responsive Status Panel Reset

A `min-width: 768px` media query SHALL explicitly set `#status-panel { display: flex; }` to prevent inline JS styles from hiding the panel after resize.

### FR-B015: Resize Handler Cleanup

`interactions.js` SHALL add a debounced `resize` event listener that calls `closeHamburgerNav()` when `window.innerWidth >= 768` and the nav is open.

### FR-B016: Page Metadata Update

The `<title>` SHALL be "Odd Essentials | Portfolio". OG meta tags SHALL be updated to match new branding language.

### FR-B017: Screen Reader Content Update

All `.sr-only` text SHALL be updated to remove constellation/fantasy terminology. Accessible descriptions SHALL reference "project navigation" instead of "constellation navigation".

### FR-B018: Mobile Button Height

On viewports below 768px, `#constellation-nav button` SHALL have `min-height: 52px` to accommodate the two-line button layout (name + description).

---

## Summary of All File Changes

| File | Changes |
|---|---|
| `index.html` | Lines 6, 9-10 (metadata); 84-85 (nav label+aria); 87-128 (button labels+structure); 132-144 (status panel restructure); 73 (rune-band to greek-key); 152, 180 (sr-only text) |
| `css/styles.css` | New classes: `.project-label`, `.project-name`, `.project-desc`, `.loading-bar`, `.loading-bar__fill`, `.loading-bar__text`, `.scan-output`, `.scan-line`, `.frame__greek-key`. Modified: remove `.constellation-name`, `.mana-meter`, `.frame__rune-band`. Add `min-width: 768px` resets. Remove redundant grid rule. |
| `js/interactions.js` | Add debounced resize handler. Remove `aria-describedby` references if dynamically set. |
| `js/animations.js` | Update all CLI text strings. Update reveal sequence messages. Target new DOM elements (`.scan-line`, `.loading-bar`). |
| `js/data.js` | Add `shortDesc` field to each project (or derive in template). |
