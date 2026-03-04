# Portfolio Project Memory

## Project Overview
Victorian Techno-Mage steampunk portfolio POC — single HTML file with Three.js crystal ball WebGL scene.

## Key Files
- `E:\projects\odd-portfolio\concept.md` — full creative brief and team responsibilities
- `E:\projects\odd-portfolio\portfolio-basic-list.md` — 7 projects with assets/links
- `E:\projects\odd-portfolio\.brainstorm\technical-artist.md` — shader/texture/VFX plan (Task #5, completed)

## 7 Projects & Their Accent Colors
1. odd-ai-reviewers — `#FF6B35` ember orange
2. ado-git-repo-insights — `#00B4D8` azure blue
3. repo-standards — `#7B2FBE` deep violet
4. odd-self-hosted-ci — `#2DC653` terminal green
5. odd-map — `#F7B731` brass gold
6. odd-fintech — `#E63946` crimson red
7. Coney Island / Chat — `#48CAE4` ocean teal

## Shader Architecture Decisions
- Outer glass: Fresnel rim glow (warm amber → cool nebula violet on scroll), fake refraction via UV offset
- Nebula: 100% procedural fBm domain-warp GLSL, no texture files
- Stars: InstancedMesh sprites, Gaussian glow, per-star HSL uniforms
- Post-processing: EffectComposer with UnrealBloomPass (strength 0.8) + custom chroma/vignette pass
- Performance: clamp DPR to 1.5, auto-tier detection, pause on tab hide

## Performance Targets
- 60fps on Intel Iris-class GPU
- Under 15 draw calls for orb scene
- Under 1MB texture memory (mostly procedural)
- fBm at 6 octaves, fall back to 4 if >20ms frame time
