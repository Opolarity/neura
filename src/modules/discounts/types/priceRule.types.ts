// --- Condition Types ---
export type ConditionType =
  | "cart_subtotal"
  | "product_in_cart"
  | "variation_in_cart"
  | "category_in_cart"
  | "min_total_quantity"
  | "min_category_quantity"
  | "customer_level"
  | "payment_method"
  | "new_customer"
  | "customer_birthday"
  | "date_range";

export interface Condition {
  type: ConditionType;
  [key: string]: unknown;
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

export interface TargetFilter {
  apply_to: "all" | "specific_products" | "specific_categories" | "specific_variations";
  product_ids?: number[];
  category_ids?: number[];
  variation_ids?: number[];
  include_descendants?: boolean;
}

export interface ActionConfig {
  type: ActionType;
  value?: number;
  target?: TargetFilter;
  tiers?: { qty: number; unit_price: number }[];
  variation_id?: number;
  quantity?: number;
  // buy_x_get_y fields
  buy_qty?: number;
  get_qty?: number;
  discount_percent?: number;
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
  valid_from: string | null;
  valid_to: string | null;
  price_list_id: number | null;
  conditions: ConditionsConfig;
  actions: ActionConfig[];
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  discounts?: Discount[];
  price_list?: { id: number; name: string; code: string } | null;
}

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
  min_total_quantity: "Cantidad mínima total",
  min_category_quantity: "Cantidad mínima por categoría",
  customer_level: "Nivel del cliente (puntos)",
  payment_method: "Método de pago",
  new_customer: "Cliente nuevo",
  customer_birthday: "Cumpleaños del cliente",
  date_range: "Rango de fechas",
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
