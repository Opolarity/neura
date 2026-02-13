import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PaginationState } from '@/shared/components/pagination/Pagination';
import { StockType } from '../types/StockTypes.types';
import { GetStockTypes } from '../services/StockTypes.services';
import { StockTypesAdapter } from '../adapters/StockTypes.adapter';
import { useDebounce } from '@/shared/hooks/useDebounce';

export const useStockTypes = () => {
    const { toast } = useToast();
    const [stockTypes, setStockTypes] = useState<StockType[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const loadStockTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await GetStockTypes({
                page: pagination.p_page,
                size: pagination.p_size,
                search: debouncedSearch,
            });
            const { stockTypes: data, pagination: paging } = StockTypesAdapter(response);
            setStockTypes(data);
            setPagination(paging);
        } catch (error) {
            console.error("Error loading stock types:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los tipos de stock",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [pagination.p_page, pagination.p_size, debouncedSearch, toast]);

    useEffect(() => {
        loadStockTypes();
    }, [loadStockTypes]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, p_page: newPage }));
    };

    const handleSizeChange = (newSize: number) => {
        setPagination(prev => ({ ...prev, p_size: newSize, p_page: 1 }));
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPagination(prev => ({ ...prev, p_page: 1 }));
    };

    return {
        stockTypes,
        loading,
        pagination,
        search,
        handlePageChange,
        handleSizeChange,
        handleSearchChange,
        refresh: loadStockTypes
    };
};

export default useStockTypes;
