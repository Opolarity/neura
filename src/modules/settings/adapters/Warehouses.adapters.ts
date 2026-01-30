import { PaginationState } from "@/shared/components/pagination/Pagination";
import { WarehousesApiResponse, WarehouseView, WarehousesFilters } from '../types/Warehouses.types'

export const WarehousesAdapter = (response: WarehousesApiResponse) => {
    // Deduplicate by ID to prevent React "same key" warning
    const uniqueMap = new Map();
    // Aseguramos que data exista antes del forEach para evitar crash
    if (response?.warehousesdata?.data) {
        response.warehousesdata.data.forEach(item => {
            if (item && item.id && !uniqueMap.has(item.id)) {
                uniqueMap.set(item.id, item);
            }
        });
    }

    const formattedWarehouses: WarehouseView[] = Array.from(uniqueMap.values()).map(
        (item: any) => ({
            id: item.id,
            name: item.name,
            branches: item.branches,

            country_id: item.countries,
            countries: item.countries,

            state_id: item.states,
            states: item.states,

            city_id: item.cities,
            cities: item.cities,
            neighborhood_id: item.neighborhoods,
            neighborhoods: item.neighborhoods,

            web: item.web,
            is_active: item.is_active,
        })
    );

    const pagination: PaginationState = {
        p_page: response.warehousesdata?.page?.page || 1,
        p_size: response.warehousesdata?.page?.size || 20,
        total: response.warehousesdata?.page?.total || 0,
    };

    return { data: formattedWarehouses, pagination };
};