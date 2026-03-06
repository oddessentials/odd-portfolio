// js/panel.js — Project panel overlay management (extracted from interactions.js)

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let triggerElement = null;
let overlayEl = null;
let closeBtn = null;
let backdropEl = null;
let focusableEls = [];

/** Callback invoked before the panel opens (e.g. close hamburger nav) */
let _beforeOpen = null;

// Category SVG icons for terminal-style placeholders
const CATEGORY_ICONS = {
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

// Shared helper: render cluster member list
function renderClusterMemberList(members, accentColor) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cluster-member-list';
  members.forEach(member => {
    const item = document.createElement('div');
    item.className = 'cluster-member';
    const nameEl = document.createElement('h3');
    nameEl.className = 'cluster-member__name';
    nameEl.textContent = member.name;
    if (accentColor) nameEl.style.color = accentColor;
    item.appendChild(nameEl);
    const descEl = document.createElement('p');
    descEl.className = 'cluster-member__desc';
    descEl.textContent = member.description;
    item.appendChild(descEl);
    if (member.status === 'in-progress') {
      const badge = document.createElement('span');
      badge.className = 'status-badge status-badge--in-progress';
      badge.textContent = 'In Progress';
      item.appendChild(badge);
    }
    if (member.url) {
      const link = document.createElement('a');
      link.href = member.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'GitHub';
      link.className = 'cluster-member__link';
      item.appendChild(link);
    }
    wrapper.appendChild(item);
  });
  return wrapper;
}

// ---------------------------------------------------------------------------
// Extract YouTube video ID from URL
// ---------------------------------------------------------------------------
function extractYouTubeId(url) {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  const longMatch = url.match(/[?&]v=([^?&]+)/);
  if (longMatch) return longMatch[1];
  return null;
}

// ---------------------------------------------------------------------------
// Simple HTML escaping
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// showProjectPanel — populate and open the overlay
// ---------------------------------------------------------------------------
function showProjectPanel(project, trigger) {
  if (!overlayEl) return;

  triggerElement = trigger || null;

  // Invoke beforeOpen callback (e.g. close hamburger nav)
  if (typeof _beforeOpen === 'function') _beforeOpen();

  // Populate title and tagline
  const titleEl = overlayEl.querySelector('.overlay__title');
  const taglineEl = overlayEl.querySelector('.overlay__tagline');
  titleEl.textContent = project.name;
  taglineEl.textContent = project.tagline;

  // In-progress status badge
  const descZone = overlayEl.querySelector('.overlay__description-zone');
  descZone.innerHTML = '';
  if (project.status === 'in-progress') {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-badge--in-progress';
    badge.textContent = 'In Progress';
    descZone.appendChild(badge);
  }

  // Cluster panel: list view, no media
  if (project.isCluster && project.clusterMembers && project.clusterMembers.length > 0) {
    const logoZone = overlayEl.querySelector('.overlay__logo-zone');
    logoZone.innerHTML = '';
    const mediaZone = overlayEl.querySelector('.overlay__media-zone');
    mediaZone.innerHTML = '';
    mediaZone.appendChild(renderClusterMemberList(project.clusterMembers, project.accentColor));

    // Links footer
    const linksFooter = overlayEl.querySelector('.overlay__links');
    linksFooter.innerHTML = '';
    project.links.slice(0, 5).forEach((link) => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.label;
      if (!link.primary) a.className = 'secondary';
      linksFooter.appendChild(a);
    });

    overlayEl.setAttribute('aria-label', project.name + ' project details');
    overlayEl.removeAttribute('hidden');
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(st => st.disable());
    }
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('panel-open', { detail: { project } }));
    requestAnimationFrame(() => {
      closeBtn.focus();
      updateFocusableElements();
    });
    return;
  }

  // Logo zone
  const logoZone = overlayEl.querySelector('.overlay__logo-zone');
  logoZone.innerHTML = '';
  if (project.logoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = project.logoUrl;
    logoImg.alt = project.name + ' logo';
    logoZone.appendChild(logoImg);
  }

  // Media zone
  const mediaZone = overlayEl.querySelector('.overlay__media-zone');
  mediaZone.innerHTML = '';

  switch (project.mediaType) {
    case 'youtube': {
      const videoId = extractYouTubeId(project.mediaUrl);
      if (videoId) {
        const thumbWrap = document.createElement('a');
        thumbWrap.href = project.mediaUrl;
        thumbWrap.target = '_blank';
        thumbWrap.rel = 'noopener noreferrer';
        thumbWrap.className = 'youtube-thumb';
        thumbWrap.setAttribute('aria-label', 'Watch ' + project.name + ' video on YouTube');
        thumbWrap.style.cssText = 'display:block;position:relative;cursor:pointer;';

        const thumbImg = document.createElement('img');
        thumbImg.src = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
        thumbImg.alt = project.name + ' video thumbnail';
        thumbImg.style.cssText = 'width:100%;border-radius:4px;border:1px solid rgba(139,105,20,0.2);';
        thumbImg.onerror = function() {
          this.src = 'https://img.youtube.com/vi/' + videoId + '/default.jpg';
        };
        thumbWrap.appendChild(thumbImg);

        const playBtn = document.createElement('span');
        playBtn.setAttribute('aria-hidden', 'true');
        playBtn.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;background:rgba(0,0,0,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;';
        playBtn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><polygon points="8,5 19,12 8,19"/></svg>';
        thumbWrap.appendChild(playBtn);

        mediaZone.appendChild(thumbWrap);
      }
      break;
    }
    case 'video': {
      const video = document.createElement('video');
      video.controls = true;
      video.preload = 'none';
      video.setAttribute('aria-label', project.name + ' demo video');

      if (project.mediaUrl) {
        const mp4 = document.createElement('source');
        mp4.src = project.mediaUrl;
        mp4.type = 'video/mp4';
        video.appendChild(mp4);

        const webmSrc = project.mediaUrl.replace(/\.mp4$/, '.webm');
        const webm = document.createElement('source');
        webm.src = webmSrc;
        webm.type = 'video/webm';
        video.appendChild(webm);
      }

      mediaZone.appendChild(video);
      break;
    }
    case 'screenshots': {
      if (project.screenshots && project.screenshots.length > 0) {
        const gallery = document.createElement('div');
        gallery.className = 'screenshot-gallery';
        project.screenshots.forEach((src, i) => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = project.name + ' screenshot ' + (i + 1);
          gallery.appendChild(img);
        });
        mediaZone.appendChild(gallery);
      }
      break;
    }
    case 'image': {
      if (project.mediaUrl) {
        const img = document.createElement('img');
        img.src = project.mediaUrl;
        img.alt = project.name;
        img.style.cssText = 'width:100%;border-radius:4px;border:1px solid rgba(139,105,20,0.2);';
        mediaZone.appendChild(img);
      }
      break;
    }
    default: {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'padding:32px;text-align:center;background:rgba(28,31,36,0.6);border:1px solid rgba(139,105,20,0.2);border-radius:4px;';
      const icon = CATEGORY_ICONS[project.category] || CATEGORY_ICONS['web'];
      placeholder.innerHTML =
        '<div style="color:var(--color-text-secondary);margin-bottom:12px;" aria-hidden="true">' + icon + '</div>' +
        '<p style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--color-text-mono);opacity:0.7;">' +
        escapeHtml(project.tagline) + '</p>';
      mediaZone.appendChild(placeholder);
      break;
    }
  }

  // Related Repositories section (for non-cluster stars with clusterMembers, e.g. Coney Island)
  if (!project.isCluster && project.clusterMembers && project.clusterMembers.length > 0) {
    const repoSection = document.createElement('div');
    repoSection.className = 'related-repos';
    const repoHeading = document.createElement('h3');
    repoHeading.textContent = 'Related Repositories';
    repoHeading.style.cssText = 'font-family:var(--font-mono);font-size:var(--text-sm);color:var(--color-text-secondary);margin:16px 0 8px;';
    repoSection.appendChild(repoHeading);
    repoSection.appendChild(renderClusterMemberList(project.clusterMembers, project.accentColor));
    mediaZone.appendChild(repoSection);
  }

  // Links footer
  const linksFooter = overlayEl.querySelector('.overlay__links');
  linksFooter.innerHTML = '';
  const linksToShow = project.links.slice(0, 5);
  linksToShow.forEach((link) => {
    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.label;
    if (!link.primary) {
      a.className = 'secondary';
    }
    linksFooter.appendChild(a);
  });

  overlayEl.setAttribute('aria-label', project.name + ' project details');
  overlayEl.removeAttribute('hidden');

  if (window.ScrollTrigger) {
    window.ScrollTrigger.getAll().forEach(st => st.disable());
  }
  document.body.style.overflow = 'hidden';

  document.dispatchEvent(new CustomEvent('panel-open', { detail: { project } }));

  requestAnimationFrame(() => {
    closeBtn.focus();
    updateFocusableElements();
  });
}

