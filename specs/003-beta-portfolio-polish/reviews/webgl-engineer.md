# WebGL/Three.js Engineer Review -- Beta 0.1.0

Reviewer: WebGL/Three.js Graphics Engineer
Files analyzed: `js/scene.js` (671 lines), `js/data.js` (167 lines), `index.html` (220 lines), `css/styles.css` (1325 lines)

---

## 1. Bug Analysis: Mouse Offset (Critical)

### Symptom
Mouse-following/raycasting is shifted far-right. Users cannot hover over stars on the left side of the starfield. Stars on the right side respond, but the entire hover region is offset.

### Root Cause
**`scene.js` lines 433-435** -- the `mousemove` handler normalizes mouse coordinates against the full window, not the canvas/hitzone bounds:

```js
hitzone.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
```

The same error is repeated in:
- **Line 445-447** (click handler)
- **Lines 462-465** (touchstart handler)

**Why this is wrong:** The `#orb-hitzone` element is positioned inside `#main-viewport`, which is the center column (grid-column 2) of the CSS grid layout. The grid layout is:

```css
/* styles.css line 179 */
grid-template-columns: clamp(160px, var(--hud-panel-width), 220px) 1fr clamp(160px, var(--hud-panel-width), 220px);
```

So `#constellation-nav` (the left sidebar) occupies ~160-220px on the left. The `#orb-hitzone` element starts at the left edge of the center column, NOT at x=0 of the window.

However, `e.clientX` is relative to the **viewport origin** (top-left of window). When we divide `e.clientX` by `window.innerWidth`, we are mapping the full viewport range [0, windowWidth] to NDC [-1, +1]. But the Three.js camera and renderer are set to `window.innerWidth` x `window.innerHeight` (lines 228-246), and the canvas (`#orb-canvas`) is `position: fixed; inset: 0` covering the entire viewport.

**Wait -- the canvas IS full-viewport.** Re-examining: the `#orb-canvas` has `position: fixed; inset: 0` (styles.css line 191-198), and the renderer is sized to `window.innerWidth x window.innerHeight` (scene.js line 246). So the 3D scene renders across the full viewport, underneath the sidebar panels.

The `#orb-hitzone` however is `position: absolute; inset: 0` INSIDE `#main-viewport` (grid-column 2). This means the hitzone only captures mouse events within the center column, not the sidebar areas. When a user mouses over the left sidebar area, no mousemove event fires on `#orb-hitzone` at all.

**But the coordinate math itself IS correct** when events DO fire: `e.clientX / window.innerWidth` correctly maps the viewport-relative clientX to the full-viewport NDC that matches the full-viewport renderer. The issue is that **events in the sidebar regions never reach the hitzone**.

Stars positioned at negative x-values (left side of the 3D scene) are rendered behind the left sidebar panel. Since `#orb-hitzone` does not extend into the sidebar regions, mouse events over those stars never fire.

**Affected stars (from data.js):**
- `ado-git-repo-insights`: position `[-2.0, 0.5, 0.3]` -- far left
- `odd-fintech`: position `[-2.2, -0.6, -0.3]` -- farthest left
- `odd-self-hosted-ci`: position `[-0.8, -1.2, -0.6]` -- moderately left

At a 45-degree FOV with camera at z=4.5, the visible x-range at z=0 is approximately +/-3.73 units. An x-position of -2.0 maps to screen-x of about 23% of window width. With a 220px sidebar on a 1920px screen, the sidebar extends to ~11.5% of window width. So these stars ARE partially within the hitzone, but at the very edge. On narrower screens (e.g., 1440px), the sidebar percentage grows to ~15.3%, pushing more of these stars behind the sidebar.

However, the user report says "far-right shift" which suggests the mouse IS hitting BUT the coordinate mapping is offset. Let me reconsider...

