// js/pointer-utils.js — Shared pointer capability detection
const pointerMQL = window.matchMedia('(hover: hover) and (pointer: fine)');
export function isFinePointer() { return pointerMQL.matches; }
export { pointerMQL };
