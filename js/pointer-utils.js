// js/pointer-utils.js — Shared pointer capability detection
const pointerMQL = window.matchMedia('(hover: hover) and (pointer: fine)');
const coarsePointerMQL = window.matchMedia('(pointer: coarse)');
export function isFinePointer() { return pointerMQL.matches; }
export function isCoarsePointer() { return coarsePointerMQL.matches; }
export { pointerMQL, coarsePointerMQL };
