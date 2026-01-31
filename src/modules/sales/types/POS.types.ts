// =============================================
// POS Module Types
// =============================================

import { Type } from "@/types";

// Wizard step type
export type POSStep = 1 | 2 | 3 | 4 | 5;

export const POS_STEPS = {
  CONFIGURATION: 1 as POSStep,
  PRODUCTS: 2 as POSStep,
  CUSTOMER_DATA: 3 as POSStep,
  SHIPPING: 4 as POSStep,
  PAYMENT: 5 as POSStep,
};

export const POS_STEP_NAMES: Record<POSStep, string> = {
  1: "Configuracion",
  2: "Productos",
  3: "Datos Cliente",
  4: "Envio",
  5: "Pago",
};

// =============================================
// Cash Session Types
// =============================================

export interface POSSession {
  id: number;
  userId: string;
  warehouseId: number;
  branchId: number;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status_id: number;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
}

export interface POSSessionApiResponse {
  // API returns "id" from get-active query, "session_id" from RPC
  id?: number;
  session_id?: number;
  user_id: string;
  warehouse_id: number;
  branch_id: number;
  opening_amount: number;
  closing_amount?: number | null;
  expected_amount?: number | null;
  sales_total?: number;
  difference?: number | null;
  status_id: number;
  opened_at: string;
  closed_at?: string | null;
  notes?: string | null;
  status?: Type;
}

export interface OpenPOSSessionRequest {
  openingAmount: number;
  businessAccountId: number;
  notes?: string;
}

export interface CashRegister {
  id: number;
  name: string;
}

export interface ClosePOSSessionRequest {
  sessionId: number;
  closingAmount: number;
  notes?: string;
}

// =============================================
// POS Configuration (Step 1)
// =============================================

export interface POSConfiguration {
  priceListId: string;
  warehouseId: number;
  warehouseName: string;
}

// =============================================
// POS Cart Item (Step 2)
// =============================================

export interface POSCartItem {
  variationId: number;
  productName: string;
  variationName: string;
  sku: string;
  quantity: number;
  price: number;
  discountAmount: number;
  stockTypeId: number;
  stockTypeName: string;
  maxStock: number;
  imageUrl: string | null;
}

// =============================================
// Customer Data (Step 3)
// =============================================

export interface POSCustomerData {
  documentTypeId: string;
  documentNumber: string;
  customerName: string;
  customerLastname: string;
  customerLastname2: string;
  email: string;
  phone: string;
  requiresShipping: boolean;
  isExistingClient: boolean;
}

export const INITIAL_CUSTOMER_DATA: POSCustomerData = {
  documentTypeId: "",
  documentNumber: "",
  customerName: "",
  customerLastname: "",
  customerLastname2: "",
  email: "",
  phone: "",
  requiresShipping: false,
  isExistingClient: false,
};

// =============================================
// Shipping Data (Step 4)
// =============================================

export interface POSShippingData {
  countryId: string;
  stateId: string;
  cityId: string;
  neighborhoodId: string;
  address: string;
  addressReference: string;
  receptionPerson: string;
  receptionPhone: string;
  shippingMethodId: string;
  shippingCost: number;
}

export const INITIAL_SHIPPING_DATA: POSShippingData = {
  countryId: "",
  stateId: "",
  cityId: "",
  neighborhoodId: "",
  address: "",
  addressReference: "",
  receptionPerson: "",
  receptionPhone: "",
  shippingMethodId: "",
  shippingCost: 0,
};

// =============================================
// Payment (Step 5)
// =============================================

export interface POSPayment {
  id: string;
  paymentMethodId: string;
  paymentMethodName?: string;
  amount: number;
  confirmationCode: string;
}

// =============================================
// POS Order Request
// =============================================

export interface CreatePOSOrderRequest {
  // Configuration
  priceListId: string;

  // Customer
  documentType: string;
  documentNumber: string;
  customerName: string;
  customerLastname: string;
  customerLastname2: string | null;
  email: string | null;
  phone: string | null;
  isExistingClient: boolean;

  // Shipping (optional)
  withShipping: boolean;
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

  // Products
  products: Array<{
    variationId: number;
    quantity: number;
    price: number;
    discountAmount: number;
    stockTypeId: number;
  }>;

  // Payments
  payments: Array<{
    paymentMethodId: number;
    amount: number;
    confirmationCode: string | null;
  }>;

  // Totals
  subtotal: number;
  discount: number;
  total: number;

  // POS specific
  initialSituationId: number;
  saleType: string;
}

// =============================================
// Complete POS State
// =============================================

export interface POSState {
  currentStep: POSStep;
  configuration: POSConfiguration | null;
  cart: POSCartItem[];
  customer: POSCustomerData;
  shipping: POSShippingData;
  payments: POSPayment[];
  cashSession: POSSession | null;
}
