import { Product, Pagination, ProductApiResponse } from "../products.types";

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

  const formattedProducts: Product[] = rawData.map((item: any) => ({
    id: item.product_id,
    categories: item.categories,
    estatus: item.estado,
    web: item.web,
    image: item.image_url,
    name: item.name,
    price: item.price,
    terms: item.terminos,
    stock: item.stock,
  }));

  const pagination: Pagination = {
    total_items: totalCount,
  };

  return { products: formattedProducts, pagination };
};
