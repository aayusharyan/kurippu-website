// Astro site config for a fully static build.
// `site` is the public origin used wherever absolute URLs are required.

import { defineConfig } from 'astro/config';

// Sitemap, robots.txt, llms.txt, and og:image tags all expand from this origin.
export default defineConfig({
  site: 'https://kurippu.yush.dev',
  // No server runtime: every page is pre-rendered into dist/.
  output: 'static',
});
