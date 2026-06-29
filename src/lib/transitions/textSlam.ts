/**
 * textSlam — heading entrance (CLAUDE.md §5 #5).
 *
 * Finds every [data-slam] element on the page, splits into chars via SplitText,
 * then slams each char from 1.6× scale / ±8° rotation / -40px to its natural
 * resting place with ease-slam + a tiny overshoot.
 */
import { gsap, SplitText } from "../gsap";
import { shouldReduceMotion } from "./_shared";

export function textSlam(): void {
  // Reduced motion: leave headings in place, no slam (they're already visible).
  if (shouldReduceMotion()) return;

  const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-slam]"));
  if (!targets.length) return;

  targets.forEach((target) => {
    const split = new SplitText(target, { type: "chars" });
    if (!split.chars.length) return;

    gsap.fromTo(
      split.chars,
      {
        scale: 1.6,
        y: -40,
        opacity: 0,
        rotation: (i: number) => (i % 2 === 0 ? 8 : -8),
      },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        rotation: 0,
        duration: 0.055,
        stagger: 0.04,
        ease: "power4.out",
        clearProps: "transform,opacity",
        onComplete: () => split.revert(),
      },
    );
  });
}
