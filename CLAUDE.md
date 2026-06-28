# Build Spec — Persona 5–Style Personal Site (baronli.org)

> **How to use this:** Save this file as `CLAUDE.md` in an empty repo, then tell Claude Code: *"Read CLAUDE.md and execute Phase 0. Stop after each phase and show me the result before continuing."* Work phase by phase — do not one-shot the whole site.

---

## 0. Your role

You are responsible for the **entire build**: scaffolding, layout, content, every transition, performance, accessibility, and a working dev server. Do not hand back partial work. After each phase, verify against that phase's acceptance criteria, then stop and report what you did before moving on.

---

## 1. Stack (decided — do not substitute)

- **Astro** (multi-page, real URLs — good for a portfolio, resume links, SEO).
- **Astro View Transitions** for nav routing (`<ClientRouter />`).
- **GSAP** for all transition choreography. All GSAP plugins are free as of 2025 — use SplitText, MorphSVG, DrawSVG, Flip freely. Register plugins once in a shared module.
- **Vanilla CSS** (no Tailwind unless you hit a wall) — the geometry here is custom `clip-path`/`skew`/`mix-blend-mode`, not utility classes.
- No backend. Static build, deployable to Netlify/Vercel/Cloudflare Pages.

The trick that makes this work: intercept Astro's `astro:before-swap` / `astro:after-swap` events to play a full GSAP transition timeline *over* the page swap, so the dramatic effect masks the content change underneath.

---

## 2. Hard constraints (non-negotiable)

- **No Atlus/Persona copyrighted assets.** Recreate the *style* with original geometry. No P5 logos, no ripped P5 font, no character art, no game splash art, no trademarked phrase art ("Take Your Heart", etc.). Coin your own short labels.
- **Fonts:** free only. Use **Anton** (heavy condensed display, skew it for headings) + **Oswald** or **Archivo** for body. Load via Fontsource or self-host, not a P5 font rip.
- **Performance:** animate only `transform` and `opacity` (and `clip-path` where unavoidable). No layout thrash. Any full-screen nav transition completes in **≤700ms**. Set `pointer-events: none` on overlays during transitions. Lighthouse performance ≥ 90 on desktop.
- **Accessibility:** respect `prefers-reduced-motion` — when set, replace every dramatic transition with a 150ms crossfade. Keep semantic landmarks, focus management on route change, a skip link, and real `alt` text on the profile photo.
- **No browser storage APIs** are needed; don't add any.

---

## 3. Design tokens

```
--p5-red:      #E60012;   /* primary */
--p5-red-deep: #B3000E;
--p5-black:    #0A0A0A;
--p5-ink:      #000000;
--p5-white:    #F2F2F2;
--p5-cyan:     #1CFEFF;   /* eyecatch accent only, mix-blend */

--skew:        -12deg;    /* default shear for panels/cards */
--ease-slam:   cubic-bezier(0.7, 0, 0.3, 1);
--dur-nav:     0.6s;
```

Rules:
- Nothing is a plain rectangle. Headings, cards, nav items, and panels are sheared (`transform: skewX(var(--skew))`) or `clip-path: polygon(...)` with jagged/angled edges. Counter-skew inner text so it stays readable.
- Add a **halftone/ben-day dot** texture as a reusable CSS layer: `radial-gradient(var(--p5-ink) 1px, transparent 1.5px)` at ~6px spacing, low opacity, as a `::before`/`::after` overlay. Do **not** use image files for this.
- High contrast only. Black/red/white. No soft midtone grays except for subtle dot texture.

---

## 4. Site content (use this exact content — it's the real site)

Identity sidebar (persistent on desktop, collapses to a top bar on mobile):
- Profile photo (placeholder `public/profile.jpg`, alt: "Baron Li standing beside a research poster").
- Name: **Baron Li** · Role: **Physics Researcher**
- Tags: Particle Detection · Fusion Diagnostics · Particle Physics
- Nav: Home · Research · Publications · Presentations · Resume
- Contact: baronjk2027@gmail.com · baronli.org
- Footer: © 2026 Baron Li

**Home**
- *About:* High school student interested in experimental physics, particle detection, fusion diagnostics, and the philosophy of science. Research spans liquid xenon detectors for medical imaging, millimeter-wave diagnostics for fusion plasmas, and particle physics instrumentation. Also reads philosophy and enjoys questions about science, knowledge, and the nature of explanation.
- *Research Highlights:*
  - **Liquid Xenon PET Detector** — Developed a novel liquid xenon time projection chamber concept for medical imaging. First-author publication in JINST.
  - **Fusion Plasma Diagnostics** — Designed and tested microwave diagnostic components including a 170 GHz waveguide notch filter for fusion plasma experiments.
- *Recent Publications:* Li, B., Ma, X., Ni, K. *A New Concept of Liquid Xenon Time Projection Chamber for Medical Imaging.* JINST, Vol. 21, Apr. 2026, C04019, DOI: 10.1088/1748-0221/21/04/C04019 → link to full Publications page.

**Research**, **Publications**, **Presentations**, **Resume** — generate well-structured placeholder layouts I can fill in, consistent with the Home styling. Publications should be a list of paper cards; Resume should be a clean scannable layout with a "Download PDF" button.

---

## 5. Transition library (build these as reusable modules)

Build each as a self-contained function in `src/lib/transitions/`, driven by GSAP timelines, callable from the router hook. Each must clean up after itself (kill timeline, remove overlay, restore `pointer-events`).

