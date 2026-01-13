import {
  Category,
  CategoriesApiResponse,
  Product,
  Pagination,
  ProductApiResponse,
} from "../types/Products.types";

export const productAdapter = (response: ProductApiResponse) => {
  const formattedProducts: Product[] = response.productsdata.data.map(
    (item) => ({
      id: item.product_id,
      categories: item.categories,
      estatus: item.estado,
      web: item.web,
      image: item.image_url,
      name: item.name,
      price: item.price,
      terms: item.terminos,
      stock: item.stock,
    })
  );

  const pagination: Pagination = {
    total_items: response.productsdata.page.total,
  };

  return { products: formattedProducts, pagination };
};

export const categoryAdapter = (response: CategoriesApiResponse) => {
  const formattedCategories: Category[] = response.map((item) => ({
    id: item.id,
    name: item.name,
  }));

  return formattedCategories;
};
