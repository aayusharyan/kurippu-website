// One sticky note's DOM. The board owns state; a view renders a Note and reports intents through NoteApi.
import { svg } from '../icons';
import { parse, toggleTodo } from './markdown';
import { HUES, type Note } from './seeds';

export interface NoteApi {
  update(id: string, patch: Partial<Note>): void;
  remove(id: string): void;
  focus(id: string): void;
  /** Begin a drag from this pointer event. False when the note has no container to move inside. */
  startDrag(id: string, e: PointerEvent): boolean;
}

/** Create an element, optionally with a class and textContent (never HTML). */
const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
};

/** Renders one note card and wires band, edit/preview, delete, and drag intents. */
export class NoteView {
  /** Positioned wrapper the board moves between containers. */
  readonly slot = createElement('div', 'note-slot');
  private readonly el = createElement('div', 'note');
  private readonly body = createElement('div');
  private readonly editBtn = createElement('button', '', 'Edit');
  private readonly previewBtn = createElement('button', '', 'Preview');
  private readonly minBtn = createElement('button', 'note-min');
  /** Paper chip shown in place of the card while the note is minimised. */
  private readonly mini = createElement('button', 'note-chip note-mini');
  private textarea: HTMLTextAreaElement | null = null;
  private note: Note;
  private rendered: { mode?: Note['mode']; text?: string; hue?: number } = {};

