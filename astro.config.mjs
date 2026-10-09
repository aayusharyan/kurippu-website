import { defineConfig } from 'astro/config';

// Static output with very little client JavaScript; most of it is the sticky-note demo that covers the landing page.
// `site` is the public origin. sitemap.xml, robots.txt, llms.txt and the og:image tags are all
// built from it, because crawlers need absolute URLs.
export default defineConfig({
  site: 'https://kurippu.yush.dev',
  output: 'static',
});
