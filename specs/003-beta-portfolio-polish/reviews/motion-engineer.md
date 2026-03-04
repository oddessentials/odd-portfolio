# Motion/Interaction Engineer Review — Beta 0.1.0

**Reviewer**: Motion/Interaction Engineer
**Date**: 2026-03-04
**Scope**: GSAP animations, reveal sequence, scroll interactions, micro-interactions, hover/touch behaviors, transition choreography, timing, easing curves, discoverability affordances

---

## 1. Discoverability Text Change

### Current Implementation

**File**: `js/animations.js:277-319` (`playDiscoverabilityAffordance()`)

The current affordance fires 2 seconds after `playRevealSequence` completes (`gsap.delayedCall(2, ...)`). It performs:

1. **Sonar pulse** — each star scales to 1.5x and back with `yoyo: true, repeat: 1`, staggered 0.2s apart (7 stars = 1.4s total sweep)
2. **CLI typing** — types `'7 anomalies detected. investigate?'` into `.cmd-text` at `duration: 1.5` after a 0.5s delay
3. **Phase indicator** — flips to `'SCANNING'` at 0.8s, then `'READY'` at 3.5s

### Impact Analysis

| Metric | Current Text | Proposed Text |
|--------|-------------|---------------|
| String | `7 anomalies detected. investigate?` | `Force multipliers for small businesses...` |
| Character count | 35 chars | 43 chars |
| Char increase | — | +23% |
| Current duration | 1.5s | — |
| Chars/sec (current) | 23.3 chars/s | — |

### Timing Recommendations

The new text is 43 characters vs 35, a 23% increase. At the current typing speed of ~23 chars/sec, the new text would take ~1.85s. However, the new text has a different cadence — it is a tagline/value proposition, not a technical status message. It should feel more deliberate, more considered.

**Recommended adjustments:**

```
Old:  duration: 1.5   → 23.3 chars/sec  (fast, terminal-scan feel)
New:  duration: 2.15  → 20.0 chars/sec  (slightly slower, more deliberate)
```

**Rationale**: The original "7 anomalies detected" reads as a machine/scanner output, so fast typing is thematic. "Force multipliers for small businesses..." is a human value statement — a slightly slower typing speed (20 chars/sec) creates a more intentional, contemplative feel while still appearing responsive.

**Phase indicator change**: The current indicator shows `'SCANNING'` then `'READY'`. With the new text, the phase indicator should flip to `'PORTFOLIO'` at 0.8s delay, then remain (no flip to READY — the terminal loading animation will handle that transition in Beta).

### Specific GSAP Change

```js
// BEFORE (animations.js:299-304)
gsap.to(cmdText, {
  duration: 1.5,
  delay: 0.5,
  text: { value: '7 anomalies detected. investigate?', delimiter: '' },
  ease: 'none'
});

// AFTER
gsap.to(cmdText, {
  duration: 2.15,
  delay: 0.5,
  text: { value: 'Force multipliers for small businesses...', delimiter: '' },
  ease: 'none'
});
```

**No other timeline changes required.** The sonar pulse animation is independent and can overlap with the longer typing. The total affordance duration increases from ~3.5s to ~4.15s, which is acceptable since this runs post-reveal in idle state.

### Trailing Ellipsis Note

The `...` at the end of the new text creates a natural "thinking" pause. GSAP TextPlugin will type these three dots at the same per-character rate. This is desirable — it creates a built-in pause at the end that invites curiosity.

---

## 2. Terminal Loading Animation Design

### Current State

**File**: `index.html:136-137` (inside `#status-panel`)

```html
<p class="status-line">scanning systems...</p>
```

This is static text set in HTML. During the reveal sequence, status lines fade in as a group at `t=2.0` with `stagger: 0.15` (animations.js:216-219). The phase indicator starts as `'IDLE'` and is manipulated by the reveal and scroll sequences.

**File**: `js/data.js:4-139` — 7 projects with IDs:
1. `odd-ai-reviewers`
2. `ado-git-repo-insights`
3. `repo-standards`
4. `odd-self-hosted-ci`
5. `odd-map`
6. `odd-fintech`
7. `coney-island`

### Design: Full Terminal Loading Animation

#### Concept

Replace the static "scanning systems..." status line with a live, animated terminal readout that scans each of the 7 projects by name, shows an ASCII-style progress bar, and concludes with a "PORTFOLIO READY" state. This runs in the right sidebar (`#status-panel`) and is **non-blocking** — the user can interact with nav buttons, click stars, or scroll at any time.

