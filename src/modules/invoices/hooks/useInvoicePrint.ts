import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { formatDateTime } from "@/shared/utils/date";
import {
  getInvoiceTemplateConfig,
  isNoteType,
  printedRepresentationLegend,
  shouldShowCustomerDocument,
  type InvoiceTemplateConfig,
} from "@/shared/utils/document-templates/documentTemplateConfig";
import { drawLogoInBox, loadDocumentLogo, resolveCompanyHeader } from "@/shared/utils/document-templates/pdfHeader";
import {
  CLOSING_MESSAGE,
  FOOTER_TITLE,
  FREE_TRANSFER_LEGEND,
  renderInvoiceA4,
  type InvoicePrintData,
  type InvoicePrintExtraLine,
} from "@/shared/utils/document-templates/invoiceA4Pdf";
import { hasShippingItem } from "../utils/shippingItem";

interface InvoiceData {
  id: number;
  tax_serie: string | null;
  invoice_number: string | null;
  total_amount: number;
  total_taxes: number | null;
  total_free: number | null;
  client_name: string | null;
  customer_document_number: string;
  customer_document_type_id: number;
  invoice_type_id: number;
  created_at: string;
  client_address: string | null;
  qr_data: string | null;
  created_by: string;
  vinculated_invoice_id: number | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number | null;
  igv: number;
  total: number;
  measurement_unit: string;
}

export function numberToWords(num: number): string {
  const units = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const teens = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const tens = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const hundreds = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (num === 0) return "CERO";

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  const convertGroup = (n: number): string => {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    let result = "";
    if (n >= 100) { result += hundreds[Math.floor(n / 100)] + " "; n %= 100; }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)];
      const u = n % 10;
      if (u > 0) result += " Y " + units[u];
    } else if (n >= 10) {
      result += teens[n - 10];
    } else if (n > 0) {
      result += units[n];
    }
    return result.trim();
  };

  let words = "";
  if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    words += thousands === 1 ? "MIL " : convertGroup(thousands) + " MIL ";
    const remainder = intPart % 1000;
    if (remainder > 0) words += convertGroup(remainder);
  } else {
    words = convertGroup(intPart);
  }

  return words.trim() + ` Y ${decPart.toString().padStart(2, "0")}/100 SOLES`;
}

const DEFAULT_RETURN_POLICY =
  "Recuerda que puedes realizar cambios y devoluciones dentro de los 15 días posteriores a la compra, siempre y cuando el producto esté en su estado original y con el ticket de compra.";

export interface InvoicePdfOptions {
  /**
   * "80mm" (por defecto) o el formato de la plantilla (InvoicePrintFormat).
   * Solo la lista de Comprobantes pide "configured": el POS, los comprobantes de
   * la venta y WhatsApp quedan siempre en 80 mm.
   */
  format?: "80mm" | "configured";
}

/**
 * Lee el comprobante y lo resuelve con la plantilla. Es la única consulta de
 * los PDF de comprobante: el ticket y el A4 dibujan lo mismo.
 */
