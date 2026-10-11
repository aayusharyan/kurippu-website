import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config';

/** Pages that stay out of the sitemap: the 404 has no address of its own, and /uninstalled/ is only ever reached from the extension's uninstall link. */
const UNLISTED_PAGES = ['404', 'uninstalled'];

// sitemap.xml built from every *.astro page in this folder except the unlisted ones, so new pages
// appear without a hand edit. Only the glob keys are used; the page modules are never imported.
const routes = Object.keys(import.meta.glob('./*.astro'))
  .map((file) => file.slice('./'.length, -'.astro'.length))
  .filter((name) => !UNLISTED_PAGES.includes(name))
  .map((name) => (name === 'index' ? '' : `${name}/`))
  .sort();

/** Build /sitemap.xml with absolute <loc> URLs from `site` and the routes list above. */
export const GET: APIRoute = ({ site }) => {
  const urls = routes.map((path) => `  <url><loc>${absoluteUrl(site, path)}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
