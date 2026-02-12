import { PaginationState } from '@/shared/components/pagination/Pagination';
import { OrderChannelType, OrderChannelTypesApiResponse } from '../types/OrderChannelTypes.types';

export const OrderChannelTypesAdapter = (
    response: OrderChannelTypesApiResponse
): {
    orderChannelTypes: OrderChannelType[];
    pagination: PaginationState;
} => {
    // The response structure from get-order-chanel-types contains productsdata which contains data and page
    const { data, page } = response.productsdata;

    return {
        orderChannelTypes: data || [],
        pagination: {
            p_page: page?.page || 1,
            p_size: page?.size || 20,
            total: page?.total || 0,
        },
    };
};
