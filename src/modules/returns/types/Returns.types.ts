export interface Order {
    id: number;
    document_number: string;
    customer_name: string;
    customer_lastname: string;
    total: number;
    created_at: string;
    document_type: number;
    shipping_cost: number | null;
}

export interface OrderProduct {
    id: number;
    product_variation_id: number;
    quantity: number;
    product_price: number;
    product_discount: number;
    product_name?: string;
    variations: {
        sku: string;
        products: {
            title: string;
        };
    };
}

export interface ReturnProduct {
    product_variation_id: number;
    quantity: number;
    product_name: string;
    sku: string;
    price: number;
    output: boolean;
    maxQuantity?: number;
}

export interface ExchangeProduct {
    variation_id: number;
    product_name: string;
    variation_name: string;
    sku: string;
    quantity: number;
    price: number;
    discount: number;
    linked_return_index: number | null;
    imageUrl?: string;
    stock?: number;
}

export interface ReturnType {
    id: number;
    name: string;
    code: string;
}

export interface Situation {
    id: number;
    name: string;
    code: string;
    status_id: number;
    statuses?: {
        id: number;
        name: string;
        code: string;
    };
}

export interface ReturnItem {
    id: number;
    order_id: number;
    customer_document_number: string;
    customer_name?: string;
    customer_lastname?: string;
    reason: string | null;
    shipping_return: boolean;
    total_refund_amount: number | null;
    total_exchange_difference: number | null;
    created_at: string;
    statuses?: {
        name: string;
    };
    situations?: {
        name: string;
    };
    types?: {
        name: string;
        code?: string;
    };
    return_type_id?: number;
    customer_document_type_id?: number | null;
    situation_id?: number;
}

export interface SearchProduct {
    sku: string;
    stock: number;
    terms: Array<{ id: number; name: string }>;
    prices: Array<{ price: number; sale_price: number | null; price_list_id: number }>;
    imageUrl: string;
    productId: number;
    variationId: number;
    productTitle: string;
}

export interface ProductSearchPagination {
    page: number;
    size: number;
    total: number;
}

export interface ReturnPayment {
    id: string;
    paymentMethodId: string;
    amount: string;
}
