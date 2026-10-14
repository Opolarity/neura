export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  description: string;
  category: string;
  subcategory?: string;
  images: string[];
  groupTerms?: Record<string, { name: string; stock: number }[]>;
  tags?: string[];
  isNew?: boolean;
  isSale?: boolean;
  isPreSale?: boolean;
  stock: number;
  promotionalText?: string | null;
  promotionalTextColor?: string | null;
  promotionalBgColor?: string | null;
  // Exhibición: ISO, o las dos con fecha o las dos en null. Mientras
  // exhibitionEndDate no haya pasado, el producto no se puede comprar.
  exhibitionStartDate?: string | null;
  exhibitionEndDate?: string | null;
}

export interface EdgeProduct {
  product_id: number;
  name: string;
  images: string[] | null;
  categories: string | null;
  terminos: Record<string, { name: string; stock: number }[]> | null;
  price: number;
  regular_price?: number;
  sale_price?: number;
  stock: number;
  estado: boolean;
  web: boolean;
  promotional_text?: string | null;
  promotional_text_color?: string | null;
  promotional_bg_color?: string | null;
  exhibition_start_date?: string | null;
  exhibition_end_date?: string | null;
}

export interface EdgeProductPageInfo {
  total: number;
  p_page: number;
  p_size: number;
  p_price_max: number;
  p_price_min: number;
}

export interface EdgeProductListResponse {
  success: boolean;
  data: EdgeProduct[];
  page?: EdgeProductPageInfo;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

export interface Category {
  id?: number;
  name: string;
  slug: string;
  image?: string;
  description?: string | null;
  parent_category?: number | null;
  subcategories?: Category[];
}

export interface EdgeCategory {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  parent_category: number | null;
}

export interface CategoryResponse {
  success: boolean;
  data: EdgeCategory[];
}
export interface Term {
  id: number;
  name: string;
  group_code: string;
  group_name: string;
}

export interface VariationImage {
  id: number;
  url: string;
  order: number;
}

export interface Variation {
  id: number;
  sku: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock: number;
  in_stock?: boolean;
  terms: Term[];
  images?: VariationImage[];
}

export interface AttributeGroup {
  id: number;
  code: string;
  name: string;
  terms: Array<{ id: number; name: string }>;
}

export interface ProductImage {
  id: number;
  url: string;
  order: number;
}

export interface ProductDetailCategory {
  id: number;
  name: string;
}

export interface ProductDetail {
  id: number;
  title: string;
  short_description: string;
  description: string;
  is_variable: boolean;
  price_range?: {
    min: number;
    max: number;
    display: string;
  };
  images: ProductImage[];
  categories: ProductDetailCategory[];
  attribute_groups: AttributeGroup[];
  variations: Variation[];
}
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  middle_name: string;
  last_name: string;
  last_name2?: string | null;
  company_name?: string | null;
  document_type_id: number;
  document_number: string;
  exists: boolean;
  accountId: number | null;
}

export interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// PRODUCT GRID TYPES //
export interface ProductTerm {
  name: string;
  stock: number;
}

export interface ProductGridItem {
  product_id: number;
  name: string;
  images: string[];
  categories: string | null;
  terminos: Record<string, ProductTerm[]>;
  price: number;
  regular_price?: number;
  sale_price?: number;
  stock: number;
  estado: boolean;
  web: boolean;
  promotional_text?: string | null;
  promotional_text_color?: string | null;
  promotional_bg_color?: string | null;
  exhibition_start_date?: string | null;
  exhibition_end_date?: string | null;
}

export interface ProductGridResponse {
  success: boolean;
  data: {
    data: ProductGridItem[];
  };
}

export interface ProductGridFilters {
  search?: string | null;
  category_id?: number | null;
  category_ids?: number[] | null;
  size?: number | null;
  sale_price?: boolean;
  order?: string | null;
  product_ids?: number[];
  brand_id?: number | null;
  source?: ProductGridSource | null;
}

// Fuentes de producto soportadas por ec-get-product-ids
export type ProductGridSource =
  | "productIds"
  | "categoryId"
  | "brandId"
  | "new"
  | "best_sellers"
  | "sale";

// CATEGORY GRID TYPES //
export interface CategoryGridResponse {
  success: boolean;
  data: Array<{
    category_id: number;
    name: string;
    description: string | null;
    image_url: string | null;
    parent_category: number | null;
  }>;
}
export interface CategoryGridFilters {
  categoriesIds?: number[];
}

