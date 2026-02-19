// =============================================
// Sales Module Types
// =============================================

// Form Data Types
export interface SaleFormData {
  documentType: string;
  documentNumber: string;
  customerName: string;
  customerLastname: string;
  customerLastname2: string;
  email: string;
  phone: string;
  saleType: string;
  priceListId: string;
  saleDate: string;
  vendorName: string;
  shippingMethod: string;
  shippingCost: string;
  countryId: string;
  stateId: string;
  cityId: string;
  neighborhoodId: string;
  address: string;
  addressReference: string;
  receptionPerson: string;
  receptionPhone: string;
  withShipping: boolean;
  employeeSale: boolean;
  notes: string;
}

export interface SaleProduct {
  variationId: number;
  productName: string;
  variationName: string;
  sku: string;
  quantity: number;
  price: number;
  discountAmount: number; // descuento en monto (S/)
  stockTypeId: number; // tipo de inventario del que se descontará
  stockTypeName: string; // nombre del tipo de inventario
  maxStock: number; // stock disponible para este producto/almacén/tipo
}

export interface SalePayment {
  id: string; // unique identifier for the payment entry
  paymentMethodId: string;
  amount: string;
  confirmationCode: string;
  voucherUrl?: string;
  voucherFile?: File;
  voucherPreview?: string;
}

// API Response Types
export interface DocumentType {
  id: number;
  name: string;
  code: string | null;
  personType: number; // 1 = persona natural, 2 = persona jurídica
}

// Document Lookup Response (external API)
export interface DocumentLookupResponse {
  found: boolean;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  razonSocial?: string;
  error?: string;
}

export interface SaleType {
  id: number;
  name: string;
}

export interface PriceList {
  id: number;
  code: string | null;
  name: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
}

export interface Situation {
  id: number;
  name: string;
  code: string | null;
  order: number | null;
}

export interface StockType {
  id: number;
  name: string;
  code: string | null;
}

export interface Country {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
  countryId: number;
}

export interface City {
  id: number;
  name: string;
  stateId: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  cityId: number;
}

export interface ShippingMethod {
  id: number;
  name: string;
}

export interface ShippingCost {
  id: number;
  name: string;
  cost: number;
  shippingMethodId: number;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  neighborhoodId: number | null;
}

export interface ProductVariation {
  id: number;
  sku: string;
  productId: number;
  productTitle: string;
  imageUrl?: string | null;
  stock: number;
  terms: Array<{
    id: number;
    name: string;
  }>;
  prices: Array<{
    priceListId: number;
    price: number;
    salePrice: number | null;
  }>;
}

export interface ProductForSearch {
  id: number;
  title: string;
  variations: ProductVariation[];
}

// Sales Form Data Response
export interface SalesFormDataResponse {
  documentTypes: DocumentType[];
  saleTypes: SaleType[];
  priceLists: PriceList[];
  shippingMethods: ShippingMethod[];
  countries: Country[];
  states: State[];
  cities: City[];
  neighborhoods: Neighborhood[];
  products: ProductForSearch[];
  paymentMethods: PaymentMethod[];
  paymentMethodSaleTypes: { paymentMethodId: number; saleTypeId: number }[];
  situations: Situation[];
  stockTypes: StockType[];
}

// Create Order Request
export interface CreateOrderRequest {
  documentType: string;
  documentNumber: string;
  customerName: string;
  customerLastname: string;
  customerLastname2: string | null;
  email: string | null;
  phone: string | null;
  saleType: string;
  priceListId: string | null;
  shippingMethod: string | null;
  shippingCost: number | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  neighborhoodId: string | null;
  address: string | null;
  addressReference: string | null;
  receptionPerson: string | null;
  receptionPhone: string | null;
  withShipping: boolean;
  employeeSale: boolean;
  notes: string | null;
  subtotal: number;
  discount: number;
  total: number;
  isExistingClient: boolean; // true if client exists in accounts table
  products: Array<{
    variationId: number;
    quantity: number;
    price: number;
    discountAmount: number;
    stockTypeId: number;
  }>;
  payments: Array<{
    paymentMethodId: number;
    amount: number;
    date: string;
    confirmationCode: string | null;
    voucherUrl: string | null;
  }>;
  initialSituationId: number;
}

// Client Search Result
export interface ClientSearchResult {
  id: number;
  name: string;
  lastName: string;
  lastName2: string | null;
  email: string | null;
  phone: string | null;
}

// Local Note for chat-style notes (before saving)
export interface LocalNote {
  id: string;
  message: string;
  imageFile?: File;
  imagePreview?: string;
  createdAt: Date;
  userName: string;
}

// Server-side paginated product variation (from SP)
export interface PaginatedProductVariation {
  productId: number;
  productTitle: string;
  variationId: number;
  sku: string;
  imageUrl: string | null;
  stock: number;
  terms: Array<{ id: number; name: string }>;
  prices: Array<{
    price_list_id: number;
    price: number;
    sale_price: number | null;
  }>;
}

// Paginated response metadata
export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
}

export type ModuleTypeApiResponse = {
  types: {
    id: number;
  }[];
};

export interface OrdersSituationsByIdApiResponse {
  created_at: string;
  situations: {
    name: string;
  };
  statuses: {
    name: string;
  };
  profiles?: {
    account_id: number;
    accounts: {
      name: string;
      last_name: string | null;
    };
  } | null;
}

export interface OrdersSituationsById {
  situation_name: string;
  statuses_name: string;
  created_at: string;
  created_by_name: string;
}
