import jsPDF from "jspdf";
import { CompanyDocumentHeader } from "@/shared/services/companyHeader";

/**
 * La HOJA: el formato de los papeles de taller del ERP.
 *
 * A4 apaisada, cabecera en tres fichas, una tabla por sección con sus propias
 * columnas, observaciones en recuadro y un pie con la paginación y la hora de
 * generación. Lo estrenó el Requerimiento de Materiales y ahora lo comparte
 * con la Orden de Producción, que es lo que hace que los dos papeles del mismo
 * lote se lean igual.
 *
 * ## Por qué no es `documentPdf`
 *
 * `documentPdf` es A4 vertical, con una tabla de columnas fijas para todo el
 * documento. Eso es justo lo que estos papeles no pueden ser: aquí cada sección tiene columnas
 * distintas —las prendas no se describen como los materiales— y hacen falta
 * las siete u ocho que solo caben en apaisado. Estirar aquel para que hiciera
 * las dos cosas habria puesto en riesgo los documentos que ya salian bien.
 *
 * Al final se acabaron mudando todos --orden de compra, orden de servicio y la
 * receta-- y `documentPdf` se quedo sin consumidores.
 *
 * ## Qué NO hay aquí
 *
 * Negocio. Entra un `SheetDocument` con textos ya formateados y sale un PDF.
 * Qué es un faltante, de dónde sale un código de modelo o cómo se agrupan los
 * materiales lo decide quien arma el documento. Esa frontera es lo que permite
 * cambiar el papel sin tocar la consulta, y al revés.
 */

/** A4 apaisada: es donde entran siete columnas sin apretarlas. */
const PAGE = { width: 297, height: 210, margin: 12 };
const CONTENT = PAGE.width - PAGE.margin * 2;
/** Donde deja de poderse escribir: el pie vive debajo. */
const BOTTOM = PAGE.height - 16;

const INK = { text: 30, soft: 110, line: 205, band: 242 } as const;

/** El gris de las bandas. jsPDF no acepta un solo canal aqui, hay que dar los tres. */
const BAND: [number, number, number] = [INK.band, INK.band, INK.band];

/** `y` es siempre el BORDE SUPERIOR de lo que se pinta, aquí y en jsPDF. */
const TOP = { baseline: "top" } as const;

/** Un dato con su rótulo, para las fichas y los totales. */
export interface SheetField {
  label: string;
  value: string;
}

export interface SheetColumn {
  header: string;
  /**
   * Ancho en mm. Omitido = se lleva lo que sobre.
   *
   * Con varias sin ancho, el resto se reparte entre ellas. Es para la columna
   * que de verdad necesita sitio —la descripción— sin tener que recalcular las
   * demás cada vez que una sección gana o pierde una.
   */
  width?: number;
  align?: "left" | "right";
  /** Los códigos y las descripciones no se leen igual: se pintan distinto. */
  tone?: "code" | "muted";
}

export interface SheetSection {
  title: string;
  columns: SheetColumn[];
  rows: string[][];
  /** Pie de la sección, p. ej. su subtotal. */
  subtotal?: SheetField;
  /** Qué decir cuando no hay filas. Sin esto, la sección vacía no se dibuja. */
  empty?: string;
}

/** Una imagen ya embebida, lista para dibujar. */
export interface SheetImage {
  /** El fichero en base64, con su cabecera `data:`. */
  dataUrl: string;
  /** Qué es, para el pie de la foto. */
  caption?: string;
}

