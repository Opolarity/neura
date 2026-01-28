// =============================================
// Sales Module Utilities
// =============================================

import type { SaleProduct, ShippingCost } from '../types';

// Re-export shared utilities for backwards compatibility
export { formatCurrency, getTodayDate, formatDateDisplay } from '@/shared/utils/utils';

// Calculate subtotal from products
export const calculateSubtotal = (products: SaleProduct[]): number => {
  return products.reduce((sum, p) => sum + p.quantity * p.price, 0);
};

// Calculate total discount amount from products (amount-based per unit)
export const calculateDiscountAmount = (products: SaleProduct[]): number => {
  return products.reduce((sum, p) => {
    return sum + (p.discountAmount * p.quantity);
  }, 0);
};

// Calculate total including shipping
export const calculateTotal = (
  products: SaleProduct[],
  shippingCost: number = 0
): number => {
  const subtotal = calculateSubtotal(products);
  const discount = calculateDiscountAmount(products);
  return subtotal - discount + shippingCost;
};

// Calculate line subtotal for a single product (discount is per unit amount)
export const calculateLineSubtotal = (product: SaleProduct): number => {
  const priceAfterDiscount = product.price - product.discountAmount;
  return product.quantity * priceAfterDiscount;
};

// Filter shipping costs by location hierarchy
export const filterShippingCostsByLocation = (
  shippingCosts: ShippingCost[],
  countryId: number | null,
  stateId: number | null,
  cityId: number | null,
  neighborhoodId: number | null
): ShippingCost[] => {
  return shippingCosts.filter((cost) => {
    // Match by neighborhood (most specific)
    if (cost.neighborhoodId) {
      return (
        cost.neighborhoodId === neighborhoodId &&
        cost.cityId === cityId &&
        cost.stateId === stateId &&
        cost.countryId === countryId
      );
    }
    // Match by city (no neighborhood specified in shipping cost)
    if (cost.cityId) {
      return (
        cost.cityId === cityId &&
        cost.stateId === stateId &&
        cost.countryId === countryId
      );
    }
    // Match by state (no city or neighborhood specified)
    if (cost.stateId) {
      return cost.stateId === stateId && cost.countryId === countryId;
    }
    // Match by country only
    if (cost.countryId) {
      return cost.countryId === countryId;
    }
    // Global shipping (no location specified)
    return false;
  });
};