export async function loadInvoicePrintData(
  invoiceId: number,
): Promise<{ data: InvoicePrintData; template: InvoiceTemplateConfig }> {
  const [invoiceRes, itemsRes, branchRes, template] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, tax_serie, invoice_number, total_amount, total_taxes, total_free, client_name, customer_document_number, customer_document_type_id, invoice_type_id, created_at, declared, client_email, client_address, created_by, qr_data, vinculated_invoice_id")
      .eq("id", invoiceId)
      .single(),
    supabase.from("invoice_items").select("description, quantity, unit_price, discount, igv, total, measurement_unit").eq("invoice_id", invoiceId),
    supabase.from("order_invoices").select("orders(*, branches(*))").eq("invoice_id", invoiceId).single(),
    getInvoiceTemplateConfig(),
  ]);

  if (invoiceRes.error || !invoiceRes.data) throw new Error("No se encontró el comprobante");

  const invoice = invoiceRes.data as InvoiceData;
  const items = (itemsRes.data || []) as InvoiceItem[];
  const order = (branchRes.data as any)?.orders;

  const shippingMethodCode = order?.shipping_method_code;
  const [shippingMethod, discountOrders, neighborhood, docTypeRes, invTypeRes, profileRes] =
    await Promise.all([
      shippingMethodCode
        ? supabase.from("shipping_costs").select("name").eq("id", shippingMethodCode).single()
        : Promise.resolve(null),
      supabase.from("order_discounts").select("name, discount_amount").eq("order_id", order?.id),
      supabase.from("neighborhoods").select("name").eq("id", order?.branches?.neighborhood_id).single(),
      supabase.from("document_types").select("name").eq("id", invoice.customer_document_type_id).single(),
      supabase.from("types").select("name, code").eq("id", invoice.invoice_type_id).single(),
      supabase.from("profiles").select("account_id").eq("UID", invoice.created_by).single(),
    ]);

  const typeCode = (invTypeRes.data?.code ?? "").trim();

  // Notas de crédito (3) y débito (4): muestran el comprobante que modifican (no hay motivo guardado).
  let modifiedDocument = "";
  if (isNoteType(typeCode) && invoice.vinculated_invoice_id) {
    const { data: parent } = await supabase
      .from("invoices")
      .select("tax_serie, invoice_number")
      .eq("id", invoice.vinculated_invoice_id)
      .maybeSingle();
    if (parent) modifiedDocument = [parent.tax_serie, parent.invoice_number].filter(Boolean).join("-");
  }

  let cashierName = "";
  if (profileRes.data) {
    const { data: account } = await supabase
      .from("accounts")
      .select("name, last_name")
      .eq("id", profileRes.data.account_id)
      .single();
    if (account) cashierName = [account.name, account.last_name].filter(Boolean).join(" ");
  }

  const establishmentAddress = order?.branches?.address + " " + neighborhood?.data?.name || "";

  const logo = await loadDocumentLogo(template.logoUrl);

  let qrDataUrl: string | null = null;
  if (invoice.qr_data) {
    try { qrDataUrl = await QRCode.toDataURL(invoice.qr_data, { width: 200, margin: 1 }); } catch {}
  }

  // Comprobantes nuevos traen el envío como item; solo los anteriores necesitan esta línea.
  const extraLines: InvoicePrintExtraLine[] = [];
  if (shippingMethodCode && shippingMethod && !hasShippingItem(items)) {
    extraLines.push({
      description: (shippingMethod as any).data?.name || shippingMethodCode,
      amount: (order.shipping_cost as number).toFixed(2),
    });
  }
  for (const discount of discountOrders.data ?? []) {
    extraLines.push({ description: discount.name, amount: "-" + discount.discount_amount.toFixed(2) });
  }

  const taxes = invoice.total_taxes || 0;
  const data: InvoicePrintData = {
    company: resolveCompanyHeader(template, establishmentAddress),
    logo,
    typeCode,
    typeName: invTypeRes.data?.name || "",
    orderId: order?.id ? String(order.id) : "",
    serie: invoice.tax_serie,
    number: invoice.invoice_number,
    issuedAt: formatDateTime(invoice.created_at),
    currency: "SOLES",
    customer: {
      name: invoice.client_name || "",
      documentTypeName: docTypeRes.data?.name || "",
      documentNumber: invoice.customer_document_number,
      showDocument: shouldShowCustomerDocument(template, typeCode, invoice.total_amount),
      address: invoice.client_address,
      showAddress: template.show.customerAddress,
    },
    modifiedDocument,
    noteReason: null,
    items: items.map((item) => ({
      quantity: item.quantity,
      unit: item.measurement_unit,
      description: item.description,
      unitPrice: item.unit_price,
      discount: item.discount,
      total: item.total,
    })),
    extraLines,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    taxLines: [
      ["OP. GRAVADAS", `S/ ${(invoice.total_amount - taxes).toFixed(2)}`],
      ["IGV 18%", `S/ ${taxes.toFixed(2)}`],
    ],
    freeAmount: invoice.total_free || 0,
    totalAmount: invoice.total_amount,
    amountInWords: numberToWords(invoice.total_amount),
    cashierName,
    qrDataUrl,
    legends: [],
    footerMessage: template.footerMessage || DEFAULT_RETURN_POLICY,
  };

  return { data, template };
}