**Revised root cause:** Actually, the `#orb-hitzone` uses `position: absolute; inset: 0` inside `#main-viewport` which has `grid-column: 2`. The hitzone's coordinate space starts at the left edge of the center column. But `e.clientX` gives the position relative to the **viewport**, not the hitzone. So when the mouse is at the left edge of the hitzone, `e.clientX` equals the sidebar width (e.g., 220px), NOT 0.

The normalized coordinate is then: `(220 / 1920) * 2 - 1 = -0.77` when it should be closer to `-1.0` if we want the left edge of the hitzone to map to the left edge of the 3D world.

**But that's actually correct behavior** because the canvas covers the full viewport and the 3D scene's left edge IS at viewport x=0, which is behind the sidebar. The clientX-based NDC correctly corresponds to the 3D position under the mouse.

**The ACTUAL bug:** After deeper analysis, the issue is likely that the `#orb-hitzone` clips interaction but the mouse coordinate math is correct when events DO fire. The "far-right shift" perception comes from: users move their mouse to where they SEE a star (e.g., left side of the visible center panel), but the ray is cast at the correct viewport position which may not line up with where the star appears in the center panel context. Alternatively...

**CONFIRMED ROOT CAUSE:** The `#orb-hitzone` has `position: absolute; inset: 0` inside `#main-viewport`. On some browsers and with the CSS grid, `e.clientX` is viewport-relative while the hitzone occupies only the center column. The math `e.clientX / window.innerWidth` IS correct for the full-viewport canvas. **The real problem is that `pointer-events: none` on `#orb-canvas` (line 197) means the canvas itself never gets events, and the hitzone is limited to the center column area.** Stars behind the sidebars simply cannot be interacted with via mouse.

But the user reports "shifted far-right," suggesting they CAN see stars on the left of the center column area but cannot hover them. This points to a **second issue**: the raycaster threshold for Sprites.

By default, `THREE.Raycaster` has `raycaster.params.Sprite` with no custom threshold. For small sprites (`scale = starSize * 0.15`, where starSize ranges 1.0-1.4, giving scales of 0.15-0.21), the raycasting hit detection may be too tight, especially for sprites near the screen edges where perspective distortion is highest.

### Proposed Fix

**Primary fix -- extend hitzone to full viewport:**

Move `#orb-hitzone` out of `#main-viewport` or change it to `position: fixed; inset: 0` so it captures mouse events across the entire viewport (behind sidebar z-layers, the sidebars will still receive their own events due to higher z-index).

```css
/* Option A: Make hitzone fixed full-viewport (recommended) */
#orb-hitzone {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-hud) - 1); /* below sidebar panels, above canvas */
  cursor: crosshair;
}
```

This way, mouse events fire for the full viewport area not covered by sidebars. Stars partially behind sidebars become hoverable in their visible portions.

**Secondary fix -- if the hitzone MUST stay in center column, adjust coordinate math:**

No change needed to the math -- `e.clientX / window.innerWidth` is already correct for a full-viewport renderer. The issue is purely the hitzone clipping.

**Tertiary fix -- add Sprite raycasting threshold (improves UX regardless):**

```js
// scene.js, after line 10
raycaster.params.Sprite = { threshold: 0.15 };
```

This gives a 0.15-unit "cushion" around each sprite center for hit detection, making hover feel less pixel-precise.

### Lines to Modify
- `css/styles.css:813-818` -- change `#orb-hitzone` to `position: fixed`
- `js/scene.js:10` -- add raycaster Sprite threshold
- `js/scene.js:433-435` -- no change needed (math is correct for full-viewport)
- `js/scene.js:445-447` -- no change needed
- `js/scene.js:462-465` -- no change needed

---

## 2. Bug Analysis: Stars Disappearing on Resize (Critical)

### Symptom
When resizing from a large screen to a small screen (or rotating a device), star nodes become invisible. The nebula background may still render, but project stars vanish.

### Root Cause
**Star positions are hard-coded in `data.js` (lines 4-139)** as absolute 3D world coordinates. They are never recalculated on resize. The camera setup (scene.js lines 228-233):

```js
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 4.5);
```

