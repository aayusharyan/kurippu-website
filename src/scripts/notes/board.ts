// The live sticky-note demo: visitors add notes anywhere on the landing page.
// Notes persist in localStorage; a FAB appears when the board differs from its seeds so visitors can reset.
import { NoteView, type NoteApi } from './note';
import { bezier, newSwing, pivotShift, release, stepSwing, type Swing } from './physics';
import { HUES, isSeed, seeds, type Note } from './seeds';

// v3: the name-origin section gained a seed and anchor, so older saved defaults are dropped.
// v4: the Screens and Shortcuts sections gained their "in development" seeds, which saved lists predate.
// v5: the name-origin seed was renamed from "name1" (an "n" id reads as a visitor note), so v4 lists would keep a stray copy.
const KEY = 'kurippu-site-notes-v5';
const NOTE_W = 236; // note width plus breathing room, used when clamping
// Set by the blocking script in layouts/Base.astro, so labels built here match the ones in the markup.
const IS_MAC = document.documentElement.classList.contains('mac');
const MOD = IS_MAC ? '⌘' : 'Ctrl';
/** The add-note modifier for this platform only, as in the extension: ⌘ on Apple, Ctrl elsewhere. */
const modDown = (e: MouseEvent) => (IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey) && !e.altKey;
const INTERACTIVE = '[data-note],a,button,input,textarea,summary,select,label,[data-nonote]';
const FLOW_SCOPES = new Set(['hero-a', 'screens', 'name-origin']);
/** Most chips the install section stacks; the header count keeps going past it. */
const MAX_CHIPS = 20;
const CHIP_ROTS = [-8, 5, -3, 9, -6, 4];
/** A bulk clear-out (reset) peels its cards off one by one, this far apart, instead of as one block. */
const STAGGER_MS = 45;
/** The header count ticks down on that same beat, but a huge clear-out is capped to roughly this long. */
const COUNT_RUN_MS = 900;
/** One line of praise when the visitor's own note count first reaches each of these. */
const MILESTONES: Record<number, string> = {
  1: 'First note. That was the whole tutorial.',
  3: 'Three of your own. Unreasonably organised.',
  5: 'Five. You’re ready for the rest of the web.',
};

