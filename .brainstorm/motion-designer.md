# Motion Designer Brainstorm: Animation Language & Scroll Interactions
## Victorian Techno-Mage Portfolio — GSAP/Scroll Specialist Notes

---

## 1. Reveal Universe Intro Sequence

### Overview Timing Diagram

```
t=0ms    t=800ms  t=1600ms  t=2800ms  t=3800ms  t=5200ms  t=6500ms
  |---------|---------|---------|---------|---------|---------|
  [FRAME]   [GAUGES]  [CMD]     [TYPE]    [IGNITE]  [BLOOM]   [STARS]
  assemble  power-up  appears   "reveal   orb flash nebula    stagger
                               universe" ignition  bloom      in
```

---

### Phase 1: Frame Assembly (0ms – 1600ms)

**Goal:** Establish the Victorian instrument panel as a physical, weighted object that clicks into place.

**Keyframes:**

```
0ms:   All frame elements at opacity:0, displaced off-screen
       Brass corners: translateX(±60px) translateY(±60px)
       Side panels (gauges, nav): scaleX(0), transformOrigin at outer edge
       Top/bottom bars: scaleY(0)

200ms: Brass corner TL slides in (ease: "expo.out", duration: 600ms)
300ms: Brass corner TR slides in (staggered 100ms after TL)
350ms: Brass corner BL slides in
400ms: Brass corner BR slides in
         → All 4 arrive ~900ms, mechanical "clunk" feel

700ms: Top bar scaleY(1) — snaps open like a panel locking (duration: 300ms, "back.out(1.4)")
750ms: Bottom bar (same, slightly delayed)
900ms: Left side panel scaleX(1) from left edge, "expo.out" 400ms
950ms: Right side panel scaleX(1) from right edge

1100ms: Engraved rune details fade in (opacity 0→1, duration: 500ms, "power2.inOut")
1200ms: Rivet/bolt details "pop" in with tiny scale(0→1.2→1.0) springy bounce per rivet
         stagger: 0.05s between rivets, random order adds authenticity
```

**Easing philosophy:** Mechanical things arrive with weight — `expo.out` for long slides, `back.out(1.7)` for snapping into locked position, `elastic.out(1, 0.4)` for the "final settle" shimmy.

**Sound design intent (not implemented):**
- Metal sliding: soft whoosh + metallic clink at corners
- Panel locks: 4x sequential "thunk" sounds
- Rune glow: low harmonic hum begins

---

### Phase 2: Console Powers Up + Command Line Types (1600ms – 3800ms)

**Goal:** The machine wakes up. Gauges animate. The command line appears and "reveal universe" is typed.

**Gauge Power-Up Sequence:**

```
1600ms: Gauge needles all at 0 (pointing left/down)
1700ms: Needle 1 (Arcane Power): sweeps 0→75% arc, duration 800ms, "power3.inOut"
         with 2 micro-overshoots (bounces to 80%, settles at 75%)
1800ms: Needle 2 (Dimensional Flux): sweeps to 60%, duration 700ms (offset)
1900ms: Needle 3 (Entropy Level): sweeps to 45%, duration 600ms
2000ms: Small pressure gauges: quick burst to 90%, settle to realistic values ~70%
2100ms: Gauge glass reflections fade in (pseudo-highlight overlay, opacity 0→0.3)
```

**Gauge easing:** `CustomEase.create("gaugeNeedle", "M0,0 C0.14,0 0.27,0.2 0.4,0.6 0.6,1 0.72,1.1 0.8,1.05 0.9,1.02 1,1")` — mimics physical damping with slight overshoot.

**Command Line Emergence (2200ms):**

```
2200ms: Command line bar slides up from bottom (scaleY 0→1, "expo.out", 300ms)
2400ms: Cursor blink begins (CSS animation: opacity 1→0 at 530ms interval)
2500ms: Typewriter effect starts: "> " appears instantly, then:
         Each character: 60-90ms interval (slight randomization ±20ms for human feel)
         "reveal universe" = 14 chars × ~75ms avg = ~1050ms to complete
3550ms: Full string typed: "> reveal universe"
3650ms: User "presses Enter" — cursor flash × 3 rapid blinks, then:
         Command line text color shifts from terminal-green to arcane-gold (#C9A84C)
         Brief glow pulse on the command line bar
```

**Typewriter implementation:**

```javascript
// GSAP TextPlugin or manual per-character approach
gsap.to(cmdText, {
  duration: 0,
  text: {
    value: "reveal universe",
    delimiter: "",  // character by character
    speed: 0.8      // chars per second multiplier
  },
  ease: "none",
  // Add random delay variation via onUpdate or per-char timeline
});
```