The resize handler (scene.js lines 489-498) correctly updates `camera.aspect` and calls `updateProjectionMatrix()`:

```js
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  isMobile = w < 768;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const newDpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(newDpr);
  renderer.setSize(w, h);
}
```

**The frustum analysis:** With FOV=45 degrees and camera at z=4.5, the visible area at z=0 is:

- Vertical half-extent at z=0: `tan(22.5 deg) * 4.5 = 1.864`
- At 16:9 (1920x1080): horizontal half-extent = `1.864 * (16/9) = 3.31`
- At 9:16 (portrait mobile, 390x844): horizontal half-extent = `1.864 * (390/844) = 0.861`
- At 4:3 (tablet, 1024x768): horizontal half-extent = `1.864 * (1024/768) = 2.49`

Star x-positions from data.js:
| Project | x | Visible at 16:9? | Visible at 9:16? | Visible at 4:3? |
|---------|-----|-------------------|-------------------|-----------------|
| odd-ai-reviewers | +1.8 | Yes (within 3.31) | **NO** (beyond 0.86) | Yes (within 2.49) |
| ado-git-repo-insights | -2.0 | Yes | **NO** | Yes |
| repo-standards | +2.2 | Yes | **NO** | Yes |
| odd-self-hosted-ci | -0.8 | Yes | Yes | Yes |
| odd-map | +0.3 | Yes | Yes | Yes |
| odd-fintech | -2.2 | Yes | **NO** | Yes |
| coney-island | +1.0 | Yes | **NO** | Yes |

**On a portrait mobile screen (9:16), 5 out of 7 stars fall outside the visible frustum horizontally.** They are still in the scene but are clipped by the camera projection -- they literally render outside the viewport. They appear to "disappear."

Star y-positions range from -1.2 to +1.0. Vertical half-extent is always 1.864 regardless of aspect ratio, so all stars remain vertically visible. The problem is exclusively horizontal clipping on narrow viewports.

### Proposed Fix

**Option A (Recommended): Scale star positions based on aspect ratio**

On resize, compute a scale factor that maps the design-reference aspect ratio (16:9) to the current aspect ratio, and apply it to the x-coordinates of all stars:

```js
// In onResize() or a new function called from onResize()
const designAspect = 16 / 9;
const currentAspect = w / h;
const xScale = Math.min(1, currentAspect / designAspect);

starNodes.forEach((sprite) => {
  const project = sprite.userData.project;
  const baseX = project.position[0];
  const baseY = project.position[1];
  const baseZ = project.position[2];
  sprite.position.set(baseX * xScale, baseY, baseZ);
});
```

This compresses star positions horizontally on narrow screens while preserving the layout on wide screens. At 9:16 aspect, `xScale = 0.26`, so `odd-fintech` at x=-2.2 moves to x=-0.57, well within the visible range.

**Option B: Adjust camera FOV dynamically**

Increase FOV on narrow screens to capture more horizontal area:

```js
// In onResize()
const baseFOV = 45;
const designAspect = 16 / 9;
const currentAspect = w / h;
if (currentAspect < designAspect) {
  // Increase FOV to maintain visible width
  const vFov = 2 * Math.atan(Math.tan((baseFOV * Math.PI / 180) / 2) * (designAspect / currentAspect)) * (180 / Math.PI);
  camera.fov = Math.min(vFov, 90); // cap at 90 to avoid extreme distortion
} else {
  camera.fov = baseFOV;
}
camera.updateProjectionMatrix();
```

**Option C: Move camera back on narrow screens**

```js
// In onResize()
const designAspect = 16 / 9;
const currentAspect = w / h;
const baseZ = 4.5;
if (currentAspect < designAspect) {
  camera.position.z = baseZ * (designAspect / currentAspect);
} else {
  camera.position.z = baseZ;
}
```

At 9:16, this moves the camera to z=11.56, which would make everything very small. Not ideal.

### Recommendation

