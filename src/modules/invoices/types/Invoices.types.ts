export interface InvoiceApiResponse {}
export interface InvoiceFilters {}

export interface InvoiceItemForm {
  id: string;
  description: string;
  quantity: number;
  measurementUnit: string;
  unitPrice: number;
  discount: number;
  igv: number;
  total: number;
}

export interface CreateInvoicePayload {
  invoice_type_id: number;
  serie: string;
  account_id: number;
  total_amount: number;
  items: {
    description: string;
    quantity: number;
    measurement_unit: string;
    unit_price: number;
    discount: number;
    igv: number;
    total: number;
  }[];
}

export interface InvoiceFormData {
  invoiceTypeId: string;
  serie: string;
  accountId: string;
  clientName: string;
  clientDocument: string;
}
