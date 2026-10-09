# Kurippu website

![Kurippu: stick a note on any website. A browser window with three sticky notes on it.](https://raw.githubusercontent.com/aayusharyan/kurippu-website/main/.github/hero.png)

The landing page and privacy policy for [Kurippu](https://github.com/aayusharyan/kurippu), a free and open-source Chrome extension for sticking notes on any website. Right-click, write, done: the note comes back exactly where you left it.

This repository contains **the website only**. The extension's source lives in the [main Kurippu repository](https://github.com/aayusharyan/kurippu).

The site is static HTML, and the landing page is itself a live sticky-note demo: visitors can add, drag and edit notes anywhere on it, the way the extension does on any other page.

- **Three pages:** `/` (landing page), `/privacy/` (privacy policy) and a 404 page that the host serves for any unknown URL.
- **Little JavaScript, no framework:** only the landing page is interactive. It loads one script of about 22 kB (9 kB gzipped), nearly all of it the demo, plus a small scroll-in animation helper and a tiny inline platform check that picks the ⌘ or Ctrl label. The privacy policy and the 404 page are plain HTML with no notes. Builds with a Google Analytics ID also include the consent control, and Google's own script loads only after a visitor opts in.
- **Privacy-first analytics:** the extension has no analytics. The website loads Google Analytics only after explicit consent, keeps all advertising features disabled, and never sends visitor-written demo notes. Fonts and other assets remain self-hosted.

## Tech stack

- [Astro](https://astro.build) with static output (`output: 'static'`), no UI framework
- TypeScript in strict mode
- Plain CSS: a hand-written design system called "Classical", using the fonts Cormorant Garamond and Lora
- Node.js ≥ 22.12, the minimum Astro 7 requires. `.nvmrc` pins 22 (`nvm use`); the latest 22.x also avoids an npm engine warning from the `undici` package, which asks for ≥ 22.19 but isn't exercised by this site.

## Getting started

```sh
git clone https://github.com/aayusharyan/kurippu-website.git kurippu-site
cd kurippu-site
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload on port 4321. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm run check` | Type-check the project (`astro check`). |

There is no test suite or linter yet. Before opening a pull request, make sure `npm run check` and `npm run build` both pass.

## Project structure

```text
src/
  pages/
    index.astro           the landing page (/)
    privacy.astro         the privacy policy (/privacy/)
    404.astro             the not-found page (built to dist/404.html)
    sitemap.xml.ts        /sitemap.xml, listing every page in this folder except the 404
    robots.txt.ts         /robots.txt (search engines and AI crawlers welcome)
    llms.txt.ts           /llms.txt, a short plain-text summary for AI agents
    llms-full.txt.ts      /llms-full.txt, the full plain-text description
  layouts/Base.astro      <head>, meta tags, favicon links, platform check
  components/
    sections/             one component per landing-page section, the header included
    AnalyticsConsent.astro  opt-in control and delayed Google Analytics loader
    Icon.astro, Key.astro, Logo.astro, SiteFooter.astro
  scripts/
    notes/                the live sticky-note demo (the only substantial client JS)
    arrivals.ts           one-time scroll-in animations
    icons.ts              SVG icon paths shared by Astro markup and the demo
  styles/
    classical.css         design tokens and shared component classes
    fonts.css             @font-face rules for the self-hosted fonts
    global.css, notes.css page-level and demo styles
  assets/fonts/           self-hosted font files
  config.ts               site-wide settings (see Configuration)
public/                   favicons, icons and the social preview images (og-*.png, 1200x630), served as-is
astro.config.mjs          Astro settings, including the public `site` origin
firebase.json, .firebaserc  Firebase Hosting settings and project (see Releases)
.github/
  ISSUE_TEMPLATE/         bug report and feature request forms
  PULL_REQUEST_TEMPLATE.md
  dependabot.yml          weekly npm and GitHub Actions dependency updates
  hero.png                README hero image, 1280x640, also the file to upload as the repository social preview
  workflows/release.yml   manual validation, deployment and release workflow
```

## Configuration

Site-wide settings live in [`src/config.ts`](src/config.ts):

| Export | Purpose |
| --- | --- |
| `GOOGLE_ANALYTICS_ID` | Validated GA4 measurement ID read from `PUBLIC_GOOGLE_ANALYTICS_ID` at build time. |
| `SITE_VERSION` | `v` plus the `version` in `package.json`, shown in the footer as `(v0.1.0)`. Don't edit it by hand: the **Create Release** workflow bumps `package.json`. |
| `href(path)` | Prefixes a site-internal path with Astro's configured `base`, so links keep working if the site is served from a sub-path. |
| `absoluteUrl(site, path)` | Turns a site path into an absolute URL for the sitemap, `robots.txt` and `llms.txt`. Throws if `site` is not set. |

To serve from a sub-path, set `base` in [`astro.config.mjs`](astro.config.mjs). `site` there is the public origin (`https://kurippu.yush.dev`); change it if the domain changes, because the files in the next section and the social preview image tags are all built from it.

## Search engines and AI agents

The site publishes a few files so that crawlers and AI agents can find it and understand what Kurippu is. They are Astro endpoints in `src/pages/` that need no dependencies and are built from `site`:

| File | What it is |
| --- | --- |
| `/sitemap.xml` | Every page except the 404. New pages in `src/pages/*.astro` are picked up automatically. |
| `/robots.txt` | Allows everyone, names the main AI crawlers explicitly, and points to the sitemap. |
| `/llms.txt` | A short Markdown summary and page index, following the [llms.txt convention](https://llmstxt.org). |
| `/llms-full.txt` | The whole product in one plain-text file: how it works, sync, privacy, permissions, browser support and the FAQ. |

The landing page also carries schema.org `SoftwareApplication` data (JSON-LD, written into `<head>` by `Base.astro`).

`Base.astro` also writes the link-preview tags for every page: `og:title`, `og:description`, `og:type`, `og:site_name`, `og:url`, a canonical link, the `og:image` set and `twitter:card` (`summary_large_image`, which reuses the Open Graph tags). Title and description come from each page's `title` and `description` props. A page uses `og-home.png` unless it passes its own `image` (a 1200x630 file in `public/`, for example `image="og-404.png"`) together with an `imageAlt`. A page served at many URLs, like the 404 page, passes `canonical={false}` so it gets no `og:url` or canonical link.

The two `llms` files repeat facts from the landing page and the privacy policy **by hand**. When that copy changes, update them too, and keep them to what the site already says.

## How the live demo works

Everything under `src/scripts/notes/` belongs to the demo, which `index.astro` mounts:

- The whole landing page is the note surface: `index.astro` mounts the board on its page wrapper (`data-scope="page"`), not on a boxed-off demo area.
- **⌘/Ctrl + click** anywhere on the page adds a note, and so does **right-clicking** anywhere, which opens a fake browser context menu with "Add sticky note here". Links, buttons, form fields, existing notes and anything marked `data-nonote` are left alone.
- A plain click inside a `[data-demo]` zone (the hero and the redesign mock site) shows a hint to hold ⌘/Ctrl. That hint is all `data-demo` controls.
- A note attaches to the nearest ancestor with a `data-scope` attribute. Notes can be dragged, switched between edit and preview, given checklists, and recoloured.
- Notes render through a deliberately tiny Markdown subset (`markdown.ts`), always as text and never as HTML.
- Notes are saved in the visitor's own `localStorage` under `kurippu-site-notes-vXX`. Note content is not sent anywhere. If you change the shape of a saved note, or rename or remove an anchor that visitor notes may hang from, bump the key's version suffix so stale data is dropped. Editing a seed in `seeds.ts` needs no bump: a board saved against older seeds keeps the visitor's own notes and picks up the current seeds on load.
- A "Reset notes" button appears once the board differs from its seed notes.

The analytics choice is stored separately under `kurippu-site-google-analytics-consent-v1`. Google Analytics is never requested before the visitor opts in. After consent, GA4 measures page views, UTM campaign attribution and every button and link click, and can set first-party analytics cookies. Click events use code-defined identifiers rather than visible page text, so visitor-written demo note content is never included. Advertising storage, advertising user data, advertising personalization and Google signals stay disabled. The footer's "Analytics settings" control lets a visitor change that decision.

Astro supplies the environment mode, so `NODE_ENV` does not need to be set manually. During `npm run dev`, either button dismisses the analytics panel normally, but the choice is not saved and the component receives no GA4 measurement ID. The panel therefore returns after every refresh without sending data. `npm run build` produces the production behavior, and `npm run preview` serves that production build: when `PUBLIC_GOOGLE_ANALYTICS_ID` is set, the panel follows the saved choice and Google Analytics can load only after opt-in. A local production build without the variable omits both the panel and the analytics loader.

## Deployment

The site is hosted on Firebase Hosting, in the Firebase project `kurippu-510919`. The public address is <https://kurippu.yush.dev>, a custom domain connected to that project. Firebase also serves the same build at its default address, <https://kurippu-510919.web.app>.

Two files hold the hosting setup:

- [`firebase.json`](firebase.json) serves `dist/` and sends every `.txt` file (`robots.txt`, `llms.txt`, `llms-full.txt`) as UTF-8 plain text. Firebase serves `dist/404.html` for any unknown URL.
- [`.firebaserc`](.firebaserc) names `kurippu-510919` as the default project.

Production deploys go through the release workflow below.

A build without `PUBLIC_GOOGLE_ANALYTICS_ID` has no consent panel and no analytics loader, so don't deploy one to production. With the ID, the site still makes no request to Google until a visitor opts in.

Every absolute URL the site prints (canonical links, `og:url`, `og:image`, the sitemap, `robots.txt` and both `llms` files) is built from `site` in [`astro.config.mjs`](astro.config.mjs). It is `https://kurippu.yush.dev`, so the copy served at the `web.app` address also names `kurippu.yush.dev` as its canonical URL.

## Releases

A release is one manual run of the **Create Release** workflow ([`.github/workflows/release.yml`](.github/workflows/release.yml)): Actions, Create Release, Run workflow, then pick `minor` or `major`. There is no patch bump, so the version is always `X.Y.0`.

The run does this, in order, and stops at the first failure:

1. Reads the latest `vX.Y.Z` tag and works out the next version. It fails if `package.json` is not at the version of that tag.
2. Writes the new version to `package.json` and `package-lock.json`. The footer reads it from there, so the deployed site shows the version being released.
3. Runs `npm run check`, then `npm run build` with `PUBLIC_GOOGLE_ANALYTICS_ID` taken from the `GOOGLE_ANALYTICS_ID` repository variable. It fails if that is not a GA4 measurement ID (`G-` followed by letters and digits).
4. Packs `dist/` as `kurippu-site-vX.Y.0.tar.gz` and keeps it as a workflow artifact for 31 days.
5. Deploys `dist/` to the live Firebase Hosting channel with the latest `firebase-tools`.
6. Commits the version bump as `chore: bump version to X.Y.0`, pushes it to `main`, then creates and pushes the `vX.Y.0` tag.
7. Publishes a GitHub Release for that tag, with generated notes covering everything since the previous tag and the tarball attached.

The commit and tag are pushed only after the deploy succeeds, so every tag on `main` is a version that went live. If the deploy fails, nothing is tagged and the run can simply be started again. Two runs never overlap: a second one waits for the first.

The workflow needs these repository settings:

| Setting | Kind | Value |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | variable | `kurippu-510919` |
| `GOOGLE_ANALYTICS_ID` | variable | the GA4 web measurement ID, `G-ABC123DEF4` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | secret | the JSON key of a service account allowed to deploy to Firebase Hosting |

It pushes straight to `main` with the workflow's own token, so branch protection on `main` must allow that.

## Contributing

Contributions are welcome, whether that is a typo fix, an accessibility improvement or a bug report. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

To report a security problem, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

AI coding agents working on this repository should read [AGENTS.md](AGENTS.md).

## Forking this site

You are free to fork it under the MIT License. If you reuse it for a different product, replace the Kurippu name, logo, copy and contact email, and **rewrite the privacy policy** so it describes your own product. The policy here describes Kurippu's extension and would be wrong for anything else.

## License

Released under the [MIT License](LICENSE). Bundled fonts and icons keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
