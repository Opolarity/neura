import { Product, Pagination, ProductApiResponse } from "../products.types";

export const productAdapter = (response: ProductApiResponse) => {
  if (!response || !response.data) {
    console.error("Respuesta de API inválida:", response);
    throw new Error("La respuesta del servidor no contiene datos de productos.");
  }

  const formattedProducts: Product[] = response.data.map((item) => ({
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
    total_items: response.page?.total || 0,
  };

  return { products: formattedProducts, pagination };
};
