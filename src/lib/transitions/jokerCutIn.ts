/**
 * jokerCutIn — a Persona-style character "cut-in". A red halftone panel slams
 * in from the right with comic burst-lines, and an original masked face (white
 * domino mask, glowing yellow eyes) punches in. The swap fires under cover, then
 * the whole cut-in rips off to the left. ~560ms.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const NS = "http://www.w3.org/2000/svg";

export const jokerCutIn: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();

  // Full-viewport red panel (guaranteed cover) + halftone.
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "absolute", inset: "0", background: "var(--p5-red)",
    backgroundImage: "radial-gradient(rgba(10,10,10,0.5) 1.4px, transparent 1.6px)",
    backgroundSize: "9px 9px", willChange: "transform",
  });
  overlay.appendChild(panel);

  // Comic burst lines radiating from the focal point.
  const burst = document.createElementNS(NS, "svg");
  burst.setAttribute("viewBox", "0 0 100 100");
  burst.setAttribute("preserveAspectRatio", "xMidYMid slice");
  Object.assign(burst.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const w = i % 2 === 0 ? 1.6 : 0.7;
    const tri = document.createElementNS(NS, "polygon");
    const x1 = 50 + Math.cos(a - 0.02 * w) * 90, y1 = 50 + Math.sin(a - 0.02 * w) * 90;
    const x2 = 50 + Math.cos(a + 0.02 * w) * 90, y2 = 50 + Math.sin(a + 0.02 * w) * 90;
    tri.setAttribute("points", `50,50 ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
    tri.setAttribute("fill", i % 2 === 0 ? "rgba(10,10,10,0.18)" : "rgba(242,242,242,0.12)");
    burst.appendChild(tri);
  }
  panel.appendChild(burst);

  // Masked face caricature.
  const face = document.createElementNS(NS, "svg");
  face.setAttribute("viewBox", "0 0 240 150");
  Object.assign(face.style, {
    position: "absolute", left: "50%", top: "52%", width: "min(62vw, 60vh)",
    transform: "translate(-50%,-50%)", willChange: "transform",
    filter: "drop-shadow(6px 8px 0 rgba(10,10,10,0.6))",
  });
  face.innerHTML = `
    <!-- head silhouette -->
    <path d="M40,150 C40,96 80,70 120,70 C160,70 200,96 200,150 Z" fill="#0a0a0a"/>
    <!-- white domino mask band -->
    <path d="M26,66 C22,40 78,40 116,54 C154,40 218,40 214,66
             C216,84 168,84 150,72 C132,62 108,62 90,72
             C72,84 24,84 26,66 Z" fill="#f2f2f2" stroke="#0a0a0a" stroke-width="3"/>
    <!-- angular brows -->
    <polygon points="52,52 104,60 100,68 56,62" fill="#0a0a0a"/>
    <polygon points="188,52 136,60 140,68 184,62" fill="#0a0a0a"/>
    <!-- glowing eyes -->
    <polygon points="64,64 96,60 92,76 66,76" fill="#ffe800"/>
    <polygon points="176,64 144,60 148,76 174,76" fill="#ffe800"/>
    <circle cx="80" cy="69" r="4.5" fill="#0a0a0a"/>
    <circle cx="160" cy="69" r="4.5" fill="#0a0a0a"/>
  `;
  overlay.appendChild(face);

  gsap.set(panel, { xPercent: 110, skewX: -6 });
  gsap.set(burst, { transformOrigin: "50% 50%", rotation: -20, scale: 1.2, opacity: 0 });
  gsap.set(face, { xPercent: 60, scale: 0.5, opacity: 0, rotation: -8 });

  const cover = gsap.timeline();
  cover.to(panel, { xPercent: 0, skewX: 0, duration: 0.22, ease: "power4.out" }, 0);
  cover.to(burst, { opacity: 1, rotation: 0, duration: 0.3, ease: "none" }, 0.04);
  cover.to(face, { xPercent: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.24, ease: "back.out(2.2)" }, 0.08);
  await cover.then(() => {});

  swap(); // red panel fully covers here

  // Hold on the cut-in with a tiny punch so it registers before exiting.
  const hold = gsap.timeline();
  hold.to(face, { scale: 1.08, duration: 0.08, ease: "power2.out" });
  hold.to(face, { scale: 1, duration: 0.08, ease: "power2.in" });
  hold.to({}, { duration: 0.06 });
  await hold.then(() => {});

  // Spin the burst slowly while the cut-in rips away to the left.
  gsap.to(burst, { rotation: 18, duration: 0.3, ease: "none" });
  await gsap.to([panel, face], { xPercent: -130, duration: 0.28, ease: "power3.in", stagger: 0.04 }).then(() => {});

  gsap.killTweensOf([panel, burst, face]);
  overlay.remove();
};
