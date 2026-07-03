import jsPDF from "jspdf";
import {
  BLACK,
  BLUE,
  BLUE_RUC,
  CompanyInfo,
  DeliveryLabelData,
  inlineText,
  loadImageAsDataUrl,
  staticText,
} from "./shared";

export const generateTemplate20607798002 = async (
  data: DeliveryLabelData,
  company: CompanyInfo,
) => {
  const { name: companyName, ruc: companyRuc, phone: companyPhone, address: companyAddress } = company;
  const W = 100;
  const H = 140;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [W, H],
  });
  const margin = 4;
  const contentW = W - margin * 2;
  const innerX = margin + 2;
  const innerW = contentW - 4;

  // ── Outer border ──
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, contentW, H - margin * 2);

  // ── Header: logo | divider | RUC ──
  const headerH = 18;
  const headerY = margin;
  const dividerX = margin + 44;

  let logoLoaded = false;
  try {
    const logoDataUrl = await loadImageAsDataUrl(company.logoUrl || "/images/logo-rotulo-pdf.png");
    const nativeLogo = new Image();
    nativeLogo.src = logoDataUrl;
    await new Promise<void>((res) => {
      nativeLogo.onload = () => res();
    });
    const maxW = 38;
    const maxH = 12;
    const ratio = Math.min(maxW / nativeLogo.naturalWidth, maxH / nativeLogo.naturalHeight);
    const w = nativeLogo.naturalWidth * ratio;
    const h = nativeLogo.naturalHeight * ratio;
    const offsetX = (maxW - w) / 2;
    const offsetY = (maxH - h) / 2;
    doc.addImage(logoDataUrl, "PNG", innerX + 1 + offsetX, headerY + 3 + offsetY, w, h);
    logoLoaded = true;
  } catch {
    // fallback
  }

  if (!logoLoaded) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    staticText(doc, "PERCEPTION", innerX, headerY + 10);
  }

  // Vertical divider
  doc.setLineWidth(0.3);
  doc.line(dividerX, headerY, dividerX, headerY + headerH);

  // RUC in header — "RUC:" static (#2f92c6), value static (BLACK)
  const rucX = dividerX + 3;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE_RUC);
  staticText(doc, "RUC:", rucX, headerY + 10);
  const rucLabelW = doc.getTextWidth("RUC:") + 0.35 * 5 + 1;
  doc.setTextColor(...BLACK);
  staticText(doc, companyRuc, rucX + rucLabelW, headerY + 10);

  // Horizontal separator after header
  const sep1Y = margin + headerH;
  doc.setLineWidth(0.4);
  doc.line(margin, sep1Y, W - margin, sep1Y);

  let y = sep1Y + 8;

  // ── REMITENTE title (static) ──
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  staticText(doc, "REMITENTE", innerX, y);
  y += 9;

  // Company name — static, blue bold
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE);
  const nameLines = doc.splitTextToSize(companyName, innerW);
  staticText(doc, nameLines, innerX, y);
  y += nameLines.length * 5.5;

  // CEL: static label + static value (company phone)
  y = inlineText(
    doc,
    "CEL: ",
    companyPhone,
    innerX,
    y,
    BLUE,
    11,
    innerW,
    true,
  );
  y += 3;

  // DIRECCIÓN: static label + static value (company address)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE);
  staticText(doc, "DIRECCIÓN: ", innerX, y);
  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  const addrLines = doc.splitTextToSize(data.senderAddress || companyAddress, innerW);
  staticText(doc, addrLines, innerX, y);
  y += addrLines.length * 5.5 + 13;

  // ── DESTINATARIO title (static) ──
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  staticText(doc, "DESTINATARIO", innerX, y);
  y += 9;

  // Customer name — dynamic, green bold
  const fullName = [
    data.customerName,
    data.customerLastname,
    data.customerLastname2,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(32, 118, 32);
  const custLines = doc.splitTextToSize(fullName, innerW);
  doc.text(custLines, innerX, y);
  y += custLines.length * 5.5 + 2;

  // RUC/DNI: static label (#3c4e91) + dynamic value
  if (data.documentNumber) {
    y = inlineText(
      doc,
      "RUC/DNI: ",
      data.documentNumber,
      innerX,
      y,
      BLUE,
      11,
      innerW,
    );
    y += 3;
  }

  // DESTINO: static label (BLACK) + dynamic value (address)
  const destParts = [
    data.address,
    data.neighborhoodName,
    data.cityName,
    data.stateName,
  ]
    .filter(Boolean)
    .join(" ");
  if (destParts) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    staticText(doc, "DESTINO: ", innerX, y);
    const destLabelW = doc.getTextWidth("DESTINO: ") + 0.35 * 9 + 1;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    const destLines = doc.splitTextToSize(destParts, innerW - destLabelW);
    doc.text(destLines, innerX + destLabelW, y);
    y += destLines.length * 5.5 + 2;
  }

  // CEL: static label (BLUE) + dynamic value (phone)
  const phone = data.receptionPhone || data.phone;
  if (phone) {
    inlineText(doc, "CEL: ", `+51 ${phone}`, innerX, y, BLUE, 11, innerW);
  }

  // ── Alien image — absolute, bottom-right, on top of content ──
  try {
    const alienDataUrl = await loadImageAsDataUrl(
      "/images/alien-rotulo-pdf.png",
    );
    const imgH = 28; // doble del alto del logo
    const nativeImg = new Image();
    nativeImg.src = alienDataUrl;
    await new Promise<void>((res) => {
      nativeImg.onload = () => res();
    });
    const imgW = imgH * (nativeImg.naturalWidth / nativeImg.naturalHeight);
    const imgX = W - margin - 2 - imgW + 1; // ← ajusta este valor para mover en X
    const imgY = H - margin - 2 - imgH + 8.5; // ← ajusta este valor para mover en Y
    doc.addImage(alienDataUrl, "PNG", imgX, imgY, imgW, imgH);
  } catch {
    // silently skip if image not found
  }

  // Open in new tab
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
