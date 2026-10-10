# Launch checklist

For maintainers. Deployment and the release workflow are described in [README.md](README.md).

What is still open before the site is announced:

- [ ] **Install link.** Open [https://chromewebstore.google.com/detail/gaibhdliodoodaiohhabjakiejeldikh](https://chromewebstore.google.com/detail/gaibhdliodoodaiohhabjakiejeldikh) and confirm it shows the published Kurippu listing. The three "Add Kurippu to Chrome" buttons, the footer, the JSON-LD and both `llms` files all link there.
- [ ] **Extension claims.** Check the shipped extension against what the site says about it: no analytics or ads, no Kurippu server or account, and notes kept in the browser and, only if the user chooses, their own Google Drive.
- [ ] **Shortcuts.** Compare `src/components/sections/Shortcuts.astro` with the extension's real shortcuts. They began as design proposals, and the section and `llms-full.txt` still say they may change. Remove that wording once they are final.
- [ ] **Privacy policy.** Re-read `src/pages/privacy.astro` against the extension's actual behavior. If anything material changes, update the "Effective" date (currently 9 October 2026).
