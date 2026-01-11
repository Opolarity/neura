import { useState, useEffect, useMemo } from "react";
import { Product, Variation } from "../../products/products.types";
import { getProducts } from "../../products/store/products";
import { CartItem } from "../types/pos.types";

export const usePos = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await getProducts({ size: 100 });
            setProducts(response.products);
        } catch (err: any) {
            setError(err.message || "Error al cargar productos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [products, search]);

    const addToCart = (product: Product, variation?: Variation, quantity: number = 1) => {
        setCart((prev) => {
            const cartItemId = variation ? `${product.id}-${variation.id}` : `${product.id}`;
            const existing = prev.find((item) => item.cartItemId === cartItemId);

            if (existing) {
                return prev.map((item) =>
                    item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
                );
            }

            const newCartItem: CartItem = {
                ...product,
                cartItemId,
                quantity,
                variation_id: variation?.id,
                variation_sku: variation?.sku,
                price: variation?.price || product.price,
                stock: variation?.stock ?? product.stock,
            };

            return [...prev, newCartItem];
        });
    };

    const removeFromCart = (cartItemId: string) => {
        setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.cartItemId === cartItemId) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    const totals = useMemo(() => {
        const subtotal = cart.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
        const tax = subtotal * 0.18;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [cart]);

    return {
        products: filteredProducts,
        loading,
        error,
        search,
        setSearch,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        totals,
    };
};
