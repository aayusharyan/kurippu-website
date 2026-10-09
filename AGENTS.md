# AGENTS.md

Instructions for AI coding agents working in this repository, whichever tool or model you are. Humans should start with [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md); this file adds what an agent needs on top of them.

## Hard rules

### 1. Do not run git commands

**Never run any `git` command unless the user explicitly asks you to, in the current conversation.** This covers read-only commands (`git status`, `git diff`, `git log`, `git show`, `git blame`) as well as anything that changes state (`add`, `commit`, `push`, `pull`, `fetch`, `checkout`, `switch`, `restore`, `reset`, `revert`, `rebase`, `merge`, `stash`, `branch`, `tag`, `clean`, `rm`, `mv`, `worktree`, and so on).

- If the user does ask, run only what they asked for. Permission to commit is not permission to push, and permission given earlier in a session does not carry over to a new task.
- Don't reach the same result by another route: the `gh` CLI for branch, PR or repository operations, `npm version` (it commits and tags by default), IDE or GUI git integrations, or scripts and hooks that wrap git.
- Don't read, edit or delete anything inside `.git/`.
- Leave your work uncommitted in the working tree. In your final message, list the files you created, changed and deleted so the user can review them and use git themselves.
- If a task seems to need git (for example "see what changed"), work from the files instead, or ask the user.

### 2. Keep the privacy promises

There are two separate things here. Don't mix them up.

- **The extension has no analytics.** No analytics, trackers, tracking pixels, crash reporters or ads. That promise belongs to the extension, which is the product. This site exists to sell the extension, so its copy (landing page, privacy policy, `llms.txt`, `llms-full.txt`) says so, and nothing you write may claim, imply or add anything that contradicts it. The extension's source is not in this repository.
- **The website may measure its own visitors, within limits.** Google Analytics (GA4) is the website's only approved analytics service. It measures how visitors find and use the product website (for example Add to Chrome clicks), not anything the extension does, so it is not a breach of the promise above and you shouldn't treat it as one. Its limits: it must load only after explicit consent, advertising storage, advertising user data, advertising personalization and Google signals must stay disabled, and visitor-written demo note content must never be sent.

Never add other analytics, tag managers, third-party scripts or embeds, hosted fonts, CDNs, cookies, or requests to any domain the project doesn't control. The site stores demo notes and the Google Analytics consent choice in `localStorage`; GA4 may set first-party analytics cookies after consent. If a change alters what the site collects, sends or stores, update `src/pages/privacy.astro` too and tell the user.

### 3. Stay in scope

- Make the change that was asked for, and no more. Don't reformat or refactor unrelated code.
- Don't add dependencies without asking. This is a static Astro site with no UI framework, and that is deliberate.
- Don't edit generated or installed directories: `dist/`, `.astro/`, `node_modules/`.
- Don't create secrets, credentials or `.env` files in the repo.
- Don't invent facts about the Kurippu extension (features, shortcuts, permissions). The site must only claim what is true. If you aren't sure, ask.
- Don't change the look or behaviour of the demo notes (the sticky note and its controls, the demo context menu, the toast and the reset button) unless the user asks. They replicate the extension's UI, so changing them without changing the extension makes the site show something the extension doesn't do. Site-wide polish such as hover states and micro-interactions applies to links and page chrome only.

### 4. Do not use em dashes

**Never write an em dash (—, U+2014)** anywhere: site copy, code, comments, documentation, commit messages (if you are asked to write any) or your replies to the user. Use another form of punctuation instead:

- a normal hyphen (`-`) with spaces around it, as in the page titles ("Kurippu - Privacy policy")
- a comma, colon or parentheses
- a full stop, splitting the sentence in two

## Project snapshot

The landing page (`/`), privacy policy (`/privacy/`) and 404 page for Kurippu, a Chrome extension for sticking notes on websites. The site exists to present and sell the extension. The extension's source is **not** in this repository.

- **Stack:** Astro 7 (static output), TypeScript (strict), plain CSS. No UI framework. Node ≥ 22.12.
- **Client JS:** the live sticky-note demo (`src/scripts/notes/`), scroll-in animations (`src/scripts/arrivals.ts`), a tiny inline platform check in `src/layouts/Base.astro`, and the consent-gated Google Analytics loader (`src/components/AnalyticsConsent.astro`).
- **No tests and no linter.** The checks are the type-checker and the build.

