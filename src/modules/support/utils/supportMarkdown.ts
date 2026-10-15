/**
 * Formato de los mensajes del chat de soporte.
 *
 * El hilo vive en OPOLARITY Tasks como TEXTO PLANO: Tasks lo muestra con
 * `whitespace-pre-wrap` y su equipo responde desde un textarea. Por eso el
 * formato viaja como un subconjunto chico de Markdown, que se lee bien tal cual
 * en Tasks y que aquí se pinta con formato. Nunca viaja HTML.
 *
 *   **negrita**   *cursiva*   ~~tachado~~   `código`   [texto](https://…)
 *   - viñeta  ·  1. numerada  (2 espacios por nivel de anidación)
 *
 * Reglas pensadas para no romper los mensajes que ya existen en texto plano:
 * - `_` NUNCA da formato (nombres_de_archivo, snake_case quedan igual).
 * - Un delimitador solo abre si lo sigue algo que no es espacio y solo cierra
 *   si lo precede algo que no es espacio ("5 * 3 * 2" no es cursiva).
 * - Un delimitador sin pareja se muestra tal cual.
 * - La barra invertida solo escapa los caracteres de formato: "C:\Users" no cambia.
 *
 * Este archivo es TypeScript puro (sin JSX ni alias de imports): lo ejecutan
 * también las pruebas con `node --test`.
 */

/* ------------------------------------------------------------------ *
 * Tipos
 * ------------------------------------------------------------------ */

export type InlineMark = "bold" | "italic" | "strike" | "code";

/** Tramo de texto con el mismo formato. `href` = está dentro de un enlace. */
export interface InlineRun {
  text: string;
  marks: InlineMark[];
  href?: string;
}

export interface MdListItem {
  /** Líneas del elemento (la 2ª en adelante son saltos de línea dentro de él). */
  lines: InlineRun[][];
  /** Listas anidadas. */
  children: MdList[];
}

export interface MdList {
  type: "list";
  ordered: boolean;
  start: number;
  items: MdListItem[];
}

/** Una línea de texto; `runs` vacío = línea en blanco. */
export interface MdLine {
  type: "line";
  runs: InlineRun[];
}

export type MdBlock = MdLine | MdList;

/** Subconjunto del JSON de TipTap/ProseMirror que maneja el editor del chat. */
export interface EditorJsonNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: EditorJsonNode[];
}

/* ------------------------------------------------------------------ *
 * Constantes
 * ------------------------------------------------------------------ */

/** Caracteres que la barra invertida puede escapar. */
const ESCAPABLE = new Set(["\\", "*", "~", "`", "[", "]", "(", ")", "-", "+", ".", "#", "!", "_"]);

/** Orden fijo de anidación al escribir: así la salida es siempre la misma. */
const MARK_ORDER: InlineMark[] = ["bold", "italic", "strike"];

const LIST_RE = /^( *)([-*+]|(\d{1,9})[.)]) +(.*)$/;
const LINK_RE = /^\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s()]+)\)/i;
const SAFE_HREF_RE = /^(?:https?:\/\/|mailto:)[^\s]+$/i;

const isSpace = (ch: string | undefined) => ch === undefined || /\s/.test(ch);

/* ------------------------------------------------------------------ *
 * Inline: texto → tramos con formato
 * ------------------------------------------------------------------ */

type InlineTree =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; href: string; runs: InlineRun[] }
  | { kind: "mark"; mark: InlineMark; children: InlineTree[] };

interface Frame {
  delim: "" | "**" | "*" | "~~";
  children: InlineTree[];
}

const DELIM_MARK: Record<"**" | "*" | "~~", InlineMark> = {
  "**": "bold",
  "*": "italic",
  "~~": "strike",
};

/**
 * Lee el formato de UNA línea. Pila de delimitadores con anidación estricta:
 * es exactamente lo que produce `docToMarkdown`, y lo que no cierra queda como
 * texto.
 */
