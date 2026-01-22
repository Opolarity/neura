import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getStockMovementsApi } from "../services/Movements.service";
import { movementsAdapter } from "../adapters/Movements.adapter";
import {
    Movements,
    MovementsFilters,
} from "../types/Movements.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks/useDebounce";

export const useMovements = () => {
    const [movements, setMovements] = useState<Movements[]>([]);
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
        loadMovements();
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

    return {
        movements,
        loading,
        search,
        pagination,
        isOpenFilterModal,
        filters,
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
