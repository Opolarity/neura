// =============================================
// POS Service
// Re-exports existing services and adds POS-specific functionality
// =============================================

import { supabase } from "@/integrations/supabase/client";
import type { CreatePOSOrderRequest } from "../types/POS.types";

// Re-export existing services that POS uses
export {
  fetchSalesFormData,
  fetchSaleProducts,
  fetchShippingCosts,
  searchClientByDocument,
  lookupDocument,
  fetchPriceLists,
  uploadPaymentVoucher,
  updatePaymentVoucherUrl,
  getIdInventoryTypeApi,
} from "./index";

// Re-export cash session services
export {
  openPOSSession,
  closePOSSession,
  getActivePOSSession,
} from "./POSSession.service.ts";

// Create POS order (uses existing create-order edge function)
export const createPOSOrder = async (orderData: CreatePOSOrderRequest) => {
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
      employee_sale: false,
      notes: null,
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
        date: new Date().toISOString(),
        confirmation_code: p.confirmationCode,
        voucher_url: null,
      })),
      initial_situation_id: orderData.initialSituationId,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};
