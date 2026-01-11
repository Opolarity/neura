export interface StockByWarehouse {
    warehouse_id: number;
    warehouse_name: string;
    stock: number;
    defects?: number;
}

export interface InventoryItem {
    variation_id: number;
    sku: string;
    product_name: string;
    variation_name: string;
    stock_by_warehouse: StockByWarehouse[];
}

export interface Warehouse {
    id: number;
    name: string;
}

export interface StockMovement {
    id: number;
    quantity: number;
    created_at: string;
    movement_type: number;
    order_id: number | null;
    return_id?: number | null;
    product_variation_id: number;
    created_by: string;
    out_warehouse_id: number;
    in_warehouse_id: number;
    defect_stock: boolean;
    variations: {
        id: number;
        sku: string | null;
        products: {
            id: number;
            title: string;
        };
        variation_terms: {
            terms: {
                id: number;
                name: string;
            };
        }[];
    };
    types: {
        id: number;
        name: string;
    };
    orders: {
        id: number;
        document_number: string;
    } | null;
    profiles: {
        name: string;
        last_name: string;
    };
    out_warehouse: {
        id: number;
        name: string;
    };
    in_warehouse: {
        id: number;
        name: string;
    };
}

export interface InventoryFilters {
    search?: string;
    startDate?: string;
    endDate?: string;
}