**Sound design intent:**
- Mechanical keyboard clicks per character (soft, vintage typewriter)
- Enter key: louder, resonant "CLACK"
- Post-Enter: electrical crackle building

---

### Phase 3: Orb Ignition + Nebula Bloom + Stars Fade In (3800ms – 6500ms)

**Goal:** The climax. Crystal ball lights up from within, nebula expands, stars emerge.

**Orb Ignition (3800ms – 4500ms):**

```
3800ms: Orb rim light: opacity 0→1, scale 0.8→1.0, duration 300ms
         Color: deep violet → electric indigo (#4B0082 → #6A35D8)
3900ms: Internal nebula texture: opacity 0→0.2 (first glimpse, very dim)
4000ms: FLASH moment: orb brightness spikes to 200% white for 80ms, then
         settles back — this is the "ignition" moment
4080ms: Post-flash: nebula colors bloom rapidly (opacity 0.2→0.8, duration: 600ms, "power2.out")
         Color temperature shifts from cold (#1a0a2e) to warm cosmic (#2D1B69 + oranges/pinks)
4200ms: Rim glow expands: radial gradient from orb edge, 0→30px spread
         This bleeds into the surrounding frame — arcane energy leaking out
4500ms: Glass refraction layer subtly distorts (Three.js uniform transition)
```

**Nebula Bloom (4200ms – 5400ms):**

```
4200ms: Nebula layer 1 (base cloud): opacity ramps from 0.3→0.9
         Scale of internal cloud: 0.6→1.0 (expanding outward from center)
4500ms: Nebula layer 2 (dust motes): particles begin spawning, random stagger
4700ms: Nebula layer 3 (accent colors — pinks, teals, golds): fade in, duration 800ms
         Each layer has slightly different scale animation for parallax depth
5000ms: Nebula color per-constellation zones begin: subtle hue differentiation
         (cool blues for dev tools, warm golds for data/fintech, greens for infrastructure)
5200ms: Nebula "breathing" idle loop begins: gentle scale 1.0→1.02→1.0 over 4s, infinite
```

**Star Node Stagger (5200ms – 6500ms):**

```
5200ms: Star 1 (odd-ai-reviewers): scale(0)→scale(1), opacity 0→1
         Duration: 400ms, ease: "back.out(2.5)" — pops into existence with energy
         Pulse ring expands from star center and fades (like a ripple)
5350ms: Star 2 (ado-git-repo-insights): same treatment (150ms stagger)
5500ms: Star 3 (repo-standards): 150ms stagger
5650ms: Star 4 (odd-self-hosted-ci-runtime): 150ms stagger
5800ms: Star 5 (odd-map): 150ms stagger
5950ms: Star 6 (odd-fintech): 150ms stagger
6100ms: Star 7 (Coney Island Pottsville): 150ms stagger

6300ms: Constellation lines draw between related stars (SVG stroke-dashoffset animation)
         "draw" duration per line: 400ms, ease: "power1.inOut"
         Lines for thematically grouped projects (dev tools group, data group, etc.)
6500ms: Intro complete. All idle animations begin (star pulse, nebula breathe, gauge wobble)
```

**Stagger pattern:** Random order (not spatial/sequential) feels more "discovery" — like stars appearing through clearing clouds. Use `gsap.utils.shuffle()` on star array before assigning stagger indices.

**Sound design intent:**
- Orb ignition: deep resonant "WHOMP" with harmonic overtone
- Nebula bloom: crystalline chime swell
- Each star appear: soft "ping" at unique pitch (musical scale, 7 notes for 7 projects)
- Constellation draw: soft electrical "zap" trace

---

## 2. Scroll-Driven Interactions

### ScrollTrigger Architecture

**Single-page scroll model:** The page height is artificially extended to create scroll room. The viewport is fixed; scroll drives the internal state machine.

