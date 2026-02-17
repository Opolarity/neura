import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getStockMovementsApi, movementsTypesApi } from "../services/Movements.service";
import { movementsAdapter, movementsTypesAdapter } from "../adapters/Movements.adapter";
import {
    Movements,
    MovementsFilters,
    MovementsTypes,
    SimpleUsers,
    SimpleWarehouses,
} from "../types/Movements.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { getAccountsByModuleCodeAndTypeUser, getWarehousesIsActiveTrue } from "@/shared/services/service";

export const useMovements = () => {
    const [movements, setMovements] = useState<Movements[]>([]);
    const [movementsTypes, setMovementsTypes] = useState<MovementsTypes[]>([]);
    const [warehouses, setWarehouses] = useState<SimpleWarehouses[]>([]);
    const [users, setUsers] = useState<SimpleUsers[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Filtering & Pagination State
    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [filters, setFilters] = useState<MovementsFilters>({
        page: 1,
        size: 20,
        search: null,
        start_date: null,
        end_date: null,
    });

    const loadInitial = async () => {
        setLoading(true);
        try {
            const dataTypes = await movementsTypesApi();
            const types = movementsTypesAdapter(dataTypes);
            setMovementsTypes(types);

            const dataWarehouses = await getWarehousesIsActiveTrue();
            setWarehouses(dataWarehouses);

            const dataUsers = await getAccountsByModuleCodeAndTypeUser();
            setUsers(dataUsers);

            // Initial load uses default filters
            await loadMovements(filters);
        } catch (error: any) {
            console.error("Error loading initial data:", error);
            toast({
                title: "Error",
                description: "No se pudo cargar el inventario inicial",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadMovements = async (
        currentFilters: MovementsFilters = filters,
    ) => {
        setLoading(true);
        try {
            const response = await getStockMovementsApi(currentFilters);
            const { data, pagination: newPagination } = movementsAdapter(response);

            setMovements(data);
            setPagination(newPagination);
        } catch (error: any) {
            console.error("Error loading movements:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los movimientos de stock",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitial();
    }, []);

    // Debounced Search Effect
    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        const searchTerm = debouncedSearch || null;
        if (searchTerm !== filters.search) {
            setFilters((prev) => {
                const newFilters = { ...prev, search: searchTerm, page: 1 };
                loadMovements(newFilters);
                return newFilters;
            });
        }
    }, [debouncedSearch]);

    const onOpenFilterModal = () => {
        setIsOpenFilterModal(true);
    };

    const onCloseFilterModal = () => {
        setIsOpenFilterModal(false);
    };


    const onApplyFilterModal = async (newFilters: MovementsFilters) => {
        const updatedFilters: MovementsFilters = {
            ...newFilters,
            page: 1,
            size: filters.size,
        };

        setFilters(updatedFilters);
        setPagination((prev) => ({ ...prev, p_page: 1 }));
        setIsOpenFilterModal(false);

        await loadMovements(updatedFilters);
    };


    const onSearchChange = (value: string) => {
        setSearch(value);
    };

    const onPageSizeChange = (size: number) => {
        setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
        setFilters((prev) => {
            const newFilters = { ...prev, size, page: 1 };
            loadMovements(newFilters);
            return newFilters;
        });
    };

    const onPageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, p_page: page }));
        setFilters((prev) => {
            const newFilters = { ...prev, page };
            loadMovements(newFilters);
            return newFilters;
        });
    };

    const onDateChange = (type: "start" | "end", value: string) => {
        const dateValue = value || null;
        setFilters((prev) => {
            const newFilters = {
                ...prev,
                [type === "start" ? "start_date" : "end_date"]: dateValue,
                page: 1,
            };
            loadMovements(newFilters);
            return newFilters;
        });
    };

    const clearFilters = () => {
        setSearch("");
        const resetFilters: MovementsFilters = {
            page: 1,
            size: 20,
            search: null,
            start_date: null,
            end_date: null,
        };
        setFilters(resetFilters);
        loadMovements(resetFilters);
    };

    const hasActiveFilters =
        filters.start_date !== null ||
        filters.end_date !== null;

    return {
        movements,
        movementsTypes,
        warehouses,
        users,
        loading,
        search,
        pagination,
        isOpenFilterModal,
        filters,
        hasActiveFilters,
        onOpenFilterModal,
        onCloseFilterModal,
        onSearchChange,
        onPageSizeChange,
        onPageChange,
        onDateChange,
        clearFilters,
        onApplyFilterModal,
    };
};



/*
//POSIBLEMENTE SI PIDEN DATOS POR DEFECTO ACÁ SE AGREGAN

const loadInitial = async () => {
        setLoading(true);
        try {
            const dataTypes = await movementsTypesApi();
            const types = movementsTypesAdapter(dataTypes);
            setMovementsTypes(types);

            // Initial load uses default filters
            await loadMovements(filters, true);
        } catch (error: any) {
            console.error("Error loading initial data:", error);
            toast({
                title: "Error",
                description: "No se pudo cargar el inventario inicial",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const loadInventory = async (
        currentFilters: MovementsFilters = filters,
        isInitial: boolean = false,
    ) => {
        try {
            const dataInventory = await getStockMovementsApi(currentFilters);
            const {
                data,
                pagination: newPagination
            } = movementsAdapter(dataInventory);

            setMovements(data);
            setPagination(newPagination);
        } catch (error: any) {
            console.error("Error loading inventory:", error);
            toast({
                title: "Error",
                description: "No se pudo cargar el inventario",
                variant: "destructive",
            });
        }
    };
*/