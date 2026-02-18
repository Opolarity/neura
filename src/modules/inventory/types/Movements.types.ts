import { Types } from "@/shared/types/type";

//CAMBIAR NOMBRES PORQUE SON POCO DESCRIPTIVOS, NO MENCIONAR MOVEMENTS EN NINGUNO
export interface MovementsApiResponse {
    movementsstock: {
        data: Array<{
            date: string;
            user: string;
            product: string;
            vinc_id: number;
            quantity: number | null;
            variation: string;
            warehouse: string;
            stock_type: string;
            movements_id: number;
            movement_type: string;
            vinc_warehouse: string | null;
            vinc_stock_type: string | null;
        }>;
        page: {
            page: number;
            size: number;
            total: number;
        };
    };
}

export interface Movements {
    movements_id: number;
    movement_type: string;
    date: string;
    user: string;
    product: string;
    vinc_id: number;
    quantity: number | null;
    variation: string;
    warehouse: string;
    stock_type: string;
    vinc_warehouse: string | null;
    vinc_stock_type: string | null;
}

export interface MovementsFilters {
    origin?: number | null;
    user?: number | null;
    warehouse?: number | null;
    in_out?: boolean | null;
    start_date?: string | null;
    end_date?: string | null;
    page?: number;
    size?: number;
    search?: string | null;
    order?: string | null;
}

export interface MovementsTypesApiResponse {
    types: Array<{ id: number; name: string; code: string }>;
}

export interface MovementsTypes {
    id: number;
    name: string;
    code: string;
}

export interface SimpleWarehouses {
    id: number;
    name: string;
}

export interface SimpleUsers {
    id: number;
    name: string;
}

//CREATE MOVEMENT
export interface UserSummaryApiResponse {
    warehouse_id: number;
    warehouses: {
        id: number;
        name: string;
    };
    accounts: {
        name: string;
        last_name: string;
        last_name2: string;
    };
}
export interface UserSummary {
    warehouse_id: number;
    warehouse_name: string;
    account_name: string;
    account_last_name: string;
    account_last_name2: string;
}

export interface ProductSalesApiResponse {
    data: Array<{
        sku: string;
        stock: number;
        terms: Array<{ id: number; name: string }>;
        prices: Array<{
            price: number;
            sale_price: number | null;
            price_list_id: number;
        }>;
        imageUrl: string;
        productId: number;
        variationId: number;
        productTitle: string;
    }>;
    page: {
        page: number;
        size: number;
        total: number;
    };
}
export interface ProductSales {
    sku: string;
    stock: number;
    terms: Array<{ id: number; name: string }>;
    imageUrl: string;
    productId: number;
    variationId: number;
    productTitle: string;
}
export interface ProductSalesFilter {
    p_page?: number;
    p_size?: number;
    p_search?: string | null;
    p_stock_type_id?: number | null;
    p_warehouse_id?: number | null;
}

export interface SelectedProduct extends ProductSales {
    quantity: number | null;
    originType: Types;
    destinationType?: Types | null | undefined;
    destinationTypeStock?: number | null
}