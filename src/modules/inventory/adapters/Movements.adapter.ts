import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
    Movements,
    MovementsApiResponse,
} from "../types/Movements.types";

export const movementsAdapter = (response: MovementsApiResponse) => {
    const formattedMovements: Movements[] = response.movementsstock.data.map(
        (item) => ({
            movements_id: item.movements_id,
            movement_type: item.movement_type,
            date: item.date,
            user: item.user,
            vinc_id: item.vinc_id,
            stock_type: item.stock_type,
            warehouse: item.warehouse,
            quantity: item.quantity,
            variation: item.variation,
            vinc_warehouse: item.vinc_warehouse,
            vinc_stock_type: item.vinc_stock_type,
            product: item.product,
        }),
    );

    const pagination: PaginationState = {
        p_page: response.movementsstock.page.page,
        p_size: response.movementsstock.page.size,
        total: response.movementsstock.page.total,
    };

    return {
        data: formattedMovements,
        pagination,
    };
};
