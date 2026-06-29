/**
 * vehicleWipe — "phantom dash". White speed streaks rip across, then a bold
 * angular black sweep (led by a red band + a spinning star emblem) races left
 * to right to cover the screen; the swap fires under full cover and the sweep
 * tears off the right edge. Unmistakably a high-speed Persona wipe. ~560ms.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

// Angular leading edge so the sweep reads as a fast diagonal slash.
const EDGE = "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)";

function star(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

export const vehicleWipe: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();

  // Speed streaks.
  const streaks = Array.from({ length: 7 }, () => {
    const s = document.createElement("div");
    const thin = 2 + Math.random() * 6;
    Object.assign(s.style, {
      position: "absolute",
      left: "-40%",
      top: `${5 + Math.random() * 90}%`,
      width: "60%",
      height: `${thin}px`,
      background: Math.random() < 0.3 ? "var(--p5-red)" : "var(--p5-white)",
      opacity: "0.85",
      willChange: "transform",
    });
    overlay.appendChild(s);
    return s;
  });

  // Black body + red leading band.
  const band = document.createElement("div");
  Object.assign(band.style, {
    position: "absolute", top: "0", left: "0", width: "120vw", height: "100%",
    background: "var(--p5-red)", clipPath: EDGE, willChange: "transform",
  });
  const body = document.createElement("div");
  Object.assign(body.style, {
    position: "absolute", top: "0", left: "0", width: "130vw", height: "100%",
    background: "var(--p5-black)", clipPath: EDGE, willChange: "transform",
  });
  overlay.append(band, body);

  // Star emblem riding the leading edge.
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  Object.assign(svg.style, {
    position: "absolute", top: "50%", left: "0", width: "26vh", height: "26vh",
    transform: "translate(-50%,-50%)", willChange: "transform",
  });
  const poly = document.createElementNS(NS, "polygon");
  poly.setAttribute("points", star(50, 50, 46, 19));
  poly.setAttribute("fill", "var(--p5-white)");
  svg.appendChild(poly);
  overlay.appendChild(svg);

  gsap.set(streaks, { xPercent: -60, scaleX: 0.4 });
  gsap.set([band, body], { xPercent: -100 });
  gsap.set(svg, { xPercent: -120, rotation: 0 });

  const cover = gsap.timeline();
  cover.to(streaks, { xPercent: 260, scaleX: 1.6, duration: 0.3, stagger: 0.015, ease: "power2.in" }, 0);
  cover.to(band, { xPercent: 0, duration: 0.24, ease: "power3.out" }, 0.04);
  cover.to(body, { xPercent: 0, duration: 0.26, ease: "power3.out" }, 0.08);
  cover.to(svg, { xPercent: 120, rotation: 220, duration: 0.34, ease: "power2.out" }, 0.02);
  await cover.then(() => {});

  swap(); // body fully covers the viewport

  // Tear off the right edge.
  await gsap.to([band, body, svg], { xPercent: 230, duration: 0.26, ease: "power3.in", stagger: 0.02 }).then(() => {});

  gsap.killTweensOf([...streaks, band, body, svg]);
  overlay.remove();
};