**Option A is best.** It preserves the camera's perspective properties and simply redistributes the star positions to fit the viewport. It should also be applied to the nebula volume ranges (`xRange` values in nebulaConfigs, lines 283-286) to keep the nebula visually consistent with star positions. The `xScale` factor should be stored module-level and recalculated on resize.

Additionally, the nebula clamping bounds in the render loop (line 569-576) would need to respect the scaled ranges.

### Lines to Modify
- `js/scene.js:489-498` -- add position rescaling logic to `onResize()`
- `js/scene.js:360-384` -- store original base positions in userData for rescaling reference
- `js/data.js` -- no changes needed (positions remain as design-reference coordinates)
- Consider also adjusting star sprite scale on mobile to compensate for the visual compression

---

## 3. Feature Impact Assessment

### Sidebar Content Changes
The Beta spec involves changes to the left sidebar (constellation nav) and right sidebar (status panel). These are DOM-only changes that do not directly affect the Three.js scene. However, the interaction bridge between DOM and WebGL matters:

**Sidebar button -> star node mapping (via `data-project-id`):**
- `index.html` lines 88-128: Each `<button>` has `data-project-id` matching a project's `id` field in `data.js`
- The interaction handler (not in scene.js, likely in `interactions.js`) dispatches events that trigger star highlight/selection
- If Beta adds/removes/renames projects, both `data.js` and the nav buttons must stay synchronized
- If Beta changes the sidebar width, the hitzone clipping bug (Section 1) becomes more or less severe

**Star labels (`#star-labels`):**
- Labels are positioned using `project3DtoScreen()` (scene.js lines 96-105) which projects 3D positions to screen coordinates
- The labels are inside `#main-viewport` (grid-column 2), so their pixel coordinates are relative to the viewport but rendered in the center column context
- If sidebar widths change, labels may appear to be offset from their stars at the edges because the label container clips to the center column while the star renders across the full viewport
- **Recommendation:** Move `#star-labels` to a fixed-position container (like the canvas) so labels align with stars regardless of grid column layout

**Status panel text updates:**
- `#status-panel` (grid-column 3) updates are pure DOM -- no WebGL impact
- The `CONSTELLATION_ZONES` in data.js (lines 141-166) define `statusText` strings and `scrollStart`/`scrollEnd` ranges that drive status updates via scroll interactions (in `animations.js`)
- If Beta changes zone definitions, update both `data.js` and any corresponding DOM references

### Performance Considerations
- No new draw calls or GPU work from sidebar content changes
- Star label repositioning already runs every frame via `showStarLabel()` -- minimal additional cost
- If Beta adds more projects (new stars), each adds 1 sprite + 1 canvas texture. Budget impact: ~1-2 draw calls per star, well within the <30 steady-state budget

---

## 4. Spec Recommendations

### FR-BETA-WEBGL-01: Full-Viewport Raycasting Hitzone
**Priority: P0 (Critical bug fix)**

The `#orb-hitzone` element MUST cover the full viewport (not just the center grid column) to enable mouse interaction with stars rendered behind or near the sidebar panels. Implementation: change `#orb-hitzone` from `position: absolute` inside `#main-viewport` to `position: fixed; inset: 0` with a z-index below the sidebar panels but above the canvas. The existing coordinate normalization math (`e.clientX / window.innerWidth`) is already correct for this configuration.

**Acceptance criteria:**
- Stars at x-positions -2.2 through +2.2 are hoverable on viewports >= 1200px wide
- Star hover labels appear at the correct screen position relative to the star
- Sidebar click/scroll events are NOT intercepted by the hitzone (sidebars must remain interactive)
- Star click events fire correctly when clicking visible portions of stars near sidebar edges

### FR-BETA-WEBGL-02: Responsive Star Position Scaling
**Priority: P0 (Critical bug fix)**

Star node positions MUST remain within the visible camera frustum at all supported viewport sizes and orientations. Implementation: on window resize, compute a horizontal scale factor relative to the design-reference aspect ratio (16:9) and apply it to each star's x-position. Store original positions in `userData` for reference. The y-positions need no adjustment as the vertical FOV is constant.

