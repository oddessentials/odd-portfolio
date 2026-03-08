# Research: Splash Gate Polish

**Branch**: `018-splash-gate-polish` | **Date**: 2026-03-08

## R-001: Quill Cursor Size & Quality

**Decision**: Use 48x48 PNG cursor (not 32x32)

**Rationale**: At 32x32, the quill nib becomes a 1-2 pixel point — recognizable as a feather shape but loses the defining quill detail. At 48x48, the brass nib, feather plume, and shaft are all clearly distinguishable. The quill is already oriented correctly (nib pointing down-left) — no rotation needed.

**Hotspot**: Bottom-left corner at the nib tip — coordinates (2, 47) at 48x48.

**Fallback chain**: `cursor: url('quill-cursor.png') 2 47, pointer` — falls back to pointer (hand) if image fails, preserving clickability affordance.

**Browser support**: PNG cursors supported in all modern browsers. No `.cur` format needed. Maximum cursor size is 128x128 — 48x48 is well within limits.

**Alternatives considered**:
- 32x32: Too small, nib becomes single pixel. Rejected.
- 64x64: Viable but oversized for a cursor — feather plume would obscure content. Rejected.
- SVG cursor: Chrome/Safari don't support SVG in `cursor: url()`. Rejected.

---

## R-002: Desk Image Cropping Strategy

**Decision**: Use `object-fit: cover` with center alignment, cropping left/right edges

**Rationale**: The archway opening is portrait-oriented. The desk image (1536x1024 landscape) center-cropped retains the most thematic element — the ornate brass monitor showing a constellation display, which directly foreshadows the portfolio behind the door. The keyboard and desk surface are also visible.

**What's lost**: Left side (books, scroll, inkwell, astrolabe) and right side (crystal ball, hourglass, candle, globe). These add ambiance but are not visible long enough during the 1-2 second reveal to matter.

**Optimization**: Resize to 768x512 before serving. The visible portion through the archway is roughly 300-400px wide on a 1080p viewport. WebP quality 75-80 should yield ~80-100KB.

**Fallback**: The desk has a black background that blends naturally with the dark scene interior. If the image fails to load, the inner glow gradient fills the space — no visual breakage.

**Alternatives considered**:
- Full desk scaled to fit (with black bars): Would show all props but desk becomes tiny in portrait frame. Rejected.
- Wider crop (640-700px): Captures partial book/candle edges but gains minimal value. Rejected — center crop is cleaner.

---

## R-003: New Door Parchment Alignment

**Decision**: Current text overlay percentages are compatible — no adjustment needed for alignment

**Findings**: Pixel-level comparison of parchment regions:

| Edge | Current Door | New Door | Delta |
|------|-------------|----------|-------|
| Left | 30.1% | 28.4% | -1.7% |
| Right | 24.2% | 23.1% | -1.1% |
| Top | 17.4% | 16.9% | -0.5% |
| Bottom | 24.0% | 22.5% | -1.5% |

The new door's parchment is slightly larger (+2.7% wider, +2.1% taller) and in nearly the same position. The current CSS overlay (`top:15%, left:27%, right:25%, bottom:16%`) works better with the new door because the overlay box fits more precisely within the larger parchment.

**Critical note**: The new door image (`door-and-parchment-3.png`) contains baked-in text/logo in the lower half of the parchment (approximately 55%-75% vertical range). The dynamic text overlay must be positioned above this baked-in content. Current `padding-top: 12%` with `justify-content: flex-start` places the greeting and body text in the upper portion — this should clear the baked-in area. Visual validation required after asset swap.

**Alternatives considered**:
- Tighter CSS values (`top:17%, left:28%, right:23%, bottom:23%`): More precise but unnecessary given padding handles the offset. Deferred unless visual issues arise.

---

## R-004: Asset Optimization Targets

| Asset | Source | Target | Format | Est. Size |
|-------|--------|--------|--------|-----------|
| Door | 1024x1536 RGBA | 768x1152 RGBA | WebP q80 + PNG | ~300KB WebP |
| Desk | 1536x1024 RGBA | 768x512 RGB | WebP q75 + PNG | ~80-100KB WebP |
| Quill cursor | 1024x1536 RGBA | 48x48 RGBA | PNG only | ~2-3KB |
| Signature (remove) | 215x123 | DELETE | — | -43KB savings |

**Net payload impact**: +~380KB WebP desktop, +~300KB mobile (no desk). Within SC-006 budget (desk excluded from mobile calculation).

---

## R-005: Mobile Considerations

**Quill cursor**: Gate behind `@media (hover: hover) and (pointer: fine)` — matches existing codebase pattern (used in styles.css and pointer-utils.js). No cursor image loaded on touch devices.

**Desk image**: Skip insertion in DOM when viewport <768px. Check `window.innerWidth` at splash build time (splash is built once, never rebuilt). The 3D door swing runs identically on mobile (perspective + rotateY have full support) — the inner glow provides the reveal visual without the desk.

**Door swap**: No mobile concerns. Same dimensions, same `<picture>` pattern, same responsive behavior.
