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
  client_name: string | null;
  customer_document_number: string;
  customer_document_type_id: number;
  invoice_type_id: number;
  created_at: string;
  declared: boolean;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number | null;
  igv: number;
  total: number;
}

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) generatePdf(Number(id));
  }, [id]);

  const generatePdf = async (invoiceId: number) => {
    try {
      const [invoiceRes, itemsRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, tax_serie, invoice_number, total_amount, total_taxes, client_name, customer_document_number, customer_document_type_id, invoice_type_id, created_at, declared")
          .eq("id", invoiceId)
          .single(),
        supabase
          .from("invoice_items")
          .select("description, quantity, unit_price, discount, igv, total")
          .eq("invoice_id", invoiceId),
      ]);

      if (invoiceRes.error || !invoiceRes.data) {
        setError("No se encontró el comprobante");
        setLoading(false);
        return;
      }

      const invoice = invoiceRes.data as InvoiceData;
      const items = (itemsRes.data || []) as InvoiceItem[];

      // Get document type name
      const { data: docType } = await supabase
        .from("document_types")
        .select("name")
        .eq("id", invoice.customer_document_type_id)
        .single();

      // Get invoice type name
      const { data: invType } = await supabase
        .from("types")
        .select("name")
        .eq("id", invoice.invoice_type_id)
        .single();

      // Ticket width: 80mm
      const pageWidth = 80;
      const margin = 4;
      const contentWidth = pageWidth - margin * 2;
      
      // Estimate height
      const estimatedHeight = 120 + items.length * 20;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pageWidth, estimatedHeight],
      });

      let y = 8;
      const fontSize = {
        title: 10,
        subtitle: 8,
        normal: 7,
        small: 6,
      };

      // Title
      doc.setFontSize(fontSize.title);
      doc.setFont("helvetica", "bold");
      doc.text("COMPROBANTE", pageWidth / 2, y, { align: "center" });
      y += 5;

      // Invoice type
      if (invType?.name) {
        doc.setFontSize(fontSize.subtitle);
        doc.text(invType.name.toUpperCase(), pageWidth / 2, y, { align: "center" });
        y += 4;
      }

      // Serie and number
      const serieNum = [invoice.tax_serie, invoice.invoice_number].filter(Boolean).join(" - ");
      if (serieNum) {
        doc.setFontSize(fontSize.normal);
        doc.setFont("helvetica", "normal");
        doc.text(serieNum, pageWidth / 2, y, { align: "center" });
        y += 4;
      }

      // Separator
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // Date
      doc.setFontSize(fontSize.normal);
      doc.setFont("helvetica", "normal");
      const date = new Date(invoice.created_at);
      doc.text(`Fecha: ${date.toLocaleDateString("es-PE")} ${date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`, margin, y);
      y += 4;

      // Client info
      doc.setFont("helvetica", "bold");
      doc.text("Cliente:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.client_name || "-", margin + 14, y);
      y += 4;

      const docLabel = docType?.name || "Doc";
      doc.setFont("helvetica", "bold");
      doc.text(`${docLabel}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.customer_document_number, margin + 14, y);
      y += 4;

      // Separator
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // Items header
      doc.setFontSize(fontSize.small);
      doc.setFont("helvetica", "bold");
      doc.text("Descripción", margin, y);
      doc.text("Cant", margin + 42, y, { align: "right" });
      doc.text("P.U.", margin + 54, y, { align: "right" });
      doc.text("Total", contentWidth + margin, y, { align: "right" });
      y += 3;

      doc.setLineWidth(0.1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 2;

      // Items
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize.small);
      for (const item of items) {
        // Description (may wrap)
        const descLines = doc.splitTextToSize(item.description, 36);
        for (let i = 0; i < descLines.length; i++) {
          doc.text(descLines[i], margin, y + i * 3);
        }
        const descHeight = descLines.length * 3;
        
        doc.text(String(item.quantity), margin + 42, y, { align: "right" });
        doc.text(item.unit_price.toFixed(2), margin + 54, y, { align: "right" });
        doc.text(item.total.toFixed(2), contentWidth + margin, y, { align: "right" });
        
        y += Math.max(descHeight, 3) + 1;
      }

      // Separator
      y += 1;
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // Totals
      doc.setFontSize(fontSize.normal);
      const subtotal = invoice.total_amount - (invoice.total_taxes || 0);
      
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", margin, y);
      doc.text(`S/ ${subtotal.toFixed(2)}`, contentWidth + margin, y, { align: "right" });
      y += 4;

      doc.text("IGV (18%):", margin, y);
      doc.text(`S/ ${(invoice.total_taxes || 0).toFixed(2)}`, contentWidth + margin, y, { align: "right" });
      y += 4;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize.subtitle);
      doc.text("TOTAL:", margin, y);
      doc.text(`S/ ${invoice.total_amount.toFixed(2)}`, contentWidth + margin, y, { align: "right" });
      y += 6;

      // Footer
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;
      doc.setFontSize(fontSize.small);
      doc.setFont("helvetica", "normal");
      doc.text("Gracias por su compra", pageWidth / 2, y, { align: "center" });

      // Open PDF in new tab
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
