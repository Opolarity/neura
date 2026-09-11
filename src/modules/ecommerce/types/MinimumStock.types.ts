// T-596 · Stock mínimo por variación para canales externos (hoy: Web Mayorista).
//
// La pestaña "Variaciones" de Edición masiva lista SKUs en vez de productos
// porque el mínimo se guarda por variación (minimun_stock_external_channels).
import type { ProductFilters } from "@/modules/products/types/Products.types";

/** Código del canal externo que se configura. Hoy el único. */
export const WHOLESALE_CHANNEL_CODE = "WEBMAY";

/** Fila cruda de sp_get_variations_min_stock. */
export interface VariationMinStockApiRow {
  variation_id: number;
  sku: string | null;
  product_id: number;
  product_name: string;
  /** Atributos de la variación ya formateados: "M · Talla". null si no tiene. */
  terms: string | null;
  stock: number;
  /** null = no tiene fila propia, rige el mínimo por defecto. */
  min_stock: number | null;
  estado: boolean;
  web: boolean;
}

export interface VariationsMinStockApiResponse {
  page: { p_page: number; p_size: number; total: number };
  /** Mínimo que aplica a toda variación sin fila propia. null = sin default. */
  default_min_stock: number | null;
  data: VariationMinStockApiRow[];
}

export interface VariationMinStock {
  variationId: number;
  sku: string | null;
  productId: number;
  productName: string;
  terms: string | null;
  stock: number;
  minStock: number | null;
  estado: boolean;
  web: boolean;
}

/**
 * Los mismos filtros de la pestaña de productos (de ahí que se reusen el tipo y
 * el modal de filtros, con `term` para el atributo) más el canal, que no lo
 * elige el usuario: lo resuelve el hook.
 */
export interface VariationsMinStockFilters extends ProductFilters {
  channel_id?: number | null;
}

/** Opción del select de atributo: el grupo desambigua "S · Talla" de "S · Talla boxers". */
export interface TermOption {
  id: number;
  name: string;
  groupName: string;
}
