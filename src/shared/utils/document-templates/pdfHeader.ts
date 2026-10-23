import type jsPDF from "jspdf";
import type { InvoiceTemplateConfig, RemisionGuideTemplateConfig } from "./documentTemplateConfig";

/**
 * Cabecera de los documentos (T-1013): logo y datos del emisor según la
 * plantilla. La comparten el ticket de 80 mm y el A4 de los comprobantes, y la
 * usa la guía de remisión de ventas.
 *
 * Razón social, RUC y domicilio fiscal no dependen de banderas: SUNAT los exige
 * en la representación impresa. Solo teléfono y correo se pueden ocultar.
 */

export interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

export async function loadImage(url: string): Promise<LoadedImage> {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl: canvas.toDataURL("image/png"), width: img.width, height: img.height });
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
}

/** Logo de documentos (InvoiceLogoUrl). Si no carga, el documento sale sin logo. */
export async function loadDocumentLogo(
  logoUrl: string,
  fallbackUrl = "/images/logo-ticket.png",
): Promise<LoadedImage | null> {
  try {
    return await loadImage(logoUrl || fallbackUrl);
  } catch {
    return null;
  }
}

export interface CompanyHeader {
  name: string;
  ruc: string;
  /** Domicilio fiscal; null si no está configurado o coincide con el establecimiento. */
  fiscalAddress: string | null;
  /** Dirección del establecimiento (sucursal) donde se emitió. */
  establishmentAddress: string;
  /** null cuando la plantilla lo oculta o no hay dato. */
  phone: string | null;
  email: string | null;
}

const sameAddress = (a: string, b: string) =>
  a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

export const resolveCompanyHeader = (
  config: InvoiceTemplateConfig,
  establishmentAddress: string,
): CompanyHeader => {
  const fiscal = config.company.fiscalAddress.trim();
  return {
    name: config.company.name,
    ruc: config.company.documentNumber,
    fiscalAddress: fiscal && !sameAddress(fiscal, establishmentAddress) ? fiscal : null,
    establishmentAddress,
    phone: config.show.companyPhone && config.company.phone ? config.company.phone : null,
    email: config.show.companyEmail && config.company.email ? config.company.email : null,
  };
};

/** Dibuja el logo dentro de una caja, centrado y sin deformar. Devuelve el alto usado. */
export const drawLogoInBox = (
  doc: jsPDF,
  logo: LoadedImage,
  box: { x: number; y: number; width: number; height: number },
  align: "center" | "left" = "center",
): number => {
  const ratio = Math.min(box.width / logo.width, box.height / logo.height);
  const w = logo.width * ratio, h = logo.height * ratio;
  const offsetX = align === "center" ? (box.width - w) / 2 : 0;
  const offsetY = (box.height - h) / 2;
  doc.addImage(logo.dataUrl, "PNG", box.x + offsetX, box.y + offsetY, w, h);
  return offsetY + h;
};

// ── Cabecera de la guía de remisión (T-1013, fase 2) ────────────────────────

export interface GuideCompanyHeader {
  name: string;
  ruc: string;
  address: string;
  /** null cuando la plantilla lo oculta o no hay dato. */
  phone: string | null;
  email: string | null;
  website: string;
}

export const resolveGuideCompanyHeader = (config: RemisionGuideTemplateConfig): GuideCompanyHeader => ({
  name: config.company.name,
  ruc: config.company.documentNumber,
  address: config.company.fiscalAddress,
  phone: config.show.companyPhone && config.company.phone ? config.company.phone : null,
  email: config.show.companyEmail && config.company.email ? config.company.email : null,
  website: config.company.website,
});

/**
 * Bloque del emisor dentro del recuadro de la guía: logo a la izquierda (si
 * hay) y los datos a su lado, con la misma tipografía de siempre. Razón social
 * y RUC no dependen de banderas.
 */
export const drawGuideCompanyBlock = (
  doc: jsPDF,
  company: GuideCompanyHeader,
  logo: LoadedImage | null,
  box: { x: number; y: number; width: number; height: number },
  colors: { dark: [number, number, number]; muted: [number, number, number] },
) => {
  let textX = box.x + 3;
  if (logo) {
    drawLogoInBox(doc, logo, { x: box.x + 3, y: box.y + 3, width: 30, height: box.height - 6 }, "left");
    textX += 34;
  }
  const maxW = box.x + box.width - textX - 3;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.dark);
  doc.text(doc.splitTextToSize(company.name, maxW)[0] ?? "", textX, box.y + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.muted);
  const lines = [
    company.address,
    `${company.email ? `Email: ${company.email}   ` : ""}R.U.C. ${company.ruc}`,
    company.phone ? `Teléfono: ${company.phone}` : "",
    company.website ? `Website: ${company.website}` : "",
  ].filter(Boolean);
  lines.forEach((line, i) => {
    doc.text(doc.splitTextToSize(line, maxW)[0] ?? "", textX, box.y + 14 + i * 6);
  });
};

/** Pie de la guía (RemisionGuideFooterMessage). Devuelve la nueva posición. */
export const drawGuideFooter = (
  doc: jsPDF,
  message: string,
  y: number,
  layout: { margin: number; contentW: number; bottom: number },
  color: [number, number, number],
): number => {
  if (!message) return y;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...color);
  const lines: string[] = doc.splitTextToSize(message, layout.contentW);
  let cursor = y + 6;
  if (cursor + lines.length * 3.5 > layout.bottom) {
    doc.addPage();
    cursor = 20;
  }
  lines.forEach((line) => {
    doc.text(line, layout.margin, cursor);
    cursor += 3.5;
  });
  return cursor;
};
