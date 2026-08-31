// --- Condition Types ---
export type ConditionType =
  | "cart_subtotal"
  | "product_in_cart"
  | "variation_in_cart"
  | "category_in_cart"
  | "brand_in_cart"
  | "tag_in_cart"
  | "min_total_quantity"
  | "min_category_quantity"
  | "customer_level"
  | "payment_method"
  | "new_customer"
  | "customer_birthday"
  | "date_range"
  | "consignment_channel";

// Marcador de "promoción de consignación (franquiciados)". Una regla que lo
// lleva NUNCA aplica al ecommerce/ERP (el motor process-price-rules la
// excluye y su evaluator es fail-closed ante este tipo); solo la consume la
// API externa de franquiciados (fch-get-promotions /
// fch-update-sales-products-status). Se gestiona con el checkbox del
// formulario, no desde el builder de condiciones.
export const CONSIGNMENT_CONDITION_TYPE: ConditionType = "consignment_channel";

// Acciones soportadas por el canal consignación (el backend solo sabe
// liquidar estas tres contra el precio de la orden de consignación).
export const CONSIGNMENT_ALLOWED_ACTION_TYPES: ActionType[] = [
  "set_fixed_price",
  "fixed_discount_per_product",
  "percent_discount_per_product",
];

export interface Condition {
  type: ConditionType;
  // Solo en el marcador de consignación: tenant_reference de los franquiciados
  // que participan en la promo. Ausente o vacío = todos los franquiciados.
  tenant_references?: string[];
  [key: string]: unknown;
}

// Cuenta franquiciada (accounts con tenant_reference no nulo), tal como la
// devuelve la edge function get-franchisee-accounts.
export interface FranchiseeAccount {
  id: number;
  name: string;
  last_name: string | null;
  tenant_reference: string;
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Condition[];
}

export interface ConditionsConfig {
  operator: "AND" | "OR";
  groups: ConditionGroup[];
}

// --- Action Types ---
export type ActionType =
  | "fixed_discount_subtotal"
  | "percent_discount_subtotal"
  | "fixed_discount_per_product"
  | "percent_discount_per_product"
  | "set_fixed_price"
  | "tiered_pack_pricing"
  | "buy_x_get_y"
  | "free_gift"
  | "free_shipping"
  | "shipping_discount_fixed"
  | "shipping_discount_percent"
  | "payment_surcharge_percent";

/** Valor por defecto del switch "Incluir subcategorías" cuando la clave no existe. */
export const DEFAULT_INCLUDE_DESCENDANTS = true;

export interface TargetFilter {
  apply_to:
    | "all"
    | "specific_products"
    | "specific_categories"
    | "specific_variations"
    | "specific_brands"
    | "specific_tags";
  product_ids?: number[];
  category_ids?: number[];
  variation_ids?: number[];
  // Marcas y etiquetas comparten la tabla `tags` (discriminadas por `type`),
  // pero se guardan en claves distintas para que el destino elegido quede
  // explícito en el JSON y el motor no tenga que consultar la tabla para
  // saber si un id era marca o etiqueta.
  brand_ids?: number[];
  tag_ids?: number[];
  include_descendants?: boolean;
}

export interface ExclusionFilter {
  product_ids?: number[];
  variation_ids?: number[];
  category_ids?: number[];
  brand_ids?: number[];
  tag_ids?: number[];
  include_descendants?: boolean;
}

export interface ActionConfig {
  type: ActionType;
  value?: number;
  target?: TargetFilter;
  tiers?: { qty: number; unit_price: number }[];
  variation_id?: number;
  quantity?: number;
  max_qty?: number;
  // buy_x_get_y fields
  buy_qty?: number;
  get_qty?: number;
  discount_type?: "percent" | "fixed";
  discount_percent?: number;
  discount_amount?: number;
  apply_to_cheapest?: boolean;
}

// --- Price Rule ---
export interface PriceRule {
  id: number;
  name: string;
  description: string | null;
  code: string | null;
  rule_type: "automatic" | "coupon";
  priority: number;
  is_stackable: boolean;
  stop_processing: boolean;
  is_active: boolean;
  // Borrado lógico. NULL = la regla se lista con normalidad e `is_active` decide
  // si está activa o pausada. Con fecha = eliminada: el backend ya no la
  // devuelve en el listado ni en el detalle, así que en la práctica nunca llega
  // con valor a la UI; está declarado por honestidad del tipo.
  deleted_at?: string | null;
  valid_from: string | null;
  valid_to: string | null;
  price_list_id: number | null;
  conditions: ConditionsConfig;
  actions: ActionConfig[];
  exclusions?: ExclusionFilter | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  discounts?: Discount[];
  price_list?: { id: number; name: string; code: string } | null;
  references?: PriceRuleReferences;
}

// Nombres de lo que conditions/actions/exclusions referencian por id. Solo de
// lectura: lo devuelve get-price-rule-details para que el formulario muestre
// nombres en vez de ids; nunca se persiste.
export interface PriceRuleReferences {
  products: Array<{ id: number; name: string }>;
  variations: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  brands: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string }>;
}

export const EMPTY_REFERENCES: PriceRuleReferences = {
  products: [],
  variations: [],
  categories: [],
  brands: [],
  tags: [],
};

// --- Discount/Coupon ---
export interface Discount {
  id: number;
  code: string;
  price_rule_id: number;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  current_uses: number;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
}

// --- Form Types ---
export interface PriceRuleFormData {
  name: string;
  description: string;
  code: string;
  rule_type: "automatic" | "coupon";
  priority: number;
  is_stackable: boolean;
  stop_processing: boolean;
  is_active: boolean;
  valid_from: string;
  valid_to: string;
  price_list_id: number | null;
  conditions: ConditionsConfig;
  actions: ActionConfig[];
  exclusions: ExclusionFilter | null;
  // Coupon fields
  coupon_code: string;
  max_uses: number | null;
  max_uses_per_customer: number | null;
}

// --- List/Filter Types ---
export interface PriceRuleFilters {
  page: number;
  size: number;
  search: string;
  rule_type: string | null;
  is_active: string | null;
  price_list_id: string | null;
}

export interface PriceRulePagination {
  current: number;
  size: number;
  total: number;
  total_pages: number;
}

// --- Labels ---
export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  cart_subtotal: "Subtotal del carrito",
  product_in_cart: "Producto en el carrito",
  variation_in_cart: "Variación en el carrito",
  category_in_cart: "Categoría en el carrito",
  brand_in_cart: "Marca en el carrito",
  tag_in_cart: "Etiqueta en el carrito",
  min_total_quantity: "Cantidad mínima total",
  min_category_quantity: "Cantidad mínima por categoría",
  customer_level: "Nivel del cliente (puntos)",
  payment_method: "Método de pago",
  new_customer: "Cliente nuevo",
  customer_birthday: "Cumpleaños del cliente",
  date_range: "Rango de fechas",
  consignment_channel: "Canal: consignación (franquiciados)",
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  fixed_discount_subtotal: "Descuento fijo al subtotal",
  percent_discount_subtotal: "% descuento al subtotal",
  fixed_discount_per_product: "Descuento fijo por producto",
  percent_discount_per_product: "% descuento por producto",
  set_fixed_price: "Precio fijo por producto",
  tiered_pack_pricing: "Pack con escalas",
  buy_x_get_y: "Compra X lleva Y (2x1, 3x2, etc.)",
  free_gift: "Regalo gratis",
  free_shipping: "Envío gratis",
  shipping_discount_fixed: "Descuento fijo en envío",
  shipping_discount_percent: "% descuento en envío",
  payment_surcharge_percent: "Recargo por método de pago",
};