```
Scroll Range Allocation (total scroll: ~400vh equivalent):

0vh   - 50vh:   [PRE-SCROLL] Intro complete, idle state. No scroll effect yet.
                 Pin: body pinned, scroll accumulates but no visual change until threshold.

50vh  - 120vh:  [ZONE 1 - Orientation] Orb gently rotates on Y axis (0→15°)
                 Nebula shifts slightly (parallax depth 0→10%)
                 Status panel: "scanning constellation alpha..."
                 Camera: subtle pull-back (FOV 75→78)

120vh - 200vh:  [ZONE 2 - Dev Tools Constellation]
                 Stars: odd-ai-reviewers, repo-standards, odd-self-hosted-ci-runtime
                 Nebula hue shifts toward cool blue-violet
                 These 3 stars brightens (scale 1.0→1.3, brightness filter)
                 Constellation label fades in: "ARCANE TOOLS"

200vh - 280vh:  [ZONE 3 - Data/Intelligence Constellation]
                 Stars: ado-git-repo-insights, odd-fintech
                 Nebula hue shifts toward warm gold-orange
                 Orb rotates further (Y axis 15→25°)
                 Constellation label: "INTELLIGENCE MATRIX"

280vh - 360vh:  [ZONE 4 - Public/Community Constellation]
                 Stars: odd-map, Coney Island Pottsville
                 Nebula shifts toward green-teal palette
                 Constellation label: "OUTPOST NETWORK"

360vh - 400vh:  [END ZONE] Orb returns toward center rotation
                 All stars at equal brightness — "full universe view"
                 Command line: "> all systems revealed"
```

**ScrollTrigger setup:**

```javascript
// Main scroll controller
ScrollTrigger.create({
  trigger: "#scroll-container",
  start: "top top",
  end: "bottom bottom",
  scrub: 1.5,  // 1.5s lag for organic feel (not instant)
  pin: "#main-viewport",
  onUpdate: (self) => updateScrollState(self.progress)
});

// Per-constellation zone triggers
const zones = [
  { start: "25%", end: "50%", constellation: "arcane-tools" },
  { start: "50%", end: "75%", constellation: "intelligence-matrix" },
  { start: "75%", end: "90%", constellation: "outpost-network" },
];
zones.forEach(zone => {
  ScrollTrigger.create({
    trigger: "#scroll-container",
    start: `${zone.start} top`,
    end: `${zone.end} top`,
    onEnter: () => focusConstellation(zone.constellation),
    onLeaveBack: () => unfocusConstellation(zone.constellation),
  });
});
```

**Scrub values rationale:**
- `scrub: 1.5` for camera/scene: feels "heavy" like a physical gyroscope
- `scrub: 0.5` for UI elements (labels, status text): slightly snappier
- `scrub: 3` for nebula hue transitions: very slow, cinematic

### Camera/Scene Progression

```javascript
// Tied to scroll progress (0→1)
function updateScrollState(progress) {
  // Orb Y rotation: 0 → 25 degrees
  orbMesh.rotation.y = gsap.utils.mapRange(0, 1, 0, 0.44, progress);

  // Camera Z position (subtle pullback): 5.0 → 5.8
  camera.position.z = gsap.utils.mapRange(0, 1, 5.0, 5.8, progress);

  // Nebula palette: uniforms.paletteShift
  nebulaUniforms.paletteShift.value = progress;

  // Orb inner depth shift (fog density inside ball)
  orbUniforms.depthShift.value = gsap.utils.mapRange(0, 1, 0, 0.3, progress);
}
```

### Progress Indicator in Steampunk Frame

**Concept:** A vertical pressure-tube gauge on the right frame panel. As scroll progresses:
- Fluid level rises from 0% to 100%
- Fluid color shifts with palette (blue → gold → green per zone)
- Tick marks at 25%, 50%, 75% with constellation rune labels
- Gauge needle variant: a pointer rotates around a semicircle arc (like a fuel gauge)
- Positioned in right panel, labeled "DEPTH READING"

---

## 3. Micro-Interactions

### Hover: Star Node

**Tilt effect (mouse-following parallax on orb container):**

```javascript
// Orb container responds to cursor position
document.addEventListener("mousemove", (e) => {
  const rect = orbContainer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / (rect.width / 2);  // -1 to 1
  const dy = (e.clientY - cy) / (rect.height / 2);  // -1 to 1

  gsap.to(orbContainer, {
    rotateX: dy * -8,   // ±8 degree max tilt
    rotateY: dx * 8,
    duration: 0.6,
    ease: "power2.out"
  });
});

// Reset on mouse leave
orbContainer.addEventListener("mouseleave", () => {
  gsap.to(orbContainer, {
    rotateX: 0, rotateY: 0,
    duration: 1.2,
    ease: "elastic.out(1, 0.4)"  // spring back
  });
});
```

**Star hover states:**

