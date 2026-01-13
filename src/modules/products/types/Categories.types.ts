export interface CategoryApiResponse {
  id: number;
  name: string;
}
export interface Category {
  id: number;
  name: string;
}

export type Categories = Category[];
export type CategoriesApiResponse = CategoryApiResponse[];
//