/** Ticket térmico de 80 mm. El alto se ajusta al contenido. */
export function renderInvoiceTicket(data: InvoicePrintData): jsPDF {
  const pageWidth = 80;
  const margin = 3;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = { title: 11, subtitle: 9.5, normal: 8.5, small: 8, tiny: 7.5 };
  const { company, logo } = data;
  const printedLegend = printedRepresentationLegend(data.typeCode);

  const drawContent = (doc: jsPDF): number => {
    let y = 4;

    if (logo) {
      const maxW = 60, maxH = 22;
      y += drawLogoInBox(doc, logo, { x: (pageWidth - maxW) / 2, y, width: maxW, height: maxH }) + 5;
    } else {
      y += 2;
    }

    // Razón social: SUNAT la exige también cuando hay logo.
    doc.setFontSize(fontSize.title); doc.setFont("helvetica", "bold");
    for (const line of doc.splitTextToSize((company.name || "EMPRESA").toUpperCase(), contentWidth)) {
      doc.text(line, pageWidth / 2, y, { align: "center" }); y += 3.5;
    }
    y += 0.5;

    doc.setFontSize(fontSize.small); doc.setFont("helvetica", "normal");
    // Domicilio fiscal (SUNAT), además de la dirección del establecimiento.
    if (company.fiscalAddress) {
      for (const line of doc.splitTextToSize(`Domicilio fiscal: ${company.fiscalAddress}`, contentWidth)) {
        doc.text(line, pageWidth / 2, y, { align: "center" }); y += 3;
      }
    }
    if (company.establishmentAddress) {
      for (const line of doc.splitTextToSize(company.establishmentAddress, contentWidth)) {
        doc.text(line, pageWidth / 2, y, { align: "center" }); y += 3;
      }
    }
    if (company.phone) { doc.text(`Teléfono: ${company.phone}`, pageWidth / 2, y, { align: "center" }); y += 3; }
    if (company.email) { doc.text(`E-mail: ${company.email}`, pageWidth / 2, y, { align: "center" }); y += 3; }
    if (company.ruc) {
      doc.setFont("helvetica", "bold");
      doc.text(`R.U.C.: ${company.ruc}`, pageWidth / 2, y, { align: "center" });
      doc.setFont("helvetica", "normal"); y += 3.5;
    }

    y += 1.5; doc.setLineWidth(0.3); doc.line(margin, y, pageWidth - margin, y); y += 3.5;

    doc.setFontSize(fontSize.title); doc.setFont("helvetica", "bold");
    doc.text((data.typeName || "COMPROBANTE").toUpperCase(), pageWidth / 2, y, { align: "center" }); y += 4;
    doc.text(("PEDIDO: #" + data.orderId).toUpperCase(), pageWidth / 2, y, { align: "center" }); y += 4;

    const serieNum = [data.serie, data.number].filter(Boolean).join(" - ");
    if (serieNum) {
      doc.setFontSize(fontSize.subtitle);
      doc.text(serieNum, pageWidth / 2, y, { align: "center" }); y += 4;
    }

    doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += 3;

    doc.setFontSize(fontSize.normal); doc.setFont("helvetica", "normal");
    for (const [label, value] of [
      ["FECHA DE EMISIÓN:", data.issuedAt],
      ["CLIENTE:", data.customer.name || "Clientes Varios"],
      ...(data.customer.showDocument
        ? [[`${data.customer.documentTypeName || "Doc"}:`, data.customer.documentNumber]]
        : []),
      ...(data.customer.showAddress && data.customer.address
        ? [["DIRECCIÓN:", data.customer.address]]
        : []),
      ...(data.modifiedDocument ? [["DOC. QUE MODIFICA:", data.modifiedDocument]] : []),
    ] as [string, string][]) {
      doc.setFont("helvetica", "bold"); doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      const lw = doc.getTextWidth(label) + 1;
      const vLines = doc.splitTextToSize(value, contentWidth - lw);
      for (let i = 0; i < vLines.length; i++) doc.text(vLines[i], margin + lw, y + i * 2.5);
      y += Math.max(vLines.length * 2.5, 3);
    }

    y += 1; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += 3;

    // U.M. entre cantidad y descripción; la descripción envuelve en el ancho que le queda.
    const col = { cant: margin, um: margin + 10, desc: margin + 18, pu: pageWidth - margin - 14, dsct: pageWidth - margin };
    doc.setFontSize(fontSize.small); doc.setFont("helvetica", "bold");
    doc.text("CANT.", col.cant, y); doc.text("U.M.", col.um, y); doc.text("DESCRIPCIÓN", col.desc, y);
    doc.text("P.U.", col.pu, y, { align: "right" });
    doc.text("DESC.", col.dsct, y, { align: "right" });
    y += 2; doc.setLineWidth(0.1); doc.line(margin, y, pageWidth - margin, y); y += 2.5;

    doc.setFont("helvetica", "normal");
    for (const item of data.items) {
      doc.text(item.quantity % 1 === 0 ? String(item.quantity) : item.quantity.toFixed(2), col.cant, y);
      const dw = col.pu - col.desc - 14;
      const dLines = doc.splitTextToSize(item.description, dw > 0 ? dw : 30);
      for (let i = 0; i < dLines.length; i++) doc.text(dLines[i], col.desc, y + i * 2.5);
      const uLines = item.unit ? doc.splitTextToSize(item.unit, col.desc - col.um - 1) : [];
      for (let i = 0; i < uLines.length; i++) doc.text(uLines[i], col.um, y + i * 2.5);
      doc.text(item.unitPrice.toFixed(2), col.pu, y, { align: "right" });
      // Descuento de la linea completa (no por unidad): total = cant x P.U. - descuento.
      doc.text(item.discount ? item.discount.toFixed(2) : "—", col.dsct, y, { align: "right" });
      y += Math.max(dLines.length * 2.5, uLines.length * 2.5, 3) + 0.5;
    }

    // Envío de comprobantes antiguos y descuentos del pedido.
    for (const line of data.extraLines) {
      const dw = col.pu - col.desc - 14;
      const lLines = doc.splitTextToSize(line.description, dw > 0 ? dw : 30);
      for (let i = 0; i < lLines.length; i++) doc.text(lLines[i], col.desc, y + i * 2.5);
      doc.text(line.amount, col.pu, y, { align: "right" });
      y += Math.max(lLines.length * 2.5, 3) + 0.5;
    }

    y += 1; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += 3;

    doc.setFontSize(fontSize.normal);
    const totalQty = data.totalQuantity;
    for (const [label, value] of [
      ["TOTAL CANT.", totalQty % 1 === 0 ? String(totalQty) : totalQty.toFixed(2)],
      ...data.taxLines,
      ...(data.freeAmount > 0 ? [["OP. GRATUITAS", `S/ ${data.freeAmount.toFixed(2)}`]] : []),
      ["IMPORTE TOTAL:", `S/ ${data.totalAmount.toFixed(2)}`],
    ] as [string, string][]) {
      const isTotal = label === "IMPORTE TOTAL:";
      doc.setFont("helvetica", isTotal ? "bold" : "normal");
      if (isTotal) doc.setFontSize(fontSize.subtitle);
      doc.text(label, margin, y); doc.text(value, pageWidth - margin, y, { align: "right" });
      if (isTotal) doc.setFontSize(fontSize.normal);
      y += 3;
    }

    y += 0.5;
    doc.setFont("helvetica", "bold"); doc.text("SON:", margin, y);
    doc.setFont("helvetica", "normal");
    const wLines = doc.splitTextToSize(data.amountInWords, contentWidth - 8);
    for (let i = 0; i < wLines.length; i++) doc.text(wLines[i], margin + 8, y + i * 2.5);
    y += wLines.length * 2.5 + 1;

    if (data.cashierName) {
      doc.setFont("helvetica", "bold"); doc.text("CAJERO:", margin, y);
      doc.setFont("helvetica", "normal"); doc.text(data.cashierName.toUpperCase(), margin + 14, y);
      y += 4;
    }

    doc.setLineWidth(0.3); doc.line(margin, y, pageWidth - margin, y); y += 4;

    doc.setFontSize(fontSize.subtitle); doc.setFont("helvetica", "bold");
    doc.text(FOOTER_TITLE, pageWidth / 2, y, { align: "center" }); y += 3;

    doc.setFontSize(fontSize.tiny); doc.setFont("helvetica", "normal");
    for (const line of doc.splitTextToSize(data.footerMessage, contentWidth)) {
      doc.text(line, pageWidth / 2, y, { align: "center" }); y += 2.2;
    }

    y += 2; doc.setFontSize(fontSize.normal); doc.setFont("helvetica", "bold");
    doc.text(CLOSING_MESSAGE, pageWidth / 2, y, { align: "center" }); y += 4;

    // Representación impresa: solo comprobantes electrónicos (el interno INV no la lleva).
    if (printedLegend) {
      doc.setFontSize(fontSize.tiny); doc.setFont("helvetica", "normal");
      for (const line of doc.splitTextToSize(printedLegend, contentWidth)) {
        doc.text(line, pageWidth / 2, y, { align: "center" }); y += 2.8;
      }
      y += 1;
    }

    if (data.qrDataUrl) {
      const qrSize = 35;
      doc.addImage(data.qrDataUrl, "PNG", (pageWidth - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 2;
    }

    for (const legend of data.freeAmount > 0 ? [FREE_TRANSFER_LEGEND] : []) {
      y += 1; doc.setFontSize(fontSize.tiny); doc.setFont("helvetica", "normal");
      for (const line of doc.splitTextToSize(legend, contentWidth)) {
        doc.text(line, pageWidth / 2, y, { align: "center" }); y += 2.8;
      }
    }

    return y;
  };

  const measureDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidth, 9999] });
  const finalY = drawContent(measureDoc);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidth, finalY + 4] });
  drawContent(doc);
  return doc;
}

