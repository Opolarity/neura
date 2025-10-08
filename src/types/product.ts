import type { VariationPrice } from './price';
import type { VariationStock } from './warehouse';

export type ProductImage = {
  file: File;
  preview: string;
  id: string; // Storage path or existing-{id}
  order: number;
};

export type ProductVariation = {
  id: string;
  attributes: { term_group_id: number; term_id: number }[];
  prices: VariationPrice[];
  stock: VariationStock[];
  selectedImages: string[];
};