#### HTML Changes

Replace the static `scanning systems...` line with a container:

```html
<!-- Replace this: -->
<p class="status-line">scanning systems...</p>

<!-- With this: -->
<p class="status-line scan-line" id="scan-line">initializing...</p>
<p class="status-line progress-line" id="progress-bar">
  <span class="progress-track" aria-hidden="true">[..........] 0%</span>
  <span class="sr-only" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="scan-progress-sr">Scan progress: 0%</span>
</p>
```

#### CSS Additions

```css
.scan-line {
  min-height: 1.4em;         /* prevent layout shift during text swap */
  transition: none;           /* GSAP handles all animation */
}

.progress-track {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-mono);
  letter-spacing: 0.1em;
}

.progress-track .filled {
  color: var(--color-brass-light);
}
```

#### Animation Timeline Specification

**Total duration**: ~8.5s (but non-blocking — runs concurrently with user interaction)
**Trigger**: Fires after the reveal sequence completes, 0.5s before the discoverability affordance

##### Phase Breakdown

| Phase | Time | Duration | Action | Easing |
|-------|------|----------|--------|--------|
| **Init** | 0.0s | 0.3s | "initializing..." visible (set by HTML) | — |
| **Scan 1** | 0.3s | 0.8s | Text swaps to `Scanning odd-ai-reviewers...` | `none` (TextPlugin type) |
| **Bar 1** | 0.3s | 0.8s | Progress bar fills to `[##........] 14%` | `power1.inOut` |
| **Scan 2** | 1.1s | 0.7s | `Scanning ado-git-repo-insights...` | `none` (TextPlugin type) |
| **Bar 2** | 1.1s | 0.7s | `[###.......] 28%` | `power1.inOut` |
| **Scan 3** | 1.8s | 0.6s | `Scanning repo-standards...` | `none` (TextPlugin type) |
| **Bar 3** | 1.8s | 0.6s | `[####......] 43%` | `power1.inOut` |
| **Scan 4** | 2.4s | 0.7s | `Scanning odd-self-hosted-ci...` | `none` (TextPlugin type) |
| **Bar 4** | 2.4s | 0.7s | `[######....] 57%` | `power1.inOut` |
| **Scan 5** | 3.1s | 0.6s | `Scanning odd-map...` | `none` (TextPlugin type) |
| **Bar 5** | 3.1s | 0.6s | `[#######...] 71%` | `power1.inOut` |
| **Scan 6** | 3.7s | 0.6s | `Scanning odd-fintech...` | `none` (TextPlugin type) |
| **Bar 6** | 3.7s | 0.6s | `[########..] 86%` | `power1.inOut` |
| **Scan 7** | 4.3s | 0.7s | `Scanning coney-island...` | `none` (TextPlugin type) |
| **Bar 7** | 4.3s | 0.7s | `[##########] 100%` | `power1.inOut` |
| **Pause** | 5.0s | 0.5s | Hold final scan state | — |
| **Complete** | 5.5s | 0.4s | Text swaps to `7 systems nominal` | instant (`innerHTML` swap) |
| **Bar done** | 5.5s | 0.3s | Bar text swaps to `PORTFOLIO READY` with color flash | `power2.out` |
| **Flash** | 5.8s | 0.6s | Brief brass glow on the progress line, then settle | `sine.inOut` |

**Total animation**: ~6.4s active + enters idle state

##### Detailed GSAP Implementation

