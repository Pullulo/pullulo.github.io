/**
 * cardSlam — a phantom "calling card" spins in and slams flat to cover the
 * screen (swap fires here), then flips away on its vertical axis to reveal the
 * new page. Red card, black frame, halftone, white star + monogram. ~560ms.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

function starPoints(cx: number, cy: number, R: number, r: number): string {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    p.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
}

export const cardSlam: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();
  overlay.style.perspective = "1400px";

  const card = document.createElement("div");
  Object.assign(card.style, {
    position: "absolute", left: "-5vw", top: "-5vh", width: "110vw", height: "110vh",
    background: "var(--p5-red)",
    backgroundImage: "radial-gradient(rgba(10,10,10,0.45) 1.4px, transparent 1.7px)",
    backgroundSize: "10px 10px",
    boxShadow: "inset 0 0 0 14px #0a0a0a, inset 0 0 0 20px #f2f2f2",
    display: "flex", alignItems: "center", justifyContent: "center",
    transformStyle: "preserve-3d", willChange: "transform",
  });

  const emblem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  emblem.setAttribute("viewBox", "0 0 200 240");
  Object.assign(emblem.style, { width: "min(40vw,40vh)", filter: "drop-shadow(8px 8px 0 #0a0a0a)" });
  emblem.innerHTML = `
    <polygon points="${starPoints(100, 96, 86, 34)}" fill="#f2f2f2" stroke="#0a0a0a" stroke-width="4"/>
    <text x="100" y="210" text-anchor="middle"
      font-family="Anton, Impact, sans-serif" font-size="64" fill="#f2f2f2"
      stroke="#0a0a0a" stroke-width="3" letter-spacing="6">BL</text>`;
  card.appendChild(emblem);
  overlay.appendChild(card);

  // Spin in and slam flat → full cover.
  gsap.set(card, { scale: 0.15, rotateZ: -35, rotateY: 25, opacity: 0 });
  await gsap.to(card, {
    scale: 1.02, rotateZ: 0, rotateY: 0, opacity: 1,
    duration: 0.28, ease: "back.out(1.7)",
  }).then(() => {});

  swap(); // card fully covers the viewport

  // Flip away on the vertical axis to reveal.
  await gsap.to(card, {
    rotateY: 95, xPercent: 12, scale: 1.05,
    duration: 0.28, ease: "power3.in",
  }).then(() => {});

  gsap.killTweensOf(card);
  overlay.remove();
};
