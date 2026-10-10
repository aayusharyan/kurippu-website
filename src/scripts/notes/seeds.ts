// Starter notes pinned to page sections, plus the shared Note shape and palette.
// Visitor notes keep ids starting with "n"; seed ids must never do that.

/** Palette cycled when a visitor adds a note. */
export const HUES = [85, 145, 235, 20, 305] as const;

export interface Note {
  id: string;
  /** `data-scope` of the container the note is pinned to. */
  scope: string;
  /** Left edge as a percentage of the container width. */
  xp: number;
  /** Top edge in px from the container top. */
  y: number;
  hue: number;
  rot: number;
  mode: 'edit' | 'preview';
  text: string;
  z: number;
  lifted?: boolean;
  /** A seed note the visitor has dragged; it no longer reflows on narrow screens. */
  moved?: boolean;
}

/**
 * Build the default board. Seed hues are chosen so neighbours down the page
 * do not share a colour; keep that true when adding a seed.
 * The final map fills in preview mode and z for every entry.
 */
export const seeds = (mod: string): Note[] =>
  [
    { id: 'a1', scope: 'hero-a', xp: 64, y: 60, hue: 85, rot: -2.5, text: '**Hello, I’m a note.**\n' + mod + ' + click anywhere on this page to make me a friend.' },
    { id: 'a2', scope: 'hero-a', xp: 76, y: 270, hue: 145, rot: 1.8, text: '- [x] Find a website\n- [ ] Stick a note on it\n- [ ] Feel unreasonably organised' },
    { id: 'a3', scope: 'hero-a', xp: 60, y: 430, hue: 235, rot: -1, text: 'Grab my top edge and drag me somewhere nicer.' },
    { id: 'o1', scope: 'name-origin', xp: 38.8, y: 24, hue: 85, rot: -2, text: 'A note met a clip.' },
    // One note on a paragraph, one on the buy button (sections/Redesign.astro).
    { id: 'd1', scope: 'demo-para', xp: 46, y: -18, hue: 145, rot: -1.5, text: '**1:16, not 1:15.**\nTrust the scale.' },
    { id: 'd2', scope: 'demo-buy', xp: 55, y: 44, hue: 20, rot: 1.5, text: 'Was $42 last month. Wait for a sale.' },
    // Honest labels for parts still being built. Shortcuts has no free margin, so it floats in top padding.
    { id: 'w1', scope: 'screens', xp: 72, y: 112, hue: 85, rot: 1.6, text: '**In development**\nThese screens are mockups. The extension is still being built, so the finished ones may look different.' },
    { id: 'w2', scope: 'shortcuts', xp: 27, y: 8, hue: 305, rot: -1.4, text: '**In development**\nThese keys are proposals and may change.' },
  ].map((n) => ({ mode: 'preview' as const, z: 0, ...n }));

/** True for unmoved seeds; visitor ids start with "n", and moved seeds stay absolute. */
export const isSeed = (n: Note) => !n.id.startsWith('n') && !n.moved;
