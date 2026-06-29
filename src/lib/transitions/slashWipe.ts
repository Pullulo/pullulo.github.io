/**
 * slashWipe — 3 skewed diagonal panels (red, deep-red, black) stagger
 * left-to-right across the viewport, cover, swap, exit right. ~600ms.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const COLORS = ["var(--p5-red)", "var(--p5-red-deep)", "var(--p5-black)"] as const;

export const slashWipe: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();

  const panels = COLORS.map((bg) => {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "absolute",
      top: "0",
      left: "-25%", // overhang so the skewed left edge starts fully off-screen
      width: "150%", // wider than viewport to cover under the -15deg shear
      height: "100%",
      background: bg,
      willChange: "transform",
    });
    overlay.appendChild(el);
    return el;
  });

  // xPercent is relative to each panel's own width (150vw).
  //  -100% → off-screen left · 0% → viewport fully covered · +100% → off right.
  gsap.set(panels, { skewX: -15, xPercent: -100 });

  // Cover: stagger panels in; black (last) lands opaque over the whole viewport.
  await gsap.to(panels, {
    xPercent: 0,
    duration: 0.22,
    stagger: 0.045,
    ease: "power3.in",
  });

  swap(); // fired under full black cover

  // Reveal: continue panels off the right edge.
  await gsap.to(panels, {
    xPercent: 100,
    duration: 0.24,
    stagger: 0.045,
    ease: "power3.out",
  });

  gsap.killTweensOf(panels);
  overlay.remove();
};
