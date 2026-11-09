import jsPDF from "jspdf";
import { PX_PER_MM } from "../lib/units";
import { columnOffsetsMm, sheetPages, sheetWidthMm } from "../lib/imposition";
import type { Imposition } from "../../types/printTemplates.types";

/**
 * Dibuja en un PDF vectorial (jsPDF) una hoja ya armada en el navegador: el
 * navegador hace el acomodo (filas, saltos de línea, tablas, saltos de página)
 * igual que en el editor, y aquí se mide cada cosa y se dibuja en mm. Los
 * textos van como texto (nítidos y livianos), los bordes como líneas y los
 * fondos como rectángulos; solo las imágenes (logo, QR) van como imagen.
 *
 * Para no gastar tinta: no se dibujan los fondos blancos ni transparentes (el
 * papel ya es blanco) ni nada fuera de la hoja.
 *
 * Primero se dibujan las páginas lógicas (las del editor, con sus cortes) y
 * después se acomodan en las hojas físicas según la imposición: cada hoja
 * lleva su página en cada columna, y el documento se repite por copias.
 */

export interface PaperLayout {
  /** El papel en px (el elemento de la hoja, a escala 1). */
  paper: HTMLElement;
  /** Lo que se dibuja: la Hoja y las copias de encabezado. */
  roots: HTMLElement[];
  widthMm: number;
  /** Alto de una página; con alto automático, el del contenido. */
  pageHeightMm: number;
  /** Las páginas lógicas: las de la tira, con sus cortes. */
  pageCount: number;
  /** Columnas y copias de la hoja física (lib/imposition). */
  imposition: Imposition;
}

/**
 * Un dibujo de una página lógica, para hacerlo en cada lugar donde va: en la
 * columna que empieza en `dx` (mm) de la hoja física actual.
 */
export type DrawOp = (doc: jsPDF, dx: number) => void;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

const parseColor = (value: string): Color | null => {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = "1"] = match[1].split(/[\s,/]+/).filter(Boolean);
  return { r: +r, g: +g, b: +b, a: +a };
};

/** Lo que no se imprime: transparente o blanco. */
const isBlank = (color: Color | null) =>
  !color ||
  color.a === 0 ||
  (color.r >= 250 && color.g >= 250 && color.b >= 250);

const pxToMm = (px: number) => px / PX_PER_MM;

/** Resolución de las imágenes en el PDF: la de una impresora (300 ppp). */
const IMAGE_PX_PER_MM = 300 / 25.4;

/**
 * Una imagen lista para el PDF (PNG, con su transparencia), del tamaño con
 * que se imprime: un logo de 1200 × 1600 px en una caja de 38 × 12 mm baja a
 * unos 140 px. jsPDF procesa los PNG píxel por píxel, y a tamaño completo
 * «Probar PDF» tardaba minutos. Nunca se agranda: el QR y el código de barras
 * quedan como están, nítidos.
 *
 * Sin fondo: pintada sobre blanco, una imagen tapaba con su rectángulo a lo
 * que tuviera debajo (otra imagen, un fondo de color), y en la hoja se veían
 * las dos.
 */
