/**
 * alloutBurst — the one high-impact "combat finisher" (CLAUDE.md §5 #3).
 * Reserved exclusively for entering the Publications page.
 *
 * Full red background + halftone dots → skewed comic-panel cells stagger in →
 * "SHOWTIME" text slams in per-char via SplitText → diagonal peel reveals page.
 * ≤700ms total (measured at ~625ms).
 */
import { gsap, SplitText } from "../gsap";

const CELL_SHADES = [
  "#cc0010", "#e60012",
  "#b3000e", "#d10010",
  "#a80008", "#e60012",
] as const;

function createOverlay(): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    background: "var(--p5-red)",
    overflow: "hidden",
    pointerEvents: "all",
  });
  document.documentElement.appendChild(el);
  return el;
}

function createHalftone(parent: HTMLElement): void {
  const ht = document.createElement("div");
  Object.assign(ht.style, {
    position: "absolute",
    inset: "0",
    backgroundImage: "radial-gradient(var(--p5-ink) 1px, transparent 1.5px)",
    backgroundSize: "6px 6px",
    opacity: "0.10",
    pointerEvents: "none",
  });
  parent.appendChild(ht);
}

function createGrid(parent: HTMLElement): HTMLDivElement[] {
  const grid = document.createElement("div");
  Object.assign(grid.style, {
    position: "absolute",
    inset: "0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr 1fr",
    gap: "4px",
    pointerEvents: "none",
  });
  const cells = CELL_SHADES.map((bg) => {
    const cell = document.createElement("div");
    Object.assign(cell.style, {
      background: bg,
      transform: "skewX(-12deg) scaleX(1.15)",
      transformOrigin: "center",
    });
    grid.appendChild(cell);
    return cell;
  });
  parent.appendChild(grid);
  return cells;
}

function createWordEl(parent: HTMLElement): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = "SHOWTIME";
  Object.assign(el.style, {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Anton, Impact, system-ui, sans-serif",
    fontSize: "clamp(4rem, 16vw, 13rem)",
    color: "var(--p5-white)",
    letterSpacing: "0.02em",
    zIndex: "1",
    pointerEvents: "none",
    userSelect: "none",
  });
  parent.appendChild(el);
  return el;
}

export async function alloutBurst(swap: () => void): Promise<void> {
  const overlay = createOverlay();
  createHalftone(overlay);
  const cells = createGrid(overlay);
  const wordEl = createWordEl(overlay);

  // Initial state
  gsap.set(cells, { scale: 0, opacity: 0, transformOrigin: "center center" });

  // Split word into chars AFTER element is in the DOM
  const split = new SplitText(wordEl, { type: "chars" });
  gsap.set(split.chars, { opacity: 0, scale: 1.9, y: -55 });
  split.chars.forEach((char, i) => gsap.set(char, { rotation: i % 2 === 0 ? 9 : -9 }));

  const tl = gsap.timeline();

  // Cells pop in with back-out overshoot stagger
  tl.to(cells, {
    scale: 1,
    opacity: 1,
    duration: 0.10,
    stagger: 0.02,
    ease: "back.out(2)",
  });

  // Word chars slam in, overlapping the tail of the cells
  tl.to(
    split.chars,
    {
      opacity: 1,
      scale: 1,
      y: 0,
      rotation: 0,
      duration: 0.05,
      stagger: 0.025,
      ease: "power4.out",
    },
    "-=0.05",
  );

  // DOM swap once the overlay fully covers the screen (fire right at word-end)
  tl.call(() => swap());

  // Diagonal peel — 30ms hold then the whole overlay exits upper-right
  tl.to(overlay, {
    x: "118%",
    y: "-118%",
    rotation: -12,
    duration: 0.22,
    ease: "power3.in",
  }, "+=0.03");

  await tl;

  split.revert();
  gsap.killTweensOf([cells, split.chars, overlay]);
  overlay.remove();
}
