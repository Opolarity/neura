import type { Category, TermGroup, Term, PriceList, Warehouse, VariationPrice, VariationStock, StockType } from '@/types';

// ================= Form Data Types =================

export interface ProductFormData {
  productName: string;
  shortDescription: string;
  description: string;
  isVariable: boolean;
  isActive: boolean;
  isWeb: boolean;
  selectedCategories: number[];
  productImages: ProductImage[];
  variations: ProductVariation[];
}

export interface ProductImage {
  file: File;
  preview: string;
  id: string;
  order: number;
}

export interface ProductVariation {
  id: string;
  attributes: VariationAttribute[];
  prices: VariationPrice[];
  stock: VariationStock[];
  selectedImages: string[];
}

export interface VariationAttribute {
  term_group_id: number;
  term_id: number;
}

// ================= API Response Types =================

export interface ProductFormDataResponse {
  categories: Category[];
  termGroups: TermGroup[];
  terms: Term[];
  priceLists: PriceList[];
  warehouses: Warehouse[];
  stockTypes: StockType[];
}

export interface ProductDetailsResponse {
  product: {
    id: number;
    title: string;
    short_description: string;
    description: string;
    is_variable: boolean;
    active: boolean;
    web: boolean;
  };
  categories: number[];
  images: {
    id: number;
    image_url: string;
    image_order: number;
  }[];
  variations: {
    id: number;
    sku: string;
    terms: number[];
    prices: {
      price_list_id: number;
      price: number | null;
      sale_price: number | null;
    }[];
    stock: {
      warehouse_id: number;
      stock: number;
      stock_type_id: number;
    }[];
    images: number[];
  }[];
}

// ================= Request Types =================

export interface CreateProductRequest {
  productName: string;
  shortDescription: string;
  description: string;
  isVariable: boolean;
  isActive: boolean;
  isWeb: boolean;
  selectedCategories: number[];
  productImages: {
    id: string;
    path: string;
    order: number;
  }[];
  variations: {
    id: string;
    attributes: VariationAttribute[];
    prices: VariationPrice[];
    stock: VariationStock[];
    selectedImages: string[];
  }[];
}

export interface UpdateProductRequest extends CreateProductRequest {
  productId: number;
  originalIsVariable: boolean;
}

// ================= Hook State Types =================

export interface AddProductState {
  productName: string;
  shortDescription: string;
  description: string;
  selectedCategories: number[];
  isVariable: boolean;
  isActive: boolean;
  isWeb: boolean;
  originalIsVariable: boolean;
  productImages: ProductImage[];
  variations: ProductVariation[];
  variationSkus: Record<string, string>;
  selectedTermGroups: number[];
  selectedTerms: Record<number, number[]>;
  categories: Category[];
  termGroups: TermGroup[];
  terms: Term[];
  priceLists: PriceList[];
  warehouses: Warehouse[];
  stockTypes: StockType[];
  selectedStockType: number | null;
  loading: boolean;
  initialDataLoaded: boolean;
  isLoadingProduct: boolean;
  productDataLoaded: boolean;
}
