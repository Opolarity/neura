import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";

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
  declared: boolean;
  client_email: string | null;
  client_address: string | null;
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

  let words = "";

  const convertGroup = (n: number): string => {
    if (n === 0) return "";
    if (n === 100) return "CIEN";
    let result = "";
    if (n >= 100) {
      result += hundreds[Math.floor(n / 100)] + " ";
      n %= 100;
    }
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

  if (intPart >= 1000) {
    const thousands = Math.floor(intPart / 1000);
    if (thousands === 1) {
      words += "MIL ";
    } else {
      words += convertGroup(thousands) + " MIL ";
    }
    const remainder = intPart % 1000;
    if (remainder > 0) words += convertGroup(remainder);
  } else {
    words = convertGroup(intPart);
  }

  words = words.trim();
  words += ` Y ${decPart.toString().padStart(2, "0")}/100 SOLES`;
  return words;
}

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) generatePdf(Number(id));
  }, [id]);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const generatePdf = async (invoiceId: number) => {
    try {
      // Fetch invoice, items, and company params in parallel
      const [invoiceRes, itemsRes, paramsRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, tax_serie, invoice_number, total_amount, total_taxes, total_free, client_name, customer_document_number, customer_document_type_id, invoice_type_id, created_at, declared, client_email, client_address, created_by")
          .eq("id", invoiceId)
          .single(),
        supabase
          .from("invoice_items")
          .select("description, quantity, unit_price, discount, igv, total, measurement_unit")
          .eq("invoice_id", invoiceId),
        supabase
          .from("paremeters")
          .select("name, value, code"),
      ]);

      if (invoiceRes.error || !invoiceRes.data) {
        setError("No se encontró el comprobante");
        setLoading(false);
        return;
      }

      const invoice = invoiceRes.data as InvoiceData & { created_by: string };
      const items = (itemsRes.data || []) as InvoiceItem[];
      const params = (paramsRes.data || []) as { name: string; value: string; code: string | null }[];

      // Helper to get parameter by code
      const getParam = (code: string) => params.find((p) => p.code === code)?.value || "";

      // Fetch doc type, invoice type, profile (cashier) in parallel
      const [docTypeRes, invTypeRes, profileRes] = await Promise.all([
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
        if (account) {
          cashierName = [account.name, account.last_name].filter(Boolean).join(" ");
        }
      }

      const companyName = getParam("COMPANY_NAME") || "EMPRESA";
      const companyAddress = getParam("COMPANY_ADDRESS") || "";
      const companyPhone = getParam("COMPANY_PHONE") || "";
      const companyEmail = getParam("COMPANY_EMAIL") || "";
      const companyRuc = getParam("COMPANY_RUC") || "";

      // Ticket width: 80mm
      const pageWidth = 80;
      const margin = 3;
      const contentWidth = pageWidth - margin * 2;

      // Estimate height generously
      const estimatedHeight = 200 + items.length * 12;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pageWidth, estimatedHeight],
      });

      let y = 4;
      const fontSize = {
        title: 9,
        subtitle: 7.5,
        normal: 6.5,
        small: 6,
        tiny: 5.5,
      };

      // ============ LOGO ============
      try {
        const logoImg = await loadImage("/images/logo-ticket.png");
        const logoSize = 22;
        doc.addImage(logoImg, "PNG", (pageWidth - logoSize) / 2, y, logoSize, logoSize);
        y += logoSize + 2;
      } catch {
        y += 2;
      }

      // ============ COMPANY NAME ============
      doc.setFontSize(fontSize.title);
      doc.setFont("helvetica", "bold");
      const companyLines = doc.splitTextToSize(companyName.toUpperCase(), contentWidth);
      for (const line of companyLines) {
        doc.text(line, pageWidth / 2, y, { align: "center" });
        y += 3.5;
      }
      y += 0.5;

      // ============ COMPANY DETAILS ============
      doc.setFontSize(fontSize.small);
      doc.setFont("helvetica", "normal");

      if (companyAddress) {
        const addrLines = doc.splitTextToSize(companyAddress, contentWidth);
        for (const line of addrLines) {
          doc.text(line, pageWidth / 2, y, { align: "center" });
          y += 2.5;
        }
      }
      if (companyPhone) {
        doc.text(`Teléfono: ${companyPhone}`, pageWidth / 2, y, { align: "center" });
        y += 2.5;
      }
      if (companyEmail) {
        doc.text(`E-mail: ${companyEmail}`, pageWidth / 2, y, { align: "center" });
        y += 2.5;
      }
      if (companyRuc) {
        doc.setFont("helvetica", "bold");
        doc.text(`R.U.C.: ${companyRuc}`, pageWidth / 2, y, { align: "center" });
        doc.setFont("helvetica", "normal");
        y += 3;
      }

      // ============ SEPARATOR ============
      y += 1;
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // ============ DOCUMENT TYPE TITLE ============
      const docTypeName = invTypeRes.data?.name || "COMPROBANTE";
      doc.setFontSize(fontSize.title);
      doc.setFont("helvetica", "bold");
      doc.text(docTypeName.toUpperCase(), pageWidth / 2, y, { align: "center" });
      y += 4;

      // ============ SERIE - NUMBER ============
      const serieNum = [invoice.tax_serie, invoice.invoice_number].filter(Boolean).join(" - ");
      if (serieNum) {
        doc.setFontSize(fontSize.subtitle);
        doc.setFont("helvetica", "bold");
        doc.text(serieNum, pageWidth / 2, y, { align: "center" });
        y += 4;
      }

      // ============ SEPARATOR ============
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // ============ INVOICE DETAILS ============
      doc.setFontSize(fontSize.normal);
      doc.setFont("helvetica", "normal");

      const date = new Date(invoice.created_at);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;

      const detailLines: [string, string][] = [
        ["FECHA DE EMISIÓN:", dateStr],
        ["CLIENTE:", invoice.client_name || "Clientes Varios"],
        [`${docTypeRes.data?.name || "Doc"}:`, invoice.customer_document_number],
      ];

      for (const [label, value] of detailLines) {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        const labelWidth = doc.getTextWidth(label) + 1;
        const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth);
        for (let i = 0; i < valueLines.length; i++) {
          doc.text(valueLines[i], margin + labelWidth, y + i * 2.5);
        }
        y += Math.max(valueLines.length * 2.5, 3);
      }

      y += 1;

      // ============ SEPARATOR ============
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // ============ ITEMS TABLE HEADER ============
      doc.setFontSize(fontSize.small);
      doc.setFont("helvetica", "bold");

      const col = {
        cant: margin,
        desc: margin + 10,
        pu: pageWidth - margin - 12,
        total: pageWidth - margin,
      };

      doc.text("CANT.", col.cant, y);
      doc.text("DESCRIPCIÓN", col.desc, y);
      doc.text("P.U.", col.pu, y, { align: "right" });
      // We don't add total per item to keep it clean like Odoo

      y += 2;
      doc.setLineWidth(0.1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 2.5;

      // ============ ITEMS ============
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize.small);

      for (const item of items) {
        const qtyStr = item.quantity % 1 === 0 ? String(item.quantity) : item.quantity.toFixed(2);
        doc.text(qtyStr, col.cant, y);

        const descWidth = col.pu - col.desc - 14;
        const descLines = doc.splitTextToSize(item.description, descWidth > 0 ? descWidth : 30);
        for (let i = 0; i < descLines.length; i++) {
          doc.text(descLines[i], col.desc, y + i * 2.5);
        }

        doc.text(item.unit_price.toFixed(2), col.pu, y, { align: "right" });

        y += Math.max(descLines.length * 2.5, 3) + 0.5;
      }

      // ============ SEPARATOR ============
      y += 1;
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // ============ TOTALS ============
      doc.setFontSize(fontSize.normal);

      const subtotal = invoice.total_amount - (invoice.total_taxes || 0);
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

      const totalLines: [string, string][] = [
        ["TOTAL CANT.", totalQty % 1 === 0 ? String(totalQty) : totalQty.toFixed(2)],
        ["OP. GRAVADAS", `S/ ${subtotal.toFixed(2)}`],
        ["IGV 18%", `S/ ${(invoice.total_taxes || 0).toFixed(2)}`],
        ["IMPORTE TOTAL:", `S/ ${invoice.total_amount.toFixed(2)}`],
      ];

      for (const [label, value] of totalLines) {
        const isTotal = label === "IMPORTE TOTAL:";
        doc.setFont("helvetica", isTotal ? "bold" : "normal");
        if (isTotal) doc.setFontSize(fontSize.subtitle);
        doc.text(label, margin, y);
        doc.text(value, pageWidth - margin, y, { align: "right" });
        if (isTotal) doc.setFontSize(fontSize.normal);
        y += 3;
      }

      // Amount in words
      y += 0.5;
      doc.setFont("helvetica", "bold");
      doc.text("SON:", margin, y);
      doc.setFont("helvetica", "normal");
      const wordsText = numberToWords(invoice.total_amount);
      const wordsLines = doc.splitTextToSize(wordsText, contentWidth - 8);
      for (let i = 0; i < wordsLines.length; i++) {
        doc.text(wordsLines[i], margin + 8, y + i * 2.5);
      }
      y += wordsLines.length * 2.5 + 1;

      // Cashier
      if (cashierName) {
        doc.setFont("helvetica", "bold");
        doc.text("CAJERO:", margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(cashierName.toUpperCase(), margin + 14, y);
        y += 4;
      }

      // ============ SEPARATOR ============
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;

      // ============ FOOTER - RETURNS POLICY ============
      doc.setFontSize(fontSize.subtitle);
      doc.setFont("helvetica", "bold");
      doc.text("CAMBIOS Y DEVOLUCIONES", pageWidth / 2, y, { align: "center" });
      y += 3;

      doc.setFontSize(fontSize.tiny);
      doc.setFont("helvetica", "normal");
      const policyText =
        "Recuerda que puedes realizar cambios y devoluciones dentro de los 15 días posteriores a la compra, siempre y cuando el producto esté en su estado original y con el ticket de compra.";
      const policyLines = doc.splitTextToSize(policyText, contentWidth);
      for (const line of policyLines) {
        doc.text(line, pageWidth / 2, y, { align: "center" });
        y += 2.2;
      }

      y += 2;
      doc.setFontSize(fontSize.normal);
      doc.setFont("helvetica", "bold");
      doc.text("Gracias por tu confianza.", pageWidth / 2, y, { align: "center" });

      // Open PDF inline
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      window.location.replace(url);
    } catch (err: any) {
      setError(err.message || "Error al generar el PDF");
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Generando PDF...</span>
    </div>
  );
}
