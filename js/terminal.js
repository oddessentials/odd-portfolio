// js/terminal.js — Terminal scan animation (extracted from animations.js)
import { PROJECTS } from './data.js';

const gsap = window.gsap;
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------------------------------------------------------------------------
// playTerminalScan — independent terminal loading animation (T013)
// ---------------------------------------------------------------------------
function playTerminalScan() {
  if (!gsap) return null;

  // Reduced motion: show final state immediately
  if (prefersReducedMotion.matches) {
    const scanLines = document.querySelectorAll('.scan-line');
    const loadingBarFill = document.querySelector('.loading-bar__fill');
    const loadingBar = document.querySelector('.loading-bar');
    const phaseIndicator = document.querySelector('.phase-indicator');

    if (scanLines[0]) scanLines[0].textContent = '7 systems nominal';
    if (scanLines[1]) scanLines[1].textContent = '[##########] 100%';
    if (scanLines[2]) scanLines[2].textContent = '';
    if (loadingBarFill) loadingBarFill.style.transform = 'scaleX(1)';
    if (loadingBar) loadingBar.setAttribute('aria-valuenow', '100');
    if (phaseIndicator) phaseIndicator.textContent = 'PORTFOLIO READY';

    document.dispatchEvent(new CustomEvent('terminal-scan-complete'));
    return null;
  }

  const scanLines = document.querySelectorAll('.scan-line');
  const loadingBarFill = document.querySelector('.loading-bar__fill');
  const loadingBar = document.querySelector('.loading-bar');
  const phaseIndicator = document.querySelector('.phase-indicator');
  const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;

  const tl = gsap.timeline({
    onComplete: () => {
      document.dispatchEvent(new CustomEvent('terminal-scan-complete'));
    }
  });

  const percentages = [14, 28, 43, 57, 71, 86, 100];

  PROJECTS.forEach((project, i) => {
    const pct = percentages[i];
    const barStr = '[' + '#'.repeat(Math.round(pct / 10)) + '.'.repeat(10 - Math.round(pct / 10)) + '] ' + pct + '%';

    tl.to(scanLines[0] || {}, {
      duration: project.id.length * 0.033,
      text: { value: 'Scanning ' + project.id + '...', delimiter: '' },
      ease: 'none'
    }, i * 0.7);

    tl.call(() => {
      if (scanLines[1]) scanLines[1].textContent = barStr;
      if (loadingBarFill) loadingBarFill.style.transform = 'scaleX(' + (pct / 100) + ')';
      if (loadingBar) loadingBar.setAttribute('aria-valuenow', String(pct));
    }, null, i * 0.7 + 0.3);
  });

  // Final state
  const finalTime = PROJECTS.length * 0.7 + 0.5;
  tl.to(scanLines[0] || {}, {
    duration: 0.5,
    text: { value: '7 systems nominal', delimiter: '' },
    ease: 'none'
  }, finalTime);

  tl.call(() => {
    if (scanLines[1]) scanLines[1].textContent = '[##########] 100%';
  }, null, finalTime);

  // Phase indicator: PORTFOLIO READY + glow flash
  tl.call(() => {
    if (phaseIndicator) {
      phaseIndicator.textContent = 'PORTFOLIO READY';
      if (!prefersHighContrast) {
        gsap.fromTo(phaseIndicator, {
          textShadow: '0 0 12px rgba(200, 168, 75, 0.8)'
        }, {
          textShadow: '0 0 0px rgba(200, 168, 75, 0)',
          duration: 1.2,
          ease: 'power2.out'
        });
      } else {
        gsap.fromTo(phaseIndicator, {
          color: '#ffffff'
        }, {
          color: 'var(--color-text-mono)',
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    }
  }, null, finalTime + 0.3);

  return tl;
}

export { playTerminalScan };