export interface SheetDocument {
  /** El rótulo grande de arriba a la derecha, y el nombre del archivo. */
  title: string;
  company: CompanyDocumentHeader;
  /**
   * Identifica el papel: número, orden, fechas y cantidades. Va en la banda de
   * arriba, que es lo que se mira al cogerlo de una pila.
   */
  identification: SheetField[];
  /** Ficha izquierda. Vacía = no se dibuja. */
  general: SheetField[];
  generalTitle?: string;
  /** Ficha derecha. Vacía = no se dibuja. */
  technical: SheetField[];
  technicalTitle?: string;
  /**
   * Fotos de referencia, entre la cabecera y las tablas. Vacío = no se dibuja.
   *
   * Van ahí y no al final porque son referencia de lo que hay que hacer: quien
   * abre el papel en el taller mira primero qué prenda es y después las
   * cantidades.
   */
  images?: SheetImage[];
  imagesTitle?: string;
  sections: SheetSection[];
  totals: SheetField[];
  /** Advertencias de este pedido. Vacío = no se dibuja el recuadro. */
  observations: string[];
  /** Cómo leer el documento. Al pie, en pequeño. */
  footnotes: string[];
}

/** Una columna con el ancho ya resuelto. */
interface ResolvedColumn extends SheetColumn {
  width: number;
}

/**
 * Reparte el ancho útil.
 *
 * Las columnas con ancho lo conservan; lo que sobra se divide entre las que no
 * lo declaran, con un mínimo de 40 mm cada una: por debajo, una descripción se
 * parte en cinco líneas y la fila se vuelve un párrafo.
 */
const resolveColumns = (columns: SheetColumn[]): ResolvedColumn[] => {
  const fijas = columns.reduce((sum, column) => sum + (column.width ?? 0), 0);
  const flexibles = columns.filter((column) => column.width === undefined).length;
  const reparto = flexibles > 0 ? Math.max((CONTENT - fijas) / flexibles, 40) : 0;

  return columns.map((column) => ({
    ...column,
    width: column.width ?? reparto,
  }));
};

