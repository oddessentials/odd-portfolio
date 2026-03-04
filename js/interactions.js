// js/interactions.js — Project panel management + keyboard navigation + hamburger menu
import { PROJECTS } from './data.js';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------
let triggerElement = null;
let overlayEl = null;
let closeBtn = null;
let backdropEl = null;
let focusableEls = [];

// Hamburger menu state
let hamburgerBtn = null;
let navEl = null;
let navOpen = false;

// Category SVG icons for terminal-style placeholders
const CATEGORY_ICONS = {
  'ai-devops': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="18" r="8"/><path d="M12 40c0-6.627 5.373-12 12-12s12 5.373 12 12"/><circle cx="36" cy="12" r="4"/><line x1="36" y1="16" x2="36" y2="22"/></svg>',
  'data-devops': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="6" width="32" height="10" rx="2"/><rect x="8" y="20" width="32" height="10" rx="2"/><rect x="8" y="34" width="32" height="10" rx="2"/><circle cx="14" cy="11" r="2" fill="currentColor"/><circle cx="14" cy="25" r="2" fill="currentColor"/><circle cx="14" cy="39" r="2" fill="currentColor"/></svg>',
  'tooling': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 8l28 0M10 16l28 0M10 24l20 0M10 32l14 0M10 40l8 0"/><path d="M36 28l4-4 4 4-4 4z"/></svg>',
  'infrastructure': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="6" width="20" height="14" rx="2"/><rect x="14" y="28" width="20" height="14" rx="2"/><line x1="24" y1="20" x2="24" y2="28"/><circle cx="20" cy="12" r="2" fill="currentColor"/><circle cx="28" cy="12" r="2" fill="currentColor"/></svg>',
  'frontend': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="40" height="28" rx="3"/><line x1="4" y1="16" x2="44" y2="16"/><circle cx="10" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><polyline points="14,26 20,30 14,34"/><line x1="24" y1="34" x2="34" y2="34"/></svg>',
  'fintech': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,36 12,24 20,30 28,14 36,22 44,10"/><line x1="4" y1="42" x2="44" y2="42"/><line x1="4" y1="6" x2="4" y2="42"/></svg>',
  'web': '<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2"><circle cx="24" cy="24" r="18"/><ellipse cx="24" cy="24" rx="8" ry="18"/><line x1="6" y1="24" x2="42" y2="24"/><line x1="24" y1="6" x2="24" y2="42"/></svg>'
};

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
// showProjectPanel — populate and open the overlay
// ---------------------------------------------------------------------------
function showProjectPanel(project, trigger) {
  if (!overlayEl) return;

  triggerElement = trigger || null;

  // Close hamburger nav if open
  if (navOpen) closeHamburgerNav();

  // Populate title and tagline
  const titleEl = overlayEl.querySelector('.overlay__title');
  const taglineEl = overlayEl.querySelector('.overlay__tagline');
  titleEl.textContent = project.name;
  taglineEl.textContent = project.tagline;

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
// Simple HTML escaping
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Hamburger menu logic (T014)
// ---------------------------------------------------------------------------
function openHamburgerNav() {
  if (!hamburgerBtn || !navEl) return;
  navOpen = true;
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  hamburgerBtn.setAttribute('aria-label', 'Close navigation');
  hamburgerBtn.classList.add('is-open');
  navEl.classList.add('nav--open');
  document.body.classList.add('nav-overlay-active');

  // Focus first nav button
  requestAnimationFrame(() => {
    const firstBtn = navEl.querySelector('button[data-project-id]');
    if (firstBtn) firstBtn.focus();
  });
}

function closeHamburgerNav() {
  if (!hamburgerBtn || !navEl) return;
  navOpen = false;
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  hamburgerBtn.setAttribute('aria-label', 'Open navigation');
  hamburgerBtn.classList.remove('is-open');
  navEl.classList.remove('nav--open');
  document.body.classList.remove('nav-overlay-active');
  hamburgerBtn.focus();
}

// ---------------------------------------------------------------------------
// initInteractions — wire up all event listeners
// ---------------------------------------------------------------------------
function initInteractions() {
  overlayEl = document.getElementById('project-overlay');
  if (!overlayEl) return;

  closeBtn = overlayEl.querySelector('.overlay__close');
  backdropEl = overlayEl.querySelector('.overlay__backdrop');

  // Close button click
  closeBtn.addEventListener('click', closeProjectPanel);

  // Backdrop click
  backdropEl.addEventListener('click', closeProjectPanel);

  // Escape key + focus trap
  document.addEventListener('keydown', (e) => {
    // Escape closes hamburger nav first, then overlay
    if (e.key === 'Escape') {
      if (navOpen) {
        e.preventDefault();
        closeHamburgerNav();
        return;
      }
      if (!overlayEl.hasAttribute('hidden')) {
        e.preventDefault();
        closeProjectPanel();
        return;
      }
    }
    // Focus trap when overlay is open
    if (!overlayEl.hasAttribute('hidden')) {
      handleFocusTrap(e);
    }
  });

  // Listen for star-click CustomEvent from scene.js
  document.addEventListener('star-click', (e) => {
    const project = e.detail;
    if (!project) return;
    const navBtn = document.querySelector(
      '#constellation-nav button[data-project-id="' + project.id + '"]'
    );
    showProjectPanel(project, navBtn || null);
    updateAriaPressed(project.id);
  });

  // Constellation nav button clicks
  const navButtons = document.querySelectorAll('#constellation-nav button[data-project-id]');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const projectId = btn.getAttribute('data-project-id');
      const project = PROJECTS.find(p => p.id === projectId);
      if (project) {
        showProjectPanel(project, btn);
        updateAriaPressed(projectId);
      }
    });
  });

  // Arrow key navigation in constellation nav
  const navList = document.querySelector('#constellation-nav ul');
  if (navList) {
    navList.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();

      const buttons = Array.from(navList.querySelectorAll('button'));
      const currentIdx = buttons.indexOf(document.activeElement);
      if (currentIdx === -1) return;

      let nextIdx;
      if (e.key === 'ArrowDown') {
        nextIdx = (currentIdx + 1) % buttons.length;
      } else {
        nextIdx = (currentIdx - 1 + buttons.length) % buttons.length;
      }
      buttons[nextIdx].focus();
    });
  }

  // T014: Hamburger menu setup
  hamburgerBtn = document.getElementById('hamburger-btn');
  navEl = document.getElementById('constellation-nav');

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      if (navOpen) {
        closeHamburgerNav();
      } else {
        openHamburgerNav();
      }
    });

    // Close nav on backdrop tap (clicking outside the nav when overlay is showing)
    document.addEventListener('click', (e) => {
      if (navOpen && navEl && !navEl.contains(e.target) && e.target !== hamburgerBtn && !hamburgerBtn.contains(e.target)) {
        closeHamburgerNav();
      }
    });
  }

  // Set initial focus
  if (!window.__revealActive) {
    setInitialFocus();
  }
}

// ---------------------------------------------------------------------------
// Manage aria-pressed states
// ---------------------------------------------------------------------------
function updateAriaPressed(activeId) {
  const buttons = document.querySelectorAll('#constellation-nav button[data-project-id]');
  buttons.forEach((btn) => {
    btn.setAttribute('aria-pressed',
      btn.getAttribute('data-project-id') === activeId ? 'true' : 'false'
    );
  });
}

// ---------------------------------------------------------------------------
// Set initial focus to first nav button
// ---------------------------------------------------------------------------
function setInitialFocus() {
  const firstBtn = document.querySelector('#constellation-nav button[data-project-id]');
  if (firstBtn) {
    firstBtn.focus();
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { initInteractions, showProjectPanel, closeProjectPanel, setInitialFocus };