```js
function playTerminalScan() {
  const scanLine = document.getElementById('scan-line');
  const progressTrack = document.querySelector('.progress-track');
  const progressSR = document.getElementById('scan-progress-sr');
  if (!scanLine || !progressTrack) return null;

  const projects = PROJECTS.map(p => p.id);
  const totalProjects = projects.length; // 7
  const barLength = 10; // 10-char ASCII bar

  const tl = gsap.timeline();

  projects.forEach((id, i) => {
    const scanText = `Scanning ${id}...`;
    const progress = Math.round(((i + 1) / totalProjects) * 100);
    const filled = Math.round(((i + 1) / totalProjects) * barLength);
    const barStr = '[' + '#'.repeat(filled) + '.'.repeat(barLength - filled) + '] ' + progress + '%';

    // Typing speed: ~30 chars/sec for scan text (fast, machine-like)
    const typeDuration = scanText.length * 0.033;

    // Stagger: each scan starts 0.7s apart (with slight variance for feel)
    const startTime = 0.3 + i * 0.7;

    // Type the project name
    tl.to(scanLine, {
      duration: typeDuration,
      text: { value: scanText, delimiter: '' },
      ease: 'none'
    }, startTime);

    // Update progress bar (innerHTML swap — faster than TextPlugin for short static strings)
    tl.to(progressTrack, {
      duration: 0.01,
      onComplete: () => {
        progressTrack.textContent = barStr;
        if (progressSR) {
          progressSR.setAttribute('aria-valuenow', progress);
          progressSR.textContent = 'Scan progress: ' + progress + '%';
        }
      }
    }, startTime + typeDuration * 0.8); // Bar updates near end of typing
  });

  // Hold state briefly
  const endOfScans = 0.3 + totalProjects * 0.7 + 0.3;

  // Final state: swap to completion message
  tl.to(scanLine, {
    duration: 0.01,
    onComplete: () => { scanLine.textContent = '7 systems nominal'; }
  }, endOfScans + 0.5);

  tl.to(progressTrack, {
    duration: 0.01,
    onComplete: () => {
      progressTrack.textContent = 'PORTFOLIO READY';
      progressTrack.style.color = 'var(--color-brass-light)';
    }
  }, endOfScans + 0.5);

  // Brass flash on completion
  tl.fromTo(progressTrack, {
    textShadow: '0 0 0px rgba(200, 168, 75, 0)'
  }, {
    textShadow: '0 0 8px rgba(200, 168, 75, 0.6)',
    duration: 0.3,
    ease: 'sine.in'
  }, endOfScans + 0.6);

  tl.to(progressTrack, {
    textShadow: '0 0 0px rgba(200, 168, 75, 0)',
    duration: 0.5,
    ease: 'sine.out'
  }, endOfScans + 0.9);

  return tl;
}
```

##### Integration with Reveal Sequence

The terminal scan should begin **during** the reveal sequence, not after. Specifically:

- **Desktop**: Start at `t=2.0` in the master reveal timeline, concurrent with the status lines fading in. The scan-line and progress-bar elements are part of the status-line group, so they inherit the fade-in stagger. Once visible, the scan animation begins independently.
- **Mobile**: Start immediately after frame elements are set (t=0.5), since mobile skips frame assembly.

**Integration point** in `playRevealSequence()`:

```js
// After status lines fade in (t=2.0 on desktop)
tl.add(() => {
  const scanTl = playTerminalScan();
  // scanTl runs independently — non-blocking
}, 2.3); // slight offset so lines are visible first
```

The scan timeline is **not** nested in the master timeline with `.add(scanTl)` — it is spawned as an independent timeline via a callback. This ensures:
1. The reveal `onComplete` fires independently of the scan
2. User can skip the reveal without the scan timeline breaking
3. The scan is purely decorative — no gating logic depends on it

##### Skip Behavior

When the user skips the reveal (Skip button or S key):
- `masterTimeline.progress(1)` fires the callback at t=2.3 which spawns the scan
- The scan timeline runs at normal speed even if reveal was skipped — this is intentional; the scan in the sidebar is a nice background effect
- If `prefers-reduced-motion` is active, `playTerminalScan` should show the final state immediately:

```js
function playTerminalScan() {
  // ...element refs...

  if (prefersReducedMotion.matches) {
    scanLine.textContent = '7 systems nominal';
    progressTrack.textContent = 'PORTFOLIO READY';
    progressTrack.style.color = 'var(--color-brass-light)';
    return null;
  }

  // ...normal animation timeline...
}
```

##### Progress Bar: ASCII vs CSS

**Recommendation: ASCII art progress bar** (`[####......]`) rather than a CSS `<progress>` element.

Rationale:
- Matches the terminal/mono aesthetic of the status panel
- Avoids cross-browser `<meter>`/`<progress>` styling issues (already visible with the mana meter)
- Keeps the implementation simple — just string manipulation
- The `<span class="sr-only">` with `role="progressbar"` provides accessible semantics without visual overhead
- Character-by-character bar updates feel more "authentic" to the arcane console theme

##### Final Idle State

After the scan completes, the status panel shows:

```
ARCANE CONSOLE v4.2.1
7 systems nominal
PORTFOLIO READY
MANA ████████░░ 72%
PHASE READY
```

This persists until scroll interactions update the phase indicator and cmd-text.

---

## 3. Sidebar Hover/Touch Interactions

### Current State

**File**: `index.html:84-130` (`#constellation-nav`)

Each nav button contains:
```html
<button data-project-id="odd-ai-reviewers" aria-pressed="false">
  <span class="glyph" aria-hidden="true">★</span>
  <span class="constellation-name">The Forge Septet</span>
</button>
```

