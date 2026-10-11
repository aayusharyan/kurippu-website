// The welcome easter egg for visitors who have the extension. When the extension announces itself
// (presence.ts), the page waits until it has settled, plays the ribbon, and reveals a
// footer link that plays it again. Without the extension none of this ever shows.
import { watchPresence } from './presence';
import { playRibbon } from './ribbon';

/** Wait after everything has loaded so the ribbon does not compete with the hero's own arrival (its underline finishes drawing at about 0.85s). */
const SETTLE_MS = 1000;
/** The shorter beat when the tab only comes to the front after the settle time. */
const RETURN_MS = 400;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const pageLoaded = () =>
  document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((resolve) => addEventListener('load', () => resolve(), { once: true }));

/** Browsers throttle animation in a background tab, so a visitor would miss the ribbon. Wait until the tab is in front. */
const tabVisible = () =>
  !document.hidden
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const onChange = () => {
          if (document.hidden) return;
          document.removeEventListener('visibilitychange', onChange);
          resolve();
        };
        document.addEventListener('visibilitychange', onChange);
      });

export function mountWelcome() {
  const replayLink = document.querySelector<HTMLButtonElement>('[data-welcome-replay]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let present = false;
  let playing = false;

  // The replay link is for visitors who have the extension and can see motion. Reduced motion skips the ribbon, so it hides the link too.
  const syncLink = () => {
    if (replayLink) replayLink.hidden = !present || reduceMotion.matches;
  };

  async function play() {
    if (playing || reduceMotion.matches) return;
    playing = true;
    try {
      await playRibbon();
    } finally {
      playing = false;
    }
  }

  reduceMotion.addEventListener('change', syncLink);
  replayLink?.addEventListener('click', () => void play());

  watchPresence(async () => {
    present = true;
    syncLink();
    if (reduceMotion.matches) return;
    await Promise.all([pageLoaded(), document.fonts.ready]);
    await sleep(SETTLE_MS);
    if (document.hidden) {
      await tabVisible();
      await sleep(RETURN_MS);
    }
    if (reduceMotion.matches) return;
    await play();
  });
}
