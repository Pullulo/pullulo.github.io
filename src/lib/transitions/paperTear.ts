/**
 * paperTear — tears the ACTUAL current page. A live clone of the page is laid
 * over the top; the real DOM swaps to the new page beneath it; then a jagged
 * rip opens from a point and tears OUTWARD through the clone (feTurbulence paper
 * fibres), peeling the current page away to reveal the new one. No black cover.
 * ~560ms.
 *
 * We clone the page (rather than use the native View-Transition snapshot) because
 * Astro disables the VT API whenever the OS requests reduced motion — this works
 * regardless of that setting.
 */
import { gsap } from "../gsap";
import { createOverlay, crossfade, shouldReduceMotion, type SwapTransition } from "./_shared";

const HOLE_N = 22;
const UNIT: Array<{ ang: number; rf: number }> = Array.from({ length: HOLE_N }, (_, i) => {
  const base = (i / HOLE_N) * Math.PI * 2;
  const spike = i % 2 === 0 ? 1 : 0.62;
  return { ang: base + (Math.random() - 0.5) * 0.18, rf: spike * (0.82 + Math.random() * 0.36) };
});
const OX = 46;
const OY = 50;

function holeClip(r: number, rot: number): string {
  const hole = UNIT.map(({ ang, rf }) => {
    const a = ang + rot;
    const x = OX + r * rf * Math.cos(a);
    const y = OY + r * rf * Math.sin(a) * 1.18;
    return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
  });
  return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${hole.join(", ")}, ${hole[0]})`;
}

function ensureFilter(): void {
  if (document.getElementById("paper-rough-filter-host")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "paper-rough-filter-host";
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  svg.innerHTML = `<defs>
    <filter id="paper-rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.01 0.03" numOctaves="3" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
  document.documentElement.appendChild(svg);
}

export const paperTear: SwapTransition = async (swap) => {
  if (shouldReduceMotion()) return crossfade(swap);

  ensureFilter();
  const overlay = createOverlay();

  // The "sheet" = an opaque backing + a live clone of the current page.
  const sheet = document.createElement("div");
  Object.assign(sheet.style, {
    position: "absolute",
    inset: "0",
    overflow: "hidden",
    background: "linear-gradient(160deg, #0c0506 0%, #060606 55%, #0a0306 100%)",
    clipPath: holeClip(0, 0),
    filter: "url(#paper-rough)",
    willChange: "clip-path",
  });

  const layout = document.querySelector<HTMLElement>(".layout");
  if (layout) {
    const clone = layout.cloneNode(true) as HTMLElement;
    // Strip ids/control hooks so the inert clone can't collide with the live DOM.
    clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    clone.querySelectorAll("[data-motion-toggle]").forEach((n) => n.removeAttribute("data-motion-toggle"));
    clone.style.transform = `translateY(${-window.scrollY}px)`;
    sheet.appendChild(clone);
  }
  overlay.appendChild(sheet);

  swap(); // real DOM is now the new page, hidden behind the sheet

  // Rip a jagged hole from the point outward until the sheet is gone.
  const st = { r: 0, rot: 0 };
  await gsap.to(st, {
    r: 98,
    rot: 0.4,
    duration: 0.46,
    ease: "power2.in",
    onUpdate: () => {
      sheet.style.clipPath = holeClip(st.r, st.rot);
    },
  });

  gsap.killTweensOf([sheet, st]);
  overlay.remove();
};
