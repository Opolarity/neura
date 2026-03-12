import jsPDF from "jspdf";

export interface DeliveryLabelData {
  customerName: string;
  customerLastname: string;
  customerLastname2?: string;
  documentNumber: string;
  address: string;
  addressReference?: string;
  receptionPerson?: string;
  receptionPhone?: string;
  phone?: string;
  cityName?: string;
  stateName?: string;
  neighborhoodName?: string;
}

const REMITENTE = {
  name: "OVERTAKE UNLIMITED E.I.R.L.",
  ruc: "20607798002",
  phone: "951645997",
  address: "AV. BRASIL 817. JESÚS MARÍA - LIMA.",
};

/**
 * Loads an image as a base64 data URL using fetch + FileReader
 */
const loadImageAsDataUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });

export const generateDeliveryLabel = async (data: DeliveryLabelData) => {
  const W = 100; // mm
  const H = 140; // mm
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, H] });
  const margin = 5;
  const contentW = W - margin * 2;
  let y = margin;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  // Load logo
  try {
    const logoDataUrl = await loadImageAsDataUrl("/images/logo-ticket.png");
    const logoW = 25;
    const logoH = 12;
    doc.addImage(logoDataUrl, "PNG", margin, y, logoW, logoH);
    // RUC next to logo
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`RUC: ${REMITENTE.ruc}`, margin + logoW + 3, y + 5);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(REMITENTE.name, margin + logoW + 3, y + 9);
    y += logoH + 3;
  } catch {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(REMITENTE.name, margin, y + 4);
    doc.text(`RUC: ${REMITENTE.ruc}`, margin, y + 8);
    y += 12;
  }

  // Separator
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 4;

  // ── REMITENTE ──
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("REMITENTE:", margin, y);
  y += 4;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(REMITENTE.name, margin, y);
  y += 3.5;
  doc.text(`CEL: ${REMITENTE.phone}`, margin, y);
  y += 3.5;

  const addrLines = doc.splitTextToSize(`DIRECCIÓN: ${REMITENTE.address}`, contentW);
  doc.text(addrLines, margin, y);
  y += addrLines.length * 3.5;
  doc.text(`RUC: ${REMITENTE.ruc}`, margin, y);
  y += 5;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 5;

  // ── DESTINATARIO ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATARIO:", margin, y);
  y += 5;

  // Name
  const fullName = [data.customerName, data.customerLastname, data.customerLastname2]
    .filter(Boolean)
    .join(" ");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(fullName, contentW);
  doc.text(nameLines, margin, y);
  y += nameLines.length * 4;

  // Document
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  if (data.documentNumber) {
    doc.text(`DOC: ${data.documentNumber}`, margin, y);
    y += 4;
  }

  // Address / Destination
  const destParts = [data.address, data.neighborhoodName, data.cityName, data.stateName]
    .filter(Boolean)
    .join(", ");
  if (destParts) {
    doc.setFont("helvetica", "bold");
    doc.text("DESTINO:", margin, y);
    y += 3.5;
    doc.setFont("helvetica", "normal");
    const destLines = doc.splitTextToSize(destParts, contentW);
    doc.text(destLines, margin, y);
    y += destLines.length * 3.5;
  }

  if (data.addressReference) {
    doc.text(`REF: ${data.addressReference}`, margin, y);
    y += 4;
  }

  // Reception person
  if (data.receptionPerson) {
    doc.text(`RECIBE: ${data.receptionPerson}`, margin, y);
    y += 4;
  }

  // Phone
  const phone = data.receptionPhone || data.phone;
  if (phone) {
    doc.setFont("helvetica", "bold");
    doc.text(`CEL: ${phone}`, margin, y);
    y += 4;
  }

  // Open in new tab
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
};
