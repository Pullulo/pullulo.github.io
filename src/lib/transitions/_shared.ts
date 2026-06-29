/**
 * Shared scaffolding for all swap transitions.
 *
 * Every transition in the random pool follows the same contract:
 *   (swap: () => void) => Promise<void>
 * — build an overlay on <html>, fully cover the viewport, call swap() while
 * covered, exit, then remove the overlay and kill its tweens.
 *
 * This module centralises the overlay factory, the reduced-motion check, and
 * the calm crossfade fallback so each transition stays focused on choreography
 * and behaves identically for cleanup + accessibility.
 */
import { gsap } from "../gsap";

/** Signature shared by every pooled transition. */
export type SwapTransition = (swap: () => void) => Promise<void>;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the OS/browser requests reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/**
 * User override of the OS motion preference.
 *   null  → follow the OS
 *   true  → force full motion on
 *   false → force reduced motion
 *
 * Default is `true`: the full Persona experience is ON by default for everyone
 * (per the owner's request). The sidebar "Motion" control flips it to reduced —
 * so visitors who need calm motion still have a one-click escape hatch.
 * Module-scoped (no storage per §2); persists across SPA navigations, resets on
 * a hard reload.
 */
let motionOverride: boolean | null = true;

/** Is the dramatic-motion experience currently active? */
export function motionEnabled(): boolean {
  return motionOverride === null ? !prefersReducedMotion() : motionOverride;
}

/** The single source of truth every transition consults. */
export function shouldReduceMotion(): boolean {
  return !motionEnabled();
}

/** Flip the effective motion state; returns the new motionEnabled() value. */
export function toggleMotion(): boolean {
  motionOverride = !motionEnabled();
  return motionEnabled();
}

export interface OverlayOptions {
  /** CSS background for the overlay element (default: transparent). */
  background?: string;
  /** Stacking order (default: 9999 — above all page content). */
  zIndex?: number;
}

/**
 * Create a full-viewport fixed overlay appended to <html> (so it survives
 * Astro's body-content replacement during the swap).
 *
 * pointer-events: none per CLAUDE.md §2 — overlays are purely visual and must
 * not trap clicks or focus during the (≤700ms) transition.
 */
export function createOverlay(opts: OverlayOptions = {}): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    zIndex: String(opts.zIndex ?? 9999),
    overflow: "hidden",
    pointerEvents: "none",
    background: opts.background ?? "transparent",
  });
  document.documentElement.appendChild(el);
  return el;
}

/**
 * Reduced-motion fallback: a calm ~150ms dissolve through black. The overlay
 * fades to opaque (covering the old page), the swap fires while fully covered,
 * then it fades back out to reveal the new page. No dramatic motion.
 */
export async function crossfade(swap: () => void): Promise<void> {
  const overlay = createOverlay({ background: "var(--p5-black)" });
  gsap.set(overlay, { opacity: 0 });

  await gsap.to(overlay, { opacity: 1, duration: 0.075, ease: "none" });
  swap();
  await gsap.to(overlay, { opacity: 0, duration: 0.075, ease: "none" });

  gsap.killTweensOf(overlay);
  overlay.remove();
}

/**
 * Map an angle (radians, measured clockwise from 12 o'clock) to the point where
 * a ray from the centre of a 0–100 square exits the square boundary. Shared by
 * the radial sweep transitions (clockWipe, wiperSweep).
 */
export function rayToSquareEdge(angleRad: number): [number, number] {
  const dx = Math.sin(angleRad);
  const dy = -Math.cos(angleRad);
  const tx = dx === 0 ? Infinity : 50 / Math.abs(dx);
  const ty = dy === 0 ? Infinity : 50 / Math.abs(dy);
  const t = Math.min(tx, ty);
  const x = Math.max(0, Math.min(100, 50 + dx * t));
  const y = Math.max(0, Math.min(100, 50 + dy * t));
  return [x, y];
}
