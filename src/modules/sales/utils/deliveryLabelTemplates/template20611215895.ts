import jsPDF from "jspdf";
import { CompanyInfo, DeliveryLabelData, loadImageAsDataUrl } from "./shared";

// Medidas físicas de la etiqueta del rollo (HiLabel 4"): 70 x 50 mm horizontal.
const LABEL_W = 70;
const LABEL_H = 50;
const MARGIN = 3;

// Valores base del layout (escala 1). Si el contenido no entra en la etiqueta,
// todo se reduce proporcionalmente hasta que quepa.
const BASE_FONT = 7.5;
const BASE_LINE_H = 4.2;
const BASE_LOGO_W = 38;
const BASE_LOGO_H = 12;
const BASE_LOGO_GAP = 3;
const MIN_FONT = 4;

export const generateTemplate20611215895 = async (
  data: DeliveryLabelData,
  company: CompanyInfo,
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [LABEL_H, LABEL_W],
  });

  const textW = LABEL_W - MARGIN * 2;
  const centerX = LABEL_W / 2;
  const availH = LABEL_H - MARGIN * 2;

  const fullName = [data.customerName, data.customerLastname, data.customerLastname2]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  const phone = data.receptionPhone || data.phone;
  const addressParts = [data.address, data.neighborhoodName, data.cityName, data.stateName]
    .filter(Boolean)
    .join(" ");

  const header = `${company.shortName || company.name} - ${company.ruc}`;
  const body = [
    `RUC/DNI: ${data.documentNumber || "—"}`,
    fullName && fullName !== "- -" ? fullName : "—",
    phone ? `CEL: +51 ${phone}` : "CEL: —",
    `DIRECCIÓN: ${addressParts || "—"}`,
  ];

  // Logo: se carga primero para poder medir su alto real dentro del layout.
  let logo: { dataUrl: string; w: number; h: number } | null = null;
  try {
    const dataUrl = await loadImageAsDataUrl(company.logoUrl || "/images/logo-rotulo-pdf.png");
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
    });
    const ratio = Math.min(BASE_LOGO_W / img.naturalWidth, BASE_LOGO_H / img.naturalHeight);
    logo = { dataUrl, w: img.naturalWidth * ratio, h: img.naturalHeight * ratio };
  } catch {
    // sin logo: el resto del layout se recalcula igual
  }

  doc.setFont("helvetica", "normal");

  /** Alto total que ocuparía el contenido a una escala dada. */
  const measure = (scale: number) => {
    doc.setFontSize(BASE_FONT * scale);
    const lineH = BASE_LINE_H * scale;
    const wrap = (t: string) => doc.splitTextToSize(t, textW) as string[];
    const lines = [wrap(header), ...body.map(wrap)];
    const totalLines = lines.reduce((acc, l) => acc + l.length, 0);
    const logoBlock = logo ? logo.h * scale + BASE_LOGO_GAP * scale * 2 : 0;
    return { height: totalLines * lineH + logoBlock, lineH, lines };
  };

  // Escala máxima que entra en la altura útil de la etiqueta.
  let scale = 1;
  let layout = measure(scale);
  while (layout.height > availH && BASE_FONT * (scale - 0.02) >= MIN_FONT) {
    scale -= 0.02;
    layout = measure(scale);
  }

  const fontSize = BASE_FONT * scale;
  const { lineH, lines } = layout;
  doc.setFontSize(fontSize);

  // Centrado vertical del bloque completo dentro de la etiqueta.
  let y = MARGIN + Math.max(0, (availH - layout.height) / 2);

  const drawLines = (block: string[]) => {
    block.forEach((line) => {
      const x = centerX - doc.getTextWidth(line) / 2;
      doc.text(line, x, y + lineH * 0.8);
      y += lineH;
    });
  };

  drawLines(lines[0]);

  if (logo) {
    const gap = BASE_LOGO_GAP * scale;
    const w = logo.w * scale;
    const h = logo.h * scale;
    y += gap;
    doc.addImage(logo.dataUrl, "PNG", centerX - w / 2, y, w, h);
    y += h + gap;
  }

  lines.slice(1).forEach(drawLines);

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