## Commands

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve dist/
npm run check     # astro check (type-check)
```

Before you report a task as done, run `npm run check` and `npm run build` and make sure both pass. If you start `npm run dev` or `npm run preview`, run it in the background and stop it when you are finished. Don't leave servers running.

## Where things live

| To change… | Look in… |
| --- | --- |
| Landing-page copy or layout | `src/components/sections/*.astro`, composed in `src/pages/index.astro` |
| Privacy policy | `src/pages/privacy.astro` (update the "Effective …" date when the policy materially changes) |
| 404 page | `src/pages/404.astro` (the host serves it for any unknown URL, so keep its links and assets root-relative with `href()`) |
| Sitemap, `robots.txt`, `llms.txt`, `llms-full.txt` | `src/pages/sitemap.xml.ts`, `robots.txt.ts`, `llms.txt.ts`, `llms-full.txt.ts`, all built from `site` in `astro.config.mjs` |
| `<head>`, meta tags, favicons | `src/layouts/Base.astro` |
| Google Analytics consent and loading | `src/components/AnalyticsConsent.astro`, with the measurement ID read in `src/config.ts` |
| Colours, fonts, spacing tokens | `src/styles/classical.css` (use these tokens, don't hard-code values) |
| Page-level and demo styles | `src/styles/global.css`, `src/styles/notes.css` |
| The live demo | `src/scripts/notes/` (`board.ts` is the controller, `note.ts` renders one note, `physics.ts` is the swing, `markdown.ts` is the tiny Markdown subset, `seeds.ts` holds the starter notes) |
| Icons | `src/scripts/icons.ts` (Lucide paths only; see `THIRD_PARTY_NOTICES.md`) |
| Google Analytics ID, base-path helper, site version (read from `package.json`, shown in the footer) | `src/config.ts` |

## Conventions

- Two-space indent, single quotes, semicolons, LF endings (see `.editorconfig`). Match the surrounding code.
- Astro components keep styles in a scoped `<style>` block. Short doc comments explain **why**, not what.
- Every animation needs a `prefers-reduced-motion: reduce` fallback.
- Use semantic HTML, give interactive controls accessible names, and keep everything keyboard-operable.
- Links that leave the site (GitHub, Google, `mailto:`) open in a new tab: write `target="_blank" rel="noopener noreferrer"` on the `<a>`, or set `newTab: true` on a `SiteFooter` link. Chrome Web Store links are the exception, because that is the product, and stay in the same tab. Internal links and `#` anchors stay in the same tab too.
- Write typographic punctuation in markup as HTML entities, not literal characters: `&rsquo;` `&ldquo;` `&rdquo;` `&hellip;` `&middot;` `&larr;` `&copy;`, and `&#8984;` and `&#8997;` for the Command and Option key symbols (they have no named entity). Entities only decode as markup text, so copy held in a frontmatter array is rendered with `set:html` (static copy only, never visitor text). The `title`, `description` and `imageAlt` props of `Base` may use entities too: `Base` decodes them before they reach `<title>` and the `<meta>` tags. Keep the literal characters in JSON-LD (so a `description` that is also fed to JSON-LD must have none), the notes scripts and the `.txt` endpoints, where an entity would show up as text.
- Demo notes render as text via `textContent`. `innerHTML` is only used with the static SVG strings from `icons.ts`. Never feed user-entered text into `innerHTML` or `set:html`.
- In `npm run dev`, either analytics consent button dismisses the panel, but the choice must not be saved and Google Analytics must never load. The panel must return after every refresh. Production builds use the real opt-in behavior. Keep this split on Astro's `import.meta.env.DEV` and `PROD` flags rather than a manually managed `NODE_ENV`.
- If you change the shape of a saved note, or rename or remove a `data-scope` anchor that visitor notes may hang from, bump the version suffix of `KEY` in `src/scripts/notes/board.ts` (currently `kurippu-site-notes-v6`) so stale `localStorage` data is dropped. Editing, adding or moving a seed in `seeds.ts` needs no bump: saved boards are stamped with the seeds they were made against, and on load a board saved against older seeds keeps the visitor's own notes and takes the current seeds.

## Keep docs in sync

- Update `README.md` when you change commands, structure or configuration, and this file when you change the rules or layout above.
- The contact email (`hello@yush.dev`) is written by hand in `src/pages/privacy.astro`, `src/pages/llms.txt.ts`, `src/pages/llms-full.txt.ts`, `CODE_OF_CONDUCT.md` and `SECURITY.md`. Change all five together.
- `src/pages/llms.txt.ts` and `llms-full.txt.ts` repeat facts from the landing page and the privacy policy by hand. When that copy changes, change them too, and never let them claim more than the site does.
- Add any new third-party font, icon or image, with its license, to `THIRD_PARTY_NOTICES.md`.

## Reporting back

When you finish, say what you changed and which files, which commands you ran and whether they passed, and anything you could not verify. Mention that you made no git changes, and leave committing to the user.
