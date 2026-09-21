import jsPDF from "jspdf";
import { getParameters } from "@/modules/settings/services/Parameters.service";

/**
 * La guía de remisión: el papel que acompaña a la mercadería cuando sale.
 *
 * Vive en `shared` porque la emiten dos módulos con envíos distintos: ventas,
 * cuando la mercadería sale hacia un cliente, y producción, cuando sale hacia
 * el taller que hace un proceso de la ruta. El formato es el mismo —es el que
 * la gente ya reconoce— y lo que cambia entre los dos son seis valores, que
 * por eso son parámetros y no literales: el número, el motivo del traslado, el
 * tipo de documento, la unidad de medida, el destinatario y su dirección.
 *
 * Cada módulo tiene su envoltorio, que es quien sabe componer esos seis: el de
 * ventas en `modules/sales/utils/generateRemisionGuide.ts`, el de producción
 * en `modules/suppliers/utils/productionRemisionGuide.ts`.
 *
 * Conductor, vehículo y peso bruto se imprimen vacíos a propósito: no se
 * guardan en ningún sitio y el papel se rellena a mano.
 */
export interface RemisionGuideItem {
  sku: string;
  productName: string;
  variationName: string;
  quantity: number;
  /** «Unidades» si no se dice otra cosa. Un material va en metros o kilos. */
  unit?: string;
}

/** Un dato con su rótulo, para el bloque extra. */
export interface RemisionGuideField {
  label: string;
  value: string;
}

export interface RemisionGuideData {
  /** Con su serie, tal como se imprime: «T001-00000123». */
  guideNumber: string;
  /** A quién se le manda, ya compuesto. */
  recipientName: string;
  /** Del destinatario: RUC, DNI… Se imprime tal cual. */
  documentType: string;
  documentNumber: string;
  /** Dirección de llegada, ya compuesta. */
  destinationAddress: string;
  /** Por qué sale la mercadería: «Venta», «Traslado para transformación»… */
  transferReason: string;
  /** De dónde sale. Vacío = el parámetro `CompanyDireccionPartida`. */
  originAddress?: string;
  /**
   * Quién entrega la mercadería. Vacío = la empresa.
   *
   * En producción no siempre es ella: cuando una prenda pasa de un taller al
   * siguiente, quien despacha es el taller anterior, y la guía tiene que
   * decirlo o el papel no cuadra con el bulto.
   */
  originName?: string;
  /**
   * Cuándo se emite y arranca el traslado, en ISO. Vacío = hoy.
   *
   * Se puede fijar porque una guía se reimprime: la del envío del martes tiene
   * que seguir diciendo martes aunque se saque otra copia el jueves.
   */
  issueDate?: string;
  /**
   * Un bloque extra entre «Envío» y «Transporte». Vacío = no se dibuja.
   *
   * El papel es el mismo para ventas, traslados y producción, y lo que cambia
   * entre ellos es QUÉ hay que decir del envío. En vez de meter aquí campos de
   * producción --que no significan nada en una venta--, cada módulo manda los
   * suyos ya redactados.
   */
  extraSection?: { title: string; fields: RemisionGuideField[] };
  /** Empresa de transporte, si se sabe. */
  carrierName?: string;
  /**
   * El rótulo del documento. Por defecto «GUÍA DE REMISIÓN» (lo que sale);
   * la guía de ingreso (lo que entra) usa el mismo papel con otro título.
   */
  title?: string;
  items: RemisionGuideItem[];
}

