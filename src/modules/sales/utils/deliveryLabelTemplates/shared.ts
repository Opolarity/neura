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
  senderAddress?: string;
}

export interface CompanyInfo {
  name: string;
  ruc: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

export const BLUE: [number, number, number] = [60, 78, 145]; // #3c4e91
export const BLUE_RUC: [number, number, number] = [47, 146, 198]; // #2f92c6
export const GREEN: [number, number, number] = [32, 118, 32]; // #207620
export const BLACK: [number, number, number] = [0, 0, 0];

export const CHAR_SPACE = 0.35; // subtle letter spacing for static text

export const loadImageAsDataUrl = (url: string): Promise<string> =>
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

/**
 * Static text: heavier bold (double-draw) + letter spacing.
 * Use for hardcoded strings that don't come from outside data.
 */
export const staticText = (
  doc: jsPDF,
  text: string | string[],
  x: number,
  y: number,
) => {
  doc.setCharSpace(CHAR_SPACE);
  doc.text(text, x, y);
  doc.text(text, x + 0.25, y);
  doc.setCharSpace(0);
};

/**
 * Draws a label + value inline, returns y after last value line.
 * - label: always static → heavy + charspace
 * - value: dynamic by default (just bold/normal); pass heavyValue=true if static
 */
export const inlineText = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelColor: [number, number, number],
  fontSize: number,
  maxW: number,
  heavyValue = false,
): number => {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...labelColor);
  staticText(doc, label, x, y);
  const labelW = doc.getTextWidth(label) + CHAR_SPACE * label.length;

  doc.setTextColor(...BLACK);
  const valueLines = doc.splitTextToSize(value, maxW - labelW);
  if (heavyValue) {
    doc.setFont("helvetica", "bold");
    staticText(doc, valueLines, x + labelW, y);
  } else {
    doc.setFont("helvetica", "bold");
    doc.text(valueLines, x + labelW, y);
  }
  return y + valueLines.length * (fontSize * 0.45);
};
