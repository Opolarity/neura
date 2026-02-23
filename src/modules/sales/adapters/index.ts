// =============================================
// Sales Module Adapters
// snake_case (API) -> camelCase (Frontend)
// =============================================

import type {
  SalesFormDataResponse,
  DocumentType,
  SaleType,
  PriceList,
  PaymentMethod,
  BusinessAccountOption,
  Situation,
  StockType,
  Country,
  State,
  City,
  Neighborhood,
  ShippingMethod,
  ShippingCost,
  ProductForSearch,
  ProductVariation,
  ClientSearchResult,
  ModuleTypeApiResponse,
  OrdersSituationsByIdApiResponse,
  OrdersSituationsById,
} from "../types";

// Adapt document types from API
export const adaptDocumentTypes = (data: any[]): DocumentType[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code || null,
    personType: item.person_type || 1, // default: persona natural
  }));
};

// Adapt sale types from API
export const adaptSaleTypes = (data: any[]): SaleType[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
  }));
};

// Adapt price lists from API
export const adaptPriceLists = (data: any[]): PriceList[] => {
  return data.map((item) => ({
    id: item.id,
    code: item.code || null,
    name: item.name,
  }));
};

// Adapt payment methods from API
export const adaptPaymentMethods = (data: any[]): PaymentMethod[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    businessAccountId: item.business_account_id ?? null,
  }));
};

// Adapt situations from API
export const adaptSituations = (data: any[]): Situation[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code || null,
    order: item.order ?? null,
  }));
};

// Adapt stock types from API
export const adaptStockTypes = (data: any[]): StockType[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code || null,
  }));
};

// Adapt countries from API
export const adaptCountries = (data: any[]): Country[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
  }));
};

// Adapt states from API
export const adaptStates = (data: any[]): State[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    countryId: item.country_id,
  }));
};

// Adapt cities from API
export const adaptCities = (data: any[]): City[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    stateId: item.state_id,
  }));
};

// Adapt neighborhoods from API
export const adaptNeighborhoods = (data: any[]): Neighborhood[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    cityId: item.city_id,
  }));
};

// Adapt shipping methods from API
export const adaptShippingMethods = (data: any[]): ShippingMethod[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
  }));
};

// Adapt shipping costs from API
export const adaptShippingCosts = (data: any[]): ShippingCost[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name || `Envío #${item.id}`,
    cost: item.cost,
    shippingMethodId: item.shipping_method_id,
    countryId: item.country_id,
    stateId: item.state_id,
    cityId: item.city_id,
    neighborhoodId: item.neighborhood_id,
  }));
};

// Adapt product variation from API
export const adaptProductVariation = (
  variation: any,
  productTitle: string,
): ProductVariation => {
  return {
    id: variation.id,
    sku: variation.sku || "",
    productId: variation.product_id,
    productTitle,
    imageUrl: variation.imageUrl || variation.image_url || null,
    stock: variation.stock || 0,
    terms: (variation.terms || []).map((t: any) => ({
      id: t.terms?.id || t.id,
      name: t.terms?.name || t.name,
    })),
    prices: (variation.prices || []).map((p: any) => ({
      priceListId: p.price_list_id,
      price: p.price,
      salePrice: p.sale_price,
    })),
  };
};

// Adapt products from API
export const adaptProducts = (data: any[]): ProductForSearch[] => {
  return data.map((product) => ({
    id: product.id,
    title: product.title,
    variations: (product.variations || []).map((v: any) =>
      adaptProductVariation(v, product.title),
    ),
  }));
};

