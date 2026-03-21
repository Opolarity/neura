import jsPDF from "jspdf";

const EMPRESA = {
  name: "OVERTAKE UNLIMITED E.I.R.L.",
  ruc: "20607798002",
  phone: "951645997",
  address: "AV. BRASIL 817. JESÚS MARÍA - LIMA.",
  email: "overtake.peru.empresa@gmail.com",
  website: "https://overtake.com.pe",
  direccionPartida: "GAMARRA GALERIA PARAISO - LA VICTORIA - LIMA",
};

export interface RemisionGuideData {
  customerName: string;
  customerLastname: string;
  customerLastname2?: string;
  documentType?: string;
  documentNumber: string;
  address?: string;
  countryName?: string;
  stateName?: string;
  cityName?: string;
  neighborhoodName?: string;
  shippingMethodName?: string;
  saleDate: string;
  orderId?: number;
  direccionPartida?: string;
  items: Array<{
    sku: string;
    productName: string;
    variationName: string;
    quantity: number;
  }>;
}

export function generateRemisionGuide(data: RemisionGuideData): void {
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
  doc.text("GUÍA DE REMISIÓN", rightBoxX + rightBoxW / 2, y + 11, { align: "center" });

  // Guide number
  const guideNumber = `T001-${String(data.orderId || 0).padStart(8, "0")}`;
  doc.setFontSize(9);
  doc.text(guideNumber, rightBoxX + rightBoxW / 2, y + 20, { align: "center" });

  // Company info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(EMPRESA.name, margin + 3, y + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text(EMPRESA.address, margin + 3, y + 14);
  doc.text(`Email: ${EMPRESA.email}   R.U.C. ${EMPRESA.ruc}`, margin + 3, y + 20);
  doc.text(`Teléfono: ${EMPRESA.phone}`, margin + 3, y + 26);
  doc.text(`Website: ${EMPRESA.website}`, margin + 3, y + 32);

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
    labelW = 46
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
  let fechaStr = data.saleDate ?? "";
  try {
    const d = new Date(data.saleDate);
    if (!isNaN(d.getTime())) {
      fechaStr = d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch {
    // keep original
  }

  // ── DESTINATARIO ─────────────────────────────────────────────────────────
  drawSectionHeader("Destinatario");

  const fullName = [data.customerName, data.customerLastname, data.customerLastname2]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  const direccionPrincipal = [
    data.countryName,
    data.stateName,
    data.cityName,
    data.neighborhoodName,
    data.address,
  ]
    .filter(Boolean)
    .join(" / ")
    .toUpperCase();

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
    (data.documentType || "DNI").toUpperCase(),
    margin + 3,
    y + 3,
    50
  );
  y += 7;

  labelValue(
    "Número de Documento de Identidad",
    data.documentNumber || "-",
    margin + 3,
    y + 3,
    64
  );
  y += 9;

  // ── ENVÍO ────────────────────────────────────────────────────────────────
  drawSectionHeader("Envío");

  labelValue("Fecha de emisión", fechaStr, margin + 3, y + 5, 38);
  labelValue("Motivo de Traslado", "Venta", pageW / 2, y + 5, 36);
  y += 8;

  labelValue("Fecha inicio de traslado", fechaStr, margin + 3, y + 3, 50);
  labelValue("Modalidad de Transporte", "Transporte Público", pageW / 2, y + 3, 42);
  y += 7;

  labelValue(
    "Dirección de partida",
    (data.direccionPartida || EMPRESA.direccionPartida).toUpperCase(),
    margin + 3,
    y + 3,
    38
  );
  labelValue("Peso bruto total(KGM)", "0.0", pageW / 2, y + 3, 42);
  y += 7;

  labelValue(
    "Dirección de llegada",
    direccionPrincipal || "-",
    margin + 3,
    y + 3,
    38
  );
  y += 9;

  // ── TRANSPORTE PÚBLICO ───────────────────────────────────────────────────
  drawSectionHeader("Transporte Público");

  labelValue(
    "Empresa de Transporte",
    data.shippingMethodName?.toUpperCase() || "-",
    margin + 3,
    y + 5,
    40
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
      const guideNumber = `T001-${String(data.orderId || 0).padStart(8, "0")}`;
      doc.text(`GUÍA DE REMISIÓN ${guideNumber} — Detalle de Envío (cont.)`, margin, y + 5);
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
      while (doc.getTextWidth(truncated + "…") > maxDescW && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      finalDesc = truncated + "…";
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...dark);
    doc.text(String(idx + 1), margin + 4, y + 4.5);
    doc.text(finalDesc, margin + 14, y + 4.5);
    doc.text("Unidades", margin + 120, y + 4.5);
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