Currently, buttons have no hover description — clicking immediately opens the project overlay panel.

### Design: Hover/Touch Description Affordance

#### Concept

On hover (desktop) or first tap (mobile), show the project's tagline below the constellation name. This gives users a preview before committing to opening the full panel.

#### HTML Changes

Add a `<span class="project-tagline">` to each button (populated from `PROJECTS` data at init, or hardcoded in HTML). Example:

```html
<button data-project-id="odd-ai-reviewers" aria-pressed="false">
  <span class="glyph" aria-hidden="true">★</span>
  <span class="constellation-name">The Forge Septet</span>
  <span class="project-tagline" aria-hidden="true">Extensible AI code review pipeline</span>
</button>
```

**Note**: Taglines should be truncated/shortened versions of the full tagline from `data.js` — max ~45 chars to fit the sidebar width. The full tagline is in the overlay.

#### CSS

```css
.project-tagline {
  display: block;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  font-family: var(--font-body);     /* IM Fell English */
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.4;
  padding: 0 0 0 calc(1em + var(--space-xs)); /* indent past glyph */
  transition: max-height 0.3s ease, opacity 0.25s ease;
  white-space: normal;
  pointer-events: none;
}

/* Desktop hover — expand tagline */
@media (hover: hover) and (pointer: fine) {
  #constellation-nav button:hover .project-tagline,
  #constellation-nav button:focus-visible .project-tagline {
    max-height: 3em;
    opacity: 0.85;
  }
}
```

#### Desktop Hover Animation (GSAP Enhancement)

While CSS transitions handle the basic show/hide, GSAP can add polish:

```js
function initNavHoverEffects() {
  if (prefersReducedMotion.matches) return;
  if (isMobileView()) return; // Mobile uses different pattern

  const navButtons = document.querySelectorAll('#constellation-nav button[data-project-id]');

  navButtons.forEach(btn => {
    const tagline = btn.querySelector('.project-tagline');
    const glyph = btn.querySelector('.glyph');
    if (!tagline) return;

    btn.addEventListener('mouseenter', () => {
      gsap.killTweensOf(tagline);
      gsap.to(tagline, {
        maxHeight: '3em',
        opacity: 0.85,
        duration: 0.3,
        ease: 'power2.out'
      });
      gsap.to(glyph, {
        scale: 1.2,
        color: btn.dataset.accentColor || 'var(--color-brass-light)',
        duration: 0.2,
        ease: 'back.out(2)'
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.killTweensOf(tagline);
      gsap.to(tagline, {
        maxHeight: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in'
      });
      gsap.to(glyph, {
        scale: 1,
        clearProps: 'color',
        duration: 0.2,
        ease: 'power2.out'
      });
    });
  });
}
```

**Timing summary:**
| Event | Property | Duration | Easing | Delay |
|-------|----------|----------|--------|-------|
| Mouse enter | tagline maxHeight | 0.3s | `power2.out` | 0 |
| Mouse enter | tagline opacity | 0.3s | `power2.out` | 0 |
| Mouse enter | glyph scale | 0.2s | `back.out(2)` | 0 |
| Mouse leave | tagline maxHeight | 0.25s | `power2.in` | 0 |
| Mouse leave | tagline opacity | 0.25s | `power2.in` | 0 |
| Mouse leave | glyph scale | 0.2s | `power2.out` | 0 |

#### Mobile Touch Behavior

On mobile (hamburger nav open), the interaction model differs:

1. **First tap**: Expand the tagline below the button (same animation as hover, but triggered by tap)
2. **Second tap** (on same button): Open the project panel
3. **Tap another button**: Collapse previous tagline, expand new one
4. **Tap outside**: Collapse all taglines

Implementation approach:

```js
function initNavTouchEffects() {
  if (!isMobileView()) return;

  const navButtons = document.querySelectorAll('#constellation-nav button[data-project-id]');
  let expandedBtn = null;

  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tagline = btn.querySelector('.project-tagline');

      if (expandedBtn === btn) {
        // Second tap — proceed to open panel (default click handler runs)
        collapseTagline(expandedBtn);
        expandedBtn = null;
        return; // let the existing click handler in interactions.js fire
      }

      // First tap — expand tagline, prevent panel open
      e.stopImmediatePropagation();

      if (expandedBtn) {
        collapseTagline(expandedBtn);
      }

      expandTagline(btn);
      expandedBtn = btn;
    });
  });

  function expandTagline(btn) {
    const tagline = btn.querySelector('.project-tagline');
    if (!tagline) return;
    gsap.to(tagline, {
      maxHeight: '3em',
      opacity: 0.85,
      duration: 0.25,
      ease: 'power2.out'
    });
  }

  function collapseTagline(btn) {
    const tagline = btn.querySelector('.project-tagline');
    if (!tagline) return;
    gsap.to(tagline, {
      maxHeight: 0,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    });
  }
}
```

