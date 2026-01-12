import { CategoriesList } from "../types/Categories.type";

export const categoriesListAdapter = (responde: CategoriesList): CategoriesList {

}

export const productAdapter = (response: ProductApiResponse) => {
  const formattedProducts: Product[] = response.products.data.map((item) => ({
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
    total_items: response.products.page.total,
  };

  return { products: formattedProducts, pagination };
};
