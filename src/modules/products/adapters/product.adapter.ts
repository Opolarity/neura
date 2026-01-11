import { Product, Pagination, ProductApiResponse, Variation } from "../products.types";

export const productAdapter = (response: any) => {
  // Defensive check: Try to locate the data in several possible structures
  let rawData = [];
  let totalCount = 0;

  // Sometimes the response comes wrapped in a 'products' or 'data' key
  const source = response?.products || response;

  if (source && Array.isArray(source.data)) {
    // Structure: { data: [...], page: { total: X } } OR { products: { data: [...] } }
    rawData = source.data;
    totalCount = source.page?.total ?? source.total ?? source.total_count ?? rawData.length;
  } else if (Array.isArray(source)) {
    // Structure: raw array
    rawData = source;
    totalCount = (rawData.length > 0 && rawData[0].total_count !== undefined)
      ? Number(rawData[0].total_count)
      : rawData.length;
  } else if (response && response.error) {
    throw new Error(response.error);
  } else {
    // If we still can't find it, but there's a 'data' array at the top level
    if (response && Array.isArray(response.data)) {
      rawData = response.data;
      totalCount = response.page?.total ?? response.total ?? rawData.length;
    } else {
      console.error("Respuesta de API con estructura desconocida:", response);
      throw new Error("Estructura de datos del servidor no reconocida.");
    }
  }

  const formattedProducts: Product[] = rawData.map((item: any) => {
    // Process categories: could be string or array
    let categories: string[] = [];
    if (typeof item.categories === 'string') {
      categories = item.categories.split(',').map((c: string) => c.trim()).filter(Boolean);
    } else if (Array.isArray(item.categories)) {
      categories = item.categories;
    }

    // Map variations if present
    const variations: Variation[] = (item.variations || []).map((v: any) => {
      // Logic to get price from prices array if it's in that format
      let price = v.price || v.precios || "0";
      let salePrice = v.sale_price || null;

      if (Array.isArray(v.prices) && v.prices.length > 0) {
        price = String(v.prices[0].price || v.prices[0].precio || price);
        salePrice = v.prices[0].sale_price !== undefined ? String(v.prices[0].sale_price) : salePrice;
      }

      // Logic to get stock from stock array if it's in that format
      let stock = v.stock || 0;
      if (Array.isArray(v.stock)) {
        stock = v.stock.reduce((total: number, s: any) => total + (s.stock || 0), 0);
      }

      return {
        id: v.id || v.variation_id,
        sku: v.sku,
        price: String(price),
        sale_price: salePrice ? String(salePrice) : null,
        stock: Number(stock),
        attributes: v.attributes || {}
      };
    });

    return {
      id: item.product_id || item.id,
      categories,
      estatus: item.estado ?? item.active ?? true,
      web: item.web ?? false,
      image: item.image_url || item.image || "",
      name: item.name || item.title || "",
      price: String(item.price || "0"),
      terms: item.terminos || "",
      stock: item.stock !== undefined ? Number(item.stock) : 0,
      is_variable: item.is_variable || variations.length > 0,
      variations: variations.length > 0 ? variations : undefined,
    };
  });

  const pagination: Pagination = {
    total_items: totalCount,
  };

  return { products: formattedProducts, pagination };
};
