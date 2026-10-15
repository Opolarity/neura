/**
 * Pruebas del formato de los mensajes del chat de soporte.
 * Sin dependencias: corren con el runner nativo de Node (24+ ejecuta TS):
 *
 *   node --test src/modules/support/utils/supportMarkdown.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  docToMarkdown,
  markdownToDoc,
  parseBlocks,
  parseInline,
  type EditorJsonNode,
  type InlineRun,
} from "./supportMarkdown.ts";

/* ---------- helpers para armar el JSON del editor ---------- */

const text = (value: string, ...marks: string[]): EditorJsonNode => ({
  type: "text",
  text: value,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});
const link = (value: string, href: string, ...marks: string[]): EditorJsonNode => ({
  type: "text",
  text: value,
  marks: [...marks.map((type) => ({ type })), { type: "link", attrs: { href } }],
});
const p = (...content: EditorJsonNode[]): EditorJsonNode =>
  content.length ? { type: "paragraph", content } : { type: "paragraph" };
const br: EditorJsonNode = { type: "hardBreak" };
const li = (...content: EditorJsonNode[]): EditorJsonNode => ({ type: "listItem", content });
const ul = (...items: EditorJsonNode[]): EditorJsonNode => ({ type: "bulletList", content: items });
const ol = (start: number, ...items: EditorJsonNode[]): EditorJsonNode => ({
  type: "orderedList",
  attrs: { start },
  content: items,
});
const doc = (...content: EditorJsonNode[]): EditorJsonNode => ({ type: "doc", content });

const run = (value: string, marks: InlineRun["marks"] = [], href?: string): InlineRun => ({
  text: value,
  marks,
  ...(href ? { href } : {}),
});

/** Ida y vuelta: el JSON → Markdown → JSON → Markdown debe dar el mismo texto. */
const roundTrip = (markdown: string) => docToMarkdown(markdownToDoc(markdown));

/* ---------- editor → Markdown ---------- */

describe("docToMarkdown", () => {
  it("serializa cada formato", () => {
    assert.equal(docToMarkdown(doc(p(text("hola", "bold")))), "**hola**");
    assert.equal(docToMarkdown(doc(p(text("hola", "italic")))), "*hola*");
    assert.equal(docToMarkdown(doc(p(text("hola", "strike")))), "~~hola~~");
    assert.equal(docToMarkdown(doc(p(text("npm run dev", "code")))), "`npm run dev`");
    assert.equal(
      docToMarkdown(doc(p(link("la guía", "https://neura.pe/guia")))),
      "[la guía](https://neura.pe/guia)",
    );
  });

  it("anida marcas con delimitadores bien cerrados", () => {
    assert.equal(
      docToMarkdown(doc(p(text("a", "bold"), text("b", "bold", "italic"), text(" c")))),
      "**a*b*** c",
    );
    assert.equal(docToMarkdown(doc(p(text("x", "italic"), text("y", "bold")))), "*x***y**");
  });

  it("deja fuera de los delimitadores los espacios de los bordes", () => {
    assert.equal(docToMarkdown(doc(p(text("Hola "), text("mundo ", "bold"), text("ya")))), "Hola **mundo** ya");
  });

  it("una URL suelta viaja sin [ ]( ) y se lee igual en Tasks", () => {
    const url = "https://erp.neura.pe/sales/orders/12345?a=b";
    assert.equal(docToMarkdown(doc(p(text("ver "), link(url, url)))), `ver ${url}`);
  });

  it("descarta enlaces con protocolos no permitidos", () => {
    assert.equal(docToMarkdown(doc(p(link("clic", "javascript:alert(1)")))), "clic");
  });

  it("párrafos y saltos de línea son líneas", () => {
    assert.equal(docToMarkdown(doc(p(text("uno")), p(), p(text("dos"), br, text("tres")))), "uno\n\ndos\ntres");
  });

  it("listas con viñetas, numeradas y anidadas", () => {
    assert.equal(
      docToMarkdown(doc(ul(li(p(text("uno"))), li(p(text("dos")), ul(li(p(text("dos.a")))))))),
      "- uno\n- dos\n  - dos.a",
    );
    assert.equal(docToMarkdown(doc(ol(3, li(p(text("tres"))), li(p(text("cuatro")))))), "3. tres\n4. cuatro");
  });

  it("un salto de línea dentro de un elemento queda como continuación", () => {
    assert.equal(docToMarkdown(doc(ul(li(p(text("uno"), br, text("sigue")))))), "- uno\n  sigue");
  });

  it("no genera HTML aunque el texto tenga etiquetas", () => {
    const out = docToMarkdown(doc(p(text("<b>hola</b> <script>x</script>"))));
    assert.equal(out, "<b>hola</b> <script>x</script>");
  });

  it("recorta los bordes como el servidor", () => {
    assert.equal(docToMarkdown(doc(p(text("  hola  ")), p())), "hola");
    assert.equal(docToMarkdown(doc(p())), "");
  });

  it("el texto común viaja limpio, sin escapes", () => {
    for (const plain of ["5 * 3 = 15", "nombre_de_archivo.xlsx", "C:\\Users\\Manuel", "precio ~ 20", "a*b"]) {
      assert.equal(docToMarkdown(doc(p(text(plain)))), plain, plain);
    }
  });

  it("escapa solo cuando el texto se leería como formato", () => {
    const literal = "**no es negrita**";
    const out = docToMarkdown(doc(p(text(literal))));
    assert.notEqual(out, literal);
    assert.deepEqual(parseInline(out), [run(literal)]);
  });

  it("escapa un párrafo que empieza como lista", () => {
    const out = docToMarkdown(doc(p(text("- no es viñeta")), p(text("1. tampoco"))));
    const blocks = parseBlocks(out);
    assert.equal(blocks.length, 2);
    assert.ok(blocks.every((block) => block.type === "line"));
    assert.deepEqual(blocks[0], { type: "line", runs: [run("- no es viñeta")] });
    assert.deepEqual(blocks[1], { type: "line", runs: [run("1. tampoco")] });
  });

  it("un código con ` adentro va como texto", () => {
    const out = docToMarkdown(doc(p(text("a`b", "code"))));
    assert.deepEqual(parseInline(out), [run("a`b")]);
  });
});

