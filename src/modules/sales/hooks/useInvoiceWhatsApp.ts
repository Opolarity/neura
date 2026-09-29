import { useState } from "react";
import { generateInvoicePdfBlob } from "@/modules/invoices/hooks/useInvoicePrint";
import { toWhatsAppPhone } from "@/shared/utils/phone";
import { buildWhatsAppUrl } from "@/shared/utils/whatsapp";
import { toastError } from "@/shared/utils/toastError";
import { uploadInvoiceTicketPdf } from "../services";

export interface WhatsAppInvoice {
  id: number;
  declared: boolean;
  pdf_url: string | null;
  tax_serie: string | null;
  invoice_number: string | null;
  client_name: string | null;
  total_amount: number;
}

/**
 * Envía un comprobante por WhatsApp: abre WhatsApp con el teléfono de la orden
 * y un mensaje con el link al PDF, y el asesor pulsa Enviar.
 *
 * El PDF es el de NubeFact si el comprobante ya se emitió a SUNAT; si no (el
 * "Comprobante" interno, que nunca se emite) se genera el ticket que se
 * imprime y se sube al bucket público `sales`.
 */
export function useInvoiceWhatsApp() {
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<number | null>(null);

  const sendInvoiceWhatsApp = async (
    invoice: WhatsAppInvoice,
    typeName: string,
    phone: string | null | undefined,
  ) => {
    if (sendingWhatsAppId !== null) return;

    // Se abre en el mismo click, antes de cualquier await: abierta después, el
    // navegador la trata como popup y la bloquea.
    const win = window.open("", "_blank");
    setSendingWhatsAppId(invoice.id);
    try {
      const pdfUrl =
        invoice.declared && invoice.pdf_url
          ? invoice.pdf_url
          : await uploadInvoiceTicketPdf(invoice.id, await generateInvoicePdfBlob(invoice.id));

      const number = [invoice.tax_serie, invoice.invoice_number].filter(Boolean).join("-");
      const greeting = invoice.client_name ? `Hola ${invoice.client_name}` : "Hola";
      const text =
        `${greeting}, te enviamos tu ${typeName.toLowerCase()}${number ? ` ${number}` : ""}` +
        ` por S/ ${invoice.total_amount.toFixed(2)}: ${pdfUrl}`;

      const url = buildWhatsAppUrl(toWhatsAppPhone(phone), text);
      if (win) {
        win.location.href = url;
      } else {
        window.open(url, "_blank");
      }
    } catch (error) {
      win?.close();
      toastError(error, "No se pudo preparar el comprobante para WhatsApp");
    } finally {
      setSendingWhatsAppId(null);
    }
  };

  return { sendInvoiceWhatsApp, sendingWhatsAppId };
}
