import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import { BarcodeTicketData, BarcodeLabelLayout } from "../types/Barcodes.types";
import { DEFAULT_LABEL_LAYOUT, normalizeLabelLayout } from "../constants/labelLayouts";

/**
 * Alto del diseño original de la etiqueta. Si la fila es más alta (p. ej. papeles de
 * 25mm de paso), el bloque se centra en vez de quedar pegado al borde superior.
 */
const DESIGN_HEIGHT = 20;

/**
 * Dibuja una etiqueta dentro del rectángulo (x, y, width, height) de la página actual.
 * Las coordenadas son relativas a la celda, así la misma etiqueta sirve para rollos
 * de 1 columna o de N columnas.
 */
const drawLabel = (
  doc: jsPDF,
  ticketData: BarcodeTicketData,
  barcodeDataUrl: string | null,
  x: number,
  rowY: number,
  width: number,
  rowHeight: number
) => {
  // El contenido conserva su alto de diseño y se centra en la fila
  const height = Math.min(rowHeight, DESIGN_HEIGHT);
  const y = rowY + (rowHeight - height) / 2;
  const centerX = x + width / 2;

  // Title: Product name + variation in parentheses
  const title = ticketData.variationTerms
    ? `${ticketData.productTitle} (${ticketData.variationTerms.replace(/,\s*/g, "-")})`
    : ticketData.productTitle;

  // Draw title (top)
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(title, width - 4);
  doc.text(titleLines, centerX, y + 3, { align: "center" });

  if (barcodeDataUrl) {
    // Barcode in the center
    const barcodeY = y + titleLines.length * 2 + 3;
    const barcodeWidth = width - 6;
    const barcodeHeight = 7;
    doc.addImage(
      barcodeDataUrl,
      "PNG",
      x + (width - barcodeWidth) / 2,
      barcodeY,
      barcodeWidth,
      barcodeHeight
    );

    // SKU-Lote text below barcode
    const skuLabel = ticketData.sku
      ? `${ticketData.sku}-${ticketData.barcodeValue.split("-").pop() || ""}`
      : ticketData.barcodeValue;
    doc.setFontSize(4);
    doc.setFont("helvetica", "normal");
    doc.text(skuLabel, centerX, barcodeY + barcodeHeight + 1.5, {
      align: "center",
    });
  } else {
    doc.setFontSize(5);
    doc.text(ticketData.barcodeValue, centerX, y + height / 2, { align: "center" });
  }

  // Price at the bottom
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(`S/.${ticketData.price.toFixed(1)}`, centerX, y + height - 1.5, {
    align: "center",
  });
};

/**
 * Genera un PDF con etiquetas de código de barras.
 *
 * El papel se describe con `layout`: cada página del PDF es una fila del rollo, con
 * tantas etiquetas como columnas tenga el papel. Con `columns: 1` (default) el
 * resultado es una página por etiqueta, igual que la ticketera de una sola columna.
 */
export const generateBarcodePdf = (
  ticketData: BarcodeTicketData,
  quantity: number,
  layout: BarcodeLabelLayout = DEFAULT_LABEL_LAYOUT
) => {
  const { labelWidth, labelHeight, columns, gapX, marginX, marginY, offsetX, offsetY } =
    normalizeLabelLayout(layout);

  // Una página = una fila del rollo
  const pageWidth = marginX * 2 + columns * labelWidth + (columns - 1) * gapX;
  const pageHeight = marginY * 2 + labelHeight;
  const format: [number, number] = [pageWidth, pageHeight];
  // Fijamos la orientación según las medidas reales: jsPDF reordena el formato si no coinciden.
  const orientation = pageWidth >= pageHeight ? "landscape" : "portrait";

  const doc = new jsPDF({ orientation, unit: "mm", format });

  // El código de barras es el mismo para todas las etiquetas: se rasteriza una sola vez
  let barcodeDataUrl: string | null = null;
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, ticketData.barcodeValue, {
      format: "CODE128",
      width: 1.5,
      height: 30,
      displayValue: false,
      margin: 0,
    });
    barcodeDataUrl = canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Error generating barcode:", e);
  }

  for (let i = 0; i < quantity; i++) {
    const column = i % columns;

    // Nueva fila del rollo → nueva página (la primera ya existe)
    if (i > 0 && column === 0) doc.addPage(format, orientation);

    const x = marginX + offsetX + column * (labelWidth + gapX);
    drawLabel(doc, ticketData, barcodeDataUrl, x, marginY + offsetY, labelWidth, labelHeight);
  }

  // Open in new window
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
