/**
 * eyecatchJitter — two stacked skewed SVG polygons (red base + cyan top with
 * mix-blend-mode: screen) re-randomise their vertices every frame for ~200ms,
 * creating a violent jitter, then slam to a full-cover resting shape. The swap
 * fires under cover, and the overlay fades out to reveal the new page. ~400ms.
 *
 * A short, punchy punctuation effect. Cover at the swap moment is guaranteed by
 * filling the overlay background red the instant the jitter resolves.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const NS = "http://www.w3.org/2000/svg";

// Base octagon-ish silhouette (0–100 viewBox units).
const BASE: ReadonlyArray<readonly [number, number]> = [
  [50, 2], [85, 15], [98, 50], [85, 85], [50, 98], [15, 85], [2, 50], [15, 15],
];

function jitter(pts: ReadonlyArray<readonly [number, number]>, spread: number): string {
  return pts
    .map(([x, y]) => {
      const jx = Math.max(-20, Math.min(120, x + (Math.random() - 0.5) * spread));
      const jy = Math.max(-20, Math.min(120, y + (Math.random() - 0.5) * spread));
      return `${jx.toFixed(1)},${jy.toFixed(1)}`;
    })
    .join(" ");
}

export const eyecatchJitter: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  Object.assign(svg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    transform: "skewX(-8deg) scale(1.2)", // skewed + oversized so jitter reads big
  });

  const red = document.createElementNS(NS, "polygon");
  red.setAttribute("fill", "#e60012");
  const cyan = document.createElementNS(NS, "polygon");
  cyan.setAttribute("fill", "#1cfeff");
  cyan.setAttribute("style", "mix-blend-mode: screen");
  svg.append(red, cyan);
  overlay.appendChild(svg);

  // Jitter window: a proxy tween drives ~200ms of per-frame vertex randomisation.
  const proxy = { p: 0 };
  await gsap.to(proxy, {
    p: 1,
    duration: 0.2,
    ease: "none",
    onUpdate: () => {
      const spread = 34 + Math.sin(proxy.p * Math.PI * 6) * 12;
      red.setAttribute("points", jitter(BASE, spread));
      cyan.setAttribute("points", jitter(BASE.map(([x, y]) => [x + 4, y + 3] as const), spread * 0.9));
    },
  });

  // Slam to a full-cover resting state; swap under guaranteed cover.
  overlay.style.background = "var(--p5-red)";
  red.setAttribute("points", "-20,-20 120,-20 120,120 -20,120");
  cyan.setAttribute("points", "-20,-20 120,-20 120,120 -20,120");
  swap();

  // Fade out to reveal.
  await gsap.to(overlay, { opacity: 0, duration: 0.12, ease: "power2.in" });

  gsap.killTweensOf([proxy, overlay]);
  overlay.remove();
};
