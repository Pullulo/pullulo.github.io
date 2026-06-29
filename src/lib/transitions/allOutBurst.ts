/**
 * allOutBurst — the one high-impact "combat finisher" (CLAUDE.md §5 #5).
 *
 * Full red background + halftone dots → skewed comic-panel cells pop in on a
 * fast back-out stagger → an original slammed word ("SHOWTIME") via SplitText
 * with per-char overshoot → the whole thing peels diagonally off-screen. ~700ms.
 *
 * The most dramatic transition — the router weights it rare (1-in-8).
 */
import { gsap, SplitText } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const CELL_SHADES = ["#cc0010", "#e60012", "#b3000e", "#d10010", "#a80008", "#e60012"] as const;

export const allOutBurst: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  // Solid red overlay → covers the viewport from the first frame.
  const overlay = createOverlay({ background: "var(--p5-red)" });

  const halftone = document.createElement("div");
  Object.assign(halftone.style, {
    position: "absolute",
    inset: "0",
    backgroundImage: "radial-gradient(var(--p5-ink) 1px, transparent 1.5px)",
    backgroundSize: "6px 6px",
    opacity: "0.10",
  });
  overlay.appendChild(halftone);

  const grid = document.createElement("div");
  Object.assign(grid.style, {
    position: "absolute",
    inset: "0",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr 1fr",
    gap: "4px",
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
  overlay.appendChild(grid);

  const wordEl = document.createElement("div");
  wordEl.textContent = "SHOWTIME";
  Object.assign(wordEl.style, {
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
    userSelect: "none",
  });
  overlay.appendChild(wordEl);

  gsap.set(cells, { scale: 0, opacity: 0, transformOrigin: "center center" });

  const split = new SplitText(wordEl, { type: "chars" });
  gsap.set(split.chars, { opacity: 0, scale: 1.9, y: -55 });
  split.chars.forEach((c, i) => gsap.set(c, { rotation: i % 2 === 0 ? 9 : -9 }));

  const tl = gsap.timeline();

  tl.to(cells, { scale: 1, opacity: 1, duration: 0.1, stagger: 0.02, ease: "back.out(2)" });
  tl.to(
    split.chars,
    { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.05, stagger: 0.025, ease: "power4.out" },
    "-=0.05",
  );

  tl.call(() => swap()); // swap fires under the fully-covered red overlay

  tl.to(overlay, { x: "118%", y: "-118%", rotation: -12, duration: 0.22, ease: "power3.in" }, "+=0.03");

  await tl;

  split.revert();
  gsap.killTweensOf([cells, ...split.chars, overlay]);
  overlay.remove();
};
