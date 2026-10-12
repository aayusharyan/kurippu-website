# Kurippu website

![Kurippu: stick a note on any website. A browser window with three sticky notes on it.](https://raw.githubusercontent.com/aayusharyan/kurippu-website/main/.github/hero.png)

The landing page and privacy policy for [Kurippu](https://github.com/aayusharyan/kurippu), a free and open-source Chrome extension for sticking notes on any website. Right-click, write, done: the note comes back exactly where you left it.

This repository contains **the website only**. The extension's source lives in the [main Kurippu repository](https://github.com/aayusharyan/kurippu).

The site is static HTML, and the landing page is itself a live sticky-note demo: visitors can add, drag and edit notes anywhere on it, the way the extension does on any other page.

- **Four pages:** `/` (landing page), `/privacy/` (privacy policy), `/uninstalled/` (an all-optional feedback form that the extension opens after someone uninstalls it; see [The uninstall feedback page](#the-uninstall-feedback-page)) and a 404 page that the host serves for any unknown URL.
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

| Command           | What it does                                       |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload on port 4321. |
| `npm run build`   | Build the static site into `dist/`.                |
| `npm run preview` | Serve the built `dist/` locally.                   |
| `npm run check`   | Type-check the project (`astro check`).            |

There is no test suite or linter yet. Before opening a pull request, make sure `npm run check` and `npm run build` both pass.

## Project structure

```text
src/
  pages/
    index.astro             the landing page (/)
    privacy.astro           the privacy policy (/privacy/)
    uninstalled.astro       the uninstall feedback page (/uninstalled/), kept out of search and the sitemap
    404.astro               the not-found page (built to dist/404.html)
    sitemap.xml.ts          /sitemap.xml, listing every page in this folder except the 404
    robots.txt.ts           /robots.txt (search engines and AI crawlers welcome)
    llms.txt.ts             /llms.txt, a short plain-text summary for AI agents
    llms-full.txt.ts        /llms-full.txt, the full plain-text description
  layouts/Base.astro        <head>, meta tags, favicon links, platform check
  components/
    sections/               one component per landing-page section, the header included
    feedback/               the uninstall form and its thank-you view
    AnalyticsConsent.astro  opt-in control and delayed Google Analytics loader
    Icon.astro, Key.astro,  Logo.astro, SiteFooter.astro
  scripts/
    notes/                  the live sticky-note demo
    welcome/                the welcome ribbon for visitors who have the extension
    feedback/               the uninstall form's behaviour (form.ts) and sending (submit.ts)
    arrivals.ts.            one-time scroll-in animations
    icons.ts                SVG icon paths shared by Astro markup and the demo
  styles/
    classical.css           design tokens and shared component classes
    fonts.css               @font-face rules for the self-hosted fonts
    global.css, notes.css   page-level and demo styles
    welcome.css             layout and motion for the welcome ribbon
  assets/fonts/             self-hosted font files
  config.ts                 site-wide settings (see Configuration)
public/                     favicons, icons and the social preview images (og-*.png, 1200x630), served as-is
astro.config.mjs            Astro settings, including the public `site` origin
firebase.json, .firebaserc  Firebase Hosting settings and project (see Releases)
.github/
  ISSUE_TEMPLATE/           bug report and feature request forms
  PULL_REQUEST_TEMPLATE.md  pre-filled pull request description: summary, screenshots and a checklist
  dependabot.yml            weekly npm and GitHub Actions dependency updates
  hero.png                  README hero image, 1280x640, also the file to upload as the repository social preview
  workflows/release.yml     manual validation, deployment and release workflow
```

## Configuration

Site-wide settings live in [`src/config.ts`](src/config.ts):

| Export                    | Purpose                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_ANALYTICS_ID`     | Validated GA4 measurement ID read from `PUBLIC_GOOGLE_ANALYTICS_ID` at build time.                                                                        |
| `SITE_VERSION`            | `v` plus the `version` in `package.json`, shown in the footer as `(v0.1.0)`. Don't edit it by hand: the **Create Release** workflow bumps `package.json`. |
| `href(path)`              | Prefixes a site-internal path with Astro's configured `base`, so links keep working if the site is served from a sub-path.                                |
| `absoluteUrl(site, path)` | Turns a site path into an absolute URL for the sitemap, `robots.txt` and `llms.txt`. Throws if `site` is not set.                                         |

To serve from a sub-path, set `base` in [`astro.config.mjs`](astro.config.mjs). `site` there is the public origin (`https://kurippu.yush.dev`); change it if the domain changes, because the files in the next section and the social preview image tags are all built from it.

## Search engines and AI agents

The site publishes a few files so that crawlers and AI agents can find it and understand what Kurippu is. They are Astro endpoints in `src/pages/` that need no dependencies and are built from `site`:

| File             | What it is                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/sitemap.xml`   | Every page except the 404. New pages in `src/pages/*.astro` are picked up automatically.                         |
| `/robots.txt`    | Allows everyone, names the main AI crawlers explicitly, and points to the sitemap.                               |
| `/llms.txt`      | A short Markdown summary and page index, following the [llms.txt convention](https://llmstxt.org).               |
| `/llms-full.txt` | The whole product in one plain-text file: how it works, sync, privacy, permissions, browser support and the FAQ. |

The landing page also carries schema.org `SoftwareApplication` data (JSON-LD, written into `<head>` by `Base.astro`).

`Base.astro` also writes the link-preview tags for every page: `og:title`, `og:description`, `og:type`, `og:site_name`, `og:url`, a canonical link, the `og:image` set and `twitter:card` (`summary_large_image`, which reuses the Open Graph tags). Title and description come from each page's `title` and `description` props. A page uses `og-home.png` unless it passes its own `image` (a 1200x630 file in `public/`, for example `image="og-404.png"`) together with an `imageAlt`. A page served at many URLs, like the 404 page, passes `canonical={false}` so it gets no `og:url` or canonical link.

The two `llms` files repeat facts from the landing page and the privacy policy **by hand**. When that copy changes, update them too, and keep them to what the site already says.

## How the live demo works

Everything under `src/scripts/notes/` belongs to the demo, which `index.astro` mounts:

- The whole landing page is the note surface: `index.astro` mounts the board on its page wrapper (`data-scope="page"`), not on a boxed-off demo area.
- **⌘/Ctrl + click** anywhere on the page adds a note, and so does **right-clicking** anywhere, which opens a fake browser context menu with "Add sticky note here". Links, buttons, form fields, existing notes and anything marked `data-nonote` are left alone.
- A plain click inside a `[data-demo]` zone (the hero and the redesign mock site) shows a hint to hold ⌘/Ctrl. That hint is all `data-demo` controls.
- A note attaches to the nearest ancestor with a `data-scope` attribute. Notes can be dragged, switched between edit and preview, given checklists, and recoloured. A note stays in edit until the visitor clicks Preview or presses ⌘/Ctrl + Enter.
- Notes render through a deliberately tiny Markdown subset (`markdown.ts`), always as text and never as HTML.
- Notes are saved in the visitor's own `localStorage` under `kurippu-site-notes-vXX`, including whether each note was left in edit or preview, so a refresh keeps that choice. Note content is not sent anywhere. If you change the shape of a saved note, or rename or remove an anchor that visitor notes may hang from, bump the key's version suffix so stale data is dropped. Editing a seed in `seeds.ts` needs no bump: a board saved against older seeds keeps the visitor's own notes and picks up the current seeds on load.
- A "Reset notes" button appears once the board differs from its seed notes.

The analytics choice is stored separately under `kurippu-site-google-analytics-consent-v1`. Google Analytics is never requested before the visitor opts in. After consent, GA4 measures page views, UTM campaign attribution and every button and link click (except controls marked `data-analytics-ignore`, see the next section), and can set first-party analytics cookies. Click events use code-defined identifiers rather than visible page text, so visitor-written demo note content is never included. Advertising storage, advertising user data, advertising personalization and Google signals stay disabled. The footer's "Analytics settings" control lets a visitor change that decision.

Astro supplies the environment mode, so `NODE_ENV` does not need to be set manually. During `npm run dev`, either button dismisses the analytics panel normally, but the choice is not saved and the component receives no GA4 measurement ID. The panel therefore returns after every refresh without sending data. `npm run build` produces the production behavior, and `npm run preview` serves that production build: when `PUBLIC_GOOGLE_ANALYTICS_ID` is set, the panel follows the saved choice and Google Analytics can load only after opt-in. A local production build without the variable omits both the panel and the analytics loader.

## The welcome ribbon

Visitors who have the extension get a small easter egg. A band of the site's own paper chips (the `.note-chip` from the install stack, at its real 26px size, in the five note colours) sweeps across the window from the top right corner, where the browser keeps the toolbar icon, to the bottom left, then clears. Everything lives in `src/scripts/welcome/` (`presence.ts`, `index.ts`, `ribbon.ts`) and `src/styles/welcome.css`, and it is mounted from `index.astro` only (not privacy or 404). Swapping install CTAs for visitors who already have the extension is not implemented yet.

- **Detection:** `presence.ts` listens for a same-window, same-origin `postMessage` with `source === 'kurippu-extension'` and `type === 'extension-present'`. Ignore unknown extra fields (forward compatible). Treat `version` as optional display or debug info; do not hard-require a minimum version. The payload carries no note data and never leaves the tab: do not send an "extension detected" event to analytics unless the privacy policy is updated on purpose. Because the extension may announce before this script runs, `presence.ts` also posts one ping `{ source: 'kurippu-extension', type: 'extension-present-ping' }` on the page origin. The extension does not announce on `localhost`, so the ribbon never plays there on its own.
- **When it plays:** after the presence message, the window `load` event and `document.fonts.ready`, plus one more second so it does not compete with the hero's arrival animation, and only while the tab is visible. It never plays under `prefers-reduced-motion: reduce`.
- **How often:** on every home-page load after the extension is detected. The site does not save or track whether the ribbon has played.
- **Replay:** the footer's "Replay the welcome animation" button is hidden until the extension is detected (and stays hidden under reduced motion). Because only extension users can see it, it carries `data-analytics-ignore`, which the click tracker in `AnalyticsConsent.astro` skips. A measured click would otherwise reveal that the extension is installed. Put the same attribute on any future control that only extension users can see.
- **Trying it locally:** run `npm run dev`, then paste this into the console after the page has loaded:

  ```js
  window.postMessage({ source: 'kurippu-extension', type: 'extension-present', version: 'dev' }, location.origin);
  ```

  The ribbon starts about a second later and the footer link appears at once. Refresh the page and post the mock message again to see the automatic play again, or click the footer link to replay it without refreshing.
- **How to verify on a deployed origin:** with the shipped extension loaded, open `https://kurippu.yush.dev` (or a Firebase host). About a second after the page settles, the ribbon should sweep across and "Replay the welcome animation" should appear in the footer. Reload: the ribbon should play again. Click the footer link: it should replay without a refresh. With "Reduce motion" on: no ribbon and no footer link.
- **Keeping it matched to the notes:** the chip's size, colours and shadow come from `.note-chip` in `notes.css`, its tilts from `CHIP_ROTS` and its colours from `HUES` in `seeds.ts`. If you change the chip there, check the ribbon too.

## The uninstall feedback page

When someone removes the extension, it opens `/uninstalled/` in a new tab (the extension sets that with `chrome.runtime.setUninstallURL`; the change lives in the extension repository). The page asks why they left. Every question is optional: reasons (pick any), how long they used it, a free-text note styled as a Kurippu note, and a tick box that reveals an email field if they are happy to be contacted about the feedback. The markup is in `src/components/feedback/` and the behaviour in `src/scripts/feedback/`.

- **Out of search:** the page carries `noindex` (`Base` takes a `noindex` prop) and is left out of `sitemap.xml`. It is not listed as a page in `llms.txt` or `llms-full.txt`; their privacy summaries still describe the intended handling of submitted feedback.
- **Nothing is sent until the visitor presses Send.** The form then posts to `https://api.kurippu.com/uninstall/`. The answers are never stored in the browser and never go to Google Analytics; the click tracker only records that the button was pressed.
- **`npm run dev` never posts.** It waits a moment and shows the thank-you view, so the whole flow can be tried locally. A production build served with `npm run preview` uses the real endpoint.
- **The receiving end has a strict contract.** The request and data-handling rules are below. If its data handling changes, update the privacy policy first.
- **Reason ids are the data.** Each reason posts a stable id (`place`, `switched` and so on), not its wording, so rewording a label changes nothing downstream. Adding or renaming an id needs the receiving end to learn it first.
- **The "How to remove it" links** point at `#managing-and-deleting-your-data` in the privacy policy, so keep that `id` on the section.

### Uninstall feedback endpoint contract

The form sends a `POST` request to `https://api.kurippu.com/uninstall/` with `Content-Type: application/json`, no cookies (`credentials: 'omit'`) and no referrer (`referrerPolicy: 'no-referrer'`). Because this is a different origin from the website, the endpoint must answer the browser's CORS preflight.

```json
{
  "version": 1,
  "reasons": ["place", "switched"],
  "switchedTo": "My notes app",
  "duration": "weeks",
  "message": "Notes drifted after a site redesign.",
  "email": "you@example.com"
}
```

Every field except `version` and `reasons` is left out when empty. `reasons` is always present and may be an empty array.

| Field        | Type       | Notes                                                                                          |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `version`    | number     | Payload version, currently `1`. Bumped when the shape changes.                                 |
| `reasons`    | string[]   | Any number of reason ids, in page order.                                                       |
| `switchedTo` | string     | At most 100 characters. Only sent when `switched` is in `reasons`.                             |
| `duration`   | string     | One of `day`, `days`, `weeks`, `months`.                                                       |
| `message`    | string     | At most 1,000 characters, plain text. Treat it as untrusted text and never render it as HTML.  |
| `email`      | string     | At most 254 characters. Only sent when the visitor asked for a reply and entered an address. Validate it again at the endpoint. |

The reason ids are `place`, `expected`, `broke`, `inway`, `permissions`, `switched`, `moment` and `other`. Their labels live in `src/components/feedback/FeedbackForm.astro`.

Any `2xx` status is a success and shows the thank-you view. Anything else, a network error or no answer within 15 seconds shows the retry notice, and the visitor's answers stay in the form. The response body is ignored.

The receiving end must:

- Reject bodies that are not JSON, have an unknown `version` or exceed the limits above.
- Store only the fields in the request body. Do not add an IP address, user-agent string, timestamp or other metadata to the feedback record.
- Drop obvious abuse without adding metadata to the stored record. The form has a hidden decoy field; when a bot fills it in, the form pretends to succeed and sends nothing.
- Keep submissions in Aayush Sinha's private database in Japan, accessible only to Aayush Sinha, and never give them to a third party.
- Use submissions only to improve Kurippu and, when the visitor requested a reply, respond about that feedback.
- Keep submissions without a fixed expiry until the visitor asks for deletion through `hello@yush.dev`, then delete the answers and email address.
- Never log request bodies separately from the private feedback record.

Before changing the endpoint, confirm that this contract still matches `src/pages/privacy.astro`. Keep `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` in sync with the privacy policy, and update the endpoint URL here and in `src/scripts/feedback/submit.ts` together.

## Deployment

The site is hosted on Firebase Hosting, in the Firebase project `kurippu-510919`. The public address is <https://kurippu.yush.dev>, a custom domain connected to that project. Firebase also serves the same build at its default addresses, <https://kurippu-510919.web.app> and <https://kurippu-510919.firebaseapp.com>.

Two files hold the hosting setup:

- [`firebase.json`](firebase.json) serves `dist/` and sends every `.txt` file (`robots.txt`, `llms.txt`, `llms-full.txt`) as UTF-8 plain text. Firebase serves `dist/404.html` for any unknown URL.
- [`.firebaserc`](.firebaserc) names `kurippu-510919` as the default project.

Production deploys go through the release workflow below.

A build without `PUBLIC_GOOGLE_ANALYTICS_ID` has no consent panel and no analytics loader, so don't deploy one to production. With the ID, the site still makes no request to Google until a visitor opts in.

Every absolute URL the site prints (canonical links, `og:url`, `og:image`, the sitemap, `robots.txt` and both `llms` files) is built from `site` in [`astro.config.mjs`](astro.config.mjs). It is `https://kurippu.yush.dev`, so the copy served at the `web.app` / `firebaseapp.com` addresses also names `kurippu.yush.dev` as its canonical URL.

## Releases

A release is one manual run of the **Create Release** workflow ([`.github/workflows/release.yml`](.github/workflows/release.yml)): Actions, Create Release, Run workflow, then pick `minor` or `major`. There is no patch bump, so the version is always `X.Y.0`.

The run does this, in order, and stops at the first failure:

1. Reads the latest `vX.Y.Z` tag and works out the next version. It fails if `package.json` is not at the version of that tag.
2. Writes the new version to `package.json` and `package-lock.json`. The footer reads it from there, so the deployed site shows the version being released.
3. Runs `npm run check`, then `npm run build` with `PUBLIC_GOOGLE_ANALYTICS_ID` taken from the `GOOGLE_ANALYTICS_ID` repository variable. It fails if that is not a GA4 measurement ID (`G-` followed by letters and digits).
4. Packs `dist/` as `kurippu-site-vX.Y.0.tar.gz` and keeps it as a workflow artifact for 31 days.
5. Deploys `dist/` to the live Firebase Hosting channel with the latest `firebase-tools`.
6. Commits the version bump as `chore: bump version to X.Y.0`, pushes it to `main`, then creates and pushes the `vX.Y.0` tag.
7. Publishes a GitHub Release for that tag. The notes list each commit since the previous tag (subject and short hash), with a compare link, and the tarball is attached. The first release lists the whole history.

The commit and tag are pushed only after the deploy succeeds, so every tag on `main` is a version that went live. If the deploy fails, nothing is tagged and the run can simply be started again. Two runs never overlap: a second one waits for the first.

The workflow needs these repository settings:

| Setting                         | Kind     | Value                                                                   |
| ------------------------------- | -------- | ----------------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`           | variable | `kurippu-510919`                                                        |
| `GOOGLE_ANALYTICS_ID`           | variable | the GA4 web measurement ID, `G-ABC123DEF4`                              |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | secret   | the JSON key of a service account allowed to deploy to Firebase Hosting |

It pushes straight to `main` with the workflow's own token, so branch protection on `main` must allow that.

## Contributing

Contributions are welcome, whether that is a typo fix, an accessibility improvement or a bug report. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

To report a security problem, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

AI coding agents working on this repository should read [AGENTS.md](AGENTS.md).

## Forking this site

You are free to fork it under the MIT License. If you reuse it for a different product, replace the Kurippu name, logo, copy and contact email, and **rewrite the privacy policy** so it describes your own product. The policy here describes Kurippu's extension and would be wrong for anything else.

## License

Released under the [MIT License](LICENSE). Bundled fonts and icons keep their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