```
ON HOVER:
  Star scale:     1.0 → 1.6, duration: 200ms, ease: "back.out(3)"
  Star brightness: 1.0 → 2.2 (shader uniform), duration: 200ms
  Halo ring:      scale(0) → scale(2.5), opacity 1→0, duration: 600ms, ease: "power2.out"
                  (expanding ring that fades — like a force field activating)
  Second halo:    delayed 100ms, same but slower (800ms) for layered effect
  Label tooltip:  opacity 0→1, translateY(+8px→0), duration: 150ms, ease: "power2.out"

ON HOVER EXIT:
  Star scale:     1.6 → 1.0, duration: 400ms, ease: "elastic.out(1, 0.5)"
  Star brightness: 2.2 → 1.0, duration: 300ms, ease: "power2.inOut"
  Halo: stops emitting new rings
  Label: opacity 1→0, translateY(0→-4px), duration: 100ms
```

**Shimmer timing:** A CSS `@keyframes` shimmer sweeps across the star label text (gradient left→right) on hover, duration 800ms, triggered by adding `.is-hovered` class.

### Click: Supernova Burst + Project Panel

**Supernova burst sequence:**

```
0ms:   Click registered on star
0ms:   Star scale: current→ 2.5, duration: 80ms, ease: "power4.out"
80ms:  Star scale: 2.5 → 0.8, duration: 120ms, ease: "power2.in" (implode before burst)
200ms: BURST: 8–12 particle rays emit from star center
         Each ray: starts at star center, travels outward 60–120px in 400ms
         Rays: thin elongated ellipses, gold/white color matching star accent
         Ray opacity: 1.0→0, ease: "power2.in" (fades as it travels)
         Ray angles: evenly distributed 360° + slight random jitter (±15°)
300ms: Star reforms at normal scale (1.0), pulse glow settles
350ms: Circular shockwave: SVG circle, stroke-dasharray animation, expands 0→150px radius
         Opacity: 0.8→0, duration: 600ms
```

**Project panel reveal choreography:**

```
200ms: Panel overlay: clip-path or scale reveal from star position
       Approach: transform-origin set at click coordinates, scale(0.1)→scale(1)
       Duration: 500ms, ease: "expo.out"

       Alternative (more mechanical): "iris" mechanical shutter opens —
       8 overlapping triangles rotate outward from center (like a camera aperture)
       Duration: 600ms — more "steampunk" feel, recommended

400ms: Panel content fades in (title, tagline): opacity 0→1, translateY(+12px→0)
         Ease: "power3.out", duration: 300ms

500ms: Media area (screenshot/video placeholder) slides in from right
         translateX(+40px→0), opacity 0→1, duration: 400ms, ease: "expo.out"

600ms: Link buttons "stamp" in: scale(0)→1.05→1.0 per button, stagger 80ms
         Ease: "back.out(2)"

700ms: Panel border draws (SVG stroke-dashoffset), duration: 400ms
         Victorian corner ornaments pop in last with springy scale
```

**Panel "iris aperture" CSS concept:**
```css
.panel-iris-blade {
  /* 8 blades, each rotate transforms to open */
  transform-origin: center center;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-open .panel-iris-blade:nth-child(1) { transform: rotate(45deg) translateY(-100%); }
/* etc. for each blade */
```

### Star Pulse: Idle Ambient Animation

Each star has a looping idle animation that runs continuously after intro:

```javascript
function createStarPulse(starElement, index) {
  const tl = gsap.timeline({ repeat: -1, yoyo: true });
  tl.to(starElement, {
    scale: 1.12,
    duration: gsap.utils.random(1.8, 3.2),  // each star at different speed
    ease: "sine.inOut",
    delay: index * 0.4,  // offset each star's phase
  });

  // Secondary glow pulse (separate timeline for different rhythm)
  const glowTl = gsap.timeline({ repeat: -1 });
  glowTl.to(starGlow, {
    opacity: 0.3,
    scale: 1.4,
    duration: gsap.utils.random(2.5, 4.0),
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
    delay: index * 0.7,
  });
}
```

**Shimmer variation:** Every 8–15s (random), a star gets a brief "flare" — extra brightness spike for 200ms then returns. This is the "cosmic twinkle" that makes the scene feel alive.

### Gauge Needle Movements

**Scroll-tied gauges (passive monitors):**
- "Arcane Power" gauge: needle reflects scroll depth (0→100%)
- Needle: `gsap.quickTo(needle, "rotation", { duration: 0.8, ease: "power2.out" })`
- Range: -135° (empty) to +135° (full), mapped to scroll progress

