import { InventoryItem, StockMovement, Warehouse } from "../inventory.types";

export const inventoryAdapter = {
    /**
     * Adapta la respuesta de la Edge Function get-inventory
     */
    mapInventory: (data: any): { inventory: InventoryItem[]; warehouses: Warehouse[] } => {
        const rawInventory = data?.inventory || [];
        const rawWarehouses = data?.warehouses || [];

        const inventory: InventoryItem[] = rawInventory.map((item: any) => ({
            variation_id: item.variation_id,
            sku: item.sku || "",
            product_name: item.product_name || "",
            variation_name: item.variation_name || "",
            stock_by_warehouse: (item.stock_by_warehouse || []).map((sw: any) => ({
                warehouse_id: sw.warehouse_id,
                warehouse_name: sw.warehouse_name || "",
                stock: Number(sw.stock) || 0,
                defects: Number(sw.defects) || 0,
            })),
        }));

        const warehouses: Warehouse[] = rawWarehouses.map((w: any) => ({
            id: w.id,
            name: w.name || "",
        }));

        return { inventory, warehouses };
    },

    /**
     * Adapta la lista de movimientos obtenida de Supabase
     */
    mapMovements: (data: any[]): StockMovement[] => {
        return (data || []).map((item: any) => ({
            id: item.id,
            quantity: Number(item.quantity) || 0,
            created_at: item.created_at,
            movement_type: item.movement_type,
            order_id: item.order_id,
            return_id: item.return_id,
            product_variation_id: item.product_variation_id,
            created_by: item.created_by,
            out_warehouse_id: item.out_warehouse_id,
            in_warehouse_id: item.in_warehouse_id,
            defect_stock: !!item.defect_stock,
            variations: {
                id: item.variations?.id || 0,
                sku: item.variations?.sku || "",
                products: {
                    id: item.variations?.products?.id || 0,
                    title: item.variations?.products?.title || "Producto desconocido",
                },
                variation_terms: (item.variations?.variation_terms || []).map((vt: any) => ({
                    terms: {
                        id: vt.terms?.id || 0,
                        name: vt.terms?.name || "",
                    },
                })),
            },
            types: {
                id: item.types?.id || 0,
                name: item.types?.name || "",
            },
            orders: item.orders ? {
                id: item.orders.id,
                document_number: item.orders.document_number,
            } : null,
            profiles: {
                name: item.profiles?.name || "",
                last_name: item.profiles?.last_name || "",
            },
            out_warehouse: {
                id: item.out_warehouse?.id || 0,
                name: item.out_warehouse?.name || "",
            },
            in_warehouse: {
                id: item.in_warehouse?.id || 0,
                name: item.in_warehouse?.name || "",
            },
        }));
    },
};
