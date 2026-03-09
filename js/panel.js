// js/panel.js — Project panel overlay management (extracted from interactions.js)

import { CONSTELLATION_ZONES } from './data.js';
import { buildBadges, buildSynopsis, buildCapabilities, buildTechStack, buildMetricsBar, buildAiModels, getMetricsStaleness, CATEGORY_ICONS, extractYouTubeId, escapeHtml } from './panel-content.js';
import { initSwipeGesture } from './panel-swipe.js';

// ---------------------------------------------------------------------------
// WCAG AA contrast helper — SC-005: use zone hexBright when accent fails 4.5:1
// ---------------------------------------------------------------------------
const PANEL_BG_LUMINANCE = 0.0034; // #0D0B09 relative luminance
function _srgbToLinear(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function _relativeLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * _srgbToLinear(r) + 0.7152 * _srgbToLinear(g) + 0.0722 * _srgbToLinear(b);
}
function getTextSafeColor(hex, projectId) {
  const ratio = (_relativeLuminance(hex) + 0.05) / (PANEL_BG_LUMINANCE + 0.05);
  if (ratio >= 4.5) return hex;
  const zone = CONSTELLATION_ZONES.find(z => z.projectIds.includes(projectId));
  return zone ? zone.hexBright : hex;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let triggerElement = null;
let overlayEl = null;
let overlayHeaderEl = null;
let overlayContentEl = null;
let closeBtn = null;
let backdropEl = null;
let focusableEls = [];

/** Callback invoked before the panel opens (e.g. close hamburger nav) */
let _beforeOpen = null;

/** Saved scroll position for iOS-safe scroll lock */
let _savedScrollTop = 0;
let _isClosing = false;

/** Repo metrics data (passed via DI from app.js) */
let _repoMetrics = { repos: {} };

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
    } else if (member.status === 'paused') {
      const badge = document.createElement('span');
      badge.className = 'status-badge status-badge--paused';
      badge.textContent = 'Archived';
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
  } else if (project.status === 'paused') {
    const badge = document.createElement('span');
    badge.className = 'status-badge status-badge--paused';
    badge.textContent = 'Archived';
    descZone.appendChild(badge);
  }

  // Badges (category + constellation)
  const badgesEl = buildBadges(project);
  if (badgesEl) descZone.appendChild(badgesEl);

  // Cluster panel: list view, no media
  if (project.isCluster && project.clusterMembers && project.clusterMembers.length > 0) {
    const logoZone = overlayEl.querySelector('.overlay__logo-zone');
    logoZone.innerHTML = '';
    const mediaZone = overlayEl.querySelector('.overlay__media-zone');
    mediaZone.innerHTML = '';
    mediaZone.appendChild(renderClusterMemberList(project.clusterMembers, getTextSafeColor(project.accentColor, project.id)));

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

    // Enhanced content for clusters (spec 9.3: render if present)
    const clusterMobile = window.matchMedia('(max-width: 767px)').matches;
    const clusterSynopsis = buildSynopsis(project, clusterMobile);
    if (clusterSynopsis) descZone.appendChild(clusterSynopsis);
    const clusterCaps = buildCapabilities(project);
    if (clusterCaps) descZone.appendChild(clusterCaps);
    const clusterTech = buildTechStack(project);
    if (clusterTech) descZone.appendChild(clusterTech);

    overlayEl.setAttribute('aria-label', project.name + ' project details');
    overlayEl.removeAttribute('hidden');
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(st => st.disable());
    }
    _savedScrollTop = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = -_savedScrollTop + 'px';
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

  // Enhanced content sections (spec 10.1 order, after media)
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const synopsisEl = buildSynopsis(project, isMobile);
  if (synopsisEl) descZone.appendChild(synopsisEl);

  const repoMetricsEntry = _repoMetrics.repos?.[project.repoKey];
  const staleness = getMetricsStaleness(_repoMetrics);
  const metricsEl = buildMetricsBar(repoMetricsEntry, staleness, _repoMetrics.generated_at);
  if (metricsEl) descZone.appendChild(metricsEl);

  const capsEl = buildCapabilities(project);
  if (capsEl) descZone.appendChild(capsEl);

  const techEl = buildTechStack(project);
  if (techEl) descZone.appendChild(techEl);

  const aiEl = buildAiModels(project);
  if (aiEl) descZone.appendChild(aiEl);

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
  _savedScrollTop = window.scrollY;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.top = -_savedScrollTop + 'px';

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
  if (!overlayEl || overlayEl.hasAttribute('hidden') || _isClosing) return;
  _isClosing = true;

  const videos = overlayEl.querySelectorAll('video');
  videos.forEach(v => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });

  const mediaZone = overlayEl.querySelector('.overlay__media-zone');
  mediaZone.innerHTML = '';

  // Restore scroll WHILE body is still position:fixed — scrollTo sets the
  // underlying document scroll offset without visual movement. When fixed
  // positioning is then released, the browser already has the correct offset
  // and avoids the scroll-0 → scroll-N jump that triggers iOS Safari's
  // compositing layer teardown on the WebGL canvas.
  overlayEl.setAttribute('hidden', '');
  document.documentElement.style.overflow = '';
  window.scrollTo(0, _savedScrollTop);

  // Single rAF: release body fixed positioning AFTER scroll is already correct.
  // One layout thrash instead of three (the root cause of the blank screen).
  requestAnimationFrame(() => {
    try {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';

      if (window.ScrollTrigger) {
        window.ScrollTrigger.getAll().forEach(st => st.enable());
        window.ScrollTrigger.refresh();
      }

      document.dispatchEvent(new CustomEvent('panel-close'));

      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus();
      }
      triggerElement = null;
    } finally {
      _isClosing = false;
    }
  });
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
function initPanel({ beforeOpen, repoMetrics } = {}) {
  overlayEl = document.getElementById('project-overlay');
  if (!overlayEl) return;

  overlayHeaderEl = overlayEl.querySelector('.overlay__header');
  overlayContentEl = overlayEl.querySelector('.overlay__content');
  closeBtn = overlayEl.querySelector('.overlay__close');
  backdropEl = overlayEl.querySelector('.overlay__backdrop');
  _beforeOpen = beforeOpen || null;
  if (repoMetrics) _repoMetrics = repoMetrics;

  // Close button click
  closeBtn.addEventListener('click', closeProjectPanel);

  // Backdrop click — guard against bubbled clicks from modal content
  backdropEl.addEventListener('click', (e) => {
    if (e.target !== backdropEl) return;
    closeProjectPanel();
  });

  // Swipe-to-dismiss on modal header
  initSwipeGesture(overlayHeaderEl, overlayContentEl, closeProjectPanel);
}

// Exports
export {
  initPanel as init,
  showProjectPanel,
  closeProjectPanel,
  handleFocusTrap
};
