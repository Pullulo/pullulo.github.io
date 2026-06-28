/**
 * paperTear — torn-paper reveal (CLAUDE.md §5 #2).
 *
 * Two halves share a jagged complementary clip-path seam.
 * They slam together from off-screen top/bottom to cover the viewport,
 * the DOM swaps, then they burst apart revealing the new content.
 * An SVG feTurbulence+feDisplacementMap filter roughens the torn edge.
 * ~540ms total.
 */
import { gsap } from "../gsap";

// Tear-line control points [x%, y%], left → right.
// The two complementary clip-paths share these exact points.
const TEAR: ReadonlyArray<readonly [number, number]> = [
  [0, 50],  [8, 48],  [16, 53], [24, 46], [32, 52],
  [40, 49], [48, 54], [56, 47], [64, 51], [72, 50],
  [80, 53], [88, 47], [100, 50],
];

const topClip = (() => {
  const rev = [...TEAR].reverse().map(([x, y]) => `${x}% ${y}%`).join(", ");
  return `polygon(0% 0%, 100% 0%, ${rev})`;
})();

const botClip = (() => {
  const fwd = TEAR.map(([x, y]) => `${x}% ${y}%`).join(", ");
  return `polygon(${fwd}, 100% 100%, 0% 100%)`;
})();

function ensureFilter(): void {
  if (document.getElementById("paper-rough-filter-host")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "paper-rough-filter-host";
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  svg.innerHTML = `<defs>
    <filter id="paper-rough" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" seed="9" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="9"
        xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
  document.documentElement.appendChild(svg);
}

function makePanel(clip: string): HTMLDivElement {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "absolute",
    inset: "0",
    background: "var(--p5-black)",
    clipPath: clip,
    filter: "url(#paper-rough)",
    willChange: "transform",
  });
  return el;
}

export async function paperTear(swap: () => void): Promise<void> {
  ensureFilter();

  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    pointerEvents: "all",
    overflow: "hidden",
  });
  document.documentElement.appendChild(overlay);

  const top = makePanel(topClip);
  const bot = makePanel(botClip);
  overlay.append(top, bot);

  // Start off-screen (top half above viewport, bottom below)
  gsap.set(top, { y: "-100%" });
  gsap.set(bot, { y: "100%" });

  // Phase 1: slam together (fast power3.in)
  await gsap.to([top, bot], { y: "0%", duration: 0.2, ease: "power3.in" });

  swap();

  // Phase 2: tear apart with rotation (top-left, bottom-right)
  await Promise.all([
    gsap.to(top, { y: "-115%", x: "-6%", rotation: -6, duration: 0.32, ease: "power3.out" }),
    gsap.to(bot, { y: "115%",  x:  "6%", rotation:  4, duration: 0.32, ease: "power3.out" }),
  ]);

  gsap.killTweensOf([top, bot]);
  overlay.remove();
  // Filter host is lightweight; leave it for reuse on future paperTear calls.
}
