// js/panel-content.js — Builder functions for enhanced modal content
import { PROJECT_CONTENT } from './data-content.js';

/* ── helpers ─────────────────────────────────────────────────── */

function lookupContent(project) {
  return PROJECT_CONTENT[project.repoKey] || PROJECT_CONTENT[project.id] || null;
}

function el(tag, cls) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
}

/* ── 1. metrics staleness ────────────────────────────────────── */

export function getMetricsStaleness(data) {
  if (!data || !data.generated_at) return 'suppress';
  const daysSince = (Date.now() - Date.parse(data.generated_at)) / 86400000;
  if (daysSince > 30) return 'suppress';
  if (daysSince > 7) return 'stale';
  return 'fresh';
}

/* ── 2. badges ───────────────────────────────────────────────── */

export function buildBadges(project) {
  if (!project.category && !project.constellation) return null;
  const wrap = el('div', 'overlay__badges');
  if (project.category) {
    const badge = el('span', 'overlay__badge');
    badge.textContent = project.category;
    wrap.appendChild(badge);
  }
  if (project.constellation) {
    const badge = el('span', 'overlay__badge');
    badge.textContent = project.constellation;
    wrap.appendChild(badge);
  }
  return wrap;
}

/* ── 3. synopsis ─────────────────────────────────────────────── */

export function buildSynopsis(project, isMobile) {
  const content = lookupContent(project);
  if (!content || !content.synopsis) return null;

  const wrapper = el('div', 'overlay__synopsis-wrapper');
  const p = el('p', 'overlay__synopsis');
  p.textContent = content.synopsis;

  if (isMobile) {
    p.classList.add('overlay__synopsis--clamped');
    const btn = el('button', 'overlay__synopsis-toggle');
    btn.textContent = 'read more';
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const isClamped = p.classList.toggle('overlay__synopsis--clamped');
      btn.textContent = isClamped ? 'read more' : 'read less';
      btn.setAttribute('aria-expanded', String(!isClamped));
    });
    wrapper.appendChild(p);
    wrapper.appendChild(btn);
  } else {
    wrapper.appendChild(p);
  }
  return wrapper;
}

/* ── 4. capabilities ─────────────────────────────────────────── */

export function buildCapabilities(project) {
  const content = lookupContent(project);
  if (!content || !content.capabilities || !content.capabilities.length) return null;

  const ul = el('ul', 'overlay__capabilities');
  for (const cap of content.capabilities) {
    const li = el('li');
    li.textContent = cap;
    ul.appendChild(li);
  }
  return ul;
}

/* ── 5. tech stack ───────────────────────────────────────────── */

export function buildTechStack(project) {
  const content = lookupContent(project);
  if (!content || !content.techStack || !content.techStack.length) return null;

  const wrap = el('div', 'overlay__tech-stack');
  wrap.setAttribute('role', 'list');
  wrap.setAttribute('aria-label', 'Technology stack');
  for (const tech of content.techStack) {
    const tag = el('span', 'overlay__tech-tag');
    tag.setAttribute('role', 'listitem');
    tag.textContent = tech;
    wrap.appendChild(tag);
  }
  return wrap;
}

/* ── 6. metrics bar ──────────────────────────────────────────── */

const METRIC_DEFS = [
  ['Commits',       'icon-commit', 'commit_count'],
  ['Pull requests', 'icon-pr',     'pr_count'],
  ['Releases',      'icon-tag',    'release_count'],
  ['Contributors',  'icon-users',  'contributor_count'],
  ['Lifetime',      'icon-clock',  'repo_lifetime_days'],
  ['Lines of code', 'icon-code',   'loc_estimate'],
  ['Tests',         'icon-test',   'test_file_count'],
];

