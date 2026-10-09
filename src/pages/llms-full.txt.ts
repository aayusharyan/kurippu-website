import type { APIRoute } from 'astro';
import { absoluteUrl } from '../config';

// The long form of llms.txt: one plain-text file an AI agent can read to understand the whole
// product. The facts are copied by hand from the landing page (src/components/sections/) and the
// privacy policy (src/pages/privacy.astro). When that copy changes, change this file too, and
// never claim more than the site does. Keep to facts: no competitor comparisons or superlatives.
export const GET: APIRoute = ({ site }) => {
  const body = `# Kurippu

> Kurippu is a free, open-source Chrome extension for sticking notes on any website. Right-click, write, done: your note comes back exactly where you left it, next visit, next week, on your other computer.

Home page: ${absoluteUrl(site)}
Privacy policy: ${absoluteUrl(site, 'privacy/')}
Short summary for AI agents: ${absoluteUrl(site, 'llms.txt')}
Source code: https://github.com/aayusharyan/kurippu
Chrome Web Store: https://chromewebstore.google.com/detail/gaibhdliodoodaiohhabjakiejeldikh
Contact: hello@yush.dev

## What Kurippu is

Kurippu is a free and open-source browser extension that lets you attach sticky notes to any web page. A note stays on the page it was written on and comes back when you return to that page, including on your other computers. There are no plans, no "pro" tier and no trial, and there is no server to pay for.

## How you use it

- Add a note: right-click anywhere on a page and choose "Add sticky note here" from the browser's own menu.
- If a site keeps right-click to itself (map apps, for example), hold Command (Mac) or Ctrl (Windows, Linux) and click instead. Links, buttons and text fields behave exactly as before.
- Write the note in Markdown. While you edit you see the Markdown; in preview it is neatly formatted. Pick a color for the note.
- Close the tab. The note is there when you come back.
- Notes can be dragged, minimised or deleted. Notes sit beneath a site's menus, pop-ups and dialogs, so they do not cover them. You can hide all notes on a site from the toolbar.
- The home page lists keyboard shortcuts, which can be changed at chrome://extensions/shortcuts. The shortcuts are proposals and may change while the extension is being built.
- The home page is itself a live demo, all of it and not one boxed-off area: right-click, or Command or Ctrl + click, anywhere on it to add a note.

## Notes that survive website redesigns

Each note remembers the part of the page it is stuck to, plus where it sat. When a site rearranges its layout, a note follows what it is pinned to into the new spot. For each note Kurippu saves a reference to the nearby page element, a short snippet of that element's text, and the note's position on the page. A note that cannot find its place again is not lost: it waits in the toolbar popup under "Couldn't place", where you can place it again.

## Finding notes again

The toolbar popup and options page shown on the home page are mockups. The extension is still being built, so the finished screens may look different.

- The toolbar popup lists every note on the page you are on. Click one to jump to it. Notes that lost their spot wait there to be placed. Sharing your screen? One switch hides every note.
- The options page ("the everything page") shows all notes by site or by date. You can search them, filter by color or #tag, and export or import in bulk.
- Export everything as Markdown or JSON from the options page. Import takes the same files back, on any browser.

## Sync and backup

- Browser sync works out of the box: if you are signed into your browser, your notes sync to your other computers with nothing to set up. Browsers give each extension 100 KB of sync space, which is roughly 250 short notes.
- Google Drive backup is optional and off until you sign in with Google. Kurippu keeps one encrypted backup file in a hidden app folder in your own Drive. It does not clutter your Drive and cannot see your other files. There is no size cap. Backups can run after every change, hourly or daily.
- On a new laptop, sign in and Kurippu finds the backup and merges it in. Nothing gets overwritten.
- When browser sync fills up, new notes keep saving on your computer and Kurippu nudges you to turn on Drive backup. Once it is on, there is no limit.

## Privacy

- Extension data and website analytics are separate. The extension contains no analytics, tracking pixels, crash reporters or advertising.
- Kurippu operates no server that accepts, keeps or passes along notes. Notes are held by your browser and can also be placed in your own Google Drive when you enable backup.
- Kurippu has no user account system. The optional Google sign-in connects the extension directly to Drive.
- A Drive backup is encrypted on the device before upload. Its key is derived from the Google account, so securing that account is important; 2-Step Verification is recommended.
- After a visitor consents, the website can use Google Analytics for page views, traffic sources, campaign parameters and every button and link click. Demo note text is excluded, screen recording and replay are not used, and advertising storage, advertising user data, advertising personalization and Google signals are disabled. Analytics information is shared only with Google as detailed in the privacy policy.
- The extension retains a page address only when a note is attached there. It does not assemble a record of other browsing.
- Website scripts cannot read notes because the extension draws them inside a sealed layer. Note content is not sent to the website.
- Removing Kurippu clears its data from browser storage.
- Full policy: ${absoluteUrl(site, 'privacy/')}

### What Kurippu stores for each note

The text you wrote, its color and tags, the address of the page, when it was created and edited, and the information needed to put it back in place (a reference to the nearby page element, a short snippet of that element's text, and the note's position).

### Permissions and why

- Read and change data on websites: to draw your notes on the pages you visit and find the element each note is pinned to.
- Context menus: to add "Add sticky note here" to the right-click menu.
- Storage: to save notes on your device and in browser sync.
- Identity: to sign in with Google, only when you turn on Drive backup.
- Alarms: to run hourly or daily backups if you pick those schedules.

## Open source

- The extension is free and open source. Its code is public on GitHub, so anyone can read what it stores, which permissions it uses and where it connects.
- Source code: https://github.com/aayusharyan/kurippu
- Bug reports and ideas are welcome as issues on GitHub, and anyone is free to fork the code.

## Browser support

- Google Chrome: supported.
- Microsoft Edge: supported.
- Brave: notes work; browser sync is still being tested, and Drive backup covers it.
- All three install from the Chrome Web Store. Firefox and Safari: not yet.

## Where notes cannot go

A few pages are off-limits to every browser extension: browser pages such as settings and the Web Store itself, PDFs in the built-in viewer, and other extensions' pages.

## FAQ

Q: Is it really free?
A: Yes. No plans, no "pro", no trial. It is open source too, so you can take the code from GitHub and use it directly.

Q: Are there pages I can't stick notes on?
A: A few. Browser pages like settings and the Web Store itself, PDFs in the built-in viewer, and other extensions' pages are off-limits to every extension.

Q: Can the website see my notes?
A: No. Notes are drawn in a sealed layer the page's own scripts can't read, and they are never sent to the site.

Q: What happens when browser sync fills up?
A: New notes keep saving on your computer, and Kurippu nudges you to turn on Drive backup. Once it is on, there is no limit.

Q: Will notes cover the site's menus?
A: No. They sit beneath menus, pop-ups and dialogs. You can minimise any note, or hide all of them on a site from the toolbar.

Q: How do I get my notes out?
A: From the options page, export everything as Markdown or JSON. Import takes the same files back, on any browser.

## About the name

Kurippu is the same sound in two languages. In Tamil, குறிப்பு (kuṟippu) means "a note". In Japanese, クリップ (kurippu) means "a clip". Between them is the whole idea: a note, clipped to a page.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
