import jsPDF from "jspdf";
import { drawLogoInBox, type CompanyHeader, type LoadedImage } from "./pdfHeader";
import { electronicDocumentName, printedRepresentationLegend } from "./documentTemplateConfig";

/**
 * Comprobante en A4 (T-1013): la representación impresa propia del ERP, con los
 * mismos datos que el ticket de 80 mm. No sustituye al PDF de NubeFact
 * (pdf_url), que sigue siendo la representación con la plantilla de NubeFact.
 *
 * Aquí no hay consultas ni reglas de negocio: recibe el comprobante ya resuelto
 * (InvoicePrintData) y lo coloca.
 */

export interface InvoicePrintItem {
  quantity: number;
  unit: string;
  description: string;
  unitPrice: number;
  /** Descuento de la línea completa, no por unidad. */
  discount: number | null;
  total: number;
}

/** Líneas que no son ítems: envío de comprobantes antiguos y descuentos del pedido. */
export interface InvoicePrintExtraLine {
  description: string;
  /** Importe ya formateado, con signo si es descuento. */
  amount: string;
}

export interface InvoicePrintData {
  company: CompanyHeader;
  logo: LoadedImage | null;
  /** code del tipo en `types` ("1", "2", "3", "4" o "INV"). */
  typeCode: string;
  /** Nombre del tipo en el catálogo, el que imprime el ticket. */
  typeName: string;
  orderId: string;
  serie: string | null;
  number: string | null;
  /** Fecha y hora de emisión, ya en hora de Lima. */
  issuedAt: string;
  currency: string;
  customer: {
    name: string;
    documentTypeName: string;
    documentNumber: string;
    showDocument: boolean;
    address: string | null;
    showAddress: boolean;
  };
  /** Serie-número del comprobante que modifica una nota; "" si no aplica. */
  modifiedDocument: string;
  noteReason: string | null;
  items: InvoicePrintItem[];
  extraLines: InvoicePrintExtraLine[];
  totalQuantity: number;
  /** Operaciones gravadas/exoneradas e IGV, ya formateadas. */
  taxLines: [string, string][];
  freeAmount: number;
  totalAmount: number;
  amountInWords: string;
  cashierName: string;
  qrDataUrl: string | null;
  /** Leyendas SUNAT que dependen del comprobante (región selva). */
  legends: string[];
  footerMessage: string;
}

export const FOOTER_TITLE = "CAMBIOS Y DEVOLUCIONES";
export const CLOSING_MESSAGE = "Gracias por tu confianza.";
export const FREE_TRANSFER_LEGEND =
  "1002: TRANSFERENCIA GRATUITA DE UN BIEN Y/O SERVICIO PRESTADO GRATUITAMENTE";

