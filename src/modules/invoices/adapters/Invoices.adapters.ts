import { InvoicesAdapted, InvoicesResponse, InvoiceType } from "../types/Invoices.types";

export const invoicesAdapter = (response: InvoicesResponse): InvoicesAdapted => {
  return {
    data: response.invoicesData.data.map((item) => ({
      id: item.id,
      declared: item.declared,
      orderId: item.order_id,
      taxSerie: item.tax_serie,
      createdAt: item.created_at,
      clientName: item.client_name,
      totalAmount: item.total_amount,
      invoiceNumber: item.invoice_number,
      invoiceTypeId: item.invoice_type_id,
      invoiceTypeName: item.invoice_type_name,
      customerDocumentNumber: item.customer_document_number,
      pdfUrl: item.pdf_url ?? null,
      xmlUrl: item.xml_url ?? null,
    })),
    page: response.invoicesData.page,
  };
};

export const invoiceTypesAdapter = (
  response: { id: number; name: string; code?: string | null }[]
): InvoiceType[] => {
  return response.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code ?? null,
  }));
};
