// js/data.js — Project data and constellation zone definitions
// T003: Star positions updated to viewport-distributed coordinates
// T015: Added glyph fields (glyphName, glyphRotation, glyphType, glyphAtlasIndex)

// ---------------------------------------------------------------------------
// Glyph atlas UV cells — 512x256 atlas, 4x2 grid, 128x128 square cells
// Guard padding: 4px per edge (horiz: 4/512=0.0078125, vert: 4/256=0.015625)
// ---------------------------------------------------------------------------
export const GLYPH_ATLAS_CELLS = [
  { index: 0, name: 'architect', gridCol: 0, gridRow: 0, uvMin: [0.0078125, 0.015625],  uvMax: [0.2421875, 0.484375]  },
  { index: 1, name: 'guardian',  gridCol: 1, gridRow: 0, uvMin: [0.2578125, 0.015625],  uvMax: [0.4921875, 0.484375]  },
  { index: 2, name: 'sovereign', gridCol: 2, gridRow: 0, uvMin: [0.5078125, 0.015625],  uvMax: [0.7421875, 0.484375]  },
  { index: 3, name: 'voyager',   gridCol: 3, gridRow: 0, uvMin: [0.7578125, 0.015625],  uvMax: [0.9921875, 0.484375]  },
  { index: 4, name: 'origin',    gridCol: 0, gridRow: 1, uvMin: [0.0078125, 0.515625],  uvMax: [0.2421875, 0.984375]  },
  { index: 5, name: 'orbit',     gridCol: 1, gridRow: 1, uvMin: [0.2578125, 0.515625],  uvMax: [0.4921875, 0.984375]  },
  { index: 6, name: 'axis',      gridCol: 2, gridRow: 1, uvMin: [0.5078125, 0.515625],  uvMax: [0.7421875, 0.984375]  },
  { index: 7, name: 'spiral',    gridCol: 3, gridRow: 1, uvMin: [0.7578125, 0.515625],  uvMax: [0.9921875, 0.984375]  }
];

