import { version } from '../package.json';

// Launch blockers from the design handoff. Fill these in before going live.

/** Site version shown in the footer, read from package.json. The Create Release workflow bumps it before building, so the footer matches the release. */
export const SITE_VERSION = `v${version}`;

/** Prefix a site-internal path with the configured base, e.g. `href('privacy/')`. */
export const href = (path = '') => import.meta.env.BASE_URL.replace(/\/?$/, '/') + path;

/** Chrome Web Store listing. Placeholder until the listing is live. */
export const CHROME_STORE_URL = '#';

/** Install buttons use the 404 page until the Chrome Web Store listing is live. */
export const INSTALL_URL = CHROME_STORE_URL === '#' ? href('404/') : CHROME_STORE_URL;

/** Public source repository for the Kurippu extension. */
export const EXTENSION_REPOSITORY_URL = 'https://github.com/aayusharyan/kurippu';

/** Website repository file that contains bundled third-party licenses. */
export const THIRD_PARTY_NOTICES_URL = 'https://github.com/aayusharyan/kurippu-website/blob/main/THIRD_PARTY_NOTICES.md';

/** Shown in the privacy policy. `null` renders the highlighted "[contact email]" placeholder. */
export const CONTACT_EMAIL: string | null = 'hello@yush.dev';

const analyticsId = import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID?.trim();

/** Public GA4 measurement ID used by the consent-gated website analytics loader. */
export const GOOGLE_ANALYTICS_ID: string | null = analyticsId && /^G-[A-Z0-9]+$/i.test(analyticsId) ? analyticsId : null;

/**
 * Spread onto every link that leaves the site (GitHub, Google, mailto), as `<a {...NEW_TAB}>`, so it opens in a
 * new tab. Not for the Chrome Web Store links: that is the product, so it opens in the same tab.
 */
export const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** The Chrome Web Store URL once the listing is live, else `null`, so machine-readable files never point at the placeholder. */
export const CHROME_STORE_LISTING: string | null = CHROME_STORE_URL === '#' ? null : CHROME_STORE_URL;

/**
 * Absolute URL for a site path. Needs `site` in astro.config.mjs: sitemap.xml, robots.txt and
 * llms.txt are useless with relative URLs, so a missing `site` fails the build instead.
 */
export const absoluteUrl = (site: URL | undefined, path = '') => {
  if (!site) throw new Error('Set `site` in astro.config.mjs: sitemap.xml, robots.txt and llms.txt need absolute URLs.');
  return new URL(href(path), site).href;
};
