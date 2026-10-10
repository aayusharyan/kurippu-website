import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config';

// Short Markdown index (llmstxt.org) for AI agents. Facts are copied by hand from the
// landing page and privacy policy; keep them in sync with llms-full.txt too.

/** Build /llms.txt as UTF-8 plain text with absolute URLs from `site`. */
export const GET: APIRoute = ({ site }) => {
  const body = `# Kurippu

> Kurippu is a free, open-source Chrome extension for sticking notes on any website. Right-click, write, done: your note comes back exactly where you left it, next visit, next week, on your other computer.

Kurippu adds sticky notes to the pages you browse. Notes are written in Markdown, remember the part of the page they are stuck to (so they follow it when a site is redesigned), and live in your browser and, if you choose, your own Google Drive. There is no Kurippu server or account, and the extension has no analytics or ads. The extension is open source, so its code can be read on GitHub. The website uses optional Google Analytics only after a visitor consents. It measures page views, traffic sources, campaign parameters and button and link clicks, but does not receive demo note text or record or replay the screen. Kurippu works in Chrome and Microsoft Edge, and Brave. The name is a note (குறிப்பு, Tamil) and a clip (クリップ, Japanese): a note, clipped to a page.

## Pages

- [Home](${absoluteUrl(site)}): what Kurippu does, how it works, sync and backup, privacy, keyboard shortcuts, browser support, FAQ. The whole page is a live sticky-note demo: notes can be added anywhere on it
- [Privacy policy](${absoluteUrl(site, 'privacy/')}): separate disclosures for extension data, optional Drive backups and consent-based analytics on the product website
- [Chrome Web Store listing](https://chromewebstore.google.com/detail/gaibhdliodoodaiohhabjakiejeldikh): install Kurippu

## Optional

- [Source code](https://github.com/aayusharyan/kurippu): the free and open-source Kurippu extension on GitHub
- [Full description for AI agents](${absoluteUrl(site, 'llms-full.txt')}): everything above in one plain-text file, including the FAQ, the permissions and the browser support details
- Contact: hello@yush.dev
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
