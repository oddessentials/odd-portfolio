// js/splash.js — Parchment Door Splash Gate
// Exports: init(options), isReturningVisitor()
// Imports: NONE from project modules. Uses window.gsap global.

const SPLASH_VERSION = 1;
const STORAGE_KEY = 'oe-splash-dismissed';
const AUDIO_ENABLED = true;

const SPLASH_CONTENT = {
  heading: 'Welcome, Traveler',
  body: 'Beyond this door lies a collection of Odd Essentials.'
};

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
  doorContainer.setAttribute('role', 'button');
  doorContainer.setAttribute('aria-label', 'Enter the portfolio');
  doorContainer.tabIndex = 0;

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

  textBlock.append(h1, bodyP, sigPic);

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

  // Inner glow — sits behind the door within the scene so light
  // peeks through the pointed arch gap above the door
  const innerGlow = document.createElement('div');
  innerGlow.className = 'splash-gate__inner-glow';

  doorContainer.append(picture, textBlock);
  scene.append(innerGlow, doorContainer, archway);
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
function setupFocusTrap(rootEl, doorEl) {
  rootEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      doorEl.focus();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      doorEl.click();
    }
  });
  doorEl.focus();
}

// ---------------------------------------------------------------------------
// showLoadingState — display typed loading text while assets preload (T027)
// ---------------------------------------------------------------------------
function showLoadingState(doorContainer) {
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

  doorContainer.appendChild(wrapper);

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

    const doorContainer = root.querySelector('.splash-gate__door-container');
    const glowEl = root.querySelector('.splash-gate__glow');

    setupFocusTrap(root, doorContainer);

    let dismissed = false;
    doorContainer.addEventListener('click', async () => {
      if (dismissed) return;
      dismissed = true;

      // 1. Persist dismissal
      setDismissed();

      // 2. Wait for site assets if preloadPromise provided
      if (options.preloadPromise) {
        let preloadDone = false;
        options.preloadPromise.then(() => { preloadDone = true; });
        // Yield one microtask so the flag can settle if already resolved
        await Promise.resolve();

        if (!preloadDone) {
          const loadingEl = showLoadingState(doorContainer);
          await options.preloadPromise;
          loadingEl.remove();
        }
      }

      // 3. Play door creak audio (fire-and-forget)
      playDoorCreak();

      // 4. Door open animation
      await playDoorOpen(doorContainer, glowEl);

      // 5. Cleanup
      root.remove();
      document.body.classList.remove('splash-active');

      resolve();
    });
  });
}
