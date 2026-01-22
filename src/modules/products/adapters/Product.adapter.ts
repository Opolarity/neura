import {
  Category,
  CategoriesApiResponse,
  Product,
  PaginationState,
  ProductApiResponse,
} from "../types/Products.types";

export const productAdapter = (response: ProductApiResponse) => {
  // Handle both old format (productsdata.productsdata) and new format (productsdata)
  const rawData = response.productsdata;
  const productsData = 'productsdata' in rawData ? rawData.productsdata : rawData;
  
  const formattedProducts: Product[] = (productsData?.data ?? []).map(
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

  const pagination: PaginationState = {
    p_page: productsData?.page?.p_page ?? 1,
    p_size: productsData?.page?.p_size ?? 20,
    total: productsData?.page?.total ?? 0,
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
