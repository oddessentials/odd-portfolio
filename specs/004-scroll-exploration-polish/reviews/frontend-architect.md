# Front-End Systems Architect Review

**Spec**: `specs/004-scroll-exploration-polish/spec.md` v0.2.0
**Reviewer**: Front-End Systems Architect
**Date**: 2026-03-04
**Verdict**: **APPROVED WITH AMENDMENTS**

---

## 1. Scroll Container DOM Structure (FR-009 / FR-010)

### Current State

The current layout uses a triple-lockdown on scrolling:

- `html, body` — `overflow: hidden` (line 90, `styles.css`)
- `#app-shell` — `overflow: hidden` (line 183, `styles.css`)
- `#app-shell` fills `100vw x 100vh` via CSS Grid

All three must be addressed to enable scrolling. The spec calls for conditional removal (FR-011) after the reveal sequence completes.

### Option Analysis

#### (a) Scroll-spacer div after `#app-shell`

**Approach**: Keep `#app-shell` as a `position: fixed` full-viewport container. Add a sibling `<div class="scroll-spacer">` after `#app-shell` that provides artificial scroll height. Remove `overflow: hidden` from `html` and `body` only; `#app-shell` retains its own `overflow: hidden`.

**Pros**:
- Zero restructuring of the existing DOM. `#app-shell` and its children are untouched.
- The CSS Grid layout, z-index stack, and all containment rules remain intact.
- ScrollTrigger can use the document scroll (default scroller) with the spacer providing the scrollable distance.
- Simple to implement: one new `<div>`, one CSS rule (`height: calc(100vh + 300px)`), and a JS class toggle on `<html>` to flip overflow.

