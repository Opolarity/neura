import { PaginationState } from '@/shared/components/pagination/Pagination';
import { StockType, StockTypesApiResponse } from '../types/StockTypes.types';

export const StockTypesAdapter = (
    response: StockTypesApiResponse
): {
    stockTypes: StockType[];
    pagination: PaginationState;
} => {
    const { data, page } = response;

    return {
        stockTypes: data || [],
        pagination: {
            p_page: page?.page || 1,
            p_size: page?.size || 20,
            total: page?.total || 0,
        },
    };
};