export function parseInline(src: string, allowLinks = true): InlineRun[] {
  const stack: Frame[] = [{ delim: "", children: [] }];
  let buffer = "";

  const top = () => stack[stack.length - 1];
  const flush = () => {
    if (buffer) {
      top().children.push({ kind: "text", text: buffer });
      buffer = "";
    }
  };
  const open = (delim: "**" | "*" | "~~") => {
    flush();
    stack.push({ delim, children: [] });
  };
  const close = () => {
    flush();
    const frame = stack.pop() as Frame;
    top().children.push({
      kind: "mark",
      mark: DELIM_MARK[frame.delim as "**" | "*" | "~~"],
      children: frame.children,
    });
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === "\\" && i + 1 < src.length && ESCAPABLE.has(src[i + 1])) {
      buffer += src[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        top().children.push({ kind: "code", text: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
      buffer += ch;
      i += 1;
      continue;
    }

    if (ch === "[" && allowLinks) {
      const match = LINK_RE.exec(src.slice(i));
      if (match) {
        flush();
        top().children.push({
          kind: "link",
          href: match[2],
          runs: parseInline(match[1], false),
        });
        i += match[0].length;
        continue;
      }
    }

    if (ch === "*" || ch === "~") {
      let length = 1;
      while (src[i + length] === ch) length += 1;
      const prev = src[i - 1];
      const next = src[i + length];
      const canOpen = !isSpace(next);
      const canClose = i > 0 && !isSpace(prev);

      let left = length;
      while (left > 0) {
        const current = top().delim;
        if (ch === "*") {
          if (canClose && current === "**" && left >= 2) {
            close();
            left -= 2;
          } else if (canClose && current === "*") {
            close();
            left -= 1;
          } else if (canOpen) {
            if (left >= 2) {
              open("**");
              left -= 2;
            } else {
              open("*");
              left -= 1;
            }
          } else {
            buffer += "*".repeat(left);
            left = 0;
          }
        } else if (left >= 2 && canClose && current === "~~") {
          close();
          left -= 2;
        } else if (left >= 2 && canOpen) {
          open("~~");
          left -= 2;
        } else {
          buffer += "~".repeat(left);
          left = 0;
        }
      }
      i += length;
      continue;
    }

    buffer += ch;
    i += 1;
  }

  flush();
  // Lo que quedó abierto no era formato: vuelve a ser texto
  while (stack.length > 1) {
    const frame = stack.pop() as Frame;
    top().children.push({ kind: "text", text: frame.delim }, ...frame.children);
  }

  const runs: InlineRun[] = [];
  flattenTree(stack[0].children, [], undefined, runs);
  return mergeRuns(runs);
}

function flattenTree(
  nodes: InlineTree[],
  marks: InlineMark[],
  href: string | undefined,
  out: InlineRun[],
) {
  for (const node of nodes) {
    if (node.kind === "text") {
      out.push({ text: node.text, marks: [...marks], ...(href ? { href } : {}) });
    } else if (node.kind === "code") {
      out.push({ text: node.text, marks: [...marks, "code"], ...(href ? { href } : {}) });
    } else if (node.kind === "link") {
      for (const run of node.runs) {
        out.push({ text: run.text, marks: uniqueMarks([...marks, ...run.marks]), href: node.href });
      }
    } else {
      flattenTree(node.children, uniqueMarks([...marks, node.mark]), href, out);
    }
  }
}

const uniqueMarks = (marks: InlineMark[]): InlineMark[] =>
  (["bold", "italic", "strike", "code"] as InlineMark[]).filter((m) => marks.includes(m));

const sameFormat = (a: InlineRun, b: InlineRun) =>
  a.href === b.href &&
  a.marks.length === b.marks.length &&
  a.marks.every((mark) => b.marks.includes(mark));

/** Junta tramos vecinos con el mismo formato y descarta los vacíos. */
export function mergeRuns(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const last = out[out.length - 1];
    if (last && sameFormat(last, run)) last.text += run.text;
    else out.push({ ...run, marks: uniqueMarks(run.marks) });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Bloques: texto → líneas y listas
 * ------------------------------------------------------------------ */

/** Lee el mensaje completo: líneas sueltas (como hoy) y listas. */
export function parseBlocks(src: string): MdBlock[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const match = LIST_RE.exec(lines[i]);
    if (match && match[1].length < 2) {
      const { list, next } = parseList(lines, i, match[1].length);
      blocks.push(list);
      i = next;
    } else {
      blocks.push({ type: "line", runs: parseInline(lines[i]) });
      i += 1;
    }
  }

  return blocks;
}

function parseList(lines: string[], from: number, baseIndent: number): { list: MdList; next: number } {
  const first = LIST_RE.exec(lines[from]) as RegExpExecArray;
  const ordered = first[3] !== undefined;
  const list: MdList = {
    type: "list",
    ordered,
    start: ordered ? Number(first[3]) : 1,
    items: [],
  };

  let i = from;
  while (i < lines.length) {
    const line = lines[i];
    const match = LIST_RE.exec(line);
    const indent = line.length - line.trimStart().length;

    if (match && indent >= baseIndent && indent < baseIndent + 2) {
      // Elemento del mismo nivel; si cambia el tipo de lista, empieza otra
      if ((match[3] !== undefined) !== ordered) break;
      list.items.push({ lines: [parseInline(match[4])], children: [] });
      i += 1;
      continue;
    }

    const current = list.items[list.items.length - 1];
    if (current && line.trim() !== "" && indent >= baseIndent + 2) {
      if (match) {
        // Lista anidada dentro del elemento actual
        const nested = parseList(lines, i, indent);
        current.children.push(nested.list);
        i = nested.next;
      } else {
        // Continuación: salto de línea dentro del mismo elemento
        current.lines.push(parseInline(line.trimStart()));
        i += 1;
      }
      continue;
    }

    break;
  }

  return { list, next: i };
}

/* ------------------------------------------------------------------ *
 * Editor (JSON de TipTap) → Markdown
 * ------------------------------------------------------------------ */

/** Texto escapado: sus caracteres nunca actúan como formato. */
const escapeAll = (text: string) => text.replace(/[\\*~`[\]]/g, (ch) => `\\${ch}`);

/** Escapa solo si hace falta: el texto común viaja limpio y se lee bien en Tasks. */
const escapeIfNeeded = (text: string) => {
  const parsed = parseInline(text);
  const literal =
    parsed.length === 0 ||
    (parsed.length === 1 && parsed[0].marks.length === 0 && !parsed[0].href && parsed[0].text === text);
  return literal ? text : escapeAll(text);
};

/** Una línea que empieza como "- x" o "1. x" se leería como lista: se escapa. */
const escapeLineStart = (line: string) => {
  const match = LIST_RE.exec(line);
  if (!match) return line;
  const indent = match[1];
  const marker = match[2];
  // "1. x" → "1\. x"   ·   "- x" → "\- x"
  const escapedMarker = /\d/.test(marker[0])
    ? `${marker.slice(0, -1)}\\${marker.slice(-1)}`
    : `\\${marker}`;
  return `${indent}${escapedMarker}${line.slice(indent.length + marker.length)}`;
};

const markOf = (type: string): InlineMark | null =>
  type === "bold" || type === "italic" || type === "strike" || type === "code" ? type : null;

/** Contenido inline de un párrafo → líneas (cada hardBreak abre una línea). */
function inlineToRunLines(nodes: EditorJsonNode[] | undefined): InlineRun[][] {
  const lines: InlineRun[][] = [[]];
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      lines.push([]);
      continue;
    }
    if (node.type !== "text" || !node.text) continue;
    const marks: InlineMark[] = [];
    let href: string | undefined;
    for (const mark of node.marks ?? []) {
      const known = markOf(mark.type);
      if (known) marks.push(known);
      if (mark.type === "link" && typeof mark.attrs?.href === "string") {
        href = mark.attrs.href;
      }
    }
    // Un texto con saltos de línea literales (pegado) también abre líneas
    node.text.split("\n").forEach((part, index) => {
      if (index > 0) lines.push([]);
      lines[lines.length - 1].push({ text: part, marks, ...(href ? { href } : {}) });
    });
  }
  return lines.map(mergeRuns);
}

/**
 * Serializa los tramos de una línea. Abre y cierra delimitadores con
 * anidación estricta (como una pila) y deja los espacios de los bordes FUERA
 * de los delimitadores: "**hola **" no cerraría.
 */
function serializeRuns(runs: InlineRun[], escape: (text: string) => string): string {
  let out = "";
  let i = 0;

  while (i < runs.length) {
    const run = runs[i];
    const href = run.href && SAFE_HREF_RE.test(run.href) ? run.href : undefined;

    if (href) {
      // Tramos seguidos del mismo enlace van dentro de un solo [ ](…)
      const group: InlineRun[] = [];
      while (i < runs.length && runs[i].href === run.href) {
        group.push({ ...runs[i], href: undefined });
        i += 1;
      }
      const label = group.map((r) => r.text).join("");
      const plain = group.every((r) => r.marks.length === 0);
      if (plain && label === href) {
        out += href; // URL suelta: se lee igual en Tasks
      } else {
        const safeHref = href.replace(/\(/g, "%28").replace(/\)/g, "%29");
        out += `[${serializeMarked(group, escape)}](${safeHref})`;
      }
      continue;
    }

    const group: InlineRun[] = [];
    while (i < runs.length) {
      const candidate = runs[i];
      const candidateHref =
        candidate.href && SAFE_HREF_RE.test(candidate.href) ? candidate.href : undefined;
      if (candidateHref) break;
      group.push({ ...candidate, href: undefined });
      i += 1;
    }
    out += serializeMarked(group, escape);
  }

  return out;
}

function serializeMarked(runs: InlineRun[], escape: (text: string) => string): string {
  const DELIM: Record<string, string> = { bold: "**", italic: "*", strike: "~~" };
  const stack: InlineMark[] = [];
  let out = "";
  let pendingSpace = "";

  const closeFrom = (index: number) => {
    while (stack.length > index) out += DELIM[stack.pop() as InlineMark];
  };

  for (const run of runs) {
    // Un código con ` adentro ya llega sin la marca (ver serializeLine)
    const code = run.marks.includes("code");
    const text = run.text;
    const wanted = MARK_ORDER.filter((mark) => run.marks.includes(mark));

    const leading = text.match(/^\s*/)?.[0] ?? "";
    const trailing = leading.length === text.length ? "" : text.match(/\s*$/)?.[0] ?? "";
    const core = text.slice(leading.length, text.length - trailing.length);

    if (!core) {
      pendingSpace += text;
      continue;
    }

    // Cerrar lo que sobra (y todo lo que esté encima, por la anidación)
    const firstMismatch = stack.findIndex((mark) => !wanted.includes(mark));
    if (firstMismatch !== -1) closeFrom(firstMismatch);

    out += pendingSpace + leading;
    pendingSpace = "";

    for (const mark of wanted) {
      if (!stack.includes(mark)) {
        stack.push(mark);
        out += DELIM[mark];
      }
    }

    out += code && !core.includes("`") ? `\`${core}\`` : escape(core);
    pendingSpace = trailing;
  }

  closeFrom(0);
  return out + pendingSpace;
}

/** Serializa una línea y comprueba que se vuelve a leer igual; si no, escapa todo. */
function serializeLine(runs: InlineRun[]): string {
  const normalized = mergeRuns(
    runs.map((run) =>
      run.marks.includes("code") && run.text.includes("`")
        ? { ...run, marks: run.marks.filter((m) => m !== "code") }
        : run,
    ),
  );
  const light = serializeRuns(normalized, escapeIfNeeded);
  if (sameRuns(parseInline(light), normalized)) return escapeLineStart(light);
  return escapeLineStart(serializeRuns(normalized, escapeAll));
}

const sameRuns = (a: InlineRun[], b: InlineRun[]) => {
  const left = mergeRuns(a.map((run) => ({ ...run, href: run.href && SAFE_HREF_RE.test(run.href) ? run.href : undefined })));
  const right = mergeRuns(b.map((run) => ({ ...run, href: run.href && SAFE_HREF_RE.test(run.href) ? run.href : undefined })));
  return (
    left.length === right.length &&
    left.every((run, index) => run.text === right[index].text && sameFormat(run, right[index]))
  );
};

function serializeBlocks(nodes: EditorJsonNode[] | undefined, depth: number): string[] {
  const out: string[] = [];
  const indent = "  ".repeat(depth);

  for (const node of nodes ?? []) {
    if (node.type === "bulletList" || node.type === "orderedList") {
      const ordered = node.type === "orderedList";
      const start = ordered && typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      (node.content ?? []).forEach((item, index) => {
        const marker = ordered ? `${start + index}.` : "-";
        let firstLine = true;
        for (const child of item.content ?? []) {
          if (child.type === "bulletList" || child.type === "orderedList") {
            out.push(...serializeBlocks([child], depth + 1));
            continue;
          }
          for (const runs of inlineToRunLines(child.content)) {
            const text = serializeLine(runs);
            if (firstLine) {
              out.push(`${indent}${marker} ${text}`);
              firstLine = false;
            } else {
              out.push(`${indent}  ${escapeLineStart(text)}`);
            }
          }
        }
        if (firstLine) out.push(`${indent}${marker} `);
      });
      continue;
    }

    // Párrafo (y cualquier otro bloque con texto: se aplana a líneas)
    for (const runs of inlineToRunLines(node.content)) {
      out.push(serializeLine(runs));
    }
  }

  return out;
}

/** JSON del editor → texto que se envía. Sin espacios en los bordes (el servidor recorta igual). */
export function docToMarkdown(doc: EditorJsonNode | null | undefined): string {
  if (!doc) return "";
  return serializeBlocks(doc.content, 0)
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ *
 * Markdown → JSON del editor (borradores guardados)
 * ------------------------------------------------------------------ */

const runsToNodes = (runs: InlineRun[]): EditorJsonNode[] =>
  runs
    .filter((run) => run.text)
    .map((run) => {
      const marks: EditorJsonNode["marks"] = run.marks.map((mark) => ({ type: mark }));
      if (run.href) marks.push({ type: "link", attrs: { href: run.href } });
      return { type: "text", text: run.text, ...(marks.length > 0 ? { marks } : {}) };
    });

const linesToParagraph = (lines: InlineRun[][]): EditorJsonNode => {
  const content: EditorJsonNode[] = [];
  lines.forEach((runs, index) => {
    if (index > 0) content.push({ type: "hardBreak" });
    content.push(...runsToNodes(runs));
  });
  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
};

const listToNode = (list: MdList): EditorJsonNode => ({
  type: list.ordered ? "orderedList" : "bulletList",
  ...(list.ordered ? { attrs: { start: list.start } } : {}),
  content: list.items.map((item) => ({
    type: "listItem",
    content: [linesToParagraph(item.lines), ...item.children.map(listToNode)],
  })),
});

export function markdownToDoc(src: string | null | undefined): EditorJsonNode {
  const blocks = parseBlocks(src ?? "");
  const content = blocks.map((block) =>
    block.type === "list" ? listToNode(block) : linesToParagraph([block.runs]),
  );
  return { type: "doc", content: content.length > 0 ? content : [{ type: "paragraph" }] };
}