function formatMetricValue(key, val) {
  if (val == null) return '\u2014';
  if (key === 'repo_lifetime_days') return val + 'd';
  if (key === 'loc_estimate') {
    return val >= 1000 ? (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(val);
  }
  return String(val);
}

export function buildMetricsBar(metrics, staleness, generatedAt) {
  if (!metrics || staleness === 'suppress') return null;

  const dl = el('dl', 'overlay__metrics');

  for (const [label, icon, key] of METRIC_DEFS) {
    const val = metrics[key];
    if (key === 'test_file_count' && !val) continue;
    const div = el('div', 'overlay__metric');
    const dt = el('dt', 'sr-only');
    dt.textContent = label;
    const dd = el('dd');
    dd.innerHTML = '<svg class="overlay__metric-icon" aria-hidden="true" focusable="false">'
      + '<use href="#' + icon + '"/></svg>';
    dd.appendChild(document.createTextNode(formatMetricValue(key, val)));
    div.appendChild(dt);
    div.appendChild(dd);
    dl.appendChild(div);
  }

  if (staleness === 'stale' && generatedAt) {
    const note = el('dd', 'overlay__metrics-stale');
    const formatted = new Date(generatedAt)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    note.textContent = 'Metrics from ' + formatted;
    dl.appendChild(note);
  }

  return dl;
}

/* ── 7. AI models ────────────────────────────────────────────── */

export function buildAiModels(project) {
  const content = lookupContent(project);
  if (!content || !content.aiModels) return null;

  const wrap = el('div', 'overlay__ai-models');
  const label = el('span', 'overlay__ai-label');
  label.textContent = 'AI: ';
  wrap.appendChild(label);
  wrap.appendChild(document.createTextNode(content.aiModels.join(', ')));
  return wrap;
}

/* ── 8. category icons (moved from panel.js) ─────────────────── */

export const CATEGORY_ICONS = {
  'ai-devops': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="18" r="8"/><path d="M12 40c0-6.627 5.373-12 12-12s12 5.373 12 12"/><circle cx="36" cy="12" r="4"/><line x1="36" y1="16" x2="36" y2="22"/></svg>',
  'data-devops': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="6" width="32" height="10" rx="2"/><rect x="8" y="20" width="32" height="10" rx="2"/><rect x="8" y="34" width="32" height="10" rx="2"/><circle cx="14" cy="11" r="2" fill="currentColor"/><circle cx="14" cy="25" r="2" fill="currentColor"/><circle cx="14" cy="39" r="2" fill="currentColor"/></svg>',
  'devops': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="16"/><path d="M24 8v32M8 24h32"/><circle cx="24" cy="24" r="6" fill="currentColor"/></svg>',
  'tooling': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 8l28 0M10 16l28 0M10 24l20 0M10 32l14 0M10 40l8 0"/><path d="M36 28l4-4 4 4-4 4z"/></svg>',
  'infrastructure': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="6" width="20" height="14" rx="2"/><rect x="14" y="28" width="20" height="14" rx="2"/><line x1="24" y1="20" x2="24" y2="28"/><circle cx="20" cy="12" r="2" fill="currentColor"/><circle cx="28" cy="12" r="2" fill="currentColor"/></svg>',
  'frontend': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="40" height="28" rx="3"/><line x1="4" y1="16" x2="44" y2="16"/><circle cx="10" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><polyline points="14,26 20,30 14,34"/><line x1="24" y1="34" x2="34" y2="34"/></svg>',
  'fintech': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,36 12,24 20,30 28,14 36,22 44,10"/><line x1="4" y1="42" x2="44" y2="42"/><line x1="4" y1="6" x2="4" y2="42"/></svg>',
  'application': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="36" height="36" rx="4"/><line x1="6" y1="14" x2="42" y2="14"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/><circle cx="18" cy="10" r="1.5" fill="currentColor"/><rect x="12" y="20" width="24" height="16" rx="2"/></svg>',
  'experiments': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6v14l-10 18a4 4 0 003.5 6h25a4 4 0 003.5-6L30 20V6"/><line x1="16" y1="6" x2="32" y2="6"/><circle cx="22" cy="32" r="2" fill="currentColor"/><circle cx="28" cy="28" r="1.5" fill="currentColor"/></svg>',
  'reference': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="4" width="28" height="40" rx="2"/><line x1="14" y1="12" x2="30" y2="12"/><line x1="14" y1="20" x2="30" y2="20"/><line x1="14" y1="28" x2="24" y2="28"/></svg>',
  'web': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="18"/><ellipse cx="24" cy="24" rx="8" ry="18"/><line x1="6" y1="24" x2="42" y2="24"/><line x1="24" y1="6" x2="24" y2="42"/></svg>'
};

/* ── 9. panel helpers (moved from panel.js) ──────────────────── */

export function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/youtu\.be\/([^?&]+)/) || url.match(/[?&]v=([^?&]+)/);
  return m ? m[1] : null;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