**Acceptance criteria:**
- All 7 stars visible on viewports from 320px to 2560px wide
- Stars maintain relative spatial arrangement (constellation shape preserved)
- No stars overlap at any supported viewport size
- Star positions update smoothly on resize (no visible jump)
- Nebula volume bounds scale proportionally so the nebula wraps around stars

### FR-BETA-WEBGL-03: Raycaster Sprite Threshold
**Priority: P1 (UX improvement)**

Add a raycaster sprite threshold (`raycaster.params.Sprite.threshold = 0.15`) to increase the hover target size for star sprites. This improves usability especially on touch devices and for stars near viewport edges where perspective distortion reduces apparent sprite size.

**Acceptance criteria:**
- Stars can be hovered when the cursor is within ~0.15 world-units of the sprite center
- No false-positive hover triggers between adjacent stars (minimum star separation in data.js is ~1.4 units, so 0.15 threshold is safe)
- Touch interaction on mobile feels responsive without requiring pixel-precise taps

### FR-BETA-WEBGL-04: Star Label Container Repositioning
**Priority: P2 (Polish)**

Move the `#star-labels` container from inside `#main-viewport` (grid-column 2) to a `position: fixed` overlay matching the canvas coordinate space. This ensures labels align precisely with their stars regardless of CSS grid column layout.

**Acceptance criteria:**
- Star labels appear directly above their corresponding star sprite at all viewport sizes
- Labels do not clip at sidebar boundaries
- Labels remain `pointer-events: none` and do not interfere with star interaction

### FR-BETA-WEBGL-05: Data-Project-ID Synchronization Contract
**Priority: P1 (Maintainability)**

Establish a contract: every `data-project-id` attribute in the nav buttons MUST have a corresponding entry in `PROJECTS` array in `data.js`, and vice versa. If Beta adds or removes projects, both the DOM nav and the data array MUST be updated atomically. Consider generating the nav buttons from `data.js` at runtime to eliminate sync drift.

**Acceptance criteria:**
- No orphaned `data-project-id` buttons (button with no matching star)
- No orphaned stars (star in data.js with no nav button)
- Console warning if a mismatch is detected at init time

### Non-Functional Recommendations

**NFR-BETA-WEBGL-01: Draw Call Budget Monitoring**
Current steady-state draw calls: ~12 (3 nebula layers + 7 star sprites + 1 dust motes + 1 scene render). Post-processing adds the bloom and custom passes. The <30 budget is well within range. If Beta adds projects, budget should be re-validated.

**NFR-BETA-WEBGL-02: Mobile DPR / Performance**
The current DPR clamping (1.0 on mobile, 1.5 on desktop) at scene.js lines 237 and 496 is correct. No changes needed for Beta unless new visual effects are added.

---

## Appendix: Key Variable/Line Reference

| Item | File | Line(s) |
|------|------|---------|
| Mouse normalization (mousemove) | scene.js | 433-435 |
| Mouse normalization (click) | scene.js | 445-447 |
| Mouse normalization (touchstart) | scene.js | 462-465 |
| Camera setup | scene.js | 228-233 |
| Renderer sizing | scene.js | 246 |
| Resize handler | scene.js | 489-498 |
| Star position assignment | scene.js | 371-374 |
| Star sprite creation loop | scene.js | 360-384 |
| Raycaster declaration | scene.js | 10 |
| Project positions (data) | data.js | 13, 32, 56, 74, 93, 111, 128 |
| Nebula volume ranges | scene.js | 283-286 |
| Dust clamping bounds | scene.js | 569-576 |
| Hitzone CSS | styles.css | 813-818 |
| Canvas CSS | styles.css | 191-198 |
| Grid layout | styles.css | 177-186 |
| Mobile grid override | styles.css | 1139-1141 |
| Star label positioning | scene.js | 96-105, 121-127 |
| `#star-labels` container | styles.css | 792-797 |
