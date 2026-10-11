// Learns whether the extension is installed in this browser.
// Accept same-window, same-origin postMessage with source 'kurippu-extension' and type 'extension-present'.
// Ignore unknown fields; version is optional. Payload never includes notes and never leaves the tab
// (no network, no analytics). See README → "The welcome ribbon".

const SOURCE = 'kurippu-extension';

/** Calls `onPresent` once, the first time the extension announces itself. */
export function watchPresence(onPresent: () => void) {
  let found = false;
  window.addEventListener('message', (event) => {
    if (found || event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || data.source !== SOURCE || data.type !== 'extension-present') return;
    found = true;
    onPresent();
  });
  // The extension announces once, when it loads, which can be before this script runs. Ask again so a
  // late listener still hears it. If the extension has not loaded yet, its own announcement arrives later.
  window.postMessage({ source: SOURCE, type: 'extension-present-ping' }, location.origin);
}
