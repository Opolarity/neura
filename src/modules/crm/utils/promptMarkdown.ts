import { getSchema, type JSONContent } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";

/**
 * El formato del prompt del chatbot (Markdown acotado) ↔ el editor de
 * Consideraciones (TipTap). La IA lee `**negrita**`, `*cursiva*`, `` `texto
 * exacto` ``, puntos `- ` / `1. `, subpuntos con dos espacios y citas `> `;
 * la tienda ve el texto ya formateado, sin esos símbolos.
 *
 * Lo que se guarda tiene que ser EXACTAMENTE lo que había si nadie tocó nada:
 * por eso un párrafo solo se edita con formato si ida y vuelta (texto → editor
 * → texto) da el mismo texto (`canEditFormatted`). Si no, queda el cuadro de
 * texto de siempre.
 */

/** Las extensiones del editor: solo lo que el prompt sabe escribir. */
export const PROMPT_EDITOR_EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: false,
  }),
];

const schema = getSchema(PROMPT_EDITOR_EXTENSIONS);

type Mark = "bold" | "italic" | "code";

// --- Texto → documento --------------------------------------------------------

const text = (value: string, marks: Mark[]): JSONContent => ({
  type: "text",
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});

/** `**negrita**`, `*cursiva*` y `` `exacto` `` de una línea. Lo que no cierra queda como texto. */
const parseInline = (s: string, marks: Mark[] = []): JSONContent[] => {
  const out: JSONContent[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push(text(buf, marks));
    buf = "";
  };
  let i = 0;
  while (i < s.length) {
    if (s.startsWith("**", i)) {
      const j = s.indexOf("**", i + 2);
      if (j > i + 2) {
        flush();
        out.push(...parseInline(s.slice(i + 2, j), [...marks, "bold"]));
        i = j + 2;
        continue;
      }
    }
    if (s[i] === "`") {
      const j = s.indexOf("`", i + 1);
      if (j > i + 1) {
        flush();
        out.push(text(s.slice(i + 1, j), [...marks, "code"]));
        i = j + 1;
        continue;
      }
    }
    if (s[i] === "*" && s[i + 1] && s[i + 1] !== " " && s[i + 1] !== "*") {
      let j = i + 1;
      while (j < s.length && !(s[j] === "*" && s[j + 1] !== "*" && s[j - 1] !== " ")) j += 1;
      if (j < s.length) {
        flush();
        out.push(...parseInline(s.slice(i + 1, j), [...marks, "italic"]));
        i = j + 1;
        continue;
      }
    }
    buf += s[i];
    i += 1;
  }
  flush();
  return out;
};

/** Varias líneas en un párrafo, separadas por saltos de línea. */
const paragraph = (lines: string[]): JSONContent => {
  const content: JSONContent[] = [];
  lines.forEach((l, n) => {
    if (n) content.push({ type: "hardBreak" });
    content.push(...parseInline(l));
  });
  return { type: "paragraph", ...(content.length ? { content } : {}) };
};

const BULLET = /^( *)- (.*)$/;
const ORDERED = /^( *)(\d+)\. (.*)$/;
const QUOTE = /^> (.*)$/;

/** Las líneas de una lista desde `start`, con sangría `indent`. Devuelve el nodo y hasta dónde llegó. */
const parseList = (lines: string[], start: number, indent: number): [JSONContent, number] => {
  const first = lines[start]!;
  const ordered = ORDERED.test(first) && (ORDERED.exec(first)![1]!.length === indent);
  const items: JSONContent[] = [];
  let i = start;
  const startNum = ordered ? Number(ORDERED.exec(first)![2]) : 1;
  while (i < lines.length) {
    const l = lines[i]!;
    const m = ordered ? ORDERED.exec(l) : BULLET.exec(l);
    if (!m || m[1]!.length !== indent) break;
    const marker = ordered ? `${m[2]}. ` : "- ";
    const inner = indent + marker.length;
    const content: JSONContent[] = [];
    let para: string[] = [ordered ? m[3]! : m[2]!];
    i += 1;
    while (i < lines.length) {
      const next = lines[i]!;
      const sub = BULLET.exec(next) ?? ORDERED.exec(next);
      if (sub && sub[1]!.length > indent) {
        if (para.length) content.push(paragraph(para));
        para = [];
        const [list, end] = parseList(lines, i, sub[1]!.length);
        content.push(list);
        i = end;
        continue;
      }
      // Una línea que sigue el punto, con la sangría de su texto.
      if (!sub && next.startsWith(" ".repeat(inner)) && next.trim()) {
        para.push(next.slice(inner));
        i += 1;
        continue;
      }
      break;
    }
    if (para.length) content.push(paragraph(para));
    items.push({ type: "listItem", content });
  }
  return [
    ordered ? { type: "orderedList", attrs: { start: startNum }, content: items } : { type: "bulletList", content: items },
    i,
  ];
};

