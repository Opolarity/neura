import { 
  CategoriesApiResponse, 
  CategoriesListResult, 
  Category,
  CategoriesPagination 
} from '../types/Categories.type';

/**
 * Adapts the API response from the stored procedure to the UI format.
 * Converts Spanish field names to camelCase English.
 */
export const adaptCategoriesList = (response: CategoriesApiResponse): CategoriesListResult => {
  const categories: Category[] = response.data.map((item) => ({
    id: item.id_category,
    imageUrl: item.imagen,
    name: item.nombre,
    parentCategory: item.categoria_padre,
    description: item.descripcion,
    productCount: item.productos,
  }));

  const pagination: CategoriesPagination = {
    page: response.page.page,
    size: response.page.size,
    total: response.page.total,
  };

  return {
    categories,
    pagination,
  };
};
