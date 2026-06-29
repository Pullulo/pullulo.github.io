/**
 * shapeShatter — the screen is a pane of glass. It's struck at a point (white
 * flash), a spider-web of cracks snaps across it, then every shard flies apart
 * omnidirectionally to reveal the new page. Persona-5 all-out-attack glass.
 * ~660ms.
 *
 * The pane is a web of shards built on a shared vertex grid (sectors × rings),
 * so neighbours share edges and tile gaplessly — total cover at the swap. Each
 * shard then flies along its own outward bearing.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const SECTORS = 14;
const RINGS = [0, 16, 34, 56, 150]; // % radii; last ring is well past the corners
const IX = 50;
const IY = 46;
const ASPECT = 1.15; // bias vertical so the web reaches the top/bottom edges

const SHARD_BG = [
  "linear-gradient(135deg, #181818 0%, #0b0b0b 70%)",
  "linear-gradient(135deg, #210307 0%, #0b0b0b 72%)",
  "linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 75%)",
];

export const shapeShatter: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  const overlay = createOverlay();

  // Shared vertex grid V[sector][ring] (sectors wrap). Per-vertex jitter for
  // irregular, glassy shards; shared vertices keep the tiling seamless.
  const ang = Array.from({ length: SECTORS }, (_, i) => (i / SECTORS) * Math.PI * 2 + (Math.random() - 0.5) * 0.16);
  const V: Array<Array<[number, number]>> = [];
  for (let i = 0; i < SECTORS; i++) {
    V[i] = [];
    for (let j = 0; j < RINGS.length; j++) {
      if (j === 0) { V[i][j] = [IX, IY]; continue; }
      const r = RINGS[j] * (1 + (Math.random() - 0.5) * 0.16);
      V[i][j] = [IX + r * Math.cos(ang[i]), IY + r * Math.sin(ang[i]) * ASPECT];
    }
  }
  const pt = ([x, y]: [number, number]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`;

  interface Shard { el: HTMLDivElement; dir: number; }
  const shards: Shard[] = [];
  for (let i = 0; i < SECTORS; i++) {
    const ni = (i + 1) % SECTORS;
    for (let j = 1; j < RINGS.length; j++) {
      const a = V[i][j - 1], b = V[ni][j - 1], c = V[ni][j], d = V[i][j];
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "absolute",
        inset: "0",
        background: SHARD_BG[(i + j) % SHARD_BG.length],
        clipPath: `polygon(${pt(a)}, ${pt(b)}, ${pt(c)}, ${pt(d)})`,
        transformOrigin: `${IX}% ${IY}%`,
        willChange: "transform, opacity",
      });
      overlay.appendChild(el);
      shards.push({ el, dir: ang[i] + (ang[ni] - ang[i]) / 2 });
    }
  }

  // Crack web (sector spokes + ring polylines) — flashes in at the strike.
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  Object.assign(svg.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
  const addLine = (p: [number, number], q: [number, number], w: string) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", p[0].toFixed(1)); l.setAttribute("y1", p[1].toFixed(1));
    l.setAttribute("x2", q[0].toFixed(1)); l.setAttribute("y2", q[1].toFixed(1));
    l.setAttribute("stroke", w); l.setAttribute("stroke-width", "0.35");
    l.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(l);
  };
  for (let i = 0; i < SECTORS; i++) {
    addLine(V[i][1], V[i][RINGS.length - 1], "rgba(255,255,255,0.55)"); // spokes
    for (let j = 1; j < RINGS.length - 1; j++) addLine(V[i][j], V[(i + 1) % SECTORS][j], "rgba(255,255,255,0.32)"); // rings
  }
  overlay.appendChild(svg);
  gsap.set(svg, { opacity: 0 });

  const flash = document.createElement("div");
  Object.assign(flash.style, {
    position: "absolute", left: `${IX}%`, top: `${IY}%`, width: "55vmax", height: "55vmax",
    transform: "translate(-50%,-50%) scale(0)", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(230,0,18,0.5) 35%, transparent 68%)",
  });
  overlay.appendChild(flash);

  // Quick cover, then swap beneath the intact pane.
  gsap.set(shards.map((s) => s.el), { opacity: 1 });
  swap();

  // Strike: flash + crack web snap in, and hold briefly so the cracks read.
  const strike = gsap.timeline();
  strike.fromTo(flash, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.22, ease: "power3.out" }, 0);
  strike.to(svg, { opacity: 1, duration: 0.04 }, 0.05);
  strike.to({}, { duration: 0.12 }); // hold the cracked pane
  await strike.then(() => {});

  // Shatter: every shard flies along its own bearing, spinning out (rings stagger).
  await Promise.all(
    shards.map((s, k) => {
      const dist = 60 + Math.random() * 80;
      return gsap.to(s.el, {
        xPercent: Math.cos(s.dir) * dist,
        yPercent: Math.sin(s.dir) * dist * ASPECT,
        rotation: (Math.random() - 0.5) * 200,
        scale: 0.65,
        opacity: 0,
        duration: 0.4,
        ease: "power3.in",
        delay: (k % (RINGS.length - 1)) * 0.012 + Math.random() * 0.04,
      }).then(() => {});
    }),
  );

  gsap.killTweensOf([...shards.map((s) => s.el), svg, flash]);
  overlay.remove();
};