1. **`slashWipe()`** — default page-to-page. 3 full-viewport panels, `skewX(-15deg)`, parked off the left edge. GSAP staggers them translating right across the screen (red, then deep-red, then black). At full cover, fire the page swap callback, then slide panels off the right. ~600ms total.

2. **`paperTear()`** — torn-paper reveal. A full-screen overlay split into two halves along a **jagged SVG polygon** seam (irregular zigzag, not a straight line). Apply an `feTurbulence` displacement filter to the seam for paper-fiber roughness. The halves translate apart (one up-left, one down-right) with slight rotation, revealing the next page. Add a faint torn-edge shadow.

3. **`alloutBurst()`** — the high-impact "combat finisher" effect (reserve for ONE section, see §6). Full red background, halftone dots, a comic-panel CSS grid of skewed cells that pop in on a fast stagger, a big slammed original word (e.g. **"RESULT"** or **"SHOWTIME"** — your own wording, no trademarked phrases) using SplitText with per-char overshoot, then the whole thing peels off-screen on a diagonal. ~700ms.

4. **`eyecatch()`** — menu-select burst for the intro. Two stacked SVG polygons (red base + cyan top with `mix-blend-mode: screen`) whose points are re-randomized each frame for ~250ms so the shape jitters violently, then settles/clears. Use for the first paint on Home.

5. **`textSlam(target)`** — heading entrance. SplitText the heading into chars; start each scaled 1.6×, rotated ±8°, offset, transparent; slam to place with `--ease-slam` + tiny overshoot. Optional white stroke flash on impact. Use on every section `<h1>`.

6. **`staggerCards(container)`** — content reveal. Cards start offset + skewed + transparent; animate in with `back.out(1.7)`, stagger 0.06s. Use for highlight/paper/card grids.

7. **`navTilt`** (CSS, not GSAP) — nav-item hover: the item tilts/bounces, a skewed colored shape-wrapper flicks in behind it. Alternate rotation direction on odd/even items.

---

## 6. Transition assignment per section

| Route / event            | Transition                                  |
|--------------------------|---------------------------------------------|
| First load (Home)        | `eyecatch()` → then `textSlam()` on the name|
| Any section `<h1>` enter | `textSlam()`                                |
| Highlight / card grids   | `staggerCards()`                            |
| Home → Research          | `slashWipe()`                               |
| Research → Publications  | `paperTear()`                               |
| Enter **Publications**   | `alloutBurst()` (the one dramatic finisher) |
| Presentations (any nav)  | `slashWipe()`                               |
| Resume (any nav)         | `paperTear()`                               |
| Nav item hover           | `navTilt`                                    |

Wire these through a single router hook that reads the destination route and picks the matching transition. Default to `slashWipe()` for any unlisted nav.

---

## 7. Build phases (stop after each; meet the criteria before continuing)

**Phase 0 — Scaffold.** Astro project, View Transitions router enabled, GSAP installed with a shared plugin-registration module, fonts loaded, design tokens in a global stylesheet, halftone texture utility, dev server runs clean.
*Done when:* `npm run dev` serves a blank styled page with tokens applied and zero console errors.

**Phase 1 — Static site, no transitions.** All five pages, the sidebar/identity, real Home content from §4, the P5 skew/clip/halftone styling, responsive (sidebar → top bar on mobile). Looks like P5 but everything is static.
*Done when:* All routes navigate (plain), content matches §4, mobile layout works, Lighthouse a11y ≥ 95.

**Phase 2 — One transition end to end.** Implement `slashWipe()` only, wired into the router for Home ↔ Research. Get the timing, masking, and cleanup perfect on this one before generalizing.
*Done when:* Navigating Home↔Research plays the slash, the swap is hidden under full cover, no fl... no flash of unstyled content, panels fully clean up.

**Phase 3 — Full transition library.** Build the remaining transitions (`paperTear`, `alloutBurst`, `eyecatch`, `textSlam`, `staggerCards`, `navTilt`) and wire the §6 assignment table.
*Done when:* Every mapping in §6 fires correctly and each transition cleans up.

**Phase 4 — Polish + guardrails.** `prefers-reduced-motion` fallbacks (crossfade), focus management on route change, skip link, `will-change` hygiene, kill any jank. Final Lighthouse pass.
*Done when:* Reduced-motion users get calm crossfades, keyboard nav works, Lighthouse perf ≥ 90 / a11y ≥ 95, no dropped frames on nav.

---

## 8. Suggested file structure

```
src/
  layouts/BaseLayout.astro        # sidebar + <ClientRouter/> + global overlay mount
  pages/{index,research,publications,presentations,resume}.astro
  components/{Sidebar,SectionHeading,Card,HalftoneLayer}.astro
  lib/gsap.ts                     # registers plugins once
  lib/router.ts                   # before-swap/after-swap hook → picks transition
  lib/transitions/{slashWipe,paperTear,alloutBurst,eyecatch,textSlam,staggerCards}.ts
  styles/{tokens.css,global.css,navTilt.css}
public/profile.jpg
```

---

## 9. Self-review checklist (run before declaring done)

- [ ] No copyrighted P5 assets, fonts, logos, or trademarked phrase art anywhere.
- [ ] Every transition animates only transform/opacity/clip-path and cleans up its overlay + timeline.
- [ ] No flash of unstyled/old content during any swap (cover before swap).
- [ ] `prefers-reduced-motion` path tested and calm.
- [ ] Keyboard + screen-reader nav intact; focus moves to new page heading on route change.
- [ ] Mobile layout verified at 380px.
- [ ] Lighthouse: perf ≥ 90, a11y ≥ 95.
- [ ] All §4 content present and accurate.
