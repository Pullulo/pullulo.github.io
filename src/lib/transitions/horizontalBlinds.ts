/**
 * horizontalBlinds — 8 skewed horizontal bars (alternating red / black) slide
 * in from opposite sides in a stagger (odd from left, even from right) to cover
 * the screen, then all exit upward together. ~550ms.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const BAR_COUNT = 8;

export const horizontalBlinds: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const bar = document.createElement("div");
    const fromLeft = i % 2 === 0;
    Object.assign(bar.style, {
      position: "absolute",
      left: "-30%", // overhang for the skew
      width: "160%",
      // slight vertical overlap (top a touch higher, height a touch taller)
      top: `calc(${(i * 100) / BAR_COUNT}% - 1px)`,
      height: `calc(${100 / BAR_COUNT}% + 2px)`,
      background: i % 2 === 0 ? "var(--p5-red)" : "var(--p5-black)",
      willChange: "transform",
    });
    bar.dataset.fromLeft = String(fromLeft);
    overlay.appendChild(bar);
    return bar;
  });

  // Park each bar off its entry side, pre-skewed.
  bars.forEach((bar) => {
    const fromLeft = bar.dataset.fromLeft === "true";
    gsap.set(bar, { skewX: -12, xPercent: fromLeft ? -130 : 130 });
  });

  // Cover: slide all bars to centre with a stagger.
  await gsap.to(bars, {
    xPercent: 0,
    duration: 0.3,
    stagger: { each: 0.03, from: "start" },
    ease: "power3.out",
  });

  swap(); // fired under full cover

  // Reveal: the whole stack (overlay) exits upward together — one viewport up.
  await gsap.to(overlay, {
    yPercent: -100,
    duration: 0.25,
    ease: "power3.in",
  });

  gsap.killTweensOf([overlay, ...bars]);
  overlay.remove();
};