**Important**: The mobile touch handler must be registered **before** the existing click handler in `interactions.js` (or use `e.stopImmediatePropagation()` on first tap). This requires careful initialization order.

#### Reduced Motion

Under `prefers-reduced-motion`, the hover/touch effects should:
- Show tagline instantly on hover/focus (`duration: 0.01`)
- No glyph scale animation
- No delay

---

## 4. Greek Key Shimmer Coordination

### Current State

The "rune band" (`css/styles.css:525-546`) is a `repeating-linear-gradient` creating a brass tick pattern along the top frame edge. There is no shimmer animation currently.

### Shimmer Timing Recommendation

The Greek key shimmer should be coordinated with the Technical Artist who owns the shader/visual implementation. From a motion engineering perspective, here are the timing parameters:

**Trigger**: Shimmer activates at the same time as the discoverability affordance (2s post-reveal) as a "system online" visual cue.

**Timeline position in the overall choreography**:

```
t=0.0     Reveal sequence begins
t=6.5     Reveal completes (desktop)
t=8.5     (2s delay) Discoverability affordance + Greek key shimmer start
t=8.5     Sonar pulse begins (stars scale up/down)
t=9.0     CLI typing begins ("Force multipliers...")
t=8.5     Greek key shimmer sweep begins (synchronized with sonar)
t=10.0    Shimmer completes one sweep
t=11.0    Shimmer settles to subtle idle loop
```

**Shimmer animation parameters**:

| Property | Value | Notes |
|----------|-------|-------|
| Type | CSS `background-position` animation or GSAP-driven gradient shift | Coordinate with Technical Artist |
| Duration (initial sweep) | 1.5s | Matches the star sonar pulse duration |
| Easing | `power2.inOut` | Smooth acceleration/deceleration |
| Direction | Left-to-right | Follows the rune band's gradient direction |
| Idle loop | 8s period, very subtle | `sine.inOut`, opacity oscillation 0.6-0.8 |
| Reduced motion | No shimmer — static at `opacity: 0.7` (current) | |

**Implementation suggestion for Technical Artist**:

A CSS custom property `--shimmer-offset` animated by GSAP would let the Technical Artist control the visual (gradient mask position, glow intensity) while I control the timing:

```js
// Motion engineer provides timing; Technical Artist provides the CSS
gsap.fromTo('.frame__rune-band', {
  '--shimmer-offset': '0%'
}, {
  '--shimmer-offset': '100%',
  duration: 1.5,
  ease: 'power2.inOut',
  onComplete: startIdleShimmer
});

function startIdleShimmer() {
  gsap.to('.frame__rune-band', {
    opacity: 0.8,
    duration: 4,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });
}
```

---

## 5. Spec Recommendations — Functional Requirements

### FR-BETA-MOTION-01: Discoverability Affordance Text

> The discoverability affordance SHALL type "Force multipliers for small businesses..." into the command line at a rate of 20 characters per second (duration: 2.15s), triggered 2 seconds after reveal completion. The phase indicator SHALL display "PORTFOLIO" during the typing animation.

**Acceptance criteria:**
- Text is "Force multipliers for small businesses..." (exactly 43 characters including ellipsis)
- Typing duration is 2.15s (+/- 0.1s)
- Phase indicator shows "PORTFOLIO" at 0.8s into the affordance
- Existing sonar pulse animation remains unchanged
- `prefers-reduced-motion`: text appears instantly, no typing animation

### FR-BETA-MOTION-02: Terminal Loading Animation

> The right sidebar status panel SHALL display an animated terminal scanning sequence that cycles through all 7 project names with an ASCII progress bar. The animation SHALL be non-blocking (user can interact at any time) and SHALL complete within 7 seconds.

**Acceptance criteria:**
- Each project ID appears as "Scanning {id}..." in the scan line
- ASCII progress bar format: `[##........] XX%` with 10-character track
- Progress increments proportionally (14%, 28%, 43%, 57%, 71%, 86%, 100%)
- Final state shows "7 systems nominal" and "PORTFOLIO READY"
- Animation spawns as independent timeline (not nested in reveal master)
- User can click nav buttons, stars, or scroll at any time during scan
- Screen reader receives `aria-valuenow` updates on the progressbar
- `prefers-reduced-motion`: final state shown immediately, no animation

