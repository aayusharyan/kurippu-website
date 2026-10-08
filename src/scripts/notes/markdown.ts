// The deliberately tiny Markdown subset notes render in preview.

export type Line =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'todo'; text: string; done: boolean; index: number };

/** Strip inline **, *, `, __ markers. */
const clean = (s: string) => s.replace(/\*\*|`|__/g, '').replace(/(^|\s)\*(\S[^*]*)\*/g, '$1$2');

export function parse(text: string): Line[] {
  const lines: Line[] = [];
  text.split('\n').forEach((raw, index) => {
    if (!raw.trim()) return;
    let m: RegExpMatchArray | null;
    if ((m = raw.match(/^\s*[-*] \[( |x|X)\] ?(.*)$/))) lines.push({ kind: 'todo', text: clean(m[2]), done: m[1] !== ' ', index });
    else if ((m = raw.match(/^\s*[-*] (.*)$/))) lines.push({ kind: 'li', text: clean(m[1]) });
    else if ((m = raw.match(/^#+ (.*)$/)) || (m = raw.match(/^\*\*(.+)\*\*$/))) lines.push({ kind: 'h', text: clean(m[1]) });
    else lines.push({ kind: 'p', text: clean(raw) });
  });
  return lines;
}

/** Flip the checkbox on line `index` of `text`. */
export function toggleTodo(text: string, index: number): string {
  const src = text.split('\n');
  src[index] = src[index].replace(/\[( |x|X)\]/, (_, c: string) => (c === ' ' ? '[x]' : '[ ]'));
  return src.join('\n');
}
