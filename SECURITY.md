# Security policy

## Scope

This repository is the Kurippu **website**: a static landing page, a privacy policy and a small in-page sticky-note demo. It has no server, accounts or database. The only intended third-party requests are to Google Analytics, and only after a visitor explicitly allows website analytics. Reports about it are welcome, for example:

- Cross-site scripting or other injection in the live demo (notes are meant to render as text only).
- A dependency or build-pipeline problem that could put malicious code into the built site.
- Anything that makes the site contact Google before consent, sends visitor-written demo note content, enables advertising features, or contacts another unapproved third party.
- Exposed secrets or credentials in the repository.

The Kurippu **browser extension** is maintained in the [main Kurippu repository](https://github.com/aayusharyan/kurippu). If you've found a vulnerability in the extension, please say so in your report so it can be handled separately.

## Supported versions

Only the latest code on the `main` branch is supported. Fixes are not backported.

## Reporting a vulnerability

**Please don't open a public issue or pull request for a security problem.**

Email **hello@yush.dev** with:

- A description of the problem and why it matters.
- Steps to reproduce it, or a proof of concept.
- The page, file or commit involved, and your browser and version if it's relevant.

We'll do our best to reply promptly, keep you informed while we investigate, tell you when it's fixed, and credit you if you'd like. We ask that you give us a reasonable chance to fix the issue before you disclose it publicly.

## Good-faith research

We won't take action against anyone who finds and reports an issue in good faith, avoids harming other people, and doesn't access or change data that isn't theirs. Please test against a local build (`npm run dev`) rather than the live site where you can, and don't run denial-of-service tests or automated scans against production.
