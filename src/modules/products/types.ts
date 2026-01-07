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