/**
 * El PDF del comprobante. Por defecto es el ticket de 80 mm (POS, comprobantes
 * de la venta y WhatsApp); con { format: "configured" } usa el formato de la
 * plantilla.
 */
export async function generateInvoicePdfBlob(
  invoiceId: number,
  options: InvoicePdfOptions = {},
): Promise<Blob> {
  const { data, template } = await loadInvoicePrintData(invoiceId);
  const useA4 = options.format === "configured" && template.format === "A4";
  return (useA4 ? renderInvoiceA4(data) : renderInvoiceTicket(data)).output("blob");
}

async function generateInvoicePdf(invoiceId: number, options: InvoicePdfOptions = {}): Promise<string> {
  return URL.createObjectURL(await generateInvoicePdfBlob(invoiceId, options));
}

export function useInvoicePrint() {
  const [printingId, setPrintingId] = useState<number | null>(null);

  /**
   * Sin opciones imprime el ticket de 80 mm (POS y comprobantes de la venta).
   * La lista de Comprobantes pasa { format: "configured" } para usar el formato
   * de la plantilla (InvoicePrintFormat).
   */
  const printInvoice = async (invoiceId: number, options?: InvoicePdfOptions) => {
    if (printingId !== null) return;
    setPrintingId(invoiceId);
    try {
      const pdfUrl = await generateInvoicePdf(invoiceId, options);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;opacity:0;pointer-events:none";
      document.body.appendChild(iframe);
      iframe.src = pdfUrl;
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
          try { document.body.removeChild(iframe); } catch {}
        }, 300000);
      };
    } finally {
      setPrintingId(null);
    }
  };

  return { printInvoice, printingId };
}
