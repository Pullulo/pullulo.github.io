/**
 * Astro View Transitions router hook.
 *
 * Navigation swaps now pick ONE of the 10 pooled transitions at random
 * (no fixed route→transition table), with two rules:
 *   • never the same transition twice in a row;
 *   • allOutBurst is rare — weighted to ~1-in-8.
 *
 * Section-entrance animations (textSlam, staggerCards) and the one-time Home
 * eyecatch are NOT part of the random pool — they stay on astro:page-load.
 */
import { slashWipe }        from "./transitions/slashWipe";
import { paperTear }        from "./transitions/paperTear";
import { horizontalBlinds } from "./transitions/horizontalBlinds";
import { allOutBurst }      from "./transitions/allOutBurst";
import { shapeShatter }     from "./transitions/shapeShatter";
import { vehicleWipe }      from "./transitions/vehicleWipe";
import { eyecatchJitter }   from "./transitions/eyecatchJitter";
import { spotlight }        from "./transitions/spotlight";
import { jokerCutIn }       from "./transitions/jokerCutIn";
import { cardSlam }         from "./transitions/cardSlam";
import {
  shouldReduceMotion,
  motionEnabled,
  toggleMotion,
  type SwapTransition,
} from "./transitions/_shared";

import { eyecatch }     from "./transitions/eyecatch";
import { textSlam }     from "./transitions/textSlam";
import { staggerCards } from "./transitions/staggerCards";
import { gsap }         from "./gsap";

interface PoolEntry {
  name: string;
  fn: SwapTransition;
  weight: number;
}

// Integer weights → allOutBurst is exactly 1/8: 9 / (9 + 9·7) = 9/72 = 1/8.
const COMMON = 7;
const RARE = 9;

const POOL: PoolEntry[] = [
  { name: "slashWipe",        fn: slashWipe,        weight: COMMON },
  { name: "paperTear",        fn: paperTear,        weight: COMMON },
  { name: "horizontalBlinds", fn: horizontalBlinds, weight: COMMON },
  { name: "shapeShatter",     fn: shapeShatter,     weight: COMMON },
  { name: "vehicleWipe",      fn: vehicleWipe,      weight: COMMON },
  { name: "eyecatchJitter",   fn: eyecatchJitter,   weight: COMMON },
  { name: "spotlight",        fn: spotlight,        weight: COMMON },
  { name: "jokerCutIn",       fn: jokerCutIn,       weight: COMMON },
  { name: "cardSlam",         fn: cardSlam,         weight: COMMON },
  { name: "allOutBurst",      fn: allOutBurst,      weight: RARE }, // the rare 1-in-8
];

let lastName: string | null = null;
let forcedName: string | null = null; // dev-only test seam

function pickTransition(): PoolEntry {
  // Dev test override: use a forced transition exactly once.
  if (forcedName) {
    const forced = POOL.find((p) => p.name === forcedName);
    forcedName = null;
    if (forced) {
      lastName = forced.name;
      return forced;
    }
  }

  // Exclude the previous transition so it can't repeat back-to-back.
  const candidates = lastName ? POOL.filter((p) => p.name !== lastName) : POOL;
  const total = candidates.reduce((sum, p) => sum + p.weight, 0);

  let r = Math.random() * total;
  let chosen = candidates[candidates.length - 1];
  for (const c of candidates) {
    r -= c.weight;
    if (r < 0) {
      chosen = c;
      break;
    }
  }
  lastName = chosen.name;
  return chosen;
}

function norm(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

let initialized = false;
let isFirstLoad = true;

export function initRouter(): void {
  if (initialized) return;
  initialized = true;

  // Dev-only seam: lets tests force a specific transition and observe picks.
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__setNextTransition = (name: string) => {
      forcedName = name;
    };
    (window as unknown as Record<string, unknown>).__transitionNames = POOL.map((p) => p.name);
    (window as unknown as Record<string, unknown>).__txPicks = [];
    // Slow GSAP's global timeline so tests can screenshot the covered frame.
    (window as unknown as Record<string, unknown>).__setTimeScale = (n: number) =>
      gsap.globalTimeline.timeScale(n);
  }

  // ── Navigation swap transitions (random pool) ──────────────────────────────
  //
  // IMPORTANT: Astro fires astro:before-swap / after-swap / page-load *before*
  // our async transition actually replaces the DOM (our orig() swap runs partway
  // through the GSAP timeline). So all post-swap work — entrance animations,
  // focus, toggle sync — must be driven from the transition itself, NOT from
  // astro:page-load (which still sees the OLD page on a navigation).
  document.addEventListener("astro:before-swap", (raw: Event) => {
    const e = raw as unknown as { swap: () => void };
    const entry = pickTransition();

    if (import.meta.env.DEV) {
      (
        (window as unknown as Record<string, unknown>).__txPicks as string[] | undefined
      )?.push(entry.name);
    }

    const astroSwap = e.swap;

    // Wrap the real swap so the instant the new DOM lands (still hidden under the
    // transition cover) we sync the freshly-rendered toggle and kick off the
    // heading/card entrances — they then play as the transition reveals.
    const orig = () => {
      astroSwap();
      syncMotionToggle();
      textSlam();
      staggerCards();
    };

    // Each transition self-handles prefers-reduced-motion (calm crossfade).
    // After the reveal completes, move focus to the new page's heading.
    e.swap = () => entry.fn(orig).then(() => manageFocus());
  });

  // ── Motion toggle (sidebar control) ────────────────────────────────────────
  // Delegated so it survives body swaps; flips effective motion + re-syncs label.
  document.addEventListener("click", (ev) => {
    const btn = (ev.target as HTMLElement | null)?.closest<HTMLElement>("[data-motion-toggle]");
    if (!btn) return;
    ev.preventDefault();
    toggleMotion();
    syncMotionToggle();
  });

  // ── First paint only: initial entrance + toggle sync ────────────────────────
  // (Navigations are handled by the wrapped swap above; page-load on a nav still
  // sees the old DOM, so we only act here for the genuine first load.)
  document.addEventListener("astro:page-load", () => {
    if (!isFirstLoad) return;
    isFirstLoad = false;

    syncMotionToggle();
    const path = norm(window.location.pathname);

    if (path === "/" && !shouldReduceMotion()) {
      eyecatch().then(() => {
        textSlam();
        staggerCards();
      });
    } else {
      textSlam();
      staggerCards();
    }
  });
}

/** Move focus to the first heading of the freshly-swapped page. */
function manageFocus(): void {
  const heading = document.querySelector<HTMLElement>("main h1, #main h1");
  const target = heading ?? document.getElementById("main");
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  // preventScroll so focusing doesn't fight the transition / jump the page.
  target.focus({ preventScroll: true });
}

/** Reflect the current effective motion state onto every sidebar toggle. */
function syncMotionToggle(): void {
  const on = motionEnabled();
  document.querySelectorAll<HTMLElement>("[data-motion-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(on));
    const label = btn.querySelector<HTMLElement>("[data-motion-label]");
    if (label) label.textContent = on ? "On" : "Reduced";
    btn.setAttribute(
      "aria-label",
      on ? "Animations on. Activate to reduce motion." : "Motion reduced. Activate to enable animations.",
    );
  });
}