const PAGE = { width: 210, height: 297, margin: 12 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const BOTTOM = PAGE.height - 14;
const LINE = 3.8;

const money = (value: number) => value.toFixed(2);
const qty = (value: number) => (value % 1 === 0 ? String(value) : value.toFixed(2));

export function renderInvoiceA4(data: InvoicePrintData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;
  let y = PAGE.margin;

  const ensureSpace = (height: number) => {
    if (y + height > BOTTOM) {
      doc.addPage();
      y = PAGE.margin;
      return true;
    }
    return false;
  };

  // ── Cabecera: emisor a la izquierda, recuadro del comprobante a la derecha ──
  const boxWidth = 70;
  const boxX = right - boxWidth;
  const leftWidth = boxX - left - 6;

  let leftY = y;
  if (data.logo) {
    leftY += drawLogoInBox(doc, data.logo, { x: left, y: leftY, width: 55, height: 22 }, "left") + 3;
  }
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  for (const line of doc.splitTextToSize((data.company.name || "EMPRESA").toUpperCase(), leftWidth)) {
    leftY += 4; doc.text(line, left, leftY);
  }
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  const companyLines = [
    data.company.fiscalAddress ? `Domicilio fiscal: ${data.company.fiscalAddress}` : null,
    data.company.establishmentAddress ? `Establecimiento: ${data.company.establishmentAddress}` : null,
    data.company.phone ? `Teléfono: ${data.company.phone}` : null,
    data.company.email ? `E-mail: ${data.company.email}` : null,
  ].filter((line): line is string => !!line);
  for (const text of companyLines) {
    for (const line of doc.splitTextToSize(text, leftWidth)) {
      leftY += 3.4; doc.text(line, left, leftY);
    }
  }

  const documentName = electronicDocumentName(data.typeCode) ?? (data.typeName || "COMPROBANTE").toUpperCase();
  const serieNum = [data.serie, data.number].filter(Boolean).join(" - ");
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  const nameLines: string[] = doc.splitTextToSize(documentName, boxWidth - 6);
  const boxLines = [
    ...(data.company.ruc ? [`R.U.C. N° ${data.company.ruc}`] : []),
    ...nameLines,
    ...(serieNum ? [serieNum] : []),
  ];
  const boxHeight = boxLines.length * 5.5 + 6;
  doc.setLineWidth(0.4); doc.rect(boxX, y, boxWidth, boxHeight);
  let boxY = y + 6.5;
  for (const line of boxLines) {
    doc.text(line, boxX + boxWidth / 2, boxY, { align: "center" }); boxY += 5.5;
  }

  y = Math.max(leftY, y + boxHeight) + 6;
  doc.setLineWidth(0.3); doc.line(left, y, right, y); y += 5;

  // ── Datos del comprobante y del adquirente ──
  doc.setFontSize(8.5);
  const fields: [string, string][] = [
    ["FECHA DE EMISIÓN:", data.issuedAt],
    ["MONEDA:", data.currency],
    ...(data.orderId ? ([["PEDIDO:", `#${data.orderId}`]] as [string, string][]) : []),
    ["CLIENTE:", data.customer.name || "Clientes Varios"],
    ...(data.customer.showDocument
      ? ([[`${data.customer.documentTypeName || "Doc"}:`, data.customer.documentNumber || ""]] as [string, string][])
      : []),
    ...(data.customer.showAddress && data.customer.address
      ? ([["DIRECCIÓN:", data.customer.address]] as [string, string][])
      : []),
    ...(data.modifiedDocument ? ([["DOC. QUE MODIFICA:", data.modifiedDocument]] as [string, string][]) : []),
    ...(data.noteReason ? ([["MOTIVO:", data.noteReason]] as [string, string][]) : []),
  ];
  const labelWidth = 36;
  for (const [label, value] of fields) {
    const lines: string[] = doc.splitTextToSize(value, CONTENT_WIDTH - labelWidth);
    ensureSpace(lines.length * LINE);
    doc.setFont("helvetica", "bold"); doc.text(label, left, y);
    doc.setFont("helvetica", "normal");
    lines.forEach((line, i) => doc.text(line, left + labelWidth, y + i * LINE));
    y += Math.max(lines.length, 1) * LINE;
  }
  y += 2;

  // ── Detalle ──
  const columns = [
    { header: "CANT.", width: 16, align: "right" as const },
    { header: "U.M.", width: 16, align: "left" as const },
    { header: "DESCRIPCIÓN", width: 84, align: "left" as const },
    { header: "P. UNIT.", width: 24, align: "right" as const },
    { header: "DSCTO.", width: 22, align: "right" as const },
    { header: "IMPORTE", width: 24, align: "right" as const },
  ];
  const colX: number[] = [];
  columns.reduce((x, column) => { colX.push(x); return x + column.width; }, left);
  const cellX = (i: number) => (columns[i].align === "right" ? colX[i] + columns[i].width - 1.5 : colX[i] + 1.5);

  const drawTableHeader = () => {
    doc.setFillColor(240, 240, 240);
    doc.rect(left, y, CONTENT_WIDTH, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    columns.forEach((column, i) => doc.text(column.header, cellX(i), y + 4.7, { align: column.align }));
    y += 7 + 3.5;
    doc.setFont("helvetica", "normal");
  };

  const drawRow = (cells: string[], description: string) => {
    doc.setFontSize(8);
    const descLines: string[] = doc.splitTextToSize(description, columns[2].width - 3);
    const height = Math.max(descLines.length, 1) * 3.5 + 1.5;
    if (ensureSpace(height)) drawTableHeader();
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    cells.forEach((cell, i) => {
      if (i === 2) descLines.forEach((line, j) => doc.text(line, cellX(2), y + j * 3.5));
      else if (cell) doc.text(cell, cellX(i), y, { align: columns[i].align });
    });
    y += height;
  };

  ensureSpace(20);
  drawTableHeader();
  for (const item of data.items) {
    drawRow(
      [qty(item.quantity), item.unit || "", "", money(item.unitPrice), item.discount ? money(item.discount) : "—", money(item.total)],
      item.description,
    );
  }
  for (const line of data.extraLines) {
    drawRow(["", "", "", "", "", line.amount], line.description);
  }
  doc.setLineWidth(0.3); doc.line(left, y - 1, right, y - 1); y += 4;

  // ── Totales ──
  const totals: [string, string][] = [
    ["TOTAL CANT.", qty(data.totalQuantity)],
    ...data.taxLines,
    ...(data.freeAmount > 0 ? ([["OP. GRATUITAS", `S/ ${money(data.freeAmount)}`]] as [string, string][]) : []),
    ["IMPORTE TOTAL:", `S/ ${money(data.totalAmount)}`],
  ];
  ensureSpace(totals.length * 4.5 + 4);
  const totalsLabelX = right - 70;
  for (const [label, value] of totals) {
    const isTotal = label === "IMPORTE TOTAL:";
    doc.setFont("helvetica", isTotal ? "bold" : "normal"); doc.setFontSize(isTotal ? 10 : 8.5);
    doc.text(label, totalsLabelX, y); doc.text(value, right, y, { align: "right" });
    y += 4.5;
  }
  y += 1;

  doc.setFontSize(8.5);
  const words: string[] = doc.splitTextToSize(data.amountInWords, CONTENT_WIDTH - 10);
  ensureSpace(words.length * LINE + 2);
  doc.setFont("helvetica", "bold"); doc.text("SON:", left, y);
  doc.setFont("helvetica", "normal");
  words.forEach((line, i) => doc.text(line, left + 10, y + i * LINE));
  y += words.length * LINE + 2;

  const legends = [...data.legends, ...(data.freeAmount > 0 ? [FREE_TRANSFER_LEGEND] : [])];
  doc.setFontSize(7.5);
  for (const legend of legends) {
    const lines: string[] = doc.splitTextToSize(legend, CONTENT_WIDTH);
    ensureSpace(lines.length * 3.2);
    lines.forEach((line) => { doc.text(line, left, y); y += 3.2; });
  }
  if (legends.length) y += 1.5;

  if (data.cashierName) {
    ensureSpace(5);
    y += 1; doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold"); doc.text("CAJERO:", left, y);
    doc.setFont("helvetica", "normal"); doc.text(data.cashierName.toUpperCase(), left + 16, y);
    y += 5;
  }

  // ── QR y leyenda de representación impresa ──
  const legend = printedRepresentationLegend(data.typeCode);
  if (data.qrDataUrl || legend) {
    const qrSize = data.qrDataUrl ? 30 : 0;
    ensureSpace(Math.max(qrSize, 8) + 4);
    y += 2;
    if (data.qrDataUrl) doc.addImage(data.qrDataUrl, "PNG", left, y, qrSize, qrSize);
    if (legend) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8);
      const textX = left + (qrSize ? qrSize + 5 : 0);
      const lines: string[] = doc.splitTextToSize(legend, right - textX);
      lines.forEach((line, i) => doc.text(line, textX, y + (qrSize ? qrSize / 2 : 3) + i * 3.5));
    }
    y += Math.max(qrSize, 6) + 4;
  }

  // ── Pie ──
  doc.setFontSize(7.5);
  const policy: string[] = doc.splitTextToSize(data.footerMessage, CONTENT_WIDTH);
  ensureSpace(policy.length * 3 + 14);
  doc.setLineWidth(0.3); doc.line(left, y, right, y); y += 5;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text(FOOTER_TITLE, PAGE.width / 2, y, { align: "center" }); y += 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  policy.forEach((line) => { doc.text(line, PAGE.width / 2, y, { align: "center" }); y += 3; });
  y += 2; doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  doc.text(CLOSING_MESSAGE, PAGE.width / 2, y, { align: "center" });

  return doc;
}