**Interaction-state gauges:**
- When hovering a star: "Signal Strength" gauge needle spikes to 80%
- When panel is open: "Resonance" gauge locks at 100% with micro-wobble
- Micro-wobble: `gsap.to(needle, { rotation: "+=2", yoyo: true, repeat: -1, duration: 0.15, ease: "none" })`

**`gsap.quickTo` for gauges:** Critical for performance — creates a setter function that GSAP can call rapidly without creating new tweens on each scroll event.

### Command Line Text Updates

Scroll zone transitions trigger command line updates:

```javascript
const zoneMessages = {
  "arcane-tools":         "scanning arcane tools constellation...",
  "intelligence-matrix":  "interfacing with intelligence matrix...",
  "outpost-network":      "triangulating outpost network...",
  "end":                  "all systems revealed. universe mapped.",
};

function updateCommandLine(message) {
  // Clear current text with "glitch" wipe
  gsap.to(cmdText, {
    opacity: 0, duration: 0.1,
    onComplete: () => {
      cmdText.textContent = "> ";
      gsap.to(cmdText, { opacity: 1, duration: 0.1 });
      typeText(cmdText, message, 40);  // 40ms per char
    }
  });
}
```

**Typewriter for zone messages:** 40ms per character (faster than intro's 75ms — less ceremonial, more "data feed" feel).

---

## 4. Easing & Timing Standards

### Easing Library: "Steampunk Mechanical + Cosmic Organic"

The tension in this project's aesthetic: Victorian mechanics are **precise, weighted, snappy**; cosmic phenomena are **fluid, organic, gradual**. We use different eases for each context.

**Mechanical eases (frame, gauges, buttons, panels):**
```
expo.out       — long distance snap-to, like a gear locking
back.out(1.7)  — slight overshoot, "clicked into place"
back.out(2.5)  — stronger snap, for stars appearing
power4.out     — fast initial movement, heavy deceleration
```

**Organic/cosmic eases (nebula, stars, glows, tilts):**
```
sine.inOut     — smooth breathing cycles, nebula pulse
power2.inOut   — balanced, neither mechanical nor floaty
elastic.out(1, 0.4) — springy settle, orb returning to neutral tilt
power3.out     — fluid particle trails
```

**Custom ease for gauge needles:**
```javascript
CustomEase.create("gaugeNeedle",
  "M0,0 C0.1,0 0.25,0.4 0.4,0.7 0.55,1.05 0.7,1.1 0.8,1.04 0.9,1.01 1,1"
);
// Mimics physical damping: fast sweep, overshoot, 2 oscillations, settle
```

### Duration Standards

| Category     | Range          | Use Cases                                      |
|-------------|----------------|------------------------------------------------|
| **Instant**  | 0–80ms         | State changes, visibility toggles, flash events |
| **Micro**    | 100–200ms      | Hover enter/exit, button feedback, cursor snap  |
| **Standard** | 300–500ms      | Panel transitions, label appear, star hover scale |
| **Deliberate** | 600–800ms    | Frame elements, constellation draw, iris aperture |
| **Dramatic** | 800–1200ms     | Orb ignition, nebula bloom, major transitions  |
| **Cinematic** | 1500ms+       | Scroll scrub transitions, breathing loops      |

### Stagger Patterns

**Star appearance (intro):** Random order, 150ms between stars
```javascript
const starOrder = gsap.utils.shuffle([0,1,2,3,4,5,6]);
starOrder.forEach((i, staggerIndex) => {
  gsap.to(stars[i], {
    scale: 1, opacity: 1,
    duration: 0.4,
    delay: 5.2 + (staggerIndex * 0.15),
    ease: "back.out(2.5)"
  });
});
```

**Rivet/bolt details (frame assembly):** Random order, 50ms stagger — chaotic machine feel.

**Button rows (panel open):** Sequential left-to-right, 80ms stagger — deliberate, readable.

**Constellation star brightening (scroll zones):** Simultaneous (stagger: 0) — they're a "group" that activates together, like a circuit completing.

### Spring Physics for Orb Tilt

```javascript
// Use GSAP's inertia plugin or simulate spring manually
// Option A: GSAP spring (if InertiaPlugin available)
gsap.to(orbContainer, {
  rotateX: targetX,
  rotateY: targetY,
  duration: 0.8,
  ease: "elastic.out(1, 0.5)"
});

// Option B: Manual spring simulation for precise control
let velX = 0, velY = 0;
let currentX = 0, currentY = 0;
const stiffness = 0.08, damping = 0.75;

function springUpdate(targetX, targetY) {
  velX += (targetX - currentX) * stiffness;
  velY += (targetY - currentY) * stiffness;
  velX *= damping;
  velY *= damping;
  currentX += velX;
  currentY += velY;
  gsap.set(orbContainer, { rotateX: currentY, rotateY: currentX });
  if (Math.abs(velX) > 0.001 || Math.abs(velY) > 0.001) {
    requestAnimationFrame(() => springUpdate(targetX, targetY));
  }
}
```

Spring parameters: `stiffness: 0.08, damping: 0.75` — responsive but not twitchy. The orb should feel like it's floating in viscous fluid, not a mouse-attached magnet.

---

## 5. GSAP Implementation Plan

### Timeline Structure

```
masterTL (intro sequence, runs once)
  ├── frameAssemblyTL (Phase 1, 0–1600ms)
  │     ├── cornersTL
  │     ├── panelsTL
  │     └── detailsTL
  ├── consolePowerUpTL (Phase 2, 1600–3800ms)
  │     ├── gaugesTL
  │     └── commandLineTL
  └── orbRevealTL (Phase 3, 3800–6500ms)
        ├── orbIgnitionTL
        ├── nebulaTL
        └── starsTL

scrollState (continuous, ScrollTrigger-driven)
  ├── cameraProgressTL (scrub: 1.5)
  ├── nebulaHueTL (scrub: 3)
  ├── orbRotationTL (scrub: 1.5)
  └── uiLabelsTL (scrub: 0.5)

interactionTimelines (created on-demand, not pre-built)
  ├── hoverEnterTL — created on pointerenter, killed on pointerleave
  ├── hoverExitTL — created on pointerleave
  ├── clickBurstTL — created on click, plays once, self-destructs
  └── panelRevealTL — created on click, reversed on dismiss
```

### ScrollTrigger Configuration

```javascript
// Main scene scroll progress
const sceneScrollTL = gsap.timeline({
  scrollTrigger: {
    trigger: "#scroll-driver",  // tall invisible element
    start: "top top",
    end: "bottom bottom",
    scrub: 1.5,
    pin: "#scene-viewport",
    anticipatePin: 1,  // prevents jump when pinning
    invalidateOnRefresh: true,
  }
});

// Animate Three.js objects via proxy object (avoids direct DOM manipulation)
const threeProxy = { orbRotY: 0, cameraZ: 5.0, paletteShift: 0 };
sceneScrollTL.to(threeProxy, {
  orbRotY: 0.44,      // radians
  cameraZ: 5.8,
  paletteShift: 1.0,
  ease: "none",       // linear scroll mapping; easing happens in scrub lag
  onUpdate: () => {
    orbMesh.rotation.y = threeProxy.orbRotY;
    camera.position.z = threeProxy.cameraZ;
    nebulaUniforms.paletteShift.value = threeProxy.paletteShift;
  }
});
```

**Pin behavior:** Use `pin: "#scene-viewport"` (the wrapper div containing the canvas and frame), not `pin: "body"`. This keeps the scroll container as a child element, which is more composable and avoids ScrollTrigger body-pin edge cases.

**`anticipatePin: 1`:** Prevents the momentary jump when ScrollTrigger begins pinning. Essential for smooth experience.

### How GSAP Talks to Three.js

**Pattern 1: Proxy object (recommended for scrubbed values)**
```javascript
// Never animate Three.js objects directly in GSAP tweens during scrub
// Instead, use a plain proxy object + onUpdate callback
const proxy = { value: 0 };
gsap.to(proxy, {
  value: 1,
  scrollTrigger: { scrub: 1.5, ... },
  onUpdate: () => {
    threeJsObject.uniform.value = proxy.value;
  }
});
```

**Pattern 2: `gsap.ticker` integration**
```javascript
// For continuous updates (hover physics, idle animations affecting Three.js)
gsap.ticker.add((time, delta, frame) => {
  // Read current GSAP values and push to Three.js each frame
  renderer.render(scene, camera);
});
// This replaces the standalone requestAnimationFrame loop
// GSAP ticker is already synced to RAF
```

**Pattern 3: Direct GSAP control for discrete events**
```javascript
// For click burst particles — these are CSS/SVG elements, not Three.js
// Keeps the burst effect simple and performant
gsap.to(burstParticles, { ... });
// Three.js handles the star shader glow change separately via uniform
```

**Avoiding the render loop double-dipping:** GSAP ticker drives the render call. No separate `requestAnimationFrame` in Three.js code. This prevents double-render and race conditions.

### Performance Considerations

**`will-change` hints:**
```css
.orb-container {
  will-change: transform;  /* for tilt */
}
.star-node {
  will-change: transform, opacity;  /* for hover/pulse */
}
/* Remove will-change after intro animation completes */
```

**GPU layer promotion strategy:**
- Orb container: `transform: translateZ(0)` — forces compositing layer
- Star nodes: already promoted by `will-change: transform`
- Frame elements: do NOT promote — they're static after assembly, no need for separate layers

**Avoiding layout thrash:**
- Never read layout properties (offsetWidth, getBoundingClientRect) inside GSAP `onUpdate`
- Cache all measurements before the animation runs
- Use `gsap.context()` for scoped cleanup

**ScrollTrigger refresh strategy:**
```javascript
window.addEventListener("resize", () => {
  ScrollTrigger.refresh();  // recalculates pin positions
});
```

**Three.js render on demand (tab inactive):**
```javascript
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    gsap.ticker.sleep();  // pauses ALL GSAP including render loop
  } else {
    gsap.ticker.wake();
  }
});
```

---

## 6. prefers-reduced-motion Strategy

### Detection

```javascript
// CSS level
@media (prefers-reduced-motion: reduce) {
  .star-node { animation: none; }
  .gauge-needle { transition: none; }
  /* etc. */
}

// JavaScript level
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Listen for runtime changes (user toggles OS setting)
window.matchMedia("(prefers-reduced-motion: reduce)")
  .addEventListener("change", (e) => {
    applyReducedMotion(e.matches);
  });
```

### Animation Elimination vs Simplification

| Animation                          | Full Motion         | Reduced Motion              |
|------------------------------------|---------------------|-----------------------------|
| Frame assembly (Phase 1)           | Slide + spring      | Instant appear (opacity 0→1) |
| Gauge power-up                     | Needle sweep        | Jump to final value instantly |
| Typewriter effect                  | Per-char reveal     | Text appears instantly       |
| Orb ignition flash                 | Flash + bloom       | Crossfade to lit state (500ms) |
| Nebula bloom                       | Expanding animation | Static final state, opacity fade |
| Star stagger appear                | Scale + stagger     | All appear simultaneously, opacity only |
| Star idle pulse                    | Continuous scale    | **Eliminated entirely**      |
| Scroll-driven rotation             | Continuous          | **Eliminated** — static scene |
| Scroll-driven camera              | Continuous          | **Eliminated**               |
| Constellation zone transitions     | Gradual scrub       | Instant palette switch on zone enter |
| Hover tilt                         | 8° tilt             | **Eliminated**               |
| Hover star scale                   | 1.0→1.6            | 1.0→1.2 (subtle only)        |
| Hover halo rings                   | Expanding rings     | **Eliminated**               |
| Click supernova burst              | Particle rays       | **Eliminated**               |
| Click panel reveal                 | Iris aperture       | Instant appear + fade        |
| Gauge needle scroll-tracking       | Continuous          | **Eliminated**               |
| Command line typewriter (zones)    | Per-char            | Text swaps instantly         |

### Reduced Motion Master Function

```javascript
function applyReducedMotion(reduced) {
  if (reduced) {
    // Kill all repeating timelines
    gsap.globalTimeline.pause();

    // Set all elements to final states
    gsap.set([...frame elements...], { opacity: 1, scale: 1, x: 0, y: 0 });
    gsap.set(orbContainer, { opacity: 1 });
    gsap.set([...stars...], { opacity: 1, scale: 1 });

    // Show static nebula (fully rendered, no animation)
    nebulaUniforms.animationEnabled.value = 0;

    // Disable scroll-driven scene changes
    ScrollTrigger.getAll().forEach(st => st.disable());

    // Only keep: click interactions (panel open/close), hover highlight (no tilt)
    enableReducedInteractions();
  }
}
```

### Ensuring Content Accessibility Without Animation

- All project names, taglines, and links are in the DOM as HTML — never drawn in WebGL
- The project panel (click to open) still functions with `cursor: pointer` visible on stars
- Tab-order navigation works: stars are `<button>` elements with `aria-label`
- Panel close: `Escape` key handler always active, regardless of motion preference
- Screen reader: `aria-live="polite"` region announces constellation zone changes (scroll zones)
- Color contrast: star labels maintain 4.5:1 ratio regardless of glow effects

---

## 7. State Transitions

### State Machine

```
[LOADING] → [INTRO_PLAYING] → [IDLE_BROWSING] ⟷ [FOCUSED_PROJECT]
                                    ↕
                              [SCROLL_ZONE_ACTIVE]
                              (sub-state of BROWSING)
```

### "Browsing" → "Focused" Transition

**Trigger:** Star click event

**Choreography (350ms total to panel visible):**

```
t=0ms:    Click detected. Emit supernova burst from star.
          Register click target star.

t=0ms:    Set state = FOCUSED.
          Disable scroll events during transition.

t=80ms:   Star implode (scale 1.0→0.8), brief dim.

t=200ms:  Star reform (scale 0.8→1.0), supernova rays emitting.

t=200ms:  Begin panel reveal from star position:
          Panel element: position absolute, transform-origin set to star coords.
          scale(0.05) → scale(1), clip-path or iris aperture opens.
          duration: 500ms, ease: "expo.out"

t=250ms:  Backdrop vignette: radial gradient from orb edges darkens to 60% opacity.
          Other stars dim to 30% opacity. The selected star remains bright.
          duration: 400ms, ease: "power2.inOut"

t=350ms:  Panel contents animate in (title, tagline, media, links — staggered).

t=700ms:  Transition complete. State fully FOCUSED.
          Re-enable keyboard navigation within panel.
          Escape key now triggers dismiss.
```

### "Focused" → "Browsing" Dismiss

**Trigger:** Panel close button, backdrop click, or Escape key

**Choreography:**

```
t=0ms:   Dismiss triggered.
         Panel content fades out (opacity 1→0, duration: 150ms).

t=100ms: Panel contracts (iris closes / scale 1.0→0.05, duration: 400ms, ease: "expo.in").
         Reversed from star's position.

t=150ms: Backdrop vignette fades out (duration: 400ms).
         Other stars return to normal brightness (duration: 400ms).

t=300ms: Selected star gets brief "re-absorb" pulse — scale 1.0→1.3→1.0, duration: 300ms.

t=500ms: State = IDLE_BROWSING. Scroll re-enabled.
```

**Direction principle:** Open = expand from star, Close = collapse back to star. This creates a spatial memory — "the project lives inside that star."

### Overlay Appearance: Iris Aperture (Mechanical Panel Opening)

**Recommended approach:** CSS clip-path polygon animation, faking a camera iris.

```css
.panel-overlay {
  clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%);
  transition: clip-path 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-overlay.open {
  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
  /* Animates from collapsed center to full rect */
}
```

**Alternative:** SVG mask with 8 triangular "blades" rotating open. More authentic mechanical look, slightly more complex.

**Recommended for POC:** clip-path approach (simpler, one element). Iris SVG blade approach as enhancement if time allows.

---

## Project-Specific Animation Notes

Mapping the 7 projects to the scroll zones and visual identity:

| Project | Star Color | Constellation | Scroll Zone |
|---------|-----------|--------------|-------------|
| odd-ai-reviewers | Electric violet `#7C3AED` | Arcane Tools | Zone 2 |
| repo-standards | Steel blue `#3B82F6` | Arcane Tools | Zone 2 |
| odd-self-hosted-ci-runtime | Iron gray-blue `#60A5FA` | Arcane Tools | Zone 2 |
| ado-git-repo-insights | Amber gold `#F59E0B` | Intelligence Matrix | Zone 3 |
| odd-fintech | Deep gold `#D97706` | Intelligence Matrix | Zone 3 |
| odd-map | Emerald `#10B981` | Outpost Network | Zone 4 |
| Coney Island Pottsville | Warm teal `#14B8A6` | Outpost Network | Zone 4 |

**Star pulse offsets** (so they don't all breathe in sync):
- Star 1: phase 0s, period 2.2s
- Star 2: phase 0.4s, period 2.8s
- Star 3: phase 0.9s, period 3.1s
- Star 4: phase 0.2s, period 2.5s
- Star 5: phase 1.1s, period 3.4s
- Star 6: phase 0.6s, period 2.1s
- Star 7: phase 1.4s, period 2.9s

---

## GSAP Plugin Requirements

| Plugin | Usage |
|--------|-------|
| `gsap` core | All tweens, timelines |
| `ScrollTrigger` | Scroll-driven animations, pinning |
| `TextPlugin` | Typewriter intro effect |
| `CustomEase` | Gauge needle damping curve |
| `MotionPathPlugin` | Optional: particle ray paths on burst |

**CDN-safe for POC:** All available via `https://cdn.jsdelivr.net/npm/gsap@3/dist/`.
TextPlugin and CustomEase require separate imports but are freely available.

---

*Motion Designer Notes — Victorian Techno-Mage Portfolio POC*
*Specialist: GSAP/Scroll — odd-portfolio brainstorm session*
