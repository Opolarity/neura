export interface ProductData {
  id: number;
  title: string;
  short_description: string;
  is_variable: boolean;
  categories: string[];
  images: { image_url: string }[];
  variations: {
    id: number;
    sku: string | null;
    prices: { price: number; sale_price: number | null }[];
    stock: { stock: number }[];
  }[];
}

// Categories
export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
}

export interface CategoryFormData {
  name: string;
  description: string;
}
