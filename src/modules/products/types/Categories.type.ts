export interface CategoriesList {
  id: number;
  name: string;
  description: string;
  image_url: string;
  parent_category?: Category[];
}

export interface CategoriesPagination {
  page: number;
  size: number;
  total: number;
}