// GET PRODUCT LIST FILTERS //
//aún no usados porque va perjudicar a otras pages
export interface ProductListParams {
  search?: string;
  category_id?: number;
  size?: number;
  page?: number;
  sale_price?: boolean;
  order?: string;
}

export interface DiscountEntry {
  name: string;
  discount: number;
  percent: number;
  code: string;
}

export interface ShippingModifier {
  // "=" el envío cuesta exactamente `value`, "-" descuento en soles,
  // "-%" descuento en porcentaje del costo base, "+" recargo en soles.
  operator: "=" | "+" | "-" | "-%";
  value: number;
  reason: string;
}

export interface AppliedRule {
  message: string;
  url: string | null;
  rule_name?: string;
  rule_code?: string | null;
}

export interface CartSubtotalPriceRuleCondition {
  type: "cart_subtotal";
  operator: "gte" | "lte" | "between" | "eq";
  value: number;
  value2?: number;
}

export interface EcommerceCartSubtotalPriceRule {
  id: number;
  name: string;
  description: string | null;
  code: string | null;
  rule_type: "automatic";
  priority: number;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  price_list_id: number | null;
  conditions: unknown;
  actions: unknown;
  cart_subtotal_conditions: CartSubtotalPriceRuleCondition[];
}

export interface EcommerceCartSubtotalPriceRuleResponse {
  success: boolean;
  data: EcommerceCartSubtotalPriceRule[];
  channel: {
    id: number;
    code: string;
    price_list_id: number | null;
  };
}

export interface GetCartResponse {
  cartItems: {
    id: number;
    product: {
      id: number;
      title: string;
      image_url: string;
      short_description: string;
    };
    quantity: number;
    is_active: boolean;
    variation: {
      id: number;
      sku: string;
      name?: string;
      stock: number;
    };
    warehouse_id: number;
    product_price: number;
    regular_price: number;
    sale_price: number | null;
    product_discount: number;
    product_variation_id: number;
    variation_name?: string;
    size?: string;
    isGift?: boolean;
  }[];
  total: number;
  itemCount: number;
  success?: boolean;
  cartId?: number;
  gifts?: {
    id: number;
    variationId: number;
    quantity: number;
    name: string;
    product_price: number;
    regular_price: number;
    sale_price: number | null;
    originalPrice?: number;
    imageUrl?: string;
  }[];
  discounts?: DiscountEntry[];
  appliedRules?: AppliedRule[] | null;
  shipping?: ShippingModifier;
  couponError?: string | null;
  couponDiscountId?: number | null;
}

export interface CreateCartResponse extends GetCartResponse {
  cartId: number;
  success: boolean;
}

export interface CartProductDetail {
  web: boolean;
  name: string;
  price: number;
  stock: number;
  estado: boolean;
  images: string[];
  terminos: Record<string, Array<{ name: string; stock: number }>>;
  categories: string;
  product_id: number;
  quantity?: number;
  variation_id?: number;
}

export interface CartFilters {
  cartId: number | null;
  userId: string | null;
  paymentMethodCode?: string | null;
  couponCode?: string | null;
  shippingMethodId?: number | null;
}

export interface CreateItemCart {
  variation_id: number;
  quantity: number;
  cart_id: number | null;
  user_id: string | null;
}

export interface StandardizedCartItem {
  id: number;
  displayName: string;
  price: number;
  originalPrice?: number;
  product_discount?: number;
  quantity: number;
  imageUrl: string;
  variationId: number;
  productId: number;
  variationStock?: number;
  isGift?: boolean;
}

// ACCOUNT

export interface LocationEntity {
  id: number;
  name: string;
}

export interface AccountResponse {
  birthday_day: string | null;
  address: string | null;
  address_reference: string | null;
  accounts: {
    id: number;
    name: string;
    last_name: string | null;
    last_name2: string | null;
    middle_name: string | null;
    document_number: string;
    document_types: {
      id: number;
      name: string;
    };
  };
  countries: LocationEntity;
  states: LocationEntity;
  cities: LocationEntity;
  neighborhoods: LocationEntity;
  phone: number | null;
  phone_whatsapp: number | null;
}

export interface Account {
  id: number;
  birthday_day: string | null;
  address: string | null;
  address_reference: string | null;
  name: string;
  last_name: string | null;
  last_name2: string | null;
  middle_name: string | null;
  document_type: string;
  document_type_name: string;
  document_number: string;
  countries: LocationEntity;
  states: LocationEntity;
  cities: LocationEntity;
  neighborhoods: LocationEntity;
  phone: number | null;
  phone_whatsapp: number | null;
}