export const PROJECTS = [
  {
    id: 'odd-ai-reviewers',
    name: 'odd-ai-reviewers',
    shortDesc: 'AI code review pipeline',
    tagline: 'Extensible AI code review pipeline with multi-agent analysis',
    category: 'ai-devops',
    glyphName: 'guardian', glyphRotation: 90, glyphType: 'full', glyphAtlasIndex: 1,
    constellation: 'The Forge Septet',
    accentColor: '#FF6B35',
    starSize: 1.4,
    position: [1.8, 1.0, -0.5],
    logoUrl: 'assets/odd-ai-reviewers-banner.png',
    mediaType: 'youtube',
    mediaUrl: 'https://youtu.be/rkDQ7ZA47XQ',
    screenshots: null,
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-ai-reviewers', primary: true },
      { label: 'npm', url: 'https://www.npmjs.com/package/@oddessentials/odd-ai-reviewers', primary: false },
      { label: 'Video', url: 'https://youtu.be/rkDQ7ZA47XQ', primary: false }
    ]
  },
  {
    id: 'ado-git-repo-insights',
    name: 'ado-git-repo-insights',
    shortDesc: 'Azure DevOps PR metrics',
    tagline: 'Extract Azure DevOps PR metrics to SQLite with PowerBI-compatible dashboards',
    category: 'data-devops',
    glyphName: 'voyager', glyphRotation: 180, glyphType: 'full', glyphAtlasIndex: 3,
    constellation: "The Scribe's Lens",
    accentColor: '#00C9D4',
    starSize: 1.15,
    position: [-2.0, 0.5, 0.3],
    logoUrl: 'assets/ado-git-repo-insights-logo.png',
    mediaType: 'screenshots',
    mediaUrl: null,
    screenshots: [
      'assets/ado-git-repo-insights-screenshot-01.png',
      'assets/ado-git-repo-insights-screenshot-02.png',
      'assets/ado-git-repo-insights-screenshot-03.png'
    ],
    links: [
      { label: 'Marketplace', url: 'https://marketplace.visualstudio.com/items?itemName=OddEssentials.ado-git-repo-insights', primary: true },
      { label: 'GitHub', url: 'https://github.com/oddessentials/ado-git-repo-insights', primary: true },
      { label: 'Demo', url: 'https://oddessentials.github.io/ado-git-repo-insights/', primary: false },
      { label: 'PyPI', url: 'https://pypi.org/project/ado-git-repo-insights/', primary: false }
    ]
  },
  {
    id: 'repo-standards',
    name: 'repo-standards',
    shortDesc: 'Repo quality standards',
    tagline: 'Authoritative JSON specification for repository quality standards across multiple stacks',
    category: 'tooling',
    glyphName: 'axis', glyphRotation: 0, glyphType: 'derived', glyphAtlasIndex: 6,
    constellation: 'The Iron Codex',
    accentColor: '#F5C518',
    starSize: 1.0,
    position: [2.2, -0.4, 0.2],
    logoUrl: null,
    mediaType: null,
    mediaUrl: null,
    screenshots: null,
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/repo-standards', primary: true },
      { label: 'npm', url: 'https://www.npmjs.com/package/@oddessentials/repo-standards', primary: false }
    ]
  },
  {
    id: 'odd-self-hosted-ci',
    name: 'odd-self-hosted-ci',
    shortDesc: 'Self-hosted CI runtime',
    tagline: 'Docker-first, provider-pluggable self-hosted CI runtime at zero cloud cost',
    category: 'infrastructure',
    glyphName: 'orbit', glyphRotation: 0, glyphType: 'derived', glyphAtlasIndex: 5,
    constellation: 'The Engine Core',
    accentColor: '#4ADE80',
    starSize: 1.0,
    position: [-0.8, -1.2, -0.6],
    logoUrl: null,
    mediaType: null,
    mediaUrl: null,
    screenshots: null,
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-self-hosted-ci-runtime', primary: true },
      { label: 'Docker Hub', url: 'https://hub.docker.com/r/oddessentials/oscr-github', primary: false },
      { label: 'ADO Runner', url: 'https://hub.docker.com/r/oddessentials/oscr-azure-devops', primary: false }
    ]
  },
  {
    id: 'odd-map',
    name: 'odd-map',
    shortDesc: 'Interactive office locator',
    tagline: 'White-label interactive office locator with multi-provider rendering and region navigation',
    category: 'frontend',
    glyphName: 'origin', glyphRotation: 0, glyphType: 'full', glyphAtlasIndex: 4,
    constellation: "The Navigator's Rose",
    accentColor: '#2DD4BF',
    starSize: 1.15,
    position: [0.3, 0.8, 0.5],
    logoUrl: null,
    mediaType: null,
    mediaUrl: null,
    screenshots: null,
    links: [
      { label: 'Live Demo', url: 'https://maps.oddessentials.com/', primary: true },
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-map', primary: true }
    ]
  },
  {
    id: 'odd-fintech',
    name: 'odd-fintech',
    shortDesc: 'Financial intelligence dashboard',
    tagline: 'Financial intelligence dashboard with real-time market data and congressional trade monitoring',
    category: 'fintech',
    glyphName: 'sovereign', glyphRotation: 270, glyphType: 'full', glyphAtlasIndex: 2,
    constellation: "The Alchemist's Eye",
    accentColor: '#A855F7',
    starSize: 1.4,
    position: [-2.2, -0.6, -0.3],
    logoUrl: 'assets/odd-fintech-logo.png',
    mediaType: 'video',
    mediaUrl: 'assets/odd-fintech-video.mp4',
    screenshots: null,
    links: [
      { label: 'GitHub', url: 'https://github.com/oddessentials/odd-fintech', primary: true }
    ]
  },
  {
    id: 'coney-island',
    name: 'Coney Island Pottsville',
    shortDesc: 'Restaurant with AI chat',
    tagline: 'A 100+ year old family-owned restaurant with an interactive AI-powered chat agent',
    category: 'web',
    glyphName: 'architect', glyphRotation: 135, glyphType: 'full', glyphAtlasIndex: 0,
    constellation: 'The Hearth Star',
    accentColor: '#FB7185',
    starSize: 1.0,
    position: [1.0, -1.0, 0.4],
    logoUrl: 'assets/coney-island-logo-1024x690.svg',
    mediaType: 'image',
    mediaUrl: 'assets/coney-island-restaurant-and-tavern.jpg',
    screenshots: null,
    links: [
      { label: 'Website', url: 'https://coneyislandpottsville.com/', primary: true },
      { label: 'AI Chat', url: 'https://chat.coneyislandpottsville.com/', primary: true },
      { label: 'Facebook', url: 'https://facebook.com/coneyislandpottsville', primary: false }
    ]
  }
];

export const CONSTELLATION_ZONES = [
  {
    name: 'DevOps Pipeline',
    scrollStart: 0.0,
    scrollEnd: 0.33,
    projectIds: ['repo-standards', 'odd-self-hosted-ci', 'odd-ai-reviewers', 'ado-git-repo-insights'],
    nebulaHue: 'blue-violet',
    nebulaHueRgb: [0.42, 0.25, 0.63],
    statusText: 'Tracing the DevOps pipeline...'
  },
  {
    name: 'Products & Analytics',
    scrollStart: 0.33,
    scrollEnd: 0.66,
    projectIds: ['odd-ai-reviewers', 'odd-fintech', 'odd-map'],
    nebulaHue: 'warm-gold',
    nebulaHueRgb: [0.72, 0.53, 0.04],
    statusText: 'Viewing products & analytics...'
  },
  {
    name: 'Community & Web',
    scrollStart: 0.66,
    scrollEnd: 1.0,
    projectIds: ['repo-standards', 'coney-island', 'odd-self-hosted-ci'],
    nebulaHue: 'green-teal',
    nebulaHueRgb: [0.10, 0.62, 0.56],
    statusText: 'Exploring community & web...'
  }
];