/** Un párrafo del prompt como documento del editor. */
export const markdownToDoc = (md: string): JSONContent => {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const content: JSONContent[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i]!;
    if (BULLET.test(l) || ORDERED.test(l)) {
      const indent = (BULLET.exec(l) ?? ORDERED.exec(l))![1]!.length;
      const [list, end] = parseList(lines, i, indent);
      content.push(list);
      i = end;
      continue;
    }
    if (QUOTE.test(l)) {
      const quoted: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i]!)) quoted.push(QUOTE.exec(lines[i++]!)![1]!);
      content.push({ type: "blockquote", content: [paragraph(quoted)] });
      continue;
    }
    const plain: string[] = [];
    while (i < lines.length && !BULLET.test(lines[i]!) && !ORDERED.test(lines[i]!) && !QUOTE.test(lines[i]!)) plain.push(lines[i++]!);
    content.push(paragraph(plain));
  }
  return { type: "doc", content };
};

// --- Documento → texto --------------------------------------------------------

const ORDER: Mark[] = ["bold", "italic", "code"];
const SYMBOL: Record<Mark, string> = { bold: "**", italic: "*", code: "`" };

/** Las líneas de un párrafo (separadas por hardBreak), con sus marcas. */
const inlineLines = (nodes: JSONContent[] = []): string[] => {
  const lines: string[] = [];
  let line = "";
  let open: Mark[] = [];
  const closeTo = (keep: Mark[]) => {
    while (open.length && !keep.includes(open[open.length - 1]!)) line += SYMBOL[open.pop()!];
    // Si una marca de afuera se cierra, las de adentro también.
    const idx = open.findIndex((m) => !keep.includes(m));
    if (idx >= 0) {
      for (const m of open.slice(idx).reverse()) line += SYMBOL[m];
      open = open.slice(0, idx);
    }
  };
  for (const n of nodes) {
    if (n.type === "hardBreak") {
      closeTo([]);
      lines.push(line);
      line = "";
      continue;
    }
    const marks = ORDER.filter((m) => n.marks?.some((x) => x.type === m));
    closeTo(marks);
    for (const m of marks) if (!open.includes(m)) {
      line += SYMBOL[m];
      open.push(m);
    }
    line += n.text ?? "";
  }
  closeTo([]);
  lines.push(line);
  return lines;
};

const blockLines = (node: JSONContent, indent: number): string[] => {
  const pad = " ".repeat(indent);
  switch (node.type) {
    case "paragraph":
      return inlineLines(node.content).map((l) => pad + l);
    case "blockquote":
      return (node.content ?? []).flatMap((p) => inlineLines(p.content).map((l) => `${pad}> ${l}`));
    case "bulletList":
    case "orderedList": {
      const start = Number(node.attrs?.start ?? 1);
      return (node.content ?? []).flatMap((item, k) => {
        const marker = node.type === "orderedList" ? `${start + k}. ` : "- ";
        const inner = indent + marker.length;
        const out: string[] = [];
        (item.content ?? []).forEach((child, c) => {
          if (child.type === "paragraph") {
            const ls = inlineLines(child.content);
            ls.forEach((l, n) => out.push(c === 0 && n === 0 ? pad + marker + l : " ".repeat(inner) + l));
          } else {
            const sub = blockLines(child, inner);
            if (c === 0) out.push(pad + marker.trimEnd());
            out.push(...sub);
          }
        });
        return out;
      });
    }
    default:
      return [];
  }
};

/** El documento del editor como texto del prompt. */
export const docToMarkdown = (doc: JSONContent): string => (doc.content ?? []).flatMap((b) => blockLines(b, 0)).join("\n");

/** Pasa el documento por el esquema del editor (como al cargarlo): marcas en su orden, nodos válidos. */
const normalize = (doc: JSONContent): JSONContent => PMNode.fromJSON(schema, doc).toJSON() as JSONContent;

/** ¿Se puede editar con formato sin que cambie nada de lo que no se toca? */
export const canEditFormatted = (md: string): boolean => {
  try {
    return docToMarkdown(normalize(markdownToDoc(md))) === md;
  } catch {
    return false;
  }
};
