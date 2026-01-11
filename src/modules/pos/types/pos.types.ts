import { Product, Variation } from "../../products/products.types";

export interface CartItem extends Product {
    quantity: number;
    cartItemId: string; // unique ID for product-variation pair
    variation_id?: number;
    variation_sku?: string | null;
}

export interface PosState {
    cart: CartItem[];
    addToCart: (product: Product, variation?: Variation, quantity?: number) => void;
    removeFromCart: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    subtotal: number;
    tax: number;
}