// Adapt full sales form data response
export const adaptSalesFormData = (data: any): SalesFormDataResponse => {
  return {
    documentTypes: adaptDocumentTypes(data.documentTypes || []),
    saleTypes: adaptSaleTypes(data.saleTypes || []),
    priceLists: adaptPriceLists(data.priceLists || []),
    shippingMethods: adaptShippingMethods(data.shippingMethods || []),
    countries: adaptCountries(data.countries || []),
    states: adaptStates(data.states || []),
    cities: adaptCities(data.cities || []),
    neighborhoods: adaptNeighborhoods(data.neighborhoods || []),
    products: adaptProducts(data.products || []),
    paymentMethods: adaptPaymentMethods(data.paymentMethods || []),
    paymentMethodSaleTypes: (data.paymentMethodSaleTypes || []).map((item: any) => ({
      paymentMethodId: item.payment_method_id,
      saleTypeId: item.sale_type_id,
    })),
    situations: adaptSituations(data.situations || []),
    stockTypes: adaptStockTypes(data.stockTypes || []),
  };
};

// Adapt client search result from API
export const adaptClientSearchResult = (
  data: any,
): ClientSearchResult | null => {
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    lastName: data.last_name,
    lastName2: data.last_name2 || null,
    email: data.email || null,
    phone: data.phone || null,
  };
};

export const getIdInventoryTypeAdapter = (
  response: ModuleTypeApiResponse,
): number => {
  return response.types[0].id;
};

export const getOrdersSituationsByIdAdapter = (
  response: OrdersSituationsByIdApiResponse[],
): OrdersSituationsById[] => {
  return response.map((item) => {
    const profile = item.profiles;
    const userName = profile?.accounts
      ? [profile.accounts.name, profile.accounts.last_name].filter(Boolean).join(" ")
      : "";
    return {
      situation_name: item.situations.name,
      statuses_name: item.statuses.name,
      created_at: item.created_at,
      created_by_name: userName,
    };
  });
};

// Adapt sale by ID response for CreateSale form
export const adaptSaleById = (data: any) => ({
  formData: {
    documentType: data.order.document_type?.toString() || "",
    documentNumber: data.order.document_number || "",
    customerName: data.order.customer_name || "",
    customerLastname: (() => {
      const full = data.order.customer_lastname || "";
      return full.split(" ")[0] || "";
    })(),
    customerLastname2: (() => {
      const full = data.order.customer_lastname || "";
      const parts = full.split(" ");
      return parts.slice(1).join(" ") || "";
    })(),
    email: data.order.email || "",
    phone: data.order.phone?.toString() || "",
    saleType: data.order.sale_type_id?.toString() || "",
    priceListId: data.order.price_list_id?.toString() || "",
    saleDate: data.order.date?.split("T")[0] || "",
    vendorName: "",
    shippingMethod: data.order.shipping_method_code || "",
    shippingCost: data.order.shipping_cost?.toString() || "",
    countryId: data.order.country_id?.toString() || "",
    stateId: data.order.state_id?.toString() || "",
    cityId: data.order.city_id?.toString() || "",
    neighborhoodId: data.order.neighborhood_id?.toString() || "",
    address: data.order.address || "",
    addressReference: data.order.address_reference || "",
    receptionPerson: data.order.reception_person || "",
    receptionPhone: data.order.reception_phone?.toString() || "",
    withShipping: data.order.shipping_cost != null,
    employeeSale: false,
    notes: "",
  },
  products: (data.products || []).map((p: any) => ({
    variationId: p.variation_id,
    productName: p.product_name,
    variationName: p.variation_name,
    sku: p.sku,
    quantity: p.quantity,
    price: p.price,
    discountAmount: p.discount_amount,
    stockTypeId: p.stock_type_id,
    stockTypeName: p.stock_type_name,
    maxStock: p.max_stock,
  })),
  payments: (data.payments || []).map((p: any) => ({
    id: crypto.randomUUID(),
    paymentMethodId: p.payment_method_id?.toString() || "",
    amount: p.amount?.toString() || "",
    confirmationCode: p.confirmation_code || "",
    voucherUrl: p.voucher_url || "",
    voucherPreview: p.voucher_url || undefined,
    businessAccountId: p.business_account_id?.toString() || "",
  })),
  currentSituation: data.current_situation?.situation_id?.toString() || "",
  currentStatusCode: data.current_situation?.statuses?.code || "",
});
