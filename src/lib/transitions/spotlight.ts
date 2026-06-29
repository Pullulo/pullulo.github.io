/**
 * spotlight — a "flashlight" search. The screen drops to black except a soft
 * red-rimmed circle of light that sweeps across, then snaps shut to full black
 * (swap fires here), and finally re-opens from a point to reveal the new page.
 * Evokes Persona 5's infiltration searchlights. ~560ms.
 *
 * A single overlay whose radial-gradient hole is the light: hole radius 0 = full
 * black cover, growing radius = reveal. No black background-colour (the hole must
 * show the live page through it).
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

function lightGradient(r: number, cx: number, cy: number): string {
  const inner = Math.max(0, r * 0.82);
  const rim = Math.max(0, r * 0.93);
  return (
    `radial-gradient(circle ${r}px at ${cx}% ${cy}%,` +
    ` transparent ${inner}px,` +
    ` rgba(230,0,18,0.55) ${rim}px,` +
    ` rgba(10,10,10,0.99) ${r}px)`
  );
}

export const spotlight: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();
  const big = Math.max(window.innerWidth, window.innerHeight);
  const st = { r: big * 0.42, cx: 28, cy: 35 };
  const paint = () => {
    overlay.style.backgroundImage = lightGradient(st.r, st.cx, st.cy);
  };
  paint();

  const tl = gsap.timeline();
  // Search: sweep the light to another spot while tightening it.
  tl.to(st, { cx: 72, cy: 60, r: big * 0.3, duration: 0.2, ease: "sine.inOut", onUpdate: paint });
  // Snap shut → full black cover.
  tl.to(st, { r: 0, cx: 50, cy: 50, duration: 0.16, ease: "power3.in", onUpdate: paint });
  await tl.then(() => {});

  swap(); // fully black here

  // Re-open from the centre to reveal the new page.
  await gsap.to(st, {
    r: big * 1.25,
    duration: 0.32,
    ease: "power2.out",
    onUpdate: paint,
  }).then(() => {});

  gsap.killTweensOf(st);
  overlay.remove();
};
