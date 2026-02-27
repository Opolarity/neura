import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface InvoiceData {
  id: number;
  tax_serie: string | null;
  invoice_number: string | null;
  client_name: string | null;
  customer_document_number: string;
  total_amount: number;
  total_taxes: number | null;
  created_at: string;
  invoice_type_id: number;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number | null;
  igv: number;
  total: number;
}

export const InvoiceTicketPrint = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [typeName, setTypeName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData(Number(id));
  }, [id]);

  useEffect(() => {
    if (!loading && invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [loading, invoice]);

  const fetchData = async (invoiceId: number) => {
    setLoading(true);
    try {
      const [invoiceRes, itemsRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, tax_serie, invoice_number, client_name, customer_document_number, total_amount, total_taxes, created_at, invoice_type_id")
          .eq("id", invoiceId)
          .single(),
        supabase
          .from("invoice_items")
          .select("id, description, quantity, unit_price, discount, igv, total")
          .eq("invoice_id", invoiceId),
      ]);

      if (invoiceRes.data) {
        setInvoice(invoiceRes.data);
        const { data: typeData } = await supabase
          .from("types")
          .select("name")
          .eq("id", invoiceRes.data.invoice_type_id)
          .single();
        setTypeName(typeData?.name || "Comprobante");
      }
      if (itemsRes.data) setItems(itemsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px", fontFamily: "monospace" }}>
        Cargando...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ textAlign: "center", padding: "20px", fontFamily: "monospace" }}>
        Comprobante no encontrado
      </div>
    );
  }

  const subtotal = invoice.total_amount - (invoice.total_taxes || 0);

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        body {
          background: #f5f5f5;
        }
        .ticket {
          width: 76mm;
          max-width: 76mm;
          margin: 0 auto;
          padding: 4mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }
        .ticket-header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .ticket-header h2 {
          font-size: 14px;
          margin: 0 0 2px;
          font-weight: bold;
        }
        .ticket-header p {
          margin: 0;
          font-size: 10px;
        }
        .ticket-info {
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .ticket-info p {
          margin: 1px 0;
          font-size: 10px;
        }
        .ticket-items {
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .ticket-item {
          margin-bottom: 4px;
        }
        .ticket-item-name {
          font-size: 10px;
          word-wrap: break-word;
        }
        .ticket-item-detail {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
        }
        .ticket-totals {
          margin-bottom: 6px;
        }
        .ticket-totals .row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .ticket-totals .row.total {
          font-weight: bold;
          font-size: 13px;
          border-top: 1px dashed #000;
          padding-top: 4px;
          margin-top: 4px;
        }
        .ticket-footer {
          text-align: center;
          font-size: 10px;
          margin-top: 8px;
        }
      `}</style>

      <div className="ticket">
        <div className="ticket-header">
          <h2>{typeName}</h2>
          {invoice.tax_serie && <p>{invoice.tax_serie}{invoice.invoice_number ? ` - ${invoice.invoice_number}` : ""}</p>}
        </div>

        <div className="ticket-info">
          <p><strong>Fecha:</strong> {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm")}</p>
          <p><strong>Cliente:</strong> {invoice.client_name || "-"}</p>
          <p><strong>Doc:</strong> {invoice.customer_document_number}</p>
        </div>

        <div className="ticket-items">
          {items.map((item) => (
            <div key={item.id} className="ticket-item">
              <div className="ticket-item-name">{item.description}</div>
              <div className="ticket-item-detail">
                <span>{item.quantity} x S/{item.unit_price.toFixed(2)}</span>
                <span>S/{item.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ticket-totals">
          <div className="row">
            <span>Subtotal:</span>
            <span>S/{subtotal.toFixed(2)}</span>
          </div>
          <div className="row">
            <span>IGV (18%):</span>
            <span>S/{(invoice.total_taxes || 0).toFixed(2)}</span>
          </div>
          <div className="row total">
            <span>TOTAL:</span>
            <span>S/{invoice.total_amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="ticket-footer">
          <p>Gracias por su compra</p>
        </div>
      </div>
    </>
  );
};