/* ---------- Markdown → formato ---------- */

describe("parseInline", () => {
  it("lee cada formato", () => {
    assert.deepEqual(parseInline("**a** *b* ~~c~~ `d`"), [
      run("a", ["bold"]),
      run(" "),
      run("b", ["italic"]),
      run(" "),
      run("c", ["strike"]),
      run(" "),
      run("d", ["code"]),
    ]);
  });

  it("lee enlaces con formato en el texto", () => {
    assert.deepEqual(parseInline("[**guía**](https://neura.pe)"), [run("guía", ["bold"], "https://neura.pe")]);
  });

  it("no acepta enlaces javascript:", () => {
    assert.deepEqual(parseInline("[x](javascript:alert(1))"), [run("[x](javascript:alert(1))")]);
  });

  it("el código no interpreta nada adentro", () => {
    assert.deepEqual(parseInline("`**a**`"), [run("**a**", ["code"])]);
  });

  it("un delimitador sin pareja queda como texto", () => {
    assert.deepEqual(parseInline("**sin cerrar"), [run("**sin cerrar")]);
    assert.deepEqual(parseInline("solo * uno"), [run("solo * uno")]);
    assert.deepEqual(parseInline("~tilde~"), [run("~tilde~")]);
  });
});

/* ---------- compatibilidad con mensajes antiguos (texto plano) ---------- */

describe("mensajes antiguos en texto plano", () => {
  const unchanged = [
    "Hola, buenos días",
    "reporte_ventas_2026_final.xlsx",
    "variable_con_guiones_bajos",
    "5 * 3 * 2 = 30",
    "C:\\Users\\Manuel\\Desktop",
    "precio: S/ 99 ~ aprox",
    "**",
    "*",
    "Hola 👽🔥 gracias!!",
    "https://erp.neura.pe/sales?filter=a_b&x=*",
    "<b>no es html</b>",
  ];

  for (const message of unchanged) {
    it(`se lee igual: ${message}`, () => {
      const blocks = parseBlocks(message);
      assert.equal(blocks.length, 1);
      assert.deepEqual(blocks[0], { type: "line", runs: [run(message)] });
    });
  }

  it("conserva líneas en blanco y saltos de línea", () => {
    const blocks = parseBlocks("uno\n\ntres");
    assert.deepEqual(blocks, [
      { type: "line", runs: [run("uno")] },
      { type: "line", runs: [] },
      { type: "line", runs: [run("tres")] },
    ]);
  });

  it("las líneas con guion ya se veían como lista y ahora lo son", () => {
    const [block] = parseBlocks("- uno\n- dos");
    assert.equal(block.type, "list");
  });

  it("acepta saltos de línea de Windows", () => {
    assert.equal(parseBlocks("a\r\nb").length, 2);
  });
});

/* ---------- ida y vuelta ---------- */

describe("ida y vuelta", () => {
  const cases = [
    "**negrita** y *cursiva* y ~~tachado~~ y `código`",
    "**a*b*** c",
    "[la guía](https://neura.pe/guia) y https://neura.pe/suelta",
    "- uno\n- dos\n  - dos.a\n  - dos.b\n- tres",
    "3. tres\n4. cuatro",
    "- uno\n  sigue en el mismo",
    "uno\n\ndos",
    "5 * 3 = 15 · nombre_de_archivo · C:\\Users",
  ];

  for (const markdown of cases) {
    it(markdown.replace(/\n/g, " ⏎ "), () => {
      assert.equal(roundTrip(markdown), markdown);
    });
  }

  it("un texto escapado vuelve igual", () => {
    const once = docToMarkdown(doc(p(text("**literal** y - no lista"))));
    assert.equal(roundTrip(once), once);
  });

  it("markdownToDoc arma el JSON que espera el editor", () => {
    assert.deepEqual(markdownToDoc("**a**\n- b"), {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "a", marks: [{ type: "bold" }] }] },
        {
          type: "bulletList",
          content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "b" }] }] }],
        },
      ],
    });
    assert.deepEqual(markdownToDoc(""), { type: "doc", content: [{ type: "paragraph" }] });
  });
});
