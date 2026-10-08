import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config';

// Every page in src/pages except the 404 page, so a new page shows up here without an edit.
// Only the keys are used: the page modules themselves are never imported.
const routes = Object.keys(import.meta.glob('./*.astro'))
  .map((file) => file.slice('./'.length, -'.astro'.length))
  .filter((name) => name !== '404')
  .map((name) => (name === 'index' ? '' : `${name}/`))
  .sort();

export const GET: APIRoute = ({ site }) => {
  const urls = routes.map((path) => `  <url><loc>${absoluteUrl(site, path)}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
