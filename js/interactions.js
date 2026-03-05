// js/interactions.js — Keyboard navigation + hamburger menu + nav hover effects
import { PROJECTS } from './data.js';
import { init as initPanel, showProjectPanel, closeProjectPanel, handleFocusTrap } from './panel.js';

// ---------------------------------------------------------------------------
// Hamburger menu state
// ---------------------------------------------------------------------------
let hamburgerBtn = null;
let navEl = null;
let navOpen = false;

// Touch/hover state
let isTouchDevice = false;
let expandedBtn = null;

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
  // Initialize panel module, passing hamburger-close as beforeOpen callback
  initPanel({
    beforeOpen: () => { if (navOpen) closeHamburgerNav(); }
  });

  const overlayEl = document.getElementById('project-overlay');
  if (!overlayEl) return;

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

  // Detect touch device
  isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  // Constellation nav button clicks (with touch guard — T009)
  const navButtons = document.querySelectorAll('#constellation-nav button[data-project-id]');
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Touch guard: first tap expands tagline, second tap opens panel
      if (isTouchDevice && !btn.classList.contains('tagline-expanded')) {
        expandTagline(btn);
        return;
      }
      const projectId = btn.getAttribute('data-project-id');
      const project = PROJECTS.find(p => p.id === projectId);
      if (project) {
        showProjectPanel(project, btn);
        updateAriaPressed(projectId);
      }
    });
  });

  // Initialize hover effects for desktop (T008)
  initNavHoverEffects(navButtons);

  // Debounced resize handler (T010)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 768 && navOpen) {
        closeHamburgerNav();
      }
      if (expandedBtn) {
        collapseTagline(expandedBtn);
      }
    }, 100);
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

    // Close nav on backdrop tap + collapse taglines
    document.addEventListener('click', (e) => {
      if (navOpen && navEl && !navEl.contains(e.target) && e.target !== hamburgerBtn && !hamburgerBtn.contains(e.target)) {
        closeHamburgerNav();
      }
      // Collapse expanded tagline when clicking outside nav
      if (expandedBtn && navEl && !navEl.contains(e.target)) {
        collapseTagline(expandedBtn);
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
// Nav hover effects for desktop (T008)
// ---------------------------------------------------------------------------
function initNavHoverEffects(navButtons) {
  const gsap = window.gsap;
  if (!gsap) return;

  // Only attach on hover-capable devices
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  navButtons.forEach((btn) => {
    const desc = btn.querySelector('.project-desc');
    const glyph = btn.querySelector('.glyph');
    if (!desc) return;

    btn.addEventListener('mouseenter', () => {
      if (prefersReducedMotion.matches) {
        desc.style.maxHeight = '1.5em';
        desc.style.opacity = '1';
        return;
      }
      gsap.killTweensOf(desc);
      gsap.to(desc, { maxHeight: '1.5em', opacity: 1, duration: 0.3, ease: 'power2.out' });
      if (glyph) {
        gsap.to(glyph, { scale: 1.2, duration: 0.3, ease: 'back.out(2)' });
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (prefersReducedMotion.matches) {
        desc.style.maxHeight = '0';
        desc.style.opacity = '0';
        return;
      }
      gsap.killTweensOf(desc);
      gsap.to(desc, { maxHeight: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
      if (glyph) {
        gsap.to(glyph, { scale: 1, duration: 0.2, ease: 'power2.out' });
      }
    });

    // Keyboard parity: focus-visible
    btn.addEventListener('focus', () => {
      if (!btn.matches(':focus-visible')) return;
      gsap.killTweensOf(desc);
      gsap.to(desc, { maxHeight: '1.5em', opacity: 1, duration: 0.3, ease: 'power2.out' });
    });

    btn.addEventListener('blur', () => {
      gsap.killTweensOf(desc);
      gsap.to(desc, { maxHeight: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
    });
  });
}

// ---------------------------------------------------------------------------
// Tagline expand/collapse for touch (T009)
// ---------------------------------------------------------------------------
function expandTagline(btn) {
  const gsap = window.gsap;
  const desc = btn.querySelector('.project-desc');
  if (!desc) return;

  // Collapse previous
  if (expandedBtn && expandedBtn !== btn) {
    collapseTagline(expandedBtn);
  }

  btn.classList.add('tagline-expanded');
  desc.classList.add('tagline-expanded');
  expandedBtn = btn;

  if (gsap) {
    gsap.to(desc, { maxHeight: '3em', opacity: 1, duration: 0.3, ease: 'power2.out' });
  } else {
    desc.style.maxHeight = '3em';
    desc.style.opacity = '1';
  }
}

function collapseTagline(btn) {
  const gsap = window.gsap;
  const desc = btn.querySelector('.project-desc');
  if (!desc) return;

  btn.classList.remove('tagline-expanded');
  desc.classList.remove('tagline-expanded');
  if (expandedBtn === btn) expandedBtn = null;

  if (gsap) {
    gsap.to(desc, { maxHeight: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
  } else {
    desc.style.maxHeight = '0';
    desc.style.opacity = '0';
  }
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
export { initInteractions, setInitialFocus };
