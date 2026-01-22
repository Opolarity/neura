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
  Situation,
  Country,
  State,
  City,
  Neighborhood,
  ShippingMethod,
  ShippingCost,
  ProductForSearch,
  ProductVariation,
  ClientSearchResult,
} from '../types';

// Adapt document types from API
export const adaptDocumentTypes = (data: any[]): DocumentType[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code || null,
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
  }));
};

// Adapt situations from API
export const adaptSituations = (data: any[]): Situation[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
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
export const adaptProductVariation = (variation: any, productTitle: string): ProductVariation => {
  return {
    id: variation.id,
    sku: variation.sku || '',
    productId: variation.product_id,
    productTitle,
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
      adaptProductVariation(v, product.title)
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
    situations: adaptSituations(data.situations || []),
  };
};

// Adapt client search result from API
export const adaptClientSearchResult = (data: any): ClientSearchResult | null => {
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
