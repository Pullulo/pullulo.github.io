/**
 * slashWipe — default page-to-page transition (CLAUDE.md §5 #1).
 *
 * 3 skewed panels (red, deep-red, black) stagger across the viewport from left
 * to right, hiding the DOM swap, then continue off the right edge.
 * Total ~620ms, well under the 700ms hard cap.
 *
 * Overlay is appended to <html> rather than <body> so it survives Astro's
 * body-content replacement during the swap.
 */
import { gsap } from "../gsap";

const COLORS = ["var(--p5-red)", "var(--p5-red-deep)", "var(--p5-black)"] as const;

const COVER_DUR = 0.22;
const REVEAL_DUR = 0.24;
const STAGGER = 0.045;

function createOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    pointerEvents: "all",
    overflow: "hidden",
  });
  document.documentElement.appendChild(el);
  return el;
}

function createPanel(bg: string): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "absolute",
    top: "0",
    left: "-25%", // extra overhang so skewed left-edge is fully off-screen
    width: "150%", // wider than viewport to account for skew
    height: "100%",
    background: bg,
    willChange: "transform",
  });
  return el;
}

export async function slashWipe(swap: () => void): Promise<void> {
  const overlay = createOverlay();

  const panels = COLORS.map((bg) => {
    const el = createPanel(bg);
    overlay.appendChild(el);
    return el;
  });

  // xPercent is relative to element width (150vw).
  // -100% → left edge at (-25vw - 150vw) = off-screen left.
  //   0%  → left edge at -25vw, right edge at 125vw: viewport fully covered.
  // +100% → left edge at 125vw: off-screen right.
  gsap.set(panels, { skewX: -15, xPercent: -100 });

  // Phase 1: stagger panels across to full cover
  await gsap.to(panels, {
    xPercent: 0,
    duration: COVER_DUR,
    stagger: STAGGER,
    ease: "power3.in",
  });

  // DOM swap happens under the opaque black panel
  swap();

  // Phase 2: continue panels off the right edge
  await gsap.to(panels, {
    xPercent: 100,
    duration: REVEAL_DUR,
    stagger: STAGGER,
    ease: "power3.out",
  });

  // Cleanup: kill any lingering tweens, remove overlay from <html>
  gsap.killTweensOf(panels);
  overlay.remove();
}
