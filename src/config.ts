// Shared build-time settings: footer version, base-path and absolute URL helpers,
// and a validated public Google Analytics measurement ID (null when unset or invalid).

import { version } from '../package.json';

/** Site version shown in the footer, read from package.json. The Create Release workflow bumps it before building, so the footer matches the release. */
export const SITE_VERSION = `v${version}`;

/** Prefix a site-internal path with the configured base, e.g. `href('privacy/')`. */
export const href = (path = '') => import.meta.env.BASE_URL.replace(/\/?$/, '/') + path;

const analyticsId = import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID?.trim();

/** Public GA4 ID after trim and G- prefix shape check; invalid or missing values become null so the loader stays off. */
export const GOOGLE_ANALYTICS_ID: string | null = analyticsId && /^G-[A-Z0-9]+$/i.test(analyticsId) ? analyticsId : null;

/**
 * Absolute URL for a site path. Needs `site` in astro.config.mjs: sitemap.xml, robots.txt and
 * llms.txt are useless with relative URLs, so a missing `site` fails the build instead.
 */
export const absoluteUrl = (site: URL | undefined, path = '') => {
  if (!site) throw new Error('Set `site` in astro.config.mjs: sitemap.xml, robots.txt and llms.txt need absolute URLs.');
  return new URL(href(path), site).href;
};
