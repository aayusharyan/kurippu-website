# Launch checklist

For maintainers. Deployment and the release workflow are described in [README.md](README.md).

What is still open before the site is announced:

- [ ] **Install link.** Open [https://chromewebstore.google.com/detail/gaibhdliodoodaiohhabjakiejeldikh](https://chromewebstore.google.com/detail/gaibhdliodoodaiohhabjakiejeldikh) and confirm it shows the published Kurippu listing. The three "Add Kurippu to Chrome" buttons, the footer, the JSON-LD and both `llms` files all link there.
- [ ] **Shortcuts.** Compare `src/components/sections/Shortcuts.astro` with the extension's real shortcuts. They began as design proposals, and the section and `llms-full.txt` still say they may change. Remove that wording once they are final.
- [ ] **Uninstall feedback.** Confirm `https://api.kurippu.com/uninstall/` follows the contract in README → ["The uninstall feedback page"](README.md#the-uninstall-feedback-page) and the handling disclosed in `src/pages/privacy.astro`. The extension already opens `https://kurippu.yush.dev/uninstalled/` on removal. If the implementation changes what is collected or kept, update the policy and its "Effective" date before release.
