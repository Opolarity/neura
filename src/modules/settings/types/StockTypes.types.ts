export interface StockType {
    id: number;
    name: string;
}

export interface StockTypesApiResponse {
    data: StockType[];
    page: {
        page: number;
        size: number;
        total: number;
    };
}

export interface StockTypesFilters {
    page: number;
    size: number;
    search?: string;
}
