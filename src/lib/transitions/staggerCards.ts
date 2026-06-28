/**
 * staggerCards — content reveal for card/highlight grids (CLAUDE.md §5 #6).
 *
 * Finds every [data-card] element on the page; animates each from
 * offset + skewed + transparent to its natural state using back.out(1.7),
 * staggered 0.06s.
 */
import { gsap } from "../gsap";

export function staggerCards(): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-card]"));
  if (!cards.length) return;

  gsap.fromTo(
    cards,
    { y: 40, opacity: 0, skewX: -8 },
    {
      y: 0,
      opacity: 1,
      skewX: 0,
      duration: 0.45,
      stagger: 0.06,
      ease: "back.out(1.7)",
      clearProps: "transform,opacity",
    },
  );
}
