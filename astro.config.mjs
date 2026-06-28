// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://baronli.org',
  // View Transitions are enabled per-page via <ClientRouter /> in BaseLayout.
  // GSAP drives the actual transition choreography over the swap.
});
