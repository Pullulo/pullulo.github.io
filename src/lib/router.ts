/**
 * Astro View Transitions router hook — Phase 3 full wiring.
 *
 * Handles two classes of animation:
 * 1. Navigation swap transitions (astro:before-swap) — cover the DOM swap.
 * 2. Page entrance animations (astro:page-load) — play on the new page content.
 *
 * Routing table mirrors CLAUDE.md §6.
 */
import { slashWipe }   from "./transitions/slashWipe";
import { paperTear }   from "./transitions/paperTear";
import { alloutBurst } from "./transitions/alloutBurst";
import { eyecatch }    from "./transitions/eyecatch";
import { textSlam }    from "./transitions/textSlam";
import { staggerCards } from "./transitions/staggerCards";

type SwapFn = (swap: () => void) => Promise<void>;

function norm(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

// CLAUDE.md §6 swap-transition table
function pickSwap(from: string, to: string): SwapFn {
  if (to === "/publications") {
    // Research → Publications: paperTear (adjacent, natural progression)
    // All other → Publications: alloutBurst (the one dramatic finisher)
    return from === "/research" ? paperTear : alloutBurst;
  }
  if (to === "/resume")         return paperTear;
  if (to === "/presentations")  return slashWipe;
  if (to === "/research")       return slashWipe;
  return slashWipe; // default for Home and any other route
}

let initialized = false;

export function initRouter(): void {
  if (initialized) return;
  initialized = true;

  // ── Navigation swap transitions ──────────────────────────────────────────
  document.addEventListener("astro:before-swap", (raw: Event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const e = raw as unknown as { from: URL; to: URL; swap: () => void };
    const from = norm(e.from?.pathname ?? "/");
    const to   = norm(e.to?.pathname   ?? "/");
    const fn   = pickSwap(from, to);
    const orig = e.swap;

    e.swap = () => fn(orig);
  });

  // ── Page entrance animations ─────────────────────────────────────────────
  // astro:page-load fires after EVERY navigation (including initial load),
  // after the swap transition has finished and new content is in the DOM.
  document.addEventListener("astro:page-load", () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Still run textSlam / staggerCards even in reduced motion; they have no
      // dramatic motion — just a quick fade via clearProps is fine.
      textSlam();
      staggerCards();
      return;
    }

    const path = norm(window.location.pathname);

    if (path === "/") {
      // Home: eyecatch burst → textSlam on the name → cards
      eyecatch().then(() => {
        textSlam();
        staggerCards();
      });
    } else {
      // All other pages: heading + cards animate in immediately
      textSlam();
      staggerCards();
    }
  });
}
