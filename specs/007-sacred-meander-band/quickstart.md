# Quickstart: Sacred Meander Band Testing

**Feature**: 007-sacred-meander-band
**Prerequisites**: Feature 006 merged to main. Branch `007-sacred-meander-band` checked out.

## Quick Visual Test (2 minutes)

1. Open `index.html` in Chrome at 1920×1080
2. Wait for reveal animation to complete (~6.5s) or press S to skip
3. Verify the meander band along the top border:
   - Band height matches the brass border rail width (both 18px)
   - Meander hooks show 3D embossed lighting (top-lit horizontal arms, side-lit vertical arms)
   - Shimmer sweep moves smoothly left-to-right
   - Band edges fade to dark at both endpoints — no mid-hook clipping

## Full Testing Checklist (10 minutes)

### 1. Proportional Integration (US1)

- [ ] **Desktop 1920×1080**: Band height = border rail width (18px). Band and rail read as single unified strip.
- [ ] **Desktop 1440×900**: Same proportional integration.
- [ ] **Desktop 1200×800**: Same proportional integration at minimum desktop width.
- [ ] **Tablet 1024×768**: Band height = border rail width (12px). Scales proportionally.
- [ ] **Mobile 375×812**: Band is hidden (display: none). No visual trace.
- [ ] **Live resize**: Drag browser edge across breakpoints — no flicker, no jarring jumps.

### 2. Directional Lighting (US2)

- [ ] **Horizontal arms**: Top rail and inner hook segments show top-to-bottom gradient (highlight → face → shadow).
- [ ] **Vertical arms**: Descender and inner stem segments show left-to-right gradient (highlight → face → shadow).
- [ ] **Hook turns**: Where meander turns from horizontal to vertical, the gradient transition reads as natural material bend.
- [ ] **Tile seams**: Zoom to 200% — no visible color discontinuity between adjacent tiles.
- [ ] **Color match**: Meander brass tones match adjacent edge rail brass tones (same palette).

### 3. Shimmer Performance (US3)

- [ ] **No paint events**: Open DevTools → Performance → Record 5s idle → filter for Paint events → should be zero (only Composite events).
- [ ] **Layer promotion**: DevTools → Layers panel → shimmer pseudo-element on its own compositor layer.
- [ ] **60fps**: Performance recording shows consistent 60fps during shimmer animation.
- [ ] **Reduced motion**: Enable `prefers-reduced-motion: reduce` → shimmer does not play.
- [ ] **Tier 2**: Force tier 2 → shimmer slows to 8s duration.
- [ ] **Tier 3**: Force tier 3 → shimmer disabled entirely (`.shimmer-disabled` class).

### 4. Pattern Termination (US4)

- [ ] **Left endpoint**: Pattern fades to background color at left edge — no mid-hook clipping.
- [ ] **Right endpoint**: Pattern fades to background color at right edge — no mid-hook clipping.
- [ ] **Resize test**: Drag browser width continuously — fade masks track edges, no clipping artifacts.
- [ ] **1920×1080**: Clean termination at wide viewport.
- [ ] **1200×800**: Clean termination at minimum desktop viewport.

### 5. Integration Regression (FR-007)

- [ ] **Reveal animation**: Page load → band fades in with frame assembly at t=1.0s → opacity reaches 0.7.
- [ ] **Mobile reveal**: At mobile width → band stays hidden throughout reveal.
- [ ] **Reduced-motion reveal**: With reduced motion → band appears immediately at near-full opacity.
- [ ] **Brushed grain**: Zoom to 300% → subtle vertical grain texture visible over meander pattern.
- [ ] **High-contrast mode**: Enable `prefers-contrast: more` → band is hidden.
- [ ] **Accessibility**: `.frame` element retains `aria-hidden="true"` and `pointer-events: none`.

### 6. Cross-Browser (FR-007)

- [ ] **Chrome** (latest): All above tests pass.
- [ ] **Firefox** (latest): Shimmer animation plays, no paint events.
- [ ] **Safari** (latest macOS): SVG tile renders correctly, gradients display.

## Forcing Performance Tiers (for testing)

To manually trigger tier degradation in the browser console:

```js
// Tier 2: slow shimmer
document.querySelector('.frame__greek-key')?.style.setProperty('--shimmer-duration', '8s');

// Tier 3: disable shimmer
document.querySelector('.frame__greek-key')?.classList.add('shimmer-disabled');

// Reset to normal
document.querySelector('.frame__greek-key')?.style.removeProperty('--shimmer-duration');
document.querySelector('.frame__greek-key')?.classList.remove('shimmer-disabled');
```

## Forcing Reduced Motion (for testing)

In Chrome DevTools: Rendering → Emulate CSS media feature → `prefers-reduced-motion: reduce`
