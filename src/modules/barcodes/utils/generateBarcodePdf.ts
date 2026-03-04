import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import { BarcodeTicketData } from "../types/Barcodes.types";

/**
 * Genera un PDF con etiquetas de código de barras de 30x20mm
 */
export const generateBarcodePdf = (
  ticketData: BarcodeTicketData,
  quantity: number
) => {
  // 30mm ancho x 20mm alto
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [30, 20],
  });

  for (let i = 0; i < quantity; i++) {
    if (i > 0) doc.addPage([30, 20], "landscape");

    // Title: Product name + variation in parentheses
    const title = ticketData.variationTerms
      ? `${ticketData.productTitle} (${ticketData.variationTerms.replace(/,\s*/g, "-")})`
      : ticketData.productTitle;

    // Draw title (top)
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(title, 26);
    doc.text(titleLines, 15, 3, { align: "center" });

    // Generate barcode as canvas
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, ticketData.barcodeValue, {
        format: "CODE128",
        width: 1.5,
        height: 30,
        displayValue: false,
        margin: 0,
      });

      const barcodeDataUrl = canvas.toDataURL("image/png");
      // Barcode in the center
      const barcodeY = titleLines.length * 2 + 3;
      const barcodeWidth = 24;
      const barcodeHeight = 7;
      doc.addImage(
        barcodeDataUrl,
        "PNG",
        (30 - barcodeWidth) / 2,
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
      doc.text(skuLabel, 15, barcodeY + barcodeHeight + 1.5, {
        align: "center",
      });
    } catch (e) {
      console.error("Error generating barcode:", e);
      doc.setFontSize(5);
      doc.text(ticketData.barcodeValue, 15, 12, { align: "center" });
    }

    // Price at the bottom
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(`S/.${ticketData.price.toFixed(1)}`, 15, 18.5, {
      align: "center",
    });
  }

  // Open in new window
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