async function imageForPdf(url: string, widthMm: number, heightMm: number) {
  const blob = await (await fetch(url)).blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(
      1,
      Math.max(
        (widthMm * IMAGE_PX_PER_MM) / image.naturalWidth,
        (heightMm * IMAGE_PX_PER_MM) / image.naturalHeight,
      ),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Sin canvas");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** El tipo de letra de jsPDF que más se parece (solo trae estas tres). */
const pdfFont = (family: string) => {
  const name = family.toLowerCase();
  if (name.includes("times")) return "times";
  if (name.includes("courier")) return "courier";
  return "helvetica";
};

const pdfFontStyle = (weight: string, style: string) => {
  const bold = parseInt(weight, 10) >= 600;
  const italic = style === "italic" || style === "oblique";
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
};

const applyCase = (text: string, transform: string) => {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize")
    return text.replace(
      /(^|\s)(\p{L})/gu,
      (_, space, letter: string) => space + letter.toUpperCase(),
    );
  return text;
};

/** Una línea de texto en pantalla. */
interface LineBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Las líneas de un nodo de texto: su texto y su caja en pantalla. El
 * navegador da varias cajas por línea (el espacio del final de una línea
 * partida viene aparte): se juntan las que están a la misma altura.
 */
function textLines(node: Text): { text: string; box: LineBox }[] {
  const range = document.createRange();
  range.selectNodeContents(node);
  const lines: LineBox[] = [];
  for (const rect of Array.from(range.getClientRects())) {
    if (!rect.width || !rect.height) continue;
    const same = lines.find((line) => Math.abs(line.top - rect.top) < 1);
    if (same) {
      same.left = Math.min(same.left, rect.left);
      same.right = Math.max(same.right, rect.right);
      same.bottom = Math.max(same.bottom, rect.bottom);
    } else
      lines.push({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      });
  }
  lines.sort((a, b) => a.top - b.top);
  if (!lines.length) return [];
  const content = node.data;
  // El primer carácter de cada línea: el primero que no queda arriba de ella.
  const startOf = (lineTop: number) => {
    let low = 0;
    let high = content.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      range.setStart(node, middle);
      range.setEnd(node, middle + 1);
      if (range.getBoundingClientRect().bottom <= lineTop + 0.5)
        low = middle + 1;
      else high = middle;
    }
    return low;
  };
  const starts = lines.map((line, index) =>
    index === 0 ? 0 : startOf(line.top),
  );
  return lines.map((box, index) => ({
    box,
    text: content.slice(starts[index], starts[index + 1] ?? content.length),
  }));
}

/**
 * Un dibujo en mm sobre la tira de páginas lógicas, repartido entre ellas:
 * cada página guarda sus dibujos, que luego se hacen en las hojas físicas.
 */
class PageWriter {
  readonly pages: DrawOp[][];

  constructor(readonly layout: PaperLayout) {
    this.pages = Array.from({ length: layout.pageCount }, () => []);
  }

  draw(page: number, op: DrawOp) {
    this.pages[page].push(op);
  }

  /** La página de una altura (mm desde arriba de la tira). */
  pageOf(y: number) {
    return Math.min(
      this.layout.pageCount - 1,
      Math.max(0, Math.floor(y / this.layout.pageHeightMm)),
    );
  }

  /** Cada trozo de una caja en las páginas que toca, con su y en la página. */
  slices(box: Box): (Box & { page: number })[] {
    const height = this.layout.pageHeightMm;
    const result: (Box & { page: number })[] = [];
    for (
      let page = this.pageOf(box.y);
      page <= this.pageOf(box.y + box.h - 0.01);
      page++
    ) {
      const top = Math.max(box.y, page * height);
      const bottom = Math.min(box.y + box.h, (page + 1) * height);
      if (bottom <= top) continue;
      result.push({
        page,
        x: box.x,
        y: top - page * height,
        w: box.w,
        h: bottom - top,
      });
    }
    return result;
  }

  /** La página de una altura y la altura dentro de ella. */
  at(y: number) {
    const page = this.pageOf(y);
    return { page, y: y - page * this.layout.pageHeightMm };
  }
}

/** Una página lógica dibujada: sus dibujos y su alto. */
export interface LogicalPage {
  ops: DrawOp[];
  heightMm: number;
}

/** El PDF de una hoja armada: sus páginas lógicas, acomodadas (composePdf). */
export async function drawToPdf(layout: PaperLayout): Promise<jsPDF> {
  return composePdf(await drawPages(layout), {
    widthMm: layout.widthMm,
    imposition: layout.imposition,
  });
}

/**
 * Las páginas lógicas de una hoja armada: lo que se dibuja en cada una, en
 * mm, para hacerlo después en las hojas físicas (composePdf).
 */
export async function drawPages(layout: PaperLayout): Promise<LogicalPage[]> {
  // Mide los textos (getTextWidth) mientras se recorre la hoja.
  const doc = new jsPDF({ unit: "mm" });
  const writer = new PageWriter(layout);
  const origin = layout.paper.getBoundingClientRect();
  const boxOf = (rect: DOMRect): Box => ({
    x: pxToMm(rect.left - origin.left),
    y: pxToMm(rect.top - origin.top),
    w: pxToMm(rect.width),
    h: pxToMm(rect.height),
  });

  const drawBox = (element: HTMLElement, style: CSSStyleDeclaration) => {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const box = boxOf(rect);
    const background = parseColor(style.backgroundColor);
    if (!isBlank(background) && background) {
      const { r, g, b } = background;
      for (const slice of writer.slices(box))
        writer.draw(slice.page, (pdf, dx) => {
          pdf.setFillColor(r, g, b);
          pdf.rect(slice.x + dx, slice.y, slice.w, slice.h, "F");
        });
    }
    const sides = [
      { side: "Top", from: [0, 0], to: [1, 0] },
      { side: "Right", from: [1, 0], to: [1, 1] },
      { side: "Bottom", from: [0, 1], to: [1, 1] },
      { side: "Left", from: [0, 0], to: [0, 1] },
    ] as const;
    for (const { side, from, to } of sides) {
      const width = parseFloat(
        style.getPropertyValue(`border-${side.toLowerCase()}-width`),
      );
      const lineStyle = style.getPropertyValue(
        `border-${side.toLowerCase()}-style`,
      );
      const color = parseColor(
        style.getPropertyValue(`border-${side.toLowerCase()}-color`),
      );
      if (!width || lineStyle === "none" || !color || color.a === 0) continue;
      const widthMm = pxToMm(width);
      const dash =
        lineStyle === "dashed"
          ? [widthMm * 3, widthMm * 2]
          : lineStyle === "dotted"
            ? [widthMm, widthMm]
            : [];
      // Cada línea lleva su trazo: se dibuja después, entre otros dibujos.
      const stroke = (pdf: jsPDF) => {
        pdf.setDrawColor(color.r, color.g, color.b);
        pdf.setLineWidth(lineStyle === "double" ? widthMm / 3 : widthMm);
        pdf.setLineDashPattern(dash, 0);
      };
      // La línea va por el centro del borde, que está por dentro de la caja.
      const inset = widthMm / 2;
      const x1 =
        box.x +
        from[0] * box.w +
        (side === "Right" ? -inset : side === "Left" ? inset : 0);
      const x2 =
        box.x +
        to[0] * box.w +
        (side === "Right" ? -inset : side === "Left" ? inset : 0);
      const y1 =
        box.y +
        from[1] * box.h +
        (side === "Bottom" ? -inset : side === "Top" ? inset : 0);
      const y2 =
        box.y +
        to[1] * box.h +
        (side === "Bottom" ? -inset : side === "Top" ? inset : 0);
      if (y1 === y2) {
        const { page, y } = writer.at(y1);
        const second = y + (side === "Top" ? widthMm * 0.66 : -widthMm * 0.66);
        writer.draw(page, (pdf, dx) => {
          stroke(pdf);
          pdf.line(x1 + dx, y, x2 + dx, y);
          if (lineStyle === "double")
            pdf.line(x1 + dx, second, x2 + dx, second);
          pdf.setLineDashPattern([], 0);
        });
      } else {
        for (const slice of writer.slices({ x: x1, y: y1, w: 0, h: y2 - y1 }))
          writer.draw(slice.page, (pdf, dx) => {
            stroke(pdf);
            pdf.line(slice.x + dx, slice.y, slice.x + dx, slice.y + slice.h);
            pdf.setLineDashPattern([], 0);
          });
      }
    }
  };

  const drawText = (node: Text, style: CSSStyleDeclaration) => {
    const fontSizePt = parseFloat(style.fontSize) * 0.75;
    const color = parseColor(style.color) ?? { r: 0, g: 0, b: 0, a: 1 };
    const align = style.textAlign;
    // El espacio entre letras, en mm ("normal" = 0).
    const charSpace = pxToMm(parseFloat(style.letterSpacing) || 0);
    const font = pdfFont(style.fontFamily);
    const fontStyle = pdfFontStyle(style.fontWeight, style.fontStyle);
    const setTextStyle = (pdf: jsPDF) => {
      pdf.setFont(font, fontStyle);
      pdf.setFontSize(fontSizePt);
      pdf.setTextColor(color.r, color.g, color.b);
    };
    // Para medir los textos ahora; cada texto la vuelve a poner al dibujarse.
    setTextStyle(doc);
    const decoration = style.textDecorationLine;
    // «Cortar» (overflow oculto en el Texto): solo las líneas que se ven, y
    // la que se pasa de ancho, recortada (con «...» si lo pide).
    const parent = node.parentElement;
    const clipped =
      Boolean(parent) &&
      (style.overflowX === "hidden" || style.overflowY === "hidden");
    const clip = clipped && parent ? parent.getBoundingClientRect() : null;
    const ellipsis =
      style.textOverflow === "ellipsis" ||
      style.getPropertyValue("-webkit-line-clamp") !== "none";
    const allLines = textLines(node);
    const lines = clip
      ? allLines.filter((line) => line.box.bottom <= clip.bottom + 1)
      : allLines;
    const cutAfter = lines.length < allLines.length;
    const fitWidth = (value: string, maxMm: number, dots: boolean) => {
      if (doc.getTextWidth(value) <= maxMm) return value;
      let cut = value;
      const tail = dots ? "..." : "";
      while (cut.length && doc.getTextWidth(cut + tail) > maxMm)
        cut = cut.slice(0, -1);
      return cut.trimEnd() + tail;
    };
    for (const [index, line] of lines.entries()) {
      let text = applyCase(
        line.text.replace(/\n$/, ""),
        style.textTransform,
      ).trim();
      if (clip) {
        const maxMm = pxToMm(clip.right - line.box.left);
        const last = index === lines.length - 1;
        if (last && cutAfter && ellipsis)
          text = fitWidth(text + "...", maxMm, true);
        else if (line.box.right > clip.right + 0.5)
          text = fitWidth(text, maxMm, ellipsis);
      }
      if (!text) continue;
      const box = boxOf(
        new DOMRect(
          line.box.left,
          line.box.top,
          line.box.right - line.box.left,
          line.box.bottom - line.box.top,
        ),
      );
      const { page, y } = writer.at(box.y + box.h / 2);
      const x =
        align === "right"
          ? box.x + box.w
          : align === "center"
            ? box.x + box.w / 2
            : box.x;
      const width = doc.getTextWidth(text);
      const left =
        align === "right" ? x - width : align === "center" ? x - width / 2 : x;
      const underline = decoration.includes("underline");
      const lineThrough = decoration.includes("line-through");
      const underlineY = y + pxToMm(parseFloat(style.fontSize)) * 0.4;
      writer.draw(page, (pdf, dx) => {
        setTextStyle(pdf);
        pdf.text(text, x + dx, y, {
          baseline: "middle",
          align: align === "right" || align === "center" ? align : "left",
          charSpace,
        });
        if (!underline && !lineThrough) return;
        pdf.setDrawColor(color.r, color.g, color.b);
        pdf.setLineWidth(fontSizePt * 0.02);
        if (underline)
          pdf.line(left + dx, underlineY, left + width + dx, underlineY);
        if (lineThrough) pdf.line(left + dx, y, left + width + dx, y);
      });
    }
  };

  const drawImage = async (img: HTMLImageElement) => {
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height || !img.currentSrc) return;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const box = boxOf(rect);
    const fit = getComputedStyle(img).objectFit;
    // Las proporciones de la imagen original, como las usa el navegador.
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    let { x, y, w, h } = box;
    if (fit === "contain" || fit === "cover") {
      const ratio = (fit === "contain" ? Math.min : Math.max)(
        box.w / naturalWidth,
        box.h / naturalHeight,
      );
      w = naturalWidth * ratio;
      h = naturalHeight * ratio;
      x = box.x + (box.w - w) / 2;
      y = box.y + (box.h - h) / 2;
    }
    let dataUrl: string;
    try {
      dataUrl = await imageForPdf(img.currentSrc, w, h);
    } catch {
      return;
    }
    const { page, y: top } = writer.at(box.y);
    const offset = top - box.y;
    writer.draw(page, (pdf, dx) => {
      if (fit === "cover") {
        // Lo que sobra se recorta a la caja.
        pdf.saveGraphicsState();
        pdf.rect(box.x + dx, top, box.w, box.h, null);
        pdf.clip();
        pdf.discardPath();
        pdf.addImage(dataUrl, "PNG", x + dx, y + offset, w, h);
        pdf.restoreGraphicsState();
      } else pdf.addImage(dataUrl, "PNG", x + dx, y + offset, w, h);
    });
  };

  // Lo que va encima (z-index, como las líneas de una Tabla de datos) se
  // dibuja al final, sobre lo demás.
  const above: HTMLElement[] = [];
  const walk = async (element: Element, deferAbove = true) => {
    if (!(element instanceof HTMLElement)) return;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (deferAbove && parseInt(style.zIndex, 10) > 0) {
      above.push(element);
      return;
    }
    drawBox(element, style);
    if (element instanceof HTMLImageElement) {
      await drawImage(element);
      return;
    }
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) drawText(child as Text, style);
      else if (child instanceof Element) await walk(child);
    }
  };

  for (const root of layout.roots) await walk(root, false);
  for (const element of above) await walk(element, false);

  return writer.pages.map((ops) => ({ ops, heightMm: layout.pageHeightMm }));
}