**Cons**:
- The spacer div is semantically empty content. Screen readers may encounter it (mitigated with `aria-hidden="true"` and `role="presentation"`).
- Requires `#app-shell` to switch from `position: relative` to `position: fixed` (or use ScrollTrigger's `pin` on it).

**Verdict**: **RECOMMENDED.** This is the lowest-risk approach.

#### (b) Wrap `#app-shell` in a scroll container

**Approach**: Insert a `<div id="scroll-wrapper">` around `#app-shell`. The wrapper becomes the scrollable element; `#app-shell` is pinned inside it.

**Pros**:
- Clean semantic grouping: the scroll context wraps the entire app.
- ScrollTrigger can use `scroller: '#scroll-wrapper'` for isolated scroll context.

**Cons**:
- **High risk.** Moving `#app-shell` out of its current position as a direct child of `<body>` may break:
  - The `position: fixed` elements inside it (`#orb-canvas`, `.frame`, `#orb-hitzone`, `.hamburger-btn`) — fixed positioning is relative to the viewport only when no ancestor has a `transform`, `filter`, or `will-change` property. The wrapper itself must be carefully styled.
  - The `100vw / 100vh` sizing — if the wrapper has `overflow: auto`, scrollbar width may cause `100vw` to overflow horizontally.
- Requires updating ScrollTrigger configuration to use a custom scroller, which changes how `trigger`, `start`, and `end` values are calculated.
- Every `position: fixed` element in the tree needs verification.

**Verdict**: Avoid. Too many side-effect risks for insufficient benefit over option (a).

#### (c) ScrollTrigger's built-in `pin` mechanism

**Approach**: Use `ScrollTrigger.create({ trigger: '#app-shell', pin: true, ... })`. Let ScrollTrigger handle the pin mechanics (it auto-generates a spacer and applies `position: fixed` + transforms).

**Pros**:
- ScrollTrigger manages all pin/unpin lifecycle, including spacer creation, scroll distance calculation, and cleanup.
- Battle-tested across thousands of sites.

**Cons**:
- ScrollTrigger's pin applies `transform: translate3d(0, Npx, 0)` to the pinned element. **This creates a new containing block**, which breaks `position: fixed` descendants. The `#orb-canvas` (line 191-198, `styles.css`, `position: fixed; inset: 0`), `.frame` (line 248-251, `position: fixed; inset: 0`), `#orb-hitzone` (line 948-953, `position: fixed; inset: 0`), and `.hamburger-btn` (line 205, `position: fixed`) would all break — they'd be positioned relative to `#app-shell` instead of the viewport.
- ScrollTrigger's `pinSpacing` mechanics conflict with the full-viewport grid layout.
- The `pinType: 'fixed'` option avoids the transform but doesn't work with all browsers consistently (Safari issues documented).

**Verdict**: **Do not use pin on `#app-shell` directly.** The containing-block violation is the same bug that caused the logo-cursor desync (commit `8a24a13`). However, `ScrollTrigger.create()` *without* `pin` is fine for reading scroll progress — use it to drive zone transitions on the document scroller while `#app-shell` stays `position: fixed` manually.

### Recommendation

Use **option (a)** with the following implementation:

1. Change `#app-shell` from `position: relative` to `position: fixed; inset: 0` after reveal completes (via a JS class toggle, e.g., `.scroll-active`).
2. Add `<div id="scroll-spacer" aria-hidden="true" role="presentation"></div>` after `#app-shell` in the DOM.
3. After the reveal sequence, add class `scroll-active` to `<html>` which sets `overflow-y: auto` on `html` and `body`, and sets `#scroll-spacer` height to `calc(100vh + 300px)`.
4. Use `ScrollTrigger.create({ trigger: '#scroll-spacer', start: 'top top', end: 'bottom bottom', onUpdate: self => { /* read self.progress */ } })` to drive zone transitions.

**Severity**: HIGH — without a correct approach here, the scroll feature is blocked.

---

## 2. Star Labels Viewport Repositioning (FR-020 -- FR-023)

### Current State

`#star-labels` is currently:
- A child of `#main-viewport` (line 154, `index.html`)
- Positioned `absolute`, `inset: 0` (line 927-932, `styles.css`)
- `#main-viewport` is the center CSS Grid column (`grid-column: 2`) with `overflow: hidden` (line 916-925)

This means labels for stars at x < -1 or x > 1 (in world coordinates) get clipped by the `#main-viewport` boundaries when projected to screen coordinates. Stars like `odd-fintech` at x=-2.2 and `repo-standards` at x=2.2 are affected.

### Z-Index Placement

Current z-index stack (from `styles.css` custom properties):

| Layer | z-index | Element |
|---|---|---|
| Canvas | 0 | `#orb-canvas` |
| Frame | 10 | `.frame` |
| HUD panels | 20 | `#constellation-nav`, `#status-panel` |
| Star labels | 25 | `#star-labels` (current) |
| Logo follow | 30 | `#brand-logo.logo--following` |
| Hamburger | 35 | `.hamburger-btn` |
| Nav overlay | 40 | Mobile nav |
| Overlay | 90-100 | `#project-overlay` |

The current `--z-star-labels: 25` places labels between the HUD panels (20) and the logo (30). This is correct and should be preserved when moving the container.

**Recommendation**: Move `#star-labels` out of `#main-viewport` and into `#app-shell` as a direct child (or even as a sibling of `#app-shell` at the `<body>` level if option (a) is used). The element should be:

```css
#star-labels {
  position: fixed;
  inset: 0;
  z-index: var(--z-star-labels); /* 25 */
  pointer-events: none;
  overflow: visible;  /* explicit — no clipping */
}
```

This places labels above the canvas and frame (z=0, z=10) but below the logo-follow (z=30). Sidebar clicks work because sidebars are at z=22 (`calc(var(--z-hud) + 2)`) which is *below* z=25 — however, the `pointer-events: none` on the container means clicks pass through to the sidebars regardless.

Wait — the sidebars are at `z-index: calc(var(--z-hud) + 2)` = 22. The star labels container would be at z=25, which is *above* the sidebars. This means even with `pointer-events: none` on the container, individual labels with `pointer-events: auto` would sit above sidebar content visually. This is actually desirable: labels should render over sidebars when a star is near the edge. The `pointer-events: none` on the container ensures sidebar interactivity is preserved.

**Severity**: MEDIUM — the label container must move for the clipping fix to work. The z-index placement at 25 is already defined and correct.

---

## 3. Pointer-Events Layering (FR-021 / FR-022)

### Verification

The `pointer-events: none` container + `pointer-events: auto` on children pattern is well-established and works in all target browsers (Chrome, Firefox, Safari).

Current hitzone model (`scene.js` line 948-953):

```css
#orb-hitzone {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-hud) - 1);  /* = 19 */
  cursor: crosshair;
}
```

The hitzone is at z=19, below both the sidebars (z=22) and the star labels (z=25). Pointer events flow:

1. User hovers over a position where a star label is visible:
   - The label container (z=25) has `pointer-events: none` -- click passes through.
   - If an individual `.star-label` has `pointer-events: auto`, it intercepts the click.
   - Otherwise, the sidebar (z=22) or hitzone (z=19) receives the event.

2. User clicks a sidebar button:
   - The label container (z=25) is above the sidebar (z=22), but `pointer-events: none` lets the click pass through.
   - The sidebar button at z=22 receives the click.
   - The hitzone at z=19 does NOT receive the click because the sidebar intercepts it first.

This is correct. However, the spec says labels should have `pointer-events: auto` (FR-022). Currently in `scene.js` line 132, labels are set to `pointer-events: none`:

```js
label.style.pointerEvents = 'none';
```

This must be changed to `pointer-events: auto` if labels need to be interactive (e.g., clickable to open the project). But note: if labels have `pointer-events: auto`, a label that overlaps a sidebar button will intercept the click *instead* of the sidebar. This is an edge case — it only occurs when a star label extends over a sidebar area AND the user clicks precisely on the label text rather than the sidebar button.

**Recommendation**: Keep `pointer-events: none` on individual labels unless there is a concrete interaction requirement (clicking a label to open the project). The current behavior of clicking the *star sprite* (via raycasting on the hitzone) is sufficient. If label interactivity is desired, add a click handler to labels that dispatches the same `star-click` event, but accept that labels overlapping sidebar buttons will intercept those clicks.

**Severity**: LOW — the pointer-events model is sound. The FR-022 requirement for `pointer-events: auto` on labels should clarify what interaction it enables; if it's just for cursor feedback, `cursor: pointer` on the label with `pointer-events: auto` is fine, but document the sidebar overlap trade-off.

---

## 4. Overflow Hidden Conditional Removal (FR-011)

### Current Overflow Usage

Three elements set `overflow: hidden`:

1. **`html, body`** (line 90): Prevents page scroll during the reveal sequence. Safe to remove after reveal.
2. **`#app-shell`** (line 183): Prevents grid children from overflowing the viewport. Changing this to `visible` could allow children to paint outside the viewport if they have incorrect sizing.
3. **`#main-viewport`** (line 921): `overflow: hidden` — this clips the star labels (the problem FR-020 addresses) and prevents the content from overflowing the center column.

### Elements Relying on Overflow Hidden

- **`#main-viewport overflow: hidden`**: This is what clips star labels. With the star labels moved to a `position: fixed` container at the body level (per Section 2), removing `overflow: hidden` from `#main-viewport` is safe and may not even be necessary.
- **`#app-shell overflow: hidden`**: The frame corners (`.frame__corner--*`) are positioned at `top:0/bottom:0/left:0/right:0` with `position: absolute`. Since `.frame` is `position: fixed; inset: 0`, these are not clipped by `#app-shell`. The nav and status panels use `overflow-y: auto` independently. So `#app-shell overflow: hidden` is primarily a safety net, not a functional requirement.
- **`html, body overflow: hidden`**: This is the critical one. It must remain `hidden` during the reveal sequence (to prevent scroll during animation) and switch to `auto` (or remove the property) after reveal completes.

### Recommendation

After the reveal sequence completes:
1. Toggle a class on `<html>` (e.g., `html.scroll-enabled`) that sets `overflow-y: auto` on both `html` and `body`.
2. Leave `#app-shell overflow: hidden` unchanged — it does not block scrolling since `#app-shell` will be `position: fixed` and taken out of document flow.
3. Leave `#main-viewport overflow: hidden` unchanged — the star labels container is no longer inside it.

Verify the following do NOT break:
- The `.frame__greek-key` element (line 539) uses `contain: layout style paint` and `overflow: hidden` implicitly via containment. No impact.
- The command line (line 976) uses `overflow: hidden` for text truncation. No impact.
- The overlay frame (line 1032) uses `overflow-y: auto`. No impact — it's `position: fixed`.

**Severity**: MEDIUM — the conditional removal is straightforward, but the spec should explicitly state which elements' overflow changes and which remain unchanged.

---

## 5. Accessibility of Scroll-Driven Content (FR-033)

### `.sr-only` Project List Independence

The `.sr-only` project list (lines 184-217, `index.html`) is inside `#app-shell`. With `#app-shell` set to `position: fixed`, the `.sr-only` list will be fixed in the viewport and not affected by document scroll. This is correct — screen reader users navigate via the `.sr-only` list and the sidebar navigation, not via scroll position.

### Scroll Spacer Accessibility

The scroll spacer (`<div id="scroll-spacer">`) will be encountered by screen readers if it's in the DOM without proper ARIA attributes. Since it contains no meaningful content and exists solely to create scrollable distance:

**Required attributes**:
```html
<div id="scroll-spacer"
     aria-hidden="true"
     role="presentation"
     tabindex="-1"
     style="pointer-events: none;">
</div>
```

- `aria-hidden="true"` — removes it from the accessibility tree entirely. Screen readers will not announce it.
- `role="presentation"` — belt-and-suspenders with `aria-hidden`, signals no semantic meaning.
- `tabindex="-1"` — prevents accidental focus via keyboard navigation.
- `pointer-events: none` — prevents accidental interaction.

### Skip-Scroll Affordance (FR-013)

The spec requires a "skip scroll" button. This button MUST be:
- Visible (not `.sr-only`) with sufficient contrast
- Keyboard-focusable (`tabindex="0"` or a `<button>`)
- Announced by screen readers with a descriptive label (`aria-label="Skip scroll animation"`)
- Placed in the DOM *before* the scroll spacer so keyboard users encounter it first

**Severity**: MEDIUM — the spacer ARIA attributes are straightforward but must not be omitted. The skip button must be genuinely accessible.

---

## 6. CSS Containment Impact

### Current Containment Rules

```css
.frame { contain: layout style paint; }           /* line 1396 */
#command-line { contain: layout style; }           /* line 1399 */
#constellation-nav li { contain: layout style; }   /* line 1402 */
```

### Analysis

- **`.frame` containment** (`layout style paint`): The frame is `position: fixed; inset: 0; pointer-events: none`. Its containment does not interact with the scroll container at all. The frame and its children (corners, edges, gauges, header band) are self-contained. No impact.

- **`#command-line` containment** (`layout style`): The command line is a grid child of `#app-shell`. When `#app-shell` becomes `position: fixed`, the command line remains a grid child. `contain: layout style` means its internal layout changes won't trigger reflows in ancestors. No impact on scrolling.

- **`#constellation-nav li` containment** (`layout style`): Same analysis — internal list items are self-contained. No impact.

### Potential Concern: Adding Containment to Scroll Spacer

If the scroll spacer or any scroll-related wrapper gets containment applied, it could break `ScrollTrigger`'s scroll position calculations. **Do not apply `contain` to the scroll spacer or any scrollable wrapper.**

### Potential Concern: `#app-shell` with `position: fixed`

When `#app-shell` switches from `position: relative` to `position: fixed`, none of the current containment rules are invalidated because:
- `.frame` is already `position: fixed` (independent of `#app-shell`).
- `#command-line` and `#constellation-nav li` are inside `#app-shell` and will be fixed along with it.
- No containment rule uses `contain: size`, which would conflict with the full-viewport sizing.

**Severity**: LOW — no conflicts identified. The existing containment rules are compatible with all three scroll implementation options.

---

## Summary of Concerns

| # | Concern | Severity | Section |
|---|---|---|---|
| 1 | Scroll container approach must avoid ScrollTrigger `pin` on `#app-shell` (containing-block violation breaks all `position: fixed` descendants) | HIGH | 1 |
| 2 | `#star-labels` must move to a `position: fixed` viewport-level container outside `#main-viewport` | MEDIUM | 2 |
| 3 | Spec should clarify which `overflow: hidden` declarations change and which stay | MEDIUM | 4 |
| 4 | Scroll spacer must have `aria-hidden="true"`, `role="presentation"`, and `tabindex="-1"` | MEDIUM | 5 |
| 5 | FR-022 (`pointer-events: auto` on labels) needs clarification on intended interaction and sidebar overlap trade-off | LOW | 3 |
| 6 | Current containment rules are compatible; do not add `contain` to scroll spacer | LOW | 6 |

## Concrete Amendments Required

1. **FR-009/FR-010**: Add an implementation note specifying option (a) — a scroll-spacer sibling of `#app-shell` with `#app-shell` set to `position: fixed`. Explicitly prohibit using ScrollTrigger's `pin` on `#app-shell` due to the containing-block violation with `position: fixed` descendants (canvas, frame, hitzone, hamburger).

2. **FR-011**: Enumerate the three `overflow: hidden` declarations and specify the disposition of each:
   - `html, body` — change to `overflow-y: auto` after reveal via class toggle
   - `#app-shell` — remains `overflow: hidden` (irrelevant once fixed-positioned)
   - `#main-viewport` — remains `overflow: hidden` (star labels no longer inside it)

3. **FR-020**: Specify that `#star-labels` moves to a `position: fixed; inset: 0` container, either as a direct child of `<body>` or as a sibling of `#app-shell`. Confirm z-index remains at `var(--z-star-labels)` (25).

4. **FR-033 / Edge Cases**: Add a requirement that the scroll spacer element MUST have `aria-hidden="true"`, `role="presentation"`, and `tabindex="-1"`. Add that the skip-scroll button (FR-013) must appear in DOM order before the scroll spacer.

5. **FR-022**: Clarify whether label interactivity means clickable labels (dispatching `star-click`) or purely visual cursor feedback. Document that labels with `pointer-events: auto` will intercept clicks over sidebar buttons when they overlap.