export async function openRemisionGuidePdf(
  data: RemisionGuideData,
): Promise<void> {
  const params = await getParameters([
    "CompanyName",
    "CompanyDocumentNumber",
    "CompanyPhoneNumber",
    "CompanyAddress",
    "CompanyEmail",
    "CompanyWebsite",
    "CompanyDireccionPartida",
  ]);
  // Sin fallback a una empresa escrita en el código: esto es multitenant, y
  // un tenant sin parámetros imprimiría su guía a nombre de otra empresa, con
  // su RUC. Un hueco es mal papel, pero no es el papel de otro.
  const companyName = params["CompanyName"] ?? "";
  const companyRuc = params["CompanyDocumentNumber"] ?? "";
  const companyPhone = params["CompanyPhoneNumber"] ?? "";
  const companyAddress = params["CompanyAddress"] ?? "";
  const companyEmail = params["CompanyEmail"] ?? "";
  const companyWebsite = params["CompanyWebsite"] ?? "";
  const companyDireccionPartida = params["CompanyDireccionPartida"] ?? "";

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - 2 * margin;
  const bottomMargin = pageH - 14; // max y before new page

  const gray50: [number, number, number] = [240, 240, 240];
  const gray200: [number, number, number] = [180, 180, 180];
  const dark: [number, number, number] = [20, 20, 20];
  const muted: [number, number, number] = [90, 90, 90];

  let y = 14;

  // ── HEADER ──────────────────────────────────────────────────────────────
  const hdrH = 34;
  const rightBoxW = 62;
  const rightBoxX = pageW - margin - rightBoxW;

  // Outer border
  doc.setDrawColor(...gray200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, hdrH);

  // Right box fill
  doc.setFillColor(...gray50);
  doc.rect(rightBoxX, y, rightBoxW, hdrH, "FD");

  // Vertical divider
  doc.line(rightBoxX, y, rightBoxX, y + hdrH);

  // "GUÍA DE REMISIÓN" title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(data.title ?? "GUÍA DE REMISIÓN", rightBoxX + rightBoxW / 2, y + 11, {
    align: "center",
  });

  // Guide number
  const guideNumber = data.guideNumber;
  doc.setFontSize(9);
  doc.text(guideNumber, rightBoxX + rightBoxW / 2, y + 20, { align: "center" });

  // Company info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(companyName, margin + 3, y + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(companyAddress, margin + 3, y + 14);
  doc.text(
    `Email: ${companyEmail}   R.U.C. ${companyRuc}`,
    margin + 3,
    y + 20,
  );
  doc.text(`Teléfono: ${companyPhone}`, margin + 3, y + 26);
  doc.text(`Website: ${companyWebsite}`, margin + 3, y + 32);

  y += hdrH + 5;

  // ── SECTION HELPERS ──────────────────────────────────────────────────────
  const drawSectionHeader = (title: string) => {
    doc.setFillColor(...gray50);
    doc.setDrawColor(...gray200);
    doc.rect(margin, y, contentW, 7, "FD");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(title, margin + 3, y + 5.2);
    y += 8;
  };

  const labelValue = (
    label: string,
    value: string,
    x: number,
    yPos: number,
    labelW = 46,
  ) => {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...muted);
    doc.text(`${label}:`, x, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    doc.text(value || "-", x + labelW, yPos);
  };

  // ── FORMAT DATE ──────────────────────────────────────────────────────────
  const fechaStr = new Date(data.issueDate ?? Date.now()).toLocaleDateString(
    "es-PE",
    { day: "2-digit", month: "2-digit", year: "numeric" },
  );

  // ── DESTINATARIO ─────────────────────────────────────────────────────────
  drawSectionHeader("Destinatario");

  // Ya vienen compuestos: quien los compone sabe de dónde salen sus trozos.
  const fullName = data.recipientName.toUpperCase();
  const direccionPrincipal = data.destinationAddress.toUpperCase();

  labelValue("Destinatario", fullName, margin + 3, y + 5, 24);
  y += 8;

  // Wrap long address text to fit within the content area
  const dirMaxW = contentW - 42;
  doc.setFontSize(7.5);
  const dirLines = doc.splitTextToSize(direccionPrincipal || "-", dirMaxW);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...muted);
  doc.text("Dirección principal:", margin + 3, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...dark);
  doc.text(dirLines, margin + 42, y + 3);
  y += Math.max(dirLines.length, 1) * 5 + 2;

  labelValue(
    "Tipo Documento Identidad",
    data.documentType.toUpperCase(),
    margin + 3,
    y + 3,
    50,
  );
  y += 7;

  labelValue(
    "Número de Documento de Identidad",
    data.documentNumber || "-",
    margin + 3,
    y + 3,
    64,
  );
  y += 9;

  // ── ENVÍO ────────────────────────────────────────────────────────────────
  drawSectionHeader("Envío");

  labelValue("Fecha de emisión", fechaStr, margin + 3, y + 5, 38);
  labelValue("Motivo de Traslado", data.transferReason, pageW / 2, y + 5, 36);
  y += 8;

  labelValue("Fecha inicio de traslado", fechaStr, margin + 3, y + 3, 50);
  labelValue(
    "Modalidad de Transporte",
    "Transporte Público",
    pageW / 2,
    y + 3,
    42,
  );
  y += 7;

  labelValue(
    "Dirección de partida",
    (data.originAddress || companyDireccionPartida).toUpperCase(),
    margin + 3,
    y + 3,
    38,
  );
  labelValue("Peso bruto total(KGM)", "0.0", pageW / 2, y + 3, 42);
  y += 7;

  labelValue(
    "Dirección de llegada",
    direccionPrincipal || "-",
    margin + 3,
    y + 3,
    38,
  );
  if (data.originName) {
    labelValue("Entregado por", data.originName.toUpperCase(), pageW / 2, y + 3, 42);
  }
  y += 9;

  // ── BLOQUE PROPIO DEL MÓDULO ─────────────────────────────────────────────
  //
  // Va DESPUÉS del envío y antes del transporte: describe la mercadería y su
  // recorrido, que es lo que se lee justo después de saber a dónde va, y antes
  // de los datos del camión.
  if (data.extraSection && data.extraSection.fields.length > 0) {
    drawSectionHeader(data.extraSection.title);

    const campos = data.extraSection.fields;
    const colW = contentW / 2;
    const labelW = 40;
    // Lo que le queda al valor. Se AJUSTA a ese ancho en vez de escribirse de
    // corrido: un nombre de servicio largo se montaba encima del rótulo de la
    // columna de al lado, y el papel quedaba ilegible justo en el dato que se
    // había añadido para poder leerlo.
    const valueW = colW - labelW - 6;

    // De dos en dos, y la fila crece con el más alto de los dos: si el de la
    // izquierda ocupa tres líneas, el de la derecha no puede quedar pisado.
    for (let i = 0; i < campos.length; i += 2) {
      const pareja = [campos[i], campos[i + 1]].filter(Boolean);

      doc.setFontSize(7.5);
      const lineasPorCampo = pareja.map(
        (field) =>
          doc.splitTextToSize(field.value || "-", valueW) as string[],
      );
      const alto = Math.max(...lineasPorCampo.map((l) => l.length));

      pareja.forEach((field, columna) => {
        const x = margin + 3 + columna * colW;
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...muted);
        doc.text(`${field.label}:`, x, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...dark);
        doc.text(lineasPorCampo[columna], x + labelW, y + 5);
      });

      y += alto * 4 + 3;
    }

    y += 3;
  }

  // ── TRANSPORTE PÚBLICO ───────────────────────────────────────────────────
  drawSectionHeader("Transporte Público");

  labelValue(
    "Empresa de Transporte",
    data.carrierName?.toUpperCase() || "-",
    margin + 3,
    y + 5,
    40,
  );
  labelValue("Conductor", "", pageW / 2, y + 5, 22);
  y += 8;

  labelValue("Vehículo público", "", margin + 3, y + 3, 36);
  y += 9;

  // ── DETALLE DE ENVÍO ─────────────────────────────────────────────────────
  drawSectionHeader("Detalle de Envío");

  // Helper: draw the column-header row for "Detalle de Envío" table
  // (defined here so it can be called on page 1 and on continuation pages)
  const drawTableHeader = () => {
    doc.setFillColor(220, 220, 220);
    doc.setDrawColor(...gray200);
    doc.rect(margin, y, contentW, 7, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text("#", margin + 4, y + 5);
    doc.text("Descripción", margin + 14, y + 5);
    doc.text("Unidad de Medida", margin + 120, y + 5);
    doc.text("Cantidad", margin + 155, y + 5);
    y += 8;
  };

  // Draw header for first page
  drawTableHeader();

  // Table rows — with automatic page breaks
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  const rowH = 7;

  data.items.forEach((item, idx) => {
    // If this row would overflow the page, add a new page and re-draw the header
    if (y + rowH > bottomMargin) {
      doc.addPage();
      y = 14;
      // Minimal page header on continuation pages
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      const guideNumber = data.guideNumber;
      doc.text(
        `GUÍA DE REMISIÓN ${guideNumber} — Detalle de Envío (cont.)`,
        margin,
        y + 5,
      );
      doc.setDrawColor(...gray200);
      doc.line(margin, y + 7, margin + contentW, y + 7);
      y += 12;
      drawTableHeader();
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 0.5, contentW, rowH, "F");
    }

    const desc = `[${item.sku}] ${item.productName}${item.variationName ? ` - ${item.variationName}` : ""}`;
    const maxDescW = 104;

    let finalDesc = desc;
    if (doc.getTextWidth(desc) > maxDescW) {
      let truncated = desc;
      while (
        doc.getTextWidth(truncated + "…") > maxDescW &&
        truncated.length > 0
      ) {
        truncated = truncated.slice(0, -1);
      }
      finalDesc = truncated + "…";
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    doc.text(String(idx + 1), margin + 4, y + 4.5);
    doc.text(finalDesc, margin + 14, y + 4.5);
    doc.text(item.unit ?? "Unidades", margin + 120, y + 4.5);
    doc.text(item.quantity.toFixed(3), margin + 155, y + 4.5);

    y += rowH;
  });

  // Bottom table border
  doc.setDrawColor(...gray200);
  doc.line(margin, y, margin + contentW, y);

  // ── OPEN IN NEW TAB ──────────────────────────────────────────────────────
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
