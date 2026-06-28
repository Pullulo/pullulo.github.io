/**
 * Shared GSAP entry point. Register every plugin exactly once here and import
 * `gsap` from this module everywhere else so plugins are guaranteed available.
 *
 * All GSAP plugins are free as of 2025 (CLAUDE.md §1).
 */
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";

let registered = false;

if (!registered) {
  gsap.registerPlugin(SplitText, MorphSVGPlugin, DrawSVGPlugin, Flip);
  registered = true;
}

export { gsap, SplitText, MorphSVGPlugin, DrawSVGPlugin, Flip };
