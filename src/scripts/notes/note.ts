// One sticky note's DOM. The board owns state; a view renders a Note and reports intents through NoteApi.
import { svg } from '../icons';
import { parse, toggleTodo } from './markdown';
import { HUES, type Note } from './seeds';

export interface NoteApi {
  update(id: string, patch: Partial<Note>): void;
  remove(id: string): void;
  focus(id: string): void;
  startDrag(id: string, e: PointerEvent): void;
}

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
};

export class NoteView {
  /** Positioned wrapper the board moves between containers. */
  readonly slot = h('div', 'note-slot');
  private readonly el = h('div', 'sticky');
  private readonly body = h('div');
  private readonly editBtn = h('button', '', 'Edit');
  private readonly previewBtn = h('button', '', 'Preview');
  private textarea: HTMLTextAreaElement | null = null;
  private note: Note;
  private rendered: { mode?: Note['mode']; text?: string; hue?: number } = {};

  constructor(note: Note, private api: NoteApi, private mod: string) {
    this.note = note;
    this.el.dataset.note = '';

    const band = h('div', 'note-band');
    const seg = h('div', 'note-seg');
    for (const b of [this.editBtn, this.previewBtn]) b.type = 'button';
    seg.append(this.editBtn, this.previewBtn);
    const del = h('button', 'note-del');
    del.type = 'button';
    del.title = 'Delete note';
    del.setAttribute('aria-label', 'Delete note');
    del.innerHTML = svg('trash-2', 13);
    band.append(seg, h('span', 'note-grow'), del);

    this.el.append(band, this.body);
    this.slot.append(this.el);

    const id = () => this.note.id;
    this.el.addEventListener('pointerdown', () => api.focus(id()));
    band.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('button') || e.button !== 0) return;
      api.startDrag(id(), e);
    });
    this.editBtn.addEventListener('click', () => api.update(id(), { mode: 'edit' }));
    this.previewBtn.addEventListener('click', () => api.update(id(), { mode: 'preview' }));
    del.addEventListener('click', () => api.remove(id()));
  }

  update(note: Note, { focus = false } = {}) {
    const prev = this.rendered;
    this.note = note;
    const { el } = this;
    el.style.setProperty('--h', String(note.hue));
    el.style.setProperty('--rot', (note.rot || 0) + 'deg');
    el.classList.toggle('is-lifted', !!note.lifted);
    this.editBtn.setAttribute('aria-pressed', String(note.mode === 'edit'));
    this.previewBtn.setAttribute('aria-pressed', String(note.mode === 'preview'));

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

  /** Fade the note out in place, then resolve. Called right before it's removed from state. */
  leave(): Promise<void> {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
    this.el.classList.add('is-leaving');
    return new Promise((resolve) => this.el.addEventListener('animationend', () => resolve(), { once: true }));
  }

  /** Apply the swing physics' offset (px), extra rotation (deg) and scale; `null` puts the note at rest. */
  setSwing(t: { tx: number; ty: number; deg: number; sc: number } | null) {
    const { style } = this.el;
    if (!t) {
      for (const p of ['--tx', '--ty', '--swing', '--sc']) style.removeProperty(p);
      return;
    }
    style.setProperty('--tx', t.tx.toFixed(2) + 'px');
    style.setProperty('--ty', t.ty.toFixed(2) + 'px');
    style.setProperty('--swing', t.deg.toFixed(2) + 'deg');
    style.setProperty('--sc', t.sc.toFixed(4));
  }

  private renderEdit() {
    const ta = h('textarea');
    ta.placeholder = 'Write in Markdown…';
    ta.setAttribute('aria-label', 'Note text (Markdown)');
    ta.value = this.note.text;
    ta.addEventListener('input', () => this.api.update(this.note.id, { text: ta.value }));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        this.api.update(this.note.id, { mode: 'preview' });
        this.editBtn.focus();
      }
    });
    this.textarea = ta;

    const foot = h('div', 'note-foot');
    for (const hue of HUES) {
      const s = h('button', 'note-swatch');
      s.type = 'button';
      s.dataset.hue = String(hue);
      s.style.setProperty('--sw', String(hue));
      s.setAttribute('aria-label', 'Color');
      s.addEventListener('click', () => this.api.update(this.note.id, { hue }));
      foot.append(s);
    }
    foot.append(h('span', 'note-hint', this.mod + ' + Enter'));

    // Edit mode has no body styles of its own; this only drops .note-preview left over from preview.
    this.body.className = '';
    this.body.replaceChildren(ta, foot);
  }

  private markSwatch(hue: number) {
    this.body.querySelectorAll<HTMLButtonElement>('.note-swatch').forEach((s) => {
      s.setAttribute('aria-pressed', String(s.dataset.hue === String(hue)));
    });
  }

  private renderPreview(text: string) {
    this.textarea = null;
    const lines = parse(text);
    const kids = lines.map((l) => {
      if (l.kind === 'h') return h('div', 'md-h', l.text);
      if (l.kind === 'p') return h('div', 'md-p', l.text);
      if (l.kind === 'li') {
        const li = h('div', 'md-li');
        li.append(h('span', '', '–'), h('span', '', l.text));
        return li;
      }
      const row = h('div', 'md-todo' + (l.done ? ' is-done' : ''));
      row.setAttribute('role', 'checkbox');
      row.setAttribute('aria-checked', String(l.done));
      row.tabIndex = 0;
      row.dataset.line = String(l.index);
      const box = h('span', 'md-box');
      if (l.done) box.innerHTML = svg('check', 9, 3.5);
      row.append(box, h('span', 'md-todo-text', l.text));
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
    if (!lines.length) kids.push(h('div', 'md-empty', 'Empty note - click Edit.'));
    const active = document.activeElement as HTMLElement | null;
    const refocus = active && this.body.contains(active) ? active.dataset.line : undefined;
    this.body.className = 'note-preview';
    this.body.replaceChildren(...kids);
    if (refocus) this.body.querySelector<HTMLElement>(`[data-line="${refocus}"]`)?.focus();
  }
}
