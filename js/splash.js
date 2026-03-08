// js/splash.js — Parchment Door Splash Gate
// Exports: init(options), isReturningVisitor()
// Imports: NONE from project modules. Uses window.gsap global.

const SPLASH_VERSION = 1;
const STORAGE_KEY = 'oe-splash-dismissed';
const AUDIO_ENABLED = true;

const SPLASH_CONTENT = {
  heading: 'Welcome, Traveler',
  body: 'Beyond this door lies a collection of digital artifacts \u2014 tools, applications, and experiments forged by Odd Essentials. Each star in the constellation within represents a project, waiting to be explored.',
  instruction: 'Break the seal to enter'
};

const OE_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 298.508 298.508" class="splash-gate__seal-logo" aria-hidden="true"><g transform="rotate(45,220.169,149.254)"><g transform="matrix(0,1,1,0,70.024,29.574)"><circle cx="100" cy="100" r="80.902" fill="none" stroke="currentColor" stroke-width="38.197"/><rect x="80.902" y="0" width="38.197" height="200" fill="currentColor"/><rect x="119.098" y="161.803" width="161.803" height="38.197" fill="currentColor"/><rect x="119.098" y="80.902" width="161.803" height="38.197" fill="currentColor"/><rect x="119.098" y="0" width="161.803" height="38.197" fill="currentColor"/></g></g></svg>';

const gsap = window.gsap;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let audioBuffer = null;

// ---------------------------------------------------------------------------
// isReturningVisitor — check localStorage for prior dismissal (T010, T024)
// ---------------------------------------------------------------------------
export function isReturningVisitor() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed && parsed.v === SPLASH_VERSION;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// setDismissed — persist dismissal to localStorage (T022, T024)
// ---------------------------------------------------------------------------
function setDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: SPLASH_VERSION, ts: Date.now() }));
  } catch {
    // Silently fail — quota exceeded or private browsing
  }
}

// ---------------------------------------------------------------------------
// buildSplashDOM — construct splash gate DOM tree (T011, T021)
// ---------------------------------------------------------------------------
function buildSplashDOM() {
  const root = document.createElement('div');
  root.id = 'splash-gate';
  root.className = 'splash-gate';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Welcome to Odd Essentials');
  root.setAttribute('aria-describedby', 'splash-text');

  const backdrop = document.createElement('div');
  backdrop.className = 'splash-gate__backdrop';

  const glow = document.createElement('div');
  glow.className = 'splash-gate__glow';

  const scene = document.createElement('div');
  scene.className = 'splash-gate__scene';

  const doorContainer = document.createElement('div');
  doorContainer.className = 'splash-gate__door-container';

  // Door image with <picture> for webp fallback
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  source.srcset = 'assets/chamber-door.webp';
  source.type = 'image/webp';
  const img = document.createElement('img');
  img.src = 'assets/chamber-door.png';
  img.alt = '';
  img.className = 'splash-gate__door-img';
  img.setAttribute('aria-hidden', 'true');
  img.setAttribute('fetchpriority', 'high');
  img.width = 768;
  img.height = 1152;
  img.onerror = () => root.classList.add('splash-gate--img-failed');
  picture.append(source, img);

  const textBlock = document.createElement('div');
  textBlock.id = 'splash-text';
  textBlock.className = 'splash-gate__parchment-text';
  const h1 = document.createElement('h1');
  h1.className = 'splash-gate__title';
  h1.textContent = SPLASH_CONTENT.heading;
  const bodyP = document.createElement('p');
  bodyP.className = 'splash-gate__body';
  bodyP.textContent = SPLASH_CONTENT.body;
  const instrP = document.createElement('p');
  instrP.className = 'splash-gate__instruction';
  instrP.textContent = SPLASH_CONTENT.instruction;
  const sigPic = document.createElement('picture');
  const sigSrc = document.createElement('source');
  sigSrc.srcset = 'assets/odd-wizard-signature.webp';
  sigSrc.type = 'image/webp';
  const sigImg = document.createElement('img');
  sigImg.src = 'assets/odd-wizard-signature.png';
  sigImg.alt = 'Odd Essentials';
  sigImg.className = 'splash-gate__signature';
  sigImg.width = 256;
  sigImg.height = 384;
  sigPic.append(sigSrc, sigImg);

  textBlock.append(h1, bodyP, sigPic, instrP);

  const seal = document.createElement('button');
  seal.className = 'splash-gate__seal';
  seal.setAttribute('aria-label', 'Enter the portfolio');
  seal.type = 'button';
  seal.innerHTML = OE_LOGO_SVG;

  // Archway frame overlay (sits on top of door, opening is transparent)
  const archway = document.createElement('picture');
  archway.className = 'splash-gate__archway';
  const archSrc = document.createElement('source');
  archSrc.srcset = 'assets/chamber-archway.webp';
  archSrc.type = 'image/webp';
  const archImg = document.createElement('img');
  archImg.src = 'assets/chamber-archway.png';
  archImg.alt = '';
  archImg.className = 'splash-gate__archway-img';
  archImg.setAttribute('aria-hidden', 'true');
  archImg.width = 1024;
  archImg.height = 1250;
  archway.append(archSrc, archImg);

  doorContainer.append(picture, textBlock, seal);
  scene.append(doorContainer, archway);
  root.append(backdrop, glow, scene);
  return root;
}