/** Re-run a one-shot CSS animation class. */
function replay(el: Element, cls: string) {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

/** Stable snapshot of fields that count as "the visitor changed something". */
function noteFingerprint(list: Note[]) {
  return JSON.stringify(
    list
      .map(({ id, scope, xp, y, hue, rot, mode, text, moved }) => ({
        id,
        scope,
        xp: Math.round(xp * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        hue,
        rot,
        mode,
        text,
        moved: !!moved,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}
const DEFAULT_NOTES_FP = noteFingerprint(seeds(MOD));

const STATUS = {
  idle: `This is someone else’s website. Add your own notes with ${MOD} + click, then break the page.`,
  redesigned: 'Redesigned. Both notes followed what they were pinned to.',
};

type Place = Pick<Note, 'scope' | 'xp' | 'y'>;

export function mountBoard(root: HTMLElement) {
  let notes = load();
  let zc = notes.reduce((m, n) => Math.max(m, n.z || 0), 1);
  /** `px`/`py` are the pointer's latest position, read by the swing loop. */
  let drag: { id: string; sx: number; sy: number; ox: number; oy: number; w: number; px: number; py: number } | null = null;
  let menuPlace: Place | null = null;
  let toastTimer = 0;
  const demo = { redesigned: false };
  const views = new Map<string, NoteView>();

  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
  // Root itself is data-scope="page"; querySelector only sees descendants, so check root first.
  const scopeEl = (scope: string) =>
    (root.matches(`[data-scope="${scope}"]`) ? root : null) ?? $(`[data-scope="${scope}"]`);
  const menu = $('[data-menu]')!;
  const toastEl = $('[data-toast]')!;
  const fab = $('[data-reset-fab]')!;
  const compactMq = matchMedia('(max-width: 1179.98px)');
  /** The mock site in the "Websites redesign" demo. */
  const demoPage = scopeEl('demo')!;
  const countEl = $('[data-note-count]');
  const countNum = $('[data-note-count-num]');
  const stack = $('[data-note-stack]');
  const fine = $('[data-note-fine]');
  const fineDefault = fine?.textContent ?? '';
  /** What the count UI last showed; -1 until the first render so loading doesn't animate. */
  let shown = -1;
  let shownKey = '';
  /** The number actually on screen in the header chip. It trails `shown` while a count-down is still ticking. */
  let countShown = -1;
  /** Pending ticks of a count-down in flight, so a newer change can cancel them and take over. */
  let countTicks: number[] = [];
  /** Bumped on every chip sync; a stale cycle's finish handler checks this before touching the DOM. */
  let chipSyncToken = 0;

  // - state -
  function load(): Note[] {
    let stored: unknown = null;
    try { stored = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
    const list = Array.isArray(stored) ? (stored as Note[]) : seeds(MOD);
    return list.map((n) => ({ ...n, lifted: false }));
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch {} };

  /** True when the notes differ from a fresh page load. The redesign demo doesn't count: it runs by itself. */
  const isDirty = () => noteFingerprint(notes) !== DEFAULT_NOTES_FP;

  /** Show or hide the reset FAB to match the current dirty state. */
  const syncFab = () => { fab.hidden = !isDirty(); };

  /** True when a seed was dragged somewhere else, so it needs to travel back rather than just pop. */
  const posChanged = (prev: Note | undefined, n: Note) => !prev || prev.xp !== n.xp || prev.y !== n.y;
  /** True when a seed's look differs (recoloured, retexted, left in edit) with its position unchanged. */
  const lookChanged = (prev: Note | undefined, n: Note) =>
    !prev || prev.rot !== n.rot || prev.hue !== n.hue || prev.mode !== n.mode || prev.text !== n.text;

  /** Wipe persisted notes so the board matches the seed defaults again. The demo's layout is left as it is. */
  function resetAll() {
    const before = new Map(notes.map((n) => [n.id, n]));
    // Own notes have no seed counterpart, so they fade out the same way a single delete does -
    // staggered, so a bulk clear-out peels off one by one instead of vanishing as one block.
    const leaving = notes.filter((n) => n.id.startsWith('n')).map(
      (n, i) => new Promise<void>((resolve) => {
        window.setTimeout(() => {
          const view = views.get(n.id);
          if (view) view.leave().then(resolve);
          else resolve();
        }, i * STAGGER_MS);
      }),
    );
    Promise.all(leaving).then(() => {
      const newSeeds = seeds(MOD);
      // Measure every repositioned seed where it currently sits, before the jump to its default.
      const wasRects = new Map<string, DOMRect>();
      for (const n of newSeeds) {
        if (!posChanged(before.get(n.id), n)) continue;
        const r = views.get(n.id)?.slot.getBoundingClientRect();
        if (r) wasRects.set(n.id, r);
      }

      notes = newSeeds;
      zc = 1;
      praised = 0;
      stopSwings();
      try { localStorage.removeItem(KEY); } catch {}
      closeMenu();
      render();

      notes.forEach((n, i) => {
        const prev = before.get(n.id);
        const view = views.get(n.id);
        const wasRect = view && wasRects.get(n.id);
        if (view && wasRect) {
          // Moved: slide back from where it was, the same FLIP + sway the redesign demo uses,
          // instead of snapping straight to the default spot.
          const nowRect = view.slot.getBoundingClientRect();
          const dx = wasRect.left - nowRect.left, dy = wasRect.top - nowRect.top;
          if (Math.abs(dx) + Math.abs(dy) > 0.5 && !stillMq.matches) {
            view.slot.animate(
              [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
              { duration: 420, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
            );
            const s = startSwing(n.id, 0, -40);
            if (s) s.angV += 1.2 * (Math.sign(-dx || -dy) || 1);
          }
          return;
        }
        // Otherwise: only a look change (colour, text, left in edit) gets the arrival pop -
        // nothing moved, so there's nothing to slide.
        if (!lookChanged(prev, n)) return;
        const slap = startSwing(n.id, 0, 0);
        if (slap) { slap.sc = 1.25; slap.ang = i % 2 ? 0.18 : -0.18; }
      });
    });
  }

  function patch(id: string, p: Partial<Note>, persist = true) {
    notes = notes.map((n) => (n.id === id ? { ...n, ...p } : n));
    if (persist) save();
    render();
  }

  // - note count: header chip, chip stack and fine print in the install section -
  const ownCount = () => notes.filter((n) => n.id.startsWith('n')).length;
  let praised = ownCount();

  /**
   * Move the header number to `total`. A bulk removal (reset) counts down one note at a time, on the
   * same beat as the chips peeling off below, instead of jumping straight to the end. A single
   * change, the first render and reduced motion all go in one step.
   */
  function countTo(total: number, grew: boolean) {
    if (!countEl || !countNum) return;
    countTicks.forEach((t) => window.clearTimeout(t));
    countTicks = [];
    const from = countShown; // what is on screen, which may still be mid count-down from an earlier change
    const steps = from - total;
    const show = (n: number, anim: string) => {
      countEl.hidden = !n;
      countNum.textContent = String(n);
      countShown = n;
      if (!anim) return;
      countNum.classList.remove('is-rolling', 'is-ticking');
      replay(countNum, anim);
    };
    if (from < 0 || steps < 2 || stillMq.matches) {
      show(total, from >= 0 && total !== from ? 'is-rolling' : '');
      if (grew) replay(countEl, 'is-bumping');
      return;
    }
    const gap = Math.min(STAGGER_MS, COUNT_RUN_MS / steps);
    for (let j = 1; j <= steps; j++) {
      countTicks.push(window.setTimeout(() => show(from - j, j === steps ? 'is-rolling' : 'is-ticking'), (j - 1) * gap));
    }
  }

  function syncCount() {
    const total = notes.length;
    const key = notes.map((n) => n.hue).join();
    if (key === shownKey && total === shown) return;
    const grew = shown >= 0 && total > shown;
    countTo(total, grew);
    // Chips are kept by note id across renders (not just by trailing position), so removing one
    // from the middle animates *that* chip out and slides its neighbours over - the survivors
    // keep their own colour and never get reshuffled onto a different note.
    const target = notes.slice(0, MAX_CHIPS);
    const targetIds = new Set(target.map((n) => n.id));
    const oldEls = stack ? ([...stack.children] as HTMLElement[]) : [];
    // A change arriving before the previous one finished settling wraps that one up immediately
    // instead of the two animating over each other. A chip already mid-exit is treated as done
    // and dropped outright - re-adding its is-leaving class wouldn't replay the animation, so
    // waiting for a second animationend on it would hang forever.
    const myToken = ++chipSyncToken;
    for (const el of oldEls) {
      el.getAnimations().forEach((a) => a.finish());
      if (el.classList.contains('is-leaving')) el.remove();
    }
    const liveOldEls = oldEls.filter((el) => el.isConnected);
    const oldById = new Map(liveOldEls.map((el) => [el.dataset.chipId!, el]));
    const leavingChips = liveOldEls.filter((el) => !targetIds.has(el.dataset.chipId!));

    const relayout = () => {
      if (myToken !== chipSyncToken) return; // superseded - the newer cycle owns the DOM now
      if (!stack) return;
      // FLIP: measure every survivor where it currently sits before touching the DOM.
      const before = new Map<string, DOMRect>();
      for (const el of liveOldEls) {
        if (leavingChips.includes(el)) continue;
        before.set(el.dataset.chipId!, el.getBoundingClientRect());
      }
      stack.replaceChildren(
        ...target.map((n, i) => {
          const existing = oldById.get(n.id);
          if (existing) {
            existing.style.setProperty('--h', String(n.hue)); // the note may have been recoloured
            return existing;
          }
          const chip = document.createElement('span');
          chip.className = 'note-chip is-new';
          chip.dataset.chipId = n.id;
          chip.style.setProperty('--h', String(n.hue));
          chip.style.setProperty('--rot', CHIP_ROTS[i % CHIP_ROTS.length] + 'deg');
          chip.addEventListener('animationend', () => chip.classList.remove('is-new'), { once: true });
          return chip;
        }),
      );
      if (stillMq.matches) return;
      // Glide every survivor from where it was to its new slot instead of letting the reflow jump.
      for (const el of [...stack.children] as HTMLElement[]) {
        if (el.classList.contains('is-new')) continue; // its own entrance animation covers this
        const was = before.get(el.dataset.chipId!);
        if (!was) continue;
        const now = el.getBoundingClientRect();
        const dx = was.left - now.left, dy = was.top - now.top;
        if (Math.abs(dx) + Math.abs(dy) > 0.5) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
            { duration: 260, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
        }
      }
    };

    // The departing chip(s) swipe out first - the exact reverse of swiping in - and only once
    // that finishes does the rest of the queue glide smoothly into its closed-up positions.
    // Several leaving together (a reset clearing them all out) peel off one by one, staggered,
    // instead of vanishing in one synchronised block.
    if (leavingChips.length && !stillMq.matches) {
      let left = leavingChips.length;
      leavingChips.forEach((el, i) => {
        window.setTimeout(() => {
          if (myToken !== chipSyncToken) return; // superseded before this one even started
          el.classList.add('is-leaving');
          el.addEventListener('animationend', () => { if (--left === 0) relayout(); }, { once: true });
        }, i * STAGGER_MS);
      });
    } else {
      relayout();
    }
    if (fine) {
      const own = ownCount();
      fine.textContent = !own
        ? fineDefault
        : own === 1
          ? 'You’ve left your first note here. With Kurippu, you can do that on any webpage.'
          : own === 2
            ? 'You’ve left a couple of notes here. With Kurippu, you can do that on any webpage.'
            : own <= 15
              ? `You’ve left ${own} notes here. With Kurippu, you can do that on any webpage.`
              : 'You’ve made this page your own. With Kurippu, you can do that on any webpage.';
    }
    shown = total;
    shownKey = key;
  }

  // - rendering -
  function render(focusId?: string) {
    const compact = compactMq.matches;
    const flowUsed = new Set<string>();
    for (const n of notes) {
      let view = views.get(n.id);
      if (!view) views.set(n.id, (view = new NoteView(n, api, MOD)));

      const { slot } = view;
      const flow = compact && FLOW_SCOPES.has(n.scope) && isSeed(n) ? $(`[data-flow="${n.scope}"]`) : null;
      const host = flow ?? scopeEl(n.scope);
      // No host on this page, or its anchor isn't currently shown.
      if (!host || (!flow && host.hidden)) { slot.remove(); view.update(n); continue; }
      slot.classList.toggle('is-flow', !!flow);
      if (flow) {
        flowUsed.add(n.scope);
        slot.style.left = slot.style.top = '';
      } else if (host !== demoPage && demoPage.contains(host)) {
        // In the mock site a note may hang off its anchor (the button is narrower than a note),
        // so it is kept inside the page instead of inside the anchor. offset* ignores transforms.
        const x = host.offsetLeft + (n.xp / 100) * host.offsetWidth;
        slot.style.left = Math.max(0, Math.min(x, demoPage.clientWidth - NOTE_W)) - host.offsetLeft + 'px';
        slot.style.top = n.y + 'px';
      } else {
        slot.style.left = `max(0px, min(${n.xp}%, calc(100% - ${NOTE_W}px)))`;
        slot.style.top = n.y + 'px';
      }
      slot.style.zIndex = String(20 + (n.z || 0));
      if (slot.parentElement !== host) host.append(slot);
      // Update once attached, so a note entering edit mode can focus its textarea.
      view.update(n, { focus: n.id === focusId });
    }
    for (const [id, view] of views) {
      if (!notes.some((n) => n.id === id)) { view.slot.remove(); views.delete(id); }
    }
    root.querySelectorAll<HTMLElement>('[data-flow]').forEach((f) => { f.hidden = !flowUsed.has(f.dataset.flow!); });
    syncFab();
    syncCount();
  }

  // - swing physics: carried notes hang from the pointer; thrown notes coast and settle -
  const swings = new Map<string, Swing & { lx: number; ly: number }>();
  const stillMq = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  let last = 0;

  function startSwing(id: string, gx: number, gy: number, lx = 0, ly = 0) {
    if (stillMq.matches) return null;
    const s = { ...(swings.get(id) ?? newSwing()), gx, gy, lx, ly };
    swings.set(id, s);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    return s;
  }

  function stopSwings() {
    swings.clear();
    for (const view of views.values()) view.setSwing(null);
  }

  function tick(now: number) {
    const dt = Math.max(0.001, Math.min(0.032, (now - last) / 1000));
    last = now;
    raf = 0;
    for (const [id, s] of swings) {
      const n = notes.find((x) => x.id === id);
      if (!n || !views.has(id)) { swings.delete(id); continue; }
      const held = drag?.id === id;
      let coasting = false;
      if (held) {
        // The pointermove handler places the note; here we only measure how fast it is going.
        s.vx += ((drag!.px - s.lx) / dt - s.vx) * 0.3;
        s.vy += ((drag!.py - s.ly) / dt - s.vy) * 0.3;
        s.lx = drag!.px;
        s.ly = drag!.py;
      } else if (Math.abs(s.vx) + Math.abs(s.vy) > 3) {
        // Thrown: keep going, lose speed, and bounce off the sides of the note's container.
        coasting = true;
        const w = scopeEl(n.scope)?.getBoundingClientRect().width ?? 0;
        const maxX = Math.max(0, w - NOTE_W);
        let x = (n.xp / 100) * w + s.vx * dt;
        if (x < 0) { x = 0; s.vx *= -0.5; }
        if (x > maxX) { x = maxX; s.vx *= -0.5; }
        const f = Math.exp(-5 * dt);
        s.vx *= f;
        s.vy *= f;
        if (w) patch(id, { xp: (x / w) * 100, y: n.y + s.vy * dt }, false);
      } else {
        s.vx = s.vy = 0;
      }
      const settled = stepSwing(s, dt, held);
      const view = views.get(id)!;
      if (settled && !coasting) {
        swings.delete(id);
        view.setSwing(null);
        save();
      } else {
        view.setSwing({ ...pivotShift(s), deg: (s.ang * 180) / Math.PI, sc: s.sc });
      }
    }
    if (swings.size) raf = requestAnimationFrame(tick);
  }

  // - adding -
  function placeAt(target: Element, cx: number, cy: number): Place {
    const c = target.closest<HTMLElement>('[data-scope]')!;
    const r = c.getBoundingClientRect();
    const max = r.width > NOTE_W + 4 ? ((r.width - NOTE_W) / r.width) * 100 : 0;
    return { scope: c.dataset.scope!, xp: Math.max(0, Math.min(max, ((cx - r.left) / r.width) * 100)), y: cy - r.top };
  }

  function addNote(p: Place) {
    const n: Note = { id: 'n' + Date.now(), ...p, hue: HUES[notes.length % HUES.length], rot: 0, mode: 'edit', text: '', z: ++zc };
    // Tidy away notes that were left open with something written in them.
    notes = notes.map((x) => (x.mode === 'edit' && x.text.trim() ? { ...x, mode: 'preview' as const } : x)).concat(n);
    closeMenu();
    save();
    render(n.id);
    // Arrives oversized and askew; the swing springs bring it to rest.
    const slap = startSwing(n.id, 0, 0);
    if (slap) { slap.sc = 1.3; slap.ang = notes.length % 2 ? 0.2 : -0.2; }
    const own = ownCount();
    if (own > praised) {
      praised = own;
      if (MILESTONES[own]) showToast(MILESTONES[own]);
      if (own === 5) { const cta = $('[data-install-cta]'); if (cta) replay(cta, 'is-ringing'); }
    }
  }

  const api: NoteApi = {
    update: (id, p) => patch(id, p),
    remove: (id) => {
      const view = views.get(id);
      const drop = () => { notes = notes.filter((n) => n.id !== id); save(); render(); };
      if (view) view.leave().then(drop);
      else drop();
    },
    focus: (id) => {
      const n = notes.find((x) => x.id === id);
      if (n && n.z !== zc) patch(id, { z: ++zc }, false);
    },
    startDrag: (id, e) => {
      const view = views.get(id);
      const c = (e.currentTarget as Element).closest<HTMLElement>('[data-scope]');
      if (!view || !c) return;
      const r = c.getBoundingClientRect();
      const s = view.slot.getBoundingClientRect();
      const ox = s.left - r.left, oy = s.top - r.top;
      drag = { id, sx: e.clientX, sy: e.clientY, ox, oy, w: r.width, px: e.clientX, py: e.clientY };
      patch(id, { lifted: true, moved: true, xp: (ox / r.width) * 100, y: oy, z: ++zc }, false);
      // Held point from the note's centre: the pivot it swings about.
      startSwing(id, e.clientX - (s.left + s.width / 2), e.clientY - (s.top + s.height / 2), e.clientX, e.clientY);
      e.preventDefault();
    },
  };

  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.px = e.clientX;
    drag.py = e.clientY;
    patch(drag.id, { xp: ((drag.ox + e.clientX - drag.sx) / drag.w) * 100, y: drag.oy + e.clientY - drag.sy }, false);
  });
  const endDrag = () => {
    if (!drag) return;
    const { id } = drag;
    drag = null;
    patch(id, { lifted: false });
    const s = swings.get(id);
    if (s) release(s);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // - click, right-click -
  function showToast(text: string) {
    clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.hidden = false;
    toastTimer = window.setTimeout(() => { toastEl.hidden = true; }, 2400);
  }

  function openMenu(x: number, y: number, place: Place) {
    menuPlace = place;
    menu.style.left = Math.min(x, innerWidth - 246) + 'px';
    menu.style.top = Math.min(y, innerHeight - 170) + 'px';
    menu.hidden = false;
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuPlace = null;
  }

  root.addEventListener('click', (e) => {
    closeMenu();
    const t = e.target as Element;
    if (t.closest(INTERACTIVE)) return;
    if (modDown(e)) {
      e.preventDefault();
      addNote(placeAt(t, e.clientX, e.clientY));
      return;
    }
    if (t.closest('[data-demo]')) showToast(`Hold ${MOD} while you click to add a note here.`);
  });

  root.addEventListener('contextmenu', (e) => {
    const t = e.target as Element;
    // Whole page is a note surface; skip only notes and UI that opts out via data-nonote.
    if (t.closest('[data-note],[data-nonote]')) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY, placeAt(t, e.clientX, e.clientY));
  });

  $('[data-menu-add]')!.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuPlace) addNote(menuPlace);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('scroll', closeMenu, { passive: true });
  window.addEventListener('resize', closeMenu);
  compactMq.addEventListener('change', () => render());

  // - "Websites redesign" demo -
  const status = $('[data-demo-status]')!;
  const redesignBtn = $('[data-demo-action="redesign"]')!;
  const demoActions = $('[data-demo-actions]');

  function applyDemo() {
    demoPage.classList.toggle('is-redesigned', demo.redesigned);
    redesignBtn.setAttribute('aria-pressed', String(demo.redesigned));
    redesignBtn.textContent = demo.redesigned ? 'Undo the redesign' : 'Redesign the page';
    status.textContent = demo.redesigned ? STATUS.redesigned : STATUS.idle;
  }

  // - demo motion: the mock site's blocks glide to their new places and the notes follow a beat late -
  const BLOCK_MS = 550, BLOCK_STAGGER = 35;
  const NOTE_MS = 700, NOTE_LAG = 80;
  const glide = bezier(0.2, 0.7, 0.2, 1);
  const settle = bezier(0.3, 1.35, 0.5, 1);
  const rectOf = (el: Element) => { const r = el.getBoundingClientRect(); return r.width ? r : null; };

  // Choreography. Blocks marked data-flip="move" travel to their new box; blocks marked "fade"
  // (the photo and the step cards) fade out where they were and fade in where they belong.
  // The three beats don't overlap, so nothing is ever drawn on top of something else in transit:
  //   0 to FADE_OUT_MS         faders leave
  //   MOVE_DELAY onwards       movers travel through the space that has just cleared
  //   FADE_IN_DELAY onwards    faders arrive in the space the movers have left
  const FADE_OUT_MS = 150, MOVE_DELAY = 100, FADE_IN_DELAY = 400, FADE_IN_MS = 280;

  /** Run `change` (which re-lays-out the demo), then animate everything from where it was. */
  function flip(change: () => void) {
    if (stillMq.matches || !demoPage.animate) return change();
    const blocks = [...demoPage.querySelectorAll<HTMLElement>('[data-flip]')];
    const demoSlots = () => [...views].filter(([, v]) => demoPage.contains(v.slot));
    const before = new Map<Element, DOMRect | null>();
    const fontBefore = new Map<Element, string>();
    for (const el of [...blocks, ...demoSlots().map(([, v]) => v.slot)]) before.set(el, rectOf(el));
    for (const el of blocks) fontBefore.set(el, getComputedStyle(el).fontSize);
    for (const el of before.keys()) el.getAnimations().forEach((a) => a.cancel());
    // A copy of each block as it looks now, in case it has to be left behind (see below).
    const ghosts = new Map<HTMLElement, HTMLElement>();
    for (const el of blocks) if (before.get(el) && !el.querySelector('.note-slot')) ghosts.set(el, el.cloneNode(true) as HTMLElement);

    change();

    // Measure everything before starting any animation: a note's box moves with its anchor.
    const after = new Map<Element, DOMRect | null>();
    for (const el of [...blocks, ...demoSlots().map(([, v]) => v.slot)]) after.set(el, rectOf(el));
    const page = demoPage.getBoundingClientRect();
    const changed = (a: DOMRect, b: DOMRect) =>
      Math.abs(a.left - b.left) + Math.abs(a.top - b.top) > 0.5 || Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1;

    /** Put a block's old-look copy where the block stood. It is out of flow, so it can't disturb the layout. */
    const leave = (el: HTMLElement, was: DOMRect) => {
      const ghost = ghosts.get(el)!;
      ghost.removeAttribute('data-flip');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.cssText = `position:absolute;left:${was.left - page.left}px;top:${was.top - page.top}px;width:${was.width}px;height:${was.height}px;margin:0;pointer-events:none;font-size:${fontBefore.get(el)}`;
      demoPage.append(ghost);
      // A block the new layout hides (the photo) would hide its copy too.
      if (getComputedStyle(ghost).display === 'none') ghost.style.display = 'flex';
      return ghost;
    };

    const moved = new Map<Element, { dx: number; dy: number; delay: number }>();
    let movers = 0;
    for (const el of blocks) {
      const was = before.get(el), now = after.get(el);

      if (el.dataset.flip === 'fade') {
        if (was && now && !changed(was, now)) continue;
        if (was) {
          // Leave: the copy fades out where the block stood.
          const ghost = leave(el, was);
          ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_OUT_MS, easing: 'ease-in', fill: 'forwards' })
            .onfinish = () => ghost.remove();
        }
        if (now) {
          // Arrive: only once the movers have cleared the space.
          el.animate(
            [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }],
            { duration: FADE_IN_MS, delay: FADE_IN_DELAY, easing: 'ease-out', fill: 'backwards' },
          );
        }
        continue;
      }

      if (!was || !now || !changed(was, now)) continue;
      const dx = was.left - now.left, dy = was.top - now.top;
      const delay = MOVE_DELAY + movers++ * BLOCK_STAGGER;
      moved.set(el, { dx, dy, delay });
      // Movers animate transform (and opacity) only. Animating width, height or font-size on a
      // grid item re-flows the rows around it on every frame, which shoves its neighbours about.
      const timing = { duration: BLOCK_MS, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' as const };
      const resized = Math.abs(was.width - now.width) > 1 || Math.abs(was.height - now.height) > 1;
      const morph = resized && ghosts.has(el);
      if (morph) {
        // A block that re-wraps (the headline) cross-fades between its two looks as it travels:
        // the old-look copy rides the same path out while the real one fades in on it.
        const ghost = leave(el, was);
        ghost.animate(
          [{ transform: 'none', opacity: 1 }, { transform: `translate(${-dx}px, ${-dy}px)`, opacity: 0 }],
          { ...timing, fill: 'both' },
        ).onfinish = () => ghost.remove();
      }
      if (el.querySelector('.note-slot')) {
        // A block carrying a note must not become a stacking context on the way, or its note is
        // trapped inside it and the paint order of notes and blocks changes for the length of the
        // animation, then snaps back. Transforms, opacity and z-index all do that; offsets on a
        // position: relative block do not, so anchors travel by left/top instead.
        el.animate([{ left: dx + 'px', top: dy + 'px' }, { left: '0px', top: '0px' }], timing);
        // The anchor gets one ring once its note has caught up.
        el.animate(
          [{ boxShadow: '0 0 0 0 rgba(182,130,53,.7)' }, { boxShadow: '0 0 0 10px rgba(182,130,53,0)' }],
          { duration: 700, delay: delay + 650 },
        );
      } else {
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)`, opacity: morph ? 0 : 1 }, { transform: 'none', opacity: 1 }],
          timing,
        );
      }
    }

    // Notes: their anchor already carries them, so each frame is "where the note should be"
    // minus "where the anchor has taken it". The note leaves late and overshoots.
    for (const [id, v] of demoSlots()) {
      const now = after.get(v.slot), was = before.get(v.slot);
      if (!now || !was) continue;
      const dx = was.left - now.left, dy = was.top - now.top;
      const host = moved.get(v.slot.parentElement!);
      if (Math.abs(dx) + Math.abs(dy) < 0.5 && !host) continue;
      const lag = (host?.delay ?? MOVE_DELAY) + NOTE_LAG;
      const total = lag + NOTE_MS + 120;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 30; k++) {
        const t = (k / 30) * total;
        const own = 1 - settle((t - lag) / NOTE_MS);
        const carried = host ? 1 - glide((t - host.delay) / BLOCK_MS) : 0;
        frames.push({ transform: `translate(${dx * own - (host?.dx ?? 0) * carried}px, ${dy * own - (host?.dy ?? 0) * carried}px)` });
      }
      v.slot.animate(frames, { duration: total, easing: 'linear' });
      // A push in the direction of travel sets it swaying from its top edge.
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        window.setTimeout(() => {
          const s = startSwing(id, 0, -40);
          if (s) s.angV += 1.4 * Math.sign(-dx || -dy);
        }, lag + 40);
      }
    }
  }

  const actions: Record<string, () => void> = {
    redesign() {
      flip(() => {
        demo.redesigned = !demo.redesigned;
        applyDemo();
        render();
      });
    },
  };

  root.querySelectorAll<HTMLElement>('[data-demo-action]').forEach((b) => {
    b.addEventListener('click', () => actions[b.dataset.demoAction!]());
  });

  // The first run is automatic: a beat after the demo scrolls into view it redesigns itself, and
  // only when that has finished does the button fade in, to undo or replay it. It then stays for
  // the rest of the visit. Without motion (or IntersectionObserver) the button is simply there.
  const FIRST_RUN_DELAY = 700;
  const RUN_MS = MOVE_DELAY + NOTE_LAG + NOTE_MS + 300;
  if (demoActions && 'IntersectionObserver' in window && !stillMq.matches) {
    demoActions.classList.add('is-waiting');
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        window.setTimeout(() => {
          if (!demo.redesigned) actions.redesign();
          window.setTimeout(() => demoActions.classList.remove('is-waiting'), RUN_MS);
        }, FIRST_RUN_DELAY);
      },
      { threshold: 0.6 },
    );
    io.observe(demoPage);
  }

  // Notes in the mock site are clamped to its width, so re-place them when it changes.
  if ('ResizeObserver' in window) new ResizeObserver(() => render()).observe(demoPage);

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    resetAll();
  });

  render();
}
