// The deliberately tiny Markdown subset notes render in preview.

export type Line =
  | { kind: 'h'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string }
  | { kind: 'todo'; text: string; done: boolean; index: number };

/** Strip inline **, *, `, __ markers. */
const clean = (s: string) => s.replace(/\*\*|`|__/g, '').replace(/(^|\s)\*(\S[^*]*)\*/g, '$1$2');

/**
 * Classify one non-empty line. Todo must run before plain list, or `[ ]` items become `li`.
 * Headings accept `# …` or a whole-line `**bold**`. Blank lines are not passed here.
 */
function classifyLine(raw: string, index: number): Line {
  const todo = raw.match(/^\s*[-*] \[( |x|X)\] ?(.*)$/);
  if (todo) return { kind: 'todo', text: clean(todo[2]), done: todo[1] !== ' ', index };
  const item = raw.match(/^\s*[-*] (.*)$/);
  if (item) return { kind: 'li', text: clean(item[1]) };
  const heading = raw.match(/^#+ (.*)$/) || raw.match(/^\*\*(.+)\*\*$/);
  if (heading) return { kind: 'h', text: clean(heading[1]) };
  return { kind: 'p', text: clean(raw) };
}

/** Classify each non-empty line, in order. */
export function parse(text: string): Line[] {
  const lines: Line[] = [];
  text.split('\n').forEach((raw, index) => {
    if (!raw.trim()) return;
    lines.push(classifyLine(raw, index));
  });
  return lines;
}

/** Flip the checkbox on line `index` of `text`. */
export function toggleTodo(text: string, index: number): string {
  const src = text.split('\n');
  src[index] = src[index].replace(/\[( |x|X)\]/, (_, c: string) => (c === ' ' ? '[x]' : '[ ]'));
  return src.join('\n');
}
