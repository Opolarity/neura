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
    input?: number | null;
    output?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    page?: number;
    size?: number;
    search?: string | null;
}
