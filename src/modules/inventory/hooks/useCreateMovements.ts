import React, { useEffect, useState } from 'react'
import { getMovementsTypesByModule, getSaleProducts, getUserWarehouse } from '../services/Movements.service';
import { cMovementsProductsAdapter, cMovementsUserWarehouseAdapter } from '../adapters/Movements.adapter';
import { CMProductsFilter, CMovementsProducts, UserSummary } from '../types/CreateMovements.types';
import { PaginationState } from '@/shared/components/pagination/Pagination';

export const useCreateMovements = () => {
    const [typeStock, setTypeStock] = useState<string | undefined>(undefined);
    const typesStock = [
        { id: 9, name: "Producción", code: "PRD" },
        { id: 10, name: "Fallido", code: "FAL" },
    ];
    const [userSummary, setUserSummary] = useState<UserSummary>(null);
    const [products, setProducts] = useState<CMovementsProducts[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 10,
        total: 0,
    });
    const [filters, setFilters] = useState<CMProductsFilter>({
        p_warehouse_id: userSummary?.warehouse_id,
    });

    const handleTypeStock = (value: string) => {
        setTypeStock(value);
    };

    const loadProducts = async (newFilters: CMProductsFilter) => {
        const filtersPayload: CMProductsFilter = {
            ...newFilters,
            p_warehouse_id: userSummary?.warehouse_id,
        }
        const responseProducts = await getSaleProducts(filtersPayload);
        const { data: dataProducts, pagination: newPagination } = cMovementsProductsAdapter(responseProducts);
        setProducts(dataProducts);
    }

    const loadInitialData = async () => {
        const dataUser = await getUserWarehouse();
        const userWarehouse = cMovementsUserWarehouseAdapter(dataUser);
        setUserSummary(userWarehouse);

        setFilters((prev) => ({ ...prev, p_warehouse_id: userWarehouse.warehouse_id, }))

        const data = await getMovementsTypesByModule();
        console.log("types", data);
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    return {}
}
