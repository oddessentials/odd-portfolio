# Research: iOS Black Screen & Desktop Scroll Zone Skip

## R1: Git History — What Each Fix Attempted

### Commit cdf162c (PR #23) — "prevent blank screen when tapping star in zone 3 on mobile"
- **CSS**: Disabled `backdrop-filter: blur(8px)` on mobile `<768px`, replaced with `rgba(4,5,15,0.92)` solid
- **JS**: Wrapped `scrollTo` in single `requestAnimationFrame`; added `ScrollTrigger.refresh()`
- **Rationale**: Two root causes: backdrop-filter GPU failure + scroll restore timing
- **Result**: Reduced frequency but didn't eliminate black screen
- **Assessment**: CSS fix is confirmed good. JS rAF wrapping introduced the first timing gap.

### Commit 03a2a61 (PR #28) — "resolve iOS Safari blank screen on panel close at deep scroll"
- **JS panel.js**: Added `_isClosing` flag; changed to double `requestAnimationFrame`; deferred overlay hidden to inside 2nd rAF
- **JS app.js**: Removed duplicate `panel-open`/`panel-close` ScrollTrigger listeners
- **Rationale**: Single rAF insufficient; Safari needs two compositing frames
- **Result**: Black screen persisted
- **Assessment**: `_isClosing` flag is good. Duplicate listener removal is correct. Double rAF didn't solve iOS issue and widened the timing gap.

### Commit f859acb (PR #28) — "wrap close callback in try/finally"
- **JS panel.js**: Wrapped rAF callback in try/finally for `_isClosing` reset
- **Assessment**: Defensive improvement, correct. But didn't address root cause.

### Commit 105bc84 (post-PR #28) — "restore scroll before releasing body fixed position"
- **JS panel.js**: Reversed order — call `scrollTo` while body still fixed, release fixed in single rAF
- **Rationale**: Prevent scroll-0→scroll-N jump that triggers compositing teardown
- **Result**: Black screen may persist; desktop scroll regression introduced
- **Assessment**: `scrollTo` while `position:fixed` is unreliable across iOS versions. The rAF gap between scrollTo and ScrollTrigger.refresh() causes zone skip regression.

## R2: Original closeProjectPanel (Pre-Fix, Known Working for Desktop)

```javascript
// Pre-cdf162c state (all synchronous):
overlayEl.setAttribute('hidden', '');
document.documentElement.style.overflow = '';
document.body.style.position = '';
document.body.style.width = '';
document.body.style.top = '';
window.scrollTo(0, _savedScrollTop);

if (window.ScrollTrigger) {
  window.ScrollTrigger.getAll().forEach(st => st.enable());
  // NOTE: No ScrollTrigger.refresh() — this was correctly added by cdf162c
}

document.dispatchEvent(new CustomEvent('panel-close'));
if (triggerElement && typeof triggerElement.focus === 'function') {
  triggerElement.focus();
}
triggerElement = null;
```

**Key property**: Everything synchronous. No rAF gaps. No ScrollTrigger desync.
**Missing**: `ScrollTrigger.refresh()` after enable — needed to recalculate positions.

## R3: iOS Safari `backdrop-filter` GPU Compositing

- **Decision**: Disable `backdrop-filter: blur()` on mobile viewports
- **Rationale**: iOS Safari's GPU compositor cannot reliably render backdrop-filter blur over a WebGL canvas. This causes compositing layer teardown (black screen). Using a more opaque solid color (0.92 alpha vs 0.80) maintains visual depth without GPU cost.
- **Alternatives considered**:
  - Reduce blur radius (still triggers compositing issue at any blur value)
  - Use `will-change: transform` on canvas (doesn't prevent the specific layer teardown)
  - Switch to CSS `filter` instead of `backdrop-filter` (different visual result, still GPU-intensive)
- **Status**: Already implemented in cdf162c, confirmed effective. **KEEP**.

## R4: Body `position:fixed` Scroll Lock Pattern

- **Decision**: Revert to synchronous body style reset + scrollTo
- **Rationale**: The `position:fixed` scroll lock is a widely-used pattern. The original synchronous approach worked correctly on desktop. The iOS issues were caused by backdrop-filter (R3), not the scroll lock timing. With backdrop-filter disabled on mobile, the synchronous approach should work on iOS too.
- **Alternatives considered**:
  - Single rAF (cdf162c): Introduces 16ms gap where ScrollTrigger is desynced
  - Double rAF (03a2a61): 32ms gap, still didn't fix iOS
  - Scroll-before-release (105bc84): Unreliable scrollTo while fixed, introduces desktop regression
  - `overflow: hidden` on html/body instead of position:fixed: Doesn't prevent iOS Safari address bar collapse behavior
  - `dialog` element with native modal: Requires significant HTML restructure, out of scope for bug fix

## R5: ScrollTrigger.refresh() Necessity

- **Decision**: Add `ScrollTrigger.refresh()` after `enable()` in the synchronous close path
- **Rationale**: After body goes from `position:fixed` back to `static` and scroll position is restored, ScrollTrigger's cached scroll boundaries may be stale. `refresh()` forces recalculation.
- **The original code was missing this** — it only called `enable()`. Adding `refresh()` ensures scroll zone progress is calculated correctly post-panel-close.

## R6: Desktop Zone Skip Root Cause Confirmation

- **Decision**: Synchronous execution eliminates the timing gap
- **Rationale**: The zone skip occurs because ScrollTrigger.enable() + .refresh() are deferred to rAF while the scroll position has already been restored. During the gap, the GSAP ticker fires with stale state. The synchronous approach eliminates this gap entirely.
- **scroll-zones.js has NOT been modified** by any fix commit — the zone detection logic is unchanged and correct. The regression is purely a timing issue in panel.js.

## R7: What To Keep vs Revert

| Change | Source | Keep/Revert | Reason |
|--------|--------|-------------|--------|
| CSS backdrop-filter mobile disable | cdf162c | **KEEP** | Confirmed GPU fix |
| `_isClosing` re-entrancy guard | 03a2a61 | **KEEP** | Defensive, prevents race conditions |
| try/finally for `_isClosing` reset | f859acb | **KEEP** | Safety improvement |
| rAF wrapping in closeProjectPanel | cdf162c+ | **REVERT** | Source of desktop regression |
| scrollTo-before-release ordering | 105bc84 | **REVERT** | Unreliable on iOS, causes regression |
| Duplicate app.js listener removal | 03a2a61 | **KEEP** | Correct — were true duplicates |
| `ScrollTrigger.refresh()` after enable | cdf162c | **KEEP** | Correctly identified as needed |
