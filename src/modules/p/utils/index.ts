import { ProductData } from "../types";

export const getProductPrice = (product: ProductData): string => {
  const prices: number[] = [];

  product.variations.forEach((v) =>
    v.prices.forEach((p) => {
      if (p.price != null) prices.push(p.price);
      if (p.sale_price != null) prices.push(p.sale_price);
    })
  );

  if (!prices.length) return "0.00";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return min === max ? min.toFixed(2) : `${min.toFixed(2)} - ${max.toFixed(2)}`;
};

export const getProductStock = (product: ProductData): number =>
  product.variations.reduce(
    (total, v) => total + v.stock.reduce((s, st) => s + (st.stock || 0), 0),
    0
  );

export const getProductStatus = (stock: number) => {
  if (stock === 0)
    return { text: "Sin Stock", className: "bg-red-100 text-red-800" };
  if (stock <= 10)
    return { text: "Stock Bajo", className: "bg-yellow-100 text-yellow-800" };
  return { text: "Activo", className: "bg-green-100 text-green-800" };
};
