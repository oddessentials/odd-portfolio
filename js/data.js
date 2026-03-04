// js/data.js — Project data and constellation zone definitions
// T003: Star positions updated to viewport-distributed coordinates

export const PROJECTS = [
  {
    id: 'odd-ai-reviewers',
    name: 'odd-ai-reviewers',
    tagline: 'Extensible AI code review pipeline with multi-agent analysis',
    category: 'ai-devops',
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
    tagline: 'Extract Azure DevOps PR metrics to SQLite with PowerBI-compatible dashboards',
    category: 'data-devops',
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
    tagline: 'Authoritative JSON specification for repository quality standards across multiple stacks',
    category: 'tooling',
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
    tagline: 'Docker-first, provider-pluggable self-hosted CI runtime at zero cloud cost',
    category: 'infrastructure',
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
    tagline: 'White-label interactive office locator with multi-provider rendering and region navigation',
    category: 'frontend',
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
    tagline: 'Financial intelligence dashboard with real-time market data and congressional trade monitoring',
    category: 'fintech',
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
    tagline: 'A 100+ year old family-owned restaurant with an interactive AI-powered chat agent',
    category: 'web',
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
    name: 'Arcane Tools',
    scrollStart: 0.25,
    scrollEnd: 0.50,
    projectIds: ['odd-ai-reviewers', 'repo-standards', 'odd-self-hosted-ci'],
    nebulaHue: 'blue-violet',
    statusText: 'scanning arcane tools constellation...'
  },
  {
    name: 'Intelligence Matrix',
    scrollStart: 0.50,
    scrollEnd: 0.75,
    projectIds: ['ado-git-repo-insights', 'odd-fintech'],
    nebulaHue: 'warm-gold',
    statusText: 'interfacing with intelligence matrix...'
  },
  {
    name: 'Outpost Network',
    scrollStart: 0.75,
    scrollEnd: 0.90,
    projectIds: ['odd-map', 'coney-island'],
    nebulaHue: 'green-teal',
    statusText: 'triangulating outpost network...'
  }
];