export interface DocumentTypeResponse {
  id: number;
  name: string;
  min_length: number | null;
  max_length: number | null;
  created_at: string;
  code: string | null;
  person_type: number;
  state_code: string | null;
}

export interface ParameterResponse {
  id: number;
  name: string;
  value: string;
  created_at: string;
}
export interface DocumentType {
  id: number;
  name: string;
  min_length: number | null;
  max_length: number | null;
  code: string | null;
  person_type: number;
  state_code: string | null;
}

export interface DocumentResponse {
  found: boolean;
  nombres: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
}

export interface DocumentDBResponse {
  id: number;
  name: string;
  middle_name: string;
  last_name: string;
  last_name2: string;
  document_type_id: number;
  document_number: string;
  created_at: string;
  show: boolean;
  is_active: boolean;
}

export interface DocumentFound {
  id?: number;
  names: string;
  lastname: string | null;
  lastname2: string | null;
}
//LOCATION
export interface CountryResponse extends LocationEntity {
  phone_code: string | null;
  created_at: string;
}
export interface StateResponse extends LocationEntity {
  country_id: number;
  created_at: string;
}
export interface CityResponse extends LocationEntity {
  country_id: number;
  state_id: number;
  created_at: string;
}
export interface NeighborhoodResponse extends LocationEntity {
  country_id: number;
  state_id: number;
  city_id: number;
  created_at: string;
}
export interface ShippingCostResponse {
  id: number;
  name: string;
  country_id: number | null;
  state_id: number | null;
  city_id: number | null;
  neighborhood_id: number | null;
  cost: number;
  shipping_method_id: number;
  created_at: string;
  shipping_methods?: { code: string | null } | null;
}
export interface ShippingCost {
  id: number;
  name: string;
  cost: number;
  shippingMethodId: number;
  methodCode: string | null;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  neighborhoodId: number | null;
}

// PAYMENT METHODS
export interface PaymentMethodResponse {
  sale_types: {
    payment_method_sale_type: {
      payment_methods: {
        id: number;
        name: string;
        code: string | null;
        description: string | null;
        image_url: string | null;
      };
    }[];
  };
}
export interface PaymentMethod {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  image_url: string | null;
}

//FORM CHECKOUT
export interface FormStepsData {
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  email: string;
  phoneCode: string;
  phone: string | null;
  phoneWhatsapp: string | null;

  isPickup: boolean;
  country: string;
  department: string;
  province: string;
  district: string;
  shippingCost: string;
  address: string;
  reference: string;

  payment_method_id: string;
  voucherFiles: File[];
}

export interface CreateOrderPayload {
  cartId: number;
  couponCode: string | null;
  customerInfo: {
    documentTypeId: number;
    documentNumber: string;
    firstName: string;
    paternalLastName: string;
    maternalLastName: string;
    email: string;
    phone: string;
    phoneWhatsapp: string | null;
  };
  shippingInfo: {
    shippingMethodId: number;
    shippingCost: number;
    address: string;
    instructions: string;
    countryId: number | null;
    stateId: number | null;
    cityId: number | null;
    neighborhoodId: number | null;
  };
  paymentInfo: {
    paymentMethodId: number;
    confirmationCode: string | null;
    voucherUrls: string[] | null;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: number;
  message: string;
  orderPaymentId: number;
  init_point: string | null;
}

// MERCADO PAGO — Checkout API (Card Payment Brick)
export interface MpCardPaymentData {
  token: string;
  installments: number;
  payment_method_id: string;
  issuer_id: string;
  payer: {
    email: string;
    identification?: { type: string; number: string };
  };
}

export interface ProcessMpPaymentPayload extends MpCardPaymentData {
  orderId: number;
}

export interface ProcessMpPaymentResponse {
  status: "approved" | "in_process" | "pending" | "rejected" | string;
  status_detail: string | null;
  paymentId: number | null;
  orderId: number;
}

export interface OrderResponse {
  data: Array<{
    order_id: number;
    created_at: string;
    order_status: string;
    total: number;
    payment_method: string;
  }>;
}
export interface Order {
  id: number;
  createdAt: string;
  orderStatus: string;
  total: number;
  paymentMethod: string;
}

export interface OrderDetailsResponse {
  data: {
    items: Array<{
      quantity: number;
      subtotal: number;
      unit_price: number;
      product_name: string;
    }>;
    summary: {
      total: number;
      subtotal: number;
      shipping_cost: number;
      payment_method: string;
      shipping_method: string;
      success_viewed: boolean;
    };
  };
  success: boolean;
}

export interface OrderDetails {
  items: Array<{
    quantity: number;
    subtotal: number;
    price: number;
    name: string;
  }>;