/**
 * Acomoda las páginas lógicas en las hojas físicas según la imposición y
 * hace el PDF. Cada página va recortada a su columna (lo que se pase no
 * invade la de al lado).
 *
 * - Un documento: cada hoja lleva su página en todas las columnas (las
 *   columnas del rollo repiten la misma etiqueta), y el documento se repite
 *   por copias.
 * - `spread` (varios registros, printDocument con una lista): las páginas
 *   van una tras otra, llenando las columnas de cada hoja; las copias
 *   repiten la lista entera (intercalado) o cada página (agrupado).
 *
 * Con alto automático cada hoja es tan alta como su página más alta.
 */
export function composePdf(
  pages: LogicalPage[],
  {
    widthMm,
    imposition,
    spread = false,
  }: { widthMm: number; imposition: Imposition; spread?: boolean },
): jsPDF {
  const columns = columnOffsetsMm(widthMm, imposition);
  const order = sheetPages(pages.length, imposition).map(
    (index) => pages[index],
  );
  const sheets: (LogicalPage | undefined)[][] = spread
    ? Array.from(
        { length: Math.ceil(order.length / columns.length) },
        (_, sheet) =>
          columns.map((_, column) => order[sheet * columns.length + column]),
      )
    : order.map((page) => columns.map(() => page));
  const width = sheetWidthMm(widthMm, imposition);
  const formatOf = (sheet: (LogicalPage | undefined)[]) => {
    const height = Math.max(...sheet.map((page) => page?.heightMm ?? 0), 1);
    const format: [number, number] = [width, height];
    // Fija la orientación según las medidas: jsPDF reordena el formato si no.
    return {
      format,
      orientation: (width > height ? "landscape" : "portrait") as
        "landscape" | "portrait",
    };
  };
  const first = formatOf(sheets[0] ?? []);
  const doc = new jsPDF({ unit: "mm", ...first });
  sheets.forEach((sheet, index) => {
    if (index > 0) {
      const { format, orientation } = formatOf(sheet);
      doc.addPage(format, orientation);
    }
    doc.setPage(index + 1);
    sheet.forEach((page, column) => {
      if (!page) return;
      const dx = columns[column];
      doc.saveGraphicsState();
      doc.rect(dx, 0, widthMm, page.heightMm, null);
      doc.clip();
      doc.discardPath();
      for (const op of page.ops) op(doc, dx);
      doc.restoreGraphicsState();
    });
  });
  return doc;
}