### FR-BETA-MOTION-03: Terminal Loading — Reveal Integration

> The terminal scanning animation SHALL begin at t=2.3s in the desktop reveal sequence (after status lines fade in) and at t=0.5s in the mobile reveal sequence. Skip-reveal SHALL spawn the scan animation at normal speed.

**Acceptance criteria:**
- Desktop: scan starts at `t=2.3` in master timeline
- Mobile: scan starts at `t=0.5` in master timeline
- Skip button/S key: reveal jumps to end, scan spawns and runs normally
- Scan timeline is not killed when reveal is skipped

### FR-BETA-MOTION-04: Sidebar Hover Descriptions (Desktop)

> On desktop (pointer: fine), hovering over a constellation nav button SHALL expand a truncated project tagline below the constellation name. The expansion SHALL animate over 0.3s with `power2.out` easing. The star glyph SHALL scale to 1.2x on hover.

**Acceptance criteria:**
- Tagline appears below constellation name on hover
- Tagline max ~45 characters (truncated from full tagline)
- Enter animation: 0.3s `power2.out` (maxHeight + opacity)
- Exit animation: 0.25s `power2.in`
- Glyph scales to 1.2x with `back.out(2)` on enter, 1.0x on leave
- Focus-visible triggers same expansion (keyboard accessibility)
- `prefers-reduced-motion`: instant show/hide, no scale animation

### FR-BETA-MOTION-05: Sidebar Touch Descriptions (Mobile)

> On mobile/touch devices, the first tap on a constellation nav button SHALL expand the tagline preview. A second tap on the same button SHALL open the project panel. Tapping a different button SHALL collapse the previous tagline and expand the new one.

**Acceptance criteria:**
- First tap: tagline expands (0.25s `power2.out`), panel does NOT open
- Second tap on same button: panel opens normally
- Tap different button: previous collapses, new expands
- Tap outside nav: all taglines collapse
- State resets when hamburger nav closes

### FR-BETA-MOTION-06: Greek Key Shimmer Timing

> The Greek key border shimmer animation SHALL begin simultaneously with the discoverability affordance (2s post-reveal). The initial sweep SHALL last 1.5s left-to-right with `power2.inOut` easing, followed by a subtle idle loop at 8s period.

**Acceptance criteria:**
- Shimmer begins at same time as sonar pulse
- Initial sweep: 1.5s, left-to-right, `power2.inOut`
- Idle loop: 8s period, opacity oscillation 0.6-0.8, `sine.inOut`
- Uses CSS custom property `--shimmer-offset` for Technical Artist coordination
- `prefers-reduced-motion`: no shimmer, static opacity 0.7

---

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mobile first-tap/second-tap UX confusion | Medium | Add subtle visual affordance (e.g., button border glow on expanded state) to indicate "tap again to open" |
| Terminal scan + reveal skip race condition | Low | Scan spawns via callback at timeline position, not by time — `progress(1)` still fires it |
| ASCII progress bar font rendering on narrow screens | Low | Bar is in right sidebar, hidden on mobile (<768px); only visible on desktop where sidebar has fixed width |
| Touch event handler ordering with existing click handlers | Medium | Use `e.stopImmediatePropagation()` and ensure mobile handler registers before `initInteractions()` |
| GSAP TextPlugin and scan line — rapid text swaps may flash | Low | Each scan text is typed (not swapped) so transition is smooth; bar uses instant swap which is fine for short strings |

---

## 7. Animation Budget Impact

| Animation | Draw calls | GPU impact | Memory |
|-----------|-----------|------------|--------|
| Terminal scan (text swap) | 0 (DOM only) | Negligible | ~1KB strings |
| Progress bar (text swap) | 0 (DOM only) | Negligible | ~100B strings |
| Hover tagline expand | 0 (CSS layout) | Low (reflow on ~1 element) | ~200B per tagline |
| Glyph scale on hover | 0 (CSS transform) | Negligible | None |
| Greek key shimmer | 0 (CSS custom prop) | Low (gradient repaint) | None |

**Total additional draw calls**: 0 (all DOM/CSS based)
**Total additional GPU cost**: Negligible — well within the <30 steady-state draw call budget

All new animations are DOM-only and do not affect the Three.js render loop or WebGL draw call budget.
