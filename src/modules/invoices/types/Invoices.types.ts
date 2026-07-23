export interface InvoiceApiResponse { }
export interface InvoiceFilters {
  p_page?: number;
  p_size?: number;
  search?: string | null;
  order?: string | null;
  declared?: boolean | null;
  min_mount?: number | null;
  max_mount?: number | null;
  type?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface InvoicesResponse {
  invoicesData: {
    data: {
      id: number;
      declared: boolean;
      order_id: number | null;
      tax_serie: string | null;
      created_at: string;
      client_name: string;
      total_amount: number;
      invoice_number: string | null;
      invoice_type_id: number;
      invoice_type_name: string;
      customer_document_number: string;
    }[];
    page: {
      page: number;
      size: number;
      total: number;
    };
  };
}

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
  order_id?: number;
  movement_id?: number;
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


export interface UpdateInvoicePayload {
  id: number;
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
  order_id?: number;
  movement_id?: number;
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
  orderId?: string;
  movementId?: string;
}

export interface InvoiceItem {
  id: number;
  declared: boolean;
  orderId: number | null;
  taxSerie: string | null;
  createdAt: string;
  clientName: string;
  totalAmount: number;
  invoiceNumber: string | null;
  invoiceTypeId: number;
  invoiceTypeName: string;
  customerDocumentNumber: string;
}

export interface InvoicesAdapted {
  data: InvoiceItem[];
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface InvoiceProvider {
  id: number;
  description: string | null;
}

export interface InvoiceSerie {
  id: number;
  invoice_type_id: number;
  serie: string | null;
  next_number: number;
  invoice_provider_id: number;
}

export interface DocumentType {
  id: number;
  name: string;
  code: string;
  personType: number;
}

export interface InvoiceType {
  id: number;
  name: string;
}
