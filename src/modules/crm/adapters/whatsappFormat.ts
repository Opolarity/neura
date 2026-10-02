// Formato de WhatsApp para el editor de plantillas del chatbot (T-902).
//
// WhatsApp no tiene texto enriquecido: el formato son marcas dentro del texto
// (*negrita*, _cursiva_, ~tachado~, "- " lista, "1. " lista numerada, "> "
// cita). El editor las inserta y la vista previa las dibuja.
//
// Monoespaciado (```) queda fuera a propósito: sanitize.ts del bot borra todas
// las comillas invertidas antes de enviar, así que no llegaría al cliente.

export type InlineMark = "*" | "_" | "~";
export type LineMark = "bullet" | "number" | "quote";

export interface Edit {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Pone o saca la marca alrededor de la selección, como el menú de formato de
 * WhatsApp. Sin selección, deja el cursor entre las dos marcas. La marca va
 * pegada al texto (WhatsApp no la reconoce con espacios por dentro) y, si la
 * selección abarca varias líneas, se aplica línea por línea.
 */
export function toggleInline(text: string, start: number, end: number, mark: InlineMark): Edit {
  if (start === end) {
    const before = text.slice(0, start);
    const after = text.slice(end);
    // Cursor justo entre dos marcas vacías: se sacan (deshacer el botón).
    if (before.endsWith(mark) && after.startsWith(mark)) {
      return { text: before.slice(0, -1) + after.slice(1), selectionStart: start - 1, selectionEnd: start - 1 };
    }
    return { text: before + mark + mark + after, selectionStart: start + 1, selectionEnd: start + 1 };
  }

  // Ya envuelto por fuera de la selección: se quita.
  if (text.slice(start - 1, start) === mark && text.slice(end, end + 1) === mark) {
    return {
      text: text.slice(0, start - 1) + text.slice(start, end) + text.slice(end + 1),
      selectionStart: start - 1,
      selectionEnd: end - 1,
    };
  }

  const selected = text.slice(start, end);
  const lines = selected.split("\n");
  const wrapped = lines.map((line) => {
    const m = line.match(/^(\s*)(.*?)(\s*)$/s);
    const [, lead, core, trail] = m ?? ["", "", line, ""];
    if (!core) return line;
    // Ya envuelto por dentro de la selección: se quita.
    if (core.length > 2 && core.startsWith(mark) && core.endsWith(mark)) return lead + core.slice(1, -1) + trail;
    return lead + mark + core + mark + trail;
  });
  const replaced = wrapped.join("\n");
  return { text: text.slice(0, start) + replaced + text.slice(end), selectionStart: start, selectionEnd: start + replaced.length };
}

const LINE_RE: Record<LineMark, RegExp> = {
  bullet: /^- /,
  number: /^\d+\. /,
  quote: /^> /,
};

/** Pone o saca "- ", "1. " o "> " al inicio de cada línea tocada por la selección. */
export function toggleLines(text: string, start: number, end: number, mark: LineMark): Edit {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = text.indexOf("\n", Math.max(end - (end > start && text[end - 1] === "\n" ? 1 : 0), start));
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const re = LINE_RE[mark];
  const conTexto = lines.filter((l) => l.trim());
  const quitar = conTexto.length > 0 && conTexto.every((l) => re.test(l));
  let n = 0;
  const out = lines.map((l) => {
    if (!l.trim()) return l;
    if (quitar) return l.replace(re, "");
    const limpio = l.replace(LINE_RE.bullet, "").replace(LINE_RE.number, "").replace(LINE_RE.quote, "");
    n += 1;
    return (mark === "bullet" ? "- " : mark === "number" ? `${n}. ` : "> ") + limpio;
  });
  const replaced = out.join("\n");
  return {
    text: text.slice(0, lineStart) + replaced + text.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + replaced.length,
  };
}

// ---------------------------------------------------------------------------
// Vista previa: el texto partido en piezas con su formato, para dibujarlo.
// ---------------------------------------------------------------------------

export interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
}

export interface PreviewLine {
  kind: "text" | "quote";
  spans: Span[];
}

const MARK_STYLE: Record<InlineMark, keyof Omit<Span, "text">> = { "*": "bold", _: "italic", "~": "strike" };
const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c);

/** Busca la primera marca válida: pegada al texto y sin letra/número del lado de afuera. */
function findMark(s: string): { i: number; j: number; mark: InlineMark } | null {
  for (let i = 0; i < s.length; i++) {
    const mark = s[i] as InlineMark;
    if (!(mark in MARK_STYLE)) continue;
    if (isWordChar(s[i - 1]) || !s[i + 1] || /\s/.test(s[i + 1]) || s[i + 1] === mark) continue;
    for (let j = i + 2; j < s.length; j++) {
      if (s[j] !== mark || /\s/.test(s[j - 1]) || isWordChar(s[j + 1])) continue;
      return { i, j, mark };
    }
  }
  return null;
}

function parseInline(s: string, style: Omit<Span, "text"> = {}): Span[] {
  const found = findMark(s);
  if (!found) return s ? [{ text: s, ...style }] : [];
  const { i, j, mark } = found;
  return [
    ...(i > 0 ? [{ text: s.slice(0, i), ...style }] : []),
    ...parseInline(s.slice(i + 1, j), { ...style, [MARK_STYLE[mark]]: true }),
    ...parseInline(s.slice(j + 1), style),
  ];
}

export function parseWhatsApp(text: string): PreviewLine[] {
  return text.split("\n").map((line) =>
    line.startsWith("> ") ? { kind: "quote", spans: parseInline(line.slice(2)) } : { kind: "text", spans: parseInline(line) }
  );
}
