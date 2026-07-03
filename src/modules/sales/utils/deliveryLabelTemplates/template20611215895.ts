import jsPDF from "jspdf";
import { CompanyInfo, DeliveryLabelData, loadImageAsDataUrl } from "./shared";

export const generateTemplate20611215895 = async (
  data: DeliveryLabelData,
  company: CompanyInfo,
) => {
  const W = 69;
  const H = 50;
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [H, W],
  });
  const margin = 3;
  const leftPad = 7;
  const maxTextW = 55;
  const centerX = leftPad + maxTextW / 2;
  const lineH = 4;

  const centeredWrapped = (text: string, startY: number): number => {
    const lines = doc.splitTextToSize(text, maxTextW);
    lines.forEach((line: string, i: number) => {
      const lineW = doc.getTextWidth(line);
      const x = leftPad + (maxTextW - lineW) / 2;
      doc.text(line, x, startY + i * lineH);
    });
    return startY + lines.length * lineH;
  };

  let y = margin + 4;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  y = centeredWrapped(`${company.shortName || "PERCEPTION"} - ${company.ruc}`, y);

  try {
    const logoDataUrl = await loadImageAsDataUrl(company.logoUrl || "/images/logo-rotulo-pdf.png");
    const nativeLogo = new Image();
    nativeLogo.src = logoDataUrl;
    await new Promise<void>((res) => {
      nativeLogo.onload = () => res();
    });
    const maxLogoW = 38;
    const maxLogoH = 12;
    const logoGap = 5;
    const ratio = Math.min(maxLogoW / nativeLogo.naturalWidth, maxLogoH / nativeLogo.naturalHeight);
    const w = nativeLogo.naturalWidth * ratio;
    const h = nativeLogo.naturalHeight * ratio;
    doc.addImage(logoDataUrl, "PNG", centerX - w / 2, y, w, h);
    y += h + logoGap;
  } catch {
    // skip if logo not found
  }

  y = centeredWrapped(`RUC/DNI: ${data.documentNumber || "—"}`, y);

  const fullName = [data.customerName, data.customerLastname, data.customerLastname2]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  y = centeredWrapped(fullName && fullName !== "- -" ? fullName : "—", y);

  const phone = data.receptionPhone || data.phone;
  y = centeredWrapped(phone ? `CEL: +51 ${phone}` : "CEL: —", y);

  const addressParts = [data.address, data.neighborhoodName, data.cityName, data.stateName]
    .filter(Boolean)
    .join(" ");
  centeredWrapped(`DIRECCIÓN: ${addressParts || "—"}`, y);

  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
