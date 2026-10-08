import { defineConfig } from 'astro/config';

// Static output; only the sticky-note island ships JavaScript.
// `site` is the public origin. sitemap.xml, robots.txt, llms.txt and the og:image tags are all
// built from it, because crawlers need absolute URLs.
export default defineConfig({
  site: 'https://kurippu.yush.dev',
  output: 'static',
});
