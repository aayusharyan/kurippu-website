// The welcome ribbon: a band of paper chips sweeps across the viewport from the top right corner (where the
// browser keeps the extension's toolbar icon) to the bottom left, then clears. Every chip is the site's own
// .note-chip, tilted from CHIP_ROTS and coloured from HUES, so it matches the install stack and minimised notes.
// Layout and motion live in styles/welcome.css; this file builds the chips and works out their timing.
import { CHIP_ROTS, HUES } from '../notes/seeds';

/** Preferred distance between chip centres. A chip is 26px (.note-chip), so this leaves a 12px gap. */
const PITCH = 38;
/** Most chips on screen. A very large display spreads them out instead of adding more. */
const MAX_CHIPS = 1800;
/** How long the band takes to cross the screen, whatever its size. */
const SWEEP_MS = 2500;
/** One chip's arrival, rest and exit: 340ms in, 140ms still, 340ms out. The in and out match the notes' chip-in and chip-out. */
const CHIP_MS = 820;
/** The palette in hue order, so the band moves through the colours instead of jumping between them. */
const HUES_UP = [...HUES].sort((a, b) => a - b);

/** Hue along the sweep, plus a small wobble so the edges between colours stay soft. */
function hueForSweepStep(step: number, lastStep: number, wobble: number): number {
  const progress = step / lastStep;
  const index = Math.round(progress * (HUES_UP.length - 1) + wobble);
  const clamped = Math.max(0, Math.min(HUES_UP.length - 1, index));
  return HUES_UP[clamped];
}

/** Play the ribbon once. Resolves when the last chip has gone and the layer is removed. */
export function playRibbon(): Promise<void> {
  const width = document.documentElement.clientWidth;
  const height = innerHeight;
  const pitch = Math.max(PITCH, Math.ceil(Math.sqrt((width * height) / MAX_CHIPS)));
  const cols = Math.ceil(width / pitch);
  const rows = Math.ceil(height / pitch);
  // A chip's step number is its diagonal distance from the top right corner.
  const lastStep = Math.max(1, cols + rows - 2);
  const stepMs = SWEEP_MS / lastStep;

  const layer = document.createElement('div');
  layer.className = 'welcome-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--cols', String(cols));
  layer.style.setProperty('--pitch', pitch + 'px');
  layer.style.setProperty('--chip-ms', CHIP_MS + 'ms');

  const chips = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const step = cols - 1 - c + r;
      // The colour follows the sweep, with a fixed wobble so the edges between colours are soft, not ruled lines.
      const wobble = (((r * 5 + c * 11) % 7) - 3) * 0.2;
      const hue = hueForSweepStep(step, lastStep, wobble);
      const chip = document.createElement('i');
      chip.className = 'note-chip welcome-chip';
      // A little fixed offset (up to 4px each way) so the field does not read as a ruled grid. It stays inside the 12px gap.
      chip.style.cssText =
        `--h:${hue};--rot:${CHIP_ROTS[(r * 3 + c * 5) % CHIP_ROTS.length]}deg;` +
        `--jx:${((r * 13 + c * 7) % 9) - 4}px;--jy:${((r * 7 + c * 11) % 9) - 4}px;` +
        `animation-delay:${Math.round(step * stepMs)}ms`;
      chips.append(chip);
    }
  }
  layer.append(chips);
  document.body.append(layer);

  return new Promise((resolve) => {
    setTimeout(() => {
      layer.remove();
      resolve();
    }, SWEEP_MS + CHIP_MS + 150);
  });
}