  /** Build the band chrome once; later updates only refresh body content. */
  constructor(note: Note, private api: NoteApi, private mod: string) {
    this.note = note;
    this.el.dataset.note = '';

    const band = createElement('div', 'note-band');
    const modeSegment = createElement('div', 'note-seg');
    for (const b of [this.editBtn, this.previewBtn]) b.type = 'button';
    this.editBtn.dataset.analyticsId = 'demo-note-edit';
    this.previewBtn.dataset.analyticsId = 'demo-note-preview';
    modeSegment.append(this.editBtn, this.previewBtn);
    const deleteButton = createElement('button', 'note-del');
    deleteButton.type = 'button';
    deleteButton.dataset.analyticsId = 'demo-note-delete';
    deleteButton.title = 'Delete note';
    deleteButton.setAttribute('aria-label', 'Delete note');
    deleteButton.innerHTML = svg('trash-2', 13);
    const { minBtn, mini } = this;
    minBtn.type = 'button';
    minBtn.dataset.analyticsId = 'demo-note-minimize';
    minBtn.title = 'Minimise note';
    minBtn.setAttribute('aria-label', 'Minimise note');
    minBtn.innerHTML = svg('minus', 13);
    band.append(modeSegment, createElement('span', 'note-grow'), minBtn, deleteButton);

    mini.type = 'button';
    mini.dataset.note = '';
    mini.dataset.analyticsId = 'demo-note-expand';
    mini.setAttribute('aria-label', 'Expand note');

    this.el.append(band, this.body);
    this.slot.append(this.el, mini);

    const noteId = () => this.note.id;
    this.el.addEventListener('pointerdown', () => api.focus(noteId()));
    band.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('button') || e.button !== 0) return;
      api.startDrag(noteId(), e);
    });
    this.editBtn.addEventListener('click', () => api.update(noteId(), { mode: 'edit' }));
    this.previewBtn.addEventListener('click', () => api.update(noteId(), { mode: 'preview' }));
    deleteButton.addEventListener('click', () => api.remove(noteId()));
    // Preserve the current mode behind the chip so reopening returns to the same edit or preview state.
    minBtn.addEventListener('click', () => {
      api.update(noteId(), { min: true });
      mini.focus({ preventScroll: true });
    });
    // A small move drags the chip; a tap (under a few pixels) still opens the note.
    let dragChip = false;
    mini.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      api.focus(noteId());
      const sx = e.clientX, sy = e.clientY;
      const move = (ev: PointerEvent) => {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) <= 3) return;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        dragChip = api.startDrag(noteId(), ev);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    mini.addEventListener('click', () => {
      if (dragChip) { dragChip = false; return; }
      api.update(noteId(), { min: false });
      minBtn.focus({ preventScroll: true });
    });
  }

  /** Sync visual props and rebuild edit or preview when mode/text/hue need it. */
  update(note: Note, { focus = false } = {}) {
    const prev = this.rendered;
    this.note = note;
    const { el } = this;
    el.style.setProperty('--h', String(note.hue));
    el.style.setProperty('--rot', (note.rot || 0) + 'deg');
    el.classList.toggle('is-lifted', !!note.lifted);
    this.slot.classList.toggle('is-lifted', !!note.lifted);
    this.editBtn.setAttribute('aria-pressed', String(note.mode === 'edit'));
    this.previewBtn.setAttribute('aria-pressed', String(note.mode === 'preview'));

    // While minimised only the chip is visible, so the body is left alone until the note opens again.
    this.slot.classList.toggle('is-min', !!note.min);
    if (note.min) {
      this.mini.style.setProperty('--h', String(note.hue));
      this.mini.style.setProperty('--rot', (note.rot || 0) + 'deg');
      this.mini.title = parse(note.text)[0]?.text || 'Empty note';
      return;
    }

    if (note.mode === 'edit') {
      if (prev.mode !== 'edit') this.renderEdit();
      const ta = this.textarea!;
      if (ta.value !== note.text && document.activeElement !== ta) ta.value = note.text;
      ta.rows = Math.max(4, note.text.split('\n').length + 1);
      if (prev.hue !== note.hue || prev.mode !== 'edit') this.markSwatch(note.hue);
      // Focus when switching into edit, but not for notes restored in edit mode on page load.
      if (prev.mode !== 'edit' && (focus || prev.mode)) ta.focus({ preventScroll: true });
    } else if (prev.mode !== 'preview' || prev.text !== note.text) {
      this.renderPreview(note.text);
    }
    this.rendered = { mode: note.mode, text: note.text, hue: note.hue };
  }

  /**
   * Fade the note (or its chip, when minimised) out in place, then resolve. Called right before it's
   * removed from state. The hidden one never animates, so waiting on it would hang.
   */
  leave(): Promise<void> {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
    const shown = this.slot.classList.contains('is-min') ? this.mini : this.el;
    shown.classList.add('is-leaving');
    return new Promise((resolve) => shown.addEventListener('animationend', () => resolve(), { once: true }));
  }

  /**
   * Apply the swing physics' offset (px), extra rotation (deg) and scale; `null` puts the note at rest.
   * Set on the slot so a minimised chip, which hides the card, swings too.
   */
  setSwing(t: { tx: number; ty: number; deg: number; sc: number } | null) {
    const { style } = this.slot;
    if (!t) {
      for (const p of ['--tx', '--ty', '--swing', '--sc']) style.removeProperty(p);
      return;
    }
    style.setProperty('--tx', t.tx.toFixed(2) + 'px');
    style.setProperty('--ty', t.ty.toFixed(2) + 'px');
    style.setProperty('--swing', t.deg.toFixed(2) + 'deg');
    style.setProperty('--sc', t.sc.toFixed(4));
  }

  /** Mount textarea, colour swatches, and mod+Enter to show the preview. */
  private renderEdit() {
    const ta = createElement('textarea');
    ta.placeholder = 'Write in Markdown…';
    ta.setAttribute('aria-label', 'Note text (Markdown)');
    ta.value = this.note.text;
    ta.addEventListener('input', () => this.api.update(this.note.id, { text: ta.value }));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.api.update(this.note.id, { mode: 'preview' });
        this.editBtn.focus();
      }
    });
    this.textarea = ta;

    const foot = createElement('div', 'note-foot');
    for (const hue of HUES) {
      const s = createElement('button', 'note-swatch');
      s.type = 'button';
      s.dataset.analyticsId = 'demo-note-color';
      s.dataset.hue = String(hue);
      s.style.setProperty('--sw', String(hue));
      s.setAttribute('aria-label', 'Color');
      s.addEventListener('click', () => this.api.update(this.note.id, { hue }));
      foot.append(s);
    }
    foot.append(createElement('span', 'note-hint', this.mod + ' + Enter'));

    // Edit mode has no body styles of its own; this only drops .note-preview left over from preview.
    this.body.className = '';
    this.body.replaceChildren(ta, foot);
  }

  /** Mark which swatch matches the current hue for aria-pressed. */
  private markSwatch(hue: number) {
    this.body.querySelectorAll<HTMLButtonElement>('.note-swatch').forEach((s) => {
      s.setAttribute('aria-pressed', String(s.dataset.hue === String(hue)));
    });
  }

  /**
   * Parse Markdown into preview nodes. Todo rows keep focus across rebuilds via data-line.
   * Space and Enter toggle a focused checkbox the same way a click does.
   */
  private renderPreview(text: string) {
    this.textarea = null;
    const lines = parse(text);
    const kids = lines.map((l) => {
      if (l.kind === 'h') return createElement('div', 'md-h', l.text);
      if (l.kind === 'p') return createElement('div', 'md-p', l.text);
      if (l.kind === 'li') {
        const li = createElement('div', 'md-li');
        li.append(createElement('span', '', '–'), createElement('span', '', l.text));
        return li;
      }
      const row = createElement('div', 'md-todo' + (l.done ? ' is-done' : ''));
      row.setAttribute('role', 'checkbox');
      row.setAttribute('aria-checked', String(l.done));
      row.tabIndex = 0;
      row.dataset.line = String(l.index);
      const box = createElement('span', 'md-box');
      if (l.done) box.innerHTML = svg('check', 9, 3.5);
      row.append(box, createElement('span', 'md-todo-text', l.text));
      const toggle = (e: Event) => {
        e.stopPropagation();
        this.api.update(this.note.id, { text: toggleTodo(this.note.text, l.index) });
      };
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(e); }
      });
      return row;
    });
    if (!lines.length) kids.push(createElement('div', 'md-empty', 'Empty note - click Edit.'));
    const active = document.activeElement as HTMLElement | null;
    const refocus = active && this.body.contains(active) ? active.dataset.line : undefined;
    this.body.className = 'note-preview';
    this.body.replaceChildren(...kids);
    if (refocus) this.body.querySelector<HTMLElement>(`[data-line="${refocus}"]`)?.focus();
  }
}
