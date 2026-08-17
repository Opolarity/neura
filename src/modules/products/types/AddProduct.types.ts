import type { Category, TermGroup, Term, PriceList, Warehouse, VariationPrice, VariationStock, StockType, Channel } from '@/types';

// ================= Form Data Types =================

export interface ProductFormData {
  productName: string;
  shortDescription: string;
  promotionalText: string;
  promotionalBgColor: string;
  promotionalTextColor: string;
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

/**
 * Etiqueta de producto (fila de `tags` con type = 'tag').
 * Marcas y etiquetas comparten tabla en el backend.
 */
export interface ProductTag {
  id: number;
  name: string;
  code: string;
  type: string;
}

/** Marca de producto (fila de `tags` con type = 'brand'). */
export interface ProductBrand {
  id: number;
  name: string;
  code: string;
  type: string;
}

export interface ProductFormDataResponse {
  categories: Category[];
  termGroups: TermGroup[];
  terms: Term[];
  priceLists: PriceList[];
  warehouses: Warehouse[];
  stockTypes: StockType[];
  channels: Channel[];
  tags: ProductTag[];
  brands: ProductBrand[];
}

export interface ProductDetailsResponse {
  product: {
    id: number;
    title: string;
    short_description: string;
    promotional_text: string | null;
    promotional_bg_color: string | null;
    promotional_text_color: string | null;
    sizes_image_url: string | null;
    sizes_ref_image_url: string | null;
    description: string;
    is_variable: boolean;
    active: boolean;
    web: boolean;
    created_at: string | null;
    // Exhibición: o las dos con fecha (ISO), o las dos en null.
    exhibition_start_date: string | null;
    exhibition_end_date: string | null;
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
  channels: number[];
  /** Ids de etiquetas asignadas (tags.type = 'tag'). */
  tags: number[];
  /** Ids de marcas asignadas (tags.type = 'brand'). */
  brands: number[];
}

// ================= Request Types =================

export interface CreateProductRequest {
  productName: string;
  shortDescription: string;
  promotionalText: string;
  promotionalBgColor: string;
  promotionalTextColor: string;
  sizesImageUrl: string | null;
  sizesRefImageUrl: string | null;
  description: string;
  isVariable: boolean;
  isActive: boolean;
  isWeb: boolean;
  selectedCategories: number[];
  selectedChannels: number[];
  selectedTags: number[];
  selectedBrands: number[];
  createdAt?: string;
  // Exhibición: o las dos con fecha (ISO con offset Lima), o las dos en null.
  exhibitionStartDate: string | null;
  exhibitionEndDate: string | null;
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
  resetVariations: boolean;
}

// ================= Hook State Types =================

export interface AddProductState {
  productName: string;
  shortDescription: string;
  promotionalText: string;
  promotionalBgColor: string;
  promotionalTextColor: string;
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
  channels: Channel[];
  selectedChannels: number[];
  tags: ProductTag[];
  brands: ProductBrand[];
  selectedTags: number[];
  selectedBrands: number[];
  selectedStockType: number | null;
  loading: boolean;
  initialDataLoaded: boolean;
  isLoadingProduct: boolean;
  productDataLoaded: boolean;
}
