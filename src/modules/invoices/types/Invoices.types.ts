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
  tax_serie?: string;
  customer_document_type_id: number;
  customer_document_number: string;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  total_amount: number;
  total_taxes?: number;
  total_free?: number;
  total_others?: number;
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
  invoiceProviderId: string;
  invoiceSerieId: string;
  taxSerie: string;
  documentTypeId: string;
  clientDocument: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
}

export interface InvoiceProvider {
  id: number;
  description: string | null;
}

export interface InvoiceSerie {
  id: number;
  fac_serie: string;
  bol_serie: string;
  ncf_serie: string;
  ncb_serie: string;
  ndb_serie: string;
  ndf_serie: string;
  grr_serie: string;
  grt_serie: string;
  next_number: number;
}

export interface DocumentType {
  id: number;
  name: string;
  code: string;
  personType: number;
}