// ---------------------------------------------------------------------------
// preloadAudio — fetch and pre-decode door creak audio (T032)
// ---------------------------------------------------------------------------
async function preloadAudio() {
  if (!AUDIO_ENABLED || reducedMotion.matches) return;
  try {
    const resp = await fetch('assets/door-creak.mp3');
    const buffer = await resp.arrayBuffer();
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineCtx) return;
    const offlineCtx = new OfflineCtx(1, 44100, 44100);
    audioBuffer = await offlineCtx.decodeAudioData(buffer);
  } catch {
    // Audio is optional — silently fail
  }
}

// ---------------------------------------------------------------------------
// playDoorCreak — play pre-decoded audio on user gesture (T033, T034)
// ---------------------------------------------------------------------------
function playDoorCreak() {
  if (!AUDIO_ENABLED || !audioBuffer || reducedMotion.matches) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  } catch {
    // Never block the animation
  }
}

// ---------------------------------------------------------------------------
// playSealBreak — crack and fragment the wax seal (T016)
// ---------------------------------------------------------------------------
function playSealBreak(sealEl) {
  return new Promise((resolve) => {
    if (reducedMotion.matches) {
      gsap.to(sealEl, { opacity: 0, duration: 0.2, onComplete: resolve });
      return;
    }

    const tl = gsap.timeline({ onComplete: resolve });

    // Phase 1: Crack lines (0-400ms)
    const cracks = [];
    for (let i = 0; i < 4; i++) {
      const crack = document.createElement('div');
      crack.className = 'splash-gate__seal-crack';
      const angle = i * 45 + 22.5;
      crack.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        width: 2px; height: 0;
        background: rgba(30, 20, 10, 0.8);
        transform-origin: top center;
        transform: translate(-50%, 0) rotate(${angle}deg);
        pointer-events: none;
      `;
      sealEl.appendChild(crack);
      cracks.push(crack);
    }
    tl.to(cracks, { height: '45%', duration: 0.4, stagger: 0.05, ease: 'power2.out' }, 0);
    tl.to(sealEl, { y: -2, duration: 0.4, ease: 'power1.out' }, 0);

    // Phase 2: Fragment and scatter (400-900ms)
    const fragments = [];
    const angles = [0, 72, 144, 216, 288];
    angles.forEach((angle) => {
      const frag = document.createElement('div');
      frag.className = 'splash-gate__seal-fragment';
      const a1 = (angle - 36) * Math.PI / 180;
      const a2 = (angle + 36) * Math.PI / 180;
      const r = 45;
      frag.style.cssText = `
        position: absolute; inset: 0; border-radius: 50%;
        background: inherit;
        clip-path: polygon(50% 50%, ${50 + r * Math.cos(a1)}% ${50 + r * Math.sin(a1)}%, ${50 + r * Math.cos(a2)}% ${50 + r * Math.sin(a2)}%);
        pointer-events: none;
      `;
      sealEl.appendChild(frag);
      fragments.push(frag);
    });

    // Hide the original seal content behind fragments
    tl.set(sealEl.querySelector('.splash-gate__seal-logo'), { opacity: 0 }, 0.4);
    tl.set(cracks, { opacity: 0 }, 0.4);

    fragments.forEach((frag, i) => {
      const angle = angles[i] * Math.PI / 180;
      const dist = 15 + Math.random() * 15;
      const rot = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 10);
      tl.to(frag, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rotation: rot,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, 0.4);
    });

    // Phase 3: Cleanup (900-1000ms)
    tl.call(() => {
      cracks.forEach((c) => c.remove());
      fragments.forEach((f) => f.remove());
      gsap.set(sealEl, { visibility: 'hidden' });
    }, null, 1.0);
  });
}

// ---------------------------------------------------------------------------
// playDoorOpen — 3D perspective door swing open (T017)
// ---------------------------------------------------------------------------
function playDoorOpen(doorContainer, glowEl) {
  return new Promise((resolve) => {
    const root = doorContainer.closest('.splash-gate');
    if (reducedMotion.matches) {
      gsap.to(root, { opacity: 0, duration: 0.2, onComplete: resolve });
      return;
    }

    const tl = gsap.timeline({ onComplete: resolve });

    // Beat 1 (0-300ms): slight inward pull
    tl.to(doorContainer, { rotateY: 3, duration: 0.3, ease: 'power2.in' }, 0);
    tl.to(glowEl, { opacity: 0.35, duration: 0.3, ease: 'power1.out' }, 0);

    // Beat 2 (300-1200ms): swing inward
    tl.to(doorContainer, { rotateY: 45, duration: 0.9, ease: 'power2.inOut' }, 0.3);
    tl.to(glowEl, { opacity: 0.5, filter: 'blur(20px)', duration: 0.9, ease: 'power1.inOut' }, 0.3);

    // Beat 3 (1200-2000ms): full inward swing
    tl.to(doorContainer, { rotateY: 85, duration: 0.8, ease: 'power3.out' }, 1.2);
    tl.to(glowEl, {
      opacity: 0.7,
      backgroundColor: 'rgba(184, 146, 68, 0.5)',
      duration: 0.8, ease: 'power1.out'
    }, 1.2);

    // Beat 4 (2000-2400ms): fade out entire splash
    tl.to(root, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 2.0);
  });
}

// ---------------------------------------------------------------------------
// setupFocusTrap — trap keyboard focus within splash gate (T018)
// ---------------------------------------------------------------------------
function setupFocusTrap(rootEl, sealEl) {
  rootEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      sealEl.focus();
    }
    // Escape is intentionally a no-op — splash is a gate, not dismissible
  });
  sealEl.focus();
}

// ---------------------------------------------------------------------------
// showLoadingState — display typed loading text while assets preload (T027)
// ---------------------------------------------------------------------------
function showLoadingState(sealEl) {
  const wrapper = document.createElement('div');
  wrapper.className = 'splash-gate__loading';
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-live', 'polite');

  const ring = document.createElement('div');
  ring.className = 'splash-gate__loading-ring';

  const text = document.createElement('span');
  text.className = 'splash-gate__loading-text';

  wrapper.appendChild(ring);
  wrapper.appendChild(text);

  // Position at the seal's location
  const parent = sealEl.parentElement;
  parent.appendChild(wrapper);

  gsap.to(text, {
    duration: 1.5,
    text: 'PREPARING THE CHAMBER...',
    ease: 'none'
  });

  return wrapper;
}

// ---------------------------------------------------------------------------
// init — main entry point: gate lifecycle orchestrator (T019, T026)
// ---------------------------------------------------------------------------
export function init(options = {}) {
  if (isReturningVisitor()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    document.body.classList.add('splash-active');

    const root = buildSplashDOM();
    document.body.appendChild(root);

    // Fire-and-forget audio preload
    preloadAudio();

    const sealEl = root.querySelector('.splash-gate__seal');
    const doorContainer = root.querySelector('.splash-gate__door-container');
    const glowEl = root.querySelector('.splash-gate__glow');

    setupFocusTrap(root, sealEl);

    let dismissed = false;
    sealEl.addEventListener('click', async () => {
      if (dismissed) return;
      dismissed = true;

      // 1. Persist dismissal
      setDismissed();

      // 2. Seal break animation
      await playSealBreak(sealEl);

      // 3. Wait for site assets if preloadPromise provided
      if (options.preloadPromise) {
        let preloadDone = false;
        options.preloadPromise.then(() => { preloadDone = true; });
        // Yield one microtask so the flag can settle if already resolved
        await Promise.resolve();

        if (!preloadDone) {
          const loadingEl = showLoadingState(sealEl);
          await options.preloadPromise;
          loadingEl.remove();
        }
      }

      // 4. Play door creak audio (fire-and-forget)
      playDoorCreak();

      // 5. Door open animation
      await playDoorOpen(doorContainer, glowEl);

      // 6. Cleanup
      root.remove();
      document.body.classList.remove('splash-active');

      resolve();
    });
  });
}
