# Contributing to the Kurippu website

Thanks for taking the time to help. This repository is the Kurippu **website** (landing page and privacy policy). Fixes and improvements of every size are welcome: typos, copy, accessibility, performance, bugs in the live demo, and documentation.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** or **suggest an improvement** by opening an issue. Search existing issues first.
- **Fix something small** (typo, broken link, styling glitch) by opening a pull request directly.
- **Propose something bigger** (a new section, a redesign, a new dependency) by opening an issue first, so we can agree on the approach before you spend time on it.
- **Report a security or privacy problem** privately, following [SECURITY.md](SECURITY.md). Please don't open a public issue for it.

Questions about the Kurippu extension itself (as opposed to this site) belong in the [main Kurippu repository](https://github.com/aayusharyan/kurippu), because the extension's source isn't part of this repository.

## Setting up

You need Node.js ≥ 22.12 (`.nvmrc` pins 22, so `nvm use` works) and npm.

```sh
git clone <your-fork-url> kurippu-site
cd kurippu-site
npm install
npm run dev     # http://localhost:4321
```

[README.md](README.md) describes the project layout, configuration and the live demo.

## Project principles

These are the rules the site is built around. Pull requests that break one will be asked to change.

1. **Keep the privacy promises.** The extension has no analytics or trackers. On the website, Google Analytics is the only approved analytics service: it loads only after explicit consent, all advertising features stay disabled, and visitor-written demo notes are never sent. Don't add other analytics, tag managers, third-party scripts, embeds, hosted fonts, CDNs, cookies, or requests to domains the project doesn't control. The site stores demo notes and the Google Analytics consent choice in `localStorage`; GA4 may set first-party analytics cookies after consent. If a change alters what the site collects, sends or stores, update `src/pages/privacy.astro` in the same pull request.
2. **Keep dependencies few.** Pages are rendered to static HTML at build time, with no UI framework. Think twice before adding any dependency, especially a runtime one.
3. **Respect reduced motion.** Every animation needs a `prefers-reduced-motion: reduce` fallback.
4. **Accessible by default.** Use semantic elements, keep everything keyboard-operable, give interactive controls accessible names, and keep text contrast readable. The demo's notes are a good example to follow.
5. **Claims match the extension.** The site describes what the Kurippu extension does. Don't add a feature claim or a keyboard shortcut you can't back up.
6. **Use the design tokens.** Colours, fonts and spacing come from the CSS custom properties in `src/styles/classical.css`. Don't hard-code new colours or font stacks in components.

## The demo notes mirror the extension

Styling, layout, copy and accessibility changes across the site are welcome. The sticky notes in the live demo are the exception. They are a replica of the Kurippu extension's own UI: the note and its controls (Edit/Preview, colour swatches, checklist rows, delete), the right-click menu and the reset button. Changing how they look or behave isn't straightforward, because the extension's UI would have to change to match. Otherwise the site would show something the extension doesn't do.

The extension's source is in the [main Kurippu repository](https://github.com/aayusharyan/kurippu), so please open an issue first if you want to change the notes' look or behaviour, and we'll work out how to change both together. Bug fixes that leave the notes looking and behaving the same are welcome as a pull request. The relevant files are `src/scripts/notes/` and `src/styles/notes.css`, plus the context menu rules in `src/styles/global.css`.

## Code style

There is no formatter or linter configured, so match the code around you.

- TypeScript is `strict`. Avoid `any`, and use `!` only where the markup guarantees the element exists.
- Two-space indentation, single quotes, semicolons, LF line endings. [`.editorconfig`](.editorconfig) covers the basics.
- Astro components keep their styles in a scoped `<style>` block. Global rules belong in `src/styles/`.
- Give non-trivial functions a short doc comment, and use comments to explain **why**, not to restate what the code does.
- Keep one landing-page section per file in `src/components/sections/`.
- Write copy in plain, friendly sentences, in the same voice as the existing page.

## Making a change

1. Fork the repository and create a branch from `main`.
2. Make your change, keeping the pull request focused on one thing.
3. Run the checks, which must pass:

   ```sh
   npm run check
   npm run build
   ```

4. Look at the result in a browser with `npm run dev` or `npm run preview`, at desktop and phone widths. For changes to the demo, try adding, dragging, editing and resetting notes, and with a keyboard only.
5. Open a pull request using the template. Describe what changed and why, and add before/after screenshots for visual changes.

Commit messages should have a short, imperative subject line ("Fix note drag on touch screens"), with detail in the body if it helps. Smaller commits are easier to review.

## Adding assets and dependencies

- **Fonts, icons, images:** only add material whose license allows redistribution, and record its copyright notice and required license text in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Choose the asset directory intentionally:** put component and stylesheet dependencies in `src/assets/`. Astro tracks these references, copies only referenced files, gives their output content-hashed filenames, and rewrites the generated URLs. Images used with Astro's `<Image>` or `<Picture>` components can also be resized, converted and optimised at build time. Put files in `public/` only when they should be copied unchanged and keep a predictable public URL, such as favicons and Open Graph images. A file being referenced by a component does not by itself mean that it belongs in `src/assets/`; choose based on whether Astro should process and manage it or preserve its public path.
- **npm packages:** explain in the pull request why one is needed and what it costs in bundle size. `package-lock.json` must be updated along with `package.json`.

## Licensing of contributions

This project is released under the [MIT License](LICENSE). By submitting a contribution you confirm that you have the right to do so, and you agree that it is licensed under the same terms.

## AI-assisted contributions

Using an AI coding tool is fine. You remain responsible for everything you submit: read and understand the change, run the checks yourself, and don't open pull requests you haven't reviewed. Agents working in this repository should follow [AGENTS.md](AGENTS.md).

## Getting your pull request merged

A maintainer will review it as time allows. Expect questions and requests for changes, which are a normal part of the process and not a judgment on you. Once it's approved and the checks pass, it will be merged.
