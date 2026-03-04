# Quickstart: Arcane Console POC

## Prerequisites

- A modern web browser (Chrome 90+, Firefox 90+, or Safari 15+)
- A local HTTP server (required for ES module imports and asset loading)
- No npm, no build tools, no backend required

## Run Locally

### Option 1: Python (if available)

```bash
cd /path/to/odd-portfolio
python -m http.server 8080
# Open http://localhost:8080 in your browser
```

### Option 2: Node.js (if available)

```bash
cd /path/to/odd-portfolio
npx serve .
# Open the URL shown in the terminal
```

### Option 3: VS Code Live Server

1. Open the `odd-portfolio` folder in VS Code
2. Install the "Live Server" extension (if not already installed)
3. Right-click `index.html` → "Open with Live Server"

### Option 4: Any static file server

Any HTTP server that can serve static files will work. The key requirement is that `index.html` is served over HTTP (not `file://`), because ES module imports via `<script type="importmap">` require an HTTP origin.

## File Structure

```
odd-portfolio/
├── index.html           # The entire POC (open this)
├── assets/              # Project media files
│   ├── odd-fintech-video.mp4
│   ├── odd-fintech-video.webm
│   ├── odd-ai-reviewers-trailer.webm
│   ├── odd-ai-reviewers-banner.png
│   ├── ado-git-repo-insights-logo.png
│   ├── ado-git-repo-insights-screenshot-*.png
│   ├── odd-fintech-logo.png
│   ├── coney-island-logo-1024x690.svg
│   ├── coney-island-restaurant-and-tavern.jpg
│   └── *-review-team-*.png
└── design-assets/       # Source files (not needed at runtime)
```

## What to Expect

1. **Page loads** → dark steampunk console appears
2. **Reveal sequence (~7s)** → frame assembles, gauges power up, command line types "reveal universe," crystal ball ignites, nebula blooms, stars appear
3. **Discoverability** → stars pulse with a scanning animation, CLI shows "7 anomalies detected"
4. **Interaction** → hover over stars for labels, click for project detail panels
5. **Scroll** → scroll down to explore constellation zones (orb rotates, nebula shifts)

## Verification Checklist

- [ ] Crystal ball renders with glass-like rim glow
- [ ] Nebula is visible with color regions inside the orb
- [ ] 7 star nodes are visible and hoverable
- [ ] Clicking a star opens a project detail panel
- [ ] Panel shows project name, tagline, asset, and link buttons
- [ ] Escape key closes the panel
- [ ] Left constellation nav lists all 7 projects
- [ ] Scrolling rotates the orb and shifts nebula colors
- [ ] Console shows no WebGL errors

## Troubleshooting

| Problem | Solution |
|---|---|
| Blank page | Ensure you're using an HTTP server, not `file://` protocol |
| Black canvas | Check browser console for WebGL errors. Try Chrome. |
| Low framerate | Normal on very old hardware. Auto-tier system will reduce effects after 5s. |
| No fonts loading | Google Fonts CDN must be reachable. Check network connectivity. |
| Videos don't play | Ensure `.mp4` and `.webm` files exist in `/assets`. |
