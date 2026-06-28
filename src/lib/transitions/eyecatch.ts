/**
 * eyecatch — menu-select burst for Home first paint (CLAUDE.md §5 #4).
 *
 * Two stacked SVG polygons (red base + cyan/screen blend) whose points are
 * re-randomized every frame for ~250ms so the shape jitters violently, then
 * the overlay collapses and fades, resolving the returned Promise.
 */
import { gsap } from "../gsap";

// Base polygon (in viewBox 0-100 units). Roughly covers the centre of the screen.
const BASE: ReadonlyArray<readonly [number, number]> = [
  [50, 2], [85, 15], [98, 50], [85, 85],
  [50, 98], [15, 85], [2, 50], [15, 15],
];

function jitter(pts: ReadonlyArray<readonly [number, number]>, spread: number): string {
  return pts
    .map(([x, y]) => `${Math.max(0, Math.min(100, x + (Math.random() - 0.5) * spread))},${Math.max(0, Math.min(100, y + (Math.random() - 0.5) * spread))}`)
    .join(" ");
}

export function eyecatch(): Promise<void> {
  return new Promise<void>((resolve) => {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "9000",
      pointerEvents: "none",
    });
    document.documentElement.appendChild(overlay);

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    Object.assign(svg.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });

    const redPoly = document.createElementNS(NS, "polygon");
    redPoly.setAttribute("fill", "#e60012");
    redPoly.setAttribute("opacity", "0.93");

    const cyanPoly = document.createElementNS(NS, "polygon");
    cyanPoly.setAttribute("fill", "#1cfeff");
    cyanPoly.setAttribute("opacity", "0.75");
    cyanPoly.setAttribute("style", "mix-blend-mode: screen");

    svg.append(redPoly, cyanPoly);
    overlay.appendChild(svg);

    const JITTER_DUR = 0.25; // seconds
    const startTime = gsap.ticker.time;

    function tick(time: number) {
      const spread = 30 + Math.sin((time - startTime) * 25) * 10; // dynamic spread
      redPoly.setAttribute("points", jitter(BASE, spread));
      // Offset the cyan polygon slightly
      const shifted = BASE.map(([x, y]) => [x + 4, y + 4] as const);
      cyanPoly.setAttribute("points", jitter(shifted, spread * 0.9));

      if (time - startTime >= JITTER_DUR) {
        gsap.ticker.remove(tick);
        // Collapse + fade
        gsap.to(overlay, {
          opacity: 0,
          scale: 1.4,
          duration: 0.18,
          ease: "power2.in",
          onComplete: () => {
            overlay.remove();
            resolve();
          },
        });
      }
    }

    gsap.ticker.add(tick);
  });
}
