// =============================================
// Sales Module Services
// API calls to Supabase Edge Functions
// =============================================

import { supabase } from "@/integrations/supabase/client";
import type { CreateOrderRequest, ModuleTypeApiResponse } from "../types";

// Fetch sales form data (dropdowns, products, etc.)
export const fetchSalesFormData = async () => {
  const { data, error } = await supabase.functions.invoke(
    "get-sales-form-data",
  );
  if (error) throw error;
  return data;
};

// Fetch shipping costs from database
export const fetchShippingCosts = async () => {
  const { data, error } = await supabase.from("shipping_costs").select("*");
  if (error) throw error;
  return data;
};

// Search client by document type and number
export const searchClientByDocument = async (
  documentTypeId: number,
  documentNumber: string,
) => {
  const { data, error } = await (supabase as any)
    .from("accounts")
    .select("*")
    .eq("document_type_id", documentTypeId)
    .eq("document_number", documentNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Create new order
export const createOrder = async (orderData: CreateOrderRequest) => {
  const { data, error } = await supabase.functions.invoke("create-order", {
    body: {
      document_type: orderData.documentType,
      document_number: orderData.documentNumber,
      customer_name: orderData.customerName,
      customer_lastname: orderData.customerLastname,
      customer_lastname2: orderData.customerLastname2,
      email: orderData.email,
      phone: orderData.phone,
      sale_type: orderData.saleType,
      price_list_id: orderData.priceListId,
      shipping_method: orderData.shippingMethod,
      shipping_cost: orderData.shippingCost,
      country_id: orderData.countryId,
      state_id: orderData.stateId,
      city_id: orderData.cityId,
      neighborhood_id: orderData.neighborhoodId,
      address: orderData.address,
      address_reference: orderData.addressReference,
      reception_person: orderData.receptionPerson,
      reception_phone: orderData.receptionPhone,
      with_shipping: orderData.withShipping,
      employee_sale: orderData.employeeSale,
      notes: orderData.notes,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.total,
      is_existing_client: orderData.isExistingClient,
      products: orderData.products.map((p) => ({
        variation_id: p.variationId,
        quantity: p.quantity,
        price: p.price,
        discount_amount: p.discountAmount,
        stock_type_id: p.stockTypeId,
      })),
      payments: orderData.payments.map((p) => ({
        payment_method_id: p.paymentMethodId,
        amount: p.amount,
        date: p.date,
        confirmation_code: p.confirmationCode,
        voucher_url: p.voucherUrl,
      })),
      initial_situation_id: orderData.initialSituationId,
    },
  });
  if (error) throw error;
  return data;
};

// Update existing order
export const updateOrder = async (
  orderId: number,
  orderData: CreateOrderRequest,
) => {
  const { data, error } = await supabase.functions.invoke("update-order", {
    body: {
      orderId,
      document_type: orderData.documentType,
      document_number: orderData.documentNumber,
      customer_name: orderData.customerName,
      customer_lastname: orderData.customerLastname,
      customer_lastname2: orderData.customerLastname2,
      email: orderData.email,
      phone: orderData.phone,
      sale_type: orderData.saleType,
      price_list_id: orderData.priceListId,
      shipping_method: orderData.shippingMethod,
      shipping_cost: orderData.shippingCost,
      country_id: orderData.countryId,
      state_id: orderData.stateId,
      city_id: orderData.cityId,
      neighborhood_id: orderData.neighborhoodId,
      address: orderData.address,
      address_reference: orderData.addressReference,
      reception_person: orderData.receptionPerson,
      reception_phone: orderData.receptionPhone,
      with_shipping: orderData.withShipping,
      employee_sale: orderData.employeeSale,
      notes: orderData.notes,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      total: orderData.total,
      products: orderData.products.map((p) => ({
        variation_id: p.variationId,
        quantity: p.quantity,
        price: p.price,
        discount_amount: p.discountAmount,
        stock_type_id: p.stockTypeId,
      })),
      payments: orderData.payments.map((p) => ({
        payment_method_id: p.paymentMethodId,
        amount: p.amount,
        date: p.date,
        confirmation_code: p.confirmationCode,
        voucher_url: p.voucherUrl,
      })),
    },
  });
  if (error) throw error;
  return data;
};

// Update order situation
export const updateOrderSituation = async (
  orderId: number,
  situationId: number,
) => {
  const { data, error } = await supabase.functions.invoke(
    "update-order-situation",
    {
      body: { orderId, situationId },
    },
  );
  if (error) throw error;
  return data;
};

// Fetch order by ID (for editing)
export const fetchOrderById = async (orderId: number) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_products(*)")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data;
};

// Fetch order payment
export const fetchOrderPayment = async (orderId: number) => {
  const { data, error } = await supabase
    .from("order_payment")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Fetch order situation
export const fetchOrderSituation = async (orderId: number) => {
  const { data, error } = await supabase
    .from("order_situations")
    .select("situation_id")
    .eq("order_id", orderId)
    .eq("last_row", true)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Fetch variations by IDs
export const fetchVariationsByIds = async (variationIds: number[]) => {
  const { data, error } = await supabase
    .from("variations")
    .select("id, sku, product_id")
    .in("id", variationIds);
  if (error) throw error;
  return data;
};

// Fetch products by IDs
export const fetchProductsByIds = async (productIds: number[]) => {
  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .in("id", productIds.length ? productIds : [-1]);
  if (error) throw error;
  return data;
};

// Fetch variation terms by variation IDs
export const fetchVariationTerms = async (variationIds: number[]) => {
  const { data, error } = await supabase
    .from("variation_terms")
    .select("product_variation_id, term_id")
    .in("product_variation_id", variationIds);
  if (error) throw error;
  return data;
};

// Fetch terms by IDs
export const fetchTermsByIds = async (termIds: number[]) => {
  const { data, error } = await supabase
    .from("terms")
    .select("id, name")
    .in("id", termIds.length ? termIds : [-1]);
  if (error) throw error;
  return data;
};

// Fetch price lists
export const fetchPriceLists = async () => {
  const { data, error } = await supabase
    .from("price_list")
    .select("id, code, name")
    .order("name");
  if (error) throw error;
  return data;
};

// Upload payment voucher to storage
export const uploadPaymentVoucher = async (
  orderId: number,
  orderPaymentId: number,
  file: File,
): Promise<string> => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${orderPaymentId}-${orderId}.${fileExt}`;
  const filePath = `sale-vouchers/${orderId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("sales")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("sales").getPublicUrl(filePath);

  return publicUrl;
};

// Update voucher_url in order_payment
export const updatePaymentVoucherUrl = async (
  orderPaymentId: number,
  voucherUrl: string,
): Promise<void> => {
  const { error } = await supabase
    .from("order_payment")
    .update({ voucher_url: voucherUrl })
    .eq("id", orderPaymentId);

  if (error) throw error;
};

// Lookup document in external API (DNI/RUC)
export const lookupDocument = async (
  documentType: string,
  documentNumber: string,
) => {
  const { data, error } = await supabase.functions.invoke("document-lookup", {
    body: { documentType, documentNumber },
  });
  if (error) throw error;
  return data;
};

// Fetch sale products with server-side pagination
export interface FetchSaleProductsParams {
  page?: number;
  size?: number;
  search?: string;
  stockTypeId?: number;
  warehouseId?: number;
}

export interface SaleProductsResponse {
  data: Array<{
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
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export const fetchSaleProducts = async (
  params: FetchSaleProductsParams,
): Promise<SaleProductsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("p_page", String(params.page));
  if (params.size) queryParams.set("p_size", String(params.size));
  if (params.search) queryParams.set("p_search", params.search);
  if (params.stockTypeId)
    queryParams.set("p_stock_type_id", String(params.stockTypeId));
  if (params.warehouseId)
    queryParams.set("p_warehouse_id", String(params.warehouseId));

  const endpoint = queryParams.toString()
    ? `get-sale-products?${queryParams.toString()}`
    : "get-sale-products";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;
  return data;
};

// Upload note image to storage
export const uploadNoteImage = async (
  orderId: number,
  noteId: number,
  file: File,
): Promise<string> => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${noteId}-${orderId}.${fileExt}`;
  const filePath = `sales-notes/${orderId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("sales")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("sales").getPublicUrl(filePath);

  return publicUrl;
};

export const getIdInventoryTypeApi =
  async (): Promise<ModuleTypeApiResponse> => {
    const { data, error } = await supabase
      .from("modules")
      .select(`types!inner(id)`)
      .eq("code", "STK")
      .eq("types.code", "PRD")
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned from getIdInventoryTypeApi");

    return data;
  };

export const getOrdersSituationsById = async (id: number) => {
  const { data, error } = await supabase
    .from("order_situations")
    .select(
      `
    created_at,
    situations (
      name
    ),
    statuses (
      name
    )
  `,
    )
    .eq("order_id", id)
    .order("created_at");

  //# | Situación | Estado | Fecha
  //n# | situation_name | status_name | created_at

  if (error) throw error;
  if (!data) throw new Error("No data returned from getOrdersSituationsById");

  return data;
};

// Fetch sale by ID (consolidated data for editing)
export const fetchSaleById = async (orderId: number) => {
  const { data, error } = await supabase.functions.invoke(
    `get-sale-by-id?id=${orderId}`
  );
  if (error) throw error;
  return data;
};
