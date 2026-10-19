import type jsPDF from "jspdf";
import type { InvoiceTemplateConfig } from "./documentTemplateConfig";

/**
 * Cabecera de los documentos (T-1013): logo y datos del emisor según la
 * plantilla. La comparten el ticket de 80 mm y el A4 de los comprobantes, y la
 * usará la guía de remisión.
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
