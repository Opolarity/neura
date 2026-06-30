import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { getParameters } from "@/modules/settings/services/Parameters.service";
import { formatDateTime } from "@/shared/utils/date";

interface InvoiceData {
  id: number;
  tax_serie: string | null;
  invoice_number: string | null;
  total_amount: number;
  total_taxes: number | null;
  client_name: string | null;
  customer_document_number: string;
  customer_document_type_id: number;
  invoice_type_id: number;
  created_at: string;
  client_address: string | null;
  qr_data: string | null;
  created_by: string;
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

function numberToWords(num: number): string {
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

async function loadImage(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
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

async function generateInvoicePdf(invoiceId: number): Promise<string> {
  const [invoiceRes, itemsRes, paramsRes, parametersRes, branchRes, companyParams] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, tax_serie, invoice_number, total_amount, total_taxes, total_free, client_name, customer_document_number, customer_document_type_id, invoice_type_id, created_at, declared, client_email, client_address, created_by, qr_data")
        .eq("id", invoiceId)
        .single(),
      supabase.from("invoice_items").select("description, quantity, unit_price, discount, igv, total, measurement_unit").eq("invoice_id", invoiceId),
      supabase.from("paremeters").select("name, value, code"),
      supabase.from("parameters").select("name, value").eq("name", "InvoiceLogoUrl").maybeSingle(),
      supabase.from("order_invoices").select("orders(*, branches(*))").eq("invoice_id", invoiceId).single(),
      getParameters(["CompanyName", "CompanyPhoneNumber", "CompanyDocumentNumber", "CompanyEmail", "InvoiceFooterMessage"]),
    ]);

  if (invoiceRes.error || !invoiceRes.data) throw new Error("No se encontró el comprobante");

  const invoice = invoiceRes.data as InvoiceData;
  const items = (itemsRes.data || []) as InvoiceItem[];
  const params = (paramsRes.data || []) as { name: string; value: string; code: string | null }[];
  const getParam = (code: string) => params.find((p) => p.code === code)?.value || "";

  const shippingMethodCode = (branchRes.data as any)?.orders?.shipping_method_code;
  const [shippingMethod, discountOrders, neighborhood, docTypeRes, invTypeRes, profileRes] =
    await Promise.all([
      shippingMethodCode
        ? supabase.from("shipping_methods").select("name").eq("code", shippingMethodCode).single()
        : Promise.resolve(null),
      supabase.from("order_discounts").select("name, discount_amount").eq("order_id", (branchRes.data as any)?.orders?.id),
      supabase.from("neighborhoods").select("name").eq("id", (branchRes.data as any)?.orders?.branches?.neighborhood_id).single(),
      supabase.from("document_types").select("name").eq("id", invoice.customer_document_type_id).single(),
      supabase.from("types").select("name").eq("id", invoice.invoice_type_id).single(),
      supabase.from("profiles").select("account_id").eq("UID", invoice.created_by).single(),
    ]);

  let cashierName = "";
  if (profileRes.data) {
    const { data: account } = await supabase
      .from("accounts")
      .select("name, last_name")
      .eq("id", profileRes.data.account_id)
      .single();
    if (account) cashierName = [account.name, account.last_name].filter(Boolean).join(" ");
  }

  const companyName = companyParams["CompanyName"] || "EMPRESA";
  const companyAddress =
    (branchRes.data as any)?.orders?.branches?.address + " " + neighborhood?.data?.name || "";
  const companyPhone = companyParams["CompanyPhoneNumber"];
  const companyEmail = companyParams["CompanyEmail"];
  const companyRuc = companyParams["CompanyDocumentNumber"];

  const pageWidth = 80;
  const margin = 3;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = { title: 11, subtitle: 9.5, normal: 8.5, small: 8, tiny: 7.5 };

  let logoImg: { dataUrl: string; width: number; height: number } | null = null;
  try { logoImg = await loadImage(parametersRes.data?.value || "/images/logo-ticket.png"); } catch {}

  let qrCodeDataUrl: string | null = null;
  if (invoice.qr_data) {
    try { qrCodeDataUrl = await QRCode.toDataURL(invoice.qr_data, { width: 200, margin: 1 }); } catch {}
  }

  const drawContent = (doc: jsPDF): number => {
    let y = 4;

    if (logoImg) {
      const maxW = 60, maxH = 22;
      const ratio = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const w = logoImg.width * ratio, h = logoImg.height * ratio;
      const logoX = (pageWidth - maxW) / 2;
      const offsetX = (maxW - w) / 2, offsetY = (maxH - h) / 2;
      doc.addImage(logoImg.dataUrl, "PNG", logoX + offsetX, y + offsetY, w, h);
      y += offsetY + h + 5;
    } else {
      y += 2;
    }

    if (!logoImg) {
      doc.setFontSize(fontSize.title); doc.setFont("helvetica", "bold");
      for (const line of doc.splitTextToSize(companyName.toUpperCase(), contentWidth)) {
        doc.text(line, pageWidth / 2, y, { align: "center" }); y += 3.5;
      }
    }
    y += 0.5;

    doc.setFontSize(fontSize.small); doc.setFont("helvetica", "normal");
    if (companyAddress) {
      for (const line of doc.splitTextToSize(companyAddress, contentWidth)) {
        doc.text(line, pageWidth / 2, y, { align: "center" }); y += 3;
      }
    }
    if (companyPhone) { doc.text(`Teléfono: ${companyPhone}`, pageWidth / 2, y, { align: "center" }); y += 3; }
    if (companyEmail) { doc.text(`E-mail: ${companyEmail}`, pageWidth / 2, y, { align: "center" }); y += 3; }
    if (companyRuc) {
      doc.setFont("helvetica", "bold");
      doc.text(`R.U.C.: ${companyRuc}`, pageWidth / 2, y, { align: "center" });
      doc.setFont("helvetica", "normal"); y += 3.5;
    }

    y += 1.5; doc.setLineWidth(0.3); doc.line(margin, y, pageWidth - margin, y); y += 3.5;

    doc.setFontSize(fontSize.title); doc.setFont("helvetica", "bold");
    doc.text((invTypeRes.data?.name || "COMPROBANTE").toUpperCase(), pageWidth / 2, y, { align: "center" }); y += 4;
    doc.text(("PEDIDO: #" + ((branchRes.data as any)?.orders?.id || "")).toUpperCase(), pageWidth / 2, y, { align: "center" }); y += 4;

    const serieNum = [invoice.tax_serie, invoice.invoice_number].filter(Boolean).join(" - ");
    if (serieNum) {
      doc.setFontSize(fontSize.subtitle);
      doc.text(serieNum, pageWidth / 2, y, { align: "center" }); y += 4;
    }

    doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += 3;

    doc.setFontSize(fontSize.normal); doc.setFont("helvetica", "normal");
    for (const [label, value] of [
      ["FECHA DE EMISIÓN:", formatDateTime(invoice.created_at)],
      ["CLIENTE:", invoice.client_name || "Clientes Varios"],
      [`${docTypeRes.data?.name || "Doc"}:`, invoice.customer_document_number],
    ] as [string, string][]) {
      doc.setFont("helvetica", "bold"); doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      const lw = doc.getTextWidth(label) + 1;
      const vLines = doc.splitTextToSize(value, contentWidth - lw);
      for (let i = 0; i < vLines.length; i++) doc.text(vLines[i], margin + lw, y + i * 2.5);
      y += Math.max(vLines.length * 2.5, 3);
    }

    y += 1; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += 3;

    const col = { cant: margin, desc: margin + 10, pu: pageWidth - margin - 12 };
    doc.setFontSize(fontSize.small); doc.setFont("helvetica", "bold");
    doc.text("CANT.", col.cant, y); doc.text("DESCRIPCIÓN", col.desc, y);
    doc.text("P.U.", col.pu, y, { align: "right" });
    y += 2; doc.setLineWidth(0.1); doc.line(margin, y, pageWidth - margin, y); y += 2.5;

    doc.setFont("helvetica", "normal");
    for (const item of items) {
      doc.text(item.quantity % 1 === 0 ? String(item.quantity) : item.quantity.toFixed(2), col.cant, y);
      const dw = col.pu - col.desc - 14;
      const dLines = doc.splitTextToSize(item.description, dw > 0 ? dw : 30);
      for (let i = 0; i < dLines.length; i++) doc.text(dLines[i], col.desc, y + i * 2.5);
      doc.text(item.unit_price.toFixed(2), col.pu, y, { align: "right" });
      y += Math.max(dLines.length * 2.5, 3) + 0.5;
    }

    if (shippingMethodCode && shippingMethod) {
      const label = (shippingMethod as any).data?.name || shippingMethodCode;
      const dw = col.pu - col.desc - 14;
      const sLines = doc.splitTextToSize(label, dw > 0 ? dw : 30);
      for (let i = 0; i < sLines.length; i++) doc.text(sLines[i], col.desc, y + i * 2.5);
      doc.text(((branchRes.data as any).orders.shipping_cost as number).toFixed(2), col.pu, y, { align: "right" });
      y += Math.max(sLines.length * 2.5, 3) + 0.5;
    }

    for (const discount of discountOrders.data ?? []) {
      const dw = col.pu - col.desc - 14;
      const dLines = doc.splitTextToSize(discount.name, dw > 0 ? dw : 30);
      for (let i = 0; i < dLines.length; i++) doc.text(dLines[i], col.desc, y + i * 2.5);
      doc.text("-" + discount.discount_amount.toFixed(2), col.pu, y, { align: "right" });
      y += Math.max(dLines.length * 2.5, 3) + 0.5;
    }

    y += 1; doc.setLineWidth(0.2); doc.line(margin, y, pageWidth - margin, y); y += 3;

    doc.setFontSize(fontSize.normal);
    const subtotal = invoice.total_amount - (invoice.total_taxes || 0);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    for (const [label, value] of [
      ["TOTAL CANT.", totalQty % 1 === 0 ? String(totalQty) : totalQty.toFixed(2)],
      ["OP. GRAVADAS", `S/ ${subtotal.toFixed(2)}`],
      ["IGV 18%", `S/ ${(invoice.total_taxes || 0).toFixed(2)}`],
      ["IMPORTE TOTAL:", `S/ ${invoice.total_amount.toFixed(2)}`],
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
    const wLines = doc.splitTextToSize(numberToWords(invoice.total_amount), contentWidth - 8);
    for (let i = 0; i < wLines.length; i++) doc.text(wLines[i], margin + 8, y + i * 2.5);
    y += wLines.length * 2.5 + 1;

    if (cashierName) {
      doc.setFont("helvetica", "bold"); doc.text("CAJERO:", margin, y);
      doc.setFont("helvetica", "normal"); doc.text(cashierName.toUpperCase(), margin + 14, y);
      y += 4;
    }

    doc.setLineWidth(0.3); doc.line(margin, y, pageWidth - margin, y); y += 4;

    doc.setFontSize(fontSize.subtitle); doc.setFont("helvetica", "bold");
    doc.text("CAMBIOS Y DEVOLUCIONES", pageWidth / 2, y, { align: "center" }); y += 3;

    doc.setFontSize(fontSize.tiny); doc.setFont("helvetica", "normal");
    const policy = companyParams["InvoiceFooterMessage"] ||
      "Recuerda que puedes realizar cambios y devoluciones dentro de los 15 días posteriores a la compra, siempre y cuando el producto esté en su estado original y con el ticket de compra.";
    for (const line of doc.splitTextToSize(policy, contentWidth)) {
      doc.text(line, pageWidth / 2, y, { align: "center" }); y += 2.2;
    }

    y += 2; doc.setFontSize(fontSize.normal); doc.setFont("helvetica", "bold");
    doc.text("Gracias por tu confianza.", pageWidth / 2, y, { align: "center" }); y += 4;

    if (qrCodeDataUrl) {
      const qrSize = 35;
      doc.addImage(qrCodeDataUrl, "PNG", (pageWidth - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 2;
    }

    return y;
  };

  const measureDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidth, 9999] });
  const finalY = drawContent(measureDoc);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageWidth, finalY + 4] });
  drawContent(doc);

  const url = URL.createObjectURL(doc.output("blob"));
  return url;
}

export function useInvoicePrint() {
  const [printingId, setPrintingId] = useState<number | null>(null);

  const printInvoice = async (invoiceId: number) => {
    if (printingId !== null) return;
    setPrintingId(invoiceId);
    try {
      const pdfUrl = await generateInvoicePdf(invoiceId);
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
