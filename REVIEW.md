# Authoritative Decisions

Boyscout/cleanup and modularize work moving forward. Do not leave dead code and avoid bloating existing files unecessarily.

## 1. **Keep sidebars in WebGL**, but make the layering deliberate:

- Universe: WebGL canvas layer A (center)
- Sidebars: WebGL canvas layer B (or same canvas, separate render pass/scene)
- Reticles/labels: HTML/SVG overlay

So: **don’t move sidebars out of WebGL** — instead, treat them as a _first-class_ scene element with their own material language (where the etched hieroglyphs live).

## 2. Instead of simplifying sidebars and greek_key border, **discipline their visual vocabulary**:

- The sidebars get _material richness_ (etching + brass edgework + faint phi geometry)
- But reduce “random effects” (unmotivated glow/noise)
- Make their motion slow and intentional (breathing light, subtle shimmer, scan pass)

That keeps them important without becoming chaotic.

---

Single “best” answer for hierogpyhs in sidebars:
**MSDF/SDF stamping + shader-based emboss/engrave on the sidebar material** is the highest-quality and most controllable way to get “etched logo hieroglyphs” with rotations and golden ratio construction lines.
Our logo has some special properties we must articulate in the sidebars by etching them in as if they are hieroglpyhs.

our official logo generator:
The logo was designed mathematically calculated using the golden ratio. So any related math can be used in the hieroglpyh design.
B. You can view the math, or generate the logo in any orientation, color, or size using this generator: design-assets\oddessentials-logo-generator\generators\oe_logo_flipped_rotated.py 1. 0 degrees it looks like OE (for Odd Essentials) 2. Flipped 90 degree cw, it looks like a serious crusader bot (with a helmet and no mouth) 3. Flipped 180 degrees cw it looks like a rocket ship projecting forward 4. Flipped 90 degrees ccw it looks like a smiling king bot (with a crown) 5. The way we typically orient it looks like a spaceshit (backwards OE) going into the upper right.

---

## 3. Reduce Starfield Noise

Stars currently have chromatic glitches which create visual clutter.

Action:

- Mostly **white stars**
- Occasional chromatic twinkle
- Let **project nodes carry the color**

---

## 4. Emphasize Project Nodes

Project planets should be the clear navigation anchors.

Action:

- Increase node glow/size slightly
- Keep starfield small and subtle
- Nodes should visually stand out.

---

## 5. Add Structure with Constellation Lines

Nodes currently float without relationship cues.

Action:

- Draw **thin animated constellation lines**
- Show relationships between projects.

This reinforces the **ecosystem narrative**.

---

## 6. Add a Targeting Reticle (Focus Ring)

Use a **space-game style targeting system** to clarify interaction.

When hovering near a node:

- a circular **reticle locks onto the planet**
- label appears beside it
- reticle animates slightly

Implementation:

- SVG overlay above WebGL canvas.

This makes the interface feel like a **navigation instrument**.

---

## 7. Add Depth with Parallax

The universe currently feels flat.

Action:
Create **3 star layers** with subtle mouse or camera parallax.

```
background stars → slow
mid stars → medium
foreground particles → faster
```

This instantly creates depth.

---

# Final Concept Rule

Think of the experience as:

**A Victorian astronomical instrument exploring your engineering universe.**

- The **console frame** is the instrument.
- The **WebGL universe** is what the instrument observes.
- The **reticle system** is how the user navigates it.

If you keep that mental model, the design will stay **coherent instead of chaotic**.

---

# Visual Guidance

## Best technical way to make the logo look etched into the WebGL sidebars

If your sidebars are already **WebGL with curves + shading**, the cleanest, most controllable approach is:

### ✅ Use a “height/normal stamp” (SDF-based) to emboss/engrave the logo in the sidebar shader

**Concept**

1. Convert your logo (SVG) into a **Signed Distance Field (SDF)** texture (or Multi-channel SDF / MSDF).
2. In the sidebar fragment shader, sample that SDF at repeated positions (pattern).
3. Use the SDF value to create:
   - **engraving depth** (height)
   - **normal perturbation** (lighting reacts like it’s carved)
   - optional **edge highlight** (gives it that etched catch-light)

**Why this is best**

- Looks like _real material carving_ because the **lighting changes** across the etched edges.
- Scales cleanly at any resolution (SDF/MSDF).
- Easy to rotate, tile, fade, mask, and animate subtly.
- Works perfectly with curved sidebar geometry.

**The “etched” look is mostly lighting**
You want:

- a _slight_ cavity darkening (ambient occlusion-ish)
- a _thin_ bright rim where light grazes the etched edge
- micro-roughness difference inside the carved region

That’s all shader territory — and it looks premium.

---

## How to do the 4 orientations (hieroglyph vibe)

You have two good options:

### Option A (simplest): 4 rotated UV samples in the shader

Define 4 UV transforms (0°, 90°, 180°, 270°) and choose based on tile index.

- Tile your sidebar UVs (like wallpaper)
- For each tile cell, pick rotation = `(cellX + cellY) % 4`
- Sample the SDF with that rotation matrix

This gives “logo in four orientations” without needing 4 separate assets.

### Option B (more control): bake 4 SDFs into one atlas

Put each rotation into a quadrant of one texture and select quadrant per tile.
More memory, but a bit simpler math in shader.

---

## Golden ratio math “explaining it” (without looking like a math textbook)

This is best as a **very faint overlay layer** and/or **construction lines** that appear on hover/focus.

### What to render

- A few **phi-grid lines** (not full grid)
- A subtle **spiral arc** that aligns with the logo’s dominant curve
- Occasional tiny labels like `φ`, `1:φ`, `φ²` — only near a few stamps, not everywhere

### Technically: do it as a second stamp layer

- Use a **thin-line SDF** texture for the phi spiral / grid
- Blend it as:
  - etched-but-shallower than the logo
  - much lower opacity
  - slightly different roughness so it catches light differently

**Key trick:** make the “math layer” respond to light more than opacity. It will feel engraved, not drawn.

---

## Material recipe for “etched into brass/obsidian” sidebars

In shader terms, you’ll get the look by modulating **three channels** with your stamp:

1. **Height / normal** (primary “carve”)
2. **Roughness** (etched area slightly rougher or slightly smoother)
3. **Albedo** (tiny darkening inside cavity)

Then add a controlled highlight:

- `edge = smoothstep(a,b,sdf) - smoothstep(c,d,sdf)` (a narrow band)
- add a warm “brass glint” color to that edge band

---

## Practical pipeline (fast + high quality)

1. **Keep logo as SVG source of truth**
2. Generate **MSDF** (recommended) using tools like:
   - msdfgen / msdf-bmfont style pipelines

3. Store as `logo_msdf.png` in `/assets`
4. In WebGL:
   - Sidebar mesh has UVs
   - Fragment shader tiles UVs and stamps the MSDF
   - Apply normal perturbation + edge glint

This is how you get “etched hieroglyphs” that look like they belong in the material.
