// js/touch-guard.js — Touch tap vs scroll disambiguation
import { isCoarsePointer } from './pointer-utils.js';

const TAP_DISTANCE = 10;   // CSS pixels — movement threshold
const TAP_MAX_MS = 300;     // maximum tap duration
const LONG_PRESS_MS = 500;  // long-press rejection threshold

export function initTouchGuard(hitzone, onValidTap) {
  if (!isCoarsePointer()) return;

  let startX, startY, startTime, cancelled;

  hitzone.addEventListener('touchstart', (e) => {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
    cancelled = false;
  }, { passive: true });

  hitzone.addEventListener('touchmove', (e) => {
    if (cancelled) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // Vertical-dominant movement = scroll gesture — cancel immediately
    if (Math.abs(dy) > Math.abs(dx)) { cancelled = true; return; }
    // Distance threshold exceeded
    if (dx * dx + dy * dy > TAP_DISTANCE * TAP_DISTANCE) cancelled = true;
  }, { passive: true });

  hitzone.addEventListener('touchend', () => {
    if (cancelled) return;
    const duration = Date.now() - startTime;
    // Valid tap: under 300ms, not a long-press
    if (duration < TAP_MAX_MS && duration > 0) {
      onValidTap();
    }
  }, { passive: true });
}