  total: number;
  subtotal: number;
  shippingCost: number;
  paymentMethod: string;
  shippingMethod: string;
  successViewed: boolean;
}
export interface ProductDetailResponse {
  data: {
    id: number;
    title: string;
    description: string;
    short_description: string;
    other_description_min: string | null;
    promotional_img_url: string | null;
    is_variable: boolean;
    exhibition_start_date: string | null;
    exhibition_end_date: string | null;

    images: {
      id: number;
      url: string;
      order: number;
    }[];

    categories: {
      id: number;
      name: string;
    }[];

    sizes_image_url: string | null;
    sizes_ref_image_url: string | null;
    variations: {
      id: number;
      sku: string;
      price: number;
      stock: number;
      sale_price: number | null;
      regular_price: number;
      terms:
        | {
            id: number;
            name: string;
            group_id: number;
            group_code: string;
            group_name: string;
          }[]
        | null;
    }[];
  };

  success: boolean;
}
export type ProductDetailAdapter = {
  details: {
    id: number;
    name: string;
    description: string;
    otherDescriptionMin: string | null;
    promotional_img_url: string | null;
    price: number;
    salePrice: number | null;
    isVariable: boolean;
    sizes_image_url: string | null;
    sizes_ref_image_url: string | null;
    exhibitionStartDate: string | null;
    exhibitionEndDate: string | null;
    categories: {
      id: number;
      name: string;
    }[];
  };
  images: {
    id: number;
    url: string;
    order: number;
  }[];
  variations: {
    id: number;
    sku: string;
    price: number;
    stock: number;
    salePrice: number | null;
    regularPrice: number;
    terms:
      | {
          id: number;
          name: string;
          groupId: number;
          groupCode: string;
          groupName: string;
        }[]
      | null;
  }[];
};
export interface GroupResponse {
  id: number;
  name: string;
  terms: {
    id: number;
    name: string;
  }[];
}

// TERMS BY GROUP (ec-get-terms-by-group-terms-by-category)
export interface RawTermByGroupItem {
  term_group_id: number;
  term_group_name: string;
  term_group_description: string;
  term_id: number;
  term_name: string;
}

export interface TermsByGroupApiResponse {
  success: boolean;
  data: RawTermByGroupItem[];
}

export interface TermGroupAdapted {
  groupId: number;
  groupName: string;
  groupDescription: string;
  terms: { id: number; name: string }[];
}
export interface VariationDetail {
  id: number;
  sku: string;
  price: number;
  stock: number;
  salePrice: number | null;
  regularPrice: number;
  terms:
    | {
        id: number;
        name: string;
        groupId: number;
        groupCode: string;
        groupName: string;
      }[]
    | null;
}

// MENU CATEGORIES (ec-get-categories-with-products)
export interface RawMenuCategoryItem {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  products_qty: number;
  parent_category: number | null;
}

export interface MenuCategoriesApiResponse {
  categories: {
    data: RawMenuCategoryItem[];
    success: boolean;
  };
}

export interface MenuCategoryNode {
  id: number;
  name: string;
  children: MenuCategoryNode[];
}

export interface AccountByDocumentNumberResponse {
  created_at: string;
  document_number: string;
  document_type_id: number;
  id: number;
  is_active: boolean;
  last_name: string | null;
  last_name2: string | null;
  middle_name: string | null;
  name: string;
  show: boolean;
}

export interface CustomerPointsResponse {
  note: string | null;
  quantity: number;
  created_at: string;
}
export interface CustomerPoints {
  note: string | null;
  quantity: number;
  created_at: string;
}

export interface ProductSimilarResponse {
  data: {
    product_id: number;
    name: string;
    image: string | null;
  }[];
}

export interface ProductSimilar {
  id: number;
  alt: string;
  url: string | null;
}

export interface ComplaintsBookPayload {
  name: string;
  last_name: string;
  last_name2?: string | null;
  document_type_id: number;
  document_number: string;
  country_id: number;
  state_id: number;
  city_id: number;
  neighborhood_id: number;
  address: string;
  phone: string;
  email: string;
  age: boolean;
  name_apoderado?: string | null;
  apoderado_document_type_id?: number | null;
  apoderado_document_number?: string | null;
  apoderado_phone?: string | null;
  apoderado_email?: string | null;
  good: string;
  incident_date: string;
  amount_claim: number;
  claim_description: string;
  claim_type: string;
  detail: string;
  complaining_request: string;
  terms?: boolean;
}
