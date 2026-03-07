/**
 * data-content.js — Authored project content for panel display.
 * Keyed by repoKey. Each entry: synopsis, capabilities, techStack, aiModels.
 */

export const PROJECT_CONTENT = {
  'odd-ai-reviewers': {
    synopsis: 'Extensible AI code review pipeline for pull requests supporting GitHub and Azure DevOps. Runs multi-pass analysis: static analysis first (Semgrep, Reviewdog) then AI semantic review via pluggable agents. Supports four AI providers with per-PR and monthly cost controls, fork-PR security blocking, and configurable gating.',
    capabilities: [
      'Multi-pass review pipeline: static analysis then AI semantic review',
      'Pluggable agent architecture: Semgrep, Reviewdog, OpenCode, PR-Agent, local LLMs',
      'Four AI provider support: OpenAI, Anthropic, Azure OpenAI, Ollama',
      'Per-PR and monthly budget limits with automatic enforcement',
      'Published on npm as @oddessentials/odd-ai-reviewers',
    ],
    techStack: ['TypeScript', 'Node.js', 'Semgrep', 'Reviewdog'],
    aiModels: ['OpenAI GPT-4o', 'OpenAI GPT-4o-mini', 'Anthropic Claude Sonnet', 'Anthropic Claude Opus', 'Azure OpenAI', 'Ollama CodeLlama:7b'],
  },
  'ado-git-repo-insights': {
    synopsis: 'Dual-stack (Python + TypeScript) tool that extracts Azure DevOps Pull Request metrics into SQLite and generates PowerBI-compatible CSV dashboards. Ships as both a PyPI package and a VS Code Marketplace extension with an interactive web dashboard for PR analytics visualization.',
    capabilities: [
      'Python CLI extracts PR data from Azure DevOps REST API into SQLite',
      'TypeScript VS Code extension for in-editor dashboard access',
      'Interactive web dashboard with PowerBI-compatible CSV export',
      'Published on PyPI and VS Marketplace',
    ],
    techStack: ['Python', 'TypeScript', 'SQLite', 'PowerBI'],
    aiModels: null,
  },
  'ado-git-repo-seeder': {
    synopsis: 'Node.js tool that seeds realistic, multi-user Pull Request activity in Azure DevOps for testing and demo purposes. Supports configurable user simulation, multiple seeding strategies (isolated, direct, accumulation), and idempotent multi-run patterns.',
    capabilities: [
      'Multi-user PR activity simulation with identity resolution',
      'Five example configurations from solo dev to enterprise scale',
      'Idempotent accumulation patterns for multi-day simulation',
      'Security-focused: explicit "DO NOTs" for identity handling',
    ],
    techStack: ['JavaScript', 'Node.js'],
    aiModels: null,
  },
  'repo-standards': {
    synopsis: 'Single, authoritative JSON specification for repository quality standards across TypeScript/JS, C#/.NET, Python, Rust, and Go. Provides deterministic tooling for CI checklists and repo quality auditing. Published on npm.',
    capabilities: [
      'Multi-stack quality standards (5 language ecosystems)',
      'JSON specification schema with deterministic validation',
      'CI checklist generation tooling',
      'Published on npm as @oddessentials/repo-standards',
    ],
    techStack: ['TypeScript', 'Node.js'],
    aiModels: null,
  },
  'odd-self-hosted-ci-runtime': {
    synopsis: 'Docker-first, provider-pluggable self-hosted CI runtime that runs CI pipelines at zero cloud cost on your own hardware. Ships pre-built Docker images for both GitHub Actions runners and Azure DevOps agents.',
    capabilities: [
      'Dual-provider Docker images: GitHub Actions + Azure DevOps',
      'Zero cloud cost CI execution on local hardware',
      'Published on Docker Hub (oscr-github, oscr-azure-devops)',
      'Automated smoke tests and semantic releases',
    ],
    techStack: ['Docker'],
    aiModels: null,
  },
  'odd-map': {
    synopsis: 'White-label, mobile-friendly interactive office locator with three rendering modes (2D SVG, 3D Three.js globe, tile map via MapLibre/Apple MapKit/Google Maps). Fully static with no backend, multi-client theming via JSON configuration, and runtime lat/lon projection with d3-geo.',
    capabilities: [
      'Three map rendering modes: 2D SVG, 3D globe, tile map',
      'Multi-provider maps: MapLibre GL, Apple MapKit, Google Maps with free fallback',
      'White-label multi-client theming via JSON config',
      'Runtime lat/lon projection (d3-geo), no pre-computed coordinates',
      'Mobile-first: pinch-to-zoom, swipe-to-dismiss, safe area insets',
      'Fully static deployment',
    ],
    techStack: ['JavaScript', 'Three.js', 'MapLibre', 'CSS', 'HTML'],
    aiModels: null,
  },
  'odd-fintech': {
    synopsis: 'Full-stack financial intelligence dashboard with magic-link authentication, real-time market data, stock analysis, precious metals tracking, congressional trade monitoring, and celestial intelligence features. Built with TypeScript (Vite + Express), containerized with Docker.',
    capabilities: [
      'Magic-link passwordless authentication with session management',
      'Real-time market data via multiple providers (Finnhub, Yahoo, SEC EDGAR, Wikidata)',
      'Congressional trade monitoring and precious metals tracking',
      'Docker Compose deployment with production environment support',
    ],
    techStack: ['TypeScript', 'Vite', 'Express', 'Docker'],
    aiModels: null,
  },
  'socialmedia-syndicator': {
    synopsis: 'Mobile-first PWA for controlled, auditable social media publishing workflows with admin approval. Full-stack TypeScript (Vite client + Express server) with PostgreSQL, Redis/BullMQ for background jobs, and Prisma ORM. Invite-only with role-based access.',
    capabilities: [
      'Admin-approved publishing workflow with audit trail',
      'Mobile-first PWA with offline capability',
      'Background job processing via BullMQ (emails, publishing)',
      'PostgreSQL + Prisma ORM with Redis queue',
      'Docker Compose development environment',
    ],
    techStack: ['TypeScript', 'Vite', 'Express', 'PostgreSQL', 'Redis', 'Prisma', 'BullMQ', 'Docker'],
    aiModels: null,
  },
  'oddessentials-splash': {
    synopsis: 'Immersive ASCII-driven splash experience for oddessentials.com built with Three.js, custom GLSL shaders, and high-resolution ASCII SVG textures. Production pipeline includes Vite, javascript-obfuscator with domain lock, SVGO, semantic-release, and Cloudflare Pages deployment.',
    capabilities: [
      'Custom GLSL shaders for ASCII blending, transitions, effects',
      'Three.js WebGL with postprocessing pipeline',
      'Domain-locked obfuscation for production',
      'Automated CI/CD: build, version, deploy to Cloudflare Pages',
      'Discord release notifications',
    ],
    techStack: ['JavaScript', 'Three.js', 'GLSL', 'Vite', 'Cloudflare Pages'],
    aiModels: null,
  },
  'odd-portfolio': {
    synopsis: 'The portfolio itself \u2014 a single-page WebGL experience showcasing all Odd Essentials projects as an interactive star constellation. Built with Three.js, GSAP, and vanilla ES modules with no build system. Features procedural nebula generation, scroll-driven exploration, and this very modal system being enhanced.',
    capabilities: [
      'Three.js WebGL constellation visualization with procedural nebula (fBm)',
      'GSAP-driven scroll exploration with 3 constellation zones',
      'MSDF shader sidebar glyphs, SVG reticle targeting',
      'Performance auto-tiering (desktop/tablet/mobile)',
    ],
    techStack: ['JavaScript', 'Three.js', 'GSAP', 'GLSL', 'HTML', 'CSS'],
    aiModels: null,
  },
  'oddessentials-platform': {
    synopsis: 'AI-powered chat assistant specializing in software engineering thought leadership. Features an academic persona (OddBot) with APA citation requirements, config-driven knowledge base, matrix-green terminal aesthetic, and text-to-speech via MeloTTS. Powered by OpenAI.',
    capabilities: [
      'OpenAI Chat Completions / Assistants + File API integration',
      'Academic persona with APA-formatted citations',
      'Config-driven extensible knowledge base',
      'MeloTTS text-to-speech integration',
      'Matrix-green retro terminal UI (React + Vite)',
      'PostgreSQL interaction logging',
    ],
    techStack: ['TypeScript', 'React', 'Vite', 'Express', 'PostgreSQL'],
    aiModels: ['OpenAI GPT-4o-mini'],
  },
  'odd-demonstration': {
    synopsis: 'Self-contained distributed systems demonstration platform \u2014 a polyglot microservices cluster (TypeScript, Go, Rust, Python) orchestrated via Kubernetes with a custom cross-platform TUI dashboard and web mirror. Includes gateway, task processor, metrics engine, read model, and PTY server.',
    capabilities: [
      'Polyglot microservices: TypeScript gateway, Go processor, Rust TUI, Python metrics',
      'Custom cross-platform TUI (Rust) with web mirror',
      'Kubernetes orchestration via Kind',
      'RabbitMQ message bus, Prometheus + Grafana observability',
      'Cross-platform releases (Windows, macOS Intel/ARM, Linux)',
    ],
    techStack: ['TypeScript', 'Go', 'Rust', 'Python', 'Kubernetes', 'RabbitMQ', 'Docker'],
    aiModels: null,
  },
  'coney-website': {
    synopsis: 'Restaurant website and events management platform for Coney Island Pottsville, a 100+ year old family-owned restaurant. Features a Node.js events publisher that reads from YAML source of truth and generates JSON/iCal feeds, optionally posting to Facebook and X/Twitter.',
    capabilities: [
      'Events publisher: YAML source of truth to JSON + iCal feeds',
      'Social media auto-posting (Facebook Page, X/Twitter) for events',
      'Python-generated alcohol menu from raw JSON',
      'Cloudflare Pages static hosting with proper caching headers',
      'JSON-LD structured data for SEO',
    ],
    techStack: ['JavaScript', 'Node.js', 'Python', 'Cloudflare Pages', 'HTML', 'CSS'],
    aiModels: null,
  },
  'yo-coney-bot': {
    synopsis: 'AI-powered chat assistant for Coney Island Pottsville restaurant. A PWA web app that answers guest questions about hours, menu, pricing, events, parking, and local history \u2014 all grounded in canonical machine-readable JSON data published by the restaurant website.',
    capabilities: [
      'OpenAI Chat Completions / Assistants + File API integration',
      'Strict grounding in official JSON/HTML data sources (no hallucination)',
      'Configurable persona system (default, coneyLocal)',
      'PWA installable via vite-plugin-pwa',
      'Single Docker container serves React frontend + Express API',
    ],
    techStack: ['TypeScript', 'React', 'Vite', 'Express', 'Docker'],
    aiModels: ['OpenAI GPT-4o-mini'],
  },
  'yo-coney-mobile': {
    synopsis: 'Mobile chat companion app for Coney Island Pottsville — an Expo/React Native frontend that connects to the yo-coney-bot API. Features voice input, suggest chips, and chat history with the restaurant AI assistant.',
    capabilities: [
      'Expo/React Native mobile chat client',
      'Voice input with speech recognition',
      'Persistent chat history storage',
      'Suggest chips for common guest questions',
    ],
    techStack: ['TypeScript', 'React Native', 'Expo'],
    aiModels: null,
  },
  'coney-island': {
    synopsis: 'A 100+ year old family-owned and operated restaurant in Pottsville, PA with a full digital ecosystem: a static website with events publishing and social media syndication, an AI-powered chat assistant grounded in official restaurant data, and a mobile chat companion app.',
    capabilities: [
      'Static website with events publisher (YAML to JSON + iCal feeds)',
      'AI chat assistant grounded in canonical restaurant data (OpenAI)',
      'Social media auto-posting for events (Facebook, X/Twitter)',
      'Mobile chat companion app (Expo/React Native)',
    ],
    techStack: ['JavaScript', 'Node.js', 'TypeScript', 'React', 'Vite', 'Express'],
    aiModels: ['OpenAI GPT-4o-mini'],
  },
};