// ---------------------------------------------------------------------------
// closeProjectPanel
// ---------------------------------------------------------------------------
function closeProjectPanel() {
  if (!overlayEl || overlayEl.hasAttribute('hidden')) return;

  const videos = overlayEl.querySelectorAll('video');
  videos.forEach(v => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  const mediaZone = overlayEl.querySelector('.overlay__media-zone');
  mediaZone.innerHTML = '';

  overlayEl.setAttribute('hidden', '');

  if (window.ScrollTrigger) {
    window.ScrollTrigger.getAll().forEach(st => st.enable());
  }
  document.body.style.overflow = '';

  document.dispatchEvent(new CustomEvent('panel-close'));

  if (triggerElement && typeof triggerElement.focus === 'function') {
    triggerElement.focus();
  }
  triggerElement = null;
}

// ---------------------------------------------------------------------------
// Focus trap helpers
// ---------------------------------------------------------------------------
function updateFocusableElements() {
  if (!overlayEl) return;
  focusableEls = Array.from(
    overlayEl.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"]), video[controls]'
    )
  ).filter(el => !el.disabled && el.offsetParent !== null);
}

function handleFocusTrap(e) {
  if (overlayEl.hasAttribute('hidden')) return;
  if (e.key !== 'Tab') return;

  updateFocusableElements();
  if (focusableEls.length === 0) return;

  const first = focusableEls[0];
  const last = focusableEls[focusableEls.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// ---------------------------------------------------------------------------
// init — acquire DOM refs, wire close/backdrop listeners
// ---------------------------------------------------------------------------
function initPanel({ beforeOpen } = {}) {
  overlayEl = document.getElementById('project-overlay');
  if (!overlayEl) return;

  closeBtn = overlayEl.querySelector('.overlay__close');
  backdropEl = overlayEl.querySelector('.overlay__backdrop');
  _beforeOpen = beforeOpen || null;

  // Close button click
  closeBtn.addEventListener('click', closeProjectPanel);

  // Backdrop click
  backdropEl.addEventListener('click', closeProjectPanel);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export {
  initPanel as init,
  showProjectPanel,
  closeProjectPanel,
  handleFocusTrap
};