export const buildSheetPdf = (sheet: SheetDocument): jsPDF => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = PAGE.margin;

  const wrap = (text: string, width: number): string[] =>
    doc.splitTextToSize(text || "", width) as string[];

  const setInk = (tone: number) => doc.setTextColor(tone);

  const newPage = () => {
    doc.addPage();
    y = PAGE.margin;
  };

  /** Reserva `height` mm; si no caben, pasa de página. */
  const ensure = (height: number) => {
    if (y + height > BOTTOM) newPage();
  };

  // ---- Cabecera -----------------------------------------------------------
  //
  // La empresa a la izquierda y el título a la derecha, grande. El título no
  // compite con nada: es lo único que hay a ese lado.
  const top = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setInk(INK.text);
  doc.text(sheet.company.name || "", PAGE.margin, y, TOP);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setInk(INK.soft);
  [
    sheet.company.documentNumber ? `RUC ${sheet.company.documentNumber}` : "",
    sheet.company.address ?? "",
    sheet.company.phone ?? "",
  ]
    .filter(Boolean)
    .forEach((linea) => {
      doc.text(linea, PAGE.margin, y, TOP);
      y += 3.6;
    });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setInk(INK.text);
  doc.text(sheet.title.toUpperCase(), PAGE.width - PAGE.margin, top, {
    ...TOP,
    align: "right",
  });

  y = Math.max(y, top + 12) + 3;

  doc.setDrawColor(INK.line);
  doc.setLineWidth(0.4);
  doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
  y += 5;

  // ---- Fichas -------------------------------------------------------------

  const ROW_FIELD = 7.6;
  const TITLE_HEIGHT = 6.4;

  const fieldsHeight = (count: number, cols: number) =>
    Math.ceil(count / cols) * ROW_FIELD + 3;

  /**
   * Una ficha de campos en columnas.
   *
   * Los campos se apilan POR COLUMNA, no en zigzag: es como se lee una ficha,
   * de arriba abajo y luego a la derecha.
   */
  const drawFields = (
    fields: SheetField[],
    options: {
      columns?: number;
      band?: boolean;
      x?: number;
      width?: number;
      advance?: boolean;
    } = {},
  ) => {
    if (fields.length === 0) return;

    const left = options.x ?? PAGE.margin;
    const total = options.width ?? CONTENT;
    const cols = options.columns ?? Math.min(4, fields.length);
    const perColumn = Math.ceil(fields.length / cols);
    const colWidth = total / cols;
    const height = fieldsHeight(fields.length, cols);

    if (options.band) {
      doc.setFillColor(...BAND);
      doc.rect(left, y - 1.5, total, height, "F");
    }

    fields.forEach((field, index) => {
      const col = Math.floor(index / perColumn);
      const row = index % perColumn;
      const x = left + col * colWidth + 2;
      const fieldY = y + row * ROW_FIELD;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      setInk(INK.soft);
      doc.text(field.label.toUpperCase(), x, fieldY, TOP);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setInk(INK.text);
      const [primera] = wrap(field.value || "—", colWidth - 5);
      doc.text(primera ?? "—", x, fieldY + 3.2, TOP);
    });

    if (options.advance !== false) y += height + 2;
  };

  const drawSectionTitle = (
    text: string,
    options: { x?: number; width?: number; advance?: boolean } = {},
  ) => {
    const left = options.x ?? PAGE.margin;
    const total = options.width ?? CONTENT;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setInk(INK.text);
    doc.text(text.toUpperCase(), left, y, TOP);

    doc.setDrawColor(INK.line);
    doc.setLineWidth(0.3);
    doc.line(left, y + 4.2, left + total, y + 4.2);

    if (options.advance !== false) y += TITLE_HEIGHT;
  };

  drawFields(sheet.identification, { columns: 3, band: true });

  // Las dos fichas van LADO A LADO, no una debajo de otra.
  //
  // En A4 apaisada la altura es el recurso escaso: apiladas se comían 40 mm de
  // los 186 útiles solo para once datos, y la tabla —que es a lo que se viene
  // al papel— empezaba a media página.
  const half = (CONTENT - 8) / 2;
  const rightX = PAGE.margin + half + 8;

  if (sheet.general.length > 0 || sheet.technical.length > 0) {
    const generalCols = Math.min(2, Math.max(sheet.general.length, 1));
    const technicalCols = Math.min(2, Math.max(sheet.technical.length, 1));

    const alto =
      TITLE_HEIGHT +
      Math.max(
        sheet.general.length > 0
          ? fieldsHeight(sheet.general.length, generalCols)
          : 0,
        sheet.technical.length > 0
          ? fieldsHeight(sheet.technical.length, technicalCols)
          : 0,
      );

    ensure(alto);
    const fichasTop = y;

    if (sheet.general.length > 0) {
      drawSectionTitle(sheet.generalTitle ?? "Datos generales", {
        x: PAGE.margin,
        width: half,
        advance: false,
      });
    }
    if (sheet.technical.length > 0) {
      drawSectionTitle(sheet.technicalTitle ?? "Especificaciones técnicas", {
        x: rightX,
        width: half,
        advance: false,
      });
    }

    y = fichasTop + TITLE_HEIGHT;

    drawFields(sheet.general, {
      x: PAGE.margin,
      width: half,
      columns: generalCols,
      advance: false,
    });
    drawFields(sheet.technical, {
      x: rightX,
      width: half,
      columns: technicalCols,
      advance: false,
    });

    y = fichasTop + alto + 4;
  }

  // ---- Fotos de referencia ------------------------------------------------
  //
  // En una fila, con alto fijo y ancho proporcional: son fotos de producto y
  // recortarlas a un cuadrado le cortaria las mangas a media prenda.
  if (sheet.images && sheet.images.length > 0) {
    const ALTO = 30;
    const ANCHO = 24;
    const GAP = 3;
    // Las que quepan a lo ancho. El resto no se dibuja: esto es una
    // referencia, no un catalogo, y una segunda fila de fotos empujaria la
    // tabla a la pagina siguiente.
    const caben = Math.max(Math.floor((CONTENT + GAP) / (ANCHO + GAP)), 1);
    const fotos = sheet.images.slice(0, caben);

    ensure(TITLE_HEIGHT + ALTO + 6);
    drawSectionTitle(sheet.imagesTitle ?? "Referencia");

    fotos.forEach((foto, index) => {
      const x = PAGE.margin + index * (ANCHO + GAP);

      // El hueco se marca siempre: con fotos de distinta proporcion, la caja
      // es lo que hace que la fila quede alineada en vez de escalonada.
      doc.setDrawColor(INK.line);
      doc.setLineWidth(0.2);
      doc.rect(x, y, ANCHO, ALTO);

      try {
        // Respetando la proporcion y centrada en su caja. Forzarla al tamaño
        // de la caja estiraba las fotos cuadradas un 25% a lo alto, que en una
        // referencia de prenda es justo lo que no puede pasar: se usa para
        // mirar la forma.
        const props = doc.getImageProperties(foto.dataUrl);
        const escala = Math.min(ANCHO / props.width, ALTO / props.height);
        const w = props.width * escala;
        const h = props.height * escala;
        doc.addImage(
          foto.dataUrl,
          x + (ANCHO - w) / 2,
          y + (ALTO - h) / 2,
          w,
          h,
          undefined,
          "FAST",
        );
      } catch {
        // Un fichero que jsPDF no sabe leer no tumba el documento: queda la
        // caja vacia y el papel sale igual.
      }

      if (foto.caption) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        setInk(INK.soft);
        const [linea] = wrap(foto.caption, ANCHO);
        doc.text(linea ?? "", x, y + ALTO + 1, TOP);
      }
    });

    y += ALTO + 7;
  }

  // ---- Secciones ----------------------------------------------------------

  /** La cabecera de una tabla. Se repite en cada página que la continúa. */
  const drawTableHead = (columns: ResolvedColumn[]) => {
    const height = 6.5;
    doc.setFillColor(...BAND);
    doc.rect(PAGE.margin, y, CONTENT, height, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setInk(INK.soft);

    let x = PAGE.margin;
    columns.forEach((column) => {
      const isRight = column.align === "right";
      doc.text(
        column.header.toUpperCase(),
        isRight ? x + column.width - 2 : x + 2,
        y + 2,
        { ...TOP, align: isRight ? "right" : "left" },
      );
      x += column.width;
    });

    y += height + 1;
  };

  sheet.sections.forEach((section) => {
    if (section.rows.length === 0 && !section.empty) return;

    const columns = resolveColumns(section.columns);

    // Título y cabecera juntos, y con sitio para al menos una fila: un título
    // solo al pie de una página es peor que empezar la sección en la
    // siguiente.
    ensure(24);
    drawSectionTitle(section.title);
    drawTableHead(columns);

    if (section.rows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setInk(INK.soft);
      doc.text(section.empty ?? "", PAGE.margin + 2, y + 0.6, TOP);
      y += 8;
    }

    section.rows.forEach((row) => {
      const lineas = columns.map((column, index) =>
        wrap(row[index] ?? "", column.width - 4),
      );
      const alto = Math.max(...lineas.map((l) => l.length)) * 3.8 + 2.6;

      // Una fila no se parte entre páginas. Si no cabe entera, salta — y al
      // saltar se repiten el título de la sección y la cabecera, para que la
      // página siguiente se pueda leer sola.
      if (y + alto > BOTTOM) {
        newPage();
        drawSectionTitle(`${section.title} (continuación)`);
        drawTableHead(columns);
      }

      let x = PAGE.margin;
      columns.forEach((column, index) => {
        const isRight = column.align === "right";
        doc.setFont("helvetica", "normal");
        // El código se pinta un punto más chico y en gris: al lado de la
        // descripción tiene que leerse como una referencia, no como el nombre.
        doc.setFontSize(column.tone === "code" ? 7.5 : 8);
        setInk(column.tone ? INK.soft : INK.text);
        doc.text(
          lineas[index],
          isRight ? x + column.width - 2 : x + 2,
          y + 0.6,
          { ...TOP, align: isRight ? "right" : "left" },
        );
        x += column.width;
      });

      y += alto;
      doc.setDrawColor(INK.line);
      doc.setLineWidth(0.1);
      doc.line(PAGE.margin, y - 0.8, PAGE.width - PAGE.margin, y - 0.8);
    });

    if (section.subtotal) {
      ensure(6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setInk(INK.soft);
      doc.text(
        section.subtotal.label.toUpperCase(),
        PAGE.width - PAGE.margin - 34,
        y + 1,
        { ...TOP, align: "right" },
      );
      setInk(INK.text);
      doc.text(section.subtotal.value, PAGE.width - PAGE.margin, y + 1, {
        ...TOP,
        align: "right",
      });
      y += 6;
    }

    y += 4;
  });

  // ---- Totales ------------------------------------------------------------
  if (sheet.totals.length > 0) {
    ensure(10 + sheet.totals.length * 5);
    sheet.totals.forEach((total) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setInk(INK.text);
      doc.text(total.label.toUpperCase(), PAGE.width - PAGE.margin - 40, y, {
        ...TOP,
        align: "right",
      });
      doc.text(total.value, PAGE.width - PAGE.margin, y, {
        ...TOP,
        align: "right",
      });
      y += 5;
    });
    y += 3;
  }

  // ---- Observaciones ------------------------------------------------------
  //
  // En su recuadro: son advertencias de ESTE pedido, escritas a mano, y
  // mezclarlas con las notas fijas del pie las hacía invisibles.
  if (sheet.observations.length > 0) {
    const lineas = sheet.observations.flatMap((texto) =>
      wrap(texto, CONTENT - 8),
    );
    const alto = lineas.length * 4 + 9;

    ensure(alto);

    doc.setFillColor(...BAND);
    doc.setDrawColor(INK.line);
    doc.setLineWidth(0.3);
    doc.rect(PAGE.margin, y, CONTENT, alto, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setInk(INK.soft);
    doc.text("OBSERVACIONES", PAGE.margin + 3, y + 2.5, TOP);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setInk(INK.text);
    doc.text(lineas, PAGE.margin + 3, y + 6.5, TOP);

    y += alto + 4;
  }

  // ---- Notas al pie -------------------------------------------------------
  if (sheet.footnotes.length > 0) {
    const lineas = sheet.footnotes.flatMap((texto) => wrap(texto, CONTENT));
    ensure(lineas.length * 3.4 + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setInk(INK.soft);
    doc.text(lineas, PAGE.margin, y, TOP);
    y += lineas.length * 3.4;
  }

  // ---- Pie de todas las páginas -------------------------------------------
  //
  // Al final, porque «de N» no se sabe hasta que el documento está cerrado.
  const total = doc.getNumberOfPages();
  const generado = new Date().toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });

  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(INK.line);
    doc.setLineWidth(0.2);
    doc.line(
      PAGE.margin,
      PAGE.height - 12,
      PAGE.width - PAGE.margin,
      PAGE.height - 12,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setInk(INK.soft);
    doc.text(`Generado el ${generado}`, PAGE.margin, PAGE.height - 10, TOP);
    doc.text(
      `Página ${page} de ${total}`,
      PAGE.width - PAGE.margin,
      PAGE.height - 10,
      { ...TOP, align: "right" },
    );
  }

  return doc;
};

/** Lo dibuja y lo abre en una pestaña nueva. */
export const openSheetPdf = (sheet: SheetDocument, fileName: string): void => {
  const pdf = buildSheetPdf(sheet);
  pdf.setProperties({ title: fileName });
  window.open(pdf.output("bloburl"), "_blank");
};